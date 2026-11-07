import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {Game} from '../src/engine.js';
import {PurchaseReview} from '../src/playtest.js';

// Execute the actual application handlers. This regression crosses the lobby,
// management and purchase boundaries that isolated menu tests did not cover.
const source=await readFile('src/app.js','utf8');
const launch=source.slice(source.indexOf('function reviewPurchase('),source.indexOf('\nfunction renderPurchase()'));
const paid=source.slice(source.indexOf('async function reviewPaidPurchase('),source.indexOf('\nasync function applyPaidItem('));
function fixture({paidMode=true,lobby=true,management=true,section='shop',story=false}={}){
 const game=new Game();game.allowPreview();game.tree=10000;
 const dialog={open:false,showModal(){this.open=true;}};const error={hidden:false};
 const calls={quotes:0,payments:0,saves:0};let context;
 const sandbox={game,PurchaseReview,paidMode,lobbyManagement:lobby,storyDialog:{open:story},modeDialog:{open:lobby},helpDialog:{open:management},commandMenu:{section},purchaseDialog:dialog,pendingPurchase:null,paidReview:null,paidInvoice:null,checkoutBusy:false,storageAvailable:true,
  $:id=>{assert.equal(id,'purchase-error');return error;},save:()=>calls.saves++,renderUI:()=>{},renderPurchase:()=>{},renderPaidPurchase:()=>{},renderPaymentHistory:async()=>{},checkoutError:e=>{throw e;},
  quotePaidReview:async()=>{calls.quotes++;context.paidInvoice={id:'quoted-invoice',status:'quoted',amount:'3000000000'};},payments:{pay:async()=>{calls.payments++;throw Error('A click must not submit a wallet payment');}}};
 context=vm.createContext(sandbox);vm.runInContext(launch+'\n'+paid,context);return {context,game,dialog,calls};
}
test('Root Shield from the lobby shop opens review and obtains one quote without charging',async()=>{
 const s=fixture(),before=s.game.snapshot();await s.context.reviewPurchase('shield');
 assert.equal(s.dialog.open,true);assert.equal(s.context.paidReview.kind,'shield');assert.equal(s.context.paidInvoice.status,'quoted');assert.equal(s.calls.quotes,1);assert.equal(s.calls.payments,0);assert.deepEqual(s.game.snapshot(),before);
 await s.context.reviewPurchase('shield');assert.equal(s.calls.quotes,1);assert.equal(s.calls.payments,0);
});
test('preview Root Shield also opens from the lobby shop and requires separate confirmation',()=>{
 const s=fixture({paidMode:false}),before=s.game.snapshot();s.context.reviewPurchase('shield');assert.equal(s.dialog.open,true);assert(s.context.pendingPurchase instanceof PurchaseReview);assert.deepEqual(s.game.snapshot(),before);assert.equal(s.calls.payments,0);
});
test('background lobby and other management sections cannot launch a stale purchase',async()=>{
 for(const options of [{management:false},{section:'cosmetics'},{section:'defenders'},{story:true}]){
  const s=fixture(options);await s.context.reviewPurchase('shield');assert.equal(s.dialog.open,false);assert.equal(s.calls.quotes,0);assert.equal(s.calls.payments,0);
 }
});
test('battlefield shop still opens review while a full shield stays ineligible',async()=>{
 const s=fixture({lobby:false});await s.context.reviewPurchase('shield');assert.equal(s.dialog.open,true);assert.equal(s.calls.quotes,1);
 const full=fixture();full.game.shield=50;await full.context.reviewPurchase('shield');assert.equal(full.dialog.open,false);assert.equal(full.calls.quotes,0);assert.equal(full.calls.payments,0);
});
