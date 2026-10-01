# NFTree warrior artwork · v0.3

The five defender families follow the three character references supplied by the user: jagged stump heads, hollow dark eyes, shouting mouths, bark limbs, leaf sprouts, wooden shields, and armor. Cypress uses the pale bark and narrowed eyes of the second reference. The Tree of Life remains a living canopy tree.

Generated with the built-in image-generation tool, using all three supplied references and transparent-background output. The original generated PNGs are copied unchanged into `assets/defenders/`. Each atlas includes Sapling, Guardian, and Ancient growth. The game isolates alpha-connected silhouettes at runtime, preserving overlapping atlas bounds without including neighboring warriors, and caches cosmetic color variants. Minor disconnected spores follow the nearest silhouette. No edited image files are produced by this extraction.

Animation uses whole-body idle bobbing and attack recoil; these are growth atlases, not frame-by-frame attack sprite sheets. Rarity overlays and colors never change combat statistics. Browser canvas falls back to matching procedural stump characters if an asset cannot load.

## Asset set

| Defender | Asset | Distinction |
| --- | --- | --- |
| Oak | `assets/defenders/oak-warriors.png` | Oak sprouts, heavy shield and fists |
| Pine | `assets/defenders/pine-warriors.png` | Needle shoots and launcher gauntlet |
| Palm | `assets/defenders/palm-warriors.png` | Palm fronds and wind staff |
| Cypress | `assets/defenders/cypress-warriors.png` | Pale bark, determined eyes, spear |
| Mushroom | `assets/defenders/mushroom-warriors.png` | Purple cap and spores |

## Generation prompts

These prompts were used with the three user-supplied reference images. The generated spacing was irregular, so the runtime uses alpha silhouettes rather than assuming exact thirds.

### oak

Use case: stylized-concept.
Asset type: transparent 2D tower-defense game sprite strip, THREE growth variants of ONE oak defender.
Input images 1, 2, 3 are CHARACTER DESIGN REFERENCES. Match their distinctive NFTree identity: jagged-cut stump head, vertical bark grain, very bold nearly black comic outlines, large completely black hollow eyes, expressive open black mouth with a few large white teeth, short wooden torso, muscular branch arms, stout wooden legs and dark root boots, vivid fresh leaf sprouts. Do not reuse the electric, blue or red background. Do not turn this into a round leafy smiling tree.
Subject: Oak guardian: a broad, muscular ochre-brown stump warrior with big oak leaf sprouts, clenched wooden left fist and a chunky angular oak shield in its right hand.
Composition: landscape image, ideally 1536 by 1024. EXACTLY THREE separate full-body figures arranged in THREE EQUAL WIDTH COLUMNS, side by side, with generous transparent gutters. Each figure centered in its own one-third of the canvas. Feet share a baseline at 88% image height. Left is Sapling (compact plain warrior with simple wood equipment), middle is Guardian (thicker bark, stronger arms, reinforced wooden shield and modest bark shoulder guards), right is Ancient (largest, broad armored bark shoulders, more leaf sprouts and elaborately carved wood equipment). Each is the same character growing, not three unrelated characters. Keep natural wood and green leaves on ALL three; no gold rarity coloring, purple body, glowing aura or floating crown. Left may be smaller but all complete silhouettes fit their own column with a substantial empty gutter. Front-facing slight three-quarter stance angled a little toward screen right. All arms, weapons, boots, shield and leaves completely visible; no overlap between columns.
Style: crisp thick-outline cartoon illustration, restrained flat shading with clear bark texture and readable chunky silhouettes at game-icon size. Closely match supplied characters; energetic and slightly fierce, appealing game heroes. Reference 1's round hollow eyes for Oak/Pine/Palm/Mushroom; reference 2's determined eyes for Cypress.
Backdrop: TRUE transparent background with alpha. No scene, no ground plane, no shadows painted outside the character silhouette, no text, labels, border, grid, logos or watermark. Make no additional figures.

### pine

