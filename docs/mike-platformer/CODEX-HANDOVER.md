# Mike platformer: current handover and continuation

## LIVE: deployed to kpopboom.party on 30 September at 12:05 and again at 12:20, on the owner's word (Claude)

Both levels, the clip camera, the campaign rules and the hardened Level 2 are live. Since 12:20 Level 1's debug switches (`?section`, `?scene`, `?demo`, `?test`, `?lab`) are local-only too, like Level 2's: the owner's rule is that address switches exist for local testing and nothing else. Every `mike-game` file on the site matches the local copy by hash. The prototype pages went up with the folder (unlinked). Not committed to git.

## DONE: the owner's playtest of both bosses, 30 September, 11:30 (Claude)

The owner played Boss 1 with Codex's faster heads and passed it: "very quick but doable". **Signed off.** He then gave six instructions. All six are built and checked in the page (`node tools/test-mike-campaign.cjs`).

| Instruction | Built |
|---|---|
| The boss progress bar covered targets; make it smaller and keep it off them | One shared strip, `M.bossStrip` in `js/world.js`: 20 px tall at the top centre under the pause buttons, pips plus "5/9 R2/3". Both levels use it. Level 1's old 380 by 50 panel is gone |
| After Level 1, Continue loads Level 2 | Level 1's results Continue goes to `level-2.html` (a test strip still returns to the title) |
| Level 2's completion screen has only "Play again" | Done. The Continue button is removed from `level-2.html` |
| Level 2's address must not let a player skip Level 1 | On any host that is not local, `level-2.html` opens only if Level 1 has been finished on that browser (campaign record or Level 1's own progress flag); otherwise a locked screen with a button back to Level 1. The debug switches (`?room`, `?scene`, `?demo`, `?test`, `?lab`) are ignored off the local network |
| Losing every life must not continue from a checkpoint | The checkpoint save is deleted on the last life, in both levels |
| One continue per level, awarded at the end; a continue restarts the level with three lives, full health, level reset; none left restarts the game | `M.campaign` in `js/world.js`, key `mike-game.campaign.v1`. First clear of a level: +1 continue. Last life with a continue: the level starts again from its beginning, valves and salvage reset. Last life with none: the campaign record is wiped and the game goes back to Level 1's title (from Level 2, the page navigates to `./`). A "CONTINUES × n" chip shows under the score while any are held |
| Restart means restart, no address cheats (owner, 30 Sept, second round) | Level 2 opens off-local only for a campaign record that cleared Level 1 in this run. Level 1's own old progress flag no longer counts. A game restart wipes the record, so Level 2 is locked again until Level 1 is passed again. Replaying Level 1 does not earn a second continue |
| Level 2's card keeps every Level 1 row and totals the campaign | Rows: Level 2 score, Level 1 score, Campaign total, salvage, best, SD cards, Mini Mike, time, lives lost, continues used. Scores live in the campaign record (`M.campaign.score`, `.total`). Only Play again below it |

Suites after these changes: mechanics, boss, clips, run (order 1), Level 1 physics, Level 1 mechanics and autopilot, Level 2 browser: all pass. `tools/test-mike-game.cjs` and `tools/test-mike-l2-boss.cjs` no longer expect a checkpoint continue on the last life.

Files touched: `js/world.js`, `js/game.js`, `js/nightshift.js`, `js/l2-world.js`, `js/l2-game.js`, `level-2.html`, `tools/test-mike-game.cjs`, new `tools/test-mike-campaign.cjs`.

## DONE: harder campaign and +20% EDM boss tempo (Codex built it; Claude finished and verified it, 30 September, 10:15)

The owner's brief, in his words, after finishing the Level 2 boss with moderate ease: "Make it 20% harder, but obviously still solvable. Make the entire level up to the boss twice as difficult, more challenges, less static charge etc. It's currently easy to swim over and under the jet streams through most of the level with the exception of one or two." Percentages are his targets, not measured scores. **He has not yet played this pass.**

Codex implemented it at 09:07 and its credits ended before this section was updated. Claude checked every file against the pre-hardening copy `.wrangler/mike-l2-before-hardening.json`, found the level changed as planned, fixed the one thing left broken (the test player, not the level), reran everything, refreshed the captures and gallery, and wrote this.

### What changed in the level (all in `tools/build-mike-level2.cjs`, then regenerated)

