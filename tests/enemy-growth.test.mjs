import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,pestAppearance,pestTier} from '../src/engine.js';
import {scoutWave} from '../src/playtest.js';
test('enemy silhouettes and real health increase through early, middle and late waves',()=>{
 const g=new Game();g.allowPreview();
 for(const kind of ['termite','beetle','moth','blight']){
  const pests=[1,4,8].map(wave=>{g.wave=wave;return g.spawn(kind);});
  assert.deepEqual(pests.map(e=>e.appearanceTier),[0,1,2]);
  for(let i=1;i<pests.length;i++){assert.ok(pests[i].hp>pests[i-1].hp);assert.ok(pestAppearance(pests[i]).scale>pestAppearance(pests[i-1]).scale);}
 }
 assert.ok(pestAppearance({kind:'moth',appearanceTier:2}).scale<pestAppearance({kind:'beetle',appearanceTier:2}).scale);
 assert.ok(pestAppearance({kind:'boss',appearanceTier:2}).scale>pestAppearance({kind:'beetle',appearanceTier:2}).scale);
});
test('all campaign and seasonal scout portraits use the same growth tier as actual spawns',()=>{
 for(const mode of ['campaign','harvest-canopy','haunted-grove'])for(let chapter=0;chapter<3;chapter++)for(let wave=1;wave<=(mode==='campaign'?10:5);wave++){
  const g=new Game();g.allowPreview();g.chapter=chapter;g.mode=mode;g.wave=wave;
  const scout=scoutWave(chapter,wave,1,mode);
  for(const group of scout.groups){const e=g.spawn(group.kind);assert.equal(group.appearanceTier,e.appearanceTier);assert.match(group.trait,new RegExp(pestAppearance(e).label));}
 }
 assert.ok(pestTier(2,1)>pestTier(0,1));
});
test('saved enemies keep their health and visual tier; old and edited visual fields are safe',()=>{
 const g=new Game();g.allowPreview();g.wave=8;g.phase='running';const e=g.spawn('beetle');g.strike(e,13,'watchtower');
 const s=g.snapshot(),r=Game.restore(s);assert.equal(r.enemies[0].hp,e.hp);assert.equal(r.enemies[0].appearanceTier,2);assert.equal(pestAppearance(r.enemies[0]).scale,pestAppearance(e).scale);
 delete s.enemies[0].appearanceTier;const old=Game.restore(s);assert.equal(old.enemies[0].hp,e.hp);assert.equal(pestAppearance(old.enemies[0]).tier,0);
 assert.equal(pestAppearance({kind:'beetle',appearanceTier:999}).tier,0);
});
test('only Veteran bosses show enrage and defeat silhouettes preserve their growth',()=>{
 const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.startCampaign('veteran');g.wave=10;const b=g.spawn('boss');b.hp=b.maxHp*.49;
 assert.equal(pestAppearance(b).enraged,true);assert.equal(pestAppearance({...b,veteran:false}).enraged,false);assert.equal(pestAppearance({...b,kind:'beetle'}).enraged,false);
 b.enraged=true;b.hp=0;g.resolveKills();const event=g.events.find(e=>e.type==='kill');assert.equal(event.appearanceTier,2);assert.equal(pestAppearance(event).scale,pestAppearance(b).scale);assert.equal(pestAppearance(event).enraged,true);
});
