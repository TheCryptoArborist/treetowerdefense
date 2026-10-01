import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, PADS, RARITIES, PRICES, pointAt, PATH, PATH_LENGTH } from '../src/engine.js';

const preview = rarity => { const g = new Game(); g.allowPreview(rarity ?? 0); return g; };
function playWave(g) {
  assert.equal(g.startWave(), true);
  for (let i = 0; i < 10000 && g.phase === 'running'; i++) g.step(.05);
  assert.notEqual(g.phase, 'running', 'Wave must finish without freezing');
}
test('NFTree preview access gates gameplay and TREE spending', () => {
  const g = new Game(); assert.equal(g.place('pine', 0), false); assert.equal(g.startWave(), false); assert.equal(g.supply('shield'), false); assert.equal(g.tree, 150000);
  assert.equal(g.allowPreview(8), false); assert.equal(g.allowPreview(0), true); assert.ok(g.place('pine', 0));
});
test('planting spends Sap; invalid/occupied sites do not charge', () => {
  const g = preview(); assert.ok(g.place('pine', 0)); assert.equal(g.sap, 220); assert.equal(g.tree, 150000);
  assert.equal(g.place('pine', 0), false); assert.equal(g.place('pine', -1), false); assert.equal(g.place('bogus', 1), false); assert.equal(g.place('pine', .5), false); assert.equal(g.sap, 220);
});
test('rarity unlocks cumulative appearances and leaves combat statistics unchanged', () => {
  for (let rarity = 0; rarity < RARITIES.length; rarity++) {
    const g = preview(rarity); const tower = g.place('pine', 0);
    for (let style = 0; style < RARITIES.length; style++) assert.equal(g.setStyle(style, tower.id), style <= rarity);
    assert.equal(tower.level, 1); assert.equal(g.tree, 150000); assert.equal(TOWERS[tower.type].damage, 18);
  }
  const g = preview(5); g.setStyle(5); const t = g.place('oak', 0); g.allowPreview(0); assert.equal(t.style, 0); assert.equal(g.style, 0);
});
test('upgrades debit simulated TREE once and enforce the level cap', () => {
  const g = preview(); const t = g.place('pine', 0); assert.equal(g.upgrade(t.id), true); assert.equal(g.tree, 145000);
  assert.equal(g.upgrade(t.id), true); assert.equal(g.tree, 135000); assert.equal(g.upgrade(t.id), false); assert.equal(t.level, 3); assert.equal(g.tree, 135000);
  const t2 = g.place('oak', 1); g.tree = 4999; assert.equal(g.upgrade(t2.id), false); assert.equal(g.tree, 4999); assert.equal(t2.level, 1);
});
test('shield and fertilizer cannot charge twice while already active', () => {
  const g = preview(); assert.equal(g.supply('shield'), true); assert.equal(g.shield, 50); assert.equal(g.tree, 147000); assert.equal(g.supply('shield'), false); assert.equal(g.tree, 147000);
  assert.equal(g.supply('fertilizer'), true); assert.equal(g.tree, 142000); assert.equal(g.supply('fertilizer'), false); assert.equal(g.tree, 142000);
  assert.equal(g.supply('storm'), false); assert.equal(g.tree, 142000);
});
test('Leaf Storm charges only during battle and resolves kills once', () => {
  const g = preview(); g.startWave(); g.spawn('termite'); assert.equal(g.supply('storm'), true); assert.equal(g.tree, 142000); assert.equal(g.kills, 1); assert.equal(g.score, 100);
  g.resolveKills(); assert.equal(g.kills, 1); assert.equal(g.supply('storm'), false); assert.equal(g.tree, 142000);
});
test('pause freezes movement and resumes the same wave', () => {
  const g = preview(); g.startWave(); g.step(.05); const progress = g.enemies[0].progress; const timer = g.time;
  assert.equal(g.pause(), true); g.step(.05); assert.equal(g.enemies[0].progress, progress); assert.equal(g.time, timer); assert.equal(g.startWave(), false);
  g.pause(); g.step(.05); assert.ok(g.enemies[0].progress > progress); assert.equal(g.wave, 1);
});
test('undefended runs reach defeat; continue preserves towers, queue, and wave', () => {
  const g = preview(); playWave(g); assert.equal(g.phase, 'build'); assert.equal(g.health, 4); playWave(g); assert.equal(g.phase, 'defeat');
  const wave = g.wave, queue = [...g.queue], towerCount = g.towers.length, enemies = g.enemies.length;
  assert.equal(g.continueRun(), true); assert.equal(g.tree, 130000); assert.equal(g.health, 100); assert.equal(g.phase, 'running'); assert.equal(g.wave, wave); assert.deepEqual(g.queue, queue); assert.equal(g.towers.length, towerCount); assert.equal(g.enemies.length, enemies);
  assert.equal(g.continueRun(), false); assert.equal(g.tree, 130000);
});
test('insufficient TREE cannot grant a continue', () => {
  const g = preview(); g.phase = 'defeat'; g.health = 0; g.tree = PRICES.continue - 1;
  assert.equal(g.continueRun(), false); assert.equal(g.phase, 'defeat'); assert.equal(g.health, 0);
});
test('new run is included with access and never debits/refills TREE', () => {
  const g = preview(4); g.place('oak', 0); g.upgrade(g.towers[0].id); const balance = g.tree;
  g.newRun(); assert.equal(g.tree, balance); assert.equal(g.rarity, 4); assert.equal(g.access, true); assert.equal(g.wave, 0); assert.equal(g.towers.length, 0); assert.equal(g.health, 100);
});
test('snapshot restores owned preview styles, purchases, towers and wave, safely paused', () => {
  const g = preview(5); g.setStyle(4); const t = g.place('oak', 0); g.upgrade(t.id); g.startWave(); g.step(.05);
  const restored = Game.restore(JSON.parse(JSON.stringify(g.snapshot()))); assert.ok(restored); assert.equal(restored.phase, 'paused'); assert.equal(restored.tree, 145000); assert.equal(restored.towers[0].level, 2); assert.equal(restored.towers[0].style, 4); assert.equal(restored.wave, 1); assert.equal(restored.enemies.length, 1);
  const corrupted = g.snapshot(); corrupted.tree = -1; assert.equal(Game.restore(corrupted), null);
  const duplicate = g.snapshot(); duplicate.towers.push({ ...duplicate.towers[0] }); assert.equal(Game.restore(duplicate), null);
  const badType = g.snapshot(); badType.towers[0].type = 'unknown'; assert.equal(Game.restore(badType), null);
  assert.equal(Game.restore({}), null);
});
test('path begins and ends at the correct points', () => {
  assert.deepEqual(pointAt(0), { x: PATH[0][0], y: PATH[0][1] }); assert.deepEqual(pointAt(PATH_LENGTH), { x: 940, y: 640 });
});
test('complete ten-wave campaign reaches victory, including the boss', () => {
  const g = preview(5);
  const order = [0, 1, 2, 4, 5, 6, 11, 8, 7, 9, 10, 3];
  for (let wave = 1; wave <= 10; wave++) {
    for (const pad of order) if (!g.towers.some(t => t.pad === pad) && g.sap >= TOWERS.pine.cost) g.place('pine', pad);
    for (const tower of g.towers) while (tower.level < 3 && g.tree >= g.upgradeCost(tower)) g.upgrade(tower.id);
    playWave(g); assert.notEqual(g.phase, 'defeat', `Reasonable placement should survive wave ${wave}`);
  }
  assert.equal(g.phase, 'victory'); assert.equal(g.wave, 10); assert.ok(g.kills >= 161); assert.ok(g.score >= 1000); assert.equal(g.startWave(), false); assert.equal(g.shots.length, 0);
});
test('appearance tier has identical simulated battle outcomes', () => {
  const a = preview(0), b = preview(5); b.setStyle(5);
  for (const g of [a, b]) { for (const pad of [0, 1, 2]) g.place('pine', pad); g.startWave(); }
  for (let i = 0; i < 2500; i++) { a.step(.05); b.step(.05); }
  assert.equal(a.health, b.health); assert.equal(a.score, b.score); assert.equal(a.sap, b.sap); assert.equal(a.kills, b.kills);
});

