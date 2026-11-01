# TREE payments — staged verification foundation

Status: server-side primitives and tests only. No payment endpoint, wallet transfer handler, database migration or production deployment is included. NFTree access and the live simulated shop are unchanged. Passing receipt validation is **not** permission to apply an upgrade or continue.

## Implemented

`server/payments/tree.mjs` provides a server-owned catalog in integer TREE units and BigInt conversion using verified metadata decimals. Prices match the existing game: Shield 3,000; Fertilizer 5,000; Storm 8,000; Continue 20,000; Guardian growth 5,000; Ancient growth 10,000. Earned Sap remains for planting; NFTree access includes new runs and seasons.

The Mainnet gRPC reader fetches metadata and checkpointed transaction data itself. Its receipt validator requires successful transaction and effects, the authenticated sender, a server-bound digest, the canonical TREE type, an exact matching payer debit and recipient credit, and a checkpoint timestamp inside the invoice window. It rejects expired invoices even when the invoice expires during the chain lookup. Browser receipt objects, editable TREE balances and pasted digests alone are not payment proof.

A live read-only metadata check returned **6 decimals**. A 20,000 TREE continue therefore costs 20,000,000,000 base units. No wallet was asked to sign or execute a transfer.

## Required integration before activation

1. **Recipient confirmed by Peter:** `0x6f1020c2fd6c91129f7cb5e0d651295e87f7245f96b7d090715c89b38197e77f`. Server configuration lives in `server/payments/config.mjs`; receipt validation rejects substituted recipients even if an invoice and receipt both name the replacement. This confirmation applies to Canopy Defense only; no other game's configuration is changed.
2. Provision isolated transactional storage for wallet accounts, invoices, globally unique Mainnet digests and paid entitlements. Do not use deploy-scoped authentication Blobs or browser saves as a payment ledger. Preserve the existing 40 unrelated functions, Canopy access function and five schedules.
3. Reuse the authenticated NFTree session. The server sets wallet, recipient, token, product, price, run and species/next-level from trusted records. Account-row locking must prevent purchasing the same permanent growth twice. Treat local achievements and combat outcomes as client reports, with no reward authority.
4. Bind the signed transaction digest to an invoice before submission. Reject already bound/redeemed digests globally. A post-payment claim containing a digest must not set `expectedDigest`. Wallet signing/execution, cancellation, failed transaction, delayed indexing and interrupted checkout need explicit states; a network timeout must offer verification/recovery, not blindly send a second payment.
5. In one database transaction, recheck session/invoice expiry and eligibility under locks, insert the unique receipt, create the entitlement and mark the invoice paid. A retry returns the same entitlement rather than granting another. A paid receipt whose battle context changes must remain recoverable, never disappear with a new deployment or local save reset.
6. Replace simulated spending with authoritative entitlement application and recovery. Separate legacy preview growth/balances from paid progress so old editable saves cannot manufacture purchases. Permanent species upgrades belong to the wallet; supplies/continues need a durable one-time consumption record bound to the run. Battle time must wait through wallet approval, including Leaf Storm's currently running-only condition.
7. Show TREE amount, recipient and separate SUI gas before wallet approval. No SUI admission fee, swaps, burns, rewards or treasury sales are added. Test with an actual holder wallet and mobile wallet round trip before enabling payments.

## Validation

Ten payment tests cover catalog precision, positive receipt fixtures, wrong network/digest/sender/token/recipient/amount, missing finality, expired invoices, third-party inflows, chain read failures and expiry during lookup. These prove the validation component; they do not establish durable replay prevention, a production entitlement backend or a successful live purchase.

Reference: current Mysten `sui-sdks/typescript.md`, `frontend-apps/transactions.md`, `accessing-data/grpc.md`, and installed @mysten/sui 2.38.0 docs and Core types. No existing arcade wallet integration was migrated.
