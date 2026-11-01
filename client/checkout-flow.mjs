// At most one wallet submission attempt per invoice. Recovery only checks the recorded digest.
export function createCheckoutFlow({sign,bind,execute,redeem,submitStored}){
 let busy=false,uncertain=null;
 return Object.freeze({
  get pending(){return uncertain;},
  async pay(invoice){
   if(busy||uncertain)throw Error('Check the pending purchase before starting another payment');busy=true;
   try{
    const signed=await sign(invoice); // rejection here has not submitted a transaction
    uncertain=invoice.id;
    const bound=await bind(invoice.id,signed);
    if(bound.status==='paid'){const item=await redeem(invoice.id);uncertain=null;return item;}
    if(bound.status!=='bound'||!bound.expectedDigest)throw Error('Payment was not bound');
    await execute(signed,bound.expectedDigest,invoice.id,invoice.wallet);
    const item=await redeem(invoice.id);uncertain=null;return item;
   }finally{busy=false;}
  },
  async resume(id){if(busy)throw Error('Checkout is busy');busy=true;uncertain=id;try{await submitStored(id);const item=await redeem(id);uncertain=null;return item;}finally{busy=false;}},
  async recover(id){if(busy)throw Error('Checkout is busy');busy=true;uncertain=id;try{const item=await redeem(id);uncertain=null;return item;}finally{busy=false;}},
  // Called only after a trusted history read confirms no signed/bound/paid invoice exists.
  clearUnsigned(id){if(!busy&&uncertain===id)uncertain=null;}
 });
}
