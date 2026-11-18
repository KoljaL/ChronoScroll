# Plan: Machbarkeitsanalyse für prepress-fähige PDF-Erzeugung

## Problem und Ansatz

Der bestehende Kalenderexport erzeugt mit jsPDF 2.5.1 ein millimetergenau dimensioniertes RGB-Vektor-PDF. Er setzt derzeit keine PDF/X-Kennung, keinen Output Intent, keine expliziten Page Boxes, keine Trapped-Information, keine Separation Color Spaces und keine synchronisierten Info-/XMP-Metadaten.

Die Untersuchung soll für den Kalender-/Plotter-PDF-Export feststellen, welche Anforderungen direkt bei der Erzeugung erfüllt werden können, welche Eingriffe jsPDF beziehungsweise einen nachgelagerten PDF-Postprozess benötigen und welche Voraussetzungen vom Druckbetrieb kommen müssen. Da Copyshops und verschiedene Druckereien unterschiedliche Standards und ICC-Profile verlangen können, wird kein einzelner universeller Zielstandard angenommen. Der Bericht soll mindestens die Varianten „standardloser Plotterexport“, PDF/X-4 und PDF/X-1a gegenüberstellen.

## Todos

1. Den aktuellen Kalender-PDF-Datenfluss und die tatsächlich erzeugten PDF-Objekte erfassen.
2. Die vier geforderten Metadaten- und Prepress-Bereiche gegen ISO-32000-/PDF-X-Anforderungen abgrenzen.
3. Technische Integrationsoptionen für jsPDF und einen browserseitigen PDF-Postprozessor bewerten.
4. Seitenrahmen, Anschnitt und bestehende Rollen-/Puffergeometrie eindeutig modellieren.
5. RGB-/CMYK-, ICC- und Sonderfarbpfade einschließlich der Grenzen von PDF/X-1a und PDF/X-4 analysieren.
6. Info-Dictionary, XMP, Trapped und PDF/X-Identifikatoren auf eine synchronisierte Metadatenstrategie abbilden.
7. Einen Preflight- und Regressionstestplan mit klaren Akzeptanzkriterien formulieren.
8. Die Ergebnisse als kurze Machbarkeitsbewertung mit empfohlener Architektur, Risiken und offenen Druckereiparametern ausarbeiten.

## Geplante Untersuchung

### 1. Ist-Zustand und technische Grenzen

- [`js/pdfExport.js`](/Users/lasarkolja/Code/ChronoScroll/js/pdfExport.js) als primären Exportpfad analysieren:
  - seitengroße PDF-Erzeugung in Millimetern,
  - Zeichnungsoperatoren in RGB,
  - eingebettete TrueType-Schriften,
  - vorhandene Wickelpuffer und Schnittmarken,
  - Blob-/Save-Verhalten und mögliche Stelle für einen Postprozess.
- [`index.html`](/Users/lasarkolja/Code/ChronoScroll/index.html) hinsichtlich der über CDN eingebundenen jsPDF-Version und einer möglichen zusätzlichen clientseitigen PDF-Bibliothek prüfen.
- [`tests/exportLayouts.test.js`](/Users/lasarkolja/Code/ChronoScroll/tests/exportLayouts.test.js) als Ausgangspunkt für Geometrie- und Exportregressionen bewerten.
- Festhalten, welche PDF-Objekte jsPDF öffentlich unterstützt und welche derzeit nur über interne APIs oder durch direkte PDF-Postprozessierung erreichbar sind.
- Den CAD-Export bewusst aus dem Umsetzungsumfang lassen, seine gemeinsame technische Wiederverwendbarkeit aber kurz kennzeichnen.

### 2. Standard- und Profil-Matrix

Eine Matrix mit mindestens diesen Ausgabezielen erstellen:

- normaler Plotter-/Copyshop-Export ohne PDF/X-Zusage;
- PDF/X-4 mit einem vom Druckbetrieb gelieferten ICC-Profil;
- PDF/X-1a mit strengem CMYK-/Spot-Workflow;
- optional ein Standardprofil wie ISO Coated v2 oder PSO Coated v3, aber nur als explizit ausgewählte Variante mit verifizierter Profildatei und geklärter Lizenzquelle.

