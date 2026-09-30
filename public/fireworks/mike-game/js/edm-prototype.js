(function(){
'use strict';
const M=window.MIKE,E=M.EDM,A=M.art,AU=M.audio,c=document.getElementById('edm').getContext('2d'),T=32;
let S=E.create(),rig,camX=0,camY=0,paused=false,manual=false,last=0,acc=0;
const keys=new Set(),touch=new Map(),map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',ArrowDown:'lookDown',KeyS:'lookDown',KeyX:'dive',KeyC:'camera',KeyE:'fix'};
const input=()=>Object.fromEntries([...keys,...touch.values()].map(k=>[k,true]));
const clear=()=>{keys.clear();touch.clear();document.querySelectorAll('.tc.on').forEach(b=>b.classList.remove('on'));};
addEventListener('keydown',e=>{AU.unlock();if(map[e.code]){e.preventDefault();keys.add(map[e.code]);}if(e.code==='KeyR'&&!e.repeat)reset();if(e.code==='Escape'&&!e.repeat)pause();});
addEventListener('pointerdown',()=>AU.unlock(),{passive:true});
addEventListener('keyup',e=>{keys.delete(map[e.code]);});
function pause(){paused=!paused;clear();document.getElementById('pause').textContent=paused?'Resume':'Pause';if(paused)AU.suspend();else AU.resume();}
function reset(){S=E.create();camX=camY=0;paused=false;manual=false;clear();AU.resume();document.getElementById('pause').textContent='Pause';}
const soundButton=document.getElementById('sound');function soundLabel(){soundButton.textContent=AU.muted?'Sound off':'Sound on';}soundButton.onclick=()=>{AU.setMuted(!AU.muted);soundLabel();};soundLabel();
document.getElementById('restart').onclick=reset;document.getElementById('pause').onclick=pause;
addEventListener('blur',()=>{if(!manual&&!paused)pause();});
if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
document.querySelectorAll('.tc').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();document.body.classList.add('touch');b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.ctl);b.classList.add('on');};
 const up=e=>{touch.delete(e.pointerId);b.classList.remove('on');};b.onpointerup=up;b.onpointercancel=up;b.onlostpointercapture=up;});
