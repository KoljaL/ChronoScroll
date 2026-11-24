Analyzed WORKFLOW_PLAN.md:L1-168
Ran search sidebar and tab structure in index.html
Ran check index.html line count and CSS files
Ran locate sidebar and form elements in index.html
Analyzed index.html:L140-450
Analyzed index.html:L451-745
Ran find where CAD parameter groups are rendered · Exited with code 1
Ran search input and tab styles in CSS files
Ran list js/ files and search CAD parameter groups · Exited with code 1
Analyzed cad-styles.css:L1-120
Analyzed app.css:L1200-1265
Ran find CAD parameter groups in cad-module.js
Ran count interactive element IDs in index.html
Analyzed cad-module.js:L25-80
Analyzed cad-module.js:L980-1075
Analyzed app.css:L380-470
Ran extract all IDs in both sidebars
Ran check interactive state selectors in CSS

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-4-hydrogen-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-4-hydrogen-medium on the server (Error ID: 1f416db4-4aef-4da8-bd52-0f223fe50518-28-2010)

Hier ist die Analyse und das Reorganisationskonzept für **Phase 2** (ohne Code-Änderungen; alle bestehenden `id`-, `name`- und `data-*`-Attribute bleiben 1:1 erhalten).

---

### 1. Tab- & Workflow-Analyse

#### Kalender-Editor (`#app-sidebar`)
Die aktuelle 5-Tab-Struktur (**Maße**, **Struktur**, **Style**, **Termine**, **Vorlagen**) führt zu häufigen, unergonomischen Kontextwechseln:
* **Zerrissene Plot- & Druckeinstellungen:** Schnitt-/Passermarken (`#checkbox-show-cropmarks`) liegen in *Struktur*, Druckfarben-Optimierung (`#btn-analyze-coverage`) in *Style* und QR-Code-Optionen (`#checkbox-show-qr`, `#input-qr-gap`) in *Maße*, obwohl alle drei die **Ausgabe/Produktion** betreffen.
* **Papier & Linien vs. Struktur:** Monatsabstände (`#checkbox-month-separator`, `#input-month-separator-width`, `#color-month-separator`) liegen in *Struktur*, während Papierfarbe (`#color-paper`), Rasterlinien (`#input-line-grid`, `#color-grid`) und Rahmenlinien (`#input-line-border`) in *Style* liegen. Nutzer, die Abstände und Linien aufeinander abstimmen, müssen ständig zwischen beiden Tabs wechseln.
* **Monatskopf-Fragmentierung:** Beschriftung (`#select-header-style`), Ausrichtung (`#select-header-align`), Textfarbe (`#input-month-header-text-color`) und Textgröße (`#input-month-header-text-size`) sind in *Struktur*, der globale Skalierungsfaktor `#input-font-header-scale` hingegen in *Style* (Typografie).
* **Langes Scrollen innerhalb von *Style*:** *Style* vereint 5 schwere Blöcke (Darstellung, Farben/Themes, Druckfarben sparen, Typografie, Papier & Linien, Tages-/Ereignisfarben) ohne Einklappmöglichkeit.
* **Vorlagen-Tab isoliert:** *Vorlagen* (`#tab-presets`) wird meist am Anfang (Vorlage laden) oder am Ende (speichern/teilen) genutzt, blockiert aber dauerhaft einen der 5 Haupt-Tabs.

