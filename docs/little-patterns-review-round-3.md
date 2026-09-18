# Little Patterns: review round 3 (Jof, 18 September 2026)

Jof played all the games and sent this list with screenshots. His words are kept close
to how he wrote them. Arthur is five, autistic and non-verbal; he reads and types well,
and numeracy is the learning goal. The scope still applies: no timers, lost lives,
rewards, locked progression, accounts or server-side names.

## Colour Blocks

1. Swap the Turn and Down buttons. (Order becomes Left, Down, Right, Turn, Place.)
2. A simple, not too flashy animation on row completion. His suggestion: the ROWS MADE
   number pops on every increase (grows, then shrinks back, eased in and out). Several
   rows completed at once get flashier graphics.
3. Add Nook under the play window and above the controls (the empty space bottom-left of
   the board). He has a speech bubble saying encouraging things. No actual speech yet.
   Short simple words: "Yes!", "Oh no!", "Great!". Emojis occasionally: smiley face,
   sunglasses and so on.

## Nook's Garden

4. Count should be able to count up to 100. "It's still only 5."
5. Add / Take should only have small sums, no larger than 10. "Very confusing at the
   moment." He then found that levels can be changed: "That's not intuitive, and I
   designed the game. Think on that with Codex."
6. Words: "Give me a clue" becomes "Help!" with the Makaton sign for help (flat palm with
   a fist, thumb up, resting on top).
7. "Change puzzle" suffers the same lack of intuitiveness as levels in Add and Count.
   "Children certainly wouldn't know what the options mean. Think this with Codex as well."
8. Patterns needs to start with the simple patterns. "Complicated is good, but even I'm
   struggling."
9. "Pass all of this review to Codex."

## Paint (Nook's Messy Studio)

10. The sounds are too harsh. "I don't know if that's limitations because of small file
    sizes, but consistent brushstrokes sound like a train or engine. Subtlety, ASMR style
    pleasantness is absolutely key."

## Passes and build record

### Codex pass (gpt-6-astra, read-only, 18 September 2026)

### A. Make the choices visible

**Replace the difficulty pill with an always-visible row of picture tiles.** Each tile shows an actual miniature task: apples in frames, sticks plus loose apples, or two groups joining/separating. Include range numerals—`1–5`, `1–10`, `51–100`—as supporting information. Use the same objects as the puzzle, rather than stars or abstract difficulty symbols.

Six tiles fit across an iPad’s portrait width. Use a 64px row replacing `.garden-top`’s decorative label and small `#support` pill; keep every target at least 48px. Outline the selected tile. One tap selects it and presents its first example; tapping another immediately reverses the choice. All tiles remain available.

For Count’s final tile, show ten ten-sticks and **100**. Selecting it should offer an immediately visible 100 example, rather than requiring discovery inside another picker. Preserve direct quantity selection through tapping the selected tile.

**Words gets four directly selectable miniature-task cards**, replacing “Change puzzle”:

- Missing word: cat picture, `THE [   ] RUNS`, and a `CAT` tile pointing into the gap.
- Missing letter: cat picture, `C [ ] T`, and `A` pointing into the gap.
- Word order: three scattered word tiles pointing toward three ordered slots.
- Number words: three apples beside `3 → THREE`.

These show the action, not merely the topic. Keep short labels, but make recognition independent of understanding those labels. Use a single 64px row, with the selected card outlined; selecting a card immediately opens that activity and preserves other drafts.

Change `garden.html`’s `.garden-top`/`#support`; `garden.js`’s `header()`, `levelPicker()`, `levelDescription()`, `choosePuzzle()`, `WORD_ACTIVITIES`, `wordsView()` and `setLevel()`; and `.level-picker`, `.picker-tabs`, `button.support` plus the landscape media rules in `garden-live.css`. Reset the relevant example index when deliberately changing level.

