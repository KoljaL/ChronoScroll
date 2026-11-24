# ChronoScroll – Phasenbasierter Ablaufplan mit Prompts

Dieser Ablaufplan führt strukturiert durch die geplante Überarbeitung von ChronoScroll (Code-Effizienz, Sidebar-Reorganisation, Parametrisierung und Tests). Er ist speziell auf die **Zero-Regression-** und **Token-Spar-Leitplanken** von Antigravity abgestimmt.

---

## Übersicht der Phasen

| Phase | Fokus | Ziel | Code-Änderung? |
|---|---|---|:---:|
| **Phase 1** | Audit & Analyse | Architektur, Render-Effizienz, Geometrie-Duplizierung | ❌ Nein (Read-Only) |
| **Phase 2** | UI & Sidebar-Konzept | 4-Tab-Struktur, Workflow-Gruppierung, Tooltips & Labels | ❌ Nein (Konzept) |
| **Phase 3** | Parameter & Schema | Neue Einstellungen definieren + Default-Fallbacks festlegen | ❌ Nein (Spezifikation) |
| **Phase 4** | Implementierung | Schrittweiser Umbau (Sidebar → Logik → neue Parameter) | ✅ Ja (Chirurgisch) |
| **Phase 5** | Test & Release | Regressionstests, Presets-Katalog (`presets:generate`), Doku | ✅ Ja (Finalisierung) |

---

## Phase 1: Code-Effizienz & Architektur-Audit

### Ziel
Bestandsaufnahme der bestehenden Codebasis ohne Änderungen. Prüfung auf doppelte Geometrieberechnungen, fehlendes Debouncing bei Slidern/Inputs, Event-Handling und Testabdeckung.

### Prompt für Antigravity (Copy & Paste):
```markdown
WICHTIGE RANDBEDINGUNG: Alle derzeit bestehenden Funktionen, Berechnungen, Exporte und JSON-Presets funktionieren einwandfrei und dürfen NICHT beeinträchtigt werden. Verändere keine bestehenden Input-IDs, State-Keys oder Berechnungsformeln. ÄNDERE IN DIESEM SCHRITT NOCH KEINEN CODE.

Lies die Haupt-HTML-, CSS-, JS- und Test-Dateien (insb. index.html, js/geometry.js, js/layoutSettings.js, js/canvasRenderer.js).

Erstelle einen kompakten Bericht in 3 Abschnitten:
1. CODE-EFFIZIENZ & ARCHITEKTUR:
   - Gibt es redundante DOM-Manipulationen oder schwere SVG/Canvas-Neuberechnungen bei Slider-Inputs (fehlendes requestAnimationFrame/Debounce)?
   - Wo gibt es duplizierte Geometrielogik zwischen Vorschau, Print-SVG, PDF und 2D-CAD?
2. RISIKOARME OPTIMIERUNGEN:
   - Welche minimal-invasiven Verbesserungen sind möglich, ohne bestehende Logik und Presets zu gefährden?
3. TEST-STATUS:
   - Welche Bereiche sind durch tests/*.test.js bereits abgedeckt und wo fehlen Tests vor dem Umbau?
```

### Definition of Done
- Ein kompakter Audit-Bericht liegt vor.
- Keine Code-Dateien wurden verändert.
- Identifizierte Bottlenecks und Duplikate sind priorisiert.

---

## Phase 2: UI- & Sidebar-Analyse & Reorganisation

Zusätzliche Dateigeneriert für diese Phase:
- phase2-sidebar-ux_both.md
- phase2-sidebar-ux_38flash.md
- phase2-sidebar-ux_4hydro.md

### Ziel
Prüfung der aktuellen 4-Tab-Struktur der Sidebar. Erarbeitung einer logischeren Gruppierung (z. B. nach Anwender-Workflow oder aufklappbaren Akkordeons) und kürzerer, präziserer Erklärungstexte.

### Prompt für Antigravity (Copy & Paste):
```markdown
WICHTIGE RANDBEDINGUNG: ÄNDERE IN DIESEM SCHRITT NOCH KEINEN CODE. Alle bestehenden Input-IDs (`id`, `name`, `data-*`) müssen 1:1 erhalten bleiben oder verlustfrei gemappt werden, damit JavaScript-Bindings, Tests und JSON-Presets nicht brechen.

Analysiere die aktuelle Sidebar in index.html für den kalender-Editor it den Tabs Maße, Struktur, Style, Termine Vorlagen und für die CAD Konstrukton ohne Tabs:
1. TAB- & WORKFLOW-ANALYSE:
   - Führt die aktuelle Aufteilung zu häufigen, unergonomischen Tab-Wechseln (z. B. zwischen Papiermaßen und Holzrahmenmaßen)?
   - Welche Parameter gehören logisch direkt zusammen?
2. LAYOUT- & AKKORDEON-VORSCHLAG:
   - Schlage eine kompaktere Struktur vor (z. B. 3 Hauptbereiche oder vertikale Akkordeon-Sektionen).
   - Zeige auf, wie abgeleitete Werte (z. B. resultierende Gesamtlänge, Rahmenbreite) dem Nutzer sofort sichtbar angezeigt werden können.
3. ERKLÄRUNGSTEXTE & LABELS:
   - Schlage vor, wo lange Hilfetexte durch präzise Kurzlabels, Einheiten (mm, g/m²) und unaufdringliche Info-Tooltips ersetzt werden können.
4. INPUT-ELEMENTE:
   - Haben alle Input-Elemente den selben Stil? Falls nicht, schlage eine einheitliche Gestaltung vor. Achte auch auf alle Zustände wie hover, focused, disabled, active und die korrekte Verwendung von aria-label Attributen.
```

