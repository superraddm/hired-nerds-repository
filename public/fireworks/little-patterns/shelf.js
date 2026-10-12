/* Nook's shelf (round 4): the hub page, each game's sub-menu, the Grown-ups press-and-hold and the Grown-ups sheet.
   Load after shared.js, nook-art.js, icons.js, frame.js and menus.js.

   Phase 9 (navigation proposal 2, approved by Jof on 12 October 2026): the shelf is the only place a child changes
   game, activity or level, and the only place the Grown-ups hold lives. The play screens have a plain link back here
   (top-left, to all games) and a caption that states where the child is; the in-game shelf overlay of phases 2 to 8 is
   retired.

   window.LPShelf:
     mountHub(container)  the shelf: Nook's greeting; the six games with choices first (Count, Add, Words, Patterns,
                          Shapes, Feelings), each tile showing a folder preview of what is inside; a thin rule; Paint
                          and Blocks with their single icon; the Grown-ups hold at the foot. A tap on one of the six
                          opens its sub-menu on the same page through one history entry (#add, #feelings...), so
                          Android back and the sub-menu's back arrow come back to all games; a link to ./#feelings
                          opens it directly. A sub-menu (menus.js): the back arrow top-left, where the shelf button
                          sits on every play screen; the game's icon and name; Nook's one-line question; the activity
                          tiles, the last one marked; the level tiles under them, the current one marked. An activity
                          tile goes to the game at the current level (garden.html#add/take); a level tile starts the
                          current activity at that level (garden.html#add/take/3). Paint and Blocks go straight in.
     gate(button, onOpen) the hold: 2,000 ms in all, the ring from 300 ms, cancelled by release, a move over 10 px,
                          pointer cancel or the page hiding; Enter or Space held is the keyboard equivalent; focus
                          comes back to the button when the sheet closes.
     grownups()           the Grown-ups sheet. Held on a sub-menu it starts with that game's section: its name, the
                          level now, and Levels and puzzles, which opens the game with its grown-ups' chooser (every
                          difficulty and content choice). The child's level tiles and that chooser write the same saved
                          value, so each shows the other's choice.
     about() / navigate(url) (tests replace navigate) / menu (the sub-menu showing, or '') / TILES

   Tiles are buttons, not links. A sub-menu is never more than one level deep: the shelf, then the game's screen. The
   shelf foot holds only the Grown-ups button, and a crossed-speaker badge while a grown-up has turned sound off.
   Nothing on the shelf mutes. */
