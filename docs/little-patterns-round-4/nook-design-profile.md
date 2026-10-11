# Nook: original character with an expressive face and body

11 October 2026. Design profile and implementation handoff for Opus 5.5.

## Authority and references

Jof's instruction: preserve the original approved Nook; add expressions and emotions in that original style. He likes the original and rejects the proposed rounder, flatter cartoon treatment. After seeing the first new contact sheet, he accepted its fidelity to the original but asked for more distinct Hello, Calm, Happy and Proud faces. This profile incorporates that correction.

1. **Identity master:** [original Nook PNG](../../public/fireworks/little-patterns/assets/nook.png), 560×672, transparent. This controls silhouette, patch, proportions, colours and texture.
2. **Expression and posture reference:** [revised expression sheet](codex-review/nook-expression-sheet-final.png). This shows ten feelings plus Hello. It is concept art, not a production sprite atlas or a replacement geometry master.
3. **Written expression definitions below:** resolve ambiguous small details in the generated sheet. No generated variation can override the original geometry or these definitions.
4. The previous `mockups/nook-art.js` demonstrates a rig structure only. Its body, face and leaf geometry are superseded by this profile.

The new sheet was made with built-in Imagegen using the original PNG as the identity reference. Prompts and earlier iterations are retained under `codex-review/` and in `nook-redraw-prompt.txt`. The game is unchanged.

## Character identity

Nook is a small sprout creature: curious, kind, quietly playful. Its expressiveness comes from a few clear features on an organic paper shape. It has no nose, fingers, clothes, eyebrows in its default greeting, or human anatomy.

Keep these across every state:

- A tall, asymmetric pear body: broad soft lower half tapering to the original off-centre, slightly bent crown. Trace the PNG outline; do not replace it with a symmetric teardrop or egg.
- The original warm-cream patch, with its higher crest on the viewer's right and lower curve on the left. Its shape, location and size stay fixed. Do not turn it into a circular face or enlarge it to house more features.
- Two navy oval eyes with one small light glint each, in the original diagonal arrangement. Expressive eyelids, closed-eye curves and a little gaze movement are allowed; the eye anchors stay fixed.
- Exactly three coral freckles on each cheek. Keep them visible in all states, including Surprise and difficult feelings. No changing blush colour as a correctness cue.
- Two unequal mint leaves: viewer-left larger and higher, viewer-right smaller. Preserve their organic shapes, dark green veins, and connected stems. Leaves can gently rotate at their roots; they are not ears or independently floating pieces.
- Short broad turquoise mitten arms with one rounded thumb lobe. No long thin arms, separate fingers, threatening fists or new dark hand colour for anger.
- Two stubby dark-purple feet, sitting on a common baseline. They remain under the original body footprint when the upper body tilts.
- Soft paper grain, broad colour regions, clean organic edges and minimal shading. No thick outline, flat featureless fills, plastic/3D shine, gradient modelling, glow, confetti or cinematic shadow.

Keep the face patch and freckles anchored during every expression change. The generated concept sheet has small frame-to-frame variations; those are illustration drift, not permission to vary the character in the game.

## Colour reference

These are **single-pixel samples from the original**, useful as representative fill colours rather than exact solid swatches for a textured image. The original is authoritative when comparing a render.

| Part | Representative sRGB sample | Pixel in 560×672 master |
|---|---|---|
| Lavender body | `#9776CD` | 300,480 |
| Cream face | `#F7ECD8` | 300,285 |
| Navy eyes/mouth | `#2A2964` | 249,334 |
| Coral freckles | `#EF8668` | 229,362 |
| Turquoise mittens | `#46CAD3` | 133,479 |
| Mint leaf | `#95DCA0` | 192,64 |
| Purple feet | `#614591` | 202,626 |

Sample the dark stem/vein directly from the source when tracing; do not use the rejected vector palette to replace these colours. Use navy for brows and mouths. Keep the underlying palette constant for every feeling; feelings do not recolour Nook.

