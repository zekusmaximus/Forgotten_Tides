// Corridor lanes and eddies for the atlas map, computed from the density
// field rather than drawn by hand (plan section 4.2).
//
// Lanes are where corridors tend to form, not fixed routes: corridors are
// temporary (mechanics/CORRIDOR_MECHANICS.md section 1) and form along
// gradients of memory density (sections 1 and 8). Anonymous hubs are
// sampled where memory is dense, joined by a Gabriel graph, and each edge is
// routed as the least-cost path across a raster of the field, where cost
// rises as density falls. So lanes crowd the Drift, thin through the Lattice
// Gap (its harmonics are disrupted), bend around the Void Regions, and never
// enter them. Lanes join anonymous hubs, never named sites, and no lane is a
// canon route (rule R10).
//
// Eddies are an area pattern of glyphs near the lanes, since eddies are drawn
// to corridor residue (section 5.1; the story bible, section 3.5): frequent in
// the Drift. In the Lattice Gap eddy activity is high (bible, section 4.1) and
// eddies hunt rather than trail corridors (atlas/Lattice_Gap.md), so they are
// also seeded across the Gap itself, denser than anywhere else. Each glyph
// faces up the density gradient, measured at a broad scale so the Gap's flat
// interior still points toward the denser memory beyond it. Count and
// positions carry no canon weight (rule R2).
//
// Everything is deterministic for the same inputs.

const { smoothstep } = require('./field');

const RASTER = 400;            // cells across the raster's square
const RASTER_EXTENT = 1.0;     // the raster spans [-1, 1] on both axes
const HUB_CELL = 0.07;         // one hub candidate per cell
const HUB_BAND = [0.16, 0.92]; // hubs sit between the Core and the Horizon
const NEIGHBORS = 3;           // nearest hubs each hub may join
const MAX_EDGE = 0.26;         // chart units
const EDDY_STEP = 0.028;       // spacing of eddy candidates along a lane
const GAP_EDDY_CELL = 0.024;   // one hunting-eddy candidate per cell in the Gap
const FACING_SCALE = 0.02;     // chart units over which an eddy reads the gradient

function hash2(i, j, salt) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(salt, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// A binary min-heap of [priority, node] pairs, ties broken by node index so
// the search order never depends on insertion timing.
class Heap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(priority, node) {
    const items = this.items;
    items.push([priority, node]);
    let k = items.length - 1;
    while (k > 0) {
      const parent = (k - 1) >> 1;
      if (Heap.less(items[k], items[parent])) {
        [items[k], items[parent]] = [items[parent], items[k]];
        k = parent;
      } else break;
    }
  }
  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length) {
      items[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < items.length && Heap.less(items[l], items[m])) m = l;
        if (r < items.length && Heap.less(items[r], items[m])) m = r;
        if (m === k) break;
        [items[k], items[m]] = [items[m], items[k]];
        k = m;
      }
    }
    return top;
  }
  static less(a, b) { return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]); }
}

