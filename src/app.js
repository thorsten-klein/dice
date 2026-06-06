// === Constants & Models ===
var ContentType = {
  NUMBERS: 'NUMBERS',
  COLORS: 'COLORS',
  COLORED_NUMBERS: 'COLORED_NUMBERS',
  NUMBERS_WITH_COLORS: 'NUMBERS_WITH_COLORS',
  TEXT: 'TEXT',
  PIPPED: 'PIPPED',
};

// Pip positions in a 3×3 grid (index 0=top-left … 8=bottom-right)
var PIP_LAYOUTS = {
  0: [0,0,0, 0,0,0, 0,0,0],
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

var BASE_COLORS = [
  '#E53935', '#1E88E5', '#FDD835',
  '#8E24AA', '#43A047', '#FF6F00',
  '#FFFFFF', '#000000', '#808080',
];

var AVAILABLE_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#000000', name: 'Black' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#E53935', name: 'Red' },
  { hex: '#1E88E5', name: 'Blue' },
  { hex: '#FDD835', name: 'Yellow' },
  { hex: '#8E24AA', name: 'Purple' },
  { hex: '#43A047', name: 'Green' },
  { hex: '#FF6F00', name: 'Orange' },
];

// All polygons are regular (equilateral) with vertices on a circle of radius 50%
// centered at (50%,50%), starting from the top vertex (angle -90°).
// Coordinates: x = 50 + 50*cos(2π*i/n - π/2), y = 50 + 50*sin(2π*i/n - π/2)
// Stars: outer r=50, inner r=20, alternating at half-step angles.
// Flowers: r = 50*(0.75 + 0.25*cos(k*θ)) sampled at 22.5° increments.
// Cross: bar width 30 (35%–65%), each arm tip is a circular cap of radius 15.
var SHAPES = [
  { id: 'DEFAULT',     label: 'Default',      clip: '' },
  { id: 'SQUARE',      label: 'Square',       clip: 'inset(0)' },
  { id: 'CIRCLE',      label: 'Circle',       clip: 'circle(50% at 50% 50%)' },
  { id: 'DIAMOND',     label: 'Diamond',      clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'TRIANGLE',    label: 'Triangle',     clip: 'polygon(50% 0%, 93.3% 75%, 6.7% 75%)' },
  { id: 'PENTAGON',    label: 'Pentagon',     clip: 'polygon(50% 0%, 97.6% 34.5%, 79.4% 90.5%, 20.6% 90.5%, 2.4% 34.5%)' },
  { id: 'HEXAGON',     label: 'Hexagon',      clip: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)' },
  { id: 'HEPTAGON',    label: 'Heptagon',     clip: 'polygon(50% 0%, 89.1% 18.8%, 98.7% 61.1%, 71.7% 95.1%, 28.3% 95.1%, 1.3% 61.1%, 10.9% 18.8%)' },
  { id: 'OCTAGON',     label: 'Octagon',      clip: 'polygon(50% 0%, 85.4% 14.6%, 100% 50%, 85.4% 85.4%, 50% 100%, 14.6% 85.4%, 0% 50%, 14.6% 14.6%)' },
  { id: 'STAR4',       label: 'Star (4)',     clip: 'polygon(50% 0%, 64.1% 35.9%, 100% 50%, 64.1% 64.1%, 50% 100%, 35.9% 64.1%, 0% 50%, 35.9% 35.9%)' },
  { id: 'STAR8',       label: 'Star (8)',     clip: 'polygon(50% 0%, 57.7% 31.5%, 85.4% 14.6%, 68.5% 42.4%, 100% 50%, 68.5% 57.7%, 85.4% 85.4%, 57.7% 68.5%, 50% 100%, 42.4% 68.5%, 14.6% 85.4%, 31.5% 57.7%, 0% 50%, 31.5% 42.4%, 14.6% 14.6%, 42.4% 31.5%)' },
  { id: 'CROSS',       label: 'Cross',        clip: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' },
  // CROSS_45: CROSS rotated 45° around (50,50). Each (x,y) → (50+(x-50-y+50)·√2/2, 50+(x-50+y-50)·√2/2).
  { id: 'CROSS_45',    label: 'Cross (45°)',  clip: 'polygon(74.7% 4%, 96% 25.3%, 71.2% 50%, 96% 74.7%, 74.7% 96%, 50% 71.2%, 25.3% 96%, 4% 74.7%, 28.8% 50%, 4% 25.3%, 25.3% 4%, 50% 28.8%)' },
  // FLOWER4/5: 4/5 circles of r=20% at offset 30% from center, unioned via SVG clipPath.
  // clipPathUnits="objectBoundingBox" makes coordinates relative (0–1) so they scale automatically.
  { id: 'FLOWER4',     label: 'Flower (4)',   clip: 'url(#clip-flower4)' },
  { id: 'FLOWER5',     label: 'Flower (5)',   clip: 'url(#clip-flower5)' },
];

function getShapeClip(shape) {
  var s = SHAPES.find(function(s) { return s.id === shape; });
  return s ? s.clip : '';
}


function colorToName(hex) {
  if (!hex) return null;
  var c = AVAILABLE_COLORS.find(function(ac) { return ac.hex.toUpperCase() === hex.toUpperCase(); });
  return c ? c.name.toUpperCase() : hex;
}

function nameToColor(name) {
  if (!name) return null;
  var c = AVAILABLE_COLORS.find(function(ac) { return ac.name.toUpperCase() === String(name).toUpperCase(); });
  return c ? c.hex : name; // fall back to raw value (hex) for unknown names
}

function serializeConfigs(configs) {
  var palette = {};
  AVAILABLE_COLORS.forEach(function(ac) { palette[ac.name.toUpperCase()] = ac.hex; });
  var data = configs.map(function(cfg) {
    return Object.assign({}, cfg, {
      diceConfigs: cfg.diceConfigs.map(function(dc) {
        return Object.assign({}, dc, {
          sideData: dc.sideData.map(function(s) {
            return Object.assign({}, s, { color: colorToName(s.color) });
          })
        });
      })
    });
  });
  return { colors: palette, configurations: data };
}

function deserializeConfigs(obj) {
  if (!obj || !Array.isArray(obj.configurations)) throw new Error('Invalid format');
  return obj.configurations.map(function(cfg) {
    return Object.assign({}, cfg, {
      diceConfigs: (cfg.diceConfigs || []).map(function(dc) {
        return Object.assign({}, dc, {
          sideData: (dc.sideData || []).map(function(s) {
            return Object.assign({}, s, { color: nameToColor(s.color) });
          })
        });
      })
    });
  });
}


function contrastColor(hex) {
  if (!hex) return '#000000';
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  return (0.299*r + 0.587*g + 0.114*b) > 140 ? '#000000' : '#ffffff';
}

var STORAGE_KEY = 'dice_configurations';
var LAST_CONFIG_KEY = 'dice_last_config';
var DRAFT_KEY = 'dice_config_draft';
var VIEW_SETTINGS_KEY = 'dice_view_settings';
var GAME_SETTINGS_KEY = 'dice_game_settings';

// Normalize a "list of roll numbers" setting. Accepts an array (filtered to
// positive numbers) or anything else (= off → []).
function normalizeRollsList(v) {
  return Array.isArray(v) ? v.filter(function(n) { return typeof n === 'number' && n > 0; }) : [];
}

// Persists current (possibly unsaved) game settings for restore on page refresh
function saveGameSettings(state) {
  localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify({
    _desc: configState ? configState.description : '',
    blockReThrowSeconds: state.blockReThrowSeconds || 0,
    autoMysteryAfterRolls: normalizeRollsList(state.autoMysteryAfterRolls),
    enforceRevealAfterRolls: normalizeRollsList(state.enforceRevealAfterRolls),
    maxRolls: state.maxRolls || 0,
    confirmRestartWhenMystery: state.confirmRestartWhenMystery !== false,
    allowUnlockAfterRoll: state.allowUnlockAfterRoll !== false,
    requireLockBeforeRoll: !!state.requireLockBeforeRoll,
  }));
  saveDraft();
}

function loadGameSettings() {
  try { return JSON.parse(localStorage.getItem(GAME_SETTINGS_KEY)) || null; } catch(e) { return null; }
}

function saveViewSettings() {
  localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify({
    diceSize: rollingState.diceSize,
    diceOrderMode: rollingState.diceOrderMode,
    swipeToRoll: rollingState.swipeToRoll,
  }));
}

function loadViewSettings() {
  try { return JSON.parse(localStorage.getItem(VIEW_SETTINGS_KEY)) || {}; } catch(e) { return {}; }
}

// Migrate a single diceConfig from old multi-array format to new sideData format
function migrateDiceConfig(dc) {
  if (dc.sideData) {
    // Backfill older sideData that may be missing shape or color fields
    dc.sideData = dc.sideData.map(function(s) {
      var out = s.shape ? s : Object.assign({ shape: 'DEFAULT' }, s);
      return out.color ? out : Object.assign({ color: '#FFFFFF' }, out);
    });
    if (!dc.baseType)  dc.baseType  = 'PIPPED';
    if (!dc.baseShape) dc.baseShape = 'DEFAULT';
    if (!dc.baseColor) dc.baseColor = '#FFFFFF';
    return dc;
  }
  var sides = dc.sides || 6;
  var sideData = Array.from({ length: sides }, function(_, i) {
    switch (dc.contentType) {
      case 'NUMBERS':
        return { type: 'NUMBER', value: (dc.numbers && dc.numbers[i] !== undefined) ? dc.numbers[i] : i + 1, color: '#FFFFFF', shape: 'DEFAULT' };
      case 'COLORS':
        return { type: 'COLOR', value: null, color: (dc.colors && dc.colors[i]) || '#808080', shape: 'DEFAULT' };
      case 'COLORED_NUMBERS': {
        var cn = (dc.coloredNumbers && dc.coloredNumbers[i]) || { number: i + 1, color: '#E53935' };
        return { type: 'NUMBER', value: cn.number, color: cn.color, shape: 'DEFAULT' };
      }
      case 'NUMBERS_WITH_COLORS': {
        var nwc = (dc.numbersWithColors && dc.numbersWithColors[i]) || { number: i + 1, color: '#E53935' };
        return { type: 'NUMBER', value: nwc.number, color: nwc.color, shape: 'DEFAULT' };
      }
      case 'TEXT':
        return { type: 'TEXT', value: (dc.textSymbols && dc.textSymbols[i]) || '', color: '#FFFFFF', shape: 'DEFAULT' };
      case 'PIPPED':
        return { type: 'PIPPED', value: Math.min(Math.max((dc.numbers && dc.numbers[i] !== undefined) ? dc.numbers[i] : i + 1, 0), 6), color: '#FFFFFF', shape: 'DEFAULT' };
      default:
        return { type: 'NUMBER', value: i + 1, color: '#FFFFFF', shape: 'DEFAULT' };
    }
  });
  return { sides: sides, baseType: 'PIPPED', baseShape: 'DEFAULT', baseColor: '#FFFFFF', sideData: sideData };
}

function loadConfigurations() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(function(c) {
      if (!c.diceConfigs) return c;
      return Object.assign({}, c, { diceConfigs: c.diceConfigs.map(migrateDiceConfig) });
    });
  } catch (e) { return []; }
}

function saveConfiguration(config) {
  var configs = loadConfigurations();
  var idx = configs.findIndex(function(c) { return c.description === config.description; });
  if (idx >= 0) configs[idx] = config;
  else configs.push(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

function deleteConfiguration(description) {
  var configs = loadConfigurations().filter(function(c) { return c.description !== description; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// === Dice Logic ===
function createDefaultDiceConfig(sides) {
  sides = sides || 6;
  return {
    sides: sides,
    baseType: 'PIPPED',
    baseShape: 'DEFAULT',
    baseColor: '#FFFFFF',
    sideData: Array.from({ length: sides }, function(_, i) {
      return { type: 'PIPPED', value: i + 1, color: '#FFFFFF', shape: 'DEFAULT' };
    }),
  };
}

function updateDiceConfigSides(config, newSides) {
  var arr = config.sideData.slice();
  var t = config.baseType || 'PIPPED';
  var c = config.baseColor || '#FFFFFF';
  var sh = config.baseShape || 'DEFAULT';
  while (arr.length < newSides) arr.push({ type: t, value: arr.length + 1, color: c, shape: sh });
  while (arr.length > newSides) arr.pop();
  return Object.assign({}, config, { sides: newSides, sideData: arr });
}

function rollDie(config) {
  return Math.floor(Math.random() * config.sides);
}

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// === Toast ===
var _toastTimeout = null;
function showToast(msg, isError) {
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('toast-error', !!isError);
  toast.classList.add('show');
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

function showConfirmModal(message, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<div class="modal-body">' +
        '<p style="font-size:16px;line-height:1.5;margin-bottom:20px;">' + htmlEscape(message) + '</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-danger" id="confirm-modal-cancel">Cancel</button>' +
          '<button class="btn btn-green" id="confirm-modal-ok">Confirm</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  updateBodyScroll();
  overlay.querySelector('#confirm-modal-cancel').addEventListener('click', function() {
    document.body.removeChild(overlay);
    updateBodyScroll();
  });
  overlay.querySelector('#confirm-modal-ok').addEventListener('click', function() {
    document.body.removeChild(overlay);
    updateBodyScroll();
    onConfirm();
  });
}

// ============================================================
// CONFIG SCREEN
// ============================================================
var configState = null;

function initConfigScreen(preload, isBootRestore) {
  if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
  configState = {
    description: '',
    numberOfDice: 1,
    diceConfigs: [createDefaultDiceConfig(6)],
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: [],
    enforceRevealAfterRolls: [],
    maxRolls: 0,
    confirmRestartWhenMystery: true,
    allowUnlockAfterRoll: true,
    requireLockBeforeRoll: false,
    showConfigurations: false,
    configsSortKey: 'name',
    configsSortAsc: true,
    dicePreviewModal: null,
    colorPickerModal: null,
    shapePickerModal: null,
    typePickerModal: null,
  };
  if (preload) Object.assign(configState, preload);
  configState.autoMysteryAfterRolls = normalizeRollsList(configState.autoMysteryAfterRolls);
  configState.enforceRevealAfterRolls = normalizeRollsList(configState.enforceRevealAfterRolls);
  // Restore session game settings on refresh/boot only — not when user loads from history
  if (isBootRestore || !preload) {
    var gs = loadGameSettings();
    if (gs && (!preload || gs._desc === configState.description)) {
      configState.blockReThrowSeconds = gs.blockReThrowSeconds || 0;
      configState.autoMysteryAfterRolls = normalizeRollsList(gs.autoMysteryAfterRolls);
      configState.enforceRevealAfterRolls = normalizeRollsList(gs.enforceRevealAfterRolls);
      configState.maxRolls = gs.maxRolls || 0;
      if (gs.confirmRestartWhenMystery !== undefined) configState.confirmRestartWhenMystery = gs.confirmRestartWhenMystery;
      if (gs.allowUnlockAfterRoll !== undefined) configState.allowUnlockAfterRoll = gs.allowUnlockAfterRoll;
      if (gs.requireLockBeforeRoll !== undefined) configState.requireLockBeforeRoll = gs.requireLockBeforeRoll;
    }
  }
  history.replaceState({ screen: 'config' }, '');
  renderConfigScreen();
}

function updateBodyScroll() {
  var modalOpen = document.querySelector('.modal-overlay') !== null;
  document.body.style.overflow = modalOpen ? 'hidden' : '';
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      description: configState.description,
      numberOfDice: configState.numberOfDice,
      diceConfigs: configState.diceConfigs,
      blockReThrowSeconds: configState.blockReThrowSeconds,
      autoMysteryAfterRolls: configState.autoMysteryAfterRolls,
      enforceRevealAfterRolls: configState.enforceRevealAfterRolls,
      maxRolls: configState.maxRolls,
      confirmRestartWhenMystery: configState.confirmRestartWhenMystery,
      allowUnlockAfterRoll: configState.allowUnlockAfterRoll,
      requireLockBeforeRoll: configState.requireLockBeforeRoll,
    }));
  } catch (e) {} // configState null (rolling screen) or storage quota — safe to ignore
}

function loadDraft() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    var d = JSON.parse(raw);
    if (d && Array.isArray(d.diceConfigs)) d.diceConfigs = d.diceConfigs.map(migrateDiceConfig);
    return d;
  } catch (e) { return null; }
}

