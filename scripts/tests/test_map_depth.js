#!/usr/bin/env node
/**
 * Tests for the atlas map's Phase 4 layers, "depth and time" (decisions
 * Q22-Q36, rules R12-R18): the inset plates (scripts/map/insets.js and
 * inset_painter.js), the Z0 scaffold (universe.js), their renderer
 * (render_insets.js), the era, inset, and event-pin data the build emits,
 * and the lint rules that keep each of them to canon.
 *
 * The lint rules run against a scratch copy of the repository's real map
 * inputs: first the real placement file, which must pass, then one
 * deliberate break per rule, each of which must produce its error.
 */
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');

sharp.cache(false);

const layout = require('../map/layout');
const insets = require('../map/insets');
const { createInsetPainter } = require('../map/inset_painter');
const { createUniversePainter } = require('../map/universe');
const { renderInsets, rectPyramid, platesFor } = require('../map/render_insets');
const { lintCartography } = require('../lint/cartography_lint');
const { buildMapData } = require('../map/build_data');
const { VOID_COLOR, LIGHT_INK } = require('../map/painter');
const { coverage } = require('../map/inset_painter');

const ROOT = layout.DEFAULT_ROOT;
const removeDir = dir => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS: ${name}`), err => {
      console.error(`FAIL: ${name}`);
      console.error(err.stack || err.message);
      process.exitCode = 1;
    });
}

// A scratch copy of everything the lint and the data build read.
function scratchRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'map-depth-'));
  for (const dir of ['atlas', 'stories', 'data', 'bible', 'mechanics', 'characters', 'lore', 'manuals', 'factions']) {
    fs.cpSync(path.join(ROOT, dir), path.join(root, dir), { recursive: true });
  }
  fs.mkdirSync(path.join(root, 'design', 'map'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, layout.BRIEF_PATH), path.join(root, layout.BRIEF_PATH));
  fs.copyFileSync(path.join(ROOT, 'REFERENCE_MAP.json'), path.join(root, 'REFERENCE_MAP.json'));
  return root;
}

const realPlacements = () => yaml.load(fs.readFileSync(path.join(ROOT, layout.CARTOGRAPHY_PATH), 'utf8'));
const writePlacements = (root, cartography) => fs.writeFileSync(path.join(root, layout.CARTOGRAPHY_PATH), yaml.dump(cartography));
const element = (c, inset, key) => c.insets.find(entry => entry.key === inset).elements.find(entry => entry.key === key);
const errorsOf = report => report.findings.filter(f => f.level === 'error').map(f => `${f.where}: ${f.message}`);

// Each break must produce an error containing its fragment.
const BREAKS = [
  ['a note that states a figure its source does not give', c => { element(c, 'tessarine-vault', 'ring-note').text += ' Twelve shelves.'; }, 'states 12, which its cited sources do not give'],
  ['a booth count canon does not give', c => { Object.assign(element(c, 'tessarine-vault', 'booths'), { count: 18, per_row: 9 }); }, 'its booth count reads 18, but its quote "Sixteen cradle booths" gives 16'],
  ['a booth count that is not two rows', c => { element(c, 'tessarine-vault', 'booths').per_row = 7; }, 'does not equal two rows of 7'],
  ['a booth count quoted from nowhere', c => { element(c, 'tessarine-vault', 'booths').quotes.count = 'eighteen cradle booths'; }, 'is not in its cited lines'],
  ['a booth count with no quote', c => { delete element(c, 'tessarine-vault', 'booths').quotes; }, "must have required property 'quotes'"],
  ['a lost booth canon does not name', c => { element(c, 'tessarine-vault', 'booths').lost_after = [3, 9, 11, 12]; }, 'its lost booths reads 3, 9, 11, 12'],
  // A figure that occurs in the cited lines is not enough: Four and Nine
  // name silos there, not booths (review probe).
  ['a lost booth taken from a nearby figure', c => { element(c, 'tessarine-vault', 'booths').lost_after = [4, 9, 11, 14]; }, 'its lost booths reads 4, 9, 11, 14'],
  ['a housing count canon does not give', c => { element(c, 'tessarine-vault', 'housings').count = 10; }, 'its housing count reads 10'],
  ['a housing state that disagrees with its sleeve', c => { element(c, 'tessarine-vault', 'housings').after_states[5] = 'lost'; }, `housing 5 is drawn "lost" after the breach, but Sleeve 5's silo is reduced-pitch`],
  ['a lost silo drawn as holding', c => { delete element(c, 'tessarine-vault', 'housings').after_states[9]; }, `housing 9 is drawn "holds" after the breach, but Sleeve 9's silo is lost`],
  ['a bound silo drawn as holding', c => { element(c, 'tessarine-vault', 'housings').after_states[2] = 'holds'; }, `housing 2 is drawn "holds" after the breach, but Sleeve 2's silo is held and bound`],
  ['housings drawn off their plate', c => { element(c, 'tessarine-vault', 'housings').r = 2000; }, 'lies off its plate'],
  ['a draft element on a plate at a canon site', c => { element(c, 'tessarine-vault', 'storeroom').tier = 'draft'; }, 'is a draft element on a plate at a canon site'],
  ['an element on a canon plate citing a draft story', c => { element(c, 'tessarine-vault', 'storeroom').sources.push('stories/short_story/the_anchorless_tide/manuscript.md:1'); }, 'which is draft; a plate at a canon site cites canon only'],
  ['an element tier the schema does not allow', c => { element(c, 'tessarine-vault', 'storeroom').tier = 'cartographic'; }, 'must be equal to one of the allowed values'],
  ['a drawing approval with no drawing-approved claim', c => { element(c, 'tessarine-vault', 'hall-stair').claims = ['T31']; }, 'cites no claim the brief marks drawing approved'],
  ['a canon element citing only a design file', c => { element(c, 'tessarine-vault', 'storeroom').sources = ['design/map/CARTOGRAPHIC_BRIEF.md']; }, 'cites no primary- or working-canon source'],
  ['an element with no basis', c => { const e = element(c, 'tessarine-vault', 'storeroom'); delete e.claims; delete e.sources; }, 'has no basis'],
  ['an element off its plate', c => { element(c, 'tessarine-vault', 'lower-dock').points[1] = [1200, 1296]; }, 'lies off its plate'],
  ['an anchor inside a lost booth', c => { element(c, 'tessarine-vault', 'audit-hall').anchor = [570, 1061]; }, 'its anchor lies inside a lost booth'],
  ['a plate reaching into a Void', c => { c.insets[0].plate.width = 0.5; }, 'its plate reaches into a Void Region'],
  ['an inset at an unplaced site', c => { c.insets[0].site = 'loc-0016'; }, 'site loc-0016 is not a placed site'],
  ['a forgotten word not on the lintel', c => { element(c, 'tessarine-vault', 'lintel').forgotten_after = 'merely'; }, 'is not a word of the lintel text'],
  ['a pre-breach sounding with no era state', c => { c.eras.states = c.eras.states.filter(s => s.key !== 'vault-sounding'); }, 'was measured before the breach but has no sounding state'],
  ['an era state on a sounding that is not pre-breach', c => { c.eras.states.push({ key: 'core-sounding', kind: 'sounding', target: 'loc-0005', after: 'unmeasured', rules: ['R15'] }); }, 'only a pre-breach sounding reads unmeasured'],
  ['a post-breach sounding with a figure', c => { c.eras.states[0].after = '0.70'; }, 'must be equal to constant'],
  ['an era legend note with a figure', c => { c.eras.states.find(s => s.kind === 'legend-note').after = 'Two soundings predate the breach.'; }, 'era notes state none'],
  ['a softening sleeve with a figure', c => { c.features.find(f => f.key === 'outer-sleeve-sleeves').sleeves[3].post_breach.note = 'Coherence down to 0.40.'; }, 'softens after the breach but its note states a figure'],
  ['a breach event that is not in the timeline', c => { c.eras.breach = 'event-9999'; }, 'breach names event-9999'],
  ['a pull count its source does not give', c => { c.routes[0].pulls = 4; }, 'its pull count is 4, but no "4 pulls" phrase'],
  ['a pull count taken from a nearby figure', c => { c.routes[0].pulls = 10; }, 'its pull count is 10, but no "10 pulls" phrase'],
  ['a pull count taken from the manifest', c => { c.routes[1].pulls = 7; }, 'its pull count is 7, but no "7 pulls" phrase'],
  ['a breach-only pull count shown in both eras', c => { c.routes[1].era = 'both'; }, 'comes only from the breach story, so it shows after the breach only'],
  ['an After-only route citing nothing from the breach story', c => { c.routes[0].era = 'after'; }, 'cites nothing from the breach story'],
  ['a route note that states a figure', c => { c.routes[1].note += ' Nine crates.'; }, 'states 9'],
  ['a pin for an event not in the timeline', c => { c.event_pins[0].event = 'event-9999'; }, 'event-9999 is not in data/timeline/events.yaml'],
  ['a pin at an anchor its inset lacks', c => { c.event_pins[1].anchor = 'nowhere'; }, 'anchor nowhere is not an anchor'],
  ['a pin placed twice', c => { c.event_pins.push({ ...c.event_pins[1] }); }, 'is pinned more than once'],
  ['a breach event in an inset with no After era', c => {
    c.insets[0].eras = ['before'];
    for (const e of c.insets[0].elements) if (e.era === 'after') e.era = 'before';
  }, 'has no after era'],
  ['a pin on a route that does not exist', c => { c.event_pins[0].route = 'no-such-run'; }, 'route no-such-run is not a route'],
  ['a scaffold that would cover the chart', c => { c.universe.hole = 1.0; }, 'would cover the chart'],
  ['a scaffold label with a figure', c => { c.universe.label = 'Three Galaxies'; }, 'Z0 carries only the chart title']
];

