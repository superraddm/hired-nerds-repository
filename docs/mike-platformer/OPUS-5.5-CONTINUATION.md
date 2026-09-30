# Emergency continuation ? Opus 5.5

> **Current handover: [CODEX-HANDOVER.md](CODEX-HANDOVER.md), 29 September 2026, 20:30.** Read that first. This document is kept as history.


**Latest authorized work:** Codex implemented the independent review refinements after the owner's instruction to continue. Read [EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md) FIRST for the current checkpoint, changed files, verification and remaining work. This document preserves the earlier design/build history.

Updated 29 September 2026. Read this FIRST if the current agent stops or credits run out.
Written at the user's explicit request before substantial EDM production work. This is the current handover; it supersedes the initial checkpoint and older Level 1 proposals.

## Non-negotiable user direction

**Preserve all styling, mechanics, difficulty and variety of the current Level 1.** Treat it as the locked reference for EDM. Do not simplify it, replace the puppet, redesign its machines, change its boss, expose its hidden repair order, or retune dry movement. EDM adds a different environment and fluid mechanics, not a replacement game.

The current request is to write a thorough EDM level/layout and asset brief, then START building mechanics and designs. A complete six-room campaign level has not been requested as the immediate prototype deliverable. Leave a concrete continuation path rather than suggesting the prototype is finished production.

No paid image or voice generation has been used in this EDM work. No EDM deployment, commit or push has been made. Level 1 was already deployed by Claude on 27 September.

## Current baseline ? already completed by Claude

Read the appended owner revisions in `nightshift-v3-review.md`, especially the afternoon and second owner passes. They are newer than the early conversation summary.

Level 1 has 960 tiles, 20 sectors, 140 shelves, nine checkpoints, 56 optional salvage finds, a hidden life, active pillar drill, moving lift, continuous returning spindles, bolted supports under otherwise floating machinery, two Mill Spine escape steps, differentiated power-up art, salvage milestones and high-score feedback.

The boss ALREADY has nine repairs, three elevations and three fixed learnable orders. Sockets: Drive (941,12), Coolant (948,8.5), Control (955.25,6.5). Holds: 2.2 seconds. Each point is used three times. Both heads attack different levels; a life loss restarts the current round of three. Only progress pips and the flashing NEXT point are shown, never the entire order. Preserve this signed-off revision.

Approved voice identity: `voice_h0dygekvdjzv`, model `gemini-3.8-flash-tts`, source `Y:/MTD-Client-Files/mike-explainer/out/assets/voice-final/manifest.json`. `voice-source.json` pins it. Only the seven bundled lines: Nice one! / Get in! / Ey Up! / Ow! Pack it in! / Ooof! / Flipping Heck / Right then. Let's get this lot sorted. NO voice subtitles. No new voice generation is needed.

### Important authoring trap and recovery

`tools/revise-mike-encounters.py` predates Claude's later Level 1 fixes. DO NOT run it against the approved level: it rebuilds from v2 and loses the newer boss and escape steps.

This session briefly ran that stale script while relying on older context. The exact approved `level-1.json` was recovered from the deployed site and restored, with backup `.wrangler/mike-level1-approved-before-edm.json`. This session's overlapping Level 1 code/art edits were removed. `js/nightshift.js`, `js/machines.js`, `index.html` and `js/game.js` were compared with the published versions and match after newline normalization. No Level 1 behaviour change remains. Its route suite passes all 140 shelves and reports no dead ends.

## Delivered EDM documents and review

- `docs/mike-platformer/edm-level-design.md`: 512-tile six-room design; room dimensions; dry, maintenance and submerged routes; water, air, suit, controls, progression, hazards, checkpoints, boss proposal, prototype scope and acceptance criteria.
- `docs/mike-platformer/edm-asset-brief.md`: detailed asset IDs, dimensions/anchors, components, states, gameplay layers, palette, support rules, animation, audio and production order.
- `docs/mike-platformer/edm-look/layout.svg`: six-room layout schematic. Deliberately labelled conceptual, not final collision geometry.
- `docs/mike-platformer/edm-look/index.html`: review page with layout, prototype screenshots, links and implementation/remaining-work table.
- `tools/build-mike-edm-review.py`: regenerates the SVG and review page without external calls.

## Playable prototype

URL: `http://localhost:8788/mike-game/edm-prototype.html`

