import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAudio,sceneAudioCues,narrationProfile} from '../src/audio.js';
import {Game} from '../src/engine.js';
import {storyScene} from '../src/story.js';
const scene=()=>storyScene(new Game(),0);
function setup({voices=true,preferences={},failResume=false}={}){
 const contexts=[],sources=[],targets=[],utterances=[],timers=new Map(),prefs=new Map(Object.entries(preferences));
 let cancelCount=0,clockId=0;
 const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(n){targets.push(n);}});
 const node=()=>({connect(){},disconnect(){this.disconnected=true;}});
 class Context{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination={};contexts.push(this);}
  resume(){if(failResume)return Promise.reject(Error('blocked'));this.state='running';this.onstatechange?.();return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  createGain(){return {...node(),gain:param()};}
  createOscillator(){const s={...node(),kind:'tone',frequency:param(),start(){this.started=true;},stop(at){if(at===undefined)this.stopped=true;}};sources.push(s);return s;}
  createBuffer(){return {getChannelData:()=>new Float32Array(16000)};}
  createBiquadFilter(){return {...node(),frequency:param()};}
  createBufferSource(){const s={...node(),kind:'noise',start(){this.started=true;},stop(at){if(at===undefined)this.stopped=true;}};sources.push(s);return s;}
 }
 class Utterance{constructor(text){this.text=text;}}
 const speech=new EventTarget();speech.voices=voices?[{name:'English Local',lang:'en-US',localService:true,default:true}]:[];
 speech.getVoices=()=>speech.voices;speech.resume=()=>{};speech.speak=u=>utterances.push(u);
 speech.cancel=()=>{cancelCount++;utterances.at(-1)?.onerror?.({error:'interrupted'});};
 const audio=createGameAudio({AudioContext:Context,speech,Utterance,
  storage:{getItem:k=>prefs.get(k)??null,setItem:(k,v)=>prefs.set(k,v)},
  setTimer:fn=>{timers.set(++clockId,fn);return clockId;},clearTimer:id=>timers.delete(id)});
 return {audio,contexts,sources,targets,utterances,speech,prefs,timers,
  get cancels(){return cancelCount;},allowResume(){failResume=false;},flush(){for(const fn of [...timers.values()])fn();timers.clear();}};
}

test('audio is opt-in and reload preferences never create a context or speak before a fresh gesture',async()=>{
 for(const enabled of [false,true]){
  const x=setup({preferences:{'canopy-sound-enabled':String(enabled)}});x.audio.openScene(scene());x.audio.tick(8);
  assert.equal(x.contexts.length,0);assert.equal(x.utterances.length,0);assert.equal(x.audio.state.ready,false);
  assert.equal(await x.audio.enable(),true);assert.equal(x.contexts.length,1);assert.ok(x.sources.some(s=>s.kind==='noise'));assert.ok(x.sources.some(s=>s.kind==='tone'));
  assert.equal(x.utterances.length,1);assert.equal(x.utterances[0].text,scene().narration);
  x.audio.dispose();
 }
});

test('scene cues follow held presentation time once, and late clock jumps never burst old effects',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());
 for(let t=.05;t<5.19;t+=.05)x.audio.tick(t);
 const before=x.sources.length;x.audio.tick(5.2);assert.equal(x.sources.length,before+2,'one strike contains a rustle and impact tone');
 x.audio.tick(5.2);assert.equal(x.sources.length,before+2,'held time cannot repeat a strike');
 x.audio.tick(12);assert.equal(x.sources.length,before+2,'missed old cues are not played as a burst');
 x.audio.closeScene();assert.ok(x.sources.filter(s=>s.kind==='noise').every(s=>s.stopped&&s.disconnected));
 x.audio.dispose();
});

test('dialogue and replay replace speech; stale callbacks cannot change the new line or restore music early',async()=>{
 const x=setup(),s=scene();await x.audio.enable();x.audio.openScene(s);
 const first=x.utterances[0];first.onstart();assert.equal(x.targets.at(-1),.36);
 x.audio.setBeat(1);assert.equal(x.cancels,1);assert.equal(x.utterances[1].text,s.dialogue);
 const second=x.utterances[1];second.onstart();first.onend();assert.equal(x.audio.state.voiceStatus,'speaking');assert.equal(x.targets.at(-1),.36);
 second.onend();assert.equal(x.targets.at(-1),1);assert.equal(x.audio.state.voiceStatus,'finished');
 x.audio.replay();assert.equal(x.utterances.length,3);assert.equal(x.utterances[2].text,s.dialogue);
 x.audio.closeScene();const total=x.utterances.length;x.speech.dispatchEvent(new Event('voiceschanged'));x.flush();assert.equal(x.utterances.length,total);assert.equal(x.audio.state.sceneActive,false);
 x.audio.dispose();
});

