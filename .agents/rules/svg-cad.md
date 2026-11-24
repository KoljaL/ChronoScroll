---
trigger: glob
globs: "**/*.js, **/*.svg"
---

# SVG & 2D CAD Rules

- **Hand-Crafted Clean SVG:** Generate compact, mathematically clean SVG primitives (`<rect>`, `<line>`, `<circle>`, `<path>` with rounded coordinates) instead of bloated decimal chains.
- **Millimeter Precision:** Maintain exact millimeter scaling (`viewBox` and physical `mm` units) for both the roll-calendar print output and the 2D wooden frame CAD drawings.
- **No Gradients/Filters:** Keep SVG exports flat, high-contrast, and plotter/printer-friendly without raster filters or complex gradients.
- **Shared Geometry Calculations:** Ensure calendar previews, print SVGs, and CAD cut drawings derive from consistent geometric formulas rather than redundant parallel calculations.
