# Feature-Vorschläge & Erweiterungen

## 1 URL-basierte State-Speicherung (Shareable Links):

Speicherung aller Kalender-Parameter in den URL-Query-Parametern (oder Hash), damit Nutzer ihre Konfigurationen einfach per Link teilen oder als Lesezeichen speichern können.


## 2 Erweiterter iCal-Filter:

Einbindung einer Filter-Option für importierte iCal-Kalender  

## 3 Export/Import von Vorlagen (JSON):

Ein einfacher Export- und Import-Button für das eigene Preset als JSON-Datei, falls man die Konfiguration im nächsten Jahr wiederverwenden möchte.
 


# To Check
- Land vor der Regionsprüfung als Zeichenkette validiert werden. Ein manipuliertes Objekt kann dort derzeit einen Fehler auslösen und den App-Start stoppen. Die Änderung wurde bisher nicht freigegeben.
- Randfall testen: Einen Test ergänzen, der eine solche manipulierte URL lädt und bestätigt, dass die App mit den Standardeinstellungen startet.
- Praktisch prüfen: Eine PDF exportieren, den QR-Code scannen und prüfen, ob der angezeigte Folgejahres-Link geöffnet wird. Die automatisierten Tests prüfen bereits URL und Platzierung, ersetzen aber keinen Scan.
- Veröffentlichen: Die neue qrcode.js, ihre Lizenz und die übrigen Änderungen in Git aufnehmen und veröffentlichen.