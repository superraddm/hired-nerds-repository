# Glow Girls: hair, wardrobe and shoe alignment

Updated 2026-09-06. Most of what this document originally set out as Photoshop work was done with image operations the same day and is live; the measurements and rules below are kept because they define the contract new art has to meet. What still needs a painter is in section 7.

## 1. The document and its landmarks

- Canvas 1024 x 1536, transparent. Every exported layer is this full size, never cropped, never moved. Registration is the whole contract.
- References: `master.png` (the mannequin: Sol's body wearing a black bralet and the unitard shorts, skin elsewhere from the neck to the hips, feet on the standing line; rebuilt by `tools/glowgirl-art/master-build.cjs`), `final/head-base-mask.png` (the part of Sol's head erased for the other girls), `final/head-hana-front.png`, `final/head-jia-front.png`.
- Landmarks (registered pixels):

| Landmark | Value |
|---|---|
| Head top (all three girls) | y = 61 |
| Head mask (Sol's head, erased for Hana/Jia) | x 451-580, y 61-232 |
| Hana head / Jia head | x 448-584 / 451-581, y 61-263 |
| Eyes (blink layer) | x 464-573, y 115-171 |
| Body silhouette | x 297-722, y 61-1409 |
| Torso centre band used for waist checks | x 430-590 |
| Bare midriff on the mannequin | y 440 down to the leg skin (about 600) |
| Ankle line (feet erased below this under boots) | y = 1240 |
| Standing line: every sole sits on it | y = 1408 |

## 2. Skin: the rule that replaced the per-girl problem

The game repaints skin on the mannequin and the heads to each girl's tone. It never repaints garments. So **no garment, shoe or hair layer may contain skin**: wherever a design shows skin, the layer is transparent and the mannequin shows through. Done on 2026-09-06 for every top, bottom and shoe (tight skin test derived from the master: hue 8.5-24.3, saturation 0.14-0.58, which leaves gold, orange and pink fabrics alone; plus a 30-pixel despeckle). The mannequin's torso was filled with skin so this works: the chest from the tops' own painted skin, the waist as a blend from the chest tone into the leg tone. Result: Hana and Jia are one tone from face to feet in every outfit.

Hair layers were left alone (the skin test would eat warm hair colours); the few skin pixels in `hana-floralhalo` and `rosewaves` are not visible at game size.

## 3. Tops and bottoms: the waist

The gap between a short top and a low waistband used to show the unitard as a black strip. With the mannequin bare from y 440 to the legs it shows midriff, which is the intended look for a crop top with shorts. The measured hems and waistbands are still useful for new art: keep every top's hem at or below y 475 and every waistband at or above y 515 so nothing reads as a badly fitted pair; the `neonmoto` hem (458) is the only outlier and is acceptable as a cropped jacket.

## 4. Shoes

- `shoes-orbitpoints`: the trouser flares of `bottom-orbitflares` were baked into the boot layer. Cut by geometry (boots in x 359-442 and 592-652 below y 1247, flare fabric and the panel corners removed) so the boots mix with any bottom. Done.
- Soles on the standing line: `bloomjanes` (+31), `cherryboots` (+46), `orbitpoints` (+26), `prismhightops` (+13), `sunburstboots` (+13) moved up so the sole is at y 1408. Done.
- Rule for new boots: sole at 1408; the shaft interior above the front rim goes in the rear file; keep the front layer's alpha tight at the rim. The mannequin's foot is erased only under the shoe's own front outline (dilated 2 px), no longer everything below the ankle line, so open shoes show the foot in the girl's tone.

## 5. Hair (Photoshop, Jof)

Three automatic seats went in (electric bob, floral halo, fauxhawk) plus four small moves for Hana, and it is still not right: the fit needs an eye on each style, so this is hand work. Everything below is prepared in `assets/glowgirls/sol/psd-import/hair-work/`:

| File | What it is |
|---|---|
| `hana-head-reference.png`, `jia-head-reference.png` | The mannequin with that girl's real in-game head (Sol's head cut out, hers painted in). Align hair to THIS, not to `master.png`. |
| `hair-<style>-merged.png` (10 files) | Each Hana/Jia style as one layer, rear and front combined, at its current position. |
| `sol-fit-standard-silverwaves.png`, `sol-fit-standard-cometbraid.png` | Sol wearing two of her own styles: what a correctly seated style looks like on this puppet. Sol's hair is signed off; do not touch her files. |

