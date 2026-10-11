const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const L = require('../public/fireworks/little-patterns/learning.js');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/voice/manifest.json'), 'utf8'));
const key = text => text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

test('the bundled voice covers all built-in spoken content and its browser index matches', () => {
  assert.deepEqual(Object.keys(manifest.clips).sort(), L.spokenBank());
  for (const text of ["Hello! I'm Nook. Let's play.", 'Whoops! Have another go.', 'nook eats an blank', 'the pattern fits', 'plus', 'equals', 'apples', 'ten']) assert.ok(manifest.clips[key(text)], text);
  // Every success line the game can produce is speakable from the bundled clips alone.
  const p = L.defaults;
  const rounds = [];
  for (let level = 1; level <= L.LEVELS.count; level++) for (let i = 0; i < 10; i++) rounds.push(['count', L.countRound(i, p, level)]);
  for (let level = 1; level <= L.LEVELS.add; level++) for (const op of L.OPERATIONS) for (let i = 0; i < 45; i++) rounds.push(['add', L.sumRound(i, p, level, op)]);
  for (let level = 1; level <= L.LEVELS.patterns; level++) rounds.push(['patterns', L.patternRound(level, p, level)]);
  for (let level = 1; level <= L.LEVELS.numbers; level++) for (let i = 0; i < 10; i++) rounds.push(['numbers', L.numberWordRound(i, p, level)]);
  for (let i = 0; i < L.SENTENCES.length; i++) { rounds.push(['sentence', L.sentenceRound(i, p)]); rounds.push(['order', L.orderRound(i, p)]); }
  for (let i = 0; i < L.PICTURES.length; i++) rounds.push(['letter', L.letterRound(i, p)]);
  for (const [kind, round] of rounds) {
    round.done = true;
    const line = L.successLine(kind, round);
    assert.ok(line.speech.length >= 2, kind + ' ' + round.id);
    for (const part of line.speech) assert.ok(manifest.clips[key(part)], 'missing clip for ' + JSON.stringify(part) + ' in ' + line.text);
  }
  const custom = L.successLine('letter', { id: 'letter:v2:L1:letter:DINOSAUR#1', word: 'DINOSAUR' });
  assert.ok(custom.speech.length === 1 && L.OPENERS.includes(custom.speech[0]), 'a private familiar word gets the opener only; the word itself is never sent to any voice automatically');
  assert.match(custom.text, /DINOSAUR/);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'voice-library.js'), 'utf8'), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.LPVoiceLibrary)), manifest);
});

test('every bundled clip is a bounded, non-silent mono WAV without clipped samples', () => {
  for (const [text, clip] of Object.entries(manifest.clips)) {
    assert.match(clip.file, /^assets\/voice\/[a-f0-9]{16}\.wav$/);
    const wav = fs.readFileSync(path.join(root, clip.file));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(20), 1, 'PCM');
    assert.equal(wav.readUInt16LE(22), 1, 'mono');
    assert.equal(wav.readUInt32LE(24), 24000);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.readUInt32LE(40), wav.length - 44);
    const seconds = (wav.length - 44) / 2 / 24000;
    assert.ok(seconds > .15 && seconds < 14, text);   // Nook's Gemini voice tells the Feelings stories slowly: up to about 11 s
    assert.ok(Math.abs(seconds - clip.seconds) < .001);
    let peak = 0;
    for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    assert.ok(peak > 1000 && peak < 32767, text);
  }
});

test('corrected alphabet keys use explicit model phonemes rather than respellings',()=>{
 const specs=JSON.parse(fs.readFileSync(path.join(__dirname,'little-patterns-phonics.json'),'utf8'));
 assert.deepEqual(Object.values(specs).map(s=>s.letter),['A','E','I','L','O','R','X','Z']);
 for(const[key,spec]of Object.entries(specs)){assert.equal(L.LETTER_SOUNDS[spec.letter],key);assert.ok(manifest.clips[key]);assert.ok(spec.phonemes.length>0);}
 assert.equal(specs['phonics-o'].phonemes,'ˈɒ');assert.equal(specs['phonics-i'].phonemes,'ˈɪ');assert.equal(specs['phonics-z'].phonemes,'zːə');
});

