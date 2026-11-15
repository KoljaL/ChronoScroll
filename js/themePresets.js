window.CronoThemes = (function() {
  'use strict';

  const themes = {
    wood: {
      name: 'Holz & Leder (Sepia)',
      label: 'Holz & Sepia',
      description: 'Warm, Buchdruck-Look',
      paperColor: '#fdfbf7',
      colorHeaderBg: '#fef3c7',
      colorHeaderText: '#78350f',
      colorGrid: '#e2d9cc',
      colorText: '#292524',
      colorSaturdayBg: '#fbf7ee',
      colorSaturdayText: '#44403c',
      colorSundayBg: '#fef2f2',
      colorSundayText: '#b91c1c',
      colorWeekendBg: '#fbf7ee',
      colorWeekendText: '#44403c',
      fontFamily: 'serif'
    },
    minimal: {
      name: 'Skandinavisch Minimal',
      label: 'Minimalist',
      description: 'Schwarz/Weiß, dezent',
      paperColor: '#ffffff',
      colorHeaderBg: '#f8fafc',
      colorHeaderText: '#0f172a',
      colorGrid: '#e2e8f0',
      colorText: '#0f172a',
      colorSaturdayBg: '#f8fafc',
      colorSaturdayText: '#334155',
      colorSundayBg: '#f1f5f9',
      colorSundayText: '#0f172a',
      colorWeekendBg: '#f8fafc',
      colorWeekendText: '#334155',
      fontFamily: 'sans'
    },
    architect: {
      name: 'Architektur & Blueprint',
      label: 'Blueprint',
      description: 'Technisch, Monospace',
      paperColor: '#ffffff',
      colorHeaderBg: '#e0f2fe',
      colorHeaderText: '#0369a1',
      colorGrid: '#cbd5e1',
      colorText: '#0f172a',
      colorSaturdayBg: '#f0f9ff',
      colorSaturdayText: '#0284c7',
      colorSundayBg: '#e0f2fe',
      colorSundayText: '#0369a1',
      colorWeekendBg: '#f0f9ff',
      colorWeekendText: '#0284c7',
      fontFamily: 'mono'
    },
    sage: {
      name: 'Wald & Salbei (Natur)',
      label: 'Wald & Salbei',
      description: 'Naturgrün, organisch',
      paperColor: '#fcfdfa',
      colorHeaderBg: '#dcfce7',
      colorHeaderText: '#166534',
      colorGrid: '#d1d5db',
      colorText: '#1f2937',
      colorSaturdayBg: '#f0fdf4',
      colorSaturdayText: '#15803d',
      colorSundayBg: '#fef2f2',
      colorSundayText: '#b91c1c',
      colorWeekendBg: '#f0fdf4',
      colorWeekendText: '#15803d',
      fontFamily: 'sans'
    }
  };
  const keys = Object.keys(themes);

  function isValidKey(key) {
    return keys.includes(key);
  }

  function apply(state, key) {
    if (!isValidKey(key)) return false;
    const values = { ...themes[key] };
    delete values.name;
    delete values.label;
    delete values.description;
    Object.assign(state, values, { themeKey: key });
    return true;
  }

  function colorRoles(state) {
    const text = state.colorText || '#000000';
    const weekendText = state.colorWeekendText || text;
    return {
      paper: state.paperColor || '#ffffff',
      grid: state.colorGrid || '#000000',
      text,
      header: {
        background: state.colorHeaderBg || state.paperColor || '#ffffff',
        text: state.colorHeaderText || text
      },
      saturday: {
        background: state.colorSaturdayBg || state.colorWeekendBg || state.paperColor || '#ffffff',
        text: state.colorSaturdayText || weekendText
      },
      sunday: {
        background: state.colorSundayBg || state.colorWeekendBg || state.paperColor || '#ffffff',
        text: state.colorSundayText || weekendText
      },
      highlight: state.colorSundayText || state.colorHeaderText || text
    };
  }

  return { themes, keys, isValidKey, apply, colorRoles };
})();
