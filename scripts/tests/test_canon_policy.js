#!/usr/bin/env node
const assert = require('assert');
const {
  inferCanonTier,
  describePolicy,
  shouldInclude
} = require('../lib/canon_policy');

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

test('canonical mechanics rank high', () => {
  const policy = describePolicy({ type: 'mechanics', summary_50: 'Core rule' }, 'mechanics/MEMORY_PHYSICS.md', 'mechanics');
  assert.strictEqual(policy.canon_tier, 'primary_canon');
  assert(policy.source_weight >= 100);
});

test('canonical characters rank high', () => {
  const policy = describePolicy({ type: 'character', summary_50: 'Pilot' }, 'characters/Rell.md', 'character');
  assert.strictEqual(policy.canon_tier, 'primary_canon');
  assert(policy.source_weight >= 100);
});

test('test and sample paths rank low', () => {
  assert.strictEqual(inferCanonTier({}, 'stories/novella/NOVELLA_TEST/manuscript.md'), 'test');
  assert.strictEqual(inferCanonTier({}, 'stories/screenplay/SCREENPLAY_SAMPLE/manuscript.md'), 'test');
  assert.strictEqual(inferCanonTier({}, 'stories/foo/SCENE_backup_123.md'), 'test');
});

test('sandbox paths are excluded by default', () => {
  const policy = describePolicy({}, 'sandbox/experiment.md', 'story');
  assert.strictEqual(policy.canon_tier, 'sandbox');
  assert.strictEqual(shouldInclude(policy, {}), false);
  assert.strictEqual(shouldInclude(policy, { includeSandbox: true }), true);
});

test('explicit canon_tier overrides path inference', () => {
  const policy = describePolicy({ canon_tier: 'working_canon' }, 'stories/novella/NOVELLA_TEST/manuscript.md', 'story');
  assert.strictEqual(policy.canon_tier, 'working_canon');
  assert.strictEqual(shouldInclude(policy, {}), true);
});

test('canon-only excludes draft material', () => {
  const policy = describePolicy({}, 'stories/novel/NOVEL_FORGOTTEN_TIDES/manuscript.md', 'story');
  assert.strictEqual(policy.canon_tier, 'draft');
  assert.strictEqual(shouldInclude(policy, { canonOnly: true }), false);
});
