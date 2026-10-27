#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadGlossaryTerms, checkStoriesDirectory, writeGlossaryReport } = require('../lint/glossary_enforcer');

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-glossary-coverage-'));
try {
  write(root, 'data/lexicon/terms.yaml', 'terms:\n  - term: Known Signal\n');
  write(root, 'stories/README.md', '# Story Index\n\nKnown Signal is listed.\n');
  write(root, 'stories/novella/WORK/manuscript.md',
    '---\nid: story-0001\ntitle: Fixture Work\n---\n\nThe Crystal Window opens.\n');
  write(root, 'stories/screenplay/WORK/scenes/SCENE_001.md',
    '---\nid: scene_001\n---\n\nA Silver Channel appears.\n');
  write(root, 'stories/novella/WORK/scenes/SCENE_backup_1.md', 'The Hidden Term appears.\n');
  write(root, 'stories/novella/WORK/.backups/scenes/OLD.md', 'The Forgotten Term appears.\n');

  const { terms, termMap } = loadGlossaryTerms(root);
  const emitted = [];
  const result = checkStoriesDirectory(terms, new Set(), termMap, {
    root,
    warningLimit: 1,
    emit: entry => emitted.push(entry)
  });

  assert.equal(result.hasWarnings, true);
  assert.deepEqual(result.coverage, {
    files_seen: 4,
    files_scanned: 3,
    files_skipped: 1,
    skipped_directories: 1,
    warnings: 2
  });
  assert.deepEqual(result.warnings.map(warning => [warning.file, warning.term]), [
    ['stories/novella/WORK/manuscript.md', 'The Crystal Window'],
    ['stories/screenplay/WORK/scenes/SCENE_001.md', 'Silver Channel']
  ]);
  assert(emitted.some(entry => entry.file?.endsWith('SCENE_backup_1.md') && entry.status === 'skipped'));
  assert(emitted.some(entry => entry.coverage?.files_scanned === 3));
  assert.equal(emitted.filter(entry => entry.level === 'warn' && entry.term).length, 1);
  assert.equal(result.warningsOmitted, 1);
  const reportPath = writeGlossaryReport(result, root);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.equal(report.coverage.warnings, 2);
  assert.equal(report.warnings.length, 2, 'complete findings must remain available in the report');
  assert.deepEqual(report.skipped, [{ file: 'stories/novella/WORK/scenes/SCENE_backup_1.md', reason: 'backup' }]);
  console.log('Glossary traversal scans nested manuscripts and scenes with accurate coverage.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
