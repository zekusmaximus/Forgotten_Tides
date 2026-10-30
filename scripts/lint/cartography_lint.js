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
 *   passes. An annulus is checked by the field's average around the ring at
 *   its probe radius, since the spiral arms vary it along the ring by
 *   design, and the field may stray no more than 0.06 from the value
 *   anywhere on that ring. Each value must also print in the same tint band
 *   as the canon value, at its probe and at the point where its sounding is
 *   printed (rule R11). The public build's field (canon densities and
 *   non-draft textures only) is checked the same way. A site with a density pulls the field to its own value by design
 *   (sites may peak above their surroundings), so at sites this only guards
 *   against overlapping kernels; a site's placement is checked by
 *   containment.
 * - A `canon` feature or route cites a primary- or working-canon source from
 *   a canon content root (docs and design files never count); `approved`
 *   ones cite a claim; `cartographic` ones cite a drawing rule.
 * - Feature positions lie within their region; `along` references resolve;
 *   route paths start at `from` and end at `to`; a route's story exists.
 * - Every listed relation (touches, disjoint, near) holds.
 * - Phase 4 (rules R12-R18; lintDepthAndTime below):
 *   - Every era state, inset, inset element, event pin, and the Z0
 *     scaffold cites its basis. A canon inset element cites a primary- or
 *     working-canon source; a drawing-approved one cites a claim the brief
 *     marks "drawing approved"; a cartographic one cites a rule.
 *   - Every figure a note, label, route, or count states appears in the
 *     source lines it cites (R14, R16), and era notes state none.
 *   - Every atlas sounding measured before the breach has an era state that
 *     reads "unmeasured" after it, and only those do (R6, R15); a softening
 *     sleeve carries no figure (R9).
 *   - The Vault inset's booth and housing counts, its lost booths, and its
 *     housing states agree with canon and with the sleeves' silo states.
 *   - Nothing is placed inside a lost booth, plates and pins stay out of the
 *     Voids, and every element lies on its plate.
 *   - A route whose pull count only the breach story gives shows after the
 *     breach only (R16); an After-only route cites the breach story.
 *   - Event pins name real events, resolve their routes and anchors in every
 *     era the event shows, and appear once.
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
const { ringMean, ringStray } = require('../map/field');
const { tintBand, readsAs } = require('../map/painter');
const insetsLib = require('../map/insets');

const SCHEMA_PATH = path.join(__dirname, '../../docs/schemas/cartography.schema.json');
const EDGE_TOLERANCE = 0.01;
const POSITION_TOLERANCE = 0.006;
const FIDELITY_TOLERANCE = 0.02;
// How far the arms may move an annulus region's field from its canon value
// anywhere along its probe ring (rule R11).
const RING_TOLERANCE = 0.06;
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

