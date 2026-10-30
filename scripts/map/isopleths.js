// Isopleth labels for the atlas map viewer.
//
// The tiles draw the isopleths (scripts/map/painter.js); this module picks
// where their values are printed, the way a chart labels depth contours.
// Labels go on major isopleths only, spaced along each line, and never
// inside a Void Region (nothing is charted there), in the Remnant Seas'
// scar tissue, in the Lattice Gap, past the Black Horizon's near edge, or on
// top of a placed site. A label is an interpolation-band value, not a
// measurement; soundings are the only measured numbers on the chart.

const { TINT_STOPS, TINTS } = require('./painter');

const GRID = 480;          // cells across [-1, 1]
const EXTENT = 1.0;
const SAME_LEVEL_GAP = 0.3; // chart units between labels on one level
const ANY_LEVEL_GAP = 0.085;
const SITE_GAP = 0.05;
const VOID_GAP = 0.06;
const MIN_SPACING = 0.035;  // room between neighboring major isopleths

function hash2(i, j, salt) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(salt, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const hex = c => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

// The tint either side of a level, averaged: the label's knockout color.
function bandColors(level) {
  let k = 0;
  while (k < TINT_STOPS.length && TINT_STOPS[k] < level - 1e-9) k++;
  const below = TINTS[k];
  const above = TINTS[Math.min(TINTS.length - 1, k + 1)];
  const bg = below.map((v, i) => (v + above[i]) / 2);
  const luminance = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  return { bg: hex(bg), ink: luminance > 110 ? 'dark' : 'light' };
}

/**
 * @param {object} options
 * @param {(x:number, y:number) => number} options.field
 * @param {(x:number, y:number) => number} options.voidDepth
 * @param {(x:number, y:number) => number} options.ashDepth
 * @param {(x:number, y:number) => number} options.fractureDepth
 * @param {number[][]} options.avoid  points (sites, features) to keep clear
 * @param {number[]} [options.levels]
 */
function placeIsoplethLabels({ field, voidDepth, ashDepth, fractureDepth, avoid = [], levels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] }) {
  const n = GRID;
  const cell = (2 * EXTENT) / n;
  const values = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) values[j * (n + 1) + i] = field(-EXTENT + i * cell, -EXTENT + j * cell);
  }
  const node = (i, j) => values[j * (n + 1) + i];

  const candidates = [];
  levels.forEach((level, li) => {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        // Marching squares: where the level crosses this cell's edges.
        const corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
        const crossings = [];
        for (let e = 0; e < 4; e++) {
          const [ai, aj] = corners[e];
          const [bi, bj] = corners[(e + 1) % 4];
          const a = node(ai, aj) - level;
          const b = node(bi, bj) - level;
          if ((a < 0) === (b < 0)) continue;
          const t = a / (a - b);
          crossings.push([-EXTENT + (ai + (bi - ai) * t) * cell, -EXTENT + (aj + (bj - aj) * t) * cell]);
        }
        if (crossings.length !== 2) continue;
        candidates.push({ level, li, x: (crossings[0][0] + crossings[1][0]) / 2, y: (crossings[0][1] + crossings[1][1]) / 2, order: hash2(i, j, 401 + li) });
      }
    }
  });
  candidates.sort((a, b) => a.order - b.order || a.li - b.li);

  const placed = [];
  for (const c of candidates) {
    const r = Math.hypot(c.x, c.y);
    if (r < 0.14 || r > 0.97) continue;
    // Labels are a fixed pixel size with an opaque knockout, so keep them
    // well clear of the Voids even on a small screen at the zoom they appear.
    if (voidDepth(c.x, c.y) > -VOID_GAP || ashDepth(c.x, c.y) > -0.025 || fractureDepth(c.x, c.y) > -0.02) continue;
    if (avoid.some(([x, y]) => Math.hypot(x - c.x, y - c.y) < SITE_GAP)) continue;
    if (placed.some(p => Math.hypot(p.xy[0] - c.x, p.xy[1] - c.y) < (p.value === c.level ? SAME_LEVEL_GAP : ANY_LEVEL_GAP))) continue;
    const h = 0.002;
    const gx = (field(c.x + h, c.y) - field(c.x - h, c.y)) / (2 * h);
    const gy = (field(c.x, c.y + h) - field(c.x, c.y - h)) / (2 * h);
    const slope = Math.hypot(gx, gy);
    if (!(slope > 0) || 0.1 / slope < MIN_SPACING) continue;
    // Along the line, turned to read left to right.
    let angle = (Math.atan2(gx, -gy) * 180) / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle <= -90) angle += 180;
    placed.push({ value: c.level, label: c.level.toFixed(1), xy: [Number(c.x.toFixed(5)), Number(c.y.toFixed(5))], angle: Number(angle.toFixed(1)), ...bandColors(c.level) });
  }
  return placed.sort((a, b) => a.value - b.value || a.xy[0] - b.xy[0]);
}

module.exports = { placeIsoplethLabels, bandColors };
