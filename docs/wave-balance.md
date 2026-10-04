# Wave progression · v0.8

Playtest feedback found that the first five waves felt too similar and easy, followed by more interesting pressure that required more towers. The previous formula did introduce moths in wave 2 and beetles in wave 3, but the mixes changed little between neighboring waves. Upgraded guardians could coast through the opening; two Sapling starter guardians were already vulnerable early. This pass changes the mix and arrival spacing rather than raising all enemy statistics.

## Deliberate wave identities

All chapters use this sequence. The existing chapter health multipliers remain 1.0, 1.2, and 1.4. The total number of ordinary pests still grows by two per wave, and the King still follows the wave-ten escort.

| Wave | Name | Termites | Beetles | Moths | Blight | Boss | Spawn gap (seconds) |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | First roots | 8 | 0 | 0 | 0 | 0 | 1.05 |
| 2 | Armored advance | 8 | 2 | 0 | 0 | 0 | 1.40 |
| 3 | Moth rush | 7 | 2 | 3 | 0 | 0 | 1.20 |
| 4 | Blight arrives | 6 | 3 | 3 | 2 | 0 | 1.05 |
| 5 | Mixed assault | 5 | 4 | 4 | 3 | 0 | 0.95 |
| 6 | Pressure builds | 5 | 5 | 4 | 4 | 0 | 0.85 |
| 7 | Swarming wings | 5 | 5 | 5 | 5 | 0 | 0.80 |
| 8 | Heavy escort | 5 | 6 | 6 | 5 | 0 | 0.75 |
| 9 | Last stand | 5 | 7 | 6 | 6 | 0 | 0.70 |
| 10 | Blight King | 5 | 8 | 7 | 6 | 1 | 0.65 |

Threats are interleaved near the front of a mixed queue, so players see the new type early. Wave 2 intentionally allows a longer gap than the termite introduction: armored beetles absorb more attacks, so copying the previous one-second spacing caused an excessive early leak in the starter simulation. Later gaps shorten gradually. Aggregate incoming health increases every wave, using the existing health formulas.

Scouting and spawning share the exact lineup. Scouting headings now name each stage; wave-start notices use the same stage-specific guidance. The advice progresses from range coverage to armor, speed, blight, mixed roles, and reinforcement of later bends. It recommends earned Sap for adding guardians. Permanent TREE growth still helps and is not scaled away when a player replays an early chapter.

Beetles gain broad overlapping armor plates in the native canvas drawing, and purple spiked blight pests gain a larger silhouette. Moths retain their wings. These drawing changes do not alter hit ranges, health, damage, or speed. No new raster assets or runtime dependencies were added.

## Boundaries and existing saves

Enemy health, armor, speed, guardian stats/targeting, TREE prices, Sap planting costs, kill rewards, wave rewards, access rules, rarity cosmetics, and permanent progression are unchanged. Payouts, burns, treasury conversions, real wallets, and mainnet transactions remain outside this development preview.

The save schema and storage key are unchanged. Restoring an existing run keeps its saved queue, living enemies and their health/speed, current spawn timer, purchased species growth, balances, and stars. The battle restores paused. Future spawns use the new gap for that wave; new wave starts use the new mix. Reloading does not replace an old queue with a new one. Existing v1 migration continues to pass its tests.

## Reproducible balance audit

Run:

```sh
npm test
npm run check
npm run balance
```

The audit in `tools/balance-audit.mjs` uses the real engine, .05-second simulation steps, real Sap costs/rewards, and actual TREE upgrade charges where specified. Later chapters are unlocked in the audit fixture; their combat rules are untouched. These are fixed placement scenarios, not a measure of human skill or a guarantee that every layout wins.

| Scenario | Emerald Crossing | Sunpetal Meadow | Moonlit Marsh | TREE spent per run |
| --- | --- | --- | --- | ---: |
| Keep only starter Pine/site 1 and Oak/site 2 | Defeat, wave 4 | Defeat, wave 3 | Defeat, wave 3 | 0 |
| Start with that pair; add one mixed guardian per wave | Victory, 100 life | Victory, 10 life | Defeat, wave 6 | 0 |
| Spend available Sap on mixed route coverage | Victory, 100 life | Victory, 100 life | Victory, 28 life | 0 |
| Keep only three Ancient Pines at sites 1–3 | Defeat, wave 9 | Defeat, wave 8 | Defeat, wave 7 | 15,000 |
| Expand Ancient Pines along the route using Sap | Victory, 100 life | Victory, 100 life | Victory, 100 life | 15,000 |

The measured mixed order is Pine/site 1, Oak/site 2, Pine/site 3, Palm/site 5, Cypress/site 12, Mushroom/site 7, Pine/site 6, Oak/site 9, Pine/site 8, Pine/site 10, Cypress/site 11, then Pine/site 4. The measured scenario starts with two guardians and adds one per later wave, ending with eleven. The broader mixed scenario buys as many placements as Sap allows before each wave. All of its species stay at Sapling level.

For the first chapter, the unchanged starter pair clears wave 1 at 100 life and wave 2 at 88 life; it has 22 life after wave 3 and loses during wave 4 if the player never reinforces it. Measured expansion instead retains 100 life through all ten waves. Three Ancient Pines retain full health through wave 6, then begin leaking in wave 7. Their lasting strength is respected, and later pressure still rewards expansion.

All 52 Node tests and JavaScript syntax checks pass. The seven new wave tests check threat introductions, increasing combined health and narrowing gaps, early starter pressure, measured expansion, Sap-only viability across all three chapters, old queued saves, and scouting/notices. Existing purchase, ownership simulation, rarity, aiming, save migration, and campaign tests also pass. Native canvas checks exercise 40 pest/motion/health-bar combinations and inspect the revised silhouettes. Full desktop/mobile browser layout and keyboard/touch verification remains pending under the previously observed local-preview browser restriction.

## Manual playtest

1. Start a new Emerald Crossing run using the guided Pine/Oak pair. Identify plain termites in wave 1, plated beetles in wave 2, winged moths in wave 3, and larger purple blight pests in wave 4.
2. Read each scouting heading and start notice. Confirm the displayed counts match the wave and that the new threat appears early among the incoming pests.
3. Reinforce using Sap after each wave. Try Palm against speed, Cypress against long-route gaps, and Mushroom against groups. Check that the opening teaches those choices without requiring a TREE purchase.
4. Leave a small defense unchanged on a separate run; later pests should expose gaps. Replay with previously purchased growth and confirm that permanent strength remains useful.
5. Reach waves 6–10. Check that the mixed escort builds pressure, that the King follows it, and that later-bend coverage matters.
6. Resume an old saved battle; its pending queue and living-pest stats should remain intact. Confirm paused restoration, species growth, appearance choices, and balances.
7. Check longer named scouting headings on narrow screens, keyboard controls, touch build sites, dialogs, and reduced motion. Those interactions still need local browser verification.
