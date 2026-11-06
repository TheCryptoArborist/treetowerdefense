// An isolated local component check, without holder access, gameplay or payments.
import fs from 'node:fs';
import {Game,TOWERS} from '../src/engine.js';
import {storyScene} from '../src/story.js';
const app=fs.readFileSync('src/app.js','utf8'),index=fs.readFileSync('index.html','utf8');
const audio=fs.readFileSync('src/audio.js','utf8').replaceAll('export function','function');
const storyArt=fs.readFileSync('src/story-art.js','utf8');
const motionSettings=storyArt.slice(storyArt.indexOf('export function createStoryMotionSettings')).replace('export function','function');
const controller=app.slice(app.indexOf('let audioStorage;'),app.indexOf('let storyEnabled='))
 .replace('AudioContext:window.AudioContext||window.webkitAudioContext','AudioContext:MeteredContext')
 .split('\n').filter(line=>!line.startsWith('window.canopyAccess.subscribe(')).join('\n');
const beat=app.slice(app.indexOf('function renderStoryBeat(){'),app.indexOf('const stories=createStoryDirector'));
const dialog=index.match(/<dialog id="story-dialog"[\s\S]*?<\/dialog>/)[0]
 .replace('</dialog>','<output id="qa-audio-check" style="display:block;padding:10px 24px;color:#b9e5d4;font:12px monospace"></output></dialog>');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Canopy cutscene audio check</title>
<style>${fs.readFileSync('styles.css','utf8')}</style><main style="padding:20px"><h1>Cutscene audio check</h1><p>Isolated component · no game, wallet or payments.</p><button id="sound-button" aria-pressed="false">Enable sound</button> <button id="qa-open">Open cutscene</button></main>${dialog}
<script type="module">
${audio}
${motionSettings}
const $=id=>document.getElementById(id),observed=[];
const NativeContext=window.AudioContext||window.webkitAudioContext;
class MeteredContext{
 constructor(){
  const context=new NativeContext(),meter=context.createAnalyser();meter.fftSize=1024;meter.connect(context.destination);observed.push({context,meter,peak:0});
  return new Proxy(context,{get(target,key){if(key==='destination')return meter;const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;},set(target,key,value){return Reflect.set(target,key,value,target);}});
 }
}
${controller}
let activeScene=${JSON.stringify(storyScene(new Game(),0))},storyBeat=0,started=0;
const TOWERS=${JSON.stringify(Object.fromEntries(Object.entries(TOWERS).map(([k,v])=>[k,{name:v.name}])))};
${beat}
const dialog=$('story-dialog');
$('qa-open').onclick=()=>{
 storyBeat=0;started=performance.now();gameAudio.openScene(activeScene);renderStoryBeat();
 $('story-title').textContent=activeScene.title;$('story-chapter').textContent=activeScene.chapter;
 $('story-stage-label').textContent=activeScene.eyebrow;$('story-hint').textContent=activeScene.hint;
 const c=$('story-cinema').getContext('2d');c.fillStyle='#173d32';c.fillRect(0,0,960,420);c.fillStyle='#b9f3ca';c.font='bold 34px Georgia';c.fillText('THE SEVERED ROOT',65,210);
 dialog.showModal();
};
$('story-next').onclick=()=>{if(storyBeat===0){storyBeat=1;renderStoryBeat();}else dialog.close();};
$('story-skip').onclick=()=>dialog.close();dialog.addEventListener('close',()=>gameAudio.closeScene());
document.addEventListener('visibilitychange',()=>gameAudio.setHidden(document.hidden));
setInterval(()=>{
 if(dialog.open&&!document.hidden)gameAudio.tick(Math.min(12,(performance.now()-started)/1000));
 let current=0,peak=0;
 for(const o of observed){const data=new Float32Array(1024);o.meter.getFloatTimeDomainData(data);const rms=Math.sqrt(data.reduce((a,b)=>a+b*b,0)/data.length);o.peak=Math.max(o.peak,rms);current=Math.max(current,rms);peak=Math.max(peak,o.peak);}
 $('qa-audio-check').textContent='Output '+(gameAudio.state.ready?'enabled':'muted')+' · current '+current.toFixed(5)+' · peak '+peak.toFixed(5)+' · contexts '+observed.length+' · voice '+gameAudio.state.voiceStatus;
},100);
window.addEventListener('pagehide',()=>gameAudio.dispose());
</script>`;
fs.mkdirSync('.netlify/audio-check',{recursive:true});
fs.writeFileSync('.netlify/audio-check/desktop.html',html);
fs.writeFileSync('.netlify/audio-check/phone.html',`<!doctype html><title>Canopy phone audio check</title><style>body{margin:0;background:#101720}iframe{display:block;width:390px;height:844px;border:0;margin:10px auto}</style><iframe id="qa-frame" title="Canopy phone cutscene"></iframe><script>document.getElementById('qa-frame').srcdoc=${JSON.stringify(html).replaceAll('<','\\u003c')};</script>`);
console.log('Wrote isolated desktop/390px audio checks under .netlify/audio-check/');
