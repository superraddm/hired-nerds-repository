// The machines. They are drawn as recognisable machine-tool parts: chucks, turrets, spindle heads, tool holders, end
// mills, drills, grinding wheels, press tooling, coolant hose, chip conveyors, stack lights. Every one is generic: no
// brand, logo, model name, livery or any one manufacturer's shape. Neutral greys, small yellow safety marks.
// World pixels, T = 32. Each hazard is drawn from its level data and its machine clock t (seconds into its cycle).
(function(){
'use strict';
const M = window.MIKE, A = M.art, T = A.T, C = A.C, FONT = A.FONT;
const { rr, ink, fillInk, circ, stripes, bolt, vgrad, hgrad, dotted } = A;
const TAU = Math.PI*2;
const GLASS = '#0A2C4A', HOSE = '#2B2F33';

// ---------- shared parts ----------
// A tower light: green, amber, red from the bottom. lit = 'green' | 'amber' | 'red' | null.
function stackLight(c, x, yb, lit, on){
  c.fillStyle = C.dark; c.fillRect(x - 2, yb - 8, 4, 8);
  const segs = [['green', '#35C06A', '#1E4A30'], ['amber', '#F4CA46', '#5A4A1A'], ['red', '#E8503A', '#5A2018']];
  segs.forEach(([name, hot, cold], i) => {
    const y = yb - 8 - (i + 1)*9, isOn = lit === name && on !== false;
    rr(c, x - 6, y, 12, 9, 2); fillInk(c, isOn ? hot : cold, 1.5);
    if (isOn){ c.fillStyle = hot + '55'; circ(c, x, y + 4.5, 12); c.fill(); }
  });
  rr(c, x - 6, yb - 39, 12, 4, 2); fillInk(c, C.dark, 1.5);
}
// Swarf: a curly chip.
function swarf(c, x, y, s, a){
  c.save(); c.translate(x, y); c.rotate(a || 0); c.scale(s || 1, s || 1); c.lineCap = 'round';
  const path = () => { c.beginPath(); for (let i = 0; i <= 26; i++){ const ang = i*.55, r = 1.5 + i*.28; c.lineTo(Math.cos(ang)*r + i*.25, Math.sin(ang)*r); } };
  path(); c.strokeStyle = C.ink; c.lineWidth = 3.4; c.stroke(); path(); c.strokeStyle = '#D5DADF'; c.lineWidth = 1.8; c.stroke();
  c.restore();
}
// A cutting tool in its holder, drawn along +y from the spindle nose at the origin. kind: 'endmill' | 'drill'.
function tool(c, kind, len, r, spin){
  // holder: V-flange, body, collet nut
  rr(c, -r*1.5, 0, r*3, 7, 2); fillInk(c, C.steel, 2);
  c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r*1.5, 3.5); c.lineTo(r*1.5, 3.5); c.stroke();
  c.beginPath(); c.moveTo(-r*1.2, 7); c.lineTo(r*1.2, 7); c.lineTo(r*.85, 15); c.lineTo(-r*.85, 15); c.closePath(); fillInk(c, C.steelL, 2);
  const y0 = 15, L = len - 15, w = kind === 'drill' ? r*.55 : r*.8;
  c.save();
  c.beginPath();
  if (kind === 'drill'){ c.moveTo(-w, y0); c.lineTo(w, y0); c.lineTo(w, y0 + L - w*1.4); c.lineTo(0, y0 + L); c.lineTo(-w, y0 + L - w*1.4); c.closePath(); }
  else rr(c, -w, y0, w*2, L, w*.35);
  c.fillStyle = C.steelXL; c.fill(); c.save(); c.clip();
  // helical flutes, moving with spin
  c.strokeStyle = '#6E757C'; c.lineWidth = w*.55;
  const pitch = w*2.2, off = ((spin || 0)*pitch*3) % pitch;
  for (let y = y0 - w*2 + off + (kind === 'drill' ? 0 : L*.3); y < y0 + L + w*2; y += pitch){ c.beginPath(); c.moveTo(-w*1.2, y); c.lineTo(w*1.2, y - w*1.6); c.stroke(); }
  c.restore(); ink(c, 2);
  c.restore();
}
// A spindle head: motor housing with fins over a nose, tool below. Origin at the tool's tip region top.
function spindleHead(c, w, h){
  rr(c, -w/2, -h, w, h, 8); fillInk(c, vgrad(c, -h, 0, [C.steelXL, C.steelL]), 2.5);
  c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 2; for (let x = -w/2 + 8; x < w/2 - 4; x += 7){ c.beginPath(); c.moveTo(x, -h + 6); c.lineTo(x, -h*.45); c.stroke(); }
  c.fillStyle = C.warn; c.fillRect(-w/2 + 2, -10, w - 4, 4);
  rr(c, -w*.28, -2, w*.56, 8, 3); fillInk(c, C.steel, 2);
}
// A three-jaw chuck face-on. Used big for the Turner, small for lathes.
function chuckFace(c, R, spin, ticks){
  circ(c, 0, 0, R); fillInk(c, (() => { const g = c.createRadialGradient(-R*.3, -R*.3, R*.1, 0, 0, R); g.addColorStop(0, C.steelXL); g.addColorStop(.75, C.steelL); g.addColorStop(1, C.steel); return g; })(), Math.max(2, R*.05));
  c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = Math.max(1, R*.02); circ(c, 0, 0, R*.9); c.stroke();
  c.save(); c.rotate(spin);
  for (let k = 0; k < 3; k++){
    c.save(); c.rotate(k*TAU/3);
    rr(c, R*.22, -R*.09, R*.72, R*.18, R*.03); fillInk(c, C.dark, Math.max(1.5, R*.02));
    // a stepped master jaw
    c.beginPath(); c.moveTo(R*.34, -R*.13); c.lineTo(R*.62, -R*.13); c.lineTo(R*.62, -R*.07); c.lineTo(R*.82, -R*.07); c.lineTo(R*.82, R*.13); c.lineTo(R*.34, R*.13); c.closePath();
    fillInk(c, C.steelXL, Math.max(1.5, R*.025));
    for (let i = 1; i < 4; i++){ c.strokeStyle = 'rgba(20,20,22,.35)'; c.lineWidth = Math.max(1, R*.012); c.beginPath(); c.moveTo(R*(.36 + i*.06), -R*.1); c.lineTo(R*(.36 + i*.06), R*.1); c.stroke(); }
    c.restore();
    const a = k*TAU/3 + TAU/6; bolt(c, Math.cos(a)*R*.55, Math.sin(a)*R*.55, Math.max(2, R*.05));
  }
  c.restore();
  circ(c, 0, 0, R*.2); fillInk(c, C.dark, Math.max(1.5, R*.03)); circ(c, 0, 0, R*.1); c.fillStyle = '#000'; c.fill();
  if (ticks) for (let i = 0; i < 16; i++){ const a = i/16*TAU; c.save(); c.rotate(a); c.fillStyle = ticks; rr(c, R*.93, -R*.025, R*.06, R*.05, 1); c.fill(); c.restore(); }
}
// The gate signal on the entry pad: a traffic light. Red while the doors are shut, amber just before they open (the
// moment to switch the camera on), green while they are open. hint: show the camera prompt beside the amber lamp.
A.gateSignal = function(c, xT, state, hint, t){
  const X = xT*T, Y = 12*T, top = 6.1*T;
  c.fillStyle = C.steelD; rr(c, X - 4, top + 70, 8, Y - top - 70, 3); c.fill(); ink(c, 2);
  rr(c, X - 12, Y - 6, 24, 6, 2); fillInk(c, C.steel, 2);
  rr(c, X - 17, top, 34, 76, 9); fillInk(c, C.dark, 3);
  const lamps = [['red', '#E8503A', '#4A1E18'], ['amber', '#F4CA46', '#4A3E16'], ['green', '#35C06A', '#163A24']];
  lamps.forEach(([name, hot, cold], i) => {
    const on = state === name && (name !== 'amber' || Math.sin(t*22) > -.6), y = top + 13 + i*25;
    if (on){ c.fillStyle = hot + '55'; circ(c, X, y, 17); c.fill(); }
    circ(c, X, y, 10); fillInk(c, on ? hot : cold, 2);
    if (on){ c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, X - 3, y - 3, 3); c.fill(); }
  });
  if (hint){
    const pulse = 1 + .1*Math.sin(t*14);
    c.save(); c.translate(X + 44, top + 38); c.scale(pulse, pulse);
    rr(c, -24, -18, 48, 36, 10); c.fillStyle = 'rgba(0,44,90,.92)'; c.fill(); c.strokeStyle = C.warn; c.lineWidth = 3; c.stroke();
    A.cameraIcon(c, 0, 0, 1, C.white); c.restore();
  }
};
A.stackLight = stackLight; A.swarf = swarf; A.tool = tool; A.chuckFace = chuckFace;

