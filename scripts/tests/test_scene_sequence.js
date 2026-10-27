#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');
const OrderingEngine = require('../prompt/ordering');
const { collectScenes, parseManuscriptSceneReferences } = require('../lib/scene_indexer');
const { buildPromiseIndex, lintPromises } = require('../checks/promise_payoff_linter');

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function scene(id, order, promiseLinks = []) {
  return `---\n${yaml.dump({ id, order, promise_links: promiseLinks })}---\n\nBody for ${id}.\n`;
}

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-scene-sequence-'));
  try { run(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
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

test('mixed manuscript entries and include comments normalize path separators', () => {
  const declared = `---\nscenes:\n  - file: scenes\\B.md\n    id: SCENE_B\n  - scenes/A.md\n  - scenes\\B.md\n---\n\n<!-- include: scenes/C.md -->\n`;
  assert.deepEqual(parseManuscriptSceneReferences(declared), ['scenes/B.md', 'scenes/A.md']);
  assert.deepEqual(parseManuscriptSceneReferences('# Title\n<!-- include: scenes\\C.md -->\n<!-- Scene: SCENE_D -->\n'),
    ['scenes/C.md', 'scenes/SCENE_D.md']);
  assert.equal(OrderingEngine.extractSceneId('scenes\\SCENE_ABC.md'), 'SCENE_ABC');
  assert.throws(() => parseManuscriptSceneReferences('---\nscenes: [../outside.md]\n---\n'),
    /Invalid scene reference/);
});

test('all insertion positions use normalized entries and prevent duplicates', () => {
  const base = [{ id: 'SCENE_A', file: 'scenes\\SCENE_A.md', title: 'A' }, 'scenes/SCENE_B.md'];
  const names = list => list.map(item => path.posix.basename(item, '.md'));
  assert.deepEqual(names(OrderingEngine.insert(base, 'scenes/SCENE_C.md', { mode: 'first' })), ['SCENE_C', 'SCENE_A', 'SCENE_B']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'SCENE_C', { mode: 'last' })), ['SCENE_A', 'SCENE_B', 'SCENE_C']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'SCENE_C', { mode: 'before', value: 'SCENE_B' })), ['SCENE_A', 'SCENE_C', 'SCENE_B']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'SCENE_C', { mode: 'after', value: 'SCENE_A' })), ['SCENE_A', 'SCENE_C', 'SCENE_B']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'SCENE_C', { mode: 'index', value: 1 })), ['SCENE_A', 'SCENE_C', 'SCENE_B']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'SCENE_C', { mode: 'midpoint' })), ['SCENE_A', 'SCENE_C', 'SCENE_B']);
  assert.deepEqual(names(OrderingEngine.insert(base, 'scenes\\SCENE_A.md', { mode: 'last' })), ['SCENE_B', 'SCENE_A']);
  assert.throws(() => OrderingEngine.insert(base, '../outside.md', { mode: 'last' }), /Invalid scene reference/);
});

test('saving scene order preserves manuscript body bytes', () => fixture(root => {
  const workDir = path.join(root, 'stories', 'novella', 'WORK');
  const body = '\r\n# Body\r\n<!-- include: scenes/SCENE_A.md -->\r\nProse stays exactly.\r\n';
  const manuscript = write(root, 'stories/novella/WORK/manuscript.md',
    `---\r\nid: story-0001\r\nscenes:\r\n  - file: scenes\\SCENE_A.md\r\n    id: SCENE_A\r\n    title: Preserved Title\r\n    order: 3\r\n---\r\n${body}`);
  const ordered = OrderingEngine.insert(OrderingEngine.load(workDir), 'SCENE_B', { mode: 'first' });
  OrderingEngine.save(workDir, ordered);
  const after = fs.readFileSync(manuscript, 'utf8');
  assert(after.endsWith(body), 'manuscript body changed');
  assert.deepEqual(OrderingEngine.load(workDir), ['scenes/SCENE_B.md', 'scenes/SCENE_A.md']);
  assert.deepEqual(yaml.load(after.match(/^---\r\n([\s\S]*?)\r\n---/)[1]).scenes, [
    { id: 'SCENE_B', file: 'scenes/SCENE_B.md' },
    { id: 'SCENE_A', file: 'scenes/SCENE_A.md', title: 'Preserved Title', order: 3 }
  ]);
}));

