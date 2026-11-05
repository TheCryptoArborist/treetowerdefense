import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {validateZip} from './zip.mjs';
export async function stageCanopyPackage({packageDir,dist}){
 const manifest=JSON.parse(await fs.readFile(path.join(packageDir,'manifest.json'),'utf8'));
 assert.equal(manifest.functions.length,1,'Only the isolated Canopy package may be staged');
 const fn=manifest.functions[0];assert.equal(fn.name,'canopy-access');assert.equal(fn.invocationMode,'stream');assert.equal(fn.runtimeVersion,'nodejs22.x');
 const bytes=await fs.readFile(path.join(packageDir,'canopy-access.zip'));
 const names=validateZip(bytes);assert(names.has('___netlify-entry-point.mjs'));assert(names.has('netlify/functions/canopy-access.mjs'));
 const target=path.resolve(dist,'canopy-access.zip');await fs.mkdir(dist,{recursive:true});
 await fs.writeFile(target,bytes);
 validateZip(await fs.readFile(target));
 // Keep the pinned compiler's routes, rate limit and runtime metadata with its ZIP.
 await fs.writeFile(path.join(dist,'manifest.json'),JSON.stringify({...manifest,timestamp:Date.now(),functions:[{...fn,path:target}]}));
 return {bytes:bytes.length,entries:names.size};
}
