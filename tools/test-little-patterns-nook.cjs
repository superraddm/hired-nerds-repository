// Nook rig (round 4, phase 1): nook-art.js renders every state from one traced geometry with one pivot convention.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('../.wrangler/test-runtime/node_modules/jsdom');
const root = path.join(__dirname, '../public/fireworks/little-patterns');
const N = require('../public/fireworks/little-patterns/nook-art.js');
const CSS = fs.readFileSync(path.join(root, 'nook.css'), 'utf8');
const TEN = ['calm', 'happy', 'sad', 'angry', 'worried', 'excited', 'proud', 'surprised', 'frustrated', 'disappointed'];

const dom = new JSDOM('<!doctype html><body></body>');
const parse = markup => {
  const doc = new dom.window.DOMParser().parseFromString(markup, 'image/svg+xml');
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'well-formed SVG');
  return doc.documentElement;
};
const all = (el, sel) => Array.from(el.querySelectorAll(sel));
const fixed = el => ({ body: el.querySelector('.nook-body').getAttribute('d'), patch: el.querySelector('.nook-patch').getAttribute('d'), freckles: el.querySelector('.nook-freckles').outerHTML, feet: el.querySelector('.nook-feet').outerHTML });
// the eyes (inside .nook-lid) and the mouth of a rendered face
const eyes = el => all(el, '.nook-lid').map(g => g.innerHTML).join('|');
const mouth = el => el.querySelector('.nook-mouth').innerHTML;

// minimal path sampler for the M/C/Z paths the rig uses
function sample(d, steps = 8) {
  const n = d.match(/-?\d*\.?\d+/g).map(Number), pts = [];
  let x = n[0], y = n[1];
  for (let i = 2; i + 5 < n.length + 0; i += 6) {
    const c = n.slice(i, i + 6);
    for (let k = 1; k <= steps; k++) {
      const t = k / steps, m = 1 - t;
      pts.push([m * m * m * x + 3 * m * m * t * c[0] + 3 * m * t * t * c[2] + t * t * t * c[4], m * m * m * y + 3 * m * m * t * c[1] + 3 * m * t * t * c[3] + t * t * t * c[5]]);
    }
    x = c[4]; y = c[5];
  }
  return pts;
}
const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const rot = (p, deg) => { const a = deg * Math.PI / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; };
// the visible front mitten of one arm, in the body's coordinates
function frontMitten(el, side) {
  const g = el.querySelector('.nook-arm-front.nook-arm-' + side), m = /rotate\((-?[\d.]+)deg\) translate\(0px,(-?[\d.]+)px\) rotate\((-?[\d.]+)deg\)/.exec(g.getAttribute('style'));
  const shape = all(g, '.nook-mitten').find(s => /opacity:\s*1/.test(s.getAttribute('style')));
  if (!shape) return [];
  const s = N.SHOULDER[side];
  return sample(shape.querySelector('path').getAttribute('d')).map(p => { const a = rot(p, +m[3]); const b = rot([a[0], a[1] + +m[2]], +m[1]); return [b[0] + s[0], b[1] + s[1]]; });
}

test('the module runs under Node and exports the ten feelings plus the greeting', () => {
  assert.deepEqual(N.FEELINGS, TEN);
  assert.deepEqual(N.STATES, TEN.concat('greet'));
  for (const k of ['svg', 'face', 'change', 'idle']) assert.equal(typeof N[k], 'function', k);
  assert.equal(typeof N.COLOURS.body, 'string');
});

test('every state renders well-formed SVG in the 560x672 frame with its data-feeling', () => {
  for (const f of N.STATES) {
    const el = parse(N.svg(f));
    assert.equal(el.tagName, 'svg');
    assert.equal(el.getAttribute('viewBox'), '0 0 560 672');
    assert.equal(el.getAttribute('data-feeling'), f);
    assert.match(el.getAttribute('class'), /^nook\b/);
  }
  assert.equal(parse(N.svg('nonsense')).getAttribute('data-feeling'), 'calm', 'unknown feelings fall back to calm');
  assert.equal(parse(N.svg('happy', { className: 'big' })).getAttribute('class'), 'nook big');
});

