// Generates the layout sketch for author review. Geometry is cartographic (P.A.).
// Usage: node design/map/make_sketch.js design/map/layout_sketch_v1.svg
// Placements mirror design/map/CARTOGRAPHIC_BRIEF.md section 3; keep them in step.
const fs = require('fs');

const W = 1800, H = 1500;
const CX = 680, CY = 750, S = 540; // chart radius 1.0 = S px
const out = [];
const add = (s) => out.push(s);

// Seeded RNG for reproducible jitter and stars.
let seed = 20261029;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const rad = (d) => (d * Math.PI) / 180;
const P = (r, deg) => [CX + r * S * Math.cos(rad(deg)), CY - r * S * Math.sin(rad(deg))];
const f = (n) => n.toFixed(1);
const pt = (r, deg) => P(r, deg).map(f).join(',');

function arcPath(r, a0, a1) {
  const [x0, y0] = P(r, a0), [x1, y1] = P(r, a1);
  const sweep = a0 > a1 ? 1 : 0;
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${f(x0)},${f(y0)} A${f(r * S)},${f(r * S)} 0 ${large} ${sweep} ${f(x1)},${f(y1)}`;
}
let pathId = 0;
function arcText(r, a0, a1, text, cls) {
  const id = `arc${pathId++}`;
  add(`<path id="${id}" d="${arcPath(r, a0, a1)}" fill="none"/>`);
  add(`<text class="${cls}"><textPath href="#${id}" xlink:href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath></text>`);
}
function annulus(r0, r1) {
  const o = r1 * S, i = r0 * S;
  return `M${CX - o},${CY} a${o},${o} 0 1,0 ${2 * o},0 a${o},${o} 0 1,0 ${-2 * o},0 Z ` +
         `M${CX - i},${CY} a${i},${i} 0 1,1 ${2 * i},0 a${i},${i} 0 1,1 ${-2 * i},0 Z`;
}
function blob(r, deg, size, jitter, n = 14) {
  const [cx, cy] = P(r, deg);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rr = size * S * (1 - jitter / 2 + jitter * rnd());
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.8]);
  }
  // Closed Catmull-Rom spline through the points.
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let k = 0; k < n; k++) {
    const p0 = pts[(k - 1 + n) % n], p1 = pts[k], p2 = pts[(k + 1) % n], p3 = pts[(k + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return { d: d + ' Z', pts };
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Sketch density profile through the soundings (interpolated between them).
const PROFILE = [[0, 0.97], [0.12, 0.97], [0.135, 0.82], [0.37, 0.65], [0.535, 0.56], [0.62, 0.5],
  [0.76, 0.31], [0.9, 0.1], [1.0, 0.02], [1.2, 0.01]];
const density = (r) => {
  for (let k = 1; k < PROFILE.length; k++) {
    const [r0, d0] = PROFILE[k - 1], [r1, d1] = PROFILE[k];
    if (r <= r1) return d0 + ((d1 - d0) * (r - r0)) / (r1 - r0);
  }
  return 0.01;
};

// ---------- Features (geometry is cartographic; see the brief) ----------
const GAP = { deg: 35, bend: 8, r0: 0.62, r1: 0.93, half0: 1.2, half1: 9.7 };
const gapAt = (r) => { const t = (r - GAP.r0) / (GAP.r1 - GAP.r0); return { c: GAP.deg + GAP.bend * t, half: GAP.half0 + (GAP.half1 - GAP.half0) * Math.pow(t, 0.7) }; };
const gapEdge = (side) => {
  const pts = [];
  for (let k = 0; k <= 20; k++) {
    const r = GAP.r0 + (GAP.r1 - GAP.r0) * (k / 20);
    const { c, half } = gapAt(r);
    const jag = k === 0 || k === 20 ? 0 : (rnd() - 0.5) * 2.4;
    pts.push(P(r, c + side * (half + jag)));
  }
  return pts;
};
const gapL = gapEdge(1), gapR = gapEdge(-1).reverse();
const gapPts = [...gapL, ...gapR];
const gapD = 'M' + gapPts.map((p) => p.map(f).join(',')).join(' L') + ' Z';

const voids = [
  blob(0.955, 56, 0.045, 0.5),   // touches the Gap's outer sleeve (decision 6)
  blob(0.665, 112, 0.028, 0.6),  // void margins against the outer sleeve
  blob(0.67, 248, 0.03, 0.6),
  blob(0.66, 322, 0.026, 0.6),
  blob(0.885, 128, 0.05, 0.55),
  blob(0.9, 272, 0.055, 0.5),
  blob(0.8, 345, 0.032, 0.6),
];
const remnant = [blob(0.81, 165, 0.085, 0.45, 16), blob(0.86, 221, 0.07, 0.45, 16), blob(0.78, 292, 0.04, 0.5)];
const inVoid = (x, y) => voids.some((v) => inPoly(x, y, v.pts));
const inRemnant = (x, y) => remnant.some((v) => inPoly(x, y, v.pts));
const inGap = (x, y) => inPoly(x, y, gapPts);

// ---------- Document ----------
add(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">`);
add(`<title id="t">The Known Galaxy: layout sketch v1</title>`);
add(`<desc id="d">Rough layout sketch for author review, 2026-10-29. Radial memory-density layout: Mnemosyne Lattice Core at center, Helios Drift belt touching the Core, with an inner sleeve, a mid-sleeve and an outer sleeve of nine numbered sleeves, Lattice Gap as an outward rift with the Heliodrome at its epicenter, Remnant Seas pockets, scattered Void Regions, and the Black Horizon perimeter. Topology follows the accepted decisions; all geometry is approximate.</desc>`);
add(`<defs>
<style>
  .region { font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-weight: 600; letter-spacing: 6px; fill: #F1ECE0; }
  .band { font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; letter-spacing: 3px; fill: #D8D2C4; }
  .label { font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; fill: #F1ECE0; }
  .small { font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif; font-size: 12.5px; fill: #A8AEB6; }
  .spec { opacity: 0.6; }
  .snd { font-family: 'IBM Plex Mono', Menlo, Consolas, monospace; font-size: 13px; fill: #E8A856; }
  .mono { font-family: 'IBM Plex Mono', Menlo, Consolas, monospace; font-size: 12.5px; fill: #A8AEB6; }
  .title { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 40px; letter-spacing: 8px; fill: #F1ECE0; }
  .subtitle { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 21px; fill: #D8D2C4; }
  .h { font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2.5px; fill: #F1ECE0; }
  .body { font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; fill: #D8D2C4; }
</style>
<radialGradient id="core" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="#FFF6E6"/><stop offset="0.35" stop-color="#F6C684"/>
  <stop offset="0.8" stop-color="#E8A856" stop-opacity="0.75"/><stop offset="1" stop-color="#E8A856" stop-opacity="0"/>
</radialGradient>
<radialGradient id="field" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${S * 1.2}">
  <stop offset="0" stop-color="#3A2A14"/><stop offset="0.15" stop-color="#3A2A14"/>
  <stop offset="0.52" stop-color="#20262F"/><stop offset="0.8" stop-color="#11151B"/>
  <stop offset="0.86" stop-color="#0A0D12"/><stop offset="1" stop-color="#05070A"/>
</radialGradient>
<radialGradient id="drift" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${S * 0.62}">
  <stop offset="0.19" stop-color="#E8A856" stop-opacity="0.34"/>
  <stop offset="0.75" stop-color="#E8A856" stop-opacity="0.16"/>
  <stop offset="1" stop-color="#E8A856" stop-opacity="0.06"/>
</radialGradient>
<radialGradient id="horizon" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${S * 1.24}">
  <stop offset="0.80" stop-color="#181D25" stop-opacity="0"/>
  <stop offset="0.84" stop-color="#181D25" stop-opacity="0.9"/>
  <stop offset="0.93" stop-color="#0A0D12" stop-opacity="0.95"/>
  <stop offset="1" stop-color="#05070A" stop-opacity="1"/>
</radialGradient>
<pattern id="synod" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
  <line x1="0" y1="0" x2="0" y2="14" stroke="#6A727C" stroke-width="1" stroke-opacity="0.35"/>
</pattern>
<pattern id="ash" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
  <line x1="0" y1="0" x2="9" y2="0" stroke="#A8AEB6" stroke-width="0.8" stroke-opacity="0.18"/>
</pattern>
<filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="blur4"><feGaussianBlur stdDeviation="3"/></filter>
<clipPath id="disk"><circle cx="${CX}" cy="${CY}" r="${S * 1.0}"/></clipPath>
</defs>`);