function renderConfigScreen() {
  var root = document.getElementById('app');
  // Preserve scroll position of the form across full re-renders (e.g. toggling
  // a rolls-list shouldn't snap the page back to the top).
  var prevScroll = root.querySelector('.form-scroll');
  var savedTop = prevScroll ? prevScroll.scrollTop : 0;
  root.innerHTML = buildConfigScreenHtml();
  var newScroll = root.querySelector('.form-scroll');
  if (newScroll) newScroll.scrollTop = savedTop;
  attachConfigEvents();
  updateBodyScroll();
  saveDraft();
}

function buildConfigScreenHtml() {
  var s = configState;
  var savedConfigs = loadConfigurations();
  return '<div class="screen config-screen">' +
    buildDicePreviewModalHtml() +
    buildColorPickerModalHtml() +
    buildShapePickerModalHtml() +
    buildTypePickerModalHtml() +
    (s.showConfigurations ? buildConfigurationsHtml(savedConfigs) : '') +
    '<div class="header">' +
      buildDiceLogoSvg() +
      '<h1 class="screen-title">Dice Configuration</h1>' +
      '<div class="header-actions">' +
        '<button class="icon-btn configurations-btn" id="toggle-configurations" title="Saved Configurations">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>' +
          '</svg>' +
          'Saved Configurations' +
        '</button>' +
      '</div>' +
    '</div>' +
    buildConfigFormHtml() +
  '</div>';
}

function buildDicePreviewModalHtml() {
  if (configState.dicePreviewModal === null) return '';
  var idx = configState.dicePreviewModal;
  var cfg = configState.diceConfigs[idx];
  return '<div class="modal-overlay" id="dice-modal-overlay">' +
    '<div class="modal dice-config-modal">' +
      '<div class="modal-header-row">' +
        '<h2 class="modal-title">Configuration: Dice ' + (idx + 1) + '</h2>' +
        '<button class="icon-btn" id="close-dice-modal-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        buildDiceConfigExpanded(cfg, idx) +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildColorPickerModalHtml() {
  var m = configState.colorPickerModal;
  if (!m) return '';
  var si = m.sideIndex;
  var di = m.diceIndex;
  var isBasic = si === -1;
  var cfg = configState.diceConfigs[di];
  var cur = isBasic ? cfg.baseColor : cfg.sideData[si].color;
  var swatches = AVAILABLE_COLORS.map(function(ac) {
    var isActive = ac.hex === cur;
    return '<button class="color-swatch' + (isActive ? ' active' : '') + '" ' +
      'data-color-swatch="' + ac.hex + '" data-side="' + si + '" data-dice="' + di + '" ' +
      'style="background:' + ac.hex + '" title="' + ac.name + '"></button>';
  }).join('');
  var subtitle = isBasic ? 'Dice ' + (di + 1) + ' - Basic' : 'Dice ' + (di + 1) + ' - Side ' + (si + 1);
  return '<div class="modal-overlay" id="color-picker-overlay">' +
    '<div class="modal color-picker-modal">' +
      '<div class="modal-header-row">' +
        '<div><h2 class="modal-title">Select Color</h2><div class="modal-subtitle">' + subtitle + '</div></div>' +
        '<button class="icon-btn" id="close-color-picker-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="color-swatches-grid">' + swatches + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildTypePickerModalHtml() {
  var m = configState.typePickerModal;
  if (!m) return '';
  var si = m.sideIndex;
  var di = m.diceIndex;
  var isBasic = si === -1;
  var cfg = configState.diceConfigs[di];
  var cur = isBasic ? cfg.baseType : (cfg.sideData[si].type || 'NUMBER');
  var types = [
    { val: 'NUMBER', label: 'Number',      icon: '123' },
    { val: 'TEXT',   label: 'Text/Symbol', icon: 'Abc' },
    { val: 'PIPPED', label: 'Pipped',      icon: pipPickSvg() },
  ];
  var cards = types.map(function(t) {
    return '<button class="type-pick-card' + (t.val === cur ? ' active' : '') + '" ' +
      'data-type-swatch="' + t.val + '" data-side="' + si + '" data-dice="' + di + '">' +
      '<span class="type-pick-icon">' + t.icon + '</span>' +
      '<span class="type-pick-label">' + t.label + '</span>' +
    '</button>';
  }).join('');
  var subtitle = isBasic ? 'Dice ' + (di + 1) + ' - Basic' : 'Dice ' + (di + 1) + ' - Side ' + (si + 1);
  return '<div class="modal-overlay" id="type-picker-overlay">' +
    '<div class="modal type-picker-modal">' +
      '<div class="modal-header-row">' +
        '<div><h2 class="modal-title">Select Type</h2><div class="modal-subtitle">' + subtitle + '</div></div>' +
        '<button class="icon-btn" id="close-type-picker-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body"><div class="type-pick-grid">' + cards + '</div></div>' +
    '</div>' +
  '</div>';
}

function buildShapePickerModalHtml() {
  var m = configState.shapePickerModal;
  if (!m) return '';
  var si = m.sideIndex;
  var di = m.diceIndex;
  var isBasic = si === -1;
  var cfg = configState.diceConfigs[di];
  var cur = isBasic ? cfg.baseShape : (cfg.sideData[si].shape || 'DEFAULT');
  var items = SHAPES.map(function(sh) {
    var isActive = sh.id === cur;
    var clipVal = getShapeClip(sh.id);
    var clip = clipVal ? 'clip-path:' + clipVal + ';border-radius:0;' : 'border-radius:12%;';
    return '<button class="shape-pick-btn' + (isActive ? ' active' : '') + '" ' +
      'data-shape-swatch="' + sh.id + '" data-side="' + si + '" data-dice="' + di + '" title="' + sh.label + '">' +
      '<span class="shape-pick-icon" style="' + clip + '"></span>' +
      '<span class="shape-pick-label">' + sh.label + '</span>' +
    '</button>';
  }).join('');
  var subtitle = isBasic ? 'Dice ' + (di + 1) + ' - Basic' : 'Dice ' + (di + 1) + ' - Side ' + (si + 1);
  return '<div class="modal-overlay" id="shape-picker-overlay">' +
    '<div class="modal shape-picker-modal">' +
      '<div class="modal-header-row">' +
        '<div><h2 class="modal-title">Select Shape</h2><div class="modal-subtitle">' + subtitle + '</div></div>' +
        '<button class="icon-btn" id="close-shape-picker-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body"><div class="shape-pick-grid">' + items + '</div></div>' +
    '</div>' +
  '</div>';
}

function buildDicePreviewStripHtml() {
  return '<div class="dice-preview-strip">' +
    configState.diceConfigs.map(function(cfg, i) {
      return '<div class="mini-dice-chip" data-preview-open="' + i + '">' +
        '<div class="mini-dice-face"><span class="mini-dice-text">d' + cfg.sides + '</span></div>' +
        '<span class="mini-dice-label">Die ' + (i + 1) + '</span>' +
      '</div>';
    }).join('') +
  '</div>';
}

function buildGameSettingToggle(pfx, id, label, value, hint) {
  return '<div class="setting-group">' +
    '<div class="setting-label-row">' +
      '<div class="setting-label-wrap">' +
        '<label class="setting-label">' + label + '</label>' +
        '<p class="setting-hint">' + hint + '</p>' +
      '</div>' +
      '<label class="toggle-switch">' +
        '<input type="checkbox" id="' + pfx + id + '"' + (value ? ' checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
      '</label>' +
    '</div>' +
  '</div>';
}

function buildGameSettingRow(pfx, id, label, value, hint, suffix, zeroLabel) {
  // suffix: string → append unit (e.g. 's'), true → show zeroLabel/Off for 0, falsy → plain number
  var unit = (suffix && suffix !== true) ? suffix : '';
  var zl = zeroLabel || (suffix ? 'Off' : '');
  var displayVal = zl ? (value === 0 ? zl : value + unit) : value;
  var inputType = (suffix || zeroLabel) ? 'text' : 'number';
  return '<div class="setting-group">' +
    '<div class="setting-label-row">' +
      '<div class="setting-label-wrap">' +
        '<label class="setting-label">' + label + '</label>' +
        '<p class="setting-hint">' + hint + '</p>' +
      '</div>' +
      '<div class="setting-stepper">' +
        '<button class="counter-btn" data-setting-decr="' + pfx + id + '">−</button>' +
        '<input type="' + inputType + '" id="' + pfx + id + '" class="setting-num-inp" value="' + displayVal + '" min="0"' + (inputType === 'number' ? ' inputmode="numeric"' : '') + ' data-suffix="' + unit + '"' + (zl ? ' data-zerolabel="' + zl + '"' : '') + '>' +
        '<button class="counter-btn" data-setting-incr="' + pfx + id + '">+</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildGameSettingRollsList(pfx, id, label, values, hint) {
  var enabled = values.length > 0;
  var rows = enabled ? values.map(function(v, i) {
    return '<div class="rolls-list-row">' +
        '<span class="rolls-list-prefix">Roll</span>' +
        '<button class="counter-btn" data-rolls-decr="' + pfx + id + '" data-idx="' + i + '">−</button>' +
        '<input type="number" class="setting-num-inp" data-rolls-input="' + pfx + id + '" data-idx="' + i + '" value="' + v + '" min="1" inputmode="numeric">' +
        '<button class="counter-btn" data-rolls-incr="' + pfx + id + '" data-idx="' + i + '">+</button>' +
        '<button class="rolls-list-remove" data-rolls-remove="' + pfx + id + '" data-idx="' + i + '" title="Remove">×</button>' +
      '</div>';
  }).join('') + '<button class="rolls-list-add" data-rolls-add="' + pfx + id + '">+ Add roll</button>' : '';
  return '<div class="setting-group">' +
    '<div class="setting-label-row">' +
      '<div class="setting-label-wrap">' +
        '<label class="setting-label">' + label + '</label>' +
        '<p class="setting-hint">' + hint + '</p>' +
      '</div>' +
      '<label class="toggle-switch">' +
        '<input type="checkbox" data-rolls-toggle="' + pfx + id + '"' + (enabled ? ' checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
      '</label>' +
    '</div>' +
    (enabled ? '<div class="rolls-list" data-rolls-list="' + pfx + id + '">' + rows + '</div>' : '') +
  '</div>';
}

function buildGameSettingsHtml(state, pfx) {
  var b = state.blockReThrowSeconds || 0;
  var mList = normalizeRollsList(state.autoMysteryAfterRolls);
  var erList = normalizeRollsList(state.enforceRevealAfterRolls);
  var mx = state.maxRolls || 0;
  var cr = state.confirmRestartWhenMystery !== false;
  var ul = state.allowUnlockAfterRoll !== false;
  var rl = !!state.requireLockBeforeRoll;
  return buildGameSettingRow(pfx, 'block-val',     'Block re-roll for some time', b,  'Block rolling for N seconds after each roll (0 = Off)', 's') +
         buildGameSettingRollsList(pfx, 'mystery-list',  'Auto Mystery after rolls',     mList,  'Automatically enable mystery mode after these roll numbers') +
         buildGameSettingRollsList(pfx, 'enforce-list',  'Enforce reveal after roll',    erList, 'Disable the roll button after these roll numbers until the dice are revealed') +
         buildGameSettingRow(pfx, 'limit-rolls-val', 'Limit number of rolls', mx, 'Specify a maximum number of rolls per round (0 = Off)', null, 'Off') +
         buildGameSettingToggle(pfx, 'confirm-restart', 'Confirm restart in case of unrevealed dice', cr, 'Ask before restarting when mystery dice are active') +
         buildGameSettingToggle(pfx, 'allow-unlock', 'Allow unlocking dice after re-roll', ul, 'Locked dice can be unlocked again in next roll') +
         buildGameSettingToggle(pfx, 'require-lock', 'Require lock before re-roll', rl, 'At least one die must be newly locked before rolling again');
}

function attachGameSettingsEvents(state, pfx, rerender) {
  function el(id) { return document.getElementById(id); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val || 0)); }

  function getInpVal(inp) { return parseInt(inp.value) || 0; }
  function setInpVal(inp, val) {
    var suf = inp.dataset.suffix || '';
    var zeroLabel = inp.dataset.zerolabel || '';
    if (zeroLabel && val === 0) { inp.value = zeroLabel; }
    else { inp.value = suf ? val + suf : val; }
  }

  function wireInput(inputId, max, onChange) {
    var inp = el(pfx + inputId);
    if (!inp) return;
    inp.addEventListener('change', function() {
      var val = clamp(getInpVal(inp), 0, max);
      setInpVal(inp, val);
      onChange(val);
    });
  }

  wireInput('block-val',       10, function(val) { state.blockReThrowSeconds = val; saveGameSettings(state); });
  wireInput('limit-rolls-val', 50, function(val) { state.maxRolls = val; saveGameSettings(state); if (rerender) rerender(); });

  // Rolls-list controls (Auto Mystery, Enforce Reveal). Each list is keyed by its
  // toggle id (pfx + id); we look up which state field via fieldFor() below.
  function fieldFor(key) {
    return key === pfx + 'mystery-list' ? 'autoMysteryAfterRolls' : 'enforceRevealAfterRolls';
  }
  function applyRollsList(key, newList) {
    state[fieldFor(key)] = newList;
    saveGameSettings(state);
    if (rerender) rerender();
  }
  // Find the next roll value in `dir` direction (+1/-1) from `start` that isn't already
  // taken by another row (rows other than `excludeIdx`). Never returns less than 1.
  // Returns null if scanning down and the nearest free slot is < 1 (i.e. no room).
  function nextFreeRoll(list, excludeIdx, start, dir) {
    var taken = {};
    list.forEach(function(v, i) { if (i !== excludeIdx) taken[v] = true; });
    var v = start;
    while (taken[v]) v += dir;
    return v >= 1 ? v : null;
  }
  qsa('[data-rolls-toggle]').forEach(function(chk) {
    chk.addEventListener('change', function() {
      applyRollsList(chk.dataset.rollsToggle, chk.checked ? [1] : []);
    });
  });
  qsa('[data-rolls-input]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      var key = inp.dataset.rollsInput;
      var idx = parseInt(inp.dataset.idx);
      var list = state[fieldFor(key)].slice();
      var typed = Math.max(1, parseInt(inp.value) || 1);
      // If typed value collides with another row, skip forward to the next free slot.
      var v = nextFreeRoll(list, idx, typed, +1);
      if (v === null) return;
      list[idx] = v;
      applyRollsList(key, list);
    });
  });
  qsa('[data-rolls-decr]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.dataset.rollsDecr;
      var idx = parseInt(btn.dataset.idx);
      var list = state[fieldFor(key)].slice();
      var v = nextFreeRoll(list, idx, list[idx] - 1, -1);
      if (v === null) return; // no room below — leave value as-is
      list[idx] = v;
      applyRollsList(key, list);
    });
  });
  qsa('[data-rolls-incr]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.dataset.rollsIncr;
      var idx = parseInt(btn.dataset.idx);
      var list = state[fieldFor(key)].slice();
      list[idx] = nextFreeRoll(list, idx, list[idx] + 1, +1);
      applyRollsList(key, list);
    });
  });
  qsa('[data-rolls-remove]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.dataset.rollsRemove;
      var idx = parseInt(btn.dataset.idx);
      var list = state[fieldFor(key)].slice();
      list.splice(idx, 1);
      applyRollsList(key, list);
    });
  });
  qsa('[data-rolls-add]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.dataset.rollsAdd;
      var list = state[fieldFor(key)].slice();
      // Smallest unused positive integer.
      var next = 1;
      while (list.indexOf(next) !== -1) next++;
      list.push(next);
      applyRollsList(key, list);
    });
  });

  function wireToggle(toggleId, onChange) {
    var chk = el(pfx + toggleId);
    if (!chk) return;
    chk.addEventListener('change', function() { onChange(chk.checked); });
  }
  wireToggle('confirm-restart', function(val) { state.confirmRestartWhenMystery = val; saveGameSettings(state); });
  wireToggle('allow-unlock',    function(val) { state.allowUnlockAfterRoll = val; saveGameSettings(state); });
  wireToggle('require-lock',    function(val) { state.requireLockBeforeRoll = val; saveGameSettings(state); if (rerender) rerender(); });

  var decrSel = pfx ? '[data-setting-decr^="' + pfx + '"]' : '[data-setting-decr]';
  var incrSel = pfx ? '[data-setting-incr^="' + pfx + '"]' : '[data-setting-incr]';
  qsa(decrSel).forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inp = el(btn.dataset.settingDecr);
      if (!inp) return;
      setInpVal(inp, Math.max(0, getInpVal(inp) - 1));
      inp.dispatchEvent(new Event('change'));
    });
  });
  qsa(incrSel).forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inp = el(btn.dataset.settingIncr);
      if (!inp) return;
      setInpVal(inp, getInpVal(inp) + 1);
      inp.dispatchEvent(new Event('change'));
    });
  });
}


