// Production has a fixed public origin and a cookie isolated from both earlier builds.
export const PRODUCTION_PREFIX='/play/canopy-defense/';
export function canonicalProductionRequest(request){
 const url=new URL(request.url);
 if(!url.pathname.startsWith(PRODUCTION_PREFIX)||url.pathname.startsWith(PRODUCTION_PREFIX+'checkout-test/'))return null;
 const target=new URL('https://tree-token.xyz'+url.pathname);target.search=url.search;
 return{request:new Request(target,request),prefix:PRODUCTION_PREFIX,cookieName:'__Secure-canopy-live-session'};
}
