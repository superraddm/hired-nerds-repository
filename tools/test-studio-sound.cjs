const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const API=require('../public/fireworks/little-patterns/studio-sound.js');
const root=path.resolve(__dirname,'../public/fireworks/little-patterns'),bank=require(root+'/assets/studio-sounds/manifest.json');
const wav=fs.readFileSync(root+'/assets/studio-sounds/velvet-bank.wav');
function fixture(options={}){
 let now=1000,next=0;const timers=new Map(),sources=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
 const context={state:'suspended',destination:{},get currentTime(){return now/1000;},resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},close(){this.state='closed';return Promise.resolve();},createGain:node,createBiquadFilter:node,createDynamicsCompressor:node,
  decodeAudioData(bytes,ok){ok({duration:40});},createBufferSource(){const s={...node(),playbackRate:param(),loop:false,start(at,offset,duration){this.at=at;this.offset=offset;this.endAt=this.loop?Infinity:at+duration/this.playbackRate.value;},stop(at){this.endAt=at;}};sources.push(s);return s;}};
 const env=new EventTarget();env.document=new EventTarget();env.document.hidden=false;env.performance={now:()=>now};env.AudioContext=function(){return context;};env.StudioSoundBank=bank;
 let fetches=0;env.fetch=async()=>{fetches++;if(options.fail)throw Error('offline');if(options.delayed)await new Promise(r=>options.resolve=r);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(options.wrongSize?10:bank.bytes)};};
 env.setTimeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;};env.clearTimeout=id=>timers.delete(id);
 const engine=new API.Engine({env});
 const advance=ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}for(const s of sources)if(!s.finished&&s.endAt<=now/1000){s.finished=true;s.onended?.();}};
 return {engine,env,context,sources,advance,timers,get fetches(){return fetches;}};
}
test('sound package is under 2,000,000 bytes and contains 35 original bounded PCM regions',()=>{
 const files=['studio-sound.js','studio-sound-review.html','assets/studio-sounds/bank.js','assets/studio-sounds/manifest.json','assets/studio-sounds/velvet-bank.wav','assets/studio-sounds/NOTICE.txt'];
 const bytes=files.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0);assert.ok(bytes<2000000,bytes);
 assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),24000);
 assert.equal(crypto.createHash('sha256').update(wav).digest('hex'),bank.sha256);assert.equal(Object.keys(bank.clips).length,35);
 let lastEnd=0;
 for(const [name,clip]of Object.entries(bank.clips)){
  assert.ok(clip.start>=lastEnd);lastEnd=clip.start+clip.duration;
  const start=Math.round(clip.start*24000),len=Math.round(clip.duration*24000);let peak=0,sum=0,energy=0;
  for(let i=0;i<len;i++){const v=wav.readInt16LE(44+2*(start+i))/32768;peak=Math.max(peak,Math.abs(v));sum+=v;energy+=v*v;}
  assert.ok(peak<=.625,name+' peak');assert.ok(Math.abs(sum/len)<.01,name+' DC');assert.ok(energy>0,name+' audible data');
  if(!clip.loop){assert.equal(wav.readInt16LE(44+start*2),0);assert.equal(wav.readInt16LE(44+(start+len-1)*2),0);}
 }
});
test('flick action and amount change texture; weight changes pitch; velocity remains quiet and capped',()=>{
 assert.equal(API.paintProfile(0,0).name,'tap');assert.equal(API.paintProfile(0,1000).name,'puddle');assert.equal(API.paintProfile(800,0).name,'flick');assert.equal(API.paintProfile(2300,0).name,'sweep');
 assert.ok(API.impactProfile('glass',4,500).rate<API.impactProfile('glass',.4,500).rate);
 for(const material of API.materials)for(const weight of [.1,1,8])for(const speed of [0,10,500,100000]){
  const p=API.impactProfile(material,weight,speed);assert.ok(p.gain>=0&&p.gain<=.23);assert.ok(p.rate>=.72&&p.rate<=1.22);
 }
 assert.equal(API.impactProfile('glass',1,0).gain,0);assert.equal(API.rollProfile('wood',1,0).gain,0);
});
test('material interaction is symmetric, responds to both bodies, weight, restitution and speed',()=>{
 const glass={material:'glass',weight:1,bounce:.7},steel={material:'steel',weight:2.6,bounce:.4},wood={material:'wood',weight:.8,bounce:.5};
 assert.deepEqual(API.contactProfile(glass,steel,400),API.contactProfile(steel,glass,400));
 assert.notDeepEqual(API.contactProfile(glass,steel,400),API.contactProfile(glass,wood,400));
 assert.notDeepEqual(API.contactProfile(glass,steel,400),API.contactProfile(glass,{...steel,weight:5},400));
 assert.notDeepEqual(API.contactProfile(glass,steel,400),API.contactProfile(glass,{...steel,bounce:.9},400));
 assert.equal(API.contactProfile(glass,glass,400).layers.length,1);
 const p=API.contactProfile(glass,steel,10000);assert.ok(p.layers.reduce((s,l)=>s+l.gain,0)<.23);
 assert.equal(API.contactProfile(glass,steel,0).layers.reduce((s,l)=>s+l.gain,0),0);
 assert.ok(API.contactProfile(glass,{material:'paper',weight:Infinity},200).layers[0].cutoff<API.contactProfile(glass,steel,200).layers[0].cutoff);
});
test('default-on requires a gesture; mute stops all voices and never changes from tool sounds',async()=>{
 const a=fixture();assert.equal(a.engine.muted,false);a.engine.paint(0,0,.5);assert.equal(a.sources.length,0);
 await a.engine.unlock();a.engine.paint(0,0,.5);assert.equal(a.sources.length,1);
 a.engine.stroke('round',300,.5);assert.equal(a.engine.status().activeLoops,1);
 a.engine.setMuted(true);a.advance(100);assert.equal(a.engine.status().activeLoops,0);assert.equal(a.engine.status().activeShots,0);
 a.engine.paint(2000,0,.5);a.engine.stroke('oil',500,.5);await a.engine.unlock();assert.equal(a.sources.length,2);assert.equal(a.engine.muted,true);
 a.engine.dispose();
});
test('contacts and loops obey voice limits and cooldowns; quiet input has no impact voice',async()=>{
 const a=fixture();await a.engine.unlock();
 for(let i=0;i<20;i++)a.engine.impact('wood',1,0,'still'+i);assert.equal(a.sources.length,0);
 for(let i=0;i<20;i++)a.engine.impact('glass',1,500,'wall');assert.equal(a.sources.length,1);
 for(let i=0;i<20;i++)a.engine.impact('steel',2,1500,'other'+i);assert.equal(a.engine.status().activeShots,4);
 a.engine.stroke('flat',400,.5);a.engine.rolling([{material:'glass',weight:1,speed:600},{material:'wood',weight:2,speed:500}]);assert.equal(a.engine.status().activeLoops,2);
 a.advance(200);assert.equal(a.engine.status().activeLoops,2,'a quiet voice is kept through a short pause so slow strokes do not restart it');a.advance(400);a.advance(400);assert.equal(a.engine.status().activeLoops,0,'motion expires without release event');a.engine.dispose();
});
test('backgrounding and stop cancel queued sound, and return does not replay old contacts',async()=>{
 const a=fixture();await a.engine.unlock();a.engine.stroke('charcoal',500,.8);a.env.document.hidden=true;a.env.document.dispatchEvent(new Event('visibilitychange'));a.advance(100);
 assert.equal(a.engine.status().activeLoops,0);assert.equal(a.context.state,'suspended');const count=a.sources.length;
 a.env.document.hidden=false;a.env.document.dispatchEvent(new Event('visibilitychange'));a.engine.paint(1000,0,.4);assert.equal(a.sources.length,count);
 await a.engine.unlock();a.advance(150);a.engine.paint(1000,0,.4);assert.equal(a.sources.length,count+1);a.engine.dispose();
 const delayed={delayed:true},b=fixture(delayed);const unlocked=b.engine.unlock();b.engine.paint(0,0,.5);b.engine.stop();delayed.resolve();await unlocked;await Promise.resolve();assert.equal(b.sources.length,0);b.engine.dispose();
});
test('a failed bank or missing audio capability never throws into gameplay',async()=>{
 const a=fixture({fail:true});assert.equal(await a.engine.unlock(),false);assert.doesNotThrow(()=>{a.engine.paint(500,0);a.engine.stroke('round',100,.5);a.engine.stop();});a.engine.dispose();
 const b=fixture();delete b.env.AudioContext;assert.equal(await b.engine.unlock(),false);b.engine.dispose();
});

