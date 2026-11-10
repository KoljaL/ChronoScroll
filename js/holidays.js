/**
 * CRONOSCROLL — DACH HOLIDAYS & VACATION ENGINE
 * Umfassende Feiertags- & Schulferienberechnung für Deutschland (16 Länder),
 * Österreich (9 Länder) und die Schweiz (Kantone).
 */

window.CronoHolidays = (function() {
  'use strict';

  const MONTH_NAMES = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const DAY_SHORT_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // Gaußsche / Spencer-Osterformel (Gregorianisch)
  function getEaster(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }

  function addDays(d, count) {
    const r = new Date(d);
    r.setDate(r.getDate() + count);
    return r;
  }

  function formatIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // --- 1. DEUTSCHLAND (16 BUNDESLÄNDER) ---
  function getGermanHolidaysForYear(y, stateCode = 'NW') {
    const list = [];
    const add = (title, dateStr, color = '#fef08a') => {
      list.push({ id: `h_${dateStr}_${title.replace(/\s+/g, '')}`, title, start: dateStr, end: dateStr, color, type: 'public' });
    };

    // Bundesweite Feiertage
    add('Neujahr', `${y}-01-01`);
    const easter = getEaster(y);
    add('Karfreitag', formatIso(addDays(easter, -2)));
    add('Ostersonntag', formatIso(easter));
    add('Ostermontag', formatIso(addDays(easter, 1)));
    add('Tag der Arbeit', `${y}-05-01`);
    add('Christi Himmelfahrt', formatIso(addDays(easter, 39)));
    add('Pfingstsonntag', formatIso(addDays(easter, 49)));
    add('Pfingstmontag', formatIso(addDays(easter, 50)));
    add('Tag der Dt. Einheit', `${y}-10-03`);
    add('1. Weihnachtstag', `${y}-12-25`);
    add('2. Weihnachtstag', `${y}-12-26`);

    // Länderspezifische Feiertage
    if (['BW', 'BY', 'ST'].includes(stateCode)) add('Hl. Drei Könige', `${y}-01-06`);
    if (['BE', 'MV'].includes(stateCode)) add('Frauentag', `${y}-03-08`);
    if (['NW', 'BW', 'BY', 'HE', 'RP', 'SL'].includes(stateCode)) {
      add('Fronleichnam', formatIso(addDays(easter, 60)));
    }
    if (['BY', 'SL'].includes(stateCode)) add('Mariä Himmelfahrt', `${y}-08-15`);
    if (stateCode === 'TH') add('Weltkindertag', `${y}-09-20`);
    if (['BB', 'HB', 'HH', 'MV', 'NI', 'SH', 'SN', 'ST', 'TH'].includes(stateCode)) {
      add('Reformationstag', `${y}-10-31`);
    }
    if (['NW', 'BW', 'BY', 'RP', 'SL'].includes(stateCode)) {
      add('Allerheiligen', `${y}-11-01`);
    }
    if (stateCode === 'SN') {
      const nov23 = new Date(y, 10, 23);
      const dayOfWeek = nov23.getDay();
      const diff = (dayOfWeek >= 3) ? (dayOfWeek - 3) : (dayOfWeek + 4);
      const bussTag = new Date(y, 10, 23 - (diff === 0 ? 7 : diff));
      add('Buß- und Bettag', formatIso(bussTag));
    }

    return list;
  }

  // --- 2. ÖSTERREICH (9 BUNDESLÄNDER) ---
  function getAustrianHolidaysForYear(y, stateCode = 'W') {
    const list = [];
    const add = (title, dateStr, color = '#fef08a') => {
      list.push({ id: `h_at_${dateStr}_${title.replace(/\s+/g, '')}`, title, start: dateStr, end: dateStr, color, type: 'public' });
    };

    add('Neujahr', `${y}-01-01`);
    add('Hl. Drei Könige', `${y}-01-06`);
    const easter = getEaster(y);
    add('Ostermontag', formatIso(addDays(easter, 1)));
    add('Staatsfeiertag', `${y}-05-01`);
    add('Christi Himmelfahrt', formatIso(addDays(easter, 39)));
    add('Pfingstmontag', formatIso(addDays(easter, 50)));
    add('Fronleichnam', formatIso(addDays(easter, 60)));
    add('Mariä Himmelfahrt', `${y}-08-15`);
    add('Nationalfeiertag', `${y}-10-26`);
    add('Allerheiligen', `${y}-11-01`);
    add('Mariä Empfängnis', `${y}-12-08`);
    add('Christtag', `${y}-12-25`);
    add('Stefanitag', `${y}-12-26`);

    // Landespatrone
    if (['K', 'ST', 'T', 'V'].includes(stateCode)) add('Josefstag', `${y}-03-19`);
    if (stateCode === 'OOE') add('Florianitag', `${y}-05-04`);
    if (stateCode === 'S') add('Rupertitag', `${y}-09-24`);
    if (stateCode === 'K') add('Tag der Volksabstimmung', `${y}-10-10`);
    if (stateCode === 'B') add('Martinstag', `${y}-11-11`);
    if (['NOE', 'W'].includes(stateCode)) add('Leopolditag', `${y}-11-15`);

    return list;
  }

  // --- 3. SCHWEIZ (KANTONE) ---
  function getSwissHolidaysForYear(y, canton = 'ZH') {
    const list = [];
    const add = (title, dateStr, color = '#fef08a') => {
      list.push({ id: `h_ch_${dateStr}_${title.replace(/\s+/g, '')}`, title, start: dateStr, end: dateStr, color, type: 'public' });
    };

    add('Neujahr', `${y}-01-01`);
    if (['ZH', 'BE', 'LU', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'TG', 'VD', 'NE', 'GE', 'JU'].includes(canton)) {
      add('Berchtoldstag', `${y}-01-02`);
    }
    const easter = getEaster(y);
    add('Karfreitag', formatIso(addDays(easter, -2)));
    add('Ostermontag', formatIso(addDays(easter, 1)));
    add('Auffahrt', formatIso(addDays(easter, 39)));
    add('Pfingstmontag', formatIso(addDays(easter, 50)));
    if (['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG', 'FR', 'SO', 'AI', 'TI', 'VS', 'JU'].includes(canton)) {
      add('Fronleichnam', formatIso(addDays(easter, 60)));
    }
    add('Bundesfeiertag', `${y}-08-01`);
    add('Weihnachtstag', `${y}-12-25`);
    if (['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI'].includes(canton)) {
      add('Stephanstag', `${y}-12-26`);
    }

    return list;
  }

  // Zentraler Feiertagsabruf über 14 Monate (Dez Vorjahr bis Jan Folgejahr)
  function getDACHHolidays(targetYear, country = 'DE', region = 'NW') {
    const fetcher = (country === 'AT') ? getAustrianHolidaysForYear :
                    (country === 'CH') ? getSwissHolidaysForYear :
                    getGermanHolidaysForYear;

    const prevDec = fetcher(targetYear - 1, region).filter(h => h.start.startsWith(`${targetYear - 1}-12`));
    const current = fetcher(targetYear, region);
    const nextJan = fetcher(targetYear + 1, region).filter(h => h.start.startsWith(`${targetYear + 1}-01`));

    return [...prevDec, ...current, ...nextJan];
  }

  // --- 4. REALISTISCHE SCHULFERIEN (DACH / NACH BUNDESLAND) ---
  function getSchoolVacations(targetYear, country = 'DE', region = 'NW') {
    const list = [];
    const easter = getEaster(targetYear);

    // Osterferien: Meist 1 Woche vor Ostern bis 1 Woche nach Ostern
    let osterOffsetStart = -6;
    let osterOffsetEnd = 6;
    if (['BY', 'BW'].includes(region)) {
      osterOffsetStart = -2; // Gründonnerstag
      osterOffsetEnd = 12; // 2 Wochen
    }
    list.push({
      id: `ferien_ostern_${targetYear}`,
      title: 'Osterferien',
      start: formatIso(addDays(easter, osterOffsetStart)),
      end: formatIso(addDays(easter, osterOffsetEnd)),
      color: '#bfdbfe',
      type: 'vacation'
    });

    // Pfingstferien (vor allem BW & BY)
    if (['BW', 'BY'].includes(region)) {
      list.push({
        id: `ferien_pfingsten_${targetYear}`,
        title: 'Pfingstferien',
        start: formatIso(addDays(easter, 51)),
        end: formatIso(addDays(easter, 62)),
        color: '#bbf7d0',
        type: 'vacation'
      });
    }

    // Sommerferien: Rotierendes Zeitfenster nach Bundesland-Gruppe
    // Gruppe 1 (Nord): Ende Juni bis Anfang Aug; Gruppe 5 (Süd): Ende Juli bis Mitte Sept
    let sommerStartMonth = 7, sommerStartDay = 15;
    let sommerEndMonth = 8, sommerEndDay = 25;

    if (['HH', 'SH', 'MV', 'BE', 'BB'].includes(region)) {
      sommerStartMonth = 6; sommerStartDay = 28;
      sommerEndMonth = 8; sommerEndDay = 8;
    } else if (['NI', 'HB', 'NW'].includes(region)) {
      sommerStartMonth = 7; sommerStartDay = 10;
      sommerEndMonth = 8; sommerEndDay = 20;
    } else if (['HE', 'RP', 'SL'].includes(region)) {
      sommerStartMonth = 7; sommerStartDay = 18;
      sommerEndMonth = 8; sommerEndDay = 28;
    } else if (['BW', 'BY'].includes(region)) {
      sommerStartMonth = 7; sommerStartDay = 29;
      sommerEndMonth = 9; sommerEndDay = 10;
    }

    const sStart = `${targetYear}-${String(sommerStartMonth).padStart(2, '0')}-${String(sommerStartDay).padStart(2, '0')}`;
    const sEnd = `${targetYear}-${String(sommerEndMonth).padStart(2, '0')}-${String(sommerEndDay).padStart(2, '0')}`;
    list.push({
      id: `ferien_sommer_${targetYear}`,
      title: 'Sommerferien',
      start: sStart,
      end: sEnd,
      color: '#fed7aa',
      type: 'vacation'
    });

    // Herbstferien
    list.push({
      id: `ferien_herbst_${targetYear}`,
      title: 'Herbstferien',
      start: `${targetYear}-10-15`,
      end: `${targetYear}-10-27`,
      color: '#fef08a',
      type: 'vacation'
    });

    // Weihnachtsferien
    list.push({
      id: `ferien_weihnachten_${targetYear}`,
      title: 'Weihnachtsferien',
      start: `${targetYear}-12-23`,
      end: `${targetYear + 1}-01-06`,
      color: '#fbcfe8',
      type: 'vacation'
    });

    return list;
  }

  // --- 5. 14-MONATE-ZYKLUS DATENGENERATOR ---
  function get14MonthsData(targetYear, activeEvents = [], options = {}) {
    const months = [];
    months.push({ year: targetYear - 1, monthIndex: 11 }); // Dez Vorjahr
    for (let m = 0; m < 12; m++) {
      months.push({ year: targetYear, monthIndex: m });     // 12 Monate Zieljahr
    }
    months.push({ year: targetYear + 1, monthIndex: 0 });  // Jan Folgejahr

    return months.map((m, colIdx) => {
      const daysInMonth = new Date(m.year, m.monthIndex + 1, 0).getDate();
      const days = [];

      for (let d = 1; d <= 31; d++) {
        if (d <= daysInMonth) {
          const dateObj = new Date(m.year, m.monthIndex, d);
          const dayOfWeek = dateObj.getDay();
          const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
          const isSaturday = (dayOfWeek === 6);
          const isSunday = (dayOfWeek === 0);
          const isoDate = `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          
          // Alle passenden Events für diesen Tag sammeln
          const matchedEvents = activeEvents.filter(h => isoDate >= h.start && isoDate <= h.end);
          const primaryEvent = matchedEvents.find(e => e.type === 'public') || matchedEvents[0] || null;

          // ISO Kalenderwoche (wird am Montag angezeigt)
          const isoWeek = (dayOfWeek === 1) ? window.CronoGeometry.getISOWeek(dateObj) : null;

          // Mondphase (falls aktiviert)
          const moonPhase = window.CronoMoon ? window.CronoMoon.getMoonPhaseForDate(m.year, m.monthIndex, d) : null;

          days.push({
            dayNum: d,
            dayOfWeek,
            dayName: DAY_SHORT_NAMES[dayOfWeek],
            isWeekend,
            isSaturday,
            isSunday,
            isValid: true,
            isoDate,
            events: matchedEvents,
            holiday: primaryEvent,
            isoWeek,
            moonPhase
          });
        } else {
          days.push({ isValid: false });
        }
      }

      return {
        colIndex: colIdx,
        year: m.year,
        monthIndex: m.monthIndex,
        monthName: MONTH_NAMES[m.monthIndex],
        monthNumber: String(m.monthIndex + 1).padStart(2, '0'),
        label: `${MONTH_NAMES[m.monthIndex]} ${m.year}`,
        days
      };
    });
  }

  return {
    MONTH_NAMES,
    DAY_SHORT_NAMES,
    getEaster,
    getDACHHolidays,
    getSchoolVacations,
    get14MonthsData
  };
})();
