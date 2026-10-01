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
npm start
```

The server binds to localhost by default and serves only game assets. Do not double-click `index.html`; browser module loading requires the local server. `PORT` and `HOST` can be set explicitly for development.

## First playable build

- One forest map: **The Emerald Crossing**.
- Ten waves, four pest types, and a final **Blight King** boss.
- Five defenders: Oak splash damage, Pine rapid fire, Palm slowing, Cypress piercing, Mushroom poison.
- Planting sites, automatic targeting, range previews, three tower levels, supplies, victory, and defeat.
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
| Common | Woodland | Natural bark, green canopy, root bases |
| Rare | Bloom | Flowering canopy, seasonal colors |
| Epic | Enchanted | Glowing accents, floating leaves |
| Legendary | Gilded | Golden bark, animated runes |
| Mythic | Celestial | Shimmering roots, orbiting lights |
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

Starting a fresh run clears the battlefield, wave progress, and run-specific upgrades, while keeping the preview TREE balance, access selection, and default appearance. Removing a defender returns 60% of its Sap planting cost; consumed TREE upgrades are not refunded. Reset Preview resets all local development progress and simulated funds after confirmation.

## Controls

- Select a defender, then click/tap a glowing site or a labeled build-site button.
- Select a planted defender to upgrade, remove, or change its appearance.
- Send each wave when ready. Pause/Resume controls preserve the current battle.
- Keyboard: **1–5** select defenders; **N** sends a wave; **Space** pauses/resumes; **Escape** clears the selection.

## Validation

```sh
npm test
npm run check
```

The Node tests cover access gating, purchase accounting, rarity permissions, pause/resume, save validation, loss/continue, and a complete ten-wave victory including the boss.

Initial validation: all 14 engine tests and JavaScript syntax checks pass. Local HTTP asset checks pass. Desktop and mobile browser interaction/visual checks remain pending: this build environment could not download its local browser, and the cloud browser blocked the localhost URL. Responsive styles and touch controls are implemented, but their visual layout has not yet been browser-verified.

## Mainnet integration milestone

Before real payments or access enforcement, confirm the NFTree collection/type, rarity metadata, ownership arrangements, TREE decimals, purchase recipient, and final prices. Ownership and transaction results need authoritative validation. Client-side localStorage is not authentication or payment proof, and local scores must not authorize prizes.

For Sui implementation, check the current [MystenLabs/skills README](https://github.com/MystenLabs/skills) every task, then load applicable current skills and references. Reviewed for this prototype boundary:

- `frontend-apps/SKILL.md` and `frontend-apps/limitations.md`
- `accessing-data/SKILL.md` and `accessing-data/use-cases.md`

No deprecated Sui JSON-RPC or legacy dApp Kit dependencies have been added. A production wallet/payment implementation is intentionally a separate milestone.
