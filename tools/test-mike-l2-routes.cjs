// Level 2 geometry, proved with the real physics and the machines switched off:
//   1. the level loads clean: 56 salvage with unique ids, the promised number in every room;
//   2. every grating, fixture top and deck can be reached from its room's entry, in some valve state;
//   3. NO DEAD ENDS (owner, 27 Sept): from anywhere Mike can get to, on land or in water, in any valve state,
//      the room's exit can still be reached. Valves count: turning a wheel is a move like any other;
//   4. every pickup can be reached;
//   5. static: nowhere under the fluid is further from open air or an earthing bell than the suit can swim there
//      and back before its charge is full.
// Machines are timing problems, not geometry, and are left to tools/test-mike-l2-run.cjs.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, K, levelData } = require('./mike-l2-lib.cjs');
const data = levelData();
const full = E.load(data);
assert.equal(full.errors.length, 0, [...full.errors].join('; '));
assert.equal(full.salvageTotal, 56);
const quiet = JSON.parse(JSON.stringify(data)); for (const s of quiet.sections){ delete s.wires; delete s.nozzles; delete s.intakes; }
const L = E.load(quiet);
const W = E.W, STEP = 1/60, CELL = .25;
const ONLY = process.env.ROOM;

// ---------- a settled world for one combination of valve states ----------
function world(states){
  const S = E.create(L); S.suit = true;
  for (const v of L.valves) E.setValve(S, v, states[v.id] || 0, true);
  for (const t of L.tanks) if (t.boss) E.setTank(S, t.id, states[t.id] || t.start, true);
  for (let i = 0; i < 40; i++){ S.P = M.newPlayer(3, 12); E.step(S, {}); }
  const doors = L.doors.filter(d => E.doorSolid(S, d)).map(d => ({ x:d.x, y:d.top, w:d.w, h:d.h, kind:'door' }));
  return { S, doors, states };
}
const surface = (Wd, x, y) => E.surfaceAt(Wd.S, x, y);
const wetAt = (Wd, x, y) => { const s = surface(Wd, x, y); return s !== null && y - W.centre > s; };
const blocked = (Wd, x, y) => M.overlaps(L, x - K.halfW, y - K.height, x + K.halfW, y, Wd.doors).some(s => s.kind !== 'shelf');

// ---------- standing places ----------
// The top of every solid, cut where something stands on it or there is no headroom.
function nodes(Wd, room){
  const out = [], x0 = room.x, x1 = room.x + room.width;
  for (const s of L.solids){
    if (s.x + s.w <= x0 - .01 || s.x >= x1 + .01) continue;
    let a = null;
    for (let x = Math.max(s.x, x0 - 4) + K.halfW; x <= Math.min(s.x + s.w, x1 + 4) - K.halfW + 1e-6; x += .125){
      const free = !blocked(Wd, x, s.y - .01) && !wetAt(Wd, x, s.y);
      if (free && a === null) a = x; if (!free && a !== null){ if (x - .125 - a >= .25) out.push({ s, y:s.y, x0:a, x1:x - .125 }); a = null; }
    }
    if (a !== null) out.push({ s, y:s.y, x0:a, x1:Math.min(s.x + s.w, x1 + 4) - K.halfW });
  }
  return out.filter(n => n.y > -9.9);
}
const on = (P, n) => P.ground && P.support === n.s && P.x >= n.x0 - .4 && P.x <= n.x1 + .4;
const stepDry = (Wd, P, inp) => M.stepPlayer(L, P, inp, STEP, [0, L.W], Wd.doors, () => 0);
function jump(Wd, from, to){
  const cf = (from.x0 + from.x1)/2, ct = (to.x0 + to.x1)/2, dir = Math.sign(ct - cf) || 1;
  const gap = Math.max(to.x0 - from.x1, from.x0 - to.x1);
  if (from.y - to.y > 3.01 || gap > 7.2) return false;
  const targets = [...new Set([ct, to.x0 + .2, to.x1 - .2])], starts = new Set([cf, from.x0 + .1, from.x1 - .1, Math.max(from.x0, Math.min(from.x1, ct - dir*4)), Math.max(from.x0, Math.min(from.x1, ct))]);
  for (let x = from.x0; x <= from.x1; x += 1) starts.add(x);
  for (const target of targets) for (const leap of [true, false]){
    if (!leap && to.y < from.y) continue;
    for (const sx of starts) for (const initial of [0, dir*7]){
      const P = M.newPlayer(sx, from.y); P.vx = initial; P.support = from.s;
      for (let i = 0; i < 130; i++){
        const dist = target - P.x, brake = P.vx*P.vx/36 + .1;
        let drive = Math.abs(dist) > .12 ? Math.sign(dist) : 0;
        if (Math.sign(P.vx) === Math.sign(dist) && Math.abs(dist) < brake && Math.abs(P.vx) > .35) drive = -Math.sign(P.vx);
        stepDry(Wd, P, { left:drive < 0, right:drive > 0, jump:leap && i < 50, jumpEdge:leap && i === 0 });
        if (wetAt(Wd, P.x, P.y)) break;
        if (i > 3 && P.ground){ if (on(P, to)) return true; if (leap || !on(P, from)) break; }
        if (P.y > L.H + 1) break;
      }
    }
  }
  return false;
}

