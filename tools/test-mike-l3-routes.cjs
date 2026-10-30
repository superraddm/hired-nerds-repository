// Level 3, Cobot Mania: every way around the level, with the real physics and the machines switched off.
//   node tools/test-mike-l3-routes.cjs
// A graph of standing surfaces. Edges are found by simulation, never by assumption: walking off every edge; jumps from
// along every surface (standing and running, three holds, three directions); every carrier ride and every point at
// which he could let go of it; every hook he can reach and every point at which he could let go of it.
// Checks, as the owner's standing rules require: every surface can be reached from the start; every surface can reach
// the Teach Cell (no dead ends); every pickup can be collected; inside the Teach Cell every surface, so every key, can
// be reached from the arena floor and left again. Writes docs/mike-platformer/l3-look/routes.json.
const fs = require('fs'), vm = require('vm'), path = require('path');
const base = path.resolve(__dirname, '../public/fireworks/mike-game'), OUT = path.resolve(__dirname, '../docs/mike-platformer/l3-look');
const ctx = { window:{} }; vm.createContext(ctx);
for (const f of ['world.js', 'l3-world.js']) vm.runInContext(fs.readFileSync(path.join(base, 'js', f), 'utf8'), ctx, { filename:f });
const M = ctx.window.MIKE, E = M.L3, K = M.PHYS, FPS = 60;
const data = JSON.parse(fs.readFileSync(path.join(base, 'level-3.json'), 'utf8'));
// machines that hurt are off; carriers, hooks and belts stay, because they are the routes; the boss does not wake
const L = E.load(Object.assign({}, data, { arms:[], rovers:[], drops:[], boss:null }));
const B = data.boss, ARENA = B.bounds[0];

// ---------- surfaces ----------
const surf = [];
// walls and the tops of robot cells are not places to stand
L.solids.forEach((s, i) => { if (s.style === 'wall' || s.style === 'cell') return; surf.push({ id:surf.length, solid:i, x0:s.x, x1:s.x + s.w, y:s.y, style:s.kind === 'shelf' ? 'grating' : s.style }); });
const freeAt = (x, y) => !L.solids.some(s => s.kind !== 'shelf' && x + K.halfW - .02 > s.x && x - K.halfW + .02 < s.x + s.w && y - .02 > s.y && y - K.height + .02 < s.y + s.h);
for (const s of surf){ s.spots = []; for (let x = s.x0 + .4; x <= s.x1 - .4 + 1e-9; x += .5) if (freeAt(x, s.y)) s.spots.push(x); if (!s.spots.length && freeAt((s.x0 + s.x1)/2, s.y)) s.spots.push((s.x0 + s.x1)/2); }
const surfOf = P => { if (!P.support) return null; const i = L.solids.indexOf(P.support); return surf.find(s => s.solid === i) || null; };
const name = s => `${s.style} ${s.x0}–${s.x1} @ ${s.y}`;

