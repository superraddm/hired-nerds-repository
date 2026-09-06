# Glow Girls: heads, hair alignment and wardrobe clean-up (future task)

Raised 2026-09-06 during the iPad 5 optimisation pass. None of this is a runtime problem: the compositor draws every layer exactly as authored at its registered 1024 x 1536 position. These are source-art jobs, and the rule from the optimisation handoff stands: never compensate for a misregistered or dirty layer with a runtime offset or filter.

## 1. Heads for Hana and Jia

Hana and Jia currently wear Sol's body with a painted head swap (`head-hana-front.png`, `head-jia-front.png` over `head-base-mask.png`) and differ from Sol by skin tone and starting look. The intent recorded in the puppet pipeline notes is a proper master per girl: Sol's body and pose, a new head and skin, registered to the same 1024 x 1536 frame so every garment still fits all three. Deliverables:

- `head-hana-front.png` and `head-jia-front.png` re-authored to the studio standard (or full masters if the pipeline moves that way), plus a blink layer per girl. Until then Hana and Jia do not blink (deliberate: Sol's blink painting would flash Sol's eyes on their faces).
- Sign-off in `glow-lab.html` and the numeric gate (`gate.py`) before anything lands in `final/`.

## 2. Hair alignment

The alpha-bounds scan (`node tools/build-glowgirl-layers.cjs`) flags art that touches the canvas edge. Four hair rear layers touch the top edge at y = 0, which means the art is clipped, and all four belong to the head-swap girls:

| Layer | Bounds (x, y) |
|---|---|
| `hair-hana-floralhalo-rear` | 375-655, 0-340 |
| `hair-hana-petalpixie-rear` | 395-625, 0-260 |
| `hair-jia-circuitfauxhawk-rear` | 392-680, 0-640 |
| `hair-jia-electricbob-rear` | 380-660, 0-320 |

Sol's hair (for comparison `hair-moonpony-rear` starts at y = 6) is fine. Re-register these with the head work above; the scan is a cheap lint to re-run afterwards.

## 3. Wardrobe clean-up

Found while checking a "white / black background on Sol's clothes" report. Rendering the layers alone on a dark background shows the defect is in the PNGs:

- **`bottom-pixelpetals-front.png`** — an opaque near-black outline around every petal edge (about 11,000 black pixels, 75% of the layer's rim). Reads as a black silhouette behind the skirt on the dark mirror and on stage.
- **`top-bloomruffle-front.png`** — the same outline around the ruffles (about 4,700 pixels).
- **`face-moondrops-front.png`** is empty while its rear layer is not. The only empty front layer in the wardrobe; probably an export slip.

Other new-range pieces with dark rims (`orbitflares`, `orbitcape`, `orbitpoints`, `cometbubble`, `mintmesh`, `bloomjanes`) are navy or have a thin designed edge and look right on a dark ground; leave them.

A conservative automatic fix was trialled and looks clean on both Pixel Bloom pieces: peel opaque pixels with mean RGB under 45 that touch a transparent pixel, eight passes (8-neighbourhood), nothing else. `tools/strip-dark-rim.cjs` does this to a copy; Jof chose not to apply it during the optimisation pass so the art pipeline owns the change. Whichever route is taken, re-run the layers manifest afterwards:

```
node tools/strip-dark-rim.cjs public/fireworks/assets/glowgirls/sol/final/bottom-pixelpetals-front.png <out.png>
node tools/build-glowgirl-layers.cjs          # rebuild layers.json
node tools/build-glowgirl-layers.cjs --check  # must exit 0 before deploy
```

## Not part of this task

Tint strength, skin protection and the registered-puppet coordinate contract are signed off and unchanged. The quality tiers, layout owner and caches in `index.html` do not need to know about any of the above.
