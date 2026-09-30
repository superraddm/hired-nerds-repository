// Mike the Mic, Level 2: Below the Wire. The page around the rules in l2-world.js: loop, input, camera, drawing,
// the HUD with the suit's static charge, saves, menus, still scenes (?scene=<name>) and test hooks (window.__l2).
// Level 1's files are used as they are and are not changed: its puppet, terrain, pickups, backdrop, audio and voice.
(function(){
'use strict';
const M = window.MIKE, A = M.art, A2 = M.art2, E = M.L2, T = A.T, C = A.C, FONT = A.FONT, PH = M.PHYS, AU = M.audio, AU2 = M.audio2;
const W = 960, H = 540, Z = 1.25, VW = W/Z, VH = H/Z, STEP = PH.step;
// The page's debug switches (?room, ?scene, ?demo, ?test, ?lab) work only when served locally. On the live site the
// level opens only for someone who has finished Level 1 (owner, 30 Sept: the level's address must not be a way round Level 1).
const LOCAL = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || location.protocol === 'file:';
const q = new URLSearchParams(LOCAL ? location.search : ''), SCENE = q.get('scene'), TEST = q.has('test'), LAB = q.has('lab'), ROOM = q.get('room'), DEMO = q.has('demo');
function unlocked(){ return LOCAL || M.campaign.cleared('level-1'); }        // only this campaign's own clear of Level 1 opens the door; a restart shuts it again
const SAVE_KEY = 'mike-game.l2.v1.save', PROGRESS_KEY = 'mike-game.l2.v1.progress';
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), stage = document.getElementById('stage'), $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let L, S, rig, rigL, lockRed, demo = null;
const G = { mode:'loading', paused:false, camX:0, camY:0, look:4, fx:[], card:0, toast:null, milestone:null, scorePop:0, lastScore:0, newBest:false, bestAtStart:0,
  shake:0, lowQ:false, t:0, results:null, slowShow:null, af:null, airPulse:0 };
const anim = { st:'idle', s:0, from:null, cur:null, blend:1, phase:0, turn:12, idle:0, stroke:0 };
const chunks = new Map(), CH_TOP = -12, CH_H = 41;

// ---------- input ----------
const keys = new Set(), touchHeld = new Map(); let testInput = null;
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'jump', KeyW:'jump', ArrowUp:'jump', ArrowDown:'lookDown', KeyS:'lookDown', KeyX:'dive',
  KeyC:'camera', ShiftLeft:'camera', ShiftRight:'camera', KeyE:'fix', Escape:'pause', KeyP:'pause' };
addEventListener('keydown', e => {
  AU.unlock(); AU2.unlock();
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
  // Down is one control (owner, 29 Sept): on dry land it looks below, in the fluid it dives, and the view leads the dive.
  // X still dives, for anyone who learned it.
  const down = held.has('lookDown');
  return { left:held.has('left'), right:held.has('right'), jump:held.has('jump'), dive:held.has('dive') || (down && !!S && S.wet), camera:held.has('camera'), fix:held.has('fix'), lookDown:down };
}
function clearInput(){ keys.clear(); touchHeld.clear(); document.querySelectorAll('.tc.on').forEach(b => b.classList.remove('on')); }
document.querySelectorAll('.tc').forEach(b => {
  const ctl = b.dataset.ctl;
  b.addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); AU2.unlock(); document.body.classList.add('touch'); try { b.setPointerCapture(e.pointerId); } catch(_){}
    touchHeld.set(e.pointerId, ctl); b.classList.add('on'); });
  const up = e => { if (touchHeld.get(e.pointerId) === ctl){ touchHeld.delete(e.pointerId); if (![...touchHeld.values()].includes(ctl)) b.classList.remove('on'); } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, up));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
addEventListener('pointerdown', e => { AU.unlock(); AU2.unlock(); if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture:true, passive:true });
const isTouch = () => document.body.classList.contains('touch');
function setPaused(p){
  G.paused = p; clearInput(); $('pausebox').hidden = !p;
  if (p){ $('pause-score').textContent = 'Score ' + S.score.toLocaleString('en-GB'); save(); AU.hum(false); AU.suspend(); AU2.suspend(); } else { AU.resume(); AU2.resume(); }
}
addEventListener('blur', () => { if (G.mode === 'play' && !TEST && !DEMO) setPaused(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden){ if (G.mode === 'play' && !TEST && !DEMO) setPaused(true); AU.suspend(); AU2.suspend(); } });

// ---------- layout ----------
function fit(){
  const vw = innerWidth, vh = innerHeight, s = Math.min(vw/W, vh/H);
  stage.style.transform = `translate(${(vw - W*s)/2}px,${(vh - H*s)/2}px) scale(${s})`;
  document.body.classList.toggle('portrait', vh > vw);
}
addEventListener('resize', fit); fit();

// ---------- save: Level 2 keeps its own, apart from Level 1's ----------
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

// ---------- start ----------
function startPlay(sv, room){
  G.mode = 'play'; document.body.dataset.mode = 'play'; SCENE_DRAW = null; SCENE_ANIM = false;
  S = E.create(L, sv, { variant:DEMO ? 0 : (loadProgress().bossRuns || 0) % 3 });       // each finished run meets the next of the three orders
  if (room){                                                // ?room=3: start a room at its first checkpoint, suited (for testing a room on a device)
    const bossStart = room === 'boss', r = L.rooms[bossStart ? L.rooms.length - 1 : room - 1];
    const cp = bossStart ? L.checkpoints.filter(c => c.x < L.boss.bounds[0]).at(-1) : L.checkpoints.find(c => c.x >= r.x) || L.checkpoints[0];
    S.suit = bossStart || room > 1; S.checkpoint = { x:cp.x, y:cp.y }; S.refuge = { x:cp.x, y:cp.y }; S.lit = new Set(L.checkpoints.filter(c => c.x <= cp.x).map(c => c.x)); S.P = M.newPlayer(cp.x, cp.y);
    if (bossStart){
      // Repeatable boss playtest with earlier SD cards; the health pickup ahead stays unclaimed.
      for (const p of L.pickups) if (p.type === 'sdCard' && p.x < cp.x){ S.got.add(p.id); S.inv.sdCard++; }
      S.cam = M.newCamera(S.inv.sdCard);
    }
  }
  Object.assign(G, { fx:[], card:sv || room ? 0 : 2.8, toast:null, milestone:null, scorePop:0, lastScore:S.score, newBest:false, bestAtStart:loadProgress().best || 0, shake:0, results:null, slowShow:null, paused:false, t:0 });
  anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur; anim.turn = 12; anim.blend = 1;
  G.look = 4; G.camY = targetCamY(); follow(1, true);
  delete document.body.dataset.done;
  $('menu').hidden = true; $('pausebox').hidden = true; AU.boss(false); AU.hum(false);
}

