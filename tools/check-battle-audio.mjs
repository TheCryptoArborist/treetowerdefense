// Render the actual battle graph offline; never connects a wallet or changes saves.
// Pass the installed web-audio-engine index.js as the first argument.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import {createGameAudio} from '../src/audio.js';
const {default:engine}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const signatures=new Set(),results=[];
for(const kind of ['oak','pine','palm','cypress','mushroom','willow','watchtower','cannon','shield','roots','wave','clear','boss','defeat','crowded-battle']){
 let native,started=false;
 class Context{constructor(){native=new engine.RenderingAudioContext({sampleRate:22050,numberOfChannels:1});return new Proxy(native,{get(t,k){if(k==='state')return started?'running':'suspended';if(k==='resume')return()=>{started=true;return Promise.resolve();};if(k==='close')return()=>Promise.resolve();const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){if(k==='onstatechange')return true;return Reflect.set(t,k,v,t);}});}}
 const audio=createGameAudio({AudioContext:Context});await audio.enable();native.processTo(.3);
 if(kind==='crowded-battle')audio.battle(['oak','pine','palm','cypress','mushroom','willow','watchtower','cannon'].map(guardian=>({type:'attack',guardian})),{active:true,dt:.05});else audio.battleCue(kind);native.processTo(1.8);
 const data=native.exportAsAudioData().channelData[0].slice(Math.ceil(.3*native.sampleRate));
 let peak=0,total=0;for(const x of data){assert(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));total+=x*x;}
 const rms=Math.sqrt(total/data.length);assert(peak<.9&&rms>.0001,`${kind}: signal missing or clipping`);
 const hash=crypto.createHash('sha256').update(Buffer.from(data.buffer,data.byteOffset,data.byteLength)).digest('hex');assert(!signatures.has(hash),`${kind}: duplicate sound`);signatures.add(hash);
 audio.mute();native.processTo(2.3);const tail=native.exportAsAudioData().channelData[0].slice(Math.ceil(2*native.sampleRate));assert(tail.every(x=>Math.abs(x)<1e-8),'mute must stop output');
 results.push({kind,peak:+peak.toFixed(4),rms:+rms.toFixed(5)});audio.dispose();
}
console.log(JSON.stringify(results,null,2));
