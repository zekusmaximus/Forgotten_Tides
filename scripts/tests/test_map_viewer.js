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
    { key: 'sleeves', label: 'Sleeves', kind: 'sleeves', tier: 'canon', sleeves: [{ number: 2, population: 200000, xy: [-0.16, -0.45], ring_r: 0.48 }, { number: 9, population: 900, xy: [-0.21, -0.57], ring_r: 0.61 }, { number: 3 }] }
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
    assert(!ids.includes('sleeve-3'), 'a sleeve without a built point is not indexed');
    const nine = items.find(item => item.id === 'sleeve-9');
    assert.equal(nine.numeral, 'IX');
    assert.deepEqual(nine.xy, [-0.21, -0.57], 'sleeve points come from the data build, not the viewer');
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

  await test('eras are two discrete states, and only an item\'s own era hides it', () => {
    assert.deepEqual(Core.ERAS, ['before', 'after']);
    assert.equal(Core.DEFAULT_ERA, 'after');
    assert(Core.eraShows('both', 'before') && Core.eraShows(undefined, 'after'));
    assert(Core.eraShows('after', 'after') && !Core.eraShows('after', 'before'));
    assert(Core.eraShows('before', 'before') && !Core.eraShows('before', 'after'));
    assert.equal(Core.lensTier('drawing-approved'), 'primary', 'a drawing approval shows under every lens');
    assert.equal(Core.tierLabel('drawing-approved'), 'Drawing approved');
  });

  await test('a pre-breach sounding reads unmeasured after the breach, with no figure', () => {
    const vault = { memory_density: 0.78, memory_density_as_of: 'Before the Tessarine Breach (event-story-0022-001)', era_sounding: { after: 'unmeasured' } };
    const gap = { memory_density: 0.31 };
    assert.deepEqual(Core.soundingIn(vault, 'after'), { value: 'unmeasured', note: null, unmeasured: true });
    assert.deepEqual(Core.soundingIn(vault, 'before'), { value: '0.78', note: 'Before the Tessarine Breach' });
    assert.deepEqual(Core.soundingIn(gap, 'after'), { value: '0.31', note: null });
    assert(!/\d/.test(Core.soundingIn(vault, 'after').value), 'no figure after the breach');
    assert.equal(Core.densityLine(vault, 'after'), 'Memory density unmeasured since the Tessarine Breach; last measured 0.78, before it.');
    assert.equal(Core.densityLine(vault, 'before'), 'Memory density 0.78 · Before the Tessarine Breach (event-story-0022-001)');
    assert.equal(Core.densityLine({}, 'after'), null);
    assert(!Core.isoplethShown({ hidden_in: ['after'] }, 'after') && Core.isoplethShown({ hidden_in: ['after'] }, 'before') && Core.isoplethShown({}, 'after'));
  });

  await test('deep links carry the era when it is not the default', () => {
    assert.equal(Core.formatHash({ id: 'loc-0011', view: { x: 0.65, y: 0.56, zoom: 4 }, era: 'before' }), '#loc-0011@0.6500,0.5600,4.00~before');
    assert.equal(Core.formatHash({ id: 'loc-0011', era: 'after' }), '#loc-0011');
    assert.deepEqual(Core.parseHash('#loc-0011@0.6500,0.5600,4.00~before'), { id: 'loc-0011', view: { x: 0.65, y: 0.56, zoom: 4 }, era: 'before' });
    assert.deepEqual(Core.parseHash('#~before'), { era: 'before' });
    assert.deepEqual(Core.parseHash('#loc-0011~during'), {}, 'an unknown era is malformed');
    // Deep inside a plate the center needs more places.
    assert.equal(Core.formatHash({ view: { x: 0.6490123, y: 0.5571189, zoom: 420 } }), '#@0.649012,0.557119,420.00');
  });

  await test('a plate fades in by its width on screen, its labels by level, and Z0 below the home view', () => {
    assert.equal(Core.plateOpacity(0), 0);
    assert.equal(Core.plateOpacity(Core.PLATE_FADE[0]), 0);
    assert.equal(Core.plateOpacity(Core.PLATE_FADE[1]), 1);
    let last = 0;
    for (let px = 0; px <= 400; px += 10) {
      const opacity = Core.plateOpacity(px);
      assert(opacity >= last, 'the fade never reverses');
      last = opacity;
    }
    assert(!Core.insetLabelVisible('room', 200) && Core.insetLabelVisible('room', 300));
    assert(!Core.insetLabelVisible('detail', 600) && Core.insetLabelVisible('detail', 700));
    assert(!Core.insetLabelVisible('note', 800) && Core.insetLabelVisible('note', 900));
    assert(Core.insetFontPx('note', 400, [1000, 1440]) >= 8 && Core.insetFontPx('note', 100000, [1000, 1440]) <= 18, 'plate text stays legible and bounded');
    assert.equal(Core.universeOpacity(1), 0);
    assert.equal(Core.universeOpacity(0.2), 1);
    assert(Core.universeOpacity(0.6) > 0 && Core.universeOpacity(0.6) < 1);
  });

  await test('event markers: route pins alone, inset pins by room while the plate shows, else one glyph per site', () => {
    const pins = [
      { id: 'e-route', era: 'both', tier: 'primary_canon', xy: [0.6, 0.4], place: { kind: 'route', route: 'wake' } },
      { id: 'e-hall-1', era: 'both', tier: 'primary_canon', xy: [0.41, -0.17], site_xy: [0.4, -0.2], place: { kind: 'inset', inset: 'vault', anchor: 'hall', room: 'Audit hall', site: 'loc-0011' } },
      { id: 'e-hall-2', era: 'after', tier: 'primary_canon', xy: [0.41, -0.17], site_xy: [0.4, -0.2], place: { kind: 'inset', inset: 'vault', anchor: 'hall', room: 'Audit hall', site: 'loc-0011' } },
      { id: 'e-bank', era: 'after', tier: 'primary_canon', xy: [0.42, -0.16], site_xy: [0.4, -0.2], place: { kind: 'inset', inset: 'vault', anchor: 'bank', room: 'Silo bank', site: 'loc-0011' } },
      { id: 'e-draft', era: 'both', tier: 'draft', xy: [0.1, 0.1], place: { kind: 'route', route: 'wake' } }
    ];
    const far = Core.eventMarkers(pins, { era: 'after', lens: 'primary' });
    assert.deepEqual(far.map(m => `${m.key}:${m.events.length}`), ['route:e-route:1', 'site:loc-0011:3']);
    assert.deepEqual(far[1].xy, [0.4, -0.2], 'the glyph sits at the site');
    const near = Core.eventMarkers(pins, { era: 'after', lens: 'primary', plates: new Set(['vault']) });
    assert.deepEqual(near.map(m => `${m.key}:${m.events.length}`), ['route:e-route:1', 'room:vault:hall:2', 'room:vault:bank:1']);
    const before = Core.eventMarkers(pins, { era: 'before', lens: 'primary', plates: new Set(['vault']) });
    assert.deepEqual(before.map(m => `${m.key}:${m.events.length}`), ['route:e-route:1', 'room:vault:hall:1'], 'breach events are gone before the breach');
    assert(Core.eventMarkers(pins, { era: 'after', lens: 'speculative' }).some(m => m.key === 'route:e-draft'), 'a draft pin shows only under + Speculative');
  });

  await test('search and the index respect the era', () => {
    const data = { ...DATA, routes: [...DATA.routes, { key: 'run', label: 'Null-stone run', tier: 'canon', era: 'after', pulls: 2, points: [[0.4, -0.2], [0.18, -0.07]] }], event_pins: [{ id: 'event-x', summary: 'Booths lost', timestamp: 'T0', tier: 'primary_canon', era: 'after', xy: [0.4, -0.2], place: { kind: 'route', route: 'run' } }] };
    const items = Core.buildIndex(data);
    assert(items.some(item => item.kind === 'event' && item.era === 'after'));
    assert.deepEqual(Core.search(items, 'null', 'primary', 8, 'after').map(item => item.id), ['run']);
    assert.deepEqual(Core.search(items, 'null', 'primary', 8, 'before'), []);
    assert.deepEqual(Core.search(items, 'booths', 'primary', 8, 'before'), []);
  });

  await test('the map server serves the viewer, its data, and tiles, and nothing else', async () => {
    const outDir = path.join(ROOT, 'out', `map-viewer-test-${process.pid}`);
    fs.mkdirSync(path.join(outDir, 'tiles', 'galaxy_files', '0'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'atlas.author.json'), JSON.stringify(DATA));
    fs.writeFileSync(path.join(outDir, 'tiles', 'galaxy.dzi'), '<Image/>');
    fs.writeFileSync(path.join(outDir, 'tiles', 'galaxy_files', '0', '0_0.webp'), 'RIFF');
    fs.writeFileSync(path.join(outDir, 'tiles', 'secret.txt'), 'no');
    fs.mkdirSync(path.join(outDir, 'insets', 'tessarine-vault-after_files', '0'), { recursive: true });
    fs.writeFileSync(path.join(outDir, 'insets', 'tessarine-vault-after_files', '0', '0_0.webp'), 'RIFF');
    fs.writeFileSync(path.join(outDir, 'insets', 'insets.json'), '{}');
    fs.writeFileSync(path.join(outDir, 'insets', 'secret.txt'), 'no');
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
      assert.match(tile.headers['cache-control'], /max-age/, 'tile images may be cached');
      const dzi = await request(port, '/map/tiles/galaxy.dzi');
      assert.equal(dzi.status, 200);
      assert.equal(dzi.headers['cache-control'], 'no-store', 'the descriptor is never cached');
      const denied = [
        '/map/tiles/', '/map/tiles/secret.txt', '/map/tiles/../../package.json', '/map/tiles/%2e%2e/galaxy.dzi',
        '/map/tiles/galaxy_files//0_0.webp', '/map/tiles/./galaxy.dzi', '/map/tiles/galaxy_files\\0\\0_0.webp',
        '/map/data/atlas.public.json', '/map/README.md', '/package.json', '/map/../package.json',
        '/map/tiles/galaxy.dzi:x.json', '/map/tiles/galaxy.dzi.', '/map/tiles/galaxy.dzi%20', '/map/tiles/galaxy_files/0/0_0.webp?x=../../'
      ];
      // The inset plates and the scaffold, under the same rules.
      const inset = await request(port, '/map/insets/tessarine-vault-after_files/0/0_0.webp');
      assert.equal(inset.status, 200);
      assert.match(inset.headers['cache-control'], /max-age/);
      assert.equal((await request(port, '/map/insets/insets.json')).headers['cache-control'], 'no-store', 'the inset manifest is never cached');
      denied.push('/map/insets/secret.txt', '/map/insets/../tiles/galaxy.dzi', '/map/insets/%2e%2e/insets.json', '/map/insets/', '/map/insets/./insets.json');
      if (linked) denied.push('/map/tiles/galaxy_files/0/1_0.webp');
      for (const pathname of denied.filter(p => !p.includes('?'))) assert.equal((await request(port, pathname)).status, 404, `${pathname} must be denied`);
      assert.equal((await request(port, '/map/tiles/galaxy_files/0/0_0.webp?x=../../')).status, 200, 'a query string is ignored, not resolved');
    } finally {
      await new Promise(resolve => server.close(resolve));
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  await test('each build serves its own tiles and plates', async () => {
    const outDir = path.join(ROOT, 'out', `map-viewer-builds-${process.pid}`);
    for (const dir of ['tiles', 'tiles-public']) {
      fs.mkdirSync(path.join(outDir, dir), { recursive: true });
      fs.writeFileSync(path.join(outDir, dir, 'galaxy.dzi'), dir);
    }
    for (const dir of ['insets', 'insets-public']) {
      fs.mkdirSync(path.join(outDir, dir), { recursive: true });
      fs.writeFileSync(path.join(outDir, dir, 'insets.json'), JSON.stringify({ dir }));
    }
    fs.writeFileSync(path.join(outDir, 'atlas.public.json'), JSON.stringify({ ...DATA, build: 'public' }));
    const server = createMapServer({ build: 'public', outDir });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve); });
    try {
      const { port } = server.address();
      assert.equal((await request(port, '/map/tiles/galaxy.dzi')).body.toString(), 'tiles-public');
      assert.equal(JSON.parse((await request(port, '/map/insets/insets.json')).body.toString()).dir, 'insets-public', 'the public build serves its own plates');
    } finally {
      await new Promise(resolve => server.close(resolve));
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  if (process.exitCode) console.error('\nMap viewer tests: failures above');
  else console.log('\nMap viewer tests: all passed');
})();
