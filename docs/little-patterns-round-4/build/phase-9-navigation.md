# Round 4, phase 9: navigation take two (navigation proposal 2)

Built by Opus 5.5 on 12 October 2026 for Fable's review, from `PROPOSAL-NAV-2.md` (sections A to E), approved by Jof
on 12 October after he rejected phase 8, and the approved mock screens in `../nav-2/`. Where the proposal is silent,
phase 8's behaviour is kept. Local only: nothing deployed or pushed. No voice clip was rendered, trimmed or changed.

## A. What the child sees now

**The shelf.** Count, Add, Words, Patterns, Shapes and Feelings first, then a thin rule, then Paint and Blocks. Each of
the six shows a folder preview instead of its picture: a small 2x2 grid of glyphs (Add and Shapes 2x1, Patterns three
cells) in the tile's own ink, exactly the mock's glyph set (`FOLDERS` in `mockups/mock.html`): Count one, two and three
dots and two bars; Add plus and minus; Words A, a dashed box, two blocks, 3; Patterns two beads, three beads, a plus;
Shapes a pentagon and a hexagon outline; Feelings four round faces (smile, frown, two friends, flat). Paint and Blocks
keep their single icon. Phone upright: two columns, the rule before Paint and Blocks. Phone sideways: four by two, the
rule hidden (as the mock). Tablets: three columns, and the Grown-ups gear sits in the corner beside Paint and Blocks so
the three rows keep their height. The phase 8 badge, dashed border, their CSS, tests and credits line are gone.

**A game's sub-menu (one per game in the first group).** A screen on the hub, one history entry (`./#add`), as in
phase 8. Top-left a back arrow, the same button in exactly the place of the play screens' shelf link (the harness
compares the two at every size), going to all games; the game's icon and name; Nook's one-line question as text
(phase 8's lines; Count's "How many apples?" is its clip, so it shows the speaker and can be heard again); the
activity tiles, picture plus one word, two columns on a phone, at least 120 px tall, the last-played one marked
(`aria-current`, the shelf's dark outline) and focused; directly under them the level tiles, a picture and a short
label, the current one lilac, all visible (they wrap; the harness fails on any that is clipped, off screen or in a
scrolling sub-menu). No prose, no close button. The Grown-ups gear stays at the foot, as on phase 8's lists.

| Game | Activity tiles | Level tiles (pictures) |
|---|---|---|
| Count | none: Count is one game | 1 to 5, 1 to 10, 11 to 20, Tens, 21 to 50, 51 to 100 (apples, a full ten, rows of ten); bigger tiles |
| Add | Add, Take away | Add: Up to 5, Up to 10, Up to 20, Over ten, Tens, Missing (the mock's pictures). Take away: the first five |
| Words | Missing word, Missing letter, Word order, Number words | none (the number-words range stays with the parent) |
| Patterns | Finish the pattern, Make your own | 2 shapes, 3 shapes, 4 shapes (beads); they start Finish the pattern, even when Make your own is marked |
| Shapes | Sides, Name | Shapes 1 (triangle, square, circle), Shapes 2 (pentagon, hexagon) |
| Feelings | Nook feels…, Which feeling?, Friends, Me | none (the look-alike level and the story stay with the parent) |

One tap on an activity starts it at the current level (`garden.html#add/take`); one tap on a level starts the current
activity at that level (`garden.html#add/take/3`, `garden.html#count/2`, `garden.html#patterns/finish/4`,
`shapes.html#name/2`). The game applies the address once and keeps only itself in it, so a reload keeps the save. The
level a child taps is the same saved value the grown-ups' chooser writes (`levels.count`, `levels.add`,
`patternFamily`, the Shapes level), so each shows the other's choice. The level playing now carries on where the child
was (a number a grown-up chose stays); another level, or a level tile while a grown-up's practice set (Doubles, Make
ten) is on, starts it as the chooser does. No level tile is marked while a practice set or one of the fourteen
numbered pattern levels is on: those are the grown-ups'.

