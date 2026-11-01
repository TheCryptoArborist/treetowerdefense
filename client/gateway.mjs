import {createDAppKit} from '@mysten/dapp-kit-core';
import {SuiGrpcClient} from '@mysten/sui/grpc';
import '@mysten/dapp-kit-core/web';
const kit=createDAppKit({networks:['mainnet'],defaultNetwork:'mainnet',autoConnect:true,storageKey:'canopy-defense-wallet',createClient:network=>new SuiGrpcClient({network,baseUrl:'https://fullnode.mainnet.sui.io:443'})});
const dialog=document.getElementById('access-dialog'),status=document.getElementById('gate-status'),verifyButton=document.getElementById('verify-nftree'),enter=document.getElementById('enter-holder-game'),disconnect=document.getElementById('disconnect-wallet'),shell=document.getElementById('game-shell');
document.querySelector('mysten-dapp-kit-connect-button').instance=kit;
let principal=null,address=null,busy=false,revision=0,loaded=false,startedWallet=null;
const listeners=new Set();
const notify=()=>listeners.forEach(fn=>fn(principal));
const show=()=>{if(!dialog.open)dialog.showModal();};
const lock=text=>{principal=null;enter.hidden=true;shell.hidden=true;status.textContent=text;notify();show();};
const post=async body=>{const r=await fetch('./api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not verify NFTree access');return d;};
const validate=d=>{if(d.verified!==true||d.address!==address||!Number.isSafeInteger(d.count)||d.count<1||!Number.isInteger(d.rarity)||d.rarity<0||d.rarity>5||!Number.isFinite(d.expiresAt)||d.expiresAt<=Date.now())throw Error('A valid holder session was not returned');return Object.freeze({address:d.address,rarity:d.rarity,expiresAt:d.expiresAt,count:d.count});};
async function refresh(){
 if(!address||busy)return;const stamp=revision;try{const r=await fetch('./api/access',{cache:'no-store',credentials:'same-origin'});const d=await r.json();if(stamp!==revision)return;if(!r.ok)throw Error(d.error||'Verify your NFTree to enter');principal=validate(d);status.textContent=`Verified holder · ${principal.count} NFTree${principal.count===1?'':'s'}. Ready to defend.`;enter.hidden=false;notify();}catch(e){if(stamp===revision)lock(e.message);}
}
verifyButton.onclick=async()=>{
 if(!address||busy)return;busy=true;verifyButton.disabled=true;const stamp=revision;
 try{
  status.textContent='Preparing your sign-in message…';const c=await post({action:'challenge',address});
  const expected=['Canopy Defense NFTree access','Origin: '+location.origin,'Network: sui:mainnet','Wallet: '+address,'Nonce: '+c.nonce,'Expires: '+new Date(c.expiresAt).toISOString(),'Sign in only. No transaction, token transfer, or token approval.'].join('\n');
  if(c.address!==address||c.origin!==location.origin||!/^[a-f0-9]{64}$/.test(c.nonce)||c.expiresAt<=Date.now()||c.expiresAt>Date.now()+360000||c.message!==expected||stamp!==revision)throw Error('Invalid or expired sign-in message');
  document.getElementById('sign-in-message').textContent=c.message;document.getElementById('sign-in-details').open=true;status.textContent='Approve the displayed sign-in message in your wallet. This has no transaction or payment.';
  const signed=await kit.signPersonalMessage({message:new TextEncoder().encode(c.message)});if(stamp!==revision)throw Error('Wallet changed. Verify again.');
  const d=await post({action:'verify',address,nonce:c.nonce,signature:signed.signature});if(stamp!==revision){await post({action:'logout'});return;}principal=validate(d);enter.hidden=false;status.textContent=`NFTree holder verified · ${d.count} NFTree${d.count===1?'':'s'}.`;notify();
 }catch(e){if(stamp===revision)lock(e.message||'Sign-in was cancelled. Please retry.');}finally{busy=false;verifyButton.disabled=!address;}
};
enter.onclick=async()=>{
 if(!principal||principal.expiresAt<=Date.now())return lock('Your session expired. Verify your NFTree again.');
 // Reload on wallet change so one wallet never sees another wallet's local progress.
 if(loaded&&startedWallet!==principal.address){location.reload();return;}
 if(!loaded){startedWallet=principal.address;try{status.textContent='Opening your forest…';await import('./src/app.js');loaded=true;}catch{lock('The game could not load. Verify again or refresh this page.');return;}}
 shell.hidden=false;dialog.close();notify();
};
disconnect.onclick=async()=>{revision++;lock('Wallet disconnected. Connect an NFTree holder wallet to enter.');await post({action:'logout'}).catch(()=>{});await kit.disconnectWallet();};
dialog.addEventListener('cancel',e=>e.preventDefault());
window.canopyAccess=Object.freeze({get account(){return principal;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},open:show});
kit.stores.$connection.subscribe(c=>{
 const next=c.isConnected&&c.account?.chains?.includes('sui:mainnet')?c.account.address:null;
 if(next===address)return;address=next;revision++;verifyButton.disabled=!address;disconnect.hidden=!address;
 document.getElementById('gate-wallet').textContent=address?`${c.wallet?.name||'Sui wallet'} · ${address.slice(0,8)}…${address.slice(-6)}`:'Connect a Sui Mainnet wallet to begin.';
 lock(address?'Wallet connected. Verify your NFTree to enter.':'Connect an NFTree holder wallet to enter.');
 if(address)refresh();else post({action:'logout'}).catch(()=>{});
});
setInterval(()=>{if(principal&&principal.expiresAt<=Date.now())lock('Your session expired. Verify your NFTree again.');else if(principal&&!document.hidden)refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
if(dialog.open)dialog.close();show();
