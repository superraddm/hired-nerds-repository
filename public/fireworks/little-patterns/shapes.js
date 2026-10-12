/* Shapes with Nook (round 4, phase 3), in the Nook frame. Two modes, chosen from the two chips:

     Sides   a polygon drawn large. Tap each side: the first tap on a side lights it amber and gives it a number tag
             in tap order (the number is spoken while sound is on); a tap on a side already counted bumps its tag
             silently and never counts it again. When every side is lit the shape warms. Three number answers sit in
             the bottom row from the start, so a child who already knows can answer at once.
     Name    a shape (circles and ovals too) and three word answers. Help shows a small picture beside each word,
             then outlines the answer.

   A tap is converted into the shape's own units (the SVG's screen matrix, or its box when there is none) and the
   nearest side within 22 CSS pixels wins (GardenLearning.nearestSide: the hit maths is pure and tested). Help in
   Sides taps the next uncounted side for the child, round the shape from the last one counted (quicker presses wait
   their turn, 700 ms apart); once every side is lit, Help outlines the answer. Success: the chosen answer greens
   with a tick and the others fade,
   Nook changes to excited (both mittens up) and holds the shape up: a small copy hops once beside the raised mitten
   (round 4 item 33, under a second; a fade only for Softer and reduced motion), the bubble says the success line,
   and the shape warms. A
   wrong answer changes only the bubble (a kind retry line). Rounds come from learning.js (shapeRound); the mode,
   the level, each mode's place and each round's counted sides and Help step are saved per player and restored by
   round id. The level is shared by both modes. Two audiences (phase 7): the child switches Sides / Name with the two
   chips; the pill is a small read-only label of the level ("Shapes 1" with a triangle, square and circle, "Shapes 2"
   with a pentagon and hexagon), and the level chooser is the grown-ups', reached only from Grown-ups. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const L = window.GardenLearning, LP = window.LP, F = window.LPFrame, S = window.LPShelf, I = window.LPIcons || {};
  const MODES = ['sides', 'name'];
  const VIEW = [-24, -24, 288, 288];   // the 240 box with room around it for the number tags
  const HIT_PX = 22, TAG_GAP = 31, HELP_GAP = 700;
  const PROMPTS = {
    sides: { text: 'How many sides? Tap each side.', speech: ['How many sides?', 'Tap each side.'] },
    name: { text: 'Which shape is this?', speech: ['Which shape is this?'] }
  };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const letters = value => LP.prefs.case === 'lower' ? String(value).toLowerCase() : String(value).toUpperCase();

  let mode = 'sides', level = 1, indices = { sides: 0, name: 0 }, rounds = {}, celebrated = null, motion = null, lastRetry = '';
  let helpTimer = 0, helpQueue = 0;
  const current = () => rounds[mode];
  const create = m => L.shapeRound(indices[m] || 0, LP.prefs, level, m);

  // ---- saved state: the mode, the level, each mode's place, and the two rounds by id ----
  function save() {
    LP.storage.set('shapes-position', { mode, level, indices });
    const keep = r => r ? { id: r.id, counted: r.counted.slice(), hint: r.hint, done: r.done } : null;
    LP.storage.set('shapes-rounds', { sides: keep(rounds.sides), name: keep(rounds.name) });
  }
  function restoreRound(r, s) {
    if (!s || typeof s !== 'object' || s.id !== r.id) return r;
    r.done = s.done === true;
    if (Number.isInteger(s.hint)) r.hint = Math.max(0, Math.min(2, s.hint));
    if (r.mode === 'sides' && Array.isArray(s.counted)) for (const i of s.counted) if (Number.isInteger(i) && i >= 0 && i < r.sides && !r.counted.includes(i)) r.counted.push(i);
    if (r.done && r.mode === 'sides') complete(r);
    return r;
  }
  function restore() {
    const saved = LP.storage.get('shapes-position', {});
    mode = 'sides'; level = 1; indices = { sides: 0, name: 0 };
    if (saved && typeof saved === 'object') {
      if (MODES.includes(saved.mode)) mode = saved.mode;
      level = L.clampLevel('shapes', saved.level);
      for (const m of MODES) { const v = saved.indices && saved.indices[m]; if (Number.isSafeInteger(v) && v >= 0) indices[m] = v % 10000; }
    }
    const old = LP.storage.get('shapes-rounds', {});
    rounds = {};
    for (const m of MODES) rounds[m] = restoreRound(create(m), old && old[m]);
    celebrated = null;
  }

  // ---- drawing ----
  const pts = p => p.map(q => q[0] + ' ' + q[1]).join('L');
  function ellipse(e, cls) { return '<ellipse class="' + cls + '" cx="' + e.cx + '" cy="' + e.cy + '" rx="' + e.rx + '" ry="' + e.ry + '"' + (e.turn ? ' transform="rotate(' + e.turn + ' ' + e.cx + ' ' + e.cy + ')"' : '') + '/>'; }
  // The big shape. Sides: one grey stroke per side, an amber stroke over each counted side, a number tag per counted
  // side, and an invisible 44 px hit stroke per side on top. Name: one amber outline.
  function drawing(r) {
    const warm = r.done || (r.mode === 'sides' && r.counted.length === r.sides);
    const fill = 'fill' + (motion && motion.warm ? ' warming' : '');
    let s = '<svg class="big-shape' + (warm ? ' warm' : '') + '" viewBox="' + VIEW.join(' ') + '" aria-hidden="true" focusable="false">';
    if (r.ellipse) return s + ellipse(r.ellipse, fill) + ellipse(r.ellipse, 'outline') + '</svg>';
    const p = r.points, n = p.length, side = i => 'M' + p[i].join(' ') + 'L' + p[(i + 1) % n].join(' ');
    s += '<path class="' + fill + '" d="M' + pts(p) + 'Z"/>';
    if (r.mode === 'name') return s + '<path class="outline" d="M' + pts(p) + 'Z"/></svg>';
    for (let i = 0; i < n; i++) s += '<path class="side" d="' + side(i) + '"/>';
    for (const i of r.counted) s += '<path class="side lit' + (motion && motion.side === i ? ' fresh' : '') + '" pathLength="1" d="' + side(i) + '"/>';
    r.counted.forEach((i, k) => {
      const [x, y] = L.sideTag(p, i, TAG_GAP), cls = motion && motion.side === i ? ' fresh' : motion && motion.bump === i ? ' bump' : '';
      s += '<g transform="translate(' + x + ' ' + y + ')"><g class="tag' + cls + '" data-tag="' + i + '"><circle r="17"/><text y="8">' + (k + 1) + '</text></g></g>';
    });
    if (!r.done) for (let i = 0; i < n; i++) s += '<path class="hit" data-side="' + i + '" d="' + side(i) + '"/>';
    return s + '</svg>';
  }
  // A small canonical picture of a named shape (Name's first Help step).
  function icon(name) {
    const sample = { triangle: 'up', square: 'upright', rectangle: 'wide', circle: 'big', oval: 'wide', pentagon: 'upright', hexagon: 'flat' }[name];
    const drawn = L.SHAPE_CATALOGUE[name] && L.SHAPE_CATALOGUE[name][sample];
    if (!drawn) return '';
    const body = Array.isArray(drawn) ? '<path d="M' + pts(drawn) + 'Z"/>' : ellipse(drawn, '');
    return '<svg class="shape-icon" viewBox="0 0 240 240" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  function stageLabel(r) {
    if (r.mode === 'name') return 'The shape to name';
    if (r.done) return 'The shape, every side counted';
    return 'The shape. Tap each side to count it.' + (r.counted.length ? ' ' + r.counted.length + ' counted.' : '');
  }
  function stage(r) {
    const counting = r.mode === 'sides' && !r.done;
    return '<div class="shape-stage' + (counting ? ' counting' : '') + '" data-shape="' + esc(r.shape) + '" data-variant="' + esc(r.variant) + '"' +
      (counting ? ' role="button" tabindex="0"' : ' role="img"') + ' aria-label="' + esc(stageLabel(r)) + '">' + drawing(r) + '</div>';
  }
  function answers(r) {
    const word = r.mode === 'name', pictured = word && r.hint >= 1 && !r.done;
    return '<div class="choices' + (word ? ' shape-words' + (pictured ? ' pictured' : '') : '') + '">' + r.choices.map(v => {
      const right = String(v) === String(r.answer);
      const state = r.done ? (right ? ' chosen' : ' faded') : (r.hint >= 2 && right ? ' hint' : '');
      const label = word ? letters(v) : String(v);
      const inner = word ? (pictured ? '<span class="pic" aria-hidden="true">' + icon(String(v).toLowerCase()) + '</span>' : '') + '<span class="word">' + esc(label) + '</span>' : esc(v);
      return '<button type="button" class="choice answer' + (word ? ' word' : '') + state + '" data-choice="' + esc(v) + '" aria-label="Choose ' + esc(label) + '"' + (r.done ? ' disabled' : '') + '>' + inner + '</button>';
    }).join('') + '</div>';
  }

  // ---- the frame: chips, pill, bubble, actions, Nook ----
  function chips() {
    const el = $('modes');
    if (!el.firstChild) el.innerHTML = [['sides', 'Sides'], ['name', 'Name']].map(([m, label]) => '<button type="button" class="chip" data-shapes-mode="' + m + '" aria-pressed="false">' + label + '</button>').join('');
    for (const b of el.querySelectorAll('[data-shapes-mode]')) b.setAttribute('aria-pressed', String(b.dataset.shapesMode === mode));
  }
  const LEVEL_ICONS = { 1: ['triangle', 'square', 'circle'], 2: ['pentagon', 'hexagon'] };
  const LEVEL_TEXT = { 1: 'triangles, squares, rectangles, circles and ovals, turned and stretched', 2: 'adds pentagons and hexagons, some turned or uneven' };
  const levelArt = n => LEVEL_ICONS[n].map(icon).join('');
  function pill() { F.pill({ text: 'Shapes ' + level, art: levelArt(level), label: 'Level: Shapes ' + level }); }
  // The bubble renders from round state: the success line once done, the kind retry line after a wrong answer,
  // otherwise the mode's prompt. It is a button that hears its line again from bundled clips.
  function bubble() {
    const r = current();
    if (r.done) { const line = L.successLine('shapes', r); talk.say(line.text, line.speech, true); return; }
    if (r.feedback === 'retry' && r.retryLine) { talk.say(r.retryLine, [r.retryLine]); return; }
    talk.say(PROMPTS[r.mode].text, PROMPTS[r.mode].speech);
  }
  // Two fixed slots: Help on the left while a puzzle is open, Again (small) there after success; Next on the right only after success.
  function actions(done) { $('help').hidden = done; $('repeat').hidden = !done; $('next').hidden = !done; }
  // Nook keeps the expression of a round it has just celebrated; otherwise it shows its resting look.
  function mood() { const r = current(); if (!(r && r.done && r.id === celebrated)) nook.rest(); }

  function render() {
    const r = current(), task = $('task');
    const stageFocused = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('shape-stage');
    $('page').dataset.mode = mode;
    task.dataset.view = mode;
    chips(); pill();
    $('activity-title').textContent = mode === 'sides' ? 'How many sides?' : 'Which shape is this?';
    $('instruction').textContent = mode === 'sides' ? 'Tap each side of the shape to count it, then choose how many sides it has.' : 'Look at the shape, then choose its name.';
    task.innerHTML = '<div class="objects">' + stage(r) + '</div><div class="answers">' + answers(r) + '</div>';
    task.scrollTop = 0;
    actions(r.done);
    bubble(); mood(); save();
    if (stageFocused) task.querySelector('.shape-stage')?.focus({ preventScroll: true });
  }
  // Redraw only the shape (a count or a bump), so focus and the answers stay where they are.
  function redraw() {
    const r = current(), el = $('task').querySelector('.shape-stage');
    if (!el) { render(); return; }
    el.innerHTML = drawing(r);
    el.setAttribute('aria-label', stageLabel(r));
  }

  // ---- counting sides ----
  // The next side Help counts: round the shape, clockwise, from the last side counted (side 1 when none is).
  function nextSide(r) {
    const n = r.sides, last = r.counted.length ? r.counted[r.counted.length - 1] : -1;
    for (let k = 1; k <= n; k++) { const i = (last + k) % n; if (!r.counted.includes(i)) return i; }
    return -1;
  }
  function complete(r) { for (let i = nextSide(r); i >= 0; i = nextSide(r)) r.counted.push(i); }
  function countSide(i) {
    const r = current();
    if (!r || r.mode !== 'sides' || !r.points || !(i >= 0 && i < r.sides)) return false;
    if (r.counted.includes(i)) {
      // A counted side: the same side is acknowledged silently (its tag bumps) and never counted again.
      motion = { bump: i }; redraw(); motion = null;
      LP.status('That side is counted: ' + (r.counted.indexOf(i) + 1) + '.');
      return false;
    }
    if (r.done) return false;
    r.counted.push(i);
    const n = r.counted.length, all = n === r.sides;
    motion = { side: i, warm: all }; redraw(); motion = null;
    LP.audio.speak(L.numberSpeech(n), { auto: true });
    LP.status(all ? 'Every side is counted: ' + n + '. Now choose how many sides.' : 'Side ' + n + '.');
    save();
    return true;
  }
  // Pointer to the shape's own units: the SVG's screen matrix (it includes the viewBox fit and any CSS transform);
  // without one, the element's box and the viewBox's "meet" fit. scale is CSS pixels per unit.
  function toUser(svg, x, y) {
    if (!svg) return null;
    let m = null;
    try { m = typeof svg.getScreenCTM === 'function' ? svg.getScreenCTM() : null; } catch (_) { m = null; }
    if (m && [m.a, m.b, m.c, m.d, m.e, m.f].every(Number.isFinite)) {
      const det = m.a * m.d - m.b * m.c;
      if (Math.abs(det) > 1e-9) { const dx = x - m.e, dy = y - m.f; return { x: (m.d * dx - m.c * dy) / det, y: (m.a * dy - m.b * dx) / det, scale: Math.sqrt(Math.abs(det)) }; }
    }
    const box = svg.getBoundingClientRect(), [vx, vy, vw, vh] = VIEW;
    if (!box.width || !box.height) return null;
    const s = Math.min(box.width / vw, box.height / vh), ox = box.left + (box.width - vw * s) / 2, oy = box.top + (box.height - vh * s) / 2;
    return { x: vx + (x - ox) / s, y: vy + (y - oy) / s, scale: s };
  }
  function tapAt(x, y) {
    const r = current();
    if (!r || r.mode !== 'sides' || !r.points) return -1;
    const u = toUser($('task').querySelector('svg.big-shape'), x, y);
    if (!u) return -1;
    const i = L.nearestSide(r.points, u.x, u.y, HIT_PX / u.scale, r.counted);
    if (i < 0) { if (!r.done) LP.status('Tap on a side of the shape.'); return -1; }
    countSide(i);
    return i;
  }
  function stopHelp() { window.clearTimeout(helpTimer); helpTimer = 0; helpQueue = 0; }

  // ---- answers, Help, success ----
  function wrong(r) {
    const line = L.retryLine(lastRetry);
    lastRetry = line; r.feedback = 'retry'; r.retryLine = line;
    bubble();
    LP.status(r.mode === 'sides' ? 'Tap each side to count it, then choose how many.' : 'Look at the shape again. Which name fits?');
    LP.audio.speak(line, { auto: true });
    save();
  }
  function succeed(r) {
    stopHelp();
    const wasWarm = r.mode === 'sides' && r.counted.length === r.sides;
    r.done = true; r.feedback = '';
    if (r.mode === 'sides') complete(r);
    celebrated = r.id;
    motion = { warm: !wasWarm }; render(); motion = null;
    const line = L.successLine('shapes', r);
    LP.status(line.text);
    nook.celebrate('excited', { hold: icon(r.shape) });
    $('next').focus({ preventScroll: true });
    if (line.speech.length) LP.audio.speak(line.speech, { auto: true });
  }
  function choose(value) {
    const r = current();
    if (!r || r.done) return;
    if (String(value) !== String(r.answer)) { wrong(r); return; }
    succeed(r);
  }
  function outline(r) {
    for (const b of $('task').querySelectorAll('[data-choice]')) b.classList.toggle('hint', String(b.dataset.choice) === String(r.answer));
  }
  // One Help step in Sides: tap the next uncounted side for the child, round the shape (spoken while sound is on);
  // once every side is lit, outline the answer.
  function sidesHelp(r) {
    if (nextSide(r) >= 0) { countSide(nextSide(r)); return; }
    r.hint = 2; outline(r);
    LP.status('A ' + r.shape + ' has ' + r.sides + ' sides. Choose ' + r.sides + '.');
    save();
  }
  // Help! Sides: each press taps the next uncounted side, like Count's Help counting one more; presses that come
  // quicker than that wait their turn, 700 ms apart, so each count is seen and heard. Once every side is lit, Help
  // outlines the answer. Name: a small picture beside each word, then outline the answer.
  function help() {
    const r = current();
    if (!r || r.done) return;
    if (r.mode === 'sides') {
      if (helpTimer) { helpQueue++; return; }
      const settle = () => {
        helpTimer = window.setTimeout(() => {
          helpTimer = 0;
          const now = current();
          if (helpQueue > 0 && now === r && !r.done) { helpQueue--; sidesHelp(r); settle(); } else helpQueue = 0;
        }, HELP_GAP);
      };
      sidesHelp(r);
      settle();
      return;
    }
    r.hint = Math.min(2, (Number(r.hint) || 0) + 1);
    $('task').querySelector('.answers').innerHTML = answers(r);
    LP.status(r.hint === 1 ? 'Each name has its picture now. Which picture matches the shape?' : 'The name that fits is outlined.');
    save();
  }

  // ---- modes, levels, Next and Again ----
  function setMode(value) {
    if (!MODES.includes(value) || value === mode) return;
    stopHelp();
    mode = value;
    try { history.replaceState(history.state, '', '#' + mode); } catch (_) { /* no history API */ }
    render();
  }
  function setLevel(n) {
    stopHelp();
    level = L.clampLevel('shapes', n);
    rounds = { sides: create('sides'), name: create('name') };
    render();
  }
  function focusTask() {
    const target = $('task').querySelector('.shape-stage[tabindex]') || $('task').querySelector('button:not(:disabled)');
    if (target) target.focus({ preventScroll: true });
  }
  // The grown-ups' level chooser (from Grown-ups only). Closing it closes the shelf too, back to the game.
  function chooser() {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Choose the shapes</h2><button data-close aria-label="Close the shape chooser">×</button></div><p>Every level is open. Sides counts the shapes with straight sides; Name has them all.</p><div class="level-picker shape-levels" role="group" aria-label="Level"></div>', () => { S.close(); focusTask(); });
    const box = el.querySelector('.shape-levels');
    [[1, LEVEL_TEXT[1]], [2, LEVEL_TEXT[2]]].forEach(([n, text]) => {
      const b = document.createElement('button');
      const shown = n === 1 ? L.SHAPE_LEVELS[0] : L.SHAPE_LEVELS[1].filter(name => !L.SHAPE_LEVELS[0].includes(name));
      b.type = 'button'; b.dataset.level = String(n);
      b.setAttribute('aria-pressed', String(level === n));
      b.setAttribute('aria-label', 'Shapes ' + n + ': ' + text);
      b.innerHTML = '<b>Shapes ' + n + '</b><span class="level-icons" aria-hidden="true">' + shown.map(icon).join('') + '</span><span>' + esc(text[0].toUpperCase() + text.slice(1)) + '.</span>';
      b.onclick = () => { setLevel(n); LP.closeModal(); };
      box.appendChild(b);
    });
  }

  // ---- events ----
  $('task').addEventListener('click', e => {
    const b = e.target.closest('button[data-choice]');
    if (b) { choose(b.dataset.choice); return; }
    const st = e.target.closest('.shape-stage.counting');
    if (!st) return;
    // A real tap carries its point; a click from a keyboard, switch or screen reader (detail 0) counts the next side.
    if (e.detail === 0) countSide(nextSide(current()));
    else tapAt(e.clientX, e.clientY);
  });
  $('task').addEventListener('keydown', e => {
    if (!e.target.classList || !e.target.classList.contains('shape-stage') || !e.target.classList.contains('counting')) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (!e.repeat) countSide(nextSide(current()));
  });
  $('modes').addEventListener('click', e => { const b = e.target.closest('[data-shapes-mode]'); if (b) setMode(b.dataset.shapesMode); });
  $('help').addEventListener('click', help);
  $('next').addEventListener('click', () => { stopHelp(); indices[mode] = (indices[mode] || 0) + 1; rounds[mode] = create(mode); render(); focusTask(); });
  $('repeat').addEventListener('click', () => { stopHelp(); rounds[mode] = create(mode); render(); focusTask(); });
  document.addEventListener('lp:preferences', () => render());
  document.addEventListener('lp:beforeplayerchange', save);
  document.addEventListener('lp:playerchanged', () => { stopHelp(); restore(); render(); LP.status('Ready to play. Every level is open.'); });
  window.addEventListener('pagehide', () => { stopHelp(); save(); });

  $('help').innerHTML = (I.help || '') + '<span>Help!</span>';
  $('next').innerHTML = 'Next <span aria-hidden="true">→</span>';
  $('repeat').textContent = '↻ Again';
  const talk = F.bubble($('bubble'), $('speech'));
  const nook = F.nook($('nook'), { feeling: 'rest', bubble: talk });
  restore();
  const requested = location.hash.slice(1);
  if (MODES.includes(requested)) mode = requested;
  S.mountOverlay({ current: 'shapes', levels: { name: () => 'Shapes', now: () => ({ text: 'Shapes ' + level + ': ' + LEVEL_TEXT[level], art: levelArt(level) }), open: chooser } });
  render();
  window.LPShapes = { toUser, tapAt, nextSide, HIT_PX, VIEW };
})();
