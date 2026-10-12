/* The Nook frame's behaviour, shared by every game page and the shelf (round 4). Load after shared.js,
   nook-art.js and icons.js. window.LPFrame:

     bubble(button, line)     Nook's one bubble. say(text, speech, success, player) shows a line; speech is the list
                              of bundled clip keys that say it. The bubble is a button: a tap hears the line again,
                              from bundled clips only and only while sound is on. The speaker glyph shows only when
                              the line has clips. player (optional) replaces the bundled clips with the caller's own
                              playback (Me plays its private Blob bundle, never a clip chosen by the answer).
                              flash() shows a short line for 2.6 s, then the line comes back. prop(html) shows a small
                              picture just under the bubble for under a second (Patterns' bead string).
     nook(button, options)    Places the phase-1 rig in the button's .nook-pos wrapper (placement and hops on the
                              wrapper, breathing on the svg), starts idle blinks, and answers a tap with one of
                              three small calm responses in turn: name the feeling, a wiggle, a blink with hello.
                              Nook rests in the rig's rest state (the hello face, arms down) unless the game names
                              another. celebrate(feeling, payoff) changes the expression and makes one 8 px hop; rest()
                              returns to the resting look. Nothing here reacts to a mistake, to leaving or to absence.
                              The per-game pay-offs (round 4, item 33), each under a second, on success only:
                              { munch: true } a few chews of the mouth instead of the hop (Take away); { hold: html }
                              the solved shape hops once beside Nook's raised mitten instead of the hop (Shapes);
                              { beads: html } the hop plus the bead string under the bubble (Patterns). Softer and
                              reduced motion keep only short fades: no chewing, no hop.
     fit(task)                Adds fit-1, fit-2, fit-3 to the task until its content fits (games style these).
     pill(options)            The top bar's pill (#support): { text, art, label, hidden }, a small read-only label of
                              where the child is (the level a grown-up set, drawn where a picture says it). It is not
                              a button: a tap only lights it for a moment, and it never opens a chooser. Since phase 8
                              the child picks the activity from the game's list under its shelf tile (shelf.js), and
                              every level and puzzle is set in Grown-ups, behind the hold.
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
    let speech = [], timer = 0, saved = null, player = null, propTimer = 0;
    const hear = button.querySelector('.hear');
    if (hear && !hear.firstChild && I.sound) hear.innerHTML = I.sound;
    function apply(text, parts, success, custom) {
      speech = Array.isArray(parts) ? parts.slice() : [];
      player = typeof custom === 'function' ? custom : null;
      const playable = !!player || (speech.length > 0 && LP.audio.has(speech));
      line.textContent = text;
      line.classList.toggle('success', !!success);
      button.classList.toggle('success', !!success);
      button.classList.toggle('silent', !playable);
      for (const el of doc.querySelectorAll('.bubble-inline')) { el.textContent = text; el.classList.toggle('success', !!success); }
    }
    function say(text, parts, success, custom) { window.clearTimeout(timer); timer = 0; saved = null; apply(text, parts, success, custom); }
    function flash(text, parts, options) {
      options = options || {};
      if (!saved) saved = { text: line.textContent, speech, success: line.classList.contains('success'), player };
      window.clearTimeout(timer);
      apply(text, parts, false);
      if (options.speak) play();
      timer = window.setTimeout(() => { timer = 0; const s = saved; saved = null; if (s) apply(s.text, s.speech, s.success, s.player); }, options.ms || 2600);
    }
    function clearProp() { window.clearTimeout(propTimer); propTimer = 0; for (const el of button.querySelectorAll('.bubble-prop')) el.remove(); }
    function prop(html) {
      clearProp();
      const el = doc.createElement('span');
      el.className = 'bubble-prop';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html;
      button.appendChild(el);
      propTimer = window.setTimeout(clearProp, 950);
      return el;
    }
    function play() {
      if (player) return player() !== false;
      if (!speech.length || !LP.audio.has(speech)) return false;
      if (LP.audio.muted) { LP.status(LP.soundOff ? 'Sound is off. A grown-up can turn it on in Grown-ups.' : 'Sound is off.'); return false; }
      LP.audio.speak(speech, { auto: true });
      return true;
    }
    button.addEventListener('click', play);
    return { say, flash, prop, clearProp, hear: play, get text() { return line.textContent; }, get speech() { return speech.slice(); } };
  }

  // ---- Nook ----
  function nook(button, options) {
    options = options || {};
    const pos = button.querySelector('.nook-pos');
    const resting = options.feeling || 'rest';
    pos.innerHTML = N.svg(resting, { decorative: true });
    const svg = pos.querySelector('svg');
    const idle = N.idle(svg);
    let turn = 0, hopTimer = 0, blinkTimer = 0, munchTimer = 0, propTimer = 0;
    const feeling = () => svg.getAttribute('data-feeling') || resting;
    const replay = cls => { pos.classList.remove('nook-hop', 'nook-wiggle'); void pos.offsetWidth; pos.classList.add(cls); };
    pos.addEventListener('animationend', e => { if (e.target === pos) pos.classList.remove('nook-hop', 'nook-wiggle'); });
    function change(f) { if (feeling() !== f) N.change(svg, f); }
    // Take away's munch: the mouth opens and closes three times (140 ms each), with a 2 px chew on the wrapper.
    function stopMunch() {
      window.clearTimeout(munchTimer);
      if (munchTimer || pos.classList.contains('nook-munch')) { munchTimer = 0; pos.classList.remove('nook-munch'); N.mouth(svg); }
    }
    function munch() {
      stopMunch();
      if (quiet()) return false;
      let n = 0;
      pos.classList.add('nook-munch');
      const chew = () => {
        if (n >= 6) { munchTimer = 0; pos.classList.remove('nook-munch'); N.mouth(svg); return; }
        N.mouth(svg, n % 2 === 0 ? 'surprised' : null);
        n++;
        munchTimer = window.setTimeout(chew, 140);
      };
      chew();
      return true;
    }
    // Shapes: the solved shape appears beside the raised mitten and hops once (a fade only for Softer and reduced
    // motion), then goes, all within 900 ms.
    function stopProp() { window.clearTimeout(propTimer); propTimer = 0; for (const el of button.querySelectorAll('.nook-prop')) el.remove(); }
    function hold(html) {
      stopProp();
      const el = doc.createElement('span');
      el.className = 'nook-prop';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html;
      button.appendChild(el);
      propTimer = window.setTimeout(stopProp, 900);
      return el;
    }
    // Success: the expression changes first, then one small hop (or the game's pay-off) once it has settled.
    function celebrate(f, payoff) {
      payoff = payoff || {};
      window.clearTimeout(hopTimer); stopMunch(); stopProp();
      change(f);
      if (payoff.hold) { hopTimer = window.setTimeout(() => hold(payoff.hold), quiet() ? 0 : 320); return; }
      if (payoff.munch) { if (!quiet()) hopTimer = window.setTimeout(munch, 320); return; }
      if (!quiet()) hopTimer = window.setTimeout(() => replay('nook-hop'), 320);
      if (payoff.beads && options.bubble && options.bubble.prop) options.bubble.prop(payoff.beads);
    }
    function rest(f) { window.clearTimeout(hopTimer); stopMunch(); stopProp(); if (options.bubble && options.bubble.clearProp) options.bubble.clearProp(); change(f || resting); }
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
      const t = turn++ % 3, name = feeling() === 'greet' || feeling() === 'rest' ? 'happy' : feeling();
      if (t === 1 && !quiet()) { replay('nook-wiggle'); return 'wiggle'; }
      if (t === 2) { if (options.bubble) options.bubble.flash('Hello! I’m Nook. Let’s play.', ["Hello! I'm Nook. Let's play."], { speak: true }); blink(); return 'hello'; }
      if (options.bubble) options.bubble.flash('Nook feels ' + name + '.', ['Nook feels ' + name + '.'], { speak: true });
      return 'feeling';
    }
    button.addEventListener('click', tap);
    return { get svg() { return svg; }, get wrapper() { return pos; }, get feeling() { return feeling(); }, celebrate, rest, tap, munch, hold, stop: () => idle.stop() };
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

  // ---- the pill: a read-only label (phase 7; the child's picker went in phase 8) ----
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let nudgeTimer = 0;
  function pill(options) {
    options = options || {};
    let el = doc.getElementById('support');
    if (!el) return null;
    // A read-only label is not a button: swap the element, keeping its id, rather than leave a control that does nothing.
    if (el.tagName !== 'SPAN') {
      const next = doc.createElement('span');
      next.id = 'support';
      el.replaceWith(next);
      el = next;
    }
    el.className = 'pill pill-label';
    el.innerHTML = (options.art ? '<span class="pill-art" aria-hidden="true">' + options.art + '</span>' : '') + '<span class="pill-text">' + esc(options.text) + '</span>';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', options.label || 'Level: ' + options.text);
    el.hidden = !!options.hidden;
    return el;
  }
  // A tap on the label: a brief highlight, nothing else.
  doc.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('#support') : null;
    if (!el || el.closest('.lp-modal,.lp-overlay')) return;
    el.classList.remove('nudged'); void el.offsetWidth; el.classList.add('nudged');
    window.clearTimeout(nudgeTimer);
    nudgeTimer = window.setTimeout(() => el.classList.remove('nudged'), 650);
  });

  window.LPFrame = { bubble, nook, fit, unfit, onResize: fn => resizers.push(fn), quiet, pill };
})();
