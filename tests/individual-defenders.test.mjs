import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS} from '../src/engine.js';
import {PurchaseReview} from '../src/playtest.js';
const fresh=()=>{const g=new Game();g.allowPreview();g.enableCollection();return g;};
test('one TREE upgrade affects one numbered defender and survives removal, runs and reload',()=>{
 const g=fresh(),a=g.place('pine',0,0),b=g.place('pine',1,1),before=g.tree;
 const review=new PurchaseReview(g,'upgrade',a.id);assert.match(review.details().title,/#1/);assert.match(review.details().description,/Only this numbered/);
 assert.equal(review.confirm(),true);assert.equal(review.confirm(),false);assert.equal(g.tree,before-5000);assert.equal(a.level,2);assert.equal(b.level,1);assert.equal(g.forest.levels.pine,1);
 assert.equal(g.place('pine',2,0),false);g.sell(a.id);const redeployed=g.place('pine',2,0);assert.equal(redeployed.level,2);
 const restored=Game.restore(g.snapshot());assert.equal(restored.towers.find(t=>t.defenderSlot===0).level,2);
 restored.newRun();assert.equal(restored.place('pine',3,0).level,2);assert.equal(restored.place('pine',4,1).level,1);
});
test('old species purchases seed all twelve copies without charge and migrate deployed identities',()=>{
 const g=new Game();g.allowPreview();const a=g.place('pine',0),b=g.place('pine',1);g.upgrade(a.id);const funds=g.tree;
 const r=Game.restore(g.snapshot());r.enableCollection();assert.deepEqual(r.collection.levels.pine,Array(12).fill(2));assert.equal(r.tree,funds);assert.deepEqual(r.towers.map(t=>t.defenderSlot),[0,1]);
 r.upgrade(r.towers[0].id);assert.equal(r.towers[0].level,3);assert.equal(r.towers[1].level,2);r.newRun();assert.equal(r.place('pine',0,11).level,2);
});
test('collection save rejects duplicate deployed identities and levels inconsistent with the inventory',()=>{
 const g=fresh();g.place('pine',0,0);g.place('pine',1,1);let s=g.snapshot();s.towers[1].defenderSlot=0;assert.equal(Game.restore(s),null);
 s=g.snapshot();s.towers[0].level=3;assert.equal(Game.restore(s),null);s=g.snapshot();s.collection.levels.pine.pop();assert.equal(Game.restore(s),null);
 assert.equal(g.place('pine',2,12),false);assert.equal(g.place('pine',2,-1),false);assert.equal(g.place('pine',2,'1'),false);
});
test('server inventory replaces editable client levels and validates atomically',()=>{
 const g=fresh();const t=g.place('pine',0,0);g.upgrade(t.id);
 assert.ok(g.applyPurchasedCollection({pine:1},[{species:'pine',slot:1,level:3}]));assert.equal(t.level,1);assert.equal(g.collection.levels.pine[1],3);
 const before=g.snapshot();assert.equal(g.applyPurchasedCollection({},[{species:'pine',slot:12,level:2}]),false);assert.deepEqual(g.snapshot(),before);
 assert.equal(g.applyPurchasedCollection({},[{species:'pine',slot:1,level:2},{species:'pine',slot:1,level:3}]),false);
 assert.ok(g.applyPurchasedCollection({pine:2},[{species:'pine',slot:1,level:1}]));assert.equal(t.level,2);assert.equal(g.collection.levels.pine[1],2);
});
test('collection persists through chapter and seasonal travel without changing roster eligibility',()=>{
 const g=fresh();g.forest.stars=[3,3,3];g.forest.unlocked=Object.keys(TOWERS);const t=g.place('pine',0,0);g.upgrade(t.id);g.chooseChapter(1);assert.equal(g.place('pine',0,0).level,2);g.startEvent('harvest-canopy');assert.equal(g.place('pine',0,0).level,2);assert.ok(Game.restore(g.snapshot()));
});
