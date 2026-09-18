const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../.wrangler/test-runtime/node_modules/jsdom');
const root=path.join(__dirname,'../public/fireworks/little-patterns');
const F=require('../public/fireworks/little-patterns/feelings-data.js');
const A=require('../public/fireworks/little-patterns/feelings-art.js');
function app(t,{blocked=false,failed=false,delayed=false,seed={},soundOn=false}={}){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'feelings.html'),'utf8'),{url:'http://localhost/little-patterns/feelings.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,errors=[],requests=[],plays=[],players=[],urls=[],revoked=[],pending=[];
  w.addEventListener('error',e=>errors.push(e.error||e.message));
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.Audio=function(){this.src='';this.preload='';this.play=()=>{plays.push(this.src);return Promise.resolve();};this.pause=()=>{};this.load=()=>{};this.removeAttribute=n=>{if(n==='src')this.src='';};players.push(this);};
  w.speechSynthesis={cancel(){},speak(){throw Error('No device speech should be used for Feelings');}};
  w.URL.createObjectURL=()=>{const url='blob:local-'+urls.length;urls.push(url);return url;};w.URL.revokeObjectURL=url=>revoked.push(url);
  w.fetch=async(url,options)=>{requests.push({url,options});if(delayed)await new Promise(resolve=>pending.push(resolve));if(failed)throw Error('Offline');return {ok:true,blob:async()=>new w.Blob(['voice'])};};
  for(const [k,v]of Object.entries(seed))w.localStorage.setItem(k,JSON.stringify(v));
  if(blocked)Object.defineProperty(w,'localStorage',{value:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}});
  for(const s of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,s.getAttribute('src').split('?')[0]),'utf8'));
  // Legacy scenarios explicitly choose mute; startup tests use soundOn:true.
  if(!soundOn)w.LP.audio.mute();
  const query=s=>w.document.querySelector(s);
  const click=s=>{const b=query(s);assert.ok(b,s);assert.ok(!b.closest('[hidden]'),'visible '+s);b.click();};
  const action=(a,v)=>click('[data-action="'+a+'"]'+(v===undefined?'':'[data-value="'+v+'"]'));
  const store=()=>JSON.parse(w.localStorage.getItem('lp-player-'+w.LP.player.id+'-feelings-v1'));
  t.after(()=>{assert.deepEqual(errors,[]);dom.window.close();});
  return {w,query,click,action,store,requests,plays,players,urls,revoked,pending,flush:()=>new Promise(r=>setImmediate(r))};
}
test('Feelings starts with sound on and speaks in each activity without enabling it first',async t=>{
  const a=app(t,{soundOn:true});await a.flush();
  assert.equal(a.w.LP.audio.muted,false);assert.equal(a.query('#page-sound').getAttribute('aria-pressed'),'true');
  for(const mode of ['match','people','me']){
    a.action('mode',mode);const before=a.plays.length;
    if(mode==='match')a.action('hear-match');
    if(mode==='people')a.action('hear-story');
    if(mode==='me')a.action('feeling','happy');
    await a.flush();assert.ok(a.plays.length>before,mode+' speaks');
    a.click('#back');if(mode==='me')a.click('#back');
  }
  a.click('#page-sound');a.action('mode','people');
  assert.equal(a.w.LP.audio.muted,true);const before=a.plays.length;a.action('hear-story');assert.equal(a.plays.length,before);
});