test('mute stops all sources and narration immediately, while re-enabling starts only the current line',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());x.audio.setBeat(1);
 x.audio.mute();assert.ok(x.sources.every(s=>s.stopped));assert.equal(x.audio.state.ready,false);assert.equal(x.prefs.get('canopy-sound-enabled'),'false');
 const count=x.sources.length;x.audio.tick(8);assert.equal(x.sources.length,count);
 await x.audio.enable();assert.equal(x.utterances.at(-1).text,scene().dialogue);assert.equal(x.audio.state.ready,true);
 x.audio.setVoice(false);assert.equal(x.prefs.get('canopy-voice-enabled'),'false');assert.equal(x.audio.state.voiceEnabled,false);
 const lines=x.utterances.length;x.audio.replay();assert.equal(x.utterances.length,lines);x.audio.dispose();
});

test('hidden tabs stop speech and effects, resume only the bed, and require explicit narration replay',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());x.utterances[0].onstart();
 x.audio.setHidden(true);assert.ok(x.sources.every(s=>s.stopped));assert.equal(x.audio.state.voiceStatus,'interrupted');
 const n=x.sources.length;x.audio.tick(6);assert.equal(x.sources.length,n);
 x.audio.setHidden(false);assert.ok(x.sources.length>n);assert.equal(x.utterances.length,1);
 const resumed=x.sources.length;x.audio.setHidden(false);assert.equal(x.sources.length,resumed,'repeated ownership/visibility confirmations cannot layer more ambience');
 x.audio.replay();assert.equal(x.utterances.length,2);x.audio.dispose();
});

test('missing or asynchronously loaded voices never prevent scene music or queue an obsolete scene',async()=>{
 const x=setup({voices:false});await x.audio.enable();x.audio.openScene(scene());
 assert.equal(x.audio.state.canNarrate,false);assert.equal(x.audio.state.voiceStatus,'unavailable');assert.ok(x.sources.length>0);
 x.speech.voices=[{name:'English',lang:'en-GB',localService:true}];x.speech.dispatchEvent(new Event('voiceschanged'));
 assert.equal(x.utterances.length,1);x.audio.closeScene();x.speech.dispatchEvent(new Event('voiceschanged'));assert.equal(x.utterances.length,1);x.audio.dispose();
});

test('speech failure or a silent startup reports a recoverable state without stopping music',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());
 x.utterances[0].onerror({error:'not-allowed'});assert.match(x.audio.state.voiceError,/Replay narration/);assert.equal(x.audio.state.ready,true);
 x.audio.replay();x.flush();assert.equal(x.audio.state.voiceStatus,'error');assert.match(x.audio.state.voiceError,/did not start/);assert.ok(x.cancels>0);
 x.audio.replay();x.utterances.at(-1).onstart();assert.equal(x.audio.state.voiceStatus,'speaking');assert.equal(x.timers.size,0);x.audio.dispose();
});

test('blocked Web Audio stays visibly not ready and can be retried without a silent rejected promise',async()=>{
 const x=setup({failResume:true});x.audio.openScene(scene());assert.equal(await x.audio.enable(),false);
 assert.equal(x.audio.state.ready,false);assert.match(x.audio.state.error,/could not start/);
 x.allowResume();assert.equal(await x.audio.enable(),true);assert.equal(x.audio.state.ready,true);assert.equal(x.audio.state.error,'');x.audio.dispose();
 const unsupported=createGameAudio();assert.equal(await unsupported.enable(),false);assert.equal(unsupported.state.available,false);unsupported.dispose();
});

test('reduced-motion scenes keep music and voice but omit unseen camera, walking and strike effects',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());const n=x.sources.length;
 x.audio.tick(5.2,{reducedMotion:true});assert.equal(x.sources.length,n);assert.equal(x.utterances.length,1);
 x.audio.tick(8,{reducedMotion:true});assert.ok(x.sources.length>n);x.audio.dispose();
 for(const tone of ['crossing','meadow','marsh','harvest']){
  const cues=sceneAudioCues({...scene(),tone,cinematic:'renewal'});assert.ok(cues.every(c=>Number.isFinite(c.at)));assert.equal(cues.some(c=>c.kind==='strike'),false);
 }
});

