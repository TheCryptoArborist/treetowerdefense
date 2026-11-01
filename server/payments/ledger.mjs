import {randomUUID} from 'node:crypto';
import {isValidTransactionDigest} from '@mysten/sui/utils';
import {addressOf} from '../ownership.mjs';
import {treeAmount,TREE_TYPE} from './tree.mjs';
import {TREE_PAYMENT_RECIPIENT} from './config.mjs';
const SPECIES=['oak','pine','palm','cypress','mushroom','willow','watchtower','cannon'];
const SUPPLIES=['shield','fertilizer','storm','continue'];
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const invoice=row=>({id:row.id,network:'mainnet',wallet:row.wallet,recipient:row.recipient,product:row.product,decimals:row.decimals,amount:row.amount,runId:row.run_id,species:row.species,createdAt:Number(row.created_at),expiresAt:Number(row.expires_at),expectedDigest:row.expected_digest,status:row.status});
// Server-only. authorize must resolve current NFTree session/ownership; never trust a supplied wallet.
// readReceipt must fetch/validate Mainnet data. inspectSigned must derive a digest from verified signed bytes.
export function createPurchaseLedger({database,authorize,readReceipt,inspectSigned,decimals,now=Date.now}){
 if(!database?.transaction||!database?.query||typeof authorize!=='function'||typeof readReceipt!=='function'||typeof inspectSigned!=='function'||typeof decimals!=='function')throw Error('Trusted payment dependencies required');
 async function holder(context){const a=await authorize(context);const wallet=addressOf(a?.address);if(!wallet||!Number.isSafeInteger(a.expiresAt)||a.expiresAt<=now())throw Error('NFTree session expired');return {wallet,expiresAt:a.expiresAt};}
 function alive(a){if(a.expiresAt<=now())throw Error('NFTree session expired');}
 async function account(tx,a){alive(a);await tx.query('INSERT INTO canopy_payments.accounts(wallet,created_at) VALUES($1,$2) ON CONFLICT DO NOTHING',[a.wallet,now()]);await tx.query('SELECT wallet FROM canopy_payments.accounts WHERE wallet=$1 FOR UPDATE',[a.wallet]);alive(a);}
 async function owned(tx,a,id){if(!uuid(id))throw Error('Invalid invoice');const {rows}=await tx.query('SELECT * FROM canopy_payments.invoices WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,a.wallet]);if(!rows[0])throw Error('Invoice not found');return rows[0];}
 return Object.freeze({
  async startRun(context){const a=await holder(context);return database.transaction(async tx=>{await account(tx,a);const id=randomUUID();await tx.query('INSERT INTO canopy_payments.runs(id,wallet,created_at) VALUES($1,$2,$3)',[id,a.wallet,now()]);return {id};});},
  async quote(context,{product,species=null,runId=null}={}){
   const a=await holder(context);if(a.wallet===TREE_PAYMENT_RECIPIENT)throw Error('Self-payment is not a purchase');const places=await decimals();alive(a);
   if(product!=='growth'&&!SUPPLIES.includes(product))throw Error('Unknown purchase');
   return database.transaction(async tx=>{
    await account(tx,a);let sku=product;
    if(product==='growth'){
     if(!SPECIES.includes(species)||runId!==null)throw Error('Invalid species upgrade');
     await tx.query('INSERT INTO canopy_payments.growth(wallet,species) VALUES($1,$2) ON CONFLICT DO NOTHING',[a.wallet,species]);
     const {rows}=await tx.query('SELECT level FROM canopy_payments.growth WHERE wallet=$1 AND species=$2 FOR UPDATE',[a.wallet,species]);
     if(rows[0].level===3)throw Error('Ancient growth already owned');sku='growth:'+(rows[0].level+1);
     // Only unsigned quotes expire automatically. Bound payments remain recoverable after expiry.
     await tx.query("UPDATE canopy_payments.invoices SET status='expired' WHERE wallet=$1 AND species=$2 AND status='quoted' AND expires_at<=$3",[a.wallet,species,now()]);
     const pending=await tx.query("SELECT * FROM canopy_payments.invoices WHERE wallet=$1 AND species=$2 AND status IN ('quoted','bound')",[a.wallet,species]);
     if(pending.rows[0])return invoice(pending.rows[0]);
    }else{
     if(species!==null||!uuid(runId))throw Error('A server-issued run is required');
     const run=await tx.query('SELECT id FROM canopy_payments.runs WHERE id=$1 AND wallet=$2',[runId,a.wallet]);if(!run.rows[0])throw Error('Run not found');
    }
    const id=randomUUID(),time=now(),amount=treeAmount(sku,places);
    const r=await tx.query('INSERT INTO canopy_payments.invoices(id,wallet,run_id,species,product,recipient,amount,decimals,created_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[id,a.wallet,runId,species,sku,TREE_PAYMENT_RECIPIENT,amount,places,time,time+600000]);alive(a);return invoice(r.rows[0]);
   });
  },
  async bind(context,id,signed){
   const a=await holder(context);if(!uuid(id))throw Error('Invalid invoice');
   // No browser digest accepted: verifier checks signed transaction bytes and derives the digest.
   const initial=await database.query('SELECT * FROM canopy_payments.invoices WHERE id=$1 AND wallet=$2',[id,a.wallet]);if(!initial.rows[0])throw Error('Invoice not found');
   const digest=await inspectSigned(signed,invoice(initial.rows[0]));if(!isValidTransactionDigest(digest))throw Error('Invalid signed digest');await holder(context);alive(a);
   return database.transaction(async tx=>{await account(tx,a);const row=await owned(tx,a,id);
    if(row.expected_digest===digest&&['bound','paid'].includes(row.status))return invoice(row);
    if(row.status!=='quoted'||Number(row.expires_at)<=now())throw Error('Invoice cannot be bound');
    const r=await tx.query("UPDATE canopy_payments.invoices SET expected_digest=$1,status='bound' WHERE id=$2 RETURNING *",[digest,id]);alive(a);return invoice(r.rows[0]);
   });
  },
  async redeem(context,id){
   const a=await holder(context);if(!uuid(id))throw Error('Invalid invoice');
   const initial=await database.query('SELECT * FROM canopy_payments.invoices WHERE id=$1 AND wallet=$2',[id,a.wallet]);if(!initial.rows[0])throw Error('Invoice not found');
   const first=initial.rows[0];let proof=null;
   if(!['bound','paid'].includes(first.status))throw Error('Signed payment required');
   if(first.status==='bound'){
    // Reader requires checkpoint timestamp within the original invoice window, even on late recovery.
    proof=await readReceipt(invoice(first),()=>now(),{allowLateRecovery:true});
   }
   await holder(context);alive(a);
   return database.transaction(async tx=>{
    await account(tx,a);const row=await owned(tx,a,id);
    if(row.status==='paid'){const e=await tx.query('SELECT * FROM canopy_payments.entitlements WHERE invoice_id=$1',[id]);if(!e.rows[0])throw Error('Missing paid entitlement');return e.rows[0];}
    if(row.status!=='bound')throw Error('Invoice cannot be redeemed');
    if(!proof||proof.digest!==row.expected_digest||proof.wallet!==a.wallet||proof.recipient!==TREE_PAYMENT_RECIPIENT||proof.coinType!==TREE_TYPE||proof.amount!==row.amount||!/^\d+$/.test(proof.checkpoint)||!Number.isSafeInteger(proof.timestampMs)||proof.timestampMs<Number(row.created_at)||proof.timestampMs>=Number(row.expires_at))throw Error('Receipt does not match stored invoice');
    const entitlement=randomUUID();
    // All writes below commit together. Any unique conflict or entitlement failure rolls back everything.
    await tx.query('INSERT INTO canopy_payments.receipts(digest,invoice_id,checkpoint,timestamp_ms,verified_at) VALUES($1,$2,$3,$4,$5)',[row.expected_digest,id,proof.checkpoint,proof.timestampMs,now()]);
    if(row.species){const level=Number(row.product.split(':')[1]);const r=await tx.query('UPDATE canopy_payments.growth SET level=$1 WHERE wallet=$2 AND species=$3 AND level=$4 RETURNING level',[level,a.wallet,row.species,level-1]);if(!r.rows[0])throw Error('Species growth changed');}
    const r=await tx.query('INSERT INTO canopy_payments.entitlements(id,invoice_id,wallet,product,run_id,species) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[entitlement,id,a.wallet,row.product,row.run_id,row.species]);
    await tx.query("UPDATE canopy_payments.invoices SET status='paid',paid_at=$1 WHERE id=$2",[now(),id]);await holder(context);alive(a);return r.rows[0];
   });
  },
  async consume(context,id,runId){const a=await holder(context);if(!uuid(id)||!uuid(runId))throw Error('Invalid entitlement');return database.transaction(async tx=>{await account(tx,a);const r=await tx.query('SELECT * FROM canopy_payments.entitlements WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,a.wallet]);const e=r.rows[0];if(!e||e.run_id!==runId||e.species)throw Error('Run entitlement not found');if(e.consumed_at!==null)return {applied:false,alreadyConsumed:true};await tx.query('UPDATE canopy_payments.entitlements SET consumed_at=$1 WHERE id=$2',[now(),id]);alive(a);return {applied:true,product:e.product};});},
  async progress(context){const a=await holder(context);const r=await database.query('SELECT species,level FROM canopy_payments.growth WHERE wallet=$1',[a.wallet]);return Object.fromEntries(r.rows.map(row=>[row.species,row.level]));},
  async cancel(context,id){const a=await holder(context);return database.transaction(async tx=>{await account(tx,a);const row=await owned(tx,a,id);if(row.status!=='quoted')throw Error('Signed payments must be recovered, not cancelled');await tx.query("UPDATE canopy_payments.invoices SET status='cancelled' WHERE id=$1",[id]);return {cancelled:true};});},
  async history(context){const a=await holder(context);const r=await database.query('SELECT * FROM canopy_payments.invoices WHERE wallet=$1 ORDER BY created_at DESC',[a.wallet]);return r.rows.map(invoice);}
 });
}
