import assert from 'node:assert/strict';
export function requireProductionAcceptance(proof){
 assert.equal(proof.status,'accepted','A live wallet purchase/recovery test is still required');assert.equal(proof.receiptVerified,true);assert.equal(proof.shieldAfterPurchase,50);assert.equal(proof.historyPurchaseCount,1);assert.equal(proof.recoveryWithoutSecondPayment,true);assert.equal(proof.duplicateGrantObserved,false);assert(/^[1-9A-HJ-NP-Za-km-z]{32,50}$/.test(proof.transactionDigest||''));return true;
}
