import test from 'node:test';import assert from 'node:assert/strict';
import {paintRootShield} from '../src/art.js';
function recorder(){const calls=[],c={calls};for(const method of ['save','restore','translate','scale','beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','ellipse','arc','fill','stroke','fillRect','clip'])c[method]=(...args)=>{assert(args.every(v=>typeof v!=='number'||Number.isFinite(v)));calls.push([method,...args]);};for(const method of ['createRadialGradient','createLinearGradient'])c[method]=(...args)=>{calls.push([method,...args]);return{addColorStop:(...values)=>calls.push(['addColorStop',...values])};};return c;}
test('Root Shield paints a layered dome for every tree size and vanishes when protection is exhausted',()=>{
 for(const scale of [1.02,1.1,1.18*1.06,1.26*1.06])for(const layer of ['back','front']){const c=recorder(),view={scale,shield:50,clock:4,layer},before={...view};paintRootShield(c,885,659,view);assert.deepEqual(view,before);assert(c.calls.some(([op])=>op==='bezierCurveTo'));assert(c.calls.some(([op])=>op==='stroke'));assert.equal(c.calls.filter(([op])=>op==='save').length,c.calls.filter(([op])=>op==='restore').length);}
 for(const shield of [0,-1]){const c=recorder();paintRootShield(c,885,659,{shield});assert.deepEqual(c.calls,[]);}
});
test('reduced-motion force fields have fixed geometry, while ordinary shimmer follows the supplied paused clock',()=>{
 const a=recorder(),b=recorder();paintRootShield(a,885,659,{clock:1,reducedMotion:true});paintRootShield(b,885,659,{clock:20,reducedMotion:true});assert.deepEqual(a.calls,b.calls);
 const running=recorder(),paused=recorder(),later=recorder();paintRootShield(running,885,659,{clock:3});paintRootShield(paused,885,659,{clock:3});paintRootShield(later,885,659,{clock:6});assert.deepEqual(running.calls,paused.calls);assert.notDeepEqual(running.calls,later.calls);
});
