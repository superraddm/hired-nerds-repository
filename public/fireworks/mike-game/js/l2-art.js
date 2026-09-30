// Below the Wire: the flooded cell's art, drawn in code in the Night Shift's style. A fictional wire-cutting
// enclosure: tanks, fixture tables, workpieces, travelling wire guides, flushing nozzles, pump intakes, handwheels.
// Nothing here carries a brand, a livery or any one maker's shape. Mike himself is never redrawn: his suit is laid
// over and behind the signed-off puppet. World pixels, T = 32.
//
// The structural rule (owner, 27 Sept): nothing heavy floats. Tables stand on legs, hanging baffles hang from a
// beam on rods, guides ride rails that are tied to the building, nozzles are fed by hose from a pipe.
(function(){
'use strict';
const M = window.MIKE, A = M.art, T = A.T, C = A.C, FONT = A.FONT, E = M.L2, K = M.PHYS;
const { rr, ink, fillInk, circ, bolt, stripes, vgrad, hgrad } = A;
const TAU = Math.PI*2;
const P = { deep:'#071923', deep2:'#183947', steel:'#284652', steelL:'#668591', skin:'#6f929e', skinL:'#d3e3e5', water:'#0d5865', waterL:'#6de0dd',
  safe:'#9be4c7', warn:'#ffc46a', cut:'#e3fbf2', red:'#E8503A', green:'#35C06A', amber:'#F4CA46' };
const A2 = M.art2 = { P };

function panel(c, x, y, w, h, a, b, r){
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, a || '#b0bcc2'); g.addColorStop(.48, b || '#425462'); g.addColorStop(1, a || '#b0bcc2');
  rr(c, x, y, w, h, r === undefined ? 3 : r); c.fillStyle = g; c.fill(); c.strokeStyle = '#101b23'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(235,250,255,.25)'; c.fillRect(x + 2, y + 2, w - 4, 2);
}
function line(c, x, y, xx, yy, color, width){ c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = width || 2; c.stroke(); }
function screw(c, x, y){ circ(c, x, y, 3); c.fillStyle = '#263c4b'; c.fill(); line(c, x - 1.5, y - 1, x + 1.5, y + 1, '#c1d6de', 1); }
function lampDot(c, x, y, color, on, r){
  r = r || 5; if (on){ c.fillStyle = color + '55'; circ(c, x, y, r*2.4); c.fill(); }
  circ(c, x, y, r); c.fillStyle = on ? color : '#22333c'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = C.ink; c.stroke();
  if (on){ c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, x - r*.3, y - r*.3, r*.3); c.fill(); }
}
// The machines' own traffic light (owner: red, amber, green; never a countdown). Horizontal, three lamps.
function signal(c, x, y, state, t){
  rr(c, x - 22, y - 8, 44, 16, 6); fillInk(c, '#16242c', 2);
  lampDot(c, x - 13, y, P.red, state === 'red', 4.5);
  lampDot(c, x, y, P.amber, state === 'amber' && Math.sin(t*22) > -.6, 4.5);
  lampDot(c, x + 13, y, P.green, state === 'green', 4.5);
}
A2.signal = signal;
const seeded = n => { const x = Math.sin(n*127.1 + 311.7)*43758.5453; return x - Math.floor(x); };

