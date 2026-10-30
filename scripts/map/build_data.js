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
const { placeIsoplethLabels } = require('./isopleths');
const { TINT_STOPS, TINTS, tintBand, readsAs } = require('./painter');
const { lintCartography } = require('../lint/cartography_lint');
const insetsLib = require('./insets');

const LINK_TYPES = new Set(['story', 'character', 'faction']);
const SLEEVE_LABEL_THETA = 250;   // where sleeve numerals sit around their rings (cartographic)

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function buildMapData({ root = layout.DEFAULT_ROOT, build = 'author' } = {}) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  const lint = lintCartography({ root });
  if (lint.errors) throw new Error(`the cartography lint reports ${lint.errors} errors; run npm run lint:map`);

  const context = layout.loadMapContext(root);
  const { cartography, atlas } = context;
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
  const timelineById = new Map(timeline.map(event => [event.id, event]));
  const pinnedEvents = new Set((cartography.event_pins || []).map(pin => pin.event));
  // An event from the breach story shows after the breach only (rule R17).
  const breachEvent = timelineById.get((cartography.eras || {}).breach);
  const eraOfEvent = event => (breachEvent && event.source === breachEvent.source ? 'after' : 'both');
  const eventsFor = id => timeline
    .filter(event => (event.involved_entities || []).includes(id) && keepTier(event.canon_tier || 'working_canon'))
    .map(event => ({ id: event.id, timestamp: event.timestamp, summary: event.summary, tier: event.canon_tier || 'working_canon', era: eraOfEvent(event) }));

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

  // Each numbered sleeve's ring is its sub-band of the feature's `within`
  // band; its numeral sits on that ring at a fixed angle.
  const sleeveGeometry = (feature, sleeve) => {
    const ring = shapes.get(`${feature.within}/${sleeve.number}`);
    if (!ring || ring.type !== 'annulus') return sleeve;
    const r = (ring.inner + ring.outer) / 2;
    return { ...sleeve, ring_r: r, ring_inner: ring.inner, ring_outer: ring.outer, xy: toXY(r, SLEEVE_LABEL_THETA) };
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
      ...(feature.along && shapes.has(feature.along) ? { along_outline: shapes.get(feature.along).outline() } : {}),
      ...(feature.sleeves ? { sleeves: feature.sleeves.map(sleeve => sleeveGeometry(feature, sleeve)) } : {})
    }));
  const placedPoints = new Set([...sites.map(site => site.id), ...features.filter(f => f.at).map(f => f.key)]);
  const routes = (cartography.routes || []).filter(route => {
    if (isPublic && route.tier === 'draft') return false;
    if (route.story && isPublic && !(nodes.has(route.story) && keepTier(nodes.get(route.story).canon_tier))) return false;
    return [route.from, route.to].filter(Boolean).every(end => placedPoints.has(end));
  }).map(route => ({
    ...route,
    era: route.era || 'both',
    points: route.path ? route.path.map(xy) : [route.from, route.to].map(end => points.get(end).xy),
    // The run's events, placed or not, for its panel (rule R17).
    events: (route.events || []).map(id => timelineById.get(id)).filter(event => event && keepTier(event.canon_tier || 'working_canon'))
      .map(event => ({ id: event.id, timestamp: event.timestamp, summary: event.summary, tier: event.canon_tier || 'working_canon', placed: pinnedEvents.has(event.id) }))
  }));

  // The chart key and isopleth labels come from the same field and tints as
  // this build's tiles, so the public file never reflects a speculative
  // density.
  const include = isPublic ? entity => layout.CANON_TIERS.has(entity.tier) : () => true;
  const { field } = layout.createMapField({ ...context, cartography: layout.forBuild(cartography, build) }, shapes, { include });
  const depthOf = treatment => {
    const list = cartography.regions
      .filter(region => region.treatment === treatment && include(atlas.get(region.id) || { tier: 'speculative' }))
      .map(region => shapes.get(region.id));
    return (x, y) => list.reduce((d, shape) => Math.max(d, shape.depth(x, y)), -Infinity);
  };
  const hex = c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  // Each region's sounding prints where the field reads its value, in its
  // tint band (rule R11). Voids print none: nothing is charted inside. A
  // region sounding beside a site with the same value would only repeat it.
  for (const region of regions) {
    region.sounding_xy = null;
    if (region.memory_density === null || region.treatment === 'void') continue;
    const value = region.memory_density;
    const point = layout.soundingPoint(shapes.get(region.id), field, value, readsAs(value));
    if (sites.some(site => site.memory_density === value && Math.hypot(site.xy[0] - point[0], site.xy[1] - point[1]) < 0.06)) continue;
    const tint = TINTS[tintBand(value)];
    region.sounding_xy = point.map(v => Number(v.toFixed(5)));
    region.sounding_ink = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2] > 110 ? 'dark' : 'light';
  }
  const chart = {
    tints: TINTS.map((color, k) => ({ from: k === 0 ? 0 : TINT_STOPS[k - 1], to: k < TINT_STOPS.length ? TINT_STOPS[k] : 1, color: hex(color) })),
    isopleth_interval: 0.05,
    isopleths: placeIsoplethLabels({
      field,
      voidDepth: depthOf('void'),
      ashDepth: depthOf('ash'),
      fractureDepth: depthOf('fracture'),
      avoid: [...sites.map(site => site.xy), ...features.filter(f => f.xy).map(f => f.xy)]
    })
  };

  const depth = buildDepthAndTime({ cartography, atlas, shapes, points, sites, features, routes, regions, chart, timelineById, keepTier, isPublic, build });

  return {
    generated: new Date().toISOString(),
    build,
    image: { extent: layout.IMAGE_EXTENT },
    chart,
    frame: cartography.frame,
    field: cartography.field,
    regions,
    sites,
    features,
    routes,
    ...depth
  };
}

