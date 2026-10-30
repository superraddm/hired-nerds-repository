// Level 3, Cobot Mania: authored by hand in world coordinates and written out as level-3.json. Run:
//   node tools/build-mike-level3.cjs
// Revision 2 (owner, 1 Oct): three times the length to the boss; each section opens only some of the five layers and
// walls the rest off as robot cells (a better puzzle, and less to draw); the good cobots grab whoever touches their
// gripper and set him down at the next of their destinations, any layer, forward or back. Nothing here is made by a
// repeating pattern. Checked with the real physics by tools/test-mike-l3-mechanics.cjs and tools/test-mike-l3-routes.cjs.
// Revision 4 (owner, 2 Oct: twice as hard, more obstacles, less safety): every machine faster with shorter tells, more
// hazards in every section, wider and faster carrier sway, two checkpoints and a lubricant fewer, one rack fewer.
//
// Layers stand at: gantry -12, high line -4, mezzanine 4, shop floor 12, undercroft 20. A layer is 8 tiles up: too high
// to jump (3), and every drop between open layers lands inside the view once he looks down. Where a cobot lifts him
// through a deck in a hub, that deck is a grating (a hatch it passes through).
const fs = require('fs'), path = require('path');
const out = path.resolve(__dirname, '../public/fireworks/mike-game/level-3.json');
const D = .6, G = .4;
const Y = { g:-12, h:-4, m:4, f:12, u:20 }, ORDER = ['g', 'h', 'm', 'f', 'u'];
const solids = [], platforms = [], carriers = [], hooks = [], arms = [], rovers = [], drops = [], belts = [], pickups = [], checkpoints = [], scenery = [], rooms = [], lanes = [];
const deck = (x0, x1, l, style) => solids.push([x0, Y[l], x1 - x0, D, style || 'deck']);
const grate = (x0, x1, l) => platforms.push([x0, Y[l], x1 - x0, G]);
const slab = (x0, x1) => solids.push([x0, 12, x1 - x0, 1, 'slab']);             // the shop floor over an open undercroft
const ground = (x0, x1) => solids.push([x0, 12, x1 - x0, 12, 'floor']);           // the shop floor over a closed one
const under = (x0, x1) => solids.push([x0, 20, x1 - x0, 4, 'floor']);
const sal = (id, type, x, y, more) => pickups.push(Object.assign({ id, type, at:[x, y] }, more));
const car = (id, base, mount, home, dests, more) => carriers.push(Object.assign({ id, base, mount, home, drops:dests }, more));
const arm = (id, base, mount, r, a0, a1, cycle, tell, active, tool, more) => arms.push(Object.assign({ id, base, mount, r, a0, a1, cycle, tell, active, tool }, more));
// A section: its rooms entry, and the cells that wall off its closed layers. A closed layer is filled from just under
// the deck above to its own deck, so closed layers never leave a pit, and drops only happen between open layers.
let laneZone = -1;
function section(id, title, x0, x1, open, laneNames){
  rooms.push({ id, title, x:x0, width:x1 - x0, open });
  let run = null;
  const flush = () => { if (run){ solids.push([x0, run.top, x1 - x0, run.bot - run.top, 'cell']); run = null; } };
  for (const l of ORDER){
    if (open.includes(l)){ flush(); continue; }
    if (l === 'u' && open.includes('f')) continue;                               // the floor's own ground fills it
    const top = l === 'g' ? -18 : Y[l] - 7.4, bot = l === 'u' ? 24 : Y[l] + D;
    if (run) run.bot = bot; else run = { top, bot };
  }
  flush();
  if (laneNames){ laneZone++; for (const [l, name] of Object.entries(laneNames)) lanes.push({ id:id + '-' + l, title:name, zone:laneZone, layer:ORDER.indexOf(l), rect:[x0, Y[l] - 2.5, x1 - x0, 2.5] }); }
}

