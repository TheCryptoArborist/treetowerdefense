import test from 'node:test';
import assert from 'node:assert/strict';
import {miniBossPose,installEnemySprite,paintEnemySprite,enemySpriteHeight,loadEnemyArt} from '../src/enemy-art.js';
import {paintPest,pestHealthBounds} from '../src/art.js';
import {pointAt,mapFor} from '../src/engine.js';

test('upright actor views follow all four route headings; gait follows distance and reduced motion freezes it',()=>{
  assert.deepEqual([[0,1],[1,0],[0,-1],[-1,0]].map(([x,y])=>miniBossPose(x,y,0).row),[0,1,2,3]);
  assert.deepEqual([0,20,40,60,80].map(p=>miniBossPose(1,0,p).frame),[0,1,2,3,0]);
  assert.equal(miniBossPose(1,0,60,true).frame,0);
  assert.deepEqual(miniBossPose(1,0,40),miniBossPose(1,0,40));
  assert.equal(miniBossPose(1,0,NaN).frame,0);
  assert.equal(miniBossPose(1,0,72,false,'saw').frame,0);
  assert.equal(miniBossPose(1,0,72,false,'sprayer').frame,3);
});
test('carried tools do not recenter a human between walking frames, and health bars clear every actor',()=>{
  const pixels=new Uint8ClampedArray(64*64*4);
  for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++) {
    for(let y=2;y<14;y++)for(let x=5;x<10;x++)pixels[((row*16+y)*64+frame*16+x)*4+3]=255;
    // A tool extending farther forward in one frame must not shift the torso.
    for(let x=10;x<11+frame;x++)pixels[((row*16+6)*64+frame*16+x)*4+3]=255;
  }
  const make=()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})});
  for(const kind of ['saw','sprayer']) {
    installEnemySprite(kind,{width:64,height:64},make);
    const draws=[],ctx={drawImage(...args){draws.push(args);}};
    for(const progress of [0,20,40,60])paintEnemySprite(ctx,{miniBoss:kind,progress},1,0);
    assert.equal(new Set(draws.map(d=>d[5])).size,1,'Stable body anchor with changing tool width');
    assert.ok(draws.every(d=>Math.abs(d[6]+d[8]-22)<1e-8),'Grounded feet');
    const e={kind:'boss',miniBoss:kind,x:200,y:200,hp:100,maxHp:100};
    const scale=1.0; // Bounds use the same actor height as the renderer.
    assert.ok(pestHealthBounds(e).y<e.y+22-enemySpriteHeight(kind)*scale);
  }
});
test('an unavailable actor atlas leaves the other actors loadable and preserves the upright fallback',async()=>{
  const previousImage=globalThis.Image,previousDocument=globalThis.document;
  const paths=[],warnings=[],previousWarn=console.warn;
  const pixels=new Uint8ClampedArray(64*64*4);
  for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++)for(let y=2;y<14;y++)for(let x=4;x<12;x++)pixels[((row*16+y)*64+frame*16+x)*4+3]=255;
  globalThis.Image=class {width=64;height=64;set src(path){paths.push(path);queueMicrotask(()=>path.includes('sprayer')?this.onerror():this.onload());}};
  globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})})};
  console.warn=(message)=>warnings.push(message);
  try {
    assert.equal(await loadEnemyArt(),false);
    assert.equal(paths.length,3);
    assert.equal(warnings.length,1);
    assert.ok(warnings[0].includes('sprayer'));
    assert.equal(paintEnemySprite({drawImage(){}},{miniBoss:'saw',progress:0},1,0),true);
  } finally {globalThis.Image=previousImage;globalThis.document=previousDocument;console.warn=previousWarn;}
});
test('mini-bosses remain upright with health bars above the silhouette on every route leg',()=>{
  const ctx=new Proxy({rotations:[],rotate(a){this.rotations.push(a);},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};}});
  const map=mapFor();let progress=0;
  for(let i=1;i<map.path.length;i++){
    const a=map.path[i-1],b=map.path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    for(const miniBoss of ['ironroot','saw','sprayer']){
      const e={kind:'boss',miniBoss,id:1,progress:progress+length/2,...pointAt(progress+length/2,map),hp:300,maxHp:440,appearanceTier:1};
      ctx.rotations=[];paintPest(ctx,e,1,0,{healthBar:false});assert.deepEqual(ctx.rotations,[]);
      assert.ok(pestHealthBounds(e).y<e.y-50);
    }
    progress+=length;
  }
});
test('atlas frames retain a common scale and grounded feet; invalid atlases do not install',()=>{
  const pixels=new Uint8ClampedArray(64*64*4);
  for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++)for(let y=2;y<14;y++)for(let x=4;x<12;x++)pixels[((row*16+y)*64+frame*16+x)*4+3]=255;
  const make=()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})});
  assert.throws(()=>installEnemySprite('wrong',{width:64,height:64},make));
  assert.equal(installEnemySprite('ironroot',{width:64,height:64},make).frames,16);
  const draws=[],ctx={drawImage(...args){draws.push(args);}};
  for(const progress of [0,20,40,60])paintEnemySprite(ctx,{miniBoss:'ironroot',progress},1,0);
  assert.equal(new Set(draws.map(d=>d[7])).size,1);
  assert.ok(draws.every(d=>Math.abs(d[6]+d[8]-22)<1e-8));
  assert.equal(paintEnemySprite(ctx,{miniBoss:'unavailable'},1,0),false);
  assert.throws(()=>installEnemySprite('ironroot',{width:64,height:64},()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(pixels.length)})})})));
});
