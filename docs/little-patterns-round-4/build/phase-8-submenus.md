# Round 4, phase 8: the lists under the shelf tiles (Jof's navigation decision)

Built by Opus 5.5 on 12 October 2026 for Fable's review, from Jof's decision of the same day. Local only: nothing
deployed or pushed. No voice clip was rendered, trimmed or changed; the lists' lines are text only.

## A. What the child sees now

**The shelf.** Add, Words, Patterns, Shapes and Feelings carry the "more inside" marker: a small stacked-cards badge in
the tile's top-right corner (two offset rounded squares) and a dashed inner border, both in a deep shade of the tile's
own colour. Count, Paint and Blocks have neither and go straight in, as before. One deliberate departure: the tiles'
own border colours are too pale to read as a sign (1.45 to 2.0 : 1 against the tile), so the marker uses a darker shade
of the same hue (3.6 to 5.0 : 1, the non-text contrast norm). A screen reader hears "Add (opens a list)". The Grown-ups
credits sheet says it in one line: "Tiles with a corner badge open a list of activities."

**The list (one screen per game, five in all).** A second screen of the shelf, in its look: the sky and sand, Nook
waving with the bubble, the Grown-ups gear at the foot. Top-left is the shelf button, the same button in exactly the
place it sits in every game (the bar copies the game frame's top bar at every breakpoint; the layout harness now fails
if the list inside a game moves it by more than 1 px), with the game's tile picture and name beside it. Nook's bubble
says the game's line, text only (no speaker glyph, nothing plays): "Add or take away?", "Which word game?", "Which
pattern game?", "Which shape game?", "Which feelings game?". Then big tiles, a picture and one name each, in the game's
colour, pressed exactly like the shelf's tiles; at least 120 px tall on phones (measured by the harness at all eight
sizes). One tap starts the activity. The activity the player last played is marked (`aria-current`, the shelf's dark
outline) and focused. Never more than two levels: no list tile opens another list.

| Game | Tiles (picture) |
|---|---|
| Add | Add (two apples, plus, one dashed apple); Take away (three apples on a tray, the last faded and struck through, as in play) |
| Words | Missing word, Missing letter, Word order, Number words (the old level strip's drawings, in the player's letter case) |
| Patterns | Finish the pattern (circle, square, circle and a dashed gap on a string); Make your own (three beads and a plus) |
| Shapes | Sides (a triangle with its sides numbered 1, 2, 3); Name (a circle over three answer chips) |
| Feelings | Nook feels... (the Feelings tile's faces), Which feeling? (Nook's surprised face), Friends (the first story's scene), Me (Nook's face with the neutral ring) |

Phones upright show four tiles two by two and two tiles one above the other (bigger pictures); phones on their side
one row; tablets one row of four (two by two when upright). All pictures come from the new `menus.js`, so the list
looks the same on the hub and inside any game.

**How you get there.**
- On the hub, a badge tile opens its list on the same page through one history entry (`./#add`): the list's shelf
  button, Android Back and Escape all come back to the tiles (focus returns to the tile). A link or reload of
  `./#feelings` opens that list directly. A list tile goes to the game with the activity in the address
  (`garden.html#add/take`, `#words/letter`, `#patterns/make`, `shapes.html#name`, `feelings.html#friends`); the game
  applies it once and drops it from the address, so a reload keeps the save. Back from a game restores the hub's list
  with the activity played since marked (the page-cache restore refreshes the mark).
