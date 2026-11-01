// Capture actual engine combat with the game's own art, aiming and feedback.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {spawn} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs';
import {Game,ORIGINAL_GUARDIANS} from '../src/engine.js';
import {installEnvironmentAsset,installAimSprite,paintBackdrop,paintLifeTree,paintBuildSite,paintTree,paintPest,paintShot,paintCombatEffects,getGuardianShotOrigin} from '../src/art.js';
import {GuardianAiming,GUARDIAN_SCALE} from '../src/aiming.js';import {CombatFeedback} from '../src/combat.js';
for(const[k,f]of [['terrain','terrain-forest-v1.png'],['road','road-stone-v1.png'],['tree','tree-life-v1.png']])installEnvironmentAsset(k,await loadImage('assets/environment/'+f),createCanvas);
for(const type of ORIGINAL_GUARDIANS)installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
const g=new Game();g.allowPreview();g.forest.unlocked=[...ORIGINAL_GUARDIANS];g.sap=2000;
for(const[type,pad]of [['pine',0],['oak',1],['pine',2],['palm',4],['mushroom',6],['cypress',11]])g.place(type,pad);
g.wave=5;g.startWave();const aim=new GuardianAiming(),feedback=new CombatFeedback();
const bg=createCanvas(1000,720);paintBackdrop(bg.getContext('2d'),0,0,g.map);
const frame=createCanvas(800,576),c=frame.getContext('2d');c.scale(.8,.8);
const out='integration/tree-arcade/canopy-preview';
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','800x576','-r','20','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','33','-pix_fmt','yuv420p','-movflags','+faststart',out+'/gameplay.mp4'],{stdio:['pipe','ignore','pipe']});let errors='';ff.stderr.on('data',b=>errors+=b);
for(let i=0;i<560;i++){
 g.step(.05);aim.advance(.05);feedback.advance(.05);const events=g.events.splice(0);aim.consume(events);feedback.consume(events);aim.track(g,false);for(const shot of aim.shots)if(!shot.origin)shot.origin=getGuardianShotOrigin(shot);
 if(i<80)continue;
 c.drawImage(bg,0,0);paintLifeTree(c,'oak',885,659,1.02,0,1,g.time);
 for(let n=0;n<g.map.pads.length;n++){const[x,y]=g.map.pads[n],t=g.towers.find(t=>t.pad===n);paintBuildSite(c,x,y,{occupied:!!t,number:n+1});if(t){const p=aim.pose(t.id);paintTree(c,t.type,x,y,GUARDIAN_SCALE,t.style,t.level,aim.time,p.hold>0,p.facing);}}
 for(const e of g.enemies)paintPest(c,e,g.time,g.time,{hit:feedback.reaction(e.id)});paintCombatEffects(c,feedback,false);for(const shot of aim.shots)paintShot(c,shot);
 c.fillStyle='#040810e8';c.fillRect(0,0,1000,42);c.fillStyle='#7ef3a0';c.font='bold 16px sans-serif';c.fillText('CANOPY DEFENSE · GAMEPLAY PREVIEW',18,27);c.fillStyle='#f4fbff';c.textAlign='right';c.fillText(`WAVE ${g.wave} · TREE OF LIFE ${g.health}/100`,980,27);c.textAlign='left';
 if(i===240)fs.writeFileSync(out+'/gameplay-poster.jpg',frame.toBuffer('image/jpeg'));
 if(!ff.stdin.write(c.getImageData(0,0,800,576).data))await once(ff.stdin,'drain');
}
ff.stdin.end();const[code]=await once(ff,'exit');if(code!==0)throw Error(errors);console.log(JSON.stringify({bytes:fs.statSync(out+'/gameplay.mp4').size,kills:g.kills,phase:g.phase,duration:24}));
