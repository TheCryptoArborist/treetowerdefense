import test from 'node:test';import assert from 'node:assert/strict';import {createPaymentHandler} from '../server/payments/http.mjs';
const url='https://tree-token.xyz/play/canopy-defense/api/payments';
function request(body,origin='https://tree-token.xyz'){return new Request(url,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
test('checkout requires authoritative login and remains disabled by default',async()=>{let calls=0;const no=createPaymentHandler({authorize:async()=>{throw Object.assign(Error(),{status:401});},ledger:{}});assert.equal((await no(request())).status,401);const off=createPaymentHandler({authorize:async()=>{},ledger:{quote:async()=>calls++}});assert.deepEqual(await(await off(request())).json(),{enabled:false});assert.equal((await off(request({action:'quote'}))).status,503);assert.equal(calls,0);});
test('cross-origin and injected wallet/amount/digest fields cannot reach the ledger',async()=>{let calls=0;const h=createPaymentHandler({authorize:async()=>{},enabled:true,ledger:{quote:async()=>calls++}});assert.equal((await h(request({action:'quote'},'https://evil.test'))).status,403);for(const extra of [{wallet:'attacker'},{amount:'1'},{expectedDigest:'fake'}])assert.equal((await h(request({action:'quote',product:'shield',...extra}))).status,400);assert.equal(calls,0);});
test('authenticated quotes take only whitelisted fields, and private responses are not cached',async()=>{let input;const h=createPaymentHandler({authorize:async()=>{},enabled:true,ledger:{quote:async(ctx,b)=>{input=b;return{id:'quote'};}}});const r=await h(request({action:'quote',product:'shield',runId:'run'}));assert.equal(r.status,200);assert.deepEqual(input,{product:'shield',runId:'run'});assert.match(r.headers.get('cache-control'),/no-store/);});

test('signed-payment rejections return a safe reason and correlate with redacted function diagnostics',async()=>{
 const {paymentError}=await import('../server/payments/errors.mjs');let entry;
 const sensitive='signed bytes, cookie and database credentials must not be exposed';
 const h=createPaymentHandler({authorize:async()=>{},enabled:true,report:e=>entry=e,ledger:{bind:async()=>{throw paymentError('COIN_CHANGED',new Error(sensitive));}}});
 const r=await h(request({action:'bind',id:'invoice',signed:{bytes:sensitive}})),body=await r.json();
 assert.equal(r.status,409);assert.equal(body.code,'COIN_CHANGED');assert.match(body.error,/coin changed/i);assert.match(body.reference,/^[0-9a-f-]{36}$/);assert.equal(body.reference,entry.reference);assert.equal(entry.action,'bind');assert.doesNotMatch(JSON.stringify({body,entry}),/credentials|signed bytes|cookie|stack/);
});
test('unexpected database failure is identified without revealing SQL or connection details',async()=>{
 let entry;const h=createPaymentHandler({authorize:async()=>{},enabled:true,report:e=>entry=e,ledger:{bind:async()=>{throw Object.assign(Error('private SQL and connection string'),{code:'23505'});}}});
 const r=await h(request({action:'bind',id:'invoice',signed:{}})),body=await r.json();assert.equal(r.status,503);assert.equal(body.code,'CHECKOUT_BIND_FAILED');assert.equal(entry.databaseCode,'23505');assert.doesNotMatch(JSON.stringify({body,entry}),/private SQL|connection string/);
});
test('a logging failure cannot change a checkout rejection or release a pending invoice',async()=>{
 const h=createPaymentHandler({authorize:async()=>{},enabled:true,report:()=>{throw Error('logging offline');},ledger:{bind:async()=>{throw Error('bind unavailable');}}});
 const r=await h(request({action:'bind',id:'invoice',signed:{}}));assert.equal(r.status,503);assert.equal((await r.json()).code,'CHECKOUT_BIND_FAILED');
});