Für jede Zeile dokumentieren:

- PDF-Version,
- erlaubte Farbräume,
- Transparenzfähigkeit,
- Output-Intent-Pflichten,
- unterstützte Gerätefarben,
- Schrift-/Bild- und Verschlüsselungsrestriktionen,
- benötigte Profil- und Metadatenparameter,
- Auswirkungen auf die bestehende RGB-Zeichnung.

Damit wird vermieden, ein Copyshop-Profil als universelle Druckerei-Konfiguration auszugeben.

### 3. Output Intent und ICC-Profil

- Beschreiben, wie ein ICC-Profil als PDF-Stream eingebettet und über einen `/OutputIntents`-Eintrag im Katalog verwendet wird.
- Benötigte Angaben definieren: `/S /GTS_PDFX`, OutputCondition, OutputConditionIdentifier, RegistryName und das passende DestOutputProfile.
- Prüfen, ob das Profil per gebündelter Asset-Datei, per Upload oder per druckereispezifischem Preset eingebunden werden soll.
- Die ICC-Profil-Bytes als unveränderte externe Produktionsdaten behandeln; Profilnamen nicht aus Dateiendungen oder UI-Labels ableiten.
- Klarstellen, dass eine PDF/X-Kennung ohne eingebetteten, passenden Output Intent keine Konformität herstellt.

### 4. Page Boxes und geometrisches Modell

- Die aktuelle Seiten-/Rollenabmessung mit MediaBox, TrimBox und BleedBox abgleichen.
- PDF-Koordinaten in Punkt und die bestehende Millimeter-/Koordinatentransformation explizit dokumentieren; insbesondere die Y-Achsen-Umschaltung zwischen jsPDF und nativen PDF-Boxen.
- Zwei mögliche TrimBox-Semantiken unterscheiden:
  - Endformat ist die gesamte Papierbahn einschließlich Montagepuffern;
  - Endformat ist nur der nutzbare Kalenderbereich, während die Puffer nicht zum Trim gehören.
- Für einen echten 2–3-mm-Anschnitt das aktuell flächenfüllende Seitenformat nicht bloß mit einer BleedBox annotieren: Die MediaBox muss den Anschnitt enthalten und alle für den Beschnitt relevanten Inhalte müssen bis dorthin durchlaufen.
- Bestehende Schnittmarken als sichtbare Produktionsmarken von den PDF-Boxdefinitionen trennen; die aktuellen Marken liegen im inneren 3-Monats-Sichtbereich und sind nicht automatisch ein Belag für den Rand einer Endformatseite.
- Eine parametrisierte Geometriefunktion vorschlagen, die MediaBox, TrimBox und BleedBox konsistent aus Rollenformat, Pufferbereichen und konfigurierbarem Anschnitt berechnet.

### 5. Farbräume, Trapping und Schmuckfarben

- Alle bestehenden RGB-Farbbefehle inventarisieren, einschließlich Texte, Linien, Flächen und QR-Code.
- Für PDF/X-4 prüfen, ob ICC-basierte Farbräume direkt erzeugt oder vorhandene Gerätefarben in einen klaren profilierten Workflow überführt werden müssen.
- Für PDF/X-1a eine echte CMYK-Konvertierung unter dem gewählten Ausgabeprofil vorsehen; eine numerische RGB→CMYK-Näherung allein gilt nicht als druckvorstufentaugliche Farbreproduktion.
- Das Trapped-Feld getrennt von der tatsächlichen Überfüllung behandeln:
  - `/Trapped /True`: nur wenn die Datei tatsächlich getrappt und dies verifiziert wurde;
  - `/False`: nur wenn dies als Produktionsaussage korrekt ist;
  - `/Unknown`: sicherer Default, wenn keine Überfüllungsprüfung stattgefunden hat.
