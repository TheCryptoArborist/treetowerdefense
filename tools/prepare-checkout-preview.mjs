import fs from 'node:fs';
const root='.netlify/checkout-site/play/canopy-defense';
fs.mkdirSync(root,{recursive:true});
for(const file of ['index.html','styles.css','gateway.js'])fs.copyFileSync(file,root+'/'+file);
fs.cpSync('assets',root+'/assets',{recursive:true});
fs.cpSync('integration/tree-arcade/canopy-preview',root+'/preview',{recursive:true});
if(process.env.CANOPY_CANONICAL_CHECKOUT_PREVIEW==='true'){
 const file=root+'/index.html';
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('NFTREE HOLDER ACCESS','NFTREE · CHECKOUT TEST').replace('NFTree holder access · TREE balances and purchases are simulated','NFTree holder access · Checkout test uses real TREE + SUI gas').replace('Purchases show separate checkout terms.','Checkout test purchases spend real TREE plus SUI gas. Terms appear before approval.'));
}
console.log('Prepared isolated Canopy preview; game sources remain in the gated function.');
