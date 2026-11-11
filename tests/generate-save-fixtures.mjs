// Drive the current index.html and store the JSON written by save().
// Re-run from the repo root: node tests/generate-save-fixtures.mjs
import {chromium} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {serveStatic} from './static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests/fixtures/saves');
const SAVE_KEY = 'farwake_founders_alpha03_v1';
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();

const SIZES = {
  shelter: [3, 2], garden: [3, 2], workshop: [3, 2], shed: [3, 2], solar: [2, 2], path: [1, 1]
};

function summarize(raw) {
  const save = JSON.parse(raw);
  const materials = Object.fromEntries(Object.entries(save.resources).filter(([key]) => key !== 'knowledge'));
  const materialTotal = Object.values(materials).reduce((sum, value) => sum + value, 0);
  const carries = save.colonists.filter(person => person.carry && person.carry.amount > 0)
    .map(person => ({id: person.id, kind: person.carry.kind, amount: person.carry.amount}));
  const carry = carries.find(item => item.kind === 'alloy' && item.amount === 4)
    || carries.find(item => item.kind === 'wood' && item.amount === 6)
    || carries[0]
    || null;
  return {
    seed: save.seed,
    day: save.day,
    minute: save.minute,
    colonists: save.colonists.length,
    research: save.research || [],
    finished: save.buildings.filter(building => building.finished).map(building => building.type).sort(),
    blueprints: save.buildings.filter(building => !building.finished).map(building => building.type).sort(),
    materialTotal,
    materials,
    knowledge: save.resources.knowledge,
    piles: (save.piles || []).length,
    carry,
    carries,
    frontierSites: save.frontier?.sites?.length || 0,
    sitesSeen: save.frontier?.sites?.filter(site => site.seen).length || 0,
    worldVersion: save.frontier?.worldVersion || null
  };
}

async function boot(page, origin) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error') errors.push(text);
    else if (text.startsWith('FIXTURE')) console.log(text);
  });
  await page.goto(`${origin}/index.html`);
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 3 && localStorage.getItem('farwake_founders_alpha03_v1'));
  return errors;
}

async function readSave(page) {
  return page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
}

async function stabilize(page, raw) {
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.evaluate(() => window.addEventListener('pagehide', event => event.stopImmediatePropagation(), true));
  await page.evaluate(({key, payload}) => localStorage.setItem(key, payload), {key: SAVE_KEY, payload: raw});
  await page.reload();
  await page.waitForFunction(() => {
    const sheet = document.querySelector('#sheet');
    const recovering = sheet && sheet.textContent.includes('Expedition needs recovery');
    return window.FARWAKE_TEST?.state?.v === 3 && !recovering;
  });
  return page.evaluate(key => {
    window.FARWAKE_TEST.save();
    return localStorage.getItem(key);
  }, SAVE_KEY);
}