| Where | Change |
|---|---|
| Static | Limit 24 to **20** seconds; shedding 8 to **6** per second (`W` in `js/l2-world.js`) |
| Suit dock | New floor nozzle `n1a` in the basin: the first jet, in safe water |
| Flushing gallery | New travelling wire `w2a` over the rim, new floor jets `n2f` and `n2g` at both ends; `n2a` and `n2c` now reach 12.5 tiles, so they cover the surface swim; every cycle shorter, every active phase longer |
| Guide tower | New wire `w3e` and side nozzle `n3b` in the long tank; `w3d` faster; `n3a` reaches the surface |
| Split reservoir | New floor jets `n4c` and `n4d`; `n4a` and `n4b` reach the surface; `w4` faster |
| Cut-path maze | New opposed jets `n5d`, `n5e`, `n5f` across the cut corridors; existing jets longer |
| Approach to the fault | New floor jet `n6q`; `n6p` reaches 16 tiles |
| The fault | `hazardRate:1.2`: its wires, jets and intake run 20% faster on the fault's own clock. Repair, player, camera and static times unchanged |

Twelve hazards added, fourteen tightened. Geometry, routes, 56 salvage, the two valve puzzles, the hidden life, clips and the six ordered repairs are untouched.

### What Claude changed (test player only, `tools/test-mike-l2-run.cjs` and `tools/mike-l2-lib.cjs`)

- Between passes the player now waits at the float line with its helmet out, so the suit sheds static, instead of holding a depth. After the flush job it surfaces beside the ladder.
- Climbing out of a draining sump, it leaps for whichever rung the falling water has brought in reach instead of waiting to be set down.
- `until` waypoints may hold a spot given as a function of the state.

Without these, boss orders 2 and 3 could not be played through with the shorter static budget. The level was not changed for this.

### Verified, 30 September 09:40 to 10:10

| Command | Result |
|---|---|
| `node tools/test-mike-l2-mechanics.cjs` | Pass |
| `node tools/test-mike-l2-boss.cjs` | Pass |
| `node tools/test-mike-l2-routes.cjs` | Pass: 113 of 113 places, 66 pickups, 12 water gates, no dead ends. Longest swim to an earthing point 5.7 s of a 20 s budget |
| `node tools/test-mike-l2-alt.cjs` | Pass: six alternative routes, no hit |
| `node tools/test-mike-l2-approaches.cjs` | Pass: every final approach fits a clip with 0.6 s hesitation; start window 1.2 s |
| `node tools/test-mike-clips.cjs` | Pass |
| `NO_RECORD=1 node tools/test-mike-l2-run.cjs 6`, `VARIANT=0/1/2` | Pass: 330.7 / 337.6 / 336.0 s, 36 of 56, six clips, zero hits, no life lost |
| Same with `NO_CARDS=1` | Pass: 340.6 / 340.0 / 343.5 s, zero hits |
| `node tools/review-mike-l2.cjs` | Pass: the recording of 09:07 wins in Node |
| `node tools/test-mike-l2-browser.cjs` | Pass: the recording wins in the page in 330.7 s; keyboard, touch, pause, save and reload; no errors; nothing fetched after load |
| `node tools/test-mike-l2-browser.cjs scenes` and `node tools/build-mike-l2-review.cjs` | Captures and gallery refreshed |
| `node tools/test-mike-nightshift.cjs --demo-only` | Pass: Level 1 autopilot wins, 240 s |
| `node tools/test-mike-routes.cjs`, `node tools/test-mike-game.cjs physics` | Pass |

Autopilot times went from about 4:35 to about 5:35 through the harder level. That is the planner waiting for machines, not a human measurement.

### Boss-only starts for the owner

- **Level 2:** `http://localhost:8788/mike-game/level-2.html?room=boss`. Checkpoint 470, suited, full health, the four SD cards of the level already collected, so three clips on the card. Refresh restarts it. Normal saves are not touched.
- **Level 1:** `http://localhost:8788/mike-game/?section=20`. Checkpoint 937 at the arena entrance, full health, **no SD cards**, so one clip on the card. A player who collected cards through the level would arrive with up to four clips. Refresh restarts it. Verified to boot and place him at x 937.

### Still owed to the owner

- **Level 1's faster boss heads** (stroke every 2.1 s instead of 4.5) were Codex's change last night to make Boss 1 need the camera. The owner has not played it. He said the Level 2 boss changes are signed off; he did not say that of Level 1.
- **The static numbers.** He asked for less static and has not said how much. Codex chose 20 and 6. He wants to judge in a full playtest.
- A full human playtest of this pass. A real iPad. The Level 1 to Level 2 link, prototype removal, deploy: all separate, none started.

## Owner playtest adjustment ? 30 September

Implemented after the owner reported repeated deaths at EDM points 1 and 2 and asked to review point 3. The previous stationary-repair audit missed the approach cost: 3-second clips left only 0.8 seconds around a 2.2-second repair. All three final approaches now have explicit reaction-and-settle regression coverage.

