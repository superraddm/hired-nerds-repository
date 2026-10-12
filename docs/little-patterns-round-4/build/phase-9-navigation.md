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

Commit: COMMIT
