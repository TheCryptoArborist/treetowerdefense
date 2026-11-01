import { fileURLToPath } from 'node:url';
import { Game, TOWERS, CHAPTERS } from '../src/engine.js';
import { MIXED_PLACEMENTS } from './balance-audit.mjs';

export const VETERAN_PROFILES = {
  held: { label: 'Hold two Ancient defenders', placements: MIXED_PLACEMENTS.slice(0, 2) },
  pines: { label: 'Expand Ancient Pines', placements: MIXED_PLACEMENTS.map(([, pad]) => ['pine', pad]) },
  mixed: { label: 'Expand Ancient mixed formation', placements: MIXED_PLACEMENTS },
  counters: { label: 'Expand Ancient piercing formation', placements: MIXED_PLACEMENTS.map(([type, pad]) => [[5, 7, 9].includes(pad) ? 'watchtower' : pad === 3 ? 'cannon' : type, pad]) }
};

// Deterministic formations test counterplay, not human skill or live purchases.
export function simulateVeteran(chapter, profile, { reload = false } = {}) {
  let game = new Game();
  game.allowPreview();
  game.forest.stars = [3, 3, 3];
  game.forest.bestWaves = [10, 10, 10];
  game.forest.unlocked = Object.keys(TOWERS);
  game.forest.levels = Object.fromEntries(Object.keys(TOWERS).map(type => [type, 3]));
  game.startCampaign('veteran');
  if (!game.chooseChapter(chapter)) throw new Error('Invalid audit chapter');
  const funds = game.tree, rows = [];
  for (let wave = 1; wave <= game.waveCount && game.phase !== 'defeat'; wave++) {
    for (const [type, pad] of profile.placements) if (!game.towers.some(t => t.pad === pad)) game.place(type, pad);
    if (!game.startWave()) throw new Error('Audit wave did not start');
    let steps = 0, leaks = 0;
    while (game.phase === 'running' && steps++ < 20000) {
      game.step(.05);
      leaks += game.events.filter(e => e.type === 'leak').length;
      game.events = [];
      // Reload once per wave with living enemies, then resume normally.
      if (reload && steps === 40) {
        const restored = Game.restore(game.snapshot());
        if (!restored) throw new Error('Audit save could not restore');
        game = restored;
        if (game.phase === 'paused') game.pause();
      }
    }
    if (game.phase === 'running') throw new Error('Audit wave did not finish');
    rows.push({ wave, health: game.health, leaks, towers: game.towers.length, phase: game.phase });
  }
  return { rows, phase: game.phase, health: game.health, treeSpent: funds - game.tree, stars: game.veteranStars[chapter] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('| Formation (owned Ancient growth) | Chapter | Last wave | Outcome | Health | TREE spent |');
  console.log('| --- | --- | ---: | --- | ---: | ---: |');
  for (const profile of Object.values(VETERAN_PROFILES)) for (let chapter = 0; chapter < CHAPTERS.length; chapter++) {
    const result = simulateVeteran(chapter, profile);
    console.log(`| ${profile.label} | ${CHAPTERS[chapter].name} | ${result.rows.at(-1).wave} | ${result.phase} | ${result.health} | ${result.treeSpent} |`);
  }
}
