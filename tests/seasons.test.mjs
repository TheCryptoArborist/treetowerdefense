import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, eventLineup, HAUNTED_GROVE, TOWERS, ORIGINAL_GUARDIANS } from '../src/engine.js';
import { scoutWave, PurchaseReview } from '../src/playtest.js';
import { CombatFeedback, bossStatus } from '../src/combat.js';
import { MIXED_PLACEMENTS } from '../tools/balance-audit.mjs';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,0,0];g.forest.bestWaves=[10,0,0];g.forest.unlocked=[...ORIGINAL_GUARDIANS,'watchtower'];return g;};
function finish(g,wave,health=100){g.phase='running';g.wave=wave;g.health=health;g.enemies=[];g.queue=[];g.step(.05);}

test('event requires access and Emerald completion, preserves permanent progress and has no fee',()=>{
 const g=new Game(),before=g.snapshot();assert.equal(g.startEvent(),false);assert.deepEqual(g.snapshot(),before);
 g.allowPreview();assert.equal(g.startEvent(),false);g.forest.stars[0]=1;
 const forest=structuredClone(g.forest),tree=g.tree;assert.ok(g.startEvent());assert.equal(g.waveCount,5);assert.equal(g.runName,'Haunted Grove');assert.equal(g.tree,tree);assert.deepEqual(g.forest,forest);
});
test('five authored event scouts match actual queues and a single final boss',()=>{
 const g=ready();g.startEvent();
 for(let wave=1;wave<=5;wave++){
  g.phase='build';assert.ok(g.startWave());assert.deepEqual(g.queue,eventLineup(wave));
  const scout=scoutWave(g.chapter,wave,1,g.mode);assert.equal(scout.total,g.queue.length);
  for(const group of scout.groups)assert.equal(group.count,g.queue.filter(k=>k===group.kind).length);
  assert.equal(g.queue.filter(k=>k==='boss').length,wave===5?1:0);
  const f=new CombatFeedback();f.consume(g.events.filter(e=>e.type==='wave-start').slice(-1));assert.equal(f.notice.text,scout.tip);
 }
 assert.equal(g.queue.at(-1),'boss');assert.match(scoutWave(0,5,1,g.mode).groups.at(-1).name,/Hollow King/);
 g.phase='build';assert.equal(g.startWave(),false);assert.deepEqual(eventLineup(6),[]);
});
test('event progress never adds campaign stars, chapter unlocks or combat roster',()=>{
 const g=ready();g.startEvent();const forest=structuredClone(g.forest);finish(g,4);assert.equal(g.season.bestWave,4);assert.deepEqual(g.seasonRewards,[]);
 finish(g,5,75);assert.equal(g.phase,'victory');assert.deepEqual(g.forest,forest);assert.deepEqual(g.seasonRewards,['grove-badge']);
 assert.equal(g.setSeasonLook('oak',true),false);
});
test('mastery and team cosmetics award once; different types must actually be planted',()=>{
 const g=ready();g.startEvent();g.sap=500;const oak=g.place('oak',0);g.place('pine',1);g.place('palm',2);g.sell(oak.id);
 assert.equal(g.eventTeam.length,3);finish(g,5,80);assert.deepEqual(g.seasonRewards,HAUNTED_GROVE.rewards);assert.equal(g.events.filter(e=>e.type==='season-reward').length,3);
 g.events=[];g.newRun();assert.deepEqual(g.eventTeam,[]);finish(g,5,100);assert.equal(g.events.filter(e=>e.type==='season-reward').length,0);
 assert.ok(g.season.teamClear);assert.equal(g.season.bestHealth,100);
});
test('rarity-independent seasonal looks persist, cost nothing and never modify combat',()=>{
 for(let rarity=0;rarity<6;rarity++){
  const g=ready();g.allowPreview(rarity);g.startEvent();g.sap=600;for(const[type,pad]of [['oak',0],['pine',1],['watchtower',2]])g.place(type,pad);finish(g,5,100);
  const funds=[g.tree,g.sap],towers=structuredClone(g.towers);assert.ok(g.setSeasonLook('oak',true));assert.ok(g.setSeasonLook('watchtower',true));assert.deepEqual(g.towers,towers);assert.deepEqual([g.tree,g.sap],funds);
  const r=Game.restore(g.snapshot());assert.deepEqual(r.season,g.season);assert.deepEqual(r.seasonLooks,g.seasonLooks);r.chooseChapter(1);assert.equal(r.isEvent,false);assert.equal(r.waveCount,10);assert.ok(r.seasonLooks.oak);assert.equal(r.place('oak',0).level,1);
 }
});
test('saved event retains version, queue, timers, used types, targeting and growth through continue',()=>{
 const g=ready();g.startEvent();const t=g.place('pine',0);g.upgrade(t.id);g.setTargetMode(t.id,'fastest');g.wave=3;g.phase='running';g.queue=['moth','termite'];g.spawnTimer=.8;const e=g.spawn('moth');e.progress=100;
 const r=Game.restore(g.snapshot());assert.equal(r.phase,'paused');assert.equal(r.isEvent,true);assert.equal(r.eventVersion,1);assert.deepEqual(r.queue,g.queue);assert.equal(r.enemies[0].bornAt,e.bornAt);assert.deepEqual(r.eventTeam,['pine']);assert.equal(r.towers[0].targetMode,'fastest');assert.equal(r.towers[0].level,2);
 r.phase='defeat';const q=new PurchaseReview(r,'continue');assert.ok(q.confirm());assert.equal(r.isEvent,true);assert.deepEqual(r.queue,g.queue);assert.equal(r.wave,3);assert.equal(r.towers[0].level,2);
});
test('older campaign saves default seasonal fields without discarding active battles',()=>{
 const g=ready();g.place('pine',0);g.startWave();g.step(.05);const s=g.snapshot();for(const key of ['mode','season','seasonLooks','eventTeam','eventVersion'])delete s[key];
 const r=Game.restore(s);assert.ok(r);assert.equal(r.mode,'campaign');assert.equal(r.waveCount,10);assert.deepEqual(r.seasonRewards,[]);assert.deepEqual(r.queue,s.queue);assert.deepEqual(r.forest,s.forest);assert.equal(r.tree,s.tree);
});
test('bad optional collection values fall back; unsupported active event rules are rejected',()=>{
 const g=ready();const s=g.snapshot();s.season={bestWave:99,bestHealth:Infinity,teamClear:true};s.seasonLooks={oak:true,watchtower:true};const r=Game.restore(s);assert.ok(r);assert.deepEqual(r.seasonRewards,[]);assert.equal(r.seasonLooks.oak,false);
 g.startEvent();const event=g.snapshot();event.eventVersion=2;assert.equal(Game.restore(event),null);event.eventVersion=1;event.wave=6;assert.equal(Game.restore(event),null);
});
test('Hollow King arrival, health and kill feedback use the seasonal identity',()=>{
 const g=ready();g.startEvent();g.wave=5;g.phase='running';const boss=g.spawn('boss');assert.equal(boss.maxHp,1200);assert.equal(boss.theme,'haunted-grove');assert.equal(bossStatus(g).state,'present');
 const f=new CombatFeedback();f.consume(g.events);assert.match(f.notice.title,/HOLLOW KING/);g.events=[];g.strike(boss,1200,'pine');g.resolveKills();f.consume(g.events);assert.match(f.notice.title,/HOLLOW KING FALLS/);
});
test('all seasonal goals can be earned with milestone roster, Saplings and no TREE purchases',()=>{
 const g=ready();g.startEvent();const tree=g.tree,forest=structuredClone(g.forest);
 for(let wave=1;wave<=5;wave++){
  for(const[type,pad]of MIXED_PLACEMENTS)if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);
  assert.ok(g.startWave());let steps=0;while(g.phase==='running'&&steps++<15000){g.step(.05);g.events=[];}assert.ok(steps<15000);assert.notEqual(g.phase,'defeat',`wave ${wave}`);
 }
 assert.equal(g.phase,'victory');assert.ok(g.health>=80,`final health ${g.health}`);assert.deepEqual(g.seasonRewards,HAUNTED_GROVE.rewards);assert.equal(g.tree,tree);assert.deepEqual(g.forest,forest);assert.ok(g.towers.every(t=>t.level===1));
 console.log(`Haunted Grove Sap-only completion: ${g.health} life, ${g.towers.length} defenders, ${g.eventTeam.length} species, 0 TREE spent.`);
});
