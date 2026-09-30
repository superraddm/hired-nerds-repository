// Independent review probes, promoted to regression checks after the refinement pass.
// The first probe replays the supplied ordinary-input recording. The second deliberately places
// Mike near one nozzle to isolate visual/damage timing. No production assets are written.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { M, E, K, levelData, base } = require('./mike-l2-lib.cjs');
const L = E.load(levelData());
const d = JSON.parse(fs.readFileSync(path.join(base, 'demo-2.json'), 'utf8'));
const S = E.create(L, null, {variant:d.variant || 0});
let completionSave, bossStart, hits = 0, cameraSeconds = 0;
for (const [bits, frames] of d.runs) {
  const inp = Object.fromEntries(d.keys.map((k, i) => [k, !!(bits & (1 << i))]));
  for (let i = 0; i < frames && !S.won; i++) {
    E.step(S, inp);
    if (S.cam.on) cameraSeconds += K.step;
    for (const e of S.events) {
      if (e.type === 'hit') hits++;
      if (e.type === 'bossStart') bossStart = S.time;
      if (e.type === 'bossDone') completionSave = E.saveData(S);
    }
  }
}
assert.ok(S.won, 'supplied demo still wins through the real rules');
assert.ok(completionSave, 'capture the real save written at the final repair');
const R = E.create(L, completionSave);
const startX = R.P.x;
for (let i = 0; i < 600; i++) E.step(R, {right:true});
assert.ok(R.won && R.boss.on, 'a completed save finishes instead of freezing');
assert.equal(R.boss.step, E.sequence(R).length, 'all completed repairs survive loading');
assert.equal(R.score, completionSave.score, 'no duplicate victory bonus');
assert.equal(S.tanks.sump.level, S.tanks.sump.target, 'results wait for the drained cell');
assert.ok(S.doors.exit >= .99, 'results wait for the open exit');

// Sample the first active frame of the real gallery nozzle. The renderer uses grow to
// draw its reach; both the damage and the drawing must follow that growing segment.
const n = L.nozzles.find(n => n.id === 'n2b');
const QL = Object.assign({}, L, {wires:[], nozzles:[n], intakes:[]});
const Q = E.create(QL); Q.suit = true;
Q.P = M.newPlayer(99, 18.5); Q.P.hitT = 9;
Q.mt = n.cycle - n.phase + n.tell - K.step + .001;
E.step(Q, {});
const p = E.nozzlePose(n, Q.mt);
assert.equal(Q.health, 3, 'Mike is unharmed ahead of the visible jet');
for (let i = 0; i < 30; i++) E.step(Q, {});
assert.equal(Q.health, 2, 'the jet hurts once after it reaches Mike');
const F = E.create(QL); F.suit = true; F.P = M.newPlayer(99, 18.5); F.P.hitT = 9;
F.cam.on = true; F.mt = n.cycle - n.phase + n.tell - K.step*.2 + .001;
E.step(F, {}); assert.equal(F.health, 3, 'filming does not create invisible early damage');
for (let i = 0; i < 15; i++) E.step(F, {});
assert.equal(F.health, 3, 'still ahead of the slowed stream');
for (let i = 0; i < 55; i++) E.step(F, {});
assert.equal(F.health, 2, 'the slowed stream eventually reaches Mike');
const output = {
  recording: {won:S.won, seconds:+S.time.toFixed(2), salvage:E.salvageCount(S), hits,
    livesLost:S.livesLost, cameraSeconds:+cameraSeconds.toFixed(2), bossSeconds:+(S.time - bossStart).toFixed(2)},
  completedBossSave: {afterSeconds:10, bossOn:R.boss.on, bossDone:R.boss.done, won:R.won,
    x:R.P.x, moved:R.P.x !== startX, stalled:!R.won && R.P.x === startX},
  nozzleGrowth: {id:n.id, firstActiveReachTiles:+p.reach.toFixed(3), earlyHit:false, reachedHit:true, filmGrowthPassed:true},
  ending: {won:S.won, playerX:S.P.x, exitX:L.doors.find(d => d.id === 'exit').x,
    sumpLevel:+S.tanks.sump.level.toFixed(3), drainTarget:S.tanks.sump.target}
};
const out = path.resolve(__dirname, '../docs/mike-platformer/l2-look/refinement.json');
fs.writeFileSync(out, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
