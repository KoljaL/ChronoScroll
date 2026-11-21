const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const zlib = require('node:zlib');
const { jsPDF } = require('jspdf');

const root = path.join(__dirname, '..');

function months() {
  return Array.from({ length: 14 }, (_, monthIndex) => ({
    label: `MONAT ${monthIndex + 1}`,
    monthNumber: (monthIndex % 12) + 1,
    monthName: `Monat ${monthIndex + 1}`,
    year: 2027,
    days: Array.from({ length: 31 }, (_, dayIndex) => ({
      dayNum: dayIndex + 1,
      dayName: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][dayIndex % 7],
      isValid: true,
      isSunday: dayIndex % 7 === 6,
      isSaturday: dayIndex % 7 === 5
    }))
  }));
}

function state(overrides = {}) {
  return {
    year: 2027,
    bVisible: 42,
    hVisible: 32,
    pufferLeft: 15,
    pufferRight: 15,
    pufferLeftContent: 'title',
    pufferRightContent: 'blank',
    bannerCustomTitle: 'FAMILIENKALENDER 2027',
    monthLayout: 'single',
    subColumns: 1,
    guideLinesCount: 1,
    showKW: true,
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
    colorSaturdayBg: '#f8fafc',
    colorSaturdayText: '#0f172a',
    colorSundayBg: '#f1f5f9',
    colorSundayText: '#e11d48',
    paperColor: '#ffffff',
    holidays: [],
    ...overrides
  };
}

async function createPdf(fontKey = 'sans', overrides = {}) {
  let output;
  const originalSave = jsPDF.API.save;
  jsPDF.API.save = function() {
    output = Buffer.from(this.output('arraybuffer'));
  };
  class FontFace {
    async load() { return this; }
  }
  const fonts = new Set();
  const context = {
    window: {
      jspdf: { jsPDF },
      CronoShare: { createNextYearUrl: () => 'https://example.com/next-year' },
      CronoHolidays: { get14MonthsData: months },
      qrcode: () => ({
        addData() {},
        make() {},
        getModuleCount: () => 21,
        isDark: (row, col) => row === 0 || col === 0 || row === col
      })
    },
    document: { fonts },
    FontFace,
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    Uint8Array,
    DataView,
    ArrayBuffer,
    TextEncoder,
    TextDecoder,
    URLSearchParams
  };
  vm.createContext(context);
  for (const file of ['embeddedFonts.js', 'fontManager.js', 'geometry.js', 'pdfExport.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }

  const exportState = state({ fontFamily: fontKey, ...overrides });
  if (fontKey === 'custom') {
    const ttf = Buffer.from(context.window.CronoEmbeddedFonts.sans.styles.normal, 'base64');
    await context.window.CronoFonts.loadCustomFont({
      name: 'Benutzer-Schrift.ttf',
      arrayBuffer: async () => ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength)
    });
  }
  try {
    context.window.CronoPDF.exportPlotterPDF(exportState);
    assert.ok(output);
    return { pdf: output, exporter: context.window.CronoPDF };
  } finally {
    jsPDF.API.save = originalSave;
  }
}

function decodePdfString(raw) {
  if (raw.startsWith('<')) {
    const bytes = Buffer.from(raw.slice(1, -1), 'hex');
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return bytes.subarray(2).swap16().toString('utf16le');
    }
    return bytes.toString('latin1');
  }
  const literal = raw.slice(1, -1)
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
  const bytes = Buffer.from(literal, 'latin1');
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return bytes.subarray(2).swap16().toString('utf16le');
  }
  return literal;
}

function infoValue(pdf, key) {
  const match = pdf.match(new RegExp(`/${key}\\s+(<[^>]+>|\\([^]*?\\))`));
  return match ? decodePdfString(match[1]) : null;
}