- Boss clips last **5 real seconds in both levels**. Each costs 3 internal card-space units; spare counts, SD benefits, 0.6-second loading and 15-second empty recharge stay unchanged. Outside-boss camera is unchanged. HUD converts storage units into real filming seconds.
- All three EDM jets have **0.5 extra machine seconds of quiet recovery**: cycle 3, warning 0.65, active 1.05, rest 1.3 (previously 0.8). Wire rhythms, geometry, six repairs and two passes are preserved.
- Holding Fix at the eligible underwater fitting braces Mike against buoyancy. No simultaneous Down press is needed. Release/movement/damage still interrupt the repair; wrong fittings do not brace him. Plunge recovery cannot override the brace.
- Level 1 demo banks unused footage after a repair so its next jump prediction does not fall into a timing loop. This changes demo inputs, not player controls or hazards.
- New `tools/test-mike-l2-approaches.cjs`: 300 start phases per point per pass, normal last swim/jump, camera started beforehand, 0.25-second reaction and 0.35-second settling delay, then Fix alone. Successful attempts take 3.77 / 4.27 / 4.23 seconds for flush/tension/align, with contiguous launch windows of 1.4 / 1.7 / 1.6 seconds in both passes. Initial placement isolates each approach; this is automated evidence, not a substitute for the owner's next human playtest.

Local implementation complete. No deployment. If continuing, use this five-second baseline and the latest evidence below; do not restore the three-second version based on earlier documents.

Updated 30 September 2026 by Codex after the owner authorized **make your changes**, then **resume**. The camera review fixes are implemented and verified locally. Nothing is deployed, committed or pushed. No paid generation service was used.

This supersedes the status and open issues in [the archived handover](CODEX-HANDOVER-2026-09-29-ARCHIVE.md), OPUS-5.5-CONTINUATION.md and EDM-REFINEMENT-CONTINUATION.md. They remain design history; do not reintroduce their superseded camera or oxygen proposals.

## Current build

- Level 1: http://localhost:8788/mike-game/
- Level 2: http://localhost:8788/mike-game/level-2.html
- Boss playtest start: http://localhost:8788/mike-game/level-2.html?room=boss — checkpoint 470, suited, full health, four earlier SD cards (three boss clips); health pickup at 473 remains unclaimed. Refresh resets this test run. Normal save and completion records are protected. Verified with `node tools/test-mike-l2-browser.cjs boss-start`.
- Recorded EDM run: http://localhost:8788/mike-game/level-2.html?demo=1
- [Review gallery](l2-look/index.html)
- Server: `node tools/serve-fireworks.cjs 8788` from C:\hirednerds-portfolio.

## Implemented

1. **Spare clips display correctly in both levels.** Shared `M.spareClips` subtracts only the remaining footage of the current take. A card with three clips shows two full spares throughout its first take. Regression checks cover first, middle, last and expired frames, including half-clip capacities.
2. **Five-axis boss requires filming for uninterrupted repairs.** Primary stroke repeats every 2.1 machine seconds: tell 0.4, extend 0.25, sweep 0.5, retract 0.35, park 0.6. The secondary joins every other stroke, leaving a readable recovery beat for deck transfers. Nine repairs, three elevations, all three orders and round checkpoints remain. Non-boss Level 1 data matches the approved pre-EDM snapshot exactly.
3. **EDM protects all three repair elevations.** Lower/middle jets and a new upper wall nozzle repeat every 3 machine seconds: warning 0.65, active 1.05. The upper nozzle mounts on the right enclosure. Existing wire travel speeds remain. Each pass starts with two quiet machine seconds. Parked wires match their first live position, avoiding a startup teleport. Rendering, fluid forces and damage share the startup clock.
4. **Camera and repair rules preserved.** Repair: 2.2 real seconds; filmed machine speed: 0.2; clip: 5 seconds; loading: 0.6; empty clip regeneration: 15 seconds, limited to one regenerated clip. SD cards add spare footage. Repairs have no artificial camera-on lock.
5. **Playthrough tools and recording updated.** Level 1's controller predicts clip expiry, reserves footage for repairs and retreats to recharge. EDM's planner now honors `film:true` during Fix and includes the escape in each planned job. `demo-2.json` is a fresh ordinary-input recording. Legacy tests no longer rely on obsolete boss timestamps or attempt to resume after results intentionally cleared the save.

Preserved: six EDM rooms, geometry, 56 salvage, hidden life, two meaningful valves, static, look-down/dive, machine art, approved puppet and voice, and staged restoration. No subtitles or new voice lines. Keep the explicitly requested **Hold E to fix** helper.

## Verified in this pass

