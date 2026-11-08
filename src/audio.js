// Original scene score and optional device narration. No game/payment state lives here.
const hz=midi=>440*2**((midi-69)/12);
const keys={crossing:50,meadow:55,marsh:40,harvest:45};
// Original four-second pulse/triangle phrase for the 16-bit story scenes.
export function retroScoreNotes(scene){
 const root=keys[scene.tone]??50,peaceful=scene.cinematic==='renewal';
 const melody=peaceful?[0,4,7,12,11,7,4,2,0,4,9,7,4,2,7,12]:[0,7,12,10,7,3,5,7,0,7,15,12,10,7,5,3];
 return [...melody.map((interval,i)=>({at:i*.25,note:root+12+interval,duration:.19,level:.012,type:'square'})),
  ...[0,0,peaceful?4:3,5].map((interval,i)=>({at:i,note:root-12+interval,duration:.78,level:.032,type:'triangle'}))];
}
const voices={narrator:[.94,.94,0],oak:[.96,.82,1],pine:[1.02,1.08,2],palm:[.98,1.02,3],cypress:[.96,.92,1],mushroom:[1.02,1.15,2],willow:[.92,.88,3]};
// Generic original delivery presets, not impressions of a performer or character.
export function narrationProfile(speaker,style='heroic'){
 const [rate,pitch,index]=voices[speaker]||voices.narrator;
 return style==='natural'?{rate,pitch,index}:{rate:Math.max(.82,Math.min(.98,rate*.92)),pitch:Math.max(.72,Math.min(.95,pitch*.82)),index};
}
const voiceId=v=>v.voiceURI||`${v.name}::${v.lang}`;
function deliveryVoices(list,speaker,choices,simple=false){
 if(!list.length)return {heroic:null,natural:null};
 const explicit=style=>list.find(v=>voiceId(v)===choices[style]);
 const next=voice=>list.find(v=>v.name!==voice.name&&voiceId(v)!==voiceId(voice))||list.find(v=>voiceId(v)!==voiceId(voice))||voice;
 let heroic=simple?(list.find(v=>/^Microsoft Mark\b/i.test(v.name)&&/^en-US$/i.test(v.lang))||list.find(v=>v.default&&/^en-US$/i.test(v.lang))||list.find(v=>/^en-US$/i.test(v.lang))||list[0]):explicit('heroic')||list[narrationProfile(speaker,'heroic').index%list.length];
 const natural=explicit('natural')||next(heroic);
 if(!explicit('heroic')&&voiceId(heroic)===voiceId(natural)&&explicit('natural'))heroic=next(natural);
 return {heroic,natural};
}
export function narrationVoiceInfo(state){
 const pair=state.deliveryVoices;
 if(!pair.heroic)return 'No English device voice is available. Music and story captions still work.';
 if(state.voiceChoices.length===1)return `This device provides one English voice: ${pair.heroic.name}. Both deliveries use it; pitch and pacing changes may not be audible.`;
 if(!state.distinctDeliveryVoices)return `Both deliveries currently use ${pair.heroic.name}. Choose a different device voice for one delivery to hear a different narrator.`;
 return `Heroic announcer: ${pair.heroic.name} (${pair.heroic.lang}). Natural storyteller: ${pair.natural.name} (${pair.natural.lang}). Each delivery remembers its own device voice.`;
}
export function sceneAudioCues(scene){
 const root=keys[scene.tone]??50;
 return [
  {id:'bird',at:1.1,kind:'bird',note:root+31},
  {id:'camera',at:3,kind:'rustle',visual:true},
  {id:'step-a',at:3.6,kind:'step',note:root-12,visual:true},
  {id:'harmony',at:4,kind:'harmony',note:root+(scene.cinematic==='warning'?1:7)},
  {id:'step-b',at:4.5,kind:'step',note:root-12,visual:true},
  ...(scene.cinematic==='renewal'?[]:[{id:'strike',at:5.2,kind:'strike',note:root+12,visual:true}]),
  {id:'roots',at:8,kind:'roots',note:root+12},
  {id:'resolve',at:10.7,kind:'harmony',note:root+7}
 ];
}

