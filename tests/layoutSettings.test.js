const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('header controls, separator settings and next-year links update correctly', async () => {
  class Element {
    constructor() {
      this.value = '';
      this.checked = false;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.options = [];
      this.style = {};
      this.classList = {
        classes: new Set(),
        add(...names) { names.forEach(name => this.classes.add(name)); },
        remove(...names) { names.forEach(name => this.classes.delete(name)); },
        contains(name) { return this.classes.has(name); },
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
    contains(element) { return element === this; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    getAttribute(name) { return this.attributes[name]; }
    get valueAsNumber() { return this.value === '' ? NaN : Number(this.value); }
    dispatch(type, extra = {}) {
      if (this.listeners[type]) this.listeners[type]({
        target: this, currentTarget: this, preventDefault() {}, ...extra
      });
    }
    focus() {}
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
  get('select-design-style').options = [
    ['classic', 'Klassisch (frei gestaltbar)'],
    ['midcentury', 'Mid-Century – Labor & Messinstrument'],
    ['bauhaus', 'Bauhaus / Schweizer Typografie'],
    ['gantt', 'Gantt – Projekt-Timeline'],
    ['zen', 'Zen – minimalistischer Streifen'],
    ['kursbuch', 'Kursbuch – Fahrplan']
  ].map(([value, textContent]) => ({ value, textContent }));
  const tabNames = ['geometry', 'layout', 'style', 'holidays', 'presets'];
  const tabs = tabNames.map((name, index) => {
    const tab = get(`tab-button-${name}`);
    tab.setAttribute('data-tab', `tab-${name}`);
    tab.setAttribute('aria-selected', String(index === 0));
    return tab;
  });
  const appModeButtons = ['calendar', 'cad'].map((mode, index) => {
    const button = get(`btn-mode-${mode}`);
    button.setAttribute('data-app-mode', mode);
    button.setAttribute('aria-pressed', String(index === 0));
    return button;
  });
  const panels = tabNames.map(name => get(`tab-${name}`));
  const filters = ['all', 'public', 'vacation', 'custom'].map((filter, index) => {
    const button = get(`filter-${filter}`);
    button.setAttribute('data-filter', filter);
    button.setAttribute('aria-pressed', String(index === 0));
    return button;
  });
  const storage = {
    cronoscroll_v2_presets: JSON.stringify({ old: { monthLayout: 'single' } }),
    cronoscroll_theme: 'sage'
  };
  const windowListeners = new Map();
  const modeChangeEvents = [];
  let latestState;
  let start;
  let copied;
  const holidayCalls = [];
  const context = {
    TextEncoder, TextDecoder, URLSearchParams, btoa, atob,
    navigator: { clipboard: { async writeText(text) { copied = text; } } },
    document: {
      getElementById: get,
      addEventListener() {},
      createElement: () => new Element(),
      querySelectorAll: selector => {
        if (selector === '[data-app-mode]') return appModeButtons;
        if (selector === '.theme-pill') return get('theme-options').children;
        if (selector === '.design-card') return get('design-options').children;
        if (selector === '.tab-btn') return tabs;
        if (selector === '.tab-content') return panels;
        if (selector === '.btn-filter-holiday') return filters;
        return [];
      }
    },
    Option: class {},
    Event: class { constructor(type) { this.type = type; } },
    localStorage: {
      getItem: key => storage[key],
      setItem: (key, value) => { storage[key] = value; }
    },
    window: {
      location: { search: '' },
      addEventListener(type, fn) {
        if (type === 'DOMContentLoaded') start = fn;
        else windowListeners.set(type, [...(windowListeners.get(type) || []), fn]);
      },
      dispatchEvent(event) {
        if (event.type === 'cronoscroll:modechange') modeChangeEvents.push(event.type);
        (windowListeners.get(event.type) || []).forEach(listener => listener(event));
        return true;
      },
      CronoHolidays: {
        get14MonthsData: () => [],
        getDACHHolidays: (...args) => {
          holidayCalls.push(args);
          const year = args[0];
          return [{ id: `public-${year}`, title: 'Feiertag', start: `${year}-01-01`, end: `${year}-01-01`, color: '#000000', type: 'public' }];
        },
        getSchoolVacations: year => [
          { id: `vacation-${year}`, title: 'Ferien', start: `${year}-07-01`, end: `${year}-07-07`, color: '#000000', type: 'vacation' }
        ]
      },
      CronoGeometry: { calculate: () => ({ bVisible: 42, hVisible: 32, lTotal: 226 }) },
      CronoCanvas: { render(canvas, container, state) { latestState = structuredClone(state); } },
      CronoFonts: { hasCustomFont: () => false, loadStandardFonts: () => new Promise(() => {}) }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/themePresets.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/shareConfig.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), context);
  context.window.location.search = '?mode=calendar&tab=style';
  start();
  assert.equal(appModeButtons.find(button => button.getAttribute('data-app-mode') === 'calendar').getAttribute('aria-pressed'), 'true');
  assert.equal(tabs.find(button => button.getAttribute('data-tab') === 'tab-style').getAttribute('aria-selected'), 'true');
  get('btn-zoom-in').dispatch('click');
  assert.equal(latestState.zoom, 1.2);
  get('btn-zoom-reset').dispatch('click');
  assert.equal(latestState.zoom, 1);
  get('btn-prev-month').dispatch('click');
  assert.equal(latestState.currentMonthIndex, 0);
  get('btn-next-month').dispatch('click');
  assert.equal(latestState.currentMonthIndex, 1);
  get('btn-mode-banner').dispatch('click');
  assert.equal(latestState.viewMode, 'banner');
  get('btn-mode-plate').dispatch('click');
  assert.equal(latestState.viewMode, 'plate');
  const calendarMenu = get('calendar-export-menu');
  calendarMenu.hidden = true;
  const calendarMenuToggle = get('calendar-export-menu-toggle');
  calendarMenuToggle.dispatch('click');
  assert.equal(calendarMenu.hidden, false);
  assert.equal(calendarMenuToggle.getAttribute('aria-expanded'), 'true');
  calendarMenuToggle.dispatch('keydown', { key: 'Escape' });
  assert.equal(calendarMenu.hidden, true);
  assert.equal(calendarMenuToggle.getAttribute('aria-expanded'), 'false');
  get('btn-mode-cad').dispatch('click');
  assert.equal(get('app-container').classList.contains('cad-mode'), true);
  assert.equal(get('cad-mode-root').getAttribute('aria-hidden'), 'false');
  assert.equal(modeChangeEvents.length, 2);
  const activeMonth = latestState.currentMonthIndex;
  windowListeners.get('keydown')[0]({ target: { tagName: 'BODY' }, key: 'ArrowLeft' });
  assert.equal(latestState.currentMonthIndex, activeMonth);
  get('btn-mode-calendar').dispatch('click');
  assert.equal(get('app-container').classList.contains('cad-mode'), false);
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.windowWidth, 420);
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.windowHeight, 320);
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.paperLength, 2260);
  assert.equal(latestState.themeKey, 'sage');
  assert.equal(latestState.paperColor, '#fcfdfa');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#fef08a');
  assert.equal(latestState.holidays.find(event => event.type === 'vacation').color, '#bfdbfe');
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
  change('select-design-style', 'zen');
  assert.equal(storage.cronoscroll_design_style, 'zen');
  const zenCard = get('design-options').children.find(button => button.getAttribute('data-design-style') === 'zen');
  assert.equal(zenCard.getAttribute('aria-pressed'), 'true');
  zenCard.dispatch('click');
  assert.equal(latestState.designStyle, 'zen');
  get('theme-options').children.find(button => button.getAttribute('data-theme') === 'wood').dispatch('click');
  assert.equal(latestState.designStyle, 'zen');
  assert.equal(latestState.themeKey, 'wood');
  assert.equal(latestState.paperColor, '#fdfbf7');
  assert.equal(storage.cronoscroll_theme, 'wood');
  change('color-category-public', '#abcdef', 'input');
  assert.equal(latestState.categoryColors.public, '#abcdef');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#abcdef');
  assert.equal(latestState.holidays.find(event => event.type === 'vacation').color, '#bfdbfe');
  change('color-category-vacation', '#fedcba', 'input');
  assert.equal(latestState.holidays.find(event => event.type === 'vacation').color, '#fedcba');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#abcdef');
  get('btn-add-holiday').dispatch('click');
  get('modal-event-title').value = 'Eigener Termin';
  get('modal-event-date-start').value = '2027-06-01';
  get('btn-modal-event-save').dispatch('click');
  assert.equal(latestState.holidays.find(event => event.type === 'custom').color, '#bfdbfe');
  change('color-category-custom', '#123456', 'input');
  assert.equal(latestState.holidays.find(event => event.type === 'custom').color, '#123456');
  filters.find(button => button.getAttribute('data-filter') === 'custom').dispatch('click');
  assert.equal(get('holiday-list').children.length, 1);
  assert.equal(filters.find(button => button.getAttribute('data-filter') === 'custom').getAttribute('aria-pressed'), 'true');
  filters[0].dispatch('click');
  tabs[0].dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[1].tabIndex, 0);
  assert.equal(tabs[0].tabIndex, -1);
  get('input-preset-name').value = 'new';
  get('btn-save-preset').dispatch('click');
  const list = get('presets-list');
  const load = name => list.querySelectorAll('.btn-load-preset')
    .find(button => button.getAttribute('data-name') === name).dispatch('click');
  load('old');
  assert.equal(latestState.designStyle, 'classic');
  assert.equal(latestState.themeKey, null);
  assert.equal(latestState.monthSeparators.single.enabled, false);
  assert.equal(latestState.monthSeparators.double.enabled, false);
  load('new');
  assert.equal(latestState.designStyle, 'zen');
  assert.equal(latestState.themeKey, 'wood');
  assert.equal(latestState.monthSeparators.single.widthMm, 5);
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  assert.equal(latestState.monthSeparators.double.header, true);
  assert.equal(latestState.categoryColors.public, '#abcdef');
  assert.equal(latestState.categoryColors.vacation, '#fedcba');
  assert.equal(latestState.categoryColors.custom, '#123456');

  change('input-custom-title', 'Familie 2027', 'input');
  const link = get('next-year-link').href;
  assert.equal(get('next-year-link').textContent, link);
  assert.equal(link, context.window.CronoShare.createNextYearUrl(latestState));
  await get('btn-copy-next-year-link').listeners.click();
  assert.equal(copied, link);
  assert.equal(get('next-year-link-status').textContent, 'Link kopiert.');

  tabs[0].dispatch('click');
  context.window.location.search = `${new URL(link).search}&mode=cad&tab=style`;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), context);
  start();
  assert.equal(get('app-container').classList.contains('cad-mode'), true);
  assert.equal(get('cad-mode-root').getAttribute('aria-hidden'), 'false');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(tabs.find(button => button.getAttribute('data-tab') === 'tab-style').getAttribute('aria-selected'), 'false');
  assert.equal(latestState.year, 2028);
  assert.equal(latestState.bannerCustomTitle, 'Familie 2028');
  assert.equal(latestState.designStyle, 'zen');
  assert.equal(latestState.themeKey, 'wood');
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  assert.deepEqual(holidayCalls.at(-1), [2028, 'DE', 'NW']);

  context.window.location.search = `${new URL(link).search}&mode=calendar&tab=holidays`;
  start();
  assert.equal(get('app-container').classList.contains('cad-mode'), false);
  assert.equal(tabs.find(button => button.getAttribute('data-tab') === 'tab-holidays').getAttribute('aria-selected'), 'true');
  assert.equal(latestState.year, 2028);

  for (const tab of tabNames) {
    context.window.location.search = `?mode=calendar&tab=${tab}`;
    start();
    assert.equal(tabs.find(button => button.getAttribute('data-tab') === `tab-${tab}`).getAttribute('aria-selected'), 'true');
  }

  tabs[0].dispatch('click');
  get('btn-mode-calendar').dispatch('click');
  context.window.location.search = '?mode=unknown&tab=unknown';
  start();
  assert.equal(get('app-container').classList.contains('cad-mode'), false);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
});