function buildSortArrow(key) {
  var active = configState.configsSortKey === key;
  var asc = configState.configsSortAsc;
  return active
    ? (asc ? ' ↑' : ' ↓')
    : '';
}

function buildConfigurationsHtml(savedConfigs) {
  var key = configState.configsSortKey;
  var asc = configState.configsSortAsc;
  var sorted = savedConfigs.slice().sort(function(a, b) {
    var va = key === 'dice' ? a.numberOfDice : a.description.toLowerCase();
    var vb = key === 'dice' ? b.numberOfDice : b.description.toLowerCase();
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });

  var newCard = '<div class="configurations-card configurations-card-new" id="new-config-btn">' +
    '<span class="configurations-name" style="color:var(--accent-purple);">+ New configuration</span>' +
  '</div>';
  var body = sorted.length === 0
    ? '<p style="color:var(--text-w70);text-align:center;padding:16px 0">No saved configurations yet.</p>'
    : sorted.map(function(c) {
        return '<div class="configurations-card">' +
          '<div class="configurations-card-info" data-desc="' + htmlEscape(c.description) + '">' +
            '<span class="configurations-name">' + htmlEscape(c.description) + '</span>' +
            '<span class="configurations-meta">' + c.numberOfDice + ' dice</span>' +
          '</div>' +
          '<button class="icon-btn danger" data-delete="' + htmlEscape(c.description) + '" title="Delete">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<polyline points="3 6 5 6 21 6"/>' +
              '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
              '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>' +
            '</svg>' +
          '</button>' +
        '</div>';
      }).join('');

  var sortBar = '<div class="configurations-sort-bar">' +
    '<span class="configurations-sort-label">Sort by:</span>' +
    '<button class="configurations-sort-btn' + (key === 'name' ? ' active' : '') + '" data-configurations-sort="name">Name' + buildSortArrow('name') + '</button>' +
    '<button class="configurations-sort-btn' + (key === 'dice' ? ' active' : '') + '" data-configurations-sort="dice">Dice' + buildSortArrow('dice') + '</button>' +
  '</div>';

  return '<div class="modal-overlay" id="configurations-modal-overlay">' +
    '<div class="modal configurations-modal">' +
      '<div class="modal-header-row">' +
        '<h2 class="modal-title">Configurations</h2>' +
        '<div class="modal-header-actions">' +
          '<button class="btn btn-danger btn-sm" id="reset-configs-btn">Reset</button>' +
          '<button class="icon-btn" id="import-configs-btn" title="Import from JSON">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
              '<polyline points="17 8 12 3 7 8"/>' +
              '<line x1="12" y1="3" x2="12" y2="15"/>' +
            '</svg>' +
          '</button>' +
          '<button class="icon-btn" id="export-configs-btn" title="Export as JSON">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
              '<polyline points="7 10 12 15 17 10"/>' +
              '<line x1="12" y1="15" x2="12" y2="3"/>' +
            '</svg>' +
          '</button>' +
          '<button class="icon-btn" id="close-configurations-btn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="import-file-input" accept=".json,application/json" style="display:none">' +
      '<div class="modal-body">' + sortBar + '<div class="configurations-list">' + newCard + body + '</div></div>' +
    '</div>' +
  '</div>';
}

function buildConfigFormHtml() {
  var s = configState;
  return '<div class="config-form">' +
    '<div class="form-scroll">' +
      '<div class="form-group">' +
        '<input type="text" id="config-name" class="text-input" placeholder="Configuration Name" value="' + htmlEscape(s.description) + '">' +
      '</div>' +
      '<div class="dice-count-row">' +
        '<span class="label-text">Number of Dice:</span>' +
        '<div class="counter">' +
          '<button class="counter-btn" id="dice-minus">−</button>' +
          '<span class="counter-value accent-purple">' + s.numberOfDice + '</span>' +
          '<button class="counter-btn" id="dice-plus">+</button>' +
        '</div>' +
      '</div>' +
      buildDicePreviewStripHtml() +
      '<div class="divider"></div>' +
      '<h3 class="settings-section-title" style="margin-top:8px;">Game Settings</h3>' +
      '<div style="display:flex;flex-direction:column;gap:18px;padding:8px 0 8px;">' +
        buildGameSettingsHtml(configState, '') +
      '</div>' +
    '</div>' +
    '<div class="bottom-actions">' +
      '<button class="btn btn-primary" id="save-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>' +
          '<polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>' +
        '</svg>' +
        'Save configuration' +
      '</button>' +
      '<button class="btn btn-green" id="start-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<polygon points="5 3 19 12 5 21 5 3"/>' +
        '</svg>' +
        'Start Game' +
      '</button>' +
    '</div>' +
  '</div>';
}

function buildDiceConfigExpanded(cfg, index) {
  return '<div class="dice-config-expanded">' +
    buildDiceBasicSettingsHtml(cfg, index) +
    '<div class="sides-count-row">' +
      '<span class="label-text">Sides:</span>' +
      '<div class="counter">' +
        '<button class="counter-btn" data-sides-minus="' + index + '">−</button>' +
        '<span class="counter-value accent-blue">' + cfg.sides + '</span>' +
        '<button class="counter-btn" data-sides-plus="' + index + '">+</button>' +
      '</div>' +
    '</div>' +
    buildUnifiedSidesTable(cfg, index) +
  '</div>';
}

function pipPickSvg() {
  return '<svg class="type-pick-pip-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="1" y="1" width="38" height="38" rx="7" ry="7" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
    '<circle cx="11" cy="11" r="4" fill="currentColor"/>' +
    '<circle cx="29" cy="11" r="4" fill="currentColor"/>' +
    '<circle cx="11" cy="20" r="4" fill="currentColor"/>' +
    '<circle cx="29" cy="20" r="4" fill="currentColor"/>' +
    '<circle cx="11" cy="29" r="4" fill="currentColor"/>' +
    '<circle cx="29" cy="29" r="4" fill="currentColor"/>' +
  '</svg>';
}

function typeIconHtml(type) {
  if (type === 'NUMBER') return '123';
  if (type === 'TEXT')   return 'Abc';
  return pipPickSvg();
}

function shapeIconSpanHtml(shape) {
  var clip = getShapeClip(shape);
  return '<span class="side-shape-icon" style="' +
    (clip ? 'clip-path:' + clip + ';border-radius:0' : 'border-radius:12%') + '"></span>';
}

function colorDotBtnHtml(color, dataAttrs) {
  return '<button class="side-color-dot-btn" ' + dataAttrs + ' title="Pick color">' +
    '<span class="side-color-dot" style="background:' + color + '"></span>' +
  '</button>';
}

function shapeBtnHtml(shape, dataAttrs) {
  return '<button class="side-shape-btn" ' + dataAttrs + ' title="Pick form">' +
    shapeIconSpanHtml(shape) +
  '</button>';
}

function typeBtnHtml(labelInnerHtml, dataAttrs) {
  return '<button class="side-type-btn" ' + dataAttrs + '>' +
    '<span class="side-type-label">' + labelInnerHtml + '</span>' +
  '</button>';
}

var TYPE_TEXT_LABELS = { NUMBER: 'Number', TEXT: 'Text', PIPPED: 'Pipped' };

