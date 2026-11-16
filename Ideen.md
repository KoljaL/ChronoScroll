# Feature-Vorschläge & Erweiterungen

## 1. Konsistenter Modus-Umschalter und Theme-Wechsel
* **Header-Stabilität:** Der Umschalter für Kalender-Editor und CAD im Header soll beim Moduswechsel nicht mehr hin und her springen, um ein konsistentes Layout und eine klare Nutzerführung zu gewährleisten. Header beider Modi werden aneinandergeglichen.
* **Theme-Fade & Animation:** Ein kurzer Fade-In/Fade-Out-Effekt beim Umschalten zwischen Light- und Dark-Mode (unter Beachtung von `prefers-reduced-motion`). Allen Hover-Effekten wird zudem ein einheitlicher Stil und einheitliche Transitions gegeben.
* **Positionierung:** Das Theme-Switch-Icon wird an den äußersten rechten Rand des Headers verschoben.

## 2. Verbesserte Export-Funktion im Kalender-Modus
* **Dropdown-Bündelung:** Die bisher drei einzelnen Buttons (SVG, PNG, PDF) im Header werden in einem zugänglichen Dropdown zusammengefasst, um Platz zu sparen.
* **Direkt-Export:** Ein einzelner Klick auf den Hauptknopf löst weiterhin direkt den PDF-Export aus, ohne dass das Dropdown geöffnet werden muss. Zusätzliche Formate bleiben über das Dropdown erreichbar.

## 3. Verbesserte Export-Funktion im CAD-Modus & Konstruktionsprüfung
* **Export-Standard:** Analog zum Kalender-Modus wird der PDF-Export mit einem Klick erreichbar gemacht; weitere Formate (wie SVG) sind über ein integriertes Menü wählbar.
* **Konstruktionsprüfung & Maße:** 
  * Maßangaben und eine **bestandene** Konstruktionsprüfung werden **unter** der Zeichnung angezeigt.
  * Ist die Prüfung **nicht bestanden**, wird der Fehlerzustand **über** der Zeichnung hervorgehoben.
  * Das Layout wird an schmale Ansichten und den bestehenden Validierungsablauf angepasst.

## 4. Korrektur der Schnittmarken
* **Präzise Platzierung:** Die Schnittmarken werden korrigiert und standardmäßig nicht mehr angezeigt, sofern sie nicht aktiv benötigt werden.
* **Geometrie:** Keine Marken an Monats- oder Puffergrenzen; sie beschränken sich ausschließlich auf den horizontalen Anfang und das Ende des Sichtbereichs (jeweils auf der oberen und unteren Kante) und werden zwischen Vorschau und PDF angeglichen.

## 5. Reduzierung der Abhängigkeit von externen Ressourcen
* **Bestandsaufnahme:** Inventarisierung externer Einbindungen in `index.html` (z. B. Tailwind, Font Awesome, jsPDF/svg2pdf, Google Fonts).
* **Lokale Bereitstellung:** Lokales Vorhalten oder Ersetzen durch vorhandene Mittel zur Verbesserung der Ladezeiten und Unabhängigkeit.
* **Randbedingungen:** Lizenzhinweise und die Unterstützung des direkten Öffnens über `file://` müssen erhalten bleiben.

---

# Implementierungsplan: Ideen.md

## Ziel und Ansatz
Die fünf Vorschläge werden schrittweise in die bestehende Vanilla-JS-Anwendung (`index.html`, CSS- und JS-Dateien) integriert, wobei vorhandene Kalender-, CAD- und Exportpfade erhalten bleiben.

## Arbeitspakete

1. **Header-Modus und Theme-Wechsel konsistent machen**
   - Header-Anordnung und Modus-Umschaltung in `index.html`, `css/app.css` und `js/app.js` stabilisieren (kein Springen beim Moduswechsel).
   - Theme-Schalter an den äußersten rechten Rand setzen; Theme-Fade einbauen (`prefers-reduced-motion` beachten).
   - Einheitliche Hover-Stile und Transition-Effekte anwenden.

2. **Kalender-Export vereinfachen**
   - SVG-, PNG- und PDF-Aktionen im Header in ein Dropdown bündeln; Hauptknopf behält den direkten PDF-Export.
   - Ereignisbehandlung, Tastaturbedienung und Dropdown-Schließlogik implementieren.

3. **CAD-Export und Konstruktionsprüfung verbessern**
   - CAD-Exportbedienung analog zum Kalender anpassen (`index.html`, `css/cad-styles.css`, `js/cad-module.js`).
   - Maßangaben und bestandene Prüfungen unter der Zeichnung platzieren – Fehlerzustände bei nicht bestandener Prüfung oberhalb der Zeichnung hervorheben.

4. **Schnittmarken korrigieren**
   - Marken in `js/canvasRenderer.js` und `js/pdfExport.js` positionsgenau anpassen (nur an horizontalen Start-/Endpositionen des Sichtbereichs auf oberer/unterer Kante).
   - Exporttests (`tests/exportLayouts.test.js`, `tests/canvasRenderer.test.js`) entsprechend ergänzen.

5. **Externe Ressourcen reduzieren**
   - CDN-Einbindungen in `index.html` erfassen und Umfang des Selbsthostings oder Ersetzens festlegen (unter Beibehaltung von `file://`-Support und Lizenzen).

## Offene Entscheidungen & Status
* **Geklärt – Theme-Animation:** Kurzen Fade einbauen und `prefers-reduced-motion` berücksichtigen.
* **Geklärt – Schnittmarken:** Ausschließlich an den horizontalen Anfangs-/Endpositionen des Sichtbereichs, jeweils auf der oberen und unteren Kante.
* **Noch offen – externe Ressourcen:** Zuerst CDN-Bestand und nötige Laufzeitabhängigkeiten erfassen; danach den Umfang der lokalen Bereitstellung oder Ersetzung entscheiden. *(Hinweis: Offene Entscheidungen können übersprungen werden und werden bei der Umsetzung nach einer standardmäßigen, dokumentierten Annahme behandelt).*

## Geplante Verifikation
* Gezielte Tests für Kalender- und CAD-Export sowie Schnittmarkengeometrie ausführen/ergänzen.
* Vorhandene Testbefehle und Projektkonventionen feststellen; betroffene Tests vor Abschluss ausführen.
* Header-, Dropdown-, CAD-Status- und Theme-Verhalten visuell und per Tastatur prüfen; `file://`-Öffnung bei Ressourcenänderungen verifizieren.