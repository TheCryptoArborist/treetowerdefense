# TREE Arcade integration · v0.16.1

Canonical home: https://tree-token.xyz/play/canopy-defense/ . Lobby: https://tree-token.xyz/play/ . The game header includes a visible return link and its brand returns to the same lobby. Relative scripts, styles and image URLs resolve under the game directory. Preserve the trailing slash.

The remaining empty cabinet in the current live lobby becomes Canopy Defense, using the original Tree Hero artwork. It is labeled PREVIEW and explicitly describes simulated NFTree access and TREE purchases. No wallet or payment implementation is added. Existing gameplay rules and save keys are retained. Local saves are browser-origin-specific: progress on the earlier ChatGPT-hosted preview does not automatically migrate to tree-token.xyz.

`integration/tree-arcade/lobby.html` captures the live October 31 lobby with only the remaining future-game cabinet replaced; it preserves Deadfall Run, Tree Force, Garden Battles, growth controls and other current content. The production site's main branch contains an older lobby, so do not deploy its full source snapshot over live production.

`tools/release-arcade.mjs` prepares a digest overlay over the actual locked published Netlify release, verifies the previous lobby SHA, retains every unrelated file, all 40 functions including full provider/runtime/route/traffic-rule configuration, and five schedules. Only `/play/index.html` is replaced; 33 new public game files are added beneath `/play/canopy-defense/`. Never deploy development server tools, tests, docs or integration metadata as public game files. A changed live deployment aborts release. Preserve the newly published lock.

The candidate is reviewed before publication. Package identities, the complete file inventory, runtime settings and schedules must match before publication. `release-plan.json` binds the exact lobby bytes used for the overlay. No production wallet code or backend is rebuilt.
