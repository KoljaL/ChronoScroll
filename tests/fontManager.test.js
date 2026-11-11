const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function createFonts() {
  const faces = new Set();
  class FontFace {
    constructor(family, bytes, descriptors) {
      this.family = family;
      this.bytes = bytes;
      this.descriptors = descriptors;
    }

    async load() {
      if (this.bytes.length < 12) throw new Error('Ungültige Schriftdatei');
      return this;
    }
  }
  class JsPdf {
    addFileToVFS() {}
    addFont() {}
  }
  const context = {
    window: { jspdf: { jsPDF: JsPdf } },
    document: { fonts: faces },
    FontFace,
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    btoa: value => Buffer.from(value, 'binary').toString('base64')
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/embeddedFonts.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/fontManager.js'), 'utf8'), context);
  return { fonts: context.window.CronoFonts, embedded: context.window.CronoEmbeddedFonts, faces };
}

function makeFont(pairCount) {
  const subtableLength = 14 + 6 * pairCount;
  const buffer = new ArrayBuffer(28 + 4 + subtableLength);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(4, 1);
  view.setUint32(12, 0x6b65726e);
  view.setUint32(20, 28);
  view.setUint32(24, 4 + subtableLength);
  view.setUint16(30, 1);
  view.setUint16(34, subtableLength & 0xffff);
  view.setUint16(38, pairCount);
  return buffer;
}

function file(buffer, name = 'test.ttf') {
  return { name, arrayBuffer: async () => buffer };
}

test('detects an oversized format 0 kern subtable without rejecting the font', async () => {
  const { fonts, faces } = createFonts();
  const result = await fonts.loadCustomFont(file(makeFont(10921)));
  assert.equal(result.hasOversizedKernTable, true);
  assert.equal(fonts.hasCustomFont(), true);
  assert.equal(faces.size, 3);
});

test('does not warn for the largest valid format 0 kern subtable', async () => {
  const { fonts } = createFonts();
  const result = await fonts.loadCustomFont(file(makeFont(10920)));
  assert.equal(result.hasOversizedKernTable, false);
});

test('handles truncated table data safely and reports invalid font loading', async () => {
  const { fonts } = createFonts();
  const oversized = makeFont(10921);
  const truncated = oversized.slice(0, 50);
  assert.equal((await fonts.loadCustomFont(file(truncated))).hasOversizedKernTable, false);
  const invalidOffset = makeFont(0);
  new DataView(invalidOffset).setUint32(20, 0xffffffff);
  assert.equal((await fonts.loadCustomFont(file(invalidOffset))).hasOversizedKernTable, false);
  await assert.rejects(fonts.loadCustomFont(file(new ArrayBuffer(4))), /keine unterstützte TTF-Schrift/);
  await assert.rejects(fonts.loadCustomFont(file(new ArrayBuffer(20), 'test.otf')), /Endung .ttf/);
  const tooShort = makeFont(0).slice(0, 8);
  await assert.rejects(fonts.loadCustomFont(file(tooShort)), /Ungültige Schriftdatei/);
});

test('bundled Serif faces retain GPOS and do not contain the oversized kern table', () => {
  const { embedded } = createFonts();
  for (const style of ['normal', 'bold', 'italic']) {
    const bytes = Buffer.from(embedded.serif.styles[style], 'base64');
    const count = bytes.readUInt16BE(4);
    const tables = new Set();
    for (let i = 0; i < count; i++) {
      const entry = 12 + i * 16;
      assert.ok(entry + 16 <= bytes.length);
      const offset = bytes.readUInt32BE(entry + 8);
      const length = bytes.readUInt32BE(entry + 12);
      assert.ok(offset <= bytes.length && length <= bytes.length - offset);
      tables.add(bytes.toString('ascii', entry, entry + 4));
    }
    assert.ok(tables.has('GPOS'));
    assert.equal(tables.has('kern'), false);
  }
});

test('loads all standard faces and embeds the selected Serif variants in PDF', async () => {
  const { fonts, embedded, faces } = createFonts();
  await fonts.loadStandardFonts();
  await fonts.loadStandardFonts();
  assert.equal(faces.size, 9);
  assert.equal(fonts.getCanvasFamily('serif'), '"CronoScroll Serif"');
  const files = [];
  const registered = [];
  const pdfName = fonts.registerPdfFont({
    addFileToVFS: (name, data) => files.push([name, data]),
    addFont: (name, family, style) => registered.push([name, family, style])
  }, 'serif');
  assert.equal(pdfName, 'CronoScrollSerif');
  assert.deepEqual(registered.map(entry => entry[2]), ['normal', 'bold', 'italic']);
  for (const [index, style] of ['normal', 'bold', 'italic'].entries()) {
    assert.equal(files[index][1], embedded.serif.styles[style]);
  }
});
