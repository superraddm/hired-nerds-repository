// Level 3, Cobot Mania: whole runs of the slice with every machine live, played by the planning player in
// tools/mike-l3-lib.cjs (ordinary inputs only, no invulnerability, no teleport). Two routes to the Teach Cell, then the
// Teach Cell itself under fire in all three puzzle sets, without and with SD cards.
//   node tools/test-mike-l3-run.cjs            everything
//   node tools/test-mike-l3-run.cjs floor      one route (floor | mezzanine | boss)
// Writes docs/mike-platformer/l3-look/run.json. The times are the planner's, which waits for machines; they are
// completion proofs, not human difficulty measurements.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { M, E, K, levelData, lib, exec, play, step, steer, go, ride, hook, attempt, delayed } = require('./mike-l3-lib.cjs');
const OUT = path.resolve(__dirname, '../docs/mike-platformer/l3-look');
const L = E.load(levelData()), B = L.boss, X = B.bounds[0], only = process.argv[2];
const results = {};
const secs = S => +S.time.toFixed(1);
// RECORD=1 keeps each run's inputs, run-length coded as Level 2's demo is, with Mike's position every second as a check,
// in docs/mike-platformer/promo/_working/runs/l3-<name>.json; tools/capture-mike-promo.cjs replays them in the page.
const RECORD = process.env.RECORD ? path.resolve(__dirname, '../docs/mike-platformer/promo/_working/runs') : null, KEYS = ['left', 'right', 'jump', 'lookDown', 'camera', 'fix'];
function recorder(S){
  if (!RECORD) return () => {};
  const frames = [], trace = [];
  lib.onStep = (inp, T) => { if (frames.length % 60 === 0) trace.push([T.P.x, T.P.y]); frames.push(KEYS.reduce((b, k, j) => b | (inp[k] ? 1 << j : 0), 0)); };
  return (name, start) => {
    lib.onStep = null; const runs = [];
    for (const f of frames){ const r = runs[runs.length - 1]; if (r && r[0] === f) r[1]++; else runs.push([f, 1]); }
    fs.mkdirSync(RECORD, { recursive:true });
    fs.writeFileSync(path.join(RECORD, `l3-${name}.json`), JSON.stringify({ level:'level-3', start, keys:KEYS, frames:frames.length, end:[S.P.x, S.P.y], trace, runs }));
  };
}

// ---------- routes to the door ----------
const ROUTES = {
  // The whole level to the Teach Cell's door: the floor through the first three sections (jumping the cobots that
  // would send him elsewhere), the tower's cobot up to the roof, the roof's arms and rover, the Loop, the weld alley,
  // the wrap station's cobots past the tall rovers, down into the sorter and its cobot up to Marshalling.
  full(S){
    go(S, 14.5, 12); go(S, 22, 12); go(S, 30.5, 12); go(S, 38.9, 12); go(S, 42.5, 12); go(S, 47.8, 12); go(S, 53.6, 12); go(S, 54, 12);
    go(S, 59.6, 12); go(S, 64.8, 12); go(S, 72.2, 12); go(S, 80.5, 12); go(S, 86.4, 12);
    ride(S, 'cF3'); go(S, 111, 12);
    ride(S, 'cT2');
    go(S, 131, -12); go(S, 133, -12); go(S, 139.5, -12); go(S, 146.5, -12); go(S, 153.5, -12); go(S, 167.5, -12);
    ride(S, 'cG5');
    go(S, 188, -4, { anywhere:true }); go(S, 191, 4, { anywhere:true });
    go(S, 198.8, 4); go(S, 206.5, 4); go(S, 212.5, 4); go(S, 220.5, 4); go(S, 227.5, 4); go(S, 234, 4); go(S, 242.5, 4); go(S, 250.5, 4); go(S, 255, 4);
    go(S, 266, 4); go(S, 268.5, 12, { anywhere:true });
    ride(S, 'cW3'); ride(S, 'cW4');
    go(S, 319.5, 12); go(S, 322.5, 20, { anywhere:true }); go(S, 333, 20);
    ride(S, 'cS2'); go(S, 349, 12);
  }
};
function route(name){
  const S = E.create(L); const t0 = Date.now(), done = recorder(S);
  ROUTES[name](S); done(name, 0);
  assert.ok(S.P.x >= B.bounds[0] - 4 && S.P.y === 12, 'did not reach Marshalling');
  results[name] = { seconds:secs(S), lanes:[...S.lanes], salvage:E.salvageCount(S), health:S.health, livesLost:S.livesLost, planner:(Date.now() - t0)/1000 };
  assert.equal(S.livesLost, 0, 'lost a life');
  console.log(`  ok   ${name} route: at the Teach Cell's door after ${secs(S)} s, lanes ${[...S.lanes].join(' ') || '-'}, ${E.salvageCount(S)} salvage, health ${S.health}`);
  return S;
}