add(`<rect width="${W}" height="${H}" fill="#05070A"/>`);
add(`<circle cx="${CX}" cy="${CY}" r="${S * 1.2}" fill="url(#field)"/>`);

// Spiral arms: memory concentrations, drawn soft.
for (const off of [0, 180]) {
  const b = Math.log(0.95 / 0.12) / (1.6 * Math.PI);
  const pts = [];
  for (let k = 0; k <= 80; k++) {
    const th = (k / 80) * 1.6 * Math.PI;
    const r = 0.12 * Math.exp(b * th);
    pts.push(pt(r, off + 20 + (th * 180) / Math.PI));
  }
  add(`<polyline points="${pts.join(' ')}" fill="none" stroke="#D8C49A" stroke-opacity="0.16" stroke-width="70" stroke-linecap="round" filter="url(#blur30)" clip-path="url(#disk)"/>`);
}

// Helios Drift belt.
add(`<path d="${annulus(0.12, 0.62)}" fill="url(#drift)" fill-rule="evenodd"/>`);

// Stars, brightness tracking density; none in voids; cinders in the Remnant Seas.
for (let k = 0; k < 2600; k++) {
  const r = Math.sqrt(rnd()) * 1.18, a = rnd() * 360;
  const [x, y] = P(r, a);
  if (inVoid(x, y)) continue;
  const d = density(r);
  if (rnd() > 0.25 + d * 0.9) continue;
  if (inRemnant(x, y)) {
    add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.8 + rnd() * 1.2)}" fill="#8A6A2E" fill-opacity="${(0.25 + rnd() * 0.3).toFixed(2)}"/>`);
    continue;
  }
  const op = Math.min(0.95, 0.12 + d * 0.8 * rnd() + 0.1);
  add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + rnd() * (0.6 + d * 1.1))}" fill="#F1ECE0" fill-opacity="${op.toFixed(2)}"/>`);
}

