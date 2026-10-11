# Little Patterns round 4: Fable's guidance on Codex pass 1 (Fable pass 3)

11 October 2026. Reviews `review-codex-pass-1.md` and `nook-design-profile.md`. Nothing built.

## Verdict

Adopt Codex's pass with three changes. The character decision (54) is Jof's and is settled: the original Nook, new
expressions in its own style; the vector Nook in `mockups/nook-art.js` is superseded as geometry and survives only as
the rig structure. Items 55 to 59, 61 to 63 and 65 to 68 are correct and go into the build brief as written. Item 60's
"quiet Next before success" should not be adopted. Item 64's two design calls (show the whole Add picture at once;
no posture change on a wrong answer) are right and overrule the Opus motion table where they conflict. One caution on
the texture rig (54) and one on Calm's closed eyes.

Then freeze the brief. Five review documents by three reviewers is enough; a builder needs one consolidated list.

## Item by item

| # | Guidance |
|---|---|
| 54 | **Adopt.** The Codex sheet is far closer to the approved Nook than my vector redraw (asymmetric pear, offset crown, diagonal eyes, unequal leaves, paper texture). Keep the rig structure from `nook-art.js` (position wrapper, breathing on the SVG, pose group, arm and leaf pivots, feet on the ground) and trace the original geometry into it, as the profile says. Two cautions. (a) **Texture on the iPad 5:** a raster texture clipped to animated SVG paths can be expensive on Safari 16. Build the rig untextured first with the sampled colours, measure on the iPad, then add texture as a cheap tiled `<pattern>` fill or as pre-rendered stills from the same master if the rig is too slow. Decide by measurement, not by preference. (b) **Calm with closed eyes:** the sheet gives Calm closed eyelids to separate it from Hello and Happy. That works, but closed eyes can read as "asleep" to a five-year-old. Keep the lid curves slightly smiling and the small upward smile, exactly as the profile specifies, and check the face crop at card size in the acceptance test. |
| 55 | **Adopt.** The faded apples in the Take mock were a mockup shortcut. The approved crossing-out stays, exactly as it is live now. |
| 56 | **Adopt.** The cancellable sequence with a generation token is the right spec. `shared.js` already has a request counter for speech; the performance uses the same pattern. "Require Done when playback cannot happen" is correct and must be tested with sound off and with a blocked `play()`. |
| 57 | **Adopt.** This is the existing Me contract (fixed Blob bundle, nothing persisted, cleared on leave). The bundle grows to the ten name clips, the ten acknowledgements and the two Me replies. |
| 58 | **Adopt.** Convert the pointer to SVG coordinates and test a 22 CSS-pixel radius around each displayed segment; nearest side wins, deterministic tie at a corner; a counted side is acknowledged silently and never recounted. The 44-unit hit stroke in the mock is illustration only. |
| 59 | **Adopt, already the design.** Section 4.4 puts circles and ovals in Name only; Sides is polygons. No "How many straight sides?" recording is needed now. |
| 60 | **Adopt the first half, not the second.** Yes: two fixed slots, Help left and Next right, Again small on the left after success; delete "Help turns into Next in the same place" from the motion table. **No** to a quiet Next before success. The scope says every activity asks for an answer and nothing advances on its own, and Jof's failure case is a child tapping through without engaging. Help already ends by outlining the answer, so nobody is trapped; a grown-up changes the puzzle from the level pill or the shelf. Me uses Done, Friends keeps Next, the performance uses Done. |
| 61 | **Adopt.** Nine columns at 360 px gives 28 px keys, which fails the 44 px rule the live build already meets. Narrow portrait: seven columns, four letter rows (7, 7, 7, 5) with Delete and Enter in the last row; landscape keeps ten by three (keys about 60 px wide there). Add a touch-target report (minimum 44 by 44) to the harness. ABC stays until Jof answers. |
| 62 | **Adopt.** "Nothing scrolls" is a normal-viewport goal, not a policy. Zoom stays on; when the device keyboard or large text shrinks the viewport, the task card scrolls inside the frame and Delete, Enter, Help and the shelf stay reachable. Use `dvh` and `visualViewport` for the frame height. |
| 63 | **Adopt.** This is the migration checklist: everything the 19 screens do not show (Count to 100, zero subtraction, missing part, keypad answers, doubles and make ten, Missing letter, Word order, Number words, Friends, Something else, Not sure, the chooser and settings sheets, blocked-storage players) keeps its approved behaviour, saved rounds, drafts and ids. The UI tests are rewritten against the new structure, not dropped. |
| 64 | **Adopt both design calls.** Show the whole Add picture at once (the approved immediate unanswered sum) and keep arrival and counting motion for Help. Wrong answers change only the bubble: no head tilt, no posture change, Nook's settled face stays. Normalise travel to 12 px and scale to 1.06 as Codex says. Blocks' round-3 celebration is untouched. |
| 65 | **Adopt.** The hold is 2,000 ms total (ring from 300 ms), cancels on release, move, pointer cancel or page hide, with a keyboard equivalent. The breath is Nook's own settling after a difficult feeling, captioned when it happens, never after a Me report, never an instruction to the child. |
| 66 | **Adopt.** Audition FIVE, SIX, plurals, sentence endings and phonics before trimming the whole library; phonics clips stay untouched unless auditioned separately. Freeze the CSV of new lines (50 plus the two or three whole-sentence comparisons) before rendering. |
| 67 | **Adopt.** The acceptance checks in the profile are the right gate: overlay Hello on the PNG, ten face crops without bodies, bodies at 112 to 132 px. Approve stills before any motion is wired. |
| 68 | **Adopt.** The frame removes in-page exits; device lock is separate setup. Manifest only, no service worker (install from the browser menu does not need one; offline caching is a separate design). Android back opens the shelf through one history entry pushed once, not per render. Verify iOS home-screen storage on the real iPad. |

## What to do now

1. **Freeze the brief.** Write one consolidated build brief that lists, by number, every accepted item from Opus 1 to 34, Opus 35 to 53, Codex 54 to 68 and this file, with the three overrides above (60 second half dropped; 64 overrules the motion table on Add arrival and the wrong-answer tilt; 54 replaces the vector geometry). The builder works from that one file plus section 4 of the proposal and the character profile.
2. **Character first.** The builder presents traced stills and the ten face crops for Jof's sign-off before any game code changes. That is the one remaining design approval.
3. **Build order** as Codex lists it: frame, shelf and gate with migration; Shapes; the cancellable Feelings sequence; speech audition; behaviour, privacy and viewport checks; S24 and iPad in both orientations; preview release under the existing staging allow-list. Tests at every step; the six-size layout harness plus the touch-target report runs in the test suite.
4. **No more review rounds on the design.** Review moves to the build: the builder's own checks, then one review of the built preview on the real devices.

## Two questions still open for Jof

- Does school use a feelings colour scheme? (Neutral cards until answered.)
- Is Arthur's Grid keyboard ABC or QWERTY? (ABC until answered.)

The other three decisions are settled by this round: lock the device (yes, per 68), Nook's drawing (the original, per 54), the Help glyph (keep the hand sign).