test('accessible name: a labelled image by default, hidden when decorative, labels are escaped', () => {
  const a = parse(N.svg('sad'));
  assert.equal(a.getAttribute('role'), 'img');
  assert.equal(a.getAttribute('aria-label'), 'Nook feels sad');
  assert.equal(parse(N.svg('greet')).getAttribute('aria-label'), 'Nook waves hello');
  const d = parse(N.svg('sad', { decorative: true }));
  assert.equal(d.getAttribute('aria-hidden'), 'true');
  assert.equal(d.hasAttribute('role'), false);
  assert.equal(parse(N.svg('calm', { label: 'Nook <says> "hi" & waves' })).getAttribute('aria-label'), 'Nook <says> "hi" & waves');
  assert.equal(parse(N.face('proud')).getAttribute('aria-hidden'), null);
  assert.equal(parse(N.face('proud', { decorative: true })).getAttribute('aria-hidden'), 'true');
});

test('the face crop is the actual patch with a lavender rim, the same features, and no body', () => {
  for (const f of N.STATES) {
    const face = parse(N.face(f)), body = parse(N.svg(f));
    assert.equal(face.getAttribute('data-feeling'), f);
    assert.equal(face.querySelector('.nook-patch').getAttribute('d'), body.querySelector('.nook-patch').getAttribute('d'), 'same patch path');
    assert.equal(face.querySelector('.nook-rim').getAttribute('d'), body.querySelector('.nook-patch').getAttribute('d'), 'the rim follows the patch');
    assert.equal(face.querySelector('.nook-body'), null, 'no body path');
    assert.equal(face.querySelectorAll('.nook-arm, .nook-feet, .nook-leaf, .nook-pose').length, 0);
    assert.equal(face.querySelector('.nook-features').innerHTML, body.querySelector('.nook-features').innerHTML, 'same features as the full body');
    assert.equal(face.querySelectorAll('.nook-freckles circle').length, 6);
    assert.equal(face.querySelector('.nook-rim').getAttribute('fill'), N.COLOURS.body);
  }
  assert.equal(parse(N.face('calm', { ring: true })).querySelector('.nook-rim').getAttribute('fill'), N.COLOURS.ring, 'a neutral ring for Me');
  assert.equal(parse(N.face('calm', { ring: '#777777' })).querySelector('.nook-rim').getAttribute('stroke'), '#777777');
});

