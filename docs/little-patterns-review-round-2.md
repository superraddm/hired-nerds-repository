# Little Patterns: review round 2 (no build)

Two review passes, no code changes. Pass 1 is Claude (Fable 5.1); pass 2 is Codex
(gpt-6-astra). **Approved by Jof as written, 15 September 2026.** The build brief at
the end of this document is the instruction set for the Sonnet build; where the two
passes disagree, the brief follows Pass 2, which was the response to Pass 1.

Baseline reviewed: commit `7c88f68`, live at https://kpopboom.party/little-patterns/.
Jof has confirmed the iPad works well. The game directions are approved and are not
up for change; this round is about interface, player feedback, playability depth
and arithmetic breadth.

Jof's asks for this round:

1. Nook should say more encouraging things on a correct answer.
2. Count only goes to 5 (10 via the picker). Add levels or a mechanism that takes
   counting to 100.
3. Patterns must keep getting more complicated as play progresses.
4. Add more sums, including subtraction.
5. Evaluate the games, the gameplay and the layout generally.

Constraints that still bind (from the scope): quiet by default, no timers, lives,
streaks, rewards economy or locked progression; every level directly choosable;
wrong answers stay neutral and re-tryable; symbols alongside words; colour never the
only cue; 48 px tap targets; no permanent animation loop; nothing leaves the device.

---

## Pass 1: Claude

### A. Player feedback and Nook

**A1. Correct-answer feedback is flat and duplicated.** On a right answer the page
shows a green result note ("✓ 1 apple altogether.") *and* the same text again in
the status line, while Nook's bubble stays on the activity prompt ("Apples for our
picnic!"). Wrong answers already route through Nook ("Whoops! Try again."). Right
answers should too. Proposal:

- Move the success line into Nook's bubble and drop the duplicate status line.
- A small rotating bank of encouragements, chosen deterministically per round so
  the same puzzle always gets the same line (predictability matters for Arthur):
  "Yes! Three apples.", "You found it!", "That's the one.", "Lovely counting.",
  "Spot on, Arthur." (name only if a player name is set; otherwise "Spot on!").
  Keep them short, factual and warm; no "amazing/awesome" inflation, which loses
  meaning fast and can read as pressure.
- Echo the answer in the line where it exists ("Yes! 2 + 1 = 3.") so praise also
  restates the maths.
- Bundle these as voice clips too (the pipeline already exists), played only when
  sound is on and only on the tap that answered.
- A single, gentle, non-looping visual acknowledgement is acceptable under the
  quiet rule: Nook's speech bubble tint changing to the success green for that
  round, or a static ✓ badge on the bubble. No confetti, bounce or timed effects.

