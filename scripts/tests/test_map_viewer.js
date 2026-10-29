#!/usr/bin/env node
/**
 * Tests for the atlas map viewer's pure logic (map/viewer_core.js) and the
 * map server's boundary (scripts/serve_map.js). The browser behavior itself
 * is covered by scripts/tests/test_map_browser.js.
 */
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');

const Core = require('../../map/viewer_core');
const { createMapServer } = require('../serve_map');
const { HOST } = require('../serve_dashboard');

const ROOT = path.join(__dirname, '../..');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS: ${name}`), err => {
      console.error(`FAIL: ${name}`);
      console.error(err.stack || err.message);
      process.exitCode = 1;
    });
}

function request(port, pathname) {
  return new Promise((resolve, reject) => {
    const client = http.request({ hostname: HOST, port, path: pathname, method: 'GET' }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    client.on('error', reject);
    client.end();
  });
}

const DATA = {
  build: 'author',
  image: { extent: 1.25 },
  regions: [
    { id: 'loc-9001', name: 'Core', tier: 'primary_canon', label_xy: [0, -0.17], summary_50: 'The center.', outline: { circles: [{ x: 0, y: 0, r: 0.12 }], polygons: [] }, bands: [] },
    {
      id: 'loc-9002', name: 'Belt', tier: 'primary_canon', label_xy: [0, 0.4], summary_50: 'The belt.', outline: { circles: [], polygons: [] },
      bands: [{ name: 'outer sleeve', from: 0.45, to: 0.62, subbands: 9 }]
    }
  ],
  sites: [
    { id: 'loc-9006', name: 'Tessarine Vault', tier: 'primary_canon', xy: [0.4, -0.2], summary_50: 'A vault.' },
    { id: 'loc-9007', name: 'Solace Hospice', tier: 'speculative', xy: [0.6, 0.7], summary_50: 'A hospice at the vault-side margin.' },
    { id: 'loc-9008', name: 'Working Station', tier: 'working_canon', xy: [-0.3, 0.1], summary_50: '' }
  ],
  features: [
    { key: 'inner-relay', label: 'Inner relay', kind: 'facility', tier: 'canon', xy: [0.18, -0.07] },
    { key: 'draft-mark', label: 'Draft mark', kind: 'facility', tier: 'draft', xy: [0.1, 0.1] },
    { key: 'sleeves', label: 'Sleeves', kind: 'sleeves', tier: 'canon', sleeves: [{ number: 2, population: 200000 }, { number: 9, population: 900 }] }
  ],
  routes: [{ key: 'wake', label: 'The Wake', tier: 'canon', pulls: 3, points: [[0.6, 0.4], [0.7, 0.5]] }]
};

(async () => {
  await test('tiers map onto the three lens positions', () => {
    assert.equal(Core.lensTier('primary_canon'), 'primary');
    assert.equal(Core.lensTier('canon'), 'primary');
    assert.equal(Core.lensTier('approved'), 'primary');
    assert.equal(Core.lensTier('cartographic'), 'primary');
    assert.equal(Core.lensTier('working_canon'), 'working');
    assert.equal(Core.lensTier('speculative'), 'speculative');
    assert.equal(Core.lensTier('draft'), 'speculative');
    assert(Core.visible('primary', 'primary_canon'));
    assert(!Core.visible('primary', 'working_canon'));
    assert(Core.visible('working', 'working_canon'));
    assert(!Core.visible('working', 'speculative'));
    assert(Core.visible('speculative', 'draft'));
  });

  await test('chart coordinates map to the viewport square', () => {
    assert.deepEqual(Core.toViewport([0, 0], 1.25), { x: 0.5, y: 0.5 });
    assert.deepEqual(Core.toViewport([1.25, -1.25], 1.25), { x: 1, y: 1 });
    assert.deepEqual(Core.toViewport([-1.25, 1.25], 1.25), { x: 0, y: 0 }, 'chart y points up; viewport y points down');
    assert.equal(Core.lengthToViewport(0.25, 1.25), 0.1);
    assert.deepEqual(Core.outlineBounds({ circles: [{ x: 0, y: 0, r: 0.5 }], polygons: [[[0.6, 0.1], [0.7, -0.2]]] }), { minX: -0.5, maxX: 0.7, minY: -0.5, maxY: 0.5 });
  });

  await test('the index covers regions, sites, point features, sleeves, and routes', () => {
    const items = Core.buildIndex(DATA);
    const ids = items.map(item => item.id);
    for (const id of ['loc-9001', 'loc-9006', 'inner-relay', 'sleeve-2', 'sleeve-9', 'wake']) assert(ids.includes(id), id);
    assert(!ids.includes('sleeves'), 'a sleeves feature has no point of its own');
    const nine = items.find(item => item.id === 'sleeve-9');
    assert.equal(nine.numeral, 'IX');
    assert(Math.hypot(...nine.xy) > 0.6 && Math.hypot(...nine.xy) < 0.62, 'the Ninth sits in the outermost sub-band');
  });

  await test('search ranks name prefixes first and respects the lens', () => {
    const items = Core.buildIndex(DATA);
    assert.deepEqual(Core.search(items, 'tess', 'primary').map(i => i.id), ['loc-9006']);
    assert.deepEqual(Core.search(items, 'vault', 'primary').map(i => i.id), ['loc-9006'], 'a speculative summary match is hidden under Primary');
    assert.deepEqual(Core.search(items, 'vault', 'speculative').map(i => i.id), ['loc-9006', 'loc-9007'], 'name matches rank above summary matches');
    assert.deepEqual(Core.search(items, 'station', 'primary'), []);
    assert.deepEqual(Core.search(items, 'station', 'working').map(i => i.id), ['loc-9008']);
    assert.deepEqual(Core.search(items, '   ', 'speculative'), []);
  });

  await test('deep-link hashes round-trip and reject malformed input', () => {
    assert.deepEqual(Core.parseHash('#loc-0011'), { id: 'loc-0011' });
    assert.deepEqual(Core.parseHash('#@0.5,0.25,3'), { view: { x: 0.5, y: 0.25, zoom: 3 } });
    const hash = Core.formatHash({ id: 'loc-0011', view: { x: 0.775, y: 0.43, zoom: 4 } });
    assert.equal(hash, '#loc-0011@0.7750,0.4300,4.00');
    assert.deepEqual(Core.parseHash(hash), { id: 'loc-0011', view: { x: 0.775, y: 0.43, zoom: 4 } });
    for (const bad of ['#<script>', '#loc-0011@1,2', '#%E0%A4%A', '#a b']) assert.deepEqual(Core.parseHash(bad), {}, bad);
    assert.equal(Core.formatHash({}), '');
  });

  await test('labels follow the zoom levels of detail', () => {
    assert(Core.labelVisible('region', 1) && !Core.labelVisible('region', 20));
    assert(!Core.labelVisible('site', 1) && Core.labelVisible('site', 1.5));
    assert(!Core.labelVisible('sleeve', 2) && Core.labelVisible('sleeve', 3));
  });

  await test('the map server serves the viewer, its data, and tiles, and nothing else', async () => {
    const outDir = path.join(ROOT, 'out', `map-viewer-test-${process.pid}`);
    fs.mkdirSync(path.join(outDir, 'tiles', 'galaxy_files', '0'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'atlas.author.json'), JSON.stringify(DATA));
    fs.writeFileSync(path.join(outDir, 'tiles', 'galaxy.dzi'), '<Image/>');
    fs.writeFileSync(path.join(outDir, 'tiles', 'galaxy_files', '0', '0_0.webp'), 'RIFF');
    fs.writeFileSync(path.join(outDir, 'tiles', 'secret.txt'), 'no');
    let linked = false;
    try {
      fs.symlinkSync(path.join(ROOT, 'package.json'), path.join(outDir, 'tiles', 'galaxy_files', '0', '1_0.webp'));
      linked = true;
    } catch (err) {
      // Symlinks need extra rights on Windows; the traversal checks still run.
    }
    const server = createMapServer({ build: 'author', outDir });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve); });
    try {
      const { port } = server.address();
      for (const pathname of ['/map/', '/map/index.html', '/map/viewer.js', '/map/viewer_core.js', '/map/viewer.css', '/map/vendor/openseadragon.min.js', '/map/data/atlas.json']) {
        assert.equal((await request(port, pathname)).status, 200, pathname);
      }
      const tile = await request(port, '/map/tiles/galaxy_files/0/0_0.webp');
      assert.equal(tile.status, 200);
      assert.equal(tile.headers['content-type'], 'image/webp');
      assert.match(tile.headers['cache-control'], /max-age/);
      assert.equal((await request(port, '/map/tiles/galaxy.dzi')).status, 200);
      const denied = [
        '/map/tiles/', '/map/tiles/secret.txt', '/map/tiles/../../package.json', '/map/tiles/%2e%2e/galaxy.dzi',
        '/map/tiles/galaxy_files//0_0.webp', '/map/tiles/./galaxy.dzi', '/map/tiles/galaxy_files\\0\\0_0.webp',
        '/map/data/atlas.public.json', '/map/README.md', '/package.json', '/map/../package.json'
      ];
      if (linked) denied.push('/map/tiles/galaxy_files/0/1_0.webp');
      for (const pathname of denied) assert.equal((await request(port, pathname)).status, 404, `${pathname} must be denied`);
    } finally {
      await new Promise(resolve => server.close(resolve));
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  if (process.exitCode) console.error('\nMap viewer tests: failures above');
  else console.log('\nMap viewer tests: all passed');
})();
