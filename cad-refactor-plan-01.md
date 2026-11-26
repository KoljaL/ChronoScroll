# CAD-Ansicht Refactoring – Implementierungsplan

> **Status:** Plan – noch keine Umsetzung.

## Überblick: Was ändert sich?

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| KPI-Grid | 5 Boxen unterhalb der Zeichnung (DOM) | **entfernt** |
| Stückliste (BOM) | HTML-Tabelle unterhalb der Zeichnung | **SVG-Tabelle links im Schriftfeld** |
| BOM-Menge | fix 1× im Code | **Multiplikator-Input in der Sidebar** |
| Kollisionsprüfung | farbige Card unterhalb der Zeichnung | **Badge / Banner / Overlay über der Zeichnung** |
| `cad-bom-card` DOM-Element | vorhanden | **entfernt** |
| `kpi-grid` DOM-Element | vorhanden | **entfernt** |

---

## Teil 1 – KPI-Grid entfernen

### 1.1 `index.html`
- Den gesamten `<section class="kpi-grid">` Block (Zeilen 923–936) **ersatzlos löschen**.

### 1.2 `css/cad-styles.css`
- Regeln `.kpi-grid`, `.kpi-box`, `.kpi-label`, `.kpi-value`, `.kpi-sub`, `.cad-kpi-blue`, `.cad-kpi-amber` entfernen (ca. 45 Zeilen, Bereich 435–468 + 638–646).

### 1.3 `js/cad-module.js`
- `updateKPIsAndValidation()` enthält zwei Blöcke:
  - **Block A (KPI-Updates, Zeilen 1169–1184):** die 7 `cadElement('kpi-…').textContent`-Zuweisungen löschen. Die Tangenten-Berechnung (`tCore`, `tFull`) bleibt als lokale Variable erhalten – sie wird für die Validierungsliste noch gebraucht.
  - **Block B (Validation-Box, ab Zeile 1186):** bleibt vorerst unverändert (wird in Teil 4 ersetzt).
- Die nun toten IDs `cad-kpi-axis-distance` etc. erzeugen keinen Fehler, da niemand mehr auf sie schreibt.

> **Hinweis:** `cadElement('kpi-wrap-angle').textContent = 'Kollision / Ungültig'` (Zeile 1182) fällt ebenfalls weg. Der Kollisionsstatus wird ausschließlich über die `checks`-Liste und den neuen Overlay-Mechanismus kommuniziert.

---

## Teil 2 – BOM-Menge: Kalenderanzahl-Input in der Sidebar

### 2.1 `index.html` – Input im DIN-Schriftfeld-Accordion

Im `<details>` „DIN-Schriftfeld" (Sidebar, ab Zeile 847) direkt **nach dem Autor-Feld** einfügen:

```html
<div class="form-field">
  <label for="cad-bom-qty-input">Anzahl Kalender (Stückliste)</label>
  <div style="display:flex; align-items:center; gap:0.5rem;">
    <input type="number" id="cad-bom-qty-input" min="1" max="99" value="1"
      aria-label="Anzahl Kalender für Stückliste" style="width:4rem;" />
    <span style="font-size:0.75rem; color:var(--text-muted);">× Exemplare</span>
  </div>
</div>
```

### 2.2 `js/cad-module.js` – Hilfsfunktion `getBomQty()`

```js
function getBomQty() {
  const el = cadElement('bom-qty-input');
  const v = parseInt(el?.value ?? '1', 10);
  return (isFinite(v) && v >= 1) ? v : 1;
}
```

`cadElement('bom-qty-input')` bekommt einen `input`-Listener → `triggerUpdate()` (wie alle anderen Sidebar-Inputs).

### 2.3 `renderBOM()` → `buildBOMRows(p, geom, qty)`

Die bisherige `renderBOM()`-Funktion wird aufgeteilt:

- **`buildBOMRows(p, geom, qty)`** – reine Datenfunktion, gibt Array der Zeilen zurück, multipliziert alle Stückzahlen mit `qty`:
  ```
  `${2 * qty}×` statt '2×'
  `${4 * qty}×` statt '4×'
  usw.
  ```