**A2. Wrong-answer wording is doubled.** Status reads "Whoops! Try again. Look at
the apples. You can count them and try again." Two "try again"s. Nook's bubble
already says Whoops; the status should carry only the hint ("Look at the apples and
count them.").

**A3. Give me a clue is uneven across activities.** In Count it counts one apple
per tap, then highlights the answer. In Add, Missing word and Patterns it
immediately outlines the answer, which is a reveal rather than a clue. Suggest a
two-step clue everywhere: first tap gives a scaffold (Add: number-tag the joined
apples 1, 2, 3 like Count does; Patterns: outline the repeating unit, which it
already does; Missing word: read the sentence aloud with "blank"); second tap
outlines the answer. Same button, same label, escalating help.

**A4. Progress is invisible.** Nothing tells Arthur or a parent how much has been
done in a session. Not a score and not a streak, but a quiet, non-comparative
marker is useful: a row of small filled apples in the activity header, one per
completed round this visit, capped at ten and never reset by a wrong answer. It
gives the parent a glance metric and Arthur a visible "I did some".

### B. Count: from 5 to 100

The current tray is a five- or ten-frame, one apple per pocket, and the answer is
tap-a-numeral. That model stops working at 20. The right structure for 100 is the
one Numberblocks and NCETM lean on: **tens and ones.**

**B1. Levels (all directly choosable, default level 1).**

| Level | Range | Tray | Answer |
| --- | --- | --- | --- |
| 1 | 1–5 | five-frame | choose from 2–3 numerals |
| 2 | 1–10 | ten-frame | choose from 3 |
| 3 | 11–20 | one full ten-frame plus a second frame | choose from 3, or type on the keypad |
| 4 | 10–50 by tens | full ten-frames stacked as "sticks", nothing loose | type on the keypad |
| 5 | 21–50 | sticks plus loose ones | type |
| 6 | 51–100 | sticks plus ones, up to ten sticks | type |

Levels 4–6 need the tens to be visually chunked: a complete ten-frame collapses to
a single vertical "stick of ten" (a tall apple-coloured bar with 10 dots) so 73 is
read as seven sticks and three loose apples, not 73 things to count individually.
That is the whole learning point at this range.

**B2. Count with me at higher levels.** Tapping a stick says and shows "ten, twenty,
thirty…"; tapping loose ones continues "…seventy-one, seventy-two". The running
total appears in the tag as it does now. This is skip-counting scaffolding and it
is exactly where Arthur's number-sequence strength meets quantity.

**B3. Answer method.** Choice buttons stop being useful past 20 (three near numbers
like 43/47/44 is a reading test, not a counting test). The keypad from Add already
exists; reuse it from level 3 up, with the choice buttons as the parent-selectable
alternative.

**B4. Number words at higher levels.** The Number words tab pairs quantities with
ONE–TEN. Extend to TWENTY, THIRTY … HUNDRED and the teens, in the same tens-and-ones
tray. This is a natural fit for a strong speller and it stays a numeracy activity.

**B5. Do not change level 1 and 2.** They are the approved design and the entry
point; the higher levels add on.

### C. Add: more sums and subtraction

**C1. Subtraction as "take away", in the same picnic.** Show a group, then some
apples go into Nook's basket (drawn faded/outlined in the group, like the outlined
"new" apples in Add today). Equation `5 − 2 = ?`. The visual is the mirror of Add's
"joined group with new ones outlined", so it stays one visual language. Nook's line:
"Nook eats two. How many are left?"

**C2. Levels for Add and Take away (choosable, default = current behaviour).**

| Level | Add | Take away |
| --- | --- | --- |
| 1 | totals ≤ 5 (current) | from ≤ 5 |
| 2 | totals ≤ 10 | from ≤ 10 |
| 3 | one addend is 10, total ≤ 20 (10 + 4) | from 11–20, take away ones only |
| 4 | totals ≤ 20, tens-and-ones tray | from ≤ 20 |
| 5 | multiples of ten (30 + 20) | (60 − 20) |

Level 3 and up use the same tens-and-ones tray as Count, so the three activities
share one representation of quantity.

**C3. Missing addend.** Once Add is solid, `2 + ? = 5` with the joined group shown
and the second group's apples outlined, is the standard bridge from addition to
subtraction and worth a level of its own. Keep it behind a level, not the default.

**C4. Doubles and number bonds to ten as a picker set.** The picker already lists
sums; add two named sets, "Doubles" (1+1 … 5+5) and "Make ten" (9+1 … 1+9), because
these are the ones worth repeating.

**C5. The equation line should be part of the answer.** Right now the answer
buttons sit below the equation; when a number is chosen the `?` becomes the number.
Good. For typed answers on the keypad, the typed digits already appear in the `?`
slot. Keep that for subtraction too.

### D. Patterns: keep escalating

Current ladder tops out at level 7 (ABCD, one gap). Suggested continuation, all
still "one or two missing beads, choose the bead", so the interaction never changes:

| Level | What changes |
| --- | --- |
| 8 | Two gaps in an AB or ABC string (fill either, in any order) |
| 9 | Growing patterns: A, AB, ABB, ABBB (add one more each time), gap at the end |
| 10 | Colour and shape vary independently: red circle, blue circle, red square, blue square (unit is colour-then-shape) |
| 11 | Mirror / symmetry: ABCCBA, gap anywhere |
| 12 | Number patterns on beads: 1, 2, 1, 2 then 2, 4, 6, ? (counting on) |
| 13 | Ten beads, unit of five (ABCDE) |

Two rules to keep it honest: never require more than three answer choices, and
every level remains in the picker. The support tag should keep reading "Level N of
M". Also the unit hint ("Circle. Square. Repeat.") should stop spelling out the
unit from level 8, and Give me a clue should outline it instead, or the hint does
the puzzle.

