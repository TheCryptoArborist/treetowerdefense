import {createPayments} from './payments.mjs';
import {createDAppKit} from '@mysten/dapp-kit-core';
import {SuiGrpcClient} from '@mysten/sui/grpc';
import '@mysten/dapp-kit-core/web';
const kit=createDAppKit({networks:['mainnet'],defaultNetwork:'mainnet',autoConnect:true,storageKey:'canopy-defense-wallet',createClient:network=>new SuiGrpcClient({network,baseUrl:'https://fullnode.mainnet.sui.io:443'})});
const dialog=document.getElementById('access-dialog'),status=document.getElementById('gate-status'),verifyButton=document.getElementById('verify-nftree'),enter=document.getElementById('enter-holder-game'),disconnect=document.getElementById('disconnect-wallet'),shell=document.getElementById('game-shell');
document.querySelector('mysten-dapp-kit-connect-button').instance=kit;
let principal=null,address=null,busy=false,opening=false,revision=0,loaded=false,startedWallet=null,restoring=false,reconnecting=false,entryAttempted=false;
const retryForest=document.getElementById('retry-forest-load');
retryForest.onclick=()=>location.reload();
const listeners=new Set();
window.canopyPayments=createPayments({kit,account:()=>principal});
function paintGate(){
 const stage=principal?2:address?1:0;
 const checking=restoring||reconnecting,preparing=opening&&!!principal||checking;
 dialog.dataset.stage=preparing?'loading':principal?'ready':busy?'verifying':address?'verify':'connect';
 dialog.dataset.loading=String(preparing);dialog.setAttribute('aria-busy',String(preparing));
 enter.disabled=opening||checking;enter.textContent=opening||checking?'Preparing the forest…':'Enter the forest →';
 verifyButton.disabled=busy||checking||!address;
 document.querySelectorAll('[data-gate-step]').forEach((step,i)=>{
  step.classList.toggle('complete',i<stage);step.classList.toggle('current',i===stage);
  if(i===stage)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
  step.querySelector('b').textContent=i<stage?'✓':String(i+1).padStart(2,'0');
 });
 document.getElementById('gate-stage-label').textContent=checking?'RESTORING YOUR VERIFIED SESSION':preparing?'HOLDER VERIFIED · PREPARING YOUR FOREST':principal?'HOLDER VERIFIED · FOREST UNLOCKED':busy?'AWAITING YOUR SIGN-IN APPROVAL':address?'WALLET CONNECTED · ONE STEP TO GO':'YOUR ADVENTURE STARTS HERE';
 document.getElementById('access-title').textContent=checking?'Returning to your forest…':preparing?'Preparing the forest…':principal?'Your forest awaits.':address?'Claim your place in the canopy.':'Answer the call of the canopy.';
 verifyButton.hidden=!!principal||checking;
}
const notify=()=>{paintGate();listeners.forEach(fn=>fn(principal));};
const show=()=>{if(!dialog.open)dialog.showModal();};
const lock=text=>{principal=null;restoring=false;enter.hidden=true;shell.hidden=true;status.textContent=text;notify();show();};
const post=async body=>{const r=await fetch('./api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not verify NFTree access');return d;};
const validate=d=>{if(d.verified!==true||d.address!==address||!Number.isSafeInteger(d.count)||d.count<1||!Number.isInteger(d.rarity)||d.rarity<0||d.rarity>5||!Number.isFinite(d.expiresAt)||d.expiresAt<=Date.now())throw Error('A valid holder session was not returned');return Object.freeze({address:d.address,rarity:d.rarity,expiresAt:d.expiresAt,count:d.count});};
async function refresh(){
 if(!address||busy)return;const stamp=revision;
 if(!loaded&&!opening&&!entryAttempted){restoring=true;status.textContent='Restoring your verified session…';paintGate();}
 try{
  const r=await fetch('./api/access',{cache:'no-store',credentials:'same-origin'});const d=await r.json();if(stamp!==revision)return;if(!r.ok)throw Error(d.error||'Verify your NFTree to enter');principal=validate(d);
  restoring=false;if(!opening)status.textContent=`Verified holder · ${principal.count} NFTree${principal.count===1?'':'s'}. Ready to defend.`;enter.hidden=false;notify();
  // A server-verified cookie and the reconnected wallet authorize returning.
  // No browser flag, cached ownership claim, signature or payment is needed.
  if(!loaded&&!opening&&!entryAttempted)await enter.onclick();
 }catch(e){if(stamp===revision)lock(e.message);}
 finally{if(stamp===revision){restoring=false;paintGate();}}
}
verifyButton.onclick=async()=>{
 if(!address||busy)return;busy=true;verifyButton.disabled=true;paintGate();const stamp=revision;
 try{
  status.textContent='Preparing your sign-in message…';const c=await post({action:'challenge',address});
  const expected=['Canopy Defense NFTree access','Origin: '+location.origin,'Network: sui:mainnet','Wallet: '+address,'Nonce: '+c.nonce,'Expires: '+new Date(c.expiresAt).toISOString(),'Sign in only. No transaction, token transfer, or token approval.'].join('\n');
  if(c.address!==address||c.origin!==location.origin||!/^[a-f0-9]{64}$/.test(c.nonce)||c.expiresAt<=Date.now()||c.expiresAt>Date.now()+360000||c.message!==expected||stamp!==revision)throw Error('Invalid or expired sign-in message');
  document.getElementById('sign-in-message').textContent=c.message;document.getElementById('sign-in-details').open=true;status.textContent='Approve the displayed sign-in message in your wallet. This has no transaction or payment.';
  const signed=await kit.signPersonalMessage({message:new TextEncoder().encode(c.message)});if(stamp!==revision)throw Error('Wallet changed. Verify again.');
  const d=await post({action:'verify',address,nonce:c.nonce,signature:signed.signature});if(stamp!==revision){await post({action:'logout'});return;}principal=validate(d);enter.hidden=false;status.textContent=`NFTree holder verified · ${d.count} NFTree${d.count===1?'':'s'}.`;notify();
 }catch(e){if(stamp===revision)lock(e.message||'Sign-in was cancelled. Please retry.');}finally{busy=false;verifyButton.disabled=!address;paintGate();}
};
enter.onclick=async()=>{
 if(opening)return;
 if(!principal||principal.expiresAt<=Date.now())return lock('Your session expired. Verify your NFTree again.');
 // Reload on wallet change so one wallet never sees another wallet's local progress.
 if(startedWallet&&startedWallet!==principal.address){location.reload();return;}
 const stamp=revision,entryWallet=principal.address;entryAttempted=true;opening=true;retryForest.hidden=true;paintGate();
 try{
  if(!loaded){startedWallet=entryWallet;status.textContent='Preparing the forest… Loading battlefield graphics.';await import('./src/app.js');loaded=true;}
  if(stamp!==revision||!principal||principal.address!==entryWallet)return;
  if(principal.expiresAt<=Date.now())return lock('Your session expired. Verify your NFTree again.');
  shell.hidden=false;dialog.close();notify();
 }catch(error){
  if(stamp===revision){lock(error?.code==='CANOPY_CHECKOUT_DISABLED'?'Wallet checkout is temporarily unavailable. Reload to reconnect; saved progress is retained.':error?.code==='CANOPY_ART_NOT_READY'?'Some forest graphics could not load. Reload to try again.':'The game could not load. Reload to try again.');retryForest.hidden=false;}
 }finally{opening=false;paintGate();}
};
disconnect.onclick=async()=>{revision++;lock('Wallet disconnected. Connect an NFTree holder wallet to enter.');await post({action:'logout'}).catch(()=>{});await kit.disconnectWallet();};
dialog.addEventListener('cancel',e=>e.preventDefault());
dialog.addEventListener('close',()=>{if(!principal||!loaded||shell.hidden)show();});
document.getElementById('preview-button').addEventListener('click',show);
window.canopyAccess=Object.freeze({get account(){return principal;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},open:show});
kit.stores.$connection.subscribe(c=>{
 reconnecting=!!(c.isConnecting||c.isReconnecting);
 const next=c.isConnected&&c.account?.chains?.includes('sui:mainnet')?c.account.address:null;
 if(next===address){if(reconnecting)status.textContent='Reconnecting your wallet…';paintGate();return;}address=next;revision++;verifyButton.disabled=!address;disconnect.hidden=!address;
 document.getElementById('gate-wallet').textContent=address?`${c.wallet?.name||'Sui wallet'} · ${address.slice(0,8)}…${address.slice(-6)}`:'Connect a Sui Mainnet wallet to begin.';
 lock(address?'Wallet connected. Verify your NFTree to enter.':'Connect an NFTree holder wallet to enter.');
 if(address)void refresh();else if(!reconnecting)post({action:'logout'}).catch(()=>{});
});
setInterval(()=>{if(principal&&principal.expiresAt<=Date.now())lock('Your session expired. Verify your NFTree again.');else if(principal&&!document.hidden)refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
status.textContent=restoring?'Restoring your verified session…':reconnecting?'Reconnecting your wallet…':'Connect an NFTree holder wallet to enter.';
paintGate();if(dialog.open)dialog.close();show();