## Expression vocabulary

The cream patch and eye positions are always the same. The features below must read differently in a face crop. A subtle gesture adds meaning; it cannot be the only distinction. Hello is a greeting pose, not an eleventh feeling in the board vocabulary.

| State | Face: eyes, brows, mouth | Body and leaves | Reading to preserve |
|---|---|---|---|
| Hello / greet | Original open oval eyes with glints, no brows, original closed curved smile. | Original one-arm greeting, other arm down; original leaf angles. | The Nook Arthur already knows. |
| Calm | Softly closed, nearly horizontal navy eyelid curves; much flatter than Happy's high eye arches. No brows or glints while closed. A short, shallow **upward** smile. | Both mittens comfortably down, leaves at rest. | Content and available; no sleep symbols, heavy droop, boredom or sternness. |
| Happy | Two joyful closed upward eye arches; a broader small open navy smile, no teeth/tongue. | Arms gently out and low, posture open. | Clearly happier than Hello; face differs before the arms are seen. |
| Excited | Open bright oval eyes, slightly wider; a taller open navy smile. No teeth. | Mittens raised, leaves a little lifted. | Open-eye excitement, distinct from Happy's closed eyes. |
| Proud | Open oval eyes, gaze slightly upward; two fine softly raised curved brows; an asymmetric closed smile, one corner a little higher. | Short mittens at **outer hips**, body a touch upright, leaves lifted a little. | Warm “we did it”; never smug, half-asleep, or clutching a sore tummy. |
| Surprised | Open eyes a little larger; a small vertical O mouth. Brows optional and very light. | Mittens beside cheeks without covering patch; slight lift. | Surprise without fright. |
| Sad | Fine brows with gently raised inner ends; open eyes; clear downward-curved mouth. | Low close arms, mild upper-body lowering, modest leaf droop. | Sadness without tears, suffering or an accusation. |
| Worried | Soft inner-raised curved brows; open eyes with one small side glance; short wavering closed mouth. | Mittens gathered below patch, never covering it; leaves modestly lowered. | Uneasy uncertainty, distinct from Sad's plain down-curve. |
| Angry | Two mild inward-down brows; narrowed but still visible oval eyes; short firm closed mouth. | Mittens low and slightly out, body steady. | A named feeling; no red face, bared teeth, stamping, clenched human fists or shaking. |
| Frustrated | Slightly uneven knit brows; open eyes with mild lid tension; small crooked/wavy closed mouth. | Mittens raised beside head, face clear; brief exhale gesture only. | Effort getting stuck, distinct from Angry's firm low-arm stance. |
| Disappointed | Relaxed/lowered upper lids, brows less arched than Sad; short shallow down-curve. | Short slack arms, mild slump and leaf droop. | A let-down; do not duplicate Sad or make Nook look ill. |

For Calm, do not copy the open-eye default, a dead-straight mouth or heavy half lids from an intermediate sheet. Its resting eyelid lines and small smile are deliberate expression features. For Proud, a tiny smile hook is optional; it must still be a legible warm smile at small size. Use the table to refine these in the traced rig.

For small cards, draw a crop of the **actual asymmetric Nook patch with a little lavender perimeter**, preserving eye angle and freckles. Do not substitute the proposed generic circular cream face with a lavender ring. Use the same features as the full-body renderer. The child's Me symbols remain a separate design; never use these Nook cards to imply the child's own face is Nook.

## Motion and use in the games

Keep the existing timing specification where compatible with this geometry. Idle is a subtle outer-element breath; blinking is scheduled, and leaves are still except for brief follow-through. Pause idle after 45 seconds without input and on hidden pages. Softer/reduced motion removes idle, travel and squash for this new Nook rig. Short opacity/colour changes remain available. There is no permanent requestAnimationFrame loop.

