# Canopy cabinet scene

Use the supplied Oak Guardian / Archer Watchtower / Tree of Life forest scene in the Tree Arcade cabinet. The same scene already exists as an optimized 1254px square WebP at the same-origin `/play/canopy-defense/checkout-test/assets/brand/canopy-home-scene.webp` (200 image/webp, inspected against the supplied PNG). Keep the existing cabinet frame's object-fit: contain so the entire scene remains visible without distortion. The preview link and every other cabinet remain unchanged.

`integration/tree-arcade/cabinet-scene-lobby.html` is an exact current production lobby overlay with just the Canopy img element replaced (URL, descriptive alt, intrinsic dimensions). The release helper verifies byte identity against the currently published lobby, accounting only for the known hosting-injected Arboretum snippet. It references every existing static and backend digest and checks configurations and five schedules before publication. It uses official Netlify CLI authentication without reading token files.

Baseline 6aebec00ada2550dc6f59eee: 290 static paths, 43 existing functions, five schedules. No builds, wallet changes or backend replacement. No game tests needed for this image reference change; syntax, exact replacement, image response, file preservation and published markup are checked.
