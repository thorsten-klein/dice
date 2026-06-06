import { test, expect, gotoApp } from './fixtures.js';

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await gotoApp(page, baseURL);
});

// ── Configurations configurations modal ───────────────────────────────────────────────

test('toggle-configurations button is labelled "Saved Configurations"', async ({ page }) => {
  await expect(page.locator('#toggle-configurations')).toContainText('Saved Configurations');
});

test('clicking toggle-configurations opens a modal without navigating away', async ({ page }) => {
  await page.click('#toggle-configurations');
  await expect(page.locator('#configurations-modal-overlay')).toBeVisible();
  await expect(page.locator('.config-screen')).toBeVisible();
});

test('configurations modal title reads "Configurations"', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('#configurations-modal-overlay');
  await expect(page.locator('#configurations-modal-overlay .modal-title')).toHaveText('Configurations');
});

test('configurations modal closes via X button', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('#configurations-modal-overlay');
  await page.click('#close-configurations-btn');
  await expect(page.locator('#configurations-modal-overlay')).toBeHidden();
});

test('configurations modal closes via overlay click', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('#configurations-modal-overlay');
  await page.click('#configurations-modal-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#configurations-modal-overlay')).toBeHidden();
});

test('first entry in configurations list is "+ New configuration"', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('#configurations-modal-overlay');
  const first = await page.locator('.configurations-list > *').first().textContent();
  expect(first).toContain('New configuration');
});

test('reset button in configurations modal is labelled "Reset"', async ({ page }) => {
  await page.click('#toggle-configurations');
  await expect(page.locator('#reset-configs-btn')).toContainText('Reset');
});

test('configurations modal has import and export buttons', async ({ page }) => {
  await page.click('#toggle-configurations');
  await expect(page.locator('#import-configs-btn')).toBeVisible();
  await expect(page.locator('#export-configs-btn')).toBeVisible();
});

test('configurations list shows "By Name" sort bar active by default', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('.configurations-sort-bar');
  await expect(page.locator('[data-configurations-sort="name"].active')).toBeVisible();
  await expect(page.locator('[data-configurations-sort="dice"].active')).toBeHidden();
});

test('configurations list is sorted by name ascending by default', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('.configurations-card-info');
  const names = await page.$$eval('.configurations-card-info .configurations-name', els => els.map(e => e.textContent));
  const sorted = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  expect(names).toEqual(sorted);
});

test('clicking "By Dice" sorts by number of dice and activates the button', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('[data-configurations-sort="dice"]');
  await page.locator('[data-configurations-sort="dice"]').click();
  await expect(page.locator('[data-configurations-sort="dice"].active')).toBeVisible();
  const metas = await page.$$eval('.configurations-card-info .configurations-meta', els => els.map(e => parseInt(e.textContent)));
  const sorted = [...metas].sort((a, b) => a - b);
  expect(metas).toEqual(sorted);
});

test('clicking the active sort button toggles between ascending and descending', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('[data-configurations-sort="name"]');
  // Default is ascending — click to switch to descending
  await page.locator('[data-configurations-sort="name"]').click();
  await expect(page.locator('[data-configurations-sort="name"]')).toContainText('↓');
  const names = await page.$$eval('.configurations-card-info .configurations-name', els => els.map(e => e.textContent));
  const descSorted = [...names].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
  expect(names).toEqual(descSorted);
});

test('clicking a different sort button resets to ascending', async ({ page }) => {
  await page.click('#toggle-configurations');
  // Switch to By Dice
  await page.locator('[data-configurations-sort="dice"]').click();
  // Toggle to descending
  await page.locator('[data-configurations-sort="dice"]').click();
  await expect(page.locator('[data-configurations-sort="dice"]')).toContainText('↓');
  // Switch back to By Name — should reset to ascending
  await page.locator('[data-configurations-sort="name"]').click();
  await expect(page.locator('[data-configurations-sort="name"]')).toContainText('↑');
});

