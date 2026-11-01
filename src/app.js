import { Game, WIDTH, HEIGHT, PADS, TOWERS, RARITIES, STYLES, PRICES, CHAPTERS, GROWTH_NAMES, TARGET_MODES, UNLOCKS, HAUNTED_GROVE, HARVEST_CANOPY } from './engine.js';

import { paintTree as shapeTree, paintLifeTree, paintPest, paintCombatEffects, paintBackdrop, paintShot, paintBuildSite, loadDefenderArt, getDefenderArtStatus, loadEnvironmentArt, getEnvironmentArtStatus, loadAimArt, getAimArtStatus, loadStructureArt, getStructureArtStatus, getGuardianShotOrigin, paintSeasonLook, paintHauntedBackdrop, paintHarvestBackdrop, paintHarvestLook } from './art.js';
import { scoutWave, starterTip, PurchaseReview, battleReport } from './playtest.js';
import { CombatFeedback, bossStatus } from './combat.js';
import {applyEntitlement} from './paid.js';
import { GuardianAiming, GUARDIAN_SCALE } from './aiming.js';

const $ = id => document.getElementById(id);
const holder=window.canopyAccess?.account;
if(!holder)throw Error('Verified NFTree access is required');
const payments=window.canopyPayments;
const initialPayments=await payments.status();
const paidMode=initialPayments.enabled===true;
const paidSavePrefix=location.pathname==='/play/canopy-defense/checkout-test/'?'canopy-defense-checkout-test-v1:':'canopy-defense-paid-v1:';
const STORAGE_KEY = (paidMode?paidSavePrefix:'canopy-defense-wallet-v1:')+holder.address;
let paidRunId=null,appliedPayments=new Set(),checkoutBusy=false,paidInvoice=null;
let paidReview=null;
let game = new Game();
const feedback = new CombatFeedback();
const aiming = new GuardianAiming();
let storageAvailable = true;
let saved = null;
try {
  saved = localStorage.getItem(STORAGE_KEY);
  if(!paidMode && !saved && !localStorage.getItem('canopy-defense-preview-migrated-to')){
    const legacy=localStorage.getItem('canopy-defense-preview-v1');
    if(legacy && Game.restore(JSON.parse(legacy))){saved=legacy;localStorage.setItem(STORAGE_KEY,legacy);localStorage.setItem('canopy-defense-preview-migrated-to',holder.address);}
  }
} catch { storageAvailable = false; }
try {
  if (saved) {
    const parsed=JSON.parse(saved);
    if(paidMode){paidRunId=parsed.runId;appliedPayments=new Set(Array.isArray(parsed.applied)?parsed.applied:[]);}
    const restored = Game.restore(paidMode?parsed.game:parsed);
    if (restored) game = restored;
    else game.message = 'An unreadable preview save was skipped. Your fresh forest is ready.';
  }
} catch { game.message = 'An unreadable preview save was skipped. Your fresh forest is ready.'; }
if(paidMode&&!saved){try{const legacy=localStorage.getItem('canopy-defense-wallet-v1:'+holder.address);if(legacy){const restored=Game.restore(JSON.parse(legacy));if(restored)game=restored;}}catch{}}
game.access=false;game.allowPreview(holder.rarity);
if(paidMode){if(!paidRunId)paidRunId=(await payments.newRun()).id;loadPurchasedGrowth(initialPayments);game.tree=Number((await payments.balance())/1000000n);}

if(!paidMode)game.enableCollection();
function loadPurchasedGrowth(status){
 const ok=status.collection?.version===1?game.applyPurchasedCollection(status.growth,status.collection.defenders):!game.collection&&game.applyPurchasedGrowth(status.growth);
 if(!ok)throw Error('Defender collection could not be loaded. Reconnect before purchasing.');
}
let deploymentChoice={type:null,slot:null};
window.canopyAccess.subscribe(account=>{if(!account||account.address!==holder.address){if(game.phase==='running')game.pause();game.access=false;}else{game.allowPreview(account.rarity);}renderUI();});
let selectedType = 'pine';
let selectedTower = null;
let hoveredPad = null;
let particles = [];
let lastTime = performance.now();
let lastSave = 0;
let lastUI = 0;
let inspectorSignature = null;
const canvas = $('battlefield');
const ctx = canvas.getContext('2d');
const accessDialog = $('access-dialog');
const helpDialog = $('help-dialog');
const purchaseDialog = $('purchase-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GUIDE_KEY = 'canopy-defense-guide-v1';
let guideStatus = saved && (game.wave > 0 || game.towers.length || game.forestRank) ? 'dismissed' : 'active';
let guideSignature = '', scoutSignature = '', showGuideCompletion = false, pendingPurchase = null;
try {
  const preference = localStorage.getItem(GUIDE_KEY+':'+holder.address);
  if (['active','dismissed','complete'].includes(preference)) guideStatus = preference;
} catch { /* The guide works for this session even when storage is unavailable. */ }
function saveGuide() {
  try { localStorage.setItem(GUIDE_KEY+':'+holder.address, guideStatus); } catch { /* Session-only preference. */ }
}
function closeGuide() { guideStatus = 'dismissed'; showGuideCompletion = false; saveGuide(); renderUI(); }
$('skip-guide').addEventListener('click', closeGuide);
function focusControl(control) {
  control.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' }); control.focus({ preventScroll: true });
}
$('guide-action').addEventListener('click', () => {
  const tip = starterTip(game);
  if (tip.tower) {
    selectedType = tip.tower; selectedTower = null;
    document.querySelector('.build-sites').open = true; renderUI();
    focusControl(document.querySelector(`[data-pad="${tip.pad}"]`));
  } else if (tip.key === 'launch') focusControl($('wave-button'));
  else if (tip.key === 'recover') newRun();
  else if (tip.key === 'done') closeGuide();
  else if (game.phase === 'paused') act(() => game.pause());
  else focusControl(canvas);
});

function save() {
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(paidMode?{game:game.snapshot(),runId:paidRunId,applied:[...appliedPayments]}:game.snapshot())); $('save-status').textContent = 'Preview saved on this device'; }
  catch { storageAvailable = false; $('save-status').textContent = 'Save unavailable · keep this tab open'; }
}
for (const [i, type] of Object.keys(TOWERS).entries()) {
  const d = TOWERS[type]; const button = document.createElement('button');
  button.className = 'tower-card'; button.dataset.tower = type;
  button.setAttribute('aria-label', `${d.name}: ${d.role}, ${d.cost} Sap. ${d.description}`);
  button.innerHTML = `<span class="tree-icon"><canvas width="144" height="176" aria-hidden="true"></canvas></span><span><strong>${d.name}</strong><small class="roster-role">${d.role}</small><b>${d.cost} SAP</b><span class="roster-progress"></span></span><kbd>${i + 1}</kbd>`;
  button.addEventListener('click', () => selectDefender(type));
  shapeTree(button.querySelector('canvas').getContext('2d'), type, 72, 150, 1.08, 0, game.forest.levels[type]);
  $('tower-cards').append(button);
}
for (const [i, style] of STYLES.entries()) {
  const button = document.createElement('button'); button.className = 'style-card'; button.dataset.style = i;
  button.setAttribute('aria-label', `${RARITIES[i]}: ${style.name}. ${style.detail}`);
  button.innerHTML = `<canvas width="128" height="128" aria-hidden="true"></canvas><strong>${style.name}</strong><small>${RARITIES[i]}</small><span class="lock" aria-hidden="true">◆</span>`;
  shapeTree(button.querySelector('canvas').getContext('2d'), 'oak', 64, 100, 1, i);
  button.addEventListener('click', () => {
    if (game.setStyle(i, selectedTower)) { game.message = `${style.name} appearance selected. Combat stats stay the same.`; save(); renderUI(); }
  }); $('style-grid').append(button);
}
for (let i = 0; i < PADS.length; i++) {
  const button = document.createElement('button'); button.dataset.pad = i;
  button.addEventListener('click', () => choosePad(i)); $('pad-buttons').append(button);
}
function selectDefender(type) {
  if (!game.access || !['build','running','paused'].includes(game.phase)) return;
  if (!game.isUnlocked(type)) { game.message = `${TOWERS[type].name} locked. ${UNLOCKS[type].label}.`; renderUI(); return; }
  selectedType = type; selectedTower = null; deploymentChoice={type,slot:null};
  game.message = `${TOWERS[type].name} selected. Choose an empty build site (${TOWERS[type].cost} Sap).`;
  renderUI();
}
function dName(tower) { return TOWERS[tower.type].name; }
function choosePad(pad) {
  if (!game.access) { accessDialog.showModal(); return; }
  const existing = game.towers.find(t => t.pad === pad);
  if (existing) { selectedTower = existing.id; selectedType = null; game.message = `${TOWERS[existing.type].name} selected. Upgrade or choose a new appearance.`; }
  else if (selectedType) { const tower = game.place(selectedType, pad, deploymentChoice.type===selectedType?deploymentChoice.slot:null); if (tower) { selectedTower = tower.id; game.message = `${dName(tower)} planted. Upgrade this defender or choose another site.`; } }
  else game.message = 'Choose a defender from the planting menu first.';
  save(); renderUI();
}
function pointerPad(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * WIDTH / rect.width;
  const y = (event.clientY - rect.top) * HEIGHT / rect.height;
  const matches = game.map.pads.map(([px, py], i) => ({ i, d: Math.hypot(px - x, py - y) })).sort((a, b) => a.d - b.d);
  return matches[0].d < 45 ? matches[0].i : null;
}
canvas.addEventListener('pointermove', event => { hoveredPad = pointerPad(event); canvas.style.cursor = hoveredPad !== null ? 'pointer' : 'default'; });
canvas.addEventListener('pointerleave', () => { hoveredPad = null; });
canvas.addEventListener('pointerup', event => { const pad = pointerPad(event); if (pad !== null) choosePad(pad); });
function act(action) { action(); save(); renderUI(); }
$('wave-button').addEventListener('click', () => act(() => game.startWave()));
$('pause-button').addEventListener('click', () => act(() => game.pause()));
document.querySelectorAll('[data-supply]').forEach(button => button.addEventListener('click', () => reviewPurchase(button.dataset.supply)));
$('preview-button').addEventListener('click', () => { if(game.phase==='running')game.pause();window.canopyAccess.open();renderUI(); });

