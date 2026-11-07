// Preservation-only promotion. Credentials remain inside the official CLI.
import {requireProductionAcceptance} from './production-acceptance.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {preservedFunctionConfig} from './netlify-function-config.mjs';
const siteId='aa62f324-b880-47d6-85b8-4ba0700ff5bf',statePath='.netlify/canopy-production-release.json',folder='integration/tree-arcade/production-launch/';
const mode=process.argv[2];assert(['prepare','candidate','verify','publish','verify-live'].includes(mode));
const api=(name,data)=>JSON.parse(execFileSync(process.env.NETLIFY_CLI_PATH||'npx',[...(process.env.NETLIFY_CLI_PATH?[]:['--yes','netlify-cli']),'api',name,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:8e6}));
const digest=s=>crypto.createHash('sha1').update(s).digest('hex');const inventory=()=>Object.fromEntries(api('listSiteFiles',{site_id:siteId}).map(f=>[f.path,f.sha]));const save=s=>fs.writeFileSync(statePath,JSON.stringify(s,null,2)+'\n');
const parked='/play/canopy-defense/legacy-disabled/*';
const identity=functions=>functions.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>k!=='c'&&!(f.n==='canopy-access'&&k==='ro')))).sort((a,b)=>a.n.localeCompare(b.n));
function current(s){const d=api('getSite',{site_id:siteId}).published_deploy;assert.equal(d.id,s.baseline,'Production changed; prepare again from the current site');assert.equal(d.locked,true);assert.deepEqual(inventory(),s.originalFiles);}
function verify(s){const d=api('getDeploy',{deploy_id:s.candidate});assert.equal(d.state,'ready');assert.deepEqual(identity(d.available_functions),identity(s.functions));assert.deepEqual(d.function_schedules,s.schedules);for(const key of Object.keys(s.runtime))assert.deepEqual(d[key],s.runtime[key],key);const canopy=d.available_functions.find(f=>f.n==='canopy-access');assert.equal(canopy.ro.length,1);assert.equal(canopy.ro[0].p,parked);for(const field of ['required','required_functions','required_edge_functions','required_server'])assert.equal(d[field]?.length||0,0);return d;}
if(mode==='prepare'){
 const upstream=process.argv[3];assert(/^[a-f0-9]{24}$/.test(upstream));const plan=JSON.parse(fs.readFileSync(folder+'plan.json'));const site=api('getSite',{site_id:siteId}),d=api('getDeploy',{deploy_id:site.published_deploy.id});assert.equal(d.locked,true);assert(!d.edge_functions_present&&!d.server);assert(d.available_functions.some(f=>f.n==='canopy-access'));
 const originalFiles=inventory();assert.equal(originalFiles['/play/index.html'],plan.baseLobbySha1,'Arcade changed; regenerate only its Canopy card before preparing');
 const receipt=JSON.parse(fs.readFileSync('integration/tree-arcade/checkout-preview-receipt.json'));const old=receipt.canonicalRouting.upstreamDeployId;const existing=`/play/canopy-defense/checkout-test/* https://${old}--tree-token.netlify.app/play/canopy-defense/:splat 200!\n`;
 assert.equal(originalFiles['/_redirects'],digest(existing),'Review existing redirects before extending');
 const rewrite=existing+`/play/canopy-defense/* https://${upstream}--tree-token.netlify.app/play/canopy-defense/:splat 200!\n`;const lobby=fs.readFileSync(folder+'lobby.html','utf8');assert.equal(digest(lobby),plan.lobbySha1);
 const files={...originalFiles,'/_redirects':digest(rewrite),'/play/index.html':digest(lobby)};
 const s={baseline:d.id,upstream,originalFiles,files,rewrite,lobby,functions:d.available_functions,schedules:d.function_schedules,runtime:Object.fromEntries(['functions_region','functions_region_overrides','server','edge_functions_present'].map(k=>[k,d[k]]))};save(s);
 console.log(JSON.stringify({baseline:s.baseline,filesRetained:Object.keys(originalFiles).length,functionsRetained:s.functions.length,unrelatedFunctionsPreserved:s.functions.length-1,schedulesPreserved:s.schedules.length,changedFiles:['/_redirects','/play/index.html'],legacyCanopyRouteChange:parked}));
}else{
 const s=JSON.parse(fs.readFileSync(statePath));
 if(mode==='candidate'){
  current(s);assert(!s.candidate);const configs=Object.fromEntries(s.functions.map(f=>[f.n,preservedFunctionConfig(f)]));configs['canopy-access'].routes=[{pattern:parked,prefer_static:false}];
  const d=api('createSiteDeploy',{site_id:siteId,title:'Canopy Defense production launch candidate',body:{files:s.files,functions:Object.fromEntries(s.functions.map(f=>[f.n,f.d])),functions_config:configs,function_schedules:s.schedules,draft:false,async:false,branch:'main'}});s.candidate=d.id;save(s);
  assert.equal(d.required_functions?.length||0,0);assert.equal(d.required_edge_functions?.length||0,0);assert.equal(d.required_server?.length||0,0);
  for(const hash of d.required||[]){const path=hash===digest(s.rewrite)?'_redirects':hash===digest(s.lobby)?'play/index.html':null;assert(path,'Refuse unrelated file upload');api('uploadDeployFile',{deploy_id:d.id,path,body:path==='_redirects'?s.rewrite:s.lobby});}
  console.log(JSON.stringify({candidate:s.candidate}));
 }else if(mode==='verify-live'){
  const d=api('getSite',{site_id:siteId}).published_deploy;assert.equal(d.id,s.candidate);assert.equal(d.locked,true);assert.deepEqual(inventory(),s.files);verify(s);console.log(JSON.stringify({published:s.candidate,filesRetained:Object.keys(s.originalFiles).length,functionsRetained:s.functions.length,unrelatedFunctionsPreserved:s.functions.length-1,schedulesPreserved:s.schedules.length}));
 }else{
  current(s);verify(s);
  if(mode==='publish'){
   const receipt=JSON.parse(fs.readFileSync(folder+'candidate-receipt.json'));assert.equal(receipt.status,'candidate-verified-awaiting-wallet-acceptance','Production candidate is superseded; prepare and verify the current game before publishing');assert.equal(receipt.siteCandidateDeployId,s.candidate);
   const proof=JSON.parse(fs.readFileSync(folder+'wallet-acceptance.json'));requireProductionAcceptance(proof);
   api('lockDeploy',{deploy_id:s.candidate});
  }
  console.log(JSON.stringify({[mode==='publish'?'published':'verified']:s.candidate,liveWalletAcceptance:mode==='publish'?'accepted':'pending'}));
 }
}
