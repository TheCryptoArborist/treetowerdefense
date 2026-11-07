# Choosing a game mode

After verified entry and finished-art preparation, the holder gateway reveals
the game and notifies the app. Only then does the app open Choose your game
mode. Background verification cannot reopen the picker while playing. Access
loss closes it, and a changed wallet still uses the gateway reload guard.

An existing save appears first as Continue saved battle, or View saved run for
a finished/defeated battle. Continuing keeps the exact run, numbered defenders,
health, supplies and local applied-payment records. A running battle stays
paused for explicit Resume. Viewing this menu never starts a wave or pays.

Campaign opens the existing world map with a campaign forest selected. It
keeps the current battlefield until the player deliberately enters a forest.
Harvest is an optional five-wave seasonal mode with separate progress and
cosmetic rewards, included with NFTree access. Its existing Emerald Crossing
victory requirement remains visible on the entry card.

Starting a different battle asks before replacing an unfinished or defeated
run, including planted defenders or purchased supplies before wave one.
Campaign stars, roster and permanent defender upgrades remain saved. Run-only
supplies remain with the old run. Server run IDs are assigned to the local
mirror only after the requested destination starts successfully.

The game header shows the current mode. The former Harvest command is now
Modes, which reopens the chooser. Harvest details remain in the management
window as Harvest info. The approved simple cutscenes and clearer shop remain.

Six navigation tests cover preserved saves, read-only campaign choice, locked
Harvest, cancellation/network failure, single-flight navigation and changed
owner/access guards, plus pre-wave replacement warnings.

## Release

Live on checkout-test from source `e0e5856bedeaa4817e070719a7e3951740b075c2`. Backend:
`6aee636099aebf4ac3ca74ca`; routing: `6aee644e07529c5e9edbbb8d`. All 321 local tests pass
with one Windows-only skip. Syntax, protected packaging and CI run
42312454823 pass. The clearer mobile shop is included in the same release.
All 43 production function identities/configurations, five schedules and 299
static paths are preserved; only the checkout rewrite changed. Public hosted
checks confirm both mode descriptions, saved-battle option and shop details.
Private source/access/payment routes remain protected. Authenticated holder
mode-flow and real-purchase acceptance remain separate live checks.

[Release evidence](../integration/tree-arcade/game-mode-entry-release-receipt.json).
