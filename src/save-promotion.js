// Browser progress is not a payment entitlement. The server collection still replaces paid levels.
export function adoptCheckoutBattle(storage,wallet,restore){
 const destination='canopy-defense-paid-v1:'+wallet;
 if(storage.getItem(destination))return null;
 const raw=storage.getItem('canopy-defense-checkout-test-v1:'+wallet);if(!raw)return null;
 try{
  const saved=JSON.parse(raw);
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(saved.runId||'')||!restore(saved.game))return null;
  const copy=JSON.stringify({game:saved.game,runId:saved.runId,applied:Array.isArray(saved.applied)?saved.applied.filter(id=>typeof id==='string').slice(0,1000):[]});
  try{storage.setItem(destination,copy);}catch{/* Keep the readable battle in memory when storage is full. */}return copy;
 }catch{return null;}
}

export function requireLiveCheckout(status){
 if(status?.production===true&&status.enabled!==true)throw Object.assign(Error('Wallet checkout is temporarily unavailable. Reload to reconnect; saved progress is retained.'),{code:'CANOPY_CHECKOUT_DISABLED'});
}
