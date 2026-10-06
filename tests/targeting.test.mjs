import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, pointAt, TARGET_MODES } from '../src/engine.js';
import { GuardianAiming, facingFor } from '../src/aiming.js';

function encounter(type = 'pine') {
  const game = new Game(); game.allowPreview(5); game.forest.unlocked = Object.keys(TOWERS); game.place(type, 0);
  game.phase = 'running'; game.wave = 3; game.queue = ['termite']; game.spawnTimer = 100;
  const enemies = {};
  for (const [name, kind, progress, hp] of [['first','termite',270,200], ['strongest','beetle',150,600], ['fastest','moth',220,120]]) {
    const enemy = game.spawn(kind);
    Object.assign(enemy, { progress, hp, maxHp: hp }, pointAt(progress));
    enemies[name] = enemy;
  }
  game.events = [];
  return { game, tower: game.towers[0], enemies };
}

test('each priority selects its distinct living in-range threat without mutating the encounter', () => {
  const { game, tower, enemies } = encounter();
  const outside = game.spawn('boss'); Object.assign(outside, { x: 1000, y: 1000, progress: 2000, speed: 1000 });
  const dead = game.spawn('boss'); Object.assign(dead, { x: tower.x, y: tower.y, hp: 0, speed: 1000, progress: 3000 });
  for (const mode of Object.keys(TARGET_MODES)) {
    assert.equal(game.setTargetMode(tower.id, mode), true);
    const before = game.snapshot();
    const targets = game.targetsFor(tower);
    assert.equal(targets[0].id, enemies[mode].id);
    assert.equal(targets.length, 3);
    assert.deepEqual(game.snapshot(), before);
  }
});

test('fastest uses active slows; strongest uses remaining health; ties favor progress', () => {
  const { game, tower, enemies } = encounter();
  game.setTargetMode(tower.id, 'fastest');
  enemies.fastest.slowUntil = game.time + 2;
  assert.equal(game.targetsFor(tower)[0].id, enemies.first.id);
  game.time = 2;
  assert.equal(game.targetsFor(tower)[0].id, enemies.fastest.id);
  game.setTargetMode(tower.id, 'strongest');
  enemies.strongest.hp = 50;
  assert.equal(game.targetsFor(tower)[0].id, enemies.first.id);
  enemies.strongest.hp = enemies.first.hp;
  assert.equal(game.targetsFor(tower)[0].id, enemies.first.id);
});

test('orders change all eight real attacks and their facing together, with normal costs and cooldowns', () => {
  for (const type of Object.keys(TOWERS)) for (const mode of Object.keys(TARGET_MODES)) {
    const { game, tower, enemies } = encounter(type);
    const funds = [game.sap, game.tree], cooldown = tower.cooldown;
    game.setTargetMode(tower.id, mode);
    assert.deepEqual([game.sap, game.tree], funds);
    assert.equal(tower.cooldown, cooldown);
    const aiming = new GuardianAiming(); aiming.track(game);
    assert.equal(aiming.pose(tower.id).targetId, enemies[mode].id);
    const expectedSecond = game.targetsFor(tower)[1].id;
    game.step(.05);
    const attack = game.events.find(event => event.type === 'attack');
    assert.equal(attack.targetId, enemies[mode].id);
    aiming.consume(game.events);
    assert.equal(aiming.pose(tower.id).targetId, attack.targetId);
    assert.deepEqual(aiming.pose(tower.id).facing, facingFor(attack.tx - attack.x, attack.ty - attack.y));
    assert.equal(aiming.shots[0].targetId, attack.targetId);
    assert.equal(tower.cooldown, TOWERS[type].interval);
    const hit = game.events.find(event => event.type === 'hit');
    assert.equal(hit.damage, TOWERS[type].damage * (enemies[mode].kind === 'beetle' && type !== 'watchtower' ? .8 : 1));
    if (type === 'cypress') {
      const hits = game.events.filter(event => event.type === 'hit');
      assert.equal(hits[1].id, expectedSecond);
      assert.equal(hits[1].damage, TOWERS.cypress.damage * .5);
    }
  }
});

