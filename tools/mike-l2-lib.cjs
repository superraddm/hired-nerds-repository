// Shared by the Level 2 suites: the real rules (js/world.js + js/l2-world.js) loaded into Node, and a player that
// uses only ordinary inputs. Nothing here teleports Mike or protects him; a suite that needs a special starting
// position says so where it places him.
//
// The player plans the way a person does: it tries a move on a copy of the game, and if a machine would hurt him it
// waits a little longer and tries again. Every real step goes through exec(), so a run can be recorded.
const fs = require('fs'), vm = require('vm'), path = require('path');
const base = path.resolve(__dirname, '../public/fireworks/mike-game');
function engine(){
  const ctx = { window:{} }; vm.createContext(ctx);
  for (const f of ['world.js', 'l2-world.js']) vm.runInContext(fs.readFileSync(path.join(base, 'js', f), 'utf8'), ctx, { filename:f });
  return ctx.window.MIKE;
}
const M = engine(), E = M.L2, K = M.PHYS;
const levelData = () => JSON.parse(fs.readFileSync(path.join(base, 'level-2.json'), 'utf8'));
const lib = { onStep:null };
const exec = (S, inp) => { if (lib.onStep) lib.onStep(inp || {}, S); E.step(S, inp || {}); return S; };
const play = (S, seq) => { for (const i of seq) exec(S, i); return S; };

const step = (S, n, inp) => { for (let i = 0; i < n; i++) exec(S, inp); return S; };
const place = (S, x, y) => { S.P = M.newPlayer(x, y); S.P.hitT = 9; S.wet = false; return S; };
function steer(P, x, tol){
  const d = x - P.x, brake = P.vx*P.vx/(P.ground ? 84 : 36) + .07;
  let dir = Math.abs(d) > (tol || .08) ? Math.sign(d) : 0;
  if (Math.sign(P.vx) === Math.sign(d) && Math.abs(d) < brake && Math.abs(P.vx) > .25) dir = -Math.sign(P.vx);
  return { left:dir < 0, right:dir > 0 };
}
const hurt = (a, b) => b.health < a.health || b.lives < a.lives || b.dead > 0;
const standsAt = (S, x, y, tol) => S.P.ground && !S.wet && Math.abs(S.P.y - y) < .1 && Math.abs(S.P.x - x) < (tol || .6);
const film = (S, o) => !!(o && o.film && !S.cam.on && S.cam.cool <= 0 && S.cam.left >= (S.boss.on && !S.boss.done ? M.CLIP.cost - 1e-6 : o.film === true ? 1.5 : o.film));

// Try a policy on a copy: inputs until done(copy) is true. null if he is hurt, lets the suit charge too far or runs out of time.
function attempt(S, policy, done, max, o){
  o = o || {};
  const c = E.clone(S), seq = [];
  for (let f = 0; f < (max || 600); f++){
    const inp = policy(c, f) || {};
    E.step(c, inp); seq.push(inp);
    if (hurt(S, c) || (c.headWet && (E.W.limit - c.static) < (o.margin === undefined ? 2 : o.margin))) return null;
    if (done(c, f)){
      // a move is only good if he is still unhurt a moment after finishing it
      const d = E.clone(c); for (let i = 0; i < (o.settle === undefined ? 20 : o.settle); i++){ E.step(d, o.rest ? o.rest(d) : {}); if (hurt(S, d)) return null; }
      return seq;
    }
  }
  return null;
}
// The same, waiting first: hold(copy) for 0, 1, 2... steps of delay until the move comes off.
function delayed(S, hold, policy, done, o){
  o = o || {};
  for (let k = 0; k <= (o.maxDelay === undefined ? 480 : o.maxDelay); k += (o.every || 6)){
    const seq = attempt(S, (c, f) => f < k ? hold(c, f) : policy(c, f - k), (c, f) => f >= k && done(c, f - k), (o.max || 600) + k, o);
    if (seq) return seq;
  }
  return null;
}

