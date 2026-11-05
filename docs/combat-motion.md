# Combat character motion — November 5, 2026

This pass builds on the animated story/individual-placement test release. It
retains Oak's calibrated hand sockets, the approved Ironroot atlas, current
story scenes and the eight existing defense identities.

## Implemented

- Six guardian performances use the existing directional artwork with a small
  grounded deformation rig: Oak plants its weight, Pine braces/recoils, Palm
  sweeps, Cypress thrusts, Mushroom lifts into a cast and Willow follows its pulse.
  These are procedural performances of the current art, not new hand-painted
  multi-frame attack atlases or fully articulated skeletal animation.
- Subsequent attacks prepare during the last 0.14 seconds of the real cooldown,
  while a target is in range. A newly acquired target may fire immediately.
  The actual attack event starts at the original calibrated firing pose; its
  follow-through/recovery finishes within 0.32 seconds. Damage is never delayed.
- Watchtower string draw, release, missing/reloaded bolt and progressive weapon
  recoil are visible independently of the fixed tower base. Cannon's barrel
  recoils and returns independently of its base.
- The earlier committed human mini-boss artwork is now integrated alongside
  Ironroot: four views and four grounded distance-driven walking poses for each
  Raider/Sprayer. Human body anchors account for carried tools. Each actor can
  load independently, retaining the procedural fallback on failure.
- Ordinary insect legs follow actual route distance with an alternating tripod
  cadence. A short route tangent softens corner presentation without changing
  movement. Wing motion shares the held presentation clock, avoiding a switch
  between wall time and combat time on pause.
- Combat poses, recoil and effects hold during pause/dialogs. Reduced motion
  uses neutral defense poses, fixed enemy steps and the existing static impacts.

## Verification

`npm test`: 253 passing, zero failures, one Windows-only skip on Linux.
Syntax checks and the gated function build pass. All 72 structure trials and
12 Veteran formation scenarios pass. No engine, payment, ownership, inventory,
price, save or targeting rules changed.

`node --expose-gc tools/render-combat-motion.mjs` loads the real assets and checks
all 1,152 defense/growth/style/direction combinations for visible performance,
settled recovery and fixed reduced-motion rendering. It produces a phase sheet
and a twelve-second renderer video under ignored `.netlify/combat-motion/`.
The preview is an offline rendering, not authenticated holder gameplay.

Holder desktop/phone acceptance remains pending. Bespoke limb/weapon animation
atlases, blended mini-boss turns and character-specific death sequences remain
possible later art improvements; this pass does not claim them complete.

Deployment evidence is recorded separately after test-route publication.

## Publication recovery

The interrupted staged backend was not linked from the canonical test route.
Its archive retained a checkout-local `node_modules` link instead of dependency
files, causing a missing-package startup failure. Packaging now rejects a linked
dependency root, and ZIP validation rejects symbolic links. The rebuilt archive
was extracted into a separate directory and its handler imported successfully
without the checkout's dependencies. Node 24 matches the preceding live test
backend; package staging preserves that runtime. Regression coverage also checks
that the test entry discloses real TREE and SUI gas in both its banner and gate,
while the regular simulated entry is unchanged.
