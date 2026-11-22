const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const vm = require('node:vm');
const { generateCatalog, validatePreset } = require('../scripts/generate-preset-catalog');

const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'presets', 'genini1.json'), 'utf8'));
const example = Object.values(source)[0];

test('validates version, calendar fields, optional state and holiday snapshots', () => {
  assert.deepEqual(validatePreset(example), []);
  const invalid = structuredClone(example);
  invalid._calendarPresetVersion = 2;
  invalid.year = 2200;
  invalid.themeKey = 'missing';
  invalid.monthSeparators.single.widthMm = 0;
  invalid.bundesland = 'ZH';
  invalid.viewMode = 'other';
  invalid.holidays = [
    { id: 'one', title: 'Test', start: '2027-02-29', end: '2027-01-01', color: 'red', type: 'other' },
    { id: 'one', title: '', start: '2027-03-02', end: '2027-03-01', color: '#123456', type: 'custom' }
  ];
  invalid.unexpected = true;
  const errors = validatePreset(invalid);
  for (const field of ['_calendarPresetVersion', 'year', 'themeKey', 'monthSeparators.single.widthMm',
    'country/bundesland', 'viewMode', 'holidays[0].start', 'holidays[0].color', 'holidays[0].type',
    'holidays[1].id', 'holidays[1].title', 'holidays[1].end', 'unexpected']) {
    assert.ok(errors.some(error => error.includes(field)), field);
  }
  invalid.holidays = [];
  assert.ok(!validatePreset(invalid).some(error => error.startsWith('holidays')));
  invalid.holidays = null;
  assert.ok(validatePreset(invalid).some(error => error.startsWith('holidays')));
});

test('reports invalid files and entries while generating a deterministic usable catalog', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chronoscroll-presets-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const output = path.join(dir, 'catalog.js');
  fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify({
    'Valid <template>': example,
    Invalid: { ...example, year: '2027' }
  }));
  fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({
    'Valid <template>': example, Second: { ...example, holidays: [] }
  }));
  fs.writeFileSync(path.join(dir, 'c.json'), '{invalid');
  fs.writeFileSync(path.join(dir, 'd.json'), '[]');
  fs.writeFileSync(path.join(dir, 'ignored.txt'), 'not json');
  const diagnostics = [];
  const result = generateCatalog(dir, output, message => diagnostics.push(message));
  assert.deepEqual(result, { count: 2, invalid: 4 });
  assert.ok(diagnostics.some(message => message.includes('a.json') && message.includes('Invalid') && message.includes('year')));
  assert.ok(diagnostics.some(message => message.includes('b.json') && message.includes('bereits vorhanden')));
  assert.ok(diagnostics.some(message => message.includes('c.json') && message.includes('JSON')));
  assert.ok(diagnostics.some(message => message.includes('d.json') && message.includes('Wurzelelement')));
  const script = fs.readFileSync(output, 'utf8');
  const browser = { window: {} };
  vm.runInNewContext(script, browser);
  assert.deepEqual(Array.from(browser.window.CronoBuiltInPresets, item => item.name), ['Valid <template>', 'Second']);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.window.CronoBuiltInPresets[0].state)), example);
  generateCatalog(dir, output, () => {});
  assert.equal(fs.readFileSync(output, 'utf8'), script);
});

test('generation command exits unsuccessfully but still writes valid entries when a file is invalid', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chronoscroll-preset-command-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const folder of ['scripts', 'js', 'presets']) fs.mkdirSync(path.join(dir, folder));
  for (const file of ['scripts/generate-preset-catalog.js', 'js/themePresets.js', 'js/shareConfig.js']) {
    fs.copyFileSync(path.join(__dirname, '..', file), path.join(dir, file));
  }
  fs.writeFileSync(path.join(dir, 'presets', 'input.json'), JSON.stringify({ Good: example, Bad: { ...example, year: null } }));
  const result = spawnSync(process.execPath, [path.join(dir, 'scripts', 'generate-preset-catalog.js')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /input\.json.*Bad.*year/);
  assert.match(result.stdout, /1 Vorlagen erzeugt; 1 ungültige/);
  const browser = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'js', 'builtInPresets.js'), 'utf8'), browser);
  assert.deepEqual(Array.from(browser.window.CronoBuiltInPresets, item => item.name), ['Good']);
});
