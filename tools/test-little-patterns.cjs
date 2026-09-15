const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../public/fireworks/little-patterns/core.js');
const learning=require('../public/fireworks/little-patterns/learning.js');
test('all seven pieces rotate through a full cycle and fit their spawn',()=>{core.SHAPES.forEach((matrix,id)=>{let turned=matrix;for(let i=0;i<4;i++)turned=core.rotate(turned);assert.deepEqual(turned,matrix);assert.equal(core.fits(core.emptyBoard(),new core.Blocks().spawn(id)),true);});});
test('movement respects walls and floor, and placement matches landing outline',()=>{const game=new core.Blocks(()=>.5);for(let i=0;i<20;i++)game.move(-1,0);assert.equal(game.active.x,0);assert.equal(game.move(-1,0),false);const ghost=game.landing();assert.equal(core.fits(game.board,{...ghost,y:ghost.y+1}),false);game.place();ghost.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)assert.equal(game.board[ghost.y+y][ghost.x+x],ghost.id+1);}));});
test('a completed row clears and undo restores board, piece, next and rows',()=>{const game=new core.Blocks();game.board[19]=Array(10).fill(1);game.board[19].splice(3,4,0,0,0,0);game.active=game.spawn(0);const before=JSON.parse(JSON.stringify({board:game.board,active:game.active,next:game.next,bag:game.bag,rows:game.rows}));assert.equal(game.place(),1);assert.equal(game.rows,1);assert.equal(game.board[19].every(v=>v===0),true);assert.equal(game.undo(),true);for(const key of Object.keys(before))assert.deepEqual(game[key],before[key]);assert.equal(game.undo(),false);});
test('multiple rows clear simultaneously',()=>{const board=core.emptyBoard();board[18].fill(1);board[19].fill(2);board[17][0]=4;const result=core.clearLines(board);assert.equal(result.cleared,2);assert.equal(result.board.length,20);assert.equal(result.board[19][0],4);});
test('full board stops play and can be undone or reset',()=>{const game=new core.Blocks();game.board.forEach(row=>row[4]=1);game.active={id:1,matrix:[[1,1],[1,1]],x:0,y:0};game.next=1;game.place();assert.equal(game.full,true);assert.equal(game.move(1,0),false);assert.equal(game.undo(),true);assert.equal(game.full,false);game.reset();assert.equal(game.rows,0);assert.equal(game.board.flat().every(v=>v===0),true);});
test('every seven-piece bag contains each shape once',()=>{const game=new core.Blocks();game.bag=[];assert.equal(new Set(Array.from({length:7},()=>game.drawId())).size,7);});

// Visible arithmetic: one prospective equation per row the landing piece touches.
function seeded(){const game=new core.Blocks(()=>.5);game.board[19]=[2,2,2,0,0,0,0,6,6,6];game.board[18]=[2,2,0,0,0,0,0,0,6,6];game.board[17]=[4,0,0,0,0,0,0,0,0,7];return game;}
test('a flat I piece over a six-square row shows 6 + 4 = 10',()=>{const game=seeded();game.active={id:0,matrix:[[1,1,1,1]],x:3,y:0};assert.deepEqual(game.rowSums(),[{row:19,before:6,added:4,total:10}]);});
test('an upright T adds one square to one row and three to the next; sideways it spreads 1/2/1',()=>{const game=seeded();game.active={id:2,matrix:[[0,1,0],[1,1,1]],x:3,y:0};assert.deepEqual(game.rowSums().map(s=>[s.before,s.added,s.total]),[[4,1,5],[6,3,9]]);game.turn();assert.deepEqual(game.rowSums().map(s=>[s.before,s.added,s.total]),[[2,1,3],[4,2,6],[6,1,7]]);});
test('moving the piece recalculates the prospective sums immediately',()=>{const game=seeded();game.active={id:1,matrix:[[1,1],[1,1]],x:3,y:0};assert.deepEqual(game.rowSums().map(s=>s.total),[6,8]);game.move(-3,0);assert.deepEqual(game.rowSums().map(s=>[s.row,s.before,s.added,s.total]),[[15,0,2,2],[16,0,2,2]]);});
test('completing a row records the worked example and clearing keeps the other totals',()=>{const game=seeded();game.active={id:0,matrix:[[1,1,1,1]],x:3,y:0};assert.equal(game.lastSum,null);assert.equal(game.place(),1);assert.deepEqual(game.lastSum,{row:19,before:6,added:4,total:10});assert.equal(game.rows,1);assert.deepEqual(game.board.map(r=>r.filter(Boolean).length).filter(Boolean),[2,4]);});
test('undo restores the previous equation and the totals',()=>{const game=seeded();game.active={id:0,matrix:[[1,1,1,1]],x:3,y:0};game.place();game.active={id:0,matrix:[[1,1,1,1]],x:2,y:0};assert.equal(game.place(),0);assert.deepEqual(game.lastSum,{row:19,before:6,added:4,total:10});game.active={id:1,matrix:[[1,1],[1,1]],x:6,y:0};assert.equal(game.place(),1);assert.equal(game.rows,2);assert.deepEqual(game.lastSum,{row:19,before:8,added:2,total:10});assert.equal(game.undo(),true);assert.equal(game.rows,1);assert.deepEqual(game.lastSum,{row:19,before:6,added:4,total:10});assert.equal(game.board[19].filter(Boolean).length,8);assert.equal(game.undo(),false);});
test('two rows at once use the bottommost completed row for the worked example',()=>{const game=new core.Blocks(()=>.5);game.board[19]=[1,1,1,1,1,1,1,1,1,0];game.board[18]=[1,1,1,1,1,1,1,1,1,0];game.board[17]=[1,1,1,0,0,0,0,0,0,0];game.active={id:0,matrix:[[1],[1],[1],[1]],x:9,y:0};assert.deepEqual(game.rowSums().map(s=>s.total),[1,4,10,10]);assert.equal(game.place(),2);assert.deepEqual(game.lastSum,{row:19,before:9,added:1,total:10});assert.equal(game.rows,2);assert.deepEqual(game.board[19],[1,1,1,0,0,0,0,0,0,1]);});
test('no prospective sums are offered on a full board',()=>{const game=new core.Blocks();game.board.forEach(row=>row[4]=1);game.active={id:1,matrix:[[1,1],[1,1]],x:0,y:0};game.next=1;game.place();assert.equal(game.full,true);assert.deepEqual(game.rowSums(),[]);assert.equal(game.place(),0);});

