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
