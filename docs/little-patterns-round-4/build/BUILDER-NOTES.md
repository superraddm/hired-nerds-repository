# Builder notes for the round-4 build (engineering facts, read with BUILD-BRIEF.md)

Repo: `C:\hirednerds-portfolio` (git, branch main; Windows; Node 22; Python 3 with Pillow). Game folder:
`public/fireworks/little-patterns/`. The brief is `docs/little-patterns-round-4/BUILD-BRIEF.md`; the design text is
`docs/little-patterns-review-round-4.md` section 4; the character is `docs/little-patterns-round-4/nook-design-profile.md`
with the signed-off sheet `docs/little-patterns-round-4/codex-review/nook-expression-sheet-final.png` and the identity
master `public/fireworks/little-patterns/assets/nook.png` (560x672). Static mockups of the target layout:
`docs/little-patterns-round-4/mockups/` (frame.css is the layout reference; mock.html?screen=... renders each screen).

## Rules for every phase
- Local only. Never deploy (`tools/deploy-kpopboom.sh`), never `git push`, never touch kpopboom or jofdavies.com.
- Commit at the end of each phase with `git add` of specific paths only (never `git add -A`; the working tree holds
  unrelated uncommitted Mike-game work under `public/fireworks/mike-game`, `docs/mike-platformer`, `tools/*mike*`).
  Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Keep the deploy allow-list honest: every new runtime file goes into `tools/stage-little-patterns.cjs` `files`;
  `node tools/stage-little-patterns.cjs --check` must pass (it validates every src/href in each HTML).
- Line endings: `garden.js`, the tests and the build scripts use CRLF. Patch scripts must normalise; never pass `$(`
  or `$'` through bash double quotes or JS `String.replace` replacement strings. Prefer Python patch files for edits
  to the minified-style one-line-per-function files, and the Edit tool for small unique substrings.
- No runtime network, no runtime TTS, no analytics. Speech is bundled clips only.
- Scope rules in BUILD-BRIEF section 2 apply to every line of code.
- Two audiences, two controls (Jof's rule, PROOFING-LOG item 5, phase 7), with navigation proposal 2 (approved by
  Jof on 12 October, built in phase 9; `PROPOSAL-NAV-2.md`). **The shelf is the only place a child changes game,
  activity or level, and the only place the Grown-ups hold lives.** The shelf shows the six games with choices first
  (Count, Add, Words, Patterns, Shapes, Feelings), each tile a folder preview (`LPMenus.folder`: one glyph per cell, in
  the tile's ink), a thin rule, then Paint and Blocks. Each of the six opens its **sub-menu** on the hub (one history
  entry, `./#add`): a back arrow top-left in exactly the place of the play screens' link (to all games), the game's
  icon and name, Nook's one-line question (text only; Count's "How many apples?" is a clip), the activity tiles (the
  last one marked `aria-current`) and under them the **level tiles** (Count 6, Add 6, Take away 5, Patterns 3 families,
  Shapes 2; Words and Feelings none), the current level marked. One tap starts the game at an address that names the
  activity and the level once (`garden.html#add/take/3`, `garden.html#count/2`, `shapes.html#name/2`); the game applies
  it with the same save the grown-ups' chooser writes and keeps only itself in the address. Never more than two levels.
  **Play screens** have the sub-menus' back arrow top-left (phase 9b, Jof: `<a class="nf-shelf nf-back"
  id="shelf-open" href="./#add" data-menu="add" aria-label="Back to Add">`, icon inline; Blocks `href="./"`, "Back to
  all games"; Garden sets it for the game playing). When the shelf opened the game from that menu (`lp-trail` in session
  storage, the hub as referrer) the arrow is the browser's own Back (shared.js), so it and Android Back are one step;
  otherwise it is the link. The **caption** (`#caption`, `LPFrame.caption`: the game's icon and "Add · Up to 5", a span with role img and
  label "Add, up to 5", no border, background or press feedback, never focusable, taps pass through). No play screen
  has chips, a picker, a pill or a Grown-ups control. **Grown-ups** is held on the hub; held on a sub-menu the sheet
  starts with that game's section (name, "Now:" in the caption's words, Levels and puzzles), and Levels and puzzles
  opens the game at `…#levels` (`LPMenus.levelsHref`), which shows the game's chooser over the play screen. Colour
  Blocks' pace is in Settings (shown on every page now). A game page restored from the page cache reloads
  (`LP.reload`, shared.js), so Back never brings back a page that plays or saves stale state.