// ---------- the building: machine columns and background machines ----------
// A roof block over a gate: a machine column with a telescopic way cover down its middle.
A.housing = function(c, s){
  const x = s.x*T, y = s.y*T, w = s.w*T, h = s.h*T;
  c.fillStyle = hgrad(c, x, x + w, [C.steelD, C.steel, '#7C848C', C.steel, C.steelD]); c.fillRect(x, y, w, h);
  c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 1.5, y); c.lineTo(x + 1.5, y + h); c.moveTo(x + w - 1.5, y); c.lineTo(x + w - 1.5, y + h); c.stroke();
  // cast ribs
  c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 2;
  for (let yy = y + 40; yy < y + h - 20; yy += 48){ c.beginPath(); c.moveTo(x + 4, yy); c.lineTo(x + 18, yy + 14); c.moveTo(x + w - 4, yy); c.lineTo(x + w - 18, yy + 14); c.stroke(); }
  // way cover: overlapping steel plates
  const cw = Math.min(w - 36, 52), cx = x + (w - cw)/2;
  for (let yy = y; yy < y + h - 14; yy += 12){ c.fillStyle = (yy/12) % 2 ? '#8E969E' : '#A4ABB2'; c.fillRect(cx, yy, cw, 12); c.fillStyle = 'rgba(20,20,22,.35)'; c.fillRect(cx, yy + 10, cw, 2); }
  c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(cx, y - 2, cw, h - 12);
  stripes(c, x, y + h - 10, w, 10, 7); c.fillStyle = C.ink; c.fillRect(x, y + h - 2, w, 2);
};
// Generic machine enclosures in the mid layer: a machining centre and a lathe, in navy so they recede.
A.backMachines = function(c){
  const body = '#0B3A6E', edge = '#012347', glass = '#1D5E9E';
  const enclosure = (x, yb, w, h, lathe) => {
    rr(c, x, yb - h, w, h, 12); c.fillStyle = body; c.fill(); c.strokeStyle = edge; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#0D4580'; c.fillRect(x + 6, yb - 30, w - 12, 24);                       // base band
    const dw = lathe ? w*.5 : w*.46;
    rr(c, x + 14, yb - h + 18, dw, h - 58, 8); c.fillStyle = '#0D4580'; c.fill(); c.stroke();  // sliding door
    rr(c, x + 24, yb - h + 28, dw - 20, (h - 58)*.55, 6); c.fillStyle = glass; c.fill();     // door window
    c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(x + 30, yb - h + 28 + (h - 58)*.55); c.lineTo(x + 50, yb - h + 28); c.lineTo(x + 62, yb - h + 28); c.lineTo(x + 42, yb - h + 28 + (h - 58)*.55); c.fill();
    c.fillStyle = edge; c.fillRect(x + 14 + dw - 10, yb - h + 60, 5, 30);                   // handle
    // control pendant on an arm
    const px = x + w - 58;
    c.strokeStyle = edge; c.lineWidth = 5; c.beginPath(); c.moveTo(x + w - 6, yb - h + 30); c.lineTo(px + 22, yb - h + 30); c.lineTo(px + 22, yb - h + 44); c.stroke();
    rr(c, px, yb - h + 44, 44, 64, 5); c.fillStyle = '#0D4580'; c.fill(); c.stroke();
    rr(c, px + 6, yb - h + 50, 32, 22, 2); c.fillStyle = glass; c.fill();
    c.fillStyle = '#2A6FB0'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ circ(c, px + 12 + i*10, yb - h + 82 + j*8, 2.5); c.fill(); }
    // stack light
    c.fillStyle = edge; c.fillRect(x + w - 20, yb - h - 30, 4, 30);
    ['#1E6A45', '#7A6320', '#7A2A20'].forEach((col, i) => { c.fillStyle = col; rr(c, x + w - 24, yb - h - 30 - (i + 1)*9, 12, 9, 2); c.fill(); });
    if (lathe){                                                                             // chip conveyor out of the side
      c.fillStyle = body; c.beginPath(); c.moveTo(x - 4, yb - 40); c.lineTo(x - 70, yb - 90); c.lineTo(x - 70, yb - 70); c.lineTo(x - 4, yb - 20); c.closePath(); c.fill(); c.stroke();
    }
  };
  enclosure(520, 380, 200, 170, false);
  enclosure(990, 380, 230, 140, true);
};

