# Glow Girls art tools

Offline helpers for the registered-puppet layers in `public/fireworks/assets/glowgirls/sol/`. All use the `sharp` copy under `hirednerds-chat/app/node_modules`.

- `render-sheet.cjs` — composite puppets straight from the layer files (game stacking order, no tint) into a contact sheet:
  `node render-sheet.cjs sheet out.jpg <x,y,w,h crop> <scale> girl:layer,layer ...` (girl = sol|hana|jia; layers without `-front/-rear`). `MASTER=<path>` overrides the master for trials.
- `looks-specs.mjs [girl]` — prints render specs for every look in the fixed deal, read from `index.html`.
- `artops-2026-09-06.cjs` — the batch that was run on 2026-09-06 (skin erase on all garments, boots to the standing line, dark-rim peel, orbitpoints flare cut, master torso fill). Kept as a record of the operations and their parameters; the master and orbitpoints steps were then refined by hand-tuned versions, see `HEADS-HAIR-WARDROBE-TASK.md`.
- `../split-front-rear.cjs`, `../strip-dark-rim.cjs`, `../build-glowgirl-layers.cjs` — split a merged layer, peel a black outline, rebuild/check `layers.json`.

The untouched originals of every file the batch changed are in the session scratch folder `scratchpad/artcheck/originals/`; the previous committed versions are also in git history (commit before "Glow Girls art: …").