// ------------------------------------------------------------------------------------------------ 01 Induction bay
section('induction', 'Induction bay', 0, 44, ['m', 'f']);
ground(0, 44);
deck(14, 26, 'm'); deck(32, 48, 'm'); grate(48, 56, 'm');                       // the mezzanine runs on into the Switchyard, a hatch grating there
hooks.push({ id:'h1', rail:[25.5, 32.5], y:0, len:1.75, period:5.2, dwell:.7 });
// The first cobot: its gripper hovers over the walkway. Walk on and it takes him up to the mezzanine; jump it and he
// stays on the floor. Either way leads on. It is the whole lesson of the level, taught by doing it.
car('c1', [13.6, 7.6], 'column', [10.5, 12], [[17, 4]], { sway:.6, period:2.4 });
rovers.push({ id:'r1', span:[17.5, 26.5], y:12, speed:4, pause:.5 });
belts.push({ id:'b1', at:[29, 35], y:12, dir:1, speed:3 });
solids.push([39.5, 10.4, 1, 1.6, 'pedestal']);
arm('a1', [40, 10.4], 'floor', 2.6, -90, -180, 2.6, .5, 1.1, 'welder');
arm('a1b', [20.5, 2.6], 'rail', 2.8, -90, 10, 2.8, .5, 1.1, 'welder', { phase:1 });          // the mezzanine has a welder too now
drops.push({ id:'dI1', x:32, top:5, cycle:2.4, tell:.6 });                                   // and a feeder over the belt
checkpoints.push([3, 12]);
scenery.push({ type:'sign', kind:'move', at:[4.3, 12] }, { type:'sign', kind:'hook', at:[22.5, 4] });
sal('i1', 'bearing', 6.5, 10.4); sal('i2', 'seal', 21.5, 10); sal('i3', 'coupling', 33, 10.4); sal('i4', 'bearing', 43, 11);
sal('i5', 'seal', 19, 3); sal('i6', 'controlUnit', 24, 1.6); sal('i7', 'coupling', 29, 3.3);

// ------------------------------------------------------------------------------------------------ 02 The Switchyard
section('switchyard', 'The Switchyard', 44, 60, ['h', 'm', 'f', 'u']);
under(44, 60); slab(44, 48.5); slab(52.5, 60);                                  // the opening between drops into the undercroft
grate(52, 60, 'h'); deck(60, 68, 'h');                                       // the hub's high line is a hatch grating
// Three cobots, each with two places to send him: the undercroft one back up to the floor (forward, or back into the
// induction bay); the floor one up to the high line or the mezzanine; the mezzanine one up, or down through the hook gap.
car('cU', [47, 16.4], 'column', [50.5, 20], [[55, 12], [42, 12]], { sway:.6, period:2.4, top:5.5 });
car('cF', [56.4, 8], 'column', [57, 12], [[63, -4], [46, 4]], { sway:.65, period:2.3, phase:1.1 });
car('cM', [48.4, 0], 'column', [50, 4], [[64, -4], [28.6, 12]], { sway:.65, period:2.3, phase:2, top:4.5 });
rovers.push({ id:'rU2', span:[53.5, 59], y:20, speed:3, pause:.4 });
sal('sd1', 'sdCard', 44.6, 11); sal('s2-1', 'seal', 46, 19); sal('s2-2', 'bearing', 53.5, 3); sal('s2-3', 'coupling', 60.5, -5);

// ------------------------------------------------------------------------------------------------ 03 Assembly line
section('assembly', 'Assembly line', 60, 112, ['h', 'm', 'f'], { h:'Hook relay', m:'Cell row', f:'The line' });
ground(60, 112);
deck(60, 105.5, 'm'); deck(109.8, 112, 'm');                                        // a gap at the end drops the cell row to the floor
deck(86.5, 93, 'h'); deck(105, 112, 'h');
hooks.push({ id:'hH1', rail:[67, 77], y:-8.2, len:1.95, period:4.2, dwell:.5 }, { id:'hH2', rail:[76, 86], y:-8.2, len:1.95, period:4.2, dwell:.5, phase:2.1 },
  { id:'hH3', rail:[93, 104], y:-8.2, len:1.95, period:4.6, dwell:.5, phase:1 });
