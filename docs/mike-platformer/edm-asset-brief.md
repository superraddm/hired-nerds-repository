# Below the Wire — asset production brief

29 September 2026. This is an implementation brief with acceptance criteria, not a list of already-produced assets.

The current Level 1 is the locked style/mechanics/difficulty/variety reference, per the owner's explicit instruction. The working prototype imports its original backdrop, terrain, pickups, puppet, font stack, 1.25 view scale, dry movement and audio modules. Refine the new EDM assets to that standard; do not redesign the approved baseline.

## Art direction

Inside an oversized fictional wire-EDM enclosure: deep blue-green dielectric, cool inspection light, warm amber machine warnings, pale stainless panels and dark structural steel. Keep Mike's red head dominant. Dry metal is crisp; submerged metal loses contrast with depth. The cutting gap is a small, precise light source. Avoid fantasy lightning, laser beams, branded machines and a factory filled with arbitrary floating shelves.

Use the established procedural Canvas/vector style. Separate static cached architecture from dynamic machinery, fluid and effects. This avoids expensive image generation, supports arbitrary resolution and makes rendered machine positions match collisions. Do not introduce bitmap AI art that clashes with the approved puppet/machine style.

## Structural rule — nothing heavy floats

Every machine asset must include its support path. A pump bolts to a rack; the rack bolts to a slab, tank wall or cross-braced trench frame. A guide runs on a column tied to the enclosure. Catwalks have columns, wall brackets with anchor plates or suspension rods connected to a visible overhead beam. A pipe must terminate at a coupling, manifold or tank port. A cable must connect to a pendant, motor or cable chain.

Background supports are desaturated and behind the play layer. Playable decks have a bright continuous top edge, consistent grating thickness and defined end caps. A dark diagonal brace is not a new wall or landing surface. Test readability in grayscale.

## Palette and hierarchy

| Role | Base / highlight | Usage |
|---|---|---|
| Deep enclosure | #071923 / #183947 | Recesses, tank walls, background |
| Structural steel | #284652 / #668591 | Columns, bolted anchor plates, racks |
| Stainless skins | #6f929e / #d3e3e5 | Pump housings, guide blocks, service panels |
| Water | #0d5865 / #6de0dd | Transparent depth gradient and thin surface line |
| Safe/refuge | #9be4c7 | Dry refuge lamps and recovery markers |
| Warning | #ffc46a | Machine tells, hazard brackets, pump state |
| Active cutting gap | #e3fbf2 | Small local sparks, bounded wire line |
| Mike | Supplied originals | No replacement art or recolouring of his microphone head |

Foreground contrast must exceed background contrast. Do not put bright pipework directly behind collectibles or active wire. HUD uses the game's existing typeface and plain action labels.

## Asset inventory

Dimensions below are authoring envelopes in tiles, not copied real-machine measurements. Each reusable asset needs origin, bounds, collision layers and animation states recorded beside its implementation.

