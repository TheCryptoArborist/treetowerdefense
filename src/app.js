import { Game, WIDTH, HEIGHT, PADS, TOWERS, RARITIES, STYLES, PRICES, CHAPTERS, GROWTH_NAMES } from './engine.js';

import { paintTree as shapeTree, paintLifeTree, paintPest, paintCombatEffects, paintBackdrop, paintShot, paintBuildSite, loadDefenderArt, getDefenderArtStatus, loadEnvironmentArt, getEnvironmentArtStatus } from './art.js';
import { scoutWave, starterTip, PurchaseReview } from './playtest.js';
import { CombatFeedback, bossStatus } from './combat.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'canopy-defense-preview-v1';
let game = new Game();
const feedback = new CombatFeedback();
let storageAvailable = true;
let saved = null;
try {
  saved = localStorage.getItem(STORAGE_KEY);
} catch { storageAvailable = false; }
try {
  if (saved) {
    const restored = Game.restore(JSON.parse(saved));
    if (restored) game = restored;
    else game.message = 'An unreadable preview save was skipped. Your fresh forest is ready.';
  }
} catch { game.message = 'An unreadable preview save was skipped. Your fresh forest is ready.'; }
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
const purchaseDialog = $('purchase-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GUIDE_KEY = 'canopy-defense-guide-v1';
let guideStatus = saved && (game.wave > 0 || game.towers.length || game.forestRank) ? 'dismissed' : 'active';
let guideSignature = '', scoutSignature = '', showGuideCompletion = false, pendingPurchase = null;
try {
  const preference = localStorage.getItem(GUIDE_KEY);
  if (['active','dismissed','complete'].includes(preference)) guideStatus = preference;
} catch { /* The guide works for this session even when storage is unavailable. */ }
function saveGuide() {
  try { localStorage.setItem(GUIDE_KEY, guideStatus); } catch { /* Session-only preference. */ }
}
function closeGuide() { guideStatus = 'dismissed'; showGuideCompletion = false; saveGuide(); renderUI(); }
$('skip-guide').addEventListener('click', closeGuide);
function focusControl(control) {
  control.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' }); control.focus({ preventScroll: true });
}
$('guide-action').addEventListener('click', () => {
  const tip = starterTip(game);
  if (tip.tower) {
    selectedType = tip.tower; selectedTower = null;
    document.querySelector('.build-sites').open = true; renderUI();
    focusControl(document.querySelector(`[data-pad="${tip.pad}"]`));
  } else if (tip.key === 'launch') focusControl($('wave-button'));
  else if (tip.key === 'recover') newRun();
  else if (tip.key === 'done') closeGuide();
  else if (game.phase === 'paused') act(() => game.pause());
  else focusControl(canvas);
});

function save() {
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game.snapshot())); $('save-status').textContent = 'Preview saved on this device'; }
  catch { storageAvailable = false; $('save-status').textContent = 'Save unavailable · keep this tab open'; }
}
for (const [i, type] of Object.keys(TOWERS).entries()) {
  const d = TOWERS[type]; const button = document.createElement('button');
  button.className = 'tower-card'; button.dataset.tower = type;
  button.setAttribute('aria-label', `${d.name}: ${d.role}, ${d.cost} Sap. ${d.description}`);
  button.innerHTML = `<span class="tree-icon"><canvas width="144" height="176" aria-hidden="true"></canvas></span><span><strong>${d.name}</strong><small>${GROWTH_NAMES[game.forest.levels[type] - 1]}</small><b>${d.cost} SAP</b></span><kbd>${i + 1}</kbd>`;
  button.addEventListener('click', () => { selectedType = type; selectedTower = null; game.message = `${d.name} selected. Choose an empty build site (${d.cost} Sap).`; renderUI(); });
  shapeTree(button.querySelector('canvas').getContext('2d'), type, 72, 150, 1.08, 0, game.forest.levels[type]);
  $('tower-cards').append(button);
}
for (const [i, style] of STYLES.entries()) {
  const button = document.createElement('button'); button.className = 'style-card'; button.dataset.style = i;
  button.setAttribute('aria-label', `${RARITIES[i]}: ${style.name}. ${style.detail}`);
  button.innerHTML = `<canvas width="128" height="128" aria-hidden="true"></canvas><strong>${style.name}</strong><small>${RARITIES[i]}</small><span class="lock" aria-hidden="true">◆</span>`;
  shapeTree(button.querySelector('canvas').getContext('2d'), 'oak', 64, 100, 1, i);
  button.addEventListener('click', () => {
    if (game.setStyle(i, selectedTower)) { game.message = `${style.name} appearance selected. Combat stats stay the same.`; save(); renderUI(); }
  }); $('style-grid').append(button);
}
for (let i = 0; i < PADS.length; i++) {
  const button = document.createElement('button'); button.dataset.pad = i;
  button.addEventListener('click', () => choosePad(i)); $('pad-buttons').append(button);
}
function dName(tower) { return TOWERS[tower.type].name; }
function choosePad(pad) {
  if (!game.access) { accessDialog.showModal(); return; }
  const existing = game.towers.find(t => t.pad === pad);
  if (existing) { selectedTower = existing.id; selectedType = null; game.message = `${TOWERS[existing.type].name} selected. Upgrade or choose a new appearance.`; }
  else if (selectedType) { const tower = game.place(selectedType, pad); if (tower) { selectedTower = tower.id; game.message = `${dName(tower)} planted. Grow this species or choose another site.`; } }
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
document.querySelectorAll('[data-supply]').forEach(button => button.addEventListener('click', () => reviewPurchase(button.dataset.supply)));
$('preview-button').addEventListener('click', () => { $('rarity-select').selectedIndex = game.rarity; if (game.phase === 'running') game.pause(); accessDialog.showModal(); renderUI(); });
$('enter-preview').addEventListener('click', () => { game.allowPreview($('rarity-select').selectedIndex); accessDialog.close(); save(); renderUI(); });
$('help-button').addEventListener('click', () => { if (game.phase === 'running') game.pause(); helpDialog.showModal(); renderUI(); });
$('continue-button').addEventListener('click', () => reviewPurchase('continue'));
function reviewPurchase(kind, towerId = null) {
  if (purchaseDialog.open) return;
  pendingPurchase = new PurchaseReview(game, kind, towerId);
  if (!pendingPurchase.details().available) { game.message = pendingPurchase.details().reason; pendingPurchase = null; renderUI(); return; }
  renderPurchase(); purchaseDialog.showModal();
}
function renderPurchase() {
  if (!pendingPurchase) return;
  const quote = pendingPurchase.details();
  if (quote.title) $('purchase-title').textContent = quote.title;
  if (quote.description) $('purchase-description').textContent = quote.description;
  $('purchase-cost').textContent = quote.cost?.toLocaleString() ?? '—';
  $('purchase-balance').textContent = game.tree.toLocaleString();
  $('purchase-after').textContent = quote.balanceAfter >= 0 ? quote.balanceAfter.toLocaleString() : 'Unavailable';
  $('purchase-error').hidden = quote.available;
  $('purchase-error').textContent = quote.reason;
  $('confirm-purchase').disabled = !quote.available;
}
$('cancel-purchase').addEventListener('click', () => purchaseDialog.close());
purchaseDialog.addEventListener('close', () => { pendingPurchase = null; renderUI(); });
$('confirm-purchase').addEventListener('click', () => {
  if (!pendingPurchase || !purchaseDialog.open) return;
  if (pendingPurchase.confirm()) { purchaseDialog.close(); save(); renderUI(); }
  else renderPurchase();
});
function newRun() {
  if (game.wave > 0 && !['victory', 'defeat'].includes(game.phase) && !confirm('Start a fresh run? This clears your current battlefield. Your permanent species growth and chapter progress are kept.')) return false;
  game.newRun(); feedback.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; showGuideCompletion = false; save(); renderUI();
  return true;
}
$('guided-run-button').addEventListener('click', () => {
  if (!newRun()) return;
  guideStatus = 'active'; showGuideCompletion = false; saveGuide(); helpDialog.close(); renderUI();
});
$('new-run-button').addEventListener('click', newRun);
$('outcome-new-run').addEventListener('click', newRun);
$('reset-button').addEventListener('click', () => {
  if (!confirm('Reset all preview progress, rarity choices, and simulated TREE?')) return;
  game = new Game(); feedback.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; backdropKey = ''; cardSignature = ''; guideStatus = 'active'; showGuideCompletion = false; saveGuide(); save(); renderUI(); accessDialog.showModal();
});
document.addEventListener('keydown', event => {
  if (accessDialog.open || helpDialog.open || purchaseDialog.open || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(event.target.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 5 && Number.isInteger(index)) {
    selectedType = Object.keys(TOWERS)[index]; selectedTower = null; renderUI();
  } else if (event.code === 'Space') { event.preventDefault(); act(() => game.pause()); }
  else if (event.key.toLowerCase() === 'n') act(() => game.startWave());
  else if (event.key === 'Escape') { selectedTower = null; selectedType = null; renderUI(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase === 'running') { game.pause(); save(); renderUI(); } lastTime = performance.now(); });
window.addEventListener('pagehide', save);

for (const [i, chapter] of CHAPTERS.entries()) {
  const button = document.createElement('button'); button.className = 'chapter-button'; button.dataset.chapter = i;
  button.innerHTML = `<span class="chapter-number">${i + 1}</span><span><strong>${chapter.name}</strong><small>${chapter.subtitle}</small></span><span class="chapter-stars">☆☆☆</span>`;
  button.addEventListener('click', () => selectChapter(i)); $('chapter-trail').append(button);
}
function selectChapter(i) {
  if (game.wave > 0 && !['defeat', 'victory'].includes(game.phase) && !confirm('Travel to another chapter? Your current battle resets. Permanent growth and forest progress are kept.')) return;
  if (game.chooseChapter(i)) { feedback.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; showGuideCompletion = false; save(); renderUI(); }
}
$('next-chapter').addEventListener('click', () => selectChapter(game.chapter + 1));
let sound = false, audio = null, lastTone = 0;
$('sound-button').addEventListener('click', () => {
  try {
    sound = !sound;
    if (sound) { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); }
    $('sound-button').textContent = sound ? 'Sound on' : 'Sound off'; $('sound-button').setAttribute('aria-pressed', String(sound));
    if (sound) tone(420, .15);
  } catch { sound = false; $('sound-button').textContent = 'Sound unavailable'; $('sound-button').disabled = true; }
});
function tone(frequency, duration = .08) {
  if (!sound || !audio || audio.state !== 'running' || document.hidden) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * .6, audio.currentTime + duration);
  gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
}
let cardSignature = '';
loadEnvironmentArt();
loadDefenderArt().then(status => {
  cardSignature = ''; inspectorSignature = null;
  document.querySelectorAll('[data-style]').forEach(button => {
    const icon = button.querySelector('canvas'), c = icon.getContext('2d');
    c.clearRect(0,0,icon.width,icon.height); shapeTree(c,'oak',64,100,1,Number(button.dataset.style));
  });
  renderUI();
  if (status.failed.length) console.warn('Some guardian sprites were unavailable; matching canvas artwork is active.');
});
function renderUI() {
  renderGuide(); renderScout(); renderPurchase(); renderCombatUI();
  const tower = game.towers.find(t => t.id === selectedTower);
  $('forest-rank').textContent = ['Seedling Sanctuary', 'Blooming Haven', 'Ancient Refuge', 'Forest of Life'][game.forestRank];
  const starCount = game.forest.stars.reduce((a,b) => a+b,0);
  $('forest-summary').textContent = game.forestRank ? `${starCount}/9 stars · permanent defender growth saved` : 'Clear a chapter to build your first landmark.';
  $('map-name').textContent = CHAPTERS[game.chapter].name.toUpperCase();
  document.querySelectorAll('[data-chapter]').forEach(button => {
    const i = Number(button.dataset.chapter), stars = game.forest.stars[i];
    button.disabled = !game.access || i > game.unlockedChapter;
    button.classList.toggle('active', i === game.chapter); button.setAttribute('aria-pressed', String(i === game.chapter));
    button.querySelector('.chapter-stars').textContent = i > game.unlockedChapter ? 'Locked' : '★'.repeat(stars) + '☆'.repeat(3-stars);
    button.setAttribute('aria-label', `${CHAPTERS[i].name}: ${i > game.unlockedChapter ? 'locked' : `${stars} of 3 stars`}`);
  });
  const nextCards = Object.values(game.forest.levels).join(':') + ':' + getDefenderArtStatus().loaded.length;
  if (nextCards !== cardSignature) {
    document.querySelectorAll('[data-tower]').forEach(button => {
      const type = button.dataset.tower, icon = button.querySelector('canvas'), c = icon.getContext('2d'), level = game.forest.levels[type];
      c.clearRect(0,0,icon.width,icon.height); shapeTree(c,type,72,150,1.08,0,level); button.querySelector('small').textContent = GROWTH_NAMES[level-1];
    }); cardSignature = nextCards;
  }
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
    $('inspector').innerHTML = `<canvas class="tower-portrait" width="240" height="240" aria-hidden="true"></canvas><span class="eyebrow">SITE ${tower.pad + 1} · ${STYLES[tower.style].name.toUpperCase()}</span><h3>${d.name}<small>${GROWTH_NAMES[tower.level - 1]} · LEVEL ${tower.level}</small></h3><p>${d.description}</p><div class="growth-steps">${GROWTH_NAMES.map((name,i) => `<span class="${i < tower.level ? 'grown' : ''}">${i+1} ${name}</span>`).join('')}</div><p class="growth-note">Growth applies to every ${d.name}, now and in future runs.</p><div class="tower-stats"><div><span>DAMAGE</span><strong>${Math.round(d.damage * (1 + (tower.level - 1) * .6))}</strong></div><div><span>RANGE</span><strong>${d.range + (tower.level - 1) * 18}</strong></div><div><span>INTERVAL</span><strong>${d.interval}s</strong></div></div><button id="upgrade-button" class="primary">${tower.level === 3 ? 'Ancient growth reached ✓' : `Grow all ${d.name} · ${game.upgradeCost(tower).toLocaleString()} TREE`}</button><button id="remove-button" class="secondary">Remove · return ${Math.floor(d.cost * .6)} Sap</button>`;
    shapeTree($('inspector').querySelector('canvas').getContext('2d'), tower.type, 120, 185, 1.38, tower.style, tower.level);
    $('upgrade-button').disabled = !active || tower.level >= 3 || game.tree < game.upgradeCost(tower);
    $('upgrade-button').addEventListener('click', () => reviewPurchase('upgrade', tower.id));
    $('remove-button').disabled = !active;
    $('remove-button').addEventListener('click', () => act(() => { game.sell(tower.id); selectedTower = null; selectedType = tower.type; }));
  } else {
    $('inspector').innerHTML = '<span class="eyebrow">ROOTED IN STRENGTH.</span><h3>Choose your defenders.</h3><p>Plant a defender, then select it to grow its whole species. TREE upgrades stay with you across runs.</p><div class="legend"><span><i class="legend-dot sap"></i>Sap plants towers</span><span><i class="legend-dot tree"></i>TREE grows their species</span></div>';
  }
  inspectorSignature = nextInspector;
  }
  const ended = ['defeat', 'victory'].includes(game.phase); $('outcome').hidden = !ended;
  if (ended) {
    const won = game.phase === 'victory';
    $('outcome-label').textContent = won ? 'THE FOREST REMEMBERS' : 'ROOTS CAN RISE AGAIN';
    $('outcome-title').textContent = won ? 'The Tree of Life stands.' : 'The Tree of Life has fallen.';
    const stars = game.health >= 80 ? 3 : game.health >= 40 ? 2 : 1;
    $('outcome-stars').textContent = won ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '';
    $('next-chapter').hidden = !won || game.chapter >= CHAPTERS.length-1;
    $('outcome-description').textContent = won ? `${CHAPTERS[game.chapter].name} protected. ${stars}/3 stars. Your forest landmark and permanent growth are saved. No tokens or cash awarded.` : 'Continue to restore health and keep your towers and current wave. Preview prices only.';
    $('continue-button').hidden = won; $('continue-button').disabled = game.tree < PRICES.continue;
  }
}

