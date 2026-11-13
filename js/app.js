/**
 * CRONOSCROLL — MAIN APPLICATION CONTROLLER
 * Bindet UI, Canvas, Pan/Zoom, Vorlagen, Modals, DACH-Feiertage und Exporte zusammen.
 */

(function() {
  'use strict';

  // 1-Klick Theme Presets
  const THEMES = {
    'wood': {
      name: 'Holz & Leder (Sepia)',
      paperColor: '#fdfbf7',
      colorHeaderBg: '#fef3c7',
      colorHeaderText: '#78350f',
      colorGrid: '#e2d9cc',
      colorText: '#292524',
      colorSaturdayBg: '#fbf7ee',
      colorSaturdayText: '#44403c',
      colorSundayBg: '#fef2f2',
      colorSundayText: '#b91c1c',
      fontFamily: 'serif'
    },
    'minimal': {
      name: 'Skandinavisch Minimal',
      paperColor: '#ffffff',
      colorHeaderBg: '#f8fafc',
      colorHeaderText: '#0f172a',
      colorGrid: '#e2e8f0',
      colorText: '#0f172a',
      colorSaturdayBg: '#f8fafc',
      colorSaturdayText: '#334155',
      colorSundayBg: '#f1f5f9',
      colorSundayText: '#0f172a',
      fontFamily: 'sans'
    },
    'architect': {
      name: 'Architektur & Blueprint',
      paperColor: '#ffffff',
      colorHeaderBg: '#e0f2fe',
      colorHeaderText: '#0369a1',
      colorGrid: '#cbd5e1',
      colorText: '#0f172a',
      colorSaturdayBg: '#f0f9ff',
      colorSaturdayText: '#0284c7',
      colorSundayBg: '#e0f2fe',
      colorSundayText: '#0369a1',
      fontFamily: 'mono'
    },
    'sage': {
      name: 'Wald & Salbei (Natur)',
      paperColor: '#fcfdfa',
      colorHeaderBg: '#dcfce7',
      colorHeaderText: '#166534',
      colorGrid: '#d1d5db',
      colorText: '#1f2937',
      colorSaturdayBg: '#f0fdf4',
      colorSaturdayText: '#15803d',
      colorSundayBg: '#fef2f2',
      colorSundayText: '#b91c1c',
      fontFamily: 'sans'
    }
  };

  function defaultMonthSeparators() {
    return {
      single: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
      double: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false }
    };
  }

  // Zentraler App State
  const state = {
    year: 2027,
    hVisible: 32.0,       // cm
    bVisible: 42.0,       // cm
    pufferLeft: 15.0,     // cm
    pufferRight: 15.0,    // cm
    pufferLeftContent: 'blank', // 'blank', 'title', 'year_overview', 'notes'
    pufferRightContent: 'blank', // 'blank', 'notes'
    bannerCustomTitle: 'CRONOSCROLL 2027',

    monthLayout: 'single', // 'single' oder 'double' Tageslisten pro Monat
    monthSeparators: defaultMonthSeparators(),
    subColumns: 1,        // 1 bis 4 Personen-Spalten pro Tag
    guideLinesCount: 0,   // 0, 1, 2, 3 Schreiblinien
    guideLinesStyle: 'dashed', // 'dashed', 'dotted', 'solid'
    showKW: true,
    showMoon: true,
    showCropMarks: true,
    headerStyle: 'uppercase', // 'uppercase', 'titlecase', 'numbered'
    headerAlign: 'center',

    fontFamily: 'sans',
    fontHeaderScale: 1.0,
    fontDayScale: 1.0,
    lineGrid: 0.2,        // mm
    lineBorder: 0.6,      // mm

    paperColor: '#ffffff',
    colorHeaderBg: '#f1f5f9',
    colorHeaderText: '#0f172a',
    colorGrid: '#cbd5e1',
    colorText: '#0f172a',
    colorSaturdayBg: '#f8fafc',
    colorSaturdayText: '#0f172a',
    colorSundayBg: '#f1f5f9',
    colorSundayText: '#e11d48',
    colorWeekendBg: '#f1f5f9',
    colorWeekendText: '#e11d48',

    country: 'DE',        // 'DE', 'AT', 'CH'
    bundesland: 'NW',
    holidays: [],
    holidayFilter: 'all', // 'all', 'public', 'vacation', 'custom'
    holidaySearchQuery: '',

    viewMode: 'plate',    // 'plate' oder 'banner'
    currentMonthIndex: 1, // 1 = Januar bis März des Zieljahres
    zoom: 1.0,

    isDraggingViewport: false,
    dragStartX: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    scrollStartX: 0,
    scrollStartY: 0
  };

  const canvas = document.getElementById('preview-canvas');
  const container = document.getElementById('canvas-container');

  function setFontStatus(message, isError = false, isSuccess = false, isWarning = false) {
    const status = document.getElementById('font-file-status');
    if (!status) return;
    status.textContent = message;
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.classList.toggle('text-rose-400', isError);
    status.classList.toggle('text-amber-400', isWarning && !isError);
    status.classList.toggle('text-emerald-400', isSuccess && !isError && !isWarning);
    status.classList.toggle('text-slate-500', !isError && !isSuccess && !isWarning);
  }

  // Feiertage & Ferien initialisieren
  function loadDefaultHolidays() {
    const pub = window.CronoHolidays.getDACHHolidays(state.year, state.country, state.bundesland);
    const vac = window.CronoHolidays.getSchoolVacations(state.year, state.country, state.bundesland);
    state.holidays = [...pub, ...vac];
  }

  function renderPreview() {
    window.CronoCanvas.render(canvas, container, state);
  }

  // --- UI INPUTS SYNCHRONISIEREN ---
  function syncInputsFromState() {
    // Maße
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    setVal('input-year', state.year);
    setVal('input-h-visible', state.hVisible);
    setVal('input-b-visible', state.bVisible);
    setVal('input-puffer-left', state.pufferLeft);
    setVal('input-puffer-right', state.pufferRight);
    setVal('select-puffer-left-content', state.pufferLeftContent);
    setVal('select-puffer-right-content', state.pufferRightContent);
    setVal('input-custom-title', state.bannerCustomTitle);

    // Layout
    setVal('select-month-layout', state.monthLayout);
    const separator = state.monthSeparators[state.monthLayout === 'double' ? 'double' : 'single'];
    setChecked('checkbox-month-separator', separator.enabled);
    setVal('input-month-separator-width', separator.widthMm);
    setVal('select-month-separator-color', separator.colorMode);
    setVal('color-month-separator', separator.color);
    setChecked('checkbox-month-separator-header', separator.header);
    document.getElementById('month-separator-width-error').classList.add('hidden');
    document.getElementById('input-month-separator-width').removeAttribute('aria-invalid');
    setVal('select-sub-columns', state.subColumns);
    setVal('select-guidelines-count', state.guideLinesCount);
    setVal('select-guidelines-style', state.guideLinesStyle);
    setChecked('checkbox-show-kw', state.showKW);
    setChecked('checkbox-show-moon', state.showMoon);
    setChecked('checkbox-show-cropmarks', state.showCropMarks);
    setVal('select-header-style', state.headerStyle);
    setVal('select-header-align', state.headerAlign);

    // Stil
    const customFontOption = document.getElementById('option-custom-font');
    if (customFontOption) {
      const hasCustomFont = window.CronoFonts.hasCustomFont();
      customFontOption.hidden = !hasCustomFont;
      if (hasCustomFont) customFontOption.textContent = `Eigene Schrift (${window.CronoFonts.getCustomFontName()})`;
      if (state.fontFamily === 'custom' && !hasCustomFont) state.fontFamily = 'sans';
    }
    setVal('select-font-family', state.fontFamily);
    setVal('input-font-header-scale', state.fontHeaderScale);
    setVal('input-font-day-scale', state.fontDayScale);
    setVal('input-line-grid', state.lineGrid);
    setVal('input-line-border', state.lineBorder);

    // Farben
    setVal('color-paper', state.paperColor);
    setVal('color-grid', state.colorGrid);
    setVal('color-text', state.colorText);
    setVal('color-saturday-bg', state.colorSaturdayBg);
    setVal('color-saturday-text', state.colorSaturdayText);
    setVal('color-sunday-bg', state.colorSundayBg);
    setVal('color-sunday-text', state.colorSundayText);

    // Land & Region
    setVal('select-country', state.country);
    updateRegionDropdown();
    setVal('select-bundesland', state.bundesland);
  }

  function updateRegionDropdown() {
    const sel = document.getElementById('select-bundesland');
    if (!sel) return;
    sel.innerHTML = '';

    if (state.country === 'DE') {
      const deRegions = [
        ['NW', 'Nordrhein-Westfalen (NW)'], ['BW', 'Baden-Württemberg (BW)'], ['BY', 'Bayern (BY)'],
        ['BE', 'Berlin (BE)'], ['BB', 'Brandenburg (BB)'], ['HB', 'Bremen (HB)'],
        ['HH', 'Hamburg (HH)'], ['HE', 'Hessen (HE)'], ['MV', 'Mecklenburg-Vorpommern (MV)'],
        ['NI', 'Niedersachsen (NI)'], ['RP', 'Rheinland-Pfalz (RP)'], ['SL', 'Saarland (SL)'],
        ['SN', 'Sachsen (SN)'], ['ST', 'Sachsen-Anhalt (ST)'], ['SH', 'Schleswig-Holstein (SH)'],
        ['TH', 'Thüringen (TH)']
      ];
      deRegions.forEach(([k, n]) => sel.add(new Option(n, k)));
    } else if (state.country === 'AT') {
      const atRegions = [
        ['W', 'Wien (W)'], ['B', 'Burgenland (B)'], ['K', 'Kärnten (K)'],
        ['NOE', 'Niederösterreich (NÖ)'], ['OOE', 'Oberösterreich (OÖ)'], ['S', 'Salzburg (S)'],
        ['ST', 'Steiermark (ST)'], ['T', 'Tirol (T)'], ['V', 'Vorarlberg (V)']
      ];
      atRegions.forEach(([k, n]) => sel.add(new Option(n, k)));
    } else if (state.country === 'CH') {
      const chRegions = [
        ['ZH', 'Zürich (ZH)'], ['BE', 'Bern (BE)'], ['LU', 'Luzern (LU)'],
        ['BS', 'Basel-Stadt (BS)'], ['BL', 'Basel-Landschaft (BL)'], ['SG', 'St. Gallen (SG)'],
        ['GR', 'Graubünden (GR)'], ['AG', 'Aargau (AG)'], ['GE', 'Genf (GE)']
      ];
      chRegions.forEach(([k, n]) => sel.add(new Option(n, k)));
    }
  }

  // --- TERMINLISTE RENDERN ---
  function renderHolidaysList() {
    const listEl = document.getElementById('holiday-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const q = state.holidaySearchQuery.toLowerCase();
    const filtered = state.holidays.filter(h => {
      if (state.holidayFilter === 'public' && h.type !== 'public') return false;
      if (state.holidayFilter === 'vacation' && h.type !== 'vacation') return false;
      if (state.holidayFilter === 'custom' && h.type === 'public' && h.type === 'vacation') return false;
      if (q && !h.title.toLowerCase().includes(q) && !h.start.includes(q)) return false;
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<p class="text-xs text-slate-500 italic p-2">Keine Termine gefunden.</p>';
      return;
    }

    filtered.forEach(h => {
      const item = document.createElement('div');
      item.className = 'bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs transition hover:border-slate-700';
      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 w-2/3">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${h.color}"></span>
            <input type="text" value="${h.title}" data-id="${h.id}" data-field="title" class="holiday-input bg-transparent font-semibold text-slate-200 focus:outline-none focus:border-b border-amber-500 w-full truncate">
          </div>
          <button data-id="${h.id}" title="Löschen" class="btn-delete-holiday text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-400">Beginn</label>
            <input type="date" value="${h.start}" data-id="${h.id}" data-field="start" class="holiday-input bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 w-full font-mono text-[11px]">
          </div>
          <div>
            <label class="text-[10px] text-slate-400">Ende</label>
            <input type="date" value="${h.end}" data-id="${h.id}" data-field="end" class="holiday-input bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 w-full font-mono text-[11px]">
          </div>
        </div>
        <div class="flex items-center space-x-2 pt-0.5">
          <input type="color" value="${h.color}" data-id="${h.id}" data-field="color" class="holiday-input w-5 h-5 rounded cursor-pointer bg-transparent">
          <span class="text-[10px] text-slate-400">Farbe im Kalender</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded ml-auto uppercase font-mono ${h.type === 'public' ? 'bg-amber-500/20 text-amber-400' : (h.type === 'vacation' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300')}">${h.type || 'termin'}</span>
        </div>
      `;
      listEl.appendChild(item);
    });

    listEl.querySelectorAll('.holiday-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const item = state.holidays.find(x => x.id === id);
        if (item) {
          item[field] = e.target.value;
          renderPreview();
        }
      });
    });

    listEl.querySelectorAll('.btn-delete-holiday').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        state.holidays = state.holidays.filter(x => x.id !== id);
        renderHolidaysList();
        renderPreview();
      });
    });
  }

  // --- MODAL: TERMIN DIREKT AM KALENDER ANLEGEN/EDITIEREN ---
  function openEventModal(dateStr, title = '') {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    document.getElementById('modal-event-date-start').value = dateStr;
    document.getElementById('modal-event-date-end').value = dateStr;
    document.getElementById('modal-event-title').value = title;
    document.getElementById('modal-event-title').focus();
    modal.classList.remove('hidden');
  }

  function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- MODAL: DIY MATERIAL- & ZUSCHNITTLISTE ---
  function openCutListModal() {
    const modal = document.getElementById('cutlist-modal');
    if (!modal) return;
    const geo = window.CronoGeometry.calculate(state);

    document.getElementById('cutlist-rail-len').textContent = `${geo.woodRailLengthCm.toFixed(1)} cm`;
    document.getElementById('cutlist-dowel-len').textContent = `${geo.roundDowelLengthCm.toFixed(1)} cm`;
    document.getElementById('cutlist-plate-size').textContent = `${geo.backingBoardCm.width.toFixed(1)} cm × ${geo.backingBoardCm.height.toFixed(1)} cm`;
    document.getElementById('cutlist-paper-roll').textContent = `Breite ${geo.hVisible.toFixed(1)} cm × Gesamtlänge ${(geo.lTotal/100).toFixed(2)} m`;
    document.getElementById('cutlist-day-height').textContent = `${(geo.hDay * 10).toFixed(1)} mm`;

    modal.classList.remove('hidden');
  }

  function closeCutListModal() {
    const modal = document.getElementById('cutlist-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- VORLAGEN (PRESETS) ---
  function getPresets() {
    const saved = localStorage.getItem('cronoscroll_v2_presets');
    return saved ? JSON.parse(saved) : {};
  }
  function savePresets(p) {
    localStorage.setItem('cronoscroll_v2_presets', JSON.stringify(p));
  }
  function renderPresetsList() {
    const presets = getPresets();
    const container = document.getElementById('presets-list');
    if (!container) return;
    container.innerHTML = '';
    const keys = Object.keys(presets);
    if (keys.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 italic p-2">Noch keine Vorlagen gespeichert.</p>';
      return;
    }
    keys.forEach(name => {
      const item = document.createElement('div');
      item.className = 'bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs';
      item.innerHTML = `
        <span class="font-medium text-slate-200">${name}</span>
        <div class="flex items-center space-x-2">
          <button data-name="${name}" class="btn-load-preset bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded text-[11px] transition cursor-pointer">Laden</button>
          <button data-name="${name}" class="btn-delete-preset text-slate-500 hover:text-rose-400 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.btn-load-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        const data = presets[name];
        if (data) {
          const preset = data.fontFamily === 'custom' && !window.CronoFonts.hasCustomFont()
            ? { ...data, fontFamily: 'sans' }
            : data;
          if (preset !== data) {
            setFontStatus('Diese Vorlage verwendet eine eigene Schrift. Bitte lade die TTF-Datei erneut hoch.', true);
          }
          Object.assign(state, preset);
          const defaults = defaultMonthSeparators();
          state.monthSeparators = {
            single: { ...defaults.single, ...(preset.monthSeparators && preset.monthSeparators.single) },
            double: { ...defaults.double, ...(preset.monthSeparators && preset.monthSeparators.double) }
          };
          syncInputsFromState();
          renderHolidaysList();
          renderPreview();
        }
      });
    });

    container.querySelectorAll('.btn-delete-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        delete presets[name];
        savePresets(presets);
        renderPresetsList();
      });
    });
  }

  // --- EVENTS BINDEN ---
  function bindEvents() {
    // 1. Maße & Geometrie
    const bindNum = (id, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => {
        state[prop] = parseFloat(e.target.value) || 0;
        renderPreview();
      });
    };
    bindNum('input-h-visible', 'hVisible');
    bindNum('input-b-visible', 'bVisible');
    bindNum('input-puffer-left', 'pufferLeft');
    bindNum('input-puffer-right', 'pufferRight');
    bindNum('input-font-header-scale', 'fontHeaderScale');
    bindNum('input-font-day-scale', 'fontDayScale');
    bindNum('input-line-grid', 'lineGrid');
    bindNum('input-line-border', 'lineBorder');

    // Jahr
    document.getElementById('input-year').addEventListener('change', (e) => {
      state.year = parseInt(e.target.value) || 2027;
      loadDefaultHolidays();
      renderHolidaysList();
      renderPreview();
    });

    // Puffer & Layout
    document.getElementById('select-puffer-left-content').addEventListener('change', (e) => {
      state.pufferLeftContent = e.target.value;
      renderPreview();
    });
    document.getElementById('select-puffer-right-content').addEventListener('change', (e) => {
      state.pufferRightContent = e.target.value;
      renderPreview();
    });
    document.getElementById('input-custom-title').addEventListener('input', (e) => {
      state.bannerCustomTitle = e.target.value;
      renderPreview();
    });
    document.getElementById('select-month-layout').addEventListener('change', (e) => {
      state.monthLayout = e.target.value;
      syncInputsFromState();
      renderPreview();
    });
    const currentSeparator = () => state.monthSeparators[state.monthLayout === 'double' ? 'double' : 'single'];
    document.getElementById('checkbox-month-separator').addEventListener('change', (e) => {
      currentSeparator().enabled = e.target.checked;
      renderPreview();
    });
    document.getElementById('input-month-separator-width').addEventListener('input', (e) => {
      const width = e.target.valueAsNumber;
      const valid = Number.isFinite(width) && width >= 0.1 && width <= 20;
      document.getElementById('month-separator-width-error').classList.toggle('hidden', valid);
      if (!valid) {
        e.target.setAttribute('aria-invalid', 'true');
        return;
      }
      e.target.removeAttribute('aria-invalid');
      currentSeparator().widthMm = width;
      renderPreview();
    });
    document.getElementById('select-month-separator-color').addEventListener('change', (e) => {
      currentSeparator().colorMode = e.target.value;
      renderPreview();
    });
    document.getElementById('color-month-separator').addEventListener('input', (e) => {
      currentSeparator().color = e.target.value;
      renderPreview();
    });
    document.getElementById('checkbox-month-separator-header').addEventListener('change', (e) => {
      currentSeparator().header = e.target.checked;
      renderPreview();
    });
    document.getElementById('select-sub-columns').addEventListener('change', (e) => {
      state.subColumns = parseInt(e.target.value) || 1;
      renderPreview();
    });
    document.getElementById('select-guidelines-count').addEventListener('change', (e) => {
      state.guideLinesCount = parseInt(e.target.value) || 0;
      renderPreview();
    });
    document.getElementById('select-guidelines-style').addEventListener('change', (e) => {
      state.guideLinesStyle = e.target.value;
      renderPreview();
    });
    document.getElementById('checkbox-show-kw').addEventListener('change', (e) => {
      state.showKW = e.target.checked;
      renderPreview();
    });
    document.getElementById('checkbox-show-moon').addEventListener('change', (e) => {
      state.showMoon = e.target.checked;
      renderPreview();
    });
    document.getElementById('checkbox-show-cropmarks').addEventListener('change', (e) => {
      state.showCropMarks = e.target.checked;
      renderPreview();
    });
    document.getElementById('select-header-style').addEventListener('change', (e) => {
      state.headerStyle = e.target.value;
      renderPreview();
    });
    document.getElementById('select-header-align').addEventListener('change', (e) => {
      state.headerAlign = e.target.value;
      renderPreview();
    });
    document.getElementById('select-font-family').addEventListener('change', (e) => {
      state.fontFamily = e.target.value;
      renderPreview();
    });
    document.getElementById('input-font-file').addEventListener('change', async (e) => {
      const input = e.currentTarget;
      const file = input.files && input.files[0];
      if (!file) return;

      let result;
      try {
        result = await window.CronoFonts.loadCustomFont(file);
      } catch (error) {
        setFontStatus(`Schrift konnte nicht geladen werden: ${error.message}`, true);
        return;
      } finally {
        input.value = '';
      }

      state.fontFamily = 'custom';
      syncInputsFromState();
      const message = `„${file.name}“ ist geladen und wird in die Plotter-PDF eingebettet.`;
      setFontStatus(
        result.hasOversizedKernTable
          ? `${message} Die Kerning-Tabelle ist zu groß und wird möglicherweise vom Browser verworfen.`
          : message,
        false, !result.hasOversizedKernTable, result.hasOversizedKernTable
      );
      renderPreview();
    });

    // 2. Farben
    const bindColor = (id, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => {
        state[prop] = e.target.value;
        renderPreview();
      });
    };
    bindColor('color-paper', 'paperColor');
    bindColor('color-grid', 'colorGrid');
    bindColor('color-text', 'colorText');
    bindColor('color-saturday-bg', 'colorSaturdayBg');
    bindColor('color-saturday-text', 'colorSaturdayText');
    bindColor('color-sunday-bg', 'colorSundayBg');
    bindColor('color-sunday-text', 'colorSundayText');

    // 3. 1-Klick Theme Buttons
    document.querySelectorAll('.theme-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const key = pill.getAttribute('data-theme');
        const th = THEMES[key];
        if (th) {
          Object.assign(state, th);
          syncInputsFromState();
          document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          renderPreview();
        }
      });
    });

    // 4. DACH Länderauswahl
    document.getElementById('select-country').addEventListener('change', (e) => {
      state.country = e.target.value;
      updateRegionDropdown();
      state.bundesland = document.getElementById('select-bundesland').value;
      loadDefaultHolidays();
      renderHolidaysList();
      renderPreview();
    });

    document.getElementById('select-bundesland').addEventListener('change', (e) => {
      state.bundesland = e.target.value;
      loadDefaultHolidays();
      renderHolidaysList();
      renderPreview();
    });

    document.getElementById('btn-load-feiertage').addEventListener('click', () => {
      loadDefaultHolidays();
      renderHolidaysList();
      renderPreview();
    });

    // 5. Terminfilter & Suche
    document.querySelectorAll('.btn-filter-holiday').forEach(btn => {
      btn.addEventListener('click', () => {
        state.holidayFilter = btn.getAttribute('data-filter');
        document.querySelectorAll('.btn-filter-holiday').forEach(b => {
          b.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.add('bg-amber-500', 'text-slate-950', 'font-bold');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        renderHolidaysList();
      });
    });

    const searchInput = document.getElementById('input-holiday-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.holidaySearchQuery = e.target.value;
        renderHolidaysList();
      });
    }

    // 6. iCal / ICS Import & Export
    const icsInput = document.getElementById('input-ics-file');
    document.getElementById('btn-import-ics').addEventListener('click', () => icsInput.click());
    icsInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const events = window.CronoICS.parseICS(re.target.result);
        if (events.length > 0) {
          state.holidays = [...state.holidays, ...events];
          renderHolidaysList();
          renderPreview();
          alert(`${events.length} Termine erfolgreich aus iCal importiert!`);
        } else {
          alert('Keine gültigen Termine in der .ics Datei gefunden.');
        }
      };
      reader.readAsText(file);
      icsInput.value = '';
    });

    document.getElementById('btn-export-ics').addEventListener('click', () => {
      window.CronoICS.downloadICS(state.holidays, `CronoScroll-${state.year}.ics`);
    });

    // 7. Modals: Termin anlegen
    document.getElementById('btn-add-holiday').addEventListener('click', () => {
      openEventModal(`${state.year}-06-01`, 'Neuer Termin');
    });

    document.getElementById('btn-modal-event-save').addEventListener('click', () => {
      const title = document.getElementById('modal-event-title').value.trim() || 'Termin';
      const start = document.getElementById('modal-event-date-start').value;
      const end = document.getElementById('modal-event-date-end').value || start;
      const color = document.getElementById('modal-event-color').value;

      state.holidays.push({
        id: 'termin_' + Date.now(),
        title,
        start,
        end,
        color,
        type: 'custom'
      });
      closeEventModal();
      renderHolidaysList();
      renderPreview();
    });

    document.getElementById('btn-modal-event-cancel').addEventListener('click', closeEventModal);

    // 8. Klick auf Kalender zum direkten Termin-Erstellen
    canvas.addEventListener('click', (e) => {
      if (state.isPanning) return;
      const hit = window.CronoCanvas.getDateAtCanvasPoint(e.clientX, e.clientY, canvas, state);
      if (hit) {
        openEventModal(hit.dateStr, '');
      }
    });

    // 9. Vorlagen-Verwaltung
    document.getElementById('btn-save-preset').addEventListener('click', () => {
      const input = document.getElementById('input-preset-name');
      const name = input.value.trim();
      if (!name) return;
      const presets = getPresets();
      presets[name] = { ...state };
      savePresets(presets);
      input.value = '';
      renderPresetsList();
    });

    // 10. Zuschnittliste Modal
    document.getElementById('btn-open-cutlist').addEventListener('click', openCutListModal);
    document.getElementById('btn-close-cutlist').addEventListener('click', closeCutListModal);
    document.getElementById('btn-copy-cutlist').addEventListener('click', () => {
      const geo = window.CronoGeometry.calculate(state);
      const text = `CRONOSCROLL — HOLZ- & ZUSCHNITTLISTE (${state.year})\n\n` +
        `1. Obere & untere Holz-Tragleiste: 2x Länge ${geo.woodRailLengthCm.toFixed(1)} cm (z.B. 25x45 mm Eiche/Buche)\n` +
        `2. Rundstäbe (Walzen): 2x Länge ${geo.roundDowelLengthCm.toFixed(1)} cm (Durchmesser 22-25 mm)\n` +
        `3. Schreibplatte (Rückwand): 1x ${geo.backingBoardCm.width.toFixed(1)} cm × ${geo.backingBoardCm.height.toFixed(1)} cm (5 mm Multiplex/MDF)\n` +
        `4. Papierbahn: Breite ${geo.hVisible.toFixed(1)} cm × Gesamtlänge ${(geo.lTotal/100).toFixed(2)} m (90-120 g/m² CAD-Papier)\n` +
        `5. Tageszeilenhöhe: ${(geo.hDay * 10).toFixed(1)} mm\n`;
      navigator.clipboard.writeText(text).then(() => alert('Zuschnittliste in die Zwischenablage kopiert!'));
    });

    // 11. Export-Aktionen
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      try {
        window.CronoPDF.exportPlotterPDF(state);
      } catch (error) {
        alert(`PDF konnte nicht erstellt werden: ${error.message}`);
      }
    });
    document.getElementById('btn-export-svg').addEventListener('click', () => {
      window.CronoVector.exportSVG(state);
    });
    document.getElementById('btn-export-png').addEventListener('click', () => {
      window.CronoVector.exportHighResPNG(state);
    });

    // 12. Reiter-Umschaltung
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-amber-400', 'border-b-2', 'border-amber-400', 'font-semibold');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('text-amber-400', 'border-b-2', 'border-amber-400', 'font-semibold');
        btn.classList.remove('text-slate-400');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');
      });
    });

    // 13. Ansichtsmodus & Navigation
    const btnModePlate = document.getElementById('btn-mode-plate');
    const btnModeBanner = document.getElementById('btn-mode-banner');
    const plateNav = document.getElementById('plate-nav-controls');
    const btnFitBanner = document.getElementById('btn-zoom-fit-banner');

    btnModePlate.addEventListener('click', () => {
      state.viewMode = 'plate';
      btnModePlate.className = 'px-3 py-1 rounded text-xs font-bold bg-amber-500 text-slate-950 shadow transition flex items-center space-x-1.5 cursor-pointer';
      btnModeBanner.className = 'px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5 cursor-pointer';
      plateNav.classList.remove('hidden');
      btnFitBanner.classList.add('hidden');
      state.zoom = 1.0;
      renderPreview();
    });

    btnModeBanner.addEventListener('click', () => {
      state.viewMode = 'banner';
      btnModeBanner.className = 'px-3 py-1 rounded text-xs font-bold bg-amber-500 text-slate-950 shadow transition flex items-center space-x-1.5 cursor-pointer';
      btnModePlate.className = 'px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5 cursor-pointer';
      plateNav.classList.add('hidden');
      btnFitBanner.classList.remove('hidden');
      renderPreview();
      container.scrollLeft = 0;
    });

    const stepMonth = (delta) => {
      const newIdx = state.currentMonthIndex + delta;
      if (newIdx >= 0 && newIdx <= 11) {
        state.currentMonthIndex = newIdx;
        renderPreview();
      }
    };
    document.getElementById('btn-prev-month').addEventListener('click', () => stepMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => stepMonth(1));

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') stepMonth(-1);
      if (e.key === 'ArrowRight') stepMonth(1);
    });

    // 14. Zoom & Pan
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      state.zoom = Math.min(3.5, state.zoom + 0.2);
      renderPreview();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      state.zoom = Math.max(0.15, state.zoom - 0.2);
      renderPreview();
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      state.zoom = 1.0;
      renderPreview();
    });
    btnFitBanner.addEventListener('click', () => {
      const geo = window.CronoGeometry.calculate(state);
      const avail = container.clientWidth - 80;
      state.zoom = Math.max(0.12, Math.min(1.0, avail / (geo.lTotal * 20)));
      renderPreview();
    });

    // Zoom per Mausrad
    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        state.zoom = Math.max(0.15, Math.min(3.5, state.zoom + delta));
        renderPreview();
      }
    }, { passive: false });

    // Dragging des roten 3-Monats-Fensters im Bannermodus
    canvas.addEventListener('mousedown', (e) => {
      if (state.viewMode !== 'banner') return;
      const rect = canvas.getBoundingClientRect();
      const pxPerCm = 20 * state.zoom;
      const clickXCm = (e.clientX - rect.left) / pxPerCm;
      const geo = window.CronoGeometry.calculate(state);
      const viewportXCm = geo.pufferLeft + (state.currentMonthIndex * geo.bMonth);

      if (clickXCm >= viewportXCm && clickXCm <= viewportXCm + state.bVisible) {
        state.isDraggingViewport = true;
        state.dragStartX = clickXCm - (state.currentMonthIndex * geo.bMonth);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDraggingViewport && state.viewMode === 'banner') {
        const rect = canvas.getBoundingClientRect();
        const pxPerCm = 20 * state.zoom;
        const currentXCm = (e.clientX - rect.left) / pxPerCm;
        const geo = window.CronoGeometry.calculate(state);
        let newOffset = currentXCm - state.dragStartX;
        const maxOffset = (14 - 3) * geo.bMonth;
        newOffset = Math.max(0, Math.min(maxOffset, newOffset));
        const newMonthIdx = Math.max(0, Math.min(11, Math.round(newOffset / geo.bMonth)));
        if (newMonthIdx !== state.currentMonthIndex) {
          state.currentMonthIndex = newMonthIdx;
          renderPreview();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDraggingViewport = false;
    });

    // Sidebar Ein-/Ausklappen (Drawer für Tablets/Laptops)
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        document.getElementById('app-container').classList.toggle('sidebar-collapsed');
        setTimeout(renderPreview, 260);
      });
    }
  }

  // Initialisierung beim Laden
  window.addEventListener('DOMContentLoaded', () => {
    loadDefaultHolidays();
    syncInputsFromState();
    renderHolidaysList();
    renderPresetsList();
    bindEvents();
    renderPreview();
    window.CronoFonts.loadStandardFonts().then(
      renderPreview,
      (error) => {
        setFontStatus(`Standardschriften konnten nicht für die Vorschau geladen werden: ${error.message}`, true);
      }
    );
  });
})();
