import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';import {storyScene} from '../src/story.js';
import {RETRO_WIDTH,RETRO_HEIGHT,RETRO_PALETTE,palettePixels,retroCaption,retroLines,retroPose} from '../src/story-retro.js';
import {createStoryAnimation,storyFrame} from '../src/story-art.js';
test('retro stage uses one fixed 32-color palette and preserves alpha',()=>{
 assert.equal(RETRO_WIDTH*3,960);assert.equal(RETRO_HEIGHT*3,420);
 const pixels=new Uint8ClampedArray([255,90,70,255,16,48,92,128,217,149,68,0]);palettePixels(pixels);
 const allowed=new Set(RETRO_PALETTE.map(hex=>hex.toLowerCase()));
 for(let i=0;i<pixels.length;i+=4)assert(allowed.has('#'+[...pixels.slice(i,i+3)].map(n=>n.toString(16).padStart(2,'0')).join('')));
 assert.deepEqual([pixels[3],pixels[7],pixels[11]],[255,128,0]);
});
test('typewriter captions reveal and page every line without dropping story words',()=>{
 const scene=storyScene(new Game(),3);
 assert(retroCaption(scene,0).lines.every(s=>s===''));
 const full=retroLines(scene.narration),pages=Math.ceil(full.length/3),shown=[];
 for(let page=0;page<pages;page++){const caption=retroCaption(scene,page*7+6);assert.equal(caption.page,page);shown.push(...caption.lines);}
 assert.deepEqual(shown,full);
 const dialogue=retroCaption(scene,6,{beat:1});assert(dialogue.speaker.startsWith(scene.speaker));assert.deepEqual(dialogue.lines,retroLines(scene.dialogue).slice(0,3));
 assert.deepEqual(retroCaption(scene,0,{reducedMotion:true}),retroCaption(scene,999,{reducedMotion:true}));
});
test('sprite poses snap between original directions and dialogue holds its portrait shot',()=>{
 const ready=retroPose(Infinity),wind=retroPose(Infinity,1),strike=retroPose(.25);
 assert.deepEqual([ready.direction,wind.direction,strike.direction],[1,1,2]);assert(strike.step>ready.step);
 assert.deepEqual(retroPose(.25,1,true),retroPose(99,0,true));
 const scene=storyScene(new Game(),3);for(const t of [1,4,14,99])assert.equal(storyFrame(scene,t,{beat:1}).shot,2);
});
test('dialogue typewriter restarts on manual beat change while a held clock keeps the same caption',()=>{
 const clock=createStoryAnimation(),scene=storyScene(new Game(),3),calls=[];
 const gradient={addColorStop(){}},c=new Proxy({},{get(_,key){if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;return(...args)=>calls.push([key,...args]);}});
 clock.reset(scene);clock.advance(9);clock.paint(c,{beat:0});clock.paint(c,{beat:1});
 const atBeatStart=retroCaption(scene,0,{beat:1});assert(atBeatStart.lines.every(s=>!s));
 calls.length=0;clock.paint(c,{beat:1,reducedMotion:true});const before=JSON.stringify(calls);
 clock.advance(4,{held:true});calls.length=0;clock.paint(c,{beat:1,reducedMotion:true});assert.equal(JSON.stringify(calls),before);
});