// ---------- Rattle Spitter: a runaway chucking lathe (or, with look "grinder", a pedestal grinder) ----------
function chipBin(c, xT){
  const X = xT*T, Y = 12*T;
  c.beginPath(); c.moveTo(X - 24, Y - 28); c.lineTo(X + 24, Y - 28); c.lineTo(X + 19, Y - 5); c.lineTo(X - 19, Y - 5); c.closePath();
  fillInk(c, vgrad(c, Y - 28, Y, [C.steel, C.steelD]), 2.5);
  c.fillStyle = C.warn; c.fillRect(X - 24, Y - 31, 48, 5); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(X - 24, Y - 31, 48, 5);
  c.fillStyle = C.dark; c.fillRect(X - 14, Y - 14, 9, 6); c.fillRect(X + 5, Y - 14, 9, 6);          // fork pockets
  circ(c, X - 14, Y - 3, 3.5); fillInk(c, C.dark, 1.5); circ(c, X + 14, Y - 3, 3.5); fillInk(c, C.dark, 1.5);
  swarf(c, X - 12, Y - 31, .9, -.4); swarf(c, X + 4, Y - 33, 1, .6); swarf(c, X + 12, Y - 30, .8, 2);
}
function trajectory(c, h, fromX, bright){
  const my = h.mouth*T, face = h.face || -1, pts = [];
  for (let px = fromX + face*14; face < 0 ? px > h.catch*T + 16 : px < h.catch*T - 16; px += face*T) pts.push([px, my]);
  dotted(c, pts, 5, bright ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)');
}
A.spitterMouth = h => (h.face || -1) < 0 ? h.rect[0]*T + 8 : (h.rect[0] + h.rect[2])*T - 8;
A.spitter = function(c, h, t, slow){
  const [rx, ry, rw] = h.rect, X = rx*T, Y = ry*T, W = rw*T, face = h.face || -1;
  const rattle = t < 0.6, sh = rattle ? Math.sin(t*90)*1.4 : 0, my = h.mouth*T - Y;
  chipBin(c, h.catch);
  trajectory(c, h, A.spitterMouth(h), rattle);
  c.save(); c.translate(X + W/2 + sh, Y); c.scale(face < 0 ? 1 : -1, 1); c.translate(-W/2, 0);
  if (h.look === 'grinder') grinder(c, t, rattle, my); else lathe(c, t, rattle, my);
  c.restore();
  if (rattle){ c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.beginPath();
    for (const [a, b] of [[X - 6, Y + 6], [X + W + 6, Y + 10], [X + W/2, Y - 12]]){ c.moveTo(a, b); c.lineTo(a + (a < X + W/2 ? -7 : 7), b - 5); } c.stroke(); }
  if (slow) A.slowOutline(c, X - 8, Y - 44, W + 16, 12*T - Y + 44);
};
// Local 64x64 box, chuck on the left (the firing side), mouth height my.
function lathe(c, t, rattle, my){
  // feet: one short block, one propped on a yellow shim
  rr(c, 6, 58, 14, 6, 2); fillInk(c, C.steelD, 2);
  rr(c, 44, 56, 14, 6, 2); fillInk(c, C.steelD, 2);
  c.beginPath(); c.moveTo(40, 64); c.lineTo(62, 64); c.lineTo(62, 61); c.closePath(); fillInk(c, C.warn, 1.5);
  // cabinet with a chip tray lip
  rr(c, 2, 46, 60, 12, 4); fillInk(c, vgrad(c, 46, 58, [C.steelL, C.steel]), 2.5);
  c.fillStyle = C.dark; c.fillRect(6, 44, 52, 3);
  // bed with slideways
  rr(c, 10, 38, 50, 7, 2); fillInk(c, C.steelD, 2); c.fillStyle = C.steelXL; c.fillRect(12, 39, 46, 2);
  // headstock
  rr(c, 30, 8, 32, 32, 6); fillInk(c, vgrad(c, 8, 40, [C.steelXL, C.steelL]), 2.5);
  rr(c, 36, 14, 16, 10, 2); fillInk(c, GLASS, 1.5);
  c.fillStyle = C.warn; c.fillRect(38, 20, Math.max(2, 12*((t % 3)/3)), 2);
  circ(c, 55, 31, 3.5); fillInk(c, C.steel, 1.5);
  // spindle nose and a three-jaw chuck, three-quarter view
  rr(c, 22, my - 9, 10, 18, 2); fillInk(c, C.steel, 2);
  c.beginPath(); c.ellipse(20, my, 7, 16, 0, 0, TAU); fillInk(c, C.steelL, 2.5);
  c.save(); c.translate(15, my); c.scale(.42, 1); chuckFace(c, 14, t*(rattle ? 25 : 8)); c.restore();
  // guard door hanging off one hinge
  c.save(); c.translate(30, 10); c.rotate(-.55 + (rattle ? Math.sin(t*40)*.06 : 0));
  rr(c, -26, -4, 26, 20, 3); fillInk(c, C.steelXL, 2); rr(c, -22, 0, 18, 12, 2); c.fillStyle = 'rgba(10,44,74,.85)'; c.fill();
  c.fillStyle = C.warn; c.fillRect(-26, 14, 26, 2); c.restore();
  stackLight(c, 57, 8, rattle ? 'amber' : 'green', rattle ? Math.sin(t*30) > 0 : true);
  swarf(c, 40, 38, .8, .3); swarf(c, 50, 37, .7, 2.2);
}
function grinder(c, t, rattle, my){
  // pedestal, foot and motor
  rr(c, 12, 58, 40, 6, 3); fillInk(c, C.steelD, 2);
  rr(c, 26, 30, 12, 30, 3); fillInk(c, vgrad(c, 30, 60, [C.steelL, C.steel]), 2.5);
  rr(c, 18, 16, 28, 22, 9); fillInk(c, vgrad(c, 16, 38, [C.steelXL, C.steelL]), 2.5);
  c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 1.5; for (let x = 24; x < 42; x += 4){ c.beginPath(); c.moveTo(x, 19); c.lineTo(x, 34); c.stroke(); }
  // far wheel and guard
  circ(c, 54, 27, 11); fillInk(c, '#A7A08F', 2); c.beginPath(); c.arc(54, 27, 14, Math.PI, TAU); ink(c, 5); c.strokeStyle = C.steel; c.lineWidth = 3; c.stroke();
  // near wheel (the firing one): a grit wheel, spinning, under its guard hood
  const wy = my - 12;
  c.beginPath(); c.ellipse(12, wy, 8, 14, 0, 0, TAU); fillInk(c, '#B8B09C', 2.5);
  c.save(); c.beginPath(); c.ellipse(12, wy, 8, 14, 0, 0, TAU); c.clip(); c.fillStyle = 'rgba(60,55,45,.45)';
  for (let i = 0; i < 18; i++){ const a = i*2.4 + t*(rattle ? 30 : 10); circ(c, 12 + Math.cos(a)*5, wy + Math.sin(a*1.3)*11, 1.2); c.fill(); } c.restore();
  circ(c, 12, wy, 3); fillInk(c, C.steel, 1.5);
  c.beginPath(); c.ellipse(13, wy, 11, 17, 0, Math.PI*1.05, Math.PI*1.95); c.strokeStyle = C.ink; c.lineWidth = 7; c.stroke(); c.strokeStyle = C.steelL; c.lineWidth = 4; c.stroke();
  rr(c, 2, my - 1, 14, 3, 1); fillInk(c, C.steelD, 1.5);                                            // tool rest
  rr(c, 0, wy - 20, 16, 7, 2); c.fillStyle = 'rgba(207,239,255,.5)'; c.fill(); ink(c, 1.5);       // eye shield
  if (rattle){ c.strokeStyle = C.warn; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 5; i++){ const a = 2.2 + i*.18; c.moveTo(6, my - 2); c.lineTo(6 + Math.cos(a)*14, my - 2 + Math.sin(a)*10); } c.stroke(); }
  circ(c, 32, 12, 3.5); fillInk(c, rattle && Math.sin(t*30) > 0 ? C.warn : '#35C06A', 1.5);
}
// A crashed part in flight: alternately a bent turned shaft and a chipped cutting insert.
A.crashedPart = function(c, x, y, r, a, kind){
  c.save(); c.translate(x, y); c.rotate(a || 0);
  if (kind % 2){
    c.beginPath(); c.moveTo(-r*1.2, -r*.35); c.lineTo(0, -r*.35); c.lineTo(r*1.1, -r*.8); c.lineTo(r*1.3, -r*.3); c.lineTo(r*.1, r*.35); c.lineTo(-r*1.2, r*.35); c.closePath();
    fillInk(c, C.steelXL, 2);
    c.strokeStyle = 'rgba(20,20,22,.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r*.6, -r*.35); c.lineTo(-r*.6, r*.35); c.stroke();
  } else {
    c.beginPath(); c.moveTo(0, -r*1.1); c.lineTo(r*1.05, r*.7); c.lineTo(r*.2, r*.75); c.lineTo(0, r*.45); c.lineTo(-r*1.05, r*.7); c.closePath();
    fillInk(c, '#8A9097', 2); circ(c, 0, r*.15, r*.28); fillInk(c, C.dark, 1.5);
  }
  c.restore();
};
A.shots = function(c, list){ list.forEach((s, i) => A.crashedPart(c, s.x*T, s.y*T, 0.225*T*1.1, s.a, s.kind === undefined ? i : s.kind)); };

