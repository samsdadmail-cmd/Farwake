import {test, expect} from '@playwright/test';

const SAVE_KEY = 'farwake_founders_alpha03_v1';

test('records frontier door admission and technology-tree overflow', async ({page}, info) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 4);

  const doors = await page.evaluate(() => {
    const route = (building, job) => window.FarwakeDoors.route(
      {x: building.x + 0.5, y: building.y + building.h + 1.5, path: []},
      {type: job, id: building.id, x: building.x, y: building.y, w: building.w, h: building.h},
      [building],
      () => true,
      () => [{x: building.x + 0.5, y: building.y + building.h + 0.5}],
      []
    );
    const cabin = {type: 'cabin', id: 4242, x: 8, y: 8, w: 3, h: 2, finished: true};
    const shelter = {type: 'shelter', id: 7, x: 8, y: 8, w: 3, h: 2, finished: true};
    const admitted = {};
    for (const type of ['cabin', 'dormitory', 'kitchen', 'sawmill', 'dining', 'warehouse', 'outpost', 'observatory']) {
      const building = {type, id: 5000, x: 8, y: 8, w: 3, h: 2, finished: true};
      admitted[type] = {
        entrance: !!window.FarwakeFrontierArt.entrance(building),
        rest: !!route(building, 'rest'),
        craft: !!route(building, 'craft'),
        haul: !!route(building, 'haul_dropoff')
      };
    }
    return {
      shelterRest: !!route(shelter, 'rest'),
      cabinEntrance: !!window.FarwakeFrontierArt.entrance(cabin),
      cabinPortal: !!window.FarwakeDoors.portalFor(cabin),
      cabinRest: !!route(cabin, 'rest'),
      admitted
    };
  });
  expect(doors.shelterRest).toBe(true);
  expect(doors.cabinEntrance).toBe(true);
  expect(doors.cabinPortal).toBe(true);
  console.log(`DOOR_ADMISSION ${info.project.name} ${JSON.stringify(doors)}`);

  await page.click('[data-nav="build"]');
  const catalog = await page.locator('[data-blueprint-detail]').count();
  expect(catalog).toBeGreaterThan(0);
  console.log(`CATALOG ${info.project.name} blueprints=${catalog}`);
  await page.click('[data-sheet="close"]');

  await page.click('[data-nav="research"]');
  await expect(page.locator('.discovery-node')).toHaveCount(26);await page.click('[data-tech-view="map"]');
  await page.waitForSelector('#sheet .tech-viewport', {timeout: 10000});
  const tree = await page.evaluate(() => {
    const sheet = document.querySelector('#sheet');
    const viewport = sheet.querySelector('.tech-viewport');
    return {
      branches: sheet.querySelectorAll('.tech-branch').length,
      sheetScrollWidth: sheet.scrollWidth,
      sheetClientWidth: sheet.clientWidth,
      viewportScrollWidth: viewport.scrollWidth,
      viewportClientWidth: viewport.clientWidth,
      sheetOverflows: sheet.scrollWidth > sheet.clientWidth + 1
    };
  });
  expect(tree.branches).toBeGreaterThan(0);
  console.log(`TREE_SCROLL ${info.project.name} ${JSON.stringify(tree)}`);
});

test('FARWAKE_TEST.save is a function on a loaded expedition', async ({page}) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 4);
  expect(await page.evaluate(() => typeof window.FARWAKE_TEST.save)).toBe('function');
});

// Issue #16 is required: an already-open page must preserve the newer blob
// through every save trigger. No expected-failure escape hatch.
test('issue #16: read-before-write guard keeps a newer save on an already-open page', async ({page}) => {
  await page.clock.install();
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 4);
  const result = await page.evaluate(async key => {
    const save = window.FARWAKE_TEST && window.FARWAKE_TEST.save;
    if (typeof save !== 'function') return {hook: typeof save};
    const newer = JSON.stringify({v: 5, marker: 'newer-than-this-build'});
    localStorage.setItem(key, newer);
    save();
    window.dispatchEvent(new Event('pagehide'));
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
    document.dispatchEvent(new Event('visibilitychange'));
    return {hook: 'function', planted: newer};
  }, SAVE_KEY);
  expect(result.hook).toBe('function');
  await page.clock.runFor(15000);
  const after = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  let storedVersion = null;
  try { storedVersion = JSON.parse(after).v; } catch { storedVersion = null; }
  expect(after).toBe(result.planted);
  expect(storedVersion).toBe(5);
});
