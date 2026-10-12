// Feelings with Nook (round 4, phase 4): the data, the page in jsdom (the board and Nook's cancellable performance,
// Which feeling?, Friends, Me and its privacy contract) and Nook's small pay-offs in the other games. No browser
// rendering, network or real audio; tools/test-little-patterns-layout.cjs covers the six viewports.
// Install once: npm install --prefix .wrangler/test-runtime --no-save --ignore-scripts jsdom@26.1.0
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const F = require('../public/fireworks/little-patterns/feelings-data.js');
const A = require('../public/fireworks/little-patterns/feelings-art.js');
const L = require('../public/fireworks/little-patterns/learning.js');
const key = text => String(text).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
const P = 'lp-player-player-1-';
const flush = () => new Promise(r => setImmediate(r));

// Load a page with its scripts. Audio is recorded (play: 'ok' resolves, 'blocked' rejects as a browser does without a
// gesture); the device voice is recorded; fetch serves the private Blob bundle (and can be delayed or fail).
function app(t, { page = 'feelings.html', seed = {}, blocked = false, failed = false, delayed = false, play = 'ok', voices = [] } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, page.split('#')[0]), 'utf8'), { url: 'https://games.example/little-patterns/' + page, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, errors = [], requests = [], plays = [], players = [], urls = [], revoked = [], pending = [], utterances = [];
  w.addEventListener('error', e => errors.push(e.error || e.message));
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.Audio = function () { this.src = ''; this.preload = ''; this.play = () => { plays.push(this.src); return play === 'blocked' ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); }; this.pause = () => {}; this.load = () => {}; this.removeAttribute = n => { if (n === 'src') this.src = ''; }; players.push(this); };
  w.SpeechSynthesisUtterance = function (text) { this.text = text; };
  w.speechSynthesis = Object.assign(new w.EventTarget(), { getVoices: () => voices, speak: u => utterances.push(u), cancel() {} });
  w.URL.createObjectURL = () => { const url = 'blob:local-' + urls.length; urls.push(url); return url; };
  w.URL.revokeObjectURL = url => revoked.push(url);
  w.fetch = async (url, options) => { requests.push({ url, options }); if (delayed) await new Promise(resolve => pending.push(resolve)); if (failed) throw Error('Offline'); return { ok: true, blob: async () => new w.Blob(['voice']) }; };
  for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, JSON.stringify(v));
  if (blocked) Object.defineProperty(w, 'localStorage', { value: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } } });
  for (const s of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(root, s.getAttribute('src').split('?')[0]), 'utf8'));
  t.after(() => { t.mock.timers.reset(); assert.deepEqual(errors, [], 'no uncaught page errors'); dom.window.close(); });
  const query = s => w.document.querySelector(s), all = s => Array.from(w.document.querySelectorAll(s));
  const click = s => { const el = query(s); assert.ok(el, s); assert.ok(!el.closest('[hidden]'), 'visible ' + s); el.click(); return el; };
  const store = k => JSON.parse(w.localStorage.getItem(P + k));
  const clip = text => w.LPVoiceLibrary.clips[key(text)].file;
  const perf = () => w.LPFeelings && w.LPFeelings.performance;
  const big = () => { const s = query('.perform svg.nook'); return s && s.getAttribute('data-feeling'); };
  const ended = () => { const p = players[0]; assert.ok(p && p.onended, 'a clip is playing'); p.onended(); };
  return { w, query, all, click, store, clip, perf, big, ended, requests, plays, players, urls, revoked, pending, utterances, flush, t };
}
// Two audiences (phase 7, phase 8): the child picks an activity from the Feelings list under its shelf tile; the level
// and the story are the grown-ups', behind the two-second hold (faked with mock timers, as the gate test does) and
// Levels and puzzles.
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
const pick = (a, id) => { a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="feelings"]'); a.click(`#shelf-overlay [data-activity="${id}"]`); assert.equal(a.query('#shelf-overlay').hidden, true, 'one tap plays it'); };
const feelings = extra => ({ [P + 'feelings-v1']: { version: 2, mode: 'board', index: 0, level: 1, story: 0, seed: 1, ...extra } });
const timers = t => { t.mock.timers.enable({ apis: ['setTimeout'] }); return ms => t.mock.timers.tick(ms); };
const SOUND_OFF = { 'lp-sound': 'off' };

// ---- the data ----
test('the data: ten feelings on the board in a fixed order, the four activities, the difficult five, and the saved allow-list (round-3 saves still open)', () => {
  assert.equal(F.validate(), true);
  assert.deepEqual(F.BOARD.slice().sort(), F.FEELINGS.slice().sort(), 'every feeling once on the board');
  assert.deepEqual(F.BOARD, ['happy', 'calm', 'proud', 'excited', 'surprised', 'sad', 'worried', 'disappointed', 'angry', 'frustrated']);
  assert.deepEqual(F.ACTIVITIES, ['board', 'which', 'friends', 'me']);
  assert.deepEqual(Object.values(F.ACTIVITY_NAMES), ['Nook feels…', 'Which feeling?', 'Friends', 'Me']);
  assert.deepEqual(F.DIFFICULT, ['sad', 'angry', 'worried', 'frustrated', 'disappointed']);
  assert.deepEqual(F.normalise({ mode: 'match', index: 8, filter: 'worried', seed: 777, story: 6, meChoice: 'angry', matched: true }), { version: 2, mode: 'which', index: 8, level: 1, story: 6, seed: 777 }, 'a round-3 Match save opens Which feeling? and keeps its place');
  assert.equal(F.normalise({ mode: 'people' }).mode, 'friends');
  assert.equal(F.normalise({ mode: 'me' }).mode, 'me');
  assert.equal(F.normalise(null).mode, 'board');
  assert.equal(F.normalise({ level: 2 }).level, 2);
  assert.equal(F.normalise({ level: 7, index: -3, story: 99 }).level, 1);
  assert.deepEqual(Object.keys(F.normalise({ meChoice: 'sad', text: 'x', ticks: ['happy'] })).sort(), ['index', 'level', 'mode', 'seed', 'story', 'version']);
});

test('FEELINGS_SPEECH lists the 27 round-4 lines; since phase 5 they and the board prompt are in the spoken bank, and the old "You chose" lines are not', () => {
  const expected = [
    ...F.FEELINGS.map(f => 'Nook feels ' + f + '.'),
    ...F.FEELINGS.map(f => 'You feel ' + f + '. Thank you for telling me.'),
    'Nook takes a breath.', 'Thank you for telling me.', "That's OK. Not sure is fine.",
    'How does Nook feel?', 'How do you feel?', 'We said all the feelings.', 'We did it!'
  ];
  assert.deepEqual(F.FEELINGS_SPEECH, expected);
  const bank = new Set(L.spokenBank());
  for (const line of [...F.FEELINGS_SPEECH, F.LINES.board]) assert.ok(bank.has(key(line)), line + ' has a clip');
  for (const id of F.ME_KEYS) assert.ok(!bank.has(key(F.acknowledgement(id))), 'no screen says ' + F.acknowledgement(id));
  for (const f of F.FEELINGS) assert.ok(bank.has(key(F.WORDS[f])), 'the bare name ' + f + ' has a clip');
  assert.deepEqual(F.ME_BUNDLE, [...F.ME_KEYS.map(k => F.WORDS[k]), ...F.ME_KEYS.map(F.meLine)], 'Me bundles every name and every acknowledgement');
});

