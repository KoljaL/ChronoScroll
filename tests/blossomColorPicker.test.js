const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../js/blossomColorPicker.js'), 'utf8');

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = value;
  }
}

class FakeElement {
  constructor(name, ownerDocument) {
    this.nodeName = name.toUpperCase();
    this.nodeType = 1;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.style = new FakeStyle();
    this.className = '';
    this.value = '';
    this.type = '';
    this.id = '';
    this.disabled = false;
    this.labels = [];
    this.textContent = '';
    this.isConnectedOverride = null;
  }

  get isConnected() {
    if (this.isConnectedOverride !== null) return this.isConnectedOverride;
    let node = this;
    while (node) {
      if (node === this.ownerDocument.documentElement) return true;
      node = node.parentNode;
    }
    return false;
  }

  appendChild(child) {
    child.remove();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  insertBefore(child, reference) {
    child.remove();
    const index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);
    this.children.splice(index, 0, child);
    child.parentNode = this;
    return child;
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  removeAttribute(name) {
    if (name === 'style') Object.keys(this.style).forEach((key) => delete this.style[key]);
    delete this.attributes[name];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    this.listeners[type] = (this.listeners[type] || []).filter((item) => item !== listener);
  }

  dispatchEvent(event) {
    if (!event.target) event.target = this;
    (this.listeners[event.type] || []).forEach((listener) => listener(event));
    return true;
  }

  matches(selector) {
    return selector === 'input[type="color"]' && this.nodeName === 'INPUT' && this.type === 'color';
  }

  querySelectorAll(selector) {
    const matches = [];
    for (const child of this.children) {
      if (child.matches && child.matches(selector)) matches.push(child);
      if (child.querySelectorAll) matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  getBoundingClientRect() {
    return { left: 12, top: 34, width: 28, height: 28 };
  }
}

FakeElement.prototype.matches = function matches(selector) {
  if (selector === 'input[type="color"]') return this.nodeName === 'INPUT' && this.type === 'color';
  if (selector.startsWith('.')) {
    return typeof this.className === 'string'
      && this.className.split(/\s+/).includes(selector.slice(1));
  }
  return false;
};

function setup(populateDocument) {
  let observerCallback = null;
  const listeners = {};
  const document = {
    readyState: 'complete',
    createElement(name) {
      return new FakeElement(name, this);
    },
    querySelector(selector) {
      return this.documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return this.documentElement.querySelectorAll(selector);
    },
  };
  document.documentElement = new FakeElement('html', document);
  document.body = document.documentElement.appendChild(new FakeElement('body', document));
  if (populateDocument) populateDocument(document);

  class FakeEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = options.bubbles || false;
      this.target = null;
    }

    preventDefault() {}
    stopPropagation() {}
  }

  class FakePicker {
    static instances = [];

    constructor(container, options) {
      this.container = container;
      this.options = options;
      this.values = [];
      this.optionUpdates = [];
      this.destroyCalls = 0;
      this.toggleCalls = 0;
      this.controlledValue = options.value;
      const trigger = document.createElement('button');
      trigger.className = 'bcp-trigger-btn';
      container.appendChild(trigger);
      FakePicker.instances.push(this);
    }

    setValue(value) {
      this.values.push(value);
      this.controlledValue = value;
    }

    setOptions(options) {
      this.optionUpdates.push(options);
      if (Object.hasOwn(options, 'value')) this.controlledValue = options.value;
    }

    destroy() {
      this.destroyCalls += 1;
      this.container.children.splice(0);
    }

    toggle() {
      this.toggleCalls += 1;
    }
  }

  class FakeMutationObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe() {}
    disconnect() {}
  }

  const window = {
    Event: FakeEvent,
    BlossomColorPicker: {
      BlossomColorPicker: FakePicker,
      lightnessToSliderValue: (lightness) => 100 - lightness,
    },
    addEventListener(type, listener) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(listener);
    },
    removeEventListener(type, listener) {
      listeners[type] = (listeners[type] || []).filter((item) => item !== listener);
    },
  };
  window.window = window;
  const context = {
    window,
    document,
    Event: FakeEvent,
    MutationObserver: FakeMutationObserver,
    console,
  };
  vm.runInNewContext(script, context);
  return {
    window,
    document,
    FakePicker,
    observer(mutation) {
      observerCallback([mutation]);
    },
  };
}

function colorInput(document, id = 'color') {
  const input = document.createElement('input');
  input.type = 'color';
  input.id = id;
  input.value = '#abcdef';
  input.className = 'w-7 h-7';
  input.labels = [{ textContent: 'Kalenderfarbe' }];
  return input;
}

