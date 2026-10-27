#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildLinkMap } = require('../prompt/build_linkmap');

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function entity(id) {
  return `---\nid: ${id}\ntype: character\nname: Fixture\n---\n\n# Fixture\n`;
}

async function withFixture(test) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'linkmap-ids-test-'));
  try {
    await test(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assertNoArtifacts(root) {
  for (const relativePath of [
    'out/graphs',
    'docs/link_map',
    'REFERENCE_MAP.json',
    'CANONICAL_INDEX.md'
  ]) {
    assert(!fs.existsSync(path.join(root, relativePath)), `${relativePath} was written before ID validation`);
  }
}

async function main() {
  await withFixture(async root => {
    write(root, 'characters/One.md', entity('char-0001'));
    write(root, 'characters/Two.md', entity('char-0001'));
    await assert.rejects(buildLinkMap({ repoRoot: root }), /Duplicate canonical_id char-0001/);
    assertNoArtifacts(root);
  });

  await withFixture(async root => {
    write(root, 'characters/One.md', entity('CHAR-0001'));
    write(root, 'characters/Two.md', entity('char-0001'));
    await assert.rejects(buildLinkMap({ repoRoot: root }), /Duplicate canonical_id char-0001/);
    assertNoArtifacts(root);
  });

  await withFixture(async root => {
    write(root, 'stories/novella/WORK/scenes/SCENE_001.md', entity('SCENE_001'));
    const result = await buildLinkMap({ repoRoot: root });
    assert.strictEqual(result.entityCount, 1);
    const map = JSON.parse(fs.readFileSync(path.join(root, 'REFERENCE_MAP.json'), 'utf8'));
    assert.deepStrictEqual(map.nodes.map(node => node.canonical_id), ['scene_001']);
  });

  await withFixture(async root => {
    write(root, 'characters/Unsafe.md', entity('__proto__'));
    await assert.rejects(buildLinkMap({ repoRoot: root }), /Invalid canonical_id "__proto__"/);
    assertNoArtifacts(root);
  });

  await withFixture(async root => {
    write(root, 'characters/One.md', entity('char-0001'));
    write(root, 'Duplicate.md', entity('char-0001'));
    await assert.rejects(buildLinkMap({ repoRoot: root }), /Duplicate canonical_id char-0001/);
    assertNoArtifacts(root);
  });

  await withFixture(async root => {
    write(root, 'data/lexicon/terms.yaml', `terms:\n  - id: term-0001\n    term: First\n  - id: term-0001\n    term: Second\n`);
    await assert.rejects(buildLinkMap({ repoRoot: root }), /Duplicate canonical_id term-0001/);
    assertNoArtifacts(root);
  });

  await withFixture(async root => {
    write(root, 'characters/One.md', entity('char-0001'));
    write(root, 'data/lexicon/terms.yaml', `terms:\n  - id: term-0001\n    term: First\n`);
    const preflight = await buildLinkMap({ repoRoot: root, dryRun: true });
    assert.strictEqual(preflight.entityCount, 2);
    assertNoArtifacts(root);
    const result = await buildLinkMap({ repoRoot: root });
    assert.strictEqual(result.entityCount, 2);
    const map = JSON.parse(fs.readFileSync(path.join(root, 'REFERENCE_MAP.json'), 'utf8'));
    assert.deepStrictEqual(map.nodes.map(node => node.canonical_id), ['char-0001', 'term-0001']);
  });

  for (const [relativePath, content] of [
    ['characters/Broken.md', '---\nid: [unterminated\n---\n'],
    ['characters/Broken.md', '---\nid: char-0002\n'],
    ['characters/Broken.yaml', 'id: [unterminated\n'],
    ['characters/Broken.json', '{"id":']
  ]) {
    await withFixture(async root => {
      write(root, 'characters/One.md', entity('char-0001'));
      write(root, relativePath, content);
      await assert.rejects(buildLinkMap({ repoRoot: root }), /Could not parse .*Broken\./);
      assertNoArtifacts(root);
    });
  }

  console.log('Link-map ID tests passed.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
