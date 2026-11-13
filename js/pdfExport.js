/**
 * CRONOSCROLL — VECTOR PDF EXPORT ENGINE
 * Generiert millimetergenaue Vektor-PDFs für Großformat-Plotter (HP, Canon, Epson)
 * mit allen Features: Schreiblinien, Spaltenteilung, Schnittmarken, KWs, Puffern.
 */

window.CronoPDF = (function() {
  'use strict';

  function hexToRgb(hex) {
    if (!hex) return [0, 0, 0];
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function drawPdfCropMark(doc, xMm, yMm, lenMm = 4, offMm = 1.5) {
    doc.setLineWidth(0.2);
    doc.setDrawColor(15, 23, 42);
    // Horizontale Marke
    doc.line(xMm - lenMm - offMm, yMm, xMm - offMm, yMm);
    doc.line(xMm + offMm, yMm, xMm + lenMm + offMm, yMm);
    // Vertikale Marke
    doc.line(xMm, yMm - lenMm - offMm, xMm, yMm - offMm);
    doc.line(xMm, yMm + offMm, xMm, yMm + lenMm + offMm);
  }

  function exportPlotterPDF(state) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF-Bibliothek ist nicht geladen.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const geo = window.CronoGeometry.calculate(state);
    if (typeof window.qrcode !== 'function') {
      throw new Error('Die QR-Code-Bibliothek ist nicht geladen.');
    }
    const url = window.CronoShare.createNextYearUrl(state);
    const qr = window.qrcode(0, 'L');
    qr.addData(url);
    try {
      qr.make();
    } catch (error) {
      throw new Error(`QR-Code konnte nicht erstellt werden: ${error.message || error}`);
    }
    const moduleCount = qr.getModuleCount();
    const qrSizeMm = Math.min(state.pufferRight * 10 - 10, geo.hVisibleMm - 10, 100);
    const moduleSizeMm = qrSizeMm / (moduleCount + 8);
    if (moduleSizeMm < 0.25) {
      throw new Error('Der rechte Montagepuffer ist für den QR-Code zu schmal. Bitte den Puffer vergrößern.');
    }
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);

    // PDF im exakten Rollenmaß (in mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [geo.lTotalMm, geo.hVisibleMm],
      compress: true
    });

    const baseFont = window.CronoFonts.registerPdfFont(doc, state.fontFamily);

    const gridRgb = hexToRgb(state.colorGrid);
    const textRgb = hexToRgb(state.colorText);
    const borderRgb = hexToRgb(state.colorBorder || '#0f172a');
    const paperRgb = hexToRgb(state.paperColor || '#ffffff');

    // 1. Hintergrund für gesamtes Banner
    doc.setFillColor(paperRgb[0], paperRgb[1], paperRgb[2]);
    doc.rect(0, 0, geo.lTotalMm, geo.hVisibleMm, 'F');

    // --- 2. VORLAUF (WICKEL-PUFFER LINKS) ---
    const leadInMm = geo.pufferLeftMm;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, leadInMm, geo.hVisibleMm, 'F');

    if (state.pufferLeftContent === 'title') {
      doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
      doc.setFont(baseFont, 'bold');
      doc.setFontSize(16);
      doc.text(state.bannerCustomTitle || `CRONOSCROLL ${state.year}`, leadInMm / 2, geo.hVisibleMm / 2 - 4, { align: 'center' });
      doc.setFont(baseFont, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('14-Monate-Endlosbanner für Holz-Rollkalender', leadInMm / 2, geo.hVisibleMm / 2 + 4, { align: 'center' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFont(baseFont, 'normal');
      doc.setFontSize(8);
      doc.text('WICKEL-PUFFER (MONTAGE)', leadInMm / 2, geo.hVisibleMm / 2, { align: 'center', angle: 90 });
    }

    // --- 3. 14 MONATE ZEICHNEN ---
    monthsData.forEach((month, mIdx) => {
      const monthLeftMm = leadInMm + (mIdx * geo.bMonthMm);
      const metrics = geo.getMonthMetrics(mIdx);
      const contentLeftMm = monthLeftMm + metrics.leftInsetMm;
      const dayColumnWidthMm = metrics.dayColumnWidthMm;
      const separator = state.monthSeparators && state.monthSeparators[geo.monthLayout];
      const insetHeader = geo.separatorWidthMm > 0 && separator.header;
      const headerLeftMm = insetHeader ? contentLeftMm : monthLeftMm;
      const headerWidthMm = insetHeader ? metrics.contentWidthMm : geo.bMonthMm;

      // Monatskopf (Header)
      const headerBgRgb = hexToRgb(state.colorHeaderBg || '#f1f5f9');
      doc.setFillColor(headerBgRgb[0], headerBgRgb[1], headerBgRgb[2]);
      doc.setLineWidth(state.lineGrid);
      doc.setDrawColor(gridRgb[0], gridRgb[1], gridRgb[2]);
      doc.rect(headerLeftMm, 0, headerWidthMm, geo.hDayMm, 'FD');

      let headerTitle = month.label.toUpperCase();
      if (state.headerStyle === 'titlecase') headerTitle = month.label;
      else if (state.headerStyle === 'numbered') headerTitle = `${month.monthNumber} · ${month.monthName.toUpperCase()} ${month.year}`;

      doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
      doc.setFont(baseFont, 'bold');
      doc.setFontSize(10 * state.fontHeaderScale);

      if (insetHeader) {
        while (headerTitle.length > 1 && doc.getTextWidth(headerTitle) > headerWidthMm - 6) {
          headerTitle = headerTitle.slice(0, -1);
        }
      }
      const headerTextXMm = (state.headerAlign === 'left') ? (headerLeftMm + 3) : (headerLeftMm + (headerWidthMm / 2));
      const headerAlign = (state.headerAlign === 'left') ? 'left' : 'center';
      doc.text(headerTitle, headerTextXMm, (geo.hDayMm / 2) + 1.4, { align: headerAlign });

      // Tageszeilen (1..31)
      month.days.forEach((day, dIdx) => {
        const position = geo.getDayPosition(dIdx + 1);
        const cellLeftMm = contentLeftMm + (position.column * dayColumnWidthMm);
        const rowTopMm = (position.row + 1) * geo.hDayMm;

        // Zellhintergrund
        if (!day.isValid) {
          doc.setFillColor(250, 250, 250);
          doc.rect(cellLeftMm, rowTopMm, dayColumnWidthMm, geo.hDayMm, 'F');
        } else if (day.holiday && day.holiday.color) {
          const hRgb = hexToRgb(day.holiday.color);
          doc.setFillColor(hRgb[0], hRgb[1], hRgb[2]);
          doc.rect(cellLeftMm, rowTopMm, dayColumnWidthMm, geo.hDayMm, 'F');
        } else if (day.isSunday) {
          const sunBg = hexToRgb(state.colorSundayBg || state.colorWeekendBg);
          doc.setFillColor(sunBg[0], sunBg[1], sunBg[2]);
          doc.rect(cellLeftMm, rowTopMm, dayColumnWidthMm, geo.hDayMm, 'F');
        } else if (day.isSaturday) {
          const satBg = hexToRgb(state.colorSaturdayBg || state.colorWeekendBg);
          doc.setFillColor(satBg[0], satBg[1], satBg[2]);
          doc.rect(cellLeftMm, rowTopMm, dayColumnWidthMm, geo.hDayMm, 'F');
        }

        // Zellrahmen
        doc.setLineWidth(state.lineGrid);
        doc.setDrawColor(gridRgb[0], gridRgb[1], gridRgb[2]);
        doc.rect(cellLeftMm, rowTopMm, dayColumnWidthMm, geo.hDayMm, 'D');

        if (day.isValid) {
          // Mehrpersonen-Spaltenteilung (Sub-Columns)
          if (geo.subColumns > 1) {
            doc.setLineWidth(state.lineGrid * 0.6);
            for (let sc = 1; sc < geo.subColumns; sc++) {
              const scX = cellLeftMm + (sc * dayColumnWidthMm / geo.subColumns);
              doc.line(scX, rowTopMm, scX, rowTopMm + geo.hDayMm);
            }
          }

          // Dezente Schreiblinien
          if (state.guideLinesCount > 0) {
            doc.setLineWidth(0.15);
            doc.setDrawColor(203, 213, 225);
            const stepMm = geo.hDayMm / (state.guideLinesCount + 1);
            for (let g = 1; g <= state.guideLinesCount; g++) {
              const gY = rowTopMm + (g * stepMm);
              doc.line(cellLeftMm + 8, gY, cellLeftMm + dayColumnWidthMm - 2, gY);
            }
          }

          // Textfarbe für Tag
          if (day.isSunday) {
            const sunTxt = hexToRgb(state.colorSundayText || state.colorWeekendText);
            doc.setTextColor(sunTxt[0], sunTxt[1], sunTxt[2]);
          } else if (day.isSaturday) {
            const satTxt = hexToRgb(state.colorSaturdayText || state.colorWeekendText);
            doc.setTextColor(satTxt[0], satTxt[1], satTxt[2]);
          } else {
            doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
          }

          doc.setFont(baseFont, 'normal');
          doc.setFontSize(8.5 * state.fontDayScale);
          const textYMm = rowTopMm + (geo.hDayMm / 2) + 1.2;
          const dayLabel = `${String(day.dayNum).padStart(2, '0')} ${day.dayName}`;
          doc.text(dayLabel, cellLeftMm + 2.5, textYMm);

          let leftOffsetMm = 2.5 + (doc.getTextWidth(dayLabel)) + 1.5;

          // Kalenderwoche (KW) am Montag
          if (state.showKW && day.isoWeek) {
            doc.setFont(baseFont, 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`KW ${day.isoWeek}`, cellLeftMm + leftOffsetMm, textYMm);
          }

          // Feiertags-/Terminbezeichnung mit Kollisionsschutz
          if (day.holiday && day.holiday.title) {
            doc.setFont(baseFont, 'italic');
            doc.setFontSize(7);
            doc.setTextColor(30, 41, 59);

            let title = day.holiday.title;
            const maxTitleWidthMm = dayColumnWidthMm - leftOffsetMm - 6;
            if (maxTitleWidthMm > 10) {
              while (title.length > 3 && doc.getTextWidth(title + '…') > maxTitleWidthMm) {
                title = title.slice(0, -1);
              }
              if (title !== day.holiday.title) title += '…';
              doc.text(title, cellLeftMm + dayColumnWidthMm - 2.5, textYMm, { align: 'right' });
            }
          }
        }
      });

      if (geo.dayColumns === 2) {
        const emptyRowTopMm = geo.daysPerColumn * geo.hDayMm;
        doc.setFillColor(250, 250, 250);
        doc.rect(contentLeftMm, emptyRowTopMm, dayColumnWidthMm, geo.hDayMm, 'F');
        doc.setLineWidth(state.lineGrid);
        doc.setDrawColor(gridRgb[0], gridRgb[1], gridRgb[2]);
        doc.rect(contentLeftMm, emptyRowTopMm, dayColumnWidthMm, geo.hDayMm, 'D');
      }
    });

    if (geo.separatorWidthMm > 0) {
      const separator = state.monthSeparators[geo.monthLayout];
      const color = hexToRgb(separator.colorMode === 'paper' ? state.paperColor : separator.color);
      const topMm = separator.header ? 0 : geo.hDayMm;
      doc.setFillColor(color[0], color[1], color[2]);
      for (let i = 1; i < 14; i++) {
        doc.rect(leadInMm + i * geo.bMonthMm - geo.separatorWidthMm / 2,
          topMm, geo.separatorWidthMm, geo.hVisibleMm - topMm, 'F');
      }
    }

    // --- 4. NACHLAUF (WICKEL-PUFFER RECHTS) ---
    const leadOutStartMm = geo.lTotalMm - geo.pufferRightMm;
    doc.setFillColor(248, 250, 252);
    doc.rect(leadOutStartMm, 0, geo.pufferRightMm, geo.hVisibleMm, 'F');
    const qrX = leadOutStartMm + (geo.pufferRightMm - qrSizeMm) / 2;
    const qrY = (geo.hVisibleMm - qrSizeMm) / 2;
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX, qrY, qrSizeMm, qrSizeMm, 'F');
    doc.setFillColor(0, 0, 0);
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount;) {
        if (!qr.isDark(row, col)) {
          col++;
          continue;
        }
        const start = col++;
        while (col < moduleCount && qr.isDark(row, col)) col++;
        doc.rect(qrX + (start + 4) * moduleSizeMm, qrY + (row + 4) * moduleSizeMm,
          (col - start) * moduleSizeMm, moduleSizeMm, 'F');
      }
    }

    // --- 5. AUSSENRAHMEN ---
    doc.setLineWidth(state.lineBorder);
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.rect(0, 0, geo.lTotalMm, geo.hVisibleMm, 'D');

    // --- 6. SCHNEIDEMARKEN ---
    if (state.showCropMarks) {
      drawPdfCropMark(doc, 0, 0);
      drawPdfCropMark(doc, geo.lTotalMm, 0);
      drawPdfCropMark(doc, 0, geo.hVisibleMm);
      drawPdfCropMark(doc, geo.lTotalMm, geo.hVisibleMm);
      drawPdfCropMark(doc, leadInMm, 0);
      drawPdfCropMark(doc, leadInMm, geo.hVisibleMm);
      drawPdfCropMark(doc, leadOutStartMm, 0);
      drawPdfCropMark(doc, leadOutStartMm, geo.hVisibleMm);
      for (let i = 1; i < 14; i++) {
        const xMark = leadInMm + (i * geo.bMonthMm);
        drawPdfCropMark(doc, xMark, 0);
        drawPdfCropMark(doc, xMark, geo.hVisibleMm);
      }
    }

    doc.save(`Rollkalender-${state.year}.pdf`);
  }

  return {
    exportPlotterPDF
  };
})();
