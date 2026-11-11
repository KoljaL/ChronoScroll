/**
 * CRONOSCROLL — HI-DPI CANVAS 2D RENDER ENGINE
 * Beinhaltet Retina-Skalierung, Pan & Zoom, Kollisionsschutz, Schreiblinien,
 * Kalenderwochen, Mondphasen, Spaltenteilung, Puffer-Gestaltung & Klick-Erkennung.
 */

window.CronoCanvas = (function() {
  'use strict';

  function getBaseFontFamily(fontKey) {
    const embeddedFamily = window.CronoFonts && window.CronoFonts.getCanvasFamily(fontKey);
    if (embeddedFamily) return embeddedFamily;

    switch (fontKey) {
      case 'times':
      case 'serif':
        return '"Playfair Display", Georgia, "Times New Roman", serif';
      case 'courier':
      case 'mono':
        return '"JetBrains Mono", "Courier New", Courier, monospace';
      case 'architect':
        return '"Century Gothic", "Segoe UI", sans-serif';
      case 'sans':
      default:
        return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  }

  // Text kürzen, wenn Platz nicht ausreicht (Kollisionsschutz)
  function truncateTextToFit(ctx, text, maxWidthPx) {
    if (ctx.measureText(text).width <= maxWidthPx) return text;
    let truncated = text;
    while (truncated.length > 3 && ctx.measureText(truncated + '…').width > maxWidthPx) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
  }

  // Zeichnet Schnitt- und Passermarken
  function drawCropMark(ctx, x, y, lengthPx = 10, offsetPx = 3) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    // Horizontale Marke
    ctx.moveTo(x - lengthPx - offsetPx, y);
    ctx.lineTo(x - offsetPx, y);
    ctx.moveTo(x + offsetPx, y);
    ctx.lineTo(x + lengthPx + offsetPx, y);
    // Vertikale Marke
    ctx.moveTo(x, y - lengthPx - offsetPx);
    ctx.lineTo(x, y - offsetPx);
    ctx.moveTo(x, y + offsetPx);
    ctx.lineTo(x, y + lengthPx + offsetPx);
    ctx.stroke();
    ctx.restore();
  }

  // Zeichnet ein Mini-Jahreskalendarium in den Vorlauf
  function drawMiniYearOverview(ctx, year, x, y, widthPx, heightPx, state) {
    const baseFont = getBaseFontFamily(state.fontFamily);
    ctx.save();
    ctx.fillStyle = state.colorText;
    ctx.textAlign = 'center';
    ctx.font = `bold ${9 * state.zoom}px ${baseFont}`;
    ctx.fillText(`JAHRESÜBERSICHT ${year}`, x + widthPx / 2, y + 20 * state.zoom);

    const miniMonths = window.CronoHolidays.MONTH_NAMES;
    const gridCols = 3;
    const gridRows = 4;
    const colW = (widthPx - 20 * state.zoom) / gridCols;
    const rowH = (heightPx - 40 * state.zoom) / gridRows;

    miniMonths.forEach((mName, idx) => {
      const col = idx % gridCols;
      const row = Math.floor(idx / gridCols);
      const mX = x + 10 * state.zoom + (col * colW);
      const mY = y + 35 * state.zoom + (row * rowH);

      ctx.fillStyle = state.colorText;
      ctx.font = `bold ${7 * state.zoom}px ${baseFont}`;
      ctx.textAlign = 'left';
      ctx.fillText(mName.substring(0, 3).toUpperCase(), mX + 2, mY + 8 * state.zoom);

      // Tage 1..31 als kleine Punkte/Tabelle
      const daysCount = new Date(year, idx + 1, 0).getDate();
      const firstDay = new Date(year, idx, 1).getDay(); // 0 = So
      const shift = (firstDay === 0) ? 6 : (firstDay - 1);

      ctx.font = `${5.5 * state.zoom}px ${baseFont}`;
      ctx.fillStyle = '#64748b';
      for (let d = 1; d <= daysCount; d++) {
        const slot = shift + d - 1;
        const sCol = slot % 7;
        const sRow = Math.floor(slot / 7);
        const dX = mX + 2 + (sCol * (colW / 7.5));
        const dY = mY + 16 * state.zoom + (sRow * 7 * state.zoom);
        ctx.fillText(d.toString(), dX, dY);
      }
    });

    ctx.restore();
  }

  // Zeichnet Notizzeilen in den Puffer
  function drawBufferNotes(ctx, title, x, y, widthPx, heightPx, state) {
    const baseFont = getBaseFontFamily(state.fontFamily);
    ctx.save();
    ctx.fillStyle = state.colorText;
    ctx.textAlign = 'center';
    ctx.font = `bold ${10 * state.zoom}px ${baseFont}`;
    ctx.fillText(title.toUpperCase(), x + widthPx / 2, y + 22 * state.zoom);

    const lineCount = 28;
    const step = (heightPx - 40 * state.zoom) / lineCount;
    ctx.strokeStyle = state.colorGrid;
    ctx.lineWidth = 0.5 * state.zoom;
    ctx.setLineDash([3, 3]);

    for (let i = 1; i <= lineCount; i++) {
      const lY = y + 30 * state.zoom + (i * step);
      // Checkbox Kästchen
      ctx.strokeRect(x + 12 * state.zoom, lY - 4 * state.zoom, 6 * state.zoom, 6 * state.zoom);
      // Schreiblinie
      ctx.beginPath();
      ctx.moveTo(x + 24 * state.zoom, lY);
      ctx.lineTo(x + widthPx - 12 * state.zoom, lY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Zeichnet eine einzelne Monatsspalte
  function drawMonthColumn(ctx, month, monthLeftPx, monthWidthPx, dayHeightPx, baseFont, state, geo) {
    const dpr = state.dpr || 1;

    // --- 1. KOPFZEILE (HEADER) ---
    ctx.fillStyle = state.colorHeaderBg || '#f1f5f9';
    ctx.fillRect(monthLeftPx, 0, monthWidthPx, dayHeightPx);
    ctx.strokeStyle = state.colorGrid;
    ctx.lineWidth = Math.max(1, state.lineGrid * state.zoom * 1.5);
    ctx.strokeRect(monthLeftPx, 0, monthWidthPx, dayHeightPx);

    ctx.fillStyle = state.colorHeaderText || state.colorText;
    ctx.font = `bold ${11 * state.fontHeaderScale * state.zoom}px ${baseFont}`;
    ctx.textAlign = state.headerAlign || 'center';
    ctx.textBaseline = 'middle';

    let headerTitle = month.label.toUpperCase();
    if (state.headerStyle === 'titlecase') {
      headerTitle = month.label;
    } else if (state.headerStyle === 'numbered') {
      headerTitle = `${month.monthNumber} · ${month.monthName.toUpperCase()} ${month.year}`;
    }

    const headerTextX = (state.headerAlign === 'left') ? (monthLeftPx + 10 * state.zoom) : (monthLeftPx + monthWidthPx / 2);
    ctx.fillText(headerTitle, headerTextX, dayHeightPx / 2);

    // --- 2. TAGESZEILEN (1 BIS 31) ---
    month.days.forEach((day, dIdx) => {
      const rowTopPx = (dIdx + 1) * dayHeightPx;

      if (!day.isValid) {
        // Leere Tage (z. B. 29., 30., 31. Februar)
        ctx.fillStyle = state.colorEmptyDay || '#fafafa';
        ctx.fillRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);
      } else {
        // Tag-Hintergrund (Feiertag, Samstag, Sonntag, Normal)
        if (day.holiday && day.holiday.color) {
          ctx.fillStyle = day.holiday.color;
          ctx.fillRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);
        } else if (day.isSunday) {
          ctx.fillStyle = state.colorSundayBg || state.colorWeekendBg;
          ctx.fillRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);
        } else if (day.isSaturday) {
          ctx.fillStyle = state.colorSaturdayBg || state.colorWeekendBg;
          ctx.fillRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);
        } else {
          ctx.fillStyle = state.paperColor || '#ffffff';
          ctx.fillRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);
        }
      }

      // Gitterrahmen der Tageszelle
      ctx.strokeStyle = state.colorGrid;
      ctx.lineWidth = Math.max(0.5, state.lineGrid * state.zoom);
      ctx.setLineDash([]);
      ctx.strokeRect(monthLeftPx, rowTopPx, monthWidthPx, dayHeightPx);

      if (day.isValid) {
        // --- 3. MEHRPERSONEN-SPALTENTEILUNG (SUB-COLUMNS) ---
        if (geo.subColumns > 1) {
          ctx.save();
          ctx.strokeStyle = state.colorGrid;
          ctx.lineWidth = Math.max(0.4, (state.lineGrid * 0.7) * state.zoom);
          ctx.setLineDash([2, 2]);
          for (let sc = 1; sc < geo.subColumns; sc++) {
            const scX = monthLeftPx + (sc * (monthWidthPx / geo.subColumns));
            ctx.beginPath();
            ctx.moveTo(scX, rowTopPx);
            ctx.lineTo(scX, rowTopPx + dayHeightPx);
            ctx.stroke();
          }
          ctx.restore();
        }

        // --- 4. DEZENTE SCHREIBLINIEN (HANDWRITING GUIDELINES) ---
        if (state.guideLinesCount > 0) {
          ctx.save();
          ctx.strokeStyle = state.colorGuideLines || 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 0.5 * state.zoom;
          if (state.guideLinesStyle === 'dashed') ctx.setLineDash([3, 2]);
          else if (state.guideLinesStyle === 'dotted') ctx.setLineDash([1, 2]);
          else ctx.setLineDash([]);

          const step = dayHeightPx / (state.guideLinesCount + 1);
          for (let g = 1; g <= state.guideLinesCount; g++) {
            const gY = rowTopPx + (g * step);
            ctx.beginPath();
            ctx.moveTo(monthLeftPx + 22 * state.zoom, gY);
            ctx.lineTo(monthLeftPx + monthWidthPx - 4 * state.zoom, gY);
            ctx.stroke();
          }
          ctx.restore();
        }

        // --- 5. TAGESNUMMER & WOCHENTAG ---
        let textColor = state.colorText;
        if (day.isSunday) textColor = state.colorSundayText || state.colorWeekendText;
        else if (day.isSaturday) textColor = state.colorSaturdayText || state.colorWeekendText;

        ctx.fillStyle = textColor;
        ctx.font = `${10 * state.fontDayScale * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const paddingLeft = 6 * state.zoom;
        const textY = rowTopPx + dayHeightPx / 2;
        const dateStr = `${String(day.dayNum).padStart(2, '0')} ${day.dayName}`;
        ctx.fillText(dateStr, monthLeftPx + paddingLeft, textY);

        let leftOffsetPx = paddingLeft + ctx.measureText(dateStr).width + (4 * state.zoom);

        // --- 6. KALENDERWOCHE (KW) BADGE AM MONTAG ---
        if (state.showKW && day.isoWeek) {
          ctx.save();
          ctx.fillStyle = '#64748b';
          ctx.font = `bold ${7.5 * state.zoom}px ${baseFont}`;
          ctx.fillText(`KW ${day.isoWeek}`, monthLeftPx + leftOffsetPx, textY);
          leftOffsetPx += ctx.measureText(`KW ${day.isoWeek}`).width + (5 * state.zoom);
          ctx.restore();
        }

        // --- 7. MONDPHASEN-PIKTOGRAMM ---
        if (state.showMoon && day.moonPhase) {
          ctx.save();
          ctx.font = `${8.5 * state.zoom}px sans-serif`;
          ctx.fillStyle = '#475569';
          ctx.fillText(day.moonPhase.unicode, monthLeftPx + leftOffsetPx, textY);
          leftOffsetPx += 12 * state.zoom;
          ctx.restore();
        }

        // --- 8. FEIERTAGS- & TERMIN-TITEL MIT KOLLISIONSSCHUTZ ---
        if (day.holiday && day.holiday.title) {
          ctx.save();
          ctx.font = `italic ${8.5 * state.zoom}px ${baseFont}`;
          ctx.textAlign = 'right';
          ctx.fillStyle = day.holiday.textColor || '#1e293b';

          const maxTitleWidth = (monthLeftPx + monthWidthPx - paddingLeft) - (monthLeftPx + leftOffsetPx + 4 * state.zoom);
          if (maxTitleWidth > 15 * state.zoom) {
            const safeTitle = truncateTextToFit(ctx, day.holiday.title, maxTitleWidth);
            ctx.fillText(safeTitle, monthLeftPx + monthWidthPx - paddingLeft, textY);
          }
          ctx.restore();
        }

        // Multi-Event Farbindikator (wenn mehr als 1 Event an diesem Tag)
        if (day.events && day.events.length > 1) {
          ctx.save();
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(monthLeftPx + monthWidthPx - (3 * state.zoom), rowTopPx + 2 * state.zoom, 2.5 * state.zoom, dayHeightPx - 4 * state.zoom);
          ctx.restore();
        }
      }
    });
  }

  // Haupt-Rendermethode
  function render(canvas, container, state) {
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    const geo = window.CronoGeometry.calculate(state);
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);

    // HiDPI / Retina Device Pixel Ratio
    const dpr = window.devicePixelRatio || 1;
    state.dpr = dpr;

    const pxPerCm = 20 * state.zoom;
    const baseFont = getBaseFontFamily(state.fontFamily);
    const monthWidthPx = geo.bMonth * pxPerCm;
    const dayHeightPx = geo.hDay * pxPerCm;
    const leadInPx = geo.pufferLeft * pxPerCm;
    const leadOutPx = geo.pufferRight * pxPerCm;

    let targetWidthPx = 0;
    let targetHeightPx = state.hVisible * pxPerCm;

    if (state.viewMode === 'plate') {
      // --- MODUS 1: 3-MONATS-SCHREIBPLATTE ---
      container.style.justifyContent = 'center';
      targetWidthPx = geo.bVisible * pxPerCm;

      // Canvas physisch auf HiDPI skalieren
      canvas.width = Math.round(targetWidthPx * dpr);
      canvas.height = Math.round(targetHeightPx * dpr);
      canvas.style.width = `${targetWidthPx}px`;
      canvas.style.height = `${targetHeightPx}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Papier-Hintergrund
      ctx.fillStyle = state.paperColor || '#ffffff';
      ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

      // 3 sichtbare Monate zeichnen
      for (let i = 0; i < 3; i++) {
        const mIdx = state.currentMonthIndex + i;
        const month = monthsData[mIdx];
        if (month) {
          drawMonthColumn(ctx, month, i * monthWidthPx, monthWidthPx, dayHeightPx, baseFont, state, geo);
        }
      }

      // Außenrahmen
      ctx.strokeStyle = state.colorBorder || '#0f172a';
      ctx.lineWidth = Math.max(2, state.lineBorder * state.zoom * 2);
      ctx.strokeRect(0, 0, targetWidthPx, targetHeightPx);

      // Schnittmarken
      if (state.showCropMarks) {
        drawCropMark(ctx, 0, 0);
        drawCropMark(ctx, targetWidthPx, 0);
        drawCropMark(ctx, 0, targetHeightPx);
        drawCropMark(ctx, targetWidthPx, targetHeightPx);
        for (let i = 1; i < 3; i++) {
          drawCropMark(ctx, i * monthWidthPx, 0);
          drawCropMark(ctx, i * monthWidthPx, targetHeightPx);
        }
      }

      ctx.restore();

      // UI-Labels aktualisieren
      const firstM = monthsData[state.currentMonthIndex];
      const thirdM = monthsData[state.currentMonthIndex + 2];
      if (firstM && thirdM) {
        const labelText = `${firstM.monthName.substring(0, 3)} ${firstM.year} – ${thirdM.monthName.substring(0, 3)} ${thirdM.year}`;
        const elLabel = document.getElementById('plate-month-label');
        if (elLabel) elLabel.textContent = labelText;
        const elDim = document.getElementById('status-dimensions');
        if (elDim) elDim.textContent = `Sichtfenster: ${geo.bVisible.toFixed(1)} cm × ${state.hVisible.toFixed(1)} cm (${firstM.label} bis ${thirdM.label})`;
      }

    } else {
      // --- MODUS 2: GANZE DRUCKROLLE (14 MONATE) ---
      container.style.justifyContent = 'flex-start';
      targetWidthPx = geo.lTotal * pxPerCm;

      canvas.width = Math.round(targetWidthPx * dpr);
      canvas.height = Math.round(targetHeightPx * dpr);
      canvas.style.width = `${targetWidthPx}px`;
      canvas.style.height = `${targetHeightPx}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Papier-Hintergrund
      ctx.fillStyle = state.paperColor || '#ffffff';
      ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

      // --- VORLAUF (WICKEL-PUFFER LINKS) ---
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, leadInPx, targetHeightPx);

      if (state.pufferLeftContent === 'year_overview') {
        drawMiniYearOverview(ctx, state.year, 0, 0, leadInPx, targetHeightPx, state);
      } else if (state.pufferLeftContent === 'notes') {
        drawBufferNotes(ctx, 'Notizen & Termine', 0, 0, leadInPx, targetHeightPx, state);
      } else if (state.pufferLeftContent === 'title') {
        ctx.fillStyle = state.colorText;
        ctx.font = `bold ${14 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText(state.bannerCustomTitle || `CRONOSCROLL ${state.year}`, leadInPx / 2, targetHeightPx / 2 - 10 * state.zoom);
        ctx.font = `${9 * state.zoom}px ${baseFont}`;
        ctx.fillStyle = '#64748b';
        ctx.fillText('14-Monate-Endlosbanner für Holz-Rollkalender', leadInPx / 2, targetHeightPx / 2 + 10 * state.zoom);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${11 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText('WICKEL-PUFFER (MONTAGE)', leadInPx / 2, targetHeightPx / 2);
      }

      // --- 14 MONATE ZEICHNEN ---
      monthsData.forEach((month, mIdx) => {
        const monthLeftPx = leadInPx + (mIdx * monthWidthPx);
        drawMonthColumn(ctx, month, monthLeftPx, monthWidthPx, dayHeightPx, baseFont, state, geo);
      });

      // --- NACHLAUF (WICKEL-PUFFER RECHTS) ---
      const leadOutStartPx = targetWidthPx - leadOutPx;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(leadOutStartPx, 0, leadOutPx, targetHeightPx);

      if (state.pufferRightContent === 'notes') {
        drawBufferNotes(ctx, 'Jahres-Rückblick', leadOutStartPx, 0, leadOutPx, targetHeightPx, state);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${11 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText('WICKEL-PUFFER (MONTAGE)', leadOutStartPx + (leadOutPx / 2), targetHeightPx / 2);
      }

      // Außenrahmen
      ctx.strokeStyle = state.colorBorder || '#0f172a';
      ctx.lineWidth = Math.max(2, state.lineBorder * state.zoom * 2);
      ctx.strokeRect(0, 0, targetWidthPx, targetHeightPx);

      // Schnittmarken
      if (state.showCropMarks) {
        drawCropMark(ctx, 0, 0);
        drawCropMark(ctx, targetWidthPx, 0);
        drawCropMark(ctx, 0, targetHeightPx);
        drawCropMark(ctx, targetWidthPx, targetHeightPx);
        // Marken an Puffergrenzen und allen Monaten
        drawCropMark(ctx, leadInPx, 0);
        drawCropMark(ctx, leadInPx, targetHeightPx);
        drawCropMark(ctx, leadOutStartPx, 0);
        drawCropMark(ctx, leadOutStartPx, targetHeightPx);
        for (let i = 1; i < 14; i++) {
          const xMark = leadInPx + (i * monthWidthPx);
          drawCropMark(ctx, xMark, 0);
          drawCropMark(ctx, xMark, targetHeightPx);
        }
      }

      // Rotes 3-Monats-Sichtfenster
      const viewportWidthPx = geo.bVisible * pxPerCm;
      const viewportXPx = leadInPx + (state.currentMonthIndex * monthWidthPx);

      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(viewportXPx, 0, viewportWidthPx, targetHeightPx);

      ctx.fillStyle = '#ef4444';
      ctx.setLineDash([]);
      ctx.fillRect(viewportXPx, 0, 180 * state.zoom, 22 * state.zoom);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${10 * state.zoom}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`3-MONATS-FENSTER (${state.bVisible}cm)`, viewportXPx + 8 * state.zoom, 14 * state.zoom);
      ctx.restore();

      ctx.restore();

      const elDim = document.getElementById('status-dimensions');
      if (elDim) elDim.textContent = `Druckbanner: ${geo.lTotal.toFixed(1)} cm × ${state.hVisible.toFixed(1)} cm (14 Monate)`;
    }

    // Mathematische Geometrie im UI aktualisieren
    const elBMonth = document.getElementById('calc-b-month');
    if (elBMonth) elBMonth.textContent = `${geo.bMonth.toFixed(2)} cm`;
    const elHDay = document.getElementById('calc-h-day');
    if (elHDay) elHDay.textContent = `${geo.hDay.toFixed(3)} cm`;
    const elLTotal = document.getElementById('calc-l-total');
    if (elLTotal) elLTotal.textContent = `${geo.lTotal.toFixed(2)} cm (${(geo.lTotal/100).toFixed(2)} m)`;
    const elYearRange = document.getElementById('year-range-display');
    if (elYearRange) elYearRange.textContent = `${state.year - 1} – ${state.year + 1}`;
    const elZoomInd = document.getElementById('preview-scale-indicator');
    if (elZoomInd) elZoomInd.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  // Klickkoordinaten auf konkretes Kalenderdatum auflösen
  function getDateAtCanvasPoint(clientX, clientY, canvas, state) {
    const rect = canvas.getBoundingClientRect();
    const xCss = clientX - rect.left;
    const yCss = clientY - rect.top;

    const geo = window.CronoGeometry.calculate(state);
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);
    const pxPerCm = 20 * state.zoom;
    const monthWidthPx = geo.bMonth * pxPerCm;
    const dayHeightPx = geo.hDay * pxPerCm;

    let targetMonthIdx = -1;
    let xInMonth = 0;

    if (state.viewMode === 'plate') {
      const col = Math.floor(xCss / monthWidthPx);
      if (col >= 0 && col < 3) {
        targetMonthIdx = state.currentMonthIndex + col;
        xInMonth = xCss - (col * monthWidthPx);
      }
    } else {
      const leadInPx = geo.pufferLeft * pxPerCm;
      const xAfterLead = xCss - leadInPx;
      if (xAfterLead >= 0) {
        const col = Math.floor(xAfterLead / monthWidthPx);
        if (col >= 0 && col < 14) {
          targetMonthIdx = col;
          xInMonth = xAfterLead - (col * monthWidthPx);
        }
      }
    }

    if (targetMonthIdx >= 0 && targetMonthIdx < monthsData.length) {
      const month = monthsData[targetMonthIdx];
      const row = Math.floor(yCss / dayHeightPx);
      if (row >= 1 && row <= 31) {
        const day = month.days[row - 1];
        if (day && day.isValid) {
          return {
            dateStr: day.isoDate,
            month: month,
            dayNum: day.dayNum,
            dayName: day.dayName
          };
        }
      }
    }

    return null;
  }

  return {
    render,
    getDateAtCanvasPoint
  };
})();
