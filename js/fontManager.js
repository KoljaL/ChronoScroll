/**
 * CRONOSCROLL — FONT LOADING AND PDF EMBEDDING
 * Bundled TTF fonts and local user uploads for preview and plotter PDFs.
 */

window.CronoFonts = (function() {
  'use strict';

  const styles = {
    normal: { weight: '400', style: 'normal' },
    bold: { weight: '700', style: 'normal' },
    italic: { weight: '400', style: 'italic' }
  };
  const customFamily = 'CronoScroll Custom';
  let customFont = null;
  let standardFontsLoaded = false;

  function getStandardFontKey(fontKey) {
    if (fontKey === 'serif' || fontKey === 'times') return 'serif';
    if (fontKey === 'mono' || fontKey === 'courier') return 'mono';
    return 'sans';
  }

  function decodeBase64(data) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function encodeBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  async function loadFamilyFaces(family, fontStyles) {
    const faces = await Promise.all(Object.entries(styles).map(async ([styleName, descriptors]) => {
      const face = new FontFace(family, decodeBase64(fontStyles[styleName]), descriptors);
      await face.load();
      return face;
    }));
    faces.forEach(face => document.fonts.add(face));
  }

  async function loadStandardFonts() {
    if (standardFontsLoaded) return;
    const fonts = window.CronoEmbeddedFonts;
    if (!fonts) throw new Error('Die eingebetteten Standardschriften sind nicht geladen.');
    await Promise.all(Object.values(fonts).map(font => loadFamilyFaces(font.family, font.styles)));
    standardFontsLoaded = true;
  }

  function getCustomStyles(base64) {
    return { normal: base64, bold: base64, italic: base64 };
  }

  async function loadCustomFont(file) {
    if (!/\.ttf$/i.test(file.name)) {
      throw new Error('Bitte eine TrueType-Datei mit der Endung .ttf auswählen.');
    }

    const buffer = await file.arrayBuffer();
    const signature = String.fromCharCode(...new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength)));
    if (signature !== '\u0000\u0001\u0000\u0000' && signature !== 'true') {
      throw new Error('Die Datei ist keine unterstützte TTF-Schrift.');
    }

    const base64 = encodeBase64(buffer);
    const probe = new window.jspdf.jsPDF();
    probe.addFileToVFS('CronoScrollCustomProbe.ttf', base64);
    probe.addFont('CronoScrollCustomProbe.ttf', 'CronoScrollCustomProbe', 'normal');

    const fontStyles = getCustomStyles(base64);
    const faces = await Promise.all(Object.entries(styles).map(async ([styleName, descriptors]) => {
      const face = new FontFace(customFamily, decodeBase64(fontStyles[styleName]), descriptors);
      await face.load();
      return face;
    }));

    document.fonts.forEach(face => {
      if (face.family === customFamily) document.fonts.delete(face);
    });
    faces.forEach(face => document.fonts.add(face));
    customFont = {
      family: customFamily,
      pdfName: 'CronoScrollCustom',
      styles: fontStyles,
      fileName: file.name
    };
    return { fileName: file.name };
  }

  function getCanvasFamily(fontKey) {
    if (fontKey === 'custom') return customFont ? `"${customFamily}"` : null;
    if (!standardFontsLoaded) return null;
    const font = window.CronoEmbeddedFonts[getStandardFontKey(fontKey)];
    return font ? `"${font.family}"` : null;
  }

  function registerPdfFont(doc, fontKey) {
    const font = fontKey === 'custom'
      ? customFont
      : window.CronoEmbeddedFonts[getStandardFontKey(fontKey)];
    if (!font) throw new Error('Die ausgewählte Schrift ist nicht verfügbar. Bitte erneut auswählen.');

    Object.keys(styles).forEach((styleName) => {
      const fileName = `${font.pdfName}-${styleName}.ttf`;
      doc.addFileToVFS(fileName, font.styles[styleName]);
      doc.addFont(fileName, font.pdfName, styleName);
    });
    return font.pdfName;
  }

  function hasCustomFont() {
    return customFont !== null;
  }

  function getCustomFontName() {
    return customFont ? customFont.fileName : '';
  }

  return {
    loadStandardFonts,
    loadCustomFont,
    getCanvasFamily,
    registerPdfFont,
    hasCustomFont,
    getCustomFontName
  };
})();
