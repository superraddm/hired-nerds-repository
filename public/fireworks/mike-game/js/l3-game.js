// Mike the Mic, Level 3: Cobot Mania. The page around the rules in l3-world.js: loop, input, camera, drawing, the HUD
// with the route map, saves, menus, still scenes (?scene=<name>) and test hooks (window.__l3).
// Level 1's files are used as they are and are not changed: its puppet, pickups, belts, audio and voice.
(function(){
'use strict';
const M = window.MIKE, A = M.art, A3 = M.art3, E = M.L3, T = A.T, C = A.C, FONT = A.FONT, PH = M.PHYS, AU = M.audio, AU3 = M.audio3;
const W = 960, H = 540, Z = 1.25, VW = W/Z, VH = H/Z, STEP = PH.step;
// Debug switches (?room, ?scene, ?test, ?lab) work only when served locally. On the live site the level opens only for a
// campaign that has cleared Level 2 (the owner's rule for Level 2, carried forward).
const LOCAL = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || location.protocol === 'file:';
const q = new URLSearchParams(LOCAL ? location.search : ''), SCENE = q.get('scene'), TEST = q.has('test'), LAB = q.has('lab'), ROOM = q.get('room');
function unlocked(){ return LOCAL || M.campaign.cleared('level-2'); }
const SAVE_KEY = 'mike-game.l3.v1.save', PROGRESS_KEY = 'mike-game.l3.v1.progress';
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), stage = document.getElementById('stage'), $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
A3.roverTall = E.R.roverTall;

let L, S, rig, rigL, lockRed;
const G = { mode:'loading', paused:false, camX:0, camY:0, look:4, fx:[], card:0, toast:null, milestone:null, scorePop:0, lastScore:0, newBest:false, bestAtStart:0,
  shake:0, lowQ:false, t:0, results:null, slowShow:null, af:null, beltPos:{}, smashed:new Set(), chirped:{}, goalT:0 };
const anim = { st:'idle', s:0, from:null, cur:null, blend:1, phase:0, turn:12, idle:0 };
const chunks = new Map(), CH = 16;                            // scenery cached in 16 x 16 tile squares, whatever the level's height

// ---------- input ----------
const keys = new Set(), touchHeld = new Map(); let testInput = null;
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'jump', KeyW:'jump', ArrowUp:'jump', ArrowDown:'lookDown', KeyS:'lookDown',
  KeyC:'camera', ShiftLeft:'camera', ShiftRight:'camera', KeyE:'fix', Escape:'pause', KeyP:'pause' };
addEventListener('keydown', e => {
  AU.unlock(); AU3.unlock();
  const k = KEYMAP[e.code]; if (!k) return;
  e.preventDefault(); document.body.classList.remove('touch');
  if (e.repeat) return;
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
document.querySelectorAll('.tc').forEach(b => {
  const ctl = b.dataset.ctl;
  b.addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); AU3.unlock(); document.body.classList.add('touch'); try { b.setPointerCapture(e.pointerId); } catch(_){}
    touchHeld.set(e.pointerId, ctl); b.classList.add('on'); });
  const up = e => { if (touchHeld.get(e.pointerId) === ctl){ touchHeld.delete(e.pointerId); if (![...touchHeld.values()].includes(ctl)) b.classList.remove('on'); } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, up));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
addEventListener('pointerdown', e => { AU.unlock(); AU3.unlock(); if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture:true, passive:true });
const isTouch = () => document.body.classList.contains('touch');
function setPaused(p){
  G.paused = p; clearInput(); $('pausebox').hidden = !p;
  if (p){ $('pause-score').textContent = 'Score ' + S.score.toLocaleString('en-GB'); save(); AU.hum(false); AU.suspend(); AU3.suspend(); } else { AU.resume(); AU3.resume(); }
}
addEventListener('blur', () => { if (G.mode === 'play' && !TEST) setPaused(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden){ if (G.mode === 'play' && !TEST) setPaused(true); AU.suspend(); AU3.suspend(); } });

// ---------- layout ----------
function fit(){
  const vw = innerWidth, vh = innerHeight, s = Math.min(vw/W, vh/H);
  stage.style.transform = `translate(${(vw - W*s)/2}px,${(vh - H*s)/2}px) scale(${s})`;
  document.body.classList.toggle('portrait', vh > vw);
}
addEventListener('resize', fit); fit();

// ---------- save: Level 3 keeps its own ----------
function save(){
  if (!S || S.won || G.mode !== 'play' || ROOM) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(E.saveData(S))); }
  catch(_){ if (!G.saveWarned){ G.saveWarned = true; toast('Saving is unavailable here: progress lasts until the page closes'); } }
}
function loadSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 1 && d.level === L.data.id) return d; } catch(_){} return null; }
function clearSave(){ if (ROOM) return; try { localStorage.removeItem(SAVE_KEY); } catch(_){} }
function loadProgress(){ try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch(_){ return {}; } }
function saveProgress(p){ if (ROOM) return; try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch(_){} }
function toast(text){ G.toast = { text, t:0, life:4 }; }
// the route log is kept across runs (design: the fifteen lanes, remembered on the device)
function logLanes(){ const pr = loadProgress(), all = new Set(pr.lanes || []); for (const id of S.lanes) all.add(id); pr.lanes = [...all]; saveProgress(pr); return all; }

// ---------- start ----------
function startPlay(sv, room){
  G.mode = 'play'; document.body.dataset.mode = 'play'; SCENE_DRAW = null; SCENE_ANIM = false;
  S = E.create(L, sv, { variant:(loadProgress().bossRuns || 0) % 3 });           // each finished run meets the next puzzle set
  if (room){                                                    // ?room=2: start at a room's first checkpoint; ?room=boss: at the Teach Cell's door
    const bossStart = room === 'boss', r = L.rooms[bossStart ? L.rooms.length - 1 : room - 1];
    const cp = bossStart ? L.checkpoints.filter(c => c.x < L.boss.bounds[0]).at(-1) : L.checkpoints.filter(c => c.x <= r.x + 1).at(-1) || L.checkpoints[0];
    S.checkpoint = { x:cp.x, y:cp.y }; S.lit = new Set(L.checkpoints.filter(c => c.x <= cp.x).map(c => c.x + ',' + c.y)); S.P = M.newPlayer(cp.x, cp.y);
    if (bossStart){ for (const p of L.pickups) if (p.type === 'sdCard' && p.x < cp.x){ S.got.add(p.id); S.inv.sdCard++; } S.cam = M.newCamera(S.inv.sdCard); }
  }
  Object.assign(G, { fx:[], card:sv || room ? 0 : 2.8, toast:null, milestone:null, scorePop:0, lastScore:S.score, newBest:false, bestAtStart:loadProgress().best || 0, shake:0,
    results:null, slowShow:null, paused:false, t:0, beltPos:{}, smashed:new Set(), chirped:{}, goalT:0, poses:null, boss:null });
  anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur; anim.turn = 12; anim.blend = 1;
  G.look = 4; G.camY = targetCamY(); follow(1, true);
  delete document.body.dataset.done;
  $('menu').hidden = true; $('pausebox').hidden = true; AU.boss(false); AU.hum(false);
}