const rect=(x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
function line(x,y,xx,yy,col,w=2){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function label(s,x,y,size=13,col='#abcbd0',align='left'){c.fillStyle=col;c.font=`600 ${size}px ${A.FONT}`;c.textAlign=align;c.fillText(s,x,y);}
function panel(x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#8ba3ad');g.addColorStop(.45,'#375461');g.addColorStop(1,'#688793');rect(x,y,w,h,g);c.strokeStyle='#061e28';c.lineWidth=3;c.strokeRect(x,y,w,h);line(x+2,y+2,x+w-2,y+2,'#b4d4d8');}
function bolt(x,y){c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fillStyle='#a0b9c2';c.fill();line(x-2,y-1,x+2,y+1,'#172f3c',1);}
function support(x,y,bottom){rect(x-6,y,12,bottom-y,'#233f4b');line(x-2,y,x-2,bottom,'#577683');for(let yy=y+10;yy<bottom;yy+=38)bolt(x,yy);panel(x-17,bottom,34,8);}
function draw(){
 const P=S.P,tx=Math.max(0,Math.min(96*T-768,P.x*T-256)),normal=Math.max(-110,Math.min(25*T-432,P.y*T-302));
 camX+=(tx-camX)*.14;const ty=Math.min(25*T-432,normal+(S.lookDown?160:0),P.y*T-128);camY+=(ty-camY)*.15;
 A.nightBackdrop(c,camX,camY,S.time,false);
 c.save();c.scale(1.25,1.25);c.translate(-camX,-camY);
 // Enclosure and tank foundation: every wall, guide and pipe is anchored to this structure.
 rect(16*T,8*T,60*T,17*T,'#102e3a');panel(16*T-12,12*T,12,13*T);panel(76*T,12*T,12,13*T);panel(16*T,25*T,60*T,26);
 for(let x=16*T;x<76*T;x+=128){support(x+12,7*T,25*T);for(let y=13*T;y<25*T;y+=64)line(x+19,y,x+113,y+60,'#254753',3);}
 for(let y=12;y<=24;y+=2){line(16*T+10,y*T,16*T+26,y*T,'#98b9be');label(String(25-y)+' m',16*T+32,y*T+4,9,'#789ea9');}
 for(const s of S.L.solids)if(s.kind==='shelf')support((s.x+.35)*T,s.y*T+12,25*T);
 A.drawStatic(c,S.L,camX,camX+768);
 // Dock rack, service valve and connected supply/return lines.
 support(8*T,8.4*T,12*T);panel(7*T,8.6*T,2*T,2.9*T);label(S.suit?'SUIT ISSUED':'SERVICE SUIT',8*T,8.2*T,12,'#b5ead6','center');
 if(!S.suit){rect(7.55*T,9.4*T,.9*T,1.3*T,'#e9b86e');c.strokeStyle='#dcf5f1';c.lineWidth=3;c.strokeRect(7.4*T,8.9*T,1.2*T,1.2*T);}
 line(12*T,11*T,12*T,23*T,'#668894',9);line(12*T,23*T,18*T,23*T,'#668894',9);
 panel(11.4*T,9.6*T,1.2*T,2.4*T);c.beginPath();c.arc(12*T,10.5*T,18,0,Math.PI*2);c.strokeStyle='#ffc46a';c.lineWidth=5;c.stroke();
 for(let i=0;i<4;i++){const a=i*Math.PI/2;line(12*T,10.5*T,12*T+Math.cos(a)*16,10.5*T+Math.sin(a)*16,'#ffc46a',3);}
 label('E · PUMP '+(S.targetWater<14?'HIGH':'LOW'),12*T,9.1*T,12,'#ffc46a','center');
 // Gantry, motor carriage, upper/lower wire guides and visible cable path.
 const w=E.wire(S.mt),wx=w.x*T;
 for(const x of [38*T,49*T])support(x,4*T,25*T);
 panel(38*T,4*T,11*T,18);for(let x=38*T+12;x<49*T;x+=28)bolt(x,4*T+9);
 panel(wx-30,4*T+18,60,54);panel(wx-17,4*T+72,34,w.top*T-4*T-92);panel(wx-27,w.top*T-20,54,20);
 for(let y=4*T+24;y<4*T+65;y+=6)line(wx-22,y,wx+22,y,'#193847',2);
 c.save();c.setLineDash([5,3]);line(wx+36,4*T+9,wx+36,w.top*T-7,'#081c26',7);c.restore();
 for(const x of [38.5*T,40*T]){panel(x-18,4*T-51,36,47);c.beginPath();c.arc(x,4*T-29,13,0,7);c.strokeStyle='#aac8cc';c.lineWidth=3;c.stroke();bolt(x,4*T-29);}
 line(38.5*T,4*T-29,40*T,4*T-29,'#bdd9d8',1);line(40*T,4*T-29,wx,4*T+18,'#bdd9d8',1);
 c.beginPath();c.moveTo(49*T-8,7*T);c.quadraticCurveTo(wx+40,6*T,wx+11,w.top*T-4);c.strokeStyle='#537e87';c.lineWidth=6;c.stroke();
 panel(wx-23,w.bottom*T,46,21);line(38*T+6,w.bottom*T+25,wx,w.bottom*T+25,'#78909b',10);
 line(wx,w.top*T,wx,w.bottom*T,w.active?'#ecfff4':'#72999f',w.active?3:1);
 if(w.tell){c.save();c.setLineDash([7,7]);line(wx-12,w.top*T,wx-12,w.bottom*T,'#ffc46a',3);c.restore();}
 c.beginPath();c.arc(wx+22,4*T+31,6,0,7);c.fillStyle=w.tell||w.active?'#ffc46a':'#9be4c7';c.fill();
 label('WIRE GUIDE · '+w.phase,43.5*T,3.5*T,13,w.active?'#ffc46a':'#9be4c7','center');
 if(w.active)for(let i=0;i<5;i++){const a=S.time*9+i*1.3;line(wx,18*T,wx+Math.cos(a)*14,18*T+Math.sin(a)*14,'#e3fbf2',1);}
 // Fixed air refuge is above the highest fluid line.
 panel(56*T,6.5*T,8*T,14);label('DRY REFUGE',60*T,7.5*T,16,'#9be4c7','center');
 for(let i=0;i<E.items.length;i++)if(!S.got.has(i)){const [x,y]=E.items[i];A.pickupIcon(c,['bearing','seal','coupling'][i%3],x*T,y*T, .7);}
 // Non-destructive PPE overlay around the original puppet: harness, pack and clear visor.
 const state=S.wet?'jump':P.ground?(Math.abs(P.vx)>.2?'run':'idle'):(P.vy<0?'jump':'fall');
 if(S.suit){panel(P.x*T-P.facing*16-7,P.y*T-37,14,25);rect(P.x*T-8,P.y*T-31,16,24,'#c08b43');}
 M.puppet.draw(c,rig,M.puppet.pose(state,S.time*6,0),P.x*T,P.y*T,64,{facing:P.facing});
 if(S.suit){c.strokeStyle='#c8f6ed';c.lineWidth=2;c.beginPath();c.ellipse(P.x*T,P.y*T-48,16,19,0,0,7);c.stroke();line(P.x*T-11,P.y*T-58,P.x*T-7,P.y*T-64,'#fff',2);line(P.x*T-9,P.y*T-26,P.x*T+9,P.y*T-26,'#ffc46a',3);}
 // Fluid is bounded by the tank; no invisible full-screen fog.
 const wy=S.water*T,g=c.createLinearGradient(0,wy,0,25*T);g.addColorStop(0,'rgba(31,172,176,.17)');g.addColorStop(1,'rgba(5,68,85,.53)');rect(16*T,wy,60*T,25*T-wy,g);
 line(16*T,wy,76*T,wy,'#76e5df',2);
 for(let i=0;i<34;i++){const bx=(18+i*1.7)*T,by=wy+((i*41-S.time*15)%(25*T-wy)+(25*T-wy))%(25*T-wy);c.beginPath();c.arc(bx,by,2+(i%3),0,7);c.strokeStyle='rgba(158,235,230,.24)';c.lineWidth=1;c.stroke();}
 label('DIELECTRIC TANK',20*T,24*T,18,'#55818e');
 panel(88*T,9.8*T,2*T,2.2*T);label('HOLD E · ALIGN',89*T,9.3*T,13,'#9be4c7','center');rect(88*T,12*T-8,2*T*Math.min(1,S.fix/1.5),6,'#9be4c7');
 c.restore();
 rect(10,10,590,77,'#061923ee');label('BELOW THE WIRE',24,34,20,'#b4eee5');label('EDM MECHANICS PROTOTYPE · ONE TANK / 96 TILES',24,53,10,'#84a9b7');
 label('SUIT '+(S.suit?'ON':'REQUIRED')+'   AIR '+S.air.toFixed(0)+'s   HEALTH '+S.health+'   SALVAGE '+S.got.size+'/10',24,74,13,S.air<6?'#ffc46a':'#c7dedf');
 rect(615,59,330,26,'#071923d9');label('FILM '+S.cam.left.toFixed(1)+'s  ·  '+(S.cam.on?'SLOW ×0.2':'C TO FILM'),630,77,12,'#9be4c7');
 rect(175,493,610,40,'#061923ed');label(S.message,480,510,12,'#c3e2e1','center');label('← → MOVE   SPACE / ↑ SWIM   X DIVE   ↓ LOOK   E USE   C FILM',480,526,10,'#81aab7','center');
 if(paused||S.won){rect(210,186,540,134,'#061923f5');label(S.won?'SLICE COMPLETE':'PAUSED',480,232,28,'#b5eee2','center');label(S.won?'Salvage '+S.got.size+'/10 · Recovery resets '+S.resets:'Press Resume to continue',480,268,15,'#a5c8d1','center');if(S.won)label('Full six-room level remains in design. R to replay.',480,296,13,'#8aabb7','center');}
}
function tick(inp){const health=S.health,got=S.got.size,suit=S.suit,won=S.won;E.step(S,inp);if(S.health<health){AU.play('bonk');AU.say('pain');}if(S.got.size>got)AU.play('part');if(S.suit&&!suit){AU.play('unit');AU.say('power');}if(S.won&&!won){AU.play('chord');AU.say('power');}}
function frame(t){const dt=last?Math.min(.1,(t-last)/1000):0;last=t;if(!manual&&!paused){acc+=dt;while(acc>=1/60){tick(input());acc-=1/60;}}draw();requestAnimationFrame(frame);}
window.__edm={get S(){return S;},reset(){reset();manual=true;return E.snapshot(S);},step(n,inp={}){manual=true;for(let i=0;i<n;i++)E.step(S,inp);draw();return E.snapshot(S);},place(x,y){S.P=M.newPlayer(x,y);draw();},snapshot:()=>({...E.snapshot(S),camX,camY}),draw,release(){manual=false;}};
Promise.all([M.puppet.load('assets/'),AU.preload()]).then(()=>M.puppet.bake(.22)).then(r=>{rig=r;document.getElementById('loading').hidden=true;document.body.dataset.ready='1';requestAnimationFrame(frame);}).catch(e=>{document.getElementById('loading').textContent='Could not load prototype: '+e.message;console.error(e);});
})();
