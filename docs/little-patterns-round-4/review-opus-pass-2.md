# Little Patterns round 4: design review, pass 2 (Claude Opus 5.5)

11 October 2026. This pass reviews Fable's answers (`review-fable-pass-1.md`), the revised section 4 of the proposal, the re-rigged mockup code and the re-shot screens at six viewports. No other file was changed. Numbers 1 to 34 refer to pass 1; new items continue from 35.

## 1. Verdict

The design is now right, and I would approve the text of section 4 as the build brief, with the amendments below. The screenshot set is not yet ready to show Jof:

- **Broken screens.** Feelings Match and Feelings Perform are broken at three of the six viewports, including the iPad, the main target device. Feelings is Jof's most popular game.
- **Rig bugs.** Two bugs in the Nook rig are visible in the screenshots.
- **What the checker missed.** The overflow harness passed all of this, because the broken content is clipped inside the card rather than overflowing the page.

I would still reject one thing outright: the sound toggle on the shelf. It uses the same speaker glyph as "hear it again" but does the opposite (number 39).

Fix items 35 to 43 and re-shoot. After that, a visual spot-check is enough; no third design pass is needed.

## 2. Fable's answers, point by point

| # | Check |
|---|---|
| 1 | **Done.** All three named defects are fixed (phone-feelings-board, ipad-shelf, the face viewBox). New clipping elsewhere: see 35. |
| 2 | **Done differently, acceptable.** At most two mode chips plus one level pill is a good structure. Labels still truncate: "Side" and "Which s" in small-shapes-name, "Which shape" without its "?" in phone-shapes-name. See 41. |
| 3 | **Done.** The gate is on the shelf only, with a 2 s hold and an SVG ring. |
| 4 | **Done differently, not acceptable.** "Hear it again" on the bubble is good. But the shelf foot still has a mute toggle (`aria-pressed`) drawn with the same speaker icon. See 39. |
| 5 | **Accepted.** The question for Jof (which lock to use) is fair. The setup note must say that player profiles start again in the home-screen app on iOS. |
| 6 | **Done.** The CSS closes selection, long-press callouts and pull-to-refresh; tiles are buttons. Back handling is a build item. |
| 7 | **Partly.** True for the task games (phone-add vs phone-add-done). False for Feelings: the card collapses to its content in phone-feelings-match, phone-feelings-perform and -perform-sad. See 35. |
| 8 | **Done, with two defects.** The pose origin is applied twice, and the leaf angle sign is inverted. See section 4. |
| 9 | **Partly.** Better overall, but surprised and frustrated share a silhouette, and proud reads as "tummy ache" (section 4). |
| 10 | **Done in portrait (phone-feelings-match). Broken everywhere else** (land-, land2-, ipad-, desk-feelings-match). See 35. |
| 11 | **Done** in the specification. The perform-sad caption shows the breath line too early (48). |
| 12, 13, 14 | **Done.** phone-feelings-me is exactly right in tone, and the cards now share one neutral colour. |
| 15 | **Push-back accepted.** Level 1 now has no pentagons or hexagons at all, so "irregular at level 1" no longer arises. What matters at level 1 is downward-pointing, right-angled and long thin triangles, and thin rectangles; Fable commits to varied orientation and proportion. Two mock labels contradict this (42). |
| 16, 17, 18, 20 | **Done** (phone-shapes-sides, phone-add-done, phone-add, phone-add-help). |
| 19 | **Done, needs one refinement.** The second ten-frame is not marked as the added group (44). |
| 21 | **Done.** This is the right speech plan. |
| 22 | **Push-back accepted, with one condition.** Judging the joined clips first is sensible and cheap to reverse. But Jof can only judge them against a reference: record two or three of the same lines as whole sentences for the listening page (46). |
| 23 | **Done** for task games; not for Match (35). |
| 24 | **Done** (land-words, 10 × 3 keys at 40 px, no Clear). The deferral is fine; until Jof answers, keep the ABC layout. Portrait could use its spare height better (47). |
| 25, 26, 32, 33 | **Accepted** (specification items). |
| 27 | **Partly, acceptable.** The progress line is done. Keeping the hand glyph Jof passed in round 3 is his call. |
| 28 | **Done.** Both faces are visible and nothing reads as emoji (phone-shelf). |
| 29 | **Accepted, but insufficient as written.** The harness must also catch clipped content and truncated labels (36). |
| 30 | **Accepted.** The mock still runs a continuous leaf sway and a fixed 5.2 s blink; the build should follow the motion table (50). |
| 31 | **Deferral accepted.** Meanwhile, draw the child's face in Me without Nook's lavender ring, so "me" is not Nook (49). |
| 34 | **Mostly.** Again is not visibly smaller: it is the same width as Next in phone-add-done. |