- **`renderBOM(p, geom)`** (DOM-seitig) ruft `buildBOMRows(p, geom, getBomQty())` auf und schreibt weiterhin in `cad-bom-items` – bleibt bis zum Entfernen der HTML-Card aktiv (Schritt 3.4).

---

## Teil 3 – BOM in die SVG einbetten

### 3.1 Platzierungskonzept

BOM-Tabelle **links neben dem DIN-Schriftfeld**, in der untersten Zeile des Zeichenblatts. Das hält das A4-Querformat sauber und die BOM landet automatisch im PDF-Export:

```
┌────────────────────────────────────────────────────────────┐
│                      Zeichnungsinhalt                       │
├─────────────────────────────────┬──────────────────────────┤
│  STÜCKLISTE (BOM)               │  DIN-Schriftfeld         │
│  Anz. │ Bauteil │ Maß │ Material│  Titel / Autor / Nr.    │
└─────────────────────────────────┴──────────────────────────┘
```

- BOM-Breite: `sheetW - tbW - 30` (Restbreite links vom Schriftfeld)
- BOM-Höhe: `titleBlockH` (gleich dem Schriftfeld, derzeit 74 SVG-Einheiten)
- Wenn 7 Zeilen bei `titleBlockH = 74` zu eng → `titleBlockH` auf ~90 erhöhen

### 3.2 `js/cad-module.js` – neue Funktion `drawBOMTable()`

Neue Hilfsfunktion innerhalb des `CADRenderer`-IIFEs, aufgerufen am Ende von `render()` nach dem DIN-Schriftfeld:

**Aufbau der Funktion:**
- Rahmen-Rect (Hintergrund `#f8fafc`, Rand `#0f172a`, 1.2px)
- Header-Zeile (Hintergrund `#e2e8f0`, Schriftgröße 7px, uppercase, 4 Spalten)
- Datenzeilen (Höhe = `(titleBlockH - headerH) / rows.length`, horizontale Trennlinien 0.5px)
- Vertikale Spaltentrenner (0.6px)
- Spaltenbreiten fix: `[32px, 28%, 30%, Rest]` für `Anz. / Bauteil / Zuschnitt / Material`
- Erste Spalte (Anz.): Monospace, fett

### 3.3 Integration in `render()`

`render()` erhält einen neuen Parameter `bomQty = 1`:
```js
function render(svgEl, p, geom, viewOpts, titleBlock, calendarPreview, bomQty = 1)
```

Nach dem DIN-Schriftfeld-Block:
```js
const bomRows = buildBOMRows(p, geom, bomQty);
drawBOMTable(drawing, bomRows, 10, sheetH - titleBlockH - 10, sheetW - tbW - 30, titleBlockH);
```

Aufruf in `triggerUpdate()`:
```js
CADRenderer.render(svgEl, state, geom, viewOpts, titleBlock, calendarPreviewSnapshot, getBomQty());
```

### 3.4 HTML-BOM-Card aus dem DOM entfernen

Nach erfolgreicher SVG-BOM:
- `<section class="card cad-bom-card">` aus `index.html` entfernen
- CSS-Regeln `.cad-bom-scroll`, `.cad-bom-table`, `.cad-bom-table th/td` aus `cad-styles.css` entfernen
- DOM-seitige `renderBOM()`-Funktion aus `cad-module.js` entfernen (ersetzt durch `buildBOMRows()`)

---

## Teil 4 – Kollisionsprüfung: Option D

### Konzept (3 Zustände)

| Zustand | Auslöser | UI-Element |
|---------|----------|----|
| **OK** | nur `level: 'ok'` in `checks` | Kleines grünes Badge-Streifen oben an der Drawing-Card |
| **WARN** | mind. ein `level: 'warning'`, kein `error` | Oranger einzeiliger Banner oben, einklappbar (×-Button) |
| **ERR** | mind. ein `level: 'error'` | Rotes `position:absolute`-Overlay über der gesamten SVG |

> **Wichtig:** Das Overlay schließt sich bei jedem `triggerUpdate()` automatisch neu in den korrekten Zustand. „Trotzdem exportieren" schließt es nur für den aktuellen Zustand – sobald sich Parameter ändern, erscheint es bei Fehler wieder.

### 4.1 `index.html` – neue Struktur in `#cad-drawing-card`

