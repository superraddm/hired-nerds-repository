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
  for (const script of dom.window.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(root, script.getAttribute('src').split('?')[0]), 'utf8'));
  t.after(async () => { await new Promise(resolve => setTimeout(resolve, 10)); assert.deepEqual(errors, [], 'no uncaught page errors'); dom.window.close(); });
  const query = selector => w.document.querySelector(selector);
  const click = selector => { const target = query(selector); assert.ok(target, selector); target.click(); return target; };
  const store = key => JSON.parse(w.localStorage.getItem(`lp-player-${w.LP.player.id}-${key}`));
  const submit = selector => query(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  return { w, query, click, store, submit, spoken, utterances, voices, plays, players };
}

// The Words sub-activities live in the picker: open it from the pill, choose one, close it.
const wordTab = (a, id) => { a.click('#support'); a.click(`.lp-modal [data-word-tab="${id}"]`); a.click('[data-close]'); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

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

test('Give me a clue on Missing word: pictures first in their reserved slots, then the fitting word outlined and never filled; a saved hint:true restores as step one', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  assert.equal(a.w.document.querySelectorAll('.word-bank button').length, 3);
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.equal(a.query('#help').hidden, false);
  assert.equal(a.query('#help').textContent, '◎ Give me a clue');
  const pictures = Array.from(a.w.document.querySelectorAll('.card-picture'));
  assert.equal(pictures.length, 3, 'every card reserves a picture slot');
  assert.ok(pictures.every(el => !el.classList.contains('revealed') && el.querySelector('img.symbol')), 'pictures start hidden but the space is kept');
  a.click('[data-key="A"]');
  a.click('#help');
  assert.ok(pictures.every(el => el.classList.contains('revealed')), 'step one reveals the pictures in place');
  assert.equal(a.query('.word-bank .hint'), null, 'step one must not single out the answer');
  assert.equal(a.query('#word-input').value, 'A', 'the draft is untouched');
  assert.equal(a.store('garden-rounds').sentence.hint, 1);
  a.click('#help');
  assert.ok(a.query('[data-word="APPLE"].hint'), 'step two outlines the fitting word');
  assert.equal(a.query('#status').textContent, 'The word that fits is outlined.');
  assert.equal(a.query('#word-input').value, 'A', 'nothing is filled in');
  assert.equal(a.store('garden-rounds').sentence.hint, 2);
  assert.equal(a.plays.length, 0); assert.equal(a.spoken.length, 0);
  for (const key of ['P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word'); a.click('#next');
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.ok(Array.from(a.w.document.querySelectorAll('.card-picture')).every(el => !el.classList.contains('revealed')), 'the next sentence starts with pictures hidden');
  const b = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'words', wordTab: 'sentence', indices: { sentence: 0 } },
    'lp-player-player-1-garden-rounds': { sentence: { text: 'Nook eats an APPLE.', draft: '', hint: true, done: false } }
  });
  assert.equal(b.store('garden-rounds').sentence.hint, 1, 'an older boolean hint becomes step one');
  assert.ok(Array.from(b.w.document.querySelectorAll('.card-picture')).every(el => el.classList.contains('revealed')));
  assert.equal(b.query('.word-bank .hint'), null);
  const c = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'words', wordTab: 'sentence', indices: { sentence: 0 } },
    'lp-player-player-1-garden-rounds': { sentence: { text: 'Nook eats an APPLE.', draft: 'AP', hint: 2, done: false } }
  });
  assert.ok(c.query('[data-word="APPLE"].hint'), 'a numeric step restores as it does elsewhere');
  assert.equal(c.query('#word-input').value, 'AP');
});

test('tapping a word or the sentence speaks only while sound is on, never turns it on, enters nothing, and keeps blank until the word is checked', async t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  a.click('[data-word="APPLE"]');
  await tick();
  assert.equal(a.plays.length, 0, 'sound off stays silent');
  assert.equal(a.w.LP.audio.muted, true, 'a word tap never turns sound on');
  assert.equal(a.query('#status').textContent, 'Sound is off. Tap Sound: on to hear it.');
  a.click('#hear-model');
  assert.equal(a.plays.length, 0);
  assert.equal(a.query('#hear-model').getAttribute('aria-label'), 'Hear the sentence');
  assert.equal(a.query('[data-word="APPLE"]').getAttribute('aria-label'), 'Hear APPLE');
  assert.equal(a.query('.word-listen'), null, 'no note icons');
  a.click('[data-sound]');
  a.click('[data-word="APPLE"]');
  await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.apple.file);
  assert.equal(a.spoken.length, 0);
  assert.equal(a.query('#word-input').value, '');
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#hear-model');
  await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an blank'].file);
  a.click('#check-word'); a.click('#hear-model');
  await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an apple'].file);
});

