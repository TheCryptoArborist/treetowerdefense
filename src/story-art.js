import {paintTree,paintLifeTree,paintPest,getGuardianShotOrigin,paintShot} from './art.js';
import {facingFor,GUARDIAN_SCALE,SHOT_DURATION} from './aiming.js';

export const STORY_DURATION=12;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const colors={crossing:['#09171c','#294b40','#9ccea0'],meadow:['#162426','#667547','#ffe3a1'],marsh:['#060f22','#273c4b','#82cfc7'],harvest:['#20171d','#69513b','#ffd28c']};

// This clock is presentation-only. It never steps Game, spends TREE or emits combat events.
export function storyFrame(scene,seconds,{reducedMotion=false,beat=0}={}){
 const t=reducedMotion?STORY_DURATION:Math.max(0,Number.isFinite(seconds)?seconds:0);
 const shot=reducedMotion||t>=8?2:t>=3?1:0;
 const local=shot===0?t/3:shot===1?(t-3)/5:(t-8)/4;
 return {time:t,shot,local:clamp(local),motion:reducedMotion?0:t,
  label:shot===0?'THE FOREST':shot===1?(scene.cinematic==='renewal'?'ROOTS RECONNECT':scene.enemyName||'THE APPROACH'):(beat?'THE GUARDIAN’S ANSWER':'HOLD THE LINE'),
  guardianX:260+ease(t/3)*80,enemyX:940-ease((t-3)/5)*235,
  camera:shot===0?{scale:1+ease(local)*.1,x:-35*ease(local),y:-12*ease(local)}:shot===1?{scale:1.12,x:-76,y:-25}:{scale:1.55,x:-145,y:-112},
  strike:!reducedMotion&&scene.cinematic!=='renewal'&&t>=5.2&&t<5.2+SHOT_DURATION,
  fade:reducedMotion?0:Math.max(0,1-Math.min(t,Math.abs(t-3),Math.abs(t-8))/.22)*.5};
}
function path(c,points,color,width){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}

