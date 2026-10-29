#!/usr/bin/env node
/**
 * Tests for the atlas map's data layer: scripts/map/geometry.js,
 * scripts/map/field.js, scripts/lint/cartography_lint.js, and
 * scripts/map/build_data.js.
 *
 * Unit-tests the shapes and the density field, then runs the lint against a
 * fixture repository in a temporary directory: a passing layout first, then
 * one deliberate defect per rule, each of which must produce its error. The
 * last tests check that the public build drops speculative and draft
 * material while the author build keeps it.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');

const geometry = require('../map/geometry');
const { createField } = require('../map/field');
const { lintCartography } = require('../lint/cartography_lint');
const { buildMapData } = require('../map/build_data');

function location({ id, name, type, status, region, density }) {
  const coords = region || density !== undefined
    ? `coordinates:\n${region ? `  region: ${region}\n` : ''}${density !== undefined ? `  memory_density: ${density}\n` : ''}`
    : '';
  return `---
id: ${id}
schema_version: v1.0.0
type: location
name: ${name}
location_type: ${type}
summary_50: ${name} summary.
summary_200: ${name} longer summary.
cross_refs: {}
references: {}
${coords}metadata:
  status: ${status}
---

# ${name}
`;
}

const ATLAS = {
  'atlas/Core.md': { id: 'loc-9001', name: 'Core', type: 'region', status: 'canonical', density: 0.9 },
  'atlas/Belt.md': { id: 'loc-9002', name: 'Belt', type: 'region', status: 'canonical', density: 0.6 },
  'atlas/Rift.md': { id: 'loc-9003', name: 'Rift', type: 'region', status: 'canonical', density: 0.3 },
  'atlas/Holes.md': { id: 'loc-9004', name: 'Holes', type: 'region', status: 'canonical', density: 0 },
  'atlas/Rim.md': { id: 'loc-9005', name: 'Rim', type: 'region', status: 'canonical', density: 0.02 },
  'atlas/Station.md': { id: 'loc-9006', name: 'Station', type: 'station', status: 'canonical', region: 'Belt outer band', density: 0.7 },
  'atlas/Shrine.md': { id: 'loc-9007', name: 'Shrine', type: 'station', status: 'speculative', region: 'Rift outer reach' },
  'atlas/Lost.md': { id: 'loc-9008', name: 'Lost', type: 'region', status: 'speculative' }
};

const BRIEF = `# Fixture brief

| ID | Claim |
|----|-------|
| T1 | The Core touches the Belt. |
| T2 | The Station sits mid-band. |

| ID | Rule |
|----|------|
| R1 | Geometry is approximate. |
`;

const CANON_STORY = `---
id: story-9901
canon_tier: primary_canon
---

The relay was two pulls from the vault.
`;

const DRAFT_STORY = `---
id: story-9902
canon_tier: draft
---

A draft line.
`;

const EVENTS = `events:
  - id: event-9901
    timestamp: T0
    summary: Canon event at the Station.
    canon_tier: primary_canon
    involved_entities: [loc-9006]
  - id: event-9902
    timestamp: T1
    summary: Draft event at the Station.
    canon_tier: draft
    involved_entities: [loc-9006]
`;

const REFERENCE_MAP = {
  nodes: [
    { canonical_id: 'loc-9006', type: 'location', name: 'Station', canon_tier: 'primary_canon' },
    { canonical_id: 'story-9901', type: 'story', name: 'Canon story', canon_tier: 'primary_canon' },
    { canonical_id: 'story-9902', type: 'story', name: 'Draft story', canon_tier: 'draft' }
  ],
  edges: [
    { from: 'story-9901', to: 'loc-9006', type: 'locations' },
    { from: 'story-9902', to: 'loc-9006', type: 'locations' }
  ]
};

function baseCartography() {
  return {
    schema_version: 'v1.0.0',
    frame: { units: 'chart_radius' },
    field: {
      blend: 0.02,
      site_sigma: 0.01,
      belt_spread: 0.1,
      radial: { core: 'loc-9001', belt: 'loc-9002', perimeter: 'loc-9005' },
      overlays: ['loc-9003', 'loc-9004']
    },
    regions: [
      { id: 'loc-9001', shape: { type: 'disc', radius: 0.12 }, claims: ['T1'] },
      {
        id: 'loc-9002',
        shape: { type: 'annulus', inner: 0.12, outer: 0.62 },
        bands: [
          { name: 'inner band', from: 0.12, to: 0.3 },
          { name: 'outer band', from: 0.3, to: 0.62, subbands: 4 }
        ],
        claims: ['T1']
      },
      {
        id: 'loc-9003',
        shape: { type: 'rift', r0: 0.62, r1: 0.9, theta0: 30, theta1: 40, half0: 2, half1: 10 },
        bands: [{ name: 'outer reach', from: 0.8, to: 0.9 }],
        rules: ['R1']
      },
      { id: 'loc-9004', shape: { type: 'pockets', items: [{ r: 0.8, theta: 200, radius: 0.05 }] }, rules: ['R1'] },
      { id: 'loc-9005', shape: { type: 'annulus', inner: 1.0, outer: 1.2 }, rules: ['R1'] }
    ],
    sites: [
      { id: 'loc-9006', at: { r: 0.46, theta: 300 }, claims: ['T2'] },
      { id: 'loc-9007', at: { r: 0.85, theta: 38.2 }, rules: ['R1'] }
    ],
    features: [
      {
        key: 'relay',
        label: 'Relay',
        kind: 'facility',
        tier: 'canon',
        at: { r: 0.2, theta: 90 },
        within: 'loc-9002/inner band',
        sources: ['stories/short_story/canon_story/manuscript.md:6']
      },
      {
        key: 'draft-mark',
        label: 'Draft mark',
        kind: 'texture',
        tier: 'draft',
        rules: ['R1'],
        sources: ['stories/short_story/draft_story/manuscript.md']
      },
      {
        key: 'bands',
        label: 'Numbered bands',
        kind: 'sleeves',
        tier: 'canon',
        within: 'loc-9002/outer band',
        sources: ['data/timeline/events.yaml#event-9901'],
        sleeves: [{ number: 1, population: 900, source: 'stories/short_story/canon_story/manuscript.md:6' }]
      }
    ],
    routes: [
      {
        key: 'station-to-relay',
        label: 'Station to relay',
        kind: 'corridor',
        tier: 'canon',
        story: 'story-9901',
        pulls: 2,
        from: 'loc-9006',
        to: 'relay',
        sources: ['stories/short_story/canon_story/manuscript.md:6']
      }
    ],
    relations: [
      { type: 'touches', a: 'loc-9001', b: 'loc-9002', claims: ['T1'] },
      { type: 'disjoint', a: 'loc-9003', b: 'loc-9002', claims: ['T1'] }
    ]
  };
}

function write(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function makeFixture(mutate = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'map-data-test-'));
  const atlas = JSON.parse(JSON.stringify(ATLAS));
  if (mutate.atlas) mutate.atlas(atlas);
  for (const [rel, spec] of Object.entries(atlas)) write(root, rel, location(spec));
  const cartography = baseCartography();
  if (mutate.cartography) mutate.cartography(cartography);
  write(root, 'design/map/cartography.yaml', yaml.dump(cartography));
  write(root, 'design/map/CARTOGRAPHIC_BRIEF.md', BRIEF);
  write(root, 'stories/short_story/canon_story/manuscript.md', CANON_STORY);
  write(root, 'stories/short_story/draft_story/manuscript.md', DRAFT_STORY);
  write(root, 'data/timeline/events.yaml', EVENTS);
  write(root, 'REFERENCE_MAP.json', JSON.stringify(REFERENCE_MAP));
  return root;
}

function lintWith(mutate) {
  const root = makeFixture(mutate);
  try {
    return lintCartography({ root });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function expectError(report, fragment) {
  const errors = report.findings.filter(f => f.level === 'error').map(f => `${f.where}: ${f.message}`);
  assert(errors.some(message => message.includes(fragment)), `expected an error containing "${fragment}", got:\n${errors.join('\n') || '(none)'}`);
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

test('shapes report signed depth: positive inside, negative outside', () => {
  const ring = geometry.annulus({ inner: 0.2, outer: 0.4 });
  assert(ring.depth(...geometry.toXY(0.3, 45)) > 0);
  assert(ring.depth(...geometry.toXY(0.5, 45)) < 0);
  const wedge = geometry.rift({ r0: 0.6, r1: 0.9, theta0: 30, theta1: 40, half0: 2, half1: 10 });
  assert(wedge.depth(...geometry.toXY(0.75, 35)) > 0, 'on the center line');
  assert(wedge.depth(...geometry.toXY(0.75, 60)) < 0, 'far off the center line');
  assert(wedge.depth(...geometry.toXY(0.5, 30)) < 0, 'inside the angle but short of r0');
  const holes = geometry.pockets({ items: [{ r: 0.8, theta: 200, radius: 0.05 }, { r: 0.8, theta: 20, radius: 0.05 }] });
  assert(holes.depth(...geometry.toXY(0.8, 20)) > 0.04, 'second pocket counts');
  assert.strictEqual(holes.probes.length, 2);
});

test('touches and disjoint distinguish contact, separation, and overlap', () => {
  const core = geometry.disc({ radius: 0.12 });
  const belt = geometry.annulus({ inner: 0.12, outer: 0.62 });
  const far = geometry.annulus({ inner: 0.8, outer: 0.9 });
  const overlapping = geometry.annulus({ inner: 0.1, outer: 0.5 });
  assert(geometry.touches(core, belt, 0.01) && geometry.disjoint(core, belt, 0.01), 'core meets belt edge to edge');
  assert(!geometry.touches(core, far, 0.01), 'separated shapes do not touch');
  assert(!geometry.disjoint(core, overlapping, 0.01), 'an overlap is not disjoint');
});

test('the field reproduces region values at probes and site values at sites', () => {
  const shapes = new Map([
    ['core', geometry.disc({ radius: 0.12 })],
    ['belt', geometry.annulus({ inner: 0.12, outer: 0.62 })],
    ['rim', geometry.annulus({ inner: 1, outer: 1.2 })],
    ['hole', geometry.pockets({ items: [{ r: 0.8, theta: 200, radius: 0.05 }] })]
  ]);
  const values = new Map([['core', 0.9], ['belt', 0.6], ['rim', 0.02], ['hole', 0]]);
  const field = createField({
    config: { blend: 0.02, site_sigma: 0.01, belt_spread: 0.1, radial: { core: 'core', belt: 'belt', perimeter: 'rim' }, overlays: ['hole'] },
    shapes,
    values,
    sites: [{ r: 0.46, theta: 300, value: 0.7 }]
  });
  for (const [id, value] of values) {
    for (const [x, y] of shapes.get(id).probes) assert(Math.abs(field(x, y) - value) < 1e-9, `${id} probe`);
  }
  assert(Math.abs(field(...geometry.toXY(0.46, 300)) - 0.7) < 1e-9, 'site value at its point');
  const outer = field(...geometry.toXY(0.7, 90));
  assert(outer < 0.5 && outer > 0.02, 'the zone beyond the belt interpolates toward the rim');
});

test('a well-formed fixture passes, with one warning for an unplaced speculative location', () => {
  const report = lintWith();
  assert.strictEqual(report.errors, 0, JSON.stringify(report.findings, null, 2));
  assert.strictEqual(report.warnings, 1);
  assert.match(report.findings[0].message, /loc-9008 \(Lost, speculative\) has no placement/);
});

const DEFECTS = [
  ['an unknown location ID', { cartography: c => { c.sites.push({ id: 'loc-9999', at: { r: 0.5, theta: 10 }, rules: ['R1'] }); } }, 'loc-9999 is not an atlas location'],
  ['a duplicate placement', { cartography: c => { c.sites.push({ ...c.sites[0] }); } }, 'placed more than once'],
  ['an unplaced primary-canon location', { cartography: c => { c.sites.shift(); c.routes = []; } }, 'loc-9006 (Station, primary_canon) has no placement'],
  ['a non-region placed as a region', { cartography: c => { c.regions.push({ id: 'loc-9007', shape: { type: 'disc', radius: 0.01, r: 0.85, theta: 38 }, rules: ['R1'] }); c.sites.pop(); } }, 'is a station, not a region'],
  ['a repeated memory_density', { cartography: c => { c.regions[0].memory_density = 0.9; } }, 'memory_density belongs in atlas frontmatter'],
  ['a claim missing from the register', { cartography: c => { c.regions[0].claims = ['T99']; } }, 'claim T99 is not in the brief'],
  ['an entry with no basis', { cartography: c => { delete c.regions[0].claims; } }, 'has no basis'],
  ['a missing source file', { cartography: c => { c.features[0].sources = ['stories/short_story/nowhere/manuscript.md:1']; } }, 'does not exist'],
  ['a source line beyond the file', { cartography: c => { c.features[0].sources = ['stories/short_story/canon_story/manuscript.md:400']; } }, 'cites lines beyond'],
  ['an unknown timeline anchor', { cartography: c => { c.features[2].sources = ['data/timeline/events.yaml#event-0000']; } }, 'no event event-0000'],
  ['a canon feature with only a draft source', { cartography: c => { c.features[0].sources = ['stories/short_story/draft_story/manuscript.md']; } }, 'cites no primary- or working-canon source'],
  ['a population without a source', { cartography: c => { delete c.features[2].sleeves[0].source; } }, "must have required property 'source'"],
  ['a site outside its atlas region', { cartography: c => { c.sites[1].at = { r: 0.85, theta: 120 }; } }, 'lies outside loc-9003/outer reach'],
  ['an atlas region that names no placed region', { atlas: a => { a['atlas/Station.md'].region = 'Nowhere'; } }, 'does not name a placed region or band'],
  ['a boundary site off the boundary', { cartography: c => { c.sites[1].relation = 'boundary'; } }, 'should lie on the edge'],
  ['a site off its band position', { cartography: c => { c.sites[0].at = { r: 0.58, theta: 300 }; c.routes = []; } }, 'band_position mid'],
  ['a field that misses a canon value', { cartography: c => { c.regions[3].shape.items[0].radius = 0.01; } }, 'density fidelity'],
  ['a relation that does not hold', { cartography: c => { c.relations.push({ type: 'touches', a: 'loc-9001', b: 'loc-9005', claims: ['T1'] }); } }, 'loc-9001 touches loc-9005 does not hold'],
  ['a route path that misses its endpoint', { cartography: c => { c.routes[0].path = [{ r: 0.46, theta: 300 }, { r: 0.3, theta: 90 }]; } }, 'path does not end at relay']
];

for (const [name, mutate, fragment] of DEFECTS) {
  test(`the lint rejects ${name}`, () => expectError(lintWith(mutate), fragment));
}

test('the author build keeps every tier; the public build drops speculative and draft material', () => {
  const root = makeFixture();
  try {
    const author = buildMapData({ root, build: 'author' });
    const publicData = buildMapData({ root, build: 'public' });
    const ids = data => data.sites.map(site => site.id);
    assert.deepStrictEqual(ids(author), ['loc-9006', 'loc-9007']);
    assert.deepStrictEqual(ids(publicData), ['loc-9006']);
    assert(author.features.some(f => f.key === 'draft-mark'));
    assert(!publicData.features.some(f => f.key === 'draft-mark'));
    const station = build => build.sites.find(site => site.id === 'loc-9006');
    assert.deepStrictEqual(station(author).links.map(l => l.id), ['story-9901', 'story-9902']);
    assert.deepStrictEqual(station(publicData).links.map(l => l.id), ['story-9901']);
    assert.deepStrictEqual(station(publicData).events.map(e => e.id), ['event-9901']);
    assert.strictEqual(station(publicData).memory_density, 0.7);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the build refuses to run while the lint reports errors', () => {
  const root = makeFixture({ cartography: c => { c.regions[0].claims = ['T99']; } });
  try {
    assert.throws(() => buildMapData({ root }), /cartography lint reports 1 errors/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

if (process.exitCode) {
  console.error('\nMap data tests: failures above');
} else {
  console.log('\nMap data tests: all passed');
}
