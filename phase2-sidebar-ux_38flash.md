Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-1-2010)

Analyzed WORKFLOW_PLAN.md:L30-100
Ran inspect sidebar structure in index.html
Analyzed index.html:L140-500
Analyzed index.html:L501-850
Ran find cad parameter groups container usage · Exited with code 1

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-12-2010)

Error: API error (attempt 2): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-13-2010)

Ran list files in js directory
Ran check cad-parameter in cad-module.js · Exited with code 1
Ran grep cad- in cad-module.js
Analyzed cad-module.js:L950-1060
Analyzed cad-module.js:L20-120
Ran list CSS files
Ran inspect input/button rules in app.css
Analyzed app.css:L1230-1313
Analyzed cad-styles.css:L1-150
Ran run npm test to check test suite · Exited with code 1

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-39-2010)

Error: API error (attempt 2): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-40-2010)

Error: API error (attempt 3): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-41-2010)

Error: API error (attempt 4): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-42-2010)

Error: API error (attempt 5): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-43-2010)

Ran extract all IDs from Calendar and CAD sidebars

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-47-2010)

Ran verify Calendar IDs in app.js

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-50-2010)

Ran inspect tab button switching in app.js · Exited with code 1
Ran find tab handlers in app.js
Analyzed app.js:L1290-1340

Error: API error (attempt 1): transport error (Unavailable, HTTP 503): No capacity available for model gemini-3.8-flash-medium on the server: UNAVAILABLE (code 503): No capacity available for model gemini-3.8-flash-medium on the server (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-59-2010)

Error: API error (attempt 2): stream reading error: read tcp 192.168.178.157:58861->172.217.115.4:443: read: connection reset by peer (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-61)

Error: API error (attempt 3): stream reading error: read tcp [2001:9e8:5fce:9b00:8411:c688:436c:f733]:58885->[2001:4860:4840:400::]:443: read: connection reset by peer (Error ID: 3f7ac455-2509-48cf-9248-62789c61722a-63)

Ran search tab- in tests/

Hier ist die detaillierte Analyse und Konzeptionierung für **Phase 2** (UI- & Sidebar-Analyse & Reorganisation) gemäß dem `@WORKFLOW_PLAN.md` und den ChronoScroll-Entwicklerrichtlinien.

> [!IMPORTANT]
> **Zero-Regression-Garantie:** In diesem Schritt wurde **kein Code verändert**. Alle 85 bestehenden DOM-IDs der Kalender-Sidebar, die 22 IDs der CAD-Sidebar sowie die dynamisch generierten Schema-IDs bleiben zu 100 % erhalten, sodass bestehende JavaScript-Bindings, Unit-Tests (`tests/layoutSettings.test.js` etc.) und JSON-Presets uneingeschränkt weiterlaufen.

---

### Kurzer 5-Punkte-Plan für die geplante Umsetzung (AGENTS.md-Regel)
1. **Ergonomische Gruppierung:** Gruppierung von zusammengehörigen Parametern (z. B. Monatslayout + Textgrößen + Typografie) mittels semantischer Akkordeon-Sektionen (`<details>/<summary>`), ohne die Test-relevanten Tab-Container aufzulösen.
2. **Globaler Live-Inspector:** Herauslösen der automatischen Geometrieberechnung (`calc-b-month`, `calc-h-day`, `calc-l-total`) aus dem "Maße"-Tab in ein dauerhaft sichtbares Sticky-Footer/Header-Dashboard der Sidebar.
3. **Kompakte Labels & Tooltips:** Ersetzen ausufernder Fließtexte durch präzise Micro-Labels mit Einheiten-Tags (`[cm]`, `[mm]`) und unaufdringliche Infotips (`data-tooltip`).
4. **Design-Token-Harmonisierung:** Angleichung der Tailwind-Utility-Klassen im Kalender an das professionelle Bauhaus-CAD-Designsystem (`--bg-surface`, `--border-medium`, einheitliche Höhen und Fokusringe).
5. **A11y- und State-Spezifikation:** Lückenlose Ausstattung aller Formularelemente mit korrekten `aria-label`, `for`-Attributen und definierten Hover-, Focus-, Disabled- und Active-Zuständen.

