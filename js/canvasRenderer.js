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
  function drawCropMark(ctx, x, y, lengthPx = 10, offsetPx = 3, monochrome = false) {
    ctx.save();
    ctx.strokeStyle = typeof monochrome === 'string'
      ? monochrome : monochrome ? '#000000' : '#0f172a';
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
      ctx.fillStyle = state.designStyle && state.designStyle !== 'classic'
        ? state.colorText : '#64748b';
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
  function drawMonthColumn(ctx, month, monthIndex, monthLeftPx, monthWidthPx, dayHeightPx, baseFont, state, geo) {
    if (window.CronoDesigns && window.CronoDesigns.active(state)) {
      const scale = 2 * state.zoom;
      const font = getBaseFontFamily(window.CronoDesigns.fontKey(state));
      window.CronoDesigns.drawCanvas(ctx,
        window.CronoDesigns.monthCommands(state, geo, month, monthIndex, monthLeftPx / scale), scale, font);
      return;
    }
    const metrics = geo.getMonthMetrics(monthIndex);
    const pxPerCm = 20 * state.zoom;
    const contentLeftPx = monthLeftPx + metrics.leftInset * pxPerCm;
    const dayColumnWidthPx = metrics.dayColumnWidth * pxPerCm;
    const separator = state.monthSeparators && state.monthSeparators[geo.monthLayout];
    const insetHeader = geo.separatorWidth > 0 && separator.header;
    const headerLeftPx = insetHeader ? contentLeftPx : monthLeftPx;
    const headerWidthPx = insetHeader ? metrics.contentWidth * pxPerCm : monthWidthPx;

    // --- 1. KOPFZEILE (HEADER) ---
    ctx.fillStyle = state.colorHeaderBg || '#f1f5f9';
    ctx.fillRect(headerLeftPx, 0, headerWidthPx, dayHeightPx);
    ctx.strokeStyle = state.colorGrid;
    ctx.lineWidth = Math.max(1, state.lineGrid * state.zoom * 1.5);
    ctx.strokeRect(headerLeftPx, 0, headerWidthPx, dayHeightPx);

    ctx.fillStyle = state.monthHeaderTextColor || state.colorHeaderText || state.colorText;
    ctx.font = `bold ${11 * state.fontHeaderScale * (state.monthHeaderTextSize || 1) * state.zoom}px ${baseFont}`;
    ctx.textAlign = state.headerAlign || 'center';
    ctx.textBaseline = 'middle';

    let headerTitle = month.label.toUpperCase();
    if (state.headerStyle === 'titlecase') {
      headerTitle = month.label;
    } else if (state.headerStyle === 'numbered') {
      headerTitle = `${month.monthNumber} · ${month.monthName.toUpperCase()} ${month.year}`;
    }

    const headerTextX = (state.headerAlign === 'left') ? (headerLeftPx + 10 * state.zoom) : (headerLeftPx + headerWidthPx / 2);
    if (insetHeader) ctx.fillText(headerTitle, headerTextX, dayHeightPx / 2, Math.max(1, headerWidthPx - 20 * state.zoom));
    else ctx.fillText(headerTitle, headerTextX, dayHeightPx / 2);

    // --- 2. TAGESZEILEN (1 BIS 31) ---
    month.days.forEach((day, dIdx) => {
      const position = geo.getDayPosition(dIdx + 1);
      const cellLeftPx = contentLeftPx + (position.column * dayColumnWidthPx);
      const rowTopPx = (position.row + 1) * dayHeightPx;

      if (!day.isValid) {
        // Leere Tage (z. B. 29., 30., 31. Februar)
        ctx.fillStyle = state.colorEmptyDay || '#fafafa';
        ctx.fillRect(cellLeftPx, rowTopPx, dayColumnWidthPx, dayHeightPx);
      } else {
        // Tag-Hintergrund (Feiertag, Samstag, Sonntag, Normal)
        if (day.holiday && day.holiday.color) {
          ctx.fillStyle = day.holiday.color;
          ctx.fillRect(cellLeftPx, rowTopPx, dayColumnWidthPx, dayHeightPx);
        } else if (day.isSunday) {
          ctx.fillStyle = state.colorSundayBg || state.colorWeekendBg;
          ctx.fillRect(cellLeftPx, rowTopPx, dayColumnWidthPx, dayHeightPx);
        } else if (day.isSaturday) {
          ctx.fillStyle = state.colorSaturdayBg || state.colorWeekendBg;
          ctx.fillRect(cellLeftPx, rowTopPx, dayColumnWidthPx, dayHeightPx);
        }
      }

      // Gitterrahmen der Tageszelle
      ctx.strokeStyle = state.colorGrid;
      ctx.lineWidth = Math.max(0.5, state.lineGrid * state.zoom);
      ctx.setLineDash([]);
      ctx.strokeRect(cellLeftPx, rowTopPx, dayColumnWidthPx, dayHeightPx);

      if (day.isValid) {
        // --- 3. MEHRPERSONEN-SPALTENTEILUNG (SUB-COLUMNS) ---
        if (geo.subColumns > 1) {
          ctx.save();
          ctx.strokeStyle = state.colorGrid;
          ctx.lineWidth = Math.max(0.4, (state.lineGrid * 0.7) * state.zoom);
          ctx.setLineDash([2, 2]);
          for (let sc = 1; sc < geo.subColumns; sc++) {
            const scX = cellLeftPx + (sc * (dayColumnWidthPx / geo.subColumns));
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
            ctx.moveTo(cellLeftPx + 22 * state.zoom, gY);
            ctx.lineTo(cellLeftPx + dayColumnWidthPx - 4 * state.zoom, gY);
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
        ctx.fillText(dateStr, cellLeftPx + paddingLeft, textY);

        let leftOffsetPx = paddingLeft + ctx.measureText(dateStr).width + (4 * state.zoom);

        // --- 6. KALENDERWOCHE (KW) BADGE AM MONTAG ---
        if (state.showKW && day.isoWeek) {
          ctx.save();
          ctx.fillStyle = state.calendarWeekTextColor || '#64748b';
          ctx.font = `bold ${7.5 * (state.calendarWeekTextSize || 1) * state.zoom}px ${baseFont}`;
          ctx.fillText(`KW ${day.isoWeek}`, cellLeftPx + leftOffsetPx, textY);
          leftOffsetPx += ctx.measureText(`KW ${day.isoWeek}`).width + (5 * state.zoom);
          ctx.restore();
        }

        // --- 7. MONDPHASEN-PIKTOGRAMM ---
        if (state.showMoon && day.moonPhase) {
          const scale = 2 * state.zoom;
          const background = day.holiday && day.holiday.color ? day.holiday.color
            : day.isSunday ? state.colorSundayBg || state.colorWeekendBg
              : day.isSaturday ? state.colorSaturdayBg || state.colorWeekendBg : null;
          const radius = Math.min(1.2, geo.hDayMm * 0.2);
          window.CronoDesigns.drawCanvas(ctx, window.CronoDesigns.moonCommands(
            day.moonPhase.type, (cellLeftPx + leftOffsetPx) / scale + radius,
            textY / scale, radius, state.moonOpacity, background, state.paperColor), scale, baseFont);
          leftOffsetPx += 12 * state.zoom;
        }

        // --- 8. FEIERTAGS- & TERMIN-TITEL MIT KOLLISIONSSCHUTZ ---
        if (day.holiday && day.holiday.title) {
          ctx.save();
          ctx.font = `italic ${8.5 * state.zoom}px ${baseFont}`;
          ctx.textAlign = 'right';
          ctx.fillStyle = day.holiday.textColor || '#1e293b';

          const maxTitleWidth = (cellLeftPx + dayColumnWidthPx - paddingLeft) - (cellLeftPx + leftOffsetPx + 4 * state.zoom);
          if (maxTitleWidth > 15 * state.zoom) {
            const safeTitle = truncateTextToFit(ctx, day.holiday.title, maxTitleWidth);
            ctx.fillText(safeTitle, cellLeftPx + dayColumnWidthPx - paddingLeft, textY);
          }
          ctx.restore();
        }

        // Multi-Event Farbindikator (wenn mehr als 1 Event an diesem Tag)
        if (day.events && day.events.length > 1) {
          ctx.save();
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(cellLeftPx + dayColumnWidthPx - (3 * state.zoom), rowTopPx + 2 * state.zoom, 2.5 * state.zoom, dayHeightPx - 4 * state.zoom);
          ctx.restore();
        }
      }
    });

    if (geo.dayColumns === 2) {
      const emptyRowTopPx = geo.daysPerColumn * dayHeightPx;
      ctx.fillStyle = state.colorEmptyDay || '#fafafa';
      ctx.fillRect(contentLeftPx, emptyRowTopPx, dayColumnWidthPx, dayHeightPx);
      ctx.strokeStyle = state.colorGrid;
      ctx.lineWidth = Math.max(0.5, state.lineGrid * state.zoom);
      ctx.strokeRect(contentLeftPx, emptyRowTopPx, dayColumnWidthPx, dayHeightPx);
    }
  }

  function drawMonthSeparators(ctx, geo, state, firstMonth, count, startPx, monthWidthPx, dayHeightPx, heightPx) {
    if (!geo.separatorWidth) return;
    const separator = state.monthSeparators[geo.monthLayout];
    const widthPx = geo.separatorWidth * 20 * state.zoom;
    const topPx = separator.header ? 0 : dayHeightPx;
    const color = separator.colorMode === 'paper' ? state.paperColor : separator.color;
    for (let i = 0; i <= count; i++) {
      const boundary = firstMonth + i;
      if (boundary <= 0 || boundary >= 14) continue;
      const center = startPx + i * monthWidthPx;
      const left = Math.max(startPx, center - widthPx / 2);
      const right = Math.min(startPx + count * monthWidthPx, center + widthPx / 2);
      ctx.fillStyle = state.paperColor || '#ffffff';
      ctx.fillRect(left, topPx, right - left, heightPx - topPx);
      ctx.fillStyle = color;
      ctx.fillRect(left, topPx, right - left, heightPx - topPx);
    }
  }

  // Haupt-Rendermethode
  function render(canvas, container, state, renderOptions = {}) {
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', renderOptions.contextAttributes);
    if (!ctx) throw new Error('Canvas-Kontext konnte nicht erstellt werden.');
    const geo = window.CronoGeometry.calculate(state);
    const monthsData = window.CronoHolidays.get14MonthsData(state.year, state.holidays, state);
    const updateUi = renderOptions.updateUi !== false;
    const showViewportOverlay = renderOptions.showViewportOverlay !== false;
    const design = window.CronoDesigns && window.CronoDesigns.active(state);
    const bufferState = state;

    // HiDPI / Retina Device Pixel Ratio
    const dpr = renderOptions.pixelRatio ?? window.devicePixelRatio ?? 1;
    state.dpr = dpr;

    const pxPerCm = 20 * state.zoom;
    const baseFont = getBaseFontFamily(state.fontFamily);
    const monthWidthPx = geo.bMonth * pxPerCm;
    const dayHeightPx = geo.hDay * pxPerCm;
    const leadInPx = ((geo.leadInMm ?? geo.pufferLeftMm) / 10) * pxPerCm;
    const leadOutPx = ((geo.leadOutMm ?? geo.pufferRightMm) / 10) * pxPerCm;
    const cropStyle = ['none', 'corners', 'lines'].includes(state.cropMarkStyle)
      ? state.cropMarkStyle
      : (state.showCropMarks ? 'corners' : 'none');

    let targetWidthPx = 0;
    let targetHeightPx = state.hVisible * pxPerCm;

    container.style.justifyContent = 'flex-start';
    canvas.style.marginInline = state.viewMode === 'plate' ? 'auto' : '0';

    if (state.viewMode === 'plate') {
      // --- MODUS 1: 3-MONATS-SCHREIBPLATTE ---
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
          drawMonthColumn(ctx, month, mIdx, i * monthWidthPx, monthWidthPx, dayHeightPx, baseFont, state, geo);
        }
      }
      drawMonthSeparators(ctx, geo, state, state.currentMonthIndex, 3, 0, monthWidthPx, dayHeightPx, targetHeightPx);

      // Außenrahmen
      if (state.designStyle !== 'zen') {
        ctx.strokeStyle = design ? state.colorText : state.colorBorder || '#0f172a';
        ctx.lineWidth = Math.max(2, state.lineBorder * state.zoom * 2);
        ctx.strokeRect(0, 0, targetWidthPx, targetHeightPx);
      }

      // Schnittmarken
      if (cropStyle === 'corners') {
        const cropColor = design ? state.colorText : design;
        drawCropMark(ctx, 0, 0, 10, 3, cropColor);
        drawCropMark(ctx, targetWidthPx, 0, 10, 3, cropColor);
        drawCropMark(ctx, 0, targetHeightPx, 10, 3, cropColor);
        drawCropMark(ctx, targetWidthPx, targetHeightPx, 10, 3, cropColor);
      } else if (cropStyle === 'lines') {
        ctx.save();
        ctx.strokeStyle = (design ? state.colorText : null) || '#0f172a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0.5, 0);
        ctx.lineTo(0.5, targetHeightPx);
        ctx.moveTo(targetWidthPx - 0.5, 0);
        ctx.lineTo(targetWidthPx - 0.5, targetHeightPx);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // UI-Labels aktualisieren
      if (updateUi) {
        const firstM = monthsData[state.currentMonthIndex];
        const thirdM = monthsData[state.currentMonthIndex + 2];
        if (firstM && thirdM) {
          const elDim = document.getElementById('status-dimensions');
          if (elDim) elDim.textContent = `Sichtfenster: ${geo.bVisible.toFixed(1)} cm × ${state.hVisible.toFixed(1)} cm (${firstM.label} bis ${thirdM.label})`;
        }
      }

    } else {
      // --- MODUS 2: GANZE DRUCKROLLE (14 MONATE) ---
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
      ctx.fillStyle = design ? state.paperColor || '#ffffff' : '#f8fafc';
      ctx.fillRect(0, 0, leadInPx, targetHeightPx);

      if (state.pufferLeftContent === 'year_overview') {
        drawMiniYearOverview(ctx, state.year, 0, 0, leadInPx, targetHeightPx, bufferState);
      } else if (state.pufferLeftContent === 'notes') {
        drawBufferNotes(ctx, 'Notizen & Termine', 0, 0, leadInPx, targetHeightPx, bufferState);
      } else if (state.pufferLeftContent === 'title') {
        ctx.fillStyle = state.colorText;
        ctx.font = `bold ${14 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText(state.bannerCustomTitle || `CRONOSCROLL ${state.year}`, leadInPx / 2, targetHeightPx / 2 - 10 * state.zoom);
        ctx.font = `${9 * state.zoom}px ${baseFont}`;
        ctx.fillStyle = design ? state.colorHeaderText || state.colorText : '#64748b';
        ctx.fillText('14-Monate-Endlosbanner für Holz-Rollkalender', leadInPx / 2, targetHeightPx / 2 + 10 * state.zoom);
      } else {
        ctx.fillStyle = design ? state.colorText : '#94a3b8';
        ctx.font = `${11 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText('WICKEL-PUFFER (MONTAGE)', leadInPx / 2, targetHeightPx / 2);
      }

      // --- 14 MONATE ZEICHNEN ---
      monthsData.forEach((month, mIdx) => {
        const monthLeftPx = leadInPx + (mIdx * monthWidthPx);
        drawMonthColumn(ctx, month, mIdx, monthLeftPx, monthWidthPx, dayHeightPx, baseFont, state, geo);
      });
      drawMonthSeparators(ctx, geo, state, 0, 14, leadInPx, monthWidthPx, dayHeightPx, targetHeightPx);

      // --- NACHLAUF (WICKEL-PUFFER RECHTS) ---
      const leadOutStartPx = targetWidthPx - leadOutPx;
      ctx.fillStyle = design ? state.paperColor || '#ffffff' : '#f8fafc';
      ctx.fillRect(leadOutStartPx, 0, leadOutPx, targetHeightPx);

      if (state.pufferRightContent === 'notes') {
        drawBufferNotes(ctx, 'Jahres-Rückblick', leadOutStartPx, 0, leadOutPx, targetHeightPx, bufferState);
      } else {
        ctx.fillStyle = design ? state.colorText : '#94a3b8';
        ctx.font = `${11 * state.zoom}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.fillText('WICKEL-PUFFER (MONTAGE)', leadOutStartPx + (leadOutPx / 2), targetHeightPx / 2);
      }

      if (renderOptions.qrErrorHandler) {
        try {
          drawCoverageQr(ctx, state, geo, 2 * state.zoom);
          renderOptions.qrErrorHandler(null);
        } catch (error) {
          renderOptions.qrErrorHandler(error);
        }
      } else {
        drawCoverageQr(ctx, state, geo, 2 * state.zoom);
      }

      // Außenrahmen
      if (state.designStyle !== 'zen') {
        ctx.strokeStyle = design ? state.colorText : state.colorBorder || '#0f172a';
        ctx.lineWidth = Math.max(2, state.lineBorder * state.zoom * 2);
        ctx.strokeRect(0, 0, targetWidthPx, targetHeightPx);
      }

      // Schnittmarken
      if (cropStyle === 'corners') {
        const cropColor = design ? state.colorText : design;
        const viewportStartPx = leadInPx + (state.currentMonthIndex * monthWidthPx);
        const viewportEndPx = viewportStartPx + (geo.bVisible * pxPerCm);
        drawCropMark(ctx, viewportStartPx, 0, 10, 3, cropColor);
        drawCropMark(ctx, viewportEndPx, 0, 10, 3, cropColor);
        drawCropMark(ctx, viewportStartPx, targetHeightPx, 10, 3, cropColor);
        drawCropMark(ctx, viewportEndPx, targetHeightPx, 10, 3, cropColor);
      } else if (cropStyle === 'lines') {
        const viewportStartPx = leadInPx + (state.currentMonthIndex * monthWidthPx);
        const viewportEndPx = viewportStartPx + (geo.bVisible * pxPerCm);
        ctx.save();
        ctx.strokeStyle = (design ? state.colorText : null) || '#0f172a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(viewportStartPx, 0);
        ctx.lineTo(viewportStartPx, targetHeightPx);
        ctx.moveTo(viewportEndPx, 0);
        ctx.lineTo(viewportEndPx, targetHeightPx);
        ctx.stroke();
        ctx.restore();
      }

      if (showViewportOverlay) {
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
      }

      ctx.restore();

      if (updateUi) {
        const elDim = document.getElementById('status-dimensions');
        if (elDim) elDim.textContent = `Druckbanner: ${geo.lTotal.toFixed(1)} cm × ${state.hVisible.toFixed(1)} cm (14 Monate)`;
      }
    }

    if (updateUi) {
      // Mathematische Geometrie im UI aktualisieren
      const elBMonth = document.getElementById('calc-b-month');
      if (elBMonth) elBMonth.textContent = `${geo.bMonth.toFixed(2)} cm`;
      const elHDay = document.getElementById('calc-h-day');
      if (elHDay) elHDay.textContent = `${geo.hDay.toFixed(3)} cm`;
      const elLTotal = document.getElementById('calc-l-total');
      if (elLTotal) elLTotal.textContent = `${geo.lTotal.toFixed(2)} cm`;
      const elYearRange = document.getElementById('year-range-display');
      if (elYearRange) elYearRange.textContent = `${state.year - 1} – ${state.year + 1}`;
      const elZoomInd = document.getElementById('preview-scale-indicator');
      if (elZoomInd) elZoomInd.textContent = `${Math.round(state.zoom * 100)}%`;
    }
  }

  function estimateInkCoverage(imageData) {
    const pixels = imageData.data.length / 4;
    if (!pixels) throw new Error('Gerenderte Bannerdaten sind leer.');

    let blackTotal = 0;
    let colorTotal = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3] / 255;
      const red = (imageData.data[i] * alpha + 255 * (1 - alpha)) / 255;
      const green = (imageData.data[i + 1] * alpha + 255 * (1 - alpha)) / 255;
      const blue = (imageData.data[i + 2] * alpha + 255 * (1 - alpha)) / 255;
      const black = 1 - Math.max(red, green, blue);
      blackTotal += black;

      if (black < 1) {
        colorTotal += (
          (1 - red - black) +
          (1 - green - black) +
          (1 - blue - black)
        ) / (1 - black);
      }
    }

    return {
      blackPercent: blackTotal / pixels * 100,
      colorPercent: colorTotal / pixels * 100
    };
  }

  function drawCoverageQr(ctx, state, geo, pixelsPerMm) {
    const data = window.CronoGeometry.createQr(state, geo, window);
    if (!data) return;
    const { qr, count: moduleCount } = data;
    const qrSize = data.size * pixelsPerMm;
    const moduleSize = data.moduleSize * pixelsPerMm;
    const qrX = data.x * pixelsPerMm;
    const qrY = data.y * pixelsPerMm;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount;) {
        if (!qr.isDark(row, col)) {
          col++;
          continue;
        }
        const start = col++;
        while (col < moduleCount && qr.isDark(row, col)) col++;
        ctx.fillRect(qrX + (start + 4) * moduleSize, qrY + (row + 4) * moduleSize,
          (col - start) * moduleSize, moduleSize);
      }
    }
  }

  let cachedCoverageKey = null;
  let cachedCoverage = null;
  function calculateCoverage(state) {
    const coverageState = {
      ...state,
      viewMode: 'banner',
      currentMonthIndex: 0,
      zoom: 0.25
    };
    for (const key of ['isDraggingViewport', 'dragStartX', 'isPanning',
      'panStartX', 'panStartY', 'scrollStartX', 'scrollStartY']) {
      delete coverageState[key];
    }
    const cacheKey = JSON.stringify({
      state: coverageState,
      fontFamily: getBaseFontFamily(coverageState.fontFamily)
    });
    if (cacheKey === cachedCoverageKey) return { ...cachedCoverage };

    const canvas = document.createElement('canvas');
    const container = { style: {} };
    render(canvas, container, coverageState, {
      contextAttributes: { willReadFrequently: true },
      pixelRatio: 1,
      showViewportOverlay: false,
      updateUi: false
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas-Kontext für die Druckschätzung fehlt.');
    const coverage = estimateInkCoverage(ctx.getImageData(0, 0, canvas.width, canvas.height));

    cachedCoverageKey = cacheKey;
    cachedCoverage = coverage;
    return { ...coverage };
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
      const leadInPx = ((geo.leadInMm ?? geo.pufferLeftMm) / 10) * pxPerCm;
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
      const metrics = geo.getMonthMetrics(targetMonthIdx);
      const xInContent = xInMonth - metrics.leftInset * pxPerCm;
      const contentWidthPx = metrics.contentWidth * pxPerCm;
      if (xInContent < 0 || xInContent >= contentWidthPx) return null;
      const dayColumnWidthPx = metrics.dayColumnWidth * pxPerCm;
      const dayColumn = Math.floor(xInContent / dayColumnWidthPx);
      const row = Math.floor(yCss / dayHeightPx) - 1;
      if (dayColumn >= 0 && dayColumn < geo.dayColumns && row >= 0 && row < geo.daysPerColumn) {
        if (geo.dayColumns === 2 && dayColumn === 0 && row >= 15) return null;
        const dayNum = dayColumn === 0 ? row + 1 : row + 16;
        const day = month.days[dayNum - 1];
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
    estimateInkCoverage,
    calculateCoverage,
    getDateAtCanvasPoint
  };
})();
