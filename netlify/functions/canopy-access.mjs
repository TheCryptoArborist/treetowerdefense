import {getDeployStore} from '@netlify/blobs';
import {paymentRuntime} from '../../server/payments/runtime.mjs';
import {createAccessHandler} from '../../server/access.mjs';
import {canonicalCheckoutRequest} from '../../server/canonical-checkout.mjs';
import {canonicalProductionRequest} from '../../server/canonical-production.mjs';
import profile from '../../server/release-profile.json' with {type:'json'};
import sources from '../../server/runtime-source.json' with {type:'json'};
export default async request=>{
 const preview=process.env.CANOPY_CANONICAL_CHECKOUT_PREVIEW==='true';
 const scope=profile.production?canonicalProductionRequest(request):preview?canonicalCheckoutRequest(request):{request,prefix:'/play/canopy-defense/',cookieName:'__Secure-canopy-session'};
 if(!scope)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 const store=getDeployStore({name:profile.production?'canopy-live-canonical-v1':preview?'canopy-checkout-canonical-v1':'canopy-access-v1',consistency:'strong'});
 const options={cookieName:scope.cookieName,path:scope.prefix+'api/payments',production:profile.production,...(profile.production?{enabled:process.env.CANOPY_CHECKOUT_ENABLED!=='false'&&process.env.CANOPY_INDIVIDUAL_DEFENDERS!=='false',individualDefenders:true}:{})};
 const response=await(new URL(scope.request.url).pathname===options.path?paymentRuntime(scope.request,store,options):createAccessHandler({store,sources,prefix:scope.prefix,cookieName:scope.cookieName})(scope.request));
 if(profile.production)response.headers.set('X-Canopy-Profile','production');return response;
};
export const config={path:['/play/canopy-defense/api/access','/play/canopy-defense/api/payments','/play/canopy-defense/src/*'],rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:90}};
