# SUI address-balance gas compatibility

Holder reference `b2927c4b-1ac0-4984-8fa0-07c73210d532` correlates to Netlify request `01M6CWCKKC6JRJTVT2ETK69N2W`, HTTP 422, code GAS_BUDGET. That previous check conflated three conditions: no gas coin references, nonpositive budget, and budget above 50,000,000 MIST. The old log did not record the actual budget or gas coin count, so the holder's precise failing condition is not recoverable from that log alone.

Current official Sui documentation and installed SDK support gas paid from the sender's SUI address balance using an empty gas payment array. The checkout builder requests 10,000,000 MIST (0.01 SUI), below the existing 0.05 SUI cap. A real signed-BCS regression using that budget and empty gas payment reproduces the old rejection and now passes. This fixes the identified gas-format compatibility bug; successful holder checkout remains pending.

The validator keeps gas owner equal to the verified buyer and a positive budget at most 50,000,000 MIST. Object-based gas still validates every SUI gas coin's type, owner, version and digest. Address-balance gas is accepted only with:

- Mainnet protocol flag enable_address_balance_gas_payments enabled.
- Signed ValidDuring replay protection with min/max epochs, no timestamps, and a range of at most one epoch.
- A signed chain digest matching the trusted Mainnet client and current epoch within the signed range.
- A fresh SUI address balance covering the complete signed budget; total balance or TREE balance cannot substitute.

Signature, TREE input ownership/version checks, exact command layout, recipient, amount and invoice binding remain. Lookup failures reject before binding. No gas budget increase, sponsorship, new transfer commands or automatic retries were introduced. Distinct error categories now separate real budget violations, unsupported gas mode, replay protection, lookup failure and insufficient SUI address balance. A budget rejection logs only bounded numeric budget/count metadata alongside the existing redacted diagnostics.

Primary guidance reviewed:
https://sdk.mystenlabs.com/sui/transactions/signing-and-execution
https://www.docs.sui.io/onchain-finance/asset-custody/address-balances/using-address-balances
Current MystenLabs/skills README and sui-ts-sdk-backend/transactions.md were consulted; SDK methods and response fields were verified against installed @mysten/sui 2.38.0 source.

Validation: 221 tests passed, one Windows-only skip; syntax and whitespace checks passed. New signed-transaction regressions cover valid address gas, the unchanged cap and payer, missing/wide/expired/wrong-chain replay protection, SUI address-only coverage, disabled protocol support and failed RPC reads. No holder signature or payment was initiated by the agent. Published at https://tree-token.xyz/play/canopy-defense/checkout-test/. Source `3beef778beab620c5a217cd844b5709fbc772281`, backend `6ae7e28a1badcba7520e2ad5`, routing release `6ae7e30d88b73d2c90234dc2`. GitHub validation run 41370809328 succeeded. The canonical page returns 200; anonymous access, payments and game source return 401. Holder wallet completion remains pending.