---

## 1. Tab- & Workflow-Analyse

### 1.1 Aktuelle Schwachstellen & unergonomische Brüche
1. **Diskrepanz zwischen Kalender- und CAD-Konstruktion:**
   - Ein Rollenkalender ist ein physisches Gesamtprodukt aus Papierbahn und Holzrahmen. Aktuell sind Kernmaße (Sichtfensterhöhe `input-h-visible`, Breite `input-b-visible`, Pufferlängen) im Tab *Maße* untergebracht. Die Auswirkung auf die Leistenfräsung, den Rollendurchmesser $D_{\text{max}}$ oder die Materialzugaben sieht der Nutzer jedoch erst nach einem Modus-Wechsel in die CAD-Ansicht.
2. **Der „Reißverschluss-Effekt“ zwischen Tab 2 (*Struktur*) und Tab 3 (*Style*):**
   - **Monatskopf:** Schriftfarbe (`input-month-header-text-color`) und Textgröße (`input-month-header-text-size`) liegen im Tab *Struktur*. Die Schriftart (`select-font-family`) und die Skalierung (`input-font-header-scale`) liegen jedoch in Tab *Style*. Wer den Kopf gestaltet, muss zwingend zwischen Tab 2 und 3 hin- und herspringen.
   - **Kalenderwochen (KW):** Aktivierung, Farbe und Textgröße liegen in *Struktur*, während alle anderen Linien-, Datums- und Typografie-Optionen in *Style* liegen.
   - **Layout vs. Geometrie:** Die Wahl zwischen 1-spaltig und 2-spaltig (`select-month-layout`) liegt in *Struktur*, halbiert jedoch effektiv die Tageshöhe $h_{\text{Tag}}$ bzw. verdoppelt den sichtbaren Zeitraum. Die Geometrie-Ergebnisse (`calc-h-day`) liegen aber in Tab *Maße*.
3. **Termin- und Feiertagsverwaltung (Tab 3 vs. Tab 4):**
   - In Tab 3 (*Style*) wählt man die Kategoriefarben für Feiertage, Ferien und eigene Termine (`color-category-public`, `color-category-vacation`, `color-category-custom`).
   - In Tab 4 (*Termine*) schaltet man Feiertage frei, importiert `.ics`-Dateien und filtert Termine. Bei der farblichen Kennzeichnung neuer Termine muss der Tab gewechselt werden.
4. **Versteckte Geometrie-Ergebnisse:**
   - Der Infoblock `calc-b-month`, `calc-h-day` und `calc-l-total` ist am Ende von Tab *Maße* platziert. Sobald der Nutzer Schriften vergrößert, Trennlinien einfügt oder Termine pflegt, sieht er die resultierende Rollenlänge nicht mehr.
5. **CAD-Sidebar als „vertikale Wüste“:**
   - Während der Kalender 5 horizontal gedrängte Tabs besitzt, hat die CAD-Sidebar gar keine Tabs, sondern scrollt unendlich nach unten durch 5 statische Parameter-Gruppen mit 18 Range-Slidern, die den Viewport überfordern.

---

## 2. Layout- & Akkordeon-Vorschlag

### 2.1 Kalender-Editor: Schlanke 3-Zonen-Struktur bei 100 % Tab-Abwärtskompatibilität
Um `tests/layoutSettings.test.js` und URL-Parameter wie `?tab=geometry` nicht zu brechen, behalten wir die Container-IDs (`tab-geometry`, `tab-layout`, `tab-style`, `tab-holidays`, `tab-presets`) bei, organisieren die Inhalte jedoch in logischen, kollabierbaren Sektionen (Standard-HTML5 `<details open>` / `<summary>` mit flüssigen CSS-Transitions):

