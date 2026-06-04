import { test, expect, gotoApp } from './fixtures.js';

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
  // Ensure a clean slate — initial boot persists a draft that would otherwise
  // pre-empt tests that manually set up STORAGE_KEY / LAST_CONFIG_KEY.
  await page.evaluate(() => localStorage.removeItem('dice_config_draft'));
});

// ── Boot / restore ─────────────────────────────────────────────────────────────

test('fresh page load seeds all pre-defined configurations', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.config-screen');
  const configs = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  const names = configs.map(c => c.description);
  for (const name of ['Chicago / Schock', 'Mia (Mäxchen)', 'Kniffel', 'Qwixx', 'Qwinto', 'Nochmal', 'DnD']) {
    expect(names).toContain(name);
  }
});

test('last config name is restored on page reload', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    const cfg = loadConfigurations().find(c => c.description === 'Kniffel');
    if (cfg) localStorage.setItem('dice_last_config', cfg.description);
    localStorage.removeItem('dice_config_draft');
  });
  await page.reload();
  await page.waitForSelector('.config-screen');
  await expect(page.locator('#config-name')).toHaveValue('Kniffel');
});

test('side type change persists across page reload (no explicit save)', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    const cfg = loadConfigurations().find(c => c.description === 'Kniffel');
    if (cfg) localStorage.setItem('dice_last_config', cfg.description);
  });
  await page.reload();
  await page.waitForSelector('.config-screen');
  // Sanity: side 1 of die 0 starts as PIPPED in Kniffel.
  expect(await page.evaluate(() => configState.diceConfigs[0].sideData[1].type)).toBe('PIPPED');
  // Mutate side 1 via the same code path the UI uses.
  await page.evaluate(() => {
    const cfg = configState.diceConfigs[0];
    const sd = cfg.sideData.slice();
    sd[1] = Object.assign({}, sd[1], { type: 'NUMBER', value: 42 });
    updateDiceConfig(0, Object.assign({}, cfg, { sideData: sd }));
  });
  await page.reload();
  await page.waitForSelector('.config-screen');
  const sd1 = await page.evaluate(() => configState.diceConfigs[0].sideData[1]);
  expect(sd1.type).toBe('NUMBER');
  expect(sd1.value).toBe(42);
});

test('maxRolls is preserved across page reload', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    const cfg = loadConfigurations().find(c => c.description === 'Kniffel');
    if (cfg) localStorage.setItem('dice_last_config', cfg.description);
    localStorage.removeItem('dice_config_draft');
  });
  await page.reload();
  await page.waitForSelector('#config-name');
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1/3');
});

test('missing maxRolls in stored config defaults to unlimited on restore', async ({ page }) => {
  await page.evaluate(() => {
    const cfg = {
      description: 'NoMaxRolls',
      numberOfDice: 1,
      diceConfigs: [{ sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: '#FFFFFF', shape: 'SQUARE' })) }],
      blockReThrowSeconds: 0,
      autoMysteryAfterRolls: 0,
      // maxRolls intentionally omitted to test the || 0 default on boot restore
    };
    localStorage.setItem('dice_configurations', JSON.stringify([cfg]));
    localStorage.setItem('dice_last_config', 'NoMaxRolls');
  });
  await page.reload();
  await page.waitForSelector('.config-screen');
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1');
});

test('stored config name with no match falls back to a blank form', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('dice_last_config', 'NonExistentConfig');
    localStorage.setItem('dice_configurations', JSON.stringify([]));
  });
  await page.reload();
  await page.waitForSelector('.config-screen');
  await expect(page.locator('#config-name')).toHaveValue('');
});

// ── Configuration CRUD ─────────────────────────────────────────────────────────

test('saveConfiguration persists to localStorage', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    saveConfiguration({ description: 'ToSave', numberOfDice: 1, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 });
  });
  const configs = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  expect(configs.some(c => c.description === 'ToSave')).toBe(true);
});

