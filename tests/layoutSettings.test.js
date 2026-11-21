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
      this.dataset = {};
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
          return this.classes.has(name);
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
      const event = {
        target: this, currentTarget: this, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, ...extra
      };
      if (this.listeners[type]) this.listeners[type](event);
      return event;
    }
    focus() {}
    querySelectorAll(selector) {
      if (selector !== '.btn-load-preset' && selector !== '.btn-delete-preset') return [];
      const matching = [];
      const visit = element => {
        if ((element.className || '').split(/\s+/).includes(selector.slice(1))) matching.push(element);
        element.children.forEach(visit);
      };
      this.children.forEach(visit);
      return matching;
    }
  }
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  get('canvas-container').clientWidth = 567 - 34;
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
    cronoscroll_v2_presets: JSON.stringify({ old: {
      monthLayout: 'single', hVisible: 32, bVisible: 50, showVacations: true,
      colorHeaderText: '#123456',
      holidays: [
        { id: 'keep', title: 'Privat', start: '2027-01-01', end: '2027-01-01', type: 'custom', color: '#123456' },
        { id: 'vac', title: 'Ferien', start: '2027-01-01', end: '2027-01-02', type: 'vacation', color: '#abcdef' }
      ]
    } }),
    cronoscroll_theme: 'sage'
  };
  const windowListeners = new Map();
  const modeChangeEvents = [];
  let currentUrl = new URL('https://example.test/');
  let latestState;
  let start;
  let copied;
  let totalRollLength = 226;
  const holidayCalls = [];
  const context = {
    TextEncoder, TextDecoder, URLSearchParams, btoa, atob,
    setTimeout: callback => callback(),
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
      location: {
        get href() { return currentUrl.href; },
        set href(value) { currentUrl = new URL(value, currentUrl); },
        get search() { return currentUrl.search; },
        set search(value) {
          const nextUrl = new URL(currentUrl);
          nextUrl.search = value;
          currentUrl = nextUrl;
        }
      },
      history: {
        replaceState(_state, _title, url) { currentUrl = new URL(url, currentUrl); }
      },
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
      getComputedStyle: () => ({ paddingLeft: '32px', paddingRight: '32px' }),
      CronoGeometry: { calculate: () => ({ bVisible: 42, hVisible: 32, lTotal: totalRollLength }) },
      CronoCanvas: { render(canvas, container, state) { latestState = structuredClone(state); } },
      CronoFonts: { hasCustomFont: () => false, loadStandardFonts: () => new Promise(() => {}) }
    }
  };
  context.URL = URL;
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
  get('btn-zoom-out').dispatch('click');
  assert.equal(latestState.zoom, 0.8);
  get('btn-zoom-in').dispatch('click');
  assert.equal(latestState.zoom, 1);
  get('btn-prev-month').dispatch('click');
  assert.equal(latestState.currentMonthIndex, 0);
  get('btn-next-month').dispatch('click');
  assert.equal(latestState.currentMonthIndex, 1);
  const tabKeyEvent = get('tab-button-style').dispatch('keydown', { key: 'ArrowRight' });
  windowListeners.get('keydown')[0](tabKeyEvent);
  assert.equal(get('tab-button-holidays').getAttribute('aria-selected'), 'true');
  assert.equal(latestState.currentMonthIndex, 1);
  windowListeners.get('keydown')[0]({ target: { tagName: 'BODY' }, key: 'ArrowRight' });
  assert.equal(latestState.currentMonthIndex, 2);
  get('btn-mode-banner').dispatch('click');
  assert.equal(latestState.viewMode, 'banner');
  get('btn-zoom-fit-banner').dispatch('click');
  assert.ok(latestState.zoom < 0.12);
  assert.ok(226 * 20 * latestState.zoom <= 567 - 34 - 64 - 16);
  const fittedZoom = latestState.zoom;
  get('btn-zoom-out').dispatch('click');
  assert.ok(latestState.zoom > 0);
  assert.ok(latestState.zoom < fittedZoom);
  get('btn-zoom-in').dispatch('click');
  assert.ok(latestState.zoom > fittedZoom);
  get('btn-zoom-fit-banner').dispatch('click');
  const wheelFitZoom = latestState.zoom;
  get('canvas-container').dispatch('wheel', { ctrlKey: true, deltaY: 1 });
  assert.ok(latestState.zoom > 0);
  assert.ok(latestState.zoom < wheelFitZoom);
  get('btn-zoom-fit-banner').dispatch('click');
  get('btn-zoom-in').dispatch('click');
  assert.ok(latestState.zoom > 0.12);
  get('btn-zoom-reset').dispatch('click');
  assert.equal(latestState.zoom, 1);
  get('canvas-container').clientWidth = 64;
  get('btn-zoom-fit-banner').dispatch('click');
  assert.equal(latestState.zoom, 1);
  get('canvas-container').clientWidth = 567 - 34;
  totalRollLength = 10000;
  get('btn-zoom-fit-banner').dispatch('click');
  assert.ok(latestState.zoom > 0);
  assert.ok(totalRollLength * 20 * latestState.zoom <= 567 - 34 - 64 - 16);
  const longRollFit = latestState.zoom;
  get('btn-zoom-out').dispatch('click');
  assert.ok(latestState.zoom < longRollFit);
  totalRollLength = 226;
  get('canvas-container').clientWidth = 10000;
  get('btn-zoom-fit-banner').dispatch('click');
  assert.equal(latestState.zoom, 1);
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
  get('btn-mode-cad').dispatch('click');
  get('btn-mode-calendar').dispatch('click');
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.windowWidth, 420);
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.windowHeight, 320);
  assert.equal(context.window.CronoScrollCADBridge.getSnapshot().dimensions.paperLength, 2260);
  assert.equal(latestState.themeKey, 'sage');
  assert.equal(latestState.paperColor, '#fcfdfa');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#d977061c');
  assert.equal(latestState.holidays.find(event => event.type === 'vacation'), undefined);
  const change = (id, value, type = 'change') => {
    const element = get(id);
    if (typeof value === 'boolean') element.checked = value;
    else element.value = value;
    element.dispatch(type);
  };
  change('checkbox-month-separator', true);
  change('input-month-separator-width', '5', 'input');
  change('color-month-separator', '#123456', 'input');
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
  assert.equal(get('color-month-separator').value, '#123456');
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
  change('select-theme', 'modern');
  assert.equal(latestState.themeKey, 'modern');
  assert.equal(get('select-theme').value, 'modern');
  change('select-theme', 'wood');
  change('color-category-public', '#abcdef', 'input');
  assert.equal(latestState.categoryColors.public, '#abcdef1c');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#abcdef1c');
  change('checkbox-show-vacations', true);
  assert.equal(latestState.holidays.find(event => event.type === 'vacation').color, '#0284c71c');
  change('color-category-vacation', '#fedcba', 'input');
  assert.equal(latestState.holidays.find(event => event.type === 'vacation').color, '#fedcba1c');
  assert.equal(latestState.holidays.find(event => event.type === 'public').color, '#abcdef1c');
  get('btn-add-holiday').dispatch('click');
  get('modal-event-title').value = 'Eigener Termin';
  get('modal-event-date-start').value = '2027-06-01';
  get('btn-modal-event-save').dispatch('click');
  assert.equal(latestState.holidays.find(event => event.type === 'custom').color, '#16a34a1c');
  change('checkbox-show-vacations', false);
  assert.ok(latestState.holidays.some(event => event.type === 'custom' && event.title === 'Eigener Termin'));
  assert.equal(latestState.holidays.some(event => event.type === 'vacation'), false);
  change('checkbox-show-vacations', true);
  assert.ok(latestState.holidays.some(event => event.type === 'custom' && event.title === 'Eigener Termin'));
  change('color-category-custom', '#123456', 'input');
  assert.equal(latestState.holidays.find(event => event.type === 'custom').color, '#1234561c');
  filters.find(button => button.getAttribute('data-filter') === 'custom').dispatch('click');
  assert.equal(get('holiday-list').children.length, 1);
  assert.equal(filters.find(button => button.getAttribute('data-filter') === 'custom').getAttribute('aria-pressed'), 'true');
  filters[0].dispatch('click');
  tabs[0].dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[1].tabIndex, 0);
  assert.equal(tabs[0].tabIndex, -1);
  change('input-h-visible', '35', 'input');
  change('input-b-visible', '50', 'input');
  change('checkbox-show-qr', false);
  change('input-qr-gap', '12', 'input');
  change('input-month-header-text-color', '#abcdef', 'input');
  change('input-calendar-week-text-color', '#fedcba', 'input');
  change('input-calendar-week-text-size', '2', 'input');
  change('input-moon-opacity', '0.2', 'input');
  get('input-preset-name').value = 'new';
  get('btn-save-preset').dispatch('click');
  const list = get('presets-list');
  const load = name => list.querySelectorAll('.btn-load-preset')
    .find(button => button.getAttribute('data-name') === name).dispatch('click');
  get('btn-mode-banner').dispatch('click');
  load('old');
  assert.equal(latestState.viewMode, 'banner');
  assert.equal(latestState.hVisible, 30);
  assert.equal(latestState.bVisible, 42);
  assert.equal(latestState.bannerCustomTitle, 'old');
  assert.equal(latestState.showVacations, false);
  assert.equal(latestState.qrEnabled, true);
  assert.equal(latestState.qrGapMm, 40);
  assert.equal(latestState.monthHeaderTextColor, '#123456');
  assert.equal(latestState.calendarWeekTextColor, '#64748b');
  assert.equal(latestState.calendarWeekTextSize, 1);
  assert.equal(latestState.moonOpacity, 0.89);
  assert.ok(latestState.holidays.some(event => event.id === 'keep'));
  assert.ok(!latestState.holidays.some(event => event.id === 'vac'));
  assert.equal(JSON.parse(storage.cronoscroll_v2_presets).old._calendarPresetVersion, 1);
  assert.equal(latestState.designStyle, 'classic');
  assert.equal(latestState.themeKey, null);
  assert.equal(latestState.monthSeparators.single.enabled, false);
  assert.equal(latestState.monthSeparators.double.enabled, false);
  load('new');
  assert.equal(latestState.hVisible, 35);
  assert.equal(latestState.bVisible, 50);
  assert.equal(latestState.qrEnabled, false);
  assert.equal(latestState.qrGapMm, 12);
  assert.equal(latestState.monthHeaderTextColor, '#abcdef');
  assert.equal(latestState.calendarWeekTextColor, '#fedcba');
  assert.equal(latestState.calendarWeekTextSize, 2);
  assert.equal(latestState.moonOpacity, 0.2);
  assert.equal(latestState.designStyle, 'zen');
  assert.equal(latestState.themeKey, 'wood');
  assert.equal(latestState.monthSeparators.single.widthMm, 5);
  assert.equal(latestState.monthSeparators.double.widthMm, 12);
  assert.equal(latestState.monthSeparators.double.header, true);
  assert.equal(latestState.categoryColors.public, '#abcdef1c');
  assert.equal(latestState.categoryColors.vacation, '#fedcba1c');
  assert.equal(latestState.categoryColors.custom, '#1234561c');
  const specialName = 'Familie "<img src=x>" & Freunde';
  get('input-preset-name').value = specialName;
  get('btn-save-preset').dispatch('click');
  const specialItem = list.children.find(item => item.children[0].textContent === specialName);
  assert.ok(specialItem);
  assert.equal(specialItem.children[0].children.length, 0);
  load(specialName);
  assert.equal(latestState.bannerCustomTitle, specialName);
  list.querySelectorAll('.btn-delete-preset')
    .find(button => button.getAttribute('data-name') === specialName).dispatch('click');
  assert.equal(JSON.parse(storage.cronoscroll_v2_presets)[specialName], undefined);
  get('input-preset-name').value = '__proto__';
  get('btn-save-preset').dispatch('click');
  load('__proto__');
  assert.equal(latestState.bannerCustomTitle, '__proto__');
  assert.ok(Object.hasOwn(JSON.parse(storage.cronoscroll_v2_presets), '__proto__'));

  change('input-custom-title', 'Familie 2027', 'input');
  const link = get('next-year-link').href;
  assert.equal(get('next-year-link').textContent, `Einstellungen für ${latestState.year + 1} teilen`);
  assert.equal(link, context.window.CronoShare.createNextYearUrl(latestState));
  await get('btn-copy-next-year-link').listeners.click();
  assert.equal(copied, link);
  assert.equal(get('next-year-link-status').textContent, 'Link kopiert.');

  context.window.location.href = `${link}&mode=calendar&tab=style&source=test#calendar`;
  tabs[0].dispatch('click');
  let updatedUrl = new URL(context.window.location.href);
  assert.equal(updatedUrl.searchParams.get('tab'), 'geometry');
  assert.equal(updatedUrl.searchParams.get('mode'), 'calendar');
  assert.equal(updatedUrl.searchParams.get('config'), new URL(link).searchParams.get('config'));
  assert.equal(updatedUrl.searchParams.get('source'), 'test');
  assert.equal(updatedUrl.hash, '#calendar');
  get('btn-mode-cad').dispatch('click');
  updatedUrl = new URL(context.window.location.href);
  assert.equal(updatedUrl.searchParams.get('mode'), 'cad');
  assert.equal(updatedUrl.searchParams.get('tab'), 'geometry');
  get('btn-mode-calendar').dispatch('click');
  updatedUrl = new URL(context.window.location.href);
  assert.equal(updatedUrl.searchParams.get('mode'), 'calendar');
  assert.equal(updatedUrl.searchParams.get('tab'), 'geometry');

  context.window.location.search = `${new URL(link).search}&mode=cad&tab=style`;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8'), context);
  start();
  assert.equal(get('app-container').classList.contains('cad-mode'), true);
  assert.equal(get('cad-mode-root').getAttribute('aria-hidden'), 'false');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(tabs.find(button => button.getAttribute('data-tab') === 'tab-style').getAttribute('aria-selected'), 'false');
  get('btn-mode-calendar').dispatch('click');
  assert.equal(get('app-container').classList.contains('cad-mode'), false);
  assert.equal(tabs.find(button => button.getAttribute('data-tab') === 'tab-style').getAttribute('aria-selected'), 'true');
  assert.equal(new URL(context.window.location.href).searchParams.get('mode'), 'calendar');
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
