import {getDeployStore} from '@netlify/blobs';
import {createAccessHandler} from '../../server/access.mjs';
import sources from '../../server/runtime-source.json' with {type:'json'};
export default async request=>createAccessHandler({store:getDeployStore({name:'canopy-access-v1',consistency:'strong'}),sources})(request);
export const config={path:['/play/canopy-defense/api/access','/play/canopy-defense/src/*'],rateLimit:{action:'rate_limit',aggregateBy:['domain','ip'],windowSize:60,windowLimit:90}};
