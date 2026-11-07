import fs from 'node:fs';import {releaseProfile} from './release-profile.mjs';import {build} from 'esbuild';import {zipFunctions} from '@netlify/zip-it-and-ship-it';
if(fs.lstatSync('node_modules').isSymbolicLink())throw new Error('Install dependencies inside this checkout before packaging (npm ci). A linked node_modules can produce a function with missing runtime packages.');
fs.writeFileSync('server/release-profile.json',JSON.stringify(releaseProfile()));
const files=fs.readdirSync('src').filter(n=>n.endsWith('.js'));
fs.writeFileSync('server/runtime-source.json',JSON.stringify(Object.fromEntries(files.map(n=>[n,fs.readFileSync('src/'+n,'utf8')]))));
await build({entryPoints:['client/gateway.mjs'],bundle:true,external:['./src/*'],format:'esm',platform:'browser',target:'es2022',outfile:'gateway.js',minify:true,legalComments:'eof'});
fs.mkdirSync('.netlify/canopy-functions',{recursive:true});
const result=await zipFunctions('netlify/functions','.netlify/canopy-functions',{config:{'*':{nodeBundler:'esbuild',nodeVersion:'24.x'}},manifest:'.netlify/canopy-functions/manifest.json'});
console.log(JSON.stringify(result.map(f=>({name:f.name,path:f.path,runtime:f.runtime,config:f.config,runtimeVersion:f.runtimeVersion,includedFiles:f.includedFiles?.length})),null,2));
