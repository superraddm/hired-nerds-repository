// DOM integration checks for Little Patterns (round 4: the Nook frame, the shelf and the Grown-ups hold). No browser
// rendering, network or real audio; the six-viewport layout checks are tools/test-little-patterns-layout.cjs.
// Install once: npm install --prefix .wrangler/test-runtime --no-save --ignore-scripts jsdom@26.1.0
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const L = require('../public/fireworks/little-patterns/learning.js');

function app(t, page = 'garden.html', seed = {}, blocked = false, soundOn = false) {
  const html = fs.readFileSync(path.join(root, page.split('#')[0]), 'utf8');
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
  // Legacy scenarios start explicitly muted; startup tests opt into the real default.
  if (!soundOn) w.LP.audio.mute();
  t.after(async () => { await new Promise(resolve => setTimeout(resolve, 10)); assert.deepEqual(errors, [], 'no uncaught page errors'); dom.window.close(); });
  const query = selector => w.document.querySelector(selector);
  const click = selector => { const target = query(selector); assert.ok(target, selector); target.click(); return target; };
  const store = key => JSON.parse(w.localStorage.getItem(`lp-player-${w.LP.player.id}-${key}`));
  const submit = selector => query(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  return { w, query, click, store, submit, spoken, utterances, voices, plays, players, t };
}

// Phase 8 (Jof's navigation decision): the child picks an activity from the game's list under its shelf tile. In a game
// that is the shelf button, the game's tile (which opens its list), then one tile of the list: the activity named, or
// the one marked as last played, so the game carries on as it was. Count has one activity: its tile switches in place.
const LISTS = ['add', 'words', 'patterns'];
function goTo(a, game, activity) {
  if (!LISTS.includes(game)) { a.click(`[data-mode="${game}"]`); return; }
  a.click('#shelf-open');
  a.click(`#shelf-overlay [data-shelf="${game}"]`);
  assert.equal(a.w.LPShelf.menu, game, 'the tile opens its list');
  a.click(`#shelf-overlay .menu-tile[data-mode="${game}"]` + (activity ? `[data-activity="${activity}"]` : '[aria-current="true"]'));
  assert.equal(a.query('#shelf-overlay').hidden, true, 'one tap starts it and closes the shelf');
}
const wordTab = (a, id) => goTo(a, 'words', id);
// Levels, sets and chosen puzzles are the grown-ups': the shelf, the two-second Grown-ups hold (faked with mock timers,
// as the gate test does), then Levels and puzzles in the game's section of the sheet.
function grownups(a) {
  a.click('#shelf-open');
  const gate = a.query('#shelf-overlay [data-grownups]');
  let mine = false;
  try { a.t.mock.timers.enable({ apis: ['setTimeout'] }); mine = true; } catch (_) { /* the test already runs mock timers */ }
  try {
    gate.dispatchEvent(new a.w.MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, button: 0 }));
    a.t.mock.timers.tick(2000);
  } finally { if (mine) a.t.mock.timers.reset(); }
  assert.equal(a.query('#dialog-title').textContent, 'Grown-ups');
}
const parentLevels = a => { grownups(a); a.click('#gu-levels'); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const assertRetry = a => assert.ok(L.FEEDBACK.retries.includes(a.query('#speech').textContent), 'a kind retry line: ' + a.query('#speech').textContent);

test('wrong answers rotate through the kind retry lines, never the same twice running, and the bubble matches the clip', t => {
  assert.ok(L.FEEDBACK.retries.length >= 4);
  let previous = '';
  for (let i = 0; i < 200; i++) { const line = L.retryLine(previous); assert.notEqual(line, previous); previous = line; }
  assert.equal(L.retryLine('', () => 0), L.FEEDBACK.retries[0]);
  assert.equal(L.retryLine('', () => .9999), L.FEEDBACK.retries.at(-1));
  const bank = new Set(L.spokenBank());
  for (const line of L.FEEDBACK.retries) assert.ok(bank.has(line.toLowerCase().replace(/[.!?]+$/, '')), line);
  const a = app(t, 'garden.html', {}, false, true);
  const seen = [];
  for (let i = 0; i < 12; i++) {
    Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(a.store('garden-rounds').count.target)).click();
    const shown = a.query('#speech').textContent;
    assertRetry(a);
    assert.notEqual(shown, seen.at(-1), 'no line twice running');
    assert.equal(a.store('garden-rounds').count.retryLine, shown, 'saved, so a re-render shows the same line');
    assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips[shown.toLowerCase().replace(/[.!?]+$/, '')].file);
    seen.push(shown);
  }
  assert.ok(new Set(seen).size > 1, 'the lines vary');
});

test('sound starts on in every Garden activity and level; only the Grown-ups setting turns it off, and that holds across activities and the next page', async t => {
  const a=app(t,'garden.html',{},false,true);
  assert.equal(a.w.LP.audio.muted,false);
  assert.equal(a.query('[data-sound]'),null,'nothing on a play screen mutes');
  goTo(a, 'words');a.click('[data-key="A"]');await tick();
  assert.equal(a.plays.length,1,'first letter speaks without a Sound toggle');
  for(const mode of ['count','add','patterns']){
    goTo(a,mode);parentLevels(a);
    const count=a.w.document.querySelectorAll('.level-picker button').length;
    assert.ok(count>0);
    for(let i=0;i<count;i++){
      a.w.document.querySelectorAll('.level-picker button')[i].click();
      assert.equal(a.w.LP.audio.muted,false,mode+' level '+(i+1));
    }
    a.click('[data-close]');
  }
  a.w.LP.settings();
  assert.equal(a.query('#lp-settings [name="sound"]').value,'on');
  a.query('#lp-settings [name="sound"]').value='off';a.submit('#lp-settings');
  assert.equal(a.w.LP.audio.muted,true);assert.equal(a.w.LP.soundOff,true);
  goTo(a, 'words');a.click('[data-key="B"]');await tick();
  assert.equal(a.plays.length,1,'the grown-up mute is retained between activities');
  assert.equal(a.w.localStorage.getItem('lp-sound'),'"off"','kept for this device');
  const b=app(t,'garden.html',{'lp-sound':'off'},false,true);
  assert.equal(b.w.LP.audio.muted,true,'the next page starts quiet while a grown-up has sound off');
  goTo(b, 'words');b.click('[data-word="APPLE"]');await tick();
  assert.equal(b.plays.length,0);assert.equal(b.w.LP.audio.muted,true,'a tap never turns it back on');
  assert.equal(b.query('#status').textContent,'Sound is off. A grown-up can turn it on in Grown-ups.');
  await b.w.LP.audio.speak('APPLE');
  assert.equal(b.plays.length,0,'not even a direct request');
  b.w.LP.setSound(true);b.click('[data-word="APPLE"]');await tick();
  assert.equal(b.plays.at(-1),b.w.LPVoiceLibrary.clips.apple.file);
});

test('backgrounding stops speech without changing sound choice or replaying it on return', async t => {
  const a=app(t,'garden.html',{},false,true);
  goTo(a, 'words');a.click('[data-key="A"]');await tick();
  const before=a.plays.length;
  Object.defineProperty(a.w.document,'hidden',{configurable:true,value:true});
  a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));
  assert.equal(a.players[0].src,'');assert.equal(a.w.LP.audio.muted,false);
  Object.defineProperty(a.w.document,'hidden',{configurable:true,value:false});
  a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));
  assert.equal(a.plays.length,before);
  a.click('[data-key="B"]');await tick();assert.equal(a.plays.length,before+1);
  a.w.LP.choosePlayer();a.query('#player-form [name="name"]').value='Second player';a.submit('#player-form');
  assert.equal(a.w.LP.audio.muted,false,'changing players does not silently mute');
});

test('Blocks starts music on the first control tap, and muting prevents further starts', async t => {
  const a=app(t,'blocks.html',{},false,true);let starts=0,contexts=0;
  assert.equal(a.w.LP.audio.muted,false);
  assert.equal(a.query('[data-sound]').getAttribute('aria-pressed'),'true');
  const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
  const node=()=>({connect(){},disconnect(){},start(){starts++;},stop(){},frequency:{},gain:param});
  a.w.AudioContext=function(){contexts++;this.state='running';this.currentTime=0;this.destination={};this.createOscillator=node;this.createGain=node;this.sampleRate=22050;this.createBuffer=()=>({getChannelData:()=>new Float32Array(4)});this.createBufferSource=()=>({...node(),start(){}});this.createBiquadFilter=()=>({...node(),Q:{}});this.suspend=async()=>{};};
  assert.equal(contexts,0,'no autoplay context before interaction');
  a.click('[data-action="left"]');await tick();assert.equal(starts,1);
  a.click('[data-action="right"]');await tick();assert.equal(starts,1,'no duplicate melody loop');
  a.click('[data-sound]');a.click('[data-action="left"]');await tick();
  assert.equal(a.w.LP.audio.muted,true);assert.equal(starts,1);
});

test('Count, immediate addition and every pattern level remain directly available', t => {
  const a = app(t);
  a.click('[data-choice="1"]');
  assert.equal(a.query('#next').hidden, false);
  goTo(a, 'add');
  assert.equal(a.query('#join'), null);
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 3);
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/);
  a.click('[data-choice="2"]');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = 2/);
  goTo(a, 'patterns');
  parentLevels(a);
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 14);
  levels[6].click();
  assert.equal(a.query('#support').textContent, 'Level 7');
  a.click('[data-close]');
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.store('garden-position').levels.patterns, 7);
});

test('missing-word input is typed, checked and retained separately for each player', t => {
  const a = app(t);
  goTo(a, 'words');
  assert.equal(a.w.document.querySelectorAll('.word-bank button').length, 3);
  a.click('[data-key="A"]');
  a.w.LP.choosePlayer();
  a.query('#player-form [name="name"]').value = 'Second player';
  a.submit('#player-form');
  goTo(a, 'words');
  assert.equal(a.query('#word-input').value, '');
  a.click('[data-key="B"]');
  a.w.LP.choosePlayer();
  a.w.document.querySelector('.player-list .saved-text').click();
  assert.equal(a.query('#word-input').value, 'A');
  for (const key of ['P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.match(a.query('#status').textContent, /Nook eats an apple/);
  assert.equal(a.query('#speech').textContent, a.w.GardenLearning.successLine('sentence', a.store('garden-rounds').sentence).text);
});

test('Missing word shows its three picture cards from the start; Help outlines the sentence picture, then the fitting card, never filling it; with pictures hidden, Help shows them first; a saved hint:true restores as step one', t => {
  const a = app(t);
  goTo(a, 'words');
  assert.equal(a.w.LP.prefs.wordPictures, 'show', 'word pictures are on by default');
  assert.equal(a.w.document.querySelectorAll('.word-bank button').length, 3);
  assert.equal(a.query('#sentence-picture').hidden, false);
  assert.equal(a.query('#help').hidden, false);
  assert.equal(a.query('#help').textContent, 'Help!');
  assert.ok(a.query('#help svg.help-sign'), 'the Help button carries the hand sign');
  const pictures = Array.from(a.w.document.querySelectorAll('.card-picture'));
  assert.equal(pictures.length, 3, 'every card has a picture slot');
  assert.ok(pictures.every(el => el.classList.contains('revealed') && el.querySelector('img.symbol')), 'the pictures show from the start');
  a.click('[data-key="A"]');
  a.click('#help');
  assert.ok(a.query('.sentence-row.clue'), 'step one outlines the sentence picture, the clue to match');
  assert.equal(a.query('.word-bank .hint'), null, 'step one must not single out the answer');
  assert.equal(a.query('#status').textContent, 'Look at the picture. Which card matches it?');
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
  assert.ok(Array.from(a.w.document.querySelectorAll('.card-picture')).every(el => el.classList.contains('revealed')), 'the next sentence shows its pictures too');
  assert.equal(a.query('.sentence-row.clue'), null);
  const h = app(t, 'garden.html', { 'lp-player-player-1-little-patterns-v1': { wordPictures: 'hide' } });
  goTo(h, 'words');
  const hidden = Array.from(h.w.document.querySelectorAll('.card-picture'));
  assert.ok(hidden.every(el => !el.classList.contains('revealed') && el.querySelector('img.symbol')), 'hidden pictures keep their place, so Help never moves the keys');
  h.click('#help');
  assert.ok(hidden.every(el => el.classList.contains('revealed')), 'with pictures hidden, step one shows them in place');
  assert.equal(h.query('#status').textContent, 'Word pictures shown. Which word fits the sentence?');
  h.click('#help');
  assert.ok(h.query('[data-word="APPLE"].hint'));
  const b = app(t, 'garden.html', {
    'lp-player-player-1-little-patterns-v1': { wordPictures: 'hide' },
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
  goTo(a, 'words');
  a.click('[data-word="APPLE"]');
  await tick();
  assert.equal(a.plays.length, 0, 'sound off stays silent');
  assert.equal(a.w.LP.audio.muted, true, 'a word tap never turns sound on');
  assert.equal(a.query('#status').textContent, 'Sound is off. A grown-up can turn it on in Grown-ups.');
  a.click('#hear-model');
  assert.equal(a.plays.length, 0);
  assert.equal(a.query('#hear-model').getAttribute('aria-label'), 'Hear the sentence');
  assert.equal(a.query('[data-word="APPLE"]').getAttribute('aria-label'), 'Hear APPLE');
  assert.equal(a.query('.word-listen'), null, 'no note icons');
  a.w.LP.setSound(true);
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
  goTo(a, 'words');
  for (const key of ['C', 'A', 'T']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#answer-feedback'), null, 'no second feedback element');
  assertRetry(a);
  assert.equal(a.query('#status').textContent, 'Look at the picture. Which word fits?');
  assert.equal(a.query('#word-input').value, 'CAT');
  assert.equal(a.query('#word-input').getAttribute('aria-invalid'), 'true');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.plays.length, 0, 'Sound off must remain silent');
  a.w.LP.setSound(true); a.click('#check-word');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips[a.query('#speech').textContent.toLowerCase().replace(/[.!?]+$/, '')].file, 'Nook says the line the bubble shows');
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
    assertRetry(a);
    assert.equal(a.store('garden-rounds')[round].done, false);
  }
  wrongChoice('count', 1);
  goTo(a, 'add'); wrongChoice('add', 2);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  a.click('[data-pad="1"]'); a.click('#check-sum');
  assertRetry(a);
  assert.equal(a.store('garden-rounds').add.draft, '1');
  goTo(a, 'patterns'); wrongChoice('patterns', a.store('garden-rounds').patterns.answer);
  goTo(a, 'words'); wordTab(a, 'letter');
  wrongChoice('letter', a.store('garden-rounds').letter.letter);
  wordTab(a, 'order');
  const wrongTile = Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent !== 'NOOK');
  wrongTile.click();
  assertRetry(a);
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
  a.w.LP.setSound(true);
  goTo(a, 'words'); a.click('[data-word="APPLE"]');
  const error = a.players[0].onerror;
  a.w.LP.audio.pause();
  assert.equal(a.players[0].paused, true);
  a.w.LP.status('Still paused'); error();
  assert.equal(a.query('#status').textContent, 'Still paused');
  a.click('[data-word="APPLE"]'); goTo(a, 'count');
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
  goTo(a, 'words'); a.click('[data-key="A"]');
  a.w.LP.choosePlayer(); a.query('#player-form [name="name"]').value = 'Guest two'; a.submit('#player-form');
  goTo(a, 'words'); a.click('[data-key="B"]');
  a.w.LP.choosePlayer(); a.w.document.querySelector('.player-list .saved-text').click();
  assert.equal(a.query('#word-input').value, 'A');
});

test('a typed number-word answer updates its result immediately', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  goTo(a, 'words'); wordTab(a, 'numbers');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.ok(a.query('.number-model'));
  assert.match(a.query('.number-model').textContent, /ONE/);
});

test('a completed typed answer stays as it is until Again or Next: its keys are disabled and hardware keys change nothing, so no stale success can appear', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  goTo(a, 'words'); wordTab(a, 'numbers');
  for (const key of ['O', 'N', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  goTo(a, 'count'); goTo(a, 'words');
  assert.equal(a.query('[data-key="Backspace"]').disabled, true);
  assert.equal(a.query('#word-input').hasAttribute('readonly'), true);
  a.click('[data-key="Backspace"]');
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  assert.equal(a.query('#word-input').value, 'ONE');
  assert.equal(a.query('#next').hidden, false);
  assert.match(a.query('.number-model').textContent, /ONE/);
  a.click('#repeat');
  assert.equal(a.query('#word-input').value, '', 'Again starts the same number fresh');
  assert.equal(a.query('#next').hidden, true);
  assert.equal(a.query('.number-model'), null);
  a.click('[data-key="O"]');
  assert.equal(a.query('#word-input').value, 'O');
});

test('sentence tiles keep their positions as words are placed', t => {
  const a = app(t);
  goTo(a, 'words'); wordTab(a, 'order');
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
  parentLevels(a);
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
  goTo(a, 'add'); a.click('#next'); a.click('#next');
  parentLevels(a);
  const form = a.query('#pick-sum'); form.elements.a.value = '2'; form.elements.b.value = '2';
  a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /2 \+ 2 = \?/);
  a.click('[data-choice="4"]'); a.click('#next');
  const seq = a.w.GardenLearning.sumSequence(1, 'add'), after = seq[(seq.findIndex(([x, y]) => x === 2 && y === 2) + 1) % seq.length];
  assert.match(a.query('.equation').textContent, new RegExp(after[0] + ' \\+ ' + after[1] + ' = \\?'));
});

