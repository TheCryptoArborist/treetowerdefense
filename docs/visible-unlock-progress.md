# Visible defender unlock requirements

The compact deployment dock previously hid `.roster-progress`, leaving locked defenders as faded portraits and Sap prices. Locked cards now always display a LOCKED label, full earned-play requirement, current progress and an accessible progress bar. Text is opaque and wraps on desktop; mobile horizontal cards widen to 112px for readable requirements. Unlocked cards remain compact.

The existing unlock rules and prices are unchanged:

| Defense | Requirement |
|---|---|
| Palm | Clear Emerald Crossing wave 2 |
| Cypress | Clear Emerald Crossing wave 4 |
| Mushroom | Clear Emerald Crossing wave 6 |
| Willow | Earn 4 total standard campaign stars |
| Archer Watchtower | Clear all 10 waves in Emerald Crossing (Level 1) |
| Sap Cannon | Clear all 10 waves in Sunpetal Meadow (Level 2) |

Wave-based cards read the existing `unlockStatus` progress. Chapter-clear cards display `forest.bestWaves` for the required standard chapter, out of 10, rather than an unexplained 0/1. Stars come from the existing standard campaign star total. Current event/Veteran wave numbers are never substituted. Unlocks still persist and cost no TREE or Sap; the displayed Sap price remains the deployment cost.

Validation: existing 225 tests report 224 pass, one platform skip, zero failures; npm run check and whitespace check pass. No new tests for this display-only change. Authenticated desktop/mobile visual acceptance remains pending in the holder session. No wallet, payment, access, combat or unlock eligibility logic changed.

Published functional commit `7e4589ded17156918ccc6588448706b2ad728e45`, backend `6ae7ee72f3a12d5acb787a55`, canonical routing release `6ae7eee018d3f212df6696d0`. GitHub CI 41375224197 succeeded. Verified preservation of 284 static entries, 41 functions and five schedules, with only the checkout rewrite changed. Canonical gate returns 200; anonymous access, payments and protected source return 401. Current runs receive the display change after refresh at https://tree-token.xyz/play/canopy-defense/checkout-test/ .