```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR-HEADER: [Kalender-Editor | 2D-CAD]            │
├────────────────────────────────────────────────────────┤
│  STICKY TOP: 3 HAUPT-WORKFLOWS (oder 5 abwärtskompatible Tabs)
│  [ 1. Basis & Maße ]  [ 2. Design & Typo ]  [ 3. Termine & Export ]
├────────────────────────────────────────────────────────┤
│  SCROLL-BEREICH (mit vertikalen Akkordeons):            │
│                                                        │
│  ▼ 1. Sichtfenster & Rolle                             │
│     • Jahr & Kalendername                              │
│     • Höhe × Breite (cm)                               │
│     • Vorlauf & Nachlauf (cm) + Inhalt-Selects         │
│     • QR-Code & Puffer-Reserve                         │
│                                                        │
│  ▶ 2. Raster & Spaltenaufteilung                       │
│     • 1-spaltig / 2-spaltig                            │
│     • Monats-Trennlinien & Kopffortsetzung             │
│     • KW (DIN ISO 8601), Mondphasen, Schnittmarken     │
│                                                        │
│  ▶ 3. Typografie & Monatskopf                          │
│     • Schriftfamilie & TTF-Upload                      │
│     • Header-Stil, Ausrichtung, Farbe & Skalierung     │
│     • Tageszeilen-Skalierung                           │
│                                                        │
│  ▶ 4. Farbthemen & Druckoptimierung                    │
│     • Preset-Themen & Gestaltungsstile                 │
│     • Papier-, Raster-, Text- & Wochenendfarben        │
│     • Druckfarben-Sparrechner (Coverage Advisor)       │
├────────────────────────────────────────────────────────┤
│  STICKY FOOTER: LIVE-GEOMETRIE-INSPECTOR               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Monatsbreite: 14.0 cm   │ Tageshöhe: 10.0 mm     │  │
│  │ Gesamte Rollenlänge:    │ 226.0 cm (Emerald)     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 CAD-Konstruktion: Strukturierung durch Akkordeons
Die bisherige CAD-Sidebar wird durch echte Akkordeons (`cad-accordion-group`) strukturiert:
- **Akkordeon 1 (Standard: Offen):** Sichtfenster & Rückwand (Kopplung an Kalender-Maße + Offset)
- **Akkordeon 2 (Standard: Offen):** Papierbahn & Wickelstäbe (Stabdurchmesser, Spaltmaß, Z-Position)
- **Akkordeon 3 (Standard: Geschlossen):** Leisten & Bohrungen (Querleisten, Überstand, Sacklöcher)
- **Akkordeon 4 (Standard: Geschlossen):** Beschläge & Rändelmuttern (Gleiter, 5-Cent-Münze, M6)
- **Akkordeon 5 (Standard: Geschlossen):** Schriftfeld & Plankopf (Autor, Material, Zeichnungs-Nr.)

### 2.3 Permanenter "Live-Inspector" für abgeleitete Maße
Bislang sind Geometrie-KPIs tief in Untermenüs versteckt. 
- **Kalender:** Die Box mit `#calc-b-month`, `#calc-h-day` und `#calc-l-total` wird als `sticky bottom-0` am Fuß der Sidebar verankert. Dadurch sieht der Anwender bei jeder Änderung (z. B. Umstellen auf 2-Spalten-Layout oder Puffervergrößerung) in Echtzeit, wie die Rollenlänge reagiert.
- **CAD:** Die KPIs (`#cad-kpi-axis-distance`, `#cad-kpi-outer-dims`, `#cad-kpi-rod-cut`, `#cad-kpi-max-roll`, `#cad-kpi-wrap-angle`) verbleiben als visuelle Karten direkt unter der Konstruktionszeichnung im Hauptbereich.

---

## 3. Erklärungstexte & Labels (Vorher / Nachher)