// Black Horizon perimeter: shading, Synod hatching, bleed beyond the chart edge.
add(`<path d="${annulus(1.0, 1.24)}" fill="url(#horizon)" fill-rule="evenodd"/>`);
add(`<path d="${annulus(1.0, 1.17)}" fill="url(#synod)" fill-rule="evenodd"/>`);
add(`<circle cx="${CX}" cy="${CY}" r="${S}" fill="none" stroke="#6A727C" stroke-width="1.2" stroke-dasharray="2 7"/>`);
// Black-hole knots (dense clustering at galactic scale).
for (const [r, a, s] of [[1.08, 12, 7], [1.12, 58, 5], [1.1, 103, 8], [1.13, 150, 6], [1.07, 197, 7], [1.12, 236, 5], [1.09, 281, 8], [1.13, 318, 6], [1.11, 350, 5]]) {
  const [x, y] = P(r, a);
  add(`<circle cx="${f(x)}" cy="${f(y)}" r="${s * 2.4}" fill="none" stroke="#A8AEB6" stroke-opacity="0.22" stroke-width="1"/>`);
  add(`<circle cx="${f(x)}" cy="${f(y)}" r="${s}" fill="#000"/>`);
  add(`<circle cx="${f(x + s * 1.6)}" cy="${f(y - s * 0.8)}" r="${s * 0.7}" fill="#000"/>`);
}

// Remnant Seas pockets: ash, scar streaking, cinders drawn above.
for (const b of remnant) {
  add(`<path d="${b.d}" fill="#2A313A" fill-opacity="0.55"/>`);
  add(`<path d="${b.d}" fill="url(#ash)"/>`);
  add(`<path d="${b.d}" fill="none" stroke="#6A727C" stroke-opacity="0.5" stroke-dasharray="1 4"/>`);
}

// Void Regions: the chart records nothing. Blank to the base colour, no outline.
for (const v of voids) add(`<path d="${v.d}" fill="#05070A"/>`);

// Lattice Gap rift with misregistered (doubled) line work.
add(`<path d="${gapD}" fill="#3A424D" fill-opacity="0.45"/>`);
add(`<path d="${gapD}" fill="none" stroke="#FF8E3C" stroke-opacity="0.55" stroke-width="1.4" transform="translate(4,-3)"/>`);
add(`<path d="${gapD}" fill="none" stroke="#D8D2C4" stroke-opacity="0.8" stroke-width="1.2"/>`);
for (const [r, name] of [[0.72, 'near sleeve'], [0.84, 'outer sleeve']]) {
  const { c, half } = gapAt(r);
  add(`<path d="${arcPath(r, c + half - 1, c - half + 1)}" fill="none" stroke="#D8D2C4" stroke-opacity="0.5" stroke-dasharray="3 4"/>`);
}

