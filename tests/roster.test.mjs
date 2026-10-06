import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, ORIGINAL_GUARDIANS, pointAt } from '../src/engine.js';
import { GuardianAiming } from '../src/aiming.js';
import { CombatFeedback } from '../src/combat.js';
import { MIXED_PLACEMENTS } from '../tools/balance-audit.mjs';

const preview = () => { const game=new Game(); game.allowPreview(); return game; };
function finish(game,wave,health=100) {
  game.phase='running';game.wave=wave;game.health=health;game.enemies=[];game.queue=[];game.step(.05);
}
function enemyAt(game,kind,progress,hp=500) {
  const enemy=game.spawn(kind);Object.assign(enemy,{progress,hp,maxHp:hp},pointAt(progress));return enemy;
}

test('new players start with two guardians; rarity never buys a locked combat role', () => {
  for(let rarity=0;rarity<6;rarity++) {
    const game=preview();game.allowPreview(rarity);assert.deepEqual(game.forest.unlocked,['oak','pine']);
    for(const type of ['palm','cypress','mushroom','willow','watchtower','cannon']) {
      const funds=[game.sap,game.tree];assert.equal(game.place(type,0),false);
      assert.deepEqual([game.sap,game.tree],funds);assert.equal(game.towers.length,0);
    }
    assert.ok(game.place('oak',0));assert.ok(game.place('pine',1));
  }
});

test('specialists are earned once at cleared-wave milestones, never at wave start or defeat', () => {
  const game=preview();finish(game,1);game.startWave();assert.equal(game.isUnlocked('palm'),false);
  game.phase='defeat';game.health=0;game.continueRun();assert.equal(game.isUnlocked('palm'),false);
  for(const [wave,type] of [[2,'palm'],[4,'cypress'],[6,'mushroom']]) {
    const tree=game.tree;game.events=[];finish(game,wave);
    assert.ok(game.isUnlocked(type));assert.equal(game.tree,tree);assert.equal(game.forest.bestWaves[0],wave);
    const unlock=game.events.find(e=>e.type==='roster-unlock');assert.equal(unlock.defender,type);
    const feedback=new CombatFeedback();feedback.consume(game.events);assert.match(feedback.notice.title,/UNLOCKED/);
    const sap=game.sap,tower=game.place(type,game.towers.length);assert.ok(tower);assert.equal(game.sap,sap-TOWERS[type].cost);
    game.events=[];game.refreshUnlocks();assert.equal(game.events.length,0);
  }
});

test('chapter victories and best star totals unlock structures and Willow permanently', () => {
  const game=preview();finish(game,10,20);assert.ok(game.isUnlocked('watchtower'));assert.equal(game.isUnlocked('willow'),false);
  assert.equal(game.isUnlocked('cannon'),false);game.newRun();finish(game,10,80);
  assert.deepEqual(game.forest.stars,[3,0,0]);assert.equal(game.isUnlocked('willow'),false);
  game.chooseChapter(1);finish(game,10,20);assert.deepEqual(game.forest.stars,[3,1,0]);
  assert.ok(game.isUnlocked('willow'));assert.ok(game.isUnlocked('cannon'));
  game.chooseChapter(0);finish(game,10,20);assert.deepEqual(game.forest.stars,[3,1,0]);
  const earned=[...game.forest.unlocked];game.newRun();assert.deepEqual(game.forest.unlocked,earned);
  game.allowPreview(5);assert.deepEqual(game.forest.unlocked,earned);
});

test('new roster saves keep partial milestones, paid growth, orders and unlocks across resume and continue', () => {
  const game=preview();finish(game,2);const tower=game.place('palm',0);game.upgrade(tower.id);game.setTargetMode(tower.id,'fastest');
  game.startWave();game.step(.05);const saved=game.snapshot(),restored=Game.restore(saved);
  assert.ok(restored);assert.equal(restored.phase,'paused');assert.deepEqual(restored.forest,game.forest);
  assert.equal(restored.tree,game.tree);assert.equal(restored.towers[0].targetMode,'fastest');assert.deepEqual(restored.queue,game.queue);
  assert.equal(restored.isUnlocked('cypress'),false);restored.phase='defeat';restored.health=0;assert.ok(restored.continueRun());
  restored.newRun();assert.equal(restored.place('palm',0).level,2);assert.equal(restored.forest.bestWaves[0],2);
  assert.equal(restored.isUnlocked('watchtower'),false);
});

test('original v1 and v2 previews keep all originals, active defenders, purchases and funds', () => {
  for(const version of [1,2]) {
    const game=preview();game.forest.unlocked=[...ORIGINAL_GUARDIANS];game.place('cypress',0);game.upgrade(game.towers[0].id);game.wave=5;game.phase='running';
    game.queue=['beetle','moth'];enemyAt(game,'beetle',200);game.tree=43210;
    const saved=game.snapshot();saved.version=version;
    if(version===1){delete saved.forest;delete saved.chapter;}else{
      delete saved.forest.rosterVersion;delete saved.forest.bestWaves;delete saved.forest.unlocked;
      for(const type of ['willow','watchtower','cannon'])delete saved.forest.levels[type];
    }
    const original=structuredClone(saved),restored=Game.restore(saved);assert.ok(restored);
    for(const type of ORIGINAL_GUARDIANS)assert.ok(restored.isUnlocked(type));
    assert.equal(restored.isUnlocked('willow'),false);assert.equal(restored.isUnlocked('watchtower'),false);
    assert.equal(restored.forest.bestWaves[0],4);assert.equal(restored.forest.levels.cypress,2);assert.equal(restored.tree,43210);
    assert.deepEqual(restored.queue,saved.queue);assert.equal(restored.enemies[0].hp,saved.enemies[0].hp);assert.deepEqual(saved,original);
  }
});

