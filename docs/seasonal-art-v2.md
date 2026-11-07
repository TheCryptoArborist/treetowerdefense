# Seasonal artwork and mode revision

Generated using the built-in image tool; original guardian atlases were not replaced. The Christmas illustration is for the entry teaser only. In-game autumn defenders keep the original faces, limbs, shields, aim sockets and animation atlas geometry; a cached runtime palette changes green foliage to copper, with code-native harvest pennants, leaves, straw and gourds.

Project assets:

- `assets/brand/christmas-chaos-preview-v2.webp`: Oak in a Santa hat, and face-free Tree of Life with snow and Christmas lights.
- `assets/environment/terrain-harvest-v2.webp`: distinct top-down autumn orchard ground.
- `assets/enemies/harvest-invaders-v2.webp`: six-cell invader atlas; five enemy roles and an alternate seed-thief sack.
- `assets/brand/harvest-orchard-preview.jpg`: offline rendering of the actual map, sprites and defense uniforms, used by the mode card and atlas. The source render is `docs/harvest-orchard-preview.jpg` and is reproduced by `tools/render-harvest-orchard.mjs` in the primary runtime.

Generated PNG originals were preserved in the generation output directory. Project assets are WebP encodings at quality 86, reducing the three new downloads from about 9 MB to about 1.7 MB. No semantic image changes were made during encoding.

## Prompt set

**Christmas composition.** Edit/composite the supplied Oak home portrait and Tree of Life. Preserve the Oak face, expression, eyes, mouth, body, armor, limbs, pose, shield and linework. Add a fitted red Santa hat with white brim and pompom without obscuring eyes or sprouts. Keep the tree face-free; wrap its canopy and branches with visible warm red, gold, green and teal Christmas bulbs, tiny ornaments and settled snow. Landscape transparent cutout, Oak left, tree right, full silhouettes with generous margins. No background, text, second Oak or redesign.

**Orchard ground.** Use the original forest ground texture as a style reference for a distinct mature top-down autumn orchard. Landscape 3:2, copper leaves, dry brown soil, ochre grass, weathered orchard stone, bare apple trees and amber maple foliage around the outer border. Baskets, hay, apples and tiny pumpkins stay at the edges. Central 85% remains open flat ground. No authored roads, buildings, characters, towers, lettering or interface. Birds-eye view, no horizon; textured painterly realism and a strong autumn identity.

**Invader atlas.** Transparent landscape 3:2 atlas, exactly three columns and two rows, one centered isolated full-body top-down insect facing upward per cell. Reading order: seed-thief weevil with acorn sack; orange ridged pumpkin-shell Gourdback beetle; maple-leaf-wing autumn moth; fungal rot-gourd insect with violet mushrooms and rootlike legs; Hollow Harvester stag-beetle boss with scythe mandibles, hollow pumpkin carapace, dead-branch crown, copper leaf armor and seed sacks; alternate smaller seed-thief carrying an apple. Mature painterly detail, bold readable silhouettes, generous cell margins, no human faces, people, text or dividers.

## Validation and limits

A local engine/art fixture renders all eight defender types and all five invader roles. Palette checks require identical alpha silhouettes and unchanged dark face pixels, while exercising recolored foliage. The fixture is not a hosted holder screenshot. Browser/device visual playtest remains pending.

Fresh Harvest version-two rules: one 8-Sap cache raid per surviving seed thief; repeating ten calm seconds/four seconds of +25% invader speed; two boss escorts at each of 65% and 30% health. Legacy version-one saves retain geometry and rules. These alter earned run resources and combat only; NFT gating, TREE checkout, paid progression and cosmetic reward requirements remain unchanged.
