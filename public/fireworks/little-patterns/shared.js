(function(){
  'use strict';
  const L=window.GardenLearning,KEY='little-patterns-v1';
  // Keep a session copy too: private/blocked storage must not mix players or lose
  // their current work when they switch within this visit.
  const sessionValues=new Map();
  const rawStorage={
    get(key,fallback){try{const text=sessionValues.has(key)?sessionValues.get(key):localStorage.getItem(key);return text===null||text===undefined?fallback:JSON.parse(text);}catch(_){return fallback;}},
    set(key,value){const text=JSON.stringify(value);sessionValues.set(key,text);try{localStorage.setItem(key,text);return true;}catch(_){return false;}},
    removePrefix(prefix){const keys=new Set(sessionValues.keys());try{Object.keys(localStorage).forEach(key=>keys.add(key));}catch(_){}for(const key of keys){if(!key.startsWith(prefix))continue;sessionValues.delete(key);try{localStorage.removeItem(key);}catch(_){}}}
  };
  window.addEventListener('storage',event=>{if(event.key)sessionValues.delete(event.key);else sessionValues.clear();});
  const AVATARS=['🌱','🐱','🐶','🐸','🦊','🐼','🐳','🦋'];
  let profiles=rawStorage.get('lp-players',[]);if(!Array.isArray(profiles))profiles=[];
  profiles=profiles.filter(p=>p&&typeof p.id==='string'&&/^[a-zA-Z0-9-]{1,50}$/.test(p.id)&&typeof p.name==='string').slice(0,12).map(p=>({id:p.id,name:p.name.slice(0,24),avatar:AVATARS.includes(p.avatar)?p.avatar:AVATARS[0]}));
  if(!profiles.length){profiles=[{id:'player-1',name:'Player 1',avatar:AVATARS[0]}];rawStorage.set('lp-players',profiles);}
  let player=profiles.find(p=>p.id===rawStorage.get('lp-active-player',''))||profiles[0];
  // These IDs only namespace local browser storage. No network requests contain them.
  const storage={get(key,fallback){return rawStorage.get('lp-player-'+player.id+'-'+key,fallback);},set(key,value){return rawStorage.set('lp-player-'+player.id+'-'+key,value);}};
  let prefs=L.normalisePrefs(storage.get(KEY,rawStorage.get(KEY,{})));
  function savePrefs(value){prefs=L.normalisePrefs(value);const saved=storage.set(KEY,prefs);document.body.classList.toggle('softer',prefs.soft);document.dispatchEvent(new CustomEvent('lp:preferences',{detail:{...prefs}}));return saved;}
  function status(text){const target=document.getElementById('status');if(target)target.textContent=text;}
  let muted=false,context=null,noteTimer=null,musicWanted=false,musicPaused=false,noteIndex=0,speechRequest=0,clipPlayer=null;const voices=new Set();
  let musicActivated=false,musicStarting=false;
  // A gentle, newly synthesised arrangement of the traditional folk melody.
  // Source melody: https://en.wikipedia.org/wiki/Korobeiniki#Melody
  // No recording, game soundtrack, accompaniment or licensed arrangement is used.
  const phrase=[[64,1.5],[68,.5],[71,1],[68,.5],[64,.5],[69,1.5],[72,.5],[76,1],[74,.5],[72,.5],[71,1.5],[72,.5],[74,1],[76,1],[72,1],[69,1],[69,2],[77,1.5],[79,.5],[81,1],[79,.5],[77,.5],[76,1.5],[77,.5],[76,1],[74,.5],[72,.5],[71,1.5],[72,.5],[74,1],[76,1],[72,1],[69,1],[69,2]];
  function stopNotes(){clearTimeout(noteTimer);noteTimer=null;voices.forEach(v=>{try{v.stop();}catch(_){}});voices.clear();}
  function stopSpeech(){speechRequest++;if(clipPlayer){clipPlayer.pause();clipPlayer.onended=null;clipPlayer.onerror=null;clipPlayer.removeAttribute('src');clipPlayer.load();}if('speechSynthesis' in window)window.speechSynthesis.cancel();}
  function updateSound(){document.querySelectorAll('[data-sound]').forEach(b=>{b.textContent=muted?'♪ Sound: off':'♪ Sound: on';b.setAttribute('aria-pressed',String(!muted));});}
  async function wake(){if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');context=new Audio();}if(context.state==='suspended')await context.resume();}
  // A short, softly filtered noise hit: original percussion, no audio download.
  // Reuse one small mono buffer and schedule on the melody's own beat clock.
  let snareBuffer=null,musicBeat=0;
  const beatSeconds=.47;
  function snare(at){
    if(!snareBuffer){
      snareBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.14),context.sampleRate);
      const samples=snareBuffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    }
    const noise=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    noise.buffer=snareBuffer;filter.type='bandpass';filter.frequency.value=1800;filter.Q.value=.7;
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(.045,at+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.12);
    noise.connect(filter);filter.connect(gain);gain.connect(context.destination);
    voices.add(noise);
    noise.onended=()=>{voices.delete(noise);noise.disconnect();filter.disconnect();gain.disconnect();};
    noise.start(at);noise.stop(at+.14);
  }
  function nextNote(){
    if(muted||!musicWanted||musicPaused||document.hidden||!context)return;
    const [midi,beats]=phrase[noteIndex++%phrase.length],duration=beats*beatSeconds,at=context.currentTime;
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type='triangle';osc.frequency.value=440*Math.pow(2,(midi-69)/12);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.022,at+.025);
    gain.gain.setValueAtTime(.016,at+Math.max(.04,duration-.08));gain.gain.linearRampToValueAtTime(0,at+duration);
    osc.connect(gain);gain.connect(context.destination);voices.add(osc);
    osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
    osc.start(at);osc.stop(at+duration);
    // Backbeat on beats two and four, including beats inside longer melody notes.
    for(let beat=Math.ceil(musicBeat);beat<musicBeat+beats;beat++){
      if(beat%2===1)snare(at+(beat-musicBeat)*beatSeconds);
    }
    musicBeat+=beats;
    noteTimer=setTimeout(nextNote,duration*1000);
  }
  function stopBackgroundAudio(){stopNotes();stopSpeech();if(context)context.suspend().catch(()=>{});}
  // A very quiet bell for a finished row in Colour Blocks: one soft note, or a quick climbing run that lands on a brighter ringing note when several rows go at once. Silent when Sound is off.
  async function chime(count=1){if(muted||document.hidden)return;try{await wake();}catch(_){return;}const notes=[523.25,659.25,783.99,1046.5],n=Math.max(1,Math.min(4,count)),t0=context.currentTime+.02;const ring=(f,at,level,len)=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(level,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+len);o.connect(g);g.connect(context.destination);o.start(at);o.stop(at+len+.05);};for(let i=0;i<n-1;i++)ring(notes[i],t0+i*.085,.03,.2);const last=t0+(n-1)*.085;ring(notes[n-1],last,.045,1);ring(notes[n-1]*2,last,.014,.6);if(n>1)ring(notes[n-1]*1.5,last+.004,.02,.85);}
  async function startMusic(){
    if(!musicActivated||musicStarting||noteTimer!==null||muted||!musicWanted||musicPaused||document.hidden)return;
    musicStarting=true;
    try{await wake();if(!muted&&!musicPaused&&!document.hidden)nextNote();}
    catch(_){status('Music is unavailable. You can keep playing.');}
    finally{musicStarting=false;}
  }
  async function setMuted(value){muted=value;updateSound();if(muted){stopBackgroundAudio();return;}await startMusic();}
  function localEnglishVoices(){
    if(!window.speechSynthesis||typeof window.speechSynthesis.getVoices!=='function')return [];
    return window.speechSynthesis.getVoices().filter(voice=>voice.localService===true&&/^en(?:[-_]|$)/i.test(voice.lang));
  }
  function waitForLocalVoices(){
    const ready=localEnglishVoices();if(ready.length)return Promise.resolve(ready);
    return new Promise(resolve=>{
      const synth=window.speechSynthesis;
      let timer;
      const finish=()=>{clearTimeout(timer);synth.removeEventListener?.('voiceschanged',changed);resolve(localEnglishVoices());};
      const changed=()=>{if(localEnglishVoices().length)finish();};
      synth.addEventListener?.('voiceschanged',changed);
      timer=setTimeout(finish,1000);
    });
  }
  const clipKey=text=>String(text).trim().toLowerCase().replace(/\s+/g,' ').replace(/[.!?]+$/,'');
  // Bundled clips play one after another from a single reusable player, so a line such as "Yes! Two plus one equals three" needs no clip of its own.
  function playClips(clips,request){
    if(!clipPlayer){clipPlayer=new Audio();clipPlayer.preload='none';}
    clipPlayer.volume=.65;
    const failed=()=>{if(request===speechRequest&&!muted)status('That voice clip could not play. Tap the word to try again.');};
    let next=0;
    const play=()=>{if(request!==speechRequest||muted||document.hidden||next>=clips.length)return;clipPlayer.src=clips[next++].file;clipPlayer.onended=play;clipPlayer.onerror=failed;try{const playing=clipPlayer.play();if(playing?.catch)playing.catch(failed);}catch(_){failed();}};
    play();
  }
  // Automatic feedback uses bundled clips only and respects mute. The explicit
  // private-text entry point also respects mute, but bypasses clips entirely and
  // uses only an installed local voice, avoiding selection-dependent requests.
  async function speak(text,options={}){
    stopSpeech();const request=speechRequest;
    const auto=options.auto===true;
    if(auto&&muted)return;
    const parts=(Array.isArray(text)?text:[text]).map(clipKey).filter(Boolean);
    const library=window.LPVoiceLibrary?.clips;
    const clips=parts.map(key=>!options.private&&library&&Object.prototype.hasOwnProperty.call(library,key)?library[key]:null);
    if(clips.length&&clips.every(Boolean)){
      // Start from the tap itself for iPad audio permissions; no fetch/decoding queue.
      // One reusable player, no preload, no text or player data in requests.
      if(document.hidden)return;
      setMuted(false);
      playClips(clips,request);
      return;
    }
    if(auto&&!options.private)return;
    text=Array.isArray(text)?text.join(' '):text;
    // Private familiar words outside the fixed library stay on the device.
    if(!('speechSynthesis' in window)){status('Voice is unavailable on this device. You can keep playing.');return;}
    if(!options.private)await setMuted(false);
    if(request!==speechRequest||muted||document.hidden)return;
    const available=await waitForLocalVoices();
    if(request!==speechRequest||muted||document.hidden)return;
    if(!available.length){status('No offline English voice is available. Add an English voice in your device settings, then try again.');return;}
    // Only explicitly local voices: never fall back to a remote/default service.
    // A mild pitch lift and unhurried pace give a friendly tone; voice age varies by device.
    const score=voice=>(/^en[-_]GB$/i.test(voice.lang)?10:0)+(/hazel|serena|kate|martha|samantha|zira|karen|moira|tessa|shelley|sandy/i.test(voice.name)?3:0)+(voice.default?1:0);
    available.sort((a,b)=>score(b)-score(a));
    const utterance=new SpeechSynthesisUtterance(String(text).slice(0,500));
    utterance.voice=available[0];utterance.lang=available[0].lang;utterance.rate=.85;utterance.pitch=1.15;utterance.volume=.65;
    utterance.onerror=e=>{if(request===speechRequest&&!['canceled','interrupted'].includes(e.error))status('Voice is unavailable. You can keep playing.');};
    window.speechSynthesis.speak(utterance);
  }
  // Self-report screens must not request a different asset for each answer. Fetch
  // the entire fixed vocabulary first, then use Blob URLs with the SAME player.
  // A late response may fill the bundle, but can never replay an earlier choice.
  function prepareLocalClips(texts){
    const clips=new Map();let disposed=false;
    const keys=[...new Set(texts.map(clipKey))];
    const ready=Promise.all(keys.map(async key=>{
      const entry=window.LPVoiceLibrary?.clips?.[key];
      if(!entry||!/^assets\/voice\/[a-f0-9]{16}\.wav$/.test(entry.file))return;
      try{
        const response=await fetch(entry.file,{credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok)return;const blob=await response.blob();
        if(disposed)return;
        clips.set(key,{file:URL.createObjectURL(blob)});
      }catch(_){/* Text remains usable; never request a selected clip as fallback. */}
    }));
    return {ready,
      speak(text){stopSpeech();const clip=clips.get(clipKey(text));if(disposed||muted||document.hidden||!clip)return false;playClips([clip],speechRequest);return true;},
      dispose(){disposed=true;stopSpeech();for(const clip of clips.values())URL.revokeObjectURL(clip.file);clips.clear();}
    };
  }
  const audio={chime,speak,speakPrivate:text=>speak(text,{auto:true,private:true}),stopSpeech,prepareLocalClips,mute:()=>setMuted(true),setMusic(value){musicWanted=value;if(!value)stopNotes();},pause(){musicPaused=true;stopNotes();stopSpeech();},async resume(){musicPaused=false;await startMusic();},get muted(){return muted;}};
  document.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',()=>setMuted(!muted)));
  // Browsers unlock music on interaction. Never need a separate Sound toggle.
  // Use bubbling so a tap on Mute/Pause takes effect before trying to play.
  ['click','keydown'].forEach(name=>window.addEventListener(name,()=>{musicActivated=true;startMusic();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBackgroundAudio();});window.addEventListener('pagehide',stopBackgroundAudio);
  let modal=null,previousFocus=null,closed=null;
  function closeModal(result=false){if(!modal)return;modal.remove();modal=null;const page=document.getElementById('page');if(page)page.removeAttribute('inert');document.body.style.overflow='';if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});const callback=closed;closed=null;if(callback)callback(result);document.dispatchEvent(new Event('lp:dialogclosed'));}
  function openModal(html,callback){if(modal)closeModal();previousFocus=document.activeElement;closed=callback||null;audio.pause();document.dispatchEvent(new Event('lp:dialogopened'));modal=document.createElement('div');modal.className='lp-modal';modal.innerHTML='<section class="lp-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">'+html+'</section>';document.body.appendChild(modal);const page=document.getElementById('page');if(page)page.setAttribute('inert','');document.body.style.overflow='hidden';modal.querySelector('button,input,select,textarea')?.focus();modal.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal();});return modal;}
  document.addEventListener('keydown',e=>{if(!modal)return;if(e.key==='Escape'){e.preventDefault();closeModal();return;}if(e.key==='Tab'){const items=Array.from(modal.querySelectorAll('button,input,select,textarea,a[href]')).filter(el=>!el.disabled&&!el.closest('[hidden]'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  function confirmAction(title,copy,action='Start fresh'){return new Promise(resolve=>{const el=openModal('<h2 id="dialog-title"></h2><p id="confirm-copy"></p><div class="lp-dialog-actions"><button data-close>Keep playing</button><button class="lp-primary" id="confirm-action"></button></div>',resolve);el.querySelector('#dialog-title').textContent=title;el.querySelector('#confirm-copy').textContent=copy;el.querySelector('#confirm-action').textContent=action;el.querySelector('#confirm-action').onclick=()=>closeModal(true);});}
  function settings(){const block=document.body.dataset.game==='blocks';const html='<div class="lp-dialog-heading"><h2 id="dialog-title">Make it feel right</h2><button data-close aria-label="Close settings">×</button></div><p>Changes stay on this device. Nothing needs a spoken answer.</p><form id="lp-settings">'+(block?'<label>Blocks move<select name="pace"><option value="0">Only when tapped</option><option value="1800">Automatically · very slowly</option><option value="850">Automatically · steady pace</option></select></label>':'<p class="lp-small">Count, Add, Number words and Patterns each have levels. Choose a level from the activity’s own picker; levels never change on their own.</p><label>Count, letters and pattern choices<select name="choices"><option value="2">Two choices · more support</option><option value="3">Three choices · more exploring</option></select><small>Missing-word sentences always show three words.</small></label><label>Count answer<select name="countAnswer"><option value="choose">Choose from numbers</option><option value="type">Type it on a number keypad</option></select></label><label>Addition answer<select name="addition"><option value="choose">Choose from three numbers</option><option value="type">Type it on a number keypad</option><option value="demo">Just show me the answer</option></select></label><label>Number words<select name="numberWords"><option value="show">Show the objects, number and word</option><option value="choose">Let me choose the word</option><option value="type">Let me type the word</option></select></label><label>Letters<select name="case"><option value="upper">UPPERCASE</option><option value="lower">lowercase</option></select></label><label>Typing keyboard<select name="keyboard"><option value="az">Big A–Z keys</option><option value="device">Device keyboard</option></select></label><label>Familiar words (one per line)<textarea name="customWords" rows="4" maxlength="750" placeholder="DINOSAUR&#10;RAINBOW"></textarea><small>Up to 24 words or short phrases. They join the missing-letter spelling puzzles.</small></label><label>Familiar sentences (one per line, missing word in CAPITALS)<textarea name="customSentences" rows="3" maxlength="800" placeholder="Arthur likes TRAINS.&#10;We go to the PARK."></textarea><small>Up to 12 sentences of two to eight words (60 characters). The word in capitals is the gap: make it clearly different from the other familiar words, because the words in capitals in your other sentences are used as the wrong answers. The gap word cannot have an apostrophe (the A to Z keys have none). They join Missing word and Word order. Words without a Mulberry symbol show no picture, and these private sentences use the device voice rather than the bundled one.</small></label><p id="sentence-problems" class="lp-small lp-error" role="status" hidden></p>')+'<label class="lp-check"><input type="checkbox" name="soft"> Softer colours</label><p class="lp-small">Sound starts on. Tap Sound to turn it off. Sound: on / off shows the state and switches it; sentences, words and letters are spoken only while it is on. No timers, lost lives, badges or automatic puzzle changes.</p>'+(block?'<p class="lp-small">Keyboard: arrows move and turn, Space places, P pauses. Hold Down to move faster. Opening settings pauses your board.</p>':'<p class="lp-small">New puzzle settings start fresh examples. Built-in words and sentences use the same bundled Jenny (Dioco) voice on every device. Familiar words you add use an installed offline English voice and stay on this device. Word pictures are Mulberry Symbols by Steve Lee (CC BY-SA 4.0), mulberrysymbols.org.</p>')+'<div class="lp-dialog-actions"><button type="button" data-close>Cancel</button><button class="lp-primary" type="submit">Save settings</button></div></form>';
    const el=openModal(html),form=el.querySelector('form');Object.keys(prefs).forEach(key=>{const input=form.elements.namedItem(key);if(!input)return;if(key==='soft')input.checked=prefs[key];else if(key==='customWords'||key==='customSentences')input.value=prefs[key].join('\n');else input.value=prefs[key];});
    // Familiar sentences are validated visibly: each rejected line is listed with its reason instead of being dropped silently. Sentences saved under an older rule that fail now are listed once too, and kept in the box so they can be mended.
    const problems=el.querySelector('#sentence-problems');
    function showProblems(list){if(!problems)return;problems.hidden=!list.length;problems.textContent='';for(const {text,why,stale} of list){const line=document.createElement('span');line.style.display='block';line.textContent=(stale?'Saved earlier, no longer used: ':'Not added: ')+'“'+text+'” — '+why;problems.appendChild(line);}}
    if(problems){const raw=storage.get(KEY,{});const stale=(Array.isArray(raw?.customSentences)?raw.customSentences:[]).filter(s=>typeof s==='string'&&s.trim()&&L.sentenceProblem(s)).map(text=>({text:text.trim(),why:L.sentenceProblem(text),stale:true}));if(stale.length){form.elements.customSentences.value=prefs.customSentences.concat(stale.map(x=>x.text)).join('\n');showProblems(stale);}}
    form.onsubmit=e=>{e.preventDefault();const next={...prefs};new FormData(form).forEach((value,key)=>{if(['range','choices','pace'].includes(key))next[key]=Number(value);else if(key==='customWords'||key==='customSentences')next[key]=String(value).split('\n');else next[key]=value;});next.soft=form.elements.soft.checked;
      const rejected=problems?next.customSentences.map(s=>s.trim()).filter(Boolean).map(text=>({text,why:L.sentenceProblem(text)})).filter(x=>x.why):[];
      const saved=savePrefs(next);
      if(rejected.length){showProblems(rejected);status(rejected.length+(rejected.length===1?' sentence needs':' sentences need')+' a change. The rest of your settings are saved.');problems.scrollIntoView?.({block:'nearest'});return;}
      closeModal();if(!saved)status('Settings work for this visit. This browser could not save them.');};
  }
  document.querySelectorAll('[data-settings]').forEach(b=>b.onclick=settings);
  function updatePlayer(){document.querySelectorAll('[data-player]').forEach(b=>{b.textContent=player.avatar+' '+player.name;b.setAttribute('aria-label','Change player. Playing as '+player.name);});}
  function switchPlayer(id){const next=profiles.find(p=>p.id===id);if(!next)return;document.dispatchEvent(new Event('lp:beforeplayerchange'));audio.stopSpeech();player=next;rawStorage.set('lp-active-player',id);prefs=L.normalisePrefs(storage.get(KEY,{}));document.body.classList.toggle('softer',prefs.soft);updatePlayer();closeModal();document.dispatchEvent(new Event('lp:playerchanged'));}
  function choosePlayer(){const el=openModal('<div class="lp-dialog-heading"><h2 id="dialog-title">Who is playing?</h2><button data-close aria-label="Close player chooser">×</button></div><p>Every game and puzzle is open to everyone.</p><div id="player-list" class="player-list"></div><form id="player-form"><label>New player name or nickname (optional)<input name="name" maxlength="24" autocomplete="off" placeholder="Player '+(profiles.length+1)+'"></label><label>Choose a picture<select name="avatar"></select></label><button class="lp-primary" type="submit">Add player</button></form><p class="lp-small">Names, preferences and writing stay in this browser on this device. They are not sent to the server. Other people using this browser can see them. Clearing browser data removes them.</p>');
    const list=el.querySelector('#player-list');profiles.forEach(p=>{const row=document.createElement('div');row.className='saved-entry';const select=document.createElement('button');select.className='saved-text';select.textContent=p.avatar+' '+p.name+(p.id===player.id?' ✓':'');select.onclick=()=>switchPlayer(p.id);row.appendChild(select);const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Delete '+p.name+' from this device');remove.onclick=async()=>{const id=p.id,name=p.name;if(await confirmAction('Remove this player?',name+' and their writing and preferences will be removed from this browser.','Remove player')){const prefix='lp-player-'+id+'-';rawStorage.removePrefix(prefix);profiles=profiles.filter(x=>x.id!==id);if(!profiles.length)profiles=[{id:'player-'+Date.now(),name:'Player 1',avatar:AVATARS[0]}];rawStorage.set('lp-players',profiles);if(id===player.id){player=profiles[0];rawStorage.set('lp-active-player',player.id);prefs=L.normalisePrefs(storage.get(KEY,{}));document.body.classList.toggle('softer',prefs.soft);updatePlayer();document.dispatchEvent(new Event('lp:playerchanged'));}choosePlayer();}};row.appendChild(remove);list.appendChild(row);});
    const form=el.querySelector('form');AVATARS.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;form.elements.avatar.appendChild(option);});if(profiles.length>=12)form.hidden=true;form.onsubmit=e=>{e.preventDefault();const name=String(form.elements.name.value).trim().replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,24)||'Player '+(profiles.length+1);const id=window.crypto&&crypto.randomUUID?crypto.randomUUID():'player-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);profiles.push({id,name,avatar:form.elements.avatar.value});const saved=rawStorage.set('lp-players',profiles);switchPlayer(id);if(!saved)status('This player can play now, but the browser could not remember them.');};
  }
  document.querySelectorAll('[data-player]').forEach(b=>b.onclick=choosePlayer);updatePlayer();
  document.body.classList.toggle('softer',prefs.soft);updateSound();
  window.LP={get prefs(){return prefs;},get player(){return {...player};},storage,savePrefs,status,audio,confirm:confirmAction,openModal,closeModal,choosePlayer,get dialogOpen(){return !!modal;}};
})();
