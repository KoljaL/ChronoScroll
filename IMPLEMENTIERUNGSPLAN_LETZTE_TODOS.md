# Implementierungsplan für die letzten Todos

Dieser Plan ordnet die offenen Punkte aus [lastToDo.md](./lastToDo.md) in
aufeinander aufbauende, einzeln umsetzbare Arbeitspakete. Erst die offenen
Entscheidungen beantworten, dann die jeweiligen Schritte implementieren und
prüfen. Die Schritte innerhalb eines Pakets sollten zusammen umgesetzt werden,
wenn sie dieselbe Oberfläche oder denselben Datenfluss betreffen.

## Reihenfolge und Abhängigkeiten

1. Maße und Standardwerte festlegen.
2. Gemeinsame Farb- und Stilgrundlagen sowie Kalenderstruktur umsetzen.
3. Kalenderdarstellungen, Druckfarben und Termin-Defaults anpassen.
4. QR-Code in Vorschau und Abstandseinstellung ergänzen.
5. Vorlagen-Links und Erklärungstext überarbeiten.
6. Nicht mehr benötigte Funktionen kontrolliert entfernen.
7. Alle betroffenen Bereiche integriert prüfen.

Die Pakete 2 bis 5 können nach Klärung ihrer Fragen grundsätzlich unabhängig
voneinander umgesetzt werden. Paket 6 sollte separat und erst nach einer
Referenzsuche ausgeführt werden, damit keine noch benötigte Funktion entfernt
wird.

## 1. Maße, CAD-Offset und Standardwerte

**Ziel:** Sichtfenster-Maße eindeutig als Papier- bzw. Druckgröße behandeln und
die dazugehörigen Werte konsistent in Kalender, CAD-Darstellung und Stückliste
verwenden.

### Schritte

- [ ] Bestehende Berechnung und Anzeige von Höhe und Breite des
  Drei-Monats-Sichtfensters sowie die CAD-Darstellung und Stückliste
  nachvollziehen.
- [ ] CAD-Offset für die Maße ergänzen: standardmäßig `+2 mm` für die Höhe und
  `+4 mm` für die Breite.
- [ ] Die Standardhöhe der Schreibplatte auf `30 cm` und die Standardbreite
  auf `42 cm` setzen.
- [ ] Einheiten und Rundung in Eingabefeldern, Vorschau, CAD und Stückliste
  abstimmen.
- [ ] Prüfen, dass einstellbare Maße weiterhin korrekt übernommen werden und
  keine doppelte Offset-Anwendung entsteht.

### Offene Fragen – bitte vor Umsetzung beantworten

- **Was bezeichnet der Offset genau?** Ist er ein zusätzlicher Rand bzw.
  Zuschlag auf das Sichtfenstermaß, oder verändert er die tatsächliche
  Schreibplatten-/Bauteilgröße?
  - Antwort: `Die Maße der Rückwand / Schreibplatte sind exakt die des Sichtfensters. Die beiden Offset Werte sollen die Rückwand in Höhe und Breite vergrößern. Default sollen +2 mm für die Höhe und +4 mm für die Breite gelten. Die Offsetwerte sollen in der CAD Ansicht jeweils unter Breite Sichtfenster bzw Höhe Sichtfenster geändert werden. Dazu auch die bestehenden Beschriftungen entsprechend anpassen.`
- **Wo soll der Offset gelten?** Nur in CAD-Darstellung und Stückliste, wie im
  Todo genannt, oder auch in Eingabefeld, Kalender-Vorschau und Export?
  - Antwort: `Der Offset gilt nur in CAD-Darstellung und Stückliste. In Eingabefeld, Kalender-Vorschau und Export wird das Sichtfenstermaß ohne Offset verwendet.`
- **Sollen die `30 cm` × `42 cm` Standardwerte nur für neue Sitzungen gelten,
  oder auch bei bereits gespeicherten Vorlagen?**
  - Antwort: `Für beide, also sowohl für neue Sitzungen als auch für bereits gespeicherte Vorlagen.`

### Abnahme

- Standardwerte werden an allen betroffenen Stellen konsistent angezeigt.
- CAD und Stückliste weisen den bestätigten Offset genau einmal aus.
- Kalendermaß und gedruckte Papiergröße bleiben nachvollziehbar und stimmen
  mit der festgelegten Bedeutung des Offsets überein.

## 2. BlossomPicker und Kalenderfarben

**Ziel:** Den BlossomPicker als verständliches, gut bedienbares Werkzeug für
die Farbwahl gestalten und ihn konsistent in die Kalenderoptionen integrieren.

