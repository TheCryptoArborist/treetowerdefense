import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,HARVEST_CANOPY,eventLineup,ORIGINAL_GUARDIANS} from '../src/engine.js';
import {scoutWave,battleReport} from '../src/playtest.js';
import {CombatFeedback} from '../src/combat.js';
import {MIXED_PLACEMENTS} from '../tools/balance-audit.mjs';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.forest.bestWaves=[10,0,0];g.forest.unlocked=[...ORIGINAL_GUARDIANS,'watchtower'];return g;};
const finish=(g,wave,health)=>{g.phase='running';g.wave=wave;g.health=health;g.enemies=[];g.queue=[];g.step(.05);};
test('Harvest admission is included but requires NFT access and Emerald completion',()=>{
 const g=new Game(),before=g.snapshot();assert.equal(g.startEvent(HARVEST_CANOPY.id),false);assert.deepEqual(g.snapshot(),before);g.allowPreview();assert.equal(g.startEvent(HARVEST_CANOPY.id),false);g.forest.stars[0]=1;const funds=g.tree,forest=structuredClone(g.forest);assert.ok(g.startEvent(HARVEST_CANOPY.id));assert.equal(g.runName,HARVEST_CANOPY.name);assert.equal(g.map.id,'crossing-v1');assert.equal(g.tree,funds);assert.deepEqual(g.forest,forest);
});
test('Harvest waves and scouting agree, with one final Hollow Harvester and correct feedback',()=>{
 const g=ready();g.startEvent(HARVEST_CANOPY.id);
 for(let wave=1;wave<=5;wave++){g.phase='build';g.startWave();assert.deepEqual(g.queue,eventLineup(wave,g.mode));const scout=scoutWave(0,wave,1,g.mode);assert.equal(scout.total,g.queue.length);for(const p of scout.groups)assert.equal(p.count,g.queue.filter(k=>k===p.kind).length);assert.equal(g.queue.filter(k=>k==='boss').length,wave===5?1:0);const f=new CombatFeedback();f.consume(g.events.filter(e=>e.type==='wave-start').slice(-1));assert.equal(f.notice.text,scout.tip);if(wave===5)assert.match(f.notice.title,/HOLLOW HARVESTER/);}
 const boss=g.spawn('boss');assert.equal(boss.theme,'harvest-canopy');assert.equal(boss.maxHp,1450);const f=new CombatFeedback();f.consume(g.events);assert.match(f.notice.title,/HARVESTER/);g.events=[];g.strike(boss,1450,'pine');g.resolveKills();f.consume(g.events);assert.match(f.notice.title,/HARVESTER FALLS/);assert.deepEqual(eventLineup(6,g.mode),[]);
});
test('Harvest rewards are independent, permanent, cosmetic and not duplicated',()=>{
 const g=ready();g.season={bestWave:5,bestHealth:100,teamClear:true};g.setSeasonLook('oak',true);g.startEvent(HARVEST_CANOPY.id);const forest=structuredClone(g.forest),old=structuredClone(g.season);g.sap=1000;g.place('oak',0);g.place('pine',1);g.place('watchtower',2);finish(g,5,100);assert.deepEqual(g.harvestRewards,HARVEST_CANOPY.rewards);assert.deepEqual(g.season,old);assert.deepEqual(g.forest,forest);assert.equal(g.runReport.rewards.length,4);assert.match(battleReport(g).earned.join(','),/Copperleaf/);assert.match(battleReport(g).goal,/Harvest/);
 const funds=[g.tree,g.sap],towers=structuredClone(g.towers);for(const type of ['oak','watchtower','tree'])assert.ok(g.setHarvestLook(type,true));assert.deepEqual([g.tree,g.sap],funds);assert.deepEqual(g.towers,towers);g.newRun();g.events=[];finish(g,5,100);assert.equal(g.events.filter(e=>e.type==='season-reward').length,0);g.chooseChapter(1);assert.equal(g.harvestLooks.tree,true);assert.equal(g.seasonLooks.oak,true);
});
test('lower health and missing team goals cannot equip unearned looks',()=>{
 const g=ready();g.startEvent(HARVEST_CANOPY.id);finish(g,5,79);assert.deepEqual(g.harvestRewards,['harvest-badge']);for(const t of ['oak','watchtower','tree','bogus'])assert.equal(g.setHarvestLook(t,true),false);assert.deepEqual(g.seasonRewards,[]);g.newRun();finish(g,5,80);assert.deepEqual(g.harvestRewards,['harvest-badge','copperleaf-oak']);
});
test('old Halloween battle restores unchanged; Harvest queue, report and cosmetics survive reload and continue',()=>{
 const old=ready();old.startEvent();old.place('pine',0);old.startWave();old.step(.05);const save=old.snapshot();delete save.harvest;delete save.harvestLooks;const legacy=Game.restore(save);assert.equal(legacy.runName,'Haunted Grove');assert.deepEqual(legacy.queue,old.queue);assert.deepEqual(legacy.harvestRewards,[]);
 const g=ready();g.season={bestWave:5,bestHealth:100,teamClear:true};g.startEvent(HARVEST_CANOPY.id);g.sap=500;g.place('pine',0);g.wave=3;g.phase='running';g.queue=['beetle','moth'];g.spawnTimer=.7;g.spawn('blight');g.harvest={bestWave:5,bestHealth:100,teamClear:true};g.setHarvestLook('tree',true);const r=Game.restore(g.snapshot());assert.equal(r.phase,'paused');assert.equal(r.runName,HARVEST_CANOPY.name);assert.deepEqual(r.harvestLooks,g.harvestLooks);assert.deepEqual(r.season,g.season);assert.deepEqual(r.queue,g.queue);assert.equal(r.enemies[0].theme,'harvest-canopy');r.phase='defeat';r.applyPurchasedContinue();assert.equal(r.mode,HARVEST_CANOPY.id);assert.equal(r.wave,3);assert.deepEqual(r.queue,g.queue);
 const bad=g.snapshot();bad.eventVersion=2;assert.equal(Game.restore(bad),null);bad.eventVersion=1;bad.harvest={bestWave:99,bestHealth:Infinity,teamClear:true};bad.harvestLooks={oak:true,tree:true};const invalid=Game.restore(bad);assert.deepEqual(invalid.harvestRewards,[]);assert.equal(invalid.harvestLooks.tree,false);
});
test('all Harvest goals are achievable with earned roster, Saplings and zero TREE spending',()=>{
 const g=ready();g.startEvent(HARVEST_CANOPY.id);const tree=g.tree;
 for(let w=1;w<=5;w++){for(const[type,pad]of MIXED_PLACEMENTS)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);assert.ok(g.startWave());let steps=0;while(g.phase==='running'&&steps++<15000){g.step(.05);g.events=[];}assert.ok(steps<15000);assert.notEqual(g.phase,'defeat',`wave ${w}`);}
 assert.equal(g.phase,'victory');assert.equal(g.health,100);assert.deepEqual(g.harvestRewards,HARVEST_CANOPY.rewards);assert.equal(g.tree,tree);assert.ok(g.towers.every(t=>t.level===1));console.log(`Harvest Sap-only: ${g.health} health, ${g.towers.length} defenders, zero TREE spent`);
});
