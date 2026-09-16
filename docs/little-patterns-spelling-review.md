# Little Patterns: Missing word (spelling) review

Requested by Jof on 16 September 2026 after the first iPad session with the round-2
build: "Spelling game navigation is too complicated. The principle is sound. But my
instructions and yours and Codex's interpretation were not good enough. Too many
buttons, too much on screen to complete the task of spelling out the missing word."

Two passes each from Claude (Fable 5.1) and Codex (gpt-6-astra), then a fix brief
for Sonnet. **Reviewed and accepted by Jof, 16 September 2026, with two notes**,
folded into brief items 3 and 13: a Clear key beside Delete (established by
Arthur's AAC use), and alignment with the iPad display fixes. Baseline: commit a23709a on main (landscape layout and phonetic keys, 16 September); live at https://kpopboom.party/little-patterns/garden.html#words.

Constraints that still bind: quiet by default; no timers, lives, streaks, rewards or
locked progression; wrong answers neutral and re-tryable; Arthur types the answer
(he spells; typing is the point); Mulberry symbols, no emoji; 48 px targets; nothing
leaves the device; sound is opt-in. New since this morning: the A to Z keys sound
each letter phonetically while sound is on.

---

## Pass 1: Claude

### What is on the screen today (Missing word, iPad landscape)

Counting only what can be tapped or has to be read, to spell one word:

| Row | Contents | Tappable things |
| --- | --- | --- |
| Header | Player, Choose a puzzle, Sound, Grown-ups | 4 |
| Activity tabs | Count, Add, Words, Patterns | 4 |
| Word tabs | Missing word, Missing letter, Word order, Number words | 4 |
| Title and instruction | "Finish the sentence", "Read or listen. The picture is a clue." | 0 |
| Picture and sentence | fish symbol, A FISH CAN ? | 0 |
| Tools | Play sentence, Show pictures | 2 |
| Prompt | "Tap a word to hear it. Type the word that fits." | 0 |
| Word bank | READ, SWIM, SING, each with a ♪ | 3 |
| Typing | label, one-line box, Enter, Use device keyboard | 3 |
| Keyboard | A to Z, Delete, Space | 28 |
| Left column | Nook's bubble, status line, Give me a clue (hidden here) | 0 |

Forty-eight tappable things and five lines of text that say roughly the same thing
("Which word is missing?", "Finish the sentence", "Read or listen…", "Tap a word to
hear it…", and the status line). The task itself needs four things: the sentence,
the three candidate words, the keys, and a way to say "done".

### What the task actually needs

1. Read (or hear) the sentence with its gap.
2. Decide which of three words fits.
3. Spell it on the keys.
4. Know it was right, then move on.

Everything else is support that should be reachable but not on the surface.

### Proposals

**S1. The gap is the answer box.** The gap tile already echoes what is typed ("?"
becomes the letters). The separate one-line input, its label and Enter row are a
second copy of the same thing. Remove the input box from the task area; the letters
go straight into the gap. When the device keyboard is on (a Grown-ups setting), a
visually hidden input carries focus so the iPad keyboard opens, and the gap still
shows the letters.

**S2. Enter lives on the keyboard.** A green Enter key at the end of the key rows
(where a keyboard has it), not a separate row. Delete stays; Space is hidden in
Missing word and Missing letter (single words) and shown only in Number words for
ONE HUNDRED.

**S3. One hearing gesture, no separate buttons.** Tap the sentence to hear it (with
"blank" in the gap); tap a word card to hear it. Drop the Play sentence and Show
pictures buttons and the ♪ marks. The instruction says it once: "Tap to hear. Type
the word."

**S4. Pictures through the clue button, not a toggle.** Give me a clue is hidden on
this screen today and a Show pictures toggle stands in for it. Make the clue button
do what it does everywhere else: first tap shows the three word pictures (the
scaffold), second tap outlines the word that fits. The pictures start hidden, as
approved, and the toggle disappears.

**S5. Word sub-activities move into the picker.** The second row of four tabs
(Missing word, Missing letter, Word order, Number words) becomes a section in the
activity's picker, the same place levels and sentences are chosen, and the pill
names the current one ("Missing word · Choose a sentence"). One row of navigation
on screen instead of two. If Jof prefers the tabs visible, the fallback is to keep
them only in portrait.

**S6. Device keyboard toggle goes back to Grown-ups.** It is already a setting;
the button in the task area duplicates it and is not something Arthur should switch.

**S7. One line of text, not five.** Keep the title ("Finish the sentence") and Nook's
bubble as the prompt ("Which word is missing?"). Drop the instruction line, the
"Tap a word to hear it…" label and shorten the status to the live-region duty it has
elsewhere. The three word cards are the instruction.

**S8. Word cards look like choices, not buttons with decoration.** Three plain
cards, word in the middle, picture above it when the clue reveals it; no music note,
no separate listen icon. Tapping the card hears the word. They stay in a stable
three-column row.

### Resulting screen (Missing word)

Nook and bubble on the left. Title. The sentence with its gap. Three word cards.
The keyboard (A to Z, Delete, Enter). After a correct word: the bubble's success
line, Again and Next. Tappable things: 3 cards + 28 keys + the sentence = 32, with
one row of navigation above instead of two, and no separate typing row.

### Missing letter and Word order

Missing letter already answers by a single tap; apply S3, S5 and S7 only. Word
order is tiles first to last; apply S5 and S7. Number words keeps its typing box
because the word can be two words (ONE HUNDRED); apply S2 with Space.

### Not proposed

No change to the word banks, distractor rules, symbols, or the typed-answer
principle. No auto-advance. No dropping the bank down to a tap-to-fill answer.

---

## Pass 1: Codex

The principle is right: read the sentence, choose mentally, type, press Enter. Simplify around that sequence. The biggest gains are one answer location, fewer navigation controls and one prompt—not fewer letters.

1. **S1 — Amend.** Make the gap the actual, visibly editable input rather than a display backed by an invisible input. This removes duplication while retaining a discoverable place to focus, select and correct text. Keep an accessible label and stable width; long drafts must not push the keyboard around. A–Z mode must not open the device keyboard.

2. **S2 — Amend.** Put Enter beside Delete in a stable keyboard action row. Remove Space from Missing word; Missing letter has no typing keyboard today. Keep Space for typed Number words. Device-keyboard mode still needs a visible Enter control. Preserve deliberate submission; no checking after every letter.

3. **S3 — Amend.** Tapping the sentence text to hear it is reasonable, but tapping its editable gap must only focus editing. Provide keyboard-accessible playback with a clear accessible name. Remove music notes and the separate Play sentence button only with that distinction intact. **Require Sound: on before these less explicitly labelled taps speak:** current direct speech calls can unmute, so removing “Play”/“Hear” cues without changing that behaviour risks unexpected sound.

4. **S4 — Agree.** One “Give me a clue” control: first reveal candidate Mulberry pictures, then outline the answer without filling it. Keep the sentence picture visible throughout. Missing symbols stay absent, without emoji substitutes. This changes the current boolean picture toggle into two-step help; preserve saved picture visibility when migrating it.

5. **S5 — Amend.** Move word sub-activities into the picker in both orientations; do not restore tabs in portrait. Use one clear entry such as “Missing word · Change puzzle”, with activities and sentences directly available inside. Preserve each activity’s draft and place. Remove the duplicate global “Choose a puzzle” button on this screen: it currently opens the same chooser as “Choose a sentence”.

6. **S6 — Agree.** Keep keyboard choice in Grown-ups. In device mode, tapping the gap must reliably reopen the keyboard after dismissal. Changing settings must preserve the draft.

7. **S7 — Amend.** Keep one actionable prompt: **“Type the missing word.”** The picker already identifies the activity, so the large title and second question are unnecessary. Use Nook’s bubble for the prompt and subsequent feedback. Keep one polite announcement path, avoiding duplicate visible retry messages. Any hearing instruction should appear only while sound is on.

8. **S8 — Amend.** Keep three equally styled word cards, with whole-word playback only and no tap-to-fill behaviour. Remove music-note decoration and heavy button shadows. Keep their order stable during a round. Revealing pictures should not move the keyboard; allow long familiar words to wrap without shrinking text or tap targets.

**Additional findings**

- **Visual weight matters alongside button count.** The screenshot gives navigation, sentence tiles, word cards and keys similarly heavy borders. Use plain sentence text around the distinct answer gap, quieter navigation and one consistent letter-key colour. Keep Nook small enough that the sentence and typing remain central.

- **One existing puzzle rejects a valid answer.** `DISTRACTORS.RUN` includes JUMP for “The dog can RUN.” A dog can jump, and the dog symbol does not distinguish those actions. Replace that distractor. `sentencePool()` also cannot guarantee unambiguous familiar-sentence choices; review those combinations separately.

- **Some accepted custom answers cannot be entered on A–Z keys.** Familiar sentence gaps may contain apostrophes, but the keyboard has none. Ensure every accepted answer is typeable without switching keyboard settings.

- **Feedback must work without pictures.** `checkWord()` always suggests looking at the picture after an error, including familiar sentences without one. Use “Try again” while keeping the draft editable. After success, retain the completed sentence and show Again and Next, with no automatic transition.

- **Preserve the input behaviour, not just its appearance.** `typeKey()`, `bindInput()` and hardware-key handling depend on `word-input`; submission depends on `check-word`. Check caret movement, selection replacement, Delete, physical Enter, clue use and player restoration after moving these controls.

- **Retain optional letter sounds.** A–Z input currently routes through `LETTER_SOUNDS`; device input does not. The source describes these as phonics approximations, not verified recordings. Preserve sound-on behaviour without presenting individual key sounds as whole-word phonics instruction.

- **Validate actual usable space.** Check iPad landscape and portrait with browser bars and device keyboard, plus narrow Android screens. Every interactive target needs **48 × 48 CSS pixels**; `min-height:48px` alone is insufficient. Judge success by a complete spelling attempt without scrolling between sentence, answer and keys.

---

## Pass 2: Claude

Responding to Codex Pass 1. Where we now agree, that is the brief.

- **S1 (gap is the input): agree with the amendment.** The gap tile becomes the real
  `<input>`, styled as the dashed tile, with a stable minimum width (the longest bank
  word) so the sentence does not shift, `readonly` plus `inputmode="none"` in A to Z
  mode so the iPad keyboard never opens, and an accessible label. Selection, caret
  and Delete keep working because the existing `typeKey`, `bindInput` and caret code
  simply targets that element.
- **S2 (Enter on the keyboard): agree with the amendment.** A stable action row at
  the end of the keys: Delete and a green Enter, always visible, also in device
  keyboard mode. Space appears only in Number words. Submission stays deliberate;
  nothing is checked on every letter.
- **S3 (tap to hear): agree, with the sound rule made explicit.** Tapping the
  sentence text (not the gap) or a word card speaks only while Sound is on, through
  the same non-unmuting path as the letter sounds. While sound is off the status
  says once "Sound is off. Tap Sound: on to hear it." The sentence text is a button
  named "Hear the sentence"; the cards are buttons named "Hear READ" and so on.
- **S4 (pictures via the clue button): agree.** First tap shows the candidate
  pictures, second outlines the fitting card without filling anything. The sentence
  picture stays visible. A saved `hint:true` migrates to clue step 1.
- **S5 (sub-activities into the picker): agree, both orientations.** The picker for
  Words gets a first section, the four activities, then the sentence or word list
  for the current one, and the pill reads "Missing word · Change puzzle". Drafts and
  places are kept per activity as today. The header "Choose a puzzle" button is
  removed on every activity, not only Words: it opens the same chooser as the pill,
  which is the control next to the task (Pass 2 of the round-2 review, G3).
- **S6 (device keyboard in Grown-ups): agree.** Tapping the gap in device mode
  focuses the input so the iPad keyboard reopens after dismissal; changing the
  setting keeps the draft.
- **S7 (one prompt): agree with a small amendment.** The large title goes; a small
  activity name ("Missing word") stays at the top of the task so the screen is
  identifiable once the tabs are gone. Nook's bubble carries the one prompt, "Type
  the missing word.", and afterwards the success or retry line. The instruction
  line, the "Tap a word to hear it…" label and the visible duplicate retry line go;
  the live region keeps the single announcement.
- **S8 (word cards): agree.** Three plain, equally styled cards in a stable
  three-column row, whole-word playback only, no note icon, no tap-to-fill, long
  familiar words wrap.

Additional findings, all accepted:

- **Visual weight.** Sentence words become plain text with only the gap drawn as a
  tile; navigation and cards lose their heavy shadows. The three-colour A to Z keys
  are part of the approved keyboard and stay; their shadow is reduced.
- **RUN / JUMP.** "The dog can RUN." must not offer JUMP. Use `RUN: ['READ','SING']`.
  Familiar-sentence distractors stay as they are (other familiar gaps, then picnic
  things) but the Grown-ups note should say the gap word must be clearly different
  from the other familiar words.
- **Apostrophes.** A familiar gap word may not contain an apostrophe, since the keys
  have none; `cleanSentence` rejects such a gap (the rest of the sentence may keep
  one).
- **Feedback without pictures.** The retry hint for a sentence without a picture
  reads "Read the sentence once more." and never mentions a picture.
- **Behaviour to preserve** (tests, not opinions): caret and selection editing,
  Delete, physical Enter, hardware letters, clue steps, restoration per player, the
  bundled voice for built-in words and the local voice for familiar ones, and letter
  sounds only while sound is on.
- **Space check.** Every target 48 by 48 CSS px in both dimensions; a complete
  spelling attempt on iPad landscape (about 1024 by 698) without scrolling between
  sentence, cards and keys, and the same on portrait with the keyboard open.

Estimated result: on iPad landscape the Missing word screen is Nook and bubble, the
small activity name, the sentence with its gap, three cards, and three rows of keys
ending in Delete and Enter. Thirty-two targets, one row of navigation.

---

## Pass 2: Codex

- **S1 — Amend.** Agree on the real input, but existing editing behaviour is not automatically preserved: `garden-live.css` hides the readonly caret, and `bindInput()` resets selection to the end after rendering. Require visible editing position, preserved selection and a bounded width; “minimum width of the longest word” alone does not prevent overflow.

- **S2 — Agree.** Keep Delete and Enter together, including in device-keyboard mode; Space only for Number words. Check only on deliberate submission.

- **S3 — Amend.** The sound rule is right; the proposed speech path is wrong. In `shared.js`, `speak(...,{auto:true})` permits **bundled clips only**, so familiar sentences would become silent. Gate deliberate playback on `LP.audio.muted`, then retain local-voice fallback. Keep the input outside the playback button. Show the sound-off explanation after an attempted playback, not as another permanent instruction. Update the settings text, which currently says “Hear” turns sound on.

- **S4 — Amend.** Agree on two steps and `hint:true → 1`. Update restoration to retain numeric steps too. If no candidate has a symbol, the first clue must still offer useful help rather than reveal nothing. Outline the answer without filling it, and announce that clue accessibly.

- **S5 — Amend.** Agree on both orientations and removing the duplicate header chooser throughout Garden. Implementation must remove its unconditional event binding too. `choosePuzzle()` currently captures `currentKey()` once: switching sub-activities inside it must refresh that key and the contents while preserving drafts and restoring focus.

- **S6 — Agree.** Keyboard choice belongs in Grown-ups. The current preference handler already preserves rounds when only `keyboard` changes; retain that behaviour and verify reopening the device keyboard.

- **S7 — Agree.** Use the small activity name as the task heading, preserving the section’s accessible label. Nook carries the prompt and feedback; one live region announces changes. Route empty submissions there too: `checkWord()` currently writes directly to `answer-feedback`.

- **S8 — Amend.** Agree on plain, stable cards and playback only. Explicitly reserve picture space so clues cannot push the keys down; wrapping long words must preserve readable text and target sizes.

- **Visual weight — Agree.** Keep the approved three key colours; reduce shadows and surrounding visual competition.

- **RUN / JUMP — Disagree with treating this as resolved.** The replacement fixes RUN, but other built-in choices need review: “The sun is DRY” is also plausible against HOT with the same sun picture. For familiar sentences, “clearly different words” does not mean only one fits. Require review of the actual three candidates, with a way to replace ambiguous distractors.

- **Apostrophes — Amend.** Restricting new gap answers to A–Z is workable, but rejection needs an inline settings error. `normalisePrefs()` silently filters invalid sentences; tightening `cleanSentence()` alone would silently remove previously saved content, including from Word order. Specify migration explicitly.

- **Feedback without pictures — Agree.** “Read the sentence once more” is appropriate. Keep the draft editable and avoid a second visible retry message.

- **Behaviour to preserve — Amend.** Add focus and selection across clue use, picker closure and settings changes. Test familiar-word playback separately from bundled playback; the `auto` distinction makes that essential.

- **Space check — Amend.** Keep the iPad acceptance criterion, testing both orientations, browser bars, device keyboard, revealed clues and long content. Restore narrow Android coverage from Pass 1. Allow more key rows where necessary to retain 48 × 48 targets.

- **Estimated result — Amend.** The screen description omits the sentence picture and clue control. Its 32-target count also excludes the editable gap and clue button: **at least 34 task targets**, before navigation. Successful spelling without scrolling matters more than the count.

**Prioritised build-brief requirements**

1. **Complete the simplified spelling loop:** one editable gap, three cards, keys with Enter/Delete, one prompt, useful clues, neutral retry, completed sentence and deliberate Again/Next.
2. **Specify sound and focus behaviour:** opt-in playback that still supports familiar text locally; accessible playback separate from editing; preserved draft, selection and player state.
3. **Guarantee answerable content:** audit candidate ambiguity; validate familiar sentences visibly; define migration. Newly missed: `cleanSentence()` truncates at 60 characters *after* validating the gap, potentially damaging or removing it. Native input allows 40 characters while `editText()` allows 500—align validation and entry limits.
4. **Define responsive acceptance checks:** full attempts in both keyboard modes, clues open, long words, success/retry and narrow screens; no lost controls, layout jumps or undersized targets. Include picker navigation and shared Number words regression checks.

---

## Fix brief for Sonnet (derived from the four passes)

Baseline: commit a23709a or later on main. Keep every scope constraint. Run the three
test files and `node tools/stage-little-patterns.cjs --check` before every commit;
one small commit per numbered item where possible; deploy with
`bash tools/deploy-kpopboom.sh` after each phase and verify the live files. Where
this brief and a pass disagree, the brief follows Codex Pass 2.

### A. The spelling loop (Missing word)

1. **Sub-activities into the picker.** Remove the Missing word / Missing letter /
   Word order / Number words tab row from the task. The Words picker (opened from
   the pill) starts with those four as its first section, then the sentence or word
   list for the current one; `choosePuzzle()` must re-read the current key and
   refresh its contents when the sub-activity changes inside it, keep each
   sub-activity's draft and place, and return focus to the task. The pill reads
   "Missing word · Change puzzle" (and the equivalent for the others). Remove the
   header "Choose a puzzle" button and its binding on every Garden activity; the
   pill is the one chooser.
2. **The gap is the input.** The dashed gap tile in the sentence becomes the real
   `<input id="word-input">`, labelled "Missing word", with a visible caret and a
   bounded width (minimum the longest bank word, maximum about twelve characters,
   scrolling inside rather than growing), `readonly` and `inputmode="none"` while the
   A to Z keys are on, `maxlength` 40 with `editText` limited to the same 40 for word
   inputs. Selection and caret are preserved across re-renders of the same round
   (`bindInput` must not jump to the end unless the round changed). Tapping the gap
   in device-keyboard mode focuses it so the iPad keyboard reopens.
3. **Keys with an action row.** The one-line typing row, its label and the "Use
   device keyboard" button go. The keyboard ends in a stable action row of three
   keys: Delete (one letter), Clear (wipes the gap in one tap, no confirmation, the
   draft is not recoverable and nothing else changes) and a green Enter, visible in
   both keyboard modes (in device mode the row shows on its own). Jof's note: a
   Clear key is established by Arthur's AAC use, where wiping everything is easier
   than repeated backspacing; it earns its place on screen because it replaces
   several taps, and it is the only addition to the simplified screen. Space appears
   only in Number words (a four-key row there). Checking happens only on Enter or
   the physical Enter key; an empty Enter is announced through the live region
   ("Type a word first."), not a separate feedback element. Clear is silent and
   announces "Cleared." through the live region only.
4. **One prompt.** The large title and instruction line go; a small heading names
   the activity ("Missing word") and keeps the section's accessible label. Nook's
   bubble carries "Type the missing word." and afterwards the success or retry line
   from the existing single path. Remove the "Tap a word to hear it…" label and the
   `answer-feedback` element; the retry hint goes to the status line as elsewhere,
   and for a sentence without a picture it reads "Read the sentence once more."
5. **Tap to hear, sound-gated.** The sentence words (not the gap) form one button
   named "Hear the sentence"; each card is a button named "Hear READ" and so on. Both
   speak only while Sound is on: check `LP.audio.muted` first, then call the normal
   `speak()` so familiar words still use the local voice (the `auto` path is bundled
   clips only and would silence them). While sound is off the status says, after the
   tap, "Sound is off. Tap Sound: on to hear it." Remove Play sentence, Show pictures
   and the note icons. Update the Grown-ups note that says "Hear" turns sound on.
6. **Clue button, two steps.** Give me a clue is shown on this screen. Step 1 reveals
   the candidate Mulberry pictures inside the cards (space reserved so the keys do not
   move; a card whose word has no symbol keeps its blank picture area); if no
   candidate has a symbol, step 1 instead puts the sentence with "blank" in the
   status. Step 2 outlines the fitting card without filling anything and announces
   "The word that fits is outlined." A saved `hint:true` migrates to step 1; numeric
   steps restore as they do for other activities.
7. **Visual weight.** Sentence words are plain text with only the gap drawn as a
   tile. Three equally styled cards in a stable three-column row, no shadows, whole
   word centred, long familiar words wrapping without shrinking below 48 px targets.
   The A to Z keys keep their three approved colours with lighter shadows. Nook
   stays small enough that sentence and keys are central.
8. **Missing letter, Word order, Number words.** Apply items 1, 4, 5 and 7 to Missing
   letter (choices stay taps) and Word order (tiles stay). Number words keeps a
   typing input with Space in the action row and the same prompt discipline.

### B. Content that must be answerable

9. **Distractor audit.** Replace `RUN: ['JUMP','READ']` with `RUN: ['READ','SING']`
   and `HOT: ['DRY','WET']` with `HOT: ['WET','SOFT']`. Review all 26 built-in
   sentences' actual three candidates against their picture and add a test list of
   "also plausible" words per gap that must never appear as distractors.
10. **Familiar sentences, visibly validated.** A gap word may not contain an
    apostrophe (the keys have none); the rest of the sentence may. Validate after
    trimming to 60 characters, never truncate a validated sentence. The Grown-ups
    form shows, inline on save, each rejected line and why, instead of silently
    dropping it; sentences already saved that now fail are listed once there too.
    Add a note that the gap word must be clearly different from the other familiar
    words, and "The words in capitals in your other sentences are used as the
    wrong answers" so distractor quality is understood.

### C. Checks and acceptance

11. **Behaviour tests.** Caret and selection across clue use, picker close and a
    settings change; Delete; physical Enter and letters; the clue steps and their
    migration; restoration per player; bundled playback for built-in words and local
    playback for familiar ones, each gated on sound; letter sounds only while sound
    is on; Number words with Space; the picker switching sub-activities without
    losing drafts.
12. **Layout acceptance.** With the headless Chrome harness (see the round-2 build
    record) measure Missing word at 1024 by 698 (iPad landscape), 768 by 954 (iPad
    portrait) with a 300 px allowance for the device keyboard when that mode is on,
    and 360 by 640 (narrow Android). A complete spelling attempt (read, hear, clue
    open, type, wrong then right, Next) must not need scrolling between the
    sentence, the cards and the keys on the iPad sizes; every target at least 48 by
    48 CSS px in both dimensions, adding a key row rather than shrinking keys. The
    landscape media block in garden-live.css may then gain Words rules (picture
    beside the sentence, cards beside the clue) that were deliberately held back.

13. **Alignment with the iPad display fixes** (Jof's second note). The Words screen
    is built against the same iPad facts that drove the 16 September fixes, not
    against a desktop preview:
    - The landscape grid in garden-live.css (`@media (min-width:820px) and
      (max-height:840px) and (orientation:landscape)`, commit a23709a) is the
      layout the simplified screen must fit inside: Nook, status and the action
      buttons in the 160 px left column, the task in the remaining width, no
      scrolling at 1024 by 698. The Words rules that were held back (picture beside
      the sentence, cards beside the clue, a wider key grid) are to be designed for
      the new screen, not restored from the old one.
    - Buttons never lay out their contents with CSS grid; use flex, opt out of Safari
      text autosizing (`text-size-adjust:100%`), and size multi-character content by
      length, as the answer pills now do (commits 7434bdd and c8f6634). The new gap
      input, the cards and the Clear / Delete / Enter keys follow that rule.
    - Stylesheet and script links keep their version query so the iPad fetches new
      files; bump it in the same commit as any CSS change to this screen.
    - Acceptance (item 12) is measured with the headless harness at the three sizes
      and confirmed by Jof on the iPad with a photo, as with the round-2 fixes; the
      digit-count and letter-spacing lessons mean a check on the real device, not
      only in jsdom, before the phase is called done.

### Not in this brief

Tap-to-fill answers, auto-checking on each letter, auto-advance, changing the
symbol set, phonics beyond the existing letter-sound approximation, and the portrait
Add levels 3+ scroll (a separate layout item).

---

## Build record (16 September 2026)

Built by Claude Fable 5.1 from the brief above (Jof asked for the build in the
session he had expected to be Sonnet; same brief, same checks). Every commit ran
the three test files and `node tools/stage-little-patterns.cjs --check` first.

| Items | Commit | Notes |
| --- | --- | --- |
| 9, 10 (data) | 5048cee | RUN and HOT distractors replaced; an also-plausible list per gap in the unit test; `sentenceProblem()` gives a reason; `editText` takes the 40-character limit. |
| 1 to 8, 10 (form), 11, 12, 13 | e66f692 | The simplified Missing word screen, the picker with the four Word activities, the Grown-ups inline validation, the behaviour tests, the landscape Words rules and the version bump. |
| Docs | (this commit) | Scope row, this record. |

Decisions taken where the brief left room, following Codex Pass 2:

- A familiar sentence longer than 60 characters or eight words is refused with
  its reason rather than trimmed to fit, so a validated sentence is never cut
  short of its gap.
- On save, the valid sentences are stored at once and the dialog stays open only
  while some lines need a change, listing each with its reason. Sentences saved
  under the older rule (an apostrophe in the gap) are listed once as "saved
  earlier, no longer used" and put back in the box to mend.
- The sentence words form one "Hear the sentence" button; when the gap sits
  mid-sentence the later words are plain text that forwards a tap to that button,
  so there is still exactly one control and one accessible name. The sentence
  container is a group labelled with the sentence ("the blank is hot").
- Missing letter, Word order and Number words make the word tiles, the placed
  sentence and the number-and-word the Hear control (a visually hidden "Hear the
  word:" prefix names it), so no separate tool row remains anywhere in Words.
- With the A to Z keys the gap keeps focus after every key, card tap and render,
  so its caret stays visible; with the device keyboard nothing focuses the gap
  except a tap on it.
- Missing word's status line is empty on entry (the bubble carries the one
  prompt); it carries only Cleared., Type a word first., the sound-off note, the
  clue text and the retry hint.

Headless Chrome measurements (item 12), sentence top to keys bottom, all targets
at least 48 by 48 CSS px, no horizontal overflow:

| Viewport | Before | After | Notes |
| --- | --- | --- | --- |
| 1024 by 698 (iPad landscape) | page 985 tall, span 568 | page 698 tall, span 331 | no page scroll at all; Nook, status and the clue in the left column |
| 768 by 954 (iPad portrait, 300 px keyboard allowance = 654 usable) | span 630 | span 396 | familiar six-word sentence: 407 |
| 360 by 640 (Android) | span 728, scrolled | span 514 | familiar sentence 582; five key columns, six letter rows plus the action row |

Not yet done: confirmation on the real iPad with a photo (item 13, last point).
That is Jof's check before the phase is called done.

### Same evening, from Jof's iPad photos (commit 438a354)

- **Moving on.** After a correct answer the Next button leaves the side column
  and sits full width under the result on every Garden activity (76 px, 60 px in
  landscape). Again and Next level stay in the column. Automatic advance was
  Jof's other option and was not taken: the scope forbids puzzle changes on a
  timer or on success, so Arthur is never moved off a result he is still reading.
- **The gap.** Starts one letter wider than the longest of the three words (at
  least six), grows with the draft to fourteen letters, then scrolls inside. A
  mid-sentence gap keeps its size and the sentence wraps around it; on the iPad
  the words before the gap stay on the first line and the box plus the rest move
  to the next line when they need to.
- **Alignment.** Cards, keys and the Delete / Clear / Enter row share one gap so
  their column edges line up.
- Deployed from a clean worktree of HEAD, because the Feelings task (Codex) was
  editing shared.js in the same working tree at the time; the live shared.js
  matches the commit, not that draft.
