# Little Patterns round 4: Fable's final pass (Fable pass 2)

11 October 2026. Answers Opus pass 2 (items 35 to 53) by number. All nine MUST items are applied to the mockups
and the screens are re-shot at the six viewports. The harness now also fails on content clipped inside the task
card, on truncated chip, pill, answer, tile and key labels, and on an answer button overlapping Nook; the final run
reports nothing. Nothing has been built; the game code is untouched.

## MUST items (35 to 43): all done

| # | Answer | Evidence |
|---|---|---|
| 35 | Done. Screens without the frame Nook carry a `solo` class: the stage is one column on tablet, the task spans both columns in landscape, Nook is sized to the card's height, Match is a two-row grid (question, Nook) with the answers in the fixed bottom row, and the card fills the frame on phones. | ipad-feelings-match, land-feelings-match, land-feelings-perform, desk-feelings-match, phone-feelings-match, phone-feelings-perform-sad |
| 36 | Done. The harness checks every `.nf-task` child against the card rectangle, every label for `scrollWidth > clientWidth`, and every answer against Nook's rectangle. It found five more defects after the first fix (360 px Add row, 360 px Patterns strip, landscape bridging frames, DISAPPOINTED at 740 px), all fixed. | harness output: no CHECK lines |
| 37 | Done. The pose transform is `translate(120 250) rotate(t) scale(1 s) translate(-120 -250)` with no CSS origin; the feet are drawn outside the pose group. Sad and disappointed sit centred. | phone-nook-sheet, phone-feelings-perform-sad |
| 38 | Done. Positive leaf angles droop; sad and disappointed leaves hang, happy and excited leaves lift. | phone-feelings-perform-sad |
| 39 | Done. The shelf foot has only the Grown-ups button. Mute lives inside the gate; in the build a small crossed-speaker badge appears on the shelf only while sound is off. | phone-shelf, ipad-shelf |
| 40 | Done. Shoulder pivots raised to y 178, limb 42 units, so hanging hands end at mid-belly. Surprised: hands up wide beside the face. Frustrated: bent arms with fists at the sides of the head. Proud: bent arms with hands on the hips, chin up, open eyes. Disappointed: slack arms hanging straight. No two feelings share a silhouette and face. | phone-nook-sheet |
| 41 | Done. Modes are "Sides" / "Name"; levels are "Shapes 1" / "Shapes 2"; the Feelings activities are "Nook feels...", "Which feeling?", "Friends", "Me"; answer words scale with `clamp(13px, 4.2vw, 19px)` and RECTANGLE / PENTAGON fit at 360 px. | small-shapes-name |
| 42 | Done. The pentagon and the hexagon both sit under "Shapes 2". | phone-shapes-sides, phone-shapes-name |
| 43 | Done. The join row never wraps; groups are grids of up to five columns with 40 px apples (36 px under 380 px wide), so 3 + 2 stays on one line with the "+" between the groups; larger sums stack group, "+", group. | phone-add, small-add |

## SHOULD items (44 to 53)

| # | Answer |
|---|---|
| 44 | Done in the mock: the added ten-frame is dashed; the prompt is "Eight, then seven more. How many?" and "Fill the ten first" moves into Help. Apple outlines travelling with moved apples are a build item. |
| 45 | Done: groups lay out as left-aligned rows of five (phone-take shows 5 then 1). |
| 46 | Accepted: the listening page will carry two or three whole-sentence reference recordings beside the joined versions. |
| 47 | Done: portrait keys are 52 px with Enter at the right edge (small-words). |
| 48 | Done: the caption reads "Nook feels sad." only; "Nook takes a breath" appears when the breath happens. |
| 49 | Done: the child's face in Me has a neutral grey ring, not Nook's lavender. |
| 50 | Accepted for the build: random blink, leaves still except for follow-through, and position, grow and hop on a wrapper element around the SVG so breathing never fights them. The static mock keeps a continuous sway only so the sheet shows the leaf rig. |
| 51 | Done: the in-game shelf overlay is full height, so only one Nook shows (phone-shelf-over-count). |
| 52 | Done: landscape bubble text is 16 px; prompts are written to stay within three lines in landscape. |
| 53 | Recounted: 50 new lines. Shape names 4; "It's a {shape}!" 9; "A {shape} has {n} sides." 6; three Shapes prompts; "Fill the ten first." 1; "Nook feels {x}." 10; "You feel {x}. Thank you for telling me." 10; "Nook takes a breath." 1; Me replies for Something else and Not sure 2; "How does Nook feel?", "How do you feel?", "We said all the feelings.", "We did it!" 4. With the 100-request daily cap and a listening check, that is one day of rendering plus a second day for any re-takes. |

## What Opus asked Fable to check again

- The Feelings icon, shelf foot and bubble speaker now mean one thing each: the speaker on a bubble always means
  "hear it again"; nothing on a play screen mutes.
- The six-viewport set is clean: no page overflow, no clipped card content, no truncated label, no answer over Nook.

## Status

The design is approved by both passes as the build brief, with the amendments recorded in these four review files
and folded into section 4 of the proposal. Five decisions are collected for Jof in the presentation. Build starts
only on Jof's approval.