(async () => {
  const scratch = scratchRoot();
  const placements = realPlacements();
  try {
    await test('the real placement file passes the Phase 4 rules', () => {
      writePlacements(scratch, placements);
      const report = lintCartography({ root: scratch });
      assert.deepEqual(errorsOf(report), []);
    });

    for (const [name, mutate, fragment] of BREAKS) {
      await test(`the lint rejects ${name}`, () => {
        const c = JSON.parse(JSON.stringify(placements));
        mutate(c);
        writePlacements(scratch, c);
        const errors = errorsOf(lintCartography({ root: scratch }));
        assert(errors.some(message => message.includes(fragment)), `expected an error containing "${fragment}", got:\n${errors.join('\n') || '(none)'}`);
      });
    }

    await test('a pin for an event below canon must be marked draft, and stays out of the public build', () => {
      const eventsPath = path.join(scratch, 'data', 'timeline', 'events.yaml');
      const original = fs.readFileSync(eventsPath, 'utf8');
      try {
        fs.writeFileSync(eventsPath, `${original.trimEnd()}\n  - id: event-9001\n    timestamp: "T0+9h"\n    summary: "A draft event at the Vault."\n    canon_tier: draft\n    source: stories/short_story/the_anchorless_tide/manuscript.md\n    involved_entities:\n      - loc-0011\n`);
        const c = JSON.parse(JSON.stringify(placements));
        const pin = { event: 'event-9001', inset: 'tessarine-vault', anchor: 'audit-hall', sources: ['stories/short_story/the_anchorless_tide/manuscript.md:1'] };
        c.event_pins.push(pin);
        writePlacements(scratch, c);
        const errors = errorsOf(lintCartography({ root: scratch }));
        assert(errors.some(message => message.includes('event-9001 is draft; mark the pin tier: draft')), `got:\n${errors.join('\n') || '(none)'}`);
        pin.tier = 'draft';
        writePlacements(scratch, c);
        assert.deepEqual(errorsOf(lintCartography({ root: scratch })), []);
        const author = buildMapData({ root: scratch, build: 'author' });
        const pub = buildMapData({ root: scratch, build: 'public' });
        assert(author.event_pins.some(entry => entry.id === 'event-9001'), 'the author build shows the draft pin');
        assert(!JSON.stringify(pub).includes('event-9001'), 'the public build carries nothing of the draft event');
      } finally {
        fs.writeFileSync(eventsPath, original);
        writePlacements(scratch, placements);
      }
    });

    await test('figures are read from digits, number words, compounds, and ordinals', () => {
      const cases = [
        ['Booths Three, Nine, Eleven, and Fourteen', [3, 9, 11, 14]],
        ['approximately one hundred sixty pledged stones', [160]],
        ['a hundred and eighty years', [180]],
        ['Two hundred thousand.', [200000]],
        ['forty-two ships', [42]],
        ['released us a hundred meters from Array Two', [100, 2]],
        ['The Fourth and Ninth silos', [4, 9]],
        ['0.78 before; TES-N3-44217', [0.78, 3, 44217]],
        ['bread and two', [2]],
        ['No figure at all.', []]
      ];
      for (const [text, expected] of cases) assert.deepEqual([...insets.figuresIn(text)].sort((a, b) => a - b), expected.sort((a, b) => a - b), text);
    });

    await test('the Vault plate after the breach: four booths lost, two silos lost, the lintel without its word', () => {
      const vault = placements.insets.find(entry => entry.key === 'tessarine-vault');
      const after = insets.expandInset(vault, { era: 'after' });
      const before = insets.expandInset(vault, { era: 'before' });
      assert.deepEqual(after.lost.map(place => Number(place.key.split('-').pop())).sort((a, b) => a - b), [3, 9, 11, 14]);
      assert.deepEqual(before.lost, [], 'no booth is lost before the breach');
      const housing = era => insets.expandInset(vault, { era }).labels.filter(label => label.housing).map(label => `${label.text}:${label.state}`);
      assert.deepEqual(housing('after'), ['I:holds', 'II:bound', 'III:holds', 'IV:lost', 'V:reduced', 'VI:holds', 'VII:reduced', 'VIII:holds', 'IX:lost']);
      assert(housing('before').every(entry => entry.endsWith(':holds')), 'every silo holds before the breach');
      const booths = after.labels.filter(label => label.booth);
      assert.equal(booths.length, 16, 'sixteen booths are numbered');
      assert.deepEqual(booths.filter(label => label.style === 'lost').map(label => label.booth).sort((a, b) => a - b), [3, 9, 11, 14]);
      // Ten is beside Nine (claim T32): one row, next to each other.
      const rows = insets.boothLayout(element(placements, 'tessarine-vault', 'booths')).booths;
      const booth = n => rows.find(entry => entry.number === n);
      assert.equal(booth(9).side, booth(10).side);
      assert.equal(booth(10).rect.y, booth(9).rect.y + booth(9).rect.h);
      const lintel = era => insets.expandInset(vault, { era }).labels.find(label => label.style === 'lintel');
      assert.equal(lintel('before').text, 'Spend only what you can afford. Preserve what must endure.');
      const gone = lintel('after');
      assert.equal(gone.text, null);
      assert.equal(gone.before_gap, 'Spend');
      assert.equal(gone.after_gap, 'what you can afford. Preserve what must endure.');
      assert(!JSON.stringify(insets.expandInset(vault, { era: 'after' }).labels).includes('only'), 'the forgotten word is nowhere in the After labels');
      for (const [key, anchor] of Object.entries(after.anchors)) assert(!insets.insideLost(after.lost, anchor), `anchor ${key} is outside every lost booth`);
      assert(after.labels.some(label => label.key === 'hall-note') && !before.labels.some(label => label.key === 'hall-note'), 'the hall note shows after the breach only');
      // The plate's key shows the housing states its era draws, and no more.
      const key = result => result.labels.filter(label => label.key === 'legend').map(label => label.text);
      assert.deepEqual(key(after), ['holds', 'reduced pitch', 'bound', 'lost to oblivion']);
      assert.deepEqual(key(before), ['holds']);
    });

    await test('the inset painter is deterministic, agrees at seams, and blanks only the lost booths', () => {
      const after = createInsetPainter(ROOT, { inset: 'tessarine-vault', era: 'after' });
      const before = createInsetPainter(ROOT, { inset: 'tessarine-vault', era: 'before' });
      const { rect, scale } = after.frame;
      const px = rect.width / 512;
      const x0 = rect.left + px / 2;
      const y0 = rect.top - px / 2;
      const whole = after.paintWindow(x0, y0, px, 64, 32);
      assert(whole.equals(after.paintWindow(x0, y0, px, 64, 32)), 'the same window paints the same bytes');
      const left = after.paintWindow(x0, y0, px, 32, 32);
      const right = after.paintWindow(x0 + 32 * px, y0, px, 32, 32);
      for (let row = 0; row < 32; row++) {
        assert(left.subarray(row * 96, row * 96 + 96).equals(whole.subarray(row * 192, row * 192 + 96)), `left half, row ${row}`);
        assert(right.subarray(row * 96, row * 96 + 96).equals(whole.subarray(row * 192 + 96, row * 192 + 192)), `right half, row ${row}`);
      }
      // A window split into four quarters paints the same bytes as the whole,
      // where the lost booths erode and where the Heliodrome hatch runs.
      const quarters = (painter, [u, v], pu, size = 48) => {
        const { rect: r, scale: s } = painter.frame;
        const p = pu * s;
        const x = r.left + u * s;
        const y = r.top - v * s;
        const full = painter.paintWindow(x, y, p, size, size);
        const half = size / 2;
        for (const [qi, qj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const part = painter.paintWindow(x + qi * half * p, y - qj * half * p, p, half, half);
          for (let row = 0; row < half; row++) {
            const from = ((qj * half + row) * size + qi * half) * 3;
            assert(part.subarray(row * half * 3, (row + 1) * half * 3).equals(full.subarray(from, from + half * 3)), `${painter.inset.key} quarter ${qi},${qj} row ${row} at (${u}, ${v})`);
          }
        }
      };
      const booths = insets.boothLayout(element(placements, 'tessarine-vault', 'booths')).booths;
      for (const number of [3, 9, 11, 14]) {
        const { rect: b } = booths.find(entry => entry.number === number);
        for (const pu of [0.37, 1.3]) quarters(after, [b.x + b.w - 20 * pu, b.y - 20 * pu], pu);
      }
      const helio = createInsetPainter(ROOT, { inset: 'heliodrome', era: 'both' });
      const hatches = helio.primitives.filter(p => p.type === 'hatch');
      assert(hatches.length > 0, 'the Heliodrome plate has a hatch to test');
      for (const hatch of hatches) {
        const mid = ((hatch.from + hatch.to) / 2) * (Math.PI / 180);
        const rho = (hatch.r0 + hatch.r1) / 2;
        for (const pu of [0.21, 0.9]) quarters(helio, [hatch.c[0] + rho * Math.cos(mid), hatch.c[1] + rho * Math.sin(mid)], pu);
      }
      // The center of each booth: the Void color after the breach for the
      // four lost ones, never before it, and never for the twelve others.
      const layout9 = insets.boothLayout(element(placements, 'tessarine-vault', 'booths'));
      const pixel = (painter, [u, v]) => [...painter.paintWindow(rect.left + u * scale, rect.top - v * scale, scale * 0.5, 1, 1)];
      const isVoid = rgb => rgb.every((c, k) => Math.abs(c - VOID_COLOR[k]) <= 2);
      for (const booth of layout9.booths) {
        const center = [booth.rect.x + booth.rect.w * 0.25, booth.rect.y + booth.rect.h * 0.5];
        const lost = [3, 9, 11, 14].includes(booth.number);
        assert.equal(isVoid(pixel(after, center)), lost, `booth ${booth.number} after the breach`);
        assert.equal(isVoid(pixel(before, center)), false, `booth ${booth.number} before the breach`);
      }
    });

    await test('nothing but the Void color survives inside a lost booth, and the walls around it stay', () => {
      const painter = createInsetPainter(ROOT, { inset: 'tessarine-vault', era: 'after' });
      const { rect, scale } = painter.frame;
      const walls = painter.primitives.filter(p => !p.ghost && p.weight === insets.WEIGHT.wall);
      const booths = insets.boothLayout(element(placements, 'tessarine-vault', 'booths')).booths;
      const isVoid = (buffer, k) => [0, 1, 2].every(c => Math.abs(buffer[k * 3 + c] - VOID_COLOR[c]) <= 1);
      // A wall over the Void: its ink laid at its coverage, on the Void color.
      const isWall = (buffer, k, cover) => [0, 1, 2].every(c => Math.abs(buffer[k * 3 + c] - (VOID_COLOR[c] + (LIGHT_INK[c] - VOID_COLOR[c]) * cover)) <= 2);
      for (const pu of [0.5, 2]) {
        // The booth and a band around it as wide as half the widest line it
        // can hold, so a bench or partition on its edge leaves no sliver.
        const band = Math.max(...Object.values(insets.WEIGHT).filter(weight => weight !== insets.WEIGHT.wall).map(weight => Math.max(weight.px * pu, weight.units) / 2));
        let wallPixels = 0;
        for (const number of [3, 9, 11, 14]) {
          const { rect: b } = booths.find(entry => entry.number === number);
          const w = Math.floor((b.w + 2 * band) / pu);
          const h = Math.floor((b.h + 2 * band) / pu);
          const u0 = b.x - band + pu / 2;
          const v0 = b.y - band + pu / 2;
          const buffer = painter.paintWindow(rect.left + u0 * scale, rect.top - v0 * scale, pu * scale, w, h);
          for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
              const [u, v] = [u0 + i * pu, v0 + j * pu];
              const covers = walls.map(p => coverage(p, u, v, pu)).filter(c => c > 0);
              if (!covers.length) assert(isVoid(buffer, j * w + i), `booth ${number} at (${u.toFixed(1)}, ${v.toFixed(1)}), ${pu} units a pixel, is not the Void color`);
              else if (covers.length === 1) {
                assert(isWall(buffer, j * w + i, covers[0]), `the wall at (${u.toFixed(1)}, ${v.toFixed(1)}) is not whole in booth ${number}`);
                if (covers[0] >= 0.5) wallPixels++;
              }
            }
          }
        }
        assert(wallPixels > 0, `some wall crosses a lost booth at ${pu} units a pixel`);
      }
    });

    await test('the Z0 scaffold is clear at the center and has filaments only: no knots, halos, or discs', () => {
      const universe = createUniversePainter(ROOT);
      const { hole, extent } = universe.spec;
      const centre = universe.paintWindow(-hole * 0.95, hole * 0.95, (hole * 1.9) / 40, 40, 40);
      for (let k = 0; k < 40 * 40; k++) {
        const [x, y] = [-hole * 0.95 + (k % 40) * ((hole * 1.9) / 40), hole * 0.95 - Math.floor(k / 40) * ((hole * 1.9) / 40)];
        if (Math.hypot(x, y) < hole) assert.equal(centre[k * 4 + 3], 0, 'the chart shows through inside the hole');
      }
      // A filament is thin across and long along: wherever the strength is
      // near its peak, it stays high along some direction and falls off
      // along another. A knot or disc would be high in every direction.
      const step = 0.05;
      const reach = 0.25;
      let peaks = 0;
      for (let x = -extent * 0.7; x <= extent * 0.7; x += step) {
        for (let y = -extent * 0.7; y <= extent * 0.7; y += step) {
          if (Math.hypot(x, y) < hole + 0.8 || universe.filamentAt(x, y) < 0.85) continue;
          peaks++;
          const around = Array.from({ length: 16 }, (_, k) => universe.filamentAt(x + reach * Math.cos((k * Math.PI) / 8), y + reach * Math.sin((k * Math.PI) / 8)));
          assert(Math.min(...around) < 0.3, `a blob at (${x.toFixed(2)}, ${y.toFixed(2)}): the strength stays high in every direction`);
        }
      }
      assert(peaks > 50, `the scaffold has filaments (${peaks} peak samples)`);
      assert.deepEqual(Object.keys(universe.spec).filter(key => /gateway|galax/i.test(key)), [], 'no gateways or other galaxies');
    });

    await test('the data build carries the eras, the plates, and the event pins', () => {
      const data = buildMapData({ build: 'author' });
      assert.equal(data.eras.default, 'after');
      assert.equal(data.eras.breach, 'event-story-0022-001');
      const vault = data.sites.find(site => site.id === 'loc-0011');
      const drift = data.regions.find(region => region.id === 'loc-0008');
      assert.deepEqual(vault.era_sounding, { after: 'unmeasured' });
      assert.deepEqual(drift.era_sounding, { after: 'unmeasured' });
      for (const item of [...data.regions, ...data.sites]) {
        if (item.id !== 'loc-0011' && item.id !== 'loc-0008') assert.equal(item.era_sounding, undefined, `${item.id} keeps its sounding after the breach`);
      }
      // Isopleth values drop after the breach exactly in the outer sleeve.
      const ring = r => r >= 0.45 && r <= 0.62;
      for (const iso of data.chart.isopleths) {
        assert.equal((iso.hidden_in || []).includes('after'), ring(Math.hypot(...iso.xy)), `isopleth at r ${Math.hypot(...iso.xy).toFixed(3)}`);
      }
      assert(data.chart.isopleths.some(iso => iso.hidden_in), 'some values are dropped');
      const relay = data.routes.find(route => route.key === 'vault-to-inner-relay');
      assert.equal(relay.era, 'after');
      assert.equal(data.routes.find(route => route.key === 'archivists-wake-approach').era, 'both');
      const eraOf = id => data.event_pins.find(pin => pin.id === id).era;
      for (const pin of data.event_pins) assert.equal(pin.era, pin.id.startsWith('event-story-0022-') ? 'after' : 'both', pin.id);
      assert.equal(eraOf('event-story-0008-004'), 'both');
      assert(!data.event_pins.some(pin => ['event-0001', 'event-0002', 'event-0003'].includes(pin.id)), 'events canon does not place are not pinned');
      const wake = data.routes.find(route => route.key === 'archivists-wake-approach');
      assert.deepEqual(wake.events.filter(event => !event.placed).map(event => event.id), ['event-0002', 'event-0003']);
      const vaultPlate = data.insets.find(inset => inset.key === 'tessarine-vault');
      assert.deepEqual(vaultPlate.eras, ['before', 'after']);
      assert(!JSON.stringify(vaultPlate.layers.after).includes('"only"') && !/\bonly\b/.test(vaultPlate.layers.after.labels.map(l => l.text || '').join(' ')));
      assert.equal(data.universe.label, 'The Known Galaxy');
    });

    await test('the public build leaves out insets at non-canon sites and draft inset elements', () => {
      const c = JSON.parse(JSON.stringify(placements));
      c.insets.push({
        key: 'ostra-vael', site: 'loc-0002', title: 'Ostra-Vael', plate: { width: 0.02, units: [1000, 760] }, eras: ['both'], rules: ['R12'],
        elements: [{ key: 'hull', kind: 'hull', c: [500, 400], r: 100, label: 'Hull', tier: 'draft', rules: ['R12'] }]
      });
      writePlacements(scratch, c);
      const author = buildMapData({ root: scratch, build: 'author' });
      const pub = buildMapData({ root: scratch, build: 'public' });
      assert(author.insets.some(inset => inset.key === 'ostra-vael'));
      assert(!pub.insets.some(inset => inset.key === 'ostra-vael'), 'no plate at a speculative site in the public data');
      assert(!JSON.stringify(pub).includes('ostra-vael'), 'nothing of that plate is in the public data');
      assert.deepEqual(platesFor(scratch, 'public').map(plate => plate.name), ['tessarine-vault-before', 'tessarine-vault-after', 'heliodrome-both']);
      assert.throws(() => createInsetPainter(scratch, { inset: 'ostra-vael', era: 'both', build: 'public' }), /not in the public build/);
      // A draft element is left out of the public expansion even where the
      // lint would stop it first.
      const vault = JSON.parse(JSON.stringify(c.insets.find(inset => inset.key === 'tessarine-vault')));
      vault.elements.find(entry => entry.key === 'storeroom').tier = 'draft';
      const keys = build => insets.expandInset(vault, { era: 'after', build }).labels.map(label => label.key);
      assert(keys('author').includes('storeroom') && !keys('public').includes('storeroom'), 'a draft element is in the author expansion only');
      assert(insets.expandInset(vault, { era: 'after', build: 'author' }).primitives.length > insets.expandInset(vault, { era: 'after', build: 'public' }).primitives.length, 'the draft element is not painted in the public raster');
    });
  } finally {
    removeDir(scratch);
  }

  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'map-insets-a-'));
  const again = fs.mkdtempSync(path.join(os.tmpdir(), 'map-insets-b-'));
  try {
    await test('the plate pyramid halves to one pixel for any shape', () => {
      const levels = rectPyramid(512, 738, 256);
      assert.equal(levels.length, 11);
      assert.deepEqual(levels[10], { level: 10, scale: 1, w: 512, h: 738, cols: 2, rows: 3 });
      assert.deepEqual(levels[0], { level: 0, scale: 1024, w: 1, h: 1, cols: 1, rows: 1 });
    });

    let manifest;
    await test('a small render writes each plate, era, and the scaffold, byte for byte the same twice', async () => {
      manifest = await renderInsets({ plate: 256, universe: 128, tile: 128, out, workers: 2 });
      assert.deepEqual(manifest.plates.map(plate => plate.dzi), ['tessarine-vault-before.dzi', 'tessarine-vault-after.dzi', 'heliodrome-both.dzi']);
      for (const plate of manifest.plates) {
        const dzi = fs.readFileSync(path.join(out, plate.dzi), 'utf8');
        assert.match(dzi, new RegExp(`<Size Width="${plate.width}" Height="${plate.height}"/>`));
        assert(fs.existsSync(path.join(out, plate.dzi.replace('.dzi', '_files'), String(plate.levels - 1), '0_0.webp')));
      }
      const scaffold = await sharp(fs.readFileSync(path.join(out, 'universe.webp'))).metadata();
      assert.equal(scaffold.hasAlpha, true, 'the scaffold is clear where the chart shows through');
      assert(!fs.existsSync(`${out}.partial`), 'the staging directory is removed');
      await renderInsets({ plate: 256, universe: 128, tile: 128, out: again, workers: 1 });
      for (const rel of ['tessarine-vault-after_files/8/0_0.webp', 'tessarine-vault-before_files/9/1_2.webp', 'heliodrome-both_files/7/0_0.webp', 'universe.webp']) {
        assert(fs.readFileSync(path.join(out, rel)).equals(fs.readFileSync(path.join(again, rel))), `${rel} differs between renders`);
      }
    });

    await test('bad settings fail before anything on disk changes', async () => {
      for (const settings of [{ workers: 0 }, { quality: 0 }, { tile: 100 }, { plate: 64 }, { universe: 10 }, { build: 'draft' }]) {
        await assert.rejects(() => renderInsets({ plate: 256, universe: 128, tile: 128, out, ...settings }));
      }
      assert(fs.existsSync(path.join(out, 'insets.json')), 'the earlier render is untouched');
    });
  } finally {
    removeDir(out);
    removeDir(again);
  }

  if (process.exitCode) console.error('\nMap depth tests: failures above');
  else console.log('\nMap depth tests: all passed');
})();
