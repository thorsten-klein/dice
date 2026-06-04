import { test, expect, gotoApp } from './fixtures.js';

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await gotoApp(page, baseURL);
});

// ── Dice configuration modal ───────────────────────────────────────────────────

test('dice preview chip opens dice configuration modal', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('#dice-modal-overlay');
  await expect(page.locator('#dice-modal-overlay')).toBeVisible();
});

test('dice configuration modal title reads "Configuration: Dice N"', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('#dice-modal-overlay');
  await expect(page.locator('#dice-modal-overlay .modal-title')).toHaveText('Configuration: Dice 1');
});

test('dice configuration modal closes via X button', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('#close-dice-modal-btn');
  await page.click('#close-dice-modal-btn');
  await expect(page.locator('#dice-modal-overlay')).toBeHidden();
});

test('dice configuration modal closes via overlay click', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('#dice-modal-overlay');
  await page.click('#dice-modal-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#dice-modal-overlay')).toBeHidden();
});

test('sides plus button increments side count', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-sides-plus="0"]');
  const before = await page.locator('.counter-value.accent-blue').first().textContent();
  await page.locator('[data-sides-plus="0"]').click();
  const after = await page.locator('.counter-value.accent-blue').first().textContent();
  expect(parseInt(after)).toBe(parseInt(before) + 1);
});

test('sides minus button decrements to a minimum of 2', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-sides-minus="0"]');
  for (let i = 0; i < 10; i++) await page.locator('[data-sides-minus="0"]').click();
  expect(parseInt(await page.locator('.counter-value.accent-blue').first().textContent())).toBe(2);
});

// ── Sides table ────────────────────────────────────────────────────────────────

test('sides table columns are in order: #, Type, Shape, Color, Value', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('.sides-hdr');
  const headers = await page.locator('.sides-hdr span').allTextContents();
  expect(headers[0]).toBe('#');
  expect(headers[1]).toBe('Type');
  expect(headers[2]).toBe('Shape');
  expect(headers[3]).toBe('Color');
  expect(headers[4]).toMatch(/Value/);
});

test('COLOR side type renders a dash in the value cell', async ({ page }) => {
  await page.evaluate(() => {
    configState.diceConfigs[0] = { sides: 1, sideData: [{ type: 'COLOR', value: null, color: '#E53935', shape: 'SQUARE' }] };
    configState.dicePreviewModal = 0;
    renderConfigScreen();
  });
  await page.waitForSelector('#dice-modal-overlay');
  await expect(page.locator('.side-none')).toBeVisible();
});

test('pipped value dropdown includes 0 as an option', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-side-pip="0"]');
  const options = await page.locator('[data-side-pip="0"] option').allTextContents();
  expect(options[0]).toMatch(/^0/);
});

test('pip selector updates the selected value', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-side-pip="0"]');
  await page.locator('[data-side-pip="0"]').selectOption('3');
  expect(await page.locator('[data-side-pip="0"]').inputValue()).toBe('3');
});

// ── Type picker ────────────────────────────────────────────────────────────────

test('type picker modal title reads "Select Type" with subtitle "Dice N - Side N"', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#type-picker-overlay');
  await expect(page.locator('#type-picker-overlay .modal-title')).toHaveText('Select Type');
  await expect(page.locator('#type-picker-overlay .modal-subtitle')).toHaveText('Dice 1 - Side 1');
});

test('type picker selects NUMBER and closes', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#type-picker-overlay');
  await page.locator('[data-type-swatch="NUMBER"]').click();
  await expect(page.locator('#type-picker-overlay')).toBeHidden();
});

test('basic type change preserves values of sides already on that type', async ({ page }) => {
  await page.evaluate(() => {
    const cfg = configState.diceConfigs[0];
    const sd = cfg.sideData.slice();
    sd[0] = { type: 'TEXT', value: 'Hello', color: '#FFFFFF', shape: 'DEFAULT' };
    sd[1] = { type: 'TEXT', value: 'World', color: '#FFFFFF', shape: 'DEFAULT' };
    updateDiceConfig(0, Object.assign({}, cfg, { sideData: sd }));
  });
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-type-pick="-1"][data-dice="0"]');
  await page.locator('[data-type-pick="-1"][data-dice="0"]').click();
  await page.waitForSelector('[data-type-swatch="TEXT"]');
  await page.locator('[data-type-swatch="TEXT"]').click();
  const sd = await page.evaluate(() => configState.diceConfigs[0].sideData);
  expect(sd[0].value).toBe('Hello');
  expect(sd[1].value).toBe('World');
  // Side 2 was PIPPED so it should have been reset to '' on TEXT
  expect(sd[2].value).toBe('');
});

test('basic color change applies to every side and updates baseColor', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-color-pick="-1"][data-dice="0"]');
  await page.locator('[data-color-pick="-1"][data-dice="0"]').click();
  await page.waitForSelector('[data-color-swatch="#E53935"]');
  await page.locator('[data-color-swatch="#E53935"]').click();
  const cfg = await page.evaluate(() => configState.diceConfigs[0]);
  expect(cfg.baseColor).toBe('#E53935');
  for (const s of cfg.sideData) expect(s.color).toBe('#E53935');
});

test('basic shape change applies to every side and updates baseShape', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.waitForSelector('[data-shape-pick="-1"][data-dice="0"]');
  await page.locator('[data-shape-pick="-1"][data-dice="0"]').click();
  await page.waitForSelector('[data-shape-swatch="CIRCLE"]');
  await page.locator('[data-shape-swatch="CIRCLE"]').click();
  const cfg = await page.evaluate(() => configState.diceConfigs[0]);
  expect(cfg.baseShape).toBe('CIRCLE');
  for (const s of cfg.sideData) expect(s.shape).toBe('CIRCLE');
});

