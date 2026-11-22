# Farbauswahl überarbeiten

## Ziel und Vorgehen

Alle bestehenden und dynamisch erzeugten Farbfelder erhalten über den gemeinsamen Blossom-Adapter dieselbe kompakte Bedienung: Hex-Eingabe zuerst, danach der farbige Picker-Button. Der zusätzliche Transparenzregler entfällt. Transparente Farben bleiben einschließlich Eingabe und Anzeige als achtstelliger Hexwert erhalten.

Die geöffnete Blütenpalette einschließlich Helligkeitsregler bekommt eine kreisrunde, zum hellen bzw. dunklen UI-Theme passende Hintergrundfläche mit Abstand zu den Bedienelementen und Schlagschatten. Eingabe und Button sollen auch bei schmalen Ansichten möglichst in einer Zeile bleiben.

## Aufgaben

1. **Adapter anpassen:** In `js/blossomColorPicker.js` die Erzeugung, Synchronisation, Ereignisbehandlung und Bereinigung des eigenen Alpha-Sliders entfernen. Den eingebauten Blossom-Alpha-Slider deaktiviert lassen. Hex-Eingabe vor dem Picker-Host anordnen; bestehende Alpha-Daten, sechs- und achtstellige Hexwerte, Events, dynamische Felder, Labels und Disabled-Zustände weiter unterstützen.
2. **Darstellung gestalten:** In `css/app.css` die Zeile ohne unnötigen Umbruch gestalten und alte Alpha-Styles entfernen. Die geöffnete `.bcp-container`-Palette mit einem ausreichend großen, kreisrunden themenabhängigen Hintergrund und Schlagschatten versehen; Blüten und Helligkeitsregler müssen mit sichtbarem Abstand innerhalb der Fläche liegen und bedienbar bleiben. Geschlossenen Zustand, Portal, adaptive Positionierung, Fokus und kleine Viewports berücksichtigen; bei Bedarf die Positionierung des Hintergrunds passend zur Blossom-Geometrie anpassen.
3. **Dokumentation aktualisieren:** In `README.md` die Bedienung mit sechs- bzw. achtstelligen Hexwerten und ohne Transparenz-Slider präzisieren, ohne Transparenzunterstützung in Vorschau und Export als entfernt darzustellen.
4. **Regressionen prüfen:** `tests/blossomColorPicker.test.js` auf die neue Reihenfolge und das Fehlen des Sliders anpassen; gezielt transparente Hexwerte, Alpha-Erhalt beim Farbwechsel, Synchronisierung und dynamische Instanzen abdecken. Den passenden Node-Test und bei Bedarf weitere betroffene Tests ausführen.
5. **Visuell und funktional überprüfen:** Im Browser statische Farbfelder, dynamische Terminfarben und das Terminmodal in hellem und dunklem Theme testen. Palette einschließlich Helligkeitsregler, Hintergrund, Schatten, Abstände, Randpositionen und schmale Ansicht sowie Tastaturbedienung und Farbänderungen kontrollieren.

## Hinweise

- Transparenz bleibt bearbeitbar über `#RRGGBBAA`; gespeicherte transparente Farben dürfen beim bloßen Öffnen oder bei Farbwahl nicht verloren gehen.
- Separate fachliche Deckkraftregler, die keine Farbpicker-Alpha-Slider sind, bleiben unverändert.
- Die vorhandenen unabhängigen Änderungen im Arbeitsverzeichnis bleiben unangetastet.