drops.push({ id:'d1', x:90, top:-7.8, cycle:2, tell:.6 }, { id:'dA2', x:64.6, top:5, cycle:2.3, tell:.6 }, { id:'dA3', x:80, top:-11.2, cycle:2.6, tell:.7 });   // dA3 falls through the hook relay onto the cell row
arm('a2', [72, 2.6], 'rail', 2.8, -90, 10, 2.9, .5, 1.3, 'welder');
arm('a3', [84, 2.6], 'rail', 2.8, -90, -190, 2.9, .5, 1.3, 'spindle', { phase:1 });
arm('a5', [90, 2.6], 'rail', 2.8, -90, 10, 2.9, .5, 1.3, 'jaws', { phase:1.9 });
arm('a4', [96, 2.6], 'rail', 2.8, -90, 10, 2.9, .5, 1.3, 'welder', { phase:2.4 });
belts.push({ id:'b2', at:[64, 71], y:12, dir:1, speed:3.5 });
rovers.push({ id:'r2', span:[73, 84], y:12, speed:4.2, pause:.4 }, { id:'rT', span:[91.4, 99.4], y:12, speed:2.8, pause:.8, tall:true });
// the only way past the tall rover is this cobot, and it sends him on past it, or all the way back to the belt
car('cF3', [99, 5.2], 'ceiling', [88, 12], [[107, 12], [66.5, 12]], { top:5.6, sway:.3 });
// on the cell row, a cobot after the welders: up to the far high line, or down through the gap to the floor
car('cM3', [103.5, 0], 'column', [101, 4], [[108, -4], [107.8, 12]], { sway:.65, period:2.3, phase:.7, top:3.5 });
sal('a-h1', 'coupling', 72, -5); sal('a-h2', 'bearing', 81, -5); sal('a-h3', 'seal', 89.5, -5); sal('a-h4', 'coupling', 99, -5); sal('a-h5', 'controlUnit', 110, -5);
sal('a-m1', 'seal', 66, 3); sal('a-m2', 'bearing', 78, 3); sal('a-m3', 'coupling', 90, 3);
sal('a-f1', 'coupling', 69.5, 10.4); sal('a-f2', 'seal', 79, 10.4); sal('a-f3', 'bearing', 98, 6.6); sal('a-f4', 'seal', 110, 11);

// ------------------------------------------------------------------------------------------------ 04 Transfer tower
// The only way up to the roof. Every layer is open; the mezzanine and high line here are gratings the cobots rise through.
section('tower', 'Transfer tower', 112, 128, ['g', 'h', 'm', 'f', 'u']);
under(112, 128); slab(112, 123.5);
grate(112, 127.5, 'm'); grate(112, 119, 'h');
car('cT1', [113.2, -8], 'column', [115, -4], [[122, -12], [126, -12]], { sway:.6, period:2.4 });
car('cT2', [117.8, 8], 'column', [116, 12], [[124.5, -12], [120, 4], [126.2, 20]], { sway:.6, period:2.4, phase:1.3, top:3.5 });
checkpoints.push([121, 12]);
sal('t-1', 'bearing', 114, 19); sal('t-2', 'seal', 125, -13.5);

