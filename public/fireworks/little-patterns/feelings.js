/* Feelings with Nook (round 4, phase 4), in the Nook frame. The level pill chooses one of four activities:

     Nook feels...   ten neutral cards (Nook's face crop and the word). A tap starts Nook's performance, a cancellable
                     sequence with a generation token (BUILD-BRIEF item 56):
                       enter    the board fades (160 ms) and Nook grows from the frame Nook's place to the centre
                                (300 ms), drawn at full size and scaled down so it is never a blurred raster
                       perform  the expression changes behind a blink and Nook makes one gesture (under 1.2 s, at most
                                12 px, no shake or flash); the speech started at the tap itself: the word, then
                                "Nook feels {x}." once that line has a clip (phase 5)
                       hold     until the last clip has actually ended, plus 600 ms
                       settle   sad, angry, worried, frustrated, disappointed: one visible breath back to calm (1.2 s
                                in, 1.6 s out), captioned "Nook takes a breath." only while it happens
                       return   Nook shrinks back, the board fades in, a tick draws on that card, taps wait 300 ms
                     Done (right slot) is always there, with a 6 px line that follows actual playback only. With sound
                     off, a blocked play() or a missing clip, Nook keeps the feeling and waits for Done: there is no
                     invented countdown. A tap on the big Nook replays the word and the return waits for it. A new
                     card, the shelf, a player change, pagehide or a bfcache restore cancel the whole sequence. Ticks
                     last for one visit to the board; when all ten are ticked Nook says "We said all the feelings."
     Which feeling?  Nook large as the task object, showing one feeling, with three word answers. Help shows Nook's
                     face beside each word, then outlines the answer. Level 1 never offers a look-alike pair. A right
                     answer greens the word and the bubble says the opener and the word; Nook keeps the feeling shown.
     Friends         the twenty stories, as in round 3: the scene, the words, Hear and Next.
     Me              the child's own board. A choice shows its face with a neutral ring and the word; Nook says "You
                     feel {x}. Thank you for telling me." and stays as it is (never mirrors, never fixes). Something
                     else (typed, an offline device voice) and Not sure stay. Private (item 57): one fixed Blob bundle
                     of every name and acknowledgement is fetched when Feelings opens, before any choice; nothing is
                     saved, logged or sent; the report clears on leaving Me, a player change, pagehide and bfcache.

   Saved per player (feelings-v1, an allow-list): the activity, Which feeling?'s place and level, the Friends story
   and the deck's seed. window.LPFeelings exposes a read-only view of the performance for tests. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const F = window.NookFeelings, A = window.NookFeelingsArt, N = window.NookArt, LP = window.LP, FR = window.LPFrame, S = window.LPShelf, L = window.GardenLearning, I = window.LPIcons || {};
  const T = { fade: 160, grow: 300, gesture: 1200, hold: 600, breathIn: 1200, breathOut: 1600, calm: 600, shrink: 300, quiet: 150, lock: 300 };
  const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true" class="speaker-icon"><path d="M3 9H7L12 5V19L7 15H3Z" fill="currentColor"/><path d="M16 8Q21 12 16 16M19 5Q26 12 19 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const letters = s => LP.prefs.case === 'lower' ? String(s).toLowerCase() : String(s).toUpperCase();
  const word = id => letters(F.WORDS[id]);
  // Shown with typographic apostrophes; the clip key stays the plain text.
  const pretty = t => String(t).replace(/'/g, '’');
  const clipKey = t => String(t).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  const task = $('task'), page = $('page');

  let saved, activity = 'board', view = 'board';
  let ticks = new Set(), fresh = null, locked = false, lockTimer = 0;
  let perf = null, generation = 0;
  let which = null, lastRetry = '', cardTalk = null;
  let meChoice = null, otherText = '', said = false, localVoice = null;

  // ---- saving: an allow-list only (never an answer, a tick or a Me report) ----
  function restore() {
    const stored = LP.storage.get('feelings-v1', null);
    saved = F.normalise(stored);
    if (!stored) saved.seed = Math.floor(Math.random() * 0xffffffff) || 1;
    activity = saved.mode;
  }
  function save() { saved.mode = activity; LP.storage.set('feelings-v1', F.normalise(saved)); }

  // ---- the Done line: a 6 px line inside Done that follows actual playback, and only that ----
  // A clip can start before Done is on screen (the performance speaks from the tap), so the line keeps the clip's start
  // time and is painted from it whenever Done shows.
  const now = () => (window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now());
  const bar = {
    el: null, run: null,
    off() { this.run = null; const el = this.el; if (!el) return; el.classList.remove('on'); el.style.transition = 'none'; el.style.transform = 'scaleX(0)'; },
    // parts: the texts being played (their clip lengths split the line), i: the clip that has just started playing.
    start(parts, i, seconds) {
      if (LP.audio.muted) return;
      const lib = (window.LPVoiceLibrary && window.LPVoiceLibrary.clips) || {};
      const secs = parts.map((p, k) => (k === i && seconds) || (lib[clipKey(p)] && lib[clipKey(p)].seconds) || 1);
      const total = secs.reduce((a, b) => a + b, 0), from = secs.slice(0, i).reduce((a, b) => a + b, 0) / total;
      this.run = { from, to: from + secs[i] / total, seconds: secs[i], t0: now() };
      this.paint();
    },
    paint() {
      const el = this.el, r = this.run;
      if (!el || !r || LP.audio.muted || el.closest('[hidden]')) return;
      const k = Math.max(0, Math.min(1, (now() - r.t0) / (r.seconds * 1000))), at = r.from + (r.to - r.from) * k;
      el.style.transition = 'none'; el.style.transform = 'scaleX(' + at.toFixed(4) + ')';
      void el.getBoundingClientRect();
      el.classList.add('on');
      el.style.transition = 'transform ' + Math.max(0, r.seconds * (1 - k)).toFixed(3) + 's linear';
      el.style.transform = 'scaleX(' + r.to.toFixed(4) + ')';
    }
  };

  // ---- the frame: pill, bubble, actions ----
  function pill() {
    const b = $('support');
    b.textContent = F.ACTIVITY_NAMES[activity] + (activity === 'which' && saved.level === 2 ? ' 2' : '');
    b.setAttribute('aria-label', 'Choose a Feelings activity. Now: ' + F.ACTIVITY_NAMES[activity]);
    b.hidden = view === 'perform';
  }
  // Two fixed slots: Help (or Hear, or small Again) on the left, Next or Done on the right.
  function actions(kind) {
    const show = { help: kind === 'help', hear: kind === 'story', repeat: kind === 'again', next: kind === 'story' || kind === 'again', done: kind === 'done' };
    for (const id of Object.keys(show)) $(id).hidden = !show[id];
    page.classList.toggle('no-actions', kind === 'none');
    if (kind === 'done') bar.paint(); else bar.off();
  }
  function layout(v) {
    view = v;
    page.dataset.view = v;
    page.classList.toggle('solo', v === 'perform' || v === 'which' || v === 'friends');
    task.dataset.view = v;
    pill();
  }

  // ---- Nook feels...: the board ----
  function card(f, me) {
    const done = !me && ticks.has(f);
    return '<button type="button" class="feel' + (me ? ' me-feel' : '') + (done ? ' done' : '') + (done && fresh === f ? ' fresh' : '') + '" data-feel="' + f + '" aria-label="' + esc(F.WORDS[f] + (done ? ', seen' : '')) + '">' +
      N.face(f, { decorative: true, className: 'feel-face', ring: me ? true : undefined }) + '<span class="feel-word">' + esc(word(f)) + '</span>' + (done ? '<span class="tick" aria-hidden="true">' + (I.tick || '') + '</span>' : '') + '</button>';
  }
  function boardView(arriving) {
    layout('board');
    const all = ticks.size === F.FEELINGS.length;
    talk.say(all ? F.LINES.all : F.LINES.board, [all ? F.LINES.all : F.LINES.board]);
    $('activity-title').textContent = 'Nook feels…';
    $('instruction').textContent = 'Tap a feeling. Nook shows it, says it, and comes back to the board.';
    task.innerHTML = '<div class="board' + (arriving ? ' arriving' : '') + '" role="group" aria-label="Nook’s feelings">' + F.BOARD.map(f => card(f, false)).join('') + '</div>';
    actions('none');
    nook.rest();
  }
  function lock() { locked = true; window.clearTimeout(lockTimer); lockTimer = window.setTimeout(() => { locked = false; }, T.lock); }

  // ---- the performance (item 56) ----
  const live = g => !!perf && perf.g === g;
  function later(fn, ms) {
    const g = perf.g;
    const id = window.setTimeout(() => { if (perf) perf.timers.delete(id); if (live(g)) fn(); }, ms);
    perf.timers.add(id);
    return id;
  }
  function clearTimers() { if (!perf) return; for (const id of perf.timers) window.clearTimeout(id); perf.timers.clear(); perf.hold = 0; }
  const bigSvg = () => task.querySelector('.perform svg.nook');
  const parts = f => [F.WORDS[f]].concat(LP.audio.has([F.nookFeels(f)]) ? [F.nookFeels(f)] : []);
  function frameRect() {
    const pos = $('nook-pos');
    if (!pos || FR.quiet() || !pos.getBoundingClientRect) return null;
    const r = pos.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { left: r.left, bottom: r.bottom, width: r.width, height: r.height } : null;
  }
  // From the small frame Nook to the big one (or back): the offset of the bottom centres and the size ratio.
  function travel(pos, from) {
    const r = pos.getBoundingClientRect();
    if (!from || !r.width || !r.height) return null;
    return 'translate(' + Math.round(from.left + from.width / 2 - (r.left + r.width / 2)) + 'px,' + Math.round(from.bottom - r.bottom) + 'px) scale(' + (from.height / r.height).toFixed(3) + ')';
  }
  function animate(el, frames, ms, easing) {
    if (!el || typeof el.animate !== 'function') return null;
    try { return el.animate(frames, { duration: ms, easing, fill: 'both' }); } catch (_) { return null; }
  }
  // Speech for the performance: the word (and the line), or a replay of the word. The hold starts when the last clip
  // has actually ended; a failure leaves Nook as it is, waiting for Done.
  function voice(list) {
    const g = perf.g;
    window.clearTimeout(perf.hold); perf.timers.delete(perf.hold); perf.hold = 0;
    perf.held = false; perf.speaking = true; perf.parts = list;
    bar.off();
    LP.audio.speak(list, { auto: true, on: {
      start: (i, n, clip) => { if (live(g)) bar.start(list, i, clip && clip.seconds); },
      end: () => { if (!live(g)) return; perf.speaking = false; perf.needDone = false; bar.off(); perf.hold = later(() => { perf.held = true; step(); }, T.hold); },
      fail: () => { if (!live(g)) return; perf.speaking = false; perf.needDone = true; bar.off(); LP.status('Nook feels ' + perf.feeling + '. Tap Done to go back.'); }
    } });
  }
  function start(f) {
    if (locked || !F.FEELINGS.includes(f)) return false;
    cancel();
    const g = ++generation;
    perf = { g, feeling: f, phase: 'enter', shown: false, speaking: false, held: false, needDone: false, breathed: false, timers: new Set(), hold: 0, from: frameRect(), parts: [] };
    // The speech starts from the tap itself (iPad audio permission): the word, then the line.
    voice(parts(f));
    LP.status('Nook feels ' + f + '.');
    const board = task.querySelector('.board');
    if (board) board.classList.add('fading');
    later(enter, FR.quiet() ? 0 : T.fade);
    return true;
  }
  function performView(f) {
    layout('perform');
    $('activity-title').textContent = 'Nook feels ' + f;
    $('instruction').textContent = 'Nook shows ' + f + '. Tap Nook to hear it again. Done goes back to the board.';
    task.innerHTML = '<div class="perform" data-feeling="' + f + '"><button type="button" class="perform-nook" aria-label="' + esc('Nook feels ' + f + '. Hear it again') + '"><span class="perform-pos"><span class="perform-move">' +
      N.svg('rest', { decorative: true }) + '</span></span></button><div class="perform-words"><p class="perform-word">' + esc(word(f)) + '</p><p class="perform-line">' + esc(F.nookFeels(f)) +
      '</p><p class="perform-caption" aria-hidden="true">' + esc(F.LINES.breath) + '</p></div></div>';
    actions('done');
  }
  function enter() {
    perf.phase = 'enter';
    performView(perf.feeling);
    const pos = task.querySelector('.perform-pos'), q = FR.quiet(), from = q ? null : travel(pos, perf.from);
    if (from) animate(pos, [{ transform: from }, { transform: 'none' }], T.grow, 'cubic-bezier(.2,.7,.3,1)');
    else pos.classList.add('nook-fade-in');
    later(perform, from ? T.grow : 0);
  }
  function perform() {
    perf.phase = 'perform';
    N.change(bigSvg(), perf.feeling);
    if (!FR.quiet()) later(() => { const m = task.querySelector('.perform-move'); if (m) m.className = 'perform-move g-' + perf.feeling; }, 120);
    later(() => { perf.shown = true; step(); }, FR.quiet() ? T.quiet : T.gesture);
  }
  function step() {
    if (!perf || perf.phase === 'enter' || perf.phase === 'return' || perf.phase === 'calming') return;
    if (!perf.shown || perf.speaking || perf.needDone || !perf.held) return;
    if (F.DIFFICULT.includes(perf.feeling) && !perf.breathed) { if (perf.phase !== 'settle') settle(); return; }
    if (perf.phase === 'settle') return;
    back();
  }
  // One visible breath back to calm, Nook's own, captioned while it happens. Softer and reduced motion: the caption and
  // the change to calm, without the movement.
  function settle() {
    perf.phase = 'settle';
    const view = task.querySelector('.perform'), move = task.querySelector('.perform-move');
    view.classList.add('breathing');
    LP.status(F.LINES.breath);
    if (!perf.speaking && !LP.audio.muted && LP.audio.has([F.LINES.breath])) LP.audio.speak([F.LINES.breath], { auto: true });
    if (move && !FR.quiet()) move.className = 'perform-move breath from-' + perf.feeling;
    later(() => N.change(bigSvg(), 'calm'), T.breathIn);
    later(() => { view.classList.remove('breathing'); perf.breathed = true; perf.phase = 'settled'; step(); }, T.breathIn + T.breathOut);
  }
  // Done: speech and every pending step stop; a difficult feeling takes a short return to calm first (600 ms).
  function done() {
    if (!perf || perf.phase === 'return' || perf.phase === 'calming') return;
    clearTimers();
    LP.audio.stopSpeech();
    bar.off();
    perf.speaking = false; perf.needDone = false;
    const view = task.querySelector('.perform');
    if (view) view.classList.remove('breathing');
    if (F.DIFFICULT.includes(perf.feeling) && !perf.breathed && bigSvg()) {
      perf.phase = 'calming';
      const move = task.querySelector('.perform-move');
      if (move) move.className = 'perform-move';
      N.change(bigSvg(), 'calm');
      later(back, T.calm);
    } else back();
  }
  function back() {
    perf.phase = 'return';
    bar.off();
    const pos = task.querySelector('.perform-pos'), q = FR.quiet(), to = pos && !q ? travel(pos, perf.from) : null;
    const move = task.querySelector('.perform-move');
    if (move) move.className = 'perform-move';
    if (to) animate(pos, [{ transform: 'none' }, { transform: to }], T.shrink, 'cubic-bezier(.45,0,.55,1)');
    else if (pos) pos.classList.add('perform-out');
    later(() => {
      const f = perf.feeling;
      perf = null;
      ticks.add(f); fresh = f;
      boardView(true); fresh = null;
      lock();
      const button = task.querySelector('[data-feel="' + f + '"]');
      if (button) button.focus({ preventScroll: true });
      if (ticks.size === F.FEELINGS.length) { LP.status(F.LINES.all); if (!LP.audio.muted && LP.audio.has([F.LINES.all])) LP.audio.speak([F.LINES.all], { auto: true }); }
    }, to ? T.shrink : T.quiet);
  }
  function replay() {
    if (!perf || perf.phase === 'enter' || perf.phase === 'return' || perf.phase === 'calming') return;
    voice([F.WORDS[perf.feeling]]);
  }
  // Cancel the whole sequence (a new card, the shelf, a player change, pagehide, bfcache): no late step can finish it.
  function cancel() {
    if (!perf) return false;
    clearTimers();
    perf = null;
    generation++;
    LP.audio.stopSpeech();
    bar.off();
    return true;
  }

  // ---- Which feeling? ----
  function newWhich() { which = { round: F.whichRound(saved.index, saved.seed, saved.level), hint: 0, done: false, feedback: '', retry: '' }; }
  function whichAnswers() {
    const r = which.round;
    return '<div class="choices which-words' + (which.hint >= 1 && !which.done ? ' pictured' : '') + '">' + r.choices.map(f => {
      const right = f === r.feeling, state = which.done ? (right ? ' chosen' : ' faded') : (which.hint >= 2 && right ? ' hint' : '');
      return '<button type="button" class="answer word' + state + '" data-which="' + f + '" aria-label="' + esc(F.WORDS[f]) + '"' + (which.done ? ' disabled' : '') + '>' +
        (which.hint >= 1 && !which.done ? '<span class="pic" aria-hidden="true">' + N.face(f, { decorative: true }) + '</span>' : '') + '<span class="word">' + esc(word(f)) + '</span></button>';
    }).join('') + '</div>';
  }
  function whichLine() {
    if (which.done) { const s = F.whichSuccess(which.round); cardTalk.say(s.text, s.speech, true); return; }
    if (which.feedback === 'retry') { cardTalk.say(which.retry, [which.retry]); return; }
    cardTalk.say(F.LINES.which, [F.LINES.which]);
  }
  function whichView() {
    layout('which');
    if (!which) newWhich();
    // Nook keeps the feeling the child named, before and after the answer: a right answer never "fixes" sad.
    const r = which.round, shown = r.feeling;
    $('activity-title').textContent = 'How does Nook feel?';
    $('instruction').textContent = 'Look at Nook, then choose the word for the feeling.';
    task.innerHTML = '<div class="objects which-objects"><button type="button" class="nf-bubble card-bubble" id="which-bubble"><span class="line"></span><span class="hear" aria-hidden="true"></span><span class="sr-only"> Hear it again</span></button>' +
      '<button type="button" class="which-nook" aria-label="Nook. Hear the question again"><span class="which-pos">' + N.svg(shown, { decorative: true }) + '</span></button></div><div class="answers">' + whichAnswers() + '</div>';
    cardTalk = FR.bubble($('which-bubble'), $('which-bubble').querySelector('.line'));
    whichLine();
    actions(which.done ? 'again' : 'help');
  }
  function chooseWhich(f) {
    if (!which || which.done) return;
    if (f !== which.round.feeling) {
      const line = L.retryLine(lastRetry);
      lastRetry = line; which.feedback = 'retry'; which.retry = line;
      whichLine();
      LP.status('Look at Nook again. Which word fits?');
      LP.audio.speak(line, { auto: true });
      return;
    }
    which.done = true; which.feedback = '';
    task.querySelector('.answers').innerHTML = whichAnswers();
    whichLine();
    actions('again');
    // No expression change and no hop: only the chosen word greens and the bubble says the opener and the word.
    const s = F.whichSuccess(which.round);
    LP.status(s.text);
    $('next').focus({ preventScroll: true });
    LP.audio.speak(s.speech, { auto: true });
  }
  function whichHelp() {
    if (!which || which.done) return;
    which.hint = Math.min(2, which.hint + 1);
    task.querySelector('.answers').innerHTML = whichAnswers();
    LP.status(which.hint === 1 ? 'Each word has Nook’s face beside it now.' : 'The word that fits is outlined.');
  }

  // ---- Friends: the twenty stories, as in round 3 ----
  function friendsView() {
    layout('friends');
    const story = F.STORIES[saved.story];
    $('activity-title').textContent = 'Friends';
    $('instruction').textContent = story.context;
    task.innerHTML = '<div class="objects friends-stage">' + A.scene(story) + '<p class="people-context">' + esc(story.context) + '</p><p class="story-feeling"><span>I feel</span> <strong>' + esc(word(story.reportedFeeling)) + '</strong></p>' +
      '<p class="sound-note"' + (LP.audio.muted ? '' : ' hidden') + '>Sound is off</p></div>';
    actions('story');
    $('hear').setAttribute('aria-label', 'Hear ' + F.person(story.person).name + ' tell the story');
  }
  function tellStory() { LP.audio.speak(F.storyPrompt(F.STORIES[saved.story]), { auto: true }); }

  // ---- Me: private to this screen (item 57) ----
  function prepareMe() { if (!localVoice) localVoice = LP.audio.prepareLocalClips(F.ME_BUNDLE); }
  function clearMe() { meChoice = null; otherText = ''; said = false; }
  // The bubble's line for a choice is heard from the private bundle only: the acknowledgement once it is rendered,
  // the bare name until then. Something else is read by an offline device voice. Never a request chosen by the answer.
  function speakMe() {
    if (!meChoice || LP.audio.muted) return false;
    if (meChoice === 'other') { if (otherText.trim()) { LP.audio.speakPrivate(otherText.trim()); return true; } guideOther(); return true; }
    if (!localVoice) return false;
    const on = { start: (i, n, clip) => bar.start([F.meLine(meChoice)], 0, clip && clip.seconds), end: () => bar.off(), fail: () => bar.off() };
    if (localVoice.speak(F.meLine(meChoice), on) || localVoice.speak(F.WORDS[meChoice], on)) { LP.status(''); return true; }
    LP.status('Sound is not ready. Tap the picture again.');
    return false;
  }
  function guideOther() { if (!LP.audio.muted) LP.audio.speakPrivate(F.LINES.type); }
  function meView(focus) {
    const choice = meChoice;
    layout(choice === 'other' ? 'me-other' : choice ? 'me-chosen' : 'me');
    nook.rest();
    $('activity-title').textContent = 'Me';
    LP.status('');
    if (!choice) {
      talk.say(F.LINES.me, [F.LINES.me]);
      $('instruction').textContent = 'Choose a feeling, Something else or Not sure. Nothing is saved.';
      task.innerHTML = '<div class="board me-board" role="group" aria-label="How do you feel?">' + F.BOARD.map(f => card(f, true)).join('') + '</div>' +
        '<div class="me-extra"><button type="button" class="me-more" data-me="other">' + esc(word('other')) + '</button><button type="button" class="me-more" data-me="unsure">' + esc(word('unsure')) + '</button></div>';
      actions('none');
    } else if (choice === 'other') {
      talk.say(said ? F.ME_REPLIES.other : F.LINES.type, [], false, speakMe);
      $('instruction').textContent = 'Type your words, then tap the speaker. Nothing is saved.';
      task.innerHTML = '<div class="objects other-feeling"><h3 class="other-label" id="other-guide" tabindex="-1">' + esc(F.LINES.me) + '</h3><textarea id="other-feeling" aria-labelledby="other-guide" maxlength="160" rows="2" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">' + esc(otherText) + '</textarea>' +
        '<button type="button" class="say-other' + (otherText.trim() ? ' ready' : '') + '" id="say-other">' + SPEAKER + '<span>Say it</span></button></div>';
      const input = $('other-feeling');
      input.addEventListener('input', () => { LP.audio.stopSpeech(); otherText = input.value.slice(0, 160); $('say-other').classList.toggle('ready', !!otherText.trim()); });
      actions('done');
    } else {
      talk.say(pretty(F.meLine(choice)), [], false, speakMe);
      $('instruction').textContent = 'Tap the card to hear it again. Done goes back. Nothing is saved.';
      const face = F.FEELINGS.includes(choice) ? N.face(choice, { decorative: true, ring: true, className: 'me-face' }) : '';
      task.innerHTML = '<div class="objects me-chosen"><button type="button" class="me-card' + (face ? '' : ' text-only') + '" id="hear-me" aria-label="' + esc('Hear ' + F.WORDS[choice]) + '">' + face + '<span class="me-word">' + esc(word(choice)) + '</span></button><p class="me-line">Show this to a grown-up if you like.</p></div>';
      actions('done');
    }
    if (focus) { const el = $(focus) || task.querySelector('[data-feel="' + focus + '"],[data-me="' + focus + '"]'); if (el) el.focus({ preventScroll: true }); }
  }
  function chooseMe(value) {
    meChoice = value; said = false;
    // Something else: focus the question, not the box, so the device keyboard opens only when the child taps it.
    meView(value === 'other' ? 'other-guide' : 'hear-me');
    if (value === 'other') guideOther(); else speakMe();
  }
  function sayOther() {
    if (!otherText.trim()) { $('other-feeling').focus(); guideOther(); return; }
    if (LP.audio.muted) { LP.status(LP.soundOff ? 'Sound is off. A grown-up can turn it on in Grown-ups.' : 'Sound is off.'); return; }
    said = true;
    talk.say(F.ME_REPLIES.other, [], false, speakMe);
    speakMe();
  }
  function leaveMe() { const old = meChoice; LP.audio.stopSpeech(); clearMe(); meView(old); }

  // ---- activities and the chooser ----
  function render(focus) {
    if (activity === 'board') boardView();
    else if (activity === 'which') whichView();
    else if (activity === 'friends') friendsView();
    else meView(focus);
  }
  function enterActivity(next, options) {
    options = options || {};
    cancel();
    LP.audio.stopSpeech();
    if (activity === 'me' || next === 'me') clearMe();
    activity = F.ACTIVITIES.includes(next) ? next : 'board';
    if (activity === 'board') ticks = new Set();
    if (activity === 'which' && (options.fresh || !which)) newWhich();
    save();
    render();
    if (activity === 'friends' && options.speak !== false) tellStory();
    focusTask();
  }
  function focusTask() {
    const target = task.querySelector('button:not(:disabled),textarea');
    if (target) target.focus({ preventScroll: true });
  }
  function chooser() {
    const rows = [
      ['board', 'Nook feels…', 'Nook shows each feeling. Tap a face.'],
      ['which', 'Which feeling?', 'How does Nook feel? Three words to choose from.'],
      ['friends', 'Friends', 'Twenty short stories. Hear and Next.'],
      ['me', 'Me', 'Say how you feel. Nothing is saved.']
    ];
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Feelings</h2><button data-close aria-label="Close the Feelings chooser">×</button></div><p>Everything is open. Choose any activity.</p><div class="feel-activities" role="group" aria-label="Activities"></div>', focusTask);
    const box = el.querySelector('.feel-activities');
    for (const [id, name, text] of rows) {
      const row = document.createElement('div');
      row.className = 'feel-activity';
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.activity = id;
      b.setAttribute('aria-pressed', String(activity === id));
      b.innerHTML = '<b>' + esc(name) + '</b><span>' + esc(text) + '</span>';
      b.onclick = () => { LP.closeModal(); enterActivity(id, { fresh: id === 'which' }); };
      row.appendChild(b);
      if (id === 'which') for (const level of [1, 2]) {
        const lv = document.createElement('button');
        lv.type = 'button'; lv.className = 'feel-level'; lv.dataset.level = String(level);
        lv.setAttribute('aria-pressed', String(activity === 'which' && saved.level === level));
        lv.textContent = level === 1 ? 'Level 1: no look-alikes' : 'Level 2: all ten';
        lv.onclick = () => { saved.level = level; saved.index = 0; LP.closeModal(); enterActivity('which', { fresh: true }); };
        row.appendChild(lv);
      }
      if (id === 'friends') {
        const pick = document.createElement('button');
        pick.type = 'button'; pick.className = 'feel-level'; pick.dataset.stories = '1';
        pick.textContent = 'Choose a story';
        pick.onclick = stories;
        row.appendChild(pick);
      }
      box.appendChild(row);
    }
  }
  function stories() {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Choose a story</h2><button data-close aria-label="Close the story chooser">×</button></div><div class="feel-stories" role="group" aria-label="Stories"></div>', focusTask);
    const box = el.querySelector('.feel-stories');
    F.STORIES.forEach((story, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.story = String(i);
      b.setAttribute('aria-pressed', String(activity === 'friends' && saved.story === i));
      b.textContent = story.context;
      b.onclick = () => { saved.story = i; LP.closeModal(); enterActivity('friends'); };
      box.appendChild(b);
    });
  }

  // ---- events ----
  task.addEventListener('click', e => {
    const feel = e.target.closest('[data-feel]');
    if (feel) { if (activity === 'board') start(feel.dataset.feel); else if (activity === 'me') chooseMe(feel.dataset.feel); return; }
    const more = e.target.closest('[data-me]');
    if (more) { chooseMe(more.dataset.me); return; }
    if (e.target.closest('.perform-nook')) { replay(); return; }
    // A tap on the big Nook in Which feeling? hears the bubble's line again: a small calm response, never a hint.
    if (e.target.closest('.which-nook')) { if (cardTalk) cardTalk.hear(); return; }
    const w = e.target.closest('[data-which]');
    if (w) { chooseWhich(w.dataset.which); return; }
    if (e.target.closest('#hear-me')) { speakMe(); return; }
    if (e.target.closest('#say-other')) { sayOther(); return; }
    // A tap in the box reads the typed words again, as in round 3.
    if (e.target.closest('#other-feeling') && otherText.trim()) speakMe();
  });
  $('help').addEventListener('click', whichHelp);
  $('hear').addEventListener('click', tellStory);
  $('next').addEventListener('click', () => {
    LP.audio.stopSpeech();
    if (activity === 'which') { saved.index = (saved.index + 1) % 1000001; newWhich(); save(); whichView(); focusTask(); }
    else if (activity === 'friends') { saved.story = (saved.story + 1) % F.STORIES.length; save(); friendsView(); tellStory(); }
  });
  $('repeat').addEventListener('click', () => { if (activity !== 'which') return; LP.audio.stopSpeech(); newWhich(); whichView(); focusTask(); });
  $('done').addEventListener('click', () => { if (perf) done(); else if (activity === 'me') leaveMe(); });
  $('support').addEventListener('click', chooser);
  // In Me, a tap on Nook hears Nook's line again (calm; Nook never names a feeling of its own over the child's).
  page.addEventListener('click', e => {
    if (activity !== 'me' || !e.target.closest || !e.target.closest('#nook')) return;
    e.stopPropagation();
    if (meChoice) speakMe();
  }, true);
  // The shelf, a player change, leaving the page and a bfcache restore cancel the performance and clear Me.
  document.addEventListener('lp:shelfopened', () => { if (cancel()) boardView(); });
  document.addEventListener('lp:beforeplayerchange', () => { cancel(); save(); clearMe(); LP.audio.stopSpeech(); LP.status(''); task.innerHTML = ''; });
  document.addEventListener('lp:playerchanged', () => { restore(); ticks = new Set(); which = null; if (activity === 'which') newWhich(); render(); LP.status('Ready to play. Every activity is open.'); });
  document.addEventListener('lp:preferences', () => { if (!perf) render(); });
  document.addEventListener('lp:sound', () => { const note = task.querySelector('.sound-note'); if (note) note.hidden = !LP.audio.muted; if (LP.audio.muted) bar.off(); });
  // Hiding the page stops the voice (shared.js); a performance that was speaking then waits for Done or a tap.
  document.addEventListener('visibilitychange', () => { if (document.hidden && perf && perf.speaking) { perf.speaking = false; perf.needDone = true; bar.off(); } });
  window.addEventListener('pagehide', () => {
    cancel(); save(); clearMe(); LP.audio.stopSpeech();
    if (localVoice) { localVoice.dispose(); localVoice = null; }
    if (activity === 'me') meView();
    else if (view === 'perform') boardView();
  });
  window.addEventListener('pageshow', e => { if (!e.persisted) return; cancel(); clearMe(); prepareMe(); if (activity === 'board') ticks = new Set(); render(); });
  FR.onResize(() => { if (perf) perf.from = null; });

  // ---- start ----
  $('help').innerHTML = (I.help || '') + '<span>Help!</span>';
  $('hear').innerHTML = SPEAKER + '<span>Hear</span>';
  $('next').innerHTML = 'Next <span aria-hidden="true">→</span>';
  $('repeat').textContent = '↻ Again';
  $('done').innerHTML = (I.tick || '') + '<span>Done</span><span class="progress" aria-hidden="true"></span>';
  bar.el = $('done').querySelector('.progress');
  const talk = FR.bubble($('bubble'), $('speech'));
  const nook = FR.nook($('nook'), { feeling: 'rest', bubble: talk });
  restore();
  // The private bundle is fetched as Feelings opens, before any choice, whatever the activity.
  prepareMe();
  if (activity === 'which') newWhich();
  S.mountOverlay({ current: 'feelings' });
  render();
  if (activity === 'friends') tellStory();

  window.LPFeelings = {
    get performance() { return perf ? { feeling: perf.feeling, phase: perf.phase, speaking: perf.speaking, held: perf.held, needDone: perf.needDone, breathed: perf.breathed, generation: perf.g } : null; },
    get ticks() { return Array.from(ticks); },
    get activity() { return activity; },
    get view() { return view; },
    get locked() { return locked; }
  };
})();
