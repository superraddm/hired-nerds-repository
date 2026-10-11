/* Nook's shelf (round 4): the hub page, the same shelf as a full-height overlay inside a game, the Grown-ups
   press-and-hold and the Grown-ups sheet. Load after shared.js, nook-art.js, icons.js and frame.js.

   window.LPShelf:
     mountHub(container)            the shelf page: Nook's greeting, eight tile buttons, the Grown-ups hold
     mountOverlay({current,onMode}) the in-game shelf behind the top bar's shelf button. Tiles for the four Garden
                                    activities carry data-mode and switch in place through onMode; the current
                                    tile is marked and closes the overlay; the others navigate. Android back
                                    opens it through ONE history entry, pushed once (at the first touch or key press).
     open() / close() / setCurrent(id) / isOpen
     gate(button, onOpen)           the hold: 2,000 ms in all, the ring from 300 ms, cancelled by release, a move
                                    over 10 px, pointer cancel or the page hiding; Enter or Space held is the
                                    keyboard equivalent; focus comes back to the button when the sheet closes.
     navigate(url)                  location change (tests replace it)

   Tiles are buttons, not links. The shelf foot holds only the Grown-ups button, and a crossed-speaker badge while
   a grown-up has turned sound off. Nothing on the shelf mutes. */
(function () {
  'use strict';
  const LP = window.LP, I = window.LPIcons, F = window.LPFrame;
  const doc = document;
  const TILES = [['count', 'Count', 'garden.html#count'], ['add', 'Add', 'garden.html#add'], ['words', 'Words', 'garden.html#words'], ['patterns', 'Patterns', 'garden.html#patterns'], ['shapes', 'Shapes', 'shapes.html'], ['feelings', 'Feelings', 'feelings.html'], ['paint', 'Paint', 'studio-lab.html'], ['blocks', 'Blocks', 'blocks.html']];
  const GARDEN = ['count', 'add', 'words', 'patterns'];
  // Shown with typographic apostrophes; the clip key is the plain text.
  const GREETING = 'Hello! I’m Nook. Let’s play.', GREETING_CLIP = "Hello! I'm Nook. Let's play.";
  const api = { navigate(url) { window.location.href = url; } };
  // The hub serves kpopboom.party (fireworks at /boom/) and jofdavies.com/fireworks/little-patterns/ (fireworks one level up).
  const boomHref = () => (window.location.pathname.startsWith('/fireworks/') ? '../' : '../boom/');

  function markup(options) {
    const tiles = TILES.map(([id, label]) => '<button type="button" class="tile ' + id + '" data-shelf="' + id + '"' + (options.modes && GARDEN.includes(id) ? ' data-mode="' + id + '"' : '') + (id === options.current ? ' aria-current="true"' : '') + '>' + I[id] + '<span>' + label + '</span></button>').join('');
    return '<div class="shelf"><div class="shelf-top"><button type="button" class="nook-btn" data-nook aria-label="Nook"><span class="nook-pos"></span></button>' +
      '<button type="button" class="nf-bubble" data-bubble><span class="line"></span><span class="hear" aria-hidden="true"></span><span class="sr-only"> Hear it again</span></button></div>' +
      '<nav class="tiles" aria-label="Nook’s games">' + tiles + '</nav>' +
      '<div class="shelf-foot"><span class="sound-badge" role="img" aria-label="Sound is off" hidden>' + I.soundOff + '</span>' +
      '<button type="button" class="nf-grown" data-grownups aria-label="Grown-ups: press and hold for two seconds"><svg class="ring" viewBox="0 0 62 62" aria-hidden="true" focusable="false"><circle cx="31" cy="31" r="27"/></svg>' + I.gear + '</button></div></div>';
  }
  function badge(el) { const b = el.querySelector('.sound-badge'); if (b) b.hidden = !LP.soundOff; }

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
  function grownups(from) {
    const el = LP.openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Grown-ups</h2><button data-close aria-label="Close Grown-ups">×</button></div>' +
      '<p>Children reach this sheet only with a two-second press and hold. Locking the device to one app (Guided Access on iPad, App pinning or Samsung Kids on Android) is a device setting.</p>' +
      '<div class="gu-list">' +
      '<button type="button" id="gu-player"></button>' +
      '<button type="button" id="gu-settings">Settings: sound, word pictures, Softer colours, letters, keyboard and answers</button>' +
      '<button type="button" id="gu-about">Privacy, devices and credits</button>' +
      '<a href="content.html">All game content and answers</a>' +
      '<a href="feelings-content.html">Feelings: every word and story</a>' +
      '<a id="gu-boom" href="' + boomHref() + '">K-Pop BOOM! fireworks, next door</a>' +
      '</div><p class="lp-small" id="gu-sound"></p>');
    el.classList.add('lp-rise');
    const player = LP.player;
    el.querySelector('#gu-player').textContent = 'Who is playing: ' + player.avatar + ' ' + player.name;
    el.querySelector('#gu-sound').textContent = LP.soundOff ? 'Sound is off. Turn it on in Settings.' : 'Sound is on. Turn it off in Settings.';
    el.querySelector('#gu-player').onclick = () => LP.choosePlayer();
    el.querySelector('#gu-settings').onclick = () => LP.settings();
    el.querySelector('#gu-about').onclick = about;
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

  // ---- Nook and the greeting on a shelf ----
  function dress(shelf, line, speech) {
    const talk = F.bubble(shelf.querySelector('[data-bubble]'), shelf.querySelector('[data-bubble] .line'));
    talk.say(line, speech);
    const nook = F.nook(shelf.querySelector('[data-nook]'), { feeling: 'greet', bubble: talk });
    gate(shelf.querySelector('[data-grownups]'), grownups);
    badge(shelf);
    doc.addEventListener('lp:sound', () => badge(shelf));
    return { talk, nook };
  }

  // ---- the hub page ----
  function mountHub(container) {
    container.innerHTML = markup({});
    const shelf = container.querySelector('.shelf');
    const parts = dress(shelf, GREETING, [GREETING_CLIP]);
    shelf.addEventListener('click', e => { const tile = e.target.closest('[data-shelf]'); if (!tile) return; const entry = TILES.find(t => t[0] === tile.dataset.shelf); if (entry) api.navigate(entry[2]); });
    return parts;
  }

  // ---- the overlay inside a game ----
  let overlay = null, current = '', onMode = null, opener = null, overlayNook = null;
  function mountOverlay(options) {
    options = options || {};
    current = options.current || '';
    onMode = options.onMode || null;
    overlay = doc.createElement('div');
    overlay.className = 'lp-overlay';
    overlay.id = 'shelf-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Nook’s games');
    overlay.innerHTML = markup({ current, modes: !!onMode });
    doc.body.appendChild(overlay);
    overlayNook = dress(overlay.querySelector('.shelf'), 'What shall we play?', ['What shall we play?']).nook;
    overlay.addEventListener('click', e => {
      const tile = e.target.closest('[data-shelf]');
      if (!tile) return;
      const id = tile.dataset.shelf, entry = TILES.find(t => t[0] === id);
      if (onMode && GARDEN.includes(id)) { close(); onMode(id); return; }
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
    window.addEventListener('popstate', () => open());
    return api;
  }
  function open(from) {
    if (!overlay || !overlay.hidden) return;
    opener = from && from.nodeType === 1 ? from : doc.activeElement;
    overlay.classList.remove('closing');
    overlay.hidden = false;
    const page = doc.getElementById('page');
    if (page) page.setAttribute('inert', '');
    LP.audio.stopSpeech();
    const target = overlay.querySelector('[aria-current="true"]') || overlay.querySelector('.tile');
    if (target) target.focus({ preventScroll: true });
    doc.dispatchEvent(new Event('lp:shelfopened'));
  }
  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    const page = doc.getElementById('page');
    if (page) page.removeAttribute('inert');
    const back = doc.getElementById('shelf-open');
    if (opener && doc.contains(opener) && opener !== doc.body) opener.focus({ preventScroll: true }); else if (back) back.focus({ preventScroll: true });
    doc.dispatchEvent(new Event('lp:shelfclosed'));
  }
  // shared.js clears the page's inert attribute whenever a dialog closes; keep it while the overlay is open.
  doc.addEventListener('lp:dialogclosed', () => { if (overlay && !overlay.hidden) { const page = doc.getElementById('page'); if (page) page.setAttribute('inert', ''); } });
  function setCurrent(id) {
    current = id;
    if (!overlay) return;
    for (const tile of overlay.querySelectorAll('[data-shelf]')) { if (tile.dataset.shelf === id) tile.setAttribute('aria-current', 'true'); else tile.removeAttribute('aria-current'); }
  }

  Object.assign(api, { mountHub, mountOverlay, open, close, setCurrent, gate, grownups, TILES });
  Object.defineProperties(api, { isOpen: { get: () => !!overlay && !overlay.hidden }, overlayNook: { get: () => overlayNook } });
  window.LPShelf = api;
})();