// One dry move to a landing at (x, y): a walk, or a jump whose take-off moment and hold are searched.
function planDry(S, x, y, o){
  o = o || {};
  // take-off spots: where he stands, the edge of what he stands on nearest the landing, and half way
  const sup = S.P.support, dir = Math.sign(x - S.P.x) || 1, edge = sup ? (dir > 0 ? Math.min(sup.x + sup.w - .15, x) : Math.max(sup.x + .15, x)) : S.P.x;
  const froms = o.from === undefined ? [...new Set([edge, (S.P.x + edge)/2, S.P.x])] : [o.from];
  const landed = (c, f, t0) => { const sup = c.P.support; return f > 2 && c.P.ground && !c.wet && Math.abs(c.P.y - y) < .1 && (Math.abs(c.P.x - x) < (o.tol || .55) || (o.anywhere && sup && x >= sup.x && x <= sup.x + sup.w && f > t0 + 3)); };
  if (y >= S.P.y - .1 && !o.leapOnly){
    const seq = delayed(S, c => steer(c.P, S.P.x), c => steer(c.P, x), (c, f) => landed(c, f, -9), { maxDelay:o.maxDelay === undefined ? 300 : o.maxDelay, every:9, max:300, settle:o.settle });
    if (seq) return seq;
  }
  for (const hold of o.holds || [45, 14, 26]) for (const from of froms) for (let delay = 0; delay <= (o.maxDelay === undefined ? 360 : o.maxDelay); delay += 4){
    let failed = false;
    const seq = attempt(S, (c, f) => {
      if (f < delay) return steer(c.P, from);
      if (f === delay && Math.abs(c.P.x - from) > .2 && delay < 60) failed = true;        // not at the take-off spot yet
      if (f > delay + 3 && (c.P.ground || c.wet) && !landed(c, f, delay)) failed = true;
      return Object.assign(steer(c.P, x), { jump:f < delay + hold });
    }, (c, f) => failed || landed(c, f, delay), 260 + delay, { settle:o.settle });
    if (seq && !failed) return seq;
  }
  return null;
}
function go(S, x, y, o){
  for (let n = 0; n < 40; n++){
    if (standsAt(S, x, y, o && o.tol)) return S;
    const seq = planDry(S, x, y, o);
    if (seq) play(S, seq); else step(S, 12);
    if (S.dead > 0 || S.won) break;
  }
  if (standsAt(S, x, y, o && o.tol)) return S;
  throw Error(`dry route stalled at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} aiming for ${x},${y} (health ${S.health})`);
}
function swimInput(S, x, y, tol){
  const P = S.P, dx = x - P.x, dy = y - P.y, t = tol || .15;
  return { left:dx < -t, right:dx > t, dive:dy > t, jump:dy < -t && !(S.surface !== null && P.y <= S.surface + E.W.float + .03) };
}
// Swim (or walk into the water and swim) to (x, y), waiting where he is until the way is clear of machines.
function swimTo(S, x, y, o){
  o = o || {};
  const tol = o.tol || .3, tolY = o.tolY || tol, there = c => Math.abs(c.P.x - x) < tol && Math.abs(c.P.y - y) < tolY;
  if (there(S)) return S;
  const hx = o.holdAt ? o.holdAt[0] : S.P.x, hy = o.holdAt ? o.holdAt[1] : S.P.y;
  const seq = delayed(S, c => swimInput(c, hx, hy, .08), (c, f) => Object.assign(swimInput(c, x, y), film(c, o) && f === 0 ? { camera:true } : {}), there,
    { maxDelay:o.maxDelay === undefined ? 600 : o.maxDelay, every:6, max:o.frames || 900, margin:o.margin, settle:o.settle, rest:c => swimInput(c, x, y, .08) });
  if (!seq) throw Error(`swim stalled at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} aiming for ${x},${y} (static margin ${(E.W.limit - S.static).toFixed(1)}, health ${S.health})`);
  return play(S, seq);
}
// Float at the surface beside a rim, then leap out onto it: the take-off spot and moment are searched on a copy.
function leapOut(S, x, y, o){
  o = o || {};
  const dir = Math.sign(x - S.P.x) || 1;
  for (const back of o.backs || [1.2, .6, 2, 3, .2, 0]) for (const hold of [40, 14]){
    const from = x - dir*(back ? back + .4 : 0);
    let launched = -1, ready = 0;
    const policy = (c, f) => {
      if (f === 0){ launched = -1; ready = 0; }
      const P = c.P;
      if (launched < 0){
        const lv = c.surface, fy = lv === null ? P.y : lv + E.W.float;
        if (Math.abs(P.x - from) < .25 && c.wet && P.y <= fy + .05 && ++ready > 3){ launched = f; return {}; }
        return swimInput(c, from, fy, .12);
      }
      const k = f - launched; return Object.assign(steer(P, x), { jump:k >= 1 && k < hold });
    };
    const seq = delayed(S, c => swimInput(c, S.P.x, c.surface === null ? S.P.y : Math.max(S.P.y, c.surface + E.W.float), .1), policy, (c, f) => launched >= 0 && f > launched + 6 && c.P.ground && !c.wet && Math.abs(c.P.y - y) < .1,
      { maxDelay:o.maxDelay === undefined ? 360 : o.maxDelay, every:12, max:420, settle:o.settle });
    if (seq){ play(S, seq); return go(S, x, y, { anywhere:o.anywhere, tol:o.tol }); }
  }
  throw Error(`could not leap out at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} onto ${x},${y} (surface ${S.surface}, health ${S.health})`);
}
const press = (S, key) => { exec(S, {}); exec(S, { [key]:true }); exec(S, {}); return S; };
// Hold Fix where he stands until `done`, waiting first for a moment when the machines will let him finish.
function holdFix(S, done, o){
  o = o || {};
  const still = c => (c.wet ? { dive:true } : {});
  const seq = delayed(S, o.hold || still, c => Object.assign({ fix:true }, still(c)), done, { maxDelay:o.maxDelay === undefined ? 900 : o.maxDelay, every:6, max:o.max || 400, margin:o.margin, settle:o.settle === undefined ? 8 : o.settle });
  if (!seq) throw Error(`could not hold Fix at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} (health ${S.health}, static margin ${(E.W.limit - S.static).toFixed(1)})`);
  return play(S, seq);
}

