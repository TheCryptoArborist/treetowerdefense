import test from 'node:test';
import assert from 'node:assert/strict';
import {Ed25519Keypair} from '@mysten/sui/keypairs/ed25519';
import {canonicalCheckoutRequest,CHECKOUT_PREFIX} from '../server/canonical-checkout.mjs';
import {createAccessHandler} from '../server/access.mjs';
import {createPaymentHandler} from '../server/payments/http.mjs';
const origin='https://tree-token.xyz';
test('canonical checkout binds real signed login to TREE origin with separate cookie scope',async()=>{
 const map=new Map(),key=new Ed25519Keypair();
 const store={get:async k=>map.get(k),setJSON:async(k,v)=>{map.set(k,v);return{modified:true};},delete:async k=>map.delete(k)};
 const send=async(body,cookie='',requestOrigin=origin)=>{
  const scope=canonicalCheckoutRequest(new Request('https://canopy-checkout-test--tree-token.netlify.app/play/canopy-defense/api/access',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',Cookie:cookie,'X-Forwarded-Host':'evil.example'},body:JSON.stringify(body)}));
  return createAccessHandler({...scope,store,ownership:async()=>({count:1,rarity:0})})(scope.request);
 };
 const c=await(await send({action:'challenge',address:key.toSuiAddress()})).json();
 assert.equal(c.origin,origin);assert.match(c.message,/Origin: https:\/\/tree-token.xyz/);
 assert.equal((await send({action:'challenge',address:key.toSuiAddress()},'','https://evil.example')).status,403);
 const signed=await key.signPersonalMessage(new TextEncoder().encode(c.message));
 const response=await send({action:'verify',address:c.address,nonce:c.nonce,signature:signed.signature});
 assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');
 assert.match(cookie,/^__Secure-canopy-checkout-session=/);assert.match(cookie,/Path=\/play\/canopy-defense\/checkout-test\//);
 const scope=canonicalCheckoutRequest(new Request(origin+CHECKOUT_PREFIX+'src/app.js',{headers:{Cookie:cookie}}));
 const handler=createAccessHandler({...scope,store,sources:{'app.js':'protected'},ownership:async()=>({count:1,rarity:0})});
 assert.equal(await(await handler(scope.request)).text(),'protected');
 assert.equal((await handler(new Request(scope.request.url,{headers:{Cookie:cookie.replace('__Secure-canopy-checkout-session','__Secure-canopy-session')}}))).status,401);
});
test('proxy preserves method/body and enforces canonical checkout origin and route',async()=>{
 const scope=canonicalCheckoutRequest(new Request('https://backend.example/play/canopy-defense/api/payments',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{"action":"run"}'}));
 const handler=createPaymentHandler({authorize:async()=>{},ledger:{startRun:async()=>({id:'one'})},enabled:true,path:CHECKOUT_PREFIX+'api/payments'});
 assert.equal((await handler(scope.request)).status,200);
 const cross=canonicalCheckoutRequest(new Request('https://backend.example/play/canopy-defense/api/payments',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{"action":"run"}'}));
 assert.equal((await handler(cross.request)).status,403);
 assert.equal(canonicalCheckoutRequest(new Request('https://backend.example/unrelated')),null);
 assert.equal((await handler(new Request(origin+'/play/canopy-defense/api/payments'))).status,404);
});
