# Mike the Mic — Level 1: The Tangled Workshop

Design for owner review and subsequent implementation by Opus 5.5. `brief.md` is authoritative; recommendations below are build defaults, subject to Jof's review. Tile distances use T = 32 logical pixels. Timings are seconds.

## 1. Pitch and tone

Mike races through a cheerful, slightly menacing rogue machine shop, gathering spares and using his video camera to slow dangerous machinery before repairing the enormous Tangled Turner. Aim for Sonic pace with Mario readability: satisfying acceleration, generous landings, visible warnings and short stretches of exhilarating speed between deliberate crossings. Everything is family-friendly; impacts produce a startled wobble, never injury. Mike never fights: he observes, dodges and fixes. Every machine is an invented cartoon construction: no real machine-tool brands, logos, model names, identifying colour schemes or recognisable features, including in backgrounds, sounds and promotional artwork. Use abstract mechanisms, not traced equipment.

## 2. World and level framework

A level is one malfunctioning machine, its approach through the workshop and its final repair arena. Fixing it restores one workshop bay, opens the next route and produces a results card with Continue and Replay. Level 1 ends with “Workshop bay restored”; until more levels ship, Continue returns to level selection.

Carry unlocked levels, best scores, settings and remaining lives between levels. Start each new level with three health points and full camera charge; spare parts and control units belong to their level and never carry. Replaying a completed level starts a separate three-life attempt without changing campaign lives.

A template contains geometry, spawn/checkpoints, hazard instances and their patterns, collectible identities, tutorial triggers, camera bounds, repair sockets, phase transitions, recovery supplies and results/next-level metadata. All encounters use reusable behaviours and declarative timelines; no executable code in level data.

Future examples:

- **The Wobble Press:** offset platforms and stamping pads around an absurdly springy compression machine.
- **The Chip Carousel:** rotating scrap baskets feed a confused sorting drum.
- **The Dripping Mixer:** alternating coolant curtains surround a lopsided mixing vessel.
- **The Sleepy Feeder:** reversing belts deliver parts to an oversized folding hopper.

## 3. Mike: movement, controls and puppet

Mike renders 2T tall, preserving the SVG's proportions. His collision box is 0.75T wide × 1.65T high, bottom-centred; gloves and foam edges are forgiving decoration. Ground speed caps at 7T/s, acceleration 28T/s², braking/reversal 42T/s²; air acceleration 18T/s². Releasing direction brakes on ground, preserves horizontal speed in air. No sprint, crouch, slide, double jump, wall jump or ledge grab in Level 1.

Jump impulse is 12T/s upwards; gravity 24T/s², terminal fall 18T/s. Held jump reaches 3T in 0.5s; same-height flight is 1s. Releasing jump while rising caps upward speed at 6T/s, giving an immediate tap approximately 0.75T height. Coyote time 0.12s; buffer 0.15s; one jump per press. Max ordinary gap 4T, with 3T run-up and 2T landing. Platforms rise at most 2T per step. Walk off ledges normally; show pits before the player reaches them.

Belts add surface velocity while grounded, after player acceleration; carry their current velocity into take-off, capped at ±10T/s total. No air conveyor force. Hit: lose one health, knock away at 4T/s and upwards at 5T/s; ignore movement for 0.18s, then recover control. Invulnerability lasts 1.5s of player time, shown by a steady pale outline. Overlapping hazards cause only one hit. Invulnerability ignores damage, never solid terrain or pits. No stomp damage.

Start with three lives, including the current attempt; an SD card adds one, maximum nine. Zero health or falling below y=17 costs one life. Respawn after 0.7s at the latest checkpoint with full health/charge and 1.5s protection. Keep collected items, score and completed repairs; reset local hazards to their initial warning. At zero lives, offer “Continue from checkpoint”: restore three lives, preserve progress, record a continue in results. No forced restart. Checkpoints at global x=2, 102, 206 and 297; first arrival also heals and charges. A checkpoint cannot be farmed by re-entering it.

