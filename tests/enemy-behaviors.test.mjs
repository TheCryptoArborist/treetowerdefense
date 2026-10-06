import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, enemySpeed, mothDashing, blightHealing, pointAt } from '../src/engine.js';
import { scoutWave } from '../src/playtest.js';
import { CombatFeedback } from '../src/combat.js';

function battle(kind) {
  const game=new Game();game.allowPreview();game.wave=4;game.phase='running';game.queue=['termite'];game.spawnTimer=100;
  const enemy=game.spawn(kind);return {game,enemy};
}
test('moth bursts use battle age and respect slows; actual movement and Fastest share speed',()=>{
  const {game,enemy}=battle('moth');
  assert.equal(enemySpeed(enemy,0),160);assert.equal(mothDashing(enemy,1.99),false);
  assert.equal(enemySpeed(enemy,2),192);assert.equal(enemySpeed(enemy,2.65),160);assert.equal(enemySpeed(enemy,6),192);
  enemy.slowUntil=8;assert.equal(enemySpeed(enemy,2),192*.55);
  game.time=2;enemy.progress=100;Object.assign(enemy,pointAt(100));game.step(.05);
  assert.ok(Math.abs(enemy.progress-(100+192*.55*.05))<1e-9);
  const tower=game.place('pine',0);tower.targetMode='fastest';
  const other=game.spawn('termite');Object.assign(other,{x:enemy.x,y:enemy.y,speed:110});
  assert.equal(game.targetsFor(tower)[0].id,other.id);
  enemy.slowUntil=0;assert.equal(game.targetsFor(tower)[0].id,enemy.id);
});
test('blight recovery is capped, delayed by real hits, and suppressed throughout poison',()=>{
  const {game,enemy}=battle('blight');game.strike(enemy,30,'pine');
  assert.equal(blightHealing(enemy,1.99),false);assert.equal(blightHealing(enemy,2),true);
  game.time=2;const hp=enemy.hp;game.step(.05);assert.ok(enemy.hp>hp);
  game.strike(enemy,1,'pine');assert.equal(enemy.recoverAt,game.time+2);assert.equal(blightHealing(enemy,game.time),false);
  enemy.recoverAt=0;enemy.poisonUntil=game.time+1;enemy.poisonDamage=14;
  const poisoned=enemy.hp;game.step(.05);assert.ok(Math.abs(enemy.hp-(poisoned-.7))<1e-9);
  enemy.poisonUntil=0;enemy.hp=enemy.maxHp-.00001;game.step(.05);assert.equal(enemy.hp,enemy.maxHp);
  enemy.hp=0;assert.equal(blightHealing(enemy,game.time),false);
});
test('Mushroom applies the suppression and Palm applies a working snare during a dash',()=>{
  for(const type of ['mushroom','palm']){
    const {game,enemy}=battle(type==='palm'?'moth':'blight');game.forest.unlocked.push(type);
    game.time=2;enemy.progress=100;Object.assign(enemy,pointAt(100));enemy.hp/=2;enemy.recoverAt=0;
    game.place(type,0);game.step(.05);
    if(type==='palm'){assert.ok(enemy.slowUntil>game.time);assert.equal(enemySpeed(enemy,game.time),192*.55);}
    else {assert.ok(enemy.poisonUntil>game.time);assert.equal(blightHealing(enemy,game.time),false);}
  }
});
test('pause and reload freeze traits and resume the same burst and recovery timers',()=>{
  const {game,enemy}=battle('moth');game.time=2.2;const blight=game.spawn('blight');blight.hp/=2;game.strike(blight,1,'pine');
  game.pause();const saved=game.snapshot();game.step(.05);assert.deepEqual(game.snapshot(),saved);
  const restored=Game.restore(saved);assert.deepEqual(restored.enemies,game.enemies);assert.equal(mothDashing(restored.enemies[0],restored.time),true);
  restored.pause();restored.step(.05);assert.ok(restored.enemies[0].progress>enemy.progress);
});
test('pre-trait saves keep old living and queued enemies until a fresh run',()=>{
  const {game}=battle('moth');game.queue=['moth','blight'];const saved=game.snapshot();delete saved.enemyRules;
  for(const e of saved.enemies){delete e.behavior;delete e.bornAt;delete e.recoverAt;}
  const restored=Game.restore(saved);assert.ok(restored);assert.equal(restored.enemyRules,0);
  restored.time=2;assert.equal(enemySpeed(restored.enemies[0],2),160);restored.pause();restored.spawnTimer=0;restored.step(.05);
  assert.equal(restored.enemies.at(-1).behavior,undefined);assert.deepEqual(restored.queue,['blight']);
  const funds=restored.tree,forest=structuredClone(restored.forest);restored.newRun();assert.equal(restored.enemyRules,1);
  assert.equal(restored.tree,funds);assert.deepEqual(restored.forest,forest);assert.equal(restored.spawn('moth').behavior,1);
});
test('invalid optional timers fall back without discarding purchased growth or funds',()=>{
  const {game}=battle('blight');const tower=game.place('pine',0);game.upgrade(tower.id);
  const saved=game.snapshot();saved.enemies[0].bornAt='bad';saved.enemies[0].recoverAt=-5;
  const restored=Game.restore(saved);assert.ok(restored);assert.equal(restored.enemies[0].behavior,undefined);
  assert.equal(restored.tree,game.tree);assert.equal(restored.towers[0].level,2);
});
test('scouting and battle notices explain current rules, including legacy runs',()=>{
  const scout=scoutWave(0,4);assert.match(scout.groups.find(e=>e.kind==='moth').counter,/20%/);
  assert.match(scout.groups.find(e=>e.kind==='blight').counter,/poison suppresses/);
  const legacy=scoutWave(0,4,0);assert.match(legacy.tip,/original pest rules/);
  assert.equal(legacy.groups.find(e=>e.kind==='blight').trait,'Extra health');
  const feedback=new CombatFeedback();feedback.consume([{type:'wave-start',wave:4,chapter:0,enemyRules:0}]);assert.equal(feedback.notice.text,legacy.tip);
});
