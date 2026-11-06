import test from 'node:test';import assert from 'node:assert/strict';
import {waitForForestArt} from '../src/asset-loading.js';
const ready=()=>({environment:Promise.resolve({loaded:['terrain','tree','road']}),defenders:Promise.resolve({loaded:['oak','pine','palm','cypress','mushroom']}),aim:Promise.resolve({loaded:['oak','pine','palm','cypress','mushroom','willow']}),structures:Promise.resolve({loaded:['watchtower','cannon']}),enemies:Promise.resolve(true)});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('finished art waits for the last slow download and sprite preparation, not an arbitrary delay',async()=>{
 const art=ready(),slow=deferred();art.aim=slow.promise;let finished=false;
 const pending=waitForForestArt(art).then(()=>{finished=true;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(finished,false);
 slow.resolve({loaded:['oak','pine','palm','cypress','mushroom','willow']});await pending;assert.equal(finished,true);
});
test('warm-cache graphics finish immediately and clear the loading deadline',async()=>{
 let cleared=false;
 await waitForForestArt(ready(),{setTimer:()=>17,clearTimer:id=>{assert.equal(id,17);cleared=true;}});assert(cleared);
});
test('failed or partially prepared art cannot reveal the fallback battlefield',async()=>{
 for(const [group,value] of [['environment',{loaded:['terrain','tree']}],['aim',{loaded:['oak']}],['enemies',false]]){
  const art=ready();art[group]=Promise.resolve(value);
  await assert.rejects(waitForForestArt(art),error=>error.code==='CANOPY_ART_NOT_READY');
 }
 const art=ready();art.defenders=Promise.reject(new Error('private download detail'));
 await assert.rejects(waitForForestArt(art),error=>error.code==='CANOPY_ART_NOT_READY'&&!error.message.includes('private'));
});
test('a stalled image reaches a retryable deadline; late completion cannot restart entry',async()=>{
 const art=ready(),slow=deferred();art.environment=slow.promise;let expire,cleared=false;
 const pending=waitForForestArt(art,{setTimer:fn=>{expire=fn;return 1;},clearTimer:()=>{cleared=true;}});
 expire();await assert.rejects(pending,error=>error.code==='CANOPY_ART_NOT_READY');assert(cleared);
 slow.resolve({loaded:['terrain','tree','road']});await new Promise(resolve=>setImmediate(resolve));
});
