# Mike the Mic: The Night Shift — version 2

**Historical version 2 review.** The current design, mechanics, voice script and checks are in
[the version 3 review](nightshift-v3-review.md). The EDM and later-level proposals below remain design concepts.

27 September 2026. Built in `public/fireworks/mike-game/`. This supersedes the original level's layout,
fixed-height camera, automatic free-spares recovery and robot-arm boss. Mike's supplied artwork and the MTDCNC
lock-up are unchanged. The previous level data is preserved in `level-1-original.json`.

Play: http://localhost:8788/mike-game/ — server: `node tools/serve-fireworks.cjs 8788`.
Watch the input-driven playthrough: http://localhost:8788/mike-game/?demo=1.
Visual review and voice auditions: [nightshift-look/index.html](nightshift-look/index.html).
The files are local; this version has not been deployed.

## Review of the original

The movement and camera mechanic were worth retaining. The limitation was the arrangement around them:
320 tiles of largely horizontal travel, three mandatory timed corridors, a fixed vertical view, an extra life
displayed openly, and a boss whose long parking window became ten seconds when filmed. Automatically supplying
missing components removed much of the incentive to explore. The huge chuck with elbowed arms read more like
a robot than a multi-axis machine tool.

## What changed

| Measure | Original | Night Shift |
|---|---:|---:|
| Level width | 320 tiles | 960 tiles (3×) |
| Sectors | 10 | 20 |
| Hazard units | 8 | 33 |
| Highest platform | y = 8 | y = −5.6 |
| Height above the floor | 4 tiles | 17.6 tiles |
| Platforms | 7 | 190 |
| Boss repair hold | 1.2 seconds | 1.7 seconds |
| Boss parked window | 2 seconds | 1.1 seconds |
| Checkpoints | 4 | 9 |
| Bundled character voice clips | 0 | 9 |

Length is exactly tripled. Difficulty and visual impact are subjective: the changes are designed to make both
substantially stronger, but an exact “3× harder” or “3× prettier” claim would not be measurable.

The deterministic floor-route controller completes the new version in 293.7 seconds versus the original
recorded 133 seconds. That is about 2.2× the old completion time; tripling width does not triple boss time.
The controller knows all timings, omits the upper collectibles and hidden life, and is a completion check,
not a prediction of a first-time player's speed. A human difficulty comparison is still needed.

## Level design

The opening keeps the short introduction to running, jumping, conveyors and filming. The original gallery,
spindle gate and press now have climbable maintenance bypasses. Each introduces the choice between timing a
ground-level machine and climbing through a moving-head route above it.

Ten additional 64-tile sectors sit between the original workshop and the service bench:

1. **Foundry crossing:** longer pit jumps, opposing conveyors and an overhead spindle traverse.
2. **The spindle gallery:** cover, a turning-cell projectile lane and a raised route.
3. **Tool-change towers:** the first climb to the highest gantry, with two floor gaps below.
4. **Coolant cathedral:** offset coolant jets below a high maintenance passage.
5. **The forgotten stores:** upper parts storage and a concealed, backtracking maintenance loft.
6. **Cross-feed chasm:** three four-tile gaps and reversing take-off belts.
7. **The long gantry:** high travel, exposed landings and a floor-level travelling head.
8. **Night-shift turning:** faster projectile cycles, two pits and a control unit upstairs.
9. **Pressure cascade:** two out-of-phase fluid hazards, with an overhead alternative.
10. **The final approach:** three gaps, an opposing belt and the last spindle traverse before the bench.

The camera follows height smoothly. Grating platforms permit jumping up through them; solid machine housings
remain solid. An upper-route fall usually rejoins the floor, though pits still cost a life. Checkpoints prevent
the extra length turning a mistake into a full restart. Jump height, acceleration, coyote time and input buffering
retain the original tuning.

The extra life is behind an opaque service grille in an off-route loft. The grille fades on close approach,
and the pickup is not rendered from the ordinary route. It still uses the actual miniature Mike puppet.

Optional upper rewards include SD cards and control units. The camera retains its recharge behaviour so missing
a card cannot deadlock a required gate. Missing boss components are available at the service bench only after
holding Fix for five seconds, with a 150-point deduction per supplied item, capped at the current score.

## Art and machine design

The workshop now uses a dark, layered factory interior: tall glazing, steel trusses, light cones, suspended
fixtures, extraction ducts, service pipes, floating dust, detailed turning cells and illuminated upper platforms.
A new title treatment and a sector-progress indicator make the expanded journey easier to read.

The boss is a fictional dual-head five-axis service cell. Linear X carriages and telescoping Z rams replace the
elbowed arms. The heads have fork/yoke pivots, motor cartridges, rotary collars, taper holders, fluted cutting
tools and coolant lines. A tilting rotary fixture, slotted platter, workpiece, clamps, accordion way covers,
tool magazine and control pendant complete the enclosure. The final repair phase brings the second head back
into the attack cycle. Tool-tip drawing and collision use the same coordinates.

