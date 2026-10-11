# Little Patterns round 4: design review, pass 1 (Claude Opus 5.5)

Reviewed 11 October 2026 against `little-patterns-review-round-4.md`, the approved scope and learning design, the four mockup files and all 34 screenshots. Nothing was built or changed except this file.

## 1. Verdict

The Nook frame is the right answer to Jof's main complaint. Play screens drop from about fifteen pieces of chrome to five, Add becomes one augmentation picture, and Feelings gets a beginning, a middle and an end. It is not ready to build: the mockups themselves clip at 412 px (every chip row and the Feelings board) and push Nook off the iPad shelf, the Nook rig cannot animate as described, and the two things Jof will judge by feel, motion and speech pace, are under-specified. I would reject outright:

- the shape name "diamond"
- the red/yellow/green/blue feeling groups
- face pictures on the "How does Nook feel?" answers
- the sound toggle on play screens
- a Grown-ups gate on every play screen

## 2. Jof's findings, one by one

| # | Status | Evidence |
|---|---|---|
| 1 Fits a phone | Partly | Nothing scrolls (phone-count, land-count). But chips clip mid-word on 7 of 9 portrait play screens ("Up to 20", "Tens", "4 shape", "Roun", "How does Nook fe"). The Feelings board's right column runs off the card (phone-feelings-board, DISAPPOINTED cut). The iPad shelf pushes Nook off the right edge (ipad-shelf). Landscape keys are 30 px tall (land-words). Meanwhile most of the portrait card is empty: in phone-count a 90 px tray sits in a 590 px card. |
| 2 One game per screen | Solved, leftovers | Compare current-phone-garden-count with phone-count. Leftovers: sound and gear on every screen, the total shown twice on success (phone-add-done, phone-shapes-sides-done), and the shelf tagline. |
| 3 Spelling, pictures on | Solved | phone-words shows Mulberry pictures from the start. Jof should know the sentence picture and the SUN card picture are identical, so the task becomes "match the picture, spell the word". That is what he asked for, but it should be said. Clear sits next to Enter. |
| 4 Add | Mostly | phone-add (one row, one equation, three answers) is a real improvement on current-phone-garden-add. Problems: the second group is pale ghosts, harder to see and count than the first; the done screen shows 5 twice; one Help press both counts and outlines the answer (phone-add-help); levels to 20 and crossing ten are not designed, and 8 + 7 apples cannot fit in one row at 412 px. |
| 5 Patterns | Solved | phone-patterns, land-patterns. |
| 6 Feelings | Partly | The board, perform screen and Done give it shape. Sound is still a toggle, only smaller, so the cause is untouched: a child who wants to *hear* things finds a button that *changes* things. The half-filled Done button reads as a two-tone slider (phone-feelings-perform). |
| 7 Speech | Partly | Trimming and joining clips is the right fix for joined lines. But uniform 70 ms gaps keep a "list" rhythm, and the whole-sentence clips are slow too ("a fish can swim" is 3.2 s in voice-library.js) and are not touched. |
| 8 Icons | Paint yes, Feelings partly | The palette is exactly the brief. In the Feelings icon the sad face is almost hidden behind an emoji-yellow smiley (phone-shelf), the opposite of "round, not emoji". |
| 9 Tapping out | Partly | Removing Back, brand and footer is right. The browser-level exits are not addressed (section 7), and the gate guarding the K-Pop BOOM door is a 1.2 s hold on every screen. |
| 10 Shapes | Partly | Warm and well structured (phone-shapes-sides, -done, -name). Needs fixing: "diamond", upright-only examples, and side strokes about 15 px wide used as tap targets. |
| 11 Nook relationship | Partly | The vector Nook is the right base (phone-nook-sheet). But greet is drawn exactly like happy, happy and proud share a face, sad/disappointed and angry/frustrated are near twins, and the relationship has no direct interaction. |

## 3. Education-path check

Mostly sound. These parts contradict the guidance:

