// Apply a verified server entitlement to this local, reward-free battle mirror.
export function applyEntitlement(game,item,{wallet,runId,applied}){
 if(!item||item.wallet!==wallet||typeof item.id!=='string'||typeof item.invoice_id!=='string')throw Error('Invalid purchase entitlement');
 if(applied.has(item.id))return true;
 if(item.product.startsWith('growth:'))throw Error('Load permanent growth from the server account');
 if(item.run_id!==runId)throw Error('This purchase belongs to another run');
 const done=item.product==='continue'?game.applyPurchasedContinue():game.applyPurchasedSupply(item.product);
 if(done)applied.add(item.id);
 return done;
}