// ---------- simulation ----------
const edges = new Map(), pickups = new Set(), blind = [];
const addEdge = (a, b, how) => { if (!b || a === b.id) return; if (!edges.has(a)) edges.set(a, new Map()); if (!edges.get(a).has(b.id)) edges.get(a).set(b.id, how); };
function start(x, y, vx){ const S = E.create(L); S.P = M.newPlayer(x, y); S.P.hitT = 9; S.P.vx = vx || 0; return S; }
// run a policy until he stands somewhere new, hangs from a hook, or time runs out
function fly(S, policy, max){
  let air = false;
  for (let f = 0; f < (max || 5*FPS); f++){
    E.step(S, policy(f) || {});
    for (const id of S.got) pickups.add(id);
    if (S.hang) return { hook:S.hang.id, S };
    if (S.ride) return { ride:S.ride.id, S };          // caught by a cobot: its rides are edges of the surface it hovers over
    if (!S.P.ground) air = true;
    else if (air) return { land:surfOf(S.P), S, f };
    if (S.P.y > L.H + 1) return { lost:true };
  }
  return { timeout:true, S };
}
const hookStates = new Map();                                   // hook id -> list of states at the moment he grabbed it
function explore(s){
  for (const x of s.spots){
    // walk off each edge
    for (const dir of [-1, 1]){
      const edgeX = dir < 0 ? s.x0 : s.x1; if (Math.abs(x - edgeX) > .9) continue;
      const S = start(x, s.y); const r = fly(S, () => ({ left:dir < 0, right:dir > 0 }), 6*FPS);
      if (r.land){ addEdge(s.id, r.land, 'walk'); if (r.land.y - s.y > 9.6) blind.push(`${name(s)} → ${name(r.land)}: ${(r.land.y - s.y).toFixed(1)} tiles`); }
      if (r.hook) (hookStates.get(r.hook) || hookStates.set(r.hook, []).get(r.hook)).push(E.clone(r.S));
    }
    // jumps: standing or running start, three holds, three directions, with or without steering in the air
    for (const vx0 of [0, -K.runMax, K.runMax]) for (const dir of [-1, 0, 1]) for (const hold of [5, 14, 40]) for (const steer of [true, false]){
      if (vx0 && Math.sign(vx0) !== dir) continue; if (!steer && !dir) continue;
      const room = vx0 < 0 ? x - s.x0 : vx0 > 0 ? s.x1 - x : 9; if (vx0 && room < 1) continue;       // a running start needs somewhere to run from
      const moving = L.hooks.some(h => x > h.rail[0] - 8 && x < h.rail[1] + 8 && Math.abs(h.y + h.len + 1.9 - s.y) < 6);
      for (const delay of moving ? [0, 20, 40, 60, 80] : [0]){  // hooks move: near one, try the same jump at a few moments
        const S = start(x, s.y, vx0); for (let i = 0; i < delay; i++) E.step(S, { left:vx0 < 0, right:vx0 > 0 });
        if (delay && (!S.P.ground || surfOf(S.P) !== s)) break;
        const r = fly(S, f => ({ jump:f < hold, left:dir < 0 && (steer || f < 10), right:dir > 0 && (steer || f < 10) }));
        if (r.land) addEdge(s.id, r.land, 'jump');
        if (r.hook) (hookStates.get(r.hook) || hookStates.set(r.hook, []).get(r.hook)).push(E.clone(r.S));
      }
    }
  }
  // Rides from this surface: a cobot whose gripper hovers over it takes him to each of its destinations in turn.
  // Each ride is played through the real rules, so pickups along the way count.
  for (const c of L.carriers) if (Math.abs(c.home[1] - s.y) < 1e-6 && c.home[0] > s.x0 && c.home[0] < s.x1) c.drops.forEach((d, i) => {
    const S = start(c.home[0], c.home[1]); S.car[c.id].n = i;
    for (let f = 0; f < 12*FPS && !(S.car[c.id].st === 'drop' && !S.ride); f++){ E.step(S, {}); for (const id of S.got) pickups.add(id); }
    E.step(S, {}); const drop = S.P.ground ? surfOf(S.P) : null; addEdge(s.id, drop, 'ride ' + c.id);
    if (!drop) console.log('  ! ' + c.id + ' did not set him down on a surface at destination ' + (i + 1));
  });
}
const t0 = Date.now();
surf.forEach(explore);
// hooks: from every grab found, let go at every moment along the rail
const hookEdges = new Map();
for (const [id, list] of hookStates){
  const h = L.hooks.find(h => h.id === id), outs = new Set();
  for (const S0 of list.slice(0, 6)){
    for (let k = 0; k < Math.ceil(h.period/.15); k++){
      const U = E.clone(S0); for (let i = 0; i < k*.15*FPS; i++){ E.step(U, {}); for (const g of U.got) pickups.add(g); } if (!U.hang) continue;
      for (const [inp, steer] of [[{ jump:true }, -1], [{ jump:true }, 0], [{ jump:true }, 1], [{ lookDown:true }, 0]]){
        const V = E.clone(U); E.step(V, Object.assign({ left:steer < 0, right:steer > 0 }, inp));
        const r = fly(V, f => ({ jump:!!inp.jump && f < 30, left:steer < 0, right:steer > 0 }));
        if (r.land) outs.add(r.land.id);
        if (r.hook && r.hook !== id) outs.add('hook:' + r.hook);
        if (r.hook && r.hook !== id && !hookStates.has(r.hook)) hookStates.set(r.hook, [E.clone(r.S)]);
      }
    }
  }
  hookEdges.set(id, outs);
}
// Hooks reached only from other hooks were added to hookStates during the loop above; a second pass covers them.
for (const [id, list] of hookStates) if (!hookEdges.has(id)){
  const h = L.hooks.find(h => h.id === id), outs = new Set();
  for (const S0 of list) for (let k = 0; k < Math.ceil(h.period/.15); k++){ const U = E.clone(S0); for (let i = 0; i < k*.15*FPS; i++) E.step(U, {}); if (!U.hang) continue;
    for (const steer of [-1, 0, 1]){ const V = E.clone(U); E.step(V, { jump:true, left:steer < 0, right:steer > 0 }); const r = fly(V, f => ({ jump:f < 30, left:steer < 0, right:steer > 0 })); if (r.land) outs.add(r.land.id); } }
  hookEdges.set(id, outs);
}
// which surfaces grab which hook: a light pass of full-height jumps from every spot, noting where each grab began
const origin = new Map();
for (const s of surf) for (const x of s.spots) for (const vx0 of [0, -K.runMax, K.runMax]) for (const dir of [-1, 0, 1]) for (const delay of L.hooks.some(h => x > h.rail[0] - 8 && x < h.rail[1] + 8) ? [0, 20, 40, 60, 80] : []){
  if (vx0 && Math.sign(vx0) !== dir) continue;
  const S = start(x, s.y, vx0); for (let i = 0; i < delay; i++) E.step(S, { left:vx0 < 0, right:vx0 > 0 }); if (delay && (!S.P.ground || surfOf(S.P) !== s)) break;
  const r = fly(S, f => ({ jump:f < 40, left:dir < 0, right:dir > 0 }), 3*FPS);
  if (r.hook){ if (!origin.has(r.hook)) origin.set(r.hook, new Set()); origin.get(r.hook).add(s.id); }
}

