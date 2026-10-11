# Little Patterns round 4: the Nook frame (proposal, not built)

Read in this order. **The builder starts from `BUILD-BRIEF.md`** (the frozen, consolidated brief with Jof's eight decisions) and `build-brief.html` (the same, with images).

1. `../little-patterns-review-round-4.md` - the brief: Jof's eleven findings, Fable's diagnosis, the education paths, and section 4, which is the approved build brief (amended by the passes below).
2. `review-opus-pass-1.md` - Opus 5.5 pass 1: 34 numbered recommendations, the motion specification (section 4 of that file), risks.
3. `review-fable-pass-1.md` - Fable's answers by number, what changed in the mockups, questions for Jof.
4. `review-opus-pass-2.md` - Opus 5.5 pass 2: approval of the design as the build brief, items 35 to 53.
5. `review-fable-pass-2.md` - Fable's final pass: 35 to 43 applied, 44 to 53 answered.
6. `review-codex-pass-1.md` - Codex pass 1: items 54 to 68 and the character decision (original Nook, new expressions). `nook-design-profile.md` is the character profile and acceptance checks; `codex-review/` holds the expression sheets.
7. `review-fable-pass-3.md` - Fable's guidance on the Codex pass: adopt all but the quiet pre-success Next; two design overrides; freeze the brief next.
8. `proposal.html` - the presentation for Jof: before/after screenshots, every screen, Nook's feelings sheet, the five decisions. Self-contained (images embedded); open in a browser.

Mockups (static design screens, not game code, not on the deploy allow-list):
- `mockups/mock.html?screen=<name>` renders one screen. Names: shelf, shelf-over-count, count, add, add-help, add-done, add-bridge, take, words, patterns, shapes-sides, shapes-sides-done, shapes-name, feelings-board, feelings-perform, feelings-perform-sad, feelings-match, feelings-me, nook-sheet.
- `mockups/frame.css` - the Nook frame layout (phone portrait first, phone landscape under 520 px tall, tablet from 760 px).
- `mockups/nook-art.js` - Nook as SVG: ten feelings plus greet, pose/idle groups separated, arms and leaves on pivots.
- `mockups/icons.js` - tile and control icons.
- `mockups/shoot.cjs` - the screenshot harness (headless Chrome over CDP, Node 22, no dependencies). `node shoot.cjs <outDir>` shoots every screen at six viewports and prints CHECK lines for page overflow, content clipped inside the card, truncated labels, or an answer overlapping Nook.

Screenshots: `shots/` - prefixes phone (412x860), small (360x740), land (915x356), land2 (740x360), ipad (1024x698), desk (1280x800); `current-*` are the live build before the redesign; `current-feelings-jof.png` is Jof's own phone capture.

Related context: `../arthur-games-scope.md`, `../arthur-learning-design.md`, `../little-patterns-review-round-3.md`, `../nook-feelings-build.md`, `../nook-voice-gemini.md`. The live game code is under `public/fireworks/little-patterns/`; tests under `tools/test-little-patterns*.cjs`; deploy allow-list `tools/stage-little-patterns.cjs`.

## Codex review and original-style Nook redraw (11 October)

After the four existing passes, read `review-codex-pass-1.md` (findings 54–68) and `nook-design-profile.md`. Open `codex-review/index.html` for the original/proposed comparison, revised expression sheet and face close-ups. The short Opus handoff is `codex-review/opus-handoff.md`.

Jof explicitly chose the original Nook identity over the proposed vector proportions. He accepted the new redraw's fidelity to the original style and requested clearer differences between Hello, Calm, Happy and Proud. The final expression sheet addresses that feedback. The original PNG remains the geometry master; the new sheet supplies expression/posture guidance. Codex's other findings are recommendations to reconcile with the approved brief, not an implementation or deployment record.
