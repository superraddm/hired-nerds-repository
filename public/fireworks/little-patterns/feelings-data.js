/* Original Feelings vocabulary and deterministic rounds. No player data or I/O. */
(function(root){
  'use strict';
  const FEELINGS=['happy','sad','angry','calm','worried','excited','proud','surprised','frustrated','disappointed'];
  const PEOPLE=[
    {id:'sam',name:'Sam',skin:'#d99770',shade:'#b77656',hair:'#39303d',shirt:'#8770a7',style:'curls'},
    {id:'jo',name:'Jo',skin:'#f0c6a4',shade:'#d4a180',hair:'#89918e',shirt:'#537f80',style:'short',glasses:true},
    {id:'ali',name:'Ali',skin:'#976448',shade:'#7b4e38',hair:'#292831',shirt:'#b38545',style:'waves'},
    {id:'robin',name:'Robin',skin:'#e3b18a',shade:'#c08c68',hair:'#724e39',shirt:'#667ba4',style:'bob'}
  ];
  const WORDS={happy:'Happy',sad:'Sad',angry:'Angry',calm:'Calm',worried:'Worried',excited:'Excited',proud:'Proud',surprised:'Surprised',frustrated:'Frustrated',disappointed:'Disappointed',other:'Something else',unsure:'Not sure'};
  // Symmetric pairings give each feeling equal exposure on both answer cards.
  const PAIR_GROUPS=[['happy','calm','excited','proud','surprised'],['sad','angry','worried','frustrated','disappointed']];
  const DISTRACTORS={};
  // Each column is a bijection in both directions, balancing every mixed deck.
  PAIR_GROUPS[0].forEach((f,i)=>{DISTRACTORS[f]=PAIR_GROUPS[1].map((_,j)=>PAIR_GROUPS[1][(i+j)%5]);});
  PAIR_GROUPS[1].forEach((f,i)=>{DISTRACTORS[f]=PAIR_GROUPS[0].map((_,j)=>PAIR_GROUPS[0][(i-j+5)%5]);});
  const DESCRIPTIONS={happy:'a small smile and loose shoulders',sad:'a downturned mouth and lowered shoulders',angry:'slightly drawn brows and a closed mouth',calm:'a relaxed mouth and resting arms',worried:'raised inner brows and hands together',excited:'a small open smile and raised open hands',proud:'a broad closed smile and hands on the chest',surprised:'raised brows, round eyes and a small round mouth',frustrated:'drawn brows, a slanting mouth and open palms',disappointed:'lowered eyes, a small downturned mouth and resting hands'};
  const STORIES=[
  {
    "id": "bubbles",
    "scene": "bubbles",
    "person": "sam",
    "context": "Sam is playing with bubbles.",
    "reportedFeeling": "happy",
    "expression": "happy"
  },
  {
    "id": "rain",
    "scene": "rain",
    "person": "robin",
    "context": "Robin wanted to play outside. It is raining.",
    "reportedFeeling": "sad",
    "expression": "sad"
  },
  {
    "id": "book",
    "scene": "book",
    "person": "jo",
    "context": "Jo is reading in a cosy chair.",
    "reportedFeeling": "calm",
    "expression": "calm"
  },
  {
    "id": "tower",
    "scene": "tower",
    "person": "ali",
    "context": "Ali is building. The tower keeps falling.",
    "reportedFeeling": "angry",
    "expression": "angry"
  },
  {
    "id": "music",
    "scene": "music",
    "person": "robin",
    "context": "Robin hears a favourite song.",
    "reportedFeeling": "excited",
    "expression": "excited"
  },
  {
    "id": "swimming",
    "scene": "swimming",
    "person": "sam",
    "context": "Sam is trying a new swimming class.",
    "reportedFeeling": "worried",
    "expression": "worried"
  },
  {
    "id": "flowers",
    "scene": "flowers",
    "person": "ali",
    "context": "Ali sees a flower in the garden.",
    "reportedFeeling": "happy",
    "expression": "happy"
  },
  {
    "id": "song-ended",
    "scene": "song-ended",
    "person": "jo",
    "context": "Jo's favourite song has ended.",
    "reportedFeeling": "sad",
    "expression": "sad"
  },
  {
    "id": "rest",
    "scene": "rest",
    "person": "sam",
    "context": "Sam is resting under a tree.",
    "reportedFeeling": "calm",
    "expression": "calm"
  },
  {
    "id": "zip",
    "scene": "zip",
    "person": "robin",
    "context": "Robin's zip is stuck.",
    "reportedFeeling": "angry",
    "expression": "angry"
  },
  {
    "id": "picnic",
    "scene": "picnic",
    "person": "jo",
    "context": "Jo is getting ready for a picnic.",
    "reportedFeeling": "excited",
    "expression": "excited"
  },
  {
    "id": "slide",
    "scene": "slide",
    "person": "ali",
    "context": "Ali is trying a new slide.",
    "reportedFeeling": "worried",
    "expression": "worried"
  },
  {
    "id": "drawing",
    "scene": "drawing",
    "person": "sam",
    "context": "Sam has finished a drawing.",
    "reportedFeeling": "proud",
    "expression": "proud"
  },
  {
    "id": "knot",
    "scene": "knot",
    "person": "ali",
    "context": "Ali is trying to untie a knot.",
    "reportedFeeling": "frustrated",
    "expression": "frustrated"
  },
  {
    "id": "butterfly",
    "scene": "butterfly",
    "person": "robin",
    "context": "A butterfly lands near Robin.",
    "reportedFeeling": "surprised",
    "expression": "surprised"
  },
  {
    "id": "empty-pot",
    "scene": "empty-pot",
    "person": "jo",
    "context": "Jo wanted blue paint. The pot is empty.",
    "reportedFeeling": "disappointed",
    "expression": "disappointed"
  },
  {
    "id": "planting",
    "scene": "planting",
    "person": "ali",
    "context": "Ali has planted a seed.",
    "reportedFeeling": "proud",
    "expression": "proud"
  },
  {
    "id": "beads",
    "scene": "beads",
    "person": "sam",
    "context": "Sam is trying to thread a bead.",
    "reportedFeeling": "frustrated",
    "expression": "frustrated"
  },
  {
    "id": "sprout",
    "scene": "sprout",
    "person": "jo",
    "context": "Jo sees a new shoot in the pot.",
    "reportedFeeling": "surprised",
    "expression": "surprised"
  },
  {
    "id": "closed-swings",
    "scene": "closed-swings",
    "person": "robin",
    "context": "Robin wanted the swings. They are closed today.",
    "reportedFeeling": "disappointed",
    "expression": "disappointed"
  }
];
  const PROMPTS={match:'Find the same picture.',different:'A different picture. Look again.',pose:'Copy if you like. Or just look.',me:'A word for my feeling.'};
  const MATCH_OPENERS=['Yes!','Correct!','Good matching!',"That's right!",'You found it!','Well done!'];

  const ME_KEYS=[...FEELINGS,'other','unsure'];
  const person=id=>PEOPLE.find(p=>p.id===id)||PEOPLE[0];
  const matchStatement=(id,feeling)=>person(id).name+' is '+feeling+'.';
  function matchSuccess(round){
    const index=Number.isSafeInteger(round.index)&&round.index>=0?round.index:0;
    const opener=MATCH_OPENERS[index%MATCH_OPENERS.length];
    const statement=matchStatement(round.person,round.feeling);
    return {text:opener+' '+statement,speech:[opener,statement]};
  }
  const acknowledgement=id=>'You chose '+WORDS[ME_KEYS.includes(id)?id:'unsure'].toLowerCase()+'.';
  const statement=story=>person(story.person).name+' says, '+(story.reportedFeeling==='unsure'?"I'm not sure how I feel.":'I feel '+story.reportedFeeling+'.');
  const storyPrompt=story=>story.context+' '+statement(story);
  function shuffle(items,seed){let n=seed>>>0;const a=items.slice();for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function matchRound(index=0,seed=1,filter='all'){
    index=Number.isSafeInteger(index)&&index>=0?index:0;filter=FEELINGS.includes(filter)?filter:'all';
    const deck=PEOPLE.flatMap(p=>(filter==='all'?FEELINGS:[filter]).map(feeling=>({person:p.id,feeling})));
    const cycle=Math.floor(index/deck.length),slot=index%deck.length;
    const target=shuffle(deck,(seed+cycle)>>>0)[slot];
    const candidates=DISTRACTORS[target.feeling],other=candidates[(PEOPLE.findIndex(p=>p.id===target.person)+cycle)%candidates.length];
    const matchSide=shuffle(Array.from({length:deck.length},(_,i)=>i%2),(seed+cycle+91)>>>0)[slot];
    const choices=matchSide===0?[target.feeling,other]:[other,target.feeling];
    return {...target,expressionId:target.person+'-'+target.feeling,choices,index};
  }
  // ---- Round 4 (phase 4): Feelings with Nook ----
  // The four activities in the level pill: Nook feels... (the board of ten; Nook performs the one tapped), Which
  // feeling? (how does Nook feel?), Friends (the twenty stories) and Me (the child's own board).
  const ACTIVITIES=['board','which','friends','me'];
  const ACTIVITY_NAMES={board:'Nook feels…',which:'Which feeling?',friends:'Friends',me:'Me'};
  // The feelings Nook settles from with one visible breath back to calm (items 11 and 65). Happy-side ones skip it.
  // The board's order: the happy side first, then the difficult side with each look-alike beside its pair.
  const BOARD=['happy','calm','proud','excited','surprised','sad','worried','disappointed','angry','frustrated'];
  const DIFFICULT=['sad','angry','worried','frustrated','disappointed'];
  // Look-alike pairs never offered together at level 1 of Which feeling? (item 10).
  const LOOKALIKE={sad:'disappointed',disappointed:'sad',angry:'frustrated',frustrated:'angry'};
  const nookFeels=f=>'Nook feels '+f+'.';
  const youFeel=f=>'You feel '+f+'. Thank you for telling me.';
  const ME_REPLIES={other:'Thank you for telling me.',unsure:"That's OK. Not sure is fine."};
  const meLine=id=>FEELINGS.includes(id)?youFeel(id):ME_REPLIES[id==='other'?'other':'unsure'];
  const LINES={board:'Nook feels… Tap one.',which:'How does Nook feel?',me:'How do you feel?',breath:'Nook takes a breath.',all:'We said all the feelings.',done:'We did it!',type:'Type your words. Then tap the speaker.'};
  // Every new line Feelings says, for phase 5 to render and merge into spokenBank(). Until then the text shows and only
  // the parts that already have clips play (the feeling names, the openers, Not sure and Something else).
  const FEELINGS_SPEECH=[...FEELINGS.map(nookFeels),...FEELINGS.map(youFeel),LINES.breath,ME_REPLIES.other,ME_REPLIES.unsure,LINES.which,LINES.me,LINES.all,LINES.done];
  // Me's one fixed private bundle: every name and every acknowledgement, fetched before any choice (item 57).
  const ME_BUNDLE=[...ME_KEYS.map(id=>WORDS[id]),...ME_KEYS.map(meLine)];
  const WHICH_OPENERS=['Yes!','Correct!',"That's right!",'You found it!','Well done!'];
  const mix=n=>{n=Math.imul((n>>>0)^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
  // Which feeling?: a deterministic deck of Nook's ten feelings, each once per pass of ten (shuffled by the seed and the
  // pass), with two other words. Level 1: one other word from the same side (happy or difficult) and one from the other
  // side, never a look-alike pair; level 2: any two other words, look-alikes included. The answer's place moves round.
  function whichRound(index=0,seed=1,level=1){
    index=Number.isSafeInteger(index)&&index>=0?index:0;seed=(Number.isSafeInteger(seed)&&seed>0?seed:1)>>>0||1;level=level===2?2:1;
    const cycle=Math.floor(index/FEELINGS.length),slot=index%FEELINGS.length;
    const feeling=shuffle(FEELINGS,(seed+cycle)>>>0)[slot];
    const pick=(list,k)=>list[mix(seed*31+index*7+k)%list.length];
    let others;
    if(level===1){
      const same=PAIR_GROUPS.find(g=>g.includes(feeling)).filter(f=>f!==feeling&&f!==LOOKALIKE[feeling]),other=PAIR_GROUPS.find(g=>!g.includes(feeling));
      others=[pick(same,1),pick(other,2)];
      if(mix(seed+index*3)%2)others.reverse();
    }else{const rest=FEELINGS.filter(f=>f!==feeling),first=pick(rest,3);others=[first,pick(rest.filter(f=>f!==first),4)];}
    const at=(slot+cycle+seed)%3,choices=others.slice();choices.splice(at,0,feeling);
    return {feeling,choices,index,level,id:'which:v1:L'+level+':'+feeling+':'+choices.join('-')};
  }
  function whichSuccess(round){
    const index=Number.isSafeInteger(round&&round.index)&&round.index>=0?round.index:0,opener=WHICH_OPENERS[index%WHICH_OPENERS.length],word=WORDS[round&&round.feeling]||'';
    return {text:opener+' '+word+'.',speech:[opener,word]};
  }
  // Saved per player, an allow-list: the activity, the place in Which feeling?'s deck and its level, the Friends story
  // and the deck's seed. Never an answer, a tick or a Me report. Round-3 saves (match, people) open on Which feeling? and
  // Friends.
  function normalise(saved){saved=saved&&typeof saved==='object'?saved:{};const integer=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max?n:0;const legacy={match:'which',people:'friends'};return {version:2,mode:ACTIVITIES.includes(saved.mode)?saved.mode:legacy[saved.mode]||'board',index:integer(saved.index,1000000),level:saved.level===2?2:1,story:integer(saved.story,STORIES.length-1),seed:(integer(saved.seed,0xffffffff)||1)};}
  function spokenBank(){return [...Object.values(WORDS),...Object.values(PROMPTS),...MATCH_OPENERS,...PEOPLE.flatMap(p=>FEELINGS.map(f=>matchStatement(p.id,f))),...ME_KEYS.map(acknowledgement),...STORIES.flatMap(s=>[storyPrompt(s),statement(s)])];}
  function validate(){
    if(new Set(STORIES.map(s=>s.id)).size!==STORIES.length)throw Error('Duplicate story');
    for(const s of STORIES){if(!PEOPLE.some(p=>p.id===s.person)||!ME_KEYS.includes(s.reportedFeeling)||!FEELINGS.includes(s.expression)||s.expression!==s.reportedFeeling||!s.scene||!s.context)throw Error('Invalid story '+s.id);}
    for(const f of FEELINGS)if(!DISTRACTORS[f].length||DISTRACTORS[f].some(d=>d===f||!FEELINGS.includes(d)))throw Error('Invalid expression pair');
    return true;
  }
  const api={FEELINGS,PEOPLE,WORDS,DISTRACTORS,DESCRIPTIONS,STORIES,PROMPTS,MATCH_OPENERS,ME_KEYS,person,matchStatement,matchSuccess,acknowledgement,statement,storyPrompt,shuffle,matchRound,normalise,spokenBank,validate,ACTIVITIES,ACTIVITY_NAMES,BOARD,DIFFICULT,LOOKALIKE,nookFeels,youFeel,ME_REPLIES,meLine,LINES,FEELINGS_SPEECH,ME_BUNDLE,WHICH_OPENERS,whichRound,whichSuccess};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NookFeelings=api;
})(typeof window!=='undefined'?window:globalThis);