- **Shapes.**
  - "Diamond" teaches the classic orientation misconception (a turned square becomes a different shape). NCETM and Development Matters both ask for varied orientations and non-examples.
  - Regular, upright-only shapes teach that "a hexagon is a honeycomb".
  - A square offered with both SQUARE and RECTANGLE has two right answers.
  - Counting sides is Year 2 curriculum, met informally in Reception ("sides, corners"), so it is fine as tap-and-count, never as a test.
- **Add.**
  - The approved design keeps added objects "outlined as well as coloured". Ghosts read as "not there yet".
  - Crossing ten needs ten-frames that show bridging through ten (NCETM); one row cannot show it.
- **Feelings colours.**
  - Green (calm, happy, proud), yellow (excited, surprised), blue (worried, sad, disappointed) and red (angry, frustrated) is visibly the Zones of Regulation scheme. But Zones puts worried and frustrated in yellow, so if Arthur's school uses Zones this teaches a conflicting map.
  - If the school does not use Zones, red against green still reads as bad against good, and green is also this app's "correct" colour.
- **Harm risks.**
  - **No way back to calm.** After angry or sad, Nook snaps back to a *happy* board Nook. That teaches "get rid of that feeling fast".
  - **Mirroring is unspecified.** Nothing says what Nook does when the child picks "sad" in Me. Nook must not turn sad, which makes the child responsible for Nook. It must not try to fix the feeling ("cheer up") either. It should acknowledge it, calmly.
  - **Moods that depend on the child.** Outside the Feelings game, Nook's feeling must never depend on mistakes, leaving or absence.
  - **Me uses Nook's face.** It should use symbols that match his Grid (Widgit). Mulberry has six of the ten feelings, adult faces only. With Nook's face, "how do I feel" becomes "how does Nook feel".
- **Match.**
  - Faces on the answer cards make "How does Nook feel?" an identical-picture match. Arthur reads well: use words, and offer faces as a Help step.
  - Level 1 must avoid look-alike pairs.
  - Proud, disappointed and frustrated are recognised from posture more than face, so Nook needs postures for them.
- **Auto-return.** It breaks the scope's "no automatic transitions", but Jof offered it, it only returns to a known place, and Done is always there. Accept it.

## 4. Motion specification

**Rules**
- Idle motion is on Nook only.
- Nothing in the task card moves unless the child caused it.
- At most one Nook motion and one task motion at a time.
- No loops except breathing.
- No shake, flash, pulse or glow.
- Limits: 12 px travel, 1.06 scale, 6° rotation (arms excepted).

**Easing**
- *out*: cubic-bezier(.2,.7,.3,1)
- *in-out*: cubic-bezier(.45,0,.55,1)
- *settle*: cubic-bezier(.3,1.35,.6,1), for Nook only, with at most 6% overshoot
- linear: progress bars only

**Reduced motion** (OS setting or Softer) removes travel, scale and idle motion, and keeps colour and opacity changes of 150 ms or less.

**First, re-rig Nook.** In frame.css the `breathe` and `sway` keyframes animate `transform` on the same SVG groups that carry the pose `transform` attribute. The CSS overrides the attribute. As a result:
- Sad Nook's 3° tilt drops to 0 at every mid-breath, so it rocks every 3.6 s.
- The leaves pivot about the SVG's 0,0 corner and drift off the stem, about 10 px at perform size.

The fix:
- Put the pose on an outer group and the idle animation on an inner group.
- Draw arms and leaves as fixed shapes rotated about a shoulder or stem pivot, so poses can transition. Safari 16 cannot transition path `d`.

