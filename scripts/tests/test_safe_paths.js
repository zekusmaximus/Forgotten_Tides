#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validatePathSegment, resolveWithin } = require('../lib/path_safety');
const { writeJsonReport, writeMarkdownReport } = require('../lib/reporters');
const { validateFile } = require('../lint/schema_validate');

const SCRIPT_ROOT = path.join(__dirname, '..');

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-safe-paths-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-safe-paths-outside-'));
  try {
    fs.mkdirSync(path.join(root, 'stories', 'novella'), { recursive: true });
    fs.writeFileSync(path.join(outside, 'marker.txt'), 'outside bytes\n');
    run({ root, outside });
    assert.equal(fs.readFileSync(path.join(outside, 'marker.txt'), 'utf8'), 'outside bytes\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
}

function run(root, script, args, input = '') {
  const result = spawnSync(process.execPath, [path.join(SCRIPT_ROOT, script), ...args], {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 10000
  });
  if (result.error) throw result.error;
  return result;
}

function assertRejected(result, label) {
  assert.notEqual(result.status, 0, `${label} unexpectedly succeeded: ${result.stdout}`);
  assert.match(result.stderr, /invalid|unsafe|symlink|not found|error|work/i, `${label} lacked an error`);
}

function createExistingWork(root, id = 'SAFE_WORK', kind = 'novella') {
  const work = path.join(root, 'stories', kind, id);
  fs.mkdirSync(path.join(work, 'scenes'), { recursive: true });
  fs.writeFileSync(path.join(work, 'meta.yaml'), 'id: SAFE_WORK\nstatus: draft\n');
  fs.writeFileSync(path.join(work, 'manuscript.md'), '---\nid: SAFE_WORK\nscenes: []\n---\n\nBody stays.\n');
  fs.writeFileSync(path.join(work, 'outline.md'), '---\nid: SAFE_WORK_OUTLINE\n---\n\nOutline stays.\n');
  return work;
}

function test(name, runTest) {
  try {
    runTest();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

test('path helper rejects traversal, drive paths, separators, and symlinked parents', () => fixture(({ root, outside }) => {
  for (const value of ['.', '..', '../outside', '..\\outside', '/tmp/elsewhere', 'C:\\elsewhere', '\\\\server\\share', 'bad\0name']) {
    assert.throws(() => validatePathSegment(value, 'work ID'), /Invalid work ID/);
  }
  const link = path.join(root, 'stories', 'novella', 'LINKED');
  fs.symlinkSync(outside, link, 'junction');
  assert.throws(() => resolveWithin(root, 'stories', 'novella', 'LINKED', 'meta.yaml'), /Unsafe symlink/);
}));

test('repeat start_work preserves all bytes in the existing work', () => fixture(({ root }) => {
  const args = ['--intent', 'start_work', '--work', 'NOVELLA_FIXTURE', '--kind', 'novella', '--title', 'Fixture'];
  const first = run(root, 'prompt/authoring.js', args);
  assert.equal(first.status, 0, first.stderr);
  const work = path.join(root, 'stories', 'novella', 'NOVELLA_FIXTURE');
  const files = ['meta.yaml', 'manuscript.md', 'outline.md'];
  assert.equal(validateFile(path.join(work, 'manuscript.md'), null, { required: true }).valid, true);
  const before = new Map(files.map(file => [file, fs.readFileSync(path.join(work, file))]));
  const second = run(root, 'prompt/authoring.js', args);
  assertRejected(second, 'repeat start_work');
  for (const file of files) assert.deepEqual(fs.readFileSync(path.join(work, file)), before.get(file), `${file} changed`);
}));

test('new work remains schema-valid after scene and outline edits', () => fixture(({ root }) => {
  const created = run(root, 'prompt/authoring.js', [
    '--intent', 'start_work', '--work', 'NOVEL_FIXTURE', '--kind', 'novel', '--title', 'Fixture'
  ]);
  assert.equal(created.status, 0, created.stderr);
  const work = path.join(root, 'stories', 'novel', 'NOVEL_FIXTURE');
  const manuscript = path.join(work, 'manuscript.md');
  assert.equal(validateFile(manuscript, null, { required: true }).valid, true);
  assert.equal(validateFile(path.join(work, 'meta.yaml'), null, { required: true }).valid, true);

  const scene = run(root, 'prompt/authoring.js', [
    '--intent', 'save_scene', '--work', 'NOVEL_FIXTURE', '--kind', 'novel', '--scene', 'Opening', '--order', '1'
  ], 'First scene body.\n');
  assert.equal(scene.status, 0, scene.stderr);
  assert.equal(validateFile(manuscript, null, { required: true }).valid, true);
  const sceneFiles = fs.readdirSync(path.join(work, 'scenes'));
  assert.equal(sceneFiles.length, 1);
  assert.equal(validateFile(path.join(work, 'scenes', sceneFiles[0]), null, { required: true }).valid, true);

  const replacement = run(root, 'prompt/authoring.js', [
    '--intent', 'replace_scene', '--work', 'NOVEL_FIXTURE', '--kind', 'novel', '--scene', 'Opening'
  ], 'Replaced scene body.\n');
  assert.equal(replacement.status, 0, replacement.stderr);
  assert.equal(fs.readdirSync(path.join(work, 'scenes')).length, 1);
  assert.equal(fs.readdirSync(path.join(work, '.backups', 'scenes')).length, 1);

  const replacedById = run(root, 'prompt/authoring.js', [
    '--intent', 'replace_scene', '--work', 'NOVEL_FIXTURE', '--kind', 'novel', '--scene', JSON.parse(scene.stdout).scene_id
  ], 'Replaced again by ID.\n');
  assert.equal(replacedById.status, 0, replacedById.stderr);
  assert.equal(fs.readdirSync(path.join(work, 'scenes')).length, 1);
  assert.equal(fs.readdirSync(path.join(work, '.backups', 'scenes')).length, 2);

  const outline = run(root, 'prompt/authoring.js', [
    '--intent', 'update_outline', '--work', 'NOVEL_FIXTURE', '--kind', 'novel', '--outline', 'yes'
  ], 'Updated outline.\n');
  assert.equal(outline.status, 0, outline.stderr);
  assert.match(fs.readFileSync(path.join(work, 'outline.md'), 'utf8'), /Updated outline/);
}));

test('new screenplay work has a valid story manuscript and safe directory', () => fixture(({ root }) => {
  const created = run(root, 'prompt/authoring.js', [
    '--intent', 'start_work', '--work', 'SCREENPLAY_FIXTURE', '--kind', 'screenplay', '--title', 'Fixture'
  ]);
  assert.equal(created.status, 0, created.stderr);
  const manuscript = path.join(root, 'stories', 'screenplay', 'SCREENPLAY_FIXTURE', 'manuscript.md');
  assert.equal(validateFile(manuscript, null, { required: true }).valid, true);
}));

test('malformed existing metadata is preserved on authoring failure', () => fixture(({ root }) => {
  const work = createExistingWork(root);
  const metaPath = path.join(work, 'meta.yaml');
  fs.writeFileSync(metaPath, 'broken: [unterminated\n');
  const original = fs.readFileSync(metaPath);
  const scene = run(root, 'prompt/authoring.js', [
    '--intent', 'save_scene', '--work', 'SAFE_WORK', '--kind', 'novella', '--scene', 'Scene', '--order', '1'
  ], 'Body.\n');
  assertRejected(scene, 'malformed metadata');
  assert.deepEqual(fs.readFileSync(metaPath), original);
  assert.deepEqual(fs.readdirSync(path.join(work, 'scenes')), []);
}));

test('authoring write intents reject traversal and symlinked work paths', () => fixture(({ root, outside }) => {
  const work = createExistingWork(root);
  const outlineBefore = fs.readFileSync(path.join(work, 'outline.md'));
  const manuscriptBefore = fs.readFileSync(path.join(work, 'manuscript.md'));
  fs.symlinkSync(outside, path.join(root, 'stories', 'novella', 'LINKED'), 'junction');
  for (const workId of ['../outside', '..\\outside', 'LINKED']) {
    assertRejected(run(root, 'prompt/authoring.js', [
      '--intent', 'update_outline', '--work', workId, '--kind', 'novella', '--outline', 'yes'
    ], 'replacement outline\n'), `update_outline ${workId}`);
    assertRejected(run(root, 'prompt/authoring.js', [
      '--intent', 'save_scene', '--work', workId, '--kind', 'novella', '--scene', 'A scene', '--order', '1'
    ], 'scene body\n'), `save_scene ${workId}`);
  }
  assert.deepEqual(fs.readFileSync(path.join(work, 'outline.md')), outlineBefore);
  assert.deepEqual(fs.readFileSync(path.join(work, 'manuscript.md')), manuscriptBefore);
  assert.deepEqual(fs.readdirSync(path.join(work, 'scenes')), []);
}));

test('start_draft rejects traversal and symlinked work paths', () => fixture(({ root, outside }) => {
  fs.symlinkSync(outside, path.join(root, 'stories', 'novella', 'LINKED'), 'junction');
  for (const workId of ['../outside', '..\\outside', 'LINKED']) {
    assertRejected(run(root, 'prompt/start_draft.js', ['--work', workId, '--mode', 'strict']), `start_draft ${workId}`);
  }
  assert.deepEqual(fs.readdirSync(outside), ['marker.txt']);
}));

test('compilers reject traversal and output symlinks before writing', () => fixture(({ root, outside }) => {
  const screenplay = createExistingWork(root, 'SAFE_SCREENPLAY', 'screenplay');
  fs.writeFileSync(path.join(screenplay, 'scenes', 'SCENE_001.md'), '---\nid: SCENE_001\ntitle: Fixture\n---\n\nScene body.\n');
  assertRejected(run(root, 'compile_screenplay.js', ['--work', '../outside']), 'screenplay traversal');
  assertRejected(run(root, 'compile_edit_packet.js', ['--work', '../outside']), 'edit packet traversal');
  fs.mkdirSync(path.join(root, 'out'));
  fs.symlinkSync(outside, path.join(root, 'out', 'compiled'), 'junction');
  assertRejected(run(root, 'compile_screenplay.js', ['--work', 'SAFE_SCREENPLAY']), 'screenplay output symlink');
  assertRejected(run(root, 'compile_edit_packet.js', ['--work', 'SAFE_SCREENPLAY']), 'edit packet output symlink');
  assert.deepEqual(fs.readdirSync(outside), ['marker.txt']);
}));

test('report writer rejects unsafe names and symlinked report directory', () => fixture(({ root, outside }) => {
  const original = process.cwd();
  try {
    process.chdir(root);
    for (const name of ['../escaped.json', '..\\escaped.json', '/tmp/escaped.json']) {
      assert.throws(() => writeJsonReport(name, {}), /Invalid path segment/);
    }
    fs.mkdirSync(path.join(root, 'out'));
    fs.symlinkSync(outside, path.join(root, 'out', 'reports'), 'junction');
    assert.throws(() => writeMarkdownReport('safe.md', ['safe']), /Unsafe symlink/);
  } finally {
    process.chdir(original);
  }
  assert.deepEqual(fs.readdirSync(outside), ['marker.txt']);
}));
