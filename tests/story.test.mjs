import test from 'node:test';import assert from 'node:assert/strict';
import {Game,TOWERS} from '../src/engine.js';import {storyScene,createStoryDirector,storyCheckpoint} from '../src/story.js';
class Dialog extends EventTarget{open=false;showModal(){this.open=true;}close(){this.open=false;this.dispatchEvent(new Event('close'));}}
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];return g;};
test('every campaign, Veteran and seasonal wave has a complete story with real next-wave guidance',()=>{
 for(const mode of ['campaign','harvest-canopy','haunted-grove'])for(const difficulty of ['standard','veteran'])for(let chapter=0;chapter<3;chapter++){
  const g=ready();g.mode=mode;g.difficulty=difficulty;g.chapter=chapter;const before=g.snapshot();
  for(let stage=0;stage<=g.waveCount;stage++){const s=storyScene(g,stage);assert.ok(s.title&&s.narration&&s.dialogue&&s.hint);assert.ok(TOWERS[s.speaker]);assert.equal(s.ending,stage===g.waveCount);}
  assert.deepEqual(g.snapshot(),before);assert.equal(storyScene(g,-1),null);assert.equal(storyScene(g,g.waveCount+1),null);
 }
 const g=ready();assert.match(storyScene(g,3).hint,/Ironroot/);assert.match(storyScene(g,6).hint,/Chainsaw/);g.chapter=1;assert.match(storyScene(g,6).hint,/Blight Sprayer/);
 g.encounters=0;assert.doesNotMatch(storyScene(g,3).narration,/Ironroot|red light/);
});
test('one scene per checkpoint per run, skip continues only the explicitly requested opening wave',()=>{
 const g=ready(),dialog=new Dialog();let next=0;const director=createStoryDirector({dialog,getGame:()=>g,blocked:()=>false,render:()=>{},onClose:()=>{}});
 const before=g.snapshot();assert.ok(director.open(0,{after:()=>{next++;g.startWave();}}));assert.deepEqual(g.snapshot(),before);
 assert.equal(director.open(0),false);director.close();assert.equal(next,1);assert.equal(g.wave,1);assert.equal(g.phase,'running');
 assert.equal(director.open(0),false);g.newRun();assert.ok(director.open(0));director.close();assert.equal(g.phase,'build');assert.equal(next,1);
});
test('replay pauses an active battle, never starts a wave, and leaves funds and enemies intact',()=>{
 const g=ready();g.wave=3;g.phase='running';g.spawn('beetle');const before=g.snapshot(),dialog=new Dialog();const d=createStoryDirector({dialog,getGame:()=>g,blocked:()=>false,render:()=>{},onClose:()=>{}});
 assert.ok(d.open(3,{replay:true}));assert.equal(g.phase,'paused');d.close();const after=g.snapshot();assert.deepEqual({...after,phase:before.phase},before);
});
test('access, checkout, preference and changed-game guards prevent unintended continuation',()=>{
 let g=ready(),locked=true,enabled=true,count=0;const dialog=new Dialog();const d=createStoryDirector({dialog,getGame:()=>g,blocked:()=>locked,enabled:()=>enabled,render:()=>{},onClose:()=>{}});
 assert.equal(d.open(0),false);locked=false;enabled=false;assert.equal(d.open(0),false);g.access=false;assert.equal(d.open(0,{replay:true}),false);g.access=true;enabled=true;
 assert.ok(d.open(0,{after:()=>count++}));g.newRun();d.close();assert.equal(count,0);
 assert.ok(d.open(0,{after:()=>count++}));g=ready();d.close();assert.equal(count,0);
});

test('mid-wave replay uses only the last completed checkpoint',()=>{const g=ready();g.wave=5;for(const phase of ['running','paused','defeat']){g.phase=phase;assert.equal(storyCheckpoint(g),4);}for(const phase of ['build','victory']){g.phase=phase;assert.equal(storyCheckpoint(g),5);}g.wave=0;g.phase='paused';assert.equal(storyCheckpoint(g),0);});
