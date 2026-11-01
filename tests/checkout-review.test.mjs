import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutReviewState} from '../src/checkout-review.js';
import {createCheckoutFlow} from '../client/checkout-flow.mjs';
const invoice={id:'first',status:'quoted'};
test('interrupted binding disables Pay and exposes the original invoice for recovery',async()=>{
 let signs=0;const flow=createCheckoutFlow({sign:async()=>{signs++;return{};},bind:async()=>{throw Error('Connection lost');}});
 await assert.rejects(flow.pay(invoice),/Recording signed payment: Connection lost/);
 const state=checkoutReviewState({invoice,pending:flow.pending,busy:false});
 assert.equal(state.disabled,true);assert.equal(state.recoveryId,'first');assert.equal(state.label,'Review pending purchase');
 await assert.rejects(flow.pay(invoice),/Recording signed payment: Connection lost/);assert.equal(signs,1);
 // A trusted server cancellation is required before allowing another wallet prompt.
 flow.observeHistory([{id:'first',status:'quoted'}]);assert.equal(flow.pending,'first');
 flow.observeHistory([{id:'first',status:'cancelled'}]);
 const retry=checkoutReviewState({invoice:{...invoice,status:'cancelled'},pending:flow.pending,busy:false});assert.equal(retry.retry,true);assert.equal(retry.disabled,false);assert.equal(retry.label,'Create new checkout');
});
test('a different pending checkout blocks the current quote and identifies the right recovery target',()=>{
 const state=checkoutReviewState({invoice,pending:'older',busy:false});assert.equal(state.disabled,true);assert.equal(state.recoveryId,'older');
});
test('recorded bound and paid invoices cannot display an enabled Pay button after reload',()=>{
 for(const status of ['bound','paid']){const s=checkoutReviewState({invoice:{...invoice,status},pending:null,busy:false});assert.equal(s.disabled,true);assert.equal(s.recoveryId,'first');}
 for(const status of ['cancelled','expired']){const s=checkoutReviewState({invoice:{...invoice,status},pending:null,busy:false});assert.equal(s.retry,true);assert.equal(s.label,'Create new checkout');}
});
test('wallet, recording, submission and receipt waits each have visible progress and disabled payment controls',async()=>{
 const observed=[];let flow;
 flow=createCheckoutFlow({sign:async()=>({}),bind:async()=>({status:'bound',expectedDigest:'digest'}),execute:async()=>{},redeem:async()=>({id:'item'}),onChange:()=>observed.push(flow.phase)});
 await flow.pay(invoice);assert.deepEqual(observed,['signing','binding','submitting','verifying','idle']);
 for(const phase of observed.slice(0,-1)){const state=checkoutReviewState({invoice,busy:true,phase});assert.equal(state.disabled,true);assert.ok(state.progress.length);assert.notEqual(state.label,'Pay with wallet');}
 assert.equal(flow.pending,null);assert.equal(flow.lastError,null);
});
test('rendering failures cannot interrupt the recorded payment protocol',async()=>{
 let submitted=0;const flow=createCheckoutFlow({sign:async()=>({}),bind:async()=>({status:'bound',expectedDigest:'digest'}),execute:async()=>{submitted++;},redeem:async()=>({id:'item'}),onChange:()=>{throw Error('UI error');}});
 await flow.pay(invoice);assert.equal(submitted,1);assert.equal(flow.pending,null);
});
test('missing quote and loading new quote never enable payment',()=>{
 assert.equal(checkoutReviewState({invoice:null,busy:false}).disabled,true);
 assert.equal(checkoutReviewState({invoice,busy:true}).disabled,true);
});
