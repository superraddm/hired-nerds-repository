# Mike the Mic: build notes

> **Current handover: [CODEX-HANDOVER.md](CODEX-HANDOVER.md), 29 September 2026, 20:30.**


## The camera shoots in clips in a boss, both levels (29 September 2026, evening)

The owner's decision. In a boss one press films for 3 seconds, SD cards are spare clips, the player loads each clip by
pressing, and the one clip that returns by itself takes 15 seconds. Repairs take 2.2 seconds of Mike's own time in both
bosses. **This edits Level 1** (`js/world.js`, `js/game.js`, `js/demo.js`); the local copy no longer matches the live
site and nothing is deployed. Details and numbers: the last section of
[EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md). Suite: `node tools/test-mike-clips.cjs`.

## Level 2 review refinements (29 September 2026, Codex)

Current handover: [EDM refinement continuation](EDM-REFINEMENT-CONTINUATION.md). The final-repair save lock and premature jet damage are fixed. Repairs have an explicit hold helper; workpieces have recessed supports and clamps; the boss has a connected enclosure, wire path and pump/filter skid. A staged drain/cut/exit sequence completes before results. Level 1 and the EDM route geometry remain unchanged. See the [current gallery](l2-look/index.html) and its regression results. No deployment has been made.

## Level 2, Below the Wire: built and playable (29 September 2026, Claude)

Level 2 can be played from start to the repaired fault at http://localhost:8788/mike-game/level-2.html.
Start with the [review page](l2-look/index.html), then the progress log at the end of the
[continuation document](OPUS-5.5-CONTINUATION.md), which lists every file, every suite and every open decision.
Level 1 is untouched and still matches the live site. Nothing is deployed or committed.
The owner played it once on 29 September; his three directions (every wheel must have a point, static instead of air,
Down dives) are built, and Codex's review refinements followed. Not yet done: a comparative difficulty playtest against
Level 1, and a run on a real iPad.

## EDM design and mechanics slice (29 September 2026)

The current Level 1 is preserved as the owner's explicit styling, mechanics, difficulty and variety reference.
Start with [EDM layout and design](edm-level-design.md), [asset production brief](edm-asset-brief.md),
[visual review](edm-look/index.html), and the [Opus 5.5 emergency handover](OPUS-5.5-CONTINUATION.md).
The separate playable slice is http://localhost:8788/mike-game/edm-prototype.html. It is not the full Level 2.
Mechanics and browser/touch checks pass; full encounter tuning and campaign integration remain.

## Version 3: varied encounters, salvage and look-down (27 September 2026)

Start with [nightshift-v3-review.md](nightshift-v3-review.md) for the current implementation and verified checks.
Ten different bays replace the repeated extension. Collect 56 optional salvage items; repair the boss at three
tool-based service points with no inventory requirement. The same explainer voice now uses seven short action
reactions, without subtitles. Travelling spindles visibly retract and return. Hold Down/S or the touch down
button to inspect lower landings. The machine artwork remains unbranded and preserves the approved designs.

The local preview is http://localhost:8788/mike-game/. [Current gallery and voice auditions](nightshift-look/index.html).
The notes below describe earlier revisions.

## Version 2: The Night Shift (27 September 2026)

The owner's request for a much longer, taller, more demanding and visually richer version is implemented.
Start with [nightshift-review.md](nightshift-review.md) for the current design, changes, voice details, tests and
proposed EDM follow-up. The new review gallery is [nightshift-look/index.html](nightshift-look/index.html).
The sections below describe the older version and its original tests; they are historical notes.

Current game: `http://localhost:8788/mike-game/`. New full integration check:
`node tools/test-mike-nightshift.cjs`; route geometry: `node tools/test-mike-routes.cjs`.
No deployment has been made.

## Stage 2: the full level (26 September 2026)

Built on Jof's go ("looks good to build out full level") together with his notes from playing the strip.

### Play it

