#!/usr/bin/env node
const assert = require('assert');
const { pack } = require('../prompt/export_prompt_pack');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test('default prompt packs exclude test/sample material', () => {
  const payload = pack(['char-0001', 'novella_test', 'scene_screenplay_sample_001']);
  const ids = payload.entries.map(e => e.id);
  assert(ids.includes('char-0001'));
  assert(!ids.includes('novella_test'));
  assert(!ids.includes('scene_screenplay_sample_001'));
});

test('include-test admits test material with low provenance', () => {
  const payload = pack(['novella_test', 'scene_screenplay_sample_001'], { includeTest: true });
  assert(payload.entries.length >= 1);
  assert(payload.entries.every(e => e.canon_tier === 'test'));
  assert(payload.entries.every(e => e.source_weight <= 20));
  assert(payload.entries.every(e => e.provenance.includes('tier=test')));
});

test('high-signal canon sorts ahead of drafts', () => {
  const payload = pack(['scene_541938a8fd6140a456619c4030b828ccc5ac4298', 'char-0001']);
  assert.strictEqual(payload.entries[0].id, 'char-0001');
  assert(payload.entries[0].source_weight > payload.entries[1].source_weight);
});

test('canon-only excludes draft scenes', () => {
  const payload = pack(['scene_541938a8fd6140a456619c4030b828ccc5ac4298', 'char-0001'], { canonOnly: true });
  const ids = payload.entries.map(e => e.id);
  assert(ids.includes('char-0001'));
  assert(!ids.includes('scene_541938a8fd6140a456619c4030b828ccc5ac4298'));
});