// Drift band boundaries and the nine numbered sleeves.
for (const r of [0.12, 0.62]) add(`<circle cx="${CX}" cy="${CY}" r="${r * S}" fill="none" stroke="#E8A856" stroke-opacity="0.55" stroke-width="1.2"/>`);
for (const r of [0.28, 0.45]) add(`<circle cx="${CX}" cy="${CY}" r="${r * S}" fill="none" stroke="#E8A856" stroke-opacity="0.45" stroke-dasharray="6 6"/>`);
for (let k = 1; k < 9; k++) {
  const r = 0.45 + (0.17 * k) / 9;
  add(`<circle cx="${CX}" cy="${CY}" r="${f(r * S)}" fill="none" stroke="#E8A856" stroke-opacity="0.16" stroke-width="0.8"/>`);
}
// Post-breach: Fourth and Ninth Sleeves softening (dashed in state colour).
for (const k of [4, 9]) {
  const r = 0.45 + (0.17 * (k - 0.5)) / 9;
  add(`<circle cx="${CX}" cy="${CY}" r="${f(r * S)}" fill="none" stroke="#2A313A" stroke-width="6" stroke-opacity="0.9" stroke-dasharray="2 10"/>`);
}

// Core.
add(`<circle cx="${CX}" cy="${CY}" r="${0.135 * S}" fill="url(#core)"/>`);
add(`<circle cx="${CX}" cy="${CY}" r="${0.12 * S}" fill="none" stroke="#F6C684" stroke-opacity="0.8" stroke-width="1.2"/>`);
for (const r of [0.03, 0.06, 0.09]) add(`<circle cx="${CX}" cy="${CY}" r="${r * S}" fill="none" stroke="#3A2A14" stroke-opacity="0.5" stroke-width="0.8"/>`);

// Region names on curved baselines.
arcText(0.395, 145, 35, 'HELIOS DRIFT', 'region" font-size="34');
arcText(0.235, 236, 304, 'INNER SLEEVE', 'band" font-size="12');
arcText(0.365, 250, 290, 'MID-SLEEVE', 'band');
arcText(0.588, 250, 290, 'OUTER SLEEVE · I–IX', 'band');
arcText(1.105, 150, 30, 'BLACK HORIZON', 'region" font-size="30');
arcText(1.14, 248, 292, 'far edge uncharted', 'small');
arcText(1.035, 198, 242, 'near edge · Archivist monitoring stations', 'small');

// Labels with leaders. Primary pins solid; speculative pins hollow, dashed, faded.
function pin(r, deg, primary) {
  const [x, y] = P(r, deg);
  if (primary) {
    add(`<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="none" stroke="#F1ECE0" stroke-width="1.2"/>`);
    add(`<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="#FF6B6B"/>`);
  } else {
    add(`<circle class="spec" cx="${f(x)}" cy="${f(y)}" r="7" fill="none" stroke="#FF6B6B" stroke-width="1.6" stroke-dasharray="3 3"/>`);
  }
  return [x, y];
}
function callout(x, y, tx, ty, lines, spec) {
  const cls = spec ? ' class="spec"' : '';
  add(`<g${cls}>`);
  add(`<polyline points="${f(x)},${f(y)} ${f(tx)},${f(ty)}" fill="none" stroke="#A8AEB6" stroke-opacity="0.6" stroke-width="0.9"/>`);
  const anchor = tx >= x ? 'start' : 'end';
  const dx = tx >= x ? 6 : -6;
  lines.forEach(([cls2, text], i) => add(`<text class="${cls2}" x="${f(tx + dx)}" y="${f(ty + 5 + i * 17)}" text-anchor="${anchor}">${text}</text>`));
  add('</g>');
}

// Core label.
arcText(0.16, 185, 355, 'MNEMOSYNE LATTICE CORE', 'region" font-size="13" style="letter-spacing:2.5px');
add(`<text class="snd" x="${CX}" y="${CY + 5}" text-anchor="middle" fill="#3A2A14" style="fill:#3A2A14">0.97</text>`);

