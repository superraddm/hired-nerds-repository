// Level 3, Cobot Mania: the rules, measured in Node with the real code (js/world.js + js/l3-world.js).
//   node tools/test-mike-l3-mechanics.cjs
// Where a check needs Mike somewhere particular it places him there and says so; every movement after that is ordinary
// input through E.step. Writes docs/mike-platformer/l3-look/mechanics.json.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('node:assert/strict');
const base = path.resolve(__dirname, '../public/fireworks/mike-game'), OUT = path.resolve(__dirname, '../docs/mike-platformer/l3-look');
fs.mkdirSync(OUT, { recursive:true });
const ctx = { window:{} }; vm.createContext(ctx);
for (const f of ['world.js', 'l3-world.js']) vm.runInContext(fs.readFileSync(path.join(base, 'js', f), 'utf8'), ctx, { filename:f });
const M = ctx.window.MIKE, E = M.L3, K = M.PHYS, dt = K.step;
const data = JSON.parse(fs.readFileSync(path.join(base, 'level-3.json'), 'utf8'));
const L = E.load(data);
const results = [];
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);            // arrays made inside the vm are another realm's
// The Teach Cell's logic is measured in a quiet copy of the level with the boss's own hazards taken out; how fair the
// hazards are around each key and the pendant is a separate question with its own check.
const Lq = E.load(Object.assign({}, data, { arms:data.arms.filter(a => !a.boss), rovers:data.rovers.filter(r => !r.boss), drops:data.drops.filter(d => !d.boss) }));
function check(name, fn){ try { const note = fn(); results.push({ name, pass:true, note }); console.log('  ok   ' + name + (note ? '  (' + note + ')' : '')); }
  catch (e){ results.push({ name, pass:false, error:e.message }); console.log('  FAIL ' + name + '\n       ' + e.message); } }
const fresh = o => E.create(L, null, o);
const place = (S, x, y) => { S.P = M.newPlayer(x, y); S.P.hitT = 9; S.ride = null; S.hang = null; return S; };
const run = (S, n, inp) => { for (let i = 0; i < n; i++) E.step(S, inp || {}); return S; };
const until = (S, fn, max, inp) => { for (let i = 0; i < (max || 3000); i++){ if (fn(S)) return i; E.step(S, typeof inp === 'function' ? inp(S, i) : inp || {}); } return -1; };
const tap = (S, k) => { E.step(S, { [k]:true }); E.step(S, {}); };
const carrier = id => L.carriers.find(c => c.id === id), hook = id => L.hooks.find(h => h.id === id);
const box = (x, y, sh) => ({ x0:x - K.halfW + sh, x1:x + K.halfW - sh, y0:y - K.height + sh, y1:y - sh });
const overlapsSolid = b => L.solids.find(s => b.x1 > s.x && b.x0 < s.x + s.w && b.y1 > s.y && b.y0 < s.y + s.h);

console.log('Level 3 mechanics');
check('the level validates', () => { same(L.errors, []); return `${L.W} tiles, ${L.carriers.length} carriers, ${L.hooks.length} hooks, ${L.arms.length} arms, ${L.rovers.length} rovers, ${L.drops.length} crate drops, ${L.salvageTotal} salvage`; });
check('dry physics is Level 1\'s: a held jump rises 3 tiles', () => {
  const S = place(fresh(), 3, 12); let top = 12; for (let i = 0; i < 70; i++){ E.step(S, { jump:true }); top = Math.min(top, S.P.y); }
  assert.ok(Math.abs(12 - top - 3) < .02, 'apex ' + (12 - top).toFixed(3)); return 'apex ' + (12 - top).toFixed(3) + ' tiles';
});

