// Z3 inset plates for the atlas map (decisions Q22–Q29, rules R12–R14).
//
// An inset is a framed plate centered on its site, not to scale. Its
// elements are written in plate units: the plate is `units[0]` wide and
// `units[1]` tall, with the origin at the top-left, x to the right, and y
// down. Arc angles are degrees measured from +x toward +y, so they turn
// clockwise on the page. Every element is canon (citing a file and line),
// drawing approved (citing a claim the brief marks "drawing approved"), or
// cartographic furniture (citing a rule), and carries an era: both, before,
// or after.
//
// expandInset() turns one inset into what the painter, the data build, and
// the lint need for one era: drawing primitives, live labels, event anchors,
// and the lost places nothing may be drawn inside. Text is never drawn into
// the raster (rule R14); every label is placed live by the viewer.

const DEG = Math.PI / 180;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
const ERAS = ['before', 'after'];
const HOUSING_STATES = ['holds', 'reduced', 'bound', 'lost'];

// Line weights: `px` is the least width in screen pixels, `units` the width
// in plate units once the plate is zoomed far enough to show it.
const WEIGHT = {
  wall: { px: 1.4, units: 2.6, alpha: 0.9 },
  rule: { px: 1.0, units: 0, alpha: 0.6 },
  partition: { px: 1.0, units: 1.3, alpha: 0.8 },
  thin: { px: 0.8, units: 0.6, alpha: 0.6 },
  bench: { px: 1.4, units: 3.2, alpha: 0.85 },
  track: { px: 1.6, units: 2.2, alpha: 0.9 }
};

// Plate-unit geometry helpers.
const pt = (x, y) => [x, y];
const polar = (c, r, deg) => [c[0] + r * Math.cos(deg * DEG), c[1] + r * Math.sin(deg * DEG)];

// The chart rectangle a plate covers, and the maps between plate units and
// chart units (y up). `center` is the site's chart point.
function plateFrame(inset, center) {
  const [uw, uh] = inset.plate.units;
  const scale = inset.plate.width / uw;
  const width = inset.plate.width;
  const height = uh * scale;
  const left = center[0] - width / 2;
  const top = center[1] + height / 2;
  return {
    units: [uw, uh],
    scale,
    center,
    rect: { left, top, right: left + width, bottom: top - height, width, height },
    toChart: ([u, v]) => [left + u * scale, top - v * scale],
    toPlate: ([x, y]) => [(x - left) / scale, (top - y) / scale]
  };
}

const appliesTo = (element, era) => !element.era || element.era === 'both' || element.era === era;

// The booths of an audit hall: two rows either side of an aisle, numbered
// down one side and then down the other (claim T32). Returns each booth's
// rectangle, number, row, and the aisle's edges.
function boothLayout(element) {
  const { x, y, w, h, aisle, per_row: perRow } = element;
  const rowWidth = (w - aisle) / 2;
  const depth = h / perRow;
  const booths = [];
  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < perRow; k++) {
      const bx = side === 0 ? x : x + rowWidth + aisle;
      booths.push({ number: side * perRow + k + 1, side, rect: { x: bx, y: y + k * depth, w: rowWidth, h: depth } });
    }
  }
  return { booths, aisleLeft: x + rowWidth, aisleRight: x + rowWidth + aisle, depth, rowWidth };
}

// Housings spaced evenly along an arc, numbered in order (claim T35).
function housingLayout(element) {
  const { c, r, from, to, count } = element;
  return Array.from({ length: count }, (_, k) => {
    const angle = count === 1 ? from : from + ((to - from) * k) / (count - 1);
    return { number: k + 1, angle, at: polar(c, r, angle) };
  });
}

function housingState(element, era, number) {
  if (era !== 'after') return 'holds';
  return (element.after_states && element.after_states[number]) || 'holds';
}