// Heavonly (speculative) at the Drift–Core boundary.
{ const [x, y] = pin(0.135, 100, false);
  callout(x, y, x - 60, y - 58, [['label', 'Heavonly'], ['snd', '0.82'], ['small', 'gateway; galaxies not drawn']], true); }

// Tessarine Vault, inner relay, and the two-pull route.
{ const [xr, yr] = P(0.2, -22), [xv, yv] = P(0.45, -22);
  add(`<line x1="${f(xr)}" y1="${f(yr)}" x2="${f(xv)}" y2="${f(yv)}" stroke="#F6C684" stroke-width="1.6" stroke-dasharray="1 6" stroke-linecap="round"/>`);
  const [mx, my] = P(0.325, -26);
  add(`<text class="mono" x="${f(mx)}" y="${f(my)}" text-anchor="middle" style="fill:#F6C684">2 pulls</text>`);
  const [x1, y1] = pin(0.2, -22, true);
  callout(x1, y1, x1 + 40, y1 - 46, [['label', 'Inner relay · Navigant house'], ['small', 'corridor and courier node, inner sleeve']], false);
  const [x2, y2] = pin(0.45, -22, true);
  callout(x2, y2, x2 + 60, y2 + 92, [['label', 'Tessarine Vault'], ['snd', '0.78 pre-breach · unmeasured after'], ['small', 'inner edge of the outer sleeve']], false); }

// Halix circuit, Skather-Ait pod, and the shared tether (speculative entities).
{ const [hx, hy] = P(0.535, -58);
  add(`<g class="spec"><ellipse cx="${f(hx)}" cy="${f(hy)}" rx="44" ry="20" transform="rotate(${f(58 - 90)} ${f(hx)} ${f(hy)})" fill="none" stroke="#F6C684" stroke-width="1.3" stroke-dasharray="5 4"/></g>`);
  const [px, py] = P(0.59, -66);
  add(`<line class="spec" x1="${f(hx + 12)}" y1="${f(hy + 14)}" x2="${f(px)}" y2="${f(py)}" stroke="#D8D2C4" stroke-width="0.9"/>`);
  for (const t of [0.35, 0.6, 0.8]) add(`<circle class="spec" cx="${f(hx + 12 + (px - hx - 12) * t)}" cy="${f(hy + 14 + (py - hy - 14) * t)}" r="2.2" fill="#D8D2C4"/>`);
  const [x1, y1] = pin(0.535, -58, false);
  callout(x1, y1, x1 + 150, y1 + 18, [['label', 'Halix Exchange'], ['snd', '0.56 · no story source'], ['small', 'slow circuit; moors at tether heads']], true);
  const [x2, y2] = pin(0.59, -66, false);
  callout(x2, y2, x2 + 120, y2 + 66, [['label', 'Skather-Ait pod'], ['small', "six-hour tether to Halix; shares"], ['small', "Halix's sleeve, number not given"]], true); }

