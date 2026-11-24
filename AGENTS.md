# ChronoScroll – Agent Guidelines

## Core Architecture & Constraints
- **Zero-Build & Offline-First:** Pure Vanilla HTML5, CSS3, and ES6+ JavaScript. The entire application must work directly via the `file://` protocol without any local dev server, bundler, compiler, or external CDN dependencies.
- **No Frameworks or Runtime Dependencies:** Do not introduce React, Vue, Tailwind, TypeScript, or npm runtime dependencies. Keep external dependencies at zero.
- **Domain Context:** Parametric continuous roll-calendar generator with an integrated 2D CAD workspace, bill-of-materials (BOM) export, print-safe color palettes, and JSON preset import/export.

## Token-Saving & Workflow Rules (Strict)
1. **Plan First:** Before modifying any code, output a concise bullet-point plan (max 5 bullets) and clarify any ambiguities. Wait for user confirmation before multi-file changes.
2. **Surgical Edits:** Never rewrite entire files for small changes. Use targeted, minimal search-and-replace edits.
3. **Read Selectively:** Only inspect files directly relevant to the current task. Do not scan the entire repository or large preset files unless explicitly asked.
4. **Preserve UI Aesthetics:** Maintain the minimalist, technical, print-safe aesthetic. Avoid glossy 3D effects, unrequested redesigns, or generic AI styling.

## Regression Protection & Stability (Critical)
- **Zero-Regression Policy:** All existing features, calculations, SVG outputs, and JSON preset schemas work and must remain 100% functional. Never alter mathematical formulas, default values, or JSON export keys without explicit user approval.
- **No Unsolicited Refactoring:** Do not rename existing CSS classes, DOM element IDs, or state properties that tests or presets depend on. When reorganizing the UI or sidebar, keep existing input bindings (`id`, `name`, `data-*`) intact or provide seamless backwards compatibility.
- **Backwards-Compatible Presets:** When adding new parameters, always provide fallback defaults (`?? DEFAULT_VALUE`) so older JSON presets load without errors.
- **Verification with Test Suite:**
  - The project uses the native Node.js test runner:
    ```bash
    npm test
    # or directly:
    node --test tests/*.test.js
    ```
  - Note: `tests/realPdfExport.test.js` requires `jspdf` from devDependencies (`npm install`). All other 12 unit test files run with zero dependencies directly via Node.js.
  - Run the test suite after any logic or UI change to verify zero regressions.