// ------------------------------------------------------------------------------------------------ 05 Roof and return
// Only the roof and the undercroft are open: two very different ways across, with a wall of robot cells between them.
section('roof', 'Roof and return', 128, 176, ['g', 'u'], { g:'Roof walk', u:'Return belts' });
deck(120, 181, 'g'); under(112, 176);
arm('aG1', [136, -16.6], 'ceiling', 3.2, 170, 90, 2.7, .5, 1.1, 'jaws');
arm('aG2', [150, -16.6], 'ceiling', 3.2, 10, 90, 2.7, .5, 1.1, 'jaws', { phase:1.4 });
arm('aG3', [163, -16.6], 'ceiling', 3.2, 10, 90, 2.5, .5, 1, 'welder', { phase:.8 });
drops.push({ id:'dG1', x:144, top:-16.4, cycle:2.2, tell:.6 }, { id:'dG2', x:139.5, top:-16.4, cycle:2.4, tell:.6, phase:1 });
rovers.push({ id:'rG', span:[155.5, 165], y:-12, speed:4.5, pause:.3 });
car('cG5', [171.6, -16], 'ceiling', [170, -12], [[179.5, -12], [185.2, -4]], { sway:.7, period:2.3 });  // jump it, or it takes him on to the Loop, on the roof or below it
platforms.push([160, -14.8, 1.6, G]);
belts.push({ id:'b3', at:[130, 140], y:20, dir:-1, speed:4.5 }, { id:'b4', at:[142, 152], y:20, dir:1, speed:6.5 }, { id:'b5', at:[156, 166], y:20, dir:1, speed:5, reverse:3.2 });
drops.push({ id:'d2', x:147, top:13.2, cycle:2.4, tell:.6 }, { id:'d3', x:161, top:13.2, cycle:2.2, tell:.6, phase:1.2 }, { id:'d4', x:154.5, top:13.2, cycle:2.6, tell:.6, phase:.5 });
rovers.push({ id:'r4', span:[168, 173.4], y:20, speed:3.2, pause:.3 });
car('cU5', [135.6, 16.4], 'column', [137, 20], [[144, 20], [125.6, 20]], { sway:.6, period:2.4, phase:.5 });
scenery.push({ type:'roof', x0:112, x1:192, y:-17 });
sal('r-g1', 'bearing', 133, -13.4); sal('r-g2', 'seal', 141, -13); sal('r-g3', 'coupling', 152, -13); sal('r-g4', 'controlUnit', 161, -12.6); sal('r-g5', 'seal', 174, -13);
sal('mini', 'miniMike', 160.8, -15.6, { hidden:true });
sal('r-u1', 'coupling', 134, 19); sal('r-u2', 'bearing', 146, 18); sal('r-u3', 'seal', 159, 19); sal('r-u4', 'coupling', 170.5, 18.4); sal('sd2', 'sdCard', 164, 18.8);

// ------------------------------------------------------------------------------------------------ 06 The Loop
section('loop', 'The Loop', 176, 192, ['g', 'h', 'm', 'f', 'u']);
grate(176, 189, 'h'); grate(176, 192, 'm');
under(176, 192); slab(176, 180); slab(183, 192);
car('cL1', [178.4, 16.4], 'column', [181.5, 20], [[186, 12], [189, 4]], { sway:.6, period:2.4, top:5.5 });
car('cL2', [191.2, 8], 'column', [190, 12], [[184, -4], [194.4, 12]], { sway:.6, period:2.4, phase:1.5 });
checkpoints.push([177.5, 12]);
sal('o-2', 'seal', 185, 3);

// ------------------------------------------------------------------------------------------------ 07 Weld row
section('weld', 'Weld row', 192, 256, ['m', 'f'], { m:'Spot-weld alley', f:'Rover yard' });
deck(192, 229, 'm'); deck(232, 256, 'm'); ground(192, 256);
// arms in opposed pairs: each pair strikes into the same span, one from each side, in turn
arm('aW1', [200, 2.6], 'rail', 2.8, -90, 10, 2.8, .5, 1.1, 'welder');
arm('aW2', [205, 2.6], 'rail', 2.8, -90, -190, 2.8, .5, 1.1, 'welder', { phase:1.4 });
arm('aW3', [214, 2.6], 'rail', 2.8, -90, 10, 2.6, .45, 1.1, 'spindle', { phase:.6 });
arm('aW4', [219, 2.6], 'rail', 2.8, -90, -190, 2.6, .45, 1.1, 'spindle', { phase:1.9 });
arm('aW5', [244, 2.6], 'rail', 2.8, -90, 10, 2.5, .45, 1.1, 'welder', { phase:.3 });
arm('aW6', [249, 2.6], 'rail', 2.8, -90, -190, 2.5, .45, 1.1, 'welder', { phase:1.55 });
car('cW2', [222.6, 0], 'column', [224.5, 4], [[238, 4], [230.4, 12]], { sway:.7, period:2.3, top:3.5 });   // on along the alley, or down through the gap
// the rover yard: low rovers he can jump or wait out on a rack; a tall one only a cobot gets him past
rovers.push({ id:'rY1', span:[196, 211], y:12, speed:5, pause:.3 }, { id:'rY2', span:[215, 227.5], y:12, speed:3.8, pause:.4, phase:2 },
  { id:'rY3', span:[236, 250], y:12, speed:3.8, pause:.6, tall:true });
