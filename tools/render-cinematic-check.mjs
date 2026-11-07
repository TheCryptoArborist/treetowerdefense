// Offline captures of the production retro painter with the original game art.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';
import {Game} from '../src/engine.js';import {storyScene} from '../src/story.js';import {paintStory} from '../src/story-art.js';
import {installEnvironmentAsset,installAimSprite} from '../src/art.js';import {installEnemySprite} from '../src/enemy-art.js';
import {installStorySurfaceFactory} from '../src/story-retro.js';
import {retroScoreNotes,sceneAudioCues} from '../src/audio.js';
const out='.netlify/cinematic-check';fs.mkdirSync(out,{recursive:true});
installStorySurfaceFactory(createCanvas);
installEnvironmentAsset('tree',await loadImage('assets/environment/tree-life-v1.png'),createCanvas);
for(const type of ['oak','pine','palm','cypress','mushroom','willow'])installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
installEnemySprite('ironroot',await loadImage('assets/enemies/ironroot-walk-v1.png'),createCanvas);
const g=new Game(),scene=storyScene(g,3),ending=storyScene(g,10),canvas=createCanvas(960,420),c=canvas.getContext('2d');
function frame(t){
 const s=t>=20?ending:scene,beat=t>=12?1:0,seconds=t>=20?t-20:t;
 paintStory(c,s,seconds,{beat,captionSeconds:t>=20?t-20:t>=12?t-12:t});
}
const sheet=createCanvas(1920,1260),s=sheet.getContext('2d');
for(const [i,t] of [1.5,5.6,7,9.5,15,24].entries()){
 frame(t);fs.writeFileSync(`${out}/retro-review-${i}.png`,canvas.toBuffer('image/png'));
 s.drawImage(canvas,(i%2)*960,Math.floor(i/2)*420);
}
fs.writeFileSync(`${out}/retro-contact-sheet.jpg`,sheet.toBuffer('image/jpeg'));
const seconds=26,fps=12,frames=seconds*fps;
// Render the same original pulse/triangle phrases to PCM for a portable preview.
// Device narration remains device-dependent and is not imitated in this clip.
const sampleRate=22050,samples=new Float32Array(seconds*sampleRate);
function tone(at,duration,midi,level,type='square',endMidi=midi){
 const start=Math.round(at*sampleRate),count=Math.round(duration*sampleRate);let phase=0;
 for(let i=0;i<count&&start+i<samples.length;i++){
  const t=i/sampleRate,u=i/count,frequency=440*2**((midi+(endMidi-midi)*u-69)/12);phase+=frequency/sampleRate;
  const sine=Math.sin(phase*Math.PI*2),wave=type==='triangle'?Math.asin(sine)*2/Math.PI:type==='square'?(sine<0?-1:1):sine;
  const envelope=Math.min(1,t/.025)*Math.max(0,1-u)**1.3;samples[start+i]+=wave*envelope*level;
 }
}
for(let bar=0;bar<seconds;bar+=4)for(const n of retroScoreNotes(bar>=20?ending:scene))tone(bar+n.at,n.duration,n.note,n.level,n.type);
for(const [s,offset] of [[scene,0],[ending,20]])for(const cue of sceneAudioCues(s)){
 if(offset+cue.at>=seconds)continue;
 if(cue.kind==='strike')tone(offset+cue.at,.24,cue.note+12,.05,'triangle',cue.note-12);
 else if(cue.kind==='step')tone(offset+cue.at,.1,cue.note,.02,'triangle',25);
 else if(cue.note)tone(offset+cue.at,cue.kind==='harmony'?.65:.2,cue.note,.018,'triangle');
}
let peak=0;for(const n of samples)peak=Math.max(peak,Math.abs(n));
const pcm=Buffer.alloc(samples.length*2+44);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(sampleRate,24);pcm.writeUInt32LE(sampleRate*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(samples.length*2,40);
for(let i=0;i<samples.length;i++)pcm.writeInt16LE(Math.round(samples[i]/Math.max(.001,peak)*.42*32767),44+i*2);
const audioPath=`${out}/retro-score.wav`;fs.writeFileSync(audioPath,pcm);
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','960x420','-r',String(fps),'-i','pipe:0','-i',audioPath,'-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',`${out}/Canopy-Defense-Action-Cutscene-Preview.mp4`],{stdio:['pipe','ignore','pipe']});let errors='';ff.stderr.on('data',b=>errors+=b);
for(let i=0;i<frames;i++){frame(i/fps);if(!ff.stdin.write(c.getImageData(0,0,960,420).data))await once(ff.stdin,'drain');}
ff.stdin.end();const[code]=await once(ff,'exit');assert.equal(code,0,errors);
console.log(JSON.stringify({seconds,frames,fps,logicalSize:'320x140',originalGuardianArtwork:true,originalChiptuneScore:true,videoBytes:fs.statSync(`${out}/Canopy-Defense-Action-Cutscene-Preview.mp4`).size,limit:'Offline production painter and score preview; holder/browser/device narration acceptance remains pending.'}));