// ---------- Spitter Gallery: a passage through a turning centre ----------
// Guard doors at both ends are shut (solid) except in the open window; a tool turret flings parts down the lanes.
A.gallery = function(c, h, t, slow){
  const [rx, ry, rw, rh] = h.rect, X = rx*T, Y = ry*T, W = rw*T, H = rh*T;
  const open = t >= h.open[0] && t < h.open[1], soon = !open && t >= h.open[0] - 0.6;
  // work zone
  c.fillStyle = vgrad(c, Y, Y + H, ['#262B31', '#394048']); c.fillRect(X, Y, W, H);
  c.fillStyle = '#2E343A'; c.fillRect(X, Y + H - 7, W, 7);
  c.fillStyle = C.steel; for (let x = X + ((t*40) % 10); x < X + W; x += 10) c.fillRect(x, Y + H - 6, 5, 5);
  for (const ly of h.lanes){ const pts = []; for (let px = X + 18; px < X + W - 10; px += 16) pts.push([px, ly*T]); dotted(c, pts, 4, 'rgba(255,255,255,.55)'); }
  // lane nozzles in the entry frame (spindle noses), catch chute at the exit
  for (const ly of h.lanes){ rr(c, X + 1, ly*T - 7, 13, 14, 3); fillInk(c, C.steelL, 2); circ(c, X + 12, ly*T, 3.5); c.fillStyle = C.ink; c.fill(); }
  rr(c, X + W - 12, Y + 6, 12, H - 14, 3); fillInk(c, C.dark, 2);
  // guard doors: slid up into the machine when open
  const door = (dx, up) => { const dy = up ? -H + 6 : 0;
    rr(c, dx, Y + dy, 14, H, 3); fillInk(c, vgrad(c, Y + dy, Y + dy + H, [C.steelXL, C.steelL]), 2.5);
    rr(c, dx + 3, Y + dy + 8, 8, 26, 2); c.fillStyle = 'rgba(10,44,74,.85)'; c.fill();
    c.fillStyle = C.warn; c.fillRect(dx + 4, Y + dy + H - 22, 6, 14); };
  door(X - 4, open); door(X + W - 10, open);
  // the machine: enclosure, window onto a tool turret, pendant with a cycle bar, tower light
  const top = Y - 108;
  rr(c, X - 10, top, W + 20, 108, 12); fillInk(c, vgrad(c, top, Y, [C.steelXL, C.steelL]), 3);
  c.fillStyle = C.steel; c.fillRect(X - 8, Y - 16, W + 16, 14);
  rr(c, X + 2, top + 10, W - 34, 70, 8); fillInk(c, GLASS, 2.5);
  const tx = X + 2 + (W - 34)/2, ty = top + 45;
  c.save(); c.beginPath(); rr(c, X + 2, top + 10, W - 34, 70, 8); c.clip();
  circ(c, tx, ty, 26); fillInk(c, C.steelL, 2.5);
  const turn = open ? 0 : t*.8;
  for (let k = 0; k < 8; k++){ const a = k/8*TAU + turn; c.save(); c.translate(tx + Math.cos(a)*26, ty + Math.sin(a)*26); c.rotate(a + Math.PI/2);
    rr(c, -4, -9, 8, 11, 2); fillInk(c, C.steel, 1.5); c.fillStyle = C.warn; c.fillRect(-2, -12, 4, 3); c.restore(); }
  circ(c, tx, ty, 8); fillInk(c, C.steel, 2); bolt(c, tx, ty, 3);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(X + 10, top + 80); c.lineTo(X + 30, top + 10); c.lineTo(X + 40, top + 10); c.lineTo(X + 20, top + 80); c.fill();
  c.restore();
  const px = X + W - 26;
  rr(c, px, top + 12, 30, 48, 5); fillInk(c, C.steelD, 2);
  rr(c, px + 4, top + 17, 22, 16, 2); fillInk(c, GLASS, 1.5);
  // cycle bar on the screen: the open window in green, progress in yellow
  const bw = 18; c.fillStyle = '#35C06A'; c.fillRect(px + 6 + bw*h.open[0]/h.cycle, top + 27, bw*(h.open[1] - h.open[0])/h.cycle, 3);
  c.fillStyle = C.warn; c.fillRect(px + 6, top + 22, bw*t/h.cycle, 3);
  c.fillStyle = C.steelL; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++){ circ(c, px + 9 + i*6, top + 41 + j*7, 2); c.fill(); }
  stackLight(c, X + W + 2, top, open ? 'green' : soon ? 'amber' : 'red', soon ? Math.sin(t*24) > 0 : true);
  if (open){ c.fillStyle = C.white; c.font = `700 14px ${FONT}`; c.textAlign = 'center'; c.fillText('GO', X + W/2, Y + 16); }
  if (slow) A.slowOutline(c, X - 14, top - 46, W + 28, Y + H - top + 50);
};

