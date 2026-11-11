# Funktionsübersicht CronoScroll

Diese Bestandsaufnahme dient dazu, den Funktionsumfang zu prüfen und überflüssige Funktionen zu markieren. CronoScroll erzeugt aus den Maßen einer Schreibplatte einen 14-monatigen Rollkalender: Dezember des Vorjahres, das Zieljahr und Januar des Folgejahres. Er kann für einen selbst gebauten Rahmen gestaltet, in der Vorschau betrachtet und exportiert werden.

## Leseschlüssel

- **Noch benötigt?**: `[ ]` ist bewusst offen; zum Markieren in `[x]` ändern. Die Markierung ist eine Entscheidungshilfe und keine Bewertung durch die Anwendung.
- **README** und **Webseite** sind zwei getrennte Vergleichsspalten: **Ja** = ausdrücklich oder inhaltlich beschrieben bzw. angeboten, **Teilw.** = nur ein Teil oder mit wesentlicher Einschränkung, **Nein** = nicht beschrieben bzw. nicht vorhanden. „Webseite“ umfasst neben [index.html](./index.html) auch die von ihr eingebundenen JavaScript-Dateien.
- **Ja / Nein** bedeutet nur in der README beschrieben, **Nein / Ja** nur auf der Webseite angeboten. Die Spalten sind kein Gütesiegel: Wichtige Abweichungen stehen in der letzten Spalte.
- Stand: Abgleich von [README.md](./README.md), [index.html](./index.html) und der aktuellen Implementierung in [js/](./js/); [OLD](./OLD/) wurde nicht ausgewertet. Das ist eine statische Bestandsaufnahme, keine vollständige Browser- und Druckprüfung.

## 1. Anwendung und Vorschau bedienen

Diese Funktionen steuern den Arbeitsbereich und die Ansicht, nicht die tatsächlichen Papiermaße.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Anwendung im Browser öffnen | Ja | Ja | Lokal über `index.html` oder über GitHub Pages; für das Laden externer Bibliotheken und Styles können Netzwerkzugriff und deren Verfügbarkeit erforderlich sein. |
| [ ] | Seitenleiste ein- und ausklappen | Nein | Ja | Schafft mehr Platz für die Vorschau. |
| [ ] | Zwischen den Einstellungsreitern wechseln | Nein | Ja | Maße, Layout, Stil, Termine und Vorlagen. |
| [ ] | Drei-Monats-Schreibplatte anzeigen | Ja | Ja | Zeigt drei aufeinanderfolgende Monats­spalten mit Datumsbereich. |
| [ ] | Drei-Monats-Fenster monatlich zurück- und vorwärtsbewegen | Ja | Ja | Über Schaltflächen oder Pfeiltasten; die Startposition ist auf die möglichen Drei-Monats-Ausschnitte innerhalb der 14 Monate begrenzt. |
| [ ] | Ganze 14-monatige Druckrolle anzeigen | Ja | Ja | Einschließlich Vor- und Nachlauf; das aktuelle Drei-Monats-Fenster ist rot markiert. |
| [ ] | Drei-Monats-Fenster in der Rollenansicht ziehen | Nein | Ja | Das rote Fenster lässt sich mit der Maus monatsweise verschieben. |
| [ ] | Per Klick auf einen Monat zur Drei-Monats-Ansicht navigieren | Ja | Nein | Die README verspricht Klick-zu-Monat-Navigation. Ein Klick auf eine gültige Tageszelle öffnet stattdessen den Dialog für einen neuen Termin. |
| [ ] | Vorschau vergrößern und verkleinern | Teilw. | Teilw. | Über `+`/`−` sowie Strg-/Cmd-Mausrad. README: stufenlos 20–300 %; Code: Schritte von 20 bzw. 10 Prozentpunkten und Grenzen 15–350 %. Fit All kann bis 12 % gehen. |
| [ ] | Zoom auf 100 % zurücksetzen | Ja | Ja | Beim Wechsel zur Schreibplattenansicht wird ebenfalls auf 100 % zurückgesetzt. |
| [ ] | Ganze Rolle einpassen („Fit All“) | Ja | Teilw. | Nur in der Rollenansicht; die Berechnung ist auf 12–100 % begrenzt, daher passt eine sehr lange Rolle nicht zwingend vollständig in den verfügbaren Bereich. |
| [ ] | Vorschaubereich scrollen | Nein | Ja | Bei größeren Ansichten über den scrollbaren Arbeitsbereich. |

## 2. Jahr, Maße und Rollengeometrie