test('a wrong word keeps the draft editable: one neutral line in the bubble, the hint in the status, no separate feedback element, sound respected', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  for (const key of ['C', 'A', 'T']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#answer-feedback'), null, 'no second feedback element');
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
  assert.equal(a.query('#status').textContent, 'Look at the picture. Which word fits?');
  assert.equal(a.query('#word-input').value, 'CAT');
  assert.equal(a.query('#word-input').getAttribute('aria-invalid'), 'true');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.plays.length, 0, 'Sound off must remain silent');
  a.click('[data-sound]'); a.click('#check-word');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['whoops! try again'].file);
  a.click('[data-key="Backspace"]');
  assert.equal(a.query('#word-input').hasAttribute('aria-invalid'), false);
  assert.equal(a.query('#speech').textContent, 'Type the missing word.', 'the bubble returns to the one prompt');
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
  a.click('[data-mode="words"]'); wordTab(a, 'letter');
  wrongChoice('letter', a.store('garden-rounds').letter.letter);
  wordTab(a, 'order');
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
  a.click('[data-sound]');
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
  a.click('[data-mode="words"]'); wordTab(a, 'numbers');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.ok(a.query('.number-model'));
  assert.match(a.query('.number-model').textContent, /ONE/);
});

test('changing completed typed answers removes stale success and permits checking again', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('[data-mode="words"]'); wordTab(a, 'numbers');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  a.click('[data-mode="count"]'); a.click('[data-mode="words"]');
  a.click('[data-key="Backspace"]');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.query('.number-model'), null);
});

test('sentence tiles keep their positions as words are placed', t => {
  const a = app(t);
  a.click('[data-mode="words"]'); wordTab(a, 'order');
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
  a.click('#support');
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
  a.click('[data-mode="words"]'); wordTab(a, 'order');
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
  a.click('[data-mode="words"]'); wordTab(a, 'letter');
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
  assert.equal(a.query('#answer-feedback'), null);
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
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
  a.click('[data-mode="words"]'); wordTab(a, 'letter');
  a.click('#help');
  assert.match(a.query('#status').textContent, /The word is APPLE/);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query(`[data-choice="${a.store('garden-rounds').letter.letter}"].hint`));
  wordTab(a, 'order');
  a.click('#help');
  assert.match(a.query('#status').textContent, /The sentence is: nook eats an apple\./);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query('.choice.hint'));
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'choose' });
  wordTab(a, 'numbers');
  a.click('#help');
  assert.match(a.query('#status').textContent, /starts with O and has 3 letters/);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query('[data-choice="ONE"].hint'));
  assert.equal(a.plays.length, 0); assert.equal(a.spoken.length, 0);
});

