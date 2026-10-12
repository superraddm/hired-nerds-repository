/* The activity lists under the shelf's tiles (round 4, phase 8: Jof's navigation decision, 12 October 2026). A game
   with more than one activity opens a list of them under its tile: a screen in the shelf's own look, with the shelf
   button top-left where it is on every screen, Nook's line for that game in the bubble (text only, no clip) and big
   tiles, a picture and one name each; one tap starts the activity. Count, Paint and Blocks have one activity and go
   straight in. Never more than two levels: the shelf, then the activity. Load after shared.js, nook-art.js and
   icons.js; shelf.js draws the screen.

   window.LPMenus:
     MENUS[id]            { greeting, tiles: [[activity, name]] } for add, words, patterns, shapes and feelings
     has(id)              whether the shelf tile opens a list
     tiles(id)            [{ activity, word, art }]: every picture is drawn here (inline SVG, or the small word
                          drawings in the player's letter case), so the list looks the same on the hub and in any game
     last(id)             the activity the player last played in that game, read from the game's own save (per
                          player); the list marks it with aria-current
     href(id, activity)   where a tile starts it: garden.html#add/take, shapes.html#name, feelings.html#friends
     split(hash)          '#add/take' -> ['add', 'take'] (the games read their activity from the address once)
     FRIENDS              the Friends tile's picture: the first story's scene, drawn by feelings-art.js (a test keeps
                          the two the same) */
(function (root) {
  'use strict';
  const MENUS = {
    add: { greeting: 'Add or take away?', tiles: [['add', 'Add'], ['take', 'Take away']] },
    words: { greeting: 'Which word game?', tiles: [['sentence', 'Missing word'], ['letter', 'Missing letter'], ['order', 'Word order'], ['numbers', 'Number words']] },
    patterns: { greeting: 'Which pattern game?', tiles: [['finish', 'Finish the pattern'], ['make', 'Make your own']] },
    shapes: { greeting: 'Which shape game?', tiles: [['sides', 'Sides'], ['name', 'Name']] },
    feelings: { greeting: 'Which feelings game?', tiles: [['board', 'Nook feels…'], ['which', 'Which feeling?'], ['friends', 'Friends'], ['me', 'Me']] }
  };
  const PAGES = { add: 'garden.html#add/', words: 'garden.html#words/', patterns: 'garden.html#patterns/', shapes: 'shapes.html#', feelings: 'feelings.html#' };
  const has = id => Object.prototype.hasOwnProperty.call(MENUS, id);
  const ids = id => has(id) ? MENUS[id].tiles.map(t => t[0]) : [];

  // ---- the player's last activity, from each game's own save (the games save on every change) ----
  function saved(key) { try { const v = root.LP && root.LP.storage.get(key, null); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } }
  function last(id) {
    if (!has(id)) return '';
    const g = id === 'shapes' ? saved('shapes-position') : id === 'feelings' ? saved('feelings-v1') : saved('garden-position');
    const value = id === 'add' ? g.operation : id === 'words' ? g.wordTab : id === 'patterns' ? (g.patternMode === 'make' ? 'make' : 'finish') : id === 'shapes' ? g.mode : ({ match: 'which', people: 'friends' }[g.mode] || g.mode);
    return ids(id).includes(value) ? value : ids(id)[0];
  }
  const href = (id, activity) => has(id) ? PAGES[id] + (ids(id).includes(activity) ? activity : ids(id)[0]) : '';
  const split = hash => String(hash || '').replace(/^#/, '').split('/');

  // ---- the pictures ----
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

  root.LPMenus = { MENUS, has, tiles, last, href, split, FRIENDS };
})(typeof window !== 'undefined' ? window : globalThis);
