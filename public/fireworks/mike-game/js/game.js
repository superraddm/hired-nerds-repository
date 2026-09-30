// Mike the Mic, Level 1: the game. Engine loop, input, machines, the Tangled Turner, save, menus, the in-camera
// slow-motion view, the HUD, still scenes (?scene=<name>), test hooks (window.__mike) and the lab read-out (?lab=1).
(function(){
'use strict';
const M = window.MIKE, A = M.art, T = A.T, C = A.C, FONT = A.FONT, PH = M.PHYS, AU = M.audio;
// The owner asked for Mike bigger (26 Sept): the world is drawn 1.25x closer. The logical canvas stays 960x540 and
// every distance stays in tiles; the view is 24T x 13.5T and ends 3T below the floor top.
const W = 960, H = 540, Z = 1.25, VW = W/Z, VH = H/Z, BASE_CAM_Y = 15*T - VH, FLOOR_SCREEN = (12*T - BASE_CAM_Y)*Z;
let CAM_Y = BASE_CAM_Y;
const INVULN = 1.5, STEP = PH.step;
// The debug switches (?section, ?scene, ?demo, ?test, ?lab) work only on the local network, for testing (owner, 30 Sept).
// On the live site every address is the front door: no jumping to a section or the boss.
const LOCAL = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || location.protocol === 'file:';
const q = new URLSearchParams(LOCAL ? location.search : '');
const SCENE = q.get('scene'), SECTION = q.get('section'), TEST = q.has('test'), LAB = q.has('lab'), DEMO = q.has('demo');
const SAVE_KEY = 'mike-game.v3.save', PROGRESS_KEY = 'mike-game.v3.progress';

const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const stage = document.getElementById('stage'), $ = id => document.getElementById(id);
let L, rig, rigL, far, pipes, lockRed;
const chunks = new Map();                                 // cached static terrain, 512 world px wide, drawn at view scale

// ---------- state ----------
const G = { mode:'title', spec:null, t:0, mt:0, ts:1, camX:0, look:4, bounds:[0, 320], fixed:[], extra:[], doors:[], paused:false,
  health:3, lives:3, score:0, got:new Set(), inv:{}, rec:{}, used:{}, recGiven:false,
  checkpoint:null, lit:new Set(), fx:[], hazT:null, shots:[], boss:null, slowShow:null, dead:0, beltPos:null,
  livesLost:0, continues:0, time:0, card:0, toast:null, lowQ:false, won:false, af:null };
const TYPES = ['bearing', 'seal', 'coupling', 'lubricant', 'controlUnit', 'sdCard', 'miniMike'];
const zero = () => Object.fromEntries(TYPES.map(k => [k, 0]));
G.inv = zero(); G.rec = zero(); G.used = zero();
const HZ = {};                                            // per machine: clock last step, shots in flight, gate state
let P = null, CAMR = M.newCamera(0);
const anim = { st:'idle', s:0, from:null, cur:null, blend:1, phase:0, turn:12, idle:0 };
// The Tangled Turner: strictly ordered fittings (design section 8).
const B = { on:false, step:0, order:0, fitted:{ bearing:0, seal:0, coupling:0 }, units:0, t:0, trans:0, fix:0, done:false, doneT:0, eligible:false, wrongT:0 };

// ---------- input ----------
const keys = new Set(), touchHeld = new Map();            // pointerId -> control
let testInput = null, prevInp = { jump:false, camera:false };
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'jump', KeyW:'jump', ArrowUp:'jump',
  ArrowDown:'lookDown', KeyS:'lookDown', KeyC:'camera', ShiftLeft:'camera', ShiftRight:'camera', KeyE:'fix', Escape:'pause', KeyP:'pause' };
addEventListener('keydown', e => {
  AU.unlock();
  const k = KEYMAP[e.code]; if (!k) return;
  e.preventDefault(); document.body.classList.remove('touch');
  if (e.repeat) return;                                   // keyboard repeat never retriggers a jump or a toggle
  if (k === 'pause'){ if (G.mode === 'play') setPaused(!G.paused); return; }
  keys.add(k);
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k){ keys.delete(k); e.preventDefault(); } });
function readInput(){
  if (testInput) return testInput;
  const held = new Set(keys); for (const v of touchHeld.values()) held.add(v);
  return { left:held.has('left'), right:held.has('right'), jump:held.has('jump'), camera:held.has('camera'), fix:held.has('fix'), lookDown:held.has('lookDown') };
}
function clearInput(){ keys.clear(); touchHeld.clear(); document.querySelectorAll('.tc.on').forEach(b => b.classList.remove('on')); }
// Touch controls: tracked by pointerId, captured on press, cleared on up/cancel/lost capture. Act on press.
document.querySelectorAll('.tc').forEach(b => {
  const ctl = b.dataset.ctl;
  b.addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); document.body.classList.add('touch'); try { b.setPointerCapture(e.pointerId); } catch(_){}
    touchHeld.set(e.pointerId, ctl); b.classList.add('on'); });
  const up = e => { if (touchHeld.get(e.pointerId) === ctl){ touchHeld.delete(e.pointerId); if (![...touchHeld.values()].includes(ctl)) b.classList.remove('on'); } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, up));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');     // iPad and phones; any first touch also shows them
addEventListener('pointerdown', e => { AU.unlock(); if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture:true, passive:true });
function setPaused(p){
  G.paused = p; clearInput(); $('pausebox').hidden = !p;
  if (p){ $('pause-score').textContent = 'Score ' + G.score.toLocaleString('en-GB'); save(); AU.hum(false); AU.suspend(); } else AU.resume();
}
addEventListener('blur', () => { if (G.mode === 'play' && !TEST && !DEMO) setPaused(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden){ if (G.mode === 'play' && !TEST && !DEMO) setPaused(true); AU.suspend(); } });

// ---------- layout: a fixed 960x540 stage fitted inside the window, letterboxed ----------
function fit(){
  const vw = innerWidth, vh = innerHeight, s = Math.min(vw/W, vh/H);
  const ox = (vw - W*s)/2, oy = (vh - H*s)/2;
  stage.style.transform = `translate(${ox}px,${oy}px) scale(${s})`;
  G.view = { s, ox, oy };
  document.body.classList.toggle('portrait', vh > vw);
}
addEventListener('resize', fit); fit();

// ---------- save: versioned, local only; the game carries on in memory if storage is unavailable ----------
function save(){
  if (G.spec !== 'full' || G.won || G.mode !== 'play') return;
  const d = { v:1, level:L.data.id, cp:G.checkpoint, lit:[...G.lit], got:[...G.got], rec:G.rec, used:G.used, recGiven:G.recGiven,
    boss:{ step:B.step, order:B.order, fitted:B.fitted, units:B.units }, bonusStep:G.bonusStep, score:G.score, lives:G.lives, time:G.time, lost:G.livesLost, cont:G.continues };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); }
  catch(_){ if (!G.saveWarned){ G.saveWarned = true; toast('Saving is unavailable here: progress lasts until the page closes'); } }
}
function loadSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 1 && d.level === L.data.id) return d; } catch(_){} return null; }
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch(_){} }
function loadProgress(){ try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch(_){ return {}; } }
function saveProgress(p){ try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch(_){} }
function toast(text){ G.toast = { text, t:0, life:4 }; }

// ---------- game setup ----------
// spec: 'full', '1', or '1-3' (a test strip that ends at a closed door)
function sectionRange(spec){
  if (!spec || spec === 'full' || spec === '0') return null;
  const [a, b] = String(spec).split('-').map(Number);
  return [L.sections[a - 1], L.sections[(b || a) - 1]];
}
function startPlay(spec, sv){
  G.mode = 'play'; document.body.dataset.mode = 'play'; G.spec = spec || 'full'; SCENE_ANIM = false;
  const r = sectionRange(G.spec);
  G.bounds = r ? [r[0].x, r[1].x + r[1].width] : [0, L.W];
  G.doors = []; G.fixed = [];
  if (G.bounds[1] < L.W){                                  // a strip ends at a visible roller door: no invisible walls
    const dx = G.bounds[1] - 0.9;
    G.doors.push({ x:dx, top:6.5 }); G.fixed.push({ x:dx, y:6.5, w:0.9, h:5.5, kind:'door' });
  }
  G.extra = G.fixed.slice();
  const cp = L.checkpoints.find(c => c.x >= G.bounds[0] && c.x < G.bounds[1]);
  G.checkpoint = cp || { x:G.bounds[0] + 2, y:12 }; G.lit = new Set([G.checkpoint.x]);
  G.t = 0; G.fx = []; G.score = 0; G.got = new Set(); G.health = 3; G.lives = 3; G.dead = 0;
  G.livesLost = 0; G.continues = 0; G.time = 0; G.inv = zero(); G.rec = zero(); G.used = zero(); G.recGiven = false;
  G.won = false; G.toast = null; G.boss = null; G.slowShow = null; G.hazT = null; G.armPose = null; G.jawsU = undefined; G.results = null;
  delete document.body.dataset.done;
  Object.assign(B, { on:false, step:0, order:(loadProgress().bossRuns || 0) % 3, fitted:{ bearing:0, seal:0, coupling:0 }, units:0, t:0, trans:0, fix:0, done:false, doneT:0, wrongT:0 });
  G.bonusStep = 0; G.newBest = false; G.bestAtStart = loadProgress().best || 0; G.scorePop = 0; G.milestone = null;
  if (sv){
    G.checkpoint = sv.cp; G.lit = new Set(sv.lit); G.got = new Set(sv.got); G.rec = Object.assign(zero(), sv.rec); G.used = Object.assign(zero(), sv.used);
    G.recGiven = sv.recGiven; B.step = sv.boss.step; B.order = sv.boss.order || 0; B.fitted = bossFittedFromStep(); B.units = sv.boss.units;
    G.bonusStep = sv.bonusStep || 0;
    // A save during the short victory animation must still finish after reloading.
    B.done = B.step >= STEPS.length; B.on = B.done;
    G.score = sv.score; G.lives = sv.lives; G.time = sv.time; G.livesLost = sv.lost; G.continues = sv.cont;
    for (const p of L.pickups) if (G.got.has(p.id)) G.inv[p.type]++;
  }
  P = M.newPlayer(G.checkpoint.x, G.checkpoint.y); CAMR = M.newCamera(G.inv.sdCard);
  CAM_Y = BASE_CAM_Y; G.lookDown = false;
  resetHazards();
  anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur; anim.turn = 12;
  G.look = 4; follow(1);
  G.card = G.spec === 'full' && !sv ? 2.8 : 0; G.lastScore = G.score; G.scorePop = 0;
  $('menu').hidden = true; $('pausebox').hidden = true; G.paused = false;
  AU.boss(false);
}

