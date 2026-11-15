const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
for (const file of ['geometry.js', 'holidays.js', 'themePresets.js', 'designPresets.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), context);
}
const { CronoGeometry: geometry, CronoHolidays: holidays, CronoDesigns: designs } = context.window;
const state = {
  year: 2028, bVisible: 42, hVisible: 32, pufferLeft: 15, pufferRight: 15,
  monthLayout: 'single', subColumns: 1, fontDayScale: 1, fontHeaderScale: 1,
  showKW: true, showMoon: false
};
const months = holidays.get14MonthsData(2028, [
  { title: 'Feiertag & Fest', start: '2028-02-29', end: '2028-02-29', type: 'public', color: '#ff0000' }
]);

test('all designs use the original coordinates and stay within the roll in both layouts', () => {
  for (const designStyle of designs.styles) {
    for (const monthLayout of ['single', 'double']) {
      const current = { ...state, designStyle, monthLayout };
      const geo = geometry.calculate(current);
      const commands = designs.monthCommands(current, geo, months[2], 2, 430);
      assert.equal(geo.lTotalMm, 2260);
      assert.equal(geo.hVisibleMm, 320);
      const day16 = commands.find(c => c.type === 'text' && (c.value === '16' || c.value.startsWith('16 ')));
      const position = geo.getDayPosition(16);
      assert.ok(day16.x >= 430 + position.column * geo.dayColumnWidthMm);
      assert.ok(day16.x < 430 + (position.column + 1) * geo.dayColumnWidthMm);
      assert.equal(day16.y, (position.row + 1.5) * geo.hDayMm);
      assert.ok(commands.some(c => c.type === 'text' && c.value === 'Feiertag & Fest'));
      assert.ok(commands.every(c => c.type !== 'line' ||
        (c.x1 >= 430 && c.x2 <= 570 && c.y1 >= 0 && c.y2 <= 320)));
    }
  }
});

test('design signatures include exact hairlines, inverse weekends, lanes and zen separators', () => {
  const geo = geometry.calculate(state);
  const commands = style => designs.monthCommands({ ...state, designStyle: style }, geo, months[2], 2, 0);
  const mid = commands('midcentury');
  assert.ok(mid.some(c => c.type === 'line' && Math.abs(c.width - 0.25 * 25.4 / 72) < 1e-12));
  assert.ok(mid.some(c => c.type === 'rect' && c.fill && c.y === 0));
  assert.ok(mid.some(c => c.type === 'circle' && !c.fill));
  const bauhaus = commands('bauhaus');
  assert.ok(bauhaus.some(c => c.type === 'rect' && c.fill && c.y > 0));
  assert.ok(bauhaus.some(c => c.type === 'text' && c.textColor === '#000000' && c.value === '05'));
  const gantt = commands('gantt');
  assert.ok(gantt.some(c => c.type === 'text' && c.value === 'MATERIAL'));
  assert.ok(gantt.some(c => c.type === 'line' && c.x1 === c.x2));
  assert.ok(gantt.some(c => c.type === 'rect' && !c.fill));
  const zen = commands('zen');
  assert.ok(zen.some(c => c.type === 'line' && c.dash));
  assert.ok(zen.filter(c => c.type === 'line').every(c => c.y1 === c.y2));
  assert.ok(zen.some(c => c.type === 'circle' && c.fill));
  assert.ok(!zen.some(c => c.type === 'rect'));
});

test('every theme supplies palette and font roles to all five special designs', () => {
  const geo = geometry.calculate(state);
  for (const key of context.window.CronoThemes.keys) {
    const theme = context.window.CronoThemes.themes[key];
    for (const designStyle of designs.styles) {
      const current = { ...state, designStyle };
      context.window.CronoThemes.apply(current, key);
      const commands = designs.monthCommands(current, geo, months[2], 2, 0);
      assert.equal(designs.fontKey(current), theme.fontFamily);
      assert.ok(commands.some(command => command.strokeColor === current.colorGrid));
      assert.ok(commands.some(command => command.textColor === current.colorText ||
        command.textColor === current.colorHeaderText));
      if (designStyle === 'midcentury') {
        assert.ok(commands.some(command => command.fillColor === current.colorHeaderBg));
      }
      if (designStyle === 'bauhaus') {
        assert.ok(commands.some(command => command.fillColor === current.colorSaturdayBg ||
          command.fillColor === current.colorSundayBg));
      }

      const svg = designs.svgCommands(commands, theme.fontFamily).join('');
      assert.ok(svg.includes(current.colorGrid));
      assert.ok(svg.includes(theme.fontFamily));
      const canvasFonts = [];
      designs.drawCanvas({
        save() {}, restore() {}, setLineDash() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
        fillRect() {}, strokeRect() {}, arc() {},
        fillText() { canvasFonts.push(this.font); }
      }, commands, 1, theme.fontFamily);
      assert.ok(canvasFonts.length > 0);
      assert.ok(canvasFonts.every(font => font.includes(theme.fontFamily)));

      const pdfFonts = [];
      designs.drawPdf({
        setDrawColor() {}, setFillColor() {}, setTextColor() {}, setLineWidth() {},
        setLineDashPattern() {}, line() {}, rect() {}, circle() {},
        setFont(font) { pdfFonts.push(font); }, setFontSize() {},
        getTextWidth: text => text.length, text() {}
      }, commands, theme.fontFamily);
      assert.ok(pdfFonts.length > 0);
      assert.ok(pdfFonts.every(font => font === theme.fontFamily));
    }
  }
});

test('inverse labels switch to a high-contrast color on dark theme fills', () => {
  const geo = geometry.calculate(state);
  const current = {
    ...state, designStyle: 'midcentury',
    colorHeaderBg: '#111111', colorHeaderText: '#222222'
  };
  const midcentury = designs.monthCommands(current, geo, months[2], 2, 0);
  assert.equal(midcentury.find(command => command.type === 'text').textColor, '#ffffff');

  current.designStyle = 'bauhaus';
  current.colorSaturdayBg = '#111111';
  current.colorSaturdayText = '#222222';
  const bauhaus = designs.monthCommands(current, geo, months[2], 2, 0);
  assert.ok(bauhaus.some(command => command.value === '05' && command.textColor === '#ffffff'));
});

test('very narrow split columns never produce negative text widths', () => {
  const narrow = {
    ...state, bVisible: 10, hVisible: 10, monthLayout: 'double',
    monthSeparators: { double: { enabled: true, widthMm: 20 } }
  };
  const geo = geometry.calculate(narrow);
  for (const designStyle of designs.styles) {
    const commands = designs.monthCommands({ ...narrow, designStyle }, geo, months[2], 2, 0);
    assert.ok(commands.filter(c => c.type === 'text').every(c => c.maxWidth > 0));
  }
});

test('Kursbuch counts each year independently including leap days and transition months', () => {
  const geo = geometry.calculate(state);
  const ordinal = (month, day) => {
    const commands = designs.monthCommands({ ...state, designStyle: 'kursbuch' }, geo, month, 0, 0);
    const y = (day + 0.5) * geo.hDayMm;
    return commands.find(c => c.type === 'text' && c.y === y && /^\d{3}$/.test(c.value)).value;
  };
  assert.equal(ordinal(months[0], 31), '365');
  assert.equal(ordinal(months[1], 1), '001');
  assert.equal(ordinal(months[2], 29), '060');
  assert.equal(ordinal(months[12], 31), '366');
  assert.equal(ordinal(months[13], 1), '001');
});

test('shared commands reach canvas, PDF and escaped SVG with the same coordinates', () => {
  const geo = geometry.calculate(state);
  const commands = designs.monthCommands({ ...state, designStyle: 'midcentury' }, geo, months[2], 2, 150);
  const canvasLines = [];
  let start;
  const canvas = {
    save() {}, restore() {}, setLineDash() {}, beginPath() {}, stroke() {}, fill() {},
    fillRect() {}, strokeRect() {}, arc() {}, fillText() {},
    moveTo(x, y) { start = [x, y]; },
    lineTo(x, y) { canvasLines.push([...start, x, y]); }
  };
  const pdfLines = [];
  const pdf = {
    setDrawColor() {}, setFillColor() {}, setTextColor() {}, setLineWidth() {},
    setLineDashPattern() {}, rect() {}, circle() {}, setFont() {}, setFontSize() {},
    getTextWidth: text => text.length, text() {},
    line(...args) { pdfLines.push(args); }
  };
  designs.drawCanvas(canvas, commands, 2, 'sans-serif');
  designs.drawPdf(pdf, commands, 'sans');
  assert.ok(pdfLines.length > 0);
  assert.deepEqual(canvasLines[0], pdfLines[0].map(value => value * 2));
  const svg = designs.svgCommands(commands, 'sans-serif').join('\n');
  assert.ok(svg.includes('Feiertag &amp; Fest'));
  assert.ok(svg.includes(`x1="${pdfLines[0][0]}" y1="${pdfLines[0][1]}"`));
});

test('PNG designs omit the colored viewport overlay', () => {
  let options;
  const pngContext = {
    window: {
      CronoGeometry: geometry,
      CronoDesigns: designs,
      CronoCanvas: { render(canvas, container, renderState, renderOptions) { options = renderOptions; } }
    },
    document: {
      createElement(tag) {
        return tag === 'canvas' ? { toBlob() {} } : {};
      }
    }
  };
  vm.createContext(pngContext);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/svgExport.js'), 'utf8'), pngContext);
  pngContext.window.CronoVector.exportHighResPNG({ ...state, designStyle: 'zen' });
  assert.equal(options.showViewportOverlay, false);
});
