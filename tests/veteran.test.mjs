import test from'node:test';import assert from'node:assert/strict';import{Game,enemySpeed,TOWERS}from'../src/engine.js';import{CombatFeedback}from'../src/combat.js';import{MIXED_PLACEMENTS}from'../tools/balance-audit.mjs';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.forest.bestWaves=[10,10,10];g.forest.unlocked=Object.keys(TOWERS);return g;};
import { scoutWave, battleReport } from '../src/playtest.js';
import { simulateVeteran, VETERAN_PROFILES } from '../tools/veteran-audit.mjs';

test('Veteran scouting and wave-start notices match actual queues for all 30 waves', () => {
  for (let chapter=0;chapter<3;chapter++) for(let wave=1;wave<=10;wave++) {
    const g=ready();g.startCampaign('veteran');g.chooseChapter(chapter);g.wave=wave-1;g.startWave();
    const scout=scoutWave(chapter,wave,g.enemyRules,g.mode,g.difficulty);
    assert.equal(scout.total,g.queue.length);
    for(const group of scout.groups) assert.equal(group.count,g.queue.filter(kind=>kind===group.kind).length);
    assert.match(scout.tip,/VETERAN.*2.4×/);
    assert.doesNotMatch(scout.tip,/earns Cypress|earns Mushroom/);
    const f=new CombatFeedback();f.consume(g.events);assert.equal(f.notice.text,scout.tip);
    if(wave===2)assert.match(scout.groups.find(p=>p.kind==='beetle').counter,/Watchtower and Cypress/);
    if(wave===10)assert.match(scout.groups.find(p=>p.kind==='boss').trait,/half health/);
  }
  assert.deepEqual(scoutWave(0,11,1,'campaign','veteran').groups,[]);
  for(const mode of ['harvest-canopy','haunted-grove'])assert.deepEqual(scoutWave(0,5,1,mode,'veteran'),scoutWave(0,5,1,mode));
  assert.doesNotMatch(scoutWave(0,2).tip,/VETERAN/);
});

test('Veteran defeat reports explain the leaking threat and recognize full completion', () => {
  const g=ready();g.startCampaign('veteran');g.runReport.leaks={beetle:3};
  assert.match(battleReport(g).tip,/extra shell/);
  assert.match(battleReport(g).goal,/at least 80 health/);
  g.runReport.leaks={boss:1};assert.match(battleReport(g).tip,/accelerates below half health/);
  g.veteranStars=[3,3,3];assert.match(battleReport(g).goal,/All nine Veteran stars earned/);
});

test('Veteran counterplay succeeds where a single-species army fails, including mid-wave reloads', () => {
  for(let chapter=0;chapter<3;chapter++){
    assert.equal(simulateVeteran(chapter,VETERAN_PROFILES.pines).phase,'defeat');
    const uninterrupted=simulateVeteran(chapter,VETERAN_PROFILES.counters);
    const resumed=simulateVeteran(chapter,VETERAN_PROFILES.counters,{reload:true});
    assert.equal(uninterrupted.phase,'victory');assert.equal(uninterrupted.treeSpent,0);
    assert.deepEqual(resumed,uninterrupted);
  }
});
test('Veteran requires standard completion and has no entry charge',()=>{const g=new Game();g.allowPreview();const before=g.snapshot();assert.equal(g.startCampaign('veteran'),false);assert.deepEqual(g.snapshot(),before);g.forest.stars=[1,1,1];const tree=g.tree;assert.ok(g.startCampaign('veteran'));assert.equal(g.tree,tree);assert.equal(g.isVeteran,true);});
test('reinforced shells have specific piercing counters and enraging bosses share actual targeting speed',()=>{const g=ready();g.startCampaign('veteran');g.wave=10;const e=g.spawn('beetle');g.strike(e,100,'pine');assert.equal(e.maxHp-e.hp,70);const before=e.hp;g.strike(e,100,'watchtower');assert.equal(before-e.hp,100);const b=g.spawn('boss'),speed=enemySpeed(b,0);b.hp=b.maxHp*.49;assert.equal(enemySpeed(b,0),speed*1.3);g.phase='running';g.step(.01);const f=new CombatFeedback();f.consume(g.events);assert.match(f.notice.title,/ENRAGED/);g.events=[];g.step(.01);assert.equal(g.events.filter(e=>e.type==='boss-enrage').length,0);});
test('difficulty, queued battles and separate medals survive reload; old saves stay standard',()=>{const g=ready();g.startCampaign('veteran');g.place('pine',0);g.startWave();g.step(.05);const saved=g.snapshot(),r=Game.restore(saved);assert.equal(r.isVeteran,true);assert.equal(r.phase,'paused');assert.deepEqual(r.queue,g.queue);assert.equal(r.enemies[0].hp,g.enemies[0].hp);r.phase='running';r.wave=10;r.queue=[];r.enemies=[];r.health=75;const stars=[...r.forest.stars];r.step(.05);assert.equal(r.veteranStars[0],2);assert.deepEqual(r.forest.stars,stars);assert.equal(Game.restore(r.snapshot()).veteranStars[0],2);const old=ready().snapshot();delete old.difficulty;delete old.veteranStars;assert.equal(Game.restore(old).difficulty,'standard');g.startEvent('harvest-canopy');assert.equal(g.isVeteran,false);assert.equal(g.difficulty,'standard');});
test('Veteran chapters are completable with owned Ancient growth and no paid run supplies',()=>{for(let chapter=0;chapter<3;chapter++){const g=ready();g.startCampaign('veteran');g.chooseChapter(chapter);for(const t of Object.keys(TOWERS))g.forest.levels[t]=3;const funds=g.tree;for(let w=1;w<=10;w++){for(const[type,pad]of MIXED_PLACEMENTS.map(([t,p])=>[[5,7,9].includes(p)?'watchtower':p===3?'cannon':t,p]))if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);g.startWave();let n=0;while(g.phase==='running'&&n++<20000){g.step(.05);g.events=[];}assert.notEqual(g.phase,'defeat',`chapter ${chapter} wave ${w}`);}assert.equal(g.phase,'victory');assert.equal(g.tree,funds);console.log(`Veteran chapter ${chapter}: ${g.health} health, no consumables`);}});
