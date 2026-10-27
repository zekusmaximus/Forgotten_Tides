#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildLinkMap } = require('../prompt/build_linkmap');

const authoringScript = path.join(__dirname, '..', 'prompt', 'authoring.js');

function author(root, args, input = '') {
  const result = spawnSync(process.execPath, [authoringScript, ...args], {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 10000
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-author-linkmap-'));
  try {
    fs.mkdirSync(path.join(root, 'stories', 'novella'), { recursive: true });
    const created = author(root, [
      '--intent', 'start_work', '--work', 'NOVELLA_FIXTURE', '--kind', 'novella', '--title', 'Fixture'
    ]);
    const scene = author(root, [
      '--intent', 'save_scene', '--work', created.work_id, '--kind', 'novella', '--scene', 'Opening', '--order', '1'
    ], 'Scene body.\n');
    const notes = author(root, [
      '--intent', 'save_notes', '--notes', 'Fixture Notes'
    ], 'Notes body.\n');
    author(root, [
      '--intent', 'update_outline', '--work', created.work_id, '--kind', 'novella', '--outline', 'yes'
    ], 'Outline body.\n');

    await buildLinkMap({ repoRoot: root });
    const map = JSON.parse(fs.readFileSync(path.join(root, 'REFERENCE_MAP.json'), 'utf8'));
    const ids = map.nodes.map(node => node.canonical_id);
    assert(ids.includes(created.story_id));
    assert(ids.includes(scene.scene_id));
    assert(ids.includes(notes.notes_id));
    assert(ids.includes(`${created.work_id}_OUTLINE`.toLowerCase()));
    assert(ids.every(id => id === id.toLowerCase()), 'generated IDs must use canonical lowercase');
    assert.equal(new Set(ids).size, ids.length);
    console.log('Authoring output builds a unique canonical link map.');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
