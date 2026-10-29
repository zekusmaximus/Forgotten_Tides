#!/usr/bin/env node
/**
 * Browser tests for the atlas map viewer, run in headless Chromium through
 * Playwright: the three lens states, search, deep links, the list view, the
 * public build, and the no-tiles fallback. Each lens state is saved as a
 * screenshot under out/map/screenshots/ for review.
 *
 * Usage: npm run test:map-browser
 * Needs a Chromium for the pinned Playwright version
 * (`npx playwright install chromium`), or PW_CHROMIUM_PATH pointing at one.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { buildMapData } = require('../map/build_data');
const { renderTiles } = require('../map/render_tiles');
const { createMapServer } = require('../serve_map');
const { HOST } = require('../serve_dashboard');

const ROOT = path.join(__dirname, '../..');
const SCREENSHOTS = path.join(ROOT, 'out', 'map', 'screenshots');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS: ${name}`), err => {
      console.error(`FAIL: ${name}`);
      console.error(err.stack || err.message);
      process.exitCode = 1;
    });
}

async function listen(server) {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve); });
  return `http://${HOST}:${server.address().port}/map/`;
}

async function openMap(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.__map && (window.__map.ready || window.__map.error), null, { timeout: 30000 });
  const failure = await page.evaluate(() => window.__map.error || null);
  assert.equal(failure, null, `viewer failed: ${failure}`);
  return { page, errors };
}

const pinHidden = (page, id) => page.$eval(`#pins [data-id="${id}"]`, node => node.hidden);

(async () => {
  const outDir = path.join(ROOT, 'out', `map-browser-test-${process.pid}`);
  const bareDir = path.join(ROOT, 'out', `map-browser-bare-${process.pid}`);
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
  const servers = [];
  let browser;
  try {
    for (const dir of [outDir, bareDir]) {
      fs.mkdirSync(dir, { recursive: true });
      for (const build of ['author', 'public']) {
        fs.writeFileSync(path.join(dir, `atlas.${build}.json`), JSON.stringify(buildMapData({ build })));
      }
    }
    await renderTiles({ size: 1024, tile: 256, out: path.join(outDir, 'tiles'), workers: 2 });
    const authorUrl = await listen(servers[servers.push(createMapServer({ build: 'author', outDir })) - 1]);
    const publicUrl = await listen(servers[servers.push(createMapServer({ build: 'public', outDir })) - 1]);
    const bareUrl = await listen(servers[servers.push(createMapServer({ build: 'author', outDir: bareDir })) - 1]);
    browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});

    await test('the author build opens on every tier, with speculative pins faded', async () => {
      const { page, errors } = await openMap(browser, authorUrl);
      assert.equal(await page.$eval('.lens [aria-checked="true"]', node => node.dataset.lens), 'speculative');
      assert.equal(await pinHidden(page, 'loc-0014'), false, 'Heavonly is visible');
      assert(await page.$eval('#pins [data-id="loc-0014"]', node => node.classList.contains('speculative')), 'Heavonly is faded');
      assert.equal(await page.$eval('#build-badge', node => node.textContent), 'Author build');
      assert.deepEqual(errors, []);
      await page.close();
    });

    await test('each lens shows only its tiers (screenshots saved)', async () => {
      const { page } = await openMap(browser, authorUrl);
      await page.waitForTimeout(1500);
      for (const [lens, heavonlyHidden] of [['primary', true], ['working', true], ['speculative', false]]) {
        await page.click(`.lens [data-lens="${lens}"]`);
        assert.equal(await page.$eval(`.lens [data-lens="${lens}"]`, node => node.getAttribute('aria-checked')), 'true');
        assert.equal(await pinHidden(page, 'loc-0014'), heavonlyHidden, `Heavonly under ${lens}`);
        assert.equal(await pinHidden(page, 'loc-0011'), false, `Tessarine Vault under ${lens}`);
        await page.screenshot({ path: path.join(SCREENSHOTS, `lens-${lens}.png`) });
      }
      await page.close();
    });

    await test('search selects a location, opens its panel, and writes a deep link', async () => {
      const { page } = await openMap(browser, authorUrl);
      await page.fill('#search', 'tess');
      await page.waitForSelector('#results li');
      assert.equal(await page.$eval('#results li span', node => node.textContent), 'Tessarine Vault');
      await page.press('#search', 'Enter');
      assert.equal(await page.$eval('#panel h2', node => node.textContent), 'Tessarine Vault');
      assert.match(await page.evaluate(() => location.hash), /^#loc-0011@/);
      assert.match(await page.$eval('#panel', node => node.textContent), /Memory density 0\.78/);
      await page.close();
    });

    await test('a deep link opens its location, even a speculative one', async () => {
      const { page } = await openMap(browser, `${authorUrl}#loc-0001`);
      assert.equal(await page.$eval('#panel h2', node => node.textContent), 'Heliodrome');
      await page.goto(`${authorUrl}#loc-0010`);
      await page.waitForFunction(() => document.querySelector('#panel h2') && document.querySelector('#panel h2').textContent === 'Solace Hospice');
      await page.close();
    });

    await test('the list view selects what it lists', async () => {
      const { page } = await openMap(browser, authorUrl);
      await page.click('#list-toggle');
      await page.click('#list button[data-id="sleeve-9"]');
      assert.equal(await page.$eval('#panel h2', node => node.textContent), 'Sleeve IX');
      assert.match(await page.$eval('#panel', node => node.textContent), /900 people/);
      await page.close();
    });

    await test('the public build carries no speculative material and disables that lens', async () => {
      const { page } = await openMap(browser, publicUrl);
      assert.equal(await page.$eval('.lens [data-lens="speculative"]', node => node.disabled), true);
      assert.equal(await page.$('#pins [data-id="loc-0014"]'), null, 'no Heavonly pin at all');
      const tiers = await page.evaluate(() => window.__map.state.items.map(item => item.tier));
      assert(!tiers.includes('speculative') && !tiers.includes('draft'));
      assert.equal(await page.$eval('#build-badge', node => node.textContent), 'Public build');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'public-build.png') });
      await page.close();
    });

    await test('without tiles the viewer still draws its overlays and says why', async () => {
      const { page } = await openMap(browser, bareUrl);
      assert.equal(await page.$eval('#notice', node => node.hidden), false);
      assert(await page.evaluate(() => document.body.classList.contains('no-tiles')));
      assert.equal(await pinHidden(page, 'loc-0001'), false);
      await page.close();
    });
  } finally {
    if (browser) await browser.close();
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.rmSync(bareDir, { recursive: true, force: true });
  }
  if (process.exitCode) console.error('\nMap browser tests: failures above');
  else console.log(`\nMap browser tests: all passed (screenshots in ${path.relative(ROOT, SCREENSHOTS)})`);
})();
