# Project Instructions

Requirements for the dice roller web app.

---

## Initial Setup

- Reimplement the dice roller in `index.html`, `src/*.js`, and `css/`. Original project: `/home/dev/GIT/game-app/app/src/main/java/com/totschi/gameapp/dice`.
- Add the default dice as they are in the old app.

---

## Naming Conventions

- One die, plural is dice. Never use "dices".
- Use "Roll dice" (not "Throw dice") consistently throughout the codebase.
- Single die method is `rollDie`.

---

## Dice Configuration Screen

- Below "Number of Dice:" show a preview strip of the dice (dice-preview-strip). If not all dice fit in one row, wrap them. Each line is centered horizontally.
- When I click on a die in the preview, its dice-card opens as a modal. Modal is dark.
- "Please enter a configuration name" validation message should be red.
- settings-card-text should be "Game settings".
- Show text "Configurations" next to toggle-history. A click on toggle-history opens a modal.
- In modal-header-row add buttons for import and export configurations as JSON.
- Header is fixed to the screen top. The screen is not scrollable when there is no overflow content.
- If I start a game and go back, the configuration screen should still show the same state as before (not reset to default).
- Don't use alerts — always use modals. Confirm buttons are green, Cancel buttons are red.

---

## Sides Table

- Sides are shown as a table with columns: Side number | Type | Color | Value | Form.
- **Type column:** Show the selected type with an edit icon next to it. A click opens a modal to select between the 3 types: "Pipped", "Number", "Text/Symbol". Column is not too wide, text is centered.
- **Color column:** Show a circle in the die's color. A click opens a modal to change the color. No dropdown.
- **Value column:**
  - Pipped: dropdown with entries "0: " "1: ." "2: .." etc. (including 0).
  - Number: text field with +/− buttons. The number is centered; hide browser up/down arrows. Max 10 characters.
  - Text/Symbol: free text field. Max 10 characters.
  - Column width is flexible (not fixed).
- **Form column:** Show the form in white. A click opens a modal to select the form. Available forms: Square (default), Circle, Triangle, Fünfeck, Sechseck, Siebeneck, Achteck.
- side-num-wrap is centered in its column.
- The color of the die is always the color of the form. Dots are shown in the color with best contrast (black or white).
- No limit on number of sides.
- No limit on number of dice.
- Use pipped SVG (not ⚁ character) for the pipped type icon. All type-pick-cards have the same height.

---

## Dice Preview & Size Control

- Next to size-controls show a dice preview (size-preview). It always shows die 1, regardless of sort order.
- The preview shows dice-shape-wrap size.
- Size can be adjusted from 0.5× to 3.0× in 0.1× steps.
- dice-face is 150×150px.
- dice-grid is flexible: if 3 dice fit in one row, show them in one row.

---

## Pre-configured Games

- All pre-configured games use pipped dice, except d20 (DnD) which uses numbers.
- Include Kniffel in pre-defined configurations.
- New configuration default: one pipped d6 die (no name).

---

## JSON Export / Import

- In the exported JSON, define available colors at the top and reference them by name (e.g. `"color": "BLUE"`) instead of hex values.
- Only support the named-color format (no legacy hex format).

---

## Game Screen

- On reload, the last configuration is restored.
- When a die is locked: show a lock-indicator (50px) in the bottom-right corner of dice-face. Do not grey out the die. A locked mystery die still shows the mystery icon.
- Clicking Roll/Restart rolls all unlocked dice immediately.
- In Game settings: allow setting maximum throws. Default is ∞.
  - With a limit: show "Roll: 1/12". When reached, grey out the Roll button.
  - Without a limit: show "Roll: 1".
- Header is fixed to screen top.
- bottom-actions are fixed at the bottom of the screen and do not scroll.
- Back key on phone behaves the same as back-btn.
- When a modal is open, the underlying screen cannot scroll — only the modal scrolls.
- In game screen also fix mystery-row.

---

## Settings Modal (Game Screen)

- Show "View settings" first, then "Game settings" below (same layout as in configuration screen).
- No code duplication — reuse the same component.
- modal-header-row does not scroll.

---

## View Settings Persistence

- Dice size setting (default 1.0×) is saved to localStorage and restored on reload.
- All view settings are saved to localStorage and restored on reload.
- Next to "View settings" show a red "Reset" button to clear localStorage data.

---

## Dice Order & Sorting

- In order-item show a small preview of the current die value.
- Order mode buttons: **Off** (default) | **By color** | **By value** | **Manual** (last).
- "By value" sorts alphabetically (wordx2 before wordx10).
- Manual Reorder always starts from the current actual order 1, 2, … (not from a previous sort).

---

## Rolling Animation

- During roll: rotate only dice-shape-wrap (not dice-face).
- While rotating, show different sides of the die randomly every 50ms.
- No blur during rotation.

---

## Swipe to Roll

- In View Settings: toggle to enable/disable Swipe to Roll. The toggle is a sliding dot (not a checkbox).
- Default: **on for touch screen devices, off otherwise** (auto-detected).
- Swipe is only detected when |deltaX| > |deltaY| (to avoid accidental rolls while scrolling).
- When Swipe is active, show "(Swipe left/right)" in small text on the Roll button.

---

## Long Press / Mystery

- Long press (or right-click) on a die toggles mystery mode for that individual die.
- Mystery activates as soon as the long press is detected (not on release).
- mystery-btn only makes dice mystery that are not already locked.
- mystery-icon is the same size on all devices (not smaller on phone).
- When clicking Restart while there are mystery dice, a confirmation modal appears first.

---

## Fullscreen

- Right of rolling-info-btn: toggle fullscreen button.
- Leaving the game screen disables fullscreen automatically.

---

## Configuration Name Display

- Under "Rolling Dice" show the configuration name (smaller font) if a name is set.

---

## Configurations Modal

- First entry in history-list is "+ new configuration" → starts a new unnamed configuration with one pipped d6.
- Reset button (red, text "Reset"): removes all configurations and reloads the pre-defined ones.

---

## Icons & UI

- Favicon is present.
- history-btn uses the Google History icon.
- Info icon (Google "Info") left of rolling-settings-btn opens the info modal.
- Restart button in game screen uses the Google Cancel icon.
- Roll button uses a custom SVG: a die with a circular rotation arrow around it.

---

## Info Modal Content

**Dice interaction:**
- Tap a die to lock / unlock it. Locked dice are not re-rolled. A 🔒 icon appears on locked dice.
- ❓ Mystery hides all dice values until you reveal them again.
- ⏱️ Long-press (or right-click) a die toggles mystery mode for that individual die.

**Buttons:**
- Roll — rolls all unlocked dice.
- 🔁 Restart — unlocks all dice and rolls immediately.
- ⚙️ Settings — adapt view settings and game settings.

**Game settings:**
- 🚫 Max throws: when reached, the Roll button is disabled.
- ⏳ Block re-roll: Roll is disabled for N seconds after each roll (anti-cheat).
- 🕵️ Auto Mystery: mystery activates automatically after N rolls.
