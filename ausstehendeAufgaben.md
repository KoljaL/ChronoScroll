Ich gleiche den Plan mit dem aktuellen Stand ab und unterscheide dabei zwischen vollständig erledigten, teilweise umgesetzten und noch offenen Punkten.

Read , lines 1 to 323
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/IMPLEMENTIERUNGSPLAN_LETZTE_TODOS.md",
  "view_range": [
    1,
    323
  ]
}

Ran terminal command: git --no-pager status --short --branch && git --no-pager diff --stat

Search for `qrEnabled|qrGapMm|drawCoverageQr|qrcode|backpanelOffset|windowWidth|windowHei...`

Search for `petalShape|petalStyle|showAlphaSlider|normalizeHex|cronoscroll-color-input-na...`

Read , lines 365 to 400
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/js/app.js",
  "view_range": [
    365,
    400
  ]
}

Read , lines 655 to 705
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/js/app.js",
  "view_range": [
    655,
    705
  ]
}

Read , lines 1140 to 1175
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/js/app.js",
  "view_range": [
    1140,
    1175
  ]
}

Read , lines 450 to 545
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/js/canvasRenderer.js",
  "view_range": [
    450,
    545
  ]
}

Read , lines 120 to 153
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/js/shareConfig.js",
  "view_range": [
    120,
    153
  ]
}

Read , lines 1080 to 1135
Completed with input: {
  "path": "/Users/lasarkolja/Code/ChronoScroll/css/app.css",
  "view_range": [
    1080,
    1135
  ]
}

Search for `download|\.save\(|Titeltext|title|input-preset-name|btn-analyze-coverage|chec...`



**Task completed:**

## Noch ausstehende Aufgaben

1. **Maße und CAD:** Rückwand-Offsets in CAD-Darstellung und Stückliste tatsächlich anwenden und dort einstellbar machen; Nullwerte korrekt behandeln. Standardmaße und gespeicherte Vorlagen angleichen und prüfen.
2. **BlossomPicker und Farben:** Sichtbares, direkt editierbares Farbfeld ergänzen; Transparenz tatsächlich speichern und rendern; druckfreundliche Presets und 11-%-Standard umsetzen. Papierfarben-/Freifarben-Auswahl bei Monatsabständen ersetzen und Hell-/Dunkelmodus prüfen.
3. **Kalenderstruktur:** Neue Einstellungen für Monatskopf, Kalenderwoche und Mondphasen in allen Darstellungen sowie PDF/SVG konsistent wirksam machen und testen.
4. **Darstellung und Farben:** Schriftgrößen der Sonderdarstellungen verbessern, Dropdowns und neue Presets praktisch prüfen. Den doppelten Abschnitt „Druckfarben sparen“ samt doppelter IDs in `index.html` bereinigen.
5. **QR-Code:** In die tatsächliche Vorschau und die betroffenen Exporte integrieren; Abstand von 40 mm zuverlässig einhalten und kleine Druckmaße sowie Deaktivierung prüfen. Bisher wird der Canvas-QR-Code nur für die Farbauftragsberechnung gezeichnet.
6. **Vorlagen und Kalendername:** Aktuellen und Folgejahres-Link inklusive Fehlerfällen prüfen; Erklärung zum lokalen Browserspeicher ergänzen. Kalendernamen auch für gespeicherte Vorlagen und alle Exportformate verwenden sowie bestehende Vorlagen entsprechend behandeln.
7. **Ferien:** Fehlende Aktivierungs-Checkbox und Erklärung ergänzen; Aktivierung, Deaktivierung und vorhandene Vorlagen prüfen, ohne eigene Termine unbeabsichtigt zu verlieren.
8. **Bereinigung:** Rollenlänge und Schreibplattenhöhe ausschließlich in Zentimetern anzeigen; verbliebene CSS-/Zustandsreferenzen der entfernten Bedienelemente prüfen und aufräumen, ohne benötigte Vorlagen- oder Exportlogik zu beschädigen.
9. **Abschlussprüfung:** Gezielt Tests für die noch offenen Funktionen ergänzen; Vorschau, PDF, SVG, PNG, CAD und Stückliste vergleichen; Tastaturbedienung sowie helles und dunkles Theme prüfen; anschließend Gesamttests und `git diff --check` erneut ausführen.

Die vorherigen 58 bestandenen Tests belegen nicht, dass diese noch offenen Anforderungen erfüllt sind. Änderungen an der Oberfläche waren zuletzt durch die Laufzeit-Freigabeprüfung blockiert.