**D1. Make your own pattern.** A free "bead string" mode where Arthur taps beads
onto an empty string and Nook reads it back ("Circle, square, circle, square…").
No right answer. It is the jigsaw/pattern strength turned into creation, and it
is cheap to build on the existing tiles.

### E. Words

**E1. Missing letter is now the odd one out.** Missing word is typed, Number words
can be typed, but Missing letter is tap-a-letter. Offer type-the-letter as the
default with the A–Z keys, choices as the support option, matching the rest.

**E2. Sentence bank is small (14).** Fine for a first release, but it will be
exhausted in one sitting. Add a second bank around a second scene (bath time, bed
time, the garden itself) using the same 24 symbol words, and let the parent add a
whole sentence with a gap word in Grown-ups ("Arthur likes TRAINS."), since custom
words already exist for Missing letter.

**E3. Word order at 3 words is a good entry; escalate to 5–6 word sentences** in
the second bank, and allow "Show me" to read the target sentence once (already
present as Hear the sentence). Fine as is.

### F. Colour Blocks

**F1. Keep it.** The arithmetic panel, per-row prospective sums and the worked
example on a clear are exactly the approved brief and they hold up. Two small
things: the row-sum badges on the right of the board are small (11 px text at
iPad width) and could be a little larger, and the "Hold: faster" label on the down
button reads as an instruction rather than a name; "Down" with a small "hold" hint
underneath is clearer.

**F2. Later, not now:** squares valued 1–3 (already listed as a later option) is
the natural next step once Count reaches 100, because it lets a row show 12 or 15.

### G. Layout and interface

**G1. iPad landscape puts Nook a long way from the action.** Nook sits in a left
column with the speech bubble above it; on the Add screen at 1024×768 the bubble
is 400 px from the answer buttons. Since the bubble now carries feedback, it
should be near the answers: on landscape, move the companion block under the
activity title (between the instruction and the task), left-aligned, so the bubble
is where the eye already is.

**G2. Words page is very tall on iPad portrait** (word bank, textarea, Enter, then
the keyboard). The textarea is a full-width two-line box for a one-word answer;
make it a single-line input the width of the longest bank word, put Enter beside
it, and the keyboard comes up 150 px. Also "Use device keyboard" sits alone on a
row; group it with the Enter row.

**G3. Two "Choose" controls.** "Choose a puzzle" (header) and the activity pill
("Choose any number", "Pick any sum") now do the same thing. Keep the pill, which
is contextual and next to the activity, and demote the header button, or make the
header button the level picker (Count level, Add level, Pattern level) and the pill
the item picker. With levels arriving in three activities, a single "Level" control
in the header is the cleaner split.

**G4. Hub card copy.** "Picnic numbers, missing words and patterns to make" is
still right. Add a third card later only if a third world appears; do not add a
"Content and answers" card, the details link is the right place for it.

**G5. Sound button label.** "♪ Sound off" is the state, not the action, and reads
as an instruction to switch off. "Sound: off / Sound: on" or an icon with a slash
removes the ambiguity.

**G6. Nook's name tag "HELLO, I'M NOOK" wraps to two lines at 768 px** ("HELLO, I'M
/ NOOK"). Either allow more width or shorten to "NOOK".

**G7. Status line under the task duplicates the bubble** in every activity. With
feedback moving into the bubble (A1), the status line should carry only the
instruction ("Tap their number.") and the live-region text for screen readers,
visually smaller.

### H. Things not to do

- No timers, per-answer speed-ups, "3 in a row" streak effects or star ratings,
  even for the new levels.
- No automatic level promotion. Levels are chosen, and Next advances within a
  level; the parent or Arthur changes level.
- No new characters. Nook's bubble is the feedback channel.
- Do not let counting to 100 mean 100 individual apples on screen.

### I. Suggested build order for Sonnet (after Jof's review)

1. Feedback: Nook bubble carries success and failure; encouragement bank; voice
   clips; duplicate lines removed (A1, A2, G7).
2. Count levels 1–6 with the tens-and-ones tray and keypad answers (B).
3. Take away + Add levels sharing the tray (C1, C2).
4. Pattern levels 8–13 (D).
5. Layout: landscape companion placement, compact word input, level control (G1–G3).
6. Missing addend, make-your-own pattern, second sentence bank (C3, D1, E2).

---

## Pass 2: Codex (gpt-6-astra)

