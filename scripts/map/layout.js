// Loads the atlas map's inputs and resolves references between them.
//
// Inputs: the placement file (design/map/cartography.yaml), atlas entity
// frontmatter, and the claim and rule IDs of the cartographic brief's
// register. Shape references take four forms: "loc-0008" (a region),
// "loc-0008/outer sleeve" (a named band), "loc-0008/outer sleeve/9" (a
// numbered sub-band, counted outward), and "loc-0006#0" (one disc of a
// pocketed region).

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { loadFrontmatter } = require('../lib/file_loader');
const { inferCanonTier } = require('../lib/canon_policy');
const { makeShape, bandShape, toXY } = require('./geometry');
const { createField } = require('./field');

const DEFAULT_ROOT = path.join(__dirname, '../..');
const CARTOGRAPHY_PATH = 'design/map/cartography.yaml';
const BRIEF_PATH = 'design/map/CARTOGRAPHIC_BRIEF.md';
const CANON_TIERS = new Set(['primary_canon', 'working_canon']);
// The rendered image spans the chart square [-IMAGE_EXTENT, IMAGE_EXTENT] on
// both axes: the Black Horizon's outer band (to r 1.2), the frame, and a
// margin whose corners hold the chart's title, notes, tint key, and rose.
const IMAGE_EXTENT = 1.4;

function normalizeName(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadAtlas(root) {
  const dir = path.join(root, 'atlas');
  const entries = new Map();
  if (!fs.existsSync(dir)) return entries;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const rel = `atlas/${file}`;
    const { data } = loadFrontmatter(path.join(dir, file));
    if (!data.id) continue;
    const coords = data.coordinates || {};
    entries.set(data.id, {
      id: data.id,
      name: data.name || data.id,
      location_type: data.location_type || null,
      path: rel,
      tier: inferCanonTier(data, rel),
      region: coords.region || null,
      memory_density: typeof coords.memory_density === 'number' ? coords.memory_density : null,
      memory_density_as_of: coords.memory_density_as_of || null,
      summary_50: data.summary_50 || '',
      summary_200: data.summary_200 || ''
    });
  }
  return entries;
}

// The brief's claim and rule IDs, and each claim's status (its row's last
// cell), so the lint can tell a drawing approval from approved topology.
function loadRegister(root) {
  const text = fs.readFileSync(path.join(root, BRIEF_PATH), 'utf8');
  const claimRows = [...text.matchAll(/^\|\s*(T\d+)\s*\|(.*)\|\s*$/gm)];
  const claims = new Set(claimRows.map(m => m[1]));
  const status = new Map(claimRows.map(m => [m[1], m[2].split('|').pop().trim()]));
  const rules = new Set([...text.matchAll(/^\|\s*(R\d+)\s*\|/gm)].map(m => m[1]));
  return { claims, rules, status };
}

function loadMapContext(root = DEFAULT_ROOT) {
  const cartography = yaml.load(fs.readFileSync(path.join(root, CARTOGRAPHY_PATH), 'utf8')) || {};
  return { root, cartography, atlas: loadAtlas(root), register: loadRegister(root) };
}

function buildShapes(cartography) {
  const shapes = new Map();
  for (const region of cartography.regions || []) {
    const shape = makeShape(region.shape);
    shapes.set(region.id, shape);
    (shape.items || []).forEach((item, k) => shapes.set(`${region.id}#${k}`, item));
    for (const band of region.bands || []) {
      const ref = `${region.id}/${band.name}`;
      shapes.set(ref, bandShape(region.shape, band.from, band.to));
      const count = band.subbands || 0;
      const width = (band.to - band.from) / (count || 1);
      for (let k = 1; k <= count; k++) {
        shapes.set(`${ref}/${k}`, bandShape(region.shape, band.from + width * (k - 1), band.from + width * k));
      }
    }
  }
  return shapes;
}

// Named points: placed sites by entity ID and point features by key.
function buildPoints(cartography) {
  const points = new Map();
  for (const site of cartography.sites || []) points.set(site.id, { ...site.at, xy: toXY(site.at.r, site.at.theta) });
  for (const feature of cartography.features || []) {
    if (feature.at) points.set(feature.key, { ...feature.at, xy: toXY(feature.at.r, feature.at.theta) });
  }
  return points;
}

