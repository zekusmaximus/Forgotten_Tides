#!/usr/bin/env node
/**
 * Renders the atlas map's procedural base as a Deep Zoom (DZI) tile pyramid.
 *
 * Every tile is computed directly at its own level rather than downsampled
 * from a giant canvas, so memory stays flat and each level draws only the
 * detail its pixel size can show. The pixels come from the chart painter
 * (scripts/map/painter.js): stepped tints and isopleths of the canon density
 * field, the region treatments, stars, and the computed corridor lanes and
 * eddies (scripts/map/lanes.js). The lane network is computed once here and
 * shared with every worker. The same inputs always produce byte-identical
 * tiles. The cartography lint must pass first.
 *
 * The public build renders from primary- and working-canon densities only,
 * so no speculative site shapes the public image (decision D7).
 *
 * Usage: node scripts/map/render_tiles.js [--build author|public]
 *          [--size 16384] [--tile 256] [--out <dir>] [--workers N]
 *          [--quality 82] [--root <dir>]
 * Output (default out/map/tiles, or out/map/tiles-public for the public
 * build): galaxy.dzi, galaxy_files/<level>/<col>_<row>.webp, and galaxy.json
 * (the render manifest). Everything under out/ is gitignored.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const layout = require('./layout');
const { createPainter } = require('./painter');

const NAME = 'galaxy';
const FORMAT = 'webp';

function pyramid(size, tile) {
  const maxLevel = Math.ceil(Math.log2(size));
  return Array.from({ length: maxLevel + 1 }, (_, level) => {
    const scale = 2 ** (maxLevel - level);
    const dim = Math.ceil(size / scale);
    const count = Math.ceil(dim / tile);
    return { level, scale, dim, cols: count, rows: count, size };
  });
}

function dziXml(size, tile) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" Format="${FORMAT}" Overlap="0" TileSize="${tile}">\n` +
    `  <Size Width="${size}" Height="${size}"/>\n</Image>\n`;
}

async function runWorker() {
  const sharp = require('sharp');
  sharp.concurrency(1);
  const { root, build, tile, quality, levels, tasks, dir, network } = workerData;
  const painter = createPainter(root, { build, network });
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
  build = 'author',
  size = 16384,
  tile = 256,
  out = path.join(root, 'out', 'map', build === 'public' ? 'tiles-public' : 'tiles'),
  workers = Math.max(1, Math.min(8, os.cpus().length)),
  quality = 82,
  log = () => {}
} = {}) {
  // Validate everything before anything on disk changes.
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  // Tiles must share the painter's interpolation grid nodes (spacing 1 to 8
  // pixels), or neighbors would disagree at their seams.
  if (!Number.isInteger(tile) || tile < 64 || tile % 8 !== 0) throw new Error(`tile (${tile}) must be a multiple of 8, at least 64`);
  if (!Number.isInteger(size) || size < tile) throw new Error(`size (${size}) must be an integer of at least tile (${tile})`);
  if (!Number.isInteger(workers) || workers < 1) throw new Error(`workers (${workers}) must be a positive integer`);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) throw new Error(`quality (${quality}) must be an integer from 1 to 100`);
  const { lintCartography } = require('../lint/cartography_lint');
  const lint = lintCartography({ root });
  if (lint.errors) throw new Error(`the cartography lint reports ${lint.errors} errors; run npm run lint:map`);

  const started = Date.now();
  const { network } = createPainter(root, { build });
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
  const pool = [];
  try {
    await Promise.all(Array.from({ length: count }, (_, w) => new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { kind: 'atlas-map-render', root, build, tile, quality, levels, network, dir: stagingDir, tasks: tasks.filter((_, k) => k % count === w) }
      });
      pool.push(worker);
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
    if (done !== tasks.length) throw new Error(`rendered ${done} of ${tasks.length} tiles`);
  } catch (err) {
    // Stop the other workers and leave the previous tiles untouched.
    await Promise.all(pool.map(worker => worker.terminate()));
    fs.rmSync(stagingDir, { recursive: true, force: true });
    throw err;
  }

  fs.rmSync(filesDir, { recursive: true, force: true });
  fs.renameSync(stagingDir, filesDir);
  fs.writeFileSync(path.join(outDir, `${NAME}.dzi`), dziXml(size, tile));
  const manifest = { generated: new Date().toISOString(), build, size, tile, format: FORMAT, extent: layout.IMAGE_EXTENT, levels: levels.length, tiles: tasks.length, ms: Date.now() - started };
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
    build: option('--build'),
    size: option('--size', Number),
    tile: option('--tile', Number),
    out: option('--out') ? path.resolve(option('--out')) : undefined,
    workers: option('--workers', Number),
    quality: option('--quality', Number),
    log: message => console.log(message)
  };
  for (const key of Object.keys(settings)) if (settings[key] === undefined) delete settings[key];
  console.log(`Rendering atlas map tiles (${settings.build || 'author'} build, size ${settings.size || 16384})...`);
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
