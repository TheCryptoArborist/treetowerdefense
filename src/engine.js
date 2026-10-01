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
};
export const PRICES = Object.freeze({ shield: 3000, fertilizer: 5000, storm: 8000, continue: 20000 });
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

export class Game {
  constructor() {
    this.version = 1;
    this.tree = 150000; // Simulation balance only. Never a Sui balance.
    this.rarity = 0;
    this.style = 0;
    this.access = false;
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
    if (this.towers.some(t => t.pad === pad)) return false;
    const definition = TOWERS[type];
    if (this.sap < definition.cost) { this.message = 'Earn more Sap by defeating pests.'; return false; }
    this.sap -= definition.cost;
    const [x, y] = PADS[pad];
    const tower = { id: this.nextId++, type, pad, x, y, level: 1, cooldown: 0, style: this.style };
    this.towers.push(tower); this.message = `${definition.name} planted. Ready to defend.`;
    return tower;
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
    tower.level++; this.message = `${TOWERS[tower.type].name} upgraded to level ${tower.level}.`;
    this.events.push({ type: 'upgrade', x: tower.x, y: tower.y });
    return true;
  }
  sell(id) {
    if (!['build', 'running', 'paused'].includes(this.phase)) return false;
    const tower = this.towers.find(t => t.id === id);
    if (!tower) return false;
    this.sap += Math.floor(TOWERS[tower.type].cost * 0.6);
    this.towers = this.towers.filter(t => t.id !== id);
    this.message = 'Defender removed. 60% of planting Sap returned; TREE upgrades are consumed.';
    return true;
  }
  startWave() {
    if (!this.access || this.phase !== 'build' || this.wave >= 10) return false;
    this.wave++; this.phase = 'running'; this.spawnTimer = 0;
    const count = 6 + this.wave * 2;
    this.queue = Array.from({ length: count }, (_, i) => {
      const kind = this.wave >= 3 && i % 5 === 0 ? 'beetle' : this.wave >= 2 && i % 4 === 0 ? 'moth' : this.wave >= 5 && i % 7 === 0 ? 'blight' : 'termite';
      return kind;
    });
    if (this.wave === 10) this.queue.push('boss');
    this.message = this.wave === 10 ? 'Final wave. The Blight King approaches!' : `Wave ${this.wave}: protect the Tree of Life.`;
    return true;
  }
  spawn(kind) {
    const base = 45 + this.wave * 18;
    const hp = kind === 'boss' ? 2100 : kind === 'beetle' ? base * 1.8 : kind === 'moth' ? base * 0.7 : kind === 'blight' ? base * 1.3 : base;
    const e = { id: this.nextId++, kind, progress: 0, hp, maxHp: hp, speed: kind === 'boss' ? 65 : kind === 'moth' ? 160 : 88 + this.wave * 3,
      slowUntil: 0, poisonUntil: 0, poisonDamage: 0, x: PATH[0][0], y: PATH[0][1] };
    this.enemies.push(e); return e;
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
    if (kind === 'storm') { this.enemies.forEach(e => { e.hp -= 180; }); this.resolveKills(); this.events.push({ type: 'storm' }); this.message = 'Leaf Storm unleashed.'; }
    return true;
  }
  continueRun() {
    if (this.phase !== 'defeat' || !this.spend(PRICES.continue)) return false;
    this.health = 100; this.shield = 0; this.phase = 'running';
    this.message = 'Tree of Life restored. Your towers and current wave remain.';
    return true;
  }
  resolveKills() {
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        this.kills++; this.sap += e.kind === 'boss' ? 150 : 12; this.score += e.kind === 'boss' ? 1000 : 100;
        this.events.push({ type: 'kill', x: e.x, y: e.y, kind: e.kind });
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
  }
  step(dt) {
    if (this.phase !== 'running' || !this.access || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.05); this.time += dt;
    this.spawnTimer -= dt;
    if (this.queue.length && this.spawnTimer <= 0) { this.spawn(this.queue.shift()); this.spawnTimer = Math.max(0.45, 1.1 - this.wave * 0.05); }
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
      this.health = Math.max(0, this.health - damage + absorbed);
      this.events.push({ type: 'leak', x: 940, y: 640 });
    }
    this.enemies = survivors;
    if (this.health <= 0) { this.phase = 'defeat'; this.message = 'The Tree of Life has fallen. Continue with preview TREE or start a fresh run.'; return; }
    for (const tower of this.towers) {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const definition = TOWERS[tower.type];
      const range = definition.range + (tower.level - 1) * 18;
      const targets = this.enemies.filter(e => distance(tower, e) <= range).sort((a, b) => b.progress - a.progress);
      if (!targets.length) continue;
      const target = targets[0];
      tower.cooldown = definition.interval;
      const damage = definition.damage * (1 + (tower.level - 1) * 0.6) * (this.boostUntil > this.time ? 1.5 : 1);
      const armor = target.kind === 'beetle' ? 0.8 : 1;
      target.hp -= damage * armor;
      if (tower.type === 'oak') this.enemies.filter(e => e.id !== target.id && distance(e, target) < 70).forEach(e => { e.hp -= damage * 0.55; });
      if (tower.type === 'palm') target.slowUntil = this.time + 2;
      if (tower.type === 'cypress' && targets[1]) targets[1].hp -= damage * 0.5;
      if (tower.type === 'mushroom') this.enemies.filter(e => distance(e, target) < 65).forEach(e => { e.poisonUntil = this.time + 3; e.poisonDamage = 14 * tower.level; });
      this.shots.push({ x: tower.x, y: tower.y, tx: target.x, ty: target.y, type: tower.type, style: tower.style, life: 0.25 });
      this.resolveKills();
    }
    this.shots.forEach(shot => { shot.life -= dt; }); this.shots = this.shots.filter(shot => shot.life > 0);
    if (!this.queue.length && !this.enemies.length) {
      this.sap += 85; this.score += this.health * 5;
      this.shots = [];
      this.phase = this.wave === 10 ? 'victory' : 'build';
      this.message = this.phase === 'victory' ? 'The Tree of Life stands. You defeated the Blight King!' : `Wave ${this.wave} cleared. +85 Sap. Prepare your next defense.`;
    }
  }
  snapshot() {
    const { events, shots, ...state } = this;
    return JSON.parse(JSON.stringify(state));
  }
  static restore(data) {
    if (!data || data.version !== 1 || !['build', 'running', 'paused', 'defeat', 'victory'].includes(data.phase)) return null;
    const validNumber = x => Number.isFinite(x) && x >= 0;
    if (!['tree', 'sap', 'health', 'shield', 'score', 'kills', 'time', 'wave', 'nextId', 'boostUntil'].every(k => validNumber(data[k]))) return null;
    if (data.health > 100 || data.shield > 50 || !Number.isInteger(data.wave) || data.wave > 10 || typeof data.access !== 'boolean') return null;
    if (!Number.isInteger(data.rarity) || data.rarity < 0 || data.rarity > 5 || !Number.isInteger(data.style) || data.style < 0 || data.style > data.rarity) return null;
    if (!Array.isArray(data.towers) || data.towers.length > PADS.length || !Array.isArray(data.enemies) || data.enemies.length > 50 || !Array.isArray(data.queue) || data.queue.length > 30) return null;
    const kinds = ['termite', 'beetle', 'moth', 'blight', 'boss'];
    const used = new Set();
    for (const t of data.towers) {
      if (!Object.hasOwn(TOWERS, t.type) || !Number.isInteger(t.pad) || !PADS[t.pad] || used.has(t.pad) || !Number.isInteger(t.level) || t.level < 1 || t.level > 3 || !Number.isInteger(t.style) || t.style < 0 || t.style > data.rarity || !validNumber(t.id) || !Number.isFinite(t.cooldown)) return null;
      used.add(t.pad);
    }
    for (const e of data.enemies) {
      if (!kinds.includes(e.kind) || !['id', 'progress', 'hp', 'maxHp', 'speed', 'slowUntil', 'poisonUntil', 'poisonDamage'].every(k => validNumber(e[k])) || e.hp <= 0 || e.progress >= PATH_LENGTH || e.speed <= 0) return null;
    }
    if (!data.queue.every(k => kinds.includes(k)) || !Number.isFinite(data.spawnTimer)) return null;
    const game = new Game();
    // Explicit fields only: browser saves are editable development data, never an entitlement proof.
    for (const key of ['phase', 'wave', 'health', 'shield', 'sap', 'score', 'kills', 'time', 'tree', 'rarity', 'style', 'access', 'spawnTimer', 'boostUntil', 'nextId']) game[key] = data[key];
    game.towers = data.towers.map(t => ({ ...t, x: PADS[t.pad][0], y: PADS[t.pad][1] }));
    game.enemies = data.enemies.map(e => ({ ...e, ...pointAt(e.progress) })); game.queue = [...data.queue];
    game.message = 'Preview save restored. Continue your defense.';
    if (game.phase === 'running') game.phase = 'paused';
    return game;
  }
}