// ---------- machines ----------
function hazT(h){ return G.hazT && G.hazT[h.id] !== undefined ? G.hazT[h.id] : ((G.mt + (h.phase || 0)) % h.cycle + h.cycle) % h.cycle; }
function resetHazards(){
  G.mt = 0; G.shots = []; G.beltPos = {};
  for (const h of L.hazards) HZ[h.id] = { prev:hazT(h), shots:[], state:gateState(h, hazT(h)) };
  for (const b of L.belts) G.beltPos[b.id] = 0;
  B.t = 0; B.run = 0; B.fix = 0; B.trans = 0;
}
// Belts run one way for 3.2 s, slow to a stop over 0.8 s (arrows pulsing), then run the other way. Machine time.
function beltProfile(b){ const R = b.reverse, u = ((G.mt % (2*R)) + 2*R) % (2*R), w = 0.8;
  return u < R - w ? 1 : u < R ? (R - u)/w : u < 2*R - w ? -1 : -(2*R - u)/w; }
function beltWarn(b){ const u = ((G.mt % b.reverse) + b.reverse) % b.reverse; return u >= b.reverse - 0.8; }
const beltSurface = b => b.dir*b.speed*beltProfile(b)*G.ts;
// Gates (gallery, spindle, press): red while shut, amber just before opening, green while open.
const isGate = h => h.type === 'spitterGallery' || h.type === 'armGate' || h.type === 'jaws';
function gateState(h, t){ if (!isGate(h)) return null; return t >= h.open[0] && t < h.open[1] ? 'green' : t >= h.open[0] - h.ready && t < h.open[0] ? 'amber' : 'red'; }
// Press: closing 0-0.25, shut, opening 1.9-2.5, open 2.5-3
function jawsU(h, t){ return t < .25 ? t/.25 : t < 1.9 ? 1 : t < h.open[0] ? 1 - (t - 1.9)/(h.open[0] - 1.9) : 0; }
// Spindle: reaches out swung left, sweeps right, swings back to centre, retracts, stays up while the gate is open
function armPose(h, t){
  const a = .6, o = h.open[0];
  if (t < .5) return { ang:a, ext:.35 + .65*t/.5 };
  if (t < 2) return { ang:a - 2*a*(t - .5)/1.5, ext:1 };
  if (t < 2.8) return { ang:-a + a*(t - 2)/.8, ext:1 };
  if (t < o) return { ang:0, ext:1 - (t - 2.8)/(o - 2.8) };
  return { ang:0, ext:0 };
}
const live = h => { const r = h.rect || h.base; return r[0] >= G.bounds[0] && r[0] < G.bounds[1]; };
const near = (x, d) => P && Math.abs(P.x - x) < (d || 14);
function stepHazards(dtm){
  const gates = [];
  G.shots = [];
  for (const b of L.belts) G.beltPos[b.id] += b.dir*b.speed*beltProfile(b)*dtm;
  for (const h of L.hazards){
    const s = HZ[h.id]; if (!s || !live(h)) continue;
    const t = hazT(h), wrapped = t < s.prev;
    const crossed = a => wrapped ? (a > s.prev || a <= t) : (a > s.prev && a <= t);
    const r = h.rect || h.base;
    if (h.type === 'spitter'){
      if (wrapped && near(r[0])) AU.play('tick');                                       // the rattle starts
      [0.6, 0.9].forEach((a, i) => { if (crossed(a)) s.shots.push({ x:A.spitterMouth(h)/T, y:h.mouth, vx:(h.face || -1)*6, a:0, kind:i }); });
      for (const p of s.shots){ p.x += p.vx*dtm; p.a += 9*dtm*Math.sign(p.vx); }
      s.shots = s.shots.filter(p => p.vx < 0 ? p.x > h.catch + 0.3 : p.x < h.catch - 0.3);
    } else if (h.type === 'spitterGallery'){
      h.lanes.forEach((ly, i) => { if (crossed([0.6, 0.9][i])) s.shots.push({ x:r[0] + 0.45, y:ly, vx:6, a:0, kind:i }); });
      for (const p of s.shots){ p.x += p.vx*dtm; p.a += 9*dtm; }
      s.shots = s.shots.filter(p => p.x < r[0] + r[2] - 0.35);
    } else if (h.type === 'coolant'){
      if (wrapped && near(r[0])) AU.play('tick');
    }
    if (isGate(h)){
      const st = gateState(h, t);
      if (st !== s.state && near(r[0])) AU.play(st === 'green' ? 'go' : st === 'amber' ? 'tick' : 'camOff');
      // A closing gate puts Mike back at its entry edge with at most one hit; it never traps him.
      if (s.state === 'green' && st !== 'green' && P && G.dead <= 0 && boxHits(r[0],r[1],r[0]+r[2],r[1]+r[3])){
        P.x = r[0] - PH.halfW - 0.02; P.vx = 0; hit(-1, true);
      }
      s.state = st;
      if (st !== 'green') gates.push({ x:r[0], y:r[1], w:r[2], h:r[3], kind:'gate' });
    }
    s.prev = t;
    for (const p of s.shots) G.shots.push(p);
  }
  G.moving=L.lifts.map(lift=>M.liftPose(lift,G.mt+dtm));
  if(P&&P.ground&&P.support?.kind==='lift'&&G.dead<=0){
    const lift=L.lifts.find(l=>l.id===P.support.id),before=M.liftPose(lift,G.mt),after=G.moving.find(l=>l.id===lift.id);
    P.x+=after.x-before.x;P.y+=after.y-before.y;
  }
  G.extra = G.fixed.concat(gates,G.moving);
}
function boxHits(x0, y0, x1, y1){ return P.x + PH.halfW > x0 && P.x - PH.halfW < x1 && P.y > y0 && P.y - PH.height < y1; }
function circleHits(cx, cy, r){
  const x = Math.max(P.x - PH.halfW, Math.min(P.x + PH.halfW, cx)), y = Math.max(P.y - PH.height, Math.min(P.y, cy));
  return (cx - x)**2 + (cy - y)**2 < r*r;
}
function damage(){
  if (G.dead > 0 || P.hitT < INVULN || B.done) return;
  for (const h of L.hazards) if (h.type === 'railSpindle' && live(h)){
    const tip = M.railTip(h, hazT(h));
    if (tip.danger && circleHits(tip.x,tip.y,.66)){ hit(P.x < tip.x ? -1 : 1); return; }
  }
  for (const s of G.shots) if (circleHits(s.x, s.y, 0.25)){ hit(Math.sign(s.vx) || -1); return; }
  for (const d of L.decor) if (d.type === 'demoDrill' && d.x >= G.bounds[0] && d.x < G.bounds[1]){
    const dp = M.drillPose(d, G.mt);
    if (dp.danger && boxHits(dp.x - .2, dp.tipY - 1.25, dp.x + .2, dp.tipY)){ hit(P.x < dp.x ? -1 : 1); return; }
  }
  for (const h of L.hazards) if (h.type === 'coolant' && live(h)){
    const t = hazT(h), [jx, jy, jw, jh] = h.jet;
    if (t >= 0.7 && t < 1.8 && boxHits(jx, jy, jx + jw, jy + jh)){ hit(P.x < jx + jw/2 ? -1 : 1); return; }
  }
  if (B.on) for (const tip of bossTips()) if (tip.danger && circleHits(tip.x, tip.y, 0.5)){ hit(P.x < tip.x ? -1 : 1); return; }
}
// A hit: one health, knocked away at 4T/s and up at 5T/s, 0.18 s without control, 1.5 s protected.
function hit(away, force){
  if (!force && P.hitT < INVULN) return;
  G.health--; P.vx = 4*away; P.vy = -5; P.ground = false; P.lock = 0.18; P.hitT = 0; P.hitAway = away; B.fix = 0;
  AU.play('bonk');
  AU.say('pain'); G.shake = .22;
  if (G.health <= 0) loseLife();
}
function loseLife(){
  G.dead = 0.7; G.lives--; G.livesLost++; AU.play('fall');
  if (CAMR.on){ CAMR.on = false; CAMR.cool = 1; AU.hum(false); }   // death, unlike a hit, ends slow motion
  save();
}
function respawn(){
  if (G.lives <= 0){
    // the last life (owner, 30 Sept): a continue restarts the level from the start; none left restarts the game
    clearSave();
    if (M.campaign.useContinue()){ const used = G.continues + 1, left = M.campaign.continues; startPlay(G.spec || 'full'); G.continues = used; toast(left ? `Continue used. ${left} left` : 'Last continue used'); }
    else { M.campaign.restart(); toTitle(); G.gameOver = 2.8; }
    return 'restart';
  }
  P = M.newPlayer(G.checkpoint.x, G.checkpoint.y); P.hitT = 0; G.health = 3; CAMR = M.newCamera(G.inv.sdCard);
  if (B.on && !B.done){ B.step = Math.floor(B.step/3)*3; B.fitted = bossFittedFromStep(); B.trans = 0; }
  resetHazards();
  anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur;
  save();
}

