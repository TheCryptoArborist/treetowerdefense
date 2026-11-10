import { TOWERS, PRICES, GROWTH_NAMES, waveLineup, eventLineup, pestTier, MINI_BOSSES, miniBossFor } from './engine.js';

const PEST_GUIDE = {
  termite: { name: 'Termites', trait: 'Steady march', counter: 'Pine gives reliable coverage; Oak hits clusters.' },
  moth: { name: 'Moths', trait: 'Fast movers · short dashes', counter: 'Moths dash 20% faster for 0.65 seconds every four seconds, starting two seconds after arrival. Palm slows still work during a dash; Fastest targeting follows their current speed.' },
  beetle: { name: 'Beetles', trait: 'Armored', counter: 'Beetles resist direct hits. Add sustained coverage; unlocked poison or armor-piercing defenders offer other options.' },
  blight: { name: 'Blight pests', trait: 'Extra health · regeneration', counter: 'After two seconds without a hit, blight recovers 0.6% maximum health per second. Sustained attacks delay recovery; Mushroom poison suppresses it.' },
  boss: { name: 'Blight King', trait: 'Final boss', counter: 'The Blight King hits the Tree of Life hard. Combine damage and Palm slows.' },
};

const WAVE_BRIEFINGS = [
  ['First roots', 'Eight termites approach. Pine and Oak can cover the opening bends; watch their reach before expanding.'],
  ['Armored advance', 'Two armored beetles join the termites. They take more hits: extend your coverage using earned Sap.'],
  ['Moth rush', 'Fast moths arrive alongside beetles. Palm can slow them; a guardian farther along the route catches survivors.'],
  ['Blight arrives', 'Tougher blight pests recover between attacks. Extend Pine and Oak coverage and support them with Palm slows. Clearing this wave earns Cypress on a fresh roster.'],
  ['Mixed assault', 'Armor, speed, and blight attack together. Plant beyond the entrance and combine guardian roles.'],
  ['Pressure builds', 'More armored and blight pests crowd the route. Keep blight under fire; clearing this wave earns Mushroom poison to suppress recovery.'],
  ['Swarming wings', 'Five fast moths dash with a tougher escort. Try Palm slows and Fastest targeting on a rapid-fire defender.'],
  ['Heavy escort', 'Six beetles and six moths test your defense together. Check slow support and damage coverage before sending them.'],
  ['Last stand', 'The largest mixed escort so far approaches. Poison suppresses blight recovery while armor-piercing bolts handle beetles. Prepare for the King next.'],
  ['Blight King', 'The King follows a mixed escort. Combine damage, poison, and Palm slows; protect the final bends.']
];
const VETERAN_BRIEFINGS = [
  ['Veteran first roots', 'The opening termites are tougher and faster. Use overlapping coverage and expand with earned Sap.'],
  ['Reinforced advance', 'Reinforced beetles resist ordinary direct hits by an extra 30%. Watchtower and Cypress bypass that extra shell; poison damage also bypasses it.'],
  ['Veteran moth rush', 'Faster moths race alongside reinforced beetles. Combine Palm slows, Fastest targeting and piercing coverage.'],
  ['Relentless blight', 'Blight regenerates between hits while reinforced beetles absorb ordinary fire. Keep Mushroom poison and overlapping coverage along the route.'],
  ['Combined pressure', 'Armor, speed and regeneration arrive together with shorter gaps. Spread different defender roles across the bends.'],
  ['Pierce the escort', 'The reinforced escort needs sustained damage. Pair Watchtower or Cypress with poison and protect the final bends.'],
  ['Veteran wing surge', 'Dashing moths lead a tougher escort. Use Fastest targeting on a rapid-fire defender and keep Palm slows near survivors.'],
  ['Break the shell', 'Beetles and moths pressure the route together. Combine piercing damage with slows instead of filling every site with the same defender.'],
  ['Hold the rear', 'The final mixed escort tests your whole formation. Cover the exit and prepare slows for the boss next.'],
  ['Enraging Blight King', 'The King moves another 30% faster below half health. Keep Palm slows and damage on the final bends; piercing and poison handle its escort.']
];
function pestDetails(kind, veteran) {
  const info = PEST_GUIDE[kind];
  if (!veteran) return info;
  if (kind === 'beetle') return { ...info, trait: 'Reinforced shell · extra 30% direct-hit resistance', counter: 'Watchtower and Cypress bypass the extra shell; poison damage bypasses direct-hit resistance. Keep sustained coverage for the remaining armor.' };
  if (kind === 'boss') return { ...info, trait: 'Enrages below half health · +30% speed', counter: 'The King accelerates below half health. Reserve Palm slows and overlapping damage for the final bends.' };
  return info;
}
export function scoutWave(chapter, wave, enemyRules = 1, mode = 'campaign', difficulty = 'standard', encounters=enemyRules===1?1:0,eventVersion=2) {
  const harvest=mode==='harvest-canopy',event = harvest||mode==='haunted-grove';
  const veteran = difficulty === 'veteran' && !event;
  const lineup = event ? eventLineup(wave,mode) : waveLineup(chapter, wave, encounters);
  const groups = Object.entries(PEST_GUIDE).flatMap(([kind, info]) => {
    const count = lineup.filter(pest => pest === kind).length;
    const legacy = enemyRules === 0 && ['moth','blight'].includes(kind);
    let details = legacy ? { ...info, trait: kind === 'moth' ? 'Fast movers' : 'Extra health', counter: kind === 'moth' ? 'Palm slows fast moths so other defenders can finish them.' : 'Maintain damage coverage against extra health. This saved run uses the original pest rules.' } : pestDetails(kind, veteran);
    if(harvest)details={...details,name:{termite:'Leaf borers',beetle:'Bark beetles',moth:'Autumn moths',blight:'Harvest blight',boss:'Hollow Harvester'}[kind]};
    if(harvest&&eventVersion===2){const names={termite:'Seed thieves',beetle:'Gourdback beetles',moth:'Maple-wing moths',blight:'Rot gourds',boss:'Hollow Harvester'};details={...details,name:names[kind]};if(kind==='termite')Object.assign(details,{trait:'Steals 8 Sap once at the middle seed cache',counter:'Defeat it on the early bends before it raids your cache.'});if(kind==='boss')Object.assign(details,{trait:'Releases two seed thieves at 65% and 30% health',counter:'Four extra thieves may appear on its route. Keep later bends covered.'});}
    if(!harvest&&event)details={...details,name:{termite:'Dusk termites',beetle:'Hollow beetles',moth:'Dusk moths',blight:'Webbed blight',boss:'Hollow King'}[kind]};
    const miniBoss=kind==='boss'?miniBossFor(chapter,wave,mode,encounters):null;
    if(miniBoss)details={...MINI_BOSSES[miniBoss],trait:MINI_BOSSES[miniBoss].trait+(veteran?' · Enrages below half health':''),miniBoss};
    const appearanceTier=pestTier(chapter,wave,mode);
    return count ? [{ kind, count, ...details, appearanceTier, trait:enemyRules===0?details.trait:`${['Broodling','Hardened','Elite'][appearanceTier]} · ${details.trait}` }] : [];
  });
  const eventBriefings=[['Lantern watch','Dusk termites and two moths test the entrance. Start with Pine and Oak, then reinforce a later bend.'],['Hollow armor','Four armored beetles approach. The earned Watchtower ignores their armor; sustained fire also works.'],['Dusk swarm','Dense termites and six dashing moths approach. Oak splash and Palm slows help cover the rush.'],['Webbed escort','Blight regenerates between hits. Mushroom poison suppresses recovery; keep several bends covered.'],['Hollow King','The Hollow King follows twenty escorts. Spread damage and slows along the route. Finish with 80 health for Lantern Oak; use three defender types for the web-carved Watchtower.']];
  const harvestBriefings=[['Seed watch','Leaf borers and two armored bark beetles approach. Start with Pine and Oak.'],['Bark armor','Five beetles test your sustained damage. Watchtower armor-piercing bolts help break the escort.'],['Autumn flight','Seven dashing moths surge between beetles. Use Palm slows and overlapping coverage.'],['Blighted harvest','Five blight pests regenerate between hits. Mushroom poison suppresses recovery.'],['Hollow Harvester','The Harvester follows twenty escorts. Spread damage along the route. Finish at 80 health for Copperleaf Oak, use three defender types for Harvest banners, or finish at 100 for the amber Tree of Life.']];
  let [title, tip] = lineup.length ? (harvest?harvestBriefings:event?eventBriefings:veteran?VETERAN_BRIEFINGS:WAVE_BRIEFINGS)[wave-1] : ['', ''];
  if(harvest&&eventVersion===2&&lineup.length)tip='AUTUMN ORCHARD · Seed thieves steal 8 Sap at the marked cache. A four-second tailwind follows each ten calm seconds (+25% enemy speed); Palm slows help. '+(wave===5?'The Hollow Harvester releases two extra seed thieves at 65% and 30% health.':'Guard early bends to protect your Sap; build a second line for wind rushes.');
  const mini=miniBossFor(chapter,wave,mode,encounters);
  return { wave, title:mini?MINI_BOSSES[mini].name+' incoming':title, total: lineup.length, groups, tip: mini?MINI_BOSSES[mini].counter+' Defeat it for 150 Sap; a breach costs 25 health. '+(veteran?'':tip+' ')+(veteran?'VETERAN · 2.4× health · 18% faster; enrages below half health.':''):enemyRules === 0 && lineup.length ? 'This saved run keeps the original pest rules: moths move at a steady speed and blight has extra health without regeneration. Extend coverage along the route.' : veteran && lineup.length ? `VETERAN · 2.4× health · 18% faster movement · 30% shorter spawn gaps. ${tip}` : tip };
}

