// Single static overlay; existing backends are referenced by their published digests.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {preservedFunctionConfig} from './netlify-function-config.mjs';
const siteId='aa62f324-b880-47d6-85b8-4ba0700ff5bf',statePath='.netlify/cabinet-scene-release.json',source='integration/tree-arcade/cabinet-scene-lobby.html',mode=process.argv[2];
assert(['prepare','candidate','publish','verify-live'].includes(mode));
const api=(method,data)=>JSON.parse(execFileSync('npx',['--yes','netlify-cli','api',method,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:12e6}));
const sha=s=>crypto.createHash('sha1').update(s).digest('hex');
const inventory=()=>Object.fromEntries(api('listSiteFiles',{site_id:siteId}).map(f=>[f.path,f.sha]));
const identity=f=>f.map(v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='c'))).sort((a,b)=>a.n.localeCompare(b.n));
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n');
function current(s){const site=api('getSite',{site_id:siteId});assert.equal(site.published_deploy.id,s.baseline,'Live release changed; stop');assert.equal(site.published_deploy.locked,true);assert.deepEqual(inventory(),s.originalFiles);}
function verify(s){const d=api('getDeploy',{deploy_id:s.candidate});assert.equal(d.state,'ready');assert.deepEqual(identity(d.available_functions),identity(s.functions));assert.deepEqual(d.function_schedules,s.schedules);for(const k of Object.keys(s.runtime))assert.deepEqual(d[k],s.runtime[k]);assert.equal(d.required?.length||0,0);assert.equal(d.required_functions?.length||0,0);assert.equal(d.required_edge_functions?.length||0,0);assert.equal(d.required_server?.length||0,0);}
if(mode==='prepare'){
 const site=api('getSite',{site_id:siteId}),d=api('getDeploy',{deploy_id:site.published_deploy.id});assert(d.locked);assert(d.available_functions.length>=41);assert.equal(d.function_schedules.length,5);assert(!d.edge_functions_present&&!d.server);
 const originalFiles=inventory();assert(Object.keys(originalFiles).length>250);
 const r=await fetch(`https://${d.id}--tree-token.netlify.app/play/`);assert(r.ok);const served=await r.text();
 const variants=[served,served.replace(/<script id="tree-arcade-arboretum-link">[\s\S]*?<\/script>/,'')];
 const old=variants.find(v=>sha(v)===originalFiles['/play/index.html']);assert(old,'Served lobby does not match deployed bytes');
 const before='<img class="poster-art" src="/play/canopy-defense/assets/brand/oak-guardian-preview.png" alt="Oak guardian from Canopy Defense — Guardian growth level" width="512" height="512" loading="lazy" decoding="async">';
 const after='<img class="poster-art" src="/play/canopy-defense/checkout-test/assets/brand/canopy-home-scene.webp" alt="Oak Guardian and Archer Watchtower defending the Tree of Life against insect invaders" width="1254" height="1254" loading="lazy" decoding="async">';
 assert.equal(old.split(before).length,2,'Expected exactly one Canopy artwork');const html=old.replace(before,after);assert.equal(html.replace(after,before),old);fs.writeFileSync(source,html);
 const files={...originalFiles,'/play/index.html':sha(html)};
 const s={baseline:d.id,originalFiles,files,functions:d.available_functions,schedules:d.function_schedules,runtime:Object.fromEntries(['functions_region','functions_region_overrides','server','edge_functions_present'].map(k=>[k,d[k]]))};save(s);console.log(JSON.stringify({baseline:d.id,filesPreserved:Object.keys(originalFiles).length,functionsPreserved:s.functions.length,schedulesPreserved:5}));
}else{
 const s=JSON.parse(fs.readFileSync(statePath));
 if(mode==='candidate'){
  current(s);assert(!s.candidate);const html=fs.readFileSync(source,'utf8');assert.equal(sha(html),s.files['/play/index.html']);
  const d=api('createSiteDeploy',{site_id:siteId,title:'Canopy Defense cabinet forest scene',body:{files:s.files,functions:Object.fromEntries(s.functions.map(f=>[f.n,f.d])),functions_config:Object.fromEntries(s.functions.map(f=>[f.n,preservedFunctionConfig(f)])),function_schedules:s.schedules,draft:false,async:false,branch:'main'}});s.candidate=d.id;save(s);
  assert.equal(d.required_functions?.length||0,0);assert.equal(d.required_edge_functions?.length||0,0);assert.equal(d.required_server?.length||0,0);assert((d.required||[]).every(hash=>hash===sha(html)));
  if(d.required?.length)api('uploadDeployFile',{deploy_id:d.id,path:'play/index.html',body:html});console.log(JSON.stringify({candidate:d.id,changedFiles:1}));
 }else if(mode==='publish'){current(s);verify(s);api('lockDeploy',{deploy_id:s.candidate});console.log(JSON.stringify({published:s.candidate}));}
 else{const site=api('getSite',{site_id:siteId});assert.equal(site.published_deploy.id,s.candidate);assert(site.published_deploy.locked);assert.deepEqual(inventory(),s.files);verify(s);console.log(JSON.stringify({published:s.candidate,functionsPreserved:s.functions.length,schedulesPreserved:5,changedFiles:1}));}
}