test('rapid retry taps share one bank request; corrupt bank is rejected before decode',async()=>{
 const options={delayed:true},a=fixture(options);const one=a.engine.unlock(true),two=a.engine.unlock(true);assert.equal(a.fetches,1);options.resolve();await Promise.all([one,two]);assert.equal(a.fetches,1);assert.equal(a.engine.status().ready,true);a.engine.dispose();
 const b=fixture({wrongSize:true});assert.equal(await b.engine.unlock(),false);assert.equal(b.engine.status().ready,false);b.engine.dispose();
});

test('suspension frees voices even when source ended events never arrive',async()=>{
 const a=fixture();await a.engine.unlock();a.engine.paint(0,0,.5);a.engine.stroke('round',100,.5);a.engine.suspend();assert.equal(a.engine.status().activeShots,0);assert.equal(a.engine.status().activeLoops,0);a.engine.dispose();
});

test('pending or rejected audio resumes report failure and allow explicit retry',async()=>{
 const a=fixture();a.context.resume=()=>new Promise(()=>{});const pending=a.engine.unlock();await Promise.resolve();a.advance(1300);assert.equal(await pending,false);assert.equal(a.engine.contextFailed,true);a.engine.dispose();
 const b=fixture();b.context.resume=()=>Promise.reject(Error('blocked'));assert.equal(await b.engine.unlock(),false);assert.equal(b.engine.contextFailed,true);b.context.resume=()=>{b.context.state='running';return Promise.resolve();};assert.equal(await b.engine.unlock(true),true);b.engine.dispose();
});