// ---------- the step ----------
const SAID = { lubricant:'+1 HEALTH', sdCard:'+1.5s FOOTAGE', miniMike:'EXTRA LIFE' };
function update(dt){
  const inp = readInput();
  E.step(S, inp, dt);
  const run = S; for (const e of S.events) react(e);
  if (S !== run) return;                                     // the level started again on its last life
  const P = S.P, dtm = dt*S.ts;
  G.t += dt;
  for (const b of L.belts) G.beltPos[b.id] = (G.beltPos[b.id] || 0) + b.dir*b.speed*E.beltProfile(b, S.mt)*dtm;
  if (G.card > 0) G.card -= dt;
  if (G.goalT > 0) G.goalT -= dt;
  if (G.toast && (G.toast.t += dt) > G.toast.life) G.toast = null;
  if (S.score > G.lastScore){ G.scorePop = 1; if (!G.newBest && G.bestAtStart > 0 && S.score > G.bestAtStart){ G.newBest = true; G.milestone = { title:'NEW HIGH SCORE!', sub:'BEAT ' + G.bestAtStart.toLocaleString('en-GB'), t:0, life:2.2, gold:true }; AU.play('checkpoint'); } }
  G.lastScore = S.score; G.scorePop = Math.max(0, G.scorePop - dt*3);
  if (G.milestone && (G.milestone.t += dt) > G.milestone.life) G.milestone = null;
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life); if (G.fx.length > 48) G.fx.splice(0, G.fx.length - 48);
  G.shake = Math.max(0, G.shake - dt);
  // crates that land on screen thud; hazard tells on screen chirp
  const onScreen = x => x*T > G.camX - 40 && x*T < G.camX + VW + 40;
  for (const k of E.crates(S)){ const key = k.id + ':' + Math.round(k.floor*10) + ':' + Math.round(k.x*10); if (k.stage === 'smash' && !G.smashed.has(key)){ G.smashed.add(key); if (onScreen(k.x)){ AU3.play('crate'); } } else if (k.stage !== 'smash') G.smashed.delete(key); }
  for (const a of L.arms) if (E.live(S, a)){ const st = E.armPose(a, E.clock(S, a, S.mt)).state; if (st === 'amber' && G.chirped[a.id] !== 'amber' && onScreen(a.base[0])) AU3.play('chirp'); G.chirped[a.id] = st; }
  if (S.cam.on && S.cam.left <= 1 && S.cam.left + dt > 1) AU.play('lowCharge');
  if (S.cam.refused > 1.19) AU.play('refuse');
  animate(dt); follow(dt);
  const tc = $('tc-fix'); if (tc) tc.classList.toggle('show', canUse());
  if (S.won && G.mode === 'play') win();
}
const canUse = () => S.boss.on && !S.boss.done && !!S.boss.dial;
function react(e){
  const P = S.P;
  switch (e.type){
    case 'jump': AU.play('jump'); break;
    case 'land': AU.play('land'); break;
    case 'hit': AU.play('bonk'); AU.say('pain'); G.shake = .22; break;
    case 'lifeLost': AU.play('fall'); AU.hum(false); save(); break;
    case 'respawn': anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur; G.camY = targetCamY(); follow(1, true); save(); break;
    case 'gameOver': {                                     // the last life: a continue restarts the level; none left restarts the game
      clearSave();
      if (M.campaign.useContinue()){ const used = S.continues + 1, left = M.campaign.continues; startPlay(); S.continues = used; toast(left ? `Continue used. ${left} left` : 'Last continue used'); }
      else { M.campaign.restart(); location.href = './'; }
      break; }
    case 'camOn': AU.play('camOn'); AU.hum(true); break;
    case 'camOff': AU.play('camOff'); AU.hum(false); break;
    case 'grip': AU3.play('grip'); AU3.play('servo'); break;
    case 'setDown': AU3.play('setDown'); save(); break;
    case 'hook': AU3.play('hook'); break;
    case 'letGo': AU3.play('letGo'); break;
    case 'checkpoint': AU.play('checkpoint'); save(); break;
    case 'lane': { const ln = L.lanes.find(l => l.id === e.id), all = logLanes(); if (ln) G.fx.push({ kind:'text', x:P.x, y:P.y - 2.6, text:ln.title.toUpperCase(), t:0, life:1.4, color:A3.P.layer[ln.layer] === '#E7EDF2' ? '#fff' : A3.P.layer[ln.layer] });
      break; }
    case 'collect': {
      const p = e.p; AU.play(p.type === 'lubricant' ? 'lube' : p.type === 'miniMike' ? 'sd' : p.type === 'sdCard' || p.type === 'controlUnit' ? 'unit' : 'part');
      if (SAID[p.type] || p.type === 'controlUnit') AU.say('power');
      for (let i = 0; i < 8; i++) G.fx.push({ kind:'spark', x:p.x, y:p.y, a:i/8*Math.PI*2, t:0, life:.45 });
      G.fx.push({ kind:'text', x:p.x, y:p.y - .6, text:SAID[p.type] || '+' + E.POINTS[p.type], t:0, life:SAID[p.type] ? 1.1 : .8, color:SAID[p.type] ? A.POWER[p.type].ring : null });
      const pr = loadProgress(); pr.bestSalvage = Math.max(pr.bestSalvage || 0, E.salvageCount(S)); saveProgress(pr); save(); break; }
    case 'milestone': G.milestone = { title:e.n + ' SALVAGE', sub:'BONUS +' + e.bonus.toLocaleString('en-GB'), t:0, life:1.9 }; AU.play('sd'); AU.say('power'); break;
    case 'fullCollection': G.milestone = { title:'FULL COLLECTION', sub:'BONUS +1,000', t:0, life:2.4 }; AU.say('power'); break;
    case 'bossStart': AU.boss(true); AU.say('boss', true); G.goalT = 5; break;
    case 'roundStart': G.goalT = 4; AU3.play('run'); break;
    case 'refuse': AU.play('refuse'); break;
    case 'pick': AU3.play('servo'); break;
    case 'warn': AU3.play('chirp'); break;
    case 'drop': AU3.play('letGo'); break;
    case 'reteach': AU3.play('key'); AU.play('repair'); break;
    case 'deliver': { const pl = Object.values(L.boss.pallets).find(p => p.colour === e.colour); AU3.play('ok'); if (pl) G.fx.push({ kind:'text', x:pl.at[0] + (pl.at[0] > L.boss.bounds[0] + 12 ? -1.6 : 1.6), y:10, text:'Delivered!', t:0, life:1.2 }); break; }
    case 'sweepWarn': AU3.play('chirp'); AU3.play('servo'); break;
    case 'missort': AU3.play('jam'); break;
    case 'repairTick': AU.play('repairTick'); break;
    case 'roundDone': AU3.play('ok'); AU.play('chord'); AU.say('power'); G.fx.push({ kind:'text', x:L.boss.bounds[0] + 12, y:5, text:'Route fixed!', t:0, life:1.6 }); G.shake = .15; save(); break;
    case 'bossDone': AU.play('chord'); AU.say('power'); AU.boss(false); AU.hum(false); save(); break;
  }
}
function win(){
  clearSave();
  const all = logLanes(), pr = loadProgress(); pr.completed = true; pr.best = Math.max(pr.best || 0, S.score); pr.bestSalvage = Math.max(pr.bestSalvage || 0, E.salvageCount(S)); pr.bossRuns = (pr.bossRuns || 0) + 1; saveProgress(pr);
  if (!ROOM) M.campaign.award('level-3', S.score);
  G.results = { score:S.score, salvage:E.salvageCount(S), sd:S.inv.sdCard, mini:S.inv.miniMike, time:S.playTime, lost:S.livesLost, cont:S.continues, best:pr.bestSalvage,
    level1:M.campaign.score('level-1'), level2:M.campaign.score('level-2'), total:M.campaign.total(), lanes:[...all], run:[...S.lanes] };
  G.mode = 'results'; document.body.dataset.mode = 'results'; menu('results'); document.body.dataset.done = '1';
}

// ---------- camera ----------
const inArena = () => L.boss && S.boss.on;
function targetCamY(){
  const P = S.P, maxY = (L.H - 1.2)*T - VH, base = P.y*T - VH*.62;
  if (inArena()) return L.boss.bounds[1]*T;
  return clamp(base + (S.lookDown ? 5*T : 0), L.top*T, maxY);
}
function follow(dt, snap){
  const P = S.P;
  G.camY += (targetCamY() - G.camY)*(snap ? 1 : 1 - Math.exp(-dt/.16));
  G.look += (P.facing*4 - G.look)*(snap ? 1 : 1 - Math.exp(-dt/.15));
  let x = (P.x + G.look)*T - VW/2;
  if (inArena()) x = L.boss.bounds[0]*T;                    // the Teach Cell: one fixed frame
  x = clamp(x, 0, L.W*T - VW);
  G.camX = snap || !inArena() ? x : G.camX + (x - G.camX)*(1 - Math.exp(-dt/.25));
}