test('every mixed deck covers four people and ten feelings once, with balanced, distinct choices',()=>{
  assert.equal(F.validate(),true);
  for(const seed of [1,2,55,345235])for(let cycle=0;cycle<3;cycle++){
    const rounds=Array.from({length:40},(_,i)=>F.matchRound(cycle*40+i,seed));
    assert.equal(new Set(rounds.map(r=>r.expressionId)).size,40);
    assert.equal(rounds.filter(r=>r.choices[0]===r.feeling).length,20);
    for(const feeling of F.FEELINGS)assert.equal(rounds.flatMap(r=>r.choices).filter(f=>f===feeling).length,8,'equal exposure for '+feeling);
    for(const r of rounds)assert.equal(r.choices.filter(f=>['happy','calm','excited','proud','surprised'].includes(f)).length,1,'no pair of two difficult feelings');
    for(const r of rounds){assert.equal(r.choices.filter(c=>c===r.feeling).length,1);assert.equal(new Set(r.choices).size,2);assert.deepEqual(r,F.matchRound(r.index,seed));}
  }
  for(const f of F.FEELINGS){const rounds=Array.from({length:4},(_,i)=>F.matchRound(i,1,f));assert.equal(new Set(rounds.map(r=>r.person)).size,4);assert.ok(rounds.every(r=>r.feeling===f));}
});
test('art exists for every person/feeling/pose without external image references',()=>{
  const images=new Set();for(const p of F.PEOPLE)for(const f of F.FEELINGS){const s=A.svg(p.id,f);images.add(s);assert.match(s,/role="img" aria-label=/);assert.ok(!/image |href=|https?:\/\/(?!www.w3.org)/.test(s));assert.match(A.svg(p.id,f,{pose:true}),/viewBox="0 0 240 320"/);}
  assert.equal(images.size,40);
});
test('wrong Match choices reveal vocabulary without shuffling or completing; pose Back restores matched state',t=>{
  const a=app(t);a.action('mode','match');const target=a.query('[data-action="hear-match"]').getAttribute('aria-label');
  const options=()=>[...a.w.document.querySelectorAll('[data-action="match"]')].map(b=>b.dataset.value);
  const before=options(),right=before.find(f=>target.startsWith('Hear '+F.WORDS[f]+'.')),wrong=before.find(f=>f!==right);
  a.action('match',wrong);assert.deepEqual(options(),before);assert.match(a.query('#status').textContent,/different/);assert.equal(a.query('[data-action="match"][data-value="'+wrong+'"] .choice-word').textContent,F.WORDS[wrong].toUpperCase());
  assert.equal(a.query('[data-action="pose"]'),null);
  a.action('match',right);a.action('pose');assert.match(a.query('#status').textContent,/Or just look/);a.click('#back');assert.ok(a.query('[data-action="pose"]'));
  a.action('next');assert.equal(a.query('[data-action="pose"]'),null);assert.equal(a.plays.length,0);
});
test('Match can be skipped and any word chosen without completing a round',t=>{
  const a=app(t);a.action('mode','match');a.action('next');assert.equal(a.store().index,1);
  a.click('#menu-open');a.click('#choose-puzzle');a.action('filter','angry');assert.equal(a.store().filter,'angry');assert.match(a.query('.target .word').textContent,/ANGRY/);
});

test('Match praise rotates independently of the feeling and names the actual pictured person',()=>{
 assert.deepEqual(F.MATCH_OPENERS,['Yes!','Correct!','Good matching!',"That's right!",'You found it!','Well done!']);
 for(const p of F.PEOPLE)for(const feeling of F.FEELINGS){
  const responses=Array.from({length:6},(_,index)=>F.matchSuccess({person:p.id,feeling,index}));
  assert.equal(new Set(responses.map(r=>r.text)).size,6);
  for(let index=0;index<6;index++){
   assert.equal(responses[index].text,F.MATCH_OPENERS[index]+' '+p.name+' is '+feeling+'.');
   assert.equal(responses[index].speech.join(' '),responses[index].text);
  }
 }
});