Use case: stylized-concept.
Asset type: transparent 2D tower-defense game sprite strip, THREE growth variants of ONE pine defender.
Input images 1, 2, 3 are CHARACTER DESIGN REFERENCES. Match their distinctive NFTree identity: jagged-cut stump head, vertical bark grain, very bold nearly black comic outlines, large completely black hollow eyes, expressive open black mouth with a few large white teeth, short wooden torso, muscular branch arms, stout wooden legs and dark root boots, vivid fresh leaf sprouts. Do not reuse the electric, blue or red background. Do not turn this into a round leafy smiling tree.
Subject: Pine guardian: a compact, slightly tapered honey-brown stump warrior with a tuft of dark green pine needles, a small wooden shield on one forearm and a wooden needle-launcher gauntlet on the other.
Composition: landscape image, ideally 1536 by 1024. EXACTLY THREE separate full-body figures arranged in THREE EQUAL WIDTH COLUMNS, side by side, with generous transparent gutters. Each figure centered in its own one-third of the canvas. Feet share a baseline at 88% image height. Left is Sapling (compact plain warrior with simple wood equipment), middle is Guardian (thicker bark, stronger arms, reinforced wooden shield and modest bark shoulder guards), right is Ancient (largest, broad armored bark shoulders, more leaf sprouts and elaborately carved wood equipment). Each is the same character growing, not three unrelated characters. Keep natural wood and green leaves on ALL three; no gold rarity coloring, purple body, glowing aura or floating crown. Left may be smaller but all complete silhouettes fit their own column with a substantial empty gutter. Front-facing slight three-quarter stance angled a little toward screen right. All arms, weapons, boots, shield and leaves completely visible; no overlap between columns.
Style: crisp thick-outline cartoon illustration, restrained flat shading with clear bark texture and readable chunky silhouettes at game-icon size. Closely match supplied characters; energetic and slightly fierce, appealing game heroes. Reference 1's round hollow eyes for Oak/Pine/Palm/Mushroom; reference 2's determined eyes for Cypress.
Backdrop: TRUE transparent background with alpha. No scene, no ground plane, no shadows painted outside the character silhouette, no text, labels, border, grid, logos or watermark. Make no additional figures.

### palm

Use case: stylized-concept.
Asset type: transparent 2D tower-defense game sprite strip, THREE growth variants of ONE palm defender.
Input images 1, 2, 3 are CHARACTER DESIGN REFERENCES. Match their distinctive NFTree identity: jagged-cut stump head, vertical bark grain, very bold nearly black comic outlines, large completely black hollow eyes, expressive open black mouth with a few large white teeth, short wooden torso, muscular branch arms, stout wooden legs and dark root boots, vivid fresh leaf sprouts. Do not reuse the electric, blue or red background. Do not turn this into a round leafy smiling tree.
Subject: Palm guardian: a tan ridged stump warrior with a crown of palm fronds, a wooden round shield, and a curved wooden wind staff with a green leaf fan tip.
Composition: landscape image, ideally 1536 by 1024. EXACTLY THREE separate full-body figures arranged in THREE EQUAL WIDTH COLUMNS, side by side, with generous transparent gutters. Each figure centered in its own one-third of the canvas. Feet share a baseline at 88% image height. Left is Sapling (compact plain warrior with simple wood equipment), middle is Guardian (thicker bark, stronger arms, reinforced wooden shield and modest bark shoulder guards), right is Ancient (largest, broad armored bark shoulders, more leaf sprouts and elaborately carved wood equipment). Each is the same character growing, not three unrelated characters. Keep natural wood and green leaves on ALL three; no gold rarity coloring, purple body, glowing aura or floating crown. Left may be smaller but all complete silhouettes fit their own column with a substantial empty gutter. Front-facing slight three-quarter stance angled a little toward screen right. All arms, weapons, boots, shield and leaves completely visible; no overlap between columns.
Style: crisp thick-outline cartoon illustration, restrained flat shading with clear bark texture and readable chunky silhouettes at game-icon size. Closely match supplied characters; energetic and slightly fierce, appealing game heroes. Reference 1's round hollow eyes for Oak/Pine/Palm/Mushroom; reference 2's determined eyes for Cypress.
Backdrop: TRUE transparent background with alpha. No scene, no ground plane, no shadows painted outside the character silhouette, no text, labels, border, grid, logos or watermark. Make no additional figures.

### cypress