test('type picker selects TEXT and shows text input', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="TEXT"]').click();
  await expect(page.locator('.side-inp').first()).toBeVisible();
});

test('type picker selects PIPPED and shows pip dropdown', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  // Switch to NUMBER first (since default is PIPPED), then back to PIPPED
  await page.locator('[data-type-swatch="NUMBER"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="PIPPED"]').click();
  await expect(page.locator('.side-sel').first()).toBeVisible();
});

test('type picker closes via X button', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#close-type-picker-btn');
  await page.click('#close-type-picker-btn');
  await expect(page.locator('#type-picker-overlay')).toBeHidden();
});

test('type picker closes via overlay click', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#type-picker-overlay');
  await page.click('#type-picker-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#type-picker-overlay')).toBeHidden();
});

test('type picker falls back to NUMBER when side has no type field', async ({ page }) => {
  await page.evaluate(() => {
    configState.diceConfigs[0].sideData[0] = { value: 1, color: '#FFFFFF', shape: 'SQUARE' };
    configState.typePickerModal = { sideIndex: 0, diceIndex: 0 };
    configState.dicePreviewModal = 0;
    renderConfigScreen();
  });
  await page.waitForSelector('#type-picker-overlay');
  await expect(page.locator('[data-type-swatch="NUMBER"].active')).toBeVisible();
});

// ── Number value editing ───────────────────────────────────────────────────────

test('number increment button increases value by 1', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="NUMBER"]').click();
  await page.waitForSelector('[data-side-incr="0"]');
  const before = await page.locator('[data-side-value="0"]').inputValue();
  await page.locator('[data-side-incr="0"]').click();
  expect(parseInt(await page.locator('[data-side-value="0"]').inputValue())).toBe(parseInt(before) + 1);
});

test('number decrement button does not go below 0', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="NUMBER"]').click();
  await page.waitForSelector('[data-side-decr="0"]');
  for (let i = 0; i < 10; i++) await page.locator('[data-side-decr="0"]').click();
  expect(parseInt(await page.locator('[data-side-value="0"]').inputValue())).toBe(0);
});

test('number value input accepts direct entry', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="NUMBER"]').click();
  await page.waitForSelector('[data-side-value="0"]');
  await page.locator('[data-side-value="0"]').fill('42');
  await page.locator('[data-side-value="0"]').dispatchEvent('change');
  await expect(page.locator('[data-side-value="0"]')).toHaveValue('42');
});

test('text input accepts and stores text value', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-type-pick="0"][data-dice="0"]').click();
  await page.locator('[data-type-swatch="TEXT"]').click();
  await page.waitForSelector('[data-side-text="0"]');
  await page.locator('[data-side-text="0"]').fill('Hi');
  await page.locator('[data-side-text="0"]').dispatchEvent('change');
  await expect(page.locator('[data-side-text="0"]')).toHaveValue('Hi');
});

// ── Color picker ───────────────────────────────────────────────────────────────

test('color picker modal title reads "Select Color" with subtitle "Dice N - Side N"', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-color-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#color-picker-overlay');
  await expect(page.locator('#color-picker-overlay .modal-title')).toHaveText('Select Color');
  await expect(page.locator('#color-picker-overlay .modal-subtitle')).toHaveText('Dice 1 - Side 1');
});

test('color picker selects a swatch and closes', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-color-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#color-picker-overlay');
  await page.locator('[data-color-swatch="#E53935"]').click();
  await expect(page.locator('#color-picker-overlay')).toBeHidden();
});

test('color picker closes via X button', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-color-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#close-color-picker-btn');
  await page.click('#close-color-picker-btn');
  await expect(page.locator('#color-picker-overlay')).toBeHidden();
});

test('color picker closes via overlay click', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-color-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#color-picker-overlay');
  await page.click('#color-picker-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#color-picker-overlay')).toBeHidden();
});

// ── Shape (Form) picker ────────────────────────────────────────────────────────

test('shape picker modal title reads "Select Shape" with subtitle "Dice N - Side N"', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-shape-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#shape-picker-overlay');
  await expect(page.locator('#shape-picker-overlay .modal-title')).toHaveText('Select Shape');
  await expect(page.locator('#shape-picker-overlay .modal-subtitle')).toHaveText('Dice 1 - Side 1');
});

test('shape picker selects a shape and closes', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-shape-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#shape-picker-overlay');
  await page.locator('[data-shape-swatch="CIRCLE"]').click();
  await expect(page.locator('#shape-picker-overlay')).toBeHidden();
});

test('shape picker closes via X button', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-shape-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#close-shape-picker-btn');
  await page.click('#close-shape-picker-btn');
  await expect(page.locator('#shape-picker-overlay')).toBeHidden();
});

test('shape picker closes via overlay click', async ({ page }) => {
  await page.locator('[data-preview-open="0"]').click();
  await page.locator('[data-shape-pick="0"][data-dice="0"]').click();
  await page.waitForSelector('#shape-picker-overlay');
  await page.click('#shape-picker-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#shape-picker-overlay')).toBeHidden();
});

test('shape picker falls back to DEFAULT when side has no shape field', async ({ page }) => {
  await page.evaluate(() => {
    configState.diceConfigs[0].sideData[0] = { type: 'NUMBER', value: 1, color: '#FFFFFF' };
    configState.shapePickerModal = { sideIndex: 0, diceIndex: 0 };
    configState.dicePreviewModal = 0;
    renderConfigScreen();
  });
  await page.waitForSelector('#shape-picker-overlay');
  await expect(page.locator('[data-shape-swatch="DEFAULT"].active')).toBeVisible();
});