test('rolling keeps material slots when speeds cross and variants are picked at random, never in a fixed alternation',async()=>{
 const a=fixture();await a.engine.unlock();a.engine.rolling([{id:1,material:'glass',weight:1,speed:400},{id:2,material:'wood',weight:1,speed:390}]);
 const names=[...a.engine.loops.values()].map(v=>v.name);a.advance(40);a.engine.rolling([{id:1,material:'glass',weight:1,speed:390},{id:2,material:'wood',weight:1,speed:400}]);assert.deepEqual([...a.engine.loops.values()].map(v=>v.name),names);assert.equal(a.engine.status().loops,2);
 for(let i=0;i<8;i++)assert.match(a.engine.variant('impact-glass'),/^impact-glass-[01]$/);a.engine.dispose();
});
test('round 3: the textures a player can hear are long and carry no built-in beat',()=>{
 const {texture,RATE}=require('./build-studio-sounds.cjs');
 for(const name of ['round','flat','crayon','sponge','eraser']){
  const x=texture(name);assert.ok(x.length/RATE>=2.5,name+' loops no sooner than 2.5 s');
  // Envelope in 1 ms steps; no single modulation rate between 8 and 60 Hz may stand far above the rest (the first bank pulsed at 12 to 56 Hz by design).
  const hop=RATE/1000,env=[];for(let i=0;i+hop<=x.length;i+=hop){let s=0;for(let j=0;j<hop;j++)s+=Math.abs(x[i+j]);env.push(s/hop);}
  const mean=env.reduce((a,b)=>a+b)/env.length,mags=[];
  for(let f=8;f<=60;f+=1){let re=0,im=0;for(let i=0;i<env.length;i++){const w=.5-.5*Math.cos(2*Math.PI*i/env.length),v=(env[i]/mean-1)*w;re+=v*Math.cos(2*Math.PI*f*i/1000);im+=v*Math.sin(2*Math.PI*f*i/1000);}mags.push(Math.hypot(re,im));}
  const sorted=mags.slice().sort((a,b)=>a-b),median=sorted[sorted.length>>1];assert.ok(sorted[sorted.length-1]<median*4,name+' strongest pulse is '+(sorted[sorted.length-1]/median).toFixed(1)+' times the median');
 }
});
