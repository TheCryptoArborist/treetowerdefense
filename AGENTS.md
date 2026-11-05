# Canopy Defense project instructions

Read README.md for accepted product decisions and current prototype limitations.

- Keep the original fixed-route tower-defense format; multiplayer raids are outside the current plan. Seasonal Halloween, Thanksgiving and Christmas themes should add challenges and earnable cosmetics while preserving permanent roster and growth. See docs/seasons-and-progression.md for the design plan; Haunted Grove is playable in v0.12; Harvest of the Canopy is the November active event; Christmas remains planned.

- Check the live https://github.com/MystenLabs/skills README before every project task. For Sui technical decisions, load the applicable current SKILL.md and supporting files before acting. If access fails, report it and do not claim the live guidance was consulted.
- The protected tree is named **Tree of Life**.
- NFTree ownership grants game and seasonal access. Starting new runs is included. There is no SUI admission fee or separate season-pass purchase.
- Supplies, upgrades, and continues use **TREE**, not free currency and not SUI.
- Earned Sap is the ordinary run resource for planting defenders. Avoid confusing Sap with transferable TREE.
- The developer does not sell received TREE. Do not introduce treasury swaps, reward splits, burns, or cash payouts without explicit authorization.
- Rarity privileges are cosmetic. Higher tiers unlock lower appearances. Per-tower styles must not change combat statistics.
- Tower growth is permanent by species (Sapling → Guardian → Ancient). One TREE upgrade improves all current and future defenders of that species. A fresh run keeps species growth, best chapter stars, and landmarks.
- Preserve migration of original v1 preview saves: keep ownership choices and TREE balance, and carry the highest purchased level of each species into permanent growth. All saved progress remains a local simulation.
- Defenders follow the supplied NFTree references: jagged stump heads, dark eyes, expressive mouths, branch limbs, leaf sprouts, and wooden armor/shields. Keep the protected Tree of Life as a living canopy tree.
- Art direction is a mature painterly fantasy forest: textured terrain, weathered stone, an ancient face-free Tree of Life, and threatening insect pests. Avoid the earlier pastel lawn, cartoon hedge borders, smiling tree, or human-faced pests. Keep the NFTree warrior reference identity.
- Original expressive forest characters, visible tower growth, and a prominent battlefield follow the user's preferences for Plants vs. Zombies and Clash of Clans.
- NFTree access must be verified on Sui Mainnet. TREE funds and purchase prices remain a development simulation and must be prominently labeled. Never present simulated payments as mainnet behavior.
- Client-side saved state is editable. Never use it as production payment proof, ownership proof, or prize eligibility.
- Preserve mobile touch access and keyboard alternatives. Use labeled build-site buttons as an alternative to canvas input.
- Run `npm test` and `npm run check` for game changes; inspect relevant browser flows when possible.

- Earned roster unlocks persist across runs: Oak/Pine start; Palm/Cypress/Mushroom after Emerald waves 2/4/6; Watchtower after Emerald victory; Willow at 4 best campaign stars; Cannon after Sunpetal victory. Unlocks have no currency fee and never depend on rarity. Planting uses Sap; TREE still pays for growth, supplies and continues. Original saves retain the five previously available guardians. Thorn Bastion and Root Obelisk remain Coming later.

- v0.11 new-run pest traits: moth bursts use shared actual movement/targeting speed; blight recovery stops during poison and is delayed by hits. Preserve optional enemyRules and per-pest behavior/timers; pre-trait saved runs keep legacy rules until a new run. Haunted Grove is now implemented; later seasonal events remain planned.

- Haunted Grove is a separate five-wave mode unlocked by Emerald victory. Seasonal progress and cosmetics never grant campaign stars or combat roles. Preserve eventVersion 1, queued pests, eventTeam, season and seasonLooks on save/continue. Preview event has no expiry or entry fee; earned looks are optional overlays available at every rarity. See docs/haunted-grove.md.

- Page branding follows NFTree.net: navy #040810, teal #00f1d2, mint #7ef3a0, gold #ffd84b, amber #ffad32. Use original ecosystem graphics in assets/brand, preserve the mature battlefield art, and keep the simulated-payment notice visible. See docs/ecosystem-branding.md.

- Sunpetal new runs use meadow-v1; Moonlit new runs use marsh-v1; Emerald and Haunted Grove use crossing-v1. All geometry consumers must use the active map, including pointer input, pest/defeat orientation and restore. Saves without mapId keep crossing-v1 until a fresh run. Preserve queued enemies, growth, funds and seasonal progress. See docs/sunpetal-map.md.

- Moonlit Marsh uses staggered causeways and all geometry consumers share marsh-v1. Both missing mapId and explicit crossing-v1 Moonlit saves keep the old route through reload/continue. Wet pockets and the relocated permanent pond must remain clear of route and build sites. See docs/moonlit-map.md.