test('Which feeling?: a deterministic deck, every feeling once per pass of ten, three distinct words, the answer in every place, never a look-alike pair at level 1', () => {
  const pairs = [['sad', 'disappointed'], ['angry', 'frustrated']];
  const lookalike = c => pairs.some(([x, y]) => c.includes(x) && c.includes(y));
  let level2Pairs = 0;
  for (const seed of [1, 2, 55, 345235, 0xfffffff0]) for (const level of [1, 2]) for (let cycle = 0; cycle < 6; cycle++) {
    const rounds = Array.from({ length: 10 }, (_, i) => F.whichRound(cycle * 10 + i, seed, level));
    assert.deepEqual(rounds.map(r => r.feeling).sort(), F.FEELINGS.slice().sort(), 'each pass shows every feeling once');
    for (const r of rounds) {
      assert.equal(r.choices.length, 3); assert.equal(new Set(r.choices).size, 3); assert.ok(r.choices.includes(r.feeling));
      assert.ok(r.choices.every(c => F.FEELINGS.includes(c)));
      assert.deepEqual(r, F.whichRound(r.index, seed, level), 'deterministic');
      assert.match(r.id, /^which:v1:L[12]:[a-z]+:[a-z]+-[a-z]+-[a-z]+$/);
      if (level === 1) assert.ok(!lookalike(r.choices), 'level 1 never pairs look-alikes: ' + r.choices);
      else if (lookalike(r.choices)) level2Pairs++;
    }
  }
  assert.ok(level2Pairs > 0, 'level 2 includes the look-alike pairs');
  const places = new Set(Array.from({ length: 30 }, (_, i) => { const r = F.whichRound(i, 9, 1); return r.choices.indexOf(r.feeling); }));
  assert.deepEqual([...places].sort(), [0, 1, 2], 'the answer moves round the three places');
  const s = F.whichSuccess(F.whichRound(4, 1, 1));
  assert.equal(s.text, s.speech[0] + ' ' + F.WORDS[F.whichRound(4, 1, 1).feeling] + '.');
  const bank = new Set(L.spokenBank());
  for (let i = 0; i < F.WHICH_OPENERS.length; i++) for (const f of F.FEELINGS) for (const part of F.whichSuccess({ index: i, feeling: f }).speech) assert.ok(bank.has(key(part)), 'composed from existing clips: ' + part);
});

test('the Friends art: every person, feeling and pose drawn locally, and every story scene distinct', () => {
  const images = new Set();
  for (const p of F.PEOPLE) for (const f of F.FEELINGS) { const s = A.svg(p.id, f); images.add(s); assert.match(s, /role="img" aria-label=/); assert.ok(!/image |href=|https?:\/\/(?!www.w3.org)/.test(s)); assert.match(A.svg(p.id, f, { pose: true }), /viewBox="0 0 240 320"/); }
  assert.equal(images.size, 40);
  assert.equal(F.STORIES.length, 20);
  assert.equal(new Set(F.STORIES.map(s => s.scene)).size, 20);
  for (const f of F.FEELINGS) assert.equal(F.STORIES.filter(s => s.reportedFeeling === f).length, 2);
  for (const story of F.STORIES) assert.ok(!/image |href=|sixty/.test(A.scene(story)));
});

// ---- the page ----
test('Feelings is a Nook frame page: the shelf button and one read-only label, no Back, no sound button, no Menu, no links; the board of ten neutral cards with Nook resting', t => {
  const a = app(t);
  assert.deepEqual(a.all('.nf-top button').map(b => b.id), ['shelf-open']);
  assert.equal(a.query('#support').tagName, 'SPAN', 'the label is not a button (phase 8: the activity is picked from the shelf)');
  for (const old of ['#back', '#menu-open', '#page-sound', '[data-sound]', '#feelings-menu', '[data-player]']) assert.equal(a.query(old), null, old + ' is gone');
  assert.equal(a.all('#page a[href]').length, 0, 'no links on the play screen');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'feelings.html'), 'utf8'), /garden\.html/);
  assert.equal(a.query('#support').textContent, 'Nook feels…');
  assert.deepEqual(a.all('[data-feel]').map(b => b.dataset.feel), F.BOARD);
  for (const b of a.all('[data-feel]')) {
    assert.ok(b.querySelector('svg.nook-face'), 'a face crop');
    assert.equal(b.querySelector('.nook-rim').getAttribute('fill'), a.w.NookArt.COLOURS.body, 'Nook’s own lavender rim, the same for all ten (no feelings colours)');
    assert.equal(b.querySelector('.feel-word').textContent, F.WORDS[b.dataset.feel].toUpperCase());
  }
  assert.equal(new Set(a.all('.feel').map(b => b.className)).size, 1, 'one neutral card style');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest');
  assert.equal(a.query('#speech').textContent, 'Nook feels… Tap one.');
  assert.ok(['#help', '#hear', '#repeat', '#next', '#done'].every(s => a.query(s).hidden), 'the board asks nothing: no actions');
  a.click('#shelf-open');
  assert.equal(a.query('#shelf-overlay [aria-current="true"]').dataset.shelf, 'feelings');
  const { files } = require('./stage-little-patterns.cjs');
  for (const f of ['feelings.html', 'feelings.js', 'feelings.css', 'feelings-data.js', 'feelings-art.js', 'frame.js', 'frame.css', 'nook-art.js', 'nook.css', 'shelf.js', 'menus.js', 'icons.js']) assert.ok(files.includes(f), f + ' ships');
});

