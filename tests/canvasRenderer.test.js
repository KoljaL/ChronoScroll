const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const geometryContext = { window: {} };
vm.createContext(geometryContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/geometry.js'), 'utf8'), geometryContext);

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
    CronoHolidays: { get14MonthsData: () => months }
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
