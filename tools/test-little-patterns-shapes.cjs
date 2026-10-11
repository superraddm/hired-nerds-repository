// Shapes with Nook (round 4, phase 3): the rounds, the catalogue, the hit maths and the page in jsdom. No browser
// rendering, network or real audio; tools/test-little-patterns-layout.cjs covers the six viewports.
// Install once: npm install --prefix .wrangler/test-runtime --no-save --ignore-scripts jsdom@26.1.0
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const L = require('../public/fireworks/little-patterns/learning.js');
const p = L.defaults;
const POLYGONS = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon'];
const key = text => String(text).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

// ---- geometry helpers for the checks ----
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const sidesOf = pts => pts.map((a, i) => len(a, pts[(i + 1) % pts.length]));
const angleAt = (pts, i) => { const n = pts.length, a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n], u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180 / Math.PI; };
const cross = (pts, i) => { const n = pts.length, a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n]; return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); };
const segDist = (p0, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p0[0] - a[0]) * dx + (p0[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p0[0] - a[0] - t * dx, p0[1] - a[1] - t * dy); };
const inside = (q, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
// a point off the middle of side i, `units` along its outward normal (negative: inward)
function offSide(pts, i, units) {
  const n = pts.length, a = pts[i], b = pts[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = [pts.reduce((s, q) => s + q[0], 0) / n, pts.reduce((s, q) => s + q[1], 0) / n];
  let nx = (b[1] - a[1]) / len(a, b), ny = -(b[0] - a[0]) / len(a, b);
  if (nx * (m[0] - c[0]) + ny * (m[1] - c[1]) < 0) { nx = -nx; ny = -ny; }
  return [m[0] + nx * units, m[1] + ny * units];
}
function allRounds() {
  const out = [];
  for (let level = 1; level <= L.LEVELS.shapes; level++) for (const mode of L.SHAPE_MODES) { const n = L.shapeSequence(level, mode).length; for (let i = 0; i < n; i++) out.push(L.shapeRound(i, p, level, mode)); }
  return out;
}

// ---- the rounds ----
test('Shapes levels: level 1 is triangles, squares and rectangles (Sides and Name) with circles and ovals (Name only); level 2 keeps them and adds pentagons and hexagons; there is no diamond', () => {
  assert.equal(L.LEVELS.shapes, 2);
  assert.deepEqual(L.SHAPE_MODES, ['sides', 'name']);
  assert.deepEqual(L.SHAPE_LEVELS, [['triangle', 'square', 'rectangle', 'circle', 'oval'], ['triangle', 'square', 'rectangle', 'circle', 'oval', 'pentagon', 'hexagon']]);
  assert.deepEqual(L.SHAPE_SIDES, { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 });
  const names = (level, mode) => [...new Set(L.shapeSequence(level, mode).map(([s]) => s))].sort();
  assert.deepEqual(names(1, 'sides'), ['rectangle', 'square', 'triangle']);
  assert.deepEqual(names(1, 'name'), ['circle', 'oval', 'rectangle', 'square', 'triangle']);
  assert.deepEqual(names(2, 'sides'), ['hexagon', 'pentagon', 'rectangle', 'square', 'triangle']);
  assert.deepEqual(names(2, 'name'), ['circle', 'hexagon', 'oval', 'pentagon', 'rectangle', 'square', 'triangle']);
  // every example of a level's shapes is played, each once per pass
  for (let level = 1; level <= 2; level++) for (const mode of L.SHAPE_MODES) {
    const seq = L.shapeSequence(level, mode).map(e => e.join('#'));
    const expected = L.SHAPE_LEVELS[level - 1].filter(s => mode === 'name' || L.SHAPE_SIDES[s]).flatMap(s => Object.keys(L.SHAPE_CATALOGUE[s]).map(v => s + '#' + v));
    assert.deepEqual(seq.slice().sort(), expected.sort(), level + ' ' + mode);
  }
  const everything = JSON.stringify(L.SHAPE_CATALOGUE) + JSON.stringify(allRounds().map(r => [r.choices, r.answer, r.id])) + JSON.stringify(L.SHAPES_SPEECH);
  assert.doesNotMatch(everything, /diamond/i, 'a turned square is a square: no "diamond" anywhere in Shapes');
  assert.equal(L.clampLevel('shapes', 3), 1); assert.equal(L.clampLevel('shapes', 2), 2); assert.equal(L.clampLevel('shapes', undefined), 1);
  assert.equal(L.shapeRound(0, p, 9, 'sides').level, 1, 'an unknown level falls back to level 1');
  assert.equal(L.shapeRound(0, p, 1, 'colour').mode, 'sides', 'an unknown mode falls back to Sides');
  assert.deepEqual(L.shapeRound(0, p, 1, 'sides').counted, []);
});

test('every polygon is a closed, convex, non-degenerate point list in the 240 box, listed clockwise from its top corner', () => {
  for (const name of POLYGONS) for (const [variant, pts] of Object.entries(L.SHAPE_CATALOGUE[name])) {
    const label = name + '#' + variant;
    assert.ok(Array.isArray(pts), label);
    assert.equal(pts.length, L.SHAPE_SIDES[name], label + ': one point per corner, the path closes back to the first');
    assert.ok(pts.every(q => q.length === 2 && q.every(Number.isFinite)), label);
    assert.ok(pts.every(([x, y]) => x >= 16 && x <= 224 && y >= 16 && y <= 224), label + ' stays inside the box with room for the stroke');
    assert.equal(new Set(pts.map(q => q.join())).size, pts.length, label + ': no repeated corner');
    assert.ok(Math.min(...sidesOf(pts)) >= 60, label + ': every side long enough to tap (' + Math.round(Math.min(...sidesOf(pts))) + ')');
    for (let i = 0; i < pts.length; i++) assert.ok(cross(pts, i) > 0, label + ': convex and clockwise at corner ' + i);
    assert.ok(L.shapeArea(pts) > 2 * 4000, label + ': a real area');
    assert.ok(pts.every((q, i) => i === 0 || q[1] > pts[0][1] || (q[1] === pts[0][1] && q[0] > pts[0][0])), label + ': starts at the top corner');
    assert.ok(Math.min(...pts.map((_, i) => angleAt(pts, i))) >= 25, label + ': no needle-thin corner');
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 120) < 0.11 && Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - 120) < 0.11, label + ': centred');
  }
  for (const name of ['circle', 'oval']) for (const [variant, e] of Object.entries(L.SHAPE_CATALOGUE[name])) {
    assert.ok(!Array.isArray(e) && e.rx > 40 && e.ry > 40 && e.cx === 120 && e.cy === 120, name + '#' + variant);
    assert.ok(Math.max(e.rx, e.ry) <= 104, name + '#' + variant + ' fits the box');
    if (name === 'circle') assert.equal(e.rx, e.ry, 'a circle is round');
    else assert.ok(Math.max(e.rx, e.ry) / Math.min(e.rx, e.ry) >= 1.6, 'an oval is clearly not a circle');
  }
});

