import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {storyScene} from '../src/story.js';
import {storyFrame,paintStory,createStoryAnimation,STORY_DURATION} from '../src/story-art.js';
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
test('presentation clock resets on replay, stops at its final composition and clears on skip',()=>{
 const clock=createStoryAnimation(),s=storyScene(new Game(),0);clock.advance(5);assert.equal(clock.seconds,0);assert.equal(clock.paint(recorder()),null);
 clock.reset(s);clock.advance(3);const before=clock.seconds;clock.advance(0);clock.advance(-1);clock.advance(NaN);assert.equal(clock.seconds,before);
 clock.advance(100);assert.equal(clock.seconds,STORY_DURATION);clock.reset(s);assert.equal(clock.seconds,0);clock.clear();clock.advance(4);assert.equal(clock.paint(recorder()),null);
});
