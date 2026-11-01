# Sap, TREE and lasting progression

## Current rules

The individual collection build, now live on the canonical checkout-test path, changes TREE growth to one numbered defender at a time. Legacy species purchases remain grandfathered on all twelve copies. See [Individual defenders](individual-defenders.md) for activation and migration; the regular game remains on its earlier release.

| Resource | Obtained from | Spent on | Persistence |
|---|---|---|---|
| Sap | 300 at run start; 12 per regular pest, 150 per boss, 85 per cleared wave; 60% planting refund on sale | Planting defenders and towers | Carries between waves; resets with each fresh run |
| TREE | Player's Sui wallet in enabled checkout | Permanent individual defender growth in collection mode, Root Shield, Fertilizer, Leaf Storm and continues | Purchased defender levels persist by wallet; run supplies and continues are consumed for that run |
| SUI | Player's wallet | Network gas for real transactions | Not an admission fee or game-upgrade currency |

NFTree ownership grants entry and new runs. Campaign progress unlocks species. Rarity and seasonal rewards grant appearances. Neither substitutes for a TREE purchase. Sap is not transferable, convertible or purchasable with TREE. No automatic token charges, burns, payouts or treasury swaps.

Recurring TREE utility comes from optional supplies and continues on future runs, even after permanent growth is maximized. Players can also complete content without TREE purchases. Useful purchases support demand; game design cannot guarantee market demand or token price.

## Next progression milestone — proposed, not implemented

The current game still has three species growth levels. Expand to ten permanent levels per individual defender plus Tree of Life headquarters progression, then species research. Use TREE for these permanent purchases and earned chapter/star milestones for eligibility. Keep Sap dedicated to battle placement. Do not advertise these planned systems as currently purchasable.

Before activation: specify all ten stat/cost steps, headquarters requirements, price and transaction catalog entries; preserve existing purchases without charging twice; migrate server growth constraints and game saves; validate wallet entitlements, economy and campaign balance. Add researched specialties appropriate to each species rather than indefinite generic stat inflation. New seasons, chapters and defender species can introduce further upgrade goals. No automatic difficulty escalation that requires paid consumables.

## UI clarification release status

Source `d79600446814d6a6b426c24323ef4ff103ac31a9` adds the side-by-side guide, TREE labels on supply prices, planting/upgrading distinctions and correct paid purchase-report wording. It is committed but not live. Deploy `6ae7912793165a47ee5a776f` on site `tree-token`, branch `canopy-checkout-test`, failed with `400: could not write function bundle to disk: read upload zip: zip: not a valid zip file`, despite the build plugin's successful local integrity check. No canonical routing publication was attempted; the existing Harvest preview remains unchanged. Further Netlify operations stopped under the documented failure rule.

Follow-up diagnostic: both local ZIP paths have matching `readFile`/stream hashes, but the CLI's final `.netlify/functions/canopy-access.zip` differs in size from the package validated by the build plugin. The documented remote-build option was attempted; the CLI rejected `--remote` combined with `--alias` before creating any deployment. Remote CLI builds select the connected Git source and do not share all local deploy options; review those constraints before any retry. No subsequent Netlify operations or routing publication were performed. Source `3bfaf84d4cf7f3b8600f8bd6eeac3a8dfd211a0d` also makes preview branding explicit in the build context.

The currency guide is now live in the canonical checkout preview with Veteran source `3919ba85b8975c9415f34e1b29de515aca9efa0e`: backend `6ae7a04bbda517d9c4799666`, routing release `6ae7a122ad7e3d8166cb78a7`. The documented `--skip-functions-cache` deploy flag successfully packaged this release. New growth tiers remain proposed.
