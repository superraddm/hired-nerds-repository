# Round 4, phase 7: fixes from Jof's proofing

Built by Opus 5.5 on 12 October 2026 for Fable's review, from `PROOFING-LOG.md` items 1 to 6 (its new Status column
says what was done for each). Local only: nothing deployed or pushed. No voice clip was rendered, trimmed or changed.

## A. Feelings on tall and narrow panes (items 1, 2, 3)

Both of Jof's panes were reproduced before any change: at 1380x1600 the performing Nook was 1150 px wide in a 954 px
card; at 768x1024 the board's cards were 74 px wide and SURPRISED, DISAPPOINTED and FRUSTRATED were clipped. The
harness had never tried either size.

- **The performance.** Side by side (landscape tablets and desktops) Nook's height is capped at 62% of the card's width
  as well as by its height (`.perform` is a size container), so Nook takes about half the width and the word column
  (`minmax(0,1fr)`) keeps the rest. The word sizes itself to its column (container units, 10.5% of the column, 18 to
  40 px, letter spacing in em) with `overflow-wrap` only as a last resort, so DISAPPOINTED (7.9 em wide) always fits;
  the line and the breath caption wrap. On a portrait tablet or a tall pane Nook stands above its word, as on a phone,
  capped by the card's width and 58% of the height. Phones keep their layouts; their word now scales the same way.
- **The board.** Each card's word sizes itself to the card (11.5% of its width, never above the card's own size). On
  tablets the two rows have a 170 px cap and the board sits in the middle of the card instead of filling it (Me's two
  extra buttons stay with it); a tablet card narrower than 600 px takes the board two by five.
- **The real cause at 768 px was the frame**: every tablet put Nook in a 230 px side column, upright or not, leaving
  the card 480 px wide. Portrait tablets and tall panes (`min-width:760px`, `min-height:521px`, portrait) now put Nook
  (150x180) and the bubble above the task, as on a phone, so the card has the whole width. This also fixed the Words
  keys, which were 38 px wide at 768x1024 (under the 44 px rule), and gives every game a wider card on an upright iPad.
