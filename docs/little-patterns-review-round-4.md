# Little Patterns review round 4: the focused rebuild (proposal, not yet built)

Started 11 October 2026 from Jof's phone play-testing notes (Samsung Galaxy S24 Ultra, portrait and landscape).
Proposal by Claude Fable 5.1. Reviewer: Claude Opus 5.5, two passes, with a Fable pass between and after.
Jof's instruction (11 October): nothing is built until all review passes are complete. The mockups under
`docs/little-patterns-round-4/mockups/` are static design screens for screenshots; they are not game code and are not
on the deploy allow-list.

## 1. What play testing showed (Jof, 11 October)

1. Nothing fits a phone well in either orientation.
2. Far too much on screen in every game. Each screen must be about one game.
3. Spelling: picking the right word and spelling it is the right path (the player is non-verbal and cannot sound out
   letters, so guessing from sounds is not an option). Help pictures should be ON by default; hiding them is a
   Grown-ups setting for later.
4. Numbers: the Add screen is visually confusing (the two groups, the joined group, the labels). Largest revision.
5. Patterns: excellent, but also too much on screen.
6. Feelings: the most popular game. The player likes to sound out all the feelings, but there is no context or
   structure. Back is not obviously used. Sound is pressed constantly: where it sits, it looks like a game control.
   Either the feeling plays to the end of its recording and returns, or there is an OK / done button instead of Back.
7. Speech is far too slow on a completion line ("That's... right... 3... plus... 2... equals... 5"). Aim: about twice as
   fast, not hurried, just less pausing between words.
8. Feelings and Paint need icons: Feelings a stylised happy and sad round face pair (like theatre masks, but round and
   not emoji); Paint a palette with a few colours.
9. The failure case: the player does not engage, or taps out of the game or the browser even with Guided Access on.
10. New game: shapes and how many sides they have. Played at school, so it should land warmly.
11. Idea: Nook is the one with feelings, and a relationship of trust between Nook and the player carries investment
    across the games.

## 2. Why the old screens fail (Fable's diagnosis from the code)

- The Garden page carries a hub's chrome (brand, player pill, hero heading, six tabs, scene label, bubble, activity
  title, instruction, level strip, pill, choice label, status line, help, next, footer) around a task that needs four
  things: Nook's question, the objects, the answers, and Help / Next. On a 412 px wide phone that chrome alone is a
  screen and a half before the apples appear.
- Add draws the same quantity three times (part, part, joined), so a child counting has three places to count and
  three labels to read.
