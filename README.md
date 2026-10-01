# Canopy Defense

**Build your forest. Defend the Tree of Life.**

A playable, mobile-friendly tower-defense prototype for the TREE Arcade.

## Status

This repository contains the **development preview**, not a mainnet launch. NFTree ownership and TREE purchases are explicitly simulated. It connects no wallet, sends no transactions, transfers no tokens, and awards no money or token rewards. Preview ownership, balances, and scores are editable browser data.

## Play locally

Install Node.js 20 or later, open a terminal in this repository, and run:

```sh
npm start
```

Open **http://127.0.0.1:5173**. No dependency installation is required. Keep the terminal running while you play. Use Ctrl+C to stop it.

For an existing Windows clone:

```powershell
Set-Location "D:\Finance\Crypto\Repos\treetowerdefense"
git pull origin main
node .\tools\serve.mjs
```

The direct Node command also works when PowerShell blocks `npm.ps1`. Stop the running server with Ctrl+C before pulling updates, restart it, and refresh the browser.

The server binds to localhost by default and serves only game assets. Do not double-click `index.html`; browser module loading requires the local server. `PORT` and `HOST` can be set explicitly for development.

## NFTree warrior build · v0.3

- Three campaign chapters: **Emerald Crossing**, **Sunpetal Meadow**, and **Moonlit Marsh**. The winding route is shared; each chapter changes the biome and pest difficulty.
- Ten waves per chapter, four expressive pest types, and a final **Blight King** boss.
- Five defenders: Oak splash damage, Pine rapid fire, Palm slowing, Cypress piercing, Mushroom poison.
- A larger bright meadow battlefield with NFTree-style stump warriors with idle movement and attack recoil, marching pests, visible tower growth, distinct attack effects, and optional synthesized sound (off by default).
- Planting sites, automatic targeting, range previews, three permanent species levels, supplies, victory, and defeat.
- Grow each defender species from **Sapling → Guardian → Ancient**. A TREE upgrade improves every current and future defender of that species.
- Chapters unlock in order. Earn 1–3 stars from remaining health, grow the Tree of Life, and add permanent landmarks: an arborist cottage, flower garden, and lily pond.
- A simulated NFTree gate, rarity selector, six cosmetic themes, cumulative rarity unlocks, and per-tower customization.
- TREE-priced upgrades, Root Shield, Fertilizer, Leaf Storm, and a continue that preserves the current wave and towers.
- Earned **Sap** for ordinary tower planting; defeating pests and clearing waves earns more Sap.
- Desktop pointer/keyboard controls and mobile touch controls, including labeled build-site buttons.
- Local save/resume. Reloading restores a running battle **paused**. Switching tabs also pauses battle.

## Agreed game model

| Feature | Requirement |
| --- | --- |
| Game and seasonal access | Own an NFTree |
| Start a fresh run | Included with ownership |
| Supplies | TREE |
| Upgrades | TREE |
| Continues | TREE |
| Rarity cosmetics | Included with the qualifying NFTree |

There is no SUI admission fee and no separately purchased season pass. The developer does not sell received TREE for operating income. The destination of received TREE and a separate operating-income source remain decisions for the production economy; this prototype does not implement a reward split, burns, royalties, or any payout promises.

## Appearance privileges

| NFTree tier | Included theme | Visual privilege |
| --- | --- | --- |
| Common | Woodland | Natural bark, leaf sprouts, wooden shields |
| Rare | Bloom | Flower accents and lighter bark |
| Epic | Enchanted | Purple hues and glowing accents |
| Legendary | Gilded | Golden hues and orbiting sparks |
| Mythic | Celestial | Aqua hues and orbiting lights |
| 1-of-1 | Signature preview | A special preview theme; bespoke NFT-specific artwork is a later milestone |

Each rarity unlocks lower-tier appearances. Different towers may use different unlocked styles. Cosmetics never alter attack strength, targeting, range, or rewards. The production entitlement must follow currently held eligible NFTs, not a saved rarity selector.

## Preview prices and run rules

Prices below are **testing values**, not approved mainnet prices. The preview starts with 150,000 simulated TREE.

| Item | Preview TREE |
| --- | ---: |
| Tower upgrade, level 1 → 2 | 5,000 |
| Tower upgrade, level 2 → 3 | 10,000 |
| Root Shield | 3,000 |
| Fertilizer | 5,000 |
| Leaf Storm | 8,000 |
| Continue after defeat | 20,000 |

Starting a fresh run clears the battlefield and wave progress, while keeping the preview TREE balance, access selection, default appearance, permanent species levels, and best chapter stars. Removing a defender returns 60% of its Sap planting cost; permanent species growth stays and TREE is not refunded. Each upgrade costs TREE once for that species level, regardless of how many of those defenders you plant. Supplies apply to the current run. Reset Preview resets all local development progress and simulated funds after confirmation.

Finishing ten waves awards three stars with 80+ remaining health, two with 40+, or one otherwise. Replay can improve the best rating, and never lowers it. Stars are non-financial game progress and are not tokens or prizes. Original v1 preview saves migrate existing ownership choices, funds, and the highest purchased level of each species into this growth system.

## Controls

- Select a defender, then click/tap a glowing site or a labeled build-site button.
- Select a planted defender to grow its species, remove that defender, or change its individual appearance.
- Send each wave when ready. Pause/Resume controls preserve the current battle.
- Keyboard: **1–5** select defenders; **N** sends a wave; **Space** pauses/resumes; **Escape** clears the selection.

## Validation

```sh
npm test
npm run check
```

The 19 Node tests cover access gating, purchase accounting, rarity permissions, pause/resume, save validation, loss/continue, old-save migration, permanent species growth, chapter unlocks and stars, and all three ten-wave chapters including their bosses.

Validation for v0.3: all 19 engine tests and JavaScript syntax checks pass. Five transparent growth atlases were loaded and isolated into 15 complete warrior silhouettes. Canvas drawing paths for all 90 combinations of defender species, style, and growth level, all five pests, and all five attack effects were rendered without errors. The resulting art was visually inspected. Local HTTP assets and source references were checked. Desktop and mobile browser interaction/layout checks remain pending: the cloud browser blocks local preview URLs, and a local browser binary was unavailable. Responsive styles and touch controls are implemented, but their complete browser layout has not yet been verified.

## Art preview

The character sheet below is rendered from the game’s actual drawing code; it is not a browser screenshot.

![NFTree warrior growth and appearances](docs/warrior-growth.png)

Artwork is generated from the three supplied character references, then used in the battlefield, planting cards, tower inspector, and appearance previews. See [the asset list and generation prompts](docs/warrior-art.md). Original generated PNGs are preserved; the runtime isolates silhouettes and caches recolors. The earlier v0.2 art sheet remains in `docs/guardian-growth.png` for reference.

## Mainnet integration milestone

Before real payments or access enforcement, confirm the NFTree collection/type, rarity metadata, ownership arrangements, TREE decimals, purchase recipient, and final prices. Ownership and transaction results need authoritative validation. Client-side localStorage is not authentication or payment proof, and local scores must not authorize prizes.

For Sui implementation, check the current [MystenLabs/skills README](https://github.com/MystenLabs/skills) every task, then load applicable current skills and references. Reviewed for this prototype boundary:

- `frontend-apps/SKILL.md` and `frontend-apps/limitations.md`
- `accessing-data/SKILL.md` and `accessing-data/use-cases.md`

No deprecated Sui JSON-RPC or legacy dApp Kit dependencies have been added. A production wallet/payment implementation is intentionally a separate milestone.
