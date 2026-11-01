-- Additive migration for the isolated Canopy checkout preview.
-- Existing species growth stays as the grandfathered minimum for all 12 copies.
CREATE TABLE canopy_payments.defenders (
 wallet text NOT NULL, species text NOT NULL,
 slot integer NOT NULL CHECK(slot BETWEEN 0 AND 11),
 level integer NOT NULL CHECK(level BETWEEN 1 AND 3),
 PRIMARY KEY(wallet,species,slot),
 FOREIGN KEY(wallet,species) REFERENCES canopy_payments.growth(wallet,species)
);
INSERT INTO canopy_payments.defenders(wallet,species,slot,level)
 SELECT wallet,species,slot,level FROM canopy_payments.growth CROSS JOIN generate_series(0,11) AS slot;
ALTER TABLE canopy_payments.invoices ADD COLUMN defender_slot integer CHECK(defender_slot BETWEEN 0 AND 11);
ALTER TABLE canopy_payments.invoices ADD CONSTRAINT defender_invoice_scope CHECK(defender_slot IS NULL OR species IS NOT NULL);
ALTER TABLE canopy_payments.invoices ADD FOREIGN KEY(wallet,species,defender_slot) REFERENCES canopy_payments.defenders(wallet,species,slot);
ALTER TABLE canopy_payments.entitlements ADD COLUMN defender_slot integer CHECK(defender_slot BETWEEN 0 AND 11);
ALTER TABLE canopy_payments.entitlements ADD FOREIGN KEY(wallet,species,defender_slot) REFERENCES canopy_payments.defenders(wallet,species,slot);
REVOKE ALL ON canopy_payments.defenders FROM PUBLIC;
-- Retain the existing one-pending-invoice-per-species constraint to protect
-- recovery across both legacy invoices and new individual upgrade invoices.
