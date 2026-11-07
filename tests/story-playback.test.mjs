import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {createStoryPlayback} from '../src/story-playback.js';

const scene={narration:'Something approaches the forest. Protect the Tree of Life.'};
test('scene automatically reaches guardian dialogue after its intro without advancing a battle',()=>{
 const playback=createStoryPlayback();playback.reset(scene);
 assert.equal(playback.advance(11.99,{voiceStatus:'finished'}),0);
 assert.equal(playback.advance(12,{voiceStatus:'finished'}),1);
 assert.equal(playback.advance(100,{voiceStatus:'finished'}),1);
 playback.clear();assert.equal(playback.advance(100),0);
 playback.reset(scene);assert.equal(playback.advance(0),0);
});
test('automatic dialogue waits for active narration and has readable silent and stalled-voice fallbacks',()=>{
 const playback=createStoryPlayback(),speaking={enabled:true,voiceEnabled:true,voiceStatus:'speaking'};
 playback.reset(scene);assert.equal(playback.advance(12,speaking),0);assert.equal(playback.advance(14,{...speaking,voiceStatus:'finished'}),1);
 playback.reset(scene);assert.equal(playback.advance(44,speaking),0);assert.equal(playback.advance(45,speaking),1);
 playback.reset({narration:Array(60).fill('forest').join(' ')});assert.equal(playback.advance(12),0);assert.equal(playback.advance(30),1);
 playback.reset(scene);assert.equal(playback.advance(NaN),0);assert.equal(playback.advance(12,{...speaking,enabled:false}),1);
});
test('cutscene dialog contains only Skip and Return controls and no configuration fields',async()=>{
 const {document}=parseHTML(await readFile('index.html','utf8')),dialog=document.getElementById('story-dialog');
 assert.deepEqual([...dialog.querySelectorAll('button')].map(b=>b.id),['story-skip','story-next']);
 assert.equal(dialog.querySelectorAll('input,select').length,0);
 assert.match(dialog.querySelector('#story-next').textContent,/Return to the battlefield/);
 assert.equal(dialog.querySelector('[autofocus]').id,'story-skip');
});