// ---------- the step ----------
const SAID = { lubricant:'+1 HEALTH', sdCard:'+1.5s FOOTAGE', miniMike:'EXTRA LIFE' };
function update(dt){
  const inp = readInput(), P0 = S.P;
  E.step(S, inp, dt);
  const P = S.P;
  const run = S; for (const e of S.events) react(e);
  if (S !== run) return;                                     // the level started again on its last life: nothing more this step
  G.t += dt;
  if (G.card > 0) G.card -= dt;
  if (G.toast && (G.toast.t += dt) > G.toast.life) G.toast = null;
  if (S.score > G.lastScore){ G.scorePop = 1; if (!G.newBest && G.bestAtStart > 0 && S.score > G.bestAtStart){ G.newBest = true; G.milestone = { title:'NEW HIGH SCORE!', sub:'BEAT ' + G.bestAtStart.toLocaleString('en-GB'), t:0, life:2.2, gold:true }; AU.play('checkpoint'); } }
  G.lastScore = S.score; G.scorePop = Math.max(0, G.scorePop - dt*3);
  if (G.milestone && (G.milestone.t += dt) > G.milestone.life) G.milestone = null;
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life); if (G.fx.length > 48) G.fx.splice(0, G.fx.length - 48);
  G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, (G.flash || 0) - dt);
  // the pack vents a bubble now and then; the helmet is sealed and vents nothing
  if (S.headWet && S.dead <= 0 && Math.floor(G.t*.9) !== Math.floor((G.t - dt)*.9) && !G.lowQ) G.fx.push({ kind:'bubble', x:P.x - P.facing*.3, y:P.y - .9, t:0, life:1.1, seed:G.t });
  if (S.cam.on && S.cam.left <= 1 && S.cam.left + dt > 1) AU.play('lowCharge');
  if (S.cam.refused > 1.19) AU.play('refuse');
  animate(dt); follow(dt);
  const tc = $('tc-fix'); if (tc) tc.classList.toggle('show', canUse());
  const tl = $('tc-look'); if (tl && tl.classList.contains('wet') !== S.wet){ tl.classList.toggle('wet', S.wet); tl.setAttribute('aria-label', S.wet ? 'Hold to dive' : 'Hold to look below'); }
  if (S.won && G.mode === 'play') win();
}
const nearWheel = () => { if (S.boss.on) return null; const P = S.P; for (const v of L.valves) for (const w of v.wheels) if (Math.abs(P.x - w[0]) < 1.3 && Math.abs(P.y - PH.height/2 - w[1]) < 1.5) return { v, w }; return null; };
const canUse = () => !!nearWheel() || (S.boss.on && !S.boss.done);
function react(e){
  const P = S.P;
  switch (e.type){
    case 'jump': AU.play('jump'); break;
    case 'land': AU.play('land'); break;
    case 'kick': AU2.play('kick'); G.fx.push({ kind:'splash', x:P.x, y:S.surface === null ? P.y : S.surface, t:0, life:.5, size:.8 }); break;
    case 'splash': if (Math.abs(e.v) > 1.5){ AU2.play('splash', e.v); G.fx.push({ kind:'splash', x:e.x, y:e.y, t:0, life:.6, size:clamp(Math.abs(e.v)/9, .6, 1.5) }); } break;
    case 'surface': AU2.play('surface'); break;
    case 'hit': AU.play('bonk'); AU2.play('zap'); AU.say('pain'); G.shake = .22; break;
    case 'staticHigh': AU2.play('staticHigh'); break;
    case 'earthed': AU2.play('earthed'); break;
    case 'discharge': AU2.play('discharge'); AU.say('pain'); G.shake = .3; G.flash = .35; G.camY = targetCamY(); follow(1, true); break;
    case 'lifeLost': AU.play('fall'); AU.hum(false); save(); break;
    case 'respawn': anim.st = 'idle'; anim.cur = M.puppet.pose('idle', 0, 0); anim.from = anim.cur; G.camY = targetCamY(); follow(1, true); save(); break;
    case 'gameOver': {                                     // the last life: a continue restarts the level; none left restarts the game
      clearSave();
      if (M.campaign.useContinue()){ const used = S.continues + 1, left = M.campaign.continues; startPlay(); S.continues = used; toast(left ? `Continue used. ${left} left` : 'Last continue used'); }
      else { M.campaign.restart(); location.href = './'; }
      break; }
    case 'camOn': AU.play('camOn'); AU.hum(true); break;
    case 'camOff': AU.play('camOff'); AU.hum(false); break;
    case 'suit': AU2.play('suit'); AU.say('power'); G.fx.push({ kind:'text', x:P.x, y:P.y - 2.6, text:'SUIT ON', t:0, life:1.2, color:A2.P.warn }); save(); break;
    case 'valve': AU2.play('valve'); AU2.play('drain'); save(); break;
    case 'checkpoint': AU.play('checkpoint'); save(); break;
    case 'collect': {
      const p = e.p; AU.play(p.type === 'lubricant' ? 'lube' : p.type === 'miniMike' ? 'sd' : p.type === 'sdCard' || p.type === 'controlUnit' ? 'unit' : 'part');
      if (SAID[p.type] || p.type === 'controlUnit') AU.say('power');
      for (let i = 0; i < 8; i++) G.fx.push({ kind:'spark', x:p.x, y:p.y, a:i/8*Math.PI*2, t:0, life:.45 });
      G.fx.push({ kind:'text', x:p.x, y:p.y - .6, text:SAID[p.type] || '+' + E.POINTS[p.type], t:0, life:SAID[p.type] ? 1.1 : .8, color:SAID[p.type] ? A.POWER[p.type].ring : null });
      const pr = loadProgress(); pr.bestSalvage = Math.max(pr.bestSalvage || 0, E.salvageCount(S)); saveProgress(pr); save(); break; }
    case 'milestone': G.milestone = { title:e.n + ' SALVAGE', sub:'BONUS +' + e.bonus.toLocaleString('en-GB'), t:0, life:1.9 }; AU.play('sd'); AU.say('power'); break;
    case 'fullCollection': G.milestone = { title:'FULL COLLECTION', sub:'BONUS +1,000', t:0, life:2.4 }; AU.say('power'); break;
    case 'bossStart': AU.boss(true); AU.say('boss', true); break;
    case 'refuse': AU.play('refuse'); break;
    case 'repairTick': AU.play('repairTick'); break;
    case 'repair': AU.play('repair'); G.fx.push({ kind:'text', x:e.x, y:e.y - 3.6, text:'Repaired!', t:0, life:.9 }); save(); break;
    case 'passDone': AU.play('checkpoint'); AU2.play('drain'); G.fx.push({ kind:'text', x:L.boss.bounds[0] + 12, y:S.P.y - 4, text:'Pass ' + e.pass + ' of ' + E.order(S).length + ' done', t:0, life:1.6 }); save(); break;
    case 'bossDone': AU.play('chord'); AU.say('power'); AU.boss(false); AU.hum(false); AU2.play('drain'); save(); break;
  }
}
function win(){
  clearSave();
  const pr = loadProgress(); pr.completed = true; pr.best = Math.max(pr.best || 0, S.score); pr.bestSalvage = Math.max(pr.bestSalvage || 0, E.salvageCount(S)); pr.bossRuns = (pr.bossRuns || 0) + 1; saveProgress(pr);
  if (!ROOM) M.campaign.award('level-2', S.score);
  G.results = { score:S.score, salvage:E.salvageCount(S), sd:S.inv.sdCard, mini:S.inv.miniMike, time:S.playTime, lost:S.livesLost, cont:S.continues, best:pr.bestSalvage, level1:M.campaign.score('level-1'), total:M.campaign.total() };
  G.mode = 'results'; document.body.dataset.mode = 'results'; menu('results'); document.body.dataset.done = '1';
}

// ---------- camera ----------
const inArena = () => L.boss && S.P.x >= L.boss.bounds[0];
function targetCamY(){
  const P = S.P, maxY = (L.H - 2.2)*T - VH, base = P.y*T - VH*(S.wet ? .52 : .66);
  if (S.boss.done) return 12*T; // the restored sump, final cut and exit are all in this inspection frame
  return clamp(Math.min(base + (S.lookDown ? (S.wet ? 3 : 5)*T : 0), P.y*T - 3.4*T), -12*T, maxY);
}
function follow(dt, snap){
  const P = S.P;
  G.camY += (targetCamY() - G.camY)*(snap ? 1 : 1 - Math.exp(-dt/.16));
  G.look += (P.facing*(S.wet ? 2.5 : 4) - G.look)*(snap ? 1 : 1 - Math.exp(-dt/.15));
  let x = (P.x + G.look)*T - VW/2;
  if (inArena()) x = L.boss.bounds[0]*T;                    // the fault's cell: one fixed frame across, free up and down
  if (S.boss.done) x = (S.boss.restoreT > 0 ? 484 : 478)*T;
  x = clamp(x, 0, L.W*T - VW);
  G.camX = S.boss.done && !snap ? G.camX + (x - G.camX)*(1 - Math.exp(-dt/.65)) : x;
}

