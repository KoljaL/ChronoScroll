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
    const lTotal = (14 * bMonth) + pufferLeft + pufferRight;
    
    // Unterteilung für Mehrpersonen-/Familienkalender
    const subColumns = Math.max(1, Math.min(6, parseInt(state.subColumns) || 1));
    const dayColumnWidth = bMonth / dayColumns;
    const subColumnWidth = dayColumnWidth / subColumns;
    
    // Millimeter-Werte (für Vektor-PDF und Schnittpläne)
    const bVisibleMm = bVisible * 10;
    const hVisibleMm = hVisible * 10;
    const bMonthMm = bMonth * 10;
    const hDayMm = hDay * 10;
    const pufferLeftMm = pufferLeft * 10;
    const pufferRightMm = pufferRight * 10;
    const lTotalMm = lTotal * 10;
    const dayColumnWidthMm = dayColumnWidth * 10;
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
      monthLayout,
      dayColumns,
      daysPerColumn,
      getDayPosition,
      dayColumnWidth,
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

  return {
    calculate,
    getISOWeek
  };
})();
