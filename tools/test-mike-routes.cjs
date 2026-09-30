// Verify the high routes with the real fixed-step physics, including solid housings.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const base=path.resolve(__dirname,'../public/fireworks/mike-game');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(base,'js/world.js'),'utf8'),context);
const M=context.window.MIKE,L=M.loadLevel(JSON.parse(fs.readFileSync(path.join(base,'level-1.json'),'utf8')));
assert.equal(L.errors.length,0);
// A floor stretch between walls is its own node: Mike is on it when he stands on its floor inside its span.
const lands=(P,n)=>n.seg?P.support===n.floor&&P.x>=n.x-.4&&P.x<=n.x+n.w+.4:P.support===n;   // .4: his box can overhang the end
function jump(from,to,extra=[]){
 const dir=Math.sign(to.x+to.w/2-(from.x+from.w/2))||1;
 for(const target of [to.x+to.w/2,to.x+.55,to.x+to.w-.55])for(const leap of [true,false]){
 if(!leap&&to.y<from.y)continue;
 const starts=[from.x+from.w/2,from.x+.5,from.x+from.w-.5,Math.max(from.x+.5,Math.min(from.x+from.w-.5,target-dir*4))];
 if(from.seg)for(let x=from.x+.5;x<from.x+from.w-.4;x+=.5)starts.push(x);   // a floor stretch: try every take-off point, belts included
 for(const sx of starts)for(const initial of [0,dir*7]){
  const P=M.newPlayer(sx,from.y);P.vx=initial;
  if(from.seg){M.stepPlayer(L,P,{right:dir>0,left:dir<0},1/60,[0,L.W],extra,b=>dir*b.speed);P.vx=initial;}   // settle, so a belt underfoot is felt at take-off
  for(let i=0;i<110;i++){
   const dist=target-P.x,brake=P.vx*P.vx/36+.1;
   let drive=Math.abs(dist)>.12?Math.sign(dist):0;
   if(Math.sign(P.vx)===Math.sign(dist)&&Math.abs(dist)<brake&&Math.abs(P.vx)>.35)drive=-Math.sign(P.vx);
   if(Math.abs(dist)<.15&&Math.abs(P.vx)<.35)drive=0;
   // every belt reverses, so a player can always wait for it to run the way they are going
   M.stepPlayer(L,P,{left:drive<0,right:drive>0,jump:leap&&i<50,jumpEdge:leap&&i===0},1/60,[0,L.W],extra,b=>dir*b.speed);
   if(i>3&&P.ground){if(lands(P,to))return true;if(leap||!lands(P,from))break;}
   if(P.y>19)break;
  }
 }
 }return false;
}
const reports=[];
for(const section of L.sections.filter(section=>L.solids.some(s=>s.kind==='shelf'&&s.x>=section.x&&s.x<section.x+section.width))){
 const nodes=L.solids.filter(s=>s.kind!=='machine'&&s.x>=section.x&&s.x<section.x+section.width);
 const lifts=L.lifts.filter(l=>l.at[0]>=section.x&&l.at[0]<section.x+section.width);
 const endpoints=lifts.flatMap(l=>[M.liftPose(l,0),M.liftPose(l,l.cycle*.5)]);
 nodes.push(...endpoints);
 const floor=nodes.find(s=>s.kind==='floor');const visited=new Set([floor]),queue=[floor],parent=new Map();
 while(queue.length){const from=queue.shift();
  for(const to of nodes){if(visited.has(to))continue;
   const ride=from.kind==='lift'&&to.kind==='lift'&&from.id===to.id;
   if(!ride&&(from.y-to.y>3.01||Math.max(to.x-from.x-from.w,from.x-to.x-to.w)>7.2))continue;
   if(ride||jump(from,to,endpoints)){visited.add(to);parent.set(to,from);queue.push(to);}
  }
 }
 const unreachable=nodes.filter(s=>s.kind==='shelf'&&!visited.has(s));
 reports.push({sector:section.id,shelves:nodes.filter(s=>s.kind==='shelf').length,reached:nodes.filter(s=>s.kind==='shelf'&&visited.has(s)).length,unreachable:unreachable.map(s=>[s.x,s.y])});
}
console.log(JSON.stringify(reports,null,2));
fs.writeFileSync(path.resolve(__dirname,'../docs/mike-platformer/nightshift-look/routes.json'),JSON.stringify(reports,null,2));
assert.ok(reports.every(r=>!r.unreachable.length),'every maintenance platform must be reachable with actual jump physics');

// No dead ends (owner, 27 Sept): wherever Mike can stand on the floor, including after falling off an upper route,
// he must be able to reach the sector's far edge. The floor is split into stretches at every wall that stands on it.
const deadEnds=[];
for(const section of L.sections){
 const sx0=section.x,sx1=section.x+section.width;
 const walls=L.solids.filter(s=>s.kind!=='shelf'&&s.kind!=='floor'&&s.y<11.95&&s.y+s.h>=11.95&&s.x<sx1&&s.x+s.w>sx0);
 const segs=[];
 for(const f of L.solids.filter(s=>s.kind==='floor'&&s.x<sx1&&s.x+s.w>sx0)){
  let a=Math.max(f.x,sx0);const b=Math.min(f.x+f.w,sx1);
  const cuts=walls.filter(w=>w.x<b&&w.x+w.w>a).sort((p,q)=>p.x-q.x);
  for(const w of cuts){if(w.x-a>.8)segs.push({seg:true,floor:f,x:a,w:w.x-a,y:12});a=Math.max(a,w.x+w.w);}
  if(b-a>.8)segs.push({seg:true,floor:f,x:a,w:b-a,y:12});
 }
 if(segs.length<2&&!walls.length)continue;
 const shelves=L.solids.filter(s=>(s.kind==='shelf'||(s.kind!=='floor'&&s.y<11.95))&&s.x<sx1+2&&s.x+s.w>sx0-2&&s.y>-20);
 const lifts=L.lifts.filter(l=>l.at[0]>=sx0&&l.at[0]<sx1),ends=lifts.flatMap(l=>[M.liftPose(l,0),M.liftPose(l,l.cycle*.5)]);
 const nodes=[...segs,...shelves,...ends];
 const exitSeg=segs.filter(s=>s.x+s.w>=sx1-.05);
 if(!exitSeg.length)continue;                       // a sector that ends in a pit: its exit is judged by the next one
 for(const start of segs){
  if(exitSeg.includes(start))continue;
  const seen=new Set([start]),queue=[start];let ok=false;
  while(queue.length&&!ok){const from=queue.shift();
   for(const to of nodes){if(seen.has(to))continue;
    const ride=from.kind==='lift'&&to.kind==='lift'&&from.id===to.id;
    if(!ride&&(from.y-to.y>3.01||Math.max(to.x-from.x-from.w,from.x-to.x-to.w)>7.2))continue;
    if(ride||jump(from,to,ends)){seen.add(to);queue.push(to);if(exitSeg.includes(to)){ok=true;break;}}
   }
  }
  if(!ok)deadEnds.push({sector:section.id,floor:[+start.x.toFixed(2),+(start.x+start.w).toFixed(2)]});
  if(!ok&&process.env.ROUTE_DEBUG)console.log('reached from',start.x,[...seen].map(n=>[n.seg?'seg':n.kind,+n.x.toFixed(2),+n.y.toFixed(2),+(n.w||0).toFixed(2)]),'exit',exitSeg.map(e=>[e.x,e.w]));
 }
}
console.log(JSON.stringify({deadEnds}));
assert.deepEqual(deadEnds,[],'no floor stretch may trap Mike: every one must reach its sector exit');