test('levels are separate per activity and chosen in Grown-ups; the pill names the level as a read-only label; a level change keeps other drafts', t => {
  const a = app(t);
  goTo(a, 'words'); a.click('[data-key="A"]');
  goTo(a, 'count');
  assert.equal(a.query('#level-strip'), null, 'no level strip: the pill is the one level control');
  assert.equal(a.query('#support').textContent, '1–5');
  assert.equal(a.query('#support').getAttribute('aria-haspopup'), null, 'the label opens nothing');
  assert.equal(a.query('#support').getAttribute('role'), 'img');
  a.click('[data-choice="1"]');
  assert.equal(a.query('#next-level'), null, 'no Next level button');
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[1].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, '1–10');
  assert.equal(a.query('#support').getAttribute('aria-label'), 'Level: 1–10');
  goTo(a, 'patterns'); parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[13].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Level 14 · Numbers');
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.equal(a.query('#next').hidden, false);
  goTo(a, 'count');
  const position = a.store('garden-position');
  assert.deepEqual(position.levels, { count: 2, add: 1, numbers: 1, patterns: 14 });
  assert.equal(position.operation, 'add');
  goTo(a, 'add');
  assert.equal(a.query('#support').textContent, 'Up to 5');
  goTo(a, 'words');
  assert.equal(a.query('#word-input').value, 'A', 'changing the Count level never touches a Words draft');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, choices: 3 });
  assert.equal(a.query('#word-input').value, 'A', 'a choices change rebuilds Count, not Missing word');
  goTo(a, 'count');
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 3);
});

test('an older save with the shared 1 to 10 range and a pattern index restores onto explicit levels', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-little-patterns-v1': { range: 10 },
    'lp-player-player-1-garden-position': { mode: 'patterns', indices: { patterns: 12, count: L.countSequence(2).indexOf(7) } },
    'lp-player-player-1-garden-rounds': { count: { target: 7, seen: [0, 1], done: false } }
  });
  assert.match(a.query('#support').textContent, /2 shapes/, 'patterns now open on the two-shape family whatever the old index said');
  goTo(a, 'count');
  assert.equal(a.query('#support').textContent, '1–10');
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
  // Phase 8: who is playing is chosen in Grown-ups (the shelf button, then the hold), as in every game.
  grownups(a); a.click('#gu-player');
  a.query('#player-form [name="name"]').value = 'Block builder two'; a.submit('#player-form');
  assert.equal(a.query('#undo').disabled, true);
  grownups(a); a.click('#gu-player'); a.w.document.querySelector('.player-list .saved-text').click();
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
  goTo(a, 'words'); a.click('[data-key="A"]');
  a.w.LP.choosePlayer(); a.click('[aria-label="Delete Player 1 from this device"]');
  a.click('#confirm-action');
  await Promise.resolve();
  assert.notEqual(a.w.LP.player.id, 'player-1');
  assert.equal(a.w.localStorage.getItem('lp-player-player-1-garden-rounds'), null);
  a.click('[data-close]'); goTo(a, 'words');
  assert.equal(a.query('#word-input').value, '');
});

test('saved rounds restore by puzzle id: a matching id keeps its state, a mismatched one starts that activity fresh only', t => {
  const a = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'count', indices: { count: L.countSequence(1).indexOf(3), sentence: 0 }, levels: { count: 1, add: 2 }, strip: 1 },
    'lp-player-player-1-garden-rounds': {
      count: { id: 'count:v2:L1:count:3', target: 3, seen: [0], done: false },
      add: { id: 'add:v2:L1:add:1+1', a: 1, b: 1, draft: '5', done: false },
      sentence: { id: 'sentence:v2:L1:gap:Nook eats an APPLE.', text: 'Nook eats an APPLE.', draft: 'APP', done: false }
    }
  });
  assert.deepEqual(a.store('garden-rounds').count.seen, [0], 'same id, state kept');
  assert.equal(a.store('garden-rounds').add.draft, '', 'the saved add belonged to level 1; level 2 starts fresh');
  assert.equal(a.store('garden-rounds').add.id, 'add:v2:L2:add:1+1');
  goTo(a, 'words');
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
  assert.equal(a.query('#speech').textContent, 'How many apples?', 'a fresh round shows the prompt again');
  assert.ok(!a.query('#speech').classList.contains('success'));
  a.w.LP.setSound(true);
  a.click(`[data-choice="${a.store('garden-rounds').count.target}"]`);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.spoken.length, 0, 'automatic feedback never falls back to a device voice');
  const speech = L.successLine('count', a.store('garden-rounds').count).speech;
  assert.equal(a.plays.length, 1, 'encouragement plays once, from the answering tap');
  assert.equal(a.plays[0], a.w.LPVoiceLibrary.clips[speech[0].toLowerCase().replace(/[.!?]+$/, '')].file);
  a.players[0].onended();
  assert.equal(a.plays[1], a.w.LPVoiceLibrary.clips[speech[1].toLowerCase().replace(/[.!?]+$/, '')].file);
  goTo(a, 'add');
  const wrong = Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== '2');
  wrong.click();
  assertRetry(a);
  assert.equal(a.store('garden-rounds').add.feedback, 'retry');
  a.click('[data-choice="2"]');
  assert.equal(a.query('#speech').textContent, line('add', a.store('garden-rounds').add));
  assert.match(a.query('#speech').textContent, /1 \+ 1 = 2\./);
  assert.equal(a.store('garden-rounds').add.feedback, '');
  goTo(a, 'words'); wordTab(a, 'order');
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
  a.w.LP.setSound(true);
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

// Round 4, phase 5: a line of several clips is joined into ONE clip (phrase-aware gaps) and played through the same player.
// jsdom has no real media element, so 'auto' keeps the chain here (the tests above); these force the join on.
function joinApp(t, { fetchFails = false } = {}) {
  const a = app(t, 'garden.html', {}, false, true), requests = [], urls = [], revoked = [], blobs = [];
  a.w.URL.createObjectURL = blob => { blobs.push(blob); const url = 'blob:joined-' + urls.length; urls.push(url); return url; };
  a.w.URL.revokeObjectURL = url => revoked.push(url);
  a.w.fetch = async (url, options) => {
    requests.push({ url, options });
    if (fetchFails) throw new Error('Offline');
    const bytes = fs.readFileSync(path.join(root, url));
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
  };
  a.w.LP.audio.join = true;
  return Object.assign(a, { requests, urls, revoked, blobs });
}
const flushAll = () => new Promise(resolve => setImmediate(resolve));
const PARTS = ['Yes!', 'THREE', 'plus', 'TWO', 'equals', 'FIVE'];

test('joined speech: the parts are fetched once (same-origin, no credentials, bundled files only), joined with phrase gaps and played as ONE clip from the one player; start reports each part in turn', async t => {
  const a = joinApp(t), J = require('../public/fireworks/little-patterns/shared.js');
  const lib = a.w.LPVoiceLibrary.clips, file = p => lib[p.toLowerCase().replace(/[.!?,]+$/, '')].file;
  const starts = [], ends = [];
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
  a.w.LP.audio.speak(PARTS, { auto: true, on: { start: (i, n, clip) => starts.push([i, n, clip.file, clip.seconds]), end: () => ends.push(1) } });
  for (let i = 0; i < 6; i++) await flushAll();
  assert.deepEqual(a.requests.map(r => r.url), PARTS.map(file), 'each part once, by its bundled path');
  assert.ok(a.requests.every(r => r.options.credentials === 'omit' && r.options.referrerPolicy === 'no-referrer'));
  assert.equal(a.plays.at(-1), 'blob:joined-0', 'one joined clip');
  assert.equal(a.players.length, 1, 'the same player');
  assert.equal(a.blobs[0].type, 'audio/wav');
  const pcms = PARTS.map(p => { const b = fs.readFileSync(path.join(root, file(p))); return J.parseWav(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); });
  const expected = J.join(PARTS, pcms);
  assert.equal(a.blobs[0].size, expected.wav.byteLength, 'the bytes the joiner builds');
  assert.deepEqual(starts.map(s => s[0]), [0], 'the first part starts with the clip');
  t.mock.timers.tick(Math.ceil(expected.offsets[5] * 1000));
  assert.deepEqual(starts.map(s => s[0]), [0, 1, 2, 3, 4, 5], 'then each part as it starts');
  assert.ok(starts.every(s => s[1] === 6 && Math.abs(s[3] - lib[PARTS[s[0]].toLowerCase().replace(/[.!?,]+$/, '')].seconds) < .002), 'with that part\'s own length');
  a.players[0].onended();
  assert.equal(ends.length, 1, 'end once, after the joined clip');
  // Every part is now in memory: the same line again is built and played at once, inside the tap, with no request.
  const before = a.requests.length;
  a.w.LP.audio.speak(PARTS, { auto: true });
  assert.equal(a.plays.at(-1), 'blob:joined-1', 'played synchronously from memory');
  assert.equal(a.requests.length, before);
  assert.deepEqual(a.revoked, ['blob:joined-0'], 'the previous joined clip is released');
  a.w.LP.audio.stopSpeech();
  assert.deepEqual(a.revoked, ['blob:joined-0', 'blob:joined-1']);
  } finally { t.mock.timers.reset(); }   // before the page's own after-hook waits on a real timer
});

test('joined speech falls back to the old chain when a part cannot be fetched or is not a 24 kHz mono WAV, and a single clip never waits for a fetch', async t => {
  const a = joinApp(t, { fetchFails: true }), lib = a.w.LPVoiceLibrary.clips;
  a.w.LP.audio.speak(['apple'], { auto: true });
  assert.deepEqual(a.plays, [lib.apple.file], 'a single clip plays from the tap, no fetch');
  assert.equal(a.requests.length, 0);
  a.w.LP.audio.speak(['apple', 'sun'], { auto: true });
  for (let i = 0; i < 4; i++) await flushAll();
  assert.ok(a.requests.length >= 1, 'it tried');
  assert.equal(a.plays.at(-1), lib.apple.file, 'then the chain, in order');
  a.players[0].onended();
  assert.equal(a.plays.at(-1), lib.sun.file);
  assert.equal(a.urls.length, 0, 'no joined clip was made');
  assert.doesNotMatch(a.query('#status').textContent, /could not play/, 'and no error message');
  // A clip in another format is refused by the joiner and the chain plays instead.
  const b = joinApp(t);
  b.w.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(64) });
  b.w.LP.audio.speak(['apple', 'sun'], { auto: true });
  for (let i = 0; i < 4; i++) await flushAll();
  assert.equal(b.plays.at(-1), lib.apple.file);
  assert.equal(b.urls.length, 0);
  // In jsdom (no real media element) the default 'auto' never joins.
  const c = app(t, 'garden.html', {}, false, true);
  assert.equal(c.w.LP.audio.join, 'auto');
  c.w.LP.audio.speak(['apple', 'sun'], { auto: true });
  assert.equal(c.plays.at(-1), lib.apple.file, 'the chain, synchronously');
});

test('speech rate: 1.0 by default, at most 1.05, the pitch kept', async t => {
  const a = app(t, 'garden.html', {}, false, true);
  assert.equal(a.w.LP.audio.rate, 1);
  a.w.LP.audio.rate = 1.2; assert.equal(a.w.LP.audio.rate, 1.05);
  a.w.LP.audio.rate = .5; assert.equal(a.w.LP.audio.rate, 1);
  a.w.LP.audio.rate = 1.05;
  a.w.LP.audio.speak(['apple'], { auto: true });
  const p = a.players[0];
  assert.equal(p.playbackRate, 1.05); assert.equal(p.defaultPlaybackRate, 1.05);
  assert.equal(p.preservesPitch, true); assert.equal(p.webkitPreservesPitch, true);
});

test('every prompt and Help line in the Garden has its clip (phase 5): the bubble shows the speaker in each mode and word tab, Help lines and the shelf question can be heard again', async t => {
  const a = app(t, 'garden.html', {}, false, true);
  const voiced = label => assert.ok(!a.query('#bubble').classList.contains('silent'), label + ': ' + a.query('#speech').textContent);
  for (const mode of ['count', 'add', 'patterns']) { goTo(a, mode); voiced(mode); }
  goTo(a, 'add'); a.click('#help');
  assert.equal(a.query('#speech').textContent, 'Count them all with me.'); voiced('add Help');
  goTo(a, 'add');
  goTo(a, 'words');
  for (const tab of ['sentence', 'letter', 'order', 'numbers']) { wordTab(a, tab); voiced(tab); }
  const overlay = a.query('#shelf-overlay');
  assert.equal(overlay.querySelector('[data-bubble] .line').textContent, 'What shall we play?');
  assert.ok(!overlay.querySelector('[data-bubble]').classList.contains('silent'), 'the shelf question has its clip');
  a.plays.length = 0;
  overlay.querySelector('[data-bubble]').click(); await tick();
  assert.deepEqual(a.plays, [a.w.LPVoiceLibrary.clips['what shall we play'].file]);
});

test('success is announced once: the completed model stays, no duplicate result line is drawn', t => {
  const a = app(t);
  a.click('[data-choice="1"]');
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('#task .number-total'), null, 'no separate total');
  assert.ok(a.query('[data-choice="1"].chosen'), 'the chosen answer stays marked in its place');
  assert.equal(a.query('#status').textContent, a.query('#speech').textContent, 'one live announcement of the same line');
  goTo(a, 'add'); a.click('[data-choice="2"]');
  assert.equal(a.query('.result-note'), null);
  assert.match(a.query('.equation').textContent, /1 \+ 1 = 2/);
  assert.equal(a.query('.equation .unknown.filled').textContent, '2', 'the chosen digit fills the ?');
  assert.equal(a.query('.sum-result'), null, 'the joined group is not drawn again');
  goTo(a, 'patterns');
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('.bead-slot.missing'), null, 'the bead fills the gap');
  goTo(a, 'words'); wordTab(a, 'letter');
  a.click(`[data-choice="${a.store('garden-rounds').letter.letter}"]`);
  assert.equal(a.query('.result-note'), null);
  assert.equal(a.query('.letter-tile.gap'), null);
  assert.ok(a.query('.letter-tile.filled'));
  goTo(a, 'count');
  assert.equal(a.query('#status').textContent, 'Again, or the next picnic.', 'a re-render carries an instruction, not the announcement again');
});

test('a wrong answer gives one neutral line in the bubble and one hint in the status, never a repeated "try again"', t => {
  const a = app(t);
  const wrong = () => Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(a.store('garden-rounds')[a.store('garden-position').mode === 'words' ? a.store('garden-position').wordTab : a.store('garden-position').mode].target)).click();
  wrong();
  assertRetry(a);
  assert.equal(a.query('#status').textContent, 'Look at the apples and count them.');
  goTo(a, 'words');
  for (const key of ['C', 'A', 'T']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.equal(a.query('#answer-feedback'), null);
  assertRetry(a);
  assert.equal(a.query('#status').textContent, 'Look at the picture. Which word fits?');
  assert.ok(!/try/i.test(a.query('#status').textContent));
});

test('Give me a clue scaffolds first and outlines the answer second, silently, in every activity', t => {
  const a = app(t);
  goTo(a, 'add');
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('#task .count-tag').length, 2, 'first tap numbers every apple in one count');
  assert.equal(a.query('.choice.hint'), null);
  assert.equal(a.store('garden-rounds').add.hint, 1);
  a.click('#help');
  assert.ok(a.query('[data-choice="2"].hint'), 'second tap outlines the answer');
  goTo(a, 'patterns');
  const round = a.store('garden-rounds').patterns;
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.bead-slot.emphasis').length, round.unit.length);
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query(`[data-choice="${round.answer}"].hint`));
  goTo(a, 'words'); wordTab(a, 'letter');
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

test('the gap is the input: bounded width, readonly with the A to Z keys, the keys end in Delete then Enter (no Clear), and the device keyboard shows those two on their own', t => {
  const a = app(t);
  goTo(a, 'words');
  const input = a.query('#word-input');
  assert.equal(input.tagName, 'INPUT');
  assert.equal(input.closest('.sentence'), a.query('.sentence'), 'the input sits inside the sentence');
  assert.equal(input.getAttribute('aria-label'), 'Missing word');
  assert.equal(input.getAttribute('maxlength'), '40');
  assert.equal(input.hasAttribute('readonly'), true, 'A to Z keys feed the gap without the device keyboard');
  assert.equal(input.getAttribute('inputmode'), 'none');
  assert.match(input.getAttribute('style'), /--gap-ch:6\b/, 'width starts one letter wider than the longest bank word (APPLE), never under six');
  for (const key of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) a.click(`[data-key="${key}"]`);
  assert.equal(input.style.getPropertyValue('--gap-ch'), '9', 'the gap grows with the draft');
  for (let i = 0; i < 8; i++) a.click('[data-key="Backspace"]');
  assert.equal(input.value, '');
  assert.equal(input.style.getPropertyValue('--gap-ch'), '6', 'and shrinks back to its base width, never below it');
  assert.equal(a.query('.word-tile.gap'), null, 'no separate gap tile');
  assert.equal(a.query('.typing-row'), null); assert.equal(a.query('.word-label'), null); assert.equal(a.query('#keyboard-toggle'), null);
  assert.equal(a.query('#task .word-tabs'), null, 'no activity tab row on the task'); assert.equal(a.query('#choose-puzzle'), null, 'no header chooser');
  assert.equal(a.query('#support').textContent, 'Missing word');
  assert.equal(a.query('#activity-title').textContent, 'Missing word');
  assert.equal(a.query('#instruction').textContent, '');
  assert.equal(a.query('#speech').textContent, 'Type the missing word.');
  assert.equal(a.query('#task .choice-label'), null);
  assert.deepEqual(Array.from(a.query('#hear-model').children).map(el => el.textContent), ['NOOK', 'EATS', 'AN'], 'the sentence words form the one Hear button');
  assert.equal(a.w.document.querySelectorAll('.sentence .word-tile').length, 0, 'sentence words are plain text');
  const row = a.query('.key-actions');
  assert.deepEqual(Array.from(row.children).map(b => b.dataset.key || b.id), ['Backspace', 'check-word'], 'Delete, then Enter; no Clear');
  assert.equal(row.parentElement, a.query('.keyboard'));
  assert.equal(a.query('[data-key="Clear"]'), null);
  assert.equal(a.query('.key.space'), null, 'no Space on Missing word');
  assert.equal(a.w.document.querySelectorAll('.keyboard [data-key]').length, 27);
  assert.equal(a.w.document.activeElement, input, 'the gap holds focus so its caret shows');
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  assert.equal(input.value, 'APPLE');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, keyboard: 'device' });
  assert.equal(a.query('#word-input').hasAttribute('readonly'), false);
  assert.equal(a.query('#word-input').getAttribute('inputmode'), null);
  assert.equal(a.query('#word-input').value, 'APPLE', 'switching keyboards keeps the draft');
  assert.equal(a.w.document.querySelectorAll('.keyboard [data-key]').length, 1, 'only Delete remains with the device keyboard');
  assert.ok(a.query('.keyboard.actions-only #check-word'), 'Enter stays visible');
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
  assert.equal(a.query('#word-input'), null, 'a finished sentence shows the word as a filled tile');
  assert.ok(a.query('.sentence .word-tile.filled'));
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type', keyboard: 'az' });
  wordTab(a, 'numbers');
  assert.equal(a.query('#word-input').tagName, 'INPUT');
  assert.deepEqual(Array.from(a.query('.key-actions').children).map(b => b.dataset.key || b.id), ['Space', 'Backspace', 'check-word'], 'Number words adds Space before Delete and Enter');
});

