// Offline atlas artwork from the real region registry, geometry and wave state.
// This is a component illustration, not an authenticated browser screenshot.
import fs from 'node:fs';
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {Game} from '../src/engine.js';
import {worldMapState,regionScenery,nodePosition,escapeMapText as e} from '../src/world-map.js';
const game=new Game();game.allowPreview();game.wave=10;game.phase='paused';game.forest.bestWaves[0]=9;
const state=worldMapState(game),width=1000,header=156,footer=178,height=header+state.regions.length*370+footer;
let drawing=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#071923"/><g font-family="Arial,sans-serif"><text x="42" y="35" fill="#a7d5bb" font-size="12" letter-spacing="3">CANOPY DEFENSE · CAMPAIGN ATLAS</text><text x="40" y="85" fill="#f7e9be" font-family="Georgia,serif" font-size="43">The living frontier</text><text x="42" y="116" fill="#b4d4c4" font-size="15">60 campaign waves · 5 seasonal waves · room to grow</text><text x="42" y="140" fill="#9eb8b3" font-size="11">MAP COMPONENT PREVIEW · SAMPLE PROGRESS AT WAVE 10 · NOT LIVE GAMEPLAY</text>`;
for(const [index,region] of state.regions.entries()){
 const y=header+index*370;
 drawing+=`<g transform="translate(0 ${y})"><defs><clipPath id="region-${index}"><rect width="1000" height="370"/></clipPath></defs><g clip-path="url(#region-${index})">`+regionScenery(region).replace('<svg ','<svg width="1000" height="370" ')+
  `<rect x="44" y="18" width="620" height="85" rx="8" fill="#06131d" opacity=".85"/><path d="M44 18V103" stroke="${region.difficulty==='veteran'?'#b8a6dd':'#a3d49a'}" stroke-width="3"/><text x="63" y="41" fill="#cce4b8" font-size="11" letter-spacing="2">${e(region.label.toUpperCase())}</text><text x="63" y="73" fill="#fff0cd" font-family="Georgia,serif" font-size="29">${e(region.name)}</text><text x="63" y="94" fill="#d3dfcc" font-size="12">${region.best}/${region.waves.length} waves cleared${region.mode==='campaign'?' · '+region.stars+'/3 stars':' · separate seasonal progress'}</text>`;
 for(const [i,wave] of region.waves.entries()){
  const p=nodePosition(i),x=p.x*10,cy=p.y;
  const selected=wave.current,clear=wave.cleared;
  const fill=selected?'#185c50':clear?'#285746':wave.boss?'#3c2d29':'#182d35';
  const stroke=selected?'#b3ffe7':clear?'#a9d78b':wave.boss?'#ce976c':'#719190';
  drawing+=`<g transform="translate(${x} ${cy})">${selected?'<circle r="37" fill="none" stroke="#ffe2a0" stroke-width="3"/>':''}${wave.boss?`<rect x="-27" y="-27" width="54" height="54" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`:`<circle r="27" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`}<text text-anchor="middle" y="7" fill="#edf2dd" font-size="19" font-weight="bold">${e(wave.number)}</text><rect x="-38" y="35" width="76" height="20" rx="4" fill="#081a21"/><text y="49" text-anchor="middle" fill="#e1e6cf" font-size="10">${wave.boss?(wave.miniBoss?'MINI-BOSS':'BOSS'):'WAVE '+wave.wave}</text>${clear?'<circle cx="-23" cy="-25" r="10" fill="#c5e9a1"/><path d="M-28-25L-24-21-18-29" fill="none" stroke="#16392c" stroke-width="2"/>':''}${wave.milestones.length?'<path d="M28-37L31-29 39-26 31-23 28-15 25-23 17-26 25-29Z" fill="#ffe399"/>':''}</g>`;
 }
 drawing+=`<path d="M0 369H1000" stroke="#769f73" opacity=".5"/></g></g>`;
}
drawing+=`<g transform="translate(0 ${height-footer})"><rect width="1000" height="${footer}" fill="#0a1c23"/><text x="500" y="40" text-anchor="middle" fill="#a7d5bb" font-size="12" letter-spacing="3">BEYOND THE FRONTIER</text><text x="500" y="89" text-anchor="middle" fill="#f7e9be" font-family="Georgia,serif" font-size="32">The canopy can keep growing.</text><text x="500" y="121" text-anchor="middle" fill="#a7c5b7" font-size="15">New forests and wave paths can extend this world.</text><text x="500" y="145" text-anchor="middle" fill="#a7c5b7" font-size="12">Further regions are not available yet.</text></g></g></svg>`;
const out='.netlify/world-map-check';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(`${out}/Canopy-Defense-World-Map.svg`,drawing);
const image=await loadImage(Buffer.from(drawing));
const canvas=createCanvas(width,height),c=canvas.getContext('2d');c.drawImage(image,0,0);
fs.writeFileSync(`${out}/Canopy-Defense-World-Map.png`,canvas.toBuffer('image/png'));
const detail=createCanvas(1000,header+370*2),d=detail.getContext('2d');d.drawImage(canvas,0,0);
fs.writeFileSync(`${out}/Canopy-Defense-World-Map-Detail.png`,detail.toBuffer('image/png'));
console.log(JSON.stringify({width,height,regions:state.regions.length,waves:state.regions.reduce((n,r)=>n+r.waves.length,0),preview:`${out}/Canopy-Defense-World-Map.png`}));