Keyboard: A/D or arrows move; Space/W/Up jump; C/Shift toggles camera; E holds repair; Escape/P pauses. Opposed directions cancel. Touch: left/right, each 64 CSS px, bottom left; Jump 76px bottom right; Camera 64px above-left of Jump. A contextual 64px Fix button appears above Jump only beside a socket. Minimum button gap 12px, safe-area inset 12px; allow three simultaneous fingers. Camera toggles, so a thumb is free for jumping. Pause/sound targets are at least 48px. Portrait pauses with a rotate prompt; menus remain usable upright.

Animate the supplied `reference/mike.svg`, never redraw Mike. Use its documented pivots, clockwise-positive degrees and nested transforms. Angles below are absolute offsets from the drawing. Rest: `armL_upper=-75`, `armL_lower=-15`; other joints zero. Blend poses over 0.08s.

- **Run:** phase advances one cycle per 3T travelled. `legL=-2+24sin(p)`, `legR=-2-24sin(p)`; `footL=4-12sin(p)`, `footR=4+12sin(p)`. Upper arms oscillate ±22° around rest in opposition to corresponding legs; lower arms ±8°. Root `stem` bobs 0.04T; `head` nods ±3°.
- **Jump/fall:** legs −18°/+18°, feet +12°/−8°; left upper/lower −40°/−10°, right upper/lower −35°/−15°; head −4°, then +3° when falling. Land: root lowers 0.08T and legs splay ±12° for 0.10s, recovering over 0.08s; no input lock.
- **Hit:** root tilts 10° away; arms −20°/−70° at shoulders, elbows zero; head +6°. Recover over 0.25s.
- **Camera:** attach a separate unbranded charcoal camera prop to the transformed right glove; right upper/lower −105°/−12°, left at rest. Legs retain locomotion. No artwork covered on the head.
- **Fix:** right pointing pose oscillates ±6° at elbow, left upper/lower −55°/−25°, head nod ±6° twice per second; legs planted. Part icon travels into socket only on completion.
- **Gesticulation:** a free 0.6s wave (`armL_upper=0`, lower ±12°, head ±6°) at safe tutorial pads or after three idle seconds. Costs no charge, health, time penalty or control; input cancels immediately. No speech mouth or face.

Turn the head towards travel using the SVG formula: t clamped to ±40°, lock-up translateX=150sin(t), scaleX=cos(t), angles converted to radians; preserve `faceClip` and documented `shadeL`/`shadeR` opacities. Never mirror the puppet or its lettering. Bake joint poses from the approved source for runtime rendering; preserve embedded branding and resolve its image reference locally.

## 4. Video camera: slow the machinery

Choose **slow motion**, not multiple time modes. Camera time runs at 20% while Mike remains at normal speed: the player gains a useful gap without losing the pleasure of movement. It affects hazard phase clocks, projectiles, spindle motion, belts and coolant; static solids and existing dangerous contacts remain dangerous. It cannot reverse damage, restore items, slow Mike's gravity, health immunity, repair progress or checkpoint timers. Affect all activated hazards consistently, including those just outside view.

Charge is 0–100; start full. Press toggles on immediately if charge ≥25 and cooldown is zero; consume 25/s, up to four seconds. Toggle off or depletion starts a 1s cooldown, followed by recharge at 12.5/s while off, wherever Mike stands. No recharge while active. Cooldown and meter use player time. Hits do not cancel the effect; death does. At empty, machinery resumes its exact phase without catching up. Warn during the last 0.5s with a shrinking white meter and soft double tick. Failed activation gives one quiet click and “Charging”; holding never repeatedly retries.

Feedback: blue viewfinder corners, labelled “SLOW ×0.2”, dashed outlines on affected hazards, softened descending camera hum and a 100-unit HUD bar marked at 25. No full-screen flash or obscuring filter. Camera is fictional animation, never device camera access.

Three required crossings have 2.4T ceiling clearance, preventing jumping over the danger. They are safe to study from marked staging pads. Local crossing coordinates below include clearance for Mike's body:

