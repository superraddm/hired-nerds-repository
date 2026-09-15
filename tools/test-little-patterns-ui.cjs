// DOM integration checks. No browser rendering, network or real audio.
// Install once: npm install --prefix .wrangler/test-runtime --no-save --ignore-scripts jsdom@26.1.0
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const L = require('../public/fireworks/little-patterns/learning.js');

function app(t, page = 'garden.html', seed = {}, blocked = false) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const dom = new JSDOM(html, { url: `https://games.example/little-patterns/${page}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, errors = [], spoken = [], utterances = [], plays = [], players = [];
  const voices = [{ name: 'Hazel', lang: 'en-GB', localService: true, default: true }];
  w.addEventListener('error', e => errors.push(e.error || e.message));
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
  w.SpeechSynthesisUtterance = function (text) { this.text = text; };
  w.speechSynthesis = Object.assign(new w.EventTarget(), { getVoices: () => voices, speak: utterance => { spoken.push(utterance.text); utterances.push(utterance); }, cancel() {} });
  w.Audio = function () {
    this.src = ''; this.paused = true;
    this.play = () => { this.paused = false; plays.push(this.src); return Promise.resolve(); };
    this.pause = () => { this.paused = true; };
    this.removeAttribute = name => { if (name === 'src') this.src = ''; };
    this.load = () => {};
    players.push(this);
  };
  w.fetch = () => { throw new Error('A game must not send player data over the network.'); };
  for (const [key, value] of Object.entries(seed)) w.localStorage.setItem(key, JSON.stringify(value));
  if (blocked) Object.defineProperty(w, 'localStorage', { value: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } } });
  for (const script of dom.window.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(root, script.getAttribute('src')), 'utf8'));
  t.after(async () => { await new Promise(resolve => setTimeout(resolve, 10)); assert.deepEqual(errors, [], 'no uncaught page errors'); dom.window.close(); });
  const query = selector => w.document.querySelector(selector);
  const click = selector => { const target = query(selector); assert.ok(target, selector); target.click(); return target; };
  const store = key => JSON.parse(w.localStorage.getItem(`lp-player-${w.LP.player.id}-${key}`));
  const submit = selector => query(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  return { w, query, click, store, submit, spoken, utterances, voices, plays, players };
}

test('Count, immediate addition and every pattern level remain directly available', t => {
  const a = app(t);
  a.click('[data-choice="1"]');
  assert.equal(a.query('#next').hidden, false);
  a.click('[data-mode="add"]');
  assert.equal(a.query('#join'), null);
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 3);
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/);
  a.click('[data-choice="2"]');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = 2/);
  a.click('[data-mode="patterns"]');
  a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 14);
  levels[6].click();
  assert.match(a.query('#support').textContent, /Level 7 of 14/);
  a.click('[data-close]');
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.store('garden-position').levels.patterns, 7);
});

test('missing-word input is typed, checked and retained separately for each player', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  assert.equal(a.w.document.querySelectorAll('.word-bank button').length, 3);
  a.click('[data-key="A"]');
  a.click('[data-player]');
  a.query('#player-form [name="name"]').value = 'Second player';
  a.submit('#player-form');
  a.click('[data-mode="words"]');
  assert.equal(a.query('#word-input').value, '');
  a.click('[data-key="B"]');
  a.click('[data-player]');
  a.w.document.querySelector('.player-list .saved-text').click();
  assert.equal(a.query('#word-input').value, 'A');
  for (const key of ['P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.match(a.query('#status').textContent, /Nook eats an apple/);
  assert.equal(a.query('#speech').textContent, a.w.GardenLearning.successLine('sentence', a.store('garden-rounds').sentence).text);
});

test('word pictures toggle both ways while the sentence picture and writing stay visible', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  assert.equal(a.w.document.querySelectorAll('.word-bank button').length, 3);
  assert.equal(a.query('#sentence-picture').hidden, false);
  const emojis = Array.from(a.w.document.querySelectorAll('.word-emoji'));
  assert.equal(emojis.length, 3);
  assert.ok(emojis.every(el => el.hidden && el.querySelector('img.symbol')));
  a.click('[data-key="A"]'); a.click('#word-hint');
  assert.ok(emojis.every(el => !el.hidden));
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.equal(a.query('#word-input').value, 'A');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.query('.word-bank .hint'), null, 'hint must not single out the answer');
  assert.equal(a.query('#word-hint').textContent, 'Hide pictures');
  a.click('#word-hint');
  assert.ok(emojis.every(el => el.hidden));
  assert.equal(a.query('#word-hint').getAttribute('aria-expanded'), 'false');
  assert.equal(a.query('#word-hint').textContent, 'Show pictures');
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.equal(a.query('#word-input').value, 'A');
  a.click('#word-hint');
  assert.ok(emojis.every(el => !el.hidden));
  for (const key of ['P','P','L','E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word'); a.click('#next');
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.ok(Array.from(a.w.document.querySelectorAll('.word-emoji')).every(el => el.hidden));
});

test('suggestions pronounce words without entering them; sentence playback preserves blank', async t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-word="APPLE"]');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.apple.file);
  assert.equal(a.spoken.length, 0);
  assert.equal(a.query('#word-input').value, '');
  for (const key of ['A','P','P','L','E']) a.click(`[data-key="${key}"]`);
  a.click('#hear-model');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an blank'].file);
  a.click('#check-word'); a.click('#hear-model');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an apple'].file);
});

test('wrong writing gives gentle feedback beside Enter, preserves the answer and respects mute', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  for (const key of ['C','A','T']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#answer-feedback').textContent, 'Whoops! Try again.');
  assert.equal(a.query('#check-word').parentElement, a.query('#word-input').parentElement, 'Enter sits beside the answer box');
  assert.equal(a.query('.typing-row').nextElementSibling, a.query('#answer-feedback'), 'feedback follows the input row');
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.query('#word-input').value, 'CAT');
  assert.equal(a.query('#word-input').getAttribute('aria-invalid'), 'true');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.plays.length, 0, 'Sound off must remain silent');
  a.click('[data-sound]'); a.click('#check-word');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['whoops! try again'].file);
  a.click('[data-key="Backspace"]');
  assert.equal(a.query('#answer-feedback').textContent, '');
  assert.equal(a.query('#word-input').hasAttribute('aria-invalid'), false);
  a.query('#word-input').value = 'APPLE';
  a.query('#word-input').dispatchEvent(new a.w.Event('input', { bubbles: true }));
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false, 'unlimited tries still permit success');
});

test('wrong counts, sums, patterns, letters and word order all offer another try', t => {
  const a = app(t);
  function wrongChoice(round, answer) {
    const wrong = Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(answer));
    assert.ok(wrong); wrong.click();
    assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
    assert.equal(a.store('garden-rounds')[round].done, false);
  }
  wrongChoice('count', 1);
  a.click('[data-mode="add"]'); wrongChoice('add', 2);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  a.click('[data-pad="1"]'); a.click('#check-sum');
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.store('garden-rounds').add.draft, '1');
  a.click('[data-mode="patterns"]'); wrongChoice('patterns', a.store('garden-rounds').patterns.answer);
  a.click('[data-mode="words"]'); a.click('[data-word-tab="letter"]');
  wrongChoice('letter', a.store('garden-rounds').letter.letter);
  a.click('[data-word-tab="order"]');
  const wrongTile = Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent !== 'NOOK');
  wrongTile.click();
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.store('garden-rounds').order.used.length, 0);
  assert.equal(a.plays.length, 0);
});

test('speech selects only local English voices, including when remote is the default', async t => {
  const a = app(t);
  a.voices.unshift({name:'Cloud child voice',lang:'en-GB',localService:false,default:true});
  await a.w.LP.audio.speak('Purple dinosaur');
  assert.equal(a.utterances.length, 1);
  assert.equal(a.utterances[0].voice.localService, true);
  assert.equal(a.utterances[0].voice.name, 'Hazel');
});

test('speech never falls back to a remote voice when local voices are unavailable', async t => {
  const a = app(t);
  a.voices.splice(0, a.voices.length, {name:'Cloud English',lang:'en-GB',localService:false});
  await a.w.LP.audio.speak('Purple dinosaur');
  assert.equal(a.spoken.length, 0);
  assert.match(a.query('#status').textContent, /offline English voice/);
});

test('a voice discovered after mute cannot start a queued phrase', async t => {
  const a = app(t);
  a.voices.length = 0;
  const pending = a.w.LP.audio.speak('Purple dinosaur');
  await Promise.resolve();
  await a.w.LP.audio.mute();
  a.voices.push({name:'Hazel',lang:'en-GB',localService:true});
  a.w.speechSynthesis.dispatchEvent(new a.w.Event('voiceschanged'));
  await pending;
  assert.deepEqual(a.spoken, []);
});

test('the bundled voice works without installed voices and reuses one player without preloading', async t => {
  const a = app(t);
  delete a.w.speechSynthesis;
  assert.equal(a.players.length, 0);
  await a.w.LP.audio.speak('APPLE');
  assert.equal(a.plays[0], a.w.LPVoiceLibrary.clips.apple.file);
  await a.w.LP.audio.speak(' The blank is big. ');
  assert.equal(a.plays[1], a.w.LPVoiceLibrary.clips['the blank is big'].file);
  assert.equal(a.players.length, 1);
  assert.equal(a.players[0].preload, 'none');
  assert.equal(a.spoken.length, 0);
  await a.w.LP.audio.mute();
  assert.equal(a.players[0].paused, true);
  assert.equal(a.players[0].src, '');
});

test('pause and changing the activity stop a playing clip, and old playback errors stay cancelled', async t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-word="APPLE"]');
  const error = a.players[0].onerror;
  a.w.LP.audio.pause();
  assert.equal(a.players[0].paused, true);
  a.w.LP.status('Still paused'); error();
  assert.equal(a.query('#status').textContent, 'Still paused');
  a.click('[data-word="APPLE"]'); a.click('[data-mode="count"]');
  assert.equal(a.players[0].paused, true);
  assert.equal(a.players[0].src, '');
});

test('restored writing appends at the caret instead of inserting before the draft', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'words', wordTab: 'sentence', indices: { sentence: 0 } },
    'lp-player-player-1-garden-rounds': { sentence: { text: 'Nook eats an APPLE.', draft: 'AP', done: false } }
  });
  const key = a.query('[data-key="P"]');
  key.dispatchEvent(new a.w.Event('pointerdown', { bubbles: true, cancelable: true }));
  key.click();
  assert.equal(a.query('#word-input').value, 'APP');
});

test('switching local players works during a visit even when storage is blocked', t => {
  const a = app(t, 'garden.html', {}, true);
  a.click('[data-mode="words"]'); a.click('[data-key="A"]');
  a.click('[data-player]'); a.query('#player-form [name="name"]').value = 'Guest two'; a.submit('#player-form');
  a.click('[data-mode="words"]'); a.click('[data-key="B"]');
  a.click('[data-player]'); a.w.document.querySelector('.player-list .saved-text').click();
  assert.equal(a.query('#word-input').value, 'A');
});

test('a typed number-word answer updates its result immediately', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('[data-mode="words"]'); a.click('[data-word-tab="numbers"]');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.ok(a.query('.number-model'));
  assert.match(a.query('.number-model').textContent, /ONE/);
});

test('changing completed typed answers removes stale success and permits checking again', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('[data-mode="words"]'); a.click('[data-word-tab="numbers"]');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  a.click('[data-mode="count"]'); a.click('[data-mode="words"]');
  a.click('[data-key="Backspace"]');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.query('.number-model'), null);
});

test('sentence tiles keep their positions as words are placed', t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-word-tab="order"]');
  const before = Array.from(a.w.document.querySelectorAll('[data-tile]'));
  const first = before.find(b => b.textContent === 'NOOK');
  first.click();
  const after = Array.from(a.w.document.querySelectorAll('[data-tile]'));
  assert.equal(after.length, before.length);
  assert.equal(after.find(b => b.dataset.tile === first.dataset.tile).disabled, true);
});

test('Count with me and direct taps count an apple only once and retain keyboard focus', t => {
  const a = app(t);
  const fruit = a.query('[data-fruit="0"]'); fruit.focus(); fruit.click();
  a.click('[data-fruit="0"]');
  assert.equal(a.store('garden-rounds').count.seen.length, 1);
  assert.equal(a.w.document.activeElement.dataset.fruit, '0');
});

test('an explicitly chosen number continues from that number within its level', t => {
  const a = app(t);
  a.click('#choose-puzzle');
  assert.equal(a.w.document.querySelectorAll('.puzzle-picker button').length, 5, 'level 1 offers 1 to 5');
  a.w.document.querySelectorAll('.level-picker button')[1].click();
  assert.equal(a.w.document.querySelectorAll('.puzzle-picker button').length, 10, 'level 2 offers 1 to 10');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '7').click();
  assert.equal(a.query('.lp-modal'), null);
  a.click('[data-choice="7"]'); a.click('#next');
  const seq = a.w.GardenLearning.countSequence(2);
  assert.equal(a.store('garden-rounds').count.target, seq[(seq.indexOf(7) + 1) % seq.length], 'Next continues from the chosen number in the mixed order');
  assert.equal(a.store('garden-rounds').count.level, 2);
});

test('a chosen sum continues to the next sum at the same level instead of jumping back', t => {
  const a = app(t);
  a.click('[data-mode="add"]'); a.click('#next'); a.click('#next');
  a.click('#support');
  const form = a.query('#pick-sum'); form.elements.a.value = '2'; form.elements.b.value = '2';
  a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /2 \+ 2 = \?/);
  a.click('[data-choice="4"]'); a.click('#next');
  const seq = a.w.GardenLearning.sumSequence(1, 'add'), after = seq[(seq.findIndex(([x, y]) => x === 2 && y === 2) + 1) % seq.length];
  assert.match(a.query('.equation').textContent, new RegExp(after[0] + ' \\+ ' + after[1] + ' = \\?'));
});

test('levels are separate per activity, the Next level action is explicit, and a level change keeps other drafts', t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-key="A"]');
  a.click('[data-mode="count"]');
  assert.equal(a.query('#next-level').hidden, true, 'no level action before the round is answered');
  a.click('[data-choice="1"]');
  assert.equal(a.query('#next-level').hidden, false);
  a.click('#next-level');
  assert.match(a.query('#support').textContent, /Level 2 of 6/);
  assert.equal(a.query('#next-level').hidden, true, 'a fresh round at the new level has not been answered yet');
  a.click('[data-mode="patterns"]'); a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[13].click(); a.click('[data-close]');
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.equal(a.query('#next').hidden, false);
  assert.equal(a.query('#next-level').hidden, true, 'the top level offers no further step');
  a.click('[data-mode="count"]');
  const position = a.store('garden-position');
  assert.deepEqual(position.levels, { count: 2, add: 1, numbers: 1, patterns: 14 });
  assert.match(a.query('#next-level').textContent, /Next level/);
  assert.equal(position.operation, 'add');
  a.click('[data-mode="add"]');
  assert.match(a.query('#support').textContent, /Level 1 of 6/);
  a.click('[data-mode="words"]');
  assert.equal(a.query('#word-input').value, 'A', 'changing the Count level never touches a Words draft');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, choices: 3 });
  assert.equal(a.query('#word-input').value, 'A', 'a choices change rebuilds Count, not Missing word');
  a.click('[data-mode="count"]');
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 3);
});

test('an older save with the shared 1 to 10 range and a pattern index restores onto explicit levels', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-little-patterns-v1': { range: 10 },
    'lp-player-player-1-garden-position': { mode: 'patterns', indices: { patterns: 12, count: L.countSequence(2).indexOf(7) } },
    'lp-player-player-1-garden-rounds': { count: { target: 7, seen: [0, 1], done: false } }
  });
  assert.match(a.query('#support').textContent, /Level 5 of 14/);
  a.click('[data-mode="count"]');
  assert.match(a.query('#support').textContent, /Level 2 of 6/);
  assert.equal(a.store('garden-rounds').count.target, 7);
  assert.deepEqual(a.store('garden-rounds').count.seen, [0, 1]);
});

test('muting cancels a voice request even before its async start finishes', async t => {
  const a = app(t);
  const pending = a.w.LP.audio.speak('hello');
  a.w.LP.audio.mute();
  await pending;
  assert.deepEqual(a.spoken, []);
});

test('restored addition demonstration shows its answer regardless of an older incomplete round', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-little-patterns-v1': { addition: 'demo' },
    'lp-player-player-1-garden-position': { mode: 'add', indices: { add: 0 } },
    'lp-player-player-1-garden-rounds': { add: { a: 1, b: 1, done: false } }
  });
  assert.match(a.query('.equation').textContent, /1 \+ 1 = 2/);
  assert.equal(a.query('#next').hidden, false);
});

test('block profiles restore a paused board and preserve undo arithmetic', t => {
  const a = app(t, 'blocks.html');
  a.click('[data-action="place"]');
  assert.equal(a.query('#undo').disabled, false);
  a.click('[data-player]');
  a.query('#player-form [name="name"]').value = 'Block builder two'; a.submit('#player-form');
  assert.equal(a.query('#undo').disabled, true);
  a.click('[data-player]'); a.w.document.querySelector('.player-list .saved-text').click();
  assert.equal(a.query('#overlay').hidden, false);
  assert.equal(a.query('#undo').disabled, false);
});

test('invalid saved block history is discarded without breaking the playable board', t => {
  const { Blocks } = require('../public/fireworks/little-patterns/core.js');
  const game = new Blocks(() => .5);
  game.place();
  game.previous.active.y = 19;
  game.previous.active.matrix = [[1], [1], [1], [1]];
  game.previous.active.id = 0;
  const a = app(t, 'blocks.html', { 'lp-player-player-1-blocks-board': game });
  assert.equal(a.query('#undo').disabled, true);
  a.click('#resume'); a.click('[data-action="place"]');
  assert.equal(a.query('#undo').disabled, false);
});

test('removing the active player clears their local drafts and starts another player safely', async t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-key="A"]');
  a.click('[data-player]'); a.click('[aria-label="Delete Player 1 from this device"]');
  a.click('#confirm-action');
  await Promise.resolve();
  assert.notEqual(a.w.LP.player.id, 'player-1');
  assert.equal(a.w.localStorage.getItem('lp-player-player-1-garden-rounds'), null);
  a.click('[data-close]'); a.click('[data-mode="words"]');
  assert.equal(a.query('#word-input').value, '');
});

test('saved rounds restore by puzzle id: a matching id keeps its state, a mismatched one starts that activity fresh only', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'count', indices: { count: L.countSequence(1).indexOf(3), sentence: 0 }, levels: { count: 1, add: 2 } },
    'lp-player-player-1-garden-rounds': {
      count: { id: 'count:v2:L1:count:3', target: 3, seen: [0], done: false },
      add: { id: 'add:v2:L1:add:1+1', a: 1, b: 1, draft: '5', done: false },
      sentence: { id: 'sentence:v2:L1:gap:Nook eats an APPLE.', text: 'Nook eats an APPLE.', draft: 'APP', done: false }
    }
  });
  assert.deepEqual(a.store('garden-rounds').count.seen, [0], 'same id, state kept');
  assert.equal(a.store('garden-rounds').add.draft, '', 'the saved add belonged to level 1; level 2 starts fresh');
  assert.equal(a.store('garden-rounds').add.id, 'add:v2:L2:add:1+1');
  a.click('[data-mode="words"]');
  assert.equal(a.query('#word-input').value, 'APP', 'other activities are untouched');
});

test('every correct answer goes through one path: bubble and announcement come from round state, audio only when sound is already on', async t => {
  const a = app(t);
  const L = a.w.GardenLearning, line = (kind, round) => L.successLine(kind, round).text;
  a.click('[data-choice="1"]');
  assert.equal(a.query('#speech').textContent, line('count', a.store('garden-rounds').count));
  assert.match(a.query('#speech').textContent, /1 apple\./);
  assert.equal(a.query('#status').textContent, a.query('#speech').textContent);
  assert.ok(a.query('#speech').classList.contains('success'));
  assert.equal(a.plays.length, 0); assert.equal(a.spoken.length, 0);
  a.click('#next');
  assert.equal(a.query('#speech').textContent, 'Apples for our picnic!', 'a fresh round shows the prompt again');
  assert.ok(!a.query('#speech').classList.contains('success'));
  a.click('[data-sound]');
  a.click(`[data-choice="${a.store('garden-rounds').count.target}"]`);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.spoken.length, 0, 'automatic feedback never falls back to a device voice');
  const speech = L.successLine('count', a.store('garden-rounds').count).speech;
  assert.equal(a.plays.length, 1, 'encouragement plays once, from the answering tap');
  assert.equal(a.plays[0], a.w.LPVoiceLibrary.clips[speech[0].toLowerCase().replace(/[.!?]+$/, '')].file);
  a.players[0].onended();
  assert.equal(a.plays[1], a.w.LPVoiceLibrary.clips[speech[1].toLowerCase().replace(/[.!?]+$/, '')].file);
  a.click('[data-mode="add"]');
  const wrong = Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== '2');
  wrong.click();
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.store('garden-rounds').add.feedback, 'retry');
  a.click('[data-choice="2"]');
  assert.equal(a.query('#speech').textContent, line('add', a.store('garden-rounds').add));
  assert.match(a.query('#speech').textContent, /1 \+ 1 = 2\./);
  assert.equal(a.store('garden-rounds').add.feedback, '');
  a.click('[data-mode="words"]'); a.click('[data-word-tab="order"]');
  const words = a.store('garden-rounds').order.words;
  for (const word of words) Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === word && !b.disabled).click();
  assert.equal(a.query('#speech').textContent, line('order', a.store('garden-rounds').order));
  assert.equal(a.query('#next').hidden, false);
});

test('a restored finished round shows its success line without replaying anything', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'count', indices: { count: L.countSequence(1).indexOf(3) }, levels: { count: 1 } },
    'lp-player-player-1-garden-rounds': { count: { id: 'count:v2:L1:count:3', target: 3, seen: [], done: true, feedback: 'retry' } }
  });
  assert.match(a.query('#speech').textContent, /3 apples\./);
  assert.equal(a.query('#next').hidden, false);
  assert.equal(a.plays.length, 0);
});

test('automatic speech plays only bundled clips while sound is on, and chained clips play in order from one player', async t => {
  const a = app(t);
  await a.w.LP.audio.speak('apple', { auto: true });
  assert.equal(a.plays.length, 0, 'sound off stays silent');
  assert.equal(a.w.LP.audio.muted, true, 'automatic speech never unmutes');
  a.click('[data-sound]');
  await a.w.LP.audio.speak('Purple dinosaur', { auto: true });
  assert.equal(a.spoken.length, 0, 'no device voice for automatic lines');
  await a.w.LP.audio.speak(['APPLE', 'sun.'], { auto: true });
  assert.equal(a.plays.length, 1);
  assert.equal(a.plays[0], a.w.LPVoiceLibrary.clips.apple.file);
  a.players[0].onended();
  assert.equal(a.plays[1], a.w.LPVoiceLibrary.clips.sun.file);
  assert.equal(a.players.length, 1);
  await a.w.LP.audio.speak(['apple', 'not in the library']);
  assert.equal(a.spoken.at(-1), 'apple not in the library', 'a tapped request still falls back to the local voice as one phrase');
});

test('success is announced once: the completed model stays, no duplicate result line is drawn', t => {
  const a = app(t);
  a.click('[data-choice="1"]');
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('#task .number-total').textContent, '1', 'the numeral stays beside the tray');
  assert.equal(a.query('#status').textContent, a.query('#speech').textContent, 'one live announcement of the same line');
  a.click('[data-mode="add"]'); a.click('[data-choice="2"]');
  assert.equal(a.query('.result-note'), null);
  assert.match(a.query('.equation').textContent, /1 \+ 1 = 2/);
  assert.equal(a.query('.sum-result strong').textContent, '2');
  a.click('[data-mode="patterns"]');
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('.bead-slot.missing'), null, 'the bead fills the gap');
  a.click('[data-mode="words"]'); a.click('[data-word-tab="letter"]');
  a.click(`[data-choice="${a.store('garden-rounds').letter.letter}"]`);
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('.letter-tile.gap'), null);
  assert.ok(a.query('.letter-tile.filled'));
  a.click('[data-mode="count"]');
  assert.equal(a.query('#status').textContent, 'Again, or the next picnic.', 'a re-render carries an instruction, not the announcement again');
});

test('a wrong answer gives one neutral line in the bubble and one hint in the status, never a repeated "try again"', t => {
  const a = app(t);
  const wrong = () => Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(a.store('garden-rounds')[a.store('garden-position').mode === 'words' ? a.store('garden-position').wordTab : a.store('garden-position').mode].target)).click();
  wrong();
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.query('#status').textContent, 'Look at the apples and count them.');
  a.click('[data-mode="words"]');
  for (const key of ['C', 'A', 'T']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#answer-feedback').textContent, 'Whoops! Try again.');
  assert.equal(a.query('#status').textContent, 'Look at the picture. Which word fits?');
  assert.ok(!/try/i.test(a.query('#status').textContent));
});

test('Give me a clue scaffolds first and outlines the answer second, silently, in every activity', t => {
  const a = app(t);
  a.click('[data-mode="add"]');
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.sum-result .count-tag').length, 2, 'first tap numbers the joined apples');
  assert.equal(a.query('.choice.hint'), null);
  assert.equal(a.store('garden-rounds').add.hint, 1);
  a.click('#help');
  assert.ok(a.query('[data-choice="2"].hint'), 'second tap outlines the answer');
  a.click('[data-mode="patterns"]');
  const round = a.store('garden-rounds').patterns;
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.bead-slot.emphasis').length, round.unit.length);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query(`[data-choice="${round.answer}"].hint`));
  a.click('[data-mode="words"]'); a.click('[data-word-tab="letter"]');
  a.click('#help');
  assert.match(a.query('#status').textContent, /The word is APPLE/);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query(`[data-choice="${a.store('garden-rounds').letter.letter}"].hint`));
  a.click('[data-word-tab="order"]');
  a.click('#help');
  assert.match(a.query('#status').textContent, /The sentence is: nook eats an apple\./);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query('.choice.hint'));
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'choose' });
  a.click('[data-word-tab="numbers"]');
  a.click('#help');
  assert.match(a.query('#status').textContent, /starts with O and has 3 letters/);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query('[data-choice="ONE"].hint'));
  assert.equal(a.plays.length, 0); assert.equal(a.spoken.length, 0);
});

test('the Words answer box is a single line at a stable width with Enter and the keyboard toggle on its row', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  const input = a.query('#word-input');
  assert.equal(input.tagName, 'INPUT');
  assert.equal(input.getAttribute('type'), 'text');
  assert.equal(input.getAttribute('maxlength'), '40');
  assert.equal(input.hasAttribute('readonly'), true, 'A to Z keys feed the box without the device keyboard');
  assert.deepEqual(Array.from(a.query('.typing-row').children).map(el => el.id), ['word-input', 'check-word', 'keyboard-toggle']);
  assert.equal(a.query('.typing-actions'), null);
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  assert.equal(input.value, 'APPLE');
  a.click('#keyboard-toggle');
  assert.equal(a.query('#word-input').hasAttribute('readonly'), false);
  assert.equal(a.query('.keyboard'), null);
  assert.equal(a.query('#word-input').value, 'APPLE', 'switching keyboards keeps the draft');
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('[data-word-tab="numbers"]');
  assert.equal(a.query('#word-input').tagName, 'INPUT');
});

test('sound buttons name the state, Nook wears a short name tag, and the block controls read as names', t => {
  const a = app(t);
  assert.equal(a.query('[data-sound]').textContent, '♪ Sound: off');
  a.click('[data-sound]');
  assert.equal(a.query('[data-sound]').textContent, '♪ Sound: on');
  assert.equal(a.query('[data-sound]').getAttribute('aria-pressed'), 'true');
  assert.equal(a.query('.name-tag').textContent, 'NOOK');
  const b = app(t, 'blocks.html');
  assert.equal(b.query('[data-sound]').textContent, '♪ Sound: off');
  const down = b.query('[data-action="down"]');
  assert.equal(down.childNodes[1].textContent, 'Down');
  assert.equal(down.querySelector('small').textContent, 'hold');
  assert.match(down.getAttribute('aria-label'), /Hold to move faster/);
  const css = fs.readFileSync(path.join(root, 'blocks-live.css'), 'utf8');
  assert.match(css, /\.overlay \.primary\{flex:0 0 auto/, 'Keep playing no longer inherits flex:1 inside the vertical overlay');
});

test('on wide layouts the bubble is ordered below Nook, beside the response area, without moving the companion block', t => {
  const css = fs.readFileSync(path.join(root, 'garden-live.css'), 'utf8');
  const wide = css.slice(css.indexOf('@media(min-width:551px)'));
  assert.match(wide, /\.companion \.speech\{order:3/);
  assert.match(wide, /\.companion img\{order:1/);
  assert.match(wide, /\.companion\{align-self:end/);
  const html = fs.readFileSync(path.join(root, 'garden.html'), 'utf8');
  assert.ok(html.indexOf('<aside class="companion">') < html.indexOf('<section class="activity"'), 'the companion block itself stays where it was');
});

test('take away lives inside Add: a separate basket area, the same answer modes, its own place, and restore by id', t => {
  const a = app(t);
  a.click('[data-mode="add"]');
  assert.equal(a.query('[data-operation="add"]').getAttribute('aria-pressed'), 'true');
  a.click('#next');
  const L = a.w.GardenLearning, eq = (op, i) => { const [x, y] = L.sumSequence(1, op)[i]; return new RegExp(x + ' ' + (op === 'take' ? '−' : '\\+') + ' ' + y + ' = \\?'); };
  assert.match(a.query('.equation').textContent, eq('add', 1));
  a.click('[data-operation="take"]');
  assert.equal(a.store('garden-position').operation, 'take');
  assert.match(a.query('.equation').textContent, /1 − 1 = \?/);
  assert.equal(a.query('.take-result .number-group.taken .apple') !== null, true, 'the taken apple sits in the basket area');
  assert.equal(a.query('.take-result .number-group.left .apple'), null, 'nothing is left');
  assert.equal(a.query('.take-result .number-group.left .none').textContent, 'none');
  assert.ok(a.query('.number-group.taken img.symbol').getAttribute('src').endsWith('basket.svg'));
  assert.equal(a.query('#speech').textContent, 'Nook eats them all. How many are left?');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).some(b => b.dataset.choice === '0'), 'zero is a choice');
  a.click('[data-choice="0"]');
  assert.match(a.query('#speech').textContent, /1 − 1 = 0\./);
  a.click('#next');
  const second = L.sumSequence(1, 'take')[1];
  assert.match(a.query('.equation').textContent, eq('take', 1));
  assert.equal(a.w.document.querySelectorAll('.take-result .number-group.left .apple').length, second[0] - second[1]);
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.number-group.left .count-tag').length, second[0] - second[1], 'the clue numbers what is left, never the basket');
  a.click('[data-operation="add"]');
  assert.match(a.query('.equation').textContent, eq('add', 1), 'switching back returns to the same sum');
  a.click('[data-operation="take"]');
  assert.match(a.query('.equation').textContent, eq('take', 1), 'take away kept its own place');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  for (const d of String(second[0] - second[1])) a.click(`[data-pad="${d}"]`);
  a.click('#check-sum');
  assert.match(a.query('#speech').textContent, new RegExp(second[0] + ' − ' + second[1] + ' = ' + (second[0] - second[1]) + '\\.'));
  a.click('#support');
  assert.equal(a.query('.operation-picker [data-close]'), null);
  assert.equal(a.w.document.querySelector('.operation-picker button[aria-pressed="true"]').textContent, 'Take away');
  const form = a.query('#pick-sum'); form.elements.a.value = '4'; form.elements.b.value = '5';
  a.submit('#pick-sum');
  assert.match(a.query('#sum-error').textContent, /cannot take more/);
  form.elements.b.value = '2'; a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /4 − 2 = \?/);
  assert.equal(a.store('garden-rounds').add.id, 'add:v2:L1:take:4-2');
  const b = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'add', operation: 'take', levels: { add: 1 }, indices: { take: L.sumSequence(1, 'take').findIndex(([x, y]) => x === 2 && y === 1) } },
    'lp-player-player-1-garden-rounds': { add: { id: 'add:v2:L1:take:2-1', a: 2, b: 1, draft: '', hint: 1, done: false } }
  });
  assert.match(b.query('.equation').textContent, /2 − 1 = \?/);
  assert.equal(b.w.document.querySelectorAll('.number-group.left .count-tag').length, 1, 'the clue step came back with the round');
});

test('Add levels 3 to 5 draw tens-and-ones trays: full ten-frames first, sticks of ten at level 5, and a three-digit keypad', t => {
  const a = app(t);
  a.click('[data-mode="add"]'); a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  assert.match(levels[2].textContent, /no crossing ten/);
  levels[2].click(); a.click('[data-close]');
  assert.match(a.query('#support').textContent, /Level 3 of 6/);
  assert.match(a.query('.equation').textContent, /10 \+ 1 = \?/);
  assert.equal(a.w.document.querySelectorAll('.sum-build .tray').length, 2);
  assert.equal(a.w.document.querySelectorAll('.sum-build .number-group:first-child .five-frame.ten .pocket.full').length, 10, 'ten is a visible full ten-frame');
  assert.equal(a.query('.stick'), null, 'no sticks before level 5');
  const result = a.query('.sum-result .tray');
  assert.equal(result.querySelectorAll('.pocket.full').length, 11);
  assert.equal(result.querySelectorAll('.fruit.new').length, 1, 'the joined apple is outlined, not transformed');
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.sum-result .count-tag').length, 11, 'the first clue numbers every apple in the joined group');
  a.click('[data-choice="11"]');
  assert.match(a.query('#speech').textContent, /10 \+ 1 = 11\./);
  a.click('#next-level'); a.click('#next-level');
  assert.match(a.query('#support').textContent, /Level 5 of 6/);
  assert.match(a.query('.equation').textContent, /10 \+ 10 = \?/);
  assert.equal(a.w.document.querySelectorAll('.sum-build .stick').length, 2);
  assert.equal(a.w.document.querySelectorAll('.sum-result .stick').length, 2);
  assert.equal(a.w.document.querySelectorAll('.sum-result .stick.new').length, 1);
  assert.equal(a.w.document.querySelectorAll('.sum-result .stick i').length, 20, 'every stick shows ten dots');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => Number(b.dataset.choice) % 10 === 0));
  a.click('[data-operation="take"]');
  assert.match(a.query('.equation').textContent, /10 − 10 = \?/);
  assert.equal(a.w.document.querySelectorAll('.take-result .taken .stick').length, 1);
  assert.equal(a.query('.take-result .left .none').textContent, 'none');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  a.click('#support');
  const form = a.query('#pick-sum'); form.elements.a.value = '100'; form.elements.b.value = '0';
  assert.equal(form.elements.b.querySelector('option[value="0"]'), null, 'tens level takes at least ten');
  form.elements.b.value = '10'; a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /100 − 10 = \?/);
  for (const key of ['9', '0', '0']) a.click(`[data-pad="${key}"]`);
  assert.equal(a.query('.equation .typed').textContent, '900');
  a.click('[data-pad="Backspace"]'); a.click('[data-pad="Backspace"]'); a.click('[data-pad="Backspace"]');
  for (const key of ['1', '0', '0']) a.click(`[data-pad="${key}"]`);
  assert.equal(a.query('.equation .typed').textContent, '100', 'the keypad accepts three digits');
  a.click('[data-pad="Backspace"]'); a.click('[data-pad="Backspace"]'); a.click('[data-pad="Backspace"]');
  for (const key of ['9', '0']) a.click(`[data-pad="${key}"]`);
  a.click('#check-sum');
  assert.match(a.query('#speech').textContent, /100 − 10 = 90\./);
  assert.match(a.query('.equation').textContent, /100 − 10 = 90/, 'the completed equation stays on screen');
});

test('the Add picker offers Doubles and Make ten; Next cycles inside the set and a level choice leaves it', t => {
  const a = app(t);
  a.click('[data-mode="add"]'); a.click('[data-operation="take"]'); a.click('#support');
  const sets = a.w.document.querySelectorAll('.set-picker button');
  assert.equal(sets.length, 2);
  assert.match(sets[0].textContent, /Doubles/); assert.match(sets[1].textContent, /Make ten/);
  sets[0].click();
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.store('garden-position').operation, 'add', 'sets are addition');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/);
  assert.match(a.query('#support').textContent, /Doubles · 1 of 5/);
  assert.equal(a.query('#next-level').hidden, true);
  a.click('[data-choice="2"]'); a.click('#next');
  assert.match(a.query('.equation').textContent, /2 \+ 2 = \?/);
  assert.match(a.query('#support').textContent, /Doubles · 2 of 5/);
  for (let i = 0; i < 3; i++) { a.click('#next'); }
  assert.match(a.query('.equation').textContent, /5 \+ 5 = \?/, 'the set includes 5 + 5 even though the level is 1');
  a.click('#next');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/, 'the set wraps');
  assert.deepEqual(a.store('garden-position').selection.addSet, { set: 'doubles', index: 0 });
  a.click('#support');
  a.w.document.querySelectorAll('.set-picker button')[1].click();
  assert.match(a.query('.equation').textContent, /9 \+ 1 = \?/);
  a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[0].click(); a.click('[data-close]');
  assert.equal(a.store('garden-position').selection.addSet, undefined, 'choosing a level leaves the set');
  assert.match(a.query('#support').textContent, /Level 1 of 6 · Add/);
  const b = app(t, 'garden.html', { 'lp-player-player-1-garden-position': { mode: 'add', operation: 'take', selection: { addSet: { set: 'ten', index: 3 } } } });
  assert.match(b.query('.equation').textContent, /6 \+ 4 = \?/, 'a saved set restores at its place');
});

test('Count levels 3 to 6: a full ten-frame first, then sticks; Count with me counts tens then ones with spoken running totals; the keypad is optional', async t => {
  const a = app(t);
  a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  levels[2].click();
  assert.equal(a.w.document.querySelectorAll('.puzzle-picker button').length, 10, 'level 3 offers 11 to 20');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '13').click();
  assert.match(a.query('#support').textContent, /Level 3 of 6/);
  assert.ok(a.query('.tray.counting'));
  assert.equal(a.w.document.querySelectorAll('button.five-frame.ten[data-stick]').length, 1, 'the ten is one tappable full frame');
  assert.equal(a.query('button.five-frame.ten').querySelectorAll('.pocket.full').length, 10);
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 3);
  assert.equal(a.query('.stick'), null, 'no sticks until a level has established the ten');
  a.click('[data-sound]');
  a.click('#help');
  assert.equal(a.query('button.five-frame.ten .count-tag').textContent, '10', 'Count with me counts the ten first');
  assert.equal(a.query('#status').textContent, '10 counted.');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.ten.file);
  a.click('#help');
  assert.equal(a.query('button.pocket.counted .count-tag').textContent, '11');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.eleven.file);
  a.click('button.five-frame.ten');
  assert.deepEqual(a.store('garden-rounds').count.seen, ['t0', 'o0'], 'each group counts once');
  a.click('#help'); a.click('#help');
  assert.equal(a.query('#status').textContent, '13 apples altogether.');
  a.click('#help');
  assert.ok(a.query('[data-choice="13"].hint'));
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => Number(b.dataset.choice) >= 11 && Number(b.dataset.choice) <= 20), 'numeral choices remain at every level');
  a.click('[data-choice="13"]');
  assert.match(a.query('#speech').textContent, /13 apples\./);
  a.click('#next-level');
  assert.match(a.query('#support').textContent, /Level 4 of 6/);
  assert.ok(a.w.document.querySelectorAll('button.stick').length >= 1, 'tens to 50 are sticks');
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 0, 'nothing loose at level 4');
  a.click('#help');
  assert.equal(a.query('button.stick.counted .count-tag').textContent, '10');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, countAnswer: 'type' });
  a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[5].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '73').click();
  assert.equal(a.w.document.querySelectorAll('button.stick').length, 7);
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 3);
  assert.ok(a.query('#check-sum'), 'the keypad is available at any level');
  for (const key of ['7', '3']) a.click(`[data-pad="${key}"]`);
  assert.equal(a.query('.count-answer .typed').textContent, '73');
  a.click('#check-sum');
  assert.match(a.query('#speech').textContent, /73 apples\./);
  a.click('[data-mode="add"]'); a.click('[data-mode="count"]');
  assert.match(a.query('#speech').textContent, /73 apples\./);
  const b = app(t, 'garden.html', {
    'lp-player-player-1-little-patterns-v1': { countAnswer: 'type' },
    'lp-player-player-1-garden-position': { mode: 'count', levels: { count: 6 }, selection: { count: 100 } },
    'lp-player-player-1-garden-rounds': { count: { id: 'count:v2:L6:count:100', target: 100, seen: ['t0', 't1', 't9', 'o0', 'x1', 3], draft: '10', done: false } }
  });
  assert.equal(b.w.document.querySelectorAll('button.stick').length, 10, 'one hundred is ten sticks, never a hundred apples');
  assert.deepEqual(b.store('garden-rounds').count.seen, ['t0', 't1', 't9'], 'only valid tokens restore');
  assert.equal(b.query('.count-answer .typed').textContent, '10');
  b.click('[data-pad="0"]'); b.click('#check-sum');
  assert.match(b.query('#speech').textContent, /100 apples\./);
  b.click('[data-mode="count"]');
  assert.equal(b.query('#next').hidden, false);
});

test('later passes through a small level arrange the same quantity differently and still count correctly', t => {
  const a = app(t);
  for (let i = 0; i < 5; i++) a.click('#next');
  const round = a.store('garden-rounds').count;
  assert.equal(round.target, 1, 'the second pass starts again at one');
  assert.deepEqual(round.slots, [0]);
  for (let i = 0; i < 6; i++) a.click('#next');
  const spread = a.store('garden-rounds').count;
  assert.equal(spread.level, 1);
  assert.deepEqual(spread.slots, L.arrangement(spread.target, 2), 'third pass fills from the right');
  const pockets = Array.from(a.w.document.querySelectorAll('.five-frame .pocket'));
  assert.equal(pockets.length, 5);
  assert.equal(pockets.filter(p => p.classList.contains('full')).length, spread.target);
  assert.ok(pockets[4].classList.contains('full'), 'the last pocket is used first');
  a.click('#help');
  assert.equal(a.query('.pocket.counted .count-tag').textContent, '1');
  a.click('#help');
  assert.equal(a.store('garden-rounds').count.seen.length, Math.min(2, spread.target));
});

test('Number words to one hundred reuse the tray and can be chosen or typed', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'choose', choices: 3 });
  a.click('[data-mode="words"]'); a.click('[data-word-tab="numbers"]'); a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 4);
  levels[3].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '100').click();
  assert.match(a.query('#support').textContent, /Level 4 of 4/);
  assert.equal(a.w.document.querySelectorAll('.tray .stick').length, 10, 'one hundred is ten sticks');
  assert.equal(a.query('.tray').getAttribute('role'), 'img');
  assert.equal(a.query('.number-total').textContent, '100');
  assert.ok(a.query('[data-choice="ONE HUNDRED"]'));
  a.click('[data-choice="ONE HUNDRED"]');
  assert.match(a.query('#speech').textContent, /ONE HUNDRED\./);
  assert.match(a.query('.number-model').textContent, /ONE HUNDRED/);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[2].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '13').click();
  assert.equal(a.w.document.querySelectorAll('.tray .five-frame.ten').length, 2, 'a teen is a full ten-frame plus a second frame');
  assert.equal(a.query('.stick'), null);
  assert.match(a.query('#support').textContent, /Level 3 of 4/);
  for (const key of ['T', 'H', 'I', 'R', 'T', 'E', 'E', 'N']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.match(a.query('#speech').textContent, /THIRTEEN\./);
  a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[3].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '100').click();
  for (const key of ['O', 'N', 'E', 'Space', 'H', 'U', 'N', 'D', 'R', 'E', 'D']) a.click(`[data-key="${key}"]`);
  assert.equal(a.query('#word-input').value, 'ONE HUNDRED');
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
});

test('two-gap patterns: gaps are buttons, the chosen gap takes the piece, partial fills are kept, and the last piece finishes', t => {
  const a = app(t);
  a.click('[data-mode="patterns"]'); a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[7].click(); a.click('[data-close]');
  assert.match(a.query('#support').textContent, /Level 8 of 14/);
  assert.equal(a.query('.repeat-label'), null, 'from level 8 the unit is not spelt out');
  const round = a.store('garden-rounds').patterns;
  const gaps = a.w.document.querySelectorAll('button[data-gap]');
  assert.equal(gaps.length, 2);
  assert.equal(a.query('button[data-gap].active').dataset.gap, String(round.gaps[0]));
  gaps[1].click();
  assert.equal(a.query('button[data-gap].active').dataset.gap, String(round.gaps[1]));
  assert.equal(a.store('garden-rounds').patterns.selected, round.gaps[1]);
  const wrong = Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== round.sequence[round.gaps[1]]);
  if (wrong) { wrong.click(); assert.equal(a.query('#speech').textContent, 'Whoops! Try again.'); }
  a.click(`[data-choice="${round.sequence[round.gaps[1]]}"]`);
  assert.equal(a.query('#next').hidden, true, 'one gap left');
  assert.match(a.query('#status').textContent, /1 of 2 beads placed/);
  assert.deepEqual(a.store('garden-rounds').patterns.filled, { [round.gaps[1]]: round.sequence[round.gaps[1]] });
  assert.equal(a.w.document.querySelectorAll('.bead-slot.filled').length, 1);
  assert.equal(a.query('button[data-gap].active').dataset.gap, String(round.gaps[0]), 'the remaining gap is active');
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.bead-slot.emphasis').length, 2, 'the clue outlines the repeating group');
  a.click('#help');
  assert.ok(a.query(`[data-choice="${round.sequence[round.gaps[0]]}"].hint`));
  a.click(`[data-choice="${round.sequence[round.gaps[0]]}"]`);
  assert.equal(a.query('#next').hidden, false);
  assert.equal(a.query('button[data-gap]'), null);
  assert.match(a.query('#speech').textContent, /The pattern fits\./);
  const b = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'patterns', levels: { patterns: 8 }, indices: { patterns: 0 } },
    'lp-player-player-1-garden-rounds': { patterns: { id: round.id, sequence: round.sequence, gaps: round.gaps, filled: { [round.gaps[0]]: round.sequence[round.gaps[0]], [round.gaps[1]]: 'nonsense' }, selected: 99, done: false } }
  });
  assert.deepEqual(b.store('garden-rounds').patterns.filled, { [round.gaps[0]]: round.sequence[round.gaps[0]] }, 'only correct fills restore');
  assert.equal(b.query('button[data-gap].active').dataset.gap, String(round.gaps[1]));
});

test('growing, mirror and number patterns are named rules with their own hints, clues and answers; ten beads keep reading order', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, choices: 3 });
  a.click('[data-mode="patterns"]'); a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.match(levels[11].getAttribute('aria-label'), /Growing pattern/);
  assert.match(levels[12].getAttribute('aria-label'), /Mirror pattern/);
  assert.match(levels[13].getAttribute('aria-label'), /Number pattern/);
  assert.ok(levels[9].querySelector('.shape.oval'), 'the picker shows the fifth shape');
  levels[9].click(); a.click('[data-close]');
  assert.ok(a.query('.pattern-strip.long'));
  assert.equal(a.w.document.querySelectorAll('.bead-slot').length, 10);
  assert.equal(a.w.document.querySelectorAll('.bead-index').length, 10, 'position numbers keep the reading order of a wrapped string');
  assert.ok(a.query('.shape.oval'));
  a.click('#support'); a.w.document.querySelectorAll('.level-picker button')[11].click(); a.click('[data-close]');
  assert.match(a.query('#support').textContent, /Growing pattern/);
  assert.equal(a.query('#activity-title').textContent, 'The pattern grows');
  assert.equal(a.query('.repeat-label').textContent, 'Each group has one more bead.');
  assert.equal(a.w.document.querySelectorAll('.bead-group').length, 4);
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.bead-group')).map(g => g.querySelectorAll('.bead-slot').length), [1, 2, 3, 4]);
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.bead-group.emphasis').length, 4);
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.match(a.query('#speech').textContent, /The pattern fits\./);
  a.click('#support'); a.w.document.querySelectorAll('.level-picker button')[12].click(); a.click('[data-close]');
  assert.equal(a.query('#activity-title').textContent, 'The pattern turns around');
  assert.ok(a.query('.mirror-line'));
  const mirror = a.store('garden-rounds').patterns;
  a.click('#help');
  const twin = a.w.document.querySelectorAll('.bead-slot')[mirror.sequence.length - 1 - mirror.gaps[0]];
  assert.ok(twin.classList.contains('emphasis'), 'the clue outlines the mirrored bead');
  a.click(`[data-choice="${mirror.answer}"]`);
  assert.equal(a.query('#next').hidden, false);
  a.click('#support'); a.w.document.querySelectorAll('.level-picker button')[13].click(); a.click('[data-close]');
  assert.equal(a.query('#activity-title').textContent, 'What number comes next?');
  const number = a.store('garden-rounds').patterns;
  assert.match(a.query('.repeat-label').textContent, /^Count on in (ones|twos|fives|tens)\.$/);
  assert.equal(a.w.document.querySelectorAll('.bead-slot.number').length, 5);
  assert.equal(a.w.document.querySelectorAll('.shape').length, 0, 'number beads carry numerals, not shapes');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => /^\d+$/.test(b.dataset.choice)));
  a.click('#help');
  assert.match(a.query('#status').textContent, /Count on in/);
  a.click(`[data-choice="${number.answer}"]`);
  assert.match(a.query('#speech').textContent, /The pattern fits\./);
  assert.equal(a.query('#next-level').hidden, true, 'level 14 is the top');
});

test('the missing part level shows the joined group with the hidden part outlined and asks how many joined', t => {
  const a = app(t);
  a.click('[data-mode="add"]'); a.click('#support');
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  assert.match(levels[5].textContent, /missing part/);
  levels[5].click(); a.click('[data-close]');
  const r = a.store('garden-rounds').add;
  assert.equal(r.missing, true);
  assert.match(a.query('#support').textContent, /Level 6 of 6 · Add/);
  assert.equal(a.query('#activity-title').textContent, `Two groups make ${r.total}. How many joined?`);
  assert.equal(a.query('.number-group.missing-part strong').textContent, '?');
  assert.match(a.query('.equation').textContent, new RegExp(`${r.a} \\+ \\? = ${r.total}`));
  assert.equal(a.w.document.querySelectorAll('.sum-result .new-fruit .apple').length, r.b, 'the joined apples are outlined');
  assert.equal(a.w.document.querySelectorAll('.sum-result .apple').length, r.total);
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.sum-result .count-tag').length, r.b, 'the first clue numbers only the outlined apples');
  a.click('#help');
  assert.ok(a.query(`[data-choice="${r.b}"].hint`));
  a.click(`[data-choice="${r.b}"]`);
  assert.match(a.query('.equation').textContent, new RegExp(`${r.a} \\+ ${r.b} = ${r.total}`), 'the completed equation stays');
  assert.match(a.query('#speech').textContent, new RegExp(`${r.a} \\+ ${r.b} = ${r.total}\\.`));
  assert.equal(a.query('#next-level').hidden, true);
  a.click('[data-operation="take"]');
  assert.match(a.query('#support').textContent, /Level 5 of 5 · Take away/, 'take away has no missing-part level');
  a.click('#support');
  assert.equal(a.w.document.querySelectorAll('.level-picker button').length, 5);
});
