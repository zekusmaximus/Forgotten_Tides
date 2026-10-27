#!/usr/bin/env node
const assert = require('assert');
const { pack, parseArgs } = require('../prompt/export_prompt_pack');
const { applyOrderingAndCapping } = require('../prompt/context_builder');

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

test('canon-only with include-drafts admits active drafts but still excludes test scenes', () => {
  const { ids, options } = parseArgs([
    '--canon-only', '--include-drafts',
    'scene_541938a8fd6140a456619c4030b828ccc5ac4298',
    'scene_screenplay_sample_001', 'char-0001'
  ]);
  const payload = pack(ids, options);
  const included = payload.entries.map(entry => entry.id);
  assert(included.includes('char-0001'));
  assert(included.includes('scene_541938a8fd6140a456619c4030b828ccc5ac4298'));
  assert(!included.includes('scene_screenplay_sample_001'));
  assert(payload.entries.find(entry => entry.canon_tier === 'draft').source_weight <
    payload.entries.find(entry => entry.canon_tier === 'primary_canon').source_weight);
});

test('directly resolved event keeps priority over an expanded event of equal quality', () => {
  const entities = {
    'event-story-0022-002': { type: 'event', source_weight: 105 },
    'event-story-0008-004': { type: 'event', source_weight: 105 }
  };
  const order = applyOrderingAndCapping(
    ['event-story-0022-002'],
    [{ id: 'event-story-0008-004', reason: 'prerequisite' }],
    'default', 1, entities
  );
  assert.deepStrictEqual(order, ['event-story-0022-002']);
  assert.deepStrictEqual(applyOrderingAndCapping(
    ['event-story-0002-001', 'event-story-0022-002'], [],
    'default', 1, entities
  ), ['event-story-0022-002'], 'filtered event IDs do not occupy context slots');
});
