#!/usr/bin/env node
/**
 * Behavior tests for scripts/lint/redline_citation_linter.js.
 *
 * Builds three fixture repositories in temporary directories and runs the
 * linter against each with --root, so no real manuscript is touched:
 *   1. a primary-canon story that names a locked element in prose with no
 *      citation -> error, exit 1
 *   2. the same manuscript as a draft -> warning, exit 0
 *   3. the same prose with bible_refs -> pass, no finding
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const linter = require('../lint/redline_citation_linter');

const LINTER_PATH = path.join(__dirname, '..', 'lint', 'redline_citation_linter.js');
const MANUSCRIPT_REL = 'stories/short_story/fixture_redline_story/manuscript.md';

function manuscript({ tier, bibleRefs }) {
  const refs = bibleRefs
    ? 'bible_refs:\n  - bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#41-the-lattice-gap\n'
    : '';
  return `---
id: story-9902
type: story
title: Fixture Redline Story
story_type: short-story
status: ${tier === 'primary_canon' ? 'canonical' : 'draft'}
canon_tier: ${tier}
cross_refs:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
continuity_notes:
  - Story-local setting; no shared entities are introduced.
${refs}metadata:
  status: ${tier === 'primary_canon' ? 'canonical' : 'draft'}
---

# Fixture Redline Story

An ordinary opening paragraph with no locked elements.

The pilot had never crossed the Lattice Gap, and said so.
`;
}

function write(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function withFixture(content, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redline-linter-test-'));
  try {
    write(root, MANUSCRIPT_REL, content);
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runLinter(root) {
  const result = spawnSync(process.execPath, [LINTER_PATH, '--root', root], { encoding: 'utf8' });
  const findings = result.stdout
    .split(/\r?\n/)
    .filter(line => line.startsWith('{'))
    .map(line => JSON.parse(line));
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, findings };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

test('argument parsing defaults to the repository root and accepts --root', () => {
  assert.strictEqual(linter.parseArgs([]).root, linter.DEFAULT_ROOT);
  assert.strictEqual(linter.parseArgs(['--root', '/tmp/x']).root, path.resolve('/tmp/x'));
  assert.strictEqual(linter.parseArgs(['--root=/tmp/y']).root, path.resolve('/tmp/y'));
  assert.throws(() => linter.parseArgs(['--bogus']), /Unknown argument/);
  assert(fs.existsSync(path.join(linter.DEFAULT_ROOT, 'package.json')), 'DEFAULT_ROOT contains package.json');
});

test('prose scan reports the pattern and the file line of the first hit', () => {
  const raw = manuscript({ tier: 'draft', bibleRefs: false });
  const content = raw.slice(raw.indexOf('\n---\n') + '\n---\n'.length);
  const hits = linter.findLockedProse(raw, content);
  assert.strictEqual(hits.length, 1, 'exactly one pattern matches');
  assert.strictEqual(hits[0].pattern, String(/\bLattice Gap\b/));
  const expectedLine = raw.split('\n').findIndex(line => line.includes('Lattice Gap')) + 1;
  assert.strictEqual(hits[0].line, expectedLine, 'line number is the file line, after the frontmatter');
  assert.deepStrictEqual(linter.findLockedProse(raw, 'A Tariff on Rellis cargo.'), [], 'whole-word crew names do not match longer words');
});

test('prose hit with no citation on a primary-canon story is an error (exit 1)', () => {
  withFixture(manuscript({ tier: 'primary_canon', bibleRefs: false }), root => {
    const run = runLinter(root);
    assert.strictEqual(run.status, 1, `exit code 1; stdout was:\n${run.stdout}${run.stderr}`);
    assert.strictEqual(run.findings.length, 1);
    assert.strictEqual(run.findings[0].level, 'error');
    assert.strictEqual(run.findings[0].id, 'story-9902');
    assert.strictEqual(run.findings[0].file, MANUSCRIPT_REL);
    assert(/Lattice Gap/.test(run.findings[0].matched), 'names the matched pattern');
    assert(/line \d+/.test(run.findings[0].matched), 'names the first matching line');
  });
});

test('prose hit with no citation on a draft is a warning (exit 0)', () => {
  withFixture(manuscript({ tier: 'draft', bibleRefs: false }), root => {
    const run = runLinter(root);
    assert.strictEqual(run.status, 0, `exit code 0; stdout was:\n${run.stdout}${run.stderr}`);
    assert.strictEqual(run.findings.length, 1);
    assert.strictEqual(run.findings[0].level, 'warn');
    assert.strictEqual(run.findings[0].canon_tier, 'draft');
  });
});

test('prose hit with bible_refs passes', () => {
  withFixture(manuscript({ tier: 'primary_canon', bibleRefs: true }), root => {
    const run = runLinter(root);
    assert.strictEqual(run.status, 0, `exit code 0; stdout was:\n${run.stdout}${run.stderr}`);
    assert.deepStrictEqual(run.findings, [], 'no findings');
    assert(/✅ All 1 stories/.test(run.stdout), 'counts the cited story as checked');
  });
});

test('a frontmatter locked id without citation stays an error even on a draft', () => {
  const draft = manuscript({ tier: 'draft', bibleRefs: false })
    .replace('  locations: []', '  locations:\n    - loc-0003')
    .replace('The pilot had never crossed the Lattice Gap, and said so.', 'No locked prose here.');
  withFixture(draft, root => {
    const run = runLinter(root);
    assert.strictEqual(run.status, 1, `exit code 1; stdout was:\n${run.stdout}${run.stderr}`);
    assert.strictEqual(run.findings[0].level, 'error');
    assert.strictEqual(run.findings[0].matched, 'frontmatter ids');
  });
});

test('the originating story is exempt', () => {
  const origin = manuscript({ tier: 'primary_canon', bibleRefs: false }).replace('id: story-9902', 'id: story-0001');
  withFixture(origin, root => {
    const run = runLinter(root);
    assert.strictEqual(run.status, 0);
    assert.deepStrictEqual(run.findings, []);
  });
});

if (process.exitCode) {
  console.error('\nRed-line linter tests: FAILED');
} else {
  console.log('\nRed-line linter tests: all passed');
}
