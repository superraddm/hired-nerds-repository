# Build prompt for Opus 5.5: Mike the Mic, Level 1

Paste this into Claude Code opened at the repository root `C:\hirednerds-portfolio`.

This job runs in **two stages with a hard stop between them**. Stage 1 proves the look and feel with renders and one
playable strip, then ends the turn so the owner can judge it. Stage 2, the full build, starts only when the owner says
so, in a later message. Do not begin Stage 2 on your own, however confident you are.

Read, in this order, before writing any code:
1. `docs/mike-platformer/brief.md`: the owner's brief. Its constraints are absolute.
2. `docs/mike-platformer/level-1-design.md`: the approved design. Build exactly this; the numbers in it are the spec.
   Where it says "recommend", use the recommendation: the owner will answer its section 13 questions only after
   playing, so expect a revision pass after Stage 2 rather than asking now. Do not redesign; if something in it cannot
   be built as written, build the nearest faithful thing and record the deviation in NOTES.md.
3. `docs/mike-platformer/reference/`: the signed-off Mike puppet (`mike.svg`, with its joint documentation in the
   comment block), his poses preview, the brand lock-ups and the measured colours.
4. `public/fireworks/little-patterns/studio-lab.html` (skim): the house conventions the design refers to.

## What you are building

A complete, playable Level 1 of a 2D platformer: Mike the Mic in a rogue machine shop, Sonic pace with Mario
readability, ending in the repair-the-machine boss. Plain HTML, CSS and JavaScript, Canvas 2D, fixed 960x540 logical
resolution, touch and keyboard, iPad 5 Safari as the slow target, no server, no network after load, no accounts.

## Hard rules

- **No real machine-tool brands, logos, model names, colour schemes or recognisable features, anywhere**: not in art,
  names, sounds, comments or placeholder text. Every machine is fictional and abstract, as the design describes.
- **Mike is never redrawn.** Animate `reference/mike.svg` through its named joints (bake a pose atlas if you like, from
  that source, preserving its texture and the lock-up on his head). No face, no mouth, no lip movement.
- **MTDCNC branding exactly as supplied** (`mtdcnc-lockup-red.png`, `-white.png`, `-stacked-white.png`, colours in
  `colours.md`), on title, level card and results only, never on a machine.
- **Fonts:** do not bundle Helvetica Neue; its web-embedding licence is unconfirmed. Use the design's fallback stack
  (Helvetica, Arial, system sans) and keep the CSS so the licensed files can be dropped in later.
- **Sound:** synthesised in the page as the design specifies; no sampled audio, no harsh sounds, off until a gesture.
- **No paid services of any kind.** Everything is code and the supplied assets. There is nothing to spend.

## Where to work

- Runtime files only in `public/fireworks/mike-game/` (replace the placeholder `index.html`). Everything in that
  folder is deployed as-is, so keep sources, notes and tests out of it. Copy the assets you need from
  `docs/mike-platformer/reference/` into `public/fireworks/mike-game/assets/`.
- Level data as JSON in that folder, in the shape the design gives; the engine must load Level 1 from data so Level 2
  can be authored without engine changes.
- Tests in `tools/test-mike-game.cjs` (headless Chrome over CDP, the way `tools/test-messy-studio-lab.cjs` does it,
  needing `node tools/serve-fireworks.cjs 8788`). Screenshots and renders go in `docs/mike-platformer/look/`.
- Notes in `docs/mike-platformer/NOTES.md`: what was built, deviations from the design with reasons, what was measured,
  what was left for a device test. Do not touch any other folder in this repository; it holds unrelated uncommitted
  work. Do not commit, push or deploy.

## Stage 1: prove the look and feel, then stop

The owner wants to see the level before paying for the whole build. Nothing in this stage is throwaway: every render
comes out of the real renderer, drawn from the real Level 1 data, so Stage 2 continues from these files.

Build, in this order:

