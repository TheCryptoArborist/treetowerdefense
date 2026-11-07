# Canopy Defense production launch

The release branch prepares the regular `/play/canopy-defense/` entry and its
Tree Arcade cabinet for the approved Campaign and Harvest build. Christmas
Chaos remains a teaser until November 27, 2026. The winter gameplay draft is
not included.

## Current status

Prepared for hosted verification; **not published**. Automated validation:
333 tests, 332 passed, one Windows-only test skipped; syntax checks and the
protected production-profile build pass. A real-wallet purchase/recovery
acceptance is still required before promotion.

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