Photoshop, per style:

1. Open the girl's head reference. It is the full 1024 x 1536 canvas; never crop, never resize the canvas, never move the reference.
2. File > Place Embedded the style's `-merged.png`. It lands at its current registration. Keep it a Smart Object so scaling stays clean.
3. Free Transform (Ctrl+T). Drag the reference point to the brow line (about x 516, y 112) so scale works around the face. Move, and scale only if the style is clearly the wrong size for the head; keep proportions. Targets, judged by eye against the Sol standards:
   - hairline on the forehead (styles with a fringe reach the brow; centre-parted styles show a little forehead, as Sol's silver waves do);
   - temples covered and the ears framed as the style intends;
   - no painted skull showing above or beside the hair;
   - crown 20-40 px above the top of the skull (skull top is y 61), never touching the canvas top;
   - nothing over the eyes or mouth unless the style is a side sweep.
4. Hide the reference layer. File > Export > Export As, PNG, transparency on, 100%, whole canvas. Do NOT use Quick Export or Export Layer, which write only the layer's bounds and lose registration. Save as `hair-<style>.png` in `hair-work/` (for example `hair-hana-petalbob.png`).
5. From the repo root:
   `node tools/split-front-rear.cjs public/fireworks/assets/glowgirls/sol/psd-import/hair-work/hair-hana-petalbob.png hair-hana-petalbob`
   The tool splits front/rear by the body silhouette (anything over the head or body goes in front) and copies the files it replaces to `psd-import/backup/`.
6. After the batch: `node tools/build-glowgirl-layers.cjs` (it also warns if any hair touches the canvas top), then `node tools/serve-fireworks.cjs` and check each style on the girl at http://localhost:8787/ with `?auto=1&dress=1`. A LAN address is printed for the iPad.
7. Ship: `git add public/fireworks/assets/glowgirls/sol/final public/fireworks/assets/glowgirls/sol/layers.json`, commit, `git push origin main`, then `bash tools/deploy-kpopboom.sh`. Or tell me to.

Notes: the head layers are bald skulls, so the hair alone decides the hairline. Where a fringe should cover the forehead, the hair must physically cover it. Ten styles, five per girl; Jia's neon tails is a copy of Sol's neon buns and may only need a nudge.

## 6. Outlines

`bottom-pixelpetals-front` and `top-bloomruffle-front` had an opaque near-black outline baked in. Peeled (opaque pixels with mean RGB under 45 touching transparency, eight passes). Done.

## 7. Still for a painter

- **Blink layers for Hana and Jia.** The blink painting is Sol's eyes, so the other two do not blink. One layer per head in the eye region (x 464-573, y 115-171), registered to that head.
- `face-moondrops-front.png` is empty while its rear is not; probably an export slip. The earrings still show because they fall outside the head silhouette.
- The mannequin's bralet is the original unitard restored wherever every closed top covers the bust, so no closed top can reveal it; the three open-front designs (petal jacket, moon moto, solar vest) show it as an undergarment by design. The chest skin around it is a union of the tops' own skin renderings and only looks right under a top. A future top that exposes bust or chest no current top exposes will show the bralet edge or need that patch painted; check it with the game composite before shipping.

## 8. Export and check

1. Export each item as one merged 1024 x 1536 PNG, `<category>-<id>.png`, no skin, sole on 1408.
2. `node tools/split-front-rear.cjs <merged.png> <category-id>` (boots: then move the rim interior to the rear file by hand).
3. `node tools/build-glowgirl-layers.cjs`, then `--check` must exit 0 before a deploy; the deploy script refuses to publish without the manifest.
4. `node tools/glowgirl-art/render-sheet.cjs` for a contact sheet without opening the game; `?auto=1&dress=1` in the game for the real thing.
