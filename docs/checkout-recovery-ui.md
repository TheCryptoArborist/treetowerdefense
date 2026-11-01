# Checkout dialog recovery

A lost response after signing leaves the checkout flow's uncertain invoice set. This is intentional: starting a second signed transfer could duplicate payment. The old dialog nevertheless left Pay with wallet enabled for its locally quoted invoice. Repeated clicks replaced the original interruption with the generic pending-purchase warning, while recovery controls were outside the modal.

The dialog now derives its payment button from both the invoice and the flow's uncertain state. It disables new payment attempts while a recorded purchase needs review, preserves the original stage-specific error, and shows wallet / binding / submission / receipt progress. The same recovery actions as Purchase history are available inside the modal:

- Quoted: cancel the unpaid quote through the existing authenticated endpoint, then explicitly create a new checkout and review its price before paying.
- Bound: check the receipt, explicitly submit only the exact stored transaction, or reconcile a finalized failure. These actions never open a new signing request.
- Paid: recover the existing entitlement.
- Cancelled/expired: explicitly create a new quote.

An unavailable history read never clears the uncertainty or enables another payment. A quoted history row alone also never clears it: a bind request may still be in flight. Only the trusted cancellation/expiry response or successful receipt recovery releases that lock. Existing server locks, ownership verification, price/recipient validation, transaction submission and entitlement rules are unchanged. No server schema changes or new wallet permissions.

Validation: 199 tests passed, one Windows-only skip; syntax and whitespace checks passed. Six regressions cover interrupted binding without a second signature, correct pending invoice selection, recovery after reload, progress states, callback failure isolation and disabled loading controls. Existing ledger tests confirm cancellation cannot discard a bound payment and cancellation prevents late binding. No holder payment was initiated. The original request that caused this user's interrupted binding cannot be determined from the screenshot; the fix exposes its stage and preserves future errors rather than claiming chain success.

Hosted release pending. Signed-in wallet and real-payment acceptance remain pending in the holder session.
