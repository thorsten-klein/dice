import { test, expect, gotoApp, gotoRolling } from './fixtures.js';

function makeDie(type, value, color) {
  return { sides: 1, sideData: [{ type, value: value ?? null, color: color || '#FFFFFF', shape: 'SQUARE' }] };
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

// ── Face rendering ─────────────────────────────────────────────────────────────

test('NUMBER die renders its value on the face', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [makeDie('NUMBER', 42, null)] });
  await expect(page.locator('.face-number')).toBeVisible();
  await expect(page.locator('.face-number')).toContainText('42');
});

test('NUMBER die with null value renders face without crashing', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [{ sides: 1, sideData: [{ type: 'NUMBER', value: null, color: '#FFFFFF', shape: 'SQUARE' }] }] });
  expect(await page.locator('.face-number').count()).toBeGreaterThan(0);
});

test('COLOR die renders shape without inner content', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [{ sides: 1, sideData: [{ type: 'COLOR', value: null, color: '#E53935', shape: 'SQUARE' }] }] });
  await expect(page.locator('.dice-shape-wrap')).toBeVisible();
  await expect(page.locator('.face-number')).toBeHidden();
});

test('TEXT die with short text uses large font class', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [makeDie('TEXT', 'Hi', null)] });
  await expect(page.locator('.face-text.text-lg')).toBeVisible();
});

test('TEXT die with medium text uses medium font class', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [makeDie('TEXT', 'Hello!', null)] });
  await expect(page.locator('.face-text.text-md')).toBeVisible();
});

test('TEXT die with long text uses small font class', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL, { numberOfDice: 1, diceConfigs: [makeDie('TEXT', 'LongText', null)] });
  await expect(page.locator('.face-text.text-sm')).toBeVisible();
});

test('buildDiceFace returns empty string for out-of-bounds side index', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  const result = await page.evaluate(() => {
    return buildDiceFace({ sideData: [{ type: 'NUMBER', value: 1, color: '#FFFFFF', shape: 'SQUARE' }] }, 99, false, '#000');
  });
  expect(result).toBe('');
});

test('buildDiceFace defaults foreground color to black when not provided', async ({ page, baseURL }) => {
  await gotoRolling(page, baseURL);
  const result = await page.evaluate(() => {
    return buildDiceFace({ sideData: [{ type: 'NUMBER', value: 7, color: '#FFFFFF', shape: 'SQUARE' }] }, 0, false, null);
  });
  expect(result).toContain('#000000');
});

// ── Shapes (equilateral geometry) ─────────────────────────────────────────────

test('DEFAULT has no clip-path (rounded corners via CSS)', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => SHAPES.find(s => s.id === 'DEFAULT').clip);
  expect(clip).toBe('');
});

test('SQUARE uses inset(0) clip-path (sharp corners)', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => SHAPES.find(s => s.id === 'SQUARE').clip);
  expect(clip).toBe('inset(0)');
});

test('CIRCLE uses a circular clip-path', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => SHAPES.find(s => s.id === 'CIRCLE').clip);
  expect(clip).toBe('circle(50% at 50% 50%)');
});

test('TRIANGLE is equilateral — all three sides equal length', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const vertices = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'TRIANGLE').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const sides = vertices.map((v, i) => dist(v, vertices[(i + 1) % vertices.length]));
  const avg = sides.reduce((s, d) => s + d, 0) / sides.length;
  sides.forEach(d => expect(Math.abs(d - avg)).toBeLessThan(0.5));
});

test('PENTAGON is equilateral — all five sides equal length', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const vertices = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'PENTAGON').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const sides = vertices.map((v, i) => dist(v, vertices[(i + 1) % vertices.length]));
  const avg = sides.reduce((s, d) => s + d, 0) / sides.length;
  sides.forEach(d => expect(Math.abs(d - avg)).toBeLessThan(0.5));
});

test('HEXAGON is equilateral — all six sides equal length', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const vertices = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'HEXAGON').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const sides = vertices.map((v, i) => dist(v, vertices[(i + 1) % vertices.length]));
  const avg = sides.reduce((s, d) => s + d, 0) / sides.length;
  sides.forEach(d => expect(Math.abs(d - avg)).toBeLessThan(0.5));
});

test('HEPTAGON is equilateral — all seven sides equal length', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const vertices = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'HEPTAGON').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const sides = vertices.map((v, i) => dist(v, vertices[(i + 1) % vertices.length]));
  const avg = sides.reduce((s, d) => s + d, 0) / sides.length;
  sides.forEach(d => expect(Math.abs(d - avg)).toBeLessThan(0.5));
});

test('OCTAGON is equilateral — all eight sides equal length', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const vertices = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'OCTAGON').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const sides = vertices.map((v, i) => dist(v, vertices[(i + 1) % vertices.length]));
  const avg = sides.reduce((s, d) => s + d, 0) / sides.length;
  sides.forEach(d => expect(Math.abs(d - avg)).toBeLessThan(0.5));
});

