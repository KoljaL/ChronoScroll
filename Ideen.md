# Feature-Vorschläge & Erweiterungen

## 1 URL-basierte State-Speicherung (Shareable Links):

Speicherung aller Kalender-Parameter in den URL-Query-Parametern (oder Hash), damit Nutzer ihre Konfigurationen einfach per Link teilen oder als Lesezeichen speichern können.

# QR-Code für die Folgejahres-Konfiguration

## Problem und Ansatz

Am Ende des exportierten Plotter-PDFs soll im vorhandenen rechten Montagepuffer ein QR-Code stehen. Er öffnet CronoScroll mit den Gestaltungseinstellungen des PDFs, aber mit dem Kalenderjahr des Folgejahres. Individuelle und importierte Termine werden nicht in die URL übernommen; Feiertage und Ferien werden anhand des neuen Jahres sowie des gespeicherten Landes und der Region neu berechnet. Die PDF-Abmessungen bleiben unverändert.

Die Konfiguration wird als kompakter, URL-sicherer Zustand übertragen. Beim App-Start wird dieser Zustand vor der ersten Feiertagsberechnung validiert und angewendet. Der PDF-Export erzeugt eine absolute URL auf `https://koljal.github.io/ChronoScroll/` und bettet den daraus erzeugten QR-Code in den rechten Puffer ein. Eine Jahreszahl im benutzerdefinierten Bannertitel wird vom PDF-Jahr auf das Folgejahr angepasst.

## Todos

1. Einen erlaubten, validierten URL-Konfigurationszustand für die dauerhaften Gestaltungseinstellungen definieren und beim App-Start wiederherstellen. Termine sowie flüchtige Vorschau-/Interaktionsdaten ausschließen; Kalenderjahr und Titel für das Folgejahr vorbereiten.
2. Im Plotter-PDF-Export einen QR-Code für diese Folgejahres-URL im vorhandenen rechten Montagepuffer platzieren, ohne die Rollenmaße zu verändern.
3. Fokussierte Tests für Zustandsübertragung, Jahres-/Terminverhalten und PDF-Platzierung ergänzen sowie die PDF-/URL-Funktion dokumentieren.

## Hinweise

- Die öffentlich erreichbare Zieladresse ist `https://koljal.github.io/ChronoScroll/`.
- URL-Zustände müssen auf erlaubte Felder und gültige Werte beschränkt werden; unbekannte oder fehlerhafte Parameter dürfen den normalen App-Start nicht blockieren.
- Die QR-Code-Erzeugung ist eine zusätzliche Browser-Abhängigkeit, sofern keine passende lokale Implementierung verwendet werden kann. Die konkrete Bibliothek soll dem bestehenden einfachen Script-/Browser-Aufbau entsprechen.
- Tests orientieren sich an den bestehenden `node:test`- und VM-basierten Tests in `tests/`, insbesondere am PDF-Export-Test.




## 2 Erweiterter iCal-Filter:

Einbindung einer Filter-Option für importierte iCal-Kalender  

## 3 Export/Import von Vorlagen (JSON):

Ein einfacher Export- und Import-Button für das eigene Preset als JSON-Datei, falls man die Konfiguration im nächsten Jahr wiederverwenden möchte.
 