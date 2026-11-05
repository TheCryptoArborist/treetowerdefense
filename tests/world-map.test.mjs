import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {Game} from '../src/engine.js';
import {scoutWave} from '../src/playtest.js';
import {WORLD_REGIONS,worldMapState,waveMapAction,renderWorldRegions,renderMapBriefing} from '../src/world-map.js';
import {createWorldMap} from '../src/world-map-view.js';
const ready=()=>{const game=new Game();game.allowPreview();return game;};
const veteran=()=>{const game=ready();game.forest.stars=[3,2,1];game.forest.bestWaves=[10,10,10];game.startCampaign('veteran');return game;};
test('atlas represents all 60 campaign and five Harvest waves with exact scouting and unique IDs',()=>{
 const game=ready(),before=game.snapshot(),state=worldMapState(game),ids=new Set();
 assert.equal(state.total,60);assert.equal(state.regions.length,7);
 for(const region of state.regions){
  assert.equal(region.waves.length,region.mode==='campaign'?10:5);
  for(const wave of region.waves){
   assert.ok(!ids.has(wave.id));ids.add(wave.id);
   const scout=scoutWave(region.chapter,wave.wave,1,region.mode,region.difficulty,1);
   assert.equal(wave.total,scout.total);assert.deepEqual(wave.groups,scout.groups);
   assert.equal(wave.boss,scout.groups.find(group=>group.kind==='boss')?.name||'');
  }
 }
 assert.equal(ids.size,65);assert.equal(state.regions[5].waves[9].number,'60');
 assert.equal(state.regions[6].waves[4].number,'H5');
 assert.deepEqual(game.snapshot(),before);
});
test('current and next waves reflect the live run without marking an unfinished wave cleared',()=>{
 const game=ready();game.wave=10;game.phase='running';game.forest.bestWaves[0]=9;
 let region=worldMapState(game).regions[0];assert.equal(region.best,9);assert.equal(region.waves[9].status,'current');assert.equal(region.waves[9].cleared,false);
 game.phase='defeat';assert.equal(worldMapState(game).regions[0].waves[9].status,'defeated');
 game.phase='build';game.wave=4;region=worldMapState(game).regions[0];
 assert.equal(region.waves[4].status,'next');assert.equal(region.waves[4].cleared,true); // prior best retained during replay
 game.phase='victory';game.wave=10;assert.equal(worldMapState(game).regions[0].waves[9].status,'cleared');
});
test('unlock markers match earned defenses, with separate Veteran and seasonal territory',()=>{
 const game=ready(),state=worldMapState(game);
 assert.match(state.regions[0].waves[1].milestones[0],/Palm/);
 assert.match(state.regions[0].waves[3].milestones[0],/Cypress/);
 assert.match(state.regions[0].waves[5].milestones[0],/Mushroom/);
 assert.match(state.regions[0].waves[9].milestones[0],/Watchtower/);
 assert.match(state.regions[1].waves[9].milestones[0],/Cannon/);
 assert.equal(state.regions[3].waves.flatMap(w=>w.milestones).length,0);
 game.harvest.bestWave=5;assert.equal(worldMapState(game).cleared,0);
 game.forest.stars=[1,0,0];assert.equal(worldMapState(game).cleared,10);
 assert.equal(worldMapState(game).regions[3].unlocked,false);
 assert.equal(worldMapState(game).regions[6].unlocked,true);
});
test('legacy active encounters and boss absence are faithfully scouted',()=>{
 const game=ready();game.encounters=0;game.enemyRules=0;
 const state=worldMapState(game);assert.equal(state.regions[0].waves[3].boss,'');
 assert.deepEqual(state.regions[0].waves[3].groups,scoutWave(0,4,0,'campaign','standard',0).groups);
 assert.ok(state.regions[1].waves[3].miniBoss); // another region starts under current new-run rules
});
test('Veteran wave clears persist across fresh runs, chapter travel and reload without changing standard stars',()=>{
 const game=veteran(),stars=[...game.forest.stars];
 game.phase='running';game.wave=4;game.queue=[];game.enemies=[];game.step(.01);
 assert.equal(game.veteranBestWaves[0],4);assert.deepEqual(game.forest.stars,stars);
 game.newRun();game.chooseChapter(1);const restored=Game.restore(game.snapshot());
 assert.deepEqual(restored.veteranBestWaves,[4,0,0]);
 assert.equal(worldMapState(restored).regions[3].best,4);
 restored.startEvent('harvest-canopy');restored.phase='running';restored.wave=2;restored.queue=[];restored.enemies=[];restored.step(.01);
 assert.deepEqual(restored.veteranBestWaves,[4,0,0]);assert.equal(restored.harvest.bestWave,2);
});
test('old and edited saves infer only completed Veteran waves and preserve existing medals',()=>{
 const game=veteran();game.wave=7;game.phase='paused';game.veteranStars=[0,2,0];
 const saved=game.snapshot();delete saved.veteranBestWaves;
 assert.deepEqual(Game.restore(saved).veteranBestWaves,[6,10,0]);
 saved.veteranBestWaves=[-4,'10',900];assert.deepEqual(Game.restore(saved).veteranBestWaves,[6,10,0]);
 const standard=ready().snapshot();delete standard.veteranBestWaves;
 assert.deepEqual(Game.restore(standard).veteranBestWaves,[0,0,0]);
});
test('map offers only existing level entry or current battle return, never a wave skip or a purchase',()=>{
 const game=ready(),before=game.snapshot();let state=worldMapState(game);
 assert.equal(waveMapAction(state.regions[0],game).kind,'return');
 assert.equal(waveMapAction(state.regions[1],game).kind,'locked');
 assert.equal(waveMapAction(state.regions[6],game).kind,'locked');
 game.forest.stars[0]=1;state=worldMapState(game);
 assert.equal(waveMapAction(state.regions[1],game).kind,'travel');
 assert.match(waveMapAction(state.regions[1],game).label,/wave 1/);
 assert.equal(waveMapAction(state.regions[6],game).kind,'season');
 game.access=false;assert.equal(waveMapAction(state.regions[1],game).kind,'locked');
 assert.equal(game.wave,before.wave);assert.equal(game.tree,before.tree);assert.equal(game.sap,before.sap);
});
function ui(game=ready(),onTravel=async()=>false){
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const {document,window}=parseHTML(html),dialog=document.getElementById('world-map-dialog'),focus=[],scroll=[],returned=[];
 document.defaultView.HTMLElement.prototype.scrollIntoView=function(){scroll.push(this.dataset.mapWave);};
 document.defaultView.HTMLElement.prototype.focus=function(){focus.push(this.dataset.mapWave);};
 dialog.open=false;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 // LinkeDOM has a read-only select.value; emulate the browser's native setter.
 for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{writable:true,value:''});
 const originalDocument=globalThis.document;globalThis.document=document;
 let locked=false,saves=0;
 const map=createWorldMap({dialog,getGame:()=>game,blocked:()=>locked,onTravel,onSeason:async()=>false,save:()=>saves++,returnFocus:target=>returned.push(target)});
 map.refresh();
 return {document,dialog,window,map,game,focus,scroll,returned,get saves(){return saves;},setBlocked:value=>locked=value,
  click:selector=>document.querySelector(selector).dispatchEvent(new window.Event('click',{bubbles:true})),
  dispose:()=>{globalThis.document=originalDocument;}};
}
test('real map controls inspect all wave nodes, pause on open and retain the running battle on return',()=>{
 const game=ready();game.startWave();game.step(.02);const s=ui(game),before=game.snapshot();
 try{
  assert.equal(s.map.open('world-button'),true);assert.equal(game.phase,'paused');
  assert.equal(s.dialog.querySelectorAll('[data-map-wave]').length,65);
  assert.equal(s.document.querySelector('[data-map-wave="level-1-wave-1"]').getAttribute('aria-current'),'step');
  s.click('[data-map-wave="level-1-wave-10"]');assert.match(s.document.querySelector('[data-map-briefing]').textContent,/Blight King/);
  assert.equal(game.wave,1);assert.deepEqual(game.queue,before.queue);assert.equal(game.tree,before.tree);assert.equal(game.sap,before.sap);
  s.click('[data-map-action="return"]');assert.equal(s.dialog.open,false);assert.equal(game.phase,'paused');assert.deepEqual(s.returned,['world-button']);
  assert.ok(s.saves>0);assert.equal(s.scroll.at(-1),'level-1-wave-1');
 }finally{s.dispose();}
});
test('region selection and find-my-wave support keyboard focus without resetting any battle',()=>{
 const s=ui();try{
  s.map.open();assert.equal(s.map.selectRegion('level-3'),true);
  assert.equal(s.focus.at(-1),'level-3-wave-1');assert.equal(s.document.querySelector('[data-map-action]').disabled,true);
  s.click('[data-map-locate]');assert.equal(s.focus.at(-1),'level-1-wave-1');
  assert.equal(s.map.selectRegion('not-a-region'),false);assert.equal(s.game.wave,0);
 }finally{s.dispose();}
});
test('double-clicked travel is single-flight; pending travel holds close/Escape and cancelled travel leaves the atlas open',async()=>{
 const game=ready();game.forest.stars[0]=1;let calls=0,resolve;
 const pending=new Promise(done=>{resolve=done;});const s=ui(game,async()=>{calls++;return pending;});
 try{
  s.map.open();s.map.selectRegion('level-2');s.click('[data-map-action="travel"]');s.click('[data-map-action="travel"]');
  assert.equal(calls,1);assert.equal(s.map.close(),false);
  const escape=new s.window.Event('cancel',{cancelable:true});s.dialog.dispatchEvent(escape);assert.equal(escape.defaultPrevented,true);
  resolve(false);await new Promise(done=>setImmediate(done));assert.equal(s.dialog.open,true);assert.equal(game.chapter,0);assert.equal(game.wave,0);
  assert.equal(s.map.close(),true);
 }finally{s.dispose();}
});
test('loss of access and other dialogs block opening and stale travel actions',async()=>{
 const game=ready();game.forest.stars[0]=1;let calls=0;const s=ui(game,async()=>{calls++;return true;});
 try{
  s.setBlocked(true);assert.equal(s.map.open(),false);s.setBlocked(false);s.map.open();s.map.selectRegion('level-2');
  game.access=false;s.click('[data-map-action="travel"]');await new Promise(done=>setImmediate(done));assert.equal(calls,0);
  assert.equal(s.document.querySelector('[data-map-action]').disabled,true);s.map.close();assert.equal(s.map.open(),false);
 }finally{s.dispose();}
});
test('regions and wave briefings are escaped and remain informative for locked territory',()=>{
 const game=ready(),state=worldMapState(game),region=state.regions[1];
 const markup=renderWorldRegions({...state,regions:[{...region,name:'<script>alert(1)</script>'}]});
 assert.ok(markup.includes('&lt;script&gt;'));assert.ok(!markup.includes('<script>'));
 assert.match(renderMapBriefing(region,region.waves[0],game),/Region locked/);
 assert.match(renderMapBriefing(state.regions[0],state.regions[0].waves[1],game),/Palm/);
 assert.equal(WORLD_REGIONS.length,7);
});
