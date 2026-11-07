// Navigation only. A picker never starts a wave, charges TREE or edits progression.
export function hasBattleToReplace(game){
 return game.phase!=='victory'&&(game.wave>0||game.towers.length>0||game.shield>0||game.boostUntil>game.time);
}
export function modeName(game){
 return game.isHarvest?'Harvest · seasonal challenge':game.isEvent?game.runName:game.isVeteran?'Campaign · Veteran':'Campaign';
}
export function createModePicker({dialog,getGame,blocked=()=>false,onSelect,onSelected=()=>{},onManage=()=>false,save=()=>{}}){
 const find=id=>dialog.querySelector('#'+id);
 let busy=false,entry=false,hasSaved=false,opener=null;
 const text=(id,value)=>{const node=find(id);if(node.textContent!==value)node.textContent=value;};
 function refresh(){
  const game=getGame(),locked=busy||blocked()||!game.access;
  find('mode-saved').hidden=!hasSaved;
  text('mode-saved-title',['victory','defeat'].includes(game.phase)?'Your saved run':'Continue your saved battle');
  text('mode-saved-detail',`${game.isEvent?'Seasonal challenge':'Campaign'} · ${game.runName} · ${game.phase==='build'?'Preparing wave '+(game.wave+1):game.phase==='victory'?'Victory':game.phase==='defeat'?'Defeated · view results and continue options':'Wave '+game.wave+' of '+game.waveCount}`);
  text('mode-continue',['victory','defeat'].includes(game.phase)?'View saved run →':'Continue saved battle →');
  text('mode-campaign-progress',`${game.forest.stars.reduce((a,b)=>a+b,0)}/9 campaign stars · stars are awarded when a forest is completed`);
  const unlocked=game.forest.stars[0]>0;
  text('mode-harvest-status',unlocked?`Unlocked · best ${game.harvest.bestWave}/5 waves`:'Unlock by completing Emerald Crossing in Campaign.');
  find('mode-harvest').disabled=locked||!unlocked;
  find('mode-campaign').disabled=locked;find('mode-continue').disabled=locked;
  find('mode-close').hidden=entry;find('mode-close').disabled=locked;
  for(const button of dialog.querySelectorAll('[data-lobby-command]'))button.disabled=locked;
 }
 async function choose(kind){
  const owner=getGame();
  if(busy||blocked()||!owner.access||!['campaign','harvest','continue'].includes(kind)||kind==='harvest'&&!owner.forest.stars[0]||kind==='continue'&&!hasSaved)return false;
  busy=true;text('mode-error','');refresh();
  try{
   const selected=await onSelect(kind);
   if(selected===false||owner!==getGame()||!owner.access)return false;
   busy=false;dialog.close();onSelected(kind,opener);return true;
  }catch(error){text('mode-error',error.message||'The mode could not open. Your saved battle is still available.');return false;}
  finally{busy=false;if(dialog.open)refresh();}
 }
 for(const [id,kind] of [['mode-campaign','campaign'],['mode-harvest','harvest'],['mode-continue','continue'],['mode-close','continue']])find(id).addEventListener('click',()=>{void choose(kind);});
 for(const button of dialog.querySelectorAll('[data-lobby-command]'))button.addEventListener('click',()=>{
  if(!busy&&!blocked()&&getGame().access)onManage(button.dataset.lobbyCommand,button);
 });
 dialog.addEventListener('cancel',event=>{event.preventDefault();if(!entry&&!busy)void choose('continue');});
 return {
  open(trigger=null,{initial=false,saved=true}={}){
   const game=getGame();if(dialog.open||busy||blocked()||!game.access)return false;
   opener=trigger;entry=initial;hasSaved=saved;text('mode-error','');
   if(game.phase==='running')game.pause();refresh();dialog.showModal();find(hasSaved?'mode-continue':'mode-campaign').focus?.({preventScroll:true});save();return true;
  },
  refresh,choose,
  get busy(){return busy;}
 };
}