// The text a citation points at: its lines, the whole file, or for a
// timeline anchor that event's fields. Used to check the figures a note
// states against what its source says (rule R14).
function sourceText(root, source, cache) {
  const key = `text|${source}`;
  if (cache.has(key)) return cache.get(key);
  const parsed = parseSource(source);
  let text = '';
  const full = parsed && path.join(root, parsed.file);
  if (parsed && fs.existsSync(full) && fs.statSync(full).isFile()) {
    const raw = fs.readFileSync(full, 'utf8');
    if (parsed.anchor) {
      const event = ((yaml.load(raw) || {}).events || []).find(entry => entry.id === parsed.anchor);
      text = event ? [event.summary, event.causal_note].filter(Boolean).join(' ') : '';
    } else if (parsed.start !== null) {
      text = raw.split(/\r?\n/).slice(parsed.start - 1, parsed.end).join('\n');
    } else {
      text = raw;
    }
  }
  cache.set(key, text);
  return text;
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
    ...relations.map((e, k) => [`relations[${k}]`, e]),
    ...((cartography.eras && cartography.eras.states) || []).map(e => [`eras.states[${e.key}]`, e]),
    ...(cartography.insets || []).map(e => [`insets[${e.key}]`, e]),
    ...(cartography.insets || []).flatMap(inset => inset.elements.map(e => [`insets[${inset.key}].elements[${e.key}]`, e])),
    ...(cartography.event_pins || []).map(e => [`event_pins[${e.event}]`, e]),
    ...(cartography.universe ? [['universe', cartography.universe]] : [])
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
    if (entry.tier === 'drawing-approved' && !(entry.claims || []).some(id => /drawing approved/i.test(register.status.get(id) || ''))) {
      error(at, 'is marked drawing-approved but cites no claim the brief marks drawing approved (R12)');
    }
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

  // Density fidelity, for each build's field: the author build's, and the
  // public build's (canon densities and non-draft textures only), which
  // draws the public tiles (decision D7). A failure in both is reported once.
  const failed = new Set();
  const builds = [['author', () => true], ['public', entity => layout.CANON_TIERS.has(entity.tier)]];
  for (const [build, include] of builds) {
    let map;
    try {
      map = layout.createMapField({ ...context, cartography: layout.forBuild(cartography, build) }, shapes, { include });
    } catch (err) {
      error('field', err.message);
      return done();
    }
    const tag = build === 'public' ? ' (public build)' : '';
    const check = (at, name, value, got) => {
      const key = `${at}|${name}`;
      if (build === 'public' && failed.has(key)) return;
      if (!(Math.abs(got - value) <= FIDELITY_TOLERANCE)) {
        failed.add(key);
        error(at, `density fidelity${tag}: the field gives ${got.toFixed(3)} at ${name}, but the atlas value is ${value}`);
      } else if (tintBand(got) !== tintBand(value)) {
        failed.add(key);
        error(at, `rendered band${tag}: the field gives ${got.toFixed(3)} at ${name}, which prints in a different tint band from the atlas value ${value} (R11)`);
      }
    };
    for (const region of regions) {
      if (!map.values.has(region.id)) continue;
      const at = `regions[${region.id}]`;
      const value = map.values.get(region.id);
      const shape = shapes.get(region.id);
      shape.probes.forEach((probe, k) => {
        if (shape.type !== 'annulus') {
          check(at, `probe ${k}`, value, map.field(probe[0], probe[1]));
          return;
        }
        // The arms vary an annulus along each ring by design: its average
        // must hold the value, and no point on the ring may stray far.
        const r = Math.hypot(probe[0], probe[1]);
        check(at, `the ring average at probe ${k}`, value, ringMean(map.field, r));
        const stray = ringStray(map.field, r, value);
        const key = `${at}|ring ${k}`;
        if (stray > RING_TOLERANCE && !(build === 'public' && failed.has(key))) {
          failed.add(key);
          error(at, `ring spread${tag}: along the ring at probe ${k} the field strays ${stray.toFixed(3)} from the atlas value ${value}; keep it within ${RING_TOLERANCE} (R11)`);
        }
      });
      // A sounding prints where the field reads its value. Voids print none:
      // nothing is charted inside them.
      if (region.treatment !== 'void') {
        const point = layout.soundingPoint(shape, map.field, value, readsAs(value));
        check(at, 'its sounding point', value, map.field(point[0], point[1]));
      }
    }
    for (const site of sites) {
      const entity = atlas.get(site.id);
      if (entity && entity.memory_density !== null && include(entity)) {
        const [x, y] = points.get(site.id).xy;
        check(`sites[${site.id}]`, 'its point', entity.memory_density, map.field(x, y));
      }
    }
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

  lintDepthAndTime({ root, cartography, atlas, register, shapes, points, error, warn, sourceCache });

  return done();
}

// Phase 4: eras, insets, event pins, and the Z0 scaffold (rules R12-R18).
function lintDepthAndTime({ root, cartography, atlas, register, shapes, points, error, warn, sourceCache }) {
  const { figuresIn, expandInset, insideLost } = insetsLib;
  const features = cartography.features || [];
  const routes = cartography.routes || [];
  const insets = cartography.insets || [];
  const pins = cartography.event_pins || [];
  const eras = cartography.eras || null;
  const timelinePath = path.join(root, 'data/timeline/events.yaml');
  const timeline = new Map((fs.existsSync(timelinePath) ? (yaml.load(fs.readFileSync(timelinePath, 'utf8')) || {}).events || [] : []).map(event => [event.id, event]));
  const voidShapes = cartography.regions.filter(region => region.treatment === 'void').map(region => shapes.get(region.id));
  const inVoid = (x, y) => voidShapes.some(shape => shape.depth(x, y) > 0);

  // Figures a text states must appear in the lines it cites (R14).
  const figuresOf = sources => {
    const out = new Set();
    for (const source of sources || []) for (const f of figuresIn(sourceText(root, source, sourceCache))) out.add(f);
    return out;
  };
  const checkFigures = (at, what, text, sources) => {
    const stated = [...figuresIn(text)];
    if (!stated.length) return;
    if (!(sources || []).length) {
      error(at, `${what} states ${stated.join(', ')} but cites no source (R14)`);
      return;
    }
    const given = figuresOf(sources);
    for (const figure of stated) if (!given.has(figure)) error(at, `${what} states ${figure}, which its cited sources do not give (R14)`);
  };
  const checkCount = (at, what, value, sources) => {
    if (!figuresOf(sources).has(value)) error(at, `${what} is ${value}, which its cited sources do not give`);
  };

  for (const feature of features) if (feature.note) checkFigures(`features[${feature.key}]`, 'its note', feature.note, feature.sources);

  // Eras (R6, R9, R15).
  const breach = eras ? timeline.get(eras.breach) : null;
  if (eras) {
    if (!breach) error('eras', `breach names ${eras.breach}, which is not in data/timeline/events.yaml`);
    else if (!layout.CANON_TIERS.has(breach.canon_tier)) error('eras', `breach event ${eras.breach} is ${breach.canon_tier}, not primary or working canon`);
  }
  const breachSource = breach ? breach.source : null;
  const eraOf = event => (breachSource && event && event.source === breachSource ? 'after' : 'both');
  const states = (eras && eras.states) || [];
  const soundingTargets = new Set();
  for (const state of states) {
    const at = `eras.states[${state.key}]`;
    if (state.kind === 'sounding') {
      soundingTargets.add(state.target);
      const entity = atlas.get(state.target);
      if (!entity) error(at, `target ${state.target} is not an atlas location`);
      else if (!String(entity.memory_density_as_of || '').includes(eras.breach)) {
        error(at, `${state.target} has no sounding measured before the breach (${eras.breach}); only a pre-breach sounding reads unmeasured after it (R15)`);
      }
    } else if (state.kind === 'sleeves') {
      const feature = features.find(entry => entry.key === state.target);
      if (!feature || feature.kind !== 'sleeves') error(at, `target ${state.target} is not a sleeves feature`);
      else {
        for (const sleeve of feature.sleeves || []) {
          if (sleeve.post_breach && sleeve.post_breach.sleeve === 'softening' && figuresIn(sleeve.post_breach.note || '').size) {
            error(`features[${feature.key}]`, `Sleeve ${sleeve.number} softens after the breach but its note states a figure (R9)`);
          }
        }
      }
    } else if (state.kind === 'isopleth-values') {
      if (!shapes.has(state.within)) error(at, `within names ${state.within}, which is not a placed region or band`);
    }
    if (state.kind === 'legend-note' && figuresIn(state.after).size) error(at, 'the legend note states a figure; era notes state none (R15)');
  }
  if (eras) {
    for (const entity of atlas.values()) {
      if (!String(entity.memory_density_as_of || '').includes(eras.breach) || soundingTargets.has(entity.id)) continue;
      if (cartography.sites.some(site => site.id === entity.id) || cartography.regions.some(region => region.id === entity.id)) {
        error('eras', `${entity.id} (${entity.name}) was measured before the breach but has no sounding state reading unmeasured after it (R6, R15)`);
      }
    }
  }

  // Routes (R16).
  for (const route of routes) {
    const at = `routes[${route.key}]`;
    if (route.pulls) checkCount(at, 'its pull count', route.pulls, route.sources);
    if (route.duration) checkFigures(at, 'its duration', route.duration, route.sources);
    if (route.note) checkFigures(at, 'its note', route.note, route.sources);
    for (const id of route.events || []) if (!timeline.has(id)) error(at, `events names ${id}, which is not in data/timeline/events.yaml`);
    if (!breachSource) continue;
    const fromBreachStory = source => (parseSource(source) || {}).file === breachSource;
    if (route.era === 'after' && !(route.sources || []).some(fromBreachStory)) error(at, 'shows after the breach only but cites nothing from the breach story');
    if (route.pulls && route.era !== 'after') {
      const giving = (route.sources || []).filter(source => figuresIn(sourceText(root, source, sourceCache)).has(route.pulls));
      if (giving.length && giving.every(fromBreachStory)) error(at, `its ${route.pulls}-pull count comes only from the breach story, so it shows after the breach only (R16)`);
    }
  }

  // Insets (R12-R14).
  const sleeveFeature = features.find(feature => feature.kind === 'sleeves');
  const expanded = new Map();
  const insetKeys = new Set();
  for (const inset of insets) {
    const at = `insets[${inset.key}]`;
    if (insetKeys.has(inset.key)) error(at, 'is defined more than once');
    insetKeys.add(inset.key);
    if (!points.has(inset.site) || !cartography.sites.some(site => site.id === inset.site)) {
      error(at, `site ${inset.site} is not a placed site`);
      continue;
    }
    if (inset.eras.includes('both') && inset.eras.length > 1) error(at, 'eras lists "both" with another era');
    if (inset.caption) checkFigures(at, 'its caption', inset.caption, inset.sources);
    const frame = insetsLib.plateFrame(inset, points.get(inset.site).xy);
    const { rect } = frame;
    // The Voids are unions of discs: a plate reaches into one when the
    // disc's center lies within its radius of the plate's rectangle.
    const reaches = voidShapes.flatMap(shape => shape.items || []).some(({ center: [cx, cy], radius }) => {
      const dx = Math.max(rect.left - cx, 0, cx - rect.right);
      const dy = Math.max(rect.bottom - cy, 0, cy - rect.top);
      return Math.hypot(dx, dy) < radius;
    });
    if (reaches) error(at, 'its plate reaches into a Void Region; nothing is charted inside (R12)');
    const [uw, uh] = inset.plate.units;
    const keys = new Set();
    for (const element of inset.elements) {
      const where = `${at}.elements[${element.key}]`;
      if (keys.has(element.key)) error(where, 'repeats a key in this inset');
      keys.add(element.key);
      if (element.era && element.era !== 'both' && !inset.eras.includes(element.era)) error(where, `era ${element.era} is not one of this inset's eras`);
      // Every element lies on its plate.
      const spots = [
        ...(element.x !== undefined ? [[element.x, element.y], [element.x + (element.w || 0), element.y + (element.h || 0)]] : []),
        ...['at', 'a', 'b', 'label_at', 'anchor'].filter(name => element[name]).map(name => element[name]),
        ...(element.points || []),
        ...(element.c ? [[element.c[0], element.c[1]]] : [])
      ];
      if (spots.some(([u, v]) => u < 0 || v < 0 || u > uw || v > uh)) error(where, 'lies off its plate');
      for (const [name, text] of [['its label', element.label], ['its text', element.text]]) if (text) checkFigures(where, name, text, element.sources);
      if (element.kind === 'booths') {
        if (element.count !== 2 * element.per_row) error(where, `count ${element.count} does not equal two rows of ${element.per_row}`);
        checkCount(where, 'its booth count', element.count, element.sources);
        for (const number of element.lost_after || []) {
          if (number > element.count) error(where, `lost booth ${number} is beyond the count of ${element.count}`);
          checkCount(where, 'a lost booth', number, element.sources);
        }
      }
      if (element.kind === 'housings') {
        checkCount(where, 'its housing count', element.count, element.sources);
        for (const number of Object.keys(element.after_states || {}).map(Number)) {
          if (number > element.count) error(where, `after_states names housing ${number}, beyond the count of ${element.count}`);
        }
        // Each housing's state after the breach agrees with its sleeve's silo.
        const expect = { lost: ['lost'], 'reduced-pitch': ['reduced'], held: ['holds', 'bound'] };
        for (let n = 1; n <= element.count; n++) {
          const sleeve = sleeveFeature && (sleeveFeature.sleeves || []).find(entry => entry.number === n);
          const silo = sleeve && sleeve.post_breach ? sleeve.post_breach.silo : null;
          const state = insetsLib.housingState(element, 'after', n);
          const allowed = silo ? expect[silo] : ['holds'];
          if (!allowed.includes(state)) error(where, `housing ${n} is ${state} after the breach, but Sleeve ${n}'s silo is ${silo || 'not listed as changed'}`);
        }
      }
      if (element.kind === 'lintel' && element.forgotten_after && !element.text.split(' ').includes(element.forgotten_after)) {
        error(where, `forgotten_after "${element.forgotten_after}" is not a word of the lintel text`);
      }
    }
    const eraList = inset.eras.includes('both') ? ['both'] : inset.eras;
    const byEra = new Map();
    for (const era of eraList) {
      let result;
      try {
        result = expandInset(inset, { era: era === 'both' ? 'after' : era });
      } catch (err) {
        error(at, err.message);
        continue;
      }
      byEra.set(era, result);
      // Nothing is placed inside a lost place (R13).
      for (const [key, anchor] of Object.entries(result.anchors)) {
        if (insideLost(result.lost, anchor)) error(`${at}.elements[${key}]`, `its anchor lies inside a lost booth in the ${era} era; nothing is placed where the booths were (R13)`);
      }
      for (const label of result.labels) {
        if (label.style !== 'lost' && insideLost(result.lost, label.at)) error(`${at}.elements[${label.key}]`, `a label lies inside a lost booth in the ${era} era (R13)`);
      }
    }
    expanded.set(inset.key, { inset, frame, byEra });
  }

  // Event pins (R17).
  const seenPins = new Set();
  for (const pin of pins) {
    const at = `event_pins[${pin.event}]`;
    if (seenPins.has(pin.event)) error(at, 'is pinned more than once');
    seenPins.add(pin.event);
    const event = timeline.get(pin.event);
    if (!event) {
      error(at, `${pin.event} is not in data/timeline/events.yaml`);
      continue;
    }
    if (!layout.CANON_TIERS.has(event.canon_tier)) warn(at, `${pin.event} is ${event.canon_tier}; the public build leaves it out`);
    const era = eraOf(event);
    if (pin.route) {
      const route = routes.find(entry => entry.key === pin.route);
      if (!route) {
        error(at, `route ${pin.route} is not a route`);
        continue;
      }
      if (route.era === 'after' && era !== 'after') error(at, `the event shows in both eras but its route ${pin.route} shows after the breach only`);
      const ends = route.path ? route.path.map(p => toXY(p.r, p.theta)) : [route.from, route.to].map(end => points.has(end) ? points.get(end).xy : null);
      if (ends.some(end => !end)) continue;
      const [x, y] = [ends[0][0] + (ends[ends.length - 1][0] - ends[0][0]) * pin.along, ends[0][1] + (ends[ends.length - 1][1] - ends[0][1]) * pin.along];
      if (inVoid(x, y)) error(at, 'lies inside a Void Region; nothing is charted inside');
    } else {
      const entry = expanded.get(pin.inset);
      if (!entry) {
        error(at, `inset ${pin.inset} is not an inset`);
        continue;
      }
      const showsIn = entry.inset.eras.includes('both') ? ['both'] : era === 'after' ? ['after'] : entry.inset.eras;
      for (const inEra of showsIn) {
        const result = entry.byEra.get(inEra);
        if (!result) {
          error(at, `the event shows after the breach, but inset ${pin.inset} has no ${inEra} era`);
        } else if (!result.anchors[pin.anchor]) {
          error(at, `anchor ${pin.anchor} is not an anchor of inset ${pin.inset} in the ${inEra} era`);
        }
      }
    }
  }

  // The Z0 scaffold (R8, R18).
  const universe = cartography.universe;
  if (universe) {
    const perimeter = shapes.get(cartography.field.radial.perimeter);
    const edge = perimeter && perimeter.type === 'annulus' ? perimeter.outer : 0;
    if (!(universe.hole >= edge - 1e-9)) error('universe', `hole ${universe.hole} would cover the chart inside r ${edge}`);
    if (!(universe.extent > universe.hole)) error('universe', `extent ${universe.extent} must exceed hole ${universe.hole}`);
    if (figuresIn(universe.label).size) error('universe', 'its label states a figure; Z0 carries only the chart title (R18)');
  }
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