// ---------- Mike ----------
function heldPose(s){ const o = M.puppet.pose('fall', 0, s); o.legL = -6 + 5*Math.sin(s*5); o.legR = 6 - 5*Math.sin(s*5); o.footL = 4; o.footR = -4; o.armL_upper = -35; o.armR_upper = -30; o.head = 3; return o; }
// Arms straight up would hide behind his head (the arms are drawn before it), so he reaches up and out on both sides.
function hangPose(s){ const o = M.puppet.pose('fall', 0, s); o.armL_upper = 0; o.armL_lower = 20; o.armR_upper = -100; o.armR_lower = 0; o.legL = 8*Math.sin(s*3); o.legR = -8*Math.sin(s*3); o.footL = 6; o.footR = 6; o.head = -4; return o; }
function animate(dt){
  const P = S.P, B = S.boss, moving = Math.abs(P.vx + (P.ground ? P.beltV : 0)) > .4;
  let st;
  if (B.done) st = 'wave';
  else if (S.ride) st = 'held';
  else if (S.hang) st = 'hang';
  else if (P.hitT < .25) st = 'hit';
  else if (!P.ground) st = P.vy < 0 ? 'jump' : 'fall';
  else if (B.fix > 0) st = 'fix';
  else if (P.landT < PH.landHold + PH.landRecover && Math.abs(P.vx) < 3) st = 'land';
  else if (moving) st = 'run';
  else st = anim.idle > 3 ? 'wave' : 'idle';
  anim.idle = st === 'idle' || st === 'wave' ? anim.idle + dt : 0;
  if (st === 'wave' && anim.idle > 3.6 && !B.done) anim.idle = 0;
  const p0 = anim.phase;
  anim.phase += Math.abs((P.vx + (P.ground ? P.beltV : 0))*dt)/3*Math.PI*2;
  if (st === 'run' && Math.floor(anim.phase/Math.PI) !== Math.floor(p0/Math.PI)) AU.play('step');
  if (st !== anim.st){ anim.from = anim.cur; anim.blend = 0; anim.st = st; anim.s = 0; }
  anim.s += dt; anim.blend = Math.min(1, anim.blend + dt/.1);
  const target = st === 'held' ? heldPose(anim.s) : st === 'hang' ? hangPose(anim.s) : M.puppet.pose(st, anim.phase, anim.s, { camera:S.cam.on && st !== 'fix', away:-(P.hitAway || 1) });
  if (S.cam.on && (st === 'held' || st === 'hang')){ target.armR_upper = -105; target.armR_lower = -12; target.prop = 'camera'; }
  anim.cur = M.puppet.lerp(anim.from, target, anim.blend);
  const tt = P.facing*(moving || !P.ground ? 30 : 12);
  anim.turn += (tt - anim.turn)*(1 - Math.exp(-dt/.12));
  anim.cur.turn = anim.turn;
}
const pose = (st, p, s, ex, turn) => { const o = M.puppet.pose(st, p || 0, s || 0, ex); o.turn = turn || 0; return o; };
function drawMike(c, x, y, ps, facing, o){
  o = o || {};
  if (o.protect){ c.save(); c.shadowColor = 'rgba(255,255,255,.95)'; c.shadowBlur = 10; }
  M.puppet.draw(c, rig, ps, x*T, y*T, 2*T, { facing });
  if (o.protect) c.restore();
  G.af = { x, y };
}
function drawMiniMike(c, p, t){
  const x = p.x*T, y = p.y*T + Math.sin(t*3 + p.x)*3;
  A.powerBubble(c, x, y, 'miniMike', t); M.puppet.draw(c, rig, pose('wave', 0, t, null, -10), x, y + 17, 36, { facing:1 });
}