drops.push({ id:'dW1', x:207, top:4.9, cycle:2.2, tell:.55 });
platforms.push([202.8, 9.4, 2.6, G]);                                        // one rack to hide on now, not two
car('cW1', [240, 5.2], 'ceiling', [232.8, 12], [[253, 12], [213, 12]], { top:5.6, sway:.3 });
sal('w-m1', 'seal', 202.5, 3); sal('w-m2', 'bearing', 216.5, 3); sal('w-m3', 'coupling', 230.5, 2.8); sal('w-m4', 'controlUnit', 246.5, 3); sal('l-w', 'lubricant', 236, 3);
sal('w-f1', 'coupling', 204, 8.4); sal('w-f2', 'seal', 222.3, 9.6); sal('w-f3', 'bearing', 243, 6.6); sal('w-f4', 'coupling', 254, 11);

// ------------------------------------------------------------------------------------------------ 08 The Crossing
section('crossing', 'The Crossing', 256, 272, ['h', 'm', 'f', 'u']);
under(256, 272); slab(256, 260.5); slab(266.5, 272);
grate(256, 267, 'm'); grate(258, 272, 'h');
car('cD1', [257.2, 8], 'column', [258.5, 12], [[268, -4], [261.4, 20]], { sway:.6, period:2.4, tops:[3, 5.5] });
car('cD2', [263.2, 16.4], 'column', [264.6, 20], [[270, 12], [270.5, -4]], { sway:.6, period:2.4, phase:1, tops:[5.5, 3] });
sal('d-2', 'seal', 269, 19);