test('the gap is the input: bounded width, readonly with the A to Z keys, Delete / Clear / Enter as the action row, and the device keyboard shows that row on its own', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  const input = a.query('#word-input');
  assert.equal(input.tagName, 'INPUT');
  assert.equal(input.closest('.sentence'), a.query('.sentence'), 'the input sits inside the sentence');
  assert.equal(input.getAttribute('aria-label'), 'Missing word');
  assert.equal(input.getAttribute('maxlength'), '40');
  assert.equal(input.hasAttribute('readonly'), true, 'A to Z keys feed the gap without the device keyboard');
  assert.equal(input.getAttribute('inputmode'), 'none');
  assert.match(input.getAttribute('style'), /--gap-ch:[4-9]\b|--gap-ch:1[0-2]\b/, 'width follows the longest bank word, capped at twelve');
  assert.equal(a.query('.word-tile.gap'), null, 'no separate gap tile');
  assert.equal(a.query('.typing-row'), null); assert.equal(a.query('.word-label'), null); assert.equal(a.query('#keyboard-toggle'), null);
  assert.equal(a.query('#task .word-tabs'), null, 'no activity tab row on the task'); assert.equal(a.query('#choose-puzzle'), null, 'no header chooser');
  assert.equal(a.query('#support').textContent, 'Missing word · Change puzzle');
  assert.equal(a.query('#activity-title').textContent, 'Missing word');
  assert.equal(a.query('#instruction').textContent, '');
  assert.equal(a.query('#speech').textContent, 'Type the missing word.');
  assert.equal(a.query('#task .choice-label'), null);
  assert.deepEqual(Array.from(a.query('#hear-model').children).map(el => el.textContent), ['NOOK', 'EATS', 'AN'], 'the sentence words form the one Hear button');
  assert.equal(a.w.document.querySelectorAll('.sentence .word-tile').length, 0, 'sentence words are plain text');
  const row = a.query('.key-actions');
  assert.deepEqual(Array.from(row.children).map(b => b.dataset.key || b.id), ['Backspace', 'Clear', 'check-word']);
  assert.equal(row.parentElement, a.query('.keyboard'));
  assert.equal(a.query('.key.space'), null, 'no Space on Missing word');
  assert.equal(a.w.document.querySelectorAll('.keyboard [data-key]').length, 28);
  assert.equal(a.w.document.activeElement, input, 'the gap holds focus so its caret shows');
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  assert.equal(input.value, 'APPLE');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, keyboard: 'device' });
  assert.equal(a.query('#word-input').hasAttribute('readonly'), false);
  assert.equal(a.query('#word-input').getAttribute('inputmode'), null);
  assert.equal(a.query('#word-input').value, 'APPLE', 'switching keyboards keeps the draft');
  assert.equal(a.w.document.querySelectorAll('.keyboard [data-key]').length, 2, 'only Delete and Clear remain with the device keyboard');
  assert.ok(a.query('.keyboard.actions-only #check-word'), 'Enter stays visible');
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.equal(a.query('#word-input'), null, 'a finished sentence shows the word as a filled tile');
  assert.ok(a.query('.sentence .word-tile.filled'));
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type', keyboard: 'az' });
  wordTab(a, 'numbers');
  assert.equal(a.query('#word-input').tagName, 'INPUT');
  assert.deepEqual(Array.from(a.query('.key-actions').children).map(b => b.dataset.key || b.id), ['Backspace', 'Clear', 'Space', 'check-word'], 'Number words has the four-key row');
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
  a.click('[data-mode="words"]'); wordTab(a, 'numbers'); a.click('#support');
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

test('grown-up sentences join Missing word and Word order with a chosen gap, distractors, no picture and the local voice', async t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, customSentences: ['Arthur likes TRAINS.', 'We go to the PARK.'] });
  a.click('[data-mode="words"]'); a.click('#support');
  const buttons = Array.from(a.w.document.querySelectorAll('.puzzle-picker button'));
  assert.equal(buttons.length, L.SENTENCES.length + 2);
  buttons.find(b => b.textContent === 'ARTHUR LIKES TRAINS.').click();
  assert.equal(a.query('.sentence').getAttribute('aria-label'), 'arthur likes blank');
  assert.equal(a.query('#sentence-picture').querySelector('img'), null, 'no picture when the word has no symbol');
  const bank = Array.from(a.w.document.querySelectorAll('.word-bank button'));
  assert.equal(bank.length, 3);
  assert.ok(bank.some(b => b.dataset.word === 'TRAINS'));
  assert.ok(bank.some(b => b.dataset.word === 'PARK'), 'the other custom gap is a distractor');
  assert.ok(bank.every(b => b.querySelector('.card-picture')), 'every card keeps its picture slot');
  assert.equal(bank.find(b => b.dataset.word === 'TRAINS').querySelector('img'), null, 'a word without a symbol keeps a blank slot');
  a.click('[data-sound]');
  a.click('[data-word="TRAINS"]');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.spoken.at(-1), 'trains', 'a private word uses the local device voice');
  a.click('#hear-model');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.spoken.at(-1), 'arthur likes blank.');
  for (const key of ['T', 'R', 'A', 'I', 'N', 'S']) a.click(`[data-key="${key}"]`);
  const before = a.plays.length;
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.match(a.query('#speech').textContent, /Arthur likes trains\./);
  assert.equal(a.plays.length, before + 1, 'only the opener plays for a private sentence');
  assert.ok(L.OPENERS.map(o => o.toLowerCase().replace(/[.!?]+$/, '')).some(k => a.w.LPVoiceLibrary.clips[k].file === a.plays.at(-1)));
  assert.equal(a.spoken.filter(x => /trains/.test(x)).length, 1, 'the sentence itself never goes to a voice automatically');
  wordTab(a, 'order'); a.click('#support');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === 'WE GO TO THE PARK.').click();
  assert.equal(a.w.document.querySelectorAll('[data-tile]').length, 5);
  for (const word of ['WE', 'GO', 'TO', 'THE', 'PARK']) Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === word && !b.disabled).click();
  assert.equal(a.query('#next').hidden, false);
});

