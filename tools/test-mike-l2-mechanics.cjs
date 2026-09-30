// Level 2 mechanics, measured on a bounded slice: two tanks joined by a duct, one transfer valve with three wheels,
// a flushing nozzle, a guarded intake, an earthing bell, a travelling wire and the suit door.
// The continuation brief asked for this slice to be proved before the rooms were built.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, K, step, place, go, swimTo, leapOut, press } = require('./mike-l2-lib.cjs');

const slice = require('./mike-l2-slice.cjs');

const L = E.load(slice); assert.equal(L.errors.length, 0, L.errors.join('; '));
const fresh = suit => { const S = E.create(L); S.suit = !!suit; step(S, 30); return S; };
const result = {};

// Dry movement is Level 1's own.
{ const S = fresh(), p = M.newPlayer(3, 12);
  for (let i = 0; i < 40; i++){ const inp = { right:true, jump:i < 25 }; M.stepPlayer(L, p, Object.assign({ jumpEdge:i === 0 }, inp), 1/60, [0, 96], S.extra, () => 0); }
  const T = E.create(L); for (let i = 0; i < 40; i++) E.step(T, { right:true, jump:i < 25 });
  assert.ok(Math.abs(T.P.x - p.x) < 1e-9 && Math.abs(T.P.y - p.y) < 1e-9); result.dryPhysicsUnchanged = true; }

// The suit door is a real door: shut without the suit, open with it.
{ const S = E.create(L); place(S, 13, 12); step(S, 80, { right:true }); assert.ok(S.P.x < 15, 'the airlock holds without the suit'); assert.equal(S.suit, false);
  place(S, 8, 12); step(S, 2); assert.ok(S.suit); step(S, 40); place(S, 13, 12); step(S, 80, { right:true }); assert.ok(S.P.x > 16, 'and opens with it'); result.suitDoor = true; }

// The transfer valve: one press moves both tanks, a held press does not oscillate, the water takes its time.
{ const S = fresh(true); place(S, 12, 12); step(S, 1);
  step(S, 1, { fix:true }); assert.equal(S.tanks.A.target, 21); assert.equal(S.tanks.B.target, 13);
  step(S, 60, { fix:true }); assert.equal(S.tanks.A.target, 21, 'a held valve does not flip back');
  assert.ok(Math.abs(S.tanks.A.level - (13 + .8)) < 1e-6, 'A falls at 0.8 tiles a second'); assert.ok(Math.abs(S.tanks.B.level - (21 - .8)) < 1e-6, 'while B rises');
  step(S, 600); assert.equal(S.tanks.A.level, 21); assert.equal(S.tanks.B.level, 13);
  for (const [x, y] of [[46, 10], [80, 12]]){ place(S, x, y); step(S, 2); const was = S.valves.xfer; press(S, 'fix'); assert.notEqual(S.valves.xfer, was, 'every wheel works'); }
  // filming slows the water with the machines
  const T = fresh(true); place(T, 12, 12); step(T, 1); step(T, 1, { fix:true }); step(T, 1); const a0 = T.tanks.A.level; step(T, 1, { camera:true }); step(T, 59);
  assert.ok(Math.abs(T.tanks.A.level - a0 - .8*.2) < .02, 'filming slows the water'); result.transferValve = true; }

// Floating: dropped into deep water he settles with his head out and stays there, breathing.
{ const S = fresh(true); place(S, 36, 6); S.P.ground = false; let deepest = 0;
  for (let i = 0; i < 400; i++){ E.step(S, {}); deepest = Math.max(deepest, S.P.y - 13); }
  assert.ok(deepest < 3, 'a six-tile fall sinks less than three tiles (sank ' + deepest.toFixed(2) + ')');
  const ys = []; let splashes = 0; for (let i = 0; i < 240; i++){ E.step(S, {}); ys.push(S.P.y); splashes += S.events.filter(e => e.type === 'splash').length; }
  assert.ok(Math.max(...ys) - Math.min(...ys) < 1e-6 && Math.abs(ys[0] - 14) < 1e-6, 'he floats still with his feet one tile under'); assert.equal(splashes, 0);
  assert.equal(S.headWet, false); assert.equal(S.static, 0, "with his helmet out he is earthed"); assert.equal(S.wet, true);
  // held Swim-up never pops him out; a press at the surface does
  step(S, 120, { jump:true }); assert.ok(Math.abs(S.P.y - 14) < .2 || S.P.y < 14, 'held jump: at most the first press leaps');
  result.float = { sinkAfterSixTileFall:+deepest.toFixed(2) }; }

