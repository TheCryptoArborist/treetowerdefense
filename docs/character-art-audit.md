# Canopy Defense character artwork and behavior review

Follow-up: [the combat motion pass](combat-motion.md) integrates the human
mini-boss atlases into the current test source and adds procedural guardian,
structure and insect performances. The table below records the earlier audit;
impact timing and animated story scenes were completed in intervening releases.

The accepted direction is mature realistic fantasy while retaining the NFTree guardians' original stump heads, dark eyes, expressive mouths, branch limbs and equipment. This continues the full-game review after the approved Ironroot sheet; it does not replace that approval or claim the entire audit is complete.

## Current review

| Character or system | Inspected behavior | Status / next correction |
| --- | --- | --- |
| Ironroot Tree Bot | Approved textured bark/iron atlas; four upright views and distance-driven gait | Retained unchanged; verify with the other minibosses in the hosted preview |
| Chainsaw Raider | Formerly a procedural figure; body orientation now uses four views, carried tool and grounded walking poses | Replaced with textured workwear, helmet/visor, gloves, chaps, boots and a supported chainsaw |
| Blight Sprayer (herbicide enemy) | Formerly a procedural figure; keeps its existing recovery/poison gameplay | Replaced with protective coverall, respirator, tanks, hose and wand; four upright walking views |
| Oak | Directional attack-ready atlas and small idle motion | Add distinct root-strike anticipation, release and recovery without changing its identity |
| Pine | Directional launcher pose | Add a braced launcher action and recovery |
| Palm | Directional staff pose | Add staff preparation, wind release and settle |
| Cypress | Directional spear pose | Add a deliberate root-spear thrust and recovery |
| Mushroom | Directional casting pose | Add casting-hand preparation and spore release |
| Willow | Directional casting pose and chain-pulse effect | Add charge, release and follow-through |
| Archer Watchtower | Fixed base, independently rotating weapon and binary two-unit firing offset | Add bow draw, release and reload; avoid moving the whole structure |
| Sap Cannon | Fixed base, independently rotating barrel and binary firing offset | Add progressive barrel recoil and recovery/reload |
| Termites and beetles | Segmented procedural bodies, clock-driven leg movement and instant route heading | Match leg cadence to travel; refine planted feet and turning |
| Moths | Clock-driven wing scaling and speed-burst markers | Refine wing stroke and body banking while retaining actual speed/targeting rules |
| Blight insects | Procedural movement with recovery status | Improve gait and recovery performance while keeping poison suppression |
| Blight King / seasonal bosses | Enlarged insect silhouettes, growth/enrage and seasonal treatments | Review weight, turning and defeat performance with the insect pass |
| Damage and impacts | Engine strikes occur at the attack event; visual shots last 0.32 seconds | Resolve visual arrival/impact mismatch in a separate timing change, with explicit combat-regression checks |
| Defeats | Existing presentation collapse/fade | Refine character-specific deaths after the movement and attack passes |
| The Severed Root cutscenes | Illustrated panels, dialogue, skip/replay and held simulation | Character performances remain pending; current scenes are illustrated, not acted video |

These findings come from the current `src/art.js`, `src/enemy-art.js`, `src/aiming.js`, `src/engine.js` and `src/story.js`. Hosted holder visual acceptance is still required; native rendering is not a wallet-authenticated browser session.

## This pass

- The two human minibosses each use 16 full-body frames: front, right, rear and left, with four walking poses per view.
- Steps use actual route distance. The Raider has a 72-map-unit stride; the heavier Sprayer uses 80. Slows, pause and held dialogs therefore affect the gait naturally.
- A shared foot-based anchor per view prevents carried equipment from recentering the body every frame. One atlas scale and one ground baseline prevent per-frame stretching and vertical floating.
- Miniboss health bars clear the full actor height. Independent image loads retain the upright procedural fallback when an asset is unavailable.
- The original approved Tree Bot image is byte-for-byte unchanged. Engine stats, wave lineups, damage, saves, progression, payments and wallet code are unchanged.

## Assets and prompts

Created with the built-in image generator, using `assets/enemies/ironroot-walk-v1.png` as the reference for rendering style, camera and atlas layout. The reference character was not a redesign target.

- `assets/enemies/chainsaw-raider-walk-v1.png`
- `assets/enemies/blight-sprayer-walk-v1.png`

Shared prompt: production transparent 4×4 walking atlas; exactly sixteen isolated full-body sprites; four columns neutral/left-foot/pass/right-foot; four rows south/east/north/west; fixed elevated game camera; mature realistic fantasy rendering, worn materials, consistent proportions and scale, upper-left light, generous transparent gutters; no text, scenery, borders, gore, toy shapes or cartoon outline.

Raider subject: intimidating adult industrial forest invader, worn brown/rust logging workwear, dull-orange helmet and dark visor, gloves, safety chaps and scuffed boots. One believable rust-orange chainsaw securely supported in both hands at waist height, silver guide bar with chain teeth facing forward; restrained shoulder movement and tool bob, anatomically coherent limbs, hidden face, no backpack.

Sprayer subject: intimidating adult herbicide invader, weathered olive-ochre hooded coverall, full-face respirator and smoky visor, black gloves and boots. Twin-cylinder tank backpack with straps and fittings; flexible hose to one short steel wand held forward at waist height; measured weight transfer and restrained arm movement, no spray or smoke baked into the atlas.

The first Sprayer output had an unwanted pale backdrop and was discarded. A built-in image edit removed the background while preserving all sixteen figures, clothing, equipment, poses, positions and proportions. Final source alpha and all sixteen animation cells are validated by the native renderer.

## Verification

Run `npm test`, `npm run check`, `npm run build:gate`, and `node tools/render-character-review.mjs`. The final command uses the actual game painters, assets and route geometry to create `docs/character-review/mini-boss-views.png`, `battlefield.png`, `mini-boss-walking.mp4` and `verification.json`. It checks transparent source backgrounds, complete animation cells and that painting does not mutate enemy state. The video is an offline native-renderer fixture, not a complete player session.

Two additional regressions cover tool-independent body anchoring, grounded feet, health-bar clearance and independent load failure. Full suite: 236 pass, one existing Windows-only skip, zero failures. Syntax and gated-package builds pass.

Next implementation pass: guardian attack windup/release/recovery, then tower recoil/reload. The insect, impact, defeat and cutscene findings remain open.
