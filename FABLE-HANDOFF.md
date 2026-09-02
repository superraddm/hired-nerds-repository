# Fable handoff: Glow Girls character system

## Objective

Replace the current Fireworks game characters with polished, original fantasy K-pop heroines that retain the glamorous, cool, fashionable and strongly kawaii direction of the approved concept sheets. The game is for a four-year-old, so controls must remain immediate, forgiving and visually obvious.

Do not imitate any specific copyrighted character, costume, logo or prop. Preserve only the high-level genre, polish and attitude requested by the user.

This is primarily an **asset-registration and puppet-compositing task, not a character redesign**. The user likes the approved character and wardrobe designs. Preserve their identities, faces, silhouettes, hairstyles, garment construction, detailing, colour relationships and overall polish as closely as technically possible. Only make the small contour or pose corrections required to fit every layer to the locked puppet. Do not simplify the art into generic clip art or dramatically restyle it to make implementation easier.

## Locked user decisions

- Dressing room: approved Room A.
- All character concept variants A, B and C are wardrobe presets.
- Per character: 5 premium hairstyles.
- Shared wardrobe: 4 tops, 4 bottoms, 3 pairs of shoes and 6 accessories.
- Hair, clothing, shoes and accessories remain recolourable.
- The exact assembled character must transfer to the fireworks stage.
- Motion must be minimal and polished. No jumping, beat-bobbing, rocking or clip-art rotation.
- Thumbnail previews must show isolated items with correct proportions.
- Nothing should be committed before user approval.

## Why the present implementation fails

The current pieces in `public/fireworks/assets/paperdoll/` were generated independently and then cropped to their visible bounds. They do not share one mannequin, camera, shoulder width, waist, leg spacing, head scale or face opening. The JavaScript therefore tries to fit incompatible paintings using category-level rectangles. More offset tuning cannot make this reliable.

Do not continue adjusting `PD_REG` or `PD_HAIR` as a final solution.

The specific problem Fable must solve is: **make each approved visual option fit the same character puppet at identical registered coordinates**, so selecting an option is a direct layer substitution rather than a new scaling guess. This must work identically in both the dressing room and fireworks stage.

## Required production asset contract

Create one locked, front-facing neutral master pose for each character. Every layer for that character must be authored directly over that master without changing its pixels, pose, proportions, camera or canvas origin.

Every exported layer must:

- Be the same canvas dimensions, preferably 1024 x 1536.
- Use the same character origin and foot baseline.
- Preserve transparent pixels outside the artwork; no chroma key and no painted checkerboard.
- Remain on the full registration canvas. Never tightly crop individual layers.
- Contain only its intended layer, with no duplicated face, body or other clothing.
- Be checked by overlaying it at x=0, y=0, scale=1 over the master.

Recommended layer order:

1. Rear hair
2. Body and face
3. Shoes
4. Bottom
5. Top
6. Front hair and fringe
7. Accessories

Long hairstyles should be split into rear and front layers. Tops with sleeves must include the complete sleeves while leaving hands visible in the correct layer order.

For recolouring, supply either a separate grayscale colour mask for each item or art whose intended coloured region can be tinted without affecting white trim, skin, metal or highlights.

## Source material

- Approved concepts:
  - `public/fireworks/mockups/sol-concepts-v2.png`
  - `public/fireworks/mockups/hana-concepts-v2.png`
  - `public/fireworks/mockups/jia-concepts-v2.png`
- Game and approved Room A: `public/fireworks/index.html`
- Design comparison page: `public/fireworks/design-lab.html`
- Current failed layer experiment: `public/fireworks/assets/paperdoll/`

## Runtime requirements

- Replace tight-bound item scaling with direct registered-canvas compositing.
- Use the same compositor in the dressing room, thumbnails and fireworks stage.
- Presets and individual wardrobe choices must persist through `localStorage`.
- Thumbnails should crop only for presentation; source assets remain registered.
- Hair and every wardrobe layer must remain attached to its puppet/avatar at all times.

## Safe animation hierarchy

Animation is desirable, but alignment takes priority. Use only animation that cannot separate clothing from the character:

- A small whole-puppet breathing or weight shift is acceptable when the body, hair, top, bottom, shoes and accessories share the exact same root transform.
- Feet should remain visually planted. Do not restore beat-driven jumping, rocking or South-Park-style whole-sprite bouncing.
- Blinks and occasional winks are preferred because they can be implemented as face-only overlays without disturbing the wardrobe.
- A very small head turn or tilt is acceptable only if the face, front hair, rear hair, earrings and head accessories are one `headGroup` and transform together around a shared neck pivot.
- Sparkles, glints and selection reactions may animate independently because they do not affect garment registration.
- Do not animate arms, legs, cloth or hair independently unless those layers are actually rigged to the same bones or mesh and have been verified across every wardrobe option.
- If an animation causes even slight detachment, clipping or sliding, remove that animation and keep the correctly registered puppet still.

## Acceptance test

Before presenting the result, verify every combination in a visual matrix:

- 3 characters x 5 hairstyles
- 3 characters x 4 tops
- 3 characters x 4 bottoms
- 3 characters x 3 shoes
- 3 characters x 6 accessories
- All nine A/B/C presets
- The same nine presets on the fireworks stage

Reject any layer if the neck opening misses the neck, sleeves miss shoulders or hands, a waistband misses the waist, boots miss both legs, a hairstyle hides the face unintentionally, or the stage character moves independently of its clothing.

Also reject any solution that achieves alignment by materially changing or simplifying the approved designs. Compare the finished default A/B/C looks side-by-side with the approved concept sheets before presenting them.
