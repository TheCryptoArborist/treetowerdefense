// Offline game-art fixture, no wallet or hosted access bypass.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {Game,TOWERS,HARVEST_CANOPY,pointAt} from '../src/engine.js';
import {installEnvironmentAsset,installAimSprite,installStructureSprite,paintBackdrop,paintHarvestBackdrop,paintLifeTree,paintBuildSite,paintTree,paintPest,paintHarvestLook} from '../src/art.js';
for(const[k,p]of Object.entries({terrain:'assets/environment/terrain-forest-v1.png',road:'assets/environment/road-stone-v1.png',tree:'assets/environment/tree-life-v1.png',harvestTerrain:'assets/environment/terrain-harvest-v2.webp',harvestPests:'assets/enemies/harvest-invaders-v2.webp'}))installEnvironmentAsset(k,await loadImage(p),createCanvas);
for(const type of Object.keys(TOWERS).filter(t=>!TOWERS[t].structure))installAimSprite(type,await loadImage(`assets/defenders/${type}-aim-v1.png`),createCanvas);
for(const type of ['watchtower','cannon'])installStructureSprite(type,await loadImage(`assets/towers/${type}-base-v1.png`),createCanvas);
const g=new Game();g.allowPreview();g.forest.stars=[3,3,3];g.forest.unlocked=Object.keys(TOWERS);g.startEvent(HARVEST_CANOPY.id);g.sap=3000;
const kinds=Object.keys(TOWERS);for(let i=0;i<12;i++)g.place(kinds[i%kinds.length],i);
g.wave=4;g.startWave();g.queue=[];
for(const[kind,progress]of [['termite',220],['beetle',430],['moth',660],['blight',1110],['boss',1480],['termite',2220],['beetle',2830],['moth',3390]]){const e=g.spawn(kind);Object.assign(e,{progress},pointAt(progress,g.map));}
const c=createCanvas(1000,720),ctx=c.getContext('2d');paintBackdrop(ctx,0,0,g.map);paintHarvestBackdrop(ctx,g.map);
paintLifeTree(ctx,'oak',885,659,1.2,0,1,0,true);paintHarvestLook(ctx,'tree',885,659,1.1);
for(let i=0;i<12;i++){const[x,y]=g.map.pads[i],t=g.towers[i];paintBuildSite(ctx,x,y,{occupied:true,number:i+1});paintTree(ctx,t.type,x,y,.82,0,1,0,false,{direction:0,view:0,flip:false},null,true);paintHarvestLook(ctx,t.type,x,y,.82);}
for(const e of g.enemies)paintPest(ctx,e,0,0,{reducedMotion:true,healthBar:false});
ctx.fillStyle='#211409ed';ctx.fillRect(0,0,1000,38);ctx.fillStyle='#ffe0a2';ctx.font='bold 14px Arial';ctx.fillText('HARVEST OF THE CANOPY · AUTUMN ORCHARD · LOCAL GAME-ART PREVIEW',16,25);
fs.writeFileSync('docs/harvest-orchard-preview.jpg',c.toBuffer('image/jpeg'));fs.copyFileSync('docs/harvest-orchard-preview.jpg','assets/brand/harvest-orchard-preview.jpg');console.log('Rendered all eight defense types and all five Harvest invader silhouettes.');
// Palette acceptance: original silhouettes and dark face pixels survive the foliage swap.
const normal=createCanvas(160,180),autumn=createCanvas(160,180);
for(const [canvas,season]of [[normal,false],[autumn,true]])paintTree(canvas.getContext('2d'),'oak',80,155,1,0,1,0,false,{direction:0,view:0,flip:false},null,season);
const before=normal.getContext('2d').getImageData(0,0,160,180).data,after=autumn.getContext('2d').getImageData(0,0,160,180).data;
let recolored=0,facePixels=0;
for(let i=0;i<before.length;i+=4){
 if(before[i+3]!==after[i+3])throw Error('Season palette changed silhouette alpha');
 // Opaque neutral black pixels cover the eyes and mouth. Green antialiased leaf edges may recolor.
 if(before[i+3]>250&&Math.max(before[i],before[i+1],before[i+2])<30&&Math.max(before[i],before[i+1],before[i+2])-Math.min(before[i],before[i+1],before[i+2])<=2){facePixels++;if(before.slice(i,i+4).some((v,n)=>v!==after[i+n]))throw Error('Season palette changed neutral dark face pixels');}
 if(before.slice(i,i+3).some((v,n)=>v!==after[i+n]))recolored++;
}
if(recolored<100||facePixels<100)throw Error('Palette audit did not exercise foliage and face');console.log(JSON.stringify({recolored,unchangedNeutralFacePixels:facePixels,alphaUnchanged:true}));
