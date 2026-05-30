# Dice Roller

A fully client-side, offline-capable dice roller for board games and tabletop RPGs. No build step, no server required — open `index.html` directly in a browser.

## Features

- **Configurable dice** — define any number of dice with custom sides, types (Pipped, Number, Text/Symbol), colors, and shapes
- **Pre-configured games** — includes standard sets for Kniffel, DnD, and more
- **Roll animation** — smooth rotation showing random sides during roll
- **Lock & Mystery** — lock individual dice to keep their value; hide values with mystery mode
- **Swipe to Roll** — swipe left/right to roll (auto-enabled on touch devices)
- **Configurations** — save, import, and export configurations as JSON
- **Fullscreen mode** — distraction-free rolling
- **Persistent settings** — view settings and last configuration are saved across sessions

## Getting Started

Just open `index.html` in a browser — no installation needed.

To serve locally (e.g. for development or testing on a phone):

```bash
./serve.sh
```

Then open the printed URL on any device on the same network.

## Running Tests

```bash
npm test
```

Tests use [Playwright](https://playwright.dev/). To run with the interactive UI:

```bash
npm run test:ui
```

To update snapshots:

```bash
npm run test:update-snapshots
```

## Project Structure

```
index.html        # Entry point
css/              # Stylesheets
src/              # JavaScript source files
tests/            # Playwright tests
```

## License

MIT — see [LICENSE](LICENSE).
