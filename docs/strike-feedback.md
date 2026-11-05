# Strike and impact timing

Combat already applies guardian damage, status effects and defeats immediately on
the attack step. The old presentation then drew a projectile traveling for 0.32
seconds, so a health bar or defeated pest could change before its visible hit.

The painter now draws a resolved strike at the recorded impact point on its first
frame. Pine and Watchtower use target-connected needle/bolt traces; Oak shows a
root connection and impact ring; Palm shows a wind snare at the target; Mushroom
shows its spore burst there; Cypress and Willow retain connected root/pulse
strikes. Cannon shows an immediate blast with a faint ballistic afterimage,
rather than a shell still in flight after its damage has happened. Traces fade
over the existing 0.32-second presentation lifetime. They do not cause damage.

Reduced-motion rendering keeps the strike geometry fixed while fading it. It
omits the muzzle flash and Cannon's moving burst fragments. Pause and modal
holds retain the current effect without advancing its lifetime. A killing shot
still has an impact after the engine removes the final pest and clears the wave.

No engine, damage, cooldown, targeting, reward, purchase, entitlement, save or
ownership rules changed. New character animation frames and directional artwork
for Chainsaw Raider and Blight Sprayer remain separate work.

Validation covers the first rendered impact of actual attacks from all eight
defenses, final killing hits, fixed reduced-motion geometry, chains, coincident
coordinates, pause and expired effects. Existing full tests, JavaScript checks,
gated-package compilation and deterministic balance scenarios must also pass.

Local verification: 239 tests passed, one Windows-only skip, zero failures. Syntax
checks and the gated function build passed. All 72 structure-balance trials and
12 Veteran formation results exactly matched the pre-change baseline. Actual
painter comparisons were inspected for every playable defense. Full defender
attack animation is not claimed by this presentation fix.