// ---------- world ----------
function chunk(i, j){
  const key = i + ',' + j; let cv = chunks.get(key);
  if (!cv){
    const px = CH*T; cv = document.createElement('canvas'); cv.width = Math.ceil(px*Z); cv.height = Math.ceil(px*Z);
    const c = cv.getContext('2d'); c.scale(Z, Z); c.translate(-i*px, -j*px); A3.drawStatic(c, L, i*px, i*px + px, j*px, j*px + px);
    chunks.set(key, cv); if (chunks.size > 12) chunks.delete(chunks.keys().next().value);
  }
  return cv;
}
// A machine as it is now; the Teach Cell's own machines stand parked until it wakes. G.poses pins a still frame.
function shown(h, poseOf){
  if (G.poses && G.poses[h.id] !== undefined) return poseOf(h, G.poses[h.id]);
  if (h.boss && !E.live(S, h)) return Object.assign(poseOf(h, 0), { state:S.boss.done ? 'green' : 'red', active:false, tell:false });
  return poseOf(h, E.clock(S, h, S.mt));
}
function drawWorld(c, o){
  o = o || {};
  const camX = G.camX, x0 = camX, x1 = camX + VW, y0 = G.camY, y1 = G.camY + VH, P = S.P, B = S.boss, t = G.t;
  const vis = (a, b, ya, yb) => b*T > x0 - 160 && a*T < x1 + 160 && (ya === undefined || (yb*T > y0 - 200 && ya*T < y1 + 200));
  c.save(); c.scale(Z, Z); c.translate(-Math.round(camX*Z)/Z, -Math.round(G.camY*Z)/Z);
  // room numbers on the back wall, as in the earlier levels
  for (const r of L.rooms) if (vis(r.x, r.x + 8, 4, 8)){ c.font = `600 54px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(220,235,242,.16)'; c.fillText(String(L.rooms.indexOf(r) + 1).padStart(2, '0'), (r.x + 1.5)*T, 6.1*T);
    c.font = `600 10px ${FONT}`; c.fillStyle = 'rgba(210,228,236,.7)'; c.fillText(r.title.toUpperCase(), (r.x + 1.5)*T, 6.1*T + 16); }
  // the Big Arm's route, on the back wall behind everything in the cell
  const inCell = L.boss && vis(L.boss.bounds[0], L.boss.bounds[0] + 24);
  if (inCell) A3.route(c, L, bossState(), t);
  const px = CH*T;
  for (let i = Math.floor(x0/px); i <= Math.floor((x1 - 1)/px); i++) for (let j = Math.floor(y0/px); j <= Math.floor((y1 - 1)/px); j++) c.drawImage(chunk(i, j), i*px, j*px, px, px);
  for (const b of L.belts) if (vis(b.x0, b.x1, b.y - 1, b.y + 1)) A.drawBelt(c, b, G.beltPos[b.id] || 0, b.dir*b.speed*E.beltProfile(b, S.mt), E.beltWarn(b, S.mt), t);
  for (const g of L.scenery) if (g.type === 'sign' && vis(g.at[0] - 3, g.at[0] + 3, g.at[1] - 6, g.at[1])) A3.sign(c, { x:g.at[0], y:g.at[1], kind:g.kind }, isTouch());
  for (const cp of L.checkpoints) if (vis(cp.x - 1, cp.x + 1, cp.y - 4, cp.y)) A.drawCheckpoint(c, cp.x, cp.y, S.lit.has(cp.x + ',' + cp.y), t);
  for (const d of L.doors) if (vis(d.x - 1, d.x + 2, d.top, d.top + d.h)) A3.door(c, d, S.doors[d.id], t);
  for (const h of L.hooks) if (vis(h.rail[0] - 2, h.rail[1] + 2, h.y - 1, h.y + h.len + 1)) A3.hook(c, h, shown(h, E.hookPose), t);
  const carrierPoses = new Map();
  for (const k of L.carriers){
    const xs = [k.home[0], k.base[0], ...k.drops.map(d => d[0])], ys = [k.home[1], k.base[1], ...k.drops.map(d => d[1])];
    if (!vis(Math.min(...xs) - 5, Math.max(...xs) + 5, Math.min(...ys) - 8, Math.max(...ys) + 1)) continue;
    const p = G.cars && G.cars[k.id] ? G.cars[k.id] : E.carrierPose(S, k); carrierPoses.set(k, p);
    A3.carrierBack(c, k, p, t, L);
  }
  for (const a of L.arms) if (vis(a.base[0] - a.r - 2, a.base[0] + a.r + 2, a.base[1] - a.r - 2, a.base[1] + a.r + 3) && (!a.boss || !a.rounds || (B.on && a.rounds.includes(B.round)) || o.allBoss)) A3.arm(c, a, shown(a, E.armPose), t, S.cam.on && E.live(S, a));
  for (const r of L.rovers) if (vis(r.span[0] - 2, r.span[1] + 2, r.y - 4, r.y) && (!r.boss || (B.on && !B.done && (!r.rounds || r.rounds.includes(B.round))) || o.allBoss)) A3.rover(c, r, shown(r, E.roverPose), t);
  for (const p of L.pickups) if (!S.got.has(p.id) && vis(p.x - 1, p.x + 1, p.y - 1, p.y + 1)){
    if (p.hidden && (!P || Math.hypot(P.x - p.x, P.y - p.y) > 4) && !o.still) continue;
    if (p.type === 'miniMike') drawMiniMike(c, p, t); else A.drawPickup(c, p, t);
  }
  G.af = null;
  if (o.mike !== false && S.dead <= 0) drawMike(c, P.x, P.y, anim.cur, P.facing, { protect:P.hitT < E.INVULN });
  if (o.extraMike) for (const m of o.extraMike) drawMike(c, m.x, m.y, m.pose, m.facing || 1);
  for (const [k, p] of carrierPoses) A3.carrierFront(c, k, p, t);
  if (inCell){ if (B.arms.length) for (const a of B.arms) A3.bigArm(c, L, a, t, B.done, E.sweepOf(S, a));
    else if (B.done || o.allBoss) A3.bigArm(c, L, { st:'load', t:0, x:L.boss.chutes.L.at[0], y:L.boss.chutes.L.at[1], colour:'orange' }, t, B.done); }
  for (const k of (G.crates || E.crates(S))) if (vis(k.x - 1, k.x + 1)) A3.crate(c, k, t);
  for (const d of L.drops) if (!d.boss && vis(d.x - 1, d.x + 1, d.top - 2, d.top + 1)) A3.feederLamp(c, d, shown(d, E.dropPose), t);
  // at a dial: the owner's "Hold E to fix", here "Hold E to re-teach"; nothing says which way it should point
  if (!o.still && B.on && !B.done && B.trans <= 0 && B.dial){ const [dx, dy] = E.nodePos(L.boss, B.dial); c.save(); c.translate(dx*T, dy*T - 44 + Math.sin(t*9)*2); A3.prompt(c, 'hold', isTouch()); c.restore(); }
  for (const f of G.fx){
    const u = f.t/f.life;
    if (f.kind === 'spark'){ if (G.lowQ) continue; c.fillStyle = `rgba(255,255,255,${1 - u})`; A.circ(c, f.x*T + Math.cos(f.a)*u*34, f.y*T + Math.sin(f.a)*u*34, 3.5*(1 - u) + 1); c.fill(); }
    else if (f.kind === 'text'){ c.save(); c.globalAlpha = 1 - u; c.fillStyle = f.color || '#fff'; c.font = `${f.color ? 900 : 700} 22px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,20,40,.7)'; c.strokeText(f.text, f.x*T, f.y*T - u*30); c.fillText(f.text, f.x*T, f.y*T - u*30); c.restore(); }
  }
  if (LAB){ c.strokeStyle = '#0f0'; c.lineWidth = 1; c.strokeRect((P.x - PH.halfW)*T, (P.y - PH.height)*T, 2*PH.halfW*T, PH.height*T); for (const e of S.extra) c.strokeRect(e.x*T, e.y*T, e.w*T, e.h*T); }
  c.restore();
}
// What the cell shows now: the route each arm's crate would take from its chute, for the wall.
function bossState(){
  if (G.boss) return G.boss;
  const B = S.boss, routes = [];
  if (L.boss && B.on && !B.done) for (const a of B.arms) routes.push(Object.assign(E.routeFor(S, a.src), { colour:a.colour, k:a.k }));
  return { S, boss:B, routes };
}
const toScreen = (x, y) => ({ x:(x*T - Math.round(G.camX*Z)/Z)*Z, y:(y*T - Math.round(G.camY*Z)/Z)*Z });

