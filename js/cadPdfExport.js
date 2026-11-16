(function() {
  'use strict';

  async function exportCadDrawing(svgEl, baseViewBox, filename) {
    if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') {
      throw new Error('jsPDF ist nicht geladen.');
    }
    const doc = new window.jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    if (typeof doc.svg !== 'function') {
      throw new Error('Der SVG-zu-PDF-Vektorexport ist nicht verfügbar.');
    }

    const previousViewBox = svgEl.getAttribute('viewBox');
    svgEl.setAttribute('viewBox', `${baseViewBox.x} ${baseViewBox.y} ${baseViewBox.w} ${baseViewBox.h}`);
    try {
      await doc.svg(svgEl, { x: 0, y: 0, width: 297, height: 210 });
    } finally {
      svgEl.setAttribute('viewBox', previousViewBox);
    }
    doc.save(filename);
  }

  window.CronoScrollCADPdf = Object.freeze({ exportCadDrawing });
})();