- `pdf:Trapped` im XMP-Bereich mit dem Info-Dictionary synchronisieren und dabei die Werte `True`, `False`, `Unknown` unverändert abbilden.
- Eine Separation-Funktion mit Spot-Color-Namen, Tint-Transform und AlternateSpace analysieren. Ohne druckereispezifischen Auftrag keine willkürlichen Schmuckfarben aus Hex-Codes ableiten.
- Festhalten, ob Schmuckfarben nur in Metadaten deklariert oder tatsächlich in Content Streams verwendet werden müssen; eine reine Deklaration erzeugt keine Sonderfarbenseparation.

### 6. Info-Dictionary und XMP

- Zielwerte für CreatorTool, Producer, Dokumenttitel, Erstellungsdatum und PDF/X-Identifikatoren definieren.
- XMP als UTF-8-RDF/XML-Stream mit den passenden Namensräumen planen, insbesondere:
  - Dublin Core,
  - XMP Basic/Media Management,
  - PDF,
  - PDF/X.
- Für PDF/X-4 und PDF/X-1a versionsgerechte Kennungen spezifizieren und die exakte Version als konfigurierbares Ausgabeziel behandeln.
- Klassisches Info-Dictionary und XMP aus einer gemeinsamen Metadatenquelle erzeugen, damit Producer, CreatorTool und Trapped nicht auseinanderlaufen.
- Prüfen, welche Felder jsPDF doppelt schreibt und wie diese beim Postprozess deterministisch ersetzt werden können.

### 7. Integrationsoptionen

Option A: jsPDF-Erweiterung

- Niedriges Integrationsrisiko für bestehende Zeichenlogik.
- Geeignet für Anschnittsgeometrie vor oder während des Zeichnens.
- Ungeeignet als alleiniger Weg, falls PDF-Katalog, ICC-Streams, XMP oder benannte Separation-Resources nicht über stabile öffentliche APIs zugänglich sind.

Option B: browserseitiger PDF-Postprozess

- Bestehendes jsPDF-PDF nach der Erzeugung einlesen und Catalog/Page/Info-/Metadatenobjekte gezielt ergänzen.
- Gut geeignet für OutputIntent, Page Boxes, XMP, Info-Dictionary und PDF/X-Version.
- Benötigt strikte Objekt-ID-/XRef- und PDF-Stream-Behandlung sowie eine Strategie für die Erzeugung eines Binär-PDFs.
- Farbraumänderungen und Separation-Nutzung sind risikoreicher, weil bestehende Content Streams nicht nur Metadaten enthalten.

Option C: Generatorwechsel oder paralleler Prepress-Export

- Neue PDF-Bibliothek beziehungsweise eigener PDF-Writer für Druckausgabe.
- Höchste Änderungsarbeit, aber sauberste Kontrolle über Resource Dictionaries, ICC-basierte Graphics State Resources und Separation Color Spaces.
- Als Empfehlung nur, wenn der reguläre Export seine einfache Offline-/CDN-Eigenschaft behalten muss und ein dedizierter „Druckvorstufe“-Export vertretbar ist.

Der Bericht soll eine Entscheidungsmatrix nach Konformitätsstärke, Implementierungsrisiko, Browser-Kompatibilität, Ladegröße und Wartbarkeit enthalten.

### 8. Validierung und Akzeptanzkriterien

- Unit-Tests auf erzeugte PDF-Strukturen:
  - Catalog-Version und PDF/X-Metadaten,
  - genau ein referenzierter OutputIntent,
  - ICC-Stream mit unveränderten Bytes,
  - exakte MediaBox/BleedBox/TrimBox in Punkten,
  - identisches Trapped in Info und XMP,
  - Seitenzahl und erhaltene Zeichnungsobjekte.
