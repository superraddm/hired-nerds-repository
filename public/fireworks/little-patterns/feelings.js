(function(){
  'use strict';
  const F=window.NookFeelings,A=window.NookFeelingsArt,LP=window.LP;
  const $=id=>document.getElementById(id),task=$('task'),menu=$('feelings-menu');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let saved,view='home',returnView='home',round,matched=false,pose=false,tapped=null;
  let meChoice=null,otherText='',localVoice=null;
  const word=id=>LP.prefs.case==='lower'?F.WORDS[id].toLowerCase():F.WORDS[id].toUpperCase();
  const button=(action,label,value='',className='')=>`<button type="button" data-action="${action}" data-value="${value}" data-focus="${action}-${value}" class="${className}">${label}</button>`;
  const next=()=>button('next','Next ›','','next');
  function restore(){saved=F.normalise(LP.storage.get('feelings-v1',null));if(!LP.storage.get('feelings-v1',null))saved.seed=Math.floor(Math.random()*0xffffffff)||1;resetMatch();clearMe();}
  // Only this explicit allow-list is persisted. No answers, guesses or self-reports.
  function save(){LP.storage.set('feelings-v1',F.normalise(saved));}
  function resetMatch(){round=F.matchRound(saved.index,saved.seed,saved.filter);matched=false;pose=false;tapped=null;}
  function clearMe(){meChoice=null;otherText='';}
  function prepareMe(){if(!localVoice)localVoice=LP.audio.prepareLocalClips(F.ME_KEYS.map(id=>F.WORDS[id]));}
  const otherInstruction='Type your words. Then tap the speaker.';
  const keyboardCue='<svg viewBox="0 0 80 52" class="typing-cue" aria-hidden="true"><rect x="2" y="2" width="76" height="48" rx="9" fill="#e4d8ef" stroke="currentColor" stroke-width="3"/><g fill="#fffef3" stroke="currentColor" stroke-width="1.5"><rect x="10" y="9" width="17" height="21" rx="3"/><rect x="31" y="9" width="17" height="21" rx="3"/><rect x="52" y="9" width="17" height="21" rx="3"/><rect x="20" y="36" width="40" height="6" rx="2"/></g><g fill="currentColor" font-family="Arial,sans-serif" font-size="13" font-weight="bold" text-anchor="middle"><text x="18.5" y="24">A</text><text x="39.5" y="24">B</text><text x="60.5" y="24">C</text></g></svg>';
  const sayCue='<svg viewBox="0 0 84 60" class="say-cue" aria-hidden="true"><path d="M5 21H20L37 7V53L20 39H5Z" fill="currentColor"/><path d="M48 19Q61 30 48 41M60 8Q84 30 60 52" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  function guideOther(){if(!LP.audio.muted)LP.audio.speakPrivate(otherInstruction);}
  function updateOtherCue(){const say=task.querySelector('[data-action="say-other"]');if(say)say.classList.toggle('ready',!!otherText.trim());}
  function speak(text){if(!LP.audio.muted)LP.audio.speak(text,{auto:true});}
  function speakMe(){
    if(!meChoice||!localVoice||LP.audio.muted)return;
    if(meChoice==='other'){if(otherText.trim())LP.audio.speakPrivate(otherText.trim());return;}
    if(localVoice.speak(F.WORDS[meChoice]))$('status').textContent='';
    else $('status').textContent='Sound is not ready. Tap the picture again.';
  }
  function prompt(){
    if(view==='match')return pose?F.PROMPTS.pose:matched?F.matchSuccess(round).text:tapped?F.PROMPTS.different:F.PROMPTS.match;
    if(view==='people')return '';
    if(view==='me')return '';
    return view==='home'?'A little space for feelings.':view==='picker'?(saved.mode==='people'?'Choose any story.':'Choose any feeling.') :'';
  }
  function render(focus){
    const previous=document.activeElement?.dataset?.focus;
    document.body.dataset.view=view;
    $('screen-title').textContent=({home:'Feelings',match:pose?'Try the pose':'Match',people:'People',me:'Me',menu:'Menu',picker:'Choose',settings:'Make it yours',about:'For grown-ups'})[view];
    $('menu-open').hidden=!['home','match','people','me'].includes(view);
    $('back').setAttribute('aria-label',view==='home'?"Back to Nook's Garden":pose&&view==='match'?'Back to the matching picture':view==='menu'?'Back to the activity':view==='me'&&meChoice?'Back to all feelings':'Back');
    $('status').textContent=prompt();
    menu.hidden=view!=='menu';task.hidden=view==='menu';
    if(view==='home'){
      task.innerHTML=`<div class="welcome"><img src="assets/nook.png" width="90" height="108" alt="Nook, your friendly sprout"><p>We can feel lots of ways.<br>What shall we explore?</p></div><div class="mode-choices">${button('mode','<strong>Match</strong><span>Find the same picture.</span>','match','mode-card')}${button('mode','<strong>People</strong><span>Find out how someone feels.</span>','people','mode-card')}${button('mode','<strong>Me</strong><span>A word for my feeling.</span>','me','mode-card')}</div><p class="quiet-note">Choose anything. Take your time.</p>`;
    }else if(view==='match'){
      task.className=pose?'pose':'';
      if(pose){task.innerHTML=`<div class="pose-figure">${A.svg(round.person,round.feeling,{pose:true})}</div><p class="word">${word(round.feeling)}</p><div class="task-actions">${next()}</div>`;}
      else{
        const target=button('hear-match',A.svg(round.person,round.feeling,{decorative:true})+`<span class="word">${word(round.feeling)}</span><span class="hear-label">Hear the word</span>`,'','target');
        task.innerHTML=target+(matched?`<div class="matched-space">${button('pose','Try the pose')}</div>`:`<div class="match-options">${round.choices.map(f=>button('match',A.svg(round.person,f,{decorative:true})+`<span class="choice-word">${tapped===f?word(f):''}</span>`,f,'expression-choice')).join('')}</div>`)+`<div class="task-actions">${next()}</div>`;
        task.querySelector('[data-action="hear-match"]').setAttribute('aria-label','Hear '+F.WORDS[round.feeling]+'. '+F.person(round.person).name+' with '+F.DESCRIPTIONS[round.feeling]);
        task.querySelectorAll('[data-action="match"]').forEach(b=>b.setAttribute('aria-label',F.WORDS[b.dataset.value]+'. '+F.person(round.person).name+' with '+F.DESCRIPTIONS[b.dataset.value]));
      }
    }else if(view==='people'){
      const story=F.STORIES[saved.story];
      const speaker='<svg viewBox="0 0 24 24" aria-hidden="true" class="speaker-icon"><path d="M3 9H7L12 5V19L7 15H3Z" fill="currentColor"/><path d="M16 8Q21 12 16 16M19 5Q26 12 19 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      task.innerHTML=`<div class="people-stage">${A.scene(story)}<p class="people-context">${escape(story.context)}</p><p class="story-feeling"><span>I feel</span> <strong>${word(story.reportedFeeling)}</strong></p></div><div class="people-actions">${button('hear-story',speaker+'<span>Hear</span>','','hear-story')}${next()}</div><p class="sound-note"${LP.audio.muted?'':' hidden'}>Sound is off</p>`;
      task.querySelector('[data-action="hear-story"]').setAttribute('aria-label','Hear '+F.person(story.person).name+' tell the story');
    }else if(view==='me'){
      if(meChoice==='other'){
        task.innerHTML=`<div class="other-feeling"><div class="other-guide" id="other-guide" tabindex="-1"><img src="assets/nook.png" width="68" height="82" alt="Nook"><label for="other-feeling">${keyboardCue}<span>Type</span></label></div><h2 id="other-question" class="other-question">How do you feel?</h2><textarea id="other-feeling" data-focus="other-feeling" aria-labelledby="other-question" maxlength="160" rows="2" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${escape(otherText)}</textarea><div class="type-to-say" aria-hidden="true"><svg viewBox="0 0 32 36"><path d="M16 3V28M5 18L16 30L27 18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>${button('say-other',sayCue+'<span>Say it</span>','','say-other'+(otherText.trim()?' ready':''))}</div>`;
        const input=$('other-feeling');
        input.addEventListener('input',()=>{LP.audio.stopSpeech();otherText=input.value.slice(0,160);updateOtherCue();});
        input.addEventListener('click',speakMe);
      }else if(meChoice){task.innerHTML=`<div class="me-message">${button('hear-me',(F.FEELINGS.includes(meChoice)?A.svg('sam',meChoice,{decorative:true}):'')+`<span class="word">${word(meChoice)}</span>`,'','target'+(F.FEELINGS.includes(meChoice)?'':' text-only'))}</div>`;task.querySelector('[data-action="hear-me"]').setAttribute('aria-label','Hear '+F.WORDS[meChoice]);}
      else task.innerHTML=`<div class="me-options">${F.FEELINGS.map(f=>button('feeling',A.svg('sam',f,{decorative:true})+`<span>${word(f)}</span>`,f,'me-choice')).join('')}</div><div class="me-actions">${button('feeling',word('other'),'other')}${button('feeling',word('unsure'),'unsure')}</div>`;
    }else if(view==='menu'){
      task.innerHTML='';$('choose-puzzle').hidden=!['match','people'].includes(returnView);
      $('choose-puzzle').textContent=returnView==='people'?'Choose a story':'Choose a feeling';
      $('hear-again').hidden=!['match','people','me'].includes(returnView);
      const playerButton=menu.querySelector('[data-player]');playerButton.textContent=LP.player.name; // Keep the existing player chooser; no emoji in this activity's menu.
    }else if(view==='picker'){
      task.innerHTML=`<div class="picker-buttons">${saved.mode==='people'?F.STORIES.map((s,i)=>button('story',escape(s.context),String(i),'full-width')).join(''):button('filter','All feelings','all','full-width')+F.FEELINGS.map(f=>button('filter',word(f),f)).join('')}</div>`;
    }else if(view==='settings'){
      task.innerHTML=`<form class="settings-form" id="feelings-settings"><label>Letters<select name="case"><option value="upper">UPPERCASE</option><option value="lower">lowercase</option></select></label><label class="check-label"><input type="checkbox" name="soft"> Softer colours</label><div class="task-actions"><button class="primary" type="submit">Save settings</button></div></form>`;
      const form=$('feelings-settings');form.elements.case.value=LP.prefs.case;form.elements.soft.checked=LP.prefs.soft;
      form.onsubmit=e=>{e.preventDefault();const ok=LP.savePrefs({...LP.prefs,case:form.elements.case.value,soft:form.elements.soft.checked});view='menu';render('open-settings');if(!ok)LP.status('These settings work for this visit. This browser could not save them.');};
    }else if(view==='about'){
      task.innerHTML=`<article class="grown-ups"><h2>Listen, look and explore</h2><p>People tells a short illustrated story and names the character’s feeling immediately. There is no hidden answer to guess. Hear replays both the story and the feeling; reading is not required when sound is on. These are individual stories, not rules about how someone must feel in that situation.</p><p>These are examples of expressions. People can look different while feeling the same way, or look alike while feeling differently. Matching a drawing does not tell us what a real person feels.</p><p>Every feeling is welcome, including sad and angry. None has to turn into happy before continuing. These feeling words are only a beginning; someone can feel more than one thing.</p><h2>Join in gently</h2><p>If your child wants, model your own feeling using words, signs or their usual AAC. Say what is true for you. Copying a pose is optional; watching or leaving is equally welcome. No eye contact, speech or movement is required.</p><p>Use Next to skip a picture, or Menu to practise one chosen word. Never deliberately upset someone to practise an emotion. This game supports exploration; it is not a clinical assessment or a replacement for an AAC device.</p><h2>Me is private to this screen</h2><p>Me choices and typed feelings are not graded, saved or sent to a server. Something else reads typed text only through an explicitly offline English device voice, so it can sound different from Nook. If none is available, the text remains visible without sending it elsewhere. The same small set of feeling-name clips loads before any choice, even with sound off, so hearing a particular word does not reveal the selection in a server request. Leaving Me clears it. A shared device can still show the current screen to someone nearby.</p><p>Player names and practice positions stay in this browser. Local profiles are not password-protected accounts. Clearing browser data removes them.</p><h2>Sound and pictures</h2><p>Sound starts on. Tap Sound to turn it off. The Sound button stays at the top of the page. Built-in speech uses the same locally generated Jenny (Dioco) clips on every device. No microphone, camera, online speech service, advertising or analytics. Original human illustrations were created for Nook's Garden.</p><a href="feelings-content.html">All feelings, pictures and story words</a></article>`;
    }
    task.querySelectorAll('.word').forEach(label=>label.classList.toggle('long-word',label.textContent.length>11));
    if(view!=='match')task.className='';
    const key=focus||previous;const node=key&&(document.querySelector(`[data-focus="${key}"]`)||$(key));
    if(node&&!node.hidden&&!node.closest('[hidden]'))node.focus({preventScroll:true});
  }
  function enter(mode){LP.audio.stopSpeech();clearMe();view=mode;saved.mode=mode;save();if(mode==='me')prepareMe();render();$('activity').focus({preventScroll:true});if(mode==='people')speak(F.storyPrompt(F.STORIES[saved.story]));}
  function home(){LP.audio.stopSpeech();clearMe();view='home';render();$('activity').focus({preventScroll:true});}
  function nextRound(){LP.audio.stopSpeech();if(view==='match'){saved.index=(saved.index+1)%1000001;resetMatch();}else if(view==='people'){saved.story=(saved.story+1)%F.STORIES.length;}save();render('next-');if(view==='people')speak(F.storyPrompt(F.STORIES[saved.story]));}
  task.addEventListener('click',event=>{
    const b=event.target.closest('button[data-action]');if(!b)return;const action=b.dataset.action,value=b.dataset.value;
    if(action==='mode')enter(value);
    else if(action==='next')nextRound();
    else if(action==='hear-match')speak(F.WORDS[round.feeling]);
    else if(action==='match'){
      tapped=value;matched=value===round.feeling;render(matched?'pose-':b.dataset.focus);
      speak(matched?F.matchSuccess(round).speech:[F.WORDS[value],F.PROMPTS.different]);
    }else if(action==='pose'){LP.audio.stopSpeech();pose=true;render('next-');speak(F.PROMPTS.pose);}
    else if(action==='hear-story')speak(F.storyPrompt(F.STORIES[saved.story]));
    else if(action==='feeling'){meChoice=value;render(value==='other'?'other-guide':'hear-me-');if(value==='other')guideOther();else speakMe();}
    else if(action==='hear-me')speakMe();
    else if(action==='say-other'){
      if(!otherText.trim()){$('other-feeling').focus();guideOther();}
      else if(LP.audio.muted){$('page-sound').focus();$('status').textContent='Sound is off.';}
      else speakMe();
    }
    else if(action==='filter'){saved.filter=value;saved.index=0;resetMatch();enter('match');}
    else if(action==='story'){saved.story=Number(value);enter('people');}
  });
  $('back').onclick=()=>{
    LP.audio.stopSpeech();
    if(view==='home'){save();location.href='garden.html';}
    else if(view==='menu'){view=returnView;render('menu-open');}
    else if(['picker','settings','about'].includes(view)){view='menu';render();}
    else if(view==='me'&&meChoice){const old=meChoice;clearMe();render('feeling-'+old);}
    else if(view==='match'&&pose){pose=false;render('pose-');}
    else home();
  };
  $('menu-open').onclick=()=>{LP.audio.stopSpeech();returnView=view;view='menu';render();$('page-sound').focus();};
  $('page-sound').addEventListener('click',()=>{const note=task.querySelector('.sound-note');if(note)note.hidden=!LP.audio.muted;if(view==='me'&&meChoice==='other'&&!otherText.trim())guideOther();});
  $('hear-again').onclick=()=>{
    if(returnView==='me'&&meChoice){speakMe();return;}
    if(returnView==='match')speak(pose?F.PROMPTS.pose:matched?F.matchSuccess(round).speech:F.WORDS[round.feeling]);
    else if(returnView==='people')speak(F.storyPrompt(F.STORIES[saved.story]));
    else if(returnView==='me')speak(F.PROMPTS.me);
  };
  $('choose-puzzle').onclick=()=>{LP.audio.stopSpeech();view='picker';render();$('activity').focus({preventScroll:true});};
  $('choose-activity').onclick=home;
  $('open-settings').onclick=()=>{LP.audio.stopSpeech();view='settings';render();$('activity').focus({preventScroll:true});};
  $('open-about').onclick=()=>{LP.audio.stopSpeech();view='about';render();$('activity').focus({preventScroll:true});};
  document.addEventListener('lp:beforeplayerchange',()=>{save();clearMe();LP.audio.stopSpeech();$('status').textContent='';task.innerHTML='';});
  document.addEventListener('lp:playerchanged',()=>{restore();home();});
  document.addEventListener('lp:dialogclosed',()=>{if(view==='menu')render();});
  // Preferences can change via shared controls. Me remains transient throughout.
  document.addEventListener('lp:preferences',()=>{if(view!=='settings')render();});
  window.addEventListener('storage',e=>{if(e.key==='lp-active-player'||e.key==='lp-players'||e.key===null)home();});
  window.addEventListener('pagehide',()=>{save();clearMe();LP.audio.stopSpeech();if(localVoice){localVoice.dispose();localVoice=null;}view='home';returnView='home';render();});
  window.addEventListener('pageshow',e=>{if(e.persisted){clearMe();view='home';returnView='home';render();}});
  restore();prepareMe();render();
})();
