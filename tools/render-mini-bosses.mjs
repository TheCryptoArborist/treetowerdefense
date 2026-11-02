// Actual game painter, offline: no wallet/session or hosted page emulation.
import {createCanvas} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {paintPest} from '../src/art.js';
import {MINI_BOSSES} from '../src/engine.js';
const canvas=createCanvas(1050,420),c=canvas.getContext('2d');
c.fillStyle='#040810';c.fillRect(0,0,1050,420);c.font='bold 25px sans-serif';c.fillStyle='#7ef3a0';c.fillText('CANOPY DEFENSE · MINI-BOSS ENCOUNTERS',28,42);
for(const [i,[key,info]] of Object.entries(MINI_BOSSES).entries()){
 const x=175+i*350;c.fillStyle='#0c242b';c.fillRect(x-150,70,300,320);
 c.save();c.translate(x,230);c.scale(1.3,1.3);paintPest(c,{kind:'boss',miniBoss:key,x:0,y:0,id:1,hp:info.hp,maxHp:info.hp,appearanceTier:1,slowUntil:0,poisonUntil:0},0,0,{healthBar:false,reducedMotion:true});c.restore();
 c.textAlign='center';c.fillStyle='#ffd84b';c.font='bold 19px sans-serif';c.fillText(info.name,x,325);c.fillStyle='#bed4cc';c.font='14px sans-serif';c.fillText(info.trait,x,351);c.textAlign='left';
}
fs.writeFileSync('docs/mini-boss-preview.png',canvas.toBuffer('image/png'));
