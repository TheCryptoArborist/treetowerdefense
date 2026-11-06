import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {Transaction,Inputs} from '@mysten/sui/transactions';
import {Ed25519Keypair} from '@mysten/sui/keypairs/ed25519';
import {toBase58,toBase64} from '@mysten/sui/utils';
import {createCheckoutFlow} from '../../client/checkout-flow.mjs';
import {createPaymentHandler} from '../../server/payments/http.mjs';
import {createPurchaseLedger} from '../../server/payments/ledger.mjs';
import {createSignedInspector} from '../../server/payments/signed.mjs';
import {createTreeReader,TREE_TYPE} from '../../server/payments/tree.mjs';

// No RPC or funded wallet: only the chain transport and holder session are doubles.
// The signature inspector, receipt verifier, HTTP handler and SQL ledger are real.
export function checkoutRehearsal(database){
 const key=Ed25519Keypair.generate(),wallet=key.toSuiAddress();
 const url='https://tree-token.xyz/play/canopy-defense/checkout-test/api/payments';
 const coin='0x'+randomBytes(32).toString('hex'),gas='0x'+randomBytes(32).toString('hex');
 const objectDigest=toBase58(randomBytes(32)),transactions=new Map(),submissions=[],signedPayments=[];
 let clock=Date.now(),indexed=true,drop=null;
 const client={
  network:'mainnet',
  getCoinMetadata:async()=>({coinMetadata:{decimals:6}}),
  getObjects:async({objectIds})=>({objects:objectIds.map(objectId=>({objectId,version:'1',digest:objectDigest,owner:{$kind:'AddressOwner',AddressOwner:wallet},type:`0x2::coin::Coin<${objectId===gas?'0x2::sui::SUI':TREE_TYPE}>`}))}),
  getTransaction:async({digest})=>{
   if(!indexed||!transactions.has(digest))throw Error('Receipt is not indexed yet');
   return transactions.get(digest);
  }
 };
 const authorize=async request=>{
  if(request.headers.get('cookie')!=='rehearsal-holder=verified')throw Object.assign(Error('Session rejected'),{status:401});
  return {address:wallet,expiresAt:clock+3600000};
 };
 const reader=createTreeReader(client);
 const ledger=createPurchaseLedger({database,authorize,individualDefenders:true,now:()=>clock,inspectSigned:createSignedInspector(client),readReceipt:reader.receipt,decimals:reader.decimals,
  executeSigned:async(signed,digest)=>{
   submissions.push({signed:{...signed},digest});
   const tx=Transaction.from(signed.bytes);
   assert.equal(await tx.getDigest(),digest);
   // Repeated broadcast of identical signed bytes models Sui digest idempotency.
   if(transactions.has(digest))return;
   const invoice=(await ledger.history(new Request(url,{headers:{cookie:'rehearsal-holder=verified'}}))).find(i=>i.expectedDigest===digest);
   assert(invoice,'Only the recorded invoice can execute');
   transactions.set(digest,{$kind:'Transaction',Transaction:{digest,status:{success:true},effects:{status:{success:true}},checkpoint:'123',timestampMs:clock,transaction:{sender:wallet},balanceChanges:[{address:wallet,coinType:TREE_TYPE,amount:'-'+invoice.amount},{address:invoice.recipient,coinType:TREE_TYPE,amount:invoice.amount}]}});
  }
 });
 const handler=createPaymentHandler({authorize,ledger,enabled:true,path:new URL(url).pathname,report:()=>{}});
 async function request(action,data={},cookie='rehearsal-holder=verified'){
  const headers={cookie,origin:new URL(url).origin,'content-type':'application/json'};
  const response=await handler(new Request(url,{method:action?'POST':'GET',headers,...(action?{body:JSON.stringify({action,...data})}:{})}));
  const body=await response.json();
  if(!response.ok)throw Object.assign(Error(body.error),{status:response.status});
  if(drop===action){drop=null;throw Error('Injected lost '+action+' response after server commit');}
  return body;
 }
 async function sign(invoice){
  // Offline object refs stand in for a wallet build; the server verifies real BCS.
  const tx=new Transaction();tx.setSender(wallet);tx.setGasOwner(wallet);tx.setGasPrice(1000);tx.setGasBudget(10000000);
  tx.setGasPayment([{objectId:gas,version:'1',digest:objectDigest}]);
  const input=tx.object(Inputs.ObjectRef({objectId:coin,version:'1',digest:objectDigest}));
  const [payment]=tx.splitCoins(input,[tx.pure.u64(BigInt(invoice.amount))]);
  tx.transferObjects([payment],tx.pure.address(invoice.recipient));
  const bytes=await tx.build(),signed=await key.signTransaction(bytes);
  const result={bytes:toBase64(bytes),signature:signed.signature};signedPayments.push(result);return result;
 }
 function flow(){return createCheckoutFlow({sign,bind:(id,signed)=>request('bind',{id,signed}),execute:(_signed,_digest,id)=>request('submit',{id}),submitStored:id=>request('submit',{id}),redeem:id=>request('redeem',{id})});}
 return {wallet,request,flow,submissions,signedPayments,transactions,dropResponse:action=>drop=action,setIndexed:value=>indexed=value,advance:ms=>clock+=ms};
}
