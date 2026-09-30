# EDM refinement: emergency continuation

> **Current handover: [CODEX-HANDOVER.md](CODEX-HANDOVER.md), 29 September 2026, 20:30.** Read that first. This document is kept as history.


29 September 2026. Written BEFORE implementation at the owner's explicit request. If credits or the session end, read this first, then `edm-independent-review.md` and the latest owner revisions at the end of `OPUS-5.5-CONTINUATION.md`.

## Authorization and constraints

Owner: "Same thing, write a continuation doc for your credit limit, then start doing it yourself."
Authorized work: implement the review fixes and polish the existing EDM build. Preserve Level 1, the six EDM rooms, dry physics, 56 optional salvage, approved Mike puppet and seven voice clips without subtitles. Preserve the owner's later static-charge/earthing mechanic, Down-to-dive mapping, and meaningful valves. Do not reintroduce oxygen. No deployment, paid generation or broad unrelated edits needed.

## Current checkpoint

**Refinement implemented; verification passes.** Changed only Level 2 modules, its tests/recording, and documentation. `l2-world.js`: final saves resume completed arena; jets share growing reach; ending drains, cuts, opens door, then results; static cannot hurt Mike after repair. `l2-game.js`: explicit hold helper beside Mike, offscreen current-job arrow, ending camera follows sump/exit. `l2-art.js`: supported workpieces, grille clue, larger boss enclosure and connected pump/filter skid, calibrated tension/guide visuals, final cut animation. No Level 1 files or EDM collision geometry were edited.

Verification completed:
- `test-mike-l2-boss.cjs`: PASS all three orders, all three final-save recoveries, no duplicate bonus, drained/open exit before results.
- `test-mike-l2-mechanics.cjs`: PASS including unchanged dry movement and owner-approved fluid rules.
- `review-mike-l2.cjs`: now a regression suite, PASS real recorded playthrough plus the completed save and growing jet checks in normal/slow motion. Writes `l2-look/refinement.json`; original audit evidence `independent-review.json` is retained.
- `test-mike-l2-routes.cjs`: PASS no dead ends, no lost pickups or failed water gates.
- `test-mike-l2-alt.cjs`: PASS all six alternative routes, no damage.
- `VARIANT=1` / `VARIANT=2` with `test-mike-l2-run.cjs`: PASS ordinary-input runs at 265.1 / 287.3 seconds respectively, no deaths, 36 salvage. Default recording replays successfully in Node and browser in 274.75 seconds (36 salvage, zero damage/camera use).
- `test-mike-l2-browser.cjs`: PASS actual keyboard/touch, pause/save/reload, completed-save-to-results, no runtime/resource errors, full demo wins. Desktop work p95 approximately 2.6ms; this is not an iPad benchmark.
- Fresh desktop/phone views inspected for the supported maze, expanded boss, hold helper and restoration. The last capture pass pins the helper test to variant0 so persistent test-profile progression cannot point at a different socket.
- Five pre-EDM Level 1 reference files verified unchanged after newline normalization.

The demo recording only gained 400 empty-input frames at its end for the longer automatic restoration; gameplay inputs were retained. The run generator now waits up to ten seconds for restoration instead of assuming a 3.4-second ending. The review builder prefers the latest regression completion time and includes the new helper/ending captures. Owner playtest wording was corrected to distinguish documented previous feedback from the outstanding comparative playtest.

If interrupted while the last browser capture refresh is running, poll its exec session, inspect `repair-helper.png` and `phone-repair-helper.png`, then run `node tools/build-mike-l2-review.cjs`. No game implementation work is waiting on that refresh.

## Work plan

1. Restore a completed boss save into a valid completed arena and ending; it currently has done=true/on=false and cannot finish or move.
2. Give jets one shared growing segment for artwork, collision and force. They currently damage at full reach immediately.
3. Add the explicit Hold E to fix / Hold to fix helper and guidance toward offscreen service points, showing only the current target.
4. Finish the restoration sequence before results. Prefer a staged automatic ending that shows the drained cell, completed cut and opening exit; preserve ordinary-input demo compatibility. Restored saves must also finish.
5. Add recessed workholding supports and clamps to the floating maze blanks; retain collision geometry and open swim paths. Add a subtle grille/task-light clue to the hidden life.
6. Strengthen the boss enclosure, connected wire path, guide/tensioner/workpiece assembly and pump/filter skid. Add visible job-specific restoration states. Keep danger and playable ledges readable, no branding.
7. Run targeted regression tests, existing mechanics/boss/routes/browser suites and inspect fresh desktop/touch screenshots. Update status docs and this handover. Human challenge comparison and physical iPad validation must remain honestly unverified.