// ---------- Tickle Spindle gate: a two-axis head on a ram, spindle and end mill ----------
// pose.ang: 0 hangs straight down (blocking); + swings the tool left. pose.ext: 0 retracted .. 1 full reach.
A.armGate = function(c, h, t, slow, pose){
  const [rx, ry, rw, rh] = h.rect, X = rx*T, Y = ry*T, W = rw*T, H = rh*T;
  const [pvx, pvy] = h.pivot, PX = pvx*T, PY = pvy*T;
  const ang = pose ? pose.ang : 0, ext = pose ? pose.ext : 1;
  const open = h.open && t >= h.open[0] && t < h.open[1];
  const len = (12 - 0.3 - pvy)*T;
  // dotted reach: the sweep arc of the cutter
  c.save(); c.setLineDash([3, 8]); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3;
  c.beginPath(); c.arc(PX, PY, len, Math.PI/2 - Math.PI/4, Math.PI/2 + Math.PI/4); c.stroke(); c.restore();
  for (const [cx, d] of [[X - 20, 1], [X + W + 20, -1]]){
    c.fillStyle = open ? C.white : 'rgba(255,255,255,.3)';
    for (let i = 0; i < 2; i++){ const bx = cx - d*i*12; c.beginPath(); c.moveTo(bx - d*6, Y + 6); c.lineTo(bx + d*2, Y + 14); c.lineTo(bx - d*6, Y + 22); c.lineTo(bx - d*2, Y + 14); c.closePath(); c.fill(); }
  }
  // C-axis housing and the A-axis fork at the end of the ram
  rr(c, PX - 36, PY - 46, 72, 26, 10); fillInk(c, vgrad(c, PY - 46, PY - 20, [C.steelXL, C.steelL]), 2.5);
  c.fillStyle = C.warn; c.fillRect(PX - 34, PY - 26, 68, 4);
  for (const s of [-1, 1]){ rr(c, PX + s*26 - 7, PY - 24, 14, 32, 6); fillInk(c, C.steelL, 2.5); }
  stackLight(c, X + 10, PY - 50, 'amber', Math.sin(t*6) > 0);
  if (ext > 0.02){
    c.save(); c.translate(PX, PY); c.rotate(ang);
    // spindle cartridge
    rr(c, -17, -14, 34, 48, 10); fillInk(c, vgrad(c, -14, 34, [C.steelXL, C.steelL]), 2.5);
    c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 2; for (let y = -6; y < 22; y += 6){ c.beginPath(); c.moveTo(-12, y); c.lineTo(12, y); c.stroke(); }
    c.fillStyle = C.warn; c.fillRect(-17, 24, 34, 4);
    // telescoping quill
    const q = 26*ext;
    rr(c, -12, 32, 24, q, 4); fillInk(c, C.steel, 2); rr(c, -9, 32 + q*.5, 18, q*.5 + 4, 3); fillInk(c, C.steelL, 2);
    c.translate(0, 34 + q);
    tool(c, 'endmill', len - 34 - q, 8, t*4);
    c.restore();
    circ(c, PX, PY, 11); fillInk(c, C.steel, 2.5); bolt(c, PX, PY, 4);
  }
  if (slow) A.slowOutline(c, X - 6, PY - 56, W + 12, 12*T - PY + 56);
};

// ---------- Coolant Sneeze: a pump unit on segmented coolant hose ----------
A.coolantBack = function(c, h){
  const [bx, by] = h.base, X = bx*T, Y = by*T;
  c.save();
  rr(c, X - 74, Y - 92, 58, 96, 10); c.fillStyle = vgrad(c, Y - 92, Y + 4, ['#6E7E8E', '#4B5968']); c.fill(); c.strokeStyle = '#1D2A38'; c.lineWidth = 3; c.stroke();
  rr(c, X - 66, Y - 80, 8, 64, 4); c.fillStyle = '#1D2A38'; c.fill(); c.fillStyle = 'rgba(207,239,255,.7)'; rr(c, X - 65, Y - 50, 6, 33, 3); c.fill();
  c.fillStyle = 'rgba(244,202,70,.8)'; c.fillRect(X - 74, Y - 30, 58, 5);
  circ(c, X - 36, Y - 70, 9); c.fillStyle = '#9FC4E8'; c.fill(); c.strokeStyle = '#1D2A38'; c.lineWidth = 2.5; c.stroke();
  c.beginPath(); c.moveTo(X - 36, Y - 70); c.lineTo(X - 31, Y - 75); c.stroke();
  c.strokeStyle = '#1D2A38'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(X - 16, Y - 10); c.lineTo(X + 2, Y - 10); c.stroke();
  c.restore();
};
A.coolant = function(c, h, t, slow){
  const [bx, by, bw, bh] = h.base, X = bx*T, Y = by*T, W = bw*T, H = bh*T;
  const [jx, jy, jw, jh] = h.jet, JX = jx*T, JY = jy*T, JW = jw*T, JH = jh*T;
  // pump unit (solid)
  rr(c, X, Y, W, H, 5); fillInk(c, vgrad(c, Y, Y + H, [C.steelXL, C.steelL]), 2.5);
  rr(c, X + 5, Y + 14, 7, 30, 3); fillInk(c, C.dark, 1.5); c.fillStyle = C.coolant; rr(c, X + 6, Y + 26, 5, 17, 2); c.fill();
  stripes(c, X + 3, Y + H - 14, W - 6, 9, 5);
  rr(c, X + 3, Y - 12, W - 6, 13, 4); fillInk(c, C.steelD, 2);                                    // pump motor
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; for (let x = X + 7; x < X + W - 5; x += 4){ c.beginPath(); c.moveTo(x, Y - 10); c.lineTo(x, Y - 2); c.stroke(); }
  // segmented hose from the pump up and over to the nozzle
  const sx = X + W/2, sy = Y - 12, nx = X + W + 8, ny = JY + 6, cx = X - 4, cy = JY - 26;
  const P = u => [ (1-u)*(1-u)*sx + 2*(1-u)*u*cx + u*u*nx, (1-u)*(1-u)*sy + 2*(1-u)*u*cy + u*u*ny ];
  for (let i = 0; i <= 12; i++){ const u = i/12, [x, y] = P(u), [x2, y2] = P(Math.min(1, u + .02)), a = Math.atan2(y2 - y, x2 - x);
    c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 5, 6.5, 0, 0, TAU); fillInk(c, HOSE, 1.5);
    c.strokeStyle = '#5A6068'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -5); c.lineTo(-1, 5); c.stroke(); c.restore(); }
  // round nozzle
  c.save(); c.translate(nx, ny); c.rotate(.7); rr(c, -4, -4, 14, 8, 3); fillInk(c, C.warn, 2); c.restore();
  const phase = t < 0.7 ? 'tell' : t < 1.8 ? 'jet' : 'drain';
  const tipX = nx + 10, tipY = ny + 8;
  if (phase === 'tell'){
    const u = t/0.7;
    for (let i = 0; i < 3; i++){ const r = 3 + 5*Math.min(1, u*1.4 - i*.2); if (r <= 3.2) continue; circ(c, tipX + 6 + i*8, tipY + 4 + i*7, r); fillInk(c, C.coolant, 2); }
  } else if (phase === 'jet'){
    c.save(); c.beginPath(); c.moveTo(tipX - 4, tipY - 2); c.lineTo(JX + JW, JY + JH); c.lineTo(JX + 4, JY + JH); c.lineTo(tipX + 2, tipY + 4); c.closePath();
    c.fillStyle = 'rgba(207,239,255,.85)'; c.fill(); c.strokeStyle = C.white; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(124,199,255,.9)'; c.lineWidth = 2.5;
    for (let i = 0; i < 5; i++){ const u = ((t*3 + i/5) % 1); c.beginPath(); c.moveTo(tipX + u*(JW - 16), tipY + u*(JH - 14)); c.lineTo(tipX + 8 + u*(JW - 10), tipY + 10 + u*(JH - 14)); c.stroke(); }
    c.restore();
    c.fillStyle = 'rgba(207,239,255,.8)'; c.beginPath(); c.ellipse(JX + JW/2 + 6, JY + JH - 2, JW/2 + 6, 5, 0, 0, TAU); c.fill();
  } else {
    c.fillStyle = 'rgba(124,199,255,.35)'; c.beginPath(); c.ellipse(JX + JW/2 + 6, JY + JH - 1, JW/2, 3, 0, 0, TAU); c.fill();
    circ(c, tipX, tipY + ((t*40) % 30), 2.5); c.fillStyle = C.coolant; c.fill();
  }
  if (slow) A.slowOutline(c, X - 6, JY - 34, JX + JW - X + 14, JH + 34);
};