$('help-button').addEventListener('click', () => { if (game.phase === 'running') game.pause(); helpDialog.showModal(); renderUI(); });
$('continue-button').addEventListener('click', () => reviewPurchase('continue'));
function reviewPurchase(kind, towerId = null) {
  if(paidMode)return reviewPaidPurchase(kind,towerId);
  if (purchaseDialog.open) return;
  pendingPurchase = new PurchaseReview(game, kind, towerId);
  if (!pendingPurchase.details().available) { game.message = pendingPurchase.details().reason; pendingPurchase = null; renderUI(); return; }
  renderPurchase(); purchaseDialog.showModal();
}
function renderPurchase() {
  if(paidMode){renderPaidPurchase();return;}
  if (!pendingPurchase) return;
  const quote = pendingPurchase.details();
  if (quote.title) $('purchase-title').textContent = quote.title;
  if (quote.description) $('purchase-description').textContent = quote.description;
  $('purchase-cost').textContent = quote.cost?.toLocaleString() ?? '—';
  $('purchase-balance').textContent = game.tree.toLocaleString();
  $('purchase-after').textContent = quote.balanceAfter >= 0 ? quote.balanceAfter.toLocaleString() : 'Unavailable';
  $('purchase-error').hidden = quote.available;
  $('purchase-error').textContent = quote.reason;
  $('confirm-purchase').disabled = !quote.available;
}
$('cancel-purchase').addEventListener('click', () => purchaseDialog.close());
purchaseDialog.addEventListener('cancel',event=>{if(checkoutBusy)event.preventDefault();});
purchaseDialog.addEventListener('close', () => { if(checkoutBusy){purchaseDialog.showModal();return;}pendingPurchase = null;if(!checkoutBusy){paidReview=null;paidInvoice=null;}renderUI(); });
$('confirm-purchase').addEventListener('click', () => {
  if(paidMode){confirmPaidPurchase();return;}
  if (!pendingPurchase || !purchaseDialog.open) return;
  if (pendingPurchase.confirm()) { purchaseDialog.close(); save(); renderUI(); }
  else renderPurchase();
});
function checkoutError(error){$('purchase-error').hidden=false;$('purchase-error').textContent=error.message||'Check purchase history before retrying payment.';game.message=$('purchase-error').textContent;renderUI();}
function renderPaidPurchase(){
 if(!paidReview)return;
 $('purchase-title').textContent=paidReview.title;$('purchase-description').textContent=paidReview.description;
 $('purchase-cost').textContent=paidInvoice?Number(BigInt(paidInvoice.amount)/1000000n).toLocaleString():'Loading…';
 $('purchase-balance').textContent=game.tree.toLocaleString();$('purchase-after').textContent=paidInvoice?Math.max(0,game.tree-Number(BigInt(paidInvoice.amount)/1000000n)).toLocaleString():'—';
 $('confirm-purchase').disabled=checkoutBusy||!paidInvoice||paidInvoice.status!=='quoted';$('cancel-purchase').disabled=checkoutBusy;
}
async function reviewPaidPurchase(kind,towerId){
 if(purchaseDialog.open||checkoutBusy)return;
 if(!storageAvailable){game.message='Enable browser storage before using paid run purchases.';renderUI();return;}
 const review=new PurchaseReview(game,kind,towerId);const details=review.details();if(!details.available){game.message=details.reason;renderUI();return;}
 paidReview={kind,towerId,...details};paidInvoice=null;$('purchase-error').hidden=true;purchaseDialog.showModal();renderPaidPurchase();checkoutBusy=true;
 try{save();const tower=game.towers.find(t=>t.id===towerId);paidInvoice=await payments.quote(kind==='upgrade'?{product:'growth',species:tower.type,...(game.collection?{defenderSlot:tower.defenderSlot}:{})}:{product:kind,runId:paidRunId});if(paidInvoice.status!=='quoted')throw Error('A recorded payment already exists. Use Purchase history to recover it.');}
 catch(error){checkoutError(error);}finally{checkoutBusy=false;renderPaidPurchase();}
}
async function applyPaidItem(item){
 if(item.wallet!==holder.address)throw Error('Wrong wallet entitlement');
 if(item.product.startsWith('growth:')){const status=await payments.status();loadPurchasedGrowth(status);appliedPayments.add(item.id);}
 else{
  if(item.run_id!==paidRunId)throw Error('This item belongs to an earlier run. Its payment is recorded in history.');
  if(!appliedPayments.has(item.id)){
   const eligible=item.product==='continue'?game.phase==='defeat':game.canUseSupply(item.product);
   if(!eligible)throw Error('Purchase recorded. Recover it when this run can use the item.');
   await payments.consume(item.id,paidRunId);
   if(!applyEntitlement(game,item,{wallet:holder.address,runId:paidRunId,applied:appliedPayments}))throw Error('Purchase recorded. Recover it from history when eligible.');
  }
 }
 save();inspectorSignature=null;game.tree=Number((await payments.balance())/1000000n);renderUI();
}
async function confirmPaidPurchase(){
 if(checkoutBusy||!paidInvoice||paidInvoice.status!=='quoted')return;checkoutBusy=true;renderPaidPurchase();
 try{const item=await payments.pay(paidInvoice);await applyPaidItem(item);checkoutBusy=false;purchaseDialog.close();paidReview=null;paidInvoice=null;}
 catch(error){checkoutError(error);}finally{checkoutBusy=false;renderPaidPurchase();await renderPaymentHistory();}
}
async function recoverPaidPurchase(id,resume=false){
 if(checkoutBusy)return;checkoutBusy=true;
 try{const item=await (resume?payments.resume(id):payments.recover(id));await applyPaidItem(item);game.message='Recorded purchase recovered.';}
 catch(error){game.message=error.message;}
 finally{checkoutBusy=false;renderUI();await renderPaymentHistory();}
}
async function renderPaymentHistory(){
 if(!paidMode)return;
 const list=$('payment-history-list');
 try{
  const status=await payments.status();list.replaceChildren();
  for(const row of status.invoices.slice(0,20)){
   const item=document.createElement('div');item.className='payment-history-row';
   const text=document.createElement('p');text.textContent=`${row.product}${row.species?' · '+row.species+(row.defenderSlot!=null?' #'+(row.defenderSlot+1):' · legacy species purchase'):''} · ${row.status}${row.runId&&row.runId!==paidRunId?' · earlier run':''}`;item.append(text);
   const button=(label,action)=>{const b=document.createElement('button');b.className='secondary';b.textContent=label;b.disabled=checkoutBusy;b.onclick=action;item.append(b);};
   if(row.status==='bound'){
    button('Check payment',()=>recoverPaidPurchase(row.id));
    button('Submit recorded payment',()=>{if(confirm('Submit the exact transaction you already signed? This reuses the same transaction and cannot create a second payment.'))recoverPaidPurchase(row.id,true);});
    button('Resolve failed transaction',async()=>{try{await payments.reconcile(row.id);game.message='Finalized failed transaction resolved. You can create a fresh checkout.';}catch(error){game.message=error.message;}renderUI();await renderPaymentHistory();});
   }
   if(row.status==='paid'&&!appliedPayments.has(status.entitlements.find(e=>e.invoice_id===row.id)?.id))button('Recover purchase',()=>recoverPaidPurchase(row.id));
   if(row.status==='quoted')button('Cancel unpaid quote',async()=>{try{await payments.cancel(row.id);}catch(error){game.message=error.message;}await renderPaymentHistory();});
   list.append(item);
  }
  if(!status.invoices.length)list.textContent='No TREE purchases yet.';
 }catch(error){list.textContent=error.message;}
}
if(paidMode){
 document.querySelector('.banner-detail').textContent='Sap plants defenders · TREE buys upgrades & supplies · SUI is network gas only';
 $('currency-tree-note').textContent='Real TREE is spent only after wallet approval. Each numbered defender’s level stays with your wallet; supplies and continues belong to this run. SUI is separate network gas, not an entry fee.';
 document.querySelector('#purchase-dialog .eyebrow').textContent='TREE WALLET PURCHASE';
 document.querySelector('#purchase-dialog dt').textContent='Cost · TREE';
 $('confirm-purchase').textContent='Pay with wallet';
 $('purchase-notice').textContent='This transfers real TREE to the recipient shown above. SUI network gas is separate. Battle waits during checkout. If interrupted, check purchase history before paying again.';
 $('purchase-recipient').hidden=false;$('purchase-recipient').textContent='TREE recipient: 0x6f1020c2fd6c91129f7cb5e0d651295e87f7245f96b7d090715c89b38197e77f';
 $('tree-value').parentElement.querySelector('.mini-tag').textContent='WALLET';
 $('payment-history').hidden=false;$('refresh-payment-history').onclick=renderPaymentHistory;
 $('reset-button').textContent='Fresh battle';
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const node=walker.currentNode;node.textContent=node.textContent.replace(/preview TREE/g,'TREE').replace(/PREVIEW TREE/g,'WALLET TREE').replace(/TREE balances and prices are simulated\./g,'TREE purchases use your wallet.').replace(/TREE supplies, growth and continues use simulated funds\./g,'TREE supplies, growth and continues use your wallet.');}
 renderPaymentHistory();
}

