// Offline atlas artwork from the real region registry, geometry and wave state.
// This is a component illustration, not an authenticated browser screenshot.
import fs from 'node:fs';
import {createCanvas,loadImage,GlobalFonts} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {Game} from '../src/engine.js';
import {worldMapState,regionScenery,regionMapArtwork,nodePosition,WORLD_MAP_BRAND,mapNodeColors,escapeMapText as e} from '../src/world-map.js';
const brand=WORLD_MAP_BRAND;
const game=new Game();game.allowPreview();game.wave=10;game.phase='paused';game.forest.bestWaves[0]=9;
const state=worldMapState(game),width=1000,header=190,footer=178,height=header+state.regions.length*370+footer;
const foregrounds=[];
let drawing=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#050714"/><g font-family="DejaVu Sans,sans-serif"><image href="assets/brand/tree-logo.jpg" x="42" y="46" width="72" height="72"/><text x="136" y="35" fill="#22e7d7" font-size="12" letter-spacing="3">TREE ARCADE · CANOPY DEFENSE</text><text x="132" y="86" fill="#f4fbff" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="43">The living frontier</text><text x="136" y="116" fill="#aeb7cc" font-size="15">60 campaign waves · 5 seasonal waves · room to grow</text><text x="42" y="172" fill="#aeb7cc" font-size="11">MAP COMPONENT PREVIEW · SAMPLE PROGRESS AT WAVE 10 · NOT LIVE GAMEPLAY</text><text x="42" y="147" fill="${brand.cyan}" font-size="13">tree-token.xyz · The TREE ecosystem</text><path d="M0 189H1000" stroke="${brand.cyan}" stroke-opacity=".5"/></g><g font-family="DejaVu Sans,sans-serif">`;
for(const [index,region] of state.regions.entries()){
 const y=header+index*370;
 drawing+=`<g transform="translate(0 ${y})"><defs><clipPath id="region-${index}"><rect width="1000" height="370"/></clipPath></defs><g clip-path="url(#region-${index})">`+regionScenery(region).replace('<svg ','<svg width="1000" height="370" ');
 const foregroundStart=drawing.length;
 drawing+=
  `<rect x="44" y="18" width="620" height="85" rx="8" fill="#050714" opacity=".85"/><path d="M44 18V103" stroke="${region.difficulty==='veteran'?'#7041c3':'#22e7d7'}" stroke-width="3"/><text x="63" y="41" fill="#22e7d7" font-size="11" letter-spacing="2">${e(region.label.toUpperCase())}</text><text x="63" y="73" fill="#f4fbff" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="29">${e(region.name)}</text><text x="63" y="94" fill="#aeb7cc" font-size="12">${region.best}/${region.waves.length} waves cleared${region.mode==='campaign'?' · '+region.stars+'/3 stars':' · separate seasonal progress'}</text>`;
 for(const [i,wave] of region.waves.entries()){
  const p=nodePosition(i),x=p.x*10,cy=p.y;
  const selected=wave.current,clear=wave.cleared;
  const {fill,stroke}=mapNodeColors(wave);
  drawing+=`<g transform="translate(${x} ${cy})">${selected?'<circle r="37" fill="none" stroke="#ffd84b" stroke-width="3"/>':''}${wave.boss?`<rect x="-27" y="-27" width="54" height="54" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`:`<circle r="27" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`}<text text-anchor="middle" y="7" fill="#f4fbff" font-size="19" font-weight="bold">${e(wave.number)}</text><rect x="-38" y="35" width="76" height="20" rx="4" fill="#050714"/><text y="49" text-anchor="middle" fill="#aeb7cc" font-size="10">${wave.boss?(wave.miniBoss?'MINI-BOSS':'BOSS'):'WAVE '+wave.wave}</text>${clear?'<circle cx="-23" cy="-25" r="10" fill="#33f78f"/><path d="M-28-25L-24-21-18-29" fill="none" stroke="#050714" stroke-width="2"/>':''}${wave.milestones.length?'<path d="M28-37L31-29 39-26 31-23 28-15 25-23 17-26 25-29Z" fill="#ffd84b"/>':''}</g>`;
 }
 foregrounds.push({y,artwork:regionMapArtwork(region),markup:drawing.slice(foregroundStart)});
 drawing+=`<path d="M0 369H1000" stroke="#22e7d7" opacity=".5"/></g></g>`;
}
drawing+=`<g transform="translate(0 ${height-footer})"><rect width="1000" height="${footer}" fill="#050714"/><text x="500" y="40" text-anchor="middle" fill="#22e7d7" font-size="12" letter-spacing="3">BEYOND THE FRONTIER</text><text x="500" y="89" text-anchor="middle" fill="#f4fbff" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="32">The canopy can keep growing.</text><text x="500" y="121" text-anchor="middle" fill="#aeb7cc" font-size="15">New forests and wave paths can extend this world.</text><text x="500" y="145" text-anchor="middle" fill="#aeb7cc" font-size="12">Further regions are not available yet.</text></g></g></svg>`;
const out='.netlify/world-map-check';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(`${out}/Canopy-Defense-World-Map.svg`,drawing);
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
if(fs.existsSync(font))GlobalFonts.registerFromPath(font,'DejaVu Sans');
const embedded=drawing.replace('<svg xmlns=', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns=')
 .replace(/href="(assets\/[^"]+)"/g,(_,path)=>`xlink:href="data:image/${path.endsWith('.jpg')?'jpeg':'png'};base64,${fs.readFileSync(path).toString('base64')}"`);
const image=await loadImage(Buffer.from(embedded));
const canvas=createCanvas(width,height),c=canvas.getContext('2d');c.drawImage(image,0,0);
// Skia's SVG loader omits raster <image> elements. Composite the same original
// local assets, then redraw the real marker layer so artwork stays underneath.
const images=new Map();
for(const layer of foregrounds){
 let art=images.get(layer.artwork);if(!art){art=await loadImage(layer.artwork);images.set(layer.artwork,art);}
 const scale=Math.min(270/art.width,280/art.height),w=art.width*scale,h=art.height*scale;
 c.save();c.globalAlpha=.24;c.drawImage(art,715+(270-w)/2,layer.y+55+(280-h)/2,w,h);c.restore();
 const overlay=await loadImage(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="370"><g font-family="DejaVu Sans,sans-serif">${layer.markup}</g></svg>`));
 c.drawImage(overlay,0,layer.y);
}
c.drawImage(await loadImage('assets/brand/tree-logo.jpg'),42,46,72,72);
fs.writeFileSync(`${out}/Canopy-Defense-World-Map.png`,canvas.toBuffer('image/png'));
const detail=createCanvas(1000,header+370*2),d=detail.getContext('2d');d.drawImage(canvas,0,0);
fs.writeFileSync(`${out}/Canopy-Defense-World-Map-Detail.png`,detail.toBuffer('image/png'));
console.log(JSON.stringify({width,height,regions:state.regions.length,waves:state.regions.reduce((n,r)=>n+r.waves.length,0),preview:`${out}/Canopy-Defense-World-Map.png`}));
