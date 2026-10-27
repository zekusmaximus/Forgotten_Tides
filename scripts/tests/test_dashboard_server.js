#!/usr/bin/env node

const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { createDashboardServer, HOST, ROUTES } = require('../serve_dashboard');

function request(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = http.request({ hostname: HOST, port, path: pathname, method }, (response) => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    client.on('error', reject);
    client.end();
  });
}

async function main() {
  assert.deepEqual([...ROUTES.keys()], [
    '/dashboard/', '/dashboard/index.html', '/dashboard/dashboard.js', '/REFERENCE_MAP.json'
  ]);

  const server = createDashboardServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, HOST, resolve);
  });

  try {
    const { address, port } = server.address();
    assert.equal(address, HOST, 'server must bind only to loopback');

    for (const pathname of ['/dashboard/', '/dashboard/index.html', '/dashboard/dashboard.js', '/REFERENCE_MAP.json']) {
      const result = await request(port, pathname);
      assert.equal(result.status, 200, `${pathname} should be served`);
      assert(result.body.length > 0, `${pathname} should contain data`);
      assert.equal(result.headers['cache-control'], 'no-store');
      assert.equal(result.headers['x-content-type-options'], 'nosniff');
    }

    const map = JSON.parse((await request(port, '/REFERENCE_MAP.json')).body);
    assert(Array.isArray(map.nodes));
    assert(Array.isArray(map.edges));

    for (const pathname of [
      '/', '/dashboard', '/dashboard/README.md', '/package.json', '/.git/config',
      '/stories/README.md', '/dashboard/../package.json', '/dashboard/%2e%2e/package.json',
      '/dashboard/%2e%2e/%2e%2e/.git/config'
    ]) {
      assert.equal((await request(port, pathname)).status, 404, `${pathname} must be denied`);
    }

    const head = await request(port, '/dashboard/', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.equal((await request(port, '/dashboard/', 'POST')).status, 405);

    console.log('Dashboard server allows only its assets on loopback.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-server-test-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-server-outside-'));
  const dashboardDir = path.join(root, 'dashboard');
  const assetPath = path.join(dashboardDir, 'index.html');
  const secretPath = path.join(outside, 'secret.html');
  fs.mkdirSync(dashboardDir);
  fs.writeFileSync(assetPath, 'Fixture dashboard');
  fs.writeFileSync(secretPath, 'OUTSIDE SECRET');
  fs.writeFileSync(path.join(outside, 'index.html'), 'OUTSIDE SECRET');
  const fixtureServer = createDashboardServer({
    root,
    routes: new Map([['/dashboard/', { file: assetPath, type: 'text/html; charset=utf-8' }]])
  });
  try {
    await new Promise((resolve, reject) => {
      fixtureServer.once('error', reject);
      fixtureServer.listen(0, HOST, resolve);
    });
    const port = fixtureServer.address().port;
    assert.equal((await request(port, '/dashboard/')).status, 200);

    fs.unlinkSync(assetPath);
    try {
      fs.symlinkSync(secretPath, assetPath, 'file');
      const linkedFile = await request(port, '/dashboard/');
      assert.equal(linkedFile.status, 404, 'symlinked asset must be denied');
      assert(!linkedFile.body.includes('OUTSIDE SECRET'));
      fs.unlinkSync(assetPath);
    } catch (error) {
      if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
      console.log('SKIP: file symlinks are unavailable on this platform');
    }

    fs.rmdirSync(dashboardDir);
    try {
      fs.symlinkSync(outside, dashboardDir, 'junction');
      const linkedParent = await request(port, '/dashboard/');
      assert.equal(linkedParent.status, 404, 'symlinked asset parent must be denied');
      assert(!linkedParent.body.includes('OUTSIDE SECRET'));
    } catch (error) {
      if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
      console.log('SKIP: directory junctions are unavailable on this platform');
    }
  } finally {
    await new Promise(resolve => fixtureServer.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