// ------------------------------------------------------------------------------------------------ 09 Pack-out
section('packout', 'Pack-out', 272, 336, ['h', 'f', 'u'], { h:'Sorting line', f:'Wrap station', u:'Sorter' });
deck(272, 346, 'h'); deck(348, 351.5, 'h');                                     // runs on into Marshalling, with the drop-down hole at 346-348
under(272, 336); slab(272, 320); slab(323, 333);                                // two openings down to the sorter
// the sorting line: a moving walkway, arms on drop-rods from the cell roof, crate feeders, a rover
belts.push({ id:'bP1', at:[276, 286], y:-4, dir:1, speed:4 });
arm('aP1', [292, -8.4], 'ceiling', 3.2, 160, 90, 2.6, .45, 1.1, 'jaws');
arm('aP2', [301, -8.4], 'ceiling', 3.2, 20, 90, 2.6, .45, 1.1, 'jaws', { phase:1.3 });
drops.push({ id:'dP1', x:296.5, top:-7.6, cycle:1.9, tell:.55 }, { id:'dP2', x:312, top:-7.6, cycle:2.1, tell:.55, phase:1 });
rovers.push({ id:'rP1', span:[316, 330], y:-4, speed:4.6, pause:.3 });
car('cP1', [315.6, -8], 'column', [313.6, -4], [[333, -4]], { sway:.3 });       // over the rover, if he lets it
// the wrap station: tall rovers, a belt against him, and the cobots that are the only way past them
rovers.push({ id:'rW1', span:[280, 290], y:12, speed:3, pause:.6, tall:true }, { id:'rW2', span:[300.8, 312], y:12, speed:3.2, pause:.6, tall:true, phase:1.5 });
belts.push({ id:'b6', at:[293.5, 297.5], y:12, dir:-1, speed:5 });
car('cW3', [284, 5.2], 'ceiling', [276.5, 12], [[292.5, 12], [273, 12]], { top:5.6, sway:.4 });
car('cW4', [306, 5.2], 'ceiling', [297.7, 12], [[316, 12], [292.4, 12]], { top:5.8, sway:.3, phase:1 });
// the sorter: reversing belts, crates, a rover, and the way back up at the end
belts.push({ id:'bS1', at:[276, 288], y:20, dir:1, speed:5, reverse:3 }, { id:'bS2', at:[292, 304], y:20, dir:-1, speed:6 }, { id:'bS3', at:[308, 318], y:20, dir:1, speed:5, reverse:2.6 });
drops.push({ id:'dS1', x:290, top:13.2, cycle:2, tell:.6 }, { id:'dS2', x:285, top:13.2, cycle:2.2, tell:.6, phase:1 });
rovers.push({ id:'rS1', span:[324.5, 331.5], y:20, speed:3.4, pause:.3 });
car('cS1', [311.6, 16.4], 'column', [313, 20], [[321.6, 20], [293.2, 20]], { sway:.6, period:2.4, phase:.4 });
car('cS2', [335.6, 16.4], 'column', [334.5, 20], [[339, 12]], { sway:.3 });
sal('p-h1', 'coupling', 281, -5); sal('p-h2', 'seal', 296.5, -5.6); sal('p-h3', 'bearing', 305, -5.4); sal('p-h4', 'controlUnit', 323, -5);
sal('p-f1', 'seal', 285, 6.6); sal('p-f2', 'bearing', 296, 10.6); sal('p-f3', 'coupling', 307, 6.6); sal('p-f4', 'seal', 328, 11);
sal('p-u1', 'bearing', 282, 19); sal('p-u2', 'coupling', 298, 18.4); sal('p-u3', 'seal', 313.5, 17.6); sal('p-u4', 'bearing', 328, 18.4); sal('l-p', 'lubricant', 322, 19);

// ------------------------------------------------------------------------------------------------ 10 Marshalling
// The switchback down to the Teach Cell's door, against its wall, so holding Right never overshoots: the high line runs
// to the wall with a hole at 346-348; under it the mezzanine's right part; back left off its end to the floor.
section('marshalling', 'Marshalling', 336, 352, ['h', 'm', 'f']);
deck(336, 343, 'm'); deck(345, 351.5, 'm'); ground(336, 352);
checkpoints.push([349, 12]);
sal('x-1', 'coupling', 340, 11);