(function () {
  'use strict';
  const LP = window.LP, I = window.LPIcons, F = window.LPFrame, M = window.LPMenus;
  const doc = document;
  // The six games with choices, then (after the rule) the two that go straight in.
  const TILES = [['count', 'Count', 'garden.html#count'], ['add', 'Add', 'garden.html#add'], ['words', 'Words', 'garden.html#words'], ['patterns', 'Patterns', 'garden.html#patterns'], ['shapes', 'Shapes', 'shapes.html'], ['feelings', 'Feelings', 'feelings.html'], ['paint', 'Paint', 'studio-lab.html'], ['blocks', 'Blocks', 'blocks.html']];
  // Shown with typographic apostrophes; the clip key is the plain text.
  const GREETING = 'Hello! I’m Nook. Let’s play.', GREETING_CLIP = "Hello! I'm Nook. Let's play.";
  const api = { navigate(url) { window.location.href = url; } };
  // The hub serves kpopboom.party (fireworks at /boom/) and jofdavies.com/fireworks/little-patterns/ (fireworks one level up).
  const boomHref = () => (window.location.pathname.startsWith('/fireworks/') ? '../' : '../boom/');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const focus = el => { if (el) el.focus({ preventScroll: true }); };

  function tile([id, label]) {
    const cells = M.has(id) ? M.folder(id) : null;
    const art = cells ? '<span class="peek n' + cells.length + '" aria-hidden="true">' + cells.map(c => '<span class="peek-cell">' + c + '</span>').join('') + '</span>' : I[id];
    return '<button type="button" class="tile ' + id + (cells ? ' folder' : '') + '" data-shelf="' + id + '">' + art + '<span class="tile-name">' + label + '</span></button>';
  }
  function markup() {
    const first = TILES.filter(t => M.has(t[0])), rest = TILES.filter(t => !M.has(t[0]));
    return '<div class="shelf">' +
      '<div class="shelf-bar" hidden><div class="shelf-bar-in"><button type="button" class="nf-shelf nf-back" data-back aria-label="All games">' + I.back + '</button><h2 class="menu-name"></h2></div></div>' +
      '<div class="shelf-top"><button type="button" class="nook-btn" data-nook aria-label="Nook"><span class="nook-pos"></span></button>' +
      '<button type="button" class="nf-bubble" data-bubble><span class="line"></span><span class="hear" aria-hidden="true"></span><span class="sr-only"> Hear it again</span></button></div>' +
      '<nav class="tiles" aria-label="Nook’s games">' + first.map(tile).join('') + '<span class="tiles-rule" aria-hidden="true"></span>' + rest.map(tile).join('') + '</nav>' +
      '<div class="submenu" hidden><nav class="menu-tiles"></nav><div class="levels-row" role="group"></div></div>' +
      '<div class="shelf-foot"><span class="sound-badge" role="img" aria-label="Sound is off" hidden>' + I.soundOff + '</span>' +
      '<button type="button" class="nf-grown" data-grownups aria-label="Grown-ups: press and hold for two seconds"><svg class="ring" viewBox="0 0 62 62" aria-hidden="true" focusable="false"><circle cx="31" cy="31" r="27"/></svg>' + I.gear + '</button></div></div>';
  }
  function badge(el) { const b = el.querySelector('.sound-badge'); if (b) b.hidden = !LP.soundOff; }

  // ---- the two screens of the shelf: all games, and one game's sub-menu ----
  function screens(shelf, talk, line, speech) {
    const bar = shelf.querySelector('.shelf-bar'), grid = shelf.querySelector('.tiles'), sub = shelf.querySelector('.submenu');
    const acts = sub.querySelector('.menu-tiles'), row = sub.querySelector('.levels-row');
    let menu = '';
    function show(id) {
      if (!M.has(id)) return;
      const entry = M.MENUS[id], s = M.state(id), now = s.activity, mark = M.marked(id, s);
      menu = id;
      LP.audio.stopSpeech();
      bar.querySelector('.menu-name').innerHTML = '<span class="menu-name-art" aria-hidden="true">' + I[id] + '</span><span>' + esc(entry.name) + '</span>';
      const tiles = M.tiles(id), levels = M.levels(id, now);
      acts.className = 'menu-tiles n' + tiles.length;
      acts.hidden = !tiles.length;
      acts.setAttribute('aria-label', entry.name + ': choose a game');
      acts.innerHTML = tiles.map(t => '<button type="button" class="tile menu-tile ' + id + '" data-mode="' + id + '" data-activity="' + esc(t.activity) + '"' + (t.activity === now ? ' aria-current="true"' : '') + '><span class="menu-art" aria-hidden="true">' + t.art + '</span><span class="menu-word">' + esc(t.word) + '</span></button>').join('');
      row.hidden = !levels.length;
      row.className = 'levels-row n' + levels.length;
      if (entry.group) row.setAttribute('aria-label', entry.group); else row.removeAttribute('aria-label');
      row.innerHTML = levels.map(l => '<button type="button" class="lvl ' + id + '" data-mode="' + id + '" data-level="' + l.level + '"' + (l.level === mark ? ' aria-current="true"' : '') + '><span class="lvl-art" aria-hidden="true">' + l.art + '</span><span class="lvl-word">' + esc(l.word) + '</span></button>').join('');
      sub.classList.toggle('only-levels', !tiles.length);
      sub.classList.toggle('has-levels', levels.length > 0);
      sub.dataset.game = id;
      bar.hidden = false; sub.hidden = false; grid.hidden = true;
      shelf.classList.add('in-menu');
      shelf.dataset.menu = id;
      talk.say(entry.greeting, entry.speech);
      focus(acts.querySelector('[aria-current="true"]') || row.querySelector('[aria-current="true"]') || sub.querySelector('button'));
    }
    function back(quiet) {
      if (!menu) return;
      const was = menu;
      menu = '';
      bar.hidden = true; sub.hidden = true; grid.hidden = false;
      acts.innerHTML = ''; row.innerHTML = '';
      shelf.classList.remove('in-menu');
      delete shelf.dataset.menu;
      LP.audio.stopSpeech();
      talk.say(line, speech);
      if (!quiet) focus(grid.querySelector('[data-shelf="' + was + '"]'));
    }
    return { show, back, get menu() { return menu; } };
  }

  // ---- the hold gate ----
  const HOLD = 2000, RING = 300, SLOP = 10;
  let lastGate = null;
  function gate(button, onOpen) {
    let ringTimer = 0, openTimer = 0, start = null, key = '';
    const cancel = () => { window.clearTimeout(ringTimer); window.clearTimeout(openTimer); ringTimer = openTimer = 0; start = null; key = ''; button.classList.remove('pressing', 'holding'); };
    const begin = (x, y, pointer) => {
      cancel();
      start = { x, y, pointer };
      button.classList.add('pressing');
      ringTimer = window.setTimeout(() => button.classList.add('holding'), RING);
      openTimer = window.setTimeout(() => { cancel(); lastGate = button; onOpen(button); }, HOLD);
    };
    button.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.preventDefault();
      try { button.setPointerCapture(e.pointerId); } catch (_) { /* not captured: release still cancels */ }
      begin(e.clientX, e.clientY, true);
    });
    // Only a hold made with a finger or the mouse is cancelled by moving; a held key ignores the pointer.
    button.addEventListener('pointermove', e => { if (start && start.pointer && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP) cancel(); });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => { if (start && start.pointer) cancel(); });
    button.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (e.repeat || key) return;
      begin(0, 0, false);
      key = e.key;
    });
    button.addEventListener('keyup', e => { if (e.key === key) cancel(); });
    button.addEventListener('blur', () => { if (key) cancel(); });
    // A plain tap or click does nothing: only the hold opens the sheet.
    button.addEventListener('click', e => e.preventDefault());
    button.addEventListener('contextmenu', e => e.preventDefault());
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) cancel(); });
    window.addEventListener('pagehide', cancel);
    return { cancel, get holding() { return !!start; } };
  }

  // ---- the Grown-ups sheet ----
  // Held on a game's sub-menu, the sheet starts with that game's section: its name, where the child is now (the
  // caption's words), and Levels and puzzles, which opens the game with its grown-ups' chooser.
  function section(id) {
    if (!id) return '';
    return '<section class="gu-game" aria-labelledby="gu-game-name"><h3 id="gu-game-name">' + esc(M.MENUS[id].name) + '</h3><p class="gu-now"><span class="gu-now-art" aria-hidden="true">' + I[id] + '</span><span class="gu-now-text">Now: ' + esc(M.caption(id, M.state(id)).text) + '</span></p>' +
      '<button type="button" id="gu-levels">Levels and puzzles</button></section>';
  }
  function grownups() {
    const game = hubView ? hubView.menu : '';
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Grown-ups</h2><button data-close aria-label="Close Grown-ups">×</button></div>' + section(game) +
      '<p>Children reach this sheet only with a two-second press and hold. Locking the device to one app (Guided Access on iPad, App pinning or Samsung Kids on Android) is a device setting.</p>' +
      '<div class="gu-list">' +
      '<button type="button" id="gu-player"></button>' +
      '<button type="button" id="gu-settings">Settings: sound, word pictures, Softer colours, letters, keyboard, answers and Colour Blocks’ pace</button>' +
      '<button type="button" id="gu-about">Privacy, devices and credits</button>' +
      '<a href="content.html">All game content and answers</a>' +
      '<a href="feelings-content.html">Feelings: every word and story</a>' +
      '<a id="gu-boom" href="' + boomHref() + '">K-Pop BOOM! fireworks, next door</a>' +
      '</div>' + (game ? '' : '<p class="lp-small" id="gu-levels-hint">Levels and puzzles: tap a game’s tile, then hold Grown-ups there. The sheet then starts with that game’s levels.</p>') + '<p class="lp-small" id="gu-sound"></p>');
    el.classList.add('lp-rise');
    const player = LP.player;
    el.querySelector('#gu-player').textContent = 'Who is playing: ' + player.avatar + ' ' + player.name;
    el.querySelector('#gu-sound').textContent = LP.soundOff ? 'Sound is off. Turn it on in Settings.' : 'Sound is on. Turn it off in Settings.';
    el.querySelector('#gu-player').onclick = () => LP.choosePlayer();
    el.querySelector('#gu-settings').onclick = () => LP.settings();
    el.querySelector('#gu-about').onclick = about;
    if (game) el.querySelector('#gu-levels').onclick = () => { LP.closeModal(); api.navigate(M.levelsHref(game)); };
    return el;
  }
  function about() {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Privacy, devices and credits</h2><button data-close aria-label="Close">×</button></div>' +
      '<p>Every game and puzzle is open to every player. Names and player IDs stay in this browser’s storage and are never sent anywhere. People sharing this browser can see these local profiles; they are not password-protected accounts. Another browser or device has its own profiles, and clearing browser data deletes them. A home-screen app on iPad keeps its own storage, separate from Safari.</p>' +
      '<p>The games work without saved profiles if browser storage is unavailable. Built-in speech uses bundled voice clips, made once with Google Gemini text-to-speech and played only from this device. Familiar words you add use an installed offline device voice. No microphone, analytics, advertising, accounts or online leaderboards.</p>' +
      '<p>Me, in Feelings: what a child chooses or types there is a report for the grown-up beside them. It is never saved or sent, and it clears when they leave Me.</p>' +
      '<p>Word pictures are Mulberry Symbols by Steve Lee, licensed CC BY-SA 4.0 (mulberrysymbols.org). The background tune in Colour Blocks is a new arrangement of the traditional folk melody Korobeiniki. Nook is an original character.</p>' +
      '<p>Use Safari on iPad or Chrome on Android. The A to Z keys work without opening the device keyboard.</p>');
    el.classList.add('lp-rise');
  }
  // Focus returns to the Grown-ups button once the last grown-ups dialog closes.
  // (shared.js then keeps it as the place to return to for any dialog the sheet opens next.)
  doc.addEventListener('lp:dialogclosed', () => { if (LP.dialogOpen || !lastGate) return; const button = lastGate; lastGate = null; if (doc.contains(button)) button.focus({ preventScroll: true }); });

  // ---- the hub page ----
  let hubView = null;
  function mountHub(container) {
    container.innerHTML = markup();
    const shelf = container.querySelector('.shelf');
    const talk = F.bubble(shelf.querySelector('[data-bubble]'), shelf.querySelector('[data-bubble] .line'));
    talk.say(GREETING, [GREETING_CLIP]);
    const nook = F.nook(shelf.querySelector('[data-nook]'), { feeling: 'greet', bubble: talk });
    gate(shelf.querySelector('[data-grownups]'), grownups);
    badge(shelf);
    doc.addEventListener('lp:sound', () => badge(shelf));
    const view = hubView = screens(shelf, talk, GREETING, [GREETING_CLIP]);
    // A sub-menu is one history entry (#add): Android back and the back arrow both come back to all games. While that
    // back is on its way, taps wait, so a quick second tap never lands on the wrong screen.
    let pushed = false, settling = 0;
    const lpMenu = () => !!(window.history.state && window.history.state.lpMenu);
    const settle = () => { window.clearTimeout(settling); settling = 0; };
    function sync() {
      settle();
      pushed = lpMenu();
      const id = M.parse(window.location.hash).words[0];
      if (M.has(id)) { if (view.menu !== id) view.show(id); } else view.back();
    }
    shelf.addEventListener('click', e => {
      if (settling) return;
      if (e.target.closest('[data-back]')) {
        if (pushed) { pushed = false; settling = window.setTimeout(settle, 600); try { window.history.back(); } catch (_) { settle(); } }
        else { try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) { /* no history API */ } }
        view.back();
        return;
      }
      const act = e.target.closest('[data-activity]');
      if (act) { api.navigate(M.href(act.dataset.mode, act.dataset.activity)); return; }
      const lvl = e.target.closest('[data-level]');
      if (lvl) {
        // A level starts the current activity at that level; Patterns' families belong to Finish the pattern.
        const id = lvl.dataset.mode;
        api.navigate(M.href(id, id === 'patterns' ? 'finish' : M.last(id), Number(lvl.dataset.level)));
        return;
      }
      const tile = e.target.closest('[data-shelf]');
      if (!tile) return;
      const id = tile.dataset.shelf, entry = TILES.find(t => t[0] === id);
      if (M.has(id)) {
        try { window.history.pushState({ lpMenu: id }, '', '#' + id); pushed = true; } catch (_) { /* no history API: the back arrow still comes back */ }
        view.show(id);
        return;
      }
      if (entry) api.navigate(entry[2]);
    });
    // Escape in a sub-menu does what its back arrow does.
    shelf.addEventListener('keydown', e => { if (e.key === 'Escape' && view.menu && !LP.dialogOpen) { e.preventDefault(); const back = shelf.querySelector('[data-back]'); if (back) back.click(); } });
    window.addEventListener('popstate', sync);
    // Back from a game restores the hub from the page cache: mark the activity and level played since.
    window.addEventListener('pageshow', e => { if (e.persisted && view.menu) view.show(view.menu); });
    sync();
    return { talk, nook, view };
  }

  Object.assign(api, { mountHub, gate, grownups, about, TILES });
  // The sub-menu showing now, or ''.
  Object.defineProperty(api, 'menu', { get: () => (hubView ? hubView.menu : '') });
  window.LPShelf = api;
})();