// ---------- the graph ----------
const nodes = surf.map(s => s.id).concat(L.hooks.map(h => 'hook:' + h.id));
const out = n => { const o = new Set(); if (typeof n === 'number'){ for (const k of (edges.get(n) || new Map()).keys()) o.add(k); for (const [h, from] of origin) if (from.has(n)) o.add('hook:' + h); }
  else for (const k of hookEdges.get(n.slice(5)) || []) o.add(k); return o; };
const reach = from => { const seen = new Set([from]), q = [from]; while (q.length){ const n = q.shift(); for (const m of out(n)) if (!seen.has(m)){ seen.add(m); q.push(m); } } return seen; };
const spawn = surf.find(s => s.x0 <= L.spawn.x && s.x1 >= L.spawn.x && Math.abs(s.y - L.spawn.y) < 1e-6);
const arenaFloor = surf.find(s => s.x0 <= ARENA + 2 && s.x1 >= ARENA + 2 && s.y === 12);
const fromStart = reach(spawn.id);
const inArena = s => s.x0 >= ARENA - .01 || (s === arenaFloor);
const outside = surf.filter(s => s.x1 <= ARENA + .5 && s !== arenaFloor), arena = surf.filter(s => s.x0 >= ARENA - .01);
const problems = [];
for (const s of outside.concat(arenaFloor)) if (!fromStart.has(s.id)) problems.push('cannot be reached from the start: ' + name(s));
for (const s of outside) if (fromStart.has(s.id) && !reach(s.id).has(arenaFloor.id)) problems.push('dead end, no way on to the Teach Cell: ' + name(s));
for (const h of L.hooks) if (!fromStart.has('hook:' + h.id)) problems.push('hook ' + h.id + ' cannot be reached');
const fromArena = reach(arenaFloor.id);
for (const s of arena) if (!fromArena.has(s.id)) problems.push('Teach Cell: cannot be reached from its floor: ' + name(s));
for (const s of arena) if (!reach(s.id).has(arenaFloor.id)) problems.push('Teach Cell: no way back down from ' + name(s));
for (const [id, n] of Object.entries(B.nodes)) if (!arena.concat(arenaFloor).some(s => fromArena.has(s.id) && Math.abs(s.y - n.stand[1]) < 1e-6 && n.stand[0] > s.x0 && n.stand[0] < s.x1)) problems.push('Teach Cell: the dial at waypoint ' + id + ' cannot be reached');
const missing = L.pickups.filter(p => !pickups.has(p.id)).map(p => p.id);
for (const id of missing) problems.push('pickup ' + id + ' was never collected by any simulated move');

const result = { when:new Date().toISOString(), seconds:(Date.now() - t0)/1000, surfaces:surf.length, reached:[...fromStart].filter(n => typeof n === 'number').length,
  hooks:L.hooks.map(h => ({ id:h.id, from:[...(origin.get(h.id) || [])].map(i => name(surf[i])), to:[...(hookEdges.get(h.id) || [])].map(n => typeof n === 'number' ? name(surf[n]) : n) })),
  pickups:{ total:L.pickups.length, collected:L.pickups.length - missing.length, missing }, blindDrops:blind, problems };
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(result, null, 1));
console.log(`Level 3 routes: ${surf.length} surfaces, ${result.reached} reached from the start, ${L.hooks.length} hooks, ${result.pickups.collected} of ${result.pickups.total} pickups collected, ${result.seconds.toFixed(1)} s`);
if (blind.length) console.log('  Walk-offs longer than the view shows (not required routes, listed for review):\n    ' + [...new Set(blind)].join('\n    '));
if (problems.length){ console.log('  PROBLEMS\n    ' + problems.join('\n    ')); process.exit(1); }
console.log('  Pass: everything reachable, no dead ends, every dial reachable in the Teach Cell, every pickup collectable.');
