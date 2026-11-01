// UI policy only. Server invoices and receipts remain authoritative.
export function checkoutReviewState({invoice,pending,busy,phase='idle'}){
 const progress={signing:'Preparing TREE payment. Check your wallet for approval…',binding:'Recording your signed payment…',submitting:'Submitting the recorded payment…',verifying:'Checking the payment receipt…'}[phase]||'';
 const retry=!!invoice&&['cancelled','expired'].includes(invoice.status);
 const recorded=!!pending||!!invoice&&['bound','paid'].includes(invoice.status);
 return {disabled:busy||!!pending||!invoice||(!retry&&invoice.status!=='quoted'),label:progress?({signing:'Waiting for wallet…',binding:'Recording payment…',submitting:'Submitting payment…',verifying:'Checking receipt…'}[phase]):recorded?'Review pending purchase':retry?'Create new checkout':!invoice?'Loading checkout…':'Pay with wallet',progress,recoveryId:pending||(invoice&&invoice.status!=='quoted'?invoice.id:null),retry};
}
