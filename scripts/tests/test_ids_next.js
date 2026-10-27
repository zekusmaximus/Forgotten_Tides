#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { nextId } = require('../ids_next');

function withFixture(files, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ids-next-test-'));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const target = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    check(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

withFixture({
  'CANONICAL_INDEX.md': '# Index\n- `story-0001` — One (`stories/one/manuscript.md`)\n',
  'stories/two/manuscript.md': '---\nid: story-0002\ntype: story\n---\n\nBody.\n'
}, root => {
  assert.equal(nextId(root, 'story'), 'story-0003', 'a partly stale index must not reissue a source ID');
});

withFixture({
  'CANONICAL_INDEX.md': '# Index\n- `story-0012` — Twelve (`stories/twelve/manuscript.md`)\n',
  'stories/two/manuscript.md': '---\nid: story-0002\ntype: story\n---\n\nBody.\n'
}, root => {
  assert.equal(nextId(root, 'story'), 'story-0013', 'an index ID higher than source remains reserved');
});

withFixture({
  'data/lexicon/terms.yaml': 'terms:\n  - id: term-0042\n    term: Fixture\n'
}, root => {
  assert.equal(nextId(root, 'term'), 'term-0043', 'term IDs nested in terms.yaml must be reserved');
});

withFixture({
  'stories/invalid/manuscript.md': '---\nid: [unterminated\n---\n'
}, root => {
  assert.throws(() => nextId(root, 'story'), /Could not parse .*manuscript\.md/,
    'malformed source must not cause an ID to be issued from incomplete data');
});

withFixture({
  'stories/invalid/manuscript.md': '---\nid: story-0009\nno closing delimiter\n'
}, root => {
  assert.throws(() => nextId(root, 'story'), /missing frontmatter closing delimiter/);
});

withFixture({
  'stories/later/manuscript.md': '---\nid: story-10000\ntype: story\n---\n'
}, root => {
  assert.equal(nextId(root, 'story'), 'story-10001', 'IDs keep increasing beyond four digits');
});

console.log('Next-ID source and index tests passed.');