test('changing priority during a cooldown cannot create an extra shot and paused orders freeze battle', () => {
  const { game, tower } = encounter();
  tower.cooldown = .4;
  game.setTargetMode(tower.id, 'strongest'); game.step(.05);
  assert.equal(game.events.some(event => event.type === 'attack'), false);
  game.pause();
  const time = game.time, progress = game.enemies.map(e => e.progress), funds = [game.sap, game.tree];
  assert.equal(game.setTargetMode(tower.id, 'fastest'), true);
  game.step(.05);
  assert.equal(game.time, time);
  assert.deepEqual(game.enemies.map(e => e.progress), progress);
  assert.deepEqual([game.sap, game.tree], funds);
});

test('orders belong to one guardian, survive growth/save/continue, and reset with a new run', () => {
  const { game, tower } = encounter();
  const other = game.place('pine', 1);
  game.setTargetMode(tower.id, 'fastest');
  game.upgrade(tower.id);
  assert.equal(tower.targetMode, 'fastest'); assert.equal(other.targetMode, 'first');
  const saved = game.snapshot(), restored = Game.restore(saved);
  assert.equal(restored.phase, 'paused');
  assert.equal(restored.towers[0].targetMode, 'fastest');
  assert.equal(restored.towers[1].targetMode, 'first');
  assert.deepEqual(restored.forest, game.forest); assert.equal(restored.tree, game.tree);
  restored.phase = 'defeat';
  assert.equal(restored.continueRun(), true);
  assert.equal(restored.towers[0].targetMode, 'fastest');
  restored.newRun();
  assert.equal(restored.place('pine', 0).targetMode, 'first');
  assert.equal(restored.forest.levels.pine, 2);
});

test('old and edited optional targeting fields default safely while preserving original save progress', () => {
  const { game, tower } = encounter(); game.upgrade(tower.id);
  for (const version of [1, 2]) for (const value of [undefined, null, 'invalid', '__proto__', {}, 7]) {
    const saved = game.snapshot(); saved.version = version;
    if (value === undefined) delete saved.towers[0].targetMode;
    else saved.towers[0].targetMode = value;
    const original = structuredClone(saved), restored = Game.restore(saved);
    assert.ok(restored);
    assert.equal(restored.towers[0].targetMode, 'first');
    for (const key of ['tree','sap','wave','score','kills','health']) assert.equal(restored[key], game[key]);
    assert.equal(restored.towers[0].level, 2);
    assert.deepEqual(restored.queue, game.queue);
    assert.deepEqual(saved, original);
  }
});

test('invalid orders, absent guardians, ended runs, and missing access cannot mutate battle or funds', () => {
  const { game, tower } = encounter();
  for (const mode of [null, undefined, {}, 1, '__proto__', 'nearest']) {
    const before = game.snapshot();
    assert.equal(game.setTargetMode(tower.id, mode), false);
    assert.deepEqual(game.snapshot(), before);
  }
  for (const phase of ['defeat', 'victory']) {
    game.phase = phase; const before = game.snapshot();
    assert.equal(game.setTargetMode(tower.id, 'fastest'), false);
    assert.deepEqual(game.snapshot(), before);
  }
  game.phase = 'build'; game.access = false;
  assert.equal(game.setTargetMode(tower.id, 'fastest'), false);
  game.access = true; const before = game.snapshot();
  assert.equal(game.setTargetMode(99999, 'fastest'), false);
  assert.deepEqual(game.snapshot(), before);
  for (let rarity = 0; rarity <= 5; rarity++) {
    game.allowPreview(rarity);
    for (const mode of Object.keys(TARGET_MODES)) assert.equal(game.setTargetMode(tower.id, mode), true);
  }
});