// Nook's Garden rounds: every setting combination must stay answerable.
const combos=[];for(const range of [5,10])for(const choices of [2,3])combos.push(learning.normalisePrefs({range,choices}));
const levelFor=p=>p.range===10?2:1;
test('familiar words cannot create punctuation-only or unanswerable letter puzzles',()=>{
  const prefs=learning.normalisePrefs({customWords:['---',"'''",null,42,'ice cream','a-a','BOOK']});
  assert.deepEqual(prefs.customWords,['ICE CREAM','A-A','BOOK']);
  for(let index=0;index<200;index++){
    const round=learning.letterRound(index,prefs);
    assert.match(round.letter,/^[A-Z]$/);
    assert.ok(round.choices.includes(round.letter));
  }
  const positions=new Set();
  for(let cycle=0;cycle<10;cycle++)positions.add(learning.letterRound(cycle*10,learning.defaults).position);
  assert.ok(positions.has(2),'both repeated Ps in APPLE can be hidden');
});
test('small choice pools stay unique and sentence distractors avoid obvious valid alternatives',()=>{
  assert.deepEqual(learning.options('A',['A','B'],3,1),['B','A']);
  for(const [word,excluded] of [['RUN','SIT'],['TALL','SMALL'],['BIG','SMALL']]){
    const index=learning.SENTENCES.findIndex(s=>s.gap===word);
    const round=learning.sentenceRound(index,{...learning.defaults,choices:3});
    assert.equal(round.choices.length,3);
    assert.ok(!round.choices.includes(excluded));
    assert.ok(round.choices.includes(word));
  }
});
test('preferences are validated and unknown values fall back to the quiet defaults',()=>{const p=learning.normalisePrefs({range:20,choices:9,case:'MIXED',addition:'quiz',numberWords:'x',keyboard:'y',pace:100,soft:'yes',customWords:['dinosaur','<b>x</b>','ice  cream','dinosaur',42]});assert.deepEqual(p,{...learning.defaults,customWords:['DINOSAUR','BXB','ICE CREAM']});assert.equal(learning.normalisePrefs(null).range,5);assert.equal(learning.normalisePrefs({pace:1800,soft:true}).pace,1800);assert.equal(learning.defaults.addition,'choose');assert.equal(learning.normalisePrefs({addition:'type'}).addition,'type');assert.equal(learning.normalisePrefs({addition:'quiz'}).addition,'choose');assert.equal(learning.normalisePrefs({addition:'show'}).addition,'choose','the old stored default must not skip the answer step');assert.equal(learning.normalisePrefs({addition:'demo'}).addition,'demo');});
test('counting rounds cover every quantity with the target among unique choices',()=>{for(const p of combos){const seen=new Set();for(let i=0;i<40;i++){const r=learning.countRound(i,p,levelFor(p));assert.equal(r.level,levelFor(p));seen.add(r.target);assert.ok(r.target>=1&&r.target<=p.range);assert.ok(r.choices.includes(r.target));assert.equal(r.choices.length,p.choices);assert.equal(new Set(r.choices).size,p.choices);}assert.equal(seen.size,p.range);}});
test('addition rounds keep totals within range, start as separate parts and offer three totals to choose from',()=>{for(const p of combos)for(let i=0;i<40;i++){const r=learning.sumRound(i,p,levelFor(p));assert.equal(r.operation,'add');assert.equal(r.answer,r.total);assert.ok(r.a>=1&&r.b>=1&&r.total===r.a+r.b&&r.total<=p.range);assert.equal(r.draft,'');assert.ok(r.choices.includes(r.total));assert.equal(new Set(r.choices).size,3);}assert.deepEqual(learning.sumRound(0,combos[0]).total,2);});
test('pattern rounds repeat a unit, hide beads after the unit is shown, and every level is explicit',()=>{for(const p of combos)for(let level=1;level<=11;level++)for(let i=0;i<12;i++){const r=learning.patternRound(i,p,level);assert.equal(r.level,level,'the level never derives from the round index');assert.equal(r.rule,'repeat');assert.ok([6,8,9,10].includes(r.sequence.length));r.sequence.forEach((s,k)=>assert.equal(s,r.unit[k%r.unit.length]));assert.ok(r.gaps.every(g=>g>=r.unit.length&&g<r.sequence.length));assert.equal(new Set(r.gaps).size,r.gaps.length);assert.deepEqual(r.gaps,[...r.gaps].sort((a,b)=>a-b));assert.equal(r.answer,r.sequence[r.gaps[0]]);for(const g of r.gaps)assert.ok(r.choices.includes(r.sequence[g]),'every gap answer is offered');assert.ok(r.choices.length<=3);assert.ok(r.choices.length>=Math.min(p.choices,3));assert.equal(new Set(r.choices).size,r.choices.length);}const p=combos[0];assert.deepEqual([1,2,3,4,5,6,7].map(level=>learning.patternRound(0,p,level).unit.length),[2,2,3,3,4,4,4]);assert.equal(learning.patternRound(0,p,1).gaps[0],5);assert.ok(learning.patternRound(3,p,2).gaps[0]<5);assert.equal(learning.patternRound(0,p,5).sequence.length,8);assert.equal(new Set(learning.patternRound(0,p,7).unit).size,4);assert.equal(learning.PATTERN_LEVELS,14);assert.equal(learning.patternRound(30,p).level,1,'an omitted level is level 1, not a promotion');assert.equal(learning.patternRound(0,p,99).level,1);assert.notDeepEqual(learning.patternRound(0,p,1).sequence,learning.patternRound(1,p,1).sequence,'Next varies the example within the level');});
test('number words pair quantities with their word and cycle through picture and familiar words',()=>{const p=learning.normalisePrefs({range:5,customWords:['dinosaur']});for(let i=0;i<10;i++){const r=learning.numberWordRound(i,p);assert.equal(r.level,1);assert.ok(r.target<=5);assert.equal(r.word,learning.NUMBER_WORDS[r.target]);assert.ok(r.choices.includes(r.word));assert.ok(learning.numberWordRound(i,p,2).target<=10);}const words=Array.from({length:11},(_,i)=>learning.wordRound(i,p).word);assert.equal(words[0],'APPLE');assert.equal(words[10],'DINOSAUR');assert.equal(learning.wordRound(10,p).picture,null);assert.equal(learning.wordRound(11,p).word,'APPLE');});
test('literacy rounds: every sentence gap, hidden letter and word order stays solvable',()=>{for(const p of combos){for(let i=0;i<30;i++){const s=learning.sentenceRound(i,p);assert.ok(s.gapAt>=0&&s.words[s.gapAt]===s.gap);assert.equal(s.draft,'');assert.ok(learning.matches(' '+s.gap.toLowerCase()+' ',s.gap));assert.ok(s.choices.includes(s.gap));assert.equal(new Set(s.choices).size,3);assert.ok(s.choices.every(word=>learning.WORD_SYMBOLS[word]));assert.equal(learning.sentenceWords(s.text).join(' '),s.words.join(' '));const l=learning.letterRound(i,{...p,customWords:['ICE CREAM']});assert.equal(l.word[l.position],l.letter);assert.match(l.letter,/^[A-Z]$/);assert.ok(l.choices.includes(l.letter));assert.equal(new Set(l.choices).size,p.choices);const o=learning.orderRound(i,p);assert.equal(o.tiles.length,o.words.length);assert.deepEqual(o.tiles.slice().sort(),o.words.slice().sort());assert.notEqual(o.tiles.join(' '),o.words.join(' '));}}const positions=new Set(Array.from({length:40},(_,i)=>learning.letterRound(i,combos[0]).word+learning.letterRound(i,combos[0]).position));assert.ok(positions.size>learning.PICTURES.length);assert.ok(learning.SENTENCES.every(s=>s.text.includes(s.gap)&&s.picture));});
test('typed words match regardless of case and spacing; editing keeps the caret sensible',()=>{assert.equal(learning.matches(' apple ','APPLE'),true);assert.equal(learning.matches('aple','APPLE'),false);assert.deepEqual(learning.editText('AB',2,2,'C'),{value:'ABC',caret:3});assert.deepEqual(learning.editText('ABC',3,3,'Backspace'),{value:'AB',caret:2});assert.deepEqual(learning.editText('ABC',1,3,'Backspace'),{value:'A',caret:1});assert.deepEqual(learning.editText('AB',1,1,'Space'),{value:'A B',caret:2});assert.equal(learning.editText('x'.repeat(500),500,500,'Y').value.length,500);});
test('answer options always include the answer, never repeat, and vary their order between rounds',()=>{const pool=[1,2,3,4,5];const a=learning.options(3,pool,3,0),b=learning.options(3,pool,3,1);assert.ok(a.includes(3)&&b.includes(3));assert.equal(new Set(a).size,3);assert.notDeepEqual(a,b);assert.deepEqual(learning.options(1,[1],2,0),[1]);});

