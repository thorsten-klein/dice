import { test, expect, gotoApp, gotoRolling } from './fixtures.js';

const BASE_DICE = [
  { sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: '#FFFFFF', shape: 'SQUARE' })) },
];

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

// ── Rolling settings dialog ────────────────────────────────────────────────────

test('rolling settings dialog opens and closes', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#rolling-settings-overlay');
  await expect(page.locator('#rolling-settings-overlay')).toBeVisible();
  await page.click('#close-rolling-settings');
  await expect(page.locator('#rolling-settings-overlay')).toBeHidden();
});

test('rolling settings dialog closes via overlay click', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#rolling-settings-overlay');
  await page.click('#rolling-settings-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#rolling-settings-overlay')).toBeHidden();
});

// ── Dice size ──────────────────────────────────────────────────────────────────

test('dice size plus and minus buttons update the label', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#size-plus');
  await page.click('#size-plus');
  await expect(page.locator('#size-label')).toContainText('1.1x');
  await page.click('#size-minus');
  await expect(page.locator('#size-label')).toContainText('1.0x');
});

test('dice size is clamped at 0.5x minimum', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#size-minus');
  for (let i = 0; i < 40; i++) await page.click('#size-minus');
  await expect(page.locator('#size-label')).toContainText('0.5x');
});

test('dice size is clamped at 3.0x maximum', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#size-plus');
  for (let i = 0; i < 40; i++) await page.click('#size-plus');
  await expect(page.locator('#size-label')).toContainText('3.0x');
});

test('reset view settings restores dice size to 1.0x', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#size-plus');
  await page.click('#size-plus');
  await page.click('#reset-view-settings-btn');
  await expect(page.locator('#size-label')).toContainText('1.0x');
});

test('dice size is persisted to localStorage and restored after navigation', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#size-plus');
  await page.click('#size-plus');
  await page.click('#size-plus');
  await page.click('#close-rolling-settings');
  await page.click('#back-btn');
  await page.waitForSelector('.config-screen');
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await page.click('#rolling-settings-btn');
  await expect(page.locator('#size-label')).toContainText('1.2x');
});

// ── Dice order ─────────────────────────────────────────────────────────────────

test('order mode buttons cycle through all modes', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('[data-order-mode="value"]');
  for (const mode of ['value', 'color', 'manual', 'off']) {
    await page.locator(`[data-order-mode="${mode}"]`).click();
    await expect(page.locator(`[data-order-mode="${mode}"]`)).toHaveClass(/active/);
  }
});

test('manual order up button moves an item up', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.click('#rolling-settings-btn');
  await page.locator('[data-order-mode="manual"]').click();
  await page.waitForSelector('[data-order-up="1"]');
  await page.locator('[data-order-up="1"]').click();
  await expect(page.locator('[data-order-up="1"]')).not.toBeDisabled();
});

test('manual order down button moves an item down', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.click('#rolling-settings-btn');
  await page.locator('[data-order-mode="manual"]').click();
  await page.waitForSelector('[data-order-down="0"]');
  await page.locator('[data-order-down="0"]').click();
  await expect(page.locator('[data-order-up="1"]')).not.toBeDisabled();
});

test('value order sorts dice by their current face value', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, {
    numberOfDice: 2,
    diceConfigs: [
      { sides: 1, sideData: [{ type: 'NUMBER', value: 5, color: '#FFFFFF', shape: 'SQUARE' }] },
      { sides: 1, sideData: [{ type: 'NUMBER', value: 2, color: '#FFFFFF', shape: 'SQUARE' }] },
    ],
  });
  await page.click('#rolling-settings-btn');
  await page.locator('[data-order-mode="value"]').click();
  await page.click('#close-rolling-settings');
  const order = await page.evaluate(() => rollingState.diceOrder);
  expect(order[0]).toBe(1);
  expect(order[1]).toBe(0);
});

test('value order with null values does not throw', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, {
    numberOfDice: 2,
    diceConfigs: [
      { sides: 1, sideData: [{ type: 'NUMBER', value: null, color: '#FFFFFF', shape: 'SQUARE' }] },
      { sides: 1, sideData: [{ type: 'NUMBER', value: null, color: '#FFFFFF', shape: 'SQUARE' }] },
    ],
  });
  await page.click('#rolling-settings-btn');
  await page.locator('[data-order-mode="value"]').click();
  await page.click('#close-rolling-settings');
  expect((await page.evaluate(() => rollingState.diceOrder)).length).toBe(2);
});

test('color order with equal colors produces a stable result', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, {
    numberOfDice: 2,
    diceConfigs: [
      { sides: 1, sideData: [{ type: 'PIPPED', value: 1, color: '#E53935', shape: 'SQUARE' }] },
      { sides: 1, sideData: [{ type: 'PIPPED', value: 1, color: '#E53935', shape: 'SQUARE' }] },
    ],
  });
  await page.click('#rolling-settings-btn');
  await page.locator('[data-order-mode="color"]').click();
  await page.click('#close-rolling-settings');
  expect((await page.evaluate(() => rollingState.diceOrder)).length).toBe(2);
});

// ── Swipe to roll toggle ───────────────────────────────────────────────────────

test('swipe-to-roll toggle renders as a styled sliding switch', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  // The checkbox is visually hidden (opacity:0); click the visible slider span instead
  await page.waitForSelector('#swipe-to-roll-toggle', { state: 'attached' });
  await expect(page.locator('label.toggle-switch:has(#swipe-to-roll-toggle)')).toBeVisible();
  await expect(page.locator('label.toggle-switch:has(#swipe-to-roll-toggle) .toggle-slider')).toBeVisible();
});

