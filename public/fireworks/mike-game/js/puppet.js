// Mike the Mic, animated from the signed-off puppet (assets/mike.svg). Mike is never redrawn: each jointed part of the
// SVG is baked once into its own bitmap (the rest of the drawing hidden), with the foam speckle, gradients and the
// lock-up intact, and the canvas then rotates those bitmaps about the SVG's documented pivots. The head is baked at
// several turn angles using the SVG's own head-turn formula, so the lettering is never mirrored or redrawn.
(function(){
'use strict';
const M = window.MIKE = window.MIKE || {};

// Drawing order and nesting follow the SVG: legs, right arm (behind the stem), stem, head, left arm (in front).
const ORDER = ['legL','footL','legR','footR','armR_upper','armR_lower','stem','head','armL_upper','armL_lower'];
const PIVOT = { head:[315,385], armL_upper:[262,428], armL_lower:[172,385], armR_upper:[372,436], armR_lower:[428,540],
  legL:[287,648], footL:[270,900], legR:[343,648], footR:[360,900] };
const CHAIN = { legL:['legL'], footL:['legL','footL'], legR:['legR'], footR:['legR','footR'], armR_upper:['armR_upper'],
  armR_lower:['armR_upper','armR_lower'], stem:[], head:['head'], armL_upper:['armL_upper'], armL_lower:['armL_upper','armL_lower'] };
const TURNS = [-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40];
const FOOT = [316, 942];          // the soles' centre in SVG units: Mike stands here
const HEIGHT = 942 - 38;          // head top to sole: the design's "2T tall"
const HIP = [315, 648];

const REST = { bob:0, tilt:0, head:0, turn:0, legL:0, footL:0, legR:0, footR:0, armL_upper:-75, armL_lower:-15, armR_upper:0, armR_lower:0 };
const KEYS = Object.keys(REST);

async function blobImage(svg){
  const url = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml' }));
  const img = new Image(); img.src = url;
  try { await img.decode(); } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
  return img;
}
async function dataURL(src){
  const b = await (await fetch(src)).blob();
  return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
}
function crop(canvas, scale){
  const c = canvas.getContext('2d'); let d;
  try { d = c.getImageData(0, 0, canvas.width, canvas.height).data; } catch(_){ return { img:canvas, x:0, y:0, w:canvas.width/scale, h:canvas.height/scale }; }
  let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (d[(y*canvas.width + x)*4 + 3] > 2){
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(canvas.width - 1, x1 + 1); y1 = Math.min(canvas.height - 1, y1 + 1);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(canvas, -x0, -y0);
  return { img:out, x:x0/scale, y:y0/scale, w:out.width/scale, h:out.height/scale };
}

// Bake one rig at `scale` bitmap pixels per SVG unit.
async function bake(svgText, lockup, scale){
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const style = doc.getElementsByTagNameNS('*', 'style')[0];
  // The CSS pivots are for live SVG animation; the bake draws every part as drawn, so they are dropped.
  style.textContent = style.textContent.split('\n').filter(l => !/transform-(origin|box)|#shadeL,#shadeR/.test(l)).join('\n');
  const img = doc.getElementById('lockup').getElementsByTagNameNS('*', 'image')[0];
  img.setAttribute('href', lockup); img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', lockup);
  const root = doc.documentElement; root.setAttribute('width', 620*scale); root.setAttribute('height', 1000*scale);
  // the SVG uses the id "stem" twice (a gradient and the root group): take the group
  const stemEl = [...doc.getElementsByTagNameNS('*', 'g')].find(g => g.getAttribute('id') === 'stem');
  const leaves = ['path','rect','circle','ellipse','use','image','text'].flatMap(tag => [...stemEl.getElementsByTagNameNS('*', tag)]);
  const owner = el => { for (let p = el.parentNode; p && p.getAttribute; p = p.parentNode){ const id = p.getAttribute('id'); if (ORDER.includes(id)) return id; } };
  const own = leaves.map(owner);
  const lock = doc.getElementById('lockup'), shL = doc.getElementById('shadeL'), shR = doc.getElementById('shadeR');
  const ser = new XMLSerializer();
  const render = async part => {
    leaves.forEach((el, i) => el.setAttribute('visibility', own[i] === part ? 'visible' : 'hidden'));
    const im = await blobImage(ser.serializeToString(doc));
    const cv = document.createElement('canvas'); cv.width = Math.ceil(620*scale); cv.height = Math.ceil(1000*scale);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    return crop(cv, scale);
  };
  const rig = { scale, parts:{}, heads:{} };
  for (const p of ORDER) if (p !== 'head') rig.parts[p] = await render(p);
  for (const t of TURNS){
    // The SVG's head-turn recipe: slide and narrow the lock-up inside the face clip, shade the far side.
    const r = t*Math.PI/180, X = 150*Math.sin(r), S = Math.cos(r);
    lock.setAttribute('transform', `translate(${317 + X} 214) scale(${S} 1) translate(-317 -214)`);
    shL.setAttribute('style', `opacity:${t < 0 ? 0 : Math.min(1, t/45)*.5}`);
    shR.setAttribute('style', `opacity:${t > 0 ? 0 : Math.min(1, -t/45)*.5}`);
    rig.heads[t] = await render('head');
  }
  return rig;
}

let source = null;
M.puppet = {
  REST, KEYS, HEIGHT, TURNS,
  async load(base){
    const [svg, lock] = await Promise.all([fetch(base + 'mike.svg').then(r => r.text()), dataURL(base + 'mtdcnc-lockup-stacked-white.png')]);
    source = { svg, lock };
  },
  bake(scale){ return bake(source.svg, source.lock, scale); },

  // pose: angles in degrees (clockwise positive, offsets from the drawing), bob in SVG units (+ is down), turn in degrees.
  draw(c, rig, pose, x, y, px, opts){
    const k = px / HEIGHT, parts = rig.parts;
    c.save(); c.translate(x, y); c.scale(k, k); c.translate(-FOOT[0], -FOOT[1] + (pose.bob || 0));
    if (pose.tilt){ c.translate(HIP[0], HIP[1]); c.rotate(pose.tilt*Math.PI/180); c.translate(-HIP[0], -HIP[1]); }
    const t = Math.max(-40, Math.min(40, Math.round((pose.turn || 0)/5)*5));
    for (const name of ORDER){
      const P = name === 'head' ? rig.heads[t] : parts[name]; if (!P) continue;
      c.save();
      for (const j of CHAIN[name]){ const a = pose[j] || 0; if (a){ const [px_, py] = PIVOT[j]; c.translate(px_, py); c.rotate(a*Math.PI/180); c.translate(-px_, -py); } }
      c.drawImage(P.img, P.x, P.y, P.w, P.h);
      if (name === 'armR_lower' && pose.prop === 'camera') drawCamera(c, pose, opts && opts.facing || 1);
      c.restore();
    }
    c.restore();
  },
  lerp(a, b, u){ const o = {}; for (const k of KEYS) o[k] = a[k] + (b[k] - a[k])*u; o.prop = u < .5 ? a.prop : b.prop; return o; },

  // The design's poses (section 3). p is the run phase in radians; s is seconds in the state.
  pose(state, p, s, extra){
    const o = Object.assign({}, REST), sn = Math.sin(p);
    const locomote = () => {
      o.legL = -2 + 24*sn; o.legR = -2 - 24*sn; o.footL = 4 - 12*sn; o.footR = 4 + 12*sn;
      o.bob = -18*Math.abs(Math.cos(p)) + 9;         // 0.04T either side, twice per stride
    };
    switch (state){
      case 'idle':
        o.bob = Math.sin(s*2.1)*4; o.head = Math.sin(s*1.05)*1.5; break;
      case 'run':
        locomote();
        o.armL_upper = -75 - 22*sn; o.armL_lower = -15 - 8*sn;
        o.armR_upper = 22*sn; o.armR_lower = 8*sn;
        o.head = 3*Math.sin(2*p); break;
      case 'jump': case 'fall':
        o.legL = -18; o.legR = 18; o.footL = 12; o.footR = -8;
        o.armL_upper = -40; o.armL_lower = -10; o.armR_upper = -35; o.armR_lower = -15;
        o.head = state === 'jump' ? -4 : 3; break;
      case 'land':
        o.bob = 36; o.legL = 12; o.legR = -12; o.footL = -6; o.footR = 6; break;
      case 'hit':
        o.tilt = 10*(extra && extra.away || 1); o.armL_upper = -20; o.armL_lower = 0; o.armR_upper = -70; o.armR_lower = 0; o.head = 6; break;
      case 'fix':
        o.armR_upper = -105; o.armR_lower = -12 + 6*Math.sin(s*9); o.armL_upper = -55; o.armL_lower = -25;
        o.head = 6*Math.sin(s*2*Math.PI*2); break;
      case 'wave':
        o.armL_upper = 0; o.armL_lower = 12*Math.sin(s*14); o.head = 6*Math.sin(s*7); break;
    }
    if (extra && extra.camera){
      o.armR_upper = -105; o.armR_lower = -12; o.prop = 'camera';
      if (state === 'run'){ o.armL_upper = -75 - 10*sn; o.armL_lower = -15; }
    }
    return o;
  }
};

// A fictional, unbranded charcoal camcorder held in the right glove, kept level whatever the arm is doing.
function drawCamera(c, pose, facing){
  const a = ((pose.tilt || 0) + (pose.armR_upper || 0) + (pose.armR_lower || 0))*Math.PI/180;
  c.save(); c.translate(418, 600); c.rotate(-a); c.scale(1.45*facing, 1.45); c.translate(10, -8);
  c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#141416';
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  rr(-70, -58, 130, 84, 18); c.fillStyle = '#34383D'; c.fill(); c.stroke();
  rr(-58, -84, 56, 30, 10); c.fillStyle = '#2A2D31'; c.fill(); c.stroke();            // top handle
  rr(56, -46, 44, 60, 12); c.fillStyle = '#23262A'; c.fill(); c.stroke();             // lens barrel
  c.beginPath(); c.arc(100, -16, 22, 0, 7); c.fillStyle = '#5EA8E8'; c.fill(); c.stroke();
  c.beginPath(); c.arc(94, -24, 7, 0, 7); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill();
  c.beginPath(); c.arc(-46, -34, 8, 0, 7); c.fillStyle = '#E6E8E9'; c.fill();
  c.restore();
}
})();
