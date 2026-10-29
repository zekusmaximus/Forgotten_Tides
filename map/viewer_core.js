// Pure logic for the atlas map viewer: tier lenses, coordinates, the item
// index, search, deep-link hashes, and label levels of detail. It has no DOM
// or OpenSeadragon dependency, so Node tests load it directly
// (scripts/tests/test_map_viewer.js) and the page loads it as window.MapCore.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MapCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LENSES = ['primary', 'working', 'speculative'];
  const RANK = { primary: 0, working: 1, speculative: 2 };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const SLEEVE_LABEL_THETA = 250;

  // Entity tiers and feature/route tiers map onto the three lens positions.
  // Canon, approved, and cartographic features count as primary; drafts and
  // speculative entities appear only under "+ Speculative".
  function lensTier(tier) {
    if (tier === 'primary_canon' || tier === 'canon' || tier === 'approved' || tier === 'cartographic') return 'primary';
    if (tier === 'working_canon') return 'working';
    return 'speculative';
  }

  function visible(lens, tier) {
    return RANK[lensTier(tier)] <= RANK[lens];
  }

  // Chart coordinates (y up, origin at the Core) to OpenSeadragon viewport
  // coordinates (0..1 across the image, y down).
  function toViewport(xy, extent) {
    return { x: (xy[0] + extent) / (2 * extent), y: (extent - xy[1]) / (2 * extent) };
  }

  function lengthToViewport(length, extent) {
    return length / (2 * extent);
  }

  function outlineBounds(outline) {
    const xs = [];
    const ys = [];
    for (const c of outline.circles || []) xs.push(c.x - c.r, c.x + c.r), ys.push(c.y - c.r, c.y + c.r);
    for (const polygon of outline.polygons || []) for (const [x, y] of polygon) xs.push(x), ys.push(y);
    if (!xs.length) return null;
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  // The outer band that carries numbered sleeves, if any region has one.
  function sleeveBand(data) {
    for (const region of data.regions || []) {
      const band = (region.bands || []).find(b => b.subbands);
      if (band) return { region, band };
    }
    return null;
  }

  function buildIndex(data) {
    const items = [];
    for (const region of data.regions || []) {
      items.push({ kind: 'region', id: region.id, name: region.name, tier: region.tier, xy: region.label_xy || [0, 0], summary: region.summary_50, ref: region });
    }
    for (const site of data.sites || []) {
      items.push({ kind: 'site', id: site.id, name: site.name, tier: site.tier, xy: site.xy, summary: site.summary_50, ref: site });
    }
    const band = sleeveBand(data);
    for (const feature of data.features || []) {
      if (feature.xy) {
        items.push({ kind: 'feature', id: feature.key, name: feature.label, tier: feature.tier, xy: feature.xy, summary: feature.note || '', ref: feature });
      }
      if (feature.kind === 'sleeves' && band) {
        const width = (band.band.to - band.band.from) / band.band.subbands;
        for (const sleeve of feature.sleeves || []) {
          const r = band.band.from + width * (sleeve.number - 0.5);
          const theta = (SLEEVE_LABEL_THETA * Math.PI) / 180;
          items.push({
            kind: 'sleeve',
            id: `sleeve-${sleeve.number}`,
            name: `Sleeve ${ROMAN[sleeve.number - 1] || sleeve.number}`,
            numeral: ROMAN[sleeve.number - 1] || String(sleeve.number),
            tier: feature.tier,
            xy: [r * Math.cos(theta), r * Math.sin(theta)],
            summary: sleeve.population ? `${sleeve.approximate ? 'About ' : ''}${sleeve.population.toLocaleString('en-US')} people` : '',
            ref: sleeve,
            feature
          });
        }
      }
    }
    for (const route of data.routes || []) {
      const pts = route.points || [];
      const mid = pts.length ? [(pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2] : [0, 0];
      items.push({ kind: 'route', id: route.key, name: route.label, tier: route.tier, xy: mid, summary: route.pulls ? `${route.pulls} pulls` : route.duration || '', ref: route });
    }
    return items;
  }

  function search(items, query, lens, limit = 8) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const scored = [];
    for (const item of items) {
      if (!visible(lens, item.tier)) continue;
      const name = String(item.name || '').toLowerCase();
      let score = null;
      if (name.startsWith(q)) score = 0;
      else if (name.includes(` ${q}`) || name.includes(`-${q}`)) score = 1;
      else if (name.includes(q)) score = 2;
      else if (String(item.summary || '').toLowerCase().includes(q)) score = 3;
      if (score !== null) scored.push({ item, score });
    }
    scored.sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name));
    return scored.slice(0, limit).map(entry => entry.item);
  }

  // Hash forms: #loc-0011, #@0.7750,0.4300,4.00, or #loc-0011@0.7750,0.4300,4.00
  function parseHash(hash) {
    let text = String(hash || '').replace(/^#/, '');
    try {
      text = decodeURIComponent(text);
    } catch (err) {
      return {};
    }
    const match = /^([a-z0-9-]*)(?:@(-?\d*\.?\d+),(-?\d*\.?\d+),(\d*\.?\d+))?$/i.exec(text);
    if (!match) return {};
    const out = {};
    if (match[1]) out.id = match[1];
    if (match[2] !== undefined) out.view = { x: Number(match[2]), y: Number(match[3]), zoom: Number(match[4]) };
    return out;
  }

  function formatHash({ id, view } = {}) {
    let text = id || '';
    if (view) text += `@${view.x.toFixed(4)},${view.y.toFixed(4)},${view.zoom.toFixed(2)}`;
    return text ? `#${text}` : '';
  }

  // Label levels of detail, by zoom relative to the home view.
  const LABEL_ZOOM = { region: [0, 12], site: [1.4, Infinity], feature: [2.2, Infinity], sleeve: [3, Infinity], route: [1.8, Infinity] };

  function labelVisible(kind, zoomRatio) {
    const [min, max] = LABEL_ZOOM[kind] || [0, Infinity];
    return zoomRatio >= min && zoomRatio < max;
  }

  function tierLabel(tier) {
    return {
      primary_canon: 'Primary canon',
      working_canon: 'Working canon',
      speculative: 'Speculative',
      draft: 'Draft',
      canon: 'Canon',
      approved: 'Approved',
      cartographic: 'Cartographic'
    }[tier] || tier;
  }

  return {
    LENSES,
    ROMAN,
    lensTier,
    visible,
    toViewport,
    lengthToViewport,
    outlineBounds,
    buildIndex,
    search,
    parseHash,
    formatHash,
    labelVisible,
    tierLabel
  };
});