test('the bath-time bank offers five-word sentences for Word order and keeps stable tile positions', t => {
  const a = app(t);
  a.click('[data-mode="words"]'); wordTab(a, 'order'); a.click('#support');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === 'THE BIG DOG CAN RUN.').click();
  const tiles = Array.from(a.w.document.querySelectorAll('[data-tile]'));
  assert.equal(tiles.length, 5);
  const order = tiles.map(b => b.textContent);
  Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === 'THE').click();
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('[data-tile]')).map(b => b.textContent), order, 'tiles keep their places');
  a.click('#hear-model');
});

test('Make your own pattern: beads are added, removed and read back, the string is saved, and there is no right answer or Next', async t => {
  const a = app(t);
  a.click('[data-mode="patterns"]');
  assert.equal(a.query('[data-pattern-mode="finish"]').getAttribute('aria-pressed'), 'true');
  a.click('[data-pattern-mode="make"]');
  assert.equal(a.store('garden-position').patternMode, 'make');
  assert.equal(a.query('#activity-title').textContent, 'Make your own pattern');
  assert.equal(a.query('#next').hidden, true); assert.equal(a.query('#help').hidden, true); assert.equal(a.query('#repeat').hidden, true);
  assert.equal(a.w.document.querySelectorAll('[data-add]').length, 5);
  assert.equal(a.w.document.querySelectorAll('.bead-slot.empty').length, 10);
  a.click('[data-add="circle"]'); a.click('[data-add="square"]'); a.click('[data-add="circle"]');
  assert.deepEqual(a.store('garden-rounds').make.beads, ['circle', 'square', 'circle']);
  assert.equal(a.query('#readback').textContent, 'Circle, Square, Circle.');
  assert.equal(a.w.document.querySelectorAll('button[data-bead]').length, 3);
  a.click('[data-sound]'); a.click('#read-back');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.circle.file);
  a.players[0].onended();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.square.file);
  a.click('[data-bead="1"]');
  assert.deepEqual(a.store('garden-rounds').make.beads, ['circle', 'circle'], 'any bead can be taken off');
  a.click('#undo-bead');
  assert.deepEqual(a.store('garden-rounds').make.beads, ['circle']);
  for (let i = 0; i < 12; i++) a.click('[data-add="oval"]');
  assert.equal(a.store('garden-rounds').make.beads.length, 10, 'ten beads at most');
  assert.ok(a.query('[data-add="oval"]').disabled);
  assert.match(a.query('#status').textContent, /full/);
  assert.equal(a.query('#speech').textContent, 'What a string!');
  a.click('[data-pattern-mode="finish"]');
  assert.ok(a.query('button[data-gap], .bead-slot.missing'), 'finishing a pattern is unchanged');
  a.click('[data-pattern-mode="make"]');
  assert.equal(a.store('garden-rounds').make.beads.length, 10, 'the string is kept');
  a.click('#clear-beads');
  assert.deepEqual(a.store('garden-rounds').make.beads, []);
  assert.ok(a.query('#read-back').disabled);
  const b = app(t, 'garden.html', { 'lp-player-player-1-garden-position': { mode: 'patterns', patternMode: 'make' }, 'lp-player-player-1-garden-rounds': { make: { id: 'make:v2:L1:make:string', beads: ['circle', 'nonsense', 'oval'], done: true } } });
  assert.deepEqual(b.store('garden-rounds').make.beads, ['circle', 'oval'], 'only real shapes restore');
  assert.equal(b.query('#next').hidden, true);
});