// The older letter/number/pattern puzzle generator still ships in core.js and must stay solvable.
test('all puzzle modes remain solvable across settings and repeated rounds',()=>{for(const level of ['supported','explore'])for(const range of ['5','10','20'])for(const letterCase of ['upper','lower'])for(const mode of ['letters','numbers','words','patterns','count'])for(let index=0;index<60;index++){const p=core.puzzle(mode,index,{level,range,case:letterCase});assert.ok(p.tokens.length);while(p.filled<p.tokens.length){const choices=core.choicesFor(p,level);assert.ok(choices.includes(p.tokens[p.filled]));assert.equal(new Set(choices).size,choices.length);assert.equal(choices.length,level==='supported'?2:3);p.filled++;}if(mode==='numbers')assert.ok(p.tokens.every((n,i)=>+n>=1&&+n<=+range&&(!i||+n===+p.tokens[i-1]+1)));}});
test('letters cycle A to Z; words support lowercase; counting begins at one',()=>{const s={level:'supported',range:'5',case:'upper'};assert.equal(core.puzzle('letters',0,s).tokens[0],'A');assert.equal(core.puzzle('letters',25,s).tokens[0],'Z');assert.equal(core.puzzle('letters',26,s).tokens[0],'A');assert.equal(core.puzzle('words',0,{...s,case:'lower'}).tokens.join(''),'cat');assert.equal(core.puzzle('count',0,s).picture,1);});

