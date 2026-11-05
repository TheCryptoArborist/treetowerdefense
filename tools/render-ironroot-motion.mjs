import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {installEnemySprite} from '../src/enemy-art.js';
import {paintPest,installEnvironmentAsset,paintBackdrop} from '../src/art.js';
import {Game,pointAt} from '../src/engine.js';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname,make=(w,h)=>createCanvas(w,h);
installEnemySprite('ironroot',await loadImage(root+'/assets/enemies/ironroot-walk-v1.png'),make);
for(const [kind,file] of Object.entries({terrain:'terrain-forest-v1.png',road:'road-stone-v1.png',tree:'tree-life-v1.png'}))installEnvironmentAsset(kind,await loadImage(root+'/assets/environment/'+file),make);
const game=new Game();game.allowPreview();const c=createCanvas(1000,720),ctx=c.getContext('2d');
fs.mkdirSync('/tmp/canopy-ironroot-motion',{recursive:true});
for(let i=0;i<240;i++){
 paintBackdrop(ctx,game);const progress=i*6,pos=pointAt(progress,game.map);
 paintPest(ctx,{kind:'boss',miniBoss:'ironroot',id:1,progress,...pos,hp:330,maxHp:440,appearanceTier:1,slowUntil:0,poisonUntil:0},i/30,0);
 ctx.fillStyle='#071821e8';ctx.fillRect(18,15,545,58);ctx.fillStyle='#7ef3a0';ctx.font='bold 20px sans-serif';ctx.fillText('IRONROOT · ACTUAL GAME RENDERER',32,40);ctx.font='14px sans-serif';ctx.fillStyle='#dce9e4';ctx.fillText('Four directions · distance-driven walk · upright through bends',32,61);
 fs.writeFileSync('/tmp/canopy-ironroot-motion/'+String(i).padStart(4,'0')+'.png',c.toBuffer('image/png'));
}
fs.copyFileSync('/tmp/canopy-ironroot-motion/0133.png',root+'/docs/ironroot-walk-preview.png');

console.log("Frames: /tmp/canopy-ironroot-motion; still: docs/ironroot-walk-preview.png");
