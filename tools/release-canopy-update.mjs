// Preserve the currently published site; update only the normal Canopy rewrite.
// Authentication stays inside the official CLI. No credential files are read.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {preservedFunctionConfig} from './netlify-function-config.mjs';
const cli=process.env.NETLIFY_CLI_PATH,site='aa62f324-b880-47d6-85b8-4ba0700ff5bf';
assert(cli,'Provide the official NETLIFY_CLI_PATH');
const api=(name,data)=>JSON.parse(execFileSync(cli,['api',name,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:12e6}));
const statePath='.netlify/canopy-update-release.json';
const hash=s=>crypto.createHash('sha1').update(s).digest('hex');
const inventory=()=>Object.fromEntries(api('listSiteFiles',{site_id:site}).map(f=>[f.path,f.sha]));
const runtime=d=>Object.fromEntries(['functions_region','functions_region_overrides','server','edge_functions_present'].map(k=>[k,d[k]]));
const identity=f=>f.map(x=>Object.fromEntries(Object.entries(x).filter(([k])=>k!=='c'))).sort((a,b)=>a.n.localeCompare(b.n));
const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n');
function baseline(s){const live=api('getSite',{site_id:site}).published_deploy;assert.equal(live.id,s.baseline,'Live site changed; prepare again');assert.equal(live.locked,true);assert.deepEqual(inventory(),s.originalFiles);}
function verified(s){const d=api('getDeploy',{deploy_id:s.candidate});assert.equal(d.state,'ready');assert.deepEqual(identity(d.available_functions),identity(s.functions));assert.deepEqual(d.function_schedules,s.schedules);assert.deepEqual(runtime(d),s.runtime);for(const k of ['required','required_functions','required_edge_functions','required_server'])assert.equal(d[k]?.length||0,0);return d;}
const mode=process.argv[2];assert(['prepare','candidate','verify','publish','verify-live'].includes(mode));
if(mode==='prepare'){
 const upstream=process.argv[3];assert(/^[a-f0-9]{24}$/.test(upstream));
 const u=api('getDeploy',{deploy_id:upstream});assert.equal(u.state,'ready');assert.equal(u.available_functions.length,1);assert.equal(u.available_functions[0].r,'nodejs24.x');assert.equal(u.available_functions[0].im,'stream');assert.equal(u.available_functions[0].ro.length,3);
 const d=api('getDeploy',{deploy_id:api('getSite',{site_id:site}).published_deploy.id});assert.equal(d.locked,true);
 const originalFiles=inventory(),old=fs.readFileSync('.netlify/audio-baseline-redirects','utf8');assert.equal(hash(old),originalFiles['/_redirects'],'Existing rewrite content must match exactly');
 const rules=old.split('\n');assert.equal(rules.filter(l=>l.startsWith('/play/canopy-defense/* ')).length,1);
 const rewrite=rules.map(l=>l.startsWith('/play/canopy-defense/* ')?`/play/canopy-defense/* https://${upstream}--tree-token.netlify.app/play/canopy-defense/:splat 200!`:l).join('\n');
 const s={baseline:d.id,upstream,originalFiles,files:{...originalFiles,'/_redirects':hash(rewrite)},rewrite,functions:d.available_functions,schedules:d.function_schedules,runtime:runtime(d)};save(s);
 console.log(JSON.stringify({baseline:s.baseline,upstream,filesPreserved:Object.keys(originalFiles).length,functionsPreserved:s.functions.length,schedulesPreserved:s.schedules.length}));
}else{
 const s=JSON.parse(fs.readFileSync(statePath));
 if(mode==='candidate'){
  baseline(s);assert(!s.candidate);
  const d=api('createSiteDeploy',{site_id:site,title:'Canopy Defense audio, root clarity and home navigation',body:{files:s.files,functions:Object.fromEntries(s.functions.map(f=>[f.n,f.d])),functions_config:Object.fromEntries(s.functions.map(f=>[f.n,preservedFunctionConfig(f)])),function_schedules:s.schedules,draft:false,async:false,branch:'main'}});s.candidate=d.id;save(s);
  for(const k of ['required_functions','required_edge_functions','required_server'])assert.equal(d[k]?.length||0,0,'Refuse unrelated runtime uploads');
  for(const h of d.required||[]){assert.equal(h,hash(s.rewrite));api('uploadDeployFile',{deploy_id:d.id,path:'_redirects',body:s.rewrite});}
  console.log(JSON.stringify({candidate:s.candidate}));
 }else if(mode==='verify-live'){
  const d=api('getSite',{site_id:site}).published_deploy;assert.equal(d.id,s.candidate);assert.equal(d.locked,true);assert.deepEqual(inventory(),s.files);verified(s);console.log(JSON.stringify({published:s.candidate,upstream:s.upstream,filesPreserved:Object.keys(s.files).length,functionsPreserved:s.functions.length,schedulesPreserved:s.schedules.length}));
 }else{
  baseline(s);verified(s);
  if(mode==='publish')api('lockDeploy',{deploy_id:s.candidate});
  console.log(JSON.stringify({[mode==='publish'?'published':'verified']:s.candidate}));
 }
}
