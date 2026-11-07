import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {parseHTML} from 'linkedom';
function setup({fetchImpl=()=>{throw Error('Unexpected request');},initialPrincipal=true}={}){
 const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));
 const dialog=document.getElementById('access-dialog');dialog.open=true;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 let resolve,reject,calls=0,reloads=0,connection;const loading=new Promise((a,b)=>{resolve=a;reject=b;});
 const context=vm.createContext({document,window,location:{origin:'https://tree-token.xyz',reload(){reloads++;}},setInterval(){},Date,TextEncoder,
  createDAppKit:()=>({stores:{$connection:{subscribe(fn){connection=fn;}}}}),SuiGrpcClient:class{},createPayments:()=>({}),fetch:fetchImpl,
  loadGame:()=>{calls++;return loading;}});
 const source=fs.readFileSync('client/gateway.mjs','utf8').replace(/^import .*;\r?\n/gm,'').replace("import('./src/app.js')",'loadGame()');
 vm.runInContext(source,context);if(initialPrincipal)vm.runInContext("address='wallet-a';principal={address,expiresAt:Date.now()+60000,count:1,rarity:0};enter.hidden=false;",context);
 return{document,dialog,context,resolve,reject,connect:c=>connection(c),get calls(){return calls;},get reloads(){return reloads;},enter:document.getElementById('enter-holder-game'),shell:document.getElementById('game-shell')};
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
const connected=address=>({isConnecting:false,isConnected:true,account:{address,chains:['sui:mainnet']},wallet:{name:'Test wallet'}});
const holder=address=>({verified:true,address,count:1,rarity:0,expiresAt:Date.now()+60000});
test('wallet auto-reconnect restores a valid server session and enters once without Verify or Enter clicks',async()=>{
 let reads=0;const x=setup({initialPrincipal:false,fetchImpl:async(_url,options)=>{assert.equal(options.method,undefined);reads++;return{ok:true,json:async()=>holder('wallet-a')};}});
 for(const connecting of [{isConnecting:true,isConnected:false},{isReconnecting:true,isConnected:false}]){x.connect(connecting);assert.equal(x.dialog.getAttribute('aria-busy'),'true');assert(x.document.getElementById('verify-nftree').hidden);}
 x.connect(connected('wallet-a'));await new Promise(setImmediate);assert.equal(reads,1);assert.equal(x.calls,1);assert(x.shell.hidden);assert(x.dialog.open);
 await x.enter.onclick();assert.equal(x.calls,1);x.resolve();await new Promise(setImmediate);assert.equal(x.shell.hidden,false);assert.equal(x.dialog.open,false);
 await vm.runInContext('refresh()',x.context);assert.equal(x.calls,1);assert.equal(x.dialog.open,false);
});
test('expired, revoked and wrong-wallet cookies require sign-in and never auto-load private gameplay',async()=>{
 for(const body of [{error:'Session expired'},{...holder('wallet-a'),expiresAt:0},{...holder('wallet-a'),count:0},holder('wallet-b')]){
  const x=setup({initialPrincipal:false,fetchImpl:async()=>({ok:!body.error,json:async()=>body})});x.connect(connected('wallet-a'));await new Promise(setImmediate);assert.equal(x.calls,0);assert(x.shell.hidden);assert(x.dialog.open);assert.equal(x.document.getElementById('verify-nftree').hidden,false);
 }
});
test('disconnect during session restoration ignores late verification and never exposes the old forest',async()=>{
 let reply;const x=setup({initialPrincipal:false,fetchImpl:async(_url,options)=>options.method==='POST'?{ok:true,json:async()=>({})}:new Promise(resolve=>reply=resolve)});
 x.connect(connected('wallet-a'));x.connect({isConnected:false,isConnecting:false});reply({ok:true,json:async()=>holder('wallet-a')});await new Promise(setImmediate);assert.equal(x.calls,0);assert(x.shell.hidden);assert(x.dialog.open);
});
test('automatic restoration keeps ownership checks active while artwork loads and does not auto-retry failed loading',async()=>{
 let allowed=true;const x=setup({initialPrincipal:false,fetchImpl:async()=>({ok:allowed,json:async()=>allowed?holder('wallet-a'):{error:'Access revoked'}})});
 x.connect(connected('wallet-a'));await new Promise(setImmediate);assert.equal(x.calls,1);allowed=false;await vm.runInContext('refresh()',x.context);x.resolve();await new Promise(setImmediate);assert(x.shell.hidden);assert(x.dialog.open);
 const failed=setup({initialPrincipal:false,fetchImpl:async()=>({ok:true,json:async()=>holder('wallet-a')})});failed.connect(connected('wallet-a'));await new Promise(setImmediate);failed.reject(Object.assign(Error('art'),{code:'CANOPY_ART_NOT_READY'}));await new Promise(setImmediate);await vm.runInContext('refresh()',failed.context);assert.equal(failed.calls,1);assert(failed.shell.hidden);
});
