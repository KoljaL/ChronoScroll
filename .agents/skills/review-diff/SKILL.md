---
name: review-diff
description: Audits staged or recent changes in ChronoScroll for file:// compatibility, zero-dependency rules, millimeter/print accuracy, and runs test regression checks.
---

# ChronoScroll Diff Audit

1. Inspect only the modified files (`git diff`).
2. Verify that no external URLs, CDNs, ES module CORS issues under `file://`, or runtime build-step dependencies were introduced.
3. Check that SVG coordinates and CSS print units remain in clean millimeters.
4. Verify that existing input IDs, state keys, and calculation formulas were not broken or renamed.
5. Run tests: `npm test` (or `node --test tests/*.test.js`).
6. Report findings as a brief checklist (max 10 lines). Do not apply edits unless asked.
