#!/usr/bin/env node
/**
 * Renders one window of the atlas map's chart to a PNG: a style frame for
 * review, or a print raster. The pixels come from the same painter as the
 * deep-zoom tiles, so a frame shows exactly what the tiles will.
 *
 * Usage: node scripts/map/render_frame.js --center x,y --span s
 *          [--width 1600] [--height <width>] [--build author|public]
 *          [--inset <key> [--era before|after|both]] [--universe]
 *          [--out out/map/frames/frame.png] [--root <dir>]
 * `--center` and `--span` are in chart units (1.0 = the Black Horizon's near
 * edge; the whole chart is --center 0,0 --span 2.5). `--span` is the width.
 * `--inset` paints a Z3 plate instead (scripts/map/inset_painter.js); its
 * center and span default to the whole plate, and its height to the plate's
 * shape. `--universe` paints the Z0 scaffold (scripts/map/universe.js), with
 * its clear center, as an RGBA PNG.
 */

const fs = require('fs');
const path = require('path');
const layout = require('./layout');
const { createPainter } = require('./painter');
const { createInsetPainter } = require('./inset_painter');
const { createUniversePainter } = require('./universe');

// Paints in strips so large frames never hold more than one strip of floats.
async function renderFrame({ root = layout.DEFAULT_ROOT, build = 'author', center = [0, 0], span = 2 * layout.IMAGE_EXTENT, width = 1600, height = width, out, painter = null }) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) throw new Error('width and height must be positive integers');
  if (!(span > 0)) throw new Error('span must be positive');
  if (!Array.isArray(center) || center.length !== 2 || !center.every(Number.isFinite)) throw new Error('center must be two numbers, x,y');
  const sharp = require('sharp');
  const chart = painter || createPainter(root, { build });
  const channels = chart.channels || 3;
  const px = span / width;
  const x0 = center[0] - span / 2 + px / 2;
  const top = center[1] + (height * px) / 2 - px / 2;
  const buffer = Buffer.alloc(width * height * channels);
  const strip = 256;
  for (let row = 0; row < height; row += strip) {
    const h = Math.min(strip, height - row);
    chart.paintWindow(x0, top - row * px, px, width, h).copy(buffer, row * width * channels);
  }
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(buffer, { raw: { width, height, channels } }).png().toFile(out);
  }
  return { buffer, width, height, px, channels };
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
  const build = option('--build') || 'author';
  let painter = null;
  let center = [0, 0];
  let span = 2 * layout.IMAGE_EXTENT;
  let height = width;
  if (option('--inset')) {
    painter = createInsetPainter(root, { build, inset: option('--inset'), era: option('--era') || 'after' });
    const { rect } = painter.frame;
    center = [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2];
    span = rect.width;
    height = Math.round((width * rect.height) / rect.width);
  } else if (args.includes('--universe')) {
    painter = { ...createUniversePainter(root, { build }), channels: 4 };
    span = 2 * painter.spec.extent;
  }
  const settings = {
    root,
    build,
    painter,
    center: option('--center') ? pair(option('--center')) : center,
    span: option('--span') ? Number(option('--span')) : span,
    width,
    height: option('--height') ? Number(option('--height')) : height,
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
