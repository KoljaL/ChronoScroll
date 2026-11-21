/**
 * CRONOSCROLL — VECTOR PDF EXPORT ENGINE
 * Generiert millimetergenaue Vektor-PDFs für Großformat-Plotter (HP, Canon, Epson)
 * mit allen Features: Schreiblinien, Spaltenteilung, Schnittmarken, KWs, Puffern.
 */

window.CronoPDF = (function() {
  'use strict';

  const JSPDF_VERSION = '2.5.1';
  const PDF_PRODUCER = `jsPDF ${JSPDF_VERSION} via ChronoScroll`;
  const RGB_EXPORT_DESCRIPTION =
    'RGB-Plotter-PDF. Die Drucksoftware beziehungsweise der Druckdienstleister führt die Ausgabe-Farbkonvertierung aus.';

  function formatMm(value) {
    return Number(value.toFixed(3)).toString().replace('.', ',');
  }

  function pdfProperties(state, geo) {
    const year = String(state.year);
    const customTitle = typeof state.bannerCustomTitle === 'string'
      ? state.bannerCustomTitle.trim()
      : '';
    const title = customTitle
      ? `${customTitle}${customTitle.includes(year) ? '' : ` ${year}`} – ChronoScroll`
      : `ChronoScroll Rollkalender ${year}`;
    return {
      title,
      subject: `14-Monate-Rollkalender; RGB-Plotterexport; ${formatMm(geo.lTotalMm)} × ${formatMm(geo.hVisibleMm)} mm; 1 Seite`,
      creator: 'ChronoScroll',
      keywords: 'Rollkalender, RGB, Vektor, Plotter, 14 Monate'
    };
  }

  function assertPageSize(doc, widthMm, heightMm) {
    const pageSize = doc && doc.internal && doc.internal.pageSize;
    if (!pageSize ||
        typeof pageSize.getWidth !== 'function' ||
        typeof pageSize.getHeight !== 'function') {
      throw new Error('Die PDF-Seitengröße konnte nicht überprüft werden.');
    }
    const tolerance = 0.001;
    if (Math.abs(pageSize.getWidth() - widthMm) > tolerance ||
        Math.abs(pageSize.getHeight() - heightMm) > tolerance) {
      throw new Error('Die erzeugte PDF-Seite entspricht nicht den berechneten Rollenmaßen.');
    }
  }

  function fitFontSize(doc, text, maxWidthMm, preferredSize) {
    if (!text || maxWidthMm <= 0) return preferredSize;
    let size = preferredSize;
    doc.setFontSize(size);
    const width = doc.getTextWidth(text);
    if (width > maxWidthMm) {
      size = Math.max(4, size * maxWidthMm / width);
      doc.setFontSize(size);
    }
    if (doc.getTextWidth(text) > maxWidthMm) {
      throw new Error('Der eigene Kalendertitel passt nicht in den linken Montagepuffer. Kürze den Titel oder vergrößere den Puffer.');
    }
    return size;
  }

  function hexToRgb(hex) {
    if (!hex) return [0, 0, 0];
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function drawPdfCropMark(doc, xMm, yMm, lenMm = 4, offMm = 1.5, monochrome = false) {
    doc.setLineWidth(0.2);
    const color = typeof monochrome === 'string'
      ? hexToRgb(monochrome) : monochrome ? [0, 0, 0] : [15, 23, 42];
    doc.setDrawColor(...color);
    // Horizontale Marke
    doc.line(xMm - lenMm - offMm, yMm, xMm - offMm, yMm);
    doc.line(xMm + offMm, yMm, xMm + lenMm + offMm, yMm);
    // Vertikale Marke
    doc.line(xMm, yMm - lenMm - offMm, xMm, yMm - offMm);
    doc.line(xMm, yMm + offMm, xMm, yMm + lenMm + offMm);
  }

  function exportPlotterPDF(state) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF-Bibliothek ist nicht geladen.');
    }

    const { jsPDF } = window.jspdf;
    if (jsPDF.version && String(jsPDF.version) !== JSPDF_VERSION) {
      throw new Error(`Die jsPDF-Version stimmt nicht mit dem erwarteten Plotterexport überein (${JSPDF_VERSION}).`);
    }
    const geo = window.CronoGeometry.calculate(state);
    const design = window.CronoDesigns && window.CronoDesigns.active(state);
    const qrEnabled = state.qrEnabled !== false;
    if (qrEnabled && typeof window.qrcode !== 'function') {
      throw new Error('Die QR-Code-Bibliothek ist nicht geladen.');
    }
    if (!Number.isFinite(geo.lTotalMm) || geo.lTotalMm <= 0 ||
        !Number.isFinite(geo.hVisibleMm) || geo.hVisibleMm <= 0) {
      throw new Error('Die berechneten Rollenmaße sind ungültig.');
    }
    let qr = null;
    let moduleCount = 0;
    let qrSizeMm = 0;
    let moduleSizeMm = 0;
    if (qrEnabled) {
      const url = window.CronoShare.createNextYearUrl(state);
      qr = window.qrcode(0, 'L');
      qr.addData(url);
      try {
        qr.make();
      } catch (error) {
        throw new Error(`QR-Code konnte nicht erstellt werden: ${error.message || error}`);
      }
      moduleCount = qr.getModuleCount();
      qrSizeMm = Math.min(state.pufferRight * 10 - 10, geo.hVisibleMm - 10, 100);
      moduleSizeMm = qrSizeMm / (moduleCount + 8);
      if (!Number.isFinite(moduleCount) || moduleCount <= 0 ||
          !Number.isFinite(qrSizeMm) || moduleSizeMm < 0.25) {
        throw new Error('Der rechte Montagepuffer ist für den QR-Code zu schmal. Bitte den Puffer vergrößern.');
      }
    }
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);
    if (!Array.isArray(monthsData) || monthsData.length !== 14) {
      throw new Error('Der Kalender konnte nicht vollständig mit 14 Monaten erzeugt werden.');
    }

    // PDF im exakten Rollenmaß (in mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [geo.lTotalMm, geo.hVisibleMm],
      compress: true
    });

    if (typeof doc.setProperties !== 'function') {
      throw new Error('PDF-Metadaten können in dieser Exportumgebung nicht gesetzt werden.');
    }
    doc.setProperties(pdfProperties(state, geo));
    assertPageSize(doc, geo.lTotalMm, geo.hVisibleMm);

    const baseFont = window.CronoFonts.registerPdfFont(doc, design ? window.CronoDesigns.fontKey(state) : state.fontFamily);

    const gridRgb = hexToRgb(state.colorGrid);
    const textRgb = hexToRgb(state.colorText);
    const borderRgb = hexToRgb(design ? state.colorText : state.colorBorder || '#0f172a');
    const paperRgb = hexToRgb(state.paperColor || '#ffffff');

    // 1. Hintergrund für gesamtes Banner
    doc.setFillColor(paperRgb[0], paperRgb[1], paperRgb[2]);
    doc.rect(0, 0, geo.lTotalMm, geo.hVisibleMm, 'F');

    // --- 2. VORLAUF (WICKEL-PUFFER LINKS) ---
    const leadInMm = geo.pufferLeftMm;
    doc.setFillColor(...(design ? paperRgb : [248, 250, 252]));
    doc.rect(0, 0, leadInMm, geo.hVisibleMm, 'F');

    if (state.pufferLeftContent === 'title') {
      doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
      doc.setFont(baseFont, 'bold');
      const title = state.bannerCustomTitle || `CRONOSCROLL ${state.year}`;
      fitFontSize(doc, title, Math.max(0, leadInMm - 12), 16);
      doc.text(title, leadInMm / 2, geo.hVisibleMm / 2 - 4, { align: 'center' });
      doc.setFont(baseFont, 'normal');
      doc.setTextColor(...(design ? hexToRgb(state.colorHeaderText || state.colorText) : [100, 116, 139]));
      const subtitle = '14-Monate-Endlosbanner für Holz-Rollkalender';
      fitFontSize(doc, subtitle, Math.max(0, leadInMm - 12), 9);
      doc.text(subtitle, leadInMm / 2, geo.hVisibleMm / 2 + 4, { align: 'center' });
    } else if (leadInMm > 0) {
      doc.setTextColor(...(design ? textRgb : [148, 163, 184]));
      doc.setFont(baseFont, 'normal');
      doc.setFontSize(8);
      doc.text('WICKEL-PUFFER (MONTAGE)', leadInMm / 2, geo.hVisibleMm / 2, { align: 'center', angle: 90 });
    }

    // --- 3. 14 MONATE ZEICHNEN ---
    monthsData.forEach((month, mIdx) => {
      const monthLeftMm = leadInMm + (mIdx * geo.bMonthMm);
      if (design) {
        window.CronoDesigns.drawPdf(doc, window.CronoDesigns.monthCommands(state, geo, month, mIdx, monthLeftMm), baseFont);
        return;
      }
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
      const color = hexToRgb(design ? state.paperColor || '#ffffff' : separator.colorMode === 'paper' ? state.paperColor : separator.color);
      const topMm = separator.header ? 0 : geo.hDayMm;
      doc.setFillColor(color[0], color[1], color[2]);
      for (let i = 1; i < 14; i++) {
        doc.rect(leadInMm + i * geo.bMonthMm - geo.separatorWidthMm / 2,
          topMm, geo.separatorWidthMm, geo.hVisibleMm - topMm, 'F');
      }
    }

    // --- 4. NACHLAUF (WICKEL-PUFFER RECHTS) ---
    const leadOutStartMm = geo.lTotalMm - geo.pufferRightMm;
    doc.setFillColor(...(design ? paperRgb : [248, 250, 252]));
    doc.rect(leadOutStartMm, 0, geo.pufferRightMm, geo.hVisibleMm, 'F');
    if (qrEnabled) {
      const gapMm = Math.max(0, Number.isFinite(state.qrGapMm) ? state.qrGapMm : 40);
      const availableQrX = Math.max(0, geo.pufferRightMm - qrSizeMm);
      const qrX = leadOutStartMm + Math.min(gapMm, availableQrX);
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
    }

    // --- 5. AUSSENRAHMEN ---
    doc.setLineWidth(state.lineBorder);
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    if (state.designStyle !== 'zen') doc.rect(0, 0, geo.lTotalMm, geo.hVisibleMm, 'D');

    // --- 6. SCHNEIDEMARKEN ---
    if (state.showCropMarks) {
      const cropColor = design ? state.colorText : design;
      const viewportStartMm = leadInMm + (state.currentMonthIndex * geo.bMonthMm);
      const viewportEndMm = viewportStartMm + geo.bVisibleMm;
      drawPdfCropMark(doc, viewportStartMm, 0, 4, 1.5, cropColor);
      drawPdfCropMark(doc, viewportEndMm, 0, 4, 1.5, cropColor);
      drawPdfCropMark(doc, viewportStartMm, geo.hVisibleMm, 4, 1.5, cropColor);
      drawPdfCropMark(doc, viewportEndMm, geo.hVisibleMm, 4, 1.5, cropColor);
    }

    const originalVersion = jsPDF.version;
    try {
      if (originalVersion) jsPDF.version = `${JSPDF_VERSION} via ChronoScroll`;
      const calendarName = String(state.bannerCustomTitle || `Rollkalender-${state.year}`)
        .trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, '-');
      doc.save(`${calendarName || `Rollkalender-${state.year}`}.pdf`);
    } finally {
      if (originalVersion) jsPDF.version = originalVersion;
    }
  }

  return {
    PDF_PRODUCER,
    RGB_EXPORT_DESCRIPTION,
    JSPDF_VERSION,
    exportPlotterPDF
  };
})();