// ---------- static: tank interiors, structure, terrain, fixtures ----------
function tankInterior(c, L, t){
  const top = Math.min(...Object.values(t.levels)) - 1.2, x = t.x0*T, w = (t.x1 - t.x0)*T, y = Math.min(12, top)*T, h = t.floor*T - y;
  c.fillStyle = vgrad(c, y, y + h, ['#0e2b37', '#0a222d', '#06161f']); c.fillRect(x, y, w, h);
  // back wall plates and seams
  c.strokeStyle = 'rgba(120,170,185,.10)'; c.lineWidth = 2;
  for (let px = Math.ceil(x/128)*128; px < x + w; px += 128){ c.beginPath(); c.moveTo(px, y); c.lineTo(px, y + h); c.stroke(); for (let py = y + 24; py < y + h; py += 96) screw(c, px + 8, py); }
  for (let py = Math.ceil(y/96)*96; py < y + h; py += 96){ c.beginPath(); c.moveTo(x, py); c.lineTo(x + w, py); c.stroke(); }
  // a depth scale on the left wall
  c.fillStyle = 'rgba(150,200,210,.35)'; c.font = `600 9px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (let d = Math.ceil(y/T); d <= t.floor; d += 2){ c.fillRect(x + 4, d*T - 1, d % 4 ? 8 : 14, 2); if (d % 4 === 0 && d < t.floor) c.fillText(String(t.floor - d), x + 22, d*T); }
  // drain flange in the floor corner
  rr(c, x + w - 46, t.floor*T - 12, 36, 12, 3); c.fillStyle = '#1c3945'; c.fill(); c.strokeStyle = '#0a1a22'; c.lineWidth = 2; c.stroke();
}
function legs(c, s, floorY, inset){
  const x = s.x*T, w = s.w*T, y = (s.y + s.h)*T, b = floorY*T; if (b - y < 8) return;
  for (const lx of [x + (inset || 10), x + w - (inset || 10) - 12]){
    panel(c, lx, y, 12, b - y, '#5f7883', '#1d3440', 1); panel(c, lx - 7, b - 7, 26, 7, '#7f96a0', '#2a4552', 2); bolt(c, lx - 2, b - 3.5, 2); bolt(c, lx + 14, b - 3.5, 2);
  }
  if (w > 120 && b - y > 40){ line(c, x + 22, y + 4, x + w - 22, b - 8, '#2f4c59', 4); line(c, x + w - 22, y + 4, x + 22, b - 8, '#2f4c59', 4); }
}
function hangers(c, s, beamY){
  const x = s.x*T, w = s.w*T, y = s.y*T;
  panel(c, x - 58, beamY, w + 116, 14, '#4c6874', '#16303c', 2);
  for (let px = x - 50; px < x + w + 50; px += 22) screw(c, px, beamY + 7);
  for (const hx of [x + 8, x + w - 8]){ line(c, hx, beamY + 14, hx, y, '#0d202b', 7); line(c, hx - 1.5, beamY + 14, hx - 1.5, y, '#6f8d98', 1.5); panel(c, hx - 9, y - 6, 18, 8, '#8aa2ac', '#2c4855', 2); }
  // the beam is tied back to the building
  for (const bx of [x - 50, x + w + 38]){ line(c, bx + 6, beamY, bx + 6, beamY - 900, '#0d202b', 9); line(c, bx + 3, beamY, bx + 3, beamY - 900, '#51717a', 2); }
}
// Recessed workholding lives behind the cut passages. Its dark frame is deliberately unlike a playable deck.
function workholding(c, L, s){
  const tank = L.tanks.find(t => s.x >= t.x0 && s.x < t.x1); if (!tank) return;
  const x = s.x*T, y = s.y*T, w = s.w*T, bottom = tank.floor*T;
  c.save(); c.globalAlpha = .65;
  for (const px of [x + 18, x + w - 30]){
    panel(c, px, y + 10, 12, bottom - y - 10, '#284652', '#102631', 2);
    panel(c, px - 10, bottom - 8, 32, 8, '#486571', '#172e39', 2); bolt(c, px - 4, bottom - 4, 2); bolt(c, px + 17, bottom - 4, 2);
    line(c, px + 6, y + 30, px + 6, bottom - 10, '#526a72', 1);
  }
  line(c, x + 24, y + 26, x + w - 24, bottom - 12, '#294551', 6);
  line(c, x + w - 24, y + 26, x + 24, bottom - 12, '#294551', 6);
  c.restore();
}
function fixture(c, L, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T, tank = L.tanks.find(t => s.x + s.w/2 > t.x0 && s.x + s.w/2 < t.x1);
  if (s.style === 'table'){
    if (tank) legs(c, s, tank.floor, 12);
    rr(c, x, y, w, h, 4); fillInk(c, vgrad(c, y, y + h, ['#c9d6d9', '#8fa5ae', '#5d7782']), 2.5);
    // T-slots along the top, clamps on the ends
    c.fillStyle = '#23343d'; for (let px = x + 18; px < x + w - 14; px += 28) c.fillRect(px, y + 3, 10, 6);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 4, y + 2, w - 8, 2);
    c.strokeStyle = 'rgba(16,27,35,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, y + 14); c.lineTo(x + w - 3, y + 14); c.stroke();
    for (const cx of [x + 6, x + w - 26]){ rr(c, cx, y + 18, 20, Math.min(22, h - 22), 3); fillInk(c, '#3c5561', 2); bolt(c, cx + 10, y + 26, 2.4); }
    stripes(c, x + 2, y + h - 8, w - 4, 6, 7);
  } else if (s.style === 'work'){
    // a machined blank: brushed faces, bright cut edges, a few clamp marks
    c.fillStyle = hgrad(c, x, x + w, ['#7f8f98', '#a9b7bd', '#8c9aa2', '#b4c0c5', '#818f97']); c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = 'rgba(30,45,55,.13)'; c.lineWidth = 1; for (let py = y + 5; py < y + h; py += 5){ c.beginPath(); c.moveTo(x, py); c.lineTo(x + w, py + seeded(py)*2 - 1); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 8; for (let px = x - h; px < x + w; px += 150){ c.beginPath(); c.moveTo(px, y + h); c.lineTo(px + h*.6, y); c.stroke(); }
    c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(x, y, w, h);
    c.fillStyle = '#e9f3f4'; c.fillRect(x + 2, y + 2, w - 4, 3); c.fillRect(x + 2, y + h - 4, w - 4, 2);          // the cut faces catch the light
    // Toe clamps and threaded studs visibly join each blank to its recessed fixture frame.
    for (const cx of [x + 12, x + w - 34]) for (const cy of [y + 12, y + h - 28]){
      if (h < 48 && cy > y + h/2) continue;
      panel(c, cx, cy, 22, 15, '#7c887e', '#344b51', 2); bolt(c, cx + 8, cy + 7, 3);
      line(c, cx + 16, cy + 3, cx + 16, cy + 12, '#d2c095', 3);
    }
    if (w > 180 && h > 80){
      // Machining witness marks, inset from the real cut edges; never painted as a traversable hole.
      c.strokeStyle = 'rgba(33,62,72,.25)'; c.lineWidth = 2;
      for (let j = 0; j < 3; j++){ rr(c, x + 44 + j*4, y + 32 + j*4, w - 88 - j*8, h - 64 - j*8, 12); c.stroke(); }
      c.font = `600 9px ${FONT}`; c.fillStyle = '#425b63'; c.fillText('FIXTURE / ' + Math.round(s.x), x + 44, y + h - 20);
    }
  } else if (s.style === 'block'){
    if (tank) legs(c, s, tank.floor, 10);
    rr(c, x, y, w, h, 5); fillInk(c, vgrad(c, y, y + h, ['#aebbc1', '#7d8e97', '#5a6d77']), 2.5);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + 4, y + 2, w - 8, 2);
    for (const cx of [x + 8, x + w - 8]) for (let py = y + 12; py < y + h - 6; py += 30) bolt(c, cx, py, 2.4);
  } else if (s.style === 'wall' || s.style === 'baffle' || s.style === 'hang'){
    if (s.style === 'hang') hangers(c, s, y - 5.4*T);
    c.fillStyle = hgrad(c, x, x + w, ['#3c5561', '#6f8a95', '#4a6470', '#3c5561']); c.fillRect(x, y, w, h);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(x, y, w, h);
    for (let py = y + 14; py < y + h - 6; py += 34){ bolt(c, x + 8, py, 2.4); bolt(c, x + w - 8, py, 2.4); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 2, y + 2, w - 4, 2);
    if (s.style === 'baffle'){ panel(c, x - 8, y + h - 8, w + 16, 8, '#7f96a0', '#2a4552', 2); }
    if (s.style === 'wall'){ stripes(c, x, y, w, 8, 7); c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(x, y, w, 8); }
  } else if (s.style === 'weir'){
    // a weir: a tall plate bolted to the tank floor. Too high to climb; a full tank carries him over its lip.
    c.fillStyle = hgrad(c, x, x + w, ['#3c5561', '#7d97a1', '#4a6470', '#3c5561']); c.fillRect(x, y + 6, w, h - 6);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(x, y + 6, w, h - 6);
    rr(c, x - 5, y, w + 10, 12, 6); fillInk(c, vgrad(c, y, y + 12, ['#e6eef0', '#9fb4bc']), 2.5);
    for (let py = y + 30; py < y + h - 6; py += 34){ bolt(c, x + 8, py, 2.4); bolt(c, x + w - 8, py, 2.4); }
    panel(c, x - 10, y + h - 8, w + 20, 8, '#7f96a0', '#2a4552', 2);
    // the picture on its face: water over the top, and the way across
    const cx = x + w/2, cy = y + 44; rr(c, cx - 17, cy - 17, 34, 34, 7); fillInk(c, '#10222b', 2);
    c.strokeStyle = P.waterL; c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i <= 24; i += 4){ const yy = cy + 7 + Math.sin(i*.8)*2; i ? c.lineTo(cx - 12 + i, yy) : c.moveTo(cx - 12 + i, yy); } c.stroke();
    c.strokeStyle = P.warn; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy + 2, 9, Math.PI*1.1, Math.PI*1.9); c.stroke();
    c.fillStyle = P.warn; c.beginPath(); c.moveTo(cx + 12, cy + 1); c.lineTo(cx + 5, cy - 1); c.lineTo(cx + 10, cy - 7); c.closePath(); c.fill();
  } else if (s.style === 'vault'){
    // a vault: a stainless housing, riveted. Its door is drawn with the doors and opens only when the tank is drained.
    c.fillStyle = vgrad(c, y, y + h, ['#b9c8cd', '#8398a1', '#5a727d']); c.fillRect(x, y, w, h);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x + 3, y + 2, w - 6, 2);
    c.strokeStyle = 'rgba(16,27,35,.3)'; c.lineWidth = 2; for (let px = x + 64; px < x + w - 8; px += 64){ c.beginPath(); c.moveTo(px, y + 4); c.lineTo(px, y + h - 4); c.stroke(); }
    for (let px = x + 10; px < x + w; px += 32){ bolt(c, px, y + Math.min(10, h/2), 2.2); if (h > 40) bolt(c, px, y + h - 10, 2.2); }
    if (h > 60) stripes(c, x, y, w, 7, 7);
  } else if (s.style === 'glass'){
    c.fillStyle = 'rgba(120,215,225,.16)'; c.fillRect(x + 6, y, w - 12, h);
    c.fillStyle = 'rgba(230,250,255,.35)'; c.fillRect(x + 9, y, 3, h);
    panel(c, x, y, 6, h, '#5f7883', '#1d3440', 1); panel(c, x + w - 6, y, 6, h, '#5f7883', '#1d3440', 1);
    for (let py = Math.ceil(y/96)*96; py < y + h; py += 96) panel(c, x - 3, py, w + 6, 9, '#8aa2ac', '#2c4855', 2);
  } else if (s.style === 'column'){
    if (A.housing) A.housing(c, s); else { c.fillStyle = C.steel; c.fillRect(x, y, w, h); }
    panel(c, x - 6, y - 4, w + 12, 10, '#8aa2ac', '#2c4855', 2);
  }
}
function rim(c, x, y, dir){                      // a tank's edge: chevrons on the lip and down the wall
  stripes(c, dir > 0 ? x - 30 : x, y, 30, 8, 6); c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(dir > 0 ? x - 30 : x, y, 30, 8);
}
A2.drawStatic = function(c, L, x0, x1){
  const inR = (a, b) => b*T > x0 - 160 && a*T < x1 + 160;
  for (const t of L.tanks) if (!t.boss && inR(t.x0, t.x1)) tankInterior(c, L, t);
  // overhead service beam that the shelves' rods and the windows hang from is part of the backdrop; terrain next
  const plain = { solids:L.solids.filter(s => s.kind === 'floor' || s.kind === 'roof'), pits:[], pads:[], decor:[], H:L.H };
  A.drawStatic(c, plain, x0, x1);
  for (const t of L.tanks) if (inR(t.x0, t.x1)){
    const left = L.solids.find(s => s.kind === 'floor' && Math.abs(s.x + s.w - t.x0) < .01 && s.y < t.floor), right = L.solids.find(s => s.kind === 'floor' && Math.abs(s.x - t.x1) < .01 && s.y < t.floor);
    if (left) rim(c, t.x0*T, left.y*T, 1); if (right) rim(c, t.x1*T, right.y*T, -1);
  }
  for (const s of L.fixtures) if (s.style === 'work' && inR(s.x - 2, s.x + s.w + 2)) workholding(c, L, s);
  for (const s of L.fixtures) if (inR(s.x - 2, s.x + s.w + 2)) fixture(c, L, s);
  for (const s of L.solids) if (s.kind === 'shelf' && inR(s.x, s.x + s.w)){
    const tank = L.tanks.find(t => s.x + s.w/2 > t.x0 && s.x + s.w/2 < t.x1 && s.y <= t.floor);
    if (tank && s.y > 12.4){                      // a grating inside a tank stands on posts from the tank floor
      for (const px of [s.x*T + 8, (s.x + s.w)*T - 14]){ const under = L.solids.filter(o => o !== s && o.kind !== 'shelf' && px/T >= o.x && px/T <= o.x + o.w && o.y > s.y).sort((a, b) => a.y - b.y)[0];
        const b = (under ? under.y : tank.floor)*T; panel(c, px, s.y*T + 10, 6, b - s.y*T - 10, '#4f6b77', '#1a303b', 1); }
    }
    A.drawShelf(c, s);
  }
  for (const p of L.scenery) if (inR(p.x - 6, p.x + 8)){
    if (p.type === 'window') A.viewWindow(c, [p.x, p.y, p.w, p.h], () => insideWindow(c, p));
  }
  if (x0 < 64){ c.fillStyle = C.steelD; c.fillRect(-40, -12*T, 40, 24*T); c.fillStyle = C.steelL; c.fillRect(-4, -12*T, 4, 24*T); }
};
// Through the inspection window: the first tank and a wire guide, small and far away.
function insideWindow(c, p){
  const x = p.x*T, y = p.y*T, w = p.w*T, h = p.h*T;
  c.fillStyle = 'rgba(40,160,170,.35)'; c.fillRect(x, y + h*.62, w, h*.38); line(c, x, y + h*.62, x + w, y + h*.62, P.waterL, 2);
  panel(c, x + w*.12, y + h*.16, w*.76, 8, '#4c6874', '#16303c', 2); panel(c, x + w*.5, y + h*.16 + 8, 26, 22, '#9fb4bc', '#4a6470', 3);
  line(c, x + w*.5 + 13, y + h*.16 + 30, x + w*.5 + 13, y + h, P.cut, 1.5);
  panel(c, x + w*.2, y + h*.74, w*.5, 14, '#8fa5ae', '#4a6470', 2);
}

// ---------- doors ----------
A2.door = function(c, d, lift, t){
  const X = d.x*T, F = d.top*T, H = d.h*T, W = d.w*T, up = lift*(d.h - .35)*T;
  c.fillStyle = C.steelD; c.fillRect(X - 8, F - 12, W + 16, H + 12); c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(X - 8, F - 12, W + 16, 12);
  c.fillStyle = '#10161D'; c.fillRect(X, F, W, H);
  c.save(); c.beginPath(); c.rect(X - 1, F, W + 2, H); c.clip();
  const Y = F - up;
  c.fillStyle = vgrad(c, Y, Y + H, [C.steelL, C.steel]); c.fillRect(X, Y, W, H);
  c.strokeStyle = 'rgba(20,20,22,.35)'; c.lineWidth = 2; for (let y = Y + 10; y < Y + H; y += 10){ c.beginPath(); c.moveTo(X, y); c.lineTo(X + W, y); c.stroke(); }
  c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(X, Y, W, H);
  stripes(c, X, Y + H - 10, W, 10, 6);
  c.restore();
  lampDot(c, X + W/2, F - 6, lift > .5 ? P.green : P.red, true, 4);
};

// ---------- valves ----------
// A handwheel on a pedestal, with the two tanks' arrows above it: which goes up, which goes down.
A2.valve = function(c, L, v, state, wheel, turning, t, near){
  const x = wheel[0]*T, y = wheel[1]*T, spin = turning > 0 ? (1 - turning/.6)*TAU*.75*(state ? 1 : -1) : 0;
  // pedestal down to whatever is beneath, and the pipe it controls
  const under = L.solids.filter(s => wheel[0] >= s.x && wheel[0] <= s.x + s.w && s.y >= wheel[1]).sort((a, b) => a.y - b.y)[0];
  const foot = under ? under.y*T : y + 60;
  panel(c, x - 7, y + 10, 14, foot - y - 10, '#7d95a0', '#2a4552', 2); panel(c, x - 15, foot - 8, 30, 8, '#8aa2ac', '#2c4855', 2);
  panel(c, x - 20, y - 22, 40, 44, '#9fb4bc', '#4a6470', 6);
  c.save(); c.translate(x, y); c.rotate(spin);
  c.lineWidth = 6; c.strokeStyle = C.ink; circ(c, 0, 0, 17); c.stroke(); c.lineWidth = 3.5; c.strokeStyle = P.warn; c.stroke();
  for (let i = 0; i < 4; i++){ const a = i*Math.PI/2 + .4; line(c, 0, 0, Math.cos(a)*16, Math.sin(a)*16, C.ink, 5); line(c, 0, 0, Math.cos(a)*16, Math.sin(a)*16, P.warn, 2.5); }
  circ(c, 0, 0, 5); fillInk(c, '#3c5561', 2);
  c.restore();
  // the tanks this wheel moves, as arrows: up = filling, down = draining
  const ids = Object.keys(v.states[state]); ids.forEach((id, i) => {
    const tank = L.tanks.find(k => k.id === id), lv = tank.levels[v.states[state][id]], other = tank.levels[v.states[1 - state][id]], up = lv < other;
    const ax = x + (ids.length > 1 ? (tank.x0 + tank.x1)/2 < wheel[0] ? -12 : 12 : 0) + (ids.length > 1 && Math.abs((tank.x0 + tank.x1)/2 - wheel[0]) < 1 ? (i ? 12 : -12) : 0), ay = y - 36;
    rr(c, ax - 10, ay - 12, 20, 24, 5); fillInk(c, '#16242c', 2);
    c.fillStyle = up ? P.waterL : P.warn; c.beginPath();
    if (up){ c.moveTo(ax, ay - 8); c.lineTo(ax + 6, ay + 1); c.lineTo(ax + 2.5, ay + 1); c.lineTo(ax + 2.5, ay + 8); c.lineTo(ax - 2.5, ay + 8); c.lineTo(ax - 2.5, ay + 1); c.lineTo(ax - 6, ay + 1); }
    else { c.moveTo(ax, ay + 8); c.lineTo(ax + 6, ay - 1); c.lineTo(ax + 2.5, ay - 1); c.lineTo(ax + 2.5, ay - 8); c.lineTo(ax - 2.5, ay - 8); c.lineTo(ax - 2.5, ay - 1); c.lineTo(ax - 6, ay - 1); }
    c.closePath(); c.fill();
  });
  if (near){ const p = 1 + .08*Math.sin(t*9); c.save(); c.translate(x, y - 66); c.scale(p, p); A2.prompt(c, 'fix'); c.restore(); }
};
// What to press, as a keycap or the touch button's glyph. Never a sentence.
A2.prompt = function(c, kind, touch){
  touch = touch === undefined ? document.body.classList.contains('touch') : touch;
  if (kind === 'hold'){
    const text = touch ? 'Hold to fix' : 'Hold E to fix';
    c.font = `700 14px ${FONT}`; const w = c.measureText(text).width + 24;
    rr(c, -w/2, -16, w, 32, 8); c.fillStyle = '#082435'; c.fill(); c.strokeStyle = P.warn; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 0); return;
  }
  rr(c, -19, -17, 38, 34, 9); c.fillStyle = 'rgba(0,44,90,.92)'; c.fill(); c.strokeStyle = P.warn; c.lineWidth = 2.5; c.stroke();
  if (touch || kind !== 'fix'){ c.strokeStyle = C.white; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-7, 7); c.lineTo(5, -5); c.stroke(); circ(c, 7, -7, 5); c.lineWidth = 3; c.stroke(); }
  else { c.fillStyle = C.white; c.font = `900 18px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('E', 0, 1); }
};
// A float gauge on the tank wall: where the water is, and where it is going.
A2.gauge = function(c, tank, w){
  const x = tank.x0*T + 40, lo = Math.max(...Object.values(tank.levels)), hi = Math.min(...Object.values(tank.levels)); if (lo === hi) return;
  const y0 = (hi - .6)*T, y1 = (lo + .6)*T;
  rr(c, x - 7, y0, 14, y1 - y0, 6); c.fillStyle = 'rgba(8,24,32,.8)'; c.fill(); c.strokeStyle = '#6f8d98'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(109,224,221,.45)'; c.fillRect(x - 4, w.level*T, 8, y1 - w.level*T - 3);
  for (const lv of [lo, hi]){ c.fillStyle = lv === w.target ? P.warn : '#47626d'; c.fillRect(x - 12, lv*T - 1.5, 24, 3); }
  rr(c, x - 9, w.level*T - 5, 18, 10, 3); fillInk(c, w.level === w.target ? P.safe : P.warn, 1.5);
};