Die Maße bestimmen die Kalendergeometrie und die Basis der Zuschnittliste. Die angegebenen Standardwerte entsprechen der Anwendung.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Zieljahr wählen | Ja | Ja | Eingabefeld mit HTML-Grenzen 1900–2100; der Jahreswechsel berechnet Feiertage und Ferien neu und ersetzt die bisherige Terminliste. |
| [ ] | Sichtbare Höhe der Schreibplatte einstellen | Ja | Ja | Standard 32 cm; die Tageshöhe ergibt sich aus der Höhe geteilt durch 32. |
| [ ] | Breite des Drei-Monats-Sichtfensters einstellen | Ja | Ja | Standard 42 cm; eine Monatsspalte ist ein Drittel davon breit. |
| [ ] | Vorlauf und Nachlauf getrennt einstellen | Teilw. | Ja | Standard jeweils 15 cm; die README beschreibt einen gemeinsamen Puffer. **Achtung:** Der Geometriecode ersetzt den Wert `0` durch 15 cm. |
| [ ] | Automatisch berechnete Monatsbreite, Tageshöhe und Rollenlänge ablesen | Ja | Ja | Bei Standardmaßen 14 cm, 1 cm und 226 cm; die Webseite zeigt zusätzlich den Jahresbereich und den Status der aktuellen Ansicht. |
| [ ] | Inhalt des linken Vorlaufs auswählen | Nein | Teilw. | Vorschau: Montagebereich, Titel, Jahresübersicht oder Notiz-/To-do-Bereich. PDF berücksichtigt nur Titel oder Montagebeschriftung; SVG nur Montagebeschriftung. |
| [ ] | Eigenen Titel für den Vorlauf eingeben | Nein | Teilw. | In Vorschau und PDF bei Auswahl „Großer Kalendertitel“; nicht im SVG. |
| [ ] | Inhalt des rechten Nachlaufs auswählen | Nein | Teilw. | Vorschau: Montagebereich oder Jahresrückblick mit Notizlinien; PDF und SVG zeigen stattdessen Montagebeschriftung. |

## 3. Kalenderlayout

Diese Einstellungen beeinflussen die Darstellung der Tageszeilen und Monatsköpfe. Nicht alle Exportformate übernehmen sie gleichermaßen.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Tageszeilen in Personen-Spalten aufteilen | Nein | Ja | Eine bis vier Spalten; in Vorschau, PDF und SVG vorhanden, mit unterschiedlichen Linienstilen. |
| [ ] | Schreiblinien pro Tag einstellen | Nein | Ja | Keine bis drei Hilfslinien; auch in PDF und SVG. |
| [ ] | Stil der Schreiblinien wählen | Nein | Teilw. | Gestrichelt, gepunktet oder durchgezogen in der Vorschau; PDF zeichnet durchgezogene, SVG gestrichelte Linien unabhängig von der Auswahl. |
| [ ] | Kalenderwochen ein- und ausblenden | Nein | Ja | ISO-8601-Kalenderwochen an Montagen; auch in PDF und SVG. |
| [ ] | Mondphasen ein- und ausblenden | Nein | Teilw. | Piktogramme in der Vorschau; die eigenständigen PDF- und SVG-Renderer zeichnen keine Mondphasen. |
| [ ] | Schnitt- und Passermarken ein- und ausblenden | Nein | Teilw. | In Vorschau und PDF gezeichnet; SVG enthält keine entsprechenden Marken. Am Seitenrand gezeichnete Teile können abgeschnitten werden. |
| [ ] | Textstil der Monatsköpfe wählen | Nein | Teilw. | Großbuchstaben, gemischt oder nummeriert in Vorschau und PDF; SVG verwendet immer Großbuchstaben. |
| [ ] | Monatsköpfe ausrichten | Nein | Ja | Zentriert oder linksbündig; auch in PDF und SVG. |

## 4. Stil und Typografie