test('finishing speech never advances a wave, and teardown prevents late voices from restarting',async()=>{
 const x=setup(),game=new Game(),before=game.snapshot();await x.audio.enable();x.audio.openScene(storyScene(game,0));
 x.utterances[0].onend();assert.deepEqual(game.snapshot(),before);assert.equal(x.audio.state.sceneActive,true);
 x.audio.dispose();const n=x.utterances.length;x.speech.dispatchEvent(new Event('voiceschanged'));x.flush();assert.equal(x.utterances.length,n);assert.equal(x.contexts[0].state,'closed');
});

test('Heroic announcer delivery is deeper and slower, with restrained bounds for every guardian',()=>{
 for(const speaker of ['narrator','oak','pine','palm','cypress','mushroom','willow']){
  const natural=narrationProfile(speaker,'natural'),heroic=narrationProfile(speaker,'heroic');
  assert.ok(heroic.pitch<natural.pitch);assert.ok(heroic.rate<natural.rate);
  assert.ok(heroic.pitch>=.72&&heroic.pitch<=.95);assert.ok(heroic.rate>=.82&&heroic.rate<=.98);
  assert.equal(heroic.index,natural.index);
 }
});

test('delivery changes replay only the current line and persist without unmuting or restarting the scene',async()=>{
 const x=setup();await x.audio.enable();x.audio.openScene(scene());
 assert.equal(x.audio.state.narrationStyle,'heroic');const original=x.utterances[0];
 x.audio.setNarrationStyle('natural');assert.equal(x.utterances.length,2);assert.equal(x.utterances[1].text,original.text);
 assert.ok(x.utterances[1].pitch>original.pitch);assert.ok(x.utterances[1].rate>original.rate);assert.equal(x.prefs.get('canopy-narration-style'),'natural');
 original.onend();assert.equal(x.audio.state.voiceStatus,'starting');
 const before=x.utterances.length;assert.equal(x.audio.setNarrationStyle('unsupported'),false);assert.equal(x.utterances.length,before);
 x.audio.mute();x.audio.setNarrationStyle('heroic');assert.equal(x.utterances.length,before);assert.equal(x.audio.state.ready,false);x.audio.dispose();
 const restored=setup({preferences:{'canopy-narration-style':'natural'}});assert.equal(restored.audio.state.narrationStyle,'natural');assert.equal(restored.contexts.length,0);restored.audio.dispose();
});

test('voice selection uses only available English voices and remains selected across dialogue and reload',async()=>{
 const low={voiceURI:'voice-low',name:'Low device voice',lang:'en-GB',localService:true},other={voiceURI:'voice-other',name:'Other device voice',lang:'en-US',localService:true};
 const x=setup();x.speech.voices=[low,other,{voiceURI:'voice-fr',name:'French',lang:'fr-FR'}];
 await x.audio.enable();x.audio.openScene(scene());assert.equal(x.audio.state.voiceChoices.length,2);
 assert.equal(x.audio.setNarrationVoice('voice-low'),true);assert.equal(x.utterances.at(-1).voice,low);assert.equal(x.utterances.at(-1).lang,'en-GB');
 x.audio.setBeat(1);assert.equal(x.utterances.at(-1).voice,low);assert.equal(x.utterances.at(-1).text,scene().dialogue);
 assert.equal(x.audio.setNarrationVoice('voice-fr'),false);assert.equal(x.audio.state.narrationVoice,'voice-low');
 const saved=Object.fromEntries(x.prefs);x.audio.dispose();
 const restored=setup({preferences:saved});restored.speech.voices=[low,other];restored.audio.openScene(scene());assert.equal(restored.contexts.length,0);
 await restored.audio.enable();assert.equal(restored.utterances[0].voice,low);assert.equal(restored.audio.state.narrationVoice,'voice-low');
 restored.speech.voices=[];restored.speech.dispatchEvent(new Event('voiceschanged'));assert.equal(restored.audio.state.narrationVoice,'');assert.equal(restored.audio.state.canNarrate,false);restored.audio.dispose();
});