Files:
- `public/fireworks/mike-game/edm-prototype.html`: independent entry point, keyboard/touch controls, pause/restart/sound, link back to Level 1.
- `public/fireworks/mike-game/js/edm-world.js`: pure mechanics, 96-tile tank layout, suit gating, dry/wet transitions, water pump, buoyancy, air, collisions, wire state, sample salvage, recovery and exit hold.
- `public/fireworks/mike-game/js/edm-prototype.js`: renderer, original puppet plus PPE overlay, supported tank/guide machinery, UI, input, camera and approved audio triggers.

The prototype REUSES existing `world.js`, `puppet.js`, `art.js`, `nightshift.js` and `audio.js`; it does not modify them. Dry movement calls the actual Level 1 `MIKE.stepPlayer`. It uses the original terrain/backdrop/pickup artwork, 1.25 view scale, font fallback stack and short voice library. No external font files are bundled. It has no campaign saves, so Level 1 progress remains independent.

Controls: Left/Right or A/D move; Space/Up/W jump or swim upward; X dives; Down/S inspects below without moving; E toggles the pump near x12 or holds exit repair near x89; C toggles slow motion; R restarts. Separate touch controls for Look and Dive. Pause clears held input. Sound toggle uses the existing audio/mute mechanism.

Implemented: dry suit dock, visible pump low/high levels (16.5/10.5), continuous 0.8 tiles/s fluid interpolation affected by camera, 3.8 tiles/s wet movement, passive upward buoyancy, controlled dive, surface breach, 24-second air supply with dry refill, solid submerged fixtures, a mounted travelling wire guide with warning/active/safe phases, dry refuge, two traversable routes, ten sample salvage finds and one exit hold. Air consumption uses real time, independent of filming. Recovery returns to dry dock; it is intentionally simpler than final lives/checkpoints.

Prototype limitations: NOT the full level, NOT final difficulty tuning, NOT the Level 2 boss. Swim animation uses the existing jumping rig pose; PPE overlay needs visual refinement. No water-transfer pair, flush jets, intake pulses, final underwater audio mix, full score/milestone UI, 56-item layout or campaign integration yet. Test hooks can place Mike for screenshots; completion route tests use ordinary inputs only.

## Verification completed

- `node tools/test-mike-edm.cjs` PASS: dry-physics parity with Level 1, suit gate, pump edge triggering (held E cannot oscillate it), visible water interpolation, buoyancy, fixture collision, air/refill, air independent of camera, look separate from dive, exhaustion recovery, continuous wire travel, wire contact grace, exit hold/cancellation.
- The same suite completes both dry and wet tank routes using only ordinary inputs, no teleport or invulnerability. Dry scripted route approximately 14 seconds, wet route approximately 28.5 seconds, no recovery resets. These are small-slice mechanics checks, NOT human difficulty claims or full-level completion targets.
- `node tools/test-mike-edm-browser.cjs` PASS: loading and runtime without console/resource errors, actual keyboard events, actual touch dive, cancellation, and screenshots of dock/low/high/guide/refuge/phone.
- Results: `edm-look/mechanics.json`, `edm-look/browser.json`. PNG captures are beside them.
- `node tools/test-mike-routes.cjs` PASS for preserved Level 1: all 140 shelves reachable and no floor-pocket dead ends.

## What Opus should do next

1. Play BOTH current Level 1 and the tank prototype. Use the approved Level 1 as the visual and challenge benchmark; do not infer that a short prototype has final encounter density.
2. Read both EDM briefs. Validate fluid/surface control by hand, especially jumping from low water onto a rim, touch Dive vs Look, and air recovery on dry ledges.
3. Add the second tank and a transfer valve as the next bounded mechanics slice. Both valve states must leave an escape and a reachable valve. Test this before building the remaining rooms.
4. Implement one flushing nozzle and one guarded intake pulse with clear tells. Use shared render/collision pose functions and continuous visible return motion.
5. Refine the non-destructive suit/swim overlay without redrawing Mike. Keep voice identity/script/subtitle constraints intact.
6. Author the six rooms individually from the schematic, with meaningful route choices, checkpoints and 56 unique salvage IDs. Do not extend length with repeated bays or create one safe floor bypass.
7. Restore full Level 1-style score/milestone feedback, checkpoint saves and campaign navigation for the finished level; keep save schemas/versioning separate until transitions are intentional.
8. Prototype the Threading Fault only after fluid traversal works. Its water/guide job should differ from the existing Level 1 boss. Preserve the requirement for readable, learnable patterns and tool-based repairs.
9. Run route/air-budget checks and actual keyboard/touch playthroughs, inspect desktop/phone screenshots, then playtest difficulty against Level 1. Physical iPad Safari performance is not established by desktop emulation.
10. Update this document at each milestone. Mark what is implemented, what has actually passed, and what remains. Do not publish or make claims of full completion prematurely.