// A held Dive swims down through a grating; without it the grating is a landing.
{ const S = fresh(true); place(S, 21, 13.2); S.P.ground = false; step(S, 200); assert.ok(S.P.y <= 14.001, 'he settles on or above the grating'); step(S, 90, { dive:true }); assert.ok(S.P.y > 16, 'and dives through it'); result.diveThroughGrating = true; }

// Diving and rising; look-down is not dive.
{ const S = fresh(true); place(S, 36, 14); S.P.ground = false; step(S, 60); const y0 = S.P.y;
  step(S, 90, { lookDown:true }); assert.ok(Math.abs(S.P.y - y0) < 1e-6 && S.lookDown, 'looking down does not dive');
  step(S, 120, { dive:true }); assert.ok(S.P.y > y0 + 5, 'dive descends'); assert.ok(S.headWet);
  const air = (E.W.limit - S.static); const y1 = S.P.y; step(S, 60, { dive:true }); assert.ok(Math.abs(air - (E.W.limit - S.static) - 1) < 1e-6, 'one second under the fluid is one second of static');
  const T = E.clone(S); step(T, 1, { camera:true, dive:true }); const a = (E.W.limit - T.static); step(T, 60, { dive:true, camera:true }); assert.ok(Math.abs(a - (E.W.limit - T.static) - 1) < 1e-6, 'static builds on real time while filming');
  step(S, 1, {}); step(S, 50, { jump:true }); const before = S.P.y; step(S, 60, { jump:true }); assert.ok(Math.abs(before - S.P.y - 3) < .05, 'swimming up climbs at three tiles a second');
  result.diveAndRise = true; }

// A press at the surface leaps onto a ledge one tile above the water.
{ const S = fresh(true); place(S, 38, 14); S.P.ground = false; step(S, 60); leapOut(S, 42.5, 12); assert.equal(S.health, 3); result.surfaceLeap = true; }

// An earthing bell under the table: with his helmet in its air the suit sheds its charge.
{ const S = fresh(true); place(S, 28, 22); S.P.ground = false; S.static = E.W.limit - (5); step(S, 5, { dive:true });
  swimTo(S, 28, 18.7, { tol:.35 }); step(S, 120); assert.equal(S.headWet, false, 'his helmet is in the bell'); assert.ok((E.W.limit - S.static) > E.W.limit - 4, 'and the suit sheds its charge'); assert.equal(S.wet, true);
  assert.ok(Math.abs(S.P.y - (17.7 + 1)) < .05, 'he floats at the pocket\'s own surface'); result.earthingBell = true; }

// A full charge discharges through him: one health, then the last dry refuge, earthed, never a loop.
{ const S = fresh(true); place(S, 80, 12); step(S, 3); assert.equal(S.refuge.x, 80); assert.equal(S.refuge.y, 12); place(S, 60, 23); S.P.ground = false; S.tanks.B.level = S.tanks.B.target = 13; S.static = E.W.limit - (.05);
  step(S, 6, { dive:true }); assert.equal(S.health, 2); assert.equal(S.P.x, 80); assert.equal(S.P.y, 12); assert.equal((E.W.limit - S.static), E.W.limit); step(S, 200); assert.equal(S.health, 2); result.dischargeRecovery = true; }