_Produced by `codex exec` in read-only mode against the same commit, with Pass 1 and
the five screenshots as input. Unedited apart from relative links._

The approved directions hold up. Prioritise clearer feedback, quantity understanding and arithmetic breadth. The main implementation risk is treating new levels as larger range values: the generators, views and restoration logic currently assume small, tightly coupled puzzles.

Reviewed the supplied screenshots and local code; live-page retrieval failed. No files changed.

### Responses to Pass 1

- **A1 — Amend:** Add warm, factual success feedback to Nook, retain the completed mathematical model beside the task, and announce success once; deterministic wording is reasonable but not an established Arthur preference.
- **A2 — Agree:** One neutral retry plus one useful hint is enough; “Whoops” is optional.
- **A3 — Amend:** The diagnosis is wrong for Patterns and Missing word: Patterns highlights the unit; Missing word toggles pictures and already plays a sentence with “blank”; scaffolds must also work silently.
- **A4 — Disagree:** Collecting completion apples adds a reward-like target without evidence Arthur needs it; omit session tracking.
- **B1 — Amend:** Use the proposed ranges, but visibly establish that one ten-group contains ten apples before introducing compact representations; avoid automatically collapsing objects.
- **B2 — Agree:** Count tens, then ones, with a visible running total and optional speech; each group must count only once.
- **B3 — Disagree:** Numeral choices still test quantity matching above 20; offer typing independently of level rather than requiring extra input work.
- **B4 — Agree, later:** Reuse the quantity representation, but showing the numeral already lets Arthur answer through number-word knowledge alone.
- **B5 — Amend:** Preserve the entry activities while allowing quantity arrangements and feedback to improve.
- **C1 — Amend:** Put removed apples in a clearly separated “taken away” area; fading within the remaining group risks counting them again.
- **C2 — Amend:** Include zero and taking everything away; explicitly separate subtraction without crossing ten from examples such as `12 − 5`.
- **C3 — Agree, later:** Missing-part problems are useful, but need their own unknown-position model and clues.
- **C4 — Agree:** Doubles and Make ten offer focused arithmetic practice at modest effort.
- **C5 — Agree:** Keep the entered answer inside the equation and retain the completed equation.
- **D ladder — Amend:** Add longer repeating units and multiple gaps first; growing groups, symmetry and number sequences need distinct rules and representations, not an assumed steadily harder ladder.
- **D level 10 — Disagree as specified:** Red versus blue circles makes colour the only distinguishing cue; add another visible attribute.
- **D1 — Defer:** Creative pattern play is worthwhile, but editing, deletion, length limits and readback make it more than a cheap tile reuse.
- **E1 — Amend:** Offer typing without changing the established default merely for consistency; letter choices already support the task.
- **E2 — Amend:** More built-in sentences are straightforward; custom sentences need gap selection, plausible distractors and handling for missing pictures and local speech.
- **E3 — Amend:** Current sentences already have four words; add longer ones later and preserve stable tile positions.
- **F1 — Amend:** Keep the game and improve labels, but fix the visibly stretched pause button first.
- **F2 — Disagree with the dependency:** Counting to 100 does not establish readiness for squares worth different amounts; defer this separately.
- **G1 — Amend:** Bring feedback near the response area; moving the whole companion above the task could make the long screens worse.
- **G2 — Agree:** Compact the input and actions, but use a stable width that accommodates longer words rather than sizing to the expected answer.
- **G3 — Amend:** Use an activity-local level control plus item chooser; a distant header control is less clearly associated with the current task.
- **G4 — Agree:** Keep the hub focused on the two approved games.
- **G5 — Agree:** “Sound: off/on” communicates state more clearly.
- **G6 — Agree:** “Nook” is sufficient.
- **G7 — Amend:** Remove redundant visible feedback while retaining one reliable live announcement and useful instructions near the controls.
- **H — Amend:** Keep the constraints, but banning level advancement through Next changes current Patterns behaviour; offer explicit “More like this” and “Next level” actions.
- **I — Disagree with the ordering:** Fix navigation, persistence and compact feedback placement alongside the first features; deliver small-number subtraction before the full counting-to-100 representation.

### Additional findings