// ---------- the HUD: the shared compact one (js/hud.js) ----------
function drawViewfinder(c){ M.hud.viewfinder(c, { t:G.t, font:FONT, af:G.af ? toScreen(G.af.x, G.af.y) : null }); }
function hud(c, filming){
  M.hud.pills(c, { font:FONT, t:G.t, health:S.health, lives:S.lives, cam:S.cam, filming, score:S.score, salvage:E.salvageCount(S), total:L.salvageTotal, newBest:G.newBest,
    continues:M.campaign.continues, paused:G.paused, lifeIcon:(cc, x, y) => M.puppet.draw(cc, rig, pose('idle', 0, 0, null, 0), x, y, 24, { facing:1 }) });
}
// The route map: five rows, one per layer, in the layers' own colours; the lanes he has walked are lit; his dot.
function routeMap(c){
  const w = 250, h = 58, x = W/2 - w/2, y = H - h - 14, P = S.P;
  c.save(); A.rr(c, x, y, w, h, 10); c.fillStyle = 'rgba(5,17,27,.86)'; c.fill();
  const r = L.rooms.find(r => P.x >= r.x && P.x < r.x + r.width) || L.rooms[L.rooms.length - 1];
  c.font = `600 10px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = '#a9c5d0'; c.fillText(String(L.rooms.indexOf(r) + 1).padStart(2, '0') + '  ' + r.title.toUpperCase(), x + 12, y + 15);
  const mx = x + 12, mw = w - 24, my = y + 22, rowH = 6.5, all = new Set([...(loadProgress().lanes || []), ...S.lanes]);
  for (let i = 0; i < 5; i++){ c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(mx, my + i*rowH, mw, 3); }
  for (const ln of L.lanes){ const lx = mx + mw*ln.rect[0]/L.W, lw = mw*ln.rect[2]/L.W; c.fillStyle = all.has(ln.id) ? A3.P.layer[ln.layer] : 'rgba(255,255,255,.18)'; c.fillRect(lx, my + ln.layer*rowH, lw, 3); }
  const layer = clamp(Math.round((P.y + 12)/8), 0, 4), dx = mx + mw*clamp(P.x/L.W, 0, 1), dy = my + clamp((P.y + 12)/8, 0, 4)*rowH + 1.5;
  A.circ(c, dx, dy, 3.5); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = C.navy; c.lineWidth = 1.5; c.stroke();
  c.restore(); return layer;
}
// The Teach Cell tells the player the job in one short line at the top as it wakes and as each round starts; the round
// lamps are on the chute, in the cell itself.
function bossGoal(c){
  const B = S.boss; if (!B.on || !L.boss) return;
  const text = B.done ? 'ROUTE RESTORED' : ['RE-TEACH THE ARM: GET ITS CRATE TO THE PALLET', 'TWO ARMS: GET BOTH CRATES TO THE PALLET', 'EACH CRATE TO THE PALLET OF ITS COLOUR'][Math.min(B.round, 2)];
  const a = B.done ? Math.min(1, B.restoreT/.3) : G.goalT > 0 ? Math.min(1, G.goalT/.5) : 0; if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.font = `800 14px ${FONT}`; const w = c.measureText(text).width + 40;
  M.hud.pill(c, W/2 - w/2, 68, w, 30, A3.P.mint); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W/2, 83.5); c.restore();
}
function drawOverlay(c){
  const filming = S.cam.on || G.slowShow;
  if (filming) drawViewfinder(c);
  hud(c, filming);
  if (G.paused) routeMap(c);                                  // the route map lives on the pause screen now
  bossGoal(c);
  if (G.card > 0){
    const a = Math.min(1, G.card/.5, (2.8 - G.card)/.3 + .001);
    c.save(); c.globalAlpha = Math.max(0, a);
    A.rr(c, W/2 - 230, 130, 460, 150, 20); c.fillStyle = C.white; c.fill();
    c.drawImage(lockRed, W/2 - 110, 150, 220, 220*lockRed.height/lockRed.width);
    c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `900 34px ${FONT}`; c.fillText('Level 3', W/2, 236);
    c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.fillText('Cobot Mania', W/2, 264); c.restore();
  }
  if (G.milestone){
    const m = G.milestone, u = m.t, fade = Math.min(1, (m.life - u)/.35), s = u < .35 ? 1 + .35*Math.sin(u/.35*Math.PI)*(1 - u/.35) : 1, grow = Math.min(1, u/.18);
    c.save(); c.globalAlpha = fade; c.translate(W/2, 214); c.scale(grow*s, grow*s);
    A.rr(c, -170, -48, 340, 96, 18); c.fillStyle = m.gold ? 'rgba(90,60,0,.92)' : 'rgba(0,44,90,.92)'; c.fill(); c.lineWidth = 4; c.strokeStyle = m.gold ? '#FFE066' : '#a4e8d5'; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = m.gold ? '#FFE066' : C.white; c.font = `900 34px ${FONT}`; c.fillText(m.title, 0, -12);
    c.fillStyle = m.gold ? '#fff' : '#FFE066'; c.font = `900 24px ${FONT}`; c.fillText(m.sub, 0, 24); c.restore();
  }
  if (G.toast){
    const a = Math.min(1, (G.toast.life - G.toast.t)/.4);
    c.save(); c.globalAlpha = a; c.font = `700 22px ${FONT}`; const w = c.measureText(G.toast.text).width + 40;
    A.rr(c, W/2 - w/2, H - 74, w, 44, 22); c.fillStyle = 'rgba(0,44,90,.9)'; c.fill(); c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(G.toast.text, W/2, H - 51); c.restore();
  }
}

// ---------- title and results ----------
function headline(c, text, x, y, maxW, px, color){
  c.font = `900 ${px}px ${FONT}`; const w = c.measureText(text).width, k = Math.min(1, maxW/w);
  c.save(); c.translate(x, y); c.scale(k, 1); c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(text, 0, 0); c.restore();
}
const clockText = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function drawTitle(c){
  // the Switchyard, all five layers busy, behind the words
  G.camX = 42*T; G.camY = -6.5*T; A3.backdrop(c, G.camX, G.camY, G.t, false);
  const ride = carPose('cF', 'carry', .5, 0);
  G.poses = { hH1:1.2 }; G.cars = { cF:ride, cM:carPose('cM', 'ready', 0) };
  drawWorld(c, { mike:false, still:true, extraMike:[{ x:ride.feet[0], y:ride.feet[1], pose:heldPose(.4), facing:1 }] }); G.poses = null; G.cars = null;
  const shade = c.createLinearGradient(0, 0, 960, 0); shade.addColorStop(0, 'rgba(6,16,26,.95)'); shade.addColorStop(.52, 'rgba(6,16,26,.85)'); shade.addColorStop(1, 'rgba(6,16,26,.1)'); c.fillStyle = shade; c.fillRect(0, 0, 960, 540);
  c.fillStyle = '#fff'; A.rr(c, 62, 36, 184, 53, 5); c.fill(); c.drawImage(lockRed, 76, 48, 156, 156*lockRed.height/lockRed.width);
  c.fillStyle = '#91b8c6'; c.font = `600 12px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('A MIKE THE MIC ADVENTURE   /   03', 64, 126);
  headline(c, 'COBOT', 60, 199, 504, 80, '#edf4f5'); headline(c, 'MANIA', 60, 280, 480, 92, A3.P.mint);
  c.fillStyle = '#a9bdc6'; c.font = `500 18px ${FONT}`; c.fillText('Mint cobots grab you and put you somewhere else. Striped ones bite.', 64, 318);
  c.font = `500 15px ${FONT}`; c.fillText('Eleven sections, five layers, no two ways the same. Re-teach the Big Arm to get out.', 64, 342);
  // the two bands, side by side: the level's whole language
  const bx = 64, by = 440;
  c.save(); c.translate(bx, by); A.rr(c, 0, 0, 40, 18, 4); c.fillStyle = A3.P.mint; c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#fff'; for (const o of [12, 24]){ c.beginPath(); c.moveTo(o - 4, 4); c.lineTo(o + 3, 9); c.lineTo(o - 4, 14); c.lineTo(o - 7, 14); c.lineTo(o, 9); c.lineTo(o - 7, 4); c.closePath(); c.fill(); }
  c.fillStyle = '#cfe6ea'; c.font = `700 14px ${FONT}`; c.textBaseline = 'middle'; c.fillText('GRABS YOU. NEVER HURTS. JUMP IT TO STAY PUT.', 52, 9);
  c.translate(0, 30); c.save(); A.rr(c, 0, 0, 40, 18, 4); c.clip(); c.fillStyle = '#17191C'; c.fillRect(0, 0, 40, 18); c.fillStyle = '#F4CA46'; for (let i = -2; i < 8; i++){ c.beginPath(); c.moveTo(i*8, 18); c.lineTo(i*8 + 4, 18); c.lineTo(i*8 + 22, 0); c.lineTo(i*8 + 18, 0); c.closePath(); c.fill(); } c.restore();
  A.rr(c, 0, 0, 40, 18, 4); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#cfe6ea'; c.fillText('HURTS WHILE ITS LIGHT IS RED.', 52, 9); c.restore();
  const ps = pose('wave', 0, .06 + (SCENE_ANIM ? G.t : 0), null, -12);
  M.puppet.draw(c, rigL, ps, 770, 486, 295, { facing:-1 });
  c.fillStyle = '#7698a6'; c.font = `600 11px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(isTouch() ? 'RUN   JUMP / LET GO   LOOK BELOW   CAMERA   USE' : '← → RUN   SPACE JUMP / LET GO   ↓ LOOK BELOW   C CAMERA   E USE', 64, 516);
}
function carPose(id, st, s, i){                               // a carrier frozen at a moment, for still scenes
  const k = L.carriers.find(k => k.id === id); i = i || 0;
  const trav = k.travels[i], fake = { mt:0, ride:null, car:{ [id]:{ st, n:i, from:k.home, to:k.drops[i], trav, t:st === 'carry' ? s*trav : st === 'back' ? s*trav*E.R.backK : st === 'grip' ? s*E.R.grip : 0 } } };
  return E.carrierPose(fake, k);
}
function drawResults(c, r){
  r = r || { score:11200, salvage:24, sd:2, mini:1, time:398, lost:1, cont:0, best:24, level1:7650, level2:9350, total:28200,
    lanes:['assembly-m', 'assembly-f', 'roof-g', 'weld-m', 'packout-f', 'packout-u'], run:['assembly-f', 'roof-g', 'weld-m', 'packout-f'] };
  c.fillStyle = 'rgba(0,44,90,.25)'; c.fillRect(0, 0, W, H);
  // the same card as Levels 1 and 2, with the campaign total
  A.rr(c, 32, 28, 520, 484, 22); c.fillStyle = C.white; c.fill();
  c.drawImage(lockRed, 66, 56, 200, 200*lockRed.height/lockRed.width);
  headline(c, 'The Big Arm is re-taught', 64, 144, 456, 44, C.navy);
  c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('Every cobot is back on its program.', 66, 176);
  const total = k => L.pickups.filter(p => p.type === k).length;
  const rows = [['Level 3 score', r.score.toLocaleString('en-GB')], ['Level 2 score', (r.level2 || 0).toLocaleString('en-GB')], ['Level 1 score', (r.level1 || 0).toLocaleString('en-GB')],
    ['Campaign total', (r.total || r.score).toLocaleString('en-GB')], ['Salvage collection', r.salvage + ' / ' + L.salvageTotal], ['SD cards', r.sd + ' / ' + total('sdCard')],
    ['Mini Mike', r.mini + ' / 1'], ['Time', clockText(r.time)], ['Lives lost', String(r.lost)], ['Continues used', String(r.cont)]];
  rows.forEach(([k, v], i) => { const y = 206 + i*22, tot = k === 'Campaign total';
    c.font = `${tot ? 900 : 600} 19px ${FONT}`; c.fillStyle = tot ? C.navy : '#34414F'; c.textAlign = 'left'; c.fillText(k, 66, y);
    c.font = `${tot ? 900 : 700} 19px ${FONT}`; c.fillStyle = tot ? C.red : C.navy; c.textAlign = 'right'; c.fillText(v, 516, y);
    c.strokeStyle = tot ? 'rgba(0,44,90,.35)' : 'rgba(0,44,90,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(66, y + 7); c.lineTo(516, y + 7); c.stroke(); });
  // The route log, on a card of its own: the lanes of each section, top layer first. Filled where he has ever been (on
  // this device, across runs), ringed in red where he went this run. The "play a lot to cover every path" record.
  const lanes = L.lanes, explored = lanes.filter(l => r.lanes.includes(l.id)).length, zones = [...new Set(lanes.map(l => l.zone))].sort((a, b) => a - b);
  const sectionOf = z => { const ln = lanes.find(l => l.zone === z), rm = L.rooms.find(rm => ln.rect[0] >= rm.x && ln.rect[0] < rm.x + rm.width); return rm ? rm.title : ''; };
  const px = 572, py = 28, pw = 356, gap = 60, ph = 92 + zones.length*gap;
  A.rr(c, px, py, pw, ph, 22); c.fillStyle = C.white; c.fill();
  c.textBaseline = 'alphabetic'; c.font = `900 20px ${FONT}`; c.fillStyle = C.navy; c.textAlign = 'left'; c.fillText('Routes explored', px + 22, py + 38);
  c.fillStyle = C.red; c.textAlign = 'right'; c.fillText(explored + ' / ' + lanes.length, px + pw - 22, py + 38);
  const chip = (x, y, w, lit, run, h) => { h = h || 26; A.rr(c, x, y, w, h, h/2); c.fillStyle = lit ? C.navy : '#EDF1F4'; c.fill(); if (run){ c.strokeStyle = C.red; c.lineWidth = 2.5; c.stroke(); } };
  c.font = `600 12px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  if (explored === lanes.length){ c.fillStyle = C.red; c.font = `800 12px ${FONT}`; c.fillText('EVERY ROUTE. RESPECT.', px + 22, py + 62); }
  else { chip(px + 22, py + 61, 24, true, false, 14); c.fillStyle = '#5A6B78'; c.fillText('Travelled', px + 52, py + 68.5); const w = c.measureText('Travelled').width;
    chip(px + 70 + w, py + 61, 24, false, true, 14); c.fillStyle = '#5A6B78'; c.fillText('This run', px + 100 + w, py + 68.5); }
  let y = py + 104;
  for (const z of zones){
    c.font = `800 11px ${FONT}`; c.fillStyle = '#7A8995'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(sectionOf(z).toUpperCase(), px + 22, y);
    let x = px + 22;
    for (const ln of lanes.filter(l => l.zone === z).sort((a, b) => a.layer - b.layer)){
      c.font = `700 13px ${FONT}`; const w = c.measureText(ln.title).width + 24, lit = r.lanes.includes(ln.id);
      chip(x, y + 8, w, lit, r.run.includes(ln.id));
      c.fillStyle = lit ? '#fff' : '#7A8995'; c.textBaseline = 'middle'; c.fillText(ln.title, x + 12, y + 21.5); c.textBaseline = 'alphabetic';
      x += w + 8;
    }
    y += gap;
  }
}

