#!/usr/bin/env node
/**
 * Smoke tests for the atlas map tile renderer (scripts/map/render_tiles.js):
 * a small render of the real chart, checked for pyramid shape, determinism,
 * and colors that follow the canon density field.
 */
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

// libvips caches open input files; on Windows an open file cannot be
// deleted, so read tiles into memory and keep the cache off.
sharp.cache(false);
const readTile = file => sharp(fs.readFileSync(file));
const removeDir = dir => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

const { renderTiles, pyramid } = require('../map/render_tiles');
const layout = require('../map/layout');
const { toXY } = require('../map/geometry');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS: ${name}`), err => {
      console.error(`FAIL: ${name}`);
      console.error(err.stack || err.message);
      process.exitCode = 1;
    });
}

async function pixelAt(dir, size, xy) {
  // Read from the full-resolution level of a small render.
  const levels = pyramid(size, 256);
  const top = levels[levels.length - 1];
  const extent = layout.IMAGE_EXTENT;
  const u = Math.floor(((xy[0] + extent) / (2 * extent)) * top.dim);
  const v = Math.floor(((extent - xy[1]) / (2 * extent)) * top.dim);
  const file = path.join(dir, 'galaxy_files', String(top.level), `${Math.floor(u / 256)}_${Math.floor(v / 256)}.webp`);
  const { data, info } = await readTile(file).raw().toBuffer({ resolveWithObject: true });
  const k = ((v % 256) * info.width + (u % 256)) * info.channels;
  return [data[k], data[k + 1], data[k + 2]];
}

(async () => {
  const first = fs.mkdtempSync(path.join(os.tmpdir(), 'map-render-a-'));
  const second = fs.mkdtempSync(path.join(os.tmpdir(), 'map-render-b-'));
  const third = fs.mkdtempSync(path.join(os.tmpdir(), 'map-render-public-'));
  try {
    await test('the pyramid has one level per halving and the right tile counts', () => {
      const levels = pyramid(1000, 256);
      assert.equal(levels.length, 11);
      assert.deepEqual(levels[10], { level: 10, scale: 1, dim: 1000, cols: 4, rows: 4 });
      assert.deepEqual(levels[9], { level: 9, scale: 2, dim: 500, cols: 2, rows: 2 });
      assert.equal(levels[0].dim, 1);
    });

    let manifest;
    await test('a small render writes a DZI descriptor and every tile', async () => {
      manifest = await renderTiles({ size: 1024, tile: 256, out: first, workers: 2 });
      assert.equal(manifest.levels, 11);
      assert.equal(manifest.tiles, 16 + 4 + 9);
      const dzi = fs.readFileSync(path.join(first, 'galaxy.dzi'), 'utf8');
      assert.match(dzi, /TileSize="256"/);
      assert.match(dzi, /<Size Width="1024" Height="1024"\/>/);
      const meta = await readTile(path.join(first, 'galaxy_files', '10', '3_3.webp')).metadata();
      assert.deepEqual([meta.width, meta.height], [256, 256]);
      assert(!fs.existsSync(path.join(first, 'galaxy_files.partial')), 'staging directory removed');
    });

    await test('the same inputs render byte-identical tiles', async () => {
      await renderTiles({ size: 1024, tile: 256, out: second, workers: 1 });
      for (const rel of ['10/0_0.webp', '10/2_1.webp', '9/1_1.webp', '0/0_0.webp']) {
        const a = fs.readFileSync(path.join(first, 'galaxy_files', rel));
        const b = fs.readFileSync(path.join(second, 'galaxy_files', rel));
        assert(a.equals(b), `${rel} differs between renders`);
      }
    });

    await test('colors follow the canon density field', async () => {
      const { cartography } = layout.loadMapContext();
      const core = await pixelAt(first, 1024, [0, 0]);
      const voids = cartography.regions.find(region => region.treatment === 'void');
      const hole = voids.shape.items.reduce((a, b) => (a.radius > b.radius ? a : b));
      const empty = await pixelAt(first, 1024, toXY(hole.r, hole.theta));
      assert(core[0] > 200, `the Core should be bright, got ${core}`);
      assert(Math.max(...empty) < 20, `a Void center should be near black, got ${empty}`);
    });
    await test('the public build carries no speculative density', async () => {
      await renderTiles({ build: 'public', size: 1024, tile: 256, out: third, workers: 2 });
      const { cartography, atlas } = layout.loadMapContext();
      const speculative = cartography.sites.find(site => atlas.get(site.id).tier === 'speculative' && atlas.get(site.id).memory_density !== null && site.relation === 'boundary');
      const point = toXY(speculative.at.r, speculative.at.theta);
      assert.notDeepEqual(await pixelAt(first, 1024, point), await pixelAt(third, 1024, point), `${speculative.id} shapes only the author image`);
      assert.deepEqual(await pixelAt(first, 1024, [0, 0]), await pixelAt(third, 1024, [0, 0]), 'canon areas render the same in both builds');
    });

    await test('bad settings fail before anything on disk changes', async () => {
      for (const settings of [{ workers: 0 }, { workers: Number.NaN }, { quality: 0 }, { size: 100 }, { build: 'draft' }]) {
        await assert.rejects(() => renderTiles({ size: 512, out: first, ...settings }));
      }
      assert(fs.existsSync(path.join(first, 'galaxy_files', '10', '0_0.webp')), 'the earlier render is untouched');
    });
  } finally {
    for (const dir of [first, second, third]) removeDir(dir);
  }
  if (process.exitCode) console.error('\nMap render tests: failures above');
  else console.log('\nMap render tests: all passed');
})();