| Moment | Motion | Reduced motion |
|---|---|---|
| Idle | Breathing on the outer `<svg>` only (one composited layer): scaleY 1.015 over 4 s, *in-out*. Blink at random every 3.5 to 7 s: close 70 ms, hold 50 ms, open 90 ms. Leaves stay still except for follow-through after a change. Idle pauses after 45 s without input, or when the page is hidden. | None |
| Expression change | Eyes close (80 ms *in*); the features swap behind the blink; eyes open (120 ms *out*). Arms rotate to the new pose (300 ms *settle*). Body squashes to .97 in 100 ms and recovers in 220 ms. Leaves follow 60 ms late with two damped swings of up to ±3° over 600 ms. | Instant swap |
| Feeling performance and return | **Open.** Card press 80 ms. The board fades out (160 ms) while Nook grows from its frame position to the centre (300 ms *out*). Render Nook at full size and start it scaled down, or iPad shows a blurry raster.<br>**Gesture.** Expression change in time with the clip, then one gesture under 1.2 s: happy two 8 px hops; excited three 10 px hops with arms up; calm one 2.4 s breath; sad a 6 px sink with leaves drooping over 900 ms; worried hands together and one look left and right; angry one squash to .95 over 120 ms, fists down, no shake; frustrated one huff; surprised a 150 ms rise; proud chin up, hands on hips; disappointed a 1 s slump.<br>**Hold** until the clip ends plus 600 ms. Difficult feelings then take one breath back to calm (1.2 s in, 1.6 s out).<br>**Return.** Nook shrinks back (300 ms *in-out*), the board fades in (200 ms), the tick draws (250 ms). The board ignores taps for 300 ms.<br>Done jumps to a 600 ms return to calm. Tapping Nook replays the word. | 150 ms crossfades; Nook still ends calm |
| Correct answer | Button press; the button turns green with a tick (150 ms); the other answers fade to 50% (200 ms); the chosen digit travels into the "?" slot (280 ms *in-out*); Nook changes expression and makes one 8 px hop (up 220 ms *out*, down 200 ms *in*, small landing squash). The bubble crossfades in 150 ms. Help turns into Next in the same place. | The digit fades into the slot |
| Wrong answer | Press and release only: no red, no shake, no dimming. Nook tilts 4° (200 ms), holds 600 ms, returns (250 ms). The bubble crossfades to the neutral prompt. | Bubble only |
| Counting sides | The nearest uncounted side fills amber from corner to corner (stroke-dashoffset 220 ms *out*). Its number tag grows from 0.6 to full size (200 ms *settle*) and is spoken. Tapping a side already counted bumps its tag to 1.08 and back (180 ms), silently. After the last side, the shape's fill warms over 300 ms. Help counts the sides at 700 ms intervals. | Colour change only |
| Done progress | A 6 px line inside the bottom of Done grows (scaleX) linearly over the clip's length. Hidden when sound is off. | Hidden |
| Hold gate | Nothing for 300 ms, then an SVG ring fills linearly over 2 s. Releasing, or sliding more than 10 px, drains it back (250 ms *out*). When full, the sheet rises 12 px and fades in (220 ms). No sound. | Same: it is functional |
| Shelf open | The play screen veils (180 ms); the panel rises 16 px and fades in (220 ms *out*), all tiles together; then Nook changes expression and speaks. Picking a tile: press, then the panel fades out (160 ms *in*). | 120 ms fades |
| Tile and button press | translateY 3 px with the shadow shrinking from 5 to 2 px (70 ms *out*); release over 140 ms. The action fires on release, so sliding off cancels it. No scale, no ripple. | Same |
| Add arrival | The second group's apples drop in one at a time (14 px, 240 ms each, 300 ms apart), in time with "then two more". | Shown at once |

## 5. UI clean-up and UX

- **Top bar.** Play screens keep only the shelf button and levels. The gear moves to the shelf. The sound toggle becomes "hear it again": tap the bubble, which shows a small speaker. Mute moves to Grown-ups.
- **Levels.** Split modes (Sides / Which shape, Add / Take away, the Feelings modes) from levels; one chip row currently mixes them under one highlight. Below 480 px wide, show a single pill ("Up to 5 ▾") that opens the approved level sheet; elsewhere show the strip only if it fits without scrolling. The proposal never says where Add / Take away lives.
- **Action bar.** Fixed height with two slots: Help bottom-left, Next bottom-right, Again small. Today the card shrinks about 70 px on success (phone-add vs phone-add-done), and an invisible placeholder fills half the bar. Keep 20 px clear of the bottom edge (Android home gesture).
- **Task card.** Put the answer row at the same height in every game; it ranges from 480 to 610 px today. Scale to the space: apples at least 48 px, answers at least 96 px tall, Nook about 132 px. Remove duplicate totals. Replace the unclear raised-hand glyph with the Mulberry "help" symbol, and use "finish" for Done.
- **Words.** Drop Clear, which sits next to Enter, and end the keyboard with Delete, then Enter. In landscape, fold the Nook column into the bubble and use 10 × 3 keys at least 40 px tall. Ask Jof whether Arthur's Grid keyboard is ABC or QWERTY.
- **Feelings.**
  - Board: use `minmax(0,1fr)` columns and face-over-word cards. Fix the face viewBox, which crops the circle (ipad-feelings-board). Use a tick instead of the badge-like green dot.
  - Perform: in landscape, make Nook fill the card height; it is 150 px in a 300 px card now.
  - Match: Nook is about 50 px wide in phone-feelings-match, yet its face is the question. Hide the frame Nook and make Nook the task object, at least 220 px.