// ---------- scenes: one still frame of the real level ----------
let SCENE_DRAW = null, SCENE_ANIM = false;
function still(camX, camY, mike, set){
  G.mode = 'scene'; S = E.create(L); S.P = M.newPlayer(mike.x, mike.y); S.P.facing = mike.facing || 1; S.P.hitT = 9;
  if (set && set.state) set.state(S);
  for (const d of L.doors) S.doors[d.id] = E.doorWants(S, d) ? 1 : 0;
  Object.assign(G, { camX:camX*T, camY:camY*T, poses:null, boss:null, cars:null, crates:null, slowShow:null, fx:[], card:0, milestone:null, toast:null, big:null }, set && set.g);
  S.cam.boss = S.boss.on && !S.boss.done;
  const ps = mike.pose || pose('idle', 0, .3, null, 14);
  SCENE_DRAW = c => { A3.backdrop(c, G.camX, G.camY, G.t, false); drawWorld(c, { mike:false, still:true, allBoss:set && set.allBoss, extraMike:mike.hide ? [] : [{ x:mike.x, y:mike.y, pose:ps, facing:mike.facing || 1 }] }); drawOverlay(c); };
}
const X3 = () => L.boss.bounds[0];
// a Teach Cell scene: round r, the arm placed by set(s), Mike at m (cell-local x)
function armAt(s, k, st, at, to, u, t){
  const def = L.boss, p0 = E.nodePos(def, at), p1 = to ? E.nodePos(def, to) : p0, len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  Object.assign(s.boss.arms[k], { st, at, to:to || at, u:u*len, t:t || 0, x:p0[0] + (p1[0] - p0[0])*u, y:p0[1] + (p1[1] - p0[1])*u });
}
// an arm on its sweep: lowered and aiming (u = 0), or that far across the cell
function sweepAt(s, k, st, u, n){
  const a = s.boss.arms[k]; a.n = n || 0; const sw = E.sweepOf(s, a);
  Object.assign(a, { st, t:.2, x:sw.from + (sw.to - sw.from)*u, y:sw.y });
}
function bossScene(r, set, m){
  return () => still(X3(), -.6, { x:X3() + m.x, y:m.y, facing:m.facing || 1, pose:m.pose === 'fix' ? pose('fix', 0, .3, null, 14) : pose('idle', 0, .3, null, 16) },
    { state:s => { s.boss.on = true; E.startRound(s, r); s.boss.t = 3; set(s); }, g:{ goalT:r === 2 ? 4 : 0 } });
}
const held = (id, st, u, i, cam, more) => () => { const p = carPose(id, st, u, i); still(cam[0], cam[1], { x:p.feet[0], y:p.feet[1], pose:heldPose(.4) }, { g:Object.assign({ cars:{ [id]:p } }, more) }); };
const SCENES = {
  'title': () => { G.mode = 'scene'; S = E.create(L); SCENE_DRAW = drawTitle; menu('title'); },
  'induction': () => still(0, -1.2, { x:4.6, y:12, pose:pose('idle', 0, .4, null, 14) }, { g:{ poses:{ a1:.2, r1:1 } } }),
  'first-grab': held('c1', 'carry', .45, 0, [1.5, -2.4], { poses:{ r1:3, a1:.2 } }),
  'jump-it': () => still(1.5, -1.2, { x:10.5, y:8.6, pose:pose('jump', 0, 0, null, 28) }, { g:{ poses:{ r1:1 } } }),
  'floor-arm': () => still(26, -1.4, { x:36.2, y:12, pose:pose('run', 1.2, 0, null, 30) }, { g:{ poses:{ a1:1.05, r1:5 } } }),
  'hook': () => { const h = L.hooks.find(h => h.id === 'h1'), p = E.hookPose(h, 2); still(18, -4.6, { x:p.hx, y:p.hy + E.R.hands, pose:hangPose(.5) }, { g:{ poses:{ h1:2 } } }); },
  'switchyard': held('cF', 'carry', .55, 0, [42, -6.6]),
  'switchyard-low': () => still(42, 8.4, { x:53.6, y:12, pose:pose('idle', 0, .3, null, 16) }),
  'cell-row': () => still(66, -3.8, { x:79.4, y:4, pose:pose('run', 1.2, 0, null, 30) }, { g:{ poses:{ a2:1.2, a3:.5, a4:3.2, hH1:2.5, hH2:0 } } }),
  'the-line': held('cF3', 'carry', .5, 0, [84, 1.2], { poses:{ rT:5, r2:2 } }),
  'hook-relay': () => { const h = L.hooks.find(h => h.id === 'hH2'), p = E.hookPose(h, 1.4); still(70, -11.4, { x:p.hx, y:p.hy + E.R.hands, pose:hangPose(.2) }, { g:{ poses:{ hH1:3.2, hH2:1.4, d1:.5 } } }); },
  'tower': held('cT1', 'carry', .6, 0, [108, -15.4]),
  'roof': () => still(132, -19.4, { x:146.5, y:-12, pose:pose('run', .8, 0, null, 30) }, { g:{ poses:{ aG1:1.2, aG2:2.6, rG:2, dG1:.6 } } }),
  'return-belts': () => still(138, 9.4, { x:150, y:20, pose:pose('run', .4, 0, null, 30) }, { g:{ poses:{ d2:.6, d3:1.4 } } }),
  'weld-alley': () => still(196, -3.8, { x:209.5, y:4, pose:pose('idle', 0, .3, null, 16) }, { g:{ poses:{ aW1:1.3, aW2:3.3, aW3:1.2, aW4:2.6 } } }),
  'rover-yard': () => still(198, 1.2, { x:204.1, y:9.4, pose:pose('idle', 0, .3, null, 16) }, { g:{ poses:{ rY1:2.6, rY2:1 } } }),
  'crossing': held('cD2', 'carry', .5, 1, [252, -6.6]),
  'sorting-line': () => still(284, -11.4, { x:288.5, y:-4, pose:pose('run', 1.2, 0, null, 30) }, { g:{ poses:{ aP1:1.1, aP2:2.4, dP1:.5, bP1:0 } } }),
  'wrap-station': held('cW4', 'carry', .5, 0, [292, 1.2], { poses:{ rW2:4, rW1:3 } }),
  'sorter': () => still(298, 9.4, { x:314.6, y:20, pose:pose('idle', 0, .3, null, -16) }, { g:{ poses:{ dS1:.5 } } }),
  'marshalling': () => still(332, -8, { x:344.6, y:-4, pose:pose('idle', 0, .3, null, 16) }),
  // the Teach Cell: set the round and the arm, then a still frame
  'boss-idle': bossScene(0, s => armAt(s, 0, 'move', 'A', 'B', .45), { x:3.4, y:12 }),
  'boss-break': bossScene(0, s => armAt(s, 0, 'tell', 'F', null, 0, .4), { x:7.2, y:12, facing:-1 }),
  'boss-reteach': bossScene(0, s => { s.boss.dials.F = 0; armAt(s, 0, 'tell', 'G', null, 0, .2); s.boss.dial = 'G'; s.boss.fix = .62; }, { x:12, y:12, pose:'fix' }),
  'boss-deliver': bossScene(0, s => { s.boss.dials.F = 0; s.boss.dials.G = 0; armAt(s, 0, 'place', 'P1', null, 0, .3); }, { x:16, y:12 }),
  'boss-sweep-warn': bossScene(0, s => sweepAt(s, 0, 'aim', 0, 0), { x:6.6, y:8, facing:1 }),
  'boss-sweep': bossScene(0, s => sweepAt(s, 0, 'sweep', .45, 1), { x:10, y:12, facing:-1 }),
  'boss-two': bossScene(1, s => { armAt(s, 0, 'tell', 'A', null, 0, .3); armAt(s, 1, 'move', 'D', 'C', .6); }, { x:17.4, y:8, facing:-1 }),
  'boss-colours': bossScene(2, s => { armAt(s, 0, 'move', 'A', 'B', .5); sweepAt(s, 1, 'aim', 0, 0); }, { x:12, y:9.4, facing:1 }),
  'results': () => { G.mode = 'scene'; S = E.create(L); S.boss.done = true; S.boss.on = true; S.doors.exit = 1; G.camX = X3()*T; G.camY = -.6*T;
    SCENE_DRAW = c => { A3.backdrop(c, G.camX, G.camY, G.t, false); drawWorld(c, { mike:false, still:true, extraMike:[{ x:X3() + 19, y:12, pose:pose('wave', 0, .1, null, -14) }] }); drawResults(c); }; menu('results'); },
  'bands': () => { G.mode = 'scene'; S = E.create(L); SCENE_DRAW = drawBands; },
  'poses': () => { G.mode = 'scene'; S = E.create(L); SCENE_DRAW = drawPoses; }
};
M.L3_SCENES = Object.keys(SCENES);
function sheet(c, title){
  c.fillStyle = '#0d2430'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 32){ c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); } for (let y = 0; y <= H; y += 32){ c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
  c.fillStyle = '#b7eae0'; c.font = `900 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(title, 24, 36);
}
function label(c, s, x, y, sub){ c.fillStyle = '#cfe6ea'; c.font = `700 14px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); if (sub){ c.font = `500 12px ${FONT}`; c.fillStyle = '#8fb3b9'; c.fillText(sub, x, y + 16); } }
// The whole language of the level on one sheet: what carries him and what hurts him, in colour and in greyscale.
function drawBands(c){
  sheet(c, 'Cobot Mania: mint carries you, stripes hurt you');
  const draw = (ox, grey) => {
    c.save(); c.translate(ox, 0); if (grey) c.filter = 'grayscale(1)';
    const k = { id:'x', base:[1.6, 6.4], mount:'column', home:[4.3, 9.5], drops:[[6, 4]], sway:.3, top:2.5, link:2.4 }, p = { st:'carry', open:0, feet:[4.3, 5.4], tip:[4.3, 5.4 - .9], next:[6, 4] };
    c.fillStyle = '#6C7580'; c.fillRect(1.6*T - 7, 2.4*T, 14, 7.4*T);
    A3.carrierBack(c, k, p, G.t, false); M.puppet.draw(c, rig, heldPose(.3), 4.3*T, 5.4*T, 2*T, { facing:1 }); A3.carrierFront(c, k, p, G.t);
    const h = { id:'y', rail:[9, 12], y:2.6, len:1.95, period:4, dwell:.5 }; c.fillStyle = '#6F7A85'; c.fillRect(8.2*T, 2.6*T - 7, 5*T, 12);
    A3.hook(c, h, { x:10.5, hx:10.5, hy:4.55 }, G.t); M.puppet.draw(c, rig, hangPose(.3), 10.5*T, (4.55 + E.R.hands)*T, 2*T, { facing:1 });
    const a = { id:'z', base:[3, 13.4], mount:'floor', r:2.2, a0:-90, a1:-10, cycle:3, tell:.6, active:1, tool:'welder', link:1.4, phase:0 };
    c.fillStyle = '#5E6873'; c.fillRect(2.5*T, 13.4*T, T, 1.6*T); A3.arm(c, a, E.armPose(a, 1.2), G.t);
    A3.rover(c, { span:[8, 12], y:15, tall:false, phase:0 }, { x:10.5, dir:1, moving:true }, G.t);
    c.restore();
  };
  draw(0, false); draw(480, true);
  label(c, 'Carrier: mint band and light rings, soft gripper. Grabs on touch', 220, 345); label(c, 'Hook: mint handle', 336, 250);
  label(c, 'Hazard: stripes, a tool, light rings red / amber / green', 190, 505); label(c, 'Rover: striped skirt, beacon', 336, 432);
  c.fillStyle = '#8fb3b9'; c.font = `600 13px ${FONT}`; c.textAlign = 'center'; c.fillText('The same machines in greyscale: chevrons and cradles still tell against stripes and tools', 720, 530);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(480, 60); c.lineTo(480, 500); c.stroke();
}
function drawPoses(c){
  sheet(c, 'Mike on the cobots: the signed-off puppet, never redrawn');
  const list = [['idle', pose('idle', 0, .3, null, 12)], ['run', pose('run', 1.2, 0, null, 30)], ['jump', pose('jump', 0, 0, null, 28)], ['held by a carrier', heldPose(.3)],
    ['hanging from a hook', hangPose(.3)], ['pressing a key', pose('fix', 0, .3, null, 12)], ['hit', pose('hit', 0, 0, { away:-1 }, -20)], ['filming', pose('idle', 0, .3, { camera:true }, 12)]];
  list.forEach(([name, ps], i) => { const x = 130 + (i % 4)*232, y = i < 4 ? 232 : 452; M.puppet.draw(c, rigL || rig, ps, x, y, 168, { facing:1 });
    c.fillStyle = '#cfe6ea'; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.fillText(name, x, y + 26); });
}