// ---------- Mike ----------
function animate(dt){
  const P = S.P, B = S.boss, moving = Math.abs(P.vx) > .4;
  let st;
  if (B.done) st = 'wave';
  else if (P.hitT < .25) st = S.wet ? 'swimhit' : 'hit';
  else if (S.wet) st = B.fix > 0 ? 'fix' : 'swim';
  else if (!P.ground) st = P.vy < 0 ? 'jump' : 'fall';
  else if (B.fix > 0 || S.valveT > 0) st = 'fix';
  else if (P.landT < PH.landHold + PH.landRecover && Math.abs(P.vx) < 3) st = 'land';
  else if (moving) st = 'run';
  else st = anim.idle > 3 ? 'wave' : 'idle';
  anim.idle = st === 'idle' || st === 'wave' ? anim.idle + dt : 0;
  if (st === 'wave' && anim.idle > 3.6 && !B.done) anim.idle = 0;
  const p0 = anim.phase;
  anim.phase += Math.abs(P.vx*dt)/3*Math.PI*2;
  anim.stroke += dt*(2.2 + 1.6*Math.min(1, Math.hypot(P.vx, P.vy)/3.8));
  if (st === 'run' && Math.floor(anim.phase/Math.PI) !== Math.floor(p0/Math.PI)) AU.play('step');
  if (st !== anim.st){ anim.from = anim.cur; anim.blend = 0; anim.st = st; anim.s = 0; }
  anim.s += dt; anim.blend = Math.min(1, anim.blend + dt/(S.wet ? .16 : .08));
  const target = st === 'swim' || st === 'swimhit' ? A2.swimPose(anim.stroke, P.vx, P.vy, P.facing, st === 'swimhit' ? -(P.hitAway || 1) : 0)
    : M.puppet.pose(st, anim.phase, anim.s, { camera:S.cam.on && st !== 'fix', away:-(P.hitAway || 1) });
  if (S.cam.on && (st === 'swim')){ target.armR_upper = -105; target.armR_lower = -12; target.prop = 'camera'; }
  anim.cur = M.puppet.lerp(anim.from, target, anim.blend);
  const tt = P.facing*(moving || !P.ground ? 30 : 12);
  anim.turn += (tt - anim.turn)*(1 - Math.exp(-dt/.12));
  anim.cur.turn = anim.turn;
}
const pose = (st, p, s, ex, turn) => { const o = M.puppet.pose(st, p || 0, s || 0, ex); o.turn = turn || 0; return o; };
function drawMike(c, x, y, ps, facing, o){
  o = o || {};
  if (o.protect){ c.save(); c.shadowColor = 'rgba(255,255,255,.95)'; c.shadowBlur = 10; }
  if (o.suit) A2.suitBack(c, ps, x*T, y*T, 2*T);
  M.puppet.draw(c, rig, ps, x*T, y*T, 2*T, { facing });
  if (o.suit) A2.suitFront(c, ps, x*T, y*T, 2*T, { low:o.low });
  if (o.suit && o.level > .25 && !G.lowQ) A2.crackle(c, x*T, y*T, o.level, G.t);
  if (o.protect) c.restore();
  G.af = { x, y };
}
function drawMiniMike(c, p, t){
  const x = p.x*T, y = p.y*T + Math.sin(t*3 + p.x)*3;
  A.powerBubble(c, x, y, 'miniMike', t); M.puppet.draw(c, rig, pose('wave', 0, t, null, -10), x, y + 17, 36, { facing:1 });
}

// ---------- world ----------
function chunk(i){
  let cv = chunks.get(i);
  if (!cv){
    cv = document.createElement('canvas'); cv.width = Math.ceil(512*Z); cv.height = Math.ceil(CH_H*T*Z);
    const c = cv.getContext('2d'); c.scale(Z, Z); c.translate(-i*512, -CH_TOP*T); A2.drawStatic(c, L, i*512, i*512 + 512);
    chunks.set(i, cv); if (chunks.size > 5) chunks.delete(chunks.keys().next().value);
  }
  return cv;
}
function drawWorld(c, o){
  o = o || {};
  const camX = G.camX, x0 = camX, x1 = camX + VW, vis = (a, b) => b*T > x0 - 120 && a*T < x1 + 120, P = S.P, B = S.boss, t = G.t;
  c.save(); c.scale(Z, Z); c.translate(-Math.round(camX*Z)/Z, -Math.round(G.camY*Z)/Z);
  // room numbers on the wall, as in the Night Shift
  for (const r of L.rooms) if (vis(r.x, r.x + 8)){ c.font = `600 54px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(173,204,213,.19)'; c.fillText(String(L.rooms.indexOf(r) + 1).padStart(2, '0'), (r.x + 2)*T, 128);
    c.font = `600 10px ${FONT}`; c.fillStyle = '#7c9ca6'; c.fillText(r.title.toUpperCase(), (r.x + 2)*T, 150); }
  if (L.boss && vis(L.boss.bounds[0], L.boss.bounds[0] + L.boss.bounds[2])) A2.bossMachine(c, L, B, bossState(), t);
  for (let i = Math.floor(x0/512); i <= Math.floor((x1 - 1)/512); i++) c.drawImage(chunk(i), i*512, CH_TOP*T, 512, CH_H*T);
  for (const tk of L.tanks) if (vis(tk.x0, tk.x1)) A2.gauge(c, tk, S.tanks[tk.id]);
  for (const tk of L.tanks) for (const p of tk.pockets) if (vis(p.x, p.x + p.w) && S.tanks[tk.id].level < p.y + p.h) A2.pocket(c, p, t);
  if (L.suit && vis(L.suit.x - 2, L.suit.x + 2)) A2.suitRack(c, L.suit.x, L.suit.y, S.suit, t);
  for (const g of L.scenery) if (g.type === 'sign' && vis(g.x - 5, g.x + 5)) A2.sign(c, g, isTouch(), t);
  for (const d of L.doors) if (vis(d.x - 1, d.x + d.w + 1)) A2.door(c, d, S.doors[d.id], t);
  A2.restoration(c, L, B);
  for (const lift of L.lifts) if (vis(lift.at[0] - 1, lift.at[0] + lift.w + 1)) A.serviceLift(c, lift, M.liftPose(lift, S.mt), S.mt);
  const wheel = o.still ? null : nearWheel();
  for (const v of L.valves) for (const w of v.wheels) if (vis(w[0] - 2, w[0] + 2)) A2.valve(c, L, v, S.valves[v.id], w, wheel && wheel.w === w ? S.valveT : 0, t, !!(wheel && wheel.w === w) && S.valveT <= 0);
  for (const cp of L.checkpoints) if (vis(cp.x - 1, cp.x + 1)) A.drawCheckpoint(c, cp.x, cp.y, S.lit.has(cp.x), t);
  for (const i of L.intakes) if (vis(i.zone[0], i.zone[0] + i.zone[2])) A2.intake(c, L, i, shown(i, E.intakePose), t);
  for (const n of L.nozzles) if (vis(n.at[0] - 3, n.at[0] + 3 + Math.abs(n.dir[0])*n.reach)) A2.nozzle(c, L, n, shown(n, E.nozzlePose), t);
  for (const w of L.wires) if (vis(Math.min(w.from[0], w.to[0], w.span[0]) - 3, Math.max(w.from[0], w.to[0], w.axis === 'h' ? w.span[1] : 0) + 3) && passOn(w)) A2.wire(c, L, w, shown(w, E.wirePose), t);
  if (L.boss && vis(L.boss.bounds[0], L.boss.bounds[0] + L.boss.bounds[2])){ const st = bossState(); for (const [name, p] of Object.entries(L.boss.points)) A2.servicePoint(c, name, p, st, t); }
  for (const p of L.pickups) if (!S.got.has(p.id) && vis(p.x - 1, p.x + 1)){
    if (p.hidden) A2.secretRecess(c, p, P ? Math.hypot(P.x - p.x, P.y - p.y) : 99, t);
    if (p.hidden && (!P || Math.hypot(P.x - p.x, P.y - p.y) > 4)) continue;
    if (p.type === 'miniMike') drawMiniMike(c, p, t); else A.drawPickup(c, p, t);
  }
  G.af = null;
  if (o.mike !== false && S.dead <= 0) drawMike(c, P.x, P.y, anim.cur, P.facing, { suit:S.suit, protect:P.hitT < E.INVULN, low:S.static >= E.W.limit - E.W.warn, level:S.static/E.W.limit });
  if (o.extraMike) for (const m of o.extraMike) drawMike(c, m.x, m.y, m.pose, m.facing || 1, { suit:m.suit, low:S.static >= E.W.limit - E.W.warn, level:S.static/E.W.limit });
  for (const n of L.nozzles) if (vis(n.at[0] - 3 - n.reach, n.at[0] + 3 + n.reach)) A2.jet(c, n, shown(n, E.nozzlePose), t);
  for (const tk of L.tanks) if (vis(tk.x0, tk.x1)) A2.water(c, L, S, tk, t, G.lowQ, x0, x1);
  // the wheel he can turn, or the point he can fix: the key to press, nothing more
  if (!o.still && B.on && !B.done && B.eligible){ const tg = E.bossTarget(S); c.save(); c.translate(tg.x*T + 92, tg.y*T - 72 + Math.sin(t*9)*2); A2.prompt(c, 'hold', isTouch()); c.restore(); }
  for (const f of G.fx){
    const u = f.t/f.life;
    if (f.kind === 'spark'){ if (G.lowQ) continue; c.fillStyle = `rgba(255,255,255,${1 - u})`; A.circ(c, f.x*T + Math.cos(f.a)*u*34, f.y*T + Math.sin(f.a)*u*34, 3.5*(1 - u) + 1); c.fill(); }
    else if (f.kind === 'text'){ c.save(); c.globalAlpha = 1 - u; c.fillStyle = f.color || '#fff'; c.font = `${f.color ? 900 : 700} 22px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,20,40,.7)'; c.strokeText(f.text, f.x*T, f.y*T - u*30); c.fillText(f.text, f.x*T, f.y*T - u*30); c.restore(); }
    else if (f.kind === 'splash') A2.splash(c, f, u);
    else if (f.kind === 'bubble'){ const s2 = E.surfaceAt(S, f.x, f.y + 1.6), by = f.y - u*1.6; if (s2 === null || by > s2){ A.circ(c, f.x*T + Math.sin(u*8 + f.seed)*5, by*T, 2 + u*3); c.strokeStyle = `rgba(220,250,250,${.8*(1 - u)})`; c.lineWidth = 1.4; c.stroke(); } }
  }
  if (LAB){ c.strokeStyle = '#0f0'; c.lineWidth = 1; c.strokeRect((P.x - PH.halfW)*T, (P.y - PH.height)*T, 2*PH.halfW*T, PH.height*T); for (const e of S.extra) c.strokeRect(e.x*T, e.y*T, e.w*T, e.h*T); }
  c.restore();
}
const passOn = h => !h.passes || (S.boss.on && h.passes.includes(S.boss.pass));
// A machine as it is now; the fault's own machines stand parked until the fault wakes.
function shown(h, poseOf){
  if (G.poses && G.poses[h.id] !== undefined) return poseOf(h, G.poses[h.id] - (h.phase || 0));
  // Park at the first live position: startup must not teleport the wire across the cell.
  if (h.boss && !E.live(S, h)) return Object.assign(poseOf(h, 0), { tell:false, active:false, state:S.boss.done ? 'green' : 'red', grow:0, fade:0 });
  return poseOf(h, E.clock(S, h, S.mt));
}
function bossState(){
  if (G.boss) return G.boss;
  const B = S.boss, tg = B.on && !B.done && B.trans <= 0 ? E.bossTarget(S) : null;
  return { on:B.on, restored:B.done, restoreT:B.restoreT, completed:E.sequence(S).slice(0, B.step),
    target:tg ? tg.name : null, fix:B.fix > 0 && tg ? { point:tg.name, u:B.fix } : null, wrong:B.wrongT > 0 && B.wrong ? { point:B.wrong } : null };
}
const toScreen = (x, y) => ({ x:(x*T - Math.round(G.camX*Z)/Z)*Z, y:(y*T - Math.round(G.camY*Z)/Z)*Z });

