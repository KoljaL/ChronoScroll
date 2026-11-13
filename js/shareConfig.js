window.CronoShare = (function() {
  'use strict';

  const baseUrl = 'https://koljal.github.io/ChronoScroll/';
  const regions = {
    DE: ['NW', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    AT: ['W', 'B', 'K', 'NOE', 'OOE', 'S', 'ST', 'T', 'V'],
    CH: ['ZH', 'BE', 'LU', 'BS', 'BL', 'SG', 'GR', 'AG', 'GE']
  };
  const number = (min, max, integer = false) => value =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max &&
    (!integer || Number.isInteger(value));
  const choice = (...values) => value => values.includes(value);
  const color = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const boolean = value => typeof value === 'boolean';
  const fields = [
    ['year', number(1900, 2100, true)],
    ['hVisible', number(10, 150)], ['bVisible', number(15, 200)],
    ['pufferLeft', number(0, 100)], ['pufferRight', number(0, 100)],
    ['pufferLeftContent', choice('blank', 'title', 'year_overview', 'notes')],
    ['pufferRightContent', choice('blank', 'notes')],
    ['bannerCustomTitle', value => typeof value === 'string' && value.length <= 500],
    ['monthLayout', choice('single', 'double')],
    ['subColumns', number(1, 4, true)], ['guideLinesCount', number(0, 3, true)],
    ['guideLinesStyle', choice('dashed', 'dotted', 'solid')],
    ['showKW', boolean], ['showMoon', boolean], ['showCropMarks', boolean],
    ['headerStyle', choice('uppercase', 'titlecase', 'numbered')],
    ['headerAlign', choice('center', 'left')],
    ['fontFamily', choice('sans', 'serif', 'mono', 'architect', 'custom')],
    ['fontHeaderScale', number(0.5, 3)], ['fontDayScale', number(0.5, 3)],
    ['lineGrid', number(0.05, 2)], ['lineBorder', number(0.1, 5)],
    ['paperColor', color], ['colorHeaderBg', color], ['colorHeaderText', color],
    ['colorGrid', color], ['colorText', color], ['colorSaturdayBg', color],
    ['colorSaturdayText', color], ['colorSundayBg', color], ['colorSundayText', color],
    ['colorWeekendBg', color], ['colorWeekendText', color]
  ];
  const separatorFields = [
    ['enabled', boolean], ['widthMm', number(0.1, 20)],
    ['colorMode', choice('custom', 'paper')], ['color', color], ['header', boolean]
  ];

  function encode(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 8192) return null;
    try {
      const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof TypeError || error.name === 'InvalidCharacterError') return null;
      throw error;
    }
  }

  function createNextYearUrl(state) {
    if (!number(1900, 2099, true)(state.year)) {
      throw new Error('Das Folgejahr muss zwischen 1900 und 2100 liegen.');
    }
    const values = fields.map(([name, valid]) => {
      let value = state[name];
      if (name === 'year') value++;
      if (name === 'bannerCustomTitle' && typeof value === 'string') {
        value = value.replace(new RegExp(`(^|[^0-9])${state.year}(?=[^0-9]|$)`, 'g'), `$1${state.year + 1}`);
      }
      if (!valid(value)) throw new Error(`Ungültige Einstellung: ${name}.`);
      return value;
    });
    if (!Object.hasOwn(regions, state.country) || !regions[state.country].includes(state.bundesland)) {
      throw new Error('Ungültiges Land oder ungültige Region.');
    }
    const separators = ['single', 'double'].map(layout => {
      const separator = state.monthSeparators && state.monthSeparators[layout];
      return separatorFields.map(([name, valid]) => {
        const value = separator && separator[name];
        if (!valid(value)) throw new Error(`Ungültige Einstellung: ${layout}.${name}.`);
        return value;
      });
    });
    return `${baseUrl}?config=${encode([1, values, state.country, state.bundesland, separators])}`;
  }

  function restore(search, state) {
    const params = new URLSearchParams(search);
    const encoded = params.get('config');
    if (!encoded || params.getAll('config').length !== 1) return;
    const data = decode(encoded);
    if (!Array.isArray(data) || data.length !== 5 || data[0] !== 1 || !Array.isArray(data[1])) return;
    fields.forEach(([name, valid], index) => {
      if (valid(data[1][index])) state[name] = data[1][index];
    });
    if (Object.hasOwn(regions, data[2]) && regions[data[2]].includes(data[3])) {
      state.country = data[2];
      state.bundesland = data[3];
    }
    if (Array.isArray(data[4])) {
      ['single', 'double'].forEach((layout, index) => {
        const values = data[4][index];
        if (!Array.isArray(values)) return;
        separatorFields.forEach(([name, valid], fieldIndex) => {
          if (valid(values[fieldIndex])) state.monthSeparators[layout][name] = values[fieldIndex];
        });
      });
    }
  }

  return { createNextYearUrl, restore };
})();