test('the examples vary in orientation and proportion: equilateral, right-angled, long thin and down-pointing triangles; squares turned up to 45 degrees; tall and wide rectangles; regular, turned and irregular pentagons and hexagons', () => {
  const C = L.SHAPE_CATALOGUE;
  const regular = pts => { const s = sidesOf(pts); return Math.max(...s) - Math.min(...s) < 1 && pts.every((_, i) => Math.abs(angleAt(pts, i) - (180 - 360 / pts.length)) < 1); };
  const flatTop = pts => Math.abs(pts[0][1] - pts[1][1]) < 0.11;
  const box = pts => { const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]); return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };
  const turn = pts => { const t = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) * 180 / Math.PI; return ((t % 90) + 90) % 90; };
  assert.ok(regular(C.triangle.up) && !flatTop(C.triangle.up), 'equilateral, pointing up');
  assert.ok(regular(C.triangle.down) && flatTop(C.triangle.down) && C.triangle.down[2][1] > 150, 'equilateral, pointing down');
  assert.ok(regular(C.triangle.tilted) && !flatTop(C.triangle.tilted), 'equilateral, tilted');
  assert.ok(C.triangle.right.some((_, i) => Math.abs(angleAt(C.triangle.right, i) - 90) < 0.5), 'right-angled');
  assert.ok(Math.max(...sidesOf(C.triangle.thin)) / Math.min(...sidesOf(C.triangle.thin)) > 2, 'long and thin');
  for (const v of Object.values(C.square)) { assert.ok(regular(v), 'a square has four equal sides and right angles'); }
  const turns = Object.values(C.square).map(turn).map(Math.round).sort((a, b) => a - b);
  assert.ok(turns.includes(0) && turns.includes(45) && turns.some(t => t > 0 && t < 45), 'upright, turned a little and turned 45 degrees: ' + turns);
  for (const [v, pts] of Object.entries(C.rectangle)) {
    assert.ok(pts.every((_, i) => Math.abs(angleAt(pts, i) - 90) < 0.5), v + ': right angles');
    const s = sidesOf(pts); assert.ok(Math.max(...s) / Math.min(...s) >= 1.6, v + ': clearly longer than wide, never a square');
  }
  const [w, h] = box(C.rectangle.wide), [w2, h2] = box(C.rectangle.tall);
  assert.ok(w > h && h2 > w2, 'a wide one and a tall one');
  assert.ok(Object.values(C.rectangle).some(pts => turn(pts) > 5), 'and a turned one');
  for (const name of ['pentagon', 'hexagon']) {
    const all = Object.values(C[name]);
    assert.ok(all.filter(regular).length >= 2 && all.filter(pts => !regular(pts)).length >= 2, name + ': regular and irregular examples');
    assert.ok(all.filter(regular).some(pts => !flatTop(pts)) && all.filter(regular).some(pts => turn(pts) % 36 > 3), name + ': regular ones turned');
  }
  assert.ok(Object.values(C.oval).some(e => e.turn) && Object.values(C.oval).some(e => e.rx > e.ry) && Object.values(C.oval).some(e => e.ry > e.rx), 'wide, tall and turned ovals');
});

test('the order is fixed and mixed: deterministic, every example once per pass, the plainest new shape first, never the same shape twice running', () => {
  for (let level = 1; level <= 2; level++) for (const mode of L.SHAPE_MODES) {
    const a = L.shapeSequence(level, mode), b = L.shapeSequence(level, mode);
    assert.deepEqual(a, b, 'deterministic');
    a[0][0] = 'changed'; assert.notEqual(L.shapeSequence(level, mode)[0][0], 'changed', 'callers get a copy');
    const seq = L.shapeSequence(level, mode);
    assert.deepEqual(seq[0], level === 1 ? ['triangle', 'up'] : ['pentagon', 'upright']);
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i][0], seq[i - 1][0], level + ' ' + mode + ': ' + seq[i - 1] + ' then ' + seq[i]);
    const names = seq.map(([s]) => s).join(' ');
    assert.ok(!/^(\S+ \S+ \S+)( \1)+/.test(names), 'not a plain cycle of names');
    const n = seq.length;
    assert.equal(L.shapeRound(n, p, level, mode).id, L.shapeRound(0, p, level, mode).id, 'the index wraps');
    assert.equal(L.shapeRound(-1, p, level, mode).id, L.shapeRound(n - 1, p, level, mode).id, 'and never breaks on a negative');
  }
});

