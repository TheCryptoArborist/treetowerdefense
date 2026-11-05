import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {toBase58} from '@mysten/sui/utils';
const freshDigest=()=>toBase58(randomBytes(32));
import {NetlifyDB} from '@netlify/database-dev';
import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
import {transactionDatabase} from '../server/payments/database.mjs';
import {createPurchaseLedger} from '../server/payments/ledger.mjs';
import {TREE_TYPE} from '../server/payments/tree.mjs';
let pool;
const testURL=process.env.CANOPY_TEST_DATABASE_URL;
if(testURL){const url=new URL(testURL);if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/canopy_ledger_test')throw Error('Use only the dedicated local test database');pool=new pg.Pool({connectionString:testURL});}
const db=pool?transactionDatabase(pool):new NetlifyDB({logger:()=>{}});
before(async()=>{if(pool){for(const file of (await readdir('netlify/database/migrations')).sort())await pool.query(await readFile('netlify/database/migrations/'+file,'utf8'));}else{await db.start();await db.applyMigrations('netlify/database/migrations');}});
after(async()=>{if(pool)await pool.end();else await db.stop();});
const DIGEST='77DCKTD1egsqSEYB1WaSurYNtnrdi85ArkjqP2hgQ4op';
function setup(individualDefenders=false){
 let time=1000,active=true,chainFailure=false,afterRead=null;const wallet='0x'+randomBytes(32).toString('hex');
 const reader=async(i,clock,options)=>{assert.equal(options.allowLateRecovery,true);if(chainFailure)throw Error('Chain unavailable');if(afterRead)afterRead();return {digest:i.expectedDigest,wallet:i.wallet,recipient:i.recipient,coinType:TREE_TYPE,amount:i.amount,checkpoint:'123',timestampMs:i.createdAt+1};};
 const deps={database:db,individualDefenders,authorize:async context=>{if(!active||context!=='valid')throw Error('Session rejected');return {address:wallet,expiresAt:10000000};},readReceipt:reader,inspectSigned:async signed=>{if(!signed.verified)throw Error('Invalid signed bytes');return signed.digest;},decimals:async()=>6,now:()=>time};
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
 assert.deepEqual(await s.ledger.consume('valid',e.id,q.runId),{applied:true,product:'continue'});assert.deepEqual(await s.ledger.consume('valid',e.id,q.runId),{applied:false,alreadyConsumed:true,product:'continue',runId:q.runId});
 const restored=createPurchaseLedger(s.deps);assert.equal((await restored.history('valid'))[0].status,'paid');
});
test('recovery re-submits identical stored bytes and only finalized failure releases a reservation',async()=>{
 const s=setup(),q=await supply(s);const digest='11111111111111111111111111111117';await s.ledger.bind('valid',q.id,{verified:true,digest,bytes:'same-bytes',signature:'same-signature'});
 const calls=[];const ledger=createPurchaseLedger({...s.deps,executeSigned:async(signed,id)=>calls.push({signed,id}),readFailure:async()=>true});
 await ledger.submit('valid',q.id);await ledger.submit('valid',q.id);assert.deepEqual(calls[0],calls[1]);assert.equal(calls[0].signed.bytes,'same-bytes');await ledger.reconcile('valid',q.id);assert.equal((await ledger.history('valid'))[0].status,'cancelled');await assert.rejects(ledger.redeem('valid',q.id));
});

test('individual quotes bind permanent upgrades to one wallet species and numbered copy',async()=>{
 const s=setup(true);
 for(const slot of [null,-1,12,'0'])await assert.rejects(s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:slot}));
 const q=await s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:0});assert.equal(q.defenderSlot,0);assert.equal(q.amount,'5000000000');
 assert.equal((await s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:0})).id,q.id);
 await assert.rejects(s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:1}),/pending/);
 await bind(s,q,freshDigest());const a=await s.ledger.redeem('valid',q.id);const again=await s.ledger.redeem('valid',q.id);assert.equal(a.id,again.id);assert.equal(a.defender_slot,0);
 assert.deepEqual(await s.ledger.progress('valid'),{pine:1});assert.deepEqual((await s.ledger.collection('valid')).defenders,[{species:'pine',slot:0,level:2}]);
 const next=await s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:1});assert.equal(next.product,'growth:2');assert.equal(next.amount,'5000000000');await s.ledger.cancel('valid',next.id);
 const own=await s.ledger.quote('valid',{product:'growth',species:'pine',defenderSlot:0});assert.equal(own.product,'growth:3');assert.equal(own.amount,'10000000000');
});
test('individual migration preserves signed legacy purchases and durable minimum growth',async()=>{
 const legacy=setup(),q=await legacy.ledger.quote('valid',{product:'growth',species:'oak'});await bind(legacy,q,freshDigest());
 const ledger=createPurchaseLedger({...legacy.deps,individualDefenders:true});await assert.rejects(ledger.quote('valid',{product:'growth',species:'oak',defenderSlot:0}),/pending/);
 await ledger.redeem('valid',q.id);assert.deepEqual(await ledger.progress('valid'),{oak:2});
 const individual=await ledger.quote('valid',{product:'growth',species:'oak',defenderSlot:0});assert.equal(individual.product,'growth:3');
 await ledger.bind('valid',individual.id,{verified:true,digest:freshDigest()});await ledger.redeem('valid',individual.id);
 assert.deepEqual(await ledger.progress('valid'),{oak:2});assert.equal((await ledger.collection('valid')).defenders.find(d=>d.slot===0).level,3);
 const other=await ledger.quote('valid',{product:'growth',species:'oak',defenderSlot:11});assert.equal(other.product,'growth:3');
});
test('individual upgrade rollback leaves both inventory and invoice unchanged',async()=>{
 const s=setup(true),q=await s.ledger.quote('valid',{product:'growth',species:'cannon',defenderSlot:4});await bind(s,q,freshDigest());
 const broken=createPurchaseLedger({...s.deps,database:{query:(...args)=>db.query(...args),transaction:fn=>db.transaction(tx=>fn({query:(sql,args)=>{if(sql.startsWith('INSERT INTO canopy_payments.entitlements'))throw Error('Injected write failure');return tx.query(sql,args);}}))}});
 await assert.rejects(broken.redeem('valid',q.id),/write failure/);assert.equal((await s.ledger.collection('valid')).defenders[0].level,1);assert.equal((await s.ledger.history('valid'))[0].status,'bound');
});