// Lattice Gap labels, Heliodrome, the Wake's three pulls, and Solace Hospice.
{ const [lx, ly] = P(0.94, 17);
  add(`<text class="region" font-size="20" style="letter-spacing:4px" x="${f(lx)}" y="${f(ly)}">LATTICE GAP</text>`);
  add(`<text class="region" font-size="20" style="letter-spacing:4px;fill:#FF8E3C;opacity:0.45" x="${f(lx + 4)}" y="${f(ly - 3)}">LATTICE GAP</text>`);
  add(`<text class="snd" x="${f(lx)}" y="${f(ly + 19)}">0.31</text>`);
  add(`<text class="small" x="${f(lx)}" y="${f(ly + 36)}">rift at the Lattice's outer reach</text>`);
  const hg = gapAt(0.76);
  // Approach only: the route fades in inside the Gap and claims no origin.
  const ga = gapAt(0.645);
  const [ws, wsy] = P(0.645, ga.c), [hx, hy] = P(0.76, hg.c);
  add(`<linearGradient id="wake" gradientUnits="userSpaceOnUse" x1="${f(ws)}" y1="${f(wsy)}" x2="${f(hx)}" y2="${f(hy)}"><stop offset="0" stop-color="#F6C684" stop-opacity="0"/><stop offset="0.6" stop-color="#F6C684" stop-opacity="1"/></linearGradient>`);
  add(`<path d="M${f(ws)},${f(wsy)} L${f(hx)},${f(hy)}" fill="none" stroke="url(#wake)" stroke-width="1.8" stroke-dasharray="1 5" stroke-linecap="round"/>`);
  const [mx, my] = P(0.7, 29.5);
  add(`<text class="mono" x="${f(mx)}" y="${f(my)}" style="fill:#F6C684">3 pulls</text>`);
  const [x1, y1] = pin(0.76, hg.c, true);
  callout(x1, y1, x1 - 110, y1 - 95, [['label', 'Heliodrome'], ['snd', '0.31'], ['small', 'epicenter of the fracture']], false);
  // Historical site: the scoured fishing-colony moon in the Gap's near sleeve (no entity).
  { const g = gapAt(0.69);
    const [cx2, cy2] = P(0.69, g.c + g.half * 0.55);
    add(`<circle cx="${f(cx2)}" cy="${f(cy2)}" r="4.5" fill="none" stroke="#D8D2C4" stroke-width="1.2"/>`);
    add(`<line x1="${f(cx2 - 3.2)}" y1="${f(cy2 + 3.2)}" x2="${f(cx2 + 3.2)}" y2="${f(cy2 - 3.2)}" stroke="#D8D2C4" stroke-width="1.2"/>`);
    callout(cx2, cy2, cx2 - 40, cy2 - 166, [['small', 'scoured colony moon'], ['small', 'near sleeve · unnamed']], false); }
  const [x2, y2] = pin(0.9, gapAt(0.9).c + gapAt(0.9).half - 0.6, false);
  callout(x2, y2, x2 - 30, y2 - 80, [['label', 'Solace Hospice'], ['small', "Gap's outer sleeve, at a Void"]], true); }

// Remnant Seas and Ostra-Vael.
{ const [rx, ry] = P(0.83, 168);
  add(`<text class="region" font-size="20" x="${f(rx)}" y="${f(ry - 4)}" text-anchor="middle">REMNANT SEAS</text>`);
  add(`<text class="snd" x="${f(rx)}" y="${f(ry + 15)}" text-anchor="middle">0.04</text>`);
  const [r2x, r2y] = P(0.86, 221);
  add(`<text class="small" x="${f(r2x)}" y="${f(r2y + 4)}" text-anchor="middle">Remnant Seas</text>`);
  const [x1, y1] = pin(0.725, 160, false);
  callout(x1, y1, x1 + 30, y1 - 70, [['label', 'Ostra-Vael'], ['snd', '0.30'], ['small', 'on the Seas boundary']], true); }

// Void Regions: name outside, leaders in.
{ const [tx, ty] = P(1.0, 300);
  const targets = [voids[3], voids[5], voids[6]];
  for (const v of targets) {
    const c = v.pts.reduce((acc, p) => [acc[0] + p[0] / v.pts.length, acc[1] + p[1] / v.pts.length], [0, 0]);
    add(`<line x1="${f(tx + 60)}" y1="${f(ty + 20)}" x2="${f(c[0])}" y2="${f(c[1])}" stroke="#A8AEB6" stroke-opacity="0.5" stroke-width="0.9" stroke-dasharray="2 3"/>`);
  }
  add(`<text class="region" font-size="20" x="${f(tx + 64)}" y="${f(ty + 30)}">VOID REGIONS</text>`);
  add(`<text class="snd" x="${f(tx + 64)}" y="${f(ty + 49)}">0.00 · nothing charted inside</text>`); }

// Narthex (speculative), Ebbhaven (E.D.), Black Horizon sounding.
{ const [x1, y1] = pin(1.09, 78, false);
  callout(x1, y1, x1 + 40, y1 - 40, [['label', 'Narthex of Low Mercy'], ['snd', '0.015']], true);
  const [ex, ey] = P(0.965, 140);
  add(`<g class="spec"><text class="mono" x="${f(ex)}" y="${f(ey)}" text-anchor="middle">E.D.</text>`);
  add(`<text class="small" x="${f(ex - 6)}" y="${f(ey + 16)}" text-anchor="end">Ebbhaven buoy, last contact</text></g>`);
  const [bx, by] = P(1.105, 90);
  add(`<text class="snd" x="${f(bx)}" y="${f(by + 34)}" text-anchor="middle">0.01</text>`); }