export function paintStory(c,scene,seconds,options={}){
 const f=storyFrame(scene,seconds,options),[sky,forest,light]=colors[scene.tone]||colors.crossing;
 c.save();c.clearRect(0,0,960,420);
 const skyFill=c.createLinearGradient(0,0,0,420);skyFill.addColorStop(0,sky);skyFill.addColorStop(1,forest);c.fillStyle=skyFill;c.fillRect(0,0,960,420);
 glow(c,750,110,330,light+'38');
 // Independent far/near layers give the camera visible depth.
 for(let layer=0;layer<3;layer++){
  c.save();c.translate(-Math.sin(f.motion*.07)*6*(layer+1),0);
  for(let n=0;n<11;n++){
   const x=n*110+(layer%2)*43,y=270+layer*26,h=190+(n*47%100);
   path(c,[[x,y],[x-5,y-h*.6],[x+8,y-h]],layer===0?'#101f28aa':layer===1?'#0d2528b0':'#081a20a0',12+layer*8);
   path(c,[[x,y-h*.5],[x-26,y-h*.7],[x-40,y-h*.76]],'#11262b90',5+layer*2);
   path(c,[[x,y-h*.7],[x+30,y-h*.9]],'#11262b90',5+layer*2);
  }c.restore();
 }
 c.save();c.translate(f.camera.x,f.camera.y);c.scale(f.camera.scale,f.camera.scale);
 c.fillStyle='#0b171b';c.beginPath();c.moveTo(0,328);c.bezierCurveTo(260,305,600,345,1100,316);c.lineTo(1100,500);c.lineTo(0,500);c.fill();
 for(let i=0;i<7;i++)path(c,[[30+i*150,350],[110+i*135,324],[210+i*125,344]],'#56624b55',2);
 paintLifeTree(c,'oak',650,320,1.72,0,2,f.motion);
 // A root signal visibly travels toward the Tree of Life, then reconnects.
 const restoring=scene.cinematic==='renewal'||f.shot===2;
 c.save();c.globalAlpha=restoring?.65:.25;
 for(let i=0;i<4;i++){
  const points=[[300,338+i*6],[420,354+i*8],[510,330+i*6],[648,336]];
  path(c,points,'#182b2b',9);path(c,points,(restoring?light:'#ae6650')+'b0',2);
  const u=options.reducedMotion?.8:((f.motion*.15+i*.23)%1);
  glow(c,300+u*348,340+Math.sin(u*Math.PI*2)*10,15,light+'88');
 }c.restore();
 const facing=facingFor(1,-.1),attack=f.strike;
 const walk=options.reducedMotion||f.shot===2?0:Math.sin(f.motion*9)*(f.shot===0?3:1);
 paintTree(c,scene.speaker,f.guardianX,337+walk,1.7,0,2,f.motion,attack,facing);
 if(f.shot<2){
  paintTree(c,scene.speaker==='pine'?'oak':'pine',f.guardianX-145,343+walk*.6,1.15,0,1,f.motion,false,facing);
  if(scene.cinematic!=='renewal'){
   const e={kind:scene.enemyKind||'beetle',...(scene.enemyBoss?{miniBoss:scene.enemyBoss}:{}),...(scene.tone==='harvest'?{theme:'harvest-canopy'}:{}),id:1,x:f.enemyX,y:340,progress:(1020-f.enemyX),mapId:'crossing-v1',hp:100,maxHp:100,slowUntil:0,poisonUntil:0};
   c.save();c.translate(f.enemyX,340);c.scale(1.35,1.35);paintPest(c,{...e,x:0,y:0},f.motion,f.motion,{healthBar:false,reducedMotion:!!options.reducedMotion,facingAngle:-Math.PI/2});c.restore();
   if(scene.cinematic==='warning')glow(c,f.enemyX,270,55,'#e16b433f');
  }
 }
 if(attack){
  // Use the same calibrated hand sockets as gameplay, at the cinematic actor scale.
  const shot={type:scene.speaker,x:0,y:0,level:2,style:0,facing,tx:0,ty:0,life:SHOT_DURATION-(f.time-5.2)};
  const origin=getGuardianShotOrigin(shot);shot.origin={x:f.guardianX+origin.x*1.7/GUARDIAN_SCALE,y:337+walk+origin.y*1.7/GUARDIAN_SCALE};shot.tx=f.enemyX;shot.ty=300;paintShot(c,shot);
 }
 if(restoring)glow(c,650,275,140,light+'24');
 c.restore();
 // Foreground leaves/motes move independently of the actors and camera.
 for(let i=0;i<20;i++){
  const x=(i*107+f.motion*(scene.tone==='harvest'?22:7))%1020-30,y=35+(i*73+f.motion*(scene.tone==='harvest'?13:-3)+4200)%340;
  c.save();c.translate(x,y);c.rotate(i+f.motion*.35);c.fillStyle=i%3?light+'50':'#b38a5755';c.beginPath();c.ellipse(0,0,scene.tone==='harvest'?5:2,2,0,0,Math.PI*2);c.fill();c.restore();
 }
 const vignette=c.createLinearGradient(0,0,0,420);vignette.addColorStop(0,'#01070ca0');vignette.addColorStop(.35,'#01070c00');vignette.addColorStop(1,'#01070caa');c.fillStyle=vignette;c.fillRect(0,0,960,420);
 // Letterboxing and brief dissolves replace the previous perpetual image pan.
 c.fillStyle='#02080d';c.fillRect(0,0,960,20);c.fillRect(0,400,960,20);
 if(f.fade){c.globalAlpha=f.fade;c.fillRect(0,0,960,420);}c.restore();return f;
}

export function createStoryAnimation(){
 let scene=null,seconds=0;
 return {reset(next){scene=next;seconds=0;},clear(){scene=null;seconds=0;},
  advance(dt){if(scene&&Number.isFinite(dt)&&dt>0)seconds=Math.min(STORY_DURATION,seconds+dt);},
  paint(context,options){return scene?paintStory(context,scene,seconds,options):null;},
  get seconds(){return seconds;}};
}
