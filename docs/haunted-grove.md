# Haunted Grove · v0.12

The first playable seasonal preview is a separate five-wave tower-defense event. Complete Emerald Crossing to enter it through the Halloween event panel. NFTree access includes event admission; all access, funds and TREE purchases remain simulated. The preview is always available with no end date. A production schedule and expiry policy are not implemented.

Campaign defenders, species growth and appearance privileges carry into the event. Entering replaces the battlefield after the existing confirmation flow; it keeps permanent progress and funds. Campaign chapter buttons return to campaign play. New run/retry repeats the selected mode. A guided run returns to Emerald Crossing. Event victories never award campaign stars, landmarks or roster milestones.

## Waves and balancing

All use the existing route and twelve build pads. New-run moth dashes and blight regeneration remain active. Scouting reads the exact event queue and uses themed pest names. The Hollow King has 1,200 health, existing boss speed and breach rules, and a dedicated seasonal name in warnings/health display.

| Wave | Dusk termites | Hollow beetles | Dusk moths | Webbed blight | Boss | Spawn gap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Lantern watch | 8 | 0 | 2 | 0 | 0 | 1.10s |
| Hollow armor | 8 | 4 | 0 | 0 | 0 | 1.15s |
| Dusk swarm | 10 | 0 | 6 | 0 | 0 | 0.90s |
| Webbed escort | 5 | 5 | 4 | 4 | 0 | 0.85s |
| Hollow King | 6 | 6 | 4 | 4 | 1 | 0.80s |

Ordinary base health is `45 + wave × 25`; existing type multipliers apply. The King spawns after the mixed escort. Sap income, leak damage, planting costs and optional TREE prices follow the campaign. Species levels and NFT rarity do not change event admission or reward requirements.

## Earned collection

| Reward | Requirement | Use |
| --- | --- | --- |
| Haunted Grove badge | Clear all five waves | Persistent completion badge in the event panel |
| Lantern Oak | Finish at 80+ Tree of Life health | Optional amber lantern ornament on all Oak defenders, including campaign runs |
| Web-carved Watchtower | Finish a run using at least three different planted defender types | Optional web ornament on all Watchtowers, including campaign runs |

Requirements can complete together and rewards unlock once. Team diversity tracks types actually planted, including subsequently removed defenders; a failed planting does not count. Starting a new event run resets the current team list, not previously earned progress. Best final health only updates on victory. Continues may help reach objectives, but no objective requires purchasing one. Earned looks work at every rarity and can be toggled in the event panel. They never change damage, cooldowns, range, targeting, prices or reward amounts. Growth, supplies and continues still use TREE; cosmetics have no equip fee.

Art reuses the mature forest assets with a static moonlit treatment, small lantern ruins outside the route, corner webs, tinted insect shells and optional defender ornaments. Weapon rotation, aiming sockets and Tree of Life identity remain unchanged. These are canvas additions, with no new raster generation or remote asset dependency. Reward previews refresh as the original sprite assets finish loading.

## Persistence

Save version remains 2. Optional `mode`, `eventVersion: 1`, `eventTeam`, `season` and `seasonLooks` identify the run and collection. Older v1/v2 campaign saves receive empty seasonal defaults while retaining queued pests, current stats, funds, growth, roster and stars. Current event saves reload paused and retain their event rules, queues, timers, team list and target orders. Continues preserve event identity. Returning to a campaign preserves cosmetics and event achievements.

Collection fields are bounded and normalized. Unknown active event rules versions are rejected rather than played with a different wave definition. Future versions must provide explicit migration for supported active event versions. Current localStorage is editable prototype data, never production ownership, payment or reward proof.

## Verification

- 94 tests: 93 pass and one Windows-only skip locally on Linux. Ten event tests cover access/fees, exact scouts/queues, independent progression, once-only rewards, rarity equality, harmless cosmetics, saved events/continues, old saves, optional-field fallback, boss identity and a full Sap-only completion.
- The milestone roster at Sapling growth clears all five event waves at 100 health, with twelve defenders across five species and zero TREE spent, earning all three rewards. This deterministic strategy is an engine check, not a prediction of player performance.
- All fifteen existing campaign balance scenarios retain v0.11 outcomes. Existing campaign tests and JavaScript checks pass.
- Static DOM references and unique IDs were checked. Actual canvas functions rendered the themed battlefield and both loaded-sprite cosmetic portraits for visual inspection. These are native canvas checks, not browser screenshots.
- Supported browser preview capability is unavailable, so desktop/mobile layout, focus, touch controls and event-panel checkbox interactions remain manual checks. No substitute browser or preview server was used.

Thanksgiving and Christmas remain design plans; no token rewards, treasury sales, burns or financial payouts are added.