Farben und Schrift bestimmen das Erscheinungsbild. Design-Welten ändern mehrere Stilwerte zugleich; einzelne Werte lassen sich anschließend separat einstellen.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Eine Design-Welt auswählen | Nein | Ja | Minimalist, Holz & Sepia, Blueprint oder Wald & Salbei; setzt Farben und Schriftfamilie. |
| [ ] | Mitgelieferte Schrift auswählen | Ja | Teilw. | Lato, PT Serif und Cousine sowie eine weitere Lato-Auswahl; Vorschau und PDF verwenden eingebettete Schriften, SVG eine fest vorgegebene Systemschrift. |
| [ ] | Eigene TTF-Schrift lokal laden | Ja | Teilw. | Für Vorschau und PDF; eine Datei für normale, fette und kursive Stellen. Nach Neuladen erneut auswählen; SVG übernimmt sie nicht. Erkennbare übergroße Kerning-Untertabellen lösen eine Warnung aus. |
| [ ] | Schriftgröße der Monatsköpfe skalieren | Ja | Teilw. | In Vorschau und PDF; SVG verwendet eine feste Größe. |
| [ ] | Schriftgröße der Tageszeilen skalieren | Ja | Teilw. | In Vorschau und PDF; SVG verwendet eine feste Größe. |
| [ ] | Papierfarbe wählen | Nein | Ja | Hintergrund des Kalenders; die Puffer haben eine eigene feste Hintergrundfarbe. |
| [ ] | Stärke der Rasterlinien einstellen | Ja | Ja | Eingabe in Millimetern; Vorschau skaliert auf Bildschirmdarstellung. |
| [ ] | Stärke des Außenrahmens einstellen | Ja | Ja | Eingabe in Millimetern; Vorschau skaliert auf Bildschirmdarstellung. |
| [ ] | Rasterfarbe wählen | Ja | Ja | Für Kalenderlinien. |
| [ ] | Standard-Textfarbe für Werktage wählen | Ja | Ja | Die Monatskopf- und Terminfarben können davon abweichen. |
| [ ] | Samstags-Hintergrund und -Schrift getrennt wählen | Teilw. | Teilw. | Vorschau und PDF verwenden beide Werte; SVG verwendet für die Samstagsschrift die Sonntagsschriftfarbe. |
| [ ] | Sonntags-Hintergrund und -Schrift getrennt wählen | Teilw. | Ja | Die README nennt Wochenendfarben allgemein. |

## 5. Feiertage, Ferien und eigene Termine

Termine erscheinen in der Liste und auf passenden Kalendertagen. Die Werte sollten vor dem Drucken geprüft werden; die Anwendung ist keine amtliche Feiertags- oder Ferienquelle.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Land für Feiertage und Ferien auswählen | Teilw. | Ja | Deutschland, Österreich oder Schweiz; die README beschreibt nur Deutschland. Ein Wechsel ersetzt die bestehende Terminliste. |
| [ ] | Bundesland bzw. Region auswählen | Teilw. | Ja | 16 deutsche und 9 österreichische Länder, aber nur 9 auswählbare Schweizer Kantone; ein Wechsel ersetzt die bestehende Terminliste. Standard: Nordrhein-Westfalen. |
| [ ] | Feiertage automatisch für den 14-Monats-Zeitraum berechnen | Ja | Teilw. | Bewegliche Feiertage werden über Ostern berechnet, Übergangsmonate berücksichtigt. Die hinterlegten Regeln sind vereinfacht; die README-Zusage „alle gesetzlichen Feiertage“ ist damit nicht garantiert. |
| [ ] | Schulferien laden | Ja | Teilw. | Oster-, Sommer-, Herbst- und Weihnachtsferien, für BW/BY zusätzlich Pfingstferien. Es sind modellierte Zeiträume, keine verifizierten amtlichen Ferientermine. |
| [ ] | Feiertage und Ferien neu berechnen | Ja | Ja | Schaltfläche ersetzt die gesamte Terminliste, einschließlich eigener und importierter Termine. Auch Jahr-, Länder- und Regionswechsel tun dies. |
| [ ] | Terminliste nach Kategorien filtern | Nein | Teilw. | Alle, Feiertage und Ferien funktionieren als Kategorien; „Eigene“ zeigt aufgrund der Filterbedingung derzeit auch andere Kategorien. |
| [ ] | Termine suchen | Nein | Ja | Suche nach Titel oder Beginn-Datum in der Terminliste. |
| [ ] | Eigenen Termin oder Zeitraum über „Neu“ anlegen | Ja | Ja | Bezeichnung, Beginn, inklusive Ende und Farbe; Vorgabe ist der 1. Juni des Zieljahres. |
| [ ] | Per Klick auf einen Kalendertag einen Termin anlegen | Nein | Ja | In beiden Ansichten für gültige Tageszellen; der angeklickte Tag wird als Beginn und Ende vorbelegt. |
| [ ] | Termine in der Liste bearbeiten | Ja | Ja | Titel, Beginn, Ende und Farbe auch bei automatisch erzeugten oder importierten Einträgen. |
| [ ] | Termine einzeln löschen | Nein | Ja | Gilt auch für Feiertage und Ferien; eine Neuberechnung stellt generierte Einträge wieder her. |
| [ ] | Mehrere Termine am selben Tag anzeigen | Nein | Teilw. | In der Vorschau wird ein bevorzugter Eintrag beschriftet und ein zusätzlicher Farbindikator angezeigt; gesetzliche Feiertage haben Vorrang. Nicht alle Einträge werden einzeln im Kalender ausgeschrieben. |
| [ ] | Termine aus einer `.ics`-Datei importieren | Nein | Teilw. | Fügt erkannte Ereignisse hinzu; verarbeitet im Wesentlichen Titel und Datum, keine Wiederholungsregeln oder Uhrzeiten. Das exklusive iCal-Enddatum wird beim Import nicht in ein inklusives umgerechnet. |
| [ ] | Terminliste als `.ics` exportieren | Nein | Teilw. | Exportiert alle aktuellen Einträge als Ganztagstermine, unabhängig vom Listenfilter; keine Uhrzeiten oder Wiederholungsregeln. |

