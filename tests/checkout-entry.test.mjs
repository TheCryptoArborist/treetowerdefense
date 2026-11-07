import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../tools/prepare-checkout-preview.mjs',import.meta.url));
test('prepared checkout entry discloses real TREE in the banner and gate while regular preview stays simulated',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'canopy-entry-'));
 try{
  const original=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
  await fs.writeFile(path.join(root,'index.html'),original);
  for(const file of ['styles.css','gateway.js'])await fs.writeFile(path.join(root,file),'');
  for(const dir of ['assets','integration/tree-arcade/canopy-preview'])await fs.mkdir(path.join(root,dir),{recursive:true});
  for(const enabled of [false,true]){
   execFileSync(process.execPath,[script],{cwd:root,env:{...process.env,CANOPY_CANONICAL_CHECKOUT_PREVIEW:String(enabled)},stdio:'pipe'});
   const html=await fs.readFile(path.join(root,'.netlify/checkout-site/play/canopy-defense/index.html'),'utf8');
   const banner=html.match(/<div class="preview-banner">(.*?)<\/div>/s)[1];
   if(enabled){
    assert.match(banner,/real TREE \+ SUI gas/);assert.doesNotMatch(banner,/simulated/);
    assert.match(html,/Checkout test purchases spend real TREE plus SUI gas/);
    assert.match(html,/NFTREE · CHECKOUT TEST/);
   }else{
    assert.match(banner,/TREE balances and purchases are simulated/);
    assert.doesNotMatch(html,/Checkout test purchases spend real TREE/);
   }
  }
  assert.equal(await fs.readFile(path.join(root,'index.html'),'utf8'),original);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('production entry has real wallet terms and no checkout-test banner, even when the preview env is inherited',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'canopy-production-entry-'));
 try{
  const original=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');await fs.writeFile(path.join(root,'index.html'),original);for(const file of ['styles.css','gateway.js'])await fs.writeFile(path.join(root,file),'');for(const dir of ['assets','integration/tree-arcade/canopy-preview'])await fs.mkdir(path.join(root,dir),{recursive:true});
  execFileSync(process.execPath,[script],{cwd:root,env:{...process.env,CANOPY_PRODUCTION_CANDIDATE:'true',CANOPY_CANONICAL_CHECKOUT_PREVIEW:'true'},stdio:'pipe'});
  const html=await fs.readFile(path.join(root,'.netlify/checkout-site/play/canopy-defense/index.html'),'utf8'),banner=html.match(/<div class="preview-banner">(.*?)<\/div>/s)[1];assert.match(banner,/NFTREE HOLDER GAME/);assert.doesNotMatch(banner,/simulated|DEVELOPMENT PREVIEW|CHECKOUT TEST/);assert.match(html,/Optional purchases transfer real TREE plus SUI network gas/);assert.match(html,/id="mode-dialog"/);assert.match(html,/Christmas Chaos/);assert.match(html,/not playable yet/);assert.equal(await fs.readFile(path.join(root,'index.html'),'utf8'),original);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