### Definition of Done
- Vorlage für die neue Sidebar-Gliederung ist abgestimmt.
- Alle existierenden Input-IDs sind in einer Mapping-Checkliste erfasst (Garantie: keine verwaisten Listener).

---

## Phase 3: Fehlende Einstellungen & Preset-Schema

### Ziel
Definition sinnvoller Zusatz-Parameter für Rollkalender und Holzrahmen-CAD (z. B. Papiergrammatur, Vor-/Nachlauf, Schnittmarken, Bohrtoleranzen) mit verpflichtenden Fallback-Defaults für alte Presets.

### Prompt für Antigravity (Copy & Paste):
```markdown
WICHTIGE RANDBEDINGUNG: ÄNDERE NOCH KEINEN CODE. Jede neue Einstellung muss abwärtskompatibel sein. Wenn ein älteres JSON-Preset importiert wird, in dem das Feld fehlt, muss automatisch ein definierter Fallback-Default (`?? DEFAULT_VALUE`) greifen.

Erstelle eine tabellarische Spezifikation aller vorgeschlagenen neuen Parameter:
1. PARAMETER-TABELLE:
   - Name & DOM-ID
   - Wertebereich / Typ (Number, Select, Checkbox)
   - Einheit (z. B. mm, g/m²)
   - Default-Wert (identisch mit dem bisherigen impliziten Verhalten)
   - Betroffene Module (Canvas-Vorschau, Print-SVG, PDF-Export, CAD-Zeichnung, Stückliste)
2. VORSCHLÄGE FÜR KANDIDATEN:
   - Papiergrammatur / Papierdicke (Auswirkung auf Rollendurchmesser / CAD-Spaltmaß)
   - Vorlauf- / Nachlauf-Wickelzugabe (Befestigung an Holzleisten)
   - Schnittmarken-Stil (Ecken, Linien, keine)
   - CAD-Materialtoleranzen & Bohrdurchmesser
3. SCHEMA-KOMPATIBILITÄT:
   - Zeige kurz den Code-Snippet für `layoutSettings.js`, wie die neuen Felder validiert und mit Fallbacks geladen werden.
```

### Definition of Done
- Tabelle mit allen neuen Parametern und ihren Defaults ist dokumentiert.
- Abwärtskompatibilität für das Preset-Schema ist nachgewiesen.

---

## Phase 4: Schrittweise Implementierung & Regressionstests

### Ziel
Chirurgische Umsetzung im Code in klar getrennten Einzelschritten. Nach jedem Teilschritt automatische Überprüfung mit `npm test`.

### Prompt für Teilschritt 4.1 – Sidebar-Struktur (HTML & CSS):
```markdown
AUFGABE: Überarbeite die Sidebar-Struktur in index.html und den zugehörigen CSS-Dateien gemäß dem freigegebenen Konzept aus Phase 2.

STRIKTE REGELN:
- Behalte alle bestehenden Input-IDs, Checkbox-IDs und Select-IDs exakt bei.
- Ändere noch keine JavaScript-Berechnungsformeln.
- Ersetze lange Erklärungstexte durch kompakte Labels mit Einheiten und kurzen Hinweisen.
- Führe anschließend die Tests aus (`npm test`) und prüfe, ob alle bestehenden Tests grün bleiben.
```

### Prompt für Teilschritt 4.2 – Event- & Rendering-Optimierung (JS):
```markdown
AUFGABE: Optimiere das Rendering und Event-Handling in js/ (z. B. requestAnimationFrame / Debouncing bei Slidern).

STRIKTE REGELN:
- Stelle sicher, dass die Anwendung weiterhin direkt über file:// ohne Server und ohne externe Bibliotheken funktioniert.
- Verändere keine Geometrie-Ergebnisse oder Formeln.
- Führe `npm test` aus und bestätige 0 Regressionen.
```

### Prompt für Teilschritt 4.3 – Neue Parameter anbinden:
```markdown
AUFGABE: Implementiere die neuen Parameter aus Phase 3 schrittweise in `index.html`, `js/layoutSettings.js` und den Renderern.

STRIKTE REGELN:
- Nutze für jeden Parameter den definierten Fallback-Default (`?? DEFAULT`), damit bestehende Presets fehlerfrei laden.
- Ergänze entsprechende Tests unter `tests/` für die neuen Parameter und deren Default-Werte.
- Führe `npm test` aus.
```

### Definition of Done
- Alle Änderungen sind umgesetzt.
- `npm test` meldet 0 Fehler / 0 Regressionen bei allen relevanten Tests.
- Die App öffnet und funktioniert sauber über das `file://`-Protokoll im Browser.

---

## Phase 5: Katalog-Aktualisierung, Validierung & Dokumentation

### Ziel
Aktualisierung der Presets, Regenerierung des Katalogs und Nachziehen der Dokumentation.

### Prompt für Antigravity (Copy & Paste):
```markdown
AUFGABE: Finalisiere die Änderungen:
1. Führe den Preset-Katalog-Generator aus:
   `npm run presets:generate`
2. Prüfe, ob alle JSON-Presets in `presets/` weiterhin valide sind.
3. Führe die Diff-Audit-Prüfung durch (Prüfung auf unerwünschte externe URLs, Frameworks oder Dateileichen).
4. Aktualisiere bei Bedarf FUNKTIONSUEBERSICHT.md und README.md mit den neuen Einstellmöglichkeiten.
```

### Definition of Done
- `npm run presets:generate` läuft fehlerfrei durch.
- `npm test` besteht vollständig.
- Dokumentation ist synchron mit dem Code.
- `git status` zeigt ausschließlich saubere, gewünschte Änderungen.
