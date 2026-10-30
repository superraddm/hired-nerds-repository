// Mike the Mic, Level 3: Cobot Mania. The rules of the cobot hall, with no drawing in them, so the same code runs in
// the page and in the Node test suites. Units are tiles (T = 32 logical px) and seconds.
//
// Dry movement is Level 1's own M.stepPlayer, untouched. Level 3 adds: carriers (mint-banded cobots whose gripper
// hovers over the walkway: touch it and he is picked up, like it or not, and set down at the next of its destinations), overhead hooks he can hang from, hazard arms (yellow and black) whose tools hurt while
// their light is red, floor rovers, crate drops, belts on any layer, and the Teach Cell, where the Big Arm carries
// crates along a route of waypoints and drops them wherever the route is broken, until he re-teaches the waypoints.
//
// The owner's rule for this level: a mint-banded machine never hurts, and nothing hurts Mike while one holds him.
(function(){
'use strict';
const M = window.MIKE, K = M.PHYS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (t, n) => ((t % n) + n) % n;
const ease = v => .5 - .5*Math.cos(Math.PI*clamp(v, 0, 1));

const POINTS = { bearing:100, seal:100, coupling:100, lubricant:50, controlUnit:250, sdCard:100, miniMike:500 };
const TYPES = Object.keys(POINTS);
const INVULN = 1.5;
// Carriers (owner, 1 Oct): the gripper hovers at waist height over the walkway, swaying. Whoever touches it is picked
// up, no choice, and carried to the next destination on its list (it cycles through them, one per grab, so he could end
// up anywhere, on any layer). The only way past is to jump over the gripper. Grip and release times, the gripper's
// reach, how long it rests at home after a ride, where his feet hang below it. Hooks: where his hands meet the handle.
const R = { sweep:.62, grip:.3, drop:.3, backK:.7, rest:.5, reach:.6, waist:.9, hands:1.9, grabX:.55, grabY:.5, hookHop:8, hookCool:.35,
  tool:.55, crateG:26, crate:.9, smash:.35, roverW:.8, roverLow:.9, roverTall:3.2 }             // a tall rover is higher than his jump (3);
const zero = () => Object.fromEntries(TYPES.map(k => [k, 0]));

// ---------- the level ----------
// level-3.json is written in world coordinates by tools/build-mike-level3.cjs. The level has five layers, so it does not
// use Level 1's loader (which expects one floor at y 12); it builds the same collision world stepPlayer reads.
function load(data){
  const L = { data, W:data.size[0], H:data.size[1], top:data.top || -24, solids:[], belts:[], pickups:[], lifts:[], errors:[],
    carriers:[], hooks:[], arms:[], rovers:[], drops:[], doors:[], scenery:data.scenery || [], rooms:data.rooms || [], lanes:data.lanes || [] };
  const err = m => L.errors.push(m), ids = new Set();
  const uid = id => { if (!id) err('a feature has no id'); else if (ids.has(id)) err('duplicate id ' + id); ids.add(id); };
  for (const s of data.solids) L.solids.push({ x:s[0], y:s[1], w:s[2], h:s[3], kind:'deck', style:s[4] || 'deck' });
  for (const s of data.platforms || []) L.solids.push({ x:s[0], y:s[1], w:s[2], h:s[3], kind:'shelf' });
  for (const b of data.belts || []){ uid(b.id); L.belts.push({ id:b.id, x0:b.at[0], x1:b.at[1], y:b.y, dir:b.dir, speed:b.speed, reverse:b.reverse }); }
  for (const c of data.carriers || []){ uid(c.id); L.carriers.push(Object.assign({ top:2.5, sway:.5, period:3.2, phase:0 }, c)); }
  for (const h of data.hooks || []){ uid(h.id); L.hooks.push(Object.assign({ dwell:.6, phase:0, len:2.2 }, h)); }
  for (const a of data.arms || []){ uid(a.id); L.arms.push(Object.assign({ phase:0, tool:'welder' }, a)); }
  for (const r of data.rovers || []){ uid(r.id); L.rovers.push(Object.assign({ phase:0, pause:.8, tall:false }, r)); }
  for (const d of data.drops || []){ uid(d.id); L.drops.push(Object.assign({ phase:0 }, d)); }
  for (const d of data.doors || []){ uid(d.id); L.doors.push(Object.assign({ w:.9 }, d, { x:d.at[0], top:d.at[1] })); }
  for (const p of data.pickups || []){
    uid(p.id); if (!TYPES.includes(p.type)){ err('unknown pickup ' + p.type); continue; }
    L.pickups.push({ id:p.id, type:p.type, x:p.at[0], y:p.at[1], hidden:!!p.hidden });
  }
  L.salvageTypes = data.collection.types; L.salvageTotal = L.pickups.filter(p => L.salvageTypes.includes(p.type)).length;
  if (L.salvageTotal !== data.collection.total) err(`salvage total is ${L.salvageTotal}, not ${data.collection.total}`);
  L.spawn = { x:data.spawn[0], y:data.spawn[1] };
  L.checkpoints = data.checkpoints.map(c => ({ x:c[0], y:c[1] }));
  L.boss = data.boss || null;
  // broadphase, as in Level 1
  L.cols = Array.from({ length:L.W + 1 }, () => []);
  L.solids.forEach((s, i) => { for (let x = Math.max(0, Math.floor(s.x)); x <= Math.min(L.W, Math.ceil(s.x + s.w)); x++) L.cols[x].push(i); });
  // Where each crate lands, and where each drop pad and checkpoint stands.
  L.surfaceBelow = (x, y) => { let best = null; for (const s of L.solids) if (x > s.x && x < s.x + s.w && s.y >= y - 1e-6 && (best === null || s.y < best)) best = s.y; return best; };
  const standing = (x, y) => L.solids.some(s => x >= s.x && x <= s.x + s.w && Math.abs(s.y - y) < 1e-6);
  for (const d of L.drops){ d.floor = L.surfaceBelow(d.x, d.top + R.crate); if (d.floor === null) err(`crate drop ${d.id} lands on nothing`); }
  for (const c of L.checkpoints) if (!standing(c.x, c.y)) err(`checkpoint ${c.x},${c.y} stands on nothing`);
  for (const c of L.carriers){
    if (!standing(c.home[0], c.home[1])) err(`carrier ${c.id}'s gripper hovers over nothing`);
    c.drops.forEach((d, i) => { if (!standing(d[0], d[1])) err(`carrier ${c.id}'s destination ${i + 1} stands on nothing`);
      // a destination inside another carrier's reach would pass him straight on: not allowed
      for (const o of L.carriers) if (o !== c && Math.abs(d[0] - o.home[0]) < o.sway + R.reach + K.halfW + .3 && Math.abs(d[1] - o.home[1]) < 1.2) err(`carrier ${c.id} sets him down in ${o.id}'s reach`); });
    c.travels = c.drops.map(d => c.travel || clamp(Math.hypot(d[0] - c.home[0], d[1] - c.home[1])/6, 1.4, 3.2));
    // links long enough to reach every point of every ride, with a little bend to spare
    let far = 0;
    for (const d of c.drops) for (let i = 0; i <= 40; i++){ const p = carryPath(c, i/40, c.home, d); far = Math.max(far, Math.hypot(p[0] - c.base[0], p[1] - R.waist - c.base[1])); }
    for (const sx of [-1, 1]) far = Math.max(far, Math.hypot(c.home[0] + sx*c.sway - c.base[0], c.home[1] - R.waist - c.base[1]));
    c.link = far/2 + .3;
  }
  for (const a of L.arms) a.link = a.r*.62;
  for (const p of L.pickups) if (p.x < 0 || p.x > L.W) err('pickup ' + p.id + ' is outside the level');
  if (L.boss){
    const B = L.boss, known = id => B.chutes[id] || B.nodes[id] || B.pallets[id];
    for (const [id, n] of Object.entries(B.nodes)){
      if (!standing(n.stand[0], n.stand[1])) err(`waypoint ${id} stands on nothing`);
      for (const e of n.exits) if (!known(e)) err(`waypoint ${id} points to an unknown ${e}`);
    }
    B.rounds.forEach((r, i) => { for (const id of Object.keys(B.nodes)) if (r.dials[id] === undefined || r.dials[id] >= B.nodes[id].exits.length) err(`round ${i + 1} sets waypoint ${id} badly`); });
  }
  return L;
}

// ---------- rides and machines: one pose function each, shared by the drawing, the damage and the tests ----------
// A carrier's ride, for his feet: up from where it caught him, over, and down onto the destination, one smooth curve.
function carryPath(c, s, from, to){
  const i = c.tops ? c.drops.findIndex(d => d[0] === to[0] && d[1] === to[1]) : -1, top = i >= 0 ? c.tops[i] : c.top;   // a lift height per destination, if given
  const [x0, y0] = from, [x3, y3] = to, peak = Math.min(y0, y3) - top, t1 = (peak - (y0 + y3)/8)/.75;
  const u = 1 - s, b0 = u*u*u, b1 = 3*u*u*s, b2 = 3*u*s*s, b3 = s*s*s;
  return [b0*x0 + b1*x0 + b2*x3 + b3*x3, b0*y0 + b1*t1 + b2*t1 + b3*y3];
}
// Where the hovering gripper is now (for his feet: it grips at the waist), swaying over the walkway on machine time.
const homeAt = (c, mt) => [c.home[0] + c.sway*Math.sin(2*Math.PI*(mt + c.phase)/c.period), c.home[1]];
// The carrier as it is now: where the gripper is, how open, what it is doing, and where it will send him next.
function carrierPose(S, c){
  const st = S.car[c.id], next = c.drops[st.n % c.drops.length];
  let feet, open = 1;
  if (st.st === 'ready' || st.st === 'rest') feet = homeAt(c, S.mt);
  else if (st.st === 'grip'){ feet = st.from; open = 1 - clamp(st.t/R.grip, 0, 1); }
  else if (st.st === 'carry'){ feet = carryPath(c, ease(st.t/st.trav), st.from, st.to); open = 0; }
  else if (st.st === 'drop'){ feet = st.to; open = clamp(st.t/R.drop, 0, 1); }
  else feet = carryPath(c, ease(st.t/(st.trav*R.backK)), st.to, homeAt(c, S.mt));
  return { st:st.st, rider:!!(S.ride && S.ride.id === c.id), open, feet, tip:[feet[0], feet[1] - R.waist], next, nextIndex:st.n % c.drops.length };
}
// A hook on its rail: out, pause, back, pause, on a cosine so it never jumps.
function hookPose(h, t){
  const u = mod((t + h.phase)/h.period, 1), d = h.dwell/h.period;
  let f;
  if (u < d) f = 0; else if (u < .5) f = ease((u - d)/(.5 - d)); else if (u < .5 + d) f = 1; else f = 1 - ease((u - .5 - d)/(.5 - d));
  const x = h.rail[0] + (h.rail[1] - h.rail[0])*f;
  return { x, y:h.y, hx:x, hy:h.y + h.len, f };
}
// A hazard arm's tool: parked, amber tell, strike sweep and hold (red), slow cold return (green).
function armPose(a, t){
  const u = mod(t + a.phase, a.cycle), sweep = Math.min(.45, a.active*.5), back = Math.min(1.2, a.cycle - a.tell - a.active);
  let k = 0, state = 'green';
  if (u < a.tell){ state = 'amber'; }
  else if (u < a.tell + a.active){ state = 'red'; k = ease((u - a.tell)/sweep); }
  else k = 1 - ease((u - a.tell - a.active)/back);
  const ang = (a.a0 + (a.a1 - a.a0)*k)*Math.PI/180;
  return { state, active:state === 'red', tell:state === 'amber', k, ang, tip:[a.base[0] + Math.cos(ang)*a.r, a.base[1] + Math.sin(ang)*a.r], u };
}
// A floor rover shuttles between its ends and pauses at each, its beacon showing the way it will go next.
function roverPose(r, t){
  const leg = (r.span[1] - r.span[0])/r.speed, cyc = 2*(leg + r.pause), u = mod(t + r.phase, cyc);
  let x, dir, moving = true;
  if (u < r.pause){ x = r.span[0]; dir = 1; moving = false; }
  else if (u < r.pause + leg){ x = r.span[0] + (u - r.pause)*r.speed; dir = 1; }
  else if (u < 2*r.pause + leg){ x = r.span[1]; dir = -1; moving = false; }
  else { x = r.span[1] - (u - 2*r.pause - leg)*r.speed; dir = -1; }
  const h = r.tall ? R.roverTall : R.roverLow;
  return { x, dir, moving, box:[x - R.roverW, r.y - h, 2*R.roverW, h] };
}
// A crate: held in the feeder with its shadow darkening (tell), falling (hurts), landed and breaking (safe).
function crateAt(x, top, floor, tau, tell){
  if (tau < 0) return null;
  if (tau < tell) return { x, stage:'tell', u:tau/tell, bottom:top + R.crate, floor };
  const fall = Math.sqrt(2*Math.max(0, floor - top - R.crate)/R.crateG), f = tau - tell;
  if (f < fall) return { x, stage:'fall', bottom:top + R.crate + .5*R.crateG*f*f, floor, active:true };
  if (f < fall + R.smash) return { x, stage:'smash', u:(f - fall)/R.smash, bottom:floor, floor };
  return null;
}
function dropPose(d, t){ return crateAt(d.x, d.top, d.floor, mod(t + d.phase, d.cycle), d.tell) || { x:d.x, stage:'idle', bottom:d.top + R.crate, floor:d.floor }; }
// Level 1's reversing belt: one way for (reverse - 0.8) s, a slow stop with pulsing arrows, then the other way.
function beltProfile(b, mt){ if (!b.reverse) return 1; const Rv = b.reverse, u = mod(mt, 2*Rv), w = .8;
  return u < Rv - w ? 1 : u < Rv ? (Rv - u)/w : u < 2*Rv - w ? -1 : -(2*Rv - u)/w; }
const beltWarn = (b, mt) => !!b.reverse && mod(mt, b.reverse) >= b.reverse - .8;

// ---------- the Teach Cell's route ----------
// Waypoints on the back wall, each a dial that points to its next waypoint. A Big Arm takes a crate from its chute and
// goes from waypoint to waypoint, reading each dial as it arrives. Where the route breaks (a dial pointing back the way
// it came, at a waypoint already visited, or at a pallet not in use) it stops, warns, and lets the crate drop. A crate
// that reaches the pallet of its own colour is delivered. Revision 4 (owner, 2 Oct: harder): from round 2 there are two
// chutes and two arms, each with its own route through the same dials.
const nodePos = (def, id) => def.chutes[id] ? def.chutes[id].at : def.pallets[id] ? def.pallets[id].rail : [def.nodes[id].stand[0], def.nodes[id].stand[1] - 1.15];
const sorterAt = () => null;
const palletLive = (S, id) => { const p = S.L.boss.pallets[id]; return !!p && (!p.rounds || p.rounds.includes(S.boss.round)); };
function nextFrom(S, id){ return S.L.boss.nodes[id].exits[S.boss.dials[id]]; }
const sourcesOf = S => S.L.boss.rounds[Math.min(S.boss.round, S.L.boss.rounds.length - 1)].sources;
// The whole route a crate from this source would take now: the waypoints, and how it ends.
function routeFor(S, src){
  const def = S.L.boss, ch = typeof src === 'string' ? { chute:'L', colour:src } : src, path = [ch.chute], seen = new Set([ch.chute]);
  let prev = ch.chute, cur = def.chutes[ch.chute].first;
  for (let n = 0; n < 30; n++){
    path.push(cur);
    if (def.pallets[cur]){ const live = palletLive(S, cur), mine = def.pallets[cur].colour === ch.colour; return { path, end:cur, ok:live && mine, wrong:live && !mine, broken:!live }; }
    seen.add(cur);
    const next = nextFrom(S, cur);
    if (next === prev || seen.has(next) || def.chutes[next] || (def.pallets[next] && !palletLive(S, next))) return { path, end:cur, broken:true, toward:next };
    prev = cur; cur = next;
  }
  return { path, end:cur, broken:true };
}

// ---------- state ----------
function newBoss(variant){
  return { on:false, done:false, doneT:0, restoreT:0, variant:variant || 0, round:0, dials:{}, arms:[], drops:[], delivered:{}, hold:0, fix:0, lock:false, dial:null, t:0, trans:0 };
}
function create(L, sv, opts){
  opts = opts || {};
  const S = { L, time:0, mt:0, ts:1, car:{}, hookCool:{}, ride:null, hang:null, doors:{}, health:3, lives:3, score:0, got:new Set(), inv:zero(), bonusStep:0,
    checkpoint:{ x:L.checkpoints[0].x, y:L.checkpoints[0].y }, lit:new Set([L.checkpoints[0].x + ',' + L.checkpoints[0].y]), dead:0, lookDown:false, prev:{}, events:[],
    extra:[], won:false, livesLost:0, continues:0, playTime:0, lanes:new Set(), boss:newBoss(opts.variant), bounds:[0, L.W] };
  for (const c of L.carriers) S.car[c.id] = { st:'ready', t:0, n:0 };
  if (sv){
    S.checkpoint = sv.cp; S.lit = new Set(sv.lit); S.got = new Set(sv.got); S.score = sv.score; S.lives = sv.lives; S.playTime = sv.time;
    S.livesLost = sv.lost; S.continues = sv.cont; S.bonusStep = sv.bonusStep || 0; S.lanes = new Set(sv.lanes || []);
    for (const p of L.pickups) if (S.got.has(p.id)) S.inv[p.type]++;
    if (sv.boss && L.boss){ S.boss.variant = sv.boss.variant; S.boss.round = sv.boss.round; S.boss.done = !!sv.boss.done; }
  }
  S.P = M.newPlayer(S.checkpoint.x, S.checkpoint.y); S.cam = M.newCamera(S.inv.sdCard);
  if (L.boss) S.boss.dials = Object.assign({}, L.boss.rounds[Math.min(S.boss.round, L.boss.rounds.length - 1)].dials);
  if (S.boss.done){ Object.assign(S.boss, { on:true, round:L.boss.rounds.length, restoreT:0 }); S.P = M.newPlayer(L.boss.trigger + 1, 12); }
  for (const d of L.doors) S.doors[d.id] = doorWants(S, d) ? 1 : 0;
  refreshSolids(S, 0);
  return S;
}
function saveData(S){
  return { v:1, level:S.L.data.id, cp:S.checkpoint, lit:[...S.lit], got:[...S.got], score:S.score, lives:S.lives, time:S.playTime, lost:S.livesLost, cont:S.continues,
    bonusStep:S.bonusStep, lanes:[...S.lanes], boss:{ variant:S.boss.variant, round:S.boss.round, done:S.boss.done } };
}
function clone(S){
  return Object.assign({}, S, { P:Object.assign({}, S.P), cam:Object.assign({}, S.cam), car:JSON.parse(JSON.stringify(S.car)), hookCool:Object.assign({}, S.hookCool),
    ride:S.ride && Object.assign({}, S.ride), hang:S.hang && Object.assign({}, S.hang), doors:Object.assign({}, S.doors), got:new Set(S.got), lit:new Set(S.lit),
    lanes:new Set(S.lanes), inv:Object.assign({}, S.inv), prev:Object.assign({}, S.prev), events:[], extra:S.extra.slice(),
    boss:Object.assign({}, S.boss, { dials:Object.assign({}, S.boss.dials), drops:S.boss.drops.slice(), delivered:Object.assign({}, S.boss.delivered), arms:S.boss.arms.map(a => Object.assign({}, a, { seen:a.seen.slice() })) }),
    checkpoint:Object.assign({}, S.checkpoint) });
}
const say = (S, type, more) => S.events.push(Object.assign({ type }, more));

// ---------- doors ----------
// The arena door stands open until the fault wakes and shuts behind him; the exit opens once the Big Arm is restored.
function doorWants(S, d){
  if (d.opens === 'arena') return !S.boss.on || S.boss.done;
  if (d.opens === 'boss') return S.boss.done && S.boss.restoreT >= 2;
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
  S.extra = extra;
}

// ---------- hits, lives ----------
function boxHits(P, x0, y0, x1, y1){ return P.x + K.halfW > x0 && P.x - K.halfW < x1 && P.y > y0 && P.y - K.height < y1; }
function circleHits(P, cx, cy, r){ const nx = clamp(cx, P.x - K.halfW, P.x + K.halfW), ny = clamp(cy, P.y - K.height, P.y); return Math.hypot(cx - nx, cy - ny) < r; }
const held = S => !!(S.ride || S.hang);
function hit(S, away, up){
  const P = S.P; if (P.hitT < INVULN || S.dead > 0 || S.boss.done || held(S)) return false;     // nothing hurts him while a carrier holds him
  S.health--; P.vx = 4*away; P.vy = up === undefined ? -5 : up; P.ground = false; P.lock = .18; P.hitT = 0; P.hitAway = away; S.boss.hold = 0; S.boss.fix = 0;
  say(S, 'hit');
  if (S.health <= 0) loseLife(S);
  return true;
}
function loseLife(S){
  S.dead = .7; S.lives--; S.livesLost++; S.ride = null; S.hang = null; if (S.cam.on){ S.cam.on = false; S.cam.cool = 1; }
  say(S, 'lifeLost');
}
function respawn(S){
  if (S.lives <= 0){ S.over = true; say(S, 'gameOver'); return; }     // the page restarts the level or the game (owner, 30 Sept)
  S.P = M.newPlayer(S.checkpoint.x, S.checkpoint.y); S.P.hitT = 0; S.health = 3; S.cam = M.newCamera(S.inv.sdCard); S.ride = null; S.hang = null; S.lastHook = null;
  for (const c of S.L.carriers) Object.assign(S.car[c.id], { st:'ready', t:0 });           // every carrier goes home; each keeps its place in its list
  if (S.boss.on && !S.boss.done) startRound(S, S.boss.round);
  say(S, 'respawn');
}

// ---------- carriers and hooks ----------
// Touching the hovering gripper, anywhere on his body, is enough. Jumping over it is the only way past.
function touches(S, c){
  const P = S.P; if (held(S) || S.dead > 0) return false;
  const [hx, hy] = homeAt(c, S.mt), cy = hy - R.waist, nx = clamp(hx, P.x - K.halfW, P.x + K.halfW), ny = clamp(cy, P.y - K.height, P.y);
  return Math.hypot(hx - nx, cy - ny) < R.reach;
}
function stepCarriers(S, dtm){
  for (const c of S.L.carriers){
    const st = S.car[c.id]; st.t += dtm;
    if (st.st === 'ready'){
      if (touches(S, c)){
        const i = st.n % c.drops.length; st.n++;
        Object.assign(st, { st:'grip', t:0, from:[S.P.x, S.P.y], to:c.drops[i], trav:c.travels[i] });
        S.ride = { id:c.id }; S.P.vx = 0; S.P.vy = 0; say(S, 'grip', { id:c.id, to:i });
      }
    } else if (st.st === 'grip' && st.t >= R.grip){ st.st = 'carry'; st.t = 0; }
    else if (st.st === 'carry' && st.t >= st.trav){ st.st = 'drop'; st.t = 0;
      if (S.ride && S.ride.id === c.id){ S.ride = null; const P = S.P; P.x = st.to[0]; P.y = st.to[1]; P.vx = 0; P.vy = 0; P.ground = true; P.landT = 0; say(S, 'setDown', { id:c.id }); } }
    else if (st.st === 'drop' && st.t >= R.drop){ st.st = 'back'; st.t = 0; }
    else if (st.st === 'back' && st.t >= st.trav*R.backK){ st.st = 'rest'; st.t = 0; }
    else if (st.st === 'rest' && st.t >= R.rest){ st.st = 'ready'; st.t = 0; }
  }
}
// Held: his feet follow the gripper. There is no letting go (owner, 1 Oct: no choice in the matter).
function stepRide(S){
  const c = S.L.carriers.find(c => c.id === S.ride.id), p = carrierPose(S, c), P = S.P;
  P.x = p.feet[0]; P.y = p.feet[1]; P.vx = 0; P.vy = 0; P.beltV = 0; P.ground = false; P.support = null; P.coyote = 0; P.buffer = 0; P.airTime = 0; P.hitT += K.step; P.landT += K.step;
}
function tryGrabHook(S){
  const P = S.P; if (P.ground || held(S)) return;
  for (const h of S.L.hooks){
    if ((S.hookCool[h.id] || 0) > 0 || S.lastHook === h.id) continue;     // the hook he let go of waits until he has landed
    const p = hookPose(h, S.mt);
    if (Math.abs(P.x - p.hx) < R.grabX && Math.abs(P.y - R.hands - p.hy) < R.grabY){ S.hang = { id:h.id }; P.vx = 0; P.vy = 0; say(S, 'hook', { id:h.id }); return; }
  }
}
function stepHang(S, inp, jumpEdge, dtm){
  const h = S.L.hooks.find(h => h.id === S.hang.id), p = hookPose(h, S.mt), P = S.P;
  const q = hookPose(h, S.mt + .05), hv = dtm > 0 ? (q.hx - p.hx)/.05 : 0;
  P.x = p.hx; P.y = p.hy + R.hands; P.vx = 0; P.vy = 0; P.ground = false; P.support = null; P.coyote = 0; P.buffer = 0; P.airTime = 0; P.hitT += K.step; P.landT += K.step;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) P.facing = dir;
  if (jumpEdge || (inp.lookDown && !S.prev.lookDown)){
    S.hang = null; S.hookCool[h.id] = R.hookCool; S.lastHook = h.id;
    P.vx = clamp(hv*S.ts + dir*3.5, -K.runMax, K.runMax); P.vy = jumpEdge ? -R.hookHop : 0; P.rising = jumpEdge;
    say(S, 'letGo', { id:h.id });
  }
}

// ---------- damage ----------
// Machines that belong to the boss run on the Teach Cell's own clock and only in the rounds they are listed for; they
// wait for a moment at the start of each round.
const warm = S => S.L.boss.warmup || 0;
const live = (S, h) => !h.boss || (S.boss.on && !S.boss.done && S.boss.trans <= 0 && S.boss.t >= warm(S) && (!h.rounds || h.rounds.includes(S.boss.round)));
const clock = (S, h, mt) => h.boss ? Math.max(0, S.boss.t - warm(S))*((S.L.boss.rates || [])[S.boss.round] || 1) : mt;
function damage(S){
  const P = S.P;
  if (S.dead > 0 || P.hitT < INVULN || S.boss.done || held(S)) return;
  for (const a of S.L.arms){ if (!live(S, a)) continue;
    const p = armPose(a, clock(S, a, S.mt)); if (p.active && circleHits(P, p.tip[0], p.tip[1], R.tool)){ hit(S, P.x < p.tip[0] ? -1 : 1); return; } }
  for (const r of S.L.rovers){ if (!live(S, r)) continue;
    const p = roverPose(r, clock(S, r, S.mt)), b = p.box; if (boxHits(P, b[0], b[1], b[0] + b[2], b[1] + b[3])){ hit(S, P.x < p.x ? -1 : 1); return; } }
  for (const c of crates(S)) if (c.active && boxHits(P, c.x - R.crate/2, c.bottom - R.crate, c.x + R.crate/2, c.bottom)){ hit(S, P.x < c.x ? -1 : 1, 0); return; }
  // a Big Arm sweeping its empty gripper across the cell
  if (S.boss.on && !S.boss.done) for (const a of S.boss.arms) if (a.st === 'sweep' && circleHits(P, a.x, a.y, R.sweep)){ hit(S, P.x < a.x ? -1 : 1); return; }
}
// Every crate in the air now: the feeders', and the ones the Big Arm let go of where its route broke.
function crates(S){
  const out = [];
  for (const d of S.L.drops){ if (!live(S, d)) continue; const c = dropPose(d, clock(S, d, S.mt)); if (c.stage !== 'idle') out.push(Object.assign(c, { id:d.id })); }
  for (const d of S.boss.drops){ const c = crateAt(d.x, d.top, d.floor, S.boss.t - d.t0, 0); if (c) out.push(Object.assign(c, { id:'arm', colour:d.colour })); }
  return out;
}

// ---------- the Teach Cell ----------
// Each Big Arm runs its route over and over: load a crate at its chute, travel waypoint to waypoint, then deliver it to
// its pallet or, where the route breaks, warn (amber, a shadow below) and drop it. Then it rises, crosses to the far
// wall, warns (a dashed line along the level it will sweep), and sweeps its empty gripper back across the whole cell
// at one level: the floor, the side decks or the top ledges, a different one each trip. Then home to its chute.
// He re-teaches a waypoint by holding Fix at its dial: the repair hold, 2.2 seconds of his own time, as in Levels 1
// and 2; the dial turns to its next exit. A round is done when every source has delivered a crate. A lost life
// restarts the round with its dials as they were. The camera slows the arms and their crates, never Mike or his hold.
const rounds = S => S.L.boss.rounds.length;
function newArm(S, k, src){
  const def = S.L.boss, ch = def.chutes[src.chute];
  return { k, src, st:'wait', t:-(def.offset || 0)*k, n:0, colour:src.colour, at:src.chute, to:ch.first, u:0, prev:src.chute, seen:[src.chute], x:ch.at[0], y:ch.at[1], good:false };
}
function startRound(S, round){
  const B = S.boss, def = S.L.boss;
  Object.assign(B, { round, dials:Object.assign({}, def.rounds[round].dials), delivered:{}, drops:[], hold:0, fix:0, lock:false, t:0, trans:0 });
  B.arms = def.rounds[round].sources.map((src, k) => newArm(S, k, src));
}
function armArrive(S, a, id){
  const def = S.L.boss;
  a.at = id; a.u = 0; a.x = nodePos(def, id)[0]; a.y = nodePos(def, id)[1];
  if (def.pallets[id]){
    const live = palletLive(S, id), mine = def.pallets[id].colour === a.colour;
    if (live){ a.st = 'place'; a.t = 0; a.good = mine; say(S, mine ? 'placing' : 'missort', { colour:a.colour }); }
    else { a.st = 'tell'; a.t = 0; say(S, 'warn', { node:id }); }
    return;
  }
  a.seen.push(id);
  const next = nextFrom(S, id);
  if (next === a.prev || a.seen.includes(next) || def.chutes[next] || (def.pallets[next] && !palletLive(S, next))){ a.st = 'tell'; a.t = 0; say(S, 'warn', { node:id }); return; }
  a.prev = id; a.to = next;
}
function release(S, a){
  const B = S.boss, top = a.y - .25, floor = S.L.surfaceBelow(a.x, top + R.crate);
  B.drops.push({ x:a.x, top, floor:floor === null ? S.L.H : floor, t0:B.t, colour:a.colour }); say(S, 'drop', { x:a.x });
}
// where a sweep runs: from the wall away from the arm's chute, back toward it, at one of the cell's levels
function sweepOf(S, a){
  const def = S.L.boss, [x0, , w] = def.bounds, left = def.chutes[a.src.chute].at[0] < x0 + w/2, levels = def.sweeps;
  const y = levels[(a.n + a.k) % levels.length];
  return { y, from:left ? x0 + w - .9 : x0 + .9, to:left ? x0 + .9 : x0 + w - .9 };
}
function stepArm(S, a, dta){
  const B = S.boss, def = S.L.boss, ch = def.chutes[a.src.chute];
  a.t += dta;
  const toward = (tx, ty, speed) => { const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), step = speed*dta; if (d <= step){ a.x = tx; a.y = ty; return true; } a.x += dx/d*step; a.y += dy/d*step; return false; };
  if (a.st === 'wait'){ if (a.t >= 0){ a.st = 'load'; a.t = 0; } return; }
  if (a.st === 'load'){ if (a.t >= def.load){ a.st = 'move'; a.t = 0; say(S, 'pick', { colour:a.colour }); } return; }
  if (a.st === 'move'){
    const p0 = nodePos(def, a.at), p1 = nodePos(def, a.to), len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1e-6;
    a.u += def.speed*dta;
    if (a.u >= len) armArrive(S, a, a.to); else { a.x = p0[0] + (p1[0] - p0[0])*a.u/len; a.y = p0[1] + (p1[1] - p0[1])*a.u/len; }
    return;
  }
  if (a.st === 'tell'){ if (a.t >= def.tell){ release(S, a); a.st = 'rise'; a.t = 0; } return; }
  if (a.st === 'place'){
    if (a.t >= def.place){
      if (a.good){ B.delivered[a.k] = true; S.score += 250; say(S, 'deliver', { colour:a.colour, k:a.k }); }
      else release(S, a);                                                   // the wrong pallet: it is not allowed to set it down there
      a.st = 'rise'; a.t = 0;
      if (def.rounds[B.round].sources.every((_, k) => B.delivered[k])){ roundDone(S); return; }
    }
    return;
  }
  const sw = sweepOf(S, a);
  if (a.st === 'rise'){ if (toward(a.x, def.travelY, def.fly)){ a.st = 'cross'; a.t = 0; } return; }
  if (a.st === 'cross'){ if (toward(sw.from, def.travelY, def.fly)){ a.st = 'lower'; a.t = 0; } return; }
  if (a.st === 'lower'){ if (toward(sw.from, sw.y, def.fly)){ a.st = 'aim'; a.t = 0; say(S, 'sweepWarn', { y:sw.y, k:a.k }); } return; }
  if (a.st === 'aim'){ if (a.t >= def.aim){ a.st = 'sweep'; a.t = 0; } return; }
  if (a.st === 'sweep'){ if (toward(sw.to, sw.y, def.sweepSpeed)){ a.st = 'home'; a.t = 0; } return; }
  if (a.st === 'home'){
    if (toward(ch.at[0], ch.at[1], def.fly)){ a.n++; Object.assign(a, { st:'load', t:0, at:a.src.chute, to:ch.first, u:0, prev:a.src.chute, seen:[a.src.chute], good:false }); }
  }
}
function roundDone(S){
  const B = S.boss; B.round++; S.score += 500; say(S, 'roundDone', { round:B.round });
  if (B.round >= rounds(S)){ B.done = true; B.doneT = 0; B.restoreT = 0; S.score += 1000; if (S.cam.on) S.cam.on = false; say(S, 'bossDone'); }
  else B.trans = 2;
}
// the waypoint whose dial he can reach from where he stands
function dialAt(S){
  const P = S.P; if (!P.ground) return null;
  for (const [id, n] of Object.entries(S.L.boss.nodes)) if (Math.abs(P.x - n.stand[0]) <= .8 && Math.abs(P.y - n.stand[1]) < .15) return id;
  return null;
}
function stepBoss(S, inp, dt, dtm){
  const B = S.boss, def = S.L.boss, P = S.P; B.dial = null;
  if (!def) return;
  if (B.done){
    B.doneT += dt; B.restoreT += dt;
    const exit = S.L.doors.find(d => d.opens === 'boss');
    if (B.restoreT > 3.4 && (!exit || S.doors[exit.id] >= .99) && !S.won){ S.won = true; say(S, 'win'); }
    return;
  }
  if (!B.on){ if (S.dead <= 0 && P.x >= def.trigger && P.ground){ B.on = true; startRound(S, B.round); say(S, 'bossStart'); } return; }
  if (B.trans > 0){ B.trans -= dt; if (B.trans <= 0){ B.trans = 0; startRound(S, B.round); say(S, 'roundStart', { round:B.round }); } return; }
  B.t += dtm;
  B.drops = B.drops.filter(d => B.t - d.t0 < 3);
  if (B.t >= warm(S)){ const dta = dtm*((def.rates || [])[B.round] || 1); for (const a of B.arms){ stepArm(S, a, dta); if (B.trans > 0 || B.done) break; } }
  if (S.dead > 0) return;
  // at a dial: hold Fix to re-teach it; the hold must start again for each turn
  B.dial = dialAt(S);
  const still = !inp.left && !inp.right && !inp.jump && Math.abs(P.vx) < .05 && P.hitT >= .25;
  if (!inp.fix) B.lock = false;
  if (B.dial && inp.fix && still && !B.lock){
    const before = Math.floor(B.fix*6);
    B.hold += dt; B.fix = Math.min(1, B.hold/def.hold);
    if (Math.floor(B.fix*6) > before) say(S, 'repairTick');
    if (B.fix >= 1){
      const n = def.nodes[B.dial]; B.dials[B.dial] = (B.dials[B.dial] + 1) % n.exits.length;
      B.hold = 0; B.fix = 0; B.lock = true; say(S, 'reteach', { node:B.dial, to:n.exits[B.dials[B.dial]] });
    }
  } else { B.hold = 0; B.fix = 0; }
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
// inp = { left, right, jump, lookDown, camera, fix }
function step(S, inp, dt){
  dt = dt || K.step; S.events = [];
  if (S.won || S.over) return S;
  const L = S.L, B = S.boss, edge = k => !!inp[k] && !S.prev[k];
  const jumpEdge = edge('jump'), fixEdge = edge('fix');
  const wasOn = S.cam.on;
  S.cam.boss = B.on && !B.done;                             // in the boss the camera shoots in clips (world.js)
  S.ts = M.stepCamera(S.cam, edge('camera') && !B.done, dt);
  if (S.cam.on !== wasOn) say(S, S.cam.on ? 'camOn' : 'camOff');
  const dtm = dt*S.ts;
  S.time += dt; if (!B.done) S.playTime += dt;
  S.lookDown = !!inp.lookDown;
  for (const id in S.hookCool) S.hookCool[id] = Math.max(0, S.hookCool[id] - dt);
  S.mt += dtm;
  refreshSolids(S, dt);
  if (S.dead > 0){ S.dead -= dt; if (S.dead <= 0) respawn(S); stepCarriers(S, dtm); S.prev = Object.assign({}, inp); return S; }
  const P = S.P, drive = B.done ? {} : inp;                // he keeps moving while the Big Arm replays a program
  stepCarriers(S, dtm);
  if (S.ride) stepRide(S);
  else if (S.hang) stepHang(S, drive, jumpEdge && !B.done, dtm);
  else {
    const air0 = P.airTime, jumped0 = P.jumpedAt;
    M.stepPlayer(L, P, { left:drive.left, right:drive.right, jump:drive.jump, jumpEdge:jumpEdge && !B.done }, dt, S.bounds, S.extra, b => b.dir*b.speed*beltProfile(b, S.mt)*S.ts);
    if (P.jumpedAt !== jumped0) say(S, 'jump');
    if (P.landT === 0 && air0 > .2) say(S, 'land');
    if (P.ground) S.lastHook = null;
    tryGrabHook(S);
  }
  damage(S);
  if (S.dead <= 0 && S.P.y > L.H + 2) loseLife(S);
  if (S.dead <= 0){
    const Q = S.P;
    for (const p of L.pickups){
      if (S.got.has(p.id)) continue;
      if (Math.abs(p.x - Q.x) < K.halfW + .45 && p.y + .45 > Q.y - K.height && p.y - .45 < Q.y) collect(S, p);
    }
    if (Q.ground) for (const c of L.checkpoints){ const k = c.x + ',' + c.y;
      if (!S.lit.has(k) && Math.abs(Q.x - c.x) < .6 && Math.abs(Q.y - c.y) < .1){ S.lit.add(k); S.checkpoint = { x:c.x, y:c.y }; S.health = 3; S.cam.left = S.cam.cap; say(S, 'checkpoint', { x:c.x, y:c.y }); } }
    for (const ln of L.lanes) if (!S.lanes.has(ln.id)){ const [x, y, w, h] = ln.rect; if (Q.x > x && Q.x < x + w && Q.y > y && Q.y <= y + h){ S.lanes.add(ln.id); say(S, 'lane', { id:ln.id }); } }
  }
  stepBoss(S, inp, dt, dtm);
  S.prev = Object.assign({}, inp);
  return S;
}

function snapshot(S){
  const P = S.P;
  return { x:P.x, y:P.y, vx:P.vx, vy:P.vy, ground:P.ground, health:S.health, lives:S.lives, ride:S.ride && S.ride.id, hang:S.hang && S.hang.id, got:S.got.size,
    salvage:salvageCount(S), score:S.score, mt:S.mt, time:S.time, cameraOn:S.cam.on, checkpoint:S.checkpoint, dead:S.dead, won:S.won, lanes:[...S.lanes],
    boss:Object.assign({}, S.boss, { dials:Object.assign({}, S.boss.dials), drops:S.boss.drops.length, arms:S.boss.arms.map(a => ({ st:a.st, x:a.x, y:a.y, colour:a.colour })) }) };
}

M.L3 = { warm, R, POINTS, INVULN, nodePos, routeFor, nextFrom, sorterAt, palletLive, sourcesOf, sweepOf, dialAt, load, create, clone, step, snapshot, saveData, carryPath, carrierPose, homeAt, hookPose, armPose, roverPose, dropPose, crateAt, crates,
  beltProfile, beltWarn, rounds, startRound, doorSolid, doorWants, salvageCount, live, clock, hit, respawn, held };
})();
