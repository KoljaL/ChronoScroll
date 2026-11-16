# Umgesetzte offene Punkte

Die nachfolgenden Änderungen sind in der Anwendung umgesetzt. Die bereits
korrigierten Pfeiltasten und die Scrollbarkeit der 3-Monats-Vorschau wurden
nicht erneut geändert.

## 1. Ganze Rolle zuverlässig einpassen

**Betroffen:** `js/app.js`, Handler für `btn-zoom-fit-banner`.

Der bisherige Mindestzoom von 12 % verhindert bei schmalen Viewports, dass die
Rolle vollständig hineinpasst. Die verfügbare Breite aus der tatsächlichen
Viewportbreite und den Innenabständen ermitteln und den Zoom anhand der
berechneten Rollenbreite bestimmen. Dabei keinen festen Mindestzoom anwenden,
der das Einpassen verhindert; der bisherige maximale Fit-Zoom bleibt erhalten.
Ein Viewport ohne verfügbare Breite darf keinen ungültigen oder negativen Zoom
erzeugen. Die bestehenden manuellen Zoom- und CAD-Verhaltensweisen erhalten.

**Abnahme:**
- Bei 567 px Viewportbreite und 226 cm Rollenlänge ist nach „Rolle einpassen“
  die gesamte Rolle einschließlich des gewünschten Abstands sichtbar.
- Auch bei größerem Viewport und bei langen Rollen bleibt die Rolle sichtbar;
  erneuter Wechsel zur 3-Monats-Ansicht und manuelles Zoomen funktionieren.
- Einen gezielten Test in `tests/layoutSettings.test.js` ergänzen.

## 2. Kartenrahmen und Abstände angleichen

**Betroffen:** `css/app.css`, gegebenenfalls CAD-spezifische Regeln in
`css/cad-styles.css`.

Die Zeichenfläche der CAD-Karte an deren abgerundetem Rand begrenzen, wie bei
der Kalender-Vorschau. Kalender-Tabgruppen und CAD-Module sollen dieselben
vertikalen Kartenabstände verwenden; die zusätzliche rechte Einrückung des
Kalender-Scrollcontainers gegen die tatsächlich vorhandene Scrollbar prüfen.
Oberflächen, Rahmen, Schatten und Radien sollen weiterhin aus den gemeinsamen
Tokens stammen. Interaktive CAD-Inhalte dürfen nicht unbeabsichtigt
abgeschnitten werden.

**Abnahme:**
- Vergleich beider Modi bei gleicher Fenstergröße und im hellen und dunklen
  Theme: gleicher äußerer Sidebar-/Stage-Rahmen und gleichmäßige Kartenabstände.
- Die abgerundeten Rahmen beider Zeichenkarten sind sichtbar; CAD-Zoom und Pan
  sowie die Scrollleisten funktionieren weiterhin.

## 3. Schmale Bildschirme

**Betroffen:** gemeinsames Workspace-Grid in `css/app.css`; bei Bedarf
Sidebar-Schaltfläche und Zustand in `index.html` und `js/app.js`.

Das aktuelle Grid reserviert bis zu 400 px für die Sidebar und lässt auf
schmalen Geräten kaum Platz für die Stage. Für schmale Viewports eine gemeinsame
responsive Darstellung für Kalender und CAD vorsehen: Die Stage nutzt die
verfügbare Breite, die Sidebar lässt sich über die bestehende Schaltfläche als
überlagernde Fläche öffnen und schließen. Sidebar und Stage müssen in beiden
Modi denselben Zustandsvertrag verwenden; die Desktop-Darstellung bleibt
unverändert. Zugänglichkeit des Zustands und Tastaturbedienung berücksichtigen.

**Abnahme:**
- Bei 320, 390 und 750 CSS-px sind Vorschau, Moduswechsel und
  Sidebar-Schaltfläche bedienbar; die geöffnete Sidebar bleibt scrollbar.
- Schließen der Sidebar gibt die Stage vollständig frei, auch nach einem
  Moduswechsel. Breite Desktop-Layouts und eingeklappte Sidebars bleiben intakt.
- Seitenverhältnisse und sichtbare Inhalte bei beiden Themes im Browser prüfen.

## Abschlussprüfung

Das ergänzte Konzept in `blocked.md` wurde geprüft. `node --test tests/*.test.js`
und `git diff --check` liefen erfolgreich; der Browsercheck umfasste 320, 390,
567 und 750 CSS-px in beiden Themes sowie Sidebar-Zustand und Rollen-Fit.
CAD-Wheel-Zoom und Pointer-Pan wurden zusätzlich mit einem isolierten
VM-Smoke-Test geprüft.