async function newRun() {
  if(checkoutBusy)return false;
  if (game.wave > 0 && !['victory', 'defeat'].includes(game.phase) && !confirm('Start a fresh run? This clears your current battlefield. Your permanent defender growth and chapter progress are kept.')) return false;
  if(paidMode){paidRunId=(await payments.newRun()).id;appliedPayments=new Set();}
  game.newRun(); feedback.clear(); aiming.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; showGuideCompletion = false; save(); renderUI();
  return true;
}
$('guided-run-button').addEventListener('click', async() => {
  if (!await newRun()) return;
  game.chooseChapter(0);save();
  guideStatus = 'active'; showGuideCompletion = false; saveGuide(); helpDialog.close(); renderUI();
});
$('new-run-button').addEventListener('click', ()=>newRun().catch(error=>{game.message=error.message;renderUI();}));
$('outcome-new-run').addEventListener('click', ()=>newRun().catch(error=>{game.message=error.message;renderUI();}));
$('reset-button').addEventListener('click', async() => {
  if(checkoutBusy)return;
  if(paidMode){if(!confirm('Start a fresh battle? Paid defender growth stays in your wallet account; this run and its run-specific purchases are abandoned.'))return;paidRunId=(await payments.newRun()).id;appliedPayments=new Set();game=new Game();game.allowPreview(holder.rarity);loadPurchasedGrowth(await payments.status());game.tree=Number((await payments.balance())/1000000n);save();renderUI();return;}
  if (!confirm('Reset all preview progress, rarity choices, and simulated TREE?')) return;
  if(!window.canopyAccess.account)return;
  game = new Game();game.enableCollection();game.allowPreview(window.canopyAccess.account.rarity); feedback.clear(); aiming.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; backdropKey = ''; cardSignature = ''; guideStatus = 'active'; showGuideCompletion = false; saveGuide(); save(); renderUI(); accessDialog.showModal();
});
document.addEventListener('keydown', event => {
  if (accessDialog.open || helpDialog.open || purchaseDialog.open || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(event.target.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < Object.keys(TOWERS).length && Number.isInteger(index)) {
    selectDefender(Object.keys(TOWERS)[index]);
  } else if (event.code === 'Space') { event.preventDefault(); act(() => game.pause()); }
  else if (event.key.toLowerCase() === 'n') act(() => game.startWave());
  else if (event.key === 'Escape') { selectedTower = null; selectedType = null; renderUI(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase === 'running') { game.pause(); save(); renderUI(); } lastTime = performance.now(); });
window.addEventListener('pagehide', save);

for (const [i, chapter] of CHAPTERS.entries()) {
  const button = document.createElement('button'); button.className = 'chapter-button'; button.dataset.chapter = i;
  button.innerHTML = `<span class="chapter-number">${i + 1}</span><span><strong>${chapter.name}</strong><small>${chapter.subtitle}</small></span><span class="chapter-stars">☆☆☆</span>`;
  button.addEventListener('click', () => selectChapter(i)); $('chapter-trail').append(button);
}
async function selectChapter(i) {
  if(checkoutBusy)return;
  if (game.wave > 0 && !['defeat', 'victory'].includes(game.phase) && !confirm('Travel to another chapter? Your current battle resets. Permanent growth and forest progress are kept.')) return;
  if(paidMode){paidRunId=(await payments.newRun()).id;appliedPayments=new Set();}
  if (game.chooseChapter(i)) { feedback.clear(); aiming.clear(); selectedTower = null; selectedType = 'pine'; particles = []; floaters = []; showGuideCompletion = false; save(); renderUI(); }
}
$('next-chapter').addEventListener('click', () => selectChapter(game.chapter + 1));
$('enter-event').addEventListener('click',async()=>{
  if(checkoutBusy)return;
  if(game.wave>0 && !['victory','defeat'].includes(game.phase) && !confirm('Enter Harvest of the Canopy? This replaces the current battlefield. Campaign progress, growth and earned rewards stay.'))return;
  if(paidMode){paidRunId=(await payments.newRun()).id;appliedPayments=new Set();}
  if(game.startEvent(HARVEST_CANOPY.id)){feedback.clear();aiming.clear();selectedTower=null;selectedType='pine';particles=[];floaters=[];closeGuide();save();renderUI();focusControl(canvas);}
});
for(const[id,type]of [['lantern-look','oak'],['web-look','watchtower']])$(id).addEventListener('change',event=>act(()=>game.setSeasonLook(type,event.target.checked)));
for(const[id,type]of [['copper-look','oak'],['harvest-tower-look','watchtower'],['amber-look','tree']])$(id).addEventListener('change',event=>act(()=>game.setHarvestLook(type,event.target.checked)));
for(const[id,difficulty]of [['veteran-start','veteran'],['standard-start','standard']])$(id).addEventListener('click',async()=>{
 if(checkoutBusy||!game.access||difficulty==='veteran'&&!game.veteranUnlocked)return;
 if(!confirm('Start a fresh '+difficulty+' campaign? This replaces the current battle. Permanent growth, unlocks and seasonal cosmetics stay; current-run supplies do not carry over.'))return;
 if(paidMode){paidRunId=(await payments.newRun()).id;appliedPayments=new Set();}
 if(game.startCampaign(difficulty)){feedback.clear();aiming.clear();selectedTower=null;selectedType='pine';particles=[];floaters=[];closeGuide();save();renderUI();}
});
let seasonArtSignature='';
function renderSeason(){
 $('veteran-start').disabled=!game.access||!game.veteranUnlocked;
 $('standard-start').disabled=!game.access;
 $('veteran-progress').textContent=game.veteranUnlocked?`${game.isVeteran?'VETERAN ACTIVE · ':''}${game.veteranStars.reduce((a,b)=>a+b,0)}/9 Veteran stars earned · no entry fee`:'Unlock Veteran by protecting all three standard chapters.';
  const rewards=game.seasonRewards,harvest=game.harvestRewards;
  $('harvest-badge-progress').textContent=harvest.includes('harvest-badge')?'Earned ✓':`${game.harvest.bestWave}/5 best waves cleared`;
  $('copper-progress').textContent=harvest.includes('copperleaf-oak')?'Earned ✓':`Best completed run: ${game.harvest.bestHealth}/80 health`;
  $('harvest-team-progress').textContent=harvest.includes('harvest-watchtower')?'Earned ✓':game.isHarvest?`${Math.min(3,game.eventTeam.length)}/3 types planted · finish to earn`:'Win with three defender types';
  $('amber-progress').textContent=harvest.includes('amber-life-tree')?'Earned ✓':`Best completed run: ${game.harvest.bestHealth}/100 health`;
  for(const[id,type,reward]of [['copper-look','oak','copperleaf-oak'],['harvest-tower-look','watchtower','harvest-watchtower'],['amber-look','tree','amber-life-tree']]){$(id).disabled=!game.access||!harvest.includes(reward);$(id).checked=game.harvestLooks[type];}
  $('enter-event').disabled=!game.access || !game.forest.stars[0];
  $('enter-event').textContent=game.isHarvest?'Restart the Harvest →':'Enter the Harvest →';
  $('season-access').textContent=game.forest.stars[0]?'Unlocked · five waves · campaign roster and permanent growth available':'Unlock by protecting Emerald Crossing.';
  $('badge-progress').textContent=rewards.includes('grove-badge')?'Earned ✓':`${game.season.bestWave}/5 best waves cleared`;
  $('lantern-progress').textContent=rewards.includes('lantern-oak')?'Earned ✓':`Best completed run: ${game.season.bestHealth}/80 health`;
  $('web-progress').textContent=rewards.includes('web-watchtower')?'Earned ✓':game.mode===HAUNTED_GROVE.id?`${Math.min(3,game.eventTeam.length)}/3 types planted · finish to earn`:'Clear with three defender types to earn';
  for(const[id,type,reward]of [['lantern-look','oak','lantern-oak'],['web-look','watchtower','web-watchtower']]){
    $(id).disabled=!game.access || !rewards.includes(reward);$(id).checked=game.seasonLooks[type];
  }
  const signature=getAimArtStatus().loaded.length+':'+getStructureArtStatus().loaded.length+':'+getDefenderArtStatus().loaded.length;
  if(signature!==seasonArtSignature){
    for(const[id,type]of [['lantern-preview','oak'],['web-preview','watchtower']]){const c=$(id).getContext('2d');c.clearRect(0,0,144,176);shapeTree(c,type,72,150,1.08,0,1);paintSeasonLook(c,type,72,150,1.08);}
    for(const[id,type]of [['copper-preview','oak'],['harvest-tower-preview','watchtower'],['amber-preview','tree']]){const c=$(id).getContext('2d');c.clearRect(0,0,144,176);if(type==='tree')paintLifeTree(c,'oak',72,150,1.08,0,1,0);else shapeTree(c,type,72,150,1.08,0,1);paintHarvestLook(c,type,72,150,1.08);}
    seasonArtSignature=signature;
  }
}
let sound = false, audio = null, lastTone = 0;
$('sound-button').addEventListener('click', () => {
  try {
    sound = !sound;
    if (sound) { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); }
    $('sound-button').textContent = sound ? 'Sound on' : 'Sound off'; $('sound-button').setAttribute('aria-pressed', String(sound));
    if (sound) tone(420, .15);
  } catch { sound = false; $('sound-button').textContent = 'Sound unavailable'; $('sound-button').disabled = true; }
});
function tone(frequency, duration = .08) {
  if (!sound || !audio || audio.state !== 'running' || document.hidden) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * .6, audio.currentTime + duration);
  gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
}
let cardSignature = '';
loadEnvironmentArt();
loadStructureArt().then(() => { cardSignature = ''; inspectorSignature = null; renderUI(); });
loadAimArt().then(status=>{cardSignature = ''; inspectorSignature = null; renderUI(); if(status.failed.length)console.warn('Some directional guardian sprites were unavailable; aiming canvas artwork is active.');});
loadDefenderArt().then(status => {
  cardSignature = ''; inspectorSignature = null;
  document.querySelectorAll('[data-style]').forEach(button => {
    const icon = button.querySelector('canvas'), c = icon.getContext('2d');
    c.clearRect(0,0,icon.width,icon.height); shapeTree(c,'oak',64,100,1,Number(button.dataset.style));
  });
  renderUI();
  if (status.failed.length) console.warn('Some guardian sprites were unavailable; matching canvas artwork is active.');
});
function renderUI() {
  renderSeason(); renderGuide(); renderScout(); renderPurchase(); renderCombatUI();
  const tower = game.towers.find(t => t.id === selectedTower);
  $('forest-rank').textContent = ['Seedling Sanctuary', 'Blooming Haven', 'Ancient Refuge', 'Forest of Life'][game.forestRank];
  const starCount = game.forest.stars.reduce((a,b) => a+b,0);
  $('forest-summary').textContent = game.forestRank ? `${starCount}/9 stars · permanent defender growth saved` : 'Clear a chapter to build your first landmark.';
  $('map-name').textContent = game.runName.toUpperCase();
  $('map-tactics').textContent = game.chapter>0 && !game.isEvent && game.mapId==='crossing-v1' ? `Saved battle · original route preserved. Start a new run to explore the new ${CHAPTERS[game.chapter].name} layout.` : game.map.tip;
  document.querySelectorAll('[data-chapter]').forEach(button => {
    const i = Number(button.dataset.chapter), stars = (game.isVeteran?game.veteranStars:game.forest.stars)[i];
    button.disabled = !game.access || i > game.unlockedChapter;
    button.classList.toggle('active', i === game.chapter && !game.isEvent); button.setAttribute('aria-pressed', String(i === game.chapter && !game.isEvent));
    button.querySelector('.chapter-stars').textContent = i > game.unlockedChapter ? 'Locked' : '★'.repeat(stars) + '☆'.repeat(3-stars);
    button.setAttribute('aria-label', `${CHAPTERS[i].name}: ${i > game.unlockedChapter ? 'locked' : `${stars} of 3 stars`}`);
  });
  const nextCards = Object.values(game.forest.levels).join(':') + JSON.stringify(game.collection) + ':' + getDefenderArtStatus().loaded.length + ':' + getAimArtStatus().loaded.length + ':' + getStructureArtStatus().loaded.length + ':' + JSON.stringify([game.seasonLooks,game.harvestLooks]);
  if (nextCards !== cardSignature) {
    document.querySelectorAll('[data-tower]').forEach(button => {
      const type = button.dataset.tower, icon = button.querySelector('canvas'), c = icon.getContext('2d'), level = game.collection?Math.max(...game.collection.levels[type]):game.forest.levels[type];
      c.clearRect(0,0,icon.width,icon.height); shapeTree(c,type,72,150,1.08,0,level); if(game.seasonLooks[type])paintSeasonLook(c,type,72,150,1.08);if(game.harvestLooks[type])paintHarvestLook(c,type,72,150,1.08);
    }); cardSignature = nextCards;
  }
  if (!tower) selectedTower = null;
  const active = game.access && ['build', 'running', 'paused'].includes(game.phase);
  $('health-value').innerHTML = `${game.health}<span> / 100</span>`;
  $('health-bar').style.width = game.health + '%'; $('health-bar').style.background = game.health < 30 ? '#ff6b7c' : '#7ef3a0';
  $('shield-value').textContent = `Root shield: ${game.shield}`;
  $('wave-value').innerHTML = `${String(game.wave).padStart(2, '0')}<span> / ${game.waveCount}</span>`;
  $('sap-value').textContent = game.sap.toLocaleString(); $('tree-value').textContent = game.tree.toLocaleString(); $('score-value').textContent = game.score.toLocaleString();
  $('kills-value').textContent = `${game.kills} pests defeated`;
  const status = { build: 'Prepare your forest', running: 'Defenders engaged', paused: 'Battle paused', defeat: 'Tree of Life fallen', victory: 'Forest protected' }[game.phase];
  $('phase-value').textContent = status; $('battle-status').textContent = game.access ? status.toUpperCase() : 'NFTREE ACCESS PREVIEW';
  if ($('message').textContent !== game.message) $('message').textContent = game.message;
  $('enemy-count').textContent = game.enemies.length ? `${game.enemies.length} ON PATH · ${game.queue.length} INCOMING` : 'PATH CLEAR';
  $('account-rarity').textContent = game.access ? RARITIES[game.rarity] : 'Choose rarity';
  $('wave-button').textContent = game.phase === 'victory' ? 'Forest protected ✓' : `Send wave ${Math.min(game.waveCount, game.wave + 1)} →`;
  $('wave-button').disabled = !game.access || game.phase !== 'build';
  $('pause-button').disabled = !['running', 'paused'].includes(game.phase); $('pause-button').textContent = game.phase === 'paused' ? 'Resume' : 'Pause';
  document.querySelectorAll('[data-tower]').forEach(button => {
    button.classList.toggle('active', selectedType === button.dataset.tower); button.setAttribute('aria-pressed', String(selectedType === button.dataset.tower)); const type = button.dataset.tower, status = game.unlockStatus(type);
    button.disabled = !active || !status.unlocked;
    button.classList.toggle('roster-locked', !status.unlocked);
    button.querySelector('.roster-progress').textContent = status.unlocked ? (game.collection?`${game.availableDefenders(type).length}/12 available · individual levels`:`${GROWTH_NAMES[game.forest.levels[type]-1]} · unlocked`) : `${status.label} · ${status.current}/${status.goal}`;
    button.setAttribute('aria-label', `${TOWERS[type].name}: ${TOWERS[type].role}. ${status.unlocked ? `${TOWERS[type].cost} Sap. ${TOWERS[type].description}` : `Locked. ${status.label}. Progress ${status.current} of ${status.goal}.`}`);
  });
  renderRosterProgress();
  document.querySelectorAll('[data-style]').forEach(button => {
    const i = Number(button.dataset.style); button.disabled = !game.access || i > game.rarity;
    button.classList.toggle('selected', i === (tower?.style ?? game.style)); button.setAttribute('aria-pressed', String(i === (tower?.style ?? game.style)));
    button.querySelector('.lock').hidden = game.access && i <= game.rarity;
  });
  $('style-instruction').textContent = tower ? `Customize this ${TOWERS[tower.type].name}.` : 'Choose the style for your next defender.';
  document.querySelectorAll('[data-pad]').forEach(button => {
    const pad = Number(button.dataset.pad); const t = game.towers.find(t => t.pad === pad);
    button.textContent = t ? `${pad + 1} · ${TOWERS[t.type].name}` : `Site ${pad + 1}`;
    button.setAttribute('aria-label', t ? `Select ${TOWERS[t.type].name} at site ${pad + 1}` : `Plant selected defender at site ${pad + 1}`);
    button.disabled = !active;
  });
  document.querySelectorAll('[data-supply]').forEach(button => {
    const kind = button.dataset.supply;
    button.disabled = !active || game.tree < PRICES[kind] || (kind === 'storm' && (!game.enemies.length || game.phase !== 'running')) || (kind === 'shield' && game.shield >= 50) || (kind === 'fertilizer' && game.boostUntil > game.time);
  });
  const nextInspector = tower ? `${tower.id}:${tower.level}:${tower.style}:${tower.targetMode}:${JSON.stringify([game.seasonLooks,game.harvestLooks])}:${active}:${game.tree >= game.upgradeCost(tower)}` : 'none';
  if (nextInspector !== inspectorSignature) {
  if (tower) {
    const d = TOWERS[tower.type];
    $('inspector').innerHTML = `<canvas class="tower-portrait" width="240" height="240" aria-hidden="true"></canvas><span class="eyebrow">SITE ${tower.pad + 1} · ${STYLES[tower.style].name.toUpperCase()}</span><h3>${d.name}<small>${game.collection?'#'+(tower.defenderSlot+1)+' · ':''}${GROWTH_NAMES[tower.level - 1]} · LEVEL ${tower.level}</small></h3><p>${d.description}</p><div class="growth-steps">${GROWTH_NAMES.map((name,i) => `<span class="${i < tower.level ? 'grown' : ''}">${i+1} ${name}</span>`).join('')}</div><p class="growth-note">${game.collection?`TREE upgrades only ${d.name} #${tower.defenderSlot+1}. Its level stays in your collection when removed or when a new run starts.`:`TREE growth permanently upgrades every ${d.name}, now and in future runs.`} Sap only pays for deployment.</p><div class="tower-stats"><div><span>DAMAGE</span><strong>${Math.round(d.damage * (1 + (tower.level - 1) * .6))}</strong></div><div><span>RANGE</span><strong>${d.range + (tower.level - 1) * 18}</strong></div><div><span>INTERVAL</span><strong>${d.interval}s</strong></div></div><div class="target-orders"><label for="target-mode">Target priority</label><select id="target-mode" aria-describedby="target-detail">${Object.entries(TARGET_MODES).map(([mode,order]) => `<option value="${mode}" ${tower.targetMode === mode ? 'selected' : ''}>${order.name}</option>`).join('')}</select><p id="target-detail">${TARGET_MODES[tower.targetMode].detail}</p><small>This defender only · order included</small></div><button id="upgrade-button" class="primary">${tower.level === 3 ? (game.collection?'This defender is Ancient ✓':'Species growth complete ✓') : `Grow ${game.collection?d.name+' #'+(tower.defenderSlot+1):'all '+d.name} · ${game.upgradeCost(tower).toLocaleString()} TREE`}</button>${tower.level===3?'<p class="growth-note">TREE field supplies and continues remain available for future runs.</p>':''}<button id="remove-button" class="secondary">Remove · return ${Math.floor(d.cost * .6)} Sap</button>`;
    shapeTree($('inspector').querySelector('canvas').getContext('2d'), tower.type, 120, 185, 1.38, tower.style, tower.level);
    if(game.seasonLooks[tower.type])paintSeasonLook($('inspector').querySelector('canvas').getContext('2d'),tower.type,120,185,1.38);if(game.harvestLooks[tower.type])paintHarvestLook($('inspector').querySelector('canvas').getContext('2d'),tower.type,120,185,1.38);
    $('target-mode').disabled = !active;
    $('target-mode').addEventListener('change', event => {
      const mode = event.target.value;
      act(() => game.setTargetMode(tower.id, mode));
      // The inspector rerenders with the new order; retain keyboard focus.
      $('target-mode')?.focus({ preventScroll: true });
    });
    $('upgrade-button').disabled = !active || tower.level >= 3 || game.tree < game.upgradeCost(tower);
    $('upgrade-button').addEventListener('click', () => reviewPurchase('upgrade', tower.id));
    $('remove-button').disabled = !active;
    $('remove-button').addEventListener('click', () => act(() => { game.sell(tower.id); selectedTower = null; selectedType = tower.type; }));
  } else {
    $('inspector').innerHTML = '<span class="eyebrow">ROOTED IN STRENGTH.</span><h3>Choose your defenders.</h3><p>Choose a numbered defender from your collection, plant it, then select it to upgrade that individual. Choose its target priority to intercept fast or tough pests. TREE upgrades stay with you across runs.</p><div class="legend"><span><i class="legend-dot sap"></i>Sap plants towers</span><span><i class="legend-dot tree"></i>TREE upgrades individuals</span></div>';
  }
  inspectorSignature = nextInspector;
  }
  const ended = ['defeat', 'victory'].includes(game.phase); $('outcome').hidden = !ended;
  $('battle-report').hidden = !ended;
  if (ended) {
    const report = battleReport(game);
    $('report-coverage').textContent = report.complete ? 'Full run recorded' : 'Partial history · only activity recorded since this update is included below.';
    $('report-stats').textContent = `${report.cleared} waves cleared · ${game.kills} total pests defeated · ${report.sapEarned.toLocaleString()} Sap earned · ${report.treeSpent.toLocaleString()} ${paidMode?'TREE':'preview TREE'} spent · ${report.continues} continues`;
    $('report-breaches').textContent = report.leaks.length ? report.leaks.map(p => `${p.name}: ${p.count}`).join(' · ') : 'No recorded breaches.';
    $('report-damage').textContent = `${report.damage} health lost · ${report.absorbed} damage absorbed by Root Shield. Sap earned excludes starting Sap and planting refunds.`;
    $('report-earned').textContent = report.earned.length ? `New this run: ${report.earned.join(', ')}.` : 'No new roster or seasonal unlocks recorded this run. Permanent progress stays saved.';
    $('report-tip').textContent = report.tip;
    $('report-goal').textContent = report.goal;
    const won = game.phase === 'victory';
    $('outcome-label').textContent = won ? 'THE FOREST REMEMBERS' : 'ROOTS CAN RISE AGAIN';
    $('outcome-title').textContent = won ? 'The Tree of Life stands.' : 'The Tree of Life has fallen.';
    const stars = game.health >= 80 ? 3 : game.health >= 40 ? 2 : 1;
    $('outcome-stars').textContent = won && !game.isEvent ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '';
    $('next-chapter').hidden = !won || game.isEvent || game.chapter >= CHAPTERS.length-1;
    $('outcome-description').textContent = won && game.isEvent ? `${game.runName} protected. ${game.activeSeasonRewards.length}/${game.event.rewards.length} seasonal rewards earned. Equip your looks in the event panel. Your campaign progress is preserved.` : won ? `${game.runName} protected. ${stars}/3 ${game.isVeteran?'Veteran stars. Standard progress stays saved.':'stars.'} Your forest landmark and permanent growth are saved. No tokens or cash awarded.` : `Continue to restore health and keep your towers and current wave. Costs 20,000 ${paidMode?'TREE plus SUI network gas':'preview TREE'}. A fresh run is included with NFTree access.`;
    $('continue-button').hidden = won; $('continue-button').disabled = game.tree < PRICES.continue;
  }
}

