// Transient presentation state: never part of a game save or combat calculation.
export class CombatFeedback {
  constructor() { this.clear(); }
  clear() { this.impacts = []; this.defeats = []; this.reactions = new Map(); this.notice = null; }
  consume(events) {
    for (const event of events) {
      if (event.type === 'hit') {
        this.reactions.set(event.id, .18);
        this.impacts.push({ ...event, life: .28, max: .28 });
      } else if (event.type === 'kill') {
        this.reactions.delete(event.id);
        this.defeats.push({ ...event, life: event.kind === 'boss' ? .9 : .5, max: event.kind === 'boss' ? .9 : .5 });
        if (event.kind === 'boss') this.announce('THE BLIGHT KING FALLS', 'Your guardians have broken the King’s advance.', 'success', 4);
      } else if (event.type === 'boss-arrival') {
        this.announce('THE BLIGHT KING HAS ARRIVED', 'Focus your guardians. Watch the boss health bar.', 'danger', 4);
      } else if (event.type === 'wave-start') {
        this.announce(event.wave === 10 ? 'FINAL WAVE · BLIGHT KING INCOMING' : `WAVE ${event.wave} BEGINS`, event.wave === 10 ? 'The King follows his escort. Prepare your strongest defense.' : 'Guardians are engaging the incoming pests.', event.wave === 10 ? 'danger' : 'normal', 3);
      } else if (event.type === 'wave-clear' && event.wave < 10) {
        this.announce(`WAVE ${event.wave} CLEARED`, `+${event.sap} Sap earned. Prepare your next defense.`, 'success', 3.5);
      } else if (event.type === 'leak' && event.kind === 'boss') {
        this.announce('THE BLIGHT KING BREACHED THE ROOTS', event.damage ? `The Tree of Life took ${event.damage} damage.` : 'Your Root Shield absorbed the attack.', 'danger', 4);
      }
    }
    // Limit memory and rendering cost even after a large number of hits.
    this.impacts = this.impacts.slice(-80);
    this.defeats = this.defeats.slice(-32);
    while (this.reactions.size > 64) this.reactions.delete(this.reactions.keys().next().value);
  }
  announce(title, text, tone, life) { this.notice = { title, text, tone, life }; }
  advance(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    for (const list of [this.impacts, this.defeats]) for (const effect of list) effect.life -= dt;
    this.impacts = this.impacts.filter(effect => effect.life > 0);
    this.defeats = this.defeats.filter(effect => effect.life > 0);
    for (const [id, life] of this.reactions) {
      if (life <= dt) this.reactions.delete(id); else this.reactions.set(id, life - dt);
    }
    if (this.notice) { this.notice.life -= dt; if (this.notice.life <= 0) this.notice = null; }
  }
  reaction(id) { return (this.reactions.get(id) || 0) / .18; }
}

export function bossStatus(game) {
  const boss = game.enemies.find(enemy => enemy.kind === 'boss');
  if (boss) return { state: 'present', hp: Math.max(0, boss.hp), maxHp: boss.maxHp, percent: Math.max(0, Math.min(100, boss.hp / boss.maxHp * 100)) };
  return game.queue.includes('boss') ? { state: 'incoming' } : { state: 'hidden' };
}
