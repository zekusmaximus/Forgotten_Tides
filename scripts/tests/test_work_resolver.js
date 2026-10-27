#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  discoverWorks,
  discoverScenes,
  resolveWork,
  orderedWorkScenes
} = require('../lib/work_resolver');
const { extract } = require('../prompt/extract_metadata');
const scenesCli = require('../prompt/scenes_cli');

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-work-resolver-'));
  try {
    write(root, 'stories/short_story/SHORT_ONE/manuscript.md',
      '---\nid: story-0001\ntitle: Short One\ntype: story\n---\n\nBody.\n');
    write(root, 'stories/novella/NOVELLA_FIRST_CORRIDOR/manuscript.md',
      '---\nid: novella_first_corridor\ntitle: First Corridor\nscenes:\n  - id: SCENE_B\n    file: scenes\\SCENE_B.md\n  - id: SCENE_A\n    file: scenes/SCENE_A.md\n---\n\nBody.\n');
    write(root, 'stories/novella/NOVELLA_FIRST_CORRIDOR/scenes/SCENE_A.md',
      '---\nid: scene_a\ntitle: First Scene\norder: 1\n---\n\nA.\n');
    write(root, 'stories/novella/NOVELLA_FIRST_CORRIDOR/scenes/SCENE_B.md',
      '---\nid: scene_b\ntitle: Second Scene\norder: 2\n---\n\nB.\n');
    write(root, 'stories/novel/NOVEL_TWO/manuscript.md', '# Novel without frontmatter\n');
    write(root, 'stories/novel/NOVEL_TWO/meta.yaml', 'id: novel_two\ntitle: Novel Two\n');
    write(root, 'stories/screenplay/SCREENPLAY_THREE/manuscript.md',
      '---\nid: screenplay_three\ntitle: Screenplay Three\n---\n');
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

fixture(root => {
  const works = discoverWorks(root);
  assert.deepEqual(works.map(work => work.kind).sort(), ['novel', 'novella', 'screenplay', 'short_story']);
  assert.equal(resolveWork('story-0001', { root }).directoryId, 'SHORT_ONE');
  assert.equal(resolveWork('First Corridor', { root }).directoryId, 'NOVELLA_FIRST_CORRIDOR');
  assert.equal(resolveWork('NOVEL_TWO', { root }).title, 'Novel Two');
  assert.equal(resolveWork('SCREENPLAY_THREE', { root }).kind, 'screenplay');
  assert.equal(resolveWork('SHORT_ONE', { root, kind: 'shorts' }).kind, 'short_story');
  assert.throws(() => resolveWork('Missing', { root }), /Work not found/);

  const corridor = resolveWork('First Corridor', { root });
  const scenes = discoverScenes(root, { work: corridor });
  assert.deepEqual(scenes.map(scene => scene.id), ['scene_a', 'scene_b']);
  assert.deepEqual(orderedWorkScenes(corridor).map(scene => scene.fileId), ['SCENE_B', 'SCENE_A']);
  assert.deepEqual(scenesCli.parseManuscriptScenes(fs.readFileSync(corridor.manuscriptPath, 'utf8')),
    ['scenes/SCENE_B.md', 'scenes/SCENE_A.md']);
  assert.equal(scenesCli.resolveScene('scene_b', root).fileId, 'SCENE_B');
  assert.equal(scenesCli.resolveScene('SCENE_B', root).id, 'scene_b');
  assert.equal(scenesCli.resolveWork('First Corridor', root).directoryId, corridor.directoryId);

  const extracted = extract('replace scene SCENE_B in First Corridor', root);
  assert.equal(extracted.work.id, corridor.directoryId);
  assert.equal(extracted.scene.id, 'SCENE_B');
  assert.equal(extracted.order, null, 'title First Corridor must not imply first position');
  assert.deepEqual(extract('place scene before SCENE_A in First Corridor', root).order,
    { mode: 'before', value: 'SCENE_A' });

  assert.throws(() => scenesCli.parseOptions(['list', '--work', 'First Corridor', '--unknown', 'x']),
    /Unsupported/);
  console.log('Work resolver discovers all active roots and normalizes scene references.');
});

fixture(root => {
  write(root, 'stories/novel/BROKEN/manuscript.md', '---\nid: [unterminated\n---\n');
  assert.throws(() => discoverWorks(root), /Could not parse frontmatter/);
  console.log('Malformed work frontmatter fails discovery clearly.');
});

const realRoot = path.join(__dirname, '..', '..');
const firstCorridor = resolveWork('First Corridor', { root: realRoot });
assert.deepEqual(orderedWorkScenes(firstCorridor).map(scene => scene.fileId), [
  'SCENE_96A0A49F0F2BCA0EE73308E6FD97DA80711DEBBC',
  'SCENE_D9B9E99CD4CDD7109B0756CE955E9574912E36A6'
]);
const novel = resolveWork('NOVEL_FORGOTTEN_TIDES', { root: realRoot });
assert.deepEqual(orderedWorkScenes(novel).map(scene => scene.fileId), [
  'SCENE_541938A8FD6140A456619C4030B828CCC5AC4298'
]);
console.log('First Corridor backslash paths resolve in the real repository.');
