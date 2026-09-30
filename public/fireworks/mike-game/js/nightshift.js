// Night Shift: original, unbranded machine-tool geometry and layered workshop lighting.
// Everything is resolution-independent Canvas art; Mike and the supplied lock-up remain untouched.
(function(){
'use strict';
const M=window.MIKE,A=M.art,T=32,F=A.FONT,TAU=Math.PI*2;
const {rr,circ,bolt,stripes}=A;
function panel(c,x,y,w,h,a='#b0bcc2',b='#425462',r=3){
  const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(.48,b);g.addColorStop(1,a);
  rr(c,x,y,w,h,r);c.fillStyle=g;c.fill();c.strokeStyle='#101b23';c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(235,250,255,.25)';c.fillRect(x+2,y+2,w-4,2);
}
function line(c,x,y,xx,yy,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,s,x,y,size=12,color='#c6dce6',align='left'){c.font=`600 ${size}px ${F}`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;c.fillText(s,x,y);}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function lamp(c,x,y,on=true){
  panel(c,x-10,y,20,9,'#97a3aa','#263a48');line(c,x,y+9,x,y+52,'#1b2933',5);
  for(let i=0;i<3;i++){c.fillStyle=i===(on?2:0)?(on?'#73eed0':'#ff9863'):'#26343b';c.fillRect(x-7,y+13+i*12,14,9);}
}
function stand(c,x,w,yTop,yBottom,foot){
  for(const lx of [x+3,x+w-11]){panel(c,lx,yTop,8,yBottom-yTop,'#5f7883','#1d3440',1);line(c,lx+4,yTop+3,lx+4,yBottom,'#8fa9b2',1);}
  c.save();c.beginPath();c.rect(x,yTop,w,yBottom-yTop);c.clip();
  for(let y=yTop+10;y<yBottom;y+=46){line(c,x+7,y,x+w-7,y+40,'#2f4c59',4);line(c,x+w-7,y,x+7,y+40,'#2f4c59',4);line(c,x+5,y,x+w-5,y,'#46646f',3);}
  c.restore();
  if(foot){panel(c,x-6,yBottom-7,w+12,8,'#7f96a0','#2a4552',2);stripes(c,x-4,yBottom-5,w+8,4,6);}
}
A.stand=stand;
function screw(c,x,y){circ(c,x,y,3);c.fillStyle='#263c4b';c.fill();line(c,x-1.5,y-1,x+1.5,y+1,'#c1d6de',1);}

// Cached architecture: roof lights, tall glazing, ventilation, structural steel and distant cells.
const wall=document.createElement('canvas');wall.width=1536;wall.height=1000;const w=wall.getContext('2d');
const wg=w.createLinearGradient(0,0,0,1000);wg.addColorStop(0,'#050e19');wg.addColorStop(.55,'#13313e');wg.addColorStop(1,'#07131e');w.fillStyle=wg;w.fillRect(0,0,1536,1000);
for(let x=0;x<1536;x+=192){
  w.fillStyle='#091824';w.fillRect(x+24,160,132,460);
  const g=w.createLinearGradient(x,180,x+132,650);g.addColorStop(0,'#183440');g.addColorStop(.6,'#315965');g.addColorStop(1,'#0c2632');w.fillStyle=g;w.fillRect(x+29,165,122,449);
  for(let y=230;y<610;y+=76)line(w,x+26,y,x+154,y,'#0b202c',8);
  line(w,x+89,164,x+89,617,'#0b202c',6);
  panel(w,x+165,100,22,730,'#203e4d','#0a1c29');
  for(let y=130;y<770;y+=90){screw(w,x+175,y);line(w,x+167,y,x+185,y+65,'#2b4b59',2);}
}
for(const y of [108,644]){
  w.fillStyle='#0a1b28';w.fillRect(0,y,1536,48);
  for(let x=0;x<1536;x+=64){line(w,x,y+44,x+32,y+4,'#2a4652',4);line(w,x+32,y+4,x+64,y+44,'#2a4652',4);}
  line(w,0,y+1,1536,y+1,'#395b64',2);
}
for(let x=90;x<1536;x+=384){
  line(w,x,150,x,262,'#030d15',3);panel(w,x-54,260,108,9,'#5a747d','#182b37');
  w.fillStyle='#a9e8ec';w.fillRect(x-46,268,92,3);
  const g=w.createLinearGradient(x,270,x,830);g.addColorStop(0,'rgba(123,219,226,.12)');g.addColorStop(1,'rgba(90,200,215,0)');
  w.fillStyle=g;w.beginPath();w.moveTo(x-46,272);w.lineTo(x+46,272);w.lineTo(x+200,830);w.lineTo(x-200,830);w.fill();
}
for(let y=694;y<744;y+=17){line(w,0,y,1536,y,'#051520',12);line(w,0,y-3,1536,y-3,'#35515a',2);}
for(let x=48;x<1536;x+=300){
  panel(w,x,774,228,190,'#29434b','#0a1a25');panel(w,x+17,797,126,104,'#10212a','#29434b');
  line(w,x+78,800,x+78,898,'#46616b',4);panel(w,x+166,800,42,56,'#233d47','#0a1b27');
  w.fillStyle='#42736f';w.fillRect(x+172,807,30,24);lamp(w,x+210,724,false);
  for(let j=0;j<8;j++)line(w,x+165,878+j*5,x+206,878+j*5,'#081a25');
}
A.nightBackdrop=function(c,camX,camY,t,low){
  c.fillStyle='#07121e';c.fillRect(0,0,960,540);
  const x=-((camX*.22)%1536),y=-440-camY*.22;
  c.drawImage(wall,x,y);c.drawImage(wall,x+1536,y);
  if(!low){
    const sector=Math.floor(camX/(64*T));const hot=sector%4===2;
    glow(c,hot?830:160,90,450,hot?'rgba(220,111,45,.15)':'rgba(44,178,208,.15)');
    for(let i=0;i<24;i++){const px=((i*137.21-camX*.08+t*(2+i%3))%1000+1000)%1000;
      const py=((i*53.37+t*3-camY*.08)%540+540)%540;c.fillStyle=`rgba(180,223,231,${.10+(i%4)*.035})`;c.fillRect(px,py,i%5===0?2:1,1);}
  }
};

// A generic enclosed turning cell: bed, chuck, stock, turret, guards, pendant and swarf tray.
function turningCell(c,x,y,t){
  panel(c,x,y,360,186,'#617581','#253c49',8);panel(c,x+12,y+15,250,133,'#172b36','#071520');
  c.fillStyle='#617b88';c.fillRect(x+27,y+108,220,13);line(c,x+27,y+109,x+247,y+109,'#c7dde4',2);
  panel(c,x+28,y+37,54,70,'#61737c','#a9b5b9');
  c.save();c.translate(x+85,y+73);c.scale(.38,1);circ(c,0,0,37);c.fillStyle='#8a9ca6';c.fill();
  for(let i=0;i<3;i++){c.save();c.rotate(t*.7+i*TAU/3);panel(c,9,-7,25,14,'#cdd8db','#5c747f');c.restore();}c.restore();
  panel(c,x+89,y+65,83,17,'#dbe5e6','#687d88');
  circ(c,x+212,y+74,31);c.fillStyle='#344f5c';c.fill();
  for(let i=0;i<8;i++){const a=i*TAU/8;panel(c,x+212+Math.cos(a)*26-4,y+74+Math.sin(a)*26-4,8,8,'#bcc9cd','#5e7079');}
  panel(c,x+173,y+89,64,20);line(c,x+90,y+24,x+90,y+143,'#acb9be',4);line(c,x+248,y+24,x+248,y+143,'#acb9be',4);
  c.fillStyle='rgba(86,173,185,.08)';c.fillRect(x+91,y+25,154,118);
  panel(c,x+275,y+30,72,76);c.fillStyle='#051c27';c.fillRect(x+282,y+37,58,32);
  text(c,'X  +024.80',x+286,y+49,7,'#7fd6d0');text(c,'Z  −016.25',x+286,y+62,7,'#7fd6d0');
  for(let i=0;i<12;i++){c.fillStyle=i===10?'#df6c4c':'#243c4b';c.fillRect(x+283+(i%4)*14,y+76+Math.floor(i/4)*7,9,4);}
  lamp(c,x+332,y-46,false);stripes(c,x+16,y+155,246,6,8);
  for(let i=0;i<12;i++)line(c,x+28+i*18,y+168,x+38+i*18,y+165,'#8da2ae',2);
  panel(c,x+6,y+186,26,16);panel(c,x+326,y+186,26,16);
}

A.workshopDetail=function(c,L,camX,vw,t,camY){
  const lo=Math.floor(camX/(64*T)),hi=Math.ceil((camX+vw)/(64*T));
  for(let n=lo;n<=hi;n++){
    const x=n*64*T;
    c.save();c.globalAlpha=.62;stand(c,x+108,344,372,1400,false);turningCell(c,x+100,170,t);c.restore();
    panel(c,x+780,-290,18,675,'#203c4a','#0c1f2c');
    for(let y=-266;y<360;y+=40)line(c,x+781,y,x+796,y+30,'#42616c',1);
    // High-bay extraction duct and articulated service pipes.
    panel(c,x+830,-170,510,25,'#304953','#142c38');
    for(let px=x+840;px<x+1330;px+=32)line(c,px,-167,px,-148,'#58717a',1);
    line(c,x+844,-149,x+844,345,'#0d202b',12);line(c,x+841,-149,x+841,345,'#51717a',2);
  }
  for(const s of L.sections){
    if((s.x+s.width)*T<camX||s.x*T>camX+vw)continue;
    const x=(s.x+2)*T;
    text(c,String(L.sections.indexOf(s)+1).padStart(2,'0'),x,128,54,'rgba(173,204,213,.19)');
    text(c,s.title.toUpperCase(),x,150,10,'#7c9ca6');
  }
  // Light rails define the upper route without drawing collision-like background ledges.
  for(const s of L.solids)if(s.kind==='shelf'&&s.y<7&&s.x*T>camX-200&&s.x*T<camX+vw+100){
    line(c,s.x*T+6,s.y*T+17,(s.x+s.w)*T-6,s.y*T+17,'rgba(100,227,225,.28)',5);
    line(c,s.x*T+6,s.y*T+17,(s.x+s.w)*T-6,s.y*T+17,'#8ecdcf',1);
  }
};

// Machines whose base has no floor or deck under it stand on columns from the pit (the coolant sump) below.
// Drawn behind the terrain, so where floor exists the column is hidden and nothing changes.
A.machineSupports=function(c,L,camX,vw){
  if(!L.__supports){
    L.__supports=[];
    const onSomething=(x,y)=>L.solids.some(s=>!s.hazard&&s.kind!=='roof'&&x>=s.x&&x<=s.x+s.w&&Math.abs(s.y-y)<.05);
    for(const h of L.hazards){
      if(h.type!=='coolant'&&h.type!=='spitter')continue;
      const r=h.base||h.rect,bottom=r[1]+r[3];
      if(!onSomething(r[0]+r[2]/2,bottom))L.__supports.push({h,x:r[0],w:r[2],y:bottom,tank:h.type==='coolant'});
    }
  }
  // background turning cells over a pit stand on a mezzanine frame rising from the pit floor
  for(const p of L.pits){
    if(p.x1*T<camX-50||p.x0*T>camX+vw+50)continue;
    for(let n=Math.floor(p.x0/64)-1;n<=Math.ceil(p.x1/64);n++){
      const cx=n*64*T+100;if(cx+460<p.x0*T||cx>p.x1*T)continue;
      c.save();c.beginPath();c.rect(p.x0*T+6,12*T+2,(p.x1-p.x0)*T-12,1000);c.clip();c.globalAlpha=.62;
      stand(c,cx+6,348,12*T-14,12*T+900,false);panel(c,cx,12*T-16,360,12,'#5a727c','#1a3040',2);c.restore();
    }
  }
  for(const s of L.__supports){
    if((s.x+4)*T<camX||(s.x-4)*T>camX+vw)continue;
    const top=s.y*T;
    stand(c,s.x*T-8,s.w*T+16,top,top+900,false);                       // the machine's own column
    if(s.tank){stand(c,s.x*T-76,62,top+4,top+900,false);panel(c,s.x*T-80,top-2,s.w*T+96,10,'#8aa2ac','#2c4855',2);}   // the reservoir's cradle
    // coolant sump: a faint fluid surface far below
    c.fillStyle='rgba(120,210,220,.10)';c.fillRect(s.x*T-90,top+150,s.w*T+120,6);
  }
};

// Shared collision/render position: spindle rams translate on X/Z, never on robot elbows.
M.railTip=function(h,t){
  const [x,y,span]=h.rect,u=((t/h.cycle)%1+1)%1;
  const ease=v=>.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,v)));
  const raised=y+1.9,cut=y+4.6;
  let across=0,yy=raised,stage='ready';
  if(u<.14)stage='ready';
  else if(u<.25){yy=raised+(cut-raised)*ease((u-.14)/.11);stage='lower';}
  else if(u<.61){across=ease((u-.25)/.36);yy=cut;stage='cut';}
  else if(u<.73){across=1;yy=cut+(raised-cut)*ease((u-.61)/.12);stage='lift';}
  else{across=1-ease((u-.73)/.27);stage='return';}
  return {x:x+1+(span-2)*across,y:yy,danger:(stage==='lower'||stage==='cut'||stage==='lift')&&yy>raised+.9,warn:stage==='ready',stage};
};
function head(c,x,y,railY,angle,t,hot){
  const len=58,px=x+Math.sin(angle)*len,py=y-Math.cos(angle)*len;
  // X carriage, telescopic Z ram, bellows and cable chain.
  panel(c,px-33,railY,66,22,'#9babb2','#344e5c');
  const hh=Math.max(12,py-railY-23);panel(c,px-19,railY+22,38,hh,'#a7b6bd','#405866');
  for(let yy=railY+27;yy<py-10;yy+=7)line(c,px-15,yy,px+15,yy,'#243d4b',2);
  c.save();c.setLineDash([5,3]);line(c,px+29,railY+18,px+29,py-6,'#101b23',9);c.restore();
  c.save();c.translate(px,py);c.rotate(angle);
  // Fork/yoke bearing around the B axis, C-axis collar and motor cartridge.
  panel(c,-30,-22,60,37,'#b9c3c7','#526a75',6);
  for(const side of [-1,1]){panel(c,side*23-5,-11,10,31,'#9aaab1','#405461');circ(c,side*23,3,9);c.fillStyle='#d0d9db';c.fill();screw(c,side*23,3);}
  panel(c,-15,-13,30,44,'#8b9ca5','#d6dfe0',5);panel(c,-18,25,36,9,'#d4dce0','#526977');
  panel(c,-10,34,20,10,'#e2e8e8','#5d7480');
  c.fillStyle='#8399a5';c.beginPath();c.moveTo(-9,44);c.lineTo(9,44);c.lineTo(6,50);c.lineTo(-6,50);c.fill();
  panel(c,-5,49,10,15,'#d7e3e5','#4b6473',1);
  for(let yy=51;yy<64;yy+=4)line(c,-4,yy,4,yy+Math.sin(t*18)*3,'#304e60',1.5);
  // Tip ends at the collision point, with the final flute only six pixels beyond it.
  line(c,23,16,15,42,'#272e30',5);line(c,23,16,15,42,'#82969c',2);
  circ(c,0,-6,4);c.fillStyle=hot?'#ff9262':'#75d5d6';c.fill();c.restore();
}
A.railSpindle=function(c,h,t,slow){
  const [x,y,span]=h.rect,p=M.railTip(h,t),ry=(y-1.7)*T;
  for(const hx of [x*T+10,(x+span*.5)*T,(x+span)*T-10]){line(c,hx,ry-900,hx,ry,'#1a2d38',6);line(c,hx-1,ry-900,hx-1,ry,'#6f8b96',2);panel(c,hx-9,ry-10,18,11,'#8ea3ad','#2e4856',2);}
  panel(c,x*T,ry,span*T,15,'#8b9ca5','#3b5360');
  for(let xx=x*T+8;xx<(x+span)*T;xx+=32)screw(c,xx,ry+8);
  head(c,p.x*T,p.y*T,ry+15,Math.sin(t/h.cycle*TAU)*.16,t,p.danger);
  if(p.stage==='return')text(c,'RAISED RETURN', (x+span*.5)*T,ry-10,10,'#91c5c4','center');
  if(p.warn){line(c,(x+1)*T,(y+4.6)*T,(x+span-1)*T,(y+4.6)*T,'rgba(248,186,91,.6)',2);
    text(c,'TRAVERSE', (x+span*.5)*T,ry-10,10,'#e9b968','center');}
  if(slow)glow(c,p.x*T,p.y*T,45,'rgba(90,200,255,.25)');
};