test('correct matches show and speak the same full response, retain it on Back and replay, and cancel on Next',t=>{
 const a=app(t);a.click('#page-sound');a.action('mode','match');
 const clipKey=s=>s.toLowerCase().replace(/[.!?]+$/,'');
 for(let i=0;i<6;i++){
  const picture=a.query('.target svg'),id=picture.dataset.person,feeling=picture.dataset.expression;
  const expected=F.matchSuccess({person:id,feeling,index:a.store().index});
  a.action('match',feeling);assert.equal(a.query('#status').textContent,expected.text);
  assert.equal(a.plays.at(-1),a.w.LPVoiceLibrary.clips[clipKey(expected.speech[0])].file);
  a.players[0].onended();assert.equal(a.plays.at(-1),a.w.LPVoiceLibrary.clips[clipKey(expected.speech[1])].file);
  a.action('pose');a.click('#back');assert.equal(a.query('#status').textContent,expected.text);
  a.click('#menu-open');a.click('#hear-again');assert.equal(a.plays.at(-1),a.w.LPVoiceLibrary.clips[clipKey(expected.speech[0])].file);
  const oldEnd=a.players[0].onended;a.click('#back');a.action('next');const before=a.plays.length;oldEnd();assert.equal(a.plays.length,before);
 }
 a.click('#page-sound');const before=a.plays.length;a.action('match',a.query('.target svg').dataset.expression);assert.equal(a.plays.length,before);assert.match(a.query('#status').textContent,/ is /);
});
test('People teaches every feeling explicitly, with varied balanced scenes and only Hear/Next',t=>{
  const a=app(t);a.action('mode','people');
  assert.equal(F.STORIES.length,20);
  assert.equal(new Set(F.STORIES.map(s=>s.scene)).size,20);
  for(const f of F.FEELINGS)assert.equal(F.STORIES.filter(s=>s.reportedFeeling===f).length,2);
  for(let i=0;i<F.STORIES.length;i++){
    const story=F.STORIES[i];
    assert.equal(a.query('.story-feeling strong').textContent,F.WORDS[story.reportedFeeling].toUpperCase());
    assert.equal(a.query('.people-context').textContent,story.context);
    assert.equal(a.query('.story-art').dataset.scene,story.scene);
    assert.equal(a.w.document.querySelectorAll('#task button').length,2);
    assert.equal(a.query('[data-action="ask"]'),null);assert.equal(a.query('[data-action="possibility"]'),null);
    assert.equal(a.query('#status').textContent,'');
    assert.ok(!/image |href=|sixty/.test(A.scene(story)));
    a.action('hear-story');assert.equal(a.plays.length,0,'Hear respects sound off');
    a.action('next');
  }
  assert.equal(a.store().story,0,'Next cycles without completing anything');
  a.click('#menu-open');a.click('#choose-puzzle');a.action('story','11');
  assert.equal(a.query('.story-art').dataset.scene,F.STORIES[11].scene,'any story stays open');
});

test('People narrates context and named feeling together, replays locally and stops on leaving',t=>{
  const a=app(t);a.click('#menu-open');a.click('[data-sound]');a.click('#back');a.action('mode','people');
  assert.equal(a.plays.length,1);assert.match(a.plays[0],/assets\/voice\/.+\.wav$/);
  assert.equal(a.query('.sound-note').hidden,true);
  a.action('hear-story');assert.equal(a.plays[0],a.plays[1]);
  a.action('next');assert.notEqual(a.plays[1],a.plays[2]);
  for(const story of F.STORIES){const narration=F.storyPrompt(story);assert.ok(narration.includes(story.context));assert.ok(narration.includes(F.statement(story)));}
  a.click('#back');assert.equal(a.players[0].src,'');
});