// ---------- wires and their guides ----------
A2.wire = function(c, L, w, p, t, slow){
  c.save();
  const glow = p.active ? P.cut : p.tell ? P.warn : '#6f9aa2';
  if (p.axis === 'v'){
    const x = p.x*T, y0 = p.y0*T, y1 = p.y1*T, railY = y0 - 46, xa = Math.min(w.from[0], w.to[0])*T - 40, xb = Math.max(w.from[0], w.to[0])*T + 40;
    // the rail, hung from the roof on rods, with limit stops
    for (const rx of [xa + 10, xb - 10]){ line(c, rx, railY, rx, railY - 900, '#0d202b', 8); line(c, rx - 2, railY, rx - 2, railY - 900, '#51717a', 2); panel(c, rx - 10, railY - 6, 20, 10, '#8aa2ac', '#2c4855', 2); }
    panel(c, xa, railY, xb - xa, 12, '#6b858f', '#1d3440', 2); for (let px = xa + 12; px < xb; px += 26) screw(c, px, railY + 6);
    stripes(c, xa, railY + 12, 14, 5, 5); stripes(c, xb - 14, railY + 12, 14, 5, 5);
    // cable chain sagging from the fixed end to the carriage
    c.beginPath(); c.moveTo(xa + 16, railY + 14); c.quadraticCurveTo((xa + x)/2, railY + 44 + (x - xa)*.05, x - 18, railY + 22); c.strokeStyle = '#0d202b'; c.lineWidth = 7; c.stroke(); c.setLineDash([5, 4]); c.strokeStyle = '#47626d'; c.lineWidth = 3; c.stroke(); c.setLineDash([]);
    // carriage, motor fins, guide block and nozzle
    rr(c, x - 27, railY + 8, 54, 30, 6); fillInk(c, vgrad(c, railY + 8, railY + 38, [C.steelXL, C.steelL, '#8fa0a8']), 2.5);
    c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 2; for (let fx = x - 20; fx <= x + 20; fx += 6){ c.beginPath(); c.moveTo(fx, railY + 13); c.lineTo(fx, railY + 25); c.stroke(); }
    c.fillStyle = P.warn; c.fillRect(x - 25, railY + 31, 50, 4);
    signal(c, x, railY - 12, p.state, t);
    c.beginPath(); c.moveTo(x - 12, railY + 38); c.lineTo(x + 12, railY + 38); c.lineTo(x + 5, y0 + 2); c.lineTo(x - 5, y0 + 2); c.closePath(); fillInk(c, '#9fb0b7', 2);
    // lower guide on its floor track
    panel(c, xa + 14, y1 + 3, xb - xa - 28, 6, '#47626d', '#16303c', 1);
    c.beginPath(); c.moveTo(x - 12, y1 + 9); c.lineTo(x + 12, y1 + 9); c.lineTo(x + 5, y1 - 3); c.lineTo(x - 5, y1 - 3); c.closePath(); fillInk(c, '#9fb0b7', 2);
    wireLine(c, x, y0 + 2, x, y1 - 3, p, t, w.slot && [x, w.slot[0]*T, x, w.slot[1]*T]);
  } else {
    const y = p.y*T, x0 = p.x0*T, x1 = p.x1*T, ya = Math.min(w.from[1], w.to[1])*T - 30, yb = Math.max(w.from[1], w.to[1])*T + 30;
    for (const [rx, dir] of [[x0, 1], [x1, -1]]){
      // an upright rail bolted to the wall, a guide block riding it
      panel(c, rx - (dir > 0 ? 0 : 9), ya, 9, yb - ya, '#6b858f', '#1d3440', 2); for (let py = ya + 12; py < yb; py += 28) screw(c, rx + dir*4.5, py);
      stripes(c, rx - (dir > 0 ? 0 : 9), ya, 9, 8, 5); stripes(c, rx - (dir > 0 ? 0 : 9), yb - 8, 9, 8, 5);
      rr(c, rx + (dir > 0 ? 2 : -30), y - 13, 28, 26, 5); fillInk(c, vgrad(c, y - 13, y + 13, [C.steelXL, C.steelL, '#8fa0a8']), 2.5);
      c.fillStyle = P.warn; c.fillRect(rx + (dir > 0 ? 4 : -28), y + 7, 24, 3);
      c.beginPath(); c.moveTo(rx + dir*30, y - 7); c.lineTo(rx + dir*42, y - 2.5); c.lineTo(rx + dir*42, y + 2.5); c.lineTo(rx + dir*30, y + 7); c.closePath(); fillInk(c, '#9fb0b7', 2);
    }
    signal(c, x0 + 40, ya - 14, p.state, t);
    wireLine(c, x0 + 42, y, x1 - 42, y, p, t);
  }
  c.restore();
};
function wireLine(c, x0, y0, x1, y1, p, t, slot){
  const seg = (a, b, c2, d) => { c.beginPath(); c.moveTo(a, b); c.lineTo(c2, d); c.stroke(); };
  const draw = () => { if (slot){ seg(x0, y0, slot[0], Math.min(slot[1], y1)); seg(slot[2], Math.min(slot[3], y1), x1, y1); } else seg(x0, y0, x1, y1); };
  c.lineCap = 'round';
  if (p.active){
    c.strokeStyle = 'rgba(227,251,242,.22)'; c.lineWidth = 9; draw(); c.strokeStyle = 'rgba(255,196,106,.5)'; c.lineWidth = 4.5; draw(); c.strokeStyle = P.cut; c.lineWidth = 2; draw();
    // the cutting gap: small sparks that stay on the wire
    for (let i = 0; i < 5; i++){ const u = seeded(i*7.3 + Math.floor(t*14)), sx = x0 + (x1 - x0)*u, sy = y0 + (y1 - y0)*u, a = seeded(i + t*3)*TAU; line(c, sx, sy, sx + Math.cos(a)*7, sy + Math.sin(a)*7, '#fff', 1.2); }
  } else if (p.tell){
    c.strokeStyle = '#8fb3b9'; c.lineWidth = 1.5; draw();
    c.setLineDash([7, 7]); c.lineDashOffset = -t*30; c.strokeStyle = P.warn; c.lineWidth = 3; const nx = y1 === y0 ? 0 : 7, ny = y1 === y0 ? 7 : 0;
    seg(x0 - nx, y0 - ny, x1 - nx, y1 - ny); seg(x0 + nx, y0 + ny, x1 + nx, y1 + ny); c.setLineDash([]);
  } else { c.strokeStyle = 'rgba(143,179,185,.75)'; c.lineWidth = 1.5; draw(); }
}