test('Blossom adapter initializes existing inputs and forwards picker changes', () => {
  let input;
  const ui = setup((document) => {
    input = colorInput(document);
    document.body.appendChild(input);
  });
  const appEvents = [];

  const picker = ui.FakePicker.instances[0];
  assert.ok(picker);
  assert.equal(input.value, '#abcdef');
  assert.equal(picker.options.colors.length, ui.window.CronoBlossomColorPicker.config.colors.length);
  assert.equal(picker.options.showAlphaSlider, true);
  assert.equal(picker.options.showShadeSlider, true);
  assert.equal(input.classList.contains('cronoscroll-color-input-native'), true);
  assert.equal(picker.container.listeners.pointerdown, undefined);
  picker.container.children[0].setAttribute('aria-expanded', 'true');
  picker.container.dispatchEvent(new ui.window.Event('click', { bubbles: true }));
  assert.equal(picker.container.classList.contains('is-portaled'), true);
  assert.equal(picker.container.parentNode, ui.document.body);
  picker.options.onCollapse();
  assert.equal(picker.container.classList.contains('is-portaled'), false);

  input.addEventListener('input', (event) => appEvents.push(event.type));
  input.addEventListener('change', (event) => appEvents.push(event.type));
  picker.options.onChange({ hex: '#123ABC' });
  picker.options.onChangeComplete({ hex: '#123ABC' });
  assert.equal(input.value, '#123abc');
  assert.deepEqual(appEvents, ['input', 'change']);
});

test('Blossom adapter synchronizes external state and disabled inputs', () => {
  const ui = setup();
  const input = colorInput(ui.document);
  ui.document.body.appendChild(input);
  ui.window.CronoBlossomColorPicker.sync(input);
  const picker = ui.FakePicker.instances[0];

  input.value = '#010203';
  input.disabled = true;
  ui.window.CronoBlossomColorPicker.sync(input);

  assert.equal(picker.values.at(-1).alpha, 100);
  assert.equal(picker.optionUpdates.at(-1).disabled, true);
  assert.equal(Object.hasOwn(picker.optionUpdates.at(-1), 'value'), true);
  assert.equal(picker.optionUpdates.at(-1).value, undefined);
  assert.equal(picker.controlledValue, undefined);
  assert.equal(picker.values.at(-1).lightness > 0, true);
});

test('Blossom adapter discovers future color inputs and destroys removed instances', () => {
  const ui = setup();
  const item = ui.document.createElement('div');
  const input = colorInput(ui.document, 'future-color');
  item.appendChild(input);
  ui.document.body.appendChild(item);
  ui.observer({ type: 'childList', addedNodes: [item], removedNodes: [] });

  const picker = ui.FakePicker.instances[0];
  assert.ok(picker);
  ui.observer({
    type: 'childList',
    addedNodes: [input],
    removedNodes: [input],
  });
  assert.equal(picker.destroyCalls, 0);
  assert.equal(ui.FakePicker.instances.length, 1);

  item.remove();
  ui.observer({ type: 'childList', addedNodes: [], removedNodes: [item] });
  assert.equal(picker.destroyCalls, 1);
  assert.equal(input.classList.contains('cronoscroll-color-input-native'), false);
  assert.equal(ui.window.CronoBlossomColorPicker.config.options.adaptivePositioning, true);
});

test('Blossom adapter moves an existing picker when its native input is moved', () => {
  const ui = setup();
  const originalParent = ui.document.createElement('div');
  const nextParent = ui.document.createElement('div');
  const input = colorInput(ui.document);
  originalParent.appendChild(input);
  ui.document.body.appendChild(originalParent);
  ui.document.body.appendChild(nextParent);
  ui.window.CronoBlossomColorPicker.sync(input);
  const picker = ui.FakePicker.instances[0];

  nextParent.appendChild(input);
  ui.observer({ type: 'childList', addedNodes: [], removedNodes: [input] });
  ui.observer({ type: 'childList', addedNodes: [input], removedNodes: [] });

  assert.equal(picker.destroyCalls, 1);
  assert.equal(ui.FakePicker.instances.length, 2);
  assert.equal(input.parentNode.className, 'cronoscroll-color-picker');
  assert.equal(input.parentNode.parentNode, nextParent);
});

test('Blossom adapter cleans up when an initialized input is no longer a color field', () => {
  const ui = setup();
  const input = colorInput(ui.document);
  ui.document.body.appendChild(input);
  ui.window.CronoBlossomColorPicker.sync(input);
  const picker = ui.FakePicker.instances[0];

  input.type = 'text';
  ui.observer({ type: 'attributes', target: input, attributeName: 'type' });

  assert.equal(picker.destroyCalls, 1);
  assert.equal(input.classList.contains('cronoscroll-color-input-native'), false);
});
