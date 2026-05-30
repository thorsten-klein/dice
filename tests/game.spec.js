import { test, expect, gotoApp, gotoRolling } from './fixtures.js';

const BASE_DICE = [
  { sides: 6, sideData: [1,2,3,4,5,6].map(n => ({ type: 'PIPPED', value: n, color: '#FFFFFF', shape: 'SQUARE' })) },
];

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

// ── Initial state ──────────────────────────────────────────────────────────────

test('rolling screen header title reads "Roll the Dice"', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await expect(page.locator('.rolling-screen .screen-title')).toHaveText('Roll the Dice');
});

test('dice logo appears in config screen header', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await expect(page.locator('.config-screen .config-title-dice')).toBeVisible();
});

test('dice logo appears in rolling screen header', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await expect(page.locator('.rolling-screen .config-title-dice')).toBeVisible();
});

test('round number starts at 1', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await expect(page.locator('.round-count')).toHaveText('Round: 1');
});

test('round number increments on restart', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await expect(page.locator('.round-count')).toHaveText('Round: 1');
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.round-count')).toHaveText('Round: 2');
});

test('round number resets to 1 when re-entering game screen', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.round-count')).toHaveText('Round: 2');
  await page.click('#back-btn');
  await page.waitForSelector('.config-screen');
  await page.click('#start-btn');
  await page.waitForSelector('.rolling-screen');
  await expect(page.locator('.round-count')).toHaveText('Round: 1');
});

test('roll count starts at 1 and dice are visible', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1');
  await expect(page.locator('.mystery-icon')).toBeHidden();
});

test('config name appears as subtitle when set', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { description: 'My Game' });
  await expect(page.locator('.screen-subtitle')).toBeVisible();
  await expect(page.locator('.screen-subtitle')).toHaveText('My Game');
});

test('no subtitle shown when config name is empty', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { description: '' });
  await expect(page.locator('.screen-subtitle')).toBeHidden();
});

// ── Rolling ────────────────────────────────────────────────────────────────────

test('roll button increments the roll count', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.roll-count')).toHaveText('Roll: 2');
});

test('roll count shows N/maxRolls format when maxRolls is set', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { maxRolls: 3, diceConfigs: BASE_DICE });
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1/3');
  await page.click('#roll-btn');
  await expect(page.locator('.roll-count')).toHaveText('Roll: 2/3');
});

test('roll count shows N (no slash) when maxRolls is unlimited', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { maxRolls: 0 });
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1');
});

test('roll button is disabled and shows "All locked" when all dice are locked', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  // Lock the only die
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await expect(page.locator('#roll-btn')).toContainText('All locked');
  // Unlock — button re-enables
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
});

test('roll button is disabled and shows "Max reached" when limit is hit', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { maxRolls: 2, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await expect(page.locator('#roll-btn')).toContainText('Max reached');
});

// ── Restart ────────────────────────────────────────────────────────────────────

test('restart resets roll count and re-enables the roll button', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { maxRolls: 2, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1/2');
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
});

test('restart clears "Max reached" label and restores "Roll" on the button', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { maxRolls: 2, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).toContainText('Max reached');
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#roll-btn')).toContainText('Roll');
  await expect(page.locator('#roll-btn')).not.toContainText('Max reached');
});

test('restart unlocks all locked dice', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeVisible();
  await page.click('#reset-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeHidden();
});

test('restart shows a confirm modal when mystery dice are active', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.waitForSelector('#restart-confirm-overlay');
  await expect(page.locator('#restart-confirm-overlay')).toBeVisible();
});

test('restart confirm cancel keeps mystery state intact', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.click('#restart-cancel-btn');
  await expect(page.locator('#restart-confirm-overlay')).toBeHidden();
  await expect(page.locator('.mystery-icon')).toBeVisible();
});

test('restart confirm modal closes via overlay click', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.waitForSelector('#restart-confirm-overlay');
  await page.click('#restart-confirm-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#restart-confirm-overlay')).toBeHidden();
});

test('restart confirm button closes modal and resets', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.click('#restart-confirm-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('#restart-confirm-overlay')).toBeHidden();
  await expect(page.locator('.roll-count')).toHaveText('Roll: 1');
});

test('restart confirm modal confirm button is orange', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.waitForSelector('#restart-confirm-overlay');
  await expect(page.locator('#restart-confirm-btn')).toHaveClass(/btn-orange/);
});

test('restart confirm modal cancel button is purple', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await page.click('#reset-btn');
  await page.waitForSelector('#restart-confirm-overlay');
  await expect(page.locator('#restart-cancel-btn')).toHaveClass(/btn-purple/);
});

// ── Lock / unlock ──────────────────────────────────────────────────────────────

test('clicking a die locks it and shows the lock indicator', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeVisible();
  await expect(page.locator('.lock-indicator')).toBeVisible();
});

test('clicking a locked die unlocks it', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.locator('.dice-face[data-index="0"]').click();
  await page.locator('.dice-face[data-index="0"]').click();
  await expect(page.locator('.dice-face[data-index="0"].locked')).toBeHidden();
});