1. Section 3 spitter gallery: fire lanes leave only a 0.30s clear interval after the second projectile exits; crossing takes about 0.70s from rest at its edge. Start slow as the lane clears: interval becomes 1.5s.
2. Section 5 arm gate: a 4T passage opens for 0.40s at full retraction, requiring about 0.85s from rest at its edge. Slow at the open chevrons to gain 2s.
3. Section 8 jaw gate: 3T passage opens for 0.45s, requiring about 0.70s from rest at its edge. Slow when both pads separate to gain 2.25s.

Outside these gates, timing and jumping usually suffice. Use camera for confident flowing runs and optional shortcuts; never require perfect depletion timing. Missing the window permits retreat to a safe pad and recharge. Damage or a life loss is the worst outcome, never a locked route. Gate hazards span the corridor; no damage boost passes through their closed solid blockers.

## 5. Hazards and enemies

All damage is one health unless stated. Timings are machine seconds, multiplied by five during slow motion. Cycle begins with its tell. No random targeting or off-screen shots. Activate an encounter once its staging pad is visible; retain phase until death/reset.

| Name / look / size | Behaviour, warning, harm and escape |
|---|---|
| **Rattle Spitter** — bulbous scrap pot on mismatched feet; 2×2T, parts 0.45T | 3s cycle: rattle 0.6s, spit at 0.6/0.9s, rest. Parts move horizontally 6T/s, vanish at catch tray ≤8T away. Bright hollow circles mark trajectory; contact hurts. Jump or wait behind solid cover. Gallery variant uses two staggered lanes at y=10.5/11.5, solid shutters between bursts, with a 0.30s fully clear crossing per 3s cycle. |
| **Tickle Spindle** — padded three-pronged grabber on bead-like joints; base 2×2T, reach 5T, tip 1×1T | 4s cycle: dotted reach warning 0.7s, extend 0.5s, left-to-right 90° sweep 1.4s, retract 1s, open 0.4s. Tip/arm contact hurts; no pinning animation. Ground niche beyond reach is safe. Gate variant has a solid blocking forearm until fully retracted; use camera in open interval. |
| **Contrary Belts** — grey slats with yellow direction arrows; lengths specified below, 0.5T high | Surface ±3T/s. Reverse every 4s: last 0.8s arrows pulse and slats decelerate to zero, then reverse. No contact damage; pushes towards gaps. Jump between belts or slow before reversal. Adjacent belt runs have 2T pits; stationary landings separate encounters. |
| **Service Pits** — dark opening with broken yellow rim; 2–4T wide | No moving clock. Dotted landing arc at first pit. Falling below y=17 loses a life; jumping is the solution, camera cannot suspend falling. No hidden pits behind scenery. |
| **Coolant Sneezes** — pear-shaped tank and bent nozzle; base 1×2T, jet 2×3T | 3.5s cycle: three swelling droplets for 0.7s, jet 1.1s, drain/rest 1.7s. Jet hurts, drained floor is safe and not slippery. Wait on dry shelf or jump above nozzle; slowing a live jet prolongs danger. |
| **Clapper Jaws** — two oversized rounded pads with unequal bolt circles; opening 3×2.4T | 3s cycle: striped edges tremble 0.6s, close 0.25s, closed 1.1s, open movement 0.6s, fully open 0.45s. Contact while closing hurts and pushes towards entry; solid when closed. No lethal crushing. Wait outside outline, then camera through the opening. |

Gallery shutters open only at cycle time 2.7–3.0; shots at 0.6/0.9 traverse its 3T width left-to-right into trays. Shutters clear instantly at 2.7, close at 3.0 with the continuously visible countdown. Arm gate pivot is above corridor centre at y=8; its forearm blocks the corridor until time 3.6–4.0. A closing gate ejects overlapping Mike to its entry edge and applies at most one hit, never traps him. Ordinary spitter mouths fire at y=11.25. Bases are solid; coolant tanks sit behind gameplay. Decorative mechanisms never have hidden hitboxes.

## 6. Collectibles and tally

Twelve spare parts: four bearings (ring), four seals (wavy washer), four couplings (split collar). Boss needs two of each. Eight lie on the main route, two on elevated detours, two guarded. Spares beyond the recipe earn points. Shapes and labels distinguish them without colour reliance.