**Defaults:** Count L2, 1–10, with 100 visibly accessible; Add and Take L1, within 5, with within-10 beside it; Words Missing word; Number words L1; Patterns AB. Store Add/Take level choices separately through `setOperation()`, `levelOf()`, `save()` and `restore()`.

**No automatic adaptation.** Neither correct answers, errors nor Help trigger promotion or demotion. Next stays at the chosen difficulty. Only tapping a picture tile changes it, with the selection always visible and reversible. This matches the scope and avoids treating accidental taps as evidence of ability.

#### What the tables actually generate

From [learning.js](/C:/hirednerds-portfolio/public/fireworks/little-patterns/learning.js):

| Level | Count | Add | Take |
|---|---|---|---|
| 1 | Every integer 1–5 | Positive parts; totals 2–5 | Start 1–5; remove 0 through all; answers 0–5 |
| 2 | Every integer 1–10 | Positive parts; totals 2–10 | Start 1–10; remove 0 through all; answers 0–10 |
| 3 | 11–20 | 10–19 plus 1–9, without passing the next ten; totals 11–20 | Start 11–19; remove 1 through its ones digit; answers 10–18 |
| 4 | 10, 20, 30, 40, 50 | Parts 2–9; totals **11–18** | Start 11–18; remove 2–9, crossing ten; answers 2–9 |
| 5 | 21–50 | Positive tens; totals 20–100 | Positive tens removed from 10–100; answers 0–90 |
| 6 | 51–100 | Missing second part; totals 3–10; missing answers 2–9 | No separate level: coerced to L5 |

Number words: L1 1–5; L2 1–10; L3 11–20; L4 tens 10–100. `mixed()` uses a deterministic stride, not ascending order or randomness. Count L1 begins `1,3,5,2,4`; L6 begins `51,58,…`. Count L1–2 later vary arrangements; larger levels introduce ten-frames, then sticks.

### B. Patterns: separate complexity from surprise

Today `patternRound()` defines:

1. AB, final gap.
2. AB, interior gap.
3. ABB/AAB alternating, final gap.
4. ABC.
5. AABB.
6. ABCB/ABAC alternating.
7. ABCD.
8. AB, two gaps.
9. ABC, two gaps.
10. ABCDE, one gap.
11. ABCDE, two gaps.
12. Growing.
13. Mirror.
14. Numbers, cycling steps 1, 2, 5, 10.

**Next does not traverse these levels.** It increments the example index within the selected level, varying shapes and gaps.

A fresh profile starts AB. A hard first encounter can come from `restore()` restoring an explicit level, or its legacy migration computing `floor(indices.patterns/3)+1`. `setLevel()` also retains the existing example index.

Use this ladder: **AB end → AB interior → AAB end → ABB end → ABC end → AABB end → ABAC end → ABCB end → ABCD end → corresponding interior gaps → AB/ABC two gaps → ABCDE one/two gaps.** Keep Growing, Mirror and Numbers as separate pictured families; split number steps into explicit choices.

Movement is deliberate: Next repeats the current rung; tapping another preview changes rung. Start new profiles and ambiguous legacy saves at AB, while preserving explicit saved choices. Change `patternRound()`, `LEVELS.patterns`, `patternHint()`, `restore()`, `setLevel()`, `levelDescription()` and `#next-level`; migrate saved identifiers when reordering levels.

### C. Why the brush sounds mechanical

This is a code-based diagnosis, not an iPad listening test.

`texture()` bakes in **9–56Hz pulsation**, plus 2.5/5Hz “breathing” and gain jumps every 10ms. `finish()` makes a **1.6-second repeating loop**. Low-pass noise at 530–2100Hz gives a substantial low/mid body; rolling adds a roughly 134–160Hz tone modulated at 13Hz. Together these plausibly produce engine-like flutter and rumble.

Ordinary brush movement updates one sustained source through `stroke()` → `motion()`; it does **not** retrigger a sample every pointer event. However, the 130ms inactivity watchdog can repeatedly retire/restart sparse movement, and sponge additionally triggers dabs with an 85ms cooldown. The 32ms automation updates are not themselves 32ms grains.

