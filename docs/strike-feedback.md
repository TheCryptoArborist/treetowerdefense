# Strike and impact timing

Combat already applies guardian damage, status effects and defeats immediately on
the attack step. The old presentation then drew a projectile traveling for 0.32
seconds, so a health bar or defeated pest could change before its visible hit.

The painter now draws a resolved strike at the recorded impact point on its first
frame. Pine uses a target-connected needle trace; Oak shows a
root connection and impact ring; Palm shows a wind snare at the target; Mushroom
shows its spore burst there; Cypress and Willow retain connected root/pulse
strikes. Cannon shows an immediate blast with a faint ballistic afterimage,
rather than a shell still in flight after its damage has happened. Traces fade
over the existing 0.32-second presentation lifetime. They do not cause damage.

Watchtower playtest correction: its former full-range bolt trace looked like a
laser. It now shows a short physical arrow at the recorded hit, with a wooden
shaft, feathered tail and metal head. Its size stays fixed at every range; no
beam or muzzle glow joins it to the bow. The arrow points along the actual shot
direction and fades with the same held effect clock. Existing immediate impact,
final-kill, pause and reduced-motion behavior is preserved. Damage and attack
cadence are unchanged.

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

Published at https://tree-token.xyz/play/canopy-defense/checkout-test/.
Gameplay source `63d077066a2a34aafb44d5da4f8eaf13e3a856d6`, build source
`036a5a6f9ead3ffa52996c7835da1622dd8b94ad`; CI run 42054675088 passed on
Linux, Windows and PostgreSQL 16. Backend `6aeca2d705b5f9de8a54917f`, routing
publication `6aeca3a49e359f82ebf586db`. The uploaded function digest matches
the locally validated package.

The missing CLI account context was resolved through the documented public
account-scoped environment API. The three existing-mode flags are now explicitly
limited to branch `canopy-checkout-test`: `CANOPY_CANONICAL_CHECKOUT_PREVIEW`
(Builds and Functions), `CANOPY_CHECKOUT_ENABLED` and
`CANOPY_INDIVIDUAL_DEFENDERS` (Functions). All 50 unrelated variables were
preserved. No global or production value was enabled. The test database branch,
effective runtime, memory and region match the preceding backend.

All 293 existing static paths remain; 292 file hashes are unchanged. Only the
checkout-test rewrite in `/_redirects` changed. All 43 existing backend function
identities/configurations and all five schedules exactly match the production
baseline `6aec99bf240f589972b4b367`. The regular game was not promoted.

The canonical entry returns 200 with the real-TREE test notice. Its sign-in
challenge returns 200 with the fixed canonical origin and rejects a wrong origin
with 403. Anonymous app/art source, access and payment requests return 401.
Gateway, stylesheet and committed Ironroot walking artwork match the validated
local assets. Browser entry was verified at the NFTree gate.

Holder gameplay, phone layout and real TREE purchase/recovery acceptance remain
pending. No wallet signature or payment was initiated. Full defender animation
and replacement Raider/Sprayer artwork remain separate work.
