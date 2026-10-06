import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, pointAt } from '../src/engine.js';
import { GuardianAiming, facingFor, SHOT_DURATION } from '../src/aiming.js';

const preview = () => { const game = new Game(); game.allowPreview(); game.forest.unlocked = Object.keys(TOWERS); return game; };
const aimEvent = (overrides = {}) => ({ type:'attack', towerId:1, targetId:2, x:100, y:100, tx:200, ty:100, guardian:'pine', style:0, level:1, ...overrides });
function at(enemy, progress) { enemy.progress=progress; Object.assign(enemy,pointAt(progress)); return enemy; }

test('eight target directions select upright front, side and back views with mirrored left poses', () => {
  const vectors = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
  const views = [0,1,2,3,4,3,2,1];
  vectors.forEach(([x,y],direction) => assert.deepEqual(facingFor(x,y),{direction,view:views[direction],flip:direction>4}));
  assert.deepEqual(facingFor(1,.1),facingFor(100,10));
  assert.deepEqual(facingFor(-1,-.1),{direction:6,view:2,flip:true});
});

test('tracking uses the actual range and furthest-along targeting without mutating battle state', () => {
  const game=preview(); game.place('pine',0); const tower=game.towers[0];
  const first=at(game.spawn('termite'),120), priority=at(game.spawn('beetle'),150), outside=at(game.spawn('moth'),190);
  Object.assign(first,{x:tower.x-50,y:tower.y}); Object.assign(priority,{x:tower.x,y:tower.y+50});
  Object.assign(outside,{x:tower.x+TOWERS.pine.range+1,y:tower.y});
  const snapshot=game.snapshot(), events=structuredClone(game.events), aiming=new GuardianAiming();
  assert.deepEqual(game.targetsFor(tower).map(e=>e.id),[priority.id,first.id]);
  aiming.track(game); assert.equal(aiming.pose(tower.id).targetId,priority.id);
  assert.equal(aiming.pose(tower.id).facing.direction,0);
  assert.deepEqual(game.snapshot(),snapshot); assert.deepEqual(game.events,events);
  tower.level=2; assert.equal(game.targetsFor(tower)[0].id,outside.id);
});

test('all eight defenders emit facing from the real attack target and preserve damage accounting', () => {
  for (const type of Object.keys(TOWERS)) {
    const game=preview(); game.place(type,0); game.phase='running'; game.wave=1; game.queue=['termite']; game.spawnTimer=100;
    const enemy=at(game.spawn('beetle'),150); enemy.hp=enemy.maxHp=500;
    game.events=[]; game.step(.05);
    const event=game.events.find(e=>e.type==='attack'), hit=game.events.find(e=>e.type==='hit'), tower=game.towers[0];
    assert.equal(event.targetId,enemy.id); assert.equal(event.towerId,tower.id); assert.equal(event.guardian,type);
    assert.equal(event.level,tower.level); assert.equal(event.style,tower.style);
    assert.equal(hit.damage,TOWERS[type].damage*(type === 'watchtower' ? 1 : .8)); assert.equal(enemy.hp,500-hit.damage);
    const before=structuredClone(game.events), aiming=new GuardianAiming(); aiming.consume(game.events);
    assert.deepEqual(aiming.pose(tower.id).facing,facingFor(event.tx-event.x,event.ty-event.y));
    assert.equal(aiming.shots[0].type,type); assert.equal(aiming.shots[0].life,SHOT_DURATION);
    assert.deepEqual(game.events,before);
  }
});

test('a firing pose holds through its projectile and freezes during pause or modal time', () => {
  const game=preview(); game.place('pine',0); const tower=game.towers[0], enemy=game.spawn('termite');
  const aiming=new GuardianAiming(); aiming.consume([aimEvent({towerId:tower.id,targetId:enemy.id,x:tower.x,y:tower.y,tx:tower.x+50,ty:tower.y})]);
  Object.assign(enemy,{x:tower.x-50,y:tower.y});
  const held=structuredClone(aiming); aiming.advance(0); aiming.track(game,true); assert.deepEqual(structuredClone(aiming),held);
  aiming.advance(.2); aiming.track(game); assert.equal(aiming.pose(tower.id).facing.direction,2);
  aiming.advance(.13); aiming.track(game); assert.equal(aiming.pose(tower.id).facing.direction,6); assert.equal(aiming.shots.length,0);
  game.enemies=[]; aiming.track(game); assert.equal(aiming.pose(tower.id).facing.direction,6);
});

test('the final killing attack remains visible after the engine clears a finished wave', () => {
  const game=preview(); game.place('pine',0); game.phase='running'; game.wave=1;
  const enemy=at(game.spawn('termite'),150); enemy.hp=1; game.events=[]; game.step(.05);
  assert.equal(game.phase,'build'); assert.equal(game.shots.length,0); assert.equal(game.kills,1);
  const aiming=new GuardianAiming(); aiming.consume(game.events); aiming.track(game);
  assert.equal(aiming.shots.length,1); assert.equal(aiming.shots[0].targetId,enemy.id);
  assert.equal(aiming.pose(game.towers[0].id).hold,SHOT_DURATION);
  aiming.advance(SHOT_DURATION); assert.equal(aiming.shots.length,0);
});

test('presentation shots are bounded and resets discard reused tower IDs and old poses', () => {
  const aiming=new GuardianAiming();
  const events=Array.from({length:100},(_,i)=>aimEvent({towerId:i,targetId:i+100}));
  aiming.consume(events); assert.equal(aiming.shots.length,64);
  aiming.track({towers:[],targetsFor:()=>[]}); assert.equal(aiming.poses.size,0);
  aiming.advance(NaN); aiming.advance(-1); assert.equal(aiming.time,0);
  aiming.clear(); assert.equal(aiming.shots.length,0); assert.equal(aiming.poses.size,0);
  assert.equal(aiming.pose(1).facing.direction,0);
});

test('a paused save reconstructs facing without adding presentation state or changing progress', () => {
  const game=preview(); game.place('pine',0); game.upgrade(game.towers[0].id); game.phase='running'; game.wave=1;
  at(game.spawn('termite'),150); const snapshot=game.snapshot(), restored=Game.restore(snapshot);
  assert.ok(restored); assert.equal(restored.phase,'paused');
  const before=restored.snapshot(), aiming=new GuardianAiming(); aiming.track(restored,true);
  assert.equal(aiming.pose(restored.towers[0].id).targetId,restored.enemies[0].id);
  assert.deepEqual(restored.snapshot(),before);
  for(const key of ['poses','aiming','shots','events']) assert.equal(Object.hasOwn(before,key),false);
  assert.equal(restored.tree,game.tree); assert.deepEqual(restored.forest,game.forest);
  assert.equal(restored.towers[0].level,game.towers[0].level);
});