// One housing's symbol: the brass body, its aperture facing the arc's
// center, and its pitch ring by category, never by value (rule R13).
function housingPrimitives(at, size, state, towards) {
  const out = [
    { type: 'disc', c: at, r: size, alpha: 0.32 },
    { type: 'arc', c: at, r: size, from: 0, to: 360, weight: WEIGHT.partition },
    { type: 'disc', c: polar(at, size * 0.62, towards), r: size * 0.2, alpha: 0.9 }
  ];
  const ring = size * 1.55;
  if (state === 'holds' || state === 'bound') out.push({ type: 'arc', c: at, r: ring, from: 0, to: 360, weight: WEIGHT.thin });
  if (state === 'bound') out.push({ type: 'arc', c: at, r: size * 1.9, from: 0, to: 360, weight: WEIGHT.thin });
  if (state === 'reduced') out.push({ type: 'arc', c: at, r: ring, from: 0, to: 360, weight: WEIGHT.thin, dash: [size * 0.5, size * 0.5] });
  return out;
}

const rectSegments = (r, weight) => [
  { type: 'seg', a: pt(r.x, r.y), b: pt(r.x + r.w, r.y), weight },
  { type: 'seg', a: pt(r.x + r.w, r.y), b: pt(r.x + r.w, r.y + r.h), weight },
  { type: 'seg', a: pt(r.x + r.w, r.y + r.h), b: pt(r.x, r.y + r.h), weight },
  { type: 'seg', a: pt(r.x, r.y + r.h), b: pt(r.x, r.y), weight }
];

const polyline = (points, weight, extra = {}) => points.slice(1).map((p, k) => ({ type: 'seg', a: points[k], b: p, weight, ...extra }));

function arrowHead(from, to, size, weight) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) / DEG;
  return [
    { type: 'seg', a: to, b: polar(to, size, angle + 150), weight },
    { type: 'seg', a: to, b: polar(to, size, angle - 150), weight }
  ];
}

function stairPrimitives(e) {
  const out = rectSegments(e, WEIGHT.partition);
  const treads = 5;
  const vertical = e.h >= e.w;
  for (let k = 1; k < treads; k++) {
    if (vertical) out.push({ type: 'seg', a: pt(e.x, e.y + (e.h * k) / treads), b: pt(e.x + e.w, e.y + (e.h * k) / treads), weight: WEIGHT.thin });
    else out.push({ type: 'seg', a: pt(e.x + (e.w * k) / treads, e.y), b: pt(e.x + (e.w * k) / treads, e.y + e.h), weight: WEIGHT.thin });
  }
  return out;
}

// A label is live text: its plate point, text, alignment, and level of
// detail (room, detail, or note), which the viewer shows by plate size.
function labelOf(element, text, at, extra = {}) {
  return { key: element.key, kind: element.kind, text, at, align: 'middle', level: 'detail', tier: element.tier, ...extra };
}