// ---------- flushing nozzles ----------
A2.nozzle = function(c, L, n, p, t){
  const x = n.at[0]*T, y = n.at[1]*T, [dx, dy] = n.dir, ang = Math.atan2(dy, dx);
  c.save(); c.translate(x, y); c.rotate(ang);
  // segmented hose back to a coupling on whatever the nozzle is mounted on
  for (let i = 0; i < 4; i++){ rr(c, -34 + i*8, -6 + Math.sin(i*1.3)*1.5, 9, 12, 3); fillInk(c, i % 2 ? '#2B2F33' : '#3d444a', 1.5); }
  panel(c, -46, -10, 14, 20, '#8aa2ac', '#2c4855', 3);
  c.beginPath(); c.moveTo(-3, -8); c.lineTo(12, -4.5); c.lineTo(12, 4.5); c.lineTo(-3, 8); c.closePath(); fillInk(c, C.steelL, 2);
  c.fillStyle = P.warn; c.fillRect(-1, -7, 3, 14);
  c.restore();
  // lamp beside the tip, square to the world so it always reads
  signal(c, x - dy*30 + dx*-2, y + dx*-26 + (dx ? 0 : dy*6), p.state, t);
};
A2.jet = function(c, n, p, t){
  if (!p.tell && !p.active) return;
  const x = n.at[0]*T, y = n.at[1]*T, [dx, dy] = n.dir, ang = Math.atan2(dy, dx), len = n.reach*T;
  c.save(); c.translate(x, y); c.rotate(ang);
  if (p.tell){                                     // rising bubbles at the tip: the stream is coming
    for (let i = 0; i < 7; i++){ const u = (t*1.6 + i/7) % 1; circ(c, 14 + u*46, Math.sin(i*2.1 + t*5)*6*u, 1.5 + 2.5*u); c.strokeStyle = `rgba(255,224,160,${.8*(1 - u)})`; c.lineWidth = 1.5; c.stroke(); }
  } else {
    const L = p.reach*T, start = p.start*T, a = p.fade, g = c.createLinearGradient(start, 0, start + Math.max(.001, L), 0);
    g.addColorStop(0, `rgba(240,255,252,${.9*a})`); g.addColorStop(.7, `rgba(190,240,240,${.55*a})`); g.addColorStop(1, 'rgba(190,240,240,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(start, -4); c.lineTo(start + L, -12); c.lineTo(start + L, 12); c.lineTo(start, 4); c.closePath(); c.fill();
    c.strokeStyle = `rgba(255,255,255,${.7*a})`; c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++){ const u = (t*3.2 + i/6) % 1, yy = (seeded(i) - .5)*14; line(c, start + u*L*.85, yy*u, start + Math.min(L, u*L*.85 + 22), yy*(u + .08), `rgba(255,255,255,${.6*a*(1 - u)})`, 1.5); }
  }
  c.restore();
};