test('all fixed Me reports are accepted, unsaved, and use only the fixed local audio bundle',async t=>{
  const a=app(t);a.click('#menu-open');a.click('[data-sound]');a.click('#back');a.action('mode','me');await a.flush();
  assert.equal(a.requests.length,12);assert.equal(a.urls.length,12);assert.ok(a.requests.every(r=>r.options.credentials==='omit'));
  const before=JSON.stringify(a.store());
  for(const feeling of F.ME_KEYS.filter(f=>f!=='other')){
    a.action('feeling',feeling);assert.equal(a.query('[data-action="hear-me"]').getAttribute('aria-label'),'Hear '+F.WORDS[feeling]);a.action('hear-me');assert.match(a.plays.at(-1),/^blob:/);
    a.click('#back');assert.equal(JSON.stringify(a.store()),before);assert.equal(a.requests.length,12);
  }
  assert.equal(a.players.length,1,'one shared audio player');
  a.action('feeling','unsure');a.click('#back');a.click('#back');assert.equal(a.query('[data-action="hear-me"]'),null);a.action('mode','me');assert.ok(a.query('.me-options'));
});
test('a late or failed private voice bundle never speaks an old choice or falls back to a request',async t=>{
  const a=app(t,{delayed:true});a.click('#menu-open');a.click('[data-sound]');a.click('#back');a.action('mode','me');a.action('feeling','sad');assert.equal(a.plays.length,0);a.click('#back');a.click('#back');
  a.pending.forEach(r=>r());await a.flush();assert.equal(a.plays.length,0);assert.equal(a.requests.length,12);
  const b=app(t,{failed:true});b.action('mode','me');await b.flush();b.action('feeling','angry');b.action('hear-me');assert.equal(b.plays.length,0);assert.equal(b.requests.length,12);
});
test('Me private state clears on navigation, bfcache and switching players, including live status',async t=>{
  const seed={'lp-players':[{id:'one',name:'First',avatar:'🌱'},{id:'two',name:'Second',avatar:'🌱'}],'lp-active-player':'one'};
  const a=app(t,{seed});a.action('mode','me');await a.flush();a.action('feeling','sad');a.click('#menu-open');a.click('[data-player]');
  const second=[...a.w.document.querySelectorAll('.saved-text')].find(b=>b.textContent.includes('Second'));second.click();
  assert.equal(a.w.LP.player.id,'two');assert.ok(!a.query('#activity').textContent.includes('You chose'));assert.equal(a.query('[data-action="hear-me"]'),null);
  a.action('mode','me');a.action('feeling','angry');a.w.dispatchEvent(new a.w.Event('pagehide'));assert.equal(a.query('[data-action="hear-me"]'),null);assert.equal(a.revoked.length,12);
  const event=new a.w.Event('pageshow');Object.defineProperty(event,'persisted',{value:true});a.w.dispatchEvent(event);assert.match(a.query('#screen-title').textContent,/Feelings/);
  const texts=Object.values(a.w.localStorage).join(' ');assert.ok(!texts.includes('You chose'));assert.ok(!texts.includes('meChoice'));
});
test('late private assets are discarded when the page is left',async t=>{
  const a=app(t,{delayed:true});a.action('mode','me');a.w.dispatchEvent(new a.w.Event('pagehide'));a.pending.forEach(r=>r());await a.flush();assert.equal(a.urls.length,0);assert.equal(a.plays.length,0);
});
test('blocked storage, softer colours and lowercase work without collecting a feeling',t=>{
  const a=app(t,{blocked:true});a.action('mode','me');a.click('#menu-open');a.click('#open-settings');const form=a.query('#feelings-settings');form.elements.case.value='lower';form.elements.soft.checked=true;form.dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));a.click('#back');assert.ok(a.w.document.body.classList.contains('softer'));assert.equal(a.query('.me-choice span').textContent,'happy');
});
test('round position and filter restore per player, but not answers or Me reports',t=>{
  const seed={'lp-player-player-1-feelings-v1':{mode:'match',index:8,filter:'worried',seed:777,story:6,meChoice:'angry',matched:true}};
  const a=app(t,{seed});a.action('mode','match');assert.equal(a.store().index,8);assert.equal(a.query('.target .word').textContent,'WORRIED');assert.ok(a.query('.match-options'));assert.deepEqual(Object.keys(a.store()).sort(),['version','mode','index','story','filter','seed'].sort());
});
test('mute, menu, background and activity changes cancel private playback without new requests',async t=>{
  const a=app(t);a.click('#menu-open');a.click('[data-sound]');a.click('#back');a.action('mode','me');await a.flush();a.action('feeling','sad');
  const player=a.players[0];assert.match(player.src,/^blob:/);a.click('#menu-open');assert.equal(player.src,'');
  a.click('#hear-again');assert.match(player.src,/^blob:/);a.click('[data-sound]');assert.equal(player.src,'');a.click('#hear-again');assert.equal(player.src,'');
  a.click('[data-sound]');a.click('#hear-again');a.click('#open-about');assert.equal(player.src,'');
  a.click('#back');a.click('#back');assert.ok(a.query('[data-action="hear-me"]'));
  Object.defineProperty(a.w.document,'hidden',{configurable:true,value:true});a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));assert.equal(a.w.LP.audio.muted,false);assert.equal(player.src,'');
  Object.defineProperty(a.w.document,'hidden',{configurable:true,value:false});a.w.document.dispatchEvent(new a.w.Event('visibilitychange'));assert.equal(player.src,'');assert.ok(a.query('[data-action="hear-me"]'),'visibility alone can retain a card to show someone');
  a.click('#back');assert.equal(a.query('[data-action="hear-me"]'),null);assert.equal(a.requests.length,12);
});
test('menu and picker keyboard focus stays on a visible control after changing screens',t=>{
  const a=app(t);a.action('mode','match');a.click('#menu-open');assert.ok(a.w.document.activeElement.matches('[data-sound]'));
  a.click('#back');assert.equal(a.w.document.activeElement.id,'menu-open');a.click('#menu-open');a.click('#choose-puzzle');a.action('filter','sad');
  const controls=[...a.w.document.querySelectorAll('#task button')];assert.ok(controls.every(b=>b.type==='button'));
  assert.equal(a.w.document.querySelectorAll('[aria-live]').length,1,'a single feedback region');
});