#### CAD-Konstruktion (`#cad-sidebar`)
Die CAD-Sidebar verzichtet auf Tabs und stapelt 4 statische `<section class="card">`-Blöcke plus `#cad-parameter-groups-container` (5 dynamische Gruppen aus `ParameterStore.SCHEMA` in [cad-module.js](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/js/cad-module.js#L28-L72)):
* **Ungünstige Reihenfolge für den Konstruktions-Workflow:** Ganz oben stehen *Modellverwaltung*, *DIN-Schriftfeld* und *Zeichnungs-Layer*. Die eigentlichen **Konstruktionsparameter** (`#cad-parameter-groups-container`) und der Sync-Status (`#cad-sync-card`) stehen ganz unten — man muss bei jedem Aufruf erst an Meta-Feldern vorbeiscrollen.
* **Redundante/getrennte Papier- & Fenstermaße:** `windowWidth`, `windowHeight` und `paperLength` sind zwar über `#cad-sync-card` (`readOnly`) an den Kalender gekoppelt, stehen aber verteilt in Gruppe 1 und Gruppe 2 statt direkt als kompakter „Kalender-Sync“-Kopf über den Holzrahmen-Maßen.
* **Fehlende Einklappbarkeit:** Alle 18 Parameter (inkl. 15 Range-Slidern) sind permanent ausgeklappt.

#### Logisch zusammengehörige Parameter
1. **Basis & Papierbahn:** Zieljahr, Kalendername, Sichtfenster (`B × H`), linker/rechter Puffer + Pufferinhalte.
2. **Aufbau & Typografie:** Spaltenlayout (1-/2-spaltig), Monatskopf (Stil, Ausrichtung, Größe, Farbe), Trennstreifen, Schriftfamilie/TTF/Skalierung, Kalenderinfos (KW, Mondphasen).
3. **Design & Farben:** Design-Preset, Farb-Theme, Papier/Raster/Rahmen, Wochenend- & Kategoriefarben, Druckfarben-Spar-Tipps.
4. **Termine & Feiertage:** Land/Bundesland, Ferien-Toggle, `.ics` Import/Export, Suche/Filter/Liste.
5. **Produktion & Vorlagen (oder Header/Footer):** QR-Code, Schnittmarken, Vorlagen & Teilen-Link.

---

### 2. Layout- & Akkordeon-Vorschlag

#### Kalender-Editor: 3 Haupt-Tabs + kompakte Akkordeons (`<details>`)
Reduktion der 5 Tabs auf **3 workflow-orientierte Hauptbereiche** (Tab-Leiste passt ohne horizontales Scrollen), ergänzt um ein **fixiertes Ergebnis-Banner** für abgeleitete Maße:

* **Fixierter Sticky-Header in der Sidebar (immer sichtbar):**
  * Kompakte 3-Spalten-Leiste für abgeleitete Werte: `Monatsbreite` (`#calc-b-month`), `Tageshöhe` (`#calc-h-day`) und `Gesamtlänge` (`#calc-l-total`). So sieht der Nutzer beim Ändern von Sichtfenster, Puffern *und* 1-/2-Spalten-Layout sofort die Auswirkung, ohne nach unten scrollen oder den Tab wechseln zu müssen.
* **Tab 1: `Aufbau` (Format, Struktur & Produktion)**
  1. *Basis & Sichtfenster* (offen): `#input-year` (inkl. `#year-range-display`), `#input-custom-title`, `#input-h-visible`, `#input-b-visible`.
  2. *Vor- & Nachlauf* (offen): `#input-puffer-left`, `#input-puffer-right`, `#select-puffer-left-content`, `#select-puffer-right-content`.
  3. *Monate & Raster* (Akkordeon): `#select-month-layout`, `#select-header-style`, `#select-header-align`, `#checkbox-month-separator`, `#input-month-separator-width`, `#color-month-separator`, `#checkbox-month-separator-header`.
  4. *Extras & Plotter* (Akkordeon): `#checkbox-show-kw`, `#checkbox-show-moon`, `#input-moon-opacity`, `#checkbox-show-qr`, `#input-qr-gap`, `#checkbox-show-cropmarks`.
* **Tab 2: `Design` (Stil, Typo & Farben)**
  1. *Stil & Farbpalette* (offen): `#select-design-style` + `#design-options`, `#select-theme` + `#theme-options`.
  2. *Typografie & Monatskopf* (Akkordeon): `#select-font-family`, `#input-font-file`, `#input-font-header-scale`, `#input-font-day-scale`, `#input-month-header-text-size`, `#input-month-header-text-color`, `#input-calendar-week-text-size`, `#input-calendar-week-text-color`.
  3. *Papier, Linien & Tagesfarben* (Akkordeon): `#color-paper`, `#color-grid`, `#input-line-grid`, `#input-line-border`, Wochenend-Farben, `#color-text`, Kategoriefarben.
  4. *Druckfarben sparen* (Akkordeon): `#btn-analyze-coverage` + `#coverage-recommendations`.
* **Tab 3: `Termine & Vorlagen`** (oder getrennt als 4. Tab `Vorlagen`, falls Vorlagen sehr häufig gewechselt werden)
  * *Regionale Feiertage & Ferien*, *.ics Import/Export*, *Terminsuche & Liste*, *Vorlagen & Teilen-Link*.

#### CAD-Konstruktion (`#cad-sidebar`): Priorisierte Akkordeon-Sektionen
1. **Sticky Sync- & Ergebnis-Kopf:** `#cad-sync-card` (Status + `#cad-relink-calendar`) sowie kompakte Vorschau der abgeleiteten Hauptmaße (z. B. Außenmaße `B × H` und Achsabstand, gespiegelt aus den KPI-Werten `#cad-kpi-outer-dims` / `#cad-kpi-axis-distance`), damit Änderungen an Leistenüberstand oder Rückwandzuschlag direkt in der Sidebar sichtbar bleiben.
2. **Konstruktionsparameter (`<details>` je Gruppe):**
   * *1. Sichtfenster & Rückwand* + *2. Papierbahn* (Standard: offen)
   * *3. Wickelstäbe & Positionierung*, *4. Leisten & Sackloch-Lagerung*, *5. Lager, Bremse & Rändelmutter* (Standard: eingeklappt, per Klick aufklappbar).
3. **Darstellung & Schriftfeld (`<details>`, Standard: eingeklappt):** *Zeichnungs-Layer* und *DIN-Schriftfeld*.
4. **Modellverwaltung & JSON (`<details>`, Standard: eingeklappt):** *Presets & JSON Import/Export*.

---

### 3. Erklärungstexte, Labels & Einheiten

Lange Hilfetexte blähen die Sidebar auf. Sie lassen sich durch **Kurzlabels + feste Einheiten-Badges + optionale Info-Tooltips (`?`-Button/Icon mit `title` oder `aria-describedby`-Popover)** ersetzen:

| Bereich | Aktueller langer Text / Label | Vorschlag (Kurzlabel + Einheit + Tooltip) |
|---|---|---|
| Zieljahr | „14 Monate (Dezember Vorjahr bis Januar Folgejahr).“ | Badge `#year-range-display` reicht; Tooltip am Label: *„Umfasst 14 Monate inkl. Vor-/Nachlaufmonat“*. |
| Spaltenlayout | „Einspaltig zeigt alle Tage untereinander; zweispaltig verteilt Tage 1–15 und 16–31. Die Maße des Sichtfensters bleiben gleich.“ | Label: **Spalten je Monat** · Info-Icon `?` mit Erklärung der 1–15 / 16–31 Aufteilung. |
| Monatsabstände | „Einstellungen gelten getrennt für das gewählte Tageslisten-Layout. Die Deckkraft bestimmt die Transparenz des Streifens.“ | Label: **Trennstreifen** · Einheit `mm` im Input · Tooltip für Layout-Trennung & Deckkraft. |
| KW & Schnittmarken | „Kalenderwochen (KW nach DIN ISO 8601 an Montagen)“ / „Schnitt- & Passermarken (Crop Marks für Rollenplotter)“ | Kurzlabels: **Kalenderwochen (ISO 8601)** / **Schnitt- & Passermarken** + Tooltip für Details. |
| Darstellung & Farben | Zwei 2-zeilige `<p>`-Absätze unter `#design-style-heading` und `#theme-heading` | Entfernen bzw. in kompakten Tooltip an der Sektionsüberschrift verschieben. |
| Druckfarben sparen | 2-zeiliger Disclaimer unter `#btn-analyze-coverage` | Als kompakter Hinweis (`text-[11px]`) erst im Ergebnisbereich `#coverage-recommendations` anzeigen. |
| Eigene Schrift | „Die Schrift wird nur lokal verarbeitet und in die PDF eingebettet. Eine TTF-Datei wird für alle Schriftschnitte verwendet.“ | Statuszeile `#font-file-status` initial auf **„Lokal (.ttf) · keine Datei gewählt“** kürzen; Details per Tooltip. |
| Termine verwalten | 2-zeiliger Einleitungstext | Überflüssig, da Controls selbsterklärend; lediglich Hinweis zu Ferien in Tooltip an `#checkbox-show-vacations`. |
| Vorlagen / Teilen | „Der Link überträgt Einstellungen, aber keine eigenen oder importierten Termine. Eigene Schriften müssen erneut geladen werden.“ | Kompaktes Info-Icon neben „Einstellungen teilen“; Statusmeldung `#next-year-link-status` bei Kopieren nutzen. |
| CAD-Parameter | `Papierstärke (80 g/m² ≈ 0.10)` | Kurzlabel **Papierstärke** (`mm`), Richtwert `80 g/m² ≈ 0,10 mm` in Tooltip/Subtext (in Phase 3 ggf. direkt mit Grammatur-Feld). |

**Einheiten-Standardisierung:** Alle numerischen Felder erhalten ein einheitliches rechtsbündiges Einheiten-Suffix im Input-Container (`cm`, `mm`, `×` für Faktoren, `0–1` oder `%` für Deckkraft), statt Einheiten mal im Label (`(mm)`), mal als Overlay-`<span>` (`cm`) und mal gar nicht anzugeben.

---

### 4. Input-Elemente, Zustände & Barrierefreiheit

#### Ist-Analyse (Inkonsistenzen in [index.html](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/index.html), [app.css](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/css/app.css) & [cad-styles.css](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/css/cad-styles.css))
1. **Unterschiedliche Tailwind-Klassen im Kalender-Editor:**
   * `#input-h-visible` hat `focus:outline-none border-slate-700` (kein `focus:border-amber-500`), während `#input-b-visible` und `#input-year` `focus:border-amber-500` haben.
   * Rundung und Padding variieren: `rounded-lg px-3 py-2 text-sm` (`#input-year`), `rounded-lg pl-3 pr-8 py-1.5 text-sm` (`#input-b-visible`), `rounded px-2 py-1 text-xs` (`#input-month-header-text-size`), `rounded-lg px-2.5 py-1 text-xs` (`#input-line-grid`).
   * Color-Picker variieren zwischen nativen `w-7 h-7` / `w-8 h-8` und `.category-color-row input[type='color']` (die per JS teilweise durch `.cronoscroll-color-picker` ersetzt werden).
2. **Fehlende Zustände (`hover`, `disabled`, `active`):**
   * In `app.css` existiert für Sidebar-Inputs nur `:focus-visible` (Zeile 1247), aber **kein** `:hover`, `:disabled` (z. B. bei deaktiviertem `#checkbox-month-separator` oder `#checkbox-show-qr`) und `:active`.
   * In `cad-styles.css` (Zeilen 20–48) haben `input[type="text"]`, `input[type="number"]` und `select` zwar `:focus`, aber **kein** `:hover`, `:focus-visible` oder `:disabled` (nur `.cad-physical-input:read-only` ist definiert).
3. **Barrierefreiheit (`aria-label` & Verknüpfungen):**
   * Einige Checkboxen/Inputs haben ein umschließendes `<label>` ohne `for` (z. B. `#checkbox-show-kw`, `#checkbox-show-moon`, `#checkbox-show-cropmarks`, CAD-Checkboxen) – funktioniert zwar, explizites `for` + `id` ist aber robuster.
   * `#input-ics-file` und `#cad-json-file-input` sind versteckte File-Inputs ohne `aria-label`.
   * `#cad-parameter-groups-container` setzt bei `rangeInput` `aria-label`, bei `numInput` ein `<label for="cad-input-num-...">`; für Screenreader sollte `rangeInput` zusätzlich `aria-label="${item.label} (Schieberegler)"` tragen, damit beide Controls unterscheidbar sind.

#### Vorschlag für einheitliches Input-Design (Kalender + CAD)
* Einführung gemeinsamer CSS-Klassen (z. B. `.cs-input`, `.cs-select`, `.cs-input-group`, `.cs-unit`, `.cs-checkbox`) auf Basis der bereits vorhandenen CSS-Variablen (`--bg-surface`, `--border-medium`, `--border-strong`, `--accent`, `--text-primary`, `--radius-sm`):
  * **Default:** `1px solid var(--border-medium)`, `border-radius: var(--radius-sm)`, einheitliche Höhe (`32px` / `2rem`), `font-mono` für Zahlenwerte mit `text-align: right` bei Suffix-Einheit.
  * **Hover:** `border-color: var(--border-strong);`
  * **Focus / Focus-Visible:** `border-color: var(--accent); outline: 2px solid var(--accent); outline-offset: 1px;` (oder `box-shadow: 0 0 0 3px var(--accent-soft);`).
  * **Active (Buttons/Slider-Thumb):** leichtes Abdunkeln/Skalieren (`transform: scale(0.98)` bei Buttons).
  * **Disabled / Read-Only:** `opacity: 0.55; cursor: not-allowed; background: var(--bg-subtle);` (abhängige Felder wie `#input-qr-gap` oder `#input-month-separator-width` sollten bei deaktivierter Checkbox visuell und per `disabled` gesperrt werden).

---

### 5. 1:1 Input-ID-Mapping-Checkliste (Phase 2 DoD)

Alle bestehenden IDs in [index.html](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/index.html#L141-L740) und [cad-module.js](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/js/cad-module.js#L28-L72) müssen bei der Umsetzung in Phase 4 unverändert bleiben:

* **Tabs & Container:** `tab-button-geometry`, `tab-button-layout`, `tab-button-style`, `tab-button-holidays`, `tab-button-presets`, `tab-geometry`, `tab-layout`, `tab-style`, `tab-holidays`, `tab-presets` *(bei Reduktion auf 3 Tabs müssen Event-Listener/Tests in `app.js` bzw. `tests/` auf die neuen Tab-IDs oder ein kompatibles Mapping geprüft werden!)*.
* **Maße & Puffer:** `input-year`, `year-range-display`, `input-custom-title`, `input-h-visible`, `input-b-visible`, `input-puffer-left`, `input-puffer-right`, `select-puffer-left-content`, `select-puffer-right-content`, `checkbox-show-qr`, `input-qr-gap`, `qr-status`, `calc-b-month`, `calc-h-day`, `calc-l-total`.
* **Struktur & Monatskopf:** `select-header-style`, `select-header-align`, `input-month-header-text-color`, `input-month-header-text-size`, `select-month-layout`, `checkbox-month-separator`, `input-month-separator-width`, `month-separator-width-error`, `color-month-separator`, `checkbox-month-separator-header`, `checkbox-show-kw`, `input-calendar-week-text-color`, `input-calendar-week-text-size`, `checkbox-show-moon`, `input-moon-opacity`, `checkbox-show-cropmarks`.
* **Style & Farben:** `select-design-style`, `design-options`, `select-theme`, `theme-options`, `btn-analyze-coverage`, `coverage-recommendations`, `select-font-family`, `option-custom-font`, `input-font-file`, `font-file-status`, `input-font-header-scale`, `input-font-day-scale`, `color-paper`, `input-line-grid`, `input-line-border`, `color-grid`, `color-saturday-bg`, `color-saturday-text`, `color-sunday-bg`, `color-sunday-text`, `color-text`, `color-category-public`, `color-category-vacation`, `color-category-custom`.
* **Termine:** `select-country`, `select-bundesland`, `checkbox-show-vacations`, `btn-load-feiertage`, `input-ics-file`, `btn-import-ics`, `btn-export-ics`, `input-holiday-search`, `btn-add-holiday`, `holiday-list` *(plus `.btn-filter-holiday[data-filter]`)*.
* **Vorlagen:** `next-year-link`, `btn-copy-next-year-link`, `next-year-link-status`, `input-preset-name`, `btn-save-preset`, `built-in-presets-list`, `presets-list`.
* **CAD-Sidebar:** `cad-preset-select`, `cad-btn-load-preset`, `cad-preset-name-input`, `cad-btn-save-preset`, `cad-btn-reset-defaults`, `cad-btn-delete-preset`, `cad-btn-export-json`, `cad-btn-import-json`, `cad-json-file-input`, `cad-tb-title-input`, `cad-tb-material-input`, `cad-tb-dwg-input`, `cad-tb-author-input`, `cad-chk-show-maxroll`, `cad-chk-show-centerlines`, `cad-chk-show-section`, `cad-chk-calendar-preview`, `cad-sync-card`, `cad-sync-status`, `cad-relink-calendar`, `cad-parameter-groups-container` (inkl. aller 18 dynamischen `cad-input-num-<key>` und 15 `cad-input-range-<key>`).

---

**Nächster Schritt:** Sobald du diese Gliederung freigibst (oder Anpassungen z. B. bei 3 vs. 4 Kalender-Tabs wünschst), können wir mit **Phase 3** (Spezifikation der neuen Parameter & Fallback-Defaults) fortfahren.