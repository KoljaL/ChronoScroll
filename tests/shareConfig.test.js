const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {}, TextEncoder, TextDecoder, URLSearchParams, btoa, atob };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/shareConfig.js'), 'utf8'), context);
const share = context.window.CronoShare;

function state() {
  const separator = { enabled: true, widthMm: 2, colorMode: 'paper', color: '#123456', header: false };
  return {
    year: 2027, hVisible: 32, bVisible: 42, pufferLeft: 15, pufferRight: 15,
    pufferLeftContent: 'title', pufferRightContent: 'notes', bannerCustomTitle: 'Übersicht 2027 / 12027',
    monthLayout: 'double', monthSeparators: { single: { ...separator }, double: { ...separator } },
    subColumns: 3, guideLinesCount: 2, guideLinesStyle: 'dotted',
    showKW: true, showMoon: false, showCropMarks: true,
    headerStyle: 'numbered', headerAlign: 'left', fontFamily: 'serif',
    fontHeaderScale: 1.2, fontDayScale: 0.8, lineGrid: 0.2, lineBorder: 0.6,
    paperColor: '#ffffff', colorHeaderBg: '#111111', colorHeaderText: '#222222',
    colorGrid: '#333333', colorText: '#444444', colorSaturdayBg: '#555555',
    colorSaturdayText: '#666666', colorSundayBg: '#777777', colorSundayText: '#888888',
    colorWeekendBg: '#999999', colorWeekendText: '#aaaaaa',
    country: 'AT', bundesland: 'NOE', holidays: [{ title: 'Privater Termin' }],
    zoom: 2, holidaySearchQuery: 'privat'
  };
}

test('next-year URL round trips only durable settings and updates matching title years', () => {
  const original = state();
  const url = new URL(share.createNextYearUrl(original));
  assert.equal(`${url.origin}${url.pathname}`, 'https://koljal.github.io/ChronoScroll/');
  const restored = state();
  restored.holidays = [];
  restored.zoom = 1;
  restored.holidaySearchQuery = '';
  share.restore(url.search, restored);
  assert.equal(restored.year, 2028);
  assert.equal(restored.bannerCustomTitle, 'Übersicht 2028 / 12027');
  assert.equal(restored.country, 'AT');
  assert.equal(restored.bundesland, 'NOE');
  assert.equal(restored.monthSeparators.double.widthMm, 2);
  assert.deepEqual(restored.holidays, []);
  assert.equal(restored.zoom, 1);
  assert.equal(restored.holidaySearchQuery, '');
  assert.equal(original.year, 2027);
});

test('malformed, unsupported and invalid values do not block restoration', () => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const search of ['?config=%%%', '?config=e30', '?config=abc&config=abc',
    `?config=${encode([2, [], 'DE', 'NW', []])}`]) {
    const target = state();
    share.restore(search, target);
    assert.equal(target.year, 2027);
  }
  const target = state();
  const data = [1, [9999, -4, 50], '__proto__', 'NW', [[true, -1, 'bad', '#fff', true]]];
  share.restore(`?config=${encode(data)}`, target);
  assert.equal(target.year, 2027);
  assert.equal(target.hVisible, 32);
  assert.equal(target.bVisible, 50);
  assert.equal(target.country, 'AT');
  assert.equal(target.monthSeparators.single.widthMm, 2);
  assert.equal(target.monthSeparators.single.header, true);
});

test('invalid current settings and out-of-range next year are reported', () => {
  const target = state();
  target.year = 2100;
  assert.throws(() => share.createNextYearUrl(target), /Folgejahr/);
  target.year = 2027;
  target.hVisible = 0;
  assert.throws(() => share.createNextYearUrl(target), /hVisible/);
});