// ── Mystery ────────────────────────────────────────────────────────────────────

test('mystery button hides all unlocked dice', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await expect(page.locator('.mystery-icon')).toBeVisible();
});

test('mystery button does not hide locked dice', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 2, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.locator('.dice-face[data-index="0"]').click();
  await page.click('#mystery-btn');
  await expect(page.locator('.dice-face[data-index="0"] .mystery-icon')).toBeHidden();
  await expect(page.locator('.dice-face[data-index="1"] .mystery-icon')).toBeVisible();
});

test('clicking mystery again reveals dice', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#mystery-btn');
  await expect(page.locator('.mystery-icon')).toBeVisible();
  await page.click('#mystery-btn');
  await expect(page.locator('.mystery-icon')).toBeHidden();
});

test('right-clicking a die toggles individual mystery', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.locator('.dice-face[data-index="0"]').click({ button: 'right' });
  await expect(page.locator('.dice-face[data-index="0"] .mystery-icon')).toBeVisible();
  await page.locator('.dice-face[data-index="0"]').click({ button: 'right' });
  await expect(page.locator('.dice-face[data-index="0"] .mystery-icon')).toBeHidden();
});

test('auto-mystery triggers after N rolls on unlocked dice only', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { autoMysteryAfterRolls: 1, diceConfigs: BASE_DICE });
  // Roll 1 already happened on init; rolling again hits the threshold and triggers mystery
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.mystery-icon')).toBeVisible();
});

test('auto-mystery does not apply to locked dice', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 2, autoMysteryAfterRolls: 1, diceConfigs: [BASE_DICE[0], BASE_DICE[0]] });
  await page.locator('.dice-face[data-index="0"]').click();
  await page.click('#roll-btn');
  await page.waitForTimeout(600);
  await expect(page.locator('.dice-face[data-index="0"] .mystery-icon')).toBeHidden();
  await expect(page.locator('.dice-face[data-index="1"] .mystery-icon')).toBeVisible();
});

// ── Block timer ────────────────────────────────────────────────────────────────

test('block timer disables the roll button and shows remaining seconds', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { blockReThrowSeconds: 5, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await expect(page.locator('#roll-btn')).toContainText('Wait');
});

test('block timer re-enables the roll button after expiry', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { blockReThrowSeconds: 1, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await expect(page.locator('#roll-btn')).toBeDisabled();
  await page.waitForTimeout(1300);
  await expect(page.locator('#roll-btn')).not.toBeDisabled();
});

test('block timer updates "Wait Ns" label each second', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { blockReThrowSeconds: 3, diceConfigs: BASE_DICE });
  await page.click('#roll-btn');
  await expect(page.locator('#roll-btn')).toContainText('Wait');
  // After ~1s the countdown has ticked: label should show reduced count
  await page.waitForTimeout(1100);
  await expect(page.locator('#roll-btn')).toContainText('Wait');
  await expect(page.locator('#roll-btn')).toBeDisabled();
});

// ── Swipe to roll ──────────────────────────────────────────────────────────────

test('horizontal swipe triggers a roll when swipe-to-roll is enabled', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { diceConfigs: BASE_DICE });
  const before = await page.evaluate(() => rollingState.rollCount);
  // Dispatch synthetic touch events because Playwright's touch API doesn't reach passive listeners
  await page.evaluate(() => {
    rollingState.swipeToRoll = true;
    const screen = document.querySelector('.rolling-screen');
    screen.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: screen, clientX: 50, clientY: 200 })], bubbles: true }));
    screen.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: screen, clientX: 160, clientY: 202 })], bubbles: true }));
  });
  expect(await page.evaluate(() => rollingState.rollCount)).toBeGreaterThan(before);
});

test('swipe is ignored when swipe-to-roll is disabled', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { diceConfigs: BASE_DICE });
  const before = await page.evaluate(() => rollingState.rollCount);
  await page.evaluate(() => {
    rollingState.swipeToRoll = false;
    const screen = document.querySelector('.rolling-screen');
    screen.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: screen, clientX: 50, clientY: 200 })], bubbles: true }));
    screen.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: screen, clientX: 160, clientY: 202 })], bubbles: true }));
  });
  expect(await page.evaluate(() => rollingState.rollCount)).toBe(before);
});

test('vertical swipe does not trigger a roll', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { diceConfigs: BASE_DICE });
  const before = await page.evaluate(() => rollingState.rollCount);
  await page.evaluate(() => {
    rollingState.swipeToRoll = true;
    const screen = document.querySelector('.rolling-screen');
    screen.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: screen, clientX: 100, clientY: 50 })], bubbles: true }));
    screen.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: screen, clientX: 102, clientY: 200 })], bubbles: true }));
  });
  expect(await page.evaluate(() => rollingState.rollCount)).toBe(before);
});

test('roll button shows swipe hint when swipe-to-roll is enabled', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.evaluate(() => { rollingState.swipeToRoll = true; renderRollingScreen(); });
  await expect(page.locator('#roll-btn')).toContainText('Swipe left/right');
});