| Command / check | Result |
|---|---|
| `node tools/test-mike-l2-approaches.cjs` | All three final approaches in both passes fit a five-second clip with 0.6 seconds deliberate hesitation; no hits in successful trials |
| `node tools/test-mike-clips.cjs` | Shared rules, HUD count, unchanged outside-boss camera and real-time hold pass |
| `node tools/test-mike-boss-windows.cjs` | 135 Level 1 and 40 EDM position/order samples pass, including interaction edges and submerged flush height margin |
| `node tools/test-mike-nightshift.cjs --boss-clips` | Three orders with zero cards and a full card; nine clips each; no lost lives. Some runs take hits |
| `node tools/test-mike-nightshift.cjs --demo-only` | Full Level 1 and boss: 258.35 seconds of play, no lost life |
| `node tools/test-mike-nightshift.cjs --mechanics-only` | Repair cancellation, zero-salvage win, restoration-save recovery, round recovery, refuges, lift, rail continuity and look-down pass |
| `node tools/test-mike-l2-run.cjs`, variants 0/1/2 | 305.2 / 298.7 / 306.0 seconds; six clips each, zero hits or lost lives |
| Same with `NO_CARDS=1` | All optional SD pickups removed: 320.0 / 314.0 / 311.6 seconds; six clips each, zero hits or lost lives |
| `node tools/test-mike-l2-boss.cjs` | All orders, real-time holds, startup grace, pass recovery, final save and restoration pass |
| `node tools/test-mike-l2-mechanics.cjs` | Swimming, valves, static, hazards, recovery and dry physics pass |
| `node tools/test-mike-l2-routes.cjs` | All 113 standing places and 66 pickups reachable; no dead ends |
| `node tools/test-mike-l2-alt.cjs` | Six alternate routes, zero hits |
| `node tools/review-mike-l2.cjs` | New demo wins with zero hits and 27.12 seconds filming; save recovery and growing-jet fairness pass |
| `node tools/test-mike-l2-browser.cjs` | Recorded run wins; keyboard/touch, pause, save/reload and helpers pass; no console/network errors |
| Final scene capture pass | Boss captures refreshed after startup-position correction; review gallery rebuilt |

Timing audit: longest uninterrupted full-speed gaps are **1.675–2.008 seconds** in Level 1 and **1.517–1.625 seconds** in EDM, below the 2.2-second hold. A filmed repair advances machines by only **0.44 seconds**. These are sampled stationary interaction-position bounds after startup, not a proof against every damage-tanking strategy. Startup grace remains. The audit executes production head geometry and EDM hazard poses rather than copied attack formulas.

Evidence: [approaches.json](l2-look/approaches.json), [boss-windows.json](l2-look/boss-windows.json), [boss-clips.json](nightshift-look/boss-clips.json), [full-clips-run.json](nightshift-look/full-clips-run.json), [browser.json](l2-look/browser.json), [refinement.json](l2-look/refinement.json), l2-look/run*.json and nightshift-look/mechanics-checks.json.

## Continuation rules

- Slow motion slows hazards and moving fluid, never Mike, repair or static buildup. Both bosses use the shared world.js camera rule.
- Static is the underwater mechanic: limit 20, shedding 6 per second with helmet out or at an earthing bell (24 and 8 before the hardening pass). Never restore oxygen.
- Down/S looks below on land and dives underwater; X also dives. Preserve the unified touch control.
- Salvage is optional replayability, never repair currency. Preserve 56 per level.
- Preserve approved styling, variety, difficulty, puppet and seven short voice clips. No dialogue subtitles. Only the next repair point is highlighted, never the order.
- Fictional, unbranded machines. Heavy equipment needs visible support.
- Edit tools/build-mike-level2.cjs, then regenerate level-2.json. Never run stale tools/revise-mike-encounters.py: it overwrites later approved Level 1 changes. Level 1 boss data has no trustworthy current generator; retain small direct JSON edits.
- `NO_RECORD=1` avoids replacing demo/results during experiments. `NO_CARDS=1` removes SD pickups only in test data and writes run-bare*.json. `VARIANT=0`, 1 or 2 selects an order. In PowerShell set these with `$env:...`.
- Isolated browser profiles: port 9346 for Level 1, 9352 for EDM. Do not run two tests against the same profile concurrently. Capture-only EDM runs write scene-captures.json, preserving browser.json.
- tools/measure-mike-boss-windows.cjs now forwards to the formal timing test and writes boss-windows.json; it is no longer the old copied-formula read-only measurement.
- The workspace has extensive unrelated edits. Do not reset, clean, stage everything or deploy as a continuation shortcut.

## Emergency continuation checkpoint

**No implementation or verification remains unfinished for this authorized pass.** Next useful step: owner playtesting of the boss rhythm and clip timings. Automated times are completion proofs, not human difficulty ratings. A literal fivefold difficulty increase and real iPad performance remain unverified.

Campaign linking, prototype cleanup, underwater music and deployment remain separate work. Local changes have not been published. If resuming after a credit interruption, use this document and the result files; do not repeat the original review's now-fixed findings or rebuild from the old brief.
