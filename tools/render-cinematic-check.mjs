// Offline captures of the production painter; no holder/session/payment stubs.
// Uses the Work runtime's native canvas, not a production dependency.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';
import {Game} from '../src/engine.js';import {storyScene} from '../src/story.js';import {paintStory} from '../src/story-art.js';
import {installEnvironmentAsset,installAimSprite,paintTree,getGuardianShotOrigin,paintShot} from '../src/art.js';
import {installEnemySprite} from '../src/enemy-art.js';import {facingFor,GUARDIAN_SCALE,SHOT_DURATION} from '../src/aiming.js';
const out='.netlify/cinematic-check';fs.mkdirSync(out,{recursive:true});
installEnvironmentAsset('tree',await loadImage('assets/environment/tree-life-v1.png'),createCanvas);
for(const type of ['oak','pine','palm','cypress','mushroom','willow'])installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
installEnemySprite('ironroot',await loadImage('assets/enemies/ironroot-walk-v1.png'),createCanvas);
const g=new Game(),scene=storyScene(g,3),canvas=createCanvas(960,420),c=canvas.getContext('2d');
const sheet=createCanvas(960,630),s=sheet.getContext('2d');let index=0;
for(const t of [1.5,5.3,10.9,13.7,16.5,19.3]){paintStory(c,scene,t);s.drawImage(canvas,(index%2)*480,Math.floor(index/2)*210,480,210);index++;}
// Real Oak atlas: every growth row and all eight directions, with origins marked.
const oak=createCanvas(1200,540),o=oak.getContext('2d');o.fillStyle='#172b31';o.fillRect(0,0,1200,540);
for(let level=1;level<=3;level++)for(let direction=0;direction<8;direction++){
 const a=direction*Math.PI/4,facing=facingFor(Math.sin(a),Math.cos(a)),x=direction*150+75,y=level*180-24;
 paintTree(o,'oak',x,y,GUARDIAN_SCALE,0,level,0,true,facing);
 const shot={type:'oak',level,style:0,facing,x,y,tx:x+Math.sin(a)*55,ty:y-35+Math.cos(a)*20,life:SHOT_DURATION};
 const origin=getGuardianShotOrigin(shot);assert.ok(origin.y<y,'Loaded Oak atlas socket must be above the feet');
 paintShot(o,{...shot,origin});o.beginPath();o.arc(origin.x,origin.y,3,0,Math.PI*2);o.fillStyle='#ff645b';o.fill();
}
fs.writeFileSync(`${out}/oak-hand-sockets.jpg`,oak.toBuffer('image/jpeg'));
fs.writeFileSync(`${out}/scene-frames.jpg`,sheet.toBuffer('image/jpeg'));
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','960x420','-r','24','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/Canopy-Defense-Action-Cutscene-Preview.mp4`],{stdio:['pipe','ignore','pipe']});let errors='';ff.stderr.on('data',b=>errors+=b);
for(let i=0;i<480;i++){paintStory(c,scene,i/24);if(!ff.stdin.write(c.getImageData(0,0,960,420).data))await once(ff.stdin,'drain');}
ff.stdin.end();const[code]=await once(ff,'exit');assert.equal(code,0,errors);
console.log(JSON.stringify({seconds:20,frames:480,allOakDirections:24,videoBytes:fs.statSync(`${out}/Canopy-Defense-Action-Cutscene-Preview.mp4`).size,limit:'Silent offline production painter preview, not authenticated browser acceptance.'}));
