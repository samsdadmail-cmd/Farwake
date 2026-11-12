import {test, expect} from '@playwright/test';

test('boots, exposes FARWAKE_TEST, and advances 600 ticks without console errors', async ({page}, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error') errors.push(`console: ${text}`);
    // save() warns "Save failed", import warns "Import failed", and load() warns the
    // exception object. The game has no other console.warn, so any warning is a
    // save/load failure.
    if (message.type() === 'warning') errors.push(`warn: ${text}`);
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => window.FARWAKE_TEST && window.FARWAKE_TEST.state && window.FARWAKE_TEST.state.v === 4);
  const result = await page.evaluate(() => {
    const game = window.FARWAKE_TEST;
    let ticks = 0;
    for (; ticks < 600; ticks++) {
      game.tick(1 / 30);
      game.advanceWorld(1 / 30);
      if (ticks % 30 === 0) game.draw(1000 + ticks);
    }
    return {
      ticks,
      day: game.state.day,
      minute: game.state.minute,
      colonists: game.state.colonists.length,
      version: game.state.v
    };
  });
  expect(result.ticks, `${info.project.name} tick count`).toBeGreaterThanOrEqual(600);
  expect(result.version).toBe(4);
  expect(result.colonists).toBe(5);
  expect(result.minute).toBeGreaterThan(7 * 60 + 20);
  expect(errors, `${info.project.name}\n${errors.join('\n')}`).toEqual([]);
});
