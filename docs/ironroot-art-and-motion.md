# Ironroot artwork and motion

The first correction from the full art audit replaces the Ironroot Tree Bot's flat procedural body with a textured bark-and-iron walking atlas. Its identity, wave placement, health, armor, speed, rewards and counters are unchanged.

`assets/enemies/ironroot-walk-v1.png` is the original transparent generated atlas: four walking poses in each of four upright views (south, east, north, west). The built-in image generator produced it. Runtime alpha bounds select cells without rewriting the source image. All cells share one scale; feet meet the same ground anchor. The full-body artwork is not stretched or rotated around corners.

`src/enemy-art.js` selects poses from actual traveled route distance, with a full cycle every 80 map units. Slows and Veteran speed therefore affect stepping naturally. A paused or modal-held battle cannot advance a stationary bot's walk cycle. Reduced motion uses the first pose of the appropriate view. The four views still switch at bends; this is a four-pose animation, not a rigged model or a continuous turning blend.

All mini-bosses now remain upright instead of inheriting insect body rotation. Chainsaw Raider and Blight Sprayer retain their existing procedural artwork pending their own replacement. If the Ironroot image fails to load, the existing upright fallback is retained. Health bars use upright bounds instead of rotated insect bounds. The scout portrait refreshes after loading.

## Verification

Three regression tests cover route headings, distance-driven gait, reduced motion, upright rendering on every route leg, health-bar placement, common atlas scale, grounding, and invalid cells. The full suite passes (234 passed, one existing skip), as do syntax checks. A native canvas fixture uses the real game renderer and actual assets to produce `ironroot-walk-preview.mp4` and `.png`; it is not an authenticated browser test.

## Asset prompt

Production game sprite atlas for Canopy Defense, realistic fantasy materials, not cartoon. Exactly sixteen full-body sprites of the same intimidating Ironroot Tree Bot on transparent background, uniform four-column by four-row grid. Columns: planted, left foot forward, weight transfer, right foot forward. Rows: south, east, north, west. Fixed elevated three-quarter game camera; upright bodies. Weathered bark torso and limbs, blackened bolted iron shoulders, articulated root feet, broken branch antlers, narrow orange eyes, amber furnace core, industrial exhaust pipes. Rich bark and aged iron, coherent proportions and soft top-left lighting. No text, scenery, grid lines, cute features, cartoon outlines or flat toy geometry.

## Remaining art audit work

Replace the other two mini-bosses next, then add defender attack/recovery frames and tower recoil/reload. Insect leg cadence, projectile-impact synchronization, death sequences and story character animation remain separate work. This update does not claim those audit findings are resolved.
