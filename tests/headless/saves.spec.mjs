import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/saves');
const manifest = JSON.parse(readFileSync(path.join(fixtureDir, 'manifest.json'), 'utf8'));
const SAVE_KEY = manifest.storageKey;
const readFixture = name => readFileSync(path.join(fixtureDir, manifest.fixtures[name].file), 'utf8').trim();

async function installSave(page, raw) {
  await page.context().addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto('/manifest.webmanifest');
  await page.evaluate(({key, payload}) => localStorage.setItem(key, payload), {key: SAVE_KEY, payload: raw});
}

async function openGame(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST);
}

function recoveryVisible(page) {
  return page.locator('#sheet', {hasText: 'Expedition needs recovery'});
}

async function loadedState(page) {
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 4);
  await expect(recoveryVisible(page)).toHaveCount(0);
  return page.evaluate(() => window.FARWAKE_TEST.state);
}

test.describe('v3 save fixtures', () => {
  for (const name of ['fresh', 'mid', 'late']) {
    test(`${name} loads without recovery and keeps stores and cargo`, async ({page}) => {
      const raw = readFixture(name);
      const expected = JSON.parse(raw);
      const info = manifest.fixtures[name];
      await installSave(page, raw);
      await openGame(page);
      const state = await loadedState(page);
      expect(state.v).toBe(4);
      expect(state.seed).toBe(expected.seed);
      expect(state.day).toBe(expected.day);
      expect(state.minute).toBe(expected.minute);
      expect(state.fog).toHaveLength(56 * 56);
      expect(state.colonists.map(person => person.name)).toEqual(expected.colonists.map(person => person.name));
      expect(state.buildings.filter(building => building.finished).map(building => building.type).sort())
        .toEqual(info.finished);
      const materialKeys = Object.keys(expected.resources).filter(key => key !== 'knowledge');
      for (const key of materialKeys) expect(state.resources[key], key).toBe(expected.resources[key]);
      expect(state.resources.knowledge).toBe(expected.resources.knowledge);
      expect(state.piles).toEqual(expected.piles);
      for (const person of expected.colonists) {
        const loaded = state.colonists.find(colonist => colonist.id === person.id);
        expect(loaded.carry ?? null).toEqual(person.carry ?? null);
      }
    });
  }

  test('a pre-frontier v3 save migrates on load without recovery', async ({page}) => {
    const save = JSON.parse(readFixture('fresh'));
    delete save.frontier;
    delete save.industry;
    delete save.freightFlow;
    delete save.gridCharge;
    for (const key of ['boards', 'metal', 'components', 'composite', 'water', 'meals', 'relic']) delete save.resources[key];
    await installSave(page, JSON.stringify(save));
    await openGame(page);
    const state = await loadedState(page);
    expect(state.frontier.version).toBe(2);
    expect(state.frontier.worldVersion).toBe(1);
    expect(state.frontier.surfaceVersion).toBe(1);
    expect(state.frontier.surfaceDeposits.length).toBeGreaterThan(0);
    expect(state.frontier.sites.length).toBeGreaterThan(0);
    expect(state.resources.boards).toBe(0);
    expect(state.resources.metal).toBe(0);
    expect(state.industry.targets.boards).toBe(80);
    expect(state.industry.targets.water).toBe(60);
    expect(state.seed).toBe(save.seed);
  });

  test('an unfinished legacy blueprint is treated as already paid', async ({page}) => {
    const save = JSON.parse(readFixture('fresh'));
    await installSave(page, JSON.stringify(save));
    await openGame(page);
    await loadedState(page);
    const spot = await page.evaluate(() => {
      const game = window.FARWAKE_TEST;
      for (let y = 4; y < 52; y++) {
        for (let x = 4; x < 52; x++) if (game.clearFootprint(x, y, 1, 1)) return {x, y};
      }
      return null;
    });
    expect(spot).toBeTruthy();
    save.buildings.push({id: 900, type: 'path', x: spot.x, y: spot.y, w: 1, h: 1, progress: 1.5, finished: false});
    save.uid = Math.max(save.uid || 0, 901);
    await page.evaluate(({key, payload}) => localStorage.setItem(key, payload), {key: SAVE_KEY, payload: JSON.stringify(save)});
    const reloaded = await page.context().newPage();
    await reloaded.goto('/index.html');
    const state = await loadedState(reloaded);
    const blueprint = state.buildings.find(building => building.id === 900);
    expect(blueprint.finished).toBe(false);
    expect(blueprint.progress).toBe(1.5);
    expect(blueprint.reservedMaterials).toEqual({scrap: 1});
    expect(blueprint.siteStock).toEqual({scrap: 1});
  });

  test('import replaces the colony and keeps a recovery backup', async ({page}) => {
    const fresh = JSON.parse(readFixture('fresh'));
    const mid = JSON.parse(readFixture('mid'));
    const envelope = {
      format: 'farwake-expedition-backup',
      formatVersion: 1,
      exportedAt: '2026-11-11T16:00:00.000Z',
      save: mid
    };
    await installSave(page, JSON.stringify(fresh));
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    page.once('dialog', dialog => dialog.accept());
    await page.setInputFiles('#import-expedition-file', {
      name: 'FARWAKE-mid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(envelope))
    });
    await page.waitForFunction(() => window.FARWAKE_TEST?.state?.buildings?.some(building => building.type === 'shelter' && building.finished));
    await expect(recoveryVisible(page)).toHaveCount(0);
    const imported = await page.evaluate(() => window.FARWAKE_TEST.state);
    expect(imported.seed).toBe(mid.seed);
    expect(imported.day).toBe(mid.day);
    expect(imported.colonists.map(person => person.name)).toEqual(mid.colonists.map(person => person.name));
    const backup = await page.evaluate(key => {
      const name = Object.keys(localStorage).find(item => item.startsWith(`${key}_before_import_`));
      return name ? JSON.parse(localStorage.getItem(name)) : null;
    }, SAVE_KEY);
    expect(backup.seed).toBe(fresh.seed);
    expect(backup.buildings.some(building => building.type === 'shelter' && building.finished)).toBe(false);
  });

  test('an incompatible import does not replace the stored colony', async ({page}) => {
    const fresh = readFixture('fresh');
    await installSave(page, fresh);
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    await page.setInputFiles('#import-expedition-file', {
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({v: 1, seed: 'nope'}))
    });
    await expect(page.locator('#toast')).toContainText('not a compatible FARWAKE Founders save');
    const stored = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    expect(JSON.parse(stored).seed).toBe(JSON.parse(fresh).seed);
    expect(JSON.parse(stored).v).toBe(3);
    await expect(recoveryVisible(page)).toHaveCount(0);
  });

  // Fields load() is allowed to change before save() writes the fixture back.
  // Anything else, including frontier.sites, resources, buildings, and cargo,
  // must deep-equal the original file. Version and the verified recovery pointer are also explicit migration changes. The log:
  // a successful load calls log('✦', 'Expedition resumed. Welcome back, Commander.'),
  // which unshifts S.events and drops the oldest line once the log is 50 long.
  const LOAD_MAY_CHANGE = ['events','v','migration'];

  function changedPaths(actual, expected, path = '') {
    const found = [];
    const bothObjects = actual && expected && typeof actual === 'object' && typeof expected === 'object';
    if (!bothObjects || Array.isArray(actual) !== Array.isArray(expected)) {
      if (!Object.is(actual, expected)) found.push(path || '(root)');
      return found;
    }
    if (Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        found.push(`${path}.length`);
        return found;
      }
      expected.forEach((item, index) => found.push(...changedPaths(actual[index], item, `${path}[${index}]`)));
      return found;
    }
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      found.push(...changedPaths(actual[key], expected[key], path ? `${path}.${key}` : key));
    }
    return found;
  }

  for (const name of ['fresh', 'mid', 'late']) {
    test(`${name} save matches the fixture except the load log`, async ({page}) => {
      const fixture = JSON.parse(readFixture(name));
      await installSave(page, readFixture(name));
      await openGame(page);
      await loadedState(page);
      const saved = await page.evaluate(key => {
        if (typeof window.FARWAKE_TEST.save !== 'function') throw new Error('FARWAKE_TEST.save is missing');
        window.FARWAKE_TEST.save();
        return JSON.parse(localStorage.getItem(key));
      }, SAVE_KEY);
      expect(saved.v).toBe(4);
      expect(saved.migration.from).toBe(3);
      expect(await page.evaluate(k=>localStorage.getItem(k),saved.migration.recoveryKey)).toBe(readFixture(name));
      const roots = changedPaths(saved, fixture).map(path => path.split(/[.[]/)[0]);
      const unexpected = [...new Set(roots)].filter(root => !LOAD_MAY_CHANGE.includes(root));
      expect(unexpected, unexpected.join(', ')).toEqual([]);
      expect(saved.events[0]).toMatchObject({
        icon: '✦',
        message: 'Expedition resumed. Welcome back, Commander.',
        day: fixture.day
      });
      expect(saved.events.slice(1)).toEqual(fixture.events.slice(0, saved.events.length - 1));
      expect(saved.frontier.sites).toEqual(fixture.frontier.sites);
      expect(saved.resources).toEqual(fixture.resources);
      expect(saved.buildings).toEqual(fixture.buildings);
      expect(saved.colonists.map(person => person.carry ?? null)).toEqual(fixture.colonists.map(person => person.carry ?? null));
    });
  }

  test('autosave, hidden visibility, and pagehide write the expedition', async ({page}) => {
    await page.clock.install();
    await page.goto('/index.html');
    await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 4);
    await page.evaluate(() => { window.FARWAKE_TEST.state.day = 11; });
    await page.clock.runFor(15000);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).day, SAVE_KEY)).toBe(11);

    await page.evaluate(() => { window.FARWAKE_TEST.state.day = 12; });
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).day, SAVE_KEY)).toBe(12);

    await page.evaluate(() => { window.FARWAKE_TEST.state.day = 13; });
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).day, SAVE_KEY)).toBe(13);
  });

  test('corrupt JSON at startup opens recovery and is left in place', async ({page}) => {
    const raw = '{not json';
    await installSave(page, raw);
    await openGame(page);
    await expect(recoveryVisible(page)).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(raw);
    expect(await page.evaluate(() => window.FARWAKE_TEST.state)).toBeNull();
  });

  test('an unparseable import does not replace the colony', async ({page}) => {
    const fresh = readFixture('fresh');
    await installSave(page, fresh);
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    await page.setInputFiles('#import-expedition-file', {
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{')
    });
    await expect(page.locator('#toast')).toBeVisible();
    const stored = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    expect(stored).toBe(fresh);
    await expect(recoveryVisible(page)).toHaveCount(0);
  });

  test('an import larger than 5 MiB does not replace the colony', async ({page}) => {
    const fresh = readFixture('fresh');
    await installSave(page, fresh);
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    await page.setInputFiles('#import-expedition-file', {
      name: 'huge.json',
      mimeType: 'application/json',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 0x20)
    });
    await expect(page.locator('#toast')).toContainText('Backup file is too large.');
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(fresh);
  });

  test('a v5 import file does not replace the colony', async ({page}) => {
    const fresh = readFixture('fresh');
    await installSave(page, fresh);
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    await page.setInputFiles('#import-expedition-file', {
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({format: 'farwake-expedition-backup', formatVersion: 1, save: {v: 5, seed: 'LATER', day: 2, minute: 10, resources: {}, colonists: [{name: 'N', x: 1, y: 1}], buildings: [], fog: []}}))
    });
    await expect(page.locator('#toast')).toContainText('not a compatible FARWAKE Founders save');
    expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).seed).toBe(JSON.parse(fresh).seed);
  });

  test('cancelling import confirm leaves the colony in place', async ({page}) => {
    const fresh = JSON.parse(readFixture('fresh'));
    const mid = JSON.parse(readFixture('mid'));
    await installSave(page, JSON.stringify(fresh));
    await openGame(page);
    await loadedState(page);
    await page.click('#menu');
    await page.click('[data-open="operations"]');
    await page.locator('#import-expedition-file').waitFor({state: 'attached'});
    page.once('dialog', dialog => dialog.dismiss());
    await page.setInputFiles('#import-expedition-file', {
      name: 'FARWAKE-mid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({format: 'farwake-expedition-backup', formatVersion: 1, exportedAt: '2026-11-11T16:00:00.000Z', save: mid}))
    });
    const state = await page.evaluate(() => window.FARWAKE_TEST.state);
    expect(state.buildings.some(building => building.type === 'shelter' && building.finished)).toBe(false);
    expect(state.day).toBe(fresh.day);
    expect(await page.evaluate(key => Object.keys(localStorage).some(item => item.includes('_before_import_')), SAVE_KEY)).toBe(false);
  });

  test('a newer version opens recovery and is not overwritten', async ({page}) => {
    const newer = JSON.stringify({
      v: 5,
      seed: 'FROM-A-NEWER-BUILD',
      day: 9,
      minute: 80,
      resources: {food: 1},
      colonists: [{name: 'Future', x: 2, y: 2}],
      buildings: [],
      fog: new Array(56 * 56).fill(1)
    });
    await installSave(page, newer);
    await openGame(page);
    await expect(recoveryVisible(page)).toBeVisible();
    expect(await page.evaluate(() => typeof window.FARWAKE_TEST.save)).toBe('function');
    expect(await page.evaluate(() => window.FARWAKE_TEST.state)).toBeNull();
    await page.evaluate(() => {
      window.FARWAKE_TEST.save();
      window.dispatchEvent(new Event('pagehide'));
      Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const stored = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    expect(stored).toBe(newer);
  });
});
