// The heads-up display, shared by every level (owner, 2 Oct: the screens were too busy; panels covered the play).
// Two small pills and nothing else that stays: health and lives top left, the camera top right. Score and salvage
// show under the left pill for a moment when they change, and while paused. A level may add one small pill under the
// camera for something it must always show (Level 2's static charge). While filming, the viewfinder is thin corners, a
// small REC line and the focus box on Mike (owner's direction: REC, 120 FPS, focus box). Canvas units: 960 x 540.
(function(){
'use strict';
const M = window.MIKE, W = 960, H = 540;
const memo = { score:null, salvage:null, at:-99 };
function rr(c, x, y, w, h, r){ r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function pill(c, x, y, w, h, edge){ rr(c, x, y, w, h, h/2); c.fillStyle = 'rgba(0,36,72,.74)'; c.fill(); if (edge){ c.strokeStyle = edge; c.lineWidth = 2; c.stroke(); } }
function camIcon(c, x, y, col){ c.fillStyle = col; rr(c, x - 10, y - 6, 15, 12, 3); c.fill(); c.beginPath(); c.moveTo(x + 6, y - 2); c.lineTo(x + 12, y - 6); c.lineTo(x + 12, y + 6); c.lineTo(x + 6, y + 2); c.closePath(); c.fill(); }
// o: { font, t, health, lives, lifeIcon(c, x, y), cam, filming, score, salvage, total, newBest, continues, paused, extra }
function pills(c, o){
  const font = o.font, C = o.cam;
  c.save(); c.textBaseline = 'middle';
  // left: health, lives
  pill(c, 12, 10, 136, 32);
  for (let i = 0; i < 3; i++){ c.beginPath(); c.arc(30 + i*17, 26, 6, 0, Math.PI*2); c.fillStyle = i < o.health ? '#fff' : 'rgba(255,255,255,0)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
  if (o.lifeIcon) o.lifeIcon(c, 92, 38);
  c.fillStyle = '#fff'; c.font = `700 16px ${font}`; c.textAlign = 'left'; c.fillText('×' + o.lives, 104, 27);
  // right: the camera. Outside a boss, footage left on the card; in a boss, the clips (owner, 29 Sept)
  const x0 = W - 12 - 170, filming = o.filming, low = !C.boss && C.left < M.CAMERA.min;
  pill(c, x0, 10, 170, 32, filming ? '#FF4A3A' : null);
  camIcon(c, x0 + 22, 26, filming && Math.floor(o.t*2.5) % 2 === 0 ? '#FF4A3A' : '#fff');
  if (C.boss){
    const total = Math.max(1, Math.round(C.cap/M.CLIP.cost)), cw = Math.min(22, (120 - (total - 1)*5)/total);
    for (let i = 0; i < total; i++){ const x = x0 + 44 + i*(cw + 5);
      rr(c, x, 19, cw, 14, 4); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      if (i < M.clipsLeft(C) || (C.on && i === 0)){ const f = C.on && i === 0 ? M.clipRemaining(C)/M.CLIP.length : 1; rr(c, x, 19, Math.max(3, cw*f), 14, 4); c.fillStyle = C.on && i === 0 ? '#FF4A3A' : '#fff'; c.fill(); } }
  } else {
    const secs = M.cameraSeconds(C), cap = M.cameraSeconds(C, C.cap), bx = x0 + 42, bw = 76;
    rr(c, bx, 20, bw, 12, 5); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
    if (C.left > 0){ rr(c, bx, 20, Math.max(5, bw*secs/cap), 12, 5); c.fillStyle = filming ? '#FF4A3A' : low ? 'rgba(255,255,255,.45)' : '#fff'; c.fill(); }
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; rr(c, bx, 20, bw, 12, 5); c.stroke();
    c.font = `700 14px ui-monospace,Menlo,Consolas,monospace`; c.fillStyle = low ? 'rgba(255,255,255,.55)' : '#fff'; c.textAlign = 'right'; c.fillText(secs.toFixed(1) + 's', x0 + 160, 27);
  }
  if (C.refused > 0){ c.font = `700 11px ${font}`; c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText('CARD BUSY', W - 20, 52); }
  // one more pill under the camera, if the level needs one always (Level 2's static)
  if (o.extra) extraPill(c, x0, 48, 170, o.extra, font, o.t);
  // score and salvage: a moment after each change, and while paused
  if (o.score !== memo.score || o.salvage !== memo.salvage){ if (memo.score !== null) memo.at = o.t; memo.score = o.score; memo.salvage = o.salvage; }
  const age = o.t - memo.at, a = o.paused ? 1 : age < 2 ? 1 : age < 2.5 ? (2.5 - age)/.5 : 0;
  if (a > 0){
    c.globalAlpha = a;
    const gold = o.newBest, text = o.score.toLocaleString('en-GB');
    c.font = `800 15px ${font}`; const sw = c.measureText(text).width, cont = o.continues > 0 ? '  CONT ×' + o.continues : '';
    c.font = `700 13px ${font}`; const tw = c.measureText(o.salvage + '/' + o.total + cont).width;
    pill(c, 12, 48, 58 + sw + 40 + tw, 26, gold ? '#FFE066' : null);
    c.font = `600 11px ${font}`; c.fillStyle = 'rgba(255,255,255,.7)'; c.textAlign = 'left'; c.fillText(gold ? 'BEST' : 'SCORE', 24, 61);
    c.font = `800 15px ${font}`; c.fillStyle = gold ? '#FFE066' : '#fff'; c.fillText(text, 66, 61);
    // a small salvage tag
    const gx = 66 + sw + 18; c.save(); c.translate(gx, 61); c.beginPath(); for (let i = 0; i < 6; i++){ const ang = i*Math.PI/3; c.lineTo(Math.cos(ang)*7, Math.sin(ang)*7); } c.closePath(); c.strokeStyle = '#a4e8d5'; c.lineWidth = 2; c.stroke(); c.restore();
    c.font = `700 13px ${font}`; c.fillStyle = '#fff'; c.fillText(o.salvage + '/' + o.total, gx + 12, 61);
    if (cont){ c.fillStyle = '#FFE066'; c.fillText(cont, gx + 12 + c.measureText(o.salvage + '/' + o.total).width, 61); }
    c.globalAlpha = 1;
  }
  c.restore();
}
function extraPill(c, x, y, w, e, font, t){
  const crit = e.crit, pulse = crit ? .5 + .5*Math.sin(t*12) : 0;
  rr(c, x, y, w, 26, 13); c.fillStyle = crit ? `rgba(${Math.round(90 + 70*pulse)},20,20,.88)` : 'rgba(0,36,72,.74)'; c.fill();
  if (e.warn){ c.strokeStyle = crit ? '#FF5A4A' : '#F4CA46'; c.lineWidth = 2; c.stroke(); }
  const col = crit ? '#FFD7D2' : e.warn ? '#F4CA46' : '#cdf6f0';
  c.fillStyle = col; c.beginPath(); c.moveTo(x + 22, y + 4); c.lineTo(x + 13, y + 14); c.lineTo(x + 18, y + 14); c.lineTo(x + 15, y + 22); c.lineTo(x + 25, y + 11); c.lineTo(x + 20, y + 11); c.closePath(); c.fill();
  const bx = x + 34, bw = 84; rr(c, bx, y + 8, bw, 10, 4); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill();
  if (e.frac > .01){ rr(c, bx, y + 8, Math.max(5, bw*e.frac), 10, 4); c.fillStyle = col; c.fill(); }
  c.strokeStyle = '#fff'; c.lineWidth = 1.5; rr(c, bx, y + 8, bw, 10, 4); c.stroke();
  c.font = `700 13px ui-monospace,Menlo,Consolas,monospace`; c.fillStyle = crit ? '#FFD7D2' : '#fff'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(e.text, x + w - 10, y + 14);
}
// While filming: a light vignette, thin corners, one small REC line under the pause buttons, the focus box on Mike.
function viewfinder(c, o){
  c.save();
  const g = c.createRadialGradient(W/2, H/2, H*.45, W/2, H/2, H*1.02); g.addColorStop(0, 'rgba(0,12,28,0)'); g.addColorStop(1, 'rgba(0,12,28,.34)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const m = 12, l = 40;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]){
    c.lineCap = 'square'; c.beginPath(); c.moveTo(x, y + dy*l); c.lineTo(x, y); c.lineTo(x + dx*l, y);
    c.strokeStyle = 'rgba(0,20,40,.5)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
  }
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 3; c.textBaseline = 'middle'; c.textAlign = 'center';
  c.font = `800 13px ${o.font}`; const label = 'REC  ·  120 FPS  ·  SLOW ×0.2', lw = c.measureText(label).width;
  if (Math.floor(o.t*2.5) % 2 === 0){ c.fillStyle = '#FF2A2A'; c.beginPath(); c.arc(W/2 - lw/2 - 4, 74, 5.5, 0, Math.PI*2); c.fill(); }
  c.fillStyle = '#fff'; c.fillText(label, W/2 + 8, 75);
  c.shadowBlur = 0;
  if (o.af){
    const s = o.af, w = 74, h = 104, x = s.x - w/2, y = s.y - h - 4, k = 16, p = 1 + .03*Math.sin(o.t*8);
    c.save(); c.translate(s.x, y + h/2); c.scale(p, p); c.translate(-s.x, -(y + h/2));
    c.strokeStyle = '#7CFF9A'; c.lineWidth = 3; c.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]){ c.moveTo(cx, cy + dy*k); c.lineTo(cx, cy); c.lineTo(cx + dx*k, cy); }
    c.stroke(); c.restore();
  }
  c.restore();
}
// A slim one-line helper at the bottom (the owner's "Hold E to fix", kept).
function helper(c, text, font){
  c.save(); c.font = `700 15px ${font}`; const w = c.measureText(text).width + 36;
  pill(c, W/2 - w/2, H - 62, w, 30, '#F4CA46'); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W/2, H - 47); c.restore();
}
M.hud = { pills, viewfinder, helper, pill };
})();