## 3. New findings in the revision

1. **Feelings Match and Perform break at landscape, tablet and desktop sizes.**
   - land-feelings-match and land2-feelings-match: Nook is blown up past the card, and the answer buttons cover its mouth, the feature the question is about.
   - land-feelings-perform: Nook is cropped to its face.
   - ipad-feelings-match, ipad-feelings-perform and desk-feelings-match: the whole card is squeezed into the 230 px Nook column. "PROUD" disappears, "EXCITED" is cut, and two-thirds of the screen is empty.
   - Cause: `.match-nook` and `.perform .nook` use `height:100%` against a height the browser cannot resolve. On top of that, the no-Nook screens still sit in the tablet grid's first column.
2. **Phone Feelings cards collapse.** phone-feelings-match, -perform and -perform-sad end around 560 px, leaving a 220 px empty band. The Match answers sit about 200 px higher than in every other game.
3. **The sound icon means two things.** Inside the bubble, the speaker replays the line; on the shelf foot, the same speaker mutes. Arthur will learn "speaker means hear" in play and then mute himself on the shelf, which is Jof's finding 6 by another route.
4. **Labels are cut off at small sizes.** See small-shapes-name and phone-shapes-name. Long pill labels ("Round and straight", "How does Nook feel?") crowd out the chips. "HEXAGON" touches the button edges at 360 px, so RECTANGLE and PENTAGON will clip.
5. **Portrait Add breaks the sum apart.** In phone-add and small-add, the second group wraps onto a new line and leaves the "+" dangling after the first group, which reads as "3 +" then "2" below. Groups of more than five wrap centred (phone-take: 5 then 1), which loses the five-structure.
6. **Bridging hides which apples were added.** In small-add-bridge and land-add-bridge both frames look the same, so after Help moves two apples across, nothing shows which apples came from the second group. Also, "Fill the ten first" in the question gives away the strategy before Arthur tries; it belongs in Help.
7. **Two mock labels Jof will notice.** A pentagon appears under the "3 to 4" pill (phone-shapes-sides, -done). A hexagon appears under the level 1 pill "Round and straight" (phone-shapes-name), although revised 4.4 puts hexagons in level 2.
8. **The shelf overlay shows two Nooks** (phone-shelf-over-count). The game's Nook behind the veil is greyed out and looks unwell.
9. **The landscape bubble text is 14 px**, and the bridging prompt wraps to five lines in land-add-bridge.
10. **The voice count is low.** "About 35 clips" is really about 46 once "You feel {x}…" (10) and "It's a {shape}!" are counted. Still missing: the breath line, the Me replies to "Something else" and "Not sure", and the bridging Help line.
11. **The proposal file repeats the heading "## 5. Review passes".**

## 4. The Nook re-rig

**What now holds.** The structure is right:
- breathing on the outer `<svg>`
- pose on `.nook-pose`, idle motion on `.nook-idle`
- each leaf with a pose group and a sway group, both about the stem pivot (120,58)
- arms as fixed limbs rotated about shoulder pivots

All of these can transition with a plain CSS transform on Safari 16, which pass 1's specification needs. Swapping the bent limb (proud) and the mitten shapes cannot be animated. That is acceptable if the swap happens at the bottom of the squash or behind the blink.

**What still fails:**

- **The pose origin is applied twice.** `.nook-pose` carries `rotate(tilt 120 250)` in the attribute and also an inline `transform-origin:120px 250px`. The CSS origin wraps the attribute's own centre, so a tilted Nook also shifts sideways: about 13 units for sad and about 18 for disappointed.
  - You can see it in phone-feelings-perform-sad (the feet sit about 15 px right of centre) and in phone-nook-sheet (sad and disappointed are off-centre in their cells).
  - In motion, Nook would slide sideways every time it became sad.
  - Fix: either give the rotation its centre or set `transform-origin`, never both. Also move the feet out of the pose group so they stay on the ground when Nook tilts.