test('round ids are shapes:v2:L<level>:<mode>:<shape>#<variant>, stable and distinct', () => {
  assert.equal(L.shapeRound(0, p, 1, 'sides').id, 'shapes:v2:L1:sides:triangle#up');
  assert.equal(L.shapeRound(0, p, 2, 'name').id, 'shapes:v2:L2:name:pentagon#upright');
  const ids = new Set();
  for (const r of allRounds()) {
    assert.match(r.id, /^shapes:v2:L[12]:(sides|name):(triangle|square|rectangle|circle|oval|pentagon|hexagon)#[a-z]+$/);
    assert.equal(r.id, 'shapes:v2:L' + r.level + ':' + r.mode + ':' + r.shape + '#' + r.variant);
    assert.equal(r.id, L.shapeRound(L.shapeSequence(r.level, r.mode).findIndex(([s, v]) => s === r.shape && v === r.variant), p, r.level, r.mode).id);
    assert.ok(!ids.has(r.id), r.id); ids.add(r.id);
    assert.deepEqual(r.choices, L.shapeRound(L.shapeSequence(r.level, r.mode).findIndex(([s, v]) => s === r.shape && v === r.variant), p, r.level, r.mode).choices, 'answers fixed per puzzle');
  }
});

test('Sides answers: the side count and two near neighbours, never twice the same, inside 3 to 8, smallest first, the answer not always in one place', () => {
  const where = new Set();
  for (const r of allRounds().filter(r => r.mode === 'sides')) {
    assert.ok(r.points && !r.ellipse, 'Sides is polygons only');
    assert.equal(r.answer, r.sides);
    assert.equal(r.answer, L.SHAPE_SIDES[r.shape]);
    assert.equal(r.choices.length, 3); assert.equal(new Set(r.choices).size, 3);
    assert.ok(r.choices.includes(r.answer));
    assert.ok(r.choices.every(n => Number.isInteger(n) && n >= 3 && n <= 8), r.id + ' ' + r.choices);
    assert.ok(r.choices.every(n => Math.abs(n - r.answer) <= 3), r.id + ': near ' + r.choices);
    assert.deepEqual(r.choices, r.choices.slice().sort((a, b) => a - b));
    where.add(r.choices.indexOf(r.answer));
  }
  assert.deepEqual([...where].sort(), [0, 1, 2]);
  assert.deepEqual(L.nearChoices(3, 3, 8, 0), [3, 4, 5]);
  for (let seed = 0; seed < 50; seed++) for (let n = 3; n <= 8; n++) { const c = L.nearChoices(n, 3, 8, seed); assert.equal(new Set(c).size, 3); assert.ok(c.every(v => v >= 3 && v <= 8 && Math.abs(v - n) <= 3)); }
});

test('Name answers: the name and two others from the same level; SQUARE never with RECTANGLE; at level 1 CIRCLE never with OVAL (level 2 may pair them)', () => {
  const where = new Set();
  for (const r of allRounds().filter(r => r.mode === 'name')) {
    const names = L.SHAPE_LEVELS[r.level - 1].map(n => n.toUpperCase());
    assert.equal(r.answer, r.shape.toUpperCase());
    assert.equal(r.choices.length, 3); assert.equal(new Set(r.choices).size, 3);
    assert.ok(r.choices.includes(r.answer) && r.choices.every(c => names.includes(c)), r.id + ' ' + r.choices);
    assert.ok(!(r.choices.includes('SQUARE') && r.choices.includes('RECTANGLE')), r.id + ': never square with rectangle');
    if (r.level === 1) assert.ok(!(r.choices.includes('CIRCLE') && r.choices.includes('OVAL')), r.id + ': never circle with oval at level 1');
    where.add(r.choices.indexOf(r.answer));
  }
  assert.deepEqual([...where].sort(), [0, 1, 2], 'the answer moves about');
  // the rule holds for every seed, not only the shipped rounds
  for (let seed = 0; seed < 400; seed++) for (let level = 1; level <= 2; level++) for (const s of L.SHAPE_LEVELS[level - 1]) {
    const c = L.shapeNameChoices(s, level, seed);
    assert.ok(c.includes(s.toUpperCase()) && new Set(c).size === 3);
    assert.ok(!(c.includes('SQUARE') && c.includes('RECTANGLE')));
    if (level === 1) assert.ok(!(c.includes('CIRCLE') && c.includes('OVAL')));
  }
  assert.ok(Array.from({ length: 400 }, (_, seed) => L.shapeNameChoices('triangle', 2, seed)).some(c => c.includes('CIRCLE') && c.includes('OVAL')), 'level 2 may show an oval and a circle together');
});

test('hit maths: the nearest side within the radius wins, nothing beyond it, a corner tie goes to the side the tap runs along, then an uncounted side, then the lower index', () => {
  const sq = [[40, 40], [200, 40], [200, 200], [40, 200]];
  assert.equal(L.nearestSide(sq, 120, 40, 10), 0, 'on the top side');
  assert.equal(L.nearestSide(sq, 120, 30.5, 10), 0, 'just inside the radius');
  assert.equal(L.nearestSide(sq, 120, 29.5, 10), -1, 'just beyond it');
  assert.equal(L.nearestSide(sq, 205, 120, 10), 1); assert.equal(L.nearestSide(sq, 120, 195, 10), 2); assert.equal(L.nearestSide(sq, 46, 120, 10), 3);
  assert.equal(L.nearestSide(sq, 120, 120, 10), -1, 'the middle is no side');
  assert.equal(L.nearestSide(sq, 196, 48, 10), 1, 'inside a corner the nearer side wins (4 from the right, 8 from the top)');
  // just outside the top-right corner the corner itself is nearest to both sides: the tap runs along the top side
  assert.equal(L.nearestSide(sq, 206, 38, 10), 0, 'more along the top');
  assert.equal(L.nearestSide(sq, 202, 34, 10), 1, 'more along the right');
  // exactly on the diagonal: a full tie, so a side not yet counted wins, else the lower index
  assert.equal(L.nearestSide(sq, 205, 35, 10), 0);
  assert.equal(L.nearestSide(sq, 205, 35, 10, [0]), 1, 'the uncounted side of a perfect tie');
  assert.equal(L.nearestSide(sq, 205, 35, 10, [0, 1]), 0, 'both counted: the lower index');
  assert.equal(L.nearestSide(sq, 120, 40, 10, [0]), 0, 'a counted side is still the side tapped (it is acknowledged, not recounted)');
  assert.equal(L.nearestSide(sq, 200, 40, 10), L.nearestSide(sq, 200, 40, 10), 'deterministic');
  assert.equal(L.nearestSide([], 0, 0, 10), -1); assert.equal(L.nearestSide(null, 0, 0, 10), -1);
  // every side of every shipped polygon, from either face, against a brute-force nearest side
  for (const name of POLYGONS) for (const [variant, pts] of Object.entries(L.SHAPE_CATALOGUE[name])) {
    for (let i = 0; i < pts.length; i++) for (const off of [-14, -6, 0, 6, 14]) assert.equal(L.nearestSide(pts, ...offSide(pts, i, off), 15), i, name + '#' + variant + ' side ' + i + ' at ' + off);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let k = 0; k < 300; k++) {
      const x = -10 + rnd() * 260, y = -10 + rnd() * 260, ds = pts.map((a, i) => segDist([x, y], a, pts[(i + 1) % pts.length])), best = Math.min(...ds);
      const got = L.nearestSide(pts, x, y, 20);
      if (best > 20) assert.equal(got, -1); else assert.ok(Math.abs(ds[got] - best) < 1e-6, name + '#' + variant + ' at ' + [x, y].map(Math.round));
    }
  }
});

