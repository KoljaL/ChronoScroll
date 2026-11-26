const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.hidden = true;
    this.textContent = '';
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  querySelectorAll() { return []; }
  setCustomValidity(message) { this.validationMessage = message; }
  reportValidity() { return !this.validationMessage; }
  get firstChild() { return this.children[0]; }
  set innerHTML(value) { if (value === '') this.children = []; }
}

function loadCAD() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement: tag => new Element(tag),
    createElementNS: (_, tag) => new Element(tag),
    addEventListener() {}
  };
  document.getElementById('cad-mode-root').contains = () => true;
  const source = fs.readFileSync(path.join(__dirname, '../js/cad-module.js'), 'utf8')
    .replace('return { init };', 'return { init, updateValidationUI, bindActions, inputMap };')
    .replace("  document.addEventListener('DOMContentLoaded'", "  window.testCAD = { ParameterStore, GeometryEngine, CADRenderer, buildBOMRows, UIController };\n  document.addEventListener('DOMContentLoaded'");
  const context = { document, window: {}, requestAnimationFrame: () => 1 };
  vm.runInNewContext(source, context);
  return { ...context.window.testCAD, elements, document };
}

function find(node, id) {
  if (node.getAttribute('id') === id) return node;
  for (const child of node.children) {
    const result = find(child, id);
    if (result) return result;
  }
}

test('CAD BOM scales every quantity and retains derived dimensions and drill clearance', () => {
  const { ParameterStore, GeometryEngine, buildBOMRows } = loadCAD();
  const p = { ...ParameterStore.getDefaults(), blindHoleClearanceMm: 0.5 };
  const geom = GeometryEngine.analyze(p);
  const rows = buildBOMRows(p, geom, 99);
  assert.deepEqual(Array.from(rows, row => row[0]), ['198×', '198×', '99×', '99×', '396×', '198×', '198×']);
  assert.match(rows[1][3], /Bohrer Ø 25\.5 mm/);
  assert.match(rows[2][2], /424 × 302 × 20 mm/);
});

test('CAD renderer includes a complete BOM in the A4 SVG for default and tall drawings', () => {
  const { ParameterStore, GeometryEngine, CADRenderer } = loadCAD();
  for (const windowHeight of [300, 1500]) {
    const p = { ...ParameterStore.getDefaults(), windowHeight };
    const svg = new Element('svg');
    CADRenderer.render(svg, p, GeometryEngine.analyze(p), {}, {
      title: 'Test', material: 'Holz', drawingNo: '1', author: 'Test'
    }, null, 3);
    assert.equal(svg.getAttribute('width'), '297mm');
    assert.equal(svg.getAttribute('height'), '210mm');
    const table = find(svg, 'cad-bom-table');
    assert.ok(table);
    const text = table.children.filter(node => node.tag === 'text').map(node => node.textContent);
    assert.equal(text[0], 'STÜCKLISTE (BOM)');
    assert.deepEqual(text.slice(5).filter((_, i) => i % 4 === 0), ['6×', '6×', '3×', '3×', '12×', '6×', '6×']);
    const tableY = Number(table.getAttribute('transform').match(/, ([\d.]+)\)/)[1]);
    const topBottomY = 78 + (p.railHeight * 2 + p.windowHeight + p.backpanelOffsetHeightMm + p.knurledNutHeight) * 0.85
      + 68 + 18 + Math.max(0, -Math.min(0, GeometryEngine.analyze(p).z.rollFrontZ)) * 0.85
      + Math.max(p.railDepth, GeometryEngine.analyze(p).z.backpanelBackZ, GeometryEngine.analyze(p).z.rollBackZ) * 0.85 + 26;
    assert.ok(tableY > topBottomY, 'BOM must be below the horizontal section');
  }
});

test('calendar quantity input accepts whole numbers from 1 to 99 and reports invalid values', () => {
  const { UIController, document } = loadCAD();
  UIController.bindActions(document.getElementById('cad-drawing-svg'));
  const input = document.getElementById('cad-bom-qty-input');
  const help = document.getElementById('cad-bom-qty-help');
  for (const value of ['3', '99']) {
    input.value = value;
    input.listeners.input();
    assert.equal(input.validationMessage, '');
    assert.equal(help.textContent, '1 bis 99 Exemplare');
  }
  for (const value of ['', '0', '100', '1.5']) {
    input.value = value;
    input.listeners.input();
    assert.match(input.validationMessage, /zwischen 1 und 99/);
    assert.match(help.textContent, /weiterhin für 99 Exemplare/);
  }
});

test('collision status prioritizes errors, includes warnings, and reappears after dismissal', () => {
  const { ParameterStore, GeometryEngine, UIController, document } = loadCAD();
  const p = ParameterStore.getDefaults();
  const element = id => document.getElementById(`cad-${id}`);
  UIController.updateValidationUI(GeometryEngine.analyze(p));
  assert.equal(element('status-badge').hidden, false);
  assert.equal(element('warn-banner').hidden, true);
  assert.equal(element('error-overlay').hidden, true);

  UIController.updateValidationUI(GeometryEngine.analyze({ ...p, blindHoleDepth: 18 }));
  assert.equal(element('warn-banner').hidden, false);
  element('warn-banner').hidden = true;
  UIController.updateValidationUI(GeometryEngine.analyze({ ...p, blindHoleDepth: 18 }));
  assert.equal(element('warn-banner').hidden, false);

  const geom = GeometryEngine.analyze({ ...p, railDepth: 25, blindHoleDepth: 18 });
  UIController.updateValidationUI(geom);
  assert.equal(element('error-overlay').hidden, false);
  assert.equal(element('warn-banner').hidden, true);
  assert.equal(element('error-overlay-list').children.length, geom.checks.filter(c => c.level !== 'ok').length);
  assert.equal(geom.checks.find(c => c.level === 'error').paramKey, 'railDepth');
  element('error-overlay').hidden = true;
  UIController.updateValidationUI(geom);
  assert.equal(element('error-overlay').hidden, false);
});

test('collision correction opens and focuses the parameter for the first error', () => {
  const { ParameterStore, GeometryEngine, UIController, document } = loadCAD();
  const group = { open: false };
  const target = {
    closest: () => group,
    scrollIntoView() {},
    focus() { this.focused = true; }
  };
  UIController.inputMap.railDepth = { numInput: target };
  UIController.bindActions(document.getElementById('cad-drawing-svg'));
  UIController.updateValidationUI(GeometryEngine.analyze({ ...ParameterStore.getDefaults(), railDepth: 25 }));
  document.getElementById('cad-error-fix-btn').listeners.click();
  assert.equal(group.open, true);
  assert.equal(target.focused, true);
  assert.equal(document.getElementById('cad-error-overlay').hidden, true);
});
