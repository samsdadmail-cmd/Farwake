// Headless FARWAKE performance runner.
// Serves the repo only on http://127.0.0.1:47321 and opens the built game inside
// a fresh browser profile. It does not touch any other origin.
//
// Headless Chromium with iPhone 14 emulation is only a proxy for iPhone Safari.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright-core';

const PORT = 47321;
const CHECK_PORT = 47322;
const SAVE_KEY = 'farwake_founders_alpha03_v1';
const MARKER_KEY = 'farwake_perf_harness';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = path.join(ROOT, 'perf', 'results');
const SAMPLING_INTERVAL = 32768;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

function parseArgs(argv) {
  const out = {
    repeat: 3,
    seconds: 5,
    warmup: 1500,
    suite: 'default',
    scene: '',
    fixture: '',
    ops: false,
    checkOnly: false,
    help: false
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value == null) throw new Error('Missing value for ' + arg);
      return value;
    };
    if (arg === '--repeat') out.repeat = Number(next());
    else if (arg === '--seconds') out.seconds = Number(next());
    else if (arg === '--warmup') out.warmup = Number(next());
    else if (arg === '--suite') out.suite = next();
    else if (arg === '--scene') out.scene = next();
    else if (arg === '--fixture') out.fixture = next();
    else if (arg === '--ops') out.ops = true;
    else if (arg === '--check-only') out.checkOnly = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error('Unknown argument ' + arg);
  }
  if (!Number.isFinite(out.repeat) || out.repeat < 1 || out.repeat > 20) throw new Error('--repeat must be 1..20');
  if (!Number.isFinite(out.seconds) || out.seconds < 1 || out.seconds > 60) throw new Error('--seconds must be 1..60');
  if (!Number.isFinite(out.warmup) || out.warmup < 0 || out.warmup > 15000) throw new Error('--warmup must be 0..15000');
  return out;
}

function help() {
  return `FARWAKE performance harness

  node perf/run-headless.mjs [--suite default|audit|all] [--scene id]
                             [--repeat 3] [--seconds 5] [--warmup 1500]
                             [--ops] [--fixture file.json] [--check-only]

Serves ONLY http://127.0.0.1:${PORT} and uses a fresh browser profile per
measurement. The game save key is ${SAVE_KEY}. Do not point this at any
other origin.

Headless Chromium iPhone 14 emulation (390×844, DPR 3, 4× CPU throttle)
is only a proxy for iPhone Safari.`;
}

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function serve(root, port) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = path.normalize(path.join(root, pathname));
      const rel = path.relative(root, file);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const body = await readFile(file);
      const type = MIME[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Content-Length': body.length });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function iphoneContextOptions() {
  const iphone = devices['iPhone 14'];
  if (!iphone) throw new Error('playwright-core has no iPhone 14 device descriptor');
  if (iphone.deviceScaleFactor !== 3 || !iphone.isMobile || !iphone.hasTouch) {
    throw new Error('iPhone 14 descriptor is missing DPR 3, mobile, or touch');
  }
  if (!/iPhone/.test(iphone.userAgent) || !/Safari/.test(iphone.userAgent)) {
    throw new Error('iPhone 14 user agent is not an iPhone Safari UA');
  }
  // Playwright's preset viewport is 390×664 because it subtracts Safari toolbars.
  // The task and the render audit measure the full 390×844 screen (the page
  // itself then spends the rest on FARWAKE's header and nav).
  return {
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: iphone.userAgent,
    reducedMotion: 'no-preference'
  };
}

async function launchBrowser() {
  const args = ['--enable-precise-memory-info', '--disable-dev-shm-usage'];
  try {
    return await chromium.launch({ headless: true, channel: 'chrome', args });
  } catch (error) {
    console.warn('Installed Chrome channel failed (' + error.message + '). Retrying with --no-sandbox.');
    return chromium.launch({ headless: true, channel: 'chrome', args: args.concat(['--no-sandbox']) });
  }
}