test('numeral answer buttons are sized by digit count so 18 and 100 fit the same button as 3', t => {
  const a = app(t);
  a.click('[data-mode="add"]'); a.click('#support');
  a.w.document.querySelectorAll('.level-picker button')[2].click(); a.click('[data-close]');
  const classes = Array.from(a.w.document.querySelectorAll('[data-choice]')).map(b => [b.dataset.choice, b.className]);
  for (const [value, cls] of classes) assert.equal(/digits-2/.test(cls), value.length === 2, value);
  a.click('#support'); a.w.document.querySelectorAll('.level-picker button')[4].click(); a.click('[data-close]');
  a.click('#support');
  const form = a.query('#pick-sum'); form.elements.a.value = '50'; form.elements.b.value = '50'; a.submit('#pick-sum');
  assert.ok(a.query('[data-choice="100"].digits-3'));
  a.click('[data-mode="count"]');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => !/digits/.test(b.className)), 'single digits keep the approved size');
  const css = fs.readFileSync(path.join(root, 'garden-live.css'), 'utf8');
  assert.match(css, /\.choice\{display:inline-flex[^}]*text-size-adjust:100%/);
  assert.match(css, /\.equation span[^{]*\{letter-spacing:0\}/);
});

test('the typing keyboard sounds each letter phonetically, only while sound is on, without touching the draft', async t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  a.click('[data-key="A"]');
  assert.equal(a.plays.length, 0, 'sound off stays silent');
  a.click('[data-sound]');
  a.click('[data-key="P"]');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.puh.file);
  assert.equal(a.spoken.length, 0);
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'l', bubbles: true }));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.luh.file, 'hardware keys sound too');
  a.click('[data-key="Backspace"]');
  assert.equal(a.plays.length, 2, 'delete and space are silent');
  assert.equal(a.query('#word-input').value, 'AP');
  assert.equal(Object.keys(L.LETTER_SOUNDS).length, 26);
});

