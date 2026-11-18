#!/usr/bin/env python3
"""
================================================================================
PDF-PANORAMA & PLOTTER-MONTAGE SKRIPT (macOS)
================================================================================

WAS MACHT DIESES SKRIPT?
1. Öffnet einen nativen macOS-Finder-Auswahldialog, in dem du mehrere PDF-Dateien
   gleichzeitig markieren kannst (mit gedrückter Cmd- oder Shift-Taste).
2. Liest die exakten Seitenmaße jeder gewählten Datei automatisch aus.
3. Platziert alle PDFs nebeneinander auf einer neuen, großen Seite und lässt
   zwischen den Dateien einen konfigurierbaren Spalt (Standard: 1,0 mm).
4. Zeichnet in die Mitte jedes Spalts alle 50 cm eine sehr feine, kaum
   sichtbare Schnittmarke (als Schneidehilfe nach dem Plotten).
5. Übernimmt die Dokument-Metadaten (Titel, Autor etc.) aus der ersten Datei.
6. Wandelt auf Wunsch (--outline) alle Schriften über Ghostscript in
   Vektorpfade (Kurven) um – ideal für externe Großformat-Plotter.
7. Speichert das Ergebnis im selben Ordner wie die erste ausgewählte Datei.

VORAUSSETZUNGEN & INSTALLATION (im macOS-Terminal ausführen):
- Python 3 (auf macOS vorhanden oder via 'brew install python')
- Benötigte Python-Bibliotheken:
    pip3 install pypdf reportlab
- Optional (nur nötig, wenn der Parameter '--outline' genutzt wird):
    brew install ghostscript

ANWENDUNG IM TERMINAL:
- Für schnelle Aufrufe direkt über das Terminal:
    chmod +x merge_pdfs.py
- Standard (Schriften bleiben eingebettet):
    python3 merge_pdfs.py
- Für Plotter-Druck (Schriften werden in Vektorpfade umgewandelt):
    python3 merge_pdfs.py --outline
================================================================================
"""

import io
import os
import subprocess
import sys
from pypdf import PdfReader, PdfWriter, Transformation
from reportlab.pdfgen import canvas

# ==============================================================================
# KONFIGURATION (Hier Werte nach Bedarf anpassen)
# ==============================================================================
OUTPUT_FILENAME = 'gesamt_druckfertig.pdf'  # Name der fertigen Zieldatei

GAP_MM = 1.0              # Abstand/Spalt zwischen den einzelnen PDFs in Millimetern
MARK_INTERVAL_CM = 50.0   # Vertikaler Abstand der Schnittmarken in Zentimetern
MARK_LENGTH_MM = 4.0      # Gesamtlänge einer einzelnen Schnittmarke in Millimetern
MARK_GRAY = 0.85          # Grauwert der Marken: 0.0 = Schwarz, 0.85 = Hellgrau, 1.0 = Weiß
# ==============================================================================

# Umrechnungsfaktoren in PDF-Points (1 Inch = 72 Points = 25.4 mm)
MM_TO_PT = 72.0 / 25.4
CM_TO_PT = 72.0 / 2.54


def select_pdfs_via_macos_dialog():
    """
    Öffnet den nativen macOS-Finder-Dialog zur Mehrfachauswahl von PDF-Dateien.
    Gibt eine Liste der ausgewählten Dateipfade zurück.
    """
    applescript = '''
    set chosenFiles to choose file with prompt "Bitte die PDF-Dateien auswählen (Cmd-Taste für Mehrfachauswahl):" of type {"com.adobe.pdf"} with multiple selections allowed
    set pathList to {}
    repeat with aFile in chosenFiles
        set end of pathList to POSIX path of aFile
    end repeat
    set AppleScript's text item delimiters to linefeed
    return pathList as text
    '''
    try:
        result = subprocess.run(
            ['osascript', '-e', applescript],
            capture_output=True,
            text=True,
            check=True
        )
        # Pfade aus der Rückgabe extrahieren und leere Zeilen herausfiltern
        files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        return files
    except subprocess.CalledProcessError:
        # Tritt ein, wenn der Nutzer im Finder-Dialog auf "Abbrechen" klickt
        return []


def create_marks_overlay(width_pt, height_pt, gap_centers_x):
    """
    Erzeugt eine transparente PDF-Seite in der Zielgröße und zeichnet mittig
    in jedem Spalt alle 50 cm eine feine, hellgraue Schnittmarke.
    """
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width_pt, height_pt))

    c.setStrokeColorRGB(MARK_GRAY, MARK_GRAY, MARK_GRAY)
    c.setLineWidth(0.25)  # Feine Haarlinie (0.25 Points)

    interval_pt = MARK_INTERVAL_CM * CM_TO_PT
    half_len_pt = (MARK_LENGTH_MM * MM_TO_PT) / 2.0

    for x in gap_centers_x:
        y = 0.0
        # Schleife von unten (0 cm) bis zum oberen Rand des Dokuments
        while y <= height_pt + 1.0:
            y_start = max(0.0, y - half_len_pt)
            y_end = min(height_pt, y + half_len_pt)
            c.line(x, y_start, x, y_end)
            y += interval_pt

    c.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]


