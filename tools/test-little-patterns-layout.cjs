// Layout harness for Little Patterns (round 4): the shelf and the Nook frame at eight viewports, in headless Chrome
// over the DevTools protocol (Node 22's global fetch and WebSocket), against `node tools/serve-fireworks.cjs`.
//
//   node --test tools/test-little-patterns-layout.cjs           check every scenario at every viewport
//   LP_SHOTS=<dir> node --test tools/test-little-patterns-layout.cjs
//                                                               also write <viewport>-<scenario>.png for the evidence
//                                                               scenarios (LP_SHOTS_ALL=1: every scenario)
//   LP_ONLY=add,words  LP_VIEWPORTS=small,land                  limit a run
//
// Fails on: an uncaught exception or unhandled rejection in the page; page overflow; content clipped inside the task card (the card scrolling, or anything outside it);
// truncated caption, answer, tile, key, card, feeling-card, sub-menu tile, level tile, performance-word and action labels; an answer or key over Nook; and any visible
// tappable control under 44 by 44 CSS pixels. Phase 9 (navigation proposal 2): the six sub-menus on the hub and the caption on every play screen run at
// every size; a sub-menu's activity tile under 120 px tall, a level tile clipped, off screen or scrolled out of view, the Grown-ups button over any tile,
// a caption over the shelf link or off screen, and a top-left control that is not the same back arrow in exactly the same place on the play screens
// and the sub-menus (phase 9b; compared across pages at each size) are problems too. Test state is seeded from the hub page, never the game page (a game saves on pagehide). Skips with a message when Chrome is not
// installed. Colour Blocks is a page that scrolls (scroll: true allows a page taller than the window, never wider).
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => p && fs.existsSync(p));
// CSS pixels: S24 Ultra portrait (412 x 860 inside Chrome), a small Android phone, S24 landscape with Chrome's bar,
// a smaller landscape phone, iPad 5 landscape in Safari, a desktop window, and (phase 7, from Jof's proofing) a tall
// desktop pane (a VS Code browser pane taller than wide) and the iPad held upright; since phase 9c (Jof's S24 test,
// PROOFING-LOG item 12) the S24 held sideways in Chrome with the address bar and the Android gesture bar showing
// (891 x 340) and a little shorter still (891 x 320).
const VIEWPORTS = { phone: [412, 860, 2, true], small: [360, 740, 2, true], land: [915, 356, 2, true], land2: [740, 360, 2, true], 's24-land': [891, 340, 2, true], 's24-land-short': [891, 320, 2, true], ipad: [1024, 698, 1, true], desk: [1280, 800, 1, false], tall: [1380, 1600, 1, false], 'ipad-portrait': [768, 1024, 2, true] };
const P = 'lp-player-player-1-';
const position = extra => ({ [P + 'garden-position']: { mode: 'count', wordTab: 'sentence', indices: {}, selection: {}, levels: {}, operation: 'add', patternMode: 'finish', patternFamily: 2, strip: 1, spell: 1, ...extra } });
const prefs = p => ({ [P + 'little-patterns-v1']: p });
const click = sel => `document.querySelector(${JSON.stringify(sel)}).click()`;
const keys = word => Array.from(word).map(c => click(`[data-key="${c}"]`)).join(';');
// Shapes: a seeded place in a level and mode, chosen by the example's name; taps land 6 px off the middle of each
// side, through the element under that point, so the real pointer path (screen matrix, 22 px radius) is exercised.
const L = require('../public/fireworks/little-patterns/learning.js');
const shapes = (level, mode, example) => { const i = L.shapeSequence(level, mode).findIndex(([s, v]) => s + '#' + v === example); if (i < 0) throw Error('no ' + example); return { [P + 'shapes-position']: { mode, level, indices: { [mode]: i } } }; };
const tapSides = n => `(()=>{for(let k=0;k<${n};k++){const svg=document.querySelector('svg.big-shape'),m=svg.getScreenCTM(),h=document.querySelectorAll('.big-shape .hit')[k];if(!h)break;const q=h.getPointAtLength(h.getTotalLength()/2),x=m.a*q.x+m.c*q.y+m.e+4,y=m.b*q.x+m.d*q.y+m.f+4;document.elementFromPoint(x,y).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y,detail:1}));}})()`;
const answer = (level, mode, example) => { const i = L.shapeSequence(level, mode).findIndex(([s, v]) => s + '#' + v === example); return click(`[data-choice="${L.shapeRound(i, L.defaults, level, mode).answer}"]`); };
// Feelings: a seeded activity (feelings-v1 is the allow-list the game saves). Performances run with real clips
// (Chrome starts with autoplay allowed), so the timings are the game's own.
const FD = require('../public/fireworks/little-patterns/feelings-data.js');
const feelings = extra => ({ [P + 'feelings-v1']: { version: 2, mode: 'board', index: 0, level: 1, story: 0, seed: 1, ...extra } });
const whichAnswer = (index, level) => click(`[data-which="${FD.whichRound(index, 1, level).feeling}"]`);
// Phase 9: a game's sub-menu on the hub, opened by its tile (the activity and level marked from the seeded save).
const sub = id => click(`[data-shelf="${id}"]`);
// shot: part of the evidence set. act: script run in the page after load. until: a selector to wait for. wait: ms before checking.
const SCENARIOS = [
  { name: 'shelf', page: 'index.html', shot: true },
  { name: 'gate-hold', page: 'index.html', shot: true, act: `(()=>{const b=document.querySelector('[data-grownups]');const r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:7,isPrimary:true,clientX:r.left+20,clientY:r.top+20}));})()`, wait: 1250 },
  { name: 'grownups-sheet', page: 'index.html', act: 'LPShelf.grownups()', wait: 400 },
  { name: 'count', page: 'garden.html#count', shot: true },
  { name: 'count-help', page: 'garden.html#count', seed: position({ mode: 'count', selection: { count: 4 } }), act: click('#help') + ';' + click('#help'), wait: 300 },
  { name: 'add', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', selection: { add: [3, 2] } }) },
  { name: 'add-help', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', selection: { add: [3, 2] } }), act: click('#help'), wait: 2600 },
  { name: 'add-done', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', selection: { add: [3, 2] } }), act: click('[data-choice="5"]'), wait: 1100 },
  { name: 'add-big', page: 'garden.html#add', seed: position({ mode: 'add', levels: { add: 2 }, selection: { add: [6, 4] } }) },
  { name: 'add-bridge', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', levels: { add: 4 }, selection: { add: [8, 7] } }) },
  { name: 'add-bridge-help', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', levels: { add: 4 }, selection: { add: [8, 7] } }), act: click('#help'), wait: 2400 },
  { name: 'add-teens', page: 'garden.html#add', seed: position({ mode: 'add', levels: { add: 3 }, selection: { add: [12, 5] } }), act: click('#help'), wait: 2400 },
  { name: 'add-tens', page: 'garden.html#add', seed: position({ mode: 'add', levels: { add: 5 }, selection: { add: [60, 30] } }), act: click('#help'), wait: 2800 },
  { name: 'add-missing', page: 'garden.html#add', seed: position({ mode: 'add', levels: { add: 6 }, selection: { add: [3, 4] } }) },
  { name: 'add-keypad', page: 'garden.html#add', seed: { ...position({ mode: 'add', selection: { add: [3, 2] } }), ...prefs({ addition: 'type' }) } },
  { name: 'take', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', operation: 'take', levels: { add: 2 }, selection: { add: [6, 2] } }) },
  { name: 'take-tens', page: 'garden.html#add', seed: position({ mode: 'add', operation: 'take', levels: { add: 5 }, selection: { add: [70, 30] } }) },
  { name: 'count-100', page: 'garden.html#count', seed: position({ mode: 'count', levels: { count: 6 }, selection: { count: 100 } }) },
  { name: 'count-73-keypad', page: 'garden.html#count', seed: { ...position({ mode: 'count', levels: { count: 6 }, selection: { count: 73 } }), ...prefs({ countAnswer: 'type' }) } },
  { name: 'words', page: 'garden.html#words', shot: true, seed: position({ mode: 'words', indices: { sentence: 1 } }), act: keys('S') },
  { name: 'words-letter', page: 'garden.html#words', seed: position({ mode: 'words', wordTab: 'letter', indices: { letter: 9 } }) },
  { name: 'words-order', page: 'garden.html#words', seed: position({ mode: 'words', wordTab: 'order', indices: { order: 24 } }) },
  { name: 'words-numbers', page: 'garden.html#words', seed: position({ mode: 'words', wordTab: 'numbers', levels: { numbers: 4 }, selection: { numbers: 100 } }), act: keys('ONE') },
  // Phase 9c (Jof, PROOFING-LOG item 13): every Help step shows something; the models must fit at every size.
  { name: 'words-help1', page: 'garden.html#words', seed: position({ mode: 'words', indices: { sentence: 1 } }), act: click('#help'), wait: 300 },
  { name: 'words-letter-help1', page: 'garden.html#words', shot: true, seed: position({ mode: 'words', wordTab: 'letter', indices: { letter: 9 } }), act: click('#help'), wait: 300 },
  { name: 'words-order-help1', page: 'garden.html#words', shot: true, seed: position({ mode: 'words', wordTab: 'order', indices: { order: 24 } }), act: click('#help'), wait: 300 },
  { name: 'words-numbers-help1', page: 'garden.html#words', shot: true, seed: { ...position({ mode: 'words', wordTab: 'numbers', levels: { numbers: 2 }, selection: { numbers: 3 } }), ...prefs({ numberWords: 'type' }) }, act: click('#help'), wait: 300 },
  { name: 'words-numbers-help2', page: 'garden.html#words', shot: true, seed: { ...position({ mode: 'words', wordTab: 'numbers', levels: { numbers: 2 }, selection: { numbers: 3 } }), ...prefs({ numberWords: 'type' }) }, act: keys('TH') + ';' + click('#help') + ';' + click('#help'), wait: 300 },
  { name: 'words-numbers-help-long', page: 'garden.html#words', seed: { ...position({ mode: 'words', wordTab: 'numbers', levels: { numbers: 4 }, selection: { numbers: 100 } }), ...prefs({ numberWords: 'type' }) }, act: click('#help'), wait: 300 },
  { name: 'words-device', page: 'garden.html#words', seed: { ...position({ mode: 'words', indices: { sentence: 0 } }), ...prefs({ keyboard: 'device' }) } },
  { name: 'patterns', page: 'garden.html#patterns', shot: true, seed: position({ mode: 'patterns' }) },
  { name: 'patterns-4', page: 'garden.html#patterns', seed: position({ mode: 'patterns', patternFamily: 4, indices: { patterns: 3 } }) },
  { name: 'patterns-level-10', page: 'garden.html#patterns', seed: position({ mode: 'patterns', patternFamily: 0, levels: { patterns: 10 } }) },
  { name: 'patterns-mirror', page: 'garden.html#patterns', seed: position({ mode: 'patterns', patternFamily: 0, levels: { patterns: 13 }, indices: { patterns: 1 } }) },
  { name: 'make', page: 'garden.html#patterns', seed: position({ mode: 'patterns', patternMode: 'make' }), act: ['circle', 'square', 'circle', 'square', 'oval', 'triangle'].map(s => click(`[data-add="${s}"]`)).join(';') },
  { name: 'shapes-sides', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'pentagon#upright') },
  { name: 'shapes-sides-two', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'pentagon#upright'), act: tapSides(2), wait: 500 },
  { name: 'shapes-sides-lit', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'pentagon#upright'), act: tapSides(5), wait: 600 },
  { name: 'shapes-sides-done', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'pentagon#upright'), act: tapSides(5) + ';' + answer(2, 'sides', 'pentagon#upright'), wait: 1100 },
  { name: 'shapes-sides-help', page: 'shapes.html', seed: shapes(1, 'sides', 'triangle#thin'), act: [1, 2, 3].map(() => click('#help')).join(';'), wait: 1700 },
  { name: 'shapes-name', page: 'shapes.html', shot: true, seed: shapes(2, 'name', 'hexagon#uneven') },
  { name: 'shapes-name-help', page: 'shapes.html', shot: true, seed: shapes(2, 'name', 'hexagon#uneven'), act: click('#help'), wait: 400 },
  { name: 'shapes-name-done', page: 'shapes.html', shot: true, seed: shapes(2, 'name', 'hexagon#uneven'), act: answer(2, 'name', 'hexagon#uneven'), wait: 1100 },
  { name: 'shapes-name-rectangle', page: 'shapes.html', seed: shapes(1, 'name', 'rectangle#long'), act: click('#help'), wait: 400 },
  { name: 'shapes-house', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'pentagon#house'), act: tapSides(2), wait: 500 },
  { name: 'shapes-hexagon-slanted', page: 'shapes.html', shot: true, seed: shapes(2, 'sides', 'hexagon#slanted'), act: tapSides(6), wait: 600 },
  { name: 'shapes-pentagon-wide', page: 'shapes.html', shot: true, seed: shapes(2, 'name', 'pentagon#wide') },
  { name: 'shapes-square-corner', page: 'shapes.html', shot: true, seed: shapes(1, 'sides', 'square#corner'), act: tapSides(1), wait: 500 },
  { name: 'shapes-oval-tilted', page: 'shapes.html', shot: true, seed: shapes(1, 'name', 'oval#tilted'), act: click('#help') + ';' + click('#help'), wait: 400 },
  // The grown-ups' chooser, opened by the address Grown-ups' Levels and puzzles names (phase 9).
  { name: 'levels-shapes', page: 'shapes.html#levels', wait: 400 },
  { name: 'feelings-board', page: 'feelings.html', shot: true, act: click('[data-feel="happy"]'), steps: [[900, click('#done')], [700, click('[data-feel="proud"]')], [900, click('#done')]], wait: 900 },
  { name: 'feelings-perform', page: 'feelings.html', shot: true, act: click('[data-feel="excited"]'), wait: 1250 },
  { name: 'feelings-perform-happy', page: 'feelings.html', shot: true, act: click('[data-feel="happy"]'), wait: 1400 },
  // Mid-breath: since phase 5 the word is followed by "Nook feels sad.", so wait for the breath itself, then to the top of
  // the in-breath (1.2 s), where Nook is tallest. The surprised rise and the excited hops are checked at their highest too.
  { name: 'feelings-perform-sad', page: 'feelings.html', shot: true, act: click('[data-feel="sad"]'), until: '.perform.breathing', wait: 1100 },
  { name: 'feelings-perform-rise', page: 'feelings.html', act: click('[data-feel="surprised"]'), until: '.perform-move.g-surprised', wait: 150 },
  { name: 'feelings-perform-hop', page: 'feelings.html', act: click('[data-feel="excited"]'), until: '.perform-move.g-excited', wait: 190 },
  { name: 'feelings-perform-wait', page: 'feelings.html', shot: true, seed: { 'lp-sound': 'off' }, act: click('[data-feel="disappointed"]'), wait: 2600 },
  { name: 'feelings-which', page: 'feelings.html', shot: true, seed: feelings({ mode: 'which' }) },
  { name: 'feelings-which-help', page: 'feelings.html', shot: true, seed: feelings({ mode: 'which', index: 3 }), act: click('#help'), wait: 400 },
  { name: 'feelings-which-done', page: 'feelings.html', shot: true, seed: feelings({ mode: 'which', index: 3 }), act: whichAnswer(3, 1), wait: 1100 },
  { name: 'feelings-which-long', page: 'feelings.html', seed: feelings({ mode: 'which', index: FD.FEELINGS.map((_, i) => i).find(i => FD.whichRound(i, 1, 2).choices.includes('disappointed') && FD.whichRound(i, 1, 2).choices.includes('frustrated')) || 0, level: 2 }), act: click('#help') + ';' + click('#help'), wait: 400 },
  { name: 'feelings-friends', page: 'feelings.html', shot: true, seed: feelings({ mode: 'friends', story: 1 }) },
  { name: 'feelings-friends-long', page: 'feelings.html', seed: feelings({ mode: 'friends', story: 19 }) },
  { name: 'feelings-me', page: 'feelings.html', shot: true, seed: feelings({ mode: 'me' }) },
  { name: 'feelings-me-chosen', page: 'feelings.html', shot: true, seed: feelings({ mode: 'me' }), act: click('[data-feel="disappointed"]'), wait: 500 },
  { name: 'feelings-me-unsure', page: 'feelings.html', seed: feelings({ mode: 'me' }), act: click('[data-me="unsure"]'), wait: 400 },
  { name: 'feelings-me-other', page: 'feelings.html', seed: feelings({ mode: 'me' }), act: click('[data-me="other"]'), wait: 400 },
  // Two audiences (phases 7 and 9): the grown-ups' chooser in each game, opened by the address Grown-ups' Levels and
  // puzzles names, and Grown-ups held on a sub-menu (the game's section first) and on all games.
  { name: 'levels-feelings', page: 'feelings.html#levels', seed: feelings({ mode: 'which', level: 2 }), wait: 400 },
  { name: 'levels-add', page: 'garden.html#add/levels', seed: position({ mode: 'add', levels: { add: 2 } }), wait: 400 },
  { name: 'levels-count', page: 'garden.html#count/levels', wait: 400 },
  { name: 'grownups-hub', page: 'index.html', act: 'LPShelf.grownups()', wait: 400 },
  { name: 'grownups-sub-add', page: 'index.html', shot: true, seed: position({ mode: 'add', levels: { add: 2 } }), act: sub('add') + ';LPShelf.grownups()', wait: 400 },
  // Nook's pay-offs on success (item 33), caught mid-way: the munch, the bead string under the bubble, the shape held up
  { name: 'payoff-take', page: 'garden.html#add', shot: true, seed: position({ mode: 'add', operation: 'take', levels: { add: 2 }, selection: { add: [6, 2] } }), act: click('[data-choice="4"]'), wait: 380 },
  { name: 'payoff-patterns', page: 'garden.html#patterns', shot: true, seed: position({ mode: 'patterns' }), act: `(()=>{for(const b of document.querySelectorAll('[data-choice]')){b.click();if(!document.querySelector('#next').hidden)break;}})()`, wait: 450 },
  { name: 'payoff-shapes', page: 'shapes.html', shot: true, seed: shapes(1, 'sides', 'triangle#up'), act: answer(1, 'sides', 'triangle#up'), wait: 640 },
  // Phase 9 (navigation proposal 2): a tap on one of the six game tiles opens its sub-menu on the hub, the last activity
  // and the level marked from the save; each game's caption sits in its top bar; Blocks has the plain link top-left.
  { name: 'sub-count', page: 'index.html', shot: true, seed: position({ levels: { count: 3 } }), act: sub('count'), wait: 400 },
  { name: 'sub-add', page: 'index.html', shot: true, act: sub('add'), wait: 400 },
  { name: 'sub-add-take', page: 'index.html', shot: true, seed: position({ operation: 'take', levels: { add: 2 } }), act: sub('add'), wait: 400 },
  { name: 'sub-words', page: 'index.html', shot: true, seed: position({ wordTab: 'letter' }), act: sub('words'), wait: 400 },
  { name: 'sub-patterns', page: 'index.html', shot: true, act: sub('patterns'), wait: 400 },
  { name: 'sub-shapes', page: 'index.html', shot: true, seed: { [P + 'shapes-position']: { mode: 'name', level: 2, indices: {} } }, act: sub('shapes'), wait: 400 },
  { name: 'sub-feelings', page: 'index.html', shot: true, seed: feelings({ mode: 'friends' }), act: sub('feelings'), wait: 400 },
  { name: 'sub-feelings-link', page: 'index.html#feelings', seed: { ...feelings({ mode: 'me' }), ...prefs({ case: 'lower' }) }, wait: 400 },
  { name: 'sub-words-lower', page: 'index.html#words', seed: prefs({ case: 'lower' }), wait: 400 },
  { name: 'sub-add-softer', page: 'index.html#add', seed: { ...position({ levels: { add: 6 } }), ...prefs({ soft: true }) }, wait: 400 },
  // The longest captions: a numbered pattern level with its rule, Number words' tens, and a grown-up's practice set.
  { name: 'caption-pattern-level', page: 'garden.html#patterns', seed: position({ mode: 'patterns', patternFamily: 0, levels: { patterns: 13 } }) },
  { name: 'caption-number-words', page: 'garden.html#words', seed: position({ mode: 'words', wordTab: 'numbers', levels: { numbers: 4 }, selection: { numbers: 100 } }) },
  { name: 'caption-take-over-ten', page: 'garden.html#add', seed: position({ mode: 'add', operation: 'take', levels: { add: 4 } }) },
  { name: 'blocks', page: 'blocks.html', shot: true, scroll: true }
];
// Run in the page: every problem as a line of text.
const CHECK = `(()=>{const out=[];
  const vis=el=>{if(el.closest('[hidden],[inert]'))return false;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
  const desc=el=>(el.id?'#'+el.id:el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\\s+/).join('.'):''))+' "'+(el.getAttribute('aria-label')||el.textContent||'').trim().replace(/\\s+/g,' ').slice(0,24)+'"';
  const d=document.documentElement;if(d.scrollHeight>innerHeight+1||d.scrollWidth>innerWidth+1)out.push('page overflow '+d.scrollWidth+'x'+d.scrollHeight);
  const task=document.querySelector('.nf-task>.task');
  const card=document.querySelector('.nf-task');if(card&&vis(card)){const c=card.getBoundingClientRect();for(const el of document.querySelectorAll('.nf-task .key,.nf-task .answer,.nf-task .choice,.nf-task .word-card,.nf-task [data-tile],.nf-task #check-sum,.nf-task #check-word')){if(!vis(el))continue;const q=el.getBoundingClientRect();if(q.bottom>c.bottom+1||q.bottom>innerHeight+1){out.push('below the card: '+desc(el)+' bottom '+Math.round(q.bottom)+' card '+Math.round(c.bottom));break;}}}
  if(task&&vis(task)){if(task.scrollHeight>task.clientHeight+1)out.push('card scrolls '+task.scrollHeight+' > '+task.clientHeight);if(task.scrollWidth>task.clientWidth+1)out.push('card overflows sideways '+task.scrollWidth+' > '+task.clientWidth);
    const c=task.closest('.nf-task').getBoundingClientRect();for(const el of task.querySelectorAll('*')){if(!vis(el))continue;const q=el.getBoundingClientRect();if(q.left<c.left-1||q.right>c.right+1||q.top<c.top-1||q.bottom>c.bottom+1){out.push('clipped in card: '+desc(el)+' '+[q.left,q.top,q.right,q.bottom].map(Math.round)+' card '+[c.left,c.top,c.right,c.bottom].map(Math.round));break;}}}
  for(const el of document.querySelectorAll('.caption,.caption-text,.lvl,.lvl-word,.answer,.choice,.tile,.key,.word-card,.nf-actions>button,.bubble-inline,.sentence-words,.make-tools button,.feel,.me-card,.me-more,.say-other,.menu-tile,.menu-art,.menu-word,.menu-name,.perform-word,.perform-line')){if(!vis(el))continue;if(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)out.push('label clipped: '+desc(el)+' '+el.scrollWidth+'x'+el.scrollHeight+' in '+el.clientWidth+'x'+el.clientHeight);}
  for(const b of document.querySelectorAll('.nf-bubble')){if(!vis(b))continue;const q=b.getBoundingClientRect();if(q.bottom>innerHeight+1||q.right>innerWidth+1)out.push('bubble off screen: '+desc(b));}
  const nook=document.querySelector('#nook .nook-pos svg');if(nook&&vis(nook)){const n=nook.getBoundingClientRect();for(const a of document.querySelectorAll('.answers button,.word-card,.nf-bubble,.nf-actions>button')){if(!vis(a))continue;const q=a.getBoundingClientRect();if(q.left<n.right-2&&q.right>n.left+2&&q.top<n.bottom-2&&q.bottom>n.top+2)out.push('over Nook: '+desc(a));}}
  const cap=document.querySelector('.nf-top .caption'),link=document.querySelector('#shelf-open');if(cap&&vis(cap)){const q=cap.getBoundingClientRect();if(q.left<0||q.right>innerWidth+1||q.top<0)out.push('caption off screen: '+[q.left,q.top,q.right,q.bottom].map(Math.round));if(link&&vis(link)){const l=link.getBoundingClientRect();if(q.left<l.right+4)out.push('caption over the shelf link: '+Math.round(q.left)+' < '+Math.round(l.right+4));}}
  const sub=document.querySelector('.submenu');if(sub&&vis(sub)){if(sub.scrollHeight>sub.clientHeight+1)out.push('sub-menu scrolls '+sub.scrollHeight+' > '+sub.clientHeight);for(const el of sub.querySelectorAll('.lvl')){if(!vis(el))continue;const r=el.getBoundingClientRect();if(r.top<0||r.left<0||r.bottom>innerHeight+1||r.right>innerWidth+1)out.push('level tile off screen: '+desc(el)+' '+[r.left,r.top,r.right,r.bottom].map(Math.round));const s=sub.getBoundingClientRect();if(r.bottom>s.bottom+1||r.top<s.top-1)out.push('level tile clipped by the sub-menu: '+desc(el));}}
  const gear=document.querySelector('.shelf .nf-grown');if(gear&&vis(gear)){const g=gear.getBoundingClientRect();for(const el of document.querySelectorAll('.shelf .tile,.shelf .lvl')){if(!vis(el))continue;const r=el.getBoundingClientRect();if(r.left<g.right&&r.right>g.left&&r.top<g.bottom&&r.bottom>g.top)out.push('Grown-ups over '+desc(el));}}
  for(const el of document.querySelectorAll('.menu-tile')){if(!vis(el))continue;const r=el.getBoundingClientRect();if(r.height<119.5)out.push('sub-menu tile under 120 px tall: '+desc(el)+' '+Math.round(r.height));}
  // Phase 9c (Jof's S24): on a short landscape screen (lp-short) the keyboard's keys are 36 px tall, still at least 44 px wide.
  const short=document.documentElement.classList.contains('lp-short');
  for(const el of document.querySelectorAll('button,a[href],input,select,textarea,[role=button]')){if(!vis(el))continue;const r=el.getBoundingClientRect(),minH=short&&el.classList.contains('key')?35.5:43.5;if(r.width<43.5||r.height<minH)out.push('target '+Math.round(r.width)+'x'+Math.round(r.height)+': '+desc(el));}
  return JSON.stringify(out);})()`;
// The top-left control: the play screens' back arrow (phase 9b: back to the game's sub-menu) and a sub-menu's back arrow
// (to all games) must be the same arrow in the same place at each size.
const CORNER = `(()=>{const el=document.querySelector('.nf #shelf-open')||document.querySelector('.shelf-bar:not([hidden]) [data-back]');if(!el)return null;const r=el.getBoundingClientRect(),p=el.querySelector('svg path');return [r.left,r.top,r.width,r.height].map(n=>Math.round(n*10)/10).concat(p?p.getAttribute('d'):'no arrow');})()`;

const freePort = () => new Promise((resolve, reject) => { const s = net.createServer(); s.on('error', reject); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
const wait = ms => new Promise(r => setTimeout(r, ms));

async function start() {
  const webPort = await freePort(), cdpPort = await freePort();
  const server = spawn(process.execPath, [path.join(__dirname, 'serve-fireworks.cjs'), String(webPort)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (/fireworks:/.test(String(d))) resolve(); }); server.on('exit', c => reject(Error('server exited ' + c))); });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-layout-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=' + cdpPort, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  let tabs = [];
  for (let i = 0; i < 80 && !tabs.length; i++) { try { tabs = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).filter(t => t.type === 'page'); } catch (_) { /* not up yet */ } if (!tabs.length) await wait(150); }
  if (!tabs.length) throw Error('Chrome did not open a page');
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map(), listeners = [];
  ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); if (msg.error) p.reject(Error(msg.error.message)); else p.resolve(msg.result); } else if (msg.method) listeners.forEach(fn => fn(msg)); };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
  const loaded = () => new Promise(resolve => { const fn = m => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(fn), 1); resolve(); } }; listeners.push(fn); });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const go = async url => { const done = loaded(); await send('Page.navigate', { url }); await Promise.race([done, wait(8000)]); };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  const base = `http://127.0.0.1:${webPort}/little-patterns/`;
  const stop = () => { try { ws.close(); } catch (_) { /* closed */ } chrome.kill(); server.kill(); setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) { /* Chrome still holds a lock */ } }, 500); };
  return { send, evaluate, go, base, stop, listeners };
}