function renderCombatUI() {
  const boss = bossStatus(game), visible = boss.state !== 'hidden';
  $('boss-panel').hidden = !visible;
  $('boss-health').hidden = boss.state !== 'present';
  if (visible) {
    const text = boss.state === 'incoming' ? 'Approaching behind the escort' : `${Math.ceil(boss.hp).toLocaleString()} / ${Math.ceil(boss.maxHp).toLocaleString()} HP`;
    if ($('boss-health-text').textContent !== text) $('boss-health-text').textContent = text;
    if (boss.state === 'present') { $('boss-health').max = boss.maxHp; $('boss-health').value = boss.hp; }
  }
  const notice = feedback.notice;
  const title = notice?.title || (game.phase === 'paused' ? 'BATTLE PAUSED' : game.phase === 'running' ? 'GUARDIANS ENGAGED' : game.phase === 'victory' ? 'FOREST PROTECTED' : game.phase === 'defeat' ? 'THE ROOTS HAVE FALLEN' : 'HOLD THE LINE');
  const text = notice?.text || (game.phase === 'paused' ? 'Resume when you are ready.' : game.phase === 'running' ? 'Watch the route and protect the Tree of Life.' : 'Earned Sap plants guardians. TREE grows their species.');
  $('battle-notice').dataset.tone = notice?.tone || 'normal';
  if ($('notice-title').textContent !== title) $('notice-title').textContent = title;
  if ($('notice-text').textContent !== text) $('notice-text').textContent = text;
}

