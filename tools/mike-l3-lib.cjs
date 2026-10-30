// Shared by the Level 3 suites: the real rules (js/world.js + js/l3-world.js) loaded into Node, and a player that uses
// only ordinary inputs. Nothing here teleports Mike or protects him; a suite that needs a special start says so.
// The player plans as a person does: it tries a move on a copy of the game, and if a machine would hurt him it waits
// a little longer and tries again. Every real step goes through exec(), so a run could be recorded.
// Adapted from tools/mike-l2-lib.cjs (dry moves only: Level 3 has no water).
const fs = require('fs'), vm = require('vm'), path = require('path');
const base = path.resolve(__dirname, '../public/fireworks/mike-game');
function engine(){
  const ctx = { window:{} }; vm.createContext(ctx);
  for (const f of ['world.js', 'l3-world.js']) vm.runInContext(fs.readFileSync(path.join(base, 'js', f), 'utf8'), ctx, { filename:f });
  return ctx.window.MIKE;
}
const M = engine(), E = M.L3, K = M.PHYS;
const levelData = () => JSON.parse(fs.readFileSync(path.join(base, 'level-3.json'), 'utf8'));
const lib = { onStep:null };
const exec = (S, inp) => { if (lib.onStep) lib.onStep(inp || {}, S); E.step(S, inp || {}); return S; };
const play = (S, seq) => { for (const i of seq) exec(S, i); return S; };
const step = (S, n, inp) => { for (let i = 0; i < n; i++) exec(S, typeof inp === 'function' ? inp(S) : inp); return S; };
function steer(P, x, tol){
  const d = x - P.x, brake = P.vx*P.vx/(P.ground ? 84 : 36) + .07;
  let dir = Math.abs(d) > (tol || .08) ? Math.sign(d) : 0;
  if (Math.sign(P.vx) === Math.sign(d) && Math.abs(d) < brake && Math.abs(P.vx) > .25) dir = -Math.sign(P.vx);
  return { left:dir < 0, right:dir > 0 };
}
const hurt = (a, b) => b.health < a.health || b.lives < a.lives || b.dead > 0;
const standsAt = (S, x, y, tol) => S.P.ground && !E.held(S) && Math.abs(S.P.y - y) < .1 && Math.abs(S.P.x - x) < (tol || .6);

// Try a policy on a copy: inputs until done(copy). null if he is hurt or time runs out.
function attempt(S, policy, done, max, o){
  o = o || {};
  const c = E.clone(S), seq = [];
  for (let f = 0; f < (max || 600); f++){
    const inp = policy(c, f) || {};
    E.step(c, inp); seq.push(inp);
    if (hurt(S, c)) return null;
    if (done(c, f)){
      const d = E.clone(c); for (let i = 0; i < (o.settle === undefined ? 24 : o.settle); i++){ E.step(d, o.rest ? o.rest(d) : {}); if (hurt(S, d)) return null; }
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
  const sup = S.P.support, dir = Math.sign(x - S.P.x) || 1, edge = sup ? (dir > 0 ? Math.min(sup.x + sup.w - .15, x) : Math.max(sup.x + .15, x)) : S.P.x;
  const froms = o.from === undefined ? [...new Set([edge, (S.P.x + edge)/2, S.P.x])] : [o.from];
  const landed = (c, f, t0) => { const s = c.P.support; return f > 2 && c.P.ground && !E.held(c) && Math.abs(c.P.y - y) < .1 && (Math.abs(c.P.x - x) < (o.tol || .55) || (o.anywhere && s && x >= s.x && x <= s.x + s.w && f > t0 + 3)); };
  if (y >= S.P.y - .1 && !o.leapOnly){
    const seq = delayed(S, c => steer(c.P, S.P.x), c => steer(c.P, x), (c, f) => landed(c, f, -9), { maxDelay:o.maxDelay === undefined ? 400 : o.maxDelay, every:8, max:420, settle:o.settle });
    if (seq) return seq;
  }
  for (const hold of o.holds || [45, 14, 26]) for (const from of froms) for (let delay = 0; delay <= (o.maxDelay === undefined ? 400 : o.maxDelay); delay += 4){
    let failed = false;
    const seq = attempt(S, (c, f) => {
      if (f < delay) return steer(c.P, from);
      if (f === delay && Math.abs(c.P.x - from) > .25 && delay < 60) failed = true;
      if (f > delay + 3 && c.P.ground && !landed(c, f, delay)) failed = true;
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
    if (seq) play(S, seq); else step(S, 12, c => steer(c.P, c.P.x));
    if (S.dead > 0 || S.won) break;
  }
  if (standsAt(S, x, y, o && o.tol)) return S;
  throw Error(`route stalled at ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)} aiming for ${x},${y} (health ${S.health})`);
}
// A carrier: walk into its hovering gripper and be carried to its next destination. Nothing hurts him while he is held.
function ride(S, id){
  const c = S.L.carriers.find(c => c.id === id), dest = c.drops[S.car[id].n % c.drops.length];
  const there = c2 => !c2.ride && c2.P.ground && Math.abs(c2.P.x - dest[0]) < .05 && Math.abs(c2.P.y - dest[1]) < .01;
  const seq = delayed(S, c2 => steer(c2.P, c2.P.x), c2 => c2.ride ? {} : steer(c2.P, c.home[0], .05), there, { maxDelay:300, every:6, max:1200, settle:30 });
  if (!seq) throw Error(`ride ${id} failed from ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)}`);
  return play(S, seq);
}
// A hook: jump into the handle when it comes, ride until the trolley is past releaseX, let go, land at (x, y).
function hook(S, id, releaseX, x, y){
  const h = S.L.hooks.find(h => h.id === id), dir = Math.sign(h.rail[1] - h.rail[0]);
  const grab = delayed(S, c => steer(c.P, S.P.x), (c, f) => ({ jump:f < 12 }), c => c.hang && c.hang.id === id, { maxDelay:600, every:4, max:60, settle:0 });
  if (!grab) throw Error(`could not grab hook ${id} from ${S.P.x.toFixed(2)},${S.P.y.toFixed(2)}`);
  play(S, grab);
  const seq = attempt(S, (c, f) => { const p = E.hookPose(h, c.mt); return (p.hx - releaseX)*dir >= 0 && c.hang ? { jump:true } : {}; },
    c => !c.hang && c.P.ground && Math.abs(c.P.y - y) < .1 && Math.abs(c.P.x - x) < 1.2, 900, { settle:20 });
  if (!seq) throw Error(`hook ${id}: letting go at ${releaseX} did not land at ${x},${y}`);
  return play(S, seq);
}
module.exports = { M, E, K, levelData, lib, exec, play, step, steer, hurt, standsAt, attempt, delayed, planDry, go, ride, hook };
