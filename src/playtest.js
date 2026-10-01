import { TOWERS, PRICES, GROWTH_NAMES, waveLineup } from './engine.js';

const PEST_GUIDE = {
  termite: { name: 'Termites', trait: 'Steady march', counter: 'Pine gives reliable coverage; Oak hits clusters.' },
  moth: { name: 'Moths', trait: 'Fast movers', counter: 'Palm slows fast moths so your other guardians can finish them.' },
  beetle: { name: 'Beetles', trait: 'Armored', counter: 'Beetles resist direct hits. Add sustained attacks and Mushroom poison.' },
  blight: { name: 'Blight pests', trait: 'Extra health', counter: 'Cypress reaches distant pests; permanent species growth adds damage.' },
  boss: { name: 'Blight King', trait: 'Final boss', counter: 'The Blight King hits the Tree of Life hard. Combine damage and Palm slows.' },
};

export function scoutWave(chapter, wave) {
  const lineup = waveLineup(chapter, wave);
  const groups = Object.entries(PEST_GUIDE).flatMap(([kind, info]) => {
    const count = lineup.filter(pest => pest === kind).length;
    return count ? [{ kind, count, ...info }] : [];
  });
  const priority = ['boss', 'moth', 'beetle', 'blight', 'termite'];
  const threat = priority.map(kind => groups.find(group => group.kind === kind)).find(Boolean);
  return { wave, total: lineup.length, groups, tip: threat?.counter ?? '' };
}

export function starterTip(game) {
  if (game.wave > 1 || game.phase === 'victory' || game.wave >= 1 && game.phase === 'build') {
    return { key: 'done', step: 4, title: 'Your first wave is clear.', text: 'Use earned Sap to expand your defense. Scout the next wave, try the other guardians, and grow your forest.', action: 'Keep playing' };
  }
  if (game.phase === 'defeat') {
    return { key: 'recover', step: 4, title: 'Give your roots another chance.', text: 'A fresh run is included with NFTree access. Try Pine at site 1 and Oak at site 2. A continue costs 20,000 preview TREE.', action: 'Start a fresh run' };
  }
  if (game.wave > 0) {
    return { key: 'watch', step: 4, title: game.phase === 'paused' ? 'Resume when you are ready.' : 'Watch your guardians defend.', text: 'They attack automatically. You can plant more during battle using earned Sap. No TREE purchase is needed for this guided start.', action: game.phase === 'paused' ? 'Resume battle' : 'Show battlefield' };
  }
  if (game.towers.length === 0) {
    return { key: 'plant', step: 1, title: 'Plant your first guardian.', text: 'Choose Pine, then site 1 near the entrance. Planting uses earned Sap. The glowing ring marks the suggested site.', action: 'Choose Pine · 80 Sap', tower: 'pine', pad: 0 };
  }
  if (game.towers.length === 1) {
    return { key: 'reinforce', step: 2, title: 'Give your guardian a teammate.', text: 'Oak at site 2 covers the first bend with splash damage. You can choose any defender or open site; the guide follows your progress.', action: 'Choose Oak · 105 Sap', tower: 'oak', pad: game.towers.some(tower => tower.pad === 1) ? 0 : 1 };
  }
  return { key: 'launch', step: 3, title: 'Send your first wave.', text: 'Your team is ready. Scout the eight incoming termites below, then send wave 1. New runs have no admission fee.', action: 'Show wave button' };
}

export function purchaseQuote(game, kind, towerId = null) {
  let cost, title, description, reason = '';
  const active = ['build', 'running', 'paused'].includes(game.phase);
  if (kind === 'upgrade') {
    const tower = game.towers.find(item => item.id === towerId);
    if (!tower || tower.level >= 3) return { available: false, reason: 'This guardian cannot grow further.' };
    cost = game.upgradeCost(tower);
    title = `Grow all ${TOWERS[tower.type].name} guardians`;
    description = `${GROWTH_NAMES[tower.level - 1]} → ${GROWTH_NAMES[tower.level]}. Applies to every current and future ${TOWERS[tower.type].name}, and stays across runs.`;
    if (!active) reason = 'Start or resume a run before growing guardians.';
  } else if (Object.hasOwn(PRICES, kind)) {
    cost = PRICES[kind];
    const descriptions = {
      shield: ['Root Shield', 'Set your current run’s root shield to 50 extra protection. It does not carry into a fresh run.'],
      fertilizer: ['Fertilizer', '+50% guardian damage for 20 battle seconds. The timer waits while battle is paused.'],
      storm: ['Leaf Storm', 'Deal 180 damage to every pest currently on the path. This is one immediate use.'],
      continue: ['Continue this run', 'Restore the Tree of Life to 100 health and keep your wave, enemies, towers, and permanent growth. The root shield resets to zero.'],
    };
    [title, description] = descriptions[kind];
    if (kind === 'continue' && game.phase !== 'defeat') reason = 'Continues are available after defeat.';
    else if (kind !== 'continue' && !active) reason = 'Start or resume a run before using supplies.';
    else if (kind === 'shield' && game.shield >= 50) reason = 'Root Shield is already full.';
    else if (kind === 'fertilizer' && game.boostUntil > game.time) reason = 'Fertilizer is already active.';
    else if (kind === 'storm' && (game.phase !== 'running' || !game.enemies.length)) reason = 'Use Leaf Storm while pests are on the path and battle is running.';
  } else return { available: false, reason: 'Unknown purchase.' };
  if (!game.access) reason = 'Choose your simulated NFTree access first.';
  else if (game.tree < cost) reason = 'Not enough preview TREE.';
  return { kind, title, description, cost, balance: game.tree, balanceAfter: game.tree - cost, available: !reason, reason };
}

// Opening/canceling a review never spends. The engine rechecks eligibility at
// confirmation; a review cannot be reused after a successful purchase or new run.
export class PurchaseReview {
  #game; #towers; #kind; #towerId; #cost; #consumed = false;
  constructor(game, kind, towerId = null) {
    this.#game = game; this.#towers = game.towers; this.#kind = kind; this.#towerId = towerId;
    this.#cost = purchaseQuote(game, kind, towerId).cost;
  }
  details() {
    const quote = purchaseQuote(this.#game, this.#kind, this.#towerId);
    if (this.#consumed) return { ...quote, available: false, reason: 'This purchase has already been applied.' };
    if (this.#game.towers !== this.#towers || quote.cost !== this.#cost) return { ...quote, available: false, reason: 'The run or upgrade changed. Close this review and choose again.' };
    return quote;
  }
  confirm() {
    if (!this.details().available) return false;
    const done = this.#kind === 'upgrade' ? this.#game.upgrade(this.#towerId) : this.#kind === 'continue' ? this.#game.continueRun() : this.#game.supply(this.#kind);
    if (done) this.#consumed = true;
    return done;
  }
}