- Objektnahe PDF-Parser-Tests statt ausschließlich String-Suche, damit komprimierte und binäre Streams korrekt geprüft werden.
- Gezielte visuelle Regression für Inhaltstransformation nach Anschnittserweiterung.
- Ein echter PDF/X-Preflight mit einem unterstützten externen Prüfwerkzeug als manueller oder CI-Gate-Schritt.
- Testfälle für fehlendes/fehlerhaftes ICC-Profil: Export explizit abbrechen oder auf den nicht-PDF/X-Modus zurückfallen und dies sichtbar kennzeichnen; niemals eine PDF/X-Datei mit nicht eingebettetem oder falschem Profil ausgeben.
- Keine Aussage „PDF/X-konform“, bevor ein Preflight für jede unterstützte Variantenkombination bestanden wurde.

## Ergebnisdokument im Planungsumgang

Der spätere Bericht soll enthalten:

1. kurze Executive Summary mit einer Ja-/Teilweise-/Nein-Bewertung je Anforderung;
2. Ist-Analyse des aktuellen Exports;
3. ISO-/PDF-X-Anforderungsmatrix;
4. empfohlener Architekturpfad;
5. offene Parameter, die jede Druckerei liefern muss;
6. Risiken, insbesondere Farbmanagement, Anschnitt, Lizenzen und falsche Konformitätsclaims;
7. konkrete Akzeptanztests;
8. priorisierte nächste Umsetzungsschritte ohne bereits Code zu ändern.

## Hinweise

- Der Kalenderexport ist zunächst der einzige Scope; der CAD-PDF-Export bleibt unverändert.
- Mangels eines universellen Druckpartners werden Standard und ICC-Profil als Ausgabeparameter statt als globale Defaults modelliert.
- Keine ICC-Datei darf erfunden, aus ihrem Namen rekonstruiert oder ohne geklärte Weiterverbreitungsbedingungen gebündelt werden.
- Eine reine Metadaten-Erweiterung reicht nicht aus: Farbverwendung, Fonts, Transparenz, Seitenrahmen und tatsächlicher Anschnitt sind Teil der Konformitätsbewertung.


-----





# Bewertung der Prepress-Punkte

## Kurzurteil

Der heutige Kalenderexport ist ein RGB-Vektor-PDF für einen Endlosplotter:
Seite, Texte und Zeichenobjekte werden direkt mit jsPDF erzeugt, Schriften
werden eingebettet und die Seitengröße wird in Millimetern angegeben. Daraus
folgt die wichtigste Unterscheidung:

- **Normale Plotter-/Copyshop-Ausgabe:** Ein validierter, sauberer RGB-Export
  ohne PDF/X-Versprechen genügt meist.
- **Konkrete Druckerei-Anforderung:** PDF/X, ICC-Profil, Page Boxes und
  Farbumsetzung müssen als separates Ausgabeziel für genau diese Druckerei
  umgesetzt und geprüft werden.

Ein universeller, automatisch „druckfertiger“ oder „PDF/X-konformer“ Modus ohne
Druckpartner und ohne dessen ICC-Profil ist nicht sinnvoll.

## Bewertung der einzelnen Punkte

### 1. Ist-Zustand und technische Grenzen

**Notwendig.** Vor jeder Druckvorstufenerweiterung muss klar sein, was die Datei
tatsächlich enthält. Für den Ist-Stand sind besonders folgende Tatsachen
entscheidend:

- jsPDF 2.5.1 wird über CDN geladen.
- Die Kalenderseite verwendet RGB und Vektoroperatoren.
- Eingebettete TrueType-Schriften sind bereits vorhanden.
- Die PDF-Seite ist exakt so groß wie die erzeugte Rolle.
- Die aktuellen Schnittmarken markieren nur die Grenzen des Drei-Monats-
  Sichtfensters, nicht automatisch das Ende der Endformatseite.
- Der normale Export schreibt keine Prepress-spezifischen Strukturen.

Dieser Punkt kostet wenig, verhindert aber falsche Annahmen und sollte zuerst
festgehalten werden.

### 2. Standard- und Profil-Matrix

**Sinnvoll als kleine Entscheidungsgrundlage, aber kein großer Ausbau.**
Der reale Bedarf lässt sich mit zwei Modi trennen:

1. **Plotter-PDF (Standard):** RGB, eingebettete Fonts, exakte Seitengröße,
   kein PDF/X-Claim.