### Schritte

- [ ] Picker-Darstellung überarbeiten: Keine Blütenblätter, 
  sondern Kreise ohne sichtbare Adern, größere Darstellung und passende Hintergründe im Darkmode.
- [ ] Farbeingabefeld dauerhaft anzeigen, sodass der Farbwert sowohl direkt
  bearbeitet als auch abgelesen werden kann.
- [ ] Die gewählte Farbe als Kreis neben dem Farbeingabefeld anzeigen, dieser Kreis ist auch der Button zum Öffnen des Pickers.
- [ ] Drucktaugliche, dezente Farbpresets für Tages- und Ereignisfarben, sowie schriften und Linien
  zusammenstellen; höhere Transparenz berücksichtigen.
- [ ] Dieselben geeigneten Presets in alle relevanten Kalender-Farbwahlen
  anbieten.
- [ ] In „Kalender – Struktur“ die Wahl zwischen Papierfarbe und freier Farbe
  durch Picker ersetzen, da dieser auch  Transparenz unterstützt.
- [ ] Papierfarbe standardmäßig auf Weiß bzw. transparent setzen und die
  Standardfarben für Tages- und Ereignisfarben an die bestätigte Farbpalette
  anpassen.

### Offene Fragen – bitte vor Umsetzung beantworten

- **Welche der beiden Papierfarben ist der Standard: Weiß oder transparent?**
  - Antwort: `Weiß`
- **Soll Transparenz die bisherige Papierfarben-/Freifarbenauswahl vollständig
  ersetzen oder zusätzlich zu einer weiterhin wählbaren Papierfarbe angeboten
  werden?**
  - Antwort: `Der Picker ersetzt die bisherige Papierfarben-/Freifarbenauswahl vollständig.`
- **Soll Transparenz für Tages- und Ereignisfarben einen konkreten
  Standardwert erhalten? Falls ja, welchen?**
  - Antwort: `11%`

### Abnahme

- Farbwert und ausgewählte Farbe sind in hellem und dunklem Theme jederzeit
  erkennbar und direkt bedienbar.
- Presets sind in den vorgesehenen Farbwahlfeldern verfügbar.
- Transparenz und Papierfarbe verhalten sich entsprechend der beantworteten
  Fragen; bestehende Vorlagenwerte werden nicht unbemerkt verfälscht.

## 3. Kalenderstruktur und Reihenfolge der Einstellungen

**Ziel:** Die zusätzlichen typografischen Gestaltungsmöglichkeiten ergänzen
und die wichtigsten Einstellungen an den Anfang der Seitenleiste stellen.

### Schritte

- [ ] Einstellbare Textfarbe und Textgröße für Kalenderwochen ergänzen.
- [ ] Einstellbare Deckkraft (Opacity) für Mondphasen ergänzen.
- [ ] Einstellbare Textfarbe und Textgröße für Monatsköpfe ergänzen.
- [ ] Monatskopf-Einstellungen als ersten Abschnitt in der Seitenleiste
  anzeigen.
- [ ] Die neuen Werte in Vorschau und unterstützten Exporten berücksichtigen;
  Abweichungen zwischen Vorschau, PDF und SVG dokumentieren oder angleichen.

### Abnahme

- Jede neue Einstellung wirkt auf das zugehörige Element und lässt sich
  unabhängig von anderen Farbeinstellungen ändern.
- Monatskopf-Einstellungen erscheinen zuerst in der Seitenleiste.
- Vorschau und Export zeigen dieselben Werte, soweit das jeweilige Format die
  Einstellung unterstützt.

## 4. Kalenderdarstellung, Farbwelten und druckfreundliche Bedienung

**Ziel:** Lesbarkeit der Kalenderdarstellungen verbessern und die Stilwahl
übersichtlicher sowie tastaturbedienbar machen.

### Schritte

- [ ] Schriftgrößen der Kalenderdarstellungen außer „Klassisch“ prüfen und so
  anpassen, dass sie in der Vorschau lesbar sind.
- [ ] Den Zusatz „frei gestaltbar“ aus den Varianten entfernen, da alle
  Varianten frei gestaltbar sind.
- [ ] Kalenderdarstellung als tastaturbedienbares Dropdown anbieten.
- [ ] Für „Farbwelt“ eine treffendere Bezeichnung wählen, die auch
  Stil-/Schriftaspekte umfasst.
- [ ] Mehr Beispiele und Presets für unterschiedliche Farb- und Stilwelten
  bereitstellen.
