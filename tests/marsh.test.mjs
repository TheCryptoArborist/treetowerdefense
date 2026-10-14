import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, MARSH_MAP, MEADOW_MAP, LEGACY_MAP, pointAt, TOWERS } from '../src/engine.js';
import { GuardianAiming } from '../src/aiming.js';
import { simulateDefense, BALANCE_PROFILES } from '../tools/balance-audit.mjs';
const marsh=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,3,0];g.forest.bestWaves=[10,10,0];g.refreshUnlocks(false);g.chooseChapter(2);return g;};
function run(g,placements){
 for(let wave=1;wave<=10;wave++){
  for(const[type,pad]of placements)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);
  assert.ok(g.startWave());let steps=0;while(g.phase==='running'&&steps++<15000){g.step(.05);g.events=[];}
  assert.ok(steps<15000);assert.notEqual(g.phase,'defeat',`wave ${wave}`);
 }
}
test('Moonlit new runs and chapter travel select the correct immutable geometry',()=>{
 const g=marsh();assert.equal(g.mapId,MARSH_MAP.id);assert.equal(g.map.length,3055);assert.notDeepEqual(g.map.path,MEADOW_MAP.path);assert.ok(Object.isFrozen(g.map.path));assert.ok(Object.isFrozen(g.map.pads[0]));
 const forest=structuredClone(g.forest),tree=g.tree;g.newRun();assert.equal(g.mapId,MARSH_MAP.id);g.chooseChapter(1);assert.equal(g.mapId,MEADOW_MAP.id);g.chooseChapter(2);assert.equal(g.mapId,MARSH_MAP.id);g.startEvent();assert.equal(g.mapId,LEGACY_MAP.id);assert.deepEqual(g.forest,forest);assert.equal(g.tree,tree);
});
test('marsh movement, defender positions, real attack coordinates and aim share one route',()=>{
 const g=marsh(),tower=g.place('pine',0);assert.deepEqual([tower.x,tower.y],MARSH_MAP.pads[0]);g.phase='running';g.wave=1;g.queue=['termite'];g.spawnTimer=100;
 const e=g.spawn('termite');e.progress=180;Object.assign(e,pointAt(e.progress,g.map));g.events=[];g.step(.05);assert.deepEqual({x:e.x,y:e.y},pointAt(e.progress,g.map));assert.equal(e.mapId,MARSH_MAP.id);
 const hit=g.events.find(e=>e.type==='attack');assert.ok(hit);assert.deepEqual([hit.tx,hit.ty],[e.x,e.y]);const aim=new GuardianAiming();aim.consume([hit]);assert.ok(aim.pose(tower.id).facing);assert.equal(aim.shots[0].tx,e.x);
});
test('pre-v0.15 Moonlit saves keep original geometry and queued enemies until a new run',()=>{
 for(const marker of [undefined,LEGACY_MAP.id]){
  const g=marsh();g.mapId=LEGACY_MAP.id;const t=g.place('pine',0);g.upgrade(t.id);g.setTargetMode(t.id,'strongest');g.phase='running';g.wave=6;g.queue=['blight','moth'];g.spawnTimer=.9;const e=g.spawn('beetle');e.progress=800;Object.assign(e,pointAt(800,g.map));e.hp/=2;
  const s=g.snapshot();if(marker===undefined)delete s.mapId;const r=Game.restore(s);assert.ok(r);assert.equal(r.mapId,LEGACY_MAP.id);assert.equal(r.phase,'paused');assert.deepEqual(r.towers,g.towers);assert.deepEqual(r.enemies,g.enemies);assert.deepEqual(r.queue,g.queue);assert.equal(r.tree,g.tree);
  r.pause();r.spawnTimer=0;r.step(.05);assert.equal(r.enemies.at(-1).mapId,undefined);const forest=structuredClone(r.forest),tree=r.tree;r.newRun();assert.equal(r.mapId,MARSH_MAP.id);assert.deepEqual(r.forest,forest);assert.equal(r.tree,tree);
 }
});
test('current marsh saves retain all geometry, growth, collectibles and queues through a continue',()=>{
 const g=marsh();g.season={bestWave:5,bestHealth:100,teamClear:true};g.setSeasonLook('oak',true);const t=g.place('oak',0);g.upgrade(t.id);g.phase='running';g.wave=8;g.queue=['moth','beetle'];g.spawnTimer=.8;const e=g.spawn('moth');e.progress=1700;Object.assign(e,pointAt(e.progress,g.map));
 const r=Game.restore(g.snapshot());assert.ok(r);assert.equal(r.mapId,MARSH_MAP.id);assert.deepEqual(r.enemies,g.enemies);assert.deepEqual(r.towers,g.towers);assert.deepEqual(r.seasonLooks,g.seasonLooks);r.phase='defeat';const tree=r.tree;assert.ok(r.continueRun());assert.equal(r.tree,tree-20000);assert.equal(r.mapId,MARSH_MAP.id);assert.deepEqual(r.queue,g.queue);assert.deepEqual(r.forest,g.forest);
});
test('the shorter marsh route breaches at its own endpoint and rejects invalid map combinations',()=>{
 const g=marsh();g.phase='running';g.wave=1;g.queue=['termite'];g.spawnTimer=100;const e=g.spawn('termite');e.progress=MARSH_MAP.length-.01;g.step(.05);assert.equal(g.health,88);assert.equal(g.enemies.length,0);
 const s=g.snapshot();s.chapter=1;assert.equal(Game.restore(s),null);s.chapter=2;s.mode='haunted-grove';s.eventVersion=1;assert.equal(Game.restore(s),null);
});
test('broad original-role coverage clears Marsh with Saplings while measured expansion is challenged',()=>{
 const mixed=simulateDefense(2,BALANCE_PROFILES.sapMixed);assert.equal(mixed.phase,'victory');assert.equal(mixed.treeSpent,0);assert.equal(mixed.health,46);assert.equal(mixed.snapshot.mapId,MARSH_MAP.id);
 const measured=simulateDefense(2,BALANCE_PROFILES.measured);assert.equal(measured.phase,'defeat');assert.equal(measured.rows.at(-1).wave,10);
});
test('earned Watchtower and Cannon support a full Sap-only Marsh defense',()=>{
 const g=marsh(),tree=g.tree;const placements=[['pine',0],['oak',1],['watchtower',2],['palm',4],['cannon',5],['mushroom',6],['cypress',11],['pine',3],['pine',10],['pine',9],['oak',8],['cypress',7]];
 run(g,placements);assert.equal(g.phase,'victory');assert.equal(g.tree,tree);assert.ok(g.towers.every(t=>t.level===1));assert.ok(g.towers.some(t=>t.type==='watchtower'));assert.ok(g.towers.some(t=>t.type==='cannon'));
 console.log(`Earned structures in Marsh: ${g.health} health, ${g.towers.length} Sapling defenders, 0 TREE spent.`);
});
