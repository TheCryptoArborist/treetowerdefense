# Lobby management

The mode entrance now includes four illustrated shortcuts between the saved
battle and the Campaign/Harvest choices: Shop & upgrades, My defenders,
Styles & cosmetics, and Field guide. Shop receives the gold emphasis.

Opening a shortcut keeps mode selection underneath a native management
dialog. Close/Escape returns to the same lobby control; no new run, wave,
payment or mode selection occurs. Existing purchase confirmation, wallet
approval and recovery rules stay intact. Supplies identify their destination
battle and warn that a new run replaces them. Defender upgrades remain
permanent and priced separately from earned Sap deployment.

Cosmetics have their own section, outside the TREE shop. NFTree rarity
styles show Equipped, Available or Locked, and lower appearances remain
included. Harvest rewards have separate earned/equipped controls. These
looks change no combat stats and do not introduce a cosmetic purchase.
A small Oak preview in the lobby reflects the style selected for new
defenders; existing per-tower style behavior is preserved.

The shortcuts use two columns on phones and four on desktop. Controller
IDs, battle replacement warnings and the Christmas teaser are preserved.

Validation: 335 tests (334 passed, one Windows-only skip), syntax checks and
protected packaging. Native browser visual/device acceptance remains a
holder check; the local browser runner could not launch under its socket
restrictions. No real wallet transaction was performed. This UI revision
supersedes the earlier un-published production candidate; rebuild and verify
that candidate from the current game before publishing it.

The revision is live on the existing checkout-test URL. See
[integrity and release receipt](../integration/tree-arcade/lobby-management-release-receipt.json).
Ubuntu, Windows and PostgreSQL CI passed on the recorded source commit.

The user accepted the latest lobby review. The device was not specified.
The rebuilt production candidate includes this revision and is verified;
real-wallet purchase/recovery acceptance remains pending before publication.
