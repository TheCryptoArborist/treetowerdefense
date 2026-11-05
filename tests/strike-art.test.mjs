import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,pointAt} from '../src/engine.js';
import {GuardianAiming,SHOT_DURATION} from '../src/aiming.js';
import {paintShot} from '../src/art.js';

function recorder() {
  const calls=[];
  const c={calls};
  for (const method of ['save','restore','beginPath','closePath','fill','stroke','moveTo','lineTo',
    'quadraticCurveTo','ellipse','arc','translate','rotate']) c[method]=(...args)=>{
    assert.ok(args.every(value=>typeof value!=='number'||Number.isFinite(value)),`${method} received invalid geometry`);
    calls.push([method,...args]);
  };
  return c;
}
function attack(type,{lethal=false}={}) {
  const game=new Game();game.allowPreview();game.forest.unlocked=Object.keys(TOWERS);
  game.place(type,0);game.phase='running';game.wave=1;
  const enemy=game.spawn('beetle');enemy.progress=150;Object.assign(enemy,pointAt(150));
  enemy.hp=enemy.maxHp=lethal?1:500;
  game.events=[];game.step(.05);
  const aiming=new GuardianAiming();aiming.consume(game.events);
  return {game,enemy,shot:aiming.shots.find(s=>s.type===type),aiming};
}
function reaches(c,x,y) {
  return c.calls.some(([kind,...args])=>{
    if (['moveTo','lineTo','ellipse','arc','translate'].includes(kind)) return args[0]===x&&args[1]===y;
    if (kind==='quadraticCurveTo') return args[2]===x&&args[3]===y;
    return false;
  });
}

test('each real guardian hit renders a target-connected strike on its first frame without changing combat',()=>{
  for (const type of Object.keys(TOWERS)) {
    const {game,enemy,shot}=attack(type);
    assert.ok(game.events.some(e=>e.type==='hit'&&e.id===enemy.id),type);
    const before=game.snapshot(),events=structuredClone(game.events),visual=structuredClone(shot);
    const c=recorder();paintShot(c,shot);
    assert.ok(reaches(c,shot.tx,shot.ty),`${type} must reach the hit before its trail expires`);
    assert.deepEqual(game.snapshot(),before);assert.deepEqual(game.events,events);assert.deepEqual(shot,visual);
  }
});

test('a final killing hit has visible impact after its target and engine shots are removed',()=>{
  for (const type of Object.keys(TOWERS)) {
    const {game,enemy,shot,aiming}=attack(type,{lethal:true});
    assert.equal(game.phase,'build');assert.equal(game.enemies.length,0);assert.equal(game.shots.length,0);
    assert.equal(game.kills,1);assert.ok(game.events.some(e=>e.type==='kill'&&e.id===enemy.id));
    const c=recorder();paintShot(c,shot);assert.ok(reaches(c,shot.tx,shot.ty),type);
    aiming.advance(SHOT_DURATION);assert.equal(aiming.shots.length,0);
  }
});

test('reduced-motion strikes fade at fixed geometry and never animate a projectile after impact',()=>{
  for (const type of Object.keys(TOWERS)) {
    const {shot}=attack(type),first=recorder(),later=recorder();
    paintShot(first,shot,{reducedMotion:true});
    paintShot(later,{...shot,life:SHOT_DURATION/2},{reducedMotion:true});
    assert.deepEqual(later.calls,first.calls,type);
    assert.ok(later.globalAlpha<first.globalAlpha);
  }
});

test('chain pulses and coincident muzzle/target coordinates remain finite and impact immediately',()=>{
  const aiming=new GuardianAiming();
  aiming.consume([{type:'chain',x:100,y:100,tx:100,ty:100,style:0}]);
  const c=recorder();paintShot(c,aiming.shots[0]);assert.ok(reaches(c,100,100));
  for (const type of Object.keys(TOWERS)) paintShot(recorder(),{
    type,style:0,life:SHOT_DURATION,origin:{x:20,y:30},tx:20,ty:30
  });
});

test('held strikes keep their geometry, and expired strikes draw nothing',()=>{
  const {shot,aiming}=attack('cannon'),first=recorder(),held=recorder();
  paintShot(first,shot);aiming.advance(0);paintShot(held,shot);
  assert.deepEqual(held.calls,first.calls);
  for (const life of [0,-1,NaN]) {
    const c=recorder();paintShot(c,{...shot,life});assert.deepEqual(c.calls,[]);
  }
});
