/**
 * Gemeinsame, millimetergenaue Zeichenbefehle für die zusätzlichen Designs.
 */
window.CronoDesigns = (function() {
  'use strict';

  const styles = ['midcentury', 'bauhaus', 'gantt', 'zen', 'kursbuch'];
  const active = state => styles.includes(state.designStyle);
  const fontKey = state => state.themeKey &&
    (!window.CronoThemes || window.CronoThemes.isValidKey(state.themeKey))
    ? state.fontFamily
    : state.designStyle === 'gantt' || state.designStyle === 'kursbuch' ? 'mono' : 'sans';

  function contrastText(background, preferred) {
    const rgb = /^#([0-9a-f]{6})$/i.exec(background || '');
    if (!rgb) return preferred || '#000000';
    const channels = rgb[1].match(/../g).map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    const blackContrast = (luminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (luminance + 0.05);
    if (preferred) {
      const match = /^#([0-9a-f]{6})$/i.exec(preferred);
      if (match) {
        const preferredChannels = match[1].match(/../g).map(value => {
          const channel = parseInt(value, 16) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        const preferredLuminance = 0.2126 * preferredChannels[0] +
          0.7152 * preferredChannels[1] + 0.0722 * preferredChannels[2];
        const contrast = (Math.max(luminance, preferredLuminance) + 0.05) /
          (Math.min(luminance, preferredLuminance) + 0.05);
        if (contrast >= 4.5) return preferred;
      }
    }
    return blackContrast >= whiteContrast ? '#000000' : '#ffffff';
  }

  function moonCommands(phase, x, y, radius, opacity, background, paper = '#ffffff') {
    const alpha = Math.max(0, Math.min(1, Number.isFinite(opacity) ? opacity : 0.89));
    if (!alpha) return [];
    const baseColor = background
      ? window.CronoGeometry.flattenColor(background, paper)
      : window.CronoGeometry.flattenColor(paper);
    const base = /^#([0-9a-f]{6})$/i.exec(baseColor);
    const channels = base[1].match(/../g).map((value, i) =>
      Math.round(parseInt(value, 16) * (1 - alpha) + [71, 85, 105][i] * alpha));
    const color = `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
    const commands = [{
      type: 'circle', x, y, r: radius, fill: phase === 'new',
      fillColor: color, strokeColor: color
    }];
    if (phase === 'first_quarter' || phase === 'last_quarter') {
      for (let dy = -radius + 0.1; dy < radius; dy += 0.2) {
        const dx = Math.sqrt(Math.max(0, radius * radius - dy * dy));
        commands.push({
          type: 'line', x1: phase === 'first_quarter' ? x - dx : x,
          x2: phase === 'first_quarter' ? x : x + dx,
          y1: y + dy, y2: y + dy, width: 0.2, strokeColor: color
        });
      }
    }
    return commands;
  }

  function monthCommands(state, geo, month, index, left) {
    const commands = [];
    const style = state.designStyle;
    const colors = window.CronoThemes
      ? window.CronoThemes.colorRoles(state)
      : {
        grid: state.colorGrid || '#000000',
        text: state.colorText || '#000000',
        header: {
          background: state.colorHeaderBg || state.paperColor || '#ffffff',
          text: state.colorHeaderText || state.colorText || '#000000'
        },
        saturday: {
          background: state.colorSaturdayBg || state.colorWeekendBg || state.paperColor || '#ffffff',
          text: state.colorSaturdayText || state.colorWeekendText || state.colorText || '#000000'
        },
        sunday: {
          background: state.colorSundayBg || state.colorWeekendBg || state.paperColor || '#ffffff',
          text: state.colorSundayText || state.colorWeekendText || state.colorText || '#000000'
        },
        highlight: state.colorSundayText || state.colorHeaderText || state.colorText || '#000000'
      };
    const gridColor = colors.grid;
    const textColor = colors.text;
    const headerBg = colors.header.background;
    const headerText = state.monthHeaderTextColor || colors.header.text;
    const highlight = colors.highlight;
    const metrics = geo.getMonthMetrics(index);
    const x = left + metrics.leftInsetMm;
    const w = metrics.dayColumnWidthMm;
    const h = geo.hDayMm;
    const fullWidth = metrics.contentWidthMm;
    const line = (x1, y1, x2, y2, width = 0.15, dash = false) =>
      commands.push({ type: 'line', x1, y1, x2, y2, width, dash, strokeColor: gridColor });
    const rect = (rx, ry, rw, rh, fill = false, width = 0.15, fillColor = textColor) =>
      commands.push({ type: 'rect', x: rx, y: ry, w: rw, h: rh, fill, width, fillColor, strokeColor: gridColor });
    const text = (value, tx, ty, size, maxWidth, options = {}) =>
      commands.push({
        type: 'text', value: String(value), x: tx, y: ty, size,
        maxWidth: Math.max(0.1, maxWidth), textColor, ...options
      });
    const circle = (cx, cy, r, fill = false) =>
      commands.push({ type: 'circle', x: cx, y: cy, r, fill,
        fillColor: highlight, strokeColor: gridColor });
    const daySize = Math.min(5 * (state.fontDayScale || 1), h * 0.55, w * 0.16);
    const headerSize = Math.min(5.5 * (state.fontHeaderScale || 1) * (state.monthHeaderTextSize || 1), h * 0.65);
    const weekSize = daySize * 0.75 * (state.calendarWeekTextSize || 1);
    const headerY = h * (style === 'gantt' ? 0.35 : 0.52);
    if (style === 'midcentury') rect(x, 0, fullWidth, h, true, 0.15, headerBg);
    let headerTitle = month.label.toUpperCase();
    if (state.headerStyle === 'titlecase') headerTitle = month.label;
    else if (state.headerStyle === 'numbered') headerTitle = `${month.monthNumber} · ${month.monthName.toUpperCase()} ${month.year}`;
    const leftHeader = state.headerAlign === 'left' || (state.headerAlign == null && style === 'bauhaus');
    text(headerTitle, leftHeader ? x + 2 : x + fullWidth / 2,
      headerY, headerSize, fullWidth - 4,
      {
        align: leftHeader ? 'left' : 'center',
        bold: style !== 'zen',
        textColor: state.monthHeaderTextColor || (style === 'midcentury' ? contrastText(headerBg, headerText) : headerText)
      });

    if (style === 'gantt') {
      for (let col = 0; col < geo.dayColumns; col++) {
        const cx = x + col * w;
        const strip = Math.min(15, w * 0.28);
        const lane = (w - strip) / 3;
        ['PROJEKTE', 'MATERIAL', 'TERMINE'].forEach((label, i) => {
          text(label, cx + strip + lane * (i + 0.5), h * 0.78,
            Math.min(3.75, h * 0.375), lane - 1, { align: 'center' });
        });
        for (let i = 0; i <= 3; i++) line(cx + strip + i * lane, h, cx + strip + i * lane, geo.hVisibleMm);
      }
    }

    month.days.forEach((day, i) => {
      if (!day.isValid) return;
      const pos = geo.getDayPosition(i + 1);
      const cx = x + pos.column * w;
      const y = (pos.row + 1) * h;
      const cy = y + h / 2;
      const weekend = day.isSaturday || day.isSunday;
      const strip = Math.min(style === 'kursbuch' ? 22 : 19, w * 0.38);
      const date = String(day.dayNum).padStart(2, '0');
      const dayTextColor = day.isSunday
        ? colors.sunday.text
        : day.isSaturday
          ? colors.saturday.text
          : textColor;
      let detailStart = strip + 1;

      if (style === 'midcentury') {
        line(cx, y, cx + w, y, 0.25 * 25.4 / 72);
        text(date + ' ' + day.dayName, cx + 2, cy, daySize, strip - 3, { textColor: dayTextColor });
        if (state.showKW && day.isoWeek) {
          const r = Math.min(3.75, h * 0.375, Math.max(0.1, (w - strip - 1) / 2));
          circle(cx + strip + r, cy, r);
          text(day.isoWeek, cx + strip + r, cy, Math.min(weekSize, r), 2 * r - 0.3, { align: 'center', textColor: state.calendarWeekTextColor || textColor });
          detailStart = strip + 2 * r + 1;
        }
        if (day.dayNum === 1) {
          line(cx + w - 4, cy, cx + w - 1, cy);
          line(cx + w - 1, cy, cx + w - 2, cy - 1);
          line(cx + w - 1, cy, cx + w - 2, cy + 1);
        }
      } else if (style === 'bauhaus') {
        const weekendBg = day.isSunday ? colors.sunday.background : colors.saturday.background;
        if (weekend) rect(cx, y, strip, h, true, 0.15, weekendBg);
        text(date, cx + 1.5, cy, daySize, strip * 0.4, {
          bold: true,
          textColor: weekend ? contrastText(weekendBg, dayTextColor) : dayTextColor
        });
        text(day.dayName.toUpperCase().split('').join(' '), cx + strip * 0.48, cy,
          daySize, strip * 0.48, {
            textColor: weekend ? contrastText(weekendBg, dayTextColor) : dayTextColor
          });
      } else if (style === 'gantt') {
        const laneStart = Math.min(15, w * 0.28);
        text(date + ' ' + day.dayName, cx + 1, cy, daySize, laneStart - 2, { textColor: dayTextColor });
        if (state.showKW && day.isoWeek) {
          text('KW ' + day.isoWeek, cx + laneStart + 1, cy, weekSize,
            Math.max(0.1, (w - laneStart) / 3 - 2), { textColor: state.calendarWeekTextColor || textColor });
        }
        if (day.dayName === 'Mo') {
          line(cx, y, cx + w, y, 0.25);
          const lane = (w - laneStart) / 3;
          for (let n = 0; n < 3; n++) {
            const size = Math.min(1.5, h * 0.2, lane * 0.2);
            rect(cx + laneStart + lane * (n + 0.5) - size / 2, y - size / 2, size, size);
          }
        }
      } else if (style === 'zen') {
        line(cx, y, cx + w, y, 0.08, true);
        if (day.isSunday || (day.events || []).some(event => event.type === 'public') ||
            (day.holiday && day.holiday.type === 'public')) circle(cx + 2, cy, 0.45, true);
        text(date + ' ' + day.dayName, cx + 4, cy, daySize, strip - 4, { textColor: dayTextColor });
      } else {
        line(cx, y, cx + w, y, 0.18);
        if (day.dayName === 'Mo') line(cx, y + Math.min(0.7, h * 0.1), cx + w, y + Math.min(0.7, h * 0.1), 0.18);
        const utc = Date.UTC(month.year, Number(month.monthNumber) - 1, day.dayNum);
        const ordinal = Math.floor((utc - Date.UTC(month.year, 0, 1)) / 86400000) + 1;
        const counterWidth = Math.min(8, w * 0.15);
        line(cx + counterWidth, y, cx + counterWidth, y + h);
        text(String(ordinal).padStart(3, '0'), cx + counterWidth / 2, cy, daySize, counterWidth - 1, { align: 'center' });
        text(date + ' ' + day.dayName, cx + counterWidth + 1, cy, daySize,
          strip - counterWidth - 1, { textColor: dayTextColor });
      }

      if (state.showKW && day.isoWeek && style !== 'midcentury' && style !== 'gantt' && w - strip > 20) {
        text('KW ' + day.isoWeek, cx + strip + 1, cy, weekSize, 9, { textColor: state.calendarWeekTextColor || textColor });
        detailStart += 10;
      }
      if (state.showMoon && day.moonPhase && w - detailStart > 9) {
        const r = Math.min(1.2, h * 0.2);
        const mx = cx + detailStart + r;
        commands.push(...moonCommands(day.moonPhase.type, mx, cy, r, state.moonOpacity, state.paperColor));
        detailStart += 2 * r + 1;
      }
      if (day.holiday && day.holiday.title && w - detailStart > 8) {
        text(day.holiday.title, cx + w - 2, cy, daySize * 0.85, w - detailStart - 2, { align: 'right' });
      }
    });
    return commands;
  }

  function drawCanvas(ctx, commands, scale, font) {
    ctx.save();
    ctx.textBaseline = 'middle';
    commands.forEach(c => {
      ctx.strokeStyle = c.strokeColor || '#000000';
      ctx.fillStyle = c.fillColor || (c.white ? '#ffffff' : '#000000');
      ctx.lineWidth = (c.width || 0.15) * scale;
      ctx.setLineDash(c.dash ? [0.2 * scale, 0.8 * scale] : []);
      if (c.type === 'line') {
        ctx.beginPath(); ctx.moveTo(c.x1 * scale, c.y1 * scale);
        ctx.lineTo(c.x2 * scale, c.y2 * scale); ctx.stroke();
      } else if (c.type === 'rect') {
        if (c.fill) ctx.fillRect(c.x * scale, c.y * scale, c.w * scale, c.h * scale);
        else ctx.strokeRect(c.x * scale, c.y * scale, c.w * scale, c.h * scale);
      } else if (c.type === 'circle') {
        ctx.beginPath(); ctx.arc(c.x * scale, c.y * scale, c.r * scale, 0, 2 * Math.PI);
        if (c.fill) ctx.fill(); else ctx.stroke();
      } else {
        ctx.font = `${c.bold ? 'bold ' : ''}${c.size * scale}px ${font}`;
        ctx.textAlign = c.align || 'left';
        ctx.fillStyle = c.textColor || (c.white ? '#ffffff' : '#000000');
        ctx.fillText(c.value, c.x * scale, c.y * scale, Math.max(0.1, c.maxWidth * scale));
      }
    });
    ctx.restore();
  }

  function hexRgb(hex, background = '#ffffff') {
    const match = /^#([0-9a-f]{6})$/i.exec(window.CronoGeometry.flattenColor(hex || '#000000', background));
    if (!match) return [0, 0, 0];
    return match[1].match(/../g).map(channel => parseInt(channel, 16));
  }

  function drawPdf(doc, commands, font, background = '#ffffff') {
    commands.forEach(c => {
      const stroke = hexRgb(c.strokeColor || '#000000', background);
      doc.setDrawColor(...stroke);
      doc.setLineWidth(c.width || 0.15);
      doc.setLineDashPattern(c.dash ? [0.2, 0.8] : [], 0);
      if (c.type === 'line') doc.line(c.x1, c.y1, c.x2, c.y2);
      else if (c.type === 'rect') {
        doc.setFillColor(...hexRgb(c.fillColor || '#000000', background));
        doc.rect(c.x, c.y, c.w, c.h, c.fill ? 'F' : 'D');
      } else if (c.type === 'circle') {
        doc.setFillColor(...hexRgb(c.fillColor || '#000000', background));
        doc.circle(c.x, c.y, c.r, c.fill ? 'F' : 'D');
      } else {
        doc.setTextColor(...hexRgb(c.textColor || (c.white ? '#ffffff' : '#000000'), background));
        doc.setFont(font, c.bold ? 'bold' : 'normal');
        let size = c.size * 72 / 25.4;
        doc.setFontSize(size);
        const width = doc.getTextWidth(c.value);
        if (width > c.maxWidth) { size *= c.maxWidth / width; doc.setFontSize(size); }
        doc.text(c.value, c.x, c.y + size * 25.4 / 72 * 0.35, { align: c.align || 'left' });
      }

    });
    doc.setLineDashPattern([], 0);
  }

  function escapeXml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function svgCommands(commands, font) {
    return commands.map(c => {
      if (c.type === 'line') return `<line x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" stroke="${c.strokeColor || '#000'}" stroke-width="${c.width}"${c.dash ? ' stroke-dasharray="0.2 0.8"' : ''}/>`;
      if (c.type === 'rect') return `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.fill ? c.fillColor || '#000' : 'none'}" stroke="${c.strokeColor || '#000'}" stroke-width="${c.width}"/>`;
      if (c.type === 'circle') return `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="${c.fill ? c.fillColor || '#000' : 'none'}" stroke="${c.strokeColor || '#000'}" stroke-width="0.15"/>`;
      const anchor = c.align === 'center' ? 'middle' : c.align === 'right' ? 'end' : 'start';
      const clipX = c.x - (c.align === 'center' ? c.maxWidth / 2 : c.align === 'right' ? c.maxWidth : 0);
      return `<svg x="${clipX}" y="${c.y - c.size}" width="${Math.max(0.1, c.maxWidth)}" height="${c.size * 2}" viewBox="0 0 ${Math.max(0.1, c.maxWidth)} ${c.size * 2}" overflow="hidden"><text x="${c.x - clipX}" y="${c.size * 1.35}" text-anchor="${anchor}" style="font-family:'${escapeXml(font)}'" font-size="${c.size}" font-weight="${c.bold ? 'bold' : 'normal'}" fill="${c.textColor || (c.white ? '#fff' : '#000')}">${escapeXml(c.value)}</text></svg>`;
    });
  }

  return { styles, active, fontKey, monthCommands, moonCommands, drawCanvas, drawPdf, svgCommands };
})();
