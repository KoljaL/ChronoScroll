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
    },
    modern: {
      name: 'Modern Neutral',
      label: 'Modern Neutral',
      description: 'Klar, urban, dezente Kontraste',
      paperColor: '#ffffff',
      colorHeaderBg: '#e5e7eb',
      colorHeaderText: '#111827',
      colorGrid: '#d1d5db',
      colorText: '#111827',
      colorSaturdayBg: '#f3f4f6',
      colorSaturdayText: '#374151',
      colorSundayBg: '#e5e7eb',
      colorSundayText: '#1f2937',
      colorWeekendBg: '#f3f4f6',
      colorWeekendText: '#374151',
      fontFamily: 'sans'
    },
    coastal: {
      name: 'Kuestenblau',
      label: 'Kuestenblau',
      description: 'Frisch, hell, druckfreundlich',
      paperColor: '#fbfdff',
      colorHeaderBg: '#dbeafe',
      colorHeaderText: '#1e3a8a',
      colorGrid: '#cbd5e1',
      colorText: '#1e293b',
      colorSaturdayBg: '#eff6ff',
      colorSaturdayText: '#1d4ed8',
      colorSundayBg: '#e0f2fe',
      colorSundayText: '#0369a1',
      colorWeekendBg: '#eff6ff',
      colorWeekendText: '#1d4ed8',
      fontFamily: 'sans'
    },
    warm: {
      name: 'Warm Klassisch',
      label: 'Warm Klassisch',
      description: 'Traditionell, ruhig, druckoptimiert',
      paperColor: '#fffaf0',
      colorHeaderBg: '#fef3c7',
      colorHeaderText: '#78350f',
      colorGrid: '#d6d3d1',
      colorText: '#292524',
      colorSaturdayBg: '#faf5eb',
      colorSaturdayText: '#44403c',
      colorSundayBg: '#fef2f2',
      colorSundayText: '#991b1b',
      colorWeekendBg: '#faf5eb',
      colorWeekendText: '#44403c',
      fontFamily: 'serif'
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
    Object.assign(state, values, { themeKey: key, monthHeaderTextColor: values.colorHeaderText });
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