// ---------- Clapper Jaws: a press, punch from the ram and a die rising from the floor. u: 0 open .. 1 closed ----------
A.jaws = function(c, h, t, slow, uOverride){
  const [rx, ry, rw, rh] = h.rect, X = rx*T, Y = ry*T, W = rw*T, H = rh*T;
  const tt = t % h.cycle;
  const u = uOverride !== undefined ? uOverride : tt < 0.6 ? 0 : tt < 0.85 ? (tt - 0.6)/0.25 : tt < 1.95 ? 1 : tt < 2.55 ? 1 - (tt - 1.95)/0.6 : 0;
  const tremble = tt < 0.6 && uOverride === undefined ? Math.sin(tt*80)*1.4 : 0, half = H/2;
  c.fillStyle = 'rgba(20,24,28,.35)'; c.fillRect(X, Y, W, H);
  c.fillStyle = C.pit; c.fillRect(X - 8, Y + H, W + 16, 10);
  c.save(); c.translate(tremble, 0);
  // ram with hydraulic cylinders; the punch hangs below it and its tip reaches down to Y + half*u
  const tip = Y + half*u, ramB = tip - 18;
  for (const s of [-1, 1]){ const cx = X + W/2 + s*W*.32;
    rr(c, cx - 9, Y - 96, 18, 40, 4); fillInk(c, C.steelD, 2); c.fillStyle = C.steelXL; c.fillRect(cx - 3, Y - 56, 6, ramB - 28 - (Y - 56)); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(cx - 3, Y - 56, 6, Math.max(0, ramB - 28 - (Y - 56))); }
  rr(c, X - 12, ramB - 30, W + 24, 30, 8); fillInk(c, vgrad(c, ramB - 30, ramB, [C.steelXL, C.steelL]), 3);
  for (let i = 0; i < 6; i++){ const a = i/6*TAU; bolt(c, X + W/2 + Math.cos(a)*18, ramB - 15 + Math.sin(a)*8, 2.4); }
  stripes(c, X - 10, ramB - 7, W + 20, 6, 6);
  c.beginPath(); c.moveTo(X + 6, ramB); c.lineTo(X + W - 6, ramB); c.lineTo(X + W/2 + 7, tip - 3); c.quadraticCurveTo(X + W/2, tip + 2, X + W/2 - 7, tip - 3); c.closePath();
  fillInk(c, vgrad(c, ramB, tip, [C.steelL, C.steelXL]), 2.5);
  // die with its V groove
  const dieTop = Y + H - half*u;
  c.beginPath(); c.moveTo(X - 8, dieTop); c.lineTo(X + W/2 - 16, dieTop); c.lineTo(X + W/2, dieTop + 14); c.lineTo(X + W/2 + 16, dieTop); c.lineTo(X + W + 8, dieTop); c.lineTo(X + W + 8, dieTop + 42); c.lineTo(X - 8, dieTop + 42); c.closePath();
  fillInk(c, vgrad(c, dieTop, dieTop + 42, [C.steelXL, C.steel]), 3);
  for (let i = 0; i < 4; i++){ const a = i/4*TAU + .4; bolt(c, X + W/2 + Math.cos(a)*10, dieTop + 28 + Math.sin(a)*5, 2.2); }
  stripes(c, X - 6, dieTop + 2, 18, 5, 4); stripes(c, X + W - 12, dieTop + 2, 18, 5, 4);
  c.restore();
  stackLight(c, X + W + 16, Y - 60, u > 0 ? 'red' : tt < 0.6 ? 'amber' : 'green', tt < 0.6 ? Math.sin(tt*30) > 0 : true);
  if (slow) A.slowOutline(c, X - 16, Y - 100, W + 40, H + 110);
};

// ---------- belts: chip conveyors ----------
// pos: how far the belt has run (tiles); speed: its signed surface speed now; warn: reversal coming.
A.drawBelt = function(c, b, pos, speed, warn, t){
  const x = b.x0*T, w = (b.x1 - b.x0)*T, y = b.y*T;
  c.fillStyle = C.dark; c.fillRect(x, y + 10, w, 26);
  const dir = Math.sign(speed) || b.dir;
  c.save(); c.beginPath(); c.rect(x + 14, y + 12, w - 28, 22); c.clip();
  c.fillStyle = `rgba(244,202,70,${warn ? (Math.sin((t || 0)*20) > 0 ? 1 : .3) : 1})`;
  for (let ax = x + 22; ax < x + w - 8; ax += 36){
    c.beginPath();
    if (dir > 0){ c.moveTo(ax, y + 16); c.lineTo(ax + 12, y + 23); c.lineTo(ax, y + 30); c.lineTo(ax + 5, y + 23); }
    else { c.moveTo(ax + 12, y + 16); c.lineTo(ax, y + 23); c.lineTo(ax + 12, y + 30); c.lineTo(ax + 7, y + 23); }
    c.closePath(); c.fill();
  }
  c.restore();
  // hinged steel plates with knuckles, carrying a few chips
  const off = ((pos*T) % 22 + 22) % 22;
  c.save(); c.beginPath(); c.rect(x, y - 2, w, 14); c.clip();
  c.fillStyle = C.steelL; c.fillRect(x, y - 2, w, 14);
  for (let sx = x - 22 + off; sx < x + w; sx += 22){ c.fillStyle = C.steel; c.fillRect(sx + 18, y - 2, 4, 14); circ(c, sx + 20, y + 5, 3); c.fillStyle = C.steelD; c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x, y - 2, w, 2);
  c.restore();
  for (let k = 0; k < 3; k++){ const cx = x + 16 + ((((k*97 + pos*T) % (w - 32)) + (w - 32)) % (w - 32)); swarf(c, cx, y - 4, .8, k*1.7); }
  c.strokeStyle = C.ink; c.lineWidth = 2.5; c.strokeRect(x, y - 2, w, 38);
  for (const rx of [x + 8, x + w - 8]){                                                           // sprockets
    c.save(); c.translate(rx, y + 6); c.rotate(pos*2);
    c.beginPath(); for (let i = 0; i < 16; i++){ const a = i/16*TAU, r = i % 2 ? 6 : 8; c.lineTo(Math.cos(a)*r, Math.sin(a)*r); } c.closePath(); fillInk(c, C.steelXL, 1.5);
    circ(c, 0, 0, 2); c.fillStyle = C.ink; c.fill(); c.restore();
  }
};