test('species growth upgrades existing and future defenders permanently for one charge', () => {
  const g=preview();const a=g.place('pine',0), b=g.place('pine',1), oak=g.place('oak',2);
  assert.equal(g.upgrade(a.id),true);assert.equal(a.level,2);assert.equal(b.level,2);assert.equal(oak.level,1);assert.equal(g.tree,145000);
  assert.equal(g.forest.levels.pine,2);const balance=g.tree;g.sell(b.id);g.newRun();
  const fresh=g.place('pine',0);assert.equal(fresh.level,2);assert.equal(g.tree,balance);assert.equal(g.upgrade(fresh.id),true);assert.equal(g.tree,balance-10000);
  assert.equal(Game.restore(g.snapshot()).forest.levels.pine,3);
});
test('chapters unlock in order; repeated wins improve stars without erasing progress', () => {
  const g=preview();assert.equal(g.chooseChapter(1),false);assert.equal(g.chapter,0);assert.equal(g.tree,150000);
  function finish(health){g.wave=10;g.phase='running';g.queue=[];g.enemies=[];g.health=health;g.step(.05);assert.equal(g.phase,'victory');}
  finish(39);assert.deepEqual(g.forest.stars,[1,0,0]);assert.equal(g.forestRank,1);assert.equal(g.unlockedChapter,1);
  g.newRun();finish(80);assert.deepEqual(g.forest.stars,[3,0,0]);
  assert.equal(g.chooseChapter(1),true);finish(40);assert.deepEqual(g.forest.stars,[3,2,0]);assert.equal(g.forestRank,2);
  assert.equal(g.chooseChapter(2),true);finish(95);assert.deepEqual(g.forest.stars,[3,2,3]);assert.equal(g.forestRank,3);assert.equal(g.unlockedChapter,2);
  assert.equal(g.chooseChapter(3),false);assert.equal(g.tree,150000);assert.equal(g.chooseChapter(0),true);finish(20);assert.deepEqual(g.forest.stars,[3,2,3]);
  const restored=Game.restore(g.snapshot());assert.equal(restored.forestRank,3);assert.deepEqual(restored.forest.stars,[3,2,3]);
});
test('old preview saves migrate purchased growth and ownership without resetting funds', () => {
  const g=preview(4);const a=g.place('pine',0);g.upgrade(a.id);const old=g.snapshot();old.version=1;delete old.forest;delete old.chapter;
  old.towers.push({...a,id:99,pad:1,level:1});
  const migrated=Game.restore(old);assert.ok(migrated);assert.equal(migrated.version,2);assert.equal(migrated.tree,145000);assert.equal(migrated.access,true);assert.equal(migrated.rarity,4);
  assert.equal(migrated.forest.levels.pine,2);assert.equal(migrated.towers[1].level,2);
  migrated.newRun();assert.equal(migrated.place('pine',0).level,2);
});
test('invalid forest saves cannot select locked chapters or invalid growth', () => {
  const g=preview();const invalid=g.snapshot();invalid.forest.levels.pine=4;assert.equal(Game.restore(invalid),null);
  const locked=g.snapshot();locked.chapter=2;assert.equal(Game.restore(locked),null);
  const gap=g.snapshot();gap.forest.stars=[0,3,0];assert.equal(Game.restore(gap),null);
  const inconsistent=g.snapshot();g.place('pine',0);inconsistent.towers=g.snapshot().towers;inconsistent.towers[0].level=3;assert.equal(Game.restore(inconsistent),null);
});
test('three increasingly difficult chapters are playable with carried species growth', () => {
  const g=preview(5);const order=[0,1,2,4,5,6,11,8,7,9,10,3];
  for(let chapter=0;chapter<3;chapter++){
    assert.equal(g.chooseChapter(chapter),true);
    for(let wave=1;wave<=10;wave++){
      for(const pad of order)if(!g.towers.some(t=>t.pad===pad)&&g.sap>=TOWERS.pine.cost)g.place('pine',pad);
      for(const tower of g.towers)while(tower.level<3&&g.tree>=g.upgradeCost(tower))g.upgrade(tower.id);
      playWave(g);assert.notEqual(g.phase,'defeat',`Chapter ${chapter+1}, wave ${wave} should be winnable`);
    }
    assert.equal(g.phase,'victory');assert.ok(g.forest.stars[chapter]>0);
  }
  assert.equal(g.forestRank,3);assert.equal(g.forest.levels.pine,3);assert.equal(g.tree,135000);
});
