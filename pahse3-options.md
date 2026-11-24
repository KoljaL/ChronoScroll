# ChronoScroll – Phase 3: Parameter-Spezifikation & Preset-Schema

> [!NOTE]
> **Reine Spezifikation (keine Code-Änderungen).**
> Berücksichtigt den aktuellen Git-Stand (Phase-2-Umbau in `index.html`, `css/app.css`, `css/cad-styles.css`, `js/app.js`, `js/cad-module.js`) sowie die Dokumente `phase1-audit-report.md` und `phase2-sidebar-ux_*.md`.

---

## 0. Einordnung in den aktuellen Code- & Architekturstand

1. **Kein separates `js/layoutSettings.js`:** Im Repository existiert aktuell kein Modul `js/layoutSettings.js` (der Name stammt aus der Testdatei `tests/layoutSettings.test.js`). Die reale Zuständigkeit verteilt sich auf:
   - **`js/app.js`**: Zentraler `state`, `presetDefaults` und `applyPreset(name, data)` für Kalender-Presets.
   - **`js/shareConfig.js`**: Schema-Validierung (`validateCalendarSettings(state)`) und URL-Serialisierung (`fields`).
   - **`js/cad-module.js`**: CAD-Parameter-Schema (`ParameterStore.SCHEMA`), `loadState()` und `CronoScrollCADBridge`-Synchronisation.
2. **Phase-2-Kontext (Git-Stand):**
   - Die Kalender-Sidebar (`#app-sidebar`) ist auf 3 Haupt-Tabs (`tab-geometry`, `tab-style`, `tab-holidays`) mit `<details>`-Akkordeons und `syncDependentControls()` umgestellt. Neue Kalender-Parameter gehören in **Format & Maße** (`#tab-geometry`), da dort bereits Papiermaße, Vorlauf/Nachlauf (`input-puffer-left`, `input-puffer-right`) und Schnittmarken (`checkbox-show-cropmarks`) liegen.
   - Die CAD-Sidebar (`#cad-sidebar`) nutzt `<details class="param-group cad-param-accordion">` mit `tooltip` und `aria-describedby="cad-unit-<key>"`, generiert aus `ParameterStore.SCHEMA`. Neue CAD-Parameter fügen sich dort automatisch ein.
3. **Abwärtskompatibilität (Pflicht):**
   - Alle bestehenden `id`-, `name`- und `data-*`-Attribute sowie bestehende Preset-Keys (`showCropMarks`, `pufferLeft`, `pufferRight`, `paperThickness`) bleiben unverändert.
   - Jeder neue Parameter besitzt einen Default-Wert, der **exakt dem bisherigen impliziten Verhalten** entspricht, und greift beim Import älterer JSON-Presets automatisch über `?? DEFAULT_VALUE` (bzw. `presetDefaults` / `ParameterStore.loadState()`).

---

## 1. PARAMETER-TABELLE

### 1.1 Kalender- & Druck-Parameter (`js/app.js`, `js/geometry.js`, `js/shareConfig.js`)

| Name & Beschreibung | State-Key | DOM-ID (Vorschlag) | Typ / Wertebereich | Einheit | Default-Wert (bisher implizit) | Betroffene Module |
|---|---|---|---|---|---|---|
| **Papiergrammatur** | `paperGrammage` | `input-paper-grammage` | `Number` (`60` – `250`, Step `10`) | `g/m²` | `80` *(entspricht ca. `0,10 mm` im CAD)* | CAD-Zeichnung *(via Bridge-Sync)*, Stückliste |
| **Vorlauf-Wickelzugabe** *(Befestigung linker Stab)* | `windingAllowanceLeftMm` | `input-winding-allowance-left` | `Number` (`0` – `200`, Step `5`) | `mm` | `0` *(bisher keine separate Zugabe)* | Canvas-Vorschau *(Banner)*, Print-SVG, PDF-Export, CAD-Zeichnung (`paperLength`), Stückliste |
| **Nachlauf-Wickelzugabe** *(Befestigung rechter Stab)* | `windingAllowanceRightMm` | `input-winding-allowance-right` | `Number` (`0` – `200`, Step `5`) | `mm` | `0` *(bisher keine separate Zugabe)* | Canvas-Vorschau *(Banner)*, Print-SVG, PDF-Export, CAD-Zeichnung (`paperLength`), Stückliste |
| **Schnittmarken-Stil** | `cropMarkStyle` | `select-crop-mark-style` | `Select` (`'none'`, `'corners'`, `'lines'`) | `–` | `'none'` *(bzw. `'corners'`, falls altes Preset `showCropMarks: true`)* | Canvas-Vorschau, Print-SVG, PDF-Export |

> [!TIP]
> **Rückwärts-Mapping für Schnittmarken:** `checkbox-show-cropmarks` (`state.showCropMarks`) bleibt für bestehende Tests und Presets erhalten. Wenn `cropMarkStyle` im Preset fehlt, gilt `state.showCropMarks ? 'corners' : 'none'`. Umgekehrt setzt `cropMarkStyle !== 'none'` implizit `showCropMarks = true`.