// Drift sounding.
{ const [dx, dy] = P(0.395, 90);
  add(`<text class="snd" x="${f(dx)}" y="${f(dy + 42)}" text-anchor="middle">0.65 pre-breach</text>`); }

// Chart radius scale (unitless).
{ const y = CY + 1.2 * S + 40, x0 = CX - S;
  add(`<line x1="${x0}" y1="${y}" x2="${CX}" y2="${y}" stroke="#A8AEB6" stroke-width="1"/>`);
  for (const t of [0, 0.5, 1.0]) {
    const x = CX - S + t * S;
    add(`<line x1="${f(x)}" y1="${y - 5}" x2="${f(x)}" y2="${y + 5}" stroke="#A8AEB6"/>`);
  }
  add(`<text class="mono" x="${x0}" y="${y + 22}">1.0</text><text class="mono" x="${CX - S / 2}" y="${y + 22}" text-anchor="middle">0.5</text><text class="mono" x="${CX}" y="${y + 22}" text-anchor="end">0</text>`);
  add(`<text class="small" x="${CX - S / 2}" y="${y - 10}" text-anchor="middle">chart radius, unitless · 1.0 = Black Horizon near edge · no distance implied</text>`); }

// ---------- Legend panel ----------
const LX = 1410;
let ly = 70;
const line = (cls, text, dy = 19) => { add(`<text class="${cls}" x="${LX}" y="${ly}">${text}</text>`); ly += dy; };
add(`<rect x="${LX - 26}" y="30" width="${W - LX + 6}" height="${H - 60}" fill="#0A0D12" stroke="#2A313A"/>`);
line('title" font-size="28" style="letter-spacing:5px', 'THE KNOWN', 34);
line('title" font-size="28" style="letter-spacing:5px', 'GALAXY', 32);
line('subtitle', 'a coherence chart', 26);
line('mono', 'layout sketch v1 · 2026-10-29', 17);
line('mono', 'for author review', 30);
line('h', 'AUTHORITY', 20);
line('body', 'Claims follow the brief, §4,', 17);
line('body', 'all settled. Positions, sizes,', 17);
line('body', 'angles and drawn counts are', 17);
line('body', 'P.A.: position approximate.', 28);

line('h', 'SYMBOLS', 24);
const sym = (draw, text) => { draw(LX + 9, ly - 5); add(`<text class="body" x="${LX + 46}" y="${ly}">${text}</text>`); ly += 24; };
sym((x, y) => { add(`<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#F1ECE0" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="5" fill="#FF6B6B"/>`); }, 'primary canon location');
sym((x, y) => { add(`<circle class="spec" cx="${x}" cy="${y}" r="7" fill="none" stroke="#FF6B6B" stroke-width="1.6" stroke-dasharray="3 3"/>`); }, 'speculative (author build only)');
sym((x, y) => { add(`<text class="snd" x="${x - 9}" y="${y + 5}">0.31</text>`); }, 'sounding: canon value only');
sym((x, y) => { add(`<line x1="${x - 9}" y1="${y}" x2="${x + 11}" y2="${y}" stroke="#F6C684" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round"/>`); }, 'route; pulls counted, no origin');
sym((x, y) => { add(`<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#D8D2C4" stroke-width="1.2"/><line x1="${x - 3.2}" y1="${y + 3.2}" x2="${x + 3.2}" y2="${y - 3.2}" stroke="#D8D2C4" stroke-width="1.2"/>`); }, 'historical site, no atlas entry');
sym((x, y) => { add(`<line x1="${x - 9}" y1="${y}" x2="${x + 11}" y2="${y}" stroke="#2A313A" stroke-width="6" stroke-dasharray="2 5"/>`); }, 'sleeve softening, post-breach');
sym((x, y) => { add(`<rect x="${x - 9}" y="${y - 8}" width="20" height="16" fill="#05070A" stroke="#3A424D"/>`); }, 'Void: nothing charted');
sym((x, y) => { add(`<rect x="${x - 9}" y="${y - 8}" width="20" height="16" fill="url(#synod)" stroke="#3A424D"/>`); }, 'Obsidian Synod territory');
sym((x, y) => { add(`<circle cx="${x}" cy="${y}" r="6" fill="#000" stroke="#A8AEB6" stroke-opacity="0.4"/>`); }, 'black-hole knot');
ly += 8;

