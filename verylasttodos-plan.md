# Finaler Implementierungsplan: `verylasttodos.md`

Alle Punkte aus [verylasttodos.md](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/verylasttodos.md) sowie die finalen Entscheidungen sind hier als verbindlicher Umsetzungsplan zusammengefasst.

> [!NOTE]
> Alle Änderungen berücksichtigen die Vorgaben aus `AGENTS.md`: Zero-Build (`file://`-kompatibel), keine neuen Abhängigkeiten, bestehende DOM-IDs/State-Keys nach Möglichkeit rückwärtskompatibel halten, damit ältere JSON-Presets und die Test-Suite weiterhin funktionieren.

---

### 1. Header (`index.html`, `css/app.css`, `js/app.js`)
- **HomeLink im Logo (Option A1 – Klassischer Reload):**
  - `.header-brand` in `index.html` von `<div class="header-brand">` auf `<a href="index.html" class="header-brand">` umstellen, sodass ein Klick die Seite sauber neu lädt und URL-Parameter (`?s=...`) verwirft.
  - In `css/app.css` `text-decoration: none; color: inherit;` für `a.header-brand` ergänzen.
- **Mode-Buttons anpassen:**
  - In `index.html` (`#btn-mode-calendar`, `#btn-mode-cad`):
    - `<i class="fa-solid ...">` Icons entfernen.
    - Texte ändern zu `Kalender` und `Konstruktion` (auch `aria-label` entsprechend anpassen).
  - In `css/app.css`:
    - `.mode-switch-button` auf `justify-content: flex-start; text-align: left;` umstellen.
    - In der `@media`-Regel für schmale Viewports (ca. Zeile 957) sicherstellen, dass `.mode-switch-button span` sichtbar bleibt, da keine Icons mehr vorhanden sind.
- **Teilen-Button im Header (rechts neben Export):**
  - Rechts neben `.header-export-slot` einen kompakten Share-Button (`<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>`) einbauen.
  - Klick kopiert den aktuellen Konfigurations-Link (`CronoShare.createCurrentUrl(state)` / `#btn-copy-next-year-link`-Logik) in die Zwischenablage und zeigt eine kurze Status-Rückmeldung (Tooltip/Toast).

### 2. Tabheader / Tabbar (`index.html`, `js/app.js`)
- **4 Tabs mit Ein-Wort-Beschriftungen ohne Icons:**
  1. `#tab-button-geometry`: `Format`
  2. `#tab-button-style`: `Design`
  3. `#tab-button-holidays`: `Einträge`
  4. `#tab-button-presets` *(neu, an 4. Stelle)*: `Vorlagen`
- Alle `<i class="fa-solid ...">` Icons in den Tab-Buttons entfernen.
- Tab-Umschaltung & Tastaturnavigation in `js/app.js` (`.tab-btn` / `tab-presets`) auf die 4 Tabs erweitern.

### 3. Tabs allgemein (`css/app.css`, `css/cad-styles.css`)
- **Accordion-`<summary>` (Pfeil rechts, etwas größer, Text links):**
  - `.sidebar-accordion-summary` in `css/app.css`:
    - Pfeil von `::before` auf `::after` verschieben (oder per Flexbox `order: 2; margin-left: auto;` nach rechts setzen), sodass der Titel immer linksbündig beginnt.
    - Pfeilgröße vergrößern (z. B. `font-size: 0.95rem;` statt `0.72rem`).
    - Neben dem Titel stehende Elemente (`.cs-info-tip`, `#year-range-display`) links vom Pfeil platzieren.
- **Scrollbar in der Seitenleiste unsichtbar machen:**
  - `.calendar-tabpanels` (und analog die CAD-Sidebar) mit:
    ```css
    scrollbar-width: none;
    -ms-overflow-style: none;
    ```
    sowie `::-webkit-scrollbar { display: none; }` versehen.

### 4. Tab 1: Format (`index.html`, `js/app.js`, `js/geometry.js`)
- **Vorlauf & Nachlauf ohne Inhalts-Dropdowns:**
  - `#select-puffer-left-content` und `#select-puffer-right-content` aus `index.html` entfernen.
  - In `js/app.js` bleiben `pufferLeftContent: 'blank'` und `pufferRightContent: 'blank'` als Standard.