function buildDiceBasicSettingsHtml(cfg, index) {
  var baseType = cfg.baseType || 'PIPPED';
  var baseShape = cfg.baseShape || 'DEFAULT';
  var baseColor = cfg.baseColor || '#FFFFFF';

  var basicAttrs = 'data-dice="' + index + '"';
  var typeBtn  = typeBtnHtml(TYPE_TEXT_LABELS[baseType] || baseType, 'data-type-pick="-1" ' + basicAttrs);
  var shapeBtn = shapeBtnHtml(baseShape, 'data-shape-pick="-1" ' + basicAttrs);
  var colorBtn = colorDotBtnHtml(baseColor, 'data-color-pick="-1" ' + basicAttrs);

  return '<div class="basic-settings-section">' +
    '<h4 class="basic-settings-title">Die Basic Settings</h4>' +
    '<div class="basic-settings-row">' +
      '<div class="basic-settings-field">' +
        '<span class="basic-settings-label">Type:</span>' + typeBtn +
      '</div>' +
      '<div class="basic-settings-field">' +
        '<span class="basic-settings-label">Shape:</span>' + shapeBtn +
      '</div>' +
      '<div class="basic-settings-field">' +
        '<span class="basic-settings-label">Color:</span>' + colorBtn +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildUnifiedSidesTable(cfg, index) {
  var rows = (cfg.sideData || []).map(function(side, si) {
    var pickAttrs = 'data-dice="' + index + '"';
    var typeBtn  = typeBtnHtml(typeIconHtml(side.type), 'data-type-pick="' + si + '" ' + pickAttrs);
    var shapeBtn = shapeBtnHtml(side.shape || 'DEFAULT', 'data-shape-pick="' + si + '" ' + pickAttrs);
    var colorBtn = colorDotBtnHtml(side.color || '#FFFFFF', 'data-color-pick="' + si + '" ' + pickAttrs);

    // Value / text / pip cell
    var valueCell;
    if (side.type === 'NUMBER') {
      var numVal = (side.value !== null && side.value !== undefined) ? side.value : '';
      valueCell =
        '<div class="side-num-wrap">' +
          '<button class="side-num-btn" data-side-decr="' + si + '" data-dice="' + index + '">−</button>' +
          '<input type="number" class="side-inp side-inp-num" value="' + numVal + '" min="0" max="9999999999" data-side-value="' + si + '" data-dice="' + index + '" oninput="if(this.value.replace(\'-\',\'\').length>10)this.value=this.value.slice(0,10)">' +
          '<button class="side-num-btn" data-side-incr="' + si + '" data-dice="' + index + '">+</button>' +
        '</div>';
    } else if (side.type === 'TEXT') {
      valueCell = '<input type="text" class="side-inp" value="' + htmlEscape(side.value || '') + '" placeholder="text" maxlength="10" data-side-text="' + si + '" data-dice="' + index + '">';
    } else if (side.type === 'PIPPED') {
      var pipVal = (side.value !== null && side.value !== undefined) ? side.value : 1;
      valueCell = '<select class="side-sel" data-side-pip="' + si + '" data-dice="' + index + '">' +
        [0,1,2,3,4,5,6].map(function(n) {
          return '<option value="' + n + '"' + (n === pipVal ? ' selected' : '') + '>' + n + ': ' + '●'.repeat(n) + '</option>';
        }).join('') + '</select>';
    } else {
      valueCell = '<span class="side-none">—</span>';
    }

    return '<div class="side-row">' +
      '<span class="side-num">' + (si + 1) + '</span>' +
      typeBtn +
      shapeBtn +
      colorBtn +
      '<div class="side-val-wrap">' + valueCell + '</div>' +
    '</div>';
  }).join('');

  return '<div class="sides-table">' +
    '<div class="sides-hdr">' +
      '<span>#</span><span>Type</span><span>Shape</span><span>Color</span><span>Value / Text</span>' +
    '</div>' +
    rows +
  '</div>';
}

function attachConfigEvents() {
  var s = configState;

  function el(id) { return document.getElementById(id); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  el('toggle-configurations') && el('toggle-configurations').addEventListener('click', function() {
    configState.showConfigurations = !configState.showConfigurations;
    renderConfigScreen();
  });

  el('close-configurations-btn') && el('close-configurations-btn').addEventListener('click', function() {
    configState.showConfigurations = false;
    renderConfigScreen();
  });
  el('configurations-modal-overlay') && el('configurations-modal-overlay').addEventListener('click', function(e) {
    if (e.target === el('configurations-modal-overlay')) { configState.showConfigurations = false; renderConfigScreen(); }
  });

  qsa('[data-configurations-sort]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.dataset.configurationsSort;
      if (configState.configsSortKey === key) {
        configState.configsSortAsc = !configState.configsSortAsc;
      } else {
        configState.configsSortKey = key;
        configState.configsSortAsc = true;
      }
      renderConfigScreen();
    });
  });

  // Reset configurations to defaults
  el('reset-configs-btn') && el('reset-configs-btn').addEventListener('click', function() {
    showConfirmModal('Remove all configurations and reload the pre-defined ones?', function() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_CONFIG_KEY);
      localStorage.removeItem(DRAFT_KEY);
      seedDefaultConfigurations();
      configState.showConfigurations = false;
      initConfigScreen();
    });
  });

  // Export configurations as JSON
  el('export-configs-btn') && el('export-configs-btn').addEventListener('click', function() {
    var data = JSON.stringify(serializeConfigs(loadConfigurations()), null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dice-configurations.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import configurations from JSON
  el('import-configs-btn') && el('import-configs-btn').addEventListener('click', function() {
    el('import-file-input') && el('import-file-input').click();
  });
  el('import-file-input') && el('import-file-input').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var imported = deserializeConfigs(JSON.parse(ev.target.result));
        if (!Array.isArray(imported)) throw new Error('Not an array');
        var existing = loadConfigurations();
        imported.forEach(function(cfg) {
          if (!cfg.description) return;
          var idx = existing.findIndex(function(c) { return c.description === cfg.description; });
          if (idx >= 0) existing[idx] = cfg; else existing.push(cfg);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        showToast('Imported ' + imported.length + ' configuration(s)');
        renderConfigScreen();
      } catch(err) {
        showToast('Invalid JSON file', true);
      }
    };
    reader.readAsText(file);
  });

  // History
  el('new-config-btn') && el('new-config-btn').addEventListener('click', function() {
    localStorage.removeItem(LAST_CONFIG_KEY);
    initConfigScreen();
  });

  qsa('.configurations-card-info').forEach(function(div) {
    div.addEventListener('click', function() {
      var configs = loadConfigurations();
      var cfg = configs.find(function(c) { return c.description === div.dataset.desc; });
      if (cfg) {
        localStorage.setItem(LAST_CONFIG_KEY, cfg.description);
        var loaded = {
          description: cfg.description,
          numberOfDice: cfg.numberOfDice,
          diceConfigs: cfg.diceConfigs,
          blockReThrowSeconds: cfg.blockReThrowSeconds || 0,
          autoMysteryAfterRolls: normalizeRollsList(cfg.autoMysteryAfterRolls),
          enforceRevealAfterRolls: normalizeRollsList(cfg.enforceRevealAfterRolls),
          maxRolls: cfg.maxRolls || 0,
          confirmRestartWhenMystery: cfg.confirmRestartWhenMystery !== false,
          allowUnlockAfterRoll: cfg.allowUnlockAfterRoll !== false,
          requireLockBeforeRoll: !!cfg.requireLockBeforeRoll,
          showConfigurations: false,
        };
        Object.assign(configState, loaded);
        // Reset session game settings to the config's saved values so refresh stays consistent
        saveGameSettings(configState);
        renderConfigScreen();
      }
    });
  });
  qsa('[data-delete]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteConfiguration(btn.dataset.delete);
      renderConfigScreen();
    });
  });

  // Config form
  el('config-name') && el('config-name').addEventListener('input', function(e) {
    configState.description = e.target.value;
    saveDraft();
  });
  el('dice-minus') && el('dice-minus').addEventListener('click', function() {
    updateConfigNumberOfDice(s.numberOfDice - 1);
  });
  el('dice-plus') && el('dice-plus').addEventListener('click', function() {
    updateConfigNumberOfDice(s.numberOfDice + 1);
  });
  el('save-btn') && el('save-btn').addEventListener('click', function() {
    var desc = configState.description.trim();
    if (!desc) { showToast('Please enter a configuration name', true); return; }
    saveConfiguration({
      description: desc,
      numberOfDice: configState.numberOfDice,
      diceConfigs: configState.diceConfigs,
      blockReThrowSeconds: configState.blockReThrowSeconds,
      autoMysteryAfterRolls: configState.autoMysteryAfterRolls,
      enforceRevealAfterRolls: configState.enforceRevealAfterRolls,
      maxRolls: configState.maxRolls || 0,
      confirmRestartWhenMystery: configState.confirmRestartWhenMystery !== false,
      allowUnlockAfterRoll: configState.allowUnlockAfterRoll !== false,
      requireLockBeforeRoll: !!configState.requireLockBeforeRoll,
    });
    localStorage.setItem(LAST_CONFIG_KEY, desc);
    showToast("Configuration '" + desc + "' saved");
  });
  el('start-btn') && el('start-btn').addEventListener('click', function() {
    initRollingScreen({
      description: configState.description,
      diceConfigs: configState.diceConfigs,
      blockReThrowSeconds: configState.blockReThrowSeconds,
      autoMysteryAfterRolls: configState.autoMysteryAfterRolls,
      enforceRevealAfterRolls: configState.enforceRevealAfterRolls,
      maxRolls: configState.maxRolls || 0,
      confirmRestartWhenMystery: configState.confirmRestartWhenMystery !== false,
      allowUnlockAfterRoll: configState.allowUnlockAfterRoll !== false,
      requireLockBeforeRoll: !!configState.requireLockBeforeRoll,
    });
  });
  attachGameSettingsEvents(configState, '', renderConfigScreen);

  // Dice preview strip — open modal
  qsa('[data-preview-open]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      configState.dicePreviewModal = parseInt(chip.dataset.previewOpen);
      renderConfigScreen();
    });
  });

  // Dice modal — close
  el('close-dice-modal-btn') && el('close-dice-modal-btn').addEventListener('click', function() {
    configState.dicePreviewModal = null;
    renderConfigScreen();
  });
  el('dice-modal-overlay') && el('dice-modal-overlay').addEventListener('click', function(e) {
    if (e.target === el('dice-modal-overlay')) {
      configState.dicePreviewModal = null;
      renderConfigScreen();
    }
  });

  // Sides +/-
  qsa('[data-sides-minus]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = parseInt(btn.dataset.sidesMinus);
      var cfg = configState.diceConfigs[i];
      var newSides = Math.max(2, cfg.sides - 1);
      updateDiceConfig(i, updateDiceConfigSides(cfg, newSides));
    });
  });
  qsa('[data-sides-plus]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = parseInt(btn.dataset.sidesPlus);
      var cfg = configState.diceConfigs[i];
      var newSides = cfg.sides + 1;
      updateDiceConfig(i, updateDiceConfigSides(cfg, newSides));
    });
  });

  // Sides table — type dropdown
  // Type button — open type picker modal
  qsa('[data-type-pick]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      configState.typePickerModal = { sideIndex: parseInt(btn.dataset.typePick), diceIndex: parseInt(btn.dataset.dice) };
      renderConfigScreen();
    });
  });

  // Type picker — close
  el('close-type-picker-btn') && el('close-type-picker-btn').addEventListener('click', function() {
    configState.typePickerModal = null;
    renderConfigScreen();
  });
  el('type-picker-overlay') && el('type-picker-overlay').addEventListener('click', function(e) {
    if (e.target === el('type-picker-overlay')) { configState.typePickerModal = null; renderConfigScreen(); }
  });

  // Type picker — card click
  qsa('[data-type-swatch]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var si = parseInt(btn.dataset.side);
      var i = parseInt(btn.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var newType = btn.dataset.typeSwatch;
      if (si === -1) {
        var sdAll = cfg.sideData.map(function(old, idx) {
          if (old.type === newType) return old;
          var nv;
          if (newType === 'NUMBER') nv = idx + 1;
          else if (newType === 'PIPPED') nv = Math.min(idx + 1, 6);
          else nv = ''; // TEXT
          return Object.assign({}, old, { type: newType, value: nv });
        });
        configState.typePickerModal = null;
        updateDiceConfig(i, Object.assign({}, cfg, { baseType: newType, sideData: sdAll }));
        return;
      }
      var sd = cfg.sideData.slice();
      var old = sd[si];
      var newVal = old.value;
      if (newType === 'NUMBER' && typeof newVal !== 'number') newVal = si + 1;
      if (newType === 'PIPPED') newVal = Math.min(Math.max(typeof old.value === 'number' ? old.value : 1, 0), 6);
      if (newType === 'TEXT' && typeof newVal !== 'string') newVal = '';
      sd[si] = Object.assign({}, old, { type: newType, value: newVal });
      configState.typePickerModal = null;
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });

  // Sides table — color dropdown
  // Color dot — open color picker modal
  qsa('[data-color-pick]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      configState.colorPickerModal = { sideIndex: parseInt(btn.dataset.colorPick), diceIndex: parseInt(btn.dataset.dice) };
      renderConfigScreen();
    });
  });

  // Color picker modal — close
  el('close-color-picker-btn') && el('close-color-picker-btn').addEventListener('click', function() {
    configState.colorPickerModal = null;
    renderConfigScreen();
  });
  el('color-picker-overlay') && el('color-picker-overlay').addEventListener('click', function(e) {
    if (e.target === el('color-picker-overlay')) { configState.colorPickerModal = null; renderConfigScreen(); }
  });

  // Color picker modal — swatch click
  qsa('[data-color-swatch]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var si = parseInt(btn.dataset.side);
      var i = parseInt(btn.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var newColor = btn.dataset.colorSwatch;
      if (si === -1) {
        var sdAll = cfg.sideData.map(function(s) { return Object.assign({}, s, { color: newColor }); });
        configState.colorPickerModal = null;
        updateDiceConfig(i, Object.assign({}, cfg, { baseColor: newColor, sideData: sdAll }));
        return;
      }
      var sd = cfg.sideData.slice();
      sd[si] = Object.assign({}, sd[si], { color: newColor });
      configState.colorPickerModal = null;
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });


  // Shape picker — open
  qsa('[data-shape-pick]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      configState.shapePickerModal = { sideIndex: parseInt(btn.dataset.shapePick), diceIndex: parseInt(btn.dataset.dice) };
      renderConfigScreen();
    });
  });

  // Shape picker — close
  el('close-shape-picker-btn') && el('close-shape-picker-btn').addEventListener('click', function() {
    configState.shapePickerModal = null;
    renderConfigScreen();
  });
  el('shape-picker-overlay') && el('shape-picker-overlay').addEventListener('click', function(e) {
    if (e.target === el('shape-picker-overlay')) { configState.shapePickerModal = null; renderConfigScreen(); }
  });

  // Shape picker — swatch click
  qsa('[data-shape-swatch]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var si = parseInt(btn.dataset.side);
      var i = parseInt(btn.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var newShape = btn.dataset.shapeSwatch;
      if (si === -1) {
        var sdAll = cfg.sideData.map(function(s) { return Object.assign({}, s, { shape: newShape }); });
        configState.shapePickerModal = null;
        updateDiceConfig(i, Object.assign({}, cfg, { baseShape: newShape, sideData: sdAll }));
        return;
      }
      var sd = cfg.sideData.slice();
      sd[si] = Object.assign({}, sd[si], { shape: newShape });
      configState.shapePickerModal = null;
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });

  // Sides table — number value input
  qsa('[data-side-value]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      var si = parseInt(inp.dataset.sideValue);
      var i = parseInt(inp.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var sd = cfg.sideData.slice();
      sd[si] = Object.assign({}, sd[si], { value: parseInt(inp.value) || 0 });
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });

  // Sides table — number +/- buttons
  qsa('[data-side-decr]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var si = parseInt(btn.dataset.sideDecr);
      var i = parseInt(btn.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var sd = cfg.sideData.slice();
      var cur = typeof sd[si].value === 'number' ? sd[si].value : 0;
      sd[si] = Object.assign({}, sd[si], { value: Math.max(0, cur - 1) });
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });
  qsa('[data-side-incr]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var si = parseInt(btn.dataset.sideIncr);
      var i = parseInt(btn.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var sd = cfg.sideData.slice();
      var cur = typeof sd[si].value === 'number' ? sd[si].value : 0;
      sd[si] = Object.assign({}, sd[si], { value: cur + 1 });
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });

  // Sides table — text input (input keeps state, change re-renders)
  qsa('[data-side-text]').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var si = parseInt(inp.dataset.sideText);
      var i = parseInt(inp.dataset.dice);
      configState.diceConfigs[i].sideData[si] = Object.assign({}, configState.diceConfigs[i].sideData[si], { value: inp.value });
    });
    inp.addEventListener('change', function() {
      var si = parseInt(inp.dataset.sideText);
      var i = parseInt(inp.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var sd = cfg.sideData.slice();
      sd[si] = Object.assign({}, sd[si], { value: inp.value });
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });

  // Sides table — pip dropdown
  qsa('[data-side-pip]').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var si = parseInt(sel.dataset.sidePip);
      var i = parseInt(sel.dataset.dice);
      var cfg = configState.diceConfigs[i];
      var sd = cfg.sideData.slice();
      sd[si] = Object.assign({}, sd[si], { value: parseInt(sel.value) });
      updateDiceConfig(i, Object.assign({}, cfg, { sideData: sd }));
    });
  });
}

