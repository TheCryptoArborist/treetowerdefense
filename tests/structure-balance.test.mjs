import test from 'node:test';import assert from 'node:assert/strict';
import {structureTrial} from '../tools/structure-balance-audit.mjs';
test('stacking owned Ancient structures alone cannot clear any Veteran forest',()=>{
 for(let chapter=0;chapter<3;chapter++)for(const profile of ['heldWatch','watchOnly','cannonOnly'])assert.equal(structureTrial({chapter,difficulty:'veteran',level:3,profile}).outcome,'defeat',`${chapter} ${profile}`);
});
test('adapted mixed structure and guardian counterplay clears all Veteran forests, including reloads',()=>{
 for(let chapter=0;chapter<3;chapter++){
  const options={chapter,difficulty:'veteran',level:3,profile:'adapted'},r=structureTrial(options);
  assert.equal(r.outcome,'victory');assert.ok(r.health>0);assert.deepEqual(structureTrial({...options,reload:true}),r);
 }
});
test('mixed Sapling teams can still clear all standard forests with earned Sap and no consumables',()=>{
 for(let chapter=0;chapter<3;chapter++)assert.equal(structureTrial({chapter,difficulty:'standard',level:1,profile:'mixed'}).outcome,'victory');
});
