// Level 2, played from the first step to the repaired fault with every machine running, using only the inputs a
// player has. No teleports, no protection. The player plans on copies of the game (tools/mike-l2-lib.cjs) and the
// inputs it settles on are recorded frame by frame; the recording is written to public/.../demo-2.json, and the
// browser suite replays it through the page's own loop (level-2.html?demo=1).
//   node tools/test-mike-l2-run.cjs            the whole level
//   node tools/test-mike-l2-run.cjs 3          stop after room 3 (no recording written)
// It is a proof that the level can be finished and that every machine can be read and timed. It is not a claim about
// how hard a person will find it.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, K, lib, levelData, travel, step, base } = require('./mike-l2-lib.cjs');
const data = levelData(), NO_CARDS = !!process.env.NO_CARDS;
if (NO_CARDS) for (const room of data.sections) room.pickups = (room.pickups || []).filter(p => p.type !== 'sdCard');
const L = E.load(data); assert.equal(L.errors.length, 0, [...L.errors].join('; '));
const STOP = +(process.argv[2] || 6), VARIANT = +(process.env.VARIANT || 0);
let clips = 0, hits = 0;
const KEYS = ['left', 'right', 'jump', 'dive', 'lookDown', 'camera', 'fix'], rec = [];
lib.onStep = (inp, s) => { rec.push(KEYS.reduce((b, k, j) => b | (inp[k] ? 1 << j : 0), 0)); clips += s.events.filter(e => e.type === 'camOn').length; hits += s.events.filter(e => e.type === 'hit').length; };

const S = E.create(L, null, { variant:VARIANT });
const d = (x, y, o) => Object.assign({ x, y, anywhere:true }, o), at = (x, y, o) => Object.assign({ x, y, tol:.45 }, o), w = (x, y, o) => Object.assign({ x, y, wet:true }, o);
const floatAt = x => w(x, c => c.surface === null ? c.P.y : c.surface + E.W.float, { tolY:.12 });
const rooms = [], mark = name => { rooms.push({ room:name, seconds:+S.time.toFixed(1), health:S.health, lives:S.lives, salvage:E.salvageCount(S), score:S.score, margin:+(E.W.limit - S.static).toFixed(1) }); console.log(JSON.stringify(rooms[rooms.length - 1])); };
const unhurt = () => { assert.equal(S.livesLost, 0, 'no life lost'); };

