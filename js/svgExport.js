/**
 * CRONOSCROLL — SVG & 300 DPI PNG EXPORT ENGINE
 * Skalierbare Vektorgrafiken für Laser- & Schneideplotter (Illustrator, Inkscape)
 * sowie hochauflösende Rastergrafiken (300 DPI Print).
 */

window.CronoVector = (function() {
  'use strict';

  function exportSVG(state) {
    const geo = window.CronoGeometry.calculate(state);
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);

    const wMm = geo.lTotalMm;
    const hMm = geo.hVisibleMm;
    const leadInMm = geo.pufferLeftMm;
    const leadOutMm = geo.pufferRightMm;

    let svg = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${wMm} ${hMm}">`,
      `<style>`,
      `  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }`,
      `  .header-text { font-weight: bold; font-size: 3.2mm; fill: ${state.colorText}; }`,
      `  .day-text { font-size: 2.6mm; fill: ${state.colorText}; }`,
      `  .wk-text { font-size: 2.6mm; fill: ${state.colorSundayText || '#e11d48'}; }`,
      `  .kw-text { font-size: 2.0mm; font-weight: bold; fill: #64748b; }`,
      `  .holiday-text { font-size: 2.1mm; font-style: italic; fill: #1e293b; text-anchor: end; }`,
      `  .grid-line { stroke: ${state.colorGrid}; stroke-width: ${state.lineGrid}mm; }`,
      `  .border-line { stroke: ${state.colorBorder || '#0f172a'}; stroke-width: ${state.lineBorder}mm; fill: none; }`,
      `</style>`,
      `<g id="background">`,
      `  <rect x="0" y="0" width="${wMm}" height="${hMm}" fill="${state.paperColor || '#ffffff'}"/>`,
      `  <rect x="0" y="0" width="${leadInMm}" height="${hMm}" fill="#f8fafc"/>`,
      `  <rect x="${wMm - leadOutMm}" y="0" width="${leadOutMm}" height="${hMm}" fill="#f8fafc"/>`,
      `</g>`,
      `<g id="grid">`
    ];

    // 14 Monate
    monthsData.forEach((month, mIdx) => {
      const monthLeftMm = leadInMm + (mIdx * geo.bMonthMm);

      // Header Zelle
      svg.push(`  <rect x="${monthLeftMm}" y="0" width="${geo.bMonthMm}" height="${geo.hDayMm}" fill="${state.colorHeaderBg || '#f1f5f9'}" stroke="${state.colorGrid}" stroke-width="${state.lineGrid}"/>`);
      const hAlign = (state.headerAlign === 'left') ? 'start' : 'middle';
      const hX = (state.headerAlign === 'left') ? (monthLeftMm + 2.5) : (monthLeftMm + geo.bMonthMm / 2);
      svg.push(`  <text x="${hX}" y="${geo.hDayMm / 2 + 1.1}" text-anchor="${hAlign}" class="header-text">${month.label.toUpperCase()}</text>`);

      month.days.forEach((day, dIdx) => {
        const rowTopMm = (dIdx + 1) * geo.hDayMm;

        let bg = 'none';
        if (!day.isValid) bg = '#fafafa';
        else if (day.holiday && day.holiday.color) bg = day.holiday.color;
        else if (day.isSunday) bg = state.colorSundayBg || state.colorWeekendBg;
        else if (day.isSaturday) bg = state.colorSaturdayBg || state.colorWeekendBg;

        if (bg !== 'none') {
          svg.push(`  <rect x="${monthLeftMm}" y="${rowTopMm}" width="${geo.bMonthMm}" height="${geo.hDayMm}" fill="${bg}"/>`);
        }

        // Zellrand
        svg.push(`  <rect x="${monthLeftMm}" y="${rowTopMm}" width="${geo.bMonthMm}" height="${geo.hDayMm}" fill="none" stroke="${state.colorGrid}" stroke-width="${state.lineGrid}"/>`);

        if (day.isValid) {
          // Schreiblinien
          if (state.guideLinesCount > 0) {
            const stepMm = geo.hDayMm / (state.guideLinesCount + 1);
            for (let g = 1; g <= state.guideLinesCount; g++) {
              const gY = rowTopMm + (g * stepMm);
              svg.push(`  <line x1="${monthLeftMm + 7}" y1="${gY}" x2="${monthLeftMm + geo.bMonthMm - 2}" y2="${gY}" stroke="${state.colorGrid}" stroke-width="0.15" stroke-dasharray="0.8,0.8"/>`);
            }
          }

          // Sub-Columns
          if (geo.subColumns > 1) {
            for (let sc = 1; sc < geo.subColumns; sc++) {
              const scX = monthLeftMm + (sc * geo.subColumnWidthMm);
              svg.push(`  <line x1="${scX}" y1="${rowTopMm}" x2="${scX}" y2="${rowTopMm + geo.hDayMm}" stroke="${state.colorGrid}" stroke-width="0.2" stroke-dasharray="1,1"/>`);
            }
          }

          // Text Tag
          const tCls = (day.isSunday || day.isSaturday) ? 'wk-text' : 'day-text';
          const textY = rowTopMm + (geo.hDayMm / 2) + 0.9;
          svg.push(`  <text x="${monthLeftMm + 2.5}" y="${textY}" class="${tCls}">${String(day.dayNum).padStart(2,'0')} ${day.dayName}</text>`);

          if (state.showKW && day.isoWeek) {
            svg.push(`  <text x="${monthLeftMm + 13}" y="${textY}" class="kw-text">KW ${day.isoWeek}</text>`);
          }

          if (day.holiday && day.holiday.title) {
            svg.push(`  <text x="${monthLeftMm + geo.bMonthMm - 2.5}" y="${textY}" class="holiday-text">${day.holiday.title}</text>`);
          }
        }
      });
    });

    // Puffer Beschriftungen
    svg.push(`  <text x="${leadInMm / 2}" y="${hMm / 2}" transform="rotate(-90 ${leadInMm / 2} ${hMm / 2})" text-anchor="middle" fill="#94a3b8" font-size="3mm">WICKEL-PUFFER (MONTAGE)</text>`);
    svg.push(`  <text x="${wMm - leadOutMm / 2}" y="${hMm / 2}" transform="rotate(-90 ${wMm - leadOutMm / 2} ${hMm / 2})" text-anchor="middle" fill="#94a3b8" font-size="3mm">WICKEL-PUFFER (MONTAGE)</text>`);

    // Rahmen
    svg.push(`  <rect x="0" y="0" width="${wMm}" height="${hMm}" class="border-line"/>`);
    svg.push(`</svg>`);

    const blob = new Blob([svg.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rollkalender-${state.year}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Hochauflösender PNG-Export (300 DPI Print-Grafik)
  function exportHighResPNG(state) {
    const geo = window.CronoGeometry.calculate(state);
    const dpm = 300 / 25.4; // Punkte pro Millimeter bei 300 DPI

    const offCanvas = document.createElement('canvas');
    offCanvas.width = Math.round(geo.lTotalMm * dpm);
    offCanvas.height = Math.round(geo.hVisibleMm * dpm);

    const offContainer = document.createElement('div');
    const offState = {
      ...state,
      viewMode: 'banner',
      zoom: (offCanvas.height / (state.hVisible * 20))
    };

    window.CronoCanvas.render(offCanvas, offContainer, offState);

    offCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rollkalender-${state.year}-300dpi.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  return {
    exportSVG,
    exportHighResPNG
  };
})();
