# Sunpetal Meadow battlefield · v0.14

Sunpetal Meadow now has its own route and twelve build sites. Emerald Crossing, Moonlit Marsh and Haunted Grove retain the original layout. This changes placement strategy while keeping enemies, wave mixes, rewards, prices, species growth, rarity rules and seasonal goals unchanged.

## Layout and strategy

The `meadow-v1` route has two looping approaches through a central crossing, followed by a shorter final approach. Its length is 3,485 units, compared with 3,360 on `crossing-v1`. Both finish at the existing Tree of Life position, 940/640.

| Area | Sites | Placement opportunity |
| --- | --- | --- |
| Opening return loop | 1–3 | Cover the entrance and returning pests instead of building only at the first bend |
| Upper loop and central crossing | 4–7 | Overlap slows, splash, poison and sustained damage across several passes |
| Lower loop | 8–9 | Catch survivors before they rejoin the central route |
| Final approach | 10–12 | Keep damage coverage near the Tree of Life rather than relying entirely on central towers |

Small brass direction markers distinguish the route's passes through the crossing. The meadow uses the established terrain and stone-road assets, with a warm biome tint and small flower patches away from the road and build centers. It adds no image download or asset generation dependency. The in-page map tip explains the key placement choice.

## Shared geometry

Immutable map definitions supply path vertices, segment lengths, total length and build positions. The engine uses the selected map for placement, movement, endpoint breaches and restoration. Targeting and guardian aiming use the resulting world coordinates. Battlefield road drawing and pest/defeat orientation use the same map. Pointer hit testing uses its build sites; the existing twelve labeled build-site buttons keep touch and keyboard access.

The exported `PATH`, `PADS`, `PATH_LENGTH` and default `pointAt()` still describe the original map for older callers. Current meadow callers pass the map explicitly. A fresh Sunpetal run selects `meadow-v1`; returning to Emerald, Moonlit or Haunted Grove selects `crossing-v1`.

## Saved battles

Save version remains 2, with optional `mapId`. A save without that field stays on the original layout, including Sunpetal saves: its current defenders, progress distances, queued pests, timers, growth and funds remain intact. The page explains that the old route is preserved and a new run enables the new meadow.

Current meadow saves retain `meadow-v1` on reload, pause and continue. Restoration derives defender/enemy positions from the saved map's authoritative local definition rather than trusting saved x/y coordinates. New-run selection changes the layout only when the battlefield is reset. Unknown map IDs and invalid chapter/map combinations are rejected; future map revisions require explicit migration before replacing supported geometry.

Client saves remain editable prototype data, not authentication or payment proof.

## Validation

- 102 tests: 101 pass and one Windows-only skip on Linux. Eight new tests cover geometry, map selection, shared movement/targeting/aim, endpoint breaches, save/continue, old Sunpetal queues, defeat identity, invalid maps and Sap-only wins.
- JavaScript syntax and whitespace checks pass.
- All fifteen campaign strategy simulations complete. On the new Sunpetal layout: the unchanged Pine/Oak starter loses at wave 4; one addition per wave and broader mixed Sapling coverage both win at 100 health with zero TREE purchases. Three held Ancient Pines lose at wave 9; expanding Ancient Pines wins at 100 health. Fixed simulations check engine behavior rather than predict human results.
- Emerald, Moonlit and the five-wave Haunted Grove tests retain their existing behavior. Existing earned-roster tests still reach every combat unlock through play.
- The original and new battlefields were rendered with actual canvas functions and loaded art; the new layout, build sites and pest orientation were visually inspected. These are native canvas renders, not browser screenshots.
- Supported browser preview capability remains unavailable. Desktop/mobile layout, pointer hit testing and keyboard interaction still need actual-browser verification; no alternate browser path was used.

NFTree palette, Tree Hero and ecosystem graphics from v0.13 remain on the surrounding page. Real NFTree access and TREE payments remain unimplemented simulations.