// ---------- draw and loop ----------
const perf = { work:[], frame:[], slow:0 };
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length*p))]; };
function draw(){
  if (!L) return; ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.mode === 'play'){ A3.backdrop(ctx, G.camX, G.camY, G.t, G.lowQ); ctx.save(); if (G.shake) ctx.translate(Math.sin(G.t*95)*G.shake*12, Math.cos(G.t*81)*G.shake*7); drawWorld(ctx); ctx.restore(); drawOverlay(ctx); if (LAB) labText(); }
  else if (G.mode === 'results'){ A3.backdrop(ctx, G.camX, G.camY, G.t, G.lowQ); drawWorld(ctx); drawResults(ctx, G.results); }
  else if (SCENE_DRAW) SCENE_DRAW(ctx);
}
function labText(){
  const P = S.P; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(12, H - 76, 640, 64); ctx.fillStyle = '#fff'; ctx.font = '13px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`x ${P.x.toFixed(2)} y ${P.y.toFixed(2)} vx ${P.vx.toFixed(2)} vy ${P.vy.toFixed(2)} ${S.ride ? 'held ' + S.ride.id : S.hang ? 'hook ' + S.hang.id : P.ground ? 'ground' : 'air'}`, 20, H - 56);
  ctx.fillText(`machine ${S.mt.toFixed(2)} boss ${S.boss.on ? 'round ' + S.boss.round + ' prog ' + S.boss.program.join('') + ' t ' + S.boss.t.toFixed(1) : 'off'} state ${anim.st}`, 20, H - 38);
  ctx.fillText(`frame p95 ${pct(perf.frame, .95).toFixed(1)} ms · work p50 ${pct(perf.work, .5).toFixed(1)} p95 ${pct(perf.work, .95).toFixed(1)} ms · chunks ${chunks.size} quality ${G.lowQ ? 'reduced' : 'full'}`, 20, H - 20); ctx.restore();
}
let acc = 0, last = 0, manual = TEST;
function frame(now){
  requestAnimationFrame(frame);
  const dt = last ? Math.min(.25, (now - last)/1000) : 0; last = now;
  const t0 = performance.now();
  if (G.mode === 'play' && !G.paused && !manual && !(isTouch() && document.body.classList.contains('portrait'))){
    acc += dt; let n = 0;
    while (acc >= STEP && n < PH.maxSteps && G.mode === 'play'){ update(STEP); acc -= STEP; n++; }
    if (n === PH.maxSteps) acc = 0;
  }
  if (SCENE_ANIM || G.mode === 'results') G.t += dt;
  if (G.mode === 'play' || G.mode === 'results' || SCENE_ANIM) draw();
  const work = performance.now() - t0;
  if (G.mode === 'play' && dt){ perf.work.push(work); perf.frame.push(dt*1000); if (perf.work.length > 300){ perf.work.shift(); perf.frame.shift(); }
    perf.slow = work > 12 ? perf.slow + 1 : 0; if (perf.slow > 90) G.lowQ = true; }                 // parallax and sparks go first; tells and bands never
}

