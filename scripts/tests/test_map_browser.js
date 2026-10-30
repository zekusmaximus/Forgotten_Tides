#!/usr/bin/env node
/**
 * Browser tests for the atlas map viewer, run in headless Chromium through
 * Playwright: the three lens states, search, deep links, the list view, the
 * public build, and the no-tiles fallback; and for Phase 4, the era
 * control, the continuous zoom from the galaxy into the Tessarine Vault's
 * silo bank, the post-breach view's figures, the inset plates, story runs,
 * event pins, the Z0 scaffold, and the layer toggles.
 *
 * Each lens state gets a structural snapshot derived from the data: every
 * pin's visibility must match its tier under that lens, and speculative pins
 * must render dashed and faded while canon pins render solid. Pixel
 * baselines are deliberately not used, since font and GPU differences across
 * machines make them brittle; screenshots are saved under
 * out/map/screenshots/ for human review instead.
 *
 * Usage: npm run test:map-browser   (MAP_BROWSER_ONLY=<regex> runs a subset)
 * Needs a Chromium for the pinned Playwright version
 * (`npx playwright install chromium`), or PW_CHROMIUM_PATH pointing at one.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { buildMapData } = require('../map/build_data');
const { renderTiles } = require('../map/render_tiles');
const { renderInsets } = require('../map/render_insets');
const sharp = require('sharp');
const { createMapServer } = require('../serve_map');
const { HOST } = require('../serve_dashboard');

const ROOT = path.join(__dirname, '../..');
const SCREENSHOTS = path.join(ROOT, 'out', 'map', 'screenshots');

// MAP_BROWSER_ONLY=<regex> runs only the tests whose names match.
const ONLY = process.env.MAP_BROWSER_ONLY ? new RegExp(process.env.MAP_BROWSER_ONLY) : null;

function test(name, fn) {
  if (ONLY && !ONLY.test(name)) return Promise.resolve();
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

async function openMap(browser, url, { beforeLoad = () => {} } = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  beforeLoad(page);
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
  const staleDir = path.join(ROOT, 'out', `map-browser-stale-${process.pid}`);
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
    await renderTiles({ build: 'public', size: 1024, tile: 256, out: path.join(outDir, 'tiles-public'), workers: 2 });
    await renderInsets({ plate: 1024, universe: 512, tile: 256, out: path.join(outDir, 'insets'), workers: 2 });
    await renderInsets({ build: 'public', plate: 1024, universe: 512, tile: 256, out: path.join(outDir, 'insets-public'), workers: 2 });
    const authorUrl = await listen(servers[servers.push(createMapServer({ build: 'author', outDir })) - 1]);
    const publicUrl = await listen(servers[servers.push(createMapServer({ build: 'public', outDir })) - 1]);
    const bareUrl = await listen(servers[servers.push(createMapServer({ build: 'author', outDir: bareDir })) - 1]);
    // Tiles whose manifest records an older frame than the data's.
    fs.cpSync(outDir, staleDir, { recursive: true });
    const staleManifest = path.join(staleDir, 'tiles', 'galaxy.json');
    fs.writeFileSync(staleManifest, JSON.stringify({ ...JSON.parse(fs.readFileSync(staleManifest, 'utf8')), extent: 1.25 }));
    const staleUrl = await listen(servers[servers.push(createMapServer({ build: 'author', outDir: staleDir })) - 1]);
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

    await test('each lens state matches its structural snapshot (screenshots saved)', async () => {
      // Record tile requests from the first load: a small test render can be
      // fully loaded at the home view, so later panning may request none.
      const tileRequests = [];
      const { page } = await openMap(browser, authorUrl, {
        beforeLoad: tab => tab.on('request', req => { if (req.url().includes('/map/tiles/galaxy_files/')) tileRequests.push(req.url()); })
      });
      await page.waitForTimeout(1500);
      for (const lens of ['primary', 'working', 'speculative']) {
        await page.click(`.lens [data-lens="${lens}"]`);
        assert.equal(await page.$eval(`.lens [data-lens="${lens}"]`, node => node.getAttribute('aria-checked')), 'true');
        const mismatches = await page.evaluate(activeLens => {
          const problems = [];
          for (const pin of window.__map.state.pins) {
            const node = pin.node;
            const shouldShow = window.MapCore.visible(activeLens, pin.item.tier);
            if (node.hidden === shouldShow) problems.push(`${pin.item.id}: hidden=${node.hidden} under ${activeLens}`);
            if (!shouldShow || node.classList.contains('existence-doubtful')) continue;
            const style = getComputedStyle(node);
            const speculative = window.MapCore.lensTier(pin.item.tier) === 'speculative';
            if (speculative && (style.borderTopStyle !== 'dashed' || Number(style.opacity) >= 1)) problems.push(`${pin.item.id}: speculative pin not dashed and faded`);
            if (!speculative && pin.item.kind === 'site' && style.borderTopStyle !== 'solid') problems.push(`${pin.item.id}: canon pin not solid`);
          }
          return problems;
        }, lens);
        assert.deepEqual(mismatches, [], `lens ${lens}`);
        assert.equal(await pinHidden(page, 'loc-0014'), lens !== 'speculative', `Heavonly under ${lens}`);
        await page.screenshot({ path: path.join(SCREENSHOTS, `lens-${lens}.png`) });
      }
      // Every tile URL, from the first load or a later pan, carries the
      // render version.
      await page.evaluate(() => window.__map.select('loc-0011'));
      await page.waitForTimeout(1500);
      assert(tileRequests.length > 0, 'tiles were requested');
      assert(tileRequests.every(url => /\.webp\?v=/.test(url)), `unversioned tile URL: ${tileRequests.find(url => !/\?v=/.test(url))}`);
      await page.close();
    });

    await test('Escape closes search results without dropping the selection', async () => {
      const { page } = await openMap(browser, `${authorUrl}#loc-0011`);
      await page.fill('#search', 'hel');
      await page.waitForSelector('#results li');
      await page.press('#search', 'Escape');
      assert.equal(await page.$eval('#results', node => node.hidden), true);
      assert.equal(await page.$eval('#panel h2', node => node.textContent), 'Tessarine Vault');
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
      assert.match(await page.$eval('#panel', node => node.textContent), /Memory density unmeasured since the Tessarine Breach; last measured 0\.78, before it\./);
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

    await test('the chart carries its furniture, soundings, and isopleth values by zoom', async () => {
      const { page, errors } = await openMap(browser, authorUrl);
      const furniture = await page.$$eval('#world .furniture text', nodes => nodes.map(node => node.textContent));
      assert(furniture.includes('THE KNOWN GALAXY'), 'title cartouche');
      assert(furniture.includes('MEMORY DENSITY (coherence units)'), 'tint key');
      assert(furniture.some(text => text.startsWith('Lanes mark where corridors tend to form')), 'notes say lanes are illustrative');
      const core = await page.$eval('#labels .label.sounding[data-id="loc-0005"]', node => node.textContent);
      assert.equal(core, '0.97', 'the Core prints its sounding');
      const drift = () => page.$eval('#labels .label.sounding[data-id="loc-0008"]', node => node.textContent);
      assert.equal(await drift(), 'unmeasured', 'after the breach a pre-breach sounding reads unmeasured');
      await page.evaluate(() => window.__map.setEra('before'));
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      assert.equal(await drift(), '0.65 · Before the Tessarine Breach', 'before the breach it prints, and says so');
      await page.evaluate(() => window.__map.setEra('after'));
      await page.waitForFunction(() => window.__map.state.eraMix === 1);
      assert.equal(await page.$('#labels .label.sounding[data-id="loc-0006"]'), null, 'the Voids print no sounding: nothing is charted inside');
      const isoHidden = () => page.$$eval('#labels .label.isopleth', nodes => nodes.filter(node => !node.hidden).length);
      assert.equal(await isoHidden(), 0, 'no isopleth values at the overview');
      assert.equal(await page.evaluate(() => window.__map.state.viewer.navigator.element.style.visibility), 'hidden', 'no minimap at the overview');
      await page.evaluate(() => {
        const { viewport } = window.__map.state.viewer;
        viewport.zoomTo(viewport.getHomeZoom() * 3, null, true);
      });
      await page.waitForTimeout(300);
      assert(await isoHidden() > 0, 'isopleth values appear when zoomed in');
      assert.equal(await page.evaluate(() => window.__map.state.viewer.navigator.element.style.visibility), 'visible', 'the minimap appears when zoomed in');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'chart-zoom3.png') });
      assert.deepEqual(errors, []);
      await page.close();
    });

    // ----- Phase 4: depth and time -----

    const view = (page, x, y, zoom) => page.evaluate(([x, y, zoom]) => {
      const { viewport } = window.__map.state.viewer;
      const target = new OpenSeadragon.Point(x, y);
      window.__map.state.viewer.viewport.panTo(target, true);
      window.__map.render();
      viewport.zoomTo(zoom * viewport.getHomeZoom(), null, true);
      viewport.applyConstraints(true);
      window.__map.render();
      return viewport.getZoom(true) / viewport.getHomeZoom();
    }, [x, y, zoom]);
    const settle = page => page.waitForFunction(() => {
      const { world } = window.__map.state.viewer;
      for (let i = 0; i < world.getItemCount(); i++) {
        const item = world.getItemAt(i);
        if (item.getOpacity() > 0 && !item.getFullyLoaded()) return false;
      }
      return true;
    }, null, { timeout: 15000 }).catch(() => {});
    // The viewport point of a plate-unit point on an inset plate.
    const platePoint = (page, key, u, v) => page.evaluate(([key, u, v]) => {
      const { data, extent } = window.__map.state;
      const inset = data.insets.find(entry => entry.key === key);
      const s = inset.rect.width / inset.units[0];
      const [x, y] = [inset.rect.left + u * s, inset.rect.top - v * s];
      return { x: (x + extent) / (2 * extent), y: (extent - y) / (2 * extent) };
    }, [key, u, v]);
    const visibleText = (page, selector) => page.$$eval(selector, nodes => nodes.filter(node => !node.hidden && node.offsetParent !== null).map(node => node.textContent));

    await test('the era control opens after the breach and swaps whole states, never values', async () => {
      const { page, errors } = await openMap(browser, authorUrl);
      assert.equal(await page.$eval('.era [aria-checked="true"]', node => node.dataset.era), 'after');
      const shown = selector => page.$eval(selector, node => node.style.display !== 'none');
      assert.equal(await shown('#world .route[data-route="vault-to-inner-relay"]'), true, "Ren's run shows after the breach");
      assert.equal(await shown('#world .softening[data-sleeve="4"]'), true, 'Sleeve IV softens after the breach');
      assert.equal(await shown('#world .softening[data-sleeve="9"]'), true, 'Sleeve IX softens after the breach');
      assert.equal(await page.$('#world .softening[data-sleeve="5"]'), null, 'no other sleeve softens');
      // Isopleth values in the outer sleeve drop after the breach.
      await view(page, 0.6, 0.55, 3);
      const isoShown = () => page.evaluate(() => window.__map.state.isopleths.filter(entry => !entry.node.hidden).map(entry => entry.iso));
      const ring = iso => { const r = Math.hypot(iso.xy[0], iso.xy[1]); return r >= 0.45 && r <= 0.62; };
      assert(!(await isoShown()).some(ring), 'no outer-sleeve value after the breach');
      await page.click('.era [data-era="before"]');
      // Mid-crossfade, every sounding is one state or the other, whole.
      await page.waitForTimeout(150);
      const mid = await page.$eval('#labels .label.sounding[data-id="loc-0008"]', node => node.textContent);
      assert(['unmeasured', '0.65 · Before the Tessarine Breach'].includes(mid), `a sounding never shows an in-between value (${mid})`);
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      assert.equal(await shown('#world .route[data-route="vault-to-inner-relay"]'), false, 'the two-pull count is not shown before the breach');
      assert.equal(await shown('#world .softening[data-sleeve="4"]'), false);
      assert((await isoShown()).some(ring), 'outer-sleeve values print before the breach');
      assert.match(await page.evaluate(() => location.hash), /~before$/);
      assert.equal(await page.$eval('#labels .label.site[data-id="loc-0011"] .depth', node => node.textContent), '0.78 · Before the Tessarine Breach');
      await page.goto(`${authorUrl}#~before`);
      await page.waitForFunction(() => window.__map && window.__map.ready);
      assert.equal(await page.$eval('.era [aria-checked="true"]', node => node.dataset.era), 'before', 'a deep link restores the era');
      assert.deepEqual(errors, []);
      await page.close();
    });

    await test('zooming from the galaxy into the Vault\'s silo bank is continuous', async () => {
      const tileRequests = [];
      const { page, errors } = await openMap(browser, authorUrl, {
        beforeLoad: tab => tab.on('request', req => { if (req.url().includes('/map/insets/')) tileRequests.push(req.url()); })
      });
      const silo = await platePoint(page, 'tessarine-vault', 500, 380);
      let lastOpacity = 0;
      let reached = 0;
      for (let zoom = 1; zoom <= 600; zoom *= 1.7) {
        reached = await view(page, silo.x, silo.y, zoom);
        await settle(page);
        await page.waitForTimeout(120);
        const opacity = await page.evaluate(() => window.__map.state.plateView.get('tessarine-vault').opacity);
        assert(opacity + 1e-9 >= lastOpacity, `the plate never fades back out on the way in (zoom ${zoom.toFixed(1)})`);
        lastOpacity = opacity;
        // The middle of the view always shows the chart or the plate, never
        // the bare stage behind them.
        const box = await page.$eval('#stage', node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2 - 60, y: r.y + r.height / 2 - 60 }; });
        const shot = await page.screenshot({ clip: { ...box, width: 120, height: 120 } });
        const { channels } = await sharp(shot).stats();
        const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
        assert(mean > 12, `zoom ${zoom.toFixed(1)} shows nothing at the center (mean ${mean.toFixed(1)})`);
      }
      assert(reached > 300, `the zoom reaches the silo bank (stopped at ${reached.toFixed(1)})`);
      assert.equal(lastOpacity, 1, 'the plate is fully in');
      const numerals = await visibleText(page, '#inset-labels .label[data-key="housings"]');
      assert(numerals.length >= 3 && numerals.every(text => /^[IVX]+$/.test(text)), `housing numerals show (${numerals.join(', ')})`);
      assert(tileRequests.length > 0 && tileRequests.filter(url => url.endsWith('.webp') || url.includes('.webp?')).every(url => /\.webp\?v=/.test(url)), 'plate tiles are versioned');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'vault-silo-bank.png') });
      // Away from a plate, the chart stops at its own resolution.
      const free = await view(page, 0.3, 0.3, 600);
      assert(free < 300, `deep zoom is allowed only near a plate (reached ${free.toFixed(1)})`);
      assert.deepEqual(errors, []);
      await page.close();
    });

    await test('the post-breach view shows no invented figure', async () => {
      const { page } = await openMap(browser, authorUrl);
      const data = await page.evaluate(() => window.__map.state.data);
      const canon = new Set([...data.regions, ...data.sites].filter(item => typeof item.memory_density === 'number' && !item.era_sounding).map(item => item.memory_density));
      const isopleths = new Set(data.chart.isopleths.map(iso => Number(iso.label)));
      const checkDecimals = (texts, where) => {
        for (const text of texts) {
          assert(!/\b0\.78\b|\b0\.65\b/.test(text), `${where} shows a pre-breach figure after the breach: "${text}"`);
          for (const match of text.matchAll(/\d+\.\d+/g)) {
            const value = Number(match[0]);
            assert(canon.has(value) || isopleths.has(value), `${where} shows ${match[0]}, which is neither a canon sounding nor an isopleth value: "${text}"`);
          }
        }
      };
      for (const [x, y, zoom] of [[0.5, 0.5, 1], [0.6, 0.55, 3], [0.649, 0.56, 8]]) {
        await view(page, x, y, zoom);
        checkDecimals(await visibleText(page, '#labels .label'), `the chart at zoom ${zoom}`);
      }
      const hall = await platePoint(page, 'tessarine-vault', 500, 1100);
      await view(page, hall.x, hall.y, 200);
      await settle(page);
      const plateTexts = await visibleText(page, '#inset-labels .label');
      assert(plateTexts.some(text => text === 'unmeasured'), 'the plate\'s sounding reads unmeasured');
      checkDecimals(plateTexts, 'the Vault plate');
      assert(!plateTexts.some(text => /\bonly\b/.test(text)), 'the lintel has forgotten its word');
      const lintel = await page.$eval('#inset-labels .label.lintel:not([hidden])', node => ({ text: node.textContent, gap: Boolean(node.querySelector('.lintel-gap')) }));
      assert.equal(lintel.text, 'Spendwhat you can afford. Preserve what must endure.');
      assert(lintel.gap, 'a smooth space stands where the word was');
      assert.equal((await visibleText(page, '#inset-labels .label.lost')).length, 4, 'four booths are lost');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'vault-hall-after.png') });
      await page.evaluate(() => window.__map.setEra('before'));
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      await page.waitForTimeout(100);
      assert.equal((await visibleText(page, '#inset-labels .label.lost')).length, 0, 'no booth is lost before the breach');
      assert((await visibleText(page, '#inset-labels .label.lintel')).includes('Spend only what you can afford. Preserve what must endure.'));
      await page.screenshot({ path: path.join(SCREENSHOTS, 'vault-hall-before.png') });
      await page.close();
    });

    await test('plates crossfade by era, follow the layer toggle, and keep chart overlays off them', async () => {
      const { page } = await openMap(browser, authorUrl);
      const centre = await platePoint(page, 'tessarine-vault', 500, 720);
      await view(page, centre.x, centre.y, 90);
      await settle(page);
      const opacities = () => page.evaluate(() => Object.fromEntries(window.__map.state.plates.map(plate => [`${plate.key}-${plate.era}`, plate.item ? plate.item.getOpacity() : null])));
      let now = await opacities();
      assert(now['tessarine-vault-after'] > 0.99 && now['tessarine-vault-before'] < 0.01, JSON.stringify(now));
      await page.evaluate(() => window.__map.setEra('before'));
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      await page.evaluate(() => window.__map.render());
      now = await opacities();
      assert(now['tessarine-vault-before'] > 0.99 && now['tessarine-vault-after'] < 0.01, JSON.stringify(now));
      assert.equal(await page.$eval('#pins [data-id="loc-0011"]', node => node.hidden), true, 'the site pin hides under its plate');
      await page.click('#layers-toggle');
      await page.uncheck('#layer-list input[data-layer="insets"]');
      now = await opacities();
      assert(Object.values(now).every(value => value === 0), 'the insets layer hides every plate');
      assert.equal((await visibleText(page, '#inset-labels .label')).length, 0);
      await page.check('#layer-list input[data-layer="insets"]');
      await page.close();
    });

    await test('story runs: labeled in pulls, straight, unticked, and the intended one dashed and arrowed', async () => {
      const { page } = await openMap(browser, authorUrl);
      const runs = await page.evaluate(() => [...document.querySelectorAll('#world [data-route]')].map(node => ({ key: node.dataset.route, cls: node.getAttribute('class'), points: (node.getAttribute('points') || '').trim().split(/\s+/).length, marker: node.getAttribute('marker-end') })));
      const wake = runs.filter(run => run.key === 'archivists-wake-approach');
      assert.equal(wake.length, 1, 'one line per run: no tick marks');
      assert.equal(wake[0].points, 2, 'a straight leg');
      assert(!/intended/.test(wake[0].cls) && /open-tail/.test(wake[0].cls), 'a completed run with no origin mark');
      const relay = runs.filter(run => run.key === 'vault-to-inner-relay');
      assert.equal(relay.length, 2, 'the intended run and its arrowhead');
      assert(relay.some(run => /\broute\b.*intended/.test(run.cls)) && relay.some(run => /run-arrow/.test(run.cls) && run.points === 3));
      assert(runs.every(run => !run.marker), 'no SVG markers');
      await view(page, 0.68, 0.45, 2.5);
      const labels = await visibleText(page, '#labels .label.route');
      assert(labels.includes('3 pulls') && labels.includes('2 pulls'), labels.join(', '));
      await page.evaluate(() => window.__map.setEra('before'));
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      const before = await visibleText(page, '#labels .label.route');
      assert(before.includes('3 pulls') && !before.includes('2 pulls'), 'only the Wake shows before the breach');
      await page.click('#layers-toggle');
      await page.uncheck('#layer-list input[data-layer="routes"]');
      assert((await page.$$eval('#world [data-route]', nodes => nodes.filter(node => node.style.display !== 'none').length)) === 0, 'the routes layer hides every run');
      await page.close();
    });

    await test('event pins: a glyph at the site, a marker per room in the plate, breach events after it only', async () => {
      const { page } = await openMap(browser, authorUrl);
      const vault = await platePoint(page, 'tessarine-vault', 500, 720);
      await view(page, vault.x, vault.y, 6);
      const markerShown = key => page.$eval(`#pins [data-marker="${key}"]`, node => !node.hidden).catch(() => false);
      assert.equal(await markerShown('site:loc-0011'), true, 'one glyph beside the Vault at region zoom');
      assert.equal(await page.$eval('#pins [data-marker="site:loc-0011"]', node => /\d/.test(node.textContent)), false, 'the glyph carries no count');
      await page.click('#pins [data-marker="site:loc-0011"]');
      const listed = () => page.$$eval('#panel .event-list li', nodes => nodes.map(node => node.textContent));
      const after = await listed();
      assert(after.some(text => /four of sixteen audit booths/.test(text)), 'the breach events are listed after it');
      await view(page, vault.x, vault.y, 120);
      await settle(page);
      for (const room of ['audit-hall', 'silo-bank', 'lower-dock']) assert.equal(await markerShown(`room:tessarine-vault:${room}`), true, `a marker in the ${room}`);
      assert.equal(await markerShown('site:loc-0011'), false, 'the site glyph gives way to the room markers');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'vault-plate-markers.png') });
      await page.evaluate(() => window.__map.setEra('before'));
      await page.waitForFunction(() => window.__map.state.eraMix === 0);
      await page.evaluate(() => window.__map.render());
      assert.equal(await markerShown('room:tessarine-vault:audit-hall'), true, "story-0008's audit is history in both eras");
      assert.equal(await markerShown('room:tessarine-vault:silo-bank'), false, 'nothing has happened in the silo bank before the breach');
      // The Wake's Gap passage sits on its run.
      await view(page, 0.69, 0.35, 4);
      assert.equal(await markerShown('route:event-0004'), true);
      await page.click('#pins [data-marker="route:event-0004"]');
      assert.match(await page.$eval('#panel', node => node.textContent), /Lattice Gap passage/);
      await page.close();
    });

    await test('Z0: the scaffold below the home view, with the chart\'s title and nothing else', async () => {
      const { page } = await openMap(browser, authorUrl);
      const reached = await view(page, 0.5, 0.5, 0.05);
      assert(reached < 0.45, `zooming out reaches Z0 (${reached.toFixed(2)})`);
      await page.evaluate(() => window.__map.render());
      const universe = await page.$eval('#universe', node => ({ hidden: node.hidden, opacity: Number(node.style.opacity), complete: node.complete && node.naturalWidth > 0 }));
      assert(!universe.hidden && universe.opacity > 0.5 && universe.complete, JSON.stringify(universe));
      assert.deepEqual(await visibleText(page, '#labels .label'), ['The Known Galaxy'], 'only the chart title labels Z0');
      assert.equal((await page.$$eval('#pins .pin', nodes => nodes.filter(node => !node.hidden).length)), 0, 'no pins at Z0');
      assert(Number(await page.$eval('#world .furniture', node => node.style.opacity)) < 0.5, 'the margin furniture fades');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'z0-universe.png') });
      await page.click('#layers-toggle');
      await page.uncheck('#layer-list input[data-layer="universe"]');
      assert.equal(await page.$eval('#universe', node => node.hidden), true, 'the scaffold layer toggles off');
      await page.close();
    });

    await test('the public build carries no speculative material and disables that lens', async () => {
      const { page } = await openMap(browser, publicUrl);
      assert.equal(await page.$eval('.lens [data-lens="speculative"]', node => node.disabled), true);
      assert.equal(await page.$('#pins [data-id="loc-0014"]'), null, 'no Heavonly pin at all');
      const tiers = await page.evaluate(() => window.__map.state.items.map(item => item.tier));
      assert(!tiers.includes('speculative') && !tiers.includes('draft'));
      assert.equal(await page.$eval('#build-badge', node => node.textContent), 'Public build');
      assert.equal(await page.evaluate(() => document.body.classList.contains('no-tiles')), false, 'public tiles are served');
      assert.equal(await page.$eval('.era [aria-checked="true"]', node => node.dataset.era), 'after', 'the era control is public too');
      const plates = await page.evaluate(() => window.__map.state.plates.map(plate => `${plate.key}-${plate.era}`));
      assert.deepEqual(plates.sort(), ['heliodrome-both', 'tessarine-vault-after', 'tessarine-vault-before'], 'both canon plates are public');
      const insetTiers = await page.evaluate(() => window.__map.state.data.insets.flatMap(inset => Object.values(inset.layers).flatMap(layer => layer.labels.map(label => label.tier))));
      assert(!insetTiers.includes('draft') && !insetTiers.includes('speculative'), 'no draft inset material in the public data');
      await page.screenshot({ path: path.join(SCREENSHOTS, 'public-build.png') });
      await page.close();
    });

    await test('tiles from an older frame keep the overlays registered and say so', async () => {
      const { page } = await openMap(browser, staleUrl);
      assert.equal(await page.evaluate(() => window.__map.state.extent), 1.25, 'overlays map with the tiles\' extent');
      assert.match(await page.$eval('#notice', node => node.textContent), /older chart frame/);
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
    fs.rmSync(staleDir, { recursive: true, force: true });
  }
  if (process.exitCode) console.error('\nMap browser tests: failures above');
  else console.log(`\nMap browser tests: all passed (screenshots in ${path.relative(ROOT, SCREENSHOTS)})`);
})();
