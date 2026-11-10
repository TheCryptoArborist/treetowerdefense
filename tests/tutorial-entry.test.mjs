import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function startTutorial()'),source.indexOf("$('guided-run-button').addEventListener",source.indexOf('async function startTutorial()')));
function fixture({accept=true,busy=false}={}){
 const calls=[];const nodes={'starter-guide':{},'mode-error':{}};
 const context=vm.createContext({tutorialStarting:false,checkoutBusy:busy,purchaseDialog:{open:false},storyDialog:{open:false},worldMapDialog:{open:false},game:{access:true,chooseChapter:n=>calls.push(['chapter',n])},newRun:async()=>{calls.push('newRun');return accept;},save:()=>calls.push('save'),saveGuide:()=>calls.push('guide'),helpDialog:{open:true},commandMenu:{close:()=>calls.push('closeCommand')},modeDialog:{open:true,close:()=>calls.push('closeLobby')},renderUI:()=>calls.push('render'),focusControl:n=>calls.push(n),$:id=>nodes[id],guideStatus:'dismissed',showGuideCompletion:true,modeEntryShown:false,lobbyManagement:true});
 vm.runInContext(handler,context);return {context,calls,nodes};
}
test('tutorial enters Emerald guide and closes lobby without starting a wave or buying',async()=>{
 const f=fixture();await f.context.startTutorial();assert.equal(f.context.guideStatus,'active');assert.equal(f.context.modeEntryShown,true);assert.equal(f.context.lobbyManagement,false);assert(f.calls.includes('closeLobby'));assert.deepEqual(f.calls.find(Array.isArray),['chapter',0]);assert.equal(f.calls.at(-1),f.nodes['starter-guide']);
});
test('declining replacement leaves lobby and guide untouched',async()=>{
 const f=fixture({accept:false});await f.context.startTutorial();assert.deepEqual(f.calls,['newRun']);assert.equal(f.context.guideStatus,'dismissed');assert.equal(f.context.modeEntryShown,false);
});
test('checkout blocks tutorial before run replacement',async()=>{
 const f=fixture({busy:true});await f.context.startTutorial();assert.deepEqual(f.calls,[]);
});