## Environment and safe tooling

Workspace `C:/hirednerds-portfolio`, PowerShell, Windows. Local server `node tools/serve-fireworks.cjs 8788` (already running at the time of handover). Runtime only under `public/fireworks/mike-game`; tests under `tools`; design under `docs/mike-platformer`. There is unrelated uncommitted work throughout the workspace. Never reset/clean/stage everything or deploy the entire tree.

EDM browser tests use isolated Chrome on port 9351, profile `.wrangler/mike-edm-test`. Level 1 suite uses port 9346. Do not read a user's browser profiles or credentials. Existing in-app browser runtime was unavailable earlier; the project CDP harness is the tested local fallback. Browser execution may need normal sandbox escalation. Do not bypass an approval rejection. No keys belong in public assets or documentation.

Run checks selectively after meaningful changes; do not spend credits repeating unrelated suites. Prefer procedural code assets and the supplied artwork over paid generation. If a paid service becomes materially useful, make a concrete small sample and seek any required authorization before bulk production; no new service spend is necessary for the current plan.


## Progress log: 29 September 2026, Claude (Fable 5.1)

Picked up from the list above under the same rules. This log replaces the list's status; the list itself is kept as written.

**Level 1 and the tank prototype are untouched.** Every Level 1 file (`index.html`, `level-1.json`, `js/game.js`, `world.js`, `art.js`, `machines.js`, `nightshift.js`, `audio.js`, `puppet.js`, `demo.js`) still matches the live site by hash. `node tools/test-mike-routes.cjs` and `node tools/test-mike-edm.cjs` still pass. Nothing was deployed, committed or pushed. No paid service was used.

### Where Level 2 lives

| File | What it is |
|---|---|
| `public/fireworks/mike-game/level-2.html` | The page. Own title, own save (`mike-game.l2.v1.*`), link back to Level 1. `?room=1..6`, `?scene=<name>`, `?demo=1`, `?lab=1`, `?test=1`. |
| `public/fireworks/mike-game/level-2.json` | The six rooms. **Generated**: edit `tools/build-mike-level2.cjs` (world coordinates, hand-authored) and run it. |
| `js/l2-world.js` | The rules (`MIKE.L2`), no drawing: tanks with named levels, valves, air, pockets, wires, nozzles, intakes, doors, lives, scoring, the Threading Fault. Runs in Node for the suites. |
| `js/l2-art.js` | The art (`MIKE.art2`): tanks, fixtures, wire guides, nozzles, intakes, valves, the suit overlay, swim poses, the fault. |
| `js/l2-audio.js` | Water sounds on a context of its own, so `audio.js` is not edited. Same mute, same pause. |
| `js/l2-game.js` | Loop, input, camera, HUD with the air meter, saves, menus, scenes, test hooks (`window.__l2`). |
| `demo-2.json` | A recorded playthrough (run-length inputs, 5 KB). Written by the run suite. |
| `tools/mike-l2-lib.cjs` | The test player: plans on copies of the game, plays only ordinary inputs. |
| `tools/mike-l2-slice.cjs` | The bounded two-tank slice the rules were first proved on. |
| `docs/mike-platformer/l2-look/index.html` | Review page: captures, map, results. Built by `tools/build-mike-l2-review.cjs`. |

### The list above, step by step