test('Me shows all ten feelings and both extra choices, with only Back on the character screen',async t=>{
 const a=app(t);await a.flush();a.click('#page-sound');a.action('mode','me');
 const cards=[...a.w.document.querySelectorAll('.me-choice')];
 assert.deepEqual(cards.map(c=>c.dataset.value),F.FEELINGS);
 assert.equal(a.w.document.querySelectorAll('#task [data-action=feeling]').length,12);
 assert.equal(a.query('[data-action=more]'),null);
 assert.equal(a.query('#page-sound').closest('[hidden]'),null);
 for(const feeling of F.ME_KEYS.filter(f=>f!=='other')){
  const before=a.plays.length;
  a.action('feeling',feeling);assert.equal(a.plays.length,before+1,'first tap speaks');
  const expected=a.urls[F.ME_KEYS.indexOf(feeling)];assert.equal(a.plays.at(-1),expected);
  assert.ok(a.requests[F.ME_KEYS.indexOf(feeling)].url===a.w.LPVoiceLibrary.clips[F.WORDS[feeling].toLowerCase()].file,'preloaded clip is the bare name');
  a.action('hear-me');assert.equal(a.plays.at(-1),expected,'character repeats same name');
  assert.equal(a.w.document.querySelectorAll('#task button').length,1);
  assert.ok(!/Hear my words|You chose|Change|Done/.test(a.query('#task').textContent));
  a.click('#back');assert.equal(a.w.document.activeElement.dataset.value,feeling);
  assert.equal(a.w.document.querySelectorAll('.me-choice').length,10);
 }
 a.click('#page-sound');const mutedPlays=a.plays.length;a.action('feeling','happy');a.action('hear-me');assert.equal(a.plays.length,mutedPlays);
});