Four lubricant cans restore one health immediately; at full health they still score. No speed change. Two control units unlock the boss's calibration and restart steps; both are conspicuous on-route pickups. One unbranded standard SD card, hidden on section 6's upper shelf, adds a life. Its outline peeks above the shelf; never use invisible walls.

Parts 100 points each, lubricant 50, control units 250, SD 500, completed repair 1,000. Maximum 3,400; recovery supplies score zero. Each unique pickup scores once across deaths/continues. Results show score, parts /12, units /2, SD /1, elapsed active time, lives lost and continues; no speed bonus or punishment for camera use. HUD recipe counts cap at 2/2 per type; total collected remains /12 even after fitting.

## 7. Level 1 layout

320T total, ten contiguous sections. Coordinates below are local to each section; add its start x. Floor top y=12, bottom y=17; all unmentioned floor is solid. Platforms listed as `[start,end)@top`; 0.5T thick, solid from all sides. Pickups default to centre y=11; `@9` means raised. Unspecified scenery is non-colliding. Hazard numbers locate the left edge of their footprint; gates explicitly name their whole corridor. Place 2T safe staging/exit pads immediately outside gates. Roofs cover the gate only, underside y=9.6.

ASCII is schematic, not tile-exact: `=` floor, `_` pit, `>`/`<` belt, `^` shelf, `S` spitter, `A` arm, `J` jaws, `~` coolant, `o` part, `U` unit, `L` lubricant, `D` SD, `C` checkpoint, `R` repair. Numeric specifications override sketches. B/S/C in pickup lists mean bearing/seal/coupling.

| Section; start; length | Purpose, geometry, hazards and pickups | Sketch |
|---|---|---|
| 1. Clocking in; 0; 32T | Safe running/jumping lesson. Spawn (2,12). Shelf [14,18)@10; no pits. B8, S16@9, L25. Introduce camera visually, no danger. | `C==o==^o^====L==` |
| 2. Belt basics; 32; 36T | Teach momentum, then first warning. Belts [7,13) right, [15,21) left; pit [13,15). Spitter at 28 fires left into catch tray x=22; shelf [22,26)@10 offers cover. C10, B24@9. | `==o>>>__<<<==^o^S==` |
| 3. Camera alley; 68; 32T | Teach required slow crossing. Gallery corridor [12,15), catch trays outside walking space; staging x=10. Safe instruction reads “Wait for the gap. Camera. Go.” S7, U22. No pit. | `==o==[S S]==U====` |
| 4. Upper stores; 100; 36T | Checkpoint x=2, exploration breather. Pit [18,21), shelves [10,14)@10 and [23,27)@10. C12@9 (detour), B29, L5. Show distant boss silhouette. | `C=L==^o^==___==^==o` |
| 5. Reach and retreat; 136; 32T | Test slow timing against arm gate [12,16); base overhead, reach confined to corridor. Staging/exit niches cannot be reached. Guarded S20 beyond arm; C27. | `====[AAAA]===o==o=` |
| 6. Coolant loft; 168; 36T | Teach active-versus-resting coolant. Jets at 10 and 24, second offset 1.75s. Shelves [5,9)@10, [12,16)@8, [19,23)@10, all reachable using full jumps. B21@9 (detour), D14@7, L30. No pits. | `==^==~==^D^==^o^~L` |
| 7. Belt run; 204; 36T | Checkpoint x=2; speed set piece. Belts [6,12) right, [14,20) left, [22,28) right; pits [12,14), [20,22). Arrows teach reversals. S26, C32 guarded by spitter at 34 facing left, catch x=29. | `C==>>>__<<<__>o>oS` |
| 8. The clappers; 240; 36T | Peak approach: jaws corridor [12,15), then coolant at 24 with safe waiting floor between. Required third camera crossing; U29. No overlapping danger zones. | `====[JJJ]====~==U=` |
| 9. Service bench; 276; 20T | Full breather; L4; recipe board x=9 previews missing pieces and socket shapes. No hazards. Recovery dispenser x=13 supplies missing recipe quantities/units once, immediately and free; replacement items have distinct IDs, zero collection-tally credit. | `==L==[kit]========` |
| 10. Tangled Turner; 296; 24T | Checkpoint x=1 before arena trigger x=4. Continuous floor, no pits. Repair layout below; no pickups. Exit x=23 opens on win. | `C=R====R====R====>` |

