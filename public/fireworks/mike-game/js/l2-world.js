// Mike the Mic, Level 2: Below the Wire. The rules of the flooded cell, with no drawing in them, so the same code
// runs in the page and in the Node test suites. Units are tiles (T = 32 logical px) and seconds.
//
// Dry movement is Level 1's own M.stepPlayer, untouched. Level 2 adds: tanks whose water moves between named levels,
// valves that set those levels, swimming with buoyancy, the static charge the live fluid puts on the suit, the
// earthing bells that shed it, travelling
// wires, flushing nozzles, pump intakes, lock doors, and the Threading Fault.
(function(){
'use strict';
const M = window.MIKE, K = M.PHYS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (t, n) => ((t % n) + n) % n;

// The wet numbers are the prototype's (docs/mike-platformer/edm-level-design.md); the tests measure them.
// The owner's direction, 29 Sept: Mike wears a helmet, so he does not run out of air. What runs out is time in the
// live fluid: with his helmet under, static builds on the suit; with it out, in the open or in an earthing bell, the
// strap on the helmet sheds it. A full charge discharges through him.
const W = { swim:3.8, rise:3.0, buoy:0.7, accel:9, limit:20, shed:6, flow:0.8,
  centre:0.55,        // Mike swims once the water is above his middle
  head:0.15,          // and the suit takes on charge once it is over his helmet
  float:1.0,          // left alone he settles with his feet this far under the surface, helmet in the air
  kick:10.8, kickReach:1.4, kickCool:0.5, kickBuffer:0.15,   // a jump press at the surface leaps out of the water
  entry:0.35, entryX:0.6, warn:6 };
const POINTS = { bearing:100, seal:100, coupling:100, lubricant:50, controlUnit:250, sdCard:100, miniMike:500 };
const TYPES = Object.keys(POINTS);
const INVULN = 1.5, WIRE_HALF = 0.09, JET_HALF = 0.4;
const zero = () => Object.fromEntries(TYPES.map(k => [k, 0]));

// ---------- the level ----------
// Water features are written per section with section-local x, exactly like Level 1's terrain.
function load(data){
  // fixtures are solid: hand them to Level 1's loader as solids, then give them back their style
  const plain = Object.assign({}, data, { sections:data.sections.map(s => Object.assign({}, s, { solids:(s.solids || []).concat((s.fixtures || []).map(f => f.slice(0, 4))) })) });
  const L = M.loadLevel(plain);
  L.data = data;
  Object.assign(L, { tanks:[], valves:[], wires:[], nozzles:[], intakes:[], refuges:[], doors:[], fixtures:[], scenery:[], rooms:[] });
  const err = m => L.errors.push(m), ids = new Set();
  const uid = id => { if (!id) err('a water feature has no id'); else if (ids.has(id)) err('duplicate id ' + id); ids.add(id); };
  for (const s of data.sections){
    const ox = s.x, pt = p => [p[0] + ox, p[1]];
    L.rooms.push({ id:s.id, title:s.title, x:ox, width:s.width, salvage:s.salvage, gates:s.gates || [] });
    for (const f of s.fixtures || []){
      const hit = L.solids.find(o => o.kind !== 'shelf' && !o.style && o.x === f[0] + ox && o.y === f[1] && o.w === f[2] && o.h === f[3]);
      if (hit){ hit.kind = 'fixture'; hit.style = f[4] || 'block'; L.fixtures.push(hit); }
    }
    for (const t of s.tanks || []){ uid(t.id);
      if (!(t.start in t.levels)) err(`tank ${t.id} starts at an unknown level`);
      L.tanks.push({ id:t.id, x0:t.at[0] + ox, x1:t.at[1] + ox, floor:t.floor, levels:t.levels, start:t.start, speed:t.speed || W.flow, boss:!!t.boss,
        pockets:(t.pockets || []).map(p => ({ x:p[0] + ox, y:p[1], w:p[2], h:p[3] })) }); }
    for (const v of s.valves || []){ uid(v.id); L.valves.push({ id:v.id, wheels:v.wheels.map(pt), states:v.states, start:v.start || 0, reset:v.reset }); }
    for (const w of s.wires || []){ uid(w.id); L.wires.push(Object.assign({}, w, { from:pt(w.from), to:pt(w.to), span:w.axis === 'h' ? [w.span[0] + ox, w.span[1] + ox] : w.span.slice() })); }
    for (const n of s.nozzles || []){ uid(n.id); L.nozzles.push(Object.assign({ push:0, hurt:true }, n, { at:pt(n.at) })); }
    for (const i of s.intakes || []){ uid(i.id); L.intakes.push(Object.assign({}, i, { at:pt(i.at), zone:[i.zone[0] + ox, i.zone[1], i.zone[2], i.zone[3]] })); }
    for (const r of s.refuges || []) L.refuges.push({ x:r[0] + ox, y:r[1] });
    for (const d of s.doors || []){ uid(d.id); L.doors.push(Object.assign({ w:.9 }, d, { x:d.at[0] + ox, top:d.at[1] })); }
    for (const p of s.scenery || []) L.scenery.push(Object.assign({}, p, { x:p.at[0] + ox, y:p.at[1] }));
    if (s.suit) L.suit = { x:s.suit[0] + ox, y:s.suit[1] };
  }
  const tank = id => L.tanks.find(t => t.id === id);
  for (const v of L.valves) for (const st of v.states) for (const [id, name] of Object.entries(st)){
    if (!tank(id)) err(`valve ${v.id} names an unknown tank ${id}`); else if (!(name in tank(id).levels)) err(`valve ${v.id} names an unknown level ${name}`); }
  // A checkpoint or refuge must stay dry whatever the valves do, and stand on something.
  const highest = t => Math.min(...Object.values(t.levels));
  const standing = p => L.solids.some(s => p.x >= s.x && p.x <= s.x + s.w && Math.abs(s.y - p.y) < 1e-6);
  for (const p of L.refuges.concat(L.checkpoints)){
    if (!standing(p)) err(`refuge ${p.x},${p.y} stands on nothing`);
    for (const t of L.tanks) if (p.x > t.x0 && p.x < t.x1 && p.y <= t.floor && p.y - K.height + W.head > highest(t)) err(`refuge ${p.x},${p.y} can flood`);
  }
  // Salvage: unique ids (the loader checks), the promised number in every room.
  for (const r of L.rooms) if (r.salvage !== undefined){
    const n = L.pickups.filter(p => L.salvageTypes.includes(p.type) && p.x >= r.x && p.x < r.x + r.width).length;
    if (n !== r.salvage) err(`room ${r.id} holds ${n} salvage, not ${r.salvage}`);
  }
  if (!L.suit) err('the level has no service suit');
  if (L.boss){ for (const o of L.boss.orders) for (const pass of o) for (const p of pass) if (!L.boss.points[p]) err('boss order names an unknown point ' + p); }
  return L;
}

// ---------- machines: one pose function each, shared by the drawing, the damage and the tests ----------
// A travelling wire. The guides ride back and forth without a jump in position or speed (a cosine), and the wire
// between them cycles: amber tell, cutting, safe. axis 'v' is an upright wire moving sideways; 'h' lies flat and
// moves up and down.
function wirePose(w, t){
  const f = .5 - .5*Math.cos(2*Math.PI*(t + (w.lag || 0))/w.period);
  const x = w.from[0] + (w.to[0] - w.from[0])*f, y = w.from[1] + (w.to[1] - w.from[1])*f;
  const u = mod(t + (w.phase || 0), w.cycle), tell = u < w.tell, active = !tell && u < w.tell + w.active;
  const state = active ? 'red' : tell ? 'amber' : 'green';
  return w.axis === 'h' ? { axis:'h', x, y, x0:w.span[0], x1:w.span[1], y0:y, y1:y, tell, active, state, u, f }
    : { axis:'v', x, y, x0:x, x1:x, y0:w.span[0], y1:w.span[1], tell, active, state, u, f };
}
// A flushing nozzle: lamp and bubbles, then a narrow stream along dir for `reach` tiles, then it fades.
function nozzlePose(n, t){
  const u = mod(t + (n.phase || 0), n.cycle), tell = u < n.tell, active = !tell && u < n.tell + n.active;
  const grow = active ? Math.min(1, (u - n.tell)/.18) : 0, fade = active ? Math.min(1, (n.tell + n.active - u)/.25) : 0;
  // The same bounded stream drives art, damage and flow. The nozzle mouth is 10px from its anchor.
  const [x, y] = n.at, [dx, dy] = n.dir, start = 10/32, reach = n.reach*grow;
  const sx = x + dx*start, sy = y + dy*start, ex = sx + dx*reach, ey = sy + dy*reach;
  const box = [Math.min(sx, ex) - (dx ? 0 : JET_HALF), Math.min(sy, ey) - (dy ? 0 : JET_HALF), Math.abs(ex - sx) + (dx ? 0 : 2*JET_HALF), Math.abs(ey - sy) + (dy ? 0 : 2*JET_HALF)];
  return { tell, active, state:active ? 'red' : tell ? 'amber' : 'green', u, box, grow, fade, start, reach };
}
// A pump intake: a swirl, then a pull toward the grille inside its own zone only.
function intakePose(i, t){
  const u = mod(t + (i.phase || 0), i.cycle), tell = u < i.tell, active = !tell && u < i.tell + i.active;
  return { tell, active, state:active ? 'red' : tell ? 'amber' : 'green', u };
}

// ---------- state ----------
function newBoss(L, variant){
  return { on:false, done:false, doneT:0, restoreT:0, variant:variant || 0, pass:0, step:0, fix:0, trans:0, t:0, wrongT:0, wrong:null, eligible:false };
}
function create(L, sv, opts){
  opts = opts || {};
  const S = { L, time:0, mt:0, ts:1, tanks:{}, valves:{}, doors:{}, suit:false, static:0, health:3, lives:3, score:0, got:new Set(), inv:zero(),
    bonusStep:0, checkpoint:{ x:L.checkpoints[0].x, y:L.checkpoints[0].y }, lit:new Set([L.checkpoints[0].x]), refuge:null, dead:0, kick:0, kickBuf:0,
    wet:false, headWet:false, surface:null, lookDown:false, prev:{}, events:[], extra:[], moving:[], won:false, livesLost:0, continues:0, playTime:0,
    valveT:0, boss:newBoss(L, opts.variant), bounds:[0, L.W] };
  for (const t of L.tanks) S.tanks[t.id] = { level:t.levels[t.start], target:t.levels[t.start], name:t.start };
  for (const v of L.valves) S.valves[v.id] = v.start;
  if (sv){
    S.checkpoint = sv.cp; S.lit = new Set(sv.lit); S.got = new Set(sv.got); S.suit = !!sv.suit; S.score = sv.score; S.lives = sv.lives;
    S.playTime = sv.time; S.livesLost = sv.lost; S.continues = sv.cont; S.bonusStep = sv.bonusStep || 0;
    for (const p of L.pickups) if (S.got.has(p.id)) S.inv[p.type]++;
    // a valve with a safe state goes back to it, because he starts again from the checkpoint, not from where he turned it
    for (const v of L.valves) if (sv.valves && sv.valves[v.id] !== undefined) setValve(S, v, v.reset !== undefined ? v.reset : sv.valves[v.id], true);
    if (sv.boss && L.boss){ S.boss.variant = sv.boss.variant; S.boss.pass = sv.boss.pass; S.boss.step = passStart(S, sv.boss.pass); S.boss.done = !!sv.boss.done; }
  }
  for (const d of L.doors) S.doors[d.id] = doorWants(S, d) ? 1 : 0;
  S.P = M.newPlayer(S.checkpoint.x, S.checkpoint.y); S.cam = M.newCamera(S.inv.sdCard);
  S.refuge = { x:S.checkpoint.x, y:S.checkpoint.y };
  if (S.boss.done){
    // A final-repair save resumes the restoration, never a frozen checkpoint.
    const seq = sequence(S), p = L.boss.points[seq[seq.length - 1]];
    Object.assign(S.boss, { on:true, step:seq.length, pass:order(S).length - 1, restoreT:0 });
    S.P = M.newPlayer(p[0], p[1]);
    if (L.boss.tank) setTank(S, L.boss.tank, L.boss.drained, true);
  }
  refreshSolids(S, 0);
  return S;
}
function saveData(S){
  return { v:1, level:S.L.data.id, cp:S.checkpoint, lit:[...S.lit], got:[...S.got], suit:S.suit, valves:Object.assign({}, S.valves), score:S.score, lives:S.lives,
    time:S.playTime, lost:S.livesLost, cont:S.continues, bonusStep:S.bonusStep, boss:{ variant:S.boss.variant, pass:S.boss.pass, done:S.boss.done } };
}
function clone(S){
  return Object.assign({}, S, { P:Object.assign({}, S.P), cam:Object.assign({}, S.cam), tanks:JSON.parse(JSON.stringify(S.tanks)), valves:Object.assign({}, S.valves),
    doors:Object.assign({}, S.doors), got:new Set(S.got), lit:new Set(S.lit), inv:Object.assign({}, S.inv), prev:Object.assign({}, S.prev), events:[],
    boss:Object.assign({}, S.boss), checkpoint:Object.assign({}, S.checkpoint), refuge:Object.assign({}, S.refuge), extra:S.extra.slice(), moving:S.moving.slice() });
}
const say = (S, type, more) => S.events.push(Object.assign({ type }, more));

// ---------- water ----------
const tankOf = (L, x, y) => L.tanks.find(t => x > t.x0 && x < t.x1 && y <= t.floor + .01);
// The surface that matters to a body at x with its feet at y. Under a trapped-air pocket the surface is the
// pocket's lower edge. null where there is no tank.
function surfaceAt(S, x, y){
  const t = tankOf(S.L, x, y); if (!t) return null;
  let level = S.tanks[t.id].level;
  for (const p of t.pockets) if (x > p.x && x < p.x + p.w && y > p.y && level < p.y + p.h) level = p.y + p.h;
  return level;
}
function setValve(S, v, state, quiet){
  S.valves[v.id] = state;
  for (const [id, name] of Object.entries(v.states[state])){ const t = S.L.tanks.find(t => t.id === id); S.tanks[id].target = t.levels[name]; S.tanks[id].name = name; if (quiet) S.tanks[id].level = t.levels[name]; }
}
function setTank(S, id, name, quiet){ const t = S.L.tanks.find(t => t.id === id); S.tanks[id].target = t.levels[name]; S.tanks[id].name = name; if (quiet) S.tanks[id].level = t.levels[name]; }

// ---------- doors ----------
// A door is open for a reason that can be seen: the suit is on, a tank is drained below the sill, the fault is fixed.
function doorWants(S, d){
  if (d.opens === 'suit') return S.suit;
  if (d.opens === 'boss') return S.boss.done && S.boss.restoreT >= 2;
  if (d.opens && d.opens.tank){ const t = S.tanks[d.opens.tank]; return t.name === d.opens.level && t.level >= d.opens.below - 1e-6; }
  return false;
}
const doorSolid = (S, d) => S.doors[d.id] < .85;
function refreshSolids(S, dt){
  const P = S.P, extra = [];
  for (const d of S.L.doors){
    const want = doorWants(S, d) ? 1 : 0, was = S.doors[d.id];
    S.doors[d.id] = clamp(was + Math.sign(want - was)*dt*3, 0, 1);
    if (was >= .85 && S.doors[d.id] < .85 && P && P.x + K.halfW > d.x && P.x - K.halfW < d.x + d.w && P.y > d.top && P.y - K.height < d.top + d.h){
      P.x = P.x < d.x + d.w/2 ? d.x - K.halfW - .02 : d.x + d.w + K.halfW + .02; P.vx = 0;      // a closing door sets him down beside it, unhurt
    }
    if (doorSolid(S, d)) extra.push({ x:d.x, y:d.top, w:d.w, h:d.h, kind:'door', id:d.id });
  }
  S.moving = S.L.lifts.map(l => M.liftPose(l, S.mt));
  S.extra = extra.concat(S.moving);
}

// ---------- hits, lives, recovery ----------
function boxHits(P, x0, y0, x1, y1){ return P.x + K.halfW > x0 && P.x - K.halfW < x1 && P.y > y0 && P.y - K.height < y1; }
function hit(S, away, up){
  const P = S.P; if (P.hitT < INVULN || S.dead > 0 || S.boss.done) return false;
  S.health--; P.vx = (S.wet ? 3 : 4)*away; P.vy = up === undefined ? (S.wet ? -1 : -5) : up; P.ground = false; P.lock = .18; P.hitT = 0; P.hitAway = away; S.boss.fix = 0;
  say(S, 'hit');
  if (S.health <= 0) loseLife(S);
  return true;
}
function loseLife(S){
  S.dead = .7; S.lives--; S.livesLost++; if (S.cam.on){ S.cam.on = false; S.cam.cool = 1; }
  say(S, 'lifeLost');
}
function respawn(S){
  if (S.lives <= 0){ S.over = true; say(S, 'gameOver'); return; }     // the page restarts the level or the game (owner, 30 Sept)
  S.P = M.newPlayer(S.checkpoint.x, S.checkpoint.y); S.P.hitT = 0; S.health = 3; S.static = 0; S.cam = M.newCamera(S.inv.sdCard);
  S.refuge = { x:S.checkpoint.x, y:S.checkpoint.y }; S.kick = 0; S.wet = false; S.headWet = false; S.plunge = 0; S.launch = false;
  // a valve that could leave the way on shut behind him goes back to its safe state
  for (const v of S.L.valves) if (v.reset !== undefined && S.valves[v.id] !== v.reset) setValve(S, v, v.reset, true);
  if (S.boss.on && !S.boss.done) startPass(S, S.boss.pass, true);
  say(S, 'respawn');
}
// A full charge discharges through him: one health, and back to the last dry refuge he stood on, earthed.
function discharge(S){
  S.health--; S.static = 0; say(S, 'discharge', { x:S.P.x, y:S.P.y });
  if (S.health <= 0){ loseLife(S); return; }
  S.P = M.newPlayer(S.refuge.x, S.refuge.y); S.P.hitT = 0; S.wet = false; S.headWet = false; S.boss.fix = 0;
}

// ---------- swimming ----------
function swim(S, inp, dt, level, flow, kickNow){
  const P = S.P, locked = P.lock > 0;
  if (locked) P.lock = Math.max(0, P.lock - dt);
  const dx = locked ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = locked ? 0 : (inp.dive ? 1 : 0) - (inp.jump ? 1 : 0);
  const floatY = level + W.float;
  if (dx) P.facing = dx;
  if (P.vy >= 0) S.launch = false;
  // left alone he drifts up to where he floats; above that line he settles back down to it
  let tvy = dy ? dy*W.rise : P.y > floatY + .02 ? -W.buoy : P.y < floatY - .02 ? W.rise : 0;
  // Grip the fixture while working; holding Fix need not also mean holding Dive against buoyancy.
  const job = inp.fix && S.boss.on && !S.boss.done && S.boss.trans <= 0 ? bossTarget(S) : null;
  // a plunge: he sinks until the water has stopped him, then bobs back up to float; any swimming input takes over
  if (dy || dx || P.y <= floatY && S.plunge === 2) S.plunge = 0;
  if (S.plunge === 1){ tvy = 0; if (P.vy < .3) S.plunge = 2; }
  if (S.plunge === 2) tvy = -W.rise;
  if (job && !inp.left && !inp.right && !inp.jump && Math.abs(P.vx) < .6 && P.hitT >= .25 && atPoint(S, [job.x, job.y])) { tvy = 0; S.plunge = 0; }
  P.vx += clamp(dx*W.swim + flow.x - P.vx, -W.accel*dt, W.accel*dt);
  P.vy += clamp(tvy + flow.y - P.vy, -W.accel*dt, W.accel*dt);
  let kicked = false;
  if (kickNow && !locked && S.kick <= 0 && P.y <= level + W.kickReach){ P.vy = -W.kick; P.rising = true; S.launch = true; S.kick = W.kickCool; S.kickBuf = 0; kicked = true; say(S, 'kick'); }
  const mx = P.vx*dt; let my = P.vy*dt; const oldY = P.y;
  // swimming up stops where he floats, and settling stops there too; only a kick takes him out
  if (!S.launch && my < 0 && P.y + my < floatY){ my = Math.min(0, floatY - P.y); if (my === 0) P.vy = 0; }
  if (!S.launch && !S.plunge && !dy && my > 0 && P.y <= floatY && P.y + my > floatY){ my = floatY - P.y; P.vy = 0; }
  P.x += mx;
  for (const s of M.overlaps(S.L, P.x - K.halfW, P.y - K.height, P.x + K.halfW, P.y, S.extra)){
    if (s.kind === 'shelf' || s.kind === 'lift') continue;
    if (mx > 0) P.x = s.x - K.halfW - 1e-4; else if (mx < 0) P.x = s.x + s.w + K.halfW + 1e-4;
    P.vx = 0;
  }
  if (P.x < S.bounds[0] + K.halfW){ P.x = S.bounds[0] + K.halfW; P.vx = Math.max(0, P.vx); }
  if (P.x > S.bounds[1] - K.halfW){ P.x = S.bounds[1] - K.halfW; P.vx = Math.min(0, P.vx); }
  P.y += my; P.ground = false; P.support = null;
  for (const s of M.overlaps(S.L, P.x - K.halfW, P.y - K.height, P.x + K.halfW, P.y, S.extra)){
    // gratings are one-way landings, as on dry land; a held Dive swims down through them
    if ((s.kind === 'shelf' || s.kind === 'lift') && (my <= 0 || oldY > s.y + .05 || dy > 0)) continue;
    if (my > 0){ P.y = s.y; P.vy = 0; P.ground = true; P.support = s; }
    else if (my < 0){ P.y = s.y + s.h + K.height; P.vy = 0; P.rising = false; S.launch = false; }
  }
  P.coyote = 0; P.buffer = 0; P.beltV = 0; P.airTime = 0;
  P.landT += dt; P.hitT += dt; P.stepCount++; P.dist += Math.abs(mx);
  return kicked;
}
// What the machines do to the water around him: nozzles push along their stream, intakes pull toward the grille.
function flowAt(S, mt){
  const P = S.P, f = { x:0, y:0 }, cx = P.x, cy = P.y - K.height/2;
  for (const n of S.L.nozzles){ if (!n.push || !live(S, n)) continue;
    const p = nozzlePose(n, clock(S, n, mt)); if (p.active && boxHits(P, p.box[0], p.box[1], p.box[0] + p.box[2], p.box[1] + p.box[3])){ f.x += n.dir[0]*n.push; f.y += n.dir[1]*n.push; } }
  for (const i of S.L.intakes){ if (!live(S, i)) continue;
    const p = intakePose(i, clock(S, i, mt)), [zx, zy, zw, zh] = i.zone;
    if (p.active && cx > zx && cx < zx + zw && cy > zy && cy < zy + zh){
      const ax = i.at[0] - cx, ay = i.at[1] - cy, d = Math.hypot(ax, ay) || 1; f.x += ax/d*i.pull; f.y += ay/d*i.pull; S.pulled = true; }
  }
  return f;
}
// The fault's own machines run on the fault's clock, which restarts with each pass; they are parked otherwise.
const live = (S, h) => !h.boss || (S.boss.on && !S.boss.done && S.boss.trans <= 0 && S.boss.t >= (S.L.boss.warmup || 0) && (!h.passes || h.passes.includes(S.boss.pass)));
const clock = (S, h, mt) => h.boss ? Math.max(0, S.boss.t - (S.L.boss.warmup || 0))*(S.L.boss.hazardRate || 1) : mt;

function damage(S){
  const P = S.P;
  if (S.dead > 0 || P.hitT < INVULN || S.boss.done) return;
  for (const w of S.L.wires){ if (!live(S, w)) continue;
    const p = wirePose(w, clock(S, w, S.mt)); if (!p.active) continue;
    if (p.axis === 'v' ? boxHits(P, p.x - WIRE_HALF, p.y0, p.x + WIRE_HALF, p.y1) : boxHits(P, p.x0, p.y - WIRE_HALF, p.x1, p.y + WIRE_HALF)){
      hit(S, p.axis === 'v' ? (P.x < p.x ? -1 : 1) : (P.facing > 0 ? -1 : 1), p.axis === 'h' ? (P.y - K.height/2 < p.y ? -3 : 3) : undefined); return; }
  }
  for (const n of S.L.nozzles){ if (!n.hurt || !live(S, n)) continue;
    const p = nozzlePose(n, clock(S, n, S.mt));
    if (p.active && boxHits(P, p.box[0], p.box[1], p.box[0] + p.box[2], p.box[1] + p.box[3])){ hit(S, n.dir[0] || (P.x < n.at[0] ? -1 : 1), n.dir[1] ? n.dir[1]*3 : undefined); return; }
  }
}

// ---------- the Threading Fault ----------
// Three jobs (flush, tension, align), done in passes of three, in one of three learnable orders. Each pass begins
// with the sump flooded to that pass's level; finishing the flush job drains it for the rest of the pass. A lost
// life restarts the pass. The camera slows the machines and the moving water and nothing of Mike's: his repair takes
// 2.2 seconds of his own time whether he is filming or not, exactly as in Level 1 (owner, 29 Sept).
const order = S => S.L.boss.orders[S.boss.variant % S.L.boss.orders.length];
const sequence = S => order(S).flat();
const passStart = (S, pass) => order(S).slice(0, pass).reduce((n, p) => n + p.length, 0);
function startPass(S, pass, quiet){
  const B = S.boss, def = S.L.boss;
  B.pass = pass; B.step = passStart(S, pass); B.fix = 0; B.t = 0; B.trans = 0; B.wrongT = 0;
  if (def.tank) setTank(S, def.tank, def.passLevels[pass % def.passLevels.length], quiet);     // between passes the sump fills as he watches
}
function bossTarget(S){
  const seq = sequence(S), B = S.boss; if (B.step >= seq.length) return null;
  const name = seq[B.step], p = S.L.boss.points[name];
  return { name, x:p[0], y:p[1] };
}
function atPoint(S, p){ const P = S.P; return Math.abs(P.x - p[0]) <= .8 && Math.abs(P.y - p[1]) < (S.wet ? .7 : .15) && (P.ground || S.wet); }
function stepBoss(S, inp, dt, dtm){
  const B = S.boss, def = S.L.boss, P = S.P; B.eligible = false;
  if (!def) return;
  if (B.done){
    B.doneT += dt;
    const drained = !def.tank || Math.abs(S.tanks[def.tank].level - S.tanks[def.tank].target) < .001;
    if (drained) B.restoreT += dt;
    const exit = S.L.doors.find(d => d.opens === 'boss');
    if (B.restoreT > 3.4 && (!exit || S.doors[exit.id] >= .99) && !S.won){ S.won = true; say(S, 'win'); }
    return;
  }
  if (!B.on){ if (S.dead <= 0 && P.x >= def.trigger){ B.on = true; startPass(S, B.pass, true); say(S, 'bossStart'); } return; }
  if (B.trans > 0){ B.trans -= dt; if (B.trans <= 0){ B.trans = 0; startPass(S, B.pass, false); } return; }
  B.t += dtm;
  B.wrongT = Math.max(0, B.wrongT - dt);
  const tg = bossTarget(S);
  B.eligible = !!tg && S.dead <= 0 && atPoint(S, [tg.x, tg.y]);
  if (!B.eligible && inp.fix && !B.wrongT){
    const at = Object.entries(def.points).find(([, p]) => atPoint(S, p));
    if (at){ B.wrongT = .6; B.wrong = at[0]; say(S, 'refuse'); }
  }
  const fixing = B.eligible && inp.fix && !inp.left && !inp.right && !inp.jump && Math.abs(P.vx) < (S.wet ? .6 : .05) && P.hitT >= .25;
  if (!fixing){ B.fix = 0; return; }
  const before = Math.floor(B.fix*6);
  B.fix += dt/def.hold;                                     // his own time, as in Level 1: the camera slows machines, never Mike
  if (Math.floor(B.fix*6) > before) say(S, 'repairTick');
  if (B.fix < 1) return;
  B.fix = 0; B.step++; say(S, 'repair', { point:tg.name, x:tg.x, y:tg.y });
  if (tg.name === def.drains && def.tank) setTank(S, def.tank, def.drained);
  const seq = sequence(S);
  if (B.step >= seq.length){
    B.done = true; B.doneT = 0; B.restoreT = 0; S.static = 0; S.score += 1000; if (S.cam.on){ S.cam.on = false; }
    if (def.tank) setTank(S, def.tank, def.drained);
    say(S, 'bossDone');
  } else if (B.step === passStart(S, B.pass + 1)){ B.pass++; B.trans = 1.6; say(S, 'passDone', { pass:B.pass }); }
}

// ---------- pickups ----------
const salvageCount = S => S.L.salvageTypes.reduce((n, k) => n + (S.inv[k] || 0), 0);
function collect(S, p){
  S.got.add(p.id); S.score += POINTS[p.type]; S.inv[p.type]++;
  if (p.type === 'lubricant') S.health = Math.min(3, S.health + 1);
  else if (p.type === 'miniMike') S.lives = Math.min(9, S.lives + 1);
  else if (p.type === 'sdCard'){ S.cam.cap = M.cameraCapacity(S.inv.sdCard); S.cam.left = Math.min(S.cam.cap, S.cam.left + M.CAMERA.perCard); }
  say(S, 'collect', { p });
  if (S.L.salvageTypes.includes(p.type)){
    const n = salvageCount(S), step = Math.floor(n/10);
    if (step > S.bonusStep){ S.bonusStep = step; const bonus = 250*step; S.score += bonus; say(S, 'milestone', { n, bonus }); }
    if (n === S.L.salvageTotal){ S.score += 1000; say(S, 'fullCollection'); }
  }
}

// ---------- one fixed step ----------
// inp = { left, right, jump, dive, lookDown, camera, fix }
function step(S, inp, dt){
  dt = dt || K.step; S.events = [];
  if (S.won || S.over) return S;
  const L = S.L, B = S.boss, edge = k => !!inp[k] && !S.prev[k];
  const jumpEdge = edge('jump'), fixEdge = edge('fix');
  const wasOn = S.cam.on;
  S.cam.boss = B.on && !B.done;                             // in the boss the camera shoots in clips, exactly as in Level 1 (world.js)
  S.ts = M.stepCamera(S.cam, edge('camera') && !B.done, dt);
  if (S.cam.on !== wasOn) say(S, S.cam.on ? 'camOn' : 'camOff');
  const dtm = dt*S.ts;
  S.time += dt; if (!B.done) S.playTime += dt;
  S.lookDown = !!inp.lookDown; S.kick = Math.max(0, S.kick - dt); S.valveT = Math.max(0, S.valveT - dt);
  // water moves toward its target at the tank's own speed, on the machines' clock
  for (const t of L.tanks){ const w = S.tanks[t.id], d = w.target - w.level; if (d){ w.level += clamp(d, -t.speed*dtm, t.speed*dtm); } }
  // a lift carries whoever stands on it
  const P0 = S.P;
  if (P0.ground && P0.support && P0.support.kind === 'lift' && S.dead <= 0){
    const lift = L.lifts.find(l => l.id === P0.support.id), a = M.liftPose(lift, S.mt), b = M.liftPose(lift, S.mt + dtm);
    P0.x += b.x - a.x; P0.y += b.y - a.y;
  }
  S.mt += dtm;
  refreshSolids(S, dt);
  if (S.dead > 0){ S.dead -= dt; if (S.dead <= 0) respawn(S); S.prev = Object.assign({}, inp); return S; }
  const P = S.P;
  // the suit, and the valves
  if (!S.suit && L.suit && Math.abs(P.x - L.suit.x) < 1 && Math.abs(P.y - L.suit.y) < 1.2){ S.suit = true; say(S, 'suit'); }
  if (fixEdge && !B.on) for (const v of L.valves){
    const wheel = v.wheels.find(w => Math.abs(P.x - w[0]) < 1.3 && Math.abs(P.y - K.height/2 - w[1]) < 1.5);
    if (wheel){ setValve(S, v, 1 - S.valves[v.id]); S.valveT = .6; say(S, 'valve', { id:v.id, state:S.valves[v.id], x:wheel[0], y:wheel[1] }); break; }
  }
  // movement: wet or dry
  const level = surfaceAt(S, P.x, P.y), wasWet = S.wet, air0 = P.airTime, jumped0 = P.jumpedAt;
  const wet = level !== null && S.suit && P.y - W.centre > level;
  if (jumpEdge) S.kickBuf = W.kickBuffer; else S.kickBuf = Math.max(0, S.kickBuf - dt);
  S.pulled = false;
  const drive = B.done ? {} : inp;
  if (wet){
    if (!wasWet){ say(S, 'splash', { x:P.x, y:level, v:P.vy }); P.vy = Math.min(P.vy*W.entry, 5); P.vx *= W.entryX; P.rising = false; S.launch = false; S.plunge = P.vy > 2.5 ? 1 : 0; }
    S.wet = true;
    swim(S, drive, dt, level, flowAt(S, S.mt), S.kickBuf > 0 && !B.done);
  } else {
    if (wasWet) say(S, 'surface', { x:P.x, y:level === null ? P.y : level });
    S.wet = false;
    M.stepPlayer(L, P, { left:drive.left, right:drive.right, jump:drive.jump, jumpEdge:jumpEdge && !B.done }, dt, S.bounds, S.extra, b => b.dir*b.speed);
    if (P.jumpedAt !== jumped0) say(S, 'jump');
    if (P.landT === 0 && air0 > .2) say(S, 'land');
  }
  S.surface = surfaceAt(S, P.x, P.y);
  // static: it builds on real time, whatever the camera is doing, and sheds at the suit's earthing rate
  S.headWet = S.suit && S.surface !== null && P.y - K.height + W.head > S.surface;
  const s0 = S.static;
  S.static = B.done ? 0 : clamp(S.static + (S.headWet ? dt : -W.shed*dt), 0, W.limit);
  if (S.headWet && s0 < W.limit - W.warn && S.static >= W.limit - W.warn) say(S, 'staticHigh');
  if (!S.headWet && s0 > 0 && S.static <= 0) say(S, 'earthed');
  damage(S);
  if (S.dead <= 0 && S.static >= W.limit) discharge(S);
  if (S.dead <= 0 && S.P.y > L.H + 2) loseLife(S);
  if (S.dead <= 0){
    const Q = S.P;
    for (const p of L.pickups){
      if (S.got.has(p.id)) continue;
      if (Math.abs(p.x - Q.x) < K.halfW + .45 && p.y + .45 > Q.y - K.height && p.y - .45 < Q.y) collect(S, p);
    }
    if (Q.ground && !S.headWet){
      for (const c of L.checkpoints) if (!S.lit.has(c.x) && Math.abs(Q.x - c.x) < .6 && Math.abs(Q.y - c.y) < .1){
        S.lit.add(c.x); S.checkpoint = { x:c.x, y:c.y }; S.health = 3; S.cam.left = S.cam.cap; say(S, 'checkpoint', { x:c.x, y:c.y }); }
      for (const r of L.refuges.concat(L.checkpoints)) if (Math.abs(Q.x - r.x) < 1.5 && Math.abs(Q.y - r.y) < .1) S.refuge = { x:r.x, y:r.y };
    }
  }
  stepBoss(S, inp, dt, dtm);
  S.prev = Object.assign({}, inp);
  return S;
}

function snapshot(S){
  const P = S.P;
  return { x:P.x, y:P.y, vx:P.vx, vy:P.vy, ground:P.ground, suit:S.suit, static:S.static, left:W.limit - S.static, health:S.health, lives:S.lives, wet:S.wet, headWet:S.headWet, surface:S.surface,
    tanks:JSON.parse(JSON.stringify(S.tanks)), valves:Object.assign({}, S.valves), got:S.got.size, salvage:salvageCount(S), score:S.score, mt:S.mt, time:S.time,
    cameraOn:S.cam.on, checkpoint:S.checkpoint, refuge:S.refuge, dead:S.dead, won:S.won, boss:Object.assign({}, S.boss) };
}

M.L2 = { W, POINTS, INVULN, WIRE_HALF, load, create, clone, step, snapshot, saveData, wirePose, nozzlePose, intakePose, surfaceAt, tankOf, doorSolid, doorWants,
  salvageCount, sequence, order, bossTarget, passStart, startPass, setValve, setTank, live, clock, hit, respawn };
})();