// ------------------------------------------------------------------------------------------------ 11 The Teach Cell
const X = 352;                                                                   // the cell's left edge
rooms.push({ id:'teach', title:'The Teach Cell', x:X, width:25, open:['f'] });
ground(X, X + 25);
solids.push([X - .5, -18, 1, 26, 'wall'], [X + 23.5, -18, 1, 26, 'wall']);
solids.push([X + 4, 8, 4, D, 'deck'], [X + 16, 8, 4, D, 'deck'], [X + .5, 4.4, 2.6, D, 'deck'], [X + 20.9, 4.4, 2.6, D, 'deck']);
platforms.push([X + 9.5, 9.4, 5, G]);
car('cBL', [X + 5.2, .4], 'ceiling', [X + 4.6, 8], [[X + 1.6, 4.4]], { top:2.2, sway:.25 });
car('cBR', [X + 18.8, .4], 'ceiling', [X + 19.4, 8], [[X + 22.4, 4.4]], { top:2.2, sway:.25 });
checkpoints.push([X + 2.6, 12]);
// The boss's danger is the arm's own crates, falling where its route is broken (faster each round; two colours in the
// last). The old cell's wall arms and floor rover are gone: they swept the dials' own spots faster than a re-teach.                                                 // inside the door: a lost life restarts the round in here, not locked out
// The Big Arm's route (revision 3, owner 2 Oct: the puzzle and the hazards must be the same thing). Seven waypoint
// dials on the tiers, each pointing to its next waypoint; the arm takes a crate from the chute and follows them, and
// drops the crate wherever the route breaks. Holding Fix at a dial (2.2 s) turns it to its next exit.
//   stand: where Mike stands to reach the dial (the dial is on the wall 1.15 above); exits: in the order the dial turns.
const node = (x, y, exits) => ({ stand:[X + x, y], exits });
// Revision 4 (owner, 2 Oct: harder): two chutes and two Big Arms from round 2, each with its own route through the
// same dials; after every trip an arm sweeps its empty gripper across the cell at one level (floor, decks, ledges).
const boss = {
  trigger:X + 1.5, bounds:[X, -.6, 24, 13.5], track:.3,
  hold:2.2, speed:6, load:.6, tell:.6, place:.5, fly:10, travelY:1.1, aim:.65, sweepSpeed:8, sweeps:[11.05, 7.45, 3.45], offset:2.6,
  warmup:1, rates:[1.15, 1.35, 1.55],
  chutes:{ L:{ at:[X + 3.6, 1.35], first:'A' }, R:{ at:[X + 20.4, 1.35], first:'E' } },
  nodes:{ A:node(1.8, 4.4, ['B', 'E', 'L']), E:node(22.2, 4.4, ['D', 'A', 'G', 'R']), B:node(6.6, 8, ['C', 'F', 'A']), D:node(17.4, 8, ['E', 'H', 'C']),
    C:node(12, 9.4, ['D', 'G', 'B']), F:node(5, 12, ['G', 'P2', 'B']), G:node(12, 12, ['H', 'C', 'F', 'E']), H:node(19, 12, ['P1', 'G', 'D']) },
  pallets:{ P1:{ at:[X + 22.4, 12], rail:[X + 22.4, 10.9], colour:'orange' }, P2:{ at:[X + 1.5, 12], rail:[X + 1.5, 10.9], colour:'blue', rounds:[2] } },
  rounds:[
    { dials:{ A:0, B:1, C:0, D:1, E:1, F:2, G:2, H:0 }, sources:[{ chute:'L', colour:'orange' }] },
    { dials:{ A:2, E:0, B:2, D:2, C:0, F:1, G:1, H:2 }, sources:[{ chute:'L', colour:'orange' }, { chute:'R', colour:'orange' }] },
    { dials:{ A:0, E:0, B:0, D:0, C:1, F:1, G:1, H:2 }, sources:[{ chute:'L', colour:'orange' }, { chute:'R', colour:'blue' }] }
  ]
};

const salvageTypes = ['bearing', 'seal', 'coupling', 'controlUnit'];
const level = {
  id:'level-3', title:'Cobot Mania', size:[X + 25, 24], top:-18, spawn:[3, 12], checkpoints,
  collection:{ types:salvageTypes, total:pickups.filter(p => salvageTypes.includes(p.type)).length },
  rooms, lanes, solids, platforms, carriers, hooks, arms, rovers, drops, belts, pickups, scenery,
  doors:[{ id:'arena', at:[X - .45, 8], h:4, w:.9, opens:'arena' }, { id:'exit', at:[X + 23.55, 8], h:4, w:.9, opens:'boss' }],
  boss
};
fs.writeFileSync(out, JSON.stringify(level));
console.log(`level-3.json: ${level.size[0]} tiles (boss door at ${X}), ${rooms.length} rooms, ${solids.length} solids, ${carriers.length} carriers, ${hooks.length} hooks, ${arms.length} arms, ${rovers.length} rovers, ${drops.length} crate drops, ${level.collection.total} salvage, ${lanes.length} lanes`);