test('transform tree: breath on the svg only, feet outside the pose, pose and idle groups distinct and nested', () => {
  const el = parse(N.svg('sad'));
  const pose = el.querySelector('.nook-pose'), squash = el.querySelector('.nook-squash');
  assert.ok(pose && squash && pose !== el);
  assert.ok(pose.contains(squash) && squash !== pose, 'the change squash sits inside the pose group');
  assert.equal(pose.querySelector('.nook-feet'), null, 'feet are not posed');
  assert.ok(el.querySelector('.nook-feet').parentNode === el, 'feet sit directly under the svg');
  for (const side of ['l', 'r']) {
    const leaf = el.querySelector('.nook-leaf-' + side), follow = el.querySelector('.nook-follow-' + side);
    assert.ok(leaf.contains(follow) && leaf !== follow, 'leaf follow-through nests inside the leaf pose');
    assert.ok(squash.contains(leaf));
    assert.equal(all(el, '.nook-arm-' + side).length, 2, 'one back and one front arm group per side');
    for (const arm of all(el, '.nook-arm-' + side)) assert.ok(squash.contains(arm), 'arms move with the body');
  }
  assert.equal(all(el, '.nook-lid').length, 2, 'two eye lids for blinks');
  // nook.css: the breath keyframes are applied to svg.nook and nothing else
  const uses = CSS.match(/[^{}]+\{[^{}]*nook-breathe[^{}]*\}/g).filter(r => !/@keyframes/.test(r));
  assert.ok(uses.length >= 1);
  for (const rule of uses) assert.match(rule.trim(), /^svg\.nook\s*\{/);
});

test('one pivot convention: translate() wrappers only, no centred rotate, no transform-origin in the markup', () => {
  const animated = ['nook-pose', 'nook-squash', 'nook-arm', 'nook-leaf', 'nook-follow', 'nook-lid', 'nook-mitten'];
  for (const f of N.STATES) {
    for (const markup of [N.svg(f), N.svg(f, { grain: true }), N.face(f)]) {
      const el = parse(markup);
      for (const node of [el, ...all(el, '*')]) {
        const t = node.getAttribute('transform'), style = node.getAttribute('style') || '';
        if (t) assert.match(t, /^translate\(-?[\d.]+ -?[\d.]+\)$/, f + ': transform attributes are plain translates: ' + t);
        assert.doesNotMatch(style, /transform-origin/, 'no transform-origin in the markup');
        assert.ok(!(t && /transform-origin/.test(style)), 'never both');
        const cls = (node.getAttribute('class') || '').split(' ');
        if (cls.some(c => animated.includes(c))) assert.equal(t, null, 'animated groups have no transform attribute: ' + cls.join(' '));
      }
    }
  }
  // nook.css pins the origin of every group to its wrapper's 0 0 and never animates path data
  assert.match(CSS, /svg\.nook g\s*\{\s*transform-box:\s*view-box;\s*transform-origin:\s*0 0;\s*\}/);
  assert.doesNotMatch(CSS, /(^|[;{\s])d\s*:/, 'no CSS d property (Safari 16 cannot animate path data)');
  assert.doesNotMatch(N.svg('happy', { grain: true }) + N.face('happy'), /<filter|feTurbulence|feDisplacement/, 'no SVG filters');
});

test('the canonical geometry does not wobble: body, patch, freckles, feet and leaves are identical in every state', () => {
  const ref = fixed(parse(N.svg('greet')));
  const leaves = parse(N.svg('greet')).querySelectorAll('.nook-follow');
  for (const f of N.STATES) {
    const el = parse(N.svg(f));
    assert.deepEqual(fixed(el), ref, f);
    assert.equal(all(el, '.nook-freckles circle').length, 6, 'six freckles');
    assert.equal(all(el, '.nook-leaf').length, 2, 'two leaves');
    assert.deepEqual(all(el, '.nook-follow').map(g => g.innerHTML), Array.from(leaves).map(g => g.innerHTML), 'leaf shapes are fixed; only their pivot rotates');
    assert.equal(all(el, '.nook-feet path').length, 2, 'two feet');
    for (const side of ['l', 'r']) {
      const shown = all(el, '.nook-arm-' + side + ' .nook-mitten').filter(s => /opacity:\s*1/.test(s.getAttribute('style')));
      assert.equal(shown.length, 1, f + ': exactly one mitten shape shows per arm');
    }
  }
});

test('faces: every state has its own eyes-and-mouth, and the four happy-side faces differ by eyes and by mouth', () => {
  const faces = N.STATES.map(f => parse(N.face(f)));
  for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) {
    assert.notEqual(eyes(faces[i]) + mouth(faces[i]), eyes(faces[j]) + mouth(faces[j]), N.STATES[i] + ' and ' + N.STATES[j] + ' must not share a face');
  }
  const happySide = ['greet', 'calm', 'happy', 'proud'].map(f => parse(N.face(f)));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    assert.notEqual(eyes(happySide[i]), eyes(happySide[j]), 'eyes differ');
    assert.notEqual(mouth(happySide[i]), mouth(happySide[j]), 'mouths differ');
  }
  for (const [a, b] of [['sad', 'disappointed'], ['angry', 'frustrated'], ['happy', 'excited']]) {
    const x = parse(N.face(a)), y = parse(N.face(b));
    assert.notEqual(mouth(x), mouth(y), a + '/' + b + ' mouths differ');
    assert.notEqual(eyes(x), eyes(y), a + '/' + b + ' eyes differ');
  }
  // brows only where the profile asks for them; never on the greeting, calm, happy or excited
  for (const f of ['greet', 'calm', 'happy', 'excited']) assert.equal(parse(N.svg(f)).querySelector('.nook-brows'), null, f);
  for (const f of ['proud', 'sad', 'worried', 'angry', 'frustrated']) assert.ok(parse(N.svg(f)).querySelector('.nook-brows'), f);
});

