// The world: Level data in, a collision world and Mike's movement out. Units are tiles (T = 32 logical px) and seconds.
// Every number here is from level-1-design.md section 3; the tests in tools/test-mike-game.cjs measure them.
(function(){
'use strict';
const M = window.MIKE = window.MIKE || {};

const PHYS = M.PHYS = {
  step: 1/60, maxSteps: 5,
  runMax: 7, accel: 28, brake: 42, airAccel: 18,
  jump: 12, gravity: 24, terminal: 18, tapCap: 6, coyote: 0.12, buffer: 0.15, beltCap: 10,
  halfW: 0.375, height: 1.65, deathY: 17,
  landHold: 0.10, landRecover: 0.08
};

const HAZARD_TYPES = ['spitter','spitterGallery','armGate','coolant','jaws','railSpindle'];
const PICKUP_TYPES = ['bearing','seal','coupling','lubricant','controlUnit','sdCard','miniMike'];
const DECOR_TYPES = ['landingArc','bench','recipeBoard','dispenser','exitDoor','demoDrill'];
const BACKDROP_TYPES = ['bossSilhouette'];

M.loadLevel = function(data){
  const L = { data, W:data.size[0], H:data.size[1], solids:[], belts:[], pits:[], hazards:[], pickups:[], signs:[], pads:[], decor:[],
    backdrop:[], triggers:[], sections:[], lifts:[], errors:[] };
  const err = m => L.errors.push(m), ids = new Set();
  const uid = id => { if (!id) return; if (ids.has(id)) err('duplicate id ' + id); ids.add(id); };
  let expectX = 0;
  for (const s of data.sections){
    const ox = s.x;
    if (ox !== expectX) err(`section ${s.id} starts at ${ox}, expected ${expectX}`); expectX = ox + s.width;
    L.sections.push({ id:s.id, title:s.title, x:ox, width:s.width, route:s.route });
    for(const lift of s.lifts||[]){uid(lift.id);L.lifts.push({...lift,at:[lift.at[0]+ox,lift.at[1]],to:[lift.to[0]+ox,lift.to[1]]});}
    for (const r of s.solids || []) L.solids.push({ x:r[0] + ox, y:r[1], w:r[2], h:r[3], kind: r[1] >= 12 ? 'floor' : 'roof' });
    for (const r of s.platforms || []) L.solids.push({ x:r[0] + ox, y:r[1], w:r[2], h:r[3], kind:'shelf' });
    for (const p of s.pits || []) L.pits.push({ x0:p[0] + ox, x1:p[1] + ox });
    for (const b of s.belts || []){ uid(b.id); L.belts.push({ id:b.id, x0:b.at[0] + ox, x1:b.at[1] + ox, y:b.y===undefined?12:b.y, dir:b.dir, speed:b.speed, reverse:b.reverse }); }
    for (const p of s.pads || []) L.pads.push({ x0:p[0] + ox, x1:p[1] + ox });
    for (const g of s.signs || []) L.signs.push({ x:g.at[0] + ox, y:g.at[1], kind:g.kind, text:g.text });
    for (const t of s.triggers || []) L.triggers.push({ x:t.at + ox, once:t.once, event:t.event });
    for (const d of s.decor || []){
      if (!DECOR_TYPES.includes(d.type)) err('unknown decor ' + d.type);
      const o = Object.assign({}, d, { x:d.at ? d.at[0] + ox : 0, y:d.at ? d.at[1] : 0 });
      if (d.from){ o.from = [d.from[0] + ox, d.from[1]]; o.to = [d.to[0] + ox, d.to[1]]; }
      L.decor.push(o);
    }
    for (const d of s.backdrop || []){ if (!BACKDROP_TYPES.includes(d.type)) err('unknown backdrop ' + d.type); L.backdrop.push(Object.assign({}, d, { x:d.at[0] + ox, y:d.at[1], window:d.window && [d.window[0] + ox, d.window[1], d.window[2], d.window[3]] })); }
    for (const h of s.hazards || []){
      uid(h.id); if (!HAZARD_TYPES.includes(h.type)) { err('unknown hazard ' + h.type); continue; }
      const o = Object.assign({}, h, { section:s.id });
      if (h.rect) o.rect = [h.rect[0] + ox, h.rect[1], h.rect[2], h.rect[3]];
      if (h.base) o.base = [h.base[0] + ox, h.base[1], h.base[2], h.base[3]];
      if (h.jet) o.jet = [h.jet[0] + ox, h.jet[1], h.jet[2], h.jet[3]];
      if (h.pivot) o.pivot = [h.pivot[0] + ox, h.pivot[1]];
      if (h.catch !== undefined) o.catch = h.catch + ox;
      // Bases are solid (design section 5); the coolant tank itself stands behind the play layer.
      if (h.type === 'spitter') L.solids.push({ x:o.rect[0], y:o.rect[1], w:o.rect[2], h:o.rect[3], kind:'machine', hazard:o.id });
      if (h.type === 'coolant') L.solids.push({ x:o.base[0], y:o.base[1], w:o.base[2], h:o.base[3], kind:'machine', hazard:o.id });
      L.hazards.push(o);
    }
    for (const p of s.pickups || []){
      uid(p.id); if (!PICKUP_TYPES.includes(p.type)) { err('unknown pickup ' + p.type); continue; }
      L.pickups.push({ id:p.id, type:p.type, x:p.at[0] + ox, y:p.at[1], section:s.id, hidden:!!p.hidden });
    }
  }
  if (expectX !== L.W) err(`sections cover ${expectX} tiles, level is ${L.W}`);
  L.checkpoints = data.checkpoints.map(c => ({ x:c[0], y:c[1] }));
  L.spawn = { x:data.spawn[0], y:data.spawn[1] };
  L.boss = data.boss; L.recovery = data.recovery; L.messages = data.messages || {};
  for (const t of L.triggers) if (!['arena'].includes(t.event)) err(`trigger at ${t.x} has an unknown event "${t.event}"`);
  L.salvageTypes=data.collection?.types||['bearing','seal','coupling','controlUnit'];
  L.salvageTotal=L.pickups.filter(p=>L.salvageTypes.includes(p.type)).length;
  if(data.collection && L.salvageTotal!==data.collection.total)err('salvage total must be '+data.collection.total);
  // Checkpoints must stand on floor and clear of hazards.
  for (const c of L.checkpoints){
    if (!L.solids.some(s => s.kind === 'floor' && c.x >= s.x && c.x <= s.x + s.w && Math.abs(s.y - c.y) < 1e-6)) err(`checkpoint ${c.x} is not on floor`);
    for (const h of L.hazards){ const r = h.rect || h.base; if (c.x > r[0] - 2 && c.x < r[0] + r[2] + 2) err(`checkpoint ${c.x} overlaps ${h.id}`); }
  }
  // Tile-column broadphase.
  L.cols = Array.from({ length:L.W + 1 }, () => []);
  L.solids.forEach((s, i) => { for (let x = Math.max(0, Math.floor(s.x)); x <= Math.min(L.W, Math.ceil(s.x + s.w)); x++) L.cols[x].push(i); });
  L.sectionAt = x => L.sections.find(s => x >= s.x && x < s.x + s.width) || L.sections[L.sections.length - 1];
  return L;
};

function overlaps(L, x0, y0, x1, y1, extra){
  const out = [];
  const seen = new Set();
  for (let cx = Math.max(0, Math.floor(x0)); cx <= Math.min(L.W, Math.floor(x1)); cx++) for (const i of L.cols[cx]){
    if (seen.has(i)) continue; seen.add(i);
    const s = L.solids[i];
    if (x1 > s.x + 1e-6 && x0 < s.x + s.w - 1e-6 && y1 > s.y + 1e-6 && y0 < s.y + s.h - 1e-6) out.push(s);
  }
  if (extra) for (const s of extra) if (x1 > s.x + 1e-6 && x0 < s.x + s.w - 1e-6 && y1 > s.y + 1e-6 && y0 < s.y + s.h - 1e-6) out.push(s);
  return out;
}
M.overlaps = overlaps;
// Section 1's pillar drill (owner, 27 Sept: it must be a real hazard). Its spindle stands over the walkway and the bit
// feeds down to chest height every 3 s of machine time: up and quiet, an amber tell with the bit spinning up, feed
// down, drill, retract. The bit hurts only while it is low enough to reach Mike.
M.DRILL = { cycle:3, tell:.45 };
M.drillPose=function(d,t){
  const u=((t%M.DRILL.cycle)+M.DRILL.cycle)%M.DRILL.cycle, ease=v=>.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,v)));
  let feed=0,stage='up';
  if(u>=1.2-M.DRILL.tell&&u<1.2)stage='tell';
  else if(u>=1.2&&u<1.55){feed=ease((u-1.2)/.35);stage='down';}
  else if(u>=1.55&&u<2.2){feed=1;stage='drill';}
  else if(u>=2.2&&u<2.7){feed=1-ease((u-2.2)/.5);stage='up';}
  const tipY=7.4+feed*3.6, x=d.x-0.19;                    // tip from y 7.4 (clear above his head) down to y 11.0
  return {feed,stage,x,tipY,danger:tipY>10.25};
};
M.liftPose=function(lift,t){
  const u=(((t+(lift.phase||0))/lift.cycle)%1+1)%1;
  const ease=v=>.5-.5*Math.cos(Math.PI*v);
  const f=u<.16?0:u<.48?ease((u-.16)/.32):u<.64?1:1-ease((u-.64)/.36);
  return {id:lift.id,x:lift.at[0]+(lift.to[0]-lift.at[0])*f,y:lift.at[1]+(lift.to[1]-lift.at[1])*f,w:lift.w,h:.4,kind:'lift'};
};