- [ ] Die Auswahl der Farb-/Stilwelten ebenfalls als tastaturbedienbares
  Dropdown anbieten.
- [ ] „Druckfarben sparen“ direkt nach der Farb-/Stilwelt-Auswahl einordnen.
- [ ] Prüfen, dass Druckfarben sparen mit den neuen Presets und
  Kalenderdarstellungen weiterhin sinnvoll zusammenarbeitet.

### Offene Fragen – bitte vor Umsetzung beantworten

- **Welche neue Bezeichnung soll "Kalenderdarstellung" ersetzen?**
  - Antwort: `Darstellung`
- **Welche neue Bezeichnung soll „Farbwelt“ ersetzen?**
  - Antwort: `Farben`
- **Welche zusätzlichen Stilwelten oder konkreten Presets sollen enthalten
  sein? Beispiele/Wünsche:**
  - Antwort: `Von klassisch bis modern`
- **Soll „Druckfarben sparen“ nur im Seitenleistenabschnitt verschoben werden,
  oder auch in anderen Ansichten bzw. Hilfetexten?**
  - Antwort: `Nur im Seitenleistenabschnitt`

### Abnahme

- Alle Darstellungen sind bei vergleichbarer Vorschaugröße gut lesbar.
- Beide Dropdowns sind mit Tastatur bedienbar und zeigen die aktive Auswahl
  verständlich an.
- „Druckfarben sparen“ steht unmittelbar nach den Farb-/Stilwelten.

## 5. QR-Code in der Vorschau

**Ziel:** Den QR-Code auch in der Kalender-Vorschau zeigen und seinen Abstand
zum letzten Monat konfigurierbar machen.

### Schritte

- [ ] Ermitteln, wo der QR-Code für Vorschau und Export erzeugt bzw. platziert
  wird.
- [ ] QR-Code in die Vorschau integrieren.
- [ ] Eine Abstandseinstellung zwischen letztem Monat und QR-Code ergänzen;
  Standardwert `40 mm`.
- [ ] Sicherstellen, dass der Abstand in Vorschau und den betroffenen
  Exportformaten gleich interpretiert wird.
- [ ] Verhalten bei deaktiviertem QR-Code und bei schmalen bzw. kleinen
  Druckmaßen prüfen.

### Offene Frage – bitte vor Umsetzung beantworten

- **Soll der QR-Code immer angezeigt werden, oder soll es zusätzlich eine
  Ein-/Aus-Option geben?**
  - Antwort: `Ein-/Aus-Option`

### Abnahme

- QR-Code und Abstand sind in der Vorschau sichtbar und korrekt einstellbar.
- `40 mm` wird als Standard verwendet.
- Vorschau und Export weichen bei der QR-Code-Position nicht unbeabsichtigt
  voneinander ab.

## 6. Vorlagen und Verweise

**Ziel:** Vorlagen-Links verständlich benennen und die Verweise auf aktuelle
und kommende Jahresversionen eindeutig machen.

### Schritte

- [ ] URLs nicht als rohe URL-Zeichenfolgen darstellen, sondern als
  aussagekräftige Linktexte.
- [ ] Den ersten Link auf die derzeitige Vorlage verweisen lassen.
- [ ] Den zweiten Link auf die Vorlage für das nächste Jahr verweisen lassen.
- [ ] Eine kurze Erklärung zum Speichern von Vorlagen ergänzen.
- [ ] Links und Erklärung auf korrekte Ziele und verständliche Darstellung
  prüfen.

### Offene Frage – bitte vor Umsetzung beantworten

- **Welcher genaue Erklärungstext soll das Speichern von Vorlagen erläutern?
  Zu klären ist insbesondere, dass Vorlagen im lokalen Browserspeicher liegen
  können.**
  - Antwort: `Ja, nur ein kurzer Satz zur Erklärung des lokalen Browserspeichers`

### Abnahme

- Beide Links sind verständlich beschriftet und zeigen auf die jeweils
  vorgesehene Jahresvorlage.
- Der Erklärungstext beschreibt das tatsächliche Speicherverhalten korrekt.

## 7. Standard für Ferien

**Ziel:** Ferien zunächst deaktiviert anzeigen.

### Schritte

- [ ] Den Standardzustand für Ferien auf deaktiviert setzen.
- [ ] Prüfen, ob „deaktiviert“ nur die Anzeige oder auch das Erzeugen/Laden von
  Ferienterminen betrifft.
- [ ] Bestehende gespeicherte Vorlagen und den manuellen Wechsel auf aktiviert
  prüfen.

### Offene Frage – bitte vor Umsetzung beantworten

