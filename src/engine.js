export const WIDTH = 1000;
export const HEIGHT = 720;
export const PATH = [[-35, 215], [265, 215], [265, 145], [635, 145], [635, 355], [875, 355], [875, 545], [515, 545], [515, 430], [80, 430], [80, 640], [940, 640]];
export const PADS = [[130, 135], [345, 225], [540, 230], [740, 170], [735, 305], [525, 350], [355, 350], [170, 510], [370, 510], [620, 620], [800, 625], [945, 445]];
export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', '1-of-1'];
export const STYLES = [
  { name: 'Woodland', canopy: '#6cae54', accent: '#c9e38e', bark: '#82553b', detail: 'Natural bark & green canopy' },
  { name: 'Bloom', canopy: '#cf728e', accent: '#ffd3df', bark: '#935c49', detail: 'Flowering canopy & seasonal color' },
  { name: 'Enchanted', canopy: '#735cc7', accent: '#b7a5ff', bark: '#5a407c', detail: 'Glowing veins & floating leaves' },
  { name: 'Gilded', canopy: '#cfa74e', accent: '#ffe4a0', bark: '#98742a', detail: 'Golden accents & animated runes' },
  { name: 'Celestial', canopy: '#4cbbb1', accent: '#b7ffef', bark: '#3c7a8c', detail: 'Shimmering roots & orbiting stars' },
  { name: 'Signature', canopy: '#e297b9', accent: '#fff3c8', bark: '#88557f', detail: 'Signature preview; bespoke NFT art later' },
];
export const TOWERS = {
  oak: { name: 'Oak', role: 'Root shockwave', cost: 105, range: 155, damage: 38, interval: 1.2, color: '#78ad57', icon: '◉', description: 'Heavy splash damage to clustered pests.' },
  pine: { name: 'Pine', role: 'Needle barrage', cost: 80, range: 185, damage: 18, interval: 0.48, color: '#58bda0', icon: '▲', description: 'Fast attacks with dependable single-target damage.' },
  palm: { name: 'Palm', role: 'Wind snare', cost: 90, range: 180, damage: 12, interval: 0.85, color: '#a0c96c', icon: '✳', description: 'Slows a target for two seconds with every hit.' },
  cypress: { name: 'Cypress', role: 'Piercing roots', cost: 120, range: 230, damage: 42, interval: 1.1, color: '#64a8cf', icon: '◆', description: 'Long-range strikes that hit a second nearby pest.' },
  mushroom: { name: 'Mushroom', role: 'Spore cloud', cost: 100, range: 155, damage: 10, interval: 1.0, color: '#c58bce', icon: '●', description: 'Poisons nearby pests for damage over time.' },
  willow: { name: 'Willow', role: 'Chain pulse', cost: 145, range: 190, damage: 30, interval: 1.15, color: '#9ac6bd', icon: 'ϟ', description: 'A charged branch pulse jumps to two nearby pests for 65% then 40% damage.' },
  watchtower: { name: 'Archer Watchtower', role: 'Armor-piercing bolt', cost: 160, range: 275, damage: 54, interval: 1.4, color: '#c6b183', icon: '⌂', structure: true, description: 'A mounted bow fires long-range bolts that ignore beetle armor.' },
  cannon: { name: 'Sap Cannon', role: 'Sap bombardment', cost: 180, range: 200, damage: 66, interval: 1.9, color: '#d2a35d', icon: '●', structure: true, description: 'Slow heavy shells splash nearby pests for 70% damage within 95 range.' },
};
export const ORIGINAL_GUARDIANS = Object.freeze(['oak', 'pine', 'palm', 'cypress', 'mushroom']);
export const UNLOCKS = Object.freeze({
  oak: { label: 'Starter guardian', kind: 'starter' },
  pine: { label: 'Starter guardian', kind: 'starter' },
  palm: { label: 'Clear wave 2 in Emerald Crossing', kind: 'wave', chapter: 0, wave: 2 },
  cypress: { label: 'Clear wave 4 in Emerald Crossing', kind: 'wave', chapter: 0, wave: 4 },
  mushroom: { label: 'Clear wave 6 in Emerald Crossing', kind: 'wave', chapter: 0, wave: 6 },
  willow: { label: 'Earn 4 campaign stars', kind: 'stars', stars: 4 },
  watchtower: { label: 'Protect Emerald Crossing', kind: 'chapter', chapter: 0 },
  cannon: { label: 'Protect Sunpetal Meadow', kind: 'chapter', chapter: 1 },
});
export const PRICES = Object.freeze({ shield: 3000, fertilizer: 5000, storm: 8000, continue: 20000 });
export const CHAPTERS = [
  { name: 'Emerald Crossing', subtitle: 'A small forest. A big beginning.', terrain: '#b5d87b', grass: '#a4c765', path: '#e1c998', difficulty: 1 },
  { name: 'Sunpetal Meadow', subtitle: 'Bring the meadow back to bloom.', terrain: '#d2db86', grass: '#a9c978', path: '#ead6a3', difficulty: 1.2 },
  { name: 'Moonlit Marsh', subtitle: 'Let your ancient forest shine.', terrain: '#9fc4b1', grass: '#7eafa4', path: '#c6cbb0', difficulty: 1.4 },
];
export const GROWTH_NAMES = ['Sapling', 'Guardian', 'Ancient'];
export const TARGET_MODES = Object.freeze({
  first: Object.freeze({ name: 'First', detail: 'Furthest along the route. Best for catching pests before they escape.' }),
  strongest: Object.freeze({ name: 'Strongest', detail: 'Most health remaining. Focus on tough pests and the Blight King.' }),
  fastest: Object.freeze({ name: 'Fastest', detail: 'Highest current movement speed, including slows. Intercept fast pests.' }),
});
const segments = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
export const PATH_LENGTH = segments.reduce((a, b) => a + b, 0);
export function pointAt(distance) {
  let remaining = Math.max(0, distance);
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= segments[i]) {
      const t = remaining / segments[i];
      return { x: PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * t, y: PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * t };
    }
    remaining -= segments[i];
  }
  return { x: PATH.at(-1)[0], y: PATH.at(-1)[1] };
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Deliberate mixes introduce one new threat at a time, then build combined pressure.
// Counts remain 8, 10, …, 26 (+ the final boss); rewards and save limits stay intact.
const WAVE_MIXES = [
  { termite:8, beetle:0, moth:0, blight:0 },
  { termite:8, beetle:2, moth:0, blight:0 },
  { termite:7, beetle:2, moth:3, blight:0 },
  { termite:6, beetle:3, moth:3, blight:2 },
  { termite:5, beetle:4, moth:4, blight:3 },
  { termite:5, beetle:5, moth:4, blight:4 },
  { termite:5, beetle:5, moth:5, blight:5 },
  { termite:5, beetle:6, moth:6, blight:5 },
  { termite:5, beetle:7, moth:6, blight:6 },
  { termite:5, beetle:8, moth:7, blight:6 }
];
// Armor gets a measured introduction, then gaps shorten as threats combine.
const SPAWN_INTERVALS = [1.05,1.4,1.2,1.05,.95,.85,.8,.75,.7,.65];
export function waveSpawnInterval(wave) {
  return Number.isInteger(wave) && wave >= 1 && wave <= 10 ? SPAWN_INTERVALS[wave-1] : null;
}
export function waveLineup(chapter, wave) {
  if (!Number.isInteger(chapter) || !CHAPTERS[chapter] || !Number.isInteger(wave) || wave < 1 || wave > 10) return [];
  const remaining = { ...WAVE_MIXES[wave-1] }, lineup = [];
  // Interleave a mixed escort, rather than hiding each threat at the back of the queue.
  while (Object.values(remaining).some(count => count > 0)) {
    for (const kind of ['termite','beetle','moth','blight']) if (remaining[kind] > 0) {
      lineup.push(kind); remaining[kind]--;
    }
  }
  if (wave === 10) lineup.push('boss');
  return lineup;
}

