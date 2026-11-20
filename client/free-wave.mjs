import { Game, HEIGHT, TOWERS, WIDTH } from '../src/engine.js';
import { CombatFeedback } from '../src/combat.js';
import { GuardianAiming, GUARDIAN_SCALE } from '../src/aiming.js';
import { paintCombatEffects, paintRootAssault, loadAimArt, getEnvironmentArtStatus, loadDefenderArt, loadEnvironmentArt, paintBackdrop, paintBuildSite, paintLifeTree, paintPest, paintShot, paintTree } from '../src/art.js';

export function createFreeWave() {
  const game = new Game();
  game.allowPreview();
  const finished = () => game.wave === 1 && game.phase !== 'running';
  return {
    get state() { return game; },
    finished,
    place(type, pad) {
      if (finished() || !['oak', 'pine'].includes(type)) return false;
      return game.place(type, pad);
    },
    start() {
      return game.wave === 0 && game.towers.length > 0 && game.startWave();
    },
    step(dt) {
      game.step(dt);
      return game.events.splice(0);
    },
  };
}

export function mountFreeWave(panel, { onExit, onUnlock }) {
  const canvas = panel.querySelector('canvas');
  const context = canvas.getContext('2d');
  const backdrop = document.createElement('canvas');
  backdrop.width = WIDTH;
  backdrop.height = HEIGHT;
  const background = backdrop.getContext('2d');
  const sap = panel.querySelector('#guest-sap');
  const health = panel.querySelector('#guest-health');
  const status = panel.querySelector('#guest-status');
  const start = panel.querySelector('#guest-start');
  const unlock = panel.querySelector('#guest-unlock');
  const retry = panel.querySelector('#guest-retry');
  const sitePicker = panel.querySelector('#guest-sites');
  const defenders = [...panel.querySelectorAll('[data-guest-defender]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const feedback = new CombatFeedback();
  const aiming = new GuardianAiming();
  let artLoading, highlightedPad;
  let wave, selected, lastTime, frameId, backgroundRevision = -1, paintedSites;
  const sites = createFreeWave().state.map.pads.map(([x, y], pad) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(pad + 1);
    button.setAttribute('aria-label', `Plant at build site ${pad + 1}`);
    button.style.left = `${x / WIDTH * 100}%`;
    button.style.top = `${(y + 9) / HEIGHT * 100}%`;
    button.onclick = () => {
      if (wave.place(selected, pad)) status.textContent = wave.state.message;
      sync();
    };
    button.onpointerenter = button.onfocus = () => { highlightedPad = pad; };
    button.onpointerleave = button.onblur = () => { if (highlightedPad === pad) highlightedPad = null; };
    sitePicker.append(button);
    return button;
  });

  function sync() {
    const game = wave.state;
    const done = wave.finished();
    const sapText = `${game.sap} Sap`;
    const healthText = `Tree of Life ${game.health}/100`;
    if (sap.textContent !== sapText) sap.textContent = sapText;
    if (health.textContent !== healthText) health.textContent = healthText;
    start.hidden = game.wave > 0;
    start.disabled = game.towers.length === 0;
    retry.hidden = !done;
    unlock.hidden = !done || game.phase === 'defeat';
    const signature = `${selected}:${done}:${game.sap}:${game.towers.length}`;
    if (signature === paintedSites) return;
    paintedSites = signature;
    defenders.forEach(button => {
      button.disabled = done;
      button.setAttribute('aria-pressed', String(button.dataset.guestDefender === selected));
    });
    const occupied = new Set(game.towers.map(tower => tower.pad));
    sites.forEach((button, pad) => {
      button.hidden = occupied.has(pad) || done;
      button.disabled = game.sap < TOWERS[selected].cost;
      button.setAttribute('aria-label', `Plant ${TOWERS[selected].name} at build site ${pad + 1}`);
    });
  }

  function draw(now) {
    const game = wave.state;
    const wasFinished = wave.finished();
    const dt = document.hidden ? 0 : Math.min(.05, (now - lastTime) / 1000);
    feedback.advance(dt);
    aiming.advance(dt);
    const events = wave.step(dt);
    feedback.consume(events);
    aiming.consume(events);
    aiming.track(game);
    lastTime = now;
    if (!wasFinished && wave.finished()) {
      status.textContent = game.phase === 'defeat'
        ? 'The Tree of Life fell. Try Oak and Pine together near the first bend.'
        : 'Wave 1 cleared. Verify your NFTree to unlock the full campaign.';
      sync();
      (unlock.hidden ? retry : unlock).focus();
    } else sync();
    const revision = getEnvironmentArtStatus().revision;
    if (revision !== backgroundRevision) {
      paintBackdrop(background, 0, 0, game.map);
      backgroundRevision = revision;
    }
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(backdrop, 0, 0);
    if (highlightedPad != null && !wave.finished() && !game.towers.some(tower => tower.pad === highlightedPad)) {
      const [x, y] = game.map.pads[highlightedPad];
      context.beginPath();
      context.arc(x, y, TOWERS[selected].range, 0, Math.PI * 2);
      context.fillStyle = '#c0efaa30';
      context.strokeStyle = '#f5df96';
      context.lineWidth = 3;
      context.fill();
      context.stroke();
    }
    const motionOff = reducedMotion.matches;
    for (const tower of game.towers) {
      paintBuildSite(context, tower.x, tower.y, { occupied: true });
      const pose = aiming.pose(tower.id);
      paintTree(context, tower.type, tower.x, tower.y, GUARDIAN_SCALE, tower.style, tower.level,
        motionOff ? 0 : aiming.time, pose.hold > 0, pose.facing,
        aiming.motion(tower, { battleActive: game.phase === 'running', reducedMotion: motionOff }));
    }
    for (const enemy of game.enemies) paintPest(context, enemy, game.time, game.time, { hit: feedback.reaction(enemy.id), reducedMotion: motionOff });
    paintLifeTree(context, 'oak', 885, 659, 1.06);
    paintRootAssault(context, feedback, { health: game.health, shield: 0, reducedMotion: motionOff });
    paintCombatEffects(context, feedback, motionOff);
    for (const shot of aiming.shots) paintShot(context, shot, { reducedMotion: motionOff });
    frameId = requestAnimationFrame(draw);
  }

  function reset() {
    wave = createFreeWave();
    aiming.clear();
    feedback.clear();
    selected = 'pine';
    highlightedPad = null;
    paintedSites = null;
    status.textContent = 'Try Pine at site 1 and Oak at site 2. Then start the wave.';
    sync();
  }

  defenders.forEach(button => {
    const type = button.dataset.guestDefender;
    button.onclick = () => {
      selected = type;
      status.textContent = TOWERS[type].description;
      sync();
    };
  });
  start.onclick = () => {
    if (wave.start()) status.textContent = 'Wave 1 is underway. Defend the Tree of Life.';
    sync();
  };
  retry.onclick = () => { reset(); defenders.find(button => button.dataset.guestDefender === selected).focus(); };
  unlock.onclick = onUnlock;
  panel.querySelector('#guest-exit').onclick = onExit;
  reset();

  return {
    open() {
      reset();
      panel.hidden = false;
      panel.querySelector('h1').focus();
      lastTime = performance.now();
      frameId = requestAnimationFrame(draw);
      artLoading ??= Promise.all([loadEnvironmentArt(), loadDefenderArt(), loadAimArt()]);
    },
    close() {
      cancelAnimationFrame(frameId);
      panel.hidden = true;
    },
  };
}
