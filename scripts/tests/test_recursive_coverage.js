#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { discoverMarkdownFiles, toPosixPath } = require('../lib/content_discovery');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`FAIL: ${message}`);
    return;
  }
  passed++;
  console.log(`PASS: ${message}`);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const root = path.join(process.cwd(), 'out', 'test-fixtures', 'recursive-coverage');
  fs.rmSync(root, { recursive: true, force: true });

  writeFile(path.join(root, 'README.md'), '# Skip me\n');
  writeFile(path.join(root, 'top.md'), '# Top file\n');
  writeFile(path.join(root, 'nested', 'scenes', 'SCENE_ONE.md'), '# Nested scene\n');
  writeFile(path.join(root, 'nested', 'scenes', 'SCENE_ONE_backup_123.md'), '# Backup\n');
  writeFile(path.join(root, 'nested', 'notes.txt'), 'Not markdown\n');

  const { files, coverage } = discoverMarkdownFiles(root);
  const relFiles = files.map(file => toPosixPath(path.relative(root, file))).sort();

  assert(relFiles.includes('top.md'), 'discovers top-level markdown');
  assert(relFiles.includes('nested/scenes/SCENE_ONE.md'), 'discovers nested scene markdown');
  assert(!relFiles.includes('README.md'), 'skips README.md by default');
  assert(!relFiles.includes('nested/scenes/SCENE_ONE_backup_123.md'), 'skips backup markdown');
  assert(coverage.files_seen === 4, 'counts markdown files seen');
  assert(coverage.files_scanned === 2, 'counts markdown files scanned');
  assert(coverage.skipped_files === 2, 'counts skipped markdown files');

  const realStories = discoverMarkdownFiles(path.join(process.cwd(), 'stories'));
  assert(
    realStories.coverage.scanned_files.some(file => file.includes('NOVEL_FORGOTTEN_TIDES/scenes/')),
    'real story discovery includes nested novel scenes'
  );

  fs.rmSync(root, { recursive: true, force: true });

  console.log(`\nRecursive coverage tests: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