// ---- 01 Suit dock: the kit-rack loop, the suit, the airlock, the shallow basin
travel(S, [d(7.5, 9.6), d(12, 7.4), d(7.5, 5.2), d(12, 7.4), at(11.5, 12)]);
assert.ok(S.suit, 'the suit is on');
travel(S, [at(19, 12), at(24.6, 12), w(30, 15.8), w(34.5, 15.8), floatAt(36.4), d(39.6, 12), d(44, 10), at(50, 12)]);
assert.equal(E.salvageCount(S), 8); assert.equal(S.checkpoint.x, 50); mark('suit-dock'); unhurt();
if (STOP >= 2){
  // ---- 02 Flushing gallery: the rim as far as the fixture table, then down past three nozzles
  travel(S, [d(60.2, 10), d(66.7, 8.4), d(73, 9.6), d(79.5, 9.6), d(86.5, 8), d(93, 9.8)]);
  travel(S, [floatAt(96.5), w(97, 21.8), w(102.4, 21.6), w(105, 20.6), w(104.9, 16.9), w(109.5, 17.2), w(113.6, 22.8), w(118, 23), floatAt(118.6), d(122, 12), at(124, 12)]);
  assert.ok((NO_CARDS || S.got.has('sd2-1')) && S.got.has('s2-9')); mark('flushing-gallery'); unhurt();
}
if (STOP >= 3){
  // ---- 03 Guide tower: through the lock, fill the shaft, ride the water past the wire, then the high catwalks
  travel(S, [at(130, 12), at(138.6, 12), floatAt(144), floatAt(146.9), { via:'press' }]);
  assert.equal(S.valves.lift, 1, 'the wheel inside the shaft fills it');
  travel(S, [w(145, 15.4, { via:'until', sink:true, done:c => c.tanks.shaft.level < 11 }), w(145, c => c.surface + E.W.float, { tolY:.15, done:c => c.tanks.shaft.level === .2, frames:1500 })], { depth:200 });
  assert.ok(S.got.has('s3-1') && S.got.has('s3-2'), 'both finds in the shaft');
  travel(S, [d(152, -.5), d(155.6, 2), d(158.5, 1.5), d(165, 1)]);
  travel(S, [d(171.5, 2.5), d(177.5, 1), d(183.7, 3), d(190, 1.5), d(196, 3.5), d(201.5, 5.5), d(206.5, 8), d(211.5, 10.2), at(218, 12)], { depth:220 });
  mark('guide-tower'); unhurt();
}
if (STOP >= 4){
  // ---- 04 Split reservoir: the water decides. A is full, so swim it and take its high cache; B is drained, so its
  // vault is open; then the one wheel, on the divider: A drains and its vault opens, B fills and can be crossed.
  travel(S, [at(226, 12), at(235.4, 12), floatAt(252.6), d(255.5, 12.3), d(263.3, 10.2), floatAt(268), floatAt(275.4), d(278.5, 12.2), at(282, 10)], { depth:220 });
  assert.ok(S.got.has('s4-4'), 'A full: its high cache');
  // down a ladder he steps from rung to rung; up it he jumps through the gratings
  const downB = [d(285.5, 12.2), d(289, 16.8), d(285.5, 19.2), d(289, 21.4)], upB = [d(289, 21.4), d(285.5, 19.2), d(289, 16.8), d(285.5, 14.6), d(285.5, 12.2), at(282, 10)];
  const downA = [d(278.5, 12.2), d(275, 16.8), d(278.5, 19.2), d(275, 21.4)], upA = [d(275, 21.4), d(278.5, 19.2), d(275, 16.8), d(278.5, 14.6), d(278.5, 12.2), at(282, 10)];
  travel(S, downB.concat([at(295, 21.4)], upB, [{ via:'press' }]), { depth:260 });
  assert.ok(S.got.has('s4-9'), 'B drained: its vault'); assert.equal(S.valves.transfer, 1);
  travel(S, [{ x:282, y:10, via:'until', done:c => c.tanks.resA.level === 21 }].concat(downA, [at(269.4, 21.4)], upA), { depth:260 });
  assert.ok(S.got.has('s4-3') && (NO_CARDS || S.got.has('sd4-1')), 'A drained: its vault');
  travel(S, [d(285.5, 12.2), floatAt(294.6), d(299.5, 12.3), d(304.2, 10.2), d(309.8, 8)], { depth:260 });
  travel(S, [floatAt(314), floatAt(325), d(329.6, 12), at(332, 12)], { depth:220 });
  assert.ok((NO_CARDS || S.got.has('sd4-1')) && S.got.has('s4-11')); mark('split-reservoir'); unhurt();
}
if (STOP >= 5){
  // ---- 05 Cut-path maze: the three cut corridors, the hidden recess, the charge shed wherever there is air to shed it in
  travel(S, [at(338, 12), at(343.4, 12), w(348, 21.6), w(350.6, 18.6), w(359, 18.6), w(367.6, 18.6), floatAt(370), d(370, 12.2)], { depth:220 });
  travel(S, [floatAt(372.6), w(372.6, 22.6), w(378, 22.6), w(383.5, 22.6), w(383.5, 18), floatAt(383.5)], { depth:260 });
  assert.ok(S.got.has('mini'), 'the hidden life'); assert.equal(S.lives, 4);
  travel(S, [{ x:383.5, y:14, wet:true, via:'until', done:c => (E.W.limit - c.static) > E.W.limit - 1 }, w(383.6, 16.6), w(388.5, 16.6), w(393.6, 16.6), floatAt(396), w(396, 22), floatAt(397), d(396, 12.2)], { depth:260 });
  travel(S, [floatAt(398.4), w(398.4, 19), w(408, 19), w(417.6, 19), floatAt(420), d(425.6, 12), at(428, 12)], { depth:260 });
  mark('cut-path-maze'); unhurt();
}
if (STOP >= 6){
  // ---- 06 Threading fault: the approach over its tank, then the fault itself
  travel(S, [at(434, 12), d(437.5, 10), d(442, 12), d(449.5, 9.8), d(456, 8), d(462.5, 9.8), at(470, 12), at(473, 12), at(475.4, 12)], { depth:220 });
  assert.equal(S.checkpoint.x, 470);
  // Each job is planned in one piece from wherever the last one left him. The travelling wire reaches every deck
  // inside the cell, so the plan waits, advances and falls back as the wire and the jets allow.
  const seq = E.sequence(S), stepIs = n => c => c.boss.step >= n || c.boss.done;
  const climb = [d(479.5, 9.6), d(484, 7.2), d(489, 5), at(495, 5)], deck = at(475.4, 12), table = at(487.4, 13, { tol:.12 }), step1 = d(481, 12.6), ledge = d(477.2, 14.3);
  // a rung is skipped when he already stands above it, or when he floats high enough to leap for the rung above it
  const rung = y => d(477.2, y, { skip:c => (!c.wet && c.P.ground && c.P.y <= y + .05 && c.P.x < 479) || (c.wet && c.surface !== null && c.surface <= y - 1) });
  function toDeckLevel(){                                    // out of the sump, however full it is, as far as the low ledge
    const P = S.P;
    if (!S.wet && P.y <= 14.4) return [];
    // the sump is full, filling, or about to refill for the next pass: float beside the ladder until the ledge is in reach
    if (S.tanks.sump.name === 'flood' || S.boss.trans > 0) return [w(477.7, c => c.surface === null ? c.P.y : c.surface + E.W.float, { tolY:.15, frames:1500, done:c => c.wet && c.tanks.sump.name === 'flood' && c.tanks.sump.level < 15.5 }), ledge];
    // draining: float beside the ladder and let the falling water set him down on a rung; drained: climb from the floor
    const up = [rung(21.5), rung(19.1), rung(16.7), ledge];
    // draining while he floats: beside the ladder, then a leap onto whichever rung the falling water has brought in reach
    if (S.wet) return [w(477.3, c => c.surface + E.W.float, { tolY:.2, frames:900 })].concat(up);
    return up;
  }
  // The ways to a job, best first. Where he already stands at the point, the first is simply to start; the others
  // go by a place the machines cannot reach, so there is somewhere to wait and somewhere to fall back to.
  function routesTo(name, n){
    const P = S.P, p = L.boss.points[name], fix = { via:'fix', film:true, done:stepIs(n), frames:180 }, upper = !S.wet && P.y < 6, onTable = !S.wet && Math.abs(P.y - 13) < .1 && P.x > 484;
    const here = Math.abs(P.x - p[0]) < .8 && Math.abs(P.y - p[1]) < .3;
    // between passes he simply waits, hands off: in rising water that lets him float up and get his helmet out to shed static
    // between passes he waits with his helmet out: at the float line if he is in the fluid, so the suit sheds its static
    const wait = S.boss.trans > 0 ? [{ x:P.x, y:S.wet ? (c => c.surface === null ? c.P.y : c.surface + E.W.float) : P.y, wet:S.wet, via:'until', done:c => c.boss.trans <= 0 && c.boss.on, frames:2400 }] : [];
    const viaLedge = () => toDeckLevel().concat(!S.wet && S.P.y < 14 && S.P.x < 476.1 ? [ledge] : []);      // from the entry deck the way in is down onto the ledge
    const flushPt = w(481, 23.9, { tolY:.25, tol:.5 }), dive = [floatAt(483.4), w(482.2, 19), w(481, 21.8), flushPt, fix];
    if (name === 'flush'){
      if (here) return [wait.concat([fix]), wait.concat([d(477.2, 21.5), flushPt, fix])];
      return [wait.concat(upper ? [d(489, 5), table] : [], onTable || upper ? [at(485.8, 13, { tol:.3 })].concat(dive) : S.wet ? dive.slice(2) : viaLedge().concat(dive.slice(2)))];
    }
    if (name === 'tension'){
      if (here) return [wait.concat([fix]), wait.concat([at(485.8, 13, { tol:.3 }), table, fix])];
      return [wait.concat(upper ? [d(489, 5)] : viaLedge().concat([step1]), [at(485.8, 13, { tol:.3 }), table, fix])];
    }
    if (here) return [wait.concat([fix]), wait.concat([at(489, 5, { tol:.2 }), at(495, 5), fix])];
    return [wait.concat(onTable ? [at(485.8, 13, { tol:.3 }), step1, deck] : toDeckLevel().concat(S.P.x < 476.1 && !S.wet && S.P.y === 12 ? [] : [deck]), climb.slice(0, 3), [at(489, 5, { tol:.2 }), at(495, 5), fix])];
  }
  seq.forEach((name, i) => {
    const escape = name === 'tension' ? [at(485.8, 13, { tol:.3 }), step1, deck] : name === 'align' ? [at(489, 5, { tol:.2 }), d(484, 7.2), d(479.5, 9.6), deck] : [floatAt(477.7)];   // after the flush job: up beside the ladder, helmet out
    const ways = routesTo(name, i + 1).map(way => i === seq.length - 1 ? way : way.concat(escape)); let err = null, done = false;
    for (const way of ways){ try { travel(S, way, { depth:400, calls:40000 }); done = true; break; } catch (e){ err = e; } }
    if (!done){ if (process.env.DEBUG_BOSS) console.log('STUCK', JSON.stringify({ x:S.P.x, y:S.P.y, ground:S.P.ground, wet:S.wet, headWet:S.headWet, static:S.static, surface:S.surface, sump:S.tanks.sump, boss:{ pass:S.boss.pass, step:S.boss.step, trans:S.boss.trans, t:S.boss.t }, time:S.time })); throw err; }
    assert.ok(S.boss.step >= i + 1 || S.boss.done, name + ' repaired');
    console.log(JSON.stringify({ repair:i + 1, point:name, pass:S.boss.pass, seconds:+S.time.toFixed(1), health:S.health, margin:+(E.W.limit - S.static).toFixed(1), sump:S.tanks.sump.name }));
  });
  assert.ok(S.boss.done, 'the fault is fixed'); assert.ok(clips >= 6, 'filming used for repairs'); assert.equal(hits, 0); if (NO_CARDS) assert.equal(S.inv.sdCard, 0);
  for (let i = 0; i < 600 && !S.won; i++) step(S, 1);
  assert.ok(S.won, 'the drained cell and completed cut precede results'); mark('threading-fault'); unhurt();
}
const total = { seconds:+S.time.toFixed(1), salvage:E.salvageCount(S), score:S.score, livesLost:S.livesLost, health:S.health, won:S.won, variant:VARIANT, noCards:NO_CARDS, clips, hits, rooms };
console.log('Level 2 run', JSON.stringify(total));
if (STOP >= 6 && !process.env.NO_RECORD){
  const runs = []; for (const b of rec){ const last = runs[runs.length - 1]; if (last && last[0] === b) last[1]++; else runs.push([b, 1]); }
  if (VARIANT === 0 && !NO_CARDS) fs.writeFileSync(path.join(base, 'demo-2.json'), JSON.stringify({ level:'below-the-wire', keys:KEYS, frames:rec.length, variant:0, runs }));
  fs.writeFileSync(path.resolve(__dirname, '../docs/mike-platformer/l2-look/run' + (NO_CARDS ? '-bare' : '') + (VARIANT ? '-' + VARIANT : '') + '.json'), JSON.stringify(total, null, 2));
}