// The nozzle: a tell, a stream that hurts once, a rest.
{ assert.equal(E.nozzlePose(L.nozzles[0], .4).state, 'amber'); assert.equal(E.nozzlePose(L.nozzles[0], 1.5).state, 'red'); assert.equal(E.nozzlePose(L.nozzles[0], 3).state, 'green');
  const S = fresh(true); place(S, 32, 21); S.P.ground = false; S.mt = .1; step(S, 30, { dive:true }); assert.equal(S.health, 3, 'the tell never hurts');
  step(S, 40, { dive:true }); assert.equal(S.health, 2); step(S, 40, { dive:true, left:true }); assert.equal(S.health, 2, 'grace after a hit'); result.nozzle = true; }

// The intake pulls inside its zone during its pulse, and he can always swim away from it.
{ const S = fresh(true); E.setValve(S, L.valves[0], 1, true); place(S, 55, 22); S.P.ground = false; S.mt = .85;
  const x0 = S.P.x; step(S, 30, { dive:true }); assert.ok(S.P.x < x0 - .4, 'pulled toward the grille'); assert.equal(S.health, 3, 'the grille itself never hurts');
  step(S, 40, { dive:true, right:true }); assert.ok(E.intakePose(L.intakes[0], S.mt).active && S.P.vx > .5, 'he out-swims the pull while it is still pulling');
  const T = fresh(true); E.setValve(T, L.valves[0], 1, true); place(T, 70, 22); T.P.ground = false; T.mt = 1; const x2 = T.P.x; step(T, 50, { dive:true }); assert.ok(Math.abs(T.P.x - x2) < 1e-6, 'outside the zone nothing pulls');
  const U = fresh(true); E.setValve(U, L.valves[0], 1, true); place(U, 53, 22); U.P.ground = false; U.mt = 3; const x3 = U.P.x; step(U, 30, { dive:true }); assert.ok(Math.abs(U.P.x - x3) < 1e-6, 'between pulses nothing pulls');
  result.intake = true; }

// The wire: continuous travel, a bounded cutting phase, one hit with grace.
{ const w = L.wires[0]; assert.ok(Math.abs(E.wirePose(w, 0).x - E.wirePose(w, 12).x) < 1e-9);
  for (let t = 0; t < 24; t += .05) assert.ok(Math.abs(E.wirePose(w, t + .05).x - E.wirePose(w, t).x) < .12, 'the guide never jumps');
  assert.equal(E.wirePose(w, .5).state, 'amber'); assert.equal(E.wirePose(w, 2).state, 'red'); assert.equal(E.wirePose(w, 5).state, 'green');
  const S = fresh(true); E.setValve(S, L.valves[0], 1, true); S.mt = 1.99; const x = E.wirePose(w, 2).x; place(S, x, 16); S.P.ground = false; step(S, 2); assert.equal(S.health, 2); step(S, 12); assert.equal(S.health, 2);
  const T = fresh(true); E.setValve(T, L.valves[0], 1, true); T.mt = 4; place(T, E.wirePose(w, 4).x, 16); T.P.ground = false; step(T, 30); assert.equal(T.health, 3, 'a dark wire is safe to cross'); result.wire = true; }

// Draining under a floating Mike lowers him with the water: no splashing in and out.
{ const S = fresh(true); place(S, 36, 14); S.P.ground = false; step(S, 90); E.setValve(S, L.valves[0], 1); let splashes = 0, worst = 0;
  for (let i = 0; i < 700; i++){ E.step(S, {}); splashes += S.events.filter(e => e.type === 'splash' || e.type === 'surface').length; if (S.wet) worst = Math.max(worst, Math.abs(S.P.y - S.tanks.A.level - 1)); }
  assert.equal(splashes, 0); assert.ok(worst < .06, 'he rides the falling surface (worst gap ' + worst.toFixed(3) + ')'); assert.equal(S.tanks.A.level, 21); result.rideTheSurface = true; }