1. **Sequential answers can bypass the quantity goal.** In [learning.js](../public/fireworks/little-patterns/learning.js), `countRound()` cycles through ascending numbers; `sumRound()` groups problems by increasing total. Arthur can anticipate answers from sequence. Keep direct number selection, but offer a deterministic mixed order and alternative arrangements of the same quantity. These are valuable before larger numbers.

2. **A larger range would currently produce incorrect displays.** In [garden.js](../public/fireworks/little-patterns/garden.js), `frame()` creates only five or ten pockets, even for a larger target. Addition draws every apple twice across its parts and combined group. `typePad()` truncates to two digits, so it cannot accept **100**. Count has no typed-answer path, and the keypad/checker and hardware handling are addition-specific.

3. **Levels need independent identity.** `normalisePrefs()` accepts only range 5 or 10, shared across Count, Add and Number words. Preference changes rebuild every activity’s round, potentially discarding unrelated drafts. Store separate activity level, operation, answer mode and round position; rebuild only affected rounds. The picker and selection validation also cap quantities at ten.

4. **Restoration must change with the generators.** Saved rounds are regenerated, then matched using target, operands, sentence text or sequence/gap. An addition and subtraction with the same operands would currently match because operation is absent. Add stable puzzle identity/version and validate grouped counting state, partial gap answers and completion state. Preserve compatible existing saves rather than resetting everyone.

5. **Next behaves inconsistently.** Selected Count quantities continue in sequence, but a selected sum is discarded on Next, returning to the pre-existing sum index. Patterns derives level from `floor(index/3)`, automatically advancing every three rounds; after reaching level seven it repeats only four shape rotations. Separate level from within-level variation before extending it.

6. **New patterns exceed the current data model.** `patternRound()`, `patternView()`, `choose()` and restoration support one `gap`, one shape-string `answer` and one `done` flag. Multiple gaps need selectable, adequately sized slots and partial answers. Growing patterns need visible group boundaries; symmetry needs a stated rule. Ten-bead strings also need deliberate wrapping that preserves reading order.

7. **Success and audio need a shared event path.** Success is separately handled by `choose()`, `checkSum()`, `checkWord()` and `placeTile()`; `header()` resets Nook’s bubble during rendering. Render feedback from round state, but play encouragement only on a new correct-answer event. In [shared.js](../public/fireworks/little-patterns/shared.js), `speak()` explicitly unmutes, so automatic encouragement must check sound state before calling it. Full sentences require matching clips or local fallback; a short clip bank does not automatically cover every equation.

8. **The pause screenshot exposes a concrete CSS defect.** In [blocks.css](../public/fireworks/little-patterns/blocks.css), `.primary` inherits `flex:1`; inside the vertical overlay this stretches “Keep playing” through the available height. Override it there. Keep the quiet pause behaviour.

9. **Protect the response area during layout work.** The screenshots show excessive header space and a particularly long Words flow. Compact these before adding controls; verify both target dimensions remain at least 48 CSS pixels, including narrow-screen apple pockets and future interactive gaps.

### Recommended build order

1. **Feedback and obvious layout fixes:** shared success handling, neutral retries, one announcement, nearby feedback, compact Words input and pause-button repair.
2. **Small-number arithmetic breadth:** subtraction through ten, zero, Doubles and Make ten; separate operation/level state and migrate saves.
3. **Quantity practice:** mixed Count order, alternative arrangements, stronger counting clues, and freely selectable entry levels.
4. **Count to 100:** shared tens-and-ones representation, count-by-ten support, three-digit input and direct level/item selection; reuse for arithmetic through twenty and tens.
5. **Pattern depth:** separate level navigation, richer repeating examples, then multiple gaps; introduce other rule families explicitly.
6. **Later enrichment:** missing addends, higher number words, longer sentences and creative patterns.

---

## Build brief for Sonnet (derived from the approved passes)

Baseline: commit `f264816` or later on main (Mulberry Symbols already in). Keep all
scope constraints. Run the three test files and `node tools/stage-little-patterns.cjs
--check` before every commit; add tests for every new generator and for save/restore
of every new round shape. Small commits, one numbered item each where possible.

**Publishing:** Jof has asked for this build to be deployed by the builder. After
each completed phase, and again at the very end, run the full checks and then
`bash tools/deploy-kpopboom.sh` (production, kpopboom.party/little-patterns/).
Verify the live pages return 200 and match the working tree before moving on.
Never deploy with failing tests or a failing stage check.

