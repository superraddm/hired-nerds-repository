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
  const texts = [...Object.keys(L.WORD_EMOJIS), ...L.NUMBER_WORDS.slice(1), ...L.PICTURES.map(p => p.word), ...Object.values(L.FEEDBACK), "Hello! I'm Nook. Let's play."];
  for (let i = 0; i < L.SENTENCES.length; i++) {
    const round = L.sentenceRound(i, L.defaults);
    texts.push(L.sentencePrompt(round)); round.done = true; texts.push(L.sentencePrompt(round));
  }
  assert.deepEqual(Object.keys(manifest.clips).sort(), [...new Set(texts.map(key))].sort());
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
