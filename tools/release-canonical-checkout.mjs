// Add one same-origin preview rewrite without rebuilding or replacing arcade backends.
// Authentication stays inside the official Netlify CLI; never read its token files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const siteId='aa62f324-b880-47d6-85b8-4ba0700ff5bf';
const statePath='.netlify/canonical-checkout-release.json';
const mode=process.argv[2];
assert(['prepare','candidate','verify','publish','verify-live'].includes(mode));
const api=(method,data)=>JSON.parse(execFileSync('npx',['--yes','netlify-cli','api',method,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:8e6}));
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n');
const inventory=()=>Object.fromEntries(api('listSiteFiles',{site_id:siteId}).map(f=>[f.path,f.sha]));
const identity=functions=>functions.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>k!=='c'))).sort((a,b)=>a.n.localeCompare(b.n));
const digest=s=>crypto.createHash('sha1').update(s).digest('hex');
function current(s){const site=api('getSite',{site_id:siteId});assert.equal(site.published_deploy.id,s.baseline,'Production changed; prepare again');assert.equal(site.published_deploy.locked,true);assert.deepEqual(inventory(),s.originalFiles);}
function verify(s){const d=api('getDeploy',{deploy_id:s.candidate});assert.equal(d.state,'ready');assert.deepEqual(identity(d.available_functions),identity(s.functions));assert.deepEqual(d.function_schedules,s.schedules);for(const k of Object.keys(s.runtime))assert.deepEqual(d[k],s.runtime[k],`Changed ${k}`);assert.equal(d.required?.length,0);assert.equal(d.required_functions?.length,0);assert.equal(d.required_edge_functions?.length,0);assert.equal(d.required_server?.length,0);assert(d.summary.messages.some(m=>m.title==='1 redirect rule processed'),'Expected one rewrite');return d;}
if(mode==='prepare'){
 const upstream=process.argv[3];assert(/^[a-f0-9]{24}$/.test(upstream));
 const site=api('getSite',{site_id:siteId}),d=api('getDeploy',{deploy_id:site.published_deploy.id});
 assert.equal(d.locked,true);assert.equal(d.available_functions.length,41);assert.equal(d.function_schedules.length,5);assert(!d.edge_functions_present);assert(!d.server);
 const originalFiles=inventory();assert(!originalFiles['/_redirects'],'Review existing redirects before overlay');assert(Object.keys(originalFiles).length>250);
 const rewrite=`/play/canopy-defense/checkout-test/* https://${upstream}--tree-token.netlify.app/play/canopy-defense/:splat 200!\n`;
 const s={baseline:d.id,upstream,originalFiles,files:{...originalFiles,'/_redirects':digest(rewrite)},rewrite,functions:d.available_functions,schedules:d.function_schedules,runtime:Object.fromEntries(['functions_region','functions_region_overrides','server','edge_functions_present'].map(k=>[k,d[k]]))};save(s);
 console.log(JSON.stringify({baseline:s.baseline,filesPreserved:Object.keys(originalFiles).length,functionsPreserved:s.functions.length,schedulesPreserved:s.schedules.length}));
}else{
 const s=JSON.parse(fs.readFileSync(statePath));
 if(mode==='candidate'){
  current(s);assert(!s.candidate);
  const configs={};for(const f of s.functions){const c={};for(const[a,b]of Object.entries({dn:'display_name',g:'generator',bd:'build_data',m:'memory',p:'priority',rg:'region',tr:'traffic_rules',es:'event_subscriptions'}))if(f[a]!=null)c[b]=f[a];if(f.ro)c.routes=f.ro.map(r=>Object.fromEntries(Object.entries({pattern:r.p,literal:r.l,expression:r.e,methods:r.m,prefer_static:r.ps}).filter(([,v])=>v!=null)));configs[f.n]=c;}
  const d=api('createSiteDeploy',{site_id:siteId,title:'Canopy checkout preview under TREE Arcade',deploy:{files:s.files,functions:Object.fromEntries(s.functions.map(f=>[f.n,f.d])),functions_config:configs,function_schedules:s.schedules,draft:false,async:false,branch:'main'}});
  s.candidate=d.id;save(s);assert.equal(d.required_functions?.length||0,0);assert.equal(d.required_edge_functions?.length||0,0);assert.equal(d.required_server?.length||0,0);assert.deepEqual(d.required,[digest(s.rewrite)]);
  api('uploadDeployFile',{deploy_id:d.id,path:'_redirects',file_body:s.rewrite});console.log(JSON.stringify({candidate:d.id,changedFiles:1}));
 }else if(mode==='verify-live'){
  const site=api('getSite',{site_id:siteId});assert.equal(site.published_deploy.id,s.candidate);assert.equal(site.published_deploy.locked,true);assert.deepEqual(inventory(),s.files);verify(s);console.log(JSON.stringify({published:s.candidate,filesPreserved:Object.keys(s.originalFiles).length,functionsPreserved:s.functions.length,schedulesPreserved:s.schedules.length}));
 }else{
  current(s);verify(s);
  if(mode==='publish')api('lockDeploy',{deploy_id:s.candidate});
  console.log(JSON.stringify({[mode==='publish'?'published':'verified']:s.candidate}));
 }
}
