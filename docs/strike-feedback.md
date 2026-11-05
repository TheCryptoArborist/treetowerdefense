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

## Release status

Gameplay source `63d077066a2a34aafb44d5da4f8eaf13e3a856d6` is committed.
GitHub validation run 42051780463 passed on Linux, Windows and PostgreSQL 16.
The fix is not published to the canonical checkout-test route.

Draft backend `6aec9da83f3d4551149055c6` built successfully, and its uploaded
function digest matches the locally validated package. Its database branch,
memory, region and effective runtime match the preceding test backend.
However, the canonical-origin sign-in challenge returned 403: the three
checkout-test runtime flags were absent. A documented named-branch environment
update failed with `Missing required path variable 'account_id'`. Further
Netlify operations stopped. No wallet signature or payment was initiated.

Affected site: `tree-token`, branch `canopy-checkout-test`. Deploy log:
https://app.netlify.com/projects/tree-token/deploys/6aec9da83f3d4551149055c6

The unused routing candidate was not published. Its local publication state is
quarantined as `.netlify/canonical-checkout-release.blocked.json`, outside Git.
Before any later publication, resolve the named-branch runtime configuration
using documented Netlify tools, rebuild, and verify canonical-origin sign-in,
anonymous source/payment protection and exact backend preservation again.
Keep checkout and individual progression limited to the isolated preview.
