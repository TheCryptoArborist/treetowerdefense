# Gameplay-first home and structure tuning

The verified home now presents a compact character-scene masthead, one six-level strip, unlock guidance, the run HUD and battlefield. Send wave / Pause controls are immediately above the canvas. The first-run guide, Harvest event, currency/tactics guide, structure gallery and ecosystem gallery follow gameplay; secondary collections use closed, keyboard-accessible native disclosures. The level strip scrolls horizontally on narrow screens instead of becoming a tall list.

Levels 1–3 are Emerald Crossing, Sunpetal Meadow and Moonlit Marsh. Levels 4–6 are their existing Veteran variants, available after protecting all three standard forests. These are six existing map/difficulty combinations, not six new maps. Standard and Veteran stars remain separate. Level 3's completion button leads to level 4; the final Veteran level ends the path. Locked buttons explain the prerequisite. The unlock note identifies Palm/Cypress/Mushroom/Watchtower milestones in level 1, Cannon in level 2, Willow at four campaign stars, and Veteran at standard completion. No fake playable levels or unlock promises were added.

The Halloween collection and its UI handlers are removed at the user's request: it never had a public launch. Old engine saves and reward data remain readable without promoting the archive on the home screen. No access, wallet or payment flow was changed.

## Balance evidence

`node tools/structure-balance-audit.mjs` simulates full campaigns with owned Sapling or Ancient growth and the full earned roster. Deployment uses earned Sap, without supplies, continues or mid-test upgrades. Fixed formations are representative counterplay tests, not human win-rate estimates. Before/after wave-by-wave results are in `structure-balance-results.json`.

The old all-Watchtower Ancient formation cleared Veteran with 52 / 76 / 88 health across the three maps; the old mixed formation cleared with 100 / 100 / 46. That supports the report that Watchtower stacking was too effective, especially on the hardest map.

| Structure | Previous | Revised |
| --- | --- | --- |
| Archer Watchtower | 54 damage; 1.4s interval; 275 range | 48 damage; 1.6s interval; 245 range |
| Sap Cannon | 66 damage; 1.9s interval; 70% splash within 95 | 66 damage; 2.1s interval; 55% splash within 80 |

Planting costs, growth multipliers, owned levels, TREE prices, enemies and their health are unchanged. Watchtower remains the long-range armor counter, rather than a universal high-output weapon. Cannon retains its heavy direct hit and group role, with less sweeping splash coverage.

After tuning, all-Watchtower Ancient formations lose Veteran at waves 10 / 10 / 9, and all-Cannon formations lose at waves 2 / 2 / 3. The old mixed formation now loses the final boss in Marsh. An adapted mixed formation using two Watchtowers, a Cannon, Cypress piercing and Mushroom poison clears with 100 / 100 / 46 health. Reloading mid-wave produces the same result. Standard mixed Sapling formations still win with 100 / 100 / 64 health. New regression tests retain these qualitative requirements; the older Veteran counterplay fixtures were updated to the adapted team rather than requiring the old Watchtower-heavy strategy to keep winning.

## Future structures

Thorn Bastion and Root Obelisk remain clearly marked Coming later. They have artwork and intended roles, but no implemented attacks or opponent matchup stats, so claiming they are already combat-balanced would be inaccurate. Before enabling them, Thorn should trade direct damage for bounded, non-stacking path control; Obelisk should trade direct damage for a capped, non-stacking nearby support effect. Each needs earned-Sap, mixed-team and repeated-structure audits across all six levels before receiving playable unlock requirements. No new token purchase or rarity power advantage is implied.

Validation: 205 tests passed, one Windows-only skip; syntax and whitespace checks passed. HTML nesting/unique IDs and gameplay-before-secondary-sections order checked. CSS parsed for Safari 17 with no warnings. Published at https://tree-token.xyz/play/canopy-defense/checkout-test/. Source `6edbebc099f852c2bddbb025d72100b1fd9d85b2`, backend `6ae7d5db54bc6a780d66b105`, routing release `6ae7d64b98da0c716654ff08`. GitHub validation run 41366009195 succeeded. Preserved 284 existing static entries, all 41 function identities/configurations and all five schedules; only the checkout-preview rewrite changed. Authenticated desktop/phone layout and human difficulty acceptance remain pending.
