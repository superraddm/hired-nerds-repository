# Historical handover ? superseded

Archived 30 September 2026. Read CODEX-HANDOVER.md for the current implementation and test results. The timings, open issues and authorization statements below describe the earlier build.

Written by Claude (Fable 5.1), 29 September 2026, 20:30. Every statement under "Verified" was rerun at that time, not copied from a result file.

**Read this first.** It supersedes the status in `OPUS-5.5-CONTINUATION.md` and `EDM-REFINEMENT-CONTINUATION.md`. Those two are kept as history and are still accurate about how things were built.

## Status in five lines

1. Level 2 is complete and playable from start to results: `http://localhost:8788/mike-game/level-2.html`.
2. Your refinement pass finished, including the last capture refresh. I verified every claim in your document. Nothing of yours was left half done.
3. The owner has played Level 2 and given five directions. All five are built. Two of them landed after your pass: see "What changed after your pass".
4. **Level 1 has been edited, on the owner's instruction.** Three of its files no longer match the live site. Your preservation check on `game.js` will now fail, by design.
5. Nothing is deployed, committed or pushed. No paid service was used.

## The owner's decisions

These are the owner's own words or direct rulings. They override `edm-level-design.md`, `edm-asset-brief.md` and anything in the older handovers.

| # | Decision | Consequence in the build |
|---|---|---|
| 1 | A switch must have a point. "It doesn't seem to matter if the water level is up or down." | Two wheels in the level, not six. One inside the Guide tower shaft, one on the Split reservoir divider. Both must be turned to finish. |
| 2 | Mike wears a helmet, so he cannot run out of air. The timer mechanic is good; the reason was wrong. | Static charge. Field `S.static`, 0 rising to `W.limit` (24). Sheds at `W.shed` (8 per second) with the helmet out of the fluid or in an earthing bell. **Never bring an air supply back.** |
| 3 | Down and S dive. | One control: look below on dry land, dive in the fluid, view leads the dive. X still dives. One touch button. Mapped in `l2-game.js` `readInput`; the rules still take `dive` and `lookDown` separately. |
| 4 | Slow motion slows hazards. It never slows Mike or his actions. | Repair hold runs on real time: `B.fix += dt/def.hold`. Same as Level 1. |
| 5 | Boss 1 and Boss 2 must never have different slow motion mechanics. | One rule in shared `js/world.js`, used by both. |
| 6 | Slow motion should be needed on a boss. The repair must fit inside the slow motion window. Slow motion must not be a way to cheat the boss. Collecting SD cards must never be punished. | The camera shoots in clips in a boss. See below. Requirement "needed" is met only in part: see "Open items". |

Earlier standing directions, still in force: no real machine-tool brands, logos, liveries or recognisable shapes; nothing heavy floats without a visible support; no dead ends; the boss repair order is never shown, only the next point flashes; few helpers, pictures over words; Mike is never redrawn; seven approved voice lines only, no subtitles.

## What changed after your pass

Your document's checkpoint is 16:42. These came after.

### 1. Repair hold moved to real time (about 17:20)

`js/l2-world.js`: `B.fix += dt/def.hold`. It was `dtm`. The brief's "machine-time calibration" is withdrawn by decision 4. `tools/test-mike-l2-boss.cjs`: `holdRunsOnMachineTime` is replaced by `filmingNeverSlowsMike`.

### 2. Camera clips in a boss, both levels (19:42)

Rule in `js/world.js`:

```js
const CLIP = M.CLIP = { length:3, load:0.6, recharge:0.2 };
M.clipsLeft = C => Math.floor((C.left + 1e-6)/CLIP.length);
// M.stepCamera(C, pressEdge, dt) calls stepClips when C.boss is true
```

| Behaviour | Value |
|---|---|
| One press films | 3 s at most, then stops by itself |
| Camera starts only on | a whole clip (`left >= 3`) |
| Next clip ready after | 0.6 s, and the player must press |
| SD cards | spare clips, never a longer clip |
| Recharge inside a boss | one clip only, 0.2 s of footage per second, 15 s for a clip |
| Spare clips | do not return during the fight; a lost life returns the whole card |
| Outside a boss | unchanged: `CAM = { scale:.2, base:3, perCard:1.5, max:12, cooldown:1, refill:.5 }` |

