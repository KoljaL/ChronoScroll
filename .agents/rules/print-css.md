---
trigger: glob
globs: "**/*.css, **/*.html"
---

# Print & Layout Rules

- **Print Media Integrity:** Ensure `@media print` rules preserve exact millimeter dimensions, margins, and cut marks without browser scaling artifacts.
- **Color Palettes:** Respect print-safe and accessible color palettes (e.g., Okabe-Ito / Paul Tol) with high contrast for paper output.
- **Self-Contained Assets:** Keep icons and UI graphics inline as compact SVGs; never link external web fonts or remote stylesheets.
- **Input & DOM Stability:** Never alter or remove existing input `id` attributes or data bindings when styling or reorganizing sidebar elements.
