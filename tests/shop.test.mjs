import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {Game} from '../src/engine.js';
import {createShopView} from '../src/shop.js';

async function fixture(){
 const {document,window}=parseHTML(await readFile('index.html','utf8'));
 const root=document.querySelector('[data-command-panel="shop"]'),game=new Game();game.allowPreview();
 const view=createShopView({root,getGame:()=>game,paidMode:true});return {document,window,root,game,view};
}
test('shop opens on supplies, keeps category selection through updates, and resets on next entry',async()=>{
 const s=await fixture(),supplies=s.root.querySelector('#shop-supplies'),upgrades=s.root.querySelector('#shop-upgrades');
 s.view.reset();assert.equal(supplies.hidden,false);assert.equal(upgrades.hidden,true);
 s.root.querySelector('[data-shop-category="upgrades"]').click();s.view.update();s.view.update();
 assert.equal(upgrades.hidden,false);assert.equal(supplies.hidden,true);
 s.view.reset();assert.equal(supplies.hidden,false);assert.equal(upgrades.hidden,true);
 assert.match(s.root.querySelector('#shield-effect').textContent,/Tree of Life/);
 assert.equal(s.root.querySelectorAll('[data-supply="shield"]').length,1);
});
test('shop explains shield refill, full shield and insufficient funds without buying or changing game state',async()=>{
 const s=await fixture(),button=s.root.querySelector('[data-supply="shield"]'),note=s.root.querySelector('#shield-availability');
 s.game.shield=20;const before=s.game.snapshot();s.view.update();assert.deepEqual(s.game.snapshot(),before);
 assert.equal(button.disabled,false);assert.match(note.textContent,/20\/50.*50\/50/);
 s.game.shield=50;s.view.update();assert.equal(button.disabled,true);assert.match(note.textContent,/already full/);
 s.game.shield=0;s.game.tree=2999;s.view.update();assert.equal(button.disabled,true);assert.match(note.textContent,/Not enough TREE/);assert.doesNotMatch(note.textContent,/preview/);
});
test('shop names the supply destination while cosmetics stay separate from purchases',async()=>{
 const s=await fixture();s.game.forest.stars[0]=1;s.game.startEvent('harvest-canopy');const before=s.game.snapshot();s.view.update();
 assert.match(s.root.querySelector('#shop-battle-target').textContent,/seasonal challenge.*Harvest.*preparing wave 1/);assert.deepEqual(s.game.snapshot(),before);
 assert.equal(s.root.querySelector('#style-grid'),null);assert.equal(s.root.querySelector('#copper-look'),null);
 const looks=s.document.querySelector('[data-command-panel="cosmetics"]');assert(looks.querySelector('#style-grid'));assert(looks.querySelector('#copper-look'));assert.equal(looks.querySelectorAll('[data-supply]').length,0);assert.match(looks.textContent,/Appearance only.*combat stats stay the same/);
 for(const id of ['style-grid','copper-look','amber-look','harvest-tower-look'])assert.equal(s.document.querySelectorAll('#'+id).length,1);
});
test('supply availability follows battle rules and category tabs support arrow keys',async()=>{
 const s=await fixture(),storm=s.root.querySelector('[data-supply="storm"]');
 s.view.update();assert.equal(storm.disabled,true);assert.match(s.root.querySelector('#storm-availability').textContent,/pests|running/);
 s.game.startWave();s.game.spawn('termite');s.view.update();assert.equal(storm.disabled,false);
 s.game.boostUntil=s.game.time+12;s.view.update();assert.equal(s.root.querySelector('[data-supply="fertilizer"]').disabled,true);assert.match(s.root.querySelector('#fertilizer-availability').textContent,/12 battle seconds/);
 const tabs=[...s.root.querySelectorAll('[role="tab"]')];let focused=false;tabs[1].focus=()=>{focused=true;};
 const event=new s.window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(event,'key',{value:'ArrowRight'});tabs[0].dispatchEvent(event);
 assert.equal(tabs[1].getAttribute('aria-selected'),'true');assert.equal(focused,true);assert.equal(event.defaultPrevented,true);
});
test('Root Shield buffers actual Tree of Life damage and refills to 50 without healing',()=>{
 const game=new Game();game.allowPreview();game.health=60;game.shield=20;assert(game.applyPurchasedSupply('shield'));
 assert.equal(game.health,60);assert.equal(game.shield,50);game.startWave();const pest=game.spawn('termite');pest.progress=game.map.length;
 game.step(.01);assert.equal(game.health,60);assert.equal(game.shield,38);assert.equal(game.runReport.absorbed,12);
 assert(game.applyPurchasedSupply('shield'));assert.equal(game.shield,50);assert.equal(game.health,60);
 game.newRun();assert.equal(game.shield,0);
});
