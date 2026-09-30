// Stationary, uninterrupted repairs after startup: test the full horizontal interaction range,
// not just the centre of a socket. This is a timing bound, not a human-difficulty score or a
// claim about damage-tanking strategies. Traversal is checked separately with ordinary inputs.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const { M, E, base, levelData } = require('./mike-l2-lib.cjs');
const DT = 1/120, offsets = [-.8, -.4, 0, .4, .8], HW = M.PHYS.halfW, HT = M.PHYS.height;
const box = (p, x0, y0, x1, y1) => p.x + HW > x0 && p.x - HW < x1 && p.y > y0 && p.y - HT < y1;
const circle = (p, q) => q.danger && (q.x - Math.max(p.x-HW, Math.min(p.x+HW, q.x)))**2 + (q.y - Math.max(p.y-HT, Math.min(p.y, q.y)))**2 < .25;
function longest(danger, duration){ let best=0, run=0; for(let f=0; f<duration/DT; f++){ run=danger(f*DT) ? 0 : run+DT; best=Math.max(best,run); } return best; }
const round = n => +n.toFixed(3), rows1 = [], rows2 = [];

// Execute the production head geometry directly. No copied attack formulas to drift out of sync.
const L1 = JSON.parse(fs.readFileSync(path.join(base,'level-1.json'),'utf8'));
const B = {on:true,done:false,trans:0,t:0,run:0,order:0,step:0};
const ctx = { L:L1, B, KINDS:['bearing','seal','coupling'], KIND_NUM:{bearing:1,seal:2,coupling:3}, BX:()=>L1.boss.bounds[0] };
vm.createContext(ctx);
const source = fs.readFileSync(path.join(base,'js/game.js'),'utf8');
const a=source.indexOf('const lerpP ='), b=source.indexOf('const kit =',a);
assert.ok(a>=0 && b>a, 'production boss geometry found');
vm.runInContext(source.slice(a,b)+'\nthis.tips=bossTips;',ctx);
const cycle = Object.values(L1.boss.timeline).reduce((a,b)=>a+b,0), period=cycle*(L1.boss.secondaryEvery||1);
B.run=period;
for(let order=0;order<3;order++) for(let repair=0;repair<9;repair++) for(const dx of offsets){
  B.order=order; B.step=repair;
  const socket=L1.boss.sockets[L1.boss.orders[order][repair]-1], p={x:socket[0]+dx,y:socket[1]};
  const seconds=longest(t=>ctx.tips(t).some(q=>circle(p,q)),period*3);
  assert.ok(seconds<L1.boss.hold, `L1 ${order}/${repair}/${dx}: cannot complete an unfilmed hold (${seconds})`);
  assert.ok(seconds>(L1.boss.hold+.15)*M.CAMERA.scale, 'a filmed hold has room');
  rows1.push({order,repair:repair+1,point:socket[2],dx,seconds:round(seconds)});
}

const L2=E.load(levelData());
for(const pass of [0,1]) for(const [name,p] of Object.entries(L2.boss.points)) for(const dx of offsets) for(const dy of name==='flush' ? [0,-.69] : [0]){
  const P={x:p[0]+dx,y:p[1]+dy};
  const wires=L2.wires.filter(h=>h.boss && (!h.passes || h.passes.includes(pass))), nozzles=L2.nozzles.filter(h=>h.boss && h.hurt);
  const danger=t=>wires.some(w=>{const q=E.wirePose(w,t);return q.active && (q.axis==='v' ? box(P,q.x-.09,q.y0,q.x+.09,q.y1) : box(P,q.x0,q.y-.09,q.x1,q.y+.09));}) || nozzles.some(n=>{const q=E.nozzlePose(n,t);return q.active && box(P,q.box[0],q.box[1],q.box[0]+q.box[2],q.box[1]+q.box[3]);});
  const seconds=longest(danger,420);
  assert.ok(seconds<L2.boss.hold, `L2 ${pass}/${name}/${dx}/${dy}: no full-speed repair (${seconds})`);
  assert.ok(seconds>(L2.boss.hold+.15)*M.CAMERA.scale, 'a filmed hold has room');
  rows2.push({pass,point:name,dx,dy,seconds:round(seconds)});
}
const summary=rows=>({samples:rows.length,min:Math.min(...rows.map(r=>r.seconds)),max:Math.max(...rows.map(r=>r.seconds))});
const output={repairSeconds:L1.boss.hold,filmedMachineSeconds:round(L1.boss.hold*M.CAMERA.scale),clipSeconds:M.CLIP.length,level1:summary(rows1),level2:summary(rows2),rows1,rows2};
fs.writeFileSync(path.resolve(__dirname,'../docs/mike-platformer/l2-look/boss-windows.json'),JSON.stringify(output,null,2));
console.log('Boss repair windows passed',JSON.stringify({level1:output.level1,level2:output.level2,repair:output.repairSeconds,filmed:output.filmedMachineSeconds}));
