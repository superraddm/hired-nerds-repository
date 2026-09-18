/* Velvet: bounded, contact-driven audio. No canvas reads, physics or runtime synthesis. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudioSounds = api;
})(typeof window === 'object' ? window : globalThis, function() {
  'use strict';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
  const materials = ['glass','smoky','steel','pearl','wood'];
  const surfaces = {
    glass:{hardness:.82,damping:.36},smoky:{hardness:.72,damping:.48},steel:{hardness:.95,damping:.44},
    pearl:{hardness:.62,damping:.62},wood:{hardness:.32,damping:.78},
    tray:{hardness:.24,damping:.86},paper:{hardness:.10,damping:.95}
  };
  const strokes = ['round','flat','crayon','sponge','eraser','water','oil','charcoal'];
  function paintProfile(speed=0, hold=0, size=.4) {
    const energy=clamp((speed-150)/2200,0,1), amount=clamp(hold/1200,0,1);
    const name=energy>.55?'sweep':energy>0?'flick':amount>.25?'puddle':'tap';
    return {name,rate:clamp(1.08-.19*amount-.10*size+.06*energy,.8,1.14),gain:.07+.03*Math.sqrt(Math.max(energy,amount)),cutoff:4200};
  }
  function impactProfile(material='glass', weight=1, speed=0, surface='marble') {
    material=materials.includes(material)?material:'glass';
    weight=clamp(weight,.15,8);speed=clamp(speed,0,1800);
    const strength=Math.sqrt(speed/1100)*Math.pow(weight,.12);
    return {name:material,rate:clamp(1.10/Math.pow(weight,.19),.72,1.22),gain:speed<28?0:clamp(.06+.07*strength,.06,.15)*(surface==='edge'?.72:1),cutoff:surface==='edge'?1800:2600};
  }
  function strokeProfile(material,speed=0,size=.5) {
    material=strokes.includes(material)?material:'round';speed=clamp(speed,0,2000);size=clamp(size,0,1);
    const s=Math.sqrt(speed/1500);return {name:'stroke-'+material,rate:1.05-.12*size,gain:speed<4?0:(.03+.06*s)*(.7+.3*size),cutoff:(material==='charcoal'||material==='crayon'?3600:2600)+1800*s};
  }
  function rollProfile(material,weight,speed) {
    const p=impactProfile(material,weight,speed);speed=clamp(speed,0,2000);
    return {name:'roll-'+p.name,rate:clamp(p.rate*(.85+.3*Math.sqrt(speed/1200)),.6,1.4),gain:speed<12?0:clamp(.008+.03*Math.sqrt(speed/1200),0,.04),cutoff:1400+Math.min(speed,1000)*1.2};
  }
  // Real-time Foley: both surfaces shape the excitation and the two short bodies.
  // Symmetric material pairing; no pair-specific audio assets or physical audio simulation.
  function contactProfile(a,b,speed) {
    const clean=o=>({material:surfaces[o.material]?o.material:'glass',weight:o.weight===Infinity?Infinity:clamp(o.weight,.15,8),bounce:clamp(o.bounce==null?.5:o.bounce,0,1)});
    const pair=[clean(a),clean(b)].sort((x,y)=>x.material.localeCompare(y.material)||x.weight-y.weight);
    const [x,y]=pair,px=surfaces[x.material],py=surfaces[y.material];
    const mass=x.weight===Infinity?y.weight:y.weight===Infinity?x.weight:x.weight*y.weight/(x.weight+y.weight);
    const hardness=Math.sqrt(px.hardness*py.hardness),damping=(px.damping+py.damping)/2;
    const restitution=(x.bounce+y.bounce)/2,energy=clamp(speed,0,1800)**2*mass*(1-restitution*restitution);
    const strength=Math.min(1,Math.log1p(energy/18000)/4.2);
    const total=speed<28?0:(.055+.09*strength)*(1-.28*damping);
    const bodies=pair.filter(o=>materials.includes(o.material));
    if(bodies.length===2&&bodies[0].material===bodies[1].material)bodies.splice(1,1);
    return {mass,energy,hardness,damping,layers:bodies.map(o=>({name:o.material,rate:impactProfile(o.material,o.weight,speed).rate*(.96+.06*hardness),
      gain:total/bodies.length,cutoff:1300+1700*hardness*(1-.22*damping)}))};
  }
  class Engine {
    constructor(options={}) {
      this.env=options.env||window;this.bank=options.bank||this.env.StudioSoundBank;this.onState=options.onState||(()=>{});
      this.ctx=null;this.buffer=null;this.master=null;this.ready=null;this.fetching=null;this.loadFailed=false;this.contextFailed=false;this.unlockSerial=0;this.muteTimer=null;this.variants=new Map();this.rollOwners=[null,null];
      this.muted=false;this.needsGesture=true;this.epoch=0;this.serial=0;this.loops=new Map();this.shots=new Set();this.cooldowns=new Map();this.timer=null;
      this.diagnostics={shots:0,loops:0,peakShots:0,peakLoops:0,failures:0};
      this.visibility=()=>{if(this.env.document.hidden)this.suspend();};
      this.leave=()=>this.suspend();
      this.env.document.addEventListener('visibilitychange',this.visibility);
      this.env.addEventListener('pagehide',this.leave);
      this.fetchBank();
    }
    now(){return this.env.performance.now();}
    active(){return !this.muted&&!this.needsGesture&&!this.env.document.hidden;}
    fetchBank(){
      if(!this.fetching)this.fetching=this.env.fetch(this.bank.file,{credentials:'omit',referrerPolicy:'no-referrer'})
        .then(r=>{if(!r.ok)throw Error('Sound bank unavailable');return r.arrayBuffer();})
        .then(async bytes=>{if(bytes.byteLength!==this.bank.bytes)throw Error('Sound bank version mismatch');
          if(this.env.crypto?.subtle){const digest=await this.env.crypto.subtle.digest('SHA-256',bytes);const hex=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');if(hex!==this.bank.sha256)throw Error('Sound bank version mismatch');}return bytes;})
        .catch(()=>{this.loadFailed=true;this.diagnostics.failures++;this.onState('unavailable');return null;});
      return this.fetching;
    }
    async unlock(retry=false){
      if(this.muted||this.env.document.hidden)return false;
      if(this.buffer&&this.ctx?.state==='running'&&!this.needsGesture)return true;
      const attempt=++this.unlockSerial;
      this.needsGesture=false;
      try {
        if(this.ctx&&(this.ctx.state==='closed'||(retry&&this.contextFailed))){this.stop(true);this.ctx.onstatechange=null;this.ctx.close().catch(()=>{});this.ctx=null;this.buffer=null;this.ready=null;this.contextFailed=false;}
        if(!this.ctx){
          const Audio=this.env.AudioContext||this.env.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');
          this.ctx=new Audio();
          const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=6500;filter.Q.value=.5;
          const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.02;compressor.release.value=.25;
          this.master=this.ctx.createGain();this.master.gain.value=.55;this.input=filter;
          filter.connect(compressor);compressor.connect(this.master);this.master.connect(this.ctx.destination);
          this.ctx.onstatechange=()=>{if(this.ctx.state==='interrupted'||this.ctx.state==='closed'){this.needsGesture=true;this.contextFailed=true;this.stop(true);this.onState('unavailable');}};
        }
        // Call resume synchronously in the gesture, before awaiting fetch/decode.
        const resumed=new Promise(resolve=>{const timer=this.env.setTimeout(()=>resolve(false),1200);
          (this.ctx.state==='running'?Promise.resolve():this.ctx.resume()).then(()=>{this.env.clearTimeout(timer);resolve(true);},()=>{this.env.clearTimeout(timer);resolve(false);});});
        if(retry&&this.loadFailed&&!this.buffer){this.fetching=null;this.ready=null;this.loadFailed=false;}
        if(!this.ready)this.ready=this.fetchBank().then(bytes=>{
          if(!bytes)throw Error('Sound bank unavailable');
          return new Promise((resolve,reject)=>{
            const p=this.ctx.decodeAudioData(bytes.slice(0),resolve,reject);if(p&&p.catch)p.catch(()=>{});
          });
        }).then(b=>{this.buffer=b;this.loadFailed=false;return true;}).catch(()=>{this.loadFailed=true;this.diagnostics.failures++;this.onState('unavailable');return false;});
        const loaded=await this.ready;const running=await resumed;
        if(attempt!==this.unlockSerial)return false;
        if(running===false){this.contextFailed=true;this.needsGesture=true;this.onState('unavailable');return false;}
        if(loaded&&this.active()){this.contextFailed=false;this.onState('ready');}return loaded&&this.active();
      }catch(_){this.diagnostics.failures++;this.onState('unavailable');return false;}
    }
    setMuted(value){this.muted=!!value;if(this.muteTimer!==null)this.env.clearTimeout(this.muteTimer);this.muteTimer=null;this.stop();this.onState(this.muted?'muted':'on');
      if(this.muted){this.needsGesture=true;this.muteTimer=this.env.setTimeout(()=>{this.muteTimer=null;if(this.muted){this.stop(true);if(this.ctx)this.ctx.suspend().catch(()=>{});}},60);}else this.unlock(true);}
    retire(v,immediate=false){
      if(v.ended&&!immediate)return;v.ended=true;const at=this.ctx.currentTime;
      try{const gain=v.gain.gain;if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(at);else{gain.cancelScheduledValues(at);if(v.slot)gain.setValueAtTime(v.level||0,at);}
        if(immediate)gain.setValueAtTime(0,at);else gain.setTargetAtTime(0,at,v.slot?.05:.012);v.source.stop(immediate?at:at+(v.slot?.28:.06));}catch(_){}
      if(immediate)this.clean(v);
      // A stopped source owns its nodes until onended; it cannot be restarted.
    }
    clean(v){if(v.cleaned)return;v.cleaned=true;v.source.disconnect();v.filter.disconnect();v.gain.disconnect();this.shots.delete(v);if(this.loops.get(v.slot)===v)this.loops.delete(v.slot);}
    voice(name,profile,loop=false){
      const clip=this.bank.clips[name];if(!clip||!this.buffer||!this.active()||this.ctx.state!=='running')return null;
      const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
      source.buffer=this.buffer;source.playbackRate.value=clamp(profile.rate,.6,1.4);
      filter.type='lowpass';filter.frequency.value=profile.cutoff||1700;filter.Q.value=.55;
      gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.input);
      const at=this.ctx.currentTime,v={source,filter,gain,name,ended:false,last:this.now(),slot:null};
      source.onended=()=>this.clean(v);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(clamp(profile.gain,0,.24),at+(loop?.09:.012));
      if(loop){source.loop=true;source.loopStart=clip.start;source.loopEnd=clip.start+clip.duration;source.start(at,clip.start+Math.random()*clip.duration);}
      else {const duration=clip.duration/source.playbackRate.value;gain.gain.setValueAtTime(clamp(profile.gain,0,.24),at+Math.max(.01,duration-.025));gain.gain.linearRampToValueAtTime(0,at+duration);source.start(at,clip.start,clip.duration);}
      return v;
    }
    shot(name,profile,key='',gap=70){
      if(!this.active()||profile.gain<=0)return;
      const now=this.now();if(now-(this.cooldowns.get(key)||-Infinity)<gap)return;
      this.cooldowns.set(key,now);if(this.cooldowns.size>64)this.cooldowns.delete(this.cooldowns.keys().next().value);
      const epoch=this.epoch;
      const play=()=>{
        if(epoch!==this.epoch||!this.active()||this.now()-now>140||this.shots.size>=4)return;
        const v=this.voice(name,profile);if(!v)return;this.shots.add(v);this.diagnostics.shots++;this.diagnostics.peakShots=Math.max(this.diagnostics.peakShots,this.shots.size);
      };
      if(this.buffer)play();else if(this.ready)this.ready.then(play);
    }
    variant(prefix){return prefix+'-'+(Math.random()<.5?0:1);}
    paint(speed,hold,size){const p=paintProfile(speed,hold,size);this.shot(this.variant('paint-'+p.name),p,'paint',65);}
    dab(kind='dribble',size=.5){const name=kind==='sponge'?'sponge':'dribble';this.shot(this.variant('paint-'+name),{rate:(1.06-.18*clamp(size,0,1))*(.94+.12*Math.random()),gain:(name==='sponge'?.07:.055)*(.75+.25*Math.random()),cutoff:5000},'dab',this.dabGap||0);this.dabGap=130+Math.random()*240;}
    impact(material,weight,speed,key='contact',surface='marble'){
      const p=impactProfile(material,weight,speed,surface);this.shot(this.variant('impact-'+p.name),p,key,110);
    }
    contact(a,b,speed,key='pair'){
      const p=contactProfile(a,b,speed);if(this.shots.size+p.layers.length>4)return;
      for(let i=0;i<p.layers.length;i++){const layer=p.layers[i];this.shot(this.variant('impact-'+layer.name),layer,key+':'+i,120);}
    }
    motion(slot,profile){
      if(!this.active()||profile.gain<=0){this.end(slot);return;}
      if(!this.buffer)return; // Next movement updates it; no delayed stale loop.
      let v=this.loops.get(slot);
      if(v&&v.name!==profile.name){this.end(slot);return;} // Start new texture on next update after bounded fade.
      if(!v){
        if(this.loops.size>=2)return;
        v=this.voice(profile.name,profile,true);if(!v)return;v.slot=slot;v.tune=0;this.loops.set(slot,v);
        this.diagnostics.loops++;this.diagnostics.peakLoops=Math.max(this.diagnostics.peakLoops,this.loops.size);
      }
      if(v.ended)return;const now=this.now(),dt=Math.min(250,now-(v.heard||now));v.heard=now;v.last=now;
      const k=1-Math.exp(-dt/120);v.want=v.want==null?profile.gain*.5:v.want+(profile.gain-v.want)*k;v.bright=v.bright==null?profile.cutoff:v.bright+(profile.cutoff-v.bright)*k;
      if(now-v.tune>=32){const at=this.ctx.currentTime,g=v.gain.gain,level=clamp(v.want,0,.24),held=(now-v.tune)/1000;
        // Where the glide has reached, for browsers without cancelAndHoldAtTime.
        v.level=v.tune?(held<.2?level+((v.level||0)-level)*Math.exp(-held/.09):((v.level||0)-0)*Math.exp(-(held-.2)/.08)):0;
        v.source.playbackRate.setTargetAtTime(clamp(profile.rate,.6,1.4),at,.25);
        if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(at);else {g.cancelScheduledValues(at);g.setValueAtTime(v.level,at);}g.setTargetAtTime(level,at,.09);g.setTargetAtTime(0,at+.2,.08);
        v.fadeAt=at;v.filter.frequency.setTargetAtTime(v.bright,at,.12);v.tune=now;}
      this.watch();
    }
    stroke(material,speed,size){this.motion('stroke',strokeProfile(material,speed,size));}
    rolling(items){
      const moving=items.map((m,i)=>({...m,key:m.id==null?i:m.id})).filter(m=>m.speed>=6);
      const best=moving.slice().sort((a,b)=>(b.speed*(this.rollOwners.includes(b.key)?1.3:1))-(a.speed*(this.rollOwners.includes(a.key)?1.3:1))).slice(0,2);
      for(let i=0;i<2;i++)if(!best.some(m=>m.key===this.rollOwners[i])){this.end('roll'+i);this.rollOwners[i]=null;}
      for(const m of best)if(!this.rollOwners.includes(m.key)){const free=this.rollOwners.indexOf(null);if(free>=0)this.rollOwners[free]=m.key;}
      for(let i=0;i<2;i++){const m=best.find(m=>m.key===this.rollOwners[i]);if(m)this.motion('roll'+i,rollProfile(m.material,m.weight,m.speed));else this.end('roll'+i);}
    }
    end(slot){const v=this.loops.get(slot);if(v)this.retire(v);}
    watch(){
      if(this.timer!==null)return;
      this.timer=this.env.setTimeout(()=>{this.timer=null;for(const v of this.loops.values())if(this.now()-v.last>450)this.retire(v);if([...this.loops.values()].some(v=>!v.ended))this.watch();},70);
    }
    stop(immediate=false){this.epoch++;for(const v of this.shots)this.retire(v,immediate);for(const v of this.loops.values())this.retire(v,immediate);if(this.timer!==null)this.env.clearTimeout(this.timer);this.timer=null;}
    suspend(){this.needsGesture=true;this.stop(true);if(this.ctx)this.ctx.suspend().catch(()=>{});}
    dispose(){this.suspend();this.env.document.removeEventListener('visibilitychange',this.visibility);this.env.removeEventListener('pagehide',this.leave);if(this.ctx)this.ctx.close().catch(()=>{});}
    status(){return {...this.diagnostics,muted:this.muted,ready:!!this.buffer,needsGesture:this.needsGesture,activeShots:this.shots.size,activeLoops:this.loops.size};}
  }
  return {Engine,paintProfile,impactProfile,contactProfile,strokeProfile,rollProfile,materials,strokes,surfaces};
});