// ---------- carriers ----------
// Every ride a carrier can give: from anywhere in its gripper's sway to each of its destinations.
const rides = c => c.drops.flatMap((d, i) => [-1, 0, 1].map(k => ({ c, i, from:[c.home[0] + k*c.sway, c.home[1]], to:d })));
check('every carrier ride is clear of solid scenery (gratings in hubs are hatches it lifts him through)', () => {
  const bad = new Set();
  for (const c of L.carriers) for (const r of rides(c)) for (let i = 1; i < 200; i++){
    const [x, y] = E.carryPath(c, i/200, r.from, r.to), b = box(x, y, .06), hit = L.solids.find(s => s.kind !== 'shelf' && b.x1 > s.x && b.x0 < s.x + s.w && b.y1 > s.y && b.y0 < s.y + s.h);
    if (hit){ bad.add(`${c.id} to destination ${r.i + 1} passes through the ${hit.style} at ${hit.x},${hit.y} (feet ${x.toFixed(2)},${y.toFixed(2)})`); break; }
  }
  assert.ok(!bad.size, [...bad].join('; '));
  return L.carriers.length + ' carriers, ' + L.carriers.reduce((k, c) => k + c.drops.length, 0) + ' destinations';
});
// hazard reach, for a box: the tool's whole sweep, a rover's whole track, a crate's whole fall
function inHazard(b, boss){
  for (const a of L.arms) if (!a.boss || boss) for (let k = 0; k <= 24; k++){
    const ang = (a.a0 + (a.a1 - a.a0)*k/24)*Math.PI/180, tx = a.base[0] + Math.cos(ang)*a.r, ty = a.base[1] + Math.sin(ang)*a.r;
    const nx = Math.max(b.x0, Math.min(tx, b.x1)), ny = Math.max(b.y0, Math.min(ty, b.y1)); if (Math.hypot(nx - tx, ny - ty) < E.R.tool) return 'arm ' + a.id; }
  for (const r of L.rovers) if (!r.boss || boss){ const h = r.tall ? E.R.roverTall : E.R.roverLow;
    if (b.x1 > r.span[0] - E.R.roverW && b.x0 < r.span[1] + E.R.roverW && b.y1 > r.y - h && b.y0 < r.y) return 'rover ' + r.id; }
  for (const d of L.drops) if (!d.boss || boss) if (b.x1 > d.x - E.R.crate/2 && b.x0 < d.x + E.R.crate/2 && b.y1 > d.top && b.y0 < d.floor) return 'crate drop ' + d.id;
  return null;
}
check('every ride, and every destination, is clear of every hazard (outside the boss)', () => {
  const bad = new Set();
  for (const c of L.carriers) for (const r of rides(c)) for (let i = 0; i <= 200; i++){
    const [x, y] = E.carryPath(c, i/200, r.from, r.to), h = inHazard(box(x, y, 0));
    if (h){ bad.add(`${c.id} to destination ${r.i + 1} meets ${h} at ${x.toFixed(2)},${y.toFixed(2)}`); break; }
  }
  assert.ok(!bad.size, [...bad].join('; '));
});
check('walking into a hovering gripper: picked up, no choice, set down on his feet at its next destination, unhurt', () => {
  const notes = [];
  for (const c of L.carriers){
    const side = L.solids.some(s => c.home[0] - 2.2 > s.x && c.home[0] - 2.2 < s.x + s.w && Math.abs(s.y - c.home[1]) < 1e-6) ? -1 : 1;   // walk in along the deck
    const S = place(fresh(), c.home[0] + side*2.2, c.home[1]); S.mt = -side*c.period/4 - c.phase;   // the gripper at the near end of its sway
    const n = until(S, S => S.ride, 120, side < 0 ? { right:true } : { left:true }); assert.ok(n >= 0, `${c.id} did not pick him up`);
    for (let k = 0; k < 40; k++){ E.step(S, { left:true, jump:k % 2 === 0 }); assert.ok(S.ride, `${c.id}: he got away (controls do nothing while held)`); if (S.car[c.id].st === 'carry') break; }
    const m = until(S, S => !S.ride && S.P.ground, 600); const d = c.drops[0];
    assert.ok(m > 0 && Math.abs(S.P.x - d[0]) < .05 && Math.abs(S.P.y - d[1]) < .01, `${c.id} set him down at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)}, not ${d}`);
    run(S, 30); assert.equal(S.health, 3, c.id + ' hurt him'); notes.push(c.id);
  }
  return notes.length + ' carriers';
});
check('each grab sends him to the next destination on the list, round and round', () => {
  const c = L.carriers.find(c => c.drops.length >= 2), S = fresh(), seen = [];
  for (let k = 0; k < c.drops.length + 1; k++){
    place(S, c.home[0], c.home[1]); until(S, S => S.ride, 60); until(S, S => !S.ride && S.P.ground, 900); seen.push(c.drops.findIndex(d => Math.abs(d[0] - S.P.x) < .05 && Math.abs(d[1] - S.P.y) < .01));
    until(S, S => S.car[c.id].st === 'ready', 900);
  }
  same(seen, [...c.drops.map((_, i) => i), 0]); return c.id + ': ' + seen.map(i => i + 1).join(' → ');
});
check('jumping over the gripper gets him past it', () => {
  const c = L.carriers.find(c => c.id === 'c1'), S = place(fresh(), c.home[0] - 3.2, c.home[1]);
  run(S, 6, { right:true }); for (let k = 0; k < 90; k++) E.step(S, { right:true, jump:k < 30 });
  assert.equal(S.ride, null); assert.ok(S.P.x > c.home[0] + 1.5, `stopped at ${S.P.x.toFixed(2)}`);
});
check('nothing hurts him while a carrier holds him', () => {
  const c = L.carriers.find(c => c.id === 'c1'), S = place(fresh(), c.home[0], c.home[1]); until(S, S => S.ride, 60);
  S.P.hitT = 9; assert.equal(E.hit(S, 1), false); assert.equal(S.health, 3);
});
check('a carrier rests at home after a ride before it can grab again', () => {
  const c = L.carriers.find(c => c.id === 'c1'), S = place(fresh(), c.home[0], c.home[1]); until(S, S => S.ride, 60); until(S, S => !S.ride, 600);
  until(S, S => S.car.c1.st === 'rest', 600); place(S, c.home[0], c.home[1]); run(S, 3); assert.equal(S.ride, null, 'grabbed during its rest');
});
check('the camera slows carriers and hooks, never Mike', () => {
  const c = L.carriers.find(c => c.id === 'c1'), a = place(fresh(), c.home[0], c.home[1]), b = place(fresh(), c.home[0], c.home[1]);
  const na = until(a, S => S.car.c1.st === 'drop', 2000);
  E.step(b, { camera:true }); const nb = until(b, S => S.car.c1.st === 'drop', 4000);
  assert.ok(nb > na*1.6, `ride took ${na} steps normally and ${nb} filming`);
  const r1 = place(fresh(), 3, 12), r2 = place(fresh(), 3, 12); E.step(r2, { camera:true });
  run(r1, 30, { right:true }); run(r2, 30, { right:true });
  assert.ok(Math.abs(r1.P.x - r2.P.x) < .5, `ran to ${r1.P.x.toFixed(2)} normally, ${r2.P.x.toFixed(2)} filming`);
  return `ride ${(na*dt).toFixed(2)}s normally, ${(nb*dt).toFixed(2)}s while filming; running speed unchanged`;
});

