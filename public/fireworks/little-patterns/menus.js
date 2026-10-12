/* Each game's own screen on the shelf (round 4, phase 9: navigation proposal 2, approved by Jof on 12 October 2026).
   The six games with choices, Count, Add, Words, Patterns, Shapes and Feelings, sit first on the shelf, each tile
   showing a folder preview (a few simple glyphs of what is inside), then a thin rule, then Paint and Blocks. A tap on
   one of the six opens its sub-menu on the hub: a back arrow top-left (to all games), the game's icon and name, Nook's
   one-line question (text only, except Count's, which is a clip), big activity tiles with a picture and one word, and
   directly under them the level tiles, a picture and a short label each, all visible. One tap on an activity starts it
   at the current level; one tap on a level starts the current activity at that level. The last activity and the
   current level are marked. Load after shared.js, nook-art.js and icons.js; shelf.js draws the screens on the hub, and
   every game reads its address and words its caption ("Add · Up to 5") through this file.

   window.LPMenus:
     GAMES                  the six games with a sub-menu, in shelf order
     MENUS[id]              { name, greeting, speech, tiles: [[activity, word]], group } (group: the level row's name)
     has(id)                whether the shelf tile opens a sub-menu
     tiles(id)              [{ activity, word, art }] the activity tiles (Count has none: levels only)
     levels(id, activity)   [{ level, word, art }] the level tiles (Words and Feelings have none: those stay with the
                            parent; Take away has five; Patterns' families start Finish the pattern)
     levelName(id, level, activity)  the short label of a level ("Up to 5", "1 to 10", "2 shapes", "Shapes 2")
     last(id)               the player's last activity in that game, read from the game's own save
     state(id)              { activity, level, set, family, rule } read from the game's own save: what the sub-menu
                            marks and what Grown-ups shows as Now; the games pass the same shape from their live state
     marked(id, state)      the level tile to mark (none while a grown-up's set or numbered pattern level is on)
     caption(id, state)     { text, label }: "Add · Up to 5" and "Add, up to 5", the in-game caption and the Now line
     href(id, activity, level)  where a tile goes: garden.html#add/take, garden.html#count/3, shapes.html#name/2
     levelsHref(id)         the game with its grown-ups' chooser open (Levels and puzzles): garden.html#add/levels
     parse(hash)            '#add/take/3' -> { words: ['add', 'take'], level: 3, levels: false } (the games read their
                            address on arrival and then keep only the game in it)
     folder(id)             the folder preview's glyphs: [svg], one per cell, in the tile's own ink
     FRIENDS                the Friends tile's picture: the first story's scene, drawn by feelings-art.js (a test keeps
                            the two the same) */
