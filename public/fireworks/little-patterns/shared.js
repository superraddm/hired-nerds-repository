/* Phrase-aware joining of bundled voice clips (round 4, phase 5). Pure: WAV bytes in, WAV bytes out, so the browser part
   below and the Node tests use the same code. The clips are 24 kHz 16-bit mono PCM; anything else returns null and the
   game plays the clips one after another instead. */
(function(root){
  'use strict';
  const RATE=24000,GAP_WORD=30,GAP_PHRASE=150;
  // The samples of a WAV, or null unless it is plain 24 kHz 16-bit mono PCM.
  function parseWav(buffer){
    try{
      const view=new DataView(buffer),tag=at=>String.fromCharCode(view.getUint8(at),view.getUint8(at+1),view.getUint8(at+2),view.getUint8(at+3));
      if(buffer.byteLength<44||tag(0)!=='RIFF'||tag(8)!=='WAVE')return null;
      let pos=12,format=null;
      while(pos+8<=buffer.byteLength){
        const id=tag(pos),size=view.getUint32(pos+4,true),body=pos+8;
        if(id==='fmt '){format={code:view.getUint16(body,true),channels:view.getUint16(body+2,true),rate:view.getUint32(body+4,true),bits:view.getUint16(body+14,true)};}
        else if(id==='data'){
          if(!format||format.code!==1||format.channels!==1||format.rate!==RATE||format.bits!==16)return null;
          const n=Math.floor(Math.min(size,buffer.byteLength-body)/2),out=new Int16Array(n);
          for(let i=0;i<n;i++)out[i]=view.getInt16(body+i*2,true);
          return out;
        }
        pos=body+size+(size&1);
      }
    }catch(_){/* not a WAV we can join */}
    return null;
  }
  // The silence between parts: about 150 ms at a phrase boundary (after the opener or any part ending in . ! ? , or …,
  // and before a part that starts a sentence, such as a closing "Spot on!"), about 30 ms between the words of a phrase
  // ("three plus two equals five"). Each clip also keeps its own 30 ms lead and 50 ms tail from the voice build.
  function phraseGaps(texts){
    const gaps=[];
    for(let i=0;i+1<texts.length;i++){
      const a=String(texts[i]).trim(),b=String(texts[i+1]).trim();
      gaps.push(/[.!?,…]$/.test(a)||/^[A-Z][a-z’']/.test(b)?GAP_PHRASE:GAP_WORD);
    }
    return gaps;
  }
  // One clip from many: the parts with their gaps, where each part starts (seconds) and how long each lasts.
  function joinPcm(parts,gaps){
    const pad=gaps.map(ms=>Math.round(ms*RATE/1000)),total=parts.reduce((n,p)=>n+p.length,0)+pad.reduce((n,g)=>n+g,0);
    const samples=new Int16Array(total),offsets=[];let pos=0;
    parts.forEach((p,i)=>{offsets.push(pos/RATE);samples.set(p,pos);pos+=p.length+(pad[i]||0);});
    return {samples,offsets,seconds:parts.map(p=>p.length/RATE),total:total/RATE};
  }
  function encodeWav(samples){
    const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer),text=(at,t)=>{for(let i=0;i<4;i++)view.setUint8(at+i,t.charCodeAt(i));};
    text(0,'RIFF');view.setUint32(4,36+samples.length*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,RATE,true);view.setUint32(28,RATE*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
    for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,samples[i],true);
    return buffer;
  }
  // texts: what each part says (for the gaps); pcms: each part's samples. -> {wav, offsets, seconds, total}
  function join(texts,pcms){if(!pcms.length||pcms.some(p=>!(p instanceof Int16Array)))return null;const j=joinPcm(pcms,phraseGaps(texts));return {wav:encodeWav(j.samples),offsets:j.offsets,seconds:j.seconds,total:j.total};}
  const api={RATE,GAP_WORD,GAP_PHRASE,parseWav,phraseGaps,joinPcm,encodeWav,join};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LPVoiceJoin=api;
})(typeof window!=='undefined'?window:globalThis);
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.GardenLearning)return;   // Node (the tests) and the voice listening page only want the joiner above
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
  // Joined speech (round 4, phase 5): rate is 1.0 to 1.05 with the pitch kept; join is 'auto' (a real media element and the
  // means to fetch and build a Blob), true (tests) or false (always the old chain). unlocked: a clip has played from a tap.
  let playRate=1,joining='auto',unlocked=false,joinedUrl='',partTimers=[];const pcmCache=new Map(),PCM_CACHE=40;
  // Sound is a Grown-ups setting for this device (round 4): it starts on, and nothing on a play screen turns it off. While a grown-up
  // has turned it off, every page starts muted, a tap never unmutes it, and the shelf shows a small crossed speaker.
  let soundOff=rawStorage.get('lp-sound','on')==='off';muted=soundOff;
  let musicActivated=false,musicStarting=false;
  // A gentle, newly synthesised arrangement of the traditional folk melody.
  // Source melody: https://en.wikipedia.org/wiki/Korobeiniki#Melody
  // No recording, game soundtrack, accompaniment or licensed arrangement is used.
  const phrase=[[64,1.5],[68,.5],[71,1],[68,.5],[64,.5],[69,1.5],[72,.5],[76,1],[74,.5],[72,.5],[71,1.5],[72,.5],[74,1],[76,1],[72,1],[69,1],[69,2],[77,1.5],[79,.5],[81,1],[79,.5],[77,.5],[76,1.5],[77,.5],[76,1],[74,.5],[72,.5],[71,1.5],[72,.5],[74,1],[76,1],[72,1],[69,1],[69,2]];
  function stopNotes(){clearTimeout(noteTimer);noteTimer=null;voices.forEach(v=>{try{v.stop();}catch(_){}});voices.clear();}
  function stopSpeech(){speechRequest++;partTimers.forEach(clearTimeout);partTimers=[];if(clipPlayer){clipPlayer.pause();clipPlayer.onended=null;clipPlayer.onerror=null;clipPlayer.removeAttribute('src');clipPlayer.load();}releaseJoined();if('speechSynthesis' in window)window.speechSynthesis.cancel();}
  function releaseJoined(){if(joinedUrl){try{URL.revokeObjectURL(joinedUrl);}catch(_){}joinedUrl='';}}
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
  // A trailing comma marks a phrase pause in a composed line ("three,", "then", ...); it is not part of the clip's key.
  const clipKey=text=>String(text).trim().toLowerCase().replace(/\s+/g,' ').replace(/[.!?,]+$/,'');
  // Bundled clips play one after another from a single reusable player, so a line such as "Yes! Two plus one equals three" needs no clip of its own.
  // on (optional, round 4): start(index, count, clip) once each clip is actually playing, end() after the last clip
  // has ended, fail(reason) once when a clip is blocked or fails. A newer request, mute or a hidden page stops the
  // chain silently; the caller owns what happens then (the Feelings performance keeps Done available).
  function clipAudio(){if(!clipPlayer){clipPlayer=new Audio();clipPlayer.preload='none';}return clipPlayer;}
  // Rate 1.0 to 1.05 with the pitch kept; a new src resets playbackRate to defaultPlaybackRate, so set both.
  function applyRate(){try{clipPlayer.defaultPlaybackRate=playRate;clipPlayer.playbackRate=playRate;clipPlayer.preservesPitch=true;clipPlayer.webkitPreservesPitch=true;clipPlayer.mozPreservesPitch=true;}catch(_){}}
  function playClips(clips,request,on,quiet){
    clipAudio();
    clipPlayer.volume=.65;on=on||{};
    let reported=false;
    const failed=()=>{if(request!==speechRequest)return;if(!muted&&!quiet)status('That voice clip could not play. Tap the word to try again.');if(!reported){reported=true;if(on.fail)on.fail('blocked');}};
    let next=0;
    const play=()=>{if(request!==speechRequest||muted||document.hidden)return;if(next>=clips.length){if(on.end)on.end();return;}const index=next,clip=clips[next++];clipPlayer.src=clip.file;applyRate();clipPlayer.onended=play;clipPlayer.onerror=failed;try{const playing=clipPlayer.play();if(playing&&typeof playing.then==='function')playing.then(()=>{unlocked=true;if(request===speechRequest&&on.start)on.start(index,clips.length,clip);},failed);else{unlocked=true;if(on.start)on.start(index,clips.length,clip);}}catch(_){failed();}};
    play();
  }
  // Automatic feedback uses bundled clips only and respects mute. The explicit
  // private-text entry point also respects mute, but bypasses clips entirely and
  // uses only an installed local voice, avoiding selection-dependent requests.
  async function speak(text,options={}){
    stopSpeech();const request=speechRequest;
    const auto=options.auto===true,on=options.on||null,fail=reason=>{if(on&&on.fail)on.fail(reason);};
    if(auto&&muted){fail('muted');return;}
    if(muted&&soundOff){status('Sound is off. A grown-up can turn it on in Grown-ups.');fail('muted');return;}
    const parts=(Array.isArray(text)?text:[text]).map(clipKey).filter(Boolean);
    const library=window.LPVoiceLibrary?.clips;
    const clips=parts.map(key=>!options.private&&library&&Object.prototype.hasOwnProperty.call(library,key)?library[key]:null);
    if(clips.length&&clips.every(Boolean)){
      // One reusable player, no preload, no text or player data in requests.
      if(document.hidden){fail('hidden');return;}
      setMuted(false);
      if(clips.length>1&&joinable())speakJoined(text,clips,request,on);
      // A single clip, and any line before the first clip has played, starts from the tap itself (iPad audio permission).
      else playClips(clips,request,on);
      return;
    }
    if(auto&&!options.private){fail('missing');return;}
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
  // ---- Joined speech (round 4, phase 5) ----
  // A line of several clips plays as ONE clip: the parts' samples with phrase-aware gaps (LPVoiceJoin above), built into a
  // WAV Blob and played through the same player. The parts are the same bundled files the chain would load (same-origin,
  // no player data, no text in any request); their samples are kept for the last 40 clips. The chain is used instead
  // before the first clip has played from a tap (iPad audio permission), and whenever anything fails.
  function joinable(){
    if(!joining||!window.LPVoiceJoin||typeof fetch!=='function'||typeof Blob!=='function'||typeof URL==='undefined'||typeof URL.createObjectURL!=='function')return false;
    return joining===true||(!!clipPlayer&&typeof HTMLMediaElement!=='undefined'&&clipPlayer instanceof HTMLMediaElement&&unlocked);
  }
  function cached(file){const pcm=pcmCache.get(file);if(pcm){pcmCache.delete(file);pcmCache.set(file,pcm);}return pcm;}
  async function loadPcm(file){
    const hit=cached(file);if(hit)return hit;
    if(!/^assets\/voice\/[a-f0-9]{16}\.wav$/.test(file))throw Error('Not a bundled clip');
    const response=await fetch(file,{credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error('Clip unavailable');
    const pcm=window.LPVoiceJoin.parseWav(await response.arrayBuffer());
    if(!pcm)throw Error('Unexpected clip format');
    pcmCache.set(file,pcm);while(pcmCache.size>PCM_CACHE)pcmCache.delete(pcmCache.keys().next().value);
    return pcm;
  }
  function speakJoined(text,clips,request,on){
    const texts=Array.isArray(text)?text:[text],ready=clips.map(c=>cached(c.file));
    const fallback=()=>{if(request===speechRequest&&!muted&&!document.hidden)playClips(clips,request,on);};
    // Every part already in memory: build and play at once, still inside the tap.
    if(ready.every(Boolean)){if(!playJoined(texts,ready,clips,request,on))fallback();return;}
    Promise.all(clips.map(c=>loadPcm(c.file))).then(pcms=>{if(request!==speechRequest||muted||document.hidden)return;if(!playJoined(texts,pcms,clips,request,on))fallback();},fallback);
  }
  function playJoined(texts,pcms,clips,request,on){
    let joined;
    try{joined=window.LPVoiceJoin.join(texts,pcms);}catch(_){joined=null;}
    if(!joined)return false;
    releaseJoined();joinedUrl=URL.createObjectURL(new Blob([joined.wav],{type:'audio/wav'}));
    const n=clips.length,rate=playRate;
    // The caller hears about each part as it starts, as with the chain: start(i, n, clip) with that part's own length.
    const relay=on?{end:on.end,fail:on.fail,start:on.start&&(()=>{
      on.start(0,n,{file:clips[0].file,seconds:joined.seconds[0]});
      for(let i=1;i<n;i++)partTimers.push(setTimeout(()=>{if(request===speechRequest&&!muted)on.start(i,n,{file:clips[i].file,seconds:joined.seconds[i]});},joined.offsets[i]*1000/rate));
    })}:null;
    // If the joined clip will not play, try the old chain once, quietly; if that fails too, the caller hears about it as before.
    let retried=false;
    const guard={start:relay&&relay.start,end:relay&&relay.end,fail:reason=>{if(!retried&&request===speechRequest&&!muted&&!document.hidden){retried=true;partTimers.forEach(clearTimeout);partTimers=[];playClips(clips,request,on);}else if(on&&on.fail)on.fail(reason);}};
    playClips([{file:joinedUrl,seconds:joined.total}],request,guard,true);
    return true;
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
        clips.set(key,{file:URL.createObjectURL(blob),seconds:entry.seconds});
      }catch(_){/* Text remains usable; never request a selected clip as fallback. */}
    }));
    return {ready,
      speak(text,on){stopSpeech();const clip=clips.get(clipKey(text));if(disposed||muted||document.hidden||!clip)return false;playClips([clip],speechRequest,on);return true;},
      has(text){return !disposed&&clips.has(clipKey(text));},
      dispose(){disposed=true;stopSpeech();for(const clip of clips.values())URL.revokeObjectURL(clip.file);clips.clear();}
    };
  }
  // has(parts): every part is a bundled clip, so a line can be heard again without any device voice.
  const has=text=>{const library=window.LPVoiceLibrary?.clips;const parts=(Array.isArray(text)?text:[text]).map(clipKey).filter(Boolean);return !!library&&parts.length>0&&parts.every(key=>Object.prototype.hasOwnProperty.call(library,key));};
  function setSound(on){soundOff=!on;rawStorage.set('lp-sound',on?'on':'off');setMuted(!on);document.dispatchEvent(new CustomEvent('lp:sound',{detail:{on:!!on}}));}
  const audio={chime,speak,has,get rate(){return playRate;},set rate(value){value=Number(value);playRate=Number.isFinite(value)?Math.min(1.05,Math.max(1,value)):1;},get join(){return joining;},set join(value){joining=value===true||value===false?value:'auto';},speakPrivate:text=>speak(text,{auto:true,private:true}),stopSpeech,prepareLocalClips,mute:()=>setMuted(true),setMusic(value){musicWanted=value;if(!value)stopNotes();},pause(){musicPaused=true;stopNotes();stopSpeech();},async resume(){musicPaused=false;await startMusic();},get muted(){return muted;}};
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
  function settings(){const block=document.body.dataset.game==='blocks';const html='<div class="lp-dialog-heading"><h2 id="dialog-title">Make it feel right</h2><button data-close aria-label="Close settings">×</button></div><p>Changes stay on this device. Nothing needs a spoken answer.</p><form id="lp-settings"><label>Sound<select name="sound"><option value="on">On: Nook speaks, with music and chimes</option><option value="off">Off: silent until a grown-up turns it on</option></select><small>Nothing on a play screen turns sound off. While it is off, a small crossed speaker shows on the shelf.</small></label>'+(block?'<label>Blocks move<select name="pace"><option value="0">Only when tapped</option><option value="1800">Automatically · very slowly</option><option value="850">Automatically · steady pace</option></select></label>':'<p class="lp-small">Count, Add, Number words and Patterns each have levels. Choose a level from the activity’s own picker; levels never change on their own.</p><label>Count, letters and pattern choices<select name="choices"><option value="2">Two choices · more support</option><option value="3">Three choices · more exploring</option></select><small>Missing-word sentences always show three words.</small></label><label>Count answer<select name="countAnswer"><option value="choose">Choose from numbers</option><option value="type">Type it on a number keypad</option></select></label><label>Addition answer<select name="addition"><option value="choose">Choose from three numbers</option><option value="type">Type it on a number keypad</option><option value="demo">Just show me the answer</option></select></label><label>Number words<select name="numberWords"><option value="show">Show the objects, number and word</option><option value="choose">Let me choose the word</option><option value="type">Let me type the word</option></select></label><label>Letters<select name="case"><option value="upper">UPPERCASE</option><option value="lower">lowercase</option></select></label><label>Typing keyboard<select name="keyboard"><option value="az">Big A–Z keys</option><option value="device">Device keyboard</option></select></label><label>Word pictures<select name="wordPictures"><option value="show">Show the pictures on the word cards</option><option value="hide">Hide them until Help is pressed</option></select><small>Missing word shows three word cards. With pictures on, each card shows its Mulberry symbol beside the word.</small></label><label>Familiar words (one per line)<textarea name="customWords" rows="4" maxlength="750" placeholder="DINOSAUR&#10;RAINBOW"></textarea><small>Up to 24 words or short phrases. They join the missing-letter spelling puzzles.</small></label><label>Familiar sentences (one per line, missing word in CAPITALS)<textarea name="customSentences" rows="3" maxlength="800" placeholder="Arthur likes TRAINS.&#10;We go to the PARK."></textarea><small>Up to 12 sentences of two to eight words (60 characters). The word in capitals is the gap: make it clearly different from the other familiar words, because the words in capitals in your other sentences are used as the wrong answers. The gap word cannot have an apostrophe (the A to Z keys have none). They join Missing word and Word order. Words without a Mulberry symbol show no picture, and these private sentences use the device voice rather than the bundled one.</small></label><p id="sentence-problems" class="lp-small lp-error" role="status" hidden></p>')+'<label class="lp-check"><input type="checkbox" name="soft"> Softer colours</label><p class="lp-small">Sound starts on. Only the Sound setting above turns it off; sentences, words and letters are spoken only while it is on. No timers, lost lives, badges or automatic puzzle changes.</p>'+(block?'<p class="lp-small">Keyboard: arrows move and turn, Space places, P pauses. Hold Down to move faster. Opening settings pauses your board.</p>':'<p class="lp-small">New puzzle settings start fresh examples. Built-in words and sentences use the same bundled Nook voice on every device: clips made once with Google Gemini text-to-speech, not generated while playing. Familiar words you add use an installed offline English voice and stay on this device. Word pictures are Mulberry Symbols by Steve Lee (CC BY-SA 4.0), mulberrysymbols.org.</p>')+'<div class="lp-dialog-actions"><button type="button" data-close>Cancel</button><button class="lp-primary" type="submit">Save settings</button></div></form>';
    const el=openModal(html),form=el.querySelector('form');Object.keys(prefs).forEach(key=>{const input=form.elements.namedItem(key);if(!input)return;if(key==='soft')input.checked=prefs[key];else if(key==='customWords'||key==='customSentences')input.value=prefs[key].join('\n');else input.value=prefs[key];});form.elements.sound.value=soundOff?'off':'on';
    // Familiar sentences are validated visibly: each rejected line is listed with its reason instead of being dropped silently. Sentences saved under an older rule that fail now are listed once too, and kept in the box so they can be mended.
    const problems=el.querySelector('#sentence-problems');
    function showProblems(list){if(!problems)return;problems.hidden=!list.length;problems.textContent='';for(const {text,why,stale} of list){const line=document.createElement('span');line.style.display='block';line.textContent=(stale?'Saved earlier, no longer used: ':'Not added: ')+'“'+text+'” — '+why;problems.appendChild(line);}}
    if(problems){const raw=storage.get(KEY,{});const stale=(Array.isArray(raw?.customSentences)?raw.customSentences:[]).filter(s=>typeof s==='string'&&s.trim()&&L.sentenceProblem(s)).map(text=>({text:text.trim(),why:L.sentenceProblem(text),stale:true}));if(stale.length){form.elements.customSentences.value=prefs.customSentences.concat(stale.map(x=>x.text)).join('\n');showProblems(stale);}}
    form.onsubmit=e=>{e.preventDefault();const next={...prefs};new FormData(form).forEach((value,key)=>{if(['range','choices','pace'].includes(key))next[key]=Number(value);else if(key==='customWords'||key==='customSentences')next[key]=String(value).split('\n');else next[key]=value;});next.soft=form.elements.soft.checked;
      const rejected=problems?next.customSentences.map(s=>s.trim()).filter(Boolean).map(text=>({text,why:L.sentenceProblem(text)})).filter(x=>x.why):[];
      const saved=savePrefs(next);if((form.elements.sound.value!=='off')===soundOff)setSound(form.elements.sound.value!=='off');
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
  window.LP={get prefs(){return prefs;},get player(){return {...player};},storage,savePrefs,status,audio,confirm:confirmAction,openModal,closeModal,choosePlayer,settings,setSound,get soundOff(){return soundOff;},get dialogOpen(){return !!modal;}};
})();