export function starterTip(game) {
  if (game.wave > 1 || game.phase === 'victory' || game.wave >= 1 && game.phase === 'build') {
    return { key: 'done', step: 4, title: 'Your first wave is clear.', text: 'Use earned Sap to expand your defense. Scout the next wave, try the other guardians, and grow your forest.', action: 'Keep playing' };
  }
  if (game.phase === 'defeat') {
    return { key: 'recover', step: 4, title: 'Give your roots another chance.', text: 'A fresh run is included with NFTree access. Try Pine at site 1 and Oak at site 2. A continue costs 20,000 preview TREE.', action: 'Start a fresh run' };
  }
  if (game.wave > 0) {
    return { key: 'watch', step: 4, title: game.phase === 'paused' ? 'Resume when you are ready.' : 'Watch your guardians defend.', text: 'Watch the pests move along the stone path. Your defenders attack automatically. Each pest that reaches the Tree of Life lowers its health; zero health ends the run. Defeating pests earns Sap for more defenders. No TREE purchase is needed for this tutorial.', action: game.phase === 'paused' ? 'Resume battle' : 'Show battlefield' };
  }
  if (game.towers.length === 0) {
    return { key: 'plant', step: 1, title: 'Plant your first guardian.', text: 'Protect the Tree of Life at the end of the stone path. Press Choose Pine below, then tap Site 1 in the opened build-site list or its glowing ring on the map. This spends 80 of your starting 300 Sap. Pests cannot arrive until you send a wave.', action: 'Choose Pine · 80 Sap', tower: 'pine', pad: 0 };
  }
  if (game.towers.length === 1) {
    return { key: 'reinforce', step: 2, title: 'Give your guardian a teammate.', text: 'Your first defender is planted! Press Choose Oak below, then tap the highlighted empty site. Oak hits groups of pests. Planting costs 105 Sap; Sap is earned during play and is separate from wallet TREE.', action: 'Choose Oak · 105 Sap', tower: 'oak', pad: game.towers.some(tower => tower.pad === 1) ? 0 : 1 };
  }
  return { key: 'launch', step: 3, title: 'Send your first wave.', text: 'Your defenders are ready. Press Show wave button, then Send wave 1 to let the pests enter. Defenders attack automatically whenever pests come within reach. You do not need to aim or shoot.', action: 'Show wave button' };
}