Aktuell nehmen beschreibende Paragraphen (`<p class="text-[11px] text-slate-400">`) wertvollen vertikalen Raum ein. Wir schlagen eine Umstellung auf kompakte Micro-Labels mit Tooltips vor:

| Bereich / Input-ID | Aktueller Hilfetext (Vorher) | Vorgeschlagenes Micro-Label mit Einheit & Tooltip (Nachher) |
|---|---|---|
| `input-year` | *„14 Monate (Dezember Vorjahr bis Januar Folgejahr).“* | **Zieljahr** `[JJJJ]` <br><span class="text-xs text-amber-500 font-mono">14 Monate</span> <span title="Dezember des Vorjahres bis Januar des Folgejahres für kontinuierlichen Jahreswechsel">ⓘ</span> |
| `input-h-visible` / `input-b-visible` | *(Kein Text, nur cm-Suffix)* | **Sichtfenster** `[B × H cm]` (Kompakte 2er-Inputzeile) |
| `input-puffer-left` / `input-puffer-right` | *(Kein Text, nur cm-Suffix)* | **Vorlauf (L)** / **Nachlauf (R)** `[cm]` <span title="Montagereserve zum Befestigen und Einrollen auf den Holzstäben">ⓘ</span> |
| `select-month-layout` | *„Einspaltig zeigt alle Tage untereinander; zweispaltig verteilt Tage 1–15 und 16–31. Die Maße des Sichtfensters bleiben gleich.“* | **Tagesaufteilung** <br>Options: `1 Spalte (1–31)` / `2 Spalten (1–15 \| 16–31)` <span title="Verdoppelt die sichtbaren Tage bei gleicher Zeilenhöhe">ⓘ</span> |
| `checkbox-month-separator` | *„Einstellungen gelten getrennt für das gewählte Tageslisten-Layout. Die Deckkraft bestimmt die Transparenz des Streifens.“* | **Monatstrennlinie** `[0.1 – 20 mm]` + Farbwähler inline <span title="Vertikaler optischer Trennstreifen zwischen den Monaten">ⓘ</span> |
| `checkbox-show-kw` | *(Langer Inline-Text)* *„Kalenderwochen (KW nach DIN ISO 8601 an Montagen)“* | **Kalenderwochen** `DIN ISO 8601` <span title="Wochennummerierung jeweils am ersten Wochentag (Montag)">ⓘ</span> |
| `btn-analyze-coverage` | *„Vergleicht mögliche Farbänderungen für die ganze Rolle. Es wird nichts ohne Klick geändert; Empfehlungen sind Näherungen ohne Druckerprofil.“* | Button: **Sparpotenzial prüfen** <span title="Berechnet Näherungswerte zur Einsparung von Drucktinte über die gesamte Rolle">ⓘ</span> |
| `color-saturday-bg` / `color-sunday-bg` | *„Wochenenden, Werktage und Termine werden unabhängig eingefärbt. Kategorie-Farben übernehmen alle vorhandenen Einträge dieser Kategorie.“* | **Wochenend-Akzente** (Kompakte Farb-Matrix für Sa / So Hintergrund & Text) |
| `input-font-file` | *„Die Schrift wird nur lokal verarbeitet und in die PDF eingebettet. Eine TTF-Datei wird für alle Schriftschnitte verwendet.“* | **Eigene TTF** `[Lokal]` <span title="Schriftdatei wird ausschließlich lokal im Browser verarbeitet und in den PDF-Export eingebettet">ⓘ</span> |

---

## 4. Input-Elemente & Interaktions-Design

### 4.1 Aktuelle Inkonsistenzen zwischen Kalender und CAD
1. **Gemischte Styling-Strategien:**
   - Der Kalender verwendet harte Tailwind-Utilities wie `bg-slate-950 border-slate-700 rounded-lg text-slate-100`.
   - Die CAD-Sidebar verwendet BEM-ähnliche CSS-Klassen aus `cad-styles.css` (`input[type="number"]`, `.btn`, `.param-group`, `.checkbox-label`).