test('optional edited progress falls back safely without losing active or purchased defenders', () => {
  const game=preview();game.forest.unlocked.push('willow');const tower=game.place('willow',0);game.upgrade(tower.id);
  const saved=game.snapshot();saved.forest.unlocked=['bogus','__proto__',{},null];saved.forest.bestWaves=[-1,99,'10'];
  const restored=Game.restore(saved);assert.ok(restored);assert.ok(restored.isUnlocked('willow'));
  assert.equal(restored.forest.levels.willow,2);assert.deepEqual(restored.forest.bestWaves,[0,0,0]);assert.equal(restored.isUnlocked('palm'),false);
  assert.equal(restored.unlockStatus('__proto__'),null);assert.equal(restored.isUnlocked('__proto__'),false);
});

test('Willow chains to two unique nearby living pests with armor applied to each hit', () => {
  const game=preview();game.forest.unlocked.push('willow');game.place('willow',0);game.phase='running';game.wave=1;game.queue=['termite'];game.spawnTimer=100;
  const primary=enemyAt(game,'termite',250,1),second=enemyAt(game,'beetle',185),third=enemyAt(game,'termite',100),outside=enemyAt(game,'termite',0);
  game.events=[];game.step(.05);const hits=game.events.filter(e=>e.type==='hit'),chains=game.events.filter(e=>e.type==='chain');
  assert.deepEqual(hits.map(e=>e.id),[primary.id,second.id,third.id]);assert.equal(hits[0].damage,1);
  assert.equal(hits[1].damage,30*.65*.8);assert.equal(hits[2].damage,30*.4);assert.equal(outside.hp,500);assert.equal(chains.length,2);
  assert.equal(game.kills,1);const aiming=new GuardianAiming();aiming.consume(game.events);
  assert.equal(aiming.shots.length,3);assert.equal(aiming.pose(game.towers[0].id).targetId,primary.id);
  assert.deepEqual(aiming.shots[1].origin,{x:chains[0].x,y:chains[0].y});
});

test('Watchtower range and armor bypass differ from Cannon splash; both keep normal orders and TREE growth', () => {
  for(const type of ['watchtower','cannon']) {
    const game=preview();game.forest.unlocked.push(type);const tower=game.place(type,0);const planting=game.sap;
    assert.equal(game.tree,150000);assert.ok(game.upgrade(tower.id));assert.equal(game.tree,145000);
    game.phase='running';game.wave=1;game.queue=['termite'];game.spawnTimer=100;
    const primary=enemyAt(game,'beetle',220),near=enemyAt(game,'termite',180),outside=enemyAt(game,'termite',10);
    game.events=[];game.step(.05);const hits=game.events.filter(e=>e.type==='hit');
    assert.equal(hits[0].id,primary.id);assert.equal(hits[0].damage,TOWERS[type].damage*1.6*(type==='watchtower'?1:.8));
    if(type==='cannon'){assert.equal(hits[1].id,near.id);assert.equal(hits[1].damage,66*1.6*.7);assert.equal(outside.hp,500);}else assert.equal(hits.length,1);
    assert.equal(game.sap,planting);assert.equal(tower.cooldown,TOWERS[type].interval);
    const tree=game.tree;game.newRun();assert.equal(game.place(type,0).level,2);assert.equal(game.tree,tree);
  }
  assert.ok(TOWERS.watchtower.range>TOWERS.cypress.range);assert.ok(TOWERS.cannon.interval>TOWERS.oak.interval);
});

test('a fresh earned roster can protect all chapters using Sap only and reach every unlock', () => {
  const game=preview();const tree=game.tree;
  for(let chapter=0;chapter<3;chapter++) {
    if(chapter)assert.ok(game.chooseChapter(chapter));
    for(let wave=1;wave<=10;wave++) {
      for(const[type,pad]of MIXED_PLACEMENTS)if(!game.towers.some(t=>t.pad===pad))game.place(type,pad);
      assert.ok(game.startWave());let steps=0;
      while(game.phase==='running'&&steps++<15000){game.step(.05);game.events=[];}
      assert.notEqual(game.phase,'defeat',`chapter ${chapter}, wave ${wave}`);assert.ok(steps<15000);
    }
    assert.equal(game.phase,'victory');assert.equal(game.tree,tree);
  }
  for(const type of Object.keys(TOWERS))assert.ok(game.isUnlocked(type));
  assert.ok(game.towers.every(t=>t.level===1));assert.ok(game.health>0);
});