// ---------- a route, travelled the way a careful player would ----------
// A route is a list of waypoints. At each one the player may go on, wait a quarter of a second, or step back to the
// one before; it searches those choices on copies of the game until it finds a way to the end with no hit taken and
// the suit's charge well short of full, then plays the inputs for real. Waypoint: { x, y, via, wet, done, tol, tolY, anywhere, film, key }.
//   via 'go'    a walk or a jump to a dry landing (the default on dry land)
//   via 'swim'  swim there; from dry land this walks into the water first (the default for wet:true)
//   via 'leap'  leave the water onto a dry landing (the default when he is swimming and the waypoint is dry)
//   via 'fix'   hold Fix where he is until done(state)
//   via 'press' one press of `key` (default fix)
//   via 'until' stay put until done(state)
const val = (v, c) => typeof v === 'function' ? v(c) : v;
function result(S, policy, done, max, o){
  o = o || {}; const c = E.clone(S), seq = [];
  for (let f = 0; f < max; f++){
    const inp = policy(c, f) || {}; E.step(c, inp); seq.push(inp);
    if (hurt(S, c) || (c.headWet && (E.W.limit - c.static) < (o.margin === undefined ? 2.5 : o.margin))) return null;
    if (done(c, f)) return { seq, state:c };
  }
  return null;
}
function moveTo(S, W, o){
  const wetNow = S.wet, via = W.via || (W.wet ? 'swim' : wetNow ? 'leap' : 'go'), x = val(W.x, S), y = val(W.y, S);
  const cam = (c, f) => film(c, W) && f === 0 ? { camera:true } : {};
  if (via === 'go'){
    const sup = S.P.support, dir = Math.sign(x - S.P.x) || 1, edge = sup ? (dir > 0 ? Math.min(sup.x + sup.w - .15, x) : Math.max(sup.x + .15, x)) : S.P.x;
    const landed = (c, f, t0) => { const p = c.P.support; return f > 2 && c.P.ground && !c.wet && Math.abs(c.P.y - y) < .1 && (Math.abs(c.P.x - x) < (W.tol || .55) || (W.anywhere && p && x >= p.x && x <= p.x + p.w && f > t0 + 3)); };
    if (y >= S.P.y - .1){
      const r = result(S, (c, f) => Object.assign(steer(c.P, x), cam(c, f)), (c, f) => landed(c, f, -9), 200); if (r) return r;
      // a landing below: step off one end of what he stands on, then steer for it
      if (sup && y > S.P.y + .1) for (const off of dir > 0 ? [sup.x + sup.w + .6, sup.x - .6] : [sup.x - .6, sup.x + sup.w + .6]){
        let left = false;
        const q = result(S, (c, f) => { if (f === 0) left = false; if (!left && (!c.P.ground || c.P.support !== sup)) left = true; return steer(c.P, left ? x : off); }, (c, f) => left && landed(c, f, -9), 300);
        if (q) return q;
      }
    }
    for (const hold of W.holds || [45, 14, 26]) for (const from of W.from === undefined ? [...new Set([S.P.x, edge, (S.P.x + edge)/2])] : [W.from]){
      let t0 = -1, failed = false;
      const r = result(S, (c, f) => {
        if (f === 0){ t0 = -1; failed = false; }
        if (t0 < 0){ if (Math.abs(c.P.x - from) < .12 && Math.abs(c.P.vx) < .6){ t0 = f; } else { if (f > 90) failed = true; return Object.assign(steer(c.P, from), cam(c, f)); } }
        // down somewhere else is a failed jump; down at the right height is a landing he may still walk along
        if (f > t0 + 3 && (c.wet || (c.P.ground && Math.abs(c.P.y - y) > .1))) failed = true;
        return Object.assign(steer(c.P, x), { jump:f < t0 + hold }, cam(c, f));
      }, (c, f) => failed || (t0 >= 0 && landed(c, f, t0)), 300);
      if (r && !failed) return r;
    }
    return null;
  }
  if (via === 'swim'){
    const tol = W.tol || .3, tolY = W.tolY || tol;
    return result(S, (c, f) => Object.assign(swimInput(c, val(W.x, c), val(W.y, c)), cam(c, f)), c => (W.done ? W.done(c) : true) && Math.abs(c.P.x - val(W.x, c)) < tol && Math.abs(c.P.y - val(W.y, c)) < tolY, W.frames || 900, W);
  }
  if (via === 'leap'){
    const dir = Math.sign(x - S.P.x) || 1;
    for (const back of W.backs || [1.2, .6, 2, 3, .2, 0]) for (const hold of [40, 14]){
      const from = x - dir*(back ? back + .4 : 0); let launched = -1, ready = 0;
      const r = result(S, (c, f) => {
        if (f === 0){ launched = -1; ready = 0; }
        if (launched < 0){ const fy = c.surface === null ? c.P.y : c.surface + E.W.float; if (Math.abs(c.P.x - from) < .25 && c.wet && c.P.y <= fy + .05 && ++ready > 3){ launched = f; return {}; } return swimInput(c, from, fy, .12); }
        const k = f - launched; return Object.assign(steer(c.P, x), { jump:k >= 1 && k < hold });
      }, (c, f) => launched >= 0 && f > launched + 6 && c.P.ground && !c.wet && Math.abs(c.P.y - y) < .1 && (W.anywhere || Math.abs(c.P.x - x) < (W.tol || 1.2)), 420);
      if (r) return r;
    }
    return null;
  }
  // 'until' holds the waypoint's own spot when it has one (x or y may be a function of the state, such as the float line), else where he is
  const hx = c => W.x === undefined ? S.P.x : val(W.x, c), hy = c => W.y === undefined ? S.P.y : val(W.y, c);
  const stay = c => W.idle ? {} : c.wet ? Object.assign(swimInput(c, hx(c), hy(c), .08), W.sink ? { dive:true } : {}) : steer(c.P, hx(c));
  if (via === 'fix') return result(S, (c, f) => Object.assign({ fix:true }, c.wet ? { dive:true } : {}, cam(c, f)), W.done, W.frames || 400, W);
  if (via === 'press') return result(S, (c, f) => f === 1 ? { [W.key || 'fix']:true } : {}, (c, f) => f >= 2, 5);
  if (via === 'until') return result(S, stay, W.done, W.frames || 1800, W);
  throw Error('unknown move ' + via);
}
function travel(S, path, o){
  o = o || {};
  const memo = new Set(), WAIT = o.wait || 15; let calls = 0;
  const here = { x:S.P.x, y:S.P.y, wet:S.wet, via:S.wet ? 'swim' : 'go', tol:.6, tolY:.6 }, full = [here].concat(path);
  const stay = (c, W) => c.wet ? swimInput(c, val(W.x, c), val(W.y, c), .08) : steer(c.P, val(W.x, c));
  function solve(c, i, depth){
    if (i === full.length - 1) return [];
    if (depth > (o.depth || 140) || ++calls > (o.calls || 6000)) return null;
    const key = i + ':' + Math.round(c.time*4); if (memo.has(key)) return null; memo.add(key);
    const tries = [['fwd', () => full[i + 1].skip && full[i + 1].skip(c) ? { seq:[], state:c } : moveTo(c, full[i + 1]), i + 1], ['wait', () => result(c, k => stay(k, full[i]), (k, f) => f >= WAIT - 1, WAIT), i]];
    // stepping back goes to the place the last waypoint stood for, never repeats its action
    const prev = full[i - 1], special = v => ['fix', 'press', 'until'].includes(v);
    if (i > 0 && !full[i].noBack && !special(full[i].via) && typeof prev.x === 'number' && typeof prev.y === 'number')
      tries.push(['back', () => moveTo(c, { x:prev.x, y:prev.y, wet:prev.wet, tol:prev.tol, tolY:prev.tolY, anywhere:prev.anywhere, via:special(prev.via) ? undefined : prev.via }), i - 1]);
    for (const [, act, j] of tries){ const r = act(); if (!r) continue; const rest = solve(r.state, j, depth + 1); if (rest) return r.seq.concat(rest); }
    return null;
  }
  const seq = solve(E.clone(S), 0, 0);
  if (!seq) throw Error(`no safe way from ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} along ${path.map(w => (w.via || '') + '(' + (typeof w.x === 'number' ? w.x : '?') + ',' + (typeof w.y === 'number' ? w.y : '?') + ')').join(' ')} (health ${S.health}, static margin ${(E.W.limit - S.static).toFixed(1)}, ${calls} tries)`);
  return play(S, seq);
}

module.exports = { moveTo, travel, result, M, E, K, base, lib, levelData, exec, play, step, place, steer, hurt, standsAt, attempt, delayed, planDry, go, swimInput, swimTo, leapOut, press, holdFix };
