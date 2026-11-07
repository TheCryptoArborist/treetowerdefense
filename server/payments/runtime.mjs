import {fromBase64} from '@mysten/sui/utils';
import {createHash} from 'node:crypto';
import {SuiGrpcClient} from '@mysten/sui/grpc';
import {nftreeOwnership} from '../ownership.mjs';
import {createTreeReader} from './tree.mjs';
import {createSignedInspector} from './signed.mjs';
import {transactionDatabase} from './database.mjs';
import {createPurchaseLedger} from './ledger.mjs';
import {createPaymentHandler} from './http.mjs';
const client=new SuiGrpcClient({network:'mainnet',baseUrl:'https://fullnode.mainnet.sui.io:443'});
export function paymentRuntime(request,store,{enabled=process.env.CANOPY_CHECKOUT_ENABLED==='true',individualDefenders=process.env.CANOPY_INDIVIDUAL_DEFENDERS==='true',production=false,database,cookieName='__Secure-canopy-session',path}={}){
 let checkedWallet=null;
 const authorize=async()=>{
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.split('=')[1];
  const denied=status=>Object.assign(Error('NFTree session required'),{status});
  if(!/^[a-f0-9]{64}$/.test(token||''))throw denied(401);
  const key='session/'+createHash('sha256').update(token).digest('hex'),s=await store.get(key,{type:'json'});
  if(!s||s.expiresAt<=Date.now()||s.origin!==new URL(request.url).origin)throw denied(401);
  if(checkedWallet!==s.address){const owned=await nftreeOwnership(s.address);if(owned.count<1)throw denied(403);checkedWallet=s.address;}
  return {address:s.address,expiresAt:s.expiresAt};
 };
 // Delay resolving DB credentials until an enabled, authenticated route actually needs them.
 let realLedger;
 const lazy=new Proxy({}, {get:(_,method)=>async(...args)=>{if(!realLedger){const reader=createTreeReader(client);realLedger=createPurchaseLedger({database:database??transactionDatabase(),individualDefenders,authorize,readReceipt:reader.receipt,inspectSigned:createSignedInspector(client),decimals:reader.decimals,readFailure:reader.failed,executeSigned:async(signed,digest)=>{const r=await client.executeTransaction({transaction:fromBase64(signed.bytes),signatures:[signed.signature]});if(r.$kind==='FailedTransaction')throw Error('Payment failed on-chain');if(r.Transaction.digest!==digest)throw Error('Unexpected digest');await client.waitForTransaction({digest});}});}return realLedger[method](...args);}});
 return createPaymentHandler({authorize,ledger:lazy,enabled,production,path})(request);
}
