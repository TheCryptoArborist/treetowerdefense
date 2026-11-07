# Return to the game after refresh

Wallet auto-connect already restored the connected account and checked the
HttpOnly NFTree session, but the gateway still waited for Enter the forest.
After a successful server session read, it now enters automatically once.
Connecting and reconnecting states show a returning-to-the-forest cover.

The server must verify current ownership, a matching connected wallet and
an unexpired cookie before private gameplay loads. No cached ownership flag,
browser session proof, new signature or payment authorizes automatic return.
Expired, revoked and wrong-wallet sessions still require sign-in. Existing
15-minute server session expiry is unchanged.

The finished-art cover remains visible until the first complete scene is
prepared. Ownership checks continue during loading. Late verification after
disconnect cannot reveal the old wallet's game, and a failed graphics load
does not trigger repeated automatic imports. Return uses the existing game
lobby and saved-battle flow; battle simulation remains under manual control.

Tests execute the actual gateway, covering automatic reconnect/return with
GET-only verification, single entry, expiry/revocation/wallet mismatch,
disconnect during verification, ownership loss during automatic art loading
and failed-art retry behavior. Full suite: 343 tests, 342 passed, one
Windows-only skip. Syntax checks passed. No wallet payment was performed.

The correction is live on checkout-test. See the
[release receipt](../integration/tree-arcade/session-restoration-release-receipt.json).
Ubuntu, Windows and PostgreSQL CI passed. A new backend deployment can
require fresh sign-in once; subsequent refreshes with a valid session enter
automatically. No automatic signature or wallet transaction occurs.
