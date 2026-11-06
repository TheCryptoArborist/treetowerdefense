// Keep the holder entrance visible until downloads AND sprite preparation finish.
const required={environment:['terrain','tree','road'],defenders:['oak','pine','palm','cypress','mushroom'],aim:['oak','pine','palm','cypress','mushroom','willow'],structures:['watchtower','cannon']};
function unavailable(){const error=new Error('Forest graphics could not finish loading. Reload to try again.');error.code='CANOPY_ART_NOT_READY';return error;}
export async function waitForForestArt(loaders,{timeoutMs=20000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 let timer;
 try{
  const names=[...Object.keys(required),'enemies'];
  const completed=Promise.allSettled(names.map(name=>loaders[name]));
  const timeout=new Promise((_,reject)=>{timer=setTimer(()=>reject(unavailable()),timeoutMs);});
  const results=await Promise.race([completed,timeout]);
  for(let i=0;i<names.length;i++){
   const result=results[i],name=names[i];
   if(result.status!=='fulfilled')throw unavailable();
   if(name==='enemies'){if(result.value!==true)throw unavailable();}
   else if(!required[name].every(key=>result.value?.loaded?.includes(key)))throw unavailable();
  }
 }finally{clearTimer(timer);}
}