// ---------- the camera's viewfinder and the HUD (Level 1's, with the suit's static charge added) ----------
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
  c.textAlign = 'right'; c.fillText('120 FPS', W - 58, 63); c.font = `700 18px ${FONT}`; c.fillText('SLOW ×0.2', W - 58, 92);
  const left = G.slowShow ? G.slowShow.left : M.cameraSeconds(S.cam), cap = G.slowShow ? G.slowShow.cap : M.cameraSeconds(S.cam, S.cam.cap), low = left <= 1;
  c.save(); c.translate(68, 116); c.scale(1.4, 1.4); A.pickupIcon(c, 'sdCard', 0, 0, 1); c.restore();
  c.fillStyle = low && Math.floor(G.t*6) % 2 ? '#FF2A2A' : C.white; c.textAlign = 'left';
  const clip = S.cam.boss && !G.slowShow ? M.clipRemaining(S.cam) : null;
  c.font = `700 30px ui-monospace,Menlo,Consolas,monospace`; c.fillText((clip === null ? left : clip).toFixed(1) + 's', 96, 110);
  c.font = `700 14px ${FONT}`; c.fillStyle = C.white; c.fillText(clip === null ? 'LEFT ON CARD' : 'LEFT IN THIS CLIP', 97, 134);
  c.shadowBlur = 0;
  const bw = 150, bx = W - 58 - bw, by = 112;
  A.rr(c, bx, by, bw, 14, 5); c.fillStyle = 'rgba(0,20,40,.55)'; c.fill();
  A.rr(c, bx, by, Math.max(6, bw*left/cap), 14, 5); c.fillStyle = low ? '#FF2A2A' : C.white; c.fill();
  c.strokeStyle = C.white; c.lineWidth = 2; A.rr(c, bx, by, bw, 14, 5); c.stroke();
  if (clip !== null){ c.fillStyle = 'rgba(0,20,40,.8)'; for (let s = M.CLIP.length; s < cap - .01; s += M.CLIP.length) c.fillRect(bx + bw*s/cap - 1.5, by - 3, 3, 20); }
  c.fillStyle = C.white; c.font = `700 14px ${FONT}`; c.textAlign = 'right'; c.fillText(clip === null ? `${cap.toFixed(1)}s CARD` : `${M.spareClips(S.cam)} MORE CLIP${M.spareClips(S.cam) === 1 ? '' : 'S'}`, W - 58, by + 30);
  if (G.af){
    const s = toScreen(G.af.x, G.af.y), w = 74, h = 104, x = s.x - w/2, y = s.y - h - 4, k = 16, p = 1 + .03*Math.sin(G.t*8);
    c.save(); c.translate(s.x, y + h/2); c.scale(p, p); c.translate(-s.x, -(y + h/2));
    c.strokeStyle = '#7CFF9A'; c.lineWidth = 3; c.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]){ c.moveTo(cx, cy + dy*k); c.lineTo(cx, cy); c.lineTo(cx + dx*k, cy); }
    c.stroke(); c.restore();
  }
  c.restore();
}
function hud(c){
  c.save(); c.textBaseline = 'middle';
  A.rr(c, 12, 10, 410, 68, 14); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill();
  for (let i = 0; i < 3; i++){ A.circ(c, 36 + i*26, 34, 9); c.fillStyle = i < S.health ? C.white : 'rgba(255,255,255,0)'; c.fill(); c.strokeStyle = C.white; c.lineWidth = 3; c.stroke(); }
  M.puppet.draw(c, rig, pose('idle', 0, 0, null, 0), 126, 50, 32, { facing:1 });
  c.fillStyle = C.white; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.fillText('× ' + S.lives, 144, 35);
  const cont = M.campaign.continues;
  if (cont > 0){ A.rr(c, 12, 112, 128, 22, 11); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill(); c.fillStyle = '#FFE066'; c.font = `700 12px ${FONT}`; c.fillText('CONTINUES × ' + cont, 24, 123); }
  c.font = `600 13px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('SALVAGE', 198, 35);
  const n = E.salvageCount(S);
  c.font = `700 23px ${FONT}`; c.fillStyle = C.white; c.fillText(n + '/' + L.salvageTotal, 275, 35);
  c.fillStyle = '#284851'; c.fillRect(30, 59, 370, 4); c.fillStyle = '#a4e8d5'; c.fillRect(30, 59, 370*n/L.salvageTotal, 4);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (let m = 10; m < L.salvageTotal; m += 10) c.fillRect(30 + 370*m/L.salvageTotal - 1, 56, 2, 10);
  c.fillStyle = 'rgba(0,44,90,.82)'; A.rr(c, 12, 74, 250, 34, 12); c.fill();
  c.font = `600 13px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('SCORE', 30, 92);
  const gold = G.newBest, flash = gold && Math.sin(G.t*10) > 0, pop = 1 + .35*G.scorePop;
  c.save(); c.translate(84, 92); c.scale(pop, pop); c.font = `900 22px ${FONT}`; c.fillStyle = gold ? (flash ? '#FFE066' : '#FFB84D') : C.white; c.fillText(S.score.toLocaleString('en-GB'), 0, 1); c.restore();
  if (gold){ c.font = `900 11px ${FONT}`; c.fillStyle = flash ? '#FFE066' : 'rgba(255,224,102,.6)'; c.fillText('NEW BEST', 196, 92); }
  const bx = W - 262, by = 10, low = S.cam.left < M.CAMERA.min;
  A.rr(c, bx, by, 250, 56, 14); c.fillStyle = 'rgba(0,44,90,.82)'; c.fill();
  A.cameraIcon(c, bx + 28, by + 28, 1, C.white); A.pickupIcon(c, 'sdCard', bx + 64, by + 28, .9);
  c.fillStyle = low ? 'rgba(255,255,255,.5)' : C.white; c.font = `700 24px ui-monospace,Menlo,Consolas,monospace`; c.textAlign = 'left'; c.fillText(M.cameraSeconds(S.cam).toFixed(1) + 's', bx + 84, by + 29);
  const mx = bx + 162, my = by + 20, mw = 76, mh = 16;
  A.rr(c, mx, my, mw, mh, 5); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
  if (S.cam.left > 0){ A.rr(c, mx, my, Math.max(6, mw*S.cam.left/S.cam.cap), mh, 5); c.fillStyle = low ? 'rgba(255,255,255,.4)' : C.white; c.fill(); }
  c.strokeStyle = C.white; c.lineWidth = 2; A.rr(c, mx, my, mw, mh, 5); c.stroke();
  if (S.cam.boss){ c.fillStyle = C.navy; for (let s = M.CLIP.cost; s < S.cam.cap - .01; s += M.CLIP.cost) c.fillRect(mx + mw*s/S.cam.cap - 1.5, my - 3, 3, mh + 6); }
  if (S.cam.refused > 0){ c.fillStyle = C.white; c.font = `700 14px ${FONT}`; c.fillText('Card busy', mx, by + 47); }
  c.restore();
}
// The suit's static charge: a bolt, a bar that fills as it builds, and the seconds left before it discharges. Amber in
// the last quarter, a red pulse at the end. Shown while filming too, because static builds on real time.
function staticMeter(c, y){
  if (!S.suit) return;
  const x = W - 262, cap = E.W.limit, left = cap - S.static, warn = left <= E.W.warn, crit = left <= 3, pulse = crit ? .5 + .5*Math.sin(G.t*12) : 0;
  c.save(); c.textBaseline = 'middle';
  A.rr(c, x, y, 250, 40, 12); c.fillStyle = crit ? `rgba(${Math.round(90 + 70*pulse)},20,20,.9)` : 'rgba(0,44,90,.82)'; c.fill();
  if (warn){ c.strokeStyle = crit ? '#FF5A4A' : A2.P.warn; c.lineWidth = 2.5; c.stroke(); }
  c.fillStyle = crit ? '#FFD7D2' : warn ? A2.P.warn : '#cdf6f0'; c.beginPath(); c.moveTo(x + 31, y + 6); c.lineTo(x + 17, y + 23); c.lineTo(x + 25, y + 23); c.lineTo(x + 21, y + 35); c.lineTo(x + 36, y + 17); c.lineTo(x + 28, y + 17); c.closePath(); c.fill();
  c.font = `600 12px ${FONT}`; c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'left'; c.fillText('STATIC', x + 46, y + 21);
  const mx = x + 98, mw = 88, mh = 14, my = y + 13;
  A.rr(c, mx, my, mw, mh, 5); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
  if (S.static > .05){ A.rr(c, mx, my, Math.max(6, mw*S.static/cap), mh, 5); c.fillStyle = crit ? '#FF5A4A' : warn ? A2.P.warn : '#cdf6f0'; c.fill(); }
  c.strokeStyle = C.white; c.lineWidth = 2; A.rr(c, mx, my, mw, mh, 5); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(mx + mw*.75 - 1, my - 3, 2, mh + 6);
  c.font = `700 20px ui-monospace,Menlo,Consolas,monospace`; c.fillStyle = crit ? '#FFD7D2' : C.white; c.textAlign = 'right'; c.fillText(Math.ceil(left - 1e-6) + 's', x + 240, y + 21);
  if (!S.headWet && S.static > .05){ c.fillStyle = '#9be4c7'; c.beginPath(); c.moveTo(x + 190, y + 15); c.lineTo(x + 196, y + 26); c.lineTo(x + 202, y + 15); c.closePath(); c.fill(); }      // shedding
  c.restore();
}
function journey(c){
  const P = S.P, r = L.rooms.find(r => P.x >= r.x && P.x < r.x + r.width) || L.rooms[L.rooms.length - 1], idx = L.rooms.indexOf(r) + 1;
  c.save(); c.fillStyle = 'rgba(5,17,27,.88)'; A.rr(c, 690, S.suit ? 118 : 76, 258, 40, 7); c.fill();
  const y = S.suit ? 118 : 76;
  c.font = `600 10px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = '#a9c5d0'; c.fillText(String(idx).padStart(2, '0') + ' / ' + String(L.rooms.length).padStart(2, '0') + '   ' + r.title.toUpperCase(), 704, y + 18);
  c.fillStyle = '#29434f'; c.fillRect(704, y + 28, 230, 3); c.fillStyle = '#8cdcd7'; c.fillRect(704, y + 28, 230*Math.min(1, P.x/L.W), 3);
  c.restore();
}
function bossHud(c){
  const B = S.boss; if (!B.on) return;
  if (B.done){
    const label = B.restoreT < .01 ? 'DRAINING CELL' : B.restoreT < 2 ? 'COMPLETING CUT' : 'EXIT RESTORED';
    c.save(); A.rr(c, 340, 120, 280, 42, 9); c.fillStyle = '#082435'; c.fill(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 17px ${FONT}`; c.fillStyle = A2.P.safe; c.fillText(label, 480, 141); c.restore(); return;
  }
  const ord = E.order(S), n = ord.flat().length;
  M.bossStrip(c, B.step, n, ord[0].length, 'P' + Math.min(ord.length, B.pass + 1) + '/' + ord.length, FONT); return;
}
function drawOverlay(c){
  const filming = S.cam.on || G.slowShow;
  if (filming) drawViewfinder(c); else hud(c);
  staticMeter(c, filming ? 150 : 72);
  if (!filming) journey(c);
  bossHud(c);
  if (G.card > 0){
    const a = Math.min(1, G.card/.5, (2.8 - G.card)/.3 + .001);
    c.save(); c.globalAlpha = Math.max(0, a);
    A.rr(c, W/2 - 230, 130, 460, 150, 20); c.fillStyle = C.white; c.fill();
    c.drawImage(lockRed, W/2 - 110, 150, 220, 220*lockRed.height/lockRed.width);
    c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `900 34px ${FONT}`; c.fillText('Level 2', W/2, 236);
    c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.fillText('Below the Wire', W/2, 264); c.restore();
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
  if (E.W.limit - S.static <= 3 && S.headWet){                // the last three seconds: the charge shows at the edges of the screen
    const p = .5 + .5*Math.sin(G.t*12), fl = Math.sin(G.t*47) > .6 ? .12 : 0, g = c.createRadialGradient(W/2, H/2, H*.45, W/2, H/2, H*.95); g.addColorStop(0, 'rgba(200,245,255,0)'); g.addColorStop(1, `rgba(190,240,255,${.16 + .16*p + fl})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  if (G.flash > 0){ c.fillStyle = `rgba(235,250,255,${Math.min(.8, G.flash*2.4)})`; c.fillRect(0, 0, W, H); }
}

// ---------- title and results ----------
function headline(c, text, x, y, maxW, px, color){
  c.font = `900 ${px}px ${FONT}`; const w = c.measureText(text).width, k = Math.min(1, maxW/w);
  c.save(); c.translate(x, y); c.scale(k, 1); c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(text, 0, 0); c.restore();
}
const clock = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function drawTitle(c){
  // the third tank, seen from the rim, behind the words
  G.camX = 171*T; G.camY = 1.5*T; A.nightBackdrop(c, G.camX, G.camY, G.t, false); G.poses = { w3d:2.4, n3a:1.6 };
  drawWorld(c, { mike:false, still:true }); G.poses = null;
  const shade = c.createLinearGradient(0, 0, 960, 0); shade.addColorStop(0, 'rgba(4,13,23,.96)'); shade.addColorStop(.5, 'rgba(4,13,23,.88)'); shade.addColorStop(1, 'rgba(4,13,23,.15)'); c.fillStyle = shade; c.fillRect(0, 0, 960, 540);
  c.fillStyle = '#fff'; A.rr(c, 62, 36, 184, 53, 5); c.fill(); c.drawImage(lockRed, 76, 48, 156, 156*lockRed.height/lockRed.width);
  c.fillStyle = '#91b8c6'; c.font = `600 12px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('A MIKE THE MIC ADVENTURE   /   02', 64, 126);
  headline(c, 'BELOW', 60, 199, 504, 76, '#edf4f5'); headline(c, 'THE WIRE', 60, 274, 480, 88, '#6de0dd');
  c.fillStyle = '#a9bdc6'; c.font = `500 18px ${FONT}`; c.fillText('One flooded cell. One suit. And the fluid is live.', 64, 315);
  c.font = `500 15px ${FONT}`; c.fillText('56 salvage finds. Six rooms. Your tools do the fixing.', 64, 339);
  const ps = pose('wave', 0, .06 + (SCENE_ANIM ? G.t : 0), null, -12);
  A2.suitBack(c, ps, 762, 480, 295); M.puppet.draw(c, rigL, ps, 762, 480, 295, { facing:-1 }); A2.suitFront(c, ps, 762, 480, 295);
  c.fillStyle = '#7698a6'; c.font = `600 11px ${FONT}`; c.fillText('RIM, GALLERY OR WATER  /  EVERY DIVE HAS A WAY OUT  /  ONE HIDDEN LIFE', 64, 466);
  c.fillText(isTouch() ? 'RUN   JUMP / SWIM UP   LOOK BELOW / DIVE   CAMERA   USE' : '← → RUN   SPACE JUMP / SWIM UP   ↓ LOOK BELOW / DIVE   C CAMERA   E USE', 64, 493);
}
function drawResults(c, r){
  r = r || { score:9350, salvage:41, sd:2, mini:1, time:412, lost:1, cont:0, best:41, level1:7650, total:17000 };
  c.fillStyle = 'rgba(0,44,90,.25)'; c.fillRect(0, 0, W, H);
  A.rr(c, 32, 28, 520, 484, 22); c.fillStyle = C.white; c.fill();
  c.drawImage(lockRed, 66, 56, 200, 200*lockRed.height/lockRed.width);
  headline(c, 'Cell drained and threaded', 64, 144, 456, 44, C.navy);
  c.fillStyle = C.red; c.font = `700 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('The Threading Fault is running sweetly.', 66, 176);
  const total = k => L.pickups.filter(p => p.type === k).length;
  // the same card as Level 1, with the campaign total: Level 1's score plus this one (owner, 30 Sept)
  const rows = [['Level 2 score', r.score.toLocaleString('en-GB')], ['Level 1 score', (r.level1 || 0).toLocaleString('en-GB')], ['Campaign total', (r.total || r.score).toLocaleString('en-GB')],
    ['Salvage collection', r.salvage + ' / ' + L.salvageTotal], ['Best collection', Math.max(r.best || 0, r.salvage) + ' / ' + L.salvageTotal],
    ['SD cards', r.sd + ' / ' + total('sdCard')], ['Mini Mike', r.mini + ' / 1'], ['Time', clock(r.time)], ['Lives lost', String(r.lost)], ['Continues used', String(r.cont)]];
  rows.forEach(([k, v], i) => { const y = 206 + i*22;
    const total_ = k === 'Campaign total';
    c.font = `${total_ ? 900 : 600} 19px ${FONT}`; c.fillStyle = total_ ? C.navy : '#34414F'; c.textAlign = 'left'; c.fillText(k, 66, y);
    c.font = `${total_ ? 900 : 700} 19px ${FONT}`; c.fillStyle = total_ ? C.red : C.navy; c.textAlign = 'right'; c.fillText(v, 516, y);
    c.strokeStyle = total_ ? 'rgba(0,44,90,.35)' : 'rgba(0,44,90,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(66, y + 7); c.lineTo(516, y + 7); c.stroke(); });
}

// ---------- scenes: one still frame of the real level ----------
let SCENE_DRAW = null, SCENE_ANIM = false;
function still(camX, camY, mike, set){
  G.mode = 'scene'; S = E.create(L); S.suit = !set || set.suit !== false; S.P = M.newPlayer(mike.x, mike.y); S.P.facing = mike.facing || 1; S.P.hitT = 9;
  if (set && set.state) set.state(S);
  S.wet = !!mike.wet; S.headWet = !!mike.headWet; S.surface = E.surfaceAt(S, mike.x, mike.y);
  for (const d of L.doors) S.doors[d.id] = E.doorWants(S, d) ? 1 : 0;
  Object.assign(G, { camX:camX*T, camY:camY*T, poses:null, boss:null, slowShow:null, fx:[], card:0, milestone:null, toast:null }, set && set.g);
  S.cam.boss = (S.boss.on || !!G.boss?.on) && !S.boss.done;
  const ps = mike.pose || pose('idle', 0, .3, null, 14);
  SCENE_DRAW = c => { A.nightBackdrop(c, G.camX, G.camY, G.t, false); drawWorld(c, { mike:false, still:true, extraMike:[{ x:mike.x, y:mike.y, pose:ps, facing:mike.facing || 1, suit:S.suit }] }); drawOverlay(c); };
}
const swimP = (vx, vy, turn, ph) => { const o = A2.swimPose(ph === undefined ? 1.2 : ph, vx, vy, 1, 0); o.turn = turn; return o; };
const SCENES = {
  'title': () => { G.mode = 'scene'; S = E.create(L); S.suit = true; SCENE_DRAW = drawTitle; menu('title'); },
  'r1-dock': () => still(0, 1.2, { x:6.2, y:12, pose:pose('idle', 0, .4, null, 14) }, { suit:false }),
  'r1-basin': () => still(21, 4.2, { x:31, y:14, wet:true, pose:swimP(2.4, 0, 28) }),
  'r2-rim': () => still(61, 1.6, { x:73, y:9.6, pose:pose('idle', 0, .2, null, 22) }, { g:{ poses:{ n2d:1.3, n2a:1.4, n2e:.2, n2b:3, n2c:3 } } }),
  'r2-under': () => still(77, 11.4, { x:86.2, y:22.2, wet:true, headWet:true, pose:swimP(3.2, 0, 30) }, { state:s => { s.static = 9; }, g:{ poses:{ n2a:3, n2b:1.4, n2c:.4, n2d:3, n2e:3 } } }),
  'r3-shaft': () => still(136, -1.5, { x:145, y:7.2, wet:true, pose:swimP(0, -2.2, 10) }, { state:s => { E.setValve(s, L.valves.find(v => v.id === 'lift'), 1, true); s.tanks.shaft.level = 6.2; }, g:{ poses:{ w3a:1.6, w3b:4.5 } } }),
  'r3-catwalk': () => still(174, -5.2, { x:183.6, y:3, pose:pose('run', 1.2, 0, null, 30) }, { g:{ poses:{ w3d:1.9, n3a:3 } } }),
  'r4-valve': () => still(270, 1.2, { x:281.3, y:10, pose:pose('fix', 0, .3, null, 16) }, { g:{ poses:{ n4a:3, w4:4 } } }),
  'r4-low': () => still(262, 11, { x:275, y:21.4, facing:-1, pose:pose('run', 1.2, 0, null, -30) }, { state:s => E.setValve(s, L.valves.find(v => v.id === 'transfer'), 1, true), g:{ poses:{ n4a:3 } } }),
  'r4-duct': () => still(270, 11.8, { x:279.4, y:23, wet:true, headWet:true, pose:swimP(3.4, .4, 30) }, { state:s => { s.static = 13; }, g:{ poses:{ i4:1.6, n4a:3 } } }),
  'r5-maze': () => still(372, 9.8, { x:383.4, y:18.6, wet:true, headWet:true, pose:swimP(0, -2.6, 8) }, { state:s => { s.static = 19; s.got.add('s5-7'); }, g:{ poses:{ n5c:1.5, w5b:5 } } }),
  'r5-top': () => still(398, 0, { x:405.6, y:10.5, pose:pose('run', .5, 0, null, 30) }, { g:{ poses:{ w5c:3.4, i5:3 } } }),
  'r6-film': () => still(443, 3.6, { x:447.8, y:12, pose:pose('idle', 0, .3, { camera:true }, 24) }, { g:{ slowShow:{ left:2.1, cap:4.5 }, poses:{ n6p:1.3, w6p:2 } } }),
  'boss-idle': () => still(476, 3, { x:478.4, y:12, pose:pose('idle', 0, .3, null, 18) }, { g:{ poses:{ wB1:.4, n6a:3, n6b:3, i6:4 }, boss:{ on:true, target:'flush' } } }),
  'boss-flush': () => still(476, 12.2, { x:481, y:24, wet:true, headWet:true, pose:pose('fix', 0, .31, null, 12) }, { state:s => { s.static = 11; s.boss.on = true; }, g:{ poses:{ wB1:3.8, n6a:.5, n6b:3, i6:1.4 }, boss:{ on:true, target:'flush', fix:{ point:'flush', u:.55 } } } }),
  'boss-align': () => still(476, -2.2, { x:495, y:5, pose:pose('fix', 0, .31, null, 12) }, { state:s => { s.boss.on = true; s.boss.step = 2; E.setTank(s, 'sump', 'drain', true); }, g:{ poses:{ wB1:2.1, n6a:3, n6b:3 }, boss:{ on:true, target:'align', fix:{ point:'align', u:.7 } } } }),
  'results': () => { G.mode = 'scene'; S = E.create(L); S.suit = true; S.boss.done = true; E.setTank(S, 'sump', 'drain', true); S.doors.exit = 1; G.camX = 476*T; G.camY = 11.5*T;
    SCENE_DRAW = c => { A.nightBackdrop(c, G.camX, G.camY, G.t, false); drawWorld(c, { mike:false, still:true, extraMike:[{ x:494, y:24, pose:pose('wave', 0, .1, null, -14), suit:true }] }); drawResults(c); }; menu('results'); },
  'poses': () => { G.mode = 'scene'; S = E.create(L); SCENE_DRAW = drawPoses; },
  'machines': () => { G.mode = 'scene'; S = E.create(L); SCENE_DRAW = drawMachines; }
};
M.L2_SCENES = Object.keys(SCENES);
function sheet(c, title){
  c.fillStyle = '#0b2430'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 32){ c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); } for (let y = 0; y <= H; y += 32){ c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
  c.fillStyle = '#b7eae0'; c.font = `900 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(title, 24, 36);
}
function drawPoses(c){
  sheet(c, 'Mike in the service suit: the signed-off puppet, never redrawn');
  const list = [['idle', pose('idle', 0, .3, null, 12)], ['run', pose('run', 1.2, 0, null, 30)], ['jump', pose('jump', 0, 0, null, 28)], ['swim level', swimP(3.8, 0, 30)], ['swim up', swimP(0, -3, 8, 2.4)],
    ['dive', swimP(1.5, 3, 24, .4)], ['fix', pose('fix', 0, .3, null, 12)], ['hit', Object.assign(A2.swimPose(1, -2, 0, 1, -1), { turn:-20 })]];
  list.forEach(([name, ps], i) => { const x = 130 + (i % 4)*232, y = i < 4 ? 232 : 452; A2.suitBack(c, ps, x, y, 168); M.puppet.draw(c, rigL || rig, ps, x, y, 168, { facing:1 }); A2.suitFront(c, ps, x, y, 168);
    c.fillStyle = '#cfe6ea'; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.fillText(name, x, y + 26); });
  c.fillStyle = '#8fb3b9'; c.font = `500 13px ${FONT}`; c.textAlign = 'left'; c.fillText('Pack and bottles behind him; harness, collar, clear helmet, earthing strap and ankle cuffs in front. His head and lock-up stay clear.', 24, 520);
}
function drawMachines(c){
  sheet(c, '');
  c.save(); c.scale(.9, .9); c.translate(0, 40);
  const w = { id:'x', axis:'v', span:[5.2, 12.4], from:[3, 0], to:[8, 0], period:10, cycle:6, tell:1, active:2.4 };
  A2.wire(c, L, w, E.wirePose(w, 2), G.t); label(c, 'Travelling wire: cutting', 5.5*T, 13.6*T);
  const w2 = Object.assign({}, w, { from:[12, 0], to:[16, 0] }); A2.wire(c, L, w2, E.wirePose(w2, .5), G.t); label(c, 'Tell', 14*T, 13.6*T);
  const n = { at:[19.5, 12.2], dir:[0, -1], reach:6, cycle:4, tell:.9, active:1.4 }, np = E.nozzlePose(n, 1.6); A2.nozzle(c, L, n, np, G.t); A2.jet(c, n, np, G.t); label(c, 'Flushing nozzle', 19.5*T, 13.6*T);
  const i = { at:[25.5, 12], zone:[21.5, 7.5, 8, 5], cycle:5, tell:1, active:1.8, pull:2.4 }; A2.intake(c, L, i, E.intakePose(i, 1.5), G.t); label(c, 'Pump intake', 25.5*T, 13.6*T);
  A2.valve(c, { solids:[{ x:29, y:12.4, w:4, h:1 }], tanks:L.tanks }, L.valves[1], 0, [31, 10.8], 0, G.t, false); label(c, 'Transfer valve', 31*T, 13.6*T);
  A2.pocket(c, { x:1.5, y:15, w:6, h:1.2 }, G.t); label(c, 'Earthing bell', 4.5*T, 17.4*T);
  A2.suitRack(c, 11, 17, false, G.t); label(c, 'Service suit', 11*T, 17.9*T);
  ['flush', 'tension', 'align'].forEach((k, j) => { A2.servicePoint(c, k, [16 + j*5.4, 17], { target:j === 0 ? k : null }, G.t); label(c, 'Service point: ' + k, (16 + j*5.4)*T, 17.9*T); });
  c.restore();
  c.fillStyle = '#0b2430'; c.fillRect(0, 0, W, 52); c.fillStyle = '#b7eae0'; c.font = `900 22px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('Below the Wire: every machine, each with its traffic light', 24, 36);
}
function label(c, s, x, y){ c.fillStyle = '#cfe6ea'; c.font = `700 14px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); }

// ---------- draw and loop ----------
const perf = { work:[], frame:[], slow:0 };
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length*p))]; };
function draw(){
  if (!L) return; ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.mode === 'play'){ A.nightBackdrop(ctx, G.camX, G.camY, G.t, G.lowQ); ctx.save(); if (G.shake) ctx.translate(Math.sin(G.t*95)*G.shake*12, Math.cos(G.t*81)*G.shake*7); drawWorld(ctx); ctx.restore(); drawOverlay(ctx); if (LAB) labText(); }
  else if (G.mode === 'results'){ A.nightBackdrop(ctx, G.camX, G.camY, G.t, G.lowQ); drawWorld(ctx); drawResults(ctx, G.results); }
  else if (SCENE_DRAW) SCENE_DRAW(ctx);
}
function labText(){
  const P = S.P; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(12, H - 76, 600, 64); ctx.fillStyle = '#fff'; ctx.font = '13px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`x ${P.x.toFixed(2)} y ${P.y.toFixed(2)} vx ${P.vx.toFixed(2)} vy ${P.vy.toFixed(2)} ${S.wet ? 'wet' : P.ground ? 'ground' : 'air'} surface ${S.surface === null ? '-' : S.surface.toFixed(2)} static ${S.static.toFixed(1)}`, 20, H - 56);
  ctx.fillText(`machine ${S.mt.toFixed(2)} boss ${S.boss.on ? 'step ' + S.boss.step + ' t ' + S.boss.t.toFixed(1) : 'off'} state ${anim.st}`, 20, H - 38);
  ctx.fillText(`frame p95 ${pct(perf.frame, .95).toFixed(1)} ms · work p50 ${pct(perf.work, .5).toFixed(1)} p95 ${pct(perf.work, .95).toFixed(1)} ms · chunks ${chunks.size} quality ${G.lowQ ? 'reduced' : 'full'}`, 20, H - 20); ctx.restore();
}
let acc = 0, last = 0, manual = TEST;
function frame(now){
  requestAnimationFrame(frame);
  const dt = last ? Math.min(.25, (now - last)/1000) : 0; last = now;
  const t0 = performance.now();
  if (G.mode === 'play' && !G.paused && !manual && !(isTouch() && document.body.classList.contains('portrait'))){
    acc += dt; let n = 0;
    while (acc >= STEP && n < PH.maxSteps && G.mode === 'play'){ if (demo) testInput = demoInput(); update(STEP); acc -= STEP; n++; }
    if (n === PH.maxSteps) acc = 0;
  }
  if (SCENE_ANIM || G.mode === 'results') G.t += dt;
  if (G.mode === 'play' || G.mode === 'results' || SCENE_ANIM) draw();
  const work = performance.now() - t0;
  if (G.mode === 'play' && dt){ perf.work.push(work); perf.frame.push(dt*1000); if (perf.work.length > 300){ perf.work.shift(); perf.frame.shift(); }
    perf.slow = work > 12 ? perf.slow + 1 : 0; if (perf.slow > 90) G.lowQ = true; }                 // parallax, bubbles and sparks go first; tells and water levels never
}
// A recorded run (tools/test-mike-l2-run.cjs writes it): the same inputs, frame for frame, through the same rules.
const KEYS = ['left', 'right', 'jump', 'dive', 'lookDown', 'camera', 'fix'];
function demoInput(){ if (!demo || demo.i >= demo.frames.length) return {}; const bits = demo.frames[demo.i++], o = {}; KEYS.forEach((k, j) => { o[k] = !!(bits & (1 << j)); }); return o; }
function loadDemo(d){ const frames = []; for (const [bits, n] of d.runs) for (let i = 0; i < n; i++) frames.push(bits); demo = { frames, i:0 }; }