function updateConfigNumberOfDice(n) {
  var newN = Math.max(1, n);
  var configs = configState.diceConfigs.slice();
  while (configs.length < newN) configs.push(createDefaultDiceConfig(6));
  while (configs.length > newN) configs.pop();
  configState.numberOfDice = newN;
  configState.diceConfigs = configs;
  configState.dicePreviewModal = null;
  renderConfigScreen();
}

function updateDiceConfig(index, newConfig) {
  var configs = configState.diceConfigs.slice();
  configs[index] = newConfig;
  configState.diceConfigs = configs;
  renderConfigScreen();
}

// ============================================================
// ROLLING SCREEN
// ============================================================
var rollingState = null;
var _blockTimer = null;

function leaveRollingScreen() {
  clearInterval(_blockTimer);
  syncGameSettingsFromRolling();
  rollingState = null;
  if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
  history.replaceState({ screen: 'config' }, '');
  renderConfigScreen();
}

function syncGameSettingsFromRolling() {
  configState.blockReThrowSeconds = rollingState.blockReThrowSeconds;
  configState.autoMysteryAfterRolls = normalizeRollsList(rollingState.autoMysteryAfterRolls);
  configState.enforceRevealAfterRolls = normalizeRollsList(rollingState.enforceRevealAfterRolls);
  configState.maxRolls = rollingState.maxRolls;
  configState.confirmRestartWhenMystery = rollingState.confirmRestartWhenMystery !== false;
  configState.allowUnlockAfterRoll = rollingState.allowUnlockAfterRoll !== false;
  configState.requireLockBeforeRoll = !!rollingState.requireLockBeforeRoll;
  saveGameSettings(configState);
}

function initRollingScreen(params) {
  var diceConfigs = params.diceConfigs;
  var mysteryList = normalizeRollsList(params.autoMysteryAfterRolls);
  var enforceList = normalizeRollsList(params.enforceRevealAfterRolls);
  rollingState = {
    description: params.description || '',
    diceConfigs: diceConfigs,
    diceValues: diceConfigs.map(function(c) { return rollDie(c); }),
    lockedDice: diceConfigs.map(function() { return false; }),
    permanentlyLocked: diceConfigs.map(function() { return false; }),
    lockedBeforeLastRoll: diceConfigs.map(function() { return false; }),
    isHidden: false,
    individualMysteryDice: diceConfigs.map(function(_, i) { return mysteryList.indexOf(1) !== -1; }),
    blockReThrowSeconds: params.blockReThrowSeconds || 0,
    autoMysteryAfterRolls: mysteryList,
    enforceRevealAfterRolls: enforceList,
    maxRolls: params.maxRolls || 0,
    confirmRestartWhenMystery: params.confirmRestartWhenMystery !== false,
    allowUnlockAfterRoll: params.allowUnlockAfterRoll !== false,
    requireLockBeforeRoll: !!params.requireLockBeforeRoll,
    revealRequired: enforceList.indexOf(1) !== -1,
    rollCount: 1,
    roundNumber: 1,
    diceSize: (loadViewSettings().diceSize) || 1.0,
    diceOrder: diceConfigs.map(function(_, i) { return i; }),
    diceOrderMode: (loadViewSettings().diceOrderMode) || 'off',
    swipeToRoll: (loadViewSettings().swipeToRoll) !== undefined ? loadViewSettings().swipeToRoll : (navigator.maxTouchPoints > 0),
    showSettings: false,
    showInfo: false,
    showHistory: false,
    showRestartConfirm: false,
    showBackConfirm: false,
    rollHistory: [],
    remainingBlockSeconds: 0,
  };
  clearInterval(_blockTimer);
  _longPressTimers = {};
  // Record the initial roll as the first history entry
  rollingState.rollHistory.push({
    round: rollingState.roundNumber,
    roll: rollingState.rollCount,
    diceValues: rollingState.diceValues.slice(),
    lockedDice: rollingState.lockedDice.slice(),
    individualMysteryDice: rollingState.individualMysteryDice.slice(),
    isHidden: rollingState.isHidden,
  });
  history.pushState({ screen: 'rolling' }, '');
  renderRollingScreen();
}

function buildDiceLogoSvg() {
  return '<svg class="config-title-dice" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="translate(4,25) rotate(-8,18,18)">' +
      '<rect x="0" y="0" width="36" height="36" rx="6" fill="white" stroke="#ccc" stroke-width="1.2"/>' +
      '<text x="18" y="25" text-anchor="middle" font-size="22" font-weight="bold" font-family="sans-serif" fill="#333">✕</text>' +
    '</g>' +
    '<g transform="translate(22,2) rotate(6,18,18)">' +
      '<rect x="0" y="0" width="36" height="36" rx="6" fill="#FDD835" stroke="#F9A825" stroke-width="1.2"/>' +
      '<circle cx="10" cy="10" r="3.5" fill="#5D4037"/>' +
      '<circle cx="26" cy="10" r="3.5" fill="#5D4037"/>' +
      '<circle cx="18" cy="18" r="3.5" fill="#5D4037"/>' +
      '<circle cx="10" cy="26" r="3.5" fill="#5D4037"/>' +
      '<circle cx="26" cy="26" r="3.5" fill="#5D4037"/>' +
    '</g>' +
    '<g transform="translate(42,22) rotate(-15,18,21)">' +
      '<polygon points="18,0 38,36 -2,36" fill="#43A047" stroke="#2E7D32" stroke-width="1.2"/>' +
      '<text x="18" y="30" text-anchor="middle" font-size="14" font-weight="bold" font-family="sans-serif" fill="white">20</text>' +
    '</g>' +
  '</svg>';
}

function buildMysteryBtnInner(isRevealed) {
  if (isRevealed) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Reveal';
  }
  return '<svg viewBox="0 0 36 36" fill="currentColor" width="20" height="20"><path fill="currentColor" d="M17 27a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3c.603-.006 6-1 6-5c0-2-2-4-5-4c-2.441 0-4 2-4 3a3 3 0 1 1-6 0c0-4.878 4.58-9 10-9c8 0 11 5.982 11 11c0 4.145-2.277 7.313-6.413 8.92c-.9.351-1.79.587-2.587.747V24a3 3 0 0 1-3 3z"/><circle fill="currentColor" cx="17" cy="32" r="3"/></svg> Mystery';
}

function naturalCompare(a, b) {
  var ax = String(a).replace(/(\d+)/g, function(n) { return n.padStart(20, '0'); });
  var bx = String(b).replace(/(\d+)/g, function(n) { return n.padStart(20, '0'); });
  return ax < bx ? -1 : ax > bx ? 1 : 0;
}

function applyDiceOrder() {
  var s = rollingState;
  var indices = s.diceConfigs.map(function(_, i) { return i; });
  if (s.diceOrderMode === 'color') {
    indices.sort(function(a, b) {
      var ca = (s.diceConfigs[a].sideData && s.diceConfigs[a].sideData[s.diceValues[a]] && s.diceConfigs[a].sideData[s.diceValues[a]].color) || '';
      var cb = (s.diceConfigs[b].sideData && s.diceConfigs[b].sideData[s.diceValues[b]] && s.diceConfigs[b].sideData[s.diceValues[b]].color) || '';
      return ca < cb ? -1 : ca > cb ? 1 : 0;
    });
    s.diceOrder = indices;
  } else if (s.diceOrderMode === 'value') {
    indices.sort(function(a, b) {
      var va = s.diceConfigs[a].sideData && s.diceConfigs[a].sideData[s.diceValues[a]];
      var vb = s.diceConfigs[b].sideData && s.diceConfigs[b].sideData[s.diceValues[b]];
      var sa = va ? String(va.value !== null && va.value !== undefined ? va.value : '') : '';
      var sb = vb ? String(vb.value !== null && vb.value !== undefined ? vb.value : '') : '';
      return naturalCompare(sa, sb);
    });
    s.diceOrder = indices;
  }
}

function renderRollingScreen() {
  var root = document.getElementById('app');
  root.innerHTML = buildRollingScreenHtml();
  attachRollingEvents();
  updateBodyScroll();
}