test('roll button hides swipe hint when swipe-to-roll is disabled', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.evaluate(() => { rollingState.swipeToRoll = false; renderRollingScreen(); });
  await expect(page.locator('#roll-btn')).not.toContainText('Swipe left/right');
});

// ── Info modal ─────────────────────────────────────────────────────────────────

test('info modal opens and closes', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-info-btn');
  await page.waitForSelector('#rolling-info-overlay');
  await expect(page.locator('#rolling-info-overlay')).toBeVisible();
  await page.click('#close-rolling-info-btn');
  await expect(page.locator('#rolling-info-overlay')).toBeHidden();
});

test('info modal closes via overlay click', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#rolling-info-btn');
  await page.waitForSelector('#rolling-info-overlay');
  await page.click('#rolling-info-overlay', { position: { x: 5, y: 5 } });
  await expect(page.locator('#rolling-info-overlay')).toBeHidden();
});

// ── Fullscreen ─────────────────────────────────────────────────────────────────

test('fullscreen button enters fullscreen without error', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.click('#fullscreen-btn');
  await page.waitForTimeout(200);
  expect(error).toBeNull();
});

test('fullscreen button exits fullscreen when already active', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.evaluate(() => {
    Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true });
    document.exitFullscreen = () => Promise.resolve();
  });
  await page.click('#fullscreen-btn');
  await page.waitForTimeout(200);
  expect(error).toBeNull();
});

test('leaving the rolling screen triggers exitFullscreen', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.evaluate(() => {
    document.exitFullscreen = () => { window._exitFullscreenCalled = true; return Promise.resolve(); };
    Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true });
  });
  await page.click('#back-btn');
  await page.waitForSelector('.config-screen');
  expect(await page.evaluate(() => !!window._exitFullscreenCalled)).toBe(true);
});

test('game settings changed during play are synced back to config screen', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  // Change block re-throw in rolling settings
  await page.click('#rolling-settings-btn');
  await page.waitForSelector('#r-block-val');
  await page.locator('[data-setting-incr="r-block-val"]').click();
  await page.locator('[data-setting-incr="r-block-val"]').click();
  await page.click('#close-rolling-settings');
  // Go back to config screen
  await page.click('#back-btn');
  await page.waitForSelector('.config-screen');
  // The config screen should reflect the change
  expect(await page.locator('#block-val').inputValue()).toBe('2s');
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test('back button returns to the config screen', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.click('#back-btn');
  await page.waitForSelector('.config-screen');
  await expect(page.locator('.config-screen')).toBeVisible();
});

test('popstate to rolling while modals are open closes them', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  const result = await page.evaluate(() => {
    rollingState.showSettings = true;
    rollingState.showInfo = true;
    rollingState.showRestartConfirm = true;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'rolling' } }));
    return { showSettings: rollingState.showSettings, showInfo: rollingState.showInfo, showRestartConfirm: rollingState.showRestartConfirm };
  });
  expect(result.showSettings).toBe(false);
  expect(result.showInfo).toBe(false);
  expect(result.showRestartConfirm).toBe(false);
});

test('popstate to rolling with no rollingState does not throw', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  let error = null;
  page.on('pageerror', e => { error = e; });
  await page.evaluate(() => {
    rollingState = null;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'rolling' } }));
  });
  expect(error).toBeNull();
});

test('popstate back with a rolling modal open intercepts navigation', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.evaluate(() => {
    rollingState.showSettings = true;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  await page.waitForSelector('.rolling-screen');
  expect(await page.evaluate(() => rollingState.showSettings)).toBe(false);
});

test('popstate back with no modal navigates to config and clears rollingState', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  await page.evaluate(() => {
    document.exitFullscreen = () => Promise.resolve();
    Object.defineProperty(document, 'fullscreenElement', { get: () => document.documentElement, configurable: true });
    rollingState.showSettings = false;
    rollingState.showInfo = false;
    rollingState.showRestartConfirm = false;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  await page.waitForSelector('.config-screen');
  expect(await page.evaluate(() => rollingState)).toBeNull();
});

test('popstate on config screen with open modal closes it', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    configState.showConfigurations = true;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  await page.waitForSelector('.config-screen');
  expect(await page.evaluate(() => configState.showConfigurations)).toBe(false);
});

test('popstate on config screen with configurations modal open closes it', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    configState.showConfigurations = true;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  expect(await page.evaluate(() => configState.showConfigurations)).toBe(false);
});

test('popstate on config screen with dice preview modal open closes it', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    configState.dicePreviewModal = 0;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  expect(await page.evaluate(() => configState.dicePreviewModal)).toBeNull();
});

test('popstate on config screen with no modal re-renders config', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => { window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } })); });
  await page.waitForSelector('.config-screen');
  await expect(page.locator('.config-screen')).toBeVisible();
});

test('popstate with no state at all calls initConfigScreen', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  await page.evaluate(() => {
    configState = null;
    rollingState = null;
    window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'config' } }));
  });
  await page.waitForSelector('.config-screen');
  await expect(page.locator('.config-screen')).toBeVisible();
});