// Maps each region's atlas name (and any listed aliases), alone or followed
// by a band name, to its shape reference: "Helios Drift outer sleeve" ->
// "loc-0008/outer sleeve".
function regionAliases(cartography, atlas) {
  const aliases = new Map();
  for (const region of cartography.regions || []) {
    const entity = atlas.get(region.id);
    const names = [entity && entity.name, ...(region.aliases || [])].filter(Boolean);
    for (const name of names) {
      aliases.set(normalizeName(name), region.id);
      for (const band of region.bands || []) {
        aliases.set(normalizeName(`${name} ${band.name}`), `${region.id}/${band.name}`);
      }
    }
  }
  return aliases;
}

function findBand(cartography, ref) {
  const [id, name] = String(ref).split('/');
  const region = (cartography.regions || []).find(entry => entry.id === id);
  return region && name ? (region.bands || []).find(band => band.name === name) || null : null;
}

// `field.arms` names the texture feature whose `count` sets the number of
// arms, so the drawn count lives in one place (rule R2: it carries no canon
// weight).
function resolveArms(cartography) {
  const arms = cartography.field && cartography.field.arms;
  if (!arms) return null;
  const feature = (cartography.features || []).find(entry => entry.key === arms.feature);
  if (!feature || !Number.isInteger(feature.count) || feature.count < 1) {
    throw new Error(`field.arms.feature names ${arms.feature}, which is not a feature with a whole-number count`);
  }
  if (!(arms.from > 0 && arms.from < arms.full && arms.full < arms.fade && arms.fade < arms.to)) {
    throw new Error('field.arms must satisfy 0 < from < full < fade < to');
  }
  return { ...arms, count: feature.count };
}

// The placement file as one build sees it. The public build leaves out
// draft features, so no draft texture (arms, lanes, eddies, knots) shapes
// its tiles or data (decision D7).
function forBuild(cartography, build) {
  if (build !== 'public') return cartography;
  return { ...cartography, features: (cartography.features || []).filter(feature => feature.tier !== 'draft') };
}

// Where a region's sounding is printed: a point inside the region where the
// field reads the region's canon value (rule R11). For an annulus, whose
// field the arms vary along each ring, that is the point on its probe ring
// nearest the probe that `accept` takes (by default, within 0.004 of the
// value), or failing that the closest; for any other shape, its first probe.
function soundingPoint(shape, field, value, accept = f => Math.abs(f - value) <= 0.004) {
  const probe = shape.probes[0];
  if (shape.type !== 'annulus') return probe;
  const r = Math.hypot(probe[0], probe[1]);
  const start = Math.atan2(probe[1], probe[0]);
  let best = null;
  for (let k = 0; k <= 720; k++) {
    const a = start + Math.ceil(k / 2) * (k % 2 ? 1 : -1) * (Math.PI / 360);
    const point = [r * Math.cos(a), r * Math.sin(a)];
    const f = field(point[0], point[1]);
    const miss = Math.abs(f - value);
    if (accept(f)) return point;
    if (!best || miss < best.miss) best = { point, miss };
  }
  return best.point;
}

// `include` limits which entities' densities shape the field; the public
// tile build passes a canon-only filter so no speculative site leaves a mark.
function createMapField({ cartography, atlas }, shapes = buildShapes(cartography), { include = () => true } = {}) {
  const values = new Map();
  for (const region of cartography.regions || []) {
    const entity = atlas.get(region.id);
    if (entity && entity.memory_density !== null && include(entity)) values.set(region.id, entity.memory_density);
  }
  const sites = (cartography.sites || [])
    .map(site => ({ site, entity: atlas.get(site.id) }))
    .filter(({ entity }) => entity && entity.memory_density !== null && include(entity))
    .map(({ site, entity }) => ({ r: site.at.r, theta: site.at.theta, value: entity.memory_density }));
  return { field: createField({ config: cartography.field, shapes, values, sites, arms: resolveArms(cartography) }), values, shapes };
}

module.exports = {
  DEFAULT_ROOT,
  CARTOGRAPHY_PATH,
  BRIEF_PATH,
  CANON_TIERS,
  IMAGE_EXTENT,
  normalizeName,
  loadAtlas,
  loadRegister,
  loadMapContext,
  buildShapes,
  buildPoints,
  regionAliases,
  findBand,
  resolveArms,
  forBuild,
  soundingPoint,
  createMapField
};