test('sort tie-break keeps order stable (equal values produce no error)', async ({ page }) => {
  // Both Qwixx and Qwinto have 3 dice — sorting by dice should not throw
  await page.evaluate(() => {
    const equal = [
      { description: 'Alpha', numberOfDice: 3, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 },
      { description: 'Beta',  numberOfDice: 3, diceConfigs: [], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 },
    ];
    localStorage.setItem('dice_configurations', JSON.stringify(equal));
    configState.showConfigurations = true;
    configState.configsSortKey = 'dice';
    configState.configsSortAsc = true;
    renderConfigScreen();
  });
  await page.waitForSelector('.configurations-sort-bar');
  // Both cards appear — no crash
  const names = await page.$$eval('.configurations-card-info .configurations-name', els => els.map(e => e.textContent));
  expect(names).toContain('Alpha');
  expect(names).toContain('Beta');
});

test('loading a config from configurations fills the form', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('.configurations-card-info');
  await page.locator('.configurations-card-info').filter({ hasText: 'Kniffel' }).click();
  await expect(page.locator('#config-name')).toHaveValue('Kniffel');
});

test('deleting a config from configurations reduces the count by 1', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('.configurations-card-info');
  const before = await page.locator('.configurations-card-info').count();
  await page.locator('[data-delete="Chicago / Schock"]').click();
  expect(await page.locator('.configurations-card-info').count()).toBe(before - 1);
});

test('"+ New configuration" resets the config form', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.locator('.configurations-card-info').filter({ hasText: 'Kniffel' }).click();
  await expect(page.locator('#config-name')).toHaveValue('Kniffel');
  await page.click('#toggle-configurations');
  await page.click('#new-config-btn');
  await expect(page.locator('#config-name')).toHaveValue('');
});

test('reset restores all pre-defined configurations', async ({ page, baseURL }) => {
  // Delete all configs first so reset has something meaningful to restore
  await page.evaluate(() => { localStorage.removeItem('dice_configurations'); });
  await gotoApp(page, baseURL);
  await page.click('#toggle-configurations');
  await page.click('#reset-configs-btn');
  // Confirm the confirm modal
  await page.waitForSelector('.modal-overlay .btn-green');
  await page.locator('.modal-overlay .btn-green').click();
  await page.waitForSelector('.config-screen');
  await page.click('#toggle-configurations');
  const names = await page.$$eval('.configurations-name', els => els.map(e => e.textContent));
  expect(names).toContain('Kniffel');
});

// ── Export / Import ────────────────────────────────────────────────────────────

test('export button triggers download without error', async ({ page }) => {
  await page.click('#toggle-configurations');
  await page.waitForSelector('#export-configs-btn');
  // The native download dialog won't appear in headless mode, but a JS error would still be caught
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.click('#export-configs-btn');
  expect(error).toBeNull();
});

test('import button triggers file input without error', async ({ page }) => {
  await page.click('#toggle-configurations');
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.click('#import-configs-btn');
  expect(error).toBeNull();
});

test('importing valid JSON merges configs and shows a success toast', async ({ page }) => {
  await page.click('#toggle-configurations');
  // The file input is display:none — wait for it to be in the DOM, not visible
  await page.waitForSelector('#import-file-input', { state: 'attached' });
  const validJson = JSON.stringify({
    colors: { RED: '#E53935' },
    configurations: [{
      description: 'Imported Config',
      numberOfDice: 1,
      diceConfigs: [{ sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: '#FFFFFF', shape: 'SQUARE' })) }],
      blockReThrowSeconds: 0,
      autoMysteryAfterRolls: 0,
      maxRolls: 0,
    }],
  });
  await page.evaluate((json) => {
    const file = new File([json], 'test.json', { type: 'application/json' });
    const input = document.getElementById('import-file-input');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  }, validJson);
  await expect(page.locator('#toast')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#toast')).toContainText('Imported');
  const configs = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  expect(configs.some(c => c.description === 'Imported Config')).toBe(true);
});

