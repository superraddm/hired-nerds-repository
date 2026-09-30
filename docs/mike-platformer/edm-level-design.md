# Level 2 — Below the Wire

Design and prototype brief · 29 September 2026 · Status: design, not a finished level

**Update, later on 29 September:** the six rooms and the boss are now built to this brief as `level-2.html`. What was built, what changed and what is still open is in the progress log at the end of [the continuation document](OPUS-5.5-CONTINUATION.md).

**Owner's explicit constraint:** all styling, mechanics, difficulty and variety of the current Level 1 must be preserved. The current baseline includes Claude's 27 September support, nine-repair boss, scoring, drill and dead-end fixes. Do not regenerate it with an older authoring tool. Reuse its actual art and dry physics; establish comparable challenge through playtesting rather than simplifying the new level.

**Current build:** [play Level 2 locally](http://localhost:8788/mike-game/level-2.html) and see the [current review gallery](l2-look/index.html). The six rooms and boss are implemented. The original 96-tile slice remains at `edm-prototype.html` for reference.

**Later owner revisions override the original proposal below:** suit static/earthing replaces oxygen; Down/S dives in fluid and looks below on land; valves must unlock a route or reward. See the owner log in `OPUS-5.5-CONTINUATION.md`. The current refinement state and verified review fixes are in [EDM-REFINEMENT-CONTINUATION.md](EDM-REFINEMENT-CONTINUATION.md). Human difficulty comparison and physical iPad validation remain outstanding.

## Intent

Mike enters a fictional wire-EDM service enclosure to restore a rogue flushing and wire-guidance system. This level should feel different immediately: enclosed water tanks, suspended wire guides, submerged fixtures, refraction, pump pulses and the sound of heavy circulation. Keep the satisfying movement, camera mechanic, generous input buffering and readable machine tells from Level 1.

The challenge is choosing when and where to change height. Water changes the route; it is not just a differently coloured pit. Safe inspection positions must reveal the next landing or air refuge. Never require a blind dive. Hold Down/S remains available.

This is a fictional game environment, not a real maintenance procedure. No real manufacturer's name, machine model, colour scheme or complete enclosure design. Mike and the supplied lock-up remain the approved assets. A sealed cartoon service suit with visor and buoyancy pack provides the underwater game mechanic; glasses alone do not prevent drowning.

## Full-level layout

World units are the existing 32-pixel tiles. The full design is **512 tiles long**, with a working vertical envelope from y=−10 to y=24. Negative y is above the nominal workshop deck. Room widths are intentionally different. Author encounters individually; do not repeat stair templates to fill distance. Initial human completion target: roughly 8–12 minutes while exploring, to be established by playtesting rather than enforced with waits.

| Room / x range | Layout and dramatic purpose | Main mechanic | Checkpoint and recovery |
|---|---|---|---|
| 01 Suit dock / 0–48 | Dry preparation bay; a glass inspection wall reveals the first tank and wire guide. Short loop above the kit rack. | Pick up the suit, learn Down to inspect, test buoyancy in a shallow basin. | x=3 dry start; checkpoint after the suit gate. Water cannot be entered without the suit. |
| 02 Flushing gallery / 48–128 | One broad tank under a narrow dry rim. A central fixture splits the underwater route into two passages. | Read alternating flushing jets; choose rim jumps or swim between baffles. | Dry alcoves at both ends; mid-tank air pocket visible from the entrance. |
| 03 Guide tower / 128–224 | A tall wire-guide carriage moves vertically inside a rigid machine column. Dry zigzag catwalks flank the column. | Time a carriage crossing; use buoyancy to climb a flooded shaft; camera slows carriage and jets. | Dry maintenance landing at x≈166; falls return to the tank rather than a death pit. |
| 04 Split reservoir / 224–336 | Two adjoining tanks connected by a low service duct. A pump transfers water between them. | One valve raises one side while lowering the other. Dry route, flooded passage and optional upper cache trade places. | Checkpoint before the valve. Valve remains reachable in every state. Both tanks have an escape ladder/ledge. |
| 05 Cut-path maze / 336–432 | A large unbranded workpiece on bolted fixtures creates three broad, readable underwater corridors. | Follow the safe cut path, avoid the active wire line, manage suit air between alcoves. Optional short high route requires harder jumps. | Dry refuge at the centre; deepest salvage branch is optional. No maze branch exceeds the minimum-air return budget. |
| 06 Threading fault / 432–512 | A vertical service cell: lower flushing manifold, middle tensioner, upper guide head. Exit behind a visibly unfinished cut. | Climb and dive between service actions; learn the wire-guide/flush sequence; restored pumps drain the exit path. | Dry boss-entry checkpoint; completed calibration stages persist after failure. |

### Room connectivity

Each room has three route roles, but not three parallel flat corridors:

1. **Dry rim:** fast precision platforming, exposed to travelling guides. It reconnects at service landings. Missing a jump often drops into traversable water rather than killing Mike.
2. **Maintenance galleries:** bolted decks, valves, pump rooms and air refuges. Best place to read the machine cycle and plan. These routes weave above and below the rim.
3. **Submerged cut path:** slower, buoyant, with salvage and shortcuts through fixtures. Requires the suit and an air-budget decision. Some entrances change when water is transferred.

At least two useful route choices per major room. A complete route must exist with no optional salvage or SD cards. Do not make the same shortest route safe at every water level. Every forced transition gets a visible next refuge.

## Core movement and water rules

Dry movement uses Level 1's real `MIKE.stepPlayer` physics: 7 tiles/s run, 3-tile held jump, input buffer and coyote grace. Do not silently retune it for this level.

Initial wet tuning for the prototype:

| Parameter | Starting value | Why / validation |
|---|---:|---|
| Horizontal water speed | 3.8 tiles/s | Clearly slower than running but responsive |
| Vertical swim speed | 3.0 tiles/s | Allows controlled descents beside hazards |
| Passive buoyancy | 0.7 tiles/s upward | Releasing controls trends toward the surface |
| Water acceleration | 9 tiles/s² | A little drag, without delayed input |
| Suit air | 24 seconds | Supports one local detour plus a return margin |
| Air refill | 8 units/s | Refill is quick in a visible dry refuge |
| Fluid travel | 0.8 tiles/s | Water changes visibly; no instant flooding |
| Pump interaction | One E press per toggle | Holding E must not oscillate the valve |

Hold Jump/Up to swim upward; hold the dedicated Dive control to descend. **Down/S stays look-down**, preserving the signed-off inspection control. Keyboard Dive is X. Touch has separate Look, Swim and Dive controls. Do not overload the inspection button with movement.

Water entry preserves a fraction of momentum, suppresses dry jump retriggering and creates a small splash. Crossing the surface must not jitter between dry and wet physics. Test feet, torso and head immersion separately: body immersion controls drag; head immersion consumes air. A surface jump should land on a low rim shelf cleanly.

On air exhaustion: one clear warning, then return to the last dry refuge with a health/life cost in the full game. Do not leave Mike dying repeatedly at a submerged checkpoint. The prototype may use a simple reset to the dry dock; label that limitation.

## Interaction and progression

- The suit is a persistent level ability, not one of the 56 salvage finds and not consumed by taking damage.
- Keep a separate optional salvage collection, provisionally 56 items. Allocate 8/10/9/11/10/8 across the six rooms. Validate unique IDs and total; do not scatter items by an automatic repeated pattern.
- Roughly half the collection lies on the main routes. Remaining finds reward high paths, fluid-state revisits and clearly hinted optional passages. A complete collection should require exploration, not invisible-wall guessing.
- One Mini Mike life hides in a maintenance recess signalled by a loose grille, reflected task light or unusual pipe termination. Do not mark it on the player-facing map.
- SD cards still increase camera capacity. Camera slows machine motion and fluid pump machinery, never Mike's air consumption. Refuges must make a no-card run possible.
- Local pump states and collected IDs persist at checkpoints. On death, water/hazards reset to a documented safe state if necessary; never restore a checkpoint beneath water without a safe escape.

## Hazard language

| Hazard | Anticipation | Active | Recovery / safe response |
|---|---|---|---|
| Flushing nozzle | Amber lamp, rising bubbles, nozzle aims | Narrow pale stream, strong directional shape | Stream fades and lamp goes dark; cross or shelter behind the fixture |
| Moving wire guide | Motor hum and illuminated travel rail | Carriage moves continuously; wire remains attached to both guides | Raised/retracted guide returns visibly; never teleports |
| Active cutting line | Focused bright cutting gap and amber brackets | Fine luminous vertical line bounded by the guide positions | Dark inactive line; no random room-wide lightning |
| Pump intake | Local swirl and grill vibration | Bounded pull near a guarded intake | Pulse stops; swim across at a right angle |
| Rising water | Pump lamp and level marker moving | Smooth changing surface, clear bubbles | Stable level signalled by lamp/float indicator |

Colours are reinforced by motion, silhouettes and lamps. Sparks stay at the cutting gap. Machinery is dangerous because it moves or flushes, not because every metal surface is damaging. Machinery support graphics never masquerade as collision platforms.

## Level 2 boss proposal

Do not simply duplicate Level 1's new nine-step fight. Prototype the water interaction first, then build **The Threading Fault** around three jobs: isolate the flushing surge, stabilise the tensioner and align the guide. Each job changes one part of the arena, with a repeatable warning/attack/recovery cycle. The final alignment completes the cut and opens a visible exit.

The lower service point can flood; the middle remains a dry planning refuge; the upper requires timed guide travel. Show current job and next destination. Repairs use tools, not salvage. If multiple calibration passes are adopted, count each visibly and persist completed stages. Machine-time calibration should prevent the Level 1 slow-motion exploit.

## Playable prototype scope — first implementation

Build a separate **96-tile tank slice**, clearly labelled prototype, accessible from a direct local URL. Keep it independent of Level 1 saves and the results screen.

- x=0–16: dry dock, suit pickup and controls.
- x=16–76: one deep tank with dry upper platforms, a lower maintenance shelf and submerged fixture blocks.
- x≈12: reachable dry pump control. Switch between low and high levels; the switch remains reachable.
- x≈40: moving fictional wire-guide assembly with continuous motion, readable active/inactive cycle and local flush effect.
- x≈58: air-refill refuge / upper route rejoin.
- x=76–96: exit deck and one service interaction to prove traversal.
- A small set of labelled prototype salvage finds, not a claim that the full 56-item level exists.
- Mike's actual puppet, with code-drawn suit/visor overlay that preserves the microphone head and silhouette.
- Keyboard and touch controls, sound toggle only if existing audio is integrated safely, restart and brief control legend.

## Acceptance and tuning

Verify: dry jumps unchanged; suit gating; water collision against fixtures; surface transitions; independent look-down and dive; visible fluid interpolation; valve edge-triggering; refill only with head above water; air independent of camera; hazard tell/return continuity; dry and wet routes reach exit; restart clears prototype state; no browser errors.

Capture dry dock, tank low, tank high, submerged Mike, supported guide and touch HUD. Record actual measurements, not invented human completion times. Later playtests should measure route choices, deaths by unseen hazard, air exhaustion and repeated failed jumps. Revise geometry before adding more length.

## Companion documents

- [Asset production brief](edm-asset-brief.md)
- [Emergency Opus continuation](OPUS-5.5-CONTINUATION.md)
- [Latest approved Level 1 baseline](nightshift-v3-review.md)
