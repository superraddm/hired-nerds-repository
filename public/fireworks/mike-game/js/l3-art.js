// Mike the Mic, Level 3: Cobot Mania. The cobot hall, drawn in code: the hall and its five layers, the cobots, and the
// Teach Cell. World pixels, T = 32. Level 1's art (art.js, machines.js) is used as it is and not changed.
//
// The two bands are the whole language of this level (docs/mike-platformer/level-3-design.md):
//   carriers: mint band with white chevrons pointing where the ride goes, a soft padded cradle, a mint ready lamp;
//   hazards:  yellow and black diagonal stripes, a visible tool, a traffic light.
// Each reads in greyscale by its pattern and shape, not only by its colour.
// No real manufacturer's arm is drawn: cream links, graphite joints, the two bands and nothing else.
(function(){
'use strict';
const M = window.MIKE, A = M.art, T = A.T, C = A.C, FONT = A.FONT, rr = A.rr, circ = A.circ;
const TAU = Math.PI*2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P = {
  cream:'#F2EDE3', creamS:'#CFC7B8', joint:'#343B44', jointL:'#5B646F', ink:'#1B1F24', mint:'#2FD6A8', mintD:'#12876A', mintL:'#B8F5E3',
  warn:'#F4CA46', black:'#17191C', deck:'#C7CCD1', deckS:'#7F8890', slab:'#4B5560', floorTop:'#C2BBAE', floorBody:'#5D5751', screen:'#0B1822', grid:'#1F4A60',
  crate:'#C99D60', crateD:'#9A703C', tape:'#E9D5A6', safe:'#35C06A', amber:'#F4CA46', red:'#E8503A',
  layer:['#E7EDF2', '#7FC4F0', '#3FB8A8', '#B8AFA2', '#4A5C6A']       // gantry, high line, mezzanine, floor, undercroft: the wall stripe of each
};
const A3 = M.art3 = { P };
const LAYER_Y = [-12, -4, 4, 12, 20];
function line(c, x, y, xx, yy, color, w){ c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = w || 2; c.stroke(); }
function fillInk(c, fill, w){ c.fillStyle = fill; c.fill(); c.lineWidth = w || 2.5; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(); }
function lamp(c, x, y, color, on, r){ circ(c, x, y, r || 4.5); c.fillStyle = on ? color : '#26303a'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(); if (on){ circ(c, x, y, (r || 4.5)*2.4); c.fillStyle = color + '44'; c.fill(); } }
// the traffic light a hazard carries: green (safe), amber (tell, flashing), red (active)
function signal(c, x, y, state, t){
  rr(c, x - 7, y - 30, 14, 30, 4); c.fillStyle = P.joint; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
  lamp(c, x, y - 23, P.red, state === 'red', 3.6); lamp(c, x, y - 15, P.amber, state === 'amber' && Math.sin(t*26) > -.3, 3.6); lamp(c, x, y - 7, P.safe, state === 'green', 3.6);
}
// yellow and black diagonal stripes inside any path (the hazard band)
function hazardFill(c, draw, w){
  c.save(); draw(); c.clip(); c.fillStyle = P.black; c.fillRect(-400, -400, 800, 800); c.fillStyle = P.warn;
  for (let i = -60; i < 60; i += 2){ c.beginPath(); c.moveTo(i*w, -60); c.lineTo(i*w + w, -60); c.lineTo(i*w + w + 120, 60); c.lineTo(i*w + 120, 60); c.closePath(); c.fill(); }
  c.restore();
}

// ---------- the hall behind everything ----------
let far = null;
function makeFar(){
  const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 1100; const c = cv.getContext('2d');
  // skylit roof, far cells behind light-guard frames, silhouettes of arms at work
  for (let x = 0; x < 1536; x += 192){
    c.fillStyle = 'rgba(210,235,245,.10)'; c.fillRect(x + 24, 40, 144, 70); c.strokeStyle = 'rgba(210,235,245,.18)'; c.lineWidth = 3; c.strokeRect(x + 24, 40, 144, 70);
    c.beginPath(); c.moveTo(x + 96, 40); c.lineTo(x + 96, 110); c.stroke();
  }
  c.fillStyle = 'rgba(15,30,42,.35)'; c.fillRect(0, 130, 1536, 10);
  for (let row = 0; row < 3; row++) for (let x = 40 + row*90; x < 1536; x += 300){
    const y = 330 + row*260, w = 210, h = 160;
    c.fillStyle = 'rgba(12,26,36,.28)'; c.fillRect(x, y - h, w, h);
    c.strokeStyle = 'rgba(170,205,220,.22)'; c.lineWidth = 3; c.strokeRect(x, y - h, w, h);
    for (let k = 1; k < 4; k++){ c.beginPath(); c.moveTo(x + k*w/4, y - h); c.lineTo(x + k*w/4, y); c.stroke(); }
    // a silhouette arm inside the cell
    c.strokeStyle = 'rgba(8,18,26,.45)'; c.lineCap = 'round';
    const bx = x + 60 + (row*37 % 90), by = y - 8, ex = bx + 30, ey = by - 70, tx = ex + 50, ty = ey + 30;
    c.lineWidth = 16; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = 'rgba(8,18,26,.45)'; c.fillRect(bx - 18, by - 8, 36, 10);
  }
  return cv;
}
A3.backdrop = function(c, camX, camY, t, low){
  const g = c.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, '#5F8195'); g.addColorStop(1, '#2C4252'); c.fillStyle = g; c.fillRect(0, 0, 960, 540);
  if (!far) far = makeFar();
  const x = -((camX*.2) % 1536), y = -300 - camY*.14;
  c.drawImage(far, x, y); c.drawImage(far, x + 1536, y);
  if (!low){                                                     // light from the skylights
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++){ const sx = ((i*330 - camX*.3) % 1320 + 1320) % 1320 - 180; c.fillStyle = 'rgba(190,225,240,.045)';
      c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + 90, 0); c.lineTo(sx + 330, 540); c.lineTo(sx + 170, 540); c.closePath(); c.fill(); }
    c.restore();
  }
};

