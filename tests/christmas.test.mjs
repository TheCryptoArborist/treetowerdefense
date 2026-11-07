import test from 'node:test';import assert from 'node:assert/strict';
import {Game,CHRISTMAS_CHAOS,CHRISTMAS_MAP,LEGACY_MAP,TOWERS,enemySpeed,pointAt,eventLineup} from '../src/engine.js';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.forest.bestWaves=[10,0,0];g.forest.unlocked=Object.keys(TOWERS);assert.ok(g.startChristmasPreview());return g;};
const battle=()=>{const g=ready();g.startWave();g.queue=[];g.spawnTimer=100;return g;};
test('Christmas is an explicit development preview; existing public seasonal entry stays closed',()=>{
 const locked=new Game();assert.equal(locked.startChristmasPreview(),false);locked.allowPreview();assert.equal(locked.startChristmasPreview(),false);locked.forest.stars[0]=3;assert.equal(locked.startEvent(CHRISTMAS_CHAOS.id),false);
 const g=ready();assert.equal(g.mapId,CHRISTMAS_MAP.id);assert.equal(g.runName,'Christmas Chaos');assert.equal(g.waveCount,5);assert.deepEqual(g.forest.stars,[3,0,0]);assert.notDeepEqual(g.map.path,LEGACY_MAP.path);
 for(let wave=1;wave<=5;wave++){g.phase='build';g.startWave();assert.deepEqual(g.queue,eventLineup(wave,CHRISTMAS_CHAOS.id));assert.equal(g.queue.filter(k=>k==='boss').length,wave===5?1:0);}
});
test('frost armor absorbs ordinary damage; piercing and poison counters bypass it',()=>{
 const g=battle(),beetle=g.spawn('beetle'),hp=beetle.hp;
 g.strike(beetle,30,'pine');assert.equal(beetle.hp,hp);assert.equal(beetle.frostArmor,10);
 g.strike(beetle,20,'oak');assert.equal(beetle.hp,hp-10);assert.equal(beetle.frostArmor,0);
 for(const source of ['watchtower','cypress','poison','storm']){beetle.frostArmor=40;const before=beetle.hp;g.strike(beetle,2,source);assert.equal(beetle.frostArmor,40);assert.equal(beetle.hp,before-2);}
});
test('free bell is once per wave, clears frost, stuns on battle time and survives pause/reload/continue',()=>{
 const g=ready(),tree=g.tree,sap=g.sap;assert.equal(g.ringWinterBell(),false);g.startWave();assert.equal(g.ringWinterBell(),false);const e=g.spawn('beetle');g.events=[];assert.equal(g.ringWinterBell(),true);assert.equal(g.tree,tree);assert.equal(g.sap,sap);assert.equal(e.frostArmor,0);assert.equal(enemySpeed(e,g.time+2.4),0);assert.ok(enemySpeed(e,g.time+2.5)>0);assert.equal(g.ringWinterBell(),false);
 g.pause();const snapshot=g.snapshot();g.step(.05);assert.deepEqual(g.snapshot(),snapshot);const r=Game.restore(snapshot);assert.ok(r);assert.equal(r.phase,'paused');assert.equal(r.winterWarmUntil,6);assert.equal(r.winterBellUsed,true);assert.equal(r.enemies[0].winterStunUntil,2.5);
 r.phase='defeat';r.applyPurchasedContinue();assert.equal(r.ringWinterBell(),false);r.phase='build';r.startWave();assert.equal(r.winterBellUsed,false);
});
test('Tyrant blizzard happens once across reload, and a reserved bell strips the fresh armor',()=>{
 const g=battle(),boss=g.spawn('boss'),escort=g.spawn('termite');boss.hp=boss.maxHp*.49;g.step(.05);assert.equal(boss.blizzardCast,true);assert.equal(escort.frostArmor,40);assert.equal(g.events.filter(e=>e.type==='winter-blizzard').length,1);
 const r=Game.restore(g.snapshot());r.pause();r.events=[];r.step(.05);assert.equal(r.events.some(e=>e.type==='winter-blizzard'),false);assert.equal(r.ringWinterBell(),true);assert.ok(r.enemies.every(e=>e.frostArmor===0));
});
test('winter rewards stay separate and bell mastery requires a completed run',()=>{
 const g=ready(),forest=structuredClone(g.forest),harvest=structuredClone(g.harvest);g.winterBellClears=3;g.winterBellUsed=false;g.phase='running';g.wave=5;g.queue=[];g.enemies=[];g.step(.05);
 assert.equal(g.phase,'victory');assert.deepEqual(g.winterRewards,CHRISTMAS_CHAOS.rewards);assert.deepEqual(g.forest,forest);assert.deepEqual(g.harvest,harvest);
 const r=Game.restore(g.snapshot());assert.deepEqual(r.winterRewards,g.winterRewards);g.newRun();assert.equal(g.winterBellClears,0);assert.deepEqual(g.winterRewards,CHRISTMAS_CHAOS.rewards);
 const partial=ready();partial.winterBellUsed=true;partial.phase='running';partial.wave=1;partial.enemies=[];partial.queue=[];partial.step(.05);assert.equal(partial.winter.bellWaves,0);assert.equal(partial.winterBellClears,1);
});
test('winter save guards reject map/version and malformed frost state; old campaigns remain unchanged',()=>{
 const g=battle();g.spawn('beetle');for(const mutate of [s=>s.mapId=LEGACY_MAP.id,s=>s.eventVersion=9,s=>s.winterBellClears=99,s=>s.enemies[0].frostArmor=-1,s=>s.enemies[0].winterStunUntil=NaN]){const s=g.snapshot();mutate(s);assert.equal(Game.restore(s),null);}
 const old=new Game();old.allowPreview();const s=old.snapshot();delete s.winter;delete s.winterBellUsed;delete s.winterWarmUntil;delete s.winterBellClears;const r=Game.restore(s);assert.ok(r);assert.equal(r.mode,'campaign');assert.deepEqual(r.winter,{bestWave:0,bestHealth:0,bellWaves:0});
});
test('five winter waves and cosmetic goals are achievable with earned Saplings and zero TREE spending',async()=>{
 const {MIXED_PLACEMENTS}=await import('../tools/balance-audit.mjs');const g=ready();g.forest.unlocked=['oak','pine','palm','cypress','mushroom','watchtower'];const tree=g.tree;
 for(let wave=1;wave<=5;wave++){
  for(const[type,pad]of MIXED_PLACEMENTS)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);
  assert.ok(g.startWave());let steps=0;while(g.phase==='running'&&steps++<15000){g.step(.05);if(!g.winterBellUsed&&g.enemies.some(e=>e.hp>0)&&(wave<5||g.enemies.some(e=>e.blizzardCast)))g.ringWinterBell();g.events=[];}
  assert.notEqual(g.phase,'defeat',`wave ${wave}`);assert.ok(steps<15000);
 }
 assert.equal(g.phase,'victory');assert.equal(g.health,100);assert.equal(g.tree,tree);assert.equal(g.runReport.treeSpent,0);assert.ok(g.towers.every(t=>t.level===1));assert.deepEqual(g.winterRewards,CHRISTMAS_CHAOS.rewards);
});
test('winter forecasts match actual queues and the bell really shortens defender reloads',async()=>{
 const {scoutWave,battleReport}=await import('../src/playtest.js');for(let wave=1;wave<=5;wave++){const scout=scoutWave(0,wave,1,CHRISTMAS_CHAOS.id);assert.equal(scout.total,eventLineup(wave,CHRISTMAS_CHAOS.id).length);assert.match(scout.tip,/bell|Bell/);}
 const shots=[];for(const bell of [false,true]){const g=battle();g.sap=1000;g.place('pine',0);const e=g.spawn('beetle');Object.assign(e,{progress:165,hp:100000,maxHp:100000,speed:1,frostArmor:0},pointAt(165,g.map));if(bell)g.ringWinterBell();let count=0;for(let n=0;n<120;n++){g.step(.05);count+=g.events.filter(e=>e.type==='attack').length;g.events=[];}shots.push(count);g.step(.05);assert.ok(g.towers[0].cooldown<=TOWERS.pine.interval);}
 assert.ok(shots[1]>shots[0],`normal/rally shots ${shots}`);
 const finished=ready();finished.winterBellClears=3;finished.winterBellUsed=false;finished.phase='running';finished.wave=5;finished.queue=[];finished.enemies=[];finished.step(.05);assert.ok(battleReport(finished).earned.every(Boolean));
});
