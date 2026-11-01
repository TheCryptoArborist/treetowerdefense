import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {NetlifyDB} from '@netlify/database-dev';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {transactionDatabase} from '../server/payments/database.mjs';
import {createPurchaseLedger} from '../server/payments/ledger.mjs';
import {TREE_TYPE} from '../server/payments/tree.mjs';
let pool;
const testURL=process.env.CANOPY_TEST_DATABASE_URL;
if(testURL){const url=new URL(testURL);if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/canopy_ledger_test')throw Error('Use only the dedicated local test database');pool=new pg.Pool({connectionString:testURL});}
const db=pool?transactionDatabase(pool):new NetlifyDB({logger:()=>{}});
before(async()=>{if(pool){await pool.query(await readFile('netlify/database/migrations/20261101023000_canopy_payments.sql','utf8'));}else{await db.start();await db.applyMigrations('netlify/database/migrations');}});
after(async()=>{if(pool)await pool.end();else await db.stop();});
const DIGEST='77DCKTD1egsqSEYB1WaSurYNtnrdi85ArkjqP2hgQ4op';
function setup(){
 let time=1000,active=true,chainFailure=false,afterRead=null;const wallet='0x'+randomBytes(32).toString('hex');
 const reader=async(i,clock,options)=>{assert.equal(options.allowLateRecovery,true);if(chainFailure)throw Error('Chain unavailable');if(afterRead)afterRead();return {digest:i.expectedDigest,wallet:i.wallet,recipient:i.recipient,coinType:TREE_TYPE,amount:i.amount,checkpoint:'123',timestampMs:i.createdAt+1};};
 const deps={database:db,authorize:async context=>{if(!active||context!=='valid')throw Error('Session rejected');return {address:wallet,expiresAt:10000000};},readReceipt:reader,inspectSigned:async signed=>{if(!signed.verified)throw Error('Invalid signed bytes');return signed.digest;},decimals:async()=>6,now:()=>time};
 return {ledger:createPurchaseLedger(deps),wallet,deps,setTime:n=>time=n,logout:()=>active=false,failChain:()=>chainFailure=true,afterRead:fn=>afterRead=fn};
}
async function bind(s,quote,digest=DIGEST){return s.ledger.bind('valid',quote.id,{verified:true,digest});}
async function supply(s,kind='shield'){const run=await s.ledger.startRun('valid');return s.ledger.quote('valid',{product:kind,runId:run.id});}
test('migration isolates payment tables and prices are derived from durable species growth',async()=>{
 const s=setup(),a=await s.ledger.quote('valid',{product:'growth',species:'oak'});assert.equal(a.amount,'5000000000');assert.equal(a.product,'growth:2');assert.deepEqual(await s.ledger.progress('valid'),{oak:1});
 await assert.rejects(s.ledger.quote('valid',{product:'growth:3',species:'oak'}));await assert.rejects(s.ledger.quote('valid',{product:'growth',species:'evil'}));
 const pending=await s.ledger.quote('valid',{product:'growth',species:'oak'});assert.equal(pending.id,a.id);
});
test('concurrent permanent-growth quotes reuse one invoice',async()=>{const s=setup();const rs=await Promise.all([s.ledger.quote('valid',{product:'growth',species:'pine'}),s.ledger.quote('valid',{product:'growth',species:'pine'})]);assert.equal(rs[0].id,rs[1].id);});
test('one payment grants permanent growth exactly once, including retries',async()=>{
 const s=setup(),q=await s.ledger.quote('valid',{product:'growth',species:'oak'});await bind(s,q);const [a,b]=await Promise.all([s.ledger.redeem('valid',q.id),s.ledger.redeem('valid',q.id)]);assert.equal(a.id,b.id);assert.deepEqual(await s.ledger.progress('valid'),{oak:2});
 const next=await s.ledger.quote('valid',{product:'growth',species:'oak'});assert.equal(next.amount,'10000000000');assert.equal(next.product,'growth:3');
 const counts=await db.query('SELECT count(*) AS n FROM canopy_payments.receipts WHERE invoice_id=$1',[q.id]);assert.equal(Number(counts.rows[0].n),1);
});
test('a digest cannot bind to another invoice or another wallet',async()=>{
 const a=setup(),b=setup(),qa=await supply(a),qb=await supply(b);const digest='11111111111111111111111111111111';await bind(a,qa,digest);await assert.rejects(bind(b,qb,digest));
 const history=await b.ledger.history('valid');assert.equal(history[0].status,'quoted');
});
test('wrong wallet/session, fabricated runs and unsigned invoices cannot buy anything',async()=>{
 const s=setup(),other=setup(),q=await supply(s);
 await assert.rejects(s.ledger.redeem('invalid',q.id));await assert.rejects(other.ledger.redeem('valid',q.id));await assert.rejects(s.ledger.redeem('valid',q.id));
 await assert.rejects(s.ledger.quote('valid',{product:'shield',runId:'00000000-0000-0000-0000-000000000001'}));await assert.rejects(s.ledger.bind('valid',q.id,{verified:false}));
});
test('unsigned quotes cancel without a receipt, while signed invoices remain recoverable',async()=>{
 const s=setup(),q=await supply(s);await s.ledger.cancel('valid',q.id);await assert.rejects(bind(s,q));
 const q2=await supply(s);await bind(s,q2,'11111111111111111111111111111112');await assert.rejects(s.ledger.cancel('valid',q2.id));s.setTime(700000);const e=await s.ledger.redeem('valid',q2.id);assert.equal(e.product,'shield');
});
test('expired unsigned quotes cannot bind; an expired growth quote can be replaced',async()=>{const s=setup(),q=await s.ledger.quote('valid',{product:'growth',species:'palm'});s.setTime(q.expiresAt);await assert.rejects(bind(s,q));const next=await s.ledger.quote('valid',{product:'growth',species:'palm'});assert.notEqual(next.id,q.id);});
test('receipt read failures and logout during verification leave invoices unpaid',async()=>{
 const a=setup(),q=await supply(a);await bind(a,q,'11111111111111111111111111111113');a.failChain();await assert.rejects(a.ledger.redeem('valid',q.id));assert.equal((await a.ledger.history('valid'))[0].status,'bound');
 const b=setup(),qb=await supply(b);await bind(b,qb,'11111111111111111111111111111114');b.afterRead(()=>b.logout());await assert.rejects(b.ledger.redeem('valid',qb.id));const r=await db.query('SELECT status FROM canopy_payments.invoices WHERE id=$1',[qb.id]);assert.equal(r.rows[0].status,'bound');
});
test('an entitlement insert failure rolls back receipt, invoice payment and species growth together',async()=>{
 const s=setup(),q=await s.ledger.quote('valid',{product:'growth',species:'cypress'});await bind(s,q,'11111111111111111111111111111115');
 const broken={...s.deps,database:{query:(...args)=>db.query(...args),transaction:fn=>db.transaction(tx=>fn({query:(sql,args)=>{if(sql.startsWith('INSERT INTO canopy_payments.entitlements'))throw Error('Injected write failure');return tx.query(sql,args);}}))}};
 await assert.rejects(createPurchaseLedger(broken).redeem('valid',q.id),/write failure/);assert.deepEqual(await s.ledger.progress('valid'),{cypress:1});assert.equal((await s.ledger.history('valid'))[0].status,'bound');assert.equal((await db.query('SELECT * FROM canopy_payments.receipts WHERE invoice_id=$1',[q.id])).rows.length,0);
});
test('supplies have one durable consumption tied to the authenticated run',async()=>{
 const s=setup(),q=await supply(s,'continue');await bind(s,q,'11111111111111111111111111111116');const e=await s.ledger.redeem('valid',q.id);
 await assert.rejects(s.ledger.consume('valid',e.id,'00000000-0000-0000-0000-000000000001'));
 assert.deepEqual(await s.ledger.consume('valid',e.id,q.runId),{applied:true,product:'continue'});assert.deepEqual(await s.ledger.consume('valid',e.id,q.runId),{applied:false,alreadyConsumed:true});
 const restored=createPurchaseLedger(s.deps);assert.equal((await restored.history('valid'))[0].status,'paid');
});
