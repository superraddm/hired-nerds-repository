// DOM integration checks. No browser rendering, network or real audio.
// Install once: npm install --prefix .wrangler/test-runtime --no-save --ignore-scripts jsdom@26.1.0
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');

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
  assert.equal(levels.length, 7);
  levels[6].click();
  assert.match(a.query('#support').textContent, /Level 7 of 7/);
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
  assert.match(a.query('#status').textContent, /complete/);
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
  assert.equal(a.query('#check-word').nextElementSibling, a.query('#answer-feedback'));
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
  assert.equal(a.store('garden-rounds').count.target, 8);
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
  assert.match(a.query('.equation').textContent, /1 \+ 3 = \?/);
});

test('levels are separate per activity, the Next level action is explicit, and a level change keeps other drafts', t => {
  const a = app(t);
  a.click('[data-mode="words"]'); a.click('[data-key="A"]');
  a.click('[data-mode="count"]');
  assert.equal(a.query('#next-level').hidden, true, 'no level action before the round is answered');
  a.click('[data-choice="1"]');
  assert.equal(a.query('#next-level').hidden, false);
  a.click('#next-level');
  assert.match(a.query('#support').textContent, /Level 2 of 2/);
  assert.equal(a.query('#next-level').hidden, true, 'the top level offers no further step');
  const position = a.store('garden-position');
  assert.deepEqual(position.levels, { count: 2, add: 1, numbers: 1, patterns: 1 });
  assert.equal(position.operation, 'add');
  a.click('[data-mode="add"]');
  assert.match(a.query('#support').textContent, /Level 1 of 2/);
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
    'lp-player-player-1-garden-position': { mode: 'patterns', indices: { patterns: 12, count: 6 } },
    'lp-player-player-1-garden-rounds': { count: { target: 7, seen: [0, 1], done: false } }
  });
  assert.match(a.query('#support').textContent, /Level 5 of 7/);
  a.click('[data-mode="count"]');
  assert.match(a.query('#support').textContent, /Level 2 of 2/);
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
    'lp-player-player-1-garden-position': { mode: 'count', indices: { count: 2, sentence: 0 }, levels: { count: 1, add: 2 } },
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
