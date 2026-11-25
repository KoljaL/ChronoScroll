# Implementierungsplan & Optionen: `verylasttodos.md`

Dieses Dokument teilt die gewünschten Änderungen aus [verylasttodos.md](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/verylasttodos.md) in **eindeutig umsetzbare Aufgaben** (Teil 1) und **offene Entscheidungsfragen mit konkreten Optionen** (Teil 2).

> [!NOTE]
> Alle Änderungen berücksichtigen die Vorgaben aus `AGENTS.md`: Zero-Build (`file://`-kompatibel), keine neuen Abhängigkeiten, bestehende DOM-IDs/State-Keys nach Möglichkeit rückwärtskompatibel halten, damit ältere JSON-Presets und die Test-Suite weiterhin funktionieren.

---

## Teil 1: Eindeutige Änderungen (Implementierungsplan)

### 1. Header (`index.html`, `css/app.css`)
- **HomeLink im Logo:**
  - `.header-brand` in `index.html` von `<div class="header-brand">` auf `<a href="index.html" class="header-brand">` umstellen (oder nur das Logo/Titel-Paar verlinken, siehe Option in Teil 2).
  - In `css/app.css` `text-decoration: none; color: inherit;` für `a.header-brand` ergänzen.
- **Mode-Buttons anpassen:**
  - In `index.html` (`#btn-mode-calendar`, `#btn-mode-cad`):
    - `<i class="fa-solid ...">` Icons entfernen.
    - Texte ändern zu `Kalender` und `Konstruktion` (auch `aria-label` entsprechend anpassen).
  - In `css/app.css`:
    - `.mode-switch-button` auf `justify-content: flex-start; text-align: left;` umstellen.
    - In der `@media`-Regel für schmale Viewports (ca. Zeile 957) sicherstellen, dass `.mode-switch-button span` sichtbar bleibt, da keine Icons mehr vorhanden sind.

### 2. Tabheader / Tabbar (`index.html`)
- **Ein-Wort-Beschriftungen ohne Icons:**
  - `#tab-button-geometry`: Icon entfernen, Text → `Format`
  - `#tab-button-style`: Icon entfernen, Text → `Design`
  - `#tab-button-holidays`: Icon entfernen, Text → `Einträge`

### 3. Tabs allgemein (`css/app.css`)
- **Accordion-`<summary>` (Pfeil rechts, etwas größer, Text links):**
  - `.sidebar-accordion-summary` in `css/app.css`:
    - Pfeil von `::before` auf `::after` verschieben (oder per Flexbox `order: 2; margin-left: auto;` nach rechts setzen), sodass der Titel immer linksbündig beginnt.
    - Pfeilgröße vergrößern (z. B. `font-size: 0.95rem;` statt `0.72rem`).
    - Falls neben dem Titel rechts ein Hinweis-Icon (`.cs-info-tip`) oder ein Badge (`#year-range-display`) steht, dieses direkt neben dem Titel oder links vom Pfeil platzieren (`margin-right: auto` auf der linken Gruppe bzw. `margin-left: 0.5rem` auf dem Pfeil).
- **Scrollbar in der Seitenleiste unsichtbar machen:**
  - `.calendar-tabpanels` (und analog ggf. die CAD-Sidebar) in `css/app.css` / `css/cad-styles.css` ergänzen mit:
    ```css
    scrollbar-width: none;
    -ms-overflow-style: none;
    ```
    sowie `.calendar-tabpanels::-webkit-scrollbar { display: none; }`.

### 4. Format-Tab (`index.html`, `js/app.js`, `js/geometry.js`)
- **Vorlauf & Nachlauf ohne Inhalts-Dropdowns:**
  - `#select-puffer-left-content` und `#select-puffer-right-content` aus `index.html` entfernen.
  - In `js/app.js` bleiben `pufferLeftContent: 'blank'` und `pufferRightContent: 'blank'` als Standard; beim Laden alter Presets optional auf `'blank'` normalisieren.
- **Wickelzugabe entfernen (Code-Prüfung bestätigt Redundanz):**
  - *Ergebnis der Code-Analyse in `js/geometry.js` (Z. 37, 70–73):* `leadInMm = pufferLeftMm + windingAllowanceLeftMm` und `leadOutMm = pufferRightMm + windingAllowanceRightMm`. Beide Werte werden schlicht addiert und haben auf die Rollenlänge und Pufferbreite denselben Effekt.
  - UI-Felder `#input-winding-allowance-left` und `#input-winding-allowance-right` aus `index.html` entfernen.
  - In `js/app.js` und `js/geometry.js` `windingAllowanceLeftMm` / `windingAllowanceRightMm` intern mit Default `0` beibehalten (für Preset-/Test-Kompatibilität), ohne UI-Bindung.
