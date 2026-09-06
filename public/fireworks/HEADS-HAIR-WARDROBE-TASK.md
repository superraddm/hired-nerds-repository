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

## 5. Hair

Checked through the game's own compositor (the offline sheet renderer can flatter a style at the head, which is how the first pass missed these). Three Hana/Jia styles were seated too high, leaving painted skull bare at the forehead and temple:

| Style | Fix |
|---|---|
| `hair-jia-electricbob` | moved +4 x, +20 y |
| `hair-hana-floralhalo` | moved +20 y |
| `hair-jia-circuitfauxhawk` | crest re-split into the front layer, then moved +10 y |

Method: `tools/glowgirl-art/hair-coverage.cjs` flags a style whose skull/temple cover falls below Sol's five; `hair-seat.cjs` shifts the merged hair; candidates at several offsets are rendered with the game compositor and chosen by eye (20 px too far and the skull shows above the hair); split, rebuild the manifest. The other twelve styles were within Sol's band and were left alone; the braid-matrix buns are large by design.

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