### 1.2 CAD-Toleranz- & Fertigungs-Parameter (`js/cad-module.js` → `ParameterStore.SCHEMA`)

| Name & Beschreibung | Schema-Key | DOM-ID (auto-generiert) | Typ / Wertebereich | Einheit | Default-Wert (bisher implizit) | Betroffene Module |
|---|---|---|---|---|---|---|
| **Bohrspiel Sackloch** *(Aufmaß auf `rodDiameter`)* | `blindHoleClearanceMm` | `cad-input-num-blindHoleClearanceMm` | `Number` (`0.0` – `2.0`, Step `0.1`) | `mm` | `0.0` *(bisher exakt `rodDiameter`)* | CAD-Zeichnung *(Bohrmaß / Bemaßung)*, Stückliste *(Bohrer-Ø)* |
| **Axialspiel Wickelstab** *(Summe oberes + unteres Spiel)* | `rodAxialPlayMm` | `cad-input-num-rodAxialPlayMm` | `Number` (`0.5` – `5.0`, Step `0.5`) | `mm` | `2.0` *(bisher hartcodiert `1.5 + 0.5 = 2.0 mm`)* | CAD-Zeichnung *(Stablänge)*, Stückliste *(`rodCutLength`)* |
| **Min. Seiten-Restspalt** *(Warnschwelle volle Rolle)* | `minSideGapMm` | `cad-input-num-minSideGapMm` | `Number` (`0.5` – `5.0`, Step `0.5`) | `mm` | `1.0` *(bisher hartcodiert `< 1.0 mm`)* | CAD-Zeichnung *(Kollisionsprüfung / Validierung)* |

---

## 2. VORSCHLÄGE FÜR KANDIDATEN (Fachliche Auswirkung)

1. **Papiergrammatur / Papierdicke (`paperGrammage` ↔ `paperThickness`)**
   - Im CAD existiert `paperThickness` (`0.05` – `0.25 mm`, Default `0.10 mm`, Tooltip `Richtwert: 80 g/m² ≈ 0,10 mm`) bereits in Gruppe `2. Papierbahn`.
   - Durch `paperGrammage` im Kalender-Editor (`80 g/m²` → `0.10 mm`, Näherung `grammage * 0.00125`, geclampt auf `[0.05, 0.25]`) wird der reale Rollendurchmesser $D_{\max} = \sqrt{D_{\text{Stab}}^2 + \frac{4 \cdot L \cdot d}{\pi}}$ direkt aus der Papierwahl gespeist und warnt frühzeitig vor seitlicher Kollision (`remainingSideGap`) oder rückwärtigem Überstand (`rollBackZ > railDepth`).
   - Bleibt `paperGrammage` in alten Presets undefiniert, greift `80` (`0.10 mm`) — identisch zum bisherigen CAD-Default.

2. **Vorlauf- / Nachlauf-Wickelzugabe (`windingAllowanceLeftMm`, `windingAllowanceRightMm`)**
   - Trennt den sichtbaren/beschriftbaren Montagepuffer (`pufferLeft`/`pufferRight`, z. B. für Jahresübersicht, Notizen, QR-Code) sauber von der reinen **Klebe-/Klemmzugabe** für eine Umdrehung auf dem Wickelstab ($\approx \pi \cdot D_{\text{Stab}} \approx 78{,}5\text{ mm}$ bei Ø 25 mm).
   - Im Layout (`CronoGeometry.calculate()`) verlängert die Zugabe ausschließlich die Gesamtpapierlänge `lTotalMm` bzw. die äußeren unbedruckten Ränder im Banner-Export (`svgExport.js`, `pdfExport.js`, `canvasRenderer.js`), ohne das Monatsraster oder die QR-Position zu verschieben.
   - Default `0 mm` garantiert exakt identische Papierlängen (`paperLength`) für alle bestehenden Presets.

3. **Schnittmarken-Stil (`cropMarkStyle`)**
   - Bisher unterstützt `canvasRenderer.js` und `pdfExport.js` nur ein binäres `showCropMarks` (Ecken-Winkel), während `svgExport.js` noch keine Schnittmarken zeichnet.
   - Mit `'none' | 'corners' | 'lines'` lassen sich sowohl klassische Eck-Passermarken als auch durchgehende Beschnittlinien für Plotter/Schneidemaschinen in **allen drei** Exportpfaden (Canvas, Print-SVG, PDF) einheitlich steuern.
   - In `syncDependentControls()` bleibt die Abwärtskompatibilität zu `checkbox-show-cropmarks` gewahrt.

4. **CAD-Materialtoleranzen & Bohrdurchmesser (`blindHoleClearanceMm`, `rodAxialPlayMm`, `minSideGapMm`)**
   - In der Holzbearbeitung erfordert ein 25-mm-Rundstab im Sackloch je nach Holzart und Lackierung `0,2` – `0,5 mm` Bohrspiel (`blindHoleClearanceMm`). Bisher war der Bohrdurchmesser implizit gleich `rodDiameter` (`0,0 mm` Aufmaß).
   - `rodAxialPlayMm` ersetzt die magischen Konstanten `+ 1.5` (oben) und `+ 0.5` (unten) in `rodCutLength = panelHeight + 2 * blindHoleDepth - upperStack - lowerStack` durch einen expliziten, dokumentierten Parameter mit identischem Default `2.0 mm`.
   - `minSideGapMm` macht die bisher feste Kollisionsschwelle (`remainingSideGap < 1.0`) konfigurierbar, z. B. für ungenau gewickelte Papierbahnen.

