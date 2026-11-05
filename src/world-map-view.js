import {worldMapState,renderWorldRegions,renderMapBriefing,waveMapAction} from './world-map.js';

// This dialog only inspects waves and calls the existing new-level/event flow.
export function createWorldMap({dialog,getGame,blocked,onTravel,onSeason,save,returnFocus}){
 const find=selector=>dialog.querySelector(selector);
 const regions=find('[data-map-regions]'),briefing=find('[data-map-briefing]');
 let state=null,signature='',stateSignature='',selected=null,opener=null,busy=false;
 const selectedWave=()=>state?.regions.flatMap(region=>region.waves.map(wave=>({region,wave}))).find(item=>item.wave.id===selected);
 function select(key,{locate=false,focus=false}={}){
  if(busy)return false;
  const item=state?.regions.flatMap(region=>region.waves.map(wave=>({region,wave}))).find(item=>item.wave.id===key);
  if(!item)return false;selected=key;
  for(const button of regions.querySelectorAll('[data-map-wave]'))button.setAttribute('aria-pressed',String(button.dataset.mapWave===key));
  find('[data-map-region-select]').value=item.region.id;
  briefing.innerHTML=renderMapBriefing(item.region,item.wave,getGame());
  const button=Array.from(regions.querySelectorAll('[data-map-wave]')).find(button=>button.dataset.mapWave===key);
  if(locate)button?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  if(focus)button?.focus({preventScroll:true});
  return true;
 }
 function refresh(){
  const game=getGame(),source=JSON.stringify([game.access,game.mode,game.difficulty,game.chapter,game.wave,game.phase,game.enemyRules,game.encounters,game.forest.stars,game.forest.bestWaves,game.veteranStars,game.veteranBestWaves,game.harvest.bestWave]);
  if(source!==stateSignature){state=worldMapState(game);stateSignature=source;}
  const active=state.regions.find(region=>region.active);
  const text=`${state.cleared}/${state.total} campaign waves cleared${active?' · '+active.label+' · wave '+active.current:''}`;
  for(const element of document.querySelectorAll('[data-map-progress]'))element.textContent=text;
  if(!dialog.open)return;
  const next=JSON.stringify(state);if(next===signature)return;signature=next;
  regions.innerHTML=renderWorldRegions(state);
  const picker=find('[data-map-region-select]');picker.replaceChildren();
  for(const region of state.regions){const option=document.createElement('option');option.value=region.id;option.textContent=`${region.label} · ${region.name}`;picker.append(option);}
  if(!busy)select(selected||state.currentKey);
 }
 function close(){if(busy||blocked()||!dialog.open)return false;dialog.close();return true;}
 function open(trigger=null){
  if(busy||blocked()||!getGame().access)return false;
  opener=trigger;if(getGame().phase==='running')getGame().pause();
  signature='';dialog.showModal();refresh();select(state.currentKey,{locate:true});save();return true;
 }
 dialog.addEventListener('cancel',event=>{if(busy||blocked())event.preventDefault();});
 dialog.addEventListener('close',()=>{
  if(busy){dialog.showModal();return;}
  if(dialog.open)return;save();returnFocus(opener);opener=null;
 });
 dialog.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||!dialog.contains(button))return;
  if(button.hasAttribute('data-map-close')){close();return;}
  if(button.hasAttribute('data-map-locate')){select(state.currentKey,{locate:true,focus:true});return;}
  if(button.dataset.mapWave){select(button.dataset.mapWave);return;}
  if(!button.dataset.mapAction||busy||blocked())return;
  refresh();const item=selectedWave();if(!item||waveMapAction(item.region,getGame()).kind!==button.dataset.mapAction)return;
  if(button.dataset.mapAction==='return'){close();return;}
  if(!['travel','season'].includes(button.dataset.mapAction))return;
  busy=true;button.disabled=true;
  try{
   const entered=button.dataset.mapAction==='travel'?await onTravel(item.region.level):await onSeason();
   busy=false;if(entered)close();else{signature='';refresh();}
  }catch{busy=false;signature='';refresh();find('.atlas-error').textContent='Travel could not complete. Your current battle is still available; try again.';}
 });
 find('[data-map-region-select]').addEventListener('change',event=>{
  const region=state.regions.find(region=>region.id===event.target.value);if(region)select(region.waves[0].id,{locate:true,focus:true});
 });
 return Object.freeze({open,close,refresh,selectRegion(id){const region=state?.regions.find(region=>region.id===id);return !!region&&select(region.waves[0].id,{locate:true,focus:true});}});
}