test('Blocks keeps its named Sound control and named block controls; the Garden frame has no Sound control, and Nook itself is a button holding the round-4 rig', t => {
  const a = app(t);
  assert.equal(a.query('[data-sound]'), null);
  assert.equal(a.query('.name-tag'), null, 'no name tag: Nook itself is the button');
  assert.equal(a.query('#nook').tagName, 'BUTTON');
  assert.equal(a.query('#nook').getAttribute('aria-label'), 'Nook');
  assert.ok(a.query('#nook > .nook-pos > svg.nook[aria-hidden="true"]'), 'the phase-1 rig inside its position wrapper, decorative');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'the resting look: the hello face with both arms down');
  const b = app(t, 'blocks.html');
  assert.equal(b.query('[data-sound]').textContent, '♪ Sound: off');
  b.click('[data-sound]');
  assert.equal(b.query('[data-sound]').textContent, '♪ Sound: on');
  assert.equal(b.query('[data-sound]').getAttribute('aria-pressed'), 'true');
  const down = b.query('[data-action="down"]');
  assert.equal(down.childNodes[1].textContent, 'Down');
  assert.equal(down.querySelector('small').textContent, 'hold');
  assert.match(down.getAttribute('aria-label'), /Hold to move faster/);
  const css = fs.readFileSync(path.join(root, 'blocks-live.css'), 'utf8');
  assert.match(css, /\.overlay \.primary\{flex:0 0 auto/, 'Keep playing no longer inherits flex:1 inside the vertical overlay');
  // Phase 8 (two audiences): the shelf button top-left, as in every game; Player, Grown-ups and the pace are behind the hold.
  assert.deepEqual(Array.from(b.w.document.querySelectorAll('header button'), x => x.id), ['shelf-open']);
  assert.equal(b.query('#shelf-open').getAttribute('aria-label'), 'Nook’s games');
  assert.ok(b.query('#shelf-open svg'), 'the shelf icon');
  assert.equal(b.query('header').firstElementChild, b.query('#shelf-open'), 'top-left');
  for (const sel of ['[data-player]', '[data-settings]', '#pace', 'header a[href]']) assert.equal(b.query(sel), null, sel + ' is gone from the play screen');
});

test('the frame stylesheet: phone portrait, phone landscape under 520 px tall and tablet layouts, a fixed two-slot action bar 20 px clear of the bottom, a 96 px answer row, zoom left on, and play-screen guards', t => {
  const css = fs.readFileSync(path.join(root, 'frame.css'), 'utf8');
  assert.match(css, /@media \(orientation:landscape\) and \(max-height:520px\)\{/);
  assert.match(css, /@media \(min-width:760px\) and \(min-height:521px\)\{/);
  assert.match(css, /\.nf-actions\{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:62px;gap:10px;padding:10px 12px 20px\}/);
  const land = css.slice(css.indexOf('@media (orientation:landscape) and (max-height:520px){'));
  assert.match(land, /\.nf\{grid-template-columns:124px minmax\(0,1fr\) 124px;grid-template-rows:52px minmax\(0,1fr\);gap:0 8px;padding:0 8px 8px/);
  assert.match(land, /\.nf-actions\{[^}]*padding:0 0 12px\}/, 'with the frame padding, Next stays 20 px clear of the bottom');
  assert.match(land, /\.nf\.words \.nf-nook\{display:none\}/, 'landscape Words folds the bubble into the card');
  assert.match(css, /\.answers\{[^}]*min-height:96px/);
  assert.match(css, /\.answer\{[^}]*min-height:96px/);
  assert.match(css, /html\.lp-frame body\{[^}]*user-select:none[^}]*-webkit-touch-callout:none/, 'no text selection or long-press callout');
  assert.match(css, /html\.lp-frame,html\.lp-frame body\{[^}]*overscroll-behavior:none/, 'no pull-to-refresh');
  assert.match(css, /\.nf\{height:var\(--app-h\)/, 'the frame follows the visual viewport');
  assert.match(css, /\.nf-task>\.task\{[^}]*overflow-y:auto/, 'when the viewport shrinks, the card scrolls inside the frame');
  for (const page of ['index.html', 'garden.html', 'shapes.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /<html lang="en" class="lp-frame">/, page);
    assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover/, page);
    assert.doesNotMatch(html, /user-scalable|maximum-scale/, page + ': zoom stays on');
    assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/, page);
  }
});

test('take away lives inside Add: one group with the eaten apples crossed out, the same answer modes, its own place, and restore by id', t => {
  const a = app(t);
  goTo(a, 'add');
  assert.equal(a.store('garden-position').operation, 'add', 'Add or Take away, as the list started it');
  a.click('#next');
  const L = a.w.GardenLearning, eq = (op, i) => { const [x, y] = L.sumSequence(1, op)[i]; return new RegExp(x + ' ' + (op === 'take' ? '−' : '\\+') + ' ' + y + ' = \\?'); };
  assert.match(a.query('.equation').textContent, eq('add', 1));
  goTo(a, 'add', 'take');
  assert.equal(a.store('garden-position').operation, 'take');
  assert.match(a.query('.equation').textContent, /2 − 1 = \?/, 'take away opens on a plain sum, never on taking everything');
  assert.equal(a.w.document.querySelectorAll('.take-one .fruit').length, 2, 'one group: the apples Nook started with');
  assert.equal(a.w.document.querySelectorAll('.take-one .fruit.gone').length, 1, 'and the eaten one is crossed out');
  assert.equal(a.query('.take-result'), null, 'no second group, basket or labels');
  assert.equal(a.query('#task .group-label'), null);
  assert.equal(a.query('#activity-title').textContent, 'Take away 1. How many left?');
  assert.equal(a.query('#speech').textContent, 'Nook eats one. How many are left?');
  a.click('[data-choice="1"]');
  assert.match(a.query('#speech').textContent, /2 − 1 = 1\./);
  assert.equal(a.w.document.querySelectorAll('.take-one .fruit.away').length, 1, 'after the answer the eaten apple vanishes in place');
  a.click('#next');
  const second = L.sumSequence(1, 'take')[1];
  assert.match(a.query('.equation').textContent, eq('take', 1));
  assert.equal(a.w.document.querySelectorAll('.take-one .fruit:not(.gone)').length, second[0] - second[1]);
  assert.equal(a.w.document.querySelectorAll('.take-one .fruit.gone').length, second[1], 'eaten apples are crossed from the end');
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.take-one .count-tag').length, second[0] - second[1], 'the clue numbers what is left, never the eaten apples');
  goTo(a, 'add', 'add');
  assert.match(a.query('.equation').textContent, eq('add', 1), 'switching back returns to the same sum');
  goTo(a, 'add', 'take');
  assert.match(a.query('.equation').textContent, eq('take', 1), 'take away kept its own place');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  for (const d of String(second[0] - second[1])) a.click(`[data-pad="${d}"]`);
  a.click('#check-sum');
  assert.match(a.query('#speech').textContent, new RegExp(second[0] + ' − ' + second[1] + ' = ' + (second[0] - second[1]) + '\\.'));
  parentLevels(a);
  assert.equal(a.query('.operation-picker [data-close]'), null);
  assert.equal(a.w.document.querySelector('.operation-picker button[aria-pressed="true"]').textContent, 'Take away');
  const form = a.query('#pick-sum'); form.elements.a.value = '2'; form.elements.b.value = '4';
  a.submit('#pick-sum');
  assert.match(a.query('#sum-error').textContent, /cannot take more/);
  form.elements.a.value = '4'; form.elements.b.value = '2'; a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /4 − 2 = \?/);
  assert.equal(a.store('garden-rounds').add.id, 'add:v2:L1:take:4-2');
  const b = app(t, 'garden.html', {
    'lp-player-player-1-garden-position': { mode: 'add', operation: 'take', levels: { add: 1 }, indices: { take: L.sumSequence(1, 'take').findIndex(([x, y]) => x === 2 && y === 1) } },
    'lp-player-player-1-garden-rounds': { add: { id: 'add:v2:L1:take:2-1', a: 2, b: 1, draft: '', hint: 1, done: false } }
  });
  assert.match(b.query('.equation').textContent, /2 − 1 = \?/);
  assert.equal(b.w.document.querySelectorAll('.take-one .count-tag').length, 1, 'the clue step came back with the round');
});

test('Add levels 3 and 4 use two ten-frames (the added part dashed; Help fills the ten first, then counts on), level 5 keeps rows of ten, take away keeps its rows, and the keypad takes three digits', t => {
  const a = app(t);
  goTo(a, 'add'); parentLevels(a);
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  assert.match(levels[2].textContent, /no crossing ten/);
  levels[2].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Up to 20');
  assert.match(a.query('.equation').textContent, /10 \+ 1 = \?/);
  assert.equal(a.w.document.querySelectorAll('.ten-pair .five-frame').length, 2, 'two ten-frames');
  assert.equal(a.w.document.querySelectorAll('.five-frame.first .pocket.full').length, 10, 'the ten is a full frame');
  assert.equal(a.w.document.querySelectorAll('.five-frame.second .fruit.new').length, 1, 'the apple that came is marked, not transformed');
  assert.equal(a.query('.sum-result'), null, 'no third drawing of the same apples');
  assert.equal(a.query('.stick'), null, 'no rows of ten before level 5');
  a.click('#help');
  assert.equal(a.query('.ten-badge').textContent, '10', 'Help names the full ten');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.ten-pair .count-tag'), el => el.textContent), ['11'], 'then counts on');
  assert.equal(a.query('#speech').textContent, 'Count them all with me.');
  a.click('[data-choice="11"]');
  assert.match(a.query('#speech').textContent, /10 \+ 1 = 11\./);
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[3].click(); a.click('[data-close]');
  parentLevels(a);
  const pick = a.query('#pick-sum'); pick.elements.a.value = '8'; pick.elements.b.value = '7'; a.submit('#pick-sum');
  assert.match(a.query('.equation').textContent, /8 \+ 7 = \?/);
  assert.equal(a.query('#speech').textContent, 'Eight, then seven more. How many?', 'the prompt does not give the strategy away');
  assert.ok(a.query('.ten-pair .five-frame.second.more'), 'the added frame is dashed');
  assert.equal(a.w.document.querySelectorAll('.five-frame.first .fruit').length, 8);
  assert.equal(a.w.document.querySelectorAll('.five-frame.second .fruit.new').length, 7);
  a.click('#help');
  assert.equal(a.query('#speech').textContent, 'Fill the ten first.', '"Fill the ten first" is the Help line');
  assert.equal(a.w.document.querySelectorAll('.five-frame.first .fruit').length, 10, 'two apples move across');
  assert.equal(a.w.document.querySelectorAll('.five-frame.first .fruit.new.moved').length, 2, 'their dashed outlines travel with them');
  assert.equal(a.w.document.querySelectorAll('.five-frame.first .fruit.arrive').length, 2, 'they arrive (the one place Add moves)');
  assert.equal(a.w.document.querySelectorAll('.five-frame.second .fruit').length, 5);
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.five-frame.second .count-tag'), el => el.textContent), ['11', '12', '13', '14', '15']);
  assert.match(a.query('#status').textContent, /Fill the ten first: 8 and 2 make 10\. Then count on: 11 to 15\./);
  a.click('#help');
  assert.ok(a.query('[data-choice="15"].hint'));
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[4].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Tens');
  assert.match(a.query('.equation').textContent, /10 \+ 10 = \?/);
  assert.equal(a.w.document.querySelectorAll('.group.rows .stick').length, 2, 'a row of ten in each group');
  assert.equal(a.w.document.querySelectorAll('.group.rows.more .stick').length, 1, 'the row that came sits in the dashed outline');
  assert.equal(a.w.document.querySelectorAll('.group.rows .stick i.apple').length, 20, 'every row shows its ten apples');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => Number(b.dataset.choice) % 10 === 0));
  a.click('#help');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.group.rows .count-tag'), el => el.textContent), ['10', '20'], 'Help counts in tens across both groups');
  goTo(a, 'add', 'take');
  assert.match(a.query('.equation').textContent, /20 − 10 = \?/);
  assert.equal(a.w.document.querySelectorAll('.take-one .stick').length, 2, 'two rows of ten');
  assert.equal(a.w.document.querySelectorAll('.take-one .stick i.apple.gone').length, 10, 'every apple in the last row crossed out');
  assert.equal(a.query('.take-one .stick b'), null, 'no 10 badge on a row that is being taken from');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, addition: 'type' });
  parentLevels(a);
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
  assert.equal(a.query('#check-sum').disabled, true, 'the keypad rests until Again or Next');
});

test('the Add picker offers Doubles and Make ten; Next cycles inside the set and a level choice leaves it', t => {
  const a = app(t);
  goTo(a, 'add'); goTo(a, 'add', 'take'); parentLevels(a);
  const sets = a.w.document.querySelectorAll('.set-picker button');
  assert.equal(sets.length, 2);
  assert.match(sets[0].textContent, /Doubles/); assert.match(sets[1].textContent, /Make ten/);
  sets[0].click();
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.store('garden-position').operation, 'add', 'sets are addition');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/);
  assert.equal(a.query('#support').textContent, 'Doubles');
  assert.match(a.query('#support').getAttribute('aria-label'), /Doubles, 1 of 5/);
  assert.equal(a.query('#next-level'), null);
  a.click('[data-choice="2"]'); a.click('#next');
  assert.match(a.query('.equation').textContent, /2 \+ 2 = \?/);
  assert.match(a.query('#support').getAttribute('aria-label'), /Doubles, 2 of 5/);
  for (let i = 0; i < 3; i++) { a.click('#next'); }
  assert.match(a.query('.equation').textContent, /5 \+ 5 = \?/, 'the set includes 5 + 5 even though the level is 1');
  a.click('#next');
  assert.match(a.query('.equation').textContent, /1 \+ 1 = \?/, 'the set wraps');
  assert.deepEqual(a.store('garden-position').selection.addSet, { set: 'doubles', index: 0 });
  parentLevels(a);
  a.w.document.querySelectorAll('.set-picker button')[1].click();
  assert.match(a.query('.equation').textContent, /9 \+ 1 = \?/);
  parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[0].click(); a.click('[data-close]');
  assert.equal(a.store('garden-position').selection.addSet, undefined, 'choosing a level leaves the set');
  assert.equal(a.query('#support').textContent, 'Up to 5');
  const b = app(t, 'garden.html', { 'lp-player-player-1-garden-position': { mode: 'add', operation: 'take', selection: { addSet: { set: 'ten', index: 3 } } } });
  assert.match(b.query('.equation').textContent, /6 \+ 4 = \?/, 'a saved set restores at its place');
});