// ---------- pump intakes ----------
A2.intake = function(c, L, i, p, t){
  const x = i.at[0]*T, y = i.at[1]*T;
  rr(c, x - 30, y - 8, 60, 16, 5); fillInk(c, '#31474f', 2.5);
  c.strokeStyle = '#9fb4bc'; c.lineWidth = 3; for (let gx = x - 22; gx <= x + 22; gx += 8.8){ c.beginPath(); c.moveTo(gx, y - 6); c.lineTo(gx, y + 6); c.stroke(); }
  bolt(c, x - 26, y, 2.2); bolt(c, x + 26, y, 2.2);
  signal(c, x, y - 22, p.state, t);
  if (p.tell || p.active){
    const [zx, zy, zw, zh] = i.zone, a = p.active ? .55 : .25;
    c.save(); c.beginPath(); c.rect(zx*T, zy*T, zw*T, zh*T); c.clip();
    for (let k = 0; k < 9; k++){                   // flow lines drawn in toward the grille
      const u = (t*(p.active ? 1.1 : .5) + k/9) % 1, ang = Math.PI + (k/8)*Math.PI + Math.sin(k*3.7)*.2, r = (1 - u)*zw*T*.55 + 18;
      const sx = x + Math.cos(ang)*r, sy = y + Math.sin(ang)*r*.75, ex = x + Math.cos(ang + .25)*(r - 26), ey = y + Math.sin(ang + .25)*(r - 26)*.75;
      c.strokeStyle = `rgba(200,245,245,${a*u})`; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + ex)/2 + 6, (sy + ey)/2, ex, ey); c.stroke();
    }
    c.restore();
  }
};

// ---------- earthing bells: trapped air, and a copper bar that takes the suit's charge ----------
A2.pocket = function(c, p, t){
  const x = p.x*T, y = p.y*T, w = p.w*T, h = p.h*T;
  c.fillStyle = 'rgba(200,240,240,.10)'; rr(c, x, y, w, h, 8); c.fill();
  // a bell's skirt either side, and its lamp: air here
  panel(c, x - 5, y, 7, h + 8, '#8aa2ac', '#2c4855', 2); panel(c, x + w - 2, y, 7, h + 8, '#8aa2ac', '#2c4855', 2);
  // the earth bar across the top of the air, its strap hanging in reach, and the earth sign on the hood
  const cu = '#d08a4a'; rr(c, x + 10, y + 3, w - 20, 5, 2); c.fillStyle = cu; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.stroke();
  for (const sx of [x + w*.3, x + w*.7]){ c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, y + 8); c.quadraticCurveTo(sx + Math.sin(t*2 + sx)*3, y + h*.5, sx, y + h*.8); c.stroke(); c.strokeStyle = cu; c.lineWidth = 2; c.stroke(); }
  const ex = x + w/2, ey = y - 15; rr(c, ex - 14, ey - 13, 28, 26, 6); fillInk(c, '#10222b', 2);
  c.strokeStyle = P.safe; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex, ey - 8); c.lineTo(ex, ey - 1); c.moveTo(ex - 9, ey - 1); c.lineTo(ex + 9, ey - 1); c.moveTo(ex - 6, ey + 3.5); c.lineTo(ex + 6, ey + 3.5); c.moveTo(ex - 3, ey + 8); c.lineTo(ex + 3, ey + 8); c.stroke();
  c.strokeStyle = 'rgba(210,250,250,.8)'; c.lineWidth = 2; c.beginPath();
  for (let px = 0; px <= w; px += 8){ const yy = y + h + Math.sin(px*.09 + t*2.2)*1.6; px ? c.lineTo(x + px, yy) : c.moveTo(x + px, yy); } c.stroke();
};

// ---------- water: bounded by its tank, never a fog over the whole screen ----------
A2.water = function(c, L, S, tank, t, low, x0, x1){
  const w = S.tanks[tank.id], X = Math.max(tank.x0*T, x0 - 40), X1 = Math.min(tank.x1*T, x1 + 40); if (X1 <= X) return;
  const y = w.level*T, b = tank.floor*T; if (b - y < 2) return;
  c.save(); c.beginPath(); c.rect(X, y - 3, X1 - X, b - y + 3);
  for (const p of tank.pockets) if (w.level < p.y + p.h) c.rect(p.x*T, p.y*T, p.w*T, p.h*T);          // trapped air is not water
  c.clip('evenodd');
  c.fillStyle = vgrad(c, y, Math.max(y + 60, b), ['rgba(31,172,176,.20)', 'rgba(12,96,112,.40)', 'rgba(5,58,76,.56)']); c.fillRect(X, y, X1 - X, b - y);
  if (!low){
    // slow bands of light, and a few bubbles
    for (let k = 0; k < 3; k++){ const bx = ((k*420 + t*14*(k + 1)) % (X1 - X + 300)) + X - 150; c.fillStyle = 'rgba(160,240,235,.045)'; c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + 70, y); c.lineTo(bx - 40, b); c.lineTo(bx - 130, b); c.fill(); }
    const n = Math.floor((X1 - X)/70);
    for (let i = 0; i < n; i++){ const gx = Math.floor(X/70) + i, bx = gx*70 + seeded(gx)*60, life = (t*(.12 + seeded(gx + 9)*.1) + seeded(gx + 3)) % 1, by = b - life*(b - y);
      circ(c, bx + Math.sin(life*9 + gx)*5, by, 1.5 + seeded(gx + 5)*2.5); c.strokeStyle = `rgba(190,245,240,${.32*(1 - life)})`; c.lineWidth = 1; c.stroke(); }
  }
  c.restore();
  // the surface: the true mean level, with a ripple that is only drawn
  c.save(); c.beginPath(); c.rect(X, y - 6, X1 - X, 12); c.clip();
  c.strokeStyle = P.waterL; c.lineWidth = 2.5; c.beginPath();
  for (let px = X; px <= X1; px += 10){ const yy = y + Math.sin(px*.045 + t*1.8)*1.3; px === X ? c.moveTo(px, yy) : c.lineTo(px, yy); } c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath();
  for (let px = X; px <= X1; px += 10){ const yy = y + 3 + Math.sin(px*.06 - t*1.3)*1.2; px === X ? c.moveTo(px, yy) : c.lineTo(px, yy); } c.stroke();
  c.restore();
  if (w.level !== w.target){                       // moving water: arrows on both walls
    const up = w.target < w.level; c.fillStyle = up ? P.waterL : P.warn;
    for (const ax of [tank.x0*T + 18, tank.x1*T - 18]) for (let k = 0; k < 3; k++){ const ay = y + (up ? -14 - k*11 : 14 + k*11) + Math.sin(t*6 + k)*2; c.globalAlpha = 1 - k*.3; c.beginPath(); c.moveTo(ax, ay + (up ? -6 : 6)); c.lineTo(ax + 7, ay + (up ? 3 : -3)); c.lineTo(ax - 7, ay + (up ? 3 : -3)); c.closePath(); c.fill(); }
    c.globalAlpha = 1;
  }
};