test('the Feelings list (phase 8): the Feelings tile on the shelf opens four big tiles (the Feelings picture, Nook’s face, a Friends scene, Nook’s face with the neutral ring), one name each, the activity playing marked; one tap plays it in place; the pill is a read-only label', t => {
  const a = app(t);
  assert.equal(a.query('#support').tagName, 'SPAN');
  assert.equal(a.query('#support').getAttribute('aria-label'), 'Now: Nook feels…');
  a.click('#support');
  assert.equal(a.query('.lp-modal'), null, 'the label opens nothing');
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="feelings"]');
  assert.equal(a.query('#shelf-overlay').hidden, false, 'the current game’s tile opens its list, not closes the shelf');
  assert.equal(a.query('#shelf-overlay [data-bubble] .line').textContent, 'Which feelings game?');
  assert.deepEqual(a.all('#shelf-overlay .menu-tile').map(b => b.dataset.activity), ['board', 'which', 'friends', 'me']);
  assert.deepEqual(a.all('#shelf-overlay .menu-word').map(b => b.textContent), ['Nook feels…', 'Which feeling?', 'Friends', 'Me']);
  const art = id => a.query(`#shelf-overlay [data-activity="${id}"] .menu-art`);
  assert.equal(art('board').querySelector('svg').outerHTML, a.query('#shelf-overlay [data-shelf="feelings"] svg').outerHTML, 'the Feelings tile’s own picture');
  assert.ok(art('which').querySelector('svg.nook-face'), 'Nook’s face');
  assert.ok(art('friends').querySelector('svg.menu-scene[aria-hidden="true"]'), 'a Friends scene, hidden from screen readers like every tile picture');
  assert.equal(art('friends').querySelector('[role="img"]'), null);
  assert.equal(art('me').querySelector('.nook-rim').getAttribute('fill'), a.w.NookArt.COLOURS.ring, 'Me: the neutral ring');
  assert.equal(a.query('#shelf-overlay').querySelectorAll('[data-close], p, [data-level], [data-stories], [data-story]').length, 0, 'no close button, prose, levels or stories');
  assert.equal(a.query('#shelf-overlay .menu-tiles [aria-current="true"]').dataset.activity, 'board');
  a.click('#shelf-overlay [data-activity="board"]');
  assert.equal(a.query('#shelf-overlay').hidden, true, 'the current one carries on');
  assert.equal(a.w.LPFeelings.activity, 'board');
  pick(a, 'which');
  assert.equal(a.w.LPFeelings.activity, 'which');
  assert.equal(a.query('#support').textContent, 'Which feeling?');
  a.click('#shelf-open'); a.click('#shelf-overlay [data-shelf="feelings"]');
  assert.equal(a.query('#shelf-overlay .menu-tiles [aria-current="true"]').dataset.activity, 'which', 'the list marks the activity playing now');
  a.click('#shelf-overlay [data-activity="friends"]');
  assert.equal(a.w.LPFeelings.activity, 'friends');
  assert.equal(a.store('feelings-v1').mode, 'friends');
  // From the hub's list: feelings.html#me starts Me, once; the address then drops it, so a reload keeps the save.
  const b = app(t, { page: 'feelings.html#me', seed: feelings({ mode: 'friends', story: 3 }) });
  assert.equal(b.w.LPFeelings.activity, 'me');
  assert.equal(b.store('feelings-v1').mode, 'me');
  assert.equal(b.store('feelings-v1').story, 3, 'the rest of the save is kept');
  assert.equal(b.w.location.hash, '');
});

test('Which feeling?’s level and the choice of a story are the grown-ups’: Grown-ups starts with the Feelings section, and Levels and puzzles holds the four activities, the two levels and any story; the pill follows', t => {
  const a = app(t);
  grownups(a);
  assert.equal(a.query('.gu-game h3').textContent, 'Feelings');
  assert.equal(a.query('.gu-now-text').textContent, 'Now: Nook feels…');
  a.click('#gu-levels');
  assert.deepEqual(a.all('[data-activity]').map(b => b.dataset.activity), ['board', 'which', 'friends', 'me']);
  assert.deepEqual(a.all('[data-activity] b').map(b => b.textContent), ['Nook feels…', 'Which feeling?', 'Friends', 'Me']);
  assert.equal(a.query('[data-activity="board"]').getAttribute('aria-pressed'), 'true');
  a.click('[data-level="2"]');
  assert.equal(a.w.LPFeelings.activity, 'which');
  assert.equal(a.store('feelings-v1').level, 2);
  assert.equal(a.query('#support').textContent, 'Which feeling? 2', 'the pill shows the level a grown-up chose');
  assert.equal(a.query('#shelf-overlay').hidden, true, 'back in the game');
  grownups(a);
  assert.equal(a.query('.gu-now-text').textContent, 'Now: Which feeling?, level 2: all ten');
  a.click('#gu-levels'); a.click('[data-stories]');
  assert.equal(a.all('[data-story]').length, 20);
  a.click('[data-story="11"]');
  assert.equal(a.w.LPFeelings.activity, 'friends');
  assert.equal(a.query('.story-art').dataset.scene, F.STORIES[11].scene);
  assert.equal(a.store('feelings-v1').story, 11);
  assert.ok(a.w.document.activeElement && !a.w.document.activeElement.closest('[hidden]'), 'focus lands on a visible control');
  assert.equal(a.all('[aria-live]').length, 1, 'a single feedback region');
});

// ---- the performance (item 56) ----
test('performance with sound: the word plays from the tap; enter, perform, then Nook HOLDS until the clip has actually ended plus 600 ms; a happy feeling returns without a breath; a tick draws; taps wait 300 ms', async t => {
  const a = app(t), tick = timers(t);
  a.click('[data-feel="happy"]');
  assert.equal(a.plays.at(-1), a.clip('Happy'), 'the bare name clip starts from the tap itself');
  assert.equal(a.perf().phase, 'enter');
  assert.ok(a.query('.board.fading'), 'the board fades');
  await flush();
  tick(160);
  assert.equal(a.w.LPFeelings.view, 'perform');
  assert.ok(a.query('#page').classList.contains('solo'), 'the frame Nook steps aside: one Nook at a time');
  assert.equal(a.query('#support').hidden, true);
  assert.equal(a.query('#done').hidden, false, 'Done in the right slot');
  assert.ok(a.query('#done .progress').classList.contains('on'), 'the line shows while a clip is actually playing');
  assert.equal(a.query('.perform-word').textContent, 'HAPPY');
  assert.equal(a.query('.perform-line').textContent, 'Nook feels happy.');
  tick(100);
  assert.equal(a.big(), 'happy', 'the expression changes behind a blink');
  tick(200);
  assert.ok(a.query('.perform-move').classList.contains('g-happy'), 'one gesture, on the wrapper');
  tick(30000);
  assert.equal(a.perf().phase, 'perform', 'no invented countdown: still waiting for the clip');
  assert.equal(a.perf().speaking, true);
  a.ended();
  assert.equal(a.plays.at(-1), a.clip('Nook feels happy.'), 'then Nook says the line (its clip since phase 5)');
  await flush();
  assert.equal(a.perf().phase, 'perform', 'still speaking: no hold yet');
  assert.ok(a.query('#done .progress').classList.contains('on'), 'the line keeps following the second clip');
  a.ended();
  assert.ok(!a.query('#done .progress').classList.contains('on'));
  tick(599);
  assert.equal(a.perf().phase, 'perform');
  tick(1);
  assert.equal(a.perf().phase, 'return', 'clip end + 600 ms, and happy skips the breath');
  assert.ok(!a.query('.perform.breathing'));
  tick(300);
  assert.equal(a.perf(), null);
  assert.equal(a.w.LPFeelings.view, 'board');
  assert.deepEqual(a.all('.feel.done').map(b => b.dataset.feel), ['happy']);
  assert.ok(a.query('.feel.done.fresh .tick'), 'the tick draws on that card');
  assert.ok(a.query('.board.arriving'), 'the board fades in');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'the frame Nook never changed');
  assert.equal(a.w.document.activeElement.dataset.feel, 'happy');
  const before = a.plays.length;
  a.click('[data-feel="calm"]');
  assert.equal(a.plays.length, before, 'the board ignores taps for 300 ms');
  assert.equal(a.perf(), null);
  tick(300);
  a.click('[data-feel="calm"]');
  assert.equal(a.perf().feeling, 'calm');
});

