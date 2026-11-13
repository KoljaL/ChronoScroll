const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function createMonths() {
  return Array.from({ length: 14 }, (_, monthIndex) => ({
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
        isValid: true,
        isSunday: false,
        isSaturday: false
      };
    })
  }));
}

function createState(monthLayout) {
  return {
    year: 2027,
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    pufferLeftContent: 'blank',
    pufferRightContent: 'blank',
    monthLayout,
    subColumns: 1,
    guideLinesCount: 0,
    showKW: false,
    showCropMarks: false,
    fontFamily: 'sans',
    fontHeaderScale: 1,
    fontDayScale: 1,
    headerStyle: 'uppercase',
    headerAlign: 'center',
    lineGrid: 0.2,
    lineBorder: 0.6,
    colorGrid: '#cbd5e1',
    colorText: '#0f172a',
    colorHeaderBg: '#f1f5f9',
    colorHeaderText: '#0f172a',
    colorSundayBg: '#f1f5f9',
    colorSaturdayBg: '#f8fafc',
    paperColor: '#ffffff',
    holidays: []
  };
}

function nearlyEqual(actual, expected) {
  return Math.abs(actual - expected) < 1e-9;
}

function stubQrDependencies() {
  return {
    CronoShare: { createNextYearUrl: () => 'https://example.com/' },
    qrcode: () => ({
      addData() {}, make() {}, getModuleCount: () => 1, isDark: () => true
    })
  };
}