// Picture symbols: every word that can appear as a picture or in a word bank has a clean local SVG.
test('every picture word has a bundled Mulberry symbol that is a plain local SVG',()=>{const fs=require('node:fs'),path=require('node:path');const dir=path.join(__dirname,'../public/fireworks/little-patterns/assets/symbols');const needed=new Set([...Object.keys(learning.WORD_SYMBOLS)]);for(const s of learning.SENTENCES){for(const w of learning.sentencePool(s))assert.ok(learning.WORD_SYMBOLS[w],'no symbol for word bank word '+w);assert.ok(Object.values(learning.WORD_SYMBOLS).includes(s.picture),'no symbol for sentence picture '+s.picture);}for(const p of learning.PICTURES)assert.ok(Object.values(learning.WORD_SYMBOLS).includes(p.picture),'no symbol for picture word '+p.word);for(const word of needed){const file=path.join(dir,learning.WORD_SYMBOLS[word]+'.svg');const svg=fs.readFileSync(file,'utf8');assert.match(svg.trimStart(),/^(<\?xml[^>]*>\s*)?<svg\b/,word);assert.ok(!/<script|href="http|url\(http/i.test(svg),word+' must not reference anything external');assert.ok(svg.length<40000,word+' symbol is unexpectedly large');}assert.ok(fs.existsSync(path.join(dir,'NOTICE.txt')));});

// Per-activity levels: chosen explicitly, clamped safely, and each level has its own sequence of examples.
test('levels are per activity, clamped to the published maximum and drive their own example sequences',()=>{
  assert.deepEqual(learning.LEVELS,{count:6,add:5,numbers:4,patterns:14});
  assert.deepEqual(learning.OPERATIONS,['add','take']);
  for(const kind of Object.keys(learning.LEVELS)){assert.equal(learning.clampLevel(kind,0),1);assert.equal(learning.clampLevel(kind,'2'),1);assert.equal(learning.clampLevel(kind,learning.LEVELS[kind]+1),1);assert.equal(learning.clampLevel(kind,learning.LEVELS[kind]),learning.LEVELS[kind]);}
  assert.deepEqual([...learning.countSequence(1)].sort(),[1,2,3,4,5]);assert.equal(learning.countSequence(2).length,10);
  assert.equal(learning.sumSequence(1).length,10);assert.equal(learning.sumSequence(2).length,45);
  assert.ok(learning.sumSequence(1).every(([a,b])=>a+b<=5));
  const p=learning.defaults;
  assert.equal(learning.countRound(7,p,2).target,learning.countSequence(2)[7]);assert.equal(learning.countRound(7,p,1).target,learning.countSequence(1)[2]);
  assert.equal(learning.sumRound(0,p,1,'divide').operation,'add','unknown operations fall back to addition');
  assert.equal(learning.numberWordRound(0,p,2).choices.length,p.choices);
});
// Puzzle identity: stable for the same puzzle, distinct across levels and operations, and versioned for future migrations.
test('every round carries a stable, versioned puzzle id that includes its level and operation',()=>{
  const p=learning.defaults;
  assert.equal(learning.VERSION,2);
  assert.equal(learning.countRound(1,p,1).id,learning.countRound(1,p,1).id);
  assert.equal(learning.countRound(1,p,1).id,'count:v2:L1:count:3');
  assert.notEqual(learning.countRound(1,p,1).id,learning.countRound(1,p,2).id,'the same target at another level is another puzzle');
  assert.equal(learning.sumRound(0,p,1).id,'add:v2:L1:add:1+1');
  assert.equal(learning.sumRound(0,p,1,'add',[2,3]).id,'add:v2:L1:add:2+3','a directly chosen sum is identified by its own operands');
  assert.equal(learning.sumRound(0,p,1,'add',[9,9]).a,1,'a chosen sum outside the level falls back to the sequence');
  assert.match(learning.patternRound(0,p,3).id,/^patterns:v2:L3:repeat:[a-z,]+#\d$/);
  assert.match(learning.sentenceRound(0,p).id,/^sentence:v2:L1:gap:/);
  assert.match(learning.letterRound(0,p).id,/^letter:v2:L1:letter:APPLE#\d$/);
  assert.match(learning.orderRound(0,p).id,/^order:v2:L1:order:/);
  assert.match(learning.numberWordRound(0,p,2).id,/^numbers:v2:L2:word:1$/);
  const ids=new Set();for(let i=0;i<45;i++)ids.add(learning.sumRound(i,p,2).id);assert.equal(ids.size,45);
});

// Take away shares the Add activity: same levels, same answer modes, its own operation in the id, zero included.
test('take away rounds start from a group, remove none, some or all, and keep the answer among unique choices',()=>{
  const p=learning.defaults;
  assert.deepEqual(learning.OPERATIONS,['add','take']);
  for(const level of [1,2]){const seq=learning.sumSequence(level,'take');const range=learning.levelRange(level);
    assert.ok(seq.some(([a,b])=>b===0),'taking nothing is included');assert.ok(seq.some(([a,b])=>a===b),'taking everything is included');
    assert.ok(seq.every(([a,b])=>a>=1&&a<=range&&b>=0&&b<=a));
    for(let i=0;i<seq.length;i++){const r=learning.sumRound(i,p,level,'take');assert.equal(r.operation,'take');assert.equal(r.answer,r.a-r.b);assert.equal(r.total,r.answer);assert.ok(r.answer>=0);assert.ok(r.choices.includes(r.answer));assert.equal(new Set(r.choices).size,3);assert.ok(r.choices.every(n=>n>=0&&n<=range));assert.match(r.id,/^add:v2:L\d:take:\d+-\d+$/);}}
  assert.equal(learning.sumSequence(1,'take').length,20);
  assert.notEqual(learning.sumRound(0,p,1,'add',[3,2]).id,learning.sumRound(0,p,1,'take',[3,2]).id,'3 + 2 and 3 - 2 are different puzzles');
  assert.equal(learning.sumRound(0,p,1,'take',[3,0]).answer,3);
  assert.equal(learning.sumRound(0,p,1,'take',[2,5]).b<=learning.sumRound(0,p,1,'take',[2,5]).a,true,'an impossible take away falls back to the sequence');
  assert.ok(learning.sumRound(0,p,1,'add').choices.every(n=>n>=1),'addition never offers zero');
  const line=learning.successLine('add',learning.sumRound(0,p,1,'take',[5,2]));
  assert.equal(line.text.includes('5 − 2 = 3.'),true);assert.deepEqual(line.speech.filter(x=>!learning.OPENERS.includes(x)),['FIVE','take away','TWO','equals','THREE']);
  assert.deepEqual(learning.numberSpeech(0),['ZERO']);assert.deepEqual(learning.numberSpeech(17),['SEVENTEEN']);assert.deepEqual(learning.numberSpeech(73),['SEVENTY','THREE']);assert.deepEqual(learning.numberSpeech(21),['TWENTY','ONE']);assert.deepEqual(learning.numberSpeech(100),['ONE HUNDRED']);assert.equal(learning.numberWord(45),'FORTY-FIVE');assert.deepEqual(learning.numberSpeech(101),[]);
});

// Add and Take away levels 3 to 5: no crossing ten, crossing ten, then tens. Answers stay inside the level and every sum is a distinct puzzle.
test('arithmetic levels 3 to 5 keep their rules and draw quantities as tens and ones',()=>{
  const p=learning.defaults;
  assert.deepEqual(learning.RANGES.add,[5,10,20,20,100]);
  assert.equal(learning.levelRange(3,'add'),20);assert.equal(learning.levelRange(5,'add'),100);assert.equal(learning.levelRange(9,'add'),100);assert.equal(learning.levelRange(2),10);
  const l3a=learning.sumSequence(3,'add');assert.ok(l3a.length>20);assert.ok(l3a.every(([a,b])=>a>=10&&a<=19&&b>=1&&b<=9&&a%10+b<=10&&a+b<=20),'level 3 add never crosses ten');
  const l3t=learning.sumSequence(3,'take');assert.ok(l3t.every(([a,b])=>a>=11&&a<=19&&b>=1&&b<=a%10),'level 3 take away removes ones only');
  const l4a=learning.sumSequence(4,'add');assert.ok(l4a.every(([a,b])=>a<=9&&b<=9&&a+b>=11&&a+b<=20),'level 4 add crosses ten');
  const l4t=learning.sumSequence(4,'take');assert.ok(l4t.every(([a,b])=>a>=11&&a<=20&&a-b<10&&a-b>=2),'level 4 take away crosses back below ten');
  const l5a=learning.sumSequence(5,'add');assert.ok(l5a.every(([a,b])=>a%10===0&&b%10===0&&a+b<=100&&a>=10&&b>=10));assert.ok(l5a.some(([a,b])=>a+b===100));
  const l5t=learning.sumSequence(5,'take');assert.ok(l5t.every(([a,b])=>a%10===0&&b%10===0&&b<=a&&a<=100));assert.ok(l5t.some(([a,b])=>a===b),'taking every ten is included');
  for(const level of [3,4,5])for(const op of learning.OPERATIONS){const seq=learning.sumSequence(level,op);const ids=new Set();for(let i=0;i<seq.length;i++){const r=learning.sumRound(i,p,level,op);ids.add(r.id);assert.equal(r.level,level);assert.ok(r.answer>=0&&r.answer<=learning.levelRange(level,'add'));assert.ok(r.choices.includes(r.answer));assert.equal(new Set(r.choices).size,3);if(level===5)assert.ok(r.choices.every(n=>n%10===0));assert.ok(learning.successLine('add',r).speech.length>=6);}assert.equal(ids.size,seq.length,'every sum in '+op+' level '+level+' is its own puzzle');}
  assert.equal(learning.usesTray('add',2),false);assert.equal(learning.usesTray('add',3),true);
  assert.equal(learning.usesSticks('add',4),false,'a complete ten stays a visible ten-frame at levels 3 and 4');assert.equal(learning.usesSticks('add',5),true);
  assert.deepEqual(learning.arithmeticPool(5,'take'),[0,10,20,30,40,50,60,70,80,90,100]);
});

test('Doubles and Make ten are fixed addition sets that fit within ten and cycle in order',()=>{
  const p=learning.defaults;
  assert.deepEqual(learning.SUM_SETS.doubles.sums,[[1,1],[2,2],[3,3],[4,4],[5,5]]);
  assert.deepEqual(learning.SUM_SETS.ten.sums.map(([a,b])=>a+b),Array(9).fill(10));
  assert.deepEqual(learning.SUM_SETS.ten.sums[0],[9,1]);assert.deepEqual(learning.SUM_SETS.ten.sums[8],[1,9]);
  for(const name of Object.keys(learning.SUM_SETS)){const set=learning.SUM_SETS[name];for(let i=0;i<set.sums.length+2;i++){const r=learning.setRound(name,i,p);assert.equal(r.set,name);assert.equal(r.operation,'add');assert.deepEqual([r.a,r.b],set.sums[i%set.sums.length]);assert.equal(r.answer,r.a+r.b);assert.ok(r.choices.includes(r.answer));assert.equal(new Set(r.choices).size,3);assert.equal(r.level,2);assert.match(r.id,/^add:v2:L2:add:/);}}
  assert.equal(learning.setRound('nothing',0,p),null);
});

// Count to 100: six levels, tens-and-ones tokens counted tens first, a keypad answer mode independent of level.
test('count levels 3 to 6 span 11 to 100 in tens and ones, with tokens that count each group once',()=>{
  const p=learning.defaults;
  assert.deepEqual(learning.RANGES.count,[5,10,20,50,50,100]);
  assert.deepEqual([...learning.countSequence(1)].sort(),[1,2,3,4,5]);assert.equal(learning.countSequence(2).length,10);
  assert.deepEqual([...learning.countSequence(3)].sort((a,b)=>a-b),[11,12,13,14,15,16,17,18,19,20]);
  assert.deepEqual([...learning.countSequence(4)].sort((a,b)=>a-b),[10,20,30,40,50]);
  const l5=[...learning.countSequence(5)].sort((a,b)=>a-b);assert.equal(l5[0],21);assert.equal(l5[l5.length-1],50);assert.equal(l5.length,30);
  const l6=[...learning.countSequence(6)].sort((a,b)=>a-b);assert.equal(l6[0],51);assert.equal(l6[l6.length-1],100);assert.equal(l6.length,50);
  for(let level=1;level<=6;level++){const seq=learning.countSequence(level);const seen=new Set();for(let i=0;i<seq.length;i++){const r=learning.countRound(i,p,level);seen.add(r.target);assert.equal(r.level,level);assert.ok(r.choices.includes(r.target));assert.equal(new Set(r.choices).size,p.choices);assert.ok(r.choices.every(n=>seq.includes(n)),'numeral choices stay inside the level');assert.equal(r.draft,'');assert.ok(learning.successLine('count',r).speech.length>=3);}assert.equal(seen.size,seq.length);}
  assert.deepEqual(learning.countTokens(23),['t0','t1','o0','o1','o2']);assert.deepEqual(learning.countTokens(40),['t0','t1','t2','t3']);assert.deepEqual(learning.countTokens(7),['o0','o1','o2','o3','o4','o5','o6']);
  assert.deepEqual(learning.runningTotals(['t0','t1','o0','o1']),{t0:10,t1:20,o0:21,o1:22});
  assert.deepEqual(learning.runningTotals([0,1,2]),{0:1,1:2,2:3},'levels 1 and 2 keep plain ordinals');
  assert.equal(learning.usesTray('count',2),false);assert.equal(learning.usesTray('count',3),true);assert.equal(learning.usesSticks('count',3),false,'level 3 shows a full ten-frame so a ten is visibly ten apples');assert.equal(learning.usesSticks('count',4),true);
  assert.equal(learning.normalisePrefs({countAnswer:'type'}).countAnswer,'type');assert.equal(learning.normalisePrefs({countAnswer:'demo'}).countAnswer,'choose');
});

// Mixed order and arrangements: the first example is unchanged, the rest cannot be read off the previous answer, and every item still appears once per pass.
test('count targets and sums follow a fixed mixed order, and levels 1 and 2 rearrange the same quantity on later passes',()=>{
  const p=learning.defaults;
  assert.deepEqual(learning.mixed([1,2,3,4,5]),[1,3,5,2,4]);
  assert.deepEqual(learning.mixed([1,2]),[1,2]);
  for(const n of [5,9,10,20,30,45,50,54]){const list=Array.from({length:n},(_,i)=>i+1);const m=learning.mixed(list);assert.equal(m[0],1,'the first example is unchanged');assert.deepEqual([...m].sort((a,b)=>a-b),list,'every item once');let steps=0;for(let i=1;i<m.length;i++)if(m[i]===m[i-1]+1)steps++;assert.ok(steps<=n/4,'no long runs of consecutive answers for n='+n);}
  assert.equal(learning.countSequence(1)[0],1);assert.equal(learning.countSequence(2)[0],1);assert.notDeepEqual(learning.countSequence(2),[1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(learning.sumSequence(1,'add')[0],[1,1]);assert.deepEqual(learning.sumSequence(3,'add')[0],[10,1]);assert.deepEqual(learning.sumSequence(1,'take')[0],[1,1]);
  assert.deepEqual(learning.SUM_SETS.doubles.sums.map(s=>s[0]),[1,2,3,4,5],'named sets stay in order');
  assert.deepEqual(learning.arrangement(3,0),[0,1,2]);assert.deepEqual(learning.arrangement(3,1),[0,2,4]);assert.deepEqual(learning.arrangement(4,1),[0,2,4,1]);assert.deepEqual(learning.arrangement(3,2),[4,3,2]);assert.deepEqual(learning.arrangement(7,1),[0,2,4,6,8,1,3]);
  const first=learning.countRound(0,p,1),second=learning.countRound(5,p,1),third=learning.countRound(10,p,1);
  assert.equal(first.target,second.target);assert.deepEqual(first.slots,[0]);assert.notEqual(first.id,second.id,'a rearranged quantity is its own puzzle');assert.equal(learning.countRound(15,p,1).id,first.id,'the arrangement cycle repeats');
  assert.equal(new Set(third.slots).size,third.target);
  for(let i=0;i<40;i++){const r=learning.countRound(i,p,2);assert.equal(r.slots.length,r.target);assert.ok(r.slots.every(s=>s>=0&&s<(r.target>5?10:5)));assert.equal(new Set(r.slots).size,r.target);}
  assert.deepEqual(learning.countRound(30,p,3).slots,learning.arrangement(learning.countRound(30,p,3).target,0),'trays keep the standard fill');
});

test('number words reach the teens and the tens to one hundred, with choices drawn from the same level',()=>{
  const p=learning.normalisePrefs({choices:3});
  assert.deepEqual([...learning.numberSequence(3)].sort((a,b)=>a-b),[11,12,13,14,15,16,17,18,19,20]);
  assert.deepEqual([...learning.numberSequence(4)].sort((a,b)=>a-b),[10,20,30,40,50,60,70,80,90,100]);
  assert.equal(learning.numberSequence(1)[0],1);
  for(let level=1;level<=4;level++){const seq=learning.numberSequence(level);const words=new Set(seq.map(learning.numberWord));for(let i=0;i<seq.length;i++){const r=learning.numberWordRound(i,p,level);assert.equal(r.level,level);assert.equal(r.word,learning.numberWord(r.target));assert.ok(r.choices.includes(r.word));assert.equal(new Set(r.choices).size,3);assert.ok(r.choices.every(w=>words.has(w)));assert.ok(learning.matches(' '+r.word.toLowerCase()+' ',r.word));assert.ok(learning.successLine('numbers',r).speech.length>=2);}}
  assert.equal(learning.numberWordRound(0,p,4).word,'TEN');assert.ok(learning.numberSequence(4).map(learning.numberWord).includes('ONE HUNDRED'));assert.ok(learning.numberSequence(3).map(learning.numberWord).includes('ELEVEN'));
});

// Pattern depth: longer units and two gaps, then growing, mirror and number patterns as named rules.
test('levels 8 to 14 add two gaps, five-shape units over ten beads, and three named rules with their own hints',()=>{
  const p=learning.normalisePrefs({choices:2}),p3=learning.normalisePrefs({choices:3});
  assert.deepEqual(learning.SHAPES,['circle','square','triangle','diamond','oval']);
  for(let i=0;i<20;i++){
    const l8=learning.patternRound(i,p,8);assert.equal(l8.sequence.length,8);assert.equal(l8.unit.length,2);assert.equal(l8.gaps.length,2);assert.ok(l8.gaps.every(g=>g>=2));
    const l9=learning.patternRound(i,p,9);assert.equal(l9.sequence.length,9);assert.equal(l9.unit.length,3);assert.equal(l9.gaps.length,2);
    const l10=learning.patternRound(i,p,10);assert.equal(l10.sequence.length,10);assert.equal(new Set(l10.unit).size,5,'ABCDE uses five distinct shapes');assert.equal(l10.gaps.length,1);assert.ok(l10.gaps[0]>=5);
    const l11=learning.patternRound(i,p,11);assert.equal(l11.sequence.length,10);assert.equal(l11.gaps.length,2);assert.ok(l11.gaps.every(g=>g>=5));
    const g=learning.patternRound(i,p,12);assert.equal(g.rule,'grow');assert.deepEqual(g.groups.map(x=>x.length),[1,2,3,4]);assert.deepEqual(g.sequence,g.groups.flat());assert.ok(g.gaps[0]>=6,'the gap is in the last group');assert.ok(g.groups.every(x=>x[0]===g.groups[0][0]));assert.equal(learning.patternHint(g),'Each group has one more bead.');
    const m=learning.patternRound(i,p,13);assert.equal(m.rule,'mirror');assert.deepEqual(m.sequence,m.sequence.slice().reverse(),'a mirror reads the same backwards');assert.ok(m.gaps[0]>=m.sequence.length/2,'the gap is in the second half');assert.equal(learning.patternHint(m),'The second half is the first half backwards.');
    const n=learning.patternRound(i,p3,14);assert.equal(n.rule,'number');assert.equal(n.sequence.length,5);assert.ok([1,2,5,10].includes(n.step));for(let k=1;k<5;k++)assert.equal(n.sequence[k]-n.sequence[k-1],n.step);assert.ok(n.choices.includes(n.answer));assert.equal(new Set(n.choices).size,3);assert.ok(n.choices.every(v=>Number.isInteger(v)&&v>0));assert.match(learning.patternHint(n),/^Count on in (ones|twos|fives|tens)\.$/);
    for(const r of [l8,l9,l10,l11,g,m,n]){assert.ok(r.choices.length<=3,'never more than three choices');for(const gap of r.gaps)assert.ok(r.choices.includes(r.sequence[gap]));assert.deepEqual(r.filled,{});assert.equal(r.selected,r.gaps[0]);assert.match(r.id,/^patterns:v2:L\d+:(repeat|grow|mirror|number):/);}
  }
  assert.equal(learning.patternHint(learning.patternRound(0,p,8)),'','from level 8 the unit is no longer spelt out');
  assert.equal(learning.patternHint(learning.patternRound(0,p,3)).endsWith('Repeat.'),true);
  const ids=new Set();for(let i=0;i<40;i++)ids.add(learning.patternRound(i,p,8).id);assert.ok(ids.size>=8,'two-gap examples vary');
  for(const rule of ['repeat','grow','mirror','number'])assert.ok(learning.PATTERN_RULES[rule].name&&learning.PATTERN_RULES[rule].prompt&&learning.PATTERN_RULES[rule].title);
});
