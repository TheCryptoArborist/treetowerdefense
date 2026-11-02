import {CHAPTERS} from './engine.js';
export const CAMPAIGN_LEVELS=Object.freeze(['standard','veteran'].flatMap((difficulty,group)=>CHAPTERS.map((chapter,i)=>Object.freeze({number:group*3+i+1,chapter:i,difficulty,name:chapter.name}))));
export function campaignLevelState(game,level){
 const veteran=level.difficulty==='veteran';
 return {...level,unlocked:game.access&&(veteran?game.veteranUnlocked:level.chapter<=game.unlockedChapter),stars:(veteran?game.veteranStars:game.forest.stars)[level.chapter],active:!game.isEvent&&game.chapter===level.chapter&&game.isVeteran===veteran};
}
export function levelUnlockText(level){
 if(level.difficulty==='veteran')return 'Veteran mastery · reinforced beetles, faster swarms and enraging bosses. Three stars at 80+ health.';
 return ['Unlocks: Palm at wave 2 · Cypress at wave 4 · Mushroom at wave 6 · Archer Watchtower on victory.','Unlock: Sap Cannon on victory. Willow unlocks at four total campaign stars.','Unlocks: Veteran levels 4–6 on victory after protecting all three forests.'][level.chapter];
}
export function beginCampaignLevel(game,number){
 const level=CAMPAIGN_LEVELS.find(l=>l.number===number);
 if(!level||!campaignLevelState(game,level).unlocked)return false;
 if(game.difficulty===level.difficulty&&!game.isEvent)return game.chooseChapter(level.chapter);
 if(!game.startCampaign(level.difficulty))return false;
 return level.chapter===0||game.chooseChapter(level.chapter);
}
