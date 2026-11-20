import assert from 'node:assert/strict';
import test from 'node:test';
import { createFreeWave } from '../client/free-wave.mjs';

test('a guest can clear the real opening wave and cannot launch a second', () => {
  const trial = createFreeWave();
  assert.equal(trial.start(), false);
  assert.ok(trial.place('oak', 1));
  assert.ok(trial.place('pine', 0));
  assert.ok(trial.place('pine', 2));
  assert.equal(trial.place('palm', 3), false);
  assert.equal(trial.start(), true);
  for (let tick = 0; tick < 6000 && !trial.finished(); tick++) trial.step(0.05);
  assert.equal(trial.finished(), true);
  assert.equal(trial.state.phase, 'build');
  assert.equal(trial.state.wave, 1);
  assert.equal(trial.state.health, 100);
  assert.equal(trial.start(), false);
  assert.equal(trial.place('pine', 3), false);
  assert.equal(createFreeWave().state.wave, 0);
});
