#!/usr/bin/env node
/**
 * Renders the atlas map's procedural base as a Deep Zoom (DZI) tile pyramid.
 *
 * Every tile is computed directly at its own level rather than downsampled
 * from a giant canvas, so memory stays flat and each level draws only the
 * noise octaves its pixel size can show. Color comes from the canon density
 * field (scripts/map/field.js), shaded by each region's `treatment`, with
 * deterministic nebular noise and star classes that fade in as their cells
 * grow past a few pixels. The same inputs always produce byte-identical
 * tiles. The cartography lint must pass first.
 *
 * Usage: node scripts/map/render_tiles.js [--size 16384] [--tile 256]
 *          [--out out/map/tiles] [--workers N] [--quality 82] [--root <dir>]
 * Output: <out>/galaxy.dzi, <out>/galaxy_files/<level>/<col>_<row>.webp,
 *         and <out>/galaxy.json (render manifest). Everything under out/ is
 *         gitignored.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const layout = require('./layout');
const { smoothstep } = require('./field');

const NAME = 'galaxy';
const FORMAT = 'webp';

// Density -> color, on the void and amber scales of ui_kits/colors_and_type.css.
const RAMP = [
  [0.0, [5, 7, 10]], [0.02, [8, 10, 14]], [0.08, [14, 17, 23]], [0.2, [22, 27, 35]],
  [0.32, [34, 40, 50]], [0.45, [52, 48, 46]], [0.55, [72, 58, 40]], [0.65, [104, 80, 46]],
  [0.75, [150, 112, 62]], [0.85, [205, 155, 88]], [0.97, [255, 238, 205]]
];
const STAR_CLASSES = [
  { cell: 0.024, radius: 0.0011, gain: 1.0, salt: 11 },
  { cell: 0.008, radius: 0.00045, gain: 0.8, salt: 23 },
  { cell: 0.0027, radius: 0.0002, gain: 0.65, salt: 37 }
];
const NOISE_BASE = 2.2;      // nebular cycles per chart unit at the first octave
const MAX_OCTAVES = 8;

function pyramid(size, tile) {
  const maxLevel = Math.ceil(Math.log2(size));
  return Array.from({ length: maxLevel + 1 }, (_, level) => {
    const scale = 2 ** (maxLevel - level);
    const dim = Math.ceil(size / scale);
    const count = Math.ceil(dim / tile);
    return { level, scale, dim, cols: count, rows: count };
  });
}

function dziXml(size, tile) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" Format="${FORMAT}" Overlap="0" TileSize="${tile}">\n` +
    `  <Size Width="${size}" Height="${size}"/>\n</Image>\n`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(i, j, salt) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(salt, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function ramp(v) {
  if (v <= RAMP[0][0]) return RAMP[0][1];
  for (let k = 1; k < RAMP.length; k++) {
    if (v <= RAMP[k][0]) {
      const [v0, c0] = RAMP[k - 1];
      const [v1, c1] = RAMP[k];
      const t = (v - v0) / (v1 - v0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return RAMP[RAMP.length - 1][1];
}

// Builds the per-pixel painter from the repository's map inputs.
function createPainter(root) {
  // simplex-noise ships CommonJS; required here so tests that never render
  // do not load it.
  const { createNoise2D } = require('simplex-noise');
  const context = layout.loadMapContext(root);
  const shapes = layout.buildShapes(context.cartography);
  const { field } = layout.createMapField(context, shapes);
  const blend = context.cartography.field.blend;
  const treated = treatment => context.cartography.regions
    .filter(region => region.treatment === treatment)
    .map(region => shapes.get(region.id));
  const masks = { fracture: treated('fracture'), ash: treated('ash'), void: treated('void'), perimeter: treated('perimeter') };
  const noise = createNoise2D(mulberry32(20261029));
  const warp = createNoise2D(mulberry32(1029));
  const extent = layout.IMAGE_EXTENT;

  const maskAt = (list, x, y) => list.reduce((m, shape) => Math.max(m, smoothstep(0, blend, shape.depth(x, y))), 0);

  function paint(levelInfo, col, row, tile) {
    const { dim } = levelInfo;
    const w = Math.min(tile, dim - col * tile);
    const h = Math.min(tile, dim - row * tile);
    const px = (2 * extent) / dim;
    const x0 = -extent + (col * tile + 0.5) * px;
    const y0 = extent - (row * tile + 0.5) * px;

    // The field and region masks vary over many pixels, so sample them on a
    // coarse grid and interpolate.
    const g = Math.max(1, Math.min(8, Math.round(0.004 / px)));
    const gw = Math.floor((w - 1) / g) + 2;
    const gh = Math.floor((h - 1) / g) + 2;
    const grid = { density: new Float32Array(gw * gh), fracture: new Float32Array(gw * gh), ash: new Float32Array(gw * gh), void: new Float32Array(gw * gh), perimeter: new Float32Array(gw * gh) };
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const x = x0 + i * g * px;
        const y = y0 - j * g * px;
        const k = j * gw + i;
        grid.density[k] = field(x, y);
        grid.fracture[k] = maskAt(masks.fracture, x, y);
        grid.ash[k] = maskAt(masks.ash, x, y);
        grid.void[k] = maskAt(masks.void, x, y);
        grid.perimeter[k] = maskAt(masks.perimeter, x, y);
      }
    }
    const sample = (array, u, v) => {
      const gx = Math.min(gw - 1.0001, Math.max(0, u / g));
      const gy = Math.min(gh - 1.0001, Math.max(0, v / g));
      const i = Math.floor(gx);
      const j = Math.floor(gy);
      const fx = gx - i;
      const fy = gy - j;
      const a = array[j * gw + i];
      const b = array[j * gw + i + 1];
      const c = array[(j + 1) * gw + i];
      const d = array[(j + 1) * gw + i + 1];
      return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    };

    let octaves = 0;
    while (octaves < MAX_OCTAVES && NOISE_BASE * 2 ** octaves * px < 0.45) octaves++;

    const rgb = new Float32Array(w * h * 3);
    for (let v = 0; v < h; v++) {
      const y = y0 - v * px;
      for (let u = 0; u < w; u++) {
        const x = x0 + u * px;
        const density = sample(grid.density, u, v);
        const voidMask = sample(grid.void, u, v);
        const ash = sample(grid.ash, u, v);
        const fracture = sample(grid.fracture, u, v);
        const perimeter = sample(grid.perimeter, u, v);

        let n = 0;
        let amp = 0.5;
        let f = NOISE_BASE;
        const wx = x + 0.06 * warp(x * 1.7, y * 1.7);
        const wy = y + 0.06 * warp(x * 1.7 + 19.1, y * 1.7 - 7.3);
        for (let o = 0; o < octaves; o++) {
          n += amp * noise(wx * f, wy * f);
          amp *= 0.5;
          f *= 2;
        }

        let [r, gr, b] = ramp(density);
        const glow = 0.78 + 0.44 * (n * 0.5 + 0.5);
        r *= glow; gr *= glow; b *= glow;
        if (fracture > 0) {
          const t = 0.38 * fracture;
          r += (64 - r) * t; gr += (74 - gr) * t; b += (92 - b) * t;
        }
        if (ash > 0) {
          // Scar tissue: ashen grey, streaked along the noise, never black.
          const streak = 0.5 + 0.5 * noise(x * 9, y * 42);
          const tex = 0.55 + 0.6 * (n * 0.5 + 0.5) + 0.35 * streak;
          const t = 0.8 * ash;
          r += (60 * tex - r) * t; gr += (55 * tex - gr) * t; b += (50 * tex - b) * t;
        }
        if (perimeter > 0) {
          const t = 0.45 * perimeter;
          r *= 1 - t; gr *= 1 - t; b *= 1 - t * 0.6;
        }
        if (voidMask > 0) {
          r += (5 - r) * voidMask; gr += (7 - gr) * voidMask; b += (10 - b) * voidMask;
        }
        const k = (v * w + u) * 3;
        rgb[k] = r; rgb[k + 1] = gr; rgb[k + 2] = b;
      }
    }

    // Stars: per class, one candidate per world cell, visible once the cell
    // spans a few pixels at this level.
    for (const cls of STAR_CLASSES) {
      const cellPx = cls.cell / px;
      if (cellPx < 3) continue;
      const fade = Math.min(1, (cellPx - 3) / 3);
      const reach = cls.radius * 3;
      const xMin = x0 - px - reach;
      const xMax = x0 + w * px + reach;
      const yMax = y0 + px + reach;
      const yMin = y0 - h * px - reach;
      for (let i = Math.floor(xMin / cls.cell); i <= Math.floor(xMax / cls.cell); i++) {
        for (let j = Math.floor(yMin / cls.cell); j <= Math.floor(yMax / cls.cell); j++) {
          const sx = (i + hash2(i, j, cls.salt)) * cls.cell;
          const sy = (j + hash2(i, j, cls.salt + 1)) * cls.cell;
          const su = (sx - x0) / px;
          const sv = (y0 - sy) / px;
          const density = Math.max(0, sample(grid.density, su, sv));
          const isVoid = sample(grid.void, su, sv);
          if (isVoid > 0.5) continue;
          const ash = sample(grid.ash, su, sv) > 0.5;
          const chance = ash ? 0.3 : 0.05 + 0.6 * Math.pow(density, 1.3);
          if (hash2(i, j, cls.salt + 2) > chance) continue;
          const roll = hash2(i, j, cls.salt + 3);
          const bright = cls.gain * fade * (0.25 + 0.75 * roll * roll * roll) * (0.45 + 0.55 * density);
          const color = ash ? [190, 118, 58] : [241, 236, 224];
          const radiusPx = Math.max(0.55, (cls.radius * (0.6 + 0.8 * roll)) / px);
          const span = Math.ceil(radiusPx * 2);
          for (let dv = -span; dv <= span; dv++) {
            const pv = Math.round(sv) + dv;
            if (pv < 0 || pv >= h) continue;
            for (let du = -span; du <= span; du++) {
              const pu = Math.round(su) + du;
              if (pu < 0 || pu >= w) continue;
              const d = Math.hypot(pu - su, pv - sv) / radiusPx;
              const a = bright * Math.exp(-2 * d * d);
              if (a < 0.004) continue;
              const k = (pv * w + pu) * 3;
              rgb[k] += (color[0] - rgb[k]) * Math.min(1, a);
              rgb[k + 1] += (color[1] - rgb[k + 1]) * Math.min(1, a);
              rgb[k + 2] += (color[2] - rgb[k + 2]) * Math.min(1, a);
            }
          }
        }
      }
    }

    const out = Buffer.alloc(w * h * 3);
    for (let k = 0; k < out.length; k++) out[k] = Math.max(0, Math.min(255, Math.round(rgb[k])));
    return { buffer: out, width: w, height: h };
  }

  return { paint };
}

async function runWorker() {
  const sharp = require('sharp');
  sharp.concurrency(1);
  const { root, tile, quality, levels, tasks, dir } = workerData;
  const painter = createPainter(root);
  for (const [level, col, row] of tasks) {
    const { buffer, width, height } = painter.paint(levels[level], col, row, tile);
    await sharp(buffer, { raw: { width, height, channels: 3 } })
      .webp({ quality, effort: 4 })
      .toFile(path.join(dir, String(level), `${col}_${row}.${FORMAT}`));
    parentPort.postMessage({ done: 1 });
  }
}

async function renderTiles({
  root = layout.DEFAULT_ROOT,
  size = 16384,
  tile = 256,
  out = path.join(root, 'out', 'map', 'tiles'),
  workers = Math.max(1, Math.min(8, os.cpus().length)),
  quality = 82,
  log = () => {}
} = {}) {
  // Loaded lazily so `npm run map:tiles -- --help`-style failures stay cheap.
  const { lintCartography } = require('../lint/cartography_lint');
  const lint = lintCartography({ root });
  if (lint.errors) throw new Error(`the cartography lint reports ${lint.errors} errors; run npm run lint:map`);
  if (!Number.isInteger(size) || size < tile || !Number.isInteger(tile) || tile < 64) {
    throw new Error(`size (${size}) must be an integer of at least tile (${tile}), and tile at least 64`);
  }

  const started = Date.now();
  const levels = pyramid(size, tile);
  const tasks = levels.flatMap(info => {
    const list = [];
    for (let row = 0; row < info.rows; row++) for (let col = 0; col < info.cols; col++) list.push([info.level, col, row]);
    return list;
  });
  const outDir = path.resolve(out);
  const filesDir = path.join(outDir, `${NAME}_files`);
  const stagingDir = `${filesDir}.partial`;
  fs.rmSync(stagingDir, { recursive: true, force: true });
  for (const info of levels) fs.mkdirSync(path.join(stagingDir, String(info.level)), { recursive: true });

  const count = Math.min(workers, tasks.length);
  let done = 0;
  let reported = 0;
  await Promise.all(Array.from({ length: count }, (_, w) => new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { kind: 'atlas-map-render', root, tile, quality, levels, dir: stagingDir, tasks: tasks.filter((_, k) => k % count === w) }
    });
    worker.on('message', () => {
      done++;
      const percent = Math.floor((done / tasks.length) * 100);
      if (percent >= reported + 10) {
        reported = percent - (percent % 10);
        log(`  ${reported}% (${done}/${tasks.length} tiles)`);
      }
    });
    worker.on('error', reject);
    worker.on('exit', code => (code === 0 ? resolve() : reject(new Error(`render worker exited with code ${code}`))));
  })));

  fs.rmSync(filesDir, { recursive: true, force: true });
  fs.renameSync(stagingDir, filesDir);
  fs.writeFileSync(path.join(outDir, `${NAME}.dzi`), dziXml(size, tile));
  const manifest = { generated: new Date().toISOString(), size, tile, format: FORMAT, extent: layout.IMAGE_EXTENT, levels: levels.length, tiles: tasks.length, ms: Date.now() - started };
  fs.writeFileSync(path.join(outDir, `${NAME}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function main() {
  const args = process.argv.slice(2);
  const option = (name, parse = String) => {
    const index = args.indexOf(name);
    return index >= 0 ? parse(args[index + 1]) : undefined;
  };
  const root = option('--root') ? path.resolve(option('--root')) : layout.DEFAULT_ROOT;
  const settings = {
    root,
    size: option('--size', Number),
    tile: option('--tile', Number),
    out: option('--out') ? path.resolve(option('--out')) : undefined,
    workers: option('--workers', Number),
    quality: option('--quality', Number),
    log: message => console.log(message)
  };
  for (const key of Object.keys(settings)) if (settings[key] === undefined) delete settings[key];
  console.log(`Rendering atlas map tiles (size ${settings.size || 16384})...`);
  renderTiles(settings).then(
    manifest => console.log(`Rendered ${manifest.tiles} tiles in ${manifest.levels} levels in ${(manifest.ms / 1000).toFixed(1)} s.`),
    err => {
      console.error(`Tile render failed: ${err.message}`);
      process.exit(1);
    }
  );
}

module.exports = { renderTiles, pyramid, createPainter, dziXml };

if (!isMainThread && workerData && workerData.kind === 'atlas-map-render') {
  runWorker().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else if (require.main === module) {
  main();
}
