#!/usr/bin/env node
/**
 * Tests for the atlas map's chart layers: the painter
 * (scripts/map/painter.js), the corridor lanes and eddies
 * (scripts/map/lanes.js), the isopleth labels (scripts/map/isopleths.js),
 * and the frame renderer (scripts/map/render_frame.js), run against the
 * repository's real placement file.
 */
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

sharp.cache(false);

const layout = require('../map/layout');
const { createPainter, VOID_COLOR, TINT_STOPS, SHARD_REACH, MISREGISTER } = require('../map/painter');
const { computeLanes, createLaneLayer } = require('../map/lanes');
const { buildMapData } = require('../map/build_data');
const { renderFrame } = require('../map/render_frame');
const Core = require('../../map/viewer_core');
const yaml = require('js-yaml');

// A scratch copy of the map's inputs (atlas, placement file, brief), edited,
// so a test can paint a variant of the real chart.
function scratchRoot({ cartography = c => c, atlas = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'map-chart-'));
  fs.cpSync(path.join(layout.DEFAULT_ROOT, 'atlas'), path.join(root, 'atlas'), { recursive: true });
  for (const [file, edit] of Object.entries(atlas)) {
    const full = path.join(root, 'atlas', file);
    fs.writeFileSync(full, edit(fs.readFileSync(full, 'utf8')));
  }
  fs.mkdirSync(path.join(root, 'design', 'map'), { recursive: true });
  const placements = yaml.load(fs.readFileSync(path.join(layout.DEFAULT_ROOT, layout.CARTOGRAPHY_PATH), 'utf8'));
  fs.writeFileSync(path.join(root, layout.CARTOGRAPHY_PATH), yaml.dump(cartography(placements)));
  fs.copyFileSync(path.join(layout.DEFAULT_ROOT, layout.BRIEF_PATH), path.join(root, layout.BRIEF_PATH));
  return root;
}
const removeDir = dir => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
const meanOf = buffer => buffer.reduce((sum, v) => sum + v, 0) / buffer.length;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS: ${name}`), err => {
      console.error(`FAIL: ${name}`);
      console.error(err.stack || err.message);
      process.exitCode = 1;
    });
}

(async () => {
  const painter = createPainter(layout.DEFAULT_ROOT);
  const { masks, field, network } = painter;
  const depthIn = (list, x, y) => list.reduce((d, shape) => Math.max(d, shape.depth(x, y)), -Infinity);
  const voids = masks.void.flatMap(shape => shape.items);

  await test('Void interiors print nothing: no tint, grain, isopleth, star, lane, or eddy', () => {
    for (const disc of voids) {
      // At about 60 pixels across the disc, and again close up.
      for (const across of [60, 600]) {
        const px = (2 * disc.radius) / across;
        const size = across + 8;
        const x0 = disc.center[0] - (size / 2) * px;
        const y0 = disc.center[1] + (size / 2) * px;
        const rgb = painter.paintWindow(x0, y0, px, size, size);
        let inside = 0;
        for (let v = 0; v < size; v++) {
          for (let u = 0; u < size; u++) {
            const depth = disc.depth(x0 + u * px, y0 - v * px);
            if (depth < 1.5 * px) continue;
            inside++;
            const k = (v * size + u) * 3;
            assert.deepEqual([rgb[k], rgb[k + 1], rgb[k + 2]], VOID_COLOR, `pixel ${u},${v} inside the Void at ${disc.center.map(c => c.toFixed(3))}`);
          }
        }
        assert(inside > 0.6 * across * across * 0.785 - 4 * across, 'the window covered the Void');
      }
    }
  });

  await test('neighboring tiles agree across their shared edge', () => {
    // A window painted whole must equal its two halves painted as tiles:
    // in the Gap (shards, stars, lanes), at the Horizon's ink, and at a
    // pixel size whose ideal grid spacing (0.004 / px = 5) is not a power
    // of two.
    for (const [cx, cy, px] of [[0.56, 0.47, 0.0004], [0.6, 0.48, 0.00004], [0.2, 1.17, 0.0005], [-0.3, 0.2, 0.0008]]) {
      const w = 256;
      const x0 = cx - w * px;
      const y0 = cy + (w / 2) * px;
      const whole = painter.paintWindow(x0, y0, px, 2 * w, w);
      const left = painter.paintWindow(x0, y0, px, w, w);
      const right = painter.paintWindow(x0 + w * px, y0, px, w, w);
      for (let v = 0; v < w; v++) {
        const row = whole.subarray(v * 2 * w * 3, (v + 1) * 2 * w * 3);
        assert(row.subarray(0, w * 3).equals(left.subarray(v * w * 3, (v + 1) * w * 3)), `left tile row ${v} at ${cx},${cy}`);
        assert(row.subarray(w * 3).equals(right.subarray(v * w * 3, (v + 1) * w * 3)), `right tile row ${v} at ${cx},${cy}`);
      }
      // And split the other way: a tall window against its top and bottom.
      const tall = painter.paintWindow(x0, y0, px, w, 2 * w);
      assert(tall.subarray(0, w * w * 3).equals(left), `top tile at ${cx},${cy}`);
      assert(tall.subarray(w * w * 3).equals(painter.paintWindow(x0, y0 - w * px, px, w, w)), `bottom tile at ${cx},${cy}`);
    }
  });

  await test('no Gap shard carries anything farther than the reach tiles search', () => {
    // Stars, lanes, and eddies are gathered from SHARD_REACH beyond each tile,
    // so a shard must never move a point farther, or a tile edge would cut it.
    const gap = masks.fracture[0];
    let farthest = 0;
    for (let r = gap.inner; r <= gap.outer; r += 0.002) {
      const { center, half } = gap.at(r);
      for (let theta = center - half; theta <= center + half; theta += 0.05) {
        const a = (theta * Math.PI) / 180;
        const [x, y] = [r * Math.cos(a), r * Math.sin(a)];
        const shard = painter.shardAt(x, y);
        const [sx, sy] = painter.throughShard(shard, x, y, 1);
        farthest = Math.max(farthest, Math.hypot(sx - x, sy - y));
      }
    }
    assert(farthest > 0.004, `shards move the chart, farthest ${farthest}`);
    assert(farthest + Math.hypot(...MISREGISTER) <= SHARD_REACH, `farthest ${farthest.toFixed(5)} plus the second print exceeds ${SHARD_REACH.toFixed(5)}`);
  });

  await test('lanes keep out of the Voids and inside the Horizon; eddies keep out of Voids and the Seas', () => {
    assert(network.lanes.length > 50, `a network of lanes, got ${network.lanes.length}`);
    for (const lane of network.lanes) {
      for (let k = 0; k < lane.points.length - 1; k++) {
        const [ax, ay] = lane.points[k];
        const [bx, by] = lane.points[k + 1];
        for (let t = 0; t <= 1; t += 0.1) {
          const x = ax + (bx - ax) * t;
          const y = ay + (by - ay) * t;
          assert(depthIn(masks.void, x, y) < 0, `lane point ${x.toFixed(3)},${y.toFixed(3)} is inside a Void`);
          assert(Math.hypot(x, y) < 0.97, 'lane point past the Horizon');
        }
      }
    }
    assert(network.eddies.length > 20, `eddies, got ${network.eddies.length}`);
    for (const eddy of network.eddies) {
      assert(depthIn(masks.void, eddy.x, eddy.y) < 0 && depthIn(masks.ash, eddy.x, eddy.y) < 0, `eddy at ${eddy.x},${eddy.y}`);
    }
  });

  await test('eddies face up the density gradient', () => {
    for (const eddy of network.eddies) {
      const step = 0.02;
      const ahead = field(eddy.x + step * Math.cos(eddy.angle), eddy.y + step * Math.sin(eddy.angle));
      const behind = field(eddy.x - step * Math.cos(eddy.angle), eddy.y - step * Math.sin(eddy.angle));
      assert(ahead >= behind - 1e-9, `eddy at ${eddy.x.toFixed(3)},${eddy.y.toFixed(3)} faces downhill`);
    }
  });

  await test('eddies are densest in the Lattice Gap, where eddy activity is high', () => {
    // Story bible section 4.1. Count eddies against area in the Gap and in
    // the Drift (density above 0.45 outside the Core).
    const gap = masks.fracture[0];
    const inGap = (x, y) => gap.depth(x, y) > 0;
    const inDrift = (x, y) => !inGap(x, y) && field(x, y) > 0.45 && Math.hypot(x, y) > 0.13;
    let gapArea = 0;
    let driftArea = 0;
    for (let x = -1; x <= 1; x += 0.005) {
      for (let y = -1; y <= 1; y += 0.005) {
        if (Math.hypot(x, y) > 0.97) continue;
        if (inGap(x, y)) gapArea++;
        else if (inDrift(x, y)) driftArea++;
      }
    }
    const gapCount = network.eddies.filter(e => inGap(e.x, e.y)).length;
    const driftCount = network.eddies.filter(e => inDrift(e.x, e.y)).length;
    assert(gapCount / gapArea > 2 * (driftCount / driftArea), `Gap ${gapCount} over ${gapArea}, Drift ${driftCount} over ${driftArea}`);
  });

  await test('the lane network is deterministic', () => {
    const again = computeLanes({
      field,
      voidDepth: (x, y) => depthIn(masks.void, x, y),
      fractureDepth: (x, y) => depthIn(masks.fracture, x, y),
      ashDepth: (x, y) => depthIn(masks.ash, x, y)
    });
    assert.deepEqual(again, network);
  });

  await test('the placement file switches the lanes, eddies, and knots', () => {
    assert.deepEqual(painter.features, { lanes: true, eddies: true, knots: true });
    const root = scratchRoot({ cartography: c => ({ ...c, features: c.features.filter(f => !['corridor-lanes', 'eddies', 'black-hole-knots'].includes(f.key)) }) });
    try {
      const bare = createPainter(root);
      assert.deepEqual(bare.features, { lanes: false, eddies: false, knots: false });
      const lane = network.lanes[0].points;
      const [cx, cy] = lane[Math.floor(lane.length / 2)];
      const args = [cx - 32 * 0.0002, cy + 32 * 0.0002, 0.0002, 64, 64];
      assert(!painter.paintWindow(...args).equals(bare.paintWindow(...args)), 'the listed lane draws; the unlisted one does not');
    } finally {
      removeDir(root);
    }
    const draftRoot = scratchRoot({ cartography: c => ({ ...c, features: c.features.map(f => (f.key === 'corridor-lanes' ? { ...f, tier: 'draft' } : f)) }) });
    try {
      assert.equal(createPainter(draftRoot, { build: 'public' }).features.lanes, false, 'a draft texture stays out of the public build');
      assert.equal(createPainter(draftRoot).features.lanes, true, 'the author build keeps it');
    } finally {
      removeDir(draftRoot);
    }
  });

  await test('a region whose value sits on a contour level and a band edge prints flat', () => {
    // The Gap's plateau at 0.30 (a major isopleth and a tint edge) must look
    // like the same plateau at 0.33: no contour ink flooding the interior,
    // no blend of two tints.
    const paintGapAt = value => {
      const root = scratchRoot({ atlas: { 'Lattice_Gap.md': text => text.replace(/memory_density: 0\.31/, `memory_density: ${value}`) } });
      try {
        const [x, y] = [0.86 * Math.cos((41 * Math.PI) / 180), 0.86 * Math.sin((41 * Math.PI) / 180)];
        return createPainter(root).paintWindow(x - 0.01, y + 0.01, 0.0003, 64, 64);
      } finally {
        removeDir(root);
      }
    };
    const onEdge = meanOf(paintGapAt(0.3));
    const inside = meanOf(paintGapAt(0.33));
    assert(Math.abs(onEdge - inside) < 3, `mean ${onEdge.toFixed(1)} on the edge against ${inside.toFixed(1)} inside the band`);
  });

  await test('lanes and eddies draw only when the placement file lists them', () => {
    const blank = () => ({ rgb: new Float32Array(64 * 64 * 3), w: 64, h: 64, voidCover: new Float32Array(64 * 64), shardShift: new Float32Array(64 * 64 * 2) });
    const lane = network.lanes[0].points;
    const [cx, cy] = lane[Math.floor(lane.length / 2)];
    const px = 0.0002;
    const window = { x0: cx - 32 * px, y0: cy + 32 * px, px };
    const drawn = blank();
    createLaneLayer(network).paint({ ...drawn, ...window });
    assert(drawn.rgb.some(v => v > 0), 'a listed lane draws');
    const off = blank();
    createLaneLayer(network, { lanes: false, eddies: false }).paint({ ...off, ...window });
    assert(off.rgb.every(v => v === 0), 'an unlisted layer draws nothing');
  });

  await test('isopleth labels sit on major isopleths, clear of Voids, the Seas, the Gap, and sites', () => {
    const data = buildMapData({ build: 'author' });
    const labels = data.chart.isopleths;
    assert(labels.length >= 20, `labels, got ${labels.length}`);
    const sites = data.sites.map(site => site.xy);
    for (const label of labels) {
      const [x, y] = label.xy;
      assert(Math.abs(field(x, y) - label.value) < 0.01, `${label.label} at ${label.xy} is on its isopleth`);
      assert(Math.abs(label.value * 10 - Math.round(label.value * 10)) < 1e-9, 'a major isopleth');
      assert(depthIn(masks.void, x, y) < 0 && depthIn(masks.ash, x, y) < 0 && depthIn(masks.fracture, x, y) < 0, `${label.label} at ${label.xy}`);
      assert(sites.every(([sx, sy]) => Math.hypot(sx - x, sy - y) >= 0.05), `${label.label} at ${label.xy} crowds a site`);
      assert(label.angle > -90 && label.angle <= 90, 'reads left to right');
    }
    assert.equal(data.chart.tints.length, TINT_STOPS.length + 1);
  });

  await test('no region label anchor sits inside a Void', () => {
    const data = buildMapData({ build: 'author' });
    for (const region of data.regions) {
      if (!region.label_xy) continue;
      assert(depthIn(masks.void, ...region.label_xy) < 0, `${region.name} label`);
    }
  });

  await test('soundings print canon values with at least two decimals and the as-of note', () => {
    assert.deepEqual(Core.sounding({ memory_density: 0 }), { value: '0.00', note: null });
    assert.deepEqual(Core.sounding({ memory_density: 0.015 }), { value: '0.015', note: null });
    assert.deepEqual(Core.sounding({ memory_density: 0.3 }), { value: '0.30', note: null });
    assert.deepEqual(Core.sounding({ memory_density: 0.78, memory_density_as_of: 'Before the Tessarine Breach (event-story-0022-001)' }), { value: '0.78', note: 'Before the Tessarine Breach' });
    assert.equal(Core.sounding({ memory_density: null }), null);
  });

  await test('the frame renderer writes the painter\'s pixels to a PNG', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'map-frame-'));
    try {
      const out = path.join(dir, 'frame.png');
      const frame = await renderFrame({ center: [0.4, 0.2], span: 0.1, width: 96, height: 64, out, painter });
      const meta = await sharp(fs.readFileSync(out)).metadata();
      assert.deepEqual([meta.width, meta.height], [96, 64]);
      const direct = painter.paintWindow(0.4 - 0.05 + frame.px / 2, 0.2 + 32 * frame.px - frame.px / 2, frame.px, 96, 64);
      assert(direct.equals(frame.buffer), 'the frame matches the painter');
      await assert.rejects(() => renderFrame({ span: 0, out }));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  });

  if (process.exitCode) console.error('\nMap chart tests: failures above');
  else console.log('\nMap chart tests: all passed');
})();
