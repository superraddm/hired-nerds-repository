// The Threading Fault's rules, one at a time. Mike is placed at the service points here (each check says so) with
// the fault's machines switched off, because these checks are about the rules of repair, not about dodging; the
// dodging is proved by tools/test-mike-l2-run.cjs, which places nobody anywhere.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, K, levelData, step, place } = require('./mike-l2-lib.cjs');
const data = levelData(), full = E.load(data);
const quiet = JSON.parse(JSON.stringify(data)); for (const s of quiet.sections){ s.wires = (s.wires || []).filter(w => !w.boss); s.nozzles = (s.nozzles || []).filter(w => !w.boss); s.intakes = (s.intakes || []).filter(w => !w.boss); }
const L = E.load(quiet), B = L.boss, result = {};
const fresh = (variant, sv) => { const S = E.create(L, sv, { variant }); S.suit = true; place(S, 470, 12); step(S, 3); return S; };
const enter = S => { place(S, 477.4, 14.3); step(S, 2); assert.ok(S.boss.on, 'the fault wakes as he steps in'); return S; };
const stand = (S, name) => { const p = B.points[name]; place(S, p[0], p[1]); if (p[1] > S.tanks.sump.level + .6){ S.P.ground = false; S.wet = true; } step(S, 2, S.wet || p[1] > S.tanks.sump.level ? { dive:true } : {}); return S; };
const hold = (S, n, more) => step(S, n, Object.assign({ fix:true }, S.wet ? { dive:true } : {}, more));
const repair = (S, name) => { stand(S, name); const s0 = S.boss.step; hold(S, Math.ceil(B.hold*60) + 3); assert.equal(S.boss.step, s0 + 1, name + ' counts'); return S; };

// The three orders: each begins at a different point, each point is used twice, and none is repaired twice running.
{ const firsts = new Set();
  for (const o of B.orders){ const seq = o.flat(); firsts.add(seq[0]); assert.equal(seq.length, 6); for (const p of Object.keys(B.points)) assert.equal(seq.filter(x => x === p).length, 2); for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]); }
  assert.equal(firsts.size, 3); result.orders = B.orders.map(o => o.flat().join(' ')); }

// Every pass begins with two quiet seconds, and the travelling wire begins at the far end from the way in.
{ const S = E.create(full); S.boss.on = true;
  for (const h of [...full.wires, ...full.nozzles, ...full.intakes].filter(h => h.boss)) for (let t = 0; t < 2; t += .05){ S.boss.t = t; assert.equal(E.live(S, h), false, h.id + ' is parked during startup'); }
  const w = full.wires.find(w => w.id === 'wB1'); assert.ok(E.wirePose(w, 0).x > 496, 'the wire starts at the far end'); result.quietStart = true; }

// The second wire runs in the second pass only; nothing of the fault's runs before he steps in or after it is fixed.
{ const S = E.create(full, null, { variant:0 }); S.suit = true; const w2 = full.wires.find(w => w.id === 'wB2'), w1 = full.wires.find(w => w.id === 'wB1');
  assert.equal(E.live(S, w1), false); S.boss.on = true; S.boss.t = full.boss.warmup; assert.equal(E.live(S, w1), true); assert.equal(E.live(S, w2), false); S.boss.pass = 1; assert.equal(E.live(S, w2), true);
  S.boss.trans = 1; assert.equal(E.live(S, w1), false, 'parked between passes'); S.boss.trans = 0; S.boss.done = true; assert.equal(E.live(S, w1), false); result.secondWireSecondPassOnly = true; }

// A repair: 2.2 seconds held still at the flashing point. The wrong point refuses and counts nothing.
{ const S = enter(fresh(0)); assert.equal(E.bossTarget(S).name, 'flush'); assert.equal(S.tanks.sump.level, 15);
  stand(S, 'tension'); let refused = 0; for (let i = 0; i < 200; i++){ E.step(S, { fix:true }); refused += S.events.filter(e => e.type === 'refuse').length; } assert.equal(S.boss.step, 0); assert.ok(refused >= 1, 'the wrong point buzzes');
  stand(S, 'flush'); hold(S, 100); assert.ok(S.boss.fix > .7 && S.boss.step === 0); hold(S, 3, { left:true }); assert.equal(S.boss.fix, 0, 'moving cancels the hold');
  stand(S, 'flush'); hold(S, 131); assert.equal(S.boss.step, 0); hold(S, 3); assert.equal(S.boss.step, 1, '2.2 seconds');
  assert.equal(S.tanks.sump.target, 23.6, 'the flush job drains the sump'); step(S, 360); assert.equal(S.tanks.sump.level, 23.6); assert.equal(S.inv.bearing, 0, 'repairs use his tools, not his salvage');
  result.repair = { holdSeconds:B.hold }; }