// ---------- section 1: a harmless pillar drill, the camera's first thing to slow ----------
A.pillarDrill = function(c, d, pose, t, slow){
  const X = d.x*T, Y = d.y*T, feed = pose.feed;
  rr(c, X - 18, Y - 8, 76, 8, 3); fillInk(c, C.steel, 2);                                          // base plate
  rr(c, X + 26, Y - 216, 12, 210, 4); fillInk(c, hgrad(c, X + 26, X + 38, [C.steelXL, C.steelL]), 2);   // column
  rr(c, X - 34, Y - 244, 76, 44, 9); fillInk(c, vgrad(c, Y - 244, Y - 200, [C.steelXL, C.steelL]), 2.5); // head
  rr(c, X - 14, Y - 268, 40, 26, 7); fillInk(c, C.steelD, 2);                                       // motor
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; for (let xx = X - 9; xx < X + 22; xx += 5){ c.beginPath(); c.moveTo(xx, Y - 264); c.lineTo(xx, Y - 246); c.stroke(); }
  c.save(); c.translate(X + 40, Y - 226); c.rotate(feed*2.2);                                     // feed handle
  c.strokeStyle = C.ink; c.lineWidth = 3; for (let k = 0; k < 3; k++){ const a = k*Math.PI*2/3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a)*16, Math.sin(a)*16); c.stroke(); circ(c, Math.cos(a)*16, Math.sin(a)*16, 3.5); fillInk(c, C.warn, 1.5); }
  c.restore();
  const q = 10 + feed*115, qx = X - 6 - 7;
  rr(c, qx, Y - 200, 14, q, 3); fillInk(c, C.steelL, 1.5);                                          // quill
  c.save(); c.translate(X - 6, Y - 200 + q); tool(c, 'drill', 40, 6, pose.stage === 'up' ? t*.5 : t*9); c.restore();
  stripes(c, X - 34, Y - 204, 76, 5, 5);
  stackLight(c, X - 44, Y - 244, pose.stage === 'tell' || pose.stage === 'down' ? 'amber' : pose.danger ? 'red' : 'green', pose.stage === 'tell' ? Math.sin(t*28) > 0 : true);
  if (pose.stage === 'drill'){ for (let i = 0; i < 3; i++){ const a = t*20 + i*2.1; swarf(c, X - 6 + Math.cos(a)*14, pose.tipY*T - 4 + Math.sin(a)*4, .6, a); } }
  if (slow) A.slowOutline(c, X - 52, Y - 276, 110, 272);
};
A.demoDrill = function(c, x, y, t, slow){
  const X = x*T, Y = y*T;
  // bench
  rr(c, X - 40, Y - 34, 80, 10, 3); fillInk(c, vgrad(c, Y - 34, Y - 24, [C.steelXL, C.steelL]), 2);
  c.fillStyle = C.steelD; c.fillRect(X - 34, Y - 24, 8, 24); c.fillRect(X + 26, Y - 24, 8, 24);
  // base, column, head
  rr(c, X - 26, Y - 42, 44, 8, 3); fillInk(c, C.steel, 2);
  rr(c, X + 6, Y - 130, 9, 90, 3); fillInk(c, hgrad(c, X + 6, X + 15, [C.steelXL, C.steelL]), 2);
  rr(c, X - 20, Y - 76, 36, 6, 2); fillInk(c, C.steelL, 2);                                          // table
  rr(c, X - 12, Y - 86, 20, 10, 2); fillInk(c, C.steel, 1.5); rr(c, X - 6, Y - 92, 8, 7, 1); fillInk(c, C.warn, 1.5);   // vice + workpiece
  rr(c, X - 28, Y - 150, 50, 32, 8); fillInk(c, vgrad(c, Y - 150, Y - 118, [C.steelXL, C.steelL]), 2.5);
  rr(c, X - 8, Y - 168, 30, 20, 6); fillInk(c, C.steelD, 2);                                         // motor
  // feed handle, turning with the feed
  const feed = (1 - Math.cos(t/2.4*TAU))/2;
  c.save(); c.translate(X + 22, Y - 132); c.rotate(feed*2);
  c.strokeStyle = C.ink; c.lineWidth = 3; for (let k = 0; k < 3; k++){ const a = k*TAU/3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a)*14, Math.sin(a)*14); c.stroke(); circ(c, Math.cos(a)*14, Math.sin(a)*14, 3); fillInk(c, C.warn, 1.5); }
  c.restore();
  // quill, chuck and drill feeding down and up
  const q = 4 + feed*16;
  rr(c, X - 12, Y - 120, 12, q, 2); fillInk(c, C.steelL, 1.5);
  c.save(); c.translate(X - 6, Y - 120 + q); tool(c, 'drill', 30, 5, t*6); c.restore();
  stackLight(c, X - 22, Y - 150, 'green');
  if (slow) A.slowOutline(c, X - 34, Y - 192, 70, 124);
};