export class Game {
  constructor() {
    this.version = 2;
    this.tree = 150000; // Simulation balance only. Never a Sui balance.
    this.rarity = 0;
    this.style = 0;
    this.access = false;
    this.forest = { levels: Object.fromEntries(Object.keys(TOWERS).map(type => [type, 1])), stars: CHAPTERS.map(() => 0), rosterVersion: 1, bestWaves: CHAPTERS.map(() => 0), unlocked: ['oak', 'pine'] };
    this.chapter = 0;
    this.newRun();
  }
  newRun() {
    if (!Number.isFinite(this.tree)) this.tree = 150000;
    this.phase = 'build'; this.wave = 0; this.health = 100; this.shield = 0;
    this.sap = 300; this.score = 0; this.kills = 0; this.time = 0;
    this.towers = []; this.enemies = []; this.queue = []; this.shots = [];
    this.spawnTimer = 0; this.boostUntil = 0; this.nextId = 1;
    this.events = []; this.message = 'Place your defenders, then send the first wave.';
  }
  get unlockedChapter() {
    const first = this.forest.stars.findIndex(stars => stars === 0);
    return first === -1 ? CHAPTERS.length - 1 : first;
  }
  get forestRank() { return this.forest.stars.filter(stars => stars > 0).length; }
  isUnlocked(type) { return Object.hasOwn(TOWERS, type) && this.forest.unlocked.includes(type); }
  unlockStatus(type) {
    if (!Object.hasOwn(UNLOCKS, type)) return null;
    const rule = UNLOCKS[type], unlocked = this.isUnlocked(type);
    const current = rule.kind === 'stars' ? this.forest.stars.reduce((a,b) => a+b,0) : rule.kind === 'chapter' ? Number(this.forest.stars[rule.chapter] > 0) : rule.kind === 'wave' ? this.forest.bestWaves[rule.chapter] : 1;
    const goal = rule.stars ?? rule.wave ?? 1;
    return { unlocked, label: rule.label, current: Math.min(current, goal), goal };
  }
  refreshUnlocks(announce = true) {
    const earned = [];
    for (const type of Object.keys(TOWERS)) {
      const status = this.unlockStatus(type);
      if (!status.unlocked && status.current >= status.goal) {
        this.forest.unlocked.push(type); earned.push(type);
        if (announce) this.events.push({ type: 'roster-unlock', defender: type });
      }
    }
    return earned;
  }
  chooseChapter(chapter) {
    if (!this.access || !Number.isInteger(chapter) || chapter < 0 || chapter >= CHAPTERS.length || chapter > this.unlockedChapter) return false;
    this.chapter = chapter; this.newRun();
    this.message = `${CHAPTERS[chapter].name}: your permanent defender growth carries with you.`;
    return true;
  }
  allowPreview(rarity = 0) {
    if (!Number.isInteger(rarity) || rarity < 0 || rarity >= RARITIES.length) return false;
    this.access = true; this.rarity = rarity; this.style = Math.min(this.style, rarity);
    this.towers.forEach(t => { t.style = Math.min(t.style, rarity); });
    return true;
  }
  setStyle(style, towerId = null) {
    if (!this.access || !Number.isInteger(style) || style < 0 || style > this.rarity) return false;
    if (towerId !== null) {
      const tower = this.towers.find(t => t.id === towerId);
      if (!tower) return false;
      tower.style = style;
    } else this.style = style;
    return true;
  }
  place(type, pad) {
    if (!this.access || !['build', 'running', 'paused'].includes(this.phase) || !Object.hasOwn(TOWERS, type) || !Number.isInteger(pad) || !PADS[pad]) return false;
    if (!this.isUnlocked(type)) { this.message = `${TOWERS[type].name} locked. ${UNLOCKS[type].label}.`; return false; }
    if (this.towers.some(t => t.pad === pad)) return false;
    const definition = TOWERS[type];
    if (this.sap < definition.cost) { this.message = 'Earn more Sap by defeating pests.'; return false; }
    this.sap -= definition.cost;
    const [x, y] = PADS[pad];
    const tower = { id: this.nextId++, type, pad, x, y, level: this.forest.levels[type], cooldown: 0, style: this.style, targetMode: 'first' };
    this.towers.push(tower); this.message = `${definition.name} planted. Ready to defend.`;
    this.events.push({ type: 'plant', x, y });
    return tower;
  }
  setTargetMode(id, mode) {
    if (!this.access || !['build', 'running', 'paused'].includes(this.phase) || typeof mode !== 'string' || !Object.hasOwn(TARGET_MODES, mode)) return false;
    const tower = this.towers.find(t => t.id === id);
    if (!tower) return false;
    tower.targetMode = mode;
    this.message = `${TOWERS[tower.type].name} at site ${tower.pad + 1}: target ${TARGET_MODES[mode].name.toLowerCase()}.`;
    return true;
  }
  upgradeCost(tower) { return tower.level === 1 ? 5000 : 10000; }
  spend(cost) {
    if (!this.access || !Number.isInteger(cost) || cost < 0 || this.tree < cost) return false;
    this.tree -= cost; return true;
  }
  upgrade(id) {
    if (!['build', 'running', 'paused'].includes(this.phase)) return false;
    const tower = this.towers.find(t => t.id === id);
    if (!tower || tower.level >= 3) return false;
    if (!this.spend(this.upgradeCost(tower))) { this.message = 'Not enough preview TREE.'; return false; }
    this.forest.levels[tower.type] = tower.level + 1;
    for (const same of this.towers.filter(t => t.type === tower.type)) {
      same.level = this.forest.levels[tower.type]; this.events.push({ type: 'upgrade', x: same.x, y: same.y });
    }
    this.message = `All ${TOWERS[tower.type].name} defenders grew to ${GROWTH_NAMES[tower.level - 1]}. This upgrade stays for future runs.`;
    return true;
  }
  sell(id) {
    if (!['build', 'running', 'paused'].includes(this.phase)) return false;
    const tower = this.towers.find(t => t.id === id);
    if (!tower) return false;
    this.sap += Math.floor(TOWERS[tower.type].cost * 0.6);
    this.towers = this.towers.filter(t => t.id !== id);
    this.message = 'Defender removed. 60% of planting Sap returned; permanent species growth is kept.';
    return true;
  }
  startWave() {
    if (!this.access || this.phase !== 'build' || this.wave >= 10) return false;
    this.wave++; this.phase = 'running'; this.spawnTimer = 0;
    this.queue = waveLineup(this.chapter, this.wave);
    this.events.push({ type: 'wave-start', wave: this.wave, chapter: this.chapter });
    this.message = this.wave === 10 ? 'Final wave. The Blight King approaches!' : `Wave ${this.wave}: protect the Tree of Life.`;
    return true;
  }
  spawn(kind) {
    const base = (45 + this.wave * 18) * CHAPTERS[this.chapter].difficulty;
    const hp = kind === 'boss' ? 2100 * CHAPTERS[this.chapter].difficulty : kind === 'beetle' ? base * 1.8 : kind === 'moth' ? base * 0.7 : kind === 'blight' ? base * 1.3 : base;
    const e = { id: this.nextId++, kind, progress: 0, hp, maxHp: hp, speed: kind === 'boss' ? 65 : kind === 'moth' ? 160 : 88 + this.wave * 3,
      slowUntil: 0, poisonUntil: 0, poisonDamage: 0, x: PATH[0][0], y: PATH[0][1] };
    this.enemies.push(e);
    if (kind === 'boss') this.events.push({ type: 'boss-arrival', id: e.id });
    return e;
  }
  pause() {
    if (this.phase === 'running') { this.phase = 'paused'; return true; }
    if (this.phase === 'paused') { this.phase = 'running'; return true; }
    return false;
  }
  supply(kind) {
    if (!['build', 'running', 'paused'].includes(this.phase) || !Object.hasOwn(PRICES, kind) || kind === 'continue') return false;
    if (kind === 'shield' && this.shield >= 50) { this.message = 'Root shield is already full.'; return false; }
    if (kind === 'storm' && (!this.enemies.length || this.phase !== 'running')) { this.message = 'Use Leaf Storm when pests are on the path.'; return false; }
    if (kind === 'fertilizer' && this.boostUntil > this.time) { this.message = 'Fertilizer is already active.'; return false; }
    if (!this.spend(PRICES[kind])) { this.message = 'Not enough preview TREE.'; return false; }
    if (kind === 'shield') { this.shield = 50; this.message = 'Root shield: 50 extra protection.'; }
    if (kind === 'fertilizer') { this.boostUntil = this.time + 20; this.message = 'Fertilizer: +50% damage for 20 battle seconds.'; }
    if (kind === 'storm') { this.enemies.forEach(e => this.strike(e, 180, 'storm')); this.resolveKills(); this.events.push({ type: 'storm' }); this.message = 'Leaf Storm unleashed.'; }
    return true;
  }
  continueRun() {
    if (this.phase !== 'defeat' || !this.spend(PRICES.continue)) return false;
    this.health = 100; this.shield = 0; this.phase = 'running';
    this.message = 'Tree of Life restored. Your towers and current wave remain.';
    return true;
  }
  strike(enemy, damage, source, style = 0) {
    // Presentation events report actual hits; they never determine combat or rewards.
    const dealt = Math.min(Math.max(0, enemy.hp), damage);
    enemy.hp -= damage;
    if (dealt > 0) this.events.push({ type: 'hit', id: enemy.id, x: enemy.x, y: enemy.y, kind: enemy.kind, source, style, damage: dealt });
  }
  resolveKills() {
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        this.kills++; this.sap += e.kind === 'boss' ? 150 : 12; this.score += e.kind === 'boss' ? 1000 : 100;
        this.events.push({ type: 'kill', id: e.id, x: e.x, y: e.y, progress: e.progress, kind: e.kind });
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
  }
  targetsFor(tower) {
    const range = TOWERS[tower.type].range + (tower.level - 1) * 18;
    const speed = enemy => enemy.speed * (enemy.slowUntil > this.time ? .55 : 1);
    const priority = tower.targetMode === 'strongest' ? enemy => enemy.hp : tower.targetMode === 'fastest' ? speed : enemy => enemy.progress;
    return this.enemies.filter(enemy => enemy.hp > 0 && distance(tower, enemy) <= range)
      .sort((a, b) => priority(b) - priority(a) || b.progress - a.progress);
  }
  step(dt) {
    if (this.phase !== 'running' || !this.access || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.05); this.time += dt;
    this.spawnTimer -= dt;
    if (this.queue.length && this.spawnTimer <= 0) { this.spawn(this.queue.shift()); this.spawnTimer = waveSpawnInterval(this.wave); }
    for (const enemy of this.enemies) {
      if (enemy.poisonUntil > this.time) enemy.hp -= enemy.poisonDamage * dt;
      enemy.progress += enemy.speed * dt * (enemy.slowUntil > this.time ? 0.55 : 1);
      Object.assign(enemy, pointAt(enemy.progress));
    }
    this.resolveKills();
    const survivors = [];
    for (const enemy of this.enemies) {
      if (enemy.progress < PATH_LENGTH) { survivors.push(enemy); continue; }
      const damage = enemy.kind === 'boss' ? 60 : enemy.kind === 'beetle' ? 18 : 12;
      const absorbed = Math.min(this.shield, damage); this.shield -= absorbed;
      const previousHealth = this.health;
      this.health = Math.max(0, this.health - damage + absorbed);
      this.events.push({ type: 'leak', x: 940, y: 640, kind: enemy.kind, damage: previousHealth - this.health, absorbed });
    }
    this.enemies = survivors;
    if (this.health <= 0) { this.phase = 'defeat'; this.message = 'The Tree of Life has fallen. Continue with preview TREE or start a fresh run.'; return; }
    for (const tower of this.towers) {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const definition = TOWERS[tower.type];
      const targets = this.targetsFor(tower);
      if (!targets.length) continue;
      const target = targets[0];
      this.events.push({ type: 'attack', towerId: tower.id, targetId: target.id, x: tower.x, y: tower.y, tx: target.x, ty: target.y, guardian: tower.type, style: tower.style, level: tower.level });
      tower.cooldown = definition.interval;
      const damage = definition.damage * (1 + (tower.level - 1) * 0.6) * (this.boostUntil > this.time ? 1.5 : 1);
      const armor = target.kind === 'beetle' && tower.type !== 'watchtower' ? 0.8 : 1;
      this.strike(target, damage * armor, tower.type, tower.style);
      if (tower.type === 'oak') this.enemies.filter(e => e.id !== target.id && distance(e, target) < 70).forEach(e => this.strike(e, damage * 0.55, tower.type, tower.style));
      if (tower.type === 'palm') target.slowUntil = this.time + 2;
      if (tower.type === 'cypress' && targets[1]) this.strike(targets[1], damage * 0.5, tower.type, tower.style);
      if (tower.type === 'mushroom') this.enemies.filter(e => distance(e, target) < 65).forEach(e => { e.poisonUntil = this.time + 3; e.poisonDamage = 14 * tower.level; });
      if (tower.type === 'cannon') this.enemies.filter(e => e.hp > 0 && e.id !== target.id && distance(e, target) < 95).forEach(e => this.strike(e, damage * .7 * (e.kind === 'beetle' ? .8 : 1), tower.type, tower.style));
      if (tower.type === 'willow') {
        const visited = new Set([target.id]); let previous = target;
        for (const multiplier of [.65, .4]) {
          const next = this.enemies.filter(e => e.hp > 0 && !visited.has(e.id) && distance(e, previous) <= 95).sort((a,b) => distance(a,previous) - distance(b,previous) || b.progress - a.progress)[0];
          if (!next) break;
          this.events.push({ type: 'chain', towerId: tower.id, x: previous.x, y: previous.y, tx: next.x, ty: next.y, guardian: 'willow', style: tower.style, level: tower.level });
          this.strike(next, damage * multiplier * (next.kind === 'beetle' ? .8 : 1), tower.type, tower.style); visited.add(next.id); previous = next;
        }
      }
      this.shots.push({ x: tower.x, y: tower.y, tx: target.x, ty: target.y, type: tower.type, style: tower.style, life: 0.32 });
      this.resolveKills();
    }
    this.shots.forEach(shot => { shot.life -= dt; }); this.shots = this.shots.filter(shot => shot.life > 0);
    if (!this.queue.length && !this.enemies.length) {
      this.sap += 85; this.score += this.health * 5;
      this.shots = [];
      this.phase = this.wave === 10 ? 'victory' : 'build';
      this.forest.bestWaves[this.chapter] = Math.max(this.forest.bestWaves[this.chapter], this.wave);
      this.events.push({ type: 'wave-clear', wave: this.wave, sap: 85 });
      if (this.phase === 'victory') {
        const stars = this.health >= 80 ? 3 : this.health >= 40 ? 2 : 1;
        this.forest.stars[this.chapter] = Math.max(this.forest.stars[this.chapter], stars);
        this.events.push({ type: 'victory', x: 940, y: 640 });
      }
      const earned = this.refreshUnlocks();
      this.message = (this.phase === 'victory' ? 'Final wave cleared. The Tree of Life stands!' : `Wave ${this.wave} cleared. +85 Sap. Prepare your next defense.`) + (earned.length ? ` Unlocked: ${earned.map(type => TOWERS[type].name).join(', ')}. Ready to plant with Sap.` : '');
    }
  }
  snapshot() {
    const { events, shots, ...state } = this;
    return JSON.parse(JSON.stringify(state));
  }
  static restore(data) {
    if (!data || ![1, 2].includes(data.version) || !['build', 'running', 'paused', 'defeat', 'victory'].includes(data.phase)) return null;
    const validNumber = x => Number.isFinite(x) && x >= 0;
    if (!['tree', 'sap', 'health', 'shield', 'score', 'kills', 'time', 'wave', 'nextId', 'boostUntil'].every(k => validNumber(data[k]))) return null;
    if (data.health > 100 || data.shield > 50 || !Number.isInteger(data.wave) || data.wave > 10 || typeof data.access !== 'boolean') return null;
    if (!Number.isInteger(data.rarity) || data.rarity < 0 || data.rarity > 5 || !Number.isInteger(data.style) || data.style < 0 || data.style > data.rarity) return null;
    if (!Array.isArray(data.towers) || data.towers.length > PADS.length || !Array.isArray(data.enemies) || data.enemies.length > 50 || !Array.isArray(data.queue) || data.queue.length > 30) return null;
    const kinds = ['termite', 'beetle', 'moth', 'blight', 'boss'];
    const used = new Set();
    for (const t of data.towers) {
      if (!t || typeof t !== 'object') return null;
      if (!Object.hasOwn(TOWERS, t.type) || !Number.isInteger(t.pad) || !PADS[t.pad] || used.has(t.pad) || !Number.isInteger(t.level) || t.level < 1 || t.level > 3 || !Number.isInteger(t.style) || t.style < 0 || t.style > data.rarity || !validNumber(t.id) || !Number.isFinite(t.cooldown)) return null;
      used.add(t.pad);
    }
    for (const e of data.enemies) {
      if (!e || typeof e !== 'object') return null;
      if (!kinds.includes(e.kind) || !['id', 'progress', 'hp', 'maxHp', 'speed', 'slowUntil', 'poisonUntil', 'poisonDamage'].every(k => validNumber(e[k])) || e.hp <= 0 || e.progress >= PATH_LENGTH || e.speed <= 0) return null;
    }
    if (!data.queue.every(k => kinds.includes(k)) || !Number.isFinite(data.spawnTimer)) return null;
    const game = new Game();
    if (data.version === 2) {
      if (!data.forest || !data.forest.levels || !Array.isArray(data.forest.stars) || data.forest.stars.length !== CHAPTERS.length) return null;
      if (!Object.keys(TOWERS).every(type => { const level = data.forest.levels[type]; return level === undefined && !ORIGINAL_GUARDIANS.includes(type) || Number.isInteger(level) && level >= 1 && level <= 3; })) return null;
      if (!data.forest.stars.every(stars => Number.isInteger(stars) && stars >= 0 && stars <= 3)) return null;
      let gap = false;
      for (const stars of data.forest.stars) { if (!stars) gap = true; else if (gap) return null; }
      game.forest.levels = Object.fromEntries(Object.keys(TOWERS).map(type => [type, data.forest.levels[type] ?? 1]));
      game.forest.stars = [...data.forest.stars];
      if (!Number.isInteger(data.chapter) || data.chapter < 0 || data.chapter > game.unlockedChapter) return null;
      game.chapter = data.chapter;
      if (data.towers.some(t => t.level !== game.forest.levels[t.type])) return null;
    } else {
      // Carry upgrades already purchased in the original preview into permanent growth.
      for (const tower of data.towers) game.forest.levels[tower.type] = Math.max(game.forest.levels[tower.type], tower.level);
      if (data.phase === 'victory') game.forest.stars[0] = data.health >= 80 ? 3 : data.health >= 40 ? 2 : 1;
    }
    // Old previews offered all five originals. Keep them, active defenders, and paid growth.
    const hasRoster = data.version === 2 && data.forest.rosterVersion === 1;
    const savedWaves = hasRoster && Array.isArray(data.forest.bestWaves) ? data.forest.bestWaves : [];
    game.forest.bestWaves = CHAPTERS.map((_,i) => Math.max(
      Number.isInteger(savedWaves[i]) && savedWaves[i] >= 0 && savedWaves[i] <= 10 ? savedWaves[i] : 0,
      game.forest.stars[i] > 0 ? 10 : 0,
      !hasRoster && i === game.chapter ? Math.max(0, data.wave - (['running','paused','defeat'].includes(data.phase) ? 1 : 0)) : 0
    ));
    const granted = hasRoster && Array.isArray(data.forest.unlocked) ? data.forest.unlocked.filter(type => typeof type === 'string' && Object.hasOwn(TOWERS,type)) : hasRoster ? [] : ORIGINAL_GUARDIANS;
    game.forest.unlocked = [...new Set(['oak','pine', ...granted, ...data.towers.map(t => t.type), ...Object.keys(TOWERS).filter(type => game.forest.levels[type] > 1)])];
    game.refreshUnlocks(false);
    // Explicit fields only: browser saves are editable development data, never an entitlement proof.
    for (const key of ['phase', 'wave', 'health', 'shield', 'sap', 'score', 'kills', 'time', 'tree', 'rarity', 'style', 'access', 'spawnTimer', 'boostUntil', 'nextId']) game[key] = data[key];
    // Optional tactical orders default safely for old/edited saves without losing progress.
    game.towers = data.towers.map(t => ({ ...t, targetMode: typeof t.targetMode === 'string' && Object.hasOwn(TARGET_MODES, t.targetMode) ? t.targetMode : 'first', level: game.forest.levels[t.type], x: PADS[t.pad][0], y: PADS[t.pad][1] }));
    game.enemies = data.enemies.map(e => ({ ...e, ...pointAt(e.progress) })); game.queue = [...data.queue];
    game.message = 'Preview save restored. Continue your defense.';
    if (game.phase === 'running') game.phase = 'paused';
    return game;
  }
}
