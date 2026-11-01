// Contact sheet rendered from the actual game painter; no generated replacement art.
import {createCanvas} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {paintPest} from '../src/art.js';
const canvas=createCanvas(1060,900),c=canvas.getContext('2d');
c.fillStyle='#040810';c.fillRect(0,0,1060,900);c.fillStyle='#7ef3a0';c.font='bold 25px sans-serif';c.fillText('CANOPY DEFENSE · ENEMY GROWTH',32,45);
c.fillStyle='#b6ccc5';c.font='14px sans-serif';c.fillText('Actual game artwork · size follows existing wave and chapter health progression',32,73);
const columns=[['EARLY',0],['MIDDLE',1],['LATE / ELITE',2]];
for(const [i,[label,tier]] of columns.entries()){
 const x=255+i*295;c.fillStyle='#ffd84b';c.font='bold 18px sans-serif';c.fillText(label,x-80,116);
 for(const [row,kind] of ['termite','beetle','moth','blight','boss'].entries()){
  const y=row===4?740:183+row*120;c.fillStyle='#0d2029';c.fillRect(x-130,y-(row===4?120:55),260,row===4?230:110);
  if(kind==='boss'&&i<2){c.fillStyle='#b6ccc5';c.font='14px sans-serif';c.fillText('FINAL WAVE ONLY',x-80,y+20);}else paintPest(c,{kind,x,y:y+20,id:1,appearanceTier:tier,hp:100,maxHp:100,slowUntil:0,poisonUntil:0},0,0,{healthBar:false,reducedMotion:true});
  if(i===0){c.fillStyle='#dfede6';c.font='bold 16px sans-serif';c.fillText(kind==='boss'?'BLIGHT KING':kind.toUpperCase(),28,y+16);}
 }
}
fs.writeFileSync('docs/enemy-growth-preview.jpg',canvas.toBuffer('image/jpeg'));
