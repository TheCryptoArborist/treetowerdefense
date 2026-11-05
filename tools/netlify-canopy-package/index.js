import assert from 'node:assert/strict';
import {stageCanopyPackage} from './stage.mjs';
export async function onPostBuild({constants,utils}){
 try{
  assert.equal(constants.SITE_ID,'aa62f324-b880-47d6-85b8-4ba0700ff5bf');
  const result=await stageCanopyPackage({packageDir:'.netlify/canopy-functions',dist:constants.FUNCTIONS_DIST});
  console.log(`Validated Canopy upload ZIP: ${result.bytes} bytes, ${result.entries} entries`);
 }catch(error){utils.build.failBuild('Canopy upload package failed integrity validation',{error});}
}