- **The leaf angle sign is inverted.** A positive angle turns the left leaf clockwise, which raises it. So sad (24) and disappointed (18) get perky V-shaped leaves (phone-feelings-perform-sad, land2-feelings-perform-sad), while happy and excited get flatter ones. Flip the sign.
- **The arms are too long when hanging.** A 50-unit limb from shoulder height (y 196) reaches the feet in calm, sad, angry and disappointed. Here it reads as an extra pair of legs or crutches (land2-feelings-perform-sad). Use a limb of about 36 units, or raise the pivot to about y 176, so hanging hands end at mid-belly as on the approved PNG.
- **Some postures are still too close or read wrongly** (phone-nook-sheet):
  - **Surprised and frustrated:** surprised (arms at 95°) and frustrated (80°) are the same straight-out silhouette. The "flat" mittens rotate into upright paddles, which reads as "stop" or a shrug, not frustration. Use conventional poses: frustrated with hands on head and a huff; surprised with hands up beside the cheeks and a small rise.
  - **Proud:** fists meeting on the tummy reads as "full" or "tummy ache", which is a real risk next to the munching in Take away. The lidded eyes read as smug or sleepy. Use hands on hips (elbows out), chin up and open eyes.
  - **Disappointed:** the arms angle inward to between the feet, which looks knock-kneed. Hang them slack and short instead.
- **No arm crosses the face now.** Worried's hands meet just below the face patch (phone-feelings-match), which is fine.
- **The breathing animation will fight other motion.** It animates `transform` on the outer `<svg>`. So do the shared-element grow, the hop and the wiggle in the motion table, and on the same element the last one wins. Wrap the SVG in an element that carries position, grow and hop, and leave breathing on the SVG.

## 5. Final list

**MUST before Jof sees the screens or the build starts:**

35. **MUST** fix Feelings Match and Perform at landscape, iPad and desktop sizes: screens without the frame Nook use the full stage width, Nook is sized to the card's height, the answers never overlap Nook, and on phones the card fills the frame so the answers sit at the shared baseline.
36. **MUST** extend the layout harness to fail on content clipped inside the card and on truncated labels (chips, pills, answer words), then re-shoot all six viewports.
37. **MUST** fix the doubled pose origin and keep the feet out of the pose group.
38. **MUST** flip the leaf pose sign so sad and disappointed droop.
39. **MUST** remove the mute toggle from the shelf foot; mute stays behind the gate, and a small crossed-speaker badge shows only when sound is off.
40. **MUST** re-pose surprised, frustrated and proud as described in section 4, and shorten the hanging arms.
41. **MUST** make every chip, pill and answer word fit at 360 px: short level names (for example "Shapes 1"), short modes ("Sides" / "Name"), and RECTANGLE tested on the 360 px phone.
42. **MUST** correct the two mock labels (pentagon under "3 to 4", hexagon under level 1).
43. **MUST** keep the "+" between the groups in portrait Add: one row when it fits (loose apples at 40 px fit five in a row), otherwise group, "+", group stacked and centred.

**SHOULD in the build:**

44. **SHOULD** mark the added group in bridging (a dashed frame and apple outlines that travel with the apples), and move "Fill the ten first" into Help.
45. **SHOULD** lay out groups larger than five as left-aligned rows of five.
46. **SHOULD** put two or three whole-sentence reference recordings on the listening page next to the joined versions.
47. **SHOULD** use portrait Words' spare height for keys about 52 px tall, with Enter at the right edge.
48. **SHOULD** show "Nook takes a breath" when the breath happens, not in the caption from the start.
49. **SHOULD** give the child's face in Me a neutral ring until Grid symbols are licensed.
50. **SHOULD** follow the motion table: random blink, leaves still except for follow-through, and position, grow and hop on a wrapper (section 4).
51. **SHOULD** make the shelf overlay full height on phones, so only one Nook shows.
52. **SHOULD** raise the landscape bubble text to 16 px and keep landscape prompts to three lines.
53. **SHOULD** recount the voice list (about 46 lines plus the missing ones in finding 10) and plan the days at 100 requests a day.

## 6. For Jof

Every screen now does one thing: Nook asks one question, the apples, shapes or feelings sit in the middle, and the answers are always in the same place at the bottom, with nothing else on the screen to tap away to. Nook becomes a friend with feelings of its own. Arthur can ask Nook to show any feeling, see it in Nook's whole body, hear it named, and watch Nook settle back to calm, and the games end with Nook sharing the moment ("We did it!") instead of handing out stars. With fewer things to press, the same buttons always in the same places, quicker speech, and the ways out locked behind a grown-up's press-and-hold, there is less to pull him away and more reason to stay and play.