A.serviceLift=function(c,lift,p,t){
  const x=p.x*T,y=p.y*T,w=p.w*T,top=lift.to[1]*T,bottom=lift.at[1]*T;
  for(const xx of [x+8,x+w-8]){
    panel(c,xx-5,top-65,10,bottom-top+90,'#718791','#233d4b');
    line(c,xx,top-60,xx,y-7,'#b8cbd0',2);
    for(let yy=top-60;yy<bottom+20;yy+=24)screw(c,xx,yy);
  }
  panel(c,x-4,y,w+8,14,'#c4d2d5','#526c76');stripes(c,x,y+4,w,7,9);
  line(c,x+4,y-1,x+w-4,y-1,'#a8f4e0',3);
  panel(c,x+12,y+14,w-24,15,'#506b77','#193542');
  for(const xx of [x+15,x+w-15]){circ(c,xx,y+22,4);c.fillStyle='#9eeddb';c.fill();}
  text(c,'SERVICE LIFT',x+w/2,top-81,11,'#bbe5e0','center');
  text(c,'WAIT · BOARD · RIDE',x+w/2,bottom+49,9,'#8cb4c0','center');
};

// A fictional dual-head five-axis service cell, shown with its guarding open.
// The linear slides, swivel head, spindle cartridge, taper holder and rotary fixture are functional forms.
A.turner=function(c,B,st,t){
  const x=B.bounds[0]*T,y=12*T,wide=24*T;
  c.save();
  panel(c,x+14,-19,wide-28,402,'#667a86','#182f3e',12);
  panel(c,x+53,15,wide-106,309,'#0c2331','#182f3d',5);
  const light=c.createLinearGradient(0,25,0,y);light.addColorStop(0,'rgba(131,222,226,.13)');light.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=light;c.fillRect(x+57,26,wide-114,300);
  // Recessed task strips, inspection lights and sheet-metal seams give the enclosure depth.
  line(c,x+58,25,x+wide-58,25,'#d6f8f1',3);
  glow(c,x+200,95,165,'rgba(115,220,221,.13)');glow(c,x+wide-130,215,155,'rgba(250,168,88,.10)');
  for(let sx=x+94;sx<x+wide-80;sx+=96){line(c,sx,114,sx,260,'#274654',1);screw(c,sx,124);screw(c,sx,259);}
  // Moving X bridges, supported at both ends; dual independent heads are visibly rail-mounted.
  for(const ry of [33,78]){
    panel(c,x+60,ry,wide-120,24,'#becbd0','#4e6a79');line(c,x+70,ry+8,x+wide-70,ry+8,'#d9e9eb',3);
    for(let xx=x+76;xx<x+wide-64;xx+=27)screw(c,xx,ry+18);
  }
  for(const sx of [x+30,x+wide-49]){panel(c,sx,3,20,340,'#9cadaf','#3b5564');stripes(c,sx,279,20,47,8);}
  // Accordion way covers protect the bed behind the service sockets.
  for(let i=0;i<35;i++)panel(c,x+74+i*18,273,17,52,'#45616f','#1a3545',0);
  // Rotary fixture table seen obliquely: tilt cradle, bearings, platter and T-slots.
  const tx=x+wide/2,ty=242;
  for(const side of [-1,1]){panel(c,tx+side*109-17,ty-26,34,83,'#859aa5','#344e5e');circ(c,tx+side*109,ty,19);c.fillStyle='#92a8b3';c.fill();screw(c,tx+side*109,ty);}
  c.save();c.translate(tx,ty);c.rotate(st.restored?0:Math.sin(t*.55)*.10);
  panel(c,-106,0,212,28,'#aebfc6','#3e5b6c');
  c.beginPath();c.ellipse(0,0,105,26,0,0,TAU);c.fillStyle='#8ca5b1';c.fill();c.strokeStyle='#c3d5dc';c.lineWidth=3;c.stroke();
  c.save();c.beginPath();c.ellipse(0,0,98,22,0,0,TAU);c.clip();
  for(let i=-3;i<=3;i++)line(c,-110,i*9,110,i*9,'#2e4c5f',4);c.restore();
  panel(c,-39,-35,78,35,'#d0d9dc','#637d8c');panel(c,-25,-50,50,18,'#a9bec7','#3c5b6c');c.restore();
  // Fixture clamps and a milled pocket on the billet, separate from the rotary platter.
  for(const dx of [-58,58]){panel(c,tx+dx-13,ty-24,26,9,'#bbcdd5','#466273');screw(c,tx+dx,ty-20);}
  c.save();c.translate(tx,ty-44);c.scale(1,.38);circ(c,0,0,13);c.fillStyle='#29495a';c.fill();circ(c,0,0,8);c.strokeStyle='#94b6c5';c.lineWidth=2;c.stroke();c.restore();
  // Carousel stores actual taper holders around the tool magazine.
  const mx=x+wide-117,my=168;
  circ(c,mx,my,44);c.fillStyle='#213e4f';c.fill();circ(c,mx,my,31);c.strokeStyle='#7894a2';c.lineWidth=4;c.stroke();
  for(let i=0;i<10;i++){const a=i*TAU/10;panel(c,mx+Math.cos(a)*34-4,my+Math.sin(a)*34-7,8,14,'#b7cbd1','#526d7e',1);}
  if(st.left)head(c,st.left.x*T,st.left.y*T,57,Math.sin(t*.8)*.20,t,!st.restored);
  if(st.right)head(c,st.right.x*T,st.right.y*T,102,-Math.sin(t*.9)*.24,t,!st.restored);
  // Slow coolant drips stay behind the player; attack tells use the strong amber lane below.
  if(!st.restored)for(const tip of [st.left,st.right])if(tip){
    for(let i=0;i<4;i++){const u=(t*.65+i*.23)%1;c.globalAlpha=(1-u)*.45;line(c,tip.x*T+15,tip.y*T+u*32,tip.x*T+14,tip.y*T+u*32+5,'#9ce0e3',1);}
    c.globalAlpha=1;
  }
  // Attack tells: an amber lane at the height each head is about to sweep.
  for(const w of (st.warns||(st.warn?[[st.warn[0],st.warn[1],10.5]]:[]))){
    const a=w[0]*T,b=w[1]*T,ly=(w[2]??10.5)*T;
    c.fillStyle='rgba(255,157,67,.12)';c.fillRect(Math.min(a,b)-22,ly-T*.5,Math.abs(b-a)+44,T*1.1);
    c.save();c.setLineDash([10,8]);line(c,a,ly,b,ly,'#ffbd68',3);c.restore();
  }
  // Lower service rail: repair nodes sit in front of the machine, never hidden by the table.
  panel(c,x+60,y-37,wide-120,35,'#7c929f','#2e4b5d');
  const NUM={bearing:1,seal:2,coupling:3},NAME={bearing:'DRIVE',seal:'COOLANT',coupling:'CONTROL'};
  for(const [sx,sy,kind] of B.sockets){
    const xx=sx*T,yy=(sy||12)*T-48,n=st.fitted[kind]||0,pips=st.seq?3:2;
    if((sy||12)<12)stand(c,xx-20,40,yy+42,(sy||12)*T,false);
    panel(c,xx-24,yy-16,48,58,'#829aa7','#29495b');circ(c,xx,yy,20);c.fillStyle='#09202d';c.fill();
    A.pickupIcon(c,kind,xx,yy,.82);
    for(let j=0;j<pips;j++){circ(c,xx-(pips-1)*8+j*16,yy+31,4);c.fillStyle=j<n?'#8ce6cd':'#162f3e';c.fill();}
    if(st.target!==kind||st.restored)text(c,NUM[kind]+'  '+NAME[kind],xx,yy-24,9,'#8fb3bd','center');
    const active=st.target===kind||(st.target==='unit'&&sx===B.console[0]);
    if(active&&!st.restored){                                    // the next point flashes (owner, 27 Sept: important); the full order is never shown
      const by=yy-65+Math.sin(t*4)*4,on=Math.sin(t*9)>-.2;
      glow(c,xx,yy,on?60:44,on?'rgba(111,224,214,.30)':'rgba(111,224,214,.12)');
      c.fillStyle=on?'#dffff7':'#8fd9c9';c.beginPath();c.moveTo(xx-12,by);c.lineTo(xx+12,by);c.lineTo(xx,by+17);c.fill();
      text(c,NUM[kind]+'  '+NAME[kind],xx,by-8,10,'#c2f3ec','center');
      if(st.fix){c.beginPath();c.arc(xx,yy,26,-Math.PI/2,-Math.PI/2+st.fix.u*TAU);c.strokeStyle='#adf8e2';c.lineWidth=5;c.stroke();}
    }
    if(st.wrong&&st.wrong.kind===kind){c.globalAlpha=Math.min(1,st.wrong.t/.3);circ(c,xx,yy,26);c.strokeStyle='#ff6a4d';c.lineWidth=5;c.stroke();glow(c,xx,yy,50,'rgba(255,90,60,.25)');c.globalAlpha=1;}
  }
  for(const [a,b] of B.safeLanes){line(c,a*T,y+10,b*T,y+10,'#91d0bc',3);text(c,'REFUGE',(a+b)/2*T,y+27,9,'#a4c6c6','center');}
  panel(c,x+wide-71,131,62,94,'#a7b7bd','#4d6878');c.fillStyle='#081c28';c.fillRect(x+wide-64,139,48,40);
  text(c,st.restored?'CYCLE OK':'AXIS FAULT',x+wide-40,152,7,st.restored?'#8be6bb':'#ffb46a','center');
  if(st.seq&&!st.restored){for(let i=0;i<st.seq.length;i++){const done=i<st.step,cur=i===st.step;
      c.fillStyle=done?'#3f8f7c':cur&&Math.sin(t*9)>0?'#ffb46a':'#233f51';c.fillRect(x+wide-63+i*5.4,160,4.4,9);}}
  else text(c,'X Y Z B C',x+wide-40,166,7,'#9abcc6','center');
  for(let j=0;j<12;j++){c.fillStyle='#233f51';c.fillRect(x+wide-61+(j%4)*11,187+Math.floor(j/4)*9,7,5);}
  lamp(c,x+wide-42,57,st.restored);
  text(c,'FIVE-AXIS SERVICE CELL',x+wide/2,2,11,'#c0d4da','center');
  c.restore();
};
A.bossSilhouette=function(c,x,y,s,t){c.save();c.translate(x-384*s,y-150*s);c.scale(s,s);A.turner(c,{bounds:[0,0,24,17],sockets:[[5,12,'bearing'],[12,12,'seal'],[19,12,'coupling']],console:[12,12],safeLanes:[]},{left:{x:5,y:7},right:{x:19,y:7},fitted:{},units:0},t);c.restore();};