// The camera slows machines, never Mike (owner, 29 Sept; as in Level 1): a repair takes 2.2 seconds of his own time,
// filming or not, while the fault's own clock runs at a fifth.
{ const S = enter(fresh(0)); stand(S, 'flush'); S.cam.left = 12; S.cam.cap = 12; hold(S, 1, { camera:true }); const t0 = S.boss.t; hold(S, 130); assert.ok(S.cam.on); assert.equal(S.boss.step, 0);
  assert.ok(Math.abs(S.boss.fix - 131/60/B.hold) < .02, 'the hold runs at full speed while he films'); assert.ok(Math.abs(S.boss.t - t0 - 130*.2/60) < .01, 'and the machines at a fifth');
  hold(S, 4); assert.equal(S.boss.step, 1, 'repaired in 2.2 seconds of his own time'); result.filmingNeverSlowsMike = true; }

// Fix alone braces Mike against buoyancy, but only at the active submerged fitting.
{ const S = enter(fresh(0)); stand(S, 'flush'); S.P.y = 23.65; S.P.vy = 0; S.plunge = 2;
  step(S, 60, {fix:true}); assert.ok(S.boss.fix > .4); assert.ok(Math.abs(S.P.y - 23.65) < .02, 'Fix braces without Dive, including after a plunge');
  step(S, 30); assert.ok(S.P.y < 23.4, 'release lets him rise'); assert.equal(S.boss.fix, 0);
  stand(S, 'flush'); step(S, 140, {fix:true}); assert.equal(S.boss.step, 1, 'Fix alone completes the submerged job');
  const R = enter(fresh(0)); stand(R, 'flush'); step(R, 60, {fix:true}); E.hit(R, 1); step(R, 1, {fix:true}); assert.equal(R.boss.fix, 0, 'damage still cancels');
  const Q = enter(fresh(1)); stand(Q, 'flush'); Q.P.vy=0; const y=Q.P.y; step(Q, 30, {fix:true}); assert.ok(Q.P.y<y-.2, 'wrong station cannot brace');
  result.fixBracesActiveUnderwaterPoint = true; }

// A lost life restarts the pass he is in, never the passes he has finished; the sump refills for the restart.
{ const S = enter(fresh(0)); repair(S, 'flush'); repair(S, 'tension'); assert.equal(S.boss.step, 2);
  S.health = 1; E.hit(S, 1); assert.ok(S.dead > 0); step(S, 60); assert.equal(S.boss.step, 0, 'pass one starts again'); assert.equal(S.tanks.sump.level, 15); assert.equal(S.lives, 2); assert.equal(S.P.x, 470);
  enter(S); for (const p of ['flush', 'tension', 'align']) repair(S, p); assert.equal(S.boss.pass, 1); assert.ok(S.boss.trans > 0); step(S, 110); assert.equal(S.boss.trans, 0); assert.equal(S.tanks.sump.target, 15, 'pass two floods again');
  repair(S, 'tension'); assert.equal(S.boss.step, 4); S.health = 1; E.hit(S, 1); step(S, 60); assert.equal(S.boss.step, 3, 'pass two starts again; pass one stays done');
  // a save carries the finished pass
  const sv = JSON.parse(JSON.stringify(E.saveData(S))), R = fresh(0, sv); assert.equal(R.boss.pass, 1); assert.equal(R.boss.step, 3); assert.equal(R.checkpoint.x, 470);
  result.lostLifeRestartsThePass = true; }

// All six, in each of the three orders: the exit opens, the sump drains, the level is won, 1,000 points.
{ for (const v of [0, 1, 2]){ const S = enter(fresh(v)), score = S.score;
    for (const name of E.sequence(S)){ if (S.boss.trans > 0) step(S, 110); repair(S, name); }
    assert.ok(S.boss.done); assert.equal(S.score, score + 1000); assert.equal(E.doorWants(S, L.doors.find(d => d.id === 'exit')), false, 'cut must finish before exit opens'); assert.equal(S.tanks.sump.target, 23.6);
    const R = E.create(L, JSON.parse(JSON.stringify(E.saveData(S))));
    assert.equal(R.boss.step, 6); assert.ok(R.boss.on && R.boss.done);
    step(R, 600); assert.ok(R.won, 'final-repair save resumes to results');
    assert.equal(R.score, S.score, 'restored completion does not award the bonus twice');
    for (let i = 0; i < 600 && !S.won; i++){
      if (S.tanks.sump.level !== 23.6) assert.equal(S.won, false, 'cannot finish with fluid still draining');
      E.step(S, {});
    }
    assert.ok(S.won); assert.equal(S.tanks.sump.level, 23.6); assert.ok(S.doors.exit >= .99); }
  result.finalSaveResumes = true; result.restorationBeforeResults = true;
  result.allThreeOrdersWin = true; }

fs.writeFileSync(path.resolve(__dirname, '../docs/mike-platformer/l2-look/boss.json'), JSON.stringify(result, null, 2));
console.log('Level 2 boss rules passed', result);