// ---------- water ----------
// Cells are positions of Mike's feet where his box is clear and the water is over his middle.
function water(Wd, room){
  const x0 = room.x - 4, x1 = room.x + room.width + 4, y0 = -10, y1 = L.H, nx = Math.round((x1 - x0)/CELL), ny = Math.round((y1 - y0)/CELL);
  const id = new Int32Array(nx*ny).fill(-1), open = new Uint8Array(nx*ny), px = i => x0 + (i % nx)*CELL, py = i => y0 + Math.floor(i/nx)*CELL;
  for (let i = 0; i < nx*ny; i++){ const x = px(i), y = py(i); open[i] = wetAt(Wd, x, y) && !blocked(Wd, x, y) ? 1 : 0; }
  // the float line: where he settles, which may fall between cells
  let regions = 0;
  for (let i = 0; i < nx*ny; i++) if (open[i] && id[i] < 0){
    const q = [i]; id[i] = regions;
    while (q.length){ const c = q.pop(), cx = c % nx, cy = Math.floor(c/nx);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const ax = cx + dx, ay = cy + dy; if (ax < 0 || ay < 0 || ax >= nx || ay >= ny) continue; const a = ay*nx + ax; if (open[a] && id[a] < 0){ id[a] = regions; q.push(a); } } }
    regions++;
  }
  const at = (x, y) => { const cx = Math.round((x - x0)/CELL), cy = Math.round((y - y0)/CELL); if (cx < 0 || cy < 0 || cx >= nx || cy >= ny) return -1; return id[cy*nx + cx]; };
  // nearest region to a point that a settling swimmer would be in
  const near = (x, y) => { for (const [dx, dy] of [[0, 0], [0, .25], [0, -.25], [.25, 0], [-.25, 0], [0, .5], [.25, .25], [-.25, .25], [0, .75], [0, 1]]){ const r = at(x + dx, y + dy); if (r >= 0) return r; } return -1; };
  return { id, open, nx, ny, x0, y0, regions, at, near, px, py };
}
// Leave the water onto a standing place: float beside or beneath it, press jump, steer. Simulated with the rules.
function leap(Wd, Wt, region, n){
  const tries = [];
  for (const off of [.5, 1, 1.5, 2.2]){ tries.push([n.x0 - off, 1]); tries.push([n.x1 + off, -1]); }
  if (n.s.kind === 'shelf') for (let x = n.x0; x <= n.x1; x += .5) tries.push([x, 0]);
  for (const [x, dir] of tries){
    const lv = surface(Wd, x, n.y + 1.2); if (lv === null) continue;
    const fy = lv + W.float; if (blocked(Wd, x, fy) || Wt.near(x, fy) !== region || !wetAt(Wd, x, fy)) continue;
    for (const hold of [40, 12]){
      const S = E.clone(Wd.S); S.P = M.newPlayer(x, fy); S.P.ground = false; S.P.hitT = 9; S.wet = true; S.prev = {}; S.kick = 0; S.launch = false; S.plunge = 0;
      const target = dir ? (dir > 0 ? n.x0 + .5 : n.x1 - .5) : x;
      for (let i = 0; i < 100; i++){
        const d = target - S.P.x; E.step(S, { jump:i >= 1 && i < hold, left:i > 1 && d < -.1, right:i > 1 && d > .1 });
        if (i > 4 && S.P.ground && !S.wet && on(S.P, n)) return true;
        if (i > 12 && S.wet) break;
      }
    }
  }
  return false;
}
// Walk off each end of a standing place and see where he comes to rest: in water, or on something lower.
function dropFrom(Wd, Wt, all, n){
  const found = [];
  for (const dir of [-1, 1]) for (const run of [true, false]){
    const P = M.newPlayer(dir < 0 ? n.x0 + .05 : n.x1 - .05, n.y); P.support = n.s; if (run) P.vx = dir*7;
    for (let i = 0; i < 200; i++){
      stepDry(Wd, P, { left:dir < 0 && (run || i < 25), right:dir > 0 && (run || i < 25) });
      if (wetAt(Wd, P.x, P.y)){ const r = Wt.near(P.x, P.y); if (r >= 0) found.push({ water:r }); break; }
      if (i > 2 && P.ground && !on(P, n)){ const m = all.find(a => a !== n && on(P, a)); if (m){ found.push({ node:m }); break; } if (P.support !== n.s) break; }   // still on the lip of the same deck: keep walking
      if (P.y > L.H + 1) break;
    }
  }
  return found;
}

