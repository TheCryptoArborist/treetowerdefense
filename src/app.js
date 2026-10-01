import { Game, WIDTH, HEIGHT, PATH, PADS, TOWERS, RARITIES, STYLES, PRICES } from './engine.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'canopy-defense-preview-v1';
let game = new Game();
let storageAvailable = true;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const restored = Game.restore(JSON.parse(saved));
    if (restored) game = restored;
  }
} catch { storageAvailable = false; }
let selectedType = 'pine';
let selectedTower = null;
let hoveredPad = null;
let particles = [];
let lastTime = performance.now();
let lastSave = 0;
let lastUI = 0;
let inspectorSignature = null;
const canvas = $('battlefield');
const ctx = canvas.getContext('2d');
const accessDialog = $('access-dialog');
const helpDialog = $('help-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function save() {
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game.snapshot())); $('save-status').textContent = 'Preview saved on this device'; }
  catch { storageAvailable = false; $('save-status').textContent = 'Save unavailable · keep this tab open'; }
}
function shapeTree(context, type, x, y, scale, style, level = 1, clock = 0) {
  const palette = STYLES[style];
  context.save(); context.translate(x, y); context.scale(scale, scale);
  context.fillStyle = '#06130c55'; context.beginPath(); context.ellipse(0, 21, 32, 12, 0, 0, Math.PI * 2); context.fill();
  if (style >= 2) {
    context.strokeStyle = palette.accent + '77'; context.lineWidth = 1.5;
    context.beginPath(); context.ellipse(0, 19, 30, 10, 0, 0, Math.PI * 2); context.stroke();
  }
  context.strokeStyle = palette.bark; context.lineWidth = type === 'oak' ? 11 : 7; context.lineCap = 'round';
  context.beginPath(); context.moveTo(0, 19); context.lineTo(0, -14); context.stroke();
  for (const root of [-1, 1]) { context.beginPath(); context.moveTo(0, 13); context.quadraticCurveTo(root * 8, 23, root * 21, 22); context.stroke(); }
  const glow = style >= 2 && !reducedMotion;
  if (glow) { context.shadowColor = palette.accent; context.shadowBlur = 7; }
  context.fillStyle = palette.canopy;
  if (type === 'pine' || type === 'cypress') {
    for (let i = 0; i < 3; i++) {
      const w = (type === 'cypress' ? 16 : 24) - i * 5;
      context.beginPath(); context.moveTo(0, -51 - i * 7); context.lineTo(-w, -8 - i * 14); context.lineTo(w, -8 - i * 14); context.closePath(); context.fill();
    }
  } else if (type === 'palm') {
    context.strokeStyle = palette.canopy; context.lineWidth = 8;
    for (const [dx, dy] of [[-30, -26], [30, -26], [-20, -50], [20, -50], [0, -57]]) {
      context.beginPath(); context.moveTo(0, -30); context.quadraticCurveTo(dx * 0.5, dy - 18, dx, dy); context.stroke();
    }
  } else if (type === 'mushroom') {
    context.fillStyle = palette.bark; context.fillRect(-7, -19, 14, 37);
    context.fillStyle = palette.canopy; context.beginPath(); context.ellipse(0, -24, 29, 19, 0, Math.PI, Math.PI * 2); context.lineTo(29, -16); context.quadraticCurveTo(0, -6, -29, -16); context.closePath(); context.fill();
    context.fillStyle = palette.accent;
    for (const [dx, dy] of [[-12, -27], [5, -33], [17, -23]]) { context.beginPath(); context.arc(dx, dy, 3.5, 0, Math.PI * 2); context.fill(); }
  } else {
    for (const [dx, dy, r] of [[-18, -23, 19], [18, -23, 19], [0, -42, 24], [0, -18, 21]]) {
      context.beginPath(); context.arc(dx, dy, r, 0, Math.PI * 2); context.fill();
    }
  }
  context.shadowBlur = 0; context.fillStyle = palette.accent + '99';
  if (type !== 'mushroom') for (let i = 0; i < (style ? 5 : 2); i++) {
    const dx = Math.sin(i * 5 + style) * 16, dy = -22 - i * 5;
    context.beginPath(); context.ellipse(dx, dy, style === 1 ? 3.5 : 2, 2, i, 0, Math.PI * 2); context.fill();
  }
  if (style >= 3) {
    context.fillStyle = palette.accent;
    for (let i = 0; i < (style >= 4 ? 4 : 2); i++) {
      const angle = i * Math.PI / 2 + (reducedMotion ? 0 : clock * 0.6);
      const dx = Math.cos(angle) * 30, dy = -20 + Math.sin(angle) * 28;
      context.beginPath(); context.moveTo(dx, dy - 4); context.lineTo(dx + 3, dy); context.lineTo(dx, dy + 4); context.lineTo(dx - 3, dy); context.closePath(); context.fill();
    }
  }
  if (level > 1) {
    context.fillStyle = '#e4d08d';
    for (let i = 0; i < level; i++) { context.beginPath(); context.arc((i - (level - 1) / 2) * 8, 34, 2.5, 0, Math.PI * 2); context.fill(); }
  }
  context.restore();
}
function towerIcon(type) {
  const d = TOWERS[type];
  const foliage = type === 'pine' || type === 'cypress' ? '<path d="M20 3 6 26h8L8 34h24l-6-8h8Z"/>' : type === 'mushroom' ? '<path d="M4 23c0-20 32-20 32 0Z"/><circle cx="13" cy="16" r="2" fill="#eeeede"/><circle cx="26" cy="16" r="2" fill="#eeeede"/>' : type === 'palm' ? '<path d="M20 19Q2 1 3 26Q11 19 20 19Q37 1 37 26Q28 19 20 19Q19 0 14 3Q14 11 20 19Z"/>' : '<circle cx="12" cy="20" r="9"/><circle cx="28" cy="20" r="9"/><circle cx="20" cy="12" r="11"/>';
  return `<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M18 19h4v21h-4Z" fill="#a48b65"/><g fill="${d.color}">${foliage}</g><ellipse cx="20" cy="41" rx="13" ry="3" fill="#abc38233"/></svg>`;
}
for (const [i, type] of Object.keys(TOWERS).entries()) {
  const d = TOWERS[type]; const button = document.createElement('button');
  button.className = 'tower-card'; button.dataset.tower = type;
  button.setAttribute('aria-label', `${d.name}: ${d.role}, ${d.cost} Sap. ${d.description}`);
  button.innerHTML = `<span class="tree-icon">${towerIcon(type)}</span><span><strong>${d.name}</strong><small>${d.role}</small><b>${d.cost} SAP</b></span><kbd>${i + 1}</kbd>`;
  button.addEventListener('click', () => { selectedType = type; selectedTower = null; game.message = `${d.name} selected. Choose an empty build site (${d.cost} Sap).`; renderUI(); });
  $('tower-cards').append(button);
}
for (const [i, style] of STYLES.entries()) {
  const button = document.createElement('button'); button.className = 'style-card'; button.dataset.style = i;
  button.setAttribute('aria-label', `${RARITIES[i]}: ${style.name}. ${style.detail}`);
  button.innerHTML = `<canvas width="128" height="128" aria-hidden="true"></canvas><strong>${style.name}</strong><small>${RARITIES[i]}</small><span class="lock" aria-hidden="true">◆</span>`;
  shapeTree(button.querySelector('canvas').getContext('2d'), 'oak', 64, 86, 1.25, i);
  button.addEventListener('click', () => {
    if (game.setStyle(i, selectedTower)) { game.message = `${style.name} appearance selected. Combat stats stay the same.`; save(); renderUI(); }
  }); $('style-grid').append(button);
}
for (let i = 0; i < PADS.length; i++) {
  const button = document.createElement('button'); button.dataset.pad = i;
  button.addEventListener('click', () => choosePad(i)); $('pad-buttons').append(button);
}
function choosePad(pad) {
  if (!game.access) { accessDialog.showModal(); return; }
  const existing = game.towers.find(t => t.pad === pad);
  if (existing) { selectedTower = existing.id; selectedType = null; game.message = `${TOWERS[existing.type].name} selected. Upgrade or choose a new appearance.`; }
  else if (selectedType) { const tower = game.place(selectedType, pad); if (tower) selectedTower = null; }
  else game.message = 'Choose a defender from the planting menu first.';
  save(); renderUI();
}
function pointerPad(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * WIDTH / rect.width;
  const y = (event.clientY - rect.top) * HEIGHT / rect.height;
  const matches = PADS.map(([px, py], i) => ({ i, d: Math.hypot(px - x, py - y) })).sort((a, b) => a.d - b.d);
  return matches[0].d < 45 ? matches[0].i : null;
}
canvas.addEventListener('pointermove', event => { hoveredPad = pointerPad(event); canvas.style.cursor = hoveredPad !== null ? 'pointer' : 'default'; });
canvas.addEventListener('pointerleave', () => { hoveredPad = null; });
canvas.addEventListener('pointerup', event => { const pad = pointerPad(event); if (pad !== null) choosePad(pad); });
function act(action) { action(); save(); renderUI(); }
$('wave-button').addEventListener('click', () => act(() => game.startWave()));
$('pause-button').addEventListener('click', () => act(() => game.pause()));
document.querySelectorAll('[data-supply]').forEach(button => button.addEventListener('click', () => act(() => game.supply(button.dataset.supply))));
$('preview-button').addEventListener('click', () => { $('rarity-select').selectedIndex = game.rarity; if (game.phase === 'running') game.pause(); accessDialog.showModal(); renderUI(); });
$('enter-preview').addEventListener('click', () => { game.allowPreview($('rarity-select').selectedIndex); accessDialog.close(); save(); renderUI(); });
$('help-button').addEventListener('click', () => { if (game.phase === 'running') game.pause(); helpDialog.showModal(); renderUI(); });
$('continue-button').addEventListener('click', () => act(() => game.continueRun()));
function newRun() {
  if (game.wave > 0 && !['victory', 'defeat'].includes(game.phase) && !confirm('Start a fresh run? This clears your current battlefield. Consumed preview TREE is not refunded.')) return;
  game.newRun(); selectedTower = null; selectedType = 'pine'; particles = []; save(); renderUI();
}
$('new-run-button').addEventListener('click', newRun);
$('outcome-new-run').addEventListener('click', newRun);
$('reset-button').addEventListener('click', () => {
  if (!confirm('Reset all preview progress, rarity choices, and simulated TREE?')) return;
  game = new Game(); selectedTower = null; selectedType = 'pine'; particles = []; save(); renderUI(); accessDialog.showModal();
});
document.addEventListener('keydown', event => {
  if (accessDialog.open || helpDialog.open || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(event.target.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 5 && Number.isInteger(index)) {
    selectedType = Object.keys(TOWERS)[index]; selectedTower = null; renderUI();
  } else if (event.code === 'Space') { event.preventDefault(); act(() => game.pause()); }
  else if (event.key.toLowerCase() === 'n') act(() => game.startWave());
  else if (event.key === 'Escape') { selectedTower = null; selectedType = null; renderUI(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase === 'running') { game.pause(); save(); renderUI(); } lastTime = performance.now(); });
window.addEventListener('pagehide', save);

function renderUI() {
  const tower = game.towers.find(t => t.id === selectedTower);
  if (!tower) selectedTower = null;
  const active = game.access && ['build', 'running', 'paused'].includes(game.phase);
  $('health-value').innerHTML = `${game.health}<span> / 100</span>`;
  $('health-bar').style.width = game.health + '%'; $('health-bar').style.background = game.health < 30 ? '#d18a79' : '#b4d294';
  $('shield-value').textContent = `Root shield: ${game.shield}`;
  $('wave-value').innerHTML = `${String(game.wave).padStart(2, '0')}<span> / 10</span>`;
  $('sap-value').textContent = game.sap.toLocaleString(); $('tree-value').textContent = game.tree.toLocaleString(); $('score-value').textContent = game.score.toLocaleString();
  $('kills-value').textContent = `${game.kills} pests defeated`;
  const status = { build: 'Prepare your forest', running: 'Defenders engaged', paused: 'Battle paused', defeat: 'Tree of Life fallen', victory: 'Forest protected' }[game.phase];
  $('phase-value').textContent = status; $('battle-status').textContent = game.access ? status.toUpperCase() : 'NFTREE ACCESS PREVIEW';
  if ($('message').textContent !== game.message) $('message').textContent = game.message;
  $('enemy-count').textContent = game.enemies.length ? `${game.enemies.length} ON PATH · ${game.queue.length} INCOMING` : 'PATH CLEAR';
  $('account-rarity').textContent = game.access ? RARITIES[game.rarity] : 'Choose rarity';
  $('wave-button').textContent = game.phase === 'victory' ? 'Forest protected ✓' : `Send wave ${Math.min(10, game.wave + 1)} →`;
  $('wave-button').disabled = !game.access || game.phase !== 'build';
  $('pause-button').disabled = !['running', 'paused'].includes(game.phase); $('pause-button').textContent = game.phase === 'paused' ? 'Resume' : 'Pause';
  document.querySelectorAll('[data-tower]').forEach(button => {
    button.classList.toggle('active', selectedType === button.dataset.tower); button.setAttribute('aria-pressed', String(selectedType === button.dataset.tower)); button.disabled = !active;
  });
  document.querySelectorAll('[data-style]').forEach(button => {
    const i = Number(button.dataset.style); button.disabled = !game.access || i > game.rarity;
    button.classList.toggle('selected', i === (tower?.style ?? game.style)); button.setAttribute('aria-pressed', String(i === (tower?.style ?? game.style)));
    button.querySelector('.lock').hidden = game.access && i <= game.rarity;
  });
  $('style-instruction').textContent = tower ? `Customize this ${TOWERS[tower.type].name}.` : 'Choose the style for your next defender.';
  document.querySelectorAll('[data-pad]').forEach(button => {
    const pad = Number(button.dataset.pad); const t = game.towers.find(t => t.pad === pad);
    button.textContent = t ? `${pad + 1} · ${TOWERS[t.type].name}` : `Site ${pad + 1}`;
    button.setAttribute('aria-label', t ? `Select ${TOWERS[t.type].name} at site ${pad + 1}` : `Plant selected defender at site ${pad + 1}`);
    button.disabled = !active;
  });
  document.querySelectorAll('[data-supply]').forEach(button => {
    const kind = button.dataset.supply;
    button.disabled = !active || game.tree < PRICES[kind] || (kind === 'storm' && (!game.enemies.length || game.phase !== 'running')) || (kind === 'shield' && game.shield >= 50) || (kind === 'fertilizer' && game.boostUntil > game.time);
  });
  const nextInspector = tower ? `${tower.id}:${tower.level}:${tower.style}:${active}:${game.tree >= game.upgradeCost(tower)}` : 'none';
  if (nextInspector !== inspectorSignature) {
  if (tower) {
    const d = TOWERS[tower.type];
    $('inspector').innerHTML = `<span class="eyebrow">SITE ${tower.pad + 1} · ${STYLES[tower.style].name.toUpperCase()}</span><h3>${d.name} <small>Lv. ${tower.level}</small></h3><p>${d.description}</p><div class="tower-stats"><div><span>DAMAGE</span><strong>${Math.round(d.damage * (1 + (tower.level - 1) * .6))}</strong></div><div><span>RANGE</span><strong>${d.range + (tower.level - 1) * 18}</strong></div><div><span>INTERVAL</span><strong>${d.interval}s</strong></div></div><button id="upgrade-button" class="primary">${tower.level === 3 ? 'Maximum level reached' : `Upgrade · ${game.upgradeCost(tower).toLocaleString()} preview TREE`}</button><button id="remove-button" class="secondary">Remove · return ${Math.floor(d.cost * .6)} Sap</button>`;
    $('upgrade-button').disabled = !active || tower.level >= 3 || game.tree < game.upgradeCost(tower);
    $('upgrade-button').addEventListener('click', () => act(() => game.upgrade(tower.id)));
    $('remove-button').disabled = !active;
    $('remove-button').addEventListener('click', () => act(() => { game.sell(tower.id); selectedTower = null; selectedType = tower.type; }));
  } else {
    $('inspector').innerHTML = '<span class="eyebrow">YOUR STRATEGY STARTS HERE</span><h3>Roots before riches.</h3><p>Plant defenders along the path. Select a planted tower to upgrade it or change its appearance.</p><div class="legend"><span><i class="legend-dot sap"></i>Sap plants towers</span><span><i class="legend-dot tree"></i>TREE upgrades them</span></div>';
  }
  inspectorSignature = nextInspector;
  }
  const ended = ['defeat', 'victory'].includes(game.phase); $('outcome').hidden = !ended;
  if (ended) {
    const won = game.phase === 'victory';
    $('outcome-label').textContent = won ? 'THE FOREST REMEMBERS' : 'ROOTS CAN RISE AGAIN';
    $('outcome-title').textContent = won ? 'The Tree of Life stands.' : 'The Tree of Life has fallen.';
    $('outcome-description').textContent = won ? `All ten waves cleared. ${game.score.toLocaleString()} points. This preview awards no tokens or cash.` : 'Continue to restore health and keep your towers and current wave. Preview prices only.';
    $('continue-button').hidden = won; $('continue-button').disabled = game.tree < PRICES.continue;
  }
}

// Locally rendered art: no external assets, fonts, CDN, wallet, or network dependency.
const backdrop = document.createElement('canvas'); backdrop.width = WIDTH; backdrop.height = HEIGHT;
const bg = backdrop.getContext('2d');
let seed = 89;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function drawBackdrop() {
  const gradient = bg.createLinearGradient(0, 0, 1000, 720); gradient.addColorStop(0, '#243e32'); gradient.addColorStop(1, '#132d25'); bg.fillStyle = gradient; bg.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 1600; i++) { const x = random() * WIDTH, y = random() * HEIGHT; bg.fillStyle = random() > .5 ? '#b6d79108' : '#03120c15'; bg.fillRect(x, y, random() * 4 + 1, random() * 4 + 1); }
  bg.strokeStyle = '#11251d'; bg.lineWidth = 78; bg.lineJoin = 'round'; bg.lineCap = 'round';
  bg.beginPath(); PATH.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.stroke();
  bg.strokeStyle = '#6c7955'; bg.lineWidth = 62; bg.stroke();
  bg.strokeStyle = '#8b947022'; bg.lineWidth = 46; bg.stroke();
  bg.strokeStyle = '#b9c88e25'; bg.lineWidth = 2; bg.setLineDash([3, 13]); bg.stroke(); bg.setLineDash([]);
  for (let i = 0; i < 60; i++) {
    const x = random() * WIDTH, y = random() * HEIGHT;
    const closeToPath = PATH.slice(1).some(([px, py], j) => {
      const [ax, ay] = PATH[j]; const vx = px - ax, vy = py - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
      return Math.hypot(x - ax - t * vx, y - ay - t * vy) < 58;
    });
    if (!closeToPath && !PADS.some(([px, py]) => Math.hypot(x - px, y - py) < 56)) {
      bg.globalAlpha = .4; shapeTree(bg, i % 3 === 0 ? 'pine' : 'oak', x, y, .55 + random() * .3, 0); bg.globalAlpha = 1;
    }
  }
  bg.fillStyle = '#b0c39499'; bg.font = '10px Arial'; bg.fillText('THE BLIGHT ENTERS', 20, 263);
  bg.fillStyle = '#d9c791'; bg.font = '12px Georgia'; bg.textAlign = 'center'; bg.fillText('TREE OF LIFE', 923, 712); bg.textAlign = 'left';
  bg.strokeStyle = '#61705288'; bg.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
}
drawBackdrop();
function drawEnemy(e, clock) {
  const boss = e.kind === 'boss'; const r = boss ? 25 : e.kind === 'beetle' ? 13 : 10;
  const color = { termite: '#c69b6e', beetle: '#b07e63', moth: '#d9c890', blight: '#9a79b0', boss: '#b77381' }[e.kind];
  ctx.save(); ctx.translate(e.x, e.y);
  ctx.fillStyle = '#030c0c55'; ctx.beginPath(); ctx.ellipse(0, r * .7, r * 1.2, r * .5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#302927'; ctx.lineWidth = boss ? 4 : 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-r * .4, i * r * .6); ctx.lineTo(-r * 1.4, i * r * .8 + Math.sin(clock * 10 + i) * 2); ctx.moveTo(r * .4, i * r * .6); ctx.lineTo(r * 1.4, i * r * .8 - Math.sin(clock * 10 + i) * 2); ctx.stroke(); }
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, r * .8, r, 0, 0, Math.PI * 2); ctx.fill();
  if (e.kind === 'moth') { ctx.globalAlpha = .65; for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 11, -2, 10, 6, side * .3, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.fillStyle = '#ecdfbc'; for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * r * .3, -r * .45, boss ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); }
  if (boss) { ctx.strokeStyle = '#f2c17c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, -26); ctx.lineTo(-12, -38); ctx.lineTo(0, -29); ctx.lineTo(12, -38); ctx.lineTo(15, -26); ctx.stroke(); }
  ctx.fillStyle = '#08120c'; ctx.fillRect(-r, -r - 10, r * 2, 3); ctx.fillStyle = e.poisonUntil > game.time ? '#c59cde' : '#d2bd83'; ctx.fillRect(-r, -r - 10, Math.max(0, e.hp / e.maxHp) * r * 2, 3);
  if (e.slowUntil > game.time) { ctx.strokeStyle = '#9ed9e4'; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}
function draw(clock, dt) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(backdrop, 0, 0);
  const pulse = reducedMotion ? 1 : .7 + Math.sin(clock * 2) * .3;
  const aura = ctx.createRadialGradient(935, 615, 15, 935, 615, 115); aura.addColorStop(0, '#d8df8940'); aura.addColorStop(1, '#d8df8900'); ctx.fillStyle = aura; ctx.fillRect(810, 480, 190, 230);
  shapeTree(ctx, 'oak', 930, 638, 1.8, 0, 1, clock);
  if (game.shield > 0) { ctx.strokeStyle = '#a1dcceaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(930, 600, 59, 75, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < PADS.length; i++) {
    const [x, y] = PADS[i]; const tower = game.towers.find(t => t.pad === i);
    const selected = tower && tower.id === selectedTower;
    if (selected || hoveredPad === i && selectedType && !tower) {
      const range = selected ? TOWERS[tower.type].range + (tower.level - 1) * 18 : TOWERS[selectedType].range;
      ctx.fillStyle = '#b5d29012'; ctx.strokeStyle = '#b5d29055'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#142b23'; ctx.strokeStyle = selected || hoveredPad === i ? '#e3d09b' : `rgba(168,194,137,${.35 + pulse * .3})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y + 9, 31, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!tower) { ctx.fillStyle = '#bccd9366'; ctx.font = '19px Arial'; ctx.textAlign = 'center'; ctx.fillText('+', x, y + 13); ctx.font = '9px Arial'; ctx.fillText(i + 1, x, y + 39); }
    else shapeTree(ctx, tower.type, x, y, .95 + (tower.level - 1) * .06, tower.style, tower.level, clock);
  }
  ctx.textAlign = 'left';
  for (const e of game.enemies) drawEnemy(e, clock);
  for (const shot of game.shots) {
    ctx.globalAlpha = Math.max(0, shot.life / .25); ctx.strokeStyle = STYLES[shot.style].accent; ctx.lineWidth = shot.type === 'cypress' ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(shot.x, shot.y - 25); ctx.lineTo(shot.tx, shot.ty); ctx.stroke(); ctx.globalAlpha = 1;
    if (shot.type === 'oak' || shot.type === 'mushroom') { ctx.strokeStyle = STYLES[shot.style].accent + '66'; ctx.beginPath(); ctx.arc(shot.tx, shot.ty, (1 - shot.life / .25) * 55, 0, Math.PI * 2); ctx.stroke(); }
  }
  for (const event of game.events.splice(0)) {
    if (event.type === 'storm') { for (let i = 0; i < 100; i++) particles.push({ x: random() * WIDTH, y: random() * HEIGHT, vx: 100 + random() * 90, vy: 50 + random() * 60, life: .7, color: '#c3dd91' }); }
    else for (let i = 0; i < 9; i++) particles.push({ x: event.x, y: event.y, vx: (random() - .5) * 80, vy: (random() - .5) * 80, life: .55, color: event.type === 'leak' ? '#df8c82' : '#d7d89b' });
  }
  if (particles.length > 500) particles = particles.slice(-500);
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); }
  particles = particles.filter(p => p.life > 0); ctx.globalAlpha = 1;
  if (game.boostUntil > game.time) { ctx.fillStyle = '#d6df9a'; ctx.font = '12px Arial'; ctx.fillText(`FERTILIZER ACTIVE · ${Math.ceil(game.boostUntil - game.time)}s`, 24, 40); }
  if (game.phase === 'paused') { ctx.fillStyle = '#05100866'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = '#e9e8cb'; ctx.textAlign = 'center'; ctx.font = '32px Georgia'; ctx.fillText('The forest waits.', WIDTH / 2, HEIGHT / 2); ctx.font = '14px Arial'; ctx.fillText('Press Resume to continue your defense', WIDTH / 2, HEIGHT / 2 + 30); ctx.textAlign = 'left'; }
}
function frame(now) {
  const dt = Math.min(.05, (now - lastTime) / 1000); lastTime = now;
  if (!accessDialog.open && !helpDialog.open) game.step(dt);
  draw(now / 1000, dt);
  if (now - lastUI > 150) { renderUI(); lastUI = now; }
  if (now - lastSave > 2000 && game.access) { save(); lastSave = now; }
  requestAnimationFrame(frame);
}
renderUI();
if (!storageAvailable) $('save-status').textContent = 'Save unavailable · keep this tab open';
if (!game.access) accessDialog.showModal();
requestAnimationFrame(frame);