function decodedStreams(pdfBytes) {
  const output = [];
  const marker = Buffer.from('stream');
  let cursor = 0;
  while (cursor < pdfBytes.length) {
    const start = pdfBytes.indexOf(marker, cursor);
    if (start < 0) break;
    const objectPrefix = pdfBytes.subarray(Math.max(0, start - 500), start).toString('latin1');
    let dataStart = start + marker.length;
    if (pdfBytes[dataStart] === 13 && pdfBytes[dataStart + 1] === 10) dataStart += 2;
    else if (pdfBytes[dataStart] === 10 || pdfBytes[dataStart] === 13) dataStart++;
    const end = pdfBytes.indexOf(Buffer.from('endstream'), dataStart);
    if (end < 0) break;
    let stream = pdfBytes.subarray(dataStart, end);
    while (stream.length && (stream[stream.length - 1] === 10 || stream[stream.length - 1] === 13)) {
      stream = stream.subarray(0, -1);
    }
    if (/FlateDecode/.test(objectPrefix)) {
      try { output.push(zlib.inflateSync(stream).toString('latin1')); } catch {}
    } else {
      output.push(stream.toString('latin1'));
    }
    cursor = end + 9;
  }
  return output.join('\n');
}

function assertRealPdf(pdf, exporter) {
  const raw = pdf.toString('latin1');
  assert.equal((raw.match(/\/Type\s*\/Page\b/g) || []).length, 1);
  const mediaBox = raw.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
  assert.ok(mediaBox);
  assert.ok(Math.abs(Number(mediaBox[1]) - 2260 * 72 / 25.4) < 0.01);
  assert.ok(Math.abs(Number(mediaBox[2]) - 320 * 72 / 25.4) < 0.01);

  assert.equal(infoValue(raw, 'Title'), 'FAMILIENKALENDER 2027 – ChronoScroll');
  assert.equal(infoValue(raw, 'Subject'), '14-Monate-Rollkalender; RGB-Plotterexport; 2260 × 320 mm; 1 Seite');
  assert.equal(infoValue(raw, 'Creator'), 'ChronoScroll');
  assert.equal(infoValue(raw, 'Producer'), exporter.PDF_PRODUCER);
  assert.match(infoValue(raw, 'CreationDate'), /^D:\d{14}(?:Z|[+-]\d{2}'\d{2}')$/);
  assert.doesNotMatch(raw, /GTS_PDFXVersion|OutputIntent|\/Trapped/);

  assert.ok((raw.match(/\/FontFile2\b/g) || []).length >= 3);
  assert.ok((raw.match(/\/FontDescriptor\b/g) || []).length >= 3);
  const content = decodedStreams(pdf);
  assert.match(content, /\bBT\b/);
  assert.match(content, /\b(?:re|re f)\b/);
  assert.match(content, /\b(?:m|l)\b/);
  assert.match(content, /\bTj\b/);
}

test('real bundled-font PDF has exact geometry, metadata, vectors, text and embedded faces', async () => {
  const { pdf, exporter } = await createPdf('sans');
  assertRealPdf(pdf, exporter);
});

test('real user TTF PDF embeds normal, bold and italic faces without a fallback', async () => {
  const { pdf, exporter } = await createPdf('custom');
  assertRealPdf(pdf, exporter);
  assert.match(pdf.toString('latin1'), /CronoScrollCustom/);
});

test('export fails visibly for incomplete months, page-size mismatches and a long title', () => {
  class StubPdf {
    constructor() {
      this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    }
    setProperties() {}
  }
  const context = {
    window: {
      jspdf: { jsPDF: StubPdf },
      CronoShare: { createNextYearUrl: () => 'https://example.com/' },
      qrcode: () => ({ addData() {}, make() {}, getModuleCount: () => 1, isDark: () => true }),
      CronoHolidays: { get14MonthsData: () => [] },
      CronoFonts: { registerPdfFont: () => 'font' },
      CronoGeometry: { calculate: () => ({
        lTotalMm: 2260, hVisibleMm: 320, pufferLeftMm: 150, pufferRightMm: 150
      }), createQr: () => null }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/pdfExport.js'), 'utf8'), context);
  const exportState = state();
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(exportState), /14 Monaten/);

  context.window.CronoHolidays.get14MonthsData = months;
  assert.throws(() => context.window.CronoPDF.exportPlotterPDF(exportState), /Seite entspricht/);
});

test('export aborts instead of clipping an unplaceable custom title', async () => {
  await assert.rejects(
    createPdf('sans', { bannerCustomTitle: 'SEHR LANGER KALENDERTITEL '.repeat(50) }),
    /Kalendertitel passt nicht/
  );
});
