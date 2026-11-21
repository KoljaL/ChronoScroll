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
      this.properties = {};
      this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
      exportedDoc = this;
    }

    setProperties(properties) { this.properties = properties; }
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

test('PDF crop marks are limited to the visible window edges', () => {
  let exportedDoc;
  class JsPdf {
    constructor() {
      this.lines = [];
      this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
      exportedDoc = this;
    }

    setProperties() {}
    line(...args) { this.lines.push(args); }
    rect() {}
    getTextWidth(text) { return String(text).length; }
    save() {}
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
      CronoHolidays: { get14MonthsData: createMonths },
      CronoFonts: { registerPdfFont: () => 'helvetica' }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/geometry.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/pdfExport.js'), 'utf8'), context);

  const state = { ...createState('double'), currentMonthIndex: 4, showCropMarks: true };
  const geo = context.window.CronoGeometry.calculate(state);
  context.window.CronoPDF.exportPlotterPDF(state);

  const start = geo.pufferLeftMm + state.currentMonthIndex * geo.bMonthMm;
  const end = start + geo.bVisibleMm;
  const expectedLines = [[start, 0], [end, 0], [start, geo.hVisibleMm], [end, geo.hVisibleMm]].flatMap(([x, y]) => [
    [x - 5.5, y, x - 1.5, y],
    [x + 1.5, y, x + 5.5, y],
    [x, y - 5.5, x, y - 1.5],
    [x, y + 1.5, x, y + 5.5]
  ]);
  assert.deepEqual(exportedDoc.lines, expectedLines);
  state.showCropMarks = false;
  context.window.CronoPDF.exportPlotterPDF(state);
  assert.deepEqual(exportedDoc.lines, []);
});

test('SVG export uses the same split-column coordinates as the PDF geometry', () => {
  let exportedBlob;
  const context = {
    window: {
      ...stubQrDependencies(),
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

test('transparent event colors and moon phases reach PDF and SVG', () => {
  let doc;
  let svg;
  const months = createMonths();
  months[0].days[0].holiday = { title: 'Termin', color: '#d977061c' };
  months[0].days[0].moonPhase = { type: 'new' };
  class JsPdf {
    constructor() {
      doc = this;
      this.fills = [];
      this.texts = [];
      this.circles = 0;
      this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
    }
    setProperties() {} setFillColor(...rgb) { this.fills.push(rgb); }
    circle() { this.circles++; }
    rect() {} line() {} setLineWidth() {} setDrawColor() {}
    setTextColor(...rgb) { this.textColor = rgb; }
    setFont() {} setFontSize() {} setLineDashPattern() {}
    getTextWidth(text) { return String(text).length; }
    text(value) { this.texts.push({ value, color: this.textColor }); } save() {}
  }
  const context = {
    window: {
      jspdf: { jsPDF: JsPdf },
      CronoHolidays: { get14MonthsData: () => months },
      CronoFonts: { registerPdfFont: () => 'sans' }
    },
    Blob: class { constructor(parts) { svg = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { body: { appendChild() {}, removeChild() {} }, createElement: () => ({ click() {} }) }
  };
  vm.createContext(context);
  for (const file of ['geometry.js', 'designPresets.js', 'pdfExport.js', 'svgExport.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  const current = {
    ...createState('single'), qrEnabled: false, showMoon: true, moonOpacity: 0.5,
    paperColor: '#c0d0e0', colorText: '#00000080'
  };
  context.window.CronoPDF.exportPlotterPDF(current);
  context.window.CronoVector.exportSVG(current);
  const flatten = context.window.CronoGeometry.flattenColor;
  const cellBackground = flatten('#d977061c', current.paperColor);
  const rgb = color => color.slice(1).match(/../g).map(x => parseInt(x, 16));
  const expected = rgb(cellBackground);
  assert.ok(doc.fills.some(rgb => JSON.stringify(rgb) === JSON.stringify(expected)));
  assert.deepEqual(doc.texts.find(text => text.value === '01 Mo').color, rgb(flatten(current.colorText, cellBackground)));
  assert.ok(doc.circles > 0);
  assert.ok(svg.includes('fill="#d977061c"'));
  assert.ok(svg.includes('<circle'));
  current.moonOpacity = 0;
  context.window.CronoPDF.exportPlotterPDF(current);
  context.window.CronoVector.exportSVG(current);
  assert.equal(doc.circles, 0);
  assert.ok(!svg.includes('<circle'));
});

test('PDF and SVG reserve and paint the same separators for both layouts', () => {
  for (const monthLayout of ['single', 'double']) {
    for (const header of [false, true]) {
      let exportedDoc;
      let exportedBlob;
      class JsPdf {
        constructor() {
          this.rects = [];
          this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
          exportedDoc = this;
        }
        setProperties() {}
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
    constructor(options) {
      this.options = options;
      this.rects = [];
      this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
      exportedDoc = this;
    }
    setProperties() {}
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
    args[0] === 2150 && args[1] === 110 && args[2] === 100 &&
    args[3] === 100 && JSON.stringify(color) === '[255,255,255]');
  assert.ok(white);
  const moduleSize = 100 / (qr.getModuleCount() + 8);
  const black = exportedDoc.rects.filter(({ color, args }) =>
    JSON.stringify(color) === '[0,0,0]' && args[4] === 'F');
  const drawn = new Set();
  for (const { args: [x, y, width, height] } of black) {
    assert.ok(x >= 2150 + 4 * moduleSize && x + width <= 2250 - 4 * moduleSize + 1e-9);
    assert.ok(y >= 110 + 4 * moduleSize && y + height <= 210 - 4 * moduleSize + 1e-9);
    const row = Math.round((y - 110) / moduleSize) - 4;
    const first = Math.round((x - 2150) / moduleSize) - 4;
    for (let col = first; col < first + Math.round(width / moduleSize); col++) drawn.add(`${row},${col}`);
  }
  for (let row = 0; row < qr.getModuleCount(); row++) {
    for (let col = 0; col < qr.getModuleCount(); col++) {
      assert.equal(drawn.has(`${row},${col}`), qr.isDark(row, col));
    }
  }
  let svg;
  context.Blob = class { constructor(parts) { svg = parts.join(''); } };
  context.URL = { createObjectURL: () => 'blob:calendar', revokeObjectURL() {} };
  context.document = {
    body: { appendChild() {}, removeChild() {} },
    createElement: () => ({ click() {} })
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/svgExport.js'), 'utf8'), context);
  context.window.CronoVector.exportSVG(state);
  assert.ok(svg.includes('<g id="qr-code"><rect x="2150" y="110" width="100" height="100"'));
  state.qrEnabled = false;
  context.window.CronoVector.exportSVG(state);
  assert.ok(!svg.includes('id="qr-code"'));
  state.qrEnabled = true;
  state.pufferRight = 1;
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(state), /puffer.*zu schmal/i);
  state.pufferRight = 0;
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(state), /puffer.*zu schmal/i);
});

test('all special-design and theme combinations keep palette and font in PDF and SVG', () => {
  let exportedDoc;
  let exportedBlob;
  let registeredFont;
  class JsPdf {
    constructor() {
      this.drawColors = [];
      this.textColors = [];
      this.fillColors = [];
      this.internal = { pageSize: { getWidth: () => 2260, getHeight: () => 320 } };
      exportedDoc = this;
    }
    setProperties() {}
    rect() {}
    getTextWidth(text) { return String(text).length; }
    save() {}
    line() {}
    setLineWidth() {}
    setDrawColor(...color) { this.drawColors.push(color); }
    setFillColor(...color) { this.fillColors.push(color); }
    setTextColor(...color) { this.textColors.push(color); }
    setFont() {}
    setFontSize() {}
    setLineDashPattern() {}
    text() {}
  }
  const font = key => ({
    family: `Embedded-${key}`,
    styles: { normal: 'normal', bold: 'bold' }
  });
  const context = {
    window: {
      jspdf: { jsPDF: JsPdf },
      CronoShare: { createNextYearUrl: () => 'https://example.com/' },
      qrcode: () => ({ addData() {}, make() {}, getModuleCount: () => 1, isDark: () => true }),
      CronoHolidays: { get14MonthsData: createMonths },
      CronoFonts: { registerPdfFont(_doc, key) { registeredFont = key; return key; } },
      CronoEmbeddedFonts: { sans: font('sans'), serif: font('serif'), mono: font('mono') }
    },
    Blob: class { constructor(parts) { this.content = parts.join(''); } },
    URL: {
      createObjectURL(blob) { exportedBlob = blob; return 'blob:calendar'; },
      revokeObjectURL() {}
    },
    document: {
      body: { appendChild() {}, removeChild() {} },
      createElement: () => ({ click() {} })
    }
  };
  vm.createContext(context);
  for (const file of ['geometry.js', 'themePresets.js', 'designPresets.js', 'pdfExport.js', 'svgExport.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }

  const rgb = hex => hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16));
  for (const themeKey of context.window.CronoThemes.keys) {
    const theme = context.window.CronoThemes.themes[themeKey];
    for (const designStyle of context.window.CronoDesigns.styles) {
      const state = {
        ...createState('single'),
        year: 2027, designStyle, holidays: [], showCropMarks: false,
        showKW: false, showMoon: false, themeKey: null
      };
      context.window.CronoThemes.apply(state, themeKey);
      context.window.CronoPDF.exportPlotterPDF(state);
      context.window.CronoVector.exportSVG(state);

      assert.equal(registeredFont, theme.fontFamily);
      assert.ok(exportedDoc.fillColors.some(color => JSON.stringify(color) === JSON.stringify(rgb(theme.paperColor))));
      if (designStyle !== 'bauhaus') {
        assert.ok(exportedDoc.drawColors.some(color => JSON.stringify(color) === JSON.stringify(rgb(theme.colorGrid))),
          `${themeKey}/${designStyle} expected ${theme.colorGrid}, received ${JSON.stringify(exportedDoc.drawColors.slice(0, 5))}`);
      }
      assert.ok(exportedDoc.textColors.some(color => JSON.stringify(color) === JSON.stringify(rgb(theme.colorText))));
      assert.ok(exportedBlob.content.includes(theme.paperColor));
      assert.ok(exportedBlob.content.includes(theme.colorGrid));
      assert.ok(exportedBlob.content.includes(`Embedded-${theme.fontFamily}`));
    }
  }
});