test('number tags sit off the middle of each side, outside the shape and inside the drawing', () => {
  for (const name of POLYGONS) for (const [variant, pts] of Object.entries(L.SHAPE_CATALOGUE[name])) for (let i = 0; i < pts.length; i++) {
    // the page draws each tag as a circle of radius 17, 31 units off its side, in a viewBox of -24 to 264
    const t = L.sideTag(pts, i, 31), a = pts[i], b = pts[(i + 1) % pts.length];
    assert.ok(!inside(t, pts), name + '#' + variant + ' tag ' + i + ' outside');
    assert.ok(segDist(t, a, b) >= 30.8 && segDist(t, a, b) < 31.2, 'about 31 units off its side');
    assert.ok(t.every(v => v - 17 >= -24.05 && v + 17 <= 264.05), name + '#' + variant + ' tag ' + i + ' inside the viewBox: ' + t);
    for (let j = 0; j < pts.length; j++) if (j !== i) assert.ok(segDist(t, pts[j], pts[(j + 1) % pts.length]) > 17 + 8, name + '#' + variant + ' tag ' + i + ' clear of side ' + j + ' and its stroke');
  }
});

test('success lines: "A pentagon has five sides." and "It’s an oval!" as text, and since phase 5 spoken from their own clips with the opener', () => {
  const bank = new Set(L.spokenBank());
  for (const line of L.SHAPES_SPEECH) assert.ok(bank.has(key(line)), 'in the spoken bank: ' + line);
  assert.deepEqual(L.SHAPES_SPEECH.slice(-3), ['Which shape is this?', 'How many sides?', 'Tap each side.']);
  assert.ok(L.SHAPES_SPEECH.includes("It's an oval!") && L.SHAPES_SPEECH.includes('A hexagon has six sides.'));
  for (const r of allRounds()) {
    r.done = true;
    const line = L.successLine('shapes', r);
    const fact = r.mode === 'sides' ? 'A ' + r.shape + ' has ' + L.numberWord(r.sides).toLowerCase() + ' sides.' : 'It’s ' + (r.shape === 'oval' ? 'an' : 'a') + ' ' + r.shape + '!';
    assert.ok(line.text.includes(fact), line.text);
    assert.ok(L.SHAPES_SPEECH.includes(fact.replace('’', "'")), 'every fact is on the phase-5 list: ' + fact);
    assert.equal(line.speech.length, 2);
    assert.ok(L.OPENERS.includes(line.speech[0]) || L.OPENERS.includes(line.speech[1]), 'the opener, before or after');
    assert.ok(line.speech.includes(fact.replace('’', "'")), 'and the fact, said as one clip');
    assert.ok(line.speech.every(part => bank.has(key(part))), 'whatever is spoken has a clip');
    assert.deepEqual(L.successLine('shapes', r), line, 'the same puzzle always gets the same words');
  }
  assert.equal(L.voiced('Spot on!'), true); assert.equal(L.voiced('How many sides?'), true); assert.equal(L.voiced('How many corners?'), false);
});

