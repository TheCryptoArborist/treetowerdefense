import {paintRetroScene} from './story-retro.js';
import {SHOT_DURATION} from './aiming.js';
export const STORY_DURATION=12;
const ACTION_PERIOD=2.8,LOOP_DURATION=8;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};

// This clock is presentation-only. It never steps Game, spends TREE or emits combat events.
export function storyFrame(scene,seconds,{reducedMotion=false,beat=0}={}){
 const t=reducedMotion?STORY_DURATION:Math.max(0,Number.isFinite(seconds)?seconds:0),looping=t>=STORY_DURATION;
 const loopTime=looping?(t-STORY_DURATION)%LOOP_DURATION:0;
 const shot=reducedMotion||beat===1?2:looping?(loopTime<5?1:2):t>=8?2:t>=3?1:0;
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
export function paintStory(c,scene,seconds,options={}){
 const frame=storyFrame(scene,seconds,options);
 paintRetroScene(c,scene,frame,options);return frame;
}

export function createStoryAnimation(){
 let scene=null,seconds=0,beat=0,beatStart=0;
 return {reset(next){scene=next;seconds=0;beat=0;beatStart=0;},clear(){scene=null;seconds=0;beat=0;beatStart=0;},
  advance(dt,{held=false}={}){if(scene&&!held&&Number.isFinite(dt)&&dt>0&&Number.isFinite(seconds+dt))seconds+=dt;},
  paint(context,options={}){if((options.beat??0)!==beat){beat=options.beat??0;beatStart=seconds;}return scene?paintStory(context,scene,seconds,{...options,captionSeconds:seconds-beatStart}):null;},
  get seconds(){return seconds;}};
}

export function createStoryMotionSettings({media,storage,onChange=()=>{}}={}){
 let mode='system';try{const saved=storage?.getItem('canopy-story-motion');if(['system','action','reduced'].includes(saved))mode=saved;}catch{}
 const state=()=>({mode,reducedMotion:mode==='reduced'||mode==='system'&&!!media?.matches,systemReducedMotion:!!media?.matches});
 const changed=()=>onChange(state());media?.addEventListener?.('change',changed);
 return {get state(){return state();},set(value){if(!['system','action','reduced'].includes(value))return false;mode=value;try{storage?.setItem('canopy-story-motion',mode);}catch{}changed();return true;},dispose(){media?.removeEventListener?.('change',changed);}};
}
