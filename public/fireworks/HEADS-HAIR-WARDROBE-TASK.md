# Glow Girls: hair, wardrobe and shoe alignment — Photoshop working guide

Written 2026-09-06 after the iPad pass, from measurements of the layers as they are now. Everything below is source-art work in the registered 1024 x 1536 frame. The game draws every layer exactly where it is authored; nothing here is fixed at runtime, and the rule from the optimisation handoff stands: never compensate for a misregistered or dirty layer with a runtime offset or filter.

Hana and Jia now have their own painted heads (`head-hana-front.png`, `head-jia-front.png` over `head-base-mask.png` on Sol's body). That is what makes the problems below visible: the hairstyles and several garments were fitted to Sol's head and Sol's skin tone.

## 1. Set up the document once

- Canvas 1024 x 1536, 72 ppi, transparent. Every exported layer is this full size, never cropped, never moved. Registration is the whole contract.
- Reference layers, locked, at the bottom of the stack: `master.png` (Sol's body, feet on the standing line), `final/head-base-mask.png` (the part of Sol's head that is erased for the other girls), `final/head-hana-front.png`, `final/head-jia-front.png`. Toggle the heads to fit hair to each girl.
- Landmarks (registered pixels, measured from the current files):

| Landmark | Value |
|---|---|
| Head top (all three girls) | y = 61 |
| Head mask (Sol's head, erased for Hana/Jia) | x 451-580, y 61-232 |
| Hana head | x 448-584, y 61-263 |
| Jia head | x 451-581, y 61-263 |
| Eyes (blink layer) | x 464-573, y 115-171 |
| Body silhouette | x 297-722, y 61-1409 |
| Torso centre band used for waist checks | x 430-590 |
| Waistband zone (from the pipeline gate) | y 455-625 |
| Ankle line (feet erased below this under boots) | y = 1240 |
| Standing line: every sole sits on it | y = 1408 |

- Sol's approved hairstyles are the reference for how a hairstyle should sit: front layers start at y = 63 (the hairline on the head top), rear layers start between y = 3 and y = 32.

## 2. Hair alignment (Hana and Jia)

The bounds scan flags art that touches the canvas edge. Four rear layers start at y = 0, which means the hair silhouette is clipped by the canvas: the hair was drawn too high or too large for the head it now sits on.

| Layer | Now (x, y) | What to do |
|---|---|---|
| `hair-hana-floralhalo-rear` | 373-658, 0-343 | Move down so the crown clears y ≈ 15 and the halo braids sit on the Hana head; check the front layer (417-614, 61-343) still meets the hairline |
| `hair-hana-petalpixie-rear` | 393-628, 0-263 | Same; pixie cut should end near the jaw (y ≈ 250) |
| `hair-jia-circuitfauxhawk-rear` | 390-683, 0-643 | Fauxhawk: its front layer starts at y = 131, so the fringe is 70 px lower than every other style. Re-seat both layers to the Jia head; crown clear of y ≈ 15 |
| `hair-jia-electricbob-rear` | 378-663, 0-323 | Move down; bob ends near the chin (y ≈ 300) |

Method for any hairstyle:
1. Put the girl's head layer on and hide the other two.
2. Place the hair as one merged layer. Scale is not free: the Sol styles fit a head 130 px wide, and these heads are the same width, so the fix is a move (and at most a few percent of scale), not a redraw.
3. Check three things: the parting or fringe lands on the hairline at y ≈ 61-70; the ears are covered or framed where the style intends; nothing reaches above y ≈ 15.
4. Export the merged layer, then split it into front and rear (section 6). For hair the rule is simple: what is over the head goes in front, what falls behind the shoulders goes in the rear.

Styles that are fine and can be used as fitting references: Hana `petalbob` (rear 18-298), `rosewaves` (60-763), `starlittwins` (26-763); Jia `braidmatrix` (38-783), `embershag` (18-673), `neontails` (17-533).

## 3. Tops and bottoms: the waist contract

There is no runtime fill between a top and a bottom. If a top's hem stops above a bottom's waistband, the master shows through as a strip. Measured at the torso centre (x 430-590), the current hems and waistbands are:

| Top | Hem y | | Bottom | Waistband top y |
|---|---|---|---|---|
| neonmoto | 458 | | silvershorts | 473 |
| cherrycircuit, midnightbow, prismbolero, solarvest | 475 | | flareskort, relaypleats, ribbonfringe, voltagewrap | 475 |
| bloomruffle, mintmesh | 476 | | cometbubble, pixelpetals | 476 |
| auroratop | 490 | | orbitflares | 483 |
| moonmoto | 520 | | auroraskort | 488 |
| petaljacket | 531 | | moonshorts | 496 |
| orbitcape | 575 | | petalskort | 506 |
| tailcoat | 781 | | cargoshorts | 515 |

Every pair where the hem number is smaller than the waistband number gaps. The worst: `neonmoto` gaps with every bottom (15-57 px); the seven range tops at 475-476 gap with `moonshorts`, `petalskort`, `cargoshorts` and `auroraskort` by 12-40 px.

Contract to paint to, so any top works with any bottom:
- **Every top reaches down to at least y = 500 across the whole torso width** (x 430-590). Extend the hem or the midriff skin band; `moonmoto` at 520 is the model.
- **Every bottom's waistband starts at or above y = 480.** Raise the waistband on `moonshorts` (496), `petalskort` (506), `cargoshorts` (515) and `auroraskort` (488) by painting the band upward; the pipeline gate already expects waistbands inside y 455-625.

That gives at least 20 px of overlap for every combination.

## 4. Baked skin in garments

The game protects skin pixels from recolouring but only repaints Sol's own body, blink and heads to the girl's tone. Skin that is baked into a garment or shoe layer stays Sol's colour, which is the mismatch on Jia's shins above the boots and on her midriff under some tops. Share of opaque pixels that read as skin, by layer:

| Layer | Skin % | Note |
|---|---|---|
| `shoes-sunburstboots-front` | 80 | Layer is mostly leg. Cut back to the boot; the leg is the master's job |
| `bottom-cometbubble-front` | 51 | Layer runs to y = 1031 and includes the legs. Cut to the shorts |
| `shoes-bloomjanes-front` | 49 | Includes ankle and foot skin. Cut to the shoe |
| `top-solarvest-front`, `top-bloomruffle-front`, `top-mintmesh-front`, `top-petaljacket-front` | 43-59 | Midriff/chest band. See below |
| `shoes-petalboots-rear` / `-front` | 35 / 19 | Shaft interior and shin |
| `bottom-flareskort-front` | 33 | Thigh skin below the hem |
| `bottom-pixelpetals-front` | 20 | Thigh skin between petals |
| `shoes-prismhightops`, `shoes-cherryboots`, `top-moonmoto`, `top-auroratop`, `top-midnightbow`, `top-prismbolero`, `top-orbitcape` | 15-21 | Small bands |

Rules:
- **Shoes and bottoms: no skin at all.** Erase it; the master's legs are underneath and are repainted per girl. Under boots the master's feet are erased automatically below y = 1240 wherever the boot's front layer covers them.
- **Tops: the midriff band is design** (it covers the master's unitard between hem and waistband), so it stays, but it must stop at the hem line from section 3 and carry no skin outside the torso (no arms, no neck). This band will still be Sol's tone on Hana and Jia until either the pipeline exports a per-girl variant or the game repaints it. Decide which: a runtime repaint of skin pixels inside garment layers is a small change to the tinter and I can make it if you prefer that to three exports per top.

## 5. Shoes

- **`shoes-orbitpoints`** contains the flared trouser legs of `bottom-orbitflares` (the layer runs from y = 1140 to 1434 and 3,500 of its rim pixels are navy fabric). Cut everything above the boot cuff out of the shoe layer; the flares belong to the bottoms only. Otherwise the boots cannot be worn with any other bottom.
- Every boot: the sole sits on y = 1408; nothing below 1409. The shaft interior above the front rim goes in the **rear** file so the leg is drawn inside the boot; the cuff back is cut off (the leg descends behind the front rim). Keep the front layer's alpha tight at the rim: it is dilated by one pixel at runtime to erase the master's foot, so a loose edge opens a seam.
- `sunburstboots`, `bloomjanes`, `cherryboots`, `prismhightops` all extend past y = 1408 (1414-1454): trim to the standing line.

## 6. Export and split

1. Export each item as **one merged layer**, full 1024 x 1536, PNG-24 with transparency, named `<category>-<id>.png` (categories `hair`, `top`, `bottom`, `shoes`, `face`). Do not author front and rear by hand.
2. Split it: `node tools/split-front-rear.cjs <merged.png> <category-id>`. Pixels over the body silhouette go to `-front`, the rest to `-rear`; existing files are kept as `.bak`. For boots, then move the rim interior to the rear file by hand (section 5).
3. Rebuild the manifest: `node tools/build-glowgirl-layers.cjs`. It prints any layer that touches a canvas edge; none should. `--check` must exit 0 before a deploy, and `bash tools/deploy-kpopboom.sh` refuses to publish without the manifest.
4. Look at it in the game with `?auto=1&dress=1` on the laptop (all three girls, every category) and once on the iPad.

## 7. Also on the list

- `face-moondrops-front.png` is empty while its rear layer is not; the only empty front layer. Probably an export slip.
- `bottom-pixelpetals-front.png` and `top-bloomruffle-front.png` carry an opaque near-black outline (about 11,000 and 4,700 pixels). `node tools/strip-dark-rim.cjs <in> <out>` peels it on a copy if you would rather not repaint; check the result on a dark background.
- Hana and Jia do not blink: the blink layer is Sol's eyes. A blink layer per head (same 464-573, 115-171 region) finishes the head work.

## Not part of this task

Tint strength, skin protection and the registered coordinate contract are signed off and unchanged. The quality tiers, layout owner and caches in `index.html` do not need to know about any of the above.