// ---- the page ----
function app(t, seed = {}, soundOn = true) {
  const html = fs.readFileSync(path.join(root, 'shapes.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://games.example/little-patterns/shapes.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, errors = [], plays = [], spoken = [];
  w.addEventListener('error', e => errors.push(e.error || e.message));
  w.SpeechSynthesisUtterance = function (text) { this.text = text; };
  w.speechSynthesis = Object.assign(new w.EventTarget(), { getVoices: () => [], speak: u => spoken.push(u.text), cancel() {} });
  w.Audio = function () { this.src = ''; this.play = () => { plays.push(this.src); return Promise.resolve(); }; this.pause = () => {}; this.removeAttribute = n => { if (n === 'src') this.src = ''; }; this.load = () => {}; };
  w.fetch = () => { throw new Error('A game must not send player data over the network.'); };
  // The page's screen matrix: shape units to CSS pixels at twice the size, offset to (100, 50).
  w.SVGElement.prototype.getScreenCTM = function () { return { a: 2, b: 0, c: 0, d: 2, e: 100, f: 50 }; };
  for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, JSON.stringify(v));
  for (const script of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(root, script.getAttribute('src').split('?')[0]), 'utf8'));
  if (!soundOn) w.LP.audio.mute();
  t.after(async () => { await new Promise(r => setTimeout(r, 10)); assert.deepEqual(errors, [], 'no uncaught page errors'); assert.deepEqual(spoken, [], 'no device voice'); dom.window.close(); });
  const query = s => w.document.querySelector(s), all = s => Array.from(w.document.querySelectorAll(s));
  const click = s => { const el = query(s); assert.ok(el, s); el.click(); return el; };
  const store = k => JSON.parse(w.localStorage.getItem('lp-player-' + w.LP.player.id + '-' + k));
  // a pointer tap at a point in the shape's own units, through the page's matrix
  const tap = (ux, uy) => query('.shape-stage').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, clientX: 2 * ux + 100, clientY: 2 * uy + 50, detail: 1 }));
  const clip = text => w.LPVoiceLibrary.clips[key(text)].file;
  return { w, query, all, click, store, tap, plays, clip };
}
const P = 'lp-player-player-1-';
const place = (level, mode, example, rounds) => {
  const i = L.shapeSequence(level, mode).findIndex(([s, v]) => s + '#' + v === example);
  assert.ok(i >= 0, example);
  return { [P + 'shapes-position']: { mode, level, indices: { [mode]: i } }, ...(rounds ? { [P + 'shapes-rounds']: rounds } : {}) };
};
const roundAt = (level, mode, example) => L.shapeRound(L.shapeSequence(level, mode).findIndex(([s, v]) => s + '#' + v === example), p, level, mode);
const tick = () => new Promise(r => setTimeout(r, 0));
const wait = ms => new Promise(r => setTimeout(r, ms));
const tags = a => a.all('.big-shape .tag').map(g => [Number(g.dataset.tag), Number(g.textContent)]);

test('the Shapes page is the frame: Sides and Name chips, one "Shapes 1" pill, a resting Nook with one bubble, the shape and three answers, Help; the stub is gone and the new files ship', t => {
  const a = app(t);
  assert.deepEqual(a.all('.nf-top button').map(b => b.id || b.dataset.shapesMode), ['shelf-open', 'sides', 'name', 'support']);
  assert.deepEqual(a.all('#modes .chip').map(b => [b.textContent, b.getAttribute('aria-pressed')]), [['Sides', 'true'], ['Name', 'false']]);
  assert.equal(a.query('#support').textContent, 'Shapes 1');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'Nook rests: the hello face, arms down');
  assert.equal(a.all('#page .nf-bubble').length, 1);
  assert.equal(a.query('#speech').textContent, 'How many sides? Tap each side.');
  assert.ok(!a.query('#bubble').classList.contains('silent'), 'the prompt has its clips (phase 5), so the speaker shows');
  assert.deepEqual(a.w.LP.audio.has(['How many sides?', 'Tap each side.']), true);
  assert.equal(a.query('.shape-stage').dataset.shape, 'triangle');
  assert.equal(a.all('.big-shape .side').length, 3, 'one visible stroke per side');
  assert.equal(a.all('.big-shape .hit').length, 3, 'and one invisible wide hit stroke per side');
  assert.deepEqual(a.all('[data-choice]').map(b => b.textContent), L.shapeRound(0, p, 1, 'sides').choices.map(String), 'three numbers, visible from the start');
  assert.equal(a.query('#help').hidden, false); assert.equal(a.query('#next').hidden, true); assert.equal(a.query('#repeat').hidden, true);
  assert.equal(a.query('.soon'), null, 'no placeholder');
  assert.equal(a.all('#page a[href]').length, 0, 'no links on the play screen');
  a.click('#shelf-open');
  assert.equal(a.query('#shelf-overlay [aria-current="true"]').dataset.shelf, 'shapes');
  const html = fs.readFileSync(path.join(root, 'shapes.html'), 'utf8');
  assert.match(html, /src="shapes\.js\?v=/); assert.match(html, /href="shapes\.css\?v=/); assert.doesNotMatch(html, /shapes-stub/);
  assert.ok(!fs.existsSync(path.join(root, 'shapes-stub.js')), 'the phase-2 stub is deleted');
  const { files } = require('./stage-little-patterns.cjs');
  for (const f of ['shapes.html', 'shapes.js', 'shapes.css']) assert.ok(files.includes(f), f + ' ships');
  assert.ok(!files.includes('shapes-stub.js'));
});

test('a tap counts a side once: the point goes through the screen matrix, the nearest side within 22 CSS pixels lights amber with tag 1 and says ONE; the same side again only bumps its tag; far from every side nothing happens', async t => {
  const a = app(t);
  const r = L.shapeRound(0, p, 1, 'sides'), pts = r.points;
  // 2 CSS pixels per unit, so 22 px is 11 units
  a.tap(...offSide(pts, 0, 11.6)); await tick();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [], '23 px away is too far');
  assert.equal(a.query('#status').textContent, 'Tap on a side of the shape.');
  a.tap(...offSide(pts, 0, -10.4)); await tick();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0], '21 px inside counts');
  assert.equal(a.all('.big-shape .side.lit').length, 1);
  assert.ok(a.query('.big-shape .side.lit').classList.contains('fresh'), 'the new side fills from corner to corner');
  assert.deepEqual(tags(a), [[0, 1]]);
  assert.ok(a.query('.tag[data-tag="0"]').classList.contains('fresh'));
  assert.equal(a.plays.at(-1), a.clip('ONE'), 'the number is spoken from its bundled clip');
  assert.equal(a.query('#status').textContent, 'Side 1.');
  const n = a.plays.length;
  a.tap(...offSide(pts, 0, 2)); await tick();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0], 'never counted twice');
  assert.ok(a.query('.tag[data-tag="0"]').classList.contains('bump'), 'the tag bumps');
  assert.equal(a.plays.length, n, 'silently');
  assert.equal(a.query('#status').textContent, 'That side is counted: 1.');
  a.tap(120, 140); await tick();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0], 'the middle of the shape is no side');
  assert.equal(a.query('.shape-stage').getAttribute('aria-label'), 'The shape. Tap each side to count it. 1 counted.');
});

