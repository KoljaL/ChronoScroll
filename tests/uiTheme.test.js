const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../js/uiTheme.js'), 'utf8');

function createTheme({ saved = null, dark = false, failSave = false } = {}) {
  const listeners = {};
  const attributes = {};
  const classes = new Set();
  const storage = {};
  const alerts = [];
  const media = {
    matches: dark,
    addEventListener(type, listener) { listeners.media = listener; }
  };
  const button = {
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      }
    },
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener(type, listener) { listeners[type] = listener; }
  };
  const document = {
    documentElement: { dataset: {} },
    getElementById() { return button; }
  };
  const window = {
    matchMedia() { return media; },
    addEventListener(type, listener) { listeners[type] = listener; },
    alert(message) { alerts.push(message); }
  };
  const localStorage = {
    getItem() { return saved; },
    setItem(key, value) {
      if (failSave) throw new Error('storage unavailable');
      storage[key] = value;
    }
  };
  vm.runInNewContext(script, {
    document, window, localStorage, console: { warn() {}, error() {} }
  });
  listeners.DOMContentLoaded();
  return { document, media, listeners, attributes, classes, storage, alerts };
}

test('system theme is followed until a manual choice is saved', () => {
  const ui = createTheme();
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'light');
  ui.media.matches = true;
  ui.listeners.media();
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'dark');
  assert.equal(ui.attributes['aria-pressed'], 'true');
  assert.equal(ui.classes.has('is-dark'), true);

  ui.listeners.click();
  assert.equal(ui.storage.cronoscroll_ui_theme, 'light');
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'light');
  ui.media.matches = false;
  ui.listeners.media();
  ui.media.matches = true;
  ui.listeners.media();
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'light');
});

test('saved choice overrides system preference and controls the toggle', () => {
  const ui = createTheme({ saved: 'dark', dark: false });
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'dark');
  assert.equal(ui.attributes['aria-pressed'], 'true');
  ui.listeners.click();
  assert.equal(ui.storage.cronoscroll_ui_theme, 'light');
  assert.equal(ui.attributes['aria-pressed'], 'false');
});

test('storage failure keeps the chosen theme and notifies the user', () => {
  const ui = createTheme({ failSave: true });
  ui.listeners.click();
  assert.equal(ui.document.documentElement.dataset.uiTheme, 'dark');
  assert.equal(ui.alerts.length, 1);
});