// ---------- one room, all its valve states: a graph of (place, state) ----------
const report = [], deadEnds = [], unreachable = [], lostPickups = [], air = [], gates = [];
for (const room of L.rooms){
  if (ONLY && room.id !== ONLY) continue;
  const inRoom = x => x >= room.x - .01 && x <= room.x + room.width + .01;
  const valves = L.valves.filter(v => v.wheels.some(w => inRoom(w[0])));
  const combos = valves.length ? [0, 1].map(s => ({ [valves[0].id]:s })) : [{}];
  if (L.boss && inRoom(L.boss.bounds[0])){ const t = L.tanks.find(t => t.boss); combos.length = 0; for (const name of Object.keys(t.levels)) combos.push({ [t.id]:name }); }
  const worlds = combos.map(c => { const Wd = world(c); Wd.nodes = nodes(Wd, room); Wd.water = water(Wd, room); return Wd; });
  // graph
  const key = (w, kind, i) => w + ':' + kind + ':' + i, edges = new Map(), add = (a, b) => { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a).add(b); };
  worlds.forEach((Wd, w) => {
    const N = Wd.nodes, Wt = Wd.water;
    N.forEach((a, i) => {
      N.forEach((b, j) => { if (i !== j && jump(Wd, a, b)) add(key(w, 'n', i), key(w, 'n', j)); });
      for (const d of dropFrom(Wd, Wt, N, a)) add(key(w, 'n', i), d.node ? key(w, 'n', N.indexOf(d.node)) : key(w, 'w', d.water));
    });
    for (let r = 0; r < Wt.regions; r++) N.forEach((n, j) => {
      const lv = surface(Wd, (n.x0 + n.x1)/2, n.y + 1.2), lvL = surface(Wd, n.x0 - 1, n.y + 1.2), lvR = surface(Wd, n.x1 + 1, n.y + 1.2);
      const best = Math.min(...[lv, lvL, lvR].filter(v => v !== null)); if (!isFinite(best) || n.y < best - 1.5 || n.y > best + .6) return;
      if (leap(Wd, Wt, r, n)) add(key(w, 'w', r), key(w, 'n', j));
    });
  });
  // wheels: a turn of the valve moves him to the same place in the other state
  if (valves.length) worlds.forEach((Wd, w) => {
    const other = 1 - w, Wo = worlds[other];
    const land = (x, y) => {                      // where a man at (x, y) ends up once the other state has settled
      if (wetAt(Wo, x, y) && !blocked(Wo, x, y)){ const r = Wo.water.near(x, y); if (r >= 0) return key(other, 'w', r); }
      const lv = surface(Wo, x, y);
      if (lv !== null && lv + W.float < y){ const r = Wo.water.near(x, lv + W.float); if (r >= 0) return key(other, 'w', r); }   // the water rose over him: he floats
      let best = null; for (const n of Wo.nodes) if (x >= n.x0 - .3 && x <= n.x1 + .3 && n.y >= y - .05 && (!best || n.y < best.y)) best = n;
      if (best && lv !== null && wetAt(Wo, x, best.y)){ const r = Wo.water.near(x, Math.min(best.y, lv + W.float)); if (r >= 0) return key(other, 'w', r); }
      return best ? key(other, 'n', Wo.nodes.indexOf(best)) : null;
    };
    for (const v of valves) for (const wh of v.wheels){
      Wd.nodes.forEach((n, i) => { for (let x = n.x0; x <= n.x1; x += .25) if (Math.abs(x - wh[0]) < 1.25 && Math.abs(n.y - K.height/2 - wh[1]) < 1.45){ const t = land(x, n.y); if (t) add(key(w, 'n', i), t); break; } });
      const Wt = Wd.water;
      for (let c = 0; c < Wt.nx*Wt.ny; c++) if (Wt.id[c] >= 0){ const x = Wt.px(c), y = Wt.py(c); if (Math.abs(x - wh[0]) < 1.25 && Math.abs(y - K.height/2 - wh[1]) < 1.45){ const t = land(x, y); if (t) add(key(w, 'w', Wt.id[c]), t); } }
    }
  });
  // entry and exit: the room's first and last deck
  const entryOf = Wd => Wd.nodes.findIndex(n => n.y === 12 && n.x0 <= room.x + 3 && n.x1 >= room.x + 1);
  const isBoss = L.boss && inRoom(L.boss.bounds[0]);
  const goalX = isBoss ? L.boss.bounds[0] - .5 : room.x + room.width - 2;       // the fault's room is left the way it was entered until the fault is fixed
  const exitOf = Wd => Wd.nodes.findIndex(n => n.y === 12 && n.x0 <= goalX && n.x1 >= goalX - 2);
  const reach = starts => { const seen = new Set(starts), q = [...starts]; while (q.length){ const a = q.pop(); for (const b of edges.get(a) || []) if (!seen.has(b)){ seen.add(b); q.push(b); } } return seen; };
  if (process.env.ROUTE_DEBUG){ worlds.forEach((Wd, w) => Wd.nodes.forEach((n, i) => console.log(key(w, 'n', i), n.s.kind, n.x0.toFixed(2), n.x1.toFixed(2), n.y))); for (const [a, b] of edges) console.log(a, '->', [...b].join(' ')); }
  const startState = 0;
  const from = reach([key(startState, 'n', entryOf(worlds[startState]))]);
  // in the fault's arena every sump level happens by itself, so every level is a starting state
  if (isBoss) worlds.forEach((Wd, w) => { for (const k of reach([key(w, 'n', entryOf(Wd))])) from.add(k); });
  const goals = new Set(worlds.map((Wd, w) => key(w, 'n', exitOf(Wd))));
  const describe = k => { const [w, kind, i] = k.split(':'), Wd = worlds[+w]; if (kind === 'n'){ const n = Wd.nodes[+i]; return { state:combos[+w], at:[+n.x0.toFixed(2), +n.x1.toFixed(2)], y:n.y, kind:n.s.kind }; } return { state:combos[+w], water:+i }; };
  for (const k of from){ const r = reach([k]); if (![...goals].some(g => r.has(g))) deadEnds.push(Object.assign({ room:room.id }, describe(k))); }
  // every standing place inside the room is reachable in some state
  const places = new Map();
  worlds.forEach((Wd, w) => Wd.nodes.forEach((n, i) => { if (!inRoom((n.x0 + n.x1)/2) || (isBoss && n.x0 >= L.boss.bounds[0] + L.boss.bounds[2])) return; const id = n.s.x + ',' + n.s.y + ',' + n.x0.toFixed(1); places.set(id, (places.get(id) || false) || from.has(key(w, 'n', i))); }));
  // a place that is only dry while its tank is drained may be one he can only ever swim to, when it is full: that counts
  const swum = id => { const [sx, sy, x0] = id.split(',').map(Number); return worlds.some((Wd, w) => [.2, .6, 1.2].some(dx => { const r = Wd.water.near(x0 + dx, sy); return r >= 0 && wetAt(Wd, x0 + dx, sy) && from.has(key(w, 'w', r)); })); };
  for (const [id, ok] of places) if (!ok && !swum(id)) unreachable.push({ room:room.id, place:id });
  // the fault's three service points can be reached whatever the sump is doing
  if (isBoss) worlds.forEach((Wd, w) => { for (const [name, p] of Object.entries(L.boss.points)){
    const stand = Wd.nodes.findIndex(n => Math.abs(n.y - p[1]) < .01 && p[0] >= n.x0 - .3 && p[0] <= n.x1 + .3), r = Wd.water.near(p[0], p[1]);
    if (!((stand >= 0 && from.has(key(w, 'n', stand))) || (r >= 0 && from.has(key(w, 'w', r))))) unreachable.push({ room:room.id, servicePoint:name, state:combos[w] }); } });
  // What the water decides (owner, 29 Sept: a wheel must have a point). With the wheel left alone, each gate is
  // either open or shut exactly as the level says: a crossing, a vault, a high cache.
  for (const g of room.gates || []){
    const w = combos.findIndex(c => Object.keys(g.state).every(k => c[k] === g.state[k])), Wd = worlds[w];
    const nodeAt = p => Wd.nodes.findIndex(n => Math.abs(n.y - p[1]) < .01 && p[0] >= n.x0 - .3 && p[0] <= n.x1 + .3);
    const seen = new Set([key(w, 'n', nodeAt(g.from))]), q = [...seen];
    while (q.length){ const a = q.pop(); for (const b of edges.get(a) || []) if (b.startsWith(w + ':') && !seen.has(b)){ seen.add(b); q.push(b); } }
    let got;
    if (g.to) got = seen.has(key(w, 'n', nodeAt(g.to)));
    else { const p = L.pickups.find(p => p.id === g.pickup); got = false;
      Wd.nodes.forEach((n, i) => { if (seen.has(key(w, 'n', i)) && p.x >= n.x0 - .8 && p.x <= n.x1 + .8 && p.y <= n.y + .45 && p.y >= n.y - 3.4) got = true; });
      for (const [dx, dy] of [[0, 0], [0, .5], [0, 1], [.5, .5], [-.5, .5], [0, 1.5], [.5, 1], [-.5, 1]]){ const r = Wd.water.at(p.x + dx, p.y + dy); if (r >= 0 && seen.has(key(w, 'w', r))) got = true; } }
    gates.push({ room:room.id, what:g.what, shouldBeOpen:g.open, isOpen:got, ok:got === g.open });
  }
  // pickups: within touch of a reachable place or of reachable water
  for (const p of L.pickups.filter(p => inRoom(p.x) && p.x < room.x + room.width)){
    let ok = false;
    worlds.forEach((Wd, w) => { if (ok) return;
      Wd.nodes.forEach((n, i) => { if (ok || !from.has(key(w, 'n', i))) return;
        if (p.x >= n.x0 - .8 && p.x <= n.x1 + .8 && p.y <= n.y + .45 && p.y >= n.y - 3.4) ok = true; });      // standing, or a jump from there
      const Wt = Wd.water; for (const [dx, dy] of [[0, 0], [0, .5], [0, 1], [.5, .5], [-.5, .5], [0, 1.5], [.5, 1], [-.5, 1]]){ const r = Wt.at(p.x + dx, p.y + dy); if (r >= 0 && from.has(key(w, 'w', r))) ok = true; }
    });
    if (!ok) lostPickups.push({ room:room.id, id:p.id, at:[p.x, p.y] });
  }
  // static: the longest swim from anywhere under the fluid to somewhere the suit can shed its charge, at the slower swimming speed
  let worst = 0, where = null;
  worlds.forEach((Wd, wi) => { const Wt = Wd.water, n = Wt.nx*Wt.ny, dist = new Float32Array(n).fill(1e9), q = [];
    for (let c = 0; c < n; c++) if (Wt.id[c] >= 0){ const x = Wt.px(c), y = Wt.py(c), s = surface(Wd, x, y); if (y - K.height + W.head <= s){ dist[c] = 0; q.push(c); } }
    for (let h = 0; h < q.length; h++){ const c = q[h], cx = c % Wt.nx, cy = Math.floor(c/Wt.nx);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const ax = cx + dx, ay = cy + dy; if (ax < 0 || ay < 0 || ax >= Wt.nx || ay >= Wt.ny) continue; const a = ay*Wt.nx + ax; if (Wt.id[a] >= 0 && dist[a] > dist[c] + CELL){ dist[a] = dist[c] + CELL; q.push(a); } } }
    for (let c = 0; c < n; c++) if (Wt.id[c] >= 0 && dist[c] < 1e8 && dist[c] > worst){ worst = dist[c]; where = [Wt.px(c), Wt.py(c)]; }
    // water he can get into, that is; a shut vault full of water is nobody's problem
    for (let c = 0; c < n; c++) if (Wt.id[c] >= 0 && dist[c] >= 1e8 && from.has(key(wi, 'w', Wt.id[c]))) air.push({ room:room.id, sealed:[Wt.px(c), Wt.py(c)] });
  });
  const seconds = worst/W.rise; air.push({ room:room.id, furthestFromEarth:+worst.toFixed(2), at:where, seconds:+seconds.toFixed(1), thereAndBack:+(2*seconds).toFixed(1) });
  assert.ok(2*seconds < W.limit - 4, `${room.id}: somewhere is ${seconds.toFixed(1)} s from an earthing point`);
  report.push({ room:room.id, states:combos.length, places:places.size, reachable:[...places].filter(([id, ok]) => ok || swum(id)).length, onFoot:[...places.values()].filter(Boolean).length, waters:worlds.map(w => w.water.regions) });
  console.log(JSON.stringify(report[report.length - 1]));
}
const result = { report, gates, unreachable, lostPickups, deadEnds, earth:air.filter(a => a.furthestFromEarth !== undefined), sealed:air.filter(a => a.sealed).length };
console.log(JSON.stringify({ gates:gates.filter(g => !g.ok), unreachable, lostPickups, deadEnds, earth:result.earth, sealed:result.sealed }, null, 1));
if (!ONLY) fs.writeFileSync(path.resolve(__dirname, '../docs/mike-platformer/l2-look/routes.json'), JSON.stringify(result, null, 2));
assert.equal(unreachable.length, 0, 'every standing place must be reachable');
assert.equal(lostPickups.length, 0, 'every pickup must be reachable');
assert.equal(deadEnds.length, 0, 'no place may trap Mike');
assert.equal(gates.filter(g => !g.ok).length, 0, 'the water level must decide what the level says it decides');
assert.ok(ONLY || gates.length >= 12, 'the gates were checked');
assert.equal(result.sealed, 0, 'no fluid he can reach may be sealed away from an earthing point');
console.log('Level 2 routes passed');