test('a difficult feeling settles with one visible breath back to calm, captioned only while it happens; the happy side never breathes', async t => {
  const a = app(t), tick = timers(t);
  a.click('[data-feel="sad"]'); await flush();
  tick(160); a.ended(); await flush(); a.ended();   // the word, then "Nook feels sad."
  tick(600);
  assert.equal(a.perf().phase, 'perform', 'held, but the gesture is still showing');
  assert.ok(!a.query('.perform.breathing'), 'no caption yet');
  tick(600);
  assert.equal(a.perf().phase, 'settle');
  assert.ok(a.query('.perform.breathing'), 'the caption shows while the breath happens');
  assert.equal(a.query('.perform-caption').textContent, 'Nook takes a breath.');
  assert.equal(a.query('#status').textContent, 'Nook takes a breath.');
  assert.ok(a.query('.perform-move.breath.from-sad'), 'the breath starts from the sink');
  tick(1100); assert.equal(a.big(), 'sad');
  tick(100); tick(100); assert.equal(a.big(), 'calm', 'back to calm on the out-breath (1.2 s in)');
  tick(1499); assert.equal(a.perf().phase, 'settle');
  tick(1);
  assert.ok(!a.query('.perform.breathing'), 'the caption goes when the breath ends');
  assert.equal(a.perf().phase, 'return');
  tick(300);
  assert.deepEqual(a.all('.feel.done').map(b => b.dataset.feel), ['sad']);
  for (const f of ['excited', 'proud', 'surprised', 'calm']) {
    tick(300);
    a.click(`[data-feel="${f}"]`); await flush();
    tick(160); a.ended(); await flush(); a.ended(); tick(1400);
    assert.equal(a.perf() && a.perf().phase, 'return', f + ' returns without a breath');
    assert.equal(a.perf().breathed, false);
    tick(300);
  }
});

test('with sound off, a blocked play() or a missing clip, Nook keeps the feeling and waits for Done (no countdown); Done takes a short calm return', async t => {
  for (const [label, options, prep] of [['sound off', { seed: SOUND_OFF }], ['blocked play()', { play: 'blocked' }], ['missing clip', {}, w => { delete w.LPVoiceLibrary.clips.worried; }]]) {
    await t.test(label, async t => {
      const a = app(t, options), tick = timers(t);
      if (prep) prep(a.w);
      a.click('[data-feel="worried"]'); await flush();
      assert.equal(a.perf().needDone, true, 'the performance knows nothing will end on its own');
      tick(160); tick(300);
      assert.equal(a.big(), 'worried', 'the expression stays');
      tick(120000);
      assert.equal(a.perf().phase, 'perform', 'still there two minutes later');
      assert.ok(!a.query('.perform.breathing'));
      assert.ok(!a.query('#done .progress').classList.contains('on'), 'no line without actual playback');
      a.click('#done');
      assert.equal(a.perf().phase, 'calming', 'Done: a short return to calm');
      tick(100); assert.equal(a.big(), 'calm');
      tick(500); assert.equal(a.perf().phase, 'return');
      tick(300);
      assert.equal(a.w.LPFeelings.view, 'board');
      assert.deepEqual(a.all('.feel.done').map(b => b.dataset.feel), ['worried']);
    });
  }
});

test('Done cancels speech and pending steps at once: a late clip end can never finish it again', async t => {
  const a = app(t), tick = timers(t);
  a.click('[data-feel="excited"]'); await flush();
  tick(160);
  const late = a.players[0].onended;
  a.click('#done');
  assert.equal(a.players[0].src, '', 'speech stopped');
  assert.equal(a.perf().phase, 'return', 'a happy-side feeling goes straight back');
  tick(300);
  assert.deepEqual(a.all('.feel.done').map(b => b.dataset.feel), ['excited']);
  const plays = a.plays.length;
  late();
  tick(5000);
  assert.equal(a.plays.length, plays, 'the old chain plays nothing more');
  assert.equal(a.perf(), null);
  assert.equal(a.w.LPFeelings.view, 'board');
});

test('a tap on the big Nook replays the word and the return waits until that replay has ended', async t => {
  const a = app(t), tick = timers(t);
  a.click('[data-feel="happy"]'); await flush();
  tick(160); tick(1300);
  a.ended();
  tick(300);
  const n = a.plays.length;
  a.click('.perform-nook'); await flush();
  assert.equal(a.plays.length, n + 1);
  assert.equal(a.plays.at(-1), a.clip('Happy'), 'the word again');
  assert.ok(a.query('#done .progress').classList.contains('on'));
  tick(5000);
  assert.equal(a.perf().phase, 'perform', 'the return waits for the replay');
  a.ended(); tick(600);
  assert.equal(a.perf().phase, 'return');
});

test('a new card, the shelf, a player change, pagehide and a bfcache restore cancel the whole sequence; ticks last one visit to the board', async t => {
  const seed = { 'lp-players': [{ id: 'one', name: 'First', avatar: '🌱' }, { id: 'two', name: 'Second', avatar: '🌱' }], 'lp-active-player': 'one' };
  const a = app(t, { seed }), tick = timers(t);
  a.click('[data-feel="happy"]'); await flush();
  tick(60);
  const first = a.perf().generation;
  a.click('[data-feel="sad"]'); await flush();
  assert.equal(a.perf().feeling, 'sad', 'a new card during the fade starts the new one');
  assert.ok(a.perf().generation > first);
  tick(160); tick(100);
  assert.equal(a.big(), 'sad');
  a.click('#shelf-open');
  assert.equal(a.perf(), null, 'the shelf cancels');
  assert.equal(a.w.LPFeelings.view, 'board');
  assert.equal(a.all('.feel.done').length, 0, 'a cancelled performance leaves no tick');
  assert.equal(a.players[0].src, '');
  a.w.LPShelf.close();
  tick(5000);
  assert.equal(a.all('.feel.done').length, 0, 'and nothing finishes later');
  a.click('[data-feel="calm"]'); await flush(); tick(160);
  a.w.LP.choosePlayer();
  a.all('.saved-text').find(b => b.textContent.includes('Second')).click();
  assert.equal(a.w.LP.player.id, 'two');
  assert.equal(a.perf(), null, 'a player change cancels');
  tick(5000);
  assert.equal(a.all('.feel.done').length, 0);
  a.click('[data-feel="angry"]'); await flush(); tick(160);
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  assert.equal(a.perf(), null, 'pagehide cancels');
  assert.equal(a.w.LPFeelings.view, 'board');
  a.click('[data-feel="proud"]'); await flush(); tick(160);
  const show = new a.w.Event('pageshow'); Object.defineProperty(show, 'persisted', { value: true });
  a.w.dispatchEvent(show);
  assert.equal(a.perf(), null, 'a bfcache restore cancels');
  tick(5000);
  // ticks: one visit to the board
  a.click('[data-feel="surprised"]'); await flush(); tick(160); a.click('#done'); tick(300);
  assert.deepEqual(a.all('.feel.done').map(b => b.dataset.feel), ['surprised']);
  pick(a, 'me');
  pick(a, 'board');
  assert.equal(a.all('.feel.done').length, 0, 'opening the board again starts with no ticks');
  assert.doesNotMatch(a.query('#task').textContent, /\d/, 'no counter');
});

