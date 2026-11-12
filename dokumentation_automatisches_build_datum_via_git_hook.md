# Automatisches Build-Datum in der `index.html` via Git-Hook

## Einleitung

Bei der Entwicklung von Webprojekten ist es oft hilfreich, direkt auf der Webseite (z. B. im Footer oder in den Entwicklertools) sehen zu können, wann der aktuelle Stand zuletzt bearbeitet oder veröffentlicht wurde. Das manuelle Aktualisieren eines Zeitstempels vor jedem Commit ist jedoch fehleranfällig und wird im Arbeitsalltag leicht vergessen.

**Git-Hooks** bieten hierfür eine elegante und vollautomatische Lösung. Ein Git-Hook ist ein Skript, das Git bei bestimmten Ereignissen (wie einem `commit` oder `push`) automatisch ausführt. 

In dieser Anleitung richten wir einen sogenannten **`pre-commit`-Hook** ein. Dieser wird bei jedem `git commit` – egal ob über das Terminal oder die grafische Oberfläche in VS Code – automatisch gestartet, trägt das aktuelle Datum samt Uhrzeit in die `index.html` ein und fügt diese Änderung nahtlos dem laufenden Commit hinzu. Zudem speichern wir den Hook so im Projekt, dass er direkt mit in das Git-Repository eingecheckt und versioniert werden kann.

---

## Voraussetzungen

* **Git** ist im Projekt initialisiert.
* **Python 3** ist auf dem System installiert (auf macOS und Linux meist vorinstalliert; unter Windows über den Microsoft Store oder `python.org` verfügbar).

---

## Schritt-für-Schritt-Einrichtung

### 1. Platzhalter in der `index.html` vorbereiten

Damit das Skript weiß, an welcher Stelle das Datum eingetragen werden soll, benötigt die `index.html` ein eindeutiges HTML-Element. Am besten eignet sich dafür ein `<span>`-Tag mit einer festen ID (`build-date`).

Füge diesen Code an der gewünschten Stelle (z. B. im Footer) deiner `index.html` ein:

```html
<footer>
  <p>Letzte Aktualisierung: <span id="build-date">--.--.---- --:--</span></p>
</footer>
```

> **Hinweis:** Das Skript sucht gezielt nach der ID `build-date` und ersetzt ausschließlich den Text innerhalb dieses `<span>`-Elements. Dein restliches HTML und CSS bleiben komplett unberührt.

---

### 2. Einen versionierbaren Hooks-Ordner anlegen

Standardmäßig speichert Git seine Hooks im versteckten Ordner `.git/hooks/`. Dateien in diesem Ordner werden von Git jedoch **nicht** versioniert und landen somit nicht im Repository (z. B. auf GitHub oder GitLab).

Um den Hook fest im Projekt zu verankern, legen wir stattdessen einen eigenen Ordner direkt im Hauptverzeichnis (Root) des Projekts an:

1. Erstelle im Hauptverzeichnis deines Projekts (auf derselben Ebene wie die `index.html`) einen neuen Ordner namens **`.githooks`**.
2. Erstelle darin eine neue Datei namens **`pre-commit`** (wichtig: **ohne** Dateiendung wie `.py` oder `.txt`).

---

### 3. Das Hook-Skript einfügen

Öffne die neu erstellte Datei `.githooks/pre-commit` in VS Code und füge folgenden Python-Code ein:

```python
#!/usr/bin/env python3
import datetime
import re
import subprocess

# Pfad zur HTML-Datei (relativ zum Projekt-Hauptverzeichnis)
index_path = 'index.html'

try:
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    # Falls keine index.html existiert, bricht das Skript sauber ab,
    # ohne den Commit zu blockieren.
    exit(0)

# Aktuelles Datum und Uhrzeit im deutschen Format ermitteln
# example: 12.11.2026 14:35
current_date = datetime.datetime.now().strftime('%d%m%Y%H%M')

# Regulärer Ausdruck, der das Element <span id="build-date">...</span> sucht
date_pattern = r'(<span[^>]*id=["\']build-date["\'][^>]*>)(.*?)(</span>)'

# Alten Inhalt durch das neue Datum ersetzen
new_content = re.sub(date_pattern, rf'\1{current_date}\3', content, flags=re.IGNORECASE)

# Datei nur neu schreiben, wenn tatsächlich eine Ersetzung stattgefunden hat
if new_content != content:
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    # Die geänderte index.html direkt dem aktuellen Commit hinzufügen
    subprocess.run(['git', 'add', index_path], check=True)
    print(f"[Git Hook] Build-Datum erfolgreich aktualisiert: {current_date}")
```

