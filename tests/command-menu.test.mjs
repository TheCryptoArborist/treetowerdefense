import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';import {createCommandMenu} from '../src/command-menu.js';
class Dialog extends EventTarget{open=false;showModal(){this.open=true;}close(){this.open=false;this.dispatchEvent(new Event('close'));}}
function setup(phase='build'){
 const game=new Game();game.allowPreview();game.phase=phase;const dialog=new Dialog(),renders=[],focus=[];let locked=false,saves=0;
 const menu=createCommandMenu({dialog,getGame:()=>game,blocked:()=>locked,render:s=>renders.push(s),save:()=>saves++,returnFocus:t=>focus.push(t)});
 return{game,dialog,menu,renders,focus,get saves(){return saves;},setLocked:v=>locked=v};
}
test('management holds a running battle without invalidating Leaf Storm, then returns paused',()=>{
 const s=setup('running');s.game.wave=1;s.game.spawn('termite');const before=s.game.time;
 assert.equal(s.menu.open('shop','shop-button'),true);assert.equal(s.dialog.open,true);assert.equal(s.game.phase,'running');assert.equal(s.game.canUseSupply('storm'),true);assert.equal(s.game.time,before);
 s.menu.close();assert.equal(s.game.phase,'paused');assert.equal(s.saves,1);assert.deepEqual(s.focus,['shop-button']);
});
test('switching sections keeps one modal open and preserves the battle and return control',()=>{
 const s=setup('running');s.menu.open('defenders','rail');s.menu.open('harvest','tab');s.menu.open('guide','other-tab');
 assert.equal(s.menu.section,'guide');assert.equal(s.game.phase,'running');assert.equal(s.saves,0);s.menu.close();assert.deepEqual(s.focus,['rail']);assert.equal(s.game.phase,'paused');
});
test('a nested purchase blocks section changes, closing and Escape until checkout is released',()=>{
 const s=setup('running');s.menu.open('shop');s.setLocked(true);assert.equal(s.menu.open('harvest'),false);assert.equal(s.menu.close(),false);
 const escape=new Event('cancel',{cancelable:true});s.dialog.dispatchEvent(escape);assert.equal(escape.defaultPrevented,true);
 s.dialog.close();assert.equal(s.dialog.open,true);assert.equal(s.game.phase,'running');
 s.setLocked(false);s.menu.close();assert.equal(s.dialog.open,false);assert.equal(s.game.phase,'paused');
});
test('closing management does not resume an already paused battle or change build and outcome states',()=>{
 for(const phase of ['build','paused','victory','defeat']){const s=setup(phase);s.menu.open('unlocks');s.menu.close();assert.equal(s.game.phase,phase);}
});
test('invalid sections and unverified access cannot open management',()=>{
 const s=setup();assert.equal(s.menu.open('unknown'),false);s.game.access=false;assert.equal(s.menu.open('shop'),false);assert.equal(s.dialog.open,false);
});
test('return-to-deploy can restore focus to the map without starting a wave or spending currency',()=>{
 const s=setup(),tree=s.game.tree,sap=s.game.sap;s.menu.open('defenders','rail');s.menu.close('battlefield');assert.deepEqual(s.focus,['battlefield']);assert.equal(s.game.phase,'build');assert.equal(s.game.wave,0);assert.equal(s.game.tree,tree);assert.equal(s.game.sap,sap);
});