// ---------- menus ----------
function menu(kind){ const m = $('menu'); m.hidden = false; m.dataset.kind = kind; $('resume-save').hidden = !(kind === 'title' && L && loadSave()); }
function toTitle(){
  G.mode = 'title'; document.body.dataset.mode = 'title'; S = E.create(L); S.suit = true; AU.hum(false); AU.boss(false); $('pausebox').hidden = true; G.paused = false;
  SCENE_DRAW = drawTitle; SCENE_ANIM = true; menu('title');
  if (!TEST) history.replaceState(null, '', location.pathname);
}
$('play').onclick = () => { AU.unlock(); AU2.unlock(); clearSave(); startPlay(); };
$('resume-save').onclick = () => { AU.unlock(); AU2.unlock(); startPlay(loadSave()); };
$('res-replay').onclick = () => { clearSave(); startPlay(); };       // after Level 2 there is only Play again (owner, 30 Sept)
$('resume').onclick = () => setPaused(false);
$('restart-cp').onclick = () => { setPaused(false); S.health = 0; S.lives++; S.livesLost--; S.dead = .01; S.events = []; };
$('quit').onclick = () => { save(); setPaused(false); toTitle(); };
$('pause').onclick = () => { if (G.mode === 'play') setPaused(!G.paused); };
function soundLabel(){ $('sound').classList.toggle('off', AU.muted); $('sound').setAttribute('aria-label', AU.muted ? 'Sound off' : 'Sound on'); $('snd-toggle').textContent = 'Sound: ' + (AU.muted ? 'off' : 'on'); }
$('sound').onclick = $('snd-toggle').onclick = () => { AU.unlock(); AU2.unlock(); AU.setMuted(!AU.muted); soundLabel(); };