// Both valve states leave an escape from both tanks and a wheel within reach, using ordinary inputs only.
{ for (const state of [0, 1]) for (const tank of ['A', 'B']){
    const S = fresh(true); E.setValve(S, L.valves[0], state, true); const high = S.tanks[tank].name === 'high', A = tank === 'A';
    place(S, A ? 36 : 70, 24); S.mt = 3.2; step(S, 2);
    if (high){ swimTo(S, A ? 39 : 72, 14, { tol:.5, frames:1500 }); leapOut(S, A ? 42.5 : 77.5, 12); }
    else {
      const stairs = A ? [[38.5, 21.5], [42, 19], [39, 16.5], [42.5, 14.2], [42.5, 12]] : [[74.5, 21.5], [71, 19], [74.5, 16.5], [71, 14], [77.5, 12]];
      swimTo(S, stairs[0][0] + (A ? -2.5 : -3), 22, { tol:.5, tolY:.6, frames:1500 }); leapOut(S, stairs[0][0], stairs[0][1]);
      for (const [sx, sy] of stairs.slice(1)) go(S, sx, sy, { anywhere:true });
    }
    if (A) go(S, 46, 10, { anywhere:true }); else go(S, 80, 12);
    const was = S.valves.xfer; press(S, 'fix'); assert.notEqual(S.valves.xfer, was); assert.equal(S.health, 3);
  }
  result.escapeInEveryState = true; }

// The whole slice, dry start to exit deck, swimming tank A, through the duct, out of tank B.
{ const S = E.create(L); go(S, 8, 12); go(S, 12, 12); assert.ok(S.suit);
  step(S, 40); swimTo(S, 21, 14, { tol:.5, tolY:.4 }); swimTo(S, 21, 22.3, { tol:.5 });     // through the airlock, off the rim, down through the gratings
  swimTo(S, 28, 22.3, { tol:.5, wait:s => (s.P.x > 28.5 && s.P.x < 31.2 && E.nozzlePose(L.nozzles[0], s.mt + .6).state !== 'green') ? { x:29.5, y:22 } : null });
  assert.ok(S.got.has('s1'));
  swimTo(S, 30, 22.5, { tol:.4 });
  swimTo(S, 35, 22.5, { tol:.4, wait:s => { const p = E.nozzlePose(L.nozzles[0], s.mt), q = E.nozzlePose(L.nozzles[0], s.mt + .9); return s.P.x < 31.3 && (p.state !== 'green' || q.state !== 'green') ? { x:30.3, y:22.5 } : null; } });
  swimTo(S, 43, 22.5, { tol:.4 }); swimTo(S, 50, 22.5, { tol:.4 });
  assert.equal(S.health, 3, 'the nozzle can be timed'); const air = (E.W.limit - S.static);
  swimTo(S, 60, 22.3, { tol:.5, wait:s => { const x = E.wirePose(L.wires[0], s.mt).x, p = E.wirePose(L.wires[0], s.mt + 1.2); return s.P.x < 57 && s.P.x > 55 && p.state !== 'green' ? { x:56, y:21.2 } : null; } });
  result.slice = { marginAtDeepest:+(E.W.limit - S.static).toFixed(1), health:S.health, salvage:S.got.size };
  swimTo(S, 70, 21.6, { tol:.6, tolY:.7 }); leapOut(S, 74.5, 21.5);
  for (const [sx, sy] of [[71, 19], [74.5, 16.5], [71, 14], [77.5, 12]]) go(S, sx, sy, { anywhere:true });
  go(S, 80, 12); assert.equal(S.health, 3); assert.ok((E.W.limit - S.static) > E.W.limit - .1); result.slice.seconds = +S.time.toFixed(1); }

const out = path.resolve(__dirname, '../docs/mike-platformer/l2-look'); fs.mkdirSync(out, { recursive:true });
fs.writeFileSync(path.join(out, 'mechanics.json'), JSON.stringify(result, null, 2));
console.log('Level 2 mechanics passed', result);