## File map (current live build)
- `index.html` + `home.css`: the hub. `shared.css`, `shared.js` (players, prefs, settings dialog, modal, audio: music,
  chime, `speak(text|[clips],{auto})` chaining clips through one `Audio` element, `prepareLocalClips` Blob bundle,
  `[data-sound]` toggle, `[data-settings]`, `[data-player]`, `window.LP` API).
- `learning.js`: pure round generators and prefs (`normalisePrefs`, `defaults`), `spokenBank()` (every line the voice
  must say; the voice test asserts manifest keys equal this list), `successLine`, `LETTER_SOUNDS`, `FEEDBACK.retries`.
- `garden.html/.js` + `garden-preview.css` + `garden-live.css`: Count / Add / Words / Patterns. Key ids the tests use:
  `#support`, `#level-strip` (`[data-level]`, `[data-family]`, `[data-word-tab]`), `#speech`, `#activity-title`,
  `#instruction`, `#status`, `#task`, `#help`, `#next`, `#repeat`, `#next-level`, `#caption` (phase 9), `[data-choice]`,
  `[data-key]`, `[data-pad]`, `#check-sum`, `#check-word`, `#word-input`, `[data-word]`, `[data-tile]`, `#go-row`.
  Saved state: `garden-position` (mode, wordTab, indices, selection, levels, operation, patternMode, patternFamily,
  strip:1, spell:1) and `garden-rounds` (round objects with ids `kind:v2:Llevel:op:content`). `restore()` is the
  migration point; keep it backward compatible.
- `feelings.html/.js/.css`, `feelings-data.js` (FEELINGS, WORDS, STORIES, matchRound, spokenBank), `feelings-art.js`
  (the four drawn children, used by Friends and the old Match/Me). Saved: `feelings-v1` allow-list only.