test('saveConfiguration updates an existing entry by description', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    saveConfiguration({ description: 'Upsert', numberOfDice: 1, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 });
    saveConfiguration({ description: 'Upsert', numberOfDice: 3, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 });
  });
  const configs = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  const matches = configs.filter(c => c.description === 'Upsert');
  expect(matches.length).toBe(1);
  expect(matches[0].numberOfDice).toBe(3);
});

test('deleteConfiguration removes the entry from localStorage', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    saveConfiguration({ description: 'ToDelete', numberOfDice: 1, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 });
    deleteConfiguration('ToDelete');
  });
  const configs = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  expect(configs.some(c => c.description === 'ToDelete')).toBe(false);
});

test('loadConfigurations returns a config as-is when diceConfigs field is absent', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    localStorage.setItem('dice_configurations', JSON.stringify([{ description: 'NoDiceConfigs' }]));
    return loadConfigurations();
  });
  expect(result[0].description).toBe('NoDiceConfigs');
});

test('loadDraft returns null on corrupt JSON', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    localStorage.setItem('dice_config_draft', '{corrupt!');
    return loadDraft();
  });
  expect(result).toBeNull();
});

test('saveDraft swallows localStorage errors', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) {
      if (k === 'dice_config_draft') throw new Error('quota');
      return orig.call(this, k, v);
    };
    try { saveDraft(); } finally { Storage.prototype.setItem = orig; }
  });
  // Reaching here means saveDraft did not propagate the error.
});

test('loadConfigurations returns an empty array on corrupt storage', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    localStorage.setItem('dice_configurations', '{corrupt json{{');
    return loadConfigurations();
  });
  expect(result).toEqual([]);
});

// ── View settings ──────────────────────────────────────────────────────────────

test('loadViewSettings returns an empty object when nothing is saved', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => { localStorage.removeItem('dice_view_settings'); return loadViewSettings(); });
  expect(result).toEqual({});
});

test('saveViewSettings and loadViewSettings round-trip correctly', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    const cfg = { description: 'vs', numberOfDice: 1, diceConfigs: [{ sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: '#FFFFFF', shape: 'SQUARE' })) }], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 };
    initRollingScreen(cfg);
    rollingState.diceSize = 1.5;
    rollingState.diceOrderMode = 'value';
    rollingState.swipeToRoll = false;
    saveViewSettings();
    return loadViewSettings();
  });
  expect(result.diceSize).toBe(1.5);
  expect(result.diceOrderMode).toBe('value');
  expect(result.swipeToRoll).toBe(false);
});

// ── Migration ──────────────────────────────────────────────────────────────────

test('migrateDiceConfig converts NUMBERS format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 6, contentType: 'NUMBERS', numbers: [1,2,3,4,5,6] }));
  expect(result.sideData[0].type).toBe('NUMBER');
  expect(result.sideData[0].value).toBe(1);
  expect(result.sideData.length).toBe(6);
});

test('migrateDiceConfig converts COLORS format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 3, contentType: 'COLORS', colors: ['#E53935', '#1E88E5', '#43A047'] }));
  expect(result.sideData[0].type).toBe('COLOR');
  expect(result.sideData[0].color).toBe('#E53935');
});

test('migrateDiceConfig converts COLORED_NUMBERS format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 2, contentType: 'COLORED_NUMBERS', coloredNumbers: [{ number: 7, color: '#E53935' }, { number: 8, color: '#1E88E5' }] }));
  expect(result.sideData[0].value).toBe(7);
  expect(result.sideData[0].color).toBe('#E53935');
});

test('migrateDiceConfig converts NUMBERS_WITH_COLORS format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 2, contentType: 'NUMBERS_WITH_COLORS', numbersWithColors: [{ number: 5, color: '#43A047' }, { number: 6, color: '#FDD835' }] }));
  expect(result.sideData[0].value).toBe(5);
  expect(result.sideData[0].color).toBe('#43A047');
});

test('migrateDiceConfig converts PIPPED format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 6, contentType: 'PIPPED', numbers: [1,2,3,4,5,6] }));
  expect(result.sideData[0].type).toBe('PIPPED');
  expect(result.sideData[0].value).toBe(1);
});