def main():
    # Prüfen, ob das Skript mit dem Flag '--outline' gestartet wurde
    convert_to_outlines = '--outline' in sys.argv

    # 1. Dateien über den macOS-Finder-Dialog auswählen
    print("Öffne macOS-Dateiauswahl...")
    files = select_pdfs_via_macos_dialog()

    if not files:
        print("Auswahl abgebrochen oder keine Dateien gewählt. Skript beendet.")
        sys.exit(0)

    # Dateien alphabetisch sortieren, damit die Reihenfolge im Finder (z. B. teil1, teil2, teil3) stimmt
    files.sort()

    print(f"{len(files)} Datei(en) ausgewählt:")
    for f in files:
        print(f"  - {os.path.basename(f)}")

    # 2. PDFs einlesen und jeweils die erste Seite laden
    readers = [PdfReader(f) for f in files]
    pages = [r.pages[0] for r in readers]

    gap_pt = GAP_MM * MM_TO_PT

    # 3. Neue Gesamtgröße dynamisch berechnen
    # Gesamtbreite = Summe aller Einzelbreiten + (Anzahl der Spalten * Spaltbreite)
    total_width_pt = sum(float(p.mediabox.width) for p in pages) + gap_pt * (len(pages) - 1)
    max_height_pt = max(float(p.mediabox.height) for p in pages)

    total_width_cm = total_width_pt / CM_TO_PT
    max_height_cm = max_height_pt / CM_TO_PT
    print(f"Berechnete Zielgröße: {total_width_cm:.2f} cm x {max_height_cm:.2f} cm (inkl. {GAP_MM} mm Spalt)")

    # 4. Neues Zieldokument mit den berechneten Maßen anlegen
    writer = PdfWriter()
    target_page = writer.add_blank_page(width=total_width_pt, height=max_height_pt)

    current_x = 0.0
    gap_centers_x = []

    # 5. Einzelne PDFs nebeneinander auf der Zielseite platzieren
    for i, p in enumerate(pages):
        p_width = float(p.mediabox.width)
        p.add_transformation(Transformation().translate(tx=current_x, ty=0))
        target_page.merge_page(p)
        current_x += p_width

        # Falls noch ein weiteres PDF folgt, Spaltmitte für Schnittmarken speichern
        if i < len(pages) - 1:
            gap_centers_x.append(current_x + (gap_pt / 2.0))
            current_x += gap_pt

    # 6. Schnittmarken-Ebene über die Spalten legen
    if gap_centers_x:
        marks_page = create_marks_overlay(total_width_pt, max_height_pt, gap_centers_x)
        target_page.merge_page(marks_page)

    # 7. Metadaten (Titel, Autor etc.) aus der ersten Datei übernehmen
    if readers[0].metadata:
        writer.add_metadata(readers[0].metadata)

    # Ausgabepfad im selben Ordner wie die erste ausgewählte Datei festlegen
    output_dir = os.path.dirname(files[0])
    final_output_path = os.path.join(output_dir, OUTPUT_FILENAME)
    temp_output_path = os.path.join(output_dir, "temp_" + OUTPUT_FILENAME)

    # 8. Zusammengefügtes PDF speichern
    save_target = temp_output_path if convert_to_outlines else final_output_path
    with open(save_target, 'wb') as out:
        writer.write(out)

    # 9. Optionale Umwandlung aller Schriften in Vektorpfade via Ghostscript
    if convert_to_outlines:
        print("Wandle Schriften via Ghostscript in Vektorpfade um...")
        try:
            subprocess.run([
                "gs",
                "-o", final_output_path,
                "-dNoOutputFonts",
                "-sDEVICE=pdfwrite",
                temp_output_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            os.remove(temp_output_path)
            print(f"Erfolgreich gespeichert (inkl. Pfad-Umwandlung):\n  -> {final_output_path}")
        except FileNotFoundError:
            print("FEHLER: Ghostscript ('gs') ist nicht installiert. Bitte 'brew install ghostscript' ausführen.")
            print(f"Die Datei ohne Pfad-Umwandlung liegt unter: {temp_output_path}")
        except subprocess.CalledProcessError as e:
            print(f"FEHLER bei der Ghostscript-Verarbeitung: {e}")
    else:
        print(f"Erfolgreich gespeichert (Schriften eingebettet):\n  -> {final_output_path}")


if __name__ == '__main__':
    main()