| | Boss 1 | Boss 2 |
|---|---|---|
| Repairs | 9 | 6 |
| SD cards in the level | 9 | 4 |
| Clips with every card | 4 | 3 |
| Clips with no cards | 1 | 1 |

Each game sets the flag just before stepping the camera:

- `js/game.js`: `CAMR.boss = B.on && !B.done;`
- `js/l2-world.js`: `S.cam.boss = B.on && !B.done;`

Display, in both `game.js` and `l2-game.js`: the viewfinder shows "LEFT IN THIS CLIP" and "n MORE CLIPS"; the card bar is cut at each clip.

`js/demo.js`: Level 1's autopilot now assumes one clip at most and waits for a whole clip before filming. It wins in 5:00, up from 4:08, with no life lost.

### 3. Route report count

`tools/test-mike-l2-routes.cjs` counted places Mike can only swim to as not reached, so the gallery read "99 of 113". It now reports `reachable` and `onFoot` separately. No level change.

## Level 1 is no longer identical to live

| File | Against `https://kpopboom.party/mike-game/` |
|---|---|
| `js/world.js` | **Changed** |
| `js/game.js` | **Changed** |
| `js/demo.js` | **Changed** |
| `index.html`, `level-1.json`, `js/art.js`, `js/machines.js`, `js/nightshift.js`, `js/audio.js`, `js/puppet.js` | Same, newline-normalised |

- Copies from immediately before the clip change are in `.wrangler/mike-before-clips/`: `world.js`, `game.js`, `demo.js`, `l2-world.js`, `l2-game.js`. The three Level 1 copies there equal the live files.
- Your baselines `.wrangler/edm-baseline-game.js` and friends still describe the live Level 1. Comparing `game.js` with its baseline now shows the clip lines and nothing else.
- `tools/revise-mike-encounters.py` is still never to be run.

## Verified at 20:30

| Command | Result |
|---|---|
| `node tools/test-mike-clips.cjs` | Pass. 11 checks on the rule; both levels switch it on |
| `node tools/test-mike-l2-mechanics.cjs` | Pass |
| `node tools/test-mike-l2-boss.cjs` | Pass. Includes your `finalSaveResumes` and `restorationBeforeResults` |
| `node tools/test-mike-l2-routes.cjs` | Pass. 113 of 113 places, 66 pickups, 12 water gates, no dead ends |
| `node tools/test-mike-l2-alt.cjs` | Pass. Six routes, no hit |
| `node tools/review-mike-l2.cjs` | Pass. Your regression suite |
| `NO_RECORD=1 node tools/test-mike-l2-run.cjs 6` | Pass. 274.7 s, 36 of 56, no hit. `VARIANT=1`: 265.1 s. `VARIANT=2`: 287.3 s |
| `node tools/test-mike-routes.cjs` | Pass. Level 1, no dead ends |
| `node tools/test-mike-edm.cjs` | Pass. Tank prototype |

Run at 19:50, after the last code change, and not rerun at 20:30:

| Command | Result |
|---|---|
| `node tools/test-mike-l2-browser.cjs` | Pass. Recording wins in the page in 274.8 s. Work p95 3.1 ms on this PC |
| `node tools/test-mike-nightshift.cjs` | Pass. Level 1 autopilot wins, 303.5 s |
| `node tools/test-mike-game.cjs physics` | Pass. Level 1 movement and camera outside a boss |

No file under `public/fireworks/mike-game/` has changed since 19:43.

## Files