// ---------- boot ----------
function img(src){ const i = new Image(); i.src = src; return i.decode().then(() => i); }
async function boot(){
  const [data] = await Promise.all([fetch('level-2.json').then(r => r.json()), M.puppet.load('assets/'), AU.preload()]);
  L = E.load(data);
  if (L.errors.length) console.error('Level 2 failed validation: ' + L.errors.join('; '));
  lockRed = await img('assets/mtdcnc-lockup-red.png');
  rig = await M.puppet.bake(2*2*T*Z/M.puppet.HEIGHT);
  if (!SCENE || ['title', 'results', 'poses'].includes(SCENE) || !ROOM) rigL = await M.puppet.bake(.42);
  if (DEMO){ try { loadDemo(await fetch('demo-2.json').then(r => r.json())); } catch(e){ console.error('No recorded run: ' + e.message); } }
  soundLabel();
  if (!unlocked()){ document.body.dataset.mode = 'locked'; $('loading').hidden = true; $('locked').hidden = false; return; }
  $('loading').hidden = true;
  if (SCENE){ const f = SCENES[SCENE]; if (!f){ console.error('unknown scene ' + SCENE); return; } document.body.dataset.mode = 'scene'; f(); draw(); }
  else if (ROOM || DEMO){ startPlay(null, DEMO ? 0 : ROOM === 'boss' ? 'boss' : +ROOM); draw(); }
  else toTitle();
  document.body.dataset.ready = '1';
  requestAnimationFrame(frame);
}
window.__l2 = {
  get S(){ return S; }, get L(){ return L; }, get G(){ return G; },
  reset(room){ manual = true; testInput = null; startPlay(null, room || 0); G.card = 0; draw(); return this.snapshot(); },
  resume(){ const sv = loadSave(); manual = true; startPlay(sv); return !!sv; },
  step(n, inp){ manual = true; testInput = Object.assign({}, inp); for (let i = 0; i < (n || 1) && G.mode === 'play'; i++) update(STEP); draw(); return this.snapshot(); },
  place(x, y, o){ S.P = M.newPlayer(x, y); S.P.hitT = 9; Object.assign(S, o); G.camY = targetCamY(); follow(1, true); draw(); return this.snapshot(); },
  release(){ testInput = null; manual = false; },
  snapshot(){ return S && Object.assign(E.snapshot(S), { camX:G.camX, camY:G.camY, mode:G.mode, state:anim.st, lookDown:S.lookDown, sx:toScreen(S.P.x, S.P.y).x, sy:toScreen(S.P.x, S.P.y).y, paused:G.paused }); },
  runDemo(max){ manual = true; let n = 0; while (G.mode === 'play' && demo && demo.i < demo.frames.length && n < (max || 1e6)){ testInput = demoInput(); update(STEP); n++; } draw(); return { steps:n, won:S.won, results:G.results, snap:this.snapshot() }; },
  clearSave, save, perf(){ return { workP50:pct(perf.work, .5), workP95:pct(perf.work, .95), frameP95:pct(perf.frame, .95), lowQ:G.lowQ }; },
  scenes:() => M.L2_SCENES, draw
};
boot().catch(e => { console.error(e); $('loading').textContent = 'Could not start: ' + e.message; });
})();
