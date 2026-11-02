import {fileURLToPath} from 'node:url';
import {Game,TOWERS,CHAPTERS} from '../src/engine.js';
import {MIXED_PLACEMENTS} from './balance-audit.mjs';
export const STRUCTURE_PROFILES={
 heldWatch:MIXED_PLACEMENTS.slice(0,2).map(([,pad])=>['watchtower',pad]),
 watchOnly:MIXED_PLACEMENTS.map(([,pad])=>['watchtower',pad]),
 cannonOnly:MIXED_PLACEMENTS.map(([,pad])=>['cannon',pad]),
 guardians:MIXED_PLACEMENTS,
 adapted:MIXED_PLACEMENTS.map(([type,pad])=>[pad===0?'mushroom':pad===5?'cypress':[7,9].includes(pad)?'watchtower':pad===3?'cannon':type,pad]),
 mixed:MIXED_PLACEMENTS.map(([type,pad])=>[[5,7,9].includes(pad)?'watchtower':pad===3?'cannon':type,pad])
};
export function structureTrial({chapter,difficulty,level,profile,reload=false}){
 let g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.forest.bestWaves=[10,10,10];g.forest.unlocked=Object.keys(TOWERS);g.forest.levels=Object.fromEntries(Object.keys(TOWERS).map(t=>[t,level]));g.startCampaign(difficulty);g.chooseChapter(chapter);
 const rows=[];for(let wave=1;wave<=10&&g.phase!=='defeat';wave++){
  for(const[type,pad]of STRUCTURE_PROFILES[profile])if(!g.towers.some(t=>t.pad===pad))g.place(type,pad);
  g.startWave();let steps=0;while(g.phase==='running'&&steps++<20000){g.step(.05);g.events=[];if(reload&&steps===40){g=Game.restore(g.snapshot());if(g.phase==='paused')g.pause();}}
  if(g.phase==='running')throw Error('Unfinished wave');rows.push({wave,health:g.health,towers:g.towers.length});
 }
 return {chapter:chapter+1,difficulty,level,profile,wave:rows.at(-1).wave,outcome:g.phase,health:g.health,towers:g.towers.length,rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const results=[];for(const difficulty of ['standard','veteran'])for(const level of [1,3])for(let chapter=0;chapter<CHAPTERS.length;chapter++)for(const profile of Object.keys(STRUCTURE_PROFILES))results.push(structureTrial({chapter,difficulty,level,profile}));
 console.log(JSON.stringify(results,null,2));
}
