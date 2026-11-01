// Fixed public origin for the isolated checkout build served by a same-site rewrite.
// Never derive authentication origins from forwarded headers or a browser parameter.
export const CHECKOUT_PREFIX='/play/canopy-defense/checkout-test/';
const UPSTREAM_PREFIX='/play/canopy-defense/';
export function canonicalCheckoutRequest(request){
 const url=new URL(request.url);
 const prefix=url.pathname.startsWith(CHECKOUT_PREFIX)?CHECKOUT_PREFIX:UPSTREAM_PREFIX;
 if(!url.pathname.startsWith(prefix))return null;
 const target=new URL('https://tree-token.xyz'+CHECKOUT_PREFIX+url.pathname.slice(prefix.length));
 target.search=url.search;
 return {request:new Request(target,request),prefix:CHECKOUT_PREFIX,cookieName:'__Secure-canopy-checkout-session'};
}
