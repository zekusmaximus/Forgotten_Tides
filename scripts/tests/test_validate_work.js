#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseArgs, findWork, validateWork } = require('../validate_work');

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-work-test-'));
  try {
    const scenesDir = path.join(root, 'stories', 'screenplay', 'SAFE_WORK', 'scenes');
    fs.mkdirSync(scenesDir, { recursive: true });
    fs.writeFileSync(path.join(scenesDir, 'SCENE_001.md'), '# Fixture scene\n');
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

test('requires an explicit work directory ID', () => {
  assert.deepStrictEqual(parseArgs(['--work', 'SAFE_WORK']), { work: 'SAFE_WORK' });
  assert.throws(() => parseArgs([]), /Usage:/);
  assert.throws(() => parseArgs(['--work']), /Usage:/);
  assert.throws(() => parseArgs(['--work', 'SAFE_WORK', '--unknown']), /Usage:/);
});

test('passes the work name as one literal argument with no shell', () => fixture(root => {
  const calls = [];
  validateWork({
    root,
    work: 'SAFE_WORK',
    execute: (command, args, options) => calls.push({ command, args, options })
  });
  assert.strictEqual(calls.length, 7);
  for (const call of calls) {
    assert.strictEqual(call.command, process.execPath);
    assert.strictEqual(call.args[1], '--work');
    assert.strictEqual(call.args[2], 'SAFE_WORK');
    assert.strictEqual(call.args[3], '--json');
    assert.strictEqual(call.options.cwd, root);
    assert.strictEqual(call.options.shell, undefined);
  }
}));

test('passes shell metacharacters literally when they are part of an existing work name', () => fixture(root => {
  const work = 'WORK; touch SHOULD_NOT_EXIST #';
  const scenesDir = path.join(root, 'stories', 'screenplay', work, 'scenes');
  fs.mkdirSync(scenesDir, { recursive: true });
  fs.writeFileSync(path.join(scenesDir, 'SCENE_002.md'), '# Fixture scene\n');
  const argsSeen = [];
  validateWork({ root, work, execute: (_command, args) => argsSeen.push(args) });
  assert.strictEqual(argsSeen.length, 7);
  assert(argsSeen.every(args => args[2] === work));
  assert.strictEqual(fs.existsSync(path.join(root, 'SHOULD_NOT_EXIST')), false);
}));

test('rejects traversal and missing work before running checks', () => fixture(root => {
  const marker = path.join(root, 'SHOULD_NOT_EXIST');
  let ran = false;
  const execute = () => { ran = true; };
  for (const work of [
    `SAFE_WORK; touch ${marker} #`,
    'SAFE_WORK$(touch SHOULD_NOT_EXIST)',
    'SAFE_WORK`touch SHOULD_NOT_EXIST`',
    '../SAFE_WORK',
    '..\\SAFE_WORK',
    'DOES_NOT_EXIST'
  ]) {
    assert.throws(() => validateWork({ root, work, execute }), /Invalid work|not found/i);
  }
  assert.strictEqual(ran, false);
  assert.strictEqual(fs.existsSync(marker), false);
}));

test('does not validate a work that contains only backups', () => fixture(root => {
  const scenesDir = path.join(root, 'stories', 'novella', 'BACKUP_ONLY', 'scenes');
  fs.mkdirSync(scenesDir, { recursive: true });
  fs.writeFileSync(path.join(scenesDir, 'SCENE_001_backup_1.md'), '# Backup\n');
  assert.throws(() => findWork(root, 'BACKUP_ONLY'), /no live scene files/);
}));
