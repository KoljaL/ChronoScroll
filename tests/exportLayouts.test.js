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
