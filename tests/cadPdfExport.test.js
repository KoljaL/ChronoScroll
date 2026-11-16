const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadExporter(jsPDF) {
  const context = { window: { jspdf: { jsPDF } } };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'js/cadPdfExport.js'), 'utf8'),
    context
  );
  return context.window.CronoScrollCADPdf;
}

function makeSvg(initialViewBox = 'previous view box') {
  return {
    viewBox: initialViewBox,
    getAttribute(name) { return name === 'viewBox' ? this.viewBox : null; },
    setAttribute(name, value) { if (name === 'viewBox') this.viewBox = value; }
  };
}

test('CAD PDF export writes the base drawing to A4 and restores the active viewBox', async () => {
  const options = [];
  const saved = [];
  const svgCalls = [];
  class MockPdf {
    constructor(config) { options.push(config); }
    async svg(svg, config) {
      svgCalls.push({ viewBox: svg.viewBox, config });
    }
    save(filename) { saved.push(filename); }
  }
  const exporter = loadExporter(MockPdf);
  const svg = makeSvg();
  const baseViewBox = { x: 1, y: 2, w: 300, h: 200 };

  await exporter.exportCadDrawing(svg, baseViewBox, 'ChronoScroll_CAD.pdf');

  assert.equal(options.length, 1);
  assert.equal(options[0].orientation, 'landscape');
  assert.equal(options[0].unit, 'mm');
  assert.equal(options[0].format, 'a4');
  assert.equal(options[0].compress, true);
  assert.equal(svgCalls.length, 1);
  assert.equal(svgCalls[0].viewBox, '1 2 300 200');
  assert.equal(svgCalls[0].config.width, 297);
  assert.equal(svgCalls[0].config.height, 210);
  assert.deepEqual(saved, ['ChronoScroll_CAD.pdf']);
  assert.equal(svg.viewBox, 'previous view box');
});

test('CAD PDF export restores the active viewBox and propagates SVG rendering errors', async () => {
  class FailingPdf {
    async svg() { throw new Error('SVG rendering failed'); }
    save() { assert.fail('PDF must not be saved after SVG rendering fails'); }
  }
  const exporter = loadExporter(FailingPdf);
  const svg = makeSvg();

  await assert.rejects(
    exporter.exportCadDrawing(svg, { x: 0, y: 0, w: 10, h: 20 }, 'drawing.pdf'),
    /SVG rendering failed/
  );
  assert.equal(svg.viewBox, 'previous view box');
});