test('the palette is the profile\'s and feelings never recolour Nook', () => {
  assert.deepEqual([N.COLOURS.body, N.COLOURS.face, N.COLOURS.ink, N.COLOURS.freckle, N.COLOURS.mitten, N.COLOURS.leaf, N.COLOURS.feet], ['#9776CD', '#F7ECD8', '#2A2964', '#EF8668', '#46CAD3', '#95DCA0', '#614591']);
  const palette = new Set(Object.values(N.COLOURS));
  for (const f of N.STATES) {
    for (const c of N.svg(f).match(/#[0-9A-Fa-f]{6}/g)) assert.ok(palette.has(c), f + ' uses ' + c);
    const el = parse(N.svg(f));
    assert.equal(el.querySelector('.nook-body').getAttribute('fill'), N.COLOURS.body);
    for (const m of all(el, '.nook-mitten path')) assert.equal(m.getAttribute('fill'), N.COLOURS.mitten);
    for (const p of all(el, '.nook-features path')) assert.equal(p.getAttribute('fill') === 'none' ? p.getAttribute('stroke') : p.getAttribute('fill'), N.COLOURS.ink, f + ': features are navy');
  }
});

test('no mitten in front of the body crosses the eyes, the mouth or the patch', () => {
  const patch = sample(parse(N.svg('calm')).querySelector('.nook-patch').getAttribute('d'));
  for (const f of N.STATES) {
    const el = parse(N.svg(f));
    // the eyes and the mouth lie inside the patch, so a mitten clear of the patch is clear of them too
    for (const g of all(el, '.nook-lid')) assert.ok(inside(g.parentNode.getAttribute('transform').match(/-?[\d.]+/g).map(Number), patch), f + ': eye inside the patch');
    for (const p of all(el, '.nook-mouth path')) for (const q of p.getAttribute('d').match(/-?\d*\.?\d+ -?\d*\.?\d+/g).slice(0, 1)) assert.ok(inside(q.split(' ').map(Number), patch), f + ': mouth inside the patch');
    for (const side of ['l', 'r']) {
      const pts = frontMitten(el, side);
      for (const p of pts) assert.ok(!inside(p, patch), f + ': the ' + side + ' mitten must not cover the patch at ' + p.map(Math.round));
    }
  }
});

test('change() swaps a rendered Nook in place: instant with reduced motion, behind a blink otherwise', async () => {
  const page = new JSDOM('<!doctype html><body><div id="w"></div></body>', { pretendToBeVisual: true });
  const w = page.window;
  let reduce = true;
  w.matchMedia = () => ({ matches: reduce });
  w.document.getElementById('w').innerHTML = N.svg('greet');
  const el = w.document.querySelector('svg.nook');
  assert.equal(N.change(el, 'sad'), 'sad');
  assert.equal(el.getAttribute('data-feeling'), 'sad');
  assert.equal(el.getAttribute('aria-label'), 'Nook feels sad');
  const ds = node => all(node, '.nook-features path').map(p => p.getAttribute('d'));
  assert.deepEqual(ds(el), ds(parse(N.svg('sad'))), 'the sad face is in place');
  assert.equal(el.querySelector('.nook-features path').namespaceURI, 'http://www.w3.org/2000/svg', 'swapped features stay SVG');
  w.document.body.insertAdjacentHTML('beforeend', '<div id="ref">' + N.svg('sad') + '</div>');
  const ref = w.document.querySelector('#ref svg');
  assert.equal(el.querySelector('.nook-pose').style.transform, ref.querySelector('.nook-pose').style.transform);
  for (const g of ['.nook-arm-front.nook-arm-l', '.nook-arm-back.nook-arm-r', '.nook-leaf-l']) assert.equal(el.querySelector(g).style.transform, ref.querySelector(g).style.transform, g);
  ref.parentNode.remove();
  assert.equal(el.classList.contains('nook-swap'), false);
  // with motion: the eyes close first, the face swaps behind the blink, then they open
  reduce = false;
  N.change(el, 'excited');
  assert.ok(el.classList.contains('nook-swap'), 'eyes closing');
  assert.equal(el.getAttribute('data-feeling'), 'sad', 'face not swapped yet');
  assert.match(el.querySelector('.nook-arm-front.nook-arm-l').style.transform, /rotate/, 'arms start moving at once');
  await new Promise(r => setTimeout(r, 130));
  assert.equal(el.getAttribute('data-feeling'), 'excited');
  assert.equal(el.classList.contains('nook-swap'), false);
  assert.ok(el.classList.contains('nook-opening'));
  // a second change before the first finishes wins
  N.change(el, 'calm'); N.change(el, 'proud');
  await new Promise(r => setTimeout(r, 130));
  assert.equal(el.getAttribute('data-feeling'), 'proud');
  // Softer behaves like reduced motion
  w.document.body.classList.add('softer');
  N.change(el, 'worried');
  assert.equal(el.getAttribute('data-feeling'), 'worried');
  page.window.close();
});

test('idle(): blinks are scheduled with timers, rest while the page is hidden, and stop cleanly', () => {
  const page = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const w = page.window, d = w.document;
  d.body.innerHTML = N.svg('greet');
  const el = d.querySelector('svg.nook');
  let hidden = false;
  Object.defineProperty(d, 'hidden', { configurable: true, get: () => hidden });
  const idle = N.idle(el);
  assert.equal(typeof idle.stop, 'function');
  hidden = true; d.dispatchEvent(new w.Event('visibilitychange'));
  assert.ok(el.classList.contains('nook-still'), 'hidden page: idle rests');
  hidden = false; d.dispatchEvent(new w.Event('visibilitychange'));
  assert.equal(el.classList.contains('nook-still'), false, 'visible again: idle resumes');
  idle.stop();
  hidden = true; d.dispatchEvent(new w.Event('visibilitychange'));
  assert.equal(el.classList.contains('nook-still'), false, 'listeners removed after stop');
  page.window.close();
});

test('nook.css: Softer and reduced motion remove idle, travel and squash; wrapper keyframes are defined', () => {
  for (const k of ['nook-hop', 'nook-hop-high', 'nook-squash-once', 'nook-grow', 'nook-fade-in', 'nook-breathe', 'nook-change-squash', 'nook-follow-l', 'nook-follow-r']) assert.match(CSS, new RegExp('@keyframes ' + k + '\\s*\\{'), k);
  const reduced = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(reduced.length > 20, 'a reduced-motion block');
  for (const block of [reduced, CSS.slice(CSS.indexOf('/* Softer'))]) {
    for (const sel of ['svg.nook', '.nook-hop', '.nook-hop-high', '.nook-squash-once', '.nook-grow', '.nook-return', '.nook .nook-squash']) assert.ok(block.includes(sel), 'covers ' + sel);
    assert.match(block, /animation:\s*none/);
    assert.match(block, /transition:\s*none/);
  }
  // limits from the motion table: hops of 8 and 10 px, squash no deeper than .95, breath 1.015
  assert.match(CSS, /translateY\(-8px\)/); assert.match(CSS, /translateY\(-10px\)/);
  assert.match(CSS, /scaleY\(1\.015\)/);
  for (const m of CSS.matchAll(/scale\(([\d.]+),\s*([\d.]+)\)/g)) { assert.ok(+m[1] <= 1.06 && +m[2] >= 0.95, m[0]); }
});

test('optional grain: a uniquely named tiled pattern per Nook, no filters, same geometry', () => {
  const a = N.svg('calm', { grain: true }), b = N.svg('calm', { grain: true });
  const id = s => /<pattern id="([^"]+)"/.exec(s)[1];
  assert.notEqual(id(a), id(b), 'two Nooks on one page never share a pattern id');
  const geo = x => { const g = fixed(x); delete g.feet; return g; };
  assert.deepEqual(geo(parse(a)), geo(parse(N.svg('calm'))));
  assert.doesNotMatch(N.svg('calm'), /<pattern/, 'untextured by default');
});

test('the shipped geometry is the traced geometry (trace-nook.py output)', () => {
  const traced = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/little-patterns-round-4/build/character/trace.json'), 'utf8')).paths;
  const src = fs.readFileSync(path.join(root, 'nook-art.js'), 'utf8');
  const names = { body: 'body', patch: 'patch', footL: 'footL', footR: 'footR', leafL: 'leafL', leafR: 'leafR', rest: 'mittenFront', raised: 'mittenRaised', hand: 'mittenHand' };
  for (const [key, name] of Object.entries(names)) assert.equal(new RegExp('\n    ' + key + ": '([^']*)'").exec(src)[1], traced[name], key);
  const el = parse(N.svg('greet'));
  assert.equal(el.querySelector('.nook-body').getAttribute('d'), traced.body);
  assert.equal(el.querySelector('.nook-patch').getAttribute('d'), traced.patch);
});
