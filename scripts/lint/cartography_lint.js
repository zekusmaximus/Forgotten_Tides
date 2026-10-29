#!/usr/bin/env node
/**
 * Lints the atlas map's placement file, design/map/cartography.yaml, against
 * canon. Rules follow design/map/CARTOGRAPHIC_BRIEF.md and
 * docs/ATLAS_MAP_PLAN_2026_10_29.md section 3.4:
 *
 * - The file matches docs/schemas/cartography.schema.json and never repeats
 *   a `memory_density`; densities come from atlas frontmatter only.
 * - Every placement names a real atlas location, once; region placements are
 *   `location_type: region`.
 * - Every primary- or working-canon location is placed (error); an unplaced
 *   speculative or draft location is a warning. Artifacts have no fixed
 *   position and are exempt, as are deprecated, sandbox, and test entries.
 * - Every claim and rule cited exists in the brief's register, and every
 *   source file, line, and timeline anchor exists.
 * - A site lies inside (or, with `relation: boundary`, on the edge of) the
 *   region or band its atlas `coordinates.region` names, and sits at its
 *   declared band position.
 * - Density fidelity: the field reproduces each region's locked
 *   `memory_density` within 0.02 at its probes, and no non-finite value
 *   passes. A site with a density pulls the field to its own value by design
 *   (sites may peak above their surroundings), so at sites this only guards
 *   against overlapping kernels; a site's placement is checked by
 *   containment.
 * - A `canon` feature or route cites a primary- or working-canon source from
 *   a canon content root (docs and design files never count); `approved`
 *   ones cite a claim; `cartographic` ones cite a drawing rule.
 * - Feature positions lie within their region; `along` references resolve;
 *   route paths start at `from` and end at `to`; a route's story exists.
 * - Every listed relation (touches, disjoint, near) holds.
 *
 * Usage: node scripts/lint/cartography_lint.js [--root <dir>] [--json]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const { loadFrontmatter } = require('../lib/file_loader');
const { inferCanonTier } = require('../lib/canon_policy');
const { touches, disjoint, toXY } = require('../map/geometry');
const layout = require('../map/layout');

const SCHEMA_PATH = path.join(__dirname, '../../docs/schemas/cartography.schema.json');
const EDGE_TOLERANCE = 0.01;
const POSITION_TOLERANCE = 0.006;
const FIDELITY_TOLERANCE = 0.02;
const CONTENT_ROOTS = [
  'atlas/', 'bible/', 'characters/', 'data/lexicon/', 'data/timeline/',
  'factions/', 'lore/', 'manuals/', 'mechanics/', 'stories/'
];
const UNPLACED_EXEMPT_TIERS = new Set(['deprecated', 'sandbox', 'test']);

// Only content files carry canon; plans, briefs, sketches, and tooling do not.
function sourceTier(file, meta) {
  return CONTENT_ROOTS.some(root => file.startsWith(root)) ? inferCanonTier(meta, file) : 'reference';
}

function lineCount(raw) {
  if (!raw) return 0;
  return raw.split(/\r?\n/).length - (/\r?\n$/.test(raw) ? 1 : 0);
}

function parseSource(source) {
  const match = /^([^:#\s]+)(?::([1-9]\d*)(?:-([1-9]\d*))?|#([A-Za-z0-9_-]+))?$/.exec(String(source));
  if (!match) return null;
  return {
    file: match[1],
    start: match[2] ? Number(match[2]) : null,
    end: match[3] ? Number(match[3]) : match[2] ? Number(match[2]) : null,
    anchor: match[4] || null
  };
}

// Resolves a source citation to its canon tier, or reports why it cannot.
function resolveSource(root, source, cache) {
  if (cache.has(source)) return cache.get(source);
  const parsed = parseSource(source);
  let result;
  if (!parsed) {
    result = { error: `source "${source}" is not path, path:line, path:start-end, or path#anchor` };
  } else {
    const full = path.join(root, parsed.file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      result = { error: `source file ${parsed.file} does not exist` };
    } else {
      const raw = fs.readFileSync(full, 'utf8');
      const lines = lineCount(raw);
      if (parsed.end !== null && (parsed.end > lines || parsed.start > parsed.end)) {
        result = { error: `source ${source} cites lines beyond ${parsed.file} (${lines} lines)` };
      } else if (parsed.anchor) {
        if (!parsed.file.endsWith('data/timeline/events.yaml')) {
          result = { error: `source ${source}: anchors are supported only for data/timeline/events.yaml event IDs` };
        } else {
          const events = (yaml.load(raw) || {}).events || [];
          const event = events.find(entry => entry.id === parsed.anchor);
          result = event
            ? { tier: event.canon_tier || sourceTier(parsed.file, {}) }
            : { error: `source ${source}: no event ${parsed.anchor} in ${parsed.file}` };
        }
      } else if (parsed.file.endsWith('.md')) {
        result = { tier: sourceTier(parsed.file, loadFrontmatter(full).data) };
      } else {
        result = { tier: sourceTier(parsed.file, {}) };
      }
    }
  }
  cache.set(source, result);
  return result;
}

function findKeys(value, key, trail = '', out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, k) => findKeys(item, key, `${trail}[${k}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [name, child] of Object.entries(value)) {
      const next = trail ? `${trail}.${name}` : name;
      if (name === key) out.push(next);
      findKeys(child, key, next, out);
    }
  }
  return out;
}

function lintCartography({ root = layout.DEFAULT_ROOT } = {}) {
  const findings = [];
  const where = suffix => `${layout.CARTOGRAPHY_PATH}${suffix ? ` ${suffix}` : ''}`;
  const error = (at, message) => findings.push({ level: 'error', where: where(at), message });
  const warn = (at, message) => findings.push({ level: 'warning', where: where(at), message });
  const done = () => ({
    findings,
    errors: findings.filter(f => f.level === 'error').length,
    warnings: findings.filter(f => f.level === 'warning').length
  });

  let context;
  try {
    context = layout.loadMapContext(root);
  } catch (err) {
    error('', `cannot load map inputs: ${err.message}`);
    return done();
  }
  const { cartography, atlas, register } = context;

  for (const keyPath of findKeys(cartography, 'memory_density')) {
    error(keyPath, 'memory_density belongs in atlas frontmatter; the placement file must not repeat it');
  }
  const validate = new Ajv({ allErrors: true, strict: false }).compile(JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')));
  if (!validate(cartography)) {
    for (const err of validate.errors) error(err.instancePath || '/', `schema: ${err.message}`);
    return done();
  }

  const regions = cartography.regions;
  const sites = cartography.sites;
  const features = cartography.features || [];
  const routes = cartography.routes || [];
  const relations = cartography.relations || [];

  // Identity, duplicates, and coverage.
  const placed = new Map();
  for (const [kind, list] of [['regions', regions], ['sites', sites]]) {
    for (const entry of list) {
      const at = `${kind}[${entry.id}]`;
      const entity = atlas.get(entry.id);
      if (!entity) {
        error(at, `${entry.id} is not an atlas location`);
        continue;
      }
      if (placed.has(entry.id)) error(at, `${entry.id} is placed more than once`);
      placed.set(entry.id, kind);
      if (kind === 'regions' && entity.location_type !== 'region') {
        error(at, `${entry.id} (${entity.name}) is a ${entity.location_type}, not a region; place it under sites`);
      }
    }
  }
  for (const entity of atlas.values()) {
    if (placed.has(entity.id) || entity.location_type === 'artifact' || UNPLACED_EXEMPT_TIERS.has(entity.tier)) continue;
    const message = `${entity.id} (${entity.name}, ${entity.tier}) has no placement`;
    if (layout.CANON_TIERS.has(entity.tier)) error('', message);
    else warn('', message);
  }

  // Basis: claims, rules, and sources.
  const sourceCache = new Map();
  const labelled = [
    ...regions.map(e => [`regions[${e.id}]`, e]),
    ...sites.map(e => [`sites[${e.id}]`, e]),
    ...features.map(e => [`features[${e.key}]`, e]),
    ...routes.map(e => [`routes[${e.key}]`, e]),
    ...relations.map((e, k) => [`relations[${k}]`, e])
  ];
  const sourceTiers = new Map();
  for (const [at, entry] of labelled) {
    const claims = entry.claims || [];
    const rules = entry.rules || [];
    const sources = entry.sources || [];
    if (!claims.length && !rules.length && !sources.length) error(at, 'has no basis: cite a claim, a drawing rule, or a source');
    for (const id of claims) if (!register.claims.has(id)) error(at, `claim ${id} is not in the brief's register (${layout.BRIEF_PATH})`);
    for (const id of rules) if (!register.rules.has(id)) error(at, `rule ${id} is not in the brief's drawing rules (${layout.BRIEF_PATH})`);
    const tiers = [];
    for (const source of [...sources, ...(entry.sleeves || []).map(s => s.source).filter(Boolean)]) {
      const resolved = resolveSource(root, source, sourceCache);
      if (resolved.error) error(at, resolved.error);
      else tiers.push(resolved.tier);
    }
    sourceTiers.set(entry, tiers);
  }

  // Tier discipline for features and routes.
  for (const [at, entry] of labelled) {
    if (!entry.tier) continue;
    if (entry.tier === 'canon' && !sourceTiers.get(entry).some(tier => layout.CANON_TIERS.has(tier))) {
      error(at, 'is marked canon but cites no primary- or working-canon source');
    }
    if (entry.tier === 'approved' && !(entry.claims || []).length) error(at, 'is marked approved but cites no register claim');
    if (entry.tier === 'cartographic' && !(entry.rules || []).length) error(at, 'is marked cartographic but cites no drawing rule');
  }

  let shapes;
  try {
    shapes = layout.buildShapes(cartography);
  } catch (err) {
    error('', `cannot build shapes: ${err.message}`);
    return done();
  }
  const points = layout.buildPoints(cartography);
  const aliases = layout.regionAliases(cartography, atlas);

  // Containment and band position.
  for (const site of sites) {
    const entity = atlas.get(site.id);
    if (!entity || !entity.region) continue;
    const at = `sites[${site.id}]`;
    const ref = aliases.get(layout.normalizeName(entity.region));
    if (!ref) {
      error(at, `atlas coordinates.region "${entity.region}" does not name a placed region or band`);
      continue;
    }
    const [x, y] = points.get(site.id).xy;
    const depth = shapes.get(ref).depth(x, y);
    if (site.relation === 'boundary') {
      if (!(Math.abs(depth) <= EDGE_TOLERANCE)) error(at, `should lie on the edge of ${ref} but is ${depth.toFixed(3)} from it`);
    } else if (!(depth >= -EDGE_TOLERANCE)) {
      error(at, `lies outside ${ref}, which its atlas region "${entity.region}" names (${(-depth).toFixed(3)} outside)`);
    }
    const band = layout.findBand(cartography, ref);
    const position = site.band_position || (band && band.subbands ? 'mid' : null);
    if (band && position) {
      const target = { mid: (band.from + band.to) / 2, 'inner-edge': band.from, 'outer-edge': band.to }[position];
      if (!(Math.abs(site.at.r - target) <= POSITION_TOLERANCE)) {
        error(at, `band_position ${position} puts it at r ${target}, but it is at r ${site.at.r}`);
      }
    }
  }
  for (const feature of features) {
    const at = `features[${feature.key}]`;
    if (feature.along && !shapes.has(feature.along)) {
      error(at, `along names ${feature.along}, which is not a placed region, band, or item`);
    }
    if (!feature.within) continue;
    if (!shapes.has(feature.within)) {
      error(at, `within names ${feature.within}, which is not a placed region, band, or item`);
      continue;
    }
    const shape = shapes.get(feature.within);
    const spots = [...(feature.at ? [feature.at] : []), ...(feature.positions || [])];
    for (const spot of spots) {
      const [x, y] = toXY(spot.r, spot.theta);
      if (!(shape.depth(x, y) >= -EDGE_TOLERANCE)) error(at, `point r ${spot.r}, theta ${spot.theta} lies outside ${feature.within}`);
    }
  }

  // Density fidelity.
  let map;
  try {
    map = layout.createMapField(context, shapes);
  } catch (err) {
    error('field', err.message);
    return done();
  }
  const check = (at, name, value, [x, y]) => {
    const got = map.field(x, y);
    if (!(Math.abs(got - value) <= FIDELITY_TOLERANCE)) {
      error(at, `density fidelity: the field gives ${got.toFixed(3)} at ${name}, but the atlas value is ${value}`);
    }
  };
  for (const region of regions) {
    if (!map.values.has(region.id)) continue;
    shapes.get(region.id).probes.forEach((probe, k) => {
      check(`regions[${region.id}]`, `probe ${k}`, map.values.get(region.id), probe);
    });
  }
  for (const site of sites) {
    const entity = atlas.get(site.id);
    if (entity && entity.memory_density !== null) check(`sites[${site.id}]`, 'its point', entity.memory_density, points.get(site.id).xy);
  }

  // Routes.
  const referenceMapPath = path.join(root, 'REFERENCE_MAP.json');
  const storyIds = fs.existsSync(referenceMapPath)
    ? new Set(JSON.parse(fs.readFileSync(referenceMapPath, 'utf8')).nodes.filter(n => n.type === 'story').map(n => n.canonical_id))
    : null;
  for (const route of routes) {
    const at = `routes[${route.key}]`;
    if (route.story && storyIds && !storyIds.has(route.story)) {
      error(at, `story ${route.story} is not in REFERENCE_MAP.json; run npm run linkmap:build or fix the ID`);
    }
    if (route.path && route.from && points.has(route.from)) {
      const [x, y] = toXY(route.path[0].r, route.path[0].theta);
      const [fx, fy] = points.get(route.from).xy;
      if (!(Math.hypot(fx - x, fy - y) <= EDGE_TOLERANCE)) error(at, `path does not start at ${route.from}`);
    }
    for (const end of ['from', 'to']) {
      if (route[end] && !points.has(route[end])) error(at, `${end} names ${route[end]}, which is not a placed site or point feature`);
    }
    if (route.path && route.to && points.has(route.to)) {
      const last = route.path[route.path.length - 1];
      const [x, y] = toXY(last.r, last.theta);
      const [tx, ty] = points.get(route.to).xy;
      if (!(Math.hypot(tx - x, ty - y) <= EDGE_TOLERANCE)) error(at, `path does not end at ${route.to}`);
    }
    if (route.start_within) {
      if (!shapes.has(route.start_within)) {
        error(at, `start_within names ${route.start_within}, which is not a placed shape`);
      } else if (route.path) {
        const [x, y] = toXY(route.path[0].r, route.path[0].theta);
        if (!(shapes.get(route.start_within).depth(x, y) >= -EDGE_TOLERANCE)) error(at, `path does not start inside ${route.start_within}`);
      }
    }
  }

  // Relations.
  relations.forEach((relation, k) => {
    const at = `relations[${k}]`;
    const resolve = ref => (shapes.has(ref) ? { shape: shapes.get(ref) } : points.has(ref) ? { point: points.get(ref).xy } : null);
    const a = resolve(relation.a);
    const b = resolve(relation.b);
    if (!a || !b) {
      error(at, `cannot resolve ${!a ? relation.a : relation.b}`);
      return;
    }
    if (a.point && b.point) {
      error(at, 'relations need at least one shape');
      return;
    }
    let holds;
    if (a.point || b.point) {
      const point = a.point || b.point;
      const depth = (a.shape || b.shape).depth(point[0], point[1]);
      holds = relation.type === 'disjoint' ? depth <= EDGE_TOLERANCE : Math.abs(depth) <= EDGE_TOLERANCE;
    } else if (relation.type === 'disjoint') {
      holds = disjoint(a.shape, b.shape, EDGE_TOLERANCE);
    } else {
      holds = touches(a.shape, b.shape, EDGE_TOLERANCE);
    }
    if (!holds) error(at, `${relation.a} ${relation.type} ${relation.b} does not hold (${(relation.claims || []).join(', ') || 'no claim'})`);
  });

  return done();
}

function main() {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : layout.DEFAULT_ROOT;
  const report = lintCartography({ root });
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const finding of report.findings) {
      console.log(`${finding.level === 'error' ? 'ERROR' : 'WARN '} ${finding.where}: ${finding.message}`);
    }
    console.log(`Cartography lint: ${report.errors} errors, ${report.warnings} warnings.`);
  }
  process.exit(report.errors > 0 ? 1 : 0);
}

module.exports = { lintCartography, parseSource };

if (require.main === module) {
  main();
}
