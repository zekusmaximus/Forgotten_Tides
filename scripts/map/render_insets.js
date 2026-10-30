#!/usr/bin/env node
/**
 * Renders the atlas map's depth layers: each Z3 inset plate as its own Deep
 * Zoom (DZI) pyramid, one per era, and the Z0 universe scaffold as one RGBA
 * image (decisions Q23-Q29 and Q34).
 *
 * The plates are painted by scripts/map/inset_painter.js and the scaffold by
 * scripts/map/universe.js. Like the chart tiles, every pixel is decided at
 * its own chart position, so tiles agree at their seams and the same inputs
 * give the same bytes. The rasters carry no text (rule R14). The public
 * build leaves out insets at non-canon sites and draft inset elements. The
 * cartography lint must pass first.
 *
 * Usage: node scripts/map/render_insets.js [--build author|public]
 *          [--plate 4096] [--universe 4096] [--tile 256] [--out <dir>]
 *          [--workers N] [--quality 88] [--root <dir>]
 * Output (default out/map/insets, or out/map/insets-public): one
 * <key>-<era>.dzi and <key>-<era>_files/ per plate and era, universe.webp,
 * and insets.json (the render manifest). Everything under out/ is
 * gitignored.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const layout = require('./layout');
const { createInsetPainter } = require('./inset_painter');
const { createUniversePainter } = require('./universe');

const FORMAT = 'webp';

// A Deep Zoom pyramid for a width x height image: level L halves the
// full-size image (L = max) once per step down to 1 x 1.
function rectPyramid(width, height, tile) {
  const maxLevel = Math.ceil(Math.log2(Math.max(width, height)));
  return Array.from({ length: maxLevel + 1 }, (_, level) => {
    const scale = 2 ** (maxLevel - level);
    const w = Math.ceil(width / scale);
    const h = Math.ceil(height / scale);
    return { level, scale, w, h, cols: Math.ceil(w / tile), rows: Math.ceil(h / tile) };
  });
}

function dziXml(width, height, tile) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" Format="${FORMAT}" Overlap="0" TileSize="${tile}">\n` +
    `  <Size Width="${width}" Height="${height}"/>\n</Image>\n`;
}

// The plates a build renders: every inset and era, less any inset whose
// site the build leaves out.
function platesFor(root, build) {
  const { cartography, atlas } = layout.loadMapContext(root);
  const plates = [];
  for (const inset of cartography.insets || []) {
    const entity = atlas.get(inset.site);
    if (!entity || (build === 'public' && !layout.CANON_TIERS.has(entity.tier))) continue;
    for (const era of inset.eras.includes('both') ? ['both'] : inset.eras) plates.push({ key: inset.key, era, name: `${inset.key}-${era}` });
  }
  return plates;
}

async function runWorker() {
  const sharp = require('sharp');
  sharp.concurrency(1);
  const { root, build, tile, quality, plates, tasks, dir } = workerData;
  const painters = new Map();
  for (const [index, level, col, row] of tasks) {
    const plate = plates[index];
    if (!painters.has(plate.name)) painters.set(plate.name, createInsetPainter(root, { build, inset: plate.key, era: plate.era }));
    const painter = painters.get(plate.name);
    const info = plate.levels[level];
    const { rect } = painter.frame;
    const px = (rect.width * info.scale) / plate.width;
    const w = Math.min(tile, info.w - col * tile);
    const h = Math.min(tile, info.h - row * tile);
    const x0 = rect.left + (col * tile + 0.5) * px;
    const y0 = rect.top - (row * tile + 0.5) * px;
    const buffer = painter.paintWindow(x0, y0, px, w, h);
    await sharp(buffer, { raw: { width: w, height: h, channels: 3 } })
      .webp({ quality, effort: 4 })
      .toFile(path.join(dir, `${plate.name}_files`, String(level), `${col}_${row}.${FORMAT}`));
    parentPort.postMessage({ done: 1 });
  }
}

async function renderInsets({
  root = layout.DEFAULT_ROOT,
  build = 'author',
  plate: plateWidth = 4096,
  universe: universeSize = 4096,
  tile = 256,
  out = path.join(root, 'out', 'map', build === 'public' ? 'insets-public' : 'insets'),
  workers = Math.max(1, Math.min(8, os.cpus().length)),
  quality = 88,
  log = () => {}
} = {}) {
  // Validate everything before anything on disk changes.
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  if (!Number.isInteger(tile) || tile < 64 || tile % 8 !== 0) throw new Error(`tile (${tile}) must be a multiple of 8, at least 64`);
  if (!Number.isInteger(plateWidth) || plateWidth < tile) throw new Error(`plate (${plateWidth}) must be an integer of at least tile (${tile})`);
  if (!Number.isInteger(universeSize) || universeSize < 64) throw new Error(`universe (${universeSize}) must be an integer of at least 64`);
  if (!Number.isInteger(workers) || workers < 1) throw new Error(`workers (${workers}) must be a positive integer`);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) throw new Error(`quality (${quality}) must be an integer from 1 to 100`);
  const { lintCartography } = require('../lint/cartography_lint');
  const lint = lintCartography({ root });
  if (lint.errors) throw new Error(`the cartography lint reports ${lint.errors} errors; run npm run lint:map`);

  const started = Date.now();
  const sharp = require('sharp');
  const plates = platesFor(root, build).map(plate => {
    const { frame } = createInsetPainter(root, { build, inset: plate.key, era: plate.era });
    const width = plateWidth;
    const height = Math.round((plateWidth * frame.rect.height) / frame.rect.width);
    return { ...plate, width, height, levels: rectPyramid(width, height, tile), rect: frame.rect };
  });
  const outDir = path.resolve(out);
  const staging = `${outDir}.partial`;
  fs.rmSync(staging, { recursive: true, force: true });
  for (const plate of plates) for (const info of plate.levels) fs.mkdirSync(path.join(staging, `${plate.name}_files`, String(info.level)), { recursive: true });
  const tasks = plates.flatMap((plate, index) => plate.levels.flatMap(info => {
    const list = [];
    for (let row = 0; row < info.rows; row++) for (let col = 0; col < info.cols; col++) list.push([index, info.level, col, row]);
    return list;
  }));

  const count = Math.max(1, Math.min(workers, tasks.length));
  let done = 0;
  let reported = 0;
  const pool = [];
  try {
    if (tasks.length) {
      await Promise.all(Array.from({ length: count }, (_, w) => new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { kind: 'atlas-map-insets', root, build, tile, quality, plates, dir: staging, tasks: tasks.filter((_, k) => k % count === w) }
        });
        pool.push(worker);
        worker.on('message', () => {
          done++;
          const percent = Math.floor((done / tasks.length) * 100);
          if (percent >= reported + 25) {
            reported = percent - (percent % 25);
            log(`  ${reported}% (${done}/${tasks.length} plate tiles)`);
          }
        });
        worker.on('error', reject);
        worker.on('exit', code => (code === 0 ? resolve() : reject(new Error(`inset worker exited with code ${code}`))));
      })));
    }
    if (done !== tasks.length) throw new Error(`rendered ${done} of ${tasks.length} plate tiles`);
    for (const plate of plates) fs.writeFileSync(path.join(staging, `${plate.name}.dzi`), dziXml(plate.width, plate.height, tile));

    // The universe scaffold: one image, clear at the center.
    const scaffold = createUniversePainter(root, { build });
    const extent = scaffold.spec.extent;
    const px = (2 * extent) / universeSize;
    const buffer = Buffer.alloc(universeSize * universeSize * 4);
    for (let row = 0; row < universeSize; row += 256) {
      const h = Math.min(256, universeSize - row);
      scaffold.paintWindow(-extent + px / 2, extent - (row + 0.5) * px, px, universeSize, h).copy(buffer, row * universeSize * 4);
    }
    await sharp(buffer, { raw: { width: universeSize, height: universeSize, channels: 4 } })
      .webp({ quality, alphaQuality: 100, effort: 4 })
      .toFile(path.join(staging, 'universe.webp'));

    const manifest = {
      generated: new Date().toISOString(),
      build,
      tile,
      format: FORMAT,
      plates: plates.map(({ key, era, name, width, height, levels, rect }) => ({ key, era, dzi: `${name}.dzi`, width, height, levels: levels.length, rect })),
      universe: { file: 'universe.webp', size: universeSize, extent },
      tiles: tasks.length,
      ms: Date.now() - started
    };
    fs.writeFileSync(path.join(staging, 'insets.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.renameSync(staging, outDir);
    return manifest;
  } catch (err) {
    // Stop the other workers and leave the previous render untouched.
    await Promise.all(pool.map(worker => worker.terminate()));
    fs.rmSync(staging, { recursive: true, force: true });
    throw err;
  }
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
    plate: option('--plate', Number),
    universe: option('--universe', Number),
    tile: option('--tile', Number),
    out: option('--out') ? path.resolve(option('--out')) : undefined,
    workers: option('--workers', Number),
    quality: option('--quality', Number),
    log: message => console.log(message)
  };
  for (const key of Object.keys(settings)) if (settings[key] === undefined) delete settings[key];
  console.log(`Rendering atlas map insets and the universe scaffold (${settings.build || 'author'} build)...`);
  renderInsets(settings).then(
    manifest => console.log(`Rendered ${manifest.plates.length} plates (${manifest.tiles} tiles) and the scaffold in ${(manifest.ms / 1000).toFixed(1)} s.`),
    err => {
      console.error(`Inset render failed: ${err.message}`);
      process.exit(1);
    }
  );
}

module.exports = { renderInsets, rectPyramid, dziXml, platesFor };

if (!isMainThread && workerData && workerData.kind === 'atlas-map-insets') {
  runWorker().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else if (require.main === module) {
  main();
}
