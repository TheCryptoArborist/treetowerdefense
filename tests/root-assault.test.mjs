import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatFeedback} from '../src/combat.js';

test('ordinary and shielded breaches show attacks, expire together and remain transient',()=>{
 const feedback=new CombatFeedback();
 feedback.consume([{type:'leak',kind:'beetle',x:940,y:640,damage:18,absorbed:0}]);
 assert.equal(feedback.breaches.length,1);
 assert.match(feedback.notice.text,/18 life lost/);
 assert.equal(feedback.notice.tone,'danger');
 feedback.consume([{type:'leak',kind:'termite',x:940,y:640,damage:0,absorbed:12}]);
 assert.match(feedback.notice.text,/12 blocked by shield/);
 assert.equal(feedback.notice.tone,'success');
 feedback.advance(.5);assert.equal(feedback.breaches.length,2);
 feedback.advance(1);assert.equal(feedback.breaches.length,0);
 feedback.clear();assert.equal(feedback.notice,null);
});

