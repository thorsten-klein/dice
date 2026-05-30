import { test as base } from '@playwright/test';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const v8ToIstanbul = require('v8-to-istanbul');

const nycOutputDir = path.resolve(process.cwd(), '.nyc_output');
if (!fs.existsSync(nycOutputDir)) fs.mkdirSync(nycOutputDir, { recursive: true });

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    const coverage = await page.coverage.stopJSCoverage();
    for (const entry of coverage) {
      if (!entry.url.includes('app.js')) continue;
      const filePath = fileURLToPath(entry.url);
      const converter = v8ToIstanbul(filePath, 0, { source: entry.source });
      await converter.load();
      converter.applyCoverage(entry.functions);
      const data = JSON.stringify(converter.toIstanbul());
      const outFile = path.join(nycOutputDir, `coverage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
      fs.writeFileSync(outFile, data);
    }
  },
});

export const expect = base.expect;

export async function gotoApp(page, baseURL) {
  if (!page.url().startsWith('file://')) {
    await page.goto(baseURL);
  }
  await page.evaluate(() => {
    localStorage.clear();
    seedDefaultConfigurations();
    initConfigScreen();
  });
  await page.waitForSelector('.config-screen');
}

export async function gotoRolling(page, baseURL, overrides) {
  await gotoApp(page, baseURL);
  const cfg = Object.assign({
    description: '__test__',
    numberOfDice: 1,
    diceConfigs: [{ sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: null, shape: 'SQUARE' })) }],
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
  }, overrides);
  await page.evaluate((c) => {
    saveConfiguration(c);
    initRollingScreen(c);
  }, cfg);
  await page.waitForSelector('.rolling-screen');
}
