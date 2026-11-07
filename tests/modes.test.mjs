import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {Game} from '../src/engine.js';
import {createModePicker,hasBattleToReplace,modeName} from '../src/modes.js';

async function setup(onManage=()=>false){
 const {document}=parseHTML(await readFile('index.html','utf8')),dialog=document.querySelector('#mode-dialog');
 assert.equal(document.querySelector('[data-open-modes]').getAttribute('aria-controls'),'mode-dialog');
 dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;
 let game=new Game(),blocked=false,result=true,saves=0;game.allowPreview();
 const choices=[],selected=[];
 const picker=createModePicker({dialog,getGame:()=>game,blocked:()=>blocked,onManage,onSelect:async kind=>{choices.push(kind);if(result instanceof Error)throw result;return typeof result==='function'?result():result;},onSelected:kind=>selected.push(kind),save:()=>saves++});
 return {dialog,picker,choices,selected,get game(){return game;},get saves(){return saves;},setBlocked:v=>blocked=v,setResult:v=>result=v,replaceGame:g=>game=g};
}
test('entry offers the existing battle first and continuation preserves its exact state',async()=>{
 const s=await setup();s.game.place('pine',0);s.game.startWave();s.game.spawn('beetle');s.game.shield=20;
 const before=s.game.snapshot(),towers=s.game.towers;
 assert(s.picker.open(null,{initial:true,saved:true}));assert.equal(s.game.phase,'paused');assert.equal(s.choices.length,0);
 assert.equal(s.dialog.querySelector('#mode-saved').hidden,false);assert.match(s.dialog.querySelector('#mode-saved-detail').textContent,/Campaign/);
 assert(await s.picker.choose('continue'));assert.equal(s.game.towers,towers);assert.deepEqual({...s.game.snapshot(),phase:before.phase},before);
 assert.deepEqual(s.selected,['continue']);assert.equal(s.dialog.open,false);assert.equal(s.saves,1);
});
test('fresh entry explains the seasonal unlock and campaign selection is read-only',async()=>{
 const s=await setup(),before=s.game.snapshot();assert(s.picker.open(null,{initial:true,saved:false}));
 assert.equal(s.dialog.querySelector('#mode-saved').hidden,true);assert.equal(s.dialog.querySelector('#mode-harvest').disabled,true);
 assert.match(s.dialog.querySelector('#mode-harvest-status').textContent,/Emerald Crossing/);
 assert.equal(await s.picker.choose('continue'),false);assert.equal(await s.picker.choose('harvest'),false);
 assert(await s.picker.choose('campaign'));assert.deepEqual(s.game.snapshot(),before);assert.deepEqual(s.choices,['campaign']);
});
test('cancelled travel and a failed seasonal request retain the picker and saved battlefield',async()=>{
 const s=await setup();s.game.forest.stars[0]=1;s.game.place('pine',0);const before=s.game.snapshot();
 s.picker.open();s.setResult(false);assert.equal(await s.picker.choose('harvest'),false);assert.equal(s.dialog.open,true);
 s.setResult(Error('Network interrupted'));assert.equal(await s.picker.choose('harvest'),false);assert.match(s.dialog.querySelector('#mode-error').textContent,/Network interrupted/);
 assert.deepEqual(s.game.snapshot(),before);s.setResult(true);assert(await s.picker.choose('continue'));
});
test('mode selection is single-flight and a changed wallet/game cannot complete old navigation',async()=>{
 const s=await setup();s.game.forest.stars[0]=1;s.picker.open();let finish;
 s.setResult(()=>new Promise(resolve=>finish=resolve));const pending=s.picker.choose('harvest');
 assert.equal(s.picker.busy,true);assert.equal(await s.picker.choose('campaign'),false);
 const replacement=new Game();replacement.allowPreview();s.replaceGame(replacement);finish(true);
 assert.equal(await pending,false);assert.equal(s.dialog.open,true);assert.deepEqual(s.selected,[]);
 s.setBlocked(true);assert.equal(await s.picker.choose('continue'),false);s.setBlocked(false);s.game.access=false;
 s.picker.refresh();assert.equal(s.dialog.querySelector('#mode-campaign').disabled,true);assert.equal(await s.picker.choose('continue'),false);
});
test('replacement warnings cover planted setups and purchased supplies before wave one',()=>{
 const game=new Game();game.allowPreview();const before=game.snapshot();assert.equal(hasBattleToReplace(game),false);
 game.shield=50;assert.equal(hasBattleToReplace(game),true);game.shield=0;game.boostUntil=20;assert.equal(hasBattleToReplace(game),true);
 game.boostUntil=0;game.place('pine',0);assert.equal(hasBattleToReplace(game),true);game.phase='defeat';assert.equal(hasBattleToReplace(game),true);
 game.phase='victory';assert.equal(hasBattleToReplace(game),false);assert.equal(modeName(Game.restore(before)),'Campaign');
 game.mode='harvest-canopy';assert.match(modeName(game),/Harvest.*seasonal/);
});
test('access and modal guards prevent a mode picker from opening or changing battle state',async()=>{
 const s=await setup(),before=s.game.snapshot();s.setBlocked(true);assert.equal(s.picker.open(),false);s.setBlocked(false);
 s.game.access=false;assert.equal(s.picker.open(),false);s.game.access=true;assert.deepEqual(s.game.snapshot(),before);
});
test('lobby shortcuts manage the same saved battle without selecting a mode, charging or closing the lobby',async()=>{
 const managed=[],s=await setup((section,button)=>managed.push([section,button]));s.game.place('pine',0);s.game.shield=20;s.picker.open();const before=s.game.snapshot();
 const buttons=[...s.dialog.querySelectorAll('[data-lobby-command]')];assert.deepEqual(buttons.map(b=>b.dataset.lobbyCommand),['shop','defenders','cosmetics','guide']);
 for(const button of buttons)button.click();assert.equal(managed.length,4);assert.equal(s.dialog.open,true);assert.deepEqual(s.choices,[]);assert.deepEqual(s.game.snapshot(),before);
 s.setBlocked(true);s.picker.refresh();assert(buttons.every(b=>b.disabled));buttons[0].click();assert.equal(managed.length,4);
 s.setBlocked(false);s.game.access=false;s.picker.refresh();buttons[2].click();assert.equal(managed.length,4);
});