test('the generation token: a late callback from an earlier performance never moves a newer one', async t => {
  const a = app(t), tick = timers(t), hooks = [];
  const speak = a.w.LP.audio.speak;
  a.w.LP.audio.speak = (text, options) => { if (options && options.on) hooks.push(options.on); return speak(text, options); };
  a.click('[data-feel="happy"]'); await flush(); tick(160);
  const old = hooks.at(-1);
  a.click('#shelf-open'); a.w.LPShelf.close();
  a.click('[data-feel="frustrated"]'); await flush(); tick(160); tick(1300);
  old.end(); tick(5000);
  assert.equal(a.perf().feeling, 'frustrated');
  assert.equal(a.perf().phase, 'perform', 'the old end did not start the hold');
  assert.equal(a.perf().speaking, true);
  old.fail();
  assert.equal(a.perf().needDone, false, 'nor did an old failure');
  hooks.at(-1).end(); tick(600);
  assert.equal(a.perf().phase, 'settle', 'the current one moves on its own end');
});

test('the Feelings prompts can be heard again (phase 5): "Nook feels… Tap one.", "How does Nook feel?" and "How do you feel?"', async t => {
  const a = app(t);
  assert.equal(a.query('#speech').textContent, F.LINES.board);
  assert.ok(!a.query('#bubble').classList.contains('silent'), 'the board prompt has its clip');
  a.click('#bubble'); await flush();
  assert.equal(a.plays.at(-1), a.clip(F.LINES.board));
  const b = app(t, { seed: feelings({ mode: 'which', index: 3, seed: 1 }) });
  assert.equal(b.query('#which-bubble .line').textContent, F.LINES.which);
  assert.ok(!b.query('#which-bubble').classList.contains('silent'));
  const c = app(t, { seed: feelings({ mode: 'me' }) });
  assert.equal(c.query('#speech').textContent, F.LINES.me);
  assert.ok(!c.query('#bubble').classList.contains('silent'));
});

test('the progress line follows actual playback only: on while a clip plays, hidden with sound off', async t => {
  const a = app(t), tick = timers(t);
  a.click('[data-feel="calm"]');
  assert.ok(!a.query('#done .progress').classList.contains('on'), 'not before the clip is playing');
  await flush(); tick(160);
  assert.ok(a.query('#done .progress').classList.contains('on'));
  assert.match(a.query('#done .progress').style.transition, /linear/);
  a.ended(); await flush();
  assert.ok(a.query('#done .progress').classList.contains('on'), 'still on through "Nook feels calm."');
  a.ended();
  assert.ok(!a.query('#done .progress').classList.contains('on'));
  const b = app(t, { seed: SOUND_OFF });
  b.click('[data-feel="calm"]'); await flush(); tick(160);
  assert.ok(!b.query('#done .progress').classList.contains('on'));
});

test('when all ten are ticked Nook says “We said all the feelings.” quietly; no counter, no celebration', async t => {
  const a = app(t, { seed: SOUND_OFF }), tick = timers(t);
  for (const f of F.BOARD) {
    a.click(`[data-feel="${f}"]`); await flush(); tick(160);
    a.click('#done'); tick(600); tick(300); tick(300);
  }
  assert.equal(a.all('.feel.done').length, 10);
  assert.equal(a.query('#speech').textContent, 'We said all the feelings.');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'Nook rests: no celebration');
  assert.ok(!a.query('#nook .nook-pos').classList.contains('nook-hop'));
});

// ---- Which feeling? ----
test('Which feeling?: Nook large as the task object (the frame Nook hidden), three words only; Help shows the faces, then outlines the answer', t => {
  const a = app(t, { seed: feelings({ mode: 'which', index: 3, seed: 1 }) });
  const r = F.whichRound(3, 1, 1);
  assert.ok(a.query('#page').classList.contains('solo'));
  assert.equal(a.query('.which-nook svg.nook').getAttribute('data-feeling'), r.feeling);
  assert.equal(a.query('#which-bubble .line').textContent, 'How does Nook feel?');
  assert.deepEqual(a.all('[data-which]').map(b => b.dataset.which), r.choices);
  assert.deepEqual(a.all('[data-which]').map(b => b.textContent), r.choices.map(f => F.WORDS[f].toUpperCase()));
  assert.equal(a.all('[data-which] svg').length, 0, 'words only: no faces');
  assert.equal(a.query('#help').hidden, false); assert.equal(a.query('#next').hidden, true);
  a.click('#help');
  assert.equal(a.all('[data-which] .pic svg.nook-face').length, 3, 'Help 1: Nook’s face beside each word');
  assert.equal(a.all('.answer.hint').length, 0);
  a.click('#help');
  assert.deepEqual(a.all('.answer.hint').map(b => b.dataset.which), [r.feeling], 'Help 2: the answer outlined');
});

