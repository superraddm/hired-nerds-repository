# Level 3: Cobot Mania

Design brief, 30 September 2026. Written by Claude (Opus 5.5) from Jof's brief of the same day.
**Status:** design, plus a playable first slice. This is not the finished level. What is built, what has been verified and what is still to do are recorded in [the continuation document](L3-CONTINUATION.md).

## Revision 4: 2 October 2026, twice as hard

This section supersedes anything below it that it contradicts.

**Jof's notes, in summary:** the route boss makes more sense, but now it's quite easy. Make the whole level twice as hard: more obstacles, less safety. Make the boss more challenging, with more hazard somehow. It was very easy to fix the switches without the camera and to stay out of the routes. The end screen needs tidying up.

**The level:**
- Eleven more hazards along the way: arms, rovers and crate feeders in places that were quiet, including one feeder dropping through the hook relay.
- Machines cycle faster and warn for less time. Carriers sway further (about ±0.65) and faster (about 2.3 s a swing), so jumping them takes timing.
- Less safety: two checkpoints (x 54 and x 268.5), one lubricant and one standing rack in the rover yard are gone. The checkpoints left are 3, 121, 177.5, 349 and the one inside the Teach Cell door.
- Still checked: everything reachable, no dead ends, no blind drops, every pickup collectable, and the test player reaches the door with every machine live.

**The Teach Cell:**
- **Two chutes, two arms.** Round 1 is as before: one arm, one route. From round 2 a second chute opens top right with its own arm, and each arm has its own lit route through the same eight dials. A round is done when both have delivered. A rail now joins E and G, so the right-hand route has somewhere to go.
- **Two colours.** In round 3 the right-hand arm takes blue crates, and the blue pallet bottom left opens. One set of dials has to serve both routes. A crate at the wrong pallet is not set down; it is dropped.
- **The sweep.** After every trip, delivered or dropped, the empty arm rises, crosses to the far wall, and lowers a striped sweeper head to one level of the cell: the floor, the side decks with the middle grating, or the top ledges, a different one each trip. It warns with amber dashes while it lowers and flashing red as it aims, then sweeps the full width. Jump it, or be on another level.
- **No safe spot.** Every standing place in the cell is on one of the three sweep levels. With two arms working, a 2.2 s re-teach has to be timed between sweeps and drops, and that is where the camera comes in: it slows the arms, never Mike or his hold.
- **Faster each round:** the arms run at 1.15×, 1.35× and 1.55× of their base speed. The fewest dial turns are 2, 5 and 7.
- The goal pill says each round's job in one line: get its crate to the pallet; two arms, get both crates to the pallet; each crate to the pallet of its colour. The three round lamps hang in the middle of the cell.

**The end screen:** now the same card as Level 2 (same size, logo, headline and rows). The route log is a separate card whose routes are grouped under section headings. Each chip is sized to its text: filled where he has ever been, ringed in red for this run.

## Revision 3: 2 October 2026, the boss rebuilt and the HUD decluttered

This section supersedes the Teach Cell description in Revision 2 and below.

**Jof's notes, in summary:**
- The screen puzzle and the stage were unrelated. The arms on the stage had nothing to do with the console, and the console had nothing to do with the hazards. Either make them directly related, or not related at all.
- Think it through properly, starting again if needed.
- The screens are far too busy: status bars, recording length and score cover the play.

**The Teach Cell, rebuilt as a route puzzle in the room itself:**

- **The program is the stage.** Seven waypoint dials (A to H) sit on the cell's tiers, joined by rails on the back wall; each dial points to its next waypoint. The Big Arm, a gantry cobot on the ceiling track, takes a crate from the chute top left and follows the dials, reading each one as it arrives.
- **The bug is the hazard.** Where the route breaks (a dial pointing back the way it came, at a waypoint already visited, or at a pallet not in use), the arm warns with amber lights and a shadow on the surface below, then drops the crate there. The route it will follow is lit in the crate's colour, and the broken dial shows a red cross.
- **The fix is the re-teach.** Mike holds E at a dial: the fix, 2.2 s of his own time. The dial turns to its next exit, the route redraws, and the arm's next trip goes further. The break is usually beside the next dial he needs, so he works under the drop; that is where the camera clips earn their place.
- **The rounds:**
  1. Two dials on the floor point back; it takes 2 turns.
  2. Branches and dead ends, with the top route over to dial E; it takes 4 turns.
  3. Sorting: orange and blue crates alternate, there's a blue pallet bottom left, and dial D becomes a sorter that sends each colour its own way and cannot be re-taught. Both routes must work, and the dials they use must not clash; it takes 6 turns.