// ---------- the suit: laid behind and over the puppet, following its pose; Mike's head and lock-up stay clear ----------
const FOOT = [316, 942], HIP = [315, 648], NECK = [315, 385], LEG = { legL:[287, 648], legR:[343, 648] }, ANKLE = { legL:[274, 872], legR:[356, 872] };
function poseSpace(c, pose, x, y, px){
  const k = px/M.puppet.HEIGHT; c.translate(x, y); c.scale(k, k); c.translate(-FOOT[0], -FOOT[1] + (pose.bob || 0));
  if (pose.tilt){ c.translate(HIP[0], HIP[1]); c.rotate(pose.tilt*Math.PI/180); c.translate(-HIP[0], -HIP[1]); }
}
A2.suitBack = function(c, pose, x, y, px){
  c.save(); poseSpace(c, pose, x, y, px); c.lineJoin = 'round';
  for (const bx of [212, 382]){ rr(c, bx, 400, 40, 236, 20); c.fillStyle = hgrad(c, bx, bx + 40, ['#93a7af', '#e2edef', '#7f949d']); c.fill(); c.lineWidth = 7; c.strokeStyle = C.ink; c.stroke(); rr(c, bx + 8, 386, 24, 22, 8); c.fillStyle = '#3c5561'; c.fill(); c.stroke(); }
  rr(c, 236, 410, 162, 222, 26); c.fillStyle = vgrad(c, 410, 632, ['#f0b455', '#d99a3c', '#b57a26']); c.fill(); c.lineWidth = 7; c.strokeStyle = C.ink; c.stroke();
  c.restore();
};
A2.suitFront = function(c, pose, x, y, px, o){
  o = o || {};
  c.save(); poseSpace(c, pose, x, y, px); c.lineJoin = 'round'; c.lineCap = 'round';
  // harness: two straps and a buckle across the body
  c.strokeStyle = C.ink; c.lineWidth = 26; c.beginPath(); c.moveTo(262, 418); c.lineTo(366, 600); c.moveTo(372, 418); c.lineTo(268, 600); c.stroke();
  c.strokeStyle = '#e0a447'; c.lineWidth = 16; c.beginPath(); c.moveTo(262, 418); c.lineTo(366, 600); c.moveTo(372, 418); c.lineTo(268, 600); c.stroke();
  rr(c, 292, 486, 50, 44, 9); c.fillStyle = '#d3e3e5'; c.fill(); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke();
  circ(c, 317, 508, 9); c.fillStyle = o.low ? '#E8503A' : '#35C06A'; c.fill();
  // ankle cuffs ride the legs
  for (const leg of ['legL', 'legR']){ c.save(); const [px_, py] = LEG[leg], a = pose[leg] || 0; c.translate(px_, py); c.rotate(a*Math.PI/180); c.translate(-px_, -py);
    rr(c, ANKLE[leg][0] - 19, ANKLE[leg][1] - 12, 38, 22, 8); c.fillStyle = '#e0a447'; c.fill(); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke(); c.restore(); }
  // collar ring, the earthing strap off its side, and the clear helmet, turning with the head
  c.translate(NECK[0], NECK[1]); c.rotate((pose.head || 0)*Math.PI/180); c.translate(-NECK[0], -NECK[1]);
  rr(c, 232, 384, 170, 34, 15); c.fillStyle = hgrad(c, 232, 402, ['#93a7af', '#e2edef', '#7f949d']); c.fill(); c.lineWidth = 7; c.strokeStyle = C.ink; c.stroke();
  c.fillStyle = '#e0a447'; c.fillRect(244, 397, 146, 8);
  c.strokeStyle = C.ink; c.lineWidth = 15; c.beginPath(); c.moveTo(398, 402); c.quadraticCurveTo(452, 410, 446, 470); c.stroke(); c.strokeStyle = '#d08a4a'; c.lineWidth = 8; c.stroke(); circ(c, 446, 474, 11); c.fillStyle = '#d08a4a'; c.fill(); c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke();
  rr(c, 108, 2, 418, 410, 118); c.fillStyle = 'rgba(200,245,250,.07)'; c.fill();
  c.lineWidth = 11; c.strokeStyle = 'rgba(16,27,35,.55)'; c.stroke(); c.lineWidth = 6; c.strokeStyle = 'rgba(205,246,240,.95)'; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 9; c.beginPath(); c.arc(226, 120, 96, Math.PI*1.02, Math.PI*1.38); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.arc(226, 120, 72, Math.PI*1.08, Math.PI*1.25); c.stroke();
  c.restore();
};
// Static on the suit: short arcs that jump about him, more of them and brighter as the charge builds.
A2.crackle = function(c, x, y, level, t){
  const n = Math.round(1 + level*5), a = Math.min(1, .35 + level*.75);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < n; i++){
    const k = Math.floor(t*(9 + level*8)) + i*17, ang = seeded(k)*TAU, r0 = 17 + seeded(k + 1)*10, len = 7 + seeded(k + 2)*9*(.6 + level), cx = x + Math.cos(ang)*r0, cy = y - 33 + Math.sin(ang)*r0*1.35;
    if (seeded(k + 3) > .45 + level*.4) continue;
    c.beginPath(); c.moveTo(cx, cy);
    for (let j = 1; j <= 3; j++) c.lineTo(cx + Math.cos(ang)*len*j/3 + (seeded(k + 4 + j) - .5)*7, cy + Math.sin(ang)*len*j/3 + (seeded(k + 8 + j) - .5)*7);
    c.strokeStyle = `rgba(150,225,255,${.45*a})`; c.lineWidth = 3.5; c.stroke(); c.strokeStyle = `rgba(245,253,255,${a})`; c.lineWidth = 1.3; c.stroke();
  }
  c.restore();
};
// Swimming poses, made only of the puppet's own joints. dir: -1 rising, 1 diving, 0 level. p: stroke phase.
A2.swimPose = function(p, vx, vy, facing, hit){
  const o = Object.assign({}, M.puppet.REST), s = Math.sin(p), lean = Math.max(-1, Math.min(1, vx/3.8)), up = Math.max(-1, Math.min(1, vy/3));
  o.tilt = lean*32 + (hit ? 10*hit : 0);
  o.legL = 14*s + lean*10; o.legR = -14*s + lean*10; o.footL = 18 + 8*s; o.footR = 18 - 8*s;          // a flutter kick, toes pointed
  o.armL_upper = -75 + 38 + 24*Math.sin(p + 1) - up*30; o.armL_lower = -15 + 10*Math.sin(p + 2);
  o.armR_upper = -38 - 24*Math.sin(p + 1) + up*30; o.armR_lower = -10*Math.sin(p + 2);
  o.head = lean*5 - up*4; o.bob = Math.sin(p*.5)*6;
  return o;
};
A2.suitRack = function(c, x, y, taken, t){
  const X = x*T, Y = y*T;
  panel(c, X - 40, Y - 118, 80, 8, '#8aa2ac', '#2c4855', 2); for (const px of [X - 34, X + 28]) panel(c, px, Y - 110, 6, 110, '#5f7883', '#1d3440', 1);
  panel(c, X - 46, Y - 6, 92, 6, '#7f96a0', '#2a4552', 2);
  line(c, X - 30, Y - 60, X + 30, Y - 60, '#2f4c59', 3);
  if (!taken){
    const bob = Math.sin(t*2.4)*2;
    c.save(); c.translate(X, Y - 62 + bob);
    circ(c, 0, 0, 34); c.fillStyle = 'rgba(255,196,106,.13)'; c.fill(); c.strokeStyle = P.warn; c.lineWidth = 2.5; circ(c, 0, 0, 34 + Math.sin(t*5)*2.5); c.stroke();
    rr(c, -15, -8, 30, 40, 8); fillInk(c, vgrad(c, -8, 32, ['#f0b455', '#b57a26']), 2.5);
    rr(c, -22, -34, 44, 40, 14); c.fillStyle = 'rgba(200,245,250,.18)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(205,246,240,.95)'; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(-6, -18, 12, Math.PI*1.05, Math.PI*1.4); c.stroke();
    c.restore();
  } else { line(c, X, Y - 110, X, Y - 84, '#2f4c59', 3); c.beginPath(); c.arc(X, Y - 78, 6, 0, Math.PI); c.strokeStyle = '#8aa2ac'; c.lineWidth = 3; c.stroke(); }
};

// ---------- signs: the controls, as pictures ----------
A2.sign = function(c, g, touch, t){
  const items = g.kind === 'move' ? [A.KEYS.run, A.KEYS.jump] : [];
  const x = g.x*T, y = g.y*T; c.save();
  if (g.kind === 'move'){
    c.globalAlpha = 0; const w = A.controlsRow(c, 0, -999, items, touch, 30) + 36; c.globalAlpha = 1;
    board(c, x - w/2, y, w, 50); A.controlsRow(c, x - w/2 + 22, y + 25, items, touch, 30);
  } else if (g.kind === 'swim'){
    // a picture of Mike's visor rising on one key and sinking on the other
    const w = 236; board(c, x - w/2, y, w, 58);
    key(c, x - w/2 + 26, y + 29, touch ? '↑' : 'Space', touch); arrow(c, x - w/2 + (touch ? 74 : 112), y + 29, -1);
    key(c, x + 18, y + 29, '↓', touch); arrow(c, x + 66, y + 29, 1);
  }
  c.restore();
};
function board(c, x, y, w, h){
  c.strokeStyle = '#012347'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 24, y - 900); c.lineTo(x + 24, y); c.moveTo(x + w - 24, y - 900); c.lineTo(x + w - 24, y); c.stroke();
  rr(c, x, y, w, h, 10); c.fillStyle = C.white; c.fill(); c.lineWidth = 3; c.strokeStyle = C.navy; c.stroke(); c.fillStyle = C.red; rr(c, x, y, 10, h, 5); c.fill();
}
function key(c, x, y, label, touch){
  c.font = `700 15px ${FONT}`; const w = touch ? 32 : Math.max(30, c.measureText(label).width + 16);
  if (touch){ circ(c, x + 16, y, 16); c.fillStyle = C.navy; c.fill(); c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + 16, y); return; }
  rr(c, x, y - 12, w, 30, 7); c.fillStyle = '#9AA3AD'; c.fill(); rr(c, x, y - 15, w, 27, 7); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.navy; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w/2, y - 1);
}
function arrow(c, x, y, dir){
  c.save(); c.translate(x, y); rr(c, -11, -13, 22, 22, 8); c.fillStyle = 'rgba(15,87,155,.15)'; c.fill(); c.strokeStyle = C.navy; c.lineWidth = 2; c.stroke();
  line(c, -16, 14, 16, 14, '#1FACB0', 3);
  c.fillStyle = C.navy; c.beginPath(); c.moveTo(22, dir*10); c.lineTo(29, -dir*2); c.lineTo(25, -dir*2); c.lineTo(25, -dir*11); c.lineTo(19, -dir*11); c.lineTo(19, -dir*2); c.lineTo(15, -dir*2); c.closePath(); c.fill();
  c.restore();
}