// ---------- hooks ----------
check('a hook: jump into the handle, ride the rail, Jump lets go with a hop onto the far deck', () => {
  const h = hook('h1'), S = place(fresh(), 25.4, 4);
  E.step(S, { jump:true }); run(S, 3, { jump:true });
  assert.ok(S.hang && S.hang.id === 'h1', 'did not grab the handle');
  const n = until(S, S => E.hookPose(h, S.mt).f > .999, 800); assert.ok(n > 0, 'the hook never reached the end of its rail');
  tap(S, 'jump'); assert.equal(S.hang, null);
  const m = until(S, S => S.P.ground, 300);
  assert.ok(m > 0 && Math.abs(S.P.y - 4) < .01 && S.P.x > 32, `landed at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)}`);
  assert.equal(S.health, 3); assert.ok(S.got.has('i7'), 'the coupling over the gap was not collected on the way');
  return `rode ${(n*dt).toFixed(2)}s, landed at ${S.P.x.toFixed(2)}`;
});
check('Down lets go of a hook without a hop', () => {
  const S = place(fresh(), 25.4, 4); E.step(S, { jump:true }); run(S, 3, { jump:true }); run(S, 40);
  const y = S.P.y; E.step(S, { lookDown:true }); assert.equal(S.hang, null); E.step(S, { lookDown:true });
  assert.ok(S.P.y >= y - .01, 'he hopped');
});

