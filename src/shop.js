import {purchaseQuote} from './playtest.js';

// The shop explains existing game rules; it never charges or applies a purchase.
export function createShopView({root,getGame,paidMode=false}){
 const tabs=[...root.querySelectorAll('[data-shop-category]')];
 const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 function select(category,focus=false){
  const selected=tabs.find(t=>t.dataset.shopCategory===category);if(!selected)return false;
  for(const tab of tabs){
   const active=tab===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
   root.querySelector('#'+tab.getAttribute('aria-controls')).hidden=!active;
  }
  if(focus)selected.focus();return true;
 }
 for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>select(tab.dataset.shopCategory));
  tab.addEventListener('keydown',event=>{
   const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:null;
   if(next!==null){event.preventDefault();select(tabs[next].dataset.shopCategory,true);}
  });
 }
 return {
  reset(){select('supplies');},
  update(){
   const game=getGame();
   text(root.querySelector('#shop-payment-note'),paidMode?'Prices are in TREE. SUI network gas is separate. Review your purchase before wallet approval.':'Preview only · purchases use simulated TREE.');
   for(const button of root.querySelectorAll('[data-supply]')){
    const kind=button.dataset.supply,quote=purchaseQuote(game,kind);
    button.disabled=!quote.available;
    const status=root.querySelector('#'+(kind==='shield'?'shield':kind==='fertilizer'?'fertilizer':'storm')+'-availability');
    const reason=paidMode?quote.reason.replace('preview TREE','TREE').replace('Choose your simulated NFTree access first.','Verify your NFTree access first.'):quote.reason;
    const message=kind==='shield'?`Your shield: ${game.shield}/50. `+(quote.available?'Buying refills it to 50/50.':reason):
     kind==='fertilizer'&&game.boostUntil>game.time?`Boost active: ${Math.ceil(game.boostUntil-game.time)} battle seconds left.`:
     quote.available?(kind==='storm'?'Ready: hit every pest currently on the path.':'Ready to boost your defenders.'):reason;
    text(status,message);
   }
  }
 };
}