// ---------- the Threading Fault ----------
// A big fictional wire-cutting cell: a spool and tensioner up on the wall, a guide head on the top deck, a flushing
// manifold in the sump. Three service panels, each with its own shape so they can be told apart without reading.
const SHAPES = { flush:'drop', tension:'rollers', align:'cross' };
function pipe(c, points, color, width){
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle = '#10232d'; c.lineWidth = (width || 7) + 4; c.stroke(); c.strokeStyle = color || '#4e737f'; c.lineWidth = width || 7; c.stroke(); c.restore();
}
// Original circulation skid: motor, twin filters, pressure dial and bolted base. Always mounted on a real wall/slab.
A2.pumpSkid = function(c, x, y, restored, t){
  panel(c, x - 72, y - 112, 144, 112, '#45616c', '#233d49', 7);
  for (const px of [x - 65, x + 65]) for (const py of [y - 103, y - 9]) bolt(c, px, py, 3);
  for (const fx of [x - 50, x - 15]){
    panel(c, fx, y - 93, 25, 65, '#acc0c6', '#5c7885', 9);
    panel(c, fx - 3, y - 94, 31, 10, '#718e99', '#304e5c', 2);
    panel(c, fx - 3, y - 40, 31, 8, '#718e99', '#304e5c', 2);
    pipe(c, [[fx + 12,y - 28],[fx + 12,y - 14],[x + 34,y - 14]], '#527f88', 5);
  }
  panel(c, x + 19, y - 65, 39, 42, '#849ca6', '#36515f', 6);
  for (let px = x + 24; px < x + 55; px += 6) line(c, px, y - 59, px, y - 28, '#2b4652', 2);
  circ(c, x + 35, y - 86, 15); fillInk(c, '#d1e0dd', 3);
  const a = restored ? -.6 : -1.9 + Math.sin(t*5)*.3;
  line(c, x + 35, y - 86, x + 35 + Math.cos(a)*10, y - 86 + Math.sin(a)*10, '#172f3b', 2);
  lampDot(c, x + 60, y - 87, restored ? P.safe : P.warn, true, 4);
  panel(c, x - 78, y - 5, 156, 9, '#7c97a0', '#294652', 2);
};
A2.bossMachine = function(c, L, B, st, t){
  const b = L.boss, x = b.bounds[0]*T, w = b.bounds[2]*T, spin = st.restored ? t*2.2 : t*.35*(st.on ? 1 + 2*Math.sin(t*3) : 1);
  const jobs = st.completed || [], flush = st.restored || jobs.includes('flush'), tension = st.restored || jobs.includes('tension'), align = st.restored || jobs.includes('align');
  // A single framed EDM enclosure ties the three service elevations together. Background panels are recessed.
  c.save(); c.globalAlpha = .82;
  panel(c, x + 10, -5*T, w - 20, 29*T, '#48616c', '#142e3d', 18);
  rr(c, x + 64, -4*T, w - 128, 27.7*T, 16); fillInk(c, '#112e3a', 5);
  for (let py = -3*T; py < 24*T; py += 4*T){
    panel(c, x + 20, py, 30, 3.5*T, '#66808b', '#344f5d', 3);
    panel(c, x + w - 50, py, 30, 3.5*T, '#66808b', '#344f5d', 3);
    bolt(c, x + 35, py + 10, 3); bolt(c, x + w - 35, py + 10, 3);
    line(c, x + 65, py + 3.5*T, x + w - 65, py + 3.5*T, '#244652', 2);
  }
  // Bellows, a fixed column and table saddle describe the machine behind the playable gratings.
  panel(c, x + w*.39, 1*T, 72, 11*T, '#3c5967', '#203b48', 4);
  for (let py = 1*T + 8; py < 12*T; py += 12) line(c, x + w*.39 + 6, py, x + w*.39 + 66, py, '#66818b', 2);
  panel(c, x + 230, 14.5*T, 220, 3.8*T, '#5e7780', '#334e5b', 8);
  for (let px = x + 250; px < x + 440; px += 28) line(c, px, 15*T, px, 17.8*T, '#253e49', 3);
  c.restore();
  // Circulation circuit terminates at the floor manifold and the filter motor, with clipped return pipes.
  const pumpX = x + w - 118, pumpY = 24*T - 8, fp = b.points.flush;
  pipe(c, [[fp[0]*T + 55,24*T - 21],[pumpX - 50,24*T - 21],[pumpX - 50,pumpY - 86]], flush ? '#608f96' : '#41616d', 8);
  pipe(c, [[pumpX + 35,pumpY - 60],[x + w - 68,pumpY - 60],[x + w - 68,6*T],[b.points.align[0]*T + 52,6*T]], '#3f606d', 7);
  for (let py = 7*T; py < 22*T; py += 2*T) panel(c, x + w - 79, py, 22, 9, '#718b95', '#344e5a', 2);
  A2.pumpSkid(c, pumpX, pumpY, flush, t);
  // the enclosure's back: a tall frame tied to the roof, the spool high on the right
  for (const px of [x + 40, x + w - 110]){ A.stand(c, px, 46, -8*T, 24*T, false); }
  panel(c, x + 30, -3.2*T, w - 100, 22, '#4c6874', '#16303c', 3); for (let px = x + 44; px < x + w - 80; px += 30) screw(c, px, -3.2*T + 11);
  const sx = x + w - 150, sy = -.6*T;
  panel(c, sx - 58, sy - 60, 116, 126, '#7f96a0', '#2a4552', 8);
  c.save(); c.translate(sx, sy); c.rotate(spin); circ(c, 0, 0, 44); fillInk(c, '#c9b37a', 3); for (let r = 40; r > 14; r -= 5){ circ(c, 0, 0, r); c.strokeStyle = 'rgba(80,60,20,.35)'; c.lineWidth = 1; c.stroke(); }
  for (let i = 0; i < 3; i++){ c.rotate(TAU/3); rr(c, 8, -4, 30, 8, 3); c.fillStyle = 'rgba(20,20,22,.55)'; c.fill(); } circ(c, 0, 0, 9); fillInk(c, C.steelL, 2); c.restore();
  // the wire's path from the spool over an idler to the tensioner
  const tp = b.points.tension, tx = tp[0]*T, ty = tp[1]*T;
  const ap = b.points.align, ax = ap[0]*T + 51, ay = ap[1]*T - 110;
  const guide = L.wires.find(w => w.id === 'wB1'), gp = guide && E.wirePose(guide, st.on && !st.restored ? B.t : -(guide.phase || 0) - (guide.lag || 0));
  c.strokeStyle = tension ? '#bbcec8' : '#708b91'; c.lineWidth = 1.5; c.beginPath();
  c.moveTo(sx - 40, sy + 18); c.lineTo(tx + 38, ty - 99); c.lineTo(tx + 62, ty - 35);
  c.lineTo(ax, ty - 35); c.lineTo(ax, ay); if (gp) c.lineTo(gp.x*T, gp.y0*T - 34); c.stroke();
  for (const [ix,iy] of [[ax,ty - 35],[ax,ay]]){ circ(c,ix,iy,9); fillInk(c,'#6f8994',2); bolt(c,ix,iy,3); }
  // Repeat the three recognisable job symbols as status lamps on the enclosure, not a revealed repair order.
  for (const [i,ok] of [flush,tension,align].entries()) lampDot(c, x + 86 + i*24, 11.5*T, ok ? P.safe : P.warn, true, 5);
};
A2.restoration = function(c, L, B){
  if (!B.done) return;
  const d = L.doors.find(d => d.opens === 'boss'); if (!d) return;
  const x = d.x*T, y = d.top*T, w = d.w*T, h = d.h*T, u = Math.max(0, Math.min(1, (B.restoreT - .4)/1.6));
  c.save();
  // An amber program line becomes a small, local cutting gap, then the cut-out lifts with the door.
  if (B.restoreT < 2){
    c.strokeStyle = '#6f8c95'; c.lineWidth = 2; c.setLineDash([4,6]); c.strokeRect(x + 3,y + 3,w - 6,h - 6); c.setLineDash([]);
    const points = [[x+3,y+h-3],[x+3,y+3],[x+w-3,y+3],[x+w-3,y+h-3]], lengths = [h-6,w-6,h-6];
    let left = u*lengths.reduce((a,b)=>a+b,0), tip = points[0]; c.beginPath(); c.moveTo(...tip);
    for (let i=0;i<3;i++){ const f=Math.min(1,left/lengths[i]); tip=[points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f]; c.lineTo(...tip); left-=lengths[i]; if(left<=0)break; }
    c.strokeStyle=P.cut; c.lineWidth=2.5; c.stroke();
    if(u>0 && u<1){ circ(c,...tip,5); c.fillStyle='#fff'; c.fill(); for(let j=0;j<4;j++)line(c,tip[0],tip[1],tip[0]+Math.sin(B.doneT*32+j)*13,tip[1]+Math.cos(B.doneT*24+j)*13,P.warn,1); }
  } else { lampDot(c,x+w/2,y-20,P.safe,true,6); }
  c.restore();
};
A2.secretRecess = function(c, p, distance, t){
  const x = p.x*T, y = (p.y - 2)*T;
  // A loose service grille and warm inspection lamp hint at the recess before the life itself is revealed.
  c.save(); c.globalAlpha = distance < 4 ? .18 : .7;
  rr(c,x-34,y,68,78,4); fillInk(c,'#152c36',2);
  for(let yy=y+12;yy<y+68;yy+=10)line(c,x-26,yy,x+24,yy-2,'#53717b',3);
  for(const px of [x-28,x+28]){ bolt(c,px,y+6,2); bolt(c,px,y+71,2); }
  line(c,x+28,y+8,x+35,y+66,'#9bb1b3',2); c.restore();
  panel(c,x-18,y-7,36,8,'#5a727d','#1e3a46',2);
  c.fillStyle='rgba(255,212,128,.12)'; c.beginPath();c.moveTo(x-10,y+1);c.lineTo(x+10,y+1);c.lineTo(x+26,y+65);c.lineTo(x-26,y+65);c.closePath();c.fill();
  line(c,x-10,y+1,x+10,y+1,'#e4ca8b',2);
};
A2.servicePoint = function(c, name, p, st, t){
  const x = p[0]*T, y = p[1]*T, next = st.target === name, fixing = st.fix && st.fix.point === name, wrong = st.wrong && st.wrong.point === name, done = st.restored;
  const calibrated = done || (st.completed || []).includes(name);
  c.save();
  if (name === 'flush'){
    // the manifold: a fat pipe with three outlets, bolted to the sump floor
    panel(c, x - 58, y - 30, 116, 22, '#9fb4bc', '#4a6470', 9); for (const ox of [-40, 0, 40]){ panel(c, x + ox - 8, y - 46, 16, 18, '#8aa2ac', '#2c4855', 3); }
    for (const fx of [x - 50, x + 38]) panel(c, fx, y - 8, 12, 8, '#7f96a0', '#2a4552', 1);
  } else if (name === 'tension'){
    // the tensioner: a roller pair on a bracket, with a spring scale
    panel(c, x + 22, y - 110, 56, 110, '#7f96a0', '#2a4552', 5);
    for (const [rx, ry] of [[x + 38, y - 84], [x + 62, y - 50]]){ c.save(); c.translate(rx, ry); c.rotate(t*(done ? 3 : .6)); circ(c, 0, 0, 15); fillInk(c, C.steelXL, 2.5); line(c, -12, 0, 12, 0, 'rgba(20,20,22,.4)', 2); circ(c, 0, 0, 4); fillInk(c, '#3c5561', 1.5); c.restore(); }
    rr(c, x + 30, y - 28, 40, 14, 4); fillInk(c, '#16242c', 2); c.fillStyle = calibrated ? P.green : P.warn; c.fillRect(x + 34, y - 24, 32*(calibrated ? .8 : .35 + .2*Math.sin(t*7)), 6);
  } else {
    // the guide head: a slide with a guide block, cross-hairs on its face
    panel(c, x + 18, y - 120, 66, 120, '#7f96a0', '#2a4552', 5); panel(c, x + 28, y - 100, 46, 46, '#0c2530', '#16303c', 4);
    c.strokeStyle = calibrated ? P.green : P.waterL; c.lineWidth = 2; const wob = calibrated ? 0 : Math.sin(t*5)*5; circ(c, x + 51 + wob, y - 77, 12); c.stroke(); line(c, x + 32, y - 77, x + 70, y - 77, 'rgba(109,224,221,.5)', 1); line(c, x + 51, y - 96, x + 51, y - 58, 'rgba(109,224,221,.5)', 1);
  }
  // the service panel itself
  const px = x - 24, py = y - (name === 'flush' ? 132 : 122);          // above his head when he stands at the point
  rr(c, px, py, 48, 48, 9); fillInk(c, done ? '#123c2a' : wrong ? '#5a1e18' : '#10222b', 3);
  c.strokeStyle = done ? P.green : wrong ? P.red : next ? P.warn : '#5f7d89'; c.lineWidth = 3; rr(c, px + 4, py + 4, 40, 40, 6); c.stroke();
  c.fillStyle = c.strokeStyle; c.lineWidth = 3;
  const cx = px + 24, cy = py + 24;
  if (SHAPES[name] === 'drop'){ c.beginPath(); c.moveTo(cx, cy - 13); c.quadraticCurveTo(cx + 13, cy + 3, cx, cy + 12); c.quadraticCurveTo(cx - 13, cy + 3, cx, cy - 13); c.fill(); }
  else if (SHAPES[name] === 'rollers'){ circ(c, cx - 7, cy - 4, 7); c.stroke(); circ(c, cx + 7, cy + 5, 7); c.stroke(); }
  else { circ(c, cx, cy, 9); c.stroke(); line(c, cx - 14, cy, cx + 14, cy, c.strokeStyle, 2.5); line(c, cx, cy - 14, cx, cy + 14, c.strokeStyle, 2.5); }
  line(c, cx - 30, py + 40, cx - 30, y - (name === 'flush' ? 30 : 0), '#2f4c59', 5); line(c, cx - 30, py + 40, cx - 24, py + 40, '#2f4c59', 5);
  if (fixing){ c.strokeStyle = P.safe; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, 31, -Math.PI/2, -Math.PI/2 + TAU*st.fix.u); c.stroke(); }
  if (next && !fixing && !done){                   // the flashing marker on the next point (owner: keep it)
    const pu = .5 + .5*Math.sin(t*7); c.strokeStyle = `rgba(255,196,106,${.35 + .65*pu})`; c.lineWidth = 4; rr(c, px - 6 - pu*4, py - 6 - pu*4, 60 + pu*8, 60 + pu*8, 13); c.stroke();
    const ay = py - 22 - pu*7; c.fillStyle = P.warn; c.beginPath(); c.moveTo(cx, ay + 14); c.lineTo(cx + 12, ay); c.lineTo(cx + 4.5, ay); c.lineTo(cx + 4.5, ay - 13); c.lineTo(cx - 4.5, ay - 13); c.lineTo(cx - 4.5, ay); c.lineTo(cx - 12, ay); c.closePath(); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; c.stroke();
  }
  c.restore();
};

// ---------- splashes ----------
A2.splash = function(c, f, u){
  const x = f.x*T, y = f.y*T, s = f.size || 1;
  c.strokeStyle = `rgba(210,250,250,${.9*(1 - u)})`; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x, y, (8 + u*30)*s, (2 + u*5)*s, 0, 0, TAU); c.stroke();
  for (let i = 0; i < 7; i++){ const a = -Math.PI/2 + (i - 3)*.32, r = u*44*s, g = u*u*30; circ(c, x + Math.cos(a)*r, y + Math.sin(a)*r + g, 2.2*(1 - u) + .6); c.fillStyle = `rgba(220,250,250,${.9*(1 - u)})`; c.fill(); }
};
A2.bubbles = function(c, x, y, t, n){
  for (let i = 0; i < (n || 3); i++){ const u = (t*.9 + i/(n || 3)) % 1; circ(c, x + Math.sin(u*7 + i*2)*5, y - u*34, 1.5 + u*2.5); c.strokeStyle = `rgba(220,250,250,${.75*(1 - u)})`; c.lineWidth = 1.3; c.stroke(); }
};
})();
