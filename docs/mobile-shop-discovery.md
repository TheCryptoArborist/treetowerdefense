# Finding the TREE shop on mobile

The cannon command now says **Shop & upgrades**. Its previous main label,
Upgrade defenses, concealed that it also sells supplies because mobile hides
the small TREE shop subtitle. The command target, cannon artwork, prices and
purchase behavior are unchanged. Root Shield is inside Field supplies.

Peter reported that mobile wallet connection and NFTree verification worked.
Real TREE purchase/recovery remains a separate live acceptance step; neither
this report nor the label release establishes a successful purchase.

Source `5f8d8e2fee0dc018089f03cb4679789318564fcb` is live on checkout-test. Backend:
`6aee55a32a8067ba11f6bd85`; routing: `6aee5647a4159f1459b094f8`.
The function ZIP is byte-identical to the approved simplified-cutscene build.
All 311 local tests pass with one Windows-only skip; syntax, protected build
and Linux/Windows/PostgreSQL CI run 42221352277 pass. All 43 production function
identities/configurations, five schedules and 299 static paths are preserved.
The live HTML contains the new label; private source and payment/access routes
remain protected. Only the checkout rewrite target changed on the main site.

[Release evidence](../integration/tree-arcade/mobile-shop-label-release-receipt.json).

## Supply clarity revision

The shop command is a full-width highlighted banner above the five smaller
commands on phones. Its subtitle and Open shop prompt stay visible. Opening
the shop resets to Field supplies at the top, with a separate keyboard-accessible
Defender upgrades tab. Normal UI refreshes retain the chosen category.

Root Shield now explains that it buffers up to 50 damage from pests reaching
the Tree of Life, before health is lost. A current-shield readout makes partial
refills explicit. It does not heal, stack past 50 or survive a new run. The
confirmation repeats those rules. Fertilizer and Leaf Storm explain their
damage, timing and duration; disabled actions show why they are unavailable.
Each card has a named Buy action and its existing TREE price. The existing
server invoice and wallet confirmation still precede payment.

Four additional tests cover category navigation/reset, readable eligibility,
unchanged state on rendering, active-wave supply eligibility, and actual
shield absorption/refill behavior. This revision has no balance, price,
payment-authority or access changes.
