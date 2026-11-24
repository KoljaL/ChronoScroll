# ChronoScroll – Arbeitsvorlage für Google Antigravity

Diese Datei bündelt Leitplanken, Projektkonfigurationen und Workflow-Hinweise für **ChronoScroll** (`https://github.com/KoljaL/ChronoScroll`).

---

## 1. Einordnung für Entwickler (Antigravity-Einstieg)

Google Antigravity arbeitet agenten- und planorientiert mit nativer Unterstützung für Rules, Skills und Projekt-Leitplanken:

* **Workspace & Dateibaum:** Das lokale `ChronoScroll`-Verzeichnis wird direkt als Projektordner geöffnet. Bestehende Git-Strukturen, npm-Skripte und Tests bleiben unverändert.
* **Agent-Steuerung statt reiner Autovervollständigung:** Aufträge werden zielgerichtet an den Agenten übergeben. Vor Änderungen erstellt der Agent Pläne und hält bei Rückfragen an.
* **Kontext- & Token-Hygiene:** Der Agent liest gezielt `AGENTS.md`, automatische Dateityp-Regeln unter `.agents/rules/*.md` und On-Demand-Skills unter `.agents/skills/*/SKILL.md`.
* **Zero-Build & Offline-First:** ChronoScroll läuft ohne Build-Step und ohne externe CDNs direkt über das `file://`-Protokoll im Browser.
* **Natives Node.js Test-Setup:** Das Projekt nutzt den nativen Node.js-Testrunner:
  ```bash
  npm test
  # entspricht: node --test tests/*.test.js
  ```
  *(Hinweis: Für den Test `tests/realPdfExport.test.js` wird die devDependency `jspdf` benötigt: `npm install`).*

---

## 2. Projekt-Konfiguration für Antigravity

Die Konfigurationsdateien sind im Repository wie folgt strukturiert und aktiv:

```text
ChronoScroll/
├── AGENTS.md                          # Globale Architektur- & Verhaltensregeln
├── WORKFLOW_PLAN.md                   # Phasenbasierter Ablaufplan mit fertigen Prompts
├── .agents/
│   ├── rules/
│   │   ├── svg-cad.md                 # Regeln für millimetergenaue SVGs & 2D-CAD
│   │   └── print-css.md               # Regeln für @media print, Layout & Farbpaletten
│   └── skills/
│       └── review-diff/
│           └── SKILL.md               # Skill zur Prüfung von Diffs und Testausführung
```

---

## 3. Kernregeln im Überblick

### 3.1 Architektur & Beschränkungen (AGENTS.md)
* **Keine Frameworks:** Reines Vanilla HTML5, CSS3 und ES6+ JavaScript. Kein React, Vue, Tailwind, TypeScript oder npm-Runtime-Abhängigkeiten.
* **file://-Kompatibilität:** Keine relativen Import-Probleme (CORS bei ES-Modulen ohne Server), keine externen Webfonts, keine CDNs.
* **Domäne:** Parametrischer Rollkalender mit 2D-CAD-Rahmenzeichnung, Stücklisten-Export (BOM), drucksicheren Paletten (Okabe-Ito / Paul Tol) und JSON-Preset-System.

### 3.2 Regression Protection & Stabilität
* **Zero-Regression:** Bestehende Berechnungen, Exporte und JSON-Presets dürfen nicht verändert oder beschädigt werden.
* **Stabile Bindungen:** Bestehende DOM-IDs (`id`, `name`, `data-*`) bei Sidebar-Umbauten erhalten, damit Event-Listener und Presets stabil bleiben.
* **Abwärtskompatibilität:** Neue Felder beim Preset-Laden immer mit Fallback absichern: `?? DEFAULT_VALUE`.

---

## 4. Best Practices für Antigravity

* **Thinking / Reasoning-Level:**
  * Routineaufgaben (CSS-Feinheiten, Text-Änderungen, Dokumentation): Low bis Medium.
  * Architektur, Refaktorisierung und Geometriefragen: High.
* **Surgical Edits:** Keine ganzen Dateien neu schreiben, sondern gezielte Search-and-Replace-Diffs verlangen.
* **Frische Chats pro Phase:** Nach Abschluss einer Phase (z. B. Audit) für die nächste Phase einen neuen Chat öffnen, um den Kontext schlank zu halten.
* **Ablaufplan nutzen:** Alle Prompts für die Phasen 1 bis 5 befinden sich fertig formuliert in [WORKFLOW_PLAN.md](file:///Users/lasarkolja/Code/AG-Repos/ChronoScroll/WORKFLOW_PLAN.md).
