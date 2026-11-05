# Veteran campaign

Optional post-campaign difficulty, unlocked after clearing all three standard chapters. Starting it creates a fresh battle; existing permanent growth, roster, seasonal cosmetics and standard progress stay. No admission fee. Earn separate 1–3 Veteran stars per chapter for up to nine stars; these are local game progress with no token value.

Veteran pests have 2.4× standard health, 1.18× movement speed and 70% of normal spawn gaps. Beetles' reinforced shells reduce ordinary direct hits by another 30%; Watchtower and Cypress bypass this extra shell, while poison damage bypasses direct-hit mitigation. Existing ordinary beetle armor remains. Bosses move another 30% faster below half health, with an enrage warning and matching targeting speed.

Enemy stats/queues and difficulty persist through reload and continue. Old saves default to standard. Seasonal entry switches back to standard difficulty; Halloween and Harvest balance are unchanged. Cosmetic NFT rarity does not affect these rules. TREE still pays only for permanent growth, supplies and continues; Sap plants defenses.

Balance fixtures use already-owned Ancient growth, not live payments. The original mixed Sap formation loses Veteran Moonlit Marsh. A piercing-heavy formation with Watchtowers at pads 5/7/9 and a Cannon at pad 3 clears all three Veteran chapters without consumables, finishing Moonlit at 46 health. This demonstrates counterplay and a completion path; actual player/device acceptance remains pending. This is the first difficulty expansion, not endless play or the proposed ten-level upgrade system.

## Release

Live in the canonical checkout preview at https://tree-token.xyz/play/canopy-defense/checkout-test/ from source `3919ba85b8975c9415f34e1b29de515aca9efa0e`. Backend `6ae7a04bbda517d9c4799666`; routing release `6ae7a122ad7e3d8166cb78a7`. Only the checkout-test rewrite changed; the regular game has not been promoted to this build. Local validation: 176 passed, 1 Windows-only skip, zero failures; syntax checks and both GitHub validation runs passed. Anonymous entry is 200; source, access and payments remain 401. Holder gameplay and real payment acceptance remain unverified.

## Readiness audit and tactical guidance

Veteran now has ten wave-specific briefings shared by scouting and wave-start notices. Reinforced beetle cards explain the extra shell and its counters; boss cards explain half-health enrage. Defeat reports use those same counters for the worst leaking pest. The goal explains the 80-health three-star threshold and recognizes nine-star completion. The defeat screen distinguishes real TREE plus SUI gas from simulated TREE and mentions the included fresh run. No combat stats, prices or payment verification changed in this pass.

Run `node tools/veteran-audit.mjs` for deterministic formations using already-owned Ancient growth and earned Sap only. These scenarios are not human skill measurements and never execute wallet transactions.

| Formation (owned Ancient growth) | Chapter | Last wave | Outcome | Health | TREE spent |
| --- | --- | ---: | --- | ---: | ---: |
| Hold two Ancient defenders | Emerald Crossing | 2 | defeat | 0 | 0 |
| Hold two Ancient defenders | Sunpetal Meadow | 3 | defeat | 0 | 0 |
| Hold two Ancient defenders | Moonlit Marsh | 4 | defeat | 0 | 0 |
| Expand Ancient Pines | Emerald Crossing | 10 | defeat | 0 | 0 |
| Expand Ancient Pines | Sunpetal Meadow | 10 | defeat | 0 | 0 |
| Expand Ancient Pines | Moonlit Marsh | 8 | defeat | 0 | 0 |
| Expand Ancient mixed formation | Emerald Crossing | 10 | victory | 100 | 0 |
| Expand Ancient mixed formation | Sunpetal Meadow | 10 | victory | 100 | 0 |
| Expand Ancient mixed formation | Moonlit Marsh | 10 | defeat | 0 | 0 |
| Expand Ancient piercing formation | Emerald Crossing | 10 | victory | 100 | 0 |
| Expand Ancient piercing formation | Sunpetal Meadow | 10 | victory | 100 | 0 |
| Expand Ancient piercing formation | Moonlit Marsh | 10 | victory | 46 | 0 |

The piercing formation produces identical per-wave health, leaks, tower counts, outcomes and spending when restored once during every wave. Automated forecasting covers all 30 Veteran waves, with standard and seasonal briefings preserved.

### Holder acceptance before regular-game promotion

- Verify with an NFTree on the canonical checkout-test path. Confirm existing standard stars and permanent upgrades survive.
- Clear all standard chapters, start Veteran, and confirm the new-run warning and separate Veteran stars. An incomplete campaign must keep Veteran locked.
- Compare reinforced beetle and boss scouting with wave notices. Check readable text on desktop and phone.
- Clear a Veteran chapter, reload during a later battle, resume, and confirm the formation, wave, difficulty and progress remain.
- Check boss enrage movement/notice and try piercing, poison and slow counterplay. Record the failing wave, formation and owned growth for balance feedback.
- Return to standard and enter Harvest; confirm their difficulty and stars/rewards are unchanged.
- No purchase is required for acceptance. Actual TREE purchase/recovery acceptance remains a separate unverified task.

Regular-game promotion remains pending holder gameplay and phone acceptance.

Tactical-guidance release: source `730991a0796c5d31518ccb326c7fcbb57036381c`, backend `6ae7a2a2570d2e1e129346be`, routing release `6ae7a30025ff441e4157b208`. Live on the same canonical checkout-test path. Validation: 179 passing tests, one Windows-only skip, zero failures; syntax checks and both CI runs passed. Regular-game promotion and holder/phone acceptance remain pending.
