// Atlas map viewer. Draws the rendered tile pyramid with OpenSeadragon and
// layers the chart's data over it: region outlines and bands, routes, pins,
// and labels, all from data/atlas.json (built by `npm run map:data`). Phase 4
// adds the era control, the Z3 inset plates (rendered by `npm run
// map:insets`), event markers, layer toggles, and the Z0 scaffold. Pure
// logic lives in viewer_core.js (window.MapCore).
(function () {
  'use strict';

  const Core = window.MapCore;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_PIXEL_RATIO = 3;
  const state = {
    data: null,
    items: [],
    byId: new Map(),
    lens: 'primary',
    era: Core.DEFAULT_ERA,
    // 0 shows the Before state, 1 the After state; between them the era
    // control crossfades. Discrete things swap at the midpoint.
    eraMix: Core.DEFAULT_ERA === 'after' ? 1 : 0,
    selected: null,
    viewer: null,
    extent: 1.4,
    hasTiles: false,
    baseWidth: 2,
    layers: { routes: true, events: true, insets: true, isopleths: true, universe: true },
    pins: [],
    labels: [],
    shapes: [],
    plates: [],
    plateLabels: [],
    plateHoles: [],
    plateView: new Map(),
    markers: new Map(),
    universe: null
  };
  // Chart furniture is drawn in milli-chart units (y down) inside one group,
  // so text sizes stay well above the browser's minimum before scaling.
  const MILLI = 1000;
  const $ = selector => document.querySelector(selector);

  // Minimal DOM builder; text always goes through textContent.
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of [].concat(children)) if (child) node.append(child);
    return node;
  }

  function svg(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  const vp = xy => Core.toViewport(xy, state.extent);
  const vlen = length => Core.lengthToViewport(length, state.extent);
  // The era whose discrete states are shown: the control's choice once the
  // crossfade passes its midpoint.
  const shownEra = () => (state.eraMix >= 0.5 ? 'after' : 'before');

  function blankImage() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0A0D12';
    ctx.fillRect(0, 0, 2, 2);
    return canvas.toDataURL('image/png');
  }

  // ----- Shapes -----

  function drawOutline(group, outline, className, tier) {
    const extra = Core.lensTier(tier) === 'speculative' ? ' speculative' : '';
    for (const c of outline.circles || []) {
      const p = vp([c.x, c.y]);
      group.append(svg('circle', { cx: p.x, cy: p.y, r: vlen(c.r), class: className + extra }));
    }
    for (const polygon of outline.polygons || []) {
      const points = polygon.map(xy => { const p = vp(xy); return `${p.x},${p.y}`; }).join(' ');
      group.append(svg('polygon', { points, class: className + extra }));
    }
  }

  // An annulus about the chart's center, as one path with an even-odd hole.
  function bandPath(inner, outer, className) {
    const c = vp([0, 0]);
    const ring = r => {
      const rr = vlen(r);
      return `M${c.x + rr},${c.y} A${rr},${rr} 0 1,0 ${c.x - rr},${c.y} A${rr},${rr} 0 1,0 ${c.x + rr},${c.y} Z`;
    };
    return svg('path', { d: `${ring(outer)} ${ring(inner)}`, 'fill-rule': 'evenodd', class: className });
  }

  function buildDefs() {
    const root = $('#shapes');
    const defs = svg('defs');
    // The softening screen: a hatch whose spacing is reset in screen pixels
    // on every frame (render), so it reads the same at any zoom.
    const pattern = svg('pattern', { id: 'softening-hatch', patternUnits: 'userSpaceOnUse', width: 1, height: 1 });
    pattern.append(svg('path', { id: 'softening-hatch-line', class: 'hatch-line', d: 'M0,1 L1,0' }));
    // Chart overlays fade out under a visible inset plate.
    const mask = svg('mask', { id: 'plate-mask', maskUnits: 'userSpaceOnUse', x: -20, y: -20, width: 41, height: 41 });
    mask.append(svg('rect', { x: -20, y: -20, width: 41, height: 41, fill: 'white' }));
    for (const inset of state.data.insets || []) {
      const a = vp([inset.rect.left, inset.rect.top]);
      const hole = svg('rect', { x: a.x, y: a.y, width: vlen(inset.rect.width), height: vlen(inset.rect.height), fill: 'black', 'fill-opacity': 0 });
      mask.append(hole);
      state.plateHoles.push({ node: hole, key: inset.key });
    }
    defs.append(pattern, mask);
    root.prepend(defs);
  }

  function buildShapes() {
    const world = $('#world');
    world.textContent = '';
    const content = svg('g', { id: 'world-content', mask: 'url(#plate-mask)' });
    world.append(content);
    const { data } = state;
    const add = (node, tier, extra = {}) => {
      content.append(node);
      state.shapes.push({ node, tier, ...extra });
    };
    for (const region of data.regions) {
      const group = svg('g', { 'data-tier': region.tier });
      drawOutline(group, region.outline, `outline t-${region.treatment || 'none'}`, region.tier);
      for (const band of region.bands || []) {
        drawOutline(group, band.outline, 'band', region.tier);
        for (const sub of band.subband_outlines || []) drawOutline(group, sub, 'subband', region.tier);
      }
      add(group, region.tier);
    }
    for (const feature of data.features) {
      const group = svg('g', { 'data-tier': feature.tier });
      if (feature.kind === 'edge-line' && feature.along_outline) {
        const inner = [...feature.along_outline.circles].sort((a, b) => a.r - b.r)[0];
        if (inner) drawOutline(group, { circles: [inner] }, 'edge-line', feature.tier);
      }
      // The tiles draw the knots; these marks show only without tiles.
      for (const xy of feature.positions_xy || []) {
        const p = vp(xy);
        group.append(svg('circle', { cx: p.x, cy: p.y, r: vlen(0.006), class: 'knot' }));
      }
      add(group, feature.tier);
      // A softening sleeve draws its screen after the breach, with no
      // figure (rule R9).
      for (const sleeve of feature.sleeves || []) {
        if (!sleeve.ring_inner || !sleeve.post_breach || sleeve.post_breach.sleeve !== 'softening') continue;
        const band = bandPath(sleeve.ring_inner, sleeve.ring_outer, 'softening');
        band.setAttribute('data-sleeve', sleeve.number);
        add(band, feature.tier, { era: feature.post_breach_era || 'after', fade: true });
      }
    }
    for (const site of data.sites) {
      if (!site.circuit) continue;
      const group = svg('g', { 'data-tier': site.tier });
      drawOutline(group, { circles: [{ x: site.xy[0], y: site.xy[1], r: site.circuit.radius }] }, 'circuit', site.tier);
      add(group, site.tier);
    }
    for (const route of data.routes) {
      const points = route.points.map(xy => { const p = vp(xy); return `${p.x},${p.y}`; }).join(' ');
      const classes = ['route'];
      if (route.kind === 'tether') classes.push('tether');
      if (route.run === 'intended') classes.push('intended');
      if (route.origin === 'none') classes.push('open-tail');
      if (Core.lensTier(route.tier) === 'speculative') classes.push('speculative');
      const line = svg('polyline', { points, class: classes.join(' '), 'data-route': route.key });
      add(line, route.tier, { era: route.era, layer: 'routes', fade: true });
      // An intended run ends in an arrowhead (rule R16), redrawn at a fixed
      // size in pixels on every frame (render).
      if (route.run === 'intended' && route.points.length >= 2) {
        const head = svg('polyline', { class: 'run-arrow', 'data-route': route.key });
        add(head, route.tier, { era: route.era, layer: 'routes', fade: true });
        state.arrows = (state.arrows || []).concat({ node: head, from: vp(route.points[route.points.length - 2]), to: vp(route.points[route.points.length - 1]) });
      }
    }
    // Past the base tiles' resolution, near a plate, a mat darkens the chart
    // around the plate rather than showing it blurred.
    state.mat = svg('rect', { x: -20, y: -20, width: 41, height: 41, class: 'deep-mat', mask: 'url(#plate-mask)', opacity: 0 });
    world.append(state.mat);
    buildFurniture(world);
  }

  // ----- Chart furniture: degree labels, title, notes, tint key, rose -----

  function buildFurniture(world) {
    const { data } = state;
    const k = 1 / (2 * state.extent * MILLI);
    const sheet = svg('g', { class: 'furniture', transform: `translate(0.5 0.5) scale(${k})` });
    const at = (x, y) => [x * MILLI, -y * MILLI];
    const text = (x, y, content, className, attrs = {}) => {
      const [px, py] = at(x, y);
      const node = svg('text', { x: px, y: py, class: className, ...attrs });
      node.textContent = content;
      sheet.append(node);
      return node;
    };
    const line = (points, className) => {
      sheet.append(svg('polyline', { points: points.map(([x, y]) => at(x, y).join(',')).join(' '), class: className }));
    };

    // Degree labels outside the frame, every 30 degrees.
    for (let theta = 0; theta < 360; theta += 30) {
      const a = (theta * Math.PI) / 180;
      text(1.268 * Math.cos(a), 1.268 * Math.sin(a), `${theta}°`, 'f-degree', { 'dominant-baseline': 'middle', 'text-anchor': 'middle' });
    }

    // Title cartouche, upper left.
    line([[-1.37, 1.37], [-0.64, 1.37], [-0.64, 1.13], [-1.37, 1.13], [-1.37, 1.37]], 'f-rule');
    line([[-1.36, 1.36], [-0.65, 1.36], [-0.65, 1.14], [-1.36, 1.14], [-1.36, 1.36]], 'f-rule thin');
    text(-1.005, 1.295, 'THE KNOWN GALAXY', 'f-title', { 'text-anchor': 'middle' });
    text(-1.005, 1.245, 'A coherence chart', 'f-subtitle', { 'text-anchor': 'middle' });
    text(-1.005, 1.2, 'Isopleths of memory density at intervals of 0.05, interpolated', 'f-small', { 'text-anchor': 'middle' });
    text(-1.005, 1.168, `Soundings are canon measurements · ${data.build === 'public' ? 'Public' : 'Author'} build`, 'f-small', { 'text-anchor': 'middle' });

    // Notes, upper right.
    const notes = [
      'NOTES',
      'All positions, sizes, and drawn counts are approximate (P.A.).',
      'Corridor legs are counted in pulls, never converted to distance.',
      'Lanes mark where corridors tend to form: computed, illustrative,',
      'never routes. Corridors are temporary.',
      'Eddies: area symbol; count and positions illustrative.',
      'Void Regions: nothing is charted inside.',
      'Lattice Gap: linework printed out of register.',
      'E.D. existence doubtful.'
    ];
    notes.forEach((note, i) => text(0.66, 1.345 - i * 0.026, note, i === 0 ? 'f-heading' : 'f-small'));
    // After the breach the field's soundings are pre-breach (rule R15).
    if (data.eras && data.eras.legend_note) {
      state.eraNote = text(0.66, 1.345 - notes.length * 0.026, data.eras.legend_note, 'f-small era-note');
    }

    // Tint key, lower left: one swatch per band, densest on the right.
    const tints = (data.chart && data.chart.tints) || [];
    const x0 = -1.36;
    const width = 0.72 / Math.max(1, tints.length);
    text(x0, -1.155, 'MEMORY DENSITY (coherence units)', 'f-heading');
    tints.forEach((tint, i) => {
      const [sx, sy] = at(x0 + i * width, -1.18);
      sheet.append(svg('rect', { x: sx, y: sy, width: width * MILLI, height: 0.06 * MILLI, fill: tint.color, class: 'f-swatch' }));
      if (i > 0) text(x0 + i * width, -1.27, String(tint.from), 'f-tick', { 'text-anchor': 'middle' });
    });
    text(x0, -1.31, 'Each tint is a band between isopleths; the band edges are interpolated.', 'f-small');
    text(x0, -1.34, 'Soundings (italic) are the only measured values.', 'f-small');

    // Rose, lower right: degrees counterclockwise from the right-hand side,
    // as the chart frame counts them. There is no north.
    const [cx, cy] = [1.19, -1.19];
    const rose = svg('g', { class: 'f-rose', transform: `translate(${cx * MILLI} ${-cy * MILLI})` });
    const R = 0.15 * MILLI;
    rose.append(svg('circle', { r: R, class: 'f-rule' }), svg('circle', { r: R * 0.93, class: 'f-rule thin' }));
    for (let deg = 0; deg < 360; deg += 5) {
      const a = (deg * Math.PI) / 180;
      const inner = deg % 30 === 0 ? R * 0.82 : deg % 10 === 0 ? R * 0.87 : R * 0.9;
      rose.append(svg('line', { x1: Math.cos(a) * inner, y1: -Math.sin(a) * inner, x2: Math.cos(a) * R * 0.93, y2: -Math.sin(a) * R * 0.93, class: 'f-rule thin' }));
    }
    for (let deg = 0; deg < 360; deg += 45) {
      const a = (deg * Math.PI) / 180;
      const long = deg % 90 === 0;
      const tip = long ? R * 0.78 : R * 0.5;
      const side = (deg + 90) * (Math.PI / 180);
      const w = R * 0.07;
      const half = (fill, sign) => svg('polygon', {
        points: [[0, 0], [Math.cos(a) * tip, -Math.sin(a) * tip], [sign * Math.cos(side) * w, -sign * Math.sin(side) * w]].map(p => p.join(',')).join(' '),
        class: fill
      });
      rose.append(half('f-point light', 1), half('f-point dark', -1));
    }
    for (const deg of [0, 90, 180, 270]) {
      const a = (deg * Math.PI) / 180;
      const label = svg('text', { x: Math.cos(a) * R * 1.16, y: -Math.sin(a) * R * 1.16, class: 'f-degree', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      label.textContent = `${deg}°`;
      rose.append(label);
    }
    sheet.append(rose);
    text(cx, cy - 0.205, 'θ counterclockwise · no north', 'f-small', { 'text-anchor': 'middle' });

    world.append(sheet);
    state.furniture = sheet;
  }

  // ----- Pins and labels -----

  // A sounding label's text in the shown era: canon values only, and
  // "unmeasured" for a pre-breach value after the breach (rules R6, R15).
  function soundingText(entity) {
    const depth = Core.soundingIn(entity, shownEra());
    if (!depth) return null;
    return { text: depth.note ? `${depth.value} · ${depth.note}` : depth.value, unmeasured: Boolean(depth.unmeasured) };
  }

  function setSounding(node, entity) {
    const depth = soundingText(entity);
    node.textContent = depth ? depth.text : '';
    node.classList.toggle('unmeasured', Boolean(depth && depth.unmeasured));
  }

  function buildMarkers() {
    const pins = $('#pins');
    const labels = $('#labels');
    pins.textContent = '';
    labels.textContent = '';
    state.soundings = [];
    for (const item of state.items) {
      if (item.kind === 'event') continue;
      const spec = Core.lensTier(item.tier) === 'speculative' ? ' speculative' : '';
      const point = vp(item.xy);
      if (item.kind === 'site' || item.kind === 'feature') {
        let className = 'pin';
        let text = null;
        if (item.kind === 'feature') className += item.ref.kind === 'historical-site' ? ' historical' : ' feature';
        if (item.ref.marker === 'existence-doubtful') { className += ' existence-doubtful'; text = 'E.D.'; }
        const pin = el('button', {
          type: 'button',
          class: className + spec,
          'data-id': item.id,
          'aria-label': `${item.name}, ${Core.tierLabel(item.tier)}`,
          text,
          onclick: event => { event.stopPropagation(); select(item.id, { fly: false }); }
        });
        pins.append(pin);
        state.pins.push({ node: pin, item, point });
      }
      const labelText = item.kind === 'sleeve' ? item.numeral
        : item.kind === 'route' ? (item.ref.pulls ? `${item.ref.pulls} pulls` : item.ref.duration || '')
        : item.kind === 'region' && item.ref.treatment === 'void' ? `${item.name} · nothing charted inside`
        : item.name;
      if (!labelText) continue;
      const treatment = item.kind === 'region' && item.ref.treatment ? ` t-${item.ref.treatment}` : '';
      // Sites carry their soundings beside their names: canon values, in
      // italic. Region soundings print at their own points, below.
      const hasDepth = item.kind === 'site' && Core.sounding(item.ref);
      const depthNode = hasDepth ? el('em', { class: 'depth' }) : null;
      if (depthNode) {
        setSounding(depthNode, item.ref);
        state.soundings.push({ node: depthNode, entity: item.ref });
      }
      const label = el('div', { class: `label ${item.kind}${treatment}${spec}`, 'data-id': item.id }, el('span', {}, [labelText, depthNode]));
      labels.append(label);
      state.labels.push({ node: label, item, point });
      // A region's sounding sits where the field reads its value.
      if (item.kind === 'region' && item.ref.sounding_xy && Core.sounding(item.ref)) {
        const inner = el('span');
        setSounding(inner, item.ref);
        state.soundings.push({ node: inner, entity: item.ref });
        const sounding = el('div', { class: `label sounding ink-${item.ref.sounding_ink || 'light'}${spec}`, 'data-id': item.id }, inner);
        labels.append(sounding);
        state.labels.push({ node: sounding, item, point: vp(item.ref.sounding_xy) });
      }
    }
    // Isopleth values, set along their lines with a knockout in the band's
    // tint. These are interpolation bands, never measurements.
    state.isopleths = [];
    for (const iso of (state.data.chart && state.data.chart.isopleths) || []) {
      const span = el('span', { text: iso.label });
      span.style.transform = `translate(-50%, -50%) rotate(${-iso.angle}deg)`;
      span.style.setProperty('--knockout', iso.bg);
      const label = el('div', { class: `label isopleth ink-${iso.ink}` }, span);
      labels.append(label);
      state.isopleths.push({ node: label, point: vp(iso.xy), iso });
    }
    // The Z0 label: the chart's title under the galaxy, nothing else (R18).
    if (state.data.universe) {
      const node = el('div', { class: 'label universe-label' }, el('span', { text: state.data.universe.label }));
      labels.append(node);
      state.universeLabel = { node, point: vp(state.data.universe.label_xy) };
    }
  }

  function refreshSoundings() {
    for (const entry of state.soundings || []) setSounding(entry.node, entry.entity);
  }

  // ----- Inset plates -----

  // Live labels for each plate and era: the title band (title, sounding,
  // caption) and the labels the data build placed (rule R14).
  function buildPlateLabels() {
    const box = $('#inset-labels');
    box.textContent = '';
    state.plateLabels = [];
    for (const inset of state.data.insets || []) {
      const site = state.data.sites.find(entry => entry.id === inset.site);
      const toChart = ([u, v]) => {
        const s = inset.rect.width / inset.units[0];
        return [inset.rect.left + u * s, inset.rect.top - v * s];
      };
      const add = (era, label, node) => {
        box.append(node);
        state.plateLabels.push({ node, inset, era, label, point: vp(label.xy || toChart(label.at)) });
      };
      const [uw] = inset.units;
      for (const era of inset.eras) {
        add(era, { level: 'title', align: 'middle', at: [uw / 2, 38], tier: inset.tier }, el('div', { class: 'label plate-label title' }, el('span', { text: inset.title.toUpperCase() })));
        const depthNode = el('span');
        const depthEra = era === 'both' ? null : era;
        const depth = site ? Core.soundingIn(site, depthEra || shownEra()) : null;
        if (depth) {
          depthNode.textContent = depth.note ? `${depth.value} · ${depth.note}` : depth.value;
          depthNode.classList.toggle('unmeasured', Boolean(depth.unmeasured));
          add(era, { level: 'room', align: 'middle', at: [uw / 2, 62], tier: inset.tier, sounding: true }, el('div', { class: 'label plate-label sounding-line' }, depthNode));
        }
        if (inset.caption) {
          add(era, { level: 'detail', align: 'middle', at: [uw / 2, 80], width: uw - 120, tier: inset.tier }, el('div', { class: 'label plate-label caption' }, el('span', { text: inset.caption })));
        }
        for (const label of (inset.layers[era] || {}).labels || []) {
          const classes = ['label', 'plate-label', `lod-${label.level || 'detail'}`];
          if (label.style) classes.push(label.style);
          let span;
          if (label.style === 'lintel' && label.before_gap !== undefined) {
            // The forgotten word's place: a smooth space, never the word
            // (rule R14).
            const gap = el('span', { class: 'lintel-gap', role: 'img', 'aria-label': 'a smooth space the length of one word' });
            gap.style.width = `${(label.gap_chars * 0.52 + 0.28).toFixed(2)}em`;
            span = el('span', {}, [label.before_gap, gap, label.after_gap]);
          } else {
            span = el('span', { text: label.text });
          }
          add(era, label, el('div', { class: classes.join(' '), 'data-inset': inset.key, 'data-key': label.key }, span));
        }
      }
    }
  }

  // Adds each rendered plate to the viewer as its own image, at its chart
  // rectangle. Hidden plates load nothing (OpenSeadragon skips images at
  // zero opacity).
  function addPlates(manifest) {
    const version = encodeURIComponent(manifest.generated);
    for (const entry of manifest.plates || []) {
      const inset = (state.data.insets || []).find(item => item.key === entry.key);
      if (!inset || !inset.eras.includes(entry.era)) continue;
      const stale = ['left', 'top', 'width'].some(key => Math.abs(entry.rect[key] - inset.rect[key]) > 1e-6);
      if (stale) {
        const notice = $('#notice');
        notice.textContent = 'The inset plates were rendered for older placements. Run npm run map:insets to match.';
        notice.hidden = false;
        continue;
      }
      const at = vp([inset.rect.left, inset.rect.top]);
      const plate = { key: inset.key, era: entry.era, inset, item: null, pixelWidth: entry.width, rect: { x: at.x, y: at.y, width: vlen(inset.rect.width), height: vlen(inset.rect.height) } };
      state.plates.push(plate);
      state.viewer.addTiledImage({
        tileSource: `insets/${entry.dzi}?v=${version}`,
        x: plate.rect.x,
        y: plate.rect.y,
        width: plate.rect.width,
        opacity: 0,
        success: event => { plate.item = event.item; render(); }
      });
    }
  }

  // Deep zoom is allowed only near a shown plate; elsewhere the chart stops
  // at its own resolution.
  function updateMaxZoom(center) {
    const { viewport } = state.viewer;
    const container = Math.max(1, viewport.getContainerSize().x);
    let max = (state.baseWidth * MAX_PIXEL_RATIO) / container;
    if (state.layers.insets) {
      for (const plate of state.plates) {
        const r = plate.rect;
        const near = center.x > r.x - r.width && center.x < r.x + 2 * r.width && center.y > r.y - r.height && center.y < r.y + 2 * r.height;
        if (near) max = Math.max(max, ((plate.pixelWidth / r.width) * MAX_PIXEL_RATIO) / container);
      }
    }
    viewport.maxZoomLevel = max;
  }

  // ----- Event markers -----

  function markerNode(marker) {
    let entry = state.markers.get(marker.key);
    if (!entry) {
      const node = el('button', {
        type: 'button',
        class: `pin event-marker ${marker.kind}`,
        'data-marker': marker.key,
        onclick: event => {
          event.stopPropagation();
          const current = state.markers.get(marker.key).marker;
          if (current.events.length === 1) select(current.events[0].id, { fly: false });
          else selectGroup(current);
        }
      });
      $('#pins').append(node);
      entry = { node, marker };
      state.markers.set(marker.key, entry);
    }
    entry.marker = marker;
    const where = marker.kind === 'route' ? 'on its route' : marker.kind === 'room' ? `in the ${String(marker.room).toLowerCase()}` : 'here';
    entry.node.setAttribute('aria-label', marker.events.length === 1 ? `Event ${where}: ${marker.events[0].summary}` : `Events ${where}`);
    return entry;
  }

  // ----- Rendering -----

  function render() {
    const { viewer } = state;
    if (!viewer || !viewer.world.getItemCount()) return;
    const origin = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    const unit = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(1, 0), true).x - origin.x;
    $('#world').setAttribute('transform', `translate(${origin.x} ${origin.y}) scale(${unit})`);
    const zoomRatio = viewer.viewport.getZoom(true) / viewer.viewport.getHomeZoom();
    const era = shownEra();
    const mix = state.eraMix;
    const center = viewer.viewport.getCenter(true);
    updateMaxZoom(center);
    const baseMax = (state.baseWidth * MAX_PIXEL_RATIO) / Math.max(1, viewer.viewport.getContainerSize().x);
    const beyond = viewer.viewport.getZoom(true) / Math.max(baseMax, 1e-9);
    if (state.mat) state.mat.setAttribute('opacity', state.hasTiles ? (0.92 * Math.min(1, Math.max(0, (beyond - 0.5) / 1.0))).toFixed(3) : 0);
    // Zooming out stops where the scaffold still covers the whole view.
    if (state.universe && state.layers.universe) {
      const home = viewer.viewport.getHomeBounds();
      const widest = Math.max(home.width, home.height) * 2 * state.extent;
      viewer.viewport.minZoomImageRatio = Math.min(0.6, (1.04 * widest) / (2 * state.universe.extent));
    } else {
      viewer.viewport.minZoomImageRatio = 0.6;
    }

    // Z0: the scaffold fades in below the home view and the chart's own
    // furniture and markers fade out (decision Q34).
    const z0 = state.universe && state.layers.universe ? Core.universeOpacity(zoomRatio) : 0;
    const atUniverse = z0 > 0.5;
    if (state.universe) {
      const node = state.universe.node;
      node.hidden = z0 <= 0;
      if (z0 > 0) {
        const extent = state.universe.extent;
        const a = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(...Object.values(vp([-extent, extent]))), true);
        const size = vlen(2 * extent) * unit;
        node.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`;
        node.style.width = `${size.toFixed(1)}px`;
        node.style.height = `${size.toFixed(1)}px`;
        node.style.opacity = z0.toFixed(3);
      }
    }
    if (state.furniture) state.furniture.style.opacity = (1 - z0).toFixed(3);
    if (state.eraNote) state.eraNote.style.display = era === 'after' ? '' : 'none';

    // Plates: each fades in by its width on screen; a two-era plate
    // crossfades between its Before and After rasters.
    const platesShown = new Set();
    state.plateView.clear();
    for (const inset of state.data.insets || []) {
      const px = vlen(inset.rect.width) * unit;
      const opacity = state.layers.insets && !atUniverse ? Core.plateOpacity(px) : 0;
      state.plateView.set(inset.key, { px, opacity });
      // Room markers need a drawn plate; without its raster the site keeps
      // its glyph.
      if (opacity > 0.5 && state.plates.some(plate => plate.key === inset.key && plate.item)) platesShown.add(inset.key);
    }
    for (const plate of state.plates) {
      if (!plate.item) continue;
      const view = state.plateView.get(plate.key);
      const weight = plate.era === 'before' ? 1 - mix : plate.era === 'after' ? mix : 1;
      plate.item.setOpacity(view.opacity * weight);
      // Keep both eras loaded while a plate shows, so the switch is instant.
      plate.item.setPreload(view.opacity > 0);
    }
    for (const hole of state.plateHoles) {
      const view = state.plateView.get(hole.key);
      const drawn = state.plates.some(plate => plate.key === hole.key && plate.item);
      hole.node.setAttribute('fill-opacity', drawn ? view.opacity.toFixed(3) : 0);
    }
    const underPlate = point => (state.data.insets || []).some(inset => {
      const view = state.plateView.get(inset.key);
      if (!view || view.opacity < 0.5 || !state.plates.some(plate => plate.key === inset.key && plate.item)) return false;
      const a = vp([inset.rect.left, inset.rect.top]);
      return point.x >= a.x && point.x <= a.x + vlen(inset.rect.width) && point.y >= a.y && point.y <= a.y + vlen(inset.rect.height);
    });

    for (const shape of state.shapes) {
      const on = Core.visible(state.lens, shape.tier) && (!shape.layer || state.layers[shape.layer]) && !atUniverse;
      const eraWeight = shape.era === 'after' ? mix : shape.era === 'before' ? 1 - mix : 1;
      shape.node.style.display = on && eraWeight > 0 ? '' : 'none';
      if (shape.fade) shape.node.style.opacity = eraWeight < 1 ? eraWeight.toFixed(3) : '';
    }
    for (const arrow of state.arrows || []) {
      // The tip stops short of the pin at the run's end, so both show.
      const size = 10 / unit;
      const angle = Math.atan2(arrow.to.y - arrow.from.y, arrow.to.x - arrow.from.x);
      const tip = { x: arrow.to.x - (9 / unit) * Math.cos(angle), y: arrow.to.y - (9 / unit) * Math.sin(angle) };
      const wing = turn => `${tip.x + size * Math.cos(angle + turn)},${tip.y + size * Math.sin(angle + turn)}`;
      arrow.node.setAttribute('points', `${wing(2.6)} ${tip.x},${tip.y} ${wing(-2.6)}`);
    }
    // The softening hatch keeps its spacing in screen pixels.
    if (unit > 0) {
      const spacing = 7 / unit;
      const pattern = $('#softening-hatch');
      pattern.setAttribute('width', spacing);
      pattern.setAttribute('height', spacing);
      const lineNode = $('#softening-hatch-line');
      lineNode.setAttribute('d', `M0,${spacing} L${spacing},0`);
      lineNode.setAttribute('stroke-width', 1.4 / unit);
    }
    // Band rings appear at region zoom; the minimap only once zoomed in, so
    // at the overview neither covers the chart or its furniture.
    $('#shapes').classList.toggle('zoom-far', zoomRatio < 2.2);
    if (viewer.navigator) viewer.navigator.element.style.visibility = zoomRatio < 1.25 ? 'hidden' : 'visible';
    const place = (entry, show) => {
      entry.node.hidden = !show;
      if (!show) return;
      const p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(entry.point.x, entry.point.y), true);
      entry.node.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    };
    for (const pin of state.pins) place(pin, Core.visible(state.lens, pin.item.tier) && !atUniverse && !underPlate(pin.point));
    for (const label of state.labels) {
      const item = label.item;
      const show = Core.visible(state.lens, item.tier) && Core.eraShows(item.era, era) && !atUniverse && !underPlate(label.point) &&
        (item.kind !== 'route' || state.layers.routes) &&
        (Core.labelVisible(item.kind, zoomRatio) || (state.selected && state.selected.id === item.id));
      place(label, show);
    }
    const isoShow = Core.labelVisible('isopleth', zoomRatio) && state.layers.isopleths && !atUniverse;
    for (const iso of state.isopleths || []) place(iso, isoShow && Core.isoplethShown(iso.iso, era) && !underPlate(iso.point));
    if (state.universeLabel) place(state.universeLabel, atUniverse);

    // Plate labels, sized in plate units within a legible range.
    for (const entry of state.plateLabels) {
      const view = state.plateView.get(entry.inset.key);
      const eraOk = entry.era === 'both' || entry.era === era;
      const show = Boolean(view) && view.opacity >= 0.6 && eraOk && state.plates.some(plate => plate.key === entry.inset.key && plate.item) &&
        Core.visible(state.lens, entry.label.tier) && Core.insetLabelVisible(entry.label.level, view.px);
      place(entry, show);
      if (!show) continue;
      const scale = view.px / entry.inset.units[0];
      entry.node.style.fontSize = `${Core.insetFontPx(entry.label.level, view.px, entry.inset.units).toFixed(1)}px`;
      entry.node.dataset.align = entry.label.align || 'middle';
      if (entry.label.width) entry.node.style.width = `${(entry.label.width * scale).toFixed(1)}px`;
      entry.node.style.opacity = Math.min(1, (view.opacity - 0.6) / 0.3).toFixed(3);
    }

    // Event markers (rule R17).
    const markers = state.layers.events && !atUniverse ? Core.eventMarkers(state.data.event_pins, { era, lens: state.lens, plates: platesShown }) : [];
    const live = new Set();
    for (const marker of markers) {
      const entry = markerNode(marker);
      live.add(marker.key);
      const routeShown = marker.kind !== 'route' || state.layers.routes;
      const point = vp(marker.xy);
      const p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(point.x, point.y), true);
      // A site glyph sits beside its site's pin.
      const offset = marker.kind === 'site' ? [-15, -11] : [0, 0];
      entry.node.hidden = !routeShown || (marker.kind === 'site' && Core.labelVisible('site', zoomRatio) === false);
      entry.node.style.transform = `translate(${(p.x + offset[0]).toFixed(1)}px, ${(p.y + offset[1]).toFixed(1)}px)`;
      entry.node.classList.toggle('selected', Boolean(state.selected) && marker.events.some(event => event.id === state.selected.id));
    }
    for (const [key, entry] of state.markers) if (!live.has(key)) entry.node.hidden = true;
  }

  // ----- Selection, panel, and hash -----

  function itemsLinked(list) {
    return (list || []).filter(link => Core.visible(state.lens, link.tier));
  }

  function linkList(title, links, describe) {
    if (!links.length) return null;
    return [el('h3', { text: title }), el('ul', {}, links.map(describe))];
  }

  function copyButton(text) {
    return el('button', {
      type: 'button',
      class: 'copy',
      text: 'Copy path',
      onclick: event => {
        const button = event.currentTarget;
        const done = ok => { button.textContent = ok ? 'Copied' : 'Select and copy'; };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
        else done(false);
      }
    });
  }

  const eventLine = event => el('li', {}, [el('small', { text: `${event.timestamp} ` }), event.summary]);

  function entityPanel(entity) {
    const era = shownEra();
    const parts = [
      el('h2', { text: entity.name }),
      el('div', { class: 'row' }, [
        el('span', { class: `tier ${Core.lensTier(entity.tier)}`, text: Core.tierLabel(entity.tier) }),
        el('span', { class: 'meta', text: [entity.location_type, entity.region].filter(Boolean).join(' · ') })
      ])
    ];
    const density = Core.densityLine(entity, era);
    if (density) parts.push(el('p', { class: 'sounding', text: density }));
    if (entity.summary_200) parts.push(el('p', { text: entity.summary_200 }));
    if (entity.claims && entity.claims.length) parts.push(el('p', { class: 'note', text: `Placed per ${entity.claims.join(', ')} (design/map/CARTOGRAPHIC_BRIEF.md)` }));
    const inset = (state.data.insets || []).find(entry => entry.site === entity.id);
    if (inset) {
      parts.push(el('h3', { text: 'Inset plate' }), el('p', { text: inset.caption }));
      const lintel = ((inset.layers[era] || inset.layers.both || {}).labels || []).find(label => label.style === 'lintel');
      if (lintel && lintel.before_gap !== undefined) {
        parts.push(el('p', { class: 'note', text: `The lintel now reads "${lintel.before_gap} ${lintel.after_gap}" A smooth space the length of one word lies where a word was, with no tool mark.` }));
      }
    }
    const byType = type => itemsLinked(entity.links).filter(link => link.type === type);
    const describe = link => el('li', {}, [link.name, ' ', el('small', { text: Core.lensTier(link.tier) === 'speculative' ? `${link.id} · ${Core.tierLabel(link.tier)}` : link.id })]);
    for (const [title, type] of [['Stories', 'story'], ['Characters', 'character'], ['Factions', 'faction']]) {
      const block = linkList(title, byType(type), describe);
      if (block) parts.push(...block);
    }
    const events = itemsLinked(entity.events).filter(event => Core.eraShows(event.era, era));
    if (events.length) parts.push(el('h3', { text: 'Events' }), el('ul', {}, events.map(eventLine)));
    if (entity.path) parts.push(el('h3', { text: 'Source' }), el('div', { class: 'row' }, [el('code', { text: entity.path }), copyButton(entity.path)]));
    return parts;
  }

  function featurePanel(item) {
    const feature = item.ref;
    const era = shownEra();
    const parts = [
      el('h2', { text: item.name }),
      el('div', { class: 'row' }, [el('span', { class: `tier ${Core.lensTier(feature.tier)}`, text: Core.tierLabel(feature.tier) }), el('span', { class: 'meta', text: feature.kind || '' })])
    ];
    if (feature.note) parts.push(el('p', { text: feature.note }));
    if (item.kind === 'route') {
      const facts = [feature.pulls ? `${feature.pulls} pulls` : null, feature.duration || null, feature.story || null].filter(Boolean).join(' · ');
      if (facts) parts.push(el('p', { class: 'sounding', text: facts }));
      if (feature.origin === 'none') parts.push(el('p', { class: 'note', text: 'Only the approach is charted; canon gives no origin.' }));
      if (feature.run === 'intended') parts.push(el('p', { class: 'note', text: 'An intended run, drawn dashed: canon records the count stated for it, not the run.' }));
      if (feature.era === 'after') parts.push(el('p', { class: 'note', text: 'Shown after the Tessarine Breach only: canon gives this count for that era.' }));
      const events = (feature.events || []).filter(event => Core.eraShows(event.era, era));
      if (events.length) {
        parts.push(el('h3', { text: 'Events of the run' }), el('ul', {}, events.map(event => el('li', {}, [
          el('small', { text: `${event.timestamp} ` }),
          event.summary,
          event.placed ? null : el('small', { text: ' · not placed: canon gives no position' })
        ]))));
      }
    }
    if (feature.kind === 'sleeves') {
      const after = era === 'after';
      parts.push(el('table', {}, [
        el('tr', {}, [el('th', { text: 'Sleeve' }), el('th', { text: 'People' }), after ? el('th', { text: 'After the breach' }) : null]),
        ...(feature.sleeves || []).map(sleeve => el('tr', {}, [
          el('td', { text: Core.ROMAN[sleeve.number - 1] || String(sleeve.number) }),
          el('td', { text: sleeve.population ? `${sleeve.approximate ? 'about ' : ''}${sleeve.population.toLocaleString('en-US')}` : '—' }),
          after ? el('td', { text: sleeve.post_breach ? `silo ${sleeve.post_breach.silo}${sleeve.post_breach.sleeve === 'softening' ? ', softening' : ''}` : '—' }) : null
        ]))
      ]));
    }
    const basis = [...(feature.claims || []), ...(feature.rules || [])];
    if (basis.length) parts.push(el('p', { class: 'note', text: `Basis: ${basis.join(', ')}` }));
    return parts;
  }

  function sleevePanel(item) {
    const sleeve = item.ref;
    const facts = [
      sleeve.population ? `${sleeve.approximate ? 'About ' : ''}${sleeve.population.toLocaleString('en-US')} people` : 'Population not given in canon',
      sleeve.stations ? `${sleeve.stations} stations` : null,
      sleeve.city_ships ? `${sleeve.city_ships} city-ship` : null
    ].filter(Boolean).join(' · ');
    return [
      el('h2', { text: item.name }),
      el('div', { class: 'row' }, [el('span', { class: 'tier primary', text: 'Canon' }), el('span', { class: 'meta', text: 'Helios Drift outer sleeve, counted outward' })]),
      el('p', { class: 'sounding', text: facts }),
      sleeve.post_breach && shownEra() === 'after' ? el('p', { text: `After the Tessarine Breach: silo ${sleeve.post_breach.silo}${sleeve.post_breach.sleeve === 'softening' ? '; the sleeve is softening' : ''}.${sleeve.post_breach.note ? ` ${sleeve.post_breach.note}` : ''}` }) : null,
      sleeve.source ? el('div', { class: 'row' }, [el('code', { text: sleeve.source }), copyButton(sleeve.source)]) : null
    ];
  }

  function eventPanel(item) {
    const pin = item.ref;
    const where = pin.place.kind === 'route' ? `On the run: ${pin.place.label}` : `${pin.place.room}, ${(state.byId.get(pin.place.site) || {}).name || pin.place.site}`;
    return [
      el('h2', { text: pin.timestamp }),
      el('div', { class: 'row' }, [el('span', { class: `tier ${Core.lensTier(pin.tier)}`, text: Core.tierLabel(pin.tier) }), el('span', { class: 'meta', text: pin.id })]),
      el('p', { text: pin.summary }),
      el('p', { class: 'meta', text: where }),
      pin.era === 'after' ? el('p', { class: 'note', text: 'An event of the Tessarine Breach: shown after it only.' }) : null,
      el('p', { class: 'note', text: 'The pin\'s spot is approximate (P.A.); canon places the event, not the point.' }),
      pin.source ? el('h3', { text: 'Source' }) : null,
      pin.source ? el('div', { class: 'row' }, [el('code', { text: pin.source }), copyButton(pin.source)]) : null
    ];
  }

  function groupPanel(marker) {
    const site = state.byId.get(marker.site || (state.data.insets.find(inset => inset.key === marker.inset) || {}).site);
    const title = marker.kind === 'room' ? `${marker.room}` : `Events at ${site ? site.name : 'this site'}`;
    return [
      el('h2', { text: title }),
      marker.kind === 'room' && site ? el('p', { class: 'meta', text: site.name }) : null,
      el('ul', { class: 'event-list' }, marker.events.map(event => el('li', {}, el('button', {
        type: 'button',
        class: 'event-link',
        onclick: () => select(event.id, { fly: false })
      }, [el('small', { text: `${event.timestamp} ` }), event.summary])))),
      el('p', { class: 'note', text: 'Zoom into the inset plate to see where each event happened.' })
    ];
  }

  function legendPanel() {
    const { data } = state;
    const counts = `${data.regions.length} regions, ${data.sites.length} locations, ${data.features.length} features, ${data.routes.length} routes`;
    const legendRow = (pinClass, text, label) => el('li', {}, [el('span', { class: `pin ${pinClass}`, text: label || null }), text]);
    return [
      el('h2', { text: 'The Known Galaxy' }),
      el('p', { class: 'meta', text: `${data.build === 'public' ? 'Public' : 'Author'} build · ${counts}` }),
      el('p', { text: 'Select a pin, a label in the list, or a search result. Zoom with the wheel or a pinch; drag to pan. Zoom into the Tessarine Vault or the Heliodrome for its inset plate, or out past the chart for the universe.' }),
      el('h3', { text: 'Symbols' }),
      el('ul', { class: 'legend' }, [
        legendRow('', 'Primary canon location'),
        legendRow('speculative', 'Speculative location (author build)'),
        legendRow('feature', 'Canon facility'),
        legendRow('historical', 'Historical site, no atlas entry'),
        legendRow('existence-doubtful', 'Existence doubtful', 'E.D.'),
        legendRow('event-marker', 'Events placed here (P.A.)')
      ]),
      el('h3', { text: 'Chart' }),
      el('ul', { class: 'legend chart-key' }, [
        el('li', {}, [el('span', { class: 'key-sounding', text: '0.31' }), 'Sounding: a canon memory density']),
        el('li', {}, [el('span', { class: 'key-sounding unmeasured', text: 'unm.' }), 'Unmeasured since the Tessarine Breach']),
        el('li', {}, [el('span', { class: 'key-iso', text: '0.5' }), 'Isopleth value: an interpolated band edge']),
        el('li', {}, [el('span', { class: 'key-lane' }), 'Corridor lane: where corridors tend to form (illustrative)']),
        el('li', {}, [el('span', { class: 'key-run' }), 'Story run, labeled in pulls; dashed if intended']),
        el('li', {}, [el('span', { class: 'key-softening' }), 'Softening sleeve, after the breach: no figure']),
        el('li', {}, [el('span', { class: 'key-eddy', text: '@' }), 'Eddies: area symbol, facing up the gradient']),
        el('li', {}, [el('span', { class: 'key-void' }), 'Void Region, or a place lost to forgetting: nothing charted inside'])
      ]),
      shownEra() === 'after' && data.eras && data.eras.legend_note ? el('p', { class: 'note era-legend', text: data.eras.legend_note }) : null,
      el('p', { class: 'note', text: 'Positions, sizes, angles, and drawn counts are approximate (P.A.), and inset plates are not to scale. Corridor legs are counted in pulls, never converted to distance. Soundings are canon measurements; tints, isopleths, lanes, and eddies are drawn from the interpolated field.' })
    ];
  }

  function renderPanel() {
    const panel = $('#panel');
    panel.textContent = '';
    const item = state.selected;
    const parts = state.group ? groupPanel(state.group)
      : !item ? legendPanel()
      : item.kind === 'site' || item.kind === 'region' ? entityPanel(item.ref)
      : item.kind === 'sleeve' ? sleevePanel(item)
      : item.kind === 'event' ? eventPanel(item)
      : featurePanel(item);
    for (const part of parts) if (part) panel.append(part);
  }

  function writeHash() {
    const id = state.selected ? state.selected.id : null;
    const center = state.viewer.viewport.getCenter(true);
    const zoom = state.viewer.viewport.getZoom(true) / state.viewer.viewport.getHomeZoom();
    history.replaceState(null, '', Core.formatHash({ id, view: { x: center.x, y: center.y, zoom }, era: state.era }) || location.pathname);
  }

  function flyTo(item) {
    const { viewport } = state.viewer;
    const outline = item.kind === 'region' ? item.ref.outline : null;
    const bounds = outline && Core.outlineBounds(outline);
    if (bounds) {
      const a = vp([bounds.minX, bounds.maxY]);
      const b = vp([bounds.maxX, bounds.minY]);
      const pad = (b.x - a.x) * 0.15;
      viewport.fitBounds(new OpenSeadragon.Rect(a.x - pad, a.y - pad, b.x - a.x + 2 * pad, b.y - a.y + 2 * pad), reducedMotion);
      return;
    }
    // An event in an inset opens its plate, filling most of the view.
    const plate = item.kind === 'event' && item.ref.place.kind === 'inset' ? state.plates.find(entry => entry.key === item.ref.place.inset) : null;
    if (plate && state.layers.insets) {
      const r = plate.rect;
      updateMaxZoom(new OpenSeadragon.Point(r.x + r.width / 2, r.y + r.height / 2));
      viewport.fitBounds(new OpenSeadragon.Rect(r.x - r.width * 0.08, r.y - r.height * 0.05, r.width * 1.16, r.height * 1.1), reducedMotion);
      return;
    }
    const p = vp(item.xy);
    viewport.panTo(new OpenSeadragon.Point(p.x, p.y), reducedMotion);
    viewport.zoomTo(Math.max(viewport.getZoom(true), viewport.getHomeZoom() * 5), null, reducedMotion);
  }

  function select(id, { fly = true, hash = true } = {}) {
    const item = id ? state.byId.get(id) : null;
    state.group = null;
    state.selected = item && Core.visible(state.lens, item.tier) && Core.eraShows(item.era, state.era) ? item : null;
    for (const pin of state.pins) pin.node.classList.toggle('selected', Boolean(state.selected) && pin.item.id === state.selected.id);
    for (const button of document.querySelectorAll('#list button')) button.setAttribute('aria-current', String(Boolean(state.selected) && button.dataset.id === state.selected.id));
    renderPanel();
    if (state.selected && fly) flyTo(state.selected);
    if (hash) writeHash();
    render();
  }

  function selectGroup(marker) {
    state.selected = null;
    state.group = marker;
    renderPanel();
    render();
  }

  function applyHash() {
    const { id, view, era } = Core.parseHash(location.hash);
    const { viewport } = state.viewer;
    setEra(era || (state.data.eras && state.data.eras.default) || Core.DEFAULT_ERA, { hash: false, immediate: true });
    if (view) {
      updateMaxZoom(new OpenSeadragon.Point(view.x, view.y));
      viewport.panTo(new OpenSeadragon.Point(view.x, view.y), true);
      viewport.zoomTo(view.zoom * viewport.getHomeZoom(), null, true);
    }
    if (id && state.byId.has(id)) {
      const item = state.byId.get(id);
      if (!Core.visible(state.lens, item.tier)) setLens('speculative');
      select(id, { fly: !view, hash: false });
    }
  }

  // ----- Lens, era, layers, search, list -----

  function setLens(lens) {
    if (!Core.LENSES.includes(lens)) return;
    if (state.data.build === 'public' && lens === 'speculative') lens = 'working';
    state.lens = lens;
    for (const button of document.querySelectorAll('.lens button')) button.setAttribute('aria-checked', String(button.dataset.lens === lens));
    if (state.selected && !Core.visible(lens, state.selected.tier)) state.selected = null;
    buildList();
    renderPanel();
    render();
  }

  // The era control (rule R15): two discrete states. The switch crossfades
  // the plates and sleeve screens; every label and value swaps whole.
  function setEra(era, { hash = true, immediate = false } = {}) {
    if (!Core.ERAS.includes(era)) return;
    state.era = era;
    for (const button of document.querySelectorAll('.era button')) button.setAttribute('aria-checked', String(button.dataset.era === era));
    const target = era === 'after' ? 1 : 0;
    const finish = () => {
      state.eraMix = target;
      if (state.selected && !Core.eraShows(state.selected.era, era)) state.selected = null;
      state.group = null;
      refreshSoundings();
      buildList();
      renderPanel();
      render();
      if (hash && state.viewer) writeHash();
    };
    if (immediate || reducedMotion || state.eraMix === target) {
      finish();
      return;
    }
    const start = performance.now();
    const from = state.eraMix;
    let swapped = false;
    const step = now => {
      const t = Math.min(1, (now - start) / 450);
      state.eraMix = from + (target - from) * t;
      if (!swapped && Math.abs(state.eraMix - target) <= 0.5) {
        swapped = true;
        refreshSoundings();
        renderPanel();
      }
      render();
      if (t < 1) requestAnimationFrame(step);
      else finish();
    };
    requestAnimationFrame(step);
  }

  function buildList() {
    const list = $('#list');
    list.textContent = '';
    const groups = [['Regions', 'region'], ['Locations', 'site'], ['Features', 'feature'], ['Sleeves', 'sleeve'], ['Routes', 'route'], ['Events', 'event']];
    for (const [title, kind] of groups) {
      const entries = state.items.filter(item => item.kind === kind && Core.visible(state.lens, item.tier) && Core.eraShows(item.era, state.era));
      if (!entries.length) continue;
      list.append(el('h3', { text: title }));
      for (const item of entries) {
        list.append(el('button', {
          type: 'button',
          'data-id': item.id,
          class: Core.lensTier(item.tier) === 'speculative' ? 'speculative' : null,
          'aria-current': String(Boolean(state.selected) && state.selected.id === item.id),
          text: kind === 'event' ? `${item.ref.timestamp} · ${item.name}` : item.name,
          onclick: () => select(item.id)
        }));
      }
    }
  }

  function setupSearch() {
    const input = $('#search');
    const results = $('#results');
    let matches = [];
    let active = 0;
    const close = () => { results.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    const show = () => {
      results.textContent = '';
      matches.forEach((item, k) => {
        results.append(el('li', {
          role: 'option',
          'aria-selected': String(k === active),
          'data-id': item.id,
          onmousedown: event => { event.preventDefault(); choose(item); }
        }, [el('span', { text: item.name }), el('small', { text: item.kind })]));
      });
      results.hidden = matches.length === 0;
      input.setAttribute('aria-expanded', String(matches.length > 0));
    };
    const choose = item => { close(); input.value = item.name; select(item.id); };
    input.addEventListener('input', () => { matches = Core.search(state.items, input.value, state.lens, 8, state.era); active = 0; show(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && matches.length) { active = (active + 1) % matches.length; show(); event.preventDefault(); }
      else if (event.key === 'ArrowUp' && matches.length) { active = (active - 1 + matches.length) % matches.length; show(); event.preventDefault(); }
      else if (event.key === 'Enter' && matches.length) { choose(matches[active]); event.preventDefault(); }
      else if (event.key === 'Escape') { close(); input.blur(); }
    });
    input.addEventListener('blur', () => setTimeout(close, 100));
  }

  function setupControls() {
    for (const button of document.querySelectorAll('.lens button')) {
      button.addEventListener('click', () => setLens(button.dataset.lens));
      if (state.data.build === 'public' && button.dataset.lens === 'speculative') {
        button.disabled = true;
        button.title = 'The public build contains no speculative material';
      }
    }
    for (const button of document.querySelectorAll('.era button')) button.addEventListener('click', () => setEra(button.dataset.era));
    const layersToggle = $('#layers-toggle');
    layersToggle.addEventListener('click', () => {
      const open = layersToggle.getAttribute('aria-expanded') !== 'true';
      layersToggle.setAttribute('aria-expanded', String(open));
      $('#layer-list').hidden = !open;
    });
    for (const box of document.querySelectorAll('#layer-list input[data-layer]')) {
      box.checked = state.layers[box.dataset.layer];
      box.addEventListener('change', () => {
        state.layers[box.dataset.layer] = box.checked;
        render();
      });
    }
    const toggle = $('#list-toggle');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      $('#list').hidden = !open;
      state.viewer.forceRedraw();
      setTimeout(render, 0);
    });
    document.addEventListener('keydown', event => {
      // Escape in the search box only closes its results.
      if (event.key === 'Escape' && (state.selected || state.group) && event.target !== $('#search')) select(null);
    });
  }

  async function init() {
    window.__map = { ready: false, state, select, setLens, setEra, render };
    const response = await fetch('data/atlas.json');
    if (!response.ok) throw new Error('No map data. Run npm run map:data, then reload.');
    state.data = await response.json();
    state.extent = state.data.image.extent;
    state.items = Core.buildIndex(state.data);
    state.byId = new Map(state.items.map(item => [item.id, item]));
    state.era = (state.data.eras && state.data.eras.default) || Core.DEFAULT_ERA;
    state.eraMix = state.era === 'after' ? 1 : 0;
    $('#build-badge').textContent = state.data.build === 'public' ? 'Public build' : 'Author build';
    // The render manifests are never cached; their timestamps version the
    // tile URLs, so a re-render is never mixed with cached tiles.
    const manifest = await fetch('tiles/galaxy.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null), () => null);
    const insetManifest = await fetch('insets/insets.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null), () => null);
    state.hasTiles = Boolean(manifest);
    state.baseWidth = manifest ? manifest.size : 2;
    // Overlays must map with the extent the tiles were rendered at; tiles
    // from an older frame would otherwise misregister every overlay.
    if (manifest && typeof manifest.extent === 'number' && manifest.extent !== state.extent) {
      state.extent = manifest.extent;
      const notice = $('#notice');
      notice.textContent = `The tiles were rendered for an older chart frame (extent ${manifest.extent}, data ${state.data.image.extent}). Run npm run map:tiles to match.`;
      notice.hidden = false;
    }
    if (!state.hasTiles) {
      document.body.classList.add('no-tiles');
      const notice = $('#notice');
      notice.textContent = 'Base tiles are not rendered; showing overlays only. Run npm run map:tiles for the full chart.';
      notice.hidden = false;
    }
    if (insetManifest && insetManifest.universe && state.data.universe) {
      const node = $('#universe');
      node.src = `insets/${insetManifest.universe.file}?v=${encodeURIComponent(insetManifest.generated)}`;
      state.universe = { node, extent: insetManifest.universe.extent };
    }

    state.viewer = OpenSeadragon({
      element: $('#chart'),
      tileSources: state.hasTiles ? `tiles/galaxy.dzi?v=${encodeURIComponent(manifest.generated)}` : { type: 'image', url: blankImage() },
      drawer: 'canvas',
      showNavigationControl: false,
      showNavigator: true,
      navigatorPosition: 'BOTTOM_LEFT',
      navigatorAutoFade: false,
      maxZoomPixelRatio: MAX_PIXEL_RATIO,
      minZoomImageRatio: 0.6,
      visibilityRatio: 0.5,
      constrainDuringPan: true,
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      animationTime: reducedMotion ? 0 : 1.0,
      springStiffness: 8
    });
    buildDefs();
    buildShapes();
    buildMarkers();
    buildPlateLabels();
    setupSearch();
    setupControls();
    setLens(state.data.build === 'public' ? 'working' : 'speculative');
    for (const button of document.querySelectorAll('.era button')) button.setAttribute('aria-checked', String(button.dataset.era === state.era));

    state.viewer.addHandler('update-viewport', render);
    state.viewer.addHandler('resize', render);
    state.viewer.addHandler('animation-finish', () => writeHash());
    let opened = false;
    state.viewer.addHandler('open', () => {
      if (opened) return;
      opened = true;
      if (insetManifest) addPlates(insetManifest);
      applyHash();
      render();
      window.__map.ready = true;
    });
    window.addEventListener('hashchange', applyHash);
  }

  init().catch(err => {
    const notice = $('#notice');
    notice.textContent = err.message;
    notice.hidden = false;
    window.__map = Object.assign(window.__map || {}, { ready: false, error: err.message });
  });
})();
