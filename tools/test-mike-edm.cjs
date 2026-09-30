const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const base=path.resolve(__dirname,'../public/fireworks/mike-game');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['world.js','edm-world.js'])vm.runInContext(fs.readFileSync(path.join(base,'js',f),'utf8'),ctx);
const M=ctx.window.MIKE,E=M.EDM,step=(s,n,inp={})=>{for(let i=0;i<n;i++)E.step(s,inp);},place=(s,x,y)=>{s.P=M.newPlayer(x,y);};
let s=E.create();assert.equal(s.L.errors.length,0);
// Dry movement remains the real Level 1 implementation.
const p=M.newPlayer(3,12);for(let i=0;i<30;i++){const inp={right:true,jump:i<25,jumpEdge:i===0};M.stepPlayer(s.L,p,inp,1/60,[0,96],[],()=>0);E.step(s,inp);}assert.ok(Math.abs(s.P.x-p.x)<1e-8);assert.ok(Math.abs(s.P.y-p.y)<1e-8);
s=E.create();place(s,15,12);step(s,40,{right:true});assert.ok(s.P.x<=15.5);assert.equal(s.suit,false);
place(s,8,12);step(s,1);assert.ok(s.suit);place(s,12,12);step(s,1,{fix:true});const water0=s.water;step(s,60,{fix:true});assert.equal(s.targetWater,10.5);assert.ok(s.water<water0-.7&&s.water>10.5,'water interpolates and a held valve does not oscillate');
step(s,1);step(s,1,{fix:true});assert.equal(s.targetWater,16.5);
place(s,22,22);step(s,120,{dive:true});assert.ok(s.P.y<=25&&s.P.y>23);assert.ok(s.air<22.1&&s.air>21.8);
const before=s.P.y;step(s,90,{jump:true});assert.ok(s.P.y<before-2,'swimming climbs');
place(s,57,9.8);s.air=5;step(s,60);assert.ok(s.air>12,'dry refuge refills air');
// Film affects machine/water clocks, never breathing.
place(s,22,22);s.air=24;s.cam.left=6;s.cam.cool=0;s.cam.on=false;const mt=s.mt;step(s,60,{camera:true});assert.ok(Math.abs(s.mt-mt-.2)<1e-6);assert.ok(s.air<23.01&&s.air>22.99);
// A fixture is solid underwater; Mike cannot swim through its side.
s=E.create();s.suit=true;place(s,27,23);step(s,100,{right:true,dive:true});assert.ok(s.P.x<28);
// Inspecting does not dive; dedicated dive is independent.
s=E.create();s.suit=true;place(s,23,21);step(s,30,{lookDown:true});assert.ok(s.P.y<21&&s.lookDown);const rise=s.P.y;step(s,90,{dive:true});assert.ok(s.P.y>rise+2);
s.air=.01;step(s,2);assert.equal(s.resets,1);assert.equal(s.P.x,12);assert.equal(s.air,24);
// Continuous guide translation and bounded active cut phase.
const w0=E.wire(0),w12=E.wire(12);assert.ok(Math.abs(w0.x-w12.x)<1e-8);assert.equal(E.wire(.3).active,false);assert.equal(E.wire(2).active,true);assert.equal(E.wire(5).active,false);
s=E.create();s.suit=true;s.mt=1.99;const wire=E.wire(2);place(s,wire.x,16);step(s,1);assert.equal(s.health,2);step(s,10);assert.equal(s.health,2,'contact grace prevents instant repeated hits');
place(s,89,12);step(s,60,{fix:true});step(s,1,{});assert.equal(s.fix,0);step(s,91,{fix:true});assert.equal(s.won,true);
const result={dryPhysicsUnchanged:true,suitGate:true,waterInterpolation:true,valveEdge:true,buoyancy:true,fixtureCollision:true,airRefill:true,airIndependentOfCamera:true,lookSeparateFromDive:true,recovery:true,wireTiming:true,serviceHold:true};
// Two traversals using only ordinary inputs. No teleports or invulnerability in these runs.
function steer(P,x){const d=x-P.x,brake=P.vx*P.vx/(P.ground?84:36)+.07;let dir=Math.abs(d)>.08?Math.sign(d):0;if(Math.sign(P.vx)===Math.sign(d)&&Math.abs(d)<brake&&Math.abs(P.vx)>.25)dir=-Math.sign(P.vx);return {left:dir<0,right:dir>0};}
function copy(S){return {...S,P:{...S.P},prev:{...S.prev},cam:{...S.cam},got:new Set(S.got)};}
function plan(S,x,y){for(const leap of [false,true])for(let delay=0;delay<100;delay+=3){if(!leap&&delay)break;if(!leap&&y<S.P.y-.1)continue;const p=copy(S),seq=[];
 for(let f=0;f<220;f++){const inp={...steer(p.P,x),jump:leap&&f>=delay&&f<delay+45};E.step(p,inp);seq.push(inp);if(p.health<S.health||p.resets>S.resets)break;
  if(f>2&&p.P.ground&&Math.abs(p.P.y-y)<.1&&(Math.abs(p.P.x-x)<.55||(leap&&f>delay+3&&p.P.support&&x>=p.P.support.x&&x<=p.P.support.x+p.P.support.w)))return seq;
  if(leap&&f>delay+3&&p.P.ground)break;
 }}return [];}
function go(S,x,y){for(let n=0;n<140;n++){if(S.P.ground&&Math.abs(S.P.x-x)<.75&&Math.abs(S.P.y-y)<.15)return;const seq=plan(S,x,y);if(seq.length){for(const i of seq)E.step(S,i);}else step(S,10);}
 throw Error('Route stalled at '+S.P.x+','+S.P.y+' aiming for '+x+','+y);}
s=E.create();for(const [x,y] of [[8,12],[14,12],[18.5,9.8],[26.5,7.6],[34.5,7.6],[42.5,9.8],[50.5,7.6],[59.5,9.8],[72,9.8],[80,12],[89,12]])go(s,x,y);step(s,91,{fix:true});assert.ok(s.won);assert.equal(s.resets,0);result.dryRoute={seconds:s.time,salvage:s.got.size,health:s.health};
s=E.create();go(s,8,12);go(s,12,12);step(s,1,{fix:true});step(s,460);go(s,18.5,9.8);
for(let n=0;n<1800&&s.P.x<73;n++){
 const P=s.P,depth=15,inp={right:true,dive:P.y<depth-.15,jump:P.y>depth+.15};
 if(P.x>36&&P.x<38&&((s.mt%8)<4.0)){inp.right=false;Object.assign(inp,steer(P,36.7));}
 if(P.x>37&&P.x<39&&!s.cam.on&&s.cam.cool<=0&&s.cam.left>4)inp.camera=true;
 E.step(s,inp);
}
assert.ok(s.P.x>=73,'wet route crosses the tank');for(let n=0;n<400&&s.P.x<79;n++)E.step(s,{right:true,jump:true});go(s,89,12);step(s,91,{fix:true});assert.ok(s.won);assert.equal(s.resets,0);result.wetRoute={seconds:s.time,salvage:s.got.size,health:s.health};
fs.mkdirSync(path.resolve(__dirname,'../docs/mike-platformer/edm-look'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../docs/mike-platformer/edm-look/mechanics.json'),JSON.stringify(result,null,2));console.log('EDM mechanics passed',result);
