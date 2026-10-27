#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HOST = '127.0.0.1';
const PORT = 8080;

// Serve an explicit set of files. The reference map is read on each request so
// the dashboard's Reload Data button reflects a newly generated map.
const ROUTES = new Map([
  ['/dashboard/', { file: path.join(ROOT, 'dashboard', 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/dashboard/index.html', { file: path.join(ROOT, 'dashboard', 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/dashboard/dashboard.js', { file: path.join(ROOT, 'dashboard', 'dashboard.js'), type: 'text/javascript; charset=utf-8' }],
  ['/REFERENCE_MAP.json', { file: path.join(ROOT, 'REFERENCE_MAP.json'), type: 'application/json; charset=utf-8' }]
]);

function safeAsset(root, filePath) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }

  // Resolve the trusted server root once, then reject links at every asset
  // component. A symlinked parent can escape the root even when the file itself
  // is a regular file.
  let current = fs.realpathSync(root);
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) return null;
  }
  return current;
}

function createDashboardServer(options = {}) {
  const root = options.root || ROOT;
  const routes = options.routes || ROUTES;
  return http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Method not allowed');
      return;
    }

    // Compare the raw path. URL parsing would normalize dot segments before
    // checking the allowlist, making traversal-shaped requests look valid.
    const requestedPath = (request.url || '').split('?', 1)[0];
    const route = routes.get(requestedPath);
    if (!route) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    let asset;
    try {
      asset = safeAsset(root, route.file);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error(`Dashboard asset error: ${error.message}`);
    }
    if (!asset) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('File unavailable');
      return;
    }

    fs.stat(asset, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(error && error.code !== 'ENOENT' ? 500 : 404, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('File unavailable');
        return;
      }

      response.writeHead(200, {
        'Content-Type': route.type,
        'Content-Length': stat.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      const stream = fs.createReadStream(asset);
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    });
  });
}

if (require.main === module) {
  createDashboardServer().listen(PORT, HOST, () => {
    console.log(`Continuity Dashboard: http://${HOST}:${PORT}/dashboard/`);
  });
}

module.exports = { createDashboardServer, HOST, ROUTES };