$('defender-copy').addEventListener('change',event=>{deploymentChoice={type:selectedType,slot:Number(event.target.value)};});
function renderCollection(){
 const wrap=$('collection-picker'),select=$('defender-copy');
 wrap.hidden=!game.collection||!selectedType||!game.isUnlocked(selectedType);
 if(wrap.hidden)return;
 const available=game.availableDefenders(selectedType).sort((a,b)=>b.level-a.level||a.slot-b.slot);
 if(deploymentChoice.type!==selectedType||!available.some(d=>d.slot===deploymentChoice.slot))deploymentChoice={type:selectedType,slot:available[0]?.slot??null};
 const signature=selectedType+':'+JSON.stringify(available);
 if(select.dataset.signature!==signature){
  select.replaceChildren(...available.map(d=>{const option=document.createElement('option');option.value=d.slot;option.textContent=`${TOWERS[selectedType].name} #${d.slot+1} · ${GROWTH_NAMES[d.level-1]} · level ${d.level}`;return option;}));
  select.dataset.signature=signature;
 }
 select.disabled=!available.length;select.value=String(deploymentChoice.slot);
 $('collection-summary').textContent=available.length?`${available.length}/12 available. TREE upgrades this defender only; Sap deploys it.`:'All 12 defenders of this type are deployed. Remove one to redeploy it.';
}
function renderRosterProgress() {
 renderCollection();
  const types = Object.keys(TOWERS), unlocked = types.filter(type => game.isUnlocked(type));
  $('roster-summary').textContent = `${unlocked.length}/${types.length} defenders unlocked · earned progress stays across runs`;
  const next = types.filter(type => !game.isUnlocked(type)).map(type => ({type, ...game.unlockStatus(type)}));
  $('next-unlock').textContent = next.length ? `Next rewards: ${next.slice(0,2).map(item => `${TOWERS[item.type].name} — ${item.label} (${item.current}/${item.goal})`).join(' · ')}` : 'Full roster earned. Replay chapters to improve your stars and try new defense combinations.';
  for (const [type,name] of [['watchtower','watchtower'],['cannon','cannon']]) {
    const status = game.unlockStatus(type);
    $(`${name}-badge`).textContent = status.unlocked ? 'UNLOCKED · PLAYABLE' : 'EARN THROUGH PLAY';
    $(`${name}-requirement`).textContent = status.unlocked ? `Ready to build · ${TOWERS[type].cost} Sap. Select it in the roster above.` : `${status.label} · ${status.current}/${status.goal}`;
  }
}