test('Count levels 3 to 6: a full ten-frame first, then sticks; Count with me counts tens then ones with spoken running totals; the keypad is optional', async t => {
  const a = app(t);
  parentLevels(a);
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  levels[2].click();
  assert.equal(a.w.document.querySelectorAll('.puzzle-picker button').length, 10, 'level 3 offers 11 to 20');
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '13').click();
  assert.equal(a.query('#support').textContent, '11–20');
  assert.ok(a.query('.tray.counting'));
  assert.equal(a.w.document.querySelectorAll('button.five-frame.ten[data-stick]').length, 1, 'the ten is one tappable full frame');
  assert.equal(a.query('button.five-frame.ten').querySelectorAll('.pocket.full').length, 10);
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 3);
  assert.equal(a.query('.stick'), null, 'no sticks until a level has established the ten');
  a.w.LP.setSound(true);
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
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[3].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, '10 20 30');
  assert.ok(a.w.document.querySelectorAll('button.stick').length >= 1, 'tens to 50 are sticks');
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 0, 'nothing loose at level 4');
  a.click('#help');
  assert.equal(a.query('button.stick.counted .count-tag').textContent, '10');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, countAnswer: 'type' });
  parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[5].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '73').click();
  assert.equal(a.w.document.querySelectorAll('button.stick').length, 7);
  assert.equal(a.w.document.querySelectorAll('button.pocket[data-fruit]').length, 3);
  assert.ok(a.query('#check-sum'), 'the keypad is available at any level');
  for (const key of ['7', '3']) a.click(`[data-pad="${key}"]`);
  assert.equal(a.query('.count-answer .typed').textContent, '73');
  a.click('#check-sum');
  assert.match(a.query('#speech').textContent, /73 apples\./);
  goTo(a, 'add'); goTo(a, 'count');
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
  goTo(b, 'count');
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
  goTo(a, 'words'); wordTab(a, 'numbers'); parentLevels(a);
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 4);
  levels[3].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '100').click();
  assert.equal(a.query('#support').textContent, 'Number words · 10–100');
  assert.equal(a.w.document.querySelectorAll('.tray .stick').length, 10, 'one hundred is ten sticks');
  assert.equal(a.query('.tray').getAttribute('role'), 'img');
  assert.equal(a.query('.number-total').textContent, '100');
  assert.ok(a.query('[data-choice="ONE HUNDRED"]'));
  a.click('[data-choice="ONE HUNDRED"]');
  assert.match(a.query('#speech').textContent, /ONE HUNDRED\./);
  assert.match(a.query('.number-model').textContent, /ONE HUNDRED/);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[2].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '13').click();
  assert.equal(a.w.document.querySelectorAll('.tray .five-frame.ten').length, 2, 'a teen is a full ten-frame plus a second frame');
  assert.equal(a.query('.stick'), null);
  assert.equal(a.query('#support').textContent, 'Number words · 11–20');
  for (const key of ['T', 'H', 'I', 'R', 'T', 'E', 'E', 'N']) a.click(`[data-key="${key}"]`);
  a.click('#check-word');
  assert.match(a.query('#speech').textContent, /THIRTEEN\./);
  parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[3].click();
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === '100').click();
  for (const key of ['O', 'N', 'E', 'Space', 'H', 'U', 'N', 'D', 'R', 'E', 'D']) a.click(`[data-key="${key}"]`);
  assert.equal(a.query('#word-input').value, 'ONE HUNDRED');
  a.click('#check-word');
  assert.equal(a.query('#next').hidden, false);
});

test('two-gap patterns: gaps are buttons, the chosen gap takes the piece, partial fills are kept, and the last piece finishes', t => {
  const a = app(t);
  goTo(a, 'patterns'); parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[7].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Level 8');
  assert.equal(a.query('.repeat-label'), null, 'from level 8 the unit is not spelt out');
  const round = a.store('garden-rounds').patterns;
  const gaps = a.w.document.querySelectorAll('button[data-gap]');
  assert.equal(gaps.length, 2);
  assert.equal(a.query('button[data-gap].active').dataset.gap, String(round.gaps[0]));
  gaps[1].click();
  assert.equal(a.query('button[data-gap].active').dataset.gap, String(round.gaps[1]));
  assert.equal(a.store('garden-rounds').patterns.selected, round.gaps[1]);
  const wrong = Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== round.sequence[round.gaps[1]]);
  if (wrong) { wrong.click(); assertRetry(a); }
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
    'lp-player-player-1-garden-position': { mode: 'patterns', levels: { patterns: 8 }, indices: { patterns: 0 }, strip: 1, patternFamily: 0 },
    'lp-player-player-1-garden-rounds': { patterns: { id: round.id, sequence: round.sequence, gaps: round.gaps, filled: { [round.gaps[0]]: round.sequence[round.gaps[0]], [round.gaps[1]]: 'nonsense' }, selected: 99, done: false } }
  });
  assert.deepEqual(b.store('garden-rounds').patterns.filled, { [round.gaps[0]]: round.sequence[round.gaps[0]] }, 'only correct fills restore');
  assert.equal(b.query('button[data-gap].active').dataset.gap, String(round.gaps[1]));
});

