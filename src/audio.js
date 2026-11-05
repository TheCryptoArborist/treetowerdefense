// Original scene score and optional device narration. No game/payment state lives here.
const hz=midi=>440*2**((midi-69)/12);
const keys={crossing:50,meadow:55,marsh:40,harvest:45};
const voices={narrator:[.94,.94,0],oak:[.96,.82,1],pine:[1.02,1.08,2],palm:[.98,1.02,3],cypress:[.96,.92,1],mushroom:[1.02,1.15,2],willow:[.92,.88,3]};
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

export function createGameAudio({AudioContext,speech,Utterance,storage,onChange=()=>{},
 setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const read=(key,fallback)=>{try{const v=storage?.getItem(key);return v===null||v===undefined?fallback:v==='true';}catch{return fallback;}};
 const write=(key,v)=>{try{storage?.setItem(key,String(v));}catch{}};
 let enabled=read('canopy-sound-enabled',false),voiceEnabled=read('canopy-voice-enabled',true);
 let context=null,music=null,noise=null,unlocked=false,hidden=false,disposed=false,error='';
 let scene=null,beat=0,seconds=0,played=new Set(),utterance=null,voiceToken=0,voiceTimer=null;
 let voiceStatus='idle',voiceError='',spokenKey='',sceneId=0,attempt=0;
 const nodes=new Set();
 const english=()=>{try{return (speech?.getVoices()||[]).filter(v=>/^en(?:-|_)?/i.test(v.lang)).sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(b.default)-Number(a.default)||a.name.localeCompare(b.name));}catch{return [];}};
 const ready=()=>!disposed&&enabled&&unlocked&&!hidden&&context?.state==='running';
 function state(){return {enabled,ready:ready(),available:!!AudioContext&&!disposed,voiceEnabled,
  voiceSupported:!!speech?.speak&&!!Utterance,canNarrate:!!speech?.speak&&!!Utterance&&english().length>0,voiceStatus,voiceError,error,
  sceneActive:!!scene,hidden};}
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
 function note(frequency,duration=.3,{delay=0,level=.045,type='sine',end=frequency,forScene=true,sustain=false}={}){
  if(!ready()||!Number.isFinite(frequency)||frequency<=0)return;
  try{
   const source=context.createOscillator(),gain=context.createGain(),t=context.currentTime+delay;
   source.type=type;source.frequency.setValueAtTime(frequency,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.025);
   if(sustain)gain.gain.linearRampToValueAtTime(level,t+duration*.72);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   source.connect(gain);gain.connect(forScene?music:context.destination);attach(source,gain,null,forScene);
   source.start(t);source.stop(t+duration+.02);
  }catch{error='Audio effects could not play. Try enabling audio again.';notify();}
 }
 function rustle(duration=.25,level=.035,cutoff=900){
  if(!ready())return;
  try{
   if(!noise){noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);let seed=719;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}}
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),t=context.currentTime;
   source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,t);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+Math.min(.12,duration/3));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   source.connect(filter);filter.connect(gain);gain.connect(music);attach(source,gain,filter,true);
   source.start(t);source.stop(t+duration+.02);
  }catch{error='Forest ambience is unavailable; music and captions remain available.';notify();}
 }
 function bed(){
  const root=keys[scene.tone]??50;
  note(hz(root),3.8,{level:.05,type:'triangle',sustain:true});note(hz(root+7),3.6,{delay:.16,level:.03,type:'sine',sustain:true});
  rustle(3.9,.022,scene.tone==='marsh'?380:650);
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
  const profile=voices[beat?scene.speaker:'narrator']||voices.narrator,token=++voiceToken;
  const u=new Utterance(beat?scene.dialogue:scene.narration);utterance=u;spokenKey=key;voiceError='';voiceStatus='starting';
  u.lang='en-US';u.rate=profile[0];u.pitch=profile[1];u.volume=.9;u.voice=list[profile[2]%list.length];
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
 function closeScene(){scene=null;sceneId++;stopVoice();stopNodes(true);played.clear();seconds=0;spokenKey='';voiceError='';notify();}
 const voicesChanged=()=>{if(scene&&voiceStatus==='unavailable')speakCurrent();notify();};
 speech?.addEventListener?.('voiceschanged',voicesChanged);
 return {
  get state(){return state();},enable,mute,toggle(){return ready()?mute():enable();},
  openScene(next,{beat:nextBeat=0}={}){closeScene();scene=next;beat=nextBeat;sceneId++;voiceStatus='idle';if(ready())wake();notify();},
  setBeat(next){if(!scene||next===beat)return;stopVoice();beat=next;spokenKey='';voiceError='';if(ready())note(hz((keys[scene.tone]??50)+24),.3,{level:.03});speakCurrent();notify();},
  tick(next,{reducedMotion=false}={}){
   if(!scene||!Number.isFinite(next)||next<seconds||hidden)return;
   seconds=next;
   for(const c of sceneAudioCues(scene))if(!played.has(c.id)&&c.at<=seconds){
    played.add(c.id);if(ready()&&seconds-c.at<.25&&(!c.visual||!reducedMotion))cue(c);
   }
  },
  setVoice(value){voiceEnabled=!!value;write('canopy-voice-enabled',voiceEnabled);stopVoice();spokenKey='';voiceError='';if(voiceEnabled)speakCurrent();notify();},
  replay(){stopVoice();spokenKey='';voiceError='';speakCurrent();},closeScene,
  setHidden(value){if(hidden===!!value)return;hidden=!!value;if(hidden){stopVoice(scene?'interrupted':'idle');stopNodes();}else if(scene&&ready())bed();notify();},
  tone(frequency,duration=.08){if(!scene)note(frequency,duration,{end:frequency*.6,forScene:false,level:.035});},
  silence(){stopVoice(scene?'interrupted':'idle');stopNodes();notify();},
  dispose(){closeScene();disposed=true;attempt++;stopNodes();speech?.removeEventListener?.('voiceschanged',voicesChanged);if(context){context.onstatechange=null;try{context.close()?.catch(()=>{});}catch{}}}
 };
}