- **Harness**: two viewports added, `tall` 1380x1600 (desktop) and `ipad-portrait` 768x1024 (mobile, DPR 2); every
  scenario runs at all eight sizes. The label check now also covers the performance word and line, the picker tiles
  and their drawings. New scenarios: the happy performance, the disappointed one (sound off, so Nook waits with the
  word showing), the three child pickers (and Feelings' from Me), a tap on the Add and Shapes labels, Grown-ups with
  the game's section in Add, Shapes and Feelings and on the hub, and Levels and puzzles from Grown-ups in all three.

## B. Two audiences, two controls (items 4, 5, 6: the rule, in every frame game)

**The child (one tap, no reading).**
- Feelings, Words and Patterns: the pill is a button that opens the child's picker, `LPFrame.picker` in `frame.js`:
  big tiles, a picture and one name each, the current one marked; no visible title (a screen-reader title only), no
  prose, no close button. A tap on another tile switches; a tap on the current tile, anywhere outside the tiles, or
  Escape closes. Focus starts on the current tile.
  - Feelings: Nook feels... (the Feelings tile's picture), Which feeling? (Nook's face), Friends (a Friends scene),
    Me (Nook's face with the neutral ring Me's cards wear).
  - Words: Missing word, Missing letter, Word order, Number words, each with its drawing from the old level strip
    (`WORD_TILES`, in the player's letter case).
  - Patterns: Finish (the current family as beads with the last one missing) and Make your own.
- Count, Add and Shapes: the pill is a small read-only label of the level, `LPFrame.pill` swaps it to a `span`
  (`role="img"`, "Level: Up to 5") rather than leave a button that does nothing. Drawn where a picture says it: an
  apple for Count and Add, a triangle, square and circle for Shapes 1, a pentagon and hexagon for Shapes 2, the
  family's beads on the Patterns pill. A tap only lights it for 0.6 s. Add / Take away and Sides / Name stay the chips.
- The pill's click is routed by `frame.js` alone; no game attaches its chooser to `#support` any more. A test taps the
  pill and every picker tile in all four Garden activities and finds no level, set or puzzle list anywhere.

**The grown-up (behind the hold).** Grown-ups inside a game now starts with that game's section, right under the
heading: its name, the level now with its picture ("Now: Add, level 2: within 10"; "Now: Which feeling?, level 2: all
ten"; "Now: Shapes 1: triangles, squares, ..."), and **Levels and puzzles**, which opens the game's existing chooser
unchanged, so parents lose nothing: Garden's six levels with their descriptions, Doubles and Make ten, the first and
second group choosers, the Count and Number words numbers, the Words sentence and word lists, the three pattern
families and the 14 old levels; Shapes 1 / 2 with pictures and sentences; Feelings' four activities, levels 1 / 2 and
Choose a story. Closing it closes the shelf too, back to the game, and the label shows the new level. On the hub,
Grown-ups says where levels live ("open a game, tap the shelf button and hold Grown-ups there"). Answer modes, word
pictures, sound, Softer and players were already in Grown-ups. Saved positions and levels are untouched (a test
restores a full save and checks every field is kept).

The content pages say the same (Count, Add, Patterns and Shapes levels "set by a grown-up in Grown-ups (Levels and
puzzles)"; Feelings "four big tiles, one tap", level and story in Grown-ups); both generators changed, both pages
regenerated (wording only). Cache key `20261012r4p7` on the four frame pages.

## C. Tests

| Check | Result |
|---|---|
| Node suites: logic 42, UI 83, voice 6, Feelings 34, Nook 16, Shapes 22 | **203 pass, 0 fail** (198 after phase 6) |
| Layout harness, headless Chrome, 77 scenarios at 412x860, 360x740, 915x356, 740x360, 1024x698, 1280x800, 1380x1600, 768x1024 | **9 pass** (8 viewports + joined speech): no overflow, clipping, truncation, overlap with Nook, target under 44 px or uncaught error |
| `node tools/stage-little-patterns.cjs --check` | passes, 397 runtime files (no new files) |

Tests that used the pill to open the chooser now open Grown-ups (the shelf, the two-second hold faked with mock
timers as the phase-2 gate test does, then Levels and puzzles) in the UI, Feelings and Shapes suites. New: the Words
child picker (four tiles, one name each, drawings, no title, prose or close; current tile, outside tap and Escape
close; drafts kept), the Feelings picker (the four pictures, outside tap, switching), the Patterns picker, the
read-only labels (Count, Add, Shapes: not buttons, apple / shapes drawn, a tap only highlights), no path from any play
screen to a chooser, Grown-ups' game section and a level change updating the label in Add, Patterns, Words, Shapes and
Feelings, the hub's hint, and saved positions surviving untouched.

## D. Screenshots (`phase-7/`)

At phone 412x860, land 915x356, tall 1380x1600 and ipad-portrait 768x1024, file `<viewport>-<scenario>.png`:
`feelings-perform-happy`, `feelings-perform-wait` (disappointed), `feelings-board`, `feelings-picker`, `words-picker`,
`patterns-picker`, `add` (the Add label), `shapes-sides` (the Shapes label), `grownups-add`, `grownups-shapes`,
`grownups-feelings` (the Grown-ups sheet's levels section); and two extra, `grownups-hub` (the hub's hint) and
`levels-shapes` (Levels and puzzles from Grown-ups). 52 PNGs, all looked at.

What looking caught, and was fixed before this report: on a 360 px phone the Patterns and Words picker drawings were
2 to 12 px too wide for their tiles (the Finish beads now stop at four, the tiles' padding is smaller on narrow
phones); in Grown-ups the Shapes pictures stacked one above another (now a row); on the hub the levels hint sat above
the sheet's opening sentence (now under the list); and on portrait tablets and tall panes the performing Nook stood at
the bottom of an otherwise empty card (Nook and its word are now centred together).

## E. Left open

1. **Blocks** (not a frame game, and unchanged by the brief) still has its own one-tap "⚙ Grown-ups" and player
   buttons on its play screen. Under Jof's rule they belong behind the hold; I left Blocks alone because the brief
   keeps it unchanged. Jof's call.
2. The pickers are silent: a tile does not say its name. Saying it would need new clips ("Missing word" and so on),
   and the voices are signed off. If Jof wants spoken tiles, that is a short voice job.
3. Portrait tablets now use the phone arrangement (Nook above the task) in every game. The harness passes everywhere,
   but Jof should see it on the iPad held upright (DEVICE-TEST.md's portrait pass covers it).

Commit: a3fbe41 (a3fbe412c43c6e1ce3e3590343aaf0e4b6c61f28), with this line added in the commit that follows it.
