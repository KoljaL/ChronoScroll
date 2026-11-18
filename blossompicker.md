# BlossomColorPicker-Integration

## Problem und Ziel

Alle nativen Farb-Eingaben in ChronoScroll sollen durch den BlossomColorPicker ersetzt werden. Die bisherigen Eingaben dienen weiterhin als interne, zugängliche Quelle des gespeicherten `#rrggbb`-Werts, damit App-State, Vorlagen, Sharing, Vorschau und Exporte unverändert bleiben. Die sichtbare Auswahl verwendet eine kuratierte Palette mit dem Blossom-Blooming-UI.

Es gibt 12 statische Farbfelder in `index.html`; zusätzlich werden Farbfelder pro Termin dynamisch in `js/app.js` erzeugt. Alle müssen vom selben Integrationsadapter erfasst und synchron gehalten werden.

## Todos

1. **Blossom-Abhängigkeit einbinden**
   - Core-JavaScript und `styles.css` von `@dayflow/blossom-color-picker` über jsDelivr mit einer festen Version in `index.html` laden.
   - Die Asset-Reihenfolge vor dem projekt­eigenen Adapter festlegen, ohne einen zusätzlichen Build-Schritt einzuführen.

2. **Zentrale Konfiguration und Adapter erstellen**
   - In `js/blossomColorPicker.js` einen zentralen Ort für Palette, Größen, Animation, Slider-Position, Alpha-Verhalten, adaptive Positionierung und Abstände anlegen.
   - Einen Adapter bereitstellen, der alle `input[type="color"]` aktualisiert, Blossom neben dem bisherigen Input erzeugt und den Input selbst zugänglich versteckt.
   - Bei Picker-Änderungen den Input-Wert aktualisieren sowie bestehende `input`- und `change`-Events dispatchen, damit aktuelle App-Listener ohne fachliche Änderungen funktionieren.
   - Initiale Werte, Labels, Disabled-Zustand und externe Programmänderungen in beiden Richtungen synchronisieren.
   - Dynamische Termin-Felder über `MutationObserver` erfassen und entfernte Instanzen zuverlässig mit `destroy()` bereinigen.

3. **App-Synchronisierung vollständig verdrahten**
   - `index.html` um die zentrale Integration sowie minimale komplementäre Styles erweitern.
   - `js/app.js` nach Status-Synchronisierung, Terminlisten-Neurendering und dem Öffnen des Termin-Modals den Adapter-Aktualisierungspfad aufrufen.
   - Bestehende IDs, Werte, Listener und Hex-Datenformate erhalten.
   - Popup-Positionierung, Fokusdarstellung und die kompakte Darstellung innerhalb von Sidebar, Terminlisten und Modal anpassen.

4. **Regressionstests ergänzen**
   - Adapter mit Test-Doubles für Blossom und DOM testen: statische Initialisierung, Weitergabe von Änderungen, programmatische Synchronisierung, dynamische Felder und Cleanup.
   - Bestehende Tests ausführen und sicherstellen, dass Kalenderfarben weiterhin unverändert zu Vorschau, SVG/PDF und Sharing gelangen.

5. **Browser-Verifikation durchführen**
   - Einen lokalen statischen Server starten.
   - Statische Picker, dynamisch erzeugte Termin-Picker und Modal-Picker öffnen und verändern.
   - Prüfen, dass Klicks in kleinen Seitenbereichen nicht abgeschnitten werden, Theme-/Preset-Wechsel sichtbare Farben korrekt synchronisieren und keine Konsolenfehler entstehen.

## Wichtige Entscheidungen

- Die neue Oberfläche verwendet eine kuratierte Palette; beliebige nativen Farbwerte bleiben trotzdem als bestehende gespeicherte oder importierte Werte darstellbar.
- Alpha bleibt deaktiviert, da das Projekt ausschließlich `#rrggbb` verarbeitet.
- Der Picker bleibt über die vorhandenen Inputs an den App-State gekoppelt. Dadurch werden Export- und Sharing-Logik nicht dupliziert.
- Blossom wird wie die bestehenden Browser-Abhängigkeiten über eine fest gepinnte CDN-Version geladen. Ein Build-System ist für diese statische Anwendung nicht erforderlich.
- Alle globalen Blossom-Optionen werden ausschließlich in `js/blossomColorPicker.js` konfiguriert.

## Risiken und Absicherung

- Blossom positioniert ein sehr viel größeres UI als das bisherige Swatch. Das wird mit adaptiver Positionierung, Modal-/Sidebar-z-index und Browser-Smoke-Tests abgesichert.
- `app.js` setzt manche Werte direkt per `.value`; diese Stellen werden explizit mit dem Adapter synchronisiert, statt auf schwer greifbare Property-Observer zu vertrauen.
- Dynamisch neu gerenderte Terminlisten dürfen keine alten Picker-/Event-Instanzen hinterlassen; dies wird durch dedizierten Cleanup und einen Test abgesichert.
