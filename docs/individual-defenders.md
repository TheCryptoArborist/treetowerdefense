# Individual defender collection

User-approved direction: TREE buys a level for one defender rather than an entire species. This first migration retains Sapling / Guardian / Ancient and the current 5,000 / 10,000 TREE prices per level. Ten levels, Tree of Life HQ progression and research are separate future work.

## Collection rules

Each species has twelve permanently numbered copies, matching the maximum twelve battlefield sites. Unlocking the species grants its copies without a recruitment charge. The collection is a game account feature, not a new tradable NFT. Choose an available copy in the roster picker; Sap deploys it. Each copy can appear only once on a battlefield. Removing it refunds the existing 60% Sap and returns it to the collection with its level; new runs clear deployment and Sap while retaining collection levels. Chapter and season travel use the same collection.

A TREE upgrade affects only the selected copy. Other copies retain their levels. The copy number appears in the picker, inspector, purchase review, invoice history and server invoice. Three levels and combat multipliers are unchanged, so this changes purchase scope and progression choices rather than increasing the stat ceiling. Cosmetic rarity remains separate.

## Existing purchases

Keep the existing species growth table as a grandfathered minimum. Seed all twelve copies at that level, preserving both existing and future deployment benefits promised by the old purchase. Local simulated saves migrate their species levels and assign distinct numbers to deployed copies. Paid mode seeds only from verified server growth, then overlays authoritative individual levels. Edited local state never proves payment.

The additive migration creates `canopy_payments.defenders`, seeds existing purchases, and adds nullable invoice/entitlement copy columns. It does not alter existing invoices, receipts, accounts, run IDs or growth prices. Already signed species invoices remain recoverable with their original species-wide scope. New individual invoices are tied to the stored wallet/species/copy, and redemption changes exactly one row atomically with its receipt and entitlement. Retries return the same entitlement. The existing one-pending-invoice-per-species constraint remains: recover/cancel that purchase before buying a different copy of the same species.

## Activation and validation

The new paid mode is opt-in with `CANOPY_INDIVIDUAL_DEFENDERS=true` on the isolated checkout-test backend only. Payment status reports `collection.version=1` plus server-owned copy rows; the client refuses to use a collection save with a backend that does not support collections. Legacy mode remains compatible. Do not disable the flag after individual purchases without a compatible replacement. Do not promote this backend to the regular game or production database before holder and phone acceptance.

Local integration tests cover individual invoices, independent prices, duplicate redemption, late legacy recovery, atomic rollback, invalid slots, client replacement from server state, migrated copies, cross-run persistence, save validation and chapter/season travel. Actual wallet signing and holder UI acceptance remain unverified.

Local validation: 188 passing tests, one Windows-only skip, zero failures; JavaScript syntax checks and `git diff --check` passed. The migration rehearsal starts from the old schema with paid species levels and confirms all twelve inherited copies without changing those old rows. Hosted migration and canonical preview activation were subsequently verified (see release completion below).

## Release status

Source `f33ec9d9eba581ff6165b2969515e0f210468c7a` deployed as isolated backend `6ae7a6a082b2ed56640b44aa` on site `tree-token`, branch `canopy-checkout-test`, with individual defenders enabled. Both GitHub validation runs passed (41349069836 and 41349065029).

The documented read-only check `netlify database status --branch canopy-checkout-test --json` failed with: `The project must be linked with npx netlify link to target a remote branch.` No subsequent Netlify operations were attempted under the database skill failure rule. The hosted migration is unverified, and the canonical arcade route still points to the previous Veteran build. Do not describe individual purchases as available through the canonical arcade yet.

Next deployment work: link this checkout to the existing site, verify the preview migration through the documented database status surface, then prepare/publish the preservation-checked routing update. Do not create another project, apply hosted SQL directly, change production data or replace unrelated functions. Actual holder UI and wallet-purchase acceptance remain pending.

## Release completion

The checkout was linked to the existing `tree-token` project using the documented CLI. Settings remain excluded from Git. `netlify database status --branch canopy-checkout-test --json` now succeeds: all three migrations are applied, including `20261101210000_individual_defenders`; pending, missing and out-of-order lists are empty. The earlier linking error is resolved. No hosted SQL was applied directly.

Routing release `6ae7a7c8bc69ad8dd702d627` is live at https://tree-token.xyz/play/canopy-defense/checkout-test/ and points to backend `6ae7a6a082b2ed56640b44aa` (source `f33ec9d9eba581ff6165b2969515e0f210468c7a`). Only `/_redirects` changed; all 284 static entries, 41 existing functions/configurations and five schedules passed preservation checks. The regular game is unchanged.

Canonical entry returns 200 with the individual picker and updated help; anonymous source, access and payment endpoints return 401. Prior local checks remain 188 passing tests plus one Windows-only skip; both CI runs passed. Signed-in holder gameplay, phone layout and real-purchase/recovery acceptance remain unverified.