Das bestehende `#cad-validation-box` (außerhalb der Drawing-Card) wird **entfernt**. Stattdessen drei neue Elemente **innerhalb** von `#cad-drawing-card`:

```html
<section id="cad-drawing-card" class="card cad-drawing-card" …>

  <!-- 1. OK-Badge (schmaler Streifen oben) -->
  <div id="cad-status-badge" class="cad-status-badge" aria-live="polite" hidden>
    <i class="fa-solid fa-circle-check"></i>
    <span id="cad-status-badge-text"></span>
  </div>

  <!-- 2. Warn-Banner (einklappbar) -->
  <div id="cad-warn-banner" class="cad-warn-banner" aria-live="polite" hidden>
    <i class="fa-solid fa-triangle-exclamation"></i>
    <span id="cad-warn-banner-text"></span>
    <button type="button" id="cad-warn-dismiss" class="cad-warn-dismiss" aria-label="Warnung ausblenden">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>

  <!-- 3. Zeichenbereich (position:relative für Overlay) -->
  <div id="cad-viewport-wrapper" class="viewport-wrapper">
    <svg id="cad-drawing-svg" …></svg>

    <!-- 4. Fehler-Overlay (position:absolute, über der SVG) -->
    <div id="cad-error-overlay" class="cad-error-overlay"
      role="alertdialog" aria-labelledby="cad-error-overlay-title" hidden>
      <div class="cad-error-overlay-box">
        <div class="cad-error-overlay-header">
          <i class="fa-solid fa-circle-xmark"></i>
          <h3 id="cad-error-overlay-title">Kollision erkannt</h3>
        </div>
        <ul id="cad-error-overlay-list" class="cad-error-overlay-list"></ul>
        <div class="cad-error-overlay-actions">
          <button type="button" id="cad-error-fix-btn" class="btn btn-primary">
            <i class="fa-solid fa-wrench"></i> Parameter korrigieren
          </button>
          <button type="button" id="cad-error-dismiss-btn" class="btn btn-secondary">
            Trotzdem exportieren
          </button>
        </div>
      </div>
    </div>
  </div>

</section>
```

### 4.2 `css/cad-styles.css` – neue Regeln

**OK-Badge:**
```css
.cad-status-badge {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem; font-weight: 600;
  background: var(--ok-bg); color: var(--ok-text);
  border-bottom: 1px solid var(--ok-border);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
```

**Warn-Banner:**
```css
.cad-warn-banner {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem; font-weight: 500;
  background: var(--warn-bg); color: var(--warn-text);
  border-bottom: 1px solid var(--warn-border);
}
.cad-warn-dismiss {
  margin-left: auto; background: none; border: none;
  cursor: pointer; color: inherit; opacity: 0.6;
}
.cad-warn-dismiss:hover { opacity: 1; }
```

**Fehler-Overlay:**
```css
.cad-error-overlay {
  position: absolute; inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10; border-radius: inherit;
}
.cad-error-overlay-box {
  background: var(--bg-surface);
  border: 2px solid var(--err-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  max-width: 480px; width: 90%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}
.cad-error-overlay-header {
  display: flex; align-items: center; gap: 0.6rem;
  color: var(--err-text); margin-bottom: 0.75rem;
}
.cad-error-overlay-header h3 { margin: 0; font-size: 0.9rem; font-weight: 700; }
.cad-error-overlay-list {
  margin: 0 0 1rem 1.1rem; padding: 0;
  font-size: 0.8rem; color: var(--text-primary);
  display: flex; flex-direction: column; gap: 0.3rem;
}
.cad-error-overlay-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
```

Alte Regeln entfernen: `.validation-card`, `.validation-header`, `.validation-heading`, `.validation-badge`, `.validation-list`, `#cad-stage.cad-validation-error #cad-validation-box`.

### 4.3 `js/cad-module.js` – `updateValidationUI(geom)`

Die KPI/Validation-Funktion wird aufgeteilt. Der neue Teil:

