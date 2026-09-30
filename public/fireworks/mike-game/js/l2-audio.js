// Below the Wire: the water's own sounds. Level 1's audio.js is left exactly as it is and still plays the music,
// the shared effects and Mike's voice; this adds a few soft synthesised sounds on a context of its own.
// It follows the same mute switch and the same pause.
(function(){
'use strict';
const M = window.MIKE; let ac = null, out = null, noiseBuf = null, voices = 0;
function init(){
  if (ac) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC(); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
  out = ac.createGain(); out.gain.value = .22; lp.connect(out); out.connect(ac.destination); out.bus = lp;
}
function tone(f, dur, o){
  if (!ac || voices >= 6) return; o = o || {};
  const t = ac.currentTime + (o.delay || 0), g = ac.createGain(), osc = ac.createOscillator();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .15, t + (o.attack || .008)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  osc.connect(g); g.connect(out.bus); osc.start(t); osc.stop(t + dur + .02); voices++; osc.onended = () => voices--;
}
function noise(dur, o){
  if (!ac || voices >= 6) return; o = o || {};
  if (!noiseBuf){ noiseBuf = ac.createBuffer(1, ac.sampleRate*.6, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; }
  const t = ac.currentTime + (o.delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; f.type = o.band ? 'bandpass' : 'lowpass'; f.frequency.setValueAtTime(o.freq || 700, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out.bus); src.start(t); src.stop(t + dur + .02); voices++; src.onended = () => voices--;
}
const SOUNDS = {
  splash: v => { noise(.38, { freq:1500, to:300, vol:.10 + .06*Math.min(1, (v || 0)/10) }); tone(210, .2, { to:120, vol:.06 }); },
  surface: () => noise(.22, { freq:900, to:1800, vol:.06 }),
  kick: () => { noise(.18, { freq:700, to:1600, vol:.07 }); tone(330, .14, { to:520, type:'triangle', vol:.07 }); },
  valve: () => { tone(150, .12, { to:95, vol:.16 }); tone(95, .2, { to:70, vol:.12, delay:.13 }); noise(.5, { freq:260, vol:.05, delay:.2 }); },
  door: () => { noise(.35, { freq:320, vol:.07 }); tone(120, .3, { to:90, vol:.06 }); },
  suit: () => { noise(.3, { freq:2400, to:500, band:true, vol:.07 }); tone(520, .16, { type:'triangle', vol:.08, delay:.16 }); tone(780, .24, { type:'triangle', vol:.08, delay:.3 }); },
  // static: a dry crackle as it nears full, a soft tick as it earths, a snap and a thump when it discharges
  staticHigh: () => { for (let i = 0; i < 4; i++) noise(.05, { freq:3000 + i*300, band:true, vol:.07, delay:i*.11 + (i % 2)*.03 }); },
  earthed: () => { tone(880, .07, { to:440, vol:.05 }); noise(.06, { freq:2200, band:true, vol:.03 }); },
  discharge: () => { noise(.16, { freq:3400, band:true, vol:.13 }); tone(1700, .1, { to:300, type:'square', vol:.04 }); tone(120, .4, { to:60, vol:.16, delay:.05 }); },
  zap: () => { noise(.12, { freq:3200, band:true, vol:.08 }); tone(1500, .08, { to:500, type:'square', vol:.03 }); },
  drain: () => noise(1.2, { freq:400, to:160, vol:.07 })
};
M.audio2 = {
  unlock(){ init(); if (ac && ac.state === 'suspended') ac.resume(); },
  play(name, v){ if (ac && !M.audio.muted && ac.state === 'running' && SOUNDS[name]) SOUNDS[name](v); },
  suspend(){ if (ac && ac.state === 'running') ac.suspend(); },
  resume(){ if (ac && ac.state === 'suspended') ac.resume(); }
};
})();