Inventory check: sections 1–8 contain B=4, S=4, C=4, U=2; lubricants in 1/4/6/9. Main-route spares are both in 1/2, B in 4, C in 5, S in 7, S in 3; detours C4/B6; guarded S5/C7.

Difficulty rises from safe movement → single hazards → camera lesson → rest → deliberate arm crossing → exploration → combined movement → final timing test → rest → repair. First-run target: approach 150–210s including observation/exploration, bench 10–15s, boss 65–90s, transitions 5–10s: approximately 4–5½ minutes; one death may take it towards six. Fast replays can be much shorter. Validate with novice touch players; do not add compulsory waiting to manufacture duration.

## 8. Boss: repair the Tangled Turner

One screen, fixed framing. Abstract round central drum with two articulated, bead-jointed spindles; no realistic enclosure. Local floor y=12. Sockets: bearing x=5, seal x=12, coupling x=19, all reachable from floor. Console x=12. Each socket needs two matching spares, fitted separately; then two control units at the console, one after phase 2 and one after phase 3. Eight held actions total.

The entry dispenser guarantees supplies without backtracking. Recipe board lists exactly what it supplied. Auto-save checkpoint includes supplies; death preserves installed parts and consumed inventory. Continuing cannot duplicate either. Repairs are strictly ordered bearing pair → seal pair → calibration unit → coupling pair → restart unit. Label the current destination with its shape and a large downward arrow.

Hold Fix within 0.8T of target centre, grounded and stationary, for 1.2 player seconds. Movement, jump, release or hit cancels the current fitting and resets its progress; no item consumed until completion. A circular socket indicator fills, Mike gestures with the part, then it clicks in. Camera can toggle during fitting. Ignore Fix outside an eligible socket.

Each phase loops a 6s machine timeline: 0–0.8 dotted warning of target lane; 0.8–1.4 extend; 1.4–3 sweep; 3–4 retract; 4–6 both tips parked harmlessly overhead. Safe floor lanes x=1–3 and x=21–23 are always outside reach. Arm shafts are background decoration here; only 1.5T tips hurt. Tips move at y=10.5 when sweeping, so jump or retreat before the marked pass. No homing.

- **Phase 1, bearings:** left tip sweeps x=5→12; right remains parked. Fit at x=5 during parked interval, one or both pieces using slow motion. On second completion left spindle folds away; 2s harmless transition.
- **Phase 2, seals:** right tip sweeps x=19→10. Fit two seals at x=12, then the first control unit there. Second spindle retracts on calibration; 2s harmless transition.
- **Phase 3, coupling/restart:** right tip performs one diagnostic sweep x=19→14 each loop with the same warning/timing; left stays parked. Fit couplings at x=19, then restart unit x=12. Diagnostic movement remains threatening until restart; no surprise acceleration.

Camera turns the 2s parked window into ample repair time; its four-second maximum prevents permanent safety. Recharge while watching a pattern from a side lane. Without charge, one fitting per parked interval is possible. Completed fittings survive all retries. Next-phase clocks always start with the warning, never mid-sweep.

On restart, all damage switches off immediately. Over 3s, arms gently align, the drum turns smoothly, yellow warning marks become steady white ticks, and a clean finished abstract part drops into a tray. Mike waves; quiet resolving chord; exit lights, then results. No explosion, defeated corpse or attack score.

## 9. Presentation

Flat/vector cartoon scenery with rounded corners, clear outlines and impossible proportions, consistent with Mike's silhouette. Preserve Mike's existing texture, gradients and approved branding. Brand red #EB0000, shade #CD0103 and blues #0F579B/#0A4A88/#002C5A belong to interface and architectural backdrops. Machines use neutral #697078/#B9BEC3/#E6E8E9 and small #F4CA46 safety marks; do not apply brand-colour panels or identifying liveries to machines. Abstract silhouettes also require owner review.