function buildRollingScreenHtml() {
  var s = rollingState;
  var blocked = s.remainingBlockSeconds > 0;
  var maxed = s.maxRolls > 0 && s.rollCount >= s.maxRolls;
  var allLocked = s.lockedDice.length > 0 && s.lockedDice.every(function(v) { return v; });
  var needsLock = s.requireLockBeforeRoll && !s.lockedDice.some(function(v,i){return v && !s.lockedBeforeLastRoll[i];});
  var needsReveal = !!s.revealRequired;
  return '<div class="screen rolling-screen">' +
    buildRollingSettingsDialog() +
    buildRestartConfirmModal() +
    buildRollingInfoModal(s) +
    buildRollingHistoryModal() +
    buildBackConfirmModal() +
    '<div class="header">' +
      '<button class="icon-btn" id="back-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>' +
      buildDiceLogoSvg() +
      '<div class="screen-title-wrap">' +
        '<h1 class="screen-title">Roll the Dice</h1>' +
        (s.description ? '<div class="screen-subtitle">' + htmlEscape(s.description) + '</div>' : '') +
      '</div>' +
      '<div class="header-actions">' +
        '<button class="icon-btn" id="rolling-history-btn" title="Roll History">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>' +
          '</svg>' +
        '</button>' +
        '<button class="icon-btn" id="rolling-info-btn" title="Help">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>' +
          '</svg>' +
        '</button>' +
        '<button class="icon-btn" id="fullscreen-btn" title="Fullscreen">' +
          (document.fullscreenElement
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>') +
        '</button>' +
        '<button class="icon-btn" id="rolling-settings-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="3"/>' +
            '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="mystery-row">' +
      '<button class="btn btn-purple btn-mystery" id="mystery-btn">' +
        buildMysteryBtnInner(s.individualMysteryDice.some(function(v, i) { return v && !s.lockedDice[i]; })) +
      '</button>' +
      '<span class="round-count">Round: ' + s.roundNumber + '</span>' +
      '<span class="roll-count">Roll: ' + s.rollCount + (s.maxRolls > 0 ? '/' + s.maxRolls : '') + '</span>' +
    '</div>' +

    '<div class="dice-grid-wrapper" id="dice-grid">' +
      buildDiceGrid() +
    '</div>' +

    '<div class="bottom-actions">' +
      '<button class="btn btn-orange" id="reset-btn">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>' +
        '</svg>' +
        'Restart' +
      '</button>' +
      '<button class="btn btn-green' + (blocked || maxed || allLocked || needsLock || needsReveal ? ' disabled' : '') + '" id="roll-btn"' + (blocked || maxed || allLocked || needsLock || needsReveal ? ' disabled' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
        '</svg>' +
        '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:0;">' +
          '<span>' + (maxed ? 'Max reached' : blocked ? 'Wait ' + s.remainingBlockSeconds + 's' : allLocked ? 'All locked' : needsLock ? 'Lock a die first' : needsReveal ? 'Reveal first' : 'Roll') + '</span>' +
          (s.swipeToRoll && !maxed && !blocked && !allLocked && !needsLock && !needsReveal ? '<span style="font-size:10px;opacity:0.7;font-weight:400;line-height:1;">Swipe left/right</span>' : '') +
        '</span>' +
      '</button>' +
    '</div>' +
  '</div>';
}

function buildDiceGrid() {
  applyDiceOrder();
  var s = rollingState;
  var cols = s.diceSize <= 0.6 ? 4 : s.diceSize <= 0.8 ? 3 : s.diceSize <= 1.5 ? 2 : 1;
  return '<div class="dice-grid cols-' + cols + '">' +
    s.diceOrder.map(function(originalIndex) {
      var cfg = s.diceConfigs[originalIndex];
      if (!cfg) return '';
      return buildDiceItem(
        originalIndex, cfg,
        s.diceValues[originalIndex] || 0,
        s.lockedDice[originalIndex],
        s.isHidden,
        s.individualMysteryDice[originalIndex],
        s.diceSize
      );
    }).join('') +
  '</div>';
}

function buildDiceItem(index, cfg, value, isLocked, isHidden, isIndividualMystery, diceSize) {
  var showMystery = (!isLocked && isHidden) || isIndividualMystery;
  var side = cfg.sideData && cfg.sideData[value];
  var shape = (side && side.shape) || 'DEFAULT';
  var bgColor = (side && side.color) || '#FFFFFF';
  var fgColor = contrastColor(bgColor);
  var clip = getShapeClip(shape);
  var shapeStyle = 'background:' + bgColor + ';' +
    (clip ? 'clip-path:' + clip + ';border-radius:0;' : 'border-radius:12%;');
  return '<div class="dice-face' + (isLocked ? ' locked' : '') + '" data-index="' + index + '" style="width:' + Math.round(150*diceSize) + 'px;height:' + Math.round(150*diceSize) + 'px;" title="Click to lock/unlock | Long press or right-click for mystery">' +
    '<div class="dice-label">Dice ' + (index + 1) + '</div>' +
    '<div class="dice-content">' +
      (showMystery
        ? '<div class="mystery-icon' + (isIndividualMystery ? ' individual' : '') + '">?</div>'
        : '<div class="dice-shape-wrap" style="' + shapeStyle + '">' +
            buildDiceFace(cfg, value, isLocked, fgColor) +
          '</div>') +
    '</div>' +
    (isLocked ? '<div class="lock-indicator">🔒</div>' : '') +
  '</div>';
}

function buildPipGrid(n, isLocked, fgColor) {
  var layout = PIP_LAYOUTS[n];
  if (!layout) return '<span class="face-number" style="color:' + (fgColor||'#000') + '">' + n + '</span>';
  var dotStyle = 'background:' + (fgColor || '#000000');
  return '<div class="pip-grid">' +
    layout.map(function(active) {
      return '<span class="pip-slot">' + (active ? '<span class="pip-dot" style="' + dotStyle + '"></span>' : '') + '</span>';
    }).join('') +
  '</div>';
}

function buildDiceFace(cfg, value, isLocked, fgColor) {
  var side = cfg.sideData && cfg.sideData[value];
  if (!side) return '';
  var fg = fgColor || '#000000';

  switch (side.type) {
    case 'NUMBER': {
      var numVal = (side.value !== null && side.value !== undefined) ? side.value : '';
      return '<span class="face-number" style="color:' + fg + '">' + numVal + '</span>';
    }
    case 'COLOR': {
      return ''; // shape itself is the color, nothing inside
    }
    case 'TEXT': {
      var text = side.value || '';
      var fontSize = text.length <= 3 ? 'text-lg' : text.length <= 6 ? 'text-md' : 'text-sm';
      return '<span class="face-text ' + fontSize + '" style="color:' + fg + '">' + htmlEscape(text) + '</span>';
    }
    case 'PIPPED': {
      var pipN = typeof side.value === 'number' ? side.value : 1;
      return buildPipGrid(pipN, isLocked, fg);
    }
    default: return '';
  }
}

function buildHistoryDieChip(cfg, value, isLocked, isMystery, diceSize) {
  var size = Math.round(60 * diceSize);
  var side = cfg.sideData && cfg.sideData[value];
  var shape = (side && side.shape) || 'DEFAULT';
  var bgColor = (side && side.color) || '#FFFFFF';
  var fgColor = contrastColor(bgColor);
  var clip = getShapeClip(shape);
  var shapeStyle = 'background:' + bgColor + ';width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
    (clip ? 'clip-path:' + clip + ';border-radius:0;' : 'border-radius:12%;');
  if (isMystery) {
    var mysteryStyle = 'width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:12%;background:rgba(255,255,255,0.08);';
    return '<div style="position:relative;display:inline-block;">' +
      '<div style="' + mysteryStyle + '"><span style="font-size:' + Math.round(size * 0.55) + 'px;font-weight:900;color:var(--purple);line-height:1;">?</span></div>' +
      (isLocked ? '<div style="position:absolute;bottom:1px;right:1px;font-size:' + Math.round(size * 0.3) + 'px;line-height:1;">🔒</div>' : '') +
    '</div>';
  }
  var inner = buildDiceFace(cfg, value, isLocked, fgColor);
  return '<div style="position:relative;display:inline-block;">' +
    '<div style="' + shapeStyle + '">' + inner + '</div>' +
    (isLocked ? '<div style="position:absolute;bottom:1px;right:1px;font-size:' + Math.round(size * 0.3) + 'px;line-height:1;">🔒</div>' : '') +
  '</div>';
}

function buildRollingHistoryModal() {
  if (!rollingState.showHistory) return '';
  var s = rollingState;
  var hs = s.rollHistory;
  var rows = hs.map(function(entry, idx) {
      var isFirstRollOfRound = idx === 0 || hs[idx - 1].round !== entry.round;
      var diceChips = entry.diceValues.map(function(val, i) {
        var isMystery = entry.isHidden || entry.individualMysteryDice[i];
        return buildHistoryDieChip(s.diceConfigs[i], val, entry.lockedDice[i], isMystery, s.diceSize);
      }).join('');
      return '<tr class="history-row' + (isFirstRollOfRound ? ' history-round-start' : '') + '">' +
        '<td class="history-cell history-cell-num">' + entry.round + '</td>' +
        '<td class="history-cell history-cell-num">' + entry.roll + '</td>' +
        '<td class="history-cell"><div class="history-dice-row">' + diceChips + '</div></td>' +
      '</tr>';
  }).join('');
  var body = '<div class="history-scroll"><table class="history-table">' +
    '<thead><tr>' +
      '<th class="history-cell history-cell-num">Round</th>' +
      '<th class="history-cell history-cell-num">Roll</th>' +
      '<th class="history-cell" style="text-align:center">Dice</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
  '</table></div>';
  return '<div class="modal-overlay" id="rolling-history-overlay">' +
    '<div class="modal" style="max-width:500px">' +
      '<div class="modal-header-row">' +
        '<h2 class="modal-title">Roll History</h2>' +
        '<div class="modal-header-actions">' +
          '<button class="icon-btn" id="export-history-btn" title="Export as JSON">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
              '<polyline points="7 10 12 15 17 10"/>' +
              '<line x1="12" y1="15" x2="12" y2="3"/>' +
            '</svg>' +
          '</button>' +
          '<button class="icon-btn" id="close-rolling-history-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-body" style="padding:0;">' + body + '</div>' +
    '</div>' +
  '</div>';
}

function buildBackConfirmModal() {
  if (!rollingState.showBackConfirm) return '';
  return '<div class="modal-overlay" id="back-confirm-overlay">' +
    '<div class="modal" style="max-width:300px;text-align:center;">' +
      '<div class="modal-body">' +
        '<h2 class="modal-title">Leave Game?</h2>' +
        '<p style="color:var(--text-w70);font-size:14px;margin:12px 0 20px;">Your roll history will be lost.</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-purple" id="back-confirm-cancel">Stay</button>' +
          '<button class="btn btn-orange" id="back-confirm-ok">Leave</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildRestartConfirmModal() {
  if (!rollingState.showRestartConfirm) return '';
  return '<div class="modal-overlay" id="restart-confirm-overlay">' +
    '<div class="modal" style="max-width:300px;text-align:center;">' +
      '<div class="modal-body">' +
        '<h2 class="modal-title">Restart?</h2>' +
        '<p style="color:var(--text-w70);font-size:14px;margin:12px 0 20px;">There are mystery dice. Restarting will reset everything, so you will never know its current value. Continue?</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-purple" id="restart-cancel-btn">Cancel</button>' +
          '<button class="btn btn-orange" id="restart-confirm-btn">Confirm</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildRollingInfoModal() {
  if (!rollingState.showInfo) return '';
  var sections = [
    {
      title: 'Gestures',
      body: '<ul class="info-ul">' +
            '<li><b>Swipe left/right</b> to <span class="info-btn info-btn-green">Roll</span> the dice.</li>' +
            '<li>Tap a die to <b>lock / unlock</b> it. A lock icon marks them 🔒. Locked dice are skipped when rolling.</li>' +
            '<li><b>Long-press</b> (or right-click) a die to toggle its individual mystery ❓ so its value is hidden until you reveal it.</li>' +
            '</ul>'
    },
    {
      title: 'Buttons',
      body: '<ul class="info-ul">' +
            '<li><span class="info-btn info-btn-purple">Mystery</span> — hides all dice at once (except locked ones). Tap <span class="info-btn info-btn-purple">Reveal</span> to reveal.</li>' +
            '<li><span class="info-btn info-btn-green">Roll</span> — rolls all unlocked dice.</li>' +
            '<li><span class="info-btn info-btn-orange">Restart</span> — starts the next round: all dice are unlocked and rolled.</li>' +
            '</ul>'
    },
    {
      title: 'Game Settings',
      body: '<ul class="info-ul">' +
            '<li>⏳ <b>Block re-roll</b> — disables rolling for N seconds after each roll (anti-cheat).</li>' +
            '<li>❓ <b>Auto Mystery</b> — automatically hides unlocked dice after N rolls.</li>' +
            '<li>🚫 <b>Limit rolls</b> — Maximum number of rolls per round. Roll is disabled once reached.</li>' +
            '<li>✅ <b>Confirm restart in case of unrevealed dice</b> — asks for confirmation before restarting when mystery dice are active.</li>' +
            '<li>🔓 <b>Allow unlocking after re-roll</b> — when off, a die cannot be unlocked once it has been rolled while locked.</li>' +
            '<li>🔒 <b>Require locking a dice before re-roll</b> — when on, at least one die must be locked before rolling again.</li>' +
            '</ul>'
    },
    {
      title: 'Roll History',
      body: '<ul class="info-ul">' +
            '<li>Tap the <b>history icon</b> to view a table of all rolls across all rounds.</li>' +
            '<li>Each row shows the round, roll number, and the exact state of every die — including locks and mystery.</li>' +
            '<li>History is preserved across restarts and accumulates for the full session.</li>' +
            '<li>Use the <b>export button</b> in the history modal to download the history as JSON.</li>' +
            '</ul>'
    }
  ];
  return '<div class="modal-overlay" id="rolling-info-overlay">' +
    '<div class="modal" style="max-width:600px">' +
      '<div class="modal-header-row">' +
        '<h2 class="modal-title">How to play</h2>' +
        '<button class="icon-btn" id="close-rolling-info-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="info-sections">' +
          sections.map(function(sec) {
            return '<div class="info-section">' +
              (sec.title ? '<div class="info-section-title">' + sec.title + '</div>' : '') +
              sec.body +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildRollingSettingsDialog() {
  if (!rollingState.showSettings) return '';
  var s = rollingState;
  return '<div class="modal-overlay" id="rolling-settings-overlay">' +
    '<div class="modal">' +
      '<div class="modal-body">' +
      '<h2 class="modal-title">Settings</h2>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
        '<h3 class="settings-section-title" style="margin:0;">View settings</h3>' +
        '<button class="btn btn-danger btn-sm" id="reset-view-settings-btn">Reset</button>' +
      '</div>' +

      '<div class="setting-group">' +
        '<label class="setting-label" id="size-label">Dice Size: ' + s.diceSize.toFixed(1) + 'x</label>' +
        (function() {
          var cfg0 = s.diceConfigs[0];
          var val0 = s.diceValues[0] || 0;
          var side0 = cfg0 && cfg0.sideData && cfg0.sideData[val0];
          var shape0 = (side0 && side0.shape) || 'DEFAULT';
          var bg0 = (side0 && side0.color) ? side0.color : '#ffffff';
          var fg0 = contrastColor(bg0);
          var facePx = Math.round(150 * s.diceSize);
          var px = Math.round((facePx - 16) * 0.72);
          var clip0 = getShapeClip(shape0);
          var shapeStyle0 = 'width:' + px + 'px;height:' + px + 'px;display:flex;align-items:center;justify-content:center;background:' + bg0 + ';' +
            (clip0 ? 'clip-path:' + clip0 + ';border-radius:0;' : 'border-radius:12%;');
          return '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div class="size-controls">' +
              '<button class="counter-btn" id="size-minus">−</button>' +
              '<span class="counter-value" id="size-display">' + s.diceSize.toFixed(1) + 'x</span>' +
              '<button class="counter-btn" id="size-plus">+</button>' +
            '</div>' +
            '<div id="size-preview" style="' + shapeStyle0 + 'font-size:' + Math.round(px * 0.4) + 'px;color:' + fg0 + ';overflow:hidden;flex-shrink:0;">' +
              buildDiceFace(cfg0, val0, false, fg0) +
            '</div>' +
          '</div>';
        })() +
        '<p class="setting-hint">Adjust the size (0.5x – 3.0x)</p>' +
      '</div>' +

      '<div class="setting-group">' +
        '<label class="setting-label">Dice (Re-)Order</label>' +
        '<div class="order-mode-btns">' +
          ['off', 'color', 'value', 'manual'].map(function(mode) {
            var labels = { off: 'Off', manual: 'Manual', color: 'By color', value: 'By value' };
            return '<button class="order-mode-btn' + (s.diceOrderMode === mode ? ' active' : '') + '" data-order-mode="' + mode + '">' + labels[mode] + '</button>';
          }).join('') +
        '</div>' +
        (s.diceOrderMode === 'manual'
          ? '<div class="order-list">' +
              s.diceOrder.map(function(origIdx, dispIdx) {
                var cfg = s.diceConfigs[origIdx];
                var val = s.diceValues[origIdx];
                var side = cfg.sideData && cfg.sideData[val];
                var shape = (side && side.shape) || 'DEFAULT';
                var bgColor = (side && side.color) || '#FFFFFF';
                var fgColor = contrastColor(bgColor);
                var clip = getShapeClip(shape);
                var shapeStyle = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:' + bgColor + ';' +
                  (clip ? 'clip-path:' + clip + ';border-radius:0;' : 'border-radius:12%;');
                var preview = '<div style="' + shapeStyle + '">' + buildDiceFace(cfg, val, false, fgColor) + '</div>';
                return '<div class="order-item">' +
                  preview +
                  '<span>Dice ' + (origIdx + 1) + '</span>' +
                  '<div class="order-btns">' +
                    '<button class="icon-btn small ' + (dispIdx === 0 ? 'disabled' : '') + '" data-order-up="' + dispIdx + '"' + (dispIdx === 0 ? ' disabled' : '') + '>▲</button>' +
                    '<button class="icon-btn small ' + (dispIdx === s.diceOrder.length - 1 ? 'disabled' : '') + '" data-order-down="' + dispIdx + '"' + (dispIdx === s.diceOrder.length - 1 ? ' disabled' : '') + '>▼</button>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>'
          : '') +
      '</div>' +

      '<div class="setting-group">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<label class="setting-label" style="margin:0;">Swipe to Roll</label>' +
          '<label class="toggle-switch">' +
            '<input type="checkbox" id="swipe-to-roll-toggle"' + (s.swipeToRoll ? ' checked' : '') + '>' +
            '<span class="toggle-slider"></span>' +
          '</label>' +
        '</div>' +
        '<p class="setting-hint">Swipe left or right to roll the dice</p>' +
      '</div>' +

      '<h3 class="settings-section-title">Game settings</h3>' +

      buildGameSettingsHtml(s, 'r-') +

      '<div class="modal-actions">' +
        '<button class="btn btn-purple" id="close-rolling-settings">Close</button>' +
      '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function attachSwipeToRoll() {
  var screen = document.querySelector('.rolling-screen');
  if (!screen) return;

  var startX = 0, startY = 0;

  screen.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  screen.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    if (!rollingState.swipeToRoll) return;
    if (absDx > 60 && absDx > absDy) {
      var btn = document.getElementById('roll-btn');
      if (btn && !btn.disabled) rollDice();
    }
  }, { passive: true });
}

function attachRollingEvents() {
  function el(id) { return document.getElementById(id); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  el('back-btn') && el('back-btn').addEventListener('click', function() {
    // Always show confirm — history always has the initial entry
    rollingState.showBackConfirm = true;
    renderRollingScreen();
  });
  el('back-confirm-ok') && el('back-confirm-ok').addEventListener('click', function() {
    rollingState.showBackConfirm = false;
    doLeaveRolling();
  });
  el('back-confirm-cancel') && el('back-confirm-cancel').addEventListener('click', function() {
    rollingState.showBackConfirm = false;
    renderRollingScreen();
  });
  el('back-confirm-overlay') && el('back-confirm-overlay').addEventListener('click', function(e) {
    if (e.target === el('back-confirm-overlay')) { rollingState.showBackConfirm = false; renderRollingScreen(); }
  });

  el('rolling-history-btn') && el('rolling-history-btn').addEventListener('click', function() {
    rollingState.showHistory = true;
    renderRollingScreen();
  });
  el('export-history-btn') && el('export-history-btn').addEventListener('click', function() {
    var s = rollingState;
    var data = {
      configuration: s.description,
      diceSize: s.diceSize,
      rolls: s.rollHistory.map(function(entry) {
        return {
          round: entry.round,
          roll: entry.roll,
          dice: entry.diceValues.map(function(val, i) {
            var cfg = s.diceConfigs[i];
            var side = cfg.sideData && cfg.sideData[val];
            return {
              index: i + 1,
              value: side ? side.value : null,
              type: side ? side.type : null,
              locked: entry.lockedDice[i],
              mystery: entry.isHidden || entry.individualMysteryDice[i],
            };
          }),
        };
      }),
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (s.description || 'game') + '-history.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  el('close-rolling-history-btn') && el('close-rolling-history-btn').addEventListener('click', function() {
    rollingState.showHistory = false;
    renderRollingScreen();
  });
  el('rolling-history-overlay') && el('rolling-history-overlay').addEventListener('click', function(e) {
    if (e.target === el('rolling-history-overlay')) { rollingState.showHistory = false; renderRollingScreen(); }
  });

  // Shared leave function used by back-btn and popstate
  function doLeaveRolling() { leaveRollingScreen(); }
  el('mystery-btn') && el('mystery-btn').addEventListener('click', function() {
    var s = rollingState;
    // Check if any unlocked die is currently visible (not in mystery)
    var anyUnlockedVisible = s.diceConfigs.some(function(_, i) {
      return !s.lockedDice[i] && !s.individualMysteryDice[i];
    });
    // Toggle mystery only on unlocked dice
    s.individualMysteryDice = s.individualMysteryDice.map(function(v, i) {
      return s.lockedDice[i] ? v : anyUnlockedVisible;
    });
    s.isHidden = false;
    // Revealing (turning mystery off) satisfies an enforce-reveal block.
    if (!anyUnlockedVisible) s.revealRequired = false;
    renderRollingScreen();
  });
  el('reset-btn') && el('reset-btn').addEventListener('click', function() {
    var hasMystery = rollingState.individualMysteryDice.some(function(v) { return v; }) || rollingState.isHidden;
    if (hasMystery && rollingState.confirmRestartWhenMystery !== false) {
      rollingState.showRestartConfirm = true;
      renderRollingScreen();
    } else {
      doRestart();
    }
  });
  el('restart-confirm-btn') && el('restart-confirm-btn').addEventListener('click', function() {
    rollingState.showRestartConfirm = false;
    renderRollingScreen();
    doRestart();
  });
  el('restart-cancel-btn') && el('restart-cancel-btn').addEventListener('click', function() {
    rollingState.showRestartConfirm = false;
    renderRollingScreen();
  });
  el('restart-confirm-overlay') && el('restart-confirm-overlay').addEventListener('click', function(e) {
    if (e.target === el('restart-confirm-overlay')) { rollingState.showRestartConfirm = false; renderRollingScreen(); }
  });
  el('roll-btn') && el('roll-btn').addEventListener('click', function() {
    rollDice();
  });
  el('fullscreen-btn') && el('fullscreen-btn').addEventListener('click', function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
    // Re-render after short delay to update icon
    setTimeout(renderRollingScreen, 100);
  });

  el('rolling-info-btn') && el('rolling-info-btn').addEventListener('click', function() {
    rollingState.showInfo = true;
    renderRollingScreen();
  });
  el('close-rolling-info-btn') && el('close-rolling-info-btn').addEventListener('click', function() {
    rollingState.showInfo = false;
    renderRollingScreen();
  });
  el('rolling-info-overlay') && el('rolling-info-overlay').addEventListener('click', function(e) {
    if (e.target === el('rolling-info-overlay')) { rollingState.showInfo = false; renderRollingScreen(); }
  });
  el('rolling-settings-btn') && el('rolling-settings-btn').addEventListener('click', function() {
    rollingState.showSettings = true;
    renderRollingScreen();
  });
  el('close-rolling-settings') && el('close-rolling-settings').addEventListener('click', function() {
    rollingState.showSettings = false;
    renderRollingScreen();
  });
  el('rolling-settings-overlay') && el('rolling-settings-overlay').addEventListener('click', function(e) {
    if (e.target === el('rolling-settings-overlay')) {
      rollingState.showSettings = false;
      renderRollingScreen();
    }
  });

  el('reset-view-settings-btn') && el('reset-view-settings-btn').addEventListener('click', function() {
    localStorage.removeItem(VIEW_SETTINGS_KEY);
    rollingState.diceSize = 1.0;
    rollingState.diceOrderMode = 'off';
    rollingState.swipeToRoll = (navigator.maxTouchPoints > 0);
    rollingState.diceOrder = rollingState.diceConfigs.map(function(_, i) { return i; });
    renderRollingScreen();
  });

  el('swipe-to-roll-toggle') && el('swipe-to-roll-toggle').addEventListener('change', function() {
    rollingState.swipeToRoll = this.checked;
    saveViewSettings();
  });

  el('size-minus') && el('size-minus').addEventListener('click', function() {
    var s = Math.round((rollingState.diceSize - 0.1) * 10) / 10;
    rollingState.diceSize = Math.max(0.5, s);
    saveViewSettings();
    renderRollingScreen();
  });
  el('size-plus') && el('size-plus').addEventListener('click', function() {
    var s = Math.round((rollingState.diceSize + 0.1) * 10) / 10;
    rollingState.diceSize = Math.min(3.0, s);
    saveViewSettings();
    renderRollingScreen();
  });

  attachGameSettingsEvents(rollingState, 'r-', renderRollingScreen);

  qsa('[data-order-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      rollingState.diceOrderMode = btn.dataset.orderMode;
      if (btn.dataset.orderMode === 'manual' || btn.dataset.orderMode === 'off') {
        rollingState.diceOrder = rollingState.diceConfigs.map(function(_, i) { return i; });
      }
      saveViewSettings();
      renderRollingScreen();
    });
  });
  qsa('[data-order-up]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var di = parseInt(btn.dataset.orderUp);
      if (di <= 0) return;
      var order = rollingState.diceOrder.slice();
      var tmp = order[di - 1]; order[di - 1] = order[di]; order[di] = tmp;
      rollingState.diceOrder = order;
      renderRollingScreen();
    });
  });
  qsa('[data-order-down]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var di = parseInt(btn.dataset.orderDown);
      if (di >= rollingState.diceOrder.length - 1) return;
      var order = rollingState.diceOrder.slice();
      var tmp = order[di]; order[di] = order[di + 1]; order[di + 1] = tmp;
      rollingState.diceOrder = order;
      renderRollingScreen();
    });
  });

  attachDiceEvents();
  attachSwipeToRoll();
}

