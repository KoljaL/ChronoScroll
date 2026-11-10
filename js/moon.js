/**
 * CRONOSCROLL — ASTRONOMICAL MOON PHASE ENGINE
 * Berechnet exakte Mondphasen (Neumond, Erstes Viertel, Vollmond, Letztes Viertel).
 */

window.CronoMoon = (function() {
  'use strict';

  const SYNODIC_MONTH = 29.53058867; // Tage eines synodischen Mondmonats
  // Referenz-Neumond: 6. Januar 2000, 18:14 UTC
  const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

  function getMoonPhaseForDate(year, monthIndex, day) {
    const targetUtc = Date.UTC(year, monthIndex, day, 12, 0, 0);
    const diffDays = (targetUtc - REF_NEW_MOON) / 86400000;
    const age = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

    // Toleranzfenster für Kalendertag-Zuordnung (ca. 0.7 Tage)
    const tol = 0.75;

    if (age <= tol || age >= (SYNODIC_MONTH - tol)) {
      return { type: 'new', symbol: '●', unicode: '🌑', label: 'Neumond' };
    }
    if (Math.abs(age - 7.3826) <= tol) {
      return { type: 'first_quarter', symbol: '◐', unicode: '🌓', label: 'Erstes Viertel' };
    }
    if (Math.abs(age - 14.7653) <= tol) {
      return { type: 'full', symbol: '○', unicode: '🌕', label: 'Vollmond' };
    }
    if (Math.abs(age - 22.1479) <= tol) {
      return { type: 'last_quarter', symbol: '◑', unicode: '🌗', label: 'Letztes Viertel' };
    }

    return null;
  }

  return {
    getMoonPhaseForDate
  };
})();