- Inside a game, the shelf button opens the shelf as before. A badge tile opens its list inside the overlay, **the
  current game's tile too** (it no longer just closes the shelf). A list tile of the page's own game plays in place and
  closes the shelf (Garden's four activities, Shapes, Feelings); another game's list tile navigates with its activity;
  Count, Paint and Blocks behave as before. Android Back inside a list comes up to the tiles. The overlay always reopens
  on its tiles.
- The last activity is per player and needs no new storage: `LPMenus.last(id)` reads each game's own save
  (`garden-position` operation / wordTab / patternMode, `shapes-position` mode, `feelings-v1` mode, a round-3 "match"
  save marking Which feeling?); inside a game the live state is used.

**The play screens.** The top bar is the shelf button and the read-only level label from phase 7, in every activity
of every game. The Add / Take away and Sides / Name chips are gone, and `LPFrame.picker` is removed (frame.js, its CSS
in frame.css and garden.css, every caller); the label is now a read-only `span` for Words, Patterns and Feelings too
("Now: Missing word", "Level: 2 shapes", "Now: Which feeling? 2"). A tap on it only lights it. Switching activity is
the shelf button, then the game's tile. Grown-ups (behind the hold) and its Levels and puzzles choosers are exactly as
phase 7 left them.

**Colour Blocks (two audiences).** The play screen's one-tap Player and Grown-ups buttons and the pace select are
gone; the shelf button sits top-left (the same button, opening the same shelf overlay, so Android Back opens it too).
The board pauses ("Taking a break") while the shelf is open and keys wait. Grown-ups now starts with a Colour Blocks
section: "Now: Wait for me. Blocks move only when tapped." and **Pace**, which opens Wait for me / Very slow / Steady
(Settings keeps its own Blocks move choice too). Everything else is unchanged: the board, controls, celebration,
Nook's row, the foot (its Sound button went too, in the follow-up at the end). blocks.html now loads frame.css, nook.css, voice-library.js, nook-art.js,
icons.js, menus.js, frame.js and shelf.js; the overlay carries `lp-frame` so the frame's button reset holds there
while the page itself still scrolls as before (compared side by side with the old page at 915x356).

**Words around it.** The content pages say Add / Take away, Sides / Name and the four Feelings activities are picked
from the list under the tile (both generators changed, both pages regenerated: wording only). Feelings' grown-ups
chooser and the Settings sentence about levels now say where things live. Cache key `20261012r4p8` on the five pages.

## B. Tests

| Check | Result |
|---|---|
| Node suites: logic 42, UI 89, voice 6, Feelings 34, Nook 16, Shapes 22 | **209 pass, 0 fail** (203 after phase 7) |
| Layout harness, headless Chrome, 87 scenarios at 412x860, 360x740, 915x356, 740x360, 1024x698, 1280x800, 1380x1600, 768x1024 | **9 pass** (8 viewports + joined speech): no overflow, clipping, truncation, overlap with Nook, target under 44 px, list tile under 120 px, moved shelf button or uncaught error (about 16 minutes) |
| `node tools/stage-little-patterns.cjs --check` | passes, 398 runtime files (menus.js added) |

Tests that switched activity through chips or the picker now do it as a child does: the shelf button, the game's tile,
a list tile (`goTo(a, game, activity)` in the UI suite, `pick` in Feelings, `shapesMode` in Shapes); without an
activity `goTo` taps the marked tile, so "carry on as it was" keeps its meaning in the 100-odd places that used
`[data-mode]`. The list tiles carry `data-mode` and `data-activity`. New or rewritten:
- the marker on exactly the five games, on every page, its CSS, and the credits line;
- each hub list: the shelf button first in the bar, the game's name, Nook's text-only line (silent, nothing plays),
  one name and one hidden picture per tile, the last activity marked and focused (seeded saves for all five), every
  tile's address, no list inside a list, 120 px and the press feedback in the CSS (the entry animation never holds a
  transform), a first-time or storage-blocked player marked on the first activity;
- `menus.js` itself: names match the games' own (Feelings' ACTIVITY_NAMES), the Friends picture equals feelings-art's
  scene, `href` and `split`;
- the hub list's history: one entry, Android Back, the shelf button, Escape, a direct link, the page-cache restore;
- the address handoff in Garden and Feelings (Shapes already read `#sides` / `#name`) with every saved place and
  level untouched;
- the in-game overlay: the current game's tile opens its list, a list tile plays in place, another game's navigates
  with its activity, Back inside a list, reopening on the tiles;