- **QR-Code in die „Vor- & Nachlauf“-Box verschieben:**
  - `#checkbox-show-qr`, `#input-qr-gap` und `#qr-status` aus der Box `QR-Code & Plotter-Ausgabe` in das `<details>`-Element `Vor- & Nachlauf` verschieben.
- **Schnittmarken in die erste Box unter „Papiergrammatur“ verschieben:**
  - `#checkbox-show-cropmarks` und `#select-crop-mark-style` in das erste `<details>`-Element (`Zeitraum & Sichtfenster`) direkt unter `#input-paper-grammage` verschieben.
  - Das nun leere `<details>`-Element `QR-Code & Plotter-Ausgabe` entfernen.

### 5. Design-Tab (`index.html`, `css/app.css`, `js/app.js`)
- **Bezeichnung ändern:**
  - `#theme-heading` in `index.html`: `Farb-Theme` → `Theme`.
- **Darstellung & Theme: Dropdowns entfernen, Buttons als einzeilige scrollbare Liste, Theme-Kreise entfernen:**
  - `<select id="select-design-style">` und `<select id="select-theme">` entfernen (bzw. Auswahl-Daten direkt aus einer JS-Liste in `js/app.js` statt aus `<select>.options` generieren, damit `renderDesignOptions()` unabhängig funktioniert).
  - `.choice-grid` (`#design-options`, `#theme-options`) in `css/app.css` von 2-Spalten-Grid auf eine **einzeilige, horizontal scrollbare Flex-Liste** umbauen:
    ```css
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 0.5rem;
    scrollbar-width: none;
    ```
    mit fester/minimaler Kartenbreite (z. B. `flex: 0 0 9.5rem;`), sodass Name und Beschreibung lesbar bleiben.
  - In `js/app.js` (`renderThemeOptions()`, Z. 441–451) die Erzeugung von `.theme-swatches` / `.theme-swatch` entfernen.
- **Rahmenlinie entfernen:**
  - Das UI-Feld `#input-line-border` („Rahmenlinie“) aus `index.html` (Z. 528–535) entfernen.
  - In `js/app.js` den State-Key `lineBorder` als Fallback für bestehende Presets und Exporte belassen (optional Default `0.6` beibehalten oder auf `0` setzen, falls gar kein Außenrahmen mehr gezeichnet werden soll).
- **Wochenenden & Werktage optisch an Ereigniskategorien anpassen:**
  - In `index.html` (Z. 537–561) die 2-spaltigen Grid-Felder (`#color-saturday-bg`, `#color-saturday-text`, `#color-sunday-bg`, `#color-sunday-text`, `#color-text`) auf dasselbe `.category-color-list` / `.category-color-row`-Layout umstellen (links Bezeichnung + kurze Hilfszeile, rechts der Color-Picker).

---

## Teil 2: Offene Punkte & Optionen zur Entscheidung

### Punkt A: Ziel des HomeLinks im Logo
**Frage:** Was genau soll beim Klick auf das Logo / den Titel passieren?
- **Option A1 (Klassischer Reload):** `<a href="index.html">` – lädt die Seite sauber neu und verwirft URL-Parameter (`?s=...`).
- **Option A2 (Soft-Reset ohne Reload):** Klick setzt nur den Arbeitsmodus auf `Kalender`, Tab auf `Format` und scrollt die Vorschau auf den Startmonat zurück (aktuelle Termine/Einstellungen bleiben erhalten).

---

### Punkt B: Platzierung der Farben für Ereigniskategorien (Feiertage, Ferien, Eigene Termine)
**Aktuell:** Liegen im **Design-Tab** unter „Farben & Linien“.
**Wunsch:** Sollten im **Einträge-Tab** sein, eventuell zusätzlich.

- **Option B1 – Nur im Einträge-Tab:**
  - Die 3 Farbreihen (`Feiertage`, `Ferien`, `Eigene Termine`) wandern komplett in den **Einträge-Tab** (z. B. als kompakte Box über oder unter den Terminfiltern).
  - *Vorteil:* Keine Dopplung; man sieht die Farbe direkt dort, wo man Feiertage, Ferien und `.ics`-Termine verwaltet.
