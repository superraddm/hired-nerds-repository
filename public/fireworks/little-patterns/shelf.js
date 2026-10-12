/* Nook's shelf (round 4): the hub page, the same shelf as a full-height overlay inside a game, the lists of
   activities under the tiles (phase 8), the Grown-ups press-and-hold and the Grown-ups sheet. Load after shared.js,
   nook-art.js, icons.js, frame.js and menus.js.

   window.LPShelf:
     mountHub(container)            the shelf page: Nook's greeting, eight tile buttons, the Grown-ups hold. A tile
                                    whose game has more than one activity (LPMenus) opens that game's list on the
                                    same page, through one history entry (#add, #feelings...), so Android back and
                                    the shelf button come back to the tiles; a link to ./#feelings opens it directly.
                                    A list tile goes to the game with its activity (garden.html#add/take).
     mountOverlay({current,hosts,onMode,activity,levels})
                                    the in-game shelf behind the top bar's shelf button. A tile with a list opens it
                                    in the overlay (the current game's tile too); hosts are the shelf ids this page
                                    plays in place: their tiles and list tiles close the overlay and call
                                    onMode(id, activity); the current tile without a list closes it; the others
                                    navigate. activity(id) names the activity playing now, to mark in its list.
                                    Android back opens the overlay through ONE history entry, pushed once (at the
                                    first touch or key press); inside a list it comes back to the tiles.
                                    levels (phase 7): { name(), now() -> { text, art }, open(), label } puts the game's
                                    own section at the top of the Grown-ups sheet: its name, the level now and "Levels
                                    and puzzles" (or label), which opens the game's chooser for every difficulty and
                                    content choice. No tap on a play screen reaches that chooser; only the hold does.
     open() / close() / setCurrent(id) / isOpen / menu
     gate(button, onOpen)           the hold: 2,000 ms in all, the ring from 300 ms, cancelled by release, a move
                                    over 10 px, pointer cancel or the page hiding; Enter or Space held is the
                                    keyboard equivalent; focus comes back to the button when the sheet closes.
     navigate(url)                  location change (tests replace it)

   Tiles are buttons, not links. A tile that opens a list carries the "more inside" marker: a small stacked-cards
   badge in its top-right corner and a dashed inner border, in the tile's own darker colour. A list is never more
   than one level deep: the shelf, then the activity. The shelf foot holds only the Grown-ups button, and a
   crossed-speaker badge while a grown-up has turned sound off. Nothing on the shelf mutes. */