2. **Abweichende Input-Höhen und Schriften:**
   - Kalender-Inputs variieren zwischen `py-1` (28px), `py-1.5` (32px) und `py-2` (36px).
   - CAD-Inputs haben einheitlich `padding: 0.42rem 0.6rem` (~32px Höhe) und konsequente Monospace-Ausrichtung (`text-align: right; font-family: var(--font-mono)`).
3. **Farbwähler (Native vs. Blossom):**
   - Im Kalender gibt es kleine native `input[type="color"]` (`w-7 h-7` oder `w-8 h-8`), die durch `blossomColorPicker.js` substituiert werden. Diese brauchen einheitliche Container-Höhen, um Layout-Sprünge beim Rendern zu verhindern.

### 4.2 Einheitliche Interaktionszustände (Spezifikation)
Alle Formularfelder (Kalender + CAD) folgen denselben CSS-Tokens:

| Zustand | CSS-Definition / Token | Visuelles Verhalten |
|---|---|---|
| **Default** | `background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-sm);` | Ruhiger, technischer Dunkelgrau- bzw. Hellgrau-Hintergrund |
| **Hover** | `border-color: var(--border-strong); background: var(--bg-muted);` | Subtile Aufhellung des Rahmens, Cursor: pointer (bei Buttons/Checkboxes) |
| **Focus-visible** | `outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft);` | Klar definierter bernsteinfarbener Fokusring (keine Browser-Standard-Outlines) |
| **Active** | `transform: translateY(1px);` (Buttons); `border-color: var(--accent-fill);` | Haptisches Feedback beim Klick |
| **Disabled** | `opacity: 0.45; cursor: not-allowed; filter: grayscale(1); pointer-events: none;` | Klar ausgegraut (z. B. gesperrte physische CAD-Inputs `cad-physical-input`) |
| **Invalid / Error** | `border-color: var(--err-border); box-shadow: 0 0 0 2px var(--err-soft);` | Roter Warnrahmen bei ungültigen Eingaben (z. B. `#month-separator-width-error`) |

### 4.3 Barrierefreiheit & Accessibility (a11y)
- Alle `<input>`- und `<select>`-Elemente ohne sichtbaren Text-Header erhalten ein eindeutiges `aria-label` (z. B. `aria-label="Farbe des Trennstreifens"`).
- Numerische Werte mit Suffix erhalten `aria-describedby` auf die jeweilige Einheit.
- Dynamische Filter (z. B. in der Feiertagsliste) nutzen korrekte ARIA-Rollen: `role="tablist"` bzw. `aria-pressed="true|false"` für Toggle-Buttons.
- Fehlermeldungen (wie Breitenvalidierung) sind fest mit `role="alert"` und `aria-live="polite"` verbunden.

---

## 5. Vollständige Input-ID Mapping-Checkliste (Zero-Regression)

Alle folgenden IDs bleiben bei einer Reorganisation **exakt erhalten**. Kein Listener in `js/app.js` oder `js/cad-module.js` wird verwaist:

### 5.1 Kalender-Sidebar (85 IDs)
<details>
<summary><strong>Klicken zum Aufklappen der Kalender-IDs (85 IDs)</strong></summary>

