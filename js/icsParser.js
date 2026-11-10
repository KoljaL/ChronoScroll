/**
 * CRONOSCROLL — iCAL / .ICS IMPORT & EXPORT
 * Erlaubt das Einlesen und Herunterladen von Terminkalendern (Google Calendar, Apple, Outlook).
 */

window.CronoICS = (function() {
  'use strict';

  function parseIcsDate(raw) {
    if (!raw) return null;
    const clean = raw.trim();
    // Format YYYYMMDD oder YYYYMMDDTHHMMSSZ
    const match = clean.match(/(\d{4})(\d{2})(\d{2})/);
    if (!match) return null;
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  function parseICS(icsText) {
    const lines = icsText.split(/\r\n|\n|\r/);
    const events = [];
    let inEvent = false;
    let current = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Unfolding von mehrzeiligen iCal-Einträgen
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].slice(1);
        i++;
      }

      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        current = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (inEvent && current.summary && current.start) {
          events.push({
            id: 'ics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: current.summary,
            start: current.start,
            end: current.end || current.start,
            color: '#bfdbfe',
            type: 'custom'
          });
        }
        inEvent = false;
      } else if (inEvent) {
        if (line.startsWith('SUMMARY:')) {
          current.summary = line.substring(8).trim().replace(/\\,/g, ',').replace(/\\;/g, ';');
        } else if (line.startsWith('DTSTART')) {
          const val = line.split(':')[1];
          current.start = parseIcsDate(val);
        } else if (line.startsWith('DTEND')) {
          const val = line.split(':')[1];
          current.end = parseIcsDate(val);
        }
      }
    }

    return events;
  }

  function exportToICS(events, calendarName = 'CronoScroll-Kalender') {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CronoScroll//Rollkalender Generator//DE',
      'CALSCALE:GREGORIAN',
      `X-WR-CALNAME:${calendarName}`
    ];

    events.forEach(e => {
      const s = e.start.replace(/-/g, '');
      const endD = new Date(e.end || e.start);
      endD.setDate(endD.getDate() + 1); // iCal DTEND ist exklusiv bei Ganztagesterminen
      const endStr = `${endD.getFullYear()}${String(endD.getMonth()+1).padStart(2,'0')}${String(endD.getDate()).padStart(2,'0')}`;

      ics.push(
        'BEGIN:VEVENT',
        `UID:${e.id}@cronoscroll`,
        `DTSTAMP:${s}T000000Z`,
        `DTSTART;VALUE=DATE:${s}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:${e.title.replace(/,/g, '\\,')}`,
        'END:VEVENT'
      );
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  function downloadICS(events, filename = 'CronoScroll-Termine.ics') {
    const content = exportToICS(events);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    parseICS,
    exportToICS,
    downloadICS
  };
})();
