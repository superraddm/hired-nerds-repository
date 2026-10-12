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
- Two audiences, two controls (Jof's rule, PROOFING-LOG item 5, phase 7) with Jof's navigation decision (phase 8): a
  child picks the kind of game from the **list under the game's shelf tile** (`menus.js` defines the five lists, Add /
  Words / Patterns / Shapes / Feelings; `shelf.js` draws the list screen on the hub and inside the in-game shelf
  overlay): big tiles, a picture and one name each, one tap, the last activity marked `aria-current`. Never more than
  two levels (shelf, then activity). Count, Paint and Blocks go straight in. No play screen has chips or a picker; the
  pill is always a read-only label (`LPFrame.pill`). Everything that sets difficulty or content is behind the Grown-ups
  hold, in the game's section of the sheet (Levels and puzzles, or Blocks' Pace: `levels` passed to
  `LPShelf.mountOverlay`). No tap on a play screen may reach a grown-ups' chooser.

## File map (current live build)
- `index.html` + `home.css`: the hub. `shared.css`, `shared.js` (players, prefs, settings dialog, modal, audio: music,
  chime, `speak(text|[clips],{auto})` chaining clips through one `Audio` element, `prepareLocalClips` Blob bundle,
  `[data-sound]` toggle, `[data-settings]`, `[data-player]`, `window.LP` API).
- `learning.js`: pure round generators and prefs (`normalisePrefs`, `defaults`), `spokenBank()` (every line the voice
  must say; the voice test asserts manifest keys equal this list), `successLine`, `LETTER_SOUNDS`, `FEEDBACK.retries`.
- `garden.html/.js` + `garden-preview.css` + `garden-live.css`: Count / Add / Words / Patterns. Key ids the tests use:
  `#support`, `#level-strip` (`[data-level]`, `[data-family]`, `[data-word-tab]`), `#speech`, `#activity-title`,
  `#instruction`, `#status`, `#task`, `#help`, `#next`, `#repeat`, `#next-level`, `[data-mode]` (since phase 8 on the
  Count shelf tile and on the list tiles, with `[data-activity]`), `[data-choice]`,
  `[data-key]`, `[data-pad]`, `#check-sum`, `#check-word`, `#word-input`, `[data-word]`, `[data-tile]`, `#go-row`.
  Saved state: `garden-position` (mode, wordTab, indices, selection, levels, operation, patternMode, patternFamily,
  strip:1, spell:1) and `garden-rounds` (round objects with ids `kind:v2:Llevel:op:content`). `restore()` is the
  migration point; keep it backward compatible.
- `feelings.html/.js/.css`, `feelings-data.js` (FEELINGS, WORDS, STORIES, matchRound, spokenBank), `feelings-art.js`
  (the four drawn children, used by Friends and the old Match/Me). Saved: `feelings-v1` allow-list only.
- `menus.js` (phase 8): `LPMenus` with the five lists (activity ids, names, Nook's text-only line, every tile picture
  as inline SVG or the Words drawings; the Friends picture is a copy of the first story's scene, kept equal by a test),
  `last(id)` (the player's last activity, read from each game's own save), `href(id, activity)` and `split(hash)`.
  The hub's list tiles go to `garden.html#add/take`, `#words/letter`, `#patterns/make`, `shapes.html#name`,
  `feelings.html#friends`; each game applies the activity once and drops it from the address. In a game,
  `mountOverlay({ hosts, onMode(id, activity), activity(id) })` plays the page's own games in place.
- `blocks.*` (Colour Blocks): since phase 8 it loads frame.css, nook.css, frame.js, menus.js and shelf.js for the shelf
  button top-left and the overlay (class `lp-frame` on the overlay only; the page itself is not a frame page and
  still scrolls). Player, Grown-ups and the pace select left the play screen; the pace is `LP.prefs.pace`, set in
  Grown-ups' Colour Blocks section (Pace) or Settings. The board pauses while the shelf is open. `studio-lab.html`
  (Paint) links back to the shelf.
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
must not send player data over the network"), so the Me Blob bundle test overrides fetch itself. 198 tests pass after phase 6 (128 before round 4), 203 after phase 7, 209 after phase 8.
Tests that need a grown-ups' chooser open it as a parent would: the shelf, the hold faked with mock timers, then
`#gu-levels` (`grownups(a)` / `parentLevels(a)` in the UI, Feelings and Shapes suites). Tests that switch activity do
it as a child would (phase 8): the shelf button, the game's tile, a list tile (`goTo(a, game, activity)` in the UI
suite, without an activity it taps the marked tile; `pick(a, id)` in Feelings; `shapesMode(a, mode)` in Shapes).
Rewrite tests that target removed chrome; keep their intent.

## Browser screenshots and layout checks
Serve: `node tools/serve-fireworks.cjs 8787` -> http://localhost:8787/little-patterns/ (and the LAN address printed,
for the S24 and iPad). Headless Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe` with
`--headless=new --remote-debugging-port=<port> --user-data-dir=<scratch dir>`; drive it over CDP with Node 22's global
`fetch` + `WebSocket` (see `docs/little-patterns-round-4/mockups/shoot.cjs` for the pattern, the six viewports
phone 412x860 / small 360x740 / land 915x356 / land2 740x360 / ipad 1024x698 / desk 1280x800, and since phase 7 tall
1380x1600 (a tall desktop pane) and ipad-portrait 768x1024; the checks: page
overflow, content clipped inside the task card, truncated labels, answers overlapping Nook; add a 44x44 touch-target
check; since phase 8 also list tiles under 120 px tall, and a list inside a game whose shelf button is not exactly
where the game's is; Blocks scenarios carry `scroll: true` because that page scrolls). Headless Chrome on this PC reports prefers-reduced-motion: reduce; emulate `no-preference` to see motion.
Seed test state from the hub page, not the game page (pagehide saves overwrite localStorage). Since phase 6 the
layout harness also fails on any uncaught exception or unhandled rejection, and a scenario can wait for a state with
`until: '<selector>'` (used for the sad performance's breath). `serve-fireworks.cjs` serves the phase-1 character
sheet and texture bench read-only at `/_nook-character/` for the iPad. Kill only the headless
chrome you started (Jof's own Chrome is running). Put profile dirs in a scratch folder, never under docs/.

## Reporting
Each phase writes `docs/little-patterns-round-4/build/phase-N-<name>.md` with what was built, test counts, screenshots
(PNG files beside it) and anything left open, and ends with the commit hash. Fable reviews between phases.