function updateDiceGridOnly() {
  var grid = document.getElementById('dice-grid');
  if (grid) {
    grid.innerHTML = buildDiceGrid();
    attachDiceEvents();
  }
}

function doRestart() {
  clearInterval(_blockTimer);
  // New round: unlock all dice and clear permanent-lock tracking
  rollingState.permanentlyLocked = rollingState.diceConfigs.map(function() { return false; });
  rollingState.lockedBeforeLastRoll = rollingState.lockedDice.slice();
  rollingState.lockedDice = rollingState.diceConfigs.map(function() { return false; });
  rollingState.isHidden = false;
  rollingState.individualMysteryDice = rollingState.diceConfigs.map(function() { return false; });
  rollingState.revealRequired = false;
  rollingState.rollCount = 0;
  rollingState.roundNumber += 1;
  rollingState.remainingBlockSeconds = 0;
  var mysteryBtn = document.getElementById('mystery-btn');
  if (mysteryBtn) mysteryBtn.innerHTML = buildMysteryBtnInner(false);
  updateDiceGridOnly();
  rollDice();
}

function rollDice() {
  if (rollingState.remainingBlockSeconds > 0) return;

  var newValues = rollingState.diceValues.map(function(v, i) {
    return rollingState.lockedDice[i] ? v : rollDie(rollingState.diceConfigs[i]);
  });
  // Track which dice were locked during this roll (cannot be unlocked if allowUnlockAfterRoll is off)
  if (rollingState.allowUnlockAfterRoll === false) {
    rollingState.lockedDice.forEach(function(locked, i) {
      if (locked) rollingState.permanentlyLocked[i] = true;
    });
  }
  var newCount = rollingState.rollCount + 1;
  var mysteryList = normalizeRollsList(rollingState.autoMysteryAfterRolls);
  var enforceList = normalizeRollsList(rollingState.enforceRevealAfterRolls);
  var shouldMystery = mysteryList.indexOf(newCount) !== -1;
  var shouldEnforceReveal = enforceList.indexOf(newCount) !== -1;

  // Animate + flash random sides
  var unlockedEls = document.querySelectorAll('.dice-face:not(.locked)');
  unlockedEls.forEach(function(el) { el.classList.add('rolling'); });

  var flashInterval = setInterval(function() {
    unlockedEls.forEach(function(el) {
      var index = parseInt(el.dataset.index);
      var cfg = rollingState.diceConfigs[index];
      if (!cfg || !cfg.sideData) return;
      var randomSide = Math.floor(Math.random() * cfg.sideData.length);
      var side = cfg.sideData[randomSide];
      var bgColor = (side && side.color) || '#FFFFFF';
      var fgColor = contrastColor(bgColor);
      var wrap = el.querySelector('.dice-shape-wrap');
      var clip = getShapeClip((side && side.shape) || 'DEFAULT');
      if (wrap) {
        wrap.style.background = bgColor;
        wrap.style.clipPath = clip || '';
        wrap.style.borderRadius = clip ? '0' : '12%';
        wrap.innerHTML = buildDiceFace(cfg, randomSide, false, fgColor);
      }
    });
  }, 50);

  rollingState.lockedBeforeLastRoll = rollingState.lockedDice.slice();
  rollingState.diceValues = newValues;
  rollingState.rollCount = newCount;
  if (shouldMystery) {
    rollingState.individualMysteryDice = rollingState.individualMysteryDice.map(function(v, i) {
      return rollingState.lockedDice[i] ? v : true;
    });
    rollingState.isHidden = false;
  }
  if (shouldEnforceReveal) rollingState.revealRequired = true;

  if (rollingState.blockReThrowSeconds > 0) {
    rollingState.remainingBlockSeconds = rollingState.blockReThrowSeconds;
    startBlockTimer();
  }

  var tc = document.querySelector('.roll-count');
  if (tc) tc.textContent = 'Roll: ' + rollingState.rollCount + (rollingState.maxRolls > 0 ? '/' + rollingState.maxRolls : '');
  var rc = document.querySelector('.round-count');
  if (rc) rc.textContent = 'Round: ' + rollingState.roundNumber;

  setTimeout(function() {
    clearInterval(flashInterval);
    document.querySelectorAll('.dice-face').forEach(function(el) {
      el.classList.remove('rolling');
    });
    updateDiceGridOnly();
    var s = rollingState;
    // Record snapshot after animation — this is exactly what the user sees
    s.rollHistory.push({
      round: s.roundNumber,
      roll: s.rollCount,
      diceValues: s.diceValues.slice(),
      lockedDice: s.lockedDice.slice(),
      individualMysteryDice: s.individualMysteryDice.slice(),
      isHidden: s.isHidden,
    });
    var maxed = s.maxRolls > 0 && s.rollCount >= s.maxRolls;
    var blocked = s.remainingBlockSeconds > 0;
    var rollBtn = document.getElementById('roll-btn');
    if (rollBtn) {
      var allLocked2 = s.lockedDice.length > 0 && s.lockedDice.every(function(v) { return v; });
      var needsLock2 = s.requireLockBeforeRoll && !s.lockedDice.some(function(v,i){return v && !s.lockedBeforeLastRoll[i];});
      var needsReveal2 = !!s.revealRequired;
      var isDisabled = maxed || blocked || allLocked2 || needsLock2 || needsReveal2;
      rollBtn.disabled = isDisabled;
      rollBtn.classList.toggle('disabled', isDisabled);
      var outerSpan = rollBtn.querySelector('span');
      var innerSpan = outerSpan && outerSpan.querySelector('span');
      if (innerSpan) {
        innerSpan.textContent = maxed ? 'Max reached' : blocked ? 'Wait ' + s.remainingBlockSeconds + 's' : allLocked2 ? 'All locked' : needsLock2 ? 'Lock a die first' : needsReveal2 ? 'Reveal first' : 'Roll';
      }
    }
    var tc = document.querySelector('.roll-count');
    if (tc) tc.textContent = 'Roll: ' + s.rollCount + (s.maxRolls > 0 ? '/' + s.maxRolls : '');
    if (shouldMystery) {
      var btn = document.getElementById('mystery-btn');
      if (btn) btn.innerHTML = buildMysteryBtnInner(true);
    }
  }, 500);
}

