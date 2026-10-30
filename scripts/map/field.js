// The atlas map's memory-density field.
//
// The field is built only from locked `memory_density` values in atlas
// frontmatter; every other number here is cartographic. A radial base runs
// from the core's plateau through the belt's gradient (equal to the belt's
// value at its mid radius) and an interpolated zone out to the perimeter's
// value. Spiral arms (decision D2, claim T2) then modulate that base by a
// factor whose average around any circle about the center is exactly 1, so
// the base's value at each radius holds as a ring average. Overlay regions
// are blended in next, in order, and each site with a density pulls the
// field to its own value at its point (sites may peak above their
// surroundings), so site values hold by construction. The lint evaluates
// this function at every region probe (an annulus by its ring average), and
// the tile renderer draws from it, so the chart cannot drift from the canon
// numbers unnoticed.

const { toXY } = require('./geometry');

const DEG = Math.PI / 180;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Logarithmic spiral arms. The modulation is a sum of harmonics of the arm
// phase, each averaging zero around a circle, so the factor averages exactly
// 1 at every radius. Its strength rises from nothing at `from` to
// `amplitude` at `full` and holds there through the belt, so a belt region
// keeps close to its canon value along every ring. Past the belt's outer
// edge (`grow`) it grows to `outer_amplitude` at `fade`, where arms show
// most, and falls to nothing at `to`. Outside that span the factor is 1.
function createArms({ count, pitch, amplitude, outer_amplitude: outerAmplitude = amplitude, phase = 0, from, full, fade, to }, grow = full) {
  const wind = 1 / Math.tan(pitch * DEG);
  const start = Math.min(Math.max(grow, full), fade);
  return (x, y, r) => {
    if (r <= from || r >= to) return 1;
    const strength = smoothstep(from, full, r) * (1 - smoothstep(fade, to, r)) *
      (r <= start || start >= fade ? amplitude : lerp(amplitude, outerAmplitude, smoothstep(start, fade, r)));
    if (strength === 0) return 1;
    const phi = count * (Math.atan2(y, x) - phase * DEG - wind * Math.log(r / from));
    return 1 + strength * (Math.cos(phi) + 0.35 * Math.cos(2 * phi));
  };
}

/**
 * @param {object} options
 * @param {object} options.config  the `field` block of cartography.yaml
 * @param {Map<string, object>} options.shapes  region id -> shape
 * @param {Map<string, number>} options.values  region id -> memory_density
 * @param {Array<{r:number, theta:number, value:number}>} options.sites
 * @param {object|null} options.arms  `field.arms` with the arm count resolved
 */
function createField({ config, shapes, values, sites = [], arms = null }) {
  const { core, belt, perimeter } = config.radial;
  const expected = { core: 'disc', belt: 'annulus', perimeter: 'annulus' };
  for (const [role, id] of Object.entries({ core, belt, perimeter })) {
    if (!shapes.has(id)) throw new Error(`field.radial.${role} names ${id}, which has no placed shape`);
    if (!values.has(id)) throw new Error(`field.radial.${role} names ${id}, which has no memory_density`);
    if (shapes.get(id).type !== expected[role]) {
      throw new Error(`field.radial.${role} ${id} must be ${expected[role] === 'disc' ? 'a disc' : 'an annulus'}, not a ${shapes.get(id).type}`);
    }
  }
  const coreRadius = shapes.get(core).radius;
  const { inner: beltInner, outer: beltOuter } = shapes.get(belt);
  const perimeterInner = shapes.get(perimeter).inner;
  const coreValue = values.get(core);
  const beltValue = values.get(belt);
  const perimeterValue = values.get(perimeter);
  const spread = config.belt_spread;
  // Beyond the belt the field eases toward the perimeter: 0 is a straight
  // line; larger values fall faster near the belt and stretch the isopleths
  // outward toward the Black Horizon.
  const falloff = config.falloff || 0;
  const ease = t => (falloff > 0 ? (1 - Math.exp(-falloff * t)) / (1 - Math.exp(-falloff)) : t);
  const blend = config.blend;
  const sigma = config.site_sigma;

  const beltIn = beltValue + spread;
  const beltOut = beltValue - spread;
  const overlays = (config.overlays || [])
    .filter(id => shapes.has(id) && values.has(id))
    .map(id => ({ shape: shapes.get(id), value: values.get(id) }));
  const armFactor = arms ? createArms(arms, beltOuter) : () => 1;
  const kernels = sites.map(site => {
    const [x, y] = toXY(site.r, site.theta);
    return { x, y, value: site.value };
  });

  // Continuous outside the core: belt gradient, then the interpolated zone,
  // then the perimeter plateau.
  function outerProfile(r) {
    if (r <= beltInner) return beltIn;
    if (r <= beltOuter) return lerp(beltIn, beltOut, (r - beltInner) / (beltOuter - beltInner));
    if (r <= perimeterInner) return lerp(beltOut, perimeterValue, ease((r - beltOuter) / (perimeterInner - beltOuter)));
    return perimeterValue;
  }

  return function density(x, y) {
    const r = Math.hypot(x, y);
    let v = lerp(coreValue, outerProfile(r) * armFactor(x, y, r), smoothstep(coreRadius - blend, coreRadius + blend, r));
    for (const { shape, value } of overlays) {
      v = lerp(v, value, smoothstep(0, blend, shape.depth(x, y)));
    }
    for (const k of kernels) {
      const d = Math.hypot(x - k.x, y - k.y) / sigma;
      v = lerp(v, k.value, Math.exp(-d * d));
    }
    return Math.min(1, Math.max(0, v));
  };
}

// The mean of `fn` around the circle of radius r about the chart center.
function ringMean(fn, r, samples = 720) {
  let sum = 0;
  for (let k = 0; k < samples; k++) {
    const a = (2 * Math.PI * k) / samples;
    sum += fn(r * Math.cos(a), r * Math.sin(a));
  }
  return sum / samples;
}

// The farthest `fn` strays from `value` around the circle of radius r.
function ringStray(fn, r, value, samples = 720) {
  let stray = 0;
  for (let k = 0; k < samples; k++) {
    const a = (2 * Math.PI * k) / samples;
    stray = Math.max(stray, Math.abs(fn(r * Math.cos(a), r * Math.sin(a)) - value));
  }
  return stray;
}

module.exports = { createField, createArms, ringMean, ringStray, smoothstep };