function renderGuide() {
  const tip = starterTip(game);
  if (guideStatus === 'active' && tip.key === 'done') { guideStatus = 'complete'; showGuideCompletion = true; saveGuide(); }
  const visible = game.access && (guideStatus === 'active' || showGuideCompletion);
  $('starter-guide').hidden = !visible;
  const signature = `${visible}:${guideStatus}:${tip.key}:${game.phase}`;
  if (signature !== guideSignature) {
    $('guide-step').textContent = tip.key === 'done' ? 'GUIDED START COMPLETE' : `FIRST RUN · ${tip.step} OF 4`;
    $('guide-title').textContent = tip.title; $('guide-text').textContent = tip.text;
    $('guide-action').textContent = tip.action; $('skip-guide').textContent = tip.key === 'done' ? 'Dismiss' : 'Skip guide';
    document.querySelectorAll('[data-tower]').forEach(button => button.classList.toggle('tutorial-target', visible && guideStatus === 'active' && button.dataset.tower === tip.tower));
    document.querySelectorAll('[data-pad]').forEach(button => button.classList.toggle('tutorial-target', visible && guideStatus === 'active' && Number(button.dataset.pad) === tip.pad));
    $('wave-button').classList.toggle('tutorial-target', visible && guideStatus === 'active' && tip.key === 'launch');
    guideSignature = signature;
  }
}
function renderScout() {
  const signature = `${game.chapter}:${game.wave}:${game.phase}`;
  if (signature === scoutSignature) return;
  scoutSignature = signature;
  const scout = scoutWave(game.chapter, game.wave + 1);
  $('scout-title').textContent = game.wave === 10 ? (game.phase === 'victory' ? 'Forest protected' : game.phase === 'defeat' ? 'Final wave interrupted' : 'Final wave underway') : `${game.phase === 'build' ? 'Scout' : 'Next:'} wave ${scout.wave}`;
  $('scout-total').textContent = scout.total ? `${scout.total} PESTS${scout.wave === 10 ? ' · BOSS WAVE' : ''}` : '10 OF 10';
  $('scout-pests').replaceChildren();
  for (const group of scout.groups) {
    const card = document.createElement('div'); card.className = 'scout-pest';
    card.innerHTML = `<canvas width="96" height="92" aria-hidden="true"></canvas><strong>${group.name} <b>×${group.count}</b></strong><small>${group.trait}</small>`;
    const c = card.querySelector('canvas').getContext('2d'), scale = group.kind === 'boss' ? .5 : .65; c.translate(48,59); c.scale(scale,scale);
    paintPest(c,{kind:group.kind,x:0,y:0,id:0,hp:100,maxHp:100,slowUntil:0,poisonUntil:0},0,0);
    $('scout-pests').append(card);
  }
  $('scout-tip').textContent = scout.tip || (game.phase === 'victory' ? 'Replay to improve your stars, or explore the next unlocked chapter.' : 'The Blight King is the final challenge. There are no further waves in this run.');
}

