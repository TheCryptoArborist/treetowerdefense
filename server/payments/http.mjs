const PATH='/play/canopy-defense/api/payments';
const H={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const fields={run:[],quote:['product','species','runId'],bind:['id','signed'],redeem:['id'],consume:['id','runId'],cancel:['id'],submit:['id'],reconcile:['id']};
export function createPaymentHandler({authorize,ledger,enabled=false,path=PATH}){
 return async request=>{
  const reply=(data,status=200)=>Response.json(data,{status,headers:H});
  if(new URL(request.url).pathname!==path)return reply({error:'Not found'},404);
  try{
   await authorize(request);
   if(request.method==='GET'){
    if(!enabled)return reply({enabled:false});
    return reply({enabled:true,growth:await ledger.progress(request),invoices:await ledger.history(request),entitlements:await ledger.entitlements(request)});
   }
   if(request.method!=='POST')return reply({error:'Method not allowed'},405);
   if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Use the game checkout'},403);
   if(!enabled)return reply({error:'TREE checkout is not enabled'},503);
   if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
   const reader=request.body?.getReader();if(!reader)return reply({error:'JSON required'},400);let size=0,text='';const decoder=new TextDecoder();for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>70000){await reader.cancel();return reply({error:'Request too large'},413);}text+=decoder.decode(r.value,{stream:true});}
   let b;try{b=JSON.parse(text);}catch{return reply({error:'Invalid JSON'},400);}
   if(!b||!Object.hasOwn(fields,b.action)||Object.keys(b).some(k=>k!=='action'&&!fields[b.action].includes(k)))return reply({error:'Invalid checkout request'},400);
   let result;
   if(b.action==='run')result=await ledger.startRun(request);
   if(b.action==='quote'){const {action,...input}=b;result=await ledger.quote(request,input);}
   if(b.action==='bind')result=await ledger.bind(request,b.id,b.signed);
   if(b.action==='redeem')result=await ledger.redeem(request,b.id);
   if(b.action==='consume')result=await ledger.consume(request,b.id,b.runId);
   if(b.action==='submit')result=await ledger.submit(request,b.id);
   if(b.action==='reconcile')result=await ledger.reconcile(request,b.id);
   if(b.action==='cancel')result=await ledger.cancel(request,b.id);
   return reply(result);
  }catch(error){if(error?.status===401||error?.status===403)return reply({error:'Verify your NFTree wallet again'},error.status);return reply({error:'Checkout could not be completed. Check purchase history before retrying payment.'},503);}
 };
}