test('importing invalid JSON shows an error toast', async ({ page }) => {
  await page.click('#toggle-configurations');
  // The file input is display:none — wait for it to be in the DOM, not visible
  await page.waitForSelector('#import-file-input', { state: 'attached' });
  await page.evaluate(() => {
    const file = new File(['not valid json {{{'], 'bad.json', { type: 'application/json' });
    const input = document.getElementById('import-file-input');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#toast')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#toast')).toContainText('Invalid');
});

test('importing with no file selected does nothing', async ({ page }) => {
  await page.click('#toggle-configurations');
  // The file input is display:none — wait for it to be in the DOM, not visible
  await page.waitForSelector('#import-file-input', { state: 'attached' });
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.evaluate(() => {
    document.getElementById('import-file-input').dispatchEvent(new Event('change'));
  });
  expect(error).toBeNull();
});

test('serialized config uses color names not hex values', async ({ page }) => {
  const serialized = await page.evaluate(() => {
    const configs = [{ description: 'T', numberOfDice: 1, diceConfigs: [{ sides: 1, sideData: [{ type: 'NUMBER', value: 1, color: '#E53935', shape: 'SQUARE' }] }], blockReThrowSeconds: 0, autoMysteryAfterRolls: 0, maxRolls: 0 }];
    return serializeConfigs(configs);
  });
  expect(serialized.configurations[0].diceConfigs[0].sideData[0].color).not.toMatch(/^#/);
  expect(serialized.configurations[0].diceConfigs[0].sideData[0].color).toBe('RED');
});

test('serialized config defines a color palette at the top level', async ({ page }) => {
  const serialized = await page.evaluate(() => serializeConfigs(loadConfigurations()));
  expect(serialized.colors).toBeDefined();
  expect(typeof serialized.colors).toBe('object');
});

// ── Config form ────────────────────────────────────────────────────────────────

test('game settings section heading reads "Game Settings"', async ({ page }) => {
  await expect(page.locator('.config-screen .settings-section-title')).toContainText('Game Settings');
});

test('config name input updates the field value', async ({ page }) => {
  await page.fill('#config-name', 'My Dice');
  await expect(page.locator('#config-name')).toHaveValue('My Dice');
});

test('dice count plus button increments', async ({ page }) => {
  const before = await page.locator('.counter-value.accent-purple').textContent();
  await page.click('#dice-plus');
  expect(parseInt(await page.locator('.counter-value.accent-purple').textContent())).toBe(parseInt(before) + 1);
});

test('dice count minus button decrements to a minimum of 1', async ({ page }) => {
  await page.click('#dice-minus');
  expect(parseInt(await page.locator('.counter-value.accent-purple').textContent())).toBe(1);
});

test('save button shows an error toast when name is empty', async ({ page }) => {
  await page.click('#save-btn');
  await expect(page.locator('#toast')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('name');
});

test('empty name error uses red toast styling', async ({ page }) => {
  await page.click('#save-btn');
  await expect(page.locator('#toast.toast-error')).toBeVisible();
});

test('save button persists the config to localStorage', async ({ page }) => {
  await page.fill('#config-name', 'Test Save');
  await page.click('#save-btn');
  await expect(page.locator('#toast')).toContainText('Test Save');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_configurations') || '[]'));
  expect(saved.some(c => c.description === 'Test Save')).toBe(true);
});

test('start button navigates to the rolling screen', async ({ page }) => {
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await expect(page.locator('.rolling-screen')).toBeVisible();
});

test('returning from the game screen preserves config form state', async ({ page }) => {
  await page.fill('#config-name', 'Preserved Name');
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await page.click('#back-btn');
  await page.waitForSelector('#back-confirm-ok');
  await page.click('#back-confirm-ok');
  await page.waitForSelector('.config-screen');
  await expect(page.locator('#config-name')).toHaveValue('Preserved Name');
});

// ── Game settings inline on config screen ─────────────────────────────────────

test('block re-throw input updates via + and − buttons', async ({ page }) => {
  await page.waitForSelector('#block-val');
  await page.locator('[data-setting-incr="block-val"]').click();
  expect(parseInt(await page.locator('#block-val').inputValue())).toBeGreaterThan(0);
  await page.locator('[data-setting-decr="block-val"]').click();
  expect(await page.locator('#block-val').inputValue()).toBe('Off');
});

test('loadGameSettings returns null on corrupt storage', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    localStorage.setItem('dice_game_settings', '{corrupt{{');
    return loadGameSettings();
  });
  expect(result).toBeNull();
});

test('loadGameSettings returns null when storage contains JSON null', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const result = await page.evaluate(() => {
    localStorage.setItem('dice_game_settings', 'null');
    return loadGameSettings();
  });
  expect(result).toBeNull();
});


test('buildGameSettingRow without suffix renders a number input', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const html = await page.evaluate(() => buildGameSettingRow('', 'test-val', 'Test', 5, 'hint'));
  expect(html).toContain('type="number"');
  expect(html).toContain('value="5"');
});

