# Checkout interruption rehearsal

The latest finished-art loading playtest was accepted by Peter: “The test
turned out well. You can keep working on the next step.” The device was not
specified. This confirms that reported playtest; it does not establish a
phone-wallet round trip or a successful real TREE payment.

Five additional scenarios run in `tests/purchase-ledger.test.mjs`, including
the existing PostgreSQL 16 CI job. They connect the production checkout state
machine, HTTP handler, signed-transaction inspector, receipt verifier, SQL
ledger, and game entitlement methods. The rehearsal creates an ephemeral
Ed25519 key, signs actual Sui transaction bytes offline, and discards the key.
The holder session and chain transport are test doubles. No RPC is called,
wallet funds are spent, or hosted database is changed.

| Interruption | Required recovery |
| --- | --- |
| Bind commits but its response is lost | New payment stays blocked; reload and resume submit the stored bytes with one signature. |
| Submission succeeds but its response is lost | Receipt-only recovery makes no second broadcast; concurrent checks create one entitlement and improve only the selected defender copy. |
| Redemption commits but its response is lost | History reports paid; resume returns the same supply and skips execution. The local item applies once. |
| Continue consumption commits but its response is lost | Reload recovers the already-consumed server item into the prior saved battle once. A later defeat cannot reuse the saved applied entitlement. |
| Receipt indexing is delayed past quote expiry | The invoice remains bound with no premature grant; an absent session is denied. Recovery verifies the original timely payment without signing or submitting again. |

Each scenario checks one durable receipt and entitlement. The full local suite
passes 305 tests with one Windows-only skip; syntax and protected packaging
checks pass. These rehearsals extend verification; they change no runtime,
prices, payment rules, or deployment. The live game stays on source
`38fae2809f48302ea8adb7ef96976d490f03163c` at the isolated checkout-test route.

The live entrance was inspected at
https://tree-token.xyz/play/canopy-defense/checkout-test/. It displays the
NFTree gate and discloses real TREE plus SUI gas. No holder wallet was connected
and no login signature or payment was initiated.

## Remaining live acceptance

Use a funded NFTree holder wallet other than the configured recipient. Sign-in
is free. Review a Root Shield invoice for **3,000 TREE plus SUI gas**, approve
that single purchase, and verify its receipt and 50-point shield. Reopen the
same purchase from history and reload; the history must still contain one
purchase, and recovering it must not request another signature or refill an
already-applied shield. Do not pay again if a response is interrupted; use
Check payment first. Submit recorded payment only when deliberately retrying
the already-stored transaction.

A selected level-one defender's upgrade costs **5,000 TREE plus SUI gas**;
check that only its numbered copy advances and survives a fresh run. A defeat
continue costs **20,000 TREE plus SUI gas**; it should restore the current wave
once. These are separate optional real purchases, not part of the automated
rehearsal. A phone-wallet round trip remains a separate acceptance step.
Regular-game promotion remains pending live payment acceptance.