test('Which feeling?: a wrong word changes only the bubble; the right one greens and locks, the bubble says the opener and the word, and Nook keeps the named feeling (no change, no hop)', async t => {
  const a = app(t, { seed: feelings({ mode: 'which', index: 0, seed: 1 }) }), tick = timers(t);
  const r = F.whichRound(0, 1, 1);
  a.click(`[data-which="${r.choices.find(c => c !== r.feeling)}"]`);
  const line = a.query('#which-bubble .line').textContent;
  assert.ok(L.FEEDBACK.retries.includes(line), 'a kind retry line');
  assert.equal(a.plays.at(-1), a.clip(line));
  assert.equal(a.query('.which-nook svg.nook').getAttribute('data-feeling'), r.feeling, 'Nook does not react to a mistake');
  const n = a.plays.length;
  a.click('.which-nook');
  assert.equal(a.plays.length, n + 1, 'a tap on Nook hears the line again');
  assert.equal(a.plays.at(-1), a.clip(line));
  assert.equal(a.all('[data-which]:disabled').length, 0);
  assert.equal(a.query('#next').hidden, true, 'no Next before success');
  a.click(`[data-which="${r.feeling}"]`);
  assert.ok(a.query(`[data-which="${r.feeling}"]`).classList.contains('chosen'));
  assert.equal(a.all('.answer.faded').length, 2);
  assert.equal(a.all('[data-which]:disabled').length, 3);
  const s = F.whichSuccess(r);
  assert.equal(a.query('#which-bubble .line').textContent, s.text);
  assert.equal(a.plays.at(-1), a.clip(s.speech[0]), 'the opener, then the word');
  a.ended();
  assert.equal(a.plays.at(-1), a.clip(s.speech[1]));
  tick(1000);
  assert.equal(a.query('.which-nook svg.nook').getAttribute('data-feeling'), r.feeling, 'Nook keeps the feeling the child named: a right answer never turns sad into happy');
  assert.ok(!a.query('.which-pos').classList.contains('nook-hop'), 'no hop on the big Nook');
  assert.equal(a.all('.answer.chosen').length, 1, 'only the chosen word greens');
  assert.equal(a.query('#next').hidden, false); assert.equal(a.query('#repeat').hidden, false); assert.equal(a.query('#help').hidden, true);
  a.click('#next');
  assert.equal(a.store('feelings-v1').index, 1);
  assert.equal(a.query('.which-nook svg.nook').getAttribute('data-feeling'), F.whichRound(1, 1, 1).feeling);
});

// ---- Friends ----
test('Friends: the twenty stories as in round 3: scene, words and “I feel …”, narrated on arrival; Hear replays; Next moves on; only Hear and Next', async t => {
  const a = app(t, { seed: feelings({ mode: 'friends', story: 0 }) });
  await flush();
  assert.ok(a.query('#page').classList.contains('solo'));
  assert.equal(a.plays.length, 1, 'the story is told on arrival');
  assert.equal(a.plays[0], a.clip(F.storyPrompt(F.STORIES[0])));
  for (let i = 0; i < F.STORIES.length; i++) {
    const story = F.STORIES[i];
    assert.equal(a.query('.story-feeling strong').textContent, F.WORDS[story.reportedFeeling].toUpperCase());
    assert.equal(a.query('.people-context').textContent, story.context);
    assert.equal(a.query('.story-art').dataset.scene, story.scene);
    assert.deepEqual(a.all('.nf-actions button:not([hidden])').map(b => b.id), ['hear', 'next']);
    a.click('#hear');
    assert.equal(a.plays.at(-1), a.clip(F.storyPrompt(story)));
    a.click('#next');
  }
  assert.equal(a.store('feelings-v1').story, 0, 'Next cycles round');
  const b = app(t, { seed: { ...feelings({ mode: 'friends' }), ...SOUND_OFF } });
  assert.equal(b.query('.sound-note').hidden, false);
  b.click('#hear'); assert.equal(b.plays.length, 0, 'Hear respects sound off');
});

// ---- Me (item 57) ----
test('Me: the child’s board with neutral rings, Something else and Not sure; a choice shows the face with a NEUTRAL ring and the word, Nook says “You feel …” and stays resting; Done goes back', async t => {
  const a = app(t, { seed: feelings({ mode: 'me' }) }), tick = timers(t);
  await flush();
  assert.deepEqual(a.all('[data-feel]').map(b => b.dataset.feel), F.BOARD);
  assert.ok(a.all('[data-feel] .nook-rim').every(r => r.getAttribute('fill') === '#8C8A99'), 'a neutral ring, never Nook’s lavender');
  assert.deepEqual(a.all('[data-me]').map(b => b.dataset.me), ['other', 'unsure']);
  assert.equal(a.query('#speech').textContent, 'How do you feel?');
  for (const f of F.BOARD) {
    const before = a.plays.length;
    a.click(`[data-feel="${f}"]`);
    assert.equal(a.plays.length, before + 1, 'the first tap speaks');
    assert.match(a.plays.at(-1), /^blob:/, 'from the private bundle');
    assert.equal(a.query('.me-face .nook-rim').getAttribute('fill'), '#8C8A99');
    assert.equal(a.query('.me-word').textContent, F.WORDS[f].toUpperCase());
    assert.equal(a.query('#speech').textContent, 'You feel ' + f + '. Thank you for telling me.');
    tick(400);
    assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'Nook never mirrors or fixes');
    assert.equal(a.query('#done').hidden, false);
    a.click('#hear-me'); assert.match(a.plays.at(-1), /^blob:/, 'the card hears it again from the bundle');
    a.click('#bubble'); assert.match(a.plays.at(-1), /^blob:/, 'so does the bubble');
    a.click('#nook'); assert.match(a.plays.at(-1), /^blob:/, 'and a tap on Nook');
    a.click('#done');
    assert.equal(a.w.document.activeElement.dataset.feel, f, 'back to the board, on that card');
  }
  a.click('[data-me="unsure"]');
  assert.equal(a.query('#speech').textContent, 'That’s OK. Not sure is fine.');
  assert.equal(a.query('.me-card.text-only .me-word').textContent, 'NOT SURE');
  assert.match(a.plays.at(-1), /^blob:/);
  a.click('#done');
  assert.ok(a.query('.me-board'));
  assert.equal(a.players.length, 1, 'one shared audio player');
});

test('Me privacy: ONE fixed Blob bundle of every name and acknowledgement is fetched as Feelings opens, before any choice; choices add no request; nothing is saved', async t => {
  const a = app(t); await flush();
  const lib = a.w.LPVoiceLibrary.clips, expected = [...new Set(F.ME_BUNDLE.map(key))].filter(k => lib[k]).map(k => lib[k].file);
  assert.ok(expected.length >= 12);
  assert.deepEqual(a.requests.map(r => r.url).sort(), expected.sort(), 'the fixed set, on the board, before Me is even opened');
  assert.ok(a.requests.every(r => r.options.credentials === 'omit' && r.options.referrerPolicy === 'no-referrer'));
  pick(a, 'me');
  const before = JSON.stringify(a.store('feelings-v1'));
  for (const f of [...F.FEELINGS, 'unsure']) { a.click(f === 'unsure' ? '[data-me="unsure"]' : `[data-feel="${f}"]`); a.click('#hear-me'); a.click('#done'); }
  assert.equal(a.requests.length, expected.length, 'no request chosen by an answer');
  assert.equal(JSON.stringify(a.store('feelings-v1')), before);
  assert.ok(!a.plays.some(p => /assets\/voice/.test(p)), 'never a library file for a Me choice');
  const texts = Object.values(a.w.localStorage).join(' ');
  for (const word of ['You feel', 'meChoice', 'unsure', 'Not sure']) assert.ok(!texts.includes(word), word + ' is not stored');
});

