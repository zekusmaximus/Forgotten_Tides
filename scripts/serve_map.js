#!/usr/bin/env node
/**
 * Serves the atlas map viewer on loopback: the page and its scripts,
 * OpenSeadragon from node_modules, one built data file, and the rendered
 * tiles. Nothing else in the repository is reachable.
 *
 * Usage: node scripts/serve_map.js [--build author|public] [--port 8081]
 * Build the inputs first:
 *   npm run map:data               (and/or: npm run map:data -- --build public)
 *   npm run map:tiles              (optional; add -- --build public for the
 *                                   public tiles; without tiles the viewer
 *                                   draws overlays on a plain background)
 */

const fs = require('fs');
const path = require('path');
const { createDashboardServer, HOST } = require('./serve_dashboard');

const ROOT = path.join(__dirname, '..');
const DEFAULT_PORT = 8081;

function tilesDirName(build) {
  return build === 'public' ? 'tiles-public' : 'tiles';
}
const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8'
};

function createMapServer({ root = ROOT, build = 'author', outDir = path.join(root, 'out', 'map') } = {}) {
  if (!['author', 'public'].includes(build)) throw new Error(`unknown build "${build}"; use author or public`);
  const page = name => path.join(root, 'map', name);
  const routes = new Map([
    ['/map/', { file: page('index.html'), type: TYPES.html }],
    ['/map/index.html', { file: page('index.html'), type: TYPES.html }],
    ['/map/viewer.css', { file: page('viewer.css'), type: TYPES.css }],
    ['/map/viewer_core.js', { file: page('viewer_core.js'), type: TYPES.js }],
    ['/map/viewer.js', { file: page('viewer.js'), type: TYPES.js }],
    ['/map/vendor/openseadragon.min.js', {
      file: path.join(root, 'node_modules', 'openseadragon', 'build', 'openseadragon', 'openseadragon.min.js'),
      type: TYPES.js
    }],
    ['/map/data/atlas.json', { file: path.join(outDir, `atlas.${build}.json`), type: TYPES.json }]
  ]);
  // Each build has its own tiles: the public pyramid is rendered from canon
  // densities only. Tile images may be cached (the viewer versions their URLs
  // with the render manifest); the descriptor and manifest never are.
  const prefixes = [{
    prefix: '/map/tiles/',
    dir: path.join(outDir, tilesDirName(build)),
    types: { '.dzi': 'application/xml; charset=utf-8', '.webp': 'image/webp', '.json': TYPES.json },
    cache: { '.webp': 'public, max-age=86400' }
  }];
  return createDashboardServer({ root, routes, prefixes });
}

function main() {
  const args = process.argv.slice(2);
  const option = name => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : null;
  };
  const build = option('--build') || 'author';
  const port = Number(option('--port') || DEFAULT_PORT);
  const outDir = path.join(ROOT, 'out', 'map');
  if (!fs.existsSync(path.join(outDir, `atlas.${build}.json`))) {
    console.error(`No map data for the ${build} build. Run: npm run map:data${build === 'public' ? ' -- --build public' : ''}`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(outDir, tilesDirName(build), 'galaxy.dzi'))) {
    console.warn(`No rendered tiles for the ${build} build; the viewer will draw overlays on a plain background. Run: npm run map:tiles${build === 'public' ? ' -- --build public' : ''}`);
  }
  createMapServer({ build, outDir }).listen(port, HOST, () => {
    console.log(`Atlas map (${build} build): http://${HOST}:${port}/map/`);
  });
}

module.exports = { createMapServer, tilesDirName, DEFAULT_PORT };

if (require.main === module) {
  main();
}
