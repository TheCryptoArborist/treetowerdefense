export const GUARDIAN_SCALE = 1.04;
export const SHOT_DURATION = .32;

// Clockwise around the ground plane, starting with screen-down/front.
const VIEWS = [0, 1, 2, 3, 4, 3, 2, 1];
export function facingFor(dx, dy) {
  const direction = ((Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) % 8) + 8) % 8;
  return { direction, view: VIEWS[direction], flip: direction > 4 };
}

export class GuardianAiming {
  constructor() { this.clear(); }
  clear() { this.poses = new Map(); this.shots = []; this.time = 0; }
  consume(events) {
    for (const event of events) {
      if (event.type === 'chain') { this.shots.push({ ...event, type: 'willow', origin: {x:event.x,y:event.y}, life: SHOT_DURATION }); continue; }
      if (event.type !== 'attack') continue;
      const facing = facingFor(event.tx - event.x, event.ty - event.y);
      this.poses.set(event.towerId, { facing, targetId: event.targetId, hold: SHOT_DURATION, attack: .18 });
      this.shots.push({ ...event, type: event.guardian, facing, life: SHOT_DURATION });
    }
    this.shots = this.shots.slice(-64);
  }
  advance(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    for (const pose of this.poses.values()) { pose.hold = Math.max(0, pose.hold - dt); pose.attack = Math.max(0, pose.attack - dt); }
    for (const shot of this.shots) shot.life -= dt;
    this.shots = this.shots.filter(shot => shot.life > 0);
  }
  track(game, held = false) {
    const ids = new Set(game.towers.map(tower => tower.id));
    for (const id of this.poses.keys()) if (!ids.has(id)) this.poses.delete(id);
    for (const tower of game.towers) {
      const pose = this.poses.get(tower.id);
      if (pose && (held || pose.hold > 0)) continue;
      const target = game.targetsFor(tower)[0];
      if (target) this.poses.set(tower.id, { facing: facingFor(target.x - tower.x, target.y - tower.y), targetId: target.id, hold: 0, attack: 0 });
    }
  }
  pose(id) { return this.poses.get(id) || { facing: facingFor(0, 1), hold: 0, attack: 0 }; }
}
