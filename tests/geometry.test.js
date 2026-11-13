const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/geometry.js'), 'utf8'), context);

const calculate = context.window.CronoGeometry.calculate;

test('single-column layout keeps the existing calendar geometry', () => {
  const geo = calculate({ bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15 });

  assert.equal(geo.bMonth, 14);
  assert.equal(geo.hDay, 1);
  assert.equal(geo.lTotal, 226);
  assert.equal(geo.dayColumns, 1);
  assert.deepEqual({ ...geo.getDayPosition(31) }, { column: 0, row: 30 });
});

test('double-column layout preserves the physical dimensions and maps days 1–15 / 16–31', () => {
  const single = calculate({ bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15 });
  const double = calculate({
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    monthLayout: 'double',
    subColumns: 2
  });

  assert.equal(double.bVisible, single.bVisible);
  assert.equal(double.hVisible, single.hVisible);
  assert.equal(double.bMonth, single.bMonth);
  assert.equal(double.lTotal, single.lTotal);
  assert.equal(double.hDay, 32 / 17);
  assert.equal(double.dayColumnWidth, 7);
  assert.equal(double.subColumnWidth, 3.5);
  assert.deepEqual({ ...double.getDayPosition(1) }, { column: 0, row: 0 });
  assert.deepEqual({ ...double.getDayPosition(15) }, { column: 0, row: 14 });
  assert.deepEqual({ ...double.getDayPosition(16) }, { column: 1, row: 0 });
  assert.deepEqual({ ...double.getDayPosition(31) }, { column: 1, row: 15 });
});

test('month separators reserve space only at real boundaries for both layouts', () => {
  for (const monthLayout of ['single', 'double']) {
    const geo = calculate({
      bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
      monthLayout, subColumns: 2,
      monthSeparators: { [monthLayout]: { enabled: true, widthMm: 20 } }
    });

    const first = geo.getMonthMetrics(0);
    const middle = geo.getMonthMetrics(1);
    const last = geo.getMonthMetrics(13);
    assert.equal(geo.bMonth, 14);
    assert.equal(geo.lTotal, 226);
    assert.equal(first.leftInset, 0);
    assert.equal(first.rightInset, 1);
    assert.equal(middle.leftInset, 1);
    assert.equal(middle.rightInset, 1);
    assert.equal(last.leftInset, 1);
    assert.equal(last.rightInset, 0);
    assert.equal(middle.contentWidth, 12);
    assert.equal(middle.dayColumnWidth, monthLayout === 'double' ? 6 : 12);
  }
});

test('a thin separator preserves its exact millimetre width', () => {
  const geo = calculate({
    bVisible: 42, monthLayout: 'single',
    monthSeparators: { single: { enabled: true, widthMm: 0.1 } }
  });
  assert.equal(geo.separatorWidthMm, 0.1);
  assert.ok(Math.abs(geo.getMonthMetrics(1).contentWidthMm - 139.9) < 1e-9);
});
