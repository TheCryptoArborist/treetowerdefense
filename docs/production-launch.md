# Canopy Defense production launch

The release branch prepares the regular `/play/canopy-defense/` entry and its
Tree Arcade cabinet for the approved Campaign and Harvest build. Christmas
Chaos remains a teaser until November 27, 2026. The winter gameplay draft is
not included.

## Current status

The current production candidate includes the approved lobby management,
separate cosmetics, Campaign and Harvest game. **This candidate is now superseded by the lobby purchase fix and must not be
published.** See [purchase guard correction](lobby-purchase-fix.md). Backend: `6aee93ef532103e89cfc72c6`. Site candidate:
`6aee9467cd626c3f4efe9a70`. The previous candidate is superseded.
See the [candidate receipt](../integration/tree-arcade/production-launch/candidate-receipt.json).

The user accepted the latest lobby; their device was not specified. All 335
local tests completed (334 passed, one Windows-only skip), syntax and protected
packaging passed, and Ubuntu, Windows and PostgreSQL CI passed on
`95ae49834a772d0a2017503a0f5c973a960a7ea9`. Runtime sources are unchanged
between that validated commit and the deployed `8cb71e2b1f4c35f99b6f842b1faf573d8f71c715`.
Hosted assets, canonical-origin boundaries, protected modules and actual
candidate routing passed. All 302 static paths, 43 function packages and five
schedules are retained, with only the Canopy card, rewrite and legacy Canopy
route bindings changed. The published baseline remains locked and unchanged.

The remaining launch condition is one real-wallet purchase/recovery check.
Production publication is already authorized; do not request it again.

## Release behavior

- NFTree verification remains mandatory. Entry and new runs have no SUI fee.
- Earned Sap plants defenders. Optional purchases spend real TREE and SUI gas
  after the player's wallet approval. A disabled live checkout cannot fall
  back to simulated purchases.
- The production backend uses the existing `canopy-checkout-test` database
  branch, retaining the real-TREE ledger and server-owned defender levels.
  Its new session cookie is scoped to the regular game path.
- A checkout-test saved battle is copied only when the same wallet has no
  production paid save. The original remains available. Server-owned growth
  replaces editable local collection levels.
- The release changes only the Canopy cabinet and routing file. All existing
  static paths, function packages and five schedules are retained. The old
  Canopy root function binding is parked so it cannot intercept the new
  backend rewrite. The separate checkout-test rewrite stays pinned.

## Final holder test

Use https://tree-token.xyz/play/canopy-defense/checkout-test/ with the verified
holder wallet. If a real Root Shield purchase already completed, use that
transaction and its history/recovery results; do not pay again merely for a
new receipt. Otherwise buy Root Shield once for 3,000 TREE plus SUI gas.
Confirm 50 shield, one verified history entry, and reload/recovery without a
second payment or duplicate grant. A phone wallet round trip covers the
remaining device handoff. The user must approve their own transaction.

Record verified evidence in
`integration/tree-arcade/production-launch/wallet-acceptance.json`; pending
evidence intentionally blocks `tools/release-canopy-production.mjs publish`.
Existing authorization covers publication once this check passes.

## Preservation release

Build the isolated backend with explicit production candidate, checkout and
individual-defender flags, using the existing database branch alias. Never
run a full-repository production deployment. Verify the immutable upstream
and protected sources, then use the preservation release tool's `prepare`,
`candidate` and `verify` modes. The production site remains locked to its old
deploy while the candidate is inspected. Record deploy IDs, package digest,
source commit and preservation checks before publication.

After accepted wallet evidence, `publish` promotes that exact candidate;
`verify-live` checks the published inventory, function bindings and schedules.
The public entry is https://tree-token.xyz/play/canopy-defense/ and the lobby
is https://tree-token.xyz/play/.
