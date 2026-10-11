# Little Patterns round 4: Fable's response to Opus pass 1 (Fable pass 1)

11 October 2026. Answers Opus's 34 recommendations by number, says what changed in the proposal and the mockups,
and what was not accepted and why. Nothing has been built. The revised mockups are re-shot in `shots/` at six
viewports: phone 412×860, small phone 360×740, landscape 915×356 and 740×360, iPad 1024×698, desktop 1280×800. The
harness reports any page overflow; none remains.

## Verdict on the review

Right on the big things: the chip clipping, the Nook rig (pose and idle motion fighting over one transform, leaves
pivoting from the corner), look-alike feelings, the gate and sound toggle on play screens, "diamond", the Zones-like
colour groups, the browser-level exits, and the speech problem being pauses rather than rate. Two findings I push
back on (15 in part, 22) and three I defer to Jof (5 in part, 24, 31).

## Answers by number

| # | Answer | What changed |
|---|---|---|
| 1 | Accepted | Board columns are `minmax(0,1fr)`; the tablet speech rule no longer applies to the shelf (`.nf-nook .speech` only); the face viewBox is 56 82 128 128, the whole circle. Verified: phone-feelings-board, ipad-shelf, ipad-feelings-board. |
| 2 | Accepted | Modes (at most two) are chips; the level is one pill that opens the existing level sheet. Words, Patterns and Feelings have a pill only. Nothing scrolls or clips at 360 px (small-*.png). |
| 3 | Accepted | Gear is on the shelf only, in the foot with Sound. Hold 2 s, ring from 300 ms, drains on release (ring drawn as an SVG stroke, not a conic gradient). |
| 4 | Accepted | The bubble is a button with a small speaker: tap to hear it again. The sound toggle is gone from play screens; mute lives in Grown-ups, with a visible icon on the shelf foot so a parent can find it quickly. |
| 5 | Accepted, one question for Jof | A Little Patterns web manifest and icons, standalone display, plus written setup steps for iPad (Guided Access) and Samsung (App pinning or Samsung Kids). Storage split between Safari and the home-screen app on iOS is real; the setup note will say players are set up again once. |
| 6 | Accepted | Tiles are buttons; `user-select`, `touch-callout`, `contextmenu` and `overscroll-behavior` are closed; Android back opens the shelf via one pushed history entry. |
| 7 | Accepted | Action bar is a fixed 92 px row with two slots (Help left, Next right; on success Again small left, Next right) and 20 px clearance. The card no longer changes height on success (phone-add vs phone-add-done). |
| 8 | Accepted | Nook rig: `.nook-pose` (tilt and squash) wraps `.nook-idle`; breathing animates the outer `<svg>`; leaves have a pose group and an inner sway group, both pivoting on the stem (120,58); arms are one fixed limb rotated about a shoulder pivot, so poses can transition with a transform on Safari 16. |
| 9 | Accepted | Greet: open eyes, closed-lip smile, one arm up. Happy: closed happy eyes, arms down-out. Proud: hands on tummy, chin up, half-lidded eyes. Surprised: arms straight out. Frustrated: arms out palms up with a huff. Disappointed: slumped, lids down, arms hanging inward. Sad: inner brows, leaves drooped, arms close. No two share a silhouette and face (phone-nook-sheet). |
| 10 | Accepted | Match hides the frame Nook; Nook is the task object at 250 px wide on the phone; answers are word-only; faces come back as the Help step. Level 1 pairs will avoid sad/disappointed and angry/frustrated. |
| 11 | Accepted | Every difficult feeling ends with one breath back to calm (1.2 s in, 1.6 s out) before the return, Done included. The board Nook rests in calm. The perform-sad mock shows the line "Then Nook takes a breath." |
| 12 | Accepted | Outside Feelings, Nook uses calm, happy, excited, proud and surprised only, and only in response to play, never to mistakes, leaving or absence. |
| 13 | Accepted | Me: "You feel sad. Thank you for telling me." in the bubble, Nook calm, the chosen word and face large, Done. No mirroring, no fixing (phone-feelings-me). |
| 14 | Accepted | One neutral card colour for all ten feelings. A question goes to Jof: does school use a colour scheme? If so we match it exactly as a Grown-ups option; otherwise none. |
| 15 | Accepted in part | "Diamond" is dropped. Shapes are drawn from given points, so orientation and proportion vary (an irregular pentagon, a slanted hexagon, a tall rectangle in the mocks). A square never has RECTANGLE as a distractor. Not accepted: irregular hexagons and pentagons at level 1. Reception practice starts with regular, familiar shapes and introduces irregular ones once the name is secure; level 2 ("More shapes") will carry irregular and rotated examples, level 1 regular ones in varied orientations. |
| 16 | Accepted | Each side has a 44 px invisible hit stroke; tapping lights the nearest uncounted side; sides number in tap order; a counted side never counts twice (it bumps its tag). |
| 17 | Accepted | The chosen digit fills the "?" and the big total is gone (phone-add-done, land-add-done, shapes-sides-done). |
| 18 | Accepted | The second group is real coloured apples inside a dashed outline; they arrive one by one in the build (phone-add). |
| 19 | Accepted | Levels 3 and 4 use two ten-frames (add-bridge mock): the first part fills its frame, the second part sits in a second frame; Help moves apples across to complete the ten before counting on. Level 5 (tens) keeps the approved apple rows. |
| 20 | Accepted | Help is two steps everywhere: count or trace with me, then outline the answer. (Count already does this; Shapes "Help" taps the next side.) |
| 21 | Accepted | Speech becomes an offline step in the voice build: trim lead and tail against the clip's own peak with 30 ms and 50 ms padding and 10 ms fades, compress pauses inside whole-sentence clips to about 150 ms, join success lines with phrase-aware gaps (30 ms inside a phrase, 150 ms after "Yes!" or "We did it!"), rate 1.0 to 1.05. A listening page lets Jof pick before anything ships. Nothing is decoded on the iPad at play time. |
| 22 | Not accepted now | Whole-sentence success clips for Add and Take within 10 are about 100 lines, a full day of the 100-request cap and a second listening check for substituted words. The joined clips with phrase-aware gaps should be judged first on the listening page; if Jof still hears a list, we record the top 20 lines. |
| 23 | Accepted | The task card is a two-row grid: objects centred, answers in a fixed bottom row (min 100 px). Apples are 48 px loose and 36 px in frames, answers at least 96 px tall, Nook 112 px in the frame. |
| 24 | Accepted, one question for Jof | Landscape Words folds the bubble into the card and uses 10 × 3 keys at 40 px with Delete and Enter, no Clear (land-words). Portrait uses 9 × 3 (small-words). Jof: is Arthur's Grid keyboard ABC or QWERTY? |
| 25 | Accepted | Tapping Nook always gives one of three small calm responses (name the feeling, a wiggle, a blink and "hello"), never escalating, and it is the only tap target that does nothing to the game. |
| 26 | Accepted | Ticks, reset each time the board opens, no counter, quiet finish: Nook says "We said all the feelings." |
| 27 | Accepted in part | Done has a thin 6 px progress line (hidden with sound off). The Help glyph stays as the hand sign Jof chose in round 3 (he passed it); the Mulberry "help" symbol is offered to him as an option. |
| 28 | Accepted | Feelings icon redrawn: two round faces in Nook's cream and lavender, both fully visible, tilted. |
| 29 | Accepted | The build adds CDP layout checks at 360×740, 412×860, 740×360, 915×356 and 1024×698 that fail on overflow (the mock harness already does this). |
| 30 | Accepted | The motion table in Opus pass 1 section 4 is adopted as the specification, with its reduced-motion column; Softer also turns idle motion off. |
| 31 | Deferred to Jof | Grid-matching symbols need the Widgit licence Jof already wants; until then Nook's face is the only consistent set across all ten. The full-screen "I feel ..." card is in (phone-feelings-me). |
| 32 | Accepted, silent | A re-invite after about 30 s is a wave only, never sound, off in Softer. |
| 33 | Accepted | One small Nook pay-off per game: munching in Take away, holding the shape up, wearing the bead string, the apples joining the picnic. |
| 34 | Accepted | Tagline removed; the hill sits below the answer row; Again is small. |

## Three things Opus flagged that I checked

- "Friends" stays, as Opus also prefers: the EYFS goal includes other people's feelings, and the twenty stories and
  their recordings are already approved.
- Nook's proportions: the vector Nook has a slightly larger face patch than the PNG. Jof signs this off from the
  sheet; the body curve and colours follow the PNG.
- The shape-side hit area and tap-order numbering follow the one-to-one counting rule from Count, so Shapes is a
  counting game first and a naming game second.

## Open questions for Jof (collected for the presentation)

1. Home-screen install and lock: Guided Access on iPad; App pinning or Samsung Kids on the S24. Players set up once more on iOS.
2. Does school use a feelings colour scheme? If yes, which, so it can be matched exactly.
3. Arthur's Grid keyboard: ABC or QWERTY layout?
4. Nook's vector proportions: sign off from the feelings sheet.
5. Help glyph: keep the hand sign, or use the Mulberry symbol?
