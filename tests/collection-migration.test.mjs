import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {NetlifyDB} from '@netlify/database-dev';
test('additive collection migration preserves existing purchases and seeds twelve numbered defenders',async()=>{
 const db=new NetlifyDB({logger:()=>{}}),directory=await mkdtemp(join(tmpdir(),'canopy-migration-'));await db.start();
 try{
  for(const file of ['20261101023000_canopy_payments.sql','20261101040000_checkout_recovery.sql'])await writeFile(join(directory,file),await readFile('netlify/database/migrations/'+file));
  await db.applyMigrations(directory);
  const wallet='0x'+'1'.repeat(64);await db.query('INSERT INTO canopy_payments.accounts(wallet,created_at) VALUES($1,0)',[wallet]);
  await db.query("INSERT INTO canopy_payments.growth(wallet,species,level) VALUES($1,'oak',2),($1,'pine',3)",[wallet]);
  const before=await db.query('SELECT * FROM canopy_payments.growth ORDER BY species');
  await writeFile(join(directory,'20261101210000_individual_defenders.sql'),await readFile('netlify/database/migrations/20261101210000_individual_defenders.sql'));
  await db.applyMigrations(directory);
  assert.deepEqual((await db.query('SELECT * FROM canopy_payments.growth ORDER BY species')).rows,before.rows);
  const copies=(await db.query('SELECT species,slot,level FROM canopy_payments.defenders ORDER BY species,slot')).rows;
  assert.equal(copies.length,24);assert.deepEqual(copies.filter(d=>d.species==='oak').map(d=>d.level),Array(12).fill(2));assert.deepEqual(copies.filter(d=>d.species==='pine').map(d=>d.slot),Array.from({length:12},(_,i)=>i));
 }finally{await db.stop();await rm(directory,{recursive:true,force:true});}
});