Three cached layers: distant rafters at 0.15× scroll, pipes at 0.35×, gameplay at 1×. Keep hazard silhouettes and landing surfaces unobstructed; no foreground occlusion. View follows Mike with 4T directional look-ahead, smoothed over 0.15s; show at least 8T ahead at speed. Boss framing contains the entire arena.

HUD: three health dots, SD icon × lives, three recipe shapes, collected /12 and units /2 top-left; camera bar top-right. Score in pause/results to reduce clutter. Labels ≥22 logical px, warnings ≥28; touch menus use ≥16 CSS px. Use locally bundled licensed Helvetica Neue LT Std Black Condensed for titles, Medium/Roman for body; fallback Helvetica/Arial if font files are unavailable. Use supplied lock-up assets unchanged on title, level card and results, with white variant on red. Never place a lock-up on machinery; Mike's existing head artwork remains intact.

## 10. Sound

Synthesise soft foot taps, rounded jump pluck, landing puff, part chime, lubricant glug, SD two-note lift, camera hum/click, distinct hazard warning ticks, dull hit bonk, repair click and completion chord. No sampled factory crashes, harsh buzzers or piercing alarms. Music: warm bass, muted percussion and sparse bell melody around 108 BPM; boss adds a gentle pulse, not volume. Default master 25%; music below effects; cap eight voices and soften high frequencies. Start audio only after a gesture, persist mute, suspend when paused/hidden. Every warning also has a visual tell.

## 11. Builder notes and data

Plain static HTML/CSS/JavaScript, Canvas 2D. Fixed 960×540 logical canvas; 32px tiles. Fit uniformly inside available landscape stage, letterbox; never alter world dimensions on resize. Reserve touch-control gutters outside the playfield on phones. Match `studio-lab.html`'s fixed bitmap principle, inverse coordinate mapping, pointer capture/cancellation and diagnostic conventions; do not inherit its painting resolution or gesture semantics.

Physics: fixed 1/60s player step; hazards advance by step × timeScale. Accumulate requestAnimationFrame delta, maximum five steps, discard excess after stalls. Pause on blur/visibility/orientation changes, clear held inputs; explicit Resume prevents surprise motion. Use swept AABB terrain/projectile collision, capsule-versus-box spindle tips, tile-grid broadphase and deterministic phase timelines. Resolve terrain before damage and pickups. No pixel collision, slopes or moving platforms required.

Level JSON shape below illustrates section 3; production data expands every section using the numeric schedule above. Positions use tile units; rectangles use `[x,y,width,height]`; pickup positions are centres; spawn/checkpoints are foot positions. Prefabs supply the documented default behaviour. Unknown types/IDs, invalid recipes, unreachable exits and unsafe checkpoint overlaps fail validation.

```json
{
  "version": 1,
  "id": "tangled-workshop",
  "title": "The Tangled Workshop",
  "size": [320, 17],
  "spawn": [2, 12],
  "next": null,
  "theme": "neutral-workshop",
  "sections": [{
    "id": "camera-alley", "x": 68, "width": 32,
    "solids": [[0,12,32,5],[12,0,3,9.6]],
    "hazards": [{"id":"gallery","type":"spitterGallery",
      "rect":[12,9.6,3,2.4],"cycle":3,"clear":0.3,"phase":0}],
    "pickups": [
      {"id":"seal-2","type":"seal","at":[7,11]},
      {"id":"unit-1","type":"controlUnit","at":[22,11]}
    ],
    "triggers": [{"at":10,"once":true,"message":"camera-gap"}]
  }],
  "checkpoints": [[2,12],[102,12],[206,12],[297,12]],
  "recovery": {"at":[289,12],"recipeOnly":true,"score":0},
  "boss": {
    "bounds":[296,0,24,17], "type":"socketRepair",
    "recipe":{"bearing":2,"seal":2,"coupling":2,"controlUnit":2},
    "hold":1.2,
    "sockets":[[301,12,"bearing"],[308,12,"seal"],[315,12,"coupling"]],
    "console":[308,12],
    "phases":[
      {"pattern":"leftSweep","targets":[5,12],"fit":"bearing","count":2},
      {"pattern":"rightSweep","targets":[19,10],"fit":"seal","count":2,"unit":true},
      {"pattern":"rightSweep","targets":[19,14],"fit":"coupling","count":2,"unit":true}
    ],
    "timeline":{"tell":0.8,"extend":0.6,"sweep":1.6,"retract":1,"park":2}
  }
}
```