test('indexer uses manuscript order, numeric fallback, and excludes backups', () => fixture(root => {
  write(root, 'stories/novella/ONE/manuscript.md',
    '---\nscenes:\n  - scenes/B.md\n  - file: scenes\\A.md\n---\n\nBody.\n');
  write(root, 'stories/novella/ONE/scenes/A.md', scene('scene_a', 10, [{ id: 'shared', role: 'setup' }]));
  write(root, 'stories/novella/ONE/scenes/B.md', scene('scene_b', 1, [{ id: 'shared', role: 'payoff' }]));
  write(root, 'stories/novella/ONE/scenes/C.md', scene('scene_c', 5));
  write(root, 'stories/novella/ONE/scenes/D.md', scene('scene_d', 2));
  write(root, 'stories/novella/ONE/scenes/A_backup_old.md', scene('scene_backup', 0));
  write(root, 'stories/novella/ONE/scenes/README.md', '# Read me');
  write(root, 'stories/screenplay/TWO/manuscript.md', '---\nid: story-0002\n---\n<!-- include: scenes/Z.md -->\n');
  write(root, 'stories/screenplay/TWO/scenes/Y.md', scene('scene_y', 2, [{ id: 'shared', role: 'payoff' }]));
  write(root, 'stories/screenplay/TWO/scenes/Z.md', scene('scene_z', 1));

  const one = collectScenes({ root, work: 'ONE' });
  assert.deepEqual(one.map(item => path.basename(item.path)), ['B.md', 'A.md', 'D.md', 'C.md']);
  const two = collectScenes({ root, work: 'TWO' });
  assert.deepEqual(two.map(item => path.basename(item.path)), ['Z.md', 'Y.md']);
  assert.throws(() => collectScenes({ root, work: 'MISSING' }), /Work not found/);

  const findings = lintPromises(buildPromiseIndex(collectScenes({ root })));
  assert.equal(findings.length, 2);
  assert(findings.some(finding => finding.work_id === 'ONE' && /before its final setup/.test(finding.message)));
  assert(findings.some(finding => finding.work_id === 'TWO' && /no recorded setup/.test(finding.message)));
}));

test('promise IDs such as __proto__ remain ordinary Map keys', () => {
  const first = { workId: 'ONE', path: '/fixture/one.md', data: { promise_links: [{ id: '__proto__', role: 'setup' }] } };
  const second = { workId: 'ONE', path: '/fixture/two.md', data: { promise_links: [{ id: '__proto__', role: 'payoff' }] } };
  assert.deepEqual(lintPromises(buildPromiseIndex([first, second])), []);
});

test('same work directory ID in different kinds does not share a promise', () => {
  const setup = { workId: 'SAME', workKind: 'novella', path: '/fixture/novella.md',
    data: { promise_links: [{ id: 'shared', role: 'setup' }] } };
  const payoff = { workId: 'SAME', workKind: 'screenplay', path: '/fixture/screenplay.md',
    data: { promise_links: [{ id: 'shared', role: 'payoff' }] } };
  const findings = lintPromises(buildPromiseIndex([setup, payoff]));
  assert.equal(findings.length, 2);
  assert(findings.some(finding => finding.work_kind === 'novella' && /never paid off/.test(finding.message)));
  assert(findings.some(finding => finding.work_kind === 'screenplay' && /no recorded setup/.test(finding.message)));
});

test('First Corridor object entries with backslashes resolve in story order', () => {
  const scenes = collectScenes({ work: 'NOVELLA_FIRST_CORRIDOR' });
  assert.equal(scenes.length, 2);
  assert.deepEqual(scenes.map(scene => scene.manuscriptOrder), [0, 1]);
});

test('novel Scene comments identify live scenes', () => {
  const scenes = collectScenes({ work: 'NOVEL_FORGOTTEN_TIDES' });
  assert.equal(scenes.length, 1);
  assert.equal(scenes[0].manuscriptOrder, 0);
});