// Chaikin corner cutting, keeping the end points.
function smooth(points, rounds = 2) {
  let pts = points;
  for (let n = 0; n < rounds; n++) {
    if (pts.length < 3) return pts;
    const next = [pts[0]];
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k];
      const [bx, by] = pts[k + 1];
      next.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/**
 * @param {object} options
 * @param {(x:number, y:number) => number} options.field  memory density
 * @param {(x:number, y:number) => number} options.voidDepth  signed depth into the Voids
 * @param {(x:number, y:number) => number} options.fractureDepth  signed depth into the Gap
 * @param {(x:number, y:number) => number} options.ashDepth  signed depth into the Seas
 * @returns {{lanes: Array<{points: number[][]}>, eddies: Array<{x:number, y:number, angle:number, size:number, hand:number}>}}
 */
function computeLanes({ field, voidDepth, fractureDepth, ashDepth }) {
  const n = RASTER;
  const cell = (2 * RASTER_EXTENT) / n;
  const toWorld = (i, j) => [-RASTER_EXTENT + (i + 0.5) * cell, RASTER_EXTENT - (j + 0.5) * cell];
  const toCell = (x, y) => [Math.min(n - 1, Math.max(0, Math.floor((x + RASTER_EXTENT) / cell))), Math.min(n - 1, Math.max(0, Math.floor((RASTER_EXTENT - y) / cell)))];

  // Cost per cell; Infinity where no lane may pass.
  const cost = new Float64Array(n * n);
  let cheapest = Infinity;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const [x, y] = toWorld(i, j);
      const r = Math.hypot(x, y);
      let c = Infinity;
      if (r < 0.96 && voidDepth(x, y) < -0.008) {
        const density = Math.max(0, field(x, y));
        c = Math.pow(1 / (density + 0.05), 1.6);
        if (fractureDepth(x, y) > 0) c *= 2.2;
        cheapest = Math.min(cheapest, c);
      }
      cost[j * n + i] = c;
    }
  }

  // Hubs: one jittered candidate per cell, kept with a chance that grows
  // with density.
  const hubs = [];
  const span = Math.ceil(1 / HUB_CELL);
  for (let i = -span; i < span; i++) {
    for (let j = -span; j < span; j++) {
      const x = (i + 0.2 + 0.6 * hash2(i, j, 201)) * HUB_CELL;
      const y = (j + 0.2 + 0.6 * hash2(i, j, 202)) * HUB_CELL;
      const r = Math.hypot(x, y);
      if (r < HUB_BAND[0] || r > HUB_BAND[1]) continue;
      if (voidDepth(x, y) > -0.03 || ashDepth(x, y) > -0.01) continue;
      const density = Math.max(0, field(x, y));
      let chance = 0.12 + 0.95 * Math.pow(density, 1.5);
      if (fractureDepth(x, y) > 0) chance *= 0.5;
      if (hash2(i, j, 203) > chance) continue;
      const [ci, cj] = toCell(x, y);
      if (!Number.isFinite(cost[cj * n + ci])) continue;
      hubs.push([x, y]);
    }
  }

  // Candidate edges: each hub to its nearest neighbors, kept if the edge
  // passes the Gabriel test (no third hub inside the circle on the edge).
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const edges = new Set();
  hubs.forEach((a, ia) => {
    const near = hubs
      .map((b, ib) => [d2(a, b), ib])
      .filter(([d, ib]) => ib !== ia && d <= MAX_EDGE * MAX_EDGE)
      .sort((p, q) => p[0] - q[0] || p[1] - q[1])
      .slice(0, NEIGHBORS);
    for (const [, ib] of near) edges.add(ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`);
  });
  const gabriel = [...edges].sort().map(key => key.split(':').map(Number)).filter(([ia, ib]) => {
    const a = hubs[ia];
    const b = hubs[ib];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const radius2 = d2(a, b) / 4;
    return hubs.every((c, ic) => ic === ia || ic === ib || d2(c, mid) >= radius2);
  });

  // Route each edge as a least-cost path (A*, eight neighbors).
  const steps = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  const gScore = new Float64Array(n * n);
  const came = new Int32Array(n * n);
  const stamp = new Int32Array(n * n);
  let round = 0;
  function route(a, b) {
    round++;
    const [si, sj] = toCell(a[0], a[1]);
    const [ti, tj] = toCell(b[0], b[1]);
    const start = sj * n + si;
    const goal = tj * n + ti;
    const heuristic = k => Math.hypot((k % n) - ti, Math.floor(k / n) - tj) * cheapest;
    const heap = new Heap();
    stamp[start] = round;
    gScore[start] = 0;
    came[start] = -1;
    heap.push(heuristic(start), start);
    const limit = Math.hypot(si - ti, sj - tj) * 2.5 + 12;
    while (heap.size) {
      const [, k] = heap.pop();
      if (k === goal) break;
      const ki = k % n;
      const kj = Math.floor(k / n);
      const base = gScore[k];
      for (const [di, dj, length] of steps) {
        const i = ki + di;
        const j = kj + dj;
        if (i < 0 || j < 0 || i >= n || j >= n) continue;
        // Stay near the straight line so a blocked edge fails fast.
        if (Math.hypot(i - si, j - sj) + Math.hypot(i - ti, j - tj) > limit) continue;
        const m = j * n + i;
        const c = cost[m];
        if (!Number.isFinite(c)) continue;
        const g = base + ((cost[k] + c) / 2) * length;
        if (stamp[m] !== round || g < gScore[m]) {
          stamp[m] = round;
          gScore[m] = g;
          came[m] = k;
          heap.push(g + heuristic(m), m);
        }
      }
    }
    if (stamp[goal] !== round) return null;
    const cells = [];
    for (let k = goal; k !== -1; k = came[k]) cells.push(k);
    cells.reverse();
    return smooth(pull(cells, a, b), 3);
  }

  // String pulling: a grid path zigzags at 45-degree steps, so replace each
  // run with the longest straight chord that crosses no blocked cell and
  // costs little more than the run it replaces.
  function lineCost(p, q) {
    const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const samples = Math.max(1, Math.ceil(length / (cell * 0.5)));
    let total = 0;
    for (let k = 0; k <= samples; k++) {
      const [i, j] = toCell(p[0] + ((q[0] - p[0]) * k) / samples, p[1] + ((q[1] - p[1]) * k) / samples);
      const c = cost[j * n + i];
      if (!Number.isFinite(c)) return Infinity;
      total += c;
    }
    return (total / (samples + 1)) * (length / cell);
  }
  function pull(cells, a, b) {
    const pts = cells.map(k => toWorld(k % n, Math.floor(k / n)));
    pts[0] = a;
    pts[pts.length - 1] = b;
    const prefix = [0];
    for (let k = 1; k < cells.length; k++) {
      const c = (cost[cells[k - 1]] + cost[cells[k]]) / 2;
      prefix.push(prefix[k - 1] + c * (Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]) / cell));
    }
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && lineCost(pts[i], pts[j]) > (prefix[j] - prefix[i]) * 1.06) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }

  const lanes = [];
  for (const [ia, ib] of gabriel) {
    const points = route(hubs[ia], hubs[ib]);
    if (points) lanes.push({ points });
  }

  // Eddies: candidates every EDDY_STEP along each lane, set to one side.
  const eddies = [];
  const facing = (x, y) => {
    const h = FACING_SCALE;
    return Math.atan2(field(x, y + h) - field(x, y - h), field(x + h, y) - field(x - h, y));
  };
  lanes.forEach((lane, li) => {
    let carried = 0;
    let index = 0;
    for (let k = 0; k < lane.points.length - 1; k++) {
      const [ax, ay] = lane.points[k];
      const [bx, by] = lane.points[k + 1];
      const length = Math.hypot(bx - ax, by - ay);
      if (length === 0) continue;
      let t = (EDDY_STEP - carried) / length;
      while (t <= 1) {
        index++;
        const x0 = ax + (bx - ax) * t;
        const y0 = ay + (by - ay) * t;
        const side = hash2(li, index, 301) < 0.5 ? -1 : 1;
        const offset = 0.006 + 0.01 * hash2(li, index, 302);
        const x = x0 + side * offset * (-(by - ay) / length);
        const y = y0 + side * offset * ((bx - ax) / length);
        const inGap = fractureDepth(x, y) > 0;
        const density = Math.max(0, field(x, y));
        const inDrift = density > 0.45 && Math.hypot(x, y) > 0.13;
        const chance = inGap ? 0.6 : inDrift ? 0.32 : 0.1;
        if (hash2(li, index, 303) < chance && voidDepth(x, y) < -0.01 && ashDepth(x, y) < 0) {
          eddies.push({
            x,
            y,
            angle: facing(x, y),
            size: 0.0032 + 0.0022 * hash2(li, index, 304) * (inGap ? 1.4 : 1),
            hand: hash2(li, index, 305) < 0.5 ? -1 : 1
          });
        }
        t += EDDY_STEP / length;
      }
      carried = (1 - (t - EDDY_STEP / length)) * length;
    }
  });

  // Hunting eddies across the Gap: one jittered candidate per cell.
  const span2 = Math.ceil(RASTER_EXTENT / GAP_EDDY_CELL);
  for (let i = -span2; i < span2; i++) {
    for (let j = -span2; j < span2; j++) {
      if (hash2(i, j, 311) > 0.5) continue;
      const x = (i + 0.15 + 0.7 * hash2(i, j, 312)) * GAP_EDDY_CELL;
      const y = (j + 0.15 + 0.7 * hash2(i, j, 313)) * GAP_EDDY_CELL;
      if (fractureDepth(x, y) < 0.003 || voidDepth(x, y) > -0.01) continue;
      eddies.push({
        x,
        y,
        angle: facing(x, y),
        size: 0.0038 + 0.0028 * hash2(i, j, 314),
        hand: hash2(i, j, 315) < 0.5 ? -1 : 1
      });
    }
  }

  return { lanes, eddies, hubs };
}

// Precomputes segment arc lengths and a spatial index, then returns a layer
// that the chart painter calls for each window it paints.
function createLaneLayer({ lanes, eddies: eddyList }, { color = [204, 128, 176], eddyInk = [236, 229, 212], lanes: drawLanes = true, eddies: drawEddies = true } = {}) {
  const eddies = drawEddies ? eddyList : [];
  const segments = [];
  for (const lane of drawLanes ? lanes : []) {
    let s = 0;
    for (let k = 0; k < lane.points.length - 1; k++) {
      const [ax, ay] = lane.points[k];
      const [bx, by] = lane.points[k + 1];
      const length = Math.hypot(bx - ax, by - ay);
      if (length > 0) segments.push({ ax, ay, bx, by, length, s0: s });
      s += length;
    }
  }
  const DASH_ON = 5;
  const DASH_PERIOD = 9;
  const WIDTH = 1.05;
  const TURNS = 1.6;

  // `shardReach` is the farthest the Gap's shards move anything, so lanes and
  // eddies just outside this window still draw where a shard carries them.
  function paint({ rgb, w, h, x0, y0, px, voidCover, shardShift, shardReach = 0.012 }) {
    const margin = shardReach + 4 * px;
    const minX = x0 - margin;
    const maxX = x0 + w * px + margin;
    const maxY = y0 + margin;
    const minY = y0 - h * px - margin;
    // Lanes show from the region scale inward, faded in as the chart zooms.
    const laneAlpha = 0.55 * smoothstep(0.0022, 0.0009, px);
    const cover = laneAlpha > 0 ? new Float32Array(w * h) : null;
    if (cover) {
      for (const seg of segments) {
        if (Math.max(seg.ax, seg.bx) < minX || Math.min(seg.ax, seg.bx) > maxX || Math.max(seg.ay, seg.by) < minY || Math.min(seg.ay, seg.by) > maxY) continue;
        const pad = WIDTH + 2 + shardReach / px;
        const u0 = Math.max(0, Math.floor((Math.min(seg.ax, seg.bx) - x0) / px - pad));
        const u1 = Math.min(w - 1, Math.ceil((Math.max(seg.ax, seg.bx) - x0) / px + pad));
        const v0 = Math.max(0, Math.floor((y0 - Math.max(seg.ay, seg.by)) / px - pad));
        const v1 = Math.min(h - 1, Math.ceil((y0 - Math.min(seg.ay, seg.by)) / px + pad));
        const dx = seg.bx - seg.ax;
        const dy = seg.by - seg.ay;
        for (let v = v0; v <= v1; v++) {
          for (let u = u0; u <= u1; u++) {
            const p = v * w + u;
            // In the Gap a lane is seen through its shard, so it breaks.
            const qx = x0 + u * px + shardShift[p * 2];
            const qy = y0 - v * px + shardShift[p * 2 + 1];
            let t = ((qx - seg.ax) * dx + (qy - seg.ay) * dy) / (seg.length * seg.length);
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const dist = Math.hypot(qx - (seg.ax + dx * t), qy - (seg.ay + dy * t)) / px;
            const line = WIDTH / 2 + 0.5 - dist;
            if (line <= 0) continue;
            const phase = (((seg.s0 + seg.length * t) / px) % DASH_PERIOD + DASH_PERIOD) % DASH_PERIOD;
            const dash = Math.max(0, Math.min(1, Math.min(phase, DASH_ON - phase) + 0.5));
            const a = Math.min(1, line) * dash;
            if (a > cover[p]) cover[p] = a;
          }
        }
      }
    }

    // Eddy glyphs: a loose spiral whose open mouth faces up the gradient.
    for (const eddy of eddies) {
      const sizePx = eddy.size / px;
      const fade = smoothstep(5, 10, sizePx);
      if (fade === 0) continue;
      if (eddy.x + eddy.size < minX || eddy.x - eddy.size > maxX || eddy.y + eddy.size < minY || eddy.y - eddy.size > maxY) continue;
      const cu = (eddy.x - x0) / px;
      const cv = (y0 - eddy.y) / px;
      const span = Math.ceil(sizePx + 2 + shardReach / px);
      const lineWidth = Math.max(0.9, Math.min(1.6, sizePx * 0.07));
      for (let v = Math.max(0, Math.floor(cv - span)); v <= Math.min(h - 1, Math.ceil(cv + span)); v++) {
        for (let u = Math.max(0, Math.floor(cu - span)); u <= Math.min(w - 1, Math.ceil(cu + span)); u++) {
          const p = v * w + u;
          const qx = x0 + u * px + shardShift[p * 2] - eddy.x;
          const qy = y0 - v * px + shardShift[p * 2 + 1] - eddy.y;
          const rho = Math.hypot(qx, qy) / px;
          if (rho > sizePx + 2) continue;
          // Angle measured from the mouth, wound in the eddy's hand.
          let psi = eddy.hand * (Math.atan2(qy, qx) - eddy.angle);
          psi = ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          let best = Infinity;
          const total = TURNS * 2 * Math.PI;
          // Spiral radius grows from 0.12 to 1 of the size as the parameter
          // runs to `total`, ending at the mouth (psi = 0).
          for (let k = 0; k < 3; k++) {
            const phi = total - (2 * Math.PI - psi) - 2 * Math.PI * k + (psi === 0 ? 2 * Math.PI : 0);
            if (phi < 0 || phi > total) continue;
            const radius = sizePx * (0.12 + 0.88 * (phi / total));
            best = Math.min(best, Math.abs(rho - radius));
          }
          const a = Math.max(0, Math.min(1, lineWidth / 2 + 0.5 - best)) * 0.62 * fade * (1 - voidCover[p]);
          if (a <= 0) continue;
          const o = p * 3;
          rgb[o] += (eddyInk[0] - rgb[o]) * a;
          rgb[o + 1] += (eddyInk[1] - rgb[o + 1]) * a;
          rgb[o + 2] += (eddyInk[2] - rgb[o + 2]) * a;
        }
      }
    }

    if (cover) {
      for (let p = 0; p < w * h; p++) {
        const a = cover[p] * laneAlpha * (1 - voidCover[p]);
        if (a <= 0) continue;
        const o = p * 3;
        rgb[o] += (color[0] - rgb[o]) * a;
        rgb[o + 1] += (color[1] - rgb[o + 1]) * a;
        rgb[o + 2] += (color[2] - rgb[o + 2]) * a;
      }
    }
  }

  return { paint };
}

module.exports = { computeLanes, createLaneLayer, smooth };
