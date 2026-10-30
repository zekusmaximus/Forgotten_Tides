#!/usr/bin/env node
/**
 * Renders one window of the atlas map's chart to a PNG: a style frame for
 * review, or a print raster. The pixels come from the same painter as the
 * deep-zoom tiles, so a frame shows exactly what the tiles will.
 *
 * Usage: node scripts/map/render_frame.js --center x,y --span s
 *          [--width 1600] [--height <width>] [--build author|public]
 *          [--out out/map/frames/frame.png] [--root <dir>]
 * `--center` and `--span` are in chart units (1.0 = the Black Horizon's near
 * edge; the whole chart is --center 0,0 --span 2.5). `--span` is the width.
 */

const fs = require('fs');
const path = require('path');
const layout = require('./layout');
const { createPainter } = require('./painter');

// Paints in strips so large frames never hold more than one strip of floats.
async function renderFrame({ root = layout.DEFAULT_ROOT, build = 'author', center = [0, 0], span = 2 * layout.IMAGE_EXTENT, width = 1600, height = width, out, painter = null }) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) throw new Error('width and height must be positive integers');
  if (!(span > 0)) throw new Error('span must be positive');
  if (!Array.isArray(center) || center.length !== 2 || !center.every(Number.isFinite)) throw new Error('center must be two numbers, x,y');
  const sharp = require('sharp');
  const chart = painter || createPainter(root, { build });
  const px = span / width;
  const x0 = center[0] - span / 2 + px / 2;
  const top = center[1] + (height * px) / 2 - px / 2;
  const buffer = Buffer.alloc(width * height * 3);
  const strip = 256;
  for (let row = 0; row < height; row += strip) {
    const h = Math.min(strip, height - row);
    chart.paintWindow(x0, top - row * px, px, width, h).copy(buffer, row * width * 3);
  }
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(buffer, { raw: { width, height, channels: 3 } }).png().toFile(out);
  }
  return { buffer, width, height, px };
}

function main() {
  const args = process.argv.slice(2);
  const option = name => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const pair = text => text.split(',').map(Number);
  const root = option('--root') ? path.resolve(option('--root')) : layout.DEFAULT_ROOT;
  const width = option('--width') ? Number(option('--width')) : 1600;
  const settings = {
    root,
    build: option('--build') || 'author',
    center: option('--center') ? pair(option('--center')) : [0, 0],
    span: option('--span') ? Number(option('--span')) : 2 * layout.IMAGE_EXTENT,
    width,
    height: option('--height') ? Number(option('--height')) : width,
    out: path.resolve(option('--out') || path.join(root, 'out', 'map', 'frames', 'frame.png'))
  };
  const started = Date.now();
  renderFrame(settings).then(
    () => console.log(`Wrote ${path.relative(process.cwd(), settings.out)} (${settings.width}x${settings.height}) in ${((Date.now() - started) / 1000).toFixed(1)} s.`),
    err => {
      console.error(`Frame render failed: ${err.message}`);
      process.exit(1);
    }
  );
}

module.exports = { renderFrame };

if (require.main === module) main();
