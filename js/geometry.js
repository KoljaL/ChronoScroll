/**
 * CRONOSCROLL — GEOMETRY & MATHEMATICAL ENGINE
 * Berechnet millimetergenaue Maße für Schreibplatte, Banner und DIY-Holzgestell.
 */

window.CronoGeometry = (function() {
  'use strict';

  function calculate(state) {
    const bVisible = Math.max(10, parseFloat(state.bVisible) || 42.0); // cm
    const hVisible = Math.max(10, parseFloat(state.hVisible) || 32.0); // cm
    const pufferLeft = Math.max(0, parseFloat(state.pufferLeft ?? state.puffer) || 15.0); // cm
    const pufferRight = Math.max(0, parseFloat(state.pufferRight ?? state.puffer) || 15.0); // cm
    
    // Monatspalten-Breite (exakt 1/3 der Sichtbreite)
    const bMonth = bVisible / 3;
    
    // Tageszeilen-Höhe (1 Header-Zeile + 31 Tage = 32 Zeilen)
    const hDay = hVisible / 32;
    
    // Gesamte Bannerlänge für 14 Monate (Dezember Vorjahr + 12 Zieljahr + Januar Folgejahr)
    const lTotal = (14 * bMonth) + pufferLeft + pufferRight;
    
    // Unterteilung für Mehrpersonen-/Familienkalender
    const subColumns = Math.max(1, Math.min(6, parseInt(state.subColumns) || 1));
    const subColumnWidth = bMonth / subColumns;
    
    // Millimeter-Werte (für Vektor-PDF und Schnittpläne)
    const bVisibleMm = bVisible * 10;
    const hVisibleMm = hVisible * 10;
    const bMonthMm = bMonth * 10;
    const hDayMm = hDay * 10;
    const pufferLeftMm = pufferLeft * 10;
    const pufferRightMm = pufferRight * 10;
    const lTotalMm = lTotal * 10;
    const subColumnWidthMm = subColumnWidth * 10;

    // Berechnung des Holz-Bausatzes für den Heimwerker
    // Obere & untere Querleisten: Sichtbreite + beidseitiger Überstand für Rollenlager
    const woodRailLengthCm = bVisible + (pufferLeft > 0 ? 12 : 8) + (pufferRight > 0 ? 12 : 8);
    const roundDowelLengthCm = hVisible + 5.0; // 5 cm Überstand für Drehknäufe & Lager
    const backingBoardCm = {
      width: bVisible,
      height: hVisible,
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
      subColumns,
      subColumnWidth,
      // mm
      bVisibleMm,
      hVisibleMm,
      bMonthMm,
      hDayMm,
      pufferLeftMm,
      pufferRightMm,
      lTotalMm,
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

  return {
    calculate,
    getISOWeek
  };
})();
