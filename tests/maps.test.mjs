import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, MAPS, LEGACY_MAP, MEADOW_MAP, pointAt, PATH_LENGTH, ORIGINAL_GUARDIANS } from '../src/engine.js';
import { GuardianAiming } from '../src/aiming.js';
import { CombatFeedback } from '../src/combat.js';
import { simulateDefense, BALANCE_PROFILES } from '../tools/balance-audit.mjs';
const meadow=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.forest.bestWaves=[10,0,0];g.forest.unlocked=[...ORIGINAL_GUARDIANS,'watchtower'];g.chooseChapter(1);return g;};
const pos=(e,g,p)=>Object.assign(e,{progress:p},pointAt(p,g.map));

test('map geometry is distinct, continuous, bounded and keeps twelve valid build sites',()=>{
 assert.notDeepEqual(MEADOW_MAP.path,LEGACY_MAP.path);assert.notDeepEqual(MEADOW_MAP.pads,LEGACY_MAP.pads);
 for(const map of Object.values(MAPS)){
  assert.equal(map.pads.length,12);assert.equal(map.segments.length,map.path.length-1);assert.ok(map.length>3000);assert.deepEqual(map.path.at(-1),[940,640]);
  assert.equal(new Set(map.pads.map(p=>p.join(','))).size,12);
  let d=0;for(let i=0;i<map.path.length;i++){assert.deepEqual(pointAt(d,map),{x:map.path[i][0],y:map.path[i][1]});if(map.segments[i])d+=map.segments[i];}
  assert.deepEqual(pointAt(map.length+1,map),{x:940,y:640});assert.deepEqual(pointAt(-1,map),{x:map.path[0][0],y:map.path[0][1]});
  for(const[x,y]of map.pads)assert.ok(x>=45&&x<=955&&y>=120&&y<=650);
 }
});
test('chapter travel, event travel and fresh runs choose the correct map without spending',()=>{
 const g=meadow();const tree=g.tree;assert.equal(g.mapId,MEADOW_MAP.id);
 g.chooseChapter(0);assert.equal(g.mapId,LEGACY_MAP.id);g.startEvent();assert.equal(g.mapId,LEGACY_MAP.id);
 g.chooseChapter(1);assert.equal(g.mapId,MEADOW_MAP.id);g.newRun();assert.equal(g.mapId,MEADOW_MAP.id);assert.equal(g.tree,tree);
});
test('placement, movement, targeting and attack facing agree on meadow coordinates',()=>{
 const g=meadow(),t=g.place('pine',0);assert.deepEqual([t.x,t.y],MEADOW_MAP.pads[0]);
 g.phase='running';g.wave=1;g.queue=['termite'];g.spawnTimer=100;
 const e=pos(g.spawn('termite'),g,180);assert.equal(e.mapId,MEADOW_MAP.id);assert.equal(e.y,190);
 const p=e.progress;g.events=[];g.step(.05);assert.ok(e.progress>p);assert.deepEqual({x:e.x,y:e.y},pointAt(e.progress,g.map));assert.equal(g.targetsFor(t)[0].id,e.id);
 const attack=g.events.find(e=>e.type==='attack');assert.ok(attack);assert.deepEqual([attack.tx,attack.ty],[e.x,e.y]);
 const aim=new GuardianAiming();aim.consume([attack]);assert.equal(aim.shots[0].tx,e.x);assert.ok(aim.pose(t.id).facing);
});
test('only reaching the active route endpoint causes a breach',()=>{
 const g=meadow();g.phase='running';g.wave=1;g.queue=['termite'];g.spawnTimer=100;
 const e=pos(g.spawn('termite'),g,PATH_LENGTH+1);e.speed=1;g.step(.05);assert.equal(g.health,100);assert.ok(g.enemies.includes(e));
 e.progress=g.map.length-.01;g.step(.05);assert.equal(g.health,88);assert.equal(g.enemies.length,0);
});
test('new meadow saves preserve geometry, progress, queues, growth and targeting through continue',()=>{
 const g=meadow(),t=g.place('pine',0);g.upgrade(t.id);g.setTargetMode(t.id,'fastest');g.phase='running';g.wave=3;g.queue=['moth','beetle'];g.spawnTimer=.75;
 const e=pos(g.spawn('moth'),g,1300);e.hp/=2;const s=g.snapshot(),r=Game.restore(s);assert.ok(r);assert.equal(r.phase,'paused');assert.equal(r.mapId,MEADOW_MAP.id);assert.deepEqual(r.queue,s.queue);assert.equal(r.spawnTimer,.75);assert.deepEqual(r.enemies,g.enemies);assert.equal(r.towers[0].x,t.x);assert.equal(r.towers[0].level,2);assert.equal(r.towers[0].targetMode,'fastest');assert.equal(r.tree,g.tree);
 r.phase='defeat';r.continueRun();assert.equal(r.mapId,MEADOW_MAP.id);assert.deepEqual(r.queue,g.queue);assert.deepEqual(r.forest,g.forest);
});
test('a pre-map Sunpetal save keeps the original route for living and queued pests',()=>{
 const g=meadow();g.mapId=LEGACY_MAP.id;const t=g.place('pine',0);g.upgrade(t.id);g.wave=3;g.phase='running';g.queue=['moth','beetle'];g.spawnTimer=0;const e=pos(g.spawn('termite'),g,500);
 const s=g.snapshot();delete s.mapId;const r=Game.restore(s);assert.ok(r);assert.equal(r.mapId,LEGACY_MAP.id);assert.deepEqual([r.towers[0].x,r.towers[0].y],LEGACY_MAP.pads[0]);assert.deepEqual(r.enemies,g.enemies);r.pause();r.step(.05);assert.equal(r.enemies.at(-1).mapId,undefined);
 const tree=r.tree,forest=structuredClone(r.forest);r.newRun();assert.equal(r.mapId,MEADOW_MAP.id);assert.equal(r.tree,tree);assert.deepEqual(r.forest,forest);
});
test('defeat silhouettes carry their map identity and restoration rejects unknown maps',()=>{
 const g=meadow();const e=pos(g.spawn('termite'),g,1600);g.strike(e,10000,'pine');g.resolveKills();const kill=g.events.find(e=>e.type==='kill');assert.equal(kill.mapId,MEADOW_MAP.id);const f=new CombatFeedback();f.consume([kill]);assert.equal(f.defeats[0].mapId,MEADOW_MAP.id);
 const s=g.snapshot();s.mapId='__proto__';assert.equal(Game.restore(s),null);s.mapId=MEADOW_MAP.id;s.chapter=0;assert.equal(Game.restore(s),null);
});
test('the new meadow supports Sap-only gradual expansion and broader mixed coverage',()=>{
 for(const profile of [BALANCE_PROFILES.measured,BALANCE_PROFILES.sapMixed]){
  const r=simulateDefense(1,profile);assert.equal(r.snapshot.mapId,MEADOW_MAP.id);assert.equal(r.phase,'victory');assert.equal(r.treeSpent,0);assert.ok(r.snapshot.towers.every(t=>t.level===1));
 }
 const held=simulateDefense(1,BALANCE_PROFILES.starterHeld);assert.equal(held.phase,'defeat');assert.ok(held.rows.at(-1).wave>=3);
});
