(function() {
  'use strict';

  const cadRoot = document.getElementById('cad-mode-root');
  const cadElement = (id) => {
    const elementId = id.startsWith('cad-') ? id : `cad-${id}`;
    const element = document.getElementById(elementId);
    if (!element || !cadRoot.contains(element)) {
      throw new Error(`CAD-Element "${elementId}" wurde nicht gefunden.`);
    }
    return element;
  };
  const sharedElement = (id) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Gemeinsames Element "${id}" wurde nicht gefunden.`);
    return element;
  };

'use strict';

    /**
     * 1. BRAND ASSETS MODULE
     */
/**
     * 2. PARAMETER STORE MODULE (mit aktualisierten Defaults für rodOffsetZ = 20, railEndMargin = 20)
     */
    const ParameterStore = (() => {
      const SCHEMA = [
        {
          group: '1. Sichtfenster & Rückwand',
          items: [
            { key: 'windowWidth', label: 'Breite Sichtfenster / Rückwand', min: 150, max: 2000, step: 1, default: 420, unit: 'mm' },
            { key: 'windowHeight', label: 'Höhe Sichtfenster / Rückwand', min: 100, max: 1500, step: 1, default: 320, unit: 'mm' },
            { key: 'backpanelThickness', label: 'Dicke Rückwand (Multiplex)', min: 6, max: 30, step: 1, default: 20, unit: 'mm' },
            { key: 'backpanelOffsetZ', label: 'Tiefenposition Rückwand (Z)', min: 0, max: 30, step: 1, default: 10, unit: 'mm' }
          ]
        },
        {
          group: '2. Papierbahn',
          items: [
            { key: 'paperLength', label: 'Länge der Papierbahn', min: 0, max: 12000, step: 1, default: 2260, unit: 'mm' },
            { key: 'paperThickness', label: 'Papierstärke (80 g/m² ≈ 0.10)', min: 0.05, max: 0.25, step: 0.01, default: 0.10, unit: 'mm' }
          ]
        },
        {
          group: '3. Wickelstäbe & Positionierung',
          items: [
            { key: 'rodDiameter', label: 'Durchmesser Wickelstäbe', min: 15, max: 40, step: 1, default: 25, unit: 'mm' },
            { key: 'sideClearance', label: 'Seitlicher Luftspalt zur Rückwand', min: 2, max: 30, step: 1, default: 10, unit: 'mm' },
            { key: 'rodOffsetZ', label: 'Tiefenposition Stabachse (Z)', min: 12, max: 35, step: 1, default: 20, unit: 'mm' }
          ]
        },
        {
          group: '4. Leisten & Sackloch-Lagerung',
          items: [
            { key: 'railHeight', label: 'Höhe Querleisten (von vorne)', min: 15, max: 45, step: 1, default: 20, unit: 'mm' },
            { key: 'railDepth', label: 'Tiefe Querleisten (Z-Richtung)', min: 25, max: 60, step: 1, default: 40, unit: 'mm' },
            { key: 'railEndMargin', label: 'Leistenüberstand ab Stabachse', min: 15, max: 50, step: 1, default: 20, unit: 'mm' },
            { key: 'blindHoleDepth', label: 'Tiefe Sacklöcher in Leisten', min: 5, max: 25, step: 1, default: 10, unit: 'mm' }
          ]
        },
        {
          group: '5. Lager, Bremse & Rändelmutter M6',
          items: [
            { key: 'gliderThickness', label: 'Dicke Teflon-Möbelgleiter', min: 1, max: 10, step: 0.5, default: 5, unit: 'mm' },
            { key: 'coinThickness', label: 'Dicke 5-Cent-Münze', min: 1.0, max: 3.0, step: 0.01, default: 1.67, unit: 'mm' },
            { key: 'knurledNutHeight', label: 'Höhe Rändelmutter M6 (DIN 466)', min: 10, max: 30, step: 1, default: 15, unit: 'mm' }
          ]
        }
      ];

      const META_MAP = {};
      const PHYSICAL_KEYS = ['windowWidth', 'windowHeight', 'paperLength'];
      SCHEMA.forEach(group => {
        group.items.forEach(item => {
          META_MAP[item.key] = item;
        });
      });

      let state = getDefaults();
      const listeners = [];
      let calendarDimensions = null;
      let usingCalendarDimensions = true;

      function getDefaults() {
        const defs = {};
        Object.keys(META_MAP).forEach(key => {
          defs[key] = META_MAP[key].default;
        });
        return defs;
      }

      function getState() {
        return { ...state };
      }

      function clampToMeta(key, rawVal) {
        const meta = META_MAP[key];
        if (!meta) return rawVal;
        const num = Number(rawVal);
        if (Number.isNaN(num)) return meta.default;
        return Math.min(meta.max, Math.max(meta.min, num));
      }

      function setParam(key, rawVal) {
        if (!Object.prototype.hasOwnProperty.call(state, key)) return;
        if (PHYSICAL_KEYS.includes(key) && usingCalendarDimensions) return;
        const num = Number(rawVal);
        if (!Number.isFinite(num)) return;
        state[key] = num;
        notify();
      }

      function hasPhysicalDifference(candidate) {
        return !!calendarDimensions && PHYSICAL_KEYS.some(key =>
          Number.isFinite(candidate && candidate[key]) &&
          Math.abs(candidate[key] - calendarDimensions[key]) > 1e-6
        );
      }

      function hasInvalidPhysicalDimensions(candidate) {
        if (!candidate || typeof candidate !== 'object') return false;
        const hasAnyPhysicalDimension = PHYSICAL_KEYS.some(key =>
          Object.prototype.hasOwnProperty.call(candidate, key)
        );
        if (!hasAnyPhysicalDimension) return false;
        return PHYSICAL_KEYS.some(key => {
          if (!Object.prototype.hasOwnProperty.call(candidate, key)) return true;
          const value = candidate[key];
          const meta = META_MAP[key];
          return typeof value !== 'number' || !Number.isFinite(value) || value < meta.min || value > meta.max;
        });
      }

      function hasCompletePhysicalDimensions(candidate) {
        return !!candidate && typeof candidate === 'object' && PHYSICAL_KEYS.every(key => {
          const value = candidate[key];
          const meta = META_MAP[key];
          return typeof value === 'number' && Number.isFinite(value) && value >= meta.min && value <= meta.max;
        });
      }

      function loadState(candidate, { acceptPhysicalOverride = false } = {}) {
        const defs = getDefaults();
        const next = { ...defs };
        if (candidate && typeof candidate === 'object') {
          Object.keys(defs).forEach(key => {
            if (typeof candidate[key] === 'number' && !Number.isNaN(candidate[key])) {
              const meta = META_MAP[key];
              if (candidate[key] < meta.min || candidate[key] > meta.max) {
                next[key] = meta.default;
              } else {
                next[key] = candidate[key];
              }
            }
          });
        }
        if (calendarDimensions) {
          usingCalendarDimensions = !(
            acceptPhysicalOverride &&
            hasPhysicalDifference(candidate) &&
            hasCompletePhysicalDimensions(candidate)
          );
          PHYSICAL_KEYS.forEach(key => {
            next[key] = usingCalendarDimensions ? calendarDimensions[key] : next[key];
          });
        }
        state = next;
        notify();
      }

      function setCalendarDimensions(dimensions) {
        const next = {};
        PHYSICAL_KEYS.forEach(key => {
          const value = Number(dimensions && dimensions[key]);
          if (!Number.isFinite(value) || value < META_MAP[key].min || value > META_MAP[key].max) {
            throw new RangeError(`Ungültiger Kalenderwert für ${key}: ${dimensions && dimensions[key]}`);
          }
          next[key] = value;
        });
        calendarDimensions = next;
        if (usingCalendarDimensions) {
          PHYSICAL_KEYS.forEach(key => { state[key] = next[key]; });
          notify();
        }
      }

      function reset({ acceptPhysicalOverride = false } = {}) {
        loadState(getDefaults(), { acceptPhysicalOverride });
      }

      function relinkToCalendar() {
        if (!calendarDimensions) return;
        usingCalendarDimensions = true;
        PHYSICAL_KEYS.forEach(key => { state[key] = calendarDimensions[key]; });
        notify();
      }

      function isUsingCalendarDimensions() {
        return usingCalendarDimensions;
      }

      function subscribe(callback) {
        listeners.push(callback);
      }

      function notify() {
        const snapshot = getState();
        listeners.forEach(cb => cb(snapshot));
      }

      return {
        SCHEMA, META_MAP, PHYSICAL_KEYS, getDefaults, getState, clampToMeta, setParam,
        loadState, reset, setCalendarDimensions, hasPhysicalDifference, hasInvalidPhysicalDimensions,
        isUsingCalendarDimensions,
        relinkToCalendar, subscribe
      };
    })();


    /**
     * 3. GEOMETRY ENGINE MODULE
     */
    const GeometryEngine = (() => {
      function computeTangentPoint(px, pz, mx, mz, radius) {
        const dx = mx - px;
        const dz = mz - pz;
        const distSq = dx * dx + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist <= radius + 1e-6) {
          return { valid: false, tx: mx, tz: mz + radius, length: 0, angleDeg: 0 };
        }

        const baseAngle = Math.atan2(dz, dx);
        const alpha = Math.asin(radius / dist);
        const phi = dx >= 0 ? (baseAngle + alpha) : (baseAngle - alpha);
        const tangentLength = Math.sqrt(Math.max(0, distSq - radius * radius));

        const tx = px + tangentLength * Math.cos(phi);
        const tz = pz + tangentLength * Math.sin(phi);

        const wrapRad = Math.atan2(tz - pz, Math.abs(tx - px));
        const angleDeg = (wrapRad * 180) / Math.PI;

        return { valid: true, tx, tz, length: tangentLength, angleDeg };
      }

      function analyze(p) {
        const axisDistance = p.windowWidth + 2 * p.sideClearance + p.rodDiameter;
        const totalWidth = axisDistance + 2 * p.railEndMargin;
        const totalHeight = p.windowHeight + 2 * p.railHeight;
        const totalHeightWithNuts = totalHeight + p.knurledNutHeight;

        const maxRollDiameter = Math.sqrt(
          p.rodDiameter * p.rodDiameter + (4 * p.paperLength * p.paperThickness) / Math.PI
        );
        const maxRollRadius = maxRollDiameter / 2;
        const rodRadius = p.rodDiameter / 2;
        const radialBuildUp = maxRollRadius - rodRadius;

        const upperStack = p.gliderThickness + p.coinThickness + 1.5;
        const lowerStack = p.gliderThickness + 0.5;
        const rodCutLength = p.windowHeight + 2 * p.blindHoleDepth - upperStack - lowerStack;

        const backpanelFrontZ = p.backpanelOffsetZ;
        const backpanelBackZ = p.backpanelOffsetZ + p.backpanelThickness;
        const rollFrontZ = p.rodOffsetZ - maxRollRadius;
        const rollBackZ = p.rodOffsetZ + maxRollRadius;

        const edgeX = p.windowWidth / 2;
        const axisX = axisDistance / 2;

        const tangentCoreRight = computeTangentPoint(edgeX, backpanelFrontZ, axisX, p.rodOffsetZ, rodRadius);
        const tangentCoreLeft = computeTangentPoint(-edgeX, backpanelFrontZ, -axisX, p.rodOffsetZ, rodRadius);
        const tangentFullRight = computeTangentPoint(edgeX, backpanelFrontZ, axisX, p.rodOffsetZ, maxRollRadius);
        const tangentFullLeft = computeTangentPoint(-edgeX, backpanelFrontZ, -axisX, p.rodOffsetZ, maxRollRadius);

        const checks = [];
        const isDeflectedBackward =
          tangentCoreRight.valid &&
          tangentFullRight.valid &&
          tangentCoreRight.tz > backpanelFrontZ + 0.15 &&
          tangentFullRight.tz > backpanelFrontZ + 0.15;

        if (!isDeflectedBackward) {
          checks.push({
            level: 'warning',
            text: `Keine Umlenkung nach hinten: Die Stabachse (Z = ${p.rodOffsetZ} mm) liegt zu weit vorne gegenüber der Rückwand-Vorderseite (Z = ${backpanelFrontZ} mm).`
          });
        }

        if (rollBackZ > p.railDepth) {
          const overhang = (rollBackZ - p.railDepth).toFixed(2);
          checks.push({
            level: 'error',
            text: `Volle Papierrolle ragt hinten ${overhang} mm über die Leistentiefe (${p.railDepth} mm) hinaus.`
          });
        }

        const remainingSideGap = p.sideClearance - radialBuildUp;
        if (remainingSideGap < 0) {
          checks.push({
            level: 'error',
            text: `Seitliche Kollision: Volle Rolle (Ø ${maxRollDiameter.toFixed(2)} mm) überlappt um ${Math.abs(remainingSideGap).toFixed(2)} mm mit der Rückwandkante!`
          });
        } else if (remainingSideGap < 1.0) {
          checks.push({
            level: 'error',
            text: `Seitlicher Restspalt bei voller Rolle zu gering (${remainingSideGap.toFixed(2)} mm < 1,0 mm).`
          });
        }

        const remainingRailHeight = p.railHeight - p.blindHoleDepth;
        if (remainingRailHeight <= 0) {
          checks.push({
            level: 'error',
            text: `Sackloch (${p.blindHoleDepth} mm) durchstößt die Querleiste (${p.railHeight} mm Höhe) komplett!`
          });
        } else if (remainingRailHeight < 5) {
          checks.push({
            level: 'warning',
            text: `Geringe Restwandstärke über dem Sackloch: ${remainingRailHeight.toFixed(1)} mm (empfohlen ≥ 5,0 mm).`
          });
        }

        const frontWallZ = p.rodOffsetZ - rodRadius;
        const backWallZ = p.railDepth - (p.rodOffsetZ + rodRadius);
        if (frontWallZ < 2 || backWallZ < 2) {
          checks.push({
            level: 'error',
            text: `Sackloch (Ø ${p.rodDiameter} mm) durchbricht Vorder- oder Rückseite der Leiste!`
          });
        }

        if (checks.length === 0) {
          const zRearReserve = (p.railDepth - rollBackZ).toFixed(2);
          checks.push({
            level: 'ok',
            text: `Alle Prüfungen bestanden: Gespannte Papierführung | Restspalt seitlich = ${remainingSideGap.toFixed(2)} mm | Z-Reserve hinten = ${zRearReserve} mm.`
          });
        }

        return {
          axisDistance, totalWidth, totalHeight, totalHeightWithNuts,
          maxRollDiameter, maxRollRadius, rodRadius, radialBuildUp,
          rodCutLength, remainingSideGap,
          z: { backpanelFrontZ, backpanelBackZ, rollFrontZ, rollBackZ },
          tangents: { coreLeft: tangentCoreLeft, coreRight: tangentCoreRight, fullLeft: tangentFullLeft, fullRight: tangentFullRight },
          checks
        };
      }

      return { analyze };
    })();


    /**
     * 4. CAD RENDERER MODULE (mit optionaler Steuerung von D_max, Achsen und Schnittebene)
     */
    const CADRenderer = (() => {
      const SVG_NS = 'http://www.w3.org/2000/svg';

      function el(tag, attrs = {}, text = null) {
        const node = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) {
          node.setAttribute(k, v);
        }
        if (text !== null) node.textContent = text;
        return node;
      }

      function createDefs() {
        const defs = el('defs');

        const arrowEnd = el('marker', {
          id: 'cad-dim-arrow-end', viewBox: '0 0 10 6', refX: '10', refY: '3', markerWidth: '7', markerHeight: '4.5', orient: 'auto'
        });
        arrowEnd.appendChild(el('path', { d: 'M 0 0 L 10 3 L 0 6 z', fill: '#334155' }));
        defs.appendChild(arrowEnd);

        const arrowStart = el('marker', {
          id: 'cad-dim-arrow-start', viewBox: '0 0 10 6', refX: '0', refY: '3', markerWidth: '7', markerHeight: '4.5', orient: 'auto'
        });
        arrowStart.appendChild(el('path', { d: 'M 10 0 L 0 3 L 10 6 z', fill: '#334155' }));
        defs.appendChild(arrowStart);

        const hatchWood = el('pattern', { id: 'cad-hatch-wood', width: '7', height: '7', patternTransform: 'rotate(45 0 0)', patternUnits: 'userSpaceOnUse' });
        hatchWood.appendChild(el('line', { x1: '0', y1: '0', x2: '0', y2: '7', stroke: '#94a3b8', 'stroke-width': '1' }));
        defs.appendChild(hatchWood);

        const hatchPly = el('pattern', { id: 'cad-hatch-ply', width: '5', height: '5', patternTransform: 'rotate(-45 0 0)', patternUnits: 'userSpaceOnUse' });
        hatchPly.appendChild(el('line', { x1: '0', y1: '0', x2: '0', y2: '5', stroke: '#64748b', 'stroke-width': '1' }));
        defs.appendChild(hatchPly);

        const hatchKnurl = el('pattern', { id: 'cad-hatch-knurl', width: '3.5', height: '3.5', patternUnits: 'userSpaceOnUse' });
        hatchKnurl.appendChild(el('rect', { x: '0', y: '0', width: '3.5', height: '3.5', fill: '#cbd5e1' }));
        hatchKnurl.appendChild(el('line', { x1: '0', y1: '0', x2: '3.5', y2: '3.5', stroke: '#475569', 'stroke-width': '0.65' }));
        hatchKnurl.appendChild(el('line', { x1: '3.5', y1: '0', x2: '0', y2: '3.5', stroke: '#475569', 'stroke-width': '0.65' }));
        defs.appendChild(hatchKnurl);

        return defs;
      }

      function drawKnurledNutDIN466(parent, cx, topY, width, height, isSection = false) {
        const g = el('g');
        const collarH = height * 0.28;
        const headH = height - collarH;
        const collarW = width * 0.68;

        g.appendChild(el('rect', {
          x: cx - collarW / 2, y: topY, width: collarW, height: collarH,
          fill: isSection ? '#e2e8f0' : '#94a3b8', stroke: '#0f172a', 'stroke-width': '1.1'
        }));
        g.appendChild(el('rect', {
          x: cx - width / 2, y: topY + collarH, width: width, height: headH, rx: '1',
          fill: isSection ? '#f8fafc' : 'url(#cad-hatch-knurl)', stroke: '#0f172a', 'stroke-width': '1.2'
        }));
        if (isSection) {
          const rim = Math.max(1.8, width * 0.12);
          g.appendChild(el('rect', { x: cx - width / 2, y: topY + collarH, width: rim, height: headH, fill: 'url(#cad-hatch-knurl)', stroke: '#0f172a', 'stroke-width': '0.8' }));
          g.appendChild(el('rect', { x: cx + width / 2 - rim, y: topY + collarH, width: rim, height: headH, fill: 'url(#cad-hatch-knurl)', stroke: '#0f172a', 'stroke-width': '0.8' }));
        }
        parent.appendChild(g);
      }

      function drawDimH(parent, x1, x2, yObj, yDim, label) {
        const g = el('g');
        const dir = yDim > yObj ? 1 : -1;
        g.appendChild(el('line', { x1, y1: yObj + dir * 2, x2: x1, y2: yDim + dir * 4, stroke: '#64748b', 'stroke-width': '0.8' }));
        g.appendChild(el('line', { x1: x2, y1: yObj + dir * 2, x2: x2, y2: yDim + dir * 4, stroke: '#64748b', 'stroke-width': '0.8' }));
        g.appendChild(el('line', {
          x1, y1: yDim, x2, y2: yDim, stroke: '#334155', 'stroke-width': '0.95',
          'marker-start': 'url(#cad-dim-arrow-start)', 'marker-end': 'url(#cad-dim-arrow-end)'
        }));
        const midX = (x1 + x2) / 2;
        const boxW = label.length * 6.0 + 8;
        g.appendChild(el('rect', { x: midX - boxW / 2, y: yDim - 12.5, width: boxW, height: 11.5, fill: '#ffffff', opacity: '0.92' }));
        g.appendChild(el('text', {
          x: midX, y: yDim - 3.5, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': '10', 'font-weight': '600', fill: '#0f172a'
        }, label));
        parent.appendChild(g);
      }

      function drawDimV(parent, y1, y2, xObj, xDim, label) {
        const g = el('g');
        const dir = xDim > xObj ? 1 : -1;
        g.appendChild(el('line', { x1: xObj + dir * 2, y1, x2: xDim + dir * 4, y2: y1, stroke: '#64748b', 'stroke-width': '0.8' }));
        g.appendChild(el('line', { x1: xObj + dir * 2, y1: y2, x2: xDim + dir * 4, y2: y2, stroke: '#64748b', 'stroke-width': '0.8' }));
        g.appendChild(el('line', {
          x1: xDim, y1, x2: xDim, y2, stroke: '#334155', 'stroke-width': '0.95',
          'marker-start': 'url(#cad-dim-arrow-start)', 'marker-end': 'url(#cad-dim-arrow-end)'
        }));
        const midY = (y1 + y2) / 2;
        const rotG = el('g', { transform: `translate(${xDim - 3.5}, ${midY}) rotate(-90)` });
        const boxW = label.length * 6.0 + 8;
        rotG.appendChild(el('rect', { x: -boxW / 2, y: -9.5, width: boxW, height: 10.5, fill: '#ffffff', opacity: '0.92' }));
        rotG.appendChild(el('text', {
          x: 0, y: -1, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': '10', 'font-weight': '600', fill: '#0f172a'
        }, label));
        g.appendChild(rotG);
        parent.appendChild(g);
      }

      function drawCalendarPreview(parent, clipId, x, y, width, height, preview, scale) {
        if (!preview || !Array.isArray(preview.months) || preview.months.length !== 3) return;

        const group = el('g', {
          id: 'cad-calendar-preview',
          'clip-path': `url(#${clipId})`,
          opacity: '0.82'
        });
        const monthWidth = width / 3;
        const isDouble = preview.monthLayout === 'double';
        const rowCount = isDouble ? 16 : 31;
        const rowHeight = height / (rowCount + 1);
        const headerHeight = rowHeight;

        preview.months.forEach((month, monthIndex) => {
          const monthX = x + monthIndex * monthWidth;
          group.appendChild(el('rect', {
            x: monthX, y, width: monthWidth, height: headerHeight,
            fill: '#e2e8f0', stroke: '#cbd5e1', 'stroke-width': '0.6'
          }));
          group.appendChild(el('text', {
            x: monthX + monthWidth / 2, y: y + headerHeight * 0.72,
            'text-anchor': 'middle', 'font-size': Math.max(5, 7 * scale),
            'font-family': 'Inter, sans-serif', 'font-weight': '600', fill: '#334155'
          }, `${month.monthName} ${month.year}`));

          const validDays = month.days.filter(day => day.isValid);
          if (isDouble) {
            const halfWidth = monthWidth / 2;
            const dayByNumber = new Map(validDays.map(day => [day.dayNum, day]));
            for (let row = 0; row < rowCount; row++) {
              const rowY = y + headerHeight + (row + 1) * rowHeight;
              group.appendChild(el('line', {
                x1: monthX, y1: rowY, x2: monthX + monthWidth, y2: rowY,
                stroke: '#cbd5e1', 'stroke-width': '0.45'
              }));
              [row < 15 ? row + 1 : null, row + 16].forEach((dayNumber, column) => {
                if (dayNumber === null) return;
                const day = dayByNumber.get(dayNumber);
                if (!day) return;
                group.appendChild(el('text', {
                  x: monthX + column * halfWidth + 3, y: rowY - rowHeight * 0.25,
                  'font-size': Math.max(4.5, 5.5 * scale),
                  'font-family': 'JetBrains Mono, monospace', fill: '#64748b'
                }, String(day.dayNum).padStart(2, '0')));
              });
            }
            group.appendChild(el('line', {
              x1: monthX + halfWidth, y1: y + headerHeight,
              x2: monthX + halfWidth, y2: y + height,
              stroke: '#cbd5e1', 'stroke-width': '0.55'
            }));
          } else {
            validDays.forEach(day => {
              const rowY = y + headerHeight + day.dayNum * rowHeight;
              group.appendChild(el('line', {
                x1: monthX, y1: rowY, x2: monthX + monthWidth, y2: rowY,
                stroke: '#cbd5e1', 'stroke-width': '0.45'
              }));
              group.appendChild(el('text', {
                x: monthX + 3, y: rowY - rowHeight * 0.25,
                'font-size': Math.max(4.5, 5.5 * scale),
                'font-family': 'JetBrains Mono, monospace', fill: '#64748b'
              }, `${String(day.dayNum).padStart(2, '0')} ${day.dayName}`));
            });
          }
          if (monthIndex > 0) {
            group.appendChild(el('line', {
              x1: monthX, y1: y, x2: monthX, y2: y + height,
              stroke: '#94a3b8', 'stroke-width': '0.75'
            }));
          }
        });

        parent.appendChild(group);
      }

      function render(svgEl, p, geom, viewOpts, titleBlock, calendarPreview) {
        svgEl.innerHTML = '';
        const defs = createDefs();
        svgEl.appendChild(defs);
        const drawing = el('g', { id: 'cad-drawing-content' });
        svgEl.appendChild(drawing);

        const mainScale = 0.85;
        const detailScale = 2.4;

        const marginLeft = 72;
        const marginTop = 78;
        const gapViews = 68;
        const marginRightZ = 82;
        const detailGap = 28;
        const detailPanelW = 365;

        const totalW = geom.totalWidth * mainScale;
        const frontLeftX = marginLeft;
        const frontRightX = frontLeftX + totalW;
        const frontCenterX = (frontLeftX + frontRightX) / 2;

        const frontTopY = marginTop;
        const railH = p.railHeight * mainScale;
        const winH = p.windowHeight * mainScale;
        const nutH = p.knurledNutHeight * mainScale;
        const nutW = 24 * mainScale;

        const winTopY = frontTopY + railH;
        const winBottomY = winTopY + winH;
        const frontBottomY = winBottomY + railH;
        const nutBottomY = frontBottomY + nutH;

        const leftAxisX = frontLeftX + p.railEndMargin * mainScale;
        const rightAxisX = frontRightX - p.railEndMargin * mainScale;
        const winW = p.windowWidth * mainScale;
        const winLeftX = frontCenterX - winW / 2;
        const winRightX = frontCenterX + winW / 2;

        const rodR = geom.rodRadius * mainScale;
        const maxRollR = geom.maxRollRadius * mainScale;
        const holeD = p.blindHoleDepth * mainScale;

        const minZ = Math.min(0, geom.z.rollFrontZ, geom.z.backpanelFrontZ);
        const maxZ = Math.max(p.railDepth, geom.z.backpanelBackZ, geom.z.rollBackZ);
        const topHeaderY = nutBottomY + gapViews;
        const z0Y = topHeaderY + 18 + Math.max(0, -minZ) * mainScale;
        const topBottomY = z0Y + maxZ * mainScale + 26;

        const detailBoxX = frontRightX + marginRightZ + detailGap;
        const detailBoxY = 24;
        const reqDetailH = (p.railHeight * 2 + p.knurledNutHeight) * detailScale + 245;

        const titleBlockH = 74;
        const contentBottom = Math.max(topBottomY, detailBoxY + reqDetailH + titleBlockH + 20);
        const sheetW = Math.max(detailBoxX + detailPanelW + 18, 980);
        const sheetH = Math.max(contentBottom + 18, 590);

        const pageWidth = 1188;
        const pageHeight = 840;
        svgEl.setAttribute('viewBox', `0 0 ${pageWidth} ${pageHeight}`);
        svgEl.setAttribute('width', '297mm');
        svgEl.setAttribute('height', '210mm');
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        const fitScale = Math.min((pageWidth - 48) / sheetW, (pageHeight - 48) / sheetH);
        const fitX = (pageWidth - sheetW * fitScale) / 2;
        const fitY = (pageHeight - sheetH * fitScale) / 2;
        drawing.setAttribute('transform', `translate(${fitX} ${fitY}) scale(${fitScale})`);

        const calendarClip = el('clipPath', { id: 'cad-calendar-window-clip', clipPathUnits: 'userSpaceOnUse' });
        calendarClip.appendChild(el('rect', { x: 0, y: 0, width: 0, height: 0 }));
        defs.appendChild(calendarClip);

        // Zeichnungsrahmen
        drawing.appendChild(el('rect', {
          x: 10, y: 10, width: sheetW - 20, height: sheetH - 20,
          fill: 'none', stroke: '#0f172a', 'stroke-width': '1.5'
        }));

        // DIN-Schriftfeld unten rechts (mit editierbaren Werten)
        const tbW = detailPanelW;
        const tb = el('g', { transform: `translate(${sheetW - tbW - 10}, ${sheetH - titleBlockH - 10})` });
        tb.appendChild(el('rect', { x: 0, y: 0, width: tbW, height: titleBlockH, fill: '#f8fafc', stroke: '#0f172a', 'stroke-width': '1.2' }));
        tb.appendChild(el('line', { x1: 0, y1: 25, x2: tbW, y2: 25, stroke: '#0f172a', 'stroke-width': '1' }));
        tb.appendChild(el('line', { x1: 0, y1: 49, x2: tbW, y2: 49, stroke: '#0f172a', 'stroke-width': '1' }));
        tb.appendChild(el('line', { x1: 230, y1: 25, x2: 230, y2: titleBlockH, stroke: '#0f172a', 'stroke-width': '1' }));
        tb.appendChild(el('text', { x: 10, y: 16.5, 'font-size': '11.5', 'font-weight': '700', fill: '#0f172a' }, titleBlock.title));
        tb.appendChild(el('text', { x: 10, y: 40.5, 'font-size': '9.5', fill: '#475569' }, `Werkstoff: ${titleBlock.material}`));
        tb.appendChild(el('text', { x: 238, y: 40.5, 'font-size': '9.5', 'font-family': 'JetBrains Mono', fill: '#0f172a' }, `Nr.: ${titleBlock.drawingNo}`));
        tb.appendChild(el('text', { x: 10, y: 64.5, 'font-size': '9.5', fill: '#475569' }, `Autor: ${titleBlock.author} | Papier: ${p.paperLength}×${p.windowHeight} mm`));
        tb.appendChild(el('text', { x: 238, y: 64.5, 'font-size': '9.5', 'font-family': 'JetBrains Mono', 'font-weight': '600', fill: '#0284c7' }, `D_max: Ø${geom.maxRollDiameter.toFixed(2)}`));
        drawing.appendChild(tb);


        // ====================================================================
        // ANSICHT A: VORDERANSICHT
        // ====================================================================
        const gA = el('g', { id: 'cad-view-front' });
        gA.appendChild(el('text', {
          x: frontLeftX, y: frontTopY - 46, 'font-size': '12', 'font-weight': '700', fill: '#0f172a'
        }, 'ANSICHT A – VORDERANSICHT (M 1:2)'));

        gA.appendChild(el('rect', {
          x: winLeftX, y: winTopY, width: winW, height: winH,
          fill: '#f8fafc', stroke: '#475569', 'stroke-width': '1.2'
        }));
        if (viewOpts.showCalendarPreview) {
          calendarClip.firstChild.setAttribute('x', winLeftX);
          calendarClip.firstChild.setAttribute('y', winTopY);
          calendarClip.firstChild.setAttribute('width', winW);
          calendarClip.firstChild.setAttribute('height', winH);
          drawCalendarPreview(gA, 'cad-calendar-window-clip', winLeftX, winTopY, winW, winH, calendarPreview, mainScale);
        } else {
          gA.appendChild(el('line', { x1: winLeftX, y1: winTopY, x2: winRightX, y2: winBottomY, stroke: '#e2e8f0', 'stroke-width': '1' }));
          gA.appendChild(el('line', { x1: winRightX, y1: winTopY, x2: winLeftX, y2: winBottomY, stroke: '#e2e8f0', 'stroke-width': '1' }));
        }

        [leftAxisX, rightAxisX].forEach(ax => {
          // Optional: Max Rolle D_max
          if (viewOpts.showMaxRoll) {
            gA.appendChild(el('rect', {
              x: ax - maxRollR, y: winTopY + 0.5, width: maxRollR * 2, height: winH - 1,
              fill: 'rgba(2, 132, 199, 0.08)', stroke: '#0284c7', 'stroke-width': '1', 'stroke-dasharray': '4 3'
            }));
          }

          // Wickelstab
          gA.appendChild(el('rect', {
            x: ax - rodR, y: winTopY, width: rodR * 2, height: winH,
            fill: '#fef3c7', stroke: '#0f172a', 'stroke-width': '1.25'
          }));

          // Sacklöcher oben & unten
          gA.appendChild(el('rect', {
            x: ax - rodR, y: winTopY - holeD, width: rodR * 2, height: holeD,
            fill: 'none', stroke: '#475569', 'stroke-width': '0.95', 'stroke-dasharray': '3 2'
          }));
          gA.appendChild(el('rect', {
            x: ax - rodR, y: winBottomY, width: rodR * 2, height: holeD,
            fill: 'none', stroke: '#475569', 'stroke-width': '0.95', 'stroke-dasharray': '3 2'
          }));

          const m6HalfW = 3 * mainScale;
          gA.appendChild(el('rect', {
            x: ax - m6HalfW, y: frontTopY, width: m6HalfW * 2, height: Math.max(3, railH - holeD + 2),
            fill: 'none', stroke: '#64748b', 'stroke-width': '0.85', 'stroke-dasharray': '2 2'
          }));

          drawKnurledNutDIN466(gA, ax, frontBottomY, nutW, nutH, false);

          // Optional: Mittellinie
          if (viewOpts.showCenterlines) {
            gA.appendChild(el('line', {
              x1: ax, y1: frontTopY - 8, x2: ax, y2: nutBottomY + 8,
              stroke: '#dc2626', 'stroke-width': '0.85', 'stroke-dasharray': '9 3 2 3'
            }));
          }
        });

        gA.appendChild(el('rect', { x: frontLeftX, y: frontTopY, width: totalW, height: railH, fill: '#fef3c7', stroke: '#0f172a', 'stroke-width': '1.4' }));
        gA.appendChild(el('rect', { x: frontLeftX, y: winBottomY, width: totalW, height: railH, fill: '#fef3c7', stroke: '#0f172a', 'stroke-width': '1.4' }));

        // Optional: Schnittebene A-A Kennzeichnung
        if (viewOpts.showSection) {
          const secY = winTopY + winH * 0.5;
          gA.appendChild(el('line', { x1: frontLeftX - 10, y1: secY, x2: frontRightX + 10, y2: secY, stroke: '#64748b', 'stroke-width': '0.8', 'stroke-dasharray': '12 3 2 3' }));
          gA.appendChild(el('text', { x: frontLeftX - 12, y: secY - 3, 'text-anchor': 'end', 'font-size': '9.5', 'font-weight': '700', fill: '#334155' }, 'A'));
          gA.appendChild(el('text', { x: frontRightX + 12, y: secY - 3, 'text-anchor': 'start', 'font-size': '9.5', 'font-weight': '700', fill: '#334155' }, 'A'));
        }

        drawDimH(gA, frontLeftX, leftAxisX, frontTopY, frontTopY - 15, `${p.railEndMargin}`);
        drawDimH(gA, leftAxisX, rightAxisX, frontTopY, frontTopY - 15, `${geom.axisDistance.toFixed(0)}`);
        drawDimH(gA, frontLeftX, frontRightX, frontTopY, frontTopY - 32, `${geom.totalWidth.toFixed(0)}`);
        drawDimH(gA, winLeftX, winRightX, winTopY + winH * 0.34, winTopY + winH * 0.34, `Rückwand / Fenster ${p.windowWidth}`);
        if (p.sideClearance >= 4) {
          drawDimH(gA, leftAxisX + rodR, winLeftX, winTopY + 26, winTopY + 26, `${p.sideClearance}`);
        }

        drawDimV(gA, frontTopY, winTopY, frontLeftX, frontLeftX - 17, `${p.railHeight}`);
        drawDimV(gA, winTopY, winBottomY, frontLeftX, frontLeftX - 17, `${p.windowHeight}`);
        drawDimV(gA, frontBottomY, nutBottomY, frontLeftX, frontLeftX - 17, `${p.knurledNutHeight}`);
        drawDimV(gA, frontTopY, nutBottomY, frontLeftX, frontLeftX - 36, `${geom.totalHeightWithNuts.toFixed(0)}`);

        drawing.appendChild(gA);


        // ====================================================================
        // ANSICHT B: HORIZONTALSCHNITT A-A
        // ====================================================================
        const gB = el('g', { id: 'cad-view-horizontal-section' });
        gB.appendChild(el('text', {
          x: frontLeftX, y: topHeaderY, 'font-size': '12', 'font-weight': '700', fill: '#0f172a'
        }, 'ANSICHT B – HORIZONTALSCHNITT A-A (Tiefenpositionen Z, M 1:2)'));

        const railDepthPx = p.railDepth * mainScale;
        const bpY = z0Y + p.backpanelOffsetZ * mainScale;
        const bpH = p.backpanelThickness * mainScale;
        const rodCenterY = z0Y + p.rodOffsetZ * mainScale;

        gB.appendChild(el('rect', {
          x: frontLeftX, y: z0Y, width: totalW, height: railDepthPx,
          fill: 'rgba(241, 245, 249, 0.75)', stroke: '#64748b', 'stroke-width': '1', 'stroke-dasharray': '5 3'
        }));

        gB.appendChild(el('rect', {
          x: winLeftX, y: bpY, width: winW, height: bpH,
          fill: 'url(#cad-hatch-ply)', stroke: '#0f172a', 'stroke-width': '1.35'
        }));

        [leftAxisX, rightAxisX].forEach(ax => {
          if (viewOpts.showMaxRoll) {
            gB.appendChild(el('circle', {
              cx: ax, cy: rodCenterY, r: maxRollR,
              fill: 'rgba(2, 132, 199, 0.10)', stroke: '#0284c7', 'stroke-width': '1.05', 'stroke-dasharray': '4 2'
            }));
          }
          gB.appendChild(el('circle', {
            cx: ax, cy: rodCenterY, r: rodR,
            fill: 'url(#cad-hatch-wood)', stroke: '#0f172a', 'stroke-width': '1.35'
          }));
          if (viewOpts.showCenterlines) {
            gB.appendChild(el('line', { x1: ax - 7, y1: rodCenterY, x2: ax + 7, y2: rodCenterY, stroke: '#dc2626', 'stroke-width': '0.8' }));
            gB.appendChild(el('line', { x1: ax, y1: rodCenterY - 7, x2: ax, y2: rodCenterY + 7, stroke: '#dc2626', 'stroke-width': '0.8' }));
          }
        });

        const paperLineY = bpY - 0.35;
        const tCoreL = geom.tangents.coreLeft;
        const tCoreR = geom.tangents.coreRight;
        const tFullL = geom.tangents.fullLeft;
        const tFullR = geom.tangents.fullRight;

        if (viewOpts.showMaxRoll && tFullL.valid && tFullR.valid) {
          gB.appendChild(el('line', {
            x1: frontCenterX + tFullL.tx * mainScale, y1: z0Y + tFullL.tz * mainScale,
            x2: winLeftX, y2: paperLineY, stroke: '#0284c7', 'stroke-width': '1.1', 'stroke-dasharray': '3 2'
          }));
          gB.appendChild(el('line', {
            x1: winRightX, y1: paperLineY,
            x2: frontCenterX + tFullR.tx * mainScale, y2: z0Y + tFullR.tz * mainScale,
            stroke: '#0284c7', 'stroke-width': '1.1', 'stroke-dasharray': '3 2'
          }));
        }

        if (tCoreL.valid && tCoreR.valid) {
          const dPath = [
            `M ${(frontCenterX + tCoreL.tx * mainScale).toFixed(2)} ${(z0Y + tCoreL.tz * mainScale).toFixed(2)}`,
            `L ${winLeftX.toFixed(2)} ${paperLineY.toFixed(2)}`,
            `L ${winRightX.toFixed(2)} ${paperLineY.toFixed(2)}`,
            `L ${(frontCenterX + tCoreR.tx * mainScale).toFixed(2)} ${(z0Y + tCoreR.tz * mainScale).toFixed(2)}`
          ].join(' ');

          gB.appendChild(el('path', { d: dPath, fill: 'none', stroke: '#0284c7', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }));
        }

        drawDimV(gB, z0Y, z0Y + railDepthPx, frontLeftX, frontLeftX - 17, `${p.railDepth}`);
        drawDimV(gB, z0Y, rodCenterY, leftAxisX, frontLeftX - 36, `Z=${p.rodOffsetZ}`);
        drawDimV(gB, z0Y, bpY, winRightX, frontRightX + 17, `Z=${p.backpanelOffsetZ}`);
        drawDimV(gB, bpY, bpY + bpH, winRightX, frontRightX + 36, `${p.backpanelThickness}`);
        if (viewOpts.showMaxRoll) {
          drawDimH(gB, rightAxisX - maxRollR, rightAxisX + maxRollR, rodCenterY + maxRollR, rodCenterY + maxRollR + 14, `Ø${geom.maxRollDiameter.toFixed(1)}`);
        }

        drawing.appendChild(gB);


        // ====================================================================
        // ANSICHT C: DETAIL ACHSLAGERUNG (M 2:1)
        // ====================================================================
        const detCx = detailBoxX + 132;
        const detTopY = detailBoxY + 50;

        const gC = el('g', { id: 'cad-view-axis-detail' });
        gC.appendChild(el('rect', { x: detailBoxX, y: detailBoxY, width: detailPanelW, height: reqDetailH, fill: '#ffffff', stroke: '#cbd5e1', 'stroke-width': '1', rx: '4' }));
        gC.appendChild(el('text', { x: detailBoxX + 14, y: detailBoxY + 21, 'font-size': '11.5', 'font-weight': '700', fill: '#0f172a' }, 'ANSICHT C – DETAIL ACHSLAGERUNG (M 2:1)'));
        gC.appendChild(el('text', { x: detailBoxX + 14, y: detailBoxY + 35, 'font-size': '9.5', fill: '#64748b' }, 'Vertikalschnitt: Obere Justierbremse & Untere Rändelmutter M6'));

        const railHDet = p.railHeight * detailScale;
        const holeDDet = p.blindHoleDepth * detailScale;
        const rodRDet = geom.rodRadius * detailScale;
        const gliderHDet = p.gliderThickness * detailScale;
        const coinHDet = p.coinThickness * detailScale;
        const nutHDet = p.knurledNutHeight * detailScale;
        const nutWDet = 24 * detailScale;

        const upRailTopY = detTopY + 12;
        const upRailBotY = upRailTopY + railHDet;
        const upHoleTopY = upRailBotY - holeDDet;

        gC.appendChild(el('rect', { x: detCx - 78, y: upRailTopY, width: 156, height: railHDet, fill: 'url(#cad-hatch-wood)', stroke: '#0f172a', 'stroke-width': '1.35' }));
        gC.appendChild(el('rect', { x: detCx - rodRDet, y: upHoleTopY, width: rodRDet * 2, height: holeDDet, fill: '#ffffff', stroke: '#0f172a', 'stroke-width': '1.15' }));

        const m6WDet = 3.2 * detailScale;
        const coinTopY = upHoleTopY + 2 * detailScale;
        gC.appendChild(el('rect', { x: detCx - m6WDet * 1.35, y: upRailTopY, width: m6WDet * 2.7, height: Math.max(4, upHoleTopY - upRailTopY), fill: '#e2e8f0', stroke: '#475569', 'stroke-width': '0.9', 'stroke-dasharray': '2 1.5' }));
        gC.appendChild(el('rect', { x: detCx - m6WDet, y: upRailTopY + 1, width: m6WDet * 2, height: Math.max(4, coinTopY - upRailTopY - 1), fill: '#94a3b8', stroke: '#0f172a', 'stroke-width': '0.95' }));

        const coinRDet = 10.625 * detailScale;
        gC.appendChild(el('rect', { x: detCx - coinRDet, y: coinTopY, width: coinRDet * 2, height: coinHDet, fill: '#d97706', stroke: '#0f172a', 'stroke-width': '0.95' }));

        const upGliderTopY = coinTopY + coinHDet;
        gC.appendChild(el('rect', { x: detCx - rodRDet + 1, y: upGliderTopY, width: (rodRDet - 1) * 2, height: gliderHDet, fill: '#e0f2fe', stroke: '#0284c7', 'stroke-width': '1.1' }));

        const upRodTopY = upGliderTopY + gliderHDet;
        const upRodBotY = upRailBotY + 42;
        gC.appendChild(el('rect', { x: detCx - rodRDet, y: upRodTopY, width: rodRDet * 2, height: Math.max(18, upRodBotY - upRodTopY), fill: '#fef3c7', stroke: '#0f172a', 'stroke-width': '1.35' }));

        const lblX = detCx + Math.max(rodRDet, nutWDet / 2) + 12;
        gC.appendChild(el('text', { x: lblX, y: upRailTopY + 9, 'font-size': '9', 'font-weight': '600', fill: '#0f172a' }, 'Rampa + Madenschraube M6'));
        gC.appendChild(el('text', { x: lblX, y: coinTopY + coinHDet / 2 + 3, 'font-size': '9', fill: '#b45309' }, `5ct-Münze (${p.coinThickness} mm)`));
        gC.appendChild(el('text', { x: lblX, y: upGliderTopY + gliderHDet / 2 + 3, 'font-size': '9', fill: '#0369a1' }, `PTFE-Gleiter (${p.gliderThickness} mm)`));
        gC.appendChild(el('text', { x: lblX, y: Math.max(upRodBotY - 5, upRodTopY + 14), 'font-size': '9', fill: '#0f172a' }, `Wickelstab Ø${p.rodDiameter}`));

        drawDimV(gC, upHoleTopY, upRailBotY, detCx - rodRDet, detCx - rodRDet - 14, `${p.blindHoleDepth}`);
        drawDimV(gC, upRailTopY, upRailBotY, detCx - 78, detCx - 92, `${p.railHeight}`);

        const breakY = Math.max(upRodBotY, upRodTopY + 22) + 20;
        gC.appendChild(el('line', { x1: detailBoxX + 16, y1: breakY, x2: detailBoxX + detailPanelW - 16, y2: breakY, stroke: '#94a3b8', 'stroke-width': '1', 'stroke-dasharray': '5 3' }));
        gC.appendChild(el('text', { x: detailBoxX + detailPanelW / 2, y: breakY - 4, 'text-anchor': 'middle', 'font-size': '8.8', fill: '#64748b' }, `... Zuschnitt Wickelstab ≈ ${geom.rodCutLength.toFixed(1)} mm ...`));

        const loRailTopY = breakY + 40;
        const loRailBotY = loRailTopY + railHDet;
        const loHoleBotY = loRailTopY + holeDDet;

        gC.appendChild(el('rect', { x: detCx - 78, y: loRailTopY, width: 156, height: railHDet, fill: 'url(#cad-hatch-wood)', stroke: '#0f172a', 'stroke-width': '1.35' }));
        gC.appendChild(el('rect', { x: detCx - rodRDet, y: loRailTopY, width: rodRDet * 2, height: holeDDet, fill: '#ffffff', stroke: '#0f172a', 'stroke-width': '1.15' }));

        const loGliderTopY = loHoleBotY - gliderHDet;
        gC.appendChild(el('rect', { x: detCx - rodRDet + 1, y: loGliderTopY, width: (rodRDet - 1) * 2, height: gliderHDet, fill: '#e0f2fe', stroke: '#0284c7', 'stroke-width': '1.1' }));

        const loRodTopY = loRailTopY - 30;
        const loRodBotY = loGliderTopY - 0.5;
        gC.appendChild(el('rect', { x: detCx - rodRDet, y: loRodTopY, width: rodRDet * 2, height: Math.max(14, loRodBotY - loRodTopY), fill: '#fef3c7', stroke: '#0f172a', 'stroke-width': '1.35' }));
        gC.appendChild(el('rect', { x: detCx - m6WDet * 1.35, y: loRodBotY - 11 * detailScale, width: m6WDet * 2.7, height: 11 * detailScale, fill: '#cbd5e1', stroke: '#475569', 'stroke-width': '0.9', 'stroke-dasharray': '2 1.5' }));

        drawKnurledNutDIN466(gC, detCx, loRailBotY + 0.5, nutWDet, nutHDet, true);

        const boltTopY = loRodBotY - 11 * detailScale;
        const boltBotY = loRailBotY + nutHDet * 0.82;
        gC.appendChild(el('rect', { x: detCx - m6WDet * 0.85, y: boltTopY, width: m6WDet * 1.7, height: boltBotY - boltTopY, fill: '#64748b', stroke: '#0f172a', 'stroke-width': '0.95' }));

        if (viewOpts.showCenterlines) {
          gC.appendChild(el('line', { x1: detCx, y1: upRailTopY - 8, x2: detCx, y2: loRailBotY + nutHDet + 10, stroke: '#dc2626', 'stroke-width': '0.85', 'stroke-dasharray': '9 3 2 3' }));
        }

        gC.appendChild(el('text', { x: lblX, y: loGliderTopY + gliderHDet / 2 + 3, 'font-size': '9', fill: '#0369a1' }, `PTFE-Gleiter (${p.gliderThickness} mm)`));
        gC.appendChild(el('text', { x: lblX, y: loRailBotY - 2, 'font-size': '9', 'font-weight': '600', fill: '#0f172a' }, 'Stockschraube M6'));
        gC.appendChild(el('text', { x: lblX, y: loRailBotY + nutHDet / 2 + 4, 'font-size': '9', fill: '#0f172a' }, `Rändelmutter M6 (${p.knurledNutHeight} mm)`));

        drawDimV(gC, loRailTopY, loHoleBotY, detCx - rodRDet, detCx - rodRDet - 14, `${p.blindHoleDepth}`);
        drawDimV(gC, loRailBotY, loRailBotY + nutHDet, detCx - nutWDet / 2, detCx - nutWDet / 2 - 14, `${p.knurledNutHeight}`);

        drawing.appendChild(gC);
      }

      return { render };
    })();


    /**
     * 5. STORAGE MANAGER MODULE
     */
    const StorageManager = (() => {
      const STORAGE_KEY = 'chronoscroll_cad_presets_v2_1';

      function getAll() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Gespeicherte CAD-Presets haben ein ungültiges Format.');
        }
        return parsed;
      }

      function save(name, bundle) {
        const clean = name.trim();
        if (!clean) return false;
        const all = getAll();
        all[clean] = {
          updatedAt: new Date().toISOString(),
          ...bundle
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return true;
      }

      function load(name) {
        const all = getAll();
        return all[name] ? all[name] : null;
      }

      function remove(name) {
        const all = getAll();
        if (!all[name]) return false;
        delete all[name];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return true;
      }

      return { getAll, save, load, remove };
    })();


    /**
     * 6. UI CONTROLLER MODULE
     */
    const UIController = (() => {
      const inputMap = {};
      let toastTimeout = null;
      let calendarPreviewSnapshot = null;

      let baseViewBox = { x: 0, y: 0, w: 1188, h: 840 };
      let currentViewBox = { x: 0, y: 0, w: 1188, h: 840 };
      let zoomFactor = 1.0;
      let isPanning = false;
      let panStart = { clientX: 0, clientY: 0, vbX: 0, vbY: 0 };

      function showToast(msg) {
        const toast = cadElement('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('visible');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2800);
      }

      function buildParameterForm() {
        const container = cadElement('parameter-groups-container');
        container.innerHTML = '';

        ParameterStore.SCHEMA.forEach(group => {
          const groupDiv = document.createElement('div');
          groupDiv.className = 'param-group';

          const titleDiv = document.createElement('div');
          titleDiv.className = 'param-group-title';
          titleDiv.textContent = group.group;
          groupDiv.appendChild(titleDiv);

          group.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'param-item';

            const labelRow = document.createElement('div');
            labelRow.className = 'param-label-row';

            const label = document.createElement('label');
            label.className = 'param-label';
            label.setAttribute('for', `cad-input-num-${item.key}`);
            label.textContent = item.label;

            const inputWrap = document.createElement('div');
            inputWrap.className = 'param-input-wrap';

            const numInput = document.createElement('input');
            numInput.type = 'number';
            numInput.id = `cad-input-num-${item.key}`;
            numInput.min = item.min;
            numInput.max = item.max;
            numInput.step = item.step;
            numInput.value = item.default;

            const unitSpan = document.createElement('span');
            unitSpan.className = 'param-unit';
            unitSpan.textContent = item.unit;

            inputWrap.appendChild(numInput);
            inputWrap.appendChild(unitSpan);
            labelRow.appendChild(label);
            labelRow.appendChild(inputWrap);

            const isPhysical = ParameterStore.PHYSICAL_KEYS.includes(item.key);
            let rangeInput = null;
            let syncNote = null;
            if (isPhysical) {
              numInput.readOnly = true;
              numInput.classList.add('cad-physical-input');
              numInput.setAttribute('aria-describedby', 'cad-sync-status');
              syncNote = document.createElement('p');
              syncNote.className = 'cad-sync-note';
              const onInput = (e) => ParameterStore.setParam(item.key, e.target.value);
              const onCommit = (e) => {
                const clamped = ParameterStore.clampToMeta(item.key, e.target.value);
                ParameterStore.setParam(item.key, clamped);
              };
              numInput.addEventListener('input', onInput);
              numInput.addEventListener('change', onCommit);
            } else {
              rangeInput = document.createElement('input');
              rangeInput.type = 'range';
              rangeInput.id = `cad-input-range-${item.key}`;
              rangeInput.min = item.min;
              rangeInput.max = item.max;
              rangeInput.step = item.step;
              rangeInput.value = item.default;
              rangeInput.setAttribute('aria-label', item.label);

              const onInput = (e) => ParameterStore.setParam(item.key, e.target.value);
              const onCommit = (e) => {
                const clamped = ParameterStore.clampToMeta(item.key, e.target.value);
                ParameterStore.setParam(item.key, clamped);
              };

              rangeInput.addEventListener('input', onInput);
              rangeInput.addEventListener('change', onCommit);
              numInput.addEventListener('input', onInput);
              numInput.addEventListener('change', onCommit);
            }

            inputMap[item.key] = { numInput, rangeInput, syncNote };

            itemDiv.appendChild(labelRow);
            if (rangeInput) itemDiv.appendChild(rangeInput);
            if (syncNote) itemDiv.appendChild(syncNote);
            groupDiv.appendChild(itemDiv);
          });

          container.appendChild(groupDiv);
        });
      }

      function syncFormValues(state) {
        const usingCalendar = ParameterStore.isUsingCalendarDimensions();
        Object.keys(state).forEach(key => {
          if (inputMap[key]) {
            inputMap[key].numInput.value = state[key];
            if (ParameterStore.PHYSICAL_KEYS.includes(key)) {
              inputMap[key].numInput.readOnly = usingCalendar;
            }
            if (inputMap[key].rangeInput) inputMap[key].rangeInput.value = state[key];
            if (inputMap[key].syncNote) {
              inputMap[key].syncNote.textContent = usingCalendar
                ? 'Synchronisiert mit Kalender'
                : 'Preset-Override; Kalender-Synchronisierung pausiert';
            }
          }
        });
      }

      function updateSyncStatus() {
        const usingCalendar = ParameterStore.isUsingCalendarDimensions();
        const card = cadElement('sync-card');
        const status = cadElement('sync-status');
        card.classList.toggle('is-overridden', !usingCalendar);
        status.textContent = usingCalendar
          ? 'Synchronisiert mit Kalender'
          : 'Preset-Maße übernommen; Synchronisierung pausiert';
      }

      function loadParameters(candidate, label = 'Preset') {
        const dimensionsDiffer = ParameterStore.hasPhysicalDifference(candidate);
        const invalidDimensions = ParameterStore.hasInvalidPhysicalDimensions(candidate);
        const prompt = label === 'Preset'
          ? 'Das gewählte Preset nutzt andere Maße als dein aktueller Kalender. Möchtest du die aktuellen Kalendermaße beibehalten oder die des Presets übernehmen?'
          : 'Die Standardwerte nutzen andere Maße als dein aktueller Kalender. Möchtest du die aktuellen Kalendermaße beibehalten oder die Standardmaße übernehmen?';
        const acceptPhysicalOverride = dimensionsDiffer && !invalidDimensions && window.confirm(
          `${prompt}\n\nOK: Maße übernehmen (Kalender-Synchronisierung pausieren).\nAbbrechen: Aktuelle Kalendermaße beibehalten.`
        );
        ParameterStore.loadState(candidate, { acceptPhysicalOverride });
        if (invalidDimensions) showToast('Ungültige Preset-Maße; aktuelle Kalendermaße wurden beibehalten.');
        return { dimensionsDiffer, invalidDimensions, acceptPhysicalOverride };
      }

      function renderBOM(p, geom) {
        const rows = [
          ['2×', 'Horizontale Tragleisten', `${geom.totalWidth.toFixed(1)} × ${p.railDepth} × ${p.railHeight} mm`, 'Holz; oben und unten'],
          ['2×', 'Wickelstäbe', `Ø ${p.rodDiameter} × ${geom.rodCutLength.toFixed(1)} mm`, 'Rundstab; Zuschnittlänge'],
          ['1×', 'Rückwand / Schreibplatte', `${p.windowWidth} × ${p.windowHeight} × ${p.backpanelThickness} mm`, 'Multiplex oder Acrylglas'],
          ['1×', 'Papierbahn', `${p.windowHeight} × ${p.paperLength} mm`, 'Breite × Länge'],
          ['4×', 'PTFE-Möbelgleiter', `${p.gliderThickness} mm stark`, 'Je zwei pro Wickelstab'],
          ['2×', '5-Cent-Münze', `${p.coinThickness} mm stark`, 'Auflage für obere Justierung'],
          ['2×', 'Rändelmutter M6 (DIN 466)', `${p.knurledNutHeight} mm hoch`, 'Je eine pro Wickelstab']
        ];
        const tbody = cadElement('bom-items');
        tbody.replaceChildren();
        rows.forEach(row => {
          const tr = document.createElement('tr');
          row.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }

      function updateKPIsAndValidation(p, geom) {
        cadElement('kpi-axis-distance').textContent = `${geom.axisDistance.toFixed(1)} mm`;
        cadElement('kpi-outer-dims').textContent = `${geom.totalWidth.toFixed(0)} × ${geom.totalHeight.toFixed(0)} mm`;
        cadElement('kpi-total-with-nuts').textContent = `Inkl. Rändelmutter: ${geom.totalHeightWithNuts.toFixed(1)} mm`;
        cadElement('kpi-rod-cut').textContent = `${geom.rodCutLength.toFixed(1)} mm`;
        cadElement('kpi-max-roll').textContent = `Ø ${geom.maxRollDiameter.toFixed(2)} mm`;
        cadElement('kpi-radial-build').textContent = `Auftrag: +${geom.radialBuildUp.toFixed(2)} mm / Seite`;

        const tCore = geom.tangents.coreRight;
        const tFull = geom.tangents.fullRight;
        if (tCore.valid && tFull.valid) {
          cadElement('kpi-wrap-angle').textContent = `${tFull.angleDeg.toFixed(1)}° – ${tCore.angleDeg.toFixed(1)}°`;
          cadElement('kpi-tangent-len').textContent = `Freie Tangente: ${tFull.length.toFixed(1)}–${tCore.length.toFixed(1)} mm`;
        } else {
          cadElement('kpi-wrap-angle').textContent = 'Kollision / Ungültig';
          cadElement('kpi-tangent-len').textContent = 'Tangente nicht berechenbar';
        }

        const box = cadElement('validation-box');
        const badge = cadElement('validation-badge');
        const list = cadElement('validation-list');

        const hasErr = geom.checks.some(c => c.level === 'error');
        const hasWarn = geom.checks.some(c => c.level === 'warning');
        cadElement('stage').classList.toggle('cad-validation-error', hasErr);

        if (hasErr) {
          box.style.backgroundColor = 'var(--err-bg)';
          box.style.borderColor = 'var(--err-border)';
          box.style.color = 'var(--err-text)';
          badge.style.backgroundColor = 'var(--err-bg)';
          badge.textContent = 'FEHLER / KOLLISION';
        } else if (hasWarn) {
          box.style.backgroundColor = 'var(--warn-bg)';
          box.style.borderColor = 'var(--warn-border)';
          box.style.color = 'var(--warn-text)';
          badge.style.backgroundColor = 'var(--warn-bg)';
          badge.textContent = 'WARNUNG';
        } else {
          box.style.backgroundColor = 'var(--ok-bg)';
          box.style.borderColor = 'var(--ok-border)';
          box.style.color = 'var(--ok-text)';
          badge.style.backgroundColor = 'var(--ok-bg)';
          badge.textContent = 'OK / KOLLISIONSFREI';
        }

        list.innerHTML = '';
        geom.checks.forEach(c => {
          const li = document.createElement('li');
          li.textContent = c.text;
          list.appendChild(li);
        });
      }

      function applyViewBox(svgEl) {
        svgEl.setAttribute(
          'viewBox',
          `${currentViewBox.x.toFixed(1)} ${currentViewBox.y.toFixed(1)} ${currentViewBox.w.toFixed(1)} ${currentViewBox.h.toFixed(1)}`
        );
        sharedElement('preview-scale-indicator').textContent = `${Math.round(zoomFactor * 100)}%`;
      }

      function setZoom(svgEl, nextZoom, anchorNormX = 0.5, anchorNormY = 0.5) {
        const clamped = Math.min(4.0, Math.max(0.6, nextZoom));
        const newW = baseViewBox.w / clamped;
        const newH = baseViewBox.h / clamped;
        const dx = (currentViewBox.w - newW) * anchorNormX;
        const dy = (currentViewBox.h - newH) * anchorNormY;
        currentViewBox.x += dx;
        currentViewBox.y += dy;
        currentViewBox.w = newW;
        currentViewBox.h = newH;
        zoomFactor = clamped;
        applyViewBox(svgEl);
      }

      function resetZoom(svgEl) {
        zoomFactor = 1.0;
        currentViewBox = { ...baseViewBox };
        applyViewBox(svgEl);
      }

      function initPanZoom(svgEl) {
        const wrapper = cadElement('viewport-wrapper');
        window.addEventListener('cronoscroll:modechange', () => {
          if (document.getElementById('app-container').classList.contains('cad-mode')) {
            sharedElement('preview-scale-indicator').textContent = `${Math.round(zoomFactor * 100)}%`;
          }
        });

        sharedElement('btn-zoom-in').addEventListener('click', () => {
          if (document.getElementById('app-container').classList.contains('cad-mode')) setZoom(svgEl, zoomFactor * 1.2);
        });
        sharedElement('btn-zoom-out').addEventListener('click', () => {
          if (document.getElementById('app-container').classList.contains('cad-mode')) setZoom(svgEl, zoomFactor / 1.2);
        });
        sharedElement('btn-zoom-reset').addEventListener('click', () => {
          if (document.getElementById('app-container').classList.contains('cad-mode')) resetZoom(svgEl);
        });
        sharedElement('btn-zoom-fit-banner').addEventListener('click', () => {
          if (document.getElementById('app-container').classList.contains('cad-mode')) resetZoom(svgEl);
        });

        wrapper.addEventListener('wheel', (e) => {
          e.preventDefault();
          const rect = wrapper.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width;
          const normY = (e.clientY - rect.top) / rect.height;
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          setZoom(svgEl, zoomFactor * factor, normX, normY);
        }, { passive: false });

        wrapper.addEventListener('pointerdown', (e) => {
          isPanning = true;
          wrapper.setPointerCapture(e.pointerId);
          panStart = { clientX: e.clientX, clientY: e.clientY, vbX: currentViewBox.x, vbY: currentViewBox.y };
        });

        wrapper.addEventListener('pointermove', (e) => {
          if (!isPanning) return;
          const rect = wrapper.getBoundingClientRect();
          const scaleX = currentViewBox.w / rect.width;
          const scaleY = currentViewBox.h / rect.height;
          currentViewBox.x = panStart.vbX - (e.clientX - panStart.clientX) * scaleX;
          currentViewBox.y = panStart.vbY - (e.clientY - panStart.clientY) * scaleY;
          applyViewBox(svgEl);
        });

        const endPan = () => { isPanning = false; };
        wrapper.addEventListener('pointerup', endPan);
        wrapper.addEventListener('pointercancel', endPan);
      }

      function refreshPresetSelect(selected = '') {
        const select = cadElement('preset-select');
        let all;
        try {
          all = StorageManager.getAll();
        } catch (error) {
          select.replaceChildren();
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'Presets nicht verfügbar';
          select.appendChild(option);
          select.disabled = true;
          showToast(`CAD-Presets konnten nicht geladen werden: ${error.message}`);
          return;
        }
        select.disabled = false;
        const names = Object.keys(all).sort((a, b) => a.localeCompare(b));

        select.innerHTML = `<option value="">-- Gespeicherte Modelle (${names.length}) --</option>`;
        names.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          if (name === selected) opt.selected = true;
          select.appendChild(opt);
        });
      }

      function getTitleBlockData() {
        return {
          title: cadElement('tb-title-input').value.trim() || 'CHRONOSCROLL',
          material: cadElement('tb-material-input').value.trim() || 'Massivholz',
          drawingNo: cadElement('tb-dwg-input').value.trim() || 'CS-2.1',
          author: cadElement('tb-author-input').value.trim() || 'Kolja'
        };
      }

      function setTitleBlockData(tb) {
        if (!tb) return;
        if (tb.title) cadElement('tb-title-input').value = tb.title;
        if (tb.material) cadElement('tb-material-input').value = tb.material;
        if (tb.drawingNo) cadElement('tb-dwg-input').value = tb.drawingNo;
        if (tb.author) cadElement('tb-author-input').value = tb.author;
      }

      function getViewOptions() {
        return {
          showMaxRoll: cadElement('chk-show-maxroll').checked,
          showCenterlines: cadElement('chk-show-centerlines').checked,
          showSection: cadElement('chk-show-section').checked,
          showCalendarPreview: cadElement('chk-calendar-preview').checked
        };
      }

      function setViewOptions(opts) {
        if (!opts) return;
        if (typeof opts.showMaxRoll === 'boolean') cadElement('chk-show-maxroll').checked = opts.showMaxRoll;
        if (typeof opts.showCenterlines === 'boolean') cadElement('chk-show-centerlines').checked = opts.showCenterlines;
        if (typeof opts.showSection === 'boolean') cadElement('chk-show-section').checked = opts.showSection;
        if (typeof opts.showCalendarPreview === 'boolean') cadElement('chk-calendar-preview').checked = opts.showCalendarPreview;
      }

      function triggerUpdate() {
        const svgEl = cadElement('drawing-svg');
        const state = ParameterStore.getState();
        const geom = GeometryEngine.analyze(state);
        const viewOpts = getViewOptions();
        const titleBlock = getTitleBlockData();

        updateKPIsAndValidation(state, geom);
        renderBOM(state, geom);
        updateSyncStatus();
        CADRenderer.render(svgEl, state, geom, viewOpts, titleBlock, calendarPreviewSnapshot);

        const vbParts = svgEl.getAttribute('viewBox').split(' ').map(Number);
        baseViewBox = { x: vbParts[0], y: vbParts[1], w: vbParts[2], h: vbParts[3] };
        currentViewBox.w = baseViewBox.w / zoomFactor;
        currentViewBox.h = baseViewBox.h / zoomFactor;
        applyViewBox(svgEl);
      }

      function bindActions(svgEl) {
        const exportMenu = sharedElement('cad-export-menu');
        const exportMenuToggle = sharedElement('cad-export-menu-toggle');
        const exportMenuItems = Array.from(exportMenu.querySelectorAll('[role="menuitem"]'));
        const closeExportMenu = (restoreFocus = false) => {
          exportMenu.hidden = true;
          exportMenuToggle.setAttribute('aria-expanded', 'false');
          if (restoreFocus) exportMenuToggle.focus();
        };
        const openExportMenu = (focusIndex = -1) => {
          exportMenu.hidden = false;
          exportMenuToggle.setAttribute('aria-expanded', 'true');
          if (focusIndex >= 0) exportMenuItems[focusIndex].focus();
        };
        exportMenuToggle.addEventListener('click', () => {
          if (exportMenu.hidden) openExportMenu();
          else closeExportMenu();
        });
        exportMenuToggle.addEventListener('keydown', event => {
          if (event.key === 'Escape' && !exportMenu.hidden) {
            event.preventDefault();
            closeExportMenu(true);
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openExportMenu(event.key === 'ArrowUp' ? exportMenuItems.length - 1 : 0);
          }
        });
        exportMenu.addEventListener('keydown', event => {
          const currentIndex = exportMenuItems.indexOf(document.activeElement);
          let nextIndex = currentIndex;
          if (event.key === 'Escape') {
            event.preventDefault();
            closeExportMenu(true);
          } else if (event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % exportMenuItems.length;
          } else if (event.key === 'ArrowUp') {
            nextIndex = (currentIndex - 1 + exportMenuItems.length) % exportMenuItems.length;
          } else if (event.key === 'Home') {
            nextIndex = 0;
          } else if (event.key === 'End') {
            nextIndex = exportMenuItems.length - 1;
          } else {
            return;
          }
          event.preventDefault();
          exportMenuItems[nextIndex].focus();
        });
        exportMenu.addEventListener('click', event => {
          if (event.target.closest('[role="menuitem"]')) closeExportMenu(true);
        });
        sharedElement('cad-export-group').addEventListener('focusout', () => {
          queueMicrotask(() => {
            if (!sharedElement('cad-export-group').contains(document.activeElement)) closeExportMenu();
          });
        });
        document.addEventListener('pointerdown', event => {
          if (!sharedElement('cad-export-group').contains(event.target)) closeExportMenu();
        });

        // Presets speichern
        cadElement('btn-save-preset').addEventListener('click', () => {
          const nameInput = cadElement('preset-name-input');
          const name = nameInput.value.trim();
          if (!name) {
            showToast('Bitte gib einen Namen für das Modell ein.');
            nameInput.focus();
            return;
          }
          const bundle = {
            params: ParameterStore.getState(),
            titleBlock: getTitleBlockData(),
            viewOptions: getViewOptions()
          };
          try {
            if (StorageManager.save(name, bundle)) {
              refreshPresetSelect(name);
              showToast(`Modell „${name}“ gespeichert.`);
            }
          } catch (error) {
            showToast(`Modell konnte nicht gespeichert werden: ${error.message}`);
          }
        });

        // Presets laden
        cadElement('btn-load-preset').addEventListener('click', () => {
          const select = cadElement('preset-select');
          const name = select.value;
          if (!name) {
            showToast('Bitte wähle zuerst ein Modell aus der Liste.');
            return;
          }
          let bundle;
          try {
            bundle = StorageManager.load(name);
          } catch (error) {
            showToast(`Modell konnte nicht geladen werden: ${error.message}`);
            return;
          }
          if (bundle) {
            cadElement('preset-name-input').value = name;
            const result = loadParameters(bundle.params || {});
            if (bundle.titleBlock) setTitleBlockData(bundle.titleBlock);
            if (bundle.viewOptions) setViewOptions(bundle.viewOptions);
            triggerUpdate();
            showToast(result.dimensionsDiffer && !result.acceptPhysicalOverride
              ? `Modell „${name}“ geladen; Kalendermaße beibehalten.`
              : `Modell „${name}“ geladen.`);
          }
        });

        // Standard
        cadElement('btn-reset-defaults').addEventListener('click', () => {
          const defaults = ParameterStore.getDefaults();
          const result = loadParameters(defaults, 'Standardwerte');
          cadElement('preset-name-input').value = '';
          cadElement('preset-select').value = '';
          resetZoom(svgEl);
          triggerUpdate();
          showToast(result.dimensionsDiffer && !result.acceptPhysicalOverride
            ? 'Standardwerte wiederhergestellt; Kalendermaße beibehalten.'
            : 'Standardwerte wiederhergestellt.');
        });

        cadElement('relink-calendar').addEventListener('click', () => {
          ParameterStore.relinkToCalendar();
          showToast('CAD-Maße werden wieder mit dem Kalender synchronisiert.');
        });

        // Löschen
        cadElement('btn-delete-preset').addEventListener('click', () => {
          const select = cadElement('preset-select');
          const name = select.value;
          if (!name) {
            showToast('Kein gespeichertes Modell ausgewählt.');
            return;
          }
          try {
            if (StorageManager.remove(name)) {
              refreshPresetSelect();
              showToast(`Modell „${name}“ gelöscht.`);
            }
          } catch (error) {
            showToast(`Modell konnte nicht gelöscht werden: ${error.message}`);
          }
        });

        // JSON Export
        cadElement('btn-export-json').addEventListener('click', () => {
          const payload = {
            application: 'ChronoScroll 2D-CAD v2.1',
            exportedAt: new Date().toISOString(),
            params: ParameterStore.getState(),
            titleBlock: getTitleBlockData(),
            viewOptions: getViewOptions()
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const rawName = cadElement('preset-name-input').value.trim();
          const filename = rawName ? `ChronoScroll_${rawName.replace(/[^a-z0-9_-]/gi, '_')}.json` : 'ChronoScroll_Konfiguration.json';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`Exportiert als „${filename}“.`);
        });

        // JSON Import
        const fileInput = cadElement('json-file-input');
        cadElement('btn-import-json').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const parsed = JSON.parse(ev.target.result);
              const result = loadParameters(parsed.params || parsed);
              if (parsed.titleBlock) setTitleBlockData(parsed.titleBlock);
              if (parsed.viewOptions) setViewOptions(parsed.viewOptions);
              triggerUpdate();
              showToast(result.dimensionsDiffer && !result.acceptPhysicalOverride
                ? `Konfiguration aus „${file.name}“ geladen; Kalendermaße beibehalten.`
                : `Konfiguration aus „${file.name}“ geladen.`);
            } catch (err) {
              showToast(`JSON-Import fehlgeschlagen: ${err.message}`);
            }
          };
          reader.readAsText(file);
          fileInput.value = '';
        });

        // SVG Export
        sharedElement('cad-btn-export-svg').addEventListener('click', () => {
          const prevVB = svgEl.getAttribute('viewBox');
          svgEl.setAttribute('viewBox', `${baseViewBox.x} ${baseViewBox.y} ${baseViewBox.w} ${baseViewBox.h}`);
          const serializer = new XMLSerializer();
          let source = serializer.serializeToString(svgEl);
          svgEl.setAttribute('viewBox', prevVB);

          if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const rawName = cadElement('preset-name-input').value.trim();
          const filename = rawName ? `ChronoScroll_${rawName.replace(/[^a-z0-9_-]/gi, '_')}.svg` : 'ChronoScroll_Zeichnung.svg';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`Vektorzeichnung „${filename}“ gespeichert.`);
        });

        sharedElement('cad-btn-export-pdf').addEventListener('click', async () => {
          try {
            const rawName = cadElement('preset-name-input').value.trim();
            const filename = rawName ? `ChronoScroll_${rawName.replace(/[^a-z0-9_-]/gi, '_')}.pdf` : 'ChronoScroll_CAD.pdf';
            await window.CronoScrollCADPdf.exportCadDrawing(svgEl, baseViewBox, filename);
            showToast(`Technisches PDF „${filename}“ gespeichert.`);
          } catch (err) {
            showToast(`PDF-Export fehlgeschlagen: ${err.message}`);
          }
        });

        // Event-Listener für Layer & Schriftfeld, damit sie sofort live aktualisieren
        ['chk-show-maxroll', 'chk-show-centerlines', 'chk-show-section', 'chk-calendar-preview',
          'tb-title-input', 'tb-material-input', 'tb-dwg-input', 'tb-author-input'].forEach(id => {
          const elNode = cadElement(id);
          if (elNode) {
            elNode.addEventListener('input', triggerUpdate);
            elNode.addEventListener('change', triggerUpdate);
          }
        });
      }

      function init() {
        buildParameterForm();
        refreshPresetSelect();

        const svgEl = cadElement('drawing-svg');
        initPanZoom(svgEl);
        bindActions(svgEl);

        ParameterStore.subscribe(nextState => {
          syncFormValues(nextState);
          triggerUpdate();
        });

        if (!window.CronoScrollCADBridge) {
          throw new Error('ChronoScrollCADBridge wurde nicht geladen.');
        }
        window.CronoScrollCADBridge.subscribe(snapshot => {
          calendarPreviewSnapshot = snapshot.calendarPreview;
          ParameterStore.setCalendarDimensions(snapshot.dimensions);
          if (!ParameterStore.isUsingCalendarDimensions()) triggerUpdate();
        });

        ParameterStore.reset();
      }

      return { init };
    })();

    document.addEventListener('DOMContentLoaded', () => {
      UIController.init();
    });
})();