// ---------- the Five-Axis Fault ----------
// Owner's revision (27 Sept): three service points on three levels (Drive on the floor, Coolant on the middle deck,
// Control on the top deck), each repaired three times, in one of three learnable orders. Both heads attack all the
// time: the first sweeps the level of the point being repaired, the second sweeps the level of the next point, half a
// cycle later. Every third repair finishes a round, which survives a lost life; a lost life restarts the current round.
const BX = () => L.boss.bounds[0];
const KINDS = ['bearing', 'seal', 'coupling'], KIND_NUM = { bearing:1, seal:2, coupling:3 };
const lerpP = (a, b, u) => ({ x:a.x + (b.x - a.x)*u, y:a.y + (b.y - a.y)*u });
const bossSeq = () => (L.boss.orders[B.order] || L.boss.orders[0]).map(n => KINDS[n - 1]);
const bossSocket = kind => { const s = L.boss.sockets.find(s => s[2] === kind); return { x:s[0], y:s[1], kind }; };
const bossCycle = () => Object.values(L.boss.timeline).reduce((a, b) => a + b, 0);
const STEPS = { get length(){ return L ? bossSeq().length : 9; } };
function bossTarget(){
  const seq = bossSeq(); if (B.step >= seq.length) return null;
  const s = bossSocket(seq[B.step]);
  return { kind:s.kind, item:s.kind, x:s.x, y:s.y, num:KIND_NUM[s.kind] };
}
const park = side => { const p = L.boss.parks[side]; return { x:p[0], y:p[1] }; };
// One head's attack on one service point's level: tell, reach, sweep across the point, pull back, park.
function headAttack(side, kind, t){
  const tl = L.boss.timeline, s = bossSocket(kind), lane = s.y - 1.5, home = park(side);
  const lo = Math.max(BX() + 4, s.x - 4.5), hi = Math.min(BX() + 20.5, s.x + 4.5);
  const start = { x:side === 'left' ? lo : hi, y:lane }, end = { x:side === 'left' ? hi : lo, y:lane };
  let p = home, danger = false, warn = false;
  if (t < tl.tell) warn = true;
  else if ((t -= tl.tell) < tl.extend){ const u = t/tl.extend; p = lerpP(home, start, u); danger = u > .5; warn = true; }
  else if ((t -= tl.extend) < tl.sweep){ p = lerpP(start, end, t/tl.sweep); danger = true; }
  else if ((t -= tl.sweep) < tl.retract){ const u = t/tl.retract; p = lerpP(end, home, u); danger = u < .5; }
  return { ...p, side, danger, warn:warn ? [start.x, end.x, lane] : null };
}
// Both tips at machine time bt (defaults to now). Render, damage and the demo all use this one function.
function bossTips(bt){
  const t0 = bt === undefined ? B.t : bt, cyc = bossCycle(), out = { left:{ ...park('left'), side:'left' }, right:{ ...park('right'), side:'right' }, warns:[] };
  if (B.done){ out.left = { x:BX() + 5, y:3.4, side:'left' }; out.right = { x:BX() + 19, y:3.6, side:'right' }; }
  else if (B.on && B.trans <= 0){
    const seq = bossSeq(), now = seq[Math.min(B.step, seq.length - 1)], next = B.step + 1 < seq.length ? seq[B.step + 1] : seq[B.step - 1];   // on the last repair the second head covers the previous point
    const first = now === 'coupling' ? 'right' : 'left', second = first === 'left' ? 'right' : 'left';
    // The primary head repeats short cutting bursts; the secondary joins every other stroke.
    // The recovery beat leaves room to move between decks. Both begin with their visible tell.
    const run = (B.run || 0) + (t0 - B.t);
    const lag = L.boss.headLag === undefined ? cyc/2 : L.boss.headLag;
    const secondCycle = cyc*(L.boss.secondaryEvery || 1);
    const a = headAttack(first, now, ((t0 % cyc) + cyc) % cyc), b = run < lag ? { ...park(second), side:second, danger:false, warn:null } : headAttack(second, next, (((run - lag) % secondCycle) + secondCycle) % secondCycle);
    out[first] = a; out[second] = b; out.warns = [a.warn, b.warn].filter(Boolean);
  }
  return Object.assign([out.left, out.right], { warns:out.warns, warn:out.warns[0] ? out.warns[0].slice(0, 2) : null, left:out.left, right:out.right });
}
const kit = item => G.inv[item] + G.rec[item] - G.used[item];
function bossFittedFromStep(){ const f = { bearing:0, seal:0, coupling:0 }; bossSeq().slice(0, B.step).forEach(k => f[k]++); return f; }
function stepBoss(dt, dtm, inp){
  B.eligible = false;
  if (!B.on) return;
  if (B.done){ B.doneT += dt; if (B.doneT > 3.4 && !G.won) win(); return; }
  if (B.trans > 0){ B.trans -= dt; if (B.trans <= 0){ B.t = 0; B.run = 0; } }
  else { B.t = (B.t + dtm) % bossCycle(); B.run = (B.run || 0) + dtm; }
  const tg = bossTarget();
  B.eligible = !!tg && B.trans <= 0 && G.dead <= 0 && Math.abs(P.x - tg.x) <= 0.8 && P.ground && Math.abs(P.y - tg.y) < .15;
  // Holding Fix at the wrong point gives a soft refusal, so the order can be learned by ear as well as by eye.
  const wrongAt = L.boss.sockets.find(s => Math.abs(P.x - s[0]) <= .8 && Math.abs(P.y - s[1]) < .15);
  if (!B.eligible && inp.fix && P.ground && !B.wrongT && wrongAt){ AU.play('refuse'); B.wrongT = .6; B.wrongKind = wrongAt[2]; }
  B.wrongT = Math.max(0, (B.wrongT || 0) - dt);
  const fixing = B.eligible && inp.fix && !inp.left && !inp.right && !inp.jump && Math.abs(P.vx) < 0.05 && P.hitT >= 0.25;
  if (!fixing){ B.fix = 0; return; }
  const before = Math.floor(B.fix*6);
  B.fix += dt/L.boss.hold;
  if (Math.floor(B.fix*6) > before) AU.play('repairTick');
  if (B.fix < 1) return;
  // Service points use Mike's tools. Salvage is never required or consumed.
  B.fix = 0; B.step++; B.fitted = bossFittedFromStep();
  AU.play('repair'); G.fx.push({ kind:'text', x:tg.x, y:tg.y - 3.8, text:'Repaired!', t:0, life:.9 });
  if (B.step >= bossSeq().length){ B.done = true; B.doneT = 0; G.score += 1000; AU.play('chord'); AU.say('power'); AU.boss(false); if (CAMR.on){ CAMR.on = false; AU.hum(false); } }
  else if (B.step % 3 === 0){ B.trans = 1.2; AU.play('checkpoint'); G.fx.push({ kind:'text', x:BX() + 12, y:3.2, text:'Round ' + (B.step/3) + ' of 3 done', t:0, life:1.4 }); }
  save();
}
function liveBossState(){
  const tips = bossTips(), tg = bossTarget();
  return { left:tips.left, right:tips.right, warns:tips.warns, fitted:B.fitted, units:B.units, restored:B.done, seq:bossSeq(), step:B.step,
    target:B.on && tg && B.trans <= 0 ? tg.kind : null, fix:B.fix > 0 && tg ? { socket:tg.kind, u:B.fix } : null,
    wrong:B.wrongT > 0 && B.wrongKind ? { kind:B.wrongKind, t:B.wrongT } : null };
}
function win(){
  G.won = true; clearSave();
  const prog = loadProgress(); prog.completed = true; prog.best = Math.max(prog.best || 0, G.score); prog.bestSalvage=Math.max(prog.bestSalvage||0,salvageCount());
  prog.bossRuns = (prog.bossRuns || 0) + 1;                // the next run meets the next of the three orders
  saveProgress(prog);
  if (G.spec === 'full') M.campaign.award('level-1', G.score);      // the score joins the campaign total; the first finish earns a continue
  G.results = { score:G.score, parts:G.inv.bearing + G.inv.seal + G.inv.coupling, units:G.inv.controlUnit, sd:G.inv.sdCard, mini:G.inv.miniMike,
    time:G.time, lost:G.livesLost, cont:G.continues };
  G.mode = 'results'; document.body.dataset.mode = 'results'; menu('results');
  document.body.dataset.done = '1';
}

// ---------- the step ----------
function update(dt){
  const inp = readInput();
  G.lookDown = !!inp.lookDown;
  const jumpEdge = inp.jump && !prevInp.jump, camEdge = inp.camera && !prevInp.camera;
  prevInp = { jump:inp.jump, camera:inp.camera };
  const wasOn = CAMR.on, left0 = CAMR.left, refused0 = CAMR.refused;
  CAMR.boss = B.on && !B.done;                              // in the boss the camera shoots in clips (world.js)
  G.ts = M.stepCamera(CAMR, camEdge && !B.done, dt);
  if (CAMR.on !== wasOn){ AU.play(CAMR.on ? 'camOn' : 'camOff'); AU.hum(CAMR.on); }
  if (CAMR.refused > refused0) AU.play('refuse');
  if (CAMR.on && left0 > 1 && CAMR.left <= 1) AU.play('lowCharge');
  const dtm = dt*G.ts;
  stepHazards(dtm);
  if (G.dead > 0){                                          // a short pause, then the latest checkpoint
    G.dead -= dt; if (G.dead <= 0 && respawn() === 'restart') return;          // the level or the game started again: nothing more this step
  } else {
    const air0 = P.airTime, jumps0 = P.jumpedAt;
    const drive = B.done ? {} : inp;
    M.stepPlayer(L, P, { left:drive.left, right:drive.right, jump:drive.jump, jumpEdge:jumpEdge && !B.done }, dt, G.bounds, G.extra, beltSurface);
    if (P.jumpedAt !== jumps0) AU.play('jump');
    if (P.landT === 0 && air0 > .2) AU.play('land');
    damage();
    if (G.dead <= 0 && P.y > PH.deathY + 1.5) loseLife();
  }
  G.mt += dtm; G.t += dt; if (!B.done) G.time += dt;
  if (G.card > 0) G.card -= dt;
  if (G.toast && (G.toast.t += dt) > G.toast.life) G.toast = null;
  if (G.dead <= 0){
    for (const p of L.pickups){                             // each unique pickup scores once
      if (G.got.has(p.id) || p.x < G.bounds[0] || p.x > G.bounds[1]) continue;
      if (Math.abs(p.x - P.x) < PH.halfW + .45 && p.y + .45 > P.y - PH.height && p.y - .45 < P.y) collect(p);
    }
    for (const c of L.checkpoints) if (!G.lit.has(c.x) && Math.abs(P.x - c.x) < .6 && P.ground && c.x >= G.bounds[0] && c.x <= G.bounds[1]){
      G.lit.add(c.x); G.checkpoint = c; G.health = 3; CAMR.left = CAMR.cap; AU.play('checkpoint'); save(); }
    for (const tr of L.triggers) if (tr.event === 'arena' && !B.on && P.x >= tr.x && tr.x < G.bounds[1]){ B.on = true; B.t = 0; AU.boss(true); AU.say('boss',true); B.run = 0; }
  }
  stepBoss(dt, dtm, inp);
  if (G.score > (G.lastScore || 0)){ G.scorePop = 1; if (!G.newBest && G.bestAtStart > 0 && G.score > G.bestAtStart){ G.newBest = true; G.milestone = { title:'NEW HIGH SCORE!', sub:'BEAT ' + G.bestAtStart.toLocaleString('en-GB'), t:0, life:2.2, gold:true }; AU.play('checkpoint'); } }
  G.lastScore = G.score; G.scorePop = Math.max(0, (G.scorePop || 0) - dt*3);
  if (G.milestone && (G.milestone.t += dt) > G.milestone.life) G.milestone = null;
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life);
  if (G.fx.length > 40) G.fx.splice(0, G.fx.length - 40);
  animate(dt);
  follow(dt);
  if (P.x >= BX()) G.camX = BX()*T;                       // the boss arena: one fixed frame
  const tc = $('tc-fix'); if (tc) tc.classList.toggle('show', B.on&&!B.done);
  G.shake = Math.max(0,(G.shake||0)-dt);
}
const POINTS = { bearing:100, seal:100, coupling:100, lubricant:50, controlUnit:250, sdCard:100, miniMike:500 };
function collect(p){
  G.got.add(p.id); G.score += POINTS[p.type]; G.inv[p.type]++;
  if (p.type === 'lubricant'){ G.health = Math.min(3, G.health + 1); AU.play('lube'); }
  else if (p.type === 'miniMike'){ G.lives = Math.min(9, G.lives + 1); AU.play('sd'); }
  else if (p.type === 'sdCard'){ CAMR.cap = M.cameraCapacity(G.inv.sdCard); CAMR.left = Math.min(CAMR.cap, CAMR.left + M.CAMERA.perCard); AU.play('unit'); }
  else AU.play(p.type === 'controlUnit' ? 'unit' : 'part');
  if (['miniMike','sdCard','lubricant','controlUnit'].includes(p.type)) AU.say('power');
  for (let i = 0; i < 8; i++) G.fx.push({ kind:'spark', x:p.x, y:p.y, a:i/8*Math.PI*2, t:0, life:.45 });
  const said = { lubricant:'+1 HEALTH', sdCard:'+1.5s FOOTAGE', miniMike:'EXTRA LIFE' }[p.type];
  G.fx.push({ kind:'text', x:p.x, y:p.y - .6, text:said || '+' + POINTS[p.type], t:0, life:said ? 1.1 : .8, color:said ? A.POWER[p.type].ring : null });
  if(L.salvageTypes.includes(p.type)){
    const n = salvageCount(), step = Math.floor(n/10);
    if (step > G.bonusStep){                                // 10, 20, 30, 40, 50: +250, +500, +750, +1,000, +1,250
      G.bonusStep = step; const bonus = 250*step; G.score += bonus;
      G.milestone = { title:n + ' SALVAGE', sub:'BONUS +' + bonus.toLocaleString('en-GB'), t:0, life:1.9 }; AU.play('sd'); AU.say('power');
    }
    const progress=loadProgress();progress.bestSalvage=Math.max(progress.bestSalvage||0,salvageCount());saveProgress(progress);
    if(salvageCount()===L.salvageTotal){G.score+=1000;G.milestone={title:'FULL COLLECTION',sub:'BONUS +1,000',t:0,life:2.4};AU.say('power');}
  }
  save();
}
function salvageCount(){return L.salvageTypes.reduce((n,k)=>n+(G.inv[k]||0),0);}
function follow(dt){
  const normalY = Math.max(-12*T, Math.min(BASE_CAM_Y, P.y*T - VH*.70));
  // Holding Down/S reveals up to five extra tiles below, while keeping Mike in view.
  // Stop at the normal floor framing instead of panning into the empty under-floor area.
  const targetY = Math.min(BASE_CAM_Y,normalY+(G.lookDown?5*T:0),P.y*T-4*T);
  CAM_Y += (targetY-CAM_Y)*(1-Math.exp(-dt/0.16));
  // 4T directional look-ahead, smoothed over 0.15 s
  G.look += (P.facing*4 - G.look)*(1 - Math.exp(-dt/0.15));
  const x = (P.x + G.look)*T - VW/2;
  G.camX = Math.max(G.bounds[0]*T, Math.min(G.bounds[1]*T - VW, x));
}
function animate(dt){
  const moving = Math.abs(P.vx + (P.ground ? P.beltV : 0)) > 0.4;
  let st;
  if (B.done) st = 'wave';
  else if (P.hitT < 0.25) st = 'hit';
  else if (!P.ground) st = P.vy < 0 ? 'jump' : 'fall';
  else if (B.fix > 0) st = 'fix';
  else if (P.landT < PH.landHold + PH.landRecover && Math.abs(P.vx) < 3) st = 'land';
  else if (moving) st = 'run';
  else st = anim.idle > 3 ? 'wave' : 'idle';
  anim.idle = st === 'idle' ? anim.idle + dt : st === 'wave' ? anim.idle + dt : 0;
  if (st === 'wave' && anim.idle > 3.6 && !B.done) anim.idle = 0;          // a 0.6 s wave after three idle seconds
  const p0 = anim.phase;
  anim.phase += Math.abs((P.vx + (P.ground ? P.beltV : 0))*dt)/3*Math.PI*2;   // one stride per 3T travelled
  if (st === 'run' && Math.floor(anim.phase/Math.PI) !== Math.floor(p0/Math.PI)) AU.play('step');
  if (st !== anim.st){ anim.from = anim.cur; anim.blend = 0; anim.st = st; anim.s = 0; }
  anim.s += dt; anim.blend = Math.min(1, anim.blend + dt/0.08);
  const target = M.puppet.pose(st, anim.phase, anim.s, { camera:CAMR.on && st !== 'fix', away:-(P.hitAway || 1) });
  anim.cur = M.puppet.lerp(anim.from, target, anim.blend);
  const tt = P.facing*(moving || !P.ground ? 30 : 12);
  anim.turn += (tt - anim.turn)*(1 - Math.exp(-dt/0.12));
  anim.cur.turn = anim.turn;
}