test('migrateDiceConfig converts TEXT format to sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 3, contentType: 'TEXT', textSymbols: ['A', 'B', 'C'] }));
  expect(result.sideData[0].type).toBe('TEXT');
  expect(result.sideData[0].value).toBe('A');
});

test('migrateDiceConfig falls back to NUMBER for an unknown contentType', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 2, contentType: 'UNKNOWN_TYPE' }));
  expect(result.sideData[0].type).toBe('NUMBER');
  expect(result.sideData[0].value).toBe(1);
  expect(result.sideData[1].value).toBe(2);
});

test('migrateDiceConfig defaults to 6 sides when the sides field is absent', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ contentType: 'NUMBERS', numbers: [1,2,3,4,5,6] }));
  expect(result.sides).toBe(6);
});

test('migrateDiceConfig backfills missing shape and color on existing sideData', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => migrateDiceConfig({ sides: 2, sideData: [
    { type: 'NUMBER', value: 1 },                              // no shape, no color — both backfilled
    { type: 'NUMBER', value: 2, color: '#E53935', shape: 'CIRCLE' }, // explicit values — should be preserved
  ] }));
  expect(result.sideData[0].shape).toBe('DEFAULT');
  expect(result.sideData[0].color).toBe('#FFFFFF');
  expect(result.sideData[1].shape).toBe('CIRCLE');
  expect(result.sideData[1].color).toBe('#E53935');
});

// ── Serialization ──────────────────────────────────────────────────────────────

test('serializeConfigs encodes colors as names and deserializeConfigs restores hex values', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    const configs = [{ description: 'RT Test', numberOfDice: 1, diceConfigs: [{ sides: 2, sideData: [{ type: 'NUMBER', value: 1, color: '#E53935', shape: 'SQUARE' }, { type: 'NUMBER', value: 2, color: '#1E88E5', shape: 'SQUARE' }] }], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 }];
    const serialized = serializeConfigs(configs);
    // Colors should be stored as names (e.g. "RED") in the serialized form
    const deserialized = deserializeConfigs(serialized);
    return { sideName: serialized.configurations[0].diceConfigs[0].sideData[0].color, sideHex: deserialized[0].diceConfigs[0].sideData[0].color };
  });
  expect(result.sideName).toBe('RED');
  expect(result.sideHex).toBe('#E53935');
});

test('deserializeConfigs throws on invalid format', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const threw = await page.evaluate(() => { try { deserializeConfigs({}); return false; } catch(e) { return true; } });
  expect(threw).toBe(true);
});

// ── Utility functions ──────────────────────────────────────────────────────────

test('updateDiceConfigSides grows sideData using baseColor', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => updateDiceConfigSides({ sides: 4, baseType: 'NUMBER', baseColor: '#E53935', baseShape: 'SQUARE', sideData: [1,2,3,4].map(n => ({ type: 'NUMBER', value: n, color: '#E53935', shape: 'SQUARE' })) }, 6));
  expect(result.sides).toBe(6);
  expect(result.sideData.length).toBe(6);
  expect(result.sideData[4].color).toBe('#E53935');
  expect(result.sideData[5].color).toBe('#E53935');
});

test('updateDiceConfigSides shrinks sideData to the new count', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => updateDiceConfigSides({ sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'NUMBER', value: n, color: '#FFFFFF', shape: 'SQUARE' })) }, 3));
  expect(result.sides).toBe(3);
  expect(result.sideData.length).toBe(3);
});

test('createDefaultDiceConfig defaults to 6 sides when called without arguments', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => createDefaultDiceConfig());
  expect(result.sides).toBe(6);
  expect(result.sideData.length).toBe(6);
});

test('naturalCompare sorts strings with embedded numbers in natural order', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => ['file10', 'file2', 'file1'].sort(naturalCompare));
  expect(result).toEqual(['file1', 'file2', 'file10']);
});

test('cn helper returns an object with number and color fields', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => cn(7, '#FF0000'))).toEqual({ number: 7, color: '#FF0000' });
});