function renderCombatUI() {
  const boss = bossStatus(game), visible = boss.state !== 'hidden';
  $('boss-panel').hidden = !visible;
  $('boss-health').hidden = boss.state !== 'present';
  if (visible) {
    $('boss-title').textContent = game.bossName.toUpperCase()+(game.isVeteran&&boss.state==='present'&&boss.hp<boss.maxHp*.5?' · ENRAGED':'');
    const text = boss.state === 'incoming' ? 'Approaching behind the escort' : `${Math.ceil(boss.hp).toLocaleString()} / ${Math.ceil(boss.maxHp).toLocaleString()} HP`;
    if ($('boss-health-text').textContent !== text) $('boss-health-text').textContent = text;
    if (boss.state === 'present') { $('boss-health').max = boss.maxHp; $('boss-health').value = boss.hp; }
  }
  const notice = feedback.notice;
  const title = notice?.title || (game.phase === 'paused' ? 'BATTLE PAUSED' : game.phase === 'running' ? 'GUARDIANS ENGAGED' : game.phase === 'victory' ? 'FOREST PROTECTED' : game.phase === 'defeat' ? 'THE ROOTS HAVE FALLEN' : 'HOLD THE LINE');
  const text = notice?.text || (game.phase === 'paused' ? 'Resume when you are ready.' : game.phase === 'running' ? 'Watch the route and protect the Tree of Life.' : 'Earned Sap plants guardians. TREE upgrades individuals.');
  $('battle-notice').dataset.tone = notice?.tone || 'normal';
  if ($('notice-title').textContent !== title) $('notice-title').textContent = title;
  if ($('notice-text').textContent !== text) $('notice-text').textContent = text;
}

