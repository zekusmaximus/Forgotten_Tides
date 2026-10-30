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
// both axes: the Black Horizon's outer band (to r 1.2) plus a margin.
const IMAGE_EXTENT = 1.25;

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

function loadRegister(root) {
  const text = fs.readFileSync(path.join(root, BRIEF_PATH), 'utf8');
  const claims = new Set([...text.matchAll(/^\|\s*(T\d+)\s*\|/gm)].map(m => m[1]));
  const rules = new Set([...text.matchAll(/^\|\s*(R\d+)\s*\|/gm)].map(m => m[1]));
  return { claims, rules };
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
  return { field: createField({ config: cartography.field, shapes, values, sites }), values, shapes };
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
  createMapField
};
