import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,MINI_BOSSES,miniBossFor,waveLineup,enemySpeed,blightHealing} from '../src/engine.js';
import {scoutWave} from '../src/playtest.js';
import {CombatFeedback,bossStatus} from '../src/combat.js';
const ready=()=>{const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];return g;};
test('encounters match their scout, boss identity and named arrival across standard and Veteran chapters',()=>{
 for(const difficulty of ['standard','veteran'])for(let chapter=0;chapter<3;chapter++)for(const wave of [4,7]){
  const g=ready();g.startCampaign(difficulty);g.chooseChapter(chapter);g.wave=wave-1;g.startWave();
  const key=miniBossFor(chapter,wave),info=MINI_BOSSES[key],forecast=scoutWave(chapter,wave,1,'campaign',difficulty);
  assert.equal(g.queue.filter(k=>k==='boss').length,1);assert.equal(forecast.groups.find(e=>e.kind==='boss').name,info.name);
  const boss=g.spawn('boss');assert.equal(boss.miniBoss,key);assert.equal(g.bossName,info.name);
  assert.equal(boss.maxHp,info.hp*[1,1.2,1.4][chapter]*(difficulty==='veteran'?2.4:1));
  assert.equal(bossStatus(g).state,'present');const f=new CombatFeedback();f.consume(g.events);assert.match(f.notice.title,new RegExp(info.name.toUpperCase()));
  const restored=Game.restore(g.snapshot());assert.equal(restored.enemies[0].miniBoss,key);assert.equal(restored.enemies[0].hp,boss.hp);assert.equal(restored.bossName,info.name);
 }
});
test('mini-boss counters and breach damage work without changing final bosses',()=>{
 const g=ready();g.wave=4;g.phase='running';const bot=g.spawn('boss');g.strike(bot,100,'pine');assert.equal(bot.hp,360);g.strike(bot,100,'watchtower');assert.equal(bot.hp,260);
 bot.hp=0;g.resolveKills();assert.equal(g.sap,450);g.resolveKills();assert.equal(g.sap,450);
 g.chapter=1;g.wave=7;const sprayer=g.spawn('boss');sprayer.hp-=100;g.time=3;assert.equal(blightHealing(sprayer,g.time),true);sprayer.poisonUntil=4;assert.equal(blightHealing(sprayer,g.time),false);
 sprayer.progress=g.map.length;g.step(.01);assert.equal(g.health,75);
 g.chapter=0;g.wave=7;const saw=g.spawn('boss');assert.equal(enemySpeed(saw,0),102);saw.slowUntil=5;assert.equal(enemySpeed(saw,0),102*.55);
 g.wave=10;const final=g.spawn('boss');assert.equal(final.miniBoss,undefined);assert.equal(final.maxHp,2100);assert.equal(g.bossName,'Blight King');
});
test('old saves keep their original queues and future waves; fresh runs enable encounters; seasons stay unchanged',()=>{
 const g=ready(),saved=g.snapshot();delete saved.encounters;const old=Game.restore(saved);assert.equal(old.encounters,0);old.wave=3;old.startWave();assert.equal(old.queue.includes('boss'),false);
 old.newRun();assert.equal(old.encounters,1);assert.equal(waveLineup(0,4,0).includes('boss'),false);
 for(const mode of ['haunted-grove','harvest-canopy'])assert.equal(miniBossFor(0,4,mode),null);
});
