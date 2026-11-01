import fs from 'node:fs';
const root='.netlify/checkout-site/play/canopy-defense';
fs.mkdirSync(root,{recursive:true});
for(const file of ['index.html','styles.css','gateway.js'])fs.copyFileSync(file,root+'/'+file);
fs.cpSync('assets',root+'/assets',{recursive:true});
fs.cpSync('integration/tree-arcade/canopy-preview',root+'/preview',{recursive:true});
console.log('Prepared isolated Canopy preview; game sources remain in the gated function.');
