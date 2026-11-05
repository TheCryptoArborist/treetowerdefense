import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,pointAt} from '../src/engine.js';
import {GuardianAiming,facingFor,SHOT_DURATION} from '../src/aiming.js';
import {defenderMotion,defenderMotionPoint} from '../src/defender-motion.js';
import {pestWalkPhase,paintPest} from '../src/art.js';

test('actual attacks drive distinct grounded performances without altering damage or saves',()=>{
  const poses=[];
  for(const type of Object.keys(TOWERS)){
    const game=new Game();game.allowPreview();game.forest.unlocked=Object.keys(TOWERS);game.sap=1000;game.place(type,0);
    const tower=game.towers[0];game.phase='running';game.wave=1;game.queue=['termite'];game.spawnTimer=100;
    const enemy=game.spawn('beetle');Object.assign(enemy,{progress:150,...pointAt(150),hp:500,maxHp:500});game.events=[];game.step(.01);
    const attack=game.events.find(e=>e.type==='attack');assert.ok(attack);
    const snapshot=game.snapshot(),events=structuredClone(game.events),aiming=new GuardianAiming();aiming.consume(events);aiming.track(game);
    const release=aiming.motion(tower);assert.equal(release.x,0);assert.equal(release.y,0);
    aiming.advance(.07);const follow=aiming.motion(tower);poses.push(follow);
    assert.notDeepEqual(follow,defenderMotion(type));
    assert.deepEqual(defenderMotionPoint(0,16,follow),{x:0,y:16});
    assert.deepEqual(game.snapshot(),snapshot);assert.deepEqual(game.events,events);
    aiming.advance(SHOT_DURATION);assert.deepEqual(aiming.motion(tower),defenderMotion(type));
  }
  assert.equal(new Set(poses.map(p=>JSON.stringify(p))).size,8);
});
test('preparation follows a real in-range target and freezes across pause; reduced motion stays neutral',()=>{
  const game=new Game();game.allowPreview();game.place('pine',0);const tower=game.towers[0],enemy=game.spawn('termite');
  Object.assign(enemy,{x:tower.x+50,y:tower.y});tower.cooldown=.07;
  const aiming=new GuardianAiming();aiming.track(game);const ready=aiming.motion(tower);
  assert.equal(ready.phase,'prepare');assert.ok(ready.x<0);
  enemy.x=tower.x-50;aiming.advance(0);aiming.track(game,true);assert.deepEqual(aiming.motion(tower),ready);
  assert.deepEqual(aiming.motion(tower,{reducedMotion:true}),defenderMotion('pine'));
  assert.equal(aiming.motion(tower,{battleActive:false}).phase,'idle');
  game.enemies=[];aiming.track(game);assert.equal(aiming.motion(tower).phase,'idle');
});
test('firing sockets remain neutral at release; recovery mirrors all directions and settles continuously',()=>{
  for(const type of Object.keys(TOWERS))for(let direction=0;direction<8;direction++){
    for(const age of [0,.04,.12,.24,.319,.32,Infinity,NaN]){
      const m=defenderMotion(type,{age,direction});
      for(const [key,value]of Object.entries(m))if(key!=='phase')assert.ok(Number.isFinite(value));
      const p=defenderMotionPoint(0,16,m);assert.deepEqual(p,{x:0,y:16});
    }
    const zero=defenderMotion(type,{age:0,direction});assert.equal(zero.x,0);assert.equal(zero.y,0);
    const settled=defenderMotion(type,{age:.319999,direction});assert.ok(Math.abs(settled.x)<.001);assert.ok(Math.abs(settled.y)<.001);assert.ok(settled.recoil<.001);
    if(!TOWERS[type].structure){
      assert.ok(Math.abs(defenderMotion(type,{age:.07,direction:2}).x+defenderMotion(type,{age:.07,direction:6}).x)<1e-8);
    }
  }
  assert.equal(facingFor(1,0).direction,2);
});
test('bow reload reveals a new bolt after release and barrel recoil returns independently of the base',()=>{
  assert.equal(defenderMotion('watchtower',{age:0}).arrow,0);
  assert.ok(defenderMotion('watchtower',{age:.20}).arrow>0);
  assert.equal(defenderMotion('watchtower',{age:.30}).arrow,1);
  assert.ok(defenderMotion('cannon',{age:.07}).recoil>defenderMotion('cannon',{age:0}).recoil);
  assert.equal(defenderMotion('cannon',{age:.32}).recoil,0);
  assert.ok(defenderMotion('watchtower',{prepare:.5}).draw>.9);
});
test('insect steps follow distance, not elapsed rendering time, and reduced motion is static',()=>{
  const records=[];
  const recorder=()=>new Proxy({},{get(o,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return(...args)=>records.push([k,...args]);}});
  for(const kind of ['termite','beetle','blight','boss'])for(const tier of [0,1,2]){
    const e={kind,appearanceTier:tier,x:0,y:0,id:4,progress:100,hp:100,maxHp:100};
    const before=JSON.stringify(e);records.length=0;paintPest(recorder(),e,1,0,{healthBar:false});const a=JSON.stringify(records);
    records.length=0;paintPest(recorder(),e,500,0,{healthBar:false});assert.equal(JSON.stringify(records),a);
    assert.equal(JSON.stringify(e),before);assert.equal(pestWalkPhase(e,true),0);
    assert.notEqual(pestWalkPhase(e),pestWalkPhase({...e,progress:110}));
  }
});