- Every page has two or three visible exits (Back, Games, the brand link, the hub's doors), all one tap from the play
  area. Feelings puts Back top-left and Sound dead centre under the title, which reads as "the game".
- The success line is a chain of separate clips played one after another through an audio element: each clip carries
  its own lead and tail silence (measured: "three" 0.08 s lead and 0.28 s tail, "equals" 0.30 s lead) and every source
  swap adds load latency. That is the pausing. The recordings themselves are fine.
- Feelings' Me board is an open list with no sequence or finish, so the natural play (tap everything) feels
  structureless, and Back is the only way out of a chosen feeling.

## 3. Education paths this proposal is checked against

- **EYFS statutory framework and Development Matters**: Mathematics ELG (deep understanding of number to 10,
  composition, subitising, number bonds; numerical patterns), Shape, space and measures in Development Matters
  (Reception: select, rotate and manipulate shapes; talk about sides and corners; compose and decompose), PSED
  self-regulation ELG (show an understanding of their own feelings and those of others). Shapes and sides is
  Reception content; counting sides one at a time is one-to-one correspondence applied to a shape.
- **NCETM Mastering Number / Numberblocks guidance**: augmentation for addition ("first, then, now": three, then two
  more), reduction for subtraction, part-whole with the whole visible, cardinality (the last count names the set).
  The new Add screen is a single augmentation picture.
- **Autism-specific practice**: TEACCH structured teaching (clear start and finish, one task per visual field, a
  visible "finished" marker), visual supports and symbol-backed vocabulary (Widgit at school and on the Grid;
  Mulberry here as the licensed stand-in), predictable routine with the same control in the same place, reduced
  visual load, no surprise sounds, motor planning respected (large targets, no drag required). A colour-grouped
  feelings vocabulary (calm, excited, worried, angry groupings, as used by common regulation programmes in UK schools)
  informs how the ten feelings are arranged, without borrowing any programme's artwork or trademarked names.
- **Attention and engagement (Attention Autism style)**: one engaging focus at a time; the character models first and
  the child joins; the character's own reactions are the reward, not stars.
- **AAC and non-verbal learners**: every answer is a tap or a typed word; nothing requires speech; words stay paired
  with pictures until a grown-up decides otherwise.
- **Kept from the scope**: no timers, lost lives, reward economy, locked progression, automatic difficulty change,
  disappointed mascot, or speech gating.

## 4. The proposal (revised after Opus pass 1; see little-patterns-round-4/review-opus-pass-1.md and review-fable-pass-1.md)

### 4.1 One frame for every game ("the Nook frame")
Top bar: a Nook shelf button (left) that opens the game chooser as an overlay; at most two mode chips (Add / Take
away, Sides / Which shape?); one level pill that opens the existing level sheet. Nothing else: no sound toggle, no
gear, no Back, no brand, no footer. Stage: Nook with one speech bubble (the bubble is a button: tap it to hear the
line again), then the task card (objects centred, answers in a fixed bottom row), then a fixed two-slot action bar
(Help left, Next right; Again small on success) with 20 px clearance above the bottom edge. The card never changes
height on success. Phone portrait: Nook above the task. Phone landscape (under 520 px tall): Nook in a narrow left
column, task centre, actions in a right column; Words folds the bubble into the card and uses a 10 × 3 keyboard.
Tablet: Nook larger beside the task. Nothing scrolls at 360×740, 412×860, 740×360, 915×356 or 1024×698.

### 4.2 The shelf and the exits
The hub is Nook's shelf: Nook greeting, eight tiles (Count, Add, Words, Patterns, Shapes, Feelings, Paint, Blocks)
as buttons, and a foot with the sound icon and the Grown-ups button. Grown-ups opens on a 2 s press and hold (ring
after 300 ms, drains on release) and holds player switching, settings (including mute, word pictures, Softer), the
content pages, credits and the K-Pop BOOM! door. In a game the same shelf opens as an overlay with the current tile
marked. Page-level exits are closed: buttons not links, no long-press callouts or context menu, no pull-to-refresh,
Android back opens the shelf. A web manifest lets the games run full screen from the home screen; the setup notes
for Jof cover Guided Access (iPad) and App pinning / Samsung Kids (S24).

### 4.3 Nook with feelings
Nook becomes a vector character with ten feelings plus a greeting, each with its own face and posture, rigged so
pose and idle motion are separate and arms and leaves rotate about pivots. Idle: breathing, a blink, a leaf sway;
off under reduced motion and Softer. Outside the Feelings game Nook uses only calm, happy, excited, proud and
surprised, only in response to play, never to mistakes, leaving or absence. Tapping Nook always gives a small calm
response. Each game has one small Nook pay-off (munching in Take away, holding the shape up, wearing the bead
string). Motion follows the table in Opus pass 1, section 4.

### 4.4 Game by game
- **Count**: unchanged objects, stripped chrome. The question is in the bubble.
- **Add**: one augmentation picture: the first group, a plus sign, the second group as real apples inside a dashed
  outline arriving one by one, the equation under it, three answers. The chosen digit fills the "?"; no separate
  total. Help: count them all with me (one count across both groups), then outline the answer. Levels 3 and 4 use
  two ten-frames and Help completes the ten first (bridging). Take away keeps the approved one-group crossing-out.
- **Words**: Missing word with the three picture cards shown from the start (Grown-ups: "Word pictures: show /
  hide"). Keys end in Delete and Enter; no Clear. Missing letter, Word order and Number words from the pill.
- **Patterns**: as before, with the make-your-own string in the pill and no tab row.
- **Shapes (new)**: "How many sides?": a big shape, each side a 44 px tap target; tapping lights the nearest
  uncounted side and numbers it in tap order; then three number answers. "Which shape?": a shape and three word
  cards. Level 1 regular shapes in varied orientations (triangle, square, rectangle, circle, oval), level 2 adds
  pentagon and hexagon with irregular and rotated examples. No "diamond". A square is never offered with RECTANGLE.
- **Feelings**: *Nook feels...* (ten neutral cards with Nook's face and the word; tap one and Nook performs it full
  screen, says the word and "Nook feels happy"; difficult feelings end with one breath back to calm; then Nook
  returns to the board on its own, with a tick on that card; Done does the same; ticks reset each visit, no counter,
  quiet finish). *How does Nook feel?* (Nook large as the task object; word-only answers; faces as Help; no
  look-alike pairs at level 1). *Friends* (the twenty stories as before). *Me* (the child's own feeling,
  acknowledged without mirroring or fixing: "You feel sad. Thank you for telling me.").
- **Paint and Blocks**: reached from the shelf with the new icons; Paint's home control returns to the shelf.

### 4.5 Speech
An offline step in the voice build trims each clip against its own peak (30 and 50 ms padding, 10 ms fades),
compresses pauses inside whole-sentence clips to about 150 ms, and the game joins success lines with phrase-aware
gaps (30 ms inside a phrase, 150 ms after the opener) at a rate of 1.0 to 1.05. A listening page lets Jof choose
before anything ships. Nothing is decoded on the device at play time; no service is called.

### 4.6 New voice lines (50 clips with the existing Northampton voice; one to two days at the 100-request cap)
Shape names (rectangle, pentagon, hexagon, star), "It's a {shape}!" (9), "A {shape} has {n} sides." (6), "Which
shape is this?", "How many sides?", "Tap each side.", "Fill the ten first.", "Nook feels {feeling}." (10), "You feel
{feeling}. Thank you for telling me." (10), "Nook takes a breath.", the Me replies for Something else and Not sure,
"How does Nook feel?", "How do you feel?", "We said all the feelings.", "We did it!".

## 5. Review passes

- Opus 5.5 pass 1: little-patterns-round-4/review-opus-pass-1.md (34 numbered recommendations).
- Fable 5.1 pass 1: little-patterns-round-4/review-fable-pass-1.md (answers by number; mockups revised and re-shot).
- Opus 5.5 pass 2: little-patterns-round-4/review-opus-pass-2.md (design approved as the build brief; MUST 35 to 43 before Jof sees the screens).
- Fable 5.1 pass 2: little-patterns-round-4/review-fable-pass-2.md (35 to 43 applied and re-shot; 44 to 53 answered).

Amendments from pass 2 folded into section 4: no mute control anywhere on a play screen or the shelf foot (mute is
inside Grown-ups, with a crossed-speaker badge on the shelf only while sound is off); mode chips "Sides" / "Name" and
levels "Shapes 1" / "Shapes 2"; Feelings activities "Nook feels...", "Which feeling?", "Friends", "Me"; the child's
face in Me has a neutral ring; bridging marks the added frame and keeps "Fill the ten first" for Help; groups over
five lay out as rows of five; the shelf overlay is full height; the Nook rig draws the feet outside the pose group
and keeps position, grow and hop on a wrapper element; the layout harness fails on clipped content and truncated
labels as well as page overflow.

## 6. Build record

(Nothing built. Appended after Jof's approval.)