test('all polygon shapes are centered at (50%, 50%)', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const results = await page.evaluate(() => {
    // Only test polygon-based shapes (those with a clip string using % coords, not path100)
    return SHAPES.filter(s => s.id !== 'DEFAULT' && s.id !== 'SQUARE' && s.id !== 'CIRCLE' && !s.path100 && !s.clip.startsWith('url(') && !s.clip.startsWith('inset')).map(s => {
      const pts = s.clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
      const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
      const cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
      return { id: s.id, cx, cy };
    });
  });
  results.forEach(({ cx, cy }) => {
    expect(Math.abs(cx - 50)).toBeLessThan(1);
    expect(Math.abs(cy - 50)).toBeLessThan(1);
  });
});

test('DIAMOND has 4 vertices at cardinal points', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => SHAPES.find(s => s.id === 'DIAMOND').clip);
  expect(clip).toContain('50% 0%');   // top
  expect(clip).toContain('100% 50%'); // right
  expect(clip).toContain('50% 100%'); // bottom
  expect(clip).toContain('0% 50%');   // left
});

test('STAR4 has 8 vertices alternating outer and inner radii', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const pts = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'STAR4').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  expect(pts).toHaveLength(8);
  // Outer points are at r=50 from center (50,50), inner at r≈20
  const dist = (p) => Math.hypot(p[0] - 50, p[1] - 50);
  const dists = pts.map(dist);
  const outers = dists.filter((_, i) => i % 2 === 0);
  const inners = dists.filter((_, i) => i % 2 === 1);
  outers.forEach(d => expect(Math.abs(d - 50)).toBeLessThan(1));
  inners.forEach(d => expect(d).toBeLessThan(25));
});

test('STAR8 has 16 vertices alternating outer and inner radii', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const pts = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'STAR8').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  expect(pts).toHaveLength(16);
});

test('CROSS has 12 vertices forming a plus shape', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const pts = await page.evaluate(() => {
    const clip = SHAPES.find(s => s.id === 'CROSS').clip;
    return clip.match(/[\d.]+%\s+[\d.]+%/g).map(p => p.split('%').map(Number));
  });
  expect(pts).toHaveLength(12);
});

test('FLOWER4 clip-path references an SVG clipPath with 4 circles', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => getShapeClip('FLOWER4'));
  expect(clip).toBe('url(#clip-flower4)');
  const circleCount = await page.evaluate(() =>
    document.querySelectorAll('#clip-flower4 circle').length
  );
  expect(circleCount).toBe(5); // 1 center + 4 petals
});

test('FLOWER5 clip-path references an SVG clipPath with 5 circles', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const clip = await page.evaluate(() => getShapeClip('FLOWER5'));
  expect(clip).toBe('url(#clip-flower5)');
  const circleCount = await page.evaluate(() =>
    document.querySelectorAll('#clip-flower5 circle').length
  );
  expect(circleCount).toBe(6); // 1 center + 5 petals
});

test('flower SVG clipPaths use objectBoundingBox units', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const units = await page.evaluate(() => [
    document.getElementById('clip-flower4').getAttribute('clipPathUnits'),
    document.getElementById('clip-flower5').getAttribute('clipPathUnits'),
  ]);
  expect(units[0]).toBe('objectBoundingBox');
  expect(units[1]).toBe('objectBoundingBox');
});

test('all new shapes are present in SHAPES array with correct labels', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  const shapes = await page.evaluate(() => SHAPES.map(s => ({ id: s.id, label: s.label })));
  const ids = shapes.map(s => s.id);
  expect(ids).toContain('DIAMOND');
  expect(ids).toContain('STAR4');
  expect(ids).toContain('STAR8');
  expect(ids).toContain('CROSS');

  expect(ids).toContain('FLOWER4');
  expect(ids).toContain('FLOWER5');
  expect(shapes.find(s => s.id === 'DIAMOND').label).toBe('Diamond');
  expect(shapes.find(s => s.id === 'STAR4').label).toBe('Star (4)');
  expect(shapes.find(s => s.id === 'STAR8').label).toBe('Star (8)');
  expect(shapes.find(s => s.id === 'CROSS').label).toBe('Cross');

  expect(shapes.find(s => s.id === 'FLOWER4').label).toBe('Flower (4)');
  expect(shapes.find(s => s.id === 'FLOWER5').label).toBe('Flower (5)');
});

// ── Color utilities ────────────────────────────────────────────────────────────

test('contrastColor returns black for light background', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => contrastColor('#FFFFFF'))).toBe('#000000');
});

test('contrastColor returns white for dark background', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => contrastColor('#000000'))).toBe('#ffffff');
});

test('colorToName returns the color name for a known hex', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => colorToName('#E53935'))).toBe('RED');
});

test('colorToName returns null for falsy input', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => colorToName(null))).toBeNull();
});

test('nameToColor returns hex for a known color name', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => nameToColor('RED'))).toBe('#E53935');
});

test('nameToColor falls back to the input value for unknown names', async ({ page, baseURL }) => {
  await gotoApp(page, baseURL);
  expect(await page.evaluate(() => nameToColor('#AABBCC'))).toBe('#AABBCC');
});