export function createGameAudio({AudioContext,speech,Utterance,storage,onChange=()=>{},simpleCutscenes=false,
 setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const read=(key,fallback)=>{try{const v=storage?.getItem(key);return v===null||v===undefined?fallback:v==='true';}catch{return fallback;}};
 const write=(key,v)=>{try{storage?.setItem(key,String(v));}catch{}};
 const readText=key=>{try{return storage?.getItem(key)||'';}catch{return '';}};
 let enabled=read('canopy-sound-enabled',simpleCutscenes),voiceEnabled=simpleCutscenes||read('canopy-voice-enabled',true);
 let narrationStyle=!simpleCutscenes&&readText('canopy-narration-style')==='natural'?'natural':'heroic';
 const voiceChoicesByStyle=simpleCutscenes?{heroic:'',natural:''}:{heroic:readText('canopy-narration-voice-heroic'),natural:readText('canopy-narration-voice-natural')};
 // Migrate the former global override into only the delivery it belonged to.
 const legacyChoice=readText('canopy-narration-voice');
 if(legacyChoice&&!simpleCutscenes){
  if(!voiceChoicesByStyle[narrationStyle])voiceChoicesByStyle[narrationStyle]=legacyChoice;
  for(const style of ['heroic','natural'])write('canopy-narration-voice-'+style,voiceChoicesByStyle[style]);
  write('canopy-narration-voice','');
 }
 let effectsVolume=volume('canopy-effects-volume',.7),ambienceVolume=volume('canopy-ambience-volume',.3);
 function volume(key,fallback){const raw=readText(key),n=Number(raw);return raw!==''&&Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;}
 let effects=null,ambience=null,battleSeconds=0,nextForest=0,battleActive=false,lastBattlePhase=null;const lastCue=new Map();
 let context=null,music=null,noise=null,unlocked=false,hidden=false,disposed=false,error='';
 let scene=null,beat=0,seconds=0,musicBar=-1,played=new Set(),utterance=null,voiceToken=0,voiceTimer=null;
 let voiceStatus='idle',voiceError='',spokenKey='',sceneId=0,attempt=0;
 const nodes=new Set();
 const english=()=>{try{const seen=new Set();return (speech?.getVoices()||[]).filter(v=>/^en(?:-|_)?/i.test(v.lang)&&!seen.has(voiceId(v))&&seen.add(voiceId(v))).sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(b.default)-Number(a.default)||a.name.localeCompare(b.name));}catch{return [];}};
 const ready=()=>!disposed&&enabled&&unlocked&&!hidden&&context?.state==='running';
 function state(){const list=english(),pair=deliveryVoices(list,beat&&scene?scene.speaker:'narrator',voiceChoicesByStyle,simpleCutscenes),describe=v=>v?{id:voiceId(v),name:v.name,lang:v.lang}:null;return {enabled,ready:ready(),available:!!AudioContext&&!disposed,voiceEnabled,narrationStyle,
  voiceChoices:list.map(describe),narrationVoice:list.some(v=>voiceId(v)===voiceChoicesByStyle[narrationStyle])?voiceChoicesByStyle[narrationStyle]:'',
  effectiveNarrationVoice:describe(pair[narrationStyle]),deliveryVoices:{heroic:describe(pair.heroic),natural:describe(pair.natural)},
  distinctDeliveryVoices:!!pair.heroic&&!!pair.natural&&voiceId(pair.heroic)!==voiceId(pair.natural),
  voiceSupported:!!speech?.speak&&!!Utterance,canNarrate:!!speech?.speak&&!!Utterance&&list.length>0,voiceStatus,voiceError,error,
  effectsVolume,ambienceVolume,sceneActive:!!scene,hidden};}
 const notify=()=>{try{onChange(state());}catch{}};
 const duck=on=>{try{music?.gain.setTargetAtTime(on ? .36 : 1,context.currentTime,.06);}catch{}};
 function clearVoiceTimer(){if(voiceTimer!==null)clearTimer(voiceTimer);voiceTimer=null;}
 function stopVoice(status='idle'){
  voiceToken++;clearVoiceTimer();const owned=utterance;utterance=null;
  if(owned)try{speech.cancel();}catch{}
  voiceStatus=status;duck(false);
 }
 function stopNodes(onlyScene=false){
  for(const item of [...nodes])if(!onlyScene||item.scene){
   try{item.source.stop();}catch{}item.clean();
  }
 }
 function attach(source,gain,filter,forScene){
  const item={source,scene:forScene,clean(){nodes.delete(item);for(const n of [source,gain,filter])try{n?.disconnect();}catch{}}};
  source.onended=item.clean;nodes.add(item);return item;
 }
 function note(frequency,duration=.3,{delay=0,level=.045,type='sine',end=frequency,forScene=true,sustain=false,bus=null}={}){
  if(!ready()||!forScene&&nodes.size>=64||!Number.isFinite(frequency)||frequency<=0)return;
  try{
   const source=context.createOscillator(),gain=context.createGain(),t=context.currentTime+delay;
   source.type=type;source.frequency.setValueAtTime(frequency,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.025);
   if(sustain)gain.gain.linearRampToValueAtTime(level,t+duration*.72);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   source.connect(gain);gain.connect(bus||(forScene?music:effects));attach(source,gain,null,forScene);
   source.start(t);source.stop(t+duration+.02);
  }catch{error='Audio effects could not play. Try enabling audio again.';notify();}
 }
 function rustle(duration=.25,level=.035,cutoff=900,{forScene=true,bus=null}={}){
  if(!ready()||!forScene&&nodes.size>=64)return;
  try{
   if(!noise){noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);let seed=719;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}}
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),t=context.currentTime;
   source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,t);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+Math.min(.12,duration/3));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   source.connect(filter);filter.connect(gain);gain.connect(bus||(forScene?music:effects));attach(source,gain,filter,forScene);
   source.start(t);source.stop(t+duration+.02);
  }catch{error='Forest ambience is unavailable; music and captions remain available.';notify();}
 }
 function bed(){
  musicBar=Math.floor(seconds/4);
  for(const n of retroScoreNotes(scene))note(hz(n.note),n.duration,{delay:n.at,level:n.level,type:n.type});
  rustle(3.9,.008,scene.tone==='marsh'?380:650);
 }
 function cue(c){
  if(c.kind==='rustle')rustle();
  if(c.kind==='step')note(hz(c.note),.13,{level:.035,type:'triangle',end:40});
  if(c.kind==='bird'){note(hz(c.note),.14,{level:.022,end:hz(c.note+4)});note(hz(c.note+7),.17,{delay:.19,level:.018,end:hz(c.note+3)});}
  if(c.kind==='strike'){rustle(.17,.055,1900);note(hz(c.note),.22,{level:.05,type:'triangle',end:hz(c.note-12)});}
  if(c.kind==='harmony'){const duration=c.id==='resolve'?1.4:3.8;note(hz(c.note),duration,{level:.045,type:'triangle',sustain:true});note(hz(c.note+7),duration-.1,{delay:.1,level:.025,sustain:true});}
  if(c.kind==='roots'){bed();note(hz(c.note+7),.7,{level:.035});note(hz(c.note+12),.9,{delay:.2,level:.03});}
 }
 function speakCurrent(){
  if(!scene||!enabled||!unlocked||hidden||disposed||!voiceEnabled)return;
  const key=`${sceneId}:${beat}`;
  if(utterance||spokenKey===key)return;
  const list=english();
  if(!speech?.speak||!Utterance||!list.length){voiceStatus='unavailable';notify();return;}
  const profile=narrationProfile(beat?scene.speaker:'narrator',narrationStyle),token=++voiceToken;
  const u=new Utterance(beat?scene.dialogue:scene.narration);utterance=u;spokenKey=key;voiceError='';voiceStatus='starting';
  u.rate=profile.rate;u.pitch=profile.pitch;u.volume=.9;
  u.voice=deliveryVoices(list,beat?scene.speaker:'narrator',voiceChoicesByStyle,simpleCutscenes)[narrationStyle];u.lang=u.voice.lang||'en-US';
  const current=()=>utterance===u&&voiceToken===token&&!!scene&&enabled&&!hidden&&!disposed;
  u.onstart=()=>{if(!current())return;clearVoiceTimer();voiceStatus='speaking';duck(true);notify();};
  u.onend=()=>{if(!current())return;clearVoiceTimer();utterance=null;voiceStatus='finished';duck(false);notify();};
  u.onerror=event=>{if(!current())return;clearVoiceTimer();utterance=null;voiceStatus='error';voiceError=event.error==='not-allowed'?'Tap Replay narration to start the voice.':'Voice narration could not play. Captions and music are still available.';duck(false);notify();};
  voiceTimer=setTimer(()=>{if(current()&&voiceStatus==='starting'){stopVoice('error');voiceError='Voice did not start. Try Replay narration, or continue with music and captions.';notify();}},3500);
  try{speech.resume?.();speech.speak(u);}catch{u.onerror({error:'synthesis-failed'});}
  notify();
 }
 function wake(){
  if(!ready()||!scene)return;
  for(const c of sceneAudioCues(scene))if(c.at<=seconds)played.add(c.id);
  bed();const root=keys[scene.tone]??50;
  note(hz(root+24),.55,{level:.04});note(hz(root+31),.7,{delay:.16,level:.033});speakCurrent();
 }
 function enable(){
  if(disposed)return Promise.resolve(false);
  enabled=true;unlocked=true;error='';write('canopy-sound-enabled',true);const token=++attempt;
  if(!utterance)spokenKey='';
  try{
   if(!context||context.state==='closed'){
    context=new AudioContext();music=context.createGain();music.connect(context.destination);
    effects=context.createGain();effects.gain.setValueAtTime(effectsVolume,context.currentTime);effects.connect(context.destination);
    ambience=context.createGain();ambience.gain.setValueAtTime(ambienceVolume,context.currentTime);ambience.connect(context.destination);
    context.onstatechange=()=>{if(context.state!=='running'){stopNodes();stopVoice(scene?'interrupted':'idle');}notify();};
   }
   const resumed=context.state==='running'?Promise.resolve():context.resume();
   // Request narration inside the same click that unlocks Web Audio.
   speakCurrent();
   if(ready()){if(scene)wake();else note(420,.15,{forScene:false});}
   notify();
   return Promise.resolve(resumed).then(()=>{
    if(token!==attempt||!enabled||disposed)return false;
    if(context.state!=='running'){error='Tap Enable audio to start playback.';notify();return false;}
    // The initial synchronous path already started its scene.
    if(scene&&!nodes.size)wake();notify();return true;
   }).catch(()=>{if(token===attempt){error='Audio could not start. Tap Enable audio to try again.';stopVoice('interrupted');notify();}return false;});
  }catch{error='Audio is unavailable on this device. The story captions still work.';unlocked=false;stopVoice();notify();return Promise.resolve(false);}
 }
 function mute(){enabled=false;attempt++;write('canopy-sound-enabled',false);stopVoice();stopNodes();notify();}
 function closeScene(){scene=null;sceneId++;stopVoice();stopNodes(true);played.clear();seconds=0;musicBar=-1;spokenKey='';voiceError='';notify();}
 // Original synthesized battlefield instruments, triggered by simulation events.
 function battleCue(kind){
  if(!ready()||scene||effectsVolume===0)return;
  const now=context.currentTime,gap=kind==='kill'?.12:kind==='hit'?.08:.075;
  if(now-(lastCue.get(kind)??-Infinity)<gap)return;
  lastCue.set(kind,now);
  const hit=(f,d,level=.055,type='triangle',end=f*.45,delay=0)=>note(f,d,{forScene:false,level,type,end,delay});
  const air=(d,level,cutoff)=>rustle(d,level,cutoff,{forScene:false});
  switch(kind){
   case 'pine':air(.06,.055,4200);hit(1550,.07,.025,'triangle',600);break;
   case 'watchtower':air(.08,.055,2800);hit(520,.14,.065,'triangle',125);break;
   case 'oak':hit(125,.32,.11,'sine',38);air(.23,.085,420);break;
   case 'palm':air(.48,.07,1300);hit(320,.3,.018,'sine',650);break;
   case 'cypress':air(.19,.085,850);hit(210,.12,.05,'triangle',55);hit(145,.12,.04,'triangle',45,.08);break;
   case 'mushroom':air(.3,.055,480);hit(420,.12,.035,'sine',120);hit(600,.1,.022,'sine',180,.1);break;
   case 'willow':hit(720,.18,.035,'sawtooth',165);air(.12,.025,5000);break;
   case 'cannon':hit(90,.42,.13,'sine',28);air(.24,.11,750);break;
   case 'hit':air(.055,.02,1250);break;
   case 'kill':air(.13,.035,650);break;
   case 'shield':hit(880,.34,.055,'sine',440);hit(1320,.28,.025,'sine',660);break;
   case 'roots':hit(85,.5,.12,'triangle',32);air(.28,.1,700);break;
   case 'wave':hit(220,.22,.06,'triangle',220);hit(330,.3,.055,'triangle',330,.24);break;
   case 'clear':hit(330,.2);hit(440,.25,.05,'triangle',440,.15);hit(660,.4,.05,'triangle',660,.3);break;
   case 'boss':hit(110,.65,.08,'sawtooth',55);hit(82,.7,.06,'triangle',41,.25);break;
   case 'defeat':hit(180,.45);hit(120,.5,.07,'triangle',55,.35);break;
  }
 }
 function battle(events,{active=false,dt=0,phase='running'}={}){
  if(!ready()||scene){battleActive=false;return;}
  if(!active){
   if(battleActive)for(const item of [...nodes])if(!item.scene){try{item.source.stop();}catch{}item.clean();}
   battleActive=false;nextForest=battleSeconds;return;
  }
  battleActive=true;
  const ended=['defeat','victory'].includes(phase);
  if(ended&&lastBattlePhase!==phase){
   for(const item of [...nodes])if(!item.scene){try{item.source.stop();}catch{}item.clean();}
   if(phase==='defeat')battleCue('defeat');
  }
  lastBattlePhase=phase;
  battleSeconds+=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
  if(!ended&&battleSeconds>=nextForest){
   nextForest=battleSeconds+3.8;
   if(ambienceVolume>0){
    rustle(3.9,.045,430,{forScene:false,bus:ambience});
    note(1750,.16,{forScene:false,bus:ambience,level:.025,end:2450,delay:.4});
    note(2200,.2,{forScene:false,bus:ambience,level:.018,end:1700,delay:.65});
   }
  }
  for(const event of events){
   if(event.type==='attack')battleCue(event.guardian);
   else if(event.type==='hit')battleCue('hit');
   else if(event.type==='kill')battleCue('kill');
   else if(event.type==='leak'){if(event.absorbed)battleCue('shield');if(event.damage)battleCue('roots');}
   else if(event.type==='wave-start')battleCue('wave');
   else if(event.type==='wave-clear'||event.type==='victory')battleCue('clear');
   else if(event.type==='boss-arrival')battleCue('boss');
  }
 }
 function setVolume(channel,value){
  const n=Number(value);if(!['effects','ambience'].includes(channel)||!Number.isFinite(n))return false;
  const level=Math.max(0,Math.min(1,n));
  if(channel==='effects')effectsVolume=level;else ambienceVolume=level;
  write('canopy-'+channel+'-volume',level);
  (channel==='effects'?effects:ambience)?.gain.setTargetAtTime(level,context.currentTime,.03);
  notify();return true;
 }
 const voicesChanged=()=>{if(scene&&voiceStatus==='unavailable')speakCurrent();notify();};
 speech?.addEventListener?.('voiceschanged',voicesChanged);
 return {
  get state(){return state();},enable,mute,battle,battleCue,setVolume,toggle(){return ready()?mute():enable();},
  openScene(next,{beat:nextBeat=0}={}){stopNodes();battleActive=false;nextForest=battleSeconds;closeScene();scene=next;beat=nextBeat;sceneId++;voiceStatus='idle';if(ready())wake();notify();},
  setBeat(next){if(!scene||next===beat)return;stopVoice();beat=next;spokenKey='';voiceError='';if(ready())note(hz((keys[scene.tone]??50)+24),.3,{level:.03});speakCurrent();notify();},
  tick(next,{reducedMotion=false}={}){
   if(!scene||!Number.isFinite(next)||next<seconds||hidden)return;
   const elapsed=next-seconds;seconds=next;
   for(const c of sceneAudioCues(scene))if(!played.has(c.id)&&c.at<=seconds){
    played.add(c.id);if(ready()&&seconds-c.at<.25&&(!c.visual||!reducedMotion))cue(c);
   }
   const bar=Math.floor(seconds/4);if(bar!==musicBar){musicBar=bar;if(ready()&&seconds%4<.25&&elapsed<.25)bed();}
  },
  setVoice(value){voiceEnabled=!!value;write('canopy-voice-enabled',voiceEnabled);stopVoice();spokenKey='';voiceError='';if(voiceEnabled)speakCurrent();notify();},
  setNarrationStyle(value){if(!['heroic','natural'].includes(value))return false;narrationStyle=value;write('canopy-narration-style',value);stopVoice();spokenKey='';voiceError='';speakCurrent();notify();return true;},
  setNarrationVoice(value){if(value!==''&&!english().some(v=>voiceId(v)===value))return false;voiceChoicesByStyle[narrationStyle]=value;write('canopy-narration-voice-'+narrationStyle,value);stopVoice();spokenKey='';voiceError='';speakCurrent();notify();return true;},
  replay(){stopVoice();spokenKey='';voiceError='';speakCurrent();},closeScene,
  setHidden(value){if(hidden===!!value)return;hidden=!!value;if(hidden){stopVoice(scene?'interrupted':'idle');stopNodes();}else if(scene&&ready()){bed();if(simpleCutscenes&&voiceStatus==='interrupted'){spokenKey='';speakCurrent();}}notify();},
  tone(frequency,duration=.08){if(!scene)note(frequency,duration,{end:frequency*.6,forScene:false,level:.035});},
  silence(){stopVoice(scene?'interrupted':'idle');stopNodes();notify();},
  dispose(){closeScene();disposed=true;attempt++;stopNodes();speech?.removeEventListener?.('voiceschanged',voicesChanged);if(context){context.onstatechange=null;try{context.close()?.catch(()=>{});}catch{}}}
 };
}
