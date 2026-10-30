// Paints a Z3 inset plate (scripts/map/insets.js) on the chart's own dark
// paper, in the chart's inks, so a plate reads as part of the same sheet.
//
// The painter works in chart coordinates, like the chart painter, so the
// deep-zoom renderer and the frame renderer drive both the same way. Each
// pixel is mapped into plate units and every primitive is evaluated there,
// at the pixel's exact position, so neighboring tiles agree at their seams
// and the same inputs give the same bytes. Lines keep a least width in
// pixels and grow to their width in plate units as the plate is zoomed.
// A lost place is painted last, in the Void color, with an eroded edge:
// nothing inside it survives (rule R13). The raster carries no text
// (rule R14); every label is live in the viewer.

const layout = require('./layout');
const insetsLib = require('./insets');
const { toXY } = require('./geometry');
const { createPaperGrain, mulberry32, PAPER, LIGHT_INK, GHOST_INK, VOID_COLOR } = require('./painter');

const DEG = Math.PI / 180;
// Plate units to paper units, so the plate's grain matches the chart's
// paper at the size the plate is read.
const GRAIN_SCALE = 0.00026;
const GHOST_ALPHA = 0.55;

const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);

function segDistance(px, py, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
  return { d: Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy)), along: t * Math.sqrt(len2) };
}

// Angle of (dx, dy) in degrees from +x toward +y, measured from `from`
// into [0, 360).
function sweep(dx, dy, from) {
  let a = Math.atan2(dy, dx) / DEG - from;
  a %= 360;
  if (a < 0) a += 360;
  return a;
}

function arcDistance(px, py, p) {
  const dx = px - p.c[0];
  const dy = py - p.c[1];
  const rho = Math.hypot(dx, dy);
  const span = p.to - p.from;
  if (span >= 360) return { d: Math.abs(rho - p.r), along: sweep(dx, dy, 0) * DEG * p.r };
  const a = sweep(dx, dy, p.from);
  if (a <= span) return { d: Math.abs(rho - p.r), along: a * DEG * p.r };
  const end = (angle) => [p.c[0] + p.r * Math.cos(angle * DEG), p.c[1] + p.r * Math.sin(angle * DEG)];
  const [ax, ay] = end(p.from);
  const [bx, by] = end(p.to);
  return { d: Math.min(Math.hypot(px - ax, py - ay), Math.hypot(px - bx, py - by)), along: 0 };
}

// Signed depth into an annular sector (positive inside), in plate units.
function sectorDepth(px, py, p) {
  const dx = px - p.c[0];
  const dy = py - p.c[1];
  const rho = Math.hypot(dx, dy);
  let depth = Math.min(rho - p.r0, p.r1 - rho);
  const span = p.to - p.from;
  if (span < 360) {
    const a = sweep(dx, dy, p.from);
    const angular = a <= span ? Math.min(a, span - a) * DEG * rho : -Math.min(a - span, 360 - a) * DEG * rho;
    depth = Math.min(depth, angular);
  }
  return depth;
}

function rectDepth(px, py, r) {
  return Math.min(px - r.x, r.x + r.w - px, py - r.y, r.y + r.h - py);
}

// A primitive's bounding box in plate units, padded by `pad`.
function bbox(p, pad) {
  switch (p.type) {
    case 'seg':
      return [Math.min(p.a[0], p.b[0]) - pad, Math.min(p.a[1], p.b[1]) - pad, Math.max(p.a[0], p.b[0]) + pad, Math.max(p.a[1], p.b[1]) + pad];
    case 'arc':
      return [p.c[0] - p.r - pad, p.c[1] - p.r - pad, p.c[0] + p.r + pad, p.c[1] + p.r + pad];
    case 'disc':
      return [p.c[0] - p.r - pad, p.c[1] - p.r - pad, p.c[0] + p.r + pad, p.c[1] + p.r + pad];
    case 'sector':
    case 'hatch':
      return [p.c[0] - p.r1 - pad, p.c[1] - p.r1 - pad, p.c[0] + p.r1 + pad, p.c[1] + p.r1 + pad];
    case 'rect':
      return [p.x - pad, p.y - pad, p.x + p.w + pad, p.y + p.h + pad];
    default:
      throw new Error(`unknown primitive type ${p.type}`);
  }
}

// How much ink a primitive lays at plate point (u, v), with pixels of size
// `pu` plate units.
function coverage(p, u, v, pu) {
  if (p.type === 'seg' || p.type === 'arc') {
    const width = Math.max(p.weight.px * pu, p.weight.units);
    const { d, along } = p.type === 'seg' ? segDistance(u, v, p.a, p.b) : arcDistance(u, v, p);
    let cover = clamp01(width / (2 * pu) + 0.5 - d / pu) * p.weight.alpha;
    if (cover > 0 && p.dash) {
      const period = p.dash[0] + p.dash[1];
      const m = along % period;
      cover *= clamp01((p.dash[0] - m) / pu + 0.5) * clamp01(m / pu + 0.5);
    }
    return cover;
  }
  if (p.type === 'disc') return clamp01((p.r - Math.hypot(u - p.c[0], v - p.c[1])) / pu + 0.5) * p.alpha;
  if (p.type === 'rect') return clamp01(rectDepth(u, v, p) / pu + 0.5) * p.alpha;
  if (p.type === 'sector') return clamp01(sectorDepth(u, v, p) / pu + 0.5) * p.alpha;
  if (p.type === 'hatch') {
    const inside = clamp01(sectorDepth(u, v, p) / pu + 0.5);
    if (inside === 0) return 0;
    const a = p.angle * DEG;
    const t = (u * Math.cos(a) + v * Math.sin(a)) / p.spacing;
    const dist = Math.abs(t - Math.round(t)) * p.spacing;
    const width = Math.max(0.8 * pu, 0.5);
    return inside * clamp01(width / (2 * pu) + 0.5 - dist / pu) * p.alpha;
  }
  return 0;
}

