// Polar chart geometry for the atlas map.
//
// Coordinates are unitless chart units: 1.0 is the Black Horizon's near edge
// and no distance is implied. Angles are degrees counterclockwise from the
// chart's right-hand side. Every shape exposes depth(x, y), the signed
// distance to its nearest edge (positive inside, negative outside), and
// boundary(n), a sampling of its edge used for contact and overlap checks.

const DEG = Math.PI / 180;

function toXY(r, theta) {
  return [r * Math.cos(theta * DEG), r * Math.sin(theta * DEG)];
}

function toPolar(x, y) {
  let theta = Math.atan2(y, x) / DEG;
  if (theta < 0) theta += 360;
  return { r: Math.hypot(x, y), theta };
}

function angleDiff(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function circlePoints(cx, cy, radius, n) {
  return Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  });
}

function disc({ radius, r = 0, theta = 0 }) {
  const [cx, cy] = toXY(r, theta);
  return {
    type: 'disc',
    radius,
    center: [cx, cy],
    probes: [[cx, cy]],
    depth: (x, y) => radius - Math.hypot(x - cx, y - cy),
    boundary: (n = 360) => circlePoints(cx, cy, radius, n)
  };
}

// An annulus around the chart origin. Its probe sits at the mid radius,
// straight up the chart, where no overlay region is placed.
function annulus({ inner, outer }) {
  if (!(outer > inner)) throw new Error(`annulus outer (${outer}) must exceed inner (${inner})`);
  return {
    type: 'annulus',
    inner,
    outer,
    probes: [toXY((inner + outer) / 2, 90)],
    depth: (x, y) => {
      const r = Math.hypot(x, y);
      return Math.min(r - inner, outer - r);
    },
    boundary: (n = 360) => [
      ...circlePoints(0, 0, outer, n),
      ...(inner > 0 ? circlePoints(0, 0, inner, n) : [])
    ]
  };
}

// A rift: a wedge that runs outward from r0 to r1, bending from theta0 to
// theta1 and widening from half0 to half1 degrees either side of its center
// line. `clip` limits it to a radial band while keeping the parent's center
// line and taper, which is how a rift's named sleeves are drawn.
function rift({ r0, r1, theta0, theta1, half0, half1, taper = 1 }, clip = null) {
  if (!(r1 > r0)) throw new Error(`rift r1 (${r1}) must exceed r0 (${r0})`);
  const lo = clip ? clip[0] : r0;
  const hi = clip ? clip[1] : r1;
  if (!(hi > lo)) throw new Error(`rift band end (${hi}) must exceed its start (${lo})`);
  const at = r => {
    const t = Math.max(0, (r - r0) / (r1 - r0));
    return {
      center: theta0 + (theta1 - theta0) * t,
      half: half0 + (half1 - half0) * Math.pow(t, taper)
    };
  };
  const mid = (lo + hi) / 2;
  return {
    type: 'rift',
    inner: lo,
    outer: hi,
    at,
    probes: [toXY(mid, at(mid).center)],
    depth: (x, y) => {
      const { r, theta } = toPolar(x, y);
      const { center, half } = at(r);
      const angular = (half - Math.abs(angleDiff(theta, center))) * DEG * r;
      return Math.min(angular, r - lo, hi - r);
    },
    boundary: (n = 360) => {
      const side = Math.max(8, Math.floor(n / 4));
      const pts = [];
      for (let k = 0; k <= side; k++) {
        const r = lo + ((hi - lo) * k) / side;
        const { center, half } = at(r);
        pts.push(toXY(r, center + half), toXY(r, center - half));
      }
      for (const r of [lo, hi]) {
        const { center, half } = at(r);
        for (let k = 0; k <= side; k++) {
          pts.push(toXY(r, center - half + (2 * half * k) / side));
        }
      }
      return pts;
    }
  };
}

// A union of discs: the Remnant Seas' pockets or the Void Regions' holes.
function pockets({ items }) {
  const discs = items.map(item => disc(item));
  return {
    type: 'pockets',
    items: discs,
    probes: discs.map(d => d.center),
    depth: (x, y) => Math.max(...discs.map(d => d.depth(x, y))),
    boundary: (n = 360) => discs.flatMap(d => d.boundary(Math.max(36, Math.floor(n / discs.length))))
  };
}

const SHAPES = { disc, annulus, rift, pockets };

function makeShape(spec) {
  const build = SHAPES[spec && spec.type];
  if (!build) throw new Error(`unknown shape type: ${spec && spec.type}`);
  return build(spec);
}

// A named band of a region: an annulus slice of an annulus, or a radial
// slice of a rift.
function bandShape(parentSpec, from, to) {
  if (parentSpec.type === 'annulus') return annulus({ inner: from, outer: to });
  if (parentSpec.type === 'rift') return rift(parentSpec, [from, to]);
  throw new Error(`bands are not supported on ${parentSpec.type} shapes`);
}

// Contact: some part of A's edge lies within tol of B's edge (or crosses it).
function touches(a, b, tol, n = 720) {
  return a.boundary(n).some(([x, y]) => Math.abs(b.depth(x, y)) <= tol);
}

// Disjoint: neither shape reaches more than tol inside the other.
function disjoint(a, b, tol, n = 720) {
  const deepest = (p, q) => Math.max(...p.boundary(n).map(([x, y]) => q.depth(x, y)));
  return deepest(a, b) <= tol && deepest(b, a) <= tol;
}

module.exports = {
  DEG,
  toXY,
  toPolar,
  angleDiff,
  disc,
  annulus,
  rift,
  pockets,
  makeShape,
  bandShape,
  touches,
  disjoint
};
