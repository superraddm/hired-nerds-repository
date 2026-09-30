// The workshop's art, drawn in code: the building, terrain, pickups, bench and interface pieces. The machines themselves
// are in machines.js. Brand red and blues belong only to the architecture and the interface. World pixels, T = 32.
(function(){
'use strict';
const M = window.MIKE = window.MIKE || {};
const T = 32;
const C = {
  red:'#EB0000', redShade:'#CD0103', blue:'#0F579B', blue2:'#0A4A88', navy:'#002C5A',
  steel:'#697078', steelL:'#B9BEC3', steelXL:'#E6E8E9', warn:'#F4CA46', ink:'#141416', dark:'#1E242A', pit:'#070B10',
  steelD:'#4A5159', steelDD:'#353B42', white:'#FFFFFF', slow:'#7CC7FF', coolant:'#CFEFFF'
};
const FONT = '"Helvetica Neue LT Std","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif';
const A = M.art = { C, T, FONT };

// ---------- helpers ----------
function rr(c, x, y, w, h, r){ r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ink(c, w){ c.lineWidth = w || 3; c.strokeStyle = C.ink; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function fillInk(c, fill, w){ c.fillStyle = fill; c.fill(); ink(c, w); }
function bolt(c, x, y, r){ c.beginPath(); c.arc(x, y, r || 2.6, 0, 7); c.fillStyle = C.steelL; c.fill(); c.lineWidth = 1.4; c.strokeStyle = C.ink; c.stroke(); }
function circ(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); }
function stripes(c, x, y, w, h, s){
  s = s || 8; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = C.dark; c.fillRect(x, y, w, h); c.fillStyle = C.warn;
  for (let i = -h - s*2; i < w + h; i += s*2){ c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + h, y); c.lineTo(x + i + h + s, y); c.lineTo(x + i + s, y + h); c.closePath(); c.fill(); }
  c.restore();
}
function vgrad(c, y0, y1, stops){ const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => g.addColorStop(i/(stops.length - 1), s)); return g; }
function hgrad(c, x0, x1, stops){ const g = c.createLinearGradient(x0, 0, x1, 0); stops.forEach((s, i) => g.addColorStop(i/(stops.length - 1), s)); return g; }
function dotted(c, pts, r, color, gap){
  c.save(); c.strokeStyle = color; c.lineWidth = 2.5;
  for (const [x, y] of pts){ circ(c, x, y, r); c.stroke(); }
  c.restore();
}
A.rr = rr; A.ink = ink; A.circ = circ; A.stripes = stripes; A.bolt = bolt; A.fillInk = fillInk; A.vgrad = vgrad; A.hgrad = hgrad; A.dotted = dotted;

// ---------- backdrop layers ----------
// Far wall at 0.15x: brand-blue architecture, blueprint grid, trusses and tall windows. One 1024px tile, repeated.
A.makeFar = function(){
  const W = 1024, H = 540, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = vgrad(c, 0, H, ['#0A4A88', '#0F579B', '#0F579B', '#0A4A88']); c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 32){ c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); }
  for (let y = 0; y <= H; y += 32){ c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
  // tall arched windows
  for (let i = 0; i < 4; i++){
    const x = 64 + i*256, y = 120, w = 128, h = 220;
    c.fillStyle = 'rgba(0,44,90,.55)'; rr(c, x - 8, y - 8, w + 16, h + 16, 60); c.fill();
    c.fillStyle = vgrad(c, y, y + h, ['#5E9FD8', '#2E73B5']); rr(c, x, y, w, h, 56); c.fill();
    c.strokeStyle = 'rgba(0,44,90,.8)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x + w/2, y + 6); c.lineTo(x + w/2, y + h); c.moveTo(x, y + h*.45); c.lineTo(x + w, y + h*.45); c.moveTo(x, y + h*.75); c.lineTo(x + w, y + h*.75); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x + 14, y + h); c.lineTo(x + 40, y + 30); c.lineTo(x + 58, y + 30); c.lineTo(x + 32, y + h); c.fill();
  }
  // roof trusses
  c.strokeStyle = '#002C5A'; c.lineWidth = 7; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, 40); c.lineTo(W, 40); c.moveTo(0, 92); c.lineTo(W, 92); c.stroke();
  c.lineWidth = 4; c.beginPath();
  for (let x = 0; x < W; x += 64){ c.moveTo(x, 92); c.lineTo(x + 32, 40); c.lineTo(x + 64, 92); }
  c.stroke();
  c.fillStyle = 'rgba(0,44,90,.45)'; c.fillRect(0, 0, W, 36);
  // low wall band behind the floor
  c.fillStyle = 'rgba(0,44,90,.35)'; c.fillRect(0, 330, W, 210);
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2;
  for (let x = 16; x < W; x += 128){ rr(c, x, 346, 96, 40, 8); c.stroke(); }
  return cv;
};
// Pipes at 0.35x: a mid layer of navy pipes, valve wheels, gauges and lamps. Transparent, 1280px tile.
A.makePipes = function(){
  const W = 1280, H = 540, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const pipe = (pts, w, col) => { c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#012347'; c.lineWidth = w + 5; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = Math.max(2, w*.22); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y - w*.22) : c.moveTo(x, y - w*.22)); c.stroke(); };
  pipe([[0, 132], [W, 132]], 18, '#0B3A6E');
  pipe([[0, 160], [420, 160], [460, 200], [460, 360]], 10, '#0C427C');
  pipe([[W, 160], [900, 160], [860, 120], [700, 120], [700, 60]], 10, '#0C427C');
  pipe([[260, 132], [260, 300], [300, 340], [300, 380]], 12, '#0B3A6E');
  pipe([[1040, 132], [1040, 250], [1100, 250], [1100, 380]], 14, '#0B3A6E');
  for (let x = 40; x < W; x += 160){ c.fillStyle = '#012347'; c.fillRect(x, 120, 8, 26); }        // clamps
  const wheel = (x, y, r) => { c.strokeStyle = '#012347'; c.lineWidth = 6; circ(c, x, y, r); c.stroke();
    c.strokeStyle = '#1B5C9C'; c.lineWidth = 3; circ(c, x, y, r); c.stroke(); c.beginPath(); for (let a = 0; a < 3; a++){ c.moveTo(x, y); c.lineTo(x + Math.cos(a*2.1)*r, y + Math.sin(a*2.1)*r); } c.stroke(); };
  wheel(460, 250, 16); wheel(1100, 300, 18); wheel(700, 90, 12);
  const gauge = (x, y, r) => { c.fillStyle = '#012347'; circ(c, x, y, r + 4); c.fill(); c.fillStyle = '#9FC4E8'; circ(c, x, y, r); c.fill();
    c.strokeStyle = '#012347'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r*.7, y - r*.4); c.stroke(); };
  gauge(300, 250, 14); gauge(880, 210, 12);
  if (A.backMachines) A.backMachines(c);
  // hanging lamps with soft cones
  for (const x of [140, 620, 980]){
    c.strokeStyle = '#012347'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 190); c.stroke();
    c.fillStyle = '#0B3A6E'; c.beginPath(); c.moveTo(x - 26, 214); c.quadraticCurveTo(x, 176, x + 26, 214); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, 214, 0, 400); g.addColorStop(0, 'rgba(255,248,214,.16)'); g.addColorStop(1, 'rgba(255,248,214,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 24, 214); c.lineTo(x + 24, 214); c.lineTo(x + 110, 400); c.lineTo(x - 110, 400); c.fill();
  }
  return cv;
};
// A parallax object sits at world tile x and is centred on screen when the view is centred on it.
A.parallaxX = (wx, camX, f) => (wx*T - camX - 480)*f + 480;