- **Bedeutet „Ferien default deaktiviert“, dass Ferien nicht automatisch
  erzeugt werden, oder werden sie weiter erzeugt und lediglich ausgeblendet?**
  - Antwort: `Ferien sollen erst erzeugt werden, wenn der Benutzer es möchte. Dies im Text oben erläutern.`

### Abnahme

- Bei einer neuen Sitzung entspricht der Ferienzustand der beantworteten
  Frage.
- Ferien lassen sich weiterhin gezielt aktivieren; gespeicherte Vorlagen
  erhalten das neue Verhalten.

## 8. Nicht mehr benötigte Funktionen entfernen

**Ziel:** Die ausdrücklich als entbehrlich markierten Bedienelemente entfernen,
ohne gemeinsam genutzte Funktionen oder Modale zu beschädigen.

**Vorgehen:** Für jeden Punkt zuerst alle IDs, Handler, Funktionen, Modal-
Referenzen und Tests suchen. Nur eindeutig ausschließlich dafür verwendeten
Code entfernen. Gemeinsam genutzte Logik behalten und betroffene Tests
aktualisieren bzw. ergänzen.

### Schritte

- [ ] „Zuschnittliste öffnen“ im Bereich „Kalender – Maße“ entfernen:
  Button, ausschließlich zugehörige Öffnungsfunktion, Modal und ausschließlich
  dazugehörige Referenzen.
- [ ] Bei „Gesamte Rollenlänge“ die Länge und die Höhe der Schreibplatte nur
  in Zentimetern anzeigen.
- [ ] Funktion und Button zum Ein- und Ausklappen der Seitenleiste entfernen.
- [ ] In „Kalender – Struktur“ die Personenspalten je Tag und die Hilfslinien
  zum Schreiben entfernen.
- [ ] Vor jedem Löschen prüfen, ob Export, Vorschau, gespeicherte Vorlagen oder
  andere Dialoge auf dieselbe Funktion zugreifen.
- [ ] Übrig gebliebene Beschriftungen, Zustände und Tests bereinigen, ohne gemeinsam genutzte Logik zu entfernen.

### Abnahme

- Es gibt keine verwaisten Event-Handler, DOM-Referenzen oder ausschließlich
  für die entfernten Bedienelemente genutzten Zustände.
- Gemeinsam genutzte Funktionen und Modale funktionieren weiter.
- Die verbleibende Maßeinheitendarstellung ist eindeutig und durchgängig in
  Zentimetern.

## 9. Titeltext-Verwendung klären

**Ziel:** Vor einer möglichen Änderung der Titeltext-Funktion ihren Zweck
feststellen und dokumentieren.

### Klärung

- [ ] Verwendungsorte des Titeltexts in Vorschau, PDF, SVG und Vorlagen
  nachvollziehen.
- [ ] Festhalten, welche Auswahl oder Einstellung den Titeltext aktiviert.
- [ ] Entscheidung dokumentieren, ob die Funktion bestehen bleibt, anders
  benannt oder entfernt wird.

### Antwortfeld

- **Entscheidung / gewünschtes Verhalten:**
  - Antwort: `Titeltext soll frei wählbar sein und für den Dateuanmen bei allen exportierten Formaten verwendet werden. Sowie den im Browser gespeicherten Vorlagen. Alle bestehenden Vorlagen werden entsprechend angepasst. Die Bezeichnung "Titeltext" soll in "Kalendername" an allen Stellen geändert werden. Außerdem soll das Input Feld direkt unter dem Kalenderjahr platziert werden.`

### Abnahme

- Die Funktion und ihr Anwendungsfall sind verständlich beschrieben.
- Eine daraus folgende Änderung wird erst nach der Entscheidung umgesetzt.

## 10. Gemeinsame Abschlussprüfung

- [ ] Alle beantworteten Fragen sind in den Implementierungsschritten
  berücksichtigt; offene Antworten blockieren nur die jeweils betroffenen
  Entscheidungen.
- [ ] Neue Standardwerte in einer frischen Sitzung und nach Laden einer
  gespeicherten Vorlage prüfen.
- [ ] Vorschau, PDF/SVG (soweit betroffen), Kalender und CAD/Stückliste
  gegeneinander prüfen.
- [ ] Tastaturbedienung der Dropdowns sowie Bedienbarkeit im hellen und
  dunklen Theme prüfen.
- [ ] Gezielte Tests für geänderte Maße, Darstellung, Einstellungen und
  entfernte Funktionen ausführen.
- [ ] Gesamttests und `git diff --check` ausführen.
