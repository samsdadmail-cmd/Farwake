// Verification for issue #16. Not the official regression suite.
// QA & Saves owns tests/. These are the cases to promote.
//
// The script assembles the owned sources the same way build.py does and drives
// FARWAKE_TEST in headless Chrome.
//
// Cases:
// 1. FARWAKE_TEST.save is a function on a loaded v3 expedition.
// 2. An already-open page that finds version 4 in farwake_founders_alpha03_v1
//    leaves that exact string in place across save(), pagehide, a hidden
//    visibilitychange, and a further save. The sheet says Newer expedition and
//    does not offer to start a new world.
// 3. The same string is still there after the autosave interval.
// 4. A v3 save with no frontier block still loads and migrates.
// 5. A writer stamp from another build is not overwritten.
//
// Run from the repo root: node docs/systems/verify/save-guard-verify.cjs

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const modules = ['housing', 'logistics', 'editor', 'industry', 'command', 'survey', 'frontier'];
const bundle = modules.map(name => fs.readFileSync(path.join(root, name + '.inc.js'), 'utf8')).join('\n');
const page = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8').replace('// FOUNDATION MODULES', bundle);
const KEY = 'farwake_founders_alpha03_v1';

const types = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};

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
      res.writeHead(404); res.end('missing'); return;
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
      if (match) { stream.off('data', onData); resolve(match); }
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

async function boot(client) {
  let booted = false;
  for (let i = 0; i < 50 && !booted; i++) {
    const probe = await client.send('Runtime.evaluate', {expression: '!!(window.FARWAKE_TEST && window.FARWAKE_TEST.state && window.FARWAKE_TEST.state.v===3)', returnByValue: true});
    booted = !!(probe.result && probe.result.value);
    if (!booted) await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!booted) throw Error('game did not expose a v3 FARWAKE_TEST.save page');
}

function unwrap(evaluated) {
  if (evaluated.exceptionDetails) {
    throw Error(evaluated.exceptionDetails.exception && evaluated.exceptionDetails.exception.description || evaluated.exceptionDetails.text);
  }
  return evaluated.result.value;
}

async function main() {
  const server = await serve();
  const port = server.address().port;
  const profile = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'farwake-save-'));
  const chrome = spawn('/usr/local/bin/google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--user-data-dir=' + profile, '--remote-debugging-port=0', 'about:blank'
  ], {stdio: ['ignore', 'pipe', 'pipe']});
  let failure = null;
  try {
    const found = await waitFor(chrome.stderr, /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
    const opened = await fetch('http://127.0.0.1:' + found[1] + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + port + '/index.html'), {method: 'PUT'});
    const target = await opened.json();
    const client = cdp(target.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await boot(client);
    const planted = JSON.stringify({v: 4, marker: 'newer-than-this-build'});
    const newer = unwrap(await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const lines = [];
        const ok = (pass, label) => { lines.push((pass ? 'PASS ' : 'FAIL ') + label); if (!pass) throw Error(label); };
        const save = window.FARWAKE_TEST && window.FARWAKE_TEST.save;
        ok(typeof save === 'function', 'FARWAKE_TEST.save is a function');
        const current = localStorage.getItem(${JSON.stringify(KEY)});
        ok(!!current && JSON.parse(current).v === 3, 'a v3 expedition is already stored');
        const planted = ${JSON.stringify(planted)};
        localStorage.setItem(${JSON.stringify(KEY)}, planted);
        save();
        window.dispatchEvent(new Event('pagehide'));
        Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
        document.dispatchEvent(new Event('visibilitychange'));
        save();
        const after = localStorage.getItem(${JSON.stringify(KEY)});
        let storedVersion = null;
        try { storedVersion = JSON.parse(after).v; } catch (e) { storedVersion = null; }
        ok(after === planted && storedVersion === 4, 'save, pagehide, hidden visibility, and a later save keep the version 4 string');
        const sheet = document.getElementById('sheet').textContent;
        ok(sheet.includes('Newer expedition'), 'the page explains that a newer expedition was kept');
        ok(!sheet.includes('Begin New World') && !sheet.includes('Generate New World'), 'the message does not discard the newer save');
        return {lines, current};
      })()`
    }));
    await new Promise(resolve => setTimeout(resolve, 13000));
    const later = unwrap(await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const planted = ${JSON.stringify(planted)};
        const after = localStorage.getItem(${JSON.stringify(KEY)});
        if (after !== planted) throw Error('autosave interval replaced the newer save');
        return true;
      })()`
    }));
    if (later !== true) throw Error('autosave check failed');
    console.log(newer.lines.join('\n'));
    console.log('PASS version 4 string still intact after the autosave interval');
    unwrap(await client.send('Runtime.evaluate', {
      expression: `localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(newer.current)})`
    }));
    await client.send('Page.reload', {ignoreCache: true});
    await boot(client);
    const migrated = unwrap(await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const lines = [];
        const ok = (pass, label) => { lines.push((pass ? 'PASS ' : 'FAIL ') + label); if (!pass) throw Error(label); };
        const key = ${JSON.stringify(KEY)};
        const original = localStorage.getItem(key);
        const older = JSON.parse(original);
        delete older.frontier;
        delete older.industry;
        delete older.resources.boards;
        delete older.resources.metal;
        localStorage.setItem(key, JSON.stringify(older));
        ok(window.FARWAKE_TEST.load(), 'an older v3 save loads');
        const state = window.FARWAKE_TEST.state;
        ok(state.v === 3 && state.frontier && state.frontier.sites.length > 0 && state.resources.boards === 0, 'older v3 data migrates without replacing the save version');
        const kept = localStorage.getItem(key);
        localStorage.setItem(key + '_writer', 'foreign-build');
        window.FARWAKE_TEST.save();
        ok(localStorage.getItem(key) === kept, 'a foreign build stamp does not overwrite the expedition');
        ok(document.getElementById('sheet').textContent.includes('Newer expedition'), 'a stale page says the other build was kept');
        localStorage.setItem(key, original);
        return {lines};
      })()`
    }));
    console.log(migrated.lines.join('\n'));
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
