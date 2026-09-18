// Original deterministic sound design. Offline generation; no sampled recordings.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const RATE = 24000, TAU = Math.PI * 2;
const out = path.resolve(__dirname, '../public/fireworks/little-patterns/assets/studio-sounds');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function random(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
function noise(n, seed, cutoff) {
  const a = 1 - Math.exp(-TAU * cutoff / RATE), r = random(seed), data = new Float32Array(n);
  let low = 0, low2 = 0, dc = 0;
  for (let i = 0; i < n; i++) { low += a * (r() * 2 - 1 - low); low2 += a * (low - low2); dc += .007 * (low2 - dc); data[i] = low2 - dc; }
  return data;
}
function finish(data, peak, loop = false) {
  // Remove DC and limit peaks offline; runtime voices retain generous headroom.
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  let max = 0;
  for (let i = 0; i < data.length; i++) { data[i] -= mean; max = Math.max(max, Math.abs(data[i])); }
  const gain = peak / Math.max(.001, max);
  for (let i = 0; i < data.length; i++) data[i] *= gain;
  if (loop) {
    // Crossfade a tail into the beginning, then remove that tail: seamless periodic texture.
    const cross = Math.floor(RATE * .4), len = data.length - cross;
    for (let i = 0; i < cross; i++) { const k = i / cross * Math.PI / 2; data[i] = data[len + i] * Math.cos(k) + data[i] * Math.sin(k); }
    let top=0;for(const v of data)top=Math.max(top,Math.abs(v));if(top>peak)for(let i=0;i<data.length;i++)data[i]*=peak/top;
    return data.slice(0, len);
  }
  const fade = Math.floor(RATE * .012);
  for (let i = 0; i < fade; i++) { const k = .5 - .5 * Math.cos(Math.PI * i / fade); data[i] *= k; data[data.length - 1 - i] *= k; }
  return data;
}
const MATERIALS = {
  glass: { hz: 1080, decay: .025, grain: 1500, body: .28 },
  smoky: { hz: 780, decay: .023, grain: 1150, body: .38 },
  steel: { hz: 920, decay: .018, grain: 1000, body: .46 },
  pearl: { hz: 690, decay: .016, grain: 1400, body: .27 },
  wood: { hz: 420, decay: .020, grain: 850, body: .55 }
};
// Round 3 (18 Sept 2026): the owner heard "a train or engine" in steady brushstrokes. The first bank pulsed every texture at 9 to 56 Hz, stepped its gain every 10 ms and looped after 1.6 s. Nothing in this file is periodic now: textures are band-limited noise with a slow, smooth, irregular swell, and one-shots are single soft gestures.
function band(n, seed, hp, lp) {
  // White noise through two one-pole low-passes and two one-pole high-passes: a soft-edged band with no resonance.
  const al = 1 - Math.exp(-TAU * lp / RATE), ah = 1 - Math.exp(-TAU * hp / RATE), r = random(seed), data = new Float32Array(n);
  let l1 = 0, l2 = 0, h1 = 0, h2 = 0;
  for (let i = 0; i < n; i++) { l1 += al * (r() * 2 - 1 - l1); l2 += al * (l1 - l2); h1 += ah * (l2 - h1); const x = l2 - h1; h2 += ah * (x - h2); data[i] = x - h2; }
  return data;
}
function wander(n, seed, depth, slow, fast) {
  // A smooth random swell: cosine glides between random levels at irregular intervals of slow..fast seconds. No fixed rate anywhere.
  const r = random(seed), data = new Float32Array(n); let from = 1, to = 1, at = 0, len = 1;
  for (let i = 0; i < n; i++) { if (i >= at + len) { at = i; from = to; to = 1 + (r() * 2 - 1) * depth; len = Math.floor(RATE * (slow + r() * (fast - slow))); } data[i] = from + (to - from) * (.5 - .5 * Math.cos(Math.PI * (i - at) / len)); }
  return data;
}
function impact(material, variant) {
  const p = MATERIALS[material], n = Math.floor(RATE * .2), a = band(n, 501 + variant * 79 + p.hz, 500, p.grain * 1.6), pitch = p.hz * (variant ? .96 : 1.04);
  for (let i = 0; i < n; i++) {
    const t = i / RATE, attack = 1 - Math.exp(-t / .006);
    const click = Math.sin(TAU * pitch * t) + .18 * Math.sin(TAU * pitch * 1.71 * t);
    a[i] = attack * (.30 * click * Math.exp(-t / (p.decay * .8)) + a[i] * 1.1 * Math.exp(-t / .016));
  }
  return finish(a, .5);
}
const TEXTURES = {
  round: {hp:700, lp:3000, depth:.10}, flat:{hp:550, lp:2600, depth:.10},
  crayon:{hp:1200, lp:4800, depth:.14, tooth:.12}, sponge:{hp:350, lp:1800, depth:.14},
  eraser:{hp:500, lp:2400, depth:.10, tooth:.06}, water:{hp:450, lp:2600, depth:.12, short:true},
  oil:{hp:300, lp:1700, depth:.10, short:true}, charcoal:{hp:1000, lp:4200, depth:.14, tooth:.14, short:true}
};
function rolling(name) {
  // Round 3c: a marble on paper is not a hiss (the owner heard waves). Rolling is thousands of tiny contacts, so the texture is built from them: soft band-limited ticks at random moments (about 70 a second, never evenly spaced), most of them very small, over a bed of noise too quiet to hear as a wash. Heavier, duller materials tick lower.
  const p = MATERIALS[name], n = Math.floor(RATE * 3), a = band(n, 700 + p.hz, 250, p.grain * .5), r = random(311 + p.hz), tick = band(n, 911 + p.hz, 400, p.grain * 1.3);
  for (let i = 0; i < n; i++) a[i] *= .05;
  let at = 0;
  while (at < n) { at += Math.floor(-Math.log(1 - r() * .999) * RATE / 70) + 1; const amp = Math.pow(r(), 3), len = Math.floor(RATE * (.004 + r() * .008)), up = Math.floor(RATE * .0015);
    for (let i = 0; i < len * 4 && at + i < n; i++) a[at + i] += tick[at + i] * amp * (i < up ? i / up : Math.exp(-(i - up) / len)); }
  return finish(a, .4, true);
}
function texture(name, roll = false) {
  if (roll) return rolling(name);

  // A brush is an airy band well above any rumble.
  const p = TEXTURES[name];
  const seed = 990 + p.lp + p.hp, n = Math.floor(RATE * (p.short ? 1.4 : 3)), a = band(n, seed, p.hp, p.lp), swell = wander(n, seed + 7, p.depth, .22, .7);
  // Tooth: paper grain catching wax or charcoal. Its own irregular flutter, 8 to 90 ms per glide, never a fixed beat.
  const tooth = p.tooth ? wander(n, seed + 13, p.tooth, .008, .09) : null;
  for (let i = 0; i < n; i++) a[i] *= swell[i] * (tooth ? tooth[i] : 1);
  return finish(a, .4, true);
}
function paint(kind, variant) {
  // Round 3c: the owner heard smacks. Any noise that reaches full level within a few milliseconds and then decays is a clap, however it is filtered, and a bright layer on top sharpens it. A puff has no edge: one band of noise above 700 Hz swells in on a raised cosine over tens of milliseconds, its top closes down while it sounds (the low-pass glides from open to shut, as a mouth does on "pfft"), and it fades rather than stops. No tone, no second layer.
  const presets = {
    //        seconds  rise   fall   lp from  lp to
    tap:     [.14,   .020,  .040,  3800,   2000],
    puddle:  [.36,   .055,  .120,  2600,   1300],
    flick:   [.27,   .045,  .110,  3500,   1800],
    sweep:   [.42,   .070,  .150,  3200,   1700],
    dribble: [.12,   .016,  .032,  4000,   2200],
    sponge:  [.27,   .045,  .100,  2800,   1500]
  };
  const [seconds, rise, fall, from, to] = presets[kind], n = Math.floor(RATE * seconds), r = random(from + to + variant * 71), a = new Float32Array(n), tilt = variant ? .92 : 1.08;
  const ah = 1 - Math.exp(-TAU * 700 / RATE); let l1 = 0, l2 = 0, h1 = 0, h2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE, cut = to + (from - to) * Math.max(0, 1 - t / (seconds * .7)), al = 1 - Math.exp(-TAU * cut * tilt / RATE);
    l1 += al * (r() * 2 - 1 - l1); l2 += al * (l1 - l2); h1 += ah * (l2 - h1); const x = l2 - h1; h2 += ah * (x - h2);
    a[i] = (x - h2) * (t < rise ? .5 - .5 * Math.cos(Math.PI * t / rise) : Math.exp(-(t - rise) / fall));
  }
  const fade = Math.floor(RATE * .04); for (let i = 0; i < fade; i++) a[n - 1 - i] *= i / fade;
  return finish(a, kind === 'dribble' || kind === 'tap' ? .22 : .3);
}
function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.round(clamp(samples[i], -1, 1) * 32767), 44 + i * 2);
  return b;
}
function build() {
  fs.mkdirSync(out, {recursive:true});
  const entries = [], add = (name, data, loop = false) => entries.push({name,data,loop});
  for (const name of Object.keys(TEXTURES)) add('stroke-' + name, texture(name), true);
  for (const name of Object.keys(MATERIALS)) {
    add('roll-' + name, texture(name, true), true);
    for (let v = 0; v < 2; v++) add('impact-' + name + '-' + v, impact(name, v));
  }
  for (const name of ['tap','puddle','flick','sweep','dribble','sponge']) for (let v = 0; v < 2; v++) add('paint-' + name + '-' + v, paint(name, v));
  const gap = Math.floor(RATE * .08), total = entries.reduce((n,e)=>n+e.data.length+gap,0), bank = new Float32Array(total), clips = {};
  let at = 0;
  for (const e of entries) {
    bank.set(e.data, at);
    clips[e.name] = {start:at / RATE, duration:e.data.length / RATE, loop:e.loop}; at += e.data.length + gap;
  }
  const bytes = wav(bank), digest = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(out, 'velvet-bank.wav'), bytes);
  const manifest = {version:1,sampleRate:RATE,file:'assets/studio-sounds/velvet-bank.wav?v=' + digest.slice(0,12),sha256:digest,bytes:bytes.length,clips};
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'bank.js'),'window.StudioSoundBank = '+JSON.stringify(manifest)+';\n');
  for(const page of ['studio-lab.html','studio-sound-review.html']){const file=path.resolve(out,'../../'+page);let html=fs.readFileSync(file,'utf8');html=html.replace(/assets\/studio-sounds\/bank\.js\?v=[^"']+/g,'assets/studio-sounds/bank.js?v='+digest.slice(0,12));fs.writeFileSync(file,html);}
  fs.writeFileSync(path.join(out,'NOTICE.txt'),'Messy Studio — Velvet sound bank\nOriginal mathematical synthesis, generated by tools/build-studio-sounds.cjs.\nNo recordings, voice models, samples or third-party sound assets are used.\nThe sound recordings generated for this project are dedicated to the public domain under CC0 1.0.\nhttps://creativecommons.org/publicdomain/zero/1.0/\n');
  console.log(`${entries.length} original sounds; ${(bytes.length/1024/1024).toFixed(2)} MiB; SHA256 ${digest}`);
  return {manifest,entries};
}
if (require.main === module) build();
module.exports = {build,noise,band,wander,impact,texture,paint,wav,RATE,MATERIALS,TEXTURES};