| Step | State |
|---|---|
| 1. Play both | Not possible for an agent. Done by reading the code, the captures and the suites. |
| 2. Validate fluid and surface control | Done in tests, and changed where the prototype misbehaved: see "Water feel" below. |
| 3. Second tank and transfer valve, tested before the rooms | Done. `tools/test-mike-l2-mechanics.cjs`, 16 checks. |
| 4. One nozzle and one guarded intake, shared pose functions | Done. `wirePose`, `nozzlePose`, `intakePose` drive drawing, damage and tests. Travel is a cosine: continuous in position and speed. |
| 5. Suit and swim overlay, Mike not redrawn | Done. Pack and bottles behind, harness, collar, visor and ankle cuffs in front. Swim poses use only his joints. No new voice lines; the seven approved ones only; no subtitles. |
| 6. Six rooms, route choices, checkpoints, 56 unique salvage | Done. 512 tiles, 8/10/9/11/10/8 salvage, 8 checkpoints, 4 SD cards, 5 lubricants, 1 hidden Mini Mike. |
| 7. Score and milestone feedback, saves, navigation | Done inside Level 2, with its own save keys. **Level 1 does not link to Level 2**: that is an edit to a locked file and is left for the owner. |
| 8. The Threading Fault | Done. See below. |
| 9. Route and static checks, keyboard and touch, screenshots | Done. The owner has played it once and his three directions are built. A comparative difficulty playtest against Level 1 and a real iPad are **not** done. |
| 10. Update this document | This log. |

### Suites, all passing on 29 September

| Command | What it proves |
|---|---|
| `node tools/test-mike-l2-mechanics.cjs` | Water, valve, air, pocket, nozzle, intake, wire and door rules on the slice. |
| `node tools/test-mike-l2-routes.cjs` | Machines off. Every standing place and pickup reachable; **no dead ends** in any valve state, on land or in water; the twelve water gates; air budget. |
| `node tools/test-mike-l2-boss.cjs` | The fault's rules. Mike is placed at the points; machines off. |
| `node tools/review-mike-l2.cjs` | Codex's regression suite. Replays the real recording; a save taken after the final repair reaches results; a jet hurts only once its visible stream arrives, filming included; results wait for the drained sump and the open exit. Writes `l2-look/refinement.json`. |
| `node tools/test-mike-l2-run.cjs` | Machines on, nobody placed. Start to win in 4:35, 36/56 salvage, no hit. Set `NO_RECORD=1` unless the recording is meant to be replaced. `VARIANT=1` and `VARIANT=2` for the other two repair orders. Writes `demo-2.json`. |
| `node tools/test-mike-l2-alt.cjs` | Machines on. The six routes the run does not take. |
| `node tools/test-mike-l2-browser.cjs` | Headless Chrome on port 9352, profile `.wrangler/mike-l2-test`. Input, save, pause, no errors, no fetches after load, the recorded run wins in the page. `scenes` as first argument captures only. |

The run is a completion proof by a player that knows every machine's future. It is not a difficulty measurement.

### Water feel: what changed from the prototype and why

- The prototype's Mike had no resting place at the surface: buoyancy carried him out of the water and gravity dropped him back. He now floats with his feet one tile under and his head out.
- The prototype leapt out of the water whenever Jump was held near the surface. A leap now needs a press; holding only swims up.
- A grating stopped a diver from above. Holding Dive now passes it.
- Falling water used to shake him in and out of the surface. He now rides it down.
- The prototype's suit ran out of air and reset him to the dock. There is no air supply now: a full static charge costs one health and returns him to the last dry refuge he stood on. See the owner's playtest below.

### The Threading Fault, as built

- Three service points on three levels: flush on the sump floor (481, 24), tension on the table (488, 13), align on the top deck (495, 5).
- Six repairs of 2.2 s in two passes of three. Three orders, each starting at a different point, none repairing a point twice running. Each finished run moves to the next order.
- The order is never shown. The next point flashes. The HUD shows six pips and the pass. The wrong point buzzes and counts nothing.
- Each pass starts with the sump flooded. Finishing the flush job drains it for the rest of that pass, so where flush falls in the order decides how wet the pass is.
- Machines: one upright wire travelling the width of the cell, a jet along the sump floor, a jet along the table, an intake in the sump, and in the second pass a second wire lying flat and travelling up and down.
- Every pass begins with two quiet seconds and the wire at the far end. A lost life restarts the pass only.
- Holds run on Mike's own time, as in Level 1. The first build ran them on machine time, after the design brief's line about a slow-motion exploit; the owner played it and said the camera must slow hazards and never Mike or his actions. **Standing direction: the camera never slows anything of Mike's.** What limits filming in a boss is that the camera shoots in clips, in both levels: see the last section of [EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md).
- A ladder of gratings on each wall lies outside the upright wire's reach.
- Added by Codex's refinement pass: a **Hold E to fix** helper beside Mike at the point he can repair, and an arrow toward the current point when it is off screen. Only the current point is ever indicated.
- Added by Codex's refinement pass: the ending is staged. The sump drains, the cut completes, the exit door opens, and only then do the results appear. It is automatic; Mike does not walk to the exit.
- Added by Codex's refinement pass: a save taken after the final repair resumes that ending. Before, it loaded into a cell he could neither finish nor leave.
- Added by Codex's refinement pass: a jet's reach grows with its visible stream, for drawing, damage and push alike.

