### 1. Leitprinzipien & Abwärtskompatibilität

* **Keine Code-Änderung in Phase 2:** Reine Spezifikation und UI/UX-Konzept.


* **1:1 ID- & Preset-Erhalt:** Alle bestehenden `id`-, `name`- und `data-*`-Attribute im Kalender-Editor (85 IDs) sowie in der CAD-Sidebar (22 statische + 18 dynamische Schema-IDs aus `ParameterStore.SCHEMA`) bleiben erhalten. JSON-Presets und bestehende Tests (`tests/layoutSettings.test.js` etc.) laufen ohne Bruch weiter.


* **Tab-Container-Kompatibilität:** Die bestehenden Tab-Container (`tab-geometry`, `tab-layout`, `tab-style`, `tab-holidays`, `tab-presets`) bzw. Tab-Buttons müssen beim Umstellen auf eine schlankere Navigation sauber gemappt oder erhalten bleiben, damit URL-/Test-Zugriffe und JS-Bindings nicht ins Leere laufen.



---

### 2. Tab-, Workflow- & Akkordeon-Struktur

#### Kalender-Editor (`#app-sidebar`)

Statt fünf stark verschachtelter/fragmentierter Tabs mit langem Scrollen in *Style*:

* **3 Hauptbereiche / Tabs (bzw. 3 logische Workflow-Ebenen mit abwärtskompatiblem Tab-Mapping)**:


1. **Format & Maße:** Jahr, Titel, Sichtfenster (`B × H`), Puffer links/rechts + Inhalte, QR-Code, Schnittmarken.


2. **Aufbau, Typo & Farben:** 1-/2-Spalten-Layout, Monatskopf (Stil, Ausrichtung, Größe, Farbe), Trennstreifen, KW & Mondphasen, Schriftart/TTF/Skalierung, Papier/Raster/Rahmen, Wochenend- & Kategoriefarben, Druckfarben-Sparanalyse.


3. **Termine & Vorlagen:** Land/Bundesland, Ferien, `.ics` Import/Export, Terminsuche/-liste, Vorlagen & Teilen-Link.




* **Vertikale Akkordeons (`<details>` / `<summary>`):** Innerhalb der Bereiche werden Unterblöcke klappbar organisiert, damit nur aktive Gruppen offen sind und lange Scroll-Strecken entfallen.


* **Dauerhafter Live-Geometrie-Inspector (Sticky-Leiste):** Zeigt abgeleitete Werte (`Monatsbreite`, `Tageshöhe`, `Gesamtlänge` bzw. `#calc-b-month`, `#calc-h-day`, `#calc-l-total`) dauerhaft sichtbar an, unabhängig davon, wo der Nutzer gerade scrollt oder welcher Tab aktiv ist.



#### CAD-Konstruktion (`#cad-sidebar`)

* **Workflow-Reihenfolge zuerst:** Kalender-Sync (`#cad-sync-card`) und Kern-Konstruktionsparameter (`#cad-parameter-groups-container`) rücken nach oben; Meta-/Verwaltungsblöcke (*Modellverwaltung*, *DIN-Schriftfeld*, *Zeichnungs-Layer*) folgen darunter als klappbare `<details>`-Sektionen.


* **Akkordeons für Parameter-Gruppen:** Die Gruppen aus `ParameterStore.SCHEMA` werden in klappbaren Sektionen gebündelt (zentrale Geometrie-/Papier-/Stab-Gruppen standardmäßig offen, seltener genutzte Beschlags-/Schriftfeld-/Import-Gruppen standardmäßig eingeklappt).


* **Sichtbare abgeleitete Maße:** Synchronisierte Kalendermaße (`windowWidth`, `windowHeight`, `paperLength`) und zentrale CAD-Kennzahlen bleiben klar als abgeleitete/gekoppelt gesperrte Werte erkennbar.



---

### 3. Labels, Einheiten & Erklärungstexte

* **Kurzlabels statt Fließtext:** Mehrzeilige Erklärungen unter Headings, Buttons und Checkboxen werden durch prägnante Labels ersetzt.


* **Feste Einheiten:** Alle numerischen Eingaben führen klare Einheiten (`mm`, `cm`, `g/m²`, Faktor) einheitlich am Feld oder im Label, statt Einheiten zu mischen oder wegzulassen.


* **Unaufdringliche Tooltips (`title` / `aria-describedby`):** Fachliche Hinweise (z. B. 14-Monats-Zeitraum, 1–15 / 16–31 Spaltenaufteilung, DIN ISO 8601 KW, lokale TTF-Verarbeitung, Tinten-Näherungswerte) wandern in kompakte Info-Tooltips statt dauerhaft Platz zu blockieren.



---

### 4. Einheitliche Input-Elemente, Zustände & A11y

* **Einheitliches Styling:** Gemeinsame Basisregeln für Text-/Zahlfelder, Selects, Number-Inputs mit Suffix, Color-Picker und Range-Slider über die bestehenden CSS-Variablen (`--bg-surface`, `--border-medium`, `--border-strong`, `--accent`, `--text-primary`, `--radius-sm`) hinweg — ohne Widersprüche zwischen Tailwind-Klassen in `index.html` und Regeln in `app.css` / `cad-styles.css`.


* **Alle interaktiven Zustände definieren:**
* **Default:** Klarer Grundzustand mit konsistenter Höhe und Ausrichtung.


* **Hover:** Subtile Rand-/Flächenänderung (`--border-strong`).


* **Focus / Focus-Visible:** Eindeutiger Fokusring (`--accent` / `focus-visible`) für Tastatur- und Mausnutzer.


* **Active:** Sichtbares Klick-/Drück-Feedback bei Buttons und Controls.


* **Disabled / Read-Only:** Eindeutige Sperr-Optik (`opacity`, `cursor: not-allowed`, ggf. gesperrte Folgefelder bei deaktivierten Optionen oder gekoppelten CAD-Maßen).




* **Barrierefreiheit (`aria-*` & Labels):** Explizite `label[for]`-Verknüpfungen, vollständige `aria-label`-Attribute (inkl. versteckter File-Inputs und Unterscheidung von Slider vs. Zahlfeld bei CAD-Parametern), `aria-describedby` für Einheiten/Hinweise sowie `role="alert"` / `aria-live` bei Validierungs- und Statusmeldungen.



---

### 5. Abnahme-Checkliste für Phase 2

1. Alle 85 Kalender-IDs und alle statischen/dynamischen CAD-IDs sind im Mapping aufgeführt und bleiben unverändert.


2. Tab-Wechsel, Akkordeons und der Sticky-Geometrie-Inspector sind ohne Konflikte mit bestehenden JS-Handlern und Tests beschrieben.


3. Lange Hilfetexte sind durch Kurzlabels, Einheiten und Tooltips ersetzt.


4. Alle Input-Typen haben einheitliche Stile, alle fünf Zustände (`default`, `hover`, `focus-visible`, `active`, `disabled`) und saubere `aria`-Attribute.