async function run(b, viewport, scenario, shots) {
  // Any uncaught exception or unhandled rejection in the page while the scenario runs is a problem too (phase 6).
  const thrown = [], onThrow = m => { if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; thrown.push('uncaught: ' + String((d.exception && d.exception.description) || d.text).split(String.fromCharCode(10))[0]); } };
  b.listeners.push(onThrow);
  try { return (await scenarioRun(b, viewport, scenario, shots)).concat(thrown); } finally { b.listeners.splice(b.listeners.indexOf(onThrow), 1); }
}
async function scenarioRun(b, viewport, scenario, shots) {
  const [w, h, dpr, mobile] = VIEWPORTS[viewport];
  await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await b.go(b.base + 'index.html');
  await b.evaluate(`localStorage.clear();sessionStorage.clear();${Object.entries(scenario.seed || {}).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(JSON.stringify(v))});`).join('')}true`);
  await b.go(b.base + scenario.page);
  await wait(350);
  if (scenario.act) { await b.evaluate(scenario.act + ';true'); }
  for (const [ms, script] of scenario.steps || []) { await wait(ms); await b.evaluate(script + ';true'); }
  // until: a selector to wait for (up to 12 s) before the wait; a scenario whose state never arrives is a problem.
  if (scenario.until && !(await b.evaluate(`new Promise(r=>{const t0=Date.now(),t=setInterval(()=>{const ok=!!document.querySelector(${JSON.stringify(scenario.until)});if(ok||Date.now()-t0>12000){clearInterval(t);r(ok);}},40);})`))) return ['never reached ' + scenario.until];
  await wait(scenario.wait || 250);
  // A page that scrolls (Blocks) may be taller than the window, never wider.
  const problems = JSON.parse(await b.evaluate(CHECK)).filter(p => !(scenario.scroll && /^page overflow (\d+)x/.test(p) && Number(p.match(/^page overflow (\d+)x/)[1]) <= w + 1));
  const corner = await b.evaluate(CORNER);
  if (corner) (corners[viewport] = corners[viewport] || []).push([scenario.name, corner]);
  if (shots && (scenario.shot || process.env.LP_SHOTS_ALL)) {
    const shot = await b.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(shots, `${viewport}-${scenario.name}.png`), Buffer.from(shot.data, 'base64'));
  }
  return problems;
}

const corners = {};
const only = (process.env.LP_ONLY || '').split(',').filter(Boolean);
const views = (process.env.LP_VIEWPORTS || '').split(',').filter(Boolean);
const scenarios = SCENARIOS.filter(s => !only.length || only.includes(s.name));
const viewports = Object.keys(VIEWPORTS).filter(v => !views.length || views.includes(v));

if (!CHROME) {
  test('layout harness', { skip: 'Chrome is not installed here (set CHROME_PATH to run the six-viewport layout checks)' }, () => {});
} else {
  let browser = null;
  const shots = process.env.LP_SHOTS ? path.resolve(process.env.LP_SHOTS) : '';
  if (shots) fs.mkdirSync(shots, { recursive: true });
  test.before(async () => { browser = await start(); });
  test.after(() => { if (browser) browser.stop(); });
  for (const viewport of viewports) {
    test(`layout at ${viewport} (${VIEWPORTS[viewport].slice(0, 2).join(' x ')}): no overflow, clipping, truncation, answers over Nook, targets under 44 px, level tiles out of view, or a moved top-left control`, async () => {
      const report = [];
      for (const scenario of scenarios) {
        const problems = await run(browser, viewport, scenario, shots);
        for (const p of problems) report.push(`${viewport} ${scenario.name}: ${p}`);
      }
      // One top-left corner on every screen: the shelf link in each game and the back arrow on each sub-menu.
      const seen = corners[viewport] || [], first = seen[0];
      for (const [name, rect] of seen) if (rect.some((n, i) => (typeof n === 'number' ? Math.abs(n - first[1][i]) > 1 : n !== first[1][i]))) report.push(`${viewport} ${name}: the top-left control is ${rect} but ${first[1]} in ${first[0]}`);
      assert.deepEqual(report, [], '\n' + report.join('\n'));
    });
  }
  // Round 4, phase 5: the join in a real media element (jsdom cannot play audio). After the first clip has played (from a
  // tap on a device), a line of several clips plays as ONE joined Blob clip at the chosen rate with the pitch kept; the
  // same line again is built from memory at once.
  test('joined speech in a real browser: one Blob clip of the expected length, rate 1.05 with the pitch kept, the second time straight from memory', async () => {
    const J = require('../public/fireworks/little-patterns/shared.js');
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/fireworks/little-patterns/assets/voice/manifest.json'), 'utf8'));
    const parts = ['Yes!', 'THREE', 'plus', 'TWO', 'equals', 'FIVE'], clipOf = t => manifest.clips[t.toLowerCase().replace(/[.!?,]+$/, '')];
    const pcms = parts.map(t => { const b = fs.readFileSync(path.join(__dirname, '../public/fireworks/little-patterns', clipOf(t).file)); return J.parseWav(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); });
    const expected = J.join(parts, pcms).total;
    await browser.go(browser.base + 'index.html');
    await browser.evaluate('localStorage.clear();sessionStorage.clear();true');
    await browser.go(browser.base + 'garden.html'); await wait(350);
    await browser.evaluate(`window.__plays=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__el=this;window.__plays.push(String(this.src).slice(0,5));return play.call(this);};true`);
    await browser.evaluate(`LP.audio.speak(['apple'],{auto:true});true`); await wait(700);
    await browser.evaluate(`LP.audio.rate=1.05;LP.audio.speak(${JSON.stringify(parts)},{auto:true});true`); await wait(1200);
    const r = await browser.evaluate('({plays:window.__plays,duration:window.__el.duration,paused:window.__el.paused,rate:window.__el.playbackRate,pitch:window.__el.preservesPitch,status:document.getElementById("status").textContent})');
    assert.deepEqual(r.plays, ['http:', 'blob:'], 'the first line plays its clip, the joined line one Blob');
    assert.ok(Math.abs(r.duration - expected) < .02, `joined length ${r.duration} s, expected ${expected} s`);
    assert.equal(r.paused, false); assert.equal(r.rate, 1.05); assert.equal(r.pitch, true);
    assert.doesNotMatch(r.status, /could not play/);
    const again = await browser.evaluate(`(LP.audio.speak(${JSON.stringify(parts)},{auto:true}),window.__plays.length)`);
    assert.equal(again, 3, 'from memory, inside the same call');
  });
}
module.exports = { SCENARIOS, VIEWPORTS, CHECK };