M.newPlayer = (x, y) => ({ x, y, vx:0, vy:0, ground:true, support:null, facing:1, coyote:0, buffer:0, rising:false,
  airTime:0, landT:9, hitT:9, lock:0, beltV:0, dist:0, peakY:y, jumpedAt:null, stepCount:0 });

// One fixed step of Mike's movement. `inp` = {left,right,jump,jumpEdge}. `bounds` = [minX, maxX] in tiles.
// `extra` = extra solids (a closed door). `beltSpeed(belt)` gives a belt's current surface speed.
M.stepPlayer = function(L, P, inp, dt, bounds, extra, beltSpeed){
  const K = PHYS;
  let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);          // opposed directions cancel
  if (P.lock > 0){ P.lock = Math.max(0, P.lock - dt); dir = 0; } // knocked back: no control for a moment
  else if (inp.jumpEdge) P.buffer = K.buffer;
  if (dir) P.facing = dir;
  // Horizontal: player's own velocity; belts add on top while grounded.
  if (P.ground){
    if (dir && (P.vx === 0 || Math.sign(P.vx) === dir)) P.vx = dir*Math.min(K.runMax, Math.abs(P.vx) + K.accel*dt);
    else if (dir) P.vx += dir*K.brake*dt;                         // reversal
    else P.vx = Math.sign(P.vx)*Math.max(0, Math.abs(P.vx) - K.brake*dt);
    if (dir && Math.abs(P.vx) > K.runMax && Math.sign(P.vx) === dir) P.vx = dir*K.runMax;
  } else if (dir){
    const target = dir*K.runMax;
    if (dir > 0 ? P.vx < target : P.vx > target) P.vx = dir > 0 ? Math.min(target, P.vx + K.airAccel*dt) : Math.max(target, P.vx - K.airAccel*dt);
  }
  // Jump: buffered press, coyote grace, one jump per press.
  if (P.buffer > 0 && (P.ground || P.coyote > 0)){
    P.vx = Math.max(-K.beltCap, Math.min(K.beltCap, P.vx + P.beltV));     // belts carry into take-off
    P.vy = -K.jump; P.ground = false; P.coyote = 0; P.buffer = 0; P.rising = true; P.beltV = 0;
    P.jumpedAt = { x:P.x, y:P.y, step:P.stepCount }; P.peakY = P.y;
  }
  if (P.rising && !inp.jump && P.vy < -K.tapCap) P.vy = -K.tapCap;      // release while rising caps the climb
  if (P.vy >= 0) P.rising = false;
  P.buffer = Math.max(0, P.buffer - dt);
  // Integrate: trapezoidal in y so the arc matches the design's numbers exactly (3T apex at 0.5 s).
  const vy0 = P.vy; P.vy = Math.min(K.terminal, P.vy + K.gravity*dt);
  const dx = (P.vx + (P.ground ? P.beltV : 0))*dt, dy = (vy0 + P.vy)/2*dt;
  // X then Y, each resolved against solids (steps are < 0.3T, far below Mike's size, so nothing tunnels).
  P.x += dx;
  for (const s of overlaps(L, P.x - K.halfW, P.y - K.height, P.x + K.halfW, P.y, extra)){
    if (s.kind === 'shelf' || s.kind === 'lift') continue; // grating and lift decks are one-way landing surfaces
    if (dx > 0) P.x = s.x - K.halfW - 1e-4; else if (dx < 0) P.x = s.x + s.w + K.halfW + 1e-4;
    P.vx = 0;
  }
  if (P.x < bounds[0] + K.halfW){ P.x = bounds[0] + K.halfW; P.vx = Math.max(0, P.vx); }
  if (P.x > bounds[1] - K.halfW){ P.x = bounds[1] - K.halfW; P.vx = Math.min(0, P.vx); }
  const wasGround = P.ground;
  P.y += dy; P.ground = false; P.support = null;
  for (const s of overlaps(L, P.x - K.halfW, P.y - K.height, P.x + K.halfW, P.y, extra)){
    if ((s.kind === 'shelf' || s.kind === 'lift') && (dy <= 0 || P.y - dy > s.y + .05)) continue;
    if (dy > 0){ P.y = s.y; P.vy = 0; P.ground = true; P.support = s; }
    else if (dy < 0){ P.y = s.y + s.h + K.height; P.vy = 0; P.rising = false; }
  }
  if (!P.ground && P.vy >= 0){                                     // standing still on something
    const under = overlaps(L, P.x - K.halfW, P.y, P.x + K.halfW, P.y + 0.02, extra).filter(s => !['shelf','lift'].includes(s.kind) || P.y <= s.y + .02);
    if (under.length){ P.ground = true; P.support = under[0]; P.y = under[0].y; P.vy = 0; }
  }
  // Belt surface speed under Mike's feet (floor at y 12 inside a belt span).
  P.beltV = 0;
  if (P.ground) for (const b of L.belts) if (Math.abs(P.y - b.y) < 1e-3 && P.x > b.x0 && P.x < b.x1){ P.beltV = beltSpeed ? beltSpeed(b) : b.dir*b.speed; break; }
  if (wasGround && !P.ground && P.vy >= 0) P.coyote = K.coyote;   // walked off an edge
  else if (P.ground) P.coyote = 0;
  else P.coyote = Math.max(0, P.coyote - dt);
  if (!wasGround && P.ground){ P.landT = 0; P.lastAir = P.airTime; }
  P.airTime = P.ground ? 0 : P.airTime + dt;
  if (P.y < P.peakY) P.peakY = P.y;
  P.landT += dt; P.hitT += dt; P.stepCount++;
  P.dist += Math.abs(dx);
  return P;
};