// ---------- rendering ----------
function chunk(i){
  let cv = chunks.get(i);
  if (!cv){
    cv = document.createElement('canvas'); cv.width = Math.ceil(512*Z); cv.height = Math.ceil(29*T*Z);
    const c = cv.getContext('2d'); c.scale(Z, Z); c.translate(-i*512, 12*T); A.drawStatic(c, L, i*512, i*512 + 512);
    chunks.set(i, cv);
    if (chunks.size > 6) chunks.delete(chunks.keys().next().value);
  }
  return cv;
}
function drawChunks(c, x0, x1){ for (let i = Math.floor(x0/512); i <= Math.floor((x1 - 1)/512); i++) c.drawImage(chunk(i), i*512, -12*T, 512, 29*T); }
function drawBackdrop(c, camX){
  if (A.nightBackdrop){ A.nightBackdrop(c,camX,CAM_Y,G.t,G.lowQ); return; }
  // the backdrop is scaled with the world so its floor line meets the real floor
  c.save(); c.translate(0, FLOOR_SCREEN - 380*Z); c.scale(Z, Z);
  const fx = -((camX*0.15) % far.width);
  c.drawImage(far, Math.floor(fx), 0); c.drawImage(far, Math.floor(fx) + far.width, 0);
  if (!G.lowQ){ const px = -((camX*0.35) % pipes.width); c.drawImage(pipes, Math.floor(px), 0); c.drawImage(pipes, Math.floor(px) + pipes.width, 0); }
  c.restore();
}
const isTouch = () => document.body.classList.contains('touch');
function drawWorld(c, camX, opts){
  opts = opts || {};
  const x0 = camX, x1 = camX + VW, vis = (a, b) => b*T > x0 - 96 && a*T < x1 + 96, slow = !!(CAMR.on || G.slowShow);
  c.save(); c.scale(Z, Z); c.translate(-Math.round(camX*Z)/Z, -CAM_Y);
  if (A.workshopDetail) A.workshopDetail(c,L,camX,VW,G.mt,CAM_Y);
  for (const b of L.backdrop) if (b.window && vis(b.window[0], b.window[0] + b.window[2]))
    A.viewWindow(c, b.window, () => A.bossSilhouette(c, camX + VW/2 + (b.x*T - camX - VW/2)*b.depth, b.y*T, .6, G.t));
  for (const h of L.hazards) if (h.type === 'coolant' && vis(h.base[0] - 4, h.base[0] + 2)) A.coolantBack(c, h);
  drawChunks(c, x0, x1);
  if (A.machineSupports) A.machineSupports(c, L, camX, VW);   // why machines stand off the floor: columns from the sump, in front of the pit's dark
  for(const lift of L.lifts)if(vis(lift.at[0]-1,lift.at[0]+lift.w+1))A.serviceLift(c,lift,M.liftPose(lift,G.mt),G.mt);
  for (const g of L.signs) if (vis(g.x - 5, g.x + 5)) A.drawSign(c, g, isTouch());
  for (const d of L.decor) if (d.type === 'demoDrill' && vis(d.x - 2, d.x + 2)) A.pillarDrill(c, d, M.drillPose(d, G.mt), G.mt, slow);
  for (const b of L.belts) if (vis(b.x0, b.x1)){
    const pos = G.beltPos ? G.beltPos[b.id] : G.mt*b.dir*b.speed;
    A.drawBelt(c, b, pos, b.dir*b.speed*(G.beltPos ? beltProfile(b) : 1), G.beltPos ? beltWarn(b) : false, G.t);
  }
  for (const cp of L.checkpoints) if (vis(cp.x - 1, cp.x + 1)) A.drawCheckpoint(c, cp.x, cp.y, G.lit.has(cp.x), G.t);
  for (const h of L.hazards){
    const r = h.rect || h.base; if (!vis(r[0] - 4, r[0] + r[2] + 6)) continue;
    const t = hazT(h);
    if (h.type === 'spitter') A.spitter(c, h, t, slow);
    else if (h.type === 'spitterGallery') A.gallery(c, h, t, slow);
    else if (h.type === 'armGate') A.armGate(c, h, t, slow, G.armPose || armPose(h, t));
    else if (h.type === 'coolant') A.coolant(c, h, t, slow);
    else if (h.type === 'jaws') A.jaws(c, h, t, slow, G.jawsU !== undefined ? G.jawsU : jawsU(h, t));
    else if (h.type === 'railSpindle') A.railSpindle(c,h,t,slow);
    if (isGate(h)){
      const st = gateState(h, t), hint = st === 'amber' && !CAMR.on && !G.slowShow && P && P.x < r[0] && r[0] - P.x < 4.5;
      A.gateSignal(c, r[0] - 0.45, st, hint, G.t);
    }
  }
  if (vis(BX(), BX() + L.boss.bounds[2])) A.turner(c, L.boss, Object.assign({ slow }, G.boss || liveBossState()), G.t);
  // the arena's service decks sit in front of the machine enclosure
  if (vis(BX(), BX() + L.boss.bounds[2])) for (const sd of L.solids) if (sd.kind === 'shelf' && sd.x >= BX() && sd.x < BX() + L.boss.bounds[2]) A.drawShelf(c, sd);
  for (const d of L.decor) if (d.type === 'exitDoor' && vis(d.x - 1, d.x + 1)){
    const up = B.done ? Math.min(1, B.doneT/1.5)*4.3 : 0; A.drawDoor(c, d.x - 0.2, 7.5, up);
    A.circ(c, (d.x + 0.25)*T, 6.8*T, 6); c.fillStyle = B.done ? '#35C06A' : '#E8503A'; c.fill(); A.ink(c, 2);
  }
  for (const d of G.doors) A.drawDoor(c, d.x, d.top);
  for (const p of L.pickups) if (!G.got.has(p.id) && vis(p.x - 1, p.x + 1)){
    if (p.hidden && (!P || Math.hypot(P.x-p.x,P.y-p.y)>4)) continue;
    if (p.type === 'miniMike') drawMiniMike(c, p, G.t); else A.drawPickup(c, p, G.t);
  }
  G.af = null;
  if (opts.mike !== false && P && G.dead <= 0) drawMike(c, P.x, P.y, anim.cur, P.facing, P.hitT < INVULN);
  if (opts.extraMike) for (const m of opts.extraMike) drawMike(c, m.x, m.y, m.pose, m.facing || 1);
  A.shots(c, G.shots);
  if (A.secretGrille) A.secretGrille(c,L,P,G.got,camX,VW);
  for (const f of G.fx){
    if (f.t < 0) continue;
    const u = f.t/f.life;
    if (f.kind === 'spark'){ if (G.lowQ) continue; c.fillStyle = `rgba(255,255,255,${1 - u})`; A.circ(c, f.x*T + Math.cos(f.a)*u*34, f.y*T + Math.sin(f.a)*u*34, 3.5*(1 - u) + 1); c.fill(); }
    else if (f.kind === 'text'){ c.save(); c.globalAlpha = 1 - u; c.fillStyle = f.color || '#fff'; c.font = `${f.color ? 900 : 700} 22px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,20,40,.7)'; c.strokeText(f.text, f.x*T, f.y*T - u*30); c.fillText(f.text, f.x*T, f.y*T - u*30); c.restore(); }
    else if (f.kind === 'give'){ c.save(); c.globalAlpha = Math.min(1, 2*(1 - u)); A.pickupIcon(c, f.type, f.x*T + Math.sin(u*6)*10, f.y*T - u*70, 1.2); c.restore(); }
  }
  if (LAB && P){ c.strokeStyle = '#0f0'; c.lineWidth = 1; c.strokeRect((P.x - PH.halfW)*T, (P.y - PH.height)*T, 2*PH.halfW*T, PH.height*T);
    for (const e of G.extra) c.strokeRect(e.x*T, e.y*T, e.w*T, e.h*T); }
  c.restore();
}
// The extra life: a mini Mike the Mic, drawn from the same puppet, waving.
function drawMiniMike(c, p, t){
  const x = p.x*T, y = p.y*T + Math.sin(t*3 + p.x)*3;
  A.powerBubble(c, x, y, 'miniMike', t);
  M.puppet.draw(c, rig, pose('wave', 0, t, null, -10), x, y + 17, 36, { facing:1 });
}
function drawMike(c, x, y, pose, facing, protectedNow){
  // hit protection: a steady pale outline
  if (protectedNow){ c.save(); c.shadowColor = 'rgba(255,255,255,.95)'; c.shadowBlur = 10; }
  M.puppet.draw(c, rig, pose, x*T, y*T, 2*T, { facing });
  if (protectedNow) c.restore();
  G.af = { x, y };
}
const toScreen = (x, y) => ({ x:(x*T - Math.round(G.camX*Z)/Z)*Z, y:(y*T - CAM_Y)*Z });

// The camera's view while slow motion runs: a camcorder viewfinder. Nothing covers play: a frame, heavy corner
// brackets, REC, 120 FPS, the seconds of footage left on the card, a focus box on Mike, a light vignette.
function drawViewfinder(c){
  c.save();
  const g = c.createRadialGradient(W/2, H/2, H*.42, W/2, H/2, H*1.02); g.addColorStop(0, 'rgba(0,12,28,0)'); g.addColorStop(1, 'rgba(0,12,28,.42)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5; c.strokeRect(30.5, 30.5, W - 61, H - 61);
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2;
  for (const x of [W/3, 2*W/3]){ c.beginPath(); c.moveTo(x, 30); c.lineTo(x, 44); c.moveTo(x, H - 30); c.lineTo(x, H - 44); c.stroke(); }
  for (const y of [H/3, 2*H/3]){ c.beginPath(); c.moveTo(30, y); c.lineTo(44, y); c.moveTo(W - 30, y); c.lineTo(W - 44, y); c.stroke(); }
  const m = 16, l = 70;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]){
    c.lineCap = 'square'; c.beginPath(); c.moveTo(x, y + dy*l); c.lineTo(x, y); c.lineTo(x + dx*l, y);
    c.strokeStyle = 'rgba(0,20,40,.6)'; c.lineWidth = 12; c.stroke(); c.strokeStyle = C.white; c.lineWidth = 7; c.stroke();
  }
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4; c.textBaseline = 'middle';
  if (Math.floor(G.t*2.5) % 2 === 0 || G.slowShow){ c.fillStyle = '#FF2A2A'; A.circ(c, 64, 62, 11); c.fill(); }
  c.fillStyle = C.white; c.font = `900 28px ${FONT}`; c.textAlign = 'left'; c.fillText('REC', 84, 63);
  c.textAlign = 'right'; c.font = `900 28px ${FONT}`; c.fillText('120 FPS', W - 58, 63);
  c.font = `700 18px ${FONT}`; c.fillText('SLOW ×0.2', W - 58, 92);
  // footage left on the card: the slow-motion counter
  const left = G.slowShow ? G.slowShow.left : M.cameraSeconds(CAMR), cap = G.slowShow ? G.slowShow.cap : M.cameraSeconds(CAMR, CAMR.cap), low = left <= 1;
  // (kept at the top, clear of the touch buttons in the bottom corners)
  c.save(); c.translate(68, 116); c.scale(1.4, 1.4); A.pickupIcon(c, 'sdCard', 0, 0, 1); c.restore();
  c.fillStyle = low && Math.floor(G.t*6) % 2 ? '#FF2A2A' : C.white; c.textAlign = 'left';
  const clip = CAMR.boss && !G.slowShow ? M.clipRemaining(CAMR) : null;
  c.font = `700 30px ui-monospace,Menlo,Consolas,monospace`; c.fillText((clip === null ? left : clip).toFixed(1) + 's', 96, 110);
  c.font = `700 14px ${FONT}`; c.fillStyle = C.white; c.fillText(clip === null ? 'LEFT ON CARD' : 'LEFT IN THIS CLIP', 97, 134);
  c.shadowBlur = 0;
  const bw = 150, bx = W - 58 - bw, by = 112;
  A.rr(c, bx, by, bw, 14, 5); c.fillStyle = 'rgba(0,20,40,.55)'; c.fill();
  A.rr(c, bx, by, Math.max(6, bw*left/cap), 14, 5); c.fillStyle = low ? '#FF2A2A' : C.white; c.fill();
  c.strokeStyle = C.white; c.lineWidth = 2; A.rr(c, bx, by, bw, 14, 5); c.stroke();
  if (clip !== null){ c.fillStyle = 'rgba(0,20,40,.8)'; for (let s = M.CLIP.length; s < cap - .01; s += M.CLIP.length) c.fillRect(bx + bw*s/cap - 1.5, by - 3, 3, 20); }
  c.fillStyle = C.white; c.font = `700 14px ${FONT}`; c.textAlign = 'right'; c.fillText(clip === null ? `${cap.toFixed(1)}s CARD` : `${M.spareClips(CAMR)} MORE CLIP${M.spareClips(CAMR) === 1 ? '' : 'S'}`, W - 58, by + 30);
  if (G.af){
    const s = toScreen(G.af.x, G.af.y), w = 74, h = 104, x = s.x - w/2, y = s.y - h - 4, k = 16, p = 1 + .03*Math.sin(G.t*8);
    c.save(); c.translate(s.x, y + h/2); c.scale(p, p); c.translate(-s.x, -(y + h/2));
    c.strokeStyle = '#7CFF9A'; c.lineWidth = 3; c.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]){ c.moveTo(cx, cy + dy*k); c.lineTo(cx, cy); c.lineTo(cx + dx*k, cy); }
    c.stroke(); c.restore();
  }
  c.restore();
}
// The HUD (design section 9). Labels >= 22px. It steps aside while the camera is filming.
function hud(c){
  c.save(); c.textBaseline = 'middle';
  A.rr(c, 12, 10, 410, 68, 14); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill();
  for (let i = 0; i < 3; i++){ A.circ(c, 36 + i*26, 34, 9); c.fillStyle = i < G.health ? C.white : 'rgba(255,255,255,0)'; c.fill(); c.strokeStyle = C.white; c.lineWidth = 3; c.stroke(); }
  M.puppet.draw(c, rig, pose('idle', 0, 0, null, 0), 126, 50, 32, { facing:1 });
  c.fillStyle = C.white; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.fillText('× ' + G.lives, 144, 35);
  const cont = M.campaign.continues;
  if (cont > 0){ A.rr(c, 12, 112, 128, 22, 11); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill(); c.fillStyle = '#FFE066'; c.font = `700 12px ${FONT}`; c.fillText('CONTINUES × ' + cont, 24, 123); }
  c.font = `600 13px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('SALVAGE', 198, 35);
  c.font = `700 23px ${FONT}`; c.fillStyle = C.white; c.fillText(salvageCount()+'/'+L.salvageTotal, 275, 35);
  c.fillStyle='#284851';c.fillRect(30,59,370,4);c.fillStyle='#a4e8d5';c.fillRect(30,59,370*salvageCount()/L.salvageTotal,4);
  // salvage milestone ticks every 10
  c.fillStyle='rgba(255,255,255,.55)';for(let m=10;m<L.salvageTotal;m+=10)c.fillRect(30+370*m/L.salvageTotal-1,56,2,10);
  c.fillStyle = 'rgba(0,44,90,.82)'; A.rr(c, 12, 74, 250, 34, 12); c.fill();
  c.font = `600 13px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('SCORE', 30, 92);
  const gold = G.newBest, flash = gold && Math.sin(G.t*10) > 0, pop = 1 + .35*(G.scorePop || 0);
  c.save(); c.translate(84, 92); c.scale(pop, pop); c.font = `900 22px ${FONT}`; c.fillStyle = gold ? (flash ? '#FFE066' : '#FFB84D') : C.white;
  c.fillText(G.score.toLocaleString('en-GB'), 0, 1); c.restore();
  if (gold){ c.font = `900 11px ${FONT}`; c.fillStyle = flash ? '#FFE066' : 'rgba(255,224,102,.6)'; c.fillText('NEW BEST', 196, 92); }
  // the camera: footage left on the SD card, in seconds
  const bx = W - 262, by = 10, low = CAMR.left < M.CAMERA.min;
  A.rr(c, bx, by, 250, 56, 14); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill();
  A.cameraIcon(c, bx + 28, by + 28, 1, C.white);
  A.pickupIcon(c, 'sdCard', bx + 64, by + 28, .9);
  c.fillStyle = low ? 'rgba(255,255,255,.5)' : C.white; c.font = `700 24px ui-monospace,Menlo,Consolas,monospace`; c.textAlign = 'left';
  c.fillText(M.cameraSeconds(CAMR).toFixed(1) + 's', bx + 84, by + 29);
  const mx = bx + 162, my = by + 20, mw = 76, mh = 16;
  A.rr(c, mx, my, mw, mh, 5); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
  if (CAMR.left > 0){ A.rr(c, mx, my, Math.max(6, mw*CAMR.left/CAMR.cap), mh, 5); c.fillStyle = low ? 'rgba(255,255,255,.4)' : C.white; c.fill(); }
  c.strokeStyle = C.white; c.lineWidth = 2; A.rr(c, mx, my, mw, mh, 5); c.stroke();
  if (CAMR.boss){ c.fillStyle = C.navy; for (let s = M.CLIP.cost; s < CAMR.cap - .01; s += M.CLIP.cost) c.fillRect(mx + mw*s/CAMR.cap - 1.5, my - 3, 3, mh + 6); }
  if (CAMR.refused > 0){ c.fillStyle = C.white; c.font = `700 14px ${FONT}`; c.fillText('Card busy', mx, by + 47); }
  c.restore();
}
function drawOverlay(c){
  if (CAMR.on || G.slowShow) drawViewfinder(c); else hud(c);
  if (A.journeyHUD) A.journeyHUD(c,L,P,G,B);
  if (B.on&&!B.done){
    c.save();c.fillStyle='rgba(7,18,27,.94)'; A.rr(c,246,432,468,74,10);c.fill();
    c.fillStyle='#fff'; c.font=`700 23px ${FONT}`; c.textAlign='center';
    c.fillText(isTouch()?'Hold the wrench to Fix':'Hold E to Fix',480,460);
    c.fillStyle='#a9d1d3';c.font=`500 13px ${FONT}`;
    c.fillText(B.fix>0?'Stay still. Release or a hit cancels.':'Go to the flashing service point and hold.',480,480);
    c.font=`600 11px ${FONT}`;c.fillStyle='#7f9eac';c.fillText('SALVAGE IS YOUR COLLECTION · REPAIRS DO NOT SPEND IT',480,497);c.restore();
  }
  if (G.card > 0){                                          // the level card: supplied lock-up, unchanged
    const a = Math.min(1, G.card/0.5, (2.8 - G.card)/0.3 + .001);
    c.save(); c.globalAlpha = Math.max(0, a);
    A.rr(c, W/2 - 230, 130, 460, 150, 20); c.fillStyle = C.white; c.fill();
    c.drawImage(lockRed, W/2 - 110, 150, 220, 220*lockRed.height/lockRed.width);
    c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `900 34px ${FONT}`; c.fillText('Level 1', W/2, 236);
    c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.fillText('The Night Shift', W/2, 264);
    c.restore();
  }
  if (G.milestone){
    const m = G.milestone, u = m.t, fade = Math.min(1, (m.life - u)/.35), s = u < .35 ? 1 + .35*Math.sin(u/.35*Math.PI)*(1 - u/.35) + (u/.35 - 1)*.0 : 1;
    const grow = Math.min(1, u/.18);
    c.save(); c.globalAlpha = fade; c.translate(W/2, 214); c.scale(grow*s, grow*s);
    A.rr(c, -170, -48, 340, 96, 18); c.fillStyle = m.gold ? 'rgba(90,60,0,.92)' : 'rgba(0,44,90,.92)'; c.fill();
    c.lineWidth = 4; c.strokeStyle = m.gold ? '#FFE066' : '#a4e8d5'; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = m.gold ? '#FFE066' : C.white; c.font = `900 34px ${FONT}`; c.fillText(m.title, 0, -12);
    c.fillStyle = m.gold ? '#fff' : '#FFE066'; c.font = `900 24px ${FONT}`; c.fillText(m.sub, 0, 24); c.restore();
  }
  if (G.toast){
    const a = Math.min(1, (G.toast.life - G.toast.t)/0.4);
    c.save(); c.globalAlpha = a; c.font = `700 22px ${FONT}`; const w = c.measureText(G.toast.text).width + 40;
    A.rr(c, W/2 - w/2, H - 74, w, 44, 22); c.fillStyle = 'rgba(0,44,90,.9)'; c.fill();
    c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(G.toast.text, W/2, H - 51); c.restore();
  }
}

// ---------- results ----------
const clock = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function drawResultsCard(c, r){
  c.fillStyle = 'rgba(0,44,90,.25)'; c.fillRect(0, 0, W, H);
  A.rr(c, 32, 28, 520, 484, 22); c.fillStyle = C.white; c.fill();
  c.drawImage(lockRed, 66, 56, 200, 200*lockRed.height/lockRed.width);
  headline(c, 'Workshop bay restored', 64, 148, 456, 48, C.navy);
  c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('The Five-Axis Fault is running sweetly.', 66, 182);
  const total=types=>L.pickups.filter(p=>types.includes(p.type)).length;
  const rows = [['Score', r.score.toLocaleString('en-GB')], ['Salvage collection', (r.parts+r.units) + ' / '+L.salvageTotal], ['Best collection', Math.max(loadProgress().bestSalvage||0,r.parts+r.units)+' / '+L.salvageTotal], ['SD cards', r.sd + ' / '+total(['sdCard'])], ['Mini Mike', r.mini + ' / 1'],
    ['Time', clock(r.time)], ['Lives lost', String(r.lost)], ['Continues', String(r.cont)]];
  rows.forEach(([k, v], i) => { const y = 214 + i*26;
    c.font = `600 22px ${FONT}`; c.fillStyle = '#34414F'; c.textAlign = 'left'; c.fillText(k, 66, y);
    c.font = `700 22px ${FONT}`; c.fillStyle = C.navy; c.textAlign = 'right'; c.fillText(v, 516, y);
    c.strokeStyle = 'rgba(0,44,90,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(66, y + 9); c.lineTo(516, y + 9); c.stroke(); });
  c.fillStyle='rgba(6,23,34,.94)';A.rr(c,578,334,352,157,12);c.fill();
  c.textAlign='left';c.fillStyle='#85dcd4';c.font=`600 12px ${FONT}`;c.fillText('NEXT LEVEL CONCEPT',600,361);
  c.fillStyle='#edf4f5';c.font=`800 27px ${FONT}`;c.fillText('Below the wire',600,396);
  c.fillStyle='#a9c5ce';c.font=`500 15px ${FONT}`;c.fillText('A flooded EDM cell. A sealed service suit.',600,428);c.fillText('Wire guides, fluid locks and a rising tide.',600,452);
}

// ---------- draw, lab, loop ----------
const perf = { work:[], frame:[], slow:0 };
function draw(){
  if (!L) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.mode === 'play'){ drawBackdrop(ctx, G.camX); ctx.save(); if(G.shake)ctx.translate(Math.sin(G.t*95)*G.shake*12,Math.cos(G.t*81)*G.shake*7); drawWorld(ctx, G.camX); ctx.restore(); drawOverlay(ctx); if (LAB) labText(); }
  else if (G.mode === 'results'){ drawBackdrop(ctx, G.camX); drawWorld(ctx, G.camX); drawResultsCard(ctx, G.results); }
  else if (SCENE_DRAW) SCENE_DRAW(ctx);
}
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length*p))]; };
function labText(){
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(12, H - 92, 560, 80); ctx.fillStyle = '#fff'; ctx.font = '13px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`x ${P.x.toFixed(2)} y ${P.y.toFixed(2)} vx ${P.vx.toFixed(2)} vy ${P.vy.toFixed(2)} ${P.ground ? 'ground' : 'air'} belt ${P.beltV.toFixed(2)}`, 20, H - 72);
  ctx.fillText(`state ${anim.st} cam ${CAMR.charge.toFixed(0)} ${CAMR.on ? 'ON' : ''} machine ${G.mt.toFixed(2)} boss ${B.on ? 'step ' + B.step + ' t ' + B.t.toFixed(1) : 'off'}`, 20, H - 54);
  ctx.fillText(`frame p50 ${pct(perf.frame, .5).toFixed(1)} p95 ${pct(perf.frame, .95).toFixed(1)} ms · work p50 ${pct(perf.work, .5).toFixed(1)} p95 ${pct(perf.work, .95).toFixed(1)} ms`, 20, H - 36);
  ctx.fillText(`chunks ${chunks.size} fx ${G.fx.length} shots ${G.shots.length} quality ${G.lowQ ? 'reduced' : 'full'}`, 20, H - 18); ctx.restore();
}
let acc = 0, last = 0, manual = TEST;
function frame(now){
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.25, (now - last)/1000) : 0; last = now;
  const t0 = performance.now();
  if (G.mode === 'play' && !G.paused && !manual && !(isTouch() && document.body.classList.contains('portrait'))){
    acc += dt; let n = 0;
    while (acc >= STEP && n < PH.maxSteps && G.mode === 'play'){ if (DEMO) testInput = M.demo.next(api()); update(STEP); acc -= STEP; n++; }
    if (n === PH.maxSteps) acc = 0;                         // discard the excess after a stall
  }
  if (SCENE_ANIM) G.t += dt;
  if (G.mode === 'play' || G.mode === 'results' || SCENE_ANIM) draw();
  const work = performance.now() - t0;
  if (G.mode === 'play' && dt){
    perf.work.push(work); perf.frame.push(dt*1000); if (perf.work.length > 300){ perf.work.shift(); perf.frame.shift(); }
    // after 90 slow frames, cut parallax and particles only; physics, tells and collisions never change
    perf.slow = work > 12 ? perf.slow + 1 : 0; if (perf.slow > 90) G.lowQ = true;
  }
}

// ---------- scenes: one still frame of the real level at a named spot ----------
let SCENE_DRAW = null, SCENE_ANIM = false;
const pose = (st, p, s, ex, turn) => { const o = M.puppet.pose(st, p || 0, s || 0, ex); o.turn = turn || 0; return o; };
function worldScene(centre, mike, set){
  G.mode = 'scene'; P = null;
  CAM_Y = mike ? Math.min(BASE_CAM_Y,mike.y*T-VH*.7) : BASE_CAM_Y;
  G.camX = Math.max(0, Math.min(L.W*T - VW, centre*T - VW/2));
  Object.assign(G, set || {});
  SCENE_DRAW = c => { drawBackdrop(c, G.camX); drawWorld(c, G.camX, { mike:false, extraMike:mike ? [mike] : [] }); drawOverlay(c); };
}
const LIT = n => new Set([2, 102, 206, 297].slice(0, n));
const SCENES = {
  's1-start': () => worldScene(0, { x:3.4, y:12, pose:pose('idle', 0, .4, null, 12) }, { lit:LIT(1) }),
  's2-belts': () => worldScene(50, { x:41.2, y:12, pose:pose('run', 1.3, 0, null, 30) },
    { hazT:{ 'spitter-2':0.3 }, mt:0.4, shots:[{ x:58.9, y:11.25, a:.4, vx:-6, kind:1 }] }),
  's3-camera-alley': () => worldScene(81, { x:79.2, y:12, pose:pose('idle', 0, .3, { camera:true }, 25) },
    { hazT:{ gallery:2.2 }, slowShow:{ left:1.1, cap:2 }, shots:[] }),
  's4-stores': () => worldScene(118, { x:119.4, y:9.6, pose:pose('jump', 0, 0, null, 30) }, { lit:LIT(2) }),
  's5-arm-gate': () => worldScene(152, { x:147, y:12, pose:pose('idle', 0, .2, null, 22) }, { hazT:{ 'arm-gate':1.0 } }),
  's6-coolant-loft': () => worldScene(185, { x:178.6, y:8.4, pose:pose('jump', 0, 0, null, 28) }, { hazT:{ 'coolant-6a':1.2, 'coolant-6b':0.45 } }),
  's7-belt-run': () => worldScene(228, { x:224.9, y:10.2, pose:pose('fall', 0, 0, null, 30) },
    { lit:LIT(3), hazT:{ 'spitter-7':0.95 }, mt:1.1, shots:[{ x:237.7 - 0.35*6, y:11.25, a:.4, kind:0 }, { x:237.7 - 0.05*6, y:11.25, a:2, kind:1 }] }),
  's8-clappers': () => worldScene(259, { x:250.9, y:12, pose:pose('idle', 0, .5, null, 20) }, { hazT:{ jaws:2.1, 'coolant-8':2.4 } }),
  's9-bench': () => worldScene(928, { x:927, y:12, pose:pose('wave', 0, .12, null, -18) }, { lit:LIT(3) }),
  'gantry': () => worldScene(446, { x:442, y:-5.6, pose:pose('run', .4, .2, null, 20) }, { mt:1.8 }),
  'cross-feed': () => worldScene(613, { x:610, y:9.6, pose:pose('jump', .4, .2, null, 20) }, { mt:2.1 }),
  's10-boss-idle': () => worldScene(948, { x:938.2, y:12, pose:pose('idle', 0, .3, null, 20) },
    { lit:LIT(4), boss:{ left:{ x:940.5, y:6.4 }, right:{ x:955.5, y:6.4 }, warn:[941, 948], fitted:{}, units:0, target:'bearing', restored:false } }),
  's10-boss-repair': () => worldScene(948, { x:947.2, y:12, pose:pose('fix', 0, .31, null, 12) },
    { lit:LIT(4), slowShow:{ left:4.2, cap:6.5 },
      boss:{ left:{ x:939.4, y:4.3 }, right:{ x:952.6, y:10.5 }, warn:[955, 946], fitted:{ bearing:2, seal:1 }, units:0, fix:{ socket:'seal', u:.62 }, target:'seal', restored:false } }),
  'title': () => { G.mode = 'scene'; SCENE_DRAW = drawTitle; menu('title'); },
  'results': () => { G.mode = 'scene'; SCENE_DRAW = drawResults; menu('results'); },
  'poses': () => { G.mode = 'scene'; SCENE_DRAW = drawPoses; },
  'hazards': () => { G.mode = 'scene'; SCENE_DRAW = drawHazards; }
};
M.SCENE_NAMES = Object.keys(SCENES);

function blueSheet(c){
  c.fillStyle = C.blue; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 32){ c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); }
  for (let y = 0; y <= H; y += 32){ c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
}
function titleFloor(c, y){
  c.fillStyle = C.steelL; c.fillRect(0, y, W, 8); c.fillStyle = C.steelXL; c.fillRect(0, y, W, 3);
  c.fillStyle = '#474E56'; c.fillRect(0, y + 8, W, H - y - 8); c.fillStyle = C.ink; c.fillRect(0, y + 8, W, 2);
}
// Heavy headline set to fit a width: the fallback stand-in for Helvetica Neue Black Condensed.
function headline(c, text, x, y, maxW, px, color){
  c.font = `900 ${px}px ${FONT}`; const w = c.measureText(text).width, k = Math.min(1, maxW/w);
  c.save(); c.translate(x, y); c.scale(k, 1); c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(text, 0, 0); c.restore();
}
function drawTitle(c){
  CAM_Y=BASE_CAM_Y;drawBackdrop(c,900);
  c.save();c.translate(544,172);c.scale(.53,.53);c.translate(-L.boss.bounds[0]*T,0);
  A.turner(c,L.boss,{left:{x:941,y:7.5},right:{x:955,y:8},fitted:{},units:0},G.t);c.restore();
  const shade=c.createLinearGradient(0,0,960,0);shade.addColorStop(0,'rgba(4,13,23,.95)');shade.addColorStop(.53,'rgba(4,13,23,.86)');shade.addColorStop(1,'rgba(4,13,23,0)');c.fillStyle=shade;c.fillRect(0,0,960,540);
  c.fillStyle='#fff';A.rr(c,62,36,184,53,5);c.fill();c.drawImage(lockRed,76,48,156,156*lockRed.height/lockRed.width);
  c.fillStyle='#91b8c6';c.font=`600 12px ${FONT}`;c.textAlign='left';c.fillText('A MIKE THE MIC ADVENTURE   /   01',64,126);
  headline(c,'THE NIGHT',60,199,504,76,'#edf4f5');headline(c,'SHIFT',60,274,480,88,'#a6e8df');
  c.fillStyle='#a9bdc6';c.font=`500 18px ${FONT}`;c.fillText('One rogue workshop. A long way to clock off.',64,315);
  c.font=`500 15px ${FONT}`;c.fillText('56 salvage finds. Three faults. Your tools do the fixing.',64,339);
  M.puppet.draw(c,rigL,pose('wave',0,.06+(SCENE_ANIM?G.t:0),null,-12),762,475,295,{facing:-1});
  c.fillStyle='#7698a6';c.font=`600 11px ${FONT}`;c.fillText('20 SECTORS  /  FLOOR + GANTRIES  /  ONE HIDDEN LIFE',64,466);
  c.fillStyle='#7698a6';c.fillText('← → RUN   SPACE JUMP   ↓ HOLD TO LOOK BELOW   C CAMERA   E FIX',64,493);
  if (G.gameOver > 0){ G.gameOver -= 1/60; c.fillStyle = '#FFB84D'; c.font = `900 22px ${FONT}`; c.fillText('GAME OVER  ·  from the top', 64, 400 - 24); }
  const progress=loadProgress();if(progress.best||progress.bestSalvage){c.fillStyle='#a6e8df';c.fillText('BEST SALVAGE  '+(progress.bestSalvage||0)+'/56   ·   BEST SCORE  '+(progress.best||0).toLocaleString('en-GB'),64,519);}
}
function drawResults(c){
  G.camX = L.W*T - VW; G.boss = { left:{ x:941, y:5.6 }, right:{ x:955, y:5.6 }, warn:null, fitted:{ bearing:2, seal:2, coupling:2 }, units:2, target:null, restored:true };
  G.lit = LIT(4); B.done = true; B.doneT = 9;
  drawBackdrop(c, G.camX); drawWorld(c, G.camX, { mike:false, extraMike:[{ x:956.6, y:12, pose:pose('wave', 0, .06, null, -14) }] });
  drawResultsCard(c, { score:3400, parts:12, units:2, sd:5, mini:1, time:288, lost:1, cont:0 });
}
function drawPoses(c){
  blueSheet(c);
  c.fillStyle = C.white; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText('Mike: every pose, rotated from the signed-off puppet', 16, 28);
  const P2 = Math.PI/2;
  const cells = [
    ['idle', pose('idle', 0, .3, null, 0)], ['run 1/4', pose('run', 0, 0, null, 30)], ['run 2/4', pose('run', P2, 0, null, 30)],
    ['run 3/4', pose('run', 2*P2, 0, null, 30)], ['run 4/4', pose('run', 3*P2, 0, null, 30)], ['jump', pose('jump', 0, 0, null, 30)],
    ['fall', pose('fall', 0, 0, null, 30)], ['land', pose('land', 0, 0, null, 12)], ['hit', pose('hit', 0, 0, { away:-1 }, -10)],
    ['camera', pose('idle', 0, 0, { camera:true }, 25)], ['fix', pose('fix', 0, .1, null, 10)], ['wave', pose('wave', 0, .06, null, -12)],
    ['head -40°', pose('idle', 0, 0, null, -40)], ['head -20°', pose('idle', 0, 0, null, -20)], ['head 0°', pose('idle', 0, 0, null, 0)],
    ['head +20°', pose('idle', 0, 0, null, 20)], ['head +40°', pose('idle', 0, 0, null, 40)], ['run + camera', pose('run', P2, 0, { camera:true }, 30)]
  ];
  cells.forEach(([name, p], i) => {
    const col = i % 6, row = Math.floor(i/6), cx = 80 + col*160, fy = 196 + row*170;
    c.fillStyle = 'rgba(0,44,90,.35)'; A.rr(c, cx - 74, fy - 158, 148, 166, 12); c.fill();
    M.puppet.draw(c, rigL, p, cx, fy - 14, 138, { facing:1 });
    c.fillStyle = C.white; c.font = `700 16px ${FONT}`; c.textAlign = 'center'; c.fillText(name, cx, fy + 2);
  });
}
function drawHazards(c){
  blueSheet(c);
  c.fillStyle = C.white; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText('Level 1 machines and pickups, drawn from the level data, each in its warning state', 16, 28);
  const label = (text, x, y) => { c.fillStyle = C.white; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.fillText(text, x, y); };
  const win = (x0, y0, wT, rx, ry, rw, rh, name) => {
    const s = rw/(wT*T);
    c.save(); A.rr(c, rx, ry, rw, rh, 10); c.clip();
    c.translate(rx, ry); c.scale(s, s); c.translate(-x0*T, -y0*T);
    c.fillStyle = C.blue2; c.fillRect(x0*T, y0*T, wT*T, rh/s);
    drawWorldWindow(c, x0, wT);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; A.rr(c, rx, ry, rw, rh, 10); c.stroke();
    label(name, rx + rw/2, ry + rh + 18);
  };
  const topFor = (bottom, wT, rw, rh) => bottom - rh/(rw/(wT*T))/T;
  G.hazT = { 'spitter-2':0.3, 'spitter-7':0.3, gallery:2.2, 'arm-gate':0.4, 'coolant-6a':0.45, jaws:2.3, 'coolant-8':1.2 };
  G.armPose = { ang:0, ext:1 }; G.jawsU = 0.35; G.shots = [{ x:81.9, y:10.5, a:.3, kind:0 }, { x:81.0, y:11.5, a:1.2, kind:1 }];
  G.mt = 0.3;
  const cw = 148, ch = 176, y = 42, gap = 8, x0 = 16, top = topFor(13.3, 9.6, cw, ch);
  win(53.4, top, 9.6, x0 + 0*(cw + gap), y, cw, ch, 'Rattle Spitter (lathe)');
  win(75.8, top, 9.6, x0 + 1*(cw + gap), y, cw, ch, 'Spitter Gallery');
  win(144.8, top, 9.6, x0 + 2*(cw + gap), y, cw, ch, 'Tickle Spindle gate');
  win(174.6, top, 9.6, x0 + 3*(cw + gap), y, cw, ch, 'Coolant Sneeze');
  win(248.3, top, 9.6, x0 + 4*(cw + gap), y, cw, ch, 'Clapper Jaws (press)');
  win(230.4, top, 9.6, x0 + 5*(cw + gap), y, cw, ch, 'Spitter (grinder)');
  const cell = (i, name, fn) => { const cx = 60 + i*92, cy = 300;
    c.fillStyle = 'rgba(0,44,90,.45)'; A.rr(c, cx - 42, cy - 44, 84, 88, 12); c.fill();
    c.save(); fn(cx, cy - 8); c.restore(); label(name, cx, cy + 36); };
  [['bearing', 'Bearing'], ['seal', 'Seal'], ['coupling', 'Coupling'], ['lubricant', 'Lubricant'], ['controlUnit', 'Control unit'], ['sdCard', 'SD +1.5 s']]
    .forEach(([k, name], i) => cell(i, name, (x, y) => A.pickupIcon(c, k, x, y, 1.8)));
  cell(6, 'Crashed parts', (x, y) => { A.crashedPart(c, x - 14, y, 14, .4, 0); A.crashedPart(c, x + 14, y + 4, 14, -.3, 1); });
  cell(7, 'Checkpoint', (x, y) => { c.translate(x, y + 30); c.scale(.62, .62); A.drawCheckpoint(c, 0, 0, true, 0); });
  cell(8, 'Mini Mike (life)', (x, y) => M.puppet.draw(c, rig, pose('wave', 0, .1, null, -10), x, y + 36, 70, { facing:1 }));
  cell(9, 'Pillar drill', (x, y) => { c.translate(x + 4, y + 36); c.scale(.42, .42); A.demoDrill(c, 0, 0, .6, false); });
  win(279, topFor(12.7, 16, 300, 146), 16, 16, 360, 300, 146, 'Service bench and free spares');
  win(296, topFor(12.9, 24, 300, 146), 24, 330, 360, 300, 146, 'The Tangled Turner');
  win(38.6, topFor(12.9, 10, 298, 146), 10, 646, 360, 298, 146, 'Chip conveyors and a pit');
  G.hazT = null; G.shots = []; G.armPose = null; G.jawsU = undefined;
}
function drawWorldWindow(c, x0, wT){
  const vis = (a, b) => b > x0 - 3 && a < x0 + wT + 3;
  for (const h of L.hazards) if (h.type === 'coolant' && vis(h.base[0] - 3, h.base[0] + 1)) A.coolantBack(c, h);
  drawChunks(c, x0*T, (x0 + wT)*T);
  for (const d of L.decor) if (d.type === 'demoDrill' && vis(d.x - 2, d.x + 2)) A.demoDrill(c, d.x, d.y, G.mt, false);
  for (const b of L.belts) if (vis(b.x0, b.x1)) A.drawBelt(c, b, G.mt*b.dir*b.speed, b.dir*b.speed, false, 0);
  for (const cp of L.checkpoints) if (vis(cp.x, cp.x)) A.drawCheckpoint(c, cp.x, cp.y, true, 0);
  for (const h of L.hazards){ const r = h.rect || h.base; if (!vis(r[0], r[0] + r[2])) continue; const t = hazT(h);
    if (h.type === 'spitter') A.spitter(c, h, t); else if (h.type === 'spitterGallery') A.gallery(c, h, t); else if (h.type === 'armGate') A.armGate(c, h, t, false, G.armPose);
    else if (h.type === 'coolant') A.coolant(c, h, t); else if (h.type === 'jaws') A.jaws(c, h, t, false, G.jawsU);
    if (isGate(h)) A.gateSignal(c, r[0] - 0.45, gateState(h, t), false, 0); }
  if (vis(296, 320)) A.turner(c, L.boss, { left:{ x:301, y:9.2 }, right:{ x:315.5, y:6.4 }, warn:[301, 308], fitted:{ bearing:1 }, units:1, target:'seal', fix:{ socket:'bearing', u:.4 } }, .8);
  for (const p of L.pickups) if (vis(p.x, p.x)) A.drawPickup(c, p, 0);
  A.shots(c, G.shots);
}

// ---------- menus ----------
function menu(kind){ const m = $('menu'); m.hidden = false; m.dataset.kind = kind; $('resume-save').hidden = !(kind === 'title' && L && loadSave()); }
function toTitle(){
  G.mode = 'title'; document.body.dataset.mode = 'title'; P = null; G.boss = null; G.slowShow = null; G.hazT = null; G.results = null;
  B.done = false; B.on = false; AU.hum(false); AU.boss(false); $('pausebox').hidden = true; G.paused = false;
  G.camX = 0; SCENE_DRAW = drawTitle; SCENE_ANIM = true; menu('title');
  if (!TEST) history.replaceState(null, '', location.pathname);
}
$('play').addEventListener('click', () => { clearSave(); startPlay('full'); });
$('resume-save').addEventListener('click', () => { const sv = loadSave(); startPlay('full', sv); });
$('res-replay').addEventListener('click', () => { startPlay(G.spec || 'full'); });
// after the whole level, Continue goes on to Level 2 (owner, 30 Sept); a test strip goes back to the title
$('res-continue').addEventListener('click', () => { if (G.spec === 'full') location.href = 'level-2.html'; else toTitle(); });
$('resume').addEventListener('click', () => setPaused(false));
$('restart-cp').addEventListener('click', () => { setPaused(false); G.lives++; G.livesLost--; loseLife(); });
$('quit').addEventListener('click', () => { save(); toTitle(); });
$('pause').addEventListener('click', () => { if (G.mode === 'play') setPaused(!G.paused); });
const soundLabel = () => { $('sound').classList.toggle('off', AU.muted); $('sound').setAttribute('aria-label', AU.muted ? 'Sound off' : 'Sound on'); $('snd-toggle').textContent = AU.muted ? 'Sound: off' : 'Sound: on'; };
$('sound').addEventListener('click', () => { AU.unlock(); AU.setMuted(!AU.muted); soundLabel(); });
$('snd-toggle').addEventListener('click', () => { AU.setMuted(!AU.muted); soundLabel(); });
soundLabel();

// ---------- boot ----------
function img(src){ const i = new Image(); i.src = src; return i.decode().then(() => i); }
async function boot(){
  const [data] = await Promise.all([fetch('level-1.json').then(r => r.json()), M.puppet.load('assets/'), AU.preload()]);
  L = M.loadLevel(data);
  if (L.errors.length) console.error('Level 1 failed validation: ' + L.errors.join('; '));
  lockRed = await img('assets/mtdcnc-lockup-red.png');
  far = A.makeFar(); pipes = A.makePipes();
  rig = await M.puppet.bake(2*2*T*Z/M.puppet.HEIGHT);     // gameplay atlas at twice display size
  const needBig = !SCENE || ['title', 'results', 'poses'].includes(SCENE);
  if (needBig) rigL = await M.puppet.bake(0.42);
  $('loading').hidden = true;
  if (SCENE){
    const f = SCENES[SCENE];
    if (!f){ console.error('unknown scene ' + SCENE); return; }
    document.body.dataset.mode = 'scene'; f(); draw();
  } else if (SECTION || DEMO){ startPlay(DEMO ? 'full' : SECTION); if (DEMO) M.demo.reset(); draw(); }
  else toTitle();
  document.body.dataset.ready = '1';
  requestAnimationFrame(frame);
}

// ---------- test hooks (design section 11) ----------
function api(){ return { P, G, B, L, CAMR, hazT:id => hazT(L.hazards.find(h => h.id === id)), gateState:id => { const h = L.hazards.find(h => h.id === id); return gateState(h, hazT(h)); },
  beltSpeed:id => { const b = L.belts.find(b => b.id === id); return b.dir*b.speed*beltProfile(b); }, bossTips, bossTarget, kit, STEPS }; }
window.__mike = {
  step(n){ manual = true; for (let i = 0; i < (n || 1); i++){ if (G.mode !== 'play') break; if (DEMO) testInput = M.demo.next(api()); update(STEP); } draw(); return this.snapshot(); },
  input(s){ manual = true; testInput = Object.assign({ left:false, right:false, jump:false, camera:false, fix:false }, s); },
  release(){ testInput = null; manual = false; },
  snapshot(){ return P && { x:P.x, y:P.y, vx:P.vx, vy:P.vy, ground:P.ground, peakY:P.peakY, airTime:P.airTime, lastAir:P.lastAir, coyote:P.coyote,
    beltV:P.beltV, facing:P.facing, jumpedAt:P.jumpedAt, state:anim.st, camX:G.camX, viewW:VW, zoom:Z,
    sx:(P.x*T - Math.round(G.camX*Z)/Z)*Z, sy:(P.y*T - CAM_Y)*Z, camY:CAM_Y, lookDown:!!G.lookDown, charge:CAMR.charge, left:CAMR.left, cap:CAMR.cap, cameraOn:CAMR.on, cool:CAMR.cool,
    score:G.score, got:[...G.got], health:G.health, lives:G.lives, dead:G.dead, hitT:P.hitT, livesLost:G.livesLost, continues:G.continues,
    inv:Object.assign({}, G.inv), rec:Object.assign({}, G.rec), used:Object.assign({}, G.used), mode:G.mode, machine:G.mt, time:G.time, won:G.won,
    boss:{ on:B.on, step:B.step, fitted:Object.assign({}, B.fitted), units:B.units, fix:B.fix, done:B.done, trans:B.trans, t:B.t, eligible:B.eligible } }; },
  reset(section){ startPlay(section === undefined ? (SECTION || 'full') : section); prevInp = { jump:false, camera:false }; testInput = null; if (DEMO) M.demo.reset(); return this.snapshot(); },
  resume(){ const sv = loadSave(); startPlay('full', sv); prevInp = { jump:false, camera:false }; testInput = null; return !!sv; },
  clearSave(){ clearSave(); },
  place(x, y){ P.x = x; P.y = y; P.vx = 0; P.vy = 0; P.ground = true; P.coyote = 0; P.buffer = 0; this.step(1); return this.snapshot(); },
  hazT(id){ return hazT(L.hazards.find(h => h.id === id)); },
  gateState(id){ const h = L.hazards.find(h => h.id === id); return gateState(h, hazT(h)); },
  beltSpeed(id){ const b = L.belts.find(b => b.id === id); return b.dir*b.speed*beltProfile(b); },
  bossTips(){ return bossTips().map(t => ({ x:t.x, y:t.y, danger:!!t.danger, side:t.side })); },
  grant(item, n){ G.rec[item] += n || 1; },                // give repair items without scoring them (boss tests)
  runDemo(max){ manual = true; let n = 0; const shots = [];
    while (G.mode === 'play' && n < (max || 60*60*12)){ testInput = M.demo.next(api()); update(STEP); n++; }
    draw(); return { steps:n, seconds:+(n/60).toFixed(1), snap:this.snapshot(), won:G.won, results:G.results }; },
  perf(){ return { workP50:pct(perf.work, .5), workP95:pct(perf.work, .95), frameP95:pct(perf.frame, .95), lowQ:G.lowQ }; },
  frame(){ return canvas.toDataURL('image/png'); },
  get level(){ return L; }, get G(){ return G; }, get B(){ return B; }, api, scenes: () => M.SCENE_NAMES
};
boot().catch(e => { console.error(e); $('loading').textContent = 'Could not start: ' + e.message; });
})();
