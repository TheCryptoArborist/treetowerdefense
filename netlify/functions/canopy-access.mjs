import {getDeployStore} from '@netlify/blobs';
import {paymentRuntime} from '../../server/payments/runtime.mjs';
import {createAccessHandler} from '../../server/access.mjs';
import {canonicalCheckoutRequest} from '../../server/canonical-checkout.mjs';
import sources from '../../server/runtime-source.json' with {type:'json'};
export default async request=>{
 const preview=process.env.CANOPY_CANONICAL_CHECKOUT_PREVIEW==='true';
 const scope=preview?canonicalCheckoutRequest(request):{request,prefix:'/play/canopy-defense/',cookieName:'__Secure-canopy-session'};
 if(!scope)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 const store=getDeployStore({name:preview?'canopy-checkout-canonical-v1':'canopy-access-v1',consistency:'strong'});
 const options={cookieName:scope.cookieName,path:scope.prefix+'api/payments'};
 return new URL(scope.request.url).pathname===options.path?paymentRuntime(scope.request,store,options):createAccessHandler({store,sources,prefix:scope.prefix,cookieName:scope.cookieName})(scope.request);
};
export const config={path:['/play/canopy-defense/api/access','/play/canopy-defense/api/payments','/play/canopy-defense/src/*'],rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:90}};
