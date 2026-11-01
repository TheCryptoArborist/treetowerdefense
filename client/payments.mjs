import {SuiGrpcClient} from '@mysten/sui/grpc';
import {fromBase64} from '@mysten/sui/utils';
import {paymentTransaction} from './payment-transaction.mjs';
import {createCheckoutFlow} from './checkout-flow.mjs';
const TREE='0x6c5a609f6d0288523ce4a6ed87d19ae127f62073ab75fd9b0b1c9b455d4895cf::tree::TREE';
export function createPayments({kit,account}){
 const client=new SuiGrpcClient({network:'mainnet',baseUrl:'https://fullnode.mainnet.sui.io:443'});
 async function request(body){const r=await fetch('./api/payments',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(d.error||'Checkout unavailable');return d;}
 const wallet=()=>{const a=account();if(!a||a.expiresAt<=Date.now())throw Error('Verify your NFTree wallet again');return a.address;};
 const flow=createCheckoutFlow({
  sign:async invoice=>{const owner=wallet();const tx=await paymentTransaction(client,invoice,owner);const signed=await kit.signTransaction({transaction:tx,network:'mainnet'});if(wallet()!==owner)throw Error('Wallet changed; payment was not submitted');return signed;},
  bind:(id,signed)=>request({action:'bind',id,signed}),
  execute:async(signed,digest,id,owner)=>{if(wallet()!==owner)throw Error('Wallet changed. Recover the recorded payment after reconnecting the original wallet.');const r=await request({action:'submit',id});if(r.digest!==digest)throw Error('Unexpected payment digest');},
  submitStored:id=>request({action:'submit',id}),
  redeem:id=>request({action:'redeem',id})
 });
 return Object.freeze({
  status:async()=>{const status=await request();flow.observeHistory(status.invoices??[]);return status;},
  newRun:()=>request({action:'run'}),
  quote:input=>request({action:'quote',...input}),
  pay:invoice=>flow.pay(invoice),recover:id=>flow.recover(id),resume:id=>flow.resume(id),reconcile:async id=>{const result=await request({action:'reconcile',id});flow.clearUnsigned(id);return result;},
  cancel:async id=>{const r=await request({action:'cancel',id});flow.clearUnsigned(id);return r;},
  consume:(id,runId)=>request({action:'consume',id,runId}),
  async balance(){const owner=wallet();const {balance}=await client.getBalance({owner,coinType:TREE});if(wallet()!==owner)throw Error('Wallet changed');return BigInt(balance.balance);}
 });
}
