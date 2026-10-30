// Cobot Mania: the cobots' own sounds. Level 1's audio.js is left exactly as it is and still plays the music, the shared
// effects and Mike's voice; this adds a few soft synthesised sounds on a context of its own, with the same mute switch
// and the same pause. Nothing is recorded and nothing costs anything.
(function(){
'use strict';
const M = window.MIKE; let ac = null, out = null, noiseBuf = null, voices = 0;
function init(){
  if (ac) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC(); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
  out = ac.createGain(); out.gain.value = .2; lp.connect(out); out.connect(ac.destination); out.bus = lp;
}
function tone(f, dur, o){
  if (!ac || voices >= 7) return; o = o || {};
  const t = ac.currentTime + (o.delay || 0), g = ac.createGain(), osc = ac.createOscillator();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .14, t + (o.attack || .008)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  osc.connect(g); g.connect(out.bus); osc.start(t); osc.stop(t + dur + .02); voices++; osc.onended = () => voices--;
}
function noise(dur, o){
  if (!ac || voices >= 7) return; o = o || {};
  if (!noiseBuf){ noiseBuf = ac.createBuffer(1, ac.sampleRate*.6, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; }
  const t = ac.currentTime + (o.delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; f.type = o.band ? 'bandpass' : 'lowpass'; f.frequency.setValueAtTime(o.freq || 700, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .1, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out.bus); src.start(t); src.stop(t + dur + .02); voices++; src.onended = () => voices--;
}
const SOUNDS = {
  grip: () => { noise(.16, { freq:2600, to:900, band:true, vol:.07 }); tone(220, .12, { to:180, type:'triangle', vol:.06, delay:.08 }); },          // a soft pneumatic close
  servo: () => { tone(330, .5, { to:520, type:'sawtooth', vol:.025, attack:.06 }); tone(165, .5, { to:260, vol:.04, attack:.06 }); },                // the arm's move
  setDown: () => { noise(.12, { freq:1800, to:600, band:true, vol:.05 }); tone(520, .1, { to:660, type:'triangle', vol:.06 }); },
  hook: () => { tone(740, .06, { vol:.06 }); noise(.08, { freq:3000, band:true, vol:.04 }); },
  letGo: () => tone(600, .08, { to:420, type:'triangle', vol:.05 }),
  chirp: () => { tone(1400, .05, { vol:.04 }); tone(1400, .05, { vol:.04, delay:.09 }); },                                                           // a hazard's tell
  crate: () => { noise(.25, { freq:600, to:200, vol:.12 }); noise(.12, { freq:2400, band:true, vol:.05, delay:.03 }); tone(90, .2, { to:60, vol:.12 }); },
  key: () => { tone(880, .07, { type:'square', vol:.035 }); tone(1320, .09, { type:'triangle', vol:.05, delay:.05 }); },
  undo: () => tone(660, .1, { to:440, type:'triangle', vol:.06 }),
  run: () => { for (let i = 0; i < 3; i++) tone(520 + i*130, .09, { type:'triangle', vol:.06, delay:i*.08 }); },
  jam: () => { tone(110, .6, { type:'sawtooth', vol:.06 }); tone(116, .6, { type:'sawtooth', vol:.05 }); noise(.4, { freq:500, vol:.06, delay:.1 }); },
  ok: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, { type:'triangle', vol:.07, delay:i*.07 })); }
};
M.audio3 = {
  unlock(){ init(); if (ac && ac.state === 'suspended') ac.resume(); },
  play(name){ if (ac && !M.audio.muted && ac.state === 'running' && SOUNDS[name]) SOUNDS[name](); },
  suspend(){ if (ac && ac.state === 'running') ac.suspend(); },
  resume(){ if (ac && ac.state === 'suspended') ac.resume(); }
};
})();