- **Option B2 – Synchronisiert in beiden Tabs (Design + Einträge):**
  - Die Farbreihen bleiben im **Design-Tab** (für das gesamte Farbkonzept) und erscheinen zusätzlich im **Einträge-Tab** (z. B. kompakt direkt bei den Kategorien). Beide Stellen sind bidirektional an `state.categoryColors` gekoppelt.
  - *Vorteil:* Egal ob man gerade „Design“ oder „Einträge“ bearbeitet, die Farbe ist sofort greifbar.
  - *Nachteil:* Etwas mehr UI-Fläche im ohnehin inhaltsreichen Design-Tab.
- **Option B3 – Im Design-Tab lassen, im Einträge-Tab nur Farbpunkte + Schnellzugriff:**
  - Die Filter-Buttons im Einträge-Tab (`Feiertage`, `Ferien`, `Eigene`) erhalten einen kleinen farbigen Punkt in der aktuellen Kategoriefarbe. Ein Klick auf einen kleinen Stift/Farb-Button springt direkt in den Design-Tab zu den Farben.
  - *Vorteil:* Einträge-Tab bleibt sehr kompakt, trotzdem sofortiges visuelles Feedback.

---

### Punkt C: „Vorlagen“, „Darstellungen“ und „Themes“ vereinfachen + wohin mit dem Teilen-Link?
**Aktuelle Aufteilung (3 Ebenen):**
1. **Darstellung** (`designStyle`): Bestimmt die *Struktur/Zeichenlogik* (Klassisch, Mid-Century, Bauhaus, Gantt, Zen, Kursbuch).
2. **Theme** (`themeKey`): Setzt *Farbpalette + Schriftart* (Skandinavisch Minimal, Holz & Leder, Blueprint, …).
3. **Vorlagen** (`builtInPresets` + lokale Vorlagen): Speichern *alles komplett* (Maße, Spalten, Darstellung, Theme, Puffer, Schnittmarken, …).
4. **Teilen-Link**: Erzeugt eine URL mit der aktuellen Konfiguration.

**Optionen zur Vereinfachung & Platzierung:**

- **Option C1 – Drei Konzepte behalten, Vorlagen in den Design-Tab verschieben (minimalinvasiv):**
  - „Integrierte Vorlagen“ und „Lokal gespeicherte Vorlagen“ ziehen als eigene Accordion-Box ganz oben in den **Design-Tab** um.
  - Der **Teilen-Link** wandert in eine kleine Export/Teilen-Sektion (z. B. in den Header neben das Export-Menü oder als eigene kleine Box in den Format-Tab).
  - Der **Einträge-Tab** enthält dann ausschließlich: *Feiertage/Ferien/.ics*, *Terminsuche & Liste* (und ggf. *Kategoriefarben*).
  - *Vorteil:* Alle bestehenden Features bleiben 1:1 erhalten, geringstes Risiko.

- **Option C2 – Auf zwei Ebenen reduzieren: „Vorlagen“ + „Themes“ (oder „Darstellung“ + „Themes“):**
  - *Variante C2a (Empfohlen für Einsteiger):* **Integrierte Vorlagen** und **Darstellungen** werden zu *einem* Bereich **„Stil-Vorlagen“** zusammengelegt (z. B. *Bauhaus*, *Gantt 4-Spur*, *Atelier Zweispaltig*, *Eco Weiß*). Darunter bleibt **„Theme“** nur für die schnelle Farb-/Schriftvariation. Eigene gespeicherte Vorlagen bleiben als kompaktes „Eigene Setups speichern/laden“ darunter.
  - *Variante C2b (Fokus auf Baukasten):* **Darstellung** (Struktur) + **Theme** (Farben) bleiben im **Design-Tab**. Die „Integrierten Vorlagen“ werden entfernt (oder auf 2–3 Start-Beispiele reduziert), und „Lokale Vorlagen speichern + Teilen-Link“ wandern als kompaktes Dropdown/Modal in den **Header** (neben PDF-Export).
  - *Vorteil:* Deutlich weniger Verwirrung durch 3 ähnlich klingende Begriffe.

- **Option C3 – Vorlagen & Teilen-Link komplett in den Header auslagern:**
  - Oben im Header (neben Export) gibt es ein kleines Icon-Menü „Vorlagen & Teilen“.
  - Alle drei Sidebar-Tabs bleiben dadurch extrem fokussiert:
    - **Format:** Papier, Maße, Vor-/Nachlauf, QR, Schnittmarken
    - **Design:** Darstellung, Theme, Schriften, Linien, Farben
    - **Einträge:** Feiertage, Ferien, `.ics`, Termine (+ Kategoriefarben)
  - *Vorteil:* Sauberste Trennung zwischen „Konfiguration bearbeiten“ (Sidebar) und „Konfiguration speichern/laden/teilen“ (Header).
