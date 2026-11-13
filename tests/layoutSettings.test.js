const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('separator settings and next-year links update and restore before holidays load', async () => {
  class Element {
    constructor() {
      this.value = '';
      this.checked = false;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.classList = {
        classes: new Set(),
        add(...names) { names.forEach(name => this.classes.add(name)); },
        remove(...names) { names.forEach(name => this.classes.delete(name)); },
        toggle(name, force) {
          if (force === undefined ? !this.classes.has(name) : force) this.classes.add(name);
          else this.classes.delete(name);
        }
      };
    }
    set innerHTML(value) { this.html = value; this.children = []; this.queries = {}; }
    add() {}
    appendChild(child) { this.children.push(child); }
    addEventListener(type, fn) { this.listeners[type] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    getAttribute(name) { return this.attributes[name]; }
    get valueAsNumber() { return this.value === '' ? NaN : Number(this.value); }
    dispatch(type) { this.listeners[type]({ target: this, currentTarget: this }); }
    querySelectorAll(selector) {
      if (selector !== '.btn-load-preset' && selector !== '.btn-delete-preset') return [];
      if (this.queries[selector]) return this.queries[selector];
      this.queries[selector] = this.children.map(child => {
        const button = new Element();
        button.attributes['data-name'] = child.html.match(/data-name="([^"]+)"/)[1];
        return button;
      });
      return this.queries[selector];
    }
  }
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const storage = { cronoscroll_v2_presets: JSON.stringify({ old: { monthLayout: 'single' } }) };
  let latestState;
  let start;
  let copied;
  const holidayCalls = [];
  const context = {
    TextEncoder, TextDecoder, URLSearchParams, btoa, atob,
    navigator: { clipboard: { async writeText(text) { copied = text; } } },
    document: {
      getElementById: get,
      createElement: () => new Element(),
      querySelectorAll: () => []
    },
    Option: class {},
    localStorage: {
      getItem: key => storage[key],
      setItem: (key, value) => { storage[key] = value; }
    },
    window: {
      location: { search: '' },
      addEventListener(type, fn) { if (type === 'DOMContentLoaded') start = fn; },
      CronoHolidays: {
        getDACHHolidays: (...args) => { holidayCalls.push(args); return []; },
        getSchoolVacations: () => []
      },
      CronoCanvas: { render(canvas, container, state) { latestState = structuredClone(state); } },
      CronoFonts: { hasCustomFont: () => false, loadStandardFonts: () => new Promise(() => {}) }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/shareConfig.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), context);
  start();
  const change = (id, value, type = 'change') => {
    const element = get(id);
    if (typeof value === 'boolean') element.checked = value;
    else element.value = value;
    element.dispatch(type);
  };
  change('checkbox-month-separator', true);
  change('input-month-separator-width', '5', 'input');
  change('select-month-separator-color', 'paper');
  change('select-month-layout', 'double');
  assert.equal(get('checkbox-month-separator').checked, false);
  change('checkbox-month-separator', true);
  change('input-month-separator-width', '12', 'input');
  change('checkbox-month-separator-header', true);
  change('input-month-separator-width', '21', 'input');
  assert.equal(get('input-month-separator-width').attributes['aria-invalid'], 'true');
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  change('select-month-layout', 'single');
  assert.equal(get('input-month-separator-width').value, 5);
  assert.equal(get('select-month-separator-color').value, 'paper');
  get('input-preset-name').value = 'new';
  get('btn-save-preset').dispatch('click');
  const list = get('presets-list');
  const load = name => list.querySelectorAll('.btn-load-preset')
    .find(button => button.getAttribute('data-name') === name).dispatch('click');
  load('old');
  assert.equal(latestState.monthSeparators.single.enabled, false);
  assert.equal(latestState.monthSeparators.double.enabled, false);
  load('new');
  assert.equal(latestState.monthSeparators.single.widthMm, 5);
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  assert.equal(latestState.monthSeparators.double.header, true);

  change('input-custom-title', 'Familie 2027', 'input');
  const link = get('next-year-link').href;
  assert.equal(get('next-year-link').textContent, link);
  assert.equal(link, context.window.CronoShare.createNextYearUrl(latestState));
  await get('btn-copy-next-year-link').listeners.click();
  assert.equal(copied, link);
  assert.equal(get('next-year-link-status').textContent, 'Link kopiert.');

  context.window.location.search = new URL(link).search;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), context);
  start();
  assert.equal(latestState.year, 2028);
  assert.equal(latestState.bannerCustomTitle, 'Familie 2028');
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  assert.deepEqual(holidayCalls.at(-1), [2028, 'DE', 'NW']);
});