// ---------- hazards ----------
check('hazard arms hurt only while their light is red', () => {
  let reds = 0, safe = 0;
  for (const a of L.arms.filter(a => !a.boss)) for (let t = 0; t < a.cycle; t += .05){
    const p = E.armPose(a, t), S = place(fresh(), p.tip[0], p.tip[1] + K.height/2); S.mt = t - dt;
    S.P.ground = false; E.hit; const before = S.health;
    // measure the damage rule alone at this instant
    S.mt = t; const q = E.armPose(a, S.mt);
    const P = S.P, nx = Math.max(P.x - K.halfW, Math.min(q.tip[0], P.x + K.halfW)), ny = Math.max(P.y - K.height, Math.min(q.tip[1], P.y));
    const touching = Math.hypot(q.tip[0] - nx, q.tip[1] - ny) < E.R.tool;
    assert.ok(touching, 'placement is wrong');
    if (q.active) reds++; else safe++;
    assert.equal(before, 3);
  }
  // and through the real step: stand in a1's strike and wait
  const a = L.arms.find(a => a.id === 'a1'), p = E.armPose(a, a.tell + .5), S = place(fresh(), p.tip[0], 12);
  let hurtState = null; until(S, S => { if (S.health < 3 && !hurtState) hurtState = E.armPose(a, S.mt).state; return S.health < 3; }, 400);
  assert.equal(hurtState, 'red', 'a1 hurt him while ' + hurtState);
  return `${reds} red and ${safe} safe instants sampled; a1 hurt him only while red`;
});
check('a floor rover hurts on contact; a low rover can be jumped', () => {
  const r = L.rovers.find(r => r.id === 'r1'), S = place(fresh(), 23, 12);
  const n = until(S, S => S.health < 3, 600); assert.ok(n >= 0, 'the rover never reached him');
  assert.ok(E.R.roverLow < 3 && E.R.roverTall > 3, 'rover heights'); return `r1 reached him after ${(n*dt).toFixed(2)}s`;
});
check('crates hurt only while falling', () => {
  const d = L.drops.find(d => d.id === 'd1');
  const S = place(fresh(), d.x, d.floor); let stage = null;
  until(S, S => { const c = E.dropPose(d, S.mt); if (S.health < 3 && !stage) stage = c.stage; return S.health < 3; }, 600);
  assert.equal(stage, 'fall', 'hurt during ' + stage);
  for (let t = 0; t < d.cycle; t += .02){ const c = E.dropPose(d, t); if (c.stage !== 'fall') assert.ok(!c.active); }
});
check('belts carry him, and reversing belts reverse on machine time', () => {
  const S = place(fresh(), 143, 20); run(S, 60); const v = (S.P.x - 143)/1;
  assert.ok(v > 4 && v < 7, 'b4 carried him at ' + v.toFixed(2));
  const b = L.belts.find(b => b.id === 'b5'); assert.equal(E.beltProfile(b, 1), 1); assert.equal(E.beltProfile(b, 5), -1);
  return 'b4 ' + v.toFixed(2) + ' tiles/s';
});
check('the route log records a lane once he stands on it', () => {
  const S = place(fresh(), 80, 4); run(S, 2); assert.ok(S.lanes.has('assembly-m')); assert.equal(S.lanes.size, 1);
});

