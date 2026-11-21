/**
 * CRONOSCROLL — MAIN APPLICATION CONTROLLER
 * Bindet UI, Canvas, Pan/Zoom, Vorlagen, Modals, DACH-Feiertage und Exporte zusammen.
 */

(function () {
  'use strict';

  function defaultMonthSeparators() {
    return {
      single: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
      double: { enabled: false, widthMm: 0.5, colorMode: 'custom', color: '#cbd5e1', header: false },
    };
  }

  function defaultCategoryColors() {
    return { public: '#fef08a', vacation: '#bfdbfe', custom: '#bfdbfe' };
  }

  // Zentraler App State
  const state = {
    year: 2027,
    hVisible: 30.0, // cm
    bVisible: 42.0, // cm
    backpanelOffsetHeightMm: 2.0,
    backpanelOffsetWidthMm: 4.0,
    pufferLeft: 15.0, // cm
    pufferRight: 15.0, // cm
    pufferLeftContent: 'blank', // 'blank', 'title', 'year_overview', 'notes'
    pufferRightContent: 'blank', // 'blank', 'notes'
    bannerCustomTitle: 'CRONOSCROLL 2027',
    qrEnabled: true,
    qrGapMm: 40,
    showVacations: false,

    monthLayout: 'single', // 'single' oder 'double' Tageslisten pro Monat
    designStyle: 'classic',
    themeKey: null,
    monthSeparators: defaultMonthSeparators(),
    subColumns: 1, // 1 bis 4 Personen-Spalten pro Tag
    guideLinesCount: 0, // 0, 1, 2, 3 Schreiblinien
    guideLinesStyle: 'dashed', // 'dashed', 'dotted', 'solid'
    showKW: true,
    showMoon: true,
    showCropMarks: false,
    headerStyle: 'uppercase', // 'uppercase', 'titlecase', 'numbered'
    headerAlign: 'center',
    monthHeaderTextColor: '#0f172a',
    monthHeaderTextSize: 1.0,
    calendarWeekTextColor: '#64748b',
    calendarWeekTextSize: 1.0,
    moonOpacity: 0.89,

    fontFamily: 'sans',
    fontHeaderScale: 1.0,
    fontDayScale: 1.0,
    lineGrid: 0.2, // mm
    lineBorder: 0.6, // mm

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
    categoryColors: defaultCategoryColors(),

    country: 'DE', // 'DE', 'AT', 'CH'
    bundesland: 'NW',
    holidays: [],
    holidayFilter: 'all', // 'all', 'public', 'vacation', 'custom'
    holidaySearchQuery: '',

    viewMode: 'plate', // 'plate' oder 'banner'
    currentMonthIndex: 1, // 1 = Januar bis März des Zieljahres
    zoom: 1.0,

    isDraggingViewport: false,
    dragStartX: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    scrollStartX: 0,
    scrollStartY: 0,
  };

  const canvas = document.getElementById('preview-canvas');
  const container = document.getElementById('canvas-container');
  let coverageAdviceStateKey = null;
  const cadDimensionListeners = new Set();
  let lastCadSnapshot = '';

  function getCadSnapshot() {
    const geo = window.CronoGeometry.calculate(state);
    const months = window.CronoHolidays.get14MonthsData(state.year, [], state)
      .slice(state.currentMonthIndex, state.currentMonthIndex + 3)
      .map((month) => ({
        year: month.year,
        monthName: month.monthName,
        days: month.days.map((day) => ({
          dayNum: day.dayNum,
          dayName: day.dayName,
          isValid: day.isValid,
        })),
      }));

    return {
      dimensions: {
        windowWidth: geo.bVisible * 10,
        windowHeight: geo.hVisible * 10,
        paperLength: geo.lTotal * 10,
      },
      calendarPreview: {
        monthLayout: state.monthLayout,
        months,
      },
    };
  }

  function publishCadSnapshot() {
    const snapshot = getCadSnapshot();
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastCadSnapshot) return;
    lastCadSnapshot = serialized;
    cadDimensionListeners.forEach((listener) => listener(JSON.parse(serialized)));
  }

  window.CronoScrollCADBridge = Object.freeze({
    getSnapshot() {
      return getCadSnapshot();
    },
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('CAD-Bridge-Abonnenten müssen Funktionen sein.');
      }
      cadDimensionListeners.add(listener);
      listener(getCadSnapshot());
      return () => cadDimensionListeners.delete(listener);
    },
  });

  function getCoverageAdviceStateKey() {
    const adviceState = {
      ...state,
      viewMode: 'banner',
      currentMonthIndex: 0,
      zoom: 0.25,
    };
    for (const key of ['isDraggingViewport', 'dragStartX', 'isPanning', 'panStartX', 'panStartY', 'scrollStartX', 'scrollStartY']) {
      delete adviceState[key];
    }
    return JSON.stringify({
      state: adviceState,
      fontFamily: window.CronoFonts.getCanvasFamily(state.fontFamily),
    });
  }

  function formatCoveragePercent(value, fractionDigits = 1) {
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  function updateCoverageStatus() {
    const status = document.getElementById('status-coverage');
    if (!status) return;
    try {
      const coverage = window.CronoCanvas.calculateCoverage(state);
      status.textContent = `≈ K ${formatCoveragePercent(coverage.blackPercent)} % · CMY ${formatCoveragePercent(coverage.colorPercent)} %`;
      status.title = 'Geschätzter mittlerer Farbauftrag über die gesamte Rolle: Schwarz (K) und summierte Farbkanäle (C+M+Y; bis 300 % möglich). Aus einer verkleinerten RGB-Renderung, ohne Drucker-Farbprofil; tatsächlicher Verbrauch und Druckpreis können abweichen.';
      status.setAttribute('aria-label', `Geschätzter Farbauftrag der ganzen Rolle: Schwarz K ${formatCoveragePercent(coverage.blackPercent)} Prozent, Farbe C M Y ${formatCoveragePercent(coverage.colorPercent)} Prozent.`);
    } catch (error) {
      status.textContent = 'Druckdeckung nicht verfügbar';
      status.title = `Schätzung fehlgeschlagen: ${error.message}`;
      status.setAttribute('aria-label', status.title);
    }
  }

  function renderCoverageAdvice(recommendations) {
    const list = document.getElementById('coverage-recommendations');
    if (!list) return;
    if (!recommendations.length) {
      list.innerHTML = '<p class="text-[11px] text-slate-400">Die geprüften Farbänderungen senken die geschätzte Farbdeckung aktuell nicht merklich.</p>';
      return;
    }

    const formatSignedPoints = (value) => {
      const sign = value > 0 ? '+' : value < 0 ? '−' : '';
      return `${sign}${formatCoveragePercent(Math.abs(value), 2)}`;
    };
    list.innerHTML = recommendations
      .map(
        (recommendation) => `
      <article class="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 space-y-1.5">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h4 class="text-[11px] font-semibold text-slate-200">${recommendation.title}</h4>
            <p class="text-[10px] text-slate-400">${recommendation.description}</p>
            <p class="text-[10px] text-slate-300">C+M+Y: −${formatCoveragePercent(recommendation.colorReduction, 2)} Prozentpunkte · K: ${formatSignedPoints(recommendation.blackChange)} Prozentpunkte</p>
          </div>
          <button type="button" data-coverage-action="${recommendation.id}" class="shrink-0 rounded bg-amber-500 px-2 py-1 text-[10px] font-semibold text-slate-950 hover:bg-amber-400 transition cursor-pointer">Anwenden</button>
        </div>
      </article>
    `,
      )
      .join('');
  }

  function refreshCoverageAdvice() {
    const list = document.getElementById('coverage-recommendations');
    if (!list) return;
    try {
      const recommendations = window.CronoCoverageAdvisor.analyze(state, window.CronoCanvas.calculateCoverage);
      coverageAdviceStateKey = getCoverageAdviceStateKey();
      renderCoverageAdvice(recommendations);
    } catch (error) {
      coverageAdviceStateKey = null;
      list.textContent = `Tipps konnten nicht berechnet werden: ${error.message}`;
    }
  }

  function invalidateStaleCoverageAdvice() {
    if (!coverageAdviceStateKey || coverageAdviceStateKey === getCoverageAdviceStateKey()) return;
    coverageAdviceStateKey = null;
    const list = document.getElementById('coverage-recommendations');
    if (list) list.textContent = 'Der Entwurf wurde geändert. Bitte berechne die Tipps erneut.';
  }

  function applyCoverageAdvice(recommendationId) {
    const list = document.getElementById('coverage-recommendations');
    try {
      if (coverageAdviceStateKey !== getCoverageAdviceStateKey()) {
        invalidateStaleCoverageAdvice();
        return;
      }
      const changed = window.CronoCoverageAdvisor.apply(state, recommendationId);
      if (!changed) {
        refreshCoverageAdvice();
        return;
      }
      syncInputsFromState();
      if (recommendationId === 'holiday-colors-grayscale') renderHolidaysList();
      renderPreview();
      refreshCoverageAdvice();
    } catch (error) {
      if (list) list.textContent = `Empfehlung konnte nicht angewendet werden: ${error.message}`;
    }
  }

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
    const vac = state.showVacations
      ? window.CronoHolidays.getSchoolVacations(state.year, state.country, state.bundesland)
      : [];
    state.holidays = [...pub, ...vac].map((event) => ({
      ...event,
      color: state.categoryColors[event.type] || event.color,
    }));
  }

  function categoryForEvent(event) {
    return event.type === 'public' || event.type === 'vacation' ? event.type : 'custom';
  }

  function applyCategoryColor(category, color) {
    state.categoryColors[category] = color;
    state.holidays.forEach((event) => {
      if (categoryForEvent(event) === category) event.color = color;
    });
    renderHolidaysList();
    renderPreview();
  }

  function renderDesignOptions() {
    const container = document.getElementById('design-options');
    const select = document.getElementById('select-design-style');
    if (!container || !select) return;
    const descriptions = {
      classic: 'Freie Gestaltung mit Kalenderkopf und Tagesraster',
      midcentury: 'Markante Typografie im Instrumenten-Look',
      bauhaus: 'Geometrische Akzente und klare Formen',
      gantt: 'Wochenraster für Projekt- und Zeitplanung',
      zen: 'Reduzierte Darstellung mit viel Weißraum',
      kursbuch: 'Fortlaufende Tagesnummern wie im Fahrplan',
    };
    container.innerHTML = '';
    Array.from(select.options).forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-card design-card';
      button.setAttribute('data-design-style', option.value);
      button.setAttribute('aria-pressed', 'false');
      const label = document.createElement('span');
      label.className = 'choice-card-title';
      label.textContent = option.textContent.split(' – ')[0].split(' / ')[0];
      const description = document.createElement('span');
      description.className = 'choice-card-description';
      description.textContent = descriptions[option.value];
      button.appendChild(label);
      button.appendChild(description);
      container.appendChild(button);
    });
  }

  function syncChoiceCards() {
    document.querySelectorAll('.design-card').forEach((button) => {
      const selected = button.getAttribute('data-design-style') === state.designStyle;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderPreview() {
    updateNextYearLink();
    window.CronoCanvas.render(canvas, container, state);
    publishCadSnapshot();
    updateCoverageStatus();
    invalidateStaleCoverageAdvice();
  }

  function renderThemeOptions() {
    const container = document.getElementById('theme-options');
    if (!container) return;
    container.innerHTML = '';
    window.CronoThemes.keys.forEach((key) => {
      const theme = window.CronoThemes.themes[key];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-pill';
      button.setAttribute('data-theme', key);
      button.setAttribute('aria-pressed', 'false');
      const label = document.createElement('span');
      label.className = 'text-xs font-semibold block text-slate-200';
      label.textContent = theme.label;
      const description = document.createElement('span');
      description.className = 'text-[10px] text-slate-400';
      description.textContent = theme.description;
      const swatches = document.createElement('span');
      swatches.className = 'theme-swatches';
      [theme.paperColor, theme.colorHeaderBg, theme.colorSaturdayBg, theme.colorSundayBg].forEach((color) => {
        const swatch = document.createElement('span');
        swatch.className = 'theme-swatch';
        swatch.style.backgroundColor = color;
        swatches.appendChild(swatch);
      });
      button.appendChild(label);
      button.appendChild(description);
      button.appendChild(swatches);
      container.appendChild(button);
    });
  }

  function updateNextYearLink() {
    const link = document.getElementById('next-year-link');
    const button = document.getElementById('btn-copy-next-year-link');
    const status = document.getElementById('next-year-link-status');
    let currentLink = document.getElementById('current-year-link');
    if (!currentLink && link && link.parentElement) {
      currentLink = document.createElement('a');
      currentLink.id = 'current-year-link';
      currentLink.className = 'block text-xs text-amber-400';
      currentLink.target = '_blank';
      currentLink.rel = 'noopener noreferrer';
      link.parentElement.insertBefore(currentLink, link);
    }
    try {
      const url = window.CronoShare.createNextYearUrl(state);
      link.href = url;
      link.textContent = `Einstellungen für ${state.year + 1} teilen`;
      if (currentLink && window.CronoShare.createCurrentUrl) {
        currentLink.href = window.CronoShare.createCurrentUrl(state);
        currentLink.textContent = `Vorlage für ${state.year}`;
      }
      button.disabled = false;
      status.textContent = '';
    } catch (error) {
      link.removeAttribute('href');
      link.textContent = '';
      button.disabled = true;
      status.textContent = `Link nicht verfügbar: ${error.message}`;
    }
  }

  // --- UI INPUTS SYNCHRONISIEREN ---
  function syncInputsFromState() {
    // Maße
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    const setChecked = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!val;
    };

    setVal('input-year', state.year);
    setVal('input-h-visible', state.hVisible);
    setVal('input-b-visible', state.bVisible);
    setVal('input-backpanel-offset-height', state.backpanelOffsetHeightMm);
    setVal('input-backpanel-offset-width', state.backpanelOffsetWidthMm);
    setChecked('checkbox-show-qr', state.qrEnabled);
    setVal('input-qr-gap', state.qrGapMm);
    setChecked('checkbox-show-vacations', state.showVacations);
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
    setChecked('checkbox-show-kw', state.showKW);
    setChecked('checkbox-show-moon', state.showMoon);
    setChecked('checkbox-show-cropmarks', state.showCropMarks);
    setVal('select-header-style', state.headerStyle);
    setVal('select-header-align', state.headerAlign);
    setVal('input-month-header-text-color', state.monthHeaderTextColor);
    setVal('input-month-header-text-size', state.monthHeaderTextSize);
    setVal('input-calendar-week-text-color', state.calendarWeekTextColor);
    setVal('input-calendar-week-text-size', state.calendarWeekTextSize);
    setVal('input-moon-opacity', state.moonOpacity);

    // Stil
    setVal('select-design-style', state.designStyle);
    syncChoiceCards();
    document.querySelectorAll('.theme-pill').forEach((pill) => {
      const selected = pill.getAttribute('data-theme') === state.themeKey;
      pill.classList.toggle('active', selected);
      pill.setAttribute('aria-pressed', String(selected));
    });
    const customFontOption = document.getElementById('option-custom-font');
    if (customFontOption) {
      const hasCustomFont = window.CronoFonts.hasCustomFont();
      customFontOption.hidden = !hasCustomFont;
      if (hasCustomFont) customFontOption.textContent = `Eigene Schrift (${window.CronoFonts.getCustomFontName()})`;
      if (state.fontFamily === 'custom' && !hasCustomFont) state.fontFamily = 'sans';
    }
    setVal('select-font-family', state.fontFamily);
    setVal('select-theme', state.themeKey || '');
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
    setVal('color-category-public', state.categoryColors.public);
    setVal('color-category-vacation', state.categoryColors.vacation);
    setVal('color-category-custom', state.categoryColors.custom);

    // Land & Region
    setVal('select-country', state.country);
    updateRegionDropdown();
    setVal('select-bundesland', state.bundesland);
    if (window.CronoBlossomColorPicker) window.CronoBlossomColorPicker.sync();
  }

  function updateRegionDropdown() {
    const sel = document.getElementById('select-bundesland');
    if (!sel) return;
    sel.innerHTML = '';

    if (state.country === 'DE') {
      const deRegions = [
        ['NW', 'Nordrhein-Westfalen (NW)'],
        ['BW', 'Baden-Württemberg (BW)'],
        ['BY', 'Bayern (BY)'],
        ['BE', 'Berlin (BE)'],
        ['BB', 'Brandenburg (BB)'],
        ['HB', 'Bremen (HB)'],
        ['HH', 'Hamburg (HH)'],
        ['HE', 'Hessen (HE)'],
        ['MV', 'Mecklenburg-Vorpommern (MV)'],
        ['NI', 'Niedersachsen (NI)'],
        ['RP', 'Rheinland-Pfalz (RP)'],
        ['SL', 'Saarland (SL)'],
        ['SN', 'Sachsen (SN)'],
        ['ST', 'Sachsen-Anhalt (ST)'],
        ['SH', 'Schleswig-Holstein (SH)'],
        ['TH', 'Thüringen (TH)'],
      ];
      deRegions.forEach(([k, n]) => sel.add(new Option(n, k)));
    } else if (state.country === 'AT') {
      const atRegions = [
        ['W', 'Wien (W)'],
        ['B', 'Burgenland (B)'],
        ['K', 'Kärnten (K)'],
        ['NOE', 'Niederösterreich (NÖ)'],
        ['OOE', 'Oberösterreich (OÖ)'],
        ['S', 'Salzburg (S)'],
        ['ST', 'Steiermark (ST)'],
        ['T', 'Tirol (T)'],
        ['V', 'Vorarlberg (V)'],
      ];
      atRegions.forEach(([k, n]) => sel.add(new Option(n, k)));
    } else if (state.country === 'CH') {
      const chRegions = [
        ['ZH', 'Zürich (ZH)'],
        ['BE', 'Bern (BE)'],
        ['LU', 'Luzern (LU)'],
        ['BS', 'Basel-Stadt (BS)'],
        ['BL', 'Basel-Landschaft (BL)'],
        ['SG', 'St. Gallen (SG)'],
        ['GR', 'Graubünden (GR)'],
        ['AG', 'Aargau (AG)'],
        ['GE', 'Genf (GE)'],
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
    const filtered = state.holidays.filter((h) => {
      if (state.holidayFilter === 'public' && h.type !== 'public') return false;
      if (state.holidayFilter === 'vacation' && h.type !== 'vacation') return false;
      if (state.holidayFilter === 'custom' && (h.type === 'public' || h.type === 'vacation')) return false;
      if (q && !h.title.toLowerCase().includes(q) && !h.start.includes(q)) return false;
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<p class="text-xs text-slate-500 italic p-2">Keine Termine gefunden.</p>';
      return;
    }

    filtered.forEach((h) => {
      const item = document.createElement('div');
      item.className = 'bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs transition hover:border-slate-700';
      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 w-2/3">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${h.color}"></span>
            <input type="text" value="${h.title}" data-id="${h.id}" data-field="title" aria-label="Terminbezeichnung" class="holiday-input bg-transparent font-semibold text-slate-200 focus:outline-none focus:border-b border-amber-500 w-full truncate">
          </div>
          <button data-id="${h.id}" title="Löschen" class="btn-delete-holiday text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-400">Beginn</label>
            <input type="date" value="${h.start}" data-id="${h.id}" data-field="start" aria-label="Beginn" class="holiday-input bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 w-full font-mono text-[11px]">
          </div>
          <div>
            <label class="text-[10px] text-slate-400">Ende</label>
            <input type="date" value="${h.end}" data-id="${h.id}" data-field="end" aria-label="Ende" class="holiday-input bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 w-full font-mono text-[11px]">
          </div>
        </div>
        <div class="flex items-center space-x-2 pt-0.5">
          <input type="color" value="${h.color}" data-id="${h.id}" data-field="color" aria-label="Farbe dieses Termins" class="holiday-input w-5 h-5 rounded cursor-pointer bg-transparent">
          <span class="text-[10px] text-slate-400">Farbe im Kalender</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded ml-auto font-mono ${h.type === 'public' ? 'bg-amber-500/20 text-amber-400' : h.type === 'vacation' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300'}">${h.type === 'public' ? 'Feiertag' : h.type === 'vacation' ? 'Ferien' : 'Eigener Termin'}</span>
        </div>
      `;
      listEl.appendChild(item);
    });

    listEl.querySelectorAll('.holiday-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const item = state.holidays.find((x) => x.id === id);
        if (item) {
          item[field] = e.target.value;
          renderPreview();
        }
      });
    });

    listEl.querySelectorAll('.btn-delete-holiday').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        state.holidays = state.holidays.filter((x) => x.id !== id);
        renderHolidaysList();
        renderPreview();
      });
    });
    if (window.CronoBlossomColorPicker) window.CronoBlossomColorPicker.sync(listEl);
  }

  // --- MODAL: TERMIN DIREKT AM KALENDER ANLEGEN/EDITIEREN ---
  function openEventModal(dateStr, title = '') {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    document.getElementById('modal-event-date-start').value = dateStr;
    document.getElementById('modal-event-date-end').value = dateStr;
    document.getElementById('modal-event-title').value = title;
    document.getElementById('modal-event-color').value = state.categoryColors.custom;
    if (window.CronoBlossomColorPicker) {
      window.CronoBlossomColorPicker.sync(document.getElementById('modal-event-color'));
    }
    document.getElementById('modal-event-title').focus();
    modal.classList.remove('hidden');
  }

  function closeEventModal() {
    const modal = document.getElementById('event-modal');
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
    keys.forEach((name) => {
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

    container.querySelectorAll('.btn-load-preset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        const data = presets[name];
        if (data) {
          const preset = data.fontFamily === 'custom' && !window.CronoFonts.hasCustomFont() ? { ...data, fontFamily: 'sans' } : data;
          if (preset !== data) {
            setFontStatus('Diese Vorlage verwendet eine eigene Schrift. Bitte lade die TTF-Datei erneut hoch.', true);
          }
          Object.assign(
            state,
            {
              designStyle: 'classic',
              themeKey: null,
              categoryColors: defaultCategoryColors(),
            },
            preset,
          );
          state.categoryColors = { ...defaultCategoryColors(), ...preset.categoryColors };
          localStorage.setItem('cronoscroll_design_style', state.designStyle);
          localStorage.setItem('cronoscroll_theme', state.themeKey || '');
          const defaults = defaultMonthSeparators();
          state.monthSeparators = {
            single: { ...defaults.single, ...(preset.monthSeparators && preset.monthSeparators.single) },
            double: { ...defaults.double, ...(preset.monthSeparators && preset.monthSeparators.double) },
          };
          syncInputsFromState();
          renderHolidaysList();
          renderPreview();
        }
      });
    });

    container.querySelectorAll('.btn-delete-preset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        delete presets[name];
        savePresets(presets);
        renderPresetsList();
      });
    });
  }

  function setAppMode(mode) {
    const isCadMode = mode === 'cad';
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url);

    const appContainer = document.getElementById('app-container');
    appContainer.classList.toggle('cad-mode', isCadMode);
    document.getElementById('cad-mode-root').setAttribute('aria-hidden', String(!isCadMode));
    window.dispatchEvent(new Event('cronoscroll:modechange'));

    document.querySelectorAll('[data-app-mode]').forEach((button) => {
      const selected = button.getAttribute('data-app-mode') === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const fitButton = document.getElementById('btn-zoom-fit-banner');
    fitButton.classList.toggle('header-control-hidden', !isCadMode && state.viewMode !== 'banner');
    fitButton.title = isCadMode ? 'CAD-Ansicht einpassen' : 'Rolle einpassen';
    fitButton.setAttribute('aria-label', isCadMode ? 'CAD-Ansicht einpassen' : 'Rolle einpassen');
    document.getElementById('header-calendar-nav').setAttribute('aria-hidden', String(isCadMode));

    if (!isCadMode) renderPreview();
  }

  function bindExportMenu(container, toggle, menu) {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const close = (restoreFocus = false) => {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) toggle.focus();
    };
    const open = (focusIndex = -1) => {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      if (focusIndex >= 0) items[focusIndex].focus();
    };

    toggle.addEventListener('click', () => {
      if (menu.hidden) open();
      else close();
    });
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        close(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open(event.key === 'ArrowUp' ? items.length - 1 : 0);
      }
    });
    menu.addEventListener('keydown', (event) => {
      const currentIndex = items.indexOf(document.activeElement);
      let nextIndex = currentIndex;
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % items.length;
      } else if (event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = items.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      items[nextIndex].focus();
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('[role="menuitem"]')) close(true);
    });
    container.addEventListener('focusout', () => {
      queueMicrotask(() => {
        if (!container.contains(document.activeElement)) close();
      });
    });
    document.addEventListener('pointerdown', (event) => {
      if (!container.contains(event.target)) close();
    });
  }

  // --- EVENTS BINDEN ---
  function bindEvents() {
    document.getElementById('btn-mode-calendar').addEventListener('click', () => {
      setAppMode('calendar');
      activateTabFromUrl();
    });
    document.getElementById('btn-mode-cad').addEventListener('click', () => setAppMode('cad'));
    bindExportMenu(document.getElementById('calendar-export-group'), document.getElementById('calendar-export-menu-toggle'), document.getElementById('calendar-export-menu'));

    // 1. Maße & Geometrie
    const bindNum = (id, prop) => {
      const el = document.getElementById(id);
      if (el)
        el.addEventListener('input', (e) => {
          state[prop] = parseFloat(e.target.value) || 0;
          renderPreview();
        });
    };
    bindNum('input-h-visible', 'hVisible');
    bindNum('input-b-visible', 'bVisible');
    bindNum('input-backpanel-offset-height', 'backpanelOffsetHeightMm');
    bindNum('input-backpanel-offset-width', 'backpanelOffsetWidthMm');
    bindNum('input-qr-gap', 'qrGapMm');
    bindNum('input-month-header-text-size', 'monthHeaderTextSize');
    bindNum('input-calendar-week-text-size', 'calendarWeekTextSize');
    bindNum('input-moon-opacity', 'moonOpacity');
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
    document.getElementById('checkbox-show-kw').addEventListener('change', (e) => {
      state.showKW = e.target.checked;
      renderPreview();
    });
    document.getElementById('checkbox-show-moon').addEventListener('change', (e) => {
      state.showMoon = e.target.checked;
      renderPreview();
    });
    const checkboxQr = document.getElementById('checkbox-show-qr');
    if (checkboxQr) checkboxQr.addEventListener('change', (e) => {
      state.qrEnabled = e.target.checked;
      renderPreview();
    });
    const checkboxVacations = document.getElementById('checkbox-show-vacations');
    if (checkboxVacations) checkboxVacations.addEventListener('change', (e) => {
      state.showVacations = e.target.checked;
      loadDefaultHolidays();
      renderHolidaysList();
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
    ['input-month-header-text-color'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', e => {
        state.monthHeaderTextColor = e.target.value;
        renderPreview();
      });
    });
    ['input-calendar-week-text-color'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', e => {
        state.calendarWeekTextColor = e.target.value;
        renderPreview();
      });
    });
    document.getElementById('select-font-family').addEventListener('change', (e) => {
      state.fontFamily = e.target.value;
      renderPreview();
    });
    document.getElementById('select-design-style').addEventListener('change', (e) => {
      state.designStyle = e.target.value;
      localStorage.setItem('cronoscroll_design_style', state.designStyle);
      syncChoiceCards();
      renderPreview();
    });
    document.querySelectorAll('.design-card').forEach((button) => {
      button.addEventListener('click', () => {
        state.designStyle = button.getAttribute('data-design-style');
        document.getElementById('select-design-style').value = state.designStyle;
        localStorage.setItem('cronoscroll_design_style', state.designStyle);
        syncChoiceCards();
        renderPreview();
      });
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
      const message = `„${file.name}“ ist geladen und wird in die PDF eingebettet.`;
      setFontStatus(result.hasOversizedKernTable ? `${message} Die Kerning-Tabelle ist zu groß und wird möglicherweise vom Browser verworfen.` : message, false, !result.hasOversizedKernTable, result.hasOversizedKernTable);
      renderPreview();
    });

    // 2. Farben
    const bindColor = (id, prop) => {
      const el = document.getElementById(id);
      if (el)
        el.addEventListener('input', (e) => {
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
    [
      ['color-category-public', 'public'],
      ['color-category-vacation', 'vacation'],
      ['color-category-custom', 'custom'],
    ].forEach(([id, category]) => {
      document.getElementById(id).addEventListener('input', (event) => {
        applyCategoryColor(category, event.target.value);
      });
    });

    // 3. 1-Klick Theme Buttons
    const themeSelect = document.getElementById('select-theme');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (!key) {
          state.themeKey = null;
          localStorage.setItem('cronoscroll_theme', '');
          syncInputsFromState();
          renderPreview();
          return;
        }
        if (window.CronoThemes.apply(state, key)) {
          localStorage.setItem('cronoscroll_theme', state.themeKey);
          syncInputsFromState();
          renderPreview();
        }
      });
    }
    document.querySelectorAll('.theme-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const key = pill.getAttribute('data-theme');
        if (window.CronoThemes.apply(state, key)) {
          localStorage.setItem('cronoscroll_theme', state.themeKey);
          syncInputsFromState();
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
    document.querySelectorAll('.btn-filter-holiday').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.holidayFilter = btn.getAttribute('data-filter');
        document.querySelectorAll('.btn-filter-holiday').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
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
          state.holidays = [
            ...state.holidays,
            ...events.map((event) => ({
              ...event,
              color: state.categoryColors.custom,
            })),
          ];
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
        type: 'custom',
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
    document.getElementById('btn-copy-next-year-link').addEventListener('click', async () => {
      const status = document.getElementById('next-year-link-status');
      try {
        await navigator.clipboard.writeText(window.CronoShare.createNextYearUrl(state));
        status.textContent = 'Link kopiert.';
      } catch (error) {
        status.textContent = `Link konnte nicht kopiert werden: ${error.message}`;
      }
    });
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

    // 11. Export-Aktionen
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      try {
        window.CronoPDF.exportPlotterPDF(state);
      } catch (error) {
        alert(`RGB-Plotter-PDF konnte nicht erstellt werden: ${error.message}`);
      }
    });
    document.getElementById('btn-export-svg').addEventListener('click', () => {
      window.CronoVector.exportSVG(state);
    });
    document.getElementById('btn-export-png').addEventListener('click', () => {
      window.CronoVector.exportHighResPNG(state);
    });

    // 12. Reiter-Umschaltung
    const activateTab = (btn, focus = false) => {
      const tabId = btn.getAttribute('data-tab');
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId.replace(/^tab-/, ''));
      window.history.replaceState(null, '', url);

      document.querySelectorAll('.tab-btn').forEach((b) => {
        const selected = b === btn;
        b.classList.remove('text-amber-400', 'border-b-2', 'border-amber-400', 'font-semibold');
        b.classList.add('text-slate-400');
        b.setAttribute('aria-selected', String(selected));
        b.tabIndex = selected ? 0 : -1;
      });
      btn.classList.add('text-amber-400', 'border-b-2', 'border-amber-400', 'font-semibold');
      btn.classList.remove('text-slate-400');

      document.querySelectorAll('.tab-content').forEach((c) => c.classList.add('hidden'));
      document.getElementById(tabId).classList.remove('hidden');
      if (focus && btn.focus) btn.focus();
    };
    function activateTabFromUrl() {
      const requestedTab = new URLSearchParams(window.location.search).get('tab');
      if (!['geometry', 'layout', 'style', 'holidays', 'presets'].includes(requestedTab)) return;
      const tabButton = Array.from(document.querySelectorAll('.tab-btn'))
        .find((button) => button.getAttribute('data-tab') === `tab-${requestedTab}`);
      if (tabButton) activateTab(tabButton);
    }
    document.querySelectorAll('.tab-btn').forEach((btn, index, buttons) => {
      btn.addEventListener('click', () => activateTab(btn));
      btn.addEventListener('keydown', (event) => {
        const lastIndex = buttons.length - 1;
        const nextIndex = event.key === 'ArrowRight' ? (index + 1) % buttons.length : event.key === 'ArrowLeft' ? (index + lastIndex) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? lastIndex : -1;
        if (nextIndex < 0) return;
        event.preventDefault();
        activateTab(buttons[nextIndex], true);
      });
    });

    // 13. Ansichtsmodus & Navigation
    const btnModePlate = document.getElementById('btn-mode-plate');
    const btnModeBanner = document.getElementById('btn-mode-banner');
    const plateNav = document.getElementById('plate-nav-controls');
    const btnFitBanner = document.getElementById('btn-zoom-fit-banner');

    btnModePlate.addEventListener('click', () => {
      state.viewMode = 'plate';
      btnModePlate.classList.add('active');
      btnModeBanner.classList.remove('active');
      btnModePlate.setAttribute('aria-pressed', 'true');
      btnModeBanner.setAttribute('aria-pressed', 'false');
      plateNav.classList.remove('header-control-hidden');
      btnFitBanner.classList.add('header-control-hidden');
      btnFitBanner.title = 'Rolle einpassen';
      state.zoom = 1.0;
      renderPreview();
    });

    btnModeBanner.addEventListener('click', () => {
      state.viewMode = 'banner';
      btnModeBanner.classList.add('active');
      btnModePlate.classList.remove('active');
      btnModeBanner.setAttribute('aria-pressed', 'true');
      btnModePlate.setAttribute('aria-pressed', 'false');
      plateNav.classList.add('header-control-hidden');
      btnFitBanner.classList.remove('header-control-hidden');
      btnFitBanner.title = 'Rolle einpassen';
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
      if (e.defaultPrevented) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (document.getElementById('app-container').classList.contains('cad-mode')) return;
      if (e.key === 'ArrowLeft') stepMonth(-1);
      if (e.key === 'ArrowRight') stepMonth(1);
    });

    // 14. Zoom & Pan
    const adjustManualZoom = (delta) => {
      if (delta < 0 && state.zoom < 0.15) {
        state.zoom = Math.max(Number.MIN_VALUE, state.zoom * (1 + delta));
      } else {
        state.zoom = Math.max(0.15, Math.min(3.5, state.zoom + delta));
      }
      renderPreview();
    };

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      if (document.getElementById('app-container').classList.contains('cad-mode')) return;
      adjustManualZoom(0.2);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      if (document.getElementById('app-container').classList.contains('cad-mode')) return;
      adjustManualZoom(-0.2);
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      if (document.getElementById('app-container').classList.contains('cad-mode')) return;
      state.zoom = 1.0;
      renderPreview();
    });
    btnFitBanner.addEventListener('click', () => {
      if (document.getElementById('app-container').classList.contains('cad-mode')) return;
      if (state.viewMode !== 'banner') return;
      const geo = window.CronoGeometry.calculate(state);
      const style = window.getComputedStyle(container);
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availableWidth = container.clientWidth - horizontalPadding - 16;
      const unscaledWidth = geo.lTotal * 20;
      if (!Number.isFinite(availableWidth) || availableWidth <= 0
        || !Number.isFinite(unscaledWidth) || unscaledWidth <= 0) return;
      const fitZoom = Math.min(1.0, availableWidth / unscaledWidth);
      if (!Number.isFinite(fitZoom) || fitZoom <= 0) return;
      state.zoom = fitZoom;
      renderPreview();
    });

    // Zoom per Mausrad
    container.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.1 : -0.1;
          adjustManualZoom(delta);
        }
      },
      { passive: false },
    );

    // Dragging des roten 3-Monats-Fensters im Bannermodus
    canvas.addEventListener('mousedown', (e) => {
      if (state.viewMode !== 'banner') return;
      const rect = canvas.getBoundingClientRect();
      const pxPerCm = 20 * state.zoom;
      const clickXCm = (e.clientX - rect.left) / pxPerCm;
      const geo = window.CronoGeometry.calculate(state);
      const viewportXCm = geo.pufferLeft + state.currentMonthIndex * geo.bMonth;

      if (clickXCm >= viewportXCm && clickXCm <= viewportXCm + state.bVisible) {
        state.isDraggingViewport = true;
        state.dragStartX = clickXCm - state.currentMonthIndex * geo.bMonth;
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

    document.getElementById('btn-analyze-coverage').addEventListener('click', refreshCoverageAdvice);
    document.getElementById('coverage-recommendations').addEventListener('click', (event) => {
      const button = event.target.closest && event.target.closest('[data-coverage-action]');
      if (button) applyCoverageAdvice(button.getAttribute('data-coverage-action'));
    });

    return activateTab;
  }

  // Initialisierung beim Laden
  window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    const initialMode = ['calendar', 'cad'].includes(requestedMode) ? requestedMode : null;
    const requestedTab = params.get('tab');
    const initialTab = ['geometry', 'layout', 'style', 'holidays', 'presets'].includes(requestedTab) ? requestedTab : null;
    const savedDesign = localStorage.getItem('cronoscroll_design_style');
    if (['classic', 'midcentury', 'bauhaus', 'gantt', 'zen', 'kursbuch'].includes(savedDesign)) {
      state.designStyle = savedDesign;
    }
    const savedTheme = localStorage.getItem('cronoscroll_theme');
    if (window.CronoThemes.isValidKey(savedTheme)) window.CronoThemes.apply(state, savedTheme);
    window.CronoShare.restore(window.location.search, state);
    state.categoryColors = { ...defaultCategoryColors(), ...state.categoryColors };
    localStorage.setItem('cronoscroll_design_style', state.designStyle);
    localStorage.setItem('cronoscroll_theme', state.themeKey || '');
    if (state.fontFamily === 'custom' && !window.CronoFonts.hasCustomFont()) {
      setFontStatus('Der Link verwendet eine eigene Schrift. Bitte lade die TTF-Datei erneut hoch.', true);
    }
    loadDefaultHolidays();
    renderDesignOptions();
    renderThemeOptions();
    syncInputsFromState();
    renderHolidaysList();
    renderPresetsList();
    const activateTab = bindEvents();
    if (initialMode) setAppMode(initialMode);
    if ((initialMode || 'calendar') === 'calendar' && initialTab) {
      const tabButton = Array.from(document.querySelectorAll('.tab-btn')).find((button) => button.getAttribute('data-tab') === `tab-${initialTab}`);
      if (tabButton) activateTab(tabButton);
    }
    renderPreview();
    window.CronoFonts.loadStandardFonts().then(renderPreview, (error) => {
      setFontStatus(`Standardschriften konnten nicht für die Vorschau geladen werden: ${error.message}`, true);
    });
  });
})();