// Outer sleeve detail: nine sleeves numbered outward.
line('h', 'OUTER SLEEVE, NUMBERED OUTWARD', 14);
const rows = [
  ['I', '—', ''],
  ['II', '200,000 · 11 stations, city-ship', 'held, bound by Hael'],
  ['III', '—', ''],
  ['IV', 'not given', 'silo lost · softening'],
  ['V', '80,000', 'reduced pitch'],
  ['VI', '—', ''],
  ['VII', 'about 40,000', 'reduced pitch'],
  ['VIII', '—', ''],
  ['IX', '900 · 4 stations', 'silo lost · softening'],
];
add(`<text class="small" x="${LX}" y="${ly + 4}">inner edge: Tessarine Vault</text>`);
ly += 14;
const rowH = 31;
rows.forEach(([n, pop, state], i) => {
  const y = ly + i * rowH;
  const lost = state.startsWith('silo lost');
  add(`<rect x="${LX}" y="${y}" width="${W - LX - 40}" height="${rowH - 3}" fill="#E8A856" fill-opacity="${(0.22 - i * 0.018).toFixed(3)}" stroke="${lost ? '#6A727C' : 'none'}" stroke-dasharray="${lost ? '2 4' : ''}"/>`);
  add(`<text class="mono" x="${LX + 8}" y="${y + 19}" style="fill:#F1ECE0">${n}</text>`);
  add(`<text class="body" x="${LX + 52}" y="${y + 13}" font-size="12">${pop}</text>`);
  if (state) add(`<text class="small" x="${LX + 52}" y="${y + 25}" font-size="11.5">${state}</text>`);
});
ly += rows.length * rowH + 6;
add(`<text class="small" x="${LX}" y="${ly + 6}">outer edge: void margins, Lattice Gap</text>`);
ly += 18;
add(`<text class="small" x="${LX}" y="${ly + 6}">— = unnamed in canon; no figure given</text>`);
ly += 18;
add(`<text class="small" x="${LX}" y="${ly + 6}">Halix, Skather-Ait: one shared sleeve, unnumbered</text>`);
ly += 34;

// Density profile along the radius: soundings against the sketch's radii.
line('h', 'SOUNDINGS BY RADIUS', 12);
const gx = LX + 30, gy = ly + 8, gw = W - LX - 80, gh = 150;
add(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="none" stroke="#2A313A"/>`);
const gX = (r) => gx + (r / 1.2) * gw, gY = (d) => gy + gh - d * gh;
add(`<polyline points="${PROFILE.map(([r, d]) => `${f(gX(r))},${f(gY(d))}`).join(' ')}" fill="none" stroke="#A8AEB6" stroke-dasharray="3 3" stroke-width="1"/>`);
const marks = [[0.06, 0.97, 'Core'], [0.135, 0.82, 'Heavonly*'], [0.37, 0.65, 'Drift'], [0.45, 0.78, 'Vault'], [0.535, 0.56, 'Halix*'], [0.76, 0.31, 'Gap'], [0.725, 0.30, ''], [0.83, 0.04, 'Seas'], [1.09, 0.015, ''], [1.1, 0.01, 'Horizon']];
for (const [r, d, name] of marks) {
  add(`<circle cx="${f(gX(r))}" cy="${f(gY(d))}" r="3.2" fill="#E8A856"/>`);
  if (name) add(`<text class="mono" font-size="10.5" x="${f(gX(r) + 5)}" y="${f(gY(d) - 5)}">${name}</text>`);
}
add(`<text class="mono" font-size="10.5" x="${gx - 6}" y="${gy + 8}" text-anchor="end">1</text><text class="mono" font-size="10.5" x="${gx - 6}" y="${gy + gh}" text-anchor="end">0</text>`);
add(`<text class="mono" font-size="10.5" x="${gx}" y="${gy + gh + 15}">r 0</text><text class="mono" font-size="10.5" x="${gx + gw}" y="${gy + gh + 15}" text-anchor="end">1.2</text>`);
ly = gy + gh + 36;
line('small', 'dashed: interpolation, not canon', 16);
line('small', 'Vault sits above its band: a site peak', 16);
line('small', '* speculative entity', 16);

add('</svg>');
fs.writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log('wrote', process.argv[2], (out.join('\n').length / 1024).toFixed(0) + ' KB');