async function play(page, mode) {
  await page.click('#speed');
  await page.click('#speed');
  const speed = await page.locator('#speed').textContent();
  if (speed !== '3×') throw new Error(`expected 3× simulation speed, saw ${speed}`);
  const report = await page.evaluate(async ({mode, sizes}) => {
    const game = window.FARWAKE_TEST;
    const state = game.state;
    const place = type => {
      const [w, h] = sizes[type];
      for (let y = 16; y < 48; y++) {
        for (let x = 16; x < 48; x++) {
          if (game.clearFootprint(x, y, w, h) && game.buildAt(type, x, y)) return state.buildings.at(-1);
        }
      }
      return null;
    };
    const wanted = mode === 'late' ? ['shelter', 'garden', 'solar', 'workshop'] : ['shelter'];
    const placed = {};
    for (const type of wanted) {
      const building = place(type);
      if (!building) return {ok: false, reason: `could not place ${type}`, resources: {...state.resources}};
      placed[type] = building.id;
    }
    let stall = 0;
    let previous = -1;
    for (let i = 0; i < 30000; i++) {
      game.tick(0.25);
      const score = state.buildings.reduce((sum, building) => sum + (building.finished ? 1000 : building.progress || 0), 0);
      stall = score === previous ? stall + 1 : 0;
      previous = score;
      if (i % 2000 === 0) {
        console.log(`FIXTURE ${mode} tick ${i} day ${state.day} score ${score.toFixed(1)} knowledge ${state.resources.knowledge}`);
      }
      const ready = wanted.every(type => state.buildings.some(building => building.id === placed[type] && building.finished));
      if (mode === 'mid' && ready) return {ok: true, ticks: i, day: state.day};
      if (mode === 'late' && ready && state.day >= 3) {
        const pending = ['growth', 'energy'].find(id => !state.research.includes(id));
        if (!pending && !game.frontierState().research) return {ok: true, ticks: i, day: state.day, research: state.research.slice()};
        if (pending && !game.frontierState().research) {
          const reason = game.researchReason(pending);
          if (reason) return {ok: false, reason: `cannot research ${pending}: ${reason}`, knowledge: state.resources.knowledge, day: state.day};
          game.frontierBeginResearch(pending);
        }
      }
      if (!ready && stall > 5000) break;
    }
    return {
      ok: false,
      reason: 'construction stalled',
      day: state.day,
      buildings: state.buildings.map(building => ({
        type: building.type,
        finished: !!building.finished,
        progress: building.progress,
        stock: building.siteStock || null
      })),
      tasks: state.colonists.map(person => person.task?.type || 'idle')
    };
  }, {mode, sizes: SIZES});
  if (!report.ok) throw new Error(`${mode} fixture failed: ${JSON.stringify(report)}`);
  const snapshot = await page.evaluate(({mode, key}) => {
    const game = window.FARWAKE_TEST;
    const state = game.state;
    let capacity = null;
    if (mode === 'late') {
      const stores = state.buildings.filter(building => building.finished && !building.editOrder && (building.type === 'supplies' || building.type === 'shed' || game.FRONTIER_BUILDINGS[building.type]?.storage));
      capacity = stores.reduce((sum, building) => {
        const base = building.type === 'supplies' ? 340 : (game.FRONTIER_BUILDINGS[building.type]?.storage || 180);
        return sum + base + ((building.level || 1) - 1) * 90;
      }, 0);
      for (const keyName of Object.keys(state.resources)) if (keyName !== 'knowledge') state.resources[keyName] = 0;
      for (const building of stores) building.stock = {};
      state.resources.food = Math.floor(capacity / 2);
      state.resources.scrap = capacity - state.resources.food;
      const pilesBefore = state.piles.length;
      game.freightInit();
      if (state.piles.length !== pilesBefore) return {error: 'freightInit spilled a full store', piles: state.piles.length};
      const carrier = state.colonists.find(person => person.role === 'Engineer') || state.colonists[0];
      carrier.carry = {kind: 'alloy', amount: 4};
    } else {
      const carrier = state.colonists.find(person => person.role === 'Surveyor') || state.colonists[1];
      carrier.carry = {kind: 'wood', amount: 6};
    }
    game.save();
    const total = Object.entries(state.resources).filter(([name]) => name !== 'knowledge').reduce((sum, [, value]) => sum + value, 0);
    return {raw: localStorage.getItem(key), capacity: mode === 'late' ? capacity : null, total};
  }, {mode, key: SAVE_KEY});
  if (snapshot.error) throw new Error(`${mode} snapshot failed: ${snapshot.error}`);
  if (mode === 'late' && snapshot.total !== snapshot.capacity) {
    throw new Error(`late store is not exactly full: total ${snapshot.total} capacity ${snapshot.capacity}`);
  }
  console.log(`FIXTURE ${mode} simulated`, report, 'stored', snapshot.total, 'capacity', snapshot.capacity);
  return snapshot.raw;
}

const browser = await chromium.launch();
const server = await serveStatic(root);
await mkdir(outDir, {recursive: true});
const fixtures = {};
try {
  const freshContext = await browser.newContext({viewport: {width: 390, height: 844}});
  const freshPage = await freshContext.newPage();
  freshPage.setDefaultTimeout(180000);
  const freshErrors = await boot(freshPage, server.url);
  if (freshErrors.length) throw new Error(`fresh boot errors: ${freshErrors.join('\n')}`);
  const freshStable = await stabilize(freshPage, await readSave(freshPage));
  fixtures.fresh = {raw: freshStable, notes: 'save() immediately after the default FW-10402 landing, then reloaded once so load() migrations have already run.'};
  await freshContext.close();

  for (const mode of ['mid', 'late']) {
    const context = await browser.newContext({viewport: {width: 390, height: 844}});
    const page = await context.newPage();
    page.setDefaultTimeout(180000);
    const errors = await boot(page, server.url);
    if (errors.length) throw new Error(`${mode} boot errors: ${errors.join('\n')}`);
    const played = await play(page, mode);
    const stable = await stabilize(page, played);
    fixtures[mode] = {
      raw: stable,
      notes: mode === 'mid'
        ? 'Crew finished a player-placed prefab home. A surveyor is carrying timber when save() runs.'
        : 'Crew finished a home, grow beds, solar array and workshop, and studied cultivation and grid storage. Stores were then filled through freightInit to capacity, with alloy left in an engineer’s hands.'
    };
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

const manifest = {
  storageKey: SAVE_KEY,
  version: 3,
  generatedFromCommit: commit,
  generator: 'tests/generate-save-fixtures.mjs',
  fixtures: {}
};
for (const [name, fixture] of Object.entries(fixtures)) {
  const summary = summarize(fixture.raw);
  const file = `${name}.json`;
  await writeFile(path.join(outDir, file), `${fixture.raw}\n`);
  manifest.fixtures[name] = {file, notes: fixture.notes, ...summary};
  console.log(name, JSON.stringify(summary));
}
await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('wrote', outDir);
