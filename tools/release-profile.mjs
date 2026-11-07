// Public build settings only. No credentials or browser input enter this manifest.
export function releaseProfile(env=process.env){
 const production=env.CANOPY_PRODUCTION_CANDIDATE==='true';
 if(production&&(env.CANOPY_CHECKOUT_ENABLED!=='true'||env.CANOPY_INDIVIDUAL_DEFENDERS!=='true'))throw Error('Production candidate requires explicit wallet checkout and individual defender settings');
 return{production,ledgerBranch:production?'canopy-checkout-test':null};
}