// ---- Round 4, phase 5 ----
const J = require('../public/fireworks/little-patterns/shared.js');
const bytes = file => { const b = fs.readFileSync(path.join(root, file)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
const clipOf = text => manifest.clips[key(text).replace(/,+$/, '')];

test('the WAV joiner (shared.js; the listening page is built with it too): parse, phrase gaps, join and encode', () => {
  const file = manifest.clips.apple.file, raw = bytes(file), pcm = J.parseWav(raw);
  assert.ok(pcm instanceof Int16Array);
  assert.equal(pcm.length, (raw.byteLength - 44) / 2);
  assert.deepEqual(Buffer.from(J.encodeWav(pcm)), Buffer.from(raw), 'encode(parse(clip)) gives the clip back byte for byte');
  // anything but 24 kHz 16-bit mono PCM is refused, so the game plays the old chain instead
  const variant = (at, size, value) => { const b = raw.slice(0); new DataView(b)[size === 2 ? 'setUint16' : 'setUint32'](at, value, true); return b; };
  assert.equal(J.parseWav(variant(22, 2, 2)), null, 'stereo');
  assert.equal(J.parseWav(variant(24, 4, 22050)), null, '22 kHz');
  assert.equal(J.parseWav(variant(34, 2, 8)), null, '8-bit');
  assert.equal(J.parseWav(variant(20, 2, 3)), null, 'float');
  assert.equal(J.parseWav(new ArrayBuffer(64)), null, 'not a WAV');
  assert.equal(J.parseWav(new ArrayBuffer(8)), null, 'too short');
  // 150 ms at a phrase boundary, 30 ms between the words of a phrase
  assert.deepEqual(J.phraseGaps(['Yes!', 'THREE', 'plus', 'TWO', 'equals', 'FIVE']), [150, 30, 30, 30, 30], 'after the opener, then a phrase');
  assert.deepEqual(J.phraseGaps(['FOUR', 'apples', 'Spot on!']), [30, 150], 'before a closing opener');
  assert.deepEqual(J.phraseGaps(['Lovely counting.', 'SEVEN', 'apples']), [150, 30]);
  assert.deepEqual(J.phraseGaps(['three,', 'then', 'two', 'more.', 'How many?']), [150, 30, 30, 150], 'a comma and a full stop mark phrase pauses');
  assert.deepEqual(J.phraseGaps(['Nook eats', 'TWO.', 'How many are left?']), [30, 150]);
  assert.deepEqual(J.phraseGaps(['Happy', 'Nook feels happy.']), [150], 'before a sentence');
  assert.deepEqual(J.phraseGaps(['TWENTY', 'ONE']), [30]);
  // the join: parts copied exactly, silence between, offsets and lengths reported
  const parts = ['Yes!', 'THREE', 'plus'], pcms = parts.map(p => J.parseWav(bytes(clipOf(p).file)));
  const j = J.joinPcm(pcms, J.phraseGaps(parts)), at = ms => Math.round(ms * 24);
  assert.equal(j.samples.length, pcms[0].length + at(150) + pcms[1].length + at(30) + pcms[2].length);
  assert.deepEqual(Array.from(j.samples.subarray(0, pcms[0].length)), Array.from(pcms[0]));
  assert.ok(j.samples.subarray(pcms[0].length, pcms[0].length + at(150)).every(v => v === 0), 'silence in the gap');
  assert.deepEqual(Array.from(j.samples.subarray(pcms[0].length + at(150), pcms[0].length + at(150) + pcms[1].length)), Array.from(pcms[1]));
  assert.deepEqual(j.offsets, [0, (pcms[0].length + at(150)) / 24000, (pcms[0].length + at(150) + pcms[1].length + at(30)) / 24000]);
  assert.deepEqual(j.seconds, pcms.map(p => p.length / 24000));
  for (const [i, p] of parts.entries()) assert.ok(Math.abs(j.seconds[i] - clipOf(p).seconds) < .001, p);
  const whole = J.join(parts, pcms), view = new DataView(whole.wav);
  assert.equal(view.getUint32(24, true), 24000); assert.equal(view.getUint16(22, true), 1); assert.equal(view.getUint32(40, true), j.samples.length * 2);
  assert.ok(Math.abs(whole.total - j.samples.length / 24000) < 1e-9);
  assert.equal(J.join(parts, [pcms[0], null, pcms[2]]), null, 'a missing part joins nothing');
});

test('every prompt and Help line the frame shows can be heard: the fixed lines are in the bank, and the composed Add and Take away prompts are said in phrases from bundled clips', () => {
  const bank = new Set(L.spokenBank());
  for (const line of L.PROMPT_SPEECH) assert.ok(bank.has(key(line)), line);
  const old = r => { const w = n => L.numberWord(n).toLowerCase(); return r.operation === 'take' ? (r.b === 0 ? 'Nook eats none.' : r.b === r.a ? 'Nook eats them all.' : 'Nook eats ' + w(r.b) + '.') + ' How many are left?' : r.missing ? 'How many more came?' : w(r.a).charAt(0).toUpperCase() + w(r.a).slice(1) + ', then ' + w(r.b) + ' more. How many?'; };
  let rounds = 0;
  for (let level = 1; level <= L.LEVELS.add; level++) for (const op of L.OPERATIONS) for (let i = 0; i < 45; i++) {
    const r = L.sumRound(i, L.defaults, level, op), p = L.sumPrompt(r);
    assert.equal(p.text, old(r), 'the bubble text is unchanged');
    for (const part of p.speech) assert.ok(clipOf(part), 'a clip for ' + JSON.stringify(part) + ' in ' + p.text);
    rounds++;
  }
  assert.ok(rounds > 400);
  assert.deepEqual(L.sumPrompt({ a: 3, b: 2, operation: 'add' }).speech, ['three,', 'then', 'two', 'more.', 'How many?']);
  assert.deepEqual(L.sumPrompt({ a: 21, b: 4, operation: 'add' }).speech, ['twenty', 'one,', 'then', 'four', 'more.', 'How many?']);
  assert.deepEqual(L.sumPrompt({ a: 7, b: 2, operation: 'take' }).speech, ['Nook eats', 'two.', 'How many are left?']);
  assert.deepEqual(L.sumPrompt({ a: 7, b: 7, operation: 'take' }).speech, ['Nook eats them all. How many are left?']);
});

test('the voice build polish ran after the library render: every clip but the 26 phonics sounds was trimmed (trim-stats.json matches the manifest); the comparison recordings are not game clips', () => {
  const stats = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/little-patterns-round-4/build/phase-5/trim-stats.json'), 'utf8'));
  const phonics = new Set(Object.values(L.LETTER_SOUNDS));
  assert.equal(phonics.size, 26);
  for (const [text, clip] of Object.entries(manifest.clips)) {
    if (phonics.has(text)) { assert.ok(!stats[text], 'phonics untouched: ' + text); continue; }
    const s = stats[text];
    assert.ok(s, 'trimmed: ' + text);
    assert.equal(s.file, path.basename(clip.file));
    assert.ok(Math.abs(s.after_s - clip.seconds) < .001, 'the manifest has the trimmed length: ' + text);
    assert.ok(s.after_s <= s.before_s);
    // never cut before the last speech plus 50 ms (four clips, such as "more", breathe out to the very end of the take as
    // the library polish left it; those keep everything)
    assert.ok(s.cut_at_ms >= Math.min(s.last_voiced_ms + 49, Math.round(s.before_s * 1000) - 1), 'never cut into the last speech: ' + text);
  }
  const files = new Set(Object.values(manifest.clips).map(c => path.basename(c.file)));
  for (const f of fs.readdirSync(path.join(__dirname, '../docs/little-patterns-round-4/build/phase-5/listen/compare'))) assert.ok(!files.has(f), f);
});