Budget for iPad 5 Safari: 60fps target, sustained 30fps minimum; p95 update+draw ≤12ms at target quality. Backing store stays 960×540, independent of devicePixelRatio. Decoded images/canvases ≤48MB, ≤120 active entities, ≤32 projectiles, ≤40 cosmetic particles, ≤120 draw calls/frame. Pre-bake puppet pose atlas including original foam texture; no runtime SVG filters. Cull beyond one screen margin, pool effects, cache terrain in small chunks. After 90 slow frames, reduce particles/parallax only; physics, tells and collisions remain identical. Measure on actual iPad; desktop emulation is insufficient.

Track inputs by pointerId; capture on press; clear on up/cancel/lostcapture. Movement/jump act on press, camera on press edge; menus activate on release with synthetic-click suppression, following the sibling's convention. Prevent default scrolling only on game controls; keyboard repeat cannot retrigger jumps/toggles. Inverse-map pointer coordinates through stage offset/scale. Test simultaneous move+jump+camera.

Use versioned localStorage only: unlocks, lives, checkpoint, collected IDs, recovery IDs, installed sockets, inventory, score, elapsed time and settings. Save at pickups, repairs, checkpoint, life loss and pause; load at checkpoint with full health/charge and reset hazard phases. Catch unavailable/corrupt storage; continue in memory with a small notice. Bundle all assets/fonts/scripts in initial load; no network during play, accounts, analytics or external CDN. Ship through the host's existing allow-listed deployment process.

Expose `?lab=1`, `?seed=N`, `?demo=1` and test-only `window.__mike` methods `step(n)`, `input(state)`, `snapshot()`, `reset(seed)`, plus frame/work percentiles. Deterministic headless-Chrome demo sets `body[data-done="1"]` only after winning. Automated assertions: jump heights/ranges, coyote/buffer, conveyor take-off, all three required camera crossings, depletion/cooldown, damage immunity, pit respawn, cancelled repair, missing-parts recovery, zero-life continue, no duplicate scoring, save/reload and completion with minimum inventory. Capture start, each gate, all boss phases and results at desktop/iPad/phone sizes. Require zero console errors, zero post-load requests, no stuck inputs after cancellation, and identical gameplay at 30/60fps. Manually verify Safari multitouch, audio unlock, rotate/resume and five-minute performance.

## 12. Scope beyond Level 1

Engine owns movement, collisions, time scaling, input, puppet states, hazard behaviours, collectibles, sockets, checkpoint/save rules, HUD and results. Level data owns placements, colours within approved palettes, timing parameters, recipes, socket order, declarative phase patterns, tutorial text and next-level links. Future levels using these behaviours require only data/art; a new mechanic requires an engine addition and validation.

Level 1 leaves future level content, moving-platform transport, slopes/loops, gamepad controls, remapping, portrait gameplay, localisation and a visual level editor unfinished. They are not implied deliverables. It must ship complete with title, pause, mute, instructions, saves, recovery, repair ending and results. Final pacing/performance and every machine silhouette still need owner/device playtesting.

## 13. Owner questions

These are review choices, not blockers to writing the implementation prompt; use recommendations unless changed.

- **Does camera slow motion feel right?** Recommend the single 20% mode above; test before adding any other power.
- **How forgiving should lives be?** Recommend checkpoint continues with no lost collection or repair progress.
- **Should missing parts ever force a replay?** Recommend the free service-bench supplies; exploration earns score instead.
- **Is landscape-only play acceptable?** Recommend yes for Level 1, preserving large controls and visible warnings.
- **Does the shop feel mischievous rather than frightening?** Recommend rounded abstract machinery, gentle audio and no faces on machines; approve silhouettes before final art.
- **Are the measured brand colours and available font files final?** Recommend supplied artwork/colours unchanged; supply licensed font files if absent, with the stated fallback meanwhile.