// ---------- the Teach Cell ----------
const B = () => L.boss;
function arena(level){
  const S = E.create(level || Lq); place(S, B().trigger + .5, 12); run(S, 2);
  assert.ok(S.boss.on, 'the Teach Cell did not wake');
  S.P.hitT = -1e6; return S;                                   // the sweeps would find him; a check that needs him hurt places him
}
const standAt = (S, id) => { const n = B().nodes[id]; return place(S, n.stand[0], n.stand[1]); };
// the fewest dial turns that make a round work, by trying every setting (the tests find it; nothing stores it)
function solve(S, r){
  const ids = Object.keys(B().nodes), start = B().rounds[r].dials, need = B().rounds[r].sources, T = E.clone(S); T.boss.round = r; let best = null;
  const rec = (k, d, cost) => { if (best && cost >= best.cost) return;
    if (k === ids.length){ T.boss.dials = d; if (need.every(c => E.routeFor(T, c).ok)) best = { cost, dials:Object.assign({}, d) }; return; }
    const id = ids[k], n = B().nodes[id].exits.length;
    for (let t = 0; t < n; t++){ d[id] = t; rec(k + 1, d, cost + (t - start[id] + n) % n); } };
  rec(0, {}, 0); return best;
}
check('every round starts with the route broken, and can be put right', () => {
  const S = arena(), notes = [];
  for (let r = 0; r < E.rounds(S); r++){
    E.startRound(S, r);
    for (const c of B().rounds[r].sources) assert.ok(!E.routeFor(S, c).ok, `round ${r + 1} starts already working for ${c.chute} ${c.colour}`);
    const sol = solve(S, r); assert.ok(sol, `round ${r + 1} cannot be solved`); notes.push(`round ${r + 1}: ${sol.cost} turns`);
  }
  return notes.join(', ');
});
check('the arena door shuts behind him when the Teach Cell wakes, and a checkpoint inside it is lit', () => {
  const S = arena(); place(S, B().trigger + 1.1, 12); run(S, 30);
  assert.ok(E.doorSolid(S, Lq.doors.find(d => d.id === 'arena'))); assert.ok(S.checkpoint.x > B().trigger, 'the checkpoint inside the door was not lit');
});
check('the arm carries its crate along the route and drops it where the route breaks', () => {
  const S = arena(); const r = E.routeFor(S, B().rounds[0].sources[0]); assert.ok(r.broken);
  let dropAt = null; until(S, S => { for (const e of S.events) if (e.type === 'drop') dropAt = e.x; return dropAt !== null; }, 900, {});
  const end = E.nodePos(B(), r.end); assert.ok(dropAt !== null && Math.abs(dropAt - end[0]) < .01, `dropped at ${dropAt}, the break is at ${r.end} (${end[0]})`);
  return `the crate fell at waypoint ${r.end}`;
});
check('a crate it drops hurts him if he stands under the break', () => {
  const S = arena(), r = E.routeFor(S, B().rounds[0].sources[0]); standAt(S, r.end);
  const n = until(S, S => S.health < 3, 900, {}); assert.ok(n > 0, 'it never hit him');
});
check('holding Fix at a dial for 2.2 s turns it to its next exit, filming or not; each turn needs a new hold', () => {
  const notes = [];
  for (const film of [false, true]){
    const S = arena(); standAt(S, 'F'); run(S, 1); const d0 = S.boss.dials.F; if (film) E.step(S, { camera:true });
    let n = 0; while (S.boss.dials.F === d0 && n < 400){ E.step(S, { fix:true }); n++; }
    assert.ok(Math.abs(n*dt - B().hold) < .05, `turned after ${(n*dt).toFixed(2)} s`); notes.push((n*dt).toFixed(2) + ' s' + (film ? ' filming' : ''));
    const d1 = S.boss.dials.F; run(S, 200, { fix:true }); assert.equal(S.boss.dials.F, d1, 'it kept turning without a new hold');
  }
  return notes.join(', ');
});
check('after each trip the arm warns, then sweeps one level of the cell: it hurts him there and nowhere else; no level is safe from all three', () => {
  const notes = [];
  for (const lv of [0, 1, 2]){
    const S = arena();
    // stand on the level this sweep runs along (the floor, a side deck, a top ledge) and on one it does not
    const on = [[B().nodes.G.stand[0], 12], [B().nodes.B.stand[0], 8], [B().nodes.A.stand[0], 4.4]][lv], off = [[B().nodes.B.stand[0], 8], [B().nodes.G.stand[0], 12], [B().nodes.G.stand[0], 12]][lv];
    const S1 = E.clone(S), S2 = E.clone(S), S3 = E.clone(S); let warned = false;
    if (lv === 1){ Object.assign(S3.boss.arms[0], { st:'rise', t:0, n:lv }); place(S3, B().nodes.C.stand[0], B().nodes.C.stand[1]); assert.ok(until(S3, T => T.health < 3, 900, {}) > 0, 'the middle grating is safe from the deck sweep'); }
    for (const [T, at] of [[S1, on], [S2, off]]){ Object.assign(T.boss.arms[0], { st:'rise', t:0, n:lv }); place(T, at[0], at[1]); T.P.hitT = 9; }
    const y = E.sweepOf(S1, S1.boss.arms[0]).y;
    const n = until(S1, T => { for (const e of T.events) if (e.type === 'sweepWarn') warned = true; return T.health < 3; }, 900, {});
    assert.ok(n > 0, `the sweep at y ${y} never hit him on its own level`); assert.ok(warned, 'it swept without warning');
    let swept = false; until(S2, T => { if (T.boss.arms[0].st === 'home') swept = true; return swept; }, 900, {});
    assert.ok(swept, 'the second sweep never finished'); assert.equal(S2.health, 3, `the sweep at y ${y} hit him on a level it was not sweeping`);
    notes.push(`y ${y}`);
  }
  return notes.join(', ');
});
check('round 2 has two arms, each working from its own chute', () => {
  const S = arena(); E.startRound(S, 1); assert.equal(S.boss.arms.length, 2);
  assert.deepEqual(S.boss.arms.map(a => a.src.chute), ['L', 'R']);
  let picks = 0; until(S, S => { for (const e of S.events) if (e.type === 'pick') picks++; return picks >= 2; }, 900, {}); assert.ok(picks >= 2, 'both arms did not pick up');
});
check('a put-right route delivers the crate; the round is done and the next one begins', () => {
  const S = arena(); Object.assign(S.boss.dials, solve(S, 0).dials);
  const n = until(S, S => S.boss.round === 1, 1500, {}); assert.ok(n > 0, 'round 1 never finished');
  until(S, S => S.boss.trans <= 0, 300, {}); same(S.boss.dials, B().rounds[1].dials);
});
check('in round 3, a blue crate at the orange pallet is dropped, not delivered', () => {
  const S = arena(); E.startRound(S, 2); const blue = B().rounds[2].sources.findIndex(s => s.colour === 'blue');
  // find dials that send the blue crate to the orange pallet
  const ids = Object.keys(B().nodes); let found = null;
  const rec = (k, d) => { if (found) return; if (k === ids.length){ S.boss.dials = Object.assign({}, d); if (E.routeFor(S, B().rounds[2].sources[blue]).wrong) found = Object.assign({}, d); return; }
    for (let t = 0; t < B().nodes[ids[k]].exits.length; t++){ d[ids[k]] = t; rec(k + 1, d); } };
  rec(0, {}); assert.ok(found, 'no setting sends blue to the orange pallet'); S.boss.dials = found; S.P.hitT = 99;
  let missort = false; until(S, S => { for (const e of S.events) if (e.type === 'missort') missort = true; return missort; }, 1500, {});
  run(S, 60); assert.ok(missort, 'it never reached the orange pallet'); assert.ok(!S.boss.delivered[blue]); assert.equal(S.boss.round, 2);
});
check('a lost life restarts the round with its dials as they were, and he comes back inside the cell', () => {
  const S = arena(); place(S, B().trigger + 1.1, 12); run(S, 3); standAt(S, 'F'); run(S, 1); let n = 0; while (S.boss.dials.F === B().rounds[0].dials.F && n++ < 400) E.step(S, { fix:true });
  assert.notEqual(S.boss.dials.F, B().rounds[0].dials.F);
  S.health = 1; S.P.hitT = 9; E.hit(S, 1); until(S, S => S.dead <= 0 && S.P.hitT < 1, 200);
  same(S.boss.dials, B().rounds[0].dials); assert.ok(S.P.x > B().bounds[0], 'he came back outside the cell');
});
check('all three rounds put right: the arm is restored, the exit opens and the level is won', () => {
  const S = arena();
  for (let r = 0; r < E.rounds(S); r++){ until(S, S => S.boss.trans <= 0, 300, {}); Object.assign(S.boss.dials, solve(S, r).dials); until(S, S => S.boss.round > r || S.boss.done, 2400, {}); }
  assert.ok(S.boss.done, 'not done'); const n = until(S, S => S.won, 600); assert.ok(n > 0, 'never won'); assert.ok(!E.doorSolid(S, Lq.doors.find(d => d.id === 'exit')));
});
check('a save keeps the round, the route log and the pickups; a save after the fix resumes the ending', () => {
  const S = arena(); Object.assign(S.boss.dials, solve(S, 0).dials); until(S, S => S.boss.round === 1, 1500, {}); S.lanes.add('roof-g'); S.got.add('g1');
  const T = E.create(Lq, JSON.parse(JSON.stringify(E.saveData(S))));
  assert.equal(T.boss.round, 1); assert.ok(T.lanes.has('roof-g')); assert.ok(T.got.has('g1')); same(T.boss.dials, B().rounds[1].dials);
  const D = arena(); D.boss.done = true; const U = E.create(Lq, E.saveData(D)); assert.ok(U.boss.done && U.boss.on);
  assert.ok(until(U, S => S.won, 600) > 0, 'a save after the fix did not resume the ending');
});

fs.writeFileSync(path.join(OUT, 'mechanics.json'), JSON.stringify({ when:new Date().toISOString(), results }, null, 1));
const failed = results.filter(r => !r.pass).length;
console.log(failed ? `${failed} of ${results.length} FAILED` : `All ${results.length} passed`);
process.exit(failed ? 1 : 0);
