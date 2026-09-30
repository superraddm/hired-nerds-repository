# Fireworks wardrobe range production

This is the repeatable process for turning one short theme brief into a three-look Fireworks clothing range. It is designed to minimize initial image-generation calls, prompt tokens, and correction passes while keeping every piece mix-and-match compatible.

## The production contract

- One normal range contains 3 complete looks.
- Each look is generated once as a registered full outfit: 1 top, 1 bottom, and 1 pair of shoes.
- The normal cost floor is therefore 3 image-generation calls for 9 usable wardrobe pieces.
- Only use a fourth separation render when two categories physically overlap, such as full-length trousers covering shoes or a continuous evening dress crossing the top/bottom boundary.
- Final game layers are always 1024×1536 RGBA PNGs. Each front layer contains one isolated item. Each rear layer is a transparent 1024×1536 placeholder unless the design genuinely passes behind the body.
- The immutable reference is `assets/glowgirls/sol/master.png`. Never generate from a previous generation unless correcting one material or producing a separation variant.

## Fixed master registration

Coordinates use a top-left origin: X increases rightward and Y increases downward.

| Registration fact | Exact value |
|---|---:|
| Canvas | 1024×1536 px |
| Character centre line | X = 512 |
| Master non-transparent bounds | X 299–719, Y 63–1406 |
| Crown | Y = 63 |
| Standard top working band | Y 200–475 |
| Top/bottom hand-off | Y 475 |
| Waist/upper-bottom band | Y 475–515 |
| Standard short-bottom maximum | Y 805 |
| Footwear working band | Y 1140–1485 |
| Master-foot erase line when shoes are active | Y = 1240 |
| Maximum generated footwear baseline in this range | Y = 1454 |

The canvas, centre line, crown, pose, hand locations, anatomy, camera, perspective, lighting direction, ankles, and foot baseline are registration—not creative variables. A source can be normalized only when it is within 2 px of 1024×1536. Anything farther away must be regenerated.

Useful master row spans for diagnosing drift:

| Y | Non-transparent X spans on the master |
|---:|---|
| 240 | 485–547 |
| 475 | 366–409, 443–578, 615–659 |
| 515 | 349–401, 425–594, 623–675 |
| 690 | 307–342, 381–498, 520–637, 676–712 |
| 825 | 394–477, 541–625 |
| 960 | 391–456, 563–628 |
| 1140 | 388–435, 583–631 |
| 1240 | 392–429, 588–625 |
| 1360 | 370–425, 587–642 |

## Exact garment silhouette envelopes

Every output remains a full 1024×1536 PNG. These envelopes define where the extractor is allowed to keep source pixels.

| Silhouette | Allowed X/Y envelope |
|---|---|
| Standard crop top, corset, halter, or vest | X 330–700; Y 200–475 |
| Asymmetric cape top | Union of X 235–700, Y 190–575 and sleeve X 605–720, Y 250–720 |
| Standard shorts or mini/skort | X 315–715; Y 475–805 |
| Asymmetric flame skort | X 340–690; Y 475–760 |
| Ribbon/fringe mini | X 335–695; Y 475–860 |
| Knee-length architectural skirt | X 260–765; Y 475–960 |
| Bubble shorts with long side panel | X 340–735; Y 475–1030 |
| Full split-flare trousers, waist to upper calf | X 355–670; Y 475–760 |
| Full split-flare trousers, lower flare | X 260–765; Y 761–1475 |
| Shoes and boots | X 285–750; Y 1140–1485 |

For a future non-standard silhouette, add one explicit item-ID branch to `categoryAllowed()` in `tools/build-wardrobe-batch.cjs`. Do not broaden a global envelope to accommodate one design; that lets sleeves, hands, other garments, and background pixels leak into unrelated layers.

## Accepted asset bounds from the E–K range

These are the real alpha bounds after extraction and are useful comparison targets.

| Look | Piece | Final alpha bounds X0,Y0–X1,Y1 |
|---|---|---|
| E Prism Relay | top-prismbolero | 424,236–598,475 |
| E Prism Relay | bottom-relaypleats | 348,475–663,716 |
| E Prism Relay | shoes-prismhightops | 357,1140–658,1421 |
| F Cherry Voltage | top-cherrycircuit | 424,241–599,475 |
| F Cherry Voltage | bottom-voltagewrap | 370,475–645,736 |
| F Cherry Voltage | shoes-cherryboots | 355,1140–659,1454 |
| G Blue Orbit | top-orbitcape | 261,190–720,720 |
| G Blue Orbit | bottom-orbitflares | 283,483–731,1443 |
| G Blue Orbit | shoes-orbitpoints | 285,1140–733,1434 |
| H Pixel Bloom | top-bloomruffle | 364,201–662,476 |
| H Pixel Bloom | bottom-pixelpetals | 268,476–752,961 |
| H Pixel Bloom | shoes-bloomjanes | 356,1141–658,1440 |
| I Solar Flare | top-solarvest | 424,240–598,475 |
| I Solar Flare | bottom-flareskort | 358,475–657,750 |
| I Solar Flare | shoes-sunburstboots | 360,1140–652,1421 |
| J Midnight Ribbon | top-midnightbow | 409,262–616,475 |
| J Midnight Ribbon | bottom-ribbonfringe | 346,475–673,825 |
| K Mint Comet | top-mintmesh | 365,201–662,476 |
| K Mint Comet | bottom-cometbubble | 340,476–735,1031 |