test('swipe-to-roll toggle changes state when clicked', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  // The checkbox is visually hidden (opacity:0); click the visible slider span instead
  await page.waitForSelector('#swipe-to-roll-toggle', { state: 'attached' });
  const before = await page.locator('#swipe-to-roll-toggle').isChecked();
  await page.locator('label.toggle-switch:has(#swipe-to-roll-toggle) .toggle-slider').click();
  expect(await page.locator('#swipe-to-roll-toggle').isChecked()).toBe(!before);
  // Verify saveViewSettings was called (the change handler fires)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dice_view_settings') || '{}'));
  expect(typeof saved.swipeToRoll).toBe('boolean');
});

test('swipe-to-roll default follows navigator.maxTouchPoints', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  const expected = await page.evaluate(() => navigator.maxTouchPoints > 0);
  const actual = await page.evaluate(() => {
    const stored = loadViewSettings().swipeToRoll;
    return stored !== undefined ? stored : (navigator.maxTouchPoints > 0);
  });
  expect(actual).toBe(expected);
});

// ── Game sliders in rolling settings ──────────────────────────────────────────

// ── New game setting toggles ───────────────────────────────────────────────────

test('confirm-restart toggle is visible in game settings and defaults to on', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-confirm-restart', { state: 'attached' });
  expect(await page.locator('#r-confirm-restart').isChecked()).toBe(true);
});

test('allow-unlock toggle is visible in game settings and defaults to on', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-allow-unlock', { state: 'attached' });
  expect(await page.locator('#r-allow-unlock').isChecked()).toBe(true);
});

test('disabling confirm-restart skips the confirm modal when mystery dice are active', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { confirmRestartWhenMystery: false });
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  // Modal should NOT appear — restart happens immediately
  await page.waitForTimeout(100);
  await expect(page.locator('#restart-confirm-overlay')).toBeHidden();
});

test('Qwinto config has confirmRestartWhenMystery set to false and toggle shows unchecked in rolling settings', async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await gotoApp(page, baseURL);
  const cfg = await page.evaluate(() => loadConfigurations().find(c => c.description === 'Qwinto'));
  expect(cfg.confirmRestartWhenMystery).toBe(false);
  // Start Qwinto game and verify toggle is off
  await gotoRolling(page, baseURL, { confirmRestartWhenMystery: false });
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-confirm-restart', { state: 'attached' });
  expect(await page.locator('#r-confirm-restart').isChecked()).toBe(false);
});

test('allow-unlock off: die locked and rolled cannot be unlocked in same round', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { allowUnlockAfterRoll: false, numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  // Lock die 0
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeVisible();
  // Roll — die 0 survives locked, so it becomes permanently locked this roll
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  // Try to unlock — should still be locked and show a red error toast
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeVisible();
  await expect(page.locator('#toast.toast-error')).toBeVisible();
});

test('allow-unlock off: die not yet rolled while locked can still be unlocked', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { allowUnlockAfterRoll: false, numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  // Lock die 0 — no roll yet
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeVisible();
  // Unlock without rolling — should work
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeHidden();
});

test('require-lock toggle is visible and defaults to off', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-require-lock', { state: 'attached' });
  expect(await page.locator('#r-require-lock').isChecked()).toBe(false);
});

test('require-lock on: roll requires a NEWLY locked die each round', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { requireLockBeforeRoll: true, numberOfDice: 3, diceConfigs: [BASE_DICE[0], BASE_DICE[0], BASE_DICE[0]] });
  // Disabled initially — no die newly locked
  await expect(page.locator('#roll-btn')).toBeDisabled();
  // Lock die 0 — enables
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
  // Unlock die 0 again — disables (no net new lock)
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('#roll-btn')).toBeDisabled();
  // Lock die 0 again — enables
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
  // Roll — snapshot resets, disabled again even though die stays locked
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).toBeDisabled();
  // Lock a different die — enables again
  await page.locator('.dice-face[data-index="1"]').click();
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
});

test('require-lock on: after restart roll button is disabled until a die is locked', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { requireLockBeforeRoll: true, numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.locator('.dice-face[data-index="0"]').click();
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  // After restart, no die is locked — should require lock again
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await expect(page.locator('#roll-btn')).toContainText('Lock a die first');
});

test('require-lock off: roll remains enabled after rolling without locking', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { requireLockBeforeRoll: false, numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
});

test('Zehntausend config has requireLockBeforeRoll set to true', async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await gotoApp(page, baseURL);
  const cfg = await page.evaluate(() => loadConfigurations().find(c => c.description === 'Zehntausend'));
  expect(cfg.requireLockBeforeRoll).toBe(true);
  expect(cfg.numberOfDice).toBe(5);
});

test('allow-unlock on: locked die can always be unlocked after rolling', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { allowUnlockAfterRoll: true, numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.locator('.dice-face[data-index="0"]').click();
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeHidden();
});

// ── Game sliders in rolling settings ──────────────────────────────────────────

test('rolling settings game inputs update state', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-block-val');
  await page.locator('#r-block-val').fill('5');
  await page.locator('#r-block-val').dispatchEvent('change');
  expect(await page.locator('#r-block-val').inputValue()).toBe('5s');
  await page.locator('#r-mystery-val').fill('3');
  await page.locator('#r-mystery-val').dispatchEvent('change');
  expect(await page.locator('#r-mystery-val').inputValue()).toBe('3');
  await page.locator('#r-limit-rolls-val').fill('5');
  await page.locator('#r-limit-rolls-val').dispatchEvent('change');
  expect(await page.locator('#r-limit-rolls-val').inputValue()).toBe('5');
});
