// Local headless game QA. This uses a fresh isolated profile, never a user's browser profile.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const OUT=path.resolve(__dirname,'../docs/mike-platformer/edm-look');fs.mkdirSync(OUT,{recursive:true});
const PORT=9351,BASE='http://localhost:8788/mike-game/edm-prototype.html';
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--remote-debugging-port=${PORT}`,`--user-data-dir=${path.resolve(__dirname,'../.wrangler/mike-edm-test')}`,'--no-first-run','--autoplay-policy=no-user-gesture-required','--window-size=960,540','about:blank'],{stdio:'ignore',windowsHide:true});
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
 const result={};await open('?test=1');await ev('__edm.reset()');await shot('dock');
 for(const [name,x,y,water,mt] of [['tank-low',30,17.8,16.5,5],['tank-high',36,13.5,10.5,5],['guide',43,7.6,10.5,2],['refuge',59,9.8,10.5,5]]){
  await ev(`__edm.reset();__edm.S.suit=true;__edm.S.message='Inspect the tank. Down looks below; X dives.';__edm.S.water=${water};__edm.S.targetWater=${water};__edm.S.mt=${mt};__edm.place(${x},${y});for(let i=0;i<90;i++)__edm.draw()`);await shot(name);
 }
 await ev('__edm.reset();__edm.release()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await sleep(700);await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
 result.keyboard=await ev('__edm.snapshot()');assert.ok(result.keyboard.x>5);
 await open('?test=1',844,390,true);await ev('__edm.reset();__edm.S.suit=true;__edm.S.message="Inspect the tank. Look and Dive are separate controls.";__edm.S.water=10.5;__edm.S.targetWater=10.5;__edm.place(54,16);for(let i=0;i<90;i++)__edm.draw();');await shot('phone');
 result.touch=await ev(`Array.from(document.querySelectorAll('.tc')).map(b=>{const r=b.getBoundingClientRect();return {ctl:b.dataset.ctl,w:r.width,h:r.height,visible:getComputedStyle(b).display!=='none'};})`);
 assert.ok(result.touch.every(b=>b.visible&&b.w>=62&&b.h>=62));
 const pt=await ev(`(()=>{const r=document.querySelector('[data-ctl=dive]').getBoundingClientRect();return {id:1,x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 await ev('__edm.release()');const y=await ev('__edm.snapshot().y');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await sleep(650);assert.ok(await ev('__edm.snapshot().y')>y+.8);
 await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await sleep(500);
 assert.deepEqual(errors,[]);result.errors=errors;fs.writeFileSync(path.join(OUT,'browser.json'),JSON.stringify(result,null,2));console.log('EDM browser checks passed');await send('Browser.close');ws.close();chrome.kill();
})().catch(e=>{console.error(e);if(ws)ws.close();chrome.kill();process.exitCode=1;});
