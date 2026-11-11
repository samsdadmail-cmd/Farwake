// Verification for issue #17. Not the official regression suite.
// QA & Saves owns tests/ and can promote these cases.
//
// Serves the owned sources the same way build.py assembles index.html, with the
// animation loop held so ticks are manual. The storage key is farwake_qa_access,
// matching the staged QA prefix farwake_qa_*.
//
// Cases:
// 1. A placement that would wall in a doorless blueprint (wind turbine) is refused.
//    An already sealed copy of that blueprint is marked "Access blocked" on load,
//    and its reserved materials stay reserved.
// 2. That sealed site does not stop a reachable blueprint from finishing within one simulated day.
// 3. That day writes fewer than 100 farwake_qa_* saves and does not mint runaway pile ids.
//
// Run from the repo root: node docs/systems/verify/frontier-access-verify.cjs

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const modules = ['housing', 'logistics', 'editor', 'industry', 'command', 'survey', 'frontier'];
const bundle = modules.map(name => fs.readFileSync(path.join(root, name + '.inc.js'), 'utf8')).join('\n');
const page = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8')
  .replace('// FOUNDATION MODULES', bundle)
  .replace('<head>', '<head><script>window.requestAnimationFrame=function(){return 0};</script>')
  .replace("'farwake_founders_alpha03_v1'", "'farwake_qa_access'");

const types = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};

const scenario = `(() => {
  const g = window.FARWAKE_TEST;
  const lines = [];
  const ok = (pass, label) => { lines.push((pass ? 'PASS ' : 'FAIL ') + label); if (!pass) throw Error(label); };
  if (!g || g.state.v !== 3) throw Error('FARWAKE_TEST did not load a v3 expedition');
  const s = g.state;
  s.minute = 8 * 60;
  for (const id of ['energy', 'timbercraft', 'refining', 'windpower', 'fabrication', 'civilworks']) {
    if (!s.research.includes(id)) s.research.push(id);
  }
  s.resources.wood = Math.max(s.resources.wood || 0, 80);
  s.resources.scrap = Math.max(s.resources.scrap || 0, 80);
  s.resources.alloy = Math.max(s.resources.alloy || 0, 40);
  s.resources.boards = 40;
  s.resources.metal = 40;
  s.resources.components = 20;
  s.resources.food = Math.max(s.resources.food || 0, 80);
  g.freightInit();
  const spec = g.FRONTIER_BUILDINGS.wind;
  const ringOf = (x, y, w, h) => {
    const cells = [];
    for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) {
      const edge = xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h;
      const inside = xx >= x && xx < x + w && yy >= y && yy < y + h;
      if (edge && !inside) cells.push({x: xx, y: yy});
    }
    return cells;
  };
  const feats = g.features;
  for (let i = feats.length - 1; i >= 0; i--) {
    const f = feats[i];
    if (f.x >= 33 && f.x <= 50 && f.y >= 33 && f.y <= 50) feats.splice(i, 1);
  }
  for (let y = 33; y <= 50; y++) for (let x = 33; x <= 50; x++) {
    const tile = g.terrain[y * 56 + x];
    if (tile && tile.kind !== 'grass') tile.kind = 'grass';
  }
  const spot = {x: 42, y: 42, ring: ringOf(42, 42, spec.w, spec.h)};
  ok(g.clearFootprint(spot.x, spot.y, spec.w, spec.h), 'turbine footprint is open grass');
  ok(g.buildAt('wind', spot.x, spot.y), 'an open doorless turbine blueprint is accepted');
  const turbine = g.state.buildings.find(b => b.type === 'wind' && !b.finished);
  ok(!!turbine, 'turbine blueprint exists');
  const gap = spot.ring.slice().sort((a, b) => Math.hypot(a.x - 28, a.y - 28) - Math.hypot(b.x - 28, b.y - 28))[0];
  let nid = 7000;
  for (const cell of spot.ring) if (cell !== gap) g.state.buildings.push({id: nid++, type: 'battery', x: cell.x, y: cell.y, w: 1, h: 1, finished: true, progress: 100});
  const refusal = g.frontierPlacementReason('lamppost', gap.x, gap.y);
  const beforePlace = g.state.buildings.length;
  const placed = g.buildAt('lamppost', gap.x, gap.y);
  ok(!!refusal && placed === false && g.state.buildings.length === beforePlace, 'sealing a doorless blueprint is refused (' + (refusal || 'no reason') + ')');
  g.state.buildings.push({id: nid++, type: 'battery', x: gap.x, y: gap.y, w: 1, h: 1, finished: true, progress: 100});
  let home = null;
  for (let y = 24; y < 36 && !home; y++) for (let x = 18; x < 36 && !home; x++) {
    if (g.clearFootprint(x, y, 3, 2) && g.buildAt('shelter', x, y)) home = g.state.buildings.at(-1);
  }
  ok(!!home, 'reachable shelter blueprint is placed');
  home.siteStock = {...(home.reservedMaterials || g.TYPES.shelter.cost)};
  home.reservedMaterials = {...home.siteStock};
  turbine.buildPriority = true;
  turbine.siteStock = {...(turbine.reservedMaterials || g.TYPES.wind.cost)};
  turbine.reservedMaterials = {...turbine.siteStock};
  const bait = {x: Math.max(2, spot.x - 3), y: Math.max(2, spot.y - 3)};
  g.state.piles.push({id: 'lot-sealed-bait', x: bait.x, y: bait.y, kind: 'metal', amount: 6, site: turbine.id});
  for (const p of g.state.colonists) { p.work = 'build'; p.hunger = 0; p.energy = 100; p.task = null; p.path = []; }
  g.save();
  ok(g.load(), 'sealed expedition reloads');
  const live = g.state;
  const sealed = live.buildings.find(b => b.type === 'wind' && !b.finished);
  const shelter = live.buildings.find(b => b.id === home.id);
  ok(!!sealed && sealed.accessBlocked === 'Access blocked', 'load marks the sealed doorless site Access blocked');
  ok(!!shelter && !shelter.finished, 'reachable shelter survived the reload');
  ok(sealed.reservedMaterials && Object.values(sealed.reservedMaterials).some(n => n > 0), 'sealed site keeps its reserved materials');
  g.showBuilding(sealed.id);
  const readout = document.getElementById('facility-readout');
  ok(!!readout && readout.textContent.includes('Access blocked') && !!readout.querySelector('[data-editor="apply-cancel-site"]'), 'access warning offers a one-tap cancel and refund');
  let farwakeSaves = 0;
  const write = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    if (String(key).startsWith('farwake_qa_')) farwakeSaves++;
    return write(key, value);
  };
  const pilesBefore = live.piles.length;
  const idsBefore = new Set(live.piles.map(pile => pile.id));
  const ticks = Math.ceil(1440 / (0.1 * 3.1)) + 8;
  for (let i = 0; i < ticks; i++) g.tick(0.1);
  const freshIds = live.piles.filter(pile => !idsBefore.has(pile.id)).map(pile => pile.id);
  const freshLots = freshIds.filter(id => String(id).startsWith('lot-'));
  ok(shelter.finished === true, 'reachable shelter finishes within one day (day ' + live.day + ', minute ' + Math.floor(live.minute) + ')');
  ok(!sealed.finished && sealed.accessBlocked === 'Access blocked', 'sealed turbine stays unfinished and blocked');
  ok(farwakeSaves < 100, 'one day wrote ' + farwakeSaves + ' farwake_qa_* saves');
  ok(live.piles.length < pilesBefore + 30 && freshLots.length < 8, 'no runaway piles (count ' + live.piles.length + ', new lot ids ' + freshLots.length + ')');
  return {
    lines,
    day: live.day,
    minute: Math.floor(live.minute),
    shelter: shelter.finished,
    turbineProgress: Math.round(sealed.progress),
    saves: farwakeSaves,
    piles: live.piles.length,
    newPiles: freshIds
  };
})()`;

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/index.html' || url.pathname === '/') {
      res.writeHead(200, {'content-type': types['.html']});
      res.end(page);
      return;
    }
    const file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
    res.end(fs.readFileSync(file));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function waitFor(stream, pattern) {
  return new Promise((resolve, reject) => {
    let text = '';
    const onData = chunk => {
      text += chunk.toString();
      const match = text.match(pattern);
      if (match) {
        stream.off('data', onData);
        resolve(match);
      }
    };
    stream.on('data', onData);
    stream.on('end', () => reject(Error('chrome closed before ' + pattern)));
  });
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', () => reject(Error('devtools socket failed')));
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const {resolve, reject} = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  return {
    ready,
    send(method, params = {}) {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending.set(id, {resolve, reject});
        ws.send(JSON.stringify({id, method, params}));
      });
    },
    close() { ws.close(); }
  };
}