- v0.17 canonical gameplay is NFTree-gated by the isolated canopy-access function. Never restore the simulated rarity/access picker. Public preview/video stay public. Preserve the 40 pre-existing functions and five schedules; only the new Canopy gate may be added/updated. Protected src modules must not be present in the public static inventory. Session/nonce proofs must never be read from localStorage or trusted as payment entitlements. See docs/nftree-access.md.

- November active season is Harvest of the Canopy (`harvest-canopy`, eventVersion 1), a separate five-wave event with Hollow Harvester. Keep Haunted Grove saved runs, progress, reward IDs and equipped Halloween looks. New seasonal entry starts Harvest; legacy engine `startEvent()` still defaults to Haunted Grove for save/test compatibility. Harvest progress and looks are separate (`harvest`, `harvestLooks`), never campaign stars or payment proof. See docs/harvest-canopy.md.

- Updated user decision: individual defender progression replaces species-wide growth in the new collection preview. Twelve numbered copies per species match the twelve-site battlefield limit; each copy can deploy once and retains its own level across removal, runs, chapters and seasons. Existing species purchases remain a grandfathered minimum on all twelve copies. Keep legacy engine compatibility for existing saves/tests, but use collection mode in the new UI. Server inventory is authoritative in paid mode; never trust browser collection levels. Enable only on the isolated checkout preview after its additive migration applies. Ten levels, HQ progression and research remain planned. See docs/individual-defenders.md.

- Updated user decision: gameplay comes before collections and promotional panels. Use one compact level path: 1–3 standard forests and 4–6 existing Veteran variants; show real unlock milestones and preserve separate star sets. Halloween archive UI is removed because it never publicly launched; retain engine/save compatibility. Harvest and other secondary panels are collapsed below the battlefield. Watchtower and Cannon tuning and future-structure constraints are documented in docs/play-first-home.md.

- Updated user direction: use illustrated command buttons near the map for Defenders, Shop, Harvest, Field guide, Unlocks and Scout. Heavy management content belongs in the native command window; the compact portrait deployment dock stays beside/below the map. TREE ecosystem stays near the footer. See docs/battlefield-command-menu.md. Keep battle simulation held while management is open and leave a running battle paused on close, without disabling active-wave supply eligibility inside the shop.

- Clear upgrade direction: label the map command Upgrade defenses; show the individual TREE action above stats/targeting with next-level gains and per-level prices. New campaign runs use encounters:1, adding named mini-bosses on waves 4/7; old saves without the flag preserve prior waves. Seasonal bosses and final wave 10 remain intact. See docs/upgrades-and-mini-bosses.md.

- The Severed Root story uses skippable native-dialog cutscenes between waves. Hold simulation while open, retain manual next-wave control, preserve the separate story preference and replay entry, and never tie narrative progress to TREE purchases or ownership proof. See docs/the-severed-root.md.

- Playtest correction: prefer available level-one copies when planting; never automatically pick the strongest copy. Match deployment art to the selected copy and show its number/level before planting. Preserve explicitly selected individual upgrades and grandfathered verified species purchases, labeling reused/inherited levels. Oak launches from its directional fist, including every growth level and fallback art. Wave scenes now use a separate twelve-second three-shot animation clock with moving guardians/enemies, calibrated strikes, root signals and camera cuts; reduced motion shows one fixed composition. See docs/playtest-corrections.md.

- Combat motion is published to the isolated checkout-test route; see docs/combat-motion.md and integration/tree-arcade/combat-motion-release-receipt.json. Preserve the grounded procedural performances, independent tower reloads, distance-driven enemy gait and reduced-motion/pause behavior. The package must contain dependency files, not a checkout-local node_modules link; its Node 24 runtime matches the accepted test backend. Holder desktop/phone and real TREE checkout acceptance remain pending.

- Watchtower shots must read as physical arrows: fixed-length wooden shaft, feathered tail and metal head at the recorded hit. Do not restore a full-range bow-to-target line or magical muzzle glow. Keep immediate hit timing, aim direction, pause/reduced-motion handling, damage and cadence. See docs/strike-feedback.md and integration/tree-arcade/watchtower-arrow-release-receipt.json.

- Cutscenes have shared opt-in audio with controls inside the native story dialog. Keep original score/effects on the story presentation clock, optional device narration with visible fallback/replay, and cancellation on beat changes, skip/close, mute, hidden tabs and access loss. Voice completion must never advance the story or a wave. See docs/cutscene-audio.md. Actual device narration/phone acceptance remains pending.

- Narration direction is an original deep, commanding announcer delivery. Heroic announcer is the default; Natural storyteller and an available-English-device-voice picker let players audition alternatives. Preserve mute/cancellation and manual story pacing when changing delivery or voice. Do not present a preset as a replica of an identifiable performer or character.

- The living frontier atlas includes every existing campaign wave plus the Harvest branch. Inspecting nodes never skips waves; travel uses existing level/event entry at wave 1. Preserve pause/manual Resume, NFTree gating and confirmation before replacing an unfinished battle. Keep separate standard, Veteran and seasonal progress, including additive veteranBestWaves migration. Additional frontier regions are unavailable until authored. See docs/world-map.md. This update is not published while CLI authorization is pending.
