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
