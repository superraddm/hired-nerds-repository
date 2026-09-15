/* Deterministic learning rounds. UI and audio are separate. */
(function(root){
  'use strict';
  const NUMBER_WORDS=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY'];
  const TENS_WORDS={30:'THIRTY',40:'FORTY',50:'FIFTY',60:'SIXTY',70:'SEVENTY',80:'EIGHTY',90:'NINETY',100:'ONE HUNDRED'};
  // Number words to one hundred: TWENTY-ONE is written with a hyphen and spoken as two bundled clips.
  function numberSpeech(n){n=Number(n);if(!Number.isInteger(n)||n<0||n>100)return [];if(n<=20)return [NUMBER_WORDS[n]];if(n%10===0)return [TENS_WORDS[n]];return [n<30?NUMBER_WORDS[20]:TENS_WORDS[n-n%10],NUMBER_WORDS[n%10]];}
  function numberWord(n){return numberSpeech(n).join('-');}
  const FEEDBACK={retry:'Whoops! Try again.'};
  const PICTURES=[{word:'APPLE',picture:'apple'},{word:'SUN',picture:'sun'},{word:'TREE',picture:'tree'},{word:'BALL',picture:'ball'},{word:'CAT',picture:'cat'},{word:'DOG',picture:'dog'},{word:'BUS',picture:'bus'},{word:'FISH',picture:'fish'},{word:'MOON',picture:'moon'},{word:'FLOWER',picture:'flower'}];
  // Short present-tense sentences. Each gap word has a kind so distractors are the same kind of word.
  const SENTENCES=[{text:'Nook eats an APPLE.',gap:'APPLE',kind:'thing',picture:'apple'},{text:'The SUN is hot.',gap:'SUN',kind:'thing',picture:'sun'},{text:'The CAT is asleep.',gap:'CAT',kind:'thing',picture:'cat'},{text:'The dog can RUN.',gap:'RUN',kind:'doing',picture:'dog'},{text:'The BUS is big.',gap:'BUS',kind:'thing',picture:'bus'},{text:'A fish can SWIM.',gap:'SWIM',kind:'doing',picture:'fish'},{text:'The MOON is out.',gap:'MOON',kind:'thing',picture:'moon'},{text:'Nook has a BALL.',gap:'BALL',kind:'thing',picture:'ball'},{text:'The tree is TALL.',gap:'TALL',kind:'describing',picture:'tree'},{text:'A FLOWER can grow.',gap:'FLOWER',kind:'thing',picture:'flower'},{text:'The sun is HOT.',gap:'HOT',kind:'describing',picture:'sun'},{text:'The DOG can run.',gap:'DOG',kind:'thing',picture:'dog'},{text:'The bus is BIG.',gap:'BIG',kind:'describing',picture:'bus'},{text:'The FISH can swim.',gap:'FISH',kind:'thing',picture:'fish'}];
  // Avoid rejecting another reasonable answer (a dog can SIT as well as RUN).
  const DISTRACTORS={RUN:['JUMP','READ'],SWIM:['READ','SING'],TALL:['LOUD','FAST'],HOT:['DRY','WET'],BIG:['ASLEEP','SOFT']};
  // Picture symbols: Mulberry Symbols (Steve Lee, CC BY-SA 4.0), files in assets/symbols; original names in assets/symbols/NOTICE.txt.
  const WORD_SYMBOLS={BASKET:'basket',APPLE:'apple',SUN:'sun',TREE:'tree',BALL:'ball',CAT:'cat',DOG:'dog',BUS:'bus',FISH:'fish',MOON:'moon',FLOWER:'flower',RUN:'run',SWIM:'swim',TALL:'tall',HOT:'hot',BIG:'big',JUMP:'jump',READ:'read',SING:'sing',LOUD:'loud',FAST:'fast',DRY:'dry',WET:'wet',ASLEEP:'asleep',SOFT:'soft'};
  const defaults={range:5,choices:2,case:'upper',countAnswer:'choose',addition:'choose',numberWords:'show',keyboard:'az',soft:false,pace:0,customWords:[]};
  function cleanWord(text){if(typeof text!=='string')return '';const word=text.normalize('NFC').replace(/[^a-zA-Z '-]/g,'').trim().replace(/\s+/g,' ').slice(0,30).toUpperCase();return /[A-Z]/.test(word)?word:'';}
  function normalisePrefs(input){const p={...defaults};if(!input||typeof input!=='object')return p;for(const key of ['range','choices','case','countAnswer','addition','numberWords','keyboard','pace']){const allowed={range:[5,10],choices:[2,3],case:['upper','lower'],countAnswer:['choose','type'],addition:['choose','type','demo'],numberWords:['show','choose','type'],keyboard:['az','device'],pace:[0,1800,850]}[key];if(allowed.includes(input[key]))p[key]=input[key];}p.soft=input.soft===true;if(Array.isArray(input.customWords))p.customWords=[...new Set(input.customWords.map(cleanWord).filter(Boolean))].slice(0,24);return p;}
  function options(answer,pool,count,index=0){const other=[...new Set(pool)].filter(v=>v!==answer);const start=index%Math.max(1,other.length);const result=[answer,...other.slice(start).concat(other.slice(0,start)).slice(0,count-1)];const offset=index%result.length;return result.slice(offset).concat(result.slice(0,offset));}
  // Levels are chosen per activity and never advance on their own. The round index only varies examples within a level.
  const LEVELS={count:6,add:5,numbers:2,patterns:7};
  const OPERATIONS=['add','take'];
  function clampLevel(kind,level){const max=LEVELS[kind]||1;return Number.isInteger(level)&&level>=1&&level<=max?level:1;}
  // Every round carries a stable puzzle id: kind, save version, level, operation and the content itself. Restoration matches on it.
  const VERSION=2;
  function identify(kind,level,operation,key){return [kind,'v'+VERSION,'L'+level,operation,key].join(':');}
  // The largest quantity a level shows. Add levels: within 5, within 10, within 20 without crossing ten, within 20 crossing ten, tens to 100.
  const RANGES={count:[5,10,20,50,50,100],add:[5,10,20,20,100],numbers:[5,10]};
  function levelRange(level,kind='count'){const table=RANGES[kind]||RANGES.count;return table[Math.max(1,Math.min(table.length,Number(level)||1))-1];}
  // A fixed, non-sequential order: the first item stays first, then a stride walks the list so the next answer cannot be read off the last one.
  function mixed(list){const n=list.length;if(n<3)return list.slice();const gcd=(a,b)=>b?gcd(b,a%b):a;const stride=[7,3,5,2].find(s=>gcd(s,n)===1)||1;return Array.from({length:n},(_,i)=>list[(i*stride)%n]);}
  // Count levels: 1 to 5, 1 to 10, 11 to 20, tens to 50, 21 to 50, 51 to 100.
  function countSequence(level){level=clampLevel('count',level);if(level<=2)return mixed(Array.from({length:levelRange(level,'count')},(_,i)=>i+1));if(level===3)return mixed(Array.from({length:10},(_,i)=>11+i));if(level===4)return mixed([10,20,30,40,50]);if(level===5)return mixed(Array.from({length:30},(_,i)=>21+i));return mixed(Array.from({length:50},(_,i)=>51+i));}
  // Alternative arrangements of the same quantity in the five- or ten-frame: pass one fills from the left, later passes spread the apples or fill from the right.
  function arrangement(target,variant){const size=target>5?10:5;const all=Array.from({length:size},(_,i)=>i);variant=((variant%3)+3)%3;if(variant===1)return all.filter(i=>i%2===0).concat(all.filter(i=>i%2===1)).slice(0,target);if(variant===2)return all.slice().reverse().slice(0,target);return all.slice(0,target);}
  // Take away includes taking nothing and taking everything, so zero appears as an answer and as an amount.
  function sumSequence(level,operation='add'){level=clampLevel('add',level);const take=operation==='take';const sums=[];
    if(level<=2){const range=levelRange(level,'add');if(take){for(let a=1;a<=range;a++)for(let b=a;b>=0;b--)sums.push([a,b]);}else{for(let total=2;total<=range;total++)for(let a=total-1;a>=1;a--)sums.push([a,total-a]);}}
    else if(level===3){if(take){for(let a=11;a<=19;a++)for(let b=1;b<=a%10;b++)sums.push([a,b]);}else{for(let a=10;a<=19;a++)for(let b=1;b<=9;b++)if(a%10+b<=10)sums.push([a,b]);}}
    else if(level===4){if(take){for(let a=11;a<=18;a++)for(let b=2;b<=9;b++)if(a-b>=2&&a-b<10)sums.push([a,b]);}else{for(let a=2;a<=9;a++)for(let b=2;b<=9;b++)if(a+b>=11)sums.push([a,b]);}}
    else{if(take){for(let a=10;a<=100;a+=10)for(let b=10;b<=a;b+=10)sums.push([a,b]);}else{for(let a=10;a<=90;a+=10)for(let b=10;a+b<=100;b+=10)sums.push([a,b]);}}
    return mixed(sums);}
  function arithmeticPool(level,operation){level=clampLevel('add',level);const range=levelRange(level,'add');if(level>=5)return Array.from({length:11},(_,i)=>i*10).filter(n=>operation==='take'||n>=20);return Array.from({length:range+1},(_,i)=>i).filter(n=>operation==='take'||n>=1);}
  // Named practice sets: the sums worth repeating. Both fit level 2 (within 10) and are addition only.
  const SUM_SETS={doubles:{label:'Doubles',level:2,sums:[[1,1],[2,2],[3,3],[4,4],[5,5]]},ten:{label:'Make ten',level:2,sums:[[9,1],[8,2],[7,3],[6,4],[5,5],[4,6],[3,7],[2,8],[1,9]]}};
  function setRound(name,index,prefs){const set=SUM_SETS[name];if(!set)return null;const pair=set.sums[((index%set.sums.length)+set.sums.length)%set.sums.length];const r=sumRound(0,prefs,set.level,'add',pair);r.set=name;return r;}
  // Levels 3 and up draw every quantity as tens and ones; a complete ten stays a visible ten-frame until level 5, where it becomes a stick.
  function usesTray(kind,level){return level>=3;}
  function usesSticks(kind,level){return kind==='add'?level>=5:level>=4;}
  function countRound(index,prefs,level=1){level=clampLevel('count',level);const sequence=countSequence(level);const target=sequence[index%sequence.length];const variant=level<=2?Math.floor(index/sequence.length)%3:0;return {id:identify('count',level,'count',target+(variant?'~'+variant:'')),level,target,slots:arrangement(target,variant),choices:options(target,sequence,prefs.choices,index),seen:[],draft:'',hint:0,done:false};}
  // Counting tokens on the tray: 't0', 't1' for complete tens (tens first), 'o0', 'o1' for loose ones. Levels 1 and 2 keep plain apple ordinals.
  function countTokens(target){const tens=Math.floor(target/10),ones=target%10;return [...Array.from({length:tens},(_,i)=>'t'+i),...Array.from({length:ones},(_,i)=>'o'+i)];}
  function runningTotals(seen){let total=0;const totals={};for(const token of seen){total+=String(token).startsWith('t')?10:1;totals[token]=total;}return totals;}
  // pair optionally names a directly chosen sum; it must still fit the level.
  function sumRound(index,prefs,level=1,operation='add',pair=null){level=clampLevel('add',level);if(!OPERATIONS.includes(operation))operation='add';const sums=sumSequence(level,operation);const valid=Array.isArray(pair)&&pair.length===2&&sums.some(([a,b])=>a===pair[0]&&b===pair[1]);const [a,b]=valid?pair:sums[index%sums.length];const answer=operation==='take'?a-b:a+b;return {id:identify('add',level,operation,a+(operation==='take'?'-':'+')+b),level,operation,a,b,total:answer,answer,stage:'parts',draft:'',hint:0,choices:options(answer,arithmeticPool(level,operation),3,index),done:false};}
  // Pattern levels: pairs, a gap mid-string, AAB/ABB, ABC, AABB, mixed fours, then four shapes. The level is explicit; the index rotates shapes and gap positions.
  const PATTERN_LEVELS=LEVELS.patterns;
  function patternRound(index,prefs,level=1){const shapes=['circle','square','triangle','diamond'];level=clampLevel('patterns',level);const step=level-1;const s=i=>shapes[(i+index)%4];const [A,B,C,D]=[s(0),s(1),s(2),s(3)];const unit=[[A,B],[A,B],index%2?[A,A,B]:[A,B,B],[A,B,C],[A,A,B,B],index%2?[A,B,A,C]:[A,B,C,B],[A,B,C,D]][step];const length=step>=4?8:6;const sequence=Array.from({length},(_,i)=>unit[i%unit.length]);const gap=step===0||step===2?length-1:unit.length+index%(length-unit.length-1);const pool=[...new Set(unit)];for(const x of shapes)if(pool.length<Math.max(2,prefs.choices)&&!pool.includes(x))pool.push(x);return {id:identify('patterns',level,'repeat',sequence.join(',')+'#'+gap),level,sequence,unit,gap,answer:sequence[gap],hint:0,choices:options(sequence[gap],pool,prefs.choices,index),done:false};}
  function wordRound(index,prefs){const entries=PICTURES.concat(prefs.customWords.map(word=>({word,picture:(PICTURES.find(p=>p.word===word)||{}).picture||null})));const entry=entries[index%entries.length];return {id:identify('word',1,'word',entry.word),...entry,draft:'',model:true,done:false};}
  function numberWordRound(index,prefs,level=1){level=clampLevel('numbers',level);const range=levelRange(level,'numbers');const target=index%range+1;const word=NUMBER_WORDS[target];return {id:identify('numbers',level,'word',target),level,target,word,draft:'',hint:0,choices:options(word,NUMBER_WORDS.slice(1,range+1),prefs.choices,index),done:false};}
  function sentenceWords(text){return text.replace(/[.!?]/g,'').split(' ').map(w=>w.toUpperCase());}
  function sentencePool(entry){return [...new Set([entry.gap,...(DISTRACTORS[entry.gap]||SENTENCES.filter(s=>s.kind===entry.kind).map(s=>s.gap))])];}
  function sentencePrompt(round){return round.words.map((word,i)=>i===round.gapAt&&!round.done?'blank':word.toLowerCase()).join(' ')+'.';}
  function sentenceRound(index,prefs){const e=SENTENCES[index%SENTENCES.length];const words=sentenceWords(e.text);return {id:identify('sentence',1,'gap',e.text),text:e.text,words,gap:e.gap,gapAt:words.indexOf(e.gap),picture:e.picture,choices:options(e.gap,sentencePool(e),3,index),draft:'',hint:false,done:false};}
  function letterRound(index,prefs){const entries=PICTURES.concat(prefs.customWords.map(word=>({word,picture:(PICTURES.find(p=>p.word===word)||{}).picture||null})));const e=entries[index%entries.length];const positions=Array.from(e.word).map((c,i)=>/[A-Z]/.test(c)?i:-1).filter(i=>i>=0);const position=positions[(index+Math.floor(index/entries.length))%positions.length];const letter=e.word[position];const pool=[...new Set(Array.from(e.word.replace(/[^A-Z]/g,'')).concat(Array.from('AEIOUBTSLMNRDP')))];return {id:identify('letter',1,'letter',e.word+'#'+position),word:e.word,picture:e.picture,position,letter,hint:0,choices:options(letter,pool,prefs.choices,index),done:false};}
  function orderRound(index,prefs){const e=SENTENCES[index%SENTENCES.length];const words=sentenceWords(e.text);const shift=1+index%(words.length-1);let tiles=words.slice(shift).concat(words.slice(0,shift));if(index%2)tiles=tiles.reverse();if(tiles.join(' ')===words.join(' '))tiles=words.slice().reverse();return {id:identify('order',1,'order',e.text+'#'+tiles.join(',')),text:e.text,words,tiles,picture:e.picture,used:[],hint:0,done:false};}
  // Success feedback: short, factual and warm. The line restates the answer; the opener is chosen deterministically per puzzle so the same puzzle always gets the same words.
  const OPENERS=['Yes!','You found it.','That’s the one.','Spot on!'];
  const SPOKEN_EXTRAS=['Yes!','You found it.','That’s the one.','Spot on!','Lovely counting.','apples','plus','take away','equals','The pattern fits.'];
  function hashText(text){let h=0;for(const c of String(text))h=(h*31+c.charCodeAt(0))>>>0;return h;}
  function successLine(kind,round){const plural=n=>n+(n===1?' apple':' apples');const pick=hashText(round.id||'')%(OPENERS.length+(kind==='count'?1:0));const opener=pick<OPENERS.length?OPENERS[pick]:'Lovely counting.';const first=hashText(round.id||'x')%3!==2;let fact,speech;
    if(kind==='count'){fact=plural(round.target)+'.';speech=[...numberSpeech(round.target),round.target===1?'apple':'apples'];}
    else if(kind==='add'){const take=round.operation==='take';fact=round.a+(take?' − ':' + ')+round.b+' = '+round.answer+'.';speech=[...numberSpeech(round.a),take?'take away':'plus',...numberSpeech(round.b),'equals',...numberSpeech(round.answer)];}
    else if(kind==='patterns'){fact='The pattern fits.';speech=['The pattern fits.'];}
    else if(kind==='numbers'){fact=round.word+'.';speech=[round.word];}
    else if(kind==='letter'){fact=round.word+'.';speech=PICTURES.some(p=>p.word===round.word)?[round.word]:[];}
    else{const words=round.words.map(w=>w.toLowerCase());words[0]=words[0][0].toUpperCase()+words[0].slice(1);fact=words.join(' ')+'.';speech=[round.words.join(' ').toLowerCase()+'.'];}
    const text=first?opener+' '+fact:fact+' '+opener;
    const parts=first?[opener,...speech]:[...speech,opener];
    return {text,speech:parts.every(Boolean)?parts:[]};}
  // Everything the bundled voice must be able to say. The voice builder and its test both read this list.
  function spokenBank(){const texts=[...Object.keys(WORD_SYMBOLS),...NUMBER_WORDS,...Object.values(TENS_WORDS),...PICTURES.map(p=>p.word),...Object.values(FEEDBACK),...SPOKEN_EXTRAS,"Hello! I'm Nook. Let's play."];for(let i=0;i<SENTENCES.length;i++){const r=sentenceRound(i,defaults);texts.push(sentencePrompt(r));r.done=true;texts.push(sentencePrompt(r));}const key=s=>s.trim().toLowerCase().replace(/\s+/g,' ').replace(/[.!?]+$/,'');return [...new Set(texts.map(key))].sort();}
  function matches(typed,expected){return String(typed).trim().replace(/\s+/g,' ').toLocaleUpperCase('en-GB')===String(expected).toLocaleUpperCase('en-GB');}
  function editText(value,start,end,key){value=String(value);start=Math.max(0,Math.min(value.length,start));end=Math.max(start,Math.min(value.length,end));if(key==='Backspace'){if(start===end&&start>0)start-=Array.from(value.slice(0,start)).pop().length;return {value:value.slice(0,start)+value.slice(end),caret:start};}const insert=key==='Space'?' ':key;const next=value.slice(0,start)+insert+value.slice(end);if(next.length>500)return {value,caret:end};return {value:next,caret:start+insert.length};}
  const api={NUMBER_WORDS,TENS_WORDS,numberSpeech,numberWord,arithmeticPool,usesTray,usesSticks,RANGES,SUM_SETS,setRound,countTokens,runningTotals,mixed,arrangement,FEEDBACK,PICTURES,SENTENCES,WORD_SYMBOLS,PATTERN_LEVELS,LEVELS,OPERATIONS,VERSION,identify,clampLevel,levelRange,countSequence,sumSequence,sentenceWords,sentencePool,sentencePrompt,sentenceRound,letterRound,orderRound,defaults,normalisePrefs,cleanWord,options,countRound,sumRound,patternRound,wordRound,numberWordRound,OPENERS,successLine,spokenBank,matches,editText};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GardenLearning=api;
})(typeof window!=='undefined'?window:globalThis);
