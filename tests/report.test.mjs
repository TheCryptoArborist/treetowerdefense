import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { battleReport } from '../src/playtest.js';
import { simulateDefense, BALANCE_PROFILES } from '../tools/balance-audit.mjs';
const ready=()=>{const g=new Game();g.allowPreview();return g;};
const runWave=g=>{assert.ok(g.startWave());let steps=0;while(g.phase==='running'&&steps++<15000)g.step(.05);assert.ok(steps<15000);};
test('actual shielded breaches, continue, reload and fresh run keep honest run totals',()=>{
 const g=ready();g.wave=1;g.phase='running';g.shield=50;
 for(let i=0;i<10;i++)g.spawn('beetle');
 for(const e of g.enemies)e.progress=g.map.length-1;
 g.step(.05);
 assert.equal(g.phase,'defeat');assert.equal(g.runReport.leaks.beetle,10);assert.equal(g.runReport.damage,100);assert.equal(g.runReport.absorbed,50);
 assert.ok(g.continueRun());assert.equal(g.runReport.continues,1);assert.equal(g.runReport.treeSpent,20000);
 const restored=Game.restore(g.snapshot());assert.deepEqual(restored.runReport,g.runReport);assert.equal(restored.phase,'paused');
 const tree=restored.tree;restored.newRun();assert.equal(restored.tree,tree);assert.equal(restored.runReport.damage,0);assert.equal(restored.runReport.complete,true);
});
test('kill rewards and wave bonus count once, but initial Sap and refunds are excluded',()=>{
 const g=ready();g.place('pine',0);const t=g.towers[0];g.sell(t.id);
 assert.equal(g.runReport.sapEarned,0);g.wave=1;g.phase='running';g.spawn('termite');g.enemies[0].hp=0;g.resolveKills();g.resolveKills();g.step(.05);
 assert.equal(g.runReport.sapEarned,97);assert.equal(g.runReport.cleared,1);g.step(.05);assert.equal(g.runReport.sapEarned,97);
});
test('all campaign report totals agree with real kills and cleared waves',()=>{
 for(let chapter=0;chapter<3;chapter++){
  const result=simulateDefense(chapter,BALANCE_PROFILES.sapMixed);const g=Game.restore(result.snapshot);
  assert.equal(g.phase,'victory');assert.equal(g.runReport.cleared,10);assert.equal(g.runReport.sapEarned,(g.kills-1)*12+150+850);assert.equal(g.runReport.treeSpent,0);
  const report=battleReport(g);assert.ok(report.goal);assert.equal(report.complete,true);
 }
});
test('earned campaign unlocks are recorded once and survive a reload',()=>{
 const g=ready();g.place('pine',0);g.place('oak',1);runWave(g);runWave(g);
 assert.deepEqual(g.runReport.unlocks,['palm']);assert.ok(battleReport(g).earned.includes('Palm'));
 assert.deepEqual(Game.restore(g.snapshot()).runReport.unlocks,['palm']);g.refreshUnlocks();assert.deepEqual(g.runReport.unlocks,['palm']);
});
test('Haunted Grove report records new rewards, leaves campaign goals separate, and does not re-award cosmetics',()=>{
 const g=ready();g.forest.stars=[3,3,3];g.refreshUnlocks(false);g.startEvent();
 // Fast deterministic combat, using real wave queues, kills and victory transitions.
 for(let w=1;w<=5;w++){
  assert.ok(g.startWave());let steps=0;
  while(g.phase==='running'&&steps++<15000){g.step(.05);for(const e of g.enemies)g.strike(e,1e6,'storm');g.resolveKills();}
 }
 assert.equal(g.phase,'victory');assert.equal(g.runReport.cleared,5);assert.deepEqual(g.runReport.rewards,['grove-badge','lantern-oak']);
 assert.match(battleReport(g).goal,/three defender types/);assert.match(battleReport(g).earned.join(' '),/Lantern Oak/);
 assert.deepEqual(Game.restore(g.snapshot()).runReport,g.runReport);assert.deepEqual(g.forest.stars,[3,3,3]);
 g.startEvent();g.wave=5;g.phase='running';g.step(.05);assert.deepEqual(g.runReport.rewards,[]);assert.deepEqual(battleReport(g).earned,[]);
});
test('missing or invalid optional reports keep funds and progress, mark partial history, and start counting forward',()=>{
 for(const report of [undefined,{version:1,complete:true,damage:NaN},{version:999},null]){
  const g=ready();g.place('pine',0);g.upgrade(g.towers[0].id);const data=g.snapshot();data.runReport=report;
  const restored=Game.restore(data);assert.ok(restored);assert.equal(restored.tree,g.tree);assert.deepEqual(restored.forest,g.forest);assert.equal(restored.runReport.complete,false);
  restored.wave=1;restored.phase='running';restored.spawn('moth');restored.enemies[0].progress=restored.map.length-1;restored.step(.05);
  assert.equal(restored.runReport.leaks.moth,1);assert.match(battleReport(restored).tip,/Palm/);
 }
});