function harnessUrl(port, query) {
  const url = new URL('http://127.0.0.1:' + port + '/perf/harness.html');
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function resourceNames(page) {
  return page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
}

async function checkInert(browser) {
  const context = await browser.newContext(iphoneContextOptions());
  const page = await context.newPage();
  try {
    await page.goto(harnessUrl(PORT, {}), { waitUntil: 'domcontentloaded' });
    const text = await page.locator('body').innerText();
    const storage = await page.evaluate(saveKey => ({
      length: localStorage.length,
      save: localStorage.getItem(saveKey)
    }), SAVE_KEY);
    const names = await resourceNames(page);
    const loadedGame = names.some(name => name.endsWith('/index.html'));
    const iframe = await page.locator('iframe').count();
    const ok = /Recording is off/.test(text) && storage.length === 0 && storage.save == null && !loadedGame && iframe === 0;
    return { name: 'without ?perf=1 writes nothing and does not load the game', ok, detail: ok ? 'inert' : text.slice(0, 240) };
  } finally {
    await context.close();
  }
}

async function checkWrongPort(browser) {
  const context = await browser.newContext(iphoneContextOptions());
  const page = await context.newPage();
  try {
    await page.goto(harnessUrl(CHECK_PORT, { perf: '1', scene: 'day2', seconds: '2' }), { waitUntil: 'domcontentloaded' });
    const text = await page.locator('body').innerText();
    const storage = await page.evaluate(saveKey => localStorage.getItem(saveKey), SAVE_KEY);
    const names = await resourceNames(page);
    const loadedGame = names.some(name => name.endsWith('/index.html'));
    const ok = /Harness refused to start/.test(text) && /47321/.test(text) && storage == null && !loadedGame;
    return { name: 'wrong port is refused before the game loads', ok, detail: ok ? 'refused ' + CHECK_PORT : text.slice(0, 240) };
  } finally {
    await context.close();
  }
}

async function checkForeignSave(browser) {
  const playerSave = '{"v":3,"seed":"PLAYER-DO-NOT-TOUCH","sentinel":true}';
  const context = await browser.newContext(iphoneContextOptions());
  await context.addInitScript(({ saveKey, markerKey, playerSave }) => {
    localStorage.setItem(saveKey, playerSave);
    localStorage.removeItem(markerKey);
  }, { saveKey: SAVE_KEY, markerKey: MARKER_KEY, playerSave });
  const page = await context.newPage();
  try {
    await page.goto(harnessUrl(PORT, { perf: '1', scene: 'day2', seconds: '2' }), { waitUntil: 'domcontentloaded' });
    const text = await page.locator('body').innerText();
    const stored = await page.evaluate(({ saveKey, markerKey }) => ({
      save: localStorage.getItem(saveKey),
      marker: localStorage.getItem(markerKey)
    }), { saveKey: SAVE_KEY, markerKey: MARKER_KEY });
    const names = await resourceNames(page);
    const loadedGame = names.some(name => name.endsWith('/index.html'));
    const ok = /Harness refused to start/.test(text) && stored.save === playerSave && stored.marker == null && !loadedGame;
    return { name: 'a non-harness save is left untouched', ok, detail: ok ? 'foreign save preserved' : text.slice(0, 240) };
  } finally {
    await context.close();
  }
}

function walkSelfSize(node) {
  let total = 0;
  const stack = [node];
  const seen = new Set();
  while (stack.length) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    total += current.selfSize || 0;
    const children = current.children || [];
    for (let i = 0; i < children.length; i++) stack.push(children[i]);
  }
  return total;
}

