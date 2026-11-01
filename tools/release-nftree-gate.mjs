import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const siteId='aa62f324-b880-47d6-85b8-4ba0700ff5bf';
const origin='https://tree-token.xyz', prefix='/play/canopy-defense/';
const statePath='.netlify/nftree-gate-release.json';
const mode=process.argv[2];
assert(['prepare','candidate','verify','publish'].includes(mode),'Use prepare|candidate|verify|publish');
let token=process.env.NETLIFY_AUTH_TOKEN;
if(!token){const config=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.config/netlify/config.json')));const auth=config.users[config.userId].auth;token=typeof auth==='string'?auth:auth.token;}
assert(token,'Netlify authentication unavailable');
async function api(route,method='GET',body){const r=await fetch('https://api.netlify.com/api/v1/'+route,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});assert(r.ok,`${method} ${route}: ${r.status}`);return r.json();}
async function inventory(id){const all=[];for(let page=1;;page++){const rows=await api(`deploys/${id}/files?per_page=100&page=${page}`);all.push(...rows);if(rows.length<100)break;}return Object.fromEntries(all.map(f=>[f.path,f.sha]));}
const sha=bytes=>crypto.createHash('sha1').update(bytes).digest('hex');
const identities=functions=>functions.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>!['c'].includes(k)))).sort((a,b)=>a.n.localeCompare(b.n));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
function save(state){fs.mkdirSync('.netlify',{recursive:true});fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n');}
async function overlays(){return {'/play/index.html':'integration/tree-arcade/lobby.html','/play/canopy-defense/index.html':'index.html','/play/canopy-defense/gateway.js':'gateway.js','/play/canopy-defense/preview/index.html':'integration/tree-arcade/canopy-preview/index.html'};}
const addition=JSON.parse(fs.readFileSync('.netlify/canopy-functions/manifest.json')).functions[0];
const newDigest=crypto.createHash('sha256').update(fs.readFileSync(addition.path)).digest('hex');
async function verifyCurrent(state){const site=await api('sites/'+siteId);assert.equal(site.published_deploy.id,state.baseline,'Production changed; prepare against the new live release');const live=await api('deploys/'+state.baseline);assert.equal(live.locked,true);assert.deepEqual(await inventory(live.id),state.originalFiles);assert.deepEqual(identities(live.available_functions),identities(state.functions));assert.deepEqual(live.function_schedules,state.schedules);return live;}
async function verifyCandidate(state){const d=await api('deploys/'+state.candidate);assert.equal(d.state,'ready');assert.deepEqual(await inventory(d.id),state.files);assert.deepEqual(identities(d.available_functions.filter(f=>f.n!=='canopy-access')),identities(state.functions),'Backend identity/configuration changed');assert.deepEqual(d.function_schedules,state.schedules);for(const key of ['functions_region','functions_region_overrides','server','edge_functions_present'])assert.deepEqual(key==='functions_region_overrides'?d[key].filter(f=>f.name!=='canopy-access'):d[key],state.runtime[key],`Runtime changed: ${key}`);const added=d.available_functions.find(f=>f.n==='canopy-access');assert.equal(added?.d,state.newDigest);assert.equal(added?.r,'nodejs22.x');assert.equal(added?.im,'stream');assert.equal(d.available_functions.length,state.functions.length+1);return d;}
if(mode==='prepare'){
 const site=await api('sites/'+siteId),live=await api('deploys/'+site.published_deploy.id);assert.equal(live.locked,true);assert.equal(live.available_functions.length,40);assert.equal(live.function_schedules.length,5);
 const files=await inventory(live.id),originalFiles={...files};assert(files[prefix+'index.html'],'Game path missing');
 assert(!live.available_functions.some(f=>f.n==='canopy-access'),'Gate already exists; prepare a reviewed update instead');
 for(const p of Object.keys(files))if(p.startsWith(prefix+'src/'))delete files[p];
 const sources=await overlays();for(const[p,file]of Object.entries(sources))files[p]=sha(fs.readFileSync(file));
 const state={newDigest,baseline:live.id,originalFiles,files,sources,functions:live.available_functions,schedules:live.function_schedules,runtime:Object.fromEntries(['functions_region','functions_region_overrides','server','edge_functions_present'].map(k=>[k,live[k]]))};save(state);
 console.log(JSON.stringify({baseline:live.id,existingFiles:Object.keys(originalFiles).length,gameFiles:Object.keys(sources).length-1,functions:state.functions.length,schedules:state.schedules.length}));
}else{
 const state=JSON.parse(fs.readFileSync(statePath));
 if(mode==='candidate'){
  await verifyCurrent(state);assert.equal(git('status','--porcelain'),'','Commit source before release');
  assert(!state.candidate,'A candidate already exists; verify it');state.commit=git('rev-parse','HEAD');
  for(const[p,file]of Object.entries(state.sources))assert.equal(sha(fs.readFileSync(file)),state.files[p]);
  const configs={};for(const f of state.functions){const c={};for(const[a,b]of Object.entries({dn:'display_name',g:'generator',bd:'build_data',m:'memory',p:'priority',rg:'region',tr:'traffic_rules',es:'event_subscriptions'}))if(f[a]!=null)c[b]=f[a];if(f.ro)c.routes=f.ro.map(r=>Object.fromEntries(Object.entries({pattern:r.p,literal:r.l,expression:r.e,methods:r.m,prefer_static:r.ps}).filter(([,v])=>v!=null)));configs[f.n]=c;}
  assert.equal(state.newDigest,newDigest,'Gate package changed');
  configs['canopy-access']={build_data:addition.buildData,priority:addition.priority,routes:addition.routes,traffic_rules:{action:{type:'rate_limit',config:{aggregate:{keys:[{type:'domain'},{type:'ip'}]},rate_limit_config:{window_limit:90,window_size:60,algorithm:'sliding_window'}}}}};
  const d=await api('sites/'+siteId+'/deploys?title=Canopy%20Defense%20verified%20NFTree%20access','POST',{files:state.files,functions:{...Object.fromEntries(state.functions.map(f=>[f.n,f.d])),'canopy-access':newDigest},functions_config:configs,function_schedules:state.schedules,draft:false,async:false,branch:'main',commit_ref:state.commit});
  state.candidate=d.id;save(state);assert((d.required_functions||[]).every(digest=>digest===newDigest),'Refuse unrelated backend uploads');
  if(d.required_functions?.length){const r=await fetch('https://api.netlify.com/api/v1/deploys/'+d.id+'/functions/canopy-access?runtime=nodejs22.x&invocation_mode=stream',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream'},body:fs.readFileSync(addition.path)});assert(r.ok,'Gate upload failed '+r.status);}assert.equal(d.required_edge_functions?.length||0,0);assert.equal(d.required_server?.length||0,0);
  const required=d.required||[];for(let i=0;i<required.length;i+=4)await Promise.all(required.slice(i,i+4).map(async digest=>{const entry=Object.entries(state.sources).find(([p])=>state.files[p]===digest);assert(entry,'Refuse to reconstruct unrelated live files');const[p,file]=entry;const r=await fetch('https://api.netlify.com/api/v1/deploys/'+d.id+'/files'+p,{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream'},body:fs.readFileSync(file)});assert(r.ok,'Upload failed '+p+' '+r.status);}));
  console.log(JSON.stringify({candidate:d.id,uploaded:required.length,commit:state.commit}));
 }else{
  const candidate=await verifyCandidate(state);await verifyCurrent(state);
  if(mode==='publish'){
   // Locking a newly verified candidate publishes it and retains automatic-publish protection.
   await api('deploys/'+candidate.id+'/lock','POST');
   console.log(JSON.stringify({publishing:candidate.id}));
  }else console.log(JSON.stringify({verified:candidate.id,functionsPreserved:state.functions.length,schedulesPreserved:state.schedules.length,files:Object.keys(state.files).length}));
 }
}