## Minimum-context input packet

For a new range, start a fresh production session with only this information:

```text
Project: C:\hirednerds-portfolio\public\fireworks
Immutable model: assets\glowgirls\sol\master.png (1024x1536)
Range size: exactly 3 looks; each needs 1 top, 1 bottom, 1 shoes.
Theme brief: <service workers / college clothes / evening wear / other>
Audience and tone: <short phrase>
Must include: <short list>
Must avoid: repeated silhouettes, logos, text, props, hair, face changes.
Use WARDROBE-RANGE-PRODUCTION.md and add the finished range to the game.
Record usage immediately before the first image call and after final QA.
```

Do not paste `index.html`, old conversations, or every existing outfit into the generation context. The master image, this guide, and the short brief contain the stable constraints.

## Lowest-cost workflow

1. Record the pre-flight usage snapshot before any image call.
2. Convert the brief into three one-line outfit specifications. This is a text-only pass.
3. Apply the diversity gate before generating: the three bottoms must use three visibly different silhouettes, and at least two tops must differ structurally rather than only by colour or trim.
4. Add the three entries to `tools/wardrobe-batch.json`, using the next unused look IDs and lowercase item IDs with no spaces.
5. Generate one full registered outfit per look. One call creates the source for its top, bottom, and shoes.
6. Save each source immediately as `assets/glowgirls/sol/patch-sources/outfit-<lookname>-dressed.png`.
7. Run the extractor once for all three looks.
8. Review one contact sheet, not nine individual files. Regenerate only a failed look.
9. Register the new IDs in `WARDROBE` and add three `RANGE_PRESETS` entries.
10. Run the verifier against a local HTTP server.
11. Record post-flight usage and report the delta, number of image calls, corrections, and any separation render.

## Diversity gate

Colour changes do not count as silhouette changes. Plan the range as a three-column matrix before rendering.

| Example brief | Look 1 | Look 2 | Look 3 |
|---|---|---|---|
| Service workers | tailored cropped jacket + straight shorts + lace boots | asymmetric utility tunic + narrow wrap skirt + low platforms | fitted shirt + wide culottes + ankle shoes |
| College clothes | varsity bomber + pleated skirt + trainers | knit vest + wide trousers + loafers | cropped cardigan + knee-length A-line skirt + Mary Janes |
| Evening wear | fitted jewel bodice + column skirt + pointed shoes | one-shoulder cape top + architectural bell skirt + metallic boots | corset top + asymmetric long overskirt/trouser + platforms |

Before generating, reject any plan that repeats an existing named piece such as `cargoshorts` or repeats “crop top + short bottom” three times.

## Initial-render prompt template

Use one prompt per look. Replace only the three garment lines and the look name.

```text
USE CASE: identity-preserve.
ASSET TYPE: registered 1024x1536 Fireworks paper-doll outfit.
EDIT TARGET: Image 1 is the immutable character master.

Create the complete original <LOOK NAME> outfit on this exact model:
TOP — <one sentence naming construction, silhouette, material and colour>.
BOTTOM — clearly separate <one sentence; state shorts/skirt/trousers and exact length>.
SHOES — one coordinated pair of <one sentence; state height and sole shape>.

Use fully opaque materials with crisp contrasting edge piping. No sheer, transparent,
mesh, glass, gauze, or see-through panels. Use a uniform pure black background or
true transparency; no checkerboard, floor, scenery, cast shadow, text, logo or watermark.

Preserve Image 1's exact 1024x1536 canvas, pixel position, scale, anatomy, pose,
body proportions, face, skin, bald head, black base romper, hands, fingers, legs,
ankles, foot baseline, camera, lighting direction and straight-on perspective.
Do not move, resize, redraw, rotate, crop, lengthen or shorten any body part.
Change clothing only. Keep both hands fully visible.
```

This prompt deliberately avoids long style prose. Put creative specificity into silhouette, construction, and material—not repeated registration wording.

## Designs that need an extra render

The one-render-per-look method assumes category boundaries do not overlap. Use one separation variant when:

- full-length trousers cover or surround the shoes;
- a continuous dress crosses Y = 475 and must remain independently mixable;
- long sleeves overlap a wide skirt in the bottom extraction envelope;
- a cape or train passes both in front of and behind the body.

