import {TOWERS, UNLOCKS, HARVEST_CANOPY} from './engine.js';
import {CAMPAIGN_LEVELS, campaignLevelState} from './levels.js';
import {scoutWave} from './playtest.js';

// TREE's live ecosystem palette; scoped to the atlas rather than battle art.
export const WORLD_MAP_BRAND=Object.freeze({background:'#050714',panel:'#09121a',
 cyan:'#22e7d7',green:'#33f78f',gold:'#ffd84b',amber:'#ffad32',purple:'#7041c3',
 text:'#f4fbff',muted:'#aeb7cc',danger:'#ff6b7c'});
export function mapNodeColors(wave){
 const b=WORLD_MAP_BRAND;
 return {fill:wave.current?'#06343b':wave.cleared?'#0b352b':wave.boss?'#32251b':b.panel,
  stroke:wave.current?b.cyan:wave.cleared?b.green:wave.boss?b.amber:'#58657e'};
}

// Stable region/wave IDs keep the atlas expandable without renumbering saves.
// These are views of existing battles, never selectable wave checkpoints.
export const WORLD_REGIONS=Object.freeze([
 ...CAMPAIGN_LEVELS.map(level=>Object.freeze({
  id:`level-${level.number}`,level:level.number,chapter:level.chapter,
  difficulty:level.difficulty,name:level.name,waves:10,mode:'campaign',
  biome:['emerald','sunpetal','moonlit'][level.chapter],
  label:`Level ${level.number} · ${level.difficulty==='veteran'?'Veteran':'Campaign'}`,
  offset:(level.number-1)*10
 })),
 Object.freeze({id:HARVEST_CANOPY.id,name:HARVEST_CANOPY.name,chapter:0,
  difficulty:'standard',waves:5,mode:HARVEST_CANOPY.id,biome:'harvest',label:'Seasonal branch',offset:0})
]);
const bounded=(value,max)=>Number.isInteger(value)?Math.max(0,Math.min(max,value)):0;
export const escapeMapText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function activeMapRegion(game){
 return game.isHarvest?HARVEST_CANOPY.id:game.isEvent?null:`level-${game.chapter+1+(game.isVeteran?CAMPAIGN_LEVELS.length/2:0)}`;
}
export function worldMapState(game,regions=WORLD_REGIONS){
 const activeId=activeMapRegion(game);
 const result=regions.map(region=>{
  const seasonal=region.mode!=='campaign',active=region.id===activeId;
  const level=seasonal?null:CAMPAIGN_LEVELS.find(level=>level.number===region.level);
  const levelState=level&&campaignLevelState(game,level);
  const stars=seasonal?0:levelState?.stars||0;
  const unlocked=seasonal?game.access&&game.forest.stars[0]>0:levelState?.unlocked===true;
  const history=seasonal?game.harvest.bestWave:region.difficulty==='veteran'?game.veteranBestWaves?.[region.chapter]:game.forest.bestWaves[region.chapter];
  const clearedThisRun=active?Math.max(0,game.wave-(['running','paused','defeat'].includes(game.phase)?1:0)):0;
  const best=Math.max(bounded(history,region.waves),stars>0?region.waves:0,bounded(clearedThisRun,region.waves));
  const current=active?Math.max(1,Math.min(region.waves,game.wave+(game.phase==='build'?1:0))):0;
  const waves=Array.from({length:region.waves},(_,i)=>{
   const wave=i+1,forecast=scoutWave(region.chapter,wave,active?game.enemyRules:1,region.mode,region.difficulty,active?game.encounters:1,active?game.eventVersion:2);
   const boss=forecast.groups.find(group=>group.kind==='boss');
   const milestones=seasonal?(wave===region.waves?['Harvest Defender badge · finish to earn seasonal looks']:[]):
    region.difficulty==='veteran'?[]:Object.entries(UNLOCKS).filter(([,rule])=>rule.chapter===region.chapter&&(rule.kind==='wave'?rule.wave===wave:rule.kind==='chapter'&&wave===region.waves)).map(([type])=>TOWERS[type].name);
   const isCurrent=wave===current&&game.phase!=='victory';
   return {id:`${region.id}-wave-${wave}`,regionId:region.id,wave,number:seasonal?`H${wave}`:String(region.offset+wave).padStart(2,'0'),
    cleared:wave<=best,current:isCurrent,status:isCurrent?(game.phase==='defeat'?'defeated':game.phase==='build'?'next':'current'):wave<=best?'cleared':unlocked?'ahead':'locked',
    title:forecast.title,total:forecast.total,tip:forecast.tip,groups:forecast.groups,
    boss:boss?.name||'',miniBoss:!!boss?.miniBoss,milestones};
  });
  return {...region,active,unlocked,stars,best,current,waves};
 });
 const campaign=result.filter(r=>r.mode==='campaign');
 return {regions:result,activeId,phase:game.phase,access:game.access,
  cleared:campaign.reduce((n,r)=>n+r.best,0),total:campaign.reduce((n,r)=>n+r.waves.length,0),
  currentKey:result.find(r=>r.active)?.waves.find(w=>w.wave===result.find(r=>r.active).current)?.id||result[0]?.waves[0]?.id};
}
export function waveMapAction(region,game){
 if(!game.access)return {kind:'locked',label:'NFTree verification required',note:'Verify NFTree ownership to enter the forest.'};
 if(region.active)return {kind:'return',label:'Return to current battle',note:'Waves are fought in order. Inspecting a marker does not move your battle or reset your defenses.'};
 if(!region.unlocked)return {kind:'locked',label:'Region locked',note:region.mode!=='campaign'?'Protect Level 1 to unlock this seasonal branch.':region.difficulty==='veteran'?'Protect all three campaign forests to unlock Veteran territory.':'Protect the previous campaign forest to unlock this region.'};
 return {kind:region.mode==='campaign'?'travel':'season',label:`${region.best===region.waves.length?'Replay':'Enter'} ${region.level?'Level '+region.level:'Harvest'} · wave 1`,note:'Starts a fresh battle at wave 1. Permanent growth and earned progress stay. An unfinished battle requires confirmation.'};
}
export function nodePosition(index){
 const row=Math.floor(index/5),column=row%2?4-index%5:index%5;
 return {x:12+column*19,y:145+row*136+(column%2?18:0)};
}
const routePath=count=>Array.from({length:count},(_,i)=>{const p=nodePosition(i);return `${i?'L':'M'}${p.x*10},${p.y}`;}).join(' ');
export function regionMapArtwork(region){
 return {emerald:'assets/brand/oak-home.png',sunpetal:'assets/towers/sap-cannon-v1.png',moonlit:'assets/environment/tree-life-v1.png',harvest:'assets/brand/harvest-orchard-preview.jpg'}[region.biome]||'assets/brand/oak-home.png';
}
export function regionScenery(region){
 const b=WORLD_MAP_BRAND;
 const colors={emerald:['#071520','#0b2631',b.green],sunpetal:['#101522','#192b34',b.gold],moonlit:['#091024','#11253d',b.cyan],harvest:['#26190f','#633819',b.amber]}[region.biome]||['#071520','#0b2631',b.green];
 const artwork=regionMapArtwork(region);
 const trees=Array.from({length:32},(_,i)=>{
  const x=(i*197+47)%1000,y=(i*83+42)%370,s=.65+(i%4)*.17;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 16V-16" stroke="#233a45" stroke-width="7"/><path d="M-25 0L0-50 25 0 16-5 31 12H-31L-16-5Z" fill="${colors[2]}" opacity=".12"/></g>`;
 }).join('');
 const last=nodePosition(region.waves.length-1),connectors=region.mode==='campaign'?`M50 0V98Q50 125 120 145 M${last.x*10} ${last.y}Q50 310 50 344V370`:'';
 return `<svg class="atlas-terrain" viewBox="0 0 1000 370" preserveAspectRatio="none" overflow="hidden" aria-hidden="true"><rect width="1000" height="370" fill="${colors[0]}"/><path d="M0 60Q200-10 440 90T1000 45V370H0Z" fill="${colors[1]}"/><path d="M760-20Q500 70 740 170T650 390" fill="none" stroke="${b.cyan}" opacity=".07" stroke-width="62"/><path d="M760-20Q500 70 740 170T650 390" fill="none" stroke="${b.cyan}" opacity=".12" stroke-width="2"/>${trees}<image href="${artwork}" x="715" y="55" width="270" height="280" opacity=".24" preserveAspectRatio="xMidYMid meet"/><path d="${connectors}" fill="none" stroke="${b.background}" stroke-width="18"/><path d="${connectors}" fill="none" stroke="${b.cyan}" stroke-opacity=".35" stroke-width="5"/><path d="${routePath(region.waves.length)}" fill="none" stroke="${b.background}" stroke-width="24" stroke-linejoin="round"/><path d="${routePath(region.waves.length)}" fill="none" stroke="${b.cyan}" stroke-opacity=".35" stroke-width="12" stroke-linejoin="round"/><path d="${routePath(region.waves.length)}" fill="none" stroke="${b.cyan}" stroke-opacity=".8" stroke-width="2" stroke-dasharray="4 10"/></svg>`;
}
const stateLabel=wave=>({current:'Battle paused here',next:'Next wave',defeated:'Defeat · recovery available',cleared:'Cleared',ahead:'Ahead · fight in order',locked:'Locked region'}[wave.status]);
export function renderWorldRegions(state){
 const e=escapeMapText;
 return state.regions.map(region=>`<section class="atlas-region atlas-${e(region.biome)} ${region.difficulty==='veteran'?'atlas-veteran':''}" id="atlas-${e(region.id)}" aria-label="${e(region.label+' · '+region.name)}">
  ${regionScenery(region)}<header class="atlas-region-heading"><span>${e(region.label)}</span><h3>${e(region.name)}</h3><p>${region.best}/${region.waves.length} waves cleared${region.mode==='campaign'?` · ${'★'.repeat(region.stars)}${'☆'.repeat(3-region.stars)}`:' · separate seasonal progress'}</p></header>
  <ol class="atlas-wave-list" aria-label="${e(region.name)} waves">${region.waves.map((wave,i)=>{const p=nodePosition(i);return `<li style="left:${p.x}%;top:${p.y}px"><button type="button" class="atlas-node is-${wave.status}${wave.boss?' has-boss':''}" data-map-wave="${e(wave.id)}" aria-pressed="false"${wave.current?' aria-current="step"':''} aria-label="${e(`${region.label}, ${region.name}, wave ${wave.wave}: ${wave.title}. ${stateLabel(wave)}${wave.boss?'. '+wave.boss:''}${wave.milestones.length?'. Unlock: '+wave.milestones.join(', '):''}`)}"><span class="atlas-node-mark" aria-hidden="true">${e(wave.number)}</span><span class="atlas-node-wave">${wave.boss?(wave.miniBoss?'MINI-BOSS':'BOSS'):'WAVE '+wave.wave}</span>${wave.cleared?'<span class="atlas-node-cleared" aria-hidden="true">✓</span>':''}${wave.milestones.length?'<span class="atlas-node-unlock" aria-hidden="true">✦</span>':''}</button></li>`;}).join('')}</ol>
  <span class="atlas-region-exit" aria-hidden="true">${region.mode==='campaign'?'↓':'SEASONAL BRANCH'}</span></section>`).join('')+
  '<section class="atlas-frontier"><span aria-hidden="true">◇</span><p class="eyebrow">BEYOND THE FRONTIER</p><h3>The canopy can keep growing.</h3><p>New forests and wave paths can extend this world.<br>Further regions are not available yet.</p></section>';
}
export function renderMapBriefing(region,wave,game){
 const e=escapeMapText,action=waveMapAction(region,game);
 return `<span class="eyebrow">${e(region.label)} · WAVE ${wave.wave}</span><h3>${e(wave.title)}</h3><p class="atlas-selection-state">${e(stateLabel(wave))}${wave.cleared&&wave.current?' · previously cleared':''}</p>
  ${wave.boss?`<p class="atlas-boss-name">♜ ${e(wave.boss)}</p>`:''}
  <details class="atlas-briefing"><summary>Wave briefing · ${wave.total} pests</summary><ul>${wave.groups.map(group=>`<li><strong>${group.count} ${e(group.name)}</strong><span>${e(group.trait)}</span></li>`).join('')}</ul><p>${e(wave.tip)}</p>${wave.milestones.length?`<p class="atlas-milestone"><strong>Clear-wave milestone</strong>${e(wave.milestones.join(' · '))}</p>`:''}${region.mode==='campaign'&&region.difficulty==='standard'?'<p class="atlas-stars-note">Willow unlocks at four total campaign stars. Stars are awarded when a forest is protected.</p>':''}</details>
  <p class="atlas-action-note">${e(action.note)}</p><button type="button" class="primary" data-map-action="${action.kind}"${action.kind==='locked'?' disabled':''}>${e(action.label)}</button><p class="atlas-error" role="status"></p>`;
}