- **Shelf.** Remove the tagline and the 100 px gap above the tiles. Fix the iPad overflow. Mark the current game's tile; tapping it closes the shelf, so no close button is needed. Make tiles buttons, not links.

## 6. Engagement

**Nook as a friend.** The Nook relationship can work, but mood on the shelf alone is too subtle for a five-year-old to notice. Trust comes from Nook reliably responding to *him*:
- Tapping Nook should always do something small: name its feeling, or wiggle. Rotate between three responses, never escalating. That also gives a child who taps everything a safe target that is not Sound or the browser.
- Use "we" language ("We did it!") so pride is shared, not a judgement.
- Give each game one small Nook joke instead of stars: munching apples in Take away, holding the shape up, wearing the bead string.
- Nook must never react to his absence or his mistakes. That would be the disappointed mascot by another route.

**Visited dots.** Keep them, as ticks. Jof saw the drive to finish ("sound them all out"), and structured teaching says give it a visible finish. But:
- reset the ticks every time the board opens
- show no counter
- make finishing all ten quiet (Nook: "We said all the feelings.")

A celebration would turn the difficult feelings into boxes to tick on the way to a prize.

**Two decisions for Jof:**
- **Friends.** The proposal keeps the four drawn children, while his idea was Nook in their place. I would keep Friends, because the EYFS goal includes other people's feelings.
- **Nook's new proportions.** The vector Nook has a larger face patch and a symmetric egg shape. Jof should sign that off; Arthur knows the PNG.

## 7. Risks for the build

- **Tap-out routes the frame misses.**
  - There is no web manifest, so the browser toolbars stay on screen.
  - Shelf tiles are `<a href>`, so a long press offers "Open in new tab".
  - Long-pressing a symbol image opens the image menu.
  - Pull-to-refresh still works, and the Android back gesture leaves the page.

  Fix: launch from the home screen, locked with Guided Access on iPad or App pinning or Samsung Kids on Android. In the page: `-webkit-touch-callout:none`, `user-select:none`, a blocked `contextmenu`, `overscroll-behavior:none`, and back opening the shelf.

  Note that iOS home-screen apps keep separate storage from Safari, so existing player profiles will not carry over.
- **iPad 5.** Endless animation inside an SVG repaints it every frame, which is the "permanent animation loop" the scope rules out. Animate the outer element and pause idle. An SVG stroke ring costs less than an animated conic-gradient. A fixed-height `overflow:hidden` frame can hide the Words gap when the device keyboard opens.
- **Speech.**
  - An absolute silence threshold clips quiet final consonants ("five" becomes "fi"). Measure against the clip's peak, with 30 ms and 50 ms padding and 10 ms fades.
  - Trim offline in the voice build, not by decoding on the iPad at every success.
  - Reuse the one AudioContext in shared.js, and release temporary audio URLs after use.
  - Normalise the loudness of new Gemini clips against the 30 September set.
  - At 100 requests a day, the new clips take one to two days.
- **Tests.** The 68 UI tests target today's page structure and will mostly need rewriting; the logic tests should survive if learning.js stays untouched.
  - Add tests for: one-to-one side counting, the gate's timing and cancel, visited reset, auto-return only when a clip ends with sound on, the speech join, and restoring old saved rounds.
  - Add layout checks at 360×740, 412×860, 740×360, 915×356 and 1024×698 that fail on any overflow. They would have caught all three clipping defects in these mockups.