For trousers over shoes, keep the normal dressed source for the top and shoes, then create one barefoot variant that changes only the footwear. Add `"bottomSource": "outfit-<look>-bottom-dressed.png"` to the config. The extractor already supports per-category source files.

For evening dresses at the lowest cost, design a separate bodice and high-waisted skirt that visually join at Y = 475. A true one-piece dress costs at least one additional separation source if it must remain mix-and-match.

## File and ID rules

```text
Source: patch-sources/outfit-<lookname>-dressed.png
Optional separation source: patch-sources/outfit-<lookname>-bottom-dressed.png
Top front/rear: final/top-<id>-front.png / final/top-<id>-rear.png
Bottom front/rear: final/bottom-<id>-front.png / final/bottom-<id>-rear.png
Shoes front/rear: final/shoes-<id>-front.png / final/shoes-<id>-rear.png
Preview: patch-sources/outfit-<lookname>-game-preview.png
```

- IDs are lowercase ASCII letters and digits only.
- IDs describe silhouette or construction, not only colour.
- Display names include the range name.
- Never reuse an existing ID for new art.
- Increment `GG_V` in `index.html` after registering new assets.

## Config example for one look

```json
{
  "lookId": "L",
  "lookName": "Campus Signal",
  "source": "outfit-campussignal-dressed.png",
  "top": { "id": "signalvarsity", "name": "Campus Signal varsity jacket" },
  "bottom": { "id": "signalpleats", "name": "Campus Signal knife-pleat skirt" },
  "shoes": { "id": "signalloafers", "name": "Campus Signal platform loafers" },
  "prompt": "Cropped varsity jacket; knee-length knife-pleat skirt; platform loafers."
}
```

## Commands

From `C:\hirednerds-portfolio`:

```powershell
node public\fireworks\tools\build-wardrobe-batch.cjs L M N
python -m http.server 4174 --bind 127.0.0.1 --directory C:\hirednerds-portfolio\public\fireworks
node public\fireworks\tools\verify-wardrobe-batch.cjs http://127.0.0.1:4174
```

The extractor accepts true transparency, flattened light checkerboards, and uniform near-black backgrounds. It detects registration within ±8 px and rejects source dimensions more than 2 px from the master.

## Registration and game wiring

For each new range:

1. Append three `[lookId, displayName]` rows to `WARDROBE.looks`.
2. Append the three top, bottom, and shoe `[id, displayName]` rows to their category arrays.
3. Add the three exact `[topId, bottomId, shoeId]` tuples to `RANGE_PRESETS`.
4. Choose existing hair and face extras separately for Sol, Hana, and Jia. Clothing art remains shared.
5. Add strongly metallic items to `GG_METAL` only when tinting should preserve metallic luminance.
6. Increment `GG_V` so browsers do not reuse old PNGs.

## QA gates

A range is not finished until all checks pass:

- Exactly 3 requested looks were generated; no accidental fourth concept.
- Every source is 1024×1536, or within the permitted 2 px normalization tolerance.
- Detected alignment is normally within ±2 px. Larger shifts require a full-size visual comparison.
- Hands, fingers, head, ankles, and baseline have not moved.
- The three looks pass the diversity gate.
- No checkerboard, black-background holes, white halos, rectangular skin patches, floor, shadow, text, or watermark remains.
- Each front PNG has non-zero alpha inside its declared envelope.
- Each rear PNG is fully transparent unless a real rear layer was designed.
- There are 6 PNGs per complete look: front/rear for top, bottom, and shoes.
- Preset and individual category tiles reference the same IDs.
- JavaScript parses.
- Every new HTTP asset returns status 200.
- A final contact sheet is reviewed at game scale and at least one full-size preview is checked per unusual silhouette.

## Usage ledger

Record this for every range:

```text
Range:
Pre-flight usage/time:
Initial outfit calls: 3
Correction calls:
Separation calls:
Total image calls:
Post-flight usage/time:
Measured usage delta:
Accepted without correction:
Reason for each correction:
```

Do not estimate credits from elapsed wall-clock time. Report the product's measured pre/post usage and the exact image-call count. If the product exposes only percentages, report the percentage-point delta and state that it is not a cash invoice.

## Failure rules

- Repeated silhouette: revise the written three-look matrix before spending another image call.
- Checkerboard visible inside fabric: regenerate that look with fully opaque material; do not try to preserve fake transparency.
- White halo: rebuild with the backdrop flood-fill mask; do not hand-paint the body edge.
- Body drift: regenerate from `master.png`; do not resize a substantially different pose into place.
- Shoes overlap trousers: use one barefoot bottom separation source.
- One unusual item exceeds an envelope: add an item-specific envelope, never widen the shared envelope.
- One look fails: regenerate only that look and rerun its selector, not the entire range.
