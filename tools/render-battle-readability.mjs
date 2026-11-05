// Offline acceptance fixture: real engine/art/aiming, no hosted auth or wallet calls.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {Game,TOWERS,pestAppearance} from '../src/engine.js';
import {VETERAN_PROFILES} from './veteran-audit.mjs';
import {installEnvironmentAsset,installAimSprite,installStructureSprite,paintBackdrop,paintLifeTree,paintBuildSite,paintTree,paintPest,paintPestHealth,paintShot,paintCombatEffects,getGuardianShotOrigin} from '../src/art.js';
import {GuardianAiming,GUARDIAN_SCALE} from '../src/aiming.js';
import {CombatFeedback,bossStatus} from '../src/combat.js';
const out='docs/battle-readability';fs.mkdirSync(out,{recursive:true});
for(const[k,f]of [['terrain','terrain-forest-v1.png'],['road','road-stone-v1.png'],['tree','tree-life-v1.png']])installEnvironmentAsset(k,await loadImage('assets/environment/'+f),createCanvas);
for(const type of Object.keys(TOWERS).filter(t=>!['watchtower','cannon'].includes(t)))installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
for(const type of ['watchtower','cannon'])installStructureSprite(type,await loadImage(`assets/towers/${type}-base-v1.png`),createCanvas);
function fixture(){
 const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.forest.bestWaves=[10,10,10];g.forest.unlocked=Object.keys(TOWERS);
 g.forest.levels=Object.fromEntries(Object.keys(TOWERS).map(t=>[t,3]));g.enableCollection();g.startCampaign('veteran');g.chooseChapter(2);
 for(let wave=1;wave<=9;wave++){
  for(const[type,pad]of VETERAN_PROFILES.counters.placements)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);
  assert(g.startWave());let steps=0;while(g.phase==='running'&&steps++<20000){g.step(.05);g.events=[];}
  assert.equal(g.phase,'build');
 }
 g.events=[];g.startWave();return g;
}
const review=fixture(),initialTree=review.tree;
let peak={count:0},enrage=null,t=0;const seen=new Set();
while(review.phase==='running'&&t<180){review.step(.05);t+=.05;for(const e of review.enemies)seen.add(e.kind);
 if(review.enemies.length>peak.count)peak={count:review.enemies.length,time:Number(t.toFixed(2)),kinds:Object.fromEntries([...new Set(review.enemies.map(e=>e.kind))].map(k=>[k,review.enemies.filter(e=>e.kind===k).length]))};
 if(enrage===null&&review.events.some(e=>e.type==='boss-enrage'))enrage=Number(t.toFixed(2));review.events=[];
}
assert(enrage!==null,'Fixture must reach actual boss enrage');assert(peak.count>=8,'Fixture must exercise a crowd');assert.equal(review.tree,initialTree);
const windows=[{name:'Crowded escort',start:Math.max(0,peak.time-3),end:Math.min(t,peak.time+9)},{name:'Boss enrage',start:Math.max(0,enrage-3),end:Math.min(t,enrage+9)}];
const g=fixture(),aim=new GuardianAiming(),feedback=new CombatFeedback();
const bg=createCanvas(1000,720);paintBackdrop(bg.getContext('2d'),g.chapter,g.forestRank,g.map);
const frame=createCanvas(1000,800),c=frame.getContext('2d'),video=createCanvas(800,640),v=video.getContext('2d');
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pix_fmt','rgba','-s','800x640','-r','20','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','31','-maxrate','400k','-bufsize','800k','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/action-preview.mp4`],{stdio:['pipe','ignore','pipe']});let errors='';ff.stderr.on('data',b=>errors+=b);
let frames=0,crowdSaved=false,enrageSaved=false;
for(let step=1;g.phase==='running'&&step<=3600;step++){
 g.step(.05);const at=step*.05;aim.advance(.05);feedback.advance(.05);const events=g.events.splice(0);aim.consume(events);feedback.consume(events);aim.track(g,false);for(const shot of aim.shots)if(!shot.origin)shot.origin=getGuardianShotOrigin(shot);
 if(!windows.some(w=>at>=w.start-.001&&at<=w.end+.001))continue;
 c.fillStyle='#040810';c.fillRect(0,0,1000,800);c.save();c.translate(0,80);c.drawImage(bg,0,0);paintLifeTree(c,'oak',885,659,1.26,0,2,g.time);
 for(let n=0;n<g.map.pads.length;n++){const[x,y]=g.map.pads[n],tower=g.towers.find(t=>t.pad===n);paintBuildSite(c,x,y,{occupied:!!tower,number:n+1});if(tower){const p=aim.pose(tower.id);paintTree(c,tower.type,x,y,GUARDIAN_SCALE,tower.style,tower.level,aim.time,p.hold>0,p.facing);}}
 for(const enemy of g.enemies)paintPest(c,enemy,g.time,g.time,{hit:feedback.reaction(enemy.id),healthBar:false});paintCombatEffects(c,feedback,false);for(const shot of aim.shots)paintShot(c,shot);for(const enemy of g.enemies)paintPestHealth(c,enemy);c.restore();
 c.fillStyle='#7ef3a0';c.font='bold 18px sans-serif';c.fillText('CANOPY DEFENSE · VETERAN MOONLIT MARSH · WAVE 10',18,26);
 c.fillStyle='#d3ddd9';c.font='12px sans-serif';c.fillText('OFFLINE ENGINE CAPTURE · OWNED ANCIENT DEFENDERS · NO CONSUMABLES',18,48);
 c.fillText(`BATTLE +${at.toFixed(1)}s · ${g.enemies.length} PESTS · TREE OF LIFE ${g.health}/100`,18,68);
 const boss=g.enemies.find(e=>e.kind==='boss'),status=bossStatus(g),angry=boss&&pestAppearance(boss).enraged;
 c.fillStyle=angry?'#ff987a':'#ffd84b';c.font='bold 14px sans-serif';c.fillText(status.state==='present'?`${angry?'BOSS ENRAGED':'BLIGHT KING'} · ${Math.ceil(status.hp)}/${Math.ceil(status.maxHp)}`:status.state==='incoming'?'BLIGHT KING APPROACHING':'ESCORT',625,48);
 if(boss){c.fillStyle='#28342e';c.fillRect(625,59,355,9);c.fillStyle=angry?'#e16a48':'#bda26c';c.fillRect(625,59,355*status.percent/100,9);}
 if(!crowdSaved&&at>=peak.time-.001){fs.writeFileSync(`${out}/crowded-escort.jpg`,frame.toBuffer('image/jpeg'));const small=createCanvas(390,312);small.getContext('2d').drawImage(frame,0,0,390,312);fs.writeFileSync(`${out}/battlefield-at-phone-width.jpg`,small.toBuffer('image/jpeg'));crowdSaved=true;}
 if(!enrageSaved&&at>=enrage+1&&angry){fs.writeFileSync(`${out}/boss-enrage.jpg`,frame.toBuffer('image/jpeg'));enrageSaved=true;}
 v.drawImage(frame,0,0,800,640);if(!ff.stdin.write(v.getImageData(0,0,800,640).data))await once(ff.stdin,'drain');frames++;
}
ff.stdin.end();const[code]=await once(ff,'exit');assert.equal(code,0,errors);assert(crowdSaved&&enrageSaved);
const report={fixture:'Veteran Moonlit Marsh, actual final wave after nine simulated waves',ownedGrowth:'Ancient, all species',collectionVersion:1,consumables:0,treeSpent:initialTree-review.tree,peak,enrageAt:enrage,typesSeen:[...seen],outcome:review.phase,health:review.health,fullWaveSeconds:Number(t.toFixed(2)),windows,clipSeconds:frames/20,bytes:fs.statSync(`${out}/action-preview.mp4`).size,verificationLimit:'Offline native renderer, not a hosted holder session; 390px image is a scaled battlefield, not phone UI acceptance.'};
fs.writeFileSync(`${out}/capture-report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