test('tags follow tap order; when every side is lit the shape warms; the answers were there all along', async t => {
  const a = app(t, place(2, 'sides', 'pentagon#house'));
  const pts = roundAt(2, 'sides', 'pentagon#house').points;
  for (const i of [3, 0, 4]) a.tap(...offSide(pts, i, 4));
  await tick();
  assert.deepEqual(tags(a), [[3, 1], [0, 2], [4, 3]], 'numbered in the order tapped');
  assert.equal(a.query('svg.big-shape').classList.contains('warm'), false);
  assert.equal(a.all('[data-choice]').length, 3);
  for (const i of [1, 2]) a.tap(...offSide(pts, i, 4));
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [3, 0, 4, 1, 2]);
  assert.ok(a.query('svg.big-shape').classList.contains('warm'), 'every side lit: the fill warms');
  assert.ok(a.query('.big-shape .fill').classList.contains('warming'));
  assert.match(a.query('#status').textContent, /Every side is counted: 5/);
  assert.equal(a.plays.at(-1), a.clip('FIVE'));
});

test('Help taps the next uncounted side, round the shape from the last one counted, one side a press (quicker presses wait 700 ms each); once every side is lit Help outlines the answer', t => {
  const a = app(t, place(2, 'sides', 'hexagon#slanted'));
  const pts = roundAt(2, 'sides', 'hexagon#slanted').points;
  const counted = () => a.store('shapes-rounds').sides.counted;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    a.tap(...offSide(pts, 2, 0));
    a.click('#help');
    assert.deepEqual(counted(), [2, 3], 'the next side round the shape, at once');
    assert.equal(a.plays.at(-1), a.clip('TWO'), 'and its number said');
    t.mock.timers.tick(5000);
    assert.deepEqual(counted(), [2, 3], 'one press, one side: nothing counts on its own');
    a.click('#help'); a.click('#help');
    assert.deepEqual(counted(), [2, 3, 4], 'a press counts at once');
    t.mock.timers.tick(699);
    assert.deepEqual(counted(), [2, 3, 4], 'a quick second press waits its turn');
    t.mock.timers.tick(1);
    assert.deepEqual(counted(), [2, 3, 4, 5], '700 ms later');
    a.tap(...offSide(pts, 1, 0));
    assert.deepEqual(counted(), [2, 3, 4, 5, 1], 'the child counts alongside');
    t.mock.timers.tick(700);
    a.click('#help');
    assert.deepEqual(counted(), [2, 3, 4, 5, 1, 0], 'round the shape to the last side left');
    assert.deepEqual(tags(a).map(([, k]) => k), [1, 2, 3, 4, 5, 6]);
    assert.equal(a.all('.answer.hint').length, 0, 'counting comes first; nothing outlined yet');
    a.click('#help');
    t.mock.timers.tick(700);
    assert.deepEqual(a.all('.answer.hint').map(b => b.dataset.choice), ['6'], 'with every side lit, the next press outlines the answer');
    assert.equal(a.store('shapes-rounds').sides.hint, 2);
    assert.equal(a.store('shapes-rounds').sides.done, false, 'Help never answers for the child');
    // Next drops any press still waiting
    a.click('[data-choice="6"]'); a.click('#next');
    a.click('#help'); a.click('#help'); a.click('#next');
    const fresh = counted().slice();
    t.mock.timers.tick(2000);
    assert.deepEqual(counted(), fresh, 'a waiting press never reaches the next shape');
  } finally { t.mock.timers.reset(); }
});

test('the shape is a button for a keyboard, a switch or a screen reader: Enter, Space or a click without a point counts the next side', t => {
  const a = app(t);
  const stage = a.query('.shape-stage');
  assert.equal(stage.getAttribute('role'), 'button'); assert.equal(stage.getAttribute('tabindex'), '0');
  stage.focus();
  stage.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  stage.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true }));
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0], 'key repeat ignored');
  a.query('.shape-stage').click();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0, 1]);
  assert.equal(a.w.document.activeElement, a.query('.shape-stage'), 'focus stays on the shape');
});

test('a wrong number changes only the bubble; the right one locks the round: green with a tick, the others faded, Nook excited, holding the shape up beside its raised mitten (the pay-off), the success line, the whole shape counted and warm', async t => {
  const a = app(t, place(2, 'sides', 'pentagon#upright'));
  const r = roundAt(2, 'sides', 'pentagon#upright');
  a.click('[data-choice="' + r.choices.find(c => c !== 5) + '"]'); await wait(300);
  assert.ok(L.FEEDBACK.retries.includes(a.query('#speech').textContent), 'a kind retry line');
  assert.equal(a.plays.at(-1), a.clip(a.query('#speech').textContent), 'said from its clip');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'no Nook motion for a mistake');
  assert.ok(!a.query('#nook .nook-pos').classList.contains('nook-hop'));
  assert.equal(a.query('#nook .nook-prop'), null, 'no pay-off for a mistake');
  assert.equal(a.all('[data-choice]:disabled').length, 0);
  a.tap(...offSide(r.points, 0, 0));
  a.click('[data-choice="5"]'); await wait(400);
  const saved = a.store('shapes-rounds').sides;
  assert.equal(saved.done, true);
  assert.deepEqual(saved.counted, [0, 1, 2, 3, 4], 'the rest of the count is shown once it is won');
  assert.deepEqual(tags(a).map(([, k]) => k), [1, 2, 3, 4, 5]);
  assert.ok(a.query('svg.big-shape').classList.contains('warm'));
  assert.ok(a.query('[data-choice="5"]').classList.contains('chosen'));
  assert.equal(a.all('.answer.faded').length, 2);
  assert.equal(a.all('[data-choice]:disabled').length, 3, 'success locks the answers');
  const line = L.successLine('shapes', { ...r, done: true });
  assert.equal(a.query('#speech').textContent, line.text);
  assert.match(line.text, /A pentagon has five sides\./);
  assert.equal(a.plays.at(-1), a.clip(line.speech[0]), 'the line starts from the answering tap (the second part follows when the first ends)');
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'excited', 'both mittens up');
  assert.ok(a.query('#nook .nook-prop svg.shape-icon'), 'Nook holds the shape up: a small copy hops beside the raised mitten (round 4 item 33)');
  assert.ok(!a.query('#nook .nook-pos').classList.contains('nook-hop'), 'the shape hops instead of Nook');
  assert.equal(a.query('#help').hidden, true); assert.equal(a.query('#repeat').hidden, false); assert.equal(a.query('#next').hidden, false);
  assert.equal(a.w.document.activeElement, a.query('#next'));
  assert.equal(a.all('.big-shape .hit').length, 0, 'nothing left to tap');
  a.tap(...offSide(r.points, 1, 0));
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0, 1, 2, 3, 4]);
  a.click('[data-choice="4"]');
  assert.equal(a.query('#speech').textContent, line.text, 'a finished round ignores further answers');
});

