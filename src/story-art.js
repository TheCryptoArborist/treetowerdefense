import {paintTree,paintLifeTree,paintPest,getGuardianShotOrigin,paintShot} from './art.js';
import {facingFor,GUARDIAN_SCALE,SHOT_DURATION} from './aiming.js';
import {defenderMotion,defenderMotionPoint} from './defender-motion.js';

export const STORY_DURATION=12;
const ACTION_PERIOD=2.8,LOOP_DURATION=8;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const colors={crossing:['#09171c','#294b40','#9ccea0'],meadow:['#162426','#667547','#ffe3a1'],marsh:['#060f22','#273c4b','#82cfc7'],harvest:['#20171d','#69513b','#ffd28c']};

// This clock is presentation-only. It never steps Game, spends TREE or emits combat events.
export function storyFrame(scene,seconds,{reducedMotion=false,beat=0}={}){
 const t=reducedMotion?STORY_DURATION:Math.max(0,Number.isFinite(seconds)?seconds:0),looping=t>=STORY_DURATION;
 const loopTime=looping?(t-STORY_DURATION)%LOOP_DURATION:0;
 const shot=reducedMotion?2:looping?(loopTime<5?1:2):t>=8?2:t>=3?1:0;
 const local=looping?(shot===1?loopTime/5:(loopTime-5)/3):shot===0?t/3:shot===1?(t-3)/5:(t-8)/4;
 const attackAge=start=>reducedMotion||scene.cinematic==='renewal'||t<start?Infinity:(t-start)%ACTION_PERIOD;
 const age=attackAge(5.2),allyAge=attackAge(6.3),impact=Number.isFinite(age)?Math.max(0,1-age/.48):0;
 const shake=reducedMotion?0:Math.sin(age*45)*impact*2||0;
 return {time:t,shot,local:clamp(local),motion:reducedMotion?0:t,looping,
  label:shot===0?'THE FOREST':shot===1?(scene.cinematic==='renewal'?'ROOTS RECONNECT':scene.enemyName||'THE APPROACH'):(beat?'THE GUARDIAN’S ANSWER':'HOLD THE LINE'),
  guardianX:reducedMotion?340:(t<3?180+ease(t/3)*160:340+Math.sin(t*.65)*5)+impact*22,
  guardianStep:reducedMotion?0:Math.sin(t*(t<3?9:2.5))*(t<3?5:1.4),
  enemyX:940-ease((t-2)/6)*235+(reducedMotion?0:Math.sin(t*.9)*10+impact*48),
  enemyStride:reducedMotion?0:t*58,attackAge:age,allyAttackAge:allyAge,
  prepare:Number.isFinite(age)?clamp((age-(ACTION_PERIOD-.55))/.55):clamp((t-4.65)/.55),impact,
  camera:shot===0?{scale:1+ease(local)*.1,x:-35*ease(local),y:-12*ease(local)}:shot===1?{scale:1.08+ease(local)*.06,x:-50+shake,y:-20}:{scale:1.32+ease(local)*.03,x:-80+shake,y:-70},
  strike:age<SHOT_DURATION,allyStrike:allyAge<SHOT_DURATION,
  fade:reducedMotion?0:Math.max(0,1-(looping?Math.min(loopTime,Math.abs(loopTime-5)):Math.min(t,Math.abs(t-3),Math.abs(t-8)))/.22)*.5};
}
function path(c,points,color,width){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function actorMotion(type,age,prepare,facing,reducedMotion){
 const rig=defenderMotion(type,{age,prepare,direction:facing.direction,reducedMotion});
 return {...rig,x:rig.x*1.8,y:rig.y*1.8,twist:rig.twist*1.5};
}
function cinematicShot(c,type,x,y,scale,level,facing,motion,age,tx,ty){
 const shot={type,x:0,y:0,level,style:0,facing,tx,ty,life:SHOT_DURATION-age};
 const socket=getGuardianShotOrigin(shot),point=defenderMotionPoint(socket.x/GUARDIAN_SCALE,socket.y/GUARDIAN_SCALE,motion);
 shot.origin={x:x+point.x*scale,y:y+point.y*scale};shot.x=x;shot.y=y;paintShot(c,shot);
}
function seedShot(c,type,x,y,scale,level,facing,motion,travel,tx,ty){
 const socket=getGuardianShotOrigin({type,x:0,y:0,level,style:0,facing});
 const hand=defenderMotionPoint(socket.x/GUARDIAN_SCALE,socket.y/GUARDIAN_SCALE,motion);
 const sx=x+hand.x*scale,sy=y+hand.y*scale,u=ease(travel),px=sx+(tx-sx)*u,py=sy+(ty-sy)*u-Math.sin(u*Math.PI)*35;
 const color={oak:'#e8c589',pine:'#b4ee84',palm:'#8df3d9',cypress:'#e2eab0',mushroom:'#d5a7f2',willow:'#b4f1d3'}[type]||'#c9f2ae';
 glow(c,px,py,24,color+'55');
 c.save();c.translate(px,py);c.rotate(Math.atan2(ty-sy,tx-sx));
 c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(-30,0);c.lineTo(-8,0);c.stroke();
 c.fillStyle=color;for(const side of [-1,1]){c.beginPath();c.ellipse(-3,side*4,10,4,side*.45,0,Math.PI*2);c.fill();}c.restore();
}

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
 glow(c,300,240,190,light+'12');
 // A root signal visibly travels toward the Tree of Life, then reconnects.
 const restoring=scene.cinematic==='renewal'||f.shot===2;
 c.save();c.globalAlpha=restoring?.65:.25;
 for(let i=0;i<4;i++){
  const points=[[300,338+i*6],[420,354+i*8],[510,330+i*6],[648,336]];
  path(c,points,'#182b2b',9);path(c,points,(restoring?light:'#ae6650')+'b0',2);
  const u=options.reducedMotion?.8:((f.motion*.15+i*.23)%1);
  glow(c,300+u*348,340+Math.sin(u*Math.PI*2)*10,15,light+'88');
 }c.restore();
 const facing=facingFor(1,-.1),attack=f.strike,ally=scene.speaker==='pine'?'oak':'pine';
 const rig=actorMotion(scene.speaker,f.attackAge,f.prepare,facing,!!options.reducedMotion);
 const allyRig=actorMotion(ally,f.allyAttackAge,0,facing,!!options.reducedMotion),walk=f.guardianStep;
 paintTree(c,scene.speaker,f.guardianX,337+walk,1.7,0,2,f.motion,attack,facing,rig);
 if(f.shot<2||f.looping){
  paintTree(c,ally,f.guardianX-145,343+walk*.6,1.15,0,1,f.motion,f.allyStrike,facing,allyRig);
  if(scene.cinematic!=='renewal'){
   glow(c,f.enemyX,265,130,'#ffad321c');
   const e={kind:scene.enemyKind||'beetle',...(scene.enemyBoss?{miniBoss:scene.enemyBoss}:{}),...(scene.tone==='harvest'?{theme:'harvest-canopy'}:{}),id:1,x:f.enemyX,y:340,progress:f.enemyStride,mapId:'crossing-v1',hp:100,maxHp:100,slowUntil:0,poisonUntil:0};
   for(let i=0;i<3;i++){
    const x=990-(f.motion*48+i*133)%400;
    c.save();c.globalAlpha=.7;c.translate(x,357+i%2*12);c.scale(.8,.8);
    paintPest(c,{...e,kind:i===1?'moth':'termite',miniBoss:undefined,id:i+5,x:0,y:0,progress:f.enemyStride+i*60},f.motion,f.motion,{healthBar:false,reducedMotion:!!options.reducedMotion,facingAngle:-Math.PI/2});c.restore();
   }
   const hover=e.kind==='moth'&&!options.reducedMotion?Math.sin(f.motion*5)*12:0;
   c.save();c.translate(f.enemyX,340+hover);c.scale(1.35,1.35);paintPest(c,{...e,x:0,y:0},f.motion,f.motion,{hit:f.impact*.7,healthBar:false,reducedMotion:!!options.reducedMotion,facingAngle:-Math.PI/2});c.restore();
   if(scene.cinematic==='warning')glow(c,f.enemyX,270,55,'#e16b433f');
  }
 }
 if(attack){
  cinematicShot(c,scene.speaker,f.guardianX,337+walk,1.7,2,facing,rig,f.attackAge,f.enemyX,300);
 }
 if(!options.reducedMotion&&scene.cinematic!=='renewal'&&f.prepare>0&&f.prepare<1)seedShot(c,scene.speaker,f.guardianX,337+walk,1.7,2,facing,rig,f.prepare,f.enemyX,300);
 if(f.allyStrike)cinematicShot(c,ally,f.guardianX-145,343+walk*.6,1.15,1,facing,allyRig,f.allyAttackAge,f.enemyX,315);
 if(f.impact>0){
  const age=1-f.impact;
  for(let i=0;i<16;i++){
   const angle=i*2.4,travel=age*(35+i%4*12),x=f.enemyX+Math.cos(angle)*travel,y=302+Math.sin(angle)*travel-age*24;
   c.save();c.globalAlpha=f.impact;c.fillStyle=i%3?'#ffd994':'#9affca';c.translate(x,y);c.rotate(angle+age*4);c.fillRect(-3,-6,6,12);c.restore();
  }
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
  advance(dt,{held=false}={}){if(scene&&!held&&Number.isFinite(dt)&&dt>0&&Number.isFinite(seconds+dt))seconds+=dt;},
  paint(context,options){return scene?paintStory(context,scene,seconds,options):null;},
  get seconds(){return seconds;}};
}

export function createStoryMotionSettings({media,storage,onChange=()=>{}}={}){
 let mode='system';try{const saved=storage?.getItem('canopy-story-motion');if(['system','action','reduced'].includes(saved))mode=saved;}catch{}
 const state=()=>({mode,reducedMotion:mode==='reduced'||mode==='system'&&!!media?.matches,systemReducedMotion:!!media?.matches});
 const changed=()=>onChange(state());media?.addEventListener?.('change',changed);
 return {get state(){return state();},set(value){if(!['system','action','reduced'].includes(value))return false;mode=value;try{storage?.setItem('canopy-story-motion',mode);}catch{}changed();return true;},dispose(){media?.removeEventListener?.('change',changed);}};
}
