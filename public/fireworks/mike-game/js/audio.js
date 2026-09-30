// Mike the Mic: synthesised effects/music plus bundled recordings using his original explainer voice. Soft taps, plucks,
// chimes, a dull bonk, a camera hum, and a warm 108 BPM loop. Master 25%, music below effects, at most eight effect
// effect voices, effects' highs rolled off, speech unfiltered. Audio waits for a gesture; mute persists; pause suspends it.
(function(){
'use strict';
const M = window.MIKE = window.MIKE || {};
const KEY = 'mike-game.v1.muted';
let ac = null, master, sfx, mus, hum = null, voices = 0, loop = null, boss = false;
let muted = false; try { muted = localStorage.getItem(KEY) === '1'; } catch(_){}
let voiceManifest = {}, voiceRaw = {}, voiceBuffers = {}, speaking = null, voiceUntil = 0;
const voiceCounter = {power:0,pain:0};
async function preload(){
  try {
    const r=await fetch('assets/voice/manifest.json', {cache:'no-cache'}); if(!r.ok)return;
    voiceManifest=(await r.json()).clips;
    await Promise.all(Object.entries(voiceManifest).map(async ([id,clip])=>{
      const r=await fetch(clip.file);if(r.ok)voiceRaw[id]=await r.arrayBuffer();
    }));
  } catch(e){ console.warn('Mike voice clips unavailable; sound effects remain active.'); }
}
function decodeVoices(){
  for(const [id,data] of Object.entries(voiceRaw)){
    delete voiceRaw[id]; ac.decodeAudioData(data.slice(0),b=>{voiceBuffers[id]=b;},()=>{});
  }
}
function say(kind, priority=false){
  if(!ac||muted||ac.state!=='running'||(!priority&&ac.currentTime<voiceUntil))return;
  const id=kind==='pain'||kind==='power' ? kind+'-'+(1+(voiceCounter[kind]++%3)) : kind;
  const buffer=voiceBuffers[id];if(!buffer)return;
  if(speaking){try{speaking.stop();}catch(_){}}
  const src=ac.createBufferSource(), gain=ac.createGain();src.buffer=buffer;gain.gain.value=2.6;
  src.connect(gain);gain.connect(master);src.start();speaking=src;
  voiceUntil=ac.currentTime+buffer.duration+(kind==='pain'?1.2:2);
  mus.gain.setTargetAtTime(.09,ac.currentTime,.08);
  src.onended=()=>{if(speaking===src){speaking=null;mus.gain.setTargetAtTime(.32,ac.currentTime,.25);}};
  if(M.onVoice)M.onVoice(voiceManifest[id].text,buffer.duration);
}

function init(){
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC();
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.25;
  // Keep effects softened, but preserve the explainer voice's full frequency range.
  master.connect(ac.destination); lp.connect(master);
  sfx = ac.createGain(); sfx.gain.value = 1; sfx.connect(lp);
  mus = ac.createGain(); mus.gain.value = 0.32; mus.connect(lp);
}
// one enveloped oscillator; slide to f2 if given
function tone(f, dur, o){
  if (!ac || voices >= 8) return; o = o || {};
  const t = ac.currentTime + (o.delay || 0), g = ac.createGain(), osc = ac.createOscillator();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const v = o.vol || .2, a = o.attack || .006;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(o.bus || sfx); osc.start(t); osc.stop(t + dur + .02);
  if (!o.bus){ voices++; osc.onended = () => voices--; }
}
let noiseBuf = null;
function noise(dur, o){
  if (!ac || voices >= 8) return; o = o || {};
  if (!noiseBuf){ noiseBuf = ac.createBuffer(1, ac.sampleRate*.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; }
  const t = ac.currentTime + (o.delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; f.type = o.hp ? 'highpass' : 'lowpass'; f.frequency.value = o.freq || 600;
  g.gain.setValueAtTime(o.vol || .1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(o.bus || sfx); src.start(t); src.stop(t + dur + .02);
  if (!o.bus){ voices++; src.onended = () => voices--; }
}
const SOUNDS = {
  step: () => noise(.035, { freq:900, vol:.05 }),
  jump: () => tone(392, .16, { type:'triangle', to:620, vol:.14 }),
  land: () => noise(.08, { freq:380, vol:.12 }),
  part: () => { tone(1047, .28, { vol:.1 }); tone(1568, .34, { vol:.07, delay:.06 }); },
  lube: () => { tone(260, .09, { to:170, vol:.14 }); tone(230, .09, { to:150, vol:.12, delay:.1 }); },
  sd: () => { tone(784, .16, { type:'triangle', vol:.12 }); tone(1175, .3, { type:'triangle', vol:.12, delay:.15 }); },
  unit: () => { tone(659, .14, { type:'triangle', vol:.1 }); tone(988, .22, { type:'triangle', vol:.1, delay:.1 }); },
  camOn: () => tone(1800, .03, { type:'square', vol:.03 }),
  camOff: () => tone(1300, .03, { type:'square', vol:.03 }),
  refuse: () => tone(700, .04, { type:'square', vol:.02 }),
  lowCharge: () => { tone(1500, .04, { vol:.05 }); tone(1500, .04, { vol:.05, delay:.12 }); },
  tick: () => tone(1250, .05, { type:'triangle', vol:.05 }),
  go: () => tone(880, .18, { type:'triangle', vol:.09 }),
  bonk: () => tone(190, .2, { to:85, vol:.22 }),
  repairTick: () => tone(1400, .02, { type:'square', vol:.02 }),
  repair: () => { tone(900, .03, { type:'square', vol:.05 }); tone(1350, .12, { vol:.1, delay:.04 }); },
  chord: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 1.6, { vol:.08, delay:i*.07, attack:.03 })); },
  checkpoint: () => { tone(659, .12, { vol:.08 }); tone(880, .2, { vol:.08, delay:.1 }); },
  fall: () => tone(500, .45, { to:140, type:'triangle', vol:.1 })
};

// the music: 16 sixteenths per bar at 108 BPM; bass, soft kick and hat, a sparse bell tune; the boss adds a pulse
const BASS = [36, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 41, 0, 43, 0];
const BELL = [0, 0, 0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 79, 0, 0, 0,  0, 0, 72, 0, 0, 0, 0, 0, 74, 0, 76, 0, 0, 0, 0, 0];
const midi = n => 440*Math.pow(2, (n - 69)/12);
function startMusic(){
  if (!ac || loop) return;
  const sixteenth = 60/108/4; let next = ac.currentTime + .1, i = 0;
  loop = setInterval(() => {
    while (next < ac.currentTime + .15){
      const d = next - ac.currentTime, s = i % 16, b = BASS[s], bell = BELL[i % 32];
      if (b) tone(midi(b), sixteenth*3.2, { type:'triangle', vol:.16, bus:mus, delay:d, attack:.02 });
      if (s % 8 === 0) tone(70, .12, { to:45, vol:.18, bus:mus, delay:d });
      if (s % 4 === 2) noise(.03, { freq:6000, hp:true, vol:.025, bus:mus, delay:d });
      if (bell) tone(midi(bell), 1.1, { vol:.05, bus:mus, delay:d, attack:.005 });
      if (boss && s % 2 === 0) tone(midi(48), sixteenth*.9, { type:'square', vol:.018, bus:mus, delay:d });
      next += sixteenth; i++;
    }
  }, 25);
}
function stopMusic(){ if (loop){ clearInterval(loop); loop = null; } }

M.audio = {
  preload, say,
  unlock(){ init(); if(ac)decodeVoices(); if (ac && ac.state === 'suspended') ac.resume(); startMusic(); },
  play(name){ if (ac && !muted && SOUNDS[name]) SOUNDS[name](); },
  hum(on){
    if (!ac) return;
    if (on && !hum){
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(120, ac.currentTime); o.frequency.linearRampToValueAtTime(92, ac.currentTime + 4);
      f.type = 'lowpass'; f.frequency.value = 520; g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(.035, ac.currentTime + .15);
      o.connect(f); f.connect(g); g.connect(sfx); o.start(); hum = { o, g };
    } else if (!on && hum){
      const h = hum; hum = null; h.g.gain.setTargetAtTime(0.0001, ac.currentTime, .05); h.o.stop(ac.currentTime + .3);
    }
  },
  boss(on){ boss = on; },
  get muted(){ return muted; },
  setMuted(m){ muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch(_){} if (master) master.gain.setTargetAtTime(m ? 0 : .25, ac.currentTime, .05); },
  suspend(){ if (ac && ac.state === 'running') ac.suspend(); },
  resume(){ if (ac && ac.state === 'suspended') ac.resume(); },
  stopMusic
};
})();