Sizes (section E): phone upright, activity tiles 120 px and up (they grow with the screen: about 170 px on the S24),
level tiles about 120 by 80, three to a row; phone sideways, one row of activities, one row of levels under it, Nook
and the question hidden; tablets, two centred columns of activities (760 px wide at most) and a row of levels, larger
again on an upright iPad. Softer and reduced motion keep only short fades on the tiles.

**In a game.** The top-left shelf button is a plain link (`<a class="nf-shelf" href="./">`, its icon in the page) to
all games, on every play screen and on Blocks. The in-game shelf overlay of phases 2 to 8 is retired with its
history entry, `mountOverlay` and the `lp:shelfopened` event; games no longer load `shelf.js`. The pill is a caption:
the game's small icon and "Add · Up to 5", plain text in the top bar, no border, no background, no press feedback, a
span (role img, read as "Add, up to 5") that is never focusable and lets taps through; `LPFrame.pill` and its
highlight are gone (`LPFrame.caption`). The words come from `menus.js`, the same ones the sub-menu uses ("Take away ·
Over ten", "Finish the pattern · 4 shapes", "Number words · 1 to 10", "Name · Shapes 2", "Which feeling? · Level 2").
Feelings hides it during a performance, as before.

**Android Back.** A game adds no history entry, so Back from a game goes to the page before it: the hub, on the screen
the child left (all games, or the game's sub-menu); Back from a sub-menu goes to all games (phase 8's entry). Because
the shelf link adds a history entry, Back can bring a game page out of the browser's page cache after Settings, a player
change or another visit to the same game changed what is saved. A game page restored that way now reloads (shared.js,
`LP.reload`), so it never plays or later saves a stale state; the hub keeps phase 8's restore, which re-marks the
sub-menu.

**Grown-ups.** Unchanged sheet and choosers, but the hold lives only on the shelf now (there is no in-game overlay to
hold it in). Held on a game's sub-menu, the sheet starts with that game's section: its name, "Now:" in the caption's
words, and Levels and puzzles, which opens the game at `…#levels` with its chooser over the play screen (Garden's
Levels and puzzles, Choose the shapes, the Feelings chooser); changing the level there updates the caption at once,
and closing it returns to the game. On all games the sheet says: "Levels and puzzles: tap a game's tile, then hold
Grown-ups there." Colour Blocks' pace (phase 8's Pace in Blocks' own Grown-ups section) is the "Colour Blocks move"
choice in Settings, now shown on every page. Blocks keeps its plain link and loads only its own files again (the
overlay's scripts and `nook.css` went; `frame.css` stays for the link's look).

**Words around it.** Settings, the three choosers, the two content pages (both generators, wording only) and the code
comments say where things live now. Cache key `20261012r4p9` on the five pages (Blocks' too).

## B. Tests

| Check | Result |
|---|---|
| Node suites: logic 42, UI 92, voice 6, Feelings 34, Nook 16, Shapes 22 | **212 pass, 0 fail** (209 after phase 8) |
| Layout harness, headless Chrome, 83 scenarios (87 in phase 8) at 412x860, 360x740, 915x356, 740x360, 1024x698, 1280x800, 1380x1600, 768x1024 | **9 pass** (8 viewports + joined speech), about 16 minutes: no overflow, clipping, truncation, overlap with Nook, target under 44 px, sub-menu tile under 120 px, level tile out of view, Grown-ups over a tile, caption problem, moved top-left control or uncaught error |
| `node tools/stage-little-patterns.cjs --check` | passes, 398 runtime files (none added or retired) |

The tests now follow the real paths between pages. A page is left (`pagehide`, so the game saves) and the next opens
in a new jsdom window with the same storage, as a link does; `goTo(a, game, activity, level)` is the child's way (the
link, the game's tile, an activity or level tile, or the marked one), `parentLevels(a)` the parent's (the link, the
game's tile, the hold, Levels and puzzles, the game at `#levels`), `soundSetting` goes through Settings on the shelf
and back. Tests that relied on switching in place were rewritten to what really happens (for example the caret: a clue
and a settings change keep it; carrying on from the sub-menu opens the page again with the draft kept and the caret at
its end). New or rewritten:
- the shelf: order, the rule (hidden sideways), the glyph previews (one glyph per cell, one ink per tile, no text but
  Words' A and 3), Paint and Blocks' single icons, no badge, border or credits line, in code and CSS;
- each of the six sub-menus with seeded saves: the back arrow (first, same class as the link, "All games", the back
  icon), the name and icon, the question (Count's clip plays; the rest silent), the activity tiles, the level tiles
  (pictures at one height, Take away five), both marks, focus, every activity and level address, the back arrow;
  a new player sees the first activity and level 1, with storage blocked too;
- Count's sub-menu: levels only, apple pictures, the level playing carries on, level 6 starts, the mark follows;
- one tap at a level in every game, and the level tiles and the chooser showing each other's choice (Add, Take away,
  a practice set and leaving it, Patterns' families from Make your own and a numbered level, Shapes);
- the caption: a span, never focusable, role img and its words for nine activities, the game's icon, a tap changes
  nothing, no pill, chips or picker anywhere, its CSS (no border, background or press feedback, taps pass through);
  it updates while the chooser is still open (Count's levels, Make ten with its place, Number words);
- the link on Garden, Shapes, Feelings and Blocks; no overlay; no history entry from a game; a page-cache restore
  reloads a game and not the hub; `shelf.js` only on the hub;
- Grown-ups on each sub-menu: the section first, Now, Levels and puzzles to each game's `#levels`; each game opening
  its chooser there and dropping it from the address; the all-games sheet's line; Colour Blocks' pace in Settings;
- saved positions surviving phase 9 (carrying on through the sub-menus and opening every one changes no save);
- the hub's history, Escape and page-cache re-marking (now the level too); the address handoff with levels, a level
  that does not exist, and the save untouched otherwise; Words' sub-menu (letter case, marks, drafts kept);
- Colour Blocks: the link, the board saved on leaving and back as it was, the pace from Settings moving a piece at
  850 ms; Feelings' and Shapes' frame pages, sub-menus and Grown-ups through the shelf; leaving for the shelf
  cancelling a Feelings performance and clearing Me.

Harness: the overlay, list, label-tap and in-game Grown-ups scenarios went; new are the six sub-menus (Add also with
Take away marked, and one in Softer colours), two direct links to sub-menus, Grown-ups held on Add's sub-menu, each
game's chooser at its `#levels` address (Add, Count, Shapes, Feelings), and the three longest captions. New checks: a
sub-menu that scrolls, a level tile off screen or clipped, the Grown-ups button over any tile or level tile, a caption
over the shelf link or off screen, a clipped caption or level label, and the top-left control at a different place in
any scenario at that size (the play screens' link and every sub-menu's back arrow).

## C. Screenshots (`phase-9/`)

At phone 412x860, land 915x356 and ipad-portrait 768x1024, file `<viewport>-<scenario>.png`: `shelf` (the grouped
shelf with the folder previews), `sub-count`, `sub-add`, `sub-add-take` (Take away marked, its five levels, Up to 10
lilac), `sub-words` (Missing letter marked), `sub-patterns`, `sub-shapes` (Name and Shapes 2 marked), `sub-feelings`
(Friends marked), `add` (Add in play with the caption "Add · Up to 5"), `blocks` (Blocks' header with the plain link),
and one extra, `grownups-sub-add` (Grown-ups held on Add's sub-menu). 33 PNGs, all looked at beside the mocks.

What looking caught, and was fixed before this report: on a tablet the sub-menu's back arrow sat 50 px right of the
games' shelf link (the bar was positioned inside the 900 px shelf; it is now fixed to the window like the frame's top
bar, and the harness compares the two at every size); at 740x360 Add's six level tiles wrapped onto a second row and
the sub-menu scrolled (the landscape tiles now share the row); on a landscape tablet the shelf's bubble sat left of
Nook (Nook now stands first, the bubble beside it, as in the mock); the activity tiles left half an upright phone empty
(their pictures now grow with the screen; Count's levels-only tiles are larger). Tried and reverted: centring the
sub-menu on an upright iPad, because Nook then jumped from the top of the screen to the middle when a tile was tapped;
Nook now stays at the top, as on the shelf (lowered only by the sub-menu's bar).

## D. Left open

1. **Grown-ups lives only on the shelf.** The proposal retires the in-game overlay, which was the only place a parent
   could hold Grown-ups inside a game. I did not add a gear or a hidden hold to the play screen (the approved mock has
   neither, and the phase-2 mock keeps Grown-ups on the shelf); instead the game's section moved to Grown-ups held on
   the game's sub-menu, and Levels and puzzles opens the game with its chooser (the same chooser as phase 8). From
   inside a game a parent now needs one more step (link, tile, hold, Levels and puzzles). If Jof wants a hold in the
   game, the cleanest place would be the link itself (tap for all games, hold for Grown-ups), which I would not do
   without asking: one control with two jobs.
2. **Colour Blocks' pace** left Blocks' own Grown-ups section (phase 8) for Settings ("Colour Blocks move"), now shown on
   every page, since Settings is only reachable on the shelf.
3. **Labels follow the proposal and the tiles**: Take away's fourth level reads "Over ten" (the pill said "Back over
   ten"), Count's fourth "Tens" (the pill said "10 20 30"), Add's sixth "Missing" (was "Missing part"), Count's levels
   "1 to 5" rather than "1–5". The caption uses the same words as the tiles.
4. **Back reloads a game.** A game page brought back from the browser's page cache reloads, so after a visit to the
   shelf Back shows a brief reload. This is the price of never playing or saving stale state; the S24 check is in
   DEVICE-TEST.md.
5. **"What shall we play?"** (the overlay's line) has no screen now; its clip stays in the library untouched (no voice
   changes). The sub-menus' questions stay text only, except Count's, which was already a clip.
6. On arrival from a sub-menu the game does not move focus into the task (a fresh page starts at the top, as a link
   does); phase 8's in-place switch had focused it. Keyboard and switch users land on the link first.
7. Device check outstanding: DEVICE-TEST.md's phase 8 lines are replaced by eight phase 9 lines (the shelf, the
   sub-menus both ways up, one tap at a level, the link and the caption, S24 Back, the back arrow's place, Grown-ups on
   a sub-menu, Blocks).

Commit: 86e76e4 (86e76e4a05be25d02e8f455cb89c9802ce1882f7), with this line added in the commit that follows it.

## 9b. Jof's correction (13 October 2026): back to the previous menu

**What Jof asked.** Inside a game, the top-left button goes back to the previous menu, not to all games: for Count,
Add, Words, Patterns, Shapes and Feelings that is the game's own sub-menu on the hub, with the current activity
marked; for Paint and Blocks, which have no sub-menu, all games. The same in every game, the same back-arrow icon and
size as the sub-menu's arrow, named for the menu it returns to ("Back to Add"); Android Back from a game to match. The
sub-menu's own back arrow still goes to all games.

**What changed.**
- Every play screen's top-left is now the sub-menus' back arrow: the same `nf-shelf nf-back` button, the same chevron
  (`LPIcons.back`, inline in each page), the same size and place (the grid icon is gone from play screens). It is a link
  to `./#count`, `./#add`, `./#words` or `./#patterns` (Garden sets it for the game playing), `./#shapes`,
  `./#feelings`, or `./` for Blocks, labelled "Back to Add" and so on, "Back to all games" for Blocks. Paint's own back
  link already went to all games; its label now reads "Back to all games" too. The hub opens `./#add` on Add's
  sub-menu with the activity played last and the level marked, as a direct link always did.
- **Back and Android Back are the same step.** When the shelf opens a game it leaves a trail in this tab's session
  storage (`lp-trail`: the sub-menu it was opened from, or "" for all games). When the page before the game is that
  menu (the trail matches and the referrer is the hub), the arrow is the browser's own Back (`history.back()`, in
  shared.js), so the history stays one step deep: game, Back, the sub-menu (re-marked by the page-cache restore),
  Back, all games, exactly as Android Back walks it. Otherwise (a bookmark, a reload in a new tab) the arrow is simply
  the link to the game's sub-menu. A game still adds no history entry of its own.
- Grown-ups' Levels and puzzles leaves the same trail, so after a parent's change the arrow returns to the sub-menu
  the parent came from.

**Tests (212 pass, 0 fail; the count is unchanged, the tests changed).**
- The link test is now the back-arrow test: for Count, Add, Words and Patterns (Garden), Shapes, Feelings and Blocks,
  the address, `data-menu`, the label, the class and the icon (the sub-menus' own arrow); no overlay; no history entry
  from a game; the page-cache reload. New: the shelf leaves the trail when it opens a game (Add's Take away, and Blocks
  from all games); a game opened from that menu goes Back (the click is the browser's Back, not a navigation); a game
  opened directly, or from another game's menu, follows the link instead.
- The helpers follow the arrow: `toMenu(a)` checks the arrow and opens the menu it names (the game's sub-menu, or all
  games for Blocks), `toHub(a)` goes on to all games with the sub-menu's arrow, `goTo` changes activity or level from
  the game's own sub-menu (another game through all games), and `grownups(a, game)` holds Grown-ups there. Feelings'
  and Shapes' suites open their own sub-menu the same way. The frame, Blocks, Paint, Feelings and Shapes page tests
  check the arrow and its label.
- Layout harness: the top-left check now compares the icon as well as the place, so every play screen and every
  sub-menu must show the same back arrow in exactly the same spot at each size. Full run: **9 of 9 pass** (8 viewports
  and joined speech, 83 scenarios, about 16 minutes).

**Screenshots.** `phone-add.png` and `phone-blocks.png` re-shot in `phase-9/` (also `land-` and `ipad-portrait-` for
both, so no picture there still shows the grid icon). Looked at: the back arrow sits where the grid icon was, in the
lilac button, on Add and on Blocks.

**Left open.** A game opened directly (a bookmark, a home-screen shortcut to a game) has no menu before it in the
history, so Android Back leaves it as before, while the on-screen arrow opens the game's sub-menu. The device check in
DEVICE-TEST.md covers the normal path (shelf, sub-menu, game, Back, Back).

Commit (9b): 6d66ba9 (6d66ba9d5f7b688d2ff364f92888f4e041a3d7dc), with this line added in the commit that follows it.

## 9c. Two fixes from Jof's S24 test (13 October 2026; PROOFING-LOG items 12 and 13)

**12. The landscape keyboard was cut off on the S24.** With Chrome's address bar and the Android gesture bar showing,
the S24 held sideways leaves about 891x340 CSS px or less, not the 915x356 the harness used, and Missing word's third
key row (U to Z, Delete, Enter) fell below the screen.
- frame.js now marks the page `lp-short` when the visible height (`visualViewport`, the same measure as `--app-h`) is
  under 350 px in landscape. The Garden card then tightens (2 px border, 3 px by 6 px padding, 3 px gaps), the keys are
  36 px tall with 3 px gaps (still at least 44 px wide), the answers 64 px, the typing box and the word models smaller.
  If something still did not fit, the card would scroll inside the frame, never the page (brief item 62); at both new
  sizes nothing needs to.
- Harness: two more viewports, `s24-land` 891x340 and `s24-land-short` 891x320 (mobile, DPR 2), every scenario at
  both; a new check fails on any key, answer, word card, word tile or Enter below the card's bottom or the screen; on a
  short landscape screen a key may be 36 px tall (the coordinator's size), every other target stays 44 by 44.
- What the new sizes caught, all fixed: Missing word (keys below the card at both sizes); at 891x320 Add's tens level,
  Make your own, Number words and the device-keyboard Words screen (5 to 21 px over); and, once Help's models were in,
  the letter boxes for "ONE HUNDRED" at 360x740 and 740x360 (long words now get compact boxes, and the number line
  tightens while they show). Feelings' sound-off performance went 2 px over while Nook breathed when the tighter padding
  applied to every game, so the tightening is now the Garden's only (the keys live there).

**13. Help did nothing visible in Number words** (and step one of Missing letter and Word order only wrote to the hidden
live region). Jof's rule, applied in every game: each Help step changes something visible in the task or in Nook's
bubble.
- Help's words now go into Nook's bubble as well as the live region (`tell` in garden.js, the same in Shapes and
  Feelings' card bubble), for that round only; where a voiced Help line exists ("Count them all with me.", "Look for
  the part that repeats.") the bubble keeps it.
- Number words: step one shows the word as letter boxes with the first letter filled under the typing box, and the
  bubble says "It starts with O and has three letters."; step two shows the whole word faintly inside the typing box
  after what is typed, to copy, and the bubble says "1 is written ONE."; choosing outlines the word; reading (or a
  finished round), Help reads the word.
- Missing letter: step one shows the whole word above the tiles ("The word is CAT. Which letter is hiding?"); step two
  outlines the letter. Word order: step one shows the sentence in order, faintly, above the tiles; step two outlines
  the next tile; placing a word gives the bubble back to the question.
- The audit: Count, Add, Patterns, Shapes and Feelings already changed the task at each step, except Count and Add with
  the keypad, whose last step outlined a choice button that the keypad does not have: their words ("5 apples
  altogether. Type 5.") are now in the bubble. Shapes' last Sides step and both Name steps, and Which feeling?'s two
  steps, now say their words in the bubble too.

**Tests: 218 pass, 0 fail** (212 before). New: Help in fifteen Garden cases (Count, Count with the keypad, Add, Add with
the keypad, Take away, Missing word with pictures shown and hidden, Missing letter, Word order, Number words typing and
choosing, Patterns' families, growing, mirror and number levels) fails if a press changes neither the task nor the
bubble, and checks the bubble carries Help's words or its voiced line; Number words' boxes, ghost, choosing, a long
word and reading aloud; Missing letter's and Word order's models; Shapes' and Which feeling?'s bubbles; the `lp-short`
class from the viewport and its CSS. One existing assertion changed ("has 3 letters" to "has three letters", and the
bubble). Layout harness: **11 of 11 pass** (ten viewports and joined speech, 89 scenarios, about 21 minutes). `stage --check` passes, 398 files. Cache key `20261013r4p9c`.

**Screenshots (`phase-9/`):** `s24-land-words.png` (Missing word at 891x340, all three key rows and Delete and Enter
inside the card), `s24-land-words-numbers-help1.png`, and at phone size `phone-words-numbers-help1.png` (letter boxes),
`phone-words-numbers-help2.png` (the faint word after "TH"), `phone-words-letter-help1.png` and
`phone-words-order-help1.png`. Looked at: the ghost letters sit exactly after the typed ones.

**Left open.** The new Help sentences have no voice clips (no voice changes), so the bubble shows them without the
speaker; recording them would be a short voice job. The 36 px keys on a short landscape screen are below the 44 px
target the harness keeps everywhere else, by the coordinator's instruction; they stay at least 44 px wide.

Commit (9c): f4d7cbb (f4d7cbb5afdbf2ea971e5b82d90f4c8aa81d7c86), with this line added in the commit that follows it.
