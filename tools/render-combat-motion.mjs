// Inspect the real painters and source art without bypassing holder access.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {TOWERS,MINI_BOSSES} from '../src/engine.js';
import {paintTree,paintPest,paintShot,getGuardianShotOrigin,installAimSprite,installStructureSprite} from '../src/art.js';
import {installEnemySprite} from '../src/enemy-art.js';
import {defenderMotion} from '../src/defender-motion.js';
import {facingFor,SHOT_DURATION,GUARDIAN_SCALE} from '../src/aiming.js';

const out='.netlify/combat-motion';fs.mkdirSync(out,{recursive:true});
const types=Object.keys(TOWERS),hash=c=>crypto.createHash('sha256').update(c.getContext('2d').getImageData(0,0,c.width,c.height).data).digest('hex');
for(const type of types){
  const structure=TOWERS[type].structure;
  const image=await loadImage(structure?`assets/towers/${type}-base-v1.png`:`assets/defenders/${type}-aim-v1.png`);
  (structure?installStructureSprite:installAimSprite)(type,image,createCanvas);
  globalThis.gc?.();
}
for(const [kind,file]of Object.entries({ironroot:'ironroot',saw:'chainsaw-raider',sprayer:'blight-sprayer'}))installEnemySprite(kind,await loadImage(`assets/enemies/${file}-walk-v1.png`),createCanvas);

let combinations=0;
const probe=createCanvas(260,260),p=probe.getContext('2d');
for(const type of types)for(let level=1;level<=3;level++)for(let style=0;style<6;style++)for(let direction=0;direction<8;direction++){
  const angle=direction*Math.PI/4,facing=facingFor(Math.sin(angle),Math.cos(angle));
  const render=options=>{p.clearRect(0,0,260,260);paintTree(p,type,130,210,1.2,style,level,0,false,facing,defenderMotion(type,{direction,...options}));return hash(probe);};
  const rest=render({}),action=render({age:.07});assert.notEqual(rest,action,`${type}/${level}/${style}/${direction} must visibly perform its attack`);
  assert.equal(render({age:0,reducedMotion:true}),render({age:.18,reducedMotion:true}));
  assert.equal(rest,render({age:1}));combinations++;
  if(combinations%16===0)globalThis.gc?.();
}

const frames=createCanvas(1280,970),f=frames.getContext('2d');f.fillStyle='#07151d';f.fillRect(0,0,1280,970);
f.font='bold 25px sans-serif';f.fillStyle='#7ef3a0';f.fillText('CANOPY DEFENSE · COMBAT MOTION',24,36);
f.font='15px sans-serif';f.fillStyle='#c6dbd5';f.fillText('Actual source art and painter · preparation / firing pose / follow-through / settled',24,63);
for(const [row,type]of types.entries()){
  const y=90+row*108;f.fillStyle='#10262d';f.fillRect(12,y,1256,100);f.fillStyle='#ffd84b';f.font='bold 16px sans-serif';f.fillText(TOWERS[type].name,24,y+30);
  const facing=facingFor(1,0);
  for(const [col,options]of [{prepare:.5},{age:0},{age:.07},{age:.35}].entries()){
    paintTree(f,type,380+col*240,y+84,.85,0,2,0,false,facing,defenderMotion(type,{direction:2,...options}));
  }
}
fs.writeFileSync(`${out}/attack-phases.png`,frames.toBuffer('image/png'));

const canvas=createCanvas(960,720),c=canvas.getContext('2d');
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','960x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/Canopy-Defense-Combat-Motion-Preview.mp4`],{stdio:['pipe','ignore','pipe']});
let errors='';ff.stderr.on('data',b=>errors+=b);
for(let frame=0;frame<288;frame++){
  canvas.width=960;c.save();c.scale(.75,.75);
  const t=frame/24,direction=[2,0,6,4][Math.floor(t/3)],angle=direction*Math.PI/4,facing=facingFor(Math.sin(angle),Math.cos(angle));
  c.fillStyle='#07151d';c.fillRect(0,0,1280,960);c.fillStyle='#7ef3a0';c.font='bold 25px sans-serif';c.fillText('CANOPY DEFENSE · COMBAT MOTION PREVIEW',24,34);
  c.fillStyle='#c6dbd5';c.font='15px sans-serif';c.fillText('Actual game renderer · original combat cadence · facing '+['S','SE','E','NE','N','NW','W','SW'][direction],24,61);
  for(const [i,type]of types.entries()){
    const x=(i%4)*320,y=82+Math.floor(i/4)*305;
    c.fillStyle='#10262d';c.fillRect(x+8,y,304,295);c.fillStyle='#293d36';c.beginPath();c.ellipse(x+160,y+243,77,20,0,0,Math.PI*2);c.fill();
    c.fillStyle='#ffd84b';c.font='bold 19px sans-serif';c.fillText(TOWERS[type].name,x+22,y+28);
    const local=t%TOWERS[type].interval,prepare=local>TOWERS[type].interval-.14?1-(TOWERS[type].interval-local)/.14:0;
    const motion=defenderMotion(type,{age:local,prepare,direction}),scale=1.38;
    paintTree(c,type,x+160,y+225,scale,0,2,0,local<SHOT_DURATION,facing,motion);
    if(local<SHOT_DURATION){
      c.save();c.translate(x+160,y+225);c.scale(scale/GUARDIAN_SCALE,scale/GUARDIAN_SCALE);
      const shot={type,x:0,y:0,tx:Math.sin(angle)*82,ty:-30+Math.cos(angle)*50,level:2,style:0,facing,life:SHOT_DURATION-local};
      shot.origin=getGuardianShotOrigin(shot);paintShot(c,shot);c.restore();
    }
    c.fillStyle='#aac6bb';c.font='14px sans-serif';c.fillText({idle:'READY',prepare:'PREPARING',release:'STRIKE',recovery:'RECOVERING',reload:'RELOADING'}[motion.phase],x+22,y+278);
  }
  for(const [i,kind]of ['ironroot','saw','sprayer'].entries()){
    const x=i*426+213,y=872,e={kind:'boss',miniBoss:kind,id:i,progress:t*MINI_BOSSES[kind].speed,x,y,hp:500,maxHp:500};
    paintPest(c,e,t,t,{healthBar:false,facingAngle:angle+Math.PI});c.fillStyle='#d0ded4';c.font='18px sans-serif';c.textAlign='center';c.fillText(MINI_BOSSES[kind].name,x,930);c.textAlign='left';
  }
  c.restore();
  if(!ff.stdin.write(c.getImageData(0,0,960,720).data))await once(ff.stdin,'drain');
  if(frame%12===0)globalThis.gc?.();
}
ff.stdin.end();const[code]=await once(ff,'exit');assert.equal(code,0,errors);
const result={renderedDefenderCombinations:combinations,allEightDefendersVisiblyAnimate:true,reducedMotionStatic:true,videoSeconds:12,video:`${out}/Canopy-Defense-Combat-Motion-Preview.mp4`,capture:'Offline production painters, not an authenticated holder session'};
fs.writeFileSync(`${out}/verification.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