- **On a phone or iPad:** the private artifact <https://claude.ai/artifact/8C2gJkNasrSDeNkCGJHH2Y> (the same files, served by claude.ai).
- **On this PC:** run `node tools/serve-fireworks.cjs 8788`, then open <http://localhost:8788/mike-game/>.
  - `?demo=1` watches the autopilot play the whole level.
  - `?lab=1` adds the read-out (position, machine clock, frame and work percentiles).
  - `?section=1-3` is the old test strip; `?scene=<name>` gives the stills.
- **Captures:** `docs/mike-platformer/look/index.html` (played-through frames, every scene, device sizes).
- **Nothing is committed or deployed.** Deploying to kpopboom.party would also publish the other uncommitted work in
  `public/fireworks/`, so that is Jof's call.

### What the owner changed, and how it was built

1. **Gates are timed by a traffic light, not a countdown.** The gallery, the spindle gate and the press each have a
   signal on the entry pad: red while shut, amber just before opening, green while open. The doors are open 0.5 s
   (0.6 s for the 4T spindle gate); amber lasts 0.35 s before that. Crossing takes about 0.7 s from the pad, so
   without the camera the closing doors put Mike back at the entry with one hit. Pressed on amber or on green, the
   camera gives well over a second of open doors. The design asked for 0.30 / 0.40 / 0.45 s windows with the camera
   pressed before opening; nobody could react to that (Jof's test).
2. **Few helpers; visual cues and familiar mechanics.** There are no text banners. What remains:
   - two keycap boards at the start of Level 1: ← / → run, Space jump, and C camera (on a touch device they show
     the on-screen buttons instead)
   - one "E hold to fix" board in the arena, because holding a key cannot be guessed
   - the traffic lights, the arrow over the boss socket, and the free spares popping out of the bench machine
3. **Slow motion is an in-camera effect.** While filming, the HUD steps aside for a camcorder viewfinder:
   - heavy corner brackets and a frame line with thirds ticks
   - a blinking ● REC, 120 FPS and SLOW ×0.2
   - the seconds of footage left on the card, with a card-capacity bar
   - a green focus box on Mike and a light edge vignette
4. **The camera runs on footage.**
   - The card starts with 3 s, which clears any gate. Each of the five SD cards in the level adds 1.5 s, up to 10.5 s.
   - Filming uses footage second for second. After stopping there is a 1 s pause, then the card frees 0.5 s per
     second, so no one is ever stuck; more footage just means longer slow motion.
   - The HUD shows the seconds left.
   - SD cards: section 1 x29.5, section 4 on the right shelf, section 5 x23, section 7 over the middle belt,
     section 8 x20.
5. **The extra life is a mini Mike the Mic**, drawn from the real puppet, waving. It sits where the design had the SD card
   (section 6, top shelf).
6. **Machines look like machine tools** (revision 1): lathe, grinder, turning centre, two-axis spindle head, press,
   coolant pump with segmented hose, chip conveyors, and the giant chuck with robot-arm spindle heads.

### What else Stage 2 added (design sections 5 to 11)

- **Every machine behaves at the design's timings.** The machine clock runs at 0.2 while filming.
  - Lathe and grinder: parts at 0.6 s and 0.9 s of each 3 s cycle, down the lane into the chip bin.
  - Coolant: jet from 0.7 to 1.8 s of 3.5 s, with the second loft unit offset 1.75 s.
  - Chip conveyors: reverse every 4 s, slowing to a stop over the last 0.8 s with the arrows pulsing.
  - The three gates: solid until green, and closing puts Mike back at the entry with at most one hit.
- **Damage, lives and checkpoints.**
  - Damage: one health per hit, knocked back 4T/s out and 5T/s up, 0.18 s without control, 1.5 s protected (pale
    outline).
  - Pits and zero health cost a life. Mike is back 0.7 s later at the checkpoint, and the machines restart from their
    warnings.
  - At zero lives he continues with three, and the continue is counted.
  - Checkpoints at 2, 102, 206 and 297: the first arrival heals and refills the card.
- **Free spares.** Walking past the bench machine supplies whatever the recipe still lacks, once, at no score and
  without counting toward the tally.
- **The Tangled Turner.** Ordered fittings: bearing, bearing, seal, seal, control unit, coupling, coupling, restart
  unit.
  - Hold Fix for 1.2 s within 0.8T, grounded and still. Moving, jumping, letting go or a hit cancels it, and the part
    is used only on completion.
  - Each phase is the 6 s timeline: tell 0.8, reach 0.6, sweep 1.6, pull back 1, parked 2. There is a 2 s harmless
    pause between phases.
  - The left arm folds away after the bearings; phase 3 is the right arm's short diagnostic sweep.
  - When it is restored the damage stops, the chuck turns, the ticks go white, the console reads CYCLE OK, Mike waves
    and the exit door lifts. Results follow.
- **Screens and menus.**
  - Title: Play, Continue when a save exists, and the best score.
  - Level card with the supplied lock-up.
  - Pause: Resume, Back to checkpoint, Sound, Quit to title.
  - Sound button, and a rotate prompt in portrait.
  - Results: score, parts /12, units /2, SD cards /5, mini Mike /1, time, lives lost, continues.
- **Save.** Versioned `localStorage`, full level only. It saves at pickups, fittings, checkpoints, life loss and
  pause. Continue restores the checkpoint, pickups, spares, fittings, score, lives and time. If storage is
  unavailable, a small notice appears and play carries on in memory.
- **Sound.** Everything is synthesised (`js/audio.js`):
  - effects: taps, jump pluck, landing puff, chimes, a glug, a two-note lift, camera click and descending hum,
    warning ticks, a dull bonk, repair clicks and a completion chord
  - music: a 108 BPM loop of warm bass, soft kick and hat and a sparse bell, with a gentle pulse added in the boss
  - mixing: master at 25%, at most eight effect voices, highs rolled off, silent until a gesture, mute remembered,
    suspended when paused or hidden
- **Performance.** A fixed 1/60 step with at most five per frame; terrain cached in six chunks. After 90 slow frames
  the parallax and particles are cut; physics never changes. On this PC the work per frame was 1.6 ms (p50) and
  2.6 ms (p95).
- **Demo.** `?demo=1` (`js/demo.js`) is a deterministic autopilot that plays the level, uses the camera at every gate
  and repairs the Turner. It won in 133 s with no lives lost, and sets `body[data-done="1"]` only on winning.

### Tests (`node tools/test-mike-game.cjs`, all passing, zero console errors, zero requests after load)

- `physics`: jump 3T / 0.5 s / 1 s, 7T/s top speed, coyote, buffer, belt take-off capped at 10T/s, the card's 3 s,
  its refill and refusal, an SD card adding 1.5 s, the look-ahead, section 1 pickups.
- `machines`: all three gates (without the camera Mike is sent back with one hit; with it he crosses unharmed), the
  lathe, the grinder, shelf cover, the coolant jet, belt speed, slowing and reversal, belts slowed by the camera, pit
  respawn.
- `level`: free spares with nothing collected (2 of each, no score), no duplicate scoring after a death, zero-life
  continue, mini Mike, a cancelled fitting consumes nothing, a full hold fits one bearing, the sweep hurts, save →
  reload → Continue.
- `demo`: the autopilot wins; its frames become the gate and boss captures.
- `captures`: all scenes; iPad and phone sizes for the start, a gate, the boss and the results; the run strip;
  real-time keyboard play; the lab read-out.

### Deviations in Stage 2, with reasons

- **Gate timings and the camera model.** As above: the owner's direction, and the design's windows were too short to
  react to.
- **The press opens and closes differently.** It closes 0–0.25 s, stays shut, opens 1.9–2.5 s and is open 2.5–3 s.
  The design's tremble came before closing, which left the passage physically open for 1.05 s; the tremble now
  plays only while open.
- **The spindle gate is a gate, not a free sweep.** It reaches out, sweeps ±34° (within the corridor), swings back,
  retracts, and stays up 0.6 s. The corridor is solid while the arm is out, so the tip never has to hit Mike on the
  pads.
- **Score.** SD cards are 100 each and the mini Mike 500, so the maximum is 3,900 (the design's was 3,400).
- **Arena signs.** The "E hold to fix" board is the only instruction text in the level beyond the start keys.
- **No "How to play" screen,** per the owner's "few helpers".

### For Jof to check after playing

1. Gate feel: is 0.5 s of green without the camera the right "too short to walk", and is amber noticeable enough?
2. Footage: does a 3 s card feel right, and do the SD cards make you want more footage?
3. Boss difficulty: the parked window is 2 s (10 s filmed). Too generous or too tight?
4. The mini Mike as the extra life: is its size on the shelf right?
5. Mike's size at 1.25× closer, now in the full level.
6. On the iPad 5: load time (the puppet is baked from the SVG at start), smoothness (`?lab=1` shows p95), multitouch
   (run + jump + camera together), sound starting on the first touch, and rotating out and back.
7. The design's section 13 questions still stand: silhouettes, lives, missing parts, landscape only, brand colours,
   fonts.

## Stage 1, revision 1: the owner's first look (26 September 2026)

Jof's feedback on the first renders, and what changed:

1. **"Mike does need to be a little bit bigger."** The whole world is now drawn 1.25× closer. The logical canvas is
   still 960×540 and every distance is still in tiles, so the physics and the level are unchanged. The view is now
   24T × 13.5T instead of 30T × 16.9T. Mike is 80 px tall instead of 64, and the floor band is 3T instead of 5T.
   The view is still vertically fixed: the highest Mike can reach, a jump from the @8 shelf, stays on screen. The
   boss arena (24T) now fills the width exactly, and 16T is visible ahead while running (the design asks for at
   least 8). This supersedes the `&zoom=1.5` option, which has been removed.
2. **"I can't effectively use the camera … no machine obstacles to slow down."** The playable strip is now
   **sections 1–3** (`?section=1-3`; the title button starts it). These machines genuinely behave, at the design's
   timings, and the camera slows all of them:
   - The section 2 lathe fires crashed parts at 0.6 s and 0.9 s of each 3 s cycle, down the lane into its chip bin.
     The shelf is cover.
   - The section 3 turning-centre gallery has guard doors that are solid except in the 2.7–3.0 s window. If they
     close on Mike, they put him back at the entry edge with one hit. The camera stretches the window to 1.5 s.
   - The chip conveyors reverse every 4 s, slowing to a stop over the last 0.8 s with their arrows pulsing. Their
     surface speed is slowed by the camera too.
   - A harmless pillar drill in section 1 (decor type `demoDrill`) feeds up and down, so the camera has something
     to slow before anything can hurt.

   Damage now works as specified: one health per hit, knock-back at 4T/s out and 5T/s up, 0.18 s without control,
   1.5 s of protection shown by a pale outline, and one hit at a time. Zero health or a pit costs a life; Mike
   respawns 0.7 s later at the checkpoint, protected, with the machines reset. At zero lives he continues from the
   checkpoint with three lives, and the continue is counted.
3. **"None of these hazards look like proper machine tool parts."** All machine art has been redrawn in
   `js/machines.js` as recognisable machine-tool parts, still generic (no brand, logo, model name, livery or one
   maker's shape): neutral greys, yellow safety marks, and red/amber/green tower lights as tells. Behaviour and
   hitboxes are unchanged.

   | Design name | Now drawn as |
   |---|---|
   | Rattle Spitter (section 2) | A runaway chucking lathe: three-jaw chuck, headstock, slideways, guard door off its hinge, tower light, chip bin as the catch tray. Fires bent turned shafts and chipped inserts |
   | Rattle Spitter (section 7) | A pedestal grinder (`"look":"grinder"` in the data), wheel sparking as its tell |
   | Spitter Gallery | A turning centre: tool turret behind the window, control pendant with a cycle bar (open window in green), tower light, sliding guard doors at both ends |
   | Tickle Spindle gate | A two-axis head on a ram with a telescopic way cover: spindle cartridge, telescoping quill, tool holder and a spinning end mill. It sweeps through the dotted arc |
   | Coolant Sneeze | A coolant pump unit with sight glass, feeding a segmented coolant hose to a round nozzle; the reservoir stands behind |
   | Clapper Jaws | A press: a ram on hydraulic cylinders carrying a punch, and a V-die rising from the floor |
   | Contrary Belts | Chip conveyors: hinged steel plates, sprockets, swarf riding along |
   | The Tangled Turner | A giant three-jaw chuck on a headstock, two robot arms with spindle heads (drill and end mill) on drag chains, a control panel and fixture-block sockets, tangled in coolant hose and cable |
   | Backdrop | Generic machine enclosures (sliding doors, pendants, tower lights, a chip conveyor) in the mid layer |

   The owner review the design asks for (its section 13, "approve silhouettes before final art") still applies.

Measured after the revision, `node tools/test-mike-game.cjs` (zero console errors, zero requests after load):

| Check | Result |
|---|---|
| Lathe, standing in the lane for 3 s | 3 → 2 health (the second part in the burst finds him protected) |
| Lathe, standing on the shelf for 4 s | 3 health |
| Gallery, walking in as the doors open, no camera | put back at x=79.6 (entry edge 80), 2 health |
| Gallery, camera on as the doors open | through to x=87.1, 3 health |
| Belt speed at 1 s / 3.6 s / 5 s | 3 / 1.5 / −3 T/s |
| Belt under foot with the camera on | 0.6 T/s |
| Fall into the section 2 pit | respawned at the x=2 checkpoint, 2 lives |
| Movement numbers | unchanged: 3T jump, 0.5 s to apex, 1 s flight, 7T/s |

New captures: `play-section1-camera-on-drill`, `play-section2-lathe-firing`, `play-section3-camera-crossing`, all
from the real loop. The `option-zoom-*` captures are gone. Everything below describes the first pass; where it
conflicts with this section, this section wins.

## Stage 1: the look and feel (26 September 2026)

### What to open

1. **The contact sheet:** `docs/mike-platformer/look/index.html`. Open it straight from disk. It shows every capture
   with its name, largest first, and a table of the measured movement numbers at the top.
2. **The playable strip:** run `node tools/serve-fireworks.cjs 8788`, then open
   <http://localhost:8788/mike-game/?section=1>. On an iPad on the same Wi-Fi, use the PC's address, which the server
   prints. Opening `/mike-game/` with no parameters shows the title card, and its button starts the same strip.
   - Keyboard: arrows or A/D to run, Space/W/Up to jump, C or Shift to toggle the camera, P or Escape to pause.
   - Touch: the buttons appear on a touch device (bottom-left run left/right, bottom-right jump, camera above-left of
     jump). Add `&lab=1` to show Mike's collision box and a small movement read-out.
3. **Any still scene:** `/mike-game/?scene=<name>`, using the names below. `&zoom=1.5` gives the closer-view option
   (see the first question).

### What was built

All runtime files are in `public/fireworks/mike-game/`:

| File | What it does |
|---|---|
| `index.html` | The fixed 960×540 stage, fitted and letterboxed; touch controls; pause; rotate prompt; the font hook |
| `level-1.json` | Level 1 as data: all ten sections, the design's schema expanded (see "Level data" below) |
| `js/world.js` | Level loading and validation, the tile-column collision world, Mike's movement, the camera meter |
| `js/puppet.js` | Mike, baked from `assets/mike.svg` part by part and posed through its documented joints |
| `js/art.js` | The workshop, every hazard, pickup, the bench and the Tangled Turner, drawn in code |
| `js/game.js` | The loop, input, view, HUD, scene mode, the section 1 strip and the `window.__mike` test hooks |
| `assets/` | `mike.svg` (the reference, with its lock-up path made local), the two supplied lock-up PNGs |

Tests and captures: `node tools/test-mike-game.cjs` (arguments: `physics`, `captures` or `all`, which is the
default). It needs the preview server on 8788, writes everything to `docs/mike-platformer/look/` and rebuilds the
contact sheet. The last run passed with zero console errors and zero network requests after load.

**Engine core.** Fixed 1/60 s step, at most five steps per frame, with the excess discarded after a stall. Input comes
from the keyboard (repeats ignored, opposed directions cancel) and from touch buttons tracked by pointerId (captured on
press; cleared on up, cancel or lost capture). Collision is AABB against a tile-column broadphase. The view follows
Mike with the 4T look-ahead smoothed over 0.15 s. Blur and hiding the page pause the game and clear held inputs. The
camera meter already works as the design says: 25 per second, a 1 s cooldown, recharge at 12.5 per second, and a
refusal (with "Charging" on the HUD) below 25. In the strip it slows only the scenery clocks, because nothing
dangerous is running yet.

**The puppet.** Mike is never redrawn. At load, each jointed part of the SVG (legs, feet, arm segments, stem, head) is
rendered to its own bitmap, with everything else in the drawing hidden, so the foam speckle, gradients and lock-up
come from the approved file itself. The canvas then rotates those bitmaps about the SVG's pivots, nested as the SVG
nests them. The head is baked every 5° from -40° to +40° using the SVG's own head-turn recipe (lock-up slid and
narrowed inside the face clip, far side shaded), so the lettering is never mirrored. There are two atlases: gameplay
at twice display size, and a large one for the title, poses sheet and results. Every pose uses the design's angles:
idle, the run cycle (one stride per 3T, bob and head nod), jump, fall, land, hit, camera (an unbranded charcoal
camcorder that stays level in his right glove), fix, and the wave after three idle seconds. Poses blend over 0.08 s.

### What each render shows

| Capture | Shows |
|---|---|
| `title` | The title card: supplied red lock-up on white, Mike large and waving |
| `s1-start` | Clocking in: the spawn clock, the two tutorial boards, the shelf, a bearing, a seal and a lubricant |
| `s2-belts` | Belt basics: right and left belts either side of the first service pit, the Rattle Spitter mid-rattle with its trajectory rings, the catch net, the cover shelf |
| `s3-camera-alley` | Camera alley with the slow-motion effect on and the meter half spent: viewfinder corners, the "SLOW ×0.2" label, dashed outline on the gallery, two crashed parts in the fire lanes, the countdown dial, the staging pads |
| `s4-stores` | Upper stores: a 3T pit mid-jump and the Tangled Turner far off through an observation window |
| `s5-arm-gate` | The Tickle Spindle gate: housing, bead-jointed arm with its padded three-prong grabber, the dotted reach arc, chevrons and staging pads |
| `s6-coolant-loft` | Two Coolant Sneezes, one mid-jet and one showing its three swelling droplets; the three shelves; the SD card on the upper shelf |
| `s7-belt-run` | Three belts, two pits, the guarded coupling and a spitter with two parts in flight |
| `s8-clappers` | The Clapper Jaws closing, a coolant tank draining, the second control unit |
| `s9-bench` | The service bench, the recipe board and the free-spares dispenser, with Mike waving |
| `s10-boss-idle` | The whole arena: drum, both spindles parked, the dotted warning lane, three sockets, the console, safe lanes, the destination arrow, the exit door |
| `s10-boss-repair` | Mike mid-Fix at the seal socket with the fill ring at 62%, bearings fitted, the right spindle sweeping, slow motion on |
| `results` | The results card over the restored Turner (white ticks, drum turning, "OK" on the console) |
| `poses` | Every Mike pose and five head turns, from the real rig |
| `hazards` | Every hazard in its warning state, drawn from its actual place in the level data, plus every pickup, the checkpoint and the camera prop |
| `device-ipad-*`, `device-phone-*` | `s1-start` and `s10-boss-idle` at 1024×768 and 844×390, touch controls showing |
| `strip-section1-run-jump` | Eight frames from the real loop: standing, away, full speed, take-off, the top of the arc, landing on the shelf, off the far end, running on |
| `play-section1-after-keyboard-run` | The strip after a real-time keyboard run (right held, Space tapped) |
| `option-zoom-*` | Not the design: the same spots 1.5× closer, for the first question below |

### Movement, measured (design section 3)

From `tools/test-mike-game.cjs physics`, stepping the real engine at 60 Hz (`look/measurements.json`):

| Quantity | Measured | Design |
|---|---|---|
| Held jump height | 3.000T | 3T |
| Time to apex | 0.500 s | 0.5 s |
| Same-height flight | 1.000 s | 1 s |
| Tapped jump (one frame held) | 0.947T | about 0.75T (see deviation 7) |
| Top speed; time from rest | 7T/s; 0.25 s | 7T/s; 28T/s² |
| Braking from full speed | 0.167 s, 0.53T | 42T/s² |
| Range at full speed | 7.0T | 7T (7T/s for 1 s) |
| Range from a 3T run-up | 7.0T | at least 4T gap plus 2T landing |
| Coyote: jump 0.10 s / 0.117 s / 0.15 s after leaving a ledge | yes / yes / no | 0.12 s |
| Buffer: press 0.10 s / 0.13 s / 0.20 s before landing | jumps / jumps / no | 0.15 s |
| Belt take-off (running with a 3T/s belt) | 10T/s | carried, capped at ±10T/s |
| Camera: charge after 1 s; empties at | 75; 4.0 s | 25/s; 4 s |
| Camera: charge after cooldown; one second later | 0; 12.5 | 1 s cooldown; 12.5/s |
| Camera: refused at 12.5, accepted at 25 | yes, yes | 25 minimum |
| View while running right | Mike at x=372 px, 18.4T visible ahead | 4T look-ahead, at least 8T ahead |
| Section 1 pickups, running and jumping the shelf | bearing, seal, lubricant; 250 points | 100 + 100 + 50 |

### Deviations from the design, with reasons

1. **Shelves at @10 cannot be walked under.** A 0.5T shelf with its top at y=10 leaves 1.5T of headroom, and Mike's
   box is 1.65T tall, so he bumps the shelf edge and has to jump onto it. That matches how the design uses them (cover
   from shots at y=11.25, raised pickups), so the geometry is unchanged. They are drawn on wall brackets rather than
   legs, so nothing suggests a walkway underneath. The @8 shelf in section 6 has 3.5T under it and is walkable.
2. **Belts are the floor's top surface.** A belt spans y 12 to 12.5 inside the floor, so stepping on one is not a
   step up; the arrows are on its housing face. In Stage 1 belts run one way at 3T/s. Reversal every 4 s, with the
   0.8 s warning, is behaviour for Stage 2.
3. **The Spitter Gallery.** It is built as a short tunnel under a machine housing. Two nozzles in the entry frame fire
   along the lanes (y 10.5 and 11.5) into catch slots in the exit frame. A striped solid shutter closes the entry
   except in the 2.7 to 3.0 s window. A dial on the housing counts down continuously, with the open window marked in
   white. This is my reading of "shots traverse its 3T width left-to-right into trays" with "catch trays outside
   walking space".
4. **Clapper Jaws close vertically**: an upper pad drops from the housing and a lower pad rises from a floor slot. The
   design gives an opening of 3×2.4T, not a direction; vertical keeps the pads out of the staging pads either side.
5. **Coolant geometry.** Each unit has a solid 1×2T pedestal on the floor. A bent nozzle on top sprays a 2×3T jet to
   the right of it. The pear-shaped tank stands behind the play layer and is drawn before the terrain.
6. **The distant boss is seen through an observation window** in section 4's back wall (window data in
   `backdrop[].window`), with parallax inside the window. As a free-floating 0.15× object it was visible from most of
   the level, not just the Upper Stores.
7. **The tapped jump measures 0.95T, not 0.75T.** The design's 0.75T is the climb after release is capped at 6T/s.
   The single frame at 12T/s before that adds 0.2T. The numbers are exactly as specified; this is only how they add
   up.
8. **The white horizontal lock-up (`mtdcnc-lockup-white.png`) is not in `reference/`**, only the red one and the
   stacked white one. The title and results therefore use the red lock-up on white cards, and nothing is drawn on
   red. The stacked white lock-up appears only where the SVG puts it, on Mike's head.
9. **Headline type.** Until the licensed Helvetica Neue files are cleared, titles use the fallback stack at weight
   900, squeezed horizontally when a line is too wide, to stand in for Black Condensed. The `@font-face` rules for the
   licensed files are written and commented out in `index.html`; every font stack already names the family first.
10. **Phone controls sit over the floor band** rather than in reserved gutters. At 844×390 the letterbox gutters are
    75 px, and the design's buttons need 152 px. Reserving that would shrink the play field by a third. The bottom
    30% of the view is solid floor, so the buttons cover nothing you need to see. On the iPad the buttons land in the
    letterbox below the play field (see `device-ipad-*`).
11. **Collision** is resolved per axis every 1/60 s step. The fastest possible move is 0.3T per step, far smaller than
    Mike's box, so this behaves as swept collision for every speed in Level 1.
12. **Level data** follows the design's shape. Section coordinates are local, and checkpoints, recovery and boss
    coordinates are global, as in the example. Sections also carry `platforms`, `pits`, `belts`, `pads`, `signs`,
    `decor` and `backdrop`. Hazard bases (spitters, coolant pedestals) become solids from their hazard type, so data
    cannot give them a hitbox that differs from the art. The loader validates the following and reports any failure
    as a console error, which fails the tests:
    - section contiguity and the level width
    - unknown hazard, pickup, decor or backdrop types
    - duplicate ids
    - that the recipe can be collected
    - that each checkpoint stands on floor, clear of hazards
13. **In the strip, the machines animate but cannot hurt.** Their tells cycle and the camera visibly slows them, but
    nothing collides; section 1 has no hazards anyway. A pit fall already costs a life and respawns Mike at the
    checkpoint after 0.7 s. Section 1 ends at a visible roller door ("Next bay: full build"), not an invisible wall.

### Left for a device test

- Baking the puppet on the iPad 5. There are about 50 SVG decodes, each with the foam's `feTurbulence` filter; on
  this desktop the gameplay atlas takes 0.36 s and the large one 0.46 s. If it is slow on the iPad, the fix is to bake once and keep the atlas as a
  PNG in `assets/`.
- Whether Safari taints the canvas when an SVG with an embedded data-URL image is drawn into it. The bake then skips
  cropping the part bitmaps, which only costs memory.
- Multitouch (run, jump and camera together), the rotate prompt, and the feel of pace and tile scale on the real
  screen.

### Questions I would put to the owner

The design's section 13 already lists his six. These are new:

1. **Is Mike big enough?** At the design's scale (32 px tiles, a 960×540 view, Mike 2T tall) he is 64 px in a
   540 px view, and the lock-up on his head is only just legible. Compare `scene-s2-belts` with
   `option-zoom-s2-belts`, which is 1.5× closer. The closer view would make the camera follow Mike vertically, would
   stop showing the whole level height at once, and would shrink how far ahead you can see from 18T to about 12T,
   which is still above the design's 8T minimum. I would try the strip on the iPad first and decide from that.
2. **Is putting the phone controls over the floor acceptable?** (Deviation 10.)
3. **Are step-up shelves the right feel?** (Deviation 1.) The alternative is to raise the section 1, 2, 4 and 6
   shelves to @9.5 so Mike can walk under them, which changes the design's heights.
4. **Does the camcorder prop read as a camera at game size?** (See `poses` and the `hazards` sheet.)
