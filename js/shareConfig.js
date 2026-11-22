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
  const color = value => typeof value === 'string' && /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value);
  const boolean = value => typeof value === 'boolean';
  const categoryColors = value => value && typeof value === 'object' &&
    ['public', 'vacation', 'custom'].every(key => color(value[key]));
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
    ['colorWeekendBg', color], ['colorWeekendText', color],
    ['designStyle', choice('classic', 'midcentury', 'bauhaus', 'gantt', 'zen', 'kursbuch')],
    ['themeKey', value => value === null || value === '' ||
      !!(window.CronoThemes && window.CronoThemes.isValidKey(value))],
    ['categoryColors', categoryColors],
    ['backpanelOffsetHeightMm', number(-100, 100)], ['backpanelOffsetWidthMm', number(-100, 100)],
    ['qrEnabled', boolean], ['qrGapMm', number(0, 100)], ['showVacations', boolean],
    ['monthHeaderTextColor', color], ['monthHeaderTextSize', number(0.5, 3)],
    ['calendarWeekTextColor', color], ['calendarWeekTextSize', number(0.5, 3)],
    ['moonOpacity', number(0, 1)]
  ];
  const separatorFields = [
    ['enabled', boolean], ['widthMm', number(0.1, 20)],
    ['colorMode', choice('custom', 'paper')], ['color', color], ['header', boolean]
  ];

  function validateCalendarSettings(state) {
    const errors = [];
    fields.forEach(([name, valid]) => {
      if (!valid(state[name])) errors.push(name);
    });
    if (!Object.hasOwn(regions, state.country) || !regions[state.country].includes(state.bundesland)) {
      errors.push('country/bundesland');
    }
    ['single', 'double'].forEach(layout => {
      const separator = state.monthSeparators && state.monthSeparators[layout];
      separatorFields.forEach(([name, valid]) => {
        if (!valid(separator && separator[name])) errors.push(`monthSeparators.${layout}.${name}`);
      });
    });
    return errors;
  }

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

  function createUrl(state, nextYear) {
    if (!number(1900, nextYear ? 2099 : 2100, true)(state.year)) {
      throw new Error(nextYear ? 'Das Folgejahr muss zwischen 1900 und 2100 liegen.' : 'Das Kalenderjahr muss zwischen 1900 und 2100 liegen.');
    }
    const values = fields.map(([name, valid]) => {
      let value = state[name];
      if (name === 'designStyle' && value === undefined) value = 'classic';
      if (name === 'themeKey' && value === undefined) value = null;
      if (name === 'categoryColors' && value === undefined) {
        value = { public: '#fef08a', vacation: '#bfdbfe', custom: '#bfdbfe' };
      }
      if (name === 'backpanelOffsetHeightMm' && value === undefined) value = 2;
      if (name === 'backpanelOffsetWidthMm' && value === undefined) value = 4;
      if (name === 'qrEnabled' && value === undefined) value = true;
      if (name === 'qrGapMm' && value === undefined) value = 40;
      if (name === 'showVacations' && value === undefined) value = false;
      if (name === 'monthHeaderTextColor' && value === undefined) value = '#0f172a';
      if (name === 'monthHeaderTextSize' && value === undefined) value = 1;
      if (name === 'calendarWeekTextColor' && value === undefined) value = '#64748b';
      if (name === 'calendarWeekTextSize' && value === undefined) value = 1;
      if (name === 'moonOpacity' && value === undefined) value = 0.89;
      if (name === 'year' && nextYear) value++;
      if (name === 'bannerCustomTitle' && nextYear && typeof value === 'string') {
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

  function createCurrentUrl(state) {
    return createUrl(state, false);
  }

  function createNextYearUrl(state) {
    return createUrl(state, true);
  }

  function restore(search, state) {
    const params = new URLSearchParams(search);
    const encoded = params.get('config');
    if (!encoded || params.getAll('config').length !== 1) return;
    const data = decode(encoded);
    if (!Array.isArray(data) || data.length !== 5 || data[0] !== 1 || !Array.isArray(data[1])) return;
    const designIndex = fields.findIndex(([name]) => name === 'designStyle');
    const themeIndex = fields.findIndex(([name]) => name === 'themeKey');
    if (data[1].length <= designIndex) state.designStyle = 'classic';
    if (data[1].length <= themeIndex) state.themeKey = null;
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

  return {
    createCurrentUrl, createNextYearUrl, restore, validateCalendarSettings,
    calendarSettingNames: [...fields.map(([name]) => name), 'country', 'bundesland', 'monthSeparators']
  };
})();