## Files and tools

- Game: `public/fireworks/mike-game/level-2.html`, `js/l2-world.js`, `js/l2-art.js`, `js/l2-game.js`, `js/l2-audio.js`.
- Geometry authoring: `tools/build-mike-level2.cjs` generates `level-2.json`. No geometry changes planned for the initial repair/polish pass.
- Review: `docs/mike-platformer/edm-independent-review.md` and `l2-look/independent-review.json`.
- Reproduction: `node tools/review-mike-l2.cjs` replays the real recorded run, captures its final-repair save and isolates the early jet hit.
- Suites: `node tools/test-mike-l2-mechanics.cjs`, `node tools/test-mike-l2-boss.cjs`, `node tools/test-mike-l2-routes.cjs`, `node tools/test-mike-l2-browser.cjs`.
- Ordinary-input planner: `tools/test-mike-l2-run.cjs`; recorded inputs `demo-2.json`. Do not regenerate a valid recording unnecessarily.
- Review gallery: `docs/mike-platformer/l2-look/index.html`; builder `tools/build-mike-l2-review.cjs`.
- URL: `http://localhost:8788/mike-game/level-2.html`. Existing server is `node tools/serve-fireworks.cjs 8788`.
- Browser runtime currently reports no available browsers. Existing isolated headless Chrome harness works outside the sandbox with normal tool escalation; port9352/profile `.wrangler/mike-l2-test`. Never use a personal browser profile.

## Preservation checks

Before this pass, the five pre-EDM snapshots matched after newline normalization: `.wrangler/edm-baseline-{game.js,machines.js,nightshift.js,index.html}` and `.wrangler/mike-level1-approved-before-edm.json`. Do not run the stale `tools/revise-mike-encounters.py`: it destroys later Level 1 authoring fixes. The workspace contains unrelated changes; do not reset, clean, stage everything or deploy it.

## Review baseline

Existing suites pass but missed the final-save and early-jet bugs. Recorded completion:269.38sec,36/56 salvage,zero hits/lives lost/camera use; boss77.22sec. These are planner measurements, NOT human difficulty. Latest desktop browser work p95~2.6ms, no runtime/resource errors. User playtest revisions are documented; "never played by a person" is stale wording in older docs.

## Next action if interrupted now

The review's bounded refinement pass is complete. Human playtesting of difficulty/clarity against Level 1 and testing on a physical iPad remain. Do not claim these were done by the automated planner. Campaign navigation and deployment remain separate decisions; nothing was committed or deployed. Keep the six rooms and owner-approved controls intact when responding to new playtest feedback. Do not restart the design or overwrite Opus's completed level.

## Independent verification after the session ended (Claude, 29 September, 16:55 to 17:10)

The owner asked for the level's real state to be checked against this document. **It matches. The refinement pass finished, including the last capture refresh; nothing is waiting.**

Evidence, from a fresh rerun of everything rather than from the result files:

| Claim above | Found |
|---|---|
| Final saves resume the completed arena | Confirmed. `review-mike-l2.cjs`: after loading, boss on and done, won, not stalled. `test-mike-l2-boss.cjs`: `finalSaveResumes`. |
| Jets share one growing reach | Confirmed. No hit at first active moment, hit once the stream arrives, passes while filming. |
| Ending drains, cuts, opens the door, then results | Confirmed. Sump at 23.6 of 23.6 when results appear. It is automatic: Mike stands at x 480.9, the exit is at x 500. |
| Hold helper and off-screen arrow | Confirmed in `repair-helper.png` and `phone-repair-helper.png`. |
| Supported workpieces, grille clue, larger boss enclosure, pump and filter skid | Confirmed in `r5-maze.png`, `boss-idle.png`, `restoration-exit.png`. |
| No Level 1 file edited | Confirmed against the live site by hash, all ten files, newline-normalised. |
| No collision geometry edited | Confirmed. `level-2.json` and its builder are untouched since 11:42; routes, gates and dead-end checks pass. |
| Owner's directions preserved | Confirmed. Two wheels, twelve water gates, `S.static` with no air supply anywhere, Down dives in the fluid. |
| Suites | All pass: mechanics, boss, routes, alt, review, run in all three orders, browser, plus Level 1 routes and the tank prototype. |
| Recording | `demo-2.json` not regenerated. It replays to a win in 274.8 s in the browser. The runs were made with `NO_RECORD=1`. |

