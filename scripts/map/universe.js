// The Z0 universe scaffold (decision Q34; rules R8, R18).
//
// Dark matter is the universe's unconscious archive, which "generates
// gravitational scaffolding" (mechanics/MEMORY_PHYSICS.md 3.3). The scaffold
// draws that as a faint field of filaments around the known galaxy and
// nothing else: no labels, and no nodes, knots, halos, or discs, so nothing
// reads as another galaxy (claim T12) or as one of Heavonly's gateways,
// whose count is unsettled (decision D4). Each filament is the ridge of a
// smooth noise field; two families are combined by taking the larger, so a
// crossing is never brighter than a filament. The center is clear to the
// chart's neatline, where the galaxy shows through, and filaments fade
// short of it so none reads as a halo. Pixels are RGBA, decided at their
// exact chart position, so the output is deterministic.

const layout = require('./layout');
const { createPaperGrain, mulberry32 } = require('./painter');
const { smoothstep } = require('./field');

const BASE = [9, 11, 16];
const FILAMENT = [150, 170, 192];
const FILAMENT_ALPHA = 0.55;
// A filament's half-width in chart units (the galaxy's radius is 1.2).
const FILAMENT_WIDTH = 0.06;

function createUniversePainter(root, { build = 'author' } = {}) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  const { createNoise2D } = require('simplex-noise');
  const { cartography } = layout.loadMapContext(root);
  const spec = cartography.universe;
  if (!spec) throw new Error(`${layout.CARTOGRAPHY_PATH} has no universe entry`);
  const warp = createNoise2D(mulberry32(5101));
  const coarse = createNoise2D(mulberry32(5102));
  const fine = createNoise2D(mulberry32(5103));
  const paper = createPaperGrain();
  const { extent, hole } = spec;

  // A family of filaments is the zero line of a warped noise field. Its
  // strength falls with distance from that line (the value over its
  // gradient), so every filament keeps one width and none swells into a
  // knot where the field flattens.
  const family = (noise, f) => (x, y) => {
    const wx = x + 0.9 * warp(x * 0.12, y * 0.12);
    const wy = y + 0.9 * warp(x * 0.12 + 31.7, y * 0.12 - 11.3);
    return noise(wx * f, wy * f);
  };
  const coarseField = family(coarse, 0.2);
  const fineField = family(fine, 0.45);
  const STEP = 0.01;
  function line(g, x, y, width) {
    const gx = (g(x + STEP, y) - g(x - STEP, y)) / (2 * STEP);
    const gy = (g(x, y + STEP) - g(x, y - STEP)) / (2 * STEP);
    const distance = Math.abs(g(x, y)) / (Math.hypot(gx, gy) + 1e-6);
    const t = Math.max(0, 1 - distance / width);
    return t * t;
  }

  // Filament strength in [0, 1] at chart point (x, y).
  function filamentAt(x, y) {
    const strength = Math.max(line(coarseField, x, y, FILAMENT_WIDTH), 0.4 * line(fineField, x, y, FILAMENT_WIDTH * 0.6));
    const r = Math.hypot(x, y);
    const near = smoothstep(hole + 0.08, hole + 0.7, r);
    const far = 1 - smoothstep(extent * 0.78, extent, Math.max(Math.abs(x), Math.abs(y)));
    return strength * near * far;
  }

  // Opacity: clear inside the hole, so the chart shows through.
  const alphaAt = r => smoothstep(hole, hole + 0.02, r);

  function paintWindow(x0, y0, px, w, h) {
    const out = Buffer.alloc(w * h * 4);
    for (let j = 0; j < h; j++) {
      const y = y0 - j * px;
      for (let i = 0; i < w; i++) {
        const x = x0 + i * px;
        const r = Math.hypot(x, y);
        const o = (j * w + i) * 4;
        const alpha = alphaAt(r);
        if (alpha <= 0) continue;
        const g = paper.grain(x * 0.02, y * 0.02, px * 0.02);
        const f = filamentAt(x, y) * FILAMENT_ALPHA;
        for (let c = 0; c < 3; c++) out[o + c] = Math.max(0, Math.min(255, Math.round(BASE[c] * g + (FILAMENT[c] - BASE[c] * g) * f)));
        out[o + 3] = Math.round(alpha * 255);
      }
    }
    return out;
  }

  return { spec, filamentAt, alphaAt, paintWindow };
}

module.exports = { createUniversePainter, FILAMENT_ALPHA, FILAMENT_WIDTH };
