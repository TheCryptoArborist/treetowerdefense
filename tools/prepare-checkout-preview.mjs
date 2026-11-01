import fs from 'node:fs';
const root='.netlify/checkout-site/play/canopy-defense';
fs.mkdirSync(root,{recursive:true});
for(const file of ['index.html','styles.css','gateway.js'])fs.copyFileSync(file,root+'/'+file);
fs.cpSync('assets',root+'/assets',{recursive:true});
fs.cpSync('integration/tree-arcade/canopy-preview',root+'/preview',{recursive:true});
if(process.env.CANOPY_CANONICAL_CHECKOUT_PREVIEW==='true'){
 const file=root+'/index.html';
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('NFTREE HOLDER ACCESS','NFTREE HOLDER ACCESS · CHECKOUT TEST').replace('<h2 id="access-title">','<p>Checkout test: purchases spend real TREE plus SUI gas. Use a funded NFTree holder wallet other than the payment recipient.</p><h2 id="access-title">'));
}
console.log('Prepared isolated Canopy preview; game sources remain in the gated function.');