// ---------- terrain: everything that never moves, cached by the page in squares ----------
function supportBelow(L, x, y){ let best = null; for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && s.y > y + .01 && (best === null || s.y < best)) best = s.y; return best; }
function supportAbove(L, x, y, roof){ let best = roof; for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && s.y + s.h < y - .01 && s.y + s.h > best) best = s.y + s.h; return best; }
function column(c, x, y0, y1){
  const w = 14; c.fillStyle = '#6C7580'; c.fillRect(x - w/2, y0, w, y1 - y0); c.fillStyle = '#8F99A3'; c.fillRect(x - w/2 + 2, y0, 3, y1 - y0);
  c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(x - w/2, y0, w, y1 - y0);
  c.fillStyle = P.joint; c.fillRect(x - w/2 - 4, y1 - 6, w + 8, 6); c.fillRect(x - w/2 - 4, y0, w + 8, 5);
}
function drawGround(c, s){                                       // thick ground or the undercroft's floor
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = A.vgrad(c, y, y + h, ['#6B645C', '#4E4943', '#35312D']); c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; for (let px = Math.ceil(x/96)*96; px < x + w; px += 96){ c.beginPath(); c.moveTo(px, y + 10); c.lineTo(px, y + Math.min(h, 90)); c.stroke(); }
  c.fillStyle = P.floorTop; c.fillRect(x, y, w, 9); c.fillStyle = '#E4DED2'; c.fillRect(x, y, w, 3); c.fillStyle = P.ink; c.fillRect(x, y + 9, w, 2);
  c.fillStyle = P.warn; for (let px = x + 6; px < x + w - 20; px += 64) c.fillRect(px, y + 13, 30, 4);        // the walkway line
}
function drawSlab(c, s){                                         // a floor over the undercroft: deck on steel beams
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = P.slab; c.fillRect(x, y, w, h);
  c.fillStyle = '#3A434C'; for (let px = Math.ceil(x/48)*48; px < x + w; px += 48) c.fillRect(px, y + 12, 8, h - 12);
  c.fillStyle = P.floorTop; c.fillRect(x, y, w, 9); c.fillStyle = '#E4DED2'; c.fillRect(x, y, w, 3); c.fillStyle = P.ink; c.fillRect(x, y + 9, w, 2); c.fillRect(x, y + h - 2, w, 2);
  c.fillStyle = P.warn; for (let px = x + 6; px < x + w - 20; px += 64) c.fillRect(px, y + 13, 30, 4);
  for (const ex of [x, x + w - 6]){ A.stripes(c, ex, y, 6, h, 5); }                                           // the edge of an opening
}
function drawDeck(c, s, L){                                      // a steel deck on columns; the columns stand on whatever is below
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  const cols = [s.x + .35, s.x + s.w - .35]; for (let cx = s.x + 6; cx < s.x + s.w - 3; cx += 8) cols.push(cx);
  if (s.style === 'deck') for (const cx of cols){ const b = supportBelow(L, cx, s.y + s.h); if (b !== null && b - s.y < 18) column(c, cx*T, y + h, b*T); }
  c.fillStyle = A.vgrad(c, y, y + h, ['#E3E7EA', P.deck, P.deckS]); c.fillRect(x, y, w, h);
  c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
  c.fillStyle = 'rgba(20,24,28,.25)'; for (let px = x + 20; px < x + w - 6; px += 20) c.fillRect(px, y + 5, 2, h - 8);
  c.fillStyle = P.warn; c.fillRect(x + 3, y + 2, 10, 4); c.fillRect(x + w - 13, y + 2, 10, 4);
  // a handrail at the back, the kind a walkway has
  c.strokeStyle = 'rgba(40,50,60,.55)'; c.lineWidth = 2.5; line(c, x, y - 30, x + w, y - 30, 'rgba(40,50,60,.55)', 2.5);
  for (let px = x + 8; px < x + w; px += 64) line(c, px, y - 30, px, y, 'rgba(40,50,60,.55)', 2.5);
}
function drawTruss(c, s, roofY){                                 // a roof truss he walks on; it hangs from the roof on rods
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  for (const rx of [x + 12, x + w - 12]) line(c, rx, roofY*T, rx, y, '#56616C', 3);
  c.strokeStyle = '#8A949E'; c.lineWidth = 3; c.beginPath();
  for (let px = x; px < x + w - 1; px += 24){ c.moveTo(px, y + h); c.lineTo(px + 12, y + h + 20); c.lineTo(px + 24, y + h); }
  c.stroke(); line(c, x, y + h + 20, x + w, y + h + 20, '#8A949E', 3);
  c.fillStyle = A.vgrad(c, y, y + h, ['#E9ECEE', '#AEB6BD']); c.fillRect(x, y, w, h); c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
  c.fillStyle = P.warn; c.fillRect(x + 3, y + 2, 8, 4); c.fillRect(x + w - 11, y + 2, 8, 4);
}
function drawPedestal(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  rr(c, x, y, w, h, 3); fillInk(c, A.hgrad(c, x, x + w, ['#5E6873', '#7E8993', '#5E6873']), 2.5);
  rr(c, x - 5, y + h - 8, w + 10, 8, 2); fillInk(c, P.joint, 2); A.bolt(c, x - 1, y + h - 4, 2.2); A.bolt(c, x + w + 1, y + h - 4, 2.2);
}
// A closed layer: a row of fenced robot cells, mesh light-guard panels with a working cobot glimpsed behind each one.
function drawCell(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = '#26323C'; c.fillRect(x, y, w, h);
  for (let band = 0; band < h - 40; band += 8*T){                         // one row of cells per layer
    const by = y + band, bh = Math.min(8*T, h - band);
    for (let px = x; px < x + w - 20; px += 3*T){
      const pw = Math.min(3*T, x + w - px);
      c.fillStyle = '#31404C'; c.fillRect(px + 4, by + 10, pw - 8, bh - 24);
      // the cobot behind the fence, still and dark
      if (((px/T) | 0) % 9 < 3){ c.strokeStyle = 'rgba(12,20,26,.75)'; c.lineCap = 'round'; c.lineWidth = 11; c.beginPath(); const bx = px + pw*.3, fy = by + bh - 16; c.moveTo(bx, fy); c.lineTo(bx + 14, fy - bh*.38); c.lineTo(bx + 40, fy - bh*.28); c.stroke(); c.lineCap = 'butt'; }
      c.strokeStyle = 'rgba(160,190,205,.18)'; c.lineWidth = 1; for (let mx = px + 10; mx < px + pw - 6; mx += 7){ c.beginPath(); c.moveTo(mx, by + 10); c.lineTo(mx, by + bh - 14); c.stroke(); }
      c.fillStyle = '#F4CA46'; c.fillRect(px + 2, by + 10, 3, bh - 24); c.fillStyle = '#56616C'; c.fillRect(px, by + 6, 4, bh - 12);
    }
    c.fillStyle = '#4A5763'; c.fillRect(x, by + bh - 14, w, 6); A.stripes(c, x, by + bh - 8, w, 8, 6);
    for (let lx = x + 2*T; lx < x + w - T; lx += 9*T){ lamp(c, lx, by + 18, '#35C06A', true, 3.5); }
  }
  c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
}
function drawWall(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = A.hgrad(c, x, x + w, ['#4D5863', '#6C7884', '#4D5863']); c.fillRect(x, y, w, h);
  c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
  c.fillStyle = 'rgba(0,0,0,.2)'; for (let py = y + 40; py < y + h; py += 64) c.fillRect(x + 3, py, w - 6, 3);
  A.stripes(c, x, y + h - 14, w, 14, 6);
}
A3.drawStatic = function(c, L, x0, x1, y0, y1){
  const inR = (a, b, ya, yb) => b*T > x0 - 96 && a*T < x1 + 96 && yb*T > y0 - 200 && ya*T < y1 + 200;
  const roof = (L.scenery.find(s => s.type === 'roof') || {}).y || -17;
  // each layer's colour, painted along the back wall where that layer is walked
  for (const ln of L.lanes){ const [x, y] = ln.rect; if (inR(x, x + ln.rect[2], y - 6, y + 3)){ c.fillStyle = P.layer[ln.layer] + '55'; c.fillRect(x*T, (LAYER_Y[ln.layer] - 5.6)*T, ln.rect[2]*T, 10); } }
  // the roof: a long lattice girder the trusses and rails hang from
  const rf = L.scenery.find(s => s.type === 'roof');
  if (rf && inR(rf.x0, rf.x1, roof - 1, roof + 1)){ const y = roof*T; c.fillStyle = '#56616C'; c.fillRect(Math.max(rf.x0*T, x0 - 96), y - 10, Math.min(rf.x1*T, x1 + 96) - Math.max(rf.x0*T, x0 - 96), 10);
    c.strokeStyle = '#56616C'; c.lineWidth = 3; c.beginPath(); for (let px = Math.ceil((x0 - 96)/40)*40; px < Math.min(rf.x1*T, x1 + 96); px += 40){ c.moveTo(px, y - 10); c.lineTo(px + 20, y - 40); c.lineTo(px + 40, y - 10); } c.stroke(); }
  for (const s of L.solids) if (inR(s.x, s.x + s.w, s.y, s.y + s.h)){
    if (s.kind === 'shelf') A.drawShelf(c, s);
    else if (s.style === 'floor') drawGround(c, s); else if (s.style === 'slab') drawSlab(c, s); else if (s.style === 'truss') drawTruss(c, s, roof);
    else if (s.style === 'pedestal') drawPedestal(c, s); else if (s.style === 'wall') drawWall(c, s); else if (s.style === 'cell') drawCell(c, s); else drawDeck(c, s, L);
  }
  // hook rails: an I-beam on hanger rods, up to the roof or the deck above
  for (const h of L.hooks) if (inR(h.rail[0] - 2, h.rail[1] + 2, h.y - 8, h.y + 1)){
    const y = h.y*T, xa = (h.rail[0] - .8)*T, xb = (h.rail[1] + .8)*T;
    for (let rx = xa + 16; rx < xb; rx += 128){ const top = supportAbove(L, rx/T, h.y, roof); line(c, rx, top*T, rx, y - 6, '#56616C', 3); }
    line(c, xb - 16, supportAbove(L, xb/T - .5, h.y, roof)*T, xb - 16, y - 6, '#56616C', 3);
    c.fillStyle = '#6F7A85'; c.fillRect(xa, y - 7, xb - xa, 12); c.fillStyle = '#A8B2BB'; c.fillRect(xa, y - 7, xb - xa, 3);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(xa, y - 7, xb - xa, 12);
    for (const ex of [xa, xb - 8]){ c.fillStyle = P.mint; c.fillRect(ex, y - 7, 8, 12); }                 // end stops, in the carrier's colour
  }
  // carrier tracks, bolted under whatever is above
  A3.L = L;
  for (const k of L.carriers){ const xs = [k.home[0], ...k.drops.map(d => d[0])]; if (inR(Math.min(...xs) - 4, Math.max(...xs) + 4, -20, 26)) A3.track(c, L, k); }
  // hazard arms on pedestals or rails: the pedestal and its floor hatching
  for (const a of L.arms) if (inR(a.base[0] - 4, a.base[0] + 4, a.base[1] - 4, a.base[1] + 4)){
    const bx = a.base[0]*T, by = a.base[1]*T;
    if (a.mount === 'rail'){ const b = supportBelow(L, a.base[0], a.base[1]); rr(c, bx - 9, by, 18, (b - a.base[1])*T, 3); fillInk(c, '#6C7580', 2); rr(c, bx - 18, b*T - 6, 36, 6, 2); fillInk(c, P.joint, 1.5); }
    if (a.mount === 'wall-l' || a.mount === 'wall-r'){ const d = a.mount === 'wall-l' ? 1 : -1; rr(c, bx - (d > 0 ? 6 : 14), by - 16, 20, 32, 4); fillInk(c, P.joint, 2); }
  }
  // crate feeders: a chute on a beam, the crate waiting inside
  for (const d of L.drops) if (!d.boss && inR(d.x - 2, d.x + 2, d.top - 3, d.top + 2)){
    const x = d.x*T, y = d.top*T, top = supportAbove(L, d.x, d.top, roof);
    line(c, x - 18, top*T, x - 18, y - 20, '#56616C', 3); line(c, x + 18, top*T, x + 18, y - 20, '#56616C', 3);
    c.beginPath(); c.moveTo(x - 26, y - 22); c.lineTo(x + 26, y - 22); c.lineTo(x + 19, y + 4); c.lineTo(x - 19, y + 4); c.closePath(); fillInk(c, '#6F7A85', 2.5);
    c.save(); c.translate(x, y - 9); hazardFill(c, () => { c.beginPath(); c.rect(-25, -13, 50, 7); }, 5); c.restore();
  }
  // Teach Cell track: the Big Arm's beam across the top of the cell
  if (L.boss){ const [bx, , bw] = L.boss.bounds, y = L.boss.track*T; if (inR(bx, bx + bw, L.boss.track - 1, L.boss.track + 1)){
    c.fillStyle = '#5E6873'; c.fillRect(bx*T, y - 10, bw*T, 16); c.fillStyle = '#A8B2BB'; c.fillRect(bx*T, y - 10, bw*T, 3); c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(bx*T, y - 10, bw*T, 16);
    for (let px = bx*T + 20; px < (bx + bw)*T; px += 40) A.bolt(c, px, y - 2, 2); } }
  // set-down marks: two small mint ticks wherever a carrier puts him down
  for (const k of L.carriers) for (const d of k.drops) if (inR(d[0] - 1, d[0] + 1, d[1] - 1, d[1] + 1)){ const x = d[0]*T, y = d[1]*T;
    c.fillStyle = P.mint + '99'; for (const dx of [-12, 12]){ c.beginPath(); c.moveTo(x + dx - 5, y - 1); c.lineTo(x + dx, y - 7); c.lineTo(x + dx + 5, y - 1); c.closePath(); c.fill(); } }
};

