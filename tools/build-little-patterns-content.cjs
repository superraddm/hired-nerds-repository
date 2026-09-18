// Build a readable reference from the same data/functions used by the games.
// No player names, local drafts or custom words are read by this script.
const fs = require('node:fs');
const path = require('node:path');
const L = require('../public/fireworks/little-patterns/learning.js');
const C = require('../public/fireworks/little-patterns/core.js');
const prefs = L.normalisePrefs({ range: 10, choices: 3 });
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const patterns = new Map();
// Levels are explicit; within a level the round index rotates shapes and gap positions and repeats after a short cycle.
for (let level = 1; level <= L.LEVELS.patterns; level++) for (let index = 0; index < 200; index++) {
  const r = L.patternRound(index, prefs, level);
  const key = JSON.stringify([r.level, r.sequence, r.gaps]);
  if (!patterns.has(key)) patterns.set(key, { ...r, index });
}
const sections = [
  {
    title: 'Sentences and missing-word answers',
    note: 'Two banks: the picnic (fourteen sentences) and bath and bed time (twelve, several of five words for Word order), all using the same symbol words. The same sentences are also used for Word order. Grown-ups can add up to twelve familiar sentences locally (missing word in capitals); those private additions cannot be listed here. Tapping the sentence says it with “blank” until the answer is checked. Each missing-word round offers its answer plus two alternatives from the listed pool; the answer is typed into the gap. The sentence picture is always visible. Help! (the button with the hand sign for help) first shows the three words’ pictures, then outlines the word that fits. Tapping a word says it, only while sound is on.',
    headers: ['Scene', 'Sentence with gap', 'Answer', 'Full sentence / word order', 'Possible word-bank words'],
    rows: L.SENTENCES.map((entry, index) => {
      const round = L.sentenceRound(index, prefs);
      return [entry.scene || 'picnic', L.sentencePrompt(round), entry.gap, round.words.join(' ') + '.', L.sentencePool(entry).join(', ')];
    })
  },
  {
    title: 'Word picture symbols',
    note: 'Pictures are Mulberry Symbols by Steve Lee (CC BY-SA 4.0), the same symbol style Arthur uses on Grid and at school. Object words show the object; doing and describing words use Mulberry\'s own symbol for that word. Files are in assets/symbols; the original Mulberry names are listed in assets/symbols/NOTICE.txt.',
    headers: ['Word', 'Symbol file'], rows: Object.entries(L.WORD_SYMBOLS).map(([word, file]) => [word, file + '.svg'])
  },
  {
    title: 'Missing-letter words',
    note: 'Any letter position in these words can be the answer over repeated rounds. Spaces and punctuation are never hidden. Grown-ups can add up to 24 familiar words or short phrases locally; those private additions cannot be listed in this shared reference.',
    headers: ['Completed word', 'Letters that may be hidden'],
    rows: L.PICTURES.map(entry => [entry.word, [...new Set(entry.word)].join(', ')])
  },
  {
    title: 'Counting and number words',
    note: 'Count has six levels chosen in the activity: 1 to 5, 1 to 10, 11 to 20, tens to 50, 21 to 50 and 51 to 100; from level 3 quantities are drawn as tens and ones (a full ten-frame at level 3, sticks of ten from level 4). Number words have four levels: 1 to 5, 1 to 10, the teens to twenty, and the tens to one hundred (level 1 is the part of level 2 up to five). Every quantity in a level can be chosen directly; play order within a level is deliberately mixed, and at levels 1 and 2 later passes arrange the same quantity differently in the frame. Typed answers ignore case and surrounding spaces.',
    headers: ['Number words level', 'Apples / numeral', 'Number word'],
    rows: [2, 3, 4].flatMap(level => L.numberSequence(level).slice().sort((a, b) => a - b).map(n => [level, n, L.numberWord(n)]))
  },
  {
    title: 'Every Garden addition',
    note: 'Add has five levels chosen in the activity: 1 within 5 (the default), 2 within 10, 3 within 20 without crossing ten (10 + 4), 4 within 20 crossing ten (8 + 5), 5 tens to 100 (30 + 20), 6 the missing part (2 + ? = 5, addition only, within ten, with the joined group shown and the hidden part outlined). Level 1 is the part of level 2 with totals up to 5, so it is not listed separately. Levels 3 and 4 draw quantities as full ten-frames plus ones; level 5 draws complete tens as sticks. The picker allows every sum in the level; reversed groups are separate examples. Play order within a level is deliberately mixed so the next answer cannot be predicted from the last; this table is sorted for reading.',
    headers: ['Level', 'First group', 'Second group', 'Answer', 'Equation'],
    rows: [2, 3, 4, 5, 6].flatMap(level => L.sumSequence(level, 'add').slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(([a, b]) => [level, a, level === 6 ? `? (${b})` : b, level === 6 ? b : a + b, level === 6 ? `${a} + ? = ${a + b}` : `${a} + ${b} = ${a + b}`]))
  },
  {
    title: 'Every Garden take away',
    note: 'Take away lives inside the Add activity behind an Add / Take away switch and shares its levels: 1 from up to 5, 2 from up to 10, 3 from 11 to 19 taking ones only (15 − 3), 4 within 20 crossing ten (12 − 5), 5 tens (60 − 20). Nook starts with a group and eats none, some or all of it; what is left stays a countable group and the eaten apples sit in a separate basket area. Zero is included both as an amount taken and as an answer. Level 1 is the part of level 2 starting from up to 5.',
    headers: ['Level', 'Start with', 'Taken away', 'Answer', 'Equation'],
    rows: [2, 3, 4, 5].flatMap(level => L.sumSequence(level, 'take').slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(([a, b]) => [level, a, b, a - b, `${a} − ${b} = ${a - b}`]))
  },
  {
    title: 'Every pattern and missing-shape answer',
    note: `${patterns.size} distinct sequence/gap combinations. Each row shows the first round index within its level that produces it. Levels are chosen in the activity and never advance on their own; Next gives another example at the same level. Levels 1 to 11 are repeating patterns (longer units and two gaps from level 8); 12 is a growing pattern, 13 a mirror pattern and 14 a number pattern, each named as its own rule with its own hint. Answer-choice order and distractors can vary, but these are all the underlying answers. All levels are open.`,
    headers: ['Level', 'Rule', 'First round index', 'Unit / groups / step', 'Puzzle (? marks a gap)', 'Answers in order'],
    rows: [...patterns.values()].map(r => [r.level, L.PATTERN_RULES[r.rule].name, r.index, r.rule === 'grow' ? r.groups.map(g => g.join(' ')).join(' | ') : r.rule === 'number' ? 'count on in ' + r.step + 's' : r.unit.join(' · '), r.sequence.map((v, i) => r.gaps.includes(i) ? '?' : v).join(' · '), r.gaps.map(g => r.sequence[g]).join(', ')])
  },
  {
    title: 'Colour Blocks pieces',
    note: 'Each filled square has the value 1. Pieces rotate through quarter turns. The board is 10 columns by 20 rows, with open-ended arrangements rather than a fixed puzzle-answer list.',
    headers: ['Piece', 'Starting shape (rows separated by /)', 'Total'],
    rows: C.SHAPES.map((shape, index) => [['I', 'O', 'T', 'S', 'Z', 'J', 'L'][index], shape.map(row => row.map(v => v ? '■' : '·').join(' ')).join(' / '), 4])
  },
  {
    title: 'Every possible block-row addition',
    note: 'The active piece can add 1–4 squares to an affected row. A completed row always totals 10; all four completed-row examples are 6 + 4, 7 + 3, 8 + 2 and 9 + 1. Moving or turning recalculates every affected row.',
    headers: ['Already in row', 'Squares added', 'Row total'],
    rows: Array.from({ length: 10 }, (_, before) => Array.from({ length: Math.min(4, 10 - before) }, (_, i) => [before, i + 1, before + i + 1])).flat()
  }
];
const intro = 'This reference is generated from learning.js and core.js. It contains all built-in answers and content, with no player data. To change sentences, word pools or picture symbols, edit learning.js; sums and patterns are generated by sumRound and patternRound. Run node tools/build-little-patterns-content.cjs after changing the content.';
const md = '# Little Patterns: all game content and answers\n\n' + intro + '\n\n' + sections.map(s => '## ' + s.title + '\n\n' + s.note + '\n\n| ' + s.headers.join(' | ') + ' |\n| ' + s.headers.map(() => '---').join(' | ') + ' |\n' + s.rows.map(row => '| ' + row.join(' | ') + ' |').join('\n')).join('\n\n') + '\n';
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All game answers · Little Patterns</title><style>body{font:17px/1.6 "Trebuchet MS",Arial,sans-serif;color:#293d60;background:#fffdf0;margin:0}main{max-width:1100px;margin:auto;padding:24px}h1,h2{line-height:1.2}h2{margin-top:40px}a{color:#315f50}nav{display:flex;flex-wrap:wrap;gap:10px 20px}nav a{padding:8px 0}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;background:#fff}th,td{padding:10px;text-align:left;border:1px solid #b8c8b3;vertical-align:top}th{background:#d7eee2}p{max-width:85ch}a:focus-visible{outline:3px solid #815a24;outline-offset:4px}</style></head><body><main><a href="./">← Games</a><h1>All game content and answers</h1><p>'+escape(intro)+'</p><nav aria-label="Content sections">'+sections.map((s,i)=>'<a href="#section-'+i+'">'+escape(s.title)+'</a>').join('')+'</nav>'+sections.map((s,i)=>'<section id="section-'+i+'"><h2>'+escape(s.title)+'</h2><p>'+escape(s.note)+'</p><div class="table"><table><thead><tr>'+s.headers.map(h=>'<th scope="col">'+escape(h)+'</th>').join('')+'</tr></thead><tbody>'+s.rows.map(row=>'<tr>'+row.map(cell=>'<td>'+escape(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>').join('')+'</main></body></html>\n';
fs.writeFileSync(path.join(__dirname, '../docs/little-patterns-content.md'), md + '\nFeelings: [all pictures and story words](../public/fireworks/little-patterns/feelings-content.html), generated from feelings-data.js and feelings-art.js.\n');
fs.writeFileSync(path.join(__dirname, '../public/fireworks/little-patterns/content.html'), html.replace('<nav aria-label="Content sections">', '<p><a href="feelings-content.html">Feelings: all pictures and story words</a> · <a href="phonics-review.html">Alphabet sounds: listening review</a></p><nav aria-label="Content sections">'));
console.log(`Built content reference: ${L.SENTENCES.length} sentences, ${[2,3,4,5].reduce((n, l) => n + L.sumSequence(l, 'add').length, 0)} sums, ${[2,3,4,5].reduce((n, l) => n + L.sumSequence(l, 'take').length, 0)} take aways, ${patterns.size} patterns, 10 picture words.`);
