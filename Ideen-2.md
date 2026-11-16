## Implementierungsplan: Einheitlicher Header für Kalender und CAD

**Ziel:** Beide Modi verwenden dieselbe Header-Struktur, Reihenfolge, Abstände und Button-Gestaltung. Nur die jeweils verfügbaren Funktionen unterscheiden sich. Der Moduswechsel soll keine Elemente verschieben.

### 1. Gemeinsames Header-Raster festlegen
In `index.html` den Header in feste Bereiche gliedern:

1. Branding links  
2. Modus-Umschalter an gleichbleibender Position  
3. Arbeitsbereich-Steuerungen in fest definierten Slots  
4. Theme-Schalter ganz rechts  

Der Kalender erhält einen Navigationsslot für Ansichtswechsel und Vor/Zurück. Im CAD-Modus bleibt dieser Slot frei, damit Zoom und Export an derselben Stelle bleiben.

### 2. Modusspezifische Bedienelemente in den Header verlagern
- **Beide Modi:** Zoom-Steuerung an einer gemeinsamen Position und in einheitlichem Stil. Sie steuert jeweils die aktive Ansicht.
- **Kalender:** Icons für 3-Monats-Ansicht und Druckrolle sowie Vor-/Zurück-Pfeile; die Monatsbereichsanzeige entfällt.
- **CAD:** PDF-Button mit direktem Export und Dropdown für SVG – optisch wie der Kalender-Export, aber mit den CAD-Formaten.
- Die bisherigen Zoom- und Exportelemente in den jeweiligen Werkzeugleisten entfernen, damit keine Duplikate entstehen.

### 3. Bestehende Funktionen und Ereignisse erhalten
Die bestehenden Export-, Zoom-, Ansichts- und Navigationsaktionen weiterverwenden und an die verschobenen Controls anbinden. Sichtbarkeit und Beschriftungen richten sich nach dem aktiven Modus; IDs und Listener sollen jeweils eindeutig bleiben.

### 4. Gestaltung und Barrierefreiheit vereinheitlichen
In `css/app.css` gemeinsame Button-Größen, Icon-Ausrichtung, Abstände, Hover-/Fokus-Stile und Dropdown-Verhalten definieren. Icons erhalten zugängliche Namen und Tooltips; die Exportmenüs bleiben per Tastatur bedienbar. Für schmale Ansichten werden Beschriftungen reduziert und Überläufe vermieden.

### 5. CAD-Layout und responsives Verhalten anpassen
In `css/cad-styles.css` die CAD-Zeichnungs-Toolbar nach dem Verschieben der Controls auf Legende und Zeichenfläche beschränken. Die neue Header-Anordnung bei Desktop- und schmalen Viewports prüfen, ohne dass Controls zwischen den Modi springen.

### 6. Verifikation
- Beide Modi bei gleicher Fenstergröße vergleichen: gleiche Header-Höhe, Slot-Reihenfolge und Positionen.
- Moduswechsel auf springende Elemente und doppelte Controls prüfen.
- Tastaturbedienung, Dropdown-Schließverhalten, direkten PDF-Export sowie die jeweilige Zoom-/Navigationsfunktion testen.
- Bestehende Tests ausführen und gezielte Tests für neue Header-Interaktionen ergänzen.

**Noch nicht umgesetzt:** Das ist nur der Plan; es wurden keine Codeänderungen vorgenommen.