function renderGuide() {
  const tip = starterTip(game);
  if (guideStatus === 'active' && tip.key === 'done') { guideStatus = 'complete'; showGuideCompletion = true; saveGuide(); }
  const visible = !game.isEvent && game.access && (guideStatus === 'active' || showGuideCompletion);
  $('starter-guide').hidden = !visible;
  const signature = `${visible}:${guideStatus}:${tip.key}:${game.phase}`;
  if (signature !== guideSignature) {
    $('guide-step').textContent = tip.key === 'done' ? 'GUIDED START COMPLETE' : `FIRST RUN · ${tip.step} OF 4`;
    $('guide-title').textContent = tip.title; $('guide-text').textContent = tip.text;
    $('guide-action').textContent = tip.action; $('skip-guide').textContent = tip.key === 'done' ? 'Dismiss' : 'Skip guide';
    document.querySelectorAll('[data-tower]').forEach(button => button.classList.toggle('tutorial-target', visible && guideStatus === 'active' && button.dataset.tower === tip.tower));
    document.querySelectorAll('[data-pad]').forEach(button => button.classList.toggle('tutorial-target', visible && guideStatus === 'active' && Number(button.dataset.pad) === tip.pad));
    $('wave-button').classList.toggle('tutorial-target', visible && guideStatus === 'active' && tip.key === 'launch');
    guideSignature = signature;
  }
}
function renderScout() {
  const signature = `${game.chapter}:${game.wave}:${game.phase}:${game.enemyRules}:${game.mode}:${game.difficulty}`;
  if (signature === scoutSignature) return;
  scoutSignature = signature;
  const scout = scoutWave(game.chapter, game.wave + 1, game.enemyRules, game.mode, game.difficulty);
  $('scout-title').textContent = game.wave === game.waveCount ? (game.phase === 'victory' ? 'Forest protected' : game.phase === 'defeat' ? 'Final wave interrupted' : 'Final wave underway') : `${game.phase === 'build' ? 'Scout' : 'Next:'} wave ${scout.wave} · ${scout.title}`;
  $('scout-total').textContent = scout.total ? `${scout.total} PESTS${scout.wave === game.waveCount ? ' · BOSS WAVE' : ''}` : `${game.waveCount} OF ${game.waveCount}`;
  $('scout-pests').replaceChildren();
  for (const group of scout.groups) {
    const card = document.createElement('div'); card.className = 'scout-pest';
    card.innerHTML = `<canvas width="96" height="92" aria-hidden="true"></canvas><strong>${group.name} <b>×${group.count}</b></strong><small>${group.trait}</small><small>${group.counter}</small>`;
    const c = card.querySelector('canvas').getContext('2d'), scale = group.kind === 'boss' ? .5 : .65; c.translate(48,59); c.scale(scale,scale);
    paintPest(c,{kind:group.kind,x:0,y:0,id:0,...(game.isEvent?{theme:game.mode}:{}),hp:100,maxHp:100,slowUntil:0,poisonUntil:0},0,0);
    $('scout-pests').append(card);
  }
  $('scout-tip').textContent = (scout.tip || (game.phase === 'victory' ? 'Replay to improve your stars, or explore the next unlocked chapter.' : `The ${game.bossName} is the final challenge. There are no further waves in this run.`));
}