Use case: stylized-concept.
Asset type: transparent 2D tower-defense game sprite strip, THREE growth variants of ONE cypress defender.
Input images 1, 2, 3 are CHARACTER DESIGN REFERENCES. Match their distinctive NFTree identity: jagged-cut stump head, vertical bark grain, very bold nearly black comic outlines, large completely black hollow eyes, expressive open black mouth with a few large white teeth, short wooden torso, muscular branch arms, stout wooden legs and dark root boots, vivid fresh leaf sprouts. Do not reuse the electric, blue or red background. Do not turn this into a round leafy smiling tree.
Subject: Cypress guardian: a narrow pale ivory-bark stump warrior like reference image 2, cypress leaf shoots, a long dark wooden root spear held upright and a slender kite-shaped wooden shield.
Composition: landscape image, ideally 1536 by 1024. EXACTLY THREE separate full-body figures arranged in THREE EQUAL WIDTH COLUMNS, side by side, with generous transparent gutters. Each figure centered in its own one-third of the canvas. Feet share a baseline at 88% image height. Left is Sapling (compact plain warrior with simple wood equipment), middle is Guardian (thicker bark, stronger arms, reinforced wooden shield and modest bark shoulder guards), right is Ancient (largest, broad armored bark shoulders, more leaf sprouts and elaborately carved wood equipment). Each is the same character growing, not three unrelated characters. Keep natural wood and green leaves on ALL three; no gold rarity coloring, purple body, glowing aura or floating crown. Left may be smaller but all complete silhouettes fit their own column with a substantial empty gutter. Front-facing slight three-quarter stance angled a little toward screen right. All arms, weapons, boots, shield and leaves completely visible; no overlap between columns.
Style: crisp thick-outline cartoon illustration, restrained flat shading with clear bark texture and readable chunky silhouettes at game-icon size. Closely match supplied characters; energetic and slightly fierce, appealing game heroes. Reference 1's round hollow eyes for Oak/Pine/Palm/Mushroom; reference 2's determined eyes for Cypress.
Backdrop: TRUE transparent background with alpha. No scene, no ground plane, no shadows painted outside the character silhouette, no text, labels, border, grid, logos or watermark. Make no additional figures.

### mushroom

Use case: stylized-concept.
Asset type: transparent 2D tower-defense game sprite strip, THREE growth variants of ONE mushroom defender.
Input images 1, 2, 3 are CHARACTER DESIGN REFERENCES. Match their distinctive NFTree identity: jagged-cut stump head, vertical bark grain, very bold nearly black comic outlines, large completely black hollow eyes, expressive open black mouth with a few large white teeth, short wooden torso, muscular branch arms, stout wooden legs and dark root boots, vivid fresh leaf sprouts. Do not reuse the electric, blue or red background. Do not turn this into a round leafy smiling tree.
Subject: Mushroom guardian: a warm brown stump warrior with green leaf sprouts and a broad purple mushroom cap helmet decorated with pale spots; a small wooden shield, and one wooden fist releasing a few tiny pale spores. The body and face remain the same stump-warrior family, not a mushroom-shaped body.
Composition: landscape image, ideally 1536 by 1024. EXACTLY THREE separate full-body figures arranged in THREE EQUAL WIDTH COLUMNS, side by side, with generous transparent gutters. Each figure centered in its own one-third of the canvas. Feet share a baseline at 88% image height. Left is Sapling (compact plain warrior with simple wood equipment), middle is Guardian (thicker bark, stronger arms, reinforced wooden shield and modest bark shoulder guards), right is Ancient (largest, broad armored bark shoulders, more leaf sprouts and elaborately carved wood equipment). Each is the same character growing, not three unrelated characters. Keep natural wood and green leaves on ALL three; no gold rarity coloring, purple body, glowing aura or floating crown. Left may be smaller but all complete silhouettes fit their own column with a substantial empty gutter. Front-facing slight three-quarter stance angled a little toward screen right. All arms, weapons, boots, shield and leaves completely visible; no overlap between columns.
Style: crisp thick-outline cartoon illustration, restrained flat shading with clear bark texture and readable chunky silhouettes at game-icon size. Closely match supplied characters; energetic and slightly fierce, appealing game heroes. Reference 1's round hollow eyes for Oak/Pine/Palm/Mushroom; reference 2's determined eyes for Cypress.
Backdrop: TRUE transparent background with alpha. No scene, no ground plane, no shadows painted outside the character silhouette, no text, labels, border, grid, logos or watermark. Make no additional figures.