function allocationFromProfile(profile) {
  const samples = profile && profile.samples || [];
  let sampledBytes = 0;
  for (const sample of samples) sampledBytes += sample.size || 0;
  return {
    supported: true,
    method: 'CDP HeapProfiler sampling',
    samplingInterval: SAMPLING_INTERVAL,
    sampleCount: samples.length,
    sampledBytes,
    selfSizeBytes: walkSelfSize(profile && profile.head),
    estimatedBytes: samples.length * SAMPLING_INTERVAL,
    note: 'estimatedBytes is sampleCount × sampling interval, the usual scaling when each sample represents one interval of allocated bytes. Chromium only. Includes allocator overhead from the sampler itself.'
  };
}

async function startSampling(session) {
  await session.send('HeapProfiler.enable');
  const full = {
    samplingInterval: SAMPLING_INTERVAL,
    includeObjectsCollectedByMajorGC: true,
    includeObjectsCollectedByMinorGC: true
  };
  try {
    await session.send('HeapProfiler.startSampling', full);
    return full;
  } catch {
    await session.send('HeapProfiler.startSampling', { samplingInterval: SAMPLING_INTERVAL });
    return { samplingInterval: SAMPLING_INTERVAL };
  }
}

async function runScene(browser, commit, sceneId, options) {
  const context = await browser.newContext(iphoneContextOptions());
  await context.addInitScript(() => { window.__PERF_EXTERNAL__ = true; });
  const page = await context.newPage();
  const started = Date.now();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() === 404) errors.push('404 ' + response.url());
  });
  let session;
  try {
    session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const query = {
      perf: '1',
      scene: sceneId,
      seconds: options.seconds,
      warmup: options.warmup,
      commit
    };
    if (options.ops) query.ops = '1';
    if (options.fixture) query.fixture = options.fixture;
    await page.goto(harnessUrl(PORT, query), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__PERF_READY__ === true || window.__PERF_REPORT__, null, { timeout: 90000 });
    const early = await page.evaluate(() => window.__PERF_REPORT__ || null);
    if (early) {
      return { scene: sceneId, ok: false, error: early.error || 'failed before recording', pageErrors: errors, wallMs: Date.now() - started };
    }
    let sampling = null;
    let samplingError = null;
    try { sampling = await startSampling(session); }
    catch (error) { samplingError = String(error && error.message || error); }
    await page.evaluate(() => { window.__PERF_START_RECORDING__ = true; });
    const timeout = (options.seconds + options.warmup / 1000) * 1000 + 60000;
    await page.waitForFunction(() => window.__PERF_REPORT__, null, { timeout });
    let allocation = { supported: false, error: samplingError };
    if (sampling) {
      try {
        const stopped = await session.send('HeapProfiler.stopSampling');
        allocation = allocationFromProfile(stopped.profile);
        allocation.parameters = sampling;
      } catch (error) {
        allocation = { supported: false, error: String(error && error.message || error) };
      }
    }
    const report = await page.evaluate(() => window.__PERF_REPORT__);
    const frames = report && report.recording && report.recording.frame;
    const ok = !!(report && frames && frames.count > 0 && !report.error);
    return {
      scene: sceneId,
      ok,
      error: ok ? null : (report && report.error) || 'no frames recorded',
      pageErrors: errors.slice(0, 8),
      wallMs: Date.now() - started,
      report,
      allocation
    };
  } catch (error) {
    return { scene: sceneId, ok: false, error: String(error && error.stack || error), pageErrors: errors.slice(0, 8), wallMs: Date.now() - started };
  } finally {
    await Promise.race([
      context.close(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
  }
}

function ms(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return (Math.round(value * 10) / 10).toFixed(1);
}

function sceneRows(result) {
  const meta = result.report && result.report.meta;
  const frame = result.report && result.report.recording && result.report.recording.frame;
  const interval = result.report && result.report.recording && result.report.recording.interval;
  const longs = result.report && result.report.recording && result.report.recording.longFrames;
  const heap = result.report && result.report.recording && result.report.recording.heap;
  const canvas = meta && meta.canvas;
  const frames = frame && frame.count || 0;
  const alloc = result.allocation && result.allocation.supported ? result.allocation.estimatedBytes / Math.max(1, frames) / 1024 : null;
  return {
    id: result.scene,
    label: meta ? meta.label : result.scene,
    ok: result.ok,
    error: result.error,
    frames,
    median: frame && frame.median,
    p95: frame && frame.p95,
    p99: frame && frame.p99,
    max: frame && frame.max,
    long16: longs && longs.over16ms,
    long33: longs && longs.over33ms,
    intervalMedian: interval && interval.median,
    heapUsed: heap && heap.supported ? heap.usedJSHeapSize : null,
    heapTotal: heap && heap.supported ? heap.totalJSHeapSize : null,
    heapDelta: heapStartDelta(result),
    allocKbPerFrame: alloc,
    css: canvas ? Math.round(canvas.cssWidth) + '×' + Math.round(canvas.cssHeight) : '—',
    backing: canvas ? canvas.backingWidth + '×' + canvas.backingHeight : '—',
    dpr: meta ? meta.devicePixelRatio : null,
    zoom: meta ? meta.zoom : null,
    preset: meta ? meta.preset : null,
    paused: meta ? meta.paused : null,
    day: meta ? meta.day : null,
    buildings: meta ? meta.buildings : null,
    colonists: meta ? meta.colonists : null,
    weather: meta ? meta.weather : null,
    seed: meta ? meta.seed : null
  };
}

function heapStartDelta(result) {
  const before = result.report && result.report.heapBefore;
  const after = result.report && result.report.recording && result.report.recording.heap;
  if (!before || !after || !before.supported || !after.supported) return null;
  return after.usedJSHeapSize - before.usedJSHeapSize;
}

function markdown(output) {
  const lines = [];
  lines.push('# FARWAKE performance run');
  lines.push('');
  lines.push('Headless Chromium with iPhone 14 emulation is **only a proxy for iPhone Safari** (WebKit / JavaScriptCore, Metal-backed canvas). The numbers below are not iPhone frame times. Frame time is JavaScript inside the `requestAnimationFrame` callback and excludes GPU raster, compositing, and CSS `backdrop-filter`.');
  lines.push('');
  lines.push('- Commit: `' + (output.commit || 'unknown') + '`');
  lines.push('- Browser: ' + output.browser);
  lines.push('- Emulation: 390×844 CSS px, devicePixelRatio 3, iPhone Safari user agent, touch, 4× CPU throttle');
  lines.push('- Origin: http://127.0.0.1:' + PORT + ' with a fresh browser profile per measurement');
  lines.push('- Generated: ' + output.generatedAt);
  lines.push('');
  lines.push('## Isolation checks');
  lines.push('');
  for (const check of output.checks) {
    lines.push('- ' + (check.ok ? 'pass' : 'FAIL') + ' — ' + check.name);
  }
  lines.push('');
  lines.push('## Scenes');
  lines.push('');
  lines.push('| Scene | Rep | Frames | Median ms | p95 | p99 | Max | >16.7 | >33 | Heap MB | Alloc KB/frame | Canvas CSS | Backing | DPR |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|');
  output.runs.forEach((result, index) => {
    const row = sceneRows(result);
    const heap = row.heapUsed == null ? '—' : (row.heapUsed / 1048576).toFixed(2);
    const alloc = row.allocKbPerFrame == null ? '—' : row.allocKbPerFrame.toFixed(1);
    lines.push('| ' + [row.label, index + 1, row.frames, ms(row.median), ms(row.p95), ms(row.p99), ms(row.max), row.long16 ?? '—', row.long33 ?? '—', heap, alloc, row.css, row.backing, row.dpr ?? '—'].join(' | ') + ' |');
  });
  const failed = output.runs.filter(result => !result.ok);
  if (failed.length) {
    lines.push('');
    lines.push('## Failures');
    lines.push('');
    for (const result of failed) {
      lines.push('- **' + result.scene + ':** ' + (result.error || 'failed').split('\n')[0]);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function sceneList(options) {
  if (options.scene) return [options.scene];
  if (options.suite !== 'default' && options.suite !== 'audit' && options.suite !== 'all') {
    throw new Error('--suite must be default, audit, or all');
  }
  return null;
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    console.log(help());
    return;
  }
  console.log('Save safety: serving only http://127.0.0.1:' + PORT + ' and using a fresh browser profile per measurement.');
  console.log('The game save key is ' + SAVE_KEY + '. This runner never opens another origin.');
  let server;
  let checkServer;
  let browser;
  try {
    server = await serve(ROOT, PORT);
    checkServer = await serve(ROOT, CHECK_PORT);
  } catch (error) {
    if (error && error.code === 'EADDRINUSE') {
      console.error('Port ' + PORT + ' or ' + CHECK_PORT + ' is already in use. Refusing to fall back to another port, because the harness origin is part of save isolation.');
      process.exitCode = 1;
      return;
    }
    throw error;
  }
  const commit = gitSha();
  const checks = [];
  const runs = [];
  try {
    browser = await launchBrowser();
    const browserVersion = browser.version();
    checks.push(await checkInert(browser));
    checks.push(await checkWrongPort(browser));
    checks.push(await checkForeignSave(browser));
    for (const check of checks) console.log((check.ok ? 'pass' : 'FAIL') + '  ' + check.name);
    if (checks.some(check => !check.ok)) {
      console.error('Isolation checks failed. Benchmarks were not started.');
      process.exitCode = 1;
    } else if (!options.checkOnly) {
      const ids = sceneList(options) || (await listSuite(browser, options.suite));
      for (let repeat = 1; repeat <= options.repeat; repeat++) {
        for (const id of ids) {
          console.log('run ' + id + '  repeat ' + repeat + '/' + options.repeat);
          const result = await runScene(browser, commit, id, options);
          result.repeat = repeat;
          runs.push(result);
          const row = sceneRows(result);
          if (result.ok) {
            console.log('  median ' + ms(row.median) + ' ms   p95 ' + ms(row.p95) + '   max ' + ms(row.max) + '   frames ' + row.frames + '   ' + row.css + ' @ DPR ' + row.dpr + '   backing ' + row.backing);
          } else {
            console.log('  FAILED ' + String(result.error || '').split('\n')[0]);
          }
        }
      }
    }
    const output = {
      harness: 'farwake-perf',
      commit,
      generatedAt: new Date().toISOString(),
      browser: browser.version(),
      proxy: {
        note: 'Headless Chromium emulation is only a proxy for iPhone Safari.',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        cpuThrottle: 4,
        userAgent: devices['iPhone 14'].userAgent
      },
      options: { suite: options.suite, scene: options.scene || null, repeat: options.repeat, seconds: options.seconds, warmup: options.warmup, ops: options.ops, fixture: options.fixture || null },
      checks,
      runs
    };
    await mkdir(RESULTS, { recursive: true });
    const stem = options.scene || options.suite;
    await writeFile(path.join(RESULTS, stem + '.json'), JSON.stringify(output, null, 2));
    const summary = markdown(output);
    await writeFile(path.join(RESULTS, stem + '.md'), summary);
    console.log('Wrote perf/results/' + stem + '.json and perf/results/' + stem + '.md');
    if (runs.some(result => !result.ok)) process.exitCode = 1;
    void browserVersion;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise(resolve => server.close(resolve));
    if (checkServer) await new Promise(resolve => checkServer.close(resolve));
  }
}

async function listSuite(browser, suite) {
  const context = await browser.newContext(iphoneContextOptions());
  const page = await context.newPage();
  try {
    await page.goto(harnessUrl(PORT, {}), { waitUntil: 'domcontentloaded' });
    const ids = await page.evaluate(name => window.FarwakePerfScenes.suiteIds(name), suite);
    if (!Array.isArray(ids) || !ids.length) throw new Error('Suite ' + suite + ' has no scenes');
    return ids;
  } finally {
    await context.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
