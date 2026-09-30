# Independent review of Opus's EDM build

**Subsequent implementation:** the owner authorized this review's refinement pass. See [EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md) for current status and [the gallery](l2-look/index.html) for the revised build. The findings and measurements below are retained as the original audit, not a claim that those bugs remain unfixed.

29 September 2026. Reviewed against `edm-level-design.md`, `edm-asset-brief.md`, the approved Level 1 baseline, and the later owner revisions recorded in `OPUS-5.5-CONTINUATION.md`. This review changes no game files.

**Verdict: close to the intended layout and mechanics; a substantial playable implementation. Visual finish and verified difficulty are less complete. Fix the save recovery and hazard fairness bugs before signing it off.** Preserve this build and refine it; a rebuild is not warranted.

## Findings, in priority order

### 1. P1 — A save after the final repair cannot finish or move

The page saves on `bossDone`, before its 3.4-second results delay. Loading that save restores `boss.done = true` but leaves `boss.on = false`. `stepBoss` returns from its inactive branch forever, while movement is disabled by `boss.done`.

Reproduced from the actual final-repair save captured during the supplied recorded run. After loading it and holding Right for ten seconds: Mike remains at x470, `won=false`, `boss.done=true`, `boss.on=false`. This affects reloading or quitting to title during the victory delay, including pausing there and later continuing.

Sources: `js/l2-world.js:122`, `:301`, `:302`; `js/l2-game.js`'s `bossDone` handler and save/continue flow. Restore completed saves into a valid victory/results state, including the correct repair count and drained arena. Add a regression that captures a real completed save, reloads it and reaches results.

### 2. P2 — A jet can hurt Mike before its visible stream arrives

`nozzlePose` supplies a full-length damage rectangle immediately when active. `A2.jet` grows the visible stream over 0.18 seconds. These use the same phase function but not the same effective reach.

Reproduction: gallery nozzle `n2b`, Mike five tiles along its six-tile stream. At the first sampled active moment the stream's growth length is only **0.033 tiles** (plus the renderer's short nozzle offset), yet Mike loses one health. Slow motion lengthens the visible mismatch in real time.

Sources: `js/l2-world.js:95`, `:276`; `js/l2-art.js:297`. Use one growing segment for drawing, damage and any push force. Verify just ahead of and behind the moving tip, including filming. This matters more than simply increasing damage or encounter density: the design requires readable danger.

### 3. P2 — The cut-path workpieces still appear unsupported

The tanks, many fixtures, gantries and service shelves have good structural treatment. However, Room 5's `work` rectangles receive brushed faces and bright edges but no clamps, support arms or suspension. For example, the first blank at x352, y10.5 ends at y16, above another separate slab at y19; neither is joined into a visibly supported workholding assembly.

Sources: `js/l2-art.js:79`, Room 5 in `tools/build-mike-level2.cjs`; [maze capture](l2-look/r5-maze.png). This repeats the floating-machinery issue the owner explicitly asked to eliminate. Add recessed workholding frames and clamps that connect the separated shapes without suggesting invisible collision barriers or blocking the swim passages.

### 4. P2 — The repair helper does not communicate “hold”

Near an eligible point, the keyboard prompt shows only **E**; touch shows a tool icon. The title says E USE. The same control merely needs a press at valves but must be held for 2.2 machine seconds at the boss. A ring appears once repair starts, but there is no explicit hold instruction.

Sources: `js/l2-art.js:209`, `js/l2-game.js:264`. Use a short contextual **Hold E to fix** / **Hold to fix** helper, consistent with the owner's request. This is an interaction label, not a voice subtitle. An offscreen indication of the current service point would also help the unusually tall arena: flashing a socket is only useful once it is visible.

### 5. P3 — The victory payoff skips the designed exit

The player wins automatically 3.4 seconds after the final repair. In the supplied run, results appear at x480.88 while the exit is x500; the sump is still draining (level20.47, target23.6). Mike cannot move during that delay.

Source: `js/l2-world.js:302`. The brief proposed completing the cut and opening a visible drained exit path. Either stage a complete automatic restoration sequence or let Mike use the restored exit before results. Currently the results heading “Cell drained and threaded” gets ahead of the visible outcome.

## Alignment with the design