test('game settings persist per config: load → refresh keeps settings, change → refresh keeps change, reload config → original settings restored', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);

  // Save a named config first, then set block=2 (so it's saved under 'GSTest' key)
  await page.fill('#config-name', 'GSTest');
  await page.click('#save-btn');
  await page.locator('[data-setting-incr="block-val"]').click();
  await page.locator('[data-setting-incr="block-val"]').click();
  expect(await page.locator('#block-val').inputValue()).toBe('2s');

  // Reload — settings should still be 2s (saved under 'GSTest' key)
  await page.evaluate(() => localStorage.setItem('dice_last_config', 'GSTest'));
  await page.reload();
  await page.waitForSelector('.config-screen');
  expect(await page.locator('#block-val').inputValue()).toBe('2s');

  // Change to 3s
  await page.locator('[data-setting-incr="block-val"]').click();
  expect(await page.locator('#block-val').inputValue()).toBe('3s');

  // Reload — changed value (3s) should be kept
  await page.reload();
  await page.waitForSelector('.config-screen');
  expect(await page.locator('#block-val').inputValue()).toBe('3s');

  // Load the same saved config from history — should restore the saved value (Off = 0, saved when save-btn was clicked)
  await page.click('#toggle-configurations');
  await page.locator('.configurations-card-info').filter({ hasText: 'GSTest' }).click();
  expect(await page.locator('#block-val').inputValue()).toBe('Off');

  // Reload — session key now belongs to this config (3s from last interaction) but history load cleared it.
  // After history load, save-btn values win. Refresh should keep those (Off).
  await page.evaluate(() => localStorage.setItem('dice_last_config', 'GSTest'));
  await page.reload();
  await page.waitForSelector('.config-screen');
  expect(await page.locator('#block-val').inputValue()).toBe('Off');
});

test('auto-mystery input is visible and updates state via direct entry', async ({ page }) => {
  await page.waitForSelector('#mystery-val');
  await page.locator('#mystery-val').fill('3');
  await page.locator('#mystery-val').dispatchEvent('change');
  expect(await page.locator('#mystery-val').inputValue()).toBe('3');
});

test('max rolls input is visible and updates state via direct entry', async ({ page }) => {
  await page.waitForSelector('#limit-rolls-val');
  await page.locator('#limit-rolls-val').fill('5');
  await page.locator('#limit-rolls-val').dispatchEvent('change');
  expect(await page.locator('#limit-rolls-val').inputValue()).toBe('5');
});

test('confirm-restart toggle is visible and defaults to on', async ({ page }) => {
  await page.waitForSelector('#confirm-restart', { state: 'attached' });
  expect(await page.locator('#confirm-restart').isChecked()).toBe(true);
});

test('allow-unlock toggle is visible and defaults to on', async ({ page }) => {
  await page.waitForSelector('#allow-unlock', { state: 'attached' });
  expect(await page.locator('#allow-unlock').isChecked()).toBe(true);
});

test('confirm-restart toggle can be turned off', async ({ page }) => {
  await page.waitForSelector('#confirm-restart', { state: 'attached' });
  await page.locator('label.toggle-switch:has(#confirm-restart) .toggle-slider').click();
  expect(await page.locator('#confirm-restart').isChecked()).toBe(false);
  expect(await page.evaluate(() => configState.confirmRestartWhenMystery)).toBe(false);
});

test('allow-unlock toggle can be turned off', async ({ page }) => {
  await page.waitForSelector('#allow-unlock', { state: 'attached' });
  await page.locator('label.toggle-switch:has(#allow-unlock) .toggle-slider').click();
  expect(await page.locator('#allow-unlock').isChecked()).toBe(false);
  expect(await page.evaluate(() => configState.allowUnlockAfterRoll)).toBe(false);
});

// ── Confirm modal ──────────────────────────────────────────────────────────────

test('confirm modal confirm button is green', async ({ page }) => {
  await page.evaluate(() => showConfirmModal('Test?', () => {}));
  await page.waitForSelector('.modal-overlay');
  await expect(page.locator('#confirm-modal-ok')).toHaveClass(/btn-green/);
});

test('confirm modal cancel button is red', async ({ page }) => {
  await page.evaluate(() => showConfirmModal('Test?', () => {}));
  await page.waitForSelector('.modal-overlay');
  await expect(page.locator('#confirm-modal-cancel')).toHaveClass(/btn-danger/);
});