test('PDF export places day 16 in the second half without changing the roll size', () => {
  let exportedDoc;
  class JsPdf {
    constructor(options) {
      this.options = options;
      this.rects = [];
      exportedDoc = this;
    }

    rect(...args) { this.rects.push(args); }
    getTextWidth(text) { return String(text).length; }
    save() {}
    line() {}
    setLineWidth() {}
    setDrawColor() {}
    setFillColor() {}
    setTextColor() {}
    setFont() {}
    setFontSize() {}
    text() {}
  }

  const context = {
    window: {
      ...stubQrDependencies(),
      jspdf: { jsPDF: JsPdf },
      CronoGeometry: null,
      CronoHolidays: { get14MonthsData: createMonths },
      CronoFonts: { registerPdfFont: () => 'helvetica' }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/geometry.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/pdfExport.js'), 'utf8'), context);

  const state = createState('double');
  const geo = context.window.CronoGeometry.calculate(state);
  context.window.CronoPDF.exportPlotterPDF(state);

  assert.deepEqual(Array.from(exportedDoc.options.format), [2260, 320]);
  assert.ok(exportedDoc.rects.some(([x, y, width, height, style]) =>
    x === 220 && nearlyEqual(y, geo.hDayMm) &&
    width === 70 && nearlyEqual(height, geo.hDayMm) && style === 'D'
  ));
  assert.ok(exportedDoc.rects.some(([x, y, width, height, style]) =>
    x === 360 && nearlyEqual(y, 14 * geo.hDayMm) &&
    width === 70 && nearlyEqual(height, geo.hDayMm) && style === 'D'
  ));
});

test('SVG export uses the same split-column coordinates as the PDF geometry', () => {
  let exportedBlob;
  const context = {
    window: {
      CronoGeometry: null,
      CronoHolidays: { get14MonthsData: createMonths }
    },
    Blob: class {
      constructor(parts) {
        this.content = parts.join('');
      }
    },
    URL: {
      createObjectURL(blob) {
        exportedBlob = blob;
        return 'blob:calendar';
      },
      revokeObjectURL() {}
    },
    document: {
      body: { appendChild() {}, removeChild() {} },
      createElement: () => ({ click() {} })
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/geometry.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/svgExport.js'), 'utf8'), context);

  const state = createState('double');
  const geo = context.window.CronoGeometry.calculate(state);
  context.window.CronoVector.exportSVG(state);

  assert.ok(exportedBlob.content.includes(
    `x="220" y="${geo.hDayMm}" width="70" height="${geo.hDayMm}" fill="none"`
  ));
  assert.ok(exportedBlob.content.includes(
    `x="360" y="${14 * geo.hDayMm}" width="70" height="${geo.hDayMm}" fill="#fafafa"`
  ));
});

test('PDF and SVG reserve and paint the same separators for both layouts', () => {
  for (const monthLayout of ['single', 'double']) {
    for (const header of [false, true]) {
      let exportedDoc;
      let exportedBlob;
      class JsPdf {
        constructor() { this.rects = []; exportedDoc = this; }
        rect(...args) { this.rects.push({ args, color: this.fillColor }); }
        setFillColor(...color) { this.fillColor = color; }
        getTextWidth(text) { return String(text).length; }
        save() {} line() {} setLineWidth() {} setDrawColor() {}
        setTextColor() {} setFont() {} setFontSize() {} text() {}
      }
      const context = {
        window: {
          ...stubQrDependencies(),
          jspdf: { jsPDF: JsPdf },
          CronoHolidays: { get14MonthsData: createMonths },
          CronoFonts: { registerPdfFont: () => 'helvetica' }
        },
        Blob: class { constructor(parts) { this.content = parts.join(''); } },
        URL: {
          createObjectURL(blob) { exportedBlob = blob; return 'blob:calendar'; },
          revokeObjectURL() {}
        },
        document: { body: { appendChild() {}, removeChild() {} }, createElement: () => ({ click() {} }) }
      };
      vm.createContext(context);
      for (const file of ['geometry.js', 'pdfExport.js', 'svgExport.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
      }
      const state = createState(monthLayout);
      state.paperColor = '#abcdef';
      state.monthSeparators = {
        [monthLayout]: { enabled: true, widthMm: 20, colorMode: header ? 'paper' : 'custom', color: '#123456', header }
      };
      const geo = context.window.CronoGeometry.calculate(state);
      context.window.CronoPDF.exportPlotterPDF(state);
      context.window.CronoVector.exportSVG(state);
      const top = header ? 0 : geo.hDayMm;
      const color = header ? '#abcdef' : '#123456';
      const rgb = header ? [171, 205, 239] : [18, 52, 86];
      const separators = exportedDoc.rects.filter(({ args, color }) =>
        args[2] === 20 && args[1] === top && args[3] === 320 - top &&
        args[4] === 'F' && JSON.stringify(color) === JSON.stringify(rgb));
      assert.equal(separators.length, 13);
      assert.equal(separators[0].args[0], 280);
      assert.ok(exportedBlob.content.includes(
        `<rect x="280" y="${top}" width="20" height="${320 - top}" fill="${color}"/>`
      ));
      const width = monthLayout === 'double' ? 60 : 120;
      assert.ok(exportedDoc.rects.some(({ args }) =>
        args[0] === 300 && args[1] === geo.hDayMm && args[2] === width && args[4] === 'D'));
      assert.ok(exportedBlob.content.includes(
        `x="300" y="${geo.hDayMm}" width="${width}" height="${geo.hDayMm}" fill="none"`
      ));
      assert.ok(exportedBlob.content.endsWith('</g>\n</svg>'));
    }
  }
});

test('PDF encodes the shared URL as vector modules within the right buffer', () => {
  let exportedDoc;
  let encodedUrl;
  let qr;
  class JsPdf {
    constructor(options) { this.options = options; this.rects = []; exportedDoc = this; }
    rect(...args) { this.rects.push({ args, color: this.fillColor }); }
    setFillColor(...color) { this.fillColor = color; }
    getTextWidth(text) { return String(text).length; }
    save() {} line() {} setLineWidth() {} setDrawColor() {}
    setTextColor() {} setFont() {} setFontSize() {} text() {}
  }
  const context = {
    TextEncoder, TextDecoder, URLSearchParams, btoa, atob,
    window: {
      jspdf: { jsPDF: JsPdf },
      CronoHolidays: { get14MonthsData: createMonths },
      CronoFonts: { registerPdfFont: () => 'helvetica' }
    }
  };
  vm.createContext(context);
  for (const file of ['geometry.js', 'shareConfig.js', 'qrcode.js', 'pdfExport.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  context.window.qrcode = (...args) => {
    qr = context.qrcode(...args);
    const addData = qr.addData;
    qr.addData = data => { encodedUrl = data; addData(data); };
    return qr;
  };
  const state = {
    ...createState('double'),
    bannerCustomTitle: 'Kalender 2027', country: 'DE', bundesland: 'NW',
    guideLinesStyle: 'dashed', showMoon: true,
    colorSaturdayText: '#0f172a', colorSundayText: '#e11d48',
    colorWeekendBg: '#f1f5f9', colorWeekendText: '#e11d48',
    monthSeparators: {
      single: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
      double: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false }
    }
  };
  context.window.CronoPDF.exportPlotterPDF(state);
  assert.equal(encodedUrl, context.window.CronoShare.createNextYearUrl(state));
  assert.deepEqual(Array.from(exportedDoc.options.format), [2260, 320]);
  const white = exportedDoc.rects.find(({ args, color }) =>
    args[0] === 2135 && args[1] === 110 && args[2] === 100 &&
    args[3] === 100 && JSON.stringify(color) === '[255,255,255]');
  assert.ok(white);
  const moduleSize = 100 / (qr.getModuleCount() + 8);
  const black = exportedDoc.rects.filter(({ color, args }) =>
    JSON.stringify(color) === '[0,0,0]' && args[4] === 'F');
  const drawn = new Set();
  for (const { args: [x, y, width, height] } of black) {
    assert.ok(x >= 2135 + 4 * moduleSize && x + width <= 2235 - 4 * moduleSize + 1e-9);
    assert.ok(y >= 110 + 4 * moduleSize && y + height <= 210 - 4 * moduleSize + 1e-9);
    const row = Math.round((y - 110) / moduleSize) - 4;
    const first = Math.round((x - 2135) / moduleSize) - 4;
    for (let col = first; col < first + Math.round(width / moduleSize); col++) drawn.add(`${row},${col}`);
  }
  for (let row = 0; row < qr.getModuleCount(); row++) {
    for (let col = 0; col < qr.getModuleCount(); col++) {
      assert.equal(drawn.has(`${row},${col}`), qr.isDark(row, col));
    }
  }
  state.pufferRight = 1;
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(state), /puffer.*zu schmal/i);
  state.pufferRight = 0;
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(state), /puffer.*zu schmal/i);
});