// Local sprite artwork and procedural scenery; no remote art or font downloads.
const backdrop = document.createElement('canvas'); backdrop.width = WIDTH; backdrop.height = HEIGHT;
const bg = backdrop.getContext('2d');
let backdropKey = '', floaters = [];
let seed = 89;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function draw(clock, dt) {
  const visualClock = reducedMotion ? 0 : clock;
  const held = game.phase === 'paused' || accessDialog.open || helpDialog.open || purchaseDialog.open || document.hidden || checkoutBusy;
  const effectDt = held ? 0 : dt;
  feedback.advance(effectDt);
  aiming.advance(effectDt);
  const events = game.events.splice(0);
  feedback.consume(events);
  aiming.consume(events);
  aiming.track(game,held);
  for(const shot of aiming.shots)if(!shot.origin)shot.origin=getGuardianShotOrigin(shot);
  const key = `${game.chapter}:${game.forestRank}:${getEnvironmentArtStatus().revision}:${game.mode}:${game.mapId}`;
  if (key !== backdropKey) { paintBackdrop(bg, game.isEvent?2:game.chapter, game.forestRank,game.map); if(game.isHarvest)paintHarvestBackdrop(bg);else if(game.isEvent)paintHauntedBackdrop(bg); backdropKey = key; }
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(backdrop, 0, 0);
  const aura = ctx.createRadialGradient(920, 610, 15, 920, 610, 105);
  aura.addColorStop(0, '#d8ad6230'); aura.addColorStop(1, '#d8ad6200'); ctx.fillStyle = aura; ctx.fillRect(800,490,200,230);
  // Earning chapter landmarks grows the Tree of Life's visible silhouette.
  paintLifeTree(ctx, 'oak', 885, 659, 1.02 + game.forestRank * .08, 0, game.forestRank >= 2 ? 2 : 1, visualClock);
  if(game.harvestLooks.tree)paintHarvestLook(ctx,'tree',885,659,1.1);
  ctx.save();ctx.fillStyle='#efe5c6';ctx.font='bold 12px Trebuchet MS, Arial';ctx.textAlign='center';ctx.strokeStyle='#101b14';ctx.lineWidth=4;ctx.strokeText('TREE OF LIFE',885,704);ctx.fillText('TREE OF LIFE',885,704);ctx.restore();
  if (game.shield > 0) { ctx.strokeStyle='#eafed6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(885,606,75,90,0,0,Math.PI*2);ctx.stroke(); }
  const suggestedPad = guideStatus === 'active' && game.access ? starterTip(game).pad : null;
  for (let i = 0; i < game.map.pads.length; i++) {
    const [x,y] = game.map.pads[i], tower = game.towers.find(t => t.pad === i);
    const selected = tower && tower.id === selectedTower;
    if (selected || hoveredPad === i && selectedType && !tower) {
      const range = selected ? TOWERS[tower.type].range + (tower.level-1)*18 : TOWERS[selectedType].range + ((game.collection?.levels[selectedType]?.[deploymentChoice.type===selectedType?deploymentChoice.slot:0]??game.forest.levels[selectedType])-1)*18;
      ctx.fillStyle='#f7ffcf28';ctx.strokeStyle='#365d3980';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(x,y,range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    }
    paintBuildSite(ctx,x,y,{selected,hovered:hoveredPad===i,recommended:suggestedPad===i,occupied:!!tower,number:i+1});
    if (tower) {
      const pose=aiming.pose(tower.id);
      shapeTree(ctx,tower.type,x,y,GUARDIAN_SCALE,tower.style,tower.level,reducedMotion?0:aiming.time,pose.hold>0,pose.facing);
      if(game.seasonLooks[tower.type])paintSeasonLook(ctx,tower.type,x,y,GUARDIAN_SCALE);if(game.harvestLooks[tower.type])paintHarvestLook(ctx,tower.type,x,y,GUARDIAN_SCALE);
      ctx.fillStyle='#d9c592';ctx.strokeStyle='#283d2e';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x+29,y+7,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#435b39';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(tower.level,x+29,y+10);
    }
  }
  ctx.textAlign='left';
  for (const e of game.enemies) paintPest(ctx,e, held ? (reducedMotion ? 0 : game.time) : visualClock,game.time,{hit:feedback.reaction(e.id),reducedMotion});
  paintCombatEffects(ctx,feedback,reducedMotion);
  for (const shot of aiming.shots) paintShot(ctx,shot);
  if (!held && aiming.shots.some(shot=>shot.life>.27) && clock-lastTone>.16) { tone(220,.045);lastTone=clock; }
  for (const event of events) {
    if (['attack','chain','hit','wave-start','wave-clear','boss-arrival','roster-unlock','season-reward'].includes(event.type)) continue;
    const n=event.type==='storm'?65:event.type==='victory'?80:14;
    for(let i=0;i<n;i++) particles.push({x:event.type==='storm'?random()*WIDTH:event.x,y:event.type==='storm'?random()*HEIGHT:event.y,vx:(random()-.5)*(event.type==='victory'?250:100),vy:-30-random()*90,life:event.type==='victory'?1.5:.65,max:event.type==='victory'?1.5:.65,color:event.type==='kill'?'#8d8264':event.type==='leak'?'#e88068':event.type==='upgrade'?'#f9e5a0':'#fff4b4'});
    if(event.type==='kill')floaters.push({x:event.x,y:event.y-32,text:event.kind==='boss'?'+150 SAP':'+12 SAP',color:'#dbd9b4',life:1});
    if(event.type==='upgrade') {floaters.push({x:event.x,y:event.y-82,text:'GROWN!',color:'#eed3a3',life:1.2});tone(660,.2);}
    if(event.type==='plant')tone(340,.12);
    if(event.type==='leak'){floaters.push({x:875,y:550,text:event.damage?`−${event.damage} LIFE`:event.absorbed?'SHIELD HELD':'ROOTS BREACHED',color:event.damage?'#e9a68e':'#c9dcc0',life:1.2});tone(130,.2);}
    if(event.type==='storm')tone(240,.3);
    if(event.type==='victory')tone(880,.4);
  }
  if(particles.length>400)particles=particles.slice(-400);
  if(floaters.length>40)floaters=floaters.slice(-40);
  for(const p of particles){if(!reducedMotion){p.x+=p.vx*effectDt;p.y+=p.vy*effectDt;p.vy+=90*effectDt;}p.life-=effectDt;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x,p.y,3,5,.5,0,Math.PI*2);ctx.fill();}
  particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
  for(const f of floaters){if(!reducedMotion)f.y-=22*effectDt;f.life-=effectDt;ctx.globalAlpha=Math.max(0,Math.min(1,f.life*2));ctx.fillStyle=f.color;ctx.font='bold 13px Trebuchet MS, Arial';ctx.strokeStyle='#182419';ctx.lineWidth=3;ctx.strokeText(f.text,f.x-22,f.y);ctx.fillText(f.text,f.x-22,f.y);}
  floaters=floaters.filter(f=>f.life>0);ctx.globalAlpha=1;
  if(game.boostUntil>game.time){ctx.fillStyle='#e8dbab';ctx.font='bold 12px Arial';ctx.fillText(`FERTILIZER · ${Math.ceil(game.boostUntil-game.time)}s`,25,55);}
  if(game.phase==='paused'){
    ctx.fillStyle='#28493470';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.textAlign='center';ctx.fillStyle='#fff3c8';ctx.strokeStyle='#284832';ctx.lineWidth=5;ctx.font='bold 36px Georgia';ctx.strokeText('Battle paused.',WIDTH/2,HEIGHT/2);ctx.fillText('Battle paused.',WIDTH/2,HEIGHT/2);ctx.font='bold 14px Arial';ctx.fillText('Resume to hold the line.',WIDTH/2,HEIGHT/2+32);ctx.textAlign='left';
  }
}
function frame(now) {
  const dt = Math.min(.05, (now - lastTime) / 1000); lastTime = now;
  if (!accessDialog.open && !helpDialog.open && !purchaseDialog.open && !document.hidden && !checkoutBusy) game.step(dt);
  draw(now / 1000, dt);
  if (now - lastUI > 150) { renderUI(); lastUI = now; }
  if (now - lastSave > 2000 && game.access) { save(); lastSave = now; }
  requestAnimationFrame(frame);
}
renderUI();
if (!storageAvailable) $('save-status').textContent = 'Save unavailable · keep this tab open';
if (!game.access) accessDialog.showModal();
requestAnimationFrame(frame);