- `menus.js` (phase 8, rebuilt in phase 9): `LPMenus`, the model of the six sub-menus. `MENUS[id]` (name, Nook's
  line, its clip for Count only, the activity tiles, the level row's group name), `tiles(id)` (the phase-8 activity
  pictures; the Friends picture is a copy of the first story's scene, kept equal by a test), `levels(id, activity)`
  (the level tiles: a short label and an SVG picture at one height, apples, full tens, rows of ten, beads, shapes),
  `levelName`, `last(id)` and `state(id)` (read from each game's own save, mirroring `restore()`), `marked(id, state)`
  (none while a grown-up's practice set or numbered pattern level is on), `caption(id, state)` ({ text, label }: the
  hub's Now line and every game's caption use it), `href(id, activity, level)`, `levelsHref(id)`, `parse(hash)`
  ({ words, level, levels }) and `folder(id)` (the shelf's glyphs, as in the approved mock).
- `shelf.js` (phase 9: the hub only): `mountHub` (all games, the sub-menu screen, history, Escape, the page-cache
  restore that re-marks), `gate` (the hold), `grownups()` (the game's section when held on a sub-menu), `about()`,
  `navigate(url)` (tests replace it), `menu`, `TILES`. The games no longer load it; the in-game overlay,
  `mountOverlay`, `open`/`close`/`setCurrent`/`isOpen` and the `lp:shelfopened` event are gone.
- `frame.js`: `LPFrame.caption({ game, text, label, hidden })` replaced `LPFrame.pill` (and its tap highlight).
- `blocks.*` (Colour Blocks): since phase 9 the header's first child is the plain link to all games; blocks.html loads
  frame.css (for the link's look), blocks.css, shared.css, blocks-live.css, core.js, learning.js, shared.js, blocks.js
  and nothing else (the overlay's scripts and nook.css went). The pace is `LP.prefs.pace`, set in Settings ("Colour
  Blocks move"). Player, Grown-ups, pace and Sound are not on the play screen. `studio-lab.html` (Paint) links back to
  the shelf.
- `voice-library.js` + `assets/voice/manifest.json` + 323 WAV clips since phase 5 (24 kHz 16-bit mono, generated by
  `tools/nook-voice-gemini.py library voice_l1goo4gqobvj`, key in `.wrangler/voice-build/.env`, raw cache in
  `.wrangler/voice-build/gemini-raw/northampton/` (the tool now maps the voice id to that folder; before phase 5 the id
  would have re-rendered everything), backup of the previous library made automatically). `spokenBank()` drives
  what is rendered; new lines must be added to `learning.js` / `feelings-data.js` banks before rendering. After every
  library run, run `python tools/nook-voice-polish.py` (trim and pause compression; the library run undoes it; the
  voice test fails until it is done). `shared.js` starts with `LPVoiceJoin` (the phrase-aware WAV joiner, also
  `require`-able in Node); `LP.audio.rate` (1 to 1.05) and `LP.audio.join` ('auto', true, false).
- Symbols: `assets/symbols/*.svg` (Mulberry, CC BY-SA), `WORD_SYMBOLS` in learning.js; the allow-list adds them.

## Tests
```
node --test tools/test-little-patterns.cjs tools/test-little-patterns-ui.cjs tools/test-little-patterns-voice.cjs tools/test-little-patterns-feelings.cjs tools/test-little-patterns-nook.cjs tools/test-little-patterns-shapes.cjs
node --test tools/test-little-patterns-layout.cjs   # headless Chrome, eight viewports, about twenty minutes
node tools/stage-little-patterns.cjs --check
```
jsdom is in `.wrangler/test-runtime/node_modules/jsdom`. The UI harness `app(t,page,seed,blocked,soundOn)` evals the
page's scripts in jsdom with mocked `Audio` (records `plays`), `speechSynthesis`, and `fetch` that throws ("a game
must not send player data over the network"), so the Me Blob bundle test overrides fetch itself. 198 tests pass after phase 6 (128 before round 4), 203 after phase 7, 209 after phase 8, 212 after phase 9.
Since phase 9 the tests follow the real paths between pages: a page is left (`pagehide`, so the game saves), and the
next page opens in a new jsdom window with the same localStorage and sessionStorage (`app(..., carry)`); `arrive(a,
from, url)` makes `a` drive the new page. `toMenu(a)` checks the play screen's back arrow (an `A` to `./#add`, or `./` for Blocks, "Back to Add") and opens
the menu it names; `toHub(a)` goes on to all games.
Tests that switch activity or level do it as a child would: `goTo(a, game, activity, level)` in the UI suite (the back
arrow to the game's sub-menu, another game's through all games, then an activity tile, a level tile, or without either
the marked one; with both, the activity then the level), `pick(a, id)` in Feelings, `shapesMode(a, mode)` in Shapes. Tests that need a grown-ups' chooser do it as a
parent would: the back arrow to the game's sub-menu, the hold there (mock timers), Levels and puzzles, then the game at
its `#levels` address (`parentLevels(a)`); `grownups(a, game)` returns the hub holding the sheet; `soundSetting(a,
value)` sets sound in Settings on the hub and comes back to the game. Each window records navigation instead of
following it: `visits` (`LPShelf.navigate`) and `reloads` (`LP.reload`). Rewrite tests that target removed chrome;
keep their intent.

## Browser screenshots and layout checks
Serve: `node tools/serve-fireworks.cjs 8787` -> http://localhost:8787/little-patterns/ (and the LAN address printed,
for the S24 and iPad). Headless Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe` with
`--headless=new --remote-debugging-port=<port> --user-data-dir=<scratch dir>`; drive it over CDP with Node 22's global
`fetch` + `WebSocket` (see `docs/little-patterns-round-4/mockups/shoot.cjs` for the pattern, the six viewports
phone 412x860 / small 360x740 / land 915x356 / land2 740x360 / ipad 1024x698 / desk 1280x800, and since phase 7 tall
1380x1600 (a tall desktop pane) and ipad-portrait 768x1024; the checks: page
overflow, content clipped inside the task card, truncated labels, answers overlapping Nook; add a 44x44 touch-target
check; since phase 8 also sub-menu tiles under 120 px tall; since phase 9 a sub-menu that scrolls or a level tile off
screen or clipped, the Grown-ups button over any tile, a caption over the shelf link or off screen, and the top-left
control (the play screens' link, the sub-menus' back arrow) at a different place in any scenario at that size; Blocks
scenarios carry `scroll: true` because that page scrolls). Headless Chrome on this PC reports prefers-reduced-motion: reduce; emulate `no-preference` to see motion.
Seed test state from the hub page, not the game page (pagehide saves overwrite localStorage). Since phase 6 the
layout harness also fails on any uncaught exception or unhandled rejection, and a scenario can wait for a state with
`until: '<selector>'` (used for the sad performance's breath). `serve-fireworks.cjs` serves the phase-1 character
sheet and texture bench read-only at `/_nook-character/` for the iPad. Kill only the headless
chrome you started (Jof's own Chrome is running). Put profile dirs in a scratch folder, never under docs/.

## Reporting
Each phase writes `docs/little-patterns-round-4/build/phase-N-<name>.md` with what was built, test counts, screenshots
(PNG files beside it) and anything left open, and ends with the commit hash. Fable reviews between phases.
