export const COMMAND_SECTIONS=Object.freeze({defenders:'My defenders',shop:'Shop & upgrades',cosmetics:'Styles & cosmetics',harvest:'Harvest of the Canopy',guide:'Field guide',unlocks:'Defense unlocks',scout:'Wave scout'});
// A native dialog holds simulation without changing running-phase item eligibility.
// Closing it leaves an active battle explicitly paused, ready for manual Resume.
export function createCommandMenu({dialog,getGame,blocked,render,save,returnFocus}){
 let section='defenders',opener=null,target=null;
 dialog.addEventListener('cancel',event=>{if(blocked())event.preventDefault();});
 dialog.addEventListener('close',()=>{
  if(blocked()){if(!dialog.open)dialog.showModal();return;}
  if(dialog.open)return;
  const game=getGame();if(game.phase==='running')game.pause();save();render(section);returnFocus(target||opener);target=null;
 });
 return Object.freeze({
  get section(){return section;},
  open(next,trigger=null){
   if(!Object.hasOwn(COMMAND_SECTIONS,next)||blocked()||!getGame().access)return false;
   section=next;if(!dialog.open){opener=trigger;target=null;dialog.showModal();}render(section);return true;
  },
  close(focusTarget=null){if(blocked()||!dialog.open)return false;target=focusTarget;dialog.close();return true;}
 });
}
