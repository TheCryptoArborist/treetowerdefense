-- Signed bytes contain authorization for one exact reviewed transfer, never a private key.
ALTER TABLE canopy_payments.invoices ADD COLUMN signed_bytes text;
ALTER TABLE canopy_payments.invoices ADD COLUMN signed_signature text;
ALTER TABLE canopy_payments.invoices ADD COLUMN bound_at bigint;