test('Name: word answers only; Help shows a small picture of each shape beside its word, then outlines the answer; success locks', async t => {
  const a = app(t, place(2, 'name', 'hexagon#uneven'));
  const r = roundAt(2, 'name', 'hexagon#uneven');
  assert.deepEqual(a.all('#modes .chip').map(b => b.getAttribute('aria-pressed')), ['false', 'true']);
  assert.equal(a.query('#speech').textContent, 'Which shape is this?');
  assert.equal(a.all('.big-shape .side, .big-shape .hit, .big-shape .tag').length, 0, 'nothing to count in Name');
  assert.ok(a.query('.big-shape .outline'));
  assert.equal(a.query('.shape-stage').getAttribute('role'), 'img');
  assert.doesNotMatch(a.query('.shape-stage').getAttribute('aria-label'), /hexagon/i, 'the label never gives the name away');
  assert.deepEqual(a.all('[data-choice]').map(b => b.textContent), r.choices);
  assert.equal(a.all('[data-choice] svg, [data-choice] img, [data-choice] .pic').length, 0, 'words only');
  a.click('#help');
  assert.equal(a.all('[data-choice] .pic svg.shape-icon').length, 3, 'step 1: a picture beside each word');
  assert.deepEqual(a.all('[data-choice] .word').map(s => s.textContent), r.choices, 'the words stay');
  assert.equal(a.all('.answer.hint').length, 0);
  a.click('#help');
  assert.deepEqual(a.all('.answer.hint').map(b => b.dataset.choice), ['HEXAGON'], 'step 2: the answer outlined');
  a.click('[data-choice="' + r.choices.find(c => c !== 'HEXAGON') + '"]');
  assert.ok(L.FEEDBACK.retries.includes(a.query('#speech').textContent));
  a.click('[data-choice="HEXAGON"]'); await wait(400);
  assert.match(a.query('#speech').textContent, /It’s a hexagon!/);
  assert.ok(a.query('[data-choice="HEXAGON"]').classList.contains('chosen'));
  assert.equal(a.all('[data-choice]:disabled').length, 3);
  assert.equal(a.all('[data-choice] .pic').length, 0, 'the finished row is the words again');
  assert.ok(a.query('svg.big-shape').classList.contains('warm'), 'the shape warms');
  assert.ok(['excited', 'proud'].includes(a.query('#nook svg.nook').getAttribute('data-feeling')));
  // circles and ovals are Name-only and drawn as ellipses
  const b = app(t, place(1, 'name', 'oval#tilted'));
  assert.ok(b.query('.big-shape ellipse.outline[transform="rotate(-30 120 120)"]'));
  assert.ok(!b.all('[data-choice]').some(x => x.dataset.choice === 'CIRCLE'), 'never CIRCLE with an oval at level 1');
  assert.equal(b.query('#support').textContent, 'Shapes 1');
});

test('Again starts the same shape fresh and Next moves on; Nook rests again; each mode keeps its own round', async t => {
  const a = app(t);
  a.tap(...offSide(L.shapeRound(0, p, 1, 'sides').points, 0, 0));
  a.click('[data-shapes-mode="name"]');
  assert.equal(a.w.location.hash, '#name');
  assert.equal(a.query('#speech').textContent, 'Which shape is this?');
  a.click('[data-shapes-mode="sides"]');
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [0], 'Sides kept its count across the switch');
  a.click('[data-choice="3"]'); await wait(400);
  a.click('#repeat');
  assert.equal(a.store('shapes-rounds').sides.id, 'shapes:v2:L1:sides:triangle#up', 'Again: the same shape');
  assert.deepEqual(a.store('shapes-rounds').sides.counted, []); assert.equal(a.store('shapes-rounds').sides.done, false);
  await wait(300);
  assert.equal(a.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'Nook rests for the fresh round');
  a.click('[data-choice="3"]'); await wait(50);
  a.click('#next');
  assert.equal(a.store('shapes-position').indices.sides, 1);
  assert.equal(a.store('shapes-rounds').sides.id, L.shapeRound(1, p, 1, 'sides').id, 'Next: the next shape in the mixed order');
  assert.equal(a.query('#help').hidden, false); assert.equal(a.query('#next').hidden, true);
});