// The video camera records onto an SD card: slow motion lasts as long as the footage left on the card (owner's
// revision, 26 Sept). The card starts with 3 s, which clears any gate; every SD card picked up adds 1.5 s. After
// filming stops there is a 1 s pause, then the card frees space again at 0.5 s per second, so no one is ever stuck.
const CAM = M.CAMERA = { scale:0.2, base:3, perCard:1.5, max:12, min:0.5, cooldown:1, refill:0.5 };
M.cameraCapacity = cards => Math.min(CAM.max, CAM.base + CAM.perCard*(cards || 0));
M.newCamera = cards => { const cap = M.cameraCapacity(cards); return { on:false, cap, left:cap, cool:0, t:0, refused:0, get charge(){ return 100*this.left/this.cap; } }; };
// ---------- the campaign: continues carried between levels (owner, 30 Sept) ----------
// Finishing a level for the first time awards one continue. Losing every life with a continue in hand restarts the
// level: three lives, full health, the level reset. Losing every life with none restarts the game from Level 1.
// A checkpoint save is never offered after the last life is lost.
const CAMPAIGN_KEY = 'mike-game.campaign.v1';
M.campaign = {
  load(){ try { return Object.assign({ continues:0, cleared:[], scores:{} }, JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) || {}); } catch(_){ return { continues:0, cleared:[], scores:{} }; } },
  save(c){ try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(c)); } catch(_){} },
  // a finished level: its latest score goes into the campaign total; the first finish also earns the continue
  award(level, score){ const c = this.load(); if (score !== undefined) c.scores[level] = score; if (!c.cleared.includes(level)){ c.cleared.push(level); c.continues++; } this.save(c); return c; },
  useContinue(){ const c = this.load(); if (c.continues <= 0) return false; c.continues--; this.save(c); return true; },
  // restart means restart (owner, 30 Sept): nothing cleared, no continues, no scores; Level 2 is locked again
  restart(){ this.save({ continues:0, cleared:[], scores:{} }); },
  cleared(level){ return this.load().cleared.includes(level); },
  score(level){ return this.load().scores[level] || 0; },
  total(){ return Object.values(this.load().scores).reduce((a, b) => a + b, 0); },
  get continues(){ return this.load().continues; }
};
// The boss progress strip, both levels: small, at the top centre, clear of every service point. Progress only: the
// order is never shown (owner, 27 Sept). Made smaller on the owner's word, 30 Sept, because it covered targets.
M.bossStrip = function(c, done, total, group, right, font){
  const pw = 12, gap = 4, w = total*(pw + gap) + Math.floor((total - 1)/group)*6 + 16 + 62, x = 480 - w/2, y = 84;   // below the pause and sound buttons, beside the two panels
  c.save(); c.globalAlpha = .9; c.fillStyle = 'rgba(6,20,31,.85)'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, 20, 6) : c.rect(x, y, w, 20); c.fill(); c.globalAlpha = 1;
  let px = x + 8;
  for (let i = 0; i < total; i++){ if (i && i % group === 0){ c.fillStyle = '#4d6b77'; c.fillRect(px + 1, y + 4, 2, 12); px += 6; }
    c.fillStyle = i < done ? '#3f8f7c' : '#1f3440'; c.beginPath(); c.roundRect ? c.roundRect(px, y + 6, pw, 8, 4) : c.rect(px, y + 6, pw, 8); c.fill(); px += pw + gap; }
  c.font = `700 10px ${font}`; c.fillStyle = '#c4dbe1'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(done + '/' + total + '  ' + right, x + w - 8, y + 10.5);
  c.restore();
};
// In a boss the camera shoots in clips (owner, 29 Sept), so that no amount of footage makes the fight a walk.
//   One press films for CLIP.length seconds at most, then the camera stops by itself. It will not start on less
//   than a whole clip.
//   If there is footage left on the card, the next clip is ready after CLIP.load: it is on the player to press again.
//   SD cards are spare clips. They are never a longer clip.
//   One clip always comes back by itself, so nobody is left without the camera, but slowly: CLIP.recharge storage
//   units per second, which is many times slower than loading the next clip. Spare clips do not come back
//   during the fight; a lost life gives the whole card back.
// The game sets C.boss while a boss is awake. Outside a boss nothing here applies.
// Longer takes use the same card space: preserve spare counts, SD benefits and 15-second recharge.
const CLIP = M.CLIP = { length:5, cost:3, load:0.6, recharge:0.2 };
M.cameraSeconds = (C, amount = C.left) => amount*(C.boss ? CLIP.length/CLIP.cost : 1);
M.clipRemaining = C => Math.max(0, Math.min(M.cameraSeconds(C), CLIP.length - C.t));
M.clipsLeft = C => Math.floor((C.left + 1e-6)/CLIP.cost);
// While filming, subtract only the remaining part of this take, not another whole clip.
M.spareClips = C => Math.max(0, Math.floor((C.left - (C.on ? M.clipRemaining(C)*CLIP.cost/CLIP.length : 0) + 1e-6)/CLIP.cost));
function stepClips(C, pressEdge, dt){
  if (pressEdge){
    if (C.on){ C.on = false; C.cool = CLIP.load; }
    else if (C.left >= CLIP.cost - 1e-6 && C.cool <= 0){ C.on = true; C.t = 0; }      // a clip is always a whole clip
    else C.refused = 1.2;
  }
  if (C.on){
    C.left = Math.max(0, C.left - dt*CLIP.cost/CLIP.length); C.t += dt;
    if (C.left <= 0 || C.t >= CLIP.length - 1e-9){ C.on = false; C.cool = CLIP.load; }
  } else if (C.cool > 0) C.cool = Math.max(0, C.cool - dt);
  else if (C.left < CLIP.cost) C.left = Math.min(CLIP.cost, C.cap, C.left + CLIP.recharge*dt);
  C.refused = Math.max(0, C.refused - dt);
  return C.on ? CAM.scale : 1;
}
M.stepCamera = function(C, pressEdge, dt){
  if (C.boss) return stepClips(C, pressEdge, dt);
  if (pressEdge){
    if (C.on){ C.on = false; C.cool = CAM.cooldown; }
    else if (C.left >= CAM.min - 1e-9 && C.cool <= 0){ C.on = true; C.t = 0; }
    else C.refused = 1.2;
  }
  if (C.on){
    C.left = Math.max(0, C.left - dt); C.t += dt;
    if (C.left <= 0){ C.on = false; C.cool = CAM.cooldown; }
  } else if (C.cool > 0) C.cool = Math.max(0, C.cool - dt);
  else C.left = Math.min(C.cap, C.left + CAM.refill*dt);
  C.refused = Math.max(0, C.refused - dt);
  return C.on ? CAM.scale : 1;
};
})();