All machine graphics are authored Canvas geometry using generic functional forms and neutral metals. No real
manufacturer's logo, model name, livery or complete machine design appears in the game. The real puppet has
not been redrawn. The machine mechanisms were checked against a [five-axis kinematics reference](https://www.haascnc.com/machines/5-Axis_Y-Axis_Automation_Made_Easy.html);
that source was used for axis concepts, not for reproducing a machine's appearance.

## Mike's voice

Nine Gemini recordings reuse the explainer's exact saved voice, `voice_h0dygekvdjzv` on
`gemini-3.8-flash-tts`, verified against `Y:/MTD-Client-Files/mike-explainer/out/assets/voice-final/manifest.json`.
The voice is a dry, measured northern English time-served engineer. The initial, separately designed Yorkshire
voice was rejected and replaced. Examples: “Get in! That'll do nicely!”, “Ey up! Now we're motoring!”, “Eeh! That smarted!”
and “Ow! Pack it in!” They play for power-ups, damage, the secret life, starting and restoring the boss.

All WAVs preload before play. Voice uses the same audio context as effects, respects mute and pause, ducks the
music and limits repetition. Subtitles accompany played clips. There are no runtime service calls. Credentials
remain in the ignored local voice configuration. The resumable generator is `tools/build-mike-voice.py`;
provenance and the exact script are in `assets/voice/manifest.json`. `voice-source.json` pins the original voice
identity and delivery. The builder never designs a substitute voice, caches by voice/model/text/style, and
publishes a new manifest only after all nine clips validate. New filenames prevent reuse of cached old recordings.
Speech bypasses the sound-effect low-pass filter so its original tone is preserved.

The corrected build reuses the persistent explainer voice, consistent with the
[Gemini voice-design documentation](https://ai.google.dev/gemini-api/docs/generate-content/voice-design).
The corrected nine-clip run was estimated below $0.01, with no voice-design call.
This is a tool estimate, not an invoice. No real person was impersonated.

## Verification and limits

- `node tools/test-mike-routes.cjs`: uses the real movement/collision implementation to find reachable paths
  to every maintenance platform. Includes the upper gate bypasses and the hidden-life branch. It tests geometry;
  it does not prove a damage-free timing solution for every upper hazard.
- `node tools/test-mike-nightshift.cjs`: level validation, vertical framing, hidden-life collection, travelling
  head damage, repair cancellation/completion, five-second recovery, save/continue, ordinary keyboard input,
  simultaneous touch run/jump, decoded voice playback, full floor traversal and zero console/resource errors.
- The existing `node tools/test-mike-game.cjs physics` still passes the movement and camera regression checks.
- Desktop, phone and iPad viewport captures are in `nightshift-look/`. Viewport emulation does not establish
  iPad 5 Safari performance or prove how the accent sounds on its speakers. Those remain physical-device checks.
- The old harness's `level` scenarios contain version-1 coordinates and recovery expectations. Use the new
  Night Shift suite for level integration; the old data and captures remain useful historical reference.

## Proposed Level 2 — Below the Wire

Develop this next, rather than repeating another longer workshop corridor. A fictional **wire EDM** enclosure
provides a visibly different blue-green environment and a new relationship between height and movement.

The technical starting point is a tensioned wire passing through upper/lower guides, with X/Y travel and U/V
guide offsets for taper. A typical water-based wire EDM uses deionized water as its dielectric; the level can
use that specific setup consistently. See the [wire EDM mechanism tutorial](https://www.makino.com/resources/content-library/article/archive/edm-wire-tutorial/198).

Mike collects an obvious PPE kit before the tank entrance: a sealed cartoon service suit with a clear visor
and buoyancy pack. Preserve his red microphone head and silhouette. Glasses alone should not be the item
that prevents drowning; the suit provides the game's fictional protection, while the visor makes the PPE visible.

The level has three interlinked routes:

- **Dry rim:** narrow jumps around the tank lip and overhead cable supports; quickest, most exposed to guide motion.
- **Service galleries:** valve alcoves and filter access passages; a steady route with controlled fluid crossings.
- **Submerged cut path:** slow, buoyant movement through the workpiece and beneath guides; rich in repair components.

Two local pump controls change the fluid height, opening one route while closing another. Filming slows the wire
guides and pressure pulses, but does not freeze Mike's air/suit resource. Put refill alcoves before commitments;
show the next refuge before the player dives. An early tank is shallow enough to teach the suit safely.

The boss, **The Threading Fault**, requires repairing the flushing system, replacing a guide and rethreading the
wire across three elevations. Warm electrical pinpricks stay concentrated at the cutting gap, not across the whole
tank. No lasers or random lightning. The finish drains the chamber and reveals the completed cut as an exit.

Prototype a single tank first: suit pickup, one flood/drain valve, two crossing heights, one guide hazard and one
repair action. Validate buoyancy, camera readability and touch control before authoring the full level. Level 2
is a design proposal; the current results screen labels it as a concept, and does not present an unbuilt Play button.

## Further level candidates

**Level 3 — Swarf Works:** a chip-handling basement with rising screw conveyors, swarf compactors, magnetic
separator drums and a repair boss based on a jammed conveyor drive. Emphasis: momentum and machine sequencing.

**Level 4 — Lights Out:** a metrology/service hall with local power routing and inspection-light cones. Emphasis:
finding routes and powering one machine at a time. Mike's camera reveals timing and inspection detail rather
than becoming a weapon. End by bringing the whole shop back online.