test('the pill opens the level chooser: Shapes 1 and Shapes 2, every level open; a choice changes both modes, and the place, level and rounds are saved and restored by id', t => {
  const a = app(t);
  a.click('#support');
  assert.equal(a.query('#dialog-title').textContent, 'Choose the shapes');
  assert.deepEqual(a.all('.shape-levels [data-level]').map(b => [b.dataset.level, b.getAttribute('aria-pressed')]), [['1', 'true'], ['2', 'false']]);
  assert.equal(a.all('.shape-levels [data-level="2"] .shape-icon').length, 2, 'pentagon and hexagon pictures');
  a.click('.shape-levels [data-level="2"]');
  assert.equal(a.query('.lp-modal'), null, 'the chooser closes');
  assert.equal(a.query('#support').textContent, 'Shapes 2');
  assert.equal(a.store('shapes-position').level, 2);
  assert.match(a.store('shapes-rounds').sides.id, /^shapes:v2:L2:sides:/); assert.match(a.store('shapes-rounds').name.id, /^shapes:v2:L2:name:/);
  // restore: a fresh page for the same player comes back to the same place, count and Help step
  const id = L.shapeRound(3, p, 2, 'sides').id;
  const seed = { [P + 'shapes-position']: { mode: 'sides', level: 2, indices: { sides: 3, name: 5 } }, [P + 'shapes-rounds']: { sides: { id, counted: [1, 0, 1, 9, -1, 'x'], hint: 2, done: false }, name: { id: 'shapes:v2:L2:name:circle#nope', counted: [], hint: 1, done: true } } };
  const b = app(t, seed);
  assert.equal(b.store('shapes-rounds').sides.id, id);
  assert.deepEqual(b.store('shapes-rounds').sides.counted, [1, 0], 'counted sides restored, the invalid ones dropped');
  assert.deepEqual(tags(b), [[1, 1], [0, 2]]);
  assert.equal(b.all('.answer.hint').length, 1, 'the Help step is kept');
  b.click('[data-shapes-mode="name"]');
  assert.equal(b.store('shapes-rounds').name.id, L.shapeRound(5, p, 2, 'name').id);
  assert.equal(b.store('shapes-rounds').name.done, false, 'a saved round with another id starts fresh');
  // a finished Sides round comes back finished, every side tagged, without replaying anything
  const done = { [P + 'shapes-position']: { mode: 'sides', level: 1, indices: { sides: 0 } }, [P + 'shapes-rounds']: { sides: { id: 'shapes:v2:L1:sides:triangle#up', counted: [1], hint: 0, done: true } } };
  const c = app(t, done);
  assert.deepEqual(c.store('shapes-rounds').sides.counted, [1, 2, 0]);
  assert.ok(c.query('[data-choice="3"]').classList.contains('chosen'));
  assert.equal(c.query('#speech').textContent, L.successLine('shapes', { ...L.shapeRound(0, p, 1, 'sides'), done: true }).text);
  assert.equal(c.plays.length, 0, 'nothing replays on load');
  assert.equal(c.query('#nook svg.nook').getAttribute('data-feeling'), 'rest', 'Nook celebrates only in play, not on a reload');
  // a broken save falls back to the start
  const d = app(t, { [P + 'shapes-position']: { mode: 'paint', level: 7, indices: { sides: -4 } }, [P + 'shapes-rounds']: 'nonsense' });
  assert.equal(d.store('shapes-rounds').sides.id, 'shapes:v2:L1:sides:triangle#up');
  assert.equal(d.query('#support').textContent, 'Shapes 1');
});

test('the shape view converts a pointer through its box when there is no screen matrix, using the viewBox fit', t => {
  const a = app(t);
  const S = a.w.LPShapes, toUser = (...args) => { const u = S.toUser(...args); return u && { ...u }; };  // a plain object from the page's realm
  assert.equal(S.HIT_PX, 22);
  const fake = { getScreenCTM: () => null, getBoundingClientRect: () => ({ left: 10, top: 20, width: 576, height: 288 }) };
  // meet: 288 units into 288 px high, centred across 576 px wide (144 px each side)
  assert.deepEqual(toUser(fake, 10 + 144 + 24 + 120, 20 + 24 + 120), { x: 120, y: 120, scale: 1 });
  assert.deepEqual(toUser({ getScreenCTM: () => ({ a: 0, b: 2, c: -2, d: 0, e: 300, f: 10 }) }, 300 - 2 * 30, 10 + 2 * 50), { x: 50, y: 30, scale: 2 }, 'a turned matrix inverts too');
  assert.equal(toUser({ getScreenCTM: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }, 1, 1), null, 'nothing drawn: no tap');
});

test('sound: with sound off in Grown-ups nothing plays, and the count still works; nothing reaches the network', async t => {
  const a = app(t, {}, true);
  a.w.LP.setSound(false);
  a.tap(...offSide(L.shapeRound(0, p, 1, 'sides').points, 1, 0)); await tick();
  assert.deepEqual(a.store('shapes-rounds').sides.counted, [1]);
  a.click('[data-choice="3"]'); await tick();
  assert.equal(a.plays.length, 0);
});

test('shapes.css keeps the motion limits: scale at most 1.06, no travel, and Softer and reduced motion keep only the colour changes', () => {
  const css = fs.readFileSync(path.join(root, 'shapes.css'), 'utf8');
  for (const m of css.matchAll(/scale\(([\d.]+)\)/g)) assert.ok(+m[1] <= 1.06, m[0]);
  assert.doesNotMatch(css, /translate/, 'nothing travels');
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion:reduce)'));
  for (const block of [reduced, css.slice(css.indexOf('/* Softer'))]) for (const sel of ['.side.lit.fresh', '.tag.fresh', '.tag.bump', '.fill.warming']) assert.ok(block.includes(sel) && /animation:none/.test(block), sel);
  assert.match(css, /\.big-shape \.hit\{[^}]*stroke-width:44px;vector-effect:non-scaling-stroke/, 'each side carries a 44 CSS-pixel hit stroke');
});
