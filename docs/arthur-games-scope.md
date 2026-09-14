# Arthur's browser games — proposed scope

Status: block-game visual direction approved, 14 September 2026. The approved
static previews are `blocks-preview.html` and `blocks-preview-t.html` in
`public/fireworks/little-patterns/`. User requested a commit of these previews
and similar visual previews of the second game. Gameplay implementation and
publication remain separate steps; the earlier local playable prototype does
not yet implement this scope. The existing deployment script is unchanged.

## Arthur and the design brief

- Five years old, non-verbal and autistic. Enjoys the alphabet, jigsaws and patterns.
- Already spells well, copies or remembers words from videos, and enjoys typing
  wants on Grid for iPad. Do not assume beginning literacy or require speech.
- Sequences numbers well. Counting quantities and understanding arithmetic are
  the learning priorities; the starting level needs to be adjustable.
- Main devices: Android phone in a browser and iPad 5 in Safari. The existing
  fireworks handoff identifies the iPad configuration as iPadOS 16.7.16.
- Two separate games in a small shared hub, on the existing Kpopboom host.

## Shared experience

Quiet by default, no music, flashing effects, countdowns, streaks, lost lives,
automatic puzzle progression, or requirement to answer aloud. Large touch
controls, stable positions, symbols alongside words, colour never the only cue,
and an explicit Next button. Wrong selections remain available, with a neutral
visual hint and unlimited attempts. Optional on-demand device speech; the games
must remain usable without it. Parent controls for difficulty and support.
Preferences and parent-supplied words stay on the device. No accounts, tracking,
external content feed, generative API calls, microphone or video access.

## Game 1: Colour Blocks, with visible arithmetic

Familiar falling-block rules: rotate and position seven four-square shapes in a
ten-column board, complete horizontal rows, and clear them. Original name,
interface, graphics and code; no copied branding, music or artwork. The original
project code can be MIT-licensed, without representing this as clearance of all
possible third-party rights.
Do your best to create an approximation of the Licensed Tetris theme. Original version is https://en.wikipedia.org/wiki/Korobeiniki

### First release

1. **A number on each small square.** Start with `1` per square, so the written
   value corresponds directly to one visible unit. A four-square piece adds four
   units, sometimes distributed across several rows. Numbers stay upright when
   the shape rotates.
2. **Row quantities.** Show an aligned running total alongside each occupied row.
   A full row of ten unit squares totals ten. The landing outline distinguishes
   prospective additions from blocks already placed.
   Approved preview behaviour: show a separate prospective equation for every
   row touched by the landing piece, including incomplete rows. Recalculate
   immediately on movement or rotation. An upright T adds one square to one row
   and three to the next; a sideways T distributes them over three rows, 1/2/1.
3. **A concrete addition example.** When a placement completes a row, show the
   quantity already there and the quantity just added: `7 + 3 = 10`. Match the
   parts of the equation to the two groups visually. Keep the most recent sum
   visible until another completed row replaces it; never interrupt movement
   with a quiz. For multiple simultaneous clears, use the bottommost completed
   row for the worked example and clear all completed rows normally.
4. **At-your-pace default.** Pieces move when tapped. Large Left, Turn, Right,
   Down and Place buttons, landing outline, next-piece preview and one-piece
   undo. Optional very slow and steady automatic descent without acceleration.
   Offer ability to accelerate drop of piece.
5. **A full board is a resting point.** Offer undo or a fresh board. Restart is
   deliberate; it does not happen automatically. Pause on leaving the browser.
6. Add pause function nad Mute function

### Later, only if useful

Numbers 1–3 on individual squares, with row sums that may exceed ten. Row clearing
must still depend on physical fullness; arithmetic should not secretly change
the block rules. A whole-board total is optional later: its larger numbers and
sudden decrease when rows clear may distract from the initial small additions.
Subtraction can be introduced explicitly later using that removal.

## Game 2: Number Workshop, using words and patterns as strengths

Visual revision: the user rejected the minimalist learning-game previews and
requested a more playful preschool presentation, informed by the teaching
techniques of Yakka Dee, Hey Duggee, Numberblocks and Alphablocks, with entirely
distinct characters. The revised working title is **Nook's Garden**. See
[the programme review and learning design](arthur-learning-design.md). This
revision does not change the approved Colour Blocks visual style.

Three activities for the first release, with manual progression and two-choice
support that can be expanded to three choices:

1. **Match a quantity.** Match a numeral to 1–5 visible counters in a stable
   arrangement, or put that many counters into a tray. Extend to ten when wanted.
   This is distinct from rehearsing a number sequence Arthur already knows.
2. **Build an addition.** Show two counters and add one more by tapping. Present
   `2 + 1 = ?` beside the three actual counters, then ask for the answer: choose
   from three numbers (default) or type it on a number keypad (parent setting).
   A show-only demonstration remains available as a parent setting. Quantities
   total five or less to begin. No timed response or forced difficulty rise.
3. **Word garden and pattern corner.** Arthur already writes freely on Grid, so
   the games do not duplicate free typing. Instead the word garden holds short
   literacy puzzles in the same picnic theme: finish the sentence (one missing
   word, the picture as the clue; nouns, doing words and describing words),
   find the missing letter in a picture word (parent-supplied familiar words
   join this set), and put the words of a sentence in order by tapping them
   first to last. Number words ONE–TEN are paired with quantities, shown,
   chosen or typed on an A–Z keyboard. Optional Hear it on deliberate tap.
   Provide a small repeating-pattern puzzle activity as a familiar alternative.

Do not build Grid integration, YouTube integration, speech recognition,
automatic ability assessment, a learning dashboard or rewards economy for this
release. This is a play companion alongside his existing communication tools.

## iPad 5 and Android implementation constraints

Apply the findings in `public/fireworks/IPAD5-OPTIMISATION-HANDOFF.md`:

- Small, bounded 2D canvas allocations; no high-DPR full-screen backing store,
  image-layer caches, glow effects, particle systems or background audio timer.
- Render on state changes. No permanent animation loop for static puzzles,
  menus or manual block play. Automatic descent needs only a scheduled step.
- One consistent visible-viewport layout, with controls staying visible through
  browser-bar changes, rotation and opening/dismissing the typing keyboard.
- Native button appearance explicitly reset. Touch targets at least 48 CSS px,
  larger for primary game actions. Do not disable accessibility zoom.
- Independent lightweight static assets; no changes to the fireworks runtime.

## Delivery and validation

Agree this scope before further implementation or publishing. Complete the
numbered block game first; then the quantity and addition activities; then the
typing/pattern corner. Keep work in small batches without image-generation or
runtime API dependencies.

Test actual arithmetic, line clearing, totals after clearing, multi-row placement,
rotation of numbered squares, undo restoring totals and the displayed equation,
and puzzle solvability. Check browser layouts and controls on phone and iPad
viewport sizes, orientation, keyboard, pause/resume and missing device speech.

Before describing iPad performance as verified, perform a real-device pass:
portrait and landscape, browser bars, keyboard open/close, two rotations,
background/foreground and ten minutes of play. Desktop tests alone cannot prove
iPad performance. Publish under a separate path on the existing host when the
scope and release are ready, preserving the existing fireworks game.
