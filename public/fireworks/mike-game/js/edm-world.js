// EDM vertical slice. Pure mechanics; no Level 1 saves or campaign changes.
(function(){
'use strict';
const M=window.MIKE,K=M.PHYS,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const solids=[[0,12,16,16],[16,25,60,3],[76,12,20,16],[28,21,8,4],[43,18,7,7],[60,21,6,4]];
const platforms=[[16,9.8,5,.4],[24,7.6,5,.4],[32,7.6,5,.4],[40,9.8,5,.4],[48,7.6,5,.4],[56,9.8,8,.4],[68,9.8,8,.4],
 [17,14.2,4,.4],[21,16.4,4,.4],[24,18.6,4,.4],[66,20,4,.4],[70,17.5,4,.4],[72,15,4,.4],[74,12.5,4,.4]];
const data={id:'edm-prototype',size:[96,28],spawn:[3,12],checkpoints:[[3,12]],boss:{},sections:[{id:'tank-slice',title:'Below the Wire',x:0,width:96,solids,platforms}]};
const items=[[22,8.8],[33,6.6],[50,6.6],[58,8.8],[25,22],[35,19.8],[48,16.8],[56,22.5],[68,18.8],[84,11]];
M.EDM={data,items,
 create(){return {L:M.loadLevel(data),P:M.newPlayer(3,12),cam:M.newCamera(2),time:0,mt:0,water:16.5,targetWater:16.5,suit:false,air:24,health:3,invuln:0,kick:0,got:new Set(),fix:0,won:false,resets:0,prev:{},lookDown:false,wet:false,headWet:false,message:'Collect the service suit at the rack.'};},
 wire(t){
  const u=((t%8)+8)%8,travel=.5-.5*Math.cos(Math.PI*2*t/12);
  return {x:39+8*travel,top:7.3,bottom:23.8,tell:u<1,active:u>=1&&u<3.6,phase:u<1?'WARNING':u<3.6?'CUTTING':'RETURN / SAFE'};
 },
 resetToDock(S,reason){S.P=M.newPlayer(12,12);S.air=24;S.health=3;S.invuln=2;S.kick=0;S.resets++;S.fix=0;S.cam.on=false;S.message=reason+' Returned to the dry dock.';},
 step(S,inp,dt=1/60){
  if(S.won)return;
  const P=S.P,edge=k=>!!inp[k]&&!S.prev[k];
  const ts=M.stepCamera(S.cam,edge('camera'),dt);S.time+=dt;S.mt+=dt*ts;S.invuln=Math.max(0,S.invuln-dt);S.kick=Math.max(0,S.kick-dt);
  S.water+=clamp(S.targetWater-S.water,-.8*dt*ts,.8*dt*ts);
  S.lookDown=!!inp.lookDown;
  if(!S.suit&&P.x>7&&P.x<10&&P.y>10){S.suit=true;S.message='Suit fitted. Jump swims up; X dives. Down looks below.';}
  if(Math.abs(P.x-12)<1.5&&Math.abs(P.y-12)<.3&&edge('fix')){S.targetWater=S.targetWater<14?16.5:10.5;S.message=S.targetWater<14?'Pump filling: upper swim route opening.':'Pump draining: lower fixtures exposed.';}
  const wet=P.x>16&&P.x<76&&P.y-.55>S.water;
  S.wet=wet;
  if(wet&&S.suit){
    const dx=(inp.right?1:0)-(inp.left?1:0),dy=(inp.dive?1:0)-(inp.jump?1:0);
    P.vx+=clamp(dx*3.8-P.vx,-9*dt,9*dt);
    P.vy+=clamp((dy?dy*3:-.7)-P.vy,-9*dt,9*dt);
    if(inp.jump&&P.y<S.water+1.4&&S.kick<=0){P.vy=-10.8;P.rising=true;S.kick=1.2;}
    if(dx)P.facing=dx;
    const vx=P.vx*dt,vy=P.vy*dt,oldY=P.y;
    P.x=clamp(P.x+vx,K.halfW,96-K.halfW);
    for(const s of M.overlaps(S.L,P.x-K.halfW,P.y-K.height,P.x+K.halfW,P.y,[]))if(s.kind!=='shelf'){
      P.x=vx>0?s.x-K.halfW-.001:s.x+s.w+K.halfW+.001;P.vx=0;
    }
    P.y+=vy;P.ground=false;P.support=null;
    for(const s of M.overlaps(S.L,P.x-K.halfW,P.y-K.height,P.x+K.halfW,P.y,[])){
      if(s.kind==='shelf'&&(vy<=0||oldY>s.y+.05))continue;
      if(vy>0){P.y=s.y;P.vy=0;P.ground=true;P.support=s;}
      else if(vy<0){P.y=s.y+s.h+K.height;P.vy=0;}
    }
    P.hitT+=dt;
  }else M.stepPlayer(S.L,P,{...inp,jumpEdge:edge('jump')},dt,[0,96],[],()=>0);
  if(!S.suit&&P.x>15.5){P.x=15.5;P.vx=0;S.message='Service suit required before entering the tank.';}
  S.headWet=S.suit&&P.x>16&&P.x<76&&P.y-K.height+.15>S.water;
  S.air=clamp(S.air+(S.headWet?-dt:8*dt),0,24);
  for(let i=0;i<items.length;i++)if(!S.got.has(i)&&Math.abs(P.x-items[i][0])<.8&&Math.abs(P.y-.85-items[i][1])<1){S.got.add(i);}
  const w=this.wire(S.mt);
  if(w.active&&P.x+.375>w.x-.09&&P.x-.375<w.x+.09&&P.y>w.top&&P.y-1.65<w.bottom&&S.invuln<=0){
    S.health--;S.invuln=1.5;P.vx=P.x<w.x?-3:3;S.message='Wire contact. Watch the amber tell, then cross on green.';
  }
  if(S.air<=0)this.resetToDock(S,'Suit air exhausted.');
  else if(S.health<=0||P.y>28)this.resetToDock(S,'Recovery activated.');
  else if(P.x>87&&P.x<91&&P.ground&&inp.fix&&!inp.left&&!inp.right&&!inp.jump){
    S.fix+=dt;if(S.fix>=1.5){S.won=true;S.message='Tank crossing complete. This is the mechanics slice, not the full level.';}
  }else S.fix=0;
  if(S.air<6&&S.headWet)S.message='Low suit air: rise to the surface or reach the dry refuge.';
  S.prev={...inp};
 },
 snapshot(S){return {x:S.P.x,y:S.P.y,vx:S.P.vx,vy:S.P.vy,ground:S.P.ground,suit:S.suit,air:S.air,health:S.health,water:S.water,targetWater:S.targetWater,wet:S.wet,headWet:S.headWet,got:[...S.got],fix:S.fix,won:S.won,resets:S.resets,mt:S.mt,time:S.time,cameraOn:S.cam.on,lookDown:S.lookDown};}
};
})();
