import {getDeployStore} from '@netlify/blobs';
import {paymentRuntime} from '../../server/payments/runtime.mjs';
import {createAccessHandler} from '../../server/access.mjs';
import sources from '../../server/runtime-source.json' with {type:'json'};
export default async request=>{const store=getDeployStore({name:'canopy-access-v1',consistency:'strong'});return new URL(request.url).pathname==='/play/canopy-defense/api/payments'?paymentRuntime(request,store):createAccessHandler({store,sources})(request);};
export const config={path:['/play/canopy-defense/api/access','/play/canopy-defense/api/payments','/play/canopy-defense/src/*'],rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:90}};