| Path | What it is |
|---|---|
| `public/fireworks/mike-game/level-2.html` | Page. `?room=1..6`, `?scene=<name>`, `?demo=1`, `?lab=1`, `?test=1` |
| `public/fireworks/mike-game/level-2.json` | **Generated.** Edit `tools/build-mike-level2.cjs`, then run it |
| `js/l2-world.js` | Rules, `MIKE.L2`, no drawing. Runs in Node |
| `js/l2-art.js` | Art, `MIKE.art2` |
| `js/l2-game.js` | Loop, input, camera follow, HUD, saves, scenes, hooks `window.__l2` |
| `js/l2-audio.js` | Water and static sounds on their own context. `audio.js` is not edited |
| `js/world.js` | Shared. Dry physics and the camera, including clips |
| `demo-2.json` | Recorded run, variant 0. Last written 16:34 by you |
| `tools/mike-l2-lib.cjs` | Test player. `travel()` searches go on, wait, step back on copies of the game |
| `tools/measure-mike-boss-windows.cjs` | New. Read-only. Longest safe gap at each service point, both bosses |
| `docs/mike-platformer/l2-look/` | Gallery, map, result files. Rebuilt 19:50 |

## Rules for working here

- Edit the builder, not `level-2.json`.
- After a geometry change run, in order: routes, run, alt, browser.
- Use `NO_RECORD=1` with `test-mike-l2-run.cjs`. Without it, variant 0 overwrites `demo-2.json`.
- Ports: Level 2 browser suite 9352, profile `.wrangler/mike-l2-test`. Level 1 suite 9346. Prototype 9351. Server `node tools/serve-fireworks.cjs 8788`, running now.
- The browser test profile keeps `bossRuns` in localStorage, so the boss variant advances between runs. Your capture pass already pins variant 0; keep that.
- Node's `vm` context makes cross-realm arrays. `assert.deepEqual(L.errors, [])` fails on an empty array. Compare lengths.
- The workspace has 618 unrelated changed or untracked paths. Do not reset, clean, stage everything or deploy.
- `tools/deploy-kpopboom.sh` stages the whole `mike-game` folder.

## Open items

Nothing here has been asked for. Each needs the owner's word before work starts.

| Item | State | Evidence |
|---|---|---|
| Boss 2 does not yet need the camera | Longest safe gap at normal speed: flush 3.78 s, tension 3.87 s, align 9.9 s. The hold is 2.2 s. The recorded run uses 0 s of camera | `node tools/measure-mike-boss-windows.cjs` |
| Boss 1 needs the camera on some repairs only | 6 of 27 repairs have a gap under 2.2 s. Shortest 1.68 s | Same tool |
| Words on screen | "Hold E to fix", "EXIT RESTORED", "FIXTURE / 374" labels. The owner's rule is few helpers and pictures over words. Level 1's boss carries the same "Hold E to Fix" with his approval. I flagged it to him; no answer yet | `repair-helper.png`, `restoration-exit.png`, `r5-maze.png` |
| Clip numbers | 3 s, 0.6 s and 15 s are my choice. The owner approved clips and "recharge much slower than loading"; he has not yet played them | `M.CLIP` in `js/world.js` |
| Level 1 does not link to Level 2 | Level 2 links back. Level 1's results card only teases the next level | `js/game.js` `drawResultsCard` |
| Prototype still in the game folder | `edm-prototype.html`, `js/edm-world.js`, `js/edm-prototype.js` would be published with any deploy | |
| Deploy | The live site has the old camera in Boss 1 and no Level 2 | |
| Difficulty against Level 1 | Not measured by a person. The planner's times are completion proofs only | |
| Real iPad 5 | Not run. Emulation only | |
| Static near a cutting wire | Idea only: build faster close to an active wire. Offered to the owner, no answer | |
| Underwater music filter | Not built. Would need an edit to `audio.js` | |

If the owner asks for Boss 2 to need the camera: the numbers to change are the fault's wire and jet cycles in room 6 of `tools/build-mike-level2.cjs` (`wB1`, `wB2`, `n6a`, `n6b`). Target a longest safe gap under 2.2 s and over 0.44 s at each point. Keep the two quiet seconds at the start of each pass. `tools/test-mike-l2-run.cjs` does not film in the boss, so its boss routes will need the camera added: `travel()` waypoints accept `film:true`.

## Working with the owner

- He tests as you build and reports in short messages.
- **When he says he is asking a question, answer it and change nothing.** I changed the game on a question once today and he corrected me.
- When he states how something must work, that is an instruction.
- He wants identical behaviour across levels for anything shared.
- He does not want players punished for collecting.
- Say plainly when something is unverified. He has asked for that more than once.