A.secretGrille=function(c,L,P,got,camX,vw){
  for(const s of L.data.sections)if(s.secret){
    const [xx,yy,ww,hh]=s.secret,x=(s.x+xx)*T,y=yy*T;
    if(x<camX-200||x>camX+vw+200)continue;
    const near=P&&Math.hypot(P.x-(s.x+14.5),P.y+6.7)<4;
    c.save();c.globalAlpha=near?.18:1;panel(c,x,y,ww*T,hh*T,'#314c58','#142c3a');
    for(let j=8;j<hh*T-5;j+=9)line(c,x+8,y+j,x+ww*T-8,y+j,'#0d202b',4);
    text(c,'SERVICE VOID',x+ww*T/2,y+hh*T+17,9,'#678d9c','center');c.restore();
    if(!near){circ(c,x+ww*T-13,y+13,2);c.fillStyle='#8dd8dc';c.fill();}
  }
};
// Voice reactions deliberately have no subtitles. This hook remains available to audio QA.
M.onVoice=()=>{};
A.journeyHUD=function(c,L,P,G,B){
  if(!P)return;
  c.save();
  const section=L.sectionAt(P.x),idx=L.sections.indexOf(section)+1;
  if(G.ts!==.2&&!G.slowShow){
  c.fillStyle='rgba(5,17,27,.88)';rr(c,690,76,258,47,7);c.fill();
  text(c,String(idx).padStart(2,'0')+' / '+L.sections.length+'   '+section.title.toUpperCase(),704,96,10,'#a9c5d0');
  c.fillStyle='#29434f';c.fillRect(704,108,230,3);c.fillStyle='#8cdcd7';c.fillRect(704,108,230*Math.min(1,P.x/L.W),3);
  if(P.y<6){text(c,'MAINTENANCE ROUTE  ↑',704,139,10,'#a7e1e0');}
  }
  if(B.on&&!B.done){
    const seq=(L.boss.orders[B.order]||L.boss.orders[0]);
    M.bossStrip(c,B.step,seq.length,3,'R'+Math.min(3,Math.floor(B.step/3)+1)+'/3',F);
  }
  c.restore();
};
})();
