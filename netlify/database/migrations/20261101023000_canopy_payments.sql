-- Additive, isolated schema. No existing tables or other arcade games are modified.
CREATE SCHEMA canopy_payments;
REVOKE ALL ON SCHEMA canopy_payments FROM PUBLIC;
CREATE TABLE canopy_payments.accounts (
 wallet text PRIMARY KEY CHECK (wallet ~ '^0x[0-9a-f]{64}$'),
 created_at bigint NOT NULL
);
CREATE TABLE canopy_payments.runs (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES canopy_payments.accounts(wallet),
 created_at bigint NOT NULL, UNIQUE(id,wallet)
);
CREATE TABLE canopy_payments.growth (
 wallet text NOT NULL REFERENCES canopy_payments.accounts(wallet),
 species text NOT NULL CHECK(species IN ('oak','pine','palm','cypress','mushroom','willow','watchtower','cannon')),
 level integer NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 3), PRIMARY KEY(wallet,species)
);
CREATE TABLE canopy_payments.invoices (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES canopy_payments.accounts(wallet),
 run_id uuid, species text, product text NOT NULL CHECK(product IN ('shield','fertilizer','storm','continue','growth:2','growth:3')),
 recipient text NOT NULL CHECK(recipient = '0x6f1020c2fd6c91129f7cb5e0d651295e87f7245f96b7d090715c89b38197e77f'),
 amount numeric(40,0) NOT NULL CHECK(amount > 0), decimals integer NOT NULL CHECK(decimals BETWEEN 0 AND 18),
 created_at bigint NOT NULL, expires_at bigint NOT NULL CHECK(expires_at > created_at),
 status text NOT NULL DEFAULT 'quoted' CHECK(status IN ('quoted','bound','paid','expired','cancelled')),
 expected_digest text UNIQUE, paid_at bigint,
 FOREIGN KEY(run_id,wallet) REFERENCES canopy_payments.runs(id,wallet),
 FOREIGN KEY(wallet,species) REFERENCES canopy_payments.growth(wallet,species),
 CHECK((species IS NOT NULL AND run_id IS NULL AND product IN ('growth:2','growth:3')) OR (species IS NULL AND run_id IS NOT NULL AND product IN ('shield','fertilizer','storm','continue'))),
 CHECK((status='quoted' AND expected_digest IS NULL AND paid_at IS NULL) OR
       (status='bound' AND expected_digest IS NOT NULL AND paid_at IS NULL) OR
       (status='paid' AND expected_digest IS NOT NULL AND paid_at IS NOT NULL) OR status IN ('expired','cancelled'))
);
CREATE UNIQUE INDEX one_pending_species_upgrade ON canopy_payments.invoices(wallet,species) WHERE species IS NOT NULL AND status IN ('quoted','bound');
CREATE TABLE canopy_payments.receipts (
 digest text PRIMARY KEY, invoice_id uuid NOT NULL UNIQUE REFERENCES canopy_payments.invoices(id),
 checkpoint text NOT NULL, timestamp_ms bigint NOT NULL, verified_at bigint NOT NULL
);
CREATE TABLE canopy_payments.entitlements (
 id uuid PRIMARY KEY, invoice_id uuid NOT NULL UNIQUE REFERENCES canopy_payments.invoices(id),
 wallet text NOT NULL REFERENCES canopy_payments.accounts(wallet), product text NOT NULL,
 run_id uuid, species text, consumed_at bigint,
 FOREIGN KEY(run_id,wallet) REFERENCES canopy_payments.runs(id,wallet)
);
CREATE INDEX invoice_history ON canopy_payments.invoices(wallet,created_at);
CREATE INDEX entitlement_history ON canopy_payments.entitlements(wallet);
REVOKE ALL ON ALL TABLES IN SCHEMA canopy_payments FROM PUBLIC;
