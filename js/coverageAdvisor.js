window.CronoCoverageAdvisor = (function() {
  'use strict';

  const MINIMUM_COLOR_REDUCTION = 0.05;

  function normalizeColor(color) {
    return typeof color === 'string' ? color.toLowerCase() : '';
  }

  function toGrayscale(color) {
    const match = /^#?([0-9a-f]{6})$/i.exec(color || '');
    if (!match) return color;
    const value = match[1];
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    const gray = Math.round(0.299 * red + 0.587 * green + 0.114 * blue)
      .toString(16).padStart(2, '0');
    return `#${gray}${gray}${gray}`;
  }

  function getAlternatives(state) {
    const alternatives = [];
    if (normalizeColor(state.paperColor) !== '#ffffff') {
      alternatives.push({
        id: 'paper-white',
        title: 'Papierfarbe auf Weiß setzen',
        description: 'Die Papierfarbe liegt unter der gesamten Rolle. Weiß reduziert die dafür gedruckten Farbkanäle.',
        state: { ...state, paperColor: '#ffffff' }
      });
    }

    if (normalizeColor(state.colorSaturdayBg) !== normalizeColor(state.paperColor)) {
      alternatives.push({
        id: 'saturday-background',
        title: 'Samstagshintergrund an Papierfarbe angleichen',
        description: 'Entfernt die zusätzliche Hintergrundfarbe aus den Samstagsfeldern.',
        state: { ...state, colorSaturdayBg: state.paperColor }
      });
    }

    if (normalizeColor(state.colorSundayBg) !== normalizeColor(state.paperColor)) {
      alternatives.push({
        id: 'sunday-background',
        title: 'Sonntagshintergrund an Papierfarbe angleichen',
        description: 'Entfernt die zusätzliche Hintergrundfarbe aus den Sonntagsfeldern.',
        state: { ...state, colorSundayBg: state.paperColor }
      });
    }

    const layout = state.monthLayout === 'double' ? 'double' : 'single';
    const separator = state.monthSeparators && state.monthSeparators[layout];
    if (separator && separator.enabled && separator.colorMode !== 'paper') {
      alternatives.push({
        id: 'month-separator',
        title: 'Monatstrennstreifen in Papierfarbe drucken',
        description: 'Der Streifen bleibt sichtbar, verwendet aber keine zusätzliche Sonderfarbe.',
        state: {
          ...state,
          monthSeparators: {
            ...state.monthSeparators,
            [layout]: { ...separator, colorMode: 'paper' }
          }
        }
      });
    }

    if (Array.isArray(state.holidays)) {
      const grayscaleHolidays = state.holidays.map(holiday => ({
        ...holiday,
        color: toGrayscale(holiday.color)
      }));
      if (grayscaleHolidays.some((holiday, index) =>
        normalizeColor(holiday.color) !== normalizeColor(state.holidays[index].color))) {
        alternatives.push({
          id: 'holiday-colors-grayscale',
          title: 'Feiertags- und Terminfarben entsättigen',
          description: 'Stellt alle Feiertags- und Terminfarben auf ähnliche Graustufen um; die Farbcodierung geht dabei verloren.',
          state: { ...state, holidays: grayscaleHolidays }
        });
      }
    }

    return alternatives;
  }

  function analyze(state, estimateCoverage) {
    const baseline = estimateCoverage(state);
    return getAlternatives(state)
      .map(alternative => {
        const estimate = estimateCoverage(alternative.state);
        return {
          id: alternative.id,
          title: alternative.title,
          description: alternative.description,
          colorReduction: baseline.colorPercent - estimate.colorPercent,
          blackChange: estimate.blackPercent - baseline.blackPercent
        };
      })
      .filter(recommendation => recommendation.colorReduction >= MINIMUM_COLOR_REDUCTION)
      .sort((left, right) => right.colorReduction - left.colorReduction);
  }

  function apply(state, recommendationId) {
    switch (recommendationId) {
      case 'paper-white':
        if (normalizeColor(state.paperColor) === '#ffffff') return false;
        state.paperColor = '#ffffff';
        return true;
      case 'saturday-background':
        if (normalizeColor(state.colorSaturdayBg) === normalizeColor(state.paperColor)) return false;
        state.colorSaturdayBg = state.paperColor;
        return true;
      case 'sunday-background':
        if (normalizeColor(state.colorSundayBg) === normalizeColor(state.paperColor)) return false;
        state.colorSundayBg = state.paperColor;
        return true;
      case 'month-separator': {
        const layout = state.monthLayout === 'double' ? 'double' : 'single';
        const separator = state.monthSeparators && state.monthSeparators[layout];
        if (!separator || !separator.enabled || separator.colorMode === 'paper') return false;
        separator.colorMode = 'paper';
        return true;
      }
      case 'holiday-colors-grayscale': {
        if (!Array.isArray(state.holidays)) return false;
        let changed = false;
        state.holidays.forEach(holiday => {
          const color = toGrayscale(holiday.color);
          if (normalizeColor(color) !== normalizeColor(holiday.color)) {
            holiday.color = color;
            changed = true;
          }
        });
        return changed;
      }
      default:
        throw new Error(`Unbekannte Farbempfehlung: ${recommendationId}`);
    }
  }

  return { analyze, apply };
})();
