import { fileURLToPath } from 'node:url';
import { Game, TOWERS, CHAPTERS } from '../src/engine.js';

export const MIXED_PLACEMENTS = [
  ['pine',0],['oak',1],['pine',2],['palm',4],['cypress',11],['mushroom',6],
  ['pine',5],['oak',8],['pine',7],['pine',9],['cypress',10],['pine',3]
];
export const BALANCE_PROFILES = {
  starterHeld: { label:'Starter held', placements:MIXED_PLACEMENTS.slice(0,2), mode:'held' },
  measured: { label:'One addition per wave', placements:MIXED_PLACEMENTS, mode:'measured' },
  sapMixed: { label:'Spend Sap on mixed coverage', placements:MIXED_PLACEMENTS, mode:'all' },
  ancientHeld: { label:'Three Ancient Pines held', placements:[0,1,2].map(p=>['pine',p]), mode:'held', grow:true },
  grownPines: { label:'Expand Ancient Pines', placements:[0,1,2,4,5,6,11,8,7,9,10,3].map(p=>['pine',p]), mode:'all', grow:true }
};

// Fixed placements are representative engine scenarios, not a model of human skill.
export function simulateDefense(chapter, profile) {
  const game = new Game(); game.allowPreview();
  game.forest.stars = CHAPTERS.map((_,i)=>i<chapter?3:0);
  if (!game.chooseChapter(chapter)) throw new Error('Invalid audit chapter');
  const rows = [];
  for (let wave=1; wave<=10 && game.phase!=='defeat'; wave++) {
    const placements = profile.mode==='measured' ? profile.placements.slice(0,wave+1) : profile.placements;
    for (const [type,pad] of placements) if (!game.towers.some(t=>t.pad===pad) && game.sap>=TOWERS[type].cost) game.place(type,pad);
    if (profile.grow) for (const tower of game.towers) while (tower.level<3 && game.tree>=game.upgradeCost(tower)) game.upgrade(tower.id);
    if (!game.startWave()) throw new Error('Audit wave did not start');
    let leaks=0,steps=0;
    while (game.phase==='running' && steps++<15000) {
      game.step(.05); leaks+=game.events.filter(e=>e.type==='leak').length; game.events=[];
    }
    if (game.phase==='running') throw new Error('Audit wave did not finish');
    rows.push({ wave,health:game.health,leaks,towers:game.towers.length,sap:game.sap,phase:game.phase });
  }
  return { rows,phase:game.phase,health:game.health,treeSpent:150000-game.tree,snapshot:game.snapshot() };
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  console.log('| Scenario | Chapter | Last wave | Outcome | Life | TREE spent |');
  console.log('| --- | --- | ---: | --- | ---: | ---: |');
  for (const profile of Object.values(BALANCE_PROFILES)) for (let chapter=0;chapter<CHAPTERS.length;chapter++) {
    const result=simulateDefense(chapter,profile);
    console.log(`| ${profile.label} | ${CHAPTERS[chapter].name} | ${result.rows.at(-1).wave} | ${result.phase} | ${result.health} | ${result.treeSpent} |`);
  }
}
