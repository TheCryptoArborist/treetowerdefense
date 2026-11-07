// Genuine offline engine playback. No hosted authentication, purchases or player saves.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';import {spawn} from 'node:child_process';import {once} from 'node:events';import assert from 'node:assert/strict';
import {Game,TOWERS} from '../src/engine.js';import {MIXED_PLACEMENTS} from './balance-audit.mjs';
import {installEnvironmentAsset,installAimSprite,installStructureSprite,paintBackdrop,paintWinterBackdrop,paintLifeTree,paintBuildSite,paintTree,paintPest,paintWinterLook,paintShot,getGuardianShotOrigin,paintCombatEffects} from '../src/art.js';
import {GuardianAiming,GUARDIAN_SCALE} from '../src/aiming.js';import {CombatFeedback} from '../src/combat.js';
const out='docs/christmas-chaos';fs.mkdirSync(out,{recursive:true});
for(const[k,p]of Object.entries({terrain:'assets/environment/terrain-forest-v1.png',road:'assets/environment/road-stone-v1.png',tree:'assets/environment/tree-life-v1.png',winterTerrain:'assets/environment/terrain-winter-v1.webp',winterPests:'assets/enemies/christmas-invaders-v1.webp'}))installEnvironmentAsset(k,await loadImage(p),createCanvas);
for(const type of Object.keys(TOWERS).filter(t=>!TOWERS[t].structure))installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
for(const type of ['watchtower','cannon'])installStructureSprite(type,await loadImage(`assets/towers/${type}-base-v1.png`),createCanvas);
function add(g){for(const[type,pad]of MIXED_PLACEMENTS)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);}
function fixture(){const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.forest.bestWaves=[10,0,0];g.forest.unlocked=['oak','pine','palm','cypress','mushroom','watchtower'];g.startChristmasPreview();
 for(let wave=1;wave<=4;wave++){add(g);g.startWave();let n=0;while(g.phase==='running'&&n++<15000){g.step(.05);if(!g.winterBellUsed&&g.enemies.length)g.ringWinterBell();g.events=[];}assert.equal(g.phase,'build');}
 add(g);g.startWave();return g;
}
let scan=fixture(),t=0,bossAt=null,blizzardAt=null,bellAt=null;
function advance(g,now){g.step(.05);if(blizzardAt!==null&&!g.winterBellUsed&&now>=blizzardAt+1.25&&g.enemies.length){g.ringWinterBell();if(bellAt===null)bellAt=now;}}
while(scan.phase==='running'&&t<180){scan.step(.05);if(bossAt===null&&scan.events.some(e=>e.type==='boss-arrival'))bossAt=t;if(blizzardAt===null&&scan.events.some(e=>e.type==='winter-blizzard'))blizzardAt=t;if(blizzardAt!==null&&!scan.winterBellUsed&&t>=blizzardAt+1.25&&scan.enemies.length){scan.ringWinterBell();bellAt=t;}scan.events=[];t+=.05;}
assert.notEqual(bossAt,null);assert.notEqual(blizzardAt,null);assert.notEqual(bellAt,null);assert.equal(scan.phase,'victory');assert.equal(scan.tree,150000);
const windows=[{title:'THE TINSEL TYRANT',from:Math.max(0,bossAt-1),to:bossAt+4},{title:'BLIZZARD → FREE CANOPY BELL',from:Math.max(0,blizzardAt-.8),to:Math.min(t,blizzardAt+6.2)}];
const g=fixture(),aim=new GuardianAiming(),feedback=new CombatFeedback();const background=createCanvas(1000,720),bg=background.getContext('2d');paintBackdrop(bg,0,0,g.map);paintWinterBackdrop(bg,g.map);
const frame=createCanvas(800,632),c=frame.getContext('2d');c.scale(.8,.8);
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','800x632','-r','20','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','30','-pix_fmt','yuv420p','-movflags','+faststart',out+'/preview.mp4'],{stdio:['pipe','ignore','pipe']});let errors='';ff.stderr.on('data',b=>errors+=b);let frames=0,poster=false;
for(let n=0;n<t/.05+1;n++){
 const now=n*.05;advance(g,now);aim.advance(.05);feedback.advance(.05);const events=g.events.splice(0);feedback.consume(events);aim.consume(events);aim.track(g,false);for(const shot of aim.shots)if(!shot.origin)shot.origin=getGuardianShotOrigin(shot);
 const window=windows.find(w=>now>=w.from&&now<=w.to);if(!window)continue;
 c.clearRect(0,0,1000,790);c.drawImage(background,0,0);paintLifeTree(c,'oak',885,659,1.15,0,1,0,false,true);paintWinterLook(c,'tree',885,659,1.1);
 for(let i=0;i<g.map.pads.length;i++){const[x,y]=g.map.pads[i],tower=g.towers.find(t=>t.pad===i);paintBuildSite(c,x,y,{occupied:!!tower,number:i+1});if(tower){const pose=aim.pose(tower.id);paintTree(c,tower.type,x,y,GUARDIAN_SCALE,tower.style,tower.level,aim.time,pose.hold>0,pose.facing,aim.motion(tower,{battleActive:g.phase==='running',reducedMotion:false}),false,true);paintWinterLook(c,tower.type,x,y,GUARDIAN_SCALE,tower.level);}}
 for(const e of g.enemies)paintPest(c,e,aim.time,g.time,{healthBar:false,hit:feedback.reaction(e.id)});paintCombatEffects(c,feedback,false);for(const shot of aim.shots)paintShot(c,shot);
 const boss=g.enemies.find(e=>e.kind==='boss');c.fillStyle='#071826ee';c.fillRect(0,0,1000,42);c.fillStyle='#f5e3a2';c.font='bold 15px Arial';c.fillText('CHRISTMAS CHAOS · DEVELOPMENT PREVIEW',15,26);c.textAlign='right';c.fillStyle='#d4eff4';c.fillText(`WAVE 5 · TREE OF LIFE ${g.health}/100`,983,26);c.textAlign='left';
 if(boss){c.fillStyle='#1b2936';c.fillRect(12,46,976,12);c.fillStyle='#eace79';c.fillRect(12,46,976*boss.hp/boss.maxHp,12);c.font='bold 11px Arial';c.fillStyle='#102130';c.fillText(`TINSEL TYRANT · ${Math.ceil(boss.hp)} HP · FROST ${boss.frostArmor}`,20,56);}
 c.fillStyle='#081a26';c.fillRect(0,720,1000,70);c.fillStyle='#f2e1a6';c.font='bold 17px Arial';c.fillText(window.title,18,746);
 c.font='13px Arial';c.fillStyle='#c8e9ee';c.fillText(g.winterBellUsed?'Bell used · frost broken · 2.5s stun / 6s defender rally':'FREE CANOPY BELL READY · one use this wave · save it for the blizzard',18,771);
 if(g.winterWarmUntil>g.time){c.strokeStyle='#ffe9a9';c.lineWidth=2;c.strokeRect(2,2,996,716);}
 if(!poster&&now>=bossAt+3.5){fs.writeFileSync(out+'/poster.jpg',frame.toBuffer('image/jpeg'));poster=true;}
 if(!ff.stdin.write(c.getImageData(0,0,800,632).data))await once(ff.stdin,'drain');frames++;
}
ff.stdin.end();const[code]=await once(ff,'exit');if(code!==0)throw Error(errors);
// Assert the winter recolor leaves silhouettes and neutral dark face pixels intact.
const a=createCanvas(160,180),b=createCanvas(160,180);for(const[canvas,winter]of [[a,false],[b,true]])paintTree(canvas.getContext('2d'),'oak',80,155,1,0,1,0,false,{direction:0,view:0,flip:false},null,false,winter);
const before=a.getContext('2d').getImageData(0,0,160,180).data,after=b.getContext('2d').getImageData(0,0,160,180).data;let faces=0,recolored=0;
for(let i=0;i<before.length;i+=4){assert.equal(before[i+3],after[i+3]);if(before[i+3]>250&&Math.max(...before.slice(i,i+3))<30&&Math.max(...before.slice(i,i+3))-Math.min(...before.slice(i,i+3))<=2){faces++;assert.deepEqual(before.slice(i,i+4),after.slice(i,i+4));}if(before.slice(i,i+3).some((v,n)=>v!==after[i+n]))recolored++;}assert.ok(faces>100&&recolored>100);
const result={kind:'offline engine playback',bossAt,blizzardAt,bellAt,seconds:frames/20,health:scan.health,treeSpent:scan.runReport.treeSpent,rewards:scan.winterRewards,alphaUnchanged:true,neutralFacePixelsUnchanged:faces,recoloredPixels:recolored,videoBytes:fs.statSync(out+'/preview.mp4').size};fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
