# Finished artwork before entry

The first battle frames previously drew procedural fallbacks while environment
textures and guardian atlases loaded and were prepared. Pine could briefly be
an oversized simple figure and the road a flat tan path. Each arriving asset
then replaced part of the visible battlefield.

The protected app now keeps its dynamic import pending until environment,
defender, directional, structure and enemy graphics have finished preparing.
It invalidates presentation caches, renders the finished controls and paints
the first battlefield while the game shell is still hidden. Only then does the
holder gateway reveal the game and start its normal animation loop. The frame
clock starts fresh, so waiting does not advance battle simulation.

The existing holder entrance displays “Preparing the forest…” and an indicator
that respects reduced motion. Entry is single-flight, and a disconnect, wallet
change or session expiration during loading cannot reveal the old wallet's
forest. Background ownership checks continue during loading and do not overwrite the
loading message.

Missing images, failed preparation and a 20-second loading deadline keep the
game hidden and offer Reload graphics. A warm cache requires no artificial
delay. No run progress is reset, and access verification, TREE purchases and
the approved retro cutscene presentation retain their existing rules.

Nine regressions cover delayed preparation, cached loads, partial failures,
stalled images, repeated entry clicks, access changes, expiry and reload. Peter
accepted the subsequent live playtest. Its device was not specified; phone
acceptance remains separate.


## Release

Live on checkout-test from source `38fae28`. Backend:
`6aed4f691bb40119f21ffe4d`; routing: `6aed50085e7465e17b0df3a2`.
300 local tests pass, one Windows-only check is skipped, and syntax/protected
packaging pass. GitHub validation run `42159273436` passed. All real artwork
sheets were decoded and prepared successfully using the production installers.
All 43 production function identities/configurations, five schedules and 299
static paths were retained; only the existing checkout rewrite target changed.
Live gate, gateway and styles pass HTTP checks; private modules, access and
payment endpoints remain protected. Peter accepted the subsequent live
playtest; phone acceptance was not separately confirmed.
See [release evidence](../integration/tree-arcade/forest-loading-release-receipt.json).
