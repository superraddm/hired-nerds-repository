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
  for (const text of ["Hello! I'm Nook. Let's play.", 'Whoops! Try again.', 'nook eats an blank', 'the pattern fits', 'plus', 'equals', 'apples', 'ten']) assert.ok(manifest.clips[key(text)], text);
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
    assert.ok(seconds > .15 && seconds < 10, text);
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