test('the task container names the current view so landscape CSS can lay each activity out', t => {
  const a = app(t);
  assert.equal(a.query('#task').dataset.view, 'count');
  a.click('[data-mode="add"]'); assert.equal(a.query('#task').dataset.view, 'add');
  a.click('[data-mode="words"]'); assert.equal(a.query('#task').dataset.view, 'sentence');
  wordTab(a, 'numbers'); assert.equal(a.query('#task').dataset.view, 'numbers');
  a.click('[data-mode="patterns"]'); a.click('[data-pattern-mode="make"]'); assert.equal(a.query('#task').dataset.view, 'make');
  const css = fs.readFileSync(path.join(root, 'garden-live.css'), 'utf8');
  assert.match(css, /@media \(min-width:820px\) and \(max-height:840px\) and \(orientation:landscape\)\{[^@]*main\.garden\{display:grid/);
  assert.match(css, /\.word-tabs button\{min-width:48px\}/);
  const landscape = css.slice(css.lastIndexOf('@media (min-width:820px) and (max-height:840px) and (orientation:landscape)'));
  assert.match(landscape, /#task\[data-view="sentence"\] \.sentence-row\{display:flex/, 'picture beside the sentence in landscape');
  assert.match(landscape, /button\.word-card\{flex-direction:row/, 'card pictures beside their words in landscape');
  assert.match(css, /button\.word-card\{display:flex/); assert.match(css, /\.key-actions\{grid-column:1\/-1;display:flex/);
  assert.doesNotMatch(css, /caret-color:transparent/, 'the caret is visible in the gap');
});

test('caret and selection survive a clue, the picker closing and a settings change; Clear wipes in one silent tap; physical letters, Backspace and Enter work', t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  for (const key of ['A', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  const input = () => a.query('#word-input');
  input().setSelectionRange(2, 2); input().dispatchEvent(new a.w.Event('select', { bubbles: true }));
  a.click('#help');
  assert.equal(input().selectionStart, 2, 'a clue does not move the caret');
  a.click('#support'); a.click('[data-close]');
  assert.deepEqual([input().selectionStart, input().selectionEnd], [2, 2], 'closing the picker keeps the caret');
  assert.equal(a.w.document.activeElement, input(), 'focus returns to the gap');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, case: 'lower' });
  assert.deepEqual([input().selectionStart, input().selectionEnd], [2, 2], 'a settings change re-renders without jumping to the end');
  a.click('[data-key="P"]');
  assert.equal(input().value, 'APpLE', 'the letter goes in at the caret');
  input().setSelectionRange(0, 5); input().dispatchEvent(new a.w.Event('select', { bubbles: true }));
  a.click('[data-key="Backspace"]');
  assert.equal(input().value, '', 'Delete removes the selection');
  for (const key of ['c', 'a', 't', '1', ' ']) a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key, bubbles: true }));
  assert.equal(input().value, 'cat', 'physical letters type into the gap; digits and spaces are ignored on Missing word');
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.equal(input().value, 'ca');
  a.click('[data-sound]');
  const before = a.plays.length;
  a.click('[data-key="Clear"]');
  assert.equal(input().value, '');
  assert.equal(a.query('#status').textContent, 'Cleared.');
  assert.equal(a.plays.length, before, 'Clear is silent');
  assert.equal(a.store('garden-rounds').sentence.draft, '');
  a.click('#check-word');
  assert.equal(a.query('#status').textContent, 'Type a word first.');
  assert.equal(a.query('#speech').textContent, 'Type the missing word.');
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(a.query('#next').hidden, false, 'the physical Enter key checks the word');
});

test('the picker lists the four Word activities first, switches between them without losing drafts, and returns focus to the task', async t => {
  const a = app(t);
  a.click('[data-mode="words"]');
  for (const key of ['A', 'P']) a.click(`[data-key="${key}"]`);
  a.click('#support');
  const tabs = Array.from(a.w.document.querySelectorAll('.lp-modal .picker-tabs button'));
  assert.deepEqual(tabs.map(b => b.textContent), ['Missing word', 'Missing letter', 'Word order', 'Number words']);
  assert.equal(tabs[0].getAttribute('aria-pressed'), 'true');
  assert.equal(a.query('.lp-modal .picker-tabs'), a.query('#picker-content').firstElementChild, 'activities come first');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button').length, L.SENTENCES.length);
  a.click('.lp-modal [data-word-tab="letter"]');
  assert.ok(a.query('.lp-modal'), 'the picker stays open');
  assert.equal(a.query('#support').textContent, 'Missing letter · Change puzzle');
  assert.equal(a.query('#task').dataset.view, 'letter');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button').length, L.PICTURES.length, 'the list follows the chosen activity');
  assert.equal(a.query('.lp-modal [data-word-tab="letter"]').getAttribute('aria-pressed'), 'true');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('.lp-modal [data-word-tab="numbers"]');
  assert.ok(a.query('.lp-modal .level-picker'), 'Number words keeps its level row');
  a.click('[data-close]');
  a.click('[data-key="O"]');
  assert.equal(a.query('#word-input').value, 'O');
  a.click('#support'); a.click('.lp-modal [data-word-tab="sentence"]'); a.click('[data-close]');
  assert.equal(a.query('#word-input').value, 'AP', 'the Missing word draft survived the visit to Number words');
  assert.equal(a.w.document.activeElement, a.query('#word-input'), 'focus returns to the task');
  a.click('#support');
  Array.from(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button')).find(b => b.textContent === 'THE SUN IS HOT.').click();
  assert.equal(a.query('.lp-modal'), null, 'choosing a sentence closes the picker');
  assert.equal(a.query('.sentence').getAttribute('aria-label'), 'the blank is hot');
  assert.equal(a.w.document.activeElement, a.query('#word-input'));
  assert.deepEqual(Array.from(a.query('#hear-model').children).map(el => el.textContent), ['THE'], 'the words before the gap form the Hear button');
  assert.deepEqual(Array.from(a.query('[data-hear]').children).map(el => el.textContent), ['IS', 'HOT'], 'the words after the gap follow it');
  a.click('[data-sound]'); a.click('[data-hear] span'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['the blank is hot'].file, 'a tap on the later words hears the sentence too');
  wordTab(a, 'numbers');
  assert.equal(a.query('#word-input').value, 'O');
  assert.equal(a.query('#support').textContent, 'Number words · Level 1 of 4 · Change puzzle');
});

test('a familiar sentence without pictures: the first clue reads the sentence with blank, and a wrong word says to read it once more', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, customSentences: ['Arthur likes TRAINS.', 'We go to the PARK.', 'Nana has a KITE.'] });
  a.click('[data-mode="words"]'); a.click('#support');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === 'ARTHUR LIKES TRAINS.').click();
  assert.ok(Array.from(a.w.document.querySelectorAll('.card-picture')).every(el => !el.querySelector('img')), 'no candidate has a symbol');
  assert.equal(a.w.document.querySelectorAll('.card-picture').length, 3, 'the blank picture areas are still reserved');
  a.click('#help');
  assert.equal(a.query('#status').textContent, 'The sentence is: arthur likes blank.');
  a.click('#help');
  assert.ok(a.query('[data-word="TRAINS"].hint'));
  for (const key of ['P', 'A', 'R', 'K']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#status').textContent, 'Read the sentence once more.');
  assert.equal(a.query('#speech').textContent, 'Whoops! Try again.');
});

