import test from 'node:test';
import assert from 'node:assert/strict';
import {preservedFunctionConfig} from '../tools/netlify-function-config.mjs';
test('inherited memory and region stay inherited while explicit overrides are preserved',()=>{
 const base={n:'canopy-access',m:1024,rg:'us-east-2',p:10,bd:{runtimeAPIVersion:2},ro:[{p:'/protected/*',e:'expression',m:[],ps:false}],tr:{action:{type:'rate_limit'}}};
 const inherited=preservedFunctionConfig(base);assert.equal(Object.hasOwn(inherited,'memory'),false);assert.equal(Object.hasOwn(inherited,'region'),false);
 assert.deepEqual(inherited.routes,[{pattern:'/protected/*',expression:'expression',methods:[],prefer_static:false}]);assert.deepEqual(inherited.traffic_rules,base.tr);
 const explicit=preservedFunctionConfig({...base,mo:2048,rgo:'eu-west-2'});assert.equal(explicit.memory,2048);assert.equal(explicit.region,'eu-west-2');assert.deepEqual(explicit.build_data,base.bd);
});
