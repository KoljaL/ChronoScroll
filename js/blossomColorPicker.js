(function () {
  'use strict';

  const CONFIG = Object.freeze({
    colors: Object.freeze([
      '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#0f172a',
      '#fef08a', '#fed7aa', '#fecaca', '#fbcfe8', '#e9d5ff', '#ddd6fe',
      '#bfdbfe', '#bae6fd', '#a7f3d0', '#bbf7d0', '#86efac', '#fde68a',
    ]),
    sizes: Object.freeze({
      default: 28,
      compact: 20,
      modal: 32,
      petal: 30,
    }),
    options: Object.freeze({
      animationDuration: 180,
      openOnHover: false,
      initialExpanded: false,
      showAlphaSlider: false,
      showShadeSlider: true,
      showCoreColor: true,
      adaptivePositioning: true,
      circularBarWidth: 10,
      sliderWidth: 10,
      sliderOffset: 22,
      petalShape: 'sakura',
      petalStyle: 'veined',
      collapsible: true,
    }),
  });

  const records = new Map();
  let observer = null;
  let ready = false;

  function blossomApi() {
    const api = window.BlossomColorPicker;
    return api && (api.BlossomColorPicker || api.default);
  }

  function normalizeHex(value) {
    const match = /^#([0-9a-f]{6})$/i.exec(value || '');
    return match ? `#${match[1].toLowerCase()}` : '#000000';
  }

  function hexToHsl(hex) {
    const normalized = normalizeHex(hex).slice(1);
    const red = parseInt(normalized.slice(0, 2), 16) / 255;
    const green = parseInt(normalized.slice(2, 4), 16) / 255;
    const blue = parseInt(normalized.slice(4, 6), 16) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;

    if (delta) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
      if (max === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (max === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
    }

    if (hue < 0) hue += 360;
    return {
      hue,
      saturation: saturation * 100,
      lightness: lightness * 100,
    };
  }

  function pickerValue(hex) {
    const hsl = hexToHsl(hex);
    const toSlider = window.BlossomColorPicker && window.BlossomColorPicker.lightnessToSliderValue;
    const slider = typeof toSlider === 'function'
      ? toSlider(hsl.lightness)
      : (100 - Math.max(20, Math.min(100, hsl.lightness))) / 80 * 100;
    return {
      hue: hsl.hue,
      saturation: slider,
      originalSaturation: hsl.saturation,
      lightness: hsl.lightness,
      alpha: 100,
      layer: hsl.lightness >= 80 ? 'inner' : 'outer',
    };
  }

  function sizeFor(input) {
    const className = typeof input.className === 'string' ? input.className : '';
    if (/(?:^|\s)w-5(?:\s|$)/.test(className)) return CONFIG.sizes.compact;
    if (/(?:^|\s)w-8(?:\s|$)/.test(className)) return CONFIG.sizes.modal;
    return CONFIG.sizes.default;
  }

  function labelFor(input) {
    const explicit = input.getAttribute('aria-label') || input.getAttribute('title');
    if (explicit) return explicit;
    if (input.labels && input.labels.length) {
      const text = Array.from(input.labels).map((label) => label.textContent.trim()).find(Boolean);
      if (text) return text;
    }
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label && label.textContent.trim()) return label.textContent.trim();
    }
    return 'Farbe auswählen';
  }

  function isConnected(record) {
    return record.input && record.input.isConnected && record.input.type === 'color';
  }

  function positionPortal(record) {
    if (!record.portaled) return;
    const rect = record.placeholder.getBoundingClientRect();
    record.host.style.left = `${rect.left}px`;
    record.host.style.top = `${rect.top}px`;
    record.host.style.width = `${record.size}px`;
    record.host.style.height = `${record.size}px`;
  }

  function openPortal(record) {
    if (!isConnected(record) || record.input.disabled) return;
    if (!record.portaled) {
      const rect = record.placeholder.getBoundingClientRect();
      record.portaled = true;
      document.body.appendChild(record.host);
      record.host.classList.add('is-portaled');
      record.host.style.left = `${rect.left}px`;
      record.host.style.top = `${rect.top}px`;
    }
    positionPortal(record);
  }

  function closePortal(record) {
    if (!record.portaled) return;
    record.portaled = false;
    record.host.classList.remove('is-portaled');
    record.host.removeAttribute('style');
    record.host.style.width = `${record.size}px`;
    record.host.style.height = `${record.size}px`;
    if (record.placeholder.isConnected) record.placeholder.appendChild(record.host);
  }

  function dispatchColorEvent(record, type) {
    const options = { bubbles: true };
    const event = typeof window.Event === 'function'
      ? new window.Event(type, options)
      : new Event(type, options);
    record.input.dispatchEvent(event);
  }

  function updateInputFromPicker(record, color) {
    if (!color || !color.hex) return;
    const value = normalizeHex(color.hex);
    record.syncing = true;
    record.input.value = value;
    dispatchColorEvent(record, 'input');
    record.syncing = false;
  }

  function completePickerChange(record, color) {
    const value = color && color.hex ? normalizeHex(color.hex) : '';
    if (value && value !== record.input.value) updateInputFromPicker(record, { hex: value });
    dispatchColorEvent(record, 'change');
  }

  function syncRecord(record) {
    if (!isConnected(record)) {
      destroyRecord(record.input);
      return;
    }
    const value = normalizeHex(record.input.value);
    if (record.input.value !== value) record.input.value = value;
    record.label = labelFor(record.input);
    record.host.setAttribute('aria-label', record.label);
    record.host.title = record.label;
    record.placeholder.style.setProperty('--blossom-picker-size', `${record.size}px`);
    record.syncing = true;
    record.picker.setValue(pickerValue(value));
    record.picker.setOptions({ value: undefined, disabled: !!record.input.disabled });
    record.syncing = false;
    const trigger = record.host.querySelector('.bcp-trigger-btn');
    if (trigger) {
      trigger.setAttribute('aria-label', `${record.label}: ${value}`);
      trigger.title = `${record.label}: ${value}`;
      trigger.setAttribute('aria-disabled', String(!!record.input.disabled));
    }
    if (record.portaled) positionPortal(record);
  }

  function createRecord(input) {
    if (!input || input.type !== 'color' || records.has(input)) return null;
    const Picker = blossomApi();
    if (!Picker || typeof Picker !== 'function') {
      throw new Error('BlossomColorPicker wurde nicht geladen.');
    }

    const size = sizeFor(input);
    const placeholder = document.createElement('span');
    placeholder.className = 'cronoscroll-color-picker';
    placeholder.style.setProperty('--blossom-picker-size', `${size}px`);
    const host = document.createElement('span');
    host.className = 'cronoscroll-blossom-host';
    host.style.width = `${size}px`;
    host.style.height = `${size}px`;
    host.setAttribute('data-blossom-color-picker', '');

    input.parentNode.insertBefore(placeholder, input);
    input.classList.add('cronoscroll-color-input-native');
    input.dataset.blossomPicker = 'true';
    placeholder.appendChild(input);
    placeholder.appendChild(host);

    const record = {
      input,
      placeholder,
      host,
      picker: null,
      size,
      label: labelFor(input),
      syncing: false,
      portaled: false,
      nativeInput: null,
      nativeClick: null,
      nativeKeydown: null,
      hostClick: null,
    };

    record.nativeInput = () => {
      if (!record.syncing) syncRecord(record);
    };
    record.nativeClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPortal(record);
      record.picker.toggle();
    };
    record.nativeKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openPortal(record);
      record.picker.toggle();
    };
    record.hostClick = (event) => {
      const trigger = host.querySelector('.bcp-trigger-btn');
      if (trigger && trigger.getAttribute('aria-expanded') === 'true') openPortal(record);
      else closePortal(record);
      event.preventDefault();
      event.stopPropagation();
    };

    record.picker = new Picker(host, {
      ...CONFIG.options,
      colors: [...CONFIG.colors],
      coreSize: size,
      petalSize: CONFIG.sizes.petal,
      defaultValue: pickerValue(input.value),
      onChange: (color) => {
        if (!record.syncing) updateInputFromPicker(record, color);
      },
      onChangeComplete: (color) => {
        if (!record.syncing) completePickerChange(record, color);
      },
      onCollapse: () => closePortal(record),
      disabled: !!input.disabled,
    });
    records.set(input, record);
    input.addEventListener('input', record.nativeInput);
    input.addEventListener('click', record.nativeClick);
    input.addEventListener('keydown', record.nativeKeydown);
    host.addEventListener('click', record.hostClick);
    syncRecord(record);
    return record;
  }

  function initNode(root) {
    if (!root) return [];
    const inputs = [];
    if (root.matches && root.matches('input[type="color"]')) inputs.push(root);
    if (root.querySelectorAll) {
      inputs.push(...Array.from(root.querySelectorAll('input[type="color"]')));
    }
    return inputs.map(createRecord).filter(Boolean);
  }

  function destroyRecord(input) {
    const record = records.get(input);
    if (!record) return;
    records.delete(input);
    closePortal(record);
    record.picker.destroy();
    input.removeEventListener('input', record.nativeInput);
    input.removeEventListener('click', record.nativeClick);
    input.removeEventListener('keydown', record.nativeKeydown);
    record.host.removeEventListener('click', record.hostClick);
    delete input.dataset.blossomPicker;
    input.classList.remove('cronoscroll-color-input-native');
    const parent = record.placeholder.parentNode;
    if (input.parentNode === record.placeholder && parent) {
      parent.insertBefore(input, record.placeholder);
    }
    record.host.remove();
    record.placeholder.remove();
  }

  function destroyRemovedInput(input) {
    const record = records.get(input);
    if (record && input.isConnected && input.parentNode === record.placeholder) return;
    destroyRecord(input);
  }

  function destroyInNode(node) {
    if (!node || node.nodeType === 3) return;
    if (node.matches && node.matches('input[type="color"]')) destroyRemovedInput(node);
    if (node.querySelectorAll) {
      Array.from(node.querySelectorAll('input[type="color"]')).forEach(destroyRemovedInput);
    }
  }

  function sync(root) {
    if (!ready) return init(root);
    if (root) {
      initNode(root);
      if (root.matches && root.matches('input[type="color"]') && records.has(root)) syncRecord(records.get(root));
      if (root.querySelectorAll) {
        root.querySelectorAll('input[type="color"]').forEach((input) => {
          if (records.has(input)) syncRecord(records.get(input));
        });
      }
      return;
    }
    records.forEach(syncRecord);
  }

  function positionAll() {
    records.forEach(positionPortal);
  }

  function observeMutations(mutations) {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        if (records.has(mutation.target) && mutation.target.type !== 'color') {
          destroyRecord(mutation.target);
        } else if (mutation.target.matches && mutation.target.matches('input[type="color"]')) {
          initNode(mutation.target);
          sync(mutation.target);
        }
        return;
      }
      mutation.removedNodes.forEach(destroyInNode);
      mutation.addedNodes.forEach(initNode);
    });
  }

  function init(root) {
    if (ready) return sync(root);
    const Picker = blossomApi();
    if (!Picker) throw new Error('BlossomColorPicker wurde nicht geladen.');
    ready = true;
    initNode(root || document);
    observer = new MutationObserver(observeMutations);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-label', 'class', 'type', 'value'],
    });
    window.addEventListener('resize', positionAll);
    window.addEventListener('scroll', positionAll, true);
  }

  function destroy() {
    if (observer) observer.disconnect();
    observer = null;
    window.removeEventListener('resize', positionAll);
    window.removeEventListener('scroll', positionAll, true);
    Array.from(records.keys()).forEach(destroyRecord);
    ready = false;
  }

  window.CronoBlossomColorPicker = Object.freeze({
    config: CONFIG,
    init,
    sync,
    destroy,
  });

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
})();
