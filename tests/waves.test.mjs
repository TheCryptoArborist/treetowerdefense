import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, waveLineup, waveSpawnInterval, CHAPTERS } from '../src/engine.js';
import { scoutWave } from '../src/playtest.js';
import { CombatFeedback } from '../src/combat.js';
import { simulateDefense, BALANCE_PROFILES } from '../tools/balance-audit.mjs';

const preview=()=>{const game=new Game();game.allowPreview();return game;};

test('opening waves introduce armor, speed, and blight before the combined fifth wave', () => {
  for(let chapter=0;chapter<CHAPTERS.length;chapter++) {
    assert.deepEqual([...new Set(waveLineup(chapter,1))],['termite']);
    assert.ok(waveLineup(chapter,2).includes('beetle')); assert.ok(!waveLineup(chapter,2).includes('moth'));
    assert.ok(waveLineup(chapter,3).includes('moth')); assert.ok(!waveLineup(chapter,3).includes('blight'));
    assert.ok(waveLineup(chapter,4).includes('blight'));
    assert.deepEqual([...new Set(waveLineup(chapter,5))].sort(),['beetle','blight','moth','termite']);
    const queue=waveLineup(chapter,4);assert.ok(queue.indexOf('blight')<queue.length/2);
  }
});

test('threat health grows each wave while spawn gaps narrow after the armor introduction', () => {
  for(let chapter=0;chapter<CHAPTERS.length;chapter++) {
    const game=preview();game.chapter=chapter;let lastHealth=0;
    for(let wave=1;wave<=10;wave++) {
      game.wave=wave;game.enemies=[];
      const health=waveLineup(chapter,wave).reduce((total,kind)=>total+game.spawn(kind).maxHp,0);
      assert.ok(health>lastHealth);lastHealth=health;
      if(wave>=3)assert.ok(waveSpawnInterval(wave)<waveSpawnInterval(wave-1));
    }
  }
  for(const wave of [0,11,NaN,2.5])assert.equal(waveSpawnInterval(wave),null);
});

test('the armor introduction leaves the Sapling starter alive without a new opening spike', () => {
  const result=simulateDefense(0,BALANCE_PROFILES.starterHeld);
  assert.equal(result.rows[0].health,100);
  assert.ok(result.rows[1].health>=80);assert.ok(result.rows[1].health<100);
  assert.equal(result.treeSpent,0);
});

test('measured Sap expansion protects chapter one while an unchanged starter loses later', () => {
  const held=simulateDefense(0,BALANCE_PROFILES.starterHeld),expanded=simulateDefense(0,BALANCE_PROFILES.measured);
  assert.equal(held.phase,'defeat');assert.ok(held.rows.at(-1).wave>=3);
  assert.equal(expanded.phase,'victory');assert.equal(expanded.health,100);assert.equal(expanded.treeSpent,0);
  assert.equal(expanded.snapshot.towers.length,11);
  assert.ok(expanded.snapshot.towers.every(t=>t.level===1));
});

test('all three campaigns are winnable with mixed Sap coverage and no TREE purchases', () => {
  for(let chapter=0;chapter<CHAPTERS.length;chapter++) {
    const result=simulateDefense(chapter,BALANCE_PROFILES.sapMixed);
    assert.equal(result.phase,'victory',CHAPTERS[chapter].name);assert.equal(result.treeSpent,0);
    assert.ok(result.snapshot.towers.every(t=>t.level===1));assert.ok(result.snapshot.forest.stars[chapter]>0);
  }
});

test('changed future mixes preserve a saved old queue, living pests, balance, and growth', () => {
  const game=preview(),tower=game.place('pine',0);game.upgrade(tower.id);game.wave=3;game.phase='running';
  game.queue=['beetle','termite','moth','termite','termite'];game.spawnTimer=.8;
  const enemy=game.spawn('beetle');enemy.progress=100;enemy.hp/=2;game.tree=70000;
  const saved=game.snapshot(),restored=Game.restore(saved);assert.ok(restored);assert.equal(restored.phase,'paused');
  assert.deepEqual(restored.queue,saved.queue);assert.equal(restored.spawnTimer,saved.spawnTimer);
  assert.equal(restored.enemies[0].hp,enemy.hp);assert.equal(restored.enemies[0].speed,enemy.speed);
  assert.equal(restored.tree,70000);assert.equal(restored.towers[0].level,2);assert.deepEqual(restored.forest,saved.forest);
  const frozen=restored.snapshot();restored.step(.05);assert.deepEqual(restored.snapshot(),frozen);
});

test('scouting and wave-start notices identify each threat and give stage-specific guidance', () => {
  const titles=new Set();
  for(let wave=1;wave<=10;wave++) {
    const scout=scoutWave(0,wave);assert.ok(scout.title);assert.ok(scout.tip);titles.add(scout.title);
    const feedback=new CombatFeedback();feedback.consume([{type:'wave-start',wave,chapter:0}]);
    assert.equal(feedback.notice.text,scout.tip);
    if(wave<10)assert.ok(feedback.notice.title.includes(scout.title.toUpperCase()));
  }
  assert.equal(titles.size,10);assert.match(scoutWave(0,2).tip,/beetles/);assert.match(scoutWave(0,3).tip,/moths/);
  assert.match(scoutWave(0,4).tip,/blight/);assert.equal(scoutWave(0,11).title,'');assert.equal(scoutWave(0,11).tip,'');
  const game=preview();game.startWave();assert.equal(game.events[0].chapter,game.chapter);
});
