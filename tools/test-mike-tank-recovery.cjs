// Reproduce the Guide Tower lockout using the real static, death and saved-game paths.
const assert = require('node:assert/strict');
const { M, E, levelData, step, place } = require('./mike-l2-lib.cjs');
const L = E.load(levelData()), valve = L.valves.find(v => v.id === 'lift');
const door = L.doors.find(d => d.id === 'lock');
function trapped(health = 3){
  const S = E.create(L); S.suit = true;
  place(S, 130, 12); step(S, 2);
  E.setValve(S, valve, 1, true);
  place(S, 145, 10); step(S, 30, { dive:true });
  assert.ok(E.doorSolid(S, door));
  S.health = health; S.static = E.W.limit - 1/120;
  return S;
}
function reenter(S){
  step(S, 30);
  assert.equal(S.valves.lift, 0);
  assert.equal(S.tanks.shaft.level, 13);
  assert.ok(!E.doorSolid(S, door), 'tank entrance reopens');
  for (let i = 0; i < 220 && S.P.x < 147; i++) E.step(S, { right:true });
  assert.ok(S.P.x > 146, 'Mike can walk back through the entrance');
  step(S, 50);
  step(S, 1, { fix:true });
  assert.equal(S.valves.lift, 1, 'the internal wheel raises the tank again');
}
const discharged = trapped();
step(discharged, 1, { dive:true });
assert.equal(discharged.health, 2); assert.equal(discharged.lives, 3);
assert.equal(discharged.P.x, 130); reenter(discharged);
const died = trapped(1);
step(died, 1, { dive:true }); assert.equal(died.lives, 2);
step(died, 45); assert.equal(died.health, 3); reenter(died);
const resumed = E.create(L, E.saveData(trapped())); reenter(resumed);
// A refuge inside a controlled reservoir must retain its water state.
const inside = E.create(L); inside.suit = true;
const transfer = L.valves.find(v => v.id === 'transfer');
E.setValve(inside, transfer, 1, true);
inside.refuge = { x:263, y:20 }; place(inside, 250, 23.9);
inside.static = E.W.limit - 1/120; step(inside, 1, { dive:true });
assert.ok(inside.events.some(e => e.type === 'discharge')); assert.equal(inside.valves.transfer, 1);
// The new card is collected normally on the first tank's exit deck.
const card = E.create(L); card.suit = true; place(card, 39, 12);
step(card, 25, { right:true });
assert.ok(card.got.has('sd1-1')); assert.equal(card.cam.cap, M.CAMERA.base + M.CAMERA.perCard);
console.log('Tank recovery passed: discharge, death, saved game, re-entry, valve reuse, internal refuge and new SD pickup.');
