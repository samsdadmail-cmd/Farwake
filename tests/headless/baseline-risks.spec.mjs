import {test, expect} from '@playwright/test';

const SAVE_KEY = 'farwake_founders_alpha03_v1';

test('records frontier door admission and technology-tree overflow', async ({page}, info) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 3);

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
  const catalog = await page.locator('[data-build]').count();
  expect(catalog).toBeGreaterThan(0);
  console.log(`CATALOG ${info.project.name} blueprints=${catalog}`);
  await page.click('[data-sheet="close"]');

  await page.click('[data-nav="more"]');
  await page.click('[data-open="research"]');
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

// Expected to fail on this build. save() does not read the key, so a running
// v3 page replaces a v:4 blob. Remove test.fail when a newer expedition is preserved.
test.fail('a running v3 page overwrites a newer expedition blob', async ({page}) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST?.state?.v === 3);
  const downgrade = await page.evaluate(key => {
    const newer = JSON.stringify({v: 4, marker: 'newer-than-this-build'});
    localStorage.setItem(key, newer);
    window.FARWAKE_TEST.save();
    const after = localStorage.getItem(key);
    let storedVersion = null;
    try { storedVersion = JSON.parse(after).v; } catch { storedVersion = null; }
    return {preservedNewer: after === newer, storedVersion};
  }, SAVE_KEY);
  expect(downgrade.preservedNewer).toBe(true);
  expect(downgrade.storedVersion).toBe(4);
});
