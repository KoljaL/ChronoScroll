# Review-Auftrag: Integration des 2D-CAD-Konstruktionstools in ChronoScroll

Du arbeitest im Workspace des Projekts **ChronoScroll** (Vanilla JavaScript, Tailwind CSS, `jsPDF`, GitHub Pages). 

Wir möchten die bisherige, sehr rudimentäre „Holz“-Ansicht in ChronoScroll durch das vollständige **2D-CAD-Konstruktionstool** (`CAD-Funktion.html`) ersetzen. 

## Ziel der Integration
1. **UI-Struktur:** In der Hauptanwendung von ChronoScroll soll die CAD-Funktion als vollwertiger Reiter/Ansicht integriert werden. Die linke Seitenleiste nimmt die CAD-Parameter auf, während die rechte Hauptbühne (anstelle der Kalendervorschau) das interaktive SVG-Zeichenblatt anzeigt.
2. **Daten-Synchronisation (Read-only):** Die Kernmaße **Sichtfenster-Breite** (`windowWidth`), **Sichtfenster-Höhe** (`windowHeight`) und **Papierbahn-Länge** (`paperLength`) sind physikalisch durch den Hauptkalender vorgegeben. Sie müssen im CAD-Tool als **read-only** angezeigt und live aus dem Haupt-State von ChronoScroll synchronisiert werden.
3. **Stückliste & Export:** Neben der Zeichnung soll eine dynamische Stückliste (BOM) generiert werden. Die Zeichnung muss als SVG sowie als technisches PDF (unter Nutzung der in ChronoScroll vorhandenen `jsPDF`-Bibliothek) exportierbar sein.
4. **Visualisierungs-Feature:** Eine zuschaltbare Option in den CAD-Parametern soll eine dezent angedeutete Kalendervorschau (Tageszeilen/Monatsköpfe) direkt im Sichtfenster der SVG-Zeichnung einblenden.
5. **Styling & Isolierung:** Das CSS des CAD-Tools (welches auf eigenen Design-Tokens und Fonts wie *Inter* und *JetBrains Mono* basiert) muss sauber in das bestehende ChronoScroll-Design eingepasst werden, ohne globale CSS-Kollisionen (z. B. mit Tailwind) zu verursachen.
6. **Style Rework**: Das Styling der `CAD-Funktion.html` ist deutlich ansprechender und moderner gestaltet, wodurch die Benutzeroberfläche insgesamt konsistenter und visuell ansprechender wirkt. Es soll in die Hauptanwendung übernommen werden. Dabei kann Tailwind genutzt werden, wenn es sinnvoll ist, ohne die bestehenden Design-Tokens und Fonts der CAD-Funktion zu verletzen. Ziel ist es ein harmonisches und konsistentes UI-Erlebnis innerhalb von ChronoScroll zu schaffen, welches auf den Designprinzipien der CAD-Funktion basiert.

---

## Deine Aufgaben als Coding-Agent:

1. **Machbarkeits- und Architektur-Prüfung:**
   * Analysiere die bestehende ChronoScroll-Struktur und vergleiche sie mit der Modularität des CAD-Tools (IIFE-Pattern mit `ParameterStore`, `GeometryEngine`, `CADRenderer`, `StorageManager`, `UIController`).
   * Überprüfe, wie der State-Abgleich zwischen Hauptkalender (Sichtfenster/Papierlänge) und dem CAD-`ParameterStore` am saubersten reaktiv gelöst werden kann.

2. **Identifikation von potenziellen Problemen & Fallstricken:**
   * Weise auf DOM-Kollisionen (z. B. doppelte IDs wie `#cad-svg`, `#toast`, `#preset-select`), CSS-Überlappungen oder Konflikte beim Event-Handling (Pan/Zoom vs. Haupt-App-Scrollen) hin.
   * Prüfe, ob die Einbindung von `jsPDF` und Lucide Icons doppelt geladen wird oder konfliktfrei geteilt werden kann.

3. **Konkrete Integrations-Vorschläge:**
   * Schlage eine saubere Dateistruktur vor (z. B. Aufteilung in Modul-Dateien oder Integration als geschlossenes ES6-Modul).
   * Skizziere Code-Snippets für die Übergabe der Hauptkalender-Maße an den CAD-Store.
   * Mache einen Vorschlag, wie das SVG-Rendering um die optionale Kalendervorschau erweitert werden kann.

Bitte erstelle einen strukturierten Bericht mit deinen Analyseergebnissen, identifizierten Risiken und einem konkreten Schritt-für-Schritt-Umsetzungsplan.
