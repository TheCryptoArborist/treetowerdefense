import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {CAMPAIGN_LEVELS,campaignLevelState,beginCampaignLevel,levelUnlockText} from '../src/levels.js';
test('six numbered levels map to the existing forests and keep Veteran medals separate',()=>{
 const g=new Game();g.allowPreview();g.forest.stars=[3,2,1];g.veteranStars=[1,2,3];
 assert.deepEqual(CAMPAIGN_LEVELS.map(l=>[l.number,l.chapter,l.difficulty]),[[1,0,'standard'],[2,1,'standard'],[3,2,'standard'],[4,0,'veteran'],[5,1,'veteran'],[6,2,'veteran']]);
 for(const level of CAMPAIGN_LEVELS){assert.ok(beginCampaignLevel(g,level.number));assert.equal(g.chapter,level.chapter);assert.equal(g.isVeteran,level.number>3);assert.ok(campaignLevelState(g,level).active);assert.equal(campaignLevelState(g,level).stars,level.number>3?g.veteranStars[level.chapter]:g.forest.stars[level.chapter]);}
 assert.deepEqual(g.forest.stars,[3,2,1]);assert.deepEqual(g.veteranStars,[1,2,3]);
});
test('locked and nonexistent levels cannot reset a battle or change difficulty',()=>{
 const g=new Game();g.allowPreview();const before=g.snapshot();
 for(const number of [2,3,4,5,6,7,0,4.5]){assert.equal(beginCampaignLevel(g,number),false);assert.deepEqual(g.snapshot(),before);}
 assert.match(levelUnlockText(CAMPAIGN_LEVELS[0]),/Watchtower/);assert.match(levelUnlockText(CAMPAIGN_LEVELS[1]),/Cannon/);assert.match(levelUnlockText(CAMPAIGN_LEVELS[2]),/4–6/);
});
test('level selection leaves a seasonal run using the correct campaign difficulty and preserves owned growth',()=>{
 const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.forest.levels.oak=3;g.startEvent('harvest-canopy');
 assert.ok(beginCampaignLevel(g,6));assert.equal(g.mode,'campaign');assert.equal(g.isVeteran,true);assert.equal(g.chapter,2);assert.equal(g.forest.levels.oak,3);
 assert.ok(beginCampaignLevel(g,2));assert.equal(g.isVeteran,false);assert.equal(g.chapter,1);
});