| ID / asset | Envelope / anchor | Construction and required states | Gameplay layer |
|---|---|---|---|
| ENV-01 tank module | 16×18; top-left rim | Layered wall skins, seams, bolts, bottom slab, waterline scale, drain flange; dry/part/full overlays | Side/bottom collisions are explicit separate rectangles |
| ENV-02 rim walkway | Variable width×0.5; top surface | Grating, end caps, yellow ends, wall brackets or visible posts; optional handrail behind Mike | One-way deck where appropriate |
| ENV-03 service rack | 4×8; floor plate | Twin columns, X braces, base bolts, cross-member and pipe clips | Background; never invisible collision |
| ENV-04 window/inspection wall | 8×10 | Thick seals, laminated glazing highlight, support mullions, subtle distortion under water | Background |
| ENV-05 refuge alcove | 5×4; dry landing | Roof recess, green air lamp, non-submerged pocket silhouette, clear exit direction | Landing + documented air volume |
| ENV-06 floor fixtures | 3–8×2–5 | Bolted clamps, T-slots, sacrificial worktable, rounded corners | Solid submerged obstacles |
| MAC-01 upper wire guide | 3×3; guide centre | Slide carriage, guide block, small nozzle, bellows, cable chain; idle/tell/travel/retract/return | Moving hazard from shared pose function |
| MAC-02 lower wire guide | 3×2; below workpiece | Guide support arm, flushing cap, connection to column/base | Same wire endpoints as upper guide |
| MAC-03 guide column | 3×20; tank base | Continuous rail, carriage shoes, motor at fixed end, anchored feet, limit markers | Background/solid column only where specified |
| MAC-04 wire path | Variable; upper/lower endpoints | Fine continuous wire, spool/tension path outside cutting area, local cutting glow; inactive/active | Thin hazard line only during active state |
| MAC-05 pump/filter skid | 5×5; mounted deck | Motor, filter canisters, manifold, isolation valve, pressure gauge, supply/return hoses, bolted base | Machine housing collision separated from supporting art |
| MAC-06 flush nozzle | 1×2; pipe coupling | Segmented hose continuously joined, aimed tip, tell bubbles, jet, drain | Narrow bounded fluid hazard |
| MAC-07 level valve | 1.5×2; service rail | Handwheel, two labelled level states, rising/falling indication, nearby float gauge | E-press interaction, no repeated toggle while held |
| MAC-08 intake grille | 2×2; tank wall | Guard bars, swirl, pressure pulse, indicator lamp | Local force zone, not full-tank suction |
| MAC-09 tensioner | 4×3; enclosure bracket | Roller pair, wire spool silhouette, spring/tension scale, guarded rollers | Boss service point / background until prototyped |
| MAC-10 service socket | 1.5×2; landing edge | Number, symbol, progress lamps, active arrow, calibration ring | Tool interaction; no salvage consumption |
| PROP-01 piping kit | 0.25–0.5 diameter | Straight/elbow/tee/flange/coupling sections, hanger clips, labelled direction markers | Background |
| PROP-02 cable kit | Variable | Tray, cable chain, flex loop with slack, fixed terminations | Background; follows machinery correctly |
| PROP-03 workpiece family | 6–14×4–10 | Three original abstract blanks with broad cut passages, clamps and machining marks | Authored collision masks, no tiny frustrating gaps |
| PROP-04 maintenance grille | 3×2 | Screws, slight loose corner, dim spill light; proximity fade for secret | Optional secret cover |
| CHAR-01 Mike suit | Puppet-relative | Harness, compact buoyancy pack, clear visor outline with 1–2 highlights, wrist/ankle cuffs | Overlay follows puppet, never obscures face/lock-up |
| CHAR-02 swim pose | Existing rig | Arms balancing, feet trailing, facing mirrored correctly; rise/dive/idle/hit variants | Animation only; collision shape explicitly tested |
| PICK-01 salvage | Existing icons | Bearings/seals/couplings/control units in bubbles or mounted cradles; readable underwater | Optional score collection |
| PICK-02 suit rack | 2×3 | Clearly different from salvage; empty rack after collection | One persistent ability pickup |
| FX-01 water surface | Tank width | Thin rim highlight, low-amplitude ripples, disturbance rings; interpolate level | Visual and physical surfaces share y |
| FX-02 underwater depth | Tank bounds | Bounded transparent gradient, sparse bubbles, subdued caustics; no full-screen blur | Overlay behind HUD and above scenery, preserve Mike readability |
| FX-03 cutting gap | <1×1 | Small pulses and tiny sparks at contact only | Tied to hazard state |
| FX-04 splash / bubbles | Local | Short pooled particles with lifetime cap, rise and fade | Non-colliding |
| UI-01 suit-air meter | HUD | Full, warning at 25%, critical pulse; icon + seconds, refill feedback | Must remain visible underwater |
| UI-02 pump state | Valve + HUD context | LOW/HIGH plus moving arrow, no hidden timer | Contextual only |
| UI-03 prototype banner | Top/bottom safe area | Clearly says "EDM mechanics prototype", controls and exit goal | Remove only when full level is built |

## Layer order

1. Distant enclosure gradient and structural silhouette.
2. Tank shells, anchored columns, pipework, cable trays and lighting.
3. Fixture blocks, dry platforms and machine housings.
4. Machine moving parts, wire and jet tells.
5. Optional collectibles and interactions.
6. Mike with suit overlay; keep facing and pose consistent.
7. Bounded translucent water tint and local splash/bubble effects, with reduced opacity over Mike if needed.
8. Hazard emphasis, interaction prompts and HUD. No voice subtitles.

## Motion specifications

Use a shared pose function for each moving machine. A carriage cycle has explicit travel, deceleration, retract and return phases. At the wrap boundary, position must be continuous; velocity should also be continuous for powered travel. The wire attaches to the guide blocks throughout. Pipe flex or cable-chain length adjusts with motion.

Water takes time to rise/fall. Surface ripple amplitude must not affect collision or air checks. Render the true mean water height clearly. Particles must not resemble collectible icons. In low-quality mode, reduce caustics/bubbles before removing essential tells or structural supports.

## Audio brief

Retain the exact approved Mike voice library; use only existing short reactions. No new long exposition. Add procedural low pump rumble, valve clunk, gentle air refill chime, muffled underwater machinery, wire-guide motor and local cutting ticks. Duck ambience for Mike. Never filter speech into an unrecognisable voice. Mute and pause remain respected. No new generation costs are required for the prototype.

## Production order and review gates

1. Greybox tank, fixture collisions, suit gate and dry/wet controls.
2. Prove two routes, fluid-state changes and an escape from every submerged space.
3. Add supported tank/guide/pump assets using this brief.
4. Add Mike's non-destructive PPE overlay; inspect mirrored and underwater poses.
5. Add bounded water effects and lamps; inspect low/high fluid states, not just a hero still.
6. Run keyboard/touch and state tests, capture review scenes, update the continuation document.
7. Only then author the remaining rooms. Do not spend on a large generated asset library before the mechanics and style are approved.

## Definition of an accepted asset

Unbranded; clear support/anchor; compatible with the approved Canvas style; origin and collision bounds documented; readable at 960×540 and phone scaling; no invisible walls; tells remain visible through water; continuous loops; modest render cost; no console errors. Preserve source code and parameterised geometry so Opus can continue without reconstructing flattened art.
