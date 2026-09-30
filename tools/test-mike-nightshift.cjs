// Local headless game QA. This uses a fresh isolated profile, never a user's browser profile.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const OUT=path.resolve(__dirname,'../docs/mike-platformer/nightshift-look');fs.mkdirSync(OUT,{recursive:true});
const PORT=9346,BASE='http://localhost:8788/mike-game/';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--remote-debugging-port=${PORT}`,`--user-data-dir=${path.resolve(__dirname,'../.wrangler/mike-nightshift-test')}`,'--no-first-run','--autoplay-policy=no-user-gesture-required','--window-size=960,540','about:blank'],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
(async()=>{
 let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();if(tabs.length)break;}catch{}await sleep(150);}
 if(!tabs)throw Error('Isolated test browser did not start');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let next=0;const pending=new Map(),errors=[],requests=[];
 ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id&&pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id);}
  if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);
  if(d.method==='Runtime.consoleAPICalled'&&d.params.type==='error')errors.push(d.params.args.map(x=>x.value||x.description).join(' '));
  if(d.method==='Network.responseReceived'&&d.params.response.status>=400)errors.push('HTTP '+d.params.response.status+' '+d.params.response.url);
  if(d.method==='Network.requestWillBeSent')requests.push(d.params.request.url);
 };
 const send=(method,params={})=>new Promise((r,j)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);j(Error('Timed out: '+method));},90000);pending.set(id,d=>{clearTimeout(timer);if(d.error)j(Error(JSON.stringify(d.error)));else r(d.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 const open=async(q='',width=960,height=540,mobile=false)=>{
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
  await send('Page.navigate',{url:BASE+q});
  for(let i=0;i<150;i++){await sleep(100);if(await ev('document.body?.dataset.ready')==='1')return;}
  throw Error('Boot failed: '+await ev('document.body.innerText')+' '+errors.join('\n'));
 };
 const shot=async name=>{const d=await send('Page.captureScreenshot');fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(d.data,'base64'));};
 const result={};
 await open('?section=full&test=1');
 if(process.argv.includes('--boss-clips')){
  result.bossClips=[];
  for(const cards of [0,6]) for(const order of [0,1,2]){
   const r=await ev(`(()=>{const m=__mike;m.reset('full');MIKE.demo.reset();m.B.order=${order};m.G.inv.sdCard=${cards};Object.assign(m.api().CAMR,{cap:MIKE.cameraCapacity(${cards}),left:MIKE.cameraCapacity(${cards})});m.place(937,12);
    let clips=0;const next=MIKE.demo.next;MIKE.demo.next=a=>{const i=next(a);if(i.camera&&!a.CAMR.on)clips++;return i;};
    try {const run=m.runDemo(60*360);return {cards:${cards},order:${order},clips,camera:{...m.api().CAMR},...run};} finally {MIKE.demo.next=next;}})()`);
   result.bossClips.push(r);console.log(JSON.stringify({cards,order,seconds:r.seconds,clips:r.clips,health:r.snap.health,lost:r.snap.livesLost,won:r.won}));
   if(!r.won) console.log(JSON.stringify(r));
   assert.ok(r.won,'order '+order+' with '+cards+' cards wins');
   assert.equal(r.snap.livesLost,0,'ordinary inputs, no lost life');
   assert.ok(r.clips>0,'uses camera clips');
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'boss-clips.json'),JSON.stringify(result,null,2));
  await shot('boss-clips-end');await send('Browser.close');ws.close();chrome.kill();return;
 }
 if(process.argv.includes('--demo-only')){
  await open('?demo=1&test=1');
  for(let n=0;n<50;n++){
   const r=await ev('__mike.runDemo(60*30)');console.log(JSON.stringify({seconds:n*30,x:r.snap.x,y:r.snap.y,health:r.snap.health,lost:r.snap.livesLost,won:r.won,boss:r.snap.boss}));
   if(r.won)break;
  }
  const end=await ev('__mike.snapshot()');assert.ok(end.won,'full ordinary-input traversal wins');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'full-clips-run.json'),JSON.stringify(end,null,2));
  await shot('demo-end');await send('Browser.close');ws.close();chrome.kill();return;
 }
 if(process.argv.includes('--voice-only')){
  const gameRoot=path.resolve(__dirname,'../public/fireworks/mike-game');
  const manifest=JSON.parse(fs.readFileSync(path.join(gameRoot,'assets/voice/manifest.json'),'utf8'));
  assert.equal(manifest.voice,'voice_h0dygekvdjzv');assert.equal(manifest.model,'gemini-3.8-flash-tts');
  assert.equal(Object.keys(manifest.clips).length,7);
  assert.deepEqual(Object.values(manifest.clips).map(c=>c.text),['Nice one!','Get in!','Ey Up!','Ow! Pack it in!','Ooof!','Flipping Heck',"Right then. Let's get this lot sorted."]);
  for(const clip of Object.values(manifest.clips)){
   assert.ok(requests.some(url=>url.endsWith('/'+clip.file)),'corrected clip preloaded: '+clip.file);
   const hash=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(gameRoot,clip.file))).digest('hex');
   assert.equal(hash,clip.sha256);
  }
  await ev(`window.voiceObserved=[];MIKE.onVoice=(line,duration)=>voiceObserved.push({line,duration});MIKE.audio.setMuted(false);MIKE.audio.unlock();`);
  await ev(`window.voiceTextDraws=[];const originalFillText=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(['Nice one!','Get in!','Ey Up!','Ow! Pack it in!','Ooof!','Flipping Heck',"Right then. Let's get this lot sorted."].includes(text))voiceTextDraws.push(text);return originalFillText.call(this,text,...args);};`);
  await sleep(350);const loaded=requests.length;
  await ev(`MIKE.audio.say('power')`);await sleep(150);
  const power=await ev('voiceObserved');assert.equal(power.length,1);assert.equal(power[0].line,'Nice one!');
  assert.ok(Math.abs(power[0].duration-manifest.clips['power-1'].seconds)<.02);
  await sleep(Math.ceil((power[0].duration+2.1)*1000));
  await ev(`MIKE.audio.setMuted(true);MIKE.audio.say('pain')`);assert.equal(await ev('voiceObserved.length'),1);
  await ev(`MIKE.audio.setMuted(false);MIKE.audio.say('pain')`);await sleep(100);
  assert.equal(await ev('voiceObserved.length'),2);assert.equal(requests.length,loaded);
  assert.deepEqual(await ev('voiceTextDraws'),[],'spoken reactions do not draw subtitles');
  assert.deepEqual(errors,[]);
  const checked={voice:manifest.voice,model:manifest.model,clips:7,powerAndPainPlayback:true,mute:true,noSubtitles:true,noRuntimeDownloads:true,errors};
  fs.writeFileSync(path.join(OUT,'voice-checks.json'),JSON.stringify(checked,null,2));console.log('Voice checks passed',JSON.stringify(checked));
  await send('Browser.close');ws.close();chrome.kill();return;
 }
 result.structure=await ev(`(()=>{const l=__mike.level;return {width:l.W,sections:l.sections.length,checkpoints:l.checkpoints.length,hazards:l.hazards.length,platforms:l.solids.filter(s=>s.kind==='shelf').length,top:Math.min(...l.solids.map(s=>s.y)),errors:l.errors,secret:l.pickups.filter(p=>p.type==='miniMike')};})()`);
 assert.equal(result.structure.width,960);assert.deepEqual(result.structure.errors,[]);assert.equal(result.structure.secret.length,1);assert.ok(result.structure.secret[0].hidden);
 result.vertical=await ev(`(()=>{const m=__mike;m.place(500,-5.6);m.step(50);return m.snapshot();})()`);
 assert.ok(result.vertical.sy>130&&result.vertical.sy<480,'camera follows upper storeys');
 await shot('upper-route');
 result.lookDown=await ev(`(()=>{const m=__mike;m.reset('full');m.G.card=0;m.place(303.5,1);m.step(180);const before=m.snapshot();m.input({lookDown:true});m.step(120);const held=m.snapshot();m.input({});m.step(120);return {before,held,released:m.snapshot()};})()`);
 assert.ok(result.lookDown.held.camY-result.lookDown.before.camY>159);assert.ok(result.lookDown.held.camY-result.lookDown.before.camY<=160.01);assert.equal(result.lookDown.held.x,result.lookDown.before.x);assert.equal(result.lookDown.held.y,result.lookDown.before.y);assert.ok(Math.abs(result.lookDown.released.camY-result.lookDown.before.camY)<.02);
 await ev('__mike.input({lookDown:true});__mike.step(120)');await shot('look-down');
 const floorLook=await ev(`(()=>{const m=__mike;m.reset('full');m.place(2,12);m.step(90);const y=m.snapshot().camY;m.input({lookDown:true});m.step(120);return m.snapshot().camY-y;})()`);assert.ok(Math.abs(floorLook)<.02,'look down clamps at shop floor');
 result.salvage=await ev(`(()=>{const m=__mike;return {total:m.level.salvageTotal,recipe:m.level.boss.recipe,hold:m.level.boss.hold,recovery:m.level.recovery};})()`);
 assert.equal(result.salvage.total,56);assert.deepEqual(result.salvage.recipe,{});assert.equal(result.salvage.recovery,null);
 result.secret=await ev(`(()=>{const m=__mike;m.reset('full');const p=m.level.pickups.find(p=>p.type==='miniMike');m.place(p.x,p.y+1);return m.snapshot();})()`);
 assert.equal(result.secret.lives,4);assert.ok(result.secret.got.includes('secret-mini-mike'));
 result.hazard=await ev(`(()=>{const m=__mike;m.reset('full');const h=m.level.hazards.find(h=>h.id==='bridge-head');m.G.mt=h.cycle*.4;const p=MIKE.railTip(h,m.G.mt);m.place(p.x,h.rect[1]+5.6);return m.snapshot().health;})()`);
 assert.equal(result.hazard,2,'new travelling head has a live hitbox');
 // section 1's pillar drill is a real hazard: its bit hurts while fed down, and is harmless when up
 result.drill=await ev(`(()=>{const m=__mike,d=m.level.decor.find(d=>d.type==='demoDrill');m.reset('full');m.G.mt=1.7;m.api().P.hitT=9;m.place(d.x-.2,12);const down=m.snapshot().health;
   m.reset('full');m.G.mt=.3;m.api().P.hitT=9;m.place(d.x-.2,12);m.step(20);return {down,up:m.snapshot().health};})()`);
 assert.equal(result.drill.down,2,'the drill bit hurts when down');assert.equal(result.drill.up,3,'and not when up');
 result.repair=await ev(`(()=>{const m=__mike;m.reset('full');m.place(941,12);m.B.t=3.9;m.input({camera:true,fix:true});m.step(30);m.input({});m.step(1);const cancelled=m.snapshot();m.input({fix:true});m.step(193);return {cancelled:cancelled.used.bearing,progress:cancelled.boss.fix,step:m.B.step,used:m.snapshot().used,inv:m.snapshot().inv};})()`);
 assert.equal(result.repair.cancelled,0);assert.equal(result.repair.progress,0);assert.equal(result.repair.step,1);assert.ok(Object.values(result.repair.used).every(n=>n===0));assert.ok(Object.values(result.repair.inv).every(n=>n===0),'repair works with zero collectibles');
 // Start at the entrance with an empty inventory, then ordinary inputs through all nine jobs.
 result.zeroSalvageBoss=await ev(`(()=>{const m=__mike;m.reset('full');MIKE.demo.reset();m.B.order=0;m.place(937,12);
   for(let i=0;i<360&&!m.B.done;i++)m.runDemo(60);const repaired=m.B.done,repairs=m.B.step;
   // Resume during restoration, before the results screen deliberately clears the completed save.
   m.resume();m.input({});m.step(210);return {...m.snapshot(),repairs,completedRun:repaired};})()`);
 assert.ok(result.zeroSalvageBoss.completedRun && result.zeroSalvageBoss.won);assert.equal(result.zeroSalvageBoss.repairs,9,'nine repairs: each point three times');assert.equal(result.zeroSalvageBoss.got.length,0);assert.ok(Object.values(result.zeroSalvageBoss.used).every(n=>n===0));
 result.refuge=await ev(`(()=>{const m=__mike;m.reset('full');m.place(940.5,12);m.step(2);m.B.step=0;m.B.t=0;m.place(938,12);m.input({});m.step(610);const left=m.snapshot().health;
   m.reset('full');m.place(940.5,12);m.step(2);m.B.step=0;m.B.t=0;m.place(958,12);m.input({});m.step(610);return {left,right:m.snapshot().health};})()`);
 assert.equal(result.refuge.left,3,'left refuge survives two full cycles of floor sweeps');assert.equal(result.refuge.right,3,'right refuge too');
 // the owner's harder boss (27 Sept): three levels, three learnable orders, rounds of three that survive a lost life
 result.bossRules=await ev(`(()=>{const m=__mike,L=m.level;const orders=L.boss.orders,counts=orders.map(o=>[1,2,3].map(n=>o.filter(v=>v===n).length));
   const levels=[...new Set(L.boss.sockets.map(s=>s[1]))].length;
   m.reset('full');m.place(940.5,12);m.step(2);const first=m.api().bossTarget();
   // holding Fix at a point that is not next does nothing
   const wrong=L.boss.sockets.find(s=>s[2]!==first.kind);m.B.t=3.9;m.place(wrong[0],wrong[1]);m.input({fix:true});m.step(150);m.input({});const wrongStep=m.B.step;
   return {counts,levels,first:first.kind,wrongStep,firsts:orders.map(o=>o[0])};})()`);
 assert.deepEqual(result.bossRules.counts,[[3,3,3],[3,3,3],[3,3,3]],'each point three times in every order');
 assert.equal(result.bossRules.levels,3,'the three points are on three levels');assert.equal(result.bossRules.wrongStep,0,'the wrong point does not count');
 assert.deepEqual(result.bossRules.firsts,[1,2,3],'each order starts at a different point, so the first repair tells you the order');
 result.bossRound=await ev(`(()=>{const m=__mike;m.reset('full');m.place(940.5,12);m.step(2);m.B.step=5;m.G.health=1;m.api().P.hitT=9;
   const tl=m.level.boss.timeline;m.B.t=tl.tell+tl.extend+tl.sweep/2;m.B.run=m.B.t;const tips=m.bossTips().filter(t=>t.danger);const t=tips[0];if(t)m.place(t.x,t.y+1.5);m.step(60);return {step:m.B.step,lives:m.snapshot().livesLost};})()`);
 assert.equal(result.bossRound.lives,1);assert.equal(result.bossRound.step,3,'a lost life restarts the current round of three');
 // salvage milestones: the tenth part pays +250 on top of its own points
 result.milestone=await ev(`(()=>{const m=__mike,L=m.level;m.reset('full');const parts=L.pickups.filter(p=>L.salvageTypes.includes(p.type)).slice(0,10);let own=0;
   for(const p of parts){m.place(p.x,p.y+1);m.step(1);own+={bearing:100,seal:100,coupling:100,controlUnit:250}[p.type];}
   return {score:m.snapshot().score,own,milestone:m.G.milestone&&m.G.milestone.title};})()`);
 assert.equal(result.milestone.score,result.milestone.own+250,'ten salvage pays a 250 bonus');assert.equal(result.milestone.milestone,'10 SALVAGE');
 await shot('boss-refuge');
 result.railContinuity=await ev(`(()=>{const h=__mike.level.hazards.find(h=>h.type==='railSpindle');let max=0,prior=MIKE.railTip(h,0);for(let i=1;i<=1200;i++){const p=MIKE.railTip(h,h.cycle*i/1200);max=Math.max(max,Math.hypot(p.x-prior.x,p.y-prior.y));prior=p;}return {max,wrap:Math.hypot(prior.x-MIKE.railTip(h,0).x,prior.y-MIKE.railTip(h,0).y),return:MIKE.railTip(h,h.cycle*.85)};})()`);
 assert.ok(result.railContinuity.max<.06);assert.ok(result.railContinuity.wrap<.001);assert.equal(result.railContinuity.return.danger,false);assert.equal(result.railContinuity.return.stage,'return');
 result.lift=await ev(`(()=>{const m=__mike;m.reset('full');m.G.mt=0;m.place(629,9.8);const start=m.snapshot();m.input({});m.step(280);const top=m.snapshot();m.step(280);return {start,top,end:m.snapshot()};})()`);
 assert.ok(Math.abs(result.lift.top.y-1)<.05,'Mike rides the real moving lift to its upper stop');assert.ok(Math.abs(result.lift.end.y-9.8)<.05,'lift carries Mike back down');
 result.floorShortcut=await ev(`(()=>{const m=__mike;m.reset('full');m.place(289,12);m.input({right:true,jump:true});m.step(140);return m.snapshot();})()`);
 assert.ok(result.floorShortcut.livesLost>0,'one floor jump cannot bypass the broken bridge');
 result.save=await ev(`(()=>{const m=__mike;m.reset('full');m.place(278,12);m.place(290,9.8);const score=m.snapshot().score;m.resume();return {score,restored:m.snapshot().score,x:m.snapshot().x};})()`);
 assert.equal(result.save.x,278);assert.ok(result.save.score>0);assert.equal(result.save.score,result.save.restored);
 if(process.argv.includes('--mechanics-only')){assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'mechanics-checks.json'),JSON.stringify(result,null,2));console.log('Mechanics checks passed, including victory resume and look-down.');await send('Browser.close');ws.close();chrome.kill();return;}
 const loaded=requests.length;await ev('__mike.step(120)');assert.equal(requests.length,loaded,'no requests during play');
 // Full physics traversal. The controller uses regular input only; no teleports or invulnerability.
 await open('?demo=1&test=1');
 result.demo=await ev('__mike.runDemo(60*900)');console.log('demo',JSON.stringify(result.demo));await shot('demo-end');
 fs.writeFileSync(path.join(OUT,'measurements.json'),JSON.stringify(result,null,2));
 // Capture scenes even if the controller finds an issue, to make failures reviewable.
 for(const name of ['title','s1-start','s3-camera-alley','s9-bench','s10-boss-idle','s10-boss-repair','results']){
  await open('?scene='+name);await shot(name);
 }
 for(const [name,x,y] of [['broken-bridge',304,5.4],['cross-feed',372,3.2],['gantry',500,-5.6],['reservoirs',577,1],['service-lift',629,1],['chip-tunnel',703,12],['opposed-traverses',763,1],['mill-spine',827,1]]){
  await open('?section=full&test=1');await ev(`__mike.G.card=0;${name==='service-lift'?'__mike.G.mt=4.5;':''}__mike.place(${x},${y});__mike.step(15)`);await shot(name);
 }
 for(const [name,width,height] of [['phone',844,390],['ipad',1024,768]]){
  await open('?section=full&test=1',width,height,true);await ev('__mike.place(940,12)');await shot(name+'-boss');
  const ctl=await ev(`(()=>{const ids=['tc-left','tc-right','tc-jump','tc-cam','tc-look'];return ids.map(id=>{const b=document.getElementById(id),r=b.getBoundingClientRect();return {id,w:r.width,h:r.height,visible:getComputedStyle(b).display!=='none'};});})()`);
  assert.ok(ctl.every(c=>c.visible&&c.w>=64&&c.h>=64));result[name]=ctl;
  if(name==='phone'){
    await ev('__mike.reset("full");__mike.release()');
    const points=await ev(`['tc-right','tc-jump'].map((id,i)=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,id:i+1};})`);
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await sleep(300);
    result.touch=await ev('__mike.snapshot()');await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.ok(result.touch.x>2.3&&result.touch.y<11,'simultaneous touch run and jump');
    await ev('__mike.reset("full");__mike.G.card=0;__mike.place(303.5,1);__mike.step(90);__mike.release()');
    const touchLookStart=await ev('__mike.snapshot().camY');
    const lookPoint=await ev(`(()=>{const r=document.getElementById('tc-look').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,id:1};})()`);
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[lookPoint]});await sleep(650);
    assert.ok(await ev('__mike.snapshot().camY')>touchLookStart+140);
    await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await sleep(650);
    assert.equal(await ev('__mike.snapshot().lookDown'),false);assert.ok(Math.abs(await ev('__mike.snapshot().camY')-touchLookStart)<6);
  }
 }
 await open('?section=full&test=1');await ev('__mike.release()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await sleep(700);await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
 result.keyboard=await ev('__mike.snapshot().x');assert.ok(result.keyboard>3);
 await ev('__mike.place(303.5,1);__mike.input({});__mike.step(90);__mike.release()');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown'});await sleep(650);assert.equal(await ev('__mike.snapshot().lookDown'),true);
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown'});await sleep(650);assert.equal(await ev('__mike.snapshot().lookDown'),false);
 // A real decoded voice buffer must start after an audio-unlocking gesture.
 await ev(`MIKE.audio.unlock();window.voiceObserved=[];window.voiceCallback=MIKE.onVoice;MIKE.onVoice=(line,duration)=>{voiceObserved.push({line,duration});voiceCallback(line,duration);};`);
 await sleep(250);await ev(`MIKE.audio.setMuted(false);MIKE.audio.say('power',true)`);await sleep(100);
 result.voice=await ev('voiceObserved');assert.ok(result.voice.some(v=>v.duration>0&&['Nice one!','Get in!','Ey Up!'].includes(v.line)));
 await sleep(1200);result.performance=await ev('__mike.perf()');
 result.errors=errors;fs.writeFileSync(path.join(OUT,'measurements.json'),JSON.stringify(result,null,2));
 assert.deepEqual(errors,[]);assert.ok(result.demo.won,'full demo reaches and repairs the boss');
 console.log('Night Shift checks passed',JSON.stringify({structure:result.structure,performance:result.performance}));
 await send('Browser.close');ws.close();chrome.kill();
})().catch(e=>{console.error(e);if(ws)ws.close();chrome.kill();process.exitCode=1;});
