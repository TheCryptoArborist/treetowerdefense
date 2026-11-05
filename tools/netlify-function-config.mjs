// Preserve explicit overrides, rather than turning effective defaults into overrides.
export function preservedFunctionConfig(f){
 const config={};
 for(const[from,to]of Object.entries({dn:'display_name',g:'generator',bd:'build_data',mo:'memory',p:'priority',rgo:'region',tr:'traffic_rules',es:'event_subscriptions'}))if(f[from]!=null)config[to]=f[from];
 if(f.ro)config.routes=f.ro.map(r=>Object.fromEntries(Object.entries({pattern:r.p,literal:r.l,expression:r.e,methods:r.m,prefer_static:r.ps}).filter(([,v])=>v!=null)));
 return config;
}
