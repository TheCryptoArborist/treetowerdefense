# Moonlit Marsh battlefield · v0.15

All three campaign chapters now have distinct geometry. Emerald keeps the original route; Sunpetal retains its central crossing; Moonlit adds staggered causeways. Haunted Grove stays on the original map. Enemy rules, prices, roster unlocks, supplies, permanent species growth and season rewards are unchanged.

## Marsh strategy

`marsh-v1` has three long passes, two return bends, a lower-right turn and a final approach to the existing Tree of Life endpoint. Its length is 3,055 units, versus 3,360 for the original route. Shorter travel creates pressure despite useful overlapping coverage.

| Area | Sites | Decision |
| --- | --- | --- |
| Entrance and upper return | 1–4 | Spread sustained damage; long-range defenders can cover more than one pass |
| Middle/lower causeways | 5–7 | Support damage with slows and poison; use splash against escorts |
| Lower approach | 8–10 | Reinforce surviving groups before they reach the final turn |
| Final gap | 10–12 | Reserve coverage for pests that escape the central defenses |

The existing painterly terrain and road texture gain a cool marsh treatment, faint plank joints and route arrows. Small wet pockets and reeds sit away from road/build positions. The permanent pond landmark moves to the lower open area on Marsh so it does not cover the new route. Scenery is drawn by existing canvas helpers; no new raster assets or external downloads are required.

## Shared rules and saved games

The existing map descriptor system supplies immutable vertices, segment lengths and twelve pads. Movement, placement, endpoint checks, targeting coordinates, projectile aiming, road drawing, pest/defeat orientation and pointer input use the same selected geometry.

Fresh Moonlit runs select `marsh-v1`. Both pre-map saves without `mapId` and newer saves explicitly using `crossing-v1` remain on the original layout for their current battle and queued enemies. A map-tip message explains that a new run enables the new Marsh. Reload/continue preserve geometry, defender growth/orders, enemy health/progress/timers, funds and collectibles. Starting a fresh run updates the layout while retaining permanent progress.

Restoration rejects a Marsh map paired with another chapter or Haunted Grove. Saved x/y coordinates are reconstructed from the selected local map definition. Existing client data remains an editable prototype, not ownership or payment proof. Real NFTree access and TREE transactions are still simulated.

## Verification

- 109 tests: 108 pass and one Windows-only test skipped on local Linux. Seven new tests cover immutable geometry/selection, movement/attack agreement, both old-save formats and queued spawns, current save/continue with growth and cosmetics, endpoint and invalid map combinations, representative difficulty and a full campaign using earned structure towers.
- JavaScript syntax and whitespace checks pass. Static page IDs and references are unchanged apart from the footer version.
- The fifteen campaign balance scenarios complete. Emerald and Sunpetal results retain v0.14 outcomes. On Marsh, the held starter loses at wave 5; gradual expansion reaches defeat at wave 10; broad original-role Sapling coverage wins at 46 health without TREE purchases. Three held Ancient Pines lose at wave 9; expanding Ancient Pines wins at 100 health.
- A separate earned-roster defense with Watchtower, Cannon, slows, poison and original guardians wins all ten Marsh waves at 100 health, with twelve Sapling defenders and zero TREE spent. These fixed engine strategies establish viability, not expected human performance.
- Actual canvas functions and loaded art rendered the battlefield, directional pests and earned structure defenders. The final scenery also rendered at all four forest ranks and was visually inspected, including the relocated pond. Native canvas renders are not browser screenshots.
- Supported browser preview capability is unavailable; actual desktop/mobile input and layout checks remain manual. No alternative browser path or preview server was used.

The NFTree color scheme, Tree Hero, ecosystem graphics and playable Haunted Grove remain in place.