// Expands one inset for one era. Elements of another era, and (in the
// public build) draft elements, are left out entirely.
function expandInset(inset, { era = 'after', build = 'author' } = {}) {
  const primitives = [];
  const ghost = [];
  const labels = [];
  const anchors = {};
  const lost = [];
  const [uw, uh] = inset.plate.units;
  const keep = element => appliesTo(element, era) && !(build === 'public' && element.tier === 'draft');

  // The plate frame and title band: furniture, drawn on every plate.
  primitives.push(...rectSegments({ x: 6, y: 6, w: uw - 12, h: uh - 12 }, { px: 1.4, units: 2.4, alpha: 0.85 }));
  primitives.push(...rectSegments({ x: 13, y: 13, w: uw - 26, h: uh - 26 }, WEIGHT.rule));
  const band = inset.plate.title_band || 96;
  primitives.push({ type: 'seg', a: pt(13, band), b: pt(uw - 13, band), weight: WEIGHT.rule });

  for (const element of inset.elements || []) {
    if (!keep(element)) continue;
    // On a misregistered plate the plan's linework prints a second time,
    // offset, in the ghost ink (claim T39).
    const ink = list => {
      primitives.push(...list);
      if (inset.misregister) ghost.push(...list);
    };
    switch (element.kind) {
      case 'plan': {
        ink(rectSegments(element, WEIGHT.rule));
        labels.push(labelOf(element, element.label, [element.x + 14, element.y + 22], { align: 'start', level: 'room', style: 'heading' }));
        break;
      }
      case 'wall':
        ink(polyline(element.points, WEIGHT.wall));
        break;
      case 'arc-wall':
        ink([{ type: 'arc', c: element.c, r: element.r, from: element.from, to: element.to, weight: WEIGHT.wall }]);
        break;
      case 'room':
        ink(polyline([...element.points, element.points[0]], WEIGHT.partition));
        break;
      case 'door': {
        const angle = Math.atan2(element.b[1] - element.a[1], element.b[0] - element.a[0]) / DEG;
        ink([
          { type: 'seg', a: element.a, b: element.b, weight: WEIGHT.thin, dash: [3, 3] },
          { type: 'seg', a: polar(element.a, 6, angle + 90), b: polar(element.a, 6, angle - 90), weight: WEIGHT.partition },
          { type: 'seg', a: polar(element.b, 6, angle + 90), b: polar(element.b, 6, angle - 90), weight: WEIGHT.partition }
        ]);
        break;
      }
      case 'shelving': {
        ink([
          { type: 'sector', c: element.c, r0: element.r0, r1: element.r1, from: element.from, to: element.to, alpha: 0.26 },
          { type: 'arc', c: element.c, r: element.r0, from: element.from, to: element.to, weight: WEIGHT.thin },
          { type: 'arc', c: element.c, r: element.r1, from: element.from, to: element.to, weight: WEIGHT.thin }
        ]);
        for (const angle of [element.from, element.to, ...(element.divide_at || [])]) {
          ink([{ type: 'seg', a: polar(element.c, element.r0, angle), b: polar(element.c, element.r1, angle), weight: WEIGHT.thin }]);
        }
        break;
      }
      case 'booths': {
        const layout = boothLayout(element);
        const lostNow = era === 'after' ? new Set(element.lost_after || []) : new Set();
        for (const booth of layout.booths) {
          const r = booth.rect;
          const aisleX = booth.side === 0 ? r.x + r.w : r.x;
          const backX = booth.side === 0 ? r.x : r.x + r.w;
          // Partitions run from the back wall to the aisle; the bench sits
          // at the aisle edge, open at both ends; the cradle at the center.
          ink([
            { type: 'seg', a: pt(backX, r.y), b: pt(aisleX, r.y), weight: WEIGHT.partition },
            { type: 'seg', a: pt(backX, r.y + r.h), b: pt(aisleX, r.y + r.h), weight: WEIGHT.partition },
            { type: 'seg', a: pt(aisleX, r.y + r.h * 0.22), b: pt(aisleX, r.y + r.h * 0.78), weight: WEIGHT.bench },
            { type: 'arc', c: pt(r.x + r.w / 2, r.y + r.h / 2), r: Math.min(r.w, r.h) * 0.16, from: 0, to: 360, weight: WEIGHT.thin },
            { type: 'seg', a: pt(r.x + r.w / 2 - Math.min(r.w, r.h) * 0.3, r.y + r.h / 2), b: pt(r.x + r.w / 2 + Math.min(r.w, r.h) * 0.3, r.y + r.h / 2), weight: WEIGHT.thin }
          ]);
          const labelX = booth.side === 0 ? layout.aisleLeft + 10 : layout.aisleRight - 10;
          const at = [labelX, r.y + r.h / 2];
          if (lostNow.has(booth.number)) {
            // A place lost to forgetting: nothing inside, an edge that is not
            // a line, the numeral out in the aisle on a leader (rule R13).
            const erode = element.erode || 6;
            lost.push({ key: `${element.key}-${booth.number}`, rect: { x: r.x, y: r.y, w: r.w, h: r.h }, erode, seed: booth.number });
            const sign = booth.side === 0 ? 1 : -1;
            const edge = (booth.side === 0 ? r.x + r.w : r.x) + sign * (erode + 3);
            const tip = (booth.side === 0 ? layout.aisleLeft : layout.aisleRight) + sign * 26;
            primitives.push({ type: 'seg', a: pt(edge, r.y + r.h / 2), b: pt(tip, r.y + r.h / 2), weight: WEIGHT.thin, dash: [2, 2] });
            labels.push(labelOf(element, String(booth.number), [tip + sign * 3, at[1]], { align: booth.side === 0 ? 'start' : 'end', style: 'lost', booth: booth.number }));
          } else {
            labels.push(labelOf(element, String(booth.number), at, { align: booth.side === 0 ? 'start' : 'end', booth: booth.number }));
          }
        }
        break;
      }
      case 'housings': {
        for (const housing of housingLayout(element)) {
          const state = housingState(element, era, housing.number);
          const towards = Math.atan2(element.c[1] - housing.at[1], element.c[0] - housing.at[0]) / DEG;
          ink(housingPrimitives(housing.at, element.size, state, towards));
          labels.push(labelOf(element, ROMAN[housing.number - 1], polar(housing.at, element.size * 2.6, towards + 180), { housing: housing.number, state }));
        }
        break;
      }
      case 'stair':
        ink(stairPrimitives(element));
        break;
      case 'station':
        ink([{ type: 'rect', ...element, alpha: 0.3 }, ...rectSegments(element, WEIGHT.partition)]);
        break;
      case 'hull':
        ink([{ type: 'arc', c: element.c, r: element.r, from: 0, to: 360, weight: WEIGHT.wall }]);
        break;
      case 'area': {
        ink([
          { type: 'hatch', c: element.c, r0: element.r0, r1: element.r1, from: element.from, to: element.to, spacing: element.spacing || 8, angle: 45, alpha: 0.4 },
          { type: 'arc', c: element.c, r: element.r0, from: element.from, to: element.to, weight: WEIGHT.thin, dash: [4, 3] },
          { type: 'arc', c: element.c, r: element.r1, from: element.from, to: element.to, weight: WEIGHT.thin, dash: [4, 3] }
        ]);
        break;
      }
      case 'point':
        ink([
          { type: 'arc', c: element.at, r: element.size || 7, from: 0, to: 360, weight: WEIGHT.partition },
          { type: 'disc', c: element.at, r: (element.size || 7) * 0.3, alpha: 0.95 }
        ]);
        break;
      case 'dock':
        ink([{ type: 'rect', x: element.at[0] - 7, y: element.at[1] - 7, w: 14, h: 14, alpha: 0.85 }]);
        break;
      case 'track': {
        const style = element.style === 'dotted' ? { dash: [3, 5] } : {};
        ink(polyline(element.points, WEIGHT.track, style));
        if (element.arrow) ink(arrowHead(element.points[element.points.length - 2], element.points[element.points.length - 1], 12, WEIGHT.track));
        break;
      }
      case 'note':
      case 'lintel':
      case 'anchor':
        break;
      default:
        throw new Error(`inset ${inset.key}: unknown element kind "${element.kind}"`);
    }
    if (element.label && element.kind !== 'plan') {
      const at = element.label_at || element.at || (element.c ? element.c : [element.x + (element.w || 0) / 2, element.y + (element.h || 0) / 2]);
      labels.push(labelOf(element, element.label, at, { align: element.label_align || 'middle', level: element.label_level || 'detail' }));
    }
    if (element.kind === 'note') labels.push(labelOf(element, element.text, element.at, { align: 'start', level: 'note', style: 'note', width: element.width || 300 }));
    if (element.kind === 'lintel') {
      // The lintel's line, and after the breach the forgotten word's place:
      // the view gets the text on either side and the gap's width, never the
      // word itself (rule R14).
      const words = element.text.split(' ');
      const gone = era === 'after' && element.forgotten_after ? words.indexOf(element.forgotten_after) : -1;
      labels.push(labelOf(element, gone < 0 ? element.text : null, element.at, {
        level: 'note',
        style: 'lintel',
        ...(gone >= 0 ? { before_gap: words.slice(0, gone).join(' '), after_gap: words.slice(gone + 1).join(' '), gap_chars: element.forgotten_after.length } : {})
      }));
    }
    if (element.anchor) anchors[element.key] = element.anchor;
    else if (element.kind === 'anchor') anchors[element.key] = element.at;
  }
  // The plate's key to its housing symbols, for the states this era shows:
  // furniture, not an element of the place (rule R13).
  if (inset.legend) {
    const key = inset.legend;
    const states = era === 'after' ? HOUSING_STATES : ['holds'];
    const words = { holds: 'holds', reduced: 'reduced pitch', bound: 'bound', lost: 'lost to oblivion' };
    states.forEach((state, k) => {
      const at = pt(key.at[0] + k * key.step, key.at[1]);
      primitives.push(...housingPrimitives(at, key.size, state, 270));
      labels.push({ key: 'legend', kind: 'legend', text: words[state], at: pt(at[0] + key.size * 2.4, at[1]), align: 'start', level: 'note', style: 'key', tier: 'canon' });
    });
  }
  if (inset.misregister) {
    const [dx, dy] = inset.misregister;
    for (const p of ghost) primitives.push({ ...shift(p, dx, dy), ghost: true });
  }
  return { primitives, labels, anchors, lost, units: [uw, uh] };
}