test('a late or failed private bundle never speaks an old choice or falls back to a request; late assets are discarded when the page is left', async t => {
  const a = app(t, { delayed: true, seed: feelings({ mode: 'me' }) });
  a.click('[data-feel="sad"]'); assert.equal(a.plays.length, 0);
  a.click('#done');
  a.pending.forEach(r => r()); await flush();
  assert.equal(a.plays.length, 0, 'a late bundle never replays an earlier choice');
  const n = a.requests.length;
  const b = app(t, { failed: true, seed: feelings({ mode: 'me' }) }); await flush();
  b.click('[data-feel="angry"]'); b.click('#hear-me');
  assert.equal(b.plays.length, 0); assert.equal(b.requests.length, n, 'no fallback request');
  const c = app(t, { delayed: true });
  c.w.dispatchEvent(new c.w.Event('pagehide'));
  c.pending.forEach(r => r()); await flush();
  assert.equal(c.urls.length, 0, 'late assets are discarded'); assert.equal(c.plays.length, 0);
});

test('Me clears on leaving Me, a player change, pagehide and a bfcache restore (the bundle is disposed and fetched again); hiding the page alone keeps the card to show someone', async t => {
  const seed = { 'lp-players': [{ id: 'one', name: 'First', avatar: '🌱' }, { id: 'two', name: 'Second', avatar: '🌱' }], 'lp-active-player': 'one', 'lp-player-one-feelings-v1': { mode: 'me', seed: 1 } };
  const a = app(t, { seed }); await flush();
  const bundle = a.requests.length;
  a.click('[data-feel="sad"]');
  pick(a, 'board');
  pick(a, 'me');
  assert.ok(a.query('.me-board'), 'leaving Me cleared it');
  a.click('[data-feel="sad"]');
  a.w.LP.choosePlayer(); a.all('.saved-text').find(b => b.textContent.includes('Second')).click();
  assert.equal(a.w.LP.player.id, 'two');
  assert.ok(!a.query('#activity').textContent.includes('You feel'));
  assert.equal(a.query('#hear-me'), null);
  assert.ok(!a.query('#speech').textContent.includes('You feel'));
  pick(a, 'me');
  a.click('[data-feel="angry"]');
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  assert.equal(a.query('#hear-me'), null, 'pagehide clears it');
  assert.equal(a.revoked.length, bundle, 'and disposes the bundle');
  const show = new a.w.Event('pageshow'); Object.defineProperty(show, 'persisted', { value: true });
  a.w.dispatchEvent(show); await flush();
  assert.equal(a.requests.length, bundle * 2, 'the same fixed bundle is fetched again before any choice');
  a.click('[data-feel="worried"]');
  const player = a.players[0];
  assert.match(player.src, /^blob:/);
  Object.defineProperty(a.w.document, 'hidden', { configurable: true, value: true }); a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));
  assert.equal(player.src, '', 'hiding stops the voice');
  Object.defineProperty(a.w.document, 'hidden', { configurable: true, value: false }); a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));
  assert.equal(player.src, '', 'and nothing replays on return');
  assert.ok(a.query('#hear-me'), 'visibility alone can keep a card to show someone');
  a.w.dispatchEvent(show);
  assert.equal(a.query('#hear-me'), null, 'a bfcache restore clears it');
  const texts = Object.values(a.w.localStorage).join(' ');
  assert.ok(!texts.includes('You feel')); assert.ok(!texts.includes('worried'));
});

test('the shelf and Grown-ups mute stop private playback and make no request; sound off keeps Me silent', async t => {
  const a = app(t, { seed: feelings({ mode: 'me' }) }); await flush();
  const n = a.requests.length;
  a.click('[data-feel="sad"]');
  const player = a.players[0]; assert.match(player.src, /^blob:/);
  a.click('#shelf-open'); assert.equal(player.src, '', 'opening the shelf stops it');
  a.query('#shelf-overlay').dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  a.click('#hear-me'); assert.match(player.src, /^blob:/);
  a.w.LP.setSound(false); assert.equal(player.src, '');
  const plays = a.plays.length;
  a.click('#hear-me'); a.click('#bubble');
  assert.equal(a.plays.length, plays, 'silent while sound is off');
  assert.equal(a.requests.length, n);
});

test('Something else reads typed words with an offline device voice only, never a matching clip; nothing typed is kept; the question is focused, not the box', async t => {
  const local = { name: 'Local English', lang: 'en-GB', localService: true }, remote = { name: 'Remote', lang: 'en-GB', localService: false, default: true };
  const a = app(t, { seed: feelings({ mode: 'me' }), voices: [remote, local] }); await flush();
  const requests = a.requests.length;
  a.click('[data-me="other"]'); await flush();
  assert.equal(a.w.document.activeElement.id, 'other-guide', 'the keyboard opens only when the child taps the box');
  assert.equal(a.utterances.at(-1).text, 'Type your words. Then tap the speaker.');
  assert.equal(a.utterances.at(-1).voice, local);
  a.click('#say-other'); await flush();
  assert.equal(a.w.document.activeElement.id, 'other-feeling', 'Say it with nothing typed goes to the box');
  const input = a.query('#other-feeling');
  input.value = 'happy'; input.dispatchEvent(new a.w.Event('input'));
  assert.ok(a.query('#say-other').classList.contains('ready'));
  const plays = a.plays.length;
  a.click('#say-other'); await flush();
  assert.equal(a.utterances.at(-1).text, 'happy');
  assert.equal(a.utterances.at(-1).voice, local);
  assert.equal(a.plays.length, plays, 'even a built-in word avoids a clip chosen by the answer');
  assert.equal(a.query('#speech').textContent, 'Thank you for telling me.');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest');
  input.value = 'I feel wobbly today'; input.dispatchEvent(new a.w.Event('input'));
  a.click('#other-feeling'); await flush();
  assert.equal(a.utterances.at(-1).text, 'I feel wobbly today');
  assert.equal(a.requests.length, requests);
  assert.ok(!Object.values(a.w.localStorage).join(' ').includes('wobbly'));
  a.click('#done'); a.click('[data-me="other"]');
  assert.equal(a.query('#other-feeling').value, '', 'Done clears the words');
  a.query('#other-feeling').value = 'private'; a.query('#other-feeling').dispatchEvent(new a.w.Event('input'));
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  a.click('[data-me="other"]');
  assert.equal(a.query('#other-feeling').value, '', 'pagehide clears them');
});

test('typed feelings never use a remote voice; pending speech is cancelled by an edit', async t => {
  const voices = [];
  const a = app(t, { seed: feelings({ mode: 'me' }), voices }); await flush();
  a.click('[data-me="other"]');
  const input = a.query('#other-feeling');
  input.value = 'old feeling'; input.dispatchEvent(new a.w.Event('input'));
  a.click('#say-other');
  input.value = 'new feeling'; input.dispatchEvent(new a.w.Event('input'));
  voices.push({ name: 'Local', lang: 'en-GB', localService: true }); a.w.speechSynthesis.dispatchEvent(new a.w.Event('voiceschanged')); await flush();
  assert.equal(a.utterances.length, 0, 'the edit cancelled the old words');
  voices.splice(0, 1, { name: 'Remote', lang: 'en-GB', localService: false });
  a.click('#say-other'); await new Promise(r => setTimeout(r, 1050));
  assert.equal(a.utterances.length, 0);
  assert.match(a.query('#status').textContent, /No offline English voice/);
});