- **The rules hold:** the break shows where the trouble is (the next-point marker of the earlier bosses), but nothing shows the right setting. The hold is the shared fix, the clip rules are unchanged, and the arm and its crates run on machine time.
- **Removed:** the arrow buttons, cables, console, wall screen, banner, the falling-crate feeders, the wall arms and the floor rover. The last two swept the dials' own spots faster than a re-teach could be done.
- **A checkpoint inside the cell door.** Without it, a lost life during the boss respawned Mike outside a shut door. That bug was in the old Teach Cell too.

**HUD decluttered on all three levels** (the shared `js/hud.js`):
- Two small pills: health and lives top left, the camera top right. The camera pill shows a footage bar normally and clip pips in a boss, with a red outline while filming.
- Score and salvage appear under the left pill for 2.5 s when they change, and while paused.
- Level 2's static charge is the one extra pill, because it keeps him alive.
- The route, journey and section panels move to the pause screen.
- The viewfinder is thin corners, one small "REC · 120 FPS · SLOW ×0.2" line, and the focus box on Mike (Jof's earlier direction, kept).
- Level 1's boss helper is one slim "Hold E to fix" pill.
- Level 2's small boss progress strip stays. Level 3's round lamps are on the chute, in the world.

## Revision 2: 1 October 2026, after Jof played the slice

This section supersedes anything below it that it contradicts. The earlier text is kept as the design history.

**Jof's notes, in summary:**
- Revise hard: three times the length to the boss.
- Not every layer needs to be open everywhere; block some off per section, for a better puzzle and less to draw.
- The boss: no hand-holding, but he had no idea what to do. Tell the player what they are trying to do, and how the arrows relate to the console.
- A drastic redesign of the cobots, so they are much more recognisable as cobots, still unbranded.
- Good cobots do not wait to be used. Pass one and you are picked up, with no choice, and could end up anywhere, on any layer. The only way to avoid one is to jump over its gripper.

**What changed**

| | Built |
|---|---|
| **Length** | About 117 tiles to the boss became 352. There are eleven sections: Induction bay, the Switchyard, Assembly line, Transfer tower, Roof and return, the Loop, Weld row, the Crossing, Pack-out, Marshalling, then the Teach Cell. The planning test player's run takes 75 s to the door (21 s before) |
| **Blocked layers** | Each section opens 2 to 5 of the five layers. Closed layers are filled with fenced robot cells, drawn as light-guard panels with a still cobot behind each one. A closed layer runs from its own deck to the deck above, so it is a wall, never a pit. Every drop is between open layers, and none falls further than the view shows (the routes suite checks this). Hubs open every layer; lanes open two or three. Roof and return opens only the roof and the undercroft, with a wall of cells between them |
| **Carriers** | The gripper hovers at waist height over the walkway and sways a little; the floor under its reach is marked with mint chevrons. Touching it, anywhere on the body, means a grab: no choice, and no letting go. Each carrier has a list of destinations and sends him to the next one each time it grabs, round and round: up a layer, down a layer, on, or **back** (the Switchyard can throw him back into the induction bay; the line's cobot can send him back to the belt). The only way past is over the gripper. A small arrow on its trolley shows where it will send him next, for players who look. Nothing hurts him while he is held. After a ride the carrier rests at home for 0.5 s before it can grab again. Every ride and every destination is checked to be clear of scenery and of every hazard |
| **Cobot look** | Generic cobot features: a round base flange; round joint housings with a light ring in each cap; smooth white tubes; an offset three-joint wrist; a tool flange; a cable. The colours are white and graphite only, plus the bands. Carriers hang upside down from a trolley on an overhead track under the deck or roof above (how real plants move cobots over distance), so their arms stay a cobot's size. Their rings and bands are mint, and the gripper is a soft two-finger gripper. Hazard cobots stand on pedestals or hang from beams; their light rings show green, amber or red, which is the traffic light, alongside the yellow-and-black bands |
| **The Teach Cell** | (1) As the cell wakes, a banner says once: **RE-TEACH THE BIG ARM**, "E at an arrow button adds that move. Hold E at the console to run the program." (2) The screen states the job in words: **MOVE THE CRATE TO THE PALLET · 4 MOVES**. It shows the gripper holding the crate, the pallet, and the stacks. (3) **Every button press steps a ghost gripper across the grid**, so the player learns which way each arrow moves the arm by pressing it. If a move would drive the crate into a stack or off the grid, the ghost stops there, the slot turns red and a cross flashes, before he runs it. Tapping E at the console takes a move back. (4) It never shows the answer: there is no solution, no next-key marker, and no hint about whether a full program is right until it runs |
| **Teach Cell screen, 2 Oct** | Jof, at the boss: "where is the pallet and where is the crate?" (on the iPad view they were tiny, and the crate looked like the stacks in its way). Now there are three things that look nothing alike: **the crate**, bright orange and glowing, in the arm's yellow claw; **the pallet**, solid green slats under a pulsing ring; and **the obstacles**, grey steel blocks with hazard stripes, not crates. The header says the job with the same pictures: MOVE [crate] TO [pallet]. The program is a numbered column on the right, so the grid fills the screen's height (cells about 40 % larger). The console sits lower so it no longer covers the screen |
| **Kept** | The hazards, hooks, rovers, crates, belts, route log, save keys, campaign rules, the three puzzle sets, the 2.2 s run hold, and boss clips. Still 56 salvage, now across the whole level |

## Jof's brief, in his words (summary)

> Cobot mania. Collaborative robots whisking about. Some of them pick you up and move you to different parts of the level: lots of conveyors, moving arms, grabbing hooks. A cobot hazard moves back and forth across the floor and you have to dodge it. Some cobot arms will hurt you. Label the ones that pick you up and the ones that cause damage with different coloured bands. **The ones that move you can never cause damage.** It is an epic level in terms of layers and size: a player would have to play a lot to cover every possible path. Start with **5 possible paths to the exit**. Keep the fix mechanic for the final boss, but do not repeat the Level 1 boss: make something new that fits the cobot theme. Maybe a programming element rather than coding: working at a console on on-screen puzzles while hazards fall, or similar.

## Where this brief pushes back, plainly

Per the working agreement, anything that isn't practical is said here, then delivered in the best form.

1. **Five fully separate start-to-exit paths would be five levels' worth of building and testing**, and each path would only be seen once in five runs. The design instead **braids five lanes through three hubs**. There are five complete, distinct routes from start to exit, one per layer. At every hub a player can change layer, which gives 5 × 5 × 5 = **125 different paths**, plus the mid-lane drop-throughs. That meets "play a lot to cover every path" at about 2.5 times Level 2's building effort, not five times.
2. **Colour alone cannot be the label.** About 1 in 12 men cannot tell green from yellow or red. Each band therefore carries a **pattern and a shape** as well as a colour:
   - the arms that move Mike have mint bands with white chevrons that point where the arm will take him, and a soft padded cradle;
   - the arms that hurt have yellow and black diagonal stripes, the industrial warning pattern, and a visible tool.

   Both are readable in greyscale. The chosen colours sit on the blue/yellow axis, which colour-blind players still see.
3. **A pop-up console puzzle that freezes Mike would fight the touch controls and stop the platforming.** Instead **the console is the arena**. The puzzle is on a big screen on the back wall. The program keys are big floor-standing buttons spread across three tiers. Mike enters the program by running to the keys while crates fall, then holds Fix at the pendant to run it. This is "work at the console while hazards fall", played with the same five controls as the rest of the game.
4. **"Can never cause damage" is kept literally, and made stronger.** A mint-banded arm or hook has no hurting part at all. **While one is holding Mike, nothing can hurt him.** Carrier paths are also routed clear of every hazard's reach, and a test checks this.
5. **A tall level is the main risk on an iPad 5**, not a wide one. Level 2 caches whole-height strips of scenery. Level 3 caches square tiles of scenery instead, so memory stays flat however tall the level is.
6. **Linking Level 2 to Level 3 changes Level 2's results card.** Jof asked for "Play again" only on that card. The link is left for him to switch on after he has played Level 3. Until then the level opens locally only, like every debug page.

## Intent

A bright, busy, cheerful cell floor: collaborative robots working next to people. After Level 1's dark night shift and Level 2's flooded tanks, this level should feel lit, fast and full of motion. The robots are everywhere: arms on pedestals, arms hanging from the ceiling, hooks running on overhead rails, rovers shuttling across the floor, conveyors linking every cell. Some of the robots are friendly and some are not, and **the player can tell which at a glance**.

The core verb is new: **being carried**. Going down is always free, because Mike can drop. **Going up needs a cobot.** Every rise between layers is a ride on a mint arm or a mint hook, so choosing a ride is choosing a route.

This is a fictional game environment. No real manufacturer's name, model, colour scheme or recognisable arm design is used. In particular, avoid the pale-grey arm with pale-blue joint caps that one well-known cobot maker uses. These arms have cream links, graphite joint housings and the two band colours only. The machines are generic, stylised and unbranded, as the brief requires. MTDCNC's own assets (Mike and the lock-up) are used exactly as supplied.

## The two bands

| | **Carrier** (moves Mike) | **Hazard** (hurts Mike) |
|---|---|---|
| Band | Mint `#2FD6A8` with **white chevrons** pointing along its ride | **Yellow and black diagonal stripes** |
| End of arm | Soft padded cradle, rounded jaws, green pads | A visible tool: spot-weld tips, deburring spindle, crate gripper, jaws |
| Lamp | Mint "ready" lamp at the pick pad | Traffic light: green (safe) → amber (tell) → red (active) |
| Floor mark | Mint ring pad where he stands to be picked up | Yellow and black hatching on the floor it sweeps, where it reaches the floor |
| Contact | Never hurts. The arm and cradle are not solid; he passes through them | Hurts only while its light is red. Its tool is hot, spinning or clamping only then |
| Riding | Immune to all damage while held | — |

Standing rules carried over from the owner's earlier directions:
- gates and hazards use traffic lights, never numbers;
- every machine has visible supports (pedestals bolted down, ceiling mounts on beams, rails on hangers);
- no decorative machine stands in the play path unless it is a real hazard or a real carrier;
- the camera slows machines, never Mike.

## Machines

All times are machine seconds, so the camera slows them. Mike's own movement, and the repair hold, always run on real time.

### Carriers (mint)

- **Pick-and-place arm.** Mounted on a floor pedestal, a deck or the ceiling. It waits at its pick pad with the cradle open. When Mike stands on the pad for 0.25 s, the cradle closes (0.35 s) and the arm lifts him along a smooth arc to its drop pad, then sets him down on his feet and swings back empty. It never moves without him (the `wait` mode). A few are `cycle` arms that keep swinging on their own rhythm, so Mike has to be on the pad as the cradle arrives. That is the timing challenge, and filming slows them down to make the catch easier.
- **Overhead hook.** A trolley on a ceiling rail, with a hanging handle banded mint. It rides back and forth continuously and pauses at each end. Mike grabs it by jumping into the handle. While he hangs he is carried and safe. **Jump lets go**, with a small hop and the hook's own speed. Letting go in the right place is the skill in the hook lanes.
- **Letting go of an arm.** Jump also releases Mike from an arm once the cradle has closed. He falls from wherever he is. This is a deliberate skill shortcut, and the routes test counts it.

### Hazards (yellow and black)

- **Cell arm.** Mounted on a pedestal, a wall or the ceiling. Its tool sweeps an arc: parked (green), amber tell with the tool spinning up or the tips glowing, the strike sweep (red), a hold at the end (red), then a slow cold return (green). Only the tool head hurts: 0.55 tiles around its tip, and only while red.
- **Floor rover.** A mobile robot that shuttles between two points and pauses at each end, with a beacon showing its direction. The **low rover** can be jumped. The **tall rover** carries a rack and cannot be jumped, so Mike needs an alcove, a carrier, or the pause. It is always dangerous to touch, but always in plain sight, so it has no tell.
- **Crate drop.** An overhead feeder or the boss arm releases a crate. The tell is a shadow on the landing surface that darkens for 0.9 s, together with an amber lamp. The crate hurts while it falls, lands, and breaks harmlessly.
- **Conveyors.** Level 1's belts, placed on any layer. Some run one way; some reverse, with the arrow tell from Level 1. They push, and never hurt.

## Layout: five layers, three hubs

World units are Level 1's 32 px tiles. The finished level is **480 tiles long and 44 tall**. Layers are 8 tiles apart, so the landing of every drop is inside the view once he looks down. Nothing is ever a blind drop. A layer is too high to jump, because the jump is 3 tiles, so every rise is a ride.

| Layer | Stands at y | Lane character |
|---|---:|---|
| Gantry roof | −12 | Trusses and skylights. Few hazards, long hard jumps, most of the salvage. Reached only by the longest rides |
| High line | −4 | Overhead hook rails and crate feeders. Hand-over-hand timing |
| Mezzanine | 4 | A walkway past the robot cells. Arms reach over the rail |
| Shop floor | 12 | The main line. Rovers, belts and floor arms. The obvious route |
| Undercroft | 20 | Conveyor return tunnels under the floor. Low ceiling, fast belts, crates dropping through hatches |

| x range | Area | Purpose |
|---|---|---|
| 0–48 | **Induction bay** (floor and mezzanine only) | Teaches both bands safely. The first ride is a carrier from the floor up to the mezzanine, with nothing dangerous near it. The first hazard arm and the first rover are on the floor, well spaced |
| 48–64 | **Hub A: the Switchyard** | A tall atrium with a checkpoint on the floor, and carriers from the undercroft to the floor, the floor to the mezzanine, the mezzanine to the high line, and the high line to the gantry. Every lane of Zone 1 leaves from here |
| 64–176 | **Zone 1: Assembly line** | Five lanes, below |
| 176–192 | **Hub B: Transfer tower** | Same pattern. A checkpoint and rides between every layer |
| 192–304 | **Zone 2: Weld row** | Five lanes |
| 304–320 | **Hub C: the Loop** | Same pattern |
| 320–432 | **Zone 3: Pack-out** | Five lanes |
| 432–448 | **Marshalling** | Every lane drops down to one floor corridor. The last checkpoint |
| 448–480 | **The Teach Cell** (boss) | Below |

### The fifteen lanes

Each lane has one idea of its own, so no two feel alike. This table is a plan; each lane is authored by hand and tested by itself.

| | Zone 1: Assembly line | Zone 2: Weld row | Zone 3: Pack-out |
|---|---|---|---|
| **Gantry** | *Truss walk*: long jumps between roof trusses, with a swinging hook to cross the widest gap | *Skylights*: two arms pass him between them in mid-air, a hand-off | *Crane cab*: one long hook ride over the whole zone, letting go to collect and grabbing back on |
| **High line** | *Hook relay*: a chain of hooks on staggered rails, hand over hand | *Crate drop*: hooks run over a feeder that drops crates on the rail below | *Sorting arms*: hazard arms hang from the ceiling between the hook rails |
| **Mezzanine** | *Cell row*: three welding arms reach over the rail in turn | *Spot-weld alley*: arms in opposed pairs, alternating | *Pick and place*: three `cycle` carriers relay him across a gap in timed hand-offs |
| **Shop floor** | *The line*: a belt, two low rovers, and a carrier that lifts him over a tall rover | *Rover yard*: three rovers at different speeds, with parking bays to hide in | *Wrap station*: tall rovers and belts, where the carriers are the safe way through |
| **Undercroft** | *Return belts*: fast return conveyors, crates through hatches | *Sump*: reversing belts under a low ceiling | *Sorter*: belts that change direction to send him into different exits |

Rules for every lane:
- a complete route exists with no optional pickups;
- dropping down is always possible and always lands somewhere with a way on;
- no dead ends in any state, which the routes suite enforces;
- every rise has a visible ride.

### Salvage, secrets and the route log

- **56 salvage per level**, the same as before, weighted towards the hard lanes. Gantry lanes hold 4 each and undercroft lanes 3 each. The rest are shared out through the hubs, the induction bay and the other lanes. **A full collection in one run means weaving between layers mid-zone**: every zone has a carrier up at about a third and two thirds of its length. That is possible, and hard.
- The usual SD cards, lubricants and **one hidden Mini Mike**. It is behind a loose ceiling panel on the gantry of Zone 2, reached by letting go of a hook at exactly the right point.
- **Route log (new):** the fifteen lanes are remembered **across runs**, on the device, in Level 3's progress record. The results card shows a 5 × 3 grid of lanes with the ones travelled lit ("Routes explored 7 / 15"), and "every route" has its own badge. This is the "play a lot to cover every path" hook. It is a familiar mechanic (a map that fills in), not an in-play helper.
- **Route map in the HUD:** the journey panel from Level 2 becomes a small five-row strip with Mike's dot and the lanes travelled lit. The level is too tall to hold in one's head without it. **Owner decision:** keep it, or remove it and rely on the lane colours of the walls alone.

## The boss: the Teach Cell

**The fault:** the cell's big overhead cobot, "the Big Arm", has lost its program. It swings along its track, dropping crates wherever it stops. Mike does not fight it. **He re-teaches it.** This is programming in the robot sense: a short sequence of moves, entered on the pendant.

### The arena

This is one fixed frame, 24 tiles by 13.5 tiles, so nothing is ever off-screen.

- **Screen:** on the back wall, top centre. It shows the pallet grid (5 × 4 cells), the Big Arm's gripper, the target pallet, the stacks in the way, and a row of empty program slots.
- **Keys:** big floor-standing push buttons with arrows. **↑** on both top ledges, **←** on the left deck, **→** on the right deck, **↓** in two places on the floor. Their positions match their meaning, roughly, so they are easy to learn.
- **Pendant:** in the middle, on a grating under the screen. **Tap Fix = delete the last move. Hold Fix = run the program** (2.2 s of Mike's own time; **the fix, exactly as in Levels 1 and 2**, including the "Hold E to fix" helper).
- **Mint carriers** in both corners lift him from the floor to the top ledges. Everything else is reached by jumps and drops.

### A round

1. The screen shows a puzzle: move the gripper from its start to the target in **exactly N moves**, where the slots show N, without passing through a stack.
2. He runs to the keys in order. Each tap of Fix at a key adds that arrow to the program on the screen. Standing at a key lights it; nothing points to the next one.
3. When every slot is filled, the pendant's RUN lamp lights. He holds Fix there.
4. **Right:** the Big Arm plays the program slowly on the screen and in the arena, stacks the crate, and one of its three fault lamps turns green. That is round done.
   **Wrong:** it plays the program to the move that fails, jams, shakes, and drops **three crates around the pendant** with shadow tells, and the program clears. There is no health cost unless he stays under the crates.
5. **Any sequence that works is accepted.** The game runs the program on the grid, so there is no single hidden "right answer", only valid programs. The builder checks that the shortest solution of every puzzle is exactly N moves long.

Three rounds of 3, 4 and 5 moves. The hazards rise with each round:

| Round | Hazards (machine time; the camera slows them) |
|---|---|
| 1 | Crates from the Big Arm on a steady beat |
| 2 | Crates faster (× 1.15) plus a low rover on the floor |
| 3 | Crates × 1.3, the rover, and the Big Arm sweeping the top ledges between drops |

- **Three puzzle sets**, like the three orders of earlier bosses: each finished run meets the next set.
- A lost life restarts the current round, with the program cleared and the solved rounds kept.
- **Camera clips:** the shared boss clip rule (`M.CLIP`: 5 s clips, SD cards are spare clips, one clip recharges) applies unchanged. A clip covers one run hold, or one dash through a crate volley.
- **Why this is not Level 1 again:** there is no hidden order to learn by failing. The puzzle is fully visible, and the challenge is working it out and then getting across the arena to enter it under fire. The "next point" marker from Levels 1 and 2 is deliberately **not** used, because it would give away the answer. The RUN lamp and the lit key under his feet are the only markers. **Owner decision:** confirm this is acceptable.
- **The ending:** the Big Arm runs its corrected program once, slowly: it lifts each wrong crate onto the pallet, the fault lamps turn green, the exit door lifts, and the results card follows.

## Controls

These are unchanged from Level 2, apart from the verbs:

| | Keyboard | Touch |
|---|---|---|
| Run | ← → / A D | ◀ ▶ |
| Jump; **let go of a carrier** | Space / W / ↑ | Jump |
| Look below | ↓ / S | Look |
| Camera | C / Shift | Camera |
| Press a key; tap to delete the last move; hold to run the program | E | Use (shown only where it does something) |

There is no swimming and no static in this level. Mike keeps his normal look: no suit.

## Checkpoints, lives and saves

- A checkpoint on the floor of every hub, one mid-way along each lane, the marshalling checkpoint and the boss entry. Standard lives and health, lubricants heal, and a Mini Mike is an extra life.
- Carriers and hooks reset to their waiting pose on a respawn; no ride is ever needed to leave a checkpoint.
- Own save keys `mike-game.l3.v1.*`. The campaign rules are unchanged: one continue earned per level, restart means restart, and **Level 3 opens off-local only if the campaign record has cleared Level 2**.

## Iconography and palette

- **Scene:** a bright assembly hall. A warm grey floor with yellow walkway lines, white-lit cells behind light-guard frames, cream arms, graphite joints, and a navy architecture that takes the MTDCNC blues from Level 1 in a lighter key. A layer is readable from the colour of its wall stripe: gantry white, high line sky blue, mezzanine teal, floor warm grey, undercroft dark slate.
- **Sounds:** servo whirr on the carrier's move, a soft pneumatic grip, a hook trolley rumble, a warning chirp on a hazard tell, a crate thud and splinter, button clicks, a pendant beep, a success chord, and a jam buzz. They are synthesised, not recorded, and cost nothing.
- **Voice:** the same seven approved clips, no subtitles, nothing new.

## Performance budget (iPad 5)

- Scenery is cached as 16 × 16 tile squares, twelve at most, whatever the level's height.
- Arms are drawn as capsules and circles: no gradients per frame on moving parts, and at most about ten arms on screen at once.
- Reduced quality drops the parallax, sparks and shadows' soft edges first, never the tells or the bands.

## The first build: a playable slice

Before building the full 480 tiles, this is a **slice that proves every new mechanic and the boss**, for Jof to play first. It follows the same gate as Level 1 (he saw demo renders before the full build was committed).

| x | Part of the slice |
|---|---|
| 0–48 | The induction bay, final form |
| 48–64 | Hub A, the Switchyard, final form |
| 64–112 | A 48-tile **lane sampler**: the first stretch of all five Zone 1 lanes, one on each layer |
| 112–120 | The drop-down to the boss door (a stand-in for Marshalling) |
| 120–144 | The Teach Cell, all three rounds, all three puzzle sets |

The slice has its own salvage count, which is not the level's 56. Once Jof has played it: tune, then author Zones 1 to 3 and the other two hubs, then move the boss to x 448.

## Acceptance

- **Carriers:** they pick up and set down on their feet; they never hurt; nothing hurts while he is held; the ride paths are clear of solid scenery and of every hazard's reach.
- **Hooks:** grab and let go; the hop off.
- **Hazards:** they hurt only while red; rovers and crates hurt; belts push.
- **The camera** slows every machine and never Mike.
- **Boss:**
  - key presses are counted, tap undoes and hold runs, on real time;
  - right programs advance and wrong ones jam and clear;
  - a lost life keeps the solved rounds;
  - every puzzle's shortest solution is its slot count;
  - all three sets can be won.
- **Routes:** every standing place can be reached from the start and can reach the exit; there are no dead ends; the drops are never blind.
- **Browser:** keyboard, touch, pause, save and reload work; no errors; nothing is fetched after load; captures of each machine and of the boss.
