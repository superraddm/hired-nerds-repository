# The Night Shift — version 3

27 September 2026. Play the local build at http://localhost:8788/mike-game/.
The [review gallery](nightshift-look/index.html) has current screenshots, the route map and all seven voice auditions.
This build has not been deployed.

## The design change

Version 2 added length but repeated similar bays and left a fast floor route. Version 3 replaces those ten bays with different layouts and movement problems. The width remains 960 tiles; this revision focuses on the decisions within that space.

| Encounter | Main challenge | Alternative or reward route |
|---|---|---|
| The broken bridge | A 33-tile floor gap crossed on stepped landings | Higher crane platforms |
| Cross-feed climb | Reversing conveyors climb over a solid transfer bed | Overhead platforms above the working head |
| The press gauntlet | Staggered press and gallery timings | Maintenance climb over the first press |
| Switchback tower | Direction changes while climbing above a wide trench | Narrow platforms above the bridge |
| Coolant reservoirs | Offset jets and isolated tank landings | A high route clear of the fluid |
| The service lift | Board a moving deck and ride 8.8 tiles upwards | Higher branch above the bridge |
| The chip tunnel | Low-ceiling jumps, reversing belt and a lathe exit | Climb onto the tunnel roof |
| Opposed traverses | Two offset spindle cycles above a gap | A higher crossing |
| The mill spine | Traverse solid machine beds | A backtracking secret loft |
| The last transfer | Conveyor launch, descending landings and a final press | An upper collection branch |

There are 134 platforms, 25 hazard units and nine checkpoints. Fewer repeated platforms and hazards replace version 2's 190/33 counts. Long gaps, solid beds and the lift prevent simply staying on the floor. Mike's jump, acceleration, coyote time and input buffering are unchanged.

The machine artwork remains the fictional, unbranded workshop design approved by the owner. The new service lift adds guide rails, cables, a warning-striped deck and visible continuous motion.

## Collection and repair

The 56 bearings, seals, couplings and control units are now **salvage**. They score points and fill a single **Salvage 0/56** counter. Best collection is saved locally; collecting all 56 awards a 1,000-point bonus. SD cards still increase camera capacity, lubricant restores health, and the hidden Mini Mike grants an extra life.

Salvage is neither required nor spent on repairs. Mike uses his tools at three service points: **Drive, Coolant and Control**. Each takes a 3.2-second uninterrupted hold. Moving, releasing Fix, jumping or getting hit cancels progress. The active point flashes; the HUD says **Hold E to Fix** (or **Hold the wrench to Fix** on touch), explains the action, and states that salvage is a collection.

The old recipe board and reclaim dispenser are removed. The boss can be fully repaired after collecting zero items. Its three indicators match the three actions. During the final dual-head phase a marked centre refuge sits between the two cutting envelopes; jumping across a head is still possible.

The extra life is hidden behind a service grille in the mill spine's backtracking upper branch. Its location is omitted from the public-facing route map.

## Visibility and moving hazards

Hold **Down or S**, or the touch down button, to pan smoothly down by up to five tiles. Release to return. The camera keeps Mike visible and stops at normal floor framing. This reveals lower landings without requiring a blind drop; it does not move the player or pause hazards.

Travelling spindles now have one continuous cycle: raised pause, lower, cutting traverse, retract at the far end, then a visible raised return. Their cutting tips cross Mike's route at body height; the return clears his head. Render and damage positions share the same function. There is no teleport at the cycle boundary.

## Voice

The exact saved explainer identity, `voice_h0dygekvdjzv` with `gemini-3.8-flash-tts`, is retained. The source is pinned in [voice-source.json](voice-source.json), verified from `Y:/MTD-Client-Files/mike-explainer/out/assets/voice-final/manifest.json`.

The new generation direction calls for urgency, clear projection and animated action delivery. The seven lines are exactly:

- Nice one!
- Get in!
- Ey Up!
- Ow! Pack it in!
- Ooof!
- Flipping Heck
- Right then. Let's get this lot sorted.

There are **no voice subtitles** and no longer explanatory speeches. Reactions rotate with cooldowns, the boss entry line has priority, and speech ducks the music. The audio remains unfiltered to preserve the voice identity. All files preload; the game makes no runtime voice-service calls. The gallery provides individual auditions because technical playback checks cannot establish subjective delivery approval.

## Verification

- `node tools/test-mike-routes.cjs`: real jump/collision physics reaches every maintenance platform, including the hidden-life branch. Lift endpoints are connected as a ride; moving carriage behaviour is checked separately in the browser suite. This is a geometry test, not a claim that every optional route is damage-free.
- `node tools/test-mike-nightshift.cjs`: full ordinary-input traversal, 56-item count, zero-salvage full boss repair, cancellation, two full centre-refuge cycles, live spindle damage, continuous safe returns, lift ascent/descent, blocked floor shortcut, save/continue, look-down distance and release, actual keyboard events, simultaneous touch run/jump and touch-cancel release, voice playback and no browser/resource errors.
- `node tools/test-mike-nightshift.cjs --voice-only`: exact seven-line script, original voice/model, file hashes, decoded power/pain playback, mute, no subtitles and no downloads during play.
- `node tools/test-mike-game.cjs physics`: existing jump, movement, input grace and camera regression checks pass.

The authored controller completes in **4:08**, collecting **38/56 salvage**, with no lost lives. It knows the route, predicts jump trajectories and hazard timing, and waits for gates. It is a completion check, not a human difficulty benchmark. A human can still speedrun; the claim here is greater route variety and mandatory vertical traversal, not a measured threefold difficulty increase.

