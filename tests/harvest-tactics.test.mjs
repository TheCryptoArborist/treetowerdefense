import test from 'node:test';import assert from 'node:assert/strict';
import {Game,HARVEST_CANOPY,HARVEST_MAP,LEGACY_MAP,pointAt,enemySpeed,harvestWind} from '../src/engine.js';
import {scoutWave} from '../src/playtest.js';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.startEvent(HARVEST_CANOPY.id);g.startWave();g.queue=[];g.spawnTimer=100;return g;};
const put=(g,e,p)=>Object.assign(e,{progress:p},pointAt(p,g.map));
test('orchard wind uses battle time, targeting speed, pauses and exact save restoration',()=>{
 const g=ready(),e=g.spawn('termite'),base=e.speed;
 assert.equal(g.mapId,HARVEST_MAP.id);assert.equal(g.eventVersion,2);assert.equal(harvestWind(9.99),false);assert.equal(enemySpeed(e,10),base*1.25);assert.equal(enemySpeed(e,14),base);
 e.slowUntil=12;assert.equal(enemySpeed(e,11),base*1.25*.55);
 g.time=11;g.pause();const state=g.snapshot();g.step(.05);assert.deepEqual(g.snapshot(),state);
 const r=Game.restore(state);assert.equal(r.phase,'paused');assert.equal(r.harvestWaveAt,g.harvestWaveAt);assert.equal(enemySpeed(r.enemies[0],r.time),enemySpeed(e,g.time));
 r.phase='build';r.startWave();assert.equal(r.harvestWaveAt,11);assert.equal(enemySpeed(r.spawn('termite'),11),base+3);
});
test('seed thieves raid once at the actual orchard cache, never create negative Sap or touch TREE',()=>{
 const g=ready(),e=put(g,g.spawn('termite'),g.map.length*.42-1),tree=g.tree;g.sap=5;g.step(.05);
 assert.equal(g.sap,0);assert.equal(e.seedStolen,true);assert.equal(g.events.find(e=>e.type==='harvest-theft').sap,5);assert.equal(g.tree,tree);
 g.sap=40;g.step(.05);assert.equal(g.sap,40);
 const r=Game.restore(g.snapshot());r.pause();r.step(.05);assert.equal(r.sap,40);assert.equal(r.enemies[0].seedStolen,true);
 const killed=ready(),dead=put(killed,killed.spawn('termite'),killed.map.length*.42+1);killed.strike(dead,10000,'pine');killed.step(.05);assert.equal(killed.events.some(e=>e.type==='harvest-theft'),false);
});
test('Harvester releases four route-correct escorts, exactly once across reload and continue',()=>{
 const g=ready(),boss=put(g,g.spawn('boss'),1000);boss.hp=boss.maxHp*.6;g.step(.05);
 assert.equal(g.enemies.filter(e=>e.kind==='termite').length,2);assert.equal(boss.harvestSummons,1);
 for(const child of g.enemies.filter(e=>e.kind==='termite')){assert.equal(child.mapId,HARVEST_MAP.id);assert.deepEqual({x:child.x,y:child.y},pointAt(child.progress,g.map));}
 const r=Game.restore(g.snapshot());r.pause();r.step(.05);assert.equal(r.enemies.length,3);const rb=r.enemies.find(e=>e.kind==='boss');rb.hp=rb.maxHp*.2;r.step(.05);assert.equal(r.enemies.length,5);assert.equal(rb.harvestSummons,3);
 r.phase='defeat';r.applyPurchasedContinue();r.step(.05);assert.equal(r.enemies.length,5);
 const brief=scoutWave(0,5,1,HARVEST_CANOPY.id,'standard',1,2);assert.match(brief.tip,/65% and 30%/);assert.match(brief.groups.find(e=>e.kind==='termite').trait,/8 Sap/);
});
test('legacy Harvest saves keep crossing geometry, queue and original behavior; mismatched map versions reject',()=>{
 const g=ready();g.eventVersion=1;g.mapId=LEGACY_MAP.id;const e=g.spawn('termite');delete e.harvestRule;delete e.harvestWaveAt;delete e.seedStolen;
 const save=g.snapshot(),r=Game.restore(save);assert.ok(r);assert.equal(r.mapId,LEGACY_MAP.id);assert.equal(r.harvestTactics,false);assert.equal(r.enemies[0].harvestRule,undefined);assert.equal(enemySpeed(r.enemies[0],11),e.speed);assert.deepEqual(r.queue,g.queue);
 const bad=ready().snapshot();bad.mapId=LEGACY_MAP.id;assert.equal(Game.restore(bad),null);
 const old=structuredClone(save);delete old.mapId;assert.equal(Game.restore(old).mapId,LEGACY_MAP.id);
});
