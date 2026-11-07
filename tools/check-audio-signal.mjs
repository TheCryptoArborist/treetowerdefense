// Optional development check: pass the path to web-audio-engine's entry module.
// This renders the real audio graph offline, not browser/device narration.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createGameAudio} from '../src/audio.js';
import {Game} from '../src/engine.js';
import {storyScene} from '../src/story.js';
assert(process.argv[2],'Pass the installed web-audio-engine entry module path');
const {default:engine}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const reports=[];
for(const tone of ['crossing','meadow','marsh','harvest']){
 let native,started=false;
 class Context{
  constructor(){
   native=new engine.RenderingAudioContext({sampleRate:22050,numberOfChannels:1});
   // RenderingAudioContext temporarily suspends between offline render steps;
   // keep that development-only behavior separate from browser suspension.
   return new Proxy(native,{get(target,key){
    if(key==='state')return started?'running':'suspended';
    if(key==='resume')return()=>{started=true;return Promise.resolve();};
    if(key==='close')return()=>{started=false;return Promise.resolve();};
    const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;
   },set(target,key,value){if(key==='onstatechange')return true;return Reflect.set(target,key,value,target);}});
  }
 }
 const audio=createGameAudio({AudioContext:Context,storage:{getItem:k=>k==='canopy-voice-enabled'?'false':null}});
 await audio.enable();audio.openScene({...storyScene(new Game(),0),tone});
 for(let i=0;i<=240;i++){const t=i/20;audio.tick(t);native.processTo(t+.05);}
 audio.closeScene();const silentStart=Math.ceil((native.currentTime+.15)*native.sampleRate);native.processTo(native.currentTime+1);
 const data=native.exportAsAudioData(),samples=data.channelData[0];let peak=0,sum=0,tail=0;
 for(const n of samples){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));sum+=n*n;}
 for(let i=silentStart;i<samples.length;i++)tail=Math.max(tail,Math.abs(samples[i]));
 const rms=Math.sqrt(sum/samples.length);assert.ok(rms>.001&&peak<.9);assert.ok(tail<1e-8,'skip/close must silence the graph');assert.equal(audio.state.error,'');
 const secondRms=Array.from({length:12},(_,second)=>{const a=samples.subarray(second*data.sampleRate,(second+1)*data.sampleRate);return Math.sqrt(a.reduce((s,n)=>s+n*n,0)/a.length);});
 assert.ok(secondRms.every(n=>n>.001),'the scene score must not fall silent between action cues');
 reports.push({tone,seconds:samples.length/data.sampleRate,rms,peak,secondRms,silentAfterClose:tail<1e-8});audio.dispose();
}
const result={verification:'Offline graph rendering; browser/device audio and narration acceptance remain pending',reports};
fs.mkdirSync('.netlify/audio-check',{recursive:true});fs.writeFileSync('.netlify/audio-check/signal-verification.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
