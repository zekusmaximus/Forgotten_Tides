// Pure logic for the atlas map viewer: tier lenses, eras, coordinates, the
// item index, search, deep-link hashes, label levels of detail, inset plate
// fades, event markers, and the Z0 fade. It has no DOM
// or OpenSeadragon dependency, so Node tests load it directly
// (scripts/tests/test_map_viewer.js) and the page loads it as window.MapCore.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MapCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LENSES = ['primary', 'working', 'speculative'];
  // The era control (rule R15): two discrete states. Items carry "before",
  // "after", or "both".
  const ERAS = ['before', 'after'];
  const DEFAULT_ERA = 'after';
  const RANK = { primary: 0, working: 1, speculative: 2 };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  // Entity tiers and feature/route tiers map onto the three lens positions.
  // Canon, approved, and cartographic features count as primary; drafts and
  // speculative entities appear only under "+ Speculative".
  function lensTier(tier) {
    if (tier === 'primary_canon' || tier === 'canon' || tier === 'approved' || tier === 'cartographic' || tier === 'drawing-approved') return 'primary';
    if (tier === 'working_canon') return 'working';
    return 'speculative';
  }

  function visible(lens, tier) {
    return RANK[lensTier(tier)] <= RANK[lens];
  }

  function eraShows(itemEra, era) {
    return !itemEra || itemEra === 'both' || itemEra === era;
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

  function buildIndex(data) {
    const items = [];
    for (const region of data.regions || []) {
      items.push({ kind: 'region', id: region.id, name: region.name, tier: region.tier, xy: region.label_xy || [0, 0], summary: region.summary_50, ref: region });
    }
    for (const site of data.sites || []) {
      items.push({ kind: 'site', id: site.id, name: site.name, tier: site.tier, xy: site.xy, summary: site.summary_50, ref: site });
    }
    for (const feature of data.features || []) {
      if (feature.xy) {
        items.push({ kind: 'feature', id: feature.key, name: feature.label, tier: feature.tier, xy: feature.xy, summary: feature.note || '', ref: feature });
      }
      if (feature.kind === 'sleeves') {
        // Sleeve points come from the data build; the viewer keeps no geometry.
        for (const sleeve of (feature.sleeves || []).filter(s => s.xy)) {
          items.push({
            kind: 'sleeve',
            id: `sleeve-${sleeve.number}`,
            name: `Sleeve ${ROMAN[sleeve.number - 1] || sleeve.number}`,
            numeral: ROMAN[sleeve.number - 1] || String(sleeve.number),
            tier: feature.tier,
            xy: sleeve.xy,
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
      items.push({ kind: 'route', id: route.key, name: route.label, tier: route.tier, era: route.era || 'both', xy: mid, summary: route.pulls ? `${route.pulls} pulls` : route.duration || '', ref: route });
    }
    for (const pin of data.event_pins || []) {
      items.push({ kind: 'event', id: pin.id, name: pin.summary, tier: pin.tier, era: pin.era, xy: pin.xy, summary: pin.timestamp, ref: pin });
    }
    return items;
  }

  function search(items, query, lens, limit = 8, era = DEFAULT_ERA) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const scored = [];
    for (const item of items) {
      if (!visible(lens, item.tier) || !eraShows(item.era, era)) continue;
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

  // Hash forms: #loc-0011, #@0.7750,0.4300,4.00, or #loc-0011@0.7750,0.4300,4.00,
  // each optionally ending ~before or ~after. The era is written only when
  // it is not the default (decision Q30).
  function parseHash(hash) {
    let text = String(hash || '').replace(/^#/, '');
    try {
      text = decodeURIComponent(text);
    } catch (err) {
      return {};
    }
    const match = /^([a-z0-9-]*)(?:@(-?\d*\.?\d+),(-?\d*\.?\d+),(\d*\.?\d+))?(?:~(before|after))?$/i.exec(text);
    if (!match) return {};
    const out = {};
    if (match[1]) out.id = match[1];
    if (match[2] !== undefined) out.view = { x: Number(match[2]), y: Number(match[3]), zoom: Number(match[4]) };
    if (match[5]) out.era = match[5].toLowerCase();
    return out;
  }

  function formatHash({ id, view, era } = {}) {
    let text = id || '';
    // Deep inside an inset plate a view needs more places to land where it
    // was written.
    const places = view && view.zoom >= 20 ? 6 : 4;
    if (view) text += `@${view.x.toFixed(places)},${view.y.toFixed(places)},${view.zoom.toFixed(2)}`;
    if (era && era !== DEFAULT_ERA) text += `~${era}`;
    return text ? `#${text}` : '';
  }

  // Label levels of detail, by zoom relative to the home view.
  const LABEL_ZOOM = { region: [0, 12], site: [1.4, Infinity], feature: [2.2, Infinity], sleeve: [3, Infinity], route: [1.8, Infinity], isopleth: [1.7, Infinity] };

  function labelVisible(kind, zoomRatio) {
    const [min, max] = LABEL_ZOOM[kind] || [0, Infinity];
    return zoomRatio >= min && zoomRatio < max;
  }

  // A sounding: a canon memory density printed at its place, with at least
  // two decimals (0 -> "0.00", 0.015 -> "0.015"), and the as-of note without
  // its event reference.
  function sounding(entity) {
    const value = entity && entity.memory_density;
    if (typeof value !== 'number') return null;
    const places = Math.max(2, (String(value).split('.')[1] || '').length);
    const asOf = entity.memory_density_as_of ? String(entity.memory_density_as_of).replace(/\s*\([^)]*\)\s*$/, '') : null;
    return { value: value.toFixed(places), note: asOf };
  }

  function tierLabel(tier) {
    return {
      primary_canon: 'Primary canon',
      working_canon: 'Working canon',
      speculative: 'Speculative',
      draft: 'Draft',
      canon: 'Canon',
      approved: 'Approved',
      cartographic: 'Cartographic',
      'drawing-approved': 'Drawing approved'
    }[tier] || tier;
  }

  // A sounding in an era: a pre-breach sounding reads "unmeasured" after the
  // breach, with no figure (rules R6, R15).
  function soundingIn(entity, era) {
    if (era === 'after' && entity && entity.era_sounding && entity.era_sounding.after === 'unmeasured') {
      return { value: 'unmeasured', note: null, unmeasured: true };
    }
    return sounding(entity);
  }

  // The panel's density line in an era.
  function densityLine(entity, era) {
    const value = entity && entity.memory_density;
    if (typeof value !== 'number') return null;
    if (soundingIn(entity, era).unmeasured) return `Memory density unmeasured since the Tessarine Breach; last measured ${value}, before it.`;
    return `Memory density ${value}${entity.memory_density_as_of ? ` · ${entity.memory_density_as_of}` : ''}`;
  }

  function isoplethShown(iso, era) {
    return !(iso.hidden_in || []).includes(era);
  }

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // An inset plate fades in as its width on screen grows (decision Q23).
  const PLATE_FADE = [140, 280];
  function plateOpacity(platePx) {
    return smooth(PLATE_FADE[0], PLATE_FADE[1], platePx);
  }

  // Plate labels by level of detail, sized in plate units so they keep
  // their place on the plate, within a legible range of pixel sizes.
  const PLATE_LABELS = {
    title: { min: 0, units: 26 },
    room: { min: 300, units: 15 },
    detail: { min: 620, units: 12 },
    note: { min: 820, units: 10.5 }
  };
  function insetLabelVisible(level, platePx) {
    const spec = PLATE_LABELS[level] || PLATE_LABELS.detail;
    return plateOpacity(platePx) >= 0.6 && platePx >= spec.min;
  }
  function insetFontPx(level, platePx, units) {
    const [uw] = units || [1000];
    const spec = PLATE_LABELS[level] || PLATE_LABELS.detail;
    return Math.min(level === 'title' ? 30 : 18, Math.max(8, (spec.units * platePx) / uw));
  }

  // The Z0 scaffold fades in below the home view (decision Q34).
  const UNIVERSE_FADE = [0.45, 0.85];
  function universeOpacity(zoomRatio) {
    return 1 - smooth(UNIVERSE_FADE[0], UNIVERSE_FADE[1], zoomRatio);
  }

  // Event markers (rule R17). Pins on a route stand alone. Pins in an inset
  // gather into one marker per room while its plate shows, and otherwise
  // into one glyph per site, with no count.
  function eventMarkers(pins, { era = DEFAULT_ERA, lens = 'speculative', plates = new Set() } = {}) {
    const markers = new Map();
    for (const pin of pins || []) {
      if (!eraShows(pin.era, era) || !visible(lens, pin.tier)) continue;
      let key;
      let spec;
      if (pin.place.kind === 'route') {
        key = `route:${pin.id}`;
        spec = { kind: 'route', xy: pin.xy, route: pin.place.route };
      } else if (plates.has(pin.place.inset)) {
        key = `room:${pin.place.inset}:${pin.place.anchor}`;
        spec = { kind: 'room', xy: pin.xy, inset: pin.place.inset, anchor: pin.place.anchor, room: pin.place.room };
      } else {
        key = `site:${pin.place.site}`;
        spec = { kind: 'site', xy: pin.site_xy, site: pin.place.site, inset: pin.place.inset };
      }
      if (!markers.has(key)) markers.set(key, { key, ...spec, events: [] });
      markers.get(key).events.push(pin);
    }
    return [...markers.values()];
  }

  return {
    LENSES,
    ERAS,
    DEFAULT_ERA,
    ROMAN,
    PLATE_FADE,
    UNIVERSE_FADE,
    lensTier,
    visible,
    eraShows,
    toViewport,
    lengthToViewport,
    outlineBounds,
    buildIndex,
    search,
    parseHash,
    formatHash,
    labelVisible,
    sounding,
    soundingIn,
    densityLine,
    isoplethShown,
    plateOpacity,
    insetLabelVisible,
    insetFontPx,
    universeOpacity,
    eventMarkers,
    tierLabel
  };
});
