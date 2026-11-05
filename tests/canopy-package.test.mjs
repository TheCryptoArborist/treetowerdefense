import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {deflateRawSync} from 'node:zlib';
import CRC32 from 'crc-32';
import {validateZip} from '../tools/netlify-canopy-package/zip.mjs';
import {stageCanopyPackage} from '../tools/netlify-canopy-package/stage.mjs';
function zip(){
 const names=['___netlify-entry-point.mjs','netlify/functions/canopy-access.mjs'];let offset=0;const entries=[],directory=[];
 for(const name of names){const n=Buffer.from(name),plain=Buffer.from('export default ()=>new Response("fixture");'),data=deflateRawSync(plain),crc=CRC32.buf(plain)>>>0;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(plain.length,22);local.writeUInt16LE(n.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(plain.length,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);
  entries.push(local,n,data);directory.push(central,n);offset+=local.length+n.length+data.length;
 }
 const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(names.length,8);end.writeUInt16LE(names.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...entries,cd,end]);
}
test('upload validator rejects incomplete archives and corrupt entry data',()=>{
 const good=zip();assert.equal(validateZip(good).size,2);assert.throws(()=>validateZip(good.subarray(0,good.length-3)),/Incomplete ZIP/);
 const bad=Buffer.from(good);bad[80]^=0xff;assert.throws(()=>validateZip(bad));
});
test('upload validator rejects dependency links that would point outside the deployed function',()=>{
 const bytes=zip(),directory=bytes.readUInt32LE(bytes.length-22+16);
 bytes.writeUInt32LE(0xa1ff0000,directory+38);
 assert.throws(()=>validateZip(bytes),/dependency files, not symbolic links/);
});
test('staging replaces a malformed CLI package and retains routes/runtime in its manifest',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'canopy-zip-')),packageDir=path.join(root,'source'),dist=path.join(root,'dist');
 try{
  await fs.mkdir(packageDir);await fs.mkdir(dist);const bytes=zip();await fs.writeFile(path.join(packageDir,'canopy-access.zip'),bytes);await fs.writeFile(path.join(dist,'canopy-access.zip'),bytes.subarray(0,40));
  const fn={name:'canopy-access',invocationMode:'stream',runtimeVersion:'nodejs24.x',path:'old',routes:[{pattern:'/play/canopy-defense/api/access'}],trafficRules:{fixture:true}};
  await fs.writeFile(path.join(packageDir,'manifest.json'),JSON.stringify({functions:[fn]}));
  await stageCanopyPackage({packageDir,dist});assert.deepEqual(await fs.readFile(path.join(dist,'canopy-access.zip')),bytes);
  const deployed=JSON.parse(await fs.readFile(path.join(dist,'manifest.json')));assert.deepEqual(deployed.functions[0].routes,fn.routes);assert.deepEqual(deployed.functions[0].trafficRules,fn.trafficRules);assert.equal(deployed.functions[0].path,path.join(dist,'canopy-access.zip'));
  await fs.writeFile(path.join(packageDir,'manifest.json'),JSON.stringify({functions:[fn,{name:'unrelated'}]}));await assert.rejects(stageCanopyPackage({packageDir,dist}),/isolated Canopy/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('plugin entry point exports only supported Netlify events',async()=>{
 const plugin=await import('../tools/netlify-canopy-package/index.js');
 assert.deepEqual(Object.keys(plugin),['onPostBuild']);
});