Current desktop frame-work p95 is approximately 2.3 ms in the local isolated Chrome test. Phone and iPad screenshots use viewport emulation, not physical-device performance measurements.

## Owner revision, 27 September afternoon (Claude)

Jof played v3 and asked for four changes, "without modifying anything else". Everything else in v3 is untouched.

1. **A reason machines stand off the floor.**
   - The coolant reservoirs over the sump stand on braced steel columns rising from the pit, with a cradle under
     each tank.
   - Background turning cells over a pit stand on a mezzanine frame.
   - Travelling-spindle rails hang from the roof on tie rods with brackets.
   - All of these are drawn (`A.machineSupports`, `A.stand` in `js/nightshift.js`); no collision changed.
2. **The boss is much harder.**
   - Three service points on three levels: 1 Drive on the floor (x 941), 2 Coolant on the middle deck (948, y 8.5),
     3 Control on the top deck (955.25, y 6.5). Four new decks in the arena reach them.
   - Nine repairs: each point three times, in one of three learnable orders:
     - 1 3 2 3 2 1 2 1 3
     - 2 1 3 1 3 2 3 2 1
     - 3 2 1 2 1 3 1 3 2
     Each order starts at a different point, so the first repair tells you which one it is. Each finished run
     moves to the next order.
   - A HUD strip shows the order with the current repair flashing. Holding Fix at the wrong point gives a soft
     refusal and nothing else.
   - Holds are 2.2 s. Both heads attack all the time, on a 4.5 s cycle (tell 0.7, reach 0.4, sweep 1.3, pull back
     0.7, parked 1.4). The first sweeps the level of the point being repaired; the second sweeps the next point's
     level, half a cycle later. It joins only after half a cycle, so nobody is hit on arrival.
   - Every third repair finishes a round, with a 1.2 s pause. A lost life restarts the current round.
   - The autopilot, which knows every future head position, now needs about 63 s and takes hits.
3. **Power-ups look different from salvage.**
   - Power-ups float in a bright pulsing bubble with a badge: lubricant green with a plus, SD card amber with a red
     REC dot, mini Mike gold with a star. They announce what they did: +1 HEALTH, +1.5s FOOTAGE, EXTRA LIFE.
   - Salvage sits on a plain turning steel hex tag, with no glow.
4. **Collecting pays.**
   - Every 10 salvage pays a growing bonus: +250, +500, +750, +1,000 and +1,250, shown in a centred pop-up. The
     full 56 still pays +1,000.
   - The salvage bar marks every 10.
   - A new SCORE readout pops on every gain. It turns gold, flashes NEW BEST and shows a NEW HIGH SCORE! pop the
     moment you beat the saved best.

Tests:
- `tools/test-mike-nightshift.cjs`'s boss checks are updated to the new rules: nine-repair zero-salvage
  completion, both floor refuges surviving floor sweeps, three levels, the order structure, a wrong point not
  counting, a lost life restarting the round, and the 10-salvage bonus.
- All pass, as do `test-mike-routes.cjs` and `test-mike-game.cjs physics`.
- The autopilot's boss routine in `js/demo.js` predicts both heads with the game's own `bossTips(time)`. The full
  demo wins, 7,650 points, no lives lost.

The review gallery (`nightshift-look/`) has not been regenerated.

### Second owner pass, 27 September (Claude)

- **The pillar drill in section 1 is a real hazard.**
  - Its spindle stands over the walkway. Every 3 s of machine time: an amber tell with the bit spinning up, then
    it feeds down to chest height (tip at y 11.0), drills and retracts.
  - The bit hurts only while it is low. The camera slows it like any machine.
  - One pose function, `M.drillPose` in `js/world.js`, drives the drawing, the damage and the autopilot.
- **No dead ends.**
  - The problem: falling from the upper route into the two floor pockets between the Mill Spine's machine beds
    (x 816–827 and 832–843) trapped Mike, because the walls are 4.4T high and a jump reaches 3T.
  - The fix: a grating step in each pocket, 2.4T up, climbs back onto the bed.
  - `tools/test-mike-routes.cjs` now splits every sector's floor at each wall and proves, with the real jump
    physics, that every floor stretch reaches its sector's exit. It uses belts running the useful way and counts
    machine tops as landings. It found exactly these two pockets, and it now guards the whole level.
- **The repair order is never shown.**
  - The HUD shows only nine progress pips, grouped in threes, and the round.
  - The next point still flashes (a pulsing arrow and glow with its name); Jof asked for that marker back as
    important. Only the order as a whole is hidden. The wrong point buzzes and flashes red.
  - The prompt reads "Go to the flashing service point and hold."
- **Deployed** to https://kpopboom.party/mike-game/ on 27 September. The live files match the local copy byte for
  byte, and the front door is unchanged.

All suites pass: routes (with the dead-end check), Night Shift (with a drill check), and `test-mike-game.cjs physics`.

## Next level

The [wire EDM proposal](nightshift-review.md#proposed-level-2--below-the-wire) remains the next direction: a sealed cartoon service suit with a visible visor, dry tank-rim routes, pump-controlled fluid heights and buoyant submerged passages. Glasses alone are not the drowning-prevention mechanic. Prototype one tank, valve and guide hazard first. Future collections should remain optional salvage, with tool-based repairs, rather than bringing back recipe inventory.

The EDM stage is a proposal, not an implemented level. The results screen identifies it as a concept.
