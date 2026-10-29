// The atlas map's memory-density field.
//
// The field is built only from locked `memory_density` values in atlas
// frontmatter; every other number here is cartographic. A radial base runs
// from the core's plateau through the belt's gradient (equal to the belt's
// value at its mid radius) and an interpolated zone out to the perimeter's
// value. Overlay regions are then blended in, in order, and each site with a
// density pulls the field to its own value at its point. The lint evaluates
// this function at every probe and site, and the Phase 3 renderer will draw
// from it, so the chart cannot drift from the canon numbers unnoticed.

const { toXY } = require('./geometry');

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * @param {object} options
 * @param {object} options.config  the `field` block of cartography.yaml
 * @param {Map<string, object>} options.shapes  region id -> shape
 * @param {Map<string, number>} options.values  region id -> memory_density
 * @param {Array<{r:number, theta:number, value:number}>} options.sites
 */
function createField({ config, shapes, values, sites = [] }) {
  const { core, belt, perimeter } = config.radial;
  for (const id of [core, belt, perimeter]) {
    if (!shapes.has(id)) throw new Error(`field.radial names ${id}, which has no placed shape`);
    if (!values.has(id)) throw new Error(`field.radial names ${id}, which has no memory_density`);
  }
  const coreRadius = shapes.get(core).radius;
  const { inner: beltInner, outer: beltOuter } = shapes.get(belt);
  const perimeterInner = shapes.get(perimeter).inner;
  const coreValue = values.get(core);
  const beltValue = values.get(belt);
  const perimeterValue = values.get(perimeter);
  const spread = config.belt_spread;
  const blend = config.blend;
  const sigma = config.site_sigma;

  const beltIn = beltValue + spread;
  const beltOut = beltValue - spread;
  const overlays = (config.overlays || [])
    .filter(id => shapes.has(id) && values.has(id))
    .map(id => ({ shape: shapes.get(id), value: values.get(id) }));
  const kernels = sites.map(site => {
    const [x, y] = toXY(site.r, site.theta);
    return { x, y, value: site.value };
  });

  // Continuous outside the core: belt gradient, then the interpolated zone,
  // then the perimeter plateau.
  function outerProfile(r) {
    if (r <= beltInner) return beltIn;
    if (r <= beltOuter) return lerp(beltIn, beltOut, (r - beltInner) / (beltOuter - beltInner));
    if (r <= perimeterInner) return lerp(beltOut, perimeterValue, (r - beltOuter) / (perimeterInner - beltOuter));
    return perimeterValue;
  }

  return function density(x, y) {
    const r = Math.hypot(x, y);
    let v = lerp(coreValue, outerProfile(r), smoothstep(coreRadius - blend, coreRadius + blend, r));
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

module.exports = { createField, smoothstep };
