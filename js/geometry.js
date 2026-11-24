/**
 * CRONOSCROLL — GEOMETRY & MATHEMATICAL ENGINE
 * Berechnet millimetergenaue Maße für Schreibplatte, Banner und DIY-Holzgestell.
 */

window.CronoGeometry = (function() {
  'use strict';

  function calculate(state) {
    const bVisible = Math.max(10, parseFloat(state.bVisible) || 42.0); // cm
    const hVisible = Math.max(10, parseFloat(state.hVisible) || 30.0); // cm
    const left = parseFloat(state.pufferLeft ?? state.puffer);
    const right = parseFloat(state.pufferRight ?? state.puffer);
    const pufferLeft = Math.max(0, Number.isFinite(left) ? left : 15.0); // cm
    const pufferRight = Math.max(0, Number.isFinite(right) ? right : 15.0); // cm
    const rawWindLeft = parseFloat(state.windingAllowanceLeftMm ?? 0);
    const rawWindRight = parseFloat(state.windingAllowanceRightMm ?? 0);
    const windingAllowanceLeftMm = Math.min(200, Math.max(0, Number.isFinite(rawWindLeft) ? rawWindLeft : 0));
    const windingAllowanceRightMm = Math.min(200, Math.max(0, Number.isFinite(rawWindRight) ? rawWindRight : 0));
    
    // Monatspalten-Breite (exakt 1/3 der Sichtbreite)
    const bMonth = bVisible / 3;
    
    const monthLayout = state.monthLayout === 'double' ? 'double' : 'single';
    const dayColumns = monthLayout === 'double' ? 2 : 1;
    const daysPerColumn = monthLayout === 'double' ? 16 : 31;
    const hDay = hVisible / (daysPerColumn + 1);

    function getDayPosition(dayNum) {
      if (dayColumns === 1) return { column: 0, row: dayNum - 1 };
      return dayNum <= 15
        ? { column: 0, row: dayNum - 1 }
        : { column: 1, row: dayNum - 16 };
    }
    
    // Gesamte Bannerlänge für 14 Monate (Dezember Vorjahr + 12 Zieljahr + Januar Folgejahr)
    const lTotal = (14 * bMonth) + pufferLeft + pufferRight + (windingAllowanceLeftMm + windingAllowanceRightMm) / 10;
    
    // Unterteilung für Mehrpersonen-/Familienkalender
    const subColumns = Math.max(1, Math.min(6, parseInt(state.subColumns) || 1));
    const dayColumnWidth = bMonth / dayColumns;
    const subColumnWidth = dayColumnWidth / subColumns;

    const separator = state.monthSeparators && state.monthSeparators[monthLayout];
    const separatorWidthMm = separator && separator.enabled && Number.isFinite(separator.widthMm)
      ? Math.min(20, Math.max(0, separator.widthMm)) : 0;
    const separatorWidth = separatorWidthMm / 10;

    function getMonthMetrics(monthIndex) {
      const leftInset = monthIndex > 0 ? separatorWidth / 2 : 0;
      const rightInset = monthIndex < 13 ? separatorWidth / 2 : 0;
      const contentWidth = bMonth - leftInset - rightInset;
      return {
        leftInset,
        rightInset,
        contentWidth,
        dayColumnWidth: contentWidth / dayColumns,
        leftInsetMm: leftInset * 10,
        rightInsetMm: rightInset * 10,
        contentWidthMm: contentWidth * 10,
        dayColumnWidthMm: contentWidth * 10 / dayColumns
      };
    }
    
    // Millimeter-Werte (für Vektor-PDF und Schnittpläne)
    const bVisibleMm = bVisible * 10;
    const hVisibleMm = hVisible * 10;
    const bMonthMm = bMonth * 10;
    const hDayMm = hDay * 10;
    const pufferLeftMm = pufferLeft * 10;
    const pufferRightMm = pufferRight * 10;
    const leadInMm = pufferLeftMm + windingAllowanceLeftMm;
    const leadOutMm = pufferRightMm + windingAllowanceRightMm;
    const lTotalMm = lTotal * 10;
    const dayColumnWidthMm = dayColumnWidth * 10;
    const subColumnWidthMm = subColumnWidth * 10;

    // Berechnung des Holz-Bausatzes für den Heimwerker
    // Obere & untere Querleisten: Sichtbreite + beidseitiger Überstand für Rollenlager
    const woodRailLengthCm = bVisible + (pufferLeft > 0 ? 12 : 8) + (pufferRight > 0 ? 12 : 8);
    const roundDowelLengthCm = hVisible + 5.0; // 5 cm Überstand für Drehknäufe & Lager
    const offsetWidth = parseFloat(state.backpanelOffsetWidthMm);
    const offsetHeight = parseFloat(state.backpanelOffsetHeightMm);
    const backingBoardCm = {
      width: bVisible + (Math.max(0, Number.isFinite(offsetWidth) ? offsetWidth : 4.0) / 10),
      height: hVisible + (Math.max(0, Number.isFinite(offsetHeight) ? offsetHeight : 2.0) / 10),
      thicknessMm: 4.0 // Empfehlung: 4-6 mm Multiplex / Acrylglas
    };

    return {
      bVisible,
      hVisible,
      pufferLeft,
      pufferRight,
      puffer: pufferLeft,
      bMonth,
      hDay,
      lTotal,
      monthLayout,
      dayColumns,
      daysPerColumn,
      getDayPosition,
      dayColumnWidth,
      subColumns,
      subColumnWidth,
      separatorWidth,
      separatorWidthMm,
      getMonthMetrics,
      // mm
      bVisibleMm,
      hVisibleMm,
      bMonthMm,
      hDayMm,
      pufferLeftMm,
      pufferRightMm,
      windingAllowanceLeftMm,
      windingAllowanceRightMm,
      leadInMm,
      leadOutMm,
      lTotalMm,
      dayColumnWidthMm,
      subColumnWidthMm,
      // DIY Wood Kit
      woodRailLengthCm,
      roundDowelLengthCm,
      backingBoardCm
    };
  }

  // ISO 8601 Kalenderwoche ermitteln (Donnerstag-Regel)
  function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function flattenColor(color, background = '#ffffff') {
    const parse = value => {
      const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value || '');
      if (!match) throw new Error(`Ungültige Farbe: ${value}`);
      return {
        rgb: match[1].match(/../g).map(channel => parseInt(channel, 16)),
        alpha: match[2] ? parseInt(match[2], 16) / 255 : 1
      };
    };
    const foreground = parse(color);
    const base = parse(background);
    const rgb = foreground.rgb.map((value, i) => {
      const paper = base.rgb[i] * base.alpha + 255 * (1 - base.alpha);
      return Math.round(value * foreground.alpha + paper * (1 - foreground.alpha));
    });
    return `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`;
  }

  function calendarFilename(title, year) {
    const fallback = `Rollkalender-${year}`;
    return String(title || fallback).trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, '-') || fallback;
  }

  function createQr(state, geo, dependencies = window) {
    if (state.qrEnabled === false) return null;
    if (typeof dependencies.qrcode !== 'function' || !dependencies.CronoShare) {
      throw new Error('QR-Code-Bibliothek oder Teilen-Funktion ist nicht verfügbar.');
    }
    const qr = dependencies.qrcode(0, 'L');
    qr.addData(dependencies.CronoShare.createNextYearUrl(state));
    try {
      qr.make();
    } catch (error) {
      throw new Error(`QR-Code konnte nicht erstellt werden: ${error.message || error}`);
    }
    const count = qr.getModuleCount();
    const gap = Math.max(0, Number.isFinite(state.qrGapMm) ? state.qrGapMm : 40);
    const size = Math.min(geo.pufferRightMm - gap, geo.hVisibleMm - 10, 100);
    const moduleSize = size / (count + 8);
    if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(size) || moduleSize < 0.25) {
      throw new Error('Der rechte Montagepuffer ist für QR-Code und Abstand zu schmal. Bitte den Nachlauf vergrößern oder den QR-Code deaktivieren.');
    }
    const leadOutMm = geo.leadOutMm ?? geo.pufferRightMm;
    return {
      qr, count, size, moduleSize,
      x: geo.lTotalMm - leadOutMm + gap,
      y: (geo.hVisibleMm - size) / 2
    };
  }

  return {
    calculate,
    getISOWeek,
    flattenColor,
    calendarFilename,
    createQr
  };
})();
