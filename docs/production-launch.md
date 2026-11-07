# Canopy Defense production release

Canopy Defense is published and verified at
https://tree-token.xyz/play/canopy-defense/ and its LIVE cabinet is available
at https://tree-token.xyz/play/. Published deploy:
`6aef402b05aed0cc8955b087`. Immutable game backend:
`6aef3f85bc79792fbca350c0`. Authoritative evidence:
[integrity and release receipt](../integration/tree-arcade/production-launch/release-receipt.json).

## Released behavior

NFTree ownership grants access to Campaign and seasonal play; new runs have
no admission charge. Earned Sap plants defenses. Optional growth, supplies
and continues spend real TREE plus separate SUI network gas after wallet
approval. The production profile cannot fall back to simulated purchases.

Campaign and the distinct Harvest orchard include the approved retro
cutscenes, finished-art loading, mode entrance, lobby shop/defender/cosmetic/
guide shortcuts, permanent numbered defender growth and run-specific supplies.
Root Shield now displays a translucent teal/mint honeycomb force field around
the original Tree of Life. Shimmer respects pause and reduced motion; the
existing 50-point refill/cap and damage rules are unchanged.

A reconnected matching wallet and valid server session return automatically
after refresh. Initial production sign-in and expired sessions still require
verification. No automatic signature, payment or wave start occurs.

## Saved and paid progress

Production uses the existing `canopy-checkout-test` ledger branch. All three
migrations were already applied; none were pending. No paid rows were reset
or copied. Server inventory remains authoritative for permanent purchases.
On the same browser, an existing checkout-test save is adopted only for the
same wallet when no production paid save exists. Run ID, applied entitlement
IDs and battle progress are retained; the original checkout save remains.

The production HttpOnly cookie is isolated from legacy and checkout cookies.
The existing checkout-test rewrite remains pinned to its original backend.
Use the normal production entry for the new force-field visual.

## Live acceptance

Mainnet transaction `AE1mRfDF3s886k77YUtDkUREFQSgywMaprhq5JceRub3` was
independently verified for exactly 3,000 TREE to the configured treasury.
The user showed one applied paid shield for the current run and explicitly
confirmed visible protection after refresh. No duplicate current-run payment
or grant was observed. Numeric HUD strength was not supplied; the acceptance
record uses visible post-refresh protection rather than inventing a reading.
No additional purchase or publication approval is needed.

## Preservation and validation

The release retained all 302 static paths, all 43 function packages, 42
unrelated functions unchanged and all five scheduled jobs. Only the routing
file and Canopy cabinet changed. The old Canopy root function binding was
parked so it cannot intercept the new game rewrite. The published site remains
locked against automatic replacement by an unrelated build.

All 345 tests completed: 344 passed and one Windows-only test was skipped on
Linux. Syntax and protected production packaging passed. Ubuntu, Windows and
PostgreSQL CI passed. Actual Canvas renders were inspected at forest ranks
0, 2 and 3. Hosted upstream, candidate and production checks verified public
assets, gateway bytes, NFTree-protected modules, payment endpoint gating,
canonical-origin rejection and the retained checkout-test route.

The source is `9f4effdaafc6e8d87e8d8f40c11054b63a6d3f51`; runtime files
match validated commit `b4295d507a7c811b058699d5a9e10c188edf63a6`.
See the receipt for package hashes and immutable deployment log URLs.

## Future releases

Use the preservation release workflow, not a full-repository production deploy.
Start from the currently published inventory, retain unrelated functions and
schedules, build a draft backend/candidate, verify it and publish that exact
candidate. The initial promotion tool assumed a checkout-only rewrite; later
releases must update its preflight from the published receipt and preserve
both the checkout and normal-game rules. Credentials stay in the official CLI; do not read token files.

Christmas Chaos remains a teaser for November 27, 2026. Winter gameplay on
its separate draft branch/PR is excluded from this production release. Merge
current production fixes into that work before any future seasonal promotion.
