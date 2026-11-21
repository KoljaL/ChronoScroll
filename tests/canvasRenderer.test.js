const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const geometryContext = { window: {} };
vm.createContext(geometryContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/geometry.js'), 'utf8'), geometryContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/themePresets.js'), 'utf8'), geometryContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/designPresets.js'), 'utf8'), geometryContext);

const months = Array.from({ length: 14 }, (_, monthIndex) => ({
  label: `MONAT ${monthIndex + 1}`,
  monthNumber: monthIndex + 1,
  monthName: `Monat ${monthIndex + 1}`,
  year: 2027,
  days: Array.from({ length: 31 }, (_, dayIndex) => {
    const dayNum = dayIndex + 1;
    const daysInMonth = new Date(2027, monthIndex + 1, 0).getDate();
    if (dayNum > daysInMonth) return { isValid: false };
    return {
      dayNum,
      dayName: 'Mo',
      isoDate: `2027-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
      isValid: true
    };
  })
}));
const context = {
  window: {
    CronoGeometry: geometryContext.window.CronoGeometry,
    CronoShare: { createNextYearUrl: () => 'https://example.com/' },
    qrcode: () => ({ addData() {}, make() {}, getModuleCount: () => 1, isDark: () => true }),
    CronoHolidays: { get14MonthsData: () => months },
    CronoThemes: geometryContext.window.CronoThemes,
    CronoDesigns: geometryContext.window.CronoDesigns,
    CronoFonts: { getCanvasFamily: key => `Embedded-${key}` }
  },
  document: { getElementById: () => null }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/canvasRenderer.js'), 'utf8'), context);

test('date hit-testing follows both day columns in the double-column layout', () => {
  const state = {
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    monthLayout: 'double',
    viewMode: 'plate',
    currentMonthIndex: 0,
    year: 2027,
    zoom: 1
  };
  const canvas = { getBoundingClientRect: () => ({ left: 100, top: 50 }) };
  const geo = geometryContext.window.CronoGeometry.calculate(state);
  const hitTest = context.window.CronoCanvas.getDateAtCanvasPoint;
  const pixelsPerCm = 20;

  const day15 = hitTest(
    100 + 2 * pixelsPerCm,
    50 + 15.5 * geo.hDay * pixelsPerCm,
    canvas,
    state
  );
  const day16 = hitTest(
    100 + 8 * pixelsPerCm,
    50 + 1.5 * geo.hDay * pixelsPerCm,
    canvas,
    state
  );
  const emptySlot = hitTest(
    100 + 3 * pixelsPerCm,
    50 + 16.5 * geo.hDay * pixelsPerCm,
    canvas,
    state
  );

  assert.equal(day15.dayNum, 15);
  assert.equal(day16.dayNum, 16);
  assert.equal(emptySlot, null);
});

test('date hit-testing rejects invalid date slots without day numbers', () => {
  const state = {
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    monthLayout: 'double',
    viewMode: 'plate',
    currentMonthIndex: 1,
    year: 2027,
    zoom: 1
  };
  const canvas = { getBoundingClientRect: () => ({ left: 100, top: 50 }) };
  const geo = geometryContext.window.CronoGeometry.calculate(state);
  const hitTest = context.window.CronoCanvas.getDateAtCanvasPoint;
  const invalidDateSlot = hitTest(
    100 + 8 * 20,
    50 + 14.5 * geo.hDay * 20,
    canvas,
    state
  );

  assert.equal(invalidDateSlot, null);
});

test('canvas preview draws day 16 in the second half of its month', () => {
  const textCommands = [];
  const drawContext = {
    save() {},
    restore() {},
    scale() {},
    fillRect() {},
    strokeRect() {},
    setLineDash() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText(...args) { textCommands.push(args); },
    measureText(text) { return { width: String(text).length * 6 }; }
  };
  const canvas = {
    style: {},
    getContext: () => drawContext
  };
  const state = {
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    monthLayout: 'double',
    subColumns: 1,
    guideLinesCount: 0,
    viewMode: 'plate',
    currentMonthIndex: 0,
    year: 2027,
    holidays: [],
    zoom: 1,
    lineGrid: 0.2,
    lineBorder: 0.6,
    paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9',
    colorHeaderText: '#0f172a',
    colorText: '#0f172a',
    colorGrid: '#cbd5e1',
    fontFamily: 'sans',
    fontHeaderScale: 1,
    fontDayScale: 1,
    headerAlign: 'center',
    headerStyle: 'uppercase',
    showKW: false,
    showMoon: false,
    showCropMarks: false
  };

  context.window.CronoCanvas.render(canvas, { style: {} }, state);

  const day16 = textCommands.find(([text]) => text === '16 Mo');
  assert.ok(day16);
  assert.equal(day16[1], 146);
});

test('preview alignment keeps an oversized plate scrollable and the roll left-aligned', () => {
  const drawContext = {
    save() {}, restore() {}, scale() {}, fillRect() {}, strokeRect() {},
    setLineDash() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    fillText() {}, measureText(text) { return { width: String(text).length * 6 }; }
  };
  const canvas = { style: {}, getContext: () => drawContext };
  const container = { style: {} };
  const state = {
    bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
    monthLayout: 'double', subColumns: 1, guideLinesCount: 0,
    viewMode: 'plate', currentMonthIndex: 0, year: 2027, holidays: [], zoom: 1,
    lineGrid: 0.2, lineBorder: 0.6, paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9', colorHeaderText: '#0f172a',
    colorText: '#0f172a', colorGrid: '#cbd5e1',
    fontFamily: 'sans', fontHeaderScale: 1, fontDayScale: 1,
    headerAlign: 'center', headerStyle: 'uppercase',
    showKW: false, showMoon: false, showCropMarks: false
  };

  context.window.CronoCanvas.render(canvas, container, state);
  assert.equal(container.style.justifyContent, 'flex-start');
  assert.equal(canvas.style.marginInline, 'auto');

  state.viewMode = 'banner';
  context.window.CronoCanvas.render(canvas, container, state);
  assert.equal(container.style.justifyContent, 'flex-start');
  assert.equal(canvas.style.marginInline, '0');

  state.viewMode = 'plate';
  context.window.CronoCanvas.render(canvas, container, state);
  assert.equal(canvas.style.marginInline, 'auto');
});

test('banner crop marks align with the visible window and never mark month or buffer boundaries', () => {
  const strokedPaths = [];
  let currentPath = [];
  let currentPoint = null;
  const drawContext = {
    save() {},
    restore() {},
    scale() {},
    fillRect() {},
    strokeRect() {},
    setLineDash() {},
    beginPath() { currentPath = []; },
    moveTo(x, y) { currentPoint = [x, y]; },
    lineTo(x, y) {
      currentPath.push([...currentPoint, x, y]);
      currentPoint = [x, y];
    },
    stroke() { strokedPaths.push(currentPath.slice()); },
    fillText() {},
    measureText(text) { return { width: String(text).length * 6 }; }
  };
  const state = {
    bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
    monthLayout: 'double', subColumns: 1, guideLinesCount: 0,
    viewMode: 'banner', currentMonthIndex: 4, year: 2027, holidays: [], zoom: 1,
    lineGrid: 0.2, lineBorder: 0.6, paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9', colorHeaderText: '#0f172a',
    colorText: '#0f172a', colorGrid: '#cbd5e1',
    fontFamily: 'sans', fontHeaderScale: 1, fontDayScale: 1,
    headerAlign: 'center', headerStyle: 'uppercase',
    showKW: false, showMoon: false, showCropMarks: true
  };
  const geo = geometryContext.window.CronoGeometry.calculate(state);
  context.window.CronoCanvas.render(
    { style: {}, getContext: () => drawContext }, { style: {} }, state
  );

  const start = geo.pufferLeft * 20 + state.currentMonthIndex * geo.bMonth * 20;
  const end = start + geo.bVisible * 20;
  const height = state.hVisible * 20;
  const expectedPaths = [[start, 0], [end, 0], [start, height], [end, height]].map(([x, y]) => [
    [x - 13, y, x - 3, y],
    [x + 3, y, x + 13, y],
    [x, y - 13, x, y - 3],
    [x, y + 3, x, y + 13]
  ]);
  const cropPaths = strokedPaths.filter(path => expectedPaths.some(expected =>
    JSON.stringify(path) === JSON.stringify(expected)
  ));
  assert.deepEqual(cropPaths, expectedPaths);
});

test('all special-design and theme combinations use the active canvas colors and font', () => {
  for (const themeKey of context.window.CronoThemes.keys) {
    const theme = context.window.CronoThemes.themes[themeKey];
    for (const designStyle of context.window.CronoDesigns.styles) {
      const fills = [];
      const strokes = [];
      const fonts = [];
      const drawContext = {
        fillStyle: '', strokeStyle: '',
        save() {}, restore() {}, scale() {}, setLineDash() {},
        beginPath() {}, moveTo() {}, lineTo() { strokes.push(this.strokeStyle); },
        stroke() { strokes.push(this.strokeStyle); }, fill() {}, arc() {},
        fillRect() { fills.push(this.fillStyle); },
        strokeRect() { strokes.push(this.strokeStyle); },
        fillText() { fonts.push(this.font); },
        measureText(text) { return { width: String(text).length * 6 }; }
      };
      const state = {
        bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
        monthLayout: 'single', subColumns: 1, guideLinesCount: 0,
        viewMode: 'banner', currentMonthIndex: 2, year: 2027, holidays: [], zoom: 1,
        lineGrid: 0.2, lineBorder: 0.6, fontHeaderScale: 1, fontDayScale: 1,
        headerAlign: 'center', headerStyle: 'uppercase',
        showKW: false, showMoon: false, showCropMarks: false, designStyle,
        themeKey: null
      };
      context.window.CronoThemes.apply(state, themeKey);
      context.window.CronoCanvas.render(
        { style: {}, getContext: () => drawContext }, { style: {} }, state,
        { showViewportOverlay: false }
      );

      assert.ok(fills.includes(theme.paperColor));
      if (designStyle !== 'bauhaus') {
        assert.ok(strokes.includes(theme.colorGrid),
          `${themeKey}/${designStyle} expected ${theme.colorGrid}, received ${JSON.stringify(strokes.slice(0, 5))}`);
      }
      assert.ok(fonts.length > 0);
      assert.ok(fonts.every(font => font.includes(`Embedded-${theme.fontFamily}`)));
    }
  }
});

test('separator hit testing excludes the gap in both views and keeps split dates correct', () => {
  for (const monthLayout of ['single', 'double']) {
    for (const viewMode of ['plate', 'banner']) {
      const state = {
        bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
        monthLayout, viewMode, currentMonthIndex: 1, zoom: 1, year: 2027,
        monthSeparators: { [monthLayout]: { enabled: true, widthMm: 20 } }
      };
      const geo = geometryContext.window.CronoGeometry.calculate(state);
      const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
      const monthStart = viewMode === 'plate' ? 0 : (15 + 14) * 20;
      const y = 1.5 * geo.hDay * 20;
      const hit = x => context.window.CronoCanvas.getDateAtCanvasPoint(monthStart + x, y, canvas, state);
      assert.equal(hit(10), null);
      assert.equal(hit(270), null);
      assert.equal(hit(21).dayNum, 1);
      assert.equal(hit(259).dayNum, monthLayout === 'double' ? 16 : 1);
    }
  }
});

test('canvas draws separators at visible boundaries using the selected color and header setting', () => {
  for (const header of [false, true]) {
    const fills = [];
    const ctx = {
      save() {}, restore() {}, scale() {}, strokeRect() {}, setLineDash() {},
      beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {},
      measureText(text) { return { width: String(text).length * 6 }; },
      fillRect(...rect) { fills.push({ color: this.fillStyle, rect }); }
    };
    const state = {
      bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
      monthLayout: 'double', subColumns: 1, guideLinesCount: 0,
      monthSeparators: { double: { enabled: true, widthMm: 20, colorMode: 'paper', color: '#123456', header } },
      viewMode: 'plate', currentMonthIndex: 1, year: 2027, holidays: [], zoom: 1,
      lineGrid: 0.2, lineBorder: 0.6, paperColor: '#abcdef',
      colorGrid: '#cbd5e1', colorText: '#000000', fontFamily: 'sans',
      fontHeaderScale: 1, fontDayScale: 1, headerAlign: 'center', showCropMarks: false
    };
    const geo = geometryContext.window.CronoGeometry.calculate(state);
    context.window.CronoCanvas.render({ style: {}, getContext: () => ctx }, { style: {} }, state);
    const y = header ? 0 : geo.hDay * 20;
    const separators = fills.filter(({ color, rect }, index) =>
      color === '#abcdef' && rect[1] === y && rect[2] <= 40 && Math.abs(rect[3] - (640 - y)) < 1e-9);
    assert.deepEqual(separators.filter((_, index) => index % 2 === 0).map(({ rect }) => [rect[0], rect[2]]),
      [[0, 20], [260, 40], [540, 40], [820, 20]]);
  }
});

test('ink coverage estimates black and summed color-channel density', () => {
  const imageData = {
    data: new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 255,
      255, 0, 0, 255
    ])
  };
  const coverage = context.window.CronoCanvas.estimateInkCoverage(imageData);

  assert.ok(Math.abs(coverage.blackPercent - 100 / 3) < 1e-9);
  assert.ok(Math.abs(coverage.colorPercent - 200 / 3) < 1e-9);
});

test('coverage renders the full banner without the viewport overlay and reuses it across views', () => {
  let canvasCount = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let redFills = 0;
  const drawContext = {
    save() {}, restore() {}, scale() {}, strokeRect() {}, setLineDash() {},
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {},
    measureText(text) { return { width: String(text).length * 6 }; },
    fillRect() { if (this.fillStyle === '#ef4444') redFills++; },
    getImageData(_x, _y, width, height) {
      return { data: new Uint8ClampedArray(width * height * 4).fill(255) };
    }
  };
  const coverageContext = {
    window: {
      CronoGeometry: geometryContext.window.CronoGeometry,
      CronoHolidays: { get14MonthsData: () => months },
      CronoShare: { createNextYearUrl: () => 'https://example.com/' },
      qrcode: () => ({
        addData() {}, make() {}, getModuleCount: () => 1, isDark: () => true
      }),
      devicePixelRatio: 3
    },
    document: {
      createElement: () => {
        canvasCount++;
        return {
          style: {},
          getContext: () => drawContext,
          get width() { return canvasWidth; },
          set width(value) { canvasWidth = value; },
          get height() { return canvasHeight; },
          set height(value) { canvasHeight = value; }
        };
      },
      getElementById() {
        assert.fail('Offscreen coverage rendering must not update preview UI.');
      }
    }
  };
  vm.createContext(coverageContext);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/canvasRenderer.js'), 'utf8'), coverageContext);

  const state = {
    bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
    monthLayout: 'single', subColumns: 1, guideLinesCount: 0,
    viewMode: 'plate', currentMonthIndex: 7, year: 2027, holidays: [], zoom: 2,
    lineGrid: 0.2, lineBorder: 0.6, paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9', colorText: '#0f172a', colorGrid: '#cbd5e1',
    fontFamily: 'sans', fontHeaderScale: 1, fontDayScale: 1,
    headerAlign: 'center', headerStyle: 'uppercase',
    showKW: false, showMoon: false, showCropMarks: false
  };

  const first = coverageContext.window.CronoCanvas.calculateCoverage(state);
  state.viewMode = 'banner';
  state.currentMonthIndex = 0;
  state.zoom = 1;
  const second = coverageContext.window.CronoCanvas.calculateCoverage(state);

  assert.equal(first.blackPercent, 0);
  assert.equal(first.colorPercent, 0);
  assert.equal(second.blackPercent, first.blackPercent);
  assert.equal(second.colorPercent, first.colorPercent);
  assert.equal(canvasCount, 1);
  assert.equal(canvasWidth, 1130);
  assert.equal(canvasHeight, 160);
  assert.equal(redFills, 0);
});
