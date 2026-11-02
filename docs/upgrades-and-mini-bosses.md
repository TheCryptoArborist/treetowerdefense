# Clear upgrades and campaign mini-bosses

The map command now says **Upgrade defenses**. In Shop, numbered planted defenses say Upgrade (or show a completed mark). The three-step introduction explains selecting, reviewing and wallet approval. The primary upgrade action sits immediately after the selected portrait/name/description, before stats and targeting. Next-level damage/range gains and the Sapling → Guardian → Ancient path are explicit. Existing individual ownership and checkout remain unchanged: 5,000 TREE then 10,000 TREE per numbered defense, permanent; Sap only deploys it. This applies equally to character defenders and playable Watchtower/Cannon structures.

Leaf Storm now explains why it is unavailable (resume a wave, or wait for pests), rather than relying on a disabled button alone.

Fresh campaign runs introduce two mini-boss encounters with a normal mixed escort:

| Wave | Enemy | Base HP | Base speed | Counter |
|---|---|---:|---:|---|
| 4, all chapters | Ironroot Tree Bot | 440 | 64 | 20% ordinary direct-hit reduction; Watchtower/Cypress, poison and Leaf Storm bypass plating |
| 7, Emerald | Chainsaw Raider | 720 | 102 | Palm slows and exit coverage |
| 7, Sunpetal/Moonlit | Blight Sprayer | 820 | 72 | Recovers 0.6% max HP/sec after 2s without hits; poison suppresses regeneration |

Chapter HP multipliers remain 1/1.2/1.4. Veteran retains 2.4× HP, 18% speed and boss enrage below half health. Each encounter grants 150 earned Sap once when defeated, or deals 25 damage on breach (shield applies). No token payouts. Final Blight King remains on wave 10 at its existing stats and 60 breach damage. Seasonal encounters are unchanged.

Each enemy has a distinct code-native silhouette in the actual game painter: timber/metal plated bot with branch horns, masked chainsaw carrier, and protective suit with twin tanks, respirator and spray lance. Scout shows actual matching artwork, name, trait and counter; boss bar and arrival/defeat/leak announcements use the same identity.

`encounters:1` is set on new runs. Saves missing it restore as 0, preserving old living pests, queued and future waves. Start a fresh run to get the new encounters. This flag is ordinary gameplay state, never payment proof. Mini-boss kinds reuse boss targeting/report buckets and validate their variant on restore.

## Validation

- 225 tests: 224 passed, 1 platform skip, no failures; npm run check and diff whitespace check pass.
- New encounter tests exercise actual spawn/scout identity, standard/Veteran HP, named arrival, health display, save/reload, armor bypass, regeneration/poison, slows, once-only rewards, shield-aware breach damage, final boss invariants, legacy and seasonal compatibility.
- `docs/mini-boss-balance-results.json` records actual engine runs of the existing adapted mixed formation: standard level 1 clears all chapters at 100 health; Veteran level 3 clears at 100/100/46, with no consumables or paid upgrades during the trial. This proves that formation remains viable, not every possible formation.
- `node tools/render-mini-bosses.mjs` renders actual painter artwork for inspection; no authenticated browser screenshot claimed. Authenticated desktop/mobile UI acceptance remains for the holder session.