function startBlockTimer() {
  clearInterval(_blockTimer);
  _blockTimer = setInterval(function() {
    var r = rollingState.remainingBlockSeconds - 1;
    if (r <= 0) {
      clearInterval(_blockTimer);
      rollingState.remainingBlockSeconds = 0;
      var btn = document.getElementById('roll-btn');
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('disabled');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
          '</svg>Roll';
      }
    } else {
      rollingState.remainingBlockSeconds = r;
      var btn = document.getElementById('roll-btn');
      if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
        '</svg>Wait ' + r + 's';
    }
  }, 1000);
}

function attachDiceEvents() {
  document.querySelectorAll('.dice-face[data-index]').forEach(function(el) {
    var index = parseInt(el.dataset.index);

    el.addEventListener('click', function() {
      // Don't unlock if die is permanently locked this round
      if (rollingState.permanentlyLocked[index] && rollingState.lockedDice[index]) {
        showToast('Setting forbids to unlock a die that has been locked', true);
        return;
      }
      rollingState.lockedDice[index] = !rollingState.lockedDice[index];
      // Track that a die was newly locked this round (for requireLockBeforeRoll)
      
      updateDiceGridOnly();
      // Update roll button disabled state
      var rollBtn = document.getElementById('roll-btn');
      if (rollBtn) {
        var allLocked = rollingState.lockedDice.every(function(v) { return v; });
        var needsLk = rollingState.requireLockBeforeRoll && !rollingState.lockedDice.some(function(v,i){return v && !rollingState.lockedBeforeLastRoll[i];});
        var needsRv = !!rollingState.revealRequired;
        var isDisabled = allLocked || needsLk || needsRv || rollingState.remainingBlockSeconds > 0 || (rollingState.maxRolls > 0 && rollingState.rollCount >= rollingState.maxRolls);
        rollBtn.disabled = isDisabled;
        rollBtn.classList.toggle('disabled', isDisabled);
        var outerSpan = rollBtn.querySelector('span');
        var innerSpan = outerSpan && outerSpan.querySelector('span');
        if (innerSpan && !rollingState.remainingBlockSeconds && !(rollingState.maxRolls > 0 && rollingState.rollCount >= rollingState.maxRolls)) {
          innerSpan.textContent = allLocked ? 'All locked' : needsLk ? 'Lock a die first' : needsRv ? 'Reveal first' : 'Roll';
        }
      }
    });

    el.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      rollingState.individualMysteryDice[index] = !rollingState.individualMysteryDice[index];
      updateDiceGridOnly();
    });
  });
}

// ============================================================
// DEFAULT CONFIGURATIONS (seeded once, like the Android app)
// ============================================================
function cn(number, color) { return { number: number, color: color }; }

function ps(n, color) { return { type: 'PIPPED', value: n, color: color || '#FFFFFF' }; }
function ns(n) { return { type: 'NUMBER', value: n, color: '#FFFFFF', shape: 'TRIANGLE' }; }
function pip6(color) { return [ps(1,color),ps(2,color),ps(3,color),ps(4,color),ps(5,color),ps(6,color)]; }
function wild(color) { return { type: 'TEXT', value: '?', color: color }; }
function pip5q(color) { return [ps(1,color),ps(2,color),ps(3,color),ps(4,color),ps(5,color),wild(color)]; }
function cross45(color) { return { type: 'TEXT', value: '', color: color, shape: 'CROSS_45' }; }

var DEFAULT_CONFIGS = [
  {
    description: 'Chicago / Schock',
    numberOfDice: 3,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: [1, 3],
    enforceRevealAfterRolls: [1],
    maxRolls: 3,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: 'Mia (Mäxchen)',
    numberOfDice: 2,
    blockReThrowSeconds: 3,
    autoMysteryAfterRolls: 1,
    maxRolls: 0,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: 'Quantum',
    numberOfDice: 7,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 1,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: [ps(1,'#E53935'),ps(1,'#1E88E5'),ps(4,'#E53935'),ps(5,'#1E88E5'),ps(6,'#8E24AA'),ps(5,'#FDD835')] },
      { sides: 6, sideData: [ps(2,'#8E24AA'),ps(5,'#8E24AA'),ps(4,'#FDD835'),ps(2,'#1E88E5'),ps(6,'#1E88E5'),ps(3,'#E53935')] },
      { sides: 6, sideData: [ps(1,'#FDD835'),ps(3,'#FDD835'),ps(5,'#1E88E5'),ps(2,'#E53935'),ps(6,'#E53935'),ps(4,'#8E24AA')] },
      { sides: 6, sideData: [ps(4,'#1E88E5'),ps(2,'#FDD835'),ps(4,'#FDD835'),ps(1,'#E53935'),ps(3,'#E53935'),ps(3,'#8E24AA')] },
      { sides: 6, sideData: [ps(2,'#1E88E5'),ps(4,'#1E88E5'),ps(6,'#FDD835'),ps(5,'#E53935'),ps(1,'#8E24AA'),ps(3,'#8E24AA')] },
      { sides: 6, sideData: [ps(2,'#8E24AA'),ps(6,'#8E24AA'),ps(5,'#FDD835'),ps(1,'#FDD835'),ps(3,'#1E88E5'),ps(6,'#E53935')] }
    ]
  },
  {
    description: 'Qwixx',
    numberOfDice: 6,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 1,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6('#43A047') },
      { sides: 6, sideData: pip6('#E53935') },
      { sides: 6, sideData: pip6('#1E88E5') },
      { sides: 6, sideData: pip6('#FDD835') }
    ]
  },
  {
    description: 'Qwinto',
    numberOfDice: 3,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 2,
    confirmRestartWhenMystery: false,
    diceConfigs: [
      { sides: 6, sideData: pip6('#E53935') },
      { sides: 6, sideData: pip6('#FDD835') },
      { sides: 6, sideData: pip6('#1E88E5') }
    ]
  },
  {
    description: 'Nochmal',
    numberOfDice: 6,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 1,
    diceConfigs: (function() {
      var colorCross = [cross45('#FDD835'), cross45('#1E88E5'), cross45('#43A047'), cross45('#FF6F00'), cross45('#E53935'), cross45('#000000')];
      var blackPipQ = pip5q('#000000');
      return [
        { sides: 6, sideData: colorCross },
        { sides: 6, sideData: colorCross },
        { sides: 6, sideData: colorCross },
        { sides: 6, sideData: blackPipQ },
        { sides: 6, sideData: blackPipQ },
        { sides: 6, sideData: blackPipQ }
      ];
    })()
  },
  {
    description: 'Kribbeln',
    numberOfDice: 6,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    diceConfigs: (function() {
      var B='#1E88E5', O='#FF6F00', Y='#FDD835', P='#E91E63', G='#808080', N='#43A047';
      return [
        { sides: 6, sideData: [ps(1,B),ps(2,O),ps(3,Y),ps(4,P),ps(5,G),ps(6,N)] },
        { sides: 6, sideData: [ps(1,G),ps(2,N),ps(3,B),ps(4,O),ps(5,Y),ps(6,P)] },
        { sides: 6, sideData: [ps(1,Y),ps(2,P),ps(3,G),ps(4,N),ps(5,B),ps(6,O)] },
        { sides: 6, sideData: [ps(1,O),ps(2,Y),ps(3,P),ps(4,G),ps(5,N),ps(6,B)] },
        { sides: 6, sideData: [ps(1,N),ps(2,B),ps(3,O),ps(4,Y),ps(5,P),ps(6,G)] },
        { sides: 6, sideData: [ps(1,P),ps(2,G),ps(3,N),ps(4,B),ps(5,O),ps(6,Y)] }
      ];
    })()
  },
  {
    description: 'Kniffel',
    numberOfDice: 5,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 3,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: 'DnD',
    numberOfDice: 1,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    diceConfigs: [
      { sides: 20, sideData: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(ns) }
    ]
  },
  {
    description: 'Zehntausend',
    numberOfDice: 5,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    requireLockBeforeRoll: true,
    allowUnlockAfterRoll: false,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: '1 common die',
    numberOfDice: 1,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    diceConfigs: [
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: '5 common dice',
    numberOfDice: 5,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  },
  {
    description: '6 common dice',
    numberOfDice: 6,
    blockReThrowSeconds: 0,
    autoMysteryAfterRolls: 0,
    maxRolls: 0,
    diceConfigs: [
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() },
      { sides: 6, sideData: pip6() }
    ]
  }
];

function seedDefaultConfigurations() {
  var existing = loadConfigurations();
  DEFAULT_CONFIGS.forEach(function(def) {
    var idx = -1;
    existing.forEach(function(c, i) { if (c.description === def.description) idx = i; });
    if (idx >= 0) existing[idx] = def;
    else existing.unshift(def);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// === Back navigation ===
window.addEventListener('popstate', function(e) {
  var state = e.state || {};
  if (state.screen === 'rolling') {
    // Popped back to rolling — close any open modals
    if (rollingState) {
      rollingState.showSettings = false;
      rollingState.showInfo = false;
      rollingState.showHistory = false;
      rollingState.showRestartConfirm = false;
      rollingState.showBackConfirm = false;
      renderRollingScreen();
    }
    return;
  }
  // state.screen === 'config' or unknown
  if (rollingState) {
    // Close rolling modals before leaving, if any were open
    if (rollingState.showSettings || rollingState.showInfo || rollingState.showRestartConfirm || rollingState.showHistory || rollingState.showBackConfirm) {
      rollingState.showSettings = false;
      rollingState.showInfo = false;
      rollingState.showHistory = false;
      rollingState.showRestartConfirm = false;
      rollingState.showBackConfirm = false;
      history.pushState({ screen: 'rolling' }, '');
      renderRollingScreen();
      return;
    }
    // Navigate back to config — always show confirm (history always has the initial entry)
    rollingState.showBackConfirm = true;
    history.pushState({ screen: 'rolling' }, '');
    renderRollingScreen();
    return;
  }
  if (configState &&
      (configState.showConfigurations ||
       configState.dicePreviewModal !== null || configState.colorPickerModal ||
       configState.typePickerModal || configState.shapePickerModal)) {
    configState.showConfigurations = false;
    configState.dicePreviewModal = null;
    configState.colorPickerModal = null;
    configState.typePickerModal = null;
    configState.shapePickerModal = null;
    history.replaceState({ screen: 'config' }, '');
    renderConfigScreen();
    return;
  }
  if (configState) {
    renderConfigScreen();
    return;
  }
  initConfigScreen();
});

// === Boot ===
// Inject SVG clipPath definitions for flower shapes.
// clipPathUnits="objectBoundingBox" makes coordinates relative to the element (0-1 = 0%-100%).
(function() {
  var r4 = 0.2, d4 = 0.28;
  var f4centers = [
    [0.5, 0.5 - d4], [0.5 + d4, 0.5], [0.5, 0.5 + d4], [0.5 - d4, 0.5]
  ];
  var r5 = 0.18, d5 = 0.3;
  var f5centers = [-90, -18, 54, 126, 198].map(function(a) {
    return [+(0.5 + d5 * Math.cos(a * Math.PI / 180)).toFixed(4),
            +(0.5 + d5 * Math.sin(a * Math.PI / 180)).toFixed(4)];
  });
  function circles(centers, r) {
    return centers.map(function(c) {
      return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + r + '"/>';
    }).join('');
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0">' +
    '<defs>' +
      '<clipPath id="clip-flower4" clipPathUnits="objectBoundingBox"><circle cx="0.5" cy="0.5" r="' + r4 + '"/>' + circles(f4centers, r4) + '</clipPath>' +
      '<clipPath id="clip-flower5" clipPathUnits="objectBoundingBox"><circle cx="0.5" cy="0.5" r="' + r5 + '"/>' + circles(f5centers, r5) + '</clipPath>' +
    '</defs>' +
  '</svg>';
  document.body.insertAdjacentHTML('afterbegin', svg);
})();

seedDefaultConfigurations();
(function() {
  var draft = loadDraft();
  if (draft && Array.isArray(draft.diceConfigs) && draft.diceConfigs.length) {
    initConfigScreen(draft, true);
    return;
  }
  var lastName = localStorage.getItem(LAST_CONFIG_KEY);
  if (lastName) {
    var configs = loadConfigurations();
    var cfg = configs.find(function(c) { return c.description === lastName; });
    if (cfg) {
      initConfigScreen({
        description: cfg.description,
        numberOfDice: cfg.numberOfDice,
        diceConfigs: cfg.diceConfigs,
        blockReThrowSeconds: cfg.blockReThrowSeconds || 0,
        autoMysteryAfterRolls: normalizeRollsList(cfg.autoMysteryAfterRolls),
        enforceRevealAfterRolls: normalizeRollsList(cfg.enforceRevealAfterRolls),
        maxRolls: cfg.maxRolls || 0,
      }, true);
      return;
    }
  }
  initConfigScreen();
})();
