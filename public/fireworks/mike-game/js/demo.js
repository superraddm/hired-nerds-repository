// ?demo=1: ordinary-input QA controller. Authored waypoints plus forward-simulated jumps.
// Simulation copies Mike; the actual player only receives direction, jump, camera and fix inputs.
(function(){
'use strict';
const M = window.MIKE = window.MIKE || {};
const win = (t, a, b) => t >= a && t < b;
// Each step: ['jump', x, hold s] take off once past x while grounded; ['wait', x, test] stand at x until test(api);
// ['gate', id] wait on the pad, film when the light goes green, run through; ['run', x] just run to x.
const PLAN = [
  ['jump', 11.9, .45],                                              // onto the first shelf
  ['wait', 43.6, a => a.beltSpeed('belt-2a') < -2.5, true], ['jump', 44.25, .45],   // the first pit, belt running against
  ['jump', 51.6, .45],                                              // onto the cover shelf
  ['wait', 57.2, a => win(a.hazT('spitter-2'), 1.95, 2.5)], ['jump', 57.25, .45],   // over the lathe after a burst
  ['gate', 'gallery'],
  ['jump', 107.9, .45],                                             // onto the first stores shelf
  ['jump', 113.5, .45],                                             // over the pit
  ['jump', 121.2, .45],                                             // onto the second stores shelf
  ['gate', 'arm-gate'],
  ['jump', 170.9, .45],                                             // coolant loft: onto the low shelf
  ['wait', 176.4, a => win(a.hazT('coolant-6a'), 1.85, 2.6)], ['jump', 176.6, .45],  // up to the high shelf over the jet
  ['jump', 185.0, .45],                                             // onto the third shelf
  ['jump', 190.6, .45],                                             // over the second jet
  ['wait', 214.9, a => a.beltSpeed('belt-7a') < -2.5, true], ['jump', 215.2, .45],   // belt running against: a short hop
  ['wait', 222.9, a => a.beltSpeed('belt-7b') < -2.5, true], ['jump', 223.2, .45],
  ['wait', 232.2, a => win(a.hazT('spitter-7'), 1.95, 2.5)], ['jump', 236.1, .45],   // run the grinder's lane after a burst
  ['gate', 'jaws'],
  ['wait', 262.3, a => win(a.hazT('coolant-8'), 1.85, 2.4)], ['jump', 262.3, .45],
  ['run', 276]
];
let i = 0, held = 0, cam = false, mode = null, home = 298, lastP = null;
function reset(){ i = 0; held = 0; cam = false; mode = null; home = 938; lastStep = -1; bossFlight = []; bossWait = 0; bossRelease = false; routeSection=null; routeIndex=0; flight=[]; lastP=null; }
function next(a){
  const { P, B, CAMR } = a, out = { left:false, right:false, jump:false, camera:false, fix:false };
  if (!P) return out;
  if (P !== lastP){                                                // respawned: pick the script up from the checkpoint
    if (lastP){ held = 0; cam = false; mode = null; bossFlight = []; i = PLAN.findIndex(s => s[0] === 'gate' ? a.L.hazards.find(h => h.id === s[1]).rect[0] > P.x : s[1] >= P.x - .3); if (i < 0) i = PLAN.length; }
    lastP = P;routeSection=null;routeIndex=0;flight=[];
  }
  if (held > 0){ held -= 1/60; out.jump = true; out.right = true; if (held <= 0) held = 0; return out; }
  if (B.on) return boss(a, out);
  if(P.x>=275 && P.x<936) return expandedRoute(a,out);
  const step = PLAN[i];
  if (!step){ out.right = true; return out; }
  const [kind, x, arg] = step;
  if (kind === 'run'){ out.right = true; if (P.x >= x) i++; return out; }
  if (kind === 'jump'){
    out.right = true;
    if (P.x >= x && P.ground){ out.jump = true; held = arg; i++; }
    return out;
  }
  if (kind === 'wait'){
    if (P.x < x - .15){ out.right = true; return out; }
    if (step[3] && P.x > x + .25){ out.left = true; return out; } // on a belt carrying us on: hold position
    if (arg(a)) i++;
    return out;
  }
  if (kind === 'gate'){
    const h = a.L.hazards.find(h => h.id === x), gx = h.rect[0], gw = h.rect[2], st = a.gateState(x);
    if (P.x > gx + gw + .6){ i++; return out; }
    if (P.x < gx - .9){ out.right = true; return out; }                // walk to the pad
    if (st === 'green'){ out.right = true; if (!CAMR.on && !cam){ out.camera = true; cam = true; } return out; }
    cam = false;                                                       // back on the pad after a miss: try the next cycle
    return out;
  }
  return out;
}
function expandedRoute(a,out){
  const {P,CAMR,L,G}=a,s=L.sectionAt(P.x);
  if(!s.route){out.right=true;return out;}
  if(routeSection!==s.id){routeSection=s.id;routeIndex=0;flight=[];}
  const target=s.route[routeIndex];
  if(!target){out.right=true;return out;}
  if(P.hitT<.1){flight=[];}
  if(flight.length){const f=flight.shift();Object.assign(out,f);return out;}
  if(target.lift){
    const lift=L.lifts.find(l=>l.id===target.lift),p=M.liftPose(lift,G.mt);
    if(P.support?.id===lift.id){if(p.y<=lift.to[1]+.04){routeIndex++;}return steer(out,P,p.x+p.w/2);}
    if(p.y>lift.at[1]-.15&&P.ground)flight=planJump(a,p.x+p.w/2,p.y);
    if(flight.length)Object.assign(out,flight.shift());
    return out;
  }
  const tx=s.x+target[0],ty=target[1];
  if(P.ground&&Math.abs(P.y-ty)<.12&&Math.abs(P.x-tx)<.8){routeIndex++;return out;}
  // Full-height gates must be filmed on green; their roofs are a separate optional route.
  const gate=L.hazards.find(h=>['jaws','armGate','spitterGallery'].includes(h.type)&&h.rect[0]+h.rect[2]>P.x-.3&&h.rect[0]<tx&&P.y>9);
  if(gate&&gate.rect[0]-P.x<2.5){
    const gx=gate.rect[0];
    if(P.x>gx+gate.rect[2]+.5){if(CAMR.on)out.camera=true;}
    else if(a.gateState(gate.id)==='green'){out.right=true;if(!CAMR.on&&CAMR.cool<=0)out.camera=true;return out;}
    else return steer(out,P,gx-.85);
  }
  if(P.ground){
    flight=planJump(a,tx,ty);
    if(flight.length)return Object.assign(out,flight.shift());
    // Move towards a distant launch edge; never blindly run off the support.
    const support=P.support,dir=Math.sign(tx-P.x);
    if(support){const edge=dir>0?support.x+support.w-.6:support.x+.6;return steer(out,P,dir>0?Math.min(tx,edge):Math.max(tx,edge));}
  }else steer(out,P,tx);
  return out;
}
let routeSection=null,routeIndex=0,flight=[];
function steer(out,P,x){
  const d=x-P.x,brake=P.vx*P.vx/(P.ground?84:36)+.07;
  let dir=Math.abs(d)>.08?Math.sign(d):0;
  if(Math.sign(P.vx)===Math.sign(d)&&Math.abs(d)<brake&&Math.abs(P.vx)>.25)dir=-Math.sign(P.vx);
  out.left=dir<0;out.right=dir>0;return out;
}
function planJump(a,x,y){
  const {L,G,P}=a;
  for(const leap of [false,true])for(let delay=0;delay<90;delay+=3){
    if(!leap&&delay)break;
    if(a.B.on&&delay)break;                                        // in the arena: hop now or not at all
    if(!leap&&y<P.y-.1)continue;
    const p={...P},seq=[];let jumped=false,failed=false;
    for(let f=0;f<210;f++){
      const inp={left:false,right:false,jump:leap&&f>=delay&&f<delay+45};steer(inp,p,x);
      const time=G.mt+f/60*(G.ts||1),moving=L.lifts.map(l=>M.liftPose(l,time));
      if(p.ground&&p.support?.kind==='lift'){
        const deck=moving.find(l=>l.id===p.support.id);p.y+=deck.y-p.support.y;p.x+=deck.x-p.support.x;
      }
      M.stepPlayer(L,p,{...inp,jumpEdge:leap&&f===delay},1/60,G.bounds,G.extra.filter(s=>s.kind!=='lift').concat(moving),b=>a.beltSpeed(b.id)*(G.ts||1));
      seq.push(inp);if(leap&&f===delay)jumped=true;
      if(p.y>18){failed=true;break;}
      for(const h of L.hazards){
        const ht=((time+(h.phase||0))%h.cycle+h.cycle)%h.cycle;
        if(h.type==='railSpindle'){
          const tip=M.railTip(h,ht);
          if(tip.danger&&Math.abs(p.x-tip.x)<1.12&&tip.y>p.y-2.3&&tip.y<p.y+.7){failed=true;break;}
        }
        if(h.type==='coolant'&&ht>=.7&&ht<1.8){const [jx,jy,jw,jh]=h.jet;if(p.x+.4>jx&&p.x-.4<jx+jw&&p.y>jy&&p.y-1.65<jy+jh){failed=true;break;}}
      }
      if(!failed&&a.B.on&&!a.B.done&&bossHits(a,p.x,p.y,a.B.t+bossAdvance(a,f/60),.04))failed=true;
      if(!failed)for(const d of L.decor)if(d.type==='demoDrill'){const dp=M.drillPose(d,time);if(dp.danger&&p.x+.55>dp.x-.2&&p.x-.55<dp.x+.2&&p.y>dp.tipY-1.35&&p.y-1.8<dp.tipY){failed=true;break;}}
      if(failed)break;
      if(f>2&&p.ground&&Math.abs(p.y-y)<.12&&(Math.abs(p.x-x)<.55||(jumped&&f>delay+3&&p.support&&x>=p.support.x&&x<=p.support.x+p.support.w)))return seq;
      if(jumped&&f>delay+3&&p.ground)break;
    }
  }
  return [];
}
// The Five-Axis Fault: nine ordered repairs on three levels. The autopilot predicts both heads with the game's own
// bossTips(time), only hops when the hop and the landing are clear, and only starts a repair it can finish; it films
// when the parked window alone is too short.
let bossFlight = [], bossWait = 0, bossRelease = false;
const bossNodes = bx => ({ F:null, A:[bx + 8.5, 10], P2:[bx + 12, 8.5], Bn:[bx + 15.5, 7.6], P3:[bx + 19.25, 6.5] });
function bossWhere(P){ const y = P.y; return Math.abs(y - 12) < .2 ? 'F' : Math.abs(y - 10) < .2 ? 'A' : Math.abs(y - 8.5) < .2 ? 'P2' : Math.abs(y - 7.6) < .2 ? 'Bn' : Math.abs(y - 6.5) < .2 ? 'P3' : '?'; }
function bossHop(a, tg){
  const bx = a.L.boss.bounds[0], N = bossNodes(bx), at = bossWhere(a.P);
  const goal = tg.y > 11 ? 'F' : tg.y > 8 ? 'P2' : 'P3';
  if (at === goal) return { x:tg.x, y:tg.y };
  const up = { F:'A', A:'P2', P2:'Bn', Bn:'P3' }, down = { P3:'Bn', Bn:'P2', P2:'A', A:'F' };
  const order = ['F', 'A', 'P2', 'Bn', 'P3'], next = order.indexOf(goal) > order.indexOf(at) ? up[at] : down[at];
  if (!next) return { x:tg.x, y:12 };
  if (at === 'F' && next === 'A' && Math.abs(a.P.x - (bx + 7)) > 1.2) return { x:bx + 7, y:12 };   // walk under the first step, then hop
  return next === 'F' ? { x:tg.y > 11 && Math.abs(a.P.x - tg.x) < 6 ? tg.x : bx + 6.2, y:12 } : { x:N[next][0], y:N[next][1] };
}
function bossHits(a, x, y, bt, margin){
  for (const tip of a.bossTips(bt)) if (tip.danger){
    const cx = Math.max(x - .375, Math.min(x + .375, tip.x)), cy = Math.max(y - 1.65, Math.min(y, tip.y));
    if (Math.hypot(tip.x - cx, tip.y - cy) < .5 + (margin || .2)) return true;
  }
  return false;
}
function bossAdvance(a, seconds, film){
  const C = a.CAMR, remaining = film ? M.CLIP.length : C.on ? M.clipRemaining(C) : 0;
  return Math.min(seconds, remaining)*M.CAMERA.scale + Math.max(0, seconds - remaining);
}
// Is standing at (x, y) safe for `secs` of player time, from machine time bt, with or without the camera running?
function bossStandSafe(a, x, y, secs, film, bt){
  const start = bt === undefined ? a.B.t : bt;
  for (let f = 0; f <= secs*60; f += 2){
    if (bossHits(a, x, y, start + bossAdvance(a, f/60, film), .04)) return false; }
  return true;
}
function boss(a, out){
  const { P, B, CAMR } = a, tg = a.bossTarget();
  if (B.done || !tg){ bossFlight = []; return out; }
  if (bossFlight.length){ Object.assign(out, bossFlight.shift()); if (!bossFlight.length && out.jump) bossRelease = true; return out; }
  // Short jumps can land before Jump was released. A new hop needs a fresh edge in the actual game.
  if (bossRelease){ bossRelease = false; return out; }
  if (B.trans > 0 || !P.ground) return out;
  if (bossWait > 0){ bossWait--; if ((!B.eligible || B.fix === 0) && bossStandSafe(a, P.x, P.y, .25, false)) return out; }
  const hold = a.L.boss.hold + .15;
  const recharge = CAMR.left < M.CLIP.cost - 1e-6 && !B.fix && (!CAMR.on || M.CLIP.length - CAMR.t < hold);
  const refuge = { x:a.L.boss.bounds[0] + (P.x < a.L.boss.bounds[0] + 12 ? 2 : 22), y:12 };
  if (recharge && P.ground && Math.abs(P.y - 12) < .1 && Math.abs(P.x - refuge.x) < .2) return steer(out, P, refuge.x);
  // at the service point: repair if it can be finished, filming if that is what makes it fit
  if (B.eligible && !recharge){
    if (B.fix > 0 || bossStandSafe(a, P.x, P.y, hold, false)){ out.fix = true; return out; }
    if (!CAMR.on && CAMR.cool <= 0 && CAMR.left >= M.CLIP.cost - 1e-6 && bossStandSafe(a, P.x, P.y, hold, true)){ out.camera = true; return out; }
    bossWait = 4;
  } else {
    const hop = recharge ? refuge : bossHop(a, tg);
    const seq = planJump(a, hop.x, hop.y);
    if (seq.length){
      const arrive = B.t + bossAdvance(a, seq.length/60);
      const atJob = !recharge && Math.abs(hop.x - tg.x) < .1 && Math.abs(hop.y - tg.y) < .1;
      const canFilm = !CAMR.on && CAMR.cool <= 0 && CAMR.left >= M.CLIP.cost - 1e-6;
      const landingSafe = atJob && canFilm ? bossStandSafe(a, hop.x, hop.y, hold + .2, true, arrive) : bossStandSafe(a, hop.x, hop.y, .3, false, arrive);
      if (landingSafe){ bossFlight = seq.slice(1); Object.assign(out, seq[0]); return out; }
    }
    // Film a difficult approach too; the simulation accounts for the clip expiring during a jump.
    if (!recharge && !CAMR.on && CAMR.cool <= 0 && CAMR.left >= M.CLIP.cost - 1e-6 && Math.abs(hop.x - tg.x) < .1 && Math.abs(hop.y - tg.y) < .1 && Math.abs(P.x - tg.x) < 2){
      const filmed = Object.assign({}, a, { CAMR:Object.assign({}, CAMR, { on:true, t:0 }), G:Object.assign({}, a.G, { ts:M.CAMERA.scale }) });
      const route = planJump(filmed, hop.x, hop.y);
      if (route.length && bossStandSafe(filmed, hop.x, hop.y, .3, false, B.t + bossAdvance(filmed, route.length/60))){
        bossFlight = route.slice(1); Object.assign(out, route[0], { camera:true }); return out;
      }
    }
    bossWait = 2;
  }
  // not yet: stay put if that is safe, otherwise step to the nearest refuge or deck that is
  if (bossStandSafe(a, P.x, P.y, B.eligible ? .8 : .4, false)) return out;
  const bx = a.L.boss.bounds[0], N = bossNodes(bx);
  for (const [x, y] of [[P.x, P.y], [bx + 2, 12], [bx + 22, 12], N.A, N.P2, N.Bn, N.P3]){
    const seq = planJump(a, x, y);
    if (seq.length && bossStandSafe(a, x, y, .9, false, B.t + seq.length/60*(a.G.ts || 1))){ bossFlight = seq.slice(1); Object.assign(out, seq[0]); return out; }
  }
  return out;
}

let lastStep = -1;
M.demo = {
  reset,
  next(a){
    // after each fitting, head back to a safe lane
    if (a.B.on && a.B.step !== lastStep){
      const repaired = lastStep >= 0 && a.B.step > lastStep; lastStep = a.B.step;
      if (repaired && a.CAMR.on) return {camera:true}; // bank the unused take before planning the next climb
    }
    if (!a.B.on) lastStep = a.B.step;
    return next(a);
  }
};
})();