// ---------- the Tangled Turner: a giant chuck with two robot-arm spindle heads ----------
function drawArm(c, S, P, side, kind, t, restored){
  // P is the centre of the tool's danger zone; the head sits above it
  const head = [P[0], P[1] - 40], wrist = [P[0], P[1] - 70];
  const dx = wrist[0] - S[0], dy = wrist[1] - S[1], d = Math.hypot(dx, dy), L = Math.max(96, d/2 + 12);
  const h = Math.sqrt(Math.max(0, L*L - (d/2)*(d/2))), mx = (S[0] + wrist[0])/2, my = (S[1] + wrist[1])/2;
  const nx = -dy/d, ny = dx/d, sgn = ny < 0 ? 1 : -1;                                               // elbow above the line
  const E = [mx + nx*h*sgn, my + ny*h*sgn];
  // drag chain alongside
  c.strokeStyle = C.dark; c.lineWidth = 10; c.setLineDash([6, 3]);
  c.beginPath(); c.moveTo(S[0], S[1] - 16); c.lineTo(E[0], E[1] - 18); c.lineTo(wrist[0] + side*14, wrist[1] - 10); c.stroke(); c.setLineDash([]);
  const seg = (a, b, w) => { c.lineCap = 'round'; c.strokeStyle = C.ink; c.lineWidth = w + 6; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
    c.strokeStyle = C.steelL; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1] - w*.25); c.lineTo(b[0], b[1] - w*.25); c.stroke(); };
  seg(S, E, 24); seg(E, wrist, 20);
  for (const [j, r] of [[S, 17], [E, 15], [wrist, 12]]){ circ(c, j[0], j[1], r); fillInk(c, C.steelXL, 2.5); bolt(c, j[0], j[1], 4); c.fillStyle = C.warn; c.fillRect(j[0] - r + 3, j[1] - 2, 5, 4); }
  c.save(); c.translate(head[0], head[1]); spindleHead(c, 40, 30);
  c.translate(0, 4); tool(c, kind, 46, kind === 'drill' ? 9 : 8, restored ? 0 : t*5); c.restore();
}
A.turner = function(c, B, st, t){
  const [dx, dy, dr] = B.drum, DX = dx*T, DY = dy*T, R = dr*T, floorY = 12*T;
  c.save(); c.fillStyle = 'rgba(0,44,90,.45)'; rr(c, (B.bounds[0] + 0.5)*T, 1.6*T, (B.bounds[2] - 1)*T, 10.4*T, 26); c.fill(); c.restore();
  for (const [a, b] of B.safeLanes){
    c.save(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.setLineDash([6, 5]); c.lineWidth = 2.5; rr(c, a*T + 3, floorY + 14, (b - a)*T - 6, 30, 6); c.stroke(); c.restore();
    c.fillStyle = C.white; c.font = `700 13px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SAFE', (a + b)/2*T, floorY + 29);
  }
  // headstock body behind the chuck
  rr(c, DX - R*.95, DY - R*.2, R*1.9, floorY - DY + R*.2, 16); fillInk(c, vgrad(c, DY, floorY, [C.steelL, C.steel]), 4);
  c.strokeStyle = 'rgba(20,20,22,.3)'; c.lineWidth = 2; for (let y = DY + R + 14; y < floorY - 10; y += 10){ c.beginPath(); c.moveTo(DX - R*.7, y); c.lineTo(DX - R*.3, y); c.stroke(); }
  stackLight(c, DX + R*.8, DY - R*.2, st.restored ? 'green' : 'red', st.restored ? true : Math.sin(t*4) > 0);
  // the arms, mounted on the headstock's shoulders
  if (st.left) drawArm(c, [DX - R*.95, DY + R*.55], [st.left.x*T, st.left.y*T], -1, 'drill', t, st.restored);
  if (st.right) drawArm(c, [DX + R*.95, DY + R*.55], [st.right.x*T, st.right.y*T], 1, 'endmill', t, st.restored);
  // the chuck
  circ(c, DX, DY, R + 8); fillInk(c, C.steelD, 4);
  c.save(); c.translate(DX, DY); chuckFace(c, R, st.restored ? t*1.2 : Math.sin(t*1.7)*.08, st.restored ? C.white : C.warn); c.restore();
  if (!st.restored){
    // a tangle of coolant hose and cable across the chuck
    c.lineCap = 'round';
    const loop = (a0, a1, bulge, col) => { const p0 = [DX + Math.cos(a0)*R, DY + Math.sin(a0)*R], p1 = [DX + Math.cos(a1)*R, DY + Math.sin(a1)*R], m = (a0 + a1)/2;
      c.beginPath(); c.moveTo(...p0); c.quadraticCurveTo(DX + Math.cos(m)*(R + bulge), DY + Math.sin(m)*(R + bulge), ...p1);
      c.strokeStyle = C.ink; c.lineWidth = 9; c.stroke(); c.strokeStyle = col; c.lineWidth = 5; c.stroke(); };
    loop(-2.6, -1.2, 40, HOSE); loop(-.4, .9, 36, C.warn); loop(2.0, 3.3, 30, HOSE); loop(.9, 2.3, -R*.6, C.warn);
  }
  if (st.warn){
    const [a, b] = st.warn, y = 10.5*T, d = Math.sign(b - a), pts = [];
    for (let x = a*T; d > 0 ? x <= b*T : x >= b*T; x += d*20) pts.push([x, y]);
    dotted(c, pts, 5, 'rgba(244,202,70,.95)');
    c.fillStyle = C.warn; c.beginPath(); c.moveTo(b*T + d*14, y); c.lineTo(b*T - d*2, y - 10); c.lineTo(b*T - d*2, y + 10); c.closePath(); c.fill();
  }
  // control panel on the headstock, just right of the middle socket so the destination arrow never covers it
  const cx = B.console[0]*T + 58;
  rr(c, cx - 54, floorY - 112, 100, 44, 8); fillInk(c, vgrad(c, floorY - 112, floorY - 68, [C.steelXL, C.steelL]), 3);
  rr(c, cx - 46, floorY - 105, 46, 28, 3); fillInk(c, GLASS, 2);
  c.fillStyle = st.restored ? '#35C06A' : C.warn; c.font = `700 11px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(st.restored ? 'CYCLE OK' : 'FAULT', cx - 23, floorY - 91);
  for (let i = 0; i < 2; i++){ rr(c, cx + 4 + i*18, floorY - 105, 14, 28, 3); fillInk(c, i < st.units ? C.steelXL : C.dark, 2);
    if (i < st.units) A.pickupIcon(c, 'controlUnit', cx + 11 + i*18, floorY - 91, .38); }
  // sockets: fixture blocks with a receiver for each part
  for (const [sx, , kind] of B.sockets){
    const X = sx*T, top = floorY - 50;
    rr(c, X - 20, top + 14, 40, 36, 5); fillInk(c, vgrad(c, top, floorY, [C.steelL, C.steel]), 3);
    c.fillStyle = C.dark; c.fillRect(X - 16, top + 40, 32, 3);
    circ(c, X, top, 20); fillInk(c, C.dark, 3);
    const n = st.fitted[kind] || 0;
    c.save(); c.globalAlpha = n >= 2 ? 1 : .55; A.pickupIcon(c, kind, X, top, .95); c.restore();
    for (let i = 0; i < 2; i++){ circ(c, X - 7 + i*14, top + 28, 4.5); fillInk(c, i < n ? C.white : C.dark, 2); }
    const here = k => k === kind || (k === 'unit' && kind === B.sockets.find(s => s[0] === B.console[0])[2]);   // units fit at the console, behind the middle socket
    if (st.fix && here(st.fix.socket)){ c.strokeStyle = C.white; c.lineWidth = 6; c.beginPath(); c.arc(X, top, 26, -Math.PI/2, -Math.PI/2 + st.fix.u*TAU); c.stroke(); }
    if (st.target === 'unit' && here('unit') && !st.restored) A.pickupIcon(c, 'controlUnit', X + 34, top - 60 + Math.sin(t*4)*5, 1);
    if (st.target && here(st.target) && !st.restored){
      const ay = top - 84 + Math.sin(t*4)*5;
      c.fillStyle = C.white; c.beginPath(); c.moveTo(X - 16, ay); c.lineTo(X + 16, ay); c.lineTo(X + 16, ay + 18); c.lineTo(X + 28, ay + 18); c.lineTo(X, ay + 44); c.lineTo(X - 28, ay + 18); c.lineTo(X - 16, ay + 18); c.closePath(); c.fill(); ink(c, 3);
    }
  }
  if (st.slow) for (const tip of [st.left, st.right]) if (tip){ c.save(); c.setLineDash([8, 6]); c.strokeStyle = C.slow; c.lineWidth = 3; circ(c, tip.x*T, tip.y*T - 16, 44); c.stroke(); c.restore(); }
};

// The Turner seen far off through the stores' window: a chuck and two arms.
A.bossSilhouette = function(c, x, y, s, t){
  c.save(); c.translate(x, y); c.scale(s, s);
  const col = '#2A6FB0'; c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.fillRect(-60, 0, 120, 260);
  c.lineWidth = 26;
  for (const side of [-1, 1]){ c.beginPath(); c.moveTo(side*70, 40); c.lineTo(side*150, -30); c.lineTo(side*170, 60); c.stroke(); c.fillRect(side*170 - 18, 60, 36, 30); c.fillRect(side*170 - 5, 90, 10, 30); }
  circ(c, 0, 0, 96); c.fill();
  c.fillStyle = '#083360'; for (let k = 0; k < 3; k++){ c.save(); c.rotate(k*TAU/3 + t*.2); c.fillRect(22, -10, 60, 20); c.restore(); } circ(c, 0, 0, 18); c.fill();
  c.fillStyle = 'rgba(232,80,58,' + (.5 + .4*Math.sin(t*4)) + ')'; circ(c, 80, -110, 9); c.fill();
  c.restore();
};
})();