async function main() {
  const server = await serve();
  const port = server.address().port;
  const profile = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'farwake-access-'));
  const chrome = spawn(process.env.CHROME_PATH || '/usr/local/bin/google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--user-data-dir=' + profile, '--remote-debugging-port=0', 'about:blank'
  ], {stdio: ['ignore', 'pipe', 'pipe']});
  let failure = null;
  try {
    const found = await waitFor(chrome.stderr, /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
    const debugPort = found[1];
    const opened = await fetch('http://127.0.0.1:' + debugPort + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + port + '/index.html'), {method: 'PUT'});
    const target = await opened.json();
    const client = cdp(target.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Runtime.enable');
    let booted = false;
    for (let i = 0; i < 50 && !booted; i++) {
      const probe = await client.send('Runtime.evaluate', {expression: '!!(window.FARWAKE_TEST && window.FARWAKE_TEST.state)', returnByValue: true});
      booted = !!(probe.result && probe.result.value);
      if (!booted) await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!booted) throw Error('game did not expose FARWAKE_TEST');
    const evaluated = await client.send('Runtime.evaluate', {expression: scenario, returnByValue: true});
    if (evaluated.exceptionDetails) {
      const text = evaluated.exceptionDetails.exception && evaluated.exceptionDetails.exception.description || evaluated.exceptionDetails.text;
      throw Error(text);
    }
    const report = evaluated.result.value;
    console.log(report.lines.join('\n'));
    console.log('JOURNEY day ' + report.day + ' minute ' + report.minute + ' shelterFinished=' + report.shelter + ' sealedTurbineProgress=' + report.turbineProgress + ' farwake_qa_saves=' + report.saves + ' piles=' + report.piles);
    client.close();
  } catch (error) {
    failure = error;
    console.error('FAILED ' + (failure.stack || failure.message));
  } finally {
    chrome.kill('SIGKILL');
    server.close();
    await new Promise(resolve => setTimeout(resolve, 200));
    try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 3, retryDelay: 100}); } catch (error) { console.error('cleanup ' + error.message); }
  }
  if (failure) process.exit(1);
}

main();