function shift(p, dx, dy) {
  const move = q => [q[0] + dx, q[1] + dy];
  const out = { ...p };
  if (p.a) out.a = move(p.a);
  if (p.b) out.b = move(p.b);
  if (p.c) out.c = move(p.c);
  if (p.x !== undefined) { out.x = p.x + dx; out.y = p.y + dy; }
  // A hatch's lines move with it, not only its outline.
  if (p.type === 'hatch') out.offset = [(p.offset ? p.offset[0] : 0) + dx, (p.offset ? p.offset[1] : 0) + dy];
  return out;
}

// Whether a plate point lies inside a lost place, before erosion.
function insideLost(lostList, [u, v], margin = 0) {
  return lostList.some(({ rect }) => u > rect.x - margin && u < rect.x + rect.w + margin && v > rect.y - margin && v < rect.y + rect.h + margin);
}

// ----- Figures in text (rule R14) -----

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];

// Every figure a text states, as numbers: digits ("0.78", "44217"), number
// words ("one hundred sixty", "a hundred", "forty-two", "two million",
// "three dozen"), and ordinals ("Fourth"). Fractions ("half", "a quarter
// of") and Roman numerals are not read; numerals are generated labels.
function figuresIn(text) {
  const found = new Set();
  for (const match of String(text).matchAll(/\d+(?:\.\d+)?/g)) found.add(Number(match[0]));
  const tokens = String(text).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let last = null;
  const close = () => {
    if (last) found.add(total + current);
    total = 0;
    current = 0;
    last = null;
  };
  // Which word may follow which inside one figure.
  const follows = {
    unit: [null, 'tens', 'hundred', 'thousand', 'million'],
    tens: [null, 'hundred', 'thousand', 'million'],
    hundred: ['unit'],
    dozen: ['unit', 'tens'],
    thousand: ['unit', 'tens', 'hundred'],
    million: ['unit', 'tens', 'hundred']
  };
  for (let k = 0; k < tokens.length; k++) {
    const token = tokens[k];
    if (token === 'a' && ['hundred', 'thousand', 'million', 'dozen'].includes(tokens[k + 1])) {
      close();
      current = 1;
      last = 'unit';
      continue;
    }
    // "a hundred and eighty": "and" joins a figure only after hundred or
    // thousand, and only before another number word.
    if (token === 'and' && (last === 'hundred' || last === 'thousand' || last === 'million') && (UNITS.includes(tokens[k + 1]) || TENS.includes(tokens[k + 1]))) continue;
    let kind = null;
    let value = 0;
    if (UNITS.includes(token)) { kind = 'unit'; value = UNITS.indexOf(token); }
    else if (TENS.includes(token)) { kind = 'tens'; value = TENS.indexOf(token) * 10; }
    else if (ORDINALS.includes(token) && token !== 'zeroth') { kind = 'unit'; value = ORDINALS.indexOf(token); }
    else if (token === 'hundred' || token === 'dozen') kind = token;
    else if (token === 'thousand' || token === 'million') kind = token;
    if (!kind) {
      close();
      continue;
    }
    // A unit after a tens word must be a single digit ("forty-two").
    const fits = follows[kind].includes(last) && !(kind === 'unit' && last === 'tens' && (value === 0 || value > 9));
    if (!fits) {
      close();
      if (kind === 'hundred' || kind === 'dozen' || kind === 'thousand' || kind === 'million') continue;
    }
    if (kind === 'hundred') current *= 100;
    else if (kind === 'dozen') current *= 12;
    else if (kind === 'thousand') { total += current * 1000; current = 0; }
    else if (kind === 'million') { total = (total + current) * 1000000; current = 0; }
    else current += value;
    last = kind;
    if (ORDINALS.includes(token)) close();
  }
  close();
  return found;
}

module.exports = {
  ERAS,
  ROMAN,
  HOUSING_STATES,
  WEIGHT,
  plateFrame,
  appliesTo,
  boothLayout,
  housingLayout,
  housingState,
  expandInset,
  insideLost,
  figuresIn
};