// Local sprite artwork and procedural scenery; no remote art or font downloads.
const backdrop = document.createElement('canvas'); backdrop.width = WIDTH; backdrop.height = HEIGHT;
const bg = backdrop.getContext('2d');
let backdropKey = '', floaters = [];
let seed = 89;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function draw(clock, dt) {
  const visualClock = reducedMotion ? 0 : clock;
  const held = game.phase === 'paused' || accessDialog.open || helpDialog.open || purchaseDialog.open || document.hidden;
  const effectDt = held ? 0 : dt;
  feedback.advance(effectDt);
  const events = game.events.splice(0);
  feedback.consume(events);
  const key = `${game.chapter}:${game.forestRank}:${getEnvironmentArtStatus().revision}`;
  if (key !== backdropKey) { paintBackdrop(bg, game.chapter, game.forestRank); backdropKey = key; }
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(backdrop, 0, 0);
  const aura = ctx.createRadialGradient(920, 610, 15, 920, 610, 105);
  aura.addColorStop(0, '#d8ad6230'); aura.addColorStop(1, '#d8ad6200'); ctx.fillStyle = aura; ctx.fillRect(800,490,200,230);
  // Earning chapter landmarks grows the Tree of Life's visible silhouette.
  paintLifeTree(ctx, 'oak', 885, 659, 1.02 + game.forestRank * .08, 0, game.forestRank >= 2 ? 2 : 1, visualClock);
  ctx.save();ctx.fillStyle='#efe5c6';ctx.font='bold 12px Trebuchet MS, Arial';ctx.textAlign='center';ctx.strokeStyle='#101b14';ctx.lineWidth=4;ctx.strokeText('TREE OF LIFE',885,704);ctx.fillText('TREE OF LIFE',885,704);ctx.restore();
  if (game.shield > 0) { ctx.strokeStyle='#eafed6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(885,606,75,90,0,0,Math.PI*2);ctx.stroke(); }
  const suggestedPad = guideStatus === 'active' && game.access ? starterTip(game).pad : null;
  for (let i = 0; i < PADS.length; i++) {
    const [x,y] = PADS[i], tower = game.towers.find(t => t.pad === i);
    const selected = tower && tower.id === selectedTower;
    if (selected || hoveredPad === i && selectedType && !tower) {
      const range = selected ? TOWERS[tower.type].range + (tower.level-1)*18 : TOWERS[selectedType].range;
      ctx.fillStyle='#f7ffcf28';ctx.strokeStyle='#365d3980';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(x,y,range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    }
    paintBuildSite(ctx,x,y,{selected,hovered:hoveredPad===i,recommended:suggestedPad===i,occupied:!!tower,number:i+1});
    if (tower) {
      shapeTree(ctx,tower.type,x,y,1.04,tower.style,tower.level,visualClock, game.phase==='running' && tower.cooldown>TOWERS[tower.type].interval-.15);
      ctx.fillStyle='#d9c592';ctx.strokeStyle='#283d2e';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x+29,y+7,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#435b39';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(tower.level,x+29,y+10);
    }
  }
  ctx.textAlign='left';
  for (const e of game.enemies) paintPest(ctx,e, held ? (reducedMotion ? 0 : game.time) : visualClock,game.time,{hit:feedback.reaction(e.id),reducedMotion});
  paintCombatEffects(ctx,feedback,reducedMotion);
  for (const shot of game.shots) paintShot(ctx,shot);
  if (!held && game.phase==='running' && game.shots.some(shot=>shot.life>.27) && clock-lastTone>.16) { tone(220,.045);lastTone=clock; }
  for (const event of events) {
    if (['hit','wave-start','wave-clear','boss-arrival'].includes(event.type)) continue;
    const n=event.type==='storm'?65:event.type==='victory'?80:14;
    for(let i=0;i<n;i++) particles.push({x:event.type==='storm'?random()*WIDTH:event.x,y:event.type==='storm'?random()*HEIGHT:event.y,vx:(random()-.5)*(event.type==='victory'?250:100),vy:-30-random()*90,life:event.type==='victory'?1.5:.65,max:event.type==='victory'?1.5:.65,color:event.type==='kill'?'#8d8264':event.type==='leak'?'#e88068':event.type==='upgrade'?'#f9e5a0':'#fff4b4'});
    if(event.type==='kill')floaters.push({x:event.x,y:event.y-32,text:event.kind==='boss'?'+150 SAP':'+12 SAP',color:'#dbd9b4',life:1});
    if(event.type==='upgrade') {floaters.push({x:event.x,y:event.y-82,text:'GROWN!',color:'#eed3a3',life:1.2});tone(660,.2);}
    if(event.type==='plant')tone(340,.12);
    if(event.type==='leak'){floaters.push({x:875,y:550,text:event.damage?`−${event.damage} LIFE`:event.absorbed?'SHIELD HELD':'ROOTS BREACHED',color:event.damage?'#e9a68e':'#c9dcc0',life:1.2});tone(130,.2);}
    if(event.type==='storm')tone(240,.3);
    if(event.type==='victory')tone(880,.4);
  }
  if(particles.length>400)particles=particles.slice(-400);
  if(floaters.length>40)floaters=floaters.slice(-40);
  for(const p of particles){if(!reducedMotion){p.x+=p.vx*effectDt;p.y+=p.vy*effectDt;p.vy+=90*effectDt;}p.life-=effectDt;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x,p.y,3,5,.5,0,Math.PI*2);ctx.fill();}
  particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
  for(const f of floaters){if(!reducedMotion)f.y-=22*effectDt;f.life-=effectDt;ctx.globalAlpha=Math.max(0,Math.min(1,f.life*2));ctx.fillStyle=f.color;ctx.font='bold 13px Trebuchet MS, Arial';ctx.strokeStyle='#182419';ctx.lineWidth=3;ctx.strokeText(f.text,f.x-22,f.y);ctx.fillText(f.text,f.x-22,f.y);}
  floaters=floaters.filter(f=>f.life>0);ctx.globalAlpha=1;
  if(game.boostUntil>game.time){ctx.fillStyle='#e8dbab';ctx.font='bold 12px Arial';ctx.fillText(`FERTILIZER · ${Math.ceil(game.boostUntil-game.time)}s`,25,55);}
  if(game.phase==='paused'){
    ctx.fillStyle='#28493470';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.textAlign='center';ctx.fillStyle='#fff3c8';ctx.strokeStyle='#284832';ctx.lineWidth=5;ctx.font='bold 36px Georgia';ctx.strokeText('Battle paused.',WIDTH/2,HEIGHT/2);ctx.fillText('Battle paused.',WIDTH/2,HEIGHT/2);ctx.font='bold 14px Arial';ctx.fillText('Resume to hold the line.',WIDTH/2,HEIGHT/2+32);ctx.textAlign='left';
  }
}
function frame(now) {
  const dt = Math.min(.05, (now - lastTime) / 1000); lastTime = now;
  if (!accessDialog.open && !helpDialog.open && !purchaseDialog.open && !document.hidden) game.step(dt);
  draw(now / 1000, dt);
  if (now - lastUI > 150) { renderUI(); lastUI = now; }
  if (now - lastSave > 2000 && game.access) { save(); lastSave = now; }
  requestAnimationFrame(frame);
}
renderUI();
if (!storageAvailable) $('save-status').textContent = 'Save unavailable · keep this tab open';
if (!game.access) accessDialog.showModal();
requestAnimationFrame(frame);