test('growing, mirror and number patterns are named rules with their own hints, clues and answers; ten beads keep reading order', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, choices: 3 });
  goTo(a, 'patterns'); parentLevels(a);
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
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[11].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Level 12 · Growing');
  assert.equal(a.query('#activity-title').textContent, 'The pattern grows');
  assert.equal(a.query('.repeat-label').textContent, 'Each group has one more bead.');
  assert.equal(a.w.document.querySelectorAll('.bead-group').length, 4);
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.bead-group')).map(g => g.querySelectorAll('.bead-slot').length), [1, 2, 3, 4]);
  a.click('#help');
  assert.equal(a.w.document.querySelectorAll('.bead-group.emphasis').length, 4);
  a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`);
  assert.match(a.query('#speech').textContent, /The pattern fits\./);
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[12].click(); a.click('[data-close]');
  assert.equal(a.query('#activity-title').textContent, 'The pattern turns around');
  assert.ok(a.query('.mirror-line'));
  const mirror = a.store('garden-rounds').patterns;
  a.click('#help');
  const twin = a.w.document.querySelectorAll('.bead-slot')[mirror.sequence.length - 1 - mirror.gaps[0]];
  assert.ok(twin.classList.contains('emphasis'), 'the clue outlines the mirrored bead');
  a.click(`[data-choice="${mirror.answer}"]`);
  assert.equal(a.query('#next').hidden, false);
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[13].click(); a.click('[data-close]');
  assert.equal(a.query('#activity-title').textContent, 'What number comes next?');
  const number = a.store('garden-rounds').patterns;
  assert.match(a.query('.repeat-label').textContent, /^Count on in (ones|twos|fives|tens)\.$/);
  assert.equal(a.w.document.querySelectorAll('.bead-slot.number').length, 5);
  assert.equal(a.w.document.querySelectorAll('#task .shape').length, 0, 'number beads carry numerals, not shapes');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => /^\d+$/.test(b.dataset.choice)));
  a.click('#help');
  assert.match(a.query('#status').textContent, /Count on in/);
  a.click(`[data-choice="${number.answer}"]`);
  assert.match(a.query('#speech').textContent, /The pattern fits\./);
  assert.equal(a.query('#next-level'), null, 'no Next level anywhere');
});

test('the missing part level shows the joined group with the hidden part outlined and asks how many joined', t => {
  const a = app(t);
  goTo(a, 'add'); parentLevels(a);
  const levels = a.w.document.querySelectorAll('.level-picker button');
  assert.equal(levels.length, 6);
  assert.match(levels[5].textContent, /missing part/);
  levels[5].click(); a.click('[data-close]');
  const r = a.store('garden-rounds').add;
  assert.equal(r.missing, true);
  assert.equal(a.query('#support').textContent, 'Missing part');
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
    goTo(a, 'add', 'take');
  assert.equal(a.query('#support').textContent, 'Tens', 'take away has no missing-part level');
  assert.equal(a.store('garden-position').operation, 'take', 'Add or Take away, as the list started it');
  parentLevels(a);
  assert.equal(a.w.document.querySelectorAll('.level-picker button').length, 5);
});

test('grown-up sentences join Missing word and Word order with a chosen gap, distractors, no picture and the local voice', async t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, customSentences: ['Arthur likes TRAINS.', 'We go to the PARK.'] });
  goTo(a, 'words'); parentLevels(a);
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
  a.w.LP.setSound(true);
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
  wordTab(a, 'order'); parentLevels(a);
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === 'WE GO TO THE PARK.').click();
  assert.equal(a.w.document.querySelectorAll('[data-tile]').length, 5);
  for (const word of ['WE', 'GO', 'TO', 'THE', 'PARK']) Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === word && !b.disabled).click();
  assert.equal(a.query('#next').hidden, false);
});

test('the bath-time bank offers five-word sentences for Word order and keeps stable tile positions', t => {
  const a = app(t);
  goTo(a, 'words'); wordTab(a, 'order'); parentLevels(a);
  Array.from(a.w.document.querySelectorAll('.puzzle-picker button')).find(b => b.textContent === 'THE BIG DOG CAN RUN.').click();
  const tiles = Array.from(a.w.document.querySelectorAll('[data-tile]'));
  assert.equal(tiles.length, 5);
  const order = tiles.map(b => b.textContent);
  Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === 'THE').click();
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('[data-tile]')).map(b => b.textContent), order, 'tiles keep their places');
  a.click('#hear-model');
});

test('Make your own pattern (from the Patterns list under the shelf tile): beads are added, removed and read back, the string is saved, and there is no right answer, Help or Next', async t => {
  const a = app(t);
  goTo(a, 'patterns');
  assert.equal(a.query('[data-pattern-mode]'), null, 'no tab row on the play screen');
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="patterns"]');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('#shelf-overlay .menu-tile'), b => b.dataset.activity + ' ' + b.querySelector('.menu-word').textContent), ['finish Finish the pattern', 'make Make your own']);
  assert.equal(a.query('#shelf-overlay [data-activity="finish"]').getAttribute('aria-current'), 'true');
  assert.equal(a.w.document.querySelectorAll('#shelf-overlay [data-activity="finish"] .menu-art svg circle').length, 2, 'Finish the pattern: beads on a string, the last one missing');
  assert.ok(a.query('#shelf-overlay [data-activity="finish"] .menu-art svg rect[stroke-dasharray]'));
  assert.equal(a.query('#shelf-overlay [data-activity="make"]').getAttribute('aria-current'), null);
  a.click('#shelf-overlay [data-activity="make"]');
  assert.equal(a.query('#shelf-overlay').hidden, true);
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.store('garden-position').patternMode, 'make');
  assert.equal(a.query('#support').textContent, 'Make your own');
  assert.equal(a.query('#activity-title').textContent, 'Make your own pattern');
  assert.equal(a.query('#next').hidden, true); assert.equal(a.query('#help').hidden, true); assert.equal(a.query('#repeat').hidden, true);
  assert.equal(a.w.document.querySelectorAll('[data-add]').length, 5);
  assert.equal(a.w.document.querySelectorAll('.bead-slot.empty').length, 10);
  a.click('[data-add="circle"]'); a.click('[data-add="square"]'); a.click('[data-add="circle"]');
  assert.deepEqual(a.store('garden-rounds').make.beads, ['circle', 'square', 'circle']);
  assert.equal(a.query('#readback').textContent, 'Circle, Square, Circle.');
  assert.equal(a.w.document.querySelectorAll('button[data-bead]').length, 3);
  a.w.LP.setSound(true); a.click('#read-back');
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
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="patterns"]');
  assert.equal(a.query('#shelf-overlay [data-activity="make"]').getAttribute('aria-current'), 'true', 'the list marks the activity playing now');
  a.click('#shelf-overlay [data-activity="finish"]');
  assert.ok(a.query('button[data-gap], .bead-slot.missing'), 'finishing a pattern is unchanged');
  goTo(a, 'patterns', 'make');
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
  goTo(a, 'add'); parentLevels(a);
  a.w.document.querySelectorAll('.level-picker button')[2].click(); a.click('[data-close]');
  const classes = Array.from(a.w.document.querySelectorAll('[data-choice]')).map(b => [b.dataset.choice, b.className]);
  for (const [value, cls] of classes) assert.equal(/digits-2/.test(cls), value.length === 2, value);
  parentLevels(a); a.w.document.querySelectorAll('.level-picker button')[4].click(); a.click('[data-close]');
  parentLevels(a);
  const form = a.query('#pick-sum'); form.elements.a.value = '50'; form.elements.b.value = '50'; a.submit('#pick-sum');
  assert.ok(a.query('[data-choice="100"].digits-3'));
  goTo(a, 'count');
  assert.ok(Array.from(a.w.document.querySelectorAll('[data-choice]')).every(b => !/digits/.test(b.className)), 'single digits keep the approved size');
  const frame = fs.readFileSync(path.join(root, 'frame.css'), 'utf8'), css = fs.readFileSync(path.join(root, 'garden.css'), 'utf8');
  assert.match(frame, /\.answer\{[^}]*display:inline-flex[^}]*white-space:nowrap/, 'numerals lay out with flex, never grid, inside a button');
  assert.match(frame, /html\.lp-frame body\{[^}]*text-size-adjust:100%/);
  assert.match(css, /\.equation span\{letter-spacing:0\}/);
});

test('the typing keyboard sounds each letter phonetically, only while sound is on, without touching the draft', async t => {
  const a = app(t);
  goTo(a, 'words');
  a.click('[data-key="A"]');
  assert.equal(a.plays.length, 0, 'sound off stays silent');
  a.w.LP.setSound(true);
  a.click('[data-key="P"]');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.puh.file);
  assert.equal(a.spoken.length, 0);
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'l', bubbles: true }));
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips[L.LETTER_SOUNDS.L].file, 'hardware keys sound too');
  a.click('[data-key="Backspace"]');
  assert.equal(a.plays.length, 2, 'delete and space are silent');
  assert.equal(a.query('#word-input').value, 'AP');
  assert.equal(Object.keys(L.LETTER_SOUNDS).length, 26);
});

test('the task names the current view, and the Words keyboard is seven to a row on a narrow portrait phone and ten to a row in landscape', t => {
  const a = app(t);
  assert.equal(a.query('#task').dataset.view, 'count');
  goTo(a, 'add'); assert.equal(a.query('#task').dataset.view, 'add');
  goTo(a, 'words'); assert.equal(a.query('#task').dataset.view, 'sentence');
  assert.ok(a.query('#page').classList.contains('words'), 'the frame knows it is showing Words, so landscape can fold the bubble');
  wordTab(a, 'numbers'); assert.equal(a.query('#task').dataset.view, 'numbers');
  goTo(a, 'patterns', 'make'); assert.equal(a.query('#task').dataset.view, 'make');
  assert.ok(!a.query('#page').classList.contains('words'));
  const css = fs.readFileSync(path.join(root, 'garden.css'), 'utf8');
  assert.match(css, /\.keyboard\{display:grid;grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/, 'seven to a row: 7, 7, 7, then V to Z with Delete and Enter');
  const land = css.slice(css.indexOf('@media (orientation:landscape) and (max-height:520px){'));
  assert.match(land, /\.keyboard\{grid-template-columns:repeat\(10,minmax\(0,1fr\)\)/, 'ten by three in landscape');
  assert.match(land, /\.key\.function,\.key\.go\{grid-column:span 2\}/, 'U to Z, Delete and Enter fill the third row');
  assert.match(land, /button\.word-card\{flex-direction:row/, 'card pictures beside their words in landscape');
  assert.match(css, /\.key\{[^}]*min-height:44px/, 'keys are at least 44 px tall');
  assert.match(css, /\.key-actions\{display:contents\}/, 'Delete and Enter sit in the last row of the letters');
  assert.doesNotMatch(css, /caret-color:transparent/, 'the caret is visible in the gap');
});

test('caret and selection survive a clue, the shelf’s list and a settings change; Delete removes the selection; physical letters, Backspace and Enter work', t => {
  const a = app(t);
  goTo(a, 'words');
  for (const key of ['A', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  const input = () => a.query('#word-input');
  input().setSelectionRange(2, 2); input().dispatchEvent(new a.w.Event('select', { bubbles: true }));
  a.click('#help');
  assert.equal(input().selectionStart, 2, 'a clue does not move the caret');
  wordTab(a, 'sentence');
  assert.equal(a.query('.lp-modal'), null);
  assert.deepEqual([input().selectionStart, input().selectionEnd], [2, 2], 'carrying on from the shelf’s list keeps the caret');
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
  a.w.LP.setSound(true);
  const before = a.plays.length;
  a.click('[data-key="Backspace"]'); a.click('[data-key="Backspace"]');
  assert.equal(input().value, '');
  assert.equal(a.plays.length, before, 'Delete is silent');
  assert.equal(a.query('[data-key="Clear"]'), null, 'no Clear key beside Enter');
  assert.equal(a.store('garden-rounds').sentence.draft, '');
  a.click('#check-word');
  assert.equal(a.query('#status').textContent, 'Type a word first.');
  assert.equal(a.query('#speech').textContent, 'Type the missing word.');
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(a.query('#next').hidden, false, 'the physical Enter key checks the word');
});

test('Levels and puzzles (in Grown-ups) lists the four Word activities first, switches between them without losing drafts, and returns focus to the task', async t => {
  const a = app(t);
  goTo(a, 'words');
  for (const key of ['A', 'P']) a.click(`[data-key="${key}"]`);
  parentLevels(a);
  const tabs = Array.from(a.w.document.querySelectorAll('.lp-modal .picker-tabs button'));
  assert.deepEqual(tabs.map(b => b.textContent), ['Missing word', 'Missing letter', 'Word order', 'Number words']);
  assert.equal(tabs[0].getAttribute('aria-pressed'), 'true');
  assert.equal(a.query('.lp-modal .picker-tabs'), a.query('#picker-content').firstElementChild, 'activities come first');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button').length, L.SENTENCES.length);
  a.click('.lp-modal [data-word-tab="letter"]');
  assert.ok(a.query('.lp-modal'), 'the picker stays open');
  assert.equal(a.query('#support').textContent, 'Missing letter');
  assert.equal(a.query('#task').dataset.view, 'letter');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button').length, L.PICTURES.length, 'the list follows the chosen activity');
  assert.equal(a.query('.lp-modal [data-word-tab="letter"]').getAttribute('aria-pressed'), 'true');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  a.click('.lp-modal [data-word-tab="numbers"]');
  assert.ok(a.query('.lp-modal .level-picker'), 'Number words keeps its level row');
  a.click('[data-close]');
  a.click('[data-key="O"]');
  assert.equal(a.query('#word-input').value, 'O');
  parentLevels(a); a.click('.lp-modal [data-word-tab="sentence"]'); a.click('[data-close]');
  assert.equal(a.query('#word-input').value, 'AP', 'the Missing word draft survived the visit to Number words');
  assert.equal(a.w.document.activeElement, a.query('#word-input'), 'focus returns to the task');
  parentLevels(a);
  Array.from(a.w.document.querySelectorAll('.lp-modal .puzzle-picker button')).find(b => b.textContent === 'THE SUN IS HOT.').click();
  assert.equal(a.query('.lp-modal'), null, 'choosing a sentence closes the picker');
  assert.equal(a.query('.sentence').getAttribute('aria-label'), 'the blank is hot');
  assert.equal(a.w.document.activeElement, a.query('#word-input'));
  assert.deepEqual(Array.from(a.query('#hear-model').children).map(el => el.textContent), ['THE'], 'the words before the gap form the Hear button');
  assert.deepEqual(Array.from(a.query('[data-hear]').children).map(el => el.textContent), ['IS', 'HOT'], 'the words after the gap follow it');
  a.w.LP.setSound(true); a.click('[data-hear] span'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['the blank is hot'].file, 'a tap on the later words hears the sentence too');
  wordTab(a, 'numbers');
  assert.equal(a.query('#word-input').value, 'O');
  assert.equal(a.query('#support').textContent, 'Number words · 1–5');
});

test('a familiar sentence without pictures: the first clue reads the sentence with blank, and a wrong word says to read it once more', t => {
  const a = app(t);
  a.w.LP.savePrefs({ ...a.w.LP.prefs, customSentences: ['Arthur likes TRAINS.', 'We go to the PARK.', 'Nana has a KITE.'] });
  goTo(a, 'words'); parentLevels(a);
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
  assertRetry(a);
});

test('Missing letter, Word order and Number words follow the same discipline: small heading, one prompt in the bubble, the word or sentence is the Hear control, sound-gated', async t => {
  const a = app(t);
  goTo(a, 'words'); wordTab(a, 'letter');
  assert.equal(a.query('#activity-title').textContent, 'Missing letter');
  assert.equal(a.query('#speech').textContent, 'Tap the missing letter.');
  assert.equal(a.query('#instruction').textContent, '');
  assert.equal(a.query('#task .choice-label'), null);
  assert.equal(a.query('#hear-model .sr-only').textContent, 'Hear the word: ');
  assert.ok(a.query('#hear-model .letter-tiles'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.length, 0); assert.equal(a.query('#status').textContent, 'Sound is off. A grown-up can turn it on in Grown-ups.');
  a.w.LP.setSound(true); a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.apple.file);
  wordTab(a, 'order');
  assert.equal(a.query('#activity-title').textContent, 'Word order');
  assert.equal(a.query('#speech').textContent, 'Drag the words, first to last.');
  assert.ok(a.query('#hear-model .sentence'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips['nook eats an apple'].file);
  wordTab(a, 'numbers');
  assert.equal(a.query('#activity-title').textContent, 'Number words');
  assert.equal(a.query('#speech').textContent, 'Type the number word.', 'spelling the word is the default');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'show' });
  assert.equal(a.query('#speech').textContent, 'Read the number word.');
  assert.ok(a.query('#hear-model .number-model'));
  a.click('#hear-model'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips.one.file);
  assert.equal(a.w.document.querySelectorAll('.word-tools').length, 0, 'no tool rows or note icons');
});

test('Grown-ups: a familiar sentence that cannot be used is listed with its reason instead of dropped, and an older saved one that fails now is listed once', t => {
  const a = app(t, 'garden.html', { 'lp-player-player-1-little-patterns-v1': { customSentences: ["ARTHUR'S dog barks.", 'We go to the PARK.'] } });
  assert.deepEqual(Array.from(a.w.LP.prefs.customSentences), ['We go to the PARK.'], 'an apostrophe in the gap is no longer accepted');
  a.w.LP.settings();
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
  a.w.LP.settings();
  assert.equal(a.query('#sentence-problems').hidden, true, 'nothing is listed once every saved sentence is valid');
  assert.match(a.query('#lp-settings').textContent, /used as the wrong answers/);
  assert.match(a.query('#lp-settings').textContent, /spoken only while it is on/);
});

test('the action bar has two fixed slots in every activity: Help on the left until success, then Again; Next on the right only after success; the answers keep their row', t => {
  const a = app(t);
  const bar = a.query('.nf-actions');
  const ids = () => Array.from(bar.children).map(b => b.id);
  const slots = () => ({ help: !a.query('#help').hidden, again: !a.query('#repeat').hidden, next: !a.query('#next').hidden });
  const PLAY = { help: true, again: false, next: false }, DONE = { help: false, again: true, next: true };
  assert.deepEqual(ids(), ['help', 'repeat', 'next'], 'the three buttons live in the bar');
  assert.deepEqual(slots(), PLAY, 'no Next before an answer');
  a.click('[data-choice="1"]');
  assert.deepEqual(slots(), DONE);
  assert.equal(a.w.document.activeElement, a.query('#next'), 'focus lands on Next');
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 2, 'the answers stay in their row');
  assert.ok(a.query('[data-choice="1"].chosen')); assert.ok(a.query('.choice.faded'));
  assert.equal(a.query('#task .go-row'), null, 'Next never moves into the card');
  a.click('#next');
  assert.deepEqual(slots(), PLAY);
  goTo(a, 'add'); assert.deepEqual(slots(), PLAY); a.click('[data-choice="2"]'); assert.deepEqual(slots(), DONE);
  goTo(a, 'patterns'); assert.deepEqual(slots(), PLAY); a.click(`[data-choice="${a.store('garden-rounds').patterns.answer}"]`); assert.deepEqual(slots(), DONE);
  goTo(a, 'words'); assert.deepEqual(slots(), PLAY);
  for (const key of ['A', 'P', 'P', 'L', 'E']) a.click(`[data-key="${key}"]`);
  a.click('#check-word'); assert.deepEqual(slots(), DONE);
  assert.ok(a.query('.keyboard'), 'the keys keep their place under a finished sentence');
  assert.ok(Array.from(a.w.document.querySelectorAll('.keyboard button')).every(b => b.disabled), 'and rest until Again or Next');
  wordTab(a, 'letter'); assert.deepEqual(slots(), PLAY); a.click(`[data-choice="${a.store('garden-rounds').letter.letter}"]`); assert.deepEqual(slots(), DONE);
  wordTab(a, 'order'); assert.deepEqual(slots(), PLAY);
  for (const word of a.store('garden-rounds').order.words) Array.from(a.w.document.querySelectorAll('[data-tile]')).find(b => b.textContent === word && !b.disabled).click();
  assert.deepEqual(slots(), DONE);
  wordTab(a, 'numbers');
  assert.deepEqual(slots(), PLAY, 'Number words asks for the spelling first, so there is no Next before an answer');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'show' });
  assert.deepEqual(slots(), { help: true, again: false, next: true }, 'Number words in show mode is a reading page: Help and Next');
  goTo(a, 'patterns', 'make');
  assert.deepEqual(slots(), { help: false, again: false, next: false }, 'Make your own has neither');
  assert.deepEqual(ids(), ['help', 'repeat', 'next'], 'nothing ever moves out of the bar');
});

test('tapping a word entry reads its draft, keeps the caret, and never reads on typing focus or while muted',async t=>{
 const a=app(t);goTo(a, 'words');const input=a.query('#word-input');
 input.value='BUS';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));input.setSelectionRange(1,1);input.focus();await tick();assert.equal(a.plays.length,0);
 a.click('#word-input');await tick();assert.equal(a.plays.length,0);
 a.w.LP.setSound(true);a.click('#word-input');await tick();assert.equal(a.plays.at(-1),a.w.LPVoiceLibrary.clips.bus.file);assert.equal(input.value,'BUS');assert.equal(input.selectionStart,1);
 input.value='astronaut';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));a.click('#word-input');await tick();assert.equal(a.spoken.at(-1),'astronaut');assert.equal(a.utterances.at(-1).voice.localService,true);
});

test('round 3 saves: a first visit after the strip arrived puts Add and Patterns back to level 1; the families, the Word activities and take away’s five levels are in Levels and puzzles behind Grown-ups', t => {
  const a = app(t, 'garden.html', { 'lp-player-player-1-garden-position': { mode: 'patterns', levels: { count: 3, add: 4, patterns: 11 }, indices: {} } });
  assert.deepEqual(a.store('garden-position').levels, { count: 3, add: 1, numbers: 1, patterns: 1 }, 'Count keeps its level; Add and Patterns return to the start once');
  assert.equal(a.store('garden-position').strip, 1);
  assert.equal(a.query('#level-strip'), null);
  assert.equal(a.query('#support').textContent.trim(), '2 shapes');
  assert.equal(a.query('#support .pill-beads').children.length, 2, 'the pill shows the two bead shapes');
  assert.equal(a.store('garden-rounds').patterns.id, L.familyRound(0, a.w.LP.prefs, 2).id, 'the first puzzle is AB with the last bead missing');
  parentLevels(a);
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.lp-modal [data-family]'), b => b.textContent.trim()), ['2 shapes', '3 shapes', '4 shapes']);
  assert.equal(a.w.document.querySelectorAll('.lp-modal .level-picker button').length, 14, 'every numbered pattern level stays available');
  a.click('.lp-modal [data-family="4"]');
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(new Set(a.store('garden-rounds').patterns.unit).size, 4);
  assert.equal(a.w.document.querySelectorAll('[data-choice]').length, 4, 'a four-shape family offers its four shapes');
  assert.ok(a.query('.pattern-strip.one-row'), 'a family string is one row');
  assert.ok(a.w.document.querySelectorAll('.bead-slot').length <= 8, 'never more than eight beads');
  goTo(a, 'words'); parentLevels(a);
  assert.equal(a.w.document.querySelectorAll('.lp-modal [data-word-tab]').length, 4);
  assert.equal(a.query('.lp-modal .level-picker'), null, 'Missing word has no levels');
  a.click('.lp-modal [data-word-tab="numbers"]');
  assert.equal(a.store('garden-position').wordTab, 'numbers');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .level-picker button').length, 4, 'Number words adds its four ranges');
  a.click('[data-close]');
  goTo(a, 'add'); goTo(a, 'add', 'take'); parentLevels(a);
  assert.equal(a.w.document.querySelectorAll('.lp-modal .level-picker button').length, 5, 'Take away has five levels');
});

// ---- Round 4: the Nook frame, the shelf and the Grown-ups hold ----
const P1 = 'lp-player-player-1-';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('the play screen is the frame: a shelf button, no chips and one read-only level label (phase 8), Nook with one bubble, the task card and the action bar; the old chrome is gone and the text regions stay for screen readers', t => {
  const a = app(t);
  const top = a.query('.nf-top');
  // Phase 8: the activity is chosen from the list under the game's shelf tile, so every top bar has the shelf button and the label only.
  for (const [game, activity] of [['count'], ['add', 'add'], ['add', 'take'], ['words', 'sentence'], ['words', 'letter'], ['words', 'order'], ['words', 'numbers'], ['patterns', 'finish'], ['patterns', 'make']]) {
    goTo(a, game, activity);
    const where = game + (activity ? ' ' + activity : '');
    assert.deepEqual(Array.from(top.querySelectorAll('button'), b => b.id), ['shelf-open'], where + ': the shelf button is the only button in the top bar');
    assert.equal(a.query('.nf-top #support').tagName, 'SPAN', where + ': the level is a label, not a button');
    assert.equal(a.query('#modes').children.length, 0, where + ': no chips');
    assert.equal(a.w.document.querySelectorAll('#page .chip, #page [data-operation], #page [data-pick], .lp-modal').length, 0, where + ': no chip or picker anywhere on the play screen');
  }
  assert.equal(a.query('#modes').getAttribute('role'), null, 'the empty spacer is not announced as a group');
  assert.equal(a.query('#shelf-open').getAttribute('aria-label'), 'Nook’s games');
  assert.ok(a.query('#shelf-open svg'), 'the shelf button carries the shelf icon');
  goTo(a, 'count');
  assert.equal(a.w.document.querySelectorAll('.nf-bubble').length, 2, 'one bubble on the play screen, one on the hidden shelf');
  assert.equal(a.w.document.querySelectorAll('#page .nf-bubble').length, 1);
  for (const sel of ['[data-sound]', '[data-settings]', '[data-player]', '#next-level', '#level-strip', '.tabs', '.hero', 'footer.footer', '#scene-label', '.brand', '.name-tag', '.skip-link']) assert.equal(a.query(sel), null, sel + ' is gone');
  assert.equal(a.w.document.querySelectorAll('#page a[href]').length, 0, 'no links on the play screen');
  for (const id of ['activity-title', 'instruction', 'status']) assert.ok(a.query('#' + id).classList.contains('sr-only'), id + ' stays for screen readers, out of sight');
  assert.equal(a.query('#status').getAttribute('role'), 'status');
  assert.equal(a.query('#activity').getAttribute('aria-labelledby'), 'activity-title');
});

test('the bubble is a button that hears its line again from bundled clips while sound is on; a line without clips shows no speaker; with sound off in Grown-ups it stays quiet', async t => {
  const a = app(t, 'garden.html', {}, false, true);
  assert.equal(a.query('#bubble').tagName, 'BUTTON');
  assert.equal(a.query('#speech').closest('button'), a.query('#bubble'));
  assert.equal(a.query('#speech').textContent, 'How many apples?');
  assert.ok(!a.query('#bubble').classList.contains('silent'), 'the Count prompt has its clip (phase 5), so the speaker shows');
  a.click('#bubble'); await tick();
  assert.deepEqual(a.plays, [a.w.LPVoiceLibrary.clips['how many apples'].file], 'a tap hears the prompt again');
  // A line without a clip: no speaker, nothing to replay and no device voice.
  delete a.w.LPVoiceLibrary.clips['how many apples'];
  goTo(a, 'add'); goTo(a, 'count');
  assert.equal(a.query('#speech').textContent, 'How many apples?');
  assert.ok(a.query('#bubble').classList.contains('silent'), 'without its clip the prompt shows no speaker');
  a.plays.length = 0;
  a.click('#bubble'); await tick();
  assert.equal(a.plays.length, 0, 'nothing to replay, and no device voice');
  assert.equal(a.spoken.length, 0);
  Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(a.store('garden-rounds').count.target)).click();
  await tick();
  const line = a.query('#speech').textContent, clip = a.w.LPVoiceLibrary.clips[line.toLowerCase().replace(/[.!?]+$/, '')].file;
  assert.equal(a.plays.at(-1), clip);
  assert.ok(!a.query('#bubble').classList.contains('silent'), 'a line with a clip shows the speaker');
  assert.ok(a.query('#bubble .hear svg'), 'the speaker glyph');
  const n = a.plays.length;
  a.click('#bubble'); await tick();
  assert.equal(a.plays.length, n + 1); assert.equal(a.plays.at(-1), clip, 'the same line again');
  a.click(`[data-choice="${a.store('garden-rounds').count.target}"]`); await tick();
  const speech = L.successLine('count', a.store('garden-rounds').count).speech;
  a.click('#bubble'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips[speech[0].toLowerCase().replace(/[.!?]+$/, '')].file, 'the success line starts again from its first clip');
  assert.equal(a.w.LP.audio.muted, false, 'the speaker means hear it again; it never mutes');
  a.w.LP.setSound(false);
  const m = a.plays.length;
  a.click('#bubble'); await tick();
  assert.equal(a.plays.length, m, 'with sound off in Grown-ups the bubble stays quiet');
  assert.equal(a.query('#status').textContent, 'Sound is off. A grown-up can turn it on in Grown-ups.');
});

test('Grown-ups opens only after a two-second hold: the ring from 300 ms; release, a move over 10 px, pointer cancel or the page hiding cancel it; Enter or Space held is the keyboard way; focus comes back to the button', t => {
  const a = app(t, 'index.html');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const gate = a.query('[data-grownups]');
    const at = (type, x = 10, y = 10) => gate.dispatchEvent(new a.w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
    const key = (type, k, repeat = false) => gate.dispatchEvent(new a.w.KeyboardEvent(type, { key: k, repeat, bubbles: true, cancelable: true }));
    const open = () => !!a.query('.lp-modal');
    assert.equal(gate.getAttribute('aria-label'), 'Grown-ups: press and hold for two seconds');
    gate.click(); assert.equal(open(), false, 'a tap does nothing');
    at('pointerdown'); t.mock.timers.tick(299);
    assert.ok(!gate.classList.contains('holding'), 'nothing shows for 300 ms');
    t.mock.timers.tick(1);
    assert.ok(gate.classList.contains('holding'), 'then the ring fills');
    t.mock.timers.tick(1600); at('pointerup');
    assert.ok(!gate.classList.contains('holding'), 'release drains the ring');
    t.mock.timers.tick(5000); assert.equal(open(), false, 'released at 1.9 s: still closed');
    at('pointerdown'); t.mock.timers.tick(500); at('pointermove', 22, 10); t.mock.timers.tick(3000);
    assert.equal(open(), false, 'sliding 12 px cancels');
    at('pointerdown'); t.mock.timers.tick(800); at('pointercancel'); t.mock.timers.tick(3000);
    assert.equal(open(), false, 'pointer cancel');
    at('pointerdown'); t.mock.timers.tick(800); a.w.dispatchEvent(new a.w.Event('pagehide')); t.mock.timers.tick(3000);
    assert.equal(open(), false, 'the page hiding');
    key('keydown', 'Enter'); t.mock.timers.tick(1000); key('keyup', 'Enter'); t.mock.timers.tick(3000);
    assert.equal(open(), false, 'a short key press does nothing');
    at('pointerdown'); t.mock.timers.tick(500); at('pointermove', 18, 14); t.mock.timers.tick(1499);
    assert.equal(open(), false, 'not before 2,000 ms');
    t.mock.timers.tick(1);
    assert.equal(open(), true, 'a small wobble is fine; the full hold opens the sheet');
    assert.equal(a.query('#dialog-title').textContent, 'Grown-ups');
    assert.match(a.query('#gu-player').textContent, /^Who is playing: .*Player 1$/);
    assert.ok(a.query('#gu-settings') && a.query('#gu-about'));
    assert.deepEqual(Array.from(a.w.document.querySelectorAll('.gu-list a'), l => l.getAttribute('href')), ['content.html', 'feelings-content.html', '../boom/'], 'the content pages and the K-Pop BOOM door live behind the hold');
    assert.equal(a.query('#gu-sound').textContent, 'Sound is on. Turn it off in Settings.');
    a.click('[data-close]');
    assert.equal(a.w.document.activeElement, gate, 'focus returns to the Grown-ups button');
    key('keydown', ' '); key('keydown', ' ', true); t.mock.timers.tick(2000);
    assert.equal(open(), true, 'Space held for two seconds opens it; key repeat does not restart the hold');
    a.click('#gu-settings');
    assert.ok(a.query('#lp-settings [name="sound"]') && a.query('#lp-settings [name="wordPictures"]'), 'Settings from the sheet, with sound and word pictures');
    a.click('[data-close]');
    assert.equal(a.w.document.activeElement, gate, 'and back to the button after Settings');
    key('keydown', 'Enter'); t.mock.timers.tick(2000);
    a.click('#gu-player');
    assert.equal(a.query('#dialog-title').textContent, 'Who is playing?', 'player switching is in Grown-ups');
    a.click('[data-close]');
    assert.equal(a.w.document.activeElement, gate);
    key('keydown', 'Enter'); t.mock.timers.tick(2000);
    a.click('#gu-about');
    assert.equal(a.query('#dialog-title').textContent, 'Privacy, devices and credits');
    assert.match(a.query('.lp-dialog').textContent.replace(/\s+/g, ' '), /Me, in Feelings: .* never saved or sent, and it clears when they leave Me\./, 'the privacy sheet says what happens to a Me report');
    a.click('[data-close]');
  } finally { t.mock.timers.reset(); }
});

test('in a game the shelf button opens the same shelf as a full-height overlay with the current tile marked; a tile with a list opens it there (the current game’s too), Count switches in place, the others navigate, and Android back opens it through one history entry', t => {
  const a = app(t);
  const visits = []; a.w.LPShelf.navigate = url => visits.push(url);
  const overlay = a.query('#shelf-overlay');
  assert.equal(overlay.hidden, true);
  assert.equal(a.w.history.length, 1, 'nothing pushed before the first touch (Chrome would skip it)');
  a.click('#shelf-open');
  assert.equal(a.w.history.length, 2, 'one entry pushed at the first touch');
  assert.equal(a.w.history.state.lpShelf, true);
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.getAttribute('role'), 'dialog');
  assert.ok(a.query('#page').hasAttribute('inert'), 'the play screen waits behind it');
  assert.deepEqual(Array.from(overlay.querySelectorAll('.tiles .tile'), b => b.tagName + ' ' + b.querySelector('span').textContent), ['BUTTON Count', 'BUTTON Add', 'BUTTON Words', 'BUTTON Patterns', 'BUTTON Shapes', 'BUTTON Feelings', 'BUTTON Paint', 'BUTTON Blocks']);
  assert.equal(overlay.querySelector('.tiles [aria-current="true"]').dataset.shelf, 'count');
  assert.equal(a.w.document.activeElement, overlay.querySelector('.tiles [aria-current="true"]'));
  assert.deepEqual(Array.from(overlay.querySelectorAll('.shelf-foot button'), b => b.dataset.grownups !== undefined), [true], 'the foot holds only Grown-ups');
  assert.equal(overlay.querySelector('.sound-badge').hidden, true);
  assert.deepEqual(Array.from(overlay.querySelectorAll('.tiles [data-mode]'), b => b.dataset.mode), ['count'], 'only Count, with one activity, plays in place from its tile');
  // Words has a list: its tile opens the list in the overlay, the last activity marked; a list tile starts it in place.
  a.click('#shelf-overlay [data-shelf="words"]');
  assert.equal(overlay.hidden, false, 'the list opens inside the shelf');
  assert.equal(a.w.LPShelf.menu, 'words');
  assert.equal(overlay.querySelector('.tiles').hidden, true);
  assert.equal(overlay.querySelector('.shelf-bar').hidden, false);
  assert.equal(overlay.querySelector('[data-bubble] .line').textContent, 'Which word game?');
  assert.equal(overlay.querySelector('.menu-tiles [aria-current="true"]').dataset.activity, 'sentence');
  assert.equal(a.w.document.activeElement, overlay.querySelector('.menu-tiles [aria-current="true"]'), 'focus starts on the last activity');
  a.click('#shelf-overlay [data-activity="sentence"]');
  assert.equal(overlay.hidden, true);
  a.click('#shelf-open');
  assert.equal(a.w.LPShelf.menu, '', 'the shelf opens on its tiles again');
  assert.equal(overlay.querySelector('[data-bubble] .line').textContent, 'What shall we play?');
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'q', bubbles: true }));
  assert.equal(a.query('#word-input').value, '', 'keys do not reach the game behind the shelf');
  a.click('#shelf-overlay [data-shelf="words"]'); a.click('#shelf-overlay [data-activity="sentence"]');
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'q', bubbles: true }));
  assert.equal(a.query('#word-input').value, 'Q', 'and do again once it closes');
  a.click('[data-key="Backspace"]');
  assert.ok(!a.query('#page').hasAttribute('inert'));
  assert.equal(a.store('garden-position').mode, 'words');
  assert.ok(a.query('#word-input'), 'switched in place');
  assert.equal(a.w.location.hash, '#words', 'a reload stays on Words');
  for (let i = 0; i < 4; i++) { goTo(a, 'count'); goTo(a, 'add'); }
  assert.equal(a.w.history.length, 2, 'never one entry per render');
  a.w.dispatchEvent(new a.w.PopStateEvent('popstate', { state: null }));
  assert.equal(overlay.hidden, false, 'Android back opens the shelf');
  assert.equal(overlay.querySelector('.tiles [aria-current="true"]').dataset.shelf, 'add', 'with the current game marked');
  a.click('#shelf-overlay [data-shelf="add"]');
  assert.equal(overlay.hidden, false, 'the current game’s tile opens its list, not closes the shelf');
  assert.equal(a.w.LPShelf.menu, 'add');
  assert.deepEqual(Array.from(overlay.querySelectorAll('.menu-tile'), b => b.dataset.activity + (b.getAttribute('aria-current') ? '*' : '')), ['add*', 'take']);
  a.w.dispatchEvent(new a.w.PopStateEvent('popstate', { state: null }));
  assert.equal(a.w.LPShelf.menu, '', 'inside a list, Android back comes up to the tiles');
  assert.equal(overlay.hidden, false);
  a.click('#shelf-overlay [data-shelf="add"]');
  a.click('#shelf-overlay [data-back]');
  assert.equal(a.w.LPShelf.menu, '', 'the list’s shelf button comes back to the tiles');
  assert.equal(a.w.document.activeElement, overlay.querySelector('.tiles [data-shelf="add"]'), 'focus goes back to the tile');
  a.click('#shelf-overlay [data-shelf="count"]');
  assert.equal(overlay.hidden, true, 'Count switches in place and closes it');
  assert.equal(a.store('garden-position').mode, 'count');
  a.click('#shelf-open');
  a.click('#shelf-overlay [data-shelf="count"]');
  assert.equal(overlay.hidden, true, 'the current tile without a list closes it');
  a.click('#shelf-open');
  // Another game's list tile goes to that game with the activity; tiles without a list navigate as before.
  for (const [id, activity] of [['shapes', 'name'], ['feelings', 'friends']]) { a.click(`#shelf-overlay [data-shelf="${id}"]`); a.click(`#shelf-overlay [data-activity="${activity}"]`); a.click('#shelf-overlay [data-back]'); }
  for (const id of ['paint', 'blocks']) a.click(`#shelf-overlay [data-shelf="${id}"]`);
  assert.deepEqual(visits, ['shapes.html#name', 'feelings.html#friends', 'studio-lab.html', 'blocks.html']);
  overlay.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(overlay.hidden, true, 'Escape closes it');
  assert.equal(a.w.document.activeElement, a.query('#shelf-open'), 'focus returns to the shelf button');
  a.w.LP.setSound(false);
  assert.equal(overlay.querySelector('.sound-badge').hidden, false, 'the crossed speaker shows on the shelf while sound is off');
});

