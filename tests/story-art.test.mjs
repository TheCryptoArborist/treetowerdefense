import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {storyScene} from '../src/story.js';
import {storyFrame,paintStory,createStoryAnimation,createStoryMotionSettings,STORY_DURATION} from '../src/story-art.js';
function recorder(){
 const calls=[],gradient={addColorStop(){}};
 return new Proxy({calls},{get(target,key){
  if(key in target)return target[key];
  if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;
  return(...args)=>{assert.ok(args.every(x=>typeof x!=='number'||Number.isFinite(x)),String(key));calls.push([key,...args]);};
 }});
}
test('cinematic has three camera shots, moving actors and an on-screen strike; reduced motion is a fixed composition',()=>{
 const g=new Game(),s=storyScene(g,3),a=storyFrame(s,0),b=storyFrame(s,4),c=storyFrame(s,9);
 assert.deepEqual([a.shot,b.shot,c.shot],[0,1,2]);assert.notEqual(a.guardianX,b.guardianX);assert.ok(b.enemyX<a.enemyX);assert.notDeepEqual(a.camera,c.camera);
 assert.ok(storyFrame(s,5.3).strike);assert.equal(storyFrame(s,6).strike,false);
 assert.deepEqual(storyFrame(s,0,{reducedMotion:true}),storyFrame(s,999,{reducedMotion:true}));
 const first=recorder(),last=recorder();paintStory(first,s,0,{reducedMotion:true});paintStory(last,s,999,{reducedMotion:true});assert.deepEqual(first.calls,last.calls);
});
test('every chapter and seasonal checkpoint renders safely without changing game state or payments',()=>{
 for(const mode of ['campaign','haunted-grove','harvest-canopy'])for(let chapter=0;chapter<3;chapter++){
  const g=new Game();g.mode=mode;g.chapter=chapter;const before=g.snapshot();
  for(let n=0;n<=g.waveCount;n++){
   const scene=storyScene(g,n);for(const t of [0,2,4,5.3,9,12])assert.ok(paintStory(recorder(),scene,t));
   if(n===g.waveCount)assert.equal(scene.cinematic,'renewal');
  }assert.deepEqual(g.snapshot(),before);
 }
 const g=new Game();assert.equal(storyScene(g,3).enemyBoss,'ironroot');assert.equal(storyScene(g,6).enemyBoss,'saw');g.chapter=1;assert.equal(storyScene(g,6).enemyBoss,'sprayer');g.encounters=0;assert.equal(storyScene(g,3).enemyBoss,null);
});
test('presentation clock continues after the intro, holds when requested, resets on replay and clears on skip',()=>{
 const clock=createStoryAnimation(),s=storyScene(new Game(),0);clock.advance(5);assert.equal(clock.seconds,0);assert.equal(clock.paint(recorder()),null);
 clock.reset(s);clock.advance(3);const before=clock.seconds;clock.advance(0);clock.advance(-1);clock.advance(NaN);assert.equal(clock.seconds,before);
 clock.advance(100);assert.equal(clock.seconds,103);clock.advance(2,{held:true});assert.equal(clock.seconds,103);
 clock.reset(s);assert.equal(clock.seconds,0);clock.clear();clock.advance(4);assert.equal(clock.paint(recorder()),null);
});

test('late scenes keep enemy gait, guardian attacks, impacts and scenery moving without changing the game',()=>{
 const game=new Game(),scene=storyScene(game,3),before=game.snapshot();
 const a=storyFrame(scene,15.1),b=storyFrame(scene,16.6);assert(a.looping&&b.looping);
 assert.notEqual(a.enemyStride,b.enemyStride);assert.notEqual(a.guardianX,b.guardianX);
 assert(storyFrame(scene,5.3+2.8*5).strike);assert(storyFrame(scene,5.3+2.8*5).impact>0);
 assert(storyFrame(scene,6.4+2.8*5).allyStrike);
 const first=recorder(),last=recorder();paintStory(first,scene,18);paintStory(last,scene,19);assert.notDeepEqual(first.calls,last.calls);
 for(const t of [12.1,18,24,65])paintStory(recorder(),scene,t);
 const ending=storyScene(game,10);assert.equal(storyFrame(ending,21).strike,false);assert.equal(storyFrame(ending,21).allyStrike,false);
 assert.deepEqual(game.snapshot(),before);
});

test('scene motion follows the device by default and allows an explicit, persisted animation choice',()=>{
 const media=new EventTarget();media.matches=true;const prefs=new Map(),changes=[];
 const storage={getItem:key=>prefs.get(key)??null,setItem:(key,value)=>prefs.set(key,value)};
 const motion=createStoryMotionSettings({media,storage,onChange:s=>changes.push(s)});
 assert.equal(motion.state.mode,'system');assert.equal(motion.state.reducedMotion,true);
 assert.equal(motion.set('action'),true);assert.equal(motion.state.reducedMotion,false);assert.equal(prefs.get('canopy-story-motion'),'action');
 media.dispatchEvent(new Event('change'));assert.equal(motion.state.reducedMotion,false);
 const restored=createStoryMotionSettings({media,storage});assert.equal(restored.state.reducedMotion,false);restored.dispose();
 motion.set('system');media.matches=false;media.dispatchEvent(new Event('change'));assert.equal(motion.state.reducedMotion,false);
 motion.set('reduced');assert.equal(motion.state.reducedMotion,true);const count=changes.length;
 assert.equal(motion.set('invalid'),false);assert.equal(changes.length,count);motion.dispose();media.dispatchEvent(new Event('change'));assert.equal(changes.length,count);
});

test('unavailable preference storage keeps a usable motion toggle and reduced scenes remain still at late times',()=>{
 const motion=createStoryMotionSettings({media:{matches:true},storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
 assert.equal(motion.state.reducedMotion,true);assert(motion.set('action'));assert.equal(motion.state.reducedMotion,false);
 const scene=storyScene(new Game(),3),a=recorder(),b=recorder();paintStory(a,scene,16,{reducedMotion:true});paintStory(b,scene,70,{reducedMotion:true});assert.deepEqual(a.calls,b.calls);motion.dispose();
});