### 0. Picture symbols (done, and the rule for new words)

Word pictures are Mulberry Symbols (CC BY-SA 4.0) in `assets/symbols`, mapped by
`WORD_SYMBOLS` in learning.js; see `assets/symbols/NOTICE.txt` and
`docs/little-patterns-content.md`. Widgit Symbols are the intended end state once
Jof has a licence, so keep the symbol layer swappable: one map, one folder, one
notice. Rules for every new word this build introduces (subtraction copy, second
sentence bank, number words to one hundred):

- Pick the symbol from the untracked full release (`assets/mulberry-symbols.zip`,
  index in `assets/symbol-info.csv`), copy it to `assets/symbols/<word>.svg`, add
  the mapping to `WORD_SYMBOLS`, add the line to NOTICE.txt, and regenerate the
  voice clips with `python tools/build-little-patterns-voice.py`. The stage
  allow-list and the symbol test pick the file up automatically.
- Do not use emoji anywhere in the game UI. If Mulberry has no symbol for a word,
  choose a different word rather than a near miss (this is why FLY became JUMP
  and COLD became DRY).
- Count trays, sticks of ten and the take-away area keep the CSS apple; a
  Mulberry `basket` symbol may mark the take-away area if a picture is wanted.
- Pattern beads stay CSS shapes.


### 1. Plumbing first (Pass 2 findings 3, 4, 5, 7)

1. Per-activity state: separate `level`, `operation` (add / take away), answer
   mode and round position for Count, Add and Patterns. Stop deriving Pattern
   level from `floor(index/3)`. A preference change rebuilds only the affected
   activity's round, never other activities' drafts.
2. Round identity: every saved round carries a stable puzzle id including the
   operation and level, plus a version. Existing saves that still match restore;
   others start fresh for that activity only.
3. One success event path: `choose()`, `checkSum()`, `checkWord()` and
   `placeTile()` raise a single "answered correctly" event; feedback renders from
   round state; encouragement audio plays only on that event and only if sound is
   already on (`speak()` must not unmute for automatic feedback).
4. Next stays "another like this" within the current level. Add an explicit
   "Next level" action inside the activity (not the header). Every level remains
   directly choosable from the activity pill's picker.

### 2. Feedback and obvious layout fixes (A1, A2, A3 amended, G2, G5, G6, G7, F1)

5. Nook's bubble carries success: short factual lines that restate the answer
   ("Yes! 2 + 1 = 3.", "Three apples. You found it."), chosen deterministically
   per puzzle. Bubble tint may change to the success green for that round. No
   motion, no timers, no inflation words. Bundle matching voice clips via
   `tools/build-little-patterns-voice.py`; equations need their own clips.
6. Announce success once: keep the completed model beside the task, keep one
   live-region announcement, drop the duplicate visible status line.
7. Wrong answer: one neutral line in the bubble, one useful hint in the status.
   No repeated "try again".
8. Clue button: first tap scaffolds (Add: number-tag the joined apples like
   Count; Missing word: play the sentence with "blank", already present;
   Patterns: outline the unit, already present), second tap outlines the answer.
   Scaffolds must work with sound off.
9. Words: single-line answer input at a stable width that fits the longest bank
   word, Enter beside it, keyboard toggle on the same row.
10. "Sound: off / Sound: on"; name tag "NOOK"; fix the stretched "Keep playing"
    button in the Colour Blocks pause overlay (`.primary` inherits `flex:1`);
    rename "Hold: faster" to "Down" with a small "hold" hint.
11. Keep feedback near the response area on landscape iPad without moving the
    whole companion above the task.

### 3. Small-number arithmetic breadth (C1 amended, C2 amended, C4, C5)

12. Take away: a group, then removed apples move to a clearly separated
    "taken away" area (not faded in place). Equation `5 − 2 = ?` with the same
    answer modes as Add. Include zero and taking everything away.
13. Add and Take away levels: 1 within 5 (default), 2 within 10, 3 within 20
    without crossing ten (10 + 4, 15 − 3), 4 within 20 crossing ten, 5 tens
    (30 + 20, 60 − 20). Levels 3 and up use the tens-and-ones tray from item 16.
