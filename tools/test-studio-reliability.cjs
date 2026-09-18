// Isolated real-browser regression checks. No personal browser profile or saved art.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const out=path.resolve(process.env.LAB_OUT||'.wrangler/studio-release'),port=9339,base=process.env.STUDIO_TEST_URL||'http://localhost:8788/little-patterns/studio-lab.html';
fs.mkdirSync(out,{recursive:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(out,'reliability-profile')}`,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,send;
(async()=>{
 let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch(`http://localhost:${port}/json/list`)).json();if(tabs.length)break;}catch(_){}await pause(100);}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let serial=0;const pending=new Map(),errors=[],results={};
 ws.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);pending.delete(r.id);clearTimeout(p.timer);r.error?p.reject(Error(JSON.stringify(r.error))):p.resolve(r.result);}else if(r.method==='Runtime.exceptionThrown')errors.push(r.params.exceptionDetails);};
 send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>reject(Error('CDP timeout: '+method)),15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async(expression)=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(50);}throw Error('Timed out: '+expression);};
 const navigate=async suffix=>{await send('Page.navigate',{url:base+suffix});await pause(250);await until('!!window.__lab && window.__lab.draftState.ready');};
 const shot=async name=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:768,height:954,deviceScaleFactor:1,mobile:true});
 await navigate('?seed=20&draft=off');
 const setup=`window.A=window.__lab;window.C=document.querySelector('#paint');window.G=C.getContext('2d');window.press=s=>{const b=document.querySelector(s);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:99,pointerType:'mouse'}));};window.ptr=(type,x,y)=>{const p=A.toScreen(x,y);document.querySelector('#stage').dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'mouse',clientX:p.x,clientY:p.y}));};window.alpha=(x,y)=>G.getImageData(x,y,1,1).data[3];`;
 await ev(setup);
 await ev(`press('#new');A.S.size.brush=.5;ptr('pointerdown',300,400);ptr('pointermove',500,400);ptr('pointerup',500,400);`);
 assert.ok(await ev('alpha(500,400)>0'),'stroke must reach release point');results.strokeEndpoint=true;
 await ev(`A.undo();window.touch=(type,id,x,y)=>{const p=A.toScreen(x,y);document.querySelector('#stage').dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:id,clientX:p.x,clientY:p.y}));};window.pinch=()=>{touch('pointerdown',11,650,500);touch('pointerdown',12,850,500);touch('pointermove',11,600,500);touch('pointermove',12,900,500);touch('pointerup',11,600,500);touch('pointerup',12,900,500);};`);
 const redoBefore=await ev('A.history');await ev('pinch()');assert.deepEqual(await ev('A.history'),redoBefore);await ev('A.redo();');assert.ok(await ev('alpha(500,400)>0'));results.pinchPreservesRedo=true;
 await ev(`for(let i=0;i<4;i++){ptr('pointerdown',300+i*100,700);ptr('pointerup',300+i*100,700);}`);assert.equal(await ev('A.history.undo'),4);await ev('pinch()');assert.equal(await ev('A.history.undo'),4);results.pinchPreservesFullHistory=true;
 const beforeClear=await ev('A.inked()');await ev(`for(let i=0;i<6;i++)press('#new');A.undo();`);assert.equal(await ev('A.inked()'),beforeClear);results.repeatedNewKeepsPicture=true;
 await ev(`press('#new');press('[data-brush="sponge"]');ptr('pointerdown',200,500);ptr('pointermove',1200,500);ptr('pointerup',1200,500);`);
 assert.ok(await ev(`(()=>{for(let x=250;x<1200;x+=70){const d=G.getImageData(x-15,475,30,50).data;if(!d.some((v,i)=>i%4===3&&v>0))return false;}return true;})()`),'sponge must cover sparse-event stroke');results.spongeSpacing=true;
 await ev(`press('#new');A.setTool('flick');ptr('pointerdown',400,400);ptr('pointercancel',400,400);`);assert.equal(await ev('A.inked()'),0);results.cancelWithoutSplat=true;
 await ev(`ptr('pointerdown',450,450);document.querySelector('#stage').dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:1,clientX:0,clientY:0}));ptr('pointerdown',500,500);ptr('pointerup',500,500);`);assert.ok(await ev('A.inked()>0'));results.lostCaptureRecovers=true;
 await ev(`press('#new');A.addMarble();A.setTool('brush');A.S.brush='round';A.S.colour='#e5383b';ptr('pointerdown',200,500);ptr('pointermove',700,500);ptr('pointerup',700,500);var m=A.M.list[0];m.x=300;m.y=500;m.sx=m.x;m.sy=m.y;A.setTool('marbles');ptr('pointerdown',300,500);ptr('pointermove',600,500);`);await pause(220);await ev(`ptr('pointerup',600,500);`);await pause(150);
 assert.ok(await ev('A.M.list[0].lctx.getImageData(0,0,80,80).data.some((v,i)=>i%4===3&&v>0)'),'marble must pick up pigment');
 await ev('A.undo();A.undo();');assert.equal(await ev('A.inked()'),0);assert.equal(await ev('A.M.list[0].lctx.getImageData(0,0,80,80).data.some((v,i)=>i%4===3&&v>0)'),false);results.undoPigment=true;
 await ev('A.redo();');assert.ok(await ev('A.inked()>0'));results.redo=true;
 const prior=await ev(`({ink:A.inked(),marbles:A.M.list.map(m=>({kind:m.kind.name,x:m.x,y:m.y}))})`);await ev(`press('#new');A.undo();`);assert.deepEqual(await ev(`({ink:A.inked(),marbles:A.M.list.map(m=>({kind:m.kind.name,x:m.x,y:m.y}))})`),prior);results.newUndoRestoresMarbles=true;
 await ev(`A.setTool('marbles');var m=A.M.list[0];ptr('pointerdown',m.x,m.y);`);await pause(350);assert.equal(await ev('!!A.M.raf'),false);const history=await ev('A.history.undo');await ev(`var m=A.M.list[0];ptr('pointerup',m.x,m.y);`);assert.equal(await ev('A.history.undo'),history);results.heldIdleAndTapHistory=true;
 await ev(`A.openExport()`);await until(`!document.querySelector('#export-image').hidden`);assert.ok(await ev(`document.querySelector('#download-picture').href.startsWith('blob:')`));
 const exported=await ev(`(async()=>{const blob=await(await fetch(document.querySelector('#download-picture').href)).blob();const image=await createImageBitmap(blob);const c=document.createElement('canvas');c.width=1600;c.height=1200;const g=c.getContext('2d');g.drawImage(image,0,0);return {width:image.width,height:image.height,paper:[...g.getImageData(1599,1199,1,1).data]};})()`);assert.deepEqual(exported,{width:1600,height:1200,paper:[255,253,246,255]});await shot('export-ipad');await ev('A.closeExport()');results.exportPaperAndSize=true;
 for(const [width,height,name] of [[360,740,'phone'],[740,360,'phone-landscape'],[768,954,'ipad']]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await pause(400);await ev(`A.setTool('brush')`);await pause(80);
   const controls=await ev(`([...document.querySelectorAll('#bar button,#home,#ctx button,#palette button')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {label:b.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height};}))`);
   for(const c of controls){assert.ok(c.w>=48&&c.h>=48,JSON.stringify(c));assert.ok(c.x>=-1&&c.y>=-1&&c.x+c.w<=width+1&&c.y+c.h<=height+1,name+': '+JSON.stringify(c));}
   const before=await ev(`({x:A.GEO.cx,y:A.GEO.cy,s:A.GEO.s})`);await ev(`A.setTool('marbles')`);assert.deepEqual(await ev(`({x:A.GEO.cx,y:A.GEO.cy,s:A.GEO.s})`),before,name+' tool must not move paper');await ev(`A.setTool('brush')`);await shot('studio-'+name);results[name+'Targets']=true;
 }
 await navigate('?seed=21');await ev(setup);await ev(`(async()=>{press('#new');A.S.brush='round';ptr('pointerdown',250,600);ptr('pointermove',650,600);ptr('pointerup',650,600);await A.flushDraft();})()`);
 assert.equal(await ev('A.draftState.failed'),false);const savedInk=await ev('A.inked()');assert.ok(savedInk>0);
 await navigate('?seed=22');await ev(setup);assert.equal(await ev('A.inked()'),savedInk);results.localRecovery=true;
 // No explicit flush here: the actual Back handler must wait for the newest action.
 await ev(`ptr('pointerdown',900,350);ptr('pointermove',1100,350);ptr('pointerup',1100,350);`);const latestInk=await ev('A.inked()');await ev(`press('#home')`);await until(`location.pathname.endsWith('/garden.html')`);
 await navigate('?seed=25');await ev(setup);assert.equal(await ev('A.inked()'),latestInk);results.immediateBackSavesStroke=true;
 // A closed IDB connection gets one reopen instead of disabling local saving.
 assert.equal(await ev(`(async()=>{const store=new StudioDraft();const db=await store.open();db.close();const blob=await new Promise(r=>C.toBlob(r));await store.write(blob);const record=await store.read();store.db.close();return record.data.byteLength>0&&!store.failed;})()`),true);results.closedStorageReopens=true;
 // Back while a previous write is still encoding must also wait for the new revision.
 await ev(`window.realBlob=C.toBlob.bind(C);C.toBlob=(fn,type)=>setTimeout(()=>realBlob(fn,type),200);A.changed();A.flushDraft();ptr('pointerdown',900,850);ptr('pointerup',900,850);`);const inflightInk=await ev('A.inked()');await ev(`press('#home')`);await until(`location.pathname.endsWith('/garden.html')`);await navigate('?seed=26');await ev(setup);assert.equal(await ev('A.inked()'),inflightInk);results.backWaitsForInflightSave=true;
 await ev(`(async()=>{press('#new');await A.flushDraft();})()`);await navigate('?seed=23');assert.equal(await ev('__lab.inked()'),0);results.blankDraftRecovery=true;
 // Storage denial must not stop paint or offer false saving assurance.
 const injected=await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'indexedDB',{get(){throw Error('blocked storage');}});`});await navigate('?seed=24');await ev(setup);assert.equal(await ev('A.draftState.failed'),true);await ev(`ptr('pointerdown',500,500);ptr('pointerup',500,500);`);assert.ok(await ev('A.inked()>0'));results.storageDenialAllowsPainting=true;await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
 assert.deepEqual(errors,[]);results.errors=errors;fs.writeFileSync(path.join(out,'reliability.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 await send('Browser.close').catch(()=>{});ws.close();chrome.kill();
})().catch(async e=>{console.error(e);if(send)await send('Browser.close').catch(()=>{});if(ws)ws.close();chrome.kill();process.exitCode=1;});