test('confirm modal cancel button closes the modal', async ({ page }) => {
  await page.evaluate(() => { showConfirmModal('Are you sure?', () => {}); });
  await page.waitForSelector('.modal-overlay');
  await page.click('#confirm-modal-cancel');
  await expect(page.locator('.modal-overlay')).toBeHidden();
});

// ── Pre-defined games ──────────────────────────────────────────────────────────

test('default new configuration starts with one pipped d6', async ({ page }) => {
  const state = await page.evaluate(() => ({ cfg: configState.diceConfigs[0], count: configState.numberOfDice }));
  expect(state.cfg.sides).toBe(6);
  expect(state.cfg.sideData[0].type).toBe('PIPPED');
  expect(state.count).toBe(1);
});

test('all expected pre-defined configurations are present', async ({ page }) => {
  await page.click('#toggle-configurations');
  const names = await page.$$eval('.configurations-name', els => els.map(e => e.textContent));
  for (const name of ['1 common die', '5 common dice', '6 common dice', 'Zehntausend', 'Chicago / Schock', 'Mia (Mäxchen)', 'Kniffel', 'Kribbeln', 'Qwixx', 'Qwinto', 'Nochmal', 'DnD']) {
    expect(names).toContain(name);
  }
});

test('Kniffel has 5 pipped d6 dice with maxRolls of 3', async ({ page }) => {
  const cfg = await page.evaluate(() => loadConfigurations().find(c => c.description === 'Kniffel'));
  expect(cfg.numberOfDice).toBe(5);
  expect(cfg.maxRolls).toBe(3);
  cfg.diceConfigs.forEach(dc => {
    expect(dc.sides).toBe(6);
    expect(dc.sideData.every(s => s.type === 'PIPPED')).toBe(true);
  });
});

test('Kribbeln has 6 pipped d6 dice and forms a Latin square', async ({ page }) => {
  const cfg = await page.evaluate(() => loadConfigurations().find(c => c.description === 'Kribbeln'));
  expect(cfg.numberOfDice).toBe(6);
  expect(cfg.diceConfigs.length).toBe(6);

  cfg.diceConfigs.forEach((dc, i) => {
    expect(dc.sides).toBe(6);
    expect(dc.sideData.length).toBe(6);
    dc.sideData.forEach(s => expect(s.type).toBe('PIPPED'));

    // Each die has all 6 distinct colors
    const colors = new Set(dc.sideData.map(s => s.color));
    expect(colors.size).toBe(6);
  });

  // Each (value, color) combination appears exactly once across all dice
  const pairs = {};
  cfg.diceConfigs.forEach(dc => {
    dc.sideData.forEach(s => {
      const key = s.value + '|' + s.color;
      pairs[key] = (pairs[key] || 0) + 1;
    });
  });
  Object.values(pairs).forEach(count => expect(count).toBe(1));
  expect(Object.keys(pairs).length).toBe(36);
});

test('DnD uses NUMBER type dice with TRIANGLE shape', async ({ page }) => {
  const cfg = await page.evaluate(() => loadConfigurations().find(c => c.description === 'DnD'));
  expect(cfg.diceConfigs[0].sideData[0].type).toBe('NUMBER');
  expect(cfg.diceConfigs[0].sideData[0].shape).toBe('TRIANGLE');
});

test('all non-DnD pre-defined games use only pipped dice (or "?"/colored-shape sides)', async ({ page }) => {
  const configs = await page.evaluate(() => loadConfigurations().filter(c => c.description !== 'DnD'));
  configs.forEach(cfg => {
    cfg.diceConfigs.forEach(dc => {
      dc.sideData.forEach(s => {
        if (s.type === 'TEXT') expect(['?', '']).toContain(s.value);
        else expect(s.type).toBe('PIPPED');
      });
    });
  });
});

// ── initConfigScreen ───────────────────────────────────────────────────────────

test('initConfigScreen exits fullscreen when fullscreen is active', async ({ page }) => {
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.evaluate(() => {
    document.exitFullscreen = () => Promise.resolve();
    Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true });
    initConfigScreen();
  });
  await page.waitForSelector('.config-screen');
  expect(error).toBeNull();
});
