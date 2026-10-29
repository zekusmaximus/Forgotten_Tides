#!/usr/bin/env node
/**
 * Builds the atlas map viewer's data from the placement file
 * (design/map/cartography.yaml), atlas frontmatter, REFERENCE_MAP.json, and
 * data/timeline/events.yaml. It runs the cartography lint first and refuses
 * to build while the lint reports errors.
 *
 * Two builds (decision D7):
 * - author: every tier, each item carrying its tier so the viewer can fade
 *   speculative and draft material.
 * - public: primary and working canon only. Speculative entities, draft
 *   features and routes, and links or events below working canon are left
 *   out of the file itself, not hidden in the browser.
 *
 * Usage: node scripts/map/build_data.js [--build author|public] [--out <file>] [--root <dir>]
 * Default output: out/map/atlas.<build>.json (gitignored).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const layout = require('./layout');
const { toXY } = require('./geometry');
const { lintCartography } = require('../lint/cartography_lint');

const LINK_TYPES = new Set(['story', 'character', 'faction']);

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function buildMapData({ root = layout.DEFAULT_ROOT, build = 'author' } = {}) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  const lint = lintCartography({ root });
  if (lint.errors) throw new Error(`the cartography lint reports ${lint.errors} errors; run npm run lint:map`);

  const { cartography, atlas } = layout.loadMapContext(root);
  const shapes = layout.buildShapes(cartography);
  const points = layout.buildPoints(cartography);
  const xy = polar => toXY(polar.r, polar.theta);
  const isPublic = build === 'public';
  const keepTier = tier => !isPublic || layout.CANON_TIERS.has(tier);
  const keepEntity = id => atlas.has(id) && keepTier(atlas.get(id).tier);

  const referenceMap = readJson(path.join(root, 'REFERENCE_MAP.json')) || { nodes: [], edges: [] };
  const nodes = new Map(referenceMap.nodes.map(node => [node.canonical_id, node]));
  const linksFor = id => {
    const seen = new Map();
    for (const edge of referenceMap.edges) {
      const other = edge.from === id ? edge.to : edge.to === id ? edge.from : null;
      const node = other && nodes.get(other);
      if (!node || !LINK_TYPES.has(node.type) || !keepTier(node.canon_tier) || seen.has(other)) continue;
      seen.set(other, { id: other, name: node.name, type: node.type, tier: node.canon_tier });
    }
    return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
  };

  const timelinePath = path.join(root, 'data/timeline/events.yaml');
  const timeline = fs.existsSync(timelinePath) ? (yaml.load(fs.readFileSync(timelinePath, 'utf8')) || {}).events || [] : [];
  const eventsFor = id => timeline
    .filter(event => (event.involved_entities || []).includes(id) && keepTier(event.canon_tier || 'working_canon'))
    .map(event => ({ id: event.id, timestamp: event.timestamp, summary: event.summary, tier: event.canon_tier || 'working_canon' }));

  const entityFields = id => {
    const entity = atlas.get(id);
    return {
      id,
      name: entity.name,
      tier: entity.tier,
      location_type: entity.location_type,
      path: entity.path,
      region: entity.region,
      summary_50: entity.summary_50,
      summary_200: entity.summary_200,
      memory_density: entity.memory_density,
      memory_density_as_of: entity.memory_density_as_of,
      links: linksFor(id),
      events: eventsFor(id)
    };
  };

  // Shapes, points, and outlines are emitted in chart coordinates, so the
  // viewer draws from this file without its own copy of the geometry.
  const regions = cartography.regions
    .filter(region => keepEntity(region.id))
    .map(({ id, shape, bands = [], label = null, treatment = null, claims = [] }) => ({
      ...entityFields(id),
      shape,
      treatment,
      outline: shapes.get(id).outline(),
      label_xy: label ? xy(label) : null,
      bands: bands.map(band => ({
        ...band,
        outline: shapes.get(`${id}/${band.name}`).outline(),
        subband_outlines: Array.from({ length: band.subbands || 0 }, (_, k) => shapes.get(`${id}/${band.name}/${k + 1}`).outline())
      })),
      claims
    }));
  const sites = cartography.sites
    .filter(site => keepEntity(site.id))
    .map(({ id, at, relation = 'inside', band_position = null, marker = 'pin', circuit = null, claims = [] }) => ({
      ...entityFields(id), at, xy: xy(at), relation, band_position, marker, circuit, claims
    }));
  const features = (cartography.features || [])
    .filter(feature => !isPublic || feature.tier !== 'draft')
    .map(feature => ({
      ...feature,
      ...(feature.at ? { xy: xy(feature.at) } : {}),
      ...(feature.positions ? { positions_xy: feature.positions.map(xy) } : {}),
      ...(feature.along && shapes.has(feature.along) ? { along_outline: shapes.get(feature.along).outline() } : {})
    }));
  const placedPoints = new Set([...sites.map(site => site.id), ...features.filter(f => f.at).map(f => f.key)]);
  const routes = (cartography.routes || []).filter(route => {
    if (isPublic && route.tier === 'draft') return false;
    if (route.story && isPublic && !(nodes.has(route.story) && keepTier(nodes.get(route.story).canon_tier))) return false;
    return [route.from, route.to].filter(Boolean).every(end => placedPoints.has(end));
  }).map(route => ({
    ...route,
    points: route.path ? route.path.map(xy) : [route.from, route.to].map(end => points.get(end).xy)
  }));

  return {
    generated: new Date().toISOString(),
    build,
    image: { extent: layout.IMAGE_EXTENT },
    frame: cartography.frame,
    field: cartography.field,
    regions,
    sites,
    features,
    routes
  };
}

function main() {
  const args = process.argv.slice(2);
  const option = name => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : null;
  };
  const root = option('--root') ? path.resolve(option('--root')) : layout.DEFAULT_ROOT;
  const build = option('--build') || 'author';
  try {
    const data = buildMapData({ root, build });
    const out = option('--out') ? path.resolve(option('--out')) : path.join(root, 'out', 'map', `atlas.${build}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Atlas map data (${build}): ${data.regions.length} regions, ${data.sites.length} sites, ` +
      `${data.features.length} features, ${data.routes.length} routes -> ${path.relative(process.cwd(), out)}`);
  } catch (err) {
    console.error(`Map data build failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildMapData };

if (require.main === module) {
  main();
}
