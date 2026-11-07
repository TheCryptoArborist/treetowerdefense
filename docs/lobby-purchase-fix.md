# Purchases from the lobby shop

The original purchase entry guard rejected every click while the mode lobby
was open. Lobby management intentionally keeps that dialog open underneath
the shop, so a Root Shield click returned before creating a quote or opening
purchase review. The button animated but no wallet action began.

Allow purchase review when the lobby's own management window is open on the
shop section. Keep story, unrelated lobby sections, duplicate review, storage
and item-eligibility guards. Opening review still only obtains a quote; the
player must separately confirm and approve their wallet transaction.

Regression checks execute the actual application review handlers, covering
paid and simulated lobby entry, duplicate clicks, background/other-section
clicks, normal battlefield entry and full-shield ineligibility. They verify
that opening review requests one quote without spending or changing the run.
All 339 tests completed: 338 passed and one Windows-only test skipped.
Syntax checks passed. No real wallet transaction was performed.

The earlier production candidate predates this fix and must not be
published. Rebuild the current game after the live purchase/recovery
acceptance, which is still pending.

The fix is live on the existing checkout-test link. See the
[release receipt](../integration/tree-arcade/lobby-purchase-fix-release-receipt.json).
Ubuntu, Windows and PostgreSQL CI passed. Reload the open game tab before
retrying Buy Root Shield so it imports the corrected handler.
