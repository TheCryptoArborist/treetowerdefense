import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, PATH_LENGTH, pointAt } from '../src/engine.js';
import { CombatFeedback, bossStatus } from '../src/combat.js';

const preview = () => { const game = new Game(); game.allowPreview(); return game; };
function at(enemy, progress) { enemy.progress = progress; Object.assign(enemy, pointAt(progress)); return enemy; }

test('hit feedback matches armor, splash and piercing damage without spending extra currency', () => {
  for (const type of Object.keys(TOWERS)) {
    const game = preview(); game.place(type, 0); game.phase = 'running'; game.wave = 1; game.queue = ['termite']; game.spawnTimer = 100;
    const primary = at(game.spawn('beetle'), 150), secondary = at(game.spawn('termite'), 140);
    primary.hp = primary.maxHp = secondary.hp = secondary.maxHp = 500;
    game.events = []; const tree = game.tree, sap = game.sap;
    game.step(.05);
    const hits = game.events.filter(event => event.type === 'hit');
    assert.equal(hits[0].id, primary.id);
    assert.equal(hits[0].source, type);
    assert.equal(hits[0].damage, TOWERS[type].damage * .8);
    assert.equal(primary.hp, 500 - hits[0].damage);
    if (type === 'oak' || type === 'cypress') {
      assert.equal(hits.length, 2);
      assert.equal(hits[1].id, secondary.id);
      assert.equal(secondary.hp, 500 - hits[1].damage);
    } else assert.equal(hits.length, 1);
    if (type === 'mushroom') assert.ok(secondary.poisonUntil > game.time);
    assert.equal(game.tree, tree); assert.equal(game.sap, sap);
  }
});

test('Leaf Storm emits capped hit damage and exactly one defeat and reward per pest', () => {
  const game = preview(); game.startWave(); const enemy = at(game.spawn('termite'), 100);
  game.events = []; const sap = game.sap;
  assert.ok(game.supply('storm'));
  const hit = game.events.find(event => event.type === 'hit'), kill = game.events.find(event => event.type === 'kill');
  assert.equal(hit.damage, enemy.maxHp); assert.equal(hit.source, 'storm');
  assert.equal(kill.id, enemy.id); assert.equal(kill.progress, 100); assert.equal(kill.x, enemy.x);
  game.resolveKills(); assert.equal(game.events.filter(event => event.type === 'kill').length, 1);
  assert.equal(game.kills, 1); assert.equal(game.sap, sap + 12); assert.equal(game.tree, 142000);
});

test('poison defeats also carry a silhouette event without emitting per-frame hit spam', () => {
  const game = preview(); game.phase = 'running'; game.wave = 1; game.queue = ['termite']; game.spawnTimer = 100;
  const enemy = at(game.spawn('blight'), 100); enemy.hp = .5; enemy.poisonUntil = 2; enemy.poisonDamage = 14;
  game.step(.05);
  assert.equal(game.kills, 1); assert.equal(game.events.filter(event => event.type === 'kill').length, 1);
  assert.equal(game.events.some(event => event.type === 'hit'), false);
});

test('the final-wave warning precedes exactly one real boss arrival', () => {
  const game = preview(); game.wave = 9; game.startWave();
  assert.deepEqual(game.events[0], { type: 'wave-start', wave: 10 });
  assert.deepEqual(bossStatus(game), { state: 'incoming' });
  for (let i = 0; i < 1000 && game.queue.length; i++) game.step(.05);
  assert.equal(game.events.filter(event => event.type === 'boss-arrival').length, 1);
  assert.equal(game.enemies.filter(enemy => enemy.kind === 'boss').length, 1);
  assert.equal(bossStatus(game).state, 'present'); assert.equal(bossStatus(game).percent, 100);
});

test('root breach feedback distinguishes shield absorption from actual life damage', () => {
  const game = preview(); game.phase = 'running'; game.wave = 1; game.queue = ['termite']; game.spawnTimer = 100; game.shield = 50;
  at(game.spawn('beetle'), PATH_LENGTH - 1); game.step(.05);
  assert.equal(game.health, 100); assert.equal(game.shield, 32);
  assert.deepEqual(game.events.find(event => event.type === 'leak'), { type: 'leak', x: 940, y: 640, kind: 'beetle', damage: 0, absorbed: 18 });
  game.events = []; at(game.spawn('boss'), PATH_LENGTH - 1); game.step(.05);
  const leak = game.events.find(event => event.type === 'leak');
  assert.equal(leak.damage, 28); assert.equal(leak.absorbed, 32); assert.equal(game.health, 72);
  game.health = 4; game.events = []; at(game.spawn('termite'), PATH_LENGTH - 1); game.step(.05);
  assert.equal(game.events.find(event => event.type === 'leak').damage, 4); assert.equal(game.phase, 'defeat');
});

test('wave-clear feedback reports the existing Sap bonus once', () => {
  const game = preview(); game.phase = 'running'; game.wave = 1; const sap = game.sap;
  game.step(.05); game.step(.05);
  assert.equal(game.events.filter(event => event.type === 'wave-clear').length, 1);
  assert.deepEqual(game.events.find(event => event.type === 'wave-clear'), { type: 'wave-clear', wave: 1, sap: 85 });
  assert.equal(game.sap, sap + 85); assert.equal(game.phase, 'build');
});

test('presentation effects are bounded, hold during pause, expire, and clear for a new run', () => {
  const feedback = new CombatFeedback();
  const events = Array.from({ length: 200 }, (_, id) => ({ type: 'hit', id, x: 10, y: 10, kind: 'termite' }));
  const original = structuredClone(events); feedback.consume(events); assert.deepEqual(events, original);
  assert.equal(feedback.impacts.length, 80); assert.equal(feedback.reactions.size, 64);
  feedback.consume(Array.from({ length: 50 }, (_, id) => ({ type: 'kill', id, x: 10, y: 10, kind: 'termite' })));
  assert.equal(feedback.defeats.length, 32);
  feedback.consume([{ type: 'boss-arrival' }]);
  const held = structuredClone(feedback); feedback.advance(0);
  assert.deepEqual(structuredClone(feedback), held); assert.equal(feedback.reaction(199), 1);
  feedback.advance(.2); assert.equal(feedback.reaction(199), 0);
  feedback.advance(5); assert.equal(feedback.notice, null); assert.equal(feedback.defeats.length, 0); assert.equal(feedback.impacts.length, 0);
  feedback.consume([{ type: 'boss-arrival' }]); feedback.clear(); assert.equal(feedback.notice, null); assert.equal(feedback.reactions.size, 0);
});

test('boss display is read-only and restores from battle state with no presentation state in saves', () => {
  const game = preview(); assert.deepEqual(bossStatus(game), { state: 'hidden' });
  game.phase = 'running'; game.wave = 10; const boss = at(game.spawn('boss'), 200); boss.hp = boss.maxHp / 2;
  const snapshot = game.snapshot(); assert.equal(bossStatus(game).percent, 50); assert.deepEqual(game.snapshot(), snapshot);
  assert.equal(Object.hasOwn(snapshot, 'events'), false); assert.equal(Object.hasOwn(snapshot, 'feedback'), false);
  const restored = Game.restore(snapshot); assert.ok(restored); assert.equal(restored.phase, 'paused');
  assert.equal(bossStatus(restored).hp, boss.hp); assert.equal(bossStatus(restored).percent, 50);
});
