# Plan: Zuverlässiger RGB-Plotterexport und Basis-Metadaten

## Problem und Ansatz

Der Kalenderexport erzeugt bereits einen RGB-basierten Vektor-Plot. „Zuverlässig“
bedeutet: Die PDF hat exakt die vorgesehenen Maße, bleibt beim Öffnen und Drucken
vollständig, enthält die benötigten Schriften und beschreibt sich korrekt.
Schnittmarken sind ausdrücklich aus diesem Plan ausgeschlossen.

Die Datei bleibt ein normaler RGB-Plotterexport ohne PDF/X-Zusage. ICC-Profil,
CMYK-Separation, Trapping und Sonderfarben werden ohne konkrete Druckereivorgabe
nicht ergänzt.

## Todos

1. Maß- und Strukturprüfung für die tatsächlich erzeugte Plot-PDF festlegen.
2. Vollständigkeit, Vektorcharakter und Schrifteinbettung absichern.
3. Kleine, sachliche Basis-Metadaten definieren.
4. Fehlerfälle des Exports sichtbar behandeln.
5. Aktuelle Tests um reale PDF-Prüfungen ergänzen.

## Notwendig für den RGB-Plottermodus

### 1. Exakte Seitengröße

Die PDF-Seite muss exakt die berechnete Rollenlänge und Höhe haben. Die
Millimeter-Angaben dürfen weder auf eine A-Größe zurückfallen noch während des
Exports skaliert werden. Das muss anhand einer real erzeugten Datei geprüft
werden, nicht nur über ein jsPDF-Stubbobjekt.

### 2. Vollständiger Inhalt innerhalb der Seite

Alle 14 Monate, Puffer, Texte und der QR-Code müssen innerhalb der Seite liegen.
Besonders lange eigene Titel und kleine rechte Puffer dürfen nicht still
abgeschnitten werden. Kann ein notwendiger Inhalt nicht platziert werden, soll
der Export sichtbar mit einer verständlichen Meldung abbrechen.

### 3. Vektorinhalt erhalten

Linien, Flächen, Text und QR-Code bleiben PDF-Vektorobjekte. Das sorgt für
scharfen Großformatdruck und vermeidet die hohen Dateigrößen und
Auflösungsprobleme eines vollständig gerasterten Kalenders.

### 4. Verwendete Schriften einbetten

Normal, Fett und Kursiv der gewählten Schrift müssen eingebettet sein. Eine
fehlende oder nicht ladbare Schrift darf nicht unbemerkt durch eine andere
Schrift ersetzt werden. Mitgelieferte Schriften und Benutzer-TTF benötigen
jeweils einen Test an einer echten PDF-Datei.

### 5. RGB-Ziel eindeutig kennzeichnen

Der Benutzer sollte den Modus als „RGB-Plotter-PDF“ erkennen. Sinnvolle
Begleitinformation: „Die Drucksoftware beziehungsweise der Druckdienstleister
führt die Ausgabe-Farbkonvertierung aus.“ Damit wird weder druckereigenaue
Farbsicherheit noch PDF/X-Konformität behauptet.

## Sinnvolle Basis-Metadaten

### `Title` — sinnvoll

Beispiel: `ChronoScroll Rollkalender 2027`. Das erleichtert die Identifikation
im Dateisystem und beim Druckdienstleister. Ein eigener Kalendertitel kann
ergänzt werden, die Jahrzahl sollte erhalten bleiben.

### `Subject` — sinnvoll

Beispiel: `14-Monate-Rollkalender; RGB-Plotterexport; 2260 × 320 mm; 1 Seite`.
Breite und Höhe müssen aus der aktuellen Geometrie berechnet werden. Das Feld
darf keine Druckerei- oder Farbprofil-Konformität behaupten.

### `Creator` — sinnvoll

Beispiel: `ChronoScroll`. Hier gehört der Name der erzeugenden Anwendung hin.

### `Producer` — sinnvoll

Beispiel: `ChronoScroll via jsPDF 2.5.1`. Damit ist der technische Erzeuger für
spätere Fehlersuche dokumentiert. Die Versionsangabe sollte zentral gepflegt
werden.

### `Author` — optional

Nur setzen, wenn der Benutzer bewusst einen Namen eingibt. Nicht automatisch
`Administrator`, einen Rechnernamen oder eine Person des Projekts eintragen.

### `CreationDate` — sinnvoll

Das tatsächliche Datum des PDF-Exports darf vom Generator gesetzt werden.
Build-Datum, Kalenderjahr oder Jahresanfang sind hierfür falsch.

### `Keywords` — nice-to-have

Mögliche kurze Werte: `Rollkalender, RGB, Vektor, Plotter, 14 Monate`.
Wichtige Druckhinweise dürfen nicht ausschließlich in Keywords stehen.

## Nicht in Basis-Metadaten aufnehmen

- XMP-Paket
- PDF/X-Kennung oder `GTS_PDFXVersion`
- Output Condition oder ICC-Profilverweis
- `Trapped` ohne tatsächlich ausgeführte Überfüllungsprüfung
- ein behaupteter CMYK- oder Papierfarbraum
- Schmuckfarben

Diese Angaben wären entweder unnötig oder würden dem Druckbetrieb eine nicht
geprüfte Eigenschaft der Datei versprechen.

## Umsetzung

1. In `js/pdfExport.js` direkt nach der Dokumenterzeugung `setProperties`
   mit Titel, Beschreibung, Creator und Producer aufrufen.
2. Titel und Beschreibungsmaß aus Jahr und aktueller Geometrie erzeugen.
3. Die jsPDF-Version als zentrale, gepflegte Konstante oder vorhandene
   Konfiguration verwenden.
4. Die RGB-Beschreibung in der Exportoberfläche oder unmittelbar beim Download
   verständlich anzeigen.
5. Einen PDF-Parser-Test für reale Ausgaben einführen. Er prüft:
   - eine Seite,
   - MediaBox entspricht exakt der mm-Geometrie,
   - verwendete Schriften sind eingebettet,
   - Text- und Vektorinhalt ist vorhanden,
   - Basis-Metadaten stimmen mit Jahr und Geometrie überein.
6. Regressionstests für Standardschrift, Benutzer-TTF, typische Geometrie,
   minimalen Puffer und nicht platzierbaren QR-Code ergänzen.
7. Exportfehler sichtbar melden; niemals eine unvollständige oder auf einen
   Fallback abgesicherte PDF als erfolgreich ausgeben.

## Priorisierung

### Notwendig

1. Echte PDF-Maß-, Font- und Inhaltsprüfung.
2. Fehler bei Schrift, QR-Code oder Zeichnung sichtbar abbrechen.
3. RGB-Plottermodus ohne PDF/X-Behauptung benennen.
4. Titel, Subject, Creator und Producer setzen.

### Sinnvolles kleines Plus

1. CreationDate prüfen.
2. Keywords ergänzen.
3. Autor nur bei bewusster Benutzereingabe setzen.

### Bewusst weglassen

1. PDF/X, ICC, CMYK, Trapping und XMP.
2. Zusätzliche Page Boxes ohne konkreten Beschnittbedarf.
3. Generatorwechsel oder Postprozessor, solange der reale RGB-Export und seine
   grundlegende Struktur korrekt funktionieren.
