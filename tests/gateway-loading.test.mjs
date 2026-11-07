import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {parseHTML} from 'linkedom';
function setup({fetchImpl=()=>{throw Error('Unexpected request');}}={}){
 const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));
 const dialog=document.getElementById('access-dialog');dialog.open=true;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 let resolve,reject,calls=0,reloads=0;const loading=new Promise((a,b)=>{resolve=a;reject=b;});
 const context=vm.createContext({document,window,location:{origin:'https://tree-token.xyz',reload(){reloads++;}},setInterval(){},Date,TextEncoder,
  createDAppKit:()=>({stores:{$connection:{subscribe(){}}}}),SuiGrpcClient:class{},createPayments:()=>({}),fetch:fetchImpl,
  loadGame:()=>{calls++;return loading;}});
 const source=fs.readFileSync('client/gateway.mjs','utf8').replace(/^import .*;\r?\n/gm,'').replace("import('./src/app.js')",'loadGame()');
 vm.runInContext(source,context);vm.runInContext("address='wallet-a';principal={address,expiresAt:Date.now()+60000,count:1,rarity:0};enter.hidden=false;",context);
 return{document,dialog,context,resolve,reject,get calls(){return calls;},get reloads(){return reloads;},enter:document.getElementById('enter-holder-game'),shell:document.getElementById('game-shell')};
}
test('holder gateway remains visible and entry is single-flight until the first finished scene is ready',async()=>{
 const x=setup(),pending=x.enter.onclick();assert(x.enter.disabled);assert(x.shell.hidden);assert(x.dialog.open);
 assert.match(x.document.getElementById('gate-status').textContent,/Preparing the forest/);assert.equal(x.dialog.getAttribute('aria-busy'),'true');
 await x.enter.onclick();assert.equal(x.calls,1);
 x.resolve();await pending;assert.equal(x.shell.hidden,false);assert.equal(x.dialog.open,false);assert.equal(x.enter.disabled,false);
});
test('disconnect or wallet change during loading cannot reveal the previous wallet forest',async()=>{
 const x=setup(),pending=x.enter.onclick();vm.runInContext("revision++;lock('Wallet disconnected.');",x.context);
 x.resolve();await pending;assert(x.shell.hidden);assert(x.dialog.open);
 vm.runInContext("address='wallet-b';principal={address,expiresAt:Date.now()+60000,count:1,rarity:0};",x.context);
 await x.enter.onclick();assert.equal(x.reloads,1);assert(x.shell.hidden);
});
test('an expired session stays behind the holder gate after graphics finish',async()=>{
 const x=setup(),pending=x.enter.onclick();vm.runInContext('principal={...principal,expiresAt:0};',x.context);
 x.resolve();await pending;assert(x.shell.hidden);assert(x.dialog.open);assert.match(x.document.getElementById('gate-status').textContent,/session expired/);
});
test('background ownership checks continue during loading without replacing its status, and can still deny entry',async()=>{
 for(const ok of [true,false]){
  let requests=0;const x=setup({fetchImpl:async()=>{
   requests++;const body=ok?{verified:true,address:'wallet-a',expiresAt:Date.now()+60000,count:1,rarity:0}:{error:'NFTree access is no longer available'};
   return{ok,json:async()=>body};
  }});
  const pending=x.enter.onclick(),message=x.document.getElementById('gate-status').textContent;
  await vm.runInContext('refresh()',x.context);assert.equal(requests,1);assert(x.shell.hidden);
  if(ok)assert.equal(x.document.getElementById('gate-status').textContent,message);
  x.resolve();await pending;assert.equal(x.shell.hidden,!ok);
 }
});
test('graphics failure gives a reload action without displaying fallback art or private error details',async()=>{
 const x=setup(),pending=x.enter.onclick();x.reject(Object.assign(new Error('private detail'),{code:'CANOPY_ART_NOT_READY'}));await pending;
 assert(x.shell.hidden);assert(x.dialog.open);assert.equal(x.enter.disabled,false);
 const status=x.document.getElementById('gate-status').textContent;assert.match(status,/graphics could not load/);assert.doesNotMatch(status,/private/);
 const retry=x.document.getElementById('retry-forest-load');assert.equal(retry.hidden,false);retry.onclick();assert.equal(x.reloads,1);
});