1. **Engine core**: fixed step, input (keyboard and the design's touch layout), tile collision, camera follow with the
   design's look-ahead. Prove the jump numbers from design section 3 with a test.
2. **The puppet**: Mike's states and joint animation from the SVG (idle, run cycle, jump, land, hit, camera, fix), the
   pose atlas, the head turn. Render a pose sheet.
3. **The renderer and art**: tiles, the three parallax layers, the HUD, and the visual design of every Level 1 hazard
   and pickup as static art with its tell in the idle state (spitter, spindle arm, belts with arrows, service pit,
   coolant jet, clapper jaws, the service bench and recipe board, the Tangled Turner arena with its three sockets and
   console, the SD card, parts, lubricants, control units). Behaviour is not needed yet; the look is.
4. **Level 1 geometry from data**: all ten sections placed as the design's section 7 table specifies, with hazards
   and pickups sitting where they belong, so that scenes can be framed anywhere in the level.
5. **Scene mode**: `index.html?scene=<name>` draws one still frame of the real level at a named spot, with Mike posed
   in it, no simulation running. Provide at least these scenes: `title`, `s1-start`, `s2-belts`, `s3-camera-alley`
   (with the slow-motion screen effect on and the meter half spent), `s4-stores` (with the distant boss silhouette),
   `s5-arm-gate`, `s6-coolant-loft`, `s7-belt-run`, `s8-clappers`, `s9-bench`, `s10-boss-idle`, `s10-boss-repair`
   (Mike mid-Fix at a socket, a spindle sweeping), `results`, `poses` (the Mike pose sheet), `hazards` (every hazard
   and pickup on one sheet with its name).
6. **One playable strip**: `index.html?section=1` runs section 1 (Clocking in) for real: run, jump, the shelf, the
   pickups collected, the camera meter visible but with nothing to slow. This is so the owner can feel the pace and
   the tile scale, which no still can show. No hazards need to behave yet.
7. **Captures**: extend the harness to screenshot every scene at 960x540 and at the iPad landscape and phone landscape
   window sizes for `s1-start` and `s10-boss-idle`, and to capture a strip of eight frames of Mike running and
   jumping in section 1. Write them all to `docs/mike-platformer/look/` and build `docs/mike-platformer/look/index.html`,
   a plain contact sheet that shows every capture with its name, largest first, so the owner opens one file.

Then **stop**. Write the Stage 1 section of NOTES.md: what to open, what each render shows, the jump numbers measured,
any deviation, and the questions you would put to the owner if you could (the design's section 13 already lists his;
add only new ones). End your turn with a short message pointing at the contact sheet and the playable strip URL. Do
not start hazards, the boss, sound or the remaining sections.

## Stage 2: the full build (only when the owner says go)

The owner will reply with what he likes, what to change, or nothing to change. Apply his changes first and keep the
scene mode working throughout, so the same contact sheet can be regenerated at the end.

1. Hazards and pickups as reusable behaviours with the design's timings and tells. Test each in isolation.
2. Level 1 playable end to end, section by section, checkpoints, the service bench and recovery dispenser.
3. The boss: phases, sockets, held Fix, transitions, the win moment, results.
4. Title, pause, instructions, save, sound and music.
5. Performance pass against the iPad 5 budget in the design; the `?lab=1` read-out; the deterministic `?demo=1` run
   that sets `body[data-done="1"]` only after winning.
6. Full test run covering the design's section 11 list: jump heights and ranges, coyote and buffer, conveyor take-off,
   the three required camera crossings, camera depletion and cooldown, hit immunity, pit respawn, cancelled repair,
   missing-parts recovery, zero-life continue, no duplicate scoring, save and reload, completion with minimum
   inventory; zero console errors; zero post-load requests; screenshots of start, each gate, every boss phase and
   results at desktop, iPad landscape and phone landscape sizes. Regenerate the contact sheet.
7. The Stage 2 section of NOTES.md, and a list of what the owner should check when he answers the design's section 13
   after his first play.

Work autonomously within the current stage until it is done. If the owner must decide something, list it in NOTES.md
and choose the design's recommendation meanwhile.