// ---------- the Teach Cell under fire ----------
// The fewest dial turns that put a round right, by trying every setting (worked out here, never stored in the level).
function solve(S, r){
  const ids = Object.keys(B.nodes), start = B.rounds[r].dials, need = B.rounds[r].sources, T = E.clone(S); T.boss.round = r; let best = null;
  const rec = (k, d, cost) => { if (best && cost >= best.cost) return;
    if (k === ids.length){ T.boss.dials = d; if (need.every(c => E.routeFor(T, c).ok)) best = { cost, dials:Object.assign({}, d) }; return; }
    const id = ids[k], n = B.nodes[id].exits.length;
    for (let t = 0; t < n; t++){ d[id] = t; rec(k + 1, d, cost + (t - start[id] + n) % n); } };
  rec(0, {}, 0); return best;
}
// What hurts him if he stands here doing this: the first hit, over the next 8 seconds.
function why(S, policy){
  const c = E.clone(S);
  for (let i = 0; i < 480; i++){ E.step(c, policy(c, i)); if (c.health < S.health || c.dead > 0){
    const P = c.P, near = [];
    for (const k of E.crates(c)) if (k.active && Math.abs(k.x - P.x) < 1.2) near.push(`crate at ${k.x.toFixed(1)}`);
    for (const a of c.boss.arms) if (a.st === 'sweep' && Math.abs(a.x - P.x) < 1.5) near.push(`sweep at y ${a.y}`);
    for (const a of L.arms) if (E.live(c, a)){ const p = E.armPose(a, E.clock(c, a, c.mt)); if (p.active && Math.hypot(p.tip[0] - P.x, p.tip[1] - P.y + 1) < 2) near.push('arm ' + a.id); }
    for (const r of L.rovers) if (E.live(c, r)){ const p = E.roverPose(r, E.clock(c, r, c.mt)); if (Math.abs(p.x - P.x) < 1.5 && Math.abs(r.y - P.y) < 3) near.push('rover ' + r.id); }
    return `hit after ${(i/60).toFixed(2)} s by ${near.join(', ') || 'something unseen'}`; } }
  return 'nothing hits him standing here';
}
// Down to the floor: a top ledge drops onto its side deck, a side deck is left by its outer edge (its inner edge drops
// onto the middle grating), and the grating by whichever end is nearer.
function toFloor(S){
  for (let n = 0; n < 4 && S.P.y < 11.9; n++){
    const P = S.P, left = P.x < X + 12;
    if (Math.abs(P.y - 4.4) < .1) go(S, left ? X + 5.6 : X + 18.4, 8, { anywhere:true });
    else if (Math.abs(P.y - 8) < .1) go(S, left ? X + 2.4 : X + 21.6, 12, { anywhere:true });
    else go(S, left ? X + 8.4 : X + 15.6, 12, { anywhere:true });
  }
}
// To a standing spot anywhere in the cell, the way a person would: floor, the middle grating, a side deck (a jump from
// the grating), a top ledge (the carrier from its side deck).
function toSpot(S, x, y){
  const P = S.P, left = x < X + 12;
  if (Math.abs(P.y - y) < .1 && (y > 11.9 || y === 9.4 || ((P.x < X + 12) === left))){ go(S, x, y, { tol:.5 }); return; }
  if (y > 11.9){ toFloor(S); go(S, x, y, { tol:.5 }); return; }
  if (y === 9.4){ if (S.P.y < 9.3) toFloor(S); go(S, x, y, { tol:.5 }); return; }
  if (!(Math.abs(S.P.y - 8) < .1 && (S.P.x < X + 12) === left)){
    if (S.P.y < 7.9) toFloor(S);
    if (Math.abs(S.P.y - 9.4) > .1) go(S, left ? X + 10.2 : X + 13.8, 9.4);
    go(S, left ? X + 6 : X + 18, 8);
  }
  if (y === 8){ go(S, x, y, { tol:.5 }); return; }
  ride(S, left ? 'cBL' : 'cBR'); go(S, x, y, { tol:.5 });
}
// Re-teach one dial, one turn: stand at it and hold Fix; wait clear of its crate if the drop is coming.
function turn(S, id){
  const n = B.nodes[id], d0 = S.boss.dials[id];
  toSpot(S, n.stand[0], n.stand[1]);
  let seq = null;
  for (let tries = 0; tries < 10 && !seq; tries++){
    for (const film of [false, true]){
      seq = delayed(S, () => ({}), (c, f) => Object.assign({ fix:true }, film && f === 0 ? { camera:true } : {}), c => c.boss.dials[id] !== d0, { maxDelay:150, every:6, max:200, settle:30, rest:() => ({}) });
      if (seq){ results.boss.filmed += film ? 1 : 0; break; }
    }
    if (!seq){ const aside = n.stand[0] + (n.stand[0] < X + 12 ? 1.2 : -1.2); go(S, aside, n.stand[1], { tol:.3 }); step(S, 30 + tries*13, c => steer(c.P, aside)); go(S, n.stand[0], n.stand[1], { tol:.5 }); }
  }
  if (!seq) throw Error(`could not re-teach ${id} in round ${S.boss.round + 1}: ${why(S, () => ({ fix:true }))}`);
  play(S, seq); step(S, 2, {});
}
function boss(variant, cards){
  const S = E.create(L, null, { variant });
  S.P = M.newPlayer(X - 3, 12); S.checkpoint = { x:X - 3, y:12 };
  if (cards) for (const p of L.pickups) if (p.type === 'sdCard'){ S.got.add(p.id); S.inv.sdCard++; }
  S.cam = M.newCamera(S.inv.sdCard);
  const done = recorder(S);                                    // the page's ?room=boss start: the door checkpoint, both SD cards
  go(S, X + 2.6, 12); step(S, 2, {});
  assert.ok(S.boss.on, 'the Teach Cell did not wake');
  const t0 = S.time; let turns = 0;
  for (let r = 0; r < E.rounds(S); r++){
    while (S.boss.trans > 0) exec(S, {});
    const sol = solve(S, r), order = [];
    // fix the dials in the order the route meets them, so the break moves forward
    for (const c of B.rounds[r].sources){ const T = E.clone(S); T.boss.dials = sol.dials; for (const id of E.routeFor(T, c).path) if (B.nodes[id] && !order.includes(id)) order.push(id); }
    for (const id of order){ const nn = B.nodes[id].exits.length; let k = (sol.dials[id] - S.boss.dials[id] + nn) % nn; while (k-- > 0){ turn(S, id); turns++; } }
    // then wait for the deliveries, out of the sweeps' way: no level is clear of all three, so he moves between the
    // middle grating and the floor under it whenever standing still would get him hit within the next three seconds
    toSpot(S, X + 12, 9.4);
    let w = 0; while (S.boss.round === r && !S.boss.done && w < 60*40){
      const c = E.clone(S), x = S.P.x; let hurt = false; for (let i = 0; i < 180 && !hurt && c.boss.round === r; i++){ E.step(c, steer(c.P, x)); hurt = c.health < S.health; }
      if (hurt){ if (Math.abs(S.P.y - 9.4) < .1) toSpot(S, X + 12, 12); else toSpot(S, X + 12, 9.4); results.boss.moves = (results.boss.moves || 0) + 1; }
      for (let i = 0; i < 20; i++) exec(S, steer(S.P, S.P.x)); w += 20;
    }
    if (S.boss.round === r && !S.boss.done) throw Error('the deliveries never came in round ' + (r + 1));
    if (S.livesLost) throw Error('lost a life in round ' + (r + 1));
  }
  while (!S.won && S.time - t0 < 400) exec(S, {});
  assert.ok(S.won, 'not won'); done(cards ? 'boss' : 'boss-nocards', 'boss');
  return { variant, cards:!!cards, seconds:+(S.time - t0).toFixed(1), turns, health:S.health, livesLost:S.livesLost };
}