// ---------- menus ----------
function menu(kind){ const m = $('menu'); m.hidden = false; m.dataset.kind = kind; $('resume-save').hidden = !(kind === 'title' && L && loadSave()); }
function toTitle(){
  G.mode = 'title'; document.body.dataset.mode = 'title'; S = E.create(L); AU.hum(false); AU.boss(false); $('pausebox').hidden = true; G.paused = false;
  SCENE_DRAW = drawTitle; SCENE_ANIM = true; menu('title');
  if (!TEST) history.replaceState(null, '', location.pathname);
}
$('play').onclick = () => { AU.unlock(); AU3.unlock(); clearSave(); startPlay(); };
$('resume-save').onclick = () => { AU.unlock(); AU3.unlock(); startPlay(loadSave()); };
// the end of the campaign: every total on the card, and the only way on is a new game from Level 1 (owner, 2 Oct)
$('res-new').onclick = () => { clearSave(); M.campaign.restart(); location.href = './'; };
$('resume').onclick = () => setPaused(false);
$('restart-cp').onclick = () => { setPaused(false); S.health = 0; S.lives++; S.livesLost--; S.dead = .01; S.events = []; };
$('quit').onclick = () => { save(); setPaused(false); toTitle(); };
$('pause').onclick = () => { if (G.mode === 'play') setPaused(!G.paused); };
function soundLabel(){ $('sound').classList.toggle('off', AU.muted); $('sound').setAttribute('aria-label', AU.muted ? 'Sound off' : 'Sound on'); $('snd-toggle').textContent = 'Sound: ' + (AU.muted ? 'off' : 'on'); }
$('sound').onclick = $('snd-toggle').onclick = () => { AU.unlock(); AU3.unlock(); AU.setMuted(!AU.muted); soundLabel(); };

// ---------- boot ----------
function img(src){ const i = new Image(); i.src = src; return i.decode().then(() => i); }
async function boot(){
  const [data] = await Promise.all([fetch('level-3.json').then(r => r.json()), M.puppet.load('assets/'), AU.preload()]);
  L = E.load(data); A3.L = L;
  if (L.errors.length) console.error('Level 3 failed validation: ' + L.errors.join('; '));
  lockRed = await img('assets/mtdcnc-lockup-red.png');
  rig = await M.puppet.bake(2*2*T*Z/M.puppet.HEIGHT);
  if (!SCENE || ['title', 'results', 'poses'].includes(SCENE) || !ROOM) rigL = await M.puppet.bake(.42);
  soundLabel();
  if (!unlocked()){ document.body.dataset.mode = 'locked'; $('loading').hidden = true; $('locked').hidden = false; return; }
  $('loading').hidden = true;
  if (SCENE){ const f = SCENES[SCENE]; if (!f){ console.error('unknown scene ' + SCENE); return; } document.body.dataset.mode = 'scene'; f(); draw(); }
  else if (ROOM){ startPlay(null, ROOM === 'boss' ? 'boss' : +ROOM); draw(); }
  else toTitle();
  document.body.dataset.ready = '1';
  requestAnimationFrame(frame);
}
window.__l3 = {
  get S(){ return S; }, get L(){ return L; }, get G(){ return G; },
  reset(room){ manual = true; testInput = null; startPlay(null, room || 0); G.card = 0; draw(); return this.snapshot(); },
  resume(){ const sv = loadSave(); manual = true; startPlay(sv); return !!sv; },
  step(n, inp){ manual = true; testInput = Object.assign({}, inp); for (let i = 0; i < (n || 1) && G.mode === 'play'; i++) update(STEP); draw(); return this.snapshot(); },
  place(x, y, o){ S.P = M.newPlayer(x, y); S.P.hitT = 9; S.ride = null; S.hang = null; Object.assign(S, o); G.camY = targetCamY(); follow(1, true); draw(); return this.snapshot(); },
  release(){ testInput = null; manual = false; },
  snapshot(){ return S && Object.assign(E.snapshot(S), { camX:G.camX, camY:G.camY, mode:G.mode, state:anim.st, lookDown:S.lookDown, sx:toScreen(S.P.x, S.P.y).x, sy:toScreen(S.P.x, S.P.y).y, paused:G.paused }); },
  clearSave, save, perf(){ return { workP50:pct(perf.work, .5), workP95:pct(perf.work, .95), frameP95:pct(perf.frame, .95), lowQ:G.lowQ }; },
  scenes:() => M.L3_SCENES, draw
};
boot().catch(e => { console.error(e); $('loading').textContent = 'Could not start: ' + e.message; });
})();
