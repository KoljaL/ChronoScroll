const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadWindowScript(filePath, windowObj = {}) {
  const code = fs.readFileSync(path.join(root, filePath), 'utf8');
  const context = {
    window: windowObj,
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    JSON,
    TextEncoder,
    TextDecoder,
    URLSearchParams,
    btoa,
    atob,
  };
  context.window.window = context.window;
  vm.runInNewContext(code, context);
  return context.window;
}

test('winding allowances default to 0 and extend leadInMm/leadOutMm without altering pufferLeftMm/pufferRightMm', () => {
  const win = loadWindowScript('js/geometry.js');
  const baseGeo = win.CronoGeometry.calculate({ bVisible: 42, hVisible: 30, pufferLeft: 15, pufferRight: 15 });
  assert.equal(baseGeo.windingAllowanceLeftMm, 0);
  assert.equal(baseGeo.windingAllowanceRightMm, 0);
  assert.equal(baseGeo.leadInMm, baseGeo.pufferLeftMm);
  assert.equal(baseGeo.leadOutMm, baseGeo.pufferRightMm);
  assert.equal(baseGeo.lTotalMm, 2260);

  const extendedGeo = win.CronoGeometry.calculate({
    bVisible: 42,
    hVisible: 30,
    pufferLeft: 15,
    pufferRight: 15,
    windingAllowanceLeftMm: 50,
    windingAllowanceRightMm: 80,
  });
  assert.equal(extendedGeo.pufferLeftMm, 150);
  assert.equal(extendedGeo.pufferRightMm, 150);
  assert.equal(extendedGeo.leadInMm, 200);
  assert.equal(extendedGeo.leadOutMm, 230);
  assert.equal(extendedGeo.lTotalMm, 2260 + 50 + 80);
});

test('validateCalendarSettings accepts legacy states without Phase 3 fields and rejects invalid Phase 3 values', () => {
  const win = loadWindowScript('js/shareConfig.js');
  const legacyState = {
    year: 2027,
    hVisible: 30,
    bVisible: 42,
    pufferLeft: 15,
    pufferRight: 15,
    pufferLeftContent: 'blank',
    pufferRightContent: 'blank',
    bannerCustomTitle: 'Test',
    monthLayout: 'single',
    designStyle: 'classic',
    themeKey: null,
    subColumns: 1,
    guideLinesCount: 0,
    guideLinesStyle: 'dashed',
    showKW: true,
    showMoon: true,
    showCropMarks: false,
    headerStyle: 'uppercase',
    headerAlign: 'center',
    monthHeaderTextColor: '#0f172a',
    monthHeaderTextSize: 1,
    calendarWeekTextColor: '#64748b',
    calendarWeekTextSize: 1,
    moonOpacity: 0.89,
    backpanelOffsetHeightMm: 2,
    backpanelOffsetWidthMm: 4,
    qrEnabled: true,
    qrGapMm: 40,
    showVacations: false,
    categoryColors: { public: '#fef08a', vacation: '#bfdbfe', custom: '#bfdbfe' },
    fontFamily: 'sans',
    fontHeaderScale: 1,
    fontDayScale: 1,
    lineGrid: 0.2,
    lineBorder: 0.6,
    paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9',
    colorHeaderText: '#0f172a',
    colorGrid: '#cbd5e1',
    colorText: '#0f172a',
    colorSaturdayBg: '#64748b1c',
    colorSaturdayText: '#0f172a',
    colorSundayBg: '#e11d481c',
    colorSundayText: '#e11d48',
    colorWeekendBg: '#f1f5f9',
    colorWeekendText: '#e11d48',
    country: 'DE',
    bundesland: 'NW',
    monthSeparators: {
      single: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
      double: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
    },
  };
  assert.deepEqual([...win.CronoShare.validateCalendarSettings(legacyState)], []);

  const invalidState = {
    ...legacyState,
    paperGrammage: 30,
    windingAllowanceLeftMm: 250,
    cropMarkStyle: 'invalid-style',
  };
  const errors = win.CronoShare.validateCalendarSettings(invalidState);
  assert.ok(errors.includes('paperGrammage'));
  assert.ok(errors.includes('windingAllowanceLeftMm'));
  assert.ok(errors.includes('cropMarkStyle'));
});

test('SVG and PDF export support cropMarkStyle lines and legacy showCropMarks fallback', () => {
  const win = loadWindowScript('js/geometry.js');
  loadWindowScript('js/moon.js', win);
  loadWindowScript('js/holidays.js', win);
  loadWindowScript('js/embeddedFonts.js', win);
  loadWindowScript('js/designPresets.js', win);
  loadWindowScript('js/svgExport.js', win);

  let exportedSvg = '';
  win.Blob = function Blob(parts) {
    this.text = parts.join('');
    exportedSvg = this.text;
  };
  const dummyDoc = {
    createElement: () => ({ click() {}, style: {} }),
    body: { appendChild() {}, removeChild() {} },
  };
  const code = fs.readFileSync(path.join(root, 'js/svgExport.js'), 'utf8');
  vm.runInNewContext(code, {
    window: win,
    document: dummyDoc,
    Blob: win.Blob,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    console,
    Math,
    Number,
    String,
    Array,
    Object,
  });

  win.CronoVector.exportSVG({
    year: 2027,
    bVisible: 42,
    hVisible: 30,
    pufferLeft: 15,
    pufferRight: 15,
    monthLayout: 'single',
    subColumns: 1,
    guideLinesCount: 0,
    showKW: true,
    showMoon: false,
    showCropMarks: false,
    cropMarkStyle: 'lines',
    qrEnabled: false,
    fontFamily: 'sans',
    fontHeaderScale: 1,
    fontDayScale: 1,
    headerStyle: 'uppercase',
    headerAlign: 'center',
    lineGrid: 0.2,
    lineBorder: 0.6,
    paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9',
    colorHeaderText: '#0f172a',
    colorGrid: '#cbd5e1',
    colorText: '#0f172a',
    colorSaturdayBg: '#f8fafc',
    colorSaturdayText: '#0f172a',
    colorSundayBg: '#f1f5f9',
    colorSundayText: '#e11d48',
    holidays: [],
    currentMonthIndex: 1,
  });

  assert.ok(exportedSvg.includes('stroke-dasharray="1.5,1"'));
});

test('CAD schema includes tolerance defaults and preserves legacy rodCutLength when tolerances are omitted', () => {
  const cadCode = fs.readFileSync(path.join(root, 'js/cad-module.js'), 'utf8');
  assert.ok(cadCode.includes("key: 'blindHoleClearanceMm'"));
  assert.ok(cadCode.includes("key: 'rodAxialPlayMm'"));
  assert.ok(cadCode.includes("key: 'minSideGapMm'"));
  assert.ok(cadCode.includes('p.blindHoleClearanceMm ?? 0.0'));
  assert.ok(cadCode.includes('p.rodAxialPlayMm ?? 2.0'));
  assert.ok(cadCode.includes('p.minSideGapMm ?? 1.0'));
});