console.log('Level 3 runs, every machine live');
let failed = 0;
for (const name of Object.keys(ROUTES)) if (!only || only === name){ try { route(name); } catch (e){ failed++; console.log(`  FAIL ${name}: ${e.message}`); } }
if (!only || only === 'boss'){
  results.boss = { filmed:0, runs:[] };
  for (const cards of [false, true]) for (let v = 0; v < 1; v++){
    if (process.env.VARIANT !== undefined && +process.env.VARIANT !== v) continue; if (process.env.CARDS !== undefined && (process.env.CARDS === '1') !== cards) continue;
    try { const r = boss(v, cards); results.boss.runs.push(r); console.log(`  ok   Teach Cell, ${cards ? 'with' : 'without'} SD cards: won in ${r.seconds} s, ${r.turns} dial turns, health ${r.health}, lives lost ${r.livesLost}`); }
    catch (e){ failed++; console.log(`  FAIL Teach Cell, ${cards ? 'with' : 'without'} SD cards: ${e.message}`); }
  }
  console.log(`       re-teaches that needed a filmed clip: ${results.boss.filmed}`);
}
fs.writeFileSync(path.join(OUT, only ? `run-${only}.json` : 'run.json'), JSON.stringify({ when:new Date().toISOString(), results }, null, 1));
console.log(failed ? `${failed} FAILED` : 'All runs passed');
process.exit(failed ? 1 : 0);