Differences from the figures above, none of them faults:

- Desktop frame work measured 3.4 ms at the 95th percentile on this rerun, against 2.6 ms above. Both are far inside budget and neither says anything about an iPad.
- The route report used to count places Mike can only ever swim to as not reached, so the gallery read "99 of 113 standing places". The report now counts them, and the gallery was rebuilt.

One thing for the owner, not a fault: the helper is words ("Hold E to fix", "EXIT RESTORED") and the workpieces carry small stencilled labels. His standing rule for this game is few helpers and pictures over words. Level 1's boss already carries the same "Hold E to Fix" wording with his approval, so it has been left as built for him to judge in play.

Still outstanding, exactly as stated above: a comparative difficulty playtest against Level 1, a physical iPad, the Level 1 link, the prototype's removal, and any deploy.

## The camera in a boss: clips (owner's decision, 29 September evening)

**This changes Level 1 as well as Level 2, on the owner's instruction. Level 1's local files no longer match the live site. Nothing is deployed.**

The owner's three requirements, in his words: slow motion must be used on bosses; if the game needs slow motion, the repair must fit inside the slow motion window; slow motion must not be a way to cheat the boss. He also required that Boss 1 and Boss 2 never differ, and that collecting SD cards is never punished.

What was wrong in both bosses: a repair while filming moved the machines on by 0.44 s of their own time, the card refilled itself during the fight, and one press could film for as long as the card lasted. A full card could cover several repairs and the walks between them.

The rule, in `js/world.js` (`M.CLIP`, `stepClips`), switched on by each game while its boss is awake (`cam.boss`):

| | Value | Where |
|---|---|---|
| Clip length | 3 s | `CLIP.length` |
| Loading the next clip | 0.6 s, and the player must press | `CLIP.load` |
| Recharge of the one clip that comes back | 0.2 s of footage per second: 15 s for a clip, 25 times slower than loading | `CLIP.recharge` |
| Repair | 2.2 s of Mike's own time, in both bosses | `boss.hold` |

- One press films one clip, then the camera stops by itself. It will not start on less than a whole clip.
- SD cards are spare clips, never a longer clip. Boss 1 with all 9 cards: 4 clips for 9 repairs. Boss 2 with all 4 cards: 3 clips for 6 repairs.
- Spare clips do not come back during the fight. One clip always does, slowly, so nobody is left without the camera. A lost life gives the whole card back.
- Outside a boss the camera is exactly as it was.
- The viewfinder shows the time left in this clip and the clips still on the card. The card's bar is cut into clips.

Files changed: `js/world.js`, `js/game.js` (one line of rule, three of display), `js/demo.js` (Level 1's autopilot knows a clip is 3 s), `js/l2-world.js`, `js/l2-game.js`. Copies from before the change are in `.wrangler/mike-before-clips/`.

Suites: new `node tools/test-mike-clips.cjs` measures the rule and checks both levels use it. All existing suites pass for both levels. Level 1's autopilot now wins in 5:00 instead of 4:08, because it waits for its clip to come back; it loses no life.

**Not done, and still the owner's first requirement:** Boss 2's machines leave safe gaps of 3.8 s or more at every service point at normal speed, so its repairs can still be made without the camera. Boss 1 forces the camera on 6 of its 27 repairs. Tightening Boss 2 is a tuning job in `tools/build-mike-level2.cjs` and has not been asked for yet.

The earlier line in this document that the five pre-EDM Level 1 files are unchanged was true when written. It is no longer true of `game.js`.