test('the hub is Nook’s shelf: a greeting that can be heard again, eight tile buttons, no links, and a foot with only the Grown-ups hold; a crossed speaker shows only while sound is off', async t => {
  const a = app(t, 'index.html', {}, false, true);
  const visits = []; a.w.LPShelf.navigate = url => visits.push(url);
  const tiles = Array.from(a.w.document.querySelectorAll('.tiles .tile'));
  assert.deepEqual(tiles.map(b => b.querySelector('span').textContent), ['Count', 'Add', 'Words', 'Patterns', 'Shapes', 'Feelings', 'Paint', 'Blocks']);
  assert.ok(tiles.every(b => b.tagName === 'BUTTON' && b.type === 'button' && b.querySelector('svg[aria-hidden="true"]')), 'tiles are buttons with their icons, which screen readers skip');
  assert.equal(a.w.document.querySelectorAll('a[href]').length, 0, 'no links on the shelf');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.shelf-foot button'), b => b.getAttribute('aria-label')), ['Grown-ups: press and hold for two seconds']);
  assert.equal(a.query('[data-sound]'), null, 'nothing on the shelf mutes');
  assert.equal(a.query('.sound-badge').hidden, true);
  assert.equal(a.query('[data-bubble] .line').textContent, 'Hello! I’m Nook. Let’s play.');
  assert.ok(a.query('[data-nook] svg.nook[data-feeling="greet"]'), 'Nook greets on the shelf');
  a.click('[data-bubble]'); await tick();
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips["hello! i'm nook. let's play"].file);
  // Count, Paint and Blocks have one activity and go straight in; the other five open their lists (the phase 8 tests).
  for (const id of ['count', 'paint', 'blocks']) a.click(`[data-shelf="${id}"]`);
  assert.deepEqual(visits, ['garden.html#count', 'studio-lab.html', 'blocks.html']);
  a.w.LP.setSound(false);
  assert.equal(a.query('.sound-badge').hidden, false, 'the badge appears while a grown-up has sound off');
  assert.equal(a.query('.sound-badge').getAttribute('aria-label'), 'Sound is off');
  assert.equal(a.query('.sound-badge').tagName, 'SPAN', 'a sign, not a control');
  const b = app(t, 'index.html', { 'lp-sound': 'off' }, false, true);
  assert.equal(b.query('.sound-badge').hidden, false, 'and on the next visit');
  b.w.LP.setSound(true);
  assert.equal(b.query('.sound-badge').hidden, true);
});

test('word pictures are a Grown-ups setting (show by default, or hide until Help), saved per player; changing it keeps the draft', t => {
  assert.equal(L.defaults.wordPictures, 'show');
  assert.equal(L.normalisePrefs({ wordPictures: 'hide' }).wordPictures, 'hide');
  assert.equal(L.normalisePrefs({ wordPictures: 'sometimes' }).wordPictures, 'show');
  const a = app(t);
  goTo(a, 'words'); a.click('[data-key="A"]');
  a.w.LP.settings();
  const select = a.query('#lp-settings [name="wordPictures"]');
  assert.equal(select.value, 'show');
  assert.deepEqual(Array.from(select.options, o => o.value), ['show', 'hide']);
  select.value = 'hide'; a.submit('#lp-settings');
  assert.equal(a.store('little-patterns-v1').wordPictures, 'hide');
  assert.ok(Array.from(a.w.document.querySelectorAll('.card-picture')).every(el => !el.classList.contains('revealed')), 'the cards now wait for Help');
  assert.equal(a.query('#word-input').value, 'A');
  a.w.LP.choosePlayer(); a.query('#player-form [name="name"]').value = 'Second player'; a.submit('#player-form');
  assert.equal(a.w.LP.prefs.wordPictures, 'show', 'another player keeps the default');
});

test('Add is one augmentation picture: the first group, a plus, the apples that came in a dashed outline, the equation and three answers; Help numbers every apple in one count, with the arrival only then, and outlines the answer second', t => {
  const a = app(t, 'garden.html', { [P1 + 'garden-position']: { mode: 'add', selection: { add: [3, 2] }, strip: 1, spell: 1 } });
  assert.equal(a.query('#speech').textContent, 'Three, then two more. How many?');
  const groups = a.w.document.querySelectorAll('.join-row > .group');
  assert.equal(groups.length, 2);
  assert.equal(groups[0].querySelectorAll('.apple').length, 3);
  assert.equal(groups[1].querySelectorAll('.apple').length, 2);
  assert.ok(groups[1].classList.contains('more') && !groups[0].classList.contains('more'), 'the apples that came sit in the dashed outline');
  assert.ok(a.query('.join-row > .plus'));
  for (const sel of ['.sum-result', '.sum-build', '#task .group-label', '.join-arrow']) assert.equal(a.query(sel), null, sel + ': one picture, no labels');
  assert.equal(a.query('.equation').textContent, '3 + 2 = ?');
  assert.equal(a.w.document.querySelectorAll('.answers [data-choice]').length, 3);
  assert.equal(a.query('#task .arrive'), null, 'the whole picture shows at once; nothing moves before Help');
  assert.equal(a.query('#task .count-tag'), null);
  a.click('#help');
  assert.equal(a.query('#speech').textContent, 'Count them all with me.');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('#task .count-tag'), el => el.textContent), ['1', '2', '3', '4', '5'], 'one count across both groups');
  assert.equal(a.w.document.querySelectorAll('.group.more .tagged.arrive').length, 2, 'the two that came arrive now');
  assert.equal(a.w.document.querySelectorAll('.group:not(.more) .tagged.arrive').length, 0, 'the first group stays put');
  assert.equal(a.query('.choice.hint'), null);
  a.click('#help');
  assert.ok(a.query('[data-choice="5"].hint'), 'step two outlines the answer');
  a.click('[data-choice="5"]');
  assert.equal(a.query('.equation .unknown.filled').textContent, '5', 'the chosen digit fills the ?');
  assert.ok(a.query('.equation .unknown.arrive'), 'and fades in once');
  assert.equal(a.query('#task .count-tag'), null, 'the finished picture is plain again');
  goTo(a, 'count'); goTo(a, 'add');
  assert.equal(a.query('#task .arrive'), null, 'a re-render shows it still');
  const b = app(t, 'garden.html', { [P1 + 'garden-position']: { mode: 'add', levels: { add: 2 }, selection: { add: [6, 4] }, strip: 1, spell: 1 } });
  assert.equal(b.query('.join-row > .group').style.getPropertyValue('--cols'), '5', 'groups over five lay out in rows of five');
  assert.equal(b.query('.join-row > .group.more').style.getPropertyValue('--cols'), '4');
  const c = app(t, 'garden.html', { [P1 + 'little-patterns-v1']: { addition: 'demo' }, [P1 + 'garden-position']: { mode: 'add', selection: { add: [2, 2] }, strip: 1, spell: 1 } });
  assert.equal(c.query('.equation').textContent, '2 + 2 = 4', 'Just show me the answer is kept');
  assert.ok(c.query('[data-choice="4"].chosen'));
});

test('Nook keeps its resting look through mistakes, changes to a happy-side feeling with one small hop only on success, rests again for the next round, and answers a tap with one of three small calm responses in turn', async t => {
  const a = app(t, 'garden.html', {}, false, true);
  const svg = () => a.query('#nook svg.nook'), wrapper = a.query('#nook .nook-pos');
  assert.equal(svg().getAttribute('data-feeling'), 'rest', 'the hello face with both arms down');
  Array.from(a.w.document.querySelectorAll('[data-choice]')).find(b => b.dataset.choice !== String(a.store('garden-rounds').count.target)).click();
  await wait(400);
  assert.equal(svg().getAttribute('data-feeling'), 'rest', 'a wrong answer changes only the bubble');
  assert.ok(!wrapper.classList.contains('nook-hop') && !svg().classList.contains('nook-changing'));
  a.click(`[data-choice="${a.store('garden-rounds').count.target}"]`);
  await wait(400);
  assert.ok(['happy', 'proud', 'excited'].includes(svg().getAttribute('data-feeling')), 'success: ' + svg().getAttribute('data-feeling'));
  assert.ok(wrapper.classList.contains('nook-hop'), 'one hop, on the wrapper (the svg keeps its breath)');
  a.click('#next');
  await wait(200);
  assert.equal(svg().getAttribute('data-feeling'), 'rest', 'resting again for the next round');
  const before = JSON.stringify(a.store('garden-rounds'));
  a.click('#nook');
  assert.equal(a.query('#speech').textContent, 'Nook feels happy.', 'first tap: Nook names its feeling (the resting smile is happy)');
  a.click('#nook');
  assert.ok(wrapper.classList.contains('nook-wiggle'), 'second tap: a small wiggle');
  a.click('#nook'); await tick();
  assert.equal(a.query('#speech').textContent, 'Hello! I’m Nook. Let’s play.', 'third tap: hello');
  assert.equal(a.plays.at(-1), a.w.LPVoiceLibrary.clips["hello! i'm nook. let's play"].file);
  a.click('#nook');
  assert.equal(a.query('#speech').textContent, 'Nook feels happy.', 'then round again, never escalating');
  assert.equal(JSON.stringify(a.store('garden-rounds')), before, 'taps never change the puzzle');
  await wait(2700);
  assert.equal(a.query('#speech').textContent, 'How many apples?', 'the line comes back');
});