- no chips and no picker on any play screen, in every activity of every game, and none in the code;
- the Words, Feelings and Shapes lists in their games (pictures, letter case, drafts kept, marks follow play);
- Blocks: the header, what left and what stayed, the overlay pausing the board and holding keys, Grown-ups' Colour
  Blocks section and Pace (saved per player, and a piece then falls at 850 ms), Player through Grown-ups;
- saved positions surviving phases 7 and 8 (opening every list in the game and on the hub changes no save).

Harness: new scenarios for the five hub lists (marks seeded), two direct links (one in lowercase letters), the list
inside Add, Shapes and Feelings, Blocks, Blocks' shelf, its Grown-ups and its Pace; the phase-7 picker scenarios went.
New checks: list tiles under 120 px, and the shelf button's position in a list inside a game against the game's own.
Blocks scenarios allow a page taller than the window (that page scrolls), never wider.

## C. Screenshots (`phase-8/`)

At phone 412x860, land 915x356 and ipad-portrait 768x1024, file `<viewport>-<scenario>.png`: `shelf` (the markers),
`menu-add`, `menu-words`, `menu-patterns`, `menu-shapes`, `menu-feelings` (the five lists on the hub, each with a seeded
last activity marked: Take away, Missing letter, Finish the pattern, Name, Friends), `add` (Add in play: the shelf
button and the label, no chips), `blocks` (Blocks' new header); and two extra, `menu-over-add` (the Add list inside the
game, Take away marked) and `levels-blocks` (Grown-ups' Pace for Blocks). 30 PNGs, all looked at.

What looking caught, and was fixed before this report: upright phones left a wide empty band under two-tile lists
(two tiles now stack full width with bigger pictures); the Words drawings were 4 to 7 px too wide for landscape tiles
at 740x360 (smaller there); the selected tile's outline nearly touched its neighbour in landscape (wider gap); on an
upright iPad the **shelf itself** (phase 7's layout) left a band of about 170 px between its two rows of tiles, because the rows
stretched while the tiles stop at 190 px (tablet rows now stop at 190 px and sit together); the Pace buttons were
ragged widths (now full width). One fault found in code by looking at the CSS: the tiles' entry animation held its end
state, which would have cancelled the press feedback on the list tiles; it now never holds a transform, and a test
guards it.

## D. Left open

1. **Blocks' "Sound: on" button** is still a one-tap mute on Blocks' play screen. Under Jof's rule sound is a
   grown-up setting (it is in Settings, and no frame game has a play-screen mute), but the brief said to keep Blocks
   otherwise unchanged, so it stays. Jof's call; moving it is one line of HTML and its test.
2. **The marker's colour** is a deeper shade of each tile's hue rather than the tile's border colour, which is too
   pale to read as a sign (about 1.5 : 1). If Jof wants it lighter, `--tile-deep` in frame.css is one value per tile.
3. **Other games' tiles inside a game** open their list in the overlay before going there (so "reopening a game from
   the shelf lands on its list" holds everywhere), where the brief's "other tiles navigate as now" could be read as
   going straight to the page. Count, Paint and Blocks do navigate straight away.
4. **Android Back inside a list in a game** comes up to the tiles and uses the overlay's one history entry, so the next
   Back leaves the game (as Back did with the overlay open in phase 7). On the hub a list has its own entry.
5. The lists are silent, as asked (Nook's line is text only and the tiles do not say their names). Spoken tile names
   or a spoken "Which feelings game?" would be a short voice job.
6. Device check outstanding: DEVICE-TEST.md has three new lines (the lists, the marked activity and the switch in a
   game, Blocks' shelf button and Pace), for the S24 and the iPad held both ways.

Commit: 996c32e (996c32e1fe5c4a4f42c32bde8ad4eeade1eeed83), with this line added in the commit that follows it.

Follow-up (left-open item 1, at Fable's request): Blocks' one-tap "Sound: on" button is gone from its play screen too; sound for Blocks is the same device-wide Grown-ups setting as every page (the crossed-speaker badge on the shelf when off), and the two Blocks tests that clicked it now set sound through Grown-ups (209 node tests pass; layout harness 9 of 9).