Current texture peaks are 0.48, stroke gain reaches roughly 0.20, and master gain is 0.65. Flicks contain several clustered chirps with 4ms attacks; impacts add a 185Hz body.

**Change both synthesis and runtime.** Starting tuning values:

| Sound | Filtering | Envelope | Voice gain |
|---|---|---|---|
| Brush | Band-pass 1400Hz, Q 0.55 | 80ms attack, 180ms release | −28 to −24dB |
| Flick | Band-pass 1000Hz, Q 0.6 | 15ms attack, 160ms decay | −24dB |
| Marble contact | Band-pass 1300Hz, Q 0.7 | 8ms attack, 90ms decay | −26 to −22dB |
| Marble roll | Band-pass 800Hz, Q 0.5 | 100ms attack, 200ms release | −32 to −28dB |

Calibrate source peaks to −6dBFS; master −6dB. These Q values apply to **band-pass** filters; Web Audio interprets low/high-pass Q differently. [Specification](https://www.w3.org/TR/webaudio-1.0/#BiquadFilterNode)

In `texture()`, remove periodic modulation and rolling tones. Generate six-second noise textures; replace stepped variation with smoothly interpolated random gain, ±0.5dB. In `paint()` use one soft noise gesture; in `impact()` remove the 185Hz body and shorten ringing.

In `voice()`/`motion()`, replace looping with random 0.7–1.5-second excerpts, random offsets and 120–200ms equal-power overlaps; allow two sources per active texture, maximum four. Randomise rate ±3%; smooth speed-driven gain over 100ms. Avoid fixed-cadence retriggers. Revise `watch()`/`retire()` for a smooth inactivity fade; remove repeated sponge dabs during dragging in `studio-lab.html`. Randomise one-shot selection instead of alternating two variants.

Regenerate the WAV, manifest and `bank.js` through `build-studio-sounds.cjs`, then audition sustained strokes and contacts on the iPad.

### D. Pushback

Count already reaches 100; discoverability is the defect. Small files do not require harsh sound.

“Oh no!” conflicts with neutral error feedback. “Flashier” multi-row clears conflict with the quiet, no-flashing brief; keep one restrained, reduced-motion-aware pop.

Pictures cannot guarantee comprehension without observation. Test these concrete task previews with Arthur.

Read-only review; no files changed.

### Build record (Claude Fable 5.1, 18 September 2026)

Deployed to kpopboom.party the same day (asset version 20260918a; sound engine velvet2). 138 automated tests pass; the paint touch harness and reliability harness pass. Nothing is committed.

| Item | What was built | Where |
|---|---|---|
| 1 | Button order is Left, Down, Right, Turn, Place. Keyboard keys unchanged. | blocks.html |
| 2 | ROWS MADE pops (grow, shrink, eased) on every row; the finished row glows once. Two or more rows at once: a bigger gold pop, a brighter band and a burst of stars in the piece colours. All of it is off under reduced motion, and stars are off with Softer colours. | blocks.js `celebrate()`, blocks-live.css |
| 3 | Nook sits under the board with a bubble: Hello, Nice!, Yes!, Great!, Ten!, WOW! 😎, Oh no! 🙈 (full board), Try again! (undo), Zzz 😴 (pause). Every third ordinary piece gets a word so he is not chattering. The bubble is hidden from screen readers because the status line already says what happened. The board gives up a little height on short screens so Nook never sits under the controls (measured at 1024x698, 1024x768, 768x954, 360x640, 360x740, 390x844). | blocks.html, blocks.js `nookSay()`, blocks-live.css |
| 4, 5, 7 | The cause was one thing: levels and puzzle types lived behind a small pill ("Level 1 of 6 · Add"). Now a **level strip** is always in view above every activity. Count: 1–5, 1–10, 11–20, 10 20 30, 21–50, 51–100. Add: a sample sum per level (2+1, 6+3, 12+5, 8+7, 30+40, 2+?=5); Take the same. Words: four picture tiles of the task itself (THE ▢ SAT, C▢T, shuffled word chips, 3 → THREE), plus the four ranges when Number words is chosen. One tap changes level and starts at that level's first puzzle; tapping the chosen tile opens the old full chooser, which also stays behind a small "⋯" button. | garden.js `strip()`, garden-live.css |
| 5, 8 | **Next level ↑ is gone.** It sat beside Next after every right answer, and that is almost certainly how Add and Patterns crept up to hard levels without anyone choosing them. On the first visit after this update Add and Patterns go back to level 1 once (Count keeps its level). Following Codex, nothing adapts automatically. | garden.js `footer()`, `restore()` |
| 8 | Patterns tiles are little windows on the real puzzle with the gap drawn as a dashed bead, so end gap, middle gap and two gaps look different. The order was already simplest-first (AB end gap first); the strip scrolls sideways for all 14. Codex's finer ladder (AAB and ABB as separate rungs) is NOT built. | garden.js `patternTile()` |
| 6 | "Give me a clue" is "Help!" with a hand-sign drawing on every activity's help button (Count with me, Show me and Show the pattern keep their words and gain the drawing). The drawing is our own line art of the gesture (thumb-up fist lifted on a flat palm). It is not the Makaton Charity's artwork, which is copyrighted; if Jof wants their exact symbol it needs their licence, like Widgit. | garden.js `HELP_SIGN` |
| 10 | Three causes of the "train" were found in code and removed. (a) Every brush texture had a pulse of 9 to 56 Hz, a gain step every 10 ms and a 1.6 s loop baked in: textures are now band-limited noise (no rumble below 350 to 1200 Hz) with a slow irregular swell, 2.6 s long, started at a random point. Measured: the old designed pulse lines (21 Hz round, 56 Hz crayon, 10.5 Hz sponge) are gone; a test now fails if one returns. (b) Finger speed drove pitch and re-ramped the volume about 30 times a second: pitch no longer follows speed, readings are smoothed over 120 ms, volume glides, a voice is kept alive for 450 ms so slow strokes do not restart it, and release takes about a fifth of a second. (c) The sponge fired a dab every 85 ms while dragging: now one dab on touch-down only, and dribble dabs wait a random 130 to 370 ms. Also: splats are one soft wet gesture instead of up to six chirps 23 ms apart, marble clicks lost their 185 Hz thump, everything is about 5 dB quieter, the master filter opened from 2.7 to 6.5 kHz so the sound is airy instead of dull, and the compressor is gentler. Bank is 24 kHz, 1.70 MiB (still under the 2 MB cap). **Nobody has listened to this yet. It was designed by reasoning and measurement, not by ear.** The sound table for auditioning is /little-patterns/studio-sound-review.html. | tools/build-studio-sounds.cjs, studio-sound.js, studio-lab.html |

Where Codex and Jof disagreed and what was done: Codex said "Oh no!" conflicts with neutral feedback and flashier multi-row clears conflict with the quiet brief. Jof asked for both in plain words, so both are built, with "Oh no!" used only when the board fills, never for a wrong move, and the flashier effect kept to about one second with no flashing. Codex proposed separate saved levels for Add and Take, and miniature apple pictures on the number tiles: not built; numerals and sample sums were judged clear enough for a reader, and are one CSS/JS table away from changing.

Still open: Jof's ear on the new sounds; Arthur's hands on the strip; the finer Patterns ladder; committing (live has been ahead of git since 17 September).

## Round 3b: Jof's second pass, same day (after trying the deployed build)

11. Paint sounds: brushes are better. Potato stamp and flick "sound like slamming doors. This is too aggressive. I'm thinking more like 'pfft', 'pt', 'ff'."
12. Blocks: he saw no pop or flash on row completion at all (Nook's words did appear). He expects "something really quite spectacular" for several rows at once and "something still visually exciting" for one row. Add a simple, very muted chime for a row, stacked for multiples ("ker-ker-ker-ching").
13. Number words: "Should this not be encouraging the user to spell the number word?"
14. The help button must read "Help!" in every game and activity. No variations ("Show me", "Count with me", "Show the pattern" all go).
15. Word order: "I love, but this should be a dragging game, with some sort of simple reject animation if the wrong tile is dragged into the text area."
16. Patterns strip: "Good start. Too confusing to choose from." He wants something easily identifiable: 2 shapes, 3 shapes, 4 shapes. "That's it." Then a variety of puzzles inside each: replace 1, replace 2, replace 3.
17. Add: the congratulation appears twice ("Spot on!" in Nook's bubble and again in small text). Remove the small one; only Nook congratulates. The strip is "even more confusing. What does 6+3 have to do with 1+1? This level button is clearly for parents to set. But I don't know what it means, still."
18. Count with tens: "Visually this is horrible. How are these towers anything like 10 apples? And then the extra 1 apple is in a shape that has 10 spaces. This is not easy for me, or a child, to identify what the task actually is. 10 small apples in a row is better. But maybe pass back to Codex."

### Codex pass on items 16 to 18 (gpt-6-astra, read-only)

**1. Count: use rows of ten recognisable apples throughout quantities above ten.**

Draw each ten as **ten 16px apples in one horizontal row**, with a slightly wider gap after apple five, enclosed by one pale rounded outline. Put a small `10` above the apples inside that outline. Keep individual apples visible.

Use a **552 × 272px** layout:

- Tens: two columns of **192 × 48px** buttons, with 8px gaps; five rows accommodate ten tens. Fill left-to-right, then downward.
- Ones: a separate 144px-wide area on the right, separated by 16px. Show only the remaining apples, in reading order across three columns, each with a 48px touch target. **No empty slots or surrounding ten-frame.**
- Thus 99 has nine ten-buttons and nine loose apples; **100 has ten ten-buttons and no ones**.

Keep every ten individually tappable, counting once as ten. Help advances through tens, then ones: `10, 20, 30, 31, 32`. Show the running total without covering apples.

**Present groups already formed.** Automatic sliding adds movement and waiting to every counting task; visible apples already show what each group contains.

This follows the linear grouping of bead strings and the “one group represents ten” principle of Dienes rods, while retaining concrete objects. It deliberately leaves the conventional ten-frame layout behind above ten. [NCETM’s guidance](https://www.ncetm.org.uk/media/ikjbjpbo/ncetm_mm_sp1_y1_se08_teach.pdf) supports counting groups of ten using both objects and structured representations.

**2. Add/Take: label the scope, not a sample question.**

Use these exact two-line labels; `/` indicates a line break.

| Level | Add | Take away |
|---|---|---|
| 1 | `Totals` / `Up to 5` | `Start with` / `Up to 5` |
| 2 | `Totals` / `Up to 10` | `Start with` / `Up to 10` |
| 3 | `Teens + ones` / `No crossing` | `Teens − ones` / `No crossing` |
| 4 | `Cross 10` / `Up to 20` | `Cross 10` / `Up to 20` |
| 5 | `Tens only` / `Up to 100` | `Tens only` / `Up to 100` |
| 6 | `Missing part` / `Within 10` | — |

These explain why `1+1` belongs under the second tile. One implementation correction: Add L3 currently includes totals of 20; exclude those if “No crossing” is to mean no regrouping.

**3. Patterns: three choices, with the following fixed cycles.**

Label tiles **`2 shapes`, `3 shapes`, `4 shapes`**. Each table entry is **unit; total visible positions; gap positions**, numbered from **1**, including gaps. A–D denote distinct shapes.

| Next order | 2 shapes | 3 shapes | 4 shapes |
|---|---|---|---|
| 1 | AB; 6; 6 | ABC; 9; 9 | ABCD; 12; 12 |
| 2 | AB; 8; 6 | ABC; 9; 8 | ABCD; 12; 10 |
| 3 | AAB; 9; 9 | ABAC; 12; 12 | ABCD; 12; 10,12 |
| 4 | ABB; 9; 9 | ABCB; 12; 12 | ABCD; 12; 9,10,12 |
| 5 | AABB; 12; 12 | ABC; 12; 8,12 | Cycle to 1 |
| 6 | AB; 8; 6,8 | ABAC; 12; 10,12 | |
| 7 | AAB; 12; 8,12 | ABC; 12; 8,10,12 | |
| 8 | AB; 10; 6,8,9 | Cycle to 1 | |
| 9 | Cycle to 1 | | |

Keep the first two complete units intact. **Three gaps with AB are fair here:** ten positions preserve ample evidence, and both shapes are missing.

Show up to ten beads on one line. For twelve, use 6+6 positions for three-bead units and 8+4 for four-bead units, with clear reading order. Never clip the string.

Start each choice at row 1; cycle on Next, varying shape identities between cycles. Offer exactly the chosen family’s shapes as reusable answers.

Drop growing, mirror, number and five-shape puzzles from the playable interface. A hidden secondary chooser would reintroduce the complexity the owner explicitly rejected.

### Build record, round 3b (Claude Fable 5.1, 18 September 2026)

Deployed to kpopboom.party (asset version 20260918b; sound engine velvet3). 139 automated tests pass, plus the paint touch harness. Nothing is committed.

| Item | What was built |
|---|---|
| 11 | Splat, tap, dribble and stamp sounds rebuilt as breath: air-band noise only (nothing below 900 Hz, no tone, no droplet cluster), soft start, a bright edge that dies faster than the body ("pt", "pfft", "ff"). The stamp's sound was a 300 Hz burst, which is the door. Quieter again, and the per-voice filter opened to 5 kHz so they read as air, not thud. Still unheard by anyone. |
| 12 | Cause of "no animation": Jof's PC has Windows animation effects off, the browser reports reduced motion, and round 3 obeyed it. The celebration now follows the game's own Softer colours setting instead of the device flag (decision recorded in blocks.js). One row: the row flashes, its blocks burst into confetti in their own colours, "10!" floats up, the board glows, ROWS MADE pops. Several rows: bigger bursts, "10 + 10 = 20" and a large "20!", firework rockets, confetti rain over the whole page, the board shakes once. Drawn on one overlay canvas that only runs while something is flying. Chime: a very quiet sine bell, stacked for multiples (`LP.audio.chime(rows)` in shared.js), silent when Sound is off. |
| 13 | Number words now asks for the spelling by default (the Grown-ups setting still offers show and choose). Existing players are moved from "show" to "type" once. |
| 14 | Every help button reads "Help!" with the hand sign. No variations. |
| 15 | Word order is a dragging game: the tile follows the finger, the next space lights up over the sentence, the right word drops in, a wrong word wobbles red and glides home while Nook says try again. A plain tap still works (keyboard and switch access), and a wrong tap wobbles too. |
| 16 | Patterns strip is three tiles: 2 shapes, 3 shapes, 4 shapes. Inside each, Next walks Codex's ladder (one gap at the end, a middle gap, AAB/ABB/AABB or ABAC/ABCB, then two gaps, then three) and goes round again with different shapes. Long strings wrap in whole units so the repeat lines up in columns. Growing, mirror, number and five-shape levels are out of view; they remain only in the "⋯" chooser (Codex would drop them entirely). |
| 17 | Only Nook congratulates: the small status line is not drawn on success (it still speaks to a screen reader). Add and Take tiles now say their scope with one small example: "Up to 5 / like 2 + 1", "Up to 10", "Up to 20", "Over ten / like 8 + 7", "Tens", "Missing number". Wording is Fable's, simpler than Codex's ("Teens + ones / No crossing"). |
| 18 | A ten is a row of ten small apples (five, a space, five) in a pale tray with a small 10; the red towers are gone. Left-over ones are loose apples with no empty slots. Tens still count as 10, 20, 30 on a tap and with Help!. Applied everywhere sticks were used (Count, Add, Take, Number words). Not done from Codex's note: Add level 3 can still total exactly 20. |

Still open: Jof's ear on the splat and stamp sounds; whether the celebration is spectacular enough on the iPad; the parent answer reference (content.html) still lists the old fourteen pattern levels, not the families; committing.

## Round 3c: Jof's third pass, same day

Passed ("very pleased"): Colour Blocks celebration, Help! button, single congratulation, Number words spelling, Word order dragging ("excellent"), Count tens as rows of apples.

19. Paint sounds: "now the flicks sound like smacks. Review. Marble balls sound like waves or white noise dragging across the paint. Review."
20. Patterns: "Good effort. Patterns cannot go over one line unless each line is a repetition of the one above (this should be reserved for 4 beads). Bead area may need to be bigger. Or the pattern sequence limited to the n beads that can fit in one row (presumably 8, to facilitate a pattern with 4 unique beads). 4 shapes is always this same pattern. Just asks for different beads."
21. Add: the down (or, on tablet, sideways) arrow between the two groups and the joined group "needs to be an equals sign".
22. Take away: "visually very poor; look to find some reference on educating children on subtraction. It's very busy, and I can't easily understand it." (Screenshot: NOOK HAD box, arrow, LEFT box saying "none", TAKEN AWAY box with a basket, then 1 − 1 = ?.)

### Codex pass on items 19, 20 and 22 (gpt-6-astra, read-only, with NCETM reference)

**1. Take away: use one group with removed apples crossed out.** This represents reduction: the original quantity, what goes, and what remains share one picture. It follows [NCETM’s first–then–now subtraction structure](https://www.ncetm.org.uk/classroom-resources/primm-106-additive-structures-introduction-to-augmentation-and-reduction/); crossing out is my recommended static implementation.

For **5 − 2**, draw five apples horizontally. The rightmost two are pale but recognisable, each crossed by one clear diagonal stroke; three remain solid. Show this completed picture before asking for the answer. After a correct answer, instantly remove the crossed apples and strokes, leave the survivors in place, and replace `?` with `3`. No movement, regrouping, basket, arrows or duplicate groups.

For **3 − 3**, all three apples are crossed before answering; afterward the same picture area is empty and the equation reads `3 − 3 = 0`. For **3 − 0**, nothing is crossed or removed; only the answer changes.

Above ten, use rows of ten small apples, spaced five–five, followed by a partial row containing only actual apples. Remove from the end:

- **17 − 5:** cross the last five of the seven; afterward ten plus two remain.
- **14 − 6:** cross all four in the partial row, then the rightmost two in the ten-row; afterward eight remain in their original positions.
- **70 − 30:** seven ten-rows; cross every apple in the last three rows; afterward four rows remain.

Omit printed `10` badges in subtraction: a partly crossed row would make that label misleading. Keep task wording to **“Take away 2. How many left?”**, the equation, and necessary controls. Substitute `3` or `0` as appropriate.

**2. Patterns: use these fixed ladders, always on one row.** Each entry is **unit; total positions including gaps; gap positions numbered from 1**. Cycle after the last entry.

| Rung | 2 shapes | 3 shapes | 4 shapes |
|---|---|---|---|
| 1 | AB; 4; 4 | ABC; 6; 6 | ABCD; 8; 8 |
| 2 | AB; 6; 5 | ABC; 6; 5 | ABCD; 8; 7 |
| 3 | AAB; 6; 6 | ABAC; 8; 8 | ABCD; 8; 6,8 |
| 4 | ABB; 6; 6 | ABCB; 8; 8 | ABCD; 8; 6,7,8 |
| 5 | AABB; 8; 8 | ABC; 8; 5,8 | — |
| 6 | AB; 8; 6,8 | ABAC; 8; 6,8 | — |
| 7 | AB; 8; 6,7,8 | ABC; 8; 6,7,8 | — |

Always keep the first unit complete. Mark unit boundaries with pale brackets and say **“Repeat”**: the first unit explicitly supplies the model when further evidence is sparse. Offer exactly the family’s shapes as reusable answers; remove distractor padding.

For four shapes, independently vary the ordered selection of four from all five available shapes each puzzle; avoid consecutive identical orders. Keep **ABCD only**. ABCA contains three distinct shapes. Four distinct shapes within four positions necessarily retain ABCD structure; eight beads cannot provide substantial structural variety plus a demonstrated repeat and three gaps fairly.

**3. Sound: replace the transient shape and silence continuous rolling.** These are code-based diagnoses and proposed audition settings.

The flick still combines a **6 ms rise**, **45 ms decay**, and a strong, faster-decaying bright layer extending towards **9 kHz**. Even with runtime fading, that concentrated onset plausibly reads as impact.

Use one **260 ms puff**: **45 ms raised-cosine attack**, then approximately **120 ms decay time constant**, ending smoothly. High-pass at **700 Hz**; lower the low-pass smoothly from **3.5 to 1.8 kHz** across **180 ms**. Remove the separate bright edge. Target isolated output peaks **−42 to −38 dBFS after master gain**.

Rolling’s sustained random excitation, **±22% swell over 220–700 ms**, and speed-following gain plausibly produce surf or dragging. Continuous noise is the wrong model for this quiet interaction. Make free rolling silent; retain only actual collision contacts: **8–12 ms attack**, **50–90 ms total**, heavily damped **1.1 kHz** body, low-pass **2.5 kHz**, output peaks **−46 to −40 dBFS**. Audition on the iPad before acceptance.

### Build record, round 3c (Claude Fable 5.1, 18 September 2026)

Deployed (asset version 20260918c, sound engine velvet4). 139 tests pass. Nothing committed.

| Item | What was built |
|---|---|
| 19 flick | Cause: any noise that reaches full level in a few milliseconds and decays is a clap, and the bright layer sharpened it. Now one band above 700 Hz that swells in on a raised cosine (16 to 70 ms), whose low-pass glides shut while it sounds (3.5 to 1.8 kHz for a flick), fading over about a tenth of a second. No second layer. Codex's numbers, slightly shortened for taps and dribbles. |
| 19 marbles | Codex recommended silent rolling with contacts only. Built instead, as the quieter of two options: rolling made from about 70 tiny soft ticks a second at random moments (what rolling physically is) over an inaudible bed, at half the previous level. If it still reads as hiss, set the gain in `rollProfile` to 0: one line. |
| 20 | Every family string is ONE row of at most eight beads that share the task width (checked at 360, 768 and 1024 wide). Codex's ladder: 2 shapes AB 4, AB 6, AAB, ABB, AABB, then two and three gaps; 3 shapes ABC 6 up to three gaps in 8; 4 shapes ABCD in 8 with 1, 1, 2, 3 gaps. The first whole unit is never hidden and is tinted green as the model. The shapes playing A to D change on every puzzle (drawn from all five shapes), which answers "always the same pattern". Answers offered are exactly the family's shapes. Codex is right that four distinct shapes in eight beads can only ever be ABCD; variety comes from which shapes and which gaps. |
| 21 | The sign between the two groups and the joined group is "=", upright in portrait and landscape. |
| 22 | Take away is one picture (the reduction structure, first / then / now, per NCETM): all the apples Nook started with, the ones he eats pale and crossed out from the end. After the answer they vanish and the rest stay where they were. No NOOK HAD / LEFT / TAKEN AWAY boxes, no basket, no arrow. Title is "Take away 2. How many left?". Above ten, rows of ten apples (five, space, five) with no 10 badge; 14 − 6 crosses the four loose apples and two in the row. Help! numbers or outlines only what is left. |