## 6. Vorlagen und Speicherung

Vorlagen liegen im lokalen Browserspeicher und sind an den jeweiligen Browser bzw. dessen Daten gebunden.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Aktuellen Stand unter einem Namen speichern | Ja | Ja | Speichert den Anwendungszustand einschließlich Terminliste; ein bestehender Name wird überschrieben. |
| [ ] | Gespeicherte Vorlage laden | Ja | Ja | Stellt gespeicherte Einstellungen und Termine wieder her. Eigene TTF-Dateien selbst werden nicht mitgespeichert und müssen nach Neuladen erneut gewählt werden. |
| [ ] | Gespeicherte Vorlage löschen | Ja | Ja | Entfernt die betreffende Vorlage aus dem lokalen Browserspeicher. |

## 7. Druckdaten und Bauunterlagen

Die Exporte werden aus dem aktuellen Stand erzeugt. Vorschau, PDF, SVG und PNG verwenden nicht überall dieselbe Darstellung; insbesondere die Einschränkungen bei Pufferinhalten, Mondphasen und Schrift sind oben aufgeführt.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Rollen-PDF für Plotter herunterladen | Ja | Ja | Vektor-PDF `Rollkalender-[Jahr].pdf` mit deutschem Kalendarium und eingebetteter Schrift; benötigt jsPDF. |
| [ ] | Rollen-SVG herunterladen | Nein | Ja | `Rollkalender-[Jahr].svg`; verwendet einen eigenen Renderer und übernimmt nicht alle Vorschau-Einstellungen. |
| [ ] | Rollen-PNG herunterladen | Nein | Teilw. | Als „300 DPI“ angeboten und aus der Rollenansicht gerendert. Das rote Sichtfenster wird mitgezeichnet; die tatsächliche Pixelgröße hängt auch vom Geräte-Pixelverhältnis ab. |
| [ ] | Dynamische Material- und Zuschnittliste anzeigen | Teilw. | Ja | Zeigt Maße für zwei Tragleisten, zwei Rundstäbe, eine Schreibplatte, die Papierbahn und Tageszeilenhöhe. Die README gibt Bauempfehlungen, beschreibt aber keinen interaktiven Dialog. |
| [ ] | Zuschnittliste in die Zwischenablage kopieren | Nein | Ja | Text mit Maßen und Materialvorschlägen; setzt verfügbare Zwischenablageberechtigung voraus. |

## 8. Physischer Rollkalender

Diese Handlungen gehören zum in der README beschriebenen Gesamtkonzept, sind aber keine Bedienfunktionen der Webseite.

| Noch benötigt? | Funktion | README | Webseite | Details / Einschränkungen |
|---|---|---|---|---|
| [ ] | Rahmen und Schreibplatte selbst bauen | Ja | Nein | README mit Konstruktionsskizzen und Materialempfehlungen; die Webseite unterstützt lediglich mit einer Zuschnittliste. |
| [ ] | Papierbanner drucken und in den Rahmen einsetzen | Ja | Nein | Physischer Druck und Montage erfolgen außerhalb der Webanwendung. |
| [ ] | Papierrolle auf- und abwickeln | Ja | Nein | Physische Walzen bewegen das Banner über die Schreibplatte; die Webseite simuliert das Drei-Monats-Fenster. |
| [ ] | Termine handschriftlich auf dem Kalender notieren | Ja | Nein | Geschieht auf dem gedruckten Banner; die digitalen Termine der Webseite sind davon unabhängig. |
