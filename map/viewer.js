// Atlas map viewer. Draws the rendered tile pyramid with OpenSeadragon and
// layers the chart's data over it: region outlines and bands, routes, pins,
// and labels, all from data/atlas.json (built by `npm run map:data`). Pure
// logic lives in viewer_core.js (window.MapCore).
(function () {
  'use strict';

  const Core = window.MapCore;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    data: null,
    items: [],
    byId: new Map(),
    lens: 'primary',
    selected: null,
    viewer: null,
    extent: 1.4,
    hasTiles: false,
    pins: [],
    labels: [],
    shapes: []
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

  function buildShapes() {
    const world = $('#world');
    world.textContent = '';
    const { data } = state;
    for (const region of data.regions) {
      const group = svg('g', { 'data-tier': region.tier });
      drawOutline(group, region.outline, `outline t-${region.treatment || 'none'}`, region.tier);
      for (const band of region.bands || []) {
        drawOutline(group, band.outline, 'band', region.tier);
        for (const sub of band.subband_outlines || []) drawOutline(group, sub, 'subband', region.tier);
      }
      world.append(group);
      state.shapes.push({ node: group, tier: region.tier });
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
      for (const sleeve of feature.sleeves || []) {
        if (!sleeve.ring_r || !sleeve.post_breach || sleeve.post_breach.sleeve !== 'softening') continue;
        drawOutline(group, { circles: [{ x: 0, y: 0, r: sleeve.ring_r }] }, 'softening', feature.tier);
      }
      world.append(group);
      state.shapes.push({ node: group, tier: feature.tier });
    }
    for (const site of data.sites) {
      if (!site.circuit) continue;
      const group = svg('g', { 'data-tier': site.tier });
      drawOutline(group, { circles: [{ x: site.xy[0], y: site.xy[1], r: site.circuit.radius }] }, 'circuit', site.tier);
      world.append(group);
      state.shapes.push({ node: group, tier: site.tier });
    }
    for (const route of data.routes) {
      const points = route.points.map(xy => { const p = vp(xy); return `${p.x},${p.y}`; }).join(' ');
      const line = svg('polyline', { points, class: `route${route.kind === 'tether' ? ' tether' : ''}${Core.lensTier(route.tier) === 'speculative' ? ' speculative' : ''}` });
      world.append(line);
      state.shapes.push({ node: line, tier: route.tier });
    }
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
  }

  // ----- Pins and labels -----

  function buildMarkers() {
    const pins = $('#pins');
    const labels = $('#labels');
    pins.textContent = '';
    labels.textContent = '';
    for (const item of state.items) {
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
      const depth = item.kind === 'site' ? Core.sounding(item.ref) : null;
      const label = el('div', { class: `label ${item.kind}${treatment}${spec}`, 'data-id': item.id }, el('span', {}, [
        labelText,
        depth ? el('em', { class: 'depth', text: depth.note ? `${depth.value} · ${depth.note}` : depth.value }) : null
      ]));
      labels.append(label);
      state.labels.push({ node: label, item, point });
      // A region's sounding sits where the field reads its value.
      const regionDepth = item.kind === 'region' && item.ref.sounding_xy ? Core.sounding(item.ref) : null;
      if (regionDepth) {
        const sounding = el('div', { class: `label sounding ink-${item.ref.sounding_ink || 'light'}${spec}`, 'data-id': item.id }, el('span', {
          text: regionDepth.note ? `${regionDepth.value} · ${regionDepth.note}` : regionDepth.value
        }));
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
      state.isopleths.push({ node: label, point: vp(iso.xy) });
    }
  }

  function render() {
    const { viewer } = state;
    if (!viewer || !viewer.world.getItemCount()) return;
    const origin = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    const unit = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(1, 0), true).x - origin.x;
    $('#world').setAttribute('transform', `translate(${origin.x} ${origin.y}) scale(${unit})`);
    const zoomRatio = viewer.viewport.getZoom(true) / viewer.viewport.getHomeZoom();
    for (const shape of state.shapes) shape.node.style.display = Core.visible(state.lens, shape.tier) ? '' : 'none';
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
    for (const pin of state.pins) place(pin, Core.visible(state.lens, pin.item.tier));
    for (const label of state.labels) {
      const show = Core.visible(state.lens, label.item.tier) &&
        (Core.labelVisible(label.item.kind, zoomRatio) || (state.selected && state.selected.id === label.item.id));
      place(label, show);
    }
    const isoShow = Core.labelVisible('isopleth', zoomRatio);
    for (const iso of state.isopleths || []) place(iso, isoShow);
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

  function entityPanel(entity) {
    const parts = [
      el('h2', { text: entity.name }),
      el('div', { class: 'row' }, [
        el('span', { class: `tier ${Core.lensTier(entity.tier)}`, text: Core.tierLabel(entity.tier) }),
        el('span', { class: 'meta', text: [entity.location_type, entity.region].filter(Boolean).join(' · ') })
      ])
    ];
    if (entity.memory_density !== null && entity.memory_density !== undefined) {
      parts.push(el('p', { class: 'sounding', text: `Memory density ${entity.memory_density}${entity.memory_density_as_of ? ` · ${entity.memory_density_as_of}` : ''}` }));
    }
    if (entity.summary_200) parts.push(el('p', { text: entity.summary_200 }));
    if (entity.claims && entity.claims.length) parts.push(el('p', { class: 'note', text: `Placed per ${entity.claims.join(', ')} (design/map/CARTOGRAPHIC_BRIEF.md)` }));
    const byType = type => itemsLinked(entity.links).filter(link => link.type === type);
    const describe = link => el('li', {}, [link.name, ' ', el('small', { text: Core.lensTier(link.tier) === 'speculative' ? `${link.id} · ${Core.tierLabel(link.tier)}` : link.id })]);
    for (const [title, type] of [['Stories', 'story'], ['Characters', 'character'], ['Factions', 'faction']]) {
      const block = linkList(title, byType(type), describe);
      if (block) parts.push(...block);
    }
    const events = itemsLinked(entity.events);
    if (events.length) {
      parts.push(el('h3', { text: 'Events' }), el('ul', {}, events.map(event => el('li', {}, [el('small', { text: `${event.timestamp} ` }), event.summary]))));
    }
    if (entity.path) parts.push(el('h3', { text: 'Source' }), el('div', { class: 'row' }, [el('code', { text: entity.path }), copyButton(entity.path)]));
    return parts;
  }

  function featurePanel(item) {
    const feature = item.ref;
    const parts = [
      el('h2', { text: item.name }),
      el('div', { class: 'row' }, [el('span', { class: `tier ${Core.lensTier(feature.tier)}`, text: Core.tierLabel(feature.tier) }), el('span', { class: 'meta', text: feature.kind || '' })])
    ];
    if (feature.note) parts.push(el('p', { text: feature.note }));
    if (item.kind === 'route') {
      const facts = [feature.pulls ? `${feature.pulls} pulls` : null, feature.duration || null, feature.story || null].filter(Boolean).join(' · ');
      if (facts) parts.push(el('p', { class: 'sounding', text: facts }));
      if (feature.origin === 'none') parts.push(el('p', { class: 'note', text: 'Only the approach is charted; canon gives no origin.' }));
    }
    if (feature.kind === 'sleeves') {
      parts.push(el('table', {}, [
        el('tr', {}, [el('th', { text: 'Sleeve' }), el('th', { text: 'People' }), el('th', { text: 'After the breach' })]),
        ...(feature.sleeves || []).map(sleeve => el('tr', {}, [
          el('td', { text: Core.ROMAN[sleeve.number - 1] || String(sleeve.number) }),
          el('td', { text: sleeve.population ? `${sleeve.approximate ? 'about ' : ''}${sleeve.population.toLocaleString('en-US')}` : '—' }),
          el('td', { text: sleeve.post_breach ? `silo ${sleeve.post_breach.silo}${sleeve.post_breach.sleeve === 'softening' ? ', softening' : ''}` : '—' })
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
      sleeve.post_breach ? el('p', { text: `After the Tessarine Breach: silo ${sleeve.post_breach.silo}${sleeve.post_breach.sleeve === 'softening' ? '; the sleeve is softening' : ''}.${sleeve.post_breach.note ? ` ${sleeve.post_breach.note}` : ''}` }) : null,
      sleeve.source ? el('div', { class: 'row' }, [el('code', { text: sleeve.source }), copyButton(sleeve.source)]) : null
    ];
  }

  function legendPanel() {
    const { data } = state;
    const counts = `${data.regions.length} regions, ${data.sites.length} locations, ${data.features.length} features, ${data.routes.length} routes`;
    const legendRow = (pinClass, text, label) => el('li', {}, [el('span', { class: `pin ${pinClass}`, text: label || null }), text]);
    return [
      el('h2', { text: 'The Known Galaxy' }),
      el('p', { class: 'meta', text: `${data.build === 'public' ? 'Public' : 'Author'} build · ${counts}` }),
      el('p', { text: 'Select a pin, a label in the list, or a search result. Zoom with the wheel or a pinch; drag to pan.' }),
      el('h3', { text: 'Symbols' }),
      el('ul', { class: 'legend' }, [
        legendRow('', 'Primary canon location'),
        legendRow('speculative', 'Speculative location (author build)'),
        legendRow('feature', 'Canon facility'),
        legendRow('historical', 'Historical site, no atlas entry'),
        legendRow('existence-doubtful', 'Existence doubtful', 'E.D.')
      ]),
      el('h3', { text: 'Chart' }),
      el('ul', { class: 'legend chart-key' }, [
        el('li', {}, [el('span', { class: 'key-sounding', text: '0.31' }), 'Sounding: a canon memory density']),
        el('li', {}, [el('span', { class: 'key-iso', text: '0.5' }), 'Isopleth value: an interpolated band edge']),
        el('li', {}, [el('span', { class: 'key-lane' }), 'Corridor lane: where corridors tend to form (illustrative)']),
        el('li', {}, [el('span', { class: 'key-eddy', text: '@' }), 'Eddies: area symbol, facing up the gradient']),
        el('li', {}, [el('span', { class: 'key-void' }), 'Void Region: nothing charted inside'])
      ]),
      el('p', { class: 'note', text: 'Positions, sizes, angles, and drawn counts are approximate (P.A.). Corridor legs are counted in pulls, never converted to distance. Soundings are canon measurements; tints, isopleths, lanes, and eddies are drawn from the interpolated field.' })
    ];
  }

  function renderPanel() {
    const panel = $('#panel');
    panel.textContent = '';
    const item = state.selected;
    const parts = !item ? legendPanel()
      : item.kind === 'site' || item.kind === 'region' ? entityPanel(item.ref)
      : item.kind === 'sleeve' ? sleevePanel(item)
      : featurePanel(item);
    for (const part of parts) if (part) panel.append(part);
  }

  function writeHash() {
    const id = state.selected ? state.selected.id : null;
    const center = state.viewer.viewport.getCenter(true);
    const zoom = state.viewer.viewport.getZoom(true) / state.viewer.viewport.getHomeZoom();
    history.replaceState(null, '', Core.formatHash({ id, view: { x: center.x, y: center.y, zoom } }) || location.pathname);
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
    const p = vp(item.xy);
    viewport.panTo(new OpenSeadragon.Point(p.x, p.y), reducedMotion);
    viewport.zoomTo(Math.max(viewport.getZoom(true), viewport.getHomeZoom() * 5), null, reducedMotion);
  }

  function select(id, { fly = true, hash = true } = {}) {
    const item = id ? state.byId.get(id) : null;
    state.selected = item && Core.visible(state.lens, item.tier) ? item : null;
    for (const pin of state.pins) pin.node.classList.toggle('selected', Boolean(state.selected) && pin.item.id === state.selected.id);
    for (const button of document.querySelectorAll('#list button')) button.setAttribute('aria-current', String(Boolean(state.selected) && button.dataset.id === state.selected.id));
    renderPanel();
    if (state.selected && fly) flyTo(state.selected);
    if (hash) writeHash();
    render();
  }

  function applyHash() {
    const { id, view } = Core.parseHash(location.hash);
    const { viewport } = state.viewer;
    if (view) {
      viewport.panTo(new OpenSeadragon.Point(view.x, view.y), true);
      viewport.zoomTo(view.zoom * viewport.getHomeZoom(), null, true);
    }
    if (id && state.byId.has(id)) {
      const item = state.byId.get(id);
      if (!Core.visible(state.lens, item.tier)) setLens('speculative');
      select(id, { fly: !view, hash: false });
    }
  }

  // ----- Lens, search, list -----

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

  function buildList() {
    const list = $('#list');
    list.textContent = '';
    const groups = [['Regions', 'region'], ['Locations', 'site'], ['Features', 'feature'], ['Sleeves', 'sleeve'], ['Routes', 'route']];
    for (const [title, kind] of groups) {
      const entries = state.items.filter(item => item.kind === kind && Core.visible(state.lens, item.tier));
      if (!entries.length) continue;
      list.append(el('h3', { text: title }));
      for (const item of entries) {
        list.append(el('button', {
          type: 'button',
          'data-id': item.id,
          class: Core.lensTier(item.tier) === 'speculative' ? 'speculative' : null,
          'aria-current': String(Boolean(state.selected) && state.selected.id === item.id),
          text: item.name,
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
    input.addEventListener('input', () => { matches = Core.search(state.items, input.value, state.lens); active = 0; show(); });
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
      if (event.key === 'Escape' && state.selected && event.target !== $('#search')) select(null);
    });
  }

  async function init() {
    window.__map = { ready: false, state, select, setLens };
    const response = await fetch('data/atlas.json');
    if (!response.ok) throw new Error('No map data. Run npm run map:data, then reload.');
    state.data = await response.json();
    state.extent = state.data.image.extent;
    state.items = Core.buildIndex(state.data);
    state.byId = new Map(state.items.map(item => [item.id, item]));
    $('#build-badge').textContent = state.data.build === 'public' ? 'Public build' : 'Author build';
    // The render manifest is never cached; its timestamp versions the tile
    // URLs, so a re-render is never mixed with cached tiles.
    const manifest = await fetch('tiles/galaxy.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null), () => null);
    state.hasTiles = Boolean(manifest);
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

    state.viewer = OpenSeadragon({
      element: $('#chart'),
      tileSources: state.hasTiles ? `tiles/galaxy.dzi?v=${encodeURIComponent(manifest.generated)}` : { type: 'image', url: blankImage() },
      drawer: 'canvas',
      showNavigationControl: false,
      showNavigator: true,
      navigatorPosition: 'BOTTOM_LEFT',
      navigatorAutoFade: false,
      maxZoomPixelRatio: 3,
      minZoomImageRatio: 0.6,
      visibilityRatio: 0.5,
      constrainDuringPan: true,
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      animationTime: reducedMotion ? 0 : 1.0,
      springStiffness: 8
    });
    buildShapes();
    buildMarkers();
    setupSearch();
    setupControls();
    setLens(state.data.build === 'public' ? 'working' : 'speculative');

    state.viewer.addHandler('update-viewport', render);
    state.viewer.addHandler('resize', render);
    state.viewer.addHandler('animation-finish', () => writeHash());
    state.viewer.addHandler('open', () => {
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
