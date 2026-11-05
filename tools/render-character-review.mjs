// Native rendering of actual sprites on actual routes; no wallet/session emulation.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {installEnemySprite} from '../src/enemy-art.js';
import {paintPest,paintBackdrop,paintLifeTree,installEnvironmentAsset} from '../src/art.js';
import {Game,MINI_BOSSES,pointAt,mapFor,pestAppearance} from '../src/engine.js';

const out='docs/character-review';fs.mkdirSync(out,{recursive:true});
const files={ironroot:'ironroot-walk-v1.png',saw:'chainsaw-raider-walk-v1.png',sprayer:'blight-sprayer-walk-v1.png'};
const kinds=Object.keys(files),reports=[];
for(const [kind,file] of Object.entries(files)) {
  const image=await loadImage('assets/enemies/'+file),c=createCanvas(image.width,image.height),ctx=c.getContext('2d');
  ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  assert(data[3]===0,'Atlas must have a transparent background');
  const installed=installEnemySprite(kind,image,createCanvas);
  reports.push({kind,file,width:image.width,height:image.height,frames:installed.frames});
}
for(const [kind,file] of Object.entries({terrain:'terrain-forest-v1.png',road:'road-stone-v1.png',tree:'tree-life-v1.png'}))installEnvironmentAsset(kind,await loadImage('assets/environment/'+file),createCanvas);
const contact=createCanvas(1200,1000),c=contact.getContext('2d');
c.fillStyle='#040810';c.fillRect(0,0,1200,1000);c.fillStyle='#7ef3a0';c.font='bold 25px sans-serif';c.fillText('CANOPY DEFENSE · CHARACTER REVIEW',24,34);
c.font='15px sans-serif';c.fillStyle='#c4d9d0';c.fillText('Actual game renderer · four upright views · planted and walking poses',24,59);
for(const [col,kind] of kinds.entries())for(const [row,label] of ['SOUTH','EAST','NORTH','WEST'].entries()) {
  const x=col*400,y=85+row*225;
  c.fillStyle='#10252c';c.fillRect(x+12,y,376,215);c.fillStyle='#ffd84b';c.font='bold 17px sans-serif';c.fillText(MINI_BOSSES[kind].name,x+24,y+24);
  c.fillStyle='#b3ccc4';c.font='12px sans-serif';c.fillText(label,x+24,y+43);
  const [dx,dy]=[[0,1],[1,0],[0,-1],[-1,0]][row];
  for(const [pose,progress] of [0,20].entries()) {
    const e={kind:'boss',miniBoss:kind,id:col+1,appearanceTier:1,progress,x:x+110+pose*160,y:y+178,hp:MINI_BOSSES[kind].hp*.72,maxHp:MINI_BOSSES[kind].hp,slowUntil:0,poisonUntil:0};
    // Explicit heading fixture uses the exported atlas painter through paintPest's
    // usual pointAt heading, at route positions found to face the requested way.
    const map=mapFor();let distance=0;
    for(let leg=1;leg<map.path.length;leg++) {
      const a=map.path[leg-1],b=map.path[leg],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(Math.sign(b[0]-a[0])===dx&&Math.sign(b[1]-a[1])===dy) {
        const stride=kind==='saw'?72:80,wanted=pose*(stride/4);
        const p=Math.ceil((distance+3-wanted)/stride)*stride+wanted;
        if(p>=distance+length-3){distance+=length;continue;}
        const at=pointAt(p,map);
        c.save();c.translate(e.x-at.x,e.y-at.y);
        e.progress=p;Object.assign(e,at);
        paintPest(c,e,0,0);c.restore();break;
      }
      distance+=length;
    }
  }
}
fs.writeFileSync(out+'/mini-boss-views.png',contact.toBuffer('image/png'));

const game=new Game();game.allowPreview();const frame=createCanvas(1000,800),ctx=frame.getContext('2d');
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','1000x800','-r','24','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart',out+'/mini-boss-walking.mp4'],{stdio:['pipe','ignore','pipe']});
let errors='';ff.stderr.on('data',b=>errors+=b);
for(let i=0;i<360;i++) {
  ctx.fillStyle='#040810';ctx.fillRect(0,0,1000,800);
  ctx.save();ctx.translate(0,80);paintBackdrop(ctx,game.chapter,game.forestRank,game.map);paintLifeTree(ctx,'oak',885,659,1.26,0,2,i/24);
  for(const [index,kind] of kinds.entries()) {
    const progress=(i/24*MINI_BOSSES[kind].speed+index*280)%game.map.length;
    const e={kind:'boss',miniBoss:kind,id:index+1,appearanceTier:1,progress,...pointAt(progress,game.map),hp:MINI_BOSSES[kind].hp*.72,maxHp:MINI_BOSSES[kind].hp,slowUntil:0,poisonUntil:0};
    const before=JSON.stringify(e);paintPest(ctx,e,i/24,i/24);assert.equal(JSON.stringify(e),before);
    const appearance=pestAppearance(e);assert(appearance.scale>0);
  }
  ctx.restore();ctx.fillStyle='#7ef3a0';ctx.font='bold 20px sans-serif';ctx.fillText('CANOPY DEFENSE · MINI-BOSS MOTION REVIEW',22,30);
  ctx.fillStyle='#d6e5de';ctx.font='14px sans-serif';ctx.fillText('Real renderer · route-driven gait · upright turns · common scale and grounded feet',22,55);
  if(i===133)fs.writeFileSync(out+'/battlefield.png',frame.toBuffer('image/png'));
  if(!ff.stdin.write(ctx.getImageData(0,0,1000,800).data))await once(ff.stdin,'drain');
}
ff.stdin.end();const [code]=await once(ff,'exit');assert.equal(code,0,errors);
const report={actors:reports,source:'Actual game painters and map geometry',capture:'Offline native canvas, not an authenticated holder browser session',seconds:15,engineChanges:false,remaining:['Defender attack windup/release/recovery','Tower aiming/recoil/reload','Insect cadence and turning','Projectile/impact synchronization','Death sequences','Story character performances']};
fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