- **Navigation & Panels:** `app-sidebar`, `tab-button-geometry`, `tab-button-layout`, `tab-button-style`, `tab-button-holidays`, `tab-button-presets`, `tab-geometry`, `tab-layout`, `tab-style`, `tab-holidays`, `tab-presets`
- **Geometrie & Basis (Tab 1):** `year-range-display`, `input-year`, `input-custom-title`, `input-h-visible`, `input-b-visible`, `input-puffer-left`, `input-puffer-right`, `select-puffer-left-content`, `select-puffer-right-content`, `checkbox-show-qr`, `input-qr-gap`, `qr-status`, `calc-b-month`, `calc-h-day`, `calc-l-total`
- **Struktur & Zeilen (Tab 2):** `select-header-style`, `select-header-align`, `input-month-header-text-color`, `input-month-header-text-size`, `select-month-layout`, `checkbox-month-separator`, `input-month-separator-width`, `month-separator-width-error`, `color-month-separator`, `checkbox-month-separator-header`, `checkbox-show-kw`, `input-calendar-week-text-color`, `input-calendar-week-text-size`, `checkbox-show-moon`, `input-moon-opacity`, `checkbox-show-cropmarks`
- **Style & Farben (Tab 3):** `design-style-heading`, `select-design-style`, `design-options`, `theme-heading`, `select-theme`, `theme-options`, `btn-analyze-coverage`, `coverage-recommendations`, `select-font-family`, `option-custom-font`, `input-font-file`, `font-file-status`, `input-font-header-scale`, `input-font-day-scale`, `color-paper`, `input-line-grid`, `input-line-border`, `color-grid`, `color-saturday-bg`, `color-saturday-text`, `color-sunday-bg`, `color-sunday-text`, `color-text`, `color-category-public`, `color-category-vacation`, `color-category-custom`
- **Termine & Feiertage (Tab 4):** `select-country`, `select-bundesland`, `checkbox-show-vacations`, `btn-load-feiertage`, `input-ics-file`, `btn-import-ics`, `btn-export-ics`, `input-holiday-search`, `btn-add-holiday`, `holiday-list`
- **Vorlagen & Sync (Tab 5):** `next-year-link`, `btn-copy-next-year-link`, `next-year-link-status`, `input-preset-name`, `btn-save-preset`, `built-in-presets-list`, `presets-list`
</details>

### 5.2 CAD-Sidebar (22 statische + 18 dynamische Schema-IDs)
<details>
<summary><strong>Klicken zum Aufklappen der CAD-IDs</strong></summary>

- **Statische Container & Steuerung:** `cad-sidebar`, `cad-preset-select`, `cad-btn-load-preset`, `cad-preset-name-input`, `cad-btn-save-preset`, `cad-btn-reset-defaults`, `cad-btn-delete-preset`, `cad-btn-export-json`, `cad-btn-import-json`, `cad-json-file-input`, `cad-tb-title-input`, `cad-tb-material-input`, `cad-tb-dwg-input`, `cad-tb-author-input`, `cad-chk-show-maxroll`, `cad-chk-show-centerlines`, `cad-chk-show-section`, `cad-chk-calendar-preview`, `cad-sync-card`, `cad-sync-status`, `cad-relink-calendar`, `cad-parameter-groups-container`
- **Dynamische Parameter-Inputs (automatisch generiert via `ParameterStore.SCHEMA`):**
  - Num-Inputs: `cad-input-num-windowWidth`, `cad-input-num-backpanelOffsetWidthMm`, `cad-input-num-windowHeight`, `cad-input-num-backpanelOffsetHeightMm`, `cad-input-num-backpanelThickness`, `cad-input-num-backpanelOffsetZ`, `cad-input-num-paperLength`, `cad-input-num-paperThickness`, `cad-input-num-rodDiameter`, `cad-input-num-sideClearance`, `cad-input-num-rodOffsetZ`, `cad-input-num-railHeight`, `cad-input-num-railDepth`, `cad-input-num-railEndMargin`, `cad-input-num-blindHoleDepth`, `cad-input-num-gliderThickness`, `cad-input-num-coinThickness`, `cad-input-num-knurledNutHeight`
  - Range-Slider: `cad-input-range-*` (für alle nicht-physischen Parameter)
</details>

---

### Nächste Schritte
Diese Analyse schließt die Vorbereitung von **Phase 2** ab. Sobald du das Layout freigibst, können wir in **Phase 3** (fehlende Einstellungen wie Papiergrammatur, Schnittmarken & Schema-Fallbacks) übergehen oder die konkrete HTML/CSS-Umstrukturierung schrittweise und test-abgesichert umsetzen.