14. Picker sets: "Doubles" (1+1 … 5+5) and "Make ten" (9+1 … 1+9).
15. Typed answers stay inside the equation slot; the completed equation stays on
    screen after success.

### 4. Quantity practice and counting to 100 (B1 amended, B2, B3 amended, B4 later; Pass 2 findings 1, 2)

16. Tens-and-ones tray: a complete ten-frame becomes a stick of ten, but only
    after the level has shown one ten-frame filling up, so a stick is visibly ten
    apples. Never auto-collapse mid-count. `frame()` must render any target,
    not only five or ten pockets.
17. Count levels: 1 (1–5, five-frame), 2 (1–10, ten-frame), 3 (11–20), 4 (tens
    only to 50), 5 (21–50), 6 (51–100). Levels 1 and 2 unchanged. Numeral choices
    remain available at every level; typing on the keypad is an option at any
    level, not forced by level. Keypad accepts three digits.
18. Count with me at levels 3+: tens first ("ten, twenty…"), then ones, each
    group counted once, running total in the tag, optional speech.
19. Mixed order: a deterministic non-sequential order for Count targets and for
    sums, so answers cannot be anticipated from the sequence; keep direct
    selection. Alternative arrangements of the same quantity at levels 1–2.
20. Number words to ONE HUNDRED reuse the tray (later in this phase).

### 5. Pattern depth (D amended; Pass 2 finding 6)

21. Data model: multiple gaps, partial answers, per-gap selection, wrapping that
    preserves reading order for ten-bead strings.
22. Levels 8+: longer repeating units and two gaps first (AB / ABC with two gaps,
    ABCDE over ten beads). Growing patterns, symmetry and number sequences come
    after, each introduced as its own named rule with its own hint text, never
    as a silent step in the same ladder. Any attribute pairing must differ by
    shape as well as colour. From level 8 the unit hint text is replaced by the
    clue button's outline.

### 6. Later enrichment (C3, D1, E2, E3, B4)

23. Missing addend (`2 + ? = 5`) as its own level with its own clue model.
24. Second sentence bank (new scene, same 24 symbol words), longer sentences for
    Word order, then grown-up custom sentences with gap choice and distractors.
25. Make-your-own bead string with readback (needs edit, delete, length limit).

### Not in this build

Session progress apples (A4). Level 10 as first written. Squares valued 1–3 in
Colour Blocks. A header-level control (levels live in the activity). Any
automatic level promotion.


---

## Build record (15 September 2026)

Built by Claude Fable 5.1 from this brief, phases 0 to 6 in order, one commit per
numbered item where possible, deployed after each phase to
https://kpopboom.party/little-patterns/ with the live files verified against the
working tree. Every commit ran the three test files and the stage check first.

| Phase | Commits | Notes |
| --- | --- | --- |
| 0 | (none) | Symbol rule followed: the basket symbol was added for the take-away area with its NOTICE line. |
| 1 | 3549533, 0bc1e76, 3e1d493 | Per-activity levels and operation; versioned puzzle ids with legacy fallback; one success path; Next level inside the activity. Number words got a level so the shared Quantities setting could retire. |
| 2 | 2066fa1, 460cc92, fc594ee, 68f9992, f047332, bc1c15f, 0c5c0b9 | Encouragement bank with chained clips; announce once; hint-only status; two-step clues; one-line Words input; labels and Colour Blocks fixes; bubble beside the answers on wide layouts. |
| 3 | f06e3bd, 3deb49f, 4238928 | Take away with a separate basket; Add and Take away levels 1 to 5 on the tray; Doubles and Make ten (item 15 folded in). |
| 4 | b83c0d7, b69a2bc, 5e66cbb | Count to 100 with tens-first counting and an optional keypad; mixed order and arrangements; Number words to ONE HUNDRED. |
| 5 | 89f6770 | Multi-gap model; repeat levels 8 to 11; Growing, Mirror and Number rules. |
| 6 | b1f03fe, 0a0ff27, 5b158ca, 69c36ff | Missing part level; bath-time bank, longer and familiar sentences; make-your-own bead string. |

Decisions taken where the brief left room (all following Pass 2): the ten-frame is
established before it collapses to a stick; typing is a setting, never forced by
level; each Add operation keeps its own place; a private word or sentence gets the
opener clip only; number beads carry numerals. Tests: 88 passing. Device validation
on the iPad remains a manual step.