test('saved state is an allow-list per player: activity, place, level, story and seed; never an answer or a Me report; blocked storage and lowercase work', t => {
  const a = app(t, { seed: { [P + 'feelings-v1']: { mode: 'match', index: 8, filter: 'worried', seed: 777, story: 6, meChoice: 'angry', matched: true } } });
  assert.equal(a.w.LPFeelings.activity, 'which', 'a round-3 save opens Which feeling?');
  assert.equal(a.query('.which-nook svg.nook').getAttribute('data-feeling'), F.whichRound(8, 777, 1).feeling);
  a.click(`[data-which="${F.whichRound(8, 777, 1).feeling}"]`);
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  assert.deepEqual(Object.keys(a.store('feelings-v1')).sort(), ['index', 'level', 'mode', 'seed', 'story', 'version']);
  assert.equal(a.store('feelings-v1').mode, 'which');
  const b = app(t, { blocked: true });
  pick(b, 'me');
  b.w.LP.savePrefs({ ...b.w.LP.prefs, case: 'lower', soft: true });
  assert.ok(b.w.document.body.classList.contains('softer'));
  assert.equal(b.query('[data-feel="happy"] .feel-word').textContent, 'happy');
});

// ---- Nook's pay-offs in the other games (item 33) ----
const garden = extra => ({ [P + 'garden-position']: { mode: 'count', wordTab: 'sentence', indices: {}, selection: {}, levels: {}, operation: 'add', patternMode: 'finish', patternFamily: 2, strip: 1, spell: 1, ...extra } });
test('pay-offs run on success only: Take away munches (a few chews, mouth only, no hop); nothing on a wrong answer; Softer skips the chewing', async t => {
  const a = app(t, { page: 'garden.html', seed: garden({ mode: 'add', operation: 'take', levels: { add: 2 }, selection: { add: [6, 2] } }) }), tick = timers(t);
  const pos = a.query('#nook .nook-pos'), mouth = () => a.query('#nook .nook-mouth').innerHTML;
  a.click('[data-choice]:not([data-choice="4"])'); tick(1000);
  assert.ok(!pos.classList.contains('nook-munch') && !pos.classList.contains('nook-hop'), 'nothing for a mistake');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest');
  a.click('[data-choice="4"]');
  tick(100);
  const happy = mouth();
  tick(230);
  assert.ok(pos.classList.contains('nook-munch'), 'Nook munches');
  assert.notEqual(mouth(), happy, 'the mouth opens');
  tick(140); assert.equal(mouth(), happy, 'and closes');
  assert.ok(!pos.classList.contains('nook-hop'), 'the munch replaces the hop');
  for (let i = 0; i < 6; i++) tick(140); // (the mock clock runs one step of the chain per tick)
  assert.ok(!pos.classList.contains('nook-munch'), 'under a second');
  assert.equal(mouth(), happy);
  const b = app(t, { page: 'garden.html', seed: { ...garden({ mode: 'add', operation: 'take', levels: { add: 2 }, selection: { add: [6, 2] } }), [P + 'little-patterns-v1']: { soft: true } } });
  b.click('[data-choice="4"]'); tick(400);
  assert.ok(!b.query('#nook .nook-pos').classList.contains('nook-munch'), 'Softer: no chewing');
});

test('pay-offs: Patterns shows the finished bead string under the bubble for under a second; Shapes holds the shape up beside Nook; neither on a wrong answer', async t => {
  const a = app(t, { page: 'garden.html', seed: garden({ mode: 'patterns' }) }), tick = timers(t);
  let done = false;
  for (const b of a.all('[data-choice]')) {
    b.click();
    done = !!a.query('#next:not([hidden])');
    if (!done) assert.equal(a.query('.bubble-prop'), null, 'nothing for a wrong piece');
    else break;
  }
  assert.ok(done);
  assert.ok(a.query('#bubble .bubble-prop .bead-mini'), 'the bead string under the bubble');
  assert.ok(a.all('.bubble-prop .bead-mini .shape, .bubble-prop .bead-mini b').length >= 4);
  tick(950);
  assert.equal(a.query('.bubble-prop'), null, 'gone within a second');
  const sides = L.shapeRound(0, L.defaults, 1, 'sides');
  const s = app(t, { page: 'shapes.html', seed: { [P + 'shapes-position']: { mode: 'sides', level: 1, indices: { sides: 0 } } } });
  s.click(`[data-choice="${sides.choices.find(c => c !== sides.answer)}"]`); tick(1000);
  assert.equal(s.query('.nook-prop'), null, 'nothing for a wrong number');
  s.click(`[data-choice="${sides.answer}"]`);
  tick(320);
  assert.ok(s.query('#nook .nook-prop svg.shape-icon'), 'the solved shape beside Nook');
  tick(100);
  assert.equal(s.query('#nook svg.nook').getAttribute('data-feeling'), 'excited', 'both mittens up, holding it');
  tick(900);
  assert.equal(s.query('.nook-prop'), null, 'gone within a second');
  const css = fs.readFileSync(path.join(root, 'frame.css'), 'utf8');
  assert.match(css, /@keyframes lp-prop-hop\{[^]*?translateY\(-8px\)/, 'the shape hops 8 px');
  assert.match(css, /\.softer \.nook-prop\{animation-name:lp-prop-fade\}/, 'Softer: a fade only');
});

test('feelings.css keeps the motion limits: gestures under 1.2 s, travel at most 12 px, scale at most 1.06, no shake; Softer and reduced motion stop them', () => {
  const css = fs.readFileSync(path.join(root, 'feelings.css'), 'utf8').replace(/\/\*[^]*?\*\//g, '');
  for (const m of css.matchAll(/\.perform-move\.g-[a-z]+\{animation:([a-z-]+) (\d+)ms(?: (\d+))?/g)) assert.ok(Number(m[2]) * Number(m[3] || 1) <= 1200, m[0]);
  for (const m of css.matchAll(/translate[XY]?\((-?\d+(?:\.\d+)?)px/g)) assert.ok(Math.abs(Number(m[1])) <= 12, m[0]);
  for (const m of css.matchAll(/scale\(([\d.]+)(?:,([\d.]+))?\)/g)) for (const v of [m[1], m[2]].filter(Boolean)) assert.ok(Number(v) <= 1.06, m[0]);
  assert.doesNotMatch(css, /shake|flash|blink/i);
  assert.match(css, /\.softer \.perform-move[^{]*\{animation:none!important\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\s*\.perform-move[^{]*\{animation:none!important\}/);
  assert.match(css, /\.perform-move\.breath\{animation:pf-breath 2800ms/, 'the breath is 1.2 s in and 1.6 s out');
});
