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
  const key = JSON.stringify([r.level, r.sequence, r.gap]);
  if (!patterns.has(key)) patterns.set(key, { ...r, index });
}
const sections = [
  {
    title: 'Sentences and missing-word answers',
    note: 'The same fourteen sentences are also used for Word order. Play sentence says “blank” until the answer is checked. Each missing-word round offers its answer plus two alternatives from the listed pool. The sentence picture is always visible. Show pictures / Hide pictures toggles only the word-bank pictures, which start hidden. Tapping a word pronounces it; the answer is still typed.',
    headers: ['Sentence with gap', 'Answer', 'Full sentence / word order', 'Possible word-bank words'],
    rows: L.SENTENCES.map((entry, index) => {
      const round = L.sentenceRound(index, prefs);
      return [L.sentencePrompt(round), entry.gap, round.words.join(' ') + '.', L.sentencePool(entry).join(', ')];
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
    note: 'Count and Number words have levels chosen in the activity: level 1 is 1–5 and level 2 is 1–10. Every quantity in the level can be chosen directly. Typed answers ignore case and surrounding spaces.',
    headers: ['Apples / numeral', 'Number word'],
    rows: L.NUMBER_WORDS.slice(1).map((word, index) => [index + 1, word])
  },
  {
    title: 'Every Garden addition',
    note: 'All 45 ordered sums with two positive groups and a total up to 10. Level 1 (totals up to 5) is the default; level 2 adds totals up to 10. The picker allows every sum in the level; reversed groups are separate examples. Zero is not part of this release.',
    headers: ['First group', 'Second group', 'Answer', 'Equation'],
    rows: Array.from({ length: 45 }, (_, index) => { const r = L.sumRound(index, prefs, 2); return [r.a, r.b, r.total, `${r.a} + ${r.b} = ${r.total}`]; })
  },
  {
    title: 'Every pattern and missing-shape answer',
    note: `${patterns.size} distinct sequence/gap combinations. Each row shows the first round index within its level that produces it. Levels are chosen in the activity and never advance on their own; Next gives another example at the same level. Answer-choice order and distractors can vary, but these are all the underlying answers. All levels are open.`,
    headers: ['Level', 'First round index', 'Repeating unit', 'Puzzle (? is the gap)', 'Answer'],
    rows: [...patterns.values()].map(r => [r.level, r.index, r.unit.join(' · '), r.sequence.map((shape, i) => i === r.gap ? '?' : shape).join(' · '), r.answer])
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
fs.writeFileSync(path.join(__dirname, '../docs/little-patterns-content.md'), md);
fs.writeFileSync(path.join(__dirname, '../public/fireworks/little-patterns/content.html'), html);
console.log(`Built content reference: ${L.SENTENCES.length} sentences, 45 sums, ${patterns.size} patterns, 10 picture words.`);