export function purchaseQuote(game, kind, towerId = null) {
  let cost, title, description, reason = '';
  const active = ['build', 'running', 'paused'].includes(game.phase);
  if (kind === 'upgrade') {
    const tower = game.towers.find(item => item.id === towerId);
    if (!tower || tower.level >= 3) return { available: false, reason: 'This guardian cannot grow further.' };
    cost = game.upgradeCost(tower);
    title = game.collection?`Grow ${TOWERS[tower.type].name} #${tower.defenderSlot+1}`:`Grow all ${TOWERS[tower.type].name} guardians`;
    description = `${GROWTH_NAMES[tower.level - 1]} → ${GROWTH_NAMES[tower.level]}. ${game.collection?'Only this numbered defender improves; its level stays across runs.':`Applies to every current and future ${TOWERS[tower.type].name}, and stays across runs.`}`;
    if (!active) reason = 'Start or resume a run before growing guardians.';
  } else if (Object.hasOwn(PRICES, kind)) {
    cost = PRICES[kind];
    const descriptions = {
      shield: ['Root Shield', 'Protect the Tree of Life: absorb up to 50 damage from pests that reach it before it loses health. Refills your shield to 50; it does not stack above 50, restore lost health, or carry into a new run.'],
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


const REWARD_NAMES = { 'harvest-badge':'Harvest Defender badge','copperleaf-oak':'Copperleaf Oak look','harvest-watchtower':'Harvest Watchtower banners','amber-life-tree':'Amber Tree of Life look', 'grove-badge': 'Grove Defender badge', 'lantern-oak': 'Lantern Oak look', 'web-watchtower': 'Web-carved Watchtower look' };
export function battleReport(game) {
  const r = game.runReport;
  const leaks = Object.entries(r.leaks).filter(([,count]) => count > 0).map(([kind,count]) => ({ kind, count, name: kind === 'boss' && game.isEvent ? game.bossName : PEST_GUIDE[kind].name, counter: pestDetails(kind, game.isVeteran).counter }));
  const worst = [...leaks].sort((a,b) => b.count-a.count)[0];
  const next = Object.keys(TOWERS).find(type => !game.isUnlocked(type));
  let goal = next ? `${TOWERS[next].name}: ${game.unlockStatus(next).label} (${game.unlockStatus(next).current}/${game.unlockStatus(next).goal}).` : 'Full roster earned. Improve chapter stars or try another defender combination.';
  if (game.isEvent) goal = !game.seasonRewards.includes('grove-badge') ? 'Clear all five Haunted Grove waves to earn the Grove Defender badge.' : !game.seasonRewards.includes('lantern-oak') ? 'Finish Haunted Grove with at least 80 health to earn Lantern Oak.' : !game.seasonRewards.includes('web-watchtower') ? 'Win Haunted Grove after planting three defender types to earn the Web-carved Watchtower.' : 'All Haunted Grove rewards earned. Equip your looks in the event panel.';
  if(game.isHarvest)goal=game.harvestRewards.length===4?'All Harvest rewards earned. Equip your looks in the event panel.':'Protect five Harvest waves; finish at 80 health for Copperleaf Oak, plant three defender types for Harvest banners, and finish at 100 health for the amber Tree of Life.';
  if(game.isVeteran){
    const stars=game.veteranStars.reduce((a,b)=>a+b,0);
    goal=stars===9?'All nine Veteran stars earned. Try a different formation or return for seasonal challenges.':`Earn all nine Veteran stars (${stars}/9). Finish each chapter with at least 80 health for three stars. Counter shells with piercing and poison; reserve slow coverage for enraging bosses.`;
  }
  return { ...r, leaks, earned: [...r.unlocks.map(type => TOWERS[type].name), ...r.rewards.map(reward => REWARD_NAMES[reward])], goal,
    tip: worst ? worst.counter : 'Your defense stopped every recorded pest. Try a different formation or pursue your next unlock.' };
}
