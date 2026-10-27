#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildCompilation } = require('../compile_stories');

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-compile-stories-'));
  try { run(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function test(name, run) {
  try {
    run();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

test('compiles only manuscripts and expands each declared or inline scene once in stable order', () => fixture(root => {
  write(root, 'stories/screenplay/Z_WORK/manuscript.md', '# Screenplay work\n\nScreenplay publishable text.\n');
  write(root, 'stories/short_story/A_WORK/manuscript.md',
    '---\ntitle: First work\nscenes:\n  - file: scenes\\B.md\n  - scenes/A.md\n  - scenes\\B.md\n---\n\n# First work\n\nOpening.\n\n<!-- include: scenes/B.md -->\n\nMiddle.\n\n<!-- Scene: A -->\n\n<!-- include: scenes/B.md -->\n\nEnding.\n');
  write(root, 'stories/short_story/A_WORK/scenes/A.md', '---\nid: a\n---\n\nScene A publishable.\n');
  write(root, 'stories/short_story/A_WORK/scenes/B.md', '---\nid: b\n---\n\nScene B publishable.\n');
  write(root, 'stories/short_story/A_WORK/scenes/B_backup_old.md', 'Backup text must stay out.\n');
  write(root, 'stories/short_story/A_WORK/outline.md', 'Outline text must stay out.\n');
  write(root, 'stories/short_story/A_WORK/notes.md', 'Note text must stay out.\n');
  write(root, 'stories/short_story/A_WORK/scenes/README.md', 'Scene instructions must stay out.\n');
  write(root, 'stories/novella/NOVELLA_TEST/manuscript.md',
    '# Fixture work\n\n<!-- include: scenes/MISSING.md -->\n');
  write(root, 'stories/screenplay/SCREENPLAY_SAMPLE/manuscript.md', 'Sample text must stay out.\n');

  const output = buildCompilation(root);
  assert(output.indexOf('Screenplay work') < output.indexOf('First work'));
  assert(output.indexOf('Scene B publishable.') < output.indexOf('Scene A publishable.'));
  assert.equal(count(output, 'Scene A publishable.'), 1);
  assert.equal(count(output, 'Scene B publishable.'), 1);
  assert.equal(count(output, 'Screenplay publishable text.'), 1);
  for (const excluded of ['Backup text', 'Outline text', 'Note text', 'Scene instructions',
    'Fixture work', 'Sample text', 'id: a', 'scenes:']) {
    assert(!output.includes(excluded), `unexpected output: ${excluded}`);
  }
  assert.equal(output, buildCompilation(root));

  const cliOutput = execFileSync(process.execPath,
    [path.resolve(__dirname, '../compile_stories.js'), '--root', root], { encoding: 'utf8' });
  assert.equal(cliOutput, output);
}));

test('includes declared scenes that have no inline directive, and expands an all-scenes directive', () => fixture(root => {
  write(root, 'stories/novella/DECLARED/manuscript.md',
    '---\ntitle: Declared\ninclude:\n  - scenes/C.md\n  - scenes/A.md\n---\n\n# Declared\n');
  write(root, 'stories/novella/DECLARED/scenes/A.md', 'Scene A text.\n');
  write(root, 'stories/novella/DECLARED/scenes/C.md', 'Scene C text.\n');
  write(root, 'stories/novel/ALL/manuscript.md', '# All\n\n<!-- include: scenes -->\n');
  write(root, 'stories/novel/ALL/scenes/B.md', 'Scene B text.\n');
  write(root, 'stories/novel/ALL/scenes/A.md', 'Scene A all text.\n');
  write(root, 'stories/novel/ALL/scenes/A_backup_old.md', 'Old draft text.\n');

  const output = buildCompilation(root);
  assert(output.indexOf('Scene A all text.') < output.indexOf('Scene B text.'));
  assert(output.indexOf('Scene C text.') < output.indexOf('Scene A text.'));
  assert.equal(count(output, 'Scene C text.'), 1);
  assert(!output.includes('Old draft text.'));
}));

test('fails on missing, unsafe, and backup scene references', () => fixture(root => {
  const manuscript = 'stories/short_story/WORK/manuscript.md';
  write(root, manuscript, '# Work\n\n<!-- include: scenes/MISSING.md -->\n');
  assert.throws(() => buildCompilation(root), /does not exist: scenes\/MISSING.md/);

  write(root, manuscript, '# Work\n\n<!-- include: ..\\secret.md -->\n');
  assert.throws(() => buildCompilation(root), /Invalid scene reference/);

  write(root, manuscript, '# Work\n\n<!-- include: scenes/A_backup_old.md -->\n');
  write(root, 'stories/short_story/WORK/scenes/A_backup_old.md', 'Old text.\n');
  assert.throws(() => buildCompilation(root), /Invalid scene reference/);
}));

test('requires at least one manuscript', () => fixture(root => {
  write(root, 'stories/short_story/WORK/outline.md', '# Outline\n');
  assert.throws(() => buildCompilation(root), /No manuscripts found/);
}));