---

## 3. SCHEMA-KOMPATIBILITÄT (`js/app.js`, `js/shareConfig.js`, `js/cad-module.js`)

> [!NOTE]
> Die folgende Logik zeigt die Validierung und das Laden mit `?? DEFAULT_VALUE`-Fallbacks für die zuständigen Module (analog zur Rolle von `layoutSettings.js` in den Tests).

### 3.1 Kalender-Defaults & Preset-Import (`js/app.js`)

```javascript
const PHASE3_DEFAULTS = {
  paperGrammage: 80,
  windingAllowanceLeftMm: 0,
  windingAllowanceRightMm: 0,
  cropMarkStyle: 'none',
};

function normalizePhase3Settings(rawPreset = {}) {
  const clampNum = (val, min, max, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  const paperGrammage = clampNum(
    rawPreset.paperGrammage ?? PHASE3_DEFAULTS.paperGrammage,
    60, 250, PHASE3_DEFAULTS.paperGrammage
  );
  const windingAllowanceLeftMm = clampNum(
    rawPreset.windingAllowanceLeftMm ?? PHASE3_DEFAULTS.windingAllowanceLeftMm,
    0, 200, PHASE3_DEFAULTS.windingAllowanceLeftMm
  );
  const windingAllowanceRightMm = clampNum(
    rawPreset.windingAllowanceRightMm ?? PHASE3_DEFAULTS.windingAllowanceRightMm,
    0, 200, PHASE3_DEFAULTS.windingAllowanceRightMm
  );

  const validCropStyles = ['none', 'corners', 'lines'];
  const legacyCropStyle = rawPreset.showCropMarks ? 'corners' : PHASE3_DEFAULTS.cropMarkStyle;
  const cropMarkStyle = validCropStyles.includes(rawPreset.cropMarkStyle)
    ? rawPreset.cropMarkStyle
    : legacyCropStyle;

  return {
    paperGrammage,
    windingAllowanceLeftMm,
    windingAllowanceRightMm,
    cropMarkStyle,
    showCropMarks: cropMarkStyle !== 'none',
  };
}
```

In `applyPreset(name, data)` wird das Ergebnis direkt nach `Object.assign(state, ...)` angewendet:

```javascript
Object.assign(state, normalizePhase3Settings(preset));
```

### 3.2 Schema-Validierung (`js/shareConfig.js`)

Für ältere URL-Configs oder JSON-Exporte werden die neuen Felder in `validateCalendarSettings(state)` nur validiert, wenn sie gesetzt sind (oder nach `normalizePhase3Settings` mit Defaults befüllt):

```javascript
const optionalPhase3Fields = [
  ['paperGrammage', number(60, 250)],
  ['windingAllowanceLeftMm', number(0, 200)],
  ['windingAllowanceRightMm', number(0, 200)],
  ['cropMarkStyle', choice('none', 'corners', 'lines')],
];

optionalPhase3Fields.forEach(([name, valid]) => {
  if (state[name] !== undefined && !valid(state[name])) {
    errors.push(name);
  }
});
```

### 3.3 CAD-Toleranz-Fallbacks (`js/cad-module.js`)

In `ParameterStore.SCHEMA` werden die drei Toleranz-Parameter in Gruppe 3/4 ergänzt. `ParameterStore.loadState(candidate)` iteriert bereits über `getDefaults()`, sodass fehlende Keys aus älteren CAD-JSONs automatisch ihren `default` (`0.0`, `2.0`, `1.0`) erhalten:

```javascript
// Beispiel-Ergänzung in ParameterStore.SCHEMA:
{ key: 'blindHoleClearanceMm', label: 'Bohrspiel Sackloch', tooltip: 'Aufmaß auf Stabdurchmesser für den Bohrer', min: 0.0, max: 2.0, step: 0.1, default: 0.0, unit: 'mm' },
{ key: 'rodAxialPlayMm', label: 'Axialspiel Wickelstab', tooltip: 'Gesamtspiel oben + unten in den Sacklöchern', min: 0.5, max: 5.0, step: 0.5, default: 2.0, unit: 'mm' },
{ key: 'minSideGapMm', label: 'Min. Seiten-Restspalt', tooltip: 'Warnschwelle für Restspalt bei voller Rolle', min: 0.5, max: 5.0, step: 0.5, default: 1.0, unit: 'mm' }

// In analyze(p) mit ??-Fallback für direkte Aufrufe:
const blindHoleClearanceMm = p.blindHoleClearanceMm ?? 0.0;
const rodAxialPlayMm = p.rodAxialPlayMm ?? 2.0;
const minSideGapMm = p.minSideGapMm ?? 1.0;
const drillDiameterMm = p.rodDiameter + blindHoleClearanceMm;
```