test('a save from before the frame (the round-3 shape) restores every level, place, selection, draft, string and round id', t => {
  const takeRound = L.sumRound(4, L.defaults, 2, 'take'), countIndex = L.countSequence(2).indexOf(7);
  const position = { mode: 'add', wordTab: 'numbers', indices: { count: 3, add: 2, take: 4, patterns: 5, make: 0, sentence: 7, letter: 2, order: 1, numbers: 1 }, selection: { count: 7 }, levels: { count: 2, add: 2, numbers: 2, patterns: 3 }, operation: 'take', patternMode: 'make', patternFamily: 3, strip: 1, spell: 1 };
  const rounds = {
    count: { id: L.countRound(countIndex, L.defaults, 2).id, target: 7, seen: [0, 1, 2], draft: '', hint: 0, done: false },
    add: { id: takeRound.id, a: takeRound.a, b: takeRound.b, draft: '', hint: 1, done: false },
    sentence: { id: L.sentenceRound(7, L.defaults).id, text: L.sentenceRound(7, L.defaults).text, draft: 'AP', hint: 0, done: false },
    make: { id: 'make:v2:L1:make:string', beads: ['circle', 'oval'], done: false },
    numbers: { id: L.numberWordRound(1, L.defaults, 2).id, draft: 'SE', hint: 0, done: false }
  };
  const a = app(t, 'garden.html', { [P1 + 'garden-position']: position, [P1 + 'garden-rounds']: rounds });
  assert.equal(a.store('garden-position').operation, 'take', 'Add or Take away, as the list started it');
  assert.equal(a.query('#support').textContent, 'Up to 10');
  assert.equal(a.store('garden-rounds').add.id, takeRound.id);
  assert.equal(a.query('.equation').textContent, `${takeRound.a} − ${takeRound.b} = ?`);
  assert.equal(a.w.document.querySelectorAll('.take-one .count-tag').length, takeRound.answer, 'the Help step came back with the round');
  const saved = a.store('garden-position');
  for (const key of ['indices', 'selection', 'levels', 'operation', 'patternMode', 'patternFamily', 'strip', 'spell', 'wordTab']) assert.deepEqual(saved[key], position[key], key);
  goTo(a, 'patterns');
  assert.equal(a.query('#support').textContent, 'Make your own');
  assert.deepEqual(a.store('garden-rounds').make.beads, ['circle', 'oval']);
  goTo(a, 'words');
  assert.equal(a.query('#task').dataset.view, 'numbers');
  assert.equal(a.query('#word-input').value, 'SE');
  wordTab(a, 'sentence');
  assert.equal(a.query('#word-input').value, 'AP');
  goTo(a, 'count');
  assert.equal(a.query('#support').textContent, '1–10');
  assert.equal(a.store('garden-rounds').count.target, 7);
  assert.deepEqual(a.store('garden-rounds').count.seen, [0, 1, 2]);
});

test('the A to Z keys are in ABC order and end in Delete then Enter, exactly four rows of seven on a narrow portrait phone; Number words puts Space before them', t => {
  const a = app(t);
  goTo(a, 'words');
  const keys = Array.from(a.query('.keyboard').querySelectorAll('button'), b => b.dataset.key || b.id);
  assert.deepEqual(keys, [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Backspace', 'check-word']);
  assert.equal(keys.length, 28, 'rows of 7, 7, 7, then V to Z with Delete and Enter');
  assert.equal(a.query('#check-word').getAttribute('aria-label'), 'Enter');
  assert.equal(a.query('[data-key="Backspace"]').getAttribute('aria-label'), 'Delete one letter');
  assert.ok(a.query('#check-word').classList.contains('go'), 'Enter is the green key at the end');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, numberWords: 'type' });
  wordTab(a, 'numbers');
  assert.deepEqual(Array.from(a.query('.keyboard').querySelectorAll('button'), b => b.dataset.key || b.id).slice(-3), ['Space', 'Backspace', 'check-word']);
  const css = fs.readFileSync(path.join(root, 'garden.css'), 'utf8');
  assert.match(css, /\.key\.space\{[^}]*grid-column:1\/-1;order:9\}/, 'on a narrow phone Space is a bar under the letters');
});

test('the Shapes tile lands on the Shapes game in the frame (tools/test-little-patterns-shapes.cjs tests it in full); Paint’s home goes to the shelf; the manifest and every new runtime file are on the deploy list', t => {
  const a = app(t, 'shapes.html');
  assert.equal(a.query('#speech').textContent, 'How many sides? Tap each side.');
  assert.equal(a.query('.soon'), null, 'the phase-2 placeholder is gone');
  assert.ok(a.query('#nook svg.nook') && a.query('.shape-stage svg.big-shape'));
  a.click('#shelf-open');
  assert.equal(a.query('#shelf-overlay [aria-current="true"]').dataset.shelf, 'shapes');
  assert.equal(a.query('#shelf-overlay .tiles [data-mode]'), null, 'outside the Garden no tile plays in place: Shapes opens its list, the others navigate');
  const studio = fs.readFileSync(path.join(root, 'studio-lab.html'), 'utf8');
  assert.match(studio, /<a id="home" href="\.\/" data-icon="back" aria-label="Back to Nook's games">/);
  const { files } = require('./stage-little-patterns.cjs');
  for (const f of ['frame.css', 'frame.js', 'shelf.js', 'menus.js', 'hub.js', 'icons.js', 'nook-art.js', 'nook.css', 'garden.css', 'manifest.webmanifest', 'assets/icon-192.png', 'assets/icon-512.png', 'shapes.html', 'shapes.js', 'shapes.css']) assert.ok(files.includes(f), f + ' ships');
  for (const old of ['home.css', 'garden-live.css', 'garden-preview.css', 'shapes-stub.js']) assert.ok(!files.includes(old), old + ' no longer ships');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './'); assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name && manifest.theme_color && manifest.background_color);
  assert.deepEqual(manifest.icons.map(i => [i.src, i.sizes]), [['assets/icon-192.png', '192x192'], ['assets/icon-512.png', '512x512']]);
  for (const [file, size] of [['assets/icon-192.png', 192], ['assets/icon-512.png', 512]]) { const png = fs.readFileSync(path.join(root, file)); assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size); }
  assert.ok(!fs.readdirSync(root).some(f => /service-?worker|^sw\.js$/i.test(f)), 'no service worker');
});

test('the Grown-ups content pages describe round 4 (Shapes, the Add picture, the four Feelings activities) and stay on the deploy list', () => {
  const { files } = require('./stage-little-patterns.cjs');
  for (const f of ['content.html', 'feelings-content.html']) assert.ok(files.includes(f), f + ' ships');
  const content = fs.readFileSync(path.join(root, 'content.html'), 'utf8');
  assert.match(content, /Every Shapes example/);
  assert.match(content, /We did it!/);
  assert.match(content, /second group inside a dashed outline/);
  assert.doesNotMatch(content, /separate basket area/, 'the take-away note matches the one-group crossing-out');
  assert.match(content, /Add has six levels, set by a grown-up in Grown-ups \(Levels and puzzles\)/, 'phase 7: levels are the grown-ups’');
  assert.doesNotMatch(content, /chosen from the level pill|chosen in the activity/);
  const feelings = fs.readFileSync(path.join(root, 'feelings-content.html'), 'utf8');
  for (const id of ['words', 'board', 'which', 'friends', 'me', 'art']) assert.match(feelings, new RegExp('<h2 id="' + id + '"'));
  for (const name of ['Nook feels…', 'Which feeling?', 'Friends', 'Me']) assert.ok(feelings.includes(name), name);
  assert.doesNotMatch(feelings, /How Match works|Match responses|People stories/, 'the round-3 activities are gone from the page');
  assert.equal((feelings.match(/class="nook-face"/g) || []).length, 20, 'Nook’s ten faces, and the ten again with the neutral ring for Me');
  assert.match(feelings, /never saved, logged, put in a link or sent anywhere/);
  assert.match(feelings, /four big tiles, one tap/); assert.match(feelings, /story are in Grown-ups \(Levels and puzzles\)/);
});

// ---- Phase 7: two audiences, two controls (Jof's proofing, items 4 to 6) ----
test('Grown-ups inside a game starts with that game’s section: its name, the level now with its picture, and Levels and puzzles; a level chosen there updates the child’s label and closes back to the game; the hub says where levels live', t => {
  const a = app(t);
  goTo(a, 'add');
  grownups(a);
  const section = a.query('.gu-game');
  assert.equal(section.querySelector('h3').textContent, 'Add');
  assert.equal(section.querySelector('.gu-now-text').textContent, 'Now: Add, level 1: within 5');
  assert.ok(section.querySelector('.gu-now-art svg'), 'the apple');
  assert.equal(a.query('.lp-dialog').firstElementChild.nextElementSibling, section, 'first, under the heading');
  a.click('#gu-levels');
  assert.match(a.query('#dialog-title').textContent, /^Levels and puzzles/);
  assert.equal(a.w.document.querySelectorAll('.lp-modal .level-picker button').length, 6, 'the six Add levels with their descriptions');
  assert.match(a.query('.lp-modal .level-picker button').textContent, /within 5/);
  assert.equal(a.w.document.querySelectorAll('.lp-modal .set-picker button').length, 2, 'Doubles and Make ten');
  assert.ok(a.query('#pick-sum select[name="a"]') && a.query('#pick-sum select[name="b"]'), 'the first and second group choosers');
  a.w.document.querySelectorAll('.lp-modal .level-picker button')[2].click();
  assert.equal(a.query('#support').textContent, 'Up to 20', 'the label follows at once');
  a.click('[data-close]');
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(a.query('#shelf-overlay').hidden, true, 'back to the game, not the shelf');
  assert.ok(!a.query('#page').hasAttribute('inert'));
  assert.equal(a.store('garden-position').levels.add, 3, 'saved');
  grownups(a);
  assert.equal(a.query('.gu-now-text').textContent, 'Now: Add, level 3: to 20, no crossing ten');
  a.click('#gu-levels');
  a.w.document.querySelectorAll('.lp-modal .set-picker button')[0].click();
  assert.equal(a.query('#support').textContent, 'Doubles');
  assert.equal(a.query('#shelf-overlay').hidden, true);
  goTo(a, 'patterns');
  grownups(a);
  assert.equal(a.query('.gu-game h3').textContent, 'Patterns');
  assert.equal(a.query('.gu-now-text').textContent, 'Now: 2 shapes');
  assert.equal(a.w.document.querySelectorAll('.gu-now-art .shape').length, 2, 'the family as beads');
  a.click('#gu-levels');
  assert.equal(a.w.document.querySelectorAll('.lp-modal [data-family]').length, 3, 'the families');
  assert.equal(a.w.document.querySelectorAll('.lp-modal .level-picker button').length, 14, 'and the fourteen numbered levels');
  a.w.document.querySelectorAll('.lp-modal .level-picker button')[11].click(); a.click('[data-close]');
  assert.equal(a.query('#support').textContent, 'Level 12 · Growing');
  goTo(a, 'words'); wordTab(a, 'numbers');
  grownups(a);
  assert.equal(a.query('.gu-now-text').textContent, 'Now: Number words, level 1: 1 to 5');
  a.w.LP.closeModal();
  const hub = app(t, 'index.html');
  hub.w.LPShelf.grownups();
  assert.equal(hub.query('.gu-game'), null, 'the hub has no game section');
  assert.equal(hub.query('#gu-levels'), null);
  assert.match(hub.query('#gu-levels-hint').textContent, /open a game, tap the shelf button and hold Grown-ups there/);
});

test('saved positions and levels survive phases 7 and 8 untouched: the pill and the lists only read them', async t => {
  const position = { mode: 'patterns', wordTab: 'order', indices: { count: 2, add: 1, take: 3, patterns: 4, make: 0, sentence: 5, letter: 1, order: 2, numbers: 0 }, selection: {}, levels: { count: 4, add: 5, numbers: 3, patterns: 9 }, operation: 'take', patternMode: 'finish', patternFamily: 0, strip: 1, spell: 1 };
  const a = app(t, 'garden.html', { [P1 + 'garden-position']: position });
  assert.equal(a.query('#support').textContent, 'Level 9');
  goTo(a, 'add'); assert.equal(a.query('#support').textContent, 'Tens');
  goTo(a, 'count'); assert.equal(a.query('#support').textContent, '10 20 30');
  goTo(a, 'words'); assert.equal(a.query('#support').textContent, 'Word order');
  // Phase 8: opening every list (in the game and on the hub) and closing it again changes nothing that was saved.
  for (const id of ['add', 'words', 'patterns', 'shapes', 'feelings']) { a.click('#shelf-open'); a.click(`#shelf-overlay [data-shelf="${id}"]`); a.click('#shelf-overlay [data-back]'); a.query('#shelf-overlay').dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }
  const saved = a.store('garden-position');
  for (const key of ['indices', 'levels', 'operation', 'patternMode', 'patternFamily', 'wordTab']) assert.deepEqual(saved[key], position[key], key);
  const shapes = { mode: 'name', level: 2, indices: { sides: 7, name: 3 } }, feelings = { version: 2, mode: 'friends', index: 5, level: 2, story: 4, seed: 9 };
  const hub = app(t, 'index.html', { [P1 + 'garden-position']: position, [P1 + 'shapes-position']: shapes, [P1 + 'feelings-v1']: feelings });
  for (const id of ['add', 'words', 'patterns', 'shapes', 'feelings']) { hub.click(`[data-shelf="${id}"]`); assert.equal(hub.w.LPShelf.menu, id); hub.click('[data-back]'); await wait(40); }
  assert.deepEqual(hub.store('garden-position'), position);
  assert.deepEqual(hub.store('shapes-position'), shapes);
  assert.deepEqual(hub.store('feelings-v1'), feelings);
});

// ---- Phase 8: Jof's navigation decision (12 October): a list of activities under each tile with more than one ----
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const LIST_WORDS = { add: ['Add', 'Take away'], words: ['Missing word', 'Missing letter', 'Word order', 'Number words'], patterns: ['Finish the pattern', 'Make your own'], shapes: ['Sides', 'Name'], feelings: ['Nook feels…', 'Which feeling?', 'Friends', 'Me'] };