2. **Druckerei-Preset:** erst wenn Standard, ICC-Profil, Anschnitt und
   Akzeptanzkriterien des Betriebs bekannt sind.

PDF/X-4 und PDF/X-1a vollständig parallel zu unterstützen ist aktuell
Nice-to-have. PDF/X-1a ist wegen der strikten CMYK-Anforderungen die
aufwendigste und für einen farbig konfigurierbaren Kalender wenig attraktive
Variante. PDF/X-4 wäre eher der spätere Einstieg, falls eine Druckerei es
konkret verlangt.

### 3. Output Intent und ICC-Profil

**Nur für echtes PDF/X notwendig; für den normalen Plotterexport nicht.**
Ein Output Intent beschreibt, welchem Ausgabezustand die Farben zugeordnet
sind. Ohne passendes, unverändertes ICC-Profil ist eine PDF/X-Kennung wertlos
oder irreführend.

Sinnvoll wäre daher:

- kein ICC-Profil standardmäßig erfinden oder mitliefern;
- ein Profil pro Druckerei-Preset laden lassen;
- Export mit fehlendem oder falschem Profil abbrechen;
- im normalen RGB-Modus keinen Output Intent und keinen PDF/X-Claim setzen.

### 4. Page Boxes und geometrisches Modell

**Teilweise notwendig, Teile sind derzeit nicht nützlich.**

Seitenmaße müssen eindeutig bleiben: Rollenlänge, sichtbarer Kalenderbereich,
linker/rechter Puffer und gegebenenfalls Anschnitt dürfen nicht vermischt
werden. Falls später zugeschnitten wird, sind eine exakt berechnete MediaBox,
TrimBox und BleedBox sinnvoll.

Für die aktuelle Rolle „formatgenau drucken“ ist die vorhandene Seitenbox aber
meist ausreichend. Eine BleedBox nur zusätzlich zu beschreiben, ohne Inhalt
über den Beschnitt hinaus zu zeichnen, erzeugt keinen echten Anschnitt.

Die vorhandenen Schnittmarken haben deshalb eine höhere Priorität als weitere
PDF-Boxen: Sie befinden sich auf den Grenzen des aktuellen Sichtfensters
innerhalb der 2,26-Meter-Rolle. Sie müssen entweder klar als
„Ansichtsmarker“ bezeichnet oder für einen tatsächlichen Zuschnitt an die
gewählte Endformatgrenze verschoben werden. Als unbegründete Druckmarken im
fertigen Rollen-PDF sind sie eher problematisch.

### 5. Farbräume, Trapping und Schmuckfarben

**RGB erhalten ist für den heutigen Workflow sinnvoll.**
Der vorhandene Farbeditor, die Designs und QR-Codes arbeiten komplett in RGB.
Ein echtes Druckfarbenworkflow erfordert mehr als eine mathematische
RGB-zu-CMYK-Umrechnung: Farben würden unter einem bestimmten ICC-Profil
umgerechnet und anschließend visuell geprüft.

- **CMYK-/ICC-Konvertierung:** Nur für ein konkretes Druckerei-Preset
  notwendig.
- **Trapping:** Nicht selbst berechnen. `Unknown` ist bis zu einer fachlichen
  Prüfung der sichere Wert.
- **Schmuckfarben:** Für diese Anwendung nicht sinnvoll. Eine Sonderfarbe darf
  nicht aus einem beliebigen Hex-Wert abgeleitet werden; dafür braucht es
  einen benannten Druckauftrag und eine definierte Separation.

### 6. Info-Dictionary und XMP

**Basis-Metadaten sind sinnvoll, volles XMP ist meist Nice-to-have.**
Titel, Ersteller, Produkt und Erstellungsdatum sind kleine, wartbare
Verbesserungen. Sie machen Dateien leichter identifizierbar, erzeugen aber
keine Druckkonformität.

Synchronisierte Info-/XMP-Daten mit PDF/X-Kennungen und `Trapped` sind nur dann
notwendig, wenn tatsächlich ein PDF/X-Ziel ausgegeben und preflight-geprüft
wird. Für den Standardexport reicht normales jsPDF-Metadatenhandling.