### Owner's first playtest, 29 September: every wheel must have a point

The owner played it and said the funnel's wheel was good, because turning it from inside is the only way up, and that the others were pointless, because the water level changed nothing. He was right: the first Split reservoir could be crossed with the water either way, and four of the six wheels only existed to undo each other. This overrides the design brief's line that both valve states give a route across.

- There are now two wheels in the level. One inside the Guide tower's shaft. One on the Split reservoir's divider.
- Split reservoir: a weir stands in each tank. Full, he swims over it. Drained, it is a wall. The wheel fills one tank by draining the other.
- Each tank has a vault whose door opens only while that tank is drained, and a high cache reachable only from the surface while it is full.
- `gates` in the room's data lists twelve things the water decides. `tools/test-mike-l2-routes.cjs` proves each is open in one state and shut in the other with the wheel left alone.
- With one wheel per valve, a respawn or a loaded save puts a valve back to its safe state (`reset`), so nobody starts from a checkpoint on the wrong side of the water.
- **Standing direction for later levels:** do not add a switch unless the level cannot be finished, or a reward cannot be reached, without it.

### Owner's first playtest, continued: no air supply, and Down dives

**The helmet.** The owner said running out of air is a good mechanic but makes no sense on a man in a helmet, and asked for another reason. The mechanic is kept exactly; the reason is new and belongs to this level.

- The fluid is live. While his helmet is under it, **static** builds on the suit, one second per second, on real time.
- With his helmet out, in the open or inside an **earthing bell**, the strap on the helmet sheds it, eight times as fast.
- At 24 seconds the suit discharges through him: one health, a flash, and back to the last dry refuge he stood on.
- The meter reads STATIC, fills as it builds, and shows the seconds left. Arcs jump about the suit as it climbs.
- The trapped-air pockets are now earthing bells: the same air, with an earth bar, straps and the earth sign.
- In the rules the field is `S.static`, rising from 0 to `W.limit`. The events are `staticHigh`, `earthed` and `discharge`. Nothing in the rules or the page is called air any more.
- This replaces the brief's "suit air" throughout. **Do not bring an air supply back.**

**Down.** Down and S are one control: look below on dry land, dive in the fluid, and the view leads the dive. X still dives. On touch there is one Down button, which shows a dive arrow while he is in the fluid. This overrides the brief's line that Down must never dive. The rules still take `dive` and `lookDown` separately; the page maps the key.

### Two traps the dead-end check found in my own first layout

- Pools between the Split reservoir's fixture blocks at low water. Fixed by standing the tables on legs, two tiles clear of the floor.
- Ladder bottom rungs 0.6 under the low water, too deep to stand on. Raised to 0.4.

### Known limits and open decisions

- **Played once by the owner.** His three directions are built: every wheel has a point, static instead of air, Down dives. Difficulty against Level 1 is still unmeasured, and he has not yet played Codex's refinement pass. Timings are single numbers in the builder.
- **Not run on a real iPad.** Static art is cached in five 640 by 1640 canvases; desktop frame work is about 2 ms at the 95th percentile.
- There is no underwater filter on the music, because that would mean editing `audio.js`.
- Static builds at the same rate everywhere. Building faster near a cutting wire would fit the idea and is not done.
- `edm-prototype.html`, `js/edm-world.js` and `js/edm-prototype.js` are still in the game folder. `tools/deploy-kpopboom.sh` stages the whole folder, so a deploy would publish the prototype and Level 2 together. Remove the prototype first if that is not wanted.
- From the entry deck the way into the fault's cell is down onto the ledge; a running jump from the deck lands on the first climbing grating instead.

### If you continue from here

0. Read [EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md) first. It is the latest handover, and its closing section records the independent rerun of every suite.
1. Get the owner to play `level-2.html` again, with the refinements in, and take notes against Level 1.
2. Retune in `tools/build-mike-level2.cjs`, rebuild, then run routes, run, alt and browser in that order.
3. Decide the Level 1 link and the prototype's removal with the owner before any deploy.