Outside Feelings, use Calm, Happy, Excited, Proud and Surprised only. Greeting may appear on the shelf. Wrong answers, leaving and absence never make Nook sad, frustrated, disappointed or worried; retain a settled expression and neutral words. A tap on Nook gives a small calm response and never changes the puzzle or escalates effects.

In Feelings, the selected emotion belongs to Nook and is explicitly named. Make one gentle gesture, hold it long enough to inspect, then follow the approved calm-settling return. Done remains available throughout. Replay, mute and failed speech follow review item 56. The Me acknowledgement keeps Nook calm and never mirrors or “fixes” a report.

Keep the original texture static inside the character. Do not animate grain, shimmer or leaf sway continuously. No tears, sweat drops, lightning, floating hearts, stars, emotion colour codes or props are needed to distinguish the ten faces.

## Implementation approach for Opus

Reconstruct the original with a single shared set of body, patch, arm, foot and leaf paths. Use a 560×672 design coordinate system initially so the original can be overlaid without rescaling guesswork. Preserve generous bounds for raised mittens. Aim for a **textured SVG rig**: shared geometry, feature swaps and transforms, plus a small reusable raster texture clipped to the coloured parts. Avoid live SVG turbulence/displacement filters and full-canvas repainting. If a texture rig proves too costly on the iPad, use pre-rendered transparent assets derived from the same locked master; benchmark before choosing.

Recommended ownership of transforms:

```text
position wrapper             — placement, grow/return, short hop
  SVG                        — outer breathing scale only
    feet                     — common ground baseline
    body-pose group          — small tilt/squash around one explicit pivot
      body + texture
      fixed cream patch + freckles
        eye anchors + eyelid/feature groups
        mouth + occasional fine brows
      arm pivot groups       — short mittens, limited alternate bent shapes
      leaf pose groups       — connected stems/root pivots
        follow-through groups
```

Use one pivot convention: centred transform attributes **or** CSS origin, never both. Swap discrete mouth/eye paths behind a blink or a short fade; do not depend on animating SVG `d` on Safari 16. A fixed expressive path set is enough. Keep the paper grain the same through swaps.

The old rig's long-arm rotations do not automatically carry over to the original pear silhouette. Trace short mittens in a resting, raised and bent form if needed. Their end positions matter more than preserving the old angular numbers. Hands never obstruct eyes or mouth. Feet may lift only with an explicit hop on the position wrapper, not because a pose moves their baseline.

Use the final bitmap for review and tracing guidance only. Do not ship its background, title, labels, ground shadows or face-detail cell as part of a game asset. Production assets are transparent, consistently aligned and free of contact-sheet text.

## Acceptance checks before game integration

1. Overlay Hello against the original at identical dimensions. Crown, body outline, patch, leaves, arm thickness and foot placement match; texture and colour feel like the original. Do this before adding animation.
2. Show ten face crops without bodies or labels. Hello/Calm/Happy/Proud do not share one expression; Happy/Excited, Sad/Disappointed and Angry/Frustrated remain distinguishable. If a pair is ambiguous, refine features before relying on a pose.
3. Check full bodies at 112–132 px, large performance size, and face crops at the board's actual small size. No feature or leaf is cut off; freckles and smile remain legible.
4. Compare all states side by side: same patch, eye anchors, palette, body width/height, six freckles, two unequal connected leaves, two mittens and two feet. The canonical geometry does not wobble between feelings.
5. Verify each animation with Softer/reduced motion, mute, repeat taps, Done, player change, background/foreground and interrupted speech. No delayed performance returns to the wrong screen.
6. Check layout and animation on physical iPad 5/Safari 16.7.16 and the S24 in both orientations. A desktop screenshot does not establish iPad performance or child comprehension.

Opus should present the traced stills and small face crops before wiring up the full motion sequence. The redraw's identity direction is accepted; the final expression refinements and production geometry are reviewable design work, not a new approved game release.