### 7. Integrationsoptionen

**Empfehlung: schrittweise, nicht Generator wechseln.**

- **Heute:** jsPDF unverändert als Vektor-Generator verwenden.
- **Kleine Verbesserungen:** Einfache Metadaten und klargestellte
  Schnittgeometrie direkt beim Erzeugen setzen.
- **Späteres Prepress-Ziel:** Browserseitiger, gut getesteter Postprozess für
  Output Intent, XMP und Page Boxes.
- **Neuen Generator bauen oder sofort wechseln:** Nur sinnvoll, wenn ein realer
  Bedarf auch Content-Streams, ICC-Farbräume oder Separationen verlangt.
  Für den aktuellen Export ist das unverhältnismäßig viel Aufwand und Risiko.

### 8. Validierung und Akzeptanzkriterien

**Sehr sinnvoll und die wichtigste praktische Investition.**
Die aktuellen Tests prüfen Zeichenpositionen und Rollenmaße über Stub-Objekte,
nicht die tatsächliche PDF-Struktur. Als nächste sinnvolle Stufen:

1. Tatsächliches PDF aus jsPDF erzeugen und Seite, Seitengröße, eingebettete
   Fonts sowie Text-/Vektorgehalt automatisiert prüfen.
2. Bild-/Geometrieregression für Schnittmarken und vollständigen Rolleninhalt.
3. Fehlerprüfung bei geladenem Benutzerfont.
4. Erst bei PDF/X: objektnahe Prüfung von Output Intent, ICC, Page Boxes und
   synchronisierten Metadaten.
5. Externer PDF/X-Preflight als unverzichtbares Freigabekriterium für jede
   Kombination aus Modus, Profil und Version.

## Empfohlene Priorität

### Notwendig

1. Bedeutung und Position der aktuellen Schnittmarken korrigieren oder
   eindeutig benennen.
2. Einen realen PDF-Strukturtest für Millimetermaß, Seitenzahl, Schriften und
   Zeicheninhalt ergänzen.
3. Standardexport ausdrücklich als RGB-Plotter-PDF ohne PDF/X-Zusage
   kommunizieren.
4. Rollenformat, Kalenderbereich und Puffer in einer dokumentierten
   Geometriefunktion zusammenhalten.

### Sinnvoll / Nice-to-have

1. Einfache, korrekte Titel-/Creator-/Producer-Metadaten.
2. Ein exportiertes Geometrieprotokoll oder eine Druckvorstufenansicht.
3. Ein optionaler Druckerei-Preset mit hochladbarem ICC-Profil.
4. Sichtbarer Warnhinweis, falls PDF/X mangels Profil nicht möglich ist.

### Derzeit eher unnötig oder unsinnig

1. Universelles PDF/X-1a oder PDF/X-4 ohne konkreten Druckpartner.
2. Mitgeliefertes Standard-ICC-Profil als vermeintlich universelle Lösung.
3. RGB-to-CMYK-Näherung als „druckvorstufentauglich“ ausgeben.
4. `Trapped /True` oder `/False` ohne fachliche Überfüllungsprüfung.
5. Schmuckfarben aus bestehenden Hex-Farben ableiten.
6. BleedBox/Anschnitt nur als Metadaten auszeichnen, ohne die Grafik über das
   Endformat hinaus zu erweitern.
7. Kompletten PDF-Generator ersetzen, solange keine Content-Stream-Änderung
   erforderlich ist.

## Entscheidung

Für dieses Projekt ist zunächst ein **zuverlässiger RGB-Plottermodus** der
sinnvolle Zielzustand. Ein gesonderter **PDF/X-Druckereimodus** sollte erst mit
einem konkreten Auftraggeberprofil geplant werden. Dann sind ICC, Page Boxes,
XMP, Farbräume und Preflight gemeinsam umzusetzen; einzelne PDF/X-Metadaten
allein machen die Datei nicht konform.