test('Missing letter, Word order and Number words follow the same discipline: small heading, one prompt in the bubble, the word or sentence is the Hear control, sound-gated', async t => {
  const a = app(t);
  a.click('[data-mode="words"]'); wordTab(a, 'letter');
  assert.equal(a.query('#activity-title').textContent, 'Missing letter');
  assert.equal(a.query('#speech').textContent, 'Tap the missing letter.');
  assert.equal(a.query('#instruction').textContent, '');
  assert.equal(a.query('#task .choice-label'), null);
  assert.equal(a.query('#hear-model .sr-only').textContent, 'Hear the word: ');
  assert.ok(a.query('#hear-model .letter-tiles'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.length, 0); assert.equal(a.query('#status').textContent, 'Sound is off. Tap Sound: on to hear it.');
  a.click('[data-sound]'); a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.apple.file);
  wordTab(a, 'order');
  assert.equal(a.query('#activity-title').textContent, 'Word order');
  assert.equal(a.query('#speech').textContent, 'Tap the words, first to last.');
  assert.ok(a.query('#hear-model .sentence'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an apple'].file);
  wordTab(a, 'numbers');
  assert.equal(a.query('#activity-title').textContent, 'Number words');
  assert.equal(a.query('#speech').textContent, 'Read the number word.');
  assert.ok(a.query('#hear-model .number-model'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.one.file);
  assert.equal(a.w.document.querySelectorAll('.word-tools').length, 0, 'no tool rows or note icons');
});

test('Grown-ups: a familiar sentence that cannot be used is listed with its reason instead of dropped, and an older saved one that fails now is listed once', t => {
  const a = app(t, 'garden.html', { 'lp-player-player-1-little-patterns-v1': { customSentences: ["ARTHUR'S dog barks.", 'We go to the PARK.'] } });
  assert.deepEqual(Array.from(a.w.LP.prefs.customSentences), ['We go to the PARK.'], 'an apostrophe in the gap is no longer accepted');
  a.click('[data-settings]');
  const problems = a.query('#sentence-problems');
  assert.equal(problems.hidden, false);
  assert.match(problems.textContent, /Saved earlier, no longer used: “ARTHUR'S dog barks\.” — The missing word cannot have an apostrophe/);
  assert.equal(a.query('#lp-settings [name="customSentences"]').value, "We go to the PARK.\nARTHUR'S dog barks.", 'the old line stays in the box to be mended');
  a.query('#lp-settings [name="customSentences"]').value = 'We go to the PARK.\nArthur likes TRAINS\nno gap here\none two three four five six seven eight NINE ten\nThe LONG sentence that goes on and on and on and on and on and on';
  a.submit('#lp-settings');
  assert.ok(a.query('.lp-modal'), 'the dialog stays open while lines need a change');
  assert.deepEqual(Array.from(a.w.LP.prefs.customSentences), ['We go to the PARK.', 'Arthur likes TRAINS.'], 'valid lines are saved');
  assert.match(a.query('#sentence-problems').textContent, /Not added: “no gap here” — Write exactly one word in CAPITALS/);
  assert.match(a.query('#sentence-problems').textContent, /Use two to eight words/);
  assert.match(a.query('#sentence-problems').textContent, /Keep it to 60 characters/);
  assert.match(a.query('#status').textContent, /3 sentences need a change/);
  a.query('#lp-settings [name="customSentences"]').value = 'We go to the PARK.\nArthur likes TRAINS';
  a.submit('#lp-settings');
  assert.equal(a.query('.lp-modal'), null);
  a.click('[data-settings]');
  assert.equal(a.query('#sentence-problems').hidden, true, 'nothing is listed once every saved sentence is valid');
  assert.match(a.query('#lp-settings').textContent, /used as the wrong answers/);
  assert.match(a.query('#lp-settings').textContent, /spoken only while it is on/);
});
