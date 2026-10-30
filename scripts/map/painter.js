// The atlas map's chart painter: turns the canon density field into the
// pixels of any window of the chart, in the style of an Admiralty chart
// printed on dark paper (decision D9, style direction A).
//
// Layers, in order:
//   1. Stepped tints, one flat color per density band, like a chart's depth
//      tints. Band edges are the major isopleths.
//   2. Paper grain, in world space, so it emerges as the chart is zoomed.
//   3. Isopleths of memory density: majors every 0.1, minors every 0.05 and
//      at 0.02, each a constant pixel width at every zoom level. A contour
//      fades out where its spacing would crowd the page.
//   4. Region treatments (plan section 2.2): the Lattice Gap breaks into
//      displaced shards and prints its linework twice, out of register; the
//      Remnant Seas turn to streaked ash with cinder stars and shard glints;
//      the Core prints its stars in dark ink on its pale tint.
//   5. Stars, decided at their exact world position so tiles always agree.
//   6. Void Regions: nothing. No tint, grain, contour, star, or lane inside.
//   7. The Black Horizon's ink bleed, its lensing knots, the neatline with its
//      degree bars, and the margin.
//
// Everything is deterministic: the same inputs give the same bytes.

const layout = require('./layout');
const { smoothstep } = require('./field');
const { toXY } = require('./geometry');
const { computeLanes, createLaneLayer } = require('./lanes');