(function (root) {
  'use strict';
  const GAMES = ['count', 'add', 'words', 'patterns', 'shapes', 'feelings'];
  const MENUS = {
    count: { name: 'Count', greeting: 'How many apples?', speech: ['How many apples?'], tiles: [], group: 'How many apples' },
    add: { name: 'Add', greeting: 'Add or take away?', speech: [], tiles: [['add', 'Add'], ['take', 'Take away']], group: 'How many' },
    words: { name: 'Words', greeting: 'Which word game?', speech: [], tiles: [['sentence', 'Missing word'], ['letter', 'Missing letter'], ['order', 'Word order'], ['numbers', 'Number words']] },
    patterns: { name: 'Patterns', greeting: 'Which pattern game?', speech: [], tiles: [['finish', 'Finish the pattern'], ['make', 'Make your own']], group: 'How many shapes' },
    shapes: { name: 'Shapes', greeting: 'Which shape game?', speech: [], tiles: [['sides', 'Sides'], ['name', 'Name']], group: 'Which shapes' },
    feelings: { name: 'Feelings', greeting: 'Which feelings game?', speech: [], tiles: [['board', 'Nook feels…'], ['which', 'Which feeling?'], ['friends', 'Friends'], ['me', 'Me']] }
  };
  // The child's levels, one short label each; the same words name the level in the game's caption.
  const LEVELS = {
    count: ['1 to 5', '1 to 10', '11 to 20', 'Tens', '21 to 50', '51 to 100'],
    add: ['Up to 5', 'Up to 10', 'Up to 20', 'Over ten', 'Tens', 'Missing'],
    take: ['Up to 5', 'Up to 10', 'Up to 20', 'Over ten', 'Tens'],
    patterns: { 2: '2 shapes', 3: '3 shapes', 4: '4 shapes' },
    shapes: ['Shapes 1', 'Shapes 2']
  };
  // Levels that stay with the parent are still named in the caption.
  const NUMBERS = ['1 to 5', '1 to 10', '11 to 20', 'Tens to 100'];
  const RULE_SHORT = { grow: 'Growing', mirror: 'Mirror', number: 'Numbers' };
  const PAGES = { count: 'garden.html#count', add: 'garden.html#add', words: 'garden.html#words', patterns: 'garden.html#patterns', shapes: 'shapes.html#', feelings: 'feelings.html#' };
  const has = id => Object.prototype.hasOwnProperty.call(MENUS, id);
  const ids = id => has(id) ? MENUS[id].tiles.map(t => t[0]) : [];
  const G = () => root.GardenLearning || null;
  const clamp = (kind, value, top) => { const L = G(); if (L && L.clampLevel) return L.clampLevel(kind, value); const n = Math.round(Number(value)); return Number.isFinite(n) ? Math.min(top, Math.max(1, n)) : 1; };

  // ---- what the player last did, from each game's own save (the games save on every change) ----
  function saved(key) { try { const v = root.LP && root.LP.storage.get(key, null); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } }
  function last(id) {
    if (!has(id) || id === 'count') return '';
    const g = id === 'shapes' ? saved('shapes-position') : id === 'feelings' ? saved('feelings-v1') : saved('garden-position');
    const value = id === 'add' ? g.operation : id === 'words' ? g.wordTab : id === 'patterns' ? (g.patternMode === 'make' ? 'make' : 'finish') : id === 'shapes' ? g.mode : ({ match: 'which', people: 'friends' }[g.mode] || g.mode);
    return ids(id).includes(value) ? value : ids(id)[0];
  }
  // The levels as the Garden restores them (garden.js restore()): an explicit level, or (an older save) the shared
  // range; Add and Patterns went back to level 1 once when the level strip arrived.
  function gardenLevel(g, kind) {
    const v = g.levels && g.levels[kind];
    if (g.strip !== 1 && g.levels && (kind === 'add' || kind === 'patterns')) return 1;
    if (Number.isInteger(v)) return clamp(kind, v, kind === 'patterns' ? 14 : kind === 'numbers' ? 4 : 6);
    const prefs = root.LP && root.LP.prefs;
    return kind === 'patterns' ? 1 : prefs && prefs.range === 10 ? 2 : 1;
  }
  function state(id) {
    if (!has(id)) return {};
    if (id === 'shapes') { const s = saved('shapes-position'); return { activity: last(id), level: clamp('shapes', s.level || 1, 2) }; }
    if (id === 'feelings') { const s = saved('feelings-v1'); return { activity: last(id), level: s.level === 2 ? 2 : 1 }; }
    const g = saved('garden-position');
    if (id === 'count') return { activity: 'count', level: gardenLevel(g, 'count') };
    if (id === 'add') {
      const activity = last(id), set = g.selection && g.selection.addSet && g.selection.addSet.set;
      const L = G();
      return { activity, level: Math.min(gardenLevel(g, 'add'), activity === 'take' ? 5 : 6), set: activity === 'add' && set && (!L || L.SUM_SETS[set]) ? set : '' };
    }
    if (id === 'words') return { activity: last(id), level: gardenLevel(g, 'numbers') };
    const family = [0, 2, 3, 4].includes(g.patternFamily) ? g.patternFamily : 2, level = gardenLevel(g, 'patterns');
    let rule = '';
    try { const L = G(); if (L && !family) rule = L.patternRound(0, root.LP.prefs, level).rule; } catch (_) { rule = ''; }
    return { activity: last(id), family, level, rule };
  }
  function levelName(id, level, activity) {
    if (id === 'count') return LEVELS.count[level - 1] || '';
    if (id === 'add') return (activity === 'take' ? LEVELS.take : LEVELS.add)[level - 1] || '';
    if (id === 'patterns') return LEVELS.patterns[level] || '';
    if (id === 'shapes') return LEVELS.shapes[level - 1] || '';
    return '';
  }
  // The level tile to mark: none while a grown-up's practice set (Doubles, Make ten) or a numbered pattern level is on.
  function marked(id, s) {
    s = s || state(id);
    if (id === 'add') return s.set ? 0 : s.level;
    if (id === 'patterns') return s.family || 0;
    return id === 'count' || id === 'shapes' ? s.level : 0;
  }
  // The caption in the game's top bar and the Now line in Grown-ups: the activity, then the level, as the two taps
  // on the sub-menu chose them. The label says it the way a screen reader reads it.
  function caption(id, s) {
    s = s || {};
    const word = activity => (MENUS[id].tiles.find(t => t[0] === activity) || [])[1] || MENUS[id].name;
    let name = MENUS[id].name, level = '';
    if (id === 'count') level = levelName('count', s.level);
    else if (id === 'add') { name = word(s.activity === 'take' ? 'take' : 'add'); const L = G(); level = s.set && L && L.SUM_SETS[s.set] ? L.SUM_SETS[s.set].label : levelName('add', s.level, s.activity); }
    else if (id === 'words') { name = word(s.activity); if (s.activity === 'numbers') level = NUMBERS[s.level - 1] || ''; }
    else if (id === 'patterns') { name = word(s.activity); if (s.activity !== 'make') level = s.family ? levelName('patterns', s.family) : 'Level ' + s.level + (RULE_SHORT[s.rule] ? ' · ' + RULE_SHORT[s.rule] : ''); }
    else if (id === 'shapes') { name = word(s.activity); level = levelName('shapes', s.level); }
    else if (id === 'feelings') { name = word(s.activity); if (s.activity === 'which' && s.level === 2) level = 'Level 2'; }
    const said = level.replace(/ · /g, ', ');
    return { text: level ? name + ' · ' + level : name, label: (level ? name.replace(/\?$/, '') + ', ' + said.toLowerCase() : name) + (s.place || '') };
  }

  // ---- addresses: the hub's tiles name the activity and the level once; the game then keeps only itself ----
  function href(id, activity, level) {
    if (!has(id)) return '';
    const parts = [];
    if (id !== 'count') parts.push(ids(id).includes(activity) ? activity : ids(id)[0]);
    if (Number.isInteger(level) && level > 0) parts.push(String(level));
    return PAGES[id] + (parts.length ? (id === 'shapes' || id === 'feelings' ? '' : '/') + parts.join('/') : '');
  }
  const levelsHref = id => has(id) ? PAGES[id] + (id === 'shapes' || id === 'feelings' ? '' : '/') + 'levels' : '';
  function parse(hash) {
    const out = { words: [], level: 0, levels: false };
    for (const part of String(hash || '').replace(/^#/, '').split('/')) {
      if (!part) continue;
      if (/^\d{1,2}$/.test(part)) out.level = Number(part);
      else if (part === 'levels') out.levels = true;
      else out.words.push(part);
    }
    return out;
  }

  // ---- the activity pictures (phase 8): the same on the hub and in the sub-menu ----
  const svg = (box, body) => '<svg viewBox="' + box + '" aria-hidden="true" focusable="false">' + body + '</svg>';
  const apple = (x, y, r, look) => '<g transform="translate(' + x + ' ' + y + ')"' + (look === 'gone' ? ' opacity=".38"' : '') + '><circle r="' + r + '" fill="' + (look === 'came' ? '#fffdf3' : '#e67b69') + '" stroke="#b65b50" stroke-width="3"' + (look === 'came' ? ' stroke-dasharray="5 4"' : '') + '/><path d="M0 -' + r + ' q2 -8 6 -10" stroke="#6b6740" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M2 -' + (r + 4) + ' q8 -6 12 2 q-8 6 -12 -2z" fill="#4d9271"/></g>';
  const bead = { circle: (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#6bb9a6" stroke="#3f8f7c" stroke-width="3"/>', square: (x, y) => '<rect x="' + (x - 11) + '" y="' + (y - 11) + '" width="22" height="22" rx="4" fill="#a789ca" stroke="#7f62a3" stroke-width="3"/>', oval: (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="14" ry="9" fill="#f2a593" stroke="#c46f5f" stroke-width="3"/>', triangle: (x, y) => '<path d="M' + x + ' ' + (y - 12) + 'L' + (x + 12) + ' ' + (y + 10) + 'L' + (x - 12) + ' ' + (y + 10) + 'Z" fill="#f2b45a" stroke="#b8812a" stroke-width="3" stroke-linejoin="round"/>' };
  const tag = (x, y, n) => '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#fffdf3" stroke="#b8812a" stroke-width="2.5"/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-weight="900" font-size="15" fill="#5a4a12">' + n + '</text>';
  const chip = x => '<rect x="' + x + '" y="72" width="32" height="20" rx="6" fill="#ccead9" stroke="#75ad91" stroke-width="2.5"/><path d="M' + (x + 8) + ' 82h16" stroke="#2f4f3c" stroke-width="3.5" stroke-linecap="round"/>';
  const letters = text => (root.LP && root.LP.prefs && root.LP.prefs.case === 'lower') ? text.toLowerCase() : text.toUpperCase();
  const mini = html => '<span class="mini">' + html.replace(/>([a-z]+)</g, (m, w) => '>' + letters(w) + '<') + '</span>';
  const ART = {
    add: {
      add: () => svg('0 0 124 64', apple(16, 38, 13) + apple(46, 38, 13) + '<path d="M70 30v16M62 38h16" stroke="#3b6a5c" stroke-width="5" stroke-linecap="round"/>' + apple(102, 38, 13, 'came')),
      take: () => svg('0 0 124 64', '<rect x="3" y="14" width="118" height="46" rx="14" fill="#fff1cb" stroke="#e0c983" stroke-width="2.5"/>' + apple(28, 40, 12) + apple(62, 40, 12) + apple(96, 40, 12, 'gone') + '<path d="M84 50l24 -20" stroke="#7a4a3f" stroke-width="5" stroke-linecap="round"/>')
    },
    words: {
      sentence: () => mini('<i class="mw">the</i><i class="mgap"></i><i class="mw">sat</i>'),
      letter: () => mini('<i class="mw">c</i><i class="mgap small"></i><i class="mw">t</i>'),
      order: () => mini('<i class="mchip">sat</i><i class="mchip">cat</i><i class="mchip">the</i>'),
      numbers: () => mini('<i class="mw">3</i><i class="mw arrow">→</i><i class="mw">three</i>')
    },
    patterns: {
      finish: () => svg('0 0 132 48', '<path d="M4 24h124" stroke="#b7a37a" stroke-width="3"/>' + bead.circle(18, 24) + bead.square(50, 24) + bead.circle(82, 24) + '<rect x="101" y="11" width="25" height="26" rx="6" fill="#efe6fb" stroke="#5b4a7d" stroke-width="3" stroke-dasharray="5 4"/>'),
      make: () => svg('0 0 132 48', '<path d="M4 24h92" stroke="#b7a37a" stroke-width="3"/>' + bead.circle(18, 24) + bead.oval(50, 24) + bead.triangle(82, 25) + '<path d="M115 13v22M104 24h22" stroke="#376e5a" stroke-width="5" stroke-linecap="round"/>')
    },
    shapes: {
      sides: () => svg('0 0 120 106', '<path d="M60 10L102 80H18Z" fill="#fde9b8" stroke="#e39a2e" stroke-width="6" stroke-linejoin="round"/>' + tag(93, 40, 1) + tag(60, 93, 2) + tag(27, 40, 3)),
      name: () => svg('0 0 120 100', '<circle cx="60" cy="34" r="26" fill="#6bb9a6" stroke="#3f8f7c" stroke-width="5"/>' + chip(4) + chip(44) + chip(84))
    },
    feelings: {
      board: () => (root.LPIcons && root.LPIcons.feelings) || '',
      which: () => root.NookArt ? root.NookArt.face('surprised', { decorative: true }) : '',
      friends: () => FRIENDS,
      me: () => root.NookArt ? root.NookArt.face('happy', { decorative: true, ring: true }) : ''
    }
  };
  const FRIENDS = "<svg class=\"menu-scene\" viewBox=\"0 0 480 280\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" focusable=\"false\" data-scene=\"bubbles\"><ellipse cx=\"238\" cy=\"253\" rx=\"216\" ry=\"17\" fill=\"#e8e5ce\"/><g transform=\"translate(5 13)\"><g fill=\"#d8eef1\" stroke=\"#67939e\" stroke-width=\"3\"><circle cx=\"77\" cy=\"83\" r=\"28\"/><circle cx=\"145\" cy=\"48\" r=\"18\"/><circle cx=\"152\" cy=\"123\" r=\"35\"/></g><g fill=\"none\" stroke=\"#fffef3\" stroke-width=\"5\" stroke-linecap=\"round\"><path d=\"M58 78Q60 63 74 62M130 119Q132 102 149 101\"/></g><path d=\"M63 165L63 204\" stroke=\"#88709e\" stroke-width=\"7\"/><circle cx=\"63\" cy=\"153\" r=\"14\" fill=\"none\" stroke=\"#88709e\" stroke-width=\"6\"/><rect x=\"104\" y=\"180\" width=\"30\" height=\"42\" rx=\"6\" fill=\"#d6b45c\"/></g><svg x=\"233\" y=\"6\" width=\"220\" height=\"260\" class=\"feeling-art pose-art\" viewBox=\"0 0 240 320\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" data-person=\"sam\" data-expression=\"happy\">\n      <ellipse cx=\"120\" cy=\"306\" rx=\"72\" ry=\"8\" fill=\"#e8e5ce\"/><path d=\"M78 256 L69 301 L105 301 L120 271 L135 301 L171 301 L162 256Z\" fill=\"#4e5a70\"/>\n      <path d=\"M49 237 Q49 184 86 175 L153 175 Q191 183 191 237 L168 267 L72 267Z\" fill=\"#8770a7\"/>\n      <g fill=\"none\" stroke=\"#8770a7\" stroke-width=\"25\" stroke-linecap=\"round\"><path d=\"M73 199 Q58 232 42 233 M166 199 Q182 232 199 233\"/></g>\n      <path d=\"M104 155 L104 181 Q120 193 137 181 L137 155\" fill=\"#b77656\"/>\n      <ellipse cx=\"62\" cy=\"112\" rx=\"9\" ry=\"14\" fill=\"#d99770\"/><ellipse cx=\"178\" cy=\"112\" rx=\"9\" ry=\"14\" fill=\"#d99770\"/>\n      <path d=\"M64 91 Q61 37 120 34 Q179 37 176 94 L174 129 Q169 168 120 175 Q70 168 66 129Z\" fill=\"#d99770\"/>\n      <path d=\"M61 95 Q46 62 59 51 Q48 28 76 29 Q80 5 105 20 Q131 3 146 21 Q176 14 180 44 Q194 62 179 96 L165 63 Q146 68 131 48 Q109 65 90 51 Q79 71 62 73Z\" fill=\"#39303d\"/><g fill=\"none\" stroke=\"#453b43\" stroke-width=\"3.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M84 88 Q93 83 102 87 M138 87 Q147 83 156 88\"/>\n      <path d=\"M119 106 L114 119 L122 121\" stroke=\"#b77656\" stroke-width=\"3\"/><path d=\"M104 127 Q120 144 137 127\"/></g>\n      <ellipse cx=\"94\" cy=\"103\" rx=\"4\" ry=\"4.8\" fill=\"#34333f\"/><ellipse cx=\"146\" cy=\"103\" rx=\"4\" ry=\"4.8\" fill=\"#34333f\"/>\n      \n      <g transform=\"translate(39 233)\"><path d=\"M-7 7 Q-12 0 -8 -5 L-7 -12 Q-6 -16 -4 -12 L-3 -4 L-2 -15 Q0 -18 1 -14 L2 -4 L4 -13 Q7 -15 7 -10 L7 1 Q14 -4 14 1 Q10 11 3 13 Q-3 15 -7 7Z\" fill=\"#d99770\"/></g><g transform=\"translate(201 233)\"><path d=\"M-7 7 Q-12 0 -8 -5 L-7 -12 Q-6 -16 -4 -12 L-3 -4 L-2 -15 Q0 -18 1 -14 L2 -4 L4 -13 Q7 -15 7 -10 L7 1 Q14 -4 14 1 Q10 11 3 13 Q-3 15 -7 7Z\" fill=\"#d99770\"/></g>\n    </svg></svg>";
  function tiles(id) { return has(id) ? MENUS[id].tiles.map(([activity, word]) => ({ activity, word, art: ART[id][activity]() })) : []; }

  // ---- the level pictures: small apples, full tens and rows of ten (as the games draw them), beads, shapes ----
  // Every picture shares one height (40) so the apples are the same size on every tile.
  const lv = (w, body) => svg('0 0 ' + w + ' 40', body);
  const dot = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#e67b69" stroke="#b65b50" stroke-width="1.6"/>';
  const dots = (n, x, y, per) => { let s = ''; for (let i = 0; i < n; i++) s += dot(x + (i % per) * 13, y + Math.floor(i / per) * 13); return s; };
  // A full ten: a frame of ten apples, drawn as ten small bars inside the frame (filled up to n).
  const ten = (x, y, n) => { let s = '<rect x="' + x + '" y="' + y + '" width="54" height="17" rx="4.5" fill="#fff1cb" stroke="#cba65b" stroke-width="2"/>'; for (let i = 0; i < 10; i++) s += '<rect x="' + (x + 3.2 + i * 4.85) + '" y="' + (y + 3) + '" width="3.6" height="11" rx="1.2" fill="' + (i < n ? '#e67b69' : '#f6e3b0') + '"/>'; return s; };
  const row = (x, y, w, h) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (h || 6) + '" rx="' + ((h || 6) / 2) + '" fill="#e67b69"/>';
  const rows = (n, x, y, w, h, gap) => { let s = ''; for (let i = 0; i < n; i++) s += row(x, y + i * (h + gap), w, h); return s; };
  const missing = '<text x="40" y="26" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-weight="900" font-size="15" fill="#3b4a6b">2 + ? = 5</text>';
  const small = { circle: (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#6bb9a6" stroke="#3f8f7c" stroke-width="2.2"/>', square: (x, y) => '<rect x="' + (x - 7.5) + '" y="' + (y - 7.5) + '" width="15" height="15" rx="3" fill="#a789ca" stroke="#7f62a3" stroke-width="2.2"/>', triangle: (x, y) => '<path d="M' + x + ' ' + (y - 8.5) + 'L' + (x + 8.5) + ' ' + (y + 7) + 'L' + (x - 8.5) + ' ' + (y + 7) + 'Z" fill="#f2b45a" stroke="#b8812a" stroke-width="2.2" stroke-linejoin="round"/>', oval: (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="10" ry="6.5" fill="#f2a593" stroke="#c46f5f" stroke-width="2.2"/>' };
  const beads = n => lv(8 + n * 20, ['circle', 'square', 'triangle', 'oval'].slice(0, n).map((s, i) => small[s](14 + i * 20, 20)).join(''));
  const poly = (n, cx, cy, r, fill, stroke) => '<path d="M' + Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (n % 2 ? 0 : Math.PI / n) + i * 2 * Math.PI / n; return (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); }).join('L') + 'Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2.4" stroke-linejoin="round"/>';
  const LEVEL_ART = {
    count: [() => lv(66, dots(5, 7, 20, 5)), () => lv(66, dots(10, 7, 13, 5)), () => lv(58, ten(2, 4, 10) + dots(3, 9, 32, 3)), () => lv(52, rows(3, 2, 8, 48, 6, 3)), () => lv(76, rows(2, 2, 12, 44, 6, 4) + dots(4, 56, 13, 2)), () => lv(76, rows(5, 2, 3, 44, 5, 3) + dots(3, 56, 13, 2))],
    add: [() => lv(66, dots(5, 7, 20, 5)), () => lv(66, dots(10, 7, 13, 5)), () => lv(58, ten(2, 11, 10)), () => lv(58, ten(2, 2, 10) + ten(2, 21, 5)), () => lv(52, rows(3, 2, 8, 48, 6, 3)), () => lv(80, missing)],
    patterns: { 2: () => beads(2), 3: () => beads(3), 4: () => beads(4) },
    shapes: [() => lv(78, '<path d="M14 9L25 31H3Z" fill="#f2b45a" stroke="#b8812a" stroke-width="2.4" stroke-linejoin="round"/><rect x="31" y="10" width="20" height="20" rx="2" fill="#a789ca" stroke="#7f62a3" stroke-width="2.4"/><circle cx="66" cy="20" r="10.5" fill="#6bb9a6" stroke="#3f8f7c" stroke-width="2.4"/>'), () => lv(58, poly(5, 15, 21, 12.5, '#f8c1b5', '#c46f5f') + poly(6, 43, 20, 12.5, '#fde9b8', '#c99a2e'))]
  };
  function levels(id, activity) {
    if (id === 'count') return LEVELS.count.map((word, i) => ({ level: i + 1, word, art: LEVEL_ART.count[i]() }));
    if (id === 'add') return (activity === 'take' ? LEVELS.take : LEVELS.add).map((word, i) => ({ level: i + 1, word, art: LEVEL_ART.add[i]() }));
    if (id === 'patterns') return [2, 3, 4].map(n => ({ level: n, word: LEVELS.patterns[n], art: LEVEL_ART.patterns[n]() }));
    if (id === 'shapes') return LEVELS.shapes.map((word, i) => ({ level: i + 1, word, art: LEVEL_ART.shapes[i]() }));
    return [];
  }

  // ---- the folder previews on the shelf (navigation proposal 2): one bold glyph per cell, in the tile's own ink, in
  // the flat style of the Paint and Blocks icons; no text except the A and the 3 of Words ----
  const glyph = (body, ink) => '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" class="glyph" style="--ink:' + ink + '">' + body + '</svg>';
  const blob = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 5) + '" fill="var(--ink)"/>';
  const letter = c => '<text x="20" y="29" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-weight="900" font-size="26" fill="var(--ink)">' + c + '</text>';
  const face = mouth => '<circle cx="20" cy="20" r="15" fill="none" stroke="var(--ink)" stroke-width="3.5"/><path d="' + mouth + '" stroke="var(--ink)" stroke-width="3.5" fill="none" stroke-linecap="round"/>' + blob(14, 16, 2.2) + blob(26, 16, 2.2);
  const INK = { count: '#3f8f7c', add: '#8a6a1c', words: '#5a4680', patterns: '#a8584a', shapes: '#9a6a16', feelings: '#5a4680' };
  const FOLDERS = {
    count: [blob(20, 20, 7), blob(13, 20, 6) + blob(27, 20, 6), blob(11, 20, 5) + blob(20, 20, 5) + blob(29, 20, 5), '<rect x="8" y="12" width="24" height="6" rx="3" fill="var(--ink)"/><rect x="8" y="22" width="24" height="6" rx="3" fill="var(--ink)"/>'],
    add: ['<path d="M20 9v22M9 20h22" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>', '<path d="M9 20h22" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>'],
    words: [letter('A'), '<rect x="9" y="10" width="22" height="22" rx="5" fill="none" stroke="var(--ink)" stroke-width="3" stroke-dasharray="4 3"/>', '<rect x="6" y="14" width="13" height="12" rx="3" fill="var(--ink)"/><rect x="22" y="14" width="13" height="12" rx="3" fill="var(--ink)" opacity=".55"/>', letter('3')],
    patterns: [blob(12, 20, 6) + '<rect x="22" y="14" width="12" height="12" rx="3" fill="var(--ink)" opacity=".6"/>', blob(9, 20, 5) + '<rect x="16" y="15" width="10" height="10" rx="2" fill="var(--ink)" opacity=".6"/><path d="M28 25l4-10 4 10z" fill="var(--ink)" opacity=".8"/>', '<path d="M20 10v20M10 20h20" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>'],
    shapes: ['<path d="M20 7l13 10-5 15H12L7 17z" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>', '<path d="M13 8h14l7 12-7 12H13L6 20z" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>'],
    feelings: [face('M13 24q7 7 14 0'), face('M13 27q7-7 14 0'), blob(13, 15, 5) + blob(27, 15, 5) + '<path d="M5 33q8-10 16 0M19 33q8-10 16 0" fill="var(--ink)"/>', face('M14 25h12')]
  };
  const folder = id => (FOLDERS[id] || []).map(body => glyph(body, INK[id]));

  root.LPMenus = { GAMES, MENUS, LEVELS, has, tiles, levels, levelName, last, state, marked, caption, href, levelsHref, parse, folder, FRIENDS };
})(typeof window !== 'undefined' ? window : globalThis);