```js
function updateValidationUI(geom) {
  const hasErr  = geom.checks.some(c => c.level === 'error');
  const hasWarn = geom.checks.some(c => c.level === 'warning');

  const badge    = cadElement('status-badge');
  const badgeTx  = cadElement('status-badge-text');
  const banner   = cadElement('warn-banner');
  const bannerTx = cadElement('warn-banner-text');
  const overlay  = cadElement('error-overlay');
  const ovList   = cadElement('error-overlay-list');

  badge.hidden = banner.hidden = overlay.hidden = true;

  if (hasErr) {
    ovList.innerHTML = '';
    geom.checks.filter(c => c.level !== 'ok').forEach(c => {
      const li = document.createElement('li');
      li.textContent = c.text;
      ovList.appendChild(li);
    });
    overlay.hidden = false;
  } else if (hasWarn) {
    bannerTx.textContent = geom.checks
      .filter(c => c.level === 'warning').map(w => w.text).join(' · ');
    banner.hidden = false;
  } else {
    const ok = geom.checks.find(c => c.level === 'ok');
    badgeTx.textContent = ok?.text ?? 'Alle Prüfungen bestanden';
    badge.hidden = false;
  }
}
```

**„Parameter korrigieren"-Button** – Keyword-Heuristik für Sidebar-Fokus:

```js
cadElement('error-fix-btn').addEventListener('click', () => {
  cadElement('error-overlay').hidden = true;
  const firstErr = geom.checks.find(c => c.level === 'error');
  let targetId = 'cad-param-sideClearance'; // Fallback
  if (firstErr?.text.includes('hinten'))    targetId = 'cad-param-railDepth';
  if (firstErr?.text.includes('Sackloch'))  targetId = 'cad-param-blindHoleDepth';
  const target = document.getElementById(targetId);
  if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus(); }
});
```

**„Trotzdem exportieren"- und „Warnung ausblenden"-Buttons:**
```js
cadElement('error-dismiss-btn').addEventListener('click', () => { cadElement('error-overlay').hidden = true; });
cadElement('warn-dismiss').addEventListener('click',      () => { cadElement('warn-banner').hidden = true; });
```

---

## Reihenfolge der Implementierung

```
Schritt 1  KPI-Grid entfernen                   index.html · cad-styles.css · cad-module.js
Schritt 2  BOM-Qty-Input in Sidebar             index.html · cad-module.js (buildBOMRows + getBomQty)
Schritt 3  BOM in SVG einbetten (drawBOMTable)  cad-module.js
Schritt 4  HTML-BOM-Card entfernen              index.html · cad-styles.css · cad-module.js
Schritt 5  Validation: neue HTML-Elemente       index.html
Schritt 6  Validation: neue CSS-Regeln          cad-styles.css
Schritt 7  Validation: updateValidationUI()     cad-module.js
Schritt 8  Altes validation-box entfernen       index.html · cad-styles.css
Schritt 9  npm test – Regressionsprüfung        alle Tests grün
```

> **Tipp:** Schritte 1–4 (KPI + BOM) und 5–8 (Validation) sind unabhängig und können getrennt gebaut und getestet werden.

---

## Betroffene Dateien

| Datei | Art der Änderung |
|-------|-----------------|
| `index.html` | KPI-Section löschen; BOM-Card löschen; Qty-Input hinzufügen; Badge/Banner/Overlay hinzufügen; alten `validation-box` löschen |
| `css/cad-styles.css` | KPI-Regeln löschen; BOM-Table-Regeln löschen; Badge/Banner/Overlay-Regeln hinzufügen; alte Validation-Regeln löschen |
| `js/cad-module.js` | KPI-DOM-Schreibzugriffe löschen; `buildBOMRows()` + `drawBOMTable()` hinzufügen; `render()` BOM-Parameter; `getBomQty()`; `updateValidationUI()` ersetzen; Button-Listener |
| `js/cadPdfExport.js` | **Keine Änderung** – BOM ist jetzt Teil der SVG |

---

## Offene Designfragen (vor Umsetzung klären)

1. **`titleBlockH` Höhe:** Reichen 74 SVG-Einheiten für 7 BOM-Zeilen leserlich? Oder auf ~90 erhöhen?
2. **„Parameter korrigieren"-Button:** Keyword-Heuristik ausreichend, oder soll jede `check`-Meldung einen expliziten `paramKey` tragen?
3. **Warn-Banner bei neuem `triggerUpdate()`:** Banner soll bei aktiver Warnung automatisch wieder erscheinen (kein persistentes Ausblenden) – so gewünscht?
