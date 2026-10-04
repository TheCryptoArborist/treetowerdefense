# Guardian targeting · v0.9

Mixed waves create different threats. Selecting an individual guardian now opens a **Target priority** select in its inspector. The same engine target list drives attacks, turning poses, and visual shots.

| Order | Primary choice within range | Use and tradeoff |
| --- | --- | --- |
| First | Greatest route progress | Reliable default for catching escapes. Retains the previous combat behavior. |
| Strongest | Highest remaining HP | Focus tough beetles, blight, or the King. Wounded front runners can escape while it focuses another pest. Armor is not part of this ranking. |
| Fastest | Highest current movement speed | Intercept moths. Active slows count, so a Palm can switch toward an unslowed threat. Slowed moths may rank below other pests. |

Equal health or speed falls back to greatest route progress. Complete ties retain enemy order. Dead and out-of-range pests are excluded. Cypress's second hit uses the next pest in the same ranked list; Oak splash and Mushroom poison still affect the same existing area around the chosen primary target. Damage, range, attack intervals, and status durations are unchanged.

Orders apply to one guardian. They are included tactical commands, not growth upgrades or supplies. Commands work during building, battle, or pause with preview NFTree access; they cannot restart a cooldown or create an extra shot. Paused commands leave battle time, pest movement, and resources unchanged. An already-fired projectile and its facing hold finish before the guardian switches its visual pose. The next attack uses the new order.

Growth remains permanent by species and paid in simulated TREE. Growth does not erase orders on existing guardians. New guardians start on First. New runs clear the battlefield and orders while retaining permanent species growth and forest progress.

## Saves and compatibility

The existing v2 schema and `canopy-defense-preview-v1` storage key remain. Each current guardian saves its optional `targetMode` field. Reloading restores orders with the battle paused; a paid preview continue retains them. Old v1/v2 saves lacking the field default to First. Unknown or malformed optional values also default to First without discarding the rest of a valid save. Original balances, purchased growth, queued pests, health, scores, and stars follow the same migration and validation rules.

This remains a development preview with simulated access and TREE balances. Targeting is not NFT rarity power: every preview rarity has the same commands. Supplies, growth, and continues retain their TREE prices. No wallets, real payments, rewards, or treasury operations were introduced.

## Verification

Seven new tests cover distinct threat selection; living/range constraints; remaining HP, active slows, and tie-breaking; actual attacks and presentation facing for all 15 species/order combinations; cooldown preservation; paused commands; per-guardian scope; growth, saves, and continues; old/edited save defaults; and invalid command/access/phase guards.

All 15 balance-audit scenarios match the prior v0.8 snapshots exactly when using default First orders and omitting only the new optional field. This verifies that existing default defense outcomes and accounting remain unchanged. Alternative orders are tactical choices, not an automatic improvement or a guarantee of victory.

Static DOM references, source imports, syntax, and local HTTP game-file bytes are checked. Full browser interaction and layout verification remains pending under the previously observed local-preview browser restriction. Native controls, a linked label/description, focus restoration after rerender, and existing form-control hotkey guards are implemented; they still require manual browser verification.

## Manual playtest

1. Start or resume a mixed wave and select a guardian via the canvas or a labeled occupied-site button. Confirm the inspector shows First initially on old saves and new guardians.
2. Pause and choose Strongest. Resume; when two pests with different health are in range, confirm the next shot and pose follow the stronger one. Watch for front runners it may ignore.
3. Set Palm to Fastest during moth waves. Confirm it initially targets a fast moth, then can switch to an unslowed threat while the first remains slowed. Keep other guardians on First for escape coverage.
4. Change orders during a cooldown and an active shot. Confirm there is no extra instant attack, and that the fired projectile finishes with its original pose before the next aim change.
5. Give two guardians of the same species different orders, then buy growth. Confirm both grow for the existing TREE price and retain distinct orders. Changing an order itself does not change TREE or Sap.
6. Reload, resume, lose/continue, and confirm each guardian retains its order. Start a new run and plant again: new guardians start on First and permanent growth remains.
7. Use keyboard Tab/arrows on the labeled select and verify focus remains after changing a value. Check touch input and narrow-screen wrapping. Hotkeys must not trigger while the select is active or a dialog is open.