| Area | Assessment |
|---|---|
| Six rooms and length | Strong match: all six named rooms, exact 512-tile extent and intended room boundaries. Rooms have distinct tasks rather than a repeated long obstacle template. |
| Vertical routes | Strong: rim platforming, buoyant shaft ascent, reservoir transfer, submerged corridors and a tall service arena. Route checks pass across tested fluid states. |
| Level 1 preservation | The five available pre-EDM snapshots (`index.html`, `level-1.json`, `game.js`, `machines.js`, `nightshift.js`) match current files after newline normalization. New gameplay lives in separate Level 2 files. Dry-physics parity passes. Shared puppet, terrain, palette, pickups and approved voice library are reused. |
| Collection | Correct 56 optional salvage items, allocated 8/10/9/11/10/8. Four SD cards, five health pickups and one hidden Mini Mike. Salvage is not consumed by repairs. All pickups pass the geometry checks; a single ordinary-input 56/56 run has not been demonstrated by this review. |
| Moving hazards | Continuous wire movement, separate tell/active/recovery phases, shared pose functions. Good architecture, with the jet reach discrepancy above still requiring correction. |
| Boss | Three elevations, six repairs in two passes, three learnable orders, machine-time holds, persistent completed passes, a changing sump and a second wire in pass two. This is a reasonable EDM-specific interpretation; six versus Level 1's nine repairs does not by itself prove an easier fight. |
| Presentation | Clearly the same game. PPE preserves Mike's identity; swim poses, water overlays and earthing effects extend it coherently. Boss machinery lacks the imposing silhouette and mechanical density of the approved Level 1 arena. |
| Audio | Existing short Mike voice library is reused without dialogue subtitles; water effects are added separately. Underwater music filtering remains unimplemented. No new voice identity was introduced in these modules. |
| Campaign connection | Separate entry and save keys work. Level 1 does not yet lead into Level 2. That is an integration item, not permission to alter the preserved Level 1 gameplay. |

## Revisions recorded as owner-directed

The handover explicitly records these changes following the owner's playtest. They supersede the original brief and should be retained:

- Static charge and earthing bells replace the oxygen explanation, retaining the real-time exposure budget. Do not reintroduce air supply.
- Down/S looks below on dry land and dives in fluid, with the view leading the dive. X remains an alternative.
- Only useful wheels remain: the tower ascent and reservoir transfer. The transfer now gates progress and rewards rather than providing a cosmetic choice.

These are purposeful revisions, not failures to follow the first design. The brief and review page still contain some obsolete “not played by a person”/prototype-only statements despite the recorded owner playtest; consolidate their current status before another handover.

## Visual production gaps

The foundation is coherent, but the asset brief was more ambitious than the current finish:

- Give the boss a connected spool–tensioner–guide–workpiece assembly, a stronger enclosure silhouette and clearer physical reactions to the three jobs. Currently flush changes the water; the other repairs mostly advance the sequence. Keep the original unbranded design and readable play space.
- Finish the pump/filter skid and connected supply/return pipework. A valve and simple housings do not yet communicate the complete circulation system described in MAC-05.
- Improve workpiece silhouettes and workholding, especially in the maze. Large disconnected brushed rectangles are readable obstacles but undersell the machine-shop setting.
- Add a subtle physical clue to the hidden Mini Mike recess. The renderer currently proximity-hides the pickup; the specified loose grille/task-light clue is absent.
- Keep strengthening local cutting-gap effects. Some long wire hazards read as glowing barriers rather than cutting machinery, especially when their guides and warning lamps are offscreen.

## Verification performed in this review

- Re-ran `test-mike-l2-mechanics.cjs`: pass, including unchanged dry physics, fluid transitions, valves, static recovery and machine behaviour.
- Re-ran `test-mike-l2-boss.cjs`: pass for all three orders, machine-time holds and pass recovery. This suite isolates boss rules; it is not a human difficulty test.
- Re-ran `test-mike-l2-routes.cjs`: pass; no lost pickups, unreachable required places, failed water gates or dead ends in its tested graph.
- Re-ran `test-mike-l2-browser.cjs` in isolated headless Chrome after a sandbox connection timeout: pass. Keyboard, touch, cancellation, pause, saves and recorded completion; no console/resource errors. Desktop frame-work p95 approximately 2.6ms. This does not establish real iPad performance.
- Inspected fresh captures of underwater traversal, tower platforms, reservoir valve, maze, boss and phone layout.
- Added `tools/review-mike-l2.cjs`: independently replays the supplied ordinary-input recording and reproduces the two bugs above. Results: [independent-review.json](l2-look/independent-review.json).

The recording finishes in **4:29**, collecting **36/56**, with **zero hits, zero deaths and zero camera use**; the boss occupies approximately **77 seconds**, including the victory delay. This is a planner's route with foreknowledge. It does not disprove the brief's exploratory 8–12-minute human target, nor prove comparable difficulty to Level 1. A same-player comparison remains necessary, including a direct route, exploratory route and repeat boss attempts. Do not inflate duration with forced waits just to hit a number.

Recommended next pass: fix the two reproduced bugs, restore an explicit repair hold helper, finish structural supports and the boss's visual identity, then tune challenge from human play. The room structure and fluid mechanics are worth keeping.