- **Wickelzugabe entfernen:**
  - UI-Felder `#input-winding-allowance-left` und `#input-winding-allowance-right` aus `index.html` entfernen (in `js/geometry.js` wird `windingAllowance` nur auf `pufferLeftMm`/`pufferRightMm` addiert und ist somit redundant).
  - In `js/app.js` und `js/geometry.js` `windingAllowanceLeftMm` / `windingAllowanceRightMm` intern mit Default `0` für Preset-/Test-Kompatibilität beibehalten.
- **QR-Code in die „Vor- & Nachlauf“-Box verschieben:**
  - `#checkbox-show-qr`, `#input-qr-gap` und `#qr-status` aus `QR-Code & Plotter-Ausgabe` in das `<details>`-Element `Vor- & Nachlauf` verschieben.
- **Schnittmarken in die erste Box unter „Papiergrammatur“ verschieben:**
  - `#checkbox-show-cropmarks` und `#select-crop-mark-style` in das erste `<details>`-Element (`Zeitraum & Sichtfenster`) direkt unter `#input-paper-grammage` verschieben.
  - Das nun leere `<details>`-Element `QR-Code & Plotter-Ausgabe` entfernen.

### 5. Tab 2: Design (`index.html`, `css/app.css`, `js/app.js`)
- **Bezeichnung ändern:**
  - `#theme-heading` in `index.html`: `Farb-Theme` → `Theme`.
- **Darstellung & Theme (einzeilige scrollbare Liste, keine Dropdowns, keine Kreise):**
  - `<select id="select-design-style">` und `<select id="select-theme">` entfernen und die Auswahl-Optionen direkt in `js/app.js` verwalten.
  - `.choice-grid` (`#design-options`, `#theme-options`) in `css/app.css` von 2-Spalten-Grid auf eine **einzeilige, horizontal scrollbare Flex-Liste** umbauen (`display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 0.5rem; scrollbar-width: none;`) mit fester/minimaler Kartenbreite (z. B. `flex: 0 0 9.5rem;`), sodass Name und Beschreibung erhalten bleiben.
  - In `js/app.js` (`renderThemeOptions()`) die Erzeugung von `.theme-swatches` / `.theme-swatch` entfernen.
- **Rahmenlinie entfernen:**
  - `#input-line-border` („Rahmenlinie“) aus `index.html` entfernen; `state.lineBorder` intern als Fallback für Presets und Exporte beibehalten.
- **Wochenenden & Werktage optisch an Ereigniskategorien anpassen:**
  - Die Farbauswahl für `#color-saturday-bg`, `#color-saturday-text`, `#color-sunday-bg`, `#color-sunday-text` und `#color-text` auf das `.category-color-list` / `.category-color-row`-Layout umstellen.
- **Ereigniskategorien-Farben (Option B2 – Synchronisiert):**
  - Die 3 Farbreihen (`Feiertage`, `Ferien`, `Eigene Termine`) bleiben im **Design-Tab** und werden bidirektional mit den gespiegelten Eingabefeldern im **Einträge-Tab** synchronisiert.

### 6. Tab 3: Einträge (`index.html`, `js/app.js`)
- **Vorlagen & Teilen-Link entfernen:**
  - Die Accordion-Box `Vorlagen & Teilen-Link` aus diesem Tab entfernen (Vorlagen wandern in Tab 4, Teilen-Link in den Header).
- **Kategoriefarben zusätzlich hier einbinden (Option B2):**
  - Eine kompakte Box (z. B. `Farben für Ereigniskategorien`) für `Feiertage`, `Ferien` und `Eigene Termine` ergänzen.
  - Änderungen aktualisieren `state.categoryColors` und synchronisieren automatisch die entsprechenden Color-Picker im **Design-Tab** (und umgekehrt).
- Verbleibende Bereiche im Tab: *Feiertage, Ferien & .ics*, *Terminsuche & Liste*, *Kategoriefarben*.

### 7. Tab 4: Vorlagen (`index.html`, `js/app.js`)
- **Neuer Tab-Panel `#tab-presets`:**
  - **Vorlage lokal speichern:** `#input-preset-name` und `#btn-save-preset`.
  - **Lokal gespeicherte Vorlagen:** `#presets-list`.
  - **Integrierte Vorlagen:** `#built-in-presets-list`.