// The Tangled Turner as a distant silhouette (section 4): drum, bead arms, a few warning glints.
// An observation window in the stores' back wall: through it, far off, the Tangled Turner (section 4).
A.viewWindow = function(c, r, inside){
  const [x, y, w, h] = r.map(v => v*T);
  c.save(); rr(c, x, y, w, h, 18); c.clip();
  c.fillStyle = vgrad(c, y, y + h, ['#041F3D', '#083360']); c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; for (let gx = x; gx < x + w; gx += 16){ c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
  inside();
  c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x + w*.15, y + h); c.lineTo(x + w*.35, y); c.lineTo(x + w*.45, y); c.lineTo(x + w*.25, y + h); c.fill();
  c.restore();
  rr(c, x, y, w, h, 18); c.lineWidth = 10; c.strokeStyle = C.steel; c.stroke(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke();
  c.strokeStyle = C.steel; c.lineWidth = 6; c.beginPath(); c.moveTo(x + w/2, y); c.lineTo(x + w/2, y + h); c.stroke();
  for (const bx of [x + 14, x + w/2, x + w - 14]){ bolt(c, bx, y + 6); bolt(c, bx, y + h - 6); }
};

// ---------- terrain ----------
function drawFloor(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = vgrad(c, y, y + h, ['#5B636B', '#474E56', '#2F353B']); c.fillRect(x, y, w, h);
  // deck plates
  c.strokeStyle = 'rgba(20,20,22,.45)'; c.lineWidth = 2;
  for (let px = Math.ceil(x/64)*64; px < x + w; px += 64){ c.beginPath(); c.moveTo(px, y + 10); c.lineTo(px, y + h); c.stroke(); }
  c.beginPath(); c.moveTo(x, y + 58); c.lineTo(x + w, y + 58); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.07)';
  for (let px = Math.ceil(x/64)*64; px < x + w; px += 64){ c.fillRect(px + 3, y + 12, 58, 3); }
  for (let px = Math.ceil(x/64)*64 + 10; px < x + w; px += 64){ bolt(c, px, y + 22, 2.4); bolt(c, px + 44, y + 22, 2.4); }
  // vents in the lower wall, every 8T
  for (let px = Math.ceil((x + 96)/256)*256 - 96; px < x + w - 60; px += 256){
    rr(c, px, y + 78, 56, 34, 7); c.fillStyle = '#262C33'; c.fill(); ink(c, 2);
    c.fillStyle = '#3E454D'; for (let i = 0; i < 4; i++) c.fillRect(px + 8, y + 84 + i*7, 40, 3);
  }
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y + 124, w, h - 124);
  // the walking surface: a bright lip so every landing edge reads
  c.fillStyle = C.steelL; c.fillRect(x, y, w, 8); c.fillStyle = C.steelXL; c.fillRect(x, y, w, 3);
  c.fillStyle = C.ink; c.fillRect(x, y + 8, w, 2);
}
function drawPit(c, p, H){
  const x = p.x0*T, w = (p.x1 - p.x0)*T, y = 12*T, h = (H - 12)*T + 8;
  c.fillStyle = vgrad(c, y, y + h, ['#10161D', C.pit, '#000']); c.fillRect(x, y, w, h);
  // side walls of the opening
  c.fillStyle = '#262C33'; c.fillRect(x, y, 6, h); c.fillRect(x + w - 6, y, 6, h);
  // the broken yellow rim
  c.fillStyle = C.warn;
  for (let yy = y + 14; yy < y + h; yy += 22){ c.fillRect(x + 1, yy, 5, 12); c.fillRect(x + w - 6, yy, 5, 12); }
  for (const [ex, d] of [[x, -1], [x + w, 1]]){
    for (let i = 0; i < 3; i++){ const bx = ex + d*(6 + i*14) - (d < 0 ? 10 : 0); c.fillRect(bx, y, 10, 5); }
  }
}
function drawShelf(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  // wall brackets behind the plank
  c.fillStyle = '#0B3A6E'; c.strokeStyle = '#012347'; c.lineWidth = 2;
  for (const bx of [x + 10, x + w - 22]){ c.beginPath(); c.moveTo(bx, y + h); c.lineTo(bx + 12, y + h); c.lineTo(bx + 12, y + h + 26); c.closePath(); c.fill(); c.stroke(); }
  rr(c, x, y, w, h, 5); c.fillStyle = vgrad(c, y, y + h, [C.steelXL, C.steelL, C.steel]); c.fill(); ink(c, 2.5);
  c.fillStyle = C.warn; rr(c, x + 3, y + 4, 8, h - 7, 2); c.fill(); rr(c, x + w - 11, y + 4, 8, h - 7, 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x + 14, y + 3, w - 28, 2);
}
function drawHousing(c, s){
  if (A.housing) return A.housing(c, s);
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = hgrad(c, x, x + w, [C.steelD, C.steel, '#7C848C', C.steel, C.steelD]); c.fillRect(x, y, w, h);
  c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 1.5, y); c.lineTo(x + 1.5, y + h); c.moveTo(x + w - 1.5, y); c.lineTo(x + w - 1.5, y + h); c.stroke();
  c.strokeStyle = 'rgba(20,20,22,.35)'; c.lineWidth = 2;
  for (let yy = y + 64; yy < y + h - 20; yy += 72){ c.beginPath(); c.moveTo(x + 4, yy); c.lineTo(x + w - 4, yy); c.stroke(); }
  for (let yy = y + 24; yy < y + h - 20; yy += 72){ bolt(c, x + 10, yy, 2.4); bolt(c, x + w - 10, yy, 2.4); }
  stripes(c, x, y + h - 10, w, 10, 7);
  c.fillStyle = C.ink; c.fillRect(x, y + h - 2, w, 2);
}
function drawPad(c, p){
  const x = p.x0*T, w = (p.x1 - p.x0)*T, y = 12*T;
  c.save(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.setLineDash([6, 5]);
  rr(c, x + 4, y + 14, w - 8, 28, 6); c.stroke(); c.restore();
  c.fillStyle = 'rgba(255,255,255,.95)'; c.font = `700 14px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('WAIT', x + w/2, y + 29);
}
// A plain roller door in a steel frame. lift (tiles) raises the door inside its frame.
function drawDoor(c, x, top, lift){
  const X = x*T, F = top*T, Y = F - (lift || 0)*T, H = 12*T - F;
  c.fillStyle = C.steelD; c.fillRect(X - 8, F - 12, 40, H + 12);
  if (lift){ c.fillStyle = '#10161D'; c.fillRect(X, F, 28, H); c.save(); c.beginPath(); c.rect(X - 8, F - 12, 40, H + 12); c.clip(); }
  c.fillStyle = vgrad(c, Y, Y + H, [C.steelL, C.steel]); c.fillRect(X, Y, 28, H);
  c.strokeStyle = 'rgba(20,20,22,.35)'; c.lineWidth = 2; for (let y = Y + 10; y < Y + H; y += 10){ c.beginPath(); c.moveTo(X, y); c.lineTo(X + 28, y); c.stroke(); }
  c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(X, Y, 28, H);
  stripes(c, X, Y + H - 10, 28, 10, 6);
  if (lift) c.restore();
}
A.drawDoor = drawDoor; A.drawShelf = drawShelf;

// Everything that never moves, for one chunk of world pixels [x0, x1). Cached by the renderer.
A.drawStatic = function(c, L, x0, x1){
  const inR = (a, b) => b*T > x0 - 64 && a*T < x1 + 64;
  for (const s of L.solids) if (inR(s.x, s.x + s.w)){
    if (s.kind === 'floor') drawFloor(c, s); else if (s.kind === 'roof') drawHousing(c, s); else if (s.kind === 'shelf') drawShelf(c, s);
  }
  for (const p of L.pits) if (inR(p.x0, p.x1)) drawPit(c, p, L.H);
  for (const p of L.pads) if (inR(p.x0, p.x1)) drawPad(c, p);
  // the level's left wall: the shop's entrance
  if (x0 < 64){ c.fillStyle = C.steelD; c.fillRect(-40, 0, 40, 12*T); c.fillStyle = C.steelL; c.fillRect(-4, 0, 4, 12*T); }
  for (const d of L.decor) if (inR(d.x - 3, d.x + 4)){
    if (d.type === 'landingArc') landingArc(c, d);
    else if (d.type === 'bench') bench(c, d.x, d.y);
    else if (d.type === 'recipeBoard') recipeBoard(c, d.x, d.y, L.boss && L.boss.recipe);
    else if (d.type === 'dispenser') dispenser(c, d.x, d.y);
  }
};

function landingArc(c, d){
  const [ax, ay] = d.from, [bx, by] = d.to, pts = [];
  for (let i = 1; i < 12; i++){ const u = i/12, x = ax + (bx - ax)*u, y = ay + (by - ay)*u - 2.6*4*u*(1 - u); pts.push([x*T, y*T - 18]); }
  dotted(c, pts, 4, 'rgba(255,255,255,.85)');
}
// Keycaps and touch-button glyphs, so the game shows the real controls for this device.
function keycap(c, x, y, label, h){
  h = h || 30; c.save(); c.font = `700 ${Math.round(h*.5)}px ${FONT}`;
  const w = Math.max(h, c.measureText(label).width + h*.5);
  rr(c, x, y - h/2 + 3, w, h, 7); c.fillStyle = '#9AA3AD'; c.fill();
  rr(c, x, y - h/2, w, h - 3, 7); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.navy; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w/2, y - 1);
  c.restore(); return w;
}
function touchGlyph(c, x, y, kind, r){
  r = r || 16; c.save(); circ(c, x + r, y, r); c.fillStyle = C.navy; c.fill(); c.strokeStyle = C.white; c.lineWidth = 2; c.stroke();
  c.fillStyle = C.white; c.beginPath();
  if (kind === 'left'){ c.moveTo(x + r + 5, y - 7); c.lineTo(x + r - 5, y); c.lineTo(x + r + 5, y + 7); }
  else if (kind === 'right'){ c.moveTo(x + r - 5, y - 7); c.lineTo(x + r + 5, y); c.lineTo(x + r - 5, y + 7); }
  else if (kind === 'jump'){ c.moveTo(x + r, y - 8); c.lineTo(x + r + 7, y + 1); c.lineTo(x + r + 3, y + 1); c.lineTo(x + r + 3, y + 7); c.lineTo(x + r - 3, y + 7); c.lineTo(x + r - 3, y + 1); c.lineTo(x + r - 7, y + 1); }
  c.closePath(); c.fill();
  if (kind === 'camera') cameraIcon(c, x + r, y, .62, C.white);
  if (kind === 'fix'){ c.strokeStyle = C.white; c.lineWidth = 3; c.beginPath(); c.moveTo(x + r - 6, y + 6); c.lineTo(x + r + 5, y - 5); c.stroke(); }
  c.restore(); return 2*r;
}
// A row of controls: items are [kind, keyLabels[], word]. Returns the width drawn.
A.controlsRow = function(c, x, y, items, touch, h){
  h = h || 30; let cx = x;
  for (const [kind, labels, word] of items){
    if (touch){ for (const k of (kind === 'run' ? ['left', 'right'] : [kind])) cx += touchGlyph(c, cx, y, k, h/2) + 4; }
    else labels.forEach((l, i) => { if (i){ c.fillStyle = C.navy; c.font = `700 ${Math.round(h*.45)}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('/', cx + 2, y); cx += 12; } cx += keycap(c, cx, y, l, h) + 4; });
    c.fillStyle = C.navy; c.font = `700 ${Math.round(h*.62)}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(word, cx + 4, y); cx += c.measureText(word).width + 26;
  }
  return cx - x - 22;
};
A.KEYS = { run:['run', ['←', '→'], 'run'], runAD:['run', ['A', 'D'], ''], jump:['jump', ['Space'], 'jump'], camera:['camera', ['C'], 'camera'], fix:['fix', ['E'], 'hold to fix'] };
// A board hanging in the workshop showing this device's controls.
A.drawSign = function(c, g, touch){
  const items = g.kind === 'controls' ? [A.KEYS.run, A.KEYS.jump] : g.kind === 'camera' ? [A.KEYS.camera] : g.kind === 'fix' ? [A.KEYS.fix] : [];
  c.save();
  // measure by drawing the row invisibly first
  c.globalAlpha = 0; const w = A.controlsRow(c, 0, -999, items, touch, 30) + 36; c.globalAlpha = 1;
  const h = 50, x = g.x*T - w/2, y = g.y*T;
  c.strokeStyle = '#012347'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 24, 0); c.lineTo(x + 24, y); c.moveTo(x + w - 24, 0); c.lineTo(x + w - 24, y); c.stroke();
  rr(c, x, y, w, h, 10); c.fillStyle = C.white; c.fill(); c.lineWidth = 3; c.strokeStyle = C.navy; c.stroke();
  c.fillStyle = C.red; rr(c, x, y, 10, h, 5); c.fill();
  A.controlsRow(c, x + 22, y + h/2, items, touch, 30);
  c.restore();
};
function cameraIcon(c, x, y, s, col){
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  rr(c, -16, -10, 24, 20, 5); c.fill(); c.beginPath(); c.moveTo(8, -3); c.lineTo(18, -9); c.lineTo(18, 9); c.lineTo(8, 3); c.closePath(); c.fill();
  c.fillStyle = C.white; circ(c, -6, 0, 4); c.fill(); c.restore();
}
A.cameraIcon = cameraIcon;

// ---------- the service bench (section 9) ----------
function bench(c, x, y){
  const X = x*T, Y = y*T;
  // pegboard on the back wall with tool outlines
  rr(c, X - 10, Y - 150, 120, 80, 8); c.fillStyle = '#0B3A6E'; c.fill(); c.strokeStyle = '#012347'; c.lineWidth = 3; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++){ circ(c, X + 4 + i*18, Y - 140 + j*18, 2); c.fill(); }
  c.strokeStyle = C.steelXL; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(X + 14, Y - 136); c.lineTo(X + 14, Y - 90); c.stroke(); circ(c, X + 14, Y - 138, 7); c.stroke();
  c.beginPath(); c.moveTo(X + 50, Y - 134); c.lineTo(X + 50, Y - 96); c.stroke(); c.fillStyle = C.warn; rr(c, X + 44, Y - 100, 12, 22, 4); c.fill();
  c.beginPath(); c.moveTo(X + 80, Y - 132); c.lineTo(X + 94, Y - 96); c.moveTo(X + 94, Y - 132); c.lineTo(X + 80, Y - 96); c.stroke();
  // the bench itself
  rr(c, X, Y - 44, 104, 12, 4); fillInk(c, vgrad(c, Y - 44, Y - 32, [C.steelXL, C.steelL]), 2.5);
  rr(c, X + 6, Y - 32, 40, 32, 4); fillInk(c, C.steel, 2.5); rr(c, X + 58, Y - 32, 40, 32, 4); fillInk(c, C.steel, 2.5);
  c.fillStyle = C.steelXL; for (const dx of [26, 78]) { rr(c, X + dx - 8, Y - 20, 16, 4, 2); c.fill(); }
  // a friendly oil can and a little box on top
  c.fillStyle = C.warn; rr(c, X + 64, Y - 62, 22, 18, 3); c.fill(); ink(c, 2);
  rr(c, X + 14, Y - 58, 26, 14, 3); fillInk(c, C.steelL, 2);
}
function recipeBoard(c, x, y, recipe){
  const X = x*T - 40, Y = y*T - 150, w = 80, h = 116;
  c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(X + 16, Y + h); c.lineTo(X + 10, y*T); c.moveTo(X + w - 16, Y + h); c.lineTo(X + w - 10, y*T); c.stroke();
  rr(c, X, Y, w, h, 8); c.fillStyle = C.white; c.fill(); c.lineWidth = 3; c.strokeStyle = C.navy; c.stroke();
  c.fillStyle = C.navy; rr(c, X, Y, w, 22, 8); c.fill(); c.fillRect(X, Y + 12, w, 10);
  c.fillStyle = C.white; c.font = `700 12px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('REPAIR KIT', X + w/2, Y + 12);
  const rows = [['bearing', 2], ['seal', 2], ['coupling', 2], ['controlUnit', 2]];
  rows.forEach(([t, n], i) => { const ry = Y + 38 + i*22; A.pickupIcon(c, t, X + 24, ry, .62);
    c.fillStyle = C.navy; c.font = `700 16px ${FONT}`; c.textAlign = 'left'; c.fillText('× ' + n, X + 42, ry + 1); });
}
function dispenser(c, x, y){
  const X = x*T - 34, Y = y*T - 104, w = 68, h = 104;
  rr(c, X, Y, w, h, 10); fillInk(c, vgrad(c, Y, Y + h, [C.steelXL, C.steelL, C.steel]), 3);
  rr(c, X + 10, Y + 14, w - 20, 40, 6); fillInk(c, '#0A2C4A', 2.5);
  A.pickupIcon(c, 'bearing', X + 22, Y + 34, .55); A.pickupIcon(c, 'seal', X + 34, Y + 34, .55); A.pickupIcon(c, 'coupling', X + 46, Y + 34, .55);
  rr(c, X + 12, Y + 66, w - 24, 22, 6); fillInk(c, C.dark, 2.5);
  c.fillStyle = C.warn; rr(c, X + 18, Y + 72, w - 36, 10, 3); c.fill();
  c.fillStyle = C.navy; c.font = `700 10px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FREE', X + w/2, Y + 60);
  c.fillStyle = C.warn; circ(c, X + w/2, Y + 6, 6); c.fill(); ink(c, 2);
}

// ---------- dynamic pieces ----------
A.drawCheckpoint = function(c, x, y, lit, t){
  const X = x*T, Y = y*T;
  c.fillStyle = C.steelD; rr(c, X - 4, Y - 70, 8, 70, 3); c.fill(); ink(c, 2);
  rr(c, X - 16, Y - 100, 32, 34, 7); fillInk(c, vgrad(c, Y - 100, Y - 66, [C.steelXL, C.steelL]), 2.5);
  circ(c, X, Y - 86, 10); fillInk(c, C.white, 2);
  c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X, Y - 86); c.lineTo(X, Y - 93); c.moveTo(X, Y - 86); c.lineTo(X + 5, Y - 84); c.stroke();
  c.fillStyle = C.dark; c.fillRect(X - 8, Y - 72, 16, 3);
  const glow = lit ? (0.75 + .25*Math.sin(t*3)) : 0;
  circ(c, X, Y - 106, 6); fillInk(c, lit ? C.warn : C.steel, 2);
  if (lit){ c.fillStyle = `rgba(244,202,70,${.25*glow})`; circ(c, X, Y - 106, 16); c.fill(); }
};

A.slowOutline = function(c, x, y, w, h){
  c.save(); c.setLineDash([10, 7]); c.strokeStyle = C.slow; c.lineWidth = 3; rr(c, x, y, w, h, 10); c.stroke(); c.restore();
};

// ---------- pickups ----------
// Shapes and labels distinguish them without relying on colour (design section 6).
A.pickupIcon = function(c, type, x, y, s){
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
  if (type === 'bearing'){                      // ring with balls
    circ(c, 0, 0, 13); fillInk(c, C.steelXL, 3); circ(c, 0, 0, 6); fillInk(c, C.navy, 2.5);
    for (let i = 0; i < 6; i++){ const a = i/6*Math.PI*2; circ(c, Math.cos(a)*9.5, Math.sin(a)*9.5, 2.2); c.fillStyle = C.steel; c.fill(); }
  } else if (type === 'seal'){                  // wavy washer
    c.beginPath(); for (let i = 0; i <= 48; i++){ const a = i/48*Math.PI*2, r = 13 + Math.sin(a*8)*2; c.lineTo(Math.cos(a)*r, Math.sin(a)*r); }
    c.closePath(); fillInk(c, C.warn, 3); circ(c, 0, 0, 6); fillInk(c, C.navy, 2.5);
  } else if (type === 'coupling'){              // split collar with a clamp screw
    c.beginPath(); c.arc(0, 0, 13, -Math.PI/2 + .45, Math.PI*1.5 - .45); c.arc(0, 0, 6, Math.PI*1.5 - .6, -Math.PI/2 + .6, true); c.closePath(); fillInk(c, C.steelL, 3);
    rr(c, -9, -19, 7, 9, 2); fillInk(c, C.steel, 2); rr(c, 2, -19, 7, 9, 2); fillInk(c, C.steel, 2);
    c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -15); c.lineTo(10, -15); c.stroke();
  } else if (type === 'lubricant'){             // oil can with a drop
    rr(c, -10, -8, 20, 20, 4); fillInk(c, C.warn, 3);
    c.beginPath(); c.moveTo(-6, -8); c.lineTo(-3, -14); c.lineTo(3, -14); c.lineTo(6, -8); c.closePath(); fillInk(c, C.steelL, 2.5);
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(8, -4); c.lineTo(17, -13); c.stroke(); c.strokeStyle = C.steelL; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(5, 4, 0, 7); c.quadraticCurveTo(-5, 4, 0, -3); c.fillStyle = C.navy; c.fill();
  } else if (type === 'controlUnit'){           // a small module with a screen and pins
    rr(c, -14, -12, 28, 24, 5); fillInk(c, C.steelXL, 3);
    rr(c, -9, -7, 18, 10, 2); fillInk(c, C.navy, 2);
    c.strokeStyle = C.white; c.lineWidth = 2; c.beginPath(); c.moveTo(-5, -2); c.lineTo(-1, 1); c.lineTo(5, -4); c.stroke();
    c.fillStyle = C.ink; for (let i = -9; i <= 9; i += 6) c.fillRect(i - 1, 12, 3, 5);
    c.fillStyle = C.warn; circ(c, 9, 7, 2.5); c.fill();
  } else if (type === 'sdCard'){                // standard card shape with a notch, no logo
    c.beginPath(); c.moveTo(-10, -14); c.lineTo(6, -14); c.lineTo(11, -9); c.lineTo(11, 14); c.lineTo(-10, 14); c.closePath(); fillInk(c, C.navy, 3);
    c.fillStyle = C.warn; for (let i = -7; i <= 5; i += 4) c.fillRect(i, -11, 2.4, 6);
    rr(c, -6, 0, 13, 10, 2); c.fillStyle = C.white; c.fill();
    c.fillStyle = '#FF2A2A'; circ(c, 0.5, 5, 3); c.fill();
  }
  c.restore();
};
A.PICKUP_NAMES = { bearing:'Bearing', seal:'Seal', coupling:'Coupling', lubricant:'Lubricant', controlUnit:'Control unit', sdCard:'SD card' };
// Power-ups and salvage must never be confused (owner, 27 Sept).
// Power-ups (lubricant = health, SD card = footage, mini Mike = life) float in a bright pulsing bubble with a badge.
// Salvage (bearing, seal, coupling, control unit) sits on a plain steel hex tag, turning slowly, with no glow.
A.POWER = { lubricant:{ ring:'#4FE08A', fill:'rgba(79,224,138,.22)', badge:'plus' }, sdCard:{ ring:'#FFB84D', fill:'rgba(255,184,77,.20)', badge:'rec' },
  miniMike:{ ring:'#FFE066', fill:'rgba(255,224,102,.24)', badge:'star' } };
A.powerBubble = function(c, x, y, type, t){
  const k = A.POWER[type], pulse = .5 + .5*Math.sin(t*5 + x*.01);
  c.save();
  circ(c, x, y, 21); c.fillStyle = k.fill; c.fill();
  c.lineWidth = 3; c.strokeStyle = k.ring; circ(c, x, y, 21 + pulse*3); c.globalAlpha = .55 + .45*pulse; c.stroke(); c.globalAlpha = 1;
  for (let i = 0; i < 4; i++){ const a = t*1.6 + i*Math.PI/2, sx = x + Math.cos(a)*27, sy = y + Math.sin(a)*27;
    c.fillStyle = k.ring; c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx + 1.4, sy); c.lineTo(sx, sy + 4); c.lineTo(sx - 1.4, sy); c.closePath(); c.fill(); }
  // badge, top right
  const bx = x + 15, by = y - 15;
  circ(c, bx, by, 8); c.fillStyle = k.ring; c.fill(); c.lineWidth = 2; c.strokeStyle = C.ink; c.stroke();
  c.fillStyle = C.ink; c.strokeStyle = C.ink;
  if (k.badge === 'plus'){ c.fillRect(bx - 1.6, by - 5, 3.2, 10); c.fillRect(bx - 5, by - 1.6, 10, 3.2); }
  else if (k.badge === 'rec'){ c.fillStyle = '#E8503A'; circ(c, bx, by, 3.6); c.fill(); }
  else { c.beginPath(); for (let i = 0; i < 10; i++){ const a = -Math.PI/2 + i*Math.PI/5, r = i % 2 ? 2.4 : 5.6; c.lineTo(bx + Math.cos(a)*r, by + Math.sin(a)*r); } c.closePath(); c.fill(); }
  c.restore();
};
A.salvageTag = function(c, x, y, t){
  c.save(); c.translate(x, y); c.rotate(Math.sin(t*1.3 + x*.02)*.18);
  c.beginPath(); for (let i = 0; i < 6; i++){ const a = Math.PI/6 + i*Math.PI/3; c.lineTo(Math.cos(a)*19, Math.sin(a)*19); } c.closePath();
  c.fillStyle = 'rgba(30,48,60,.78)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(190,210,220,.65)'; c.stroke();
  c.restore();
};
A.drawPickup = function(c, p, t){
  const bob = Math.sin(t*3 + p.x)*3, x = p.x*T, y = p.y*T + bob;
  if (A.POWER[p.type]){ A.powerBubble(c, x, y, p.type, t); A.pickupIcon(c, p.type, x, y, p.type === 'sdCard' ? 1.0 : .95); }
  else { A.salvageTag(c, x, y, t); A.pickupIcon(c, p.type, x, y, .82); }
};

})();