## 8. Recommendations (answer by number)

1. **MUST** fix the three overflow defects before Jof sees screenshots: the Feelings board's right column at 412 px, Nook pushed off the iPad shelf by the tablet `.speech` rule, and the face viewBox cropping the circle.
2. **MUST** never clip a chip: split modes from levels, use a single level pill that opens the level sheet below 480 px wide, and show the inline strip only where it fits.
3. **MUST** move the Grown-ups gate off play screens onto the shelf, with a 2 s hold whose ring appears only after 300 ms and drains back on release.
4. **MUST** replace the in-play mute toggle with "hear it again" on the bubble, and move mute to Grown-ups.
5. **MUST** add a web manifest and icons so the games run full screen from the home screen (then Guided Access, App pinning or Samsung Kids), and write the setup steps for Jof.
6. **MUST** close the page-level exits: buttons instead of links, no long-press callouts or context menus, no pull-to-refresh, and Android back opening the shelf.
7. **MUST** use a fixed-height two-slot action bar (Help left, Next right) so nothing moves on success, with at least 20 px clearance above the bottom edge.
8. **MUST** re-rig Nook so pose and idle animation sit on separate nested groups, with arms and leaves rotating about fixed pivots.
9. **MUST** give proud, disappointed, frustrated and greet their own postures, so no two feelings share a silhouette and face.
10. **MUST** make Nook the large task object in "How does Nook feel?", with word-only answers (faces as Help) and no look-alike pairs at level 1.
11. **MUST** end every difficult feeling with one visible breath back to calm, including when Done is tapped, and rest Nook in calm, not happy, on the board.
12. **MUST** limit Nook outside the Feelings game to calm, happy, excited, proud and surprised, and never let its feeling depend on mistakes, leaving or absence.
13. **MUST** have Nook acknowledge the child's feeling in Me without mirroring or fixing it ("You feel sad. Thank you for telling me.").
14. **MUST** drop the four-colour feeling groups, or match the school's scheme exactly after asking.
15. **MUST** drop "diamond", vary orientation and proportion, include irregular pentagons and hexagons, and never offer SQUARE and RECTANGLE together for a square.
16. **MUST** pick the nearest side within at least 44 px, number sides in tap order, and never count a side twice.
17. **MUST** show each result once: the chosen digit fills the "?" and the separate big total goes.
18. **SHOULD** draw the second Add group as real coloured apples inside a dashed group outline, arriving one by one.
19. **SHOULD** design Add levels 3 to 5 with ten-frames that show bridging through ten.
20. **SHOULD** make Help two steps everywhere: count or trace with me first, outline the answer second.
21. **SHOULD** treat speech as "less pausing": trim and compress pauses offline in all clips, use phrase-aware gaps (about 30 ms inside a phrase, 150 ms after "Yes!"), keep the rate at 1.0 to 1.05, and let Jof choose on a listening page.
22. **SHOULD** record whole-sentence success clips for the most-played lines (Add and Take within 10, the shape sentences).
23. **SHOULD** put the answer row at the same height in every game and scale objects to the space.
24. **SHOULD** rebuild landscape Words with 10 × 3 keys at least 40 px tall and no Clear, in the layout Arthur's Grid uses.
25. **SHOULD** make tapping Nook always produce a small, calm response.
26. **SHOULD** keep visited ticks per board visit, with no counter and a quiet finish instead of a celebration.
27. **SHOULD** replace the half-filled Done button with a thin progress line, and use the Mulberry "help" and "finish" symbols.
28. **SHOULD** redraw the Feelings icon with both faces visible, tilted, in Nook's cream and lavender.
29. **SHOULD** add CDP layout tests at five viewports that fail on any overflow.
30. **SHOULD** follow the motion table in section 4, including the reduced-motion column.
31. **COULD** use Grid-matching feeling symbols in Me, plus a full-screen "I feel ..." card to show a grown-up.
32. **COULD** have Nook re-invite once after about 30 s without input (silent with sound off, off in Softer).
33. **COULD** give each game one small Nook joke as its pay-off.
34. **COULD** remove the shelf tagline, the grass hill behind answers, and Again from the default success state.