// Phase 4 data: the eras, the inset plates, the event pins, and the Z0
// scaffold (decisions Q22-Q36). Each item carries its era, so the viewer
// swaps discrete states and never interpolates a value (rule R15).
function buildDepthAndTime({ cartography, atlas, shapes, points, sites, features, routes, regions, chart, timelineById, keepTier, isPublic, build }) {
  const eraSpec = cartography.eras || { breach: null, default: 'after', states: [] };
  const breach = timelineById.get(eraSpec.breach);
  const eraOf = event => (breach && event.source === breach.source ? 'after' : 'both');
  for (const route of routes) for (const event of route.events) event.era = eraOf(timelineById.get(event.id));
  const states = eraSpec.states || [];

  // A pre-breach sounding reads "unmeasured" after the breach.
  for (const state of states.filter(entry => entry.kind === 'sounding')) {
    for (const item of [...regions, ...sites]) if (item.id === state.target) item.era_sounding = { after: state.after };
  }
  // Isopleth values inside a band canon calls reduced are dropped after it.
  for (const state of states.filter(entry => entry.kind === 'isopleth-values')) {
    const shape = shapes.get(state.within);
    for (const iso of chart.isopleths) {
      if (shape && shape.depth(iso.xy[0], iso.xy[1]) >= 0) iso.hidden_in = [...new Set([...(iso.hidden_in || []), 'after'])];
    }
  }
  const sleeveState = states.find(entry => entry.kind === 'sleeves');
  for (const feature of features) if (sleeveState && feature.key === sleeveState.target) feature.post_breach_era = 'after';
  const legend = states.find(entry => entry.kind === 'legend-note');

  // Inset plates: their chart rectangles, live labels, and event anchors per
  // era, all in chart coordinates. The rasters come from render_insets.js.
  const siteById = new Map(sites.map(site => [site.id, site]));
  const insets = (cartography.insets || []).filter(inset => siteById.has(inset.site)).map(inset => {
    const frame = insetsLib.plateFrame(inset, points.get(inset.site).xy);
    const eraList = inset.eras.includes('both') ? ['both'] : inset.eras;
    const round = v => Number(v.toFixed(7));
    const toChart = at => frame.toChart(at).map(round);
    const layers = {};
    for (const era of eraList) {
      const { labels, anchors } = insetsLib.expandInset(inset, { era: era === 'both' ? 'after' : era, build });
      layers[era] = {
        labels: labels.map(label => ({ ...label, xy: toChart(label.at) })),
        anchors: Object.fromEntries(Object.entries(anchors).map(([key, at]) => [key, toChart(at)]))
      };
    }
    const site = siteById.get(inset.site);
    return {
      key: inset.key,
      site: inset.site,
      tier: site.tier,
      title: inset.title,
      caption: inset.caption || '',
      units: inset.plate.units,
      eras: eraList,
      rect: Object.fromEntries(Object.entries(frame.rect).map(([key, v]) => [key, round(v)])),
      layers,
      claims: inset.claims || [],
      rules: inset.rules || []
    };
  });
  const insetByKey = new Map(insets.map(inset => [inset.key, inset]));
  const routeByKey = new Map(routes.map(route => [route.key, route]));

  // Event pins, placed where canon locates them (rule R17).
  const eventPins = [];
  for (const pin of cartography.event_pins || []) {
    const event = timelineById.get(pin.event);
    if (!event || !keepTier(event.canon_tier || 'working_canon')) continue;
    const era = eraOf(event);
    const base = { id: event.id, timestamp: event.timestamp, summary: event.summary, tier: event.canon_tier || 'working_canon', source: event.source || null, era, sources: pin.sources || [] };
    if (pin.route) {
      const route = routeByKey.get(pin.route);
      if (!route) continue;
      const [a, b] = [route.points[0], route.points[route.points.length - 1]];
      eventPins.push({ ...base, place: { kind: 'route', route: route.key, label: route.label }, xy: [a[0] + (b[0] - a[0]) * pin.along, a[1] + (b[1] - a[1]) * pin.along] });
    } else {
      const inset = insetByKey.get(pin.inset);
      if (!inset) continue;
      const layer = inset.layers[era === 'after' && inset.layers.after ? 'after' : inset.eras[0]];
      const anchorXY = layer && layer.anchors[pin.anchor];
      if (!anchorXY) continue;
      const room = (cartography.insets.find(entry => entry.key === pin.inset).elements.find(entry => entry.key === pin.anchor) || {}).label || pin.anchor;
      eventPins.push({ ...base, place: { kind: 'inset', inset: inset.key, anchor: pin.anchor, room, site: inset.site }, xy: anchorXY, site_xy: siteById.get(inset.site).xy });
    }
  }

  const universe = cartography.universe ? { ...cartography.universe, label_xy: [0, -(cartography.universe.hole + 0.12)] } : null;

  return {
    eras: {
      breach: eraSpec.breach,
      breach_summary: breach ? breach.summary : null,
      default: eraSpec.default,
      legend_note: legend ? legend.after : null
    },
    insets,
    event_pins: eventPins,
    universe
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