// Tints follow the void and amber scales of ui_kits/colors_and_type.css.
// TINTS[k] covers densities between TINT_STOPS[k - 1] and TINT_STOPS[k].
const TINT_STOPS = [0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
const TINTS = [
  [7, 9, 13], [10, 13, 19], [13, 17, 25], [16, 22, 32], [20, 28, 40], [25, 34, 48],
  [34, 39, 48], [50, 47, 43], [74, 61, 42], [104, 81, 47], [146, 111, 61], [204, 162, 96], [238, 216, 168]
];
const LIGHT_INK = [236, 229, 212];
const DARK_INK = [40, 27, 12];
const GHOST_INK = [118, 164, 186];
const VOID_COLOR = [2, 3, 5];
const BLEED_INK = [3, 4, 7];
const PAPER = [17, 22, 31];
const ASH = [33, 31, 30];
const CINDER = [176, 92, 46];
const GLINT = [214, 238, 244];
const STAR = [246, 240, 226];

const CONTOUR_STEP = 0.05;
const EXTRA_CONTOURS = [0.02];
const MAJOR = { width: 1.2, alpha: 0.44, crowd: [2.5, 4.5] };
const MINOR = { width: 0.8, alpha: 0.18, crowd: [9, 18] };

const STAR_CLASSES = [
  { cell: 0.024, radius: 0.0011, gain: 1.0, salt: 11 },
  { cell: 0.008, radius: 0.00045, gain: 0.85, salt: 23 },
  { cell: 0.0027, radius: 0.0002, gain: 0.7, salt: 37 },
  { cell: 0.0009, radius: 0.00008, gain: 0.55, salt: 53 }
];
const GLINTS = { cell: 0.006, size: 0.0011, chance: 0.12, salt: 71 };

// The Gap's fracture: splinters about SHARD_CELL chart units across and
// SHARD_STRETCH times as long, running outward like the rift, each shifted
// sideways by up to SHARD_SHIFT and turned by up to SHARD_TURN radians, and
// printed a second time out of register by MISREGISTER. Each splinter
// carries two hatch screens set at slightly different angles; where they
// beat, moire fringes stand for the Gap's disrupted corridor harmonics.
// The fringes are drawn at every zoom, the screens' lines once resolved.
const SHARD_CELL = 0.018;
const SHARD_STRETCH = 3.2;
const SHARD_SHIFT = 0.007;
const SHARD_TURN = 0.05;
const MISREGISTER = [0.0011, -0.0007];
// The farthest a shard can carry anything: its shift, its turn about a site
// up to about one splinter's length away, and the second print's offset.
const SHARD_REACH = SHARD_SHIFT + SHARD_TURN * SHARD_CELL * SHARD_STRETCH * 1.5 + Math.hypot(...MISREGISTER);
const SCREEN = { spacing: 0.0042, alpha: 0.14, beat: [0.16, 0.3] };
const SCREEN_ANGLE = (62 * Math.PI) / 180;

// The frame: the chart ends at the Black Horizon's outer edge (r 1.2).
const NEATLINE = 1.2;
const BAR_IN = 1.206;
const BAR_OUT = 1.222;
const TICK_OUT = 1.229;
const FRAME_OUT = 1.235;

const KNOT = { core: 0.0032, ring: 0.0068, halo: 0.022 };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(i, j, salt) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(salt, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Builds the painter from the repository's map inputs. `network` is a
// precomputed lane network (computeLanes output) so render workers need not
// each recompute it; `extras` are further layers drawn before the stars.
function createPainter(root, { build = 'author', network = null, extras = [] } = {}) {
  // simplex-noise is required here so tests that never render do not load it.
  const { createNoise2D } = require('simplex-noise');
  const context = layout.loadMapContext(root);
  const shapes = layout.buildShapes(context.cartography);
  const include = build === 'public' ? entity => layout.CANON_TIERS.has(entity.tier) : () => true;
  const { field } = layout.createMapField(context, shapes, { include });
  const { cartography } = context;
  const blend = cartography.field.blend;
  const treated = treatment => cartography.regions
    .filter(region => region.treatment === treatment && include(context.atlas.get(region.id) || { tier: 'speculative' }))
    .map(region => shapes.get(region.id));
  const masks = { fracture: treated('fracture'), ash: treated('ash'), void: treated('void') };
  // Signed depth into a treatment's shapes; far outside when there are none,
  // so an empty list never puts an infinity into the interpolation grid.
  const depthOf = (list, x, y) => {
    let d = -1e9;
    for (const shape of list) d = Math.max(d, shape.depth(x, y));
    return d;
  };
  // The placement file decides whether lanes and eddies are drawn.
  const featureKeys = new Set((cartography.features || []).map(feature => feature.key));
  const lanes = network || computeLanes({
    field,
    voidDepth: (x, y) => depthOf(masks.void, x, y),
    fractureDepth: (x, y) => depthOf(masks.fracture, x, y),
    ashDepth: (x, y) => depthOf(masks.ash, x, y)
  });
  const layers = [createLaneLayer(lanes, { eddyInk: LIGHT_INK, lanes: featureKeys.has('corridor-lanes'), eddies: featureKeys.has('eddies') }), ...extras];
  const knotFeature = (cartography.features || []).find(feature => feature.key === 'black-hole-knots');
  const knots = knotFeature ? (knotFeature.positions || []).map(at => toXY(at.r, at.theta)) : [];
  const pocketCenters = masks.ash.flatMap(shape => (shape.items || [shape]).map(item => item.center));

  const noise = createNoise2D(mulberry32(20261029));
  const grainNoise = createNoise2D(mulberry32(1030));
  const bleedNoise = createNoise2D(mulberry32(1031));
  const tintDelta = TINTS.slice(1).map((c, k) => [c[0] - TINTS[k][0], c[1] - TINTS[k][1], c[2] - TINTS[k][2]]);

  // Band-limited fractal noise: octaves whose wavelength is under two
  // pixels are left out, and the last one fades in, so no level aliases.
  function fbm(fn, x, y, base, octaves, px) {
    let sum = 0;
    let amp = 0.5;
    let f = base;
    for (let o = 0; o < octaves; o++) {
      const fade = smoothstep(2, 4, 1 / (f * px));
      if (fade === 0) break;
      sum += amp * fade * fn(x * f, y * f);
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  }

  // Paper grain: a faint mottle at chart scale (smooth enough to take from
  // the coarse grid) plus fibers that appear as the chart is zoomed. Both
  // are multipliers near 1.
  const mottle = (x, y, px) => 0.025 * fbm(grainNoise, x, y, 18, 3, px);
  const fibers = (x, y, px) => 0.08 * fbm(grainNoise, x + 7.3, y - 3.1, 700, 5, px);
  const grain = (x, y, px) => 1 + mottle(x, y, px) + fibers(x, y, px);

  // The Gap's shards: the nearest Voronoi site in a jittered grid laid out in
  // (outward, sideways) coordinates, so cells run radially as splinters, and
  // that shard's displacement, turn, screen skew, and tint shift.
  function shardAt(x, y) {
    const r = Math.hypot(x, y) || 1e-9;
    const ox = x / r;
    const oy = y / r;
    const along = r / SHARD_STRETCH;
    const across = Math.atan2(y, x) * 0.78;
    const ci = Math.floor(along / SHARD_CELL);
    const cj = Math.floor(across / SHARD_CELL);
    let best = Infinity;
    let bi = 0;
    let bj = 0;
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const i = ci + di;
        const j = cj + dj;
        const sx = (i + 0.15 + 0.7 * hash2(i, j, 101)) * SHARD_CELL;
        const sy = (j + 0.15 + 0.7 * hash2(i, j, 102)) * SHARD_CELL;
        const d = Math.hypot(along - sx, across - sy);
        if (d < best) { best = d; bi = i; bj = j; }
      }
    }
    // Sites map back to the chart; shifts are mostly sideways.
    const siteR = (bi + 0.15 + 0.7 * hash2(bi, bj, 101)) * SHARD_CELL * SHARD_STRETCH;
    const siteA = ((bj + 0.15 + 0.7 * hash2(bi, bj, 102)) * SHARD_CELL) / 0.78;
    const side = (hash2(bi, bj, 103) - 0.5) * 2 * SHARD_SHIFT;
    const out = (hash2(bi, bj, 104) - 0.5) * 0.6 * SHARD_SHIFT;
    return {
      cx: siteR * Math.cos(siteA),
      cy: siteR * Math.sin(siteA),
      dx: out * ox - side * oy,
      dy: out * oy + side * ox,
      turn: (hash2(bi, bj, 106) - 0.5) * 2 * SHARD_TURN,
      skew: (SCREEN.beat[0] + (SCREEN.beat[1] - SCREEN.beat[0]) * hash2(bi, bj, 107)) * (hash2(bi, bj, 108) < 0.5 ? -1 : 1),
      tint: (hash2(bi, bj, 105) - 0.5) * 0.1
    };
  }

  // Where a shard shows the chart from: turned about its site and shifted,
  // by `weight` (0 outside the Gap, 1 well inside).
  function throughShard(shard, x, y, weight) {
    const a = shard.turn * weight;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const rx = x - shard.cx;
    const ry = y - shard.cy;
    return [shard.cx + rx * c - ry * s + shard.dx * weight, shard.cy + rx * s + ry * c + shard.dy * weight];
  }

  // Coverage of the Black Horizon's ink at (x, y): a warped front that
  // thickens outward and feathers into tendrils, running past the neatline.
  // A finger reaches at most 0.002 + 0.16 * 1.15^2 past the neatline (the
  // largest the noise sums can be), so the margin beyond needs no noise.
  const FINGER_MAX = 0.002 + 0.16 * 1.15 * 1.15;
  function bleedAt(x, y, r, px) {
    if (r < 0.975 || r > NEATLINE + FINGER_MAX) return 0;
    const fine = fbm(bleedNoise, x + 11.7, y + 5.2, 60, 8, px);
    // Past the neatline only fingers of ink cross the frame into the margin.
    let outside = 1;
    if (r > NEATLINE) {
      const finger = Math.max(0, fbm(bleedNoise, x + 3.3, y - 8.1, 16, 7, px) + 0.15 * fine);
      const reach = 0.002 + 0.16 * finger * finger;
      outside = clamp01((reach - (r - NEATLINE)) / px + 0.5);
      if (outside === 0) return 0;
    }
    const n = fbm(bleedNoise, x, y, 5, 9, px);
    const front = (r - 1.035) / 0.1 + 0.9 * n + 0.25 * fine;
    const edge = Math.max(0.01, (1.5 * px) / 0.1);
    return smoothstep(-edge, edge, front) * outside;
  }

  function paintWindow(x0, y0, px, w, h) {
    // The field and region depths vary over many pixels, so sample them on a
    // coarse grid (with a one-node margin for gradients) and interpolate. The
    // spacing is a power of two, so it divides the tile size and neighboring
    // tiles share their grid nodes.
    const g = 2 ** Math.max(0, Math.min(3, Math.round(Math.log2(0.004 / px))));
    const gw = Math.floor((w - 1) / g) + 4;
    const gh = Math.floor((h - 1) / g) + 4;
    const n = gw * gh;
    const F = new Float64Array(n);
    const GX = new Float64Array(n);
    const GY = new Float64Array(n);
    const VOID = new Float64Array(n);
    const ASHD = new Float64Array(n);
    const FRAC = new Float64Array(n);
    const MOTTLE = new Float64Array(n);
    for (let j = 0; j < gh; j++) {
      const y = y0 - (j - 1) * g * px;
      for (let i = 0; i < gw; i++) {
        const x = x0 + (i - 1) * g * px;
        const k = j * gw + i;
        F[k] = field(x, y);
        VOID[k] = depthOf(masks.void, x, y);
        ASHD[k] = depthOf(masks.ash, x, y);
        FRAC[k] = depthOf(masks.fracture, x, y);
        MOTTLE[k] = mottle(x, y, px);
      }
    }
    const step = 2 * g * px;
    for (let j = 1; j < gh - 1; j++) {
      for (let i = 1; i < gw - 1; i++) {
        const k = j * gw + i;
        GX[k] = (F[k + 1] - F[k - 1]) / step;
        GY[k] = (F[k - gw] - F[k + gw]) / step;
      }
    }
    let ci = 0;
    let fx = 0;
    let fy = 0;
    const locate = (u, v) => {
      const gx = u / g + 1;
      const gy = v / g + 1;
      const i = Math.floor(gx);
      const j = Math.floor(gy);
      fx = gx - i;
      fy = gy - j;
      ci = j * gw + i;
    };
    const at = A => {
      const a = A[ci];
      const b = A[ci + 1];
      const c = A[ci + gw];
      const d = A[ci + gw + 1];
      return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    };

    const rgb = new Float32Array(w * h * 3);
    const voidCover = new Float32Array(w * h);
    const shardShift = new Float32Array(w * h * 2);
    const paper = new Float32Array(w * h);

    // Distance in pixels from value f to the nearest contour of a class,
    // and how much that class shows given its spacing on the page.
    function contourInk(f, grad, isGhost) {
      const unit = Math.max(grad * px, 1e-9);
      let k = Math.round(f / CONTOUR_STEP);
      if (k < 1) k = 1;
      if (k > 19) k = 19;
      const level = k * CONTOUR_STEP;
      const major = k % 2 === 0;
      const spec = major ? MAJOR : MINOR;
      const spacing = (major ? 2 * CONTOUR_STEP : CONTOUR_STEP) / unit;
      let cover = clamp01(spec.width / 2 + 0.5 - Math.abs(f - level) / unit) * spec.alpha * smoothstep(spec.crowd[0], spec.crowd[1], spacing);
      for (const extra of EXTRA_CONTOURS) {
        const c = clamp01(MINOR.width / 2 + 0.5 - Math.abs(f - extra) / unit) * MINOR.alpha * smoothstep(MINOR.crowd[0], MINOR.crowd[1], 0.03 / unit);
        if (c > cover) cover = c;
      }
      return isGhost ? cover * 0.9 : cover;
    }

    const exact = (x, y) => {
      const f = field(x, y);
      const gx = (field(x + px, y) - f) / px;
      const gy = (field(x, y + px) - f) / px;
      return [f, Math.hypot(gx, gy)];
    };

    for (let v = 0; v < h; v++) {
      const y = y0 - v * px;
      for (let u = 0; u < w; u++) {
        const x = x0 + u * px;
        const p = v * w + u;
        locate(u, v);
        let f = at(F);
        let grad = Math.hypot(at(GX), at(GY));
        const fracDepth = at(FRAC);
        const ashDepth = at(ASHD);
        const voidDepth = at(VOID);
        voidCover[p] = clamp01(voidDepth / px + 0.5);
        if (voidCover[p] >= 1) continue;
        const r = Math.hypot(x, y);

        // The Gap: sample the chart through this pixel's shard.
        let shard = null;
        let shardWeight = 0;
        let sx = x;
        let sy = y;
        if (fracDepth > -px) {
          shardWeight = clamp01(fracDepth / px + 0.5);
          shard = shardAt(x, y);
          [sx, sy] = throughShard(shard, x, y, shardWeight);
          shardShift[p * 2] = sx - x;
          shardShift[p * 2 + 1] = sy - y;
          [f, grad] = exact(sx, sy);
        }

        // 1. Stepped tint, antialiased across each band edge.
        const unit = Math.max(grad * px, 1e-9);
        let cr = TINTS[0][0];
        let cg = TINTS[0][1];
        let cb = TINTS[0][2];
        for (let k = 0; k < TINT_STOPS.length; k++) {
          const t = (f - TINT_STOPS[k]) / unit + 0.5;
          if (t <= 0) break;
          const s = t >= 1 ? 1 : t;
          cr += tintDelta[k][0] * s;
          cg += tintDelta[k][1] * s;
          cb += tintDelta[k][2] * s;
        }

        // The Remnant Seas: ash, streaked around each pocket's center, its
        // edge eaten ragged past the drawn pocket.
        let ash = 0;
        if (ashDepth > -2 * blend) {
          ash = smoothstep(-0.006, blend * 0.8, ashDepth + 0.014 * fbm(noise, x - 9.1, y + 2.7, 30, 6, px));
          let streak = 0;
          if (ash > 0) {
            let best = Infinity;
            let cx = 0;
            let cy = 0;
            for (const [px0, py0] of pocketCenters) {
              const d = Math.hypot(x - px0, y - py0);
              if (d < best) { best = d; cx = px0; cy = py0; }
            }
            // Streaks sheared along the pocket's orbit: long along the
            // tangent of the galaxy's rotation, fine across it.
            const cr0 = Math.hypot(cx, cy) || 1;
            const tx = -cy / cr0;
            const ty = cx / cr0;
            const along = (x - cx) * tx + (y - cy) * ty;
            const across = (x - cx) * ty - (y - cy) * tx;
            streak = fbm(noise, along * 0.1 + cx * 5, across + cy * 5, 180, 7, px) + 0.3 * fbm(noise, x + 4.4, y - 2.2, 25, 4, px);
          }
          const tex = 1 + 0.85 * streak;
          cr += (ASH[0] * tex - cr) * ash;
          cg += (ASH[1] * tex - cg) * ash;
          cb += (ASH[2] * tex - cb) * ash;
        }

        if (shard) {
          const shade = 1 + shard.tint * shardWeight;
          cr *= shade; cg *= shade; cb *= shade;
        }

        // 2. Paper grain.
        const paperGrain = 1 + at(MOTTLE) + fibers(x, y, px);
        paper[p] = paperGrain;
        cr *= paperGrain; cg *= paperGrain; cb *= paperGrain;

        // 3. Isopleths, inked light on dark tints and dark on light ones.
        const light = smoothstep(95, 125, luminance(cr, cg, cb));
        const inkR = LIGHT_INK[0] + (DARK_INK[0] - LIGHT_INK[0]) * light;
        const inkG = LIGHT_INK[1] + (DARK_INK[1] - LIGHT_INK[1]) * light;
        const inkB = LIGHT_INK[2] + (DARK_INK[2] - LIGHT_INK[2]) * light;
        if (r < NEATLINE + 0.002) {
          // Scar tissue swallows the isopleths.
          const cover = contourInk(f, grad, false) * (1 - 0.85 * ash);
          if (cover > 0) {
            cr += (inkR - cr) * cover; cg += (inkG - cg) * cover; cb += (inkB - cb) * cover;
          }
          if (shard) {
            // Two screens per shard and their moire, then the second print
            // of the linework, out of register.
            const screen = (hx, hy, angle) => {
              const t = (hx * Math.cos(angle) + hy * Math.sin(angle)) / SCREEN.spacing;
              const dist = (Math.abs(t - Math.round(t)) * SCREEN.spacing) / px;
              return clamp01(0.9 - dist) * SCREEN.alpha * smoothstep(3.5, 8, SCREEN.spacing / px);
            };
            const second = SCREEN_ANGLE + shard.skew;
            // Fringes: the beat between the screens, a broad wave at every
            // zoom (its wavelength is the spacing over 2 sin(skew / 2)).
            const beat = (2 * Math.PI) / SCREEN.spacing;
            const phase = beat * ((sx * Math.cos(SCREEN_ANGLE) + sy * Math.sin(SCREEN_ANGLE)) - (sx * Math.cos(second) + sy * Math.sin(second)));
            const fringeWave = SCREEN.spacing / (2 * Math.abs(Math.sin(shard.skew / 2)));
            const fringe = (0.5 + 0.5 * Math.cos(phase)) * 0.05 * shardWeight * smoothstep(2, 5, fringeWave / px);
            cr += (inkR - cr) * fringe; cg += (inkG - cg) * fringe; cb += (inkB - cb) * fringe;
            const first = screen(sx, sy, SCREEN_ANGLE) * shardWeight;
            if (first > 0) {
              cr += (inkR - cr) * first; cg += (inkG - cg) * first; cb += (inkB - cb) * first;
            }
            const [gf, gg] = exact(sx - MISREGISTER[0], sy - MISREGISTER[1]);
            const ghost = Math.max(contourInk(gf, gg, true), screen(sx - MISREGISTER[0], sy - MISREGISTER[1], second)) * shardWeight;
            if (ghost > 0) {
              cr += (GHOST_INK[0] - cr) * ghost; cg += (GHOST_INK[1] - cg) * ghost; cb += (GHOST_INK[2] - cb) * ghost;
            }
          }
        }

        const o = p * 3;
        rgb[o] = cr; rgb[o + 1] = cg; rgb[o + 2] = cb;
      }
    }

    for (const layer of layers) layer.paint({ rgb, w, h, x0, y0, px, voidCover, shardShift, shardReach: SHARD_REACH, field });

    paintStars(rgb, w, h, x0, y0, px);

    // Voids, the Horizon's ink, its knots, and the frame.
    for (let v = 0; v < h; v++) {
      const y = y0 - v * px;
      for (let u = 0; u < w; u++) {
        const x = x0 + u * px;
        const p = v * w + u;
        const o = p * 3;
        let cr = rgb[o];
        let cg = rgb[o + 1];
        let cb = rgb[o + 2];
        const hole = voidCover[p];
        if (hole > 0) {
          cr += (VOID_COLOR[0] - cr) * hole; cg += (VOID_COLOR[1] - cg) * hole; cb += (VOID_COLOR[2] - cb) * hole;
        }
        const r = Math.hypot(x, y);
        if (r > NEATLINE - 0.25) {
          [cr, cg, cb] = paintRim(cr, cg, cb, x, y, r, px, paper[p] || grain(x, y, px));
        }
        rgb[o] = cr; rgb[o + 1] = cg; rgb[o + 2] = cb;
      }
    }

    const out = Buffer.alloc(w * h * 3);
    for (let k = 0; k < out.length; k++) {
      const value = Math.round(rgb[k]);
      out[k] = value < 0 ? 0 : value > 255 ? 255 : value;
    }
    return out;
  }

  // The Black Horizon's ink, the lensing knots, and the frame.
  function paintRim(cr, cg, cb, x, y, r, px, paperGrain) {
    const line = (radius, width) => clamp01(width / 2 + 0.5 - Math.abs(r - radius) / px);
    const hair = Math.max(0.9, 0.0006 / px);
    if (r > NEATLINE) {
      // The frame: degree bars between two rules, ticks, and an outer rule.
      let theta = (Math.atan2(y, x) * 180) / Math.PI;
      if (theta < 0) theta += 360;
      const pxDeg = (px / r) * (180 / Math.PI);
      cr = PAPER[0] * paperGrain;
      cg = PAPER[1] * paperGrain;
      cb = PAPER[2] * paperGrain;
      if (r <= FRAME_OUT + 0.01) {
        if (r >= BAR_IN && r <= BAR_OUT) {
          const filled = Math.floor(theta / 5) % 2 === 0;
          const edgeDist = Math.min(theta % 5, 5 - (theta % 5)) / pxDeg;
          const fill = filled ? 0.62 * clamp01(edgeDist + 0.5) : 0;
          cr += (LIGHT_INK[0] - cr) * fill; cg += (LIGHT_INK[1] - cg) * fill; cb += (LIGHT_INK[2] - cb) * fill;
        }
        if (r > BAR_OUT && r <= TICK_OUT) {
          const tickDist = Math.min(theta % 1, 1 - (theta % 1)) / pxDeg;
          const tick = clamp01(hair / 2 + 0.5 - tickDist) * (Math.round(theta) % 5 === 0 || r < BAR_OUT + 0.4 * (TICK_OUT - BAR_OUT) ? 0.75 : 0);
          cr += (LIGHT_INK[0] - cr) * tick; cg += (LIGHT_INK[1] - cg) * tick; cb += (LIGHT_INK[2] - cb) * tick;
        }
      }
      const rules = Math.max(line(BAR_IN, hair), line(BAR_OUT, hair), line(FRAME_OUT, hair * 1.8)) * 0.8;
      cr += (LIGHT_INK[0] - cr) * rules; cg += (LIGHT_INK[1] - cg) * rules; cb += (LIGHT_INK[2] - cb) * rules;
    }
    const neat = line(NEATLINE, hair * 1.3) * 0.85;
    cr += (LIGHT_INK[0] - cr) * neat; cg += (LIGHT_INK[1] - cg) * neat; cb += (LIGHT_INK[2] - cb) * neat;

    const ink = bleedAt(x, y, r, px);
    if (ink > 0) {
      cr += (BLEED_INK[0] - cr) * ink; cg += (BLEED_INK[1] - cg) * ink; cb += (BLEED_INK[2] - cb) * ink;
    }

    for (const [kx, ky] of knots) {
      const d = Math.hypot(x - kx, y - ky);
      if (d > KNOT.halo * 1.5) continue;
      const a = Math.atan2(y - ky, x - kx);
      const halo = 0.16 * Math.exp(-(((d - KNOT.ring) / (KNOT.halo * 0.35)) ** 2));
      const arcs = 0.35 + 0.65 * Math.abs(Math.cos(a + kx * 40));
      const ringWidth = Math.max(0.9, 0.0007 / px);
      const ring = clamp01(ringWidth / 2 + 0.5 - Math.abs(d - KNOT.ring) / px) * arcs;
      const glow = Math.max(halo, ring * 0.9);
      cr += (232 - cr) * glow; cg += (236 - cg) * glow; cb += (244 - cb) * glow;
      const core = clamp01((KNOT.core - d) / px + 0.5);
      cr += (0 - cr) * core; cg += (0 - cg) * core; cb += (0 - cb) * core;
    }
    return [cr, cg, cb];
  }

  // Stars: per class, one candidate per world cell, visible once the cell
  // spans a few pixels. Each is decided from the field at its exact world
  // position, never from a tile's grid, so neighboring tiles agree.
  function paintStars(rgb, w, h, x0, y0, px) {
    const xMinW = x0 - px;
    const xMaxW = x0 + w * px;
    const yMaxW = y0 + px;
    const yMinW = y0 - h * px;
    const splat = (sx, sy, radius, bright, color, adapt) => {
      const su = (sx - x0) / px;
      const sv = (y0 - sy) / px;
      const rPx = radius / px;
      // A star is a chart symbol: past a few pixels it grows only slowly,
      // so the deepest zoom shows points, not discs.
      const drawn = rPx <= 2.6 ? Math.max(0.6, rPx) : 2.6 + 0.4 * Math.sqrt(rPx - 2.6);
      const flux = rPx < 0.6 ? (rPx / 0.6) ** 2 : 1;
      const span = Math.ceil(drawn + 1);
      for (let dv = -span; dv <= span; dv++) {
        const pv = Math.round(sv) + dv;
        if (pv < 0 || pv >= h) continue;
        for (let du = -span; du <= span; du++) {
          const pu = Math.round(su) + du;
          if (pu < 0 || pu >= w) continue;
          const a = clamp01(drawn + 0.5 - Math.hypot(pu - su, pv - sv)) * bright * flux;
          if (a < 0.004) continue;
          const k = (pv * w + pu) * 3;
          let c = color;
          if (adapt && luminance(rgb[k], rgb[k + 1], rgb[k + 2]) > 110) c = DARK_INK;
          rgb[k] += (c[0] - rgb[k]) * a;
          rgb[k + 1] += (c[1] - rgb[k + 1]) * a;
          rgb[k + 2] += (c[2] - rgb[k + 2]) * a;
        }
      }
    };

    for (const cls of STAR_CLASSES) {
      const cellPx = cls.cell / px;
      if (cellPx < 3) continue;
      const fade = Math.min(1, (cellPx - 3) / 3);
      const reach = cls.radius * 2 + SHARD_REACH + 2 * px;
      for (let i = Math.floor((xMinW - reach) / cls.cell); i <= Math.floor((xMaxW + reach) / cls.cell); i++) {
        for (let j = Math.floor((yMinW - reach) / cls.cell); j <= Math.floor((yMaxW + reach) / cls.cell); j++) {
          const sx = (i + hash2(i, j, cls.salt)) * cls.cell;
          const sy = (j + hash2(i, j, cls.salt + 1)) * cls.cell;
          const r = Math.hypot(sx, sy);
          if (r > NEATLINE) continue;
          if (depthOf(masks.void, sx, sy) > 0) continue;
          const density = Math.max(0, field(sx, sy));
          const ash = depthOf(masks.ash, sx, sy) > 0;
          const chance = ash ? 0.45 : 0.04 + 0.62 * Math.pow(density, 1.25);
          if (hash2(i, j, cls.salt + 2) > chance) continue;
          const roll = hash2(i, j, cls.salt + 3);
          const bright = cls.gain * fade * (ash ? 0.55 : 1) * (0.3 + 0.7 * roll * roll * roll) * (0.5 + 0.5 * density);
          const radius = cls.radius * (0.6 + 0.8 * roll);
          const color = ash ? CINDER : STAR;
          const frac = depthOf(masks.fracture, sx, sy);
          if (frac > -0.004) {
            // In the Gap a star shows through its shard, printed twice.
            const weight = smoothstep(-0.004, 0.005, frac);
            const shard = shardAt(sx, sy);
            const back = { ...shard, turn: -shard.turn, dx: -shard.dx, dy: -shard.dy };
            const [qx, qy] = throughShard(back, sx, sy, weight);
            splat(qx, qy, radius, bright, color, true);
            splat(qx + MISREGISTER[0], qy + MISREGISTER[1], radius, bright * 0.55 * weight, GHOST_INK, false);
          } else {
            splat(sx, sy, radius, bright, color, true);
          }
        }
      }
    }

    // Reliquary shards glinting in the Remnant Seas: four-pointed sparks.
    const cellPx = GLINTS.cell / px;
    if (cellPx >= 4) {
      const fade = Math.min(1, (cellPx - 4) / 4);
      const reach = GLINTS.size * 3;
      for (let i = Math.floor((xMinW - reach) / GLINTS.cell); i <= Math.floor((xMaxW + reach) / GLINTS.cell); i++) {
        for (let j = Math.floor((yMinW - reach) / GLINTS.cell); j <= Math.floor((yMaxW + reach) / GLINTS.cell); j++) {
          if (hash2(i, j, GLINTS.salt) > GLINTS.chance) continue;
          const gx = (i + hash2(i, j, GLINTS.salt + 1)) * GLINTS.cell;
          const gy = (j + hash2(i, j, GLINTS.salt + 2)) * GLINTS.cell;
          if (depthOf(masks.ash, gx, gy) < 0.004) continue;
          const size = Math.max(2.5, (GLINTS.size * (0.5 + hash2(i, j, GLINTS.salt + 3))) / px);
          const thin = Math.max(0.5, size * 0.09);
          const su = (gx - x0) / px;
          const sv = (y0 - gy) / px;
          const span = Math.ceil(size);
          for (let dv = -span; dv <= span; dv++) {
            const pv = Math.round(sv) + dv;
            if (pv < 0 || pv >= h) continue;
            for (let du = -span; du <= span; du++) {
              const pu = Math.round(su) + du;
              if (pu < 0 || pu >= w) continue;
              const ax = Math.abs(pu - su);
              const ay = Math.abs(pv - sv);
              const ray = Math.max(clamp01(thin + 0.5 - ay) * (1 - ax / size), clamp01(thin + 0.5 - ax) * (1 - ay / size));
              const a = clamp01(ray) * 0.85 * fade;
              if (a < 0.004) continue;
              const k = (pv * w + pu) * 3;
              rgb[k] += (GLINT[0] - rgb[k]) * a;
              rgb[k + 1] += (GLINT[1] - rgb[k + 1]) * a;
              rgb[k + 2] += (GLINT[2] - rgb[k + 2]) * a;
            }
          }
        }
      }
    }
  }

  // A pyramid tile: level `levelInfo`, column `col`, row `row`.
  function paint(levelInfo, col, row, tile, extent = layout.IMAGE_EXTENT) {
    const { dim } = levelInfo;
    const w = Math.min(tile, dim - col * tile);
    const h = Math.min(tile, dim - row * tile);
    const px = (2 * extent) / dim;
    const x0 = -extent + (col * tile + 0.5) * px;
    const y0 = extent - (row * tile + 0.5) * px;
    return { buffer: paintWindow(x0, y0, px, w, h), width: w, height: h };
  }

  return { paint, paintWindow, field, masks, shardAt, throughShard, network: lanes };
}

module.exports = { createPainter, hash2, mulberry32, TINT_STOPS, TINTS, VOID_COLOR, NEATLINE, FRAME_OUT, SHARD_REACH, MISREGISTER };
