/* The Nook frame's behaviour, shared by every game page and the shelf (round 4). Load after shared.js,
   nook-art.js and icons.js. window.LPFrame:

     bubble(button, line)     Nook's one bubble. say(text, speech, success) shows a line; speech is the list of
                              bundled clip keys that say it. The bubble is a button: a tap hears the line again,
                              from bundled clips only and only while sound is on. The speaker glyph shows only when
                              the line has clips. flash() shows a short line for 2.6 s, then the line comes back.
     nook(button, options)    Places the phase-1 rig in the button's .nook-pos wrapper (placement and hops on the
                              wrapper, breathing on the svg), starts idle blinks, and answers a tap with one of
                              three small calm responses in turn: name the feeling, a wiggle, a blink with hello.
                              celebrate(feeling) changes the expression and makes one 8 px hop; rest() returns to
                              calm. Nothing here reacts to a mistake, to leaving or to absence.
     fit(task)                Adds fit-1, fit-2, fit-3 to the task until its content fits (games style these).
     onResize(fn)             Runs fn after the frame height follows a viewport change.

   The frame height follows the visual viewport (--app-h), so a device keyboard shrinks the frame and the task card
   scrolls inside it instead of the page. Play screens turn off the context menu outside inputs and dialogs. */
(function () {
  'use strict';
  const LP = window.LP, N = window.NookArt, I = window.LPIcons || {};
  const doc = document, root = doc.documentElement;
  const quiet = () => doc.body.classList.contains('softer') || !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---- the frame height follows the visual viewport ----
  const resizers = [];
  let pending = 0;
  function measure() {
    const vv = window.visualViewport, h = Math.round((vv && vv.height) || window.innerHeight || 0);
    if (h > 0) root.style.setProperty('--app-h', h + 'px');
  }
  function resized() {
    if (pending) return;
    pending = window.setTimeout(() => { pending = 0; measure(); resizers.forEach(fn => { try { fn(); } catch (_) { /* a game's fit must not stop the others */ } }); }, 60);
  }
  measure();
  window.addEventListener('resize', resized);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resized);
  window.addEventListener('orientationchange', resized);
  // No long-press menu or callout on play screens; inputs and the grown-ups' dialogs keep theirs.
  doc.addEventListener('contextmenu', e => { if (!(e.target.closest && e.target.closest('input,textarea,.lp-dialog'))) e.preventDefault(); });

  // ---- Nook's bubble ----
  function bubble(button, line) {
    let speech = [], timer = 0, saved = null;
    const hear = button.querySelector('.hear');
    if (hear && !hear.firstChild && I.sound) hear.innerHTML = I.sound;
    function apply(text, parts, success) {
      speech = Array.isArray(parts) ? parts.slice() : [];
      const playable = speech.length > 0 && LP.audio.has(speech);
      line.textContent = text;
      line.classList.toggle('success', !!success);
      button.classList.toggle('success', !!success);
      button.classList.toggle('silent', !playable);
      for (const el of doc.querySelectorAll('.bubble-inline')) { el.textContent = text; el.classList.toggle('success', !!success); }
    }
    function say(text, parts, success) { window.clearTimeout(timer); timer = 0; saved = null; apply(text, parts, success); }
    function flash(text, parts, options) {
      options = options || {};
      if (!saved) saved = { text: line.textContent, speech, success: line.classList.contains('success') };
      window.clearTimeout(timer);
      apply(text, parts, false);
      if (options.speak) play();
      timer = window.setTimeout(() => { timer = 0; const s = saved; saved = null; if (s) apply(s.text, s.speech, s.success); }, options.ms || 2600);
    }
    function play() {
      if (!speech.length || !LP.audio.has(speech)) return false;
      if (LP.audio.muted) { LP.status(LP.soundOff ? 'Sound is off. A grown-up can turn it on in Grown-ups.' : 'Sound is off.'); return false; }
      LP.audio.speak(speech, { auto: true });
      return true;
    }
    button.addEventListener('click', play);
    return { say, flash, hear: play, get text() { return line.textContent; }, get speech() { return speech.slice(); } };
  }

  // ---- Nook ----
  function nook(button, options) {
    options = options || {};
    const pos = button.querySelector('.nook-pos');
    pos.innerHTML = N.svg(options.feeling || 'calm', { decorative: true });
    const svg = pos.querySelector('svg');
    const idle = N.idle(svg);
    let turn = 0, hopTimer = 0, blinkTimer = 0;
    const feeling = () => svg.getAttribute('data-feeling') || 'calm';
    const replay = cls => { pos.classList.remove('nook-hop', 'nook-wiggle'); void pos.offsetWidth; pos.classList.add(cls); };
    pos.addEventListener('animationend', e => { if (e.target === pos) pos.classList.remove('nook-hop', 'nook-wiggle'); });
    function change(f) { if (feeling() !== f) N.change(svg, f); }
    // Success: the expression changes first, then one small hop once it has settled.
    function celebrate(f) {
      window.clearTimeout(hopTimer);
      change(f);
      if (!quiet()) hopTimer = window.setTimeout(() => replay('nook-hop'), 320);
    }
    function rest(f) { window.clearTimeout(hopTimer); change(f || options.feeling || 'calm'); }
    function blink() {
      window.clearTimeout(blinkTimer);
      if (quiet()) return;
      // Calm and happy have closed eyes, so their "blink" is the leaves' small follow-through instead.
      const cls = feeling() === 'calm' || feeling() === 'happy' ? 'nook-changing' : 'nook-blink';
      svg.classList.remove(cls); void svg.getBoundingClientRect(); svg.classList.add(cls);
      blinkTimer = window.setTimeout(() => svg.classList.remove(cls), cls === 'nook-blink' ? 120 : 700);
    }
    // A tap always gets one small calm response, in turn; never a bigger one, never a change to the puzzle.
    function tap() {
      idle.poke();
      const t = turn++ % 3, name = feeling() === 'greet' ? 'happy' : feeling();
      if (t === 1 && !quiet()) { replay('nook-wiggle'); return 'wiggle'; }
      if (t === 2) { if (options.bubble) options.bubble.flash('Hello! I’m Nook. Let’s play.', ["Hello! I'm Nook. Let's play."], { speak: true }); blink(); return 'hello'; }
      if (options.bubble) options.bubble.flash('Nook feels ' + name + '.', ['Nook feels ' + name + '.'], { speak: true });
      return 'feeling';
    }
    button.addEventListener('click', tap);
    return { get svg() { return svg; }, get wrapper() { return pos; }, get feeling() { return feeling(); }, celebrate, rest, tap, stop: () => idle.stop() };
  }

  // ---- fit the task's content to the card ----
  const FITS = ['fit-1', 'fit-2', 'fit-3'];
  function fit(task) {
    if (!task || !task.clientHeight) return 0;
    const over = () => task.scrollHeight > task.clientHeight + 1 || task.scrollWidth > task.clientWidth + 1;
    let level = 0;
    for (const cls of FITS) { if (!over()) break; task.classList.add(cls); level++; }
    return level;
  }
  function unfit(task) { if (task) task.classList.remove(...FITS); }

  window.LPFrame = { bubble, nook, fit, unfit, onResize: fn => resizers.push(fn), quiet };
})();