// ---------- signs: pictures, no words (the owner's rule: minimal helpers, familiar cues) ----------
function board(c, x, y, w, h, hang){
  if (hang !== false){ c.strokeStyle = '#012347'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 22, y - 400); c.lineTo(x + 22, y); c.moveTo(x + w - 22, y - 400); c.lineTo(x + w - 22, y); c.stroke(); }
  rr(c, x, y, w, h, 10); c.fillStyle = C.white; c.fill(); c.lineWidth = 3; c.strokeStyle = C.navy; c.stroke(); c.fillStyle = C.red; rr(c, x, y, 10, h, 5); c.fill();
}
function keycap(c, x, y, label, touch){
  c.font = `700 15px ${FONT}`; const w = touch ? 32 : Math.max(30, c.measureText(label).width + 16);
  if (touch){ circ(c, x + 16, y, 16); c.fillStyle = C.navy; c.fill(); c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + 16, y); return 32; }
  rr(c, x, y - 12, w, 30, 7); c.fillStyle = '#9AA3AD'; c.fill(); rr(c, x, y - 15, w, 27, 7); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.navy; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = C.navy; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w/2, y - 1); return w;
}
function miniMike(c, x, y, s){ circ(c, x, y - 18*s, 6*s); c.fillStyle = C.navy; c.fill(); c.fillStyle = C.navy; rr(c, x - 3*s, y - 12*s, 6*s, 12*s, 2*s); c.fill(); }
A3.sign = function(c, g, touch){
  const x = g.x*T; let y = (g.y - (g.kind === 'hook' ? 4.25 : 6.2))*T; c.save();
  if (g.kind === 'move'){
    const items = [A.KEYS.run, A.KEYS.jump]; c.globalAlpha = 0; const w = A.controlsRow(c, 0, -999, items, touch, 24) + 30; c.globalAlpha = 1;
    board(c, x - w/2, y, w, 42); A.controlsRow(c, x - w/2 + 20, y + 21, items, touch, 24);
  } else if (g.kind === 'ride'){
    // a small sign on a post beside the pad: a mint pad, a little Mike on it, an arrow up. Stand here and wait.
    const w = 96; y = (g.y - 3.1)*T; line(c, x, y + 50, x, g.y*T, '#56616C', 4); board(c, x - w/2, y, w, 52, false);
    c.save(); c.translate(-10, -4);
    c.strokeStyle = P.mint; c.lineWidth = 4; c.beginPath(); c.ellipse(x - 14, y + 46, 18, 5, 0, 0, TAU); c.stroke(); miniMike(c, x - 14, y + 44, 1);
    c.fillStyle = P.mintD; c.beginPath(); c.moveTo(x + 26, y + 12); c.lineTo(x + 38, y + 26); c.lineTo(x + 31, y + 26); c.lineTo(x + 31, y + 46); c.lineTo(x + 21, y + 46); c.lineTo(x + 21, y + 26); c.lineTo(x + 14, y + 26); c.closePath(); c.fill();
    c.restore();
  } else if (g.kind === 'hook'){
    // jump to grab the handle; jump again to let go
    const w = touch ? 132 : 150; board(c, x - w/2, y, w, 58);
    const kw = keycap(c, x - w/2 + 20, y + 32, touch ? '↑' : 'Space', touch);
    const hx = x - w/2 + 20 + kw + 34; line(c, hx, y + 8, hx, y + 22, P.ink, 2.5); rr(c, hx - 14, y + 22, 28, 8, 4); c.fillStyle = P.mint; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke(); miniMike(c, hx, y + 52, .95);
  }
  c.restore();
};
// the key he can press or the pendant he can hold: the key to press, nothing more
A3.prompt = function(c, kind, touch){
  if (kind === 'hold' || kind === 'tap'){
    const text = kind === 'hold' ? (touch ? 'Hold to re-teach' : 'Hold E to re-teach') : (touch ? 'Tap to delete' : 'Tap E to delete');
    c.font = `700 14px ${FONT}`; const w = c.measureText(text).width + 24;
    rr(c, -w/2, -16, w, 32, 8); c.fillStyle = '#0A2230'; c.fill(); c.strokeStyle = P.warn; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 0); return;
  }
  rr(c, -19, -17, 38, 34, 9); c.fillStyle = 'rgba(0,44,90,.92)'; c.fill(); c.strokeStyle = P.warn; c.lineWidth = 2.5; c.stroke();
  if (touch){ c.strokeStyle = C.white; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-7, 7); c.lineTo(5, -5); c.stroke(); circ(c, 7, -7, 5); c.lineWidth = 3; c.stroke(); }
  else { c.fillStyle = C.white; c.font = `900 18px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('E', 0, 1); }
};

// ---------- cobots ----------
// Revision 2 (owner, 1 Oct: "much more recognisable as cobots", no branding). What makes a cobot read as one, drawn
// generically: a round base flange; round joint housings with a light ring in each cap; smooth white tubes; an offset
// wrist of three small joints; a tool flange; a cable running along the arm. White and graphite only, plus the two
// band colours that are this level's language. No maker's colour scheme, cap colour or silhouette.
function ik(base, tip, l, up){
  const dx = tip[0] - base[0], dy = tip[1] - base[1], d = Math.min(Math.hypot(dx, dy), 2*l - 1e-3), a = Math.atan2(dy, dx), b = Math.acos(d/(2*l));
  const e1 = [base[0] + Math.cos(a + b)*l, base[1] + Math.sin(a + b)*l], e2 = [base[0] + Math.cos(a - b)*l, base[1] + Math.sin(a - b)*l];
  return up ? (e1[1] < e2[1] ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2);
}
// a smooth white tube between two joints, shaded round
function tube(c, x0, y0, x1, y1, w){
  const a = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
  c.save(); c.translate(x0, y0); c.rotate(a);
  const g = c.createLinearGradient(0, -w/2, 0, w/2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.45, '#EEF2F4'); g.addColorStop(1, '#BCC6CD');
  rr(c, -w/2, -w/2, len + w, w, w/2); c.fillStyle = g; c.fill(); c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(w*.2, -w*.3, Math.max(0, len - w*.4), 2);
  c.restore();
}
// a joint housing: a white drum with a graphite cap and a light ring in it
function housing(c, x, y, r, ring, lit){
  circ(c, x, y, r); fillInk(c, '#F4F6F7', 2.2);
  circ(c, x, y, r*.74); c.fillStyle = '#2F353B'; c.fill();
  circ(c, x, y, r*.5); c.strokeStyle = lit ? ring : '#46505A'; c.lineWidth = Math.max(2, r*.22); c.stroke();
  if (lit){ circ(c, x, y, r*1.25); c.fillStyle = ring + '33'; c.fill(); }
  circ(c, x, y, r*.18); c.fillStyle = '#59636D'; c.fill();
}
// a band round a tube at fraction f: mint with chevrons along the ride (carrier), or yellow and black stripes (hazard)
function band(c, x0, y0, x1, y1, w, f, kind, dir){
  const a = Math.atan2(y1 - y0, x1 - x0), bw = 15;
  c.save(); c.translate(x0 + (x1 - x0)*f, y0 + (y1 - y0)*f); c.rotate(a);
  const shape = () => { c.beginPath(); c.rect(-bw/2, -w/2 - .5, bw, w + 1); };
  if (kind === 'carrier'){
    shape(); c.fillStyle = P.mint; c.fill();
    c.rotate(-a); c.fillStyle = C.white; const d = dir || 1;                       // chevrons point the way the ride goes, in the world
    for (const off of [-3.5, 3.5]){ c.beginPath(); c.moveTo(off*d - 3*d, -4.5); c.lineTo(off*d + 2*d, 0); c.lineTo(off*d - 3*d, 4.5); c.lineTo(off*d - 5*d, 4.5); c.lineTo(off*d, 0); c.lineTo(off*d - 5*d, -4.5); c.closePath(); c.fill(); }
    c.rotate(a);
  } else hazardFill(c, shape, 3);
  shape(); c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
  c.restore();
}
// The whole arm. o: base, tip (the tool point), dir (the tool's approach, a unit vector), link, up (elbow up), kind,
// ring (light colour), lit, effector (draws at the tool flange, rotated so +x is the approach), cable, chevron.
function cobot(c, o){
  const [dx, dy] = o.dir, px = -dy, py = dx, side = o.side || 1;
  const F = [o.tip[0] - dx*(o.reachTool || 16), o.tip[1] - dy*(o.reachTool || 16)];            // tool flange
  const W2 = [F[0] - dx*10, F[1] - dy*10], W1 = [W2[0] + px*12*side - dx*6, W2[1] + py*12*side - dy*6];   // the offset wrist
  const B = o.base, E = ik(B, W1, o.link, o.up);
  if (o.cable !== false){ c.beginPath(); c.moveTo(B[0] - 6, B[1] + 6); c.quadraticCurveTo((B[0] + E[0])/2 - 14*side, (B[1] + E[1])/2 + 10, E[0] - 4, E[1] + 6); c.strokeStyle = '#2B3036'; c.lineWidth = 3; c.stroke(); }
  tube(c, B[0], B[1], E[0], E[1], 21); band(c, B[0], B[1], E[0], E[1], 21, .55, o.kind, o.chevron);
  tube(c, E[0], E[1], W1[0], W1[1], 16); band(c, E[0], E[1], W1[0], W1[1], 16, .5, o.kind, o.chevron);
  housing(c, B[0], B[1], 15, o.ring, o.lit); housing(c, E[0], E[1], 12, o.ring, false);
  tube(c, W1[0], W1[1], W2[0], W2[1], 11); housing(c, W1[0], W1[1], 9, o.ring, false); housing(c, W2[0], W2[1], 8.5, o.ring, o.lit);
  c.save(); c.translate(F[0], F[1]); c.rotate(Math.atan2(dy, dx));
  rr(c, -3, -9, 7, 18, 2); fillInk(c, '#59636D', 1.6);                                               // the tool flange
  if (o.effector) o.effector(c);
  c.restore();
  return { E, W1, W2, F };
}
// where the arm is bolted on: a round base flange on a pedestal, a ceiling plate, or a wall bracket
function baseFlange(c, x, y, mount){
  if (mount === 'ceiling'){ rr(c, x - 20, y - 14, 40, 8, 3); fillInk(c, '#59636D', 2); rr(c, x - 12, y - 8, 24, 10, 4); fillInk(c, '#F4F6F7', 2); return; }
  if (mount === 'wall-l' || mount === 'wall-r'){ const d = mount === 'wall-l' ? -1 : 1; rr(c, x + d*14 - 4, y - 16, 8, 32, 3); fillInk(c, '#59636D', 2); return; }
  c.beginPath(); c.ellipse(x, y + 12, 18, 5, 0, 0, Math.PI*2); fillInk(c, '#59636D', 2);
  rr(c, x - 13, y - 2, 26, 14, 5); fillInk(c, '#F4F6F7', 2); c.fillStyle = '#2F353B'; c.fillRect(x - 13, y + 4, 26, 3);
}

// Carriers hang upside down from a trolley on an overhead track bolted under whatever is above (a deck, a grating, a
// cell, the roof), the way cobots are moved over distance in real plants. The trolley follows the gripper, so the arm
// itself stays a cobot's size. base(): where the trolley and the arm's base are for a gripper at feet.
const ARM = 1.55;                                                  // each of the arm's two links, in tiles
function roofOf(L){ if (L.roofY === undefined){ const r = L.scenery.find(s => s.type === 'roof'); L.roofY = L.top; L._roof = r; } return L.roofY; }
function ceilingAt(L, x, y){ const r = L._roof; let best = r && x >= r.x0 && x <= r.x1 ? r.y : L.top; for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && s.y + s.h <= y + .01 && s.y + s.h > best) best = s.y + s.h; return best; }
function carrierBase(L, k, feet){
  roofOf(L);
  const side = k.base[0] < k.home[0] ? -1 : 1, bx = feet[0] + side*.75, ceil = ceilingAt(L, bx, feet[1] - 1.75);
  return { bx, by:Math.max(feet[1] - 2.85, ceil + .65), ceil, side };
}
// the track pieces for one carrier: every place its trolley can be, grouped by the ceiling it runs under
function trackOf(L, k){
  if (k._track) return k._track;
  const E = M.L3, pts = [];
  for (let i = 0; i <= 20; i++) pts.push([k.home[0] - k.sway + 2*k.sway*i/20, k.home[1]]);
  for (const d of k.drops) for (let i = 0; i <= 60; i++) pts.push(E.carryPath(k, i/60, k.home, d));
  const segs = [];
  for (const f of pts){ const b = carrierBase(L, k, f), key = b.ceil.toFixed(2); let g = segs.find(g => g.key === key && b.bx >= g.x0 - 1.2 && b.bx <= g.x1 + 1.2);
    if (g){ g.x0 = Math.min(g.x0, b.bx); g.x1 = Math.max(g.x1, b.bx); } else segs.push({ key, y:b.ceil, x0:b.bx, x1:b.bx }); }
  return (k._track = segs);
}
A3.track = function(c, L, k){
  for (const g of trackOf(L, k)){
    const x0 = (g.x0 - .6)*T, x1 = (g.x1 + .6)*T, y = g.y*T;
    c.fillStyle = '#56616C'; c.fillRect(x0, y, x1 - x0, 7); c.fillStyle = '#9AA6B0'; c.fillRect(x0, y + 5, x1 - x0, 2);
    c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(x0, y, x1 - x0, 7);
    c.fillStyle = P.mint; c.fillRect(x0, y, 5, 7); c.fillRect(x1 - 5, y, 5, 7);
    for (let bx = x0 + 14; bx < x1 - 8; bx += 48) A.bolt(c, bx, y + 3.5, 1.8);
  }
};
// A carrier, drawn in two parts so that, when it holds him, the gripper's fingers are in front of Mike and the arm
// behind. The floor under its hovering gripper is marked with mint chevrons: the reach he has to jump.
A3.carrierBack = function(c, k, p, t, L){
  const home = p.st === 'ready' || p.st === 'rest', ready = p.st === 'ready';
  if (home){
    const x0 = (k.home[0] - k.sway - .6)*T, x1 = (k.home[0] + k.sway + .6)*T, y = k.home[1]*T;
    c.save(); c.globalAlpha = ready ? .9 : .4; c.fillStyle = P.mint;
    for (let x = x0 + 4; x < x1 - 6; x += 12){ c.beginPath(); c.moveTo(x, y - 1); c.lineTo(x + 5, y - 5); c.lineTo(x + 10, y - 1); c.lineTo(x + 7, y - 1); c.lineTo(x + 5, y - 3); c.lineTo(x + 3, y - 1); c.closePath(); c.fill(); }
    c.restore();
  }
  const b = carrierBase(L || A3.L, k, p.feet), B = [b.bx*T, b.by*T], tip = [p.tip[0]*T, p.tip[1]*T], dirx = Math.sign(p.next[0] - k.home[0]) || 1;
  // the trolley under the track, and the drop-rod down to the arm's base
  rr(c, B[0] - 16, b.ceil*T + 6, 32, 12, 4); fillInk(c, '#3A4148', 2); for (const wx of [-9, 9]){ circ(c, B[0] + wx, b.ceil*T + 6, 4); fillInk(c, '#A8B2BB', 1.4); }
  rr(c, B[0] - 4, b.ceil*T + 16, 8, Math.max(0, B[1] - b.ceil*T - 26), 3); fillInk(c, '#59636D', 1.6);
  baseFlange(c, B[0], B[1], 'ceiling');
  const pulse = ready ? .5 + .5*Math.sin(t*4) : 1;
  cobot(c, { base:B, tip, dir:[0, 1], link:ARM*T, up:false, kind:'carrier', ring:P.mint, lit:ready ? pulse > .3 : !home, chevron:dirx, side:-b.side, reachTool:18, cable:false });
  // the palm of the gripper; the fingers are drawn after Mike
  rr(c, tip[0] - 15, tip[1] - 20, 30, 9, 4); fillInk(c, '#3A4148', 2);
  // where it will send him next, on a little display by its base: an arrow for up, down, on or back
  const up = p.next[1] < k.home[1] - .5, down = p.next[1] > k.home[1] + .5, gx = B[0] + (k.mount === 'ceiling' ? 0 : 22), gy = B[1] + (k.mount === 'ceiling' ? 16 : -18);
  circ(c, gx, gy, 8); fillInk(c, '#1E2429', 1.5);
  c.save(); c.translate(gx, gy); c.rotate(up ? -Math.PI/2 : down ? Math.PI/2 : dirx > 0 ? 0 : Math.PI); c.fillStyle = P.mintL; c.beginPath(); c.moveTo(5, 0); c.lineTo(-2, -4.5); c.lineTo(-2, 4.5); c.closePath(); c.fill(); c.restore();
  return tip;
};
A3.carrierFront = function(c, k, p, t){
  const x = p.tip[0]*T, y = p.tip[1]*T, open = p.open;
  // two soft adaptive fingers closing round his waist, mint pads inward
  for (const s of [-1, 1]){
    const ox = s*(13 + open*12);
    c.save(); c.translate(x, y - 12);
    c.beginPath(); c.moveTo(s*9, 0); c.quadraticCurveTo(ox + s*8, 6, ox + s*2, 24); c.lineTo(ox - s*5, 24); c.quadraticCurveTo(ox - s*1, 10, s*3, 4); c.closePath(); fillInk(c, '#F4F6F7', 2.2);
    rr(c, ox - (s > 0 ? 8 : 1), 13, 9, 11, 4); c.fillStyle = P.mint; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }
};
A3.hook = function(c, h, p, t){
  const x = p.x*T, y = h.y*T, hy = p.hy*T;
  rr(c, x - 16, y - 16, 32, 20, 5); fillInk(c, P.joint, 2); for (const wx of [-9, 9]){ circ(c, x + wx, y - 8, 5); fillInk(c, '#A8B2BB', 1.5); }
  line(c, x, y + 4, x, hy - 4, '#2D333A', 2.5);
  rr(c, x - 17, hy - 5, 34, 10, 5); c.fillStyle = P.mint; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke();
  c.fillStyle = C.white; for (const s of [-1, 1]){ c.beginPath(); c.moveTo(x + s*8, hy - 3); c.lineTo(x + s*12, hy); c.lineTo(x + s*8, hy + 3); c.closePath(); c.fill(); }
};

// ---------- hazards ----------
// tools drawn from the flange along +x
function tool(c, kind, active, t){
  if (kind === 'welder'){                                         // spot-weld gun: a C-frame, two copper tips that glow while live
    c.beginPath(); c.moveTo(4, -12); c.lineTo(24, -12); c.lineTo(24, 12); c.lineTo(4, 12); c.lineTo(4, 7); c.lineTo(18, 7); c.lineTo(18, -7); c.lineTo(4, -7); c.closePath(); fillInk(c, '#4A525C', 2);
    for (const s of [-1, 1]){ rr(c, 15, s*7 - (s > 0 ? 0 : 6), 10, 6, 2); fillInk(c, '#C87941', 1.5); }
    if (active){ circ(c, 21, 0, 8 + Math.sin(t*40)*2); c.fillStyle = 'rgba(255,220,140,.8)'; c.fill(); for (let i = 0; i < 4; i++){ const a = t*30 + i*1.7; line(c, 21, 0, 21 + Math.cos(a)*16, Math.sin(a)*16, 'rgba(255,230,160,.9)', 2); } }
  } else if (kind === 'spindle'){                                 // a deburring wheel: spins up in the tell, throws sparks while live
    rr(c, 4, -8, 12, 16, 3); fillInk(c, '#4A525C', 2);
    c.save(); c.translate(24, 0); c.rotate(t*(active ? 30 : 2)); circ(c, 0, 0, 11); fillInk(c, '#8C96A0', 2);
    for (let i = 0; i < 8; i++){ const a = i*TAU/8; line(c, Math.cos(a)*4, Math.sin(a)*4, Math.cos(a)*10, Math.sin(a)*10, '#5A636C', 2); } c.restore();
    if (active) for (let i = 0; i < 5; i++){ const a = t*20 + i*1.3; line(c, 32, 0, 32 + Math.cos(a)*18, Math.sin(a)*14, 'rgba(255,210,120,.9)', 2); }
  } else {                                                         // jaws: two steel fingers that snap shut while live
    const g = active ? 2 : 9;
    rr(c, 4, -10, 10, 20, 3); fillInk(c, '#4A525C', 2);
    for (const s of [-1, 1]){ c.beginPath(); c.moveTo(12, s*g); c.lineTo(30, s*(g - 2)); c.lineTo(30, s*(g + 5)); c.lineTo(12, s*(g + 6)); c.closePath(); fillInk(c, '#B9C1C8', 2); }
  }
}
const STATE = { green:'#35C06A', amber:'#F4CA46', red:'#E8503A' };
A3.arm = function(c, a, p, t, slow){
  const B = [a.base[0]*T, a.base[1]*T], tip = [p.tip[0]*T, p.tip[1]*T], ang = p.ang;
  // where the tool sweeps the walkway, the floor is hatched
  if (a.mount === 'floor'){ c.save(); c.globalAlpha = .75; c.translate(0, B[1] + 1.6*T - 4); hazardFill(c, () => { c.beginPath(); c.rect(Math.min(B[0], tip[0]) - a.r*T*.9, 0, a.r*T*.9, 5); }, 4); c.restore(); }
  baseFlange(c, B[0], B[1], a.mount === 'rail' || a.mount === 'floor' ? 'floor' : a.mount);
  const ring = STATE[p.state], flash = p.state !== 'amber' || Math.sin(t*26) > -.3;
  cobot(c, { base:B, tip, dir:[Math.cos(ang), Math.sin(ang)], link:a.link*T, up:a.mount !== 'ceiling', kind:'hazard', ring, lit:flash, side:Math.cos(ang) >= 0 ? -1 : 1, reachTool:30,
    effector:cc => tool(cc, a.tool, p.active, t) });
  if (slow) A.slowOutline(c, Math.min(B[0], tip[0]) - 40, Math.min(B[1], tip[1]) - 40, Math.abs(tip[0] - B[0]) + 80, Math.abs(tip[1] - B[1]) + 80);
};
A3.rover = function(c, r, p, t){
  const x = p.x*T, y = r.y*T, w = 1.6*T, h = .9*T;
  if (r.tall){                                                    // a rack on top carrying boxes, higher than he can jump
    const top = y - A3.roverTall*T;
    c.strokeStyle = '#4A525C'; c.lineWidth = 4; c.strokeRect(x - w/2 + 4, top, w - 8, A3.roverTall*T - h);
    line(c, x - w/2 + 4, top + (A3.roverTall*T - h)/2, x + w/2 - 4, top + (A3.roverTall*T - h)/2, '#4A525C', 4);
    for (const [bx, by] of [[-10, top + 4], [8, top + 6], [-6, top + (A3.roverTall*T - h)/2 + 4]]){ rr(c, x + bx - 10, by, 20, 18, 2); fillInk(c, P.crate, 1.5); c.fillStyle = P.tape; c.fillRect(x + bx - 2, by, 4, 18); }
  }
  rr(c, x - w/2, y - h, w, h - 6, 7); fillInk(c, A.vgrad(c, y - h, y, ['#4E5761', '#2F363D']), 2.5);
  c.save(); c.translate(0, 0); hazardFill(c, () => { c.beginPath(); c.rect(x - w/2 + 3, y - 16, w - 6, 8); }, 4); c.restore();
  for (const wx of [-w/2 + 10, w/2 - 10]){ circ(c, x + wx, y - 5, 6); fillInk(c, '#20252A', 2); }
  // the beacon: amber and turning while it drives, steady while it waits; a white arrow the way it goes next
  const on = p.moving ? Math.sin(t*12) > 0 : true; lamp(c, x, y - h - 4, p.moving ? P.amber : '#E0A030', on, 5);
  c.fillStyle = C.white; c.beginPath(); const d = p.dir; c.moveTo(x + d*10, y - h + 12); c.lineTo(x + d*2, y - h + 7); c.lineTo(x + d*2, y - h + 17); c.closePath(); c.fill();
};
A3.roverTall = 3.2;
// A crate and its shadow. The shadow is the tell: it darkens on the surface below while the crate waits to fall.
A3.crate = function(c, k, t){
  const x = k.x*T, fy = k.floor*T;
  if (k.stage === 'tell' || k.stage === 'fall'){
    const u = k.stage === 'tell' ? k.u : 1, a = .18 + .42*u;
    c.fillStyle = `rgba(10,14,18,${a})`; c.beginPath(); c.ellipse(x, fy - 1, 12 + 8*u, 4 + 1.5*u, 0, 0, TAU); c.fill();
    if (k.stage === 'tell' && Math.sin(t*22) > 0){ c.strokeStyle = P.amber; c.lineWidth = 2; c.beginPath(); c.ellipse(x, fy - 1, 22, 6, 0, 0, TAU); c.stroke(); }
  }
  if (k.stage === 'smash'){ const u = k.u; for (let i = 0; i < 6; i++){ const a = -Math.PI*(.15 + .7*i/5), d = 8 + 30*u; c.save(); c.globalAlpha = 1 - u; c.translate(x + Math.cos(a)*d, fy - 6 + Math.sin(a)*d*.7 + 20*u*u); c.rotate(u*4 + i); c.fillStyle = i % 2 ? P.crate : P.crateD; c.fillRect(-6, -3, 12, 6); c.restore(); } return; }
  const bottom = k.bottom*T, s = .9*T;
  if (k.colour){ crateBox(c, x, bottom - s/2, s, k.colour); return; }
  rr(c, x - s/2, bottom - s, s, s, 2); fillInk(c, P.crate, 2); c.fillStyle = P.tape; c.fillRect(x - 3, bottom - s, 6, s); c.strokeStyle = P.crateD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - s/2 + 3, bottom - s + 6); c.lineTo(x + s/2 - 3, bottom - s + 6); c.stroke();
};
A3.feederLamp = function(c, d, k, t){ const x = d.x*T, y = d.top*T - 24; lamp(c, x + 30, y + 10, P.amber, k.stage === 'tell' && Math.sin(t*22) > -.2, 4); };

// ---------- the Teach Cell ----------
// Revision 3 (owner, 2 Oct: the puzzle and the hazards must be the same thing). The Big Arm's program is drawn on the
// back wall as a route: rails between waypoints, each waypoint a dial pointing to the next. The part of the route the
// arm will follow now is lit in the colour of the crate it carries; where it breaks, the dial shows a red cross, and
// that is where the crate will fall. Holding Fix at a dial fills a ring round it and turns it to its next exit.
const CRATE = { orange:['#FF8A1F', '#FFD08A', '#5A2E00'], blue:['#3D8BFF', '#A9CCFF', '#0B2A5A'] };
A3.CRATE = CRATE;
function crateBox(c, x, y, s, colour){ const [f, tape, ink] = CRATE[colour] || CRATE.orange;
  rr(c, x - s/2, y - s/2, s, s, s*.1); c.fillStyle = f; c.fill(); c.lineWidth = 2; c.strokeStyle = ink; c.stroke(); c.fillStyle = tape; c.fillRect(x - s*.09, y - s/2, s*.18, s); }
function edgesOf(def){
  if (def._edges) return def._edges;
  const seen = new Set(), out = Object.entries(def.chutes).map(([id, ch]) => [id, ch.first]);
  for (const [id, n] of Object.entries(def.nodes)) for (const e of n.exits){ if (def.chutes[e]) continue; const k = [id, e].sort().join('|'); if (!seen.has(k)){ seen.add(k); out.push([id, e]); } }
  return (def._edges = out);
}
const NP = (def, id) => M.L3.nodePos(def, id);
// The chutes in use this round (the right-hand one only once a second arm works from it).
const chuteLive = (st, id) => st.boss.done ? id === 'L' : (st.S.L.boss.rounds[Math.min(st.boss.round, st.S.L.boss.rounds.length - 1)].sources || []).some(s => s.chute === id);
// The rails, the lit routes, the dials, the chutes and the pallets: everything of the program that is on the wall.
A3.route = function(c, L, st, t){
  const def = L.boss, px = id => NP(def, id)[0]*T, py = id => NP(def, id)[1]*T, B = st.boss, routes = st.routes || [];
  const idle = id => def.pallets[id] && !M.L3.palletLive(st.S, id) || def.chutes[id] && !chuteLive(st, id);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [a, b] of edgesOf(def)){ if (idle(a) || idle(b)) c.globalAlpha = .35;
    c.beginPath(); c.moveTo(px(a), py(a)); c.lineTo(px(b), py(b)); c.strokeStyle = '#1C262E'; c.lineWidth = 12; c.stroke(); c.strokeStyle = '#3E5562'; c.lineWidth = 5; c.stroke(); c.globalAlpha = 1; }
  // the lit routes: the way each arm's crate will go now, in the crate's colour
  for (const r of routes){
    const col = CRATE[r.colour][0];
    c.beginPath(); r.path.forEach((id, k) => k ? c.lineTo(px(id), py(id)) : c.moveTo(px(id), py(id)));
    c.strokeStyle = col + '55'; c.lineWidth = 16; c.stroke(); c.strokeStyle = col; c.lineWidth = 6; c.stroke();
    // light running along it, toward where it ends
    const n = r.path.length - 1; for (let k = 0; k < n; k++){ const u = ((t*1.4 - k*.35) % 1 + 1) % 1, x = px(r.path[k]) + (px(r.path[k + 1]) - px(r.path[k]))*u, y = py(r.path[k]) + (py(r.path[k + 1]) - py(r.path[k]))*u; circ(c, x, y, 3.5); c.fillStyle = '#fff'; c.fill(); }
  }
  c.restore();
  // the chutes: crates come in here, in the colour that arm is taking; a chute not in use is shuttered
  for (const [id, ch] of Object.entries(def.chutes)){
    const X = ch.at[0]*T, Y = ch.at[1]*T, live = chuteLive(st, id), src = routes.find(r => r.path[0] === id);
    rr(c, X - 26, Y - 22, 52, 30, 6); fillInk(c, '#3A4148', 2.5); rr(c, X - 18, Y - 16, 36, 20, 3); c.fillStyle = '#10161D'; c.fill();
    if (live && src){ crateBox(c, X - 7, Y - 6, 14, src.colour); crateBox(c, X + 8, Y - 6, 14, src.colour); }
    else if (!live){ for (let k = 0; k < 4; k++){ rr(c, X - 18, Y - 16 + k*5, 36, 4, 1); c.fillStyle = '#59636D'; c.fill(); } }
  }
  // three lamps in the middle of the cell count the rounds put right
  const LX = (def.bounds[0] + def.bounds[2]/2)*T, LY = def.chutes.L.at[1]*T - 10;
  rr(c, LX - 32, LY - 11, 64, 22, 8); fillInk(c, '#2A3138', 2);
  for (let k = 0; k < 3; k++) lamp(c, LX - 18 + k*18, LY, k < B.round || B.done ? P.safe : P.red, true, 5);
  // the pallets: orange-trimmed and blue-trimmed; one not in use this round is dimmed
  for (const [id, pl] of Object.entries(def.pallets)){
    const live = M.L3.palletLive(st.S, id) || B.done, x = pl.at[0]*T, y = pl.at[1]*T, trim = CRATE[pl.colour][0];
    c.save(); c.globalAlpha = live ? 1 : .3;
    if (live){ const u = (t*1.3) % 1; c.strokeStyle = trim; c.globalAlpha = .8 - .6*u; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - 6, 26 + 14*u, 8 + 4*u, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    for (const dy of [-16, -9]){ rr(c, x - 26, y + dy, 52, 6, 2); fillInk(c, '#2FBF71', 1.5); }
    for (const dx of [-24, -3, 18]){ rr(c, x + dx, y - 4, 6, 4, 1); fillInk(c, '#2FBF71', 1.2); }
    rr(c, x - 26, y - 22, 52, 5, 2); c.fillStyle = trim; c.fill();
    if (pl.stack) for (let k = 0; k < pl.stack; k++) crateBox(c, x - 12 + (k % 3)*12, y - 30 - Math.floor(k/3)*12, 12, pl.colour);
    c.restore();
  }
  // the dials
  for (const [id, n] of Object.entries(def.nodes)){
    const [x, y] = NP(def, id).map(v => v*T), on = routes.some(r => r.path.includes(id)), broke = routes.find(r => r.broken && r.end === id);
    // a dial is mounted on a bracket from the wall
    rr(c, x - 4, y + 14, 8, 10, 2); c.fillStyle = '#39424C'; c.fill();
    circ(c, x, y, 18); fillInk(c, '#2F353B', 2.5);
    circ(c, x, y, 13); c.strokeStyle = broke ? '#FF5A4A' : on ? (CRATE[(routes.find(r => r.path.includes(id)) || {}).colour] || CRATE.orange)[0] : '#4A5965'; c.lineWidth = 3; c.stroke();
    const arrowTo = (to, col, w) => { const [tx, ty] = NP(def, to).map(v => v*T), a = Math.atan2(ty - y, tx - x);
      c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = col; c.lineWidth = w || 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-4, 0); c.lineTo(11, 0); c.stroke();
      c.fillStyle = col; c.beginPath(); c.moveTo(17, 0); c.lineTo(9, -6); c.lineTo(9, 6); c.closePath(); c.fill(); c.restore(); };
    arrowTo(n.exits[B.dials[id]], '#FFE27A');
    if (broke && Math.sin(t*10) > -.3){ const ex = x + 22, ey = y - 18; c.strokeStyle = '#1B1F24'; c.lineWidth = 6; c.beginPath(); c.moveTo(ex - 6, ey - 6); c.lineTo(ex + 6, ey + 6); c.moveTo(ex + 6, ey - 6); c.lineTo(ex - 6, ey + 6); c.stroke(); c.strokeStyle = '#FF5A4A'; c.lineWidth = 3.5; c.stroke(); }
    if (B.dial === id && B.fix > 0){ c.beginPath(); c.arc(x, y, 23, -Math.PI/2, -Math.PI/2 + TAU*B.fix); c.strokeStyle = '#FFE27A'; c.lineWidth = 5; c.stroke(); }
    else if (B.dial === id){ circ(c, x, y, 23); c.strokeStyle = 'rgba(255,226,122,.5)'; c.lineWidth = 2; c.stroke(); }
  }
};
// The Big Arm: a gantry cobot on the ceiling track with a telescoping mast, a short cobot wrist and a vacuum gripper,
// carrying a crate in the colour it is taking. Its light rings: amber while it warns (before letting go, and before a
// sweep), red while its program is wrong, green once it is put right. Empty-handed it carries a striped sweeper head;
// sw (from M.L3.sweepOf) is where the next sweep runs: dashed amber while it lowers, flashing red as it aims, and the
// band ahead of it while it sweeps.
A3.bigArm = function(c, L, arm, t, restored, sw){
  if (!arm) return;
  const y0 = L.boss.track*T, x = arm.x*T, gy = arm.y*T - 30, st = arm.st, RS = M.L3.R.sweep*T;
  if (sw && !restored && (st === 'lower' || st === 'aim' || st === 'sweep')){
    const yy = sw.y*T, xa = st === 'sweep' ? x : sw.from*T, xb = sw.to*T, dir = Math.sign(xb - xa) || 1, hot = st !== 'lower', flash = Math.sin(t*22) > -.2;
    c.save(); c.globalAlpha = st === 'lower' ? .6 : 1;
    c.fillStyle = hot ? 'rgba(232,80,58,.2)' : 'rgba(244,202,70,.12)'; c.fillRect(Math.min(xa, xb), yy - RS, Math.abs(xb - xa), 2*RS);
    c.setLineDash([12, 8]); c.lineDashOffset = -t*80*dir; c.strokeStyle = hot && flash ? '#FF5A4A' : '#F4CA46'; c.lineWidth = 3;
    for (const e of [-RS, RS]){ c.beginPath(); c.moveTo(xa, yy + e); c.lineTo(xb, yy + e); c.stroke(); }
    c.setLineDash([]); c.lineWidth = 3.5; c.lineJoin = 'round';
    const n = Math.max(1, Math.floor(Math.abs(xb - xa)/90));
    for (let k = 1; k <= n; k++){ const cx = xa + (xb - xa)*(k - .5)/n; c.beginPath(); c.moveTo(cx - 7*dir, yy - 9); c.lineTo(cx + 5*dir, yy); c.lineTo(cx - 7*dir, yy + 9); c.stroke(); }
    c.restore();
  }
  rr(c, x - 30, y0 - 18, 60, 30, 6); fillInk(c, '#3A4148', 2.5); for (const wx of [-17, 17]){ circ(c, x + wx, y0 - 10, 6); fillInk(c, '#A8B2BB', 1.5); }
  const mt = y0 + 12, mb = gy - 34;
  // a two-stage telescopic mast, slim and dark so it never hides the cell
  if (mb > mt){ const mid = mt + (mb - mt)*.45;
    rr(c, x - 6, mt, 12, mid - mt + 6, 3); fillInk(c, '#4A525C', 1.8); rr(c, x - 4, mid, 8, mb - mid, 3); fillInk(c, '#6C7580', 1.6);
    c.save(); c.beginPath(); c.rect(x - 6, mt + 4, 12, 10); c.clip(); c.fillStyle = P.black; c.fillRect(x - 7, mt, 14, 20); c.fillStyle = P.warn; for (let k = -2; k < 4; k++){ c.beginPath(); c.moveTo(x - 6 + k*6, mt + 14); c.lineTo(x - 3 + k*6, mt + 14); c.lineTo(x + 4 + k*6, mt + 4); c.lineTo(x + 1 + k*6, mt + 4); c.closePath(); c.fill(); } c.restore(); }
  const warns = st === 'tell' || st === 'aim', ring = restored ? '#35C06A' : warns ? '#F4CA46' : '#E8503A', lit = !warns || Math.sin(t*24) > -.3;
  const carrying = st === 'move' || st === 'tell' || st === 'place' || (st === 'load' && arm.t > .35), sweeper = !carrying && !restored && st !== 'load' && st !== 'wait';
  if (st === 'sweep'){ const back = -Math.sign(sw ? sw.to - sw.from : 1); for (let k = 1; k <= 3; k++){ c.fillStyle = `rgba(255,90,74,${.22 - k*.06})`; circ(c, x + back*k*14, arm.y*T, RS*(1 - k*.12)); c.fill(); } }
  cobot(c, { base:[x, Math.max(mt + 10, mb)], tip:[x, gy + 6], dir:[0, 1], link:.75*T, up:false, kind:'hazard', ring, lit, side:1, reachTool:12, cable:false,
    effector:cc => { rr(cc, 2, -16, 7, 32, 3); fillInk(cc, '#4A525C', 2);
      if (!sweeper) return;
      // the sweeper head: a striped bumper hung under the pad, centred where it hits
      rr(cc, 8, -4, 10, 8, 2); fillInk(cc, '#4A525C', 1.5);
      const hot = st === 'sweep' || (st === 'aim' && Math.sin(t*22) > -.2);
      cc.save(); rr(cc, 16, -RS*.8, 2*RS, 1.6*RS, 7); cc.clip(); cc.fillStyle = hot ? '#E8503A' : '#6A3A34'; cc.fillRect(14, -RS, 2*RS + 6, 2*RS);
      cc.fillStyle = hot ? P.black : '#2A2F35'; for (let k = -3; k < 6; k++){ cc.beginPath(); cc.moveTo(16 + k*10, -RS); cc.lineTo(22 + k*10, -RS); cc.lineTo(32 + k*10, RS); cc.lineTo(26 + k*10, RS); cc.closePath(); cc.fill(); }
      cc.restore(); rr(cc, 16, -RS*.8, 2*RS, 1.6*RS, 7); cc.strokeStyle = P.ink; cc.lineWidth = 2; cc.stroke(); } });
  if (carrying) crateBox(c, x, gy + 22, .9*T, arm.colour);
  if (arm.st === 'tell'){ const floor = L.surfaceBelow(arm.x, arm.y + .7); if (floor !== null){ const u = .5 + .5*Math.sin(t*14); c.fillStyle = `rgba(10,14,18,${.3 + .25*u})`; c.beginPath(); c.ellipse(x, floor*T - 1, 18, 5, 0, 0, TAU); c.fill(); c.strokeStyle = '#F4CA46'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, floor*T - 1, 24, 7, 0, 0, TAU); c.stroke(); } }
};
A3.door = function(c, d, open, t){
  const x = d.x*T, top = d.top*T, h = d.h*T, lift = open*h;
  c.fillStyle = '#10161D'; c.fillRect(x - 4, top, d.w*T + 8, h);
  c.save(); c.beginPath(); c.rect(x - 4, top, d.w*T + 8, h); c.clip();
  c.fillStyle = A.vgrad(c, top - lift, top - lift + h, ['#B9C0C7', '#7F8890']); c.fillRect(x, top - lift, d.w*T, h);
  c.strokeStyle = 'rgba(20,20,22,.35)'; c.lineWidth = 2; for (let yy = top - lift + 10; yy < top - lift + h; yy += 10) line(c, x, yy, x + d.w*T, yy, 'rgba(20,20,22,.35)', 2);
  A.stripes(c, x, top - lift + h - 10, d.w*T, 10, 5); c.restore();
  lamp(c, x + d.w*T/2, top - 8, open > .9 ? P.safe : P.red, true, 4);
};
})();