// Builds the painter for one inset in one era. `era` is "before", "after",
// or "both" for a plate with no breach states.
function createInsetPainter(root, { build = 'author', inset: key, era = 'after' } = {}) {
  const { createNoise2D } = require('simplex-noise');
  const context = layout.loadMapContext(root);
  const { cartography, atlas } = context;
  const inset = (cartography.insets || []).find(entry => entry.key === key);
  if (!inset) throw new Error(`no inset "${key}" in ${layout.CARTOGRAPHY_PATH}`);
  const eraList = inset.eras.includes('both') ? ['both'] : inset.eras;
  if (!eraList.includes(era)) throw new Error(`inset "${key}" has no ${era} era (it has ${eraList.join(', ')})`);
  const site = cartography.sites.find(entry => entry.id === inset.site);
  const entity = atlas.get(inset.site);
  if (!site || !entity) throw new Error(`inset "${key}" names site ${inset.site}, which is not placed`);
  if (build === 'public' && !layout.CANON_TIERS.has(entity.tier)) throw new Error(`inset "${key}" sits at a ${entity.tier} site and is not in the public build`);
  const frame = insetsLib.plateFrame(inset, toXY(site.at.r, site.at.theta));
  const { primitives, lost } = insetsLib.expandInset(inset, { era: era === 'both' ? 'after' : era, build });
  const paper = createPaperGrain();
  const erosion = createNoise2D(mulberry32(4001));
  const fills = primitives.filter(p => !p.ghost && ['disc', 'rect', 'sector', 'hatch'].includes(p.type));
  const lines = primitives.filter(p => !p.ghost && (p.type === 'seg' || p.type === 'arc'));
  const ghosts = primitives.filter(p => p.ghost);
  const { scale, rect } = frame;

  function paintWindow(x0, y0, px, w, h) {
    const pu = px / scale;
    const u0 = (x0 - rect.left) / scale;
    const v0 = (rect.top - y0) / scale;
    const window = [u0 - pu, v0 - pu, u0 + w * pu, v0 + h * pu];
    const near = list => list.map(p => {
      const pad = ((p.weight ? p.weight.units + p.weight.px * pu : 0) / 2) + 2 * pu;
      return { p, box: bbox(p, pad) };
    }).filter(({ box }) => box[0] <= window[2] && box[2] >= window[0] && box[1] <= window[3] && box[3] >= window[1]);
    const fillList = near(fills);
    const lineList = near(lines);
    const ghostList = near(ghosts);
    const lostList = lost.filter(({ rect: r, erode }) => r.x - erode - pu <= window[2] && r.x + r.w + erode + pu >= window[0] && r.y - erode - pu <= window[3] && r.y + r.h + erode + pu >= window[1]);
    const out = Buffer.alloc(w * h * 3);
    for (let j = 0; j < h; j++) {
      const v = v0 + j * pu;
      for (let i = 0; i < w; i++) {
        const u = u0 + i * pu;
        const g = paper.grain(u * GRAIN_SCALE, v * GRAIN_SCALE, pu * GRAIN_SCALE);
        let r = PAPER[0] * g;
        let gg = PAPER[1] * g;
        let b = PAPER[2] * g;
        const lay = (list, ink, gain) => {
          for (const { p, box } of list) {
            if (u < box[0] || u > box[2] || v < box[1] || v > box[3]) continue;
            const c = coverage(p, u, v, pu) * gain;
            if (c <= 0) continue;
            r += (ink[0] - r) * c;
            gg += (ink[1] - gg) * c;
            b += (ink[2] - b) * c;
          }
        };
        lay(fillList, LIGHT_INK, 1);
        lay(lineList, LIGHT_INK, 1);
        lay(ghostList, GHOST_INK, GHOST_ALPHA);
        // A lost place: the Void color over everything, its edge eroded.
        for (const place of lostList) {
          const depth = rectDepth(u, v, place.rect) + place.erode * (0.7 * erosion(u * 0.035 + place.seed * 17.1, v * 0.035 - place.seed * 5.3) + 0.3 * erosion(u * 0.11 - place.seed * 3.7, v * 0.11 + place.seed * 9.2));
          const hole = clamp01(depth / pu + 0.5);
          if (hole <= 0) continue;
          r += (VOID_COLOR[0] - r) * hole;
          gg += (VOID_COLOR[1] - gg) * hole;
          b += (VOID_COLOR[2] - b) * hole;
        }
        const o = (j * w + i) * 3;
        out[o] = Math.max(0, Math.min(255, Math.round(r)));
        out[o + 1] = Math.max(0, Math.min(255, Math.round(gg)));
        out[o + 2] = Math.max(0, Math.min(255, Math.round(b)));
      }
    }
    return out;
  }

  return { frame, inset, era, lost, primitives, paintWindow };
}

module.exports = { createInsetPainter, coverage, sectorDepth, rectDepth, GRAIN_SCALE };