test('Something else reads arbitrary text with only a local voice, never requests a matching library clip or saves text',async t=>{
 const a=app(t);await a.flush();const utterances=[];
 a.w.SpeechSynthesisUtterance=function(text){this.text=text;};
 const local={name:'Local English',lang:'en-GB',localService:true},remote={name:'Remote',lang:'en-GB',localService:false,default:true};
 a.w.speechSynthesis=Object.assign(new a.w.EventTarget(),{getVoices:()=>[remote,local],speak:u=>utterances.push(u),cancel(){}});
 a.action('mode','me');a.action('feeling','other');assert.ok(a.query('#other-feeling'));
 const input=a.query('#other-feeling');input.value='happy';input.dispatchEvent(new a.w.Event('input'));a.click('#other-feeling');await a.flush();assert.equal(utterances.length,0,'mute stays muted');
 a.click('#page-sound');const before=a.requests.length,plays=a.plays.length;a.click('#other-feeling');await a.flush();
 assert.equal(utterances.at(-1).text,'happy');assert.equal(utterances.at(-1).voice,local);assert.equal(a.plays.length,plays,'even a built-in feeling avoids a selection-dependent clip');
 input.value='I feel wobbly today';input.dispatchEvent(new a.w.Event('input'));a.click('#other-feeling');await a.flush();assert.equal(utterances.at(-1).text,input.value);
 assert.equal(a.requests.length,before);assert.ok(!Object.values(a.w.localStorage).join(' ').includes('wobbly'));
 a.click('#back');a.action('feeling','other');assert.equal(a.query('#other-feeling').value,'');
 a.query('#other-feeling').value='private';a.query('#other-feeling').dispatchEvent(new a.w.Event('input'));a.w.dispatchEvent(new a.w.Event('pagehide'));a.action('mode','me');a.action('feeling','other');assert.equal(a.query('#other-feeling').value,'');
});

test('typed feelings never use a remote voice; pending speech is cancelled by edits or exit',async t=>{
 const a=app(t);await a.flush();const utterances=[],voices=[];a.w.SpeechSynthesisUtterance=function(text){this.text=text;};
 a.w.speechSynthesis=Object.assign(new a.w.EventTarget(),{getVoices:()=>voices,speak:u=>utterances.push(u),cancel(){}});
 a.click('#page-sound');a.action('mode','me');a.action('feeling','other');const input=a.query('#other-feeling');input.value='old feeling';input.dispatchEvent(new a.w.Event('input'));a.click('#other-feeling');
 input.value='new feeling';input.dispatchEvent(new a.w.Event('input'));voices.push({name:'Local',lang:'en-GB',localService:true});a.w.speechSynthesis.dispatchEvent(new a.w.Event('voiceschanged'));await a.flush();assert.equal(utterances.length,0);
 voices.splice(0,1,{name:'Remote',lang:'en-GB',localService:false});a.click('#other-feeling');await new Promise(r=>setTimeout(r,1050));assert.equal(utterances.length,0);assert.match(a.query('#status').textContent,/No offline English voice/);assert.equal(a.requests.length,12);
});

test('typed-feeling guidance is spoken without opening the keyboard; speaker plays text and empty action returns to typing',async t=>{
 const a=app(t);await a.flush();const utterances=[];
 a.w.SpeechSynthesisUtterance=function(text){this.text=text;};
 a.w.speechSynthesis=Object.assign(new a.w.EventTarget(),{getVoices:()=>[{name:'Local',lang:'en-GB',localService:true}],speak:u=>utterances.push(u),cancel(){}});
 a.click('#page-sound');a.action('mode','me');const requests=a.requests.length;
 a.action('feeling','other');await a.flush();assert.equal(a.w.document.activeElement.id,'other-guide');
 assert.equal(utterances.at(-1).text,'Type your words. Then tap the speaker.');
 assert.ok(a.query('label[for="other-feeling"] .typing-cue'));assert.ok(a.query('[data-action="say-other"] .say-cue'));
 assert.ok(!a.query('[data-action="say-other"]').disabled);
 a.action('say-other');await a.flush();assert.equal(a.w.document.activeElement.id,'other-feeling');
 const input=a.query('#other-feeling');input.value='clever';input.dispatchEvent(new a.w.Event('input'));
 assert.ok(a.query('[data-action="say-other"]').classList.contains('ready'));
 a.action('say-other');await a.flush();assert.equal(utterances.at(-1).text,'clever');
 assert.equal(input.value,'clever');assert.equal(a.requests.length,requests);
 a.click('#page-sound');const spoken=utterances.length;a.action('say-other');await a.flush();assert.equal(utterances.length,spoken);assert.equal(a.w.document.activeElement.id,'page-sound');
 a.click('#back');a.action('feeling','other');assert.equal(a.query('#other-feeling').value,'');
});