test('the shelf marks the five games with a list, and only them: a stacked-cards badge in the tile’s top-right corner and a dashed inner border, in a deep shade of the tile’s colour; Grown-ups’ credits say so in one line', t => {
  for (const page of ['index.html', 'garden.html', 'shapes.html', 'feelings.html', 'blocks.html']) {
    const a = app(t, page);
    const tiles = Array.from(a.w.document.querySelectorAll('.tiles .tile'));
    assert.deepEqual(tiles.filter(b => b.classList.contains('has-menu')).map(b => b.dataset.shelf), ['add', 'words', 'patterns', 'shapes', 'feelings'], page);
    for (const b of tiles) {
      const badge = b.querySelector('svg.more');
      if (b.classList.contains('has-menu')) {
        assert.ok(badge && badge.getAttribute('aria-hidden') === 'true', b.dataset.shelf + ': the badge, which screen readers skip');
        assert.equal(badge.querySelectorAll('rect').length, 2, 'two offset rounded squares');
        assert.match(b.querySelector('.sr-only').textContent, /opens a list/, 'and a screen reader hears it');
        assert.equal(b.querySelector('span').textContent, a.w.LPShelf.TILES.find(x => x[0] === b.dataset.shelf)[1], 'the name is still the first label');
      } else {
        assert.equal(badge, null, b.dataset.shelf + ': no badge');
        assert.equal(b.querySelector('.sr-only'), null);
      }
    }
  }
  const css = read('frame.css');
  assert.match(css, /\.tile\.has-menu:before\{[^}]*border:3px dashed var\(--tile-deep\)/, 'the dashed inner border reads without the badge');
  assert.match(css, /\.tile svg\.more\{position:absolute;top:\d+px;right:\d+px/, 'the badge sits in the top-right corner');
  assert.match(css, /\.tile \.more \.card-back\{fill:var\(--tile-deep\)/);
  for (const id of ['add', 'words', 'patterns', 'shapes', 'feelings']) assert.match(css, new RegExp('\\.tile\\.' + id + '\\{--tile-bg:[^;]+;--tile-deep:#[0-9a-f]{6}\\}'), id + ' has its own deep shade');
  const hub = app(t, 'index.html');
  hub.w.LPShelf.grownups(); hub.click('#gu-about');
  assert.equal(hub.query('#gu-marker').textContent, 'Tiles with a corner badge open a list of activities.');
});

test('each list on the hub: the shelf button top-left, the game’s name, Nook’s line for that game (text only, no clip), big tiles with a picture and one name each; the last activity is marked; one tap starts it', async t => {
  const seed = {
    [P1 + 'garden-position']: { mode: 'count', wordTab: 'order', operation: 'take', patternMode: 'make', patternFamily: 2, strip: 1, spell: 1 },
    [P1 + 'shapes-position']: { mode: 'name', level: 2, indices: { sides: 3, name: 4 } },
    [P1 + 'feelings-v1']: { version: 2, mode: 'me', index: 0, level: 1, story: 0, seed: 1 }
  };
  const marked = { add: 'take', words: 'order', patterns: 'make', shapes: 'name', feelings: 'me' };
  const greetings = { add: 'Add or take away?', words: 'Which word game?', patterns: 'Which pattern game?', shapes: 'Which shape game?', feelings: 'Which feelings game?' };
  const hrefs = { add: ['garden.html#add/add', 'garden.html#add/take'], words: ['garden.html#words/sentence', 'garden.html#words/letter', 'garden.html#words/order', 'garden.html#words/numbers'], patterns: ['garden.html#patterns/finish', 'garden.html#patterns/make'], shapes: ['shapes.html#sides', 'shapes.html#name'], feelings: ['feelings.html#board', 'feelings.html#which', 'feelings.html#friends', 'feelings.html#me'] };
  const a = app(t, 'index.html', seed, false, true);
  const visits = []; a.w.LPShelf.navigate = url => visits.push(url);
  for (const id of Object.keys(LIST_WORDS)) {
    a.click(`[data-shelf="${id}"]`);
    assert.equal(a.w.LPShelf.menu, id);
    assert.equal(a.query('.tiles').hidden, true, id + ': the list replaces the tiles');
    const bar = a.query('.shelf-bar');
    assert.equal(bar.hidden, false);
    assert.equal(bar.querySelector('.nf-shelf').getAttribute('aria-label'), 'Nook’s games', 'the shelf button, as in every game');
    assert.equal(bar.querySelector('.nf-shelf'), bar.querySelector('button'), 'first in the bar: top-left');
    const name = bar.querySelector('h2.menu-name > span:last-child').textContent;
    assert.equal(name, a.query(`.tiles [data-shelf="${id}"] span`).textContent, 'the game’s name, beside its tile’s picture');
    assert.equal(bar.querySelector('h2 .menu-name-art').getAttribute('aria-hidden'), 'true');
    assert.equal(a.query('[data-bubble] .line').textContent, greetings[id]);
    assert.ok(a.query('[data-bubble]').classList.contains('silent'), id + ': text only, so no speaker');
    a.plays.length = 0; a.click('[data-bubble]'); await tick();
    assert.deepEqual(a.plays, [], 'and nothing plays');
    const tiles = Array.from(a.w.document.querySelectorAll('.menu-tiles .menu-tile'));
    assert.deepEqual(tiles.map(b => b.querySelector('.menu-word').textContent), LIST_WORDS[id], id + ': one name per tile');
    for (const b of tiles) {
      assert.equal(b.tagName, 'BUTTON'); assert.equal(b.type, 'button');
      assert.ok(b.classList.contains('tile') && b.classList.contains(id), 'pressed like the shelf’s tiles, in the game’s colour');
      assert.equal(b.querySelectorAll('.menu-word').length, 1);
      const art = b.querySelector('.menu-art');
      assert.equal(art.getAttribute('aria-hidden'), 'true');
      assert.ok(art.querySelector('svg, .mini'), id + ' ' + b.dataset.activity + ': a picture');
      assert.equal(b.dataset.mode, id);
    }
    assert.deepEqual(tiles.filter(b => b.getAttribute('aria-current') === 'true').map(b => b.dataset.activity), [marked[id]], id + ': the last activity is marked');
    assert.equal(a.w.document.activeElement, a.query('.menu-tiles [aria-current="true"]'), 'focus starts there');
    assert.equal(a.query('.menu-tiles').getAttribute('aria-label'), name + ': choose a game');
    for (const b of tiles) b.click();
    assert.deepEqual(visits.splice(0), hrefs[id], id + ': each tile starts its activity');
    a.click('[data-back]'); await wait(40);
  }
  const css = read('frame.css');
  assert.match(css, /\.tile\.menu-tile\{min-height:120px/, 'at least 120 px tall on phones (the layout harness measures it at every size)');
  assert.match(css, /\.tile:active\{transform:translateY\(3px\)/, 'pressed like the shelf’s tiles');
  assert.doesNotMatch(css, /\.tile\.menu-tile\{[^}]*animation:[^;}]*(both|forwards)/, 'the entry animation never holds a transform, so a press still moves the tile');
  // Never more than two levels: no list tile opens another list.
  assert.equal(a.w.document.querySelectorAll('.menu-tile.has-menu, .menu-tile svg.more').length, 0);
  // A player who has never played a game sees its first activity marked.
  const b = app(t, 'index.html', {}, true);
  b.click('[data-shelf="feelings"]');
  assert.equal(b.query('.menu-tiles [aria-current="true"]').dataset.activity, 'board', 'with storage blocked too');
});

test('the lists are the same everywhere: menus.js draws every picture (the Friends scene matches feelings-art.js), names match the games’ own, and the address carries the activity', () => {
  require('../public/fireworks/little-patterns/menus.js');
  const LPM = globalThis.LPMenus;
  const F = require('../public/fireworks/little-patterns/feelings-data.js');
  const A = require('../public/fireworks/little-patterns/feelings-art.js');
  assert.deepEqual(Object.keys(LPM.MENUS), ['add', 'words', 'patterns', 'shapes', 'feelings']);
  for (const [id, words] of Object.entries(LIST_WORDS)) assert.deepEqual(LPM.MENUS[id].tiles.map(x => x[1]), words, id);
  assert.deepEqual(LPM.MENUS.feelings.tiles.map(([id, name]) => [id, name]), F.ACTIVITIES.map(id => [id, F.ACTIVITY_NAMES[id]]), 'Feelings’ names are the game’s own');
  assert.deepEqual(LPM.MENUS.words.tiles.map(x => x[0]), ['sentence', 'letter', 'order', 'numbers']);
  assert.equal(LPM.FRIENDS, A.scene(F.STORIES[0]).replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true" focusable="false"').replace('class="story-art"', 'class="menu-scene"'), 'the Friends picture is the first story’s scene');
  assert.equal(LPM.href('add', 'take'), 'garden.html#add/take');
  assert.equal(LPM.href('words', 'nonsense'), 'garden.html#words/sentence', 'an unknown activity starts the first');
  assert.equal(LPM.href('count', 'x'), '', 'Count has no list');
  assert.deepEqual(LPM.split('#patterns/make'), ['patterns', 'make']);
  assert.ok(!LPM.has('count') && !LPM.has('paint') && !LPM.has('blocks'));
});

test('on the hub a list is one history entry: Android back and the list’s shelf button come back to the tiles; ./#feelings opens it directly; a page restored from the cache marks the activity played since', async t => {
  const a = app(t, 'index.html');
  const visits = []; a.w.LPShelf.navigate = url => visits.push(url);
  const length = a.w.history.length;
  a.click('[data-shelf="feelings"]');
  assert.equal(a.w.location.hash, '#feelings');
  assert.equal(a.w.history.length, length + 1, 'one entry');
  assert.equal(a.w.history.state.lpMenu, 'feelings');
  a.w.history.back(); await wait(40);
  assert.equal(a.w.LPShelf.menu, '', 'Android back comes back to the tiles');
  assert.equal(a.query('.tiles').hidden, false);
  assert.equal(a.query('.shelf-bar').hidden, true);
  assert.equal(a.query('[data-bubble] .line').textContent, 'Hello! I’m Nook. Let’s play.', 'and Nook’s greeting');
  a.click('[data-shelf="words"]');
  a.click('[data-back]');
  assert.equal(a.w.LPShelf.menu, '', 'the shelf button comes back at once');
  assert.equal(a.w.document.activeElement, a.query('[data-shelf="words"]'), 'focus goes back to the tile');
  await wait(40);
  assert.equal(a.w.location.hash, '', 'and its entry is gone');
  assert.equal(a.w.LPShelf.menu, '');
  a.click('[data-shelf="add"]'); a.click('[data-activity="take"]');
  assert.deepEqual(visits, ['garden.html#add/take']);
  // A link straight to a list (a grown-up's bookmark, a reload): the list shows; its shelf button drops it from the address.
  const b = app(t, 'index.html#feelings', { [P1 + 'feelings-v1']: { version: 2, mode: 'match' } });
  assert.equal(b.w.LPShelf.menu, 'feelings');
  assert.equal(b.query('.menu-tiles [aria-current="true"]').dataset.activity, 'which', 'a round-3 save (Match) marks Which feeling?');
  b.click('[data-back]');
  assert.equal(b.w.LPShelf.menu, '');
  assert.equal(b.w.location.hash, '');
  // Back from a game restores the hub from the page cache: the list marks what was played since.
  const c = app(t, 'index.html#shapes');
  assert.equal(c.query('.menu-tiles [aria-current="true"]').dataset.activity, 'sides');
  c.w.localStorage.setItem(P1 + 'shapes-position', JSON.stringify({ mode: 'name', level: 1, indices: {} }));
  const show = new c.w.Event('pageshow'); Object.defineProperty(show, 'persisted', { value: true });
  c.w.dispatchEvent(show);
  assert.equal(c.query('.menu-tiles [aria-current="true"]').dataset.activity, 'name');
  c.query('.menu-tiles [aria-current="true"]').dispatchEvent(new c.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(c.w.LPShelf.menu, '', 'Escape does what the list’s shelf button does');
});

test('a game reads its activity from the address once (garden.html#add/take, #words/letter, #patterns/make); the address then keeps the game only, so a reload keeps the save; every saved place and level is untouched', t => {
  const position = { mode: 'count', wordTab: 'order', indices: { count: 2, add: 1, take: 3, patterns: 4, make: 0, sentence: 5, letter: 1, order: 2, numbers: 0 }, selection: {}, levels: { count: 4, add: 2, numbers: 3, patterns: 9 }, operation: 'add', patternMode: 'finish', patternFamily: 0, strip: 1, spell: 1 };
  for (const [hash, check] of [
    ['add/take', a => { assert.equal(a.query('#task').dataset.view, 'add'); assert.equal(a.store('garden-position').operation, 'take'); assert.ok(a.query('.take-one'), 'the take-away picture'); }],
    ['words/letter', a => assert.equal(a.query('#task').dataset.view, 'letter')],
    ['patterns/make', a => assert.equal(a.query('#task').dataset.view, 'make')],
    ['patterns/finish', a => assert.equal(a.query('#task').dataset.view, 'patterns')],
    ['words', a => assert.equal(a.query('#task').dataset.view, 'order', 'without an activity the game carries on as saved')]
  ]) {
    const a = app(t, 'garden.html#' + hash, { [P1 + 'garden-position']: position });
    check(a);
    assert.equal(a.w.location.hash, '#' + hash.split('/')[0], hash + ': the address keeps the game only');
    const saved = a.store('garden-position');
    for (const key of ['indices', 'levels', 'patternFamily']) assert.deepEqual(saved[key], position[key], hash + ' ' + key);
  }
});

test('in Count, Add, Words and Patterns the pill is a small read-only label (an apple for Count and Add): a tap only lights it for a moment; no tap on any play screen opens a picker or the grown-ups’ chooser', t => {
  const a = app(t);
  for (const game of ['count', 'add']) {
    goTo(a, game);
    const label = a.query('#support');
    assert.equal(label.tagName, 'SPAN', game);
    assert.ok(label.classList.contains('pill-label'));
    assert.equal(label.getAttribute('role'), 'img');
    assert.equal(label.getAttribute('aria-label'), 'Level: ' + (game === 'count' ? '1–5' : 'Up to 5'));
    assert.ok(label.querySelector('.pill-art svg circle'), 'an apple');
  }
  goTo(a, 'add', 'take');
  assert.equal(a.query('#support').textContent, 'Up to 5');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    a.click('#support');
    assert.equal(a.query('.lp-modal'), null, 'nothing opens');
    assert.ok(a.query('#support').classList.contains('nudged'), 'a brief highlight');
    t.mock.timers.tick(650);
    assert.ok(!a.query('#support').classList.contains('nudged'), 'gone again');
  } finally { t.mock.timers.reset(); }
  for (const [game, activity] of [['count'], ['add', 'add'], ['add', 'take'], ['words', 'sentence'], ['words', 'letter'], ['words', 'order'], ['words', 'numbers'], ['patterns', 'finish'], ['patterns', 'make']]) {
    goTo(a, game, activity);
    const where = game + ' ' + (activity || '');
    assert.equal(a.query('#support').tagName, 'SPAN', where + ': a label, not a button');
    a.click('#support');
    for (const b of a.w.document.querySelectorAll('.nf-top button')) if (b.id !== 'shelf-open') b.click();
    assert.equal(a.w.document.querySelectorAll('.lp-modal, .level-picker, .set-picker, .family-picker, .puzzle-picker, #pick-sum, #picker-content').length, 0, where + ': nothing opens');
    assert.equal(a.query('#shelf-overlay').hidden, true);
  }
  assert.equal(a.w.LPFrame.picker, undefined, 'the phase-7 picker is gone');
  for (const file of ['garden.js', 'shapes.js', 'feelings.js', 'frame.js']) assert.doesNotMatch(read(file), /\.picker\(|kidPicker|data-operation|data-shapes-mode|class="chip"|data-pick/, file + ': no chips or picker');
  assert.doesNotMatch(read('garden.js'), /\$\('support'\)\.onclick|\$\('support'\)\.addEventListener/, 'the pill has no handler of its own; frame.js routes it');
  assert.doesNotMatch(read('frame.css'), /lp-kid|kid-tile/, 'and its styles went with it');
});

test('the Words list in a game: the Words tile opens four big tiles on the shelf, a drawing and one name each, in the player’s letter case; the activity playing is marked; one tap plays it in place and keeps drafts', t => {
  const a = app(t);
  goTo(a, 'words');
  for (const key of ['A', 'P']) a.click(`[data-key="${key}"]`);
  assert.equal(a.query('#support').getAttribute('aria-label'), 'Now: Missing word');
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="words"]');
  const list = a.query('#shelf-overlay .menu-tiles');
  const tiles = Array.from(list.querySelectorAll('.menu-tile'));
  assert.deepEqual(tiles.map(b => b.dataset.activity), ['sentence', 'letter', 'order', 'numbers']);
  assert.ok(tiles.every(b => b.querySelector('.menu-art[aria-hidden="true"] .mini')), 'each tile carries the small drawing from the old level strip');
  assert.equal(tiles[0].querySelector('.mini').textContent, 'THESAT', 'drawn in the player’s letter case');
  assert.equal(list.querySelector('[aria-current="true"]').dataset.activity, 'sentence');
  assert.equal(a.query('#shelf-overlay').querySelectorAll('p, select, input, .level-picker, .puzzle-picker, [data-close]').length, 0, 'no prose, levels, lists or close button');
  a.click('#shelf-overlay [data-activity="letter"]');
  assert.equal(a.query('#shelf-overlay').hidden, true, 'one tap plays it and closes the shelf');
  assert.equal(a.query('#task').dataset.view, 'letter');
  assert.equal(a.query('#support').textContent, 'Missing letter');
  assert.equal(a.store('garden-position').wordTab, 'letter');
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="words"]');
  assert.equal(a.query('#shelf-overlay .menu-tiles [aria-current="true"]').dataset.activity, 'letter', 'the list marks the activity playing now');
  a.click('#shelf-overlay [data-activity="sentence"]');
  assert.equal(a.query('#word-input').value, 'AP', 'the Missing word draft survived');
  assert.equal(a.w.document.activeElement, a.query('#word-input'), 'focus returns to the gap');
  a.w.LP.savePrefs({ ...a.w.LP.prefs, case: 'lower' });
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="words"]');
  assert.equal(a.query('#shelf-overlay [data-activity="sentence"] .mini').textContent, 'thesat');
});

test('Colour Blocks (phase 8, two audiences): the shelf button top-left opens Nook’s shelf over the board, which waits; Grown-ups starts with a Colour Blocks section whose Pace sets how blocks move; nothing else on the play screen changed', t => {
  const a = app(t, 'blocks.html');
  const header = a.query('header');
  assert.equal(header.firstElementChild, a.query('#shelf-open'));
  assert.ok(a.query('#shelf-open').classList.contains('nf-shelf'), 'the same shelf button as the frame games');
  for (const sel of ['[data-player]', '[data-settings]', '#pace', '.panel.pace']) assert.equal(a.query(sel), null, sel);
  for (const sel of ['[data-sound]', '#pause', '#undo', '#restart', '[data-action="left"]', '[data-action="place"]', '#board', '.nook-row', '.foot a.home-link']) assert.ok(a.query(sel), sel + ' stays');
  a.click('#shelf-open');
  const overlay = a.query('#shelf-overlay');
  assert.equal(overlay.hidden, false);
  assert.ok(overlay.classList.contains('lp-frame'), 'the frame’s button look holds on a page that is not a frame');
  assert.ok(a.query('#page').hasAttribute('inert'));
  assert.equal(a.w.document.body.style.overflow, 'hidden', 'Blocks’ page does not scroll behind the shelf');
  assert.equal(overlay.querySelector('.tiles [aria-current="true"]').dataset.shelf, 'blocks');
  assert.equal(a.query('#overlay').hidden, false, 'the board waits: Taking a break');
  const x = JSON.stringify(a.store('blocks-board').active);
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'p', bubbles: true }));
  assert.equal(a.query('#overlay').hidden, false, 'keys do not reach the board behind the shelf');
  assert.equal(JSON.stringify(a.store('blocks-board').active), x);
  a.click('#shelf-overlay [data-shelf="blocks"]');
  assert.equal(overlay.hidden, true, 'its own tile closes the shelf');
  assert.equal(a.w.document.body.style.overflow, '');
  grownups(a);
  assert.equal(a.query('.gu-game h3').textContent, 'Colour Blocks');
  assert.equal(a.query('.gu-now-text').textContent, 'Now: Wait for me. Blocks move only when tapped.');
  assert.equal(a.query('#gu-levels').textContent, 'Pace');
  a.click('#gu-levels');
  assert.match(a.query('#dialog-title').textContent, /^Pace/);
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('.lp-modal [data-pace]'), b => b.dataset.pace + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')), ['0*', '1800', '850']);
  a.click('.lp-modal [data-pace="850"]');
  assert.equal(a.query('.lp-modal'), null);
  assert.equal(overlay.hidden, true, 'back to the board');
  assert.equal(a.w.LP.prefs.pace, 850);
  assert.equal(a.store('little-patterns-v1').pace, 850, 'saved for this player');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    a.click('#resume');
    const y = a.store('blocks-board').active.y;
    t.mock.timers.tick(860);
    a.w.dispatchEvent(new a.w.Event('pagehide'));
    assert.equal(a.store('blocks-board').active.y, y + 1, 'the piece falls at the steady pace');
  } finally { t.mock.timers.reset(); }
  grownups(a); a.click('#gu-settings');
  assert.ok(a.query('#lp-settings [name="pace"]'), 'Settings keeps its Blocks move choice too');
});