(function () {
  'use strict';
  const LP = window.LP, I = window.LPIcons, F = window.LPFrame, M = window.LPMenus;
  const doc = document;
  const TILES = [['count', 'Count', 'garden.html#count'], ['add', 'Add', 'garden.html#add'], ['words', 'Words', 'garden.html#words'], ['patterns', 'Patterns', 'garden.html#patterns'], ['shapes', 'Shapes', 'shapes.html'], ['feelings', 'Feelings', 'feelings.html'], ['paint', 'Paint', 'studio-lab.html'], ['blocks', 'Blocks', 'blocks.html']];
  const GARDEN = ['count', 'add', 'words', 'patterns'];
  // Shown with typographic apostrophes; the clip key is the plain text.
  const GREETING = 'Hello! I’m Nook. Let’s play.', GREETING_CLIP = "Hello! I'm Nook. Let's play.";
  const OVERLAY_LINE = 'What shall we play?';
  const api = { navigate(url) { window.location.href = url; } };
  // The hub serves kpopboom.party (fireworks at /boom/) and jofdavies.com/fireworks/little-patterns/ (fireworks one level up).
  const boomHref = () => (window.location.pathname.startsWith('/fireworks/') ? '../' : '../boom/');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const focus = el => { if (el) el.focus({ preventScroll: true }); };
  // The "more inside" badge: two offset rounded squares, coloured by the tile (frame.css).
  const MORE = '<svg class="more" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect class="card-back" x="8.5" y="2" width="13.5" height="13.5" rx="3.5"/><rect class="card-front" x="2" y="8.5" width="13.5" height="13.5" rx="3.5"/></svg>';

  function markup(options) {
    const hosts = options.hosts || [];
    const tiles = TILES.map(([id, label]) => {
      const list = M.has(id);
      return '<button type="button" class="tile ' + id + (list ? ' has-menu' : '') + '" data-shelf="' + id + '"' + (hosts.includes(id) && !list ? ' data-mode="' + id + '"' : '') + (id === options.current ? ' aria-current="true"' : '') + '>' + I[id] + '<span>' + label + '</span>' + (list ? MORE + '<span class="sr-only"> (opens a list)</span>' : '') + '</button>';
    }).join('');
    return '<div class="shelf">' +
      '<div class="shelf-bar" hidden><div class="shelf-bar-in"><button type="button" class="nf-shelf" data-back aria-label="Nook’s games">' + I.shelf + '</button><h2 class="menu-name"></h2></div></div>' +
      '<div class="shelf-top"><button type="button" class="nook-btn" data-nook aria-label="Nook"><span class="nook-pos"></span></button>' +
      '<button type="button" class="nf-bubble" data-bubble><span class="line"></span><span class="hear" aria-hidden="true"></span><span class="sr-only"> Hear it again</span></button></div>' +
      '<nav class="tiles" aria-label="Nook’s games">' + tiles + '</nav>' +
      '<nav class="menu-tiles" hidden></nav>' +
      '<div class="shelf-foot"><span class="sound-badge" role="img" aria-label="Sound is off" hidden>' + I.soundOff + '</span>' +
      '<button type="button" class="nf-grown" data-grownups aria-label="Grown-ups: press and hold for two seconds"><svg class="ring" viewBox="0 0 62 62" aria-hidden="true" focusable="false"><circle cx="31" cy="31" r="27"/></svg>' + I.gear + '</button></div></div>';
  }
  function badge(el) { const b = el.querySelector('.sound-badge'); if (b) b.hidden = !LP.soundOff; }

  // ---- the two screens of a shelf (phase 8): the tiles, and one game's list of activities ----
  // The list keeps the shelf's look: the shelf button top-left (where it is in every game) comes back to the tiles,
  // Nook says the game's line (text only), and each tile has a picture and one name. The last activity is marked.
  function screens(shelf, talk, line, speech) {
    const bar = shelf.querySelector('.shelf-bar'), grid = shelf.querySelector('.tiles'), list = shelf.querySelector('.menu-tiles');
    let menu = '';
    function show(id, activity) {
      const entry = TILES.find(t => t[0] === id);
      if (!M.has(id) || !entry) return;
      const now = activity || M.last(id);
      menu = id;
      LP.audio.stopSpeech();
      bar.querySelector('.menu-name').innerHTML = '<span class="menu-name-art" aria-hidden="true">' + I[id] + '</span><span>' + esc(entry[1]) + '</span>';
      list.className = 'menu-tiles n' + M.MENUS[id].tiles.length;
      list.setAttribute('aria-label', entry[1] + ': choose a game');
      list.innerHTML = M.tiles(id).map(t => '<button type="button" class="tile menu-tile ' + id + '" data-mode="' + id + '" data-activity="' + esc(t.activity) + '"' + (t.activity === now ? ' aria-current="true"' : '') + '><span class="menu-art" aria-hidden="true">' + t.art + '</span><span class="menu-word">' + esc(t.word) + '</span></button>').join('');
      bar.hidden = false; list.hidden = false; grid.hidden = true;
      shelf.classList.add('in-menu');
      shelf.dataset.menu = id;
      talk.say(M.MENUS[id].greeting, []);
      focus(list.querySelector('[aria-current="true"]') || list.querySelector('.tile'));
    }
    function back(quiet) {
      if (!menu) return;
      const was = menu;
      menu = '';
      bar.hidden = true; list.hidden = true; grid.hidden = false;
      list.innerHTML = '';
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
  let levels = null;
  // The game's section (phase 7): set inside a game, first under the heading; on the hub a line under the list says
  // where each game's levels are.
  function section() {
    if (!levels) return '';
    return '<section class="gu-game" aria-labelledby="gu-game-name"><h3 id="gu-game-name"></h3><p class="gu-now"><span class="gu-now-art" aria-hidden="true"></span><span class="gu-now-text"></span></p>' +
      '<button type="button" id="gu-levels">' + esc(levels.label || 'Levels and puzzles') + '</button></section>';
  }
  function grownups(from) {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Grown-ups</h2><button data-close aria-label="Close Grown-ups">×</button></div>' + section() +
      '<p>Children reach this sheet only with a two-second press and hold. Locking the device to one app (Guided Access on iPad, App pinning or Samsung Kids on Android) is a device setting.</p>' +
      '<div class="gu-list">' +
      '<button type="button" id="gu-player"></button>' +
      '<button type="button" id="gu-settings">Settings: sound, word pictures, Softer colours, letters, keyboard and answers</button>' +
      '<button type="button" id="gu-about">Privacy, devices and credits</button>' +
      '<a href="content.html">All game content and answers</a>' +
      '<a href="feelings-content.html">Feelings: every word and story</a>' +
      '<a id="gu-boom" href="' + boomHref() + '">K-Pop BOOM! fireworks, next door</a>' +
      '</div>' + (levels ? '' : '<p class="lp-small" id="gu-levels-hint">Levels and puzzles: open a game, tap the shelf button and hold Grown-ups there. The sheet then starts with that game’s levels.</p>') + '<p class="lp-small" id="gu-sound"></p>');
    el.classList.add('lp-rise');
    const player = LP.player;
    el.querySelector('#gu-player').textContent = 'Who is playing: ' + player.avatar + ' ' + player.name;
    el.querySelector('#gu-sound').textContent = LP.soundOff ? 'Sound is off. Turn it on in Settings.' : 'Sound is on. Turn it off in Settings.';
    el.querySelector('#gu-player').onclick = () => LP.choosePlayer();
    el.querySelector('#gu-settings').onclick = () => LP.settings();
    el.querySelector('#gu-about').onclick = about;
    if (levels) {
      const now = levels.now() || {};
      el.querySelector('#gu-game-name').textContent = levels.name();
      el.querySelector('.gu-now-text').textContent = 'Now: ' + now.text;
      const art = el.querySelector('.gu-now-art');
      if (now.art) art.innerHTML = now.art; else art.remove();
      el.querySelector('#gu-levels').onclick = () => levels.open();
    }
    return el;
  }
  function about() {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Privacy, devices and credits</h2><button data-close aria-label="Close">×</button></div>' +
      '<p>Every game and puzzle is open to every player. Names and player IDs stay in this browser’s storage and are never sent anywhere. People sharing this browser can see these local profiles; they are not password-protected accounts. Another browser or device has its own profiles, and clearing browser data deletes them. A home-screen app on iPad keeps its own storage, separate from Safari.</p>' +
      '<p>The games work without saved profiles if browser storage is unavailable. Built-in speech uses bundled voice clips, made once with Google Gemini text-to-speech and played only from this device. Familiar words you add use an installed offline device voice. No microphone, analytics, advertising, accounts or online leaderboards.</p>' +
      '<p>Me, in Feelings: what a child chooses or types there is a report for the grown-up beside them. It is never saved or sent, and it clears when they leave Me.</p>' +
      '<p id="gu-marker">Tiles with a corner badge open a list of activities.</p>' +
      '<p>Word pictures are Mulberry Symbols by Steve Lee, licensed CC BY-SA 4.0 (mulberrysymbols.org). The background tune in Colour Blocks is a new arrangement of the traditional folk melody Korobeiniki. Nook is an original character.</p>' +
      '<p>Use Safari on iPad or Chrome on Android. The A to Z keys work without opening the device keyboard.</p>');
    el.classList.add('lp-rise');
  }
  // Focus returns to the Grown-ups button once the last grown-ups dialog closes.
  // (shared.js then keeps it as the place to return to for any dialog the sheet opens next.)
  doc.addEventListener('lp:dialogclosed', () => { if (LP.dialogOpen || !lastGate) return; const button = lastGate; lastGate = null; if (doc.contains(button)) button.focus({ preventScroll: true }); });

  // ---- Nook and the greeting on a shelf ----
  function dress(shelf, line, speech) {
    const talk = F.bubble(shelf.querySelector('[data-bubble]'), shelf.querySelector('[data-bubble] .line'));
    talk.say(line, speech);
    const nook = F.nook(shelf.querySelector('[data-nook]'), { feeling: 'greet', bubble: talk });
    gate(shelf.querySelector('[data-grownups]'), grownups);
    badge(shelf);
    doc.addEventListener('lp:sound', () => badge(shelf));
    return { talk, nook, view: screens(shelf, talk, line, speech) };
  }

  // ---- the hub page ----
  let hubView = null;
  function mountHub(container) {
    container.innerHTML = markup({});
    const shelf = container.querySelector('.shelf');
    const parts = dress(shelf, GREETING, [GREETING_CLIP]);
    const view = hubView = parts.view;
    // A list is one history entry (#add): Android back and the list's shelf button both come back to the tiles.
    // While that back is on its way, taps wait, so a quick second tap never lands on the wrong screen.
    let pushed = false, settling = 0;
    const lpMenu = () => !!(window.history.state && window.history.state.lpMenu);
    const settle = () => { window.clearTimeout(settling); settling = 0; };
    function sync() {
      settle();
      pushed = lpMenu();
      const id = M.split(window.location.hash)[0];
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
      const pick = e.target.closest('[data-activity]');
      if (pick) { api.navigate(M.href(pick.dataset.mode, pick.dataset.activity)); return; }
      const tile = e.target.closest('[data-shelf]');
      if (!tile) return;
      const id = tile.dataset.shelf, entry = TILES.find(t => t[0] === id);
      if (M.has(id)) {
        try { window.history.pushState({ lpMenu: id }, '', '#' + id); pushed = true; } catch (_) { /* no history API: the shelf button still comes back */ }
        view.show(id);
        return;
      }
      if (entry) api.navigate(entry[2]);
    });
    // Escape in a list does what its shelf button does.
    shelf.addEventListener('keydown', e => { if (e.key === 'Escape' && view.menu && !LP.dialogOpen) { e.preventDefault(); const back = shelf.querySelector('[data-back]'); if (back) back.click(); } });
    window.addEventListener('popstate', sync);
    // Back from a game restores the hub from the page cache: mark the activity played since.
    window.addEventListener('pageshow', e => { if (e.persisted && view.menu) view.show(view.menu); });
    sync();
    return parts;
  }

  // ---- the overlay inside a game ----
  let overlay = null, current = '', hosts = [], onMode = null, activityOf = null, opener = null, overlayNook = null, overlayView = null;
  const live = id => { try { return (activityOf && activityOf(id)) || M.last(id); } catch (_) { return M.last(id); } };
  function mountOverlay(options) {
    options = options || {};
    current = options.current || '';
    onMode = options.onMode || null;
    hosts = onMode ? (options.hosts || GARDEN) : [];
    activityOf = options.activity || null;
    levels = options.levels || null;
    overlay = doc.createElement('div');
    // lp-frame: the frame's button reset also holds on a page that is not a frame page (Blocks).
    overlay.className = 'lp-overlay lp-frame';
    overlay.id = 'shelf-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Nook’s games');
    overlay.innerHTML = markup({ current, hosts });
    doc.body.appendChild(overlay);
    const parts = dress(overlay.querySelector('.shelf'), OVERLAY_LINE, [OVERLAY_LINE]);
    overlayNook = parts.nook;
    overlayView = parts.view;
    overlay.addEventListener('click', e => {
      if (e.target.closest('[data-back]')) { overlayView.back(); return; }
      const pick = e.target.closest('[data-activity]');
      if (pick) {
        const game = pick.dataset.mode, activity = pick.dataset.activity;
        if (hosts.includes(game)) { close(); onMode(game, activity); } else api.navigate(M.href(game, activity));
        return;
      }
      const tile = e.target.closest('[data-shelf]');
      if (!tile) return;
      const id = tile.dataset.shelf, entry = TILES.find(t => t[0] === id);
      // A game with a list opens it here, the current game's too; the rest play in place, close, or navigate.
      if (M.has(id)) { overlayView.show(id, live(id)); return; }
      if (hosts.includes(id)) { close(); onMode(id); return; }
      if (id === current) { close(); return; }
      if (entry) api.navigate(entry[2]);
    });
    overlay.addEventListener('keydown', e => { if (e.key === 'Escape' && !LP.dialogOpen) { e.preventDefault(); close(); } });
    const button = doc.getElementById('shelf-open');
    if (button) {
      if (!button.firstChild) button.innerHTML = I.shelf;
      // Safari does not focus a tapped button, so the shelf button is named as the place to come back to.
      button.addEventListener('click', () => open(button));
    }
    // One history entry, pushed once: the first Android back opens the shelf; another back leaves as usual. It is pushed at
    // the first touch or key press, because Chrome's back button skips entries a page adds before any user gesture.
    const push = () => {
      for (const name of ['pointerdown', 'keydown', 'click']) doc.removeEventListener(name, push, true);
      try { window.history.pushState({ lpShelf: true }, '', window.location.href); } catch (_) { /* no history API: back leaves */ }
    };
    for (const name of ['pointerdown', 'keydown', 'click']) doc.addEventListener(name, push, true);
    // Inside a list, back comes up to the tiles; otherwise it opens the shelf.
    window.addEventListener('popstate', () => { if (overlay && !overlay.hidden && overlayView.menu) overlayView.back(); else open(); });
    return api;
  }
  function open(from) {
    if (!overlay || !overlay.hidden) return;
    opener = from && from.nodeType === 1 ? from : doc.activeElement;
    overlayView.back(true);
    overlay.classList.remove('closing');
    overlay.hidden = false;
    const page = doc.getElementById('page');
    if (page) page.setAttribute('inert', '');
    // Blocks' page scrolls; the frame pages never do.
    doc.body.style.overflow = 'hidden';
    LP.audio.stopSpeech();
    const target = overlay.querySelector('.tiles [aria-current="true"]') || overlay.querySelector('.tile');
    if (target) target.focus({ preventScroll: true });
    doc.dispatchEvent(new Event('lp:shelfopened'));
  }
  function close() {
    if (!overlay || overlay.hidden) return;
    // The next visit starts on the tiles.
    overlayView.back(true);
    overlay.hidden = true;
    const page = doc.getElementById('page');
    if (page) page.removeAttribute('inert');
    doc.body.style.overflow = '';
    const back = doc.getElementById('shelf-open');
    if (opener && doc.contains(opener) && opener !== doc.body) opener.focus({ preventScroll: true }); else if (back) back.focus({ preventScroll: true });
    doc.dispatchEvent(new Event('lp:shelfclosed'));
  }
  // shared.js clears the page's inert attribute (and the body's overflow) whenever a dialog closes; keep them while
  // the overlay is open.
  doc.addEventListener('lp:dialogclosed', () => { if (overlay && !overlay.hidden) { const page = doc.getElementById('page'); if (page) page.setAttribute('inert', ''); doc.body.style.overflow = 'hidden'; } });
  function setCurrent(id) {
    current = id;
    if (!overlay) return;
    for (const tile of overlay.querySelectorAll('.tiles [data-shelf]')) { if (tile.dataset.shelf === id) tile.setAttribute('aria-current', 'true'); else tile.removeAttribute('aria-current'); }
  }

  Object.assign(api, { mountHub, mountOverlay, open, close, setCurrent, gate, grownups, about, TILES });
  Object.defineProperties(api, {
    isOpen: { get: () => !!overlay && !overlay.hidden },
    overlayNook: { get: () => overlayNook },
    // The list showing now (the hub's, or the overlay's while it is open), or ''.
    menu: { get: () => (overlay && !overlay.hidden ? overlayView.menu : hubView ? hubView.menu : '') }
  });
  window.LPShelf = api;
})();