---

### 4. Git konfigurieren und Skript ausführbar machen

Damit Git unseren eigenen `.githooks`-Ordner anstelle des versteckten Standardordners verwendet und das Skript ausführen darf, sind einmalig zwei Befehle im VS Code Terminal notwendig:

**1. Den neuen Hooks-Pfad für dieses Repository festlegen:**
```bash
git config core.hooksPath .githooks
```

**2. Ausführungsrechte für das Skript vergeben (macOS / Linux / Git Bash unter Windows):**
```bash
chmod +x .githooks/pre-commit
```

---

### 5. Hook in Git einchecken

Nun kannst du den neuen Ordner samt Hook-Skript ganz normal zu deinem Repository hinzufügen und deinen ersten automatisierten Commit durchführen:

```bash
git add .githooks/pre-commit
git commit -m "Git-Hook für automatisches Build-Datum eingerichtet"
```

Beim Ausführen dieses Befehls greift der Hook bereits das erste Mal und aktualisiert das Datum in deiner `index.html`.

---

## Mögliche Optionen & Erweiterungen

Je nach Projektanforderung lässt sich dieses Grundgerüst leicht anpassen oder erweitern:

### Option 1: Datumsformat anpassen
In der Zeile `strftime('%d.%m.%Y %H:%M')` kannst du das Format beliebig ändern:
* **Nur Datum:** `'%d.%m.%Y'` $\rightarrow$ `12.11.2026`
* **Mit Sekunden:** `'%d.%m.%Y %H:%M:%S'` $\rightarrow$ `12.11.2026 14:35:08`
* **ISO-Format (international):** `'%Y-%m-%d %H:%M'` $\rightarrow$ `2026-11-12 14:35`

### Option 2: Commit-Hash zusätzlich einfügen
Falls du später doch die genaue Git-Commit-ID (Kurz-Hash) anzeigen möchtest, lässt sich diese über `git rev-parse --short HEAD` auslesen und analog zum Datum in ein `<span id="build-hash">` schreiben. *(Hinweis: Da ein `pre-commit`-Hook vor dem eigentlichen Commit läuft, wird hierbei der Hash des vorherigen Commits verwendet).*

### Option 3: Fortlaufenden Build-Zähler ergänzen
Statt oder zusätzlich zum Datum kann das Skript eine Zahl aus einem `<span id="build-counter">0</span>` auslesen, um `1` erhöhen (`int(wert) + 1`) und wieder zurückschreiben.

### Option 4: Hook nur auf bestimmten Branches ausführen
Wenn du mit Feature-Branches arbeitest und das Datum nur aktualisieren möchtest, wenn du direkt auf den `main`-Branch committest, kannst du am Anfang des Skripts den aktuellen Branch prüfen:

```python
branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD']).decode('utf-8').strip()
if branch != 'main':
    exit(0)
```

### Option 5: Automatisierung für Teammitglieder (Node.js / npm)
Die Einstellung `git config core.hooksPath .githooks` wird lokal in der `.git/config` gespeichert und nicht mitgepusht. Wenn andere Entwickler das Repository klonen, müssten sie diesen Befehl einmalig ausführen. 
* **Lösung für Webprojekte mit `package.json`:** Du kannst den Befehl in das `prepare`-Skript der `package.json` eintragen. Sobald jemand `npm install` ausführt, wird der Hook automatisch aktiviert:
  ```json
  "scripts": {
    "prepare": "git config core.hooksPath .githooks"
  }
  ```

### Option 6: Den Hook im Einzelfall überspringen
Solltest du einmal einen Commit durchführen wollen, ohne dass das Skript ausgelöst wird (z. B. bei einer reinen Änderung an der `README.md`), kannst du den Hook über das Terminal mit dem Flag `--no-verify` umgehen:

```bash
git commit -m "Dokumentation aktualisiert" --no-verify
```