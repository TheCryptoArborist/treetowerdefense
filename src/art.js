import { WIDTH, HEIGHT, PATH, STYLES, PATH_LENGTH, pointAt } from './engine.js';
import { GUARDIAN_SCALE } from './aiming.js';
const TAU = Math.PI * 2;
const outline = '#36533c';
function ellipse(c, x, y, rx, ry, fill, stroke = null, width = 3) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function polygon(c, points, fill, stroke = outline, width = 3) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, points, color, width) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
export function flower(c, x, y, color, scale = 1) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  for (let i = 0; i < 5; i++) ellipse(c, Math.cos(i * TAU / 5) * 4, Math.sin(i * TAU / 5) * 4, 3.4, 3.4, color);
  ellipse(c, 0, 0, 2.3, 2.3, '#ffe397'); c.restore();
}
const environment = new Map();
let environmentRevision = 0;
export function getEnvironmentArtStatus() { return { loaded: [...environment.keys()], revision: environmentRevision }; }
export function installEnvironmentAsset(kind, image, makeCanvas) {
  if (!['terrain','tree','road'].includes(kind)) throw new Error('Unknown environment asset');
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  let bounds = { x:0, y:0, width, height };
  if (kind === 'tree') {
    const source = makeCanvas(width,height), c = source.getContext('2d');c.drawImage(image,0,0);
    const pixels=c.getImageData(0,0,width,height).data;let x0=width,y0=height,x1=0,y1=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>80){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    if(x1<=x0||y1<=y0)throw new Error('Empty Tree of Life silhouette');
    bounds={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
  }
  let texture = null;
  if(kind === 'road'){texture=makeCanvas(384,384);texture.getContext('2d').drawImage(image,0,0,384,384);}
  environment.set(kind,{image,bounds,texture});environmentRevision++;return bounds;
}
export async function loadEnvironmentArt() {
  const files={terrain:'terrain-forest-v1.png',tree:'tree-life-v1.png',road:'road-stone-v1.png'};
  await Promise.all(Object.entries(files).map(([kind,file])=>new Promise(resolve=>{
    const image=new Image();image.onload=()=>{
      try{installEnvironmentAsset(kind,image,(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});}catch{console.warn('Environment fallback active:',kind);}resolve();
    };image.onerror=()=>{console.warn('Environment fallback active:',kind);resolve();};image.src=`assets/environment/${file}`;
  })));
  return getEnvironmentArtStatus();
}
export function paintLifeTree(c,type,x,y,scale=1,style=0,level=1,clock=0) {
  c.save();c.translate(x,y);c.scale(scale*(1+(level-1)*.06),scale*(1+(level-1)*.06));
  ellipse(c,0,12,58,13,'#080f0c90');
  const art=environment.get('tree');
  if(art){
    const f=art.bounds,ratio=Math.min(176/f.height,146/f.width),w=f.width*ratio,h=f.height*ratio;
    c.drawImage(art.image,f.x,f.y,f.width,f.height,-w/2,20-h,w,h);
  }else{
    // A face-free ancient oak remains available while local artwork loads.
    for(const side of [-1,1]){line(c,[[0,-32],[side*16,2],[side*47,16]],'#292a1d',13);line(c,[[0,-32],[side*16,2],[side*47,16]],'#685d42',7);}
    polygon(c,[[-19,5],[-12,-85],[-32,-118],[4,-109],[24,-121],[15,-67],[22,8]],'#665638','#25291e',3);
    for(let i=0;i<7;i++){const a=i*1.77;line(c,[[0,-64],[Math.cos(a)*25,-103],[Math.cos(a)*52,-136+Math.sin(a)*16]],'#4c4a31',7);}
    for(let i=0;i<34;i++){const a=i*2.4,r=15+(i%7)*6;ellipse(c,Math.cos(a)*r,-119+Math.sin(a)*r*.65,12+(i%3)*3,9,'#38492a',null);}
    line(c,[[-3,-65],[3,-42],[-2,-16],[5,8]],'#d2aa5a',2);
  }
  c.restore();
}
const defenderSprites = new Map();
const aimSprites = new Map();
const aimFailures = [];
const DEFENDER_TYPES = ['oak', 'pine', 'palm', 'cypress', 'mushroom'];
const artFailures = [];
export function getDefenderArtStatus() {
  return { loaded: [...defenderSprites.keys()], failed: [...artFailures] };
}
// Images remain unmodified on disk. Alpha bounds select each growth cell at draw time.
export function installDefenderSprite(type, image, makeCanvas) {
  if (!DEFENDER_TYPES.includes(type)) throw new Error('Unknown defender artwork');
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  const source = makeCanvas(width, height), context = source.getContext('2d');
  context.drawImage(image, 0, 0); const data = context.getImageData(0, 0, width, height).data;
  // Generated atlases are loosely spaced. Connected alpha silhouettes isolate each
  // warrior without clipping shields or including a neighboring character.
  const count = width * height, labels = new Int32Array(count), stack = new Int32Array(count), parts = [];
  let label = 0;
  for (let pixel = 0; pixel < count; pixel++) {
    if (labels[pixel] || data[pixel * 4 + 3] < 180) continue;
    label++; let pending = 1, size = 0, x0 = width, y0 = height, x1 = 0, y1 = 0;
    stack[0] = pixel; labels[pixel] = label;
    while (pending) {
      const at = stack[--pending], x = at % width, y = Math.floor(at / width);
      size++; x0 = Math.min(x0,x);x1 = Math.max(x1,x);y0 = Math.min(y0,y);y1 = Math.max(y1,y);
      const neighbors = [x ? at-1 : -1, x < width-1 ? at+1 : -1, y ? at-width : -1, y < height-1 ? at+width : -1];
      for (const next of neighbors) if (next >= 0 && !labels[next] && data[next*4+3] >= 180) {labels[next]=label;stack[pending++]=next;}
    }
    parts.push({label,size,x0,y0,x1,y1});
  }
  const bodies = parts.sort((a,b)=>b.size-a.size).slice(0,3).sort((a,b)=>a.x0-b.x0);
  if (bodies.length !== 3 || bodies.some(body=>body.size < 1000)) throw new Error(`Missing ${type} growth silhouettes`);
  const owners = new Int8Array(label+1); owners.fill(-1);
  bodies.forEach((body,i)=>{owners[body.label]=i;});
  // Floating spores belong to their nearest warrior. Ignore tiny alpha noise.
  for (const part of parts) if (owners[part.label] < 0 && part.size >= 24) {
    const x=(part.x0+part.x1)/2,y=(part.y0+part.y1)/2;
    let nearest=0,distance=Infinity;
    bodies.forEach((body,i)=>{
      const dx=x-Math.max(body.x0,Math.min(x,body.x1)),dy=y-Math.max(body.y0,Math.min(y,body.y1));
      const score=dx*dx+dy*dy+.01*(x-(body.x0+body.x1)/2)**2;
      if(score<distance){distance=score;nearest=i;}
    }); owners[part.label]=nearest;
  }
  const frames = bodies.map(()=>({x:width,y:height,width:0,height:0}));
  const isolated = bodies.map(()=>{const c=makeCanvas(width,height);return {canvas:c,context:c.getContext('2d')};});
  const pixels = isolated.map(item=>item.context.createImageData(width,height));
  for(let at=0;at<count;at++){
    if(data[at*4+3]<30)continue;
    let owner=owners[labels[at]];
    if(owner<0 && data[at*4+3]<180){
      const x=at%width,y=Math.floor(at/width);
      for(let dy=-2;dy<=2 && owner<0;dy++)for(let dx=-2;dx<=2 && owner<0;dx++){
        if(x+dx>=0 && x+dx<width && y+dy>=0 && y+dy<height)owner=owners[labels[at+dy*width+dx]];
      }
    }
    if(owner<0)continue;
    const x=at%width,y=Math.floor(at/width),frame=frames[owner];
    frame.x=Math.min(frame.x,x);frame.y=Math.min(frame.y,y);frame.width=Math.max(frame.width,x+1);frame.height=Math.max(frame.height,y+1);
    pixels[owner].data.set(data.subarray(at*4,at*4+4),at*4);
  }
  frames.forEach(frame=>{frame.width-=frame.x;frame.height-=frame.y;});
  isolated.forEach((item,i)=>item.context.putImageData(pixels[i],0,0));
  const variants = [];
  for (let level = 0; level < 3; level++) {
    const frame = frames[level], styles = [];
    for (let style = 0; style < STYLES.length; style++) {
      const canvas = makeCanvas(160, 180), c = canvas.getContext('2d');
      const ratio = Math.min([105,122,140][level] / frame.height, 146 / frame.width);
      const w = frame.width * ratio, h = frame.height * ratio;
      // Cache recolors once, rather than applying expensive filters every animation frame.
      c.filter = ['none', 'brightness(1.12) saturate(.8)', 'sepia(.7) hue-rotate(210deg) saturate(1.15)', 'sepia(.8) saturate(1.5) brightness(1.15)', 'sepia(.65) hue-rotate(110deg) saturate(1.4)', 'sepia(.65) hue-rotate(285deg) saturate(1.2)'][style];
      c.drawImage(isolated[level].canvas, frame.x, frame.y, frame.width, frame.height, 80-w/2, 160-h, w, h);
      c.filter = 'none'; styles.push(canvas);
    }
    variants.push(styles);
  }
  defenderSprites.set(type, { variants, frames });
  return frames;
}
export async function loadDefenderArt() {
  await Promise.all(DEFENDER_TYPES.map(type => new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try { installDefenderSprite(type,image,(w,h) => { const c=document.createElement('canvas');c.width=w;c.height=h;return c; }); }
      catch { artFailures.push(type); }
      resolve();
    };
    image.onerror = () => { artFailures.push(type);resolve(); };
    image.src = `assets/defenders/${type}-warriors.png`;
  })));
  return getDefenderArtStatus();
}
export function getAimArtStatus() { return { loaded: [...aimSprites.keys()], failed: [...aimFailures] }; }
// The atlas grid is approximate. Isolate connected bodies so extended weapons
// survive cell boundaries without collecting parts of a neighboring guardian.
export function installAimSprite(type, image, makeCanvas) {
  if (!DEFENDER_TYPES.includes(type)) throw new Error('Unknown directional guardian');
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  const source = makeCanvas(width, height), context = source.getContext('2d'); context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, width, height).data, count = width * height;
  const labels = new Int32Array(count), stack = new Int32Array(count), parts = []; let label = 0;
  for (let pixel = 0; pixel < count; pixel++) {
    if (labels[pixel] || data[pixel * 4 + 3] < 180) continue;
    label++; let pending = 1, size = 0, x0 = width, y0 = height, x1 = 0, y1 = 0;
    stack[0] = pixel; labels[pixel] = label;
    while (pending) {
      const at = stack[--pending], x = at % width, y = Math.floor(at / width);
      size++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const next of [x ? at-1 : -1, x < width-1 ? at+1 : -1, y ? at-width : -1, y < height-1 ? at+width : -1]) {
        if (next >= 0 && !labels[next] && data[next * 4 + 3] >= 180) { labels[next] = label; stack[pending++] = next; }
      }
    }
    parts.push({ label, size, x0, y0, x1, y1 });
  }
  const bodies = parts.sort((a,b) => b.size-a.size).slice(0,15).sort((a,b) => (a.y0+a.y1)-(b.y0+b.y1));
  if (bodies.length !== 15 || bodies.some(body => body.size < 1000)) throw new Error(`Missing ${type} directional silhouettes`);
  const rows = Array.from({length:3}, (_,row) => bodies.slice(row*5,row*5+5).sort((a,b) => (a.x0+a.x1)-(b.x0+b.x1)));
  const ordered = rows.flat(), owners = new Int8Array(label+1); owners.fill(-1);
  ordered.forEach((body,i) => { owners[body.label] = i; });
  for (const part of parts) if (owners[part.label] < 0 && part.size >= 24) {
    const x = (part.x0+part.x1)/2, y = (part.y0+part.y1)/2;
    let nearest = 0, distance = Infinity;
    ordered.forEach((body,i) => {
      const dx = x-Math.max(body.x0,Math.min(x,body.x1)), dy = y-Math.max(body.y0,Math.min(y,body.y1));
      const score = dx*dx+dy*dy+.01*(x-(body.x0+body.x1)/2)**2;
      if (score < distance) { distance = score; nearest = i; }
    }); owners[part.label] = nearest;
  }
  const pixelOwners = new Int8Array(count); pixelOwners.fill(-1);
  const flatFrames = ordered.map(() => ({x:width,y:height,width:0,height:0}));
  for (let at = 0; at < count; at++) {
    if (data[at*4+3] < 30) continue;
    let owner = owners[labels[at]];
    const x = at % width, y = Math.floor(at / width);
    if (owner < 0 && data[at*4+3] < 180) {
      for (let dy=-2; dy<=2 && owner<0; dy++) for (let dx=-2; dx<=2 && owner<0; dx++) {
        if (x+dx>=0 && x+dx<width && y+dy>=0 && y+dy<height) owner = owners[labels[at+dy*width+dx]];
      }
    }
    if (owner < 0) continue;
    pixelOwners[at] = owner; const f = flatFrames[owner];
    f.x = Math.min(f.x,x); f.y = Math.min(f.y,y); f.width = Math.max(f.width,x+1); f.height = Math.max(f.height,y+1);
  }
  flatFrames.forEach(f => { f.width -= f.x; f.height -= f.y; });
  const frames = Array.from({length:3}, (_,row) => {
    const cells = flatFrames.slice(row*5,row*5+5);
    // One scale per growth row avoids rescaling when the guardian turns.
    const ratio = Math.min([105,122,140][row]/Math.max(...cells.map(f=>f.height)),146/Math.max(...cells.map(f=>f.width)));
    return cells.map(f => ({...f,w:f.width*ratio,h:f.height*ratio}));
  });
  const variants = frames.map((row,level) => row.map((f,view) => {
    // Crop-sized canvases keep atlas isolation memory bounded.
    const isolated = makeCanvas(f.width,f.height), ic = isolated.getContext('2d'), pixels = ic.createImageData(f.width,f.height);
    for (let y=0; y<f.height; y++) for (let x=0; x<f.width; x++) {
      const at = (f.y+y)*width+f.x+x;
      if (pixelOwners[at] === level*5+view) pixels.data.set(data.subarray(at*4,at*4+4),(y*f.width+x)*4);
    }
    ic.putImageData(pixels,0,0);
    return STYLES.map((style,index) => {
      const canvas = makeCanvas(160,180), c = canvas.getContext('2d');
      c.filter = ['none','brightness(1.12) saturate(.8)','sepia(.7) hue-rotate(210deg) saturate(1.15)','sepia(.8) saturate(1.5) brightness(1.15)','sepia(.65) hue-rotate(110deg) saturate(1.4)','sepia(.65) hue-rotate(285deg) saturate(1.2)'][index];
      c.drawImage(isolated,80-f.w/2,160-f.h,f.w,f.h); c.filter = 'none'; return canvas;
    });
  }));
  aimSprites.set(type,{frames,variants}); return frames;
}
export async function loadAimArt() {
  await Promise.all(DEFENDER_TYPES.map(type=>new Promise(resolve=>{
    const image=new Image();image.onload=()=>{
      try{installAimSprite(type,image,(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});}catch{aimFailures.push(type);}resolve();
    };image.onerror=()=>{aimFailures.push(type);resolve();};image.src=`assets/defenders/${type}-aim-v1.png`;
  })));
  return getAimArtStatus();
}
// Hand-calibrated launch points in the unmodified 1619×971 v1 atlases.
// Growth rows: Sapling, Guardian, Ancient. Views: S, SE, E, NE, N.
const aimSockets = {
  pine: [
    [[68,220],[511,224],[941,220],[1270,182],[1575,184]],
    [[35,538],[530,539],[950,533],[1282,495],[1603,497]],
    [[12,861],[563,860],[964,854],[1287,816],[1607,818]]
  ],
  palm: [
    [[77,113],[397,133],[927,138],[1234,110],[1555,105]],
    [[60,410],[383,426],[931,446],[1251,425],[1580,409]],
    [[55,730],[379,735],[945,771],[1248,747],[1580,754]]
  ],
  cypress: [
    [[12,128],[360,156],[974,170],[1291,150],[1603,128]],
    [[13,427],[342,458],[968,479],[1294,450],[1603,427]],
    [[12,769],[339,779],[972,794],[1295,768],[1605,751]]
  ],
  mushroom: [
    [[99,203],[450,208],[916,204],[1245,199],[1563,199]],
    [[60,519],[421,523],[929,516],[1276,499],[1588,499]],
    [[62,843],[419,833],[929,843],[1275,825],[1588,826]]
  ]
};
function fallbackSocket(type,level,facing) {
  const angle=facing.direction*Math.PI/4,growth=1+(level-1)*.12;
  return type==='oak'?{x:0,y:17}:{x:Math.sin(angle)*38*growth,y:(-30+Math.cos(angle)*18)*growth};
}
export function getGuardianShotOrigin(shot) {
  if(shot.type==='oak')return{x:shot.x,y:shot.y+17*GUARDIAN_SCALE};
  const art=aimSprites.get(shot.type),f=art?.frames[shot.level-1]?.[shot.facing.view];
  if(!f){const socket=fallbackSocket(shot.type,shot.level,shot.facing);return{x:shot.x+socket.x*GUARDIAN_SCALE,y:shot.y+socket.y*GUARDIAN_SCALE};}
  const [px,py]=aimSockets[shot.type][shot.level-1][shot.facing.view];
  const u=(px-f.x)/f.width,v=(py-f.y)/f.height;
  return{x:shot.x+(u-.5)*f.w*.8*GUARDIAN_SCALE*(shot.facing.flip?-1:1),y:shot.y+(16-f.h*.8+v*f.h*.8)*GUARDIAN_SCALE};
}
function paintAimingFallback(c,type,style,level,facing) {
  const p=STYLES[style],wood=type==='cypress'?'#dcd8bb':p.bark,growth=1+(level-1)*.12;
  c.save();c.scale(growth,growth);
  ellipse(c,-14,12,14,8,'#211d16');ellipse(c,14,12,14,8,'#211d16');
  polygon(c,[[-18,-38],[18,-38],[18,5],[-18,5]],wood,'#151c13',3);
  polygon(c,[[-24,-38],[-23,-81],[-12,-78],[-5,-88],[8,-81],[21,-85],[24,-38]],wood,'#151c13',3);
  for(let i=0;i<5;i++)line(c,[[-18+i*9,-74],[-17+i*9,-42]],'#3c301c',1.3);
  if(facing.view<3){const side=facing.flip?-1:1;ellipse(c,facing.view===2?side*14:-10,-61,5,7,'#10150e');if(facing.view<2)ellipse(c,10,-61,5,7,'#10150e');ellipse(c,facing.view===2?side*16:0,-43,facing.view===2?5:12,7,'#10150e');}
  for(let i=0;i<3;i++)sprout(c,-12+i*12,-78,(i-1)*17,-24,p.canopy);
  if(type==='mushroom')ellipse(c,0,-83,32,12,p.canopy,'#151c13',2);
  const socket=fallbackSocket(type,1,facing),hand=type==='oak'?fallbackSocket('pine',1,facing):socket;
  line(c,[[0,-30],[hand.x*.6,hand.y],[hand.x,hand.y]],wood,12);ellipse(c,hand.x,hand.y,7,6,wood,'#151c13',2);
  if(type==='pine'){ellipse(c,hand.x,hand.y,8,6,'#574b2e','#151c13',2);ellipse(c,hand.x,hand.y,3,3,p.canopy);}
  if(type==='palm'||type==='cypress'){line(c,[[hand.x*.5,-35],[hand.x,hand.y]],'#5d4d31',5);ellipse(c,hand.x,hand.y,5,7,type==='palm'?p.canopy:'#d4c09b','#151c13',1);}
  c.restore();
}
function sprout(c,x,y,dx,dy,color) {
  line(c,[[x,y],[x+dx*.55,y+dy*.55],[x+dx,y+dy]],'#11130f',4);
  c.save();c.translate(x+dx,y+dy);c.rotate(Math.atan2(dy,dx)+Math.PI/2);
  polygon(c,[[0,-15],[-7,-3],[0,8],[7,-3]],color,'#11130f',2.5);
  line(c,[[0,-9],[0,5]],'#182819',1.5);c.restore();
}
function paintReferenceGuardian(c,type,style,level,clock,attack) {
  const p=STYLES[style],ink='#121510';
  const wood=style===0?(type==='cypress'?'#e6e2c7':'#b49146'):p.bark;
  const growth=1+(level-1)*.12;c.scale(growth,growth);
  // Fallback uses the same stump-head, black-eye, bark-limb design as the references.
  for(const side of [-1,1]) {
    polygon(c,[[side*6,-3],[side*18,0],[side*25,15],[side*10,16]],wood,ink,3);
    ellipse(c,side*20,17,16,8,ink);
  }
  polygon(c,[[-16,-40],[16,-40],[17,1],[-17,1]],wood,ink,3.5);
  const armSwing=attack?Math.sin(clock*22)*4:0;
  polygon(c,[[-14,-35],[-28,-24],[-36,-39+armSwing],[-45,-36+armSwing],[-36,-9],[-14,-20]],wood,ink,3.5);
  ellipse(c,-39,-40+armSwing,10,12,wood,ink,3);line(c,[[-45,-42+armSwing],[-35,-42+armSwing]],ink,2);
  polygon(c,[[14,-34],[29,-18],[39,-30],[44,-20],[34,-7],[15,-19]],wood,ink,3.5);
  const headW=type==='cypress'?20:25;
  polygon(c,[[-headW,-37],[-headW-2,-79],[-14,-77],[-11,-85],[-2,-81],[2,-88],[12,-79],[headW,-82],[headW+1,-36]],wood,ink,4);
  for(const [x,y,length]of [[-18,-73,23],[-8,-78,17],[4,-79,22],[15,-73,20],[-13,-49,10],[12,-48,11]])line(c,[[x,y],[x+1,y+length]],'#3c301c',1.4);
  if(type==='cypress') {
    polygon(c,[[-18,-64],[-3,-61],[-6,-52],[-15,-51]],ink,null);polygon(c,[[3,-61],[18,-64],[15,-51],[6,-52]],ink,null);
  } else {ellipse(c,-11,-59,8,10,ink);ellipse(c,11,-59,8,10,ink);}
  c.beginPath();c.moveTo(-16,-46);c.bezierCurveTo(-13,-51,12,-49,17,-44);c.lineTo(15,attack?-26:-30);c.quadraticCurveTo(0,-33,-16,attack?-26:-30);c.closePath();c.fillStyle=ink;c.fill();
  for(let i=0;i<3;i++){c.fillStyle='#fffbe9';c.fillRect(-11+i*8,-46,6,5);if(attack)c.fillRect(-10+i*7,-31,5,4);}
  for(const [x,dx,dy]of [[-17,-22,-23],[-2,-7,-28],[10,10,-31],[19,25,-22]])sprout(c,x,-78,dx,dy,p.canopy);
  // Species equipment stays distinct even if an image is still loading.
  if(type==='oak'||type==='cypress') {
    polygon(c,[[24,-43],[47,-39],[55,-22],[46,-2],[27,-9],[22,-27]],style>=3?p.accent:'#dad7bd',ink,3);
    polygon(c,[[29,-36],[43,-33],[48,-22],[42,-9],[30,-14],[27,-26]],wood,ink,2);
    line(c,[[29,-34],[44,-10]],'#f4dca9',2);line(c,[[42,-33],[30,-13]],'#f4dca9',2);
  }
  if(type==='pine') {polygon(c,[[23,-32],[48,-30],[49,-18],[23,-18]],'#715b32',ink,3);for(let i=0;i<3;i++)line(c,[[47,-28+i*4],[57,-29+i*4]],p.canopy,2);}
  if(type==='palm') {line(c,[[43,9],[43,-65]],ink,5);sprout(c,43,-62,16,-15,p.canopy);sprout(c,43,-62,-14,-15,p.canopy);}
  if(type==='cypress') {line(c,[[-35,8],[-35,-87]],ink,4);polygon(c,[[-35,-107],[-42,-85],[-28,-85]],'#8d7141',ink,2);}
  if(type==='mushroom') {
    c.beginPath();c.moveTo(-32,-76);c.bezierCurveTo(-25,-111,25,-111,32,-76);c.quadraticCurveTo(0,-68,-32,-76);c.fillStyle=p.canopy;c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
    for(const[x,y]of[[-16,-85],[0,-95],[17,-85]])ellipse(c,x,y,5,4,p.accent);
  }
  if(level>=2)for(const side of[-1,1])polygon(c,[[side*14,-39],[side*23,-41],[side*28,-29],[side*17,-27]],wood,ink,2.5);
  if(level===3){line(c,[[-10,-24],[-10,-4]],p.accent,2);line(c,[[10,-24],[10,-4]],p.accent,2);}
}
export function paintTree(c,type,x,y,scale=1,style=0,level=1,clock=0,attack=false,facing=null) {
  const p=STYLES[style];c.save();c.translate(x,y);c.scale(scale,scale);
  ellipse(c,0,17,36+(level-1)*4,10,'#26372a30');
  if(style>=2)ellipse(c,0,17,37,10,p.accent+'35',p.accent+'90',2);
  const bob=clock>0&&(!facing||!attack)?Math.sin(clock*2.5+x*.03)*1.2:0;c.translate(0,bob);
  if(attack&&!facing)c.rotate(Math.sin(clock*30)*.028);
  const sprite=defenderSprites.get(type);
  const aimed=facing&&aimSprites.get(type);
  if(aimed){c.save();if(facing.flip)c.scale(-1,1);c.drawImage(aimed.variants[level-1][facing.view][style],-64,-112,128,144);c.restore();}
  else if(facing)paintAimingFallback(c,type,style,level,facing);
  else if(sprite)c.drawImage(sprite.variants[level-1][style],-64,-112,128,144);
  else paintReferenceGuardian(c,type,style,level,clock,attack);
  if(style===1){flower(c,-20,-58,'#ffdbe9',.85);flower(c,20,-67,'#fff1bc',.75);}
  if(style>=2)for(let i=0;i<(style>=4?4:2);i++){
    const a=i*TAU/(style>=4?4:2)+clock*.65,dx=Math.cos(a)*39,dy=-42+Math.sin(a)*29;
    polygon(c,[[dx,dy-5],[dx+3,dy],[dx,dy+5],[dx-3,dy]],p.accent,null);
  }
  c.restore();
}
export function paintPest(c,e,clock,time=0,{hit=0,reducedMotion=false,healthBar=true}={}) {
  const boss=e.kind==='boss',moth=e.kind==='moth',blight=e.kind==='blight';
  const size=boss?1.85:e.kind==='beetle'?1.12:blight?1.06:moth?.92:.88;
  const colors=hit>0&&!reducedMotion?['#c6a777','#65533b']:{termite:['#ad8451','#493426'],beetle:['#657a58','#26372c'],moth:['#a39b80','#47453d'],blight:['#805c77','#302333'],boss:['#705d42','#252b24']}[e.kind];
  const ahead=Number.isFinite(e.progress)?pointAt(Math.min(PATH_LENGTH,e.progress+2)):null;
  const angle=ahead?Math.atan2(ahead.y-e.y,ahead.x-e.x)+Math.PI/2:0;
  c.save();c.translate(e.x,e.y);ellipse(c,0,7,23*size,9*size,'#0a100b65');c.rotate(angle);c.scale(size,size);
  if(!reducedMotion&&hit>0)c.translate(0,hit*3);
  const march=Math.sin(clock*14+e.id)*3;
  for(const side of [-1,1])for(let i=-1;i<=1;i++){
    line(c,[[side*8,i*8],[side*(18+Math.abs(i)*2),i*12+march*side],[side*26,i*16+march*side+5]],'#171e18',3.5);
    line(c,[[side*9,i*8],[side*18,i*12+march*side]],colors[0],1.4);
  }
  if(moth){
    c.save();c.scale(1,.72+Math.abs(Math.sin(clock*13))*.28);
    for(const side of [-1,1]){
      polygon(c,[[side*4,-10],[side*36,-24],[side*31,-4],[side*21,7],[side*34,19],[side*11,14],[side*3,5]],colors[0],colors[1],2);
      line(c,[[side*6,-7],[side*28,-15],[side*19,0],[side*8,9]],'#655c4b',2);
      ellipse(c,side*24,-10,4,5,'#443c35','#b7a47d',1);
    }c.restore();
  }
  const shell=c.createLinearGradient(-15,0,15,0);shell.addColorStop(0,colors[1]);shell.addColorStop(.35,colors[0]);shell.addColorStop(1,colors[1]);
  ellipse(c,0,5,moth?5:12,19,shell,'#182019',2);
  for(let i=0;i<5;i++)line(c,[[-8,1+i*4],[0,3+i*4],[8,1+i*4]],'#1b241d90',1.5);
  if(e.kind==='beetle') {
    // Broad overlapping armor reads differently from the termite's narrow ribs.
    for(let i=0;i<3;i++)polygon(c,[[-10,-9+i*9],[-8,-14+i*9],[8,-14+i*9],[11,-8+i*9],[7,-2+i*9],[-7,-2+i*9]],shell,'#17241b',1.6);
    line(c,[[-7,-10],[-5,15]],'#c2c99a90',1.8);
  }
  if(e.kind==='beetle'||boss){line(c,[[0,-10],[0,22]],'#111b16',2);line(c,[[-7,-7],[-9,12]],'#b1b79870',1.5);}
  ellipse(c,0,-10,boss?14:8,10,shell,'#1b241c',2);ellipse(c,0,-23,boss?10:7,7,colors[1],'#121a14',2);
  for(const side of [-1,1]){
    line(c,[[side*4,-26],[side*11,-33],[side*14,-39]],colors[0],1.5);
    polygon(c,[[side*3,-28],[side*10,-37],[side*6,-29],[side*2,-27]],'#cfb879','#1c2319',1);
    ellipse(c,side*5,-25,1.4,1.8,blight?'#d699c6':'#d5aa5e');
  }
  if(blight||boss)for(const side of [-1,1])for(let i=0;i<4;i++){
    polygon(c,[[side*8,-8+i*7],[side*(18+(boss?4:0)),-15+i*7],[side*11,1+i*7]],boss?'#877355':'#8a6588','#1e261e',1.5);
  }
  if(boss){
    for(const side of [-1,1])polygon(c,[[side*6,-20],[side*22,-38],[side*19,-53],[side*12,-43],[side*13,-35],[side*3,-24]],'#b5a073','#272d24',2);
    line(c,[[-6,-9],[-3,16]],'#ba965370',3);
  }
  if(e.poisonUntil>time){ellipse(c,-18,0,4,4,'#ae79bf80');ellipse(c,18,-8,3,3,'#ae79bf80');}
  if(e.slowUntil>time){c.strokeStyle='#a3d2c0';c.lineWidth=2;c.beginPath();c.ellipse(0,4,25,30,0,0,TAU);c.stroke();}
  c.restore();
  if(healthBar&&(e.hp<e.maxHp||boss)){c.fillStyle='#131b16';c.fillRect(e.x-20*size,e.y-45*size,40*size,5);c.fillStyle='#b88762';c.fillRect(e.x-20*size,e.y-45*size,40*size*Math.max(0,e.hp/e.maxHp),5);}
}
export function paintCombatEffects(c,feedback,reducedMotion=false) {
  for(const defeat of feedback.defeats){
    const t=1-defeat.life/defeat.max;
    c.save();c.globalAlpha=Math.max(0,(1-t)*.8);
    if(!reducedMotion){c.translate(defeat.x,defeat.y+5*t);c.scale(1-t*.18,1-t*.32);c.translate(-defeat.x,-defeat.y);}
    paintPest(c,{...defeat,hp:1,maxHp:1,slowUntil:0,poisonUntil:0},0,0,{healthBar:false,reducedMotion:true});
    c.restore();
  }
  // Reduced-motion mode keeps health bars and text, omitting animated impact rings.
  if(reducedMotion)return;
  for(const impact of feedback.impacts){
    const t=1-impact.life/impact.max, color={oak:'#c9ac70',pine:'#c1d49f',palm:'#afd6c4',cypress:'#bbad8c',mushroom:'#ba8dc1',storm:'#d8d4a2'}[impact.source]||'#c9ac70';
    c.save();c.globalAlpha=Math.max(0,1-t);c.strokeStyle=color;c.lineWidth=2*(1-t)+.5;
    c.beginPath();c.ellipse(impact.x,impact.y,5+t*21,4+t*13,0,0,TAU);c.stroke();
    for(let i=0;i<4;i++){const a=i*TAU/4+.4;line(c,[[impact.x+Math.cos(a)*(8+t*13),impact.y+Math.sin(a)*(8+t*13)],[impact.x+Math.cos(a)*(12+t*19),impact.y+Math.sin(a)*(12+t*19)]],color,1.5);}
    c.restore();
  }
}
function cottage(c, x, y) {
  ellipse(c,x,y+14,58,16,'#38533625');
  polygon(c,[[x-33,y-28],[x+30,y-28],[x+30,y+12],[x-33,y+12]],'#7a7158','#363e31',3);
  polygon(c,[[x-45,y-24],[x-7,y-62],[x+44,y-25]],'#555b4b','#2c382e',3);
  line(c,[[x-32,y-28],[x-7,y-52],[x+28,y-29]],'#98997a',2);
  polygon(c,[[x-4,y-7],[x+9,y-7],[x+9,y+12],[x-4,y+12]],'#76543a','#59664b',2);
  for(let i=0;i<8;i++)line(c,[[x-29+i*8,y-23],[x-29+i*8,y+10]],'#3a423280',1);
  for(let i=0;i<4;i++)line(c,[[x-26+i*6,y-29-i*5],[x+27-i*7,y-29-i*5]],'#b2ad8150',1);
  ellipse(c,x-18,y-7,7,8,'#b1ad79','#363e31',2);
  line(c,[[x+25,y-54],[x+25,y-83]],'#70533a',3);
  polygon(c,[[x+25,y-82],[x+51,y-76],[x+25,y-65]],'#9d9160','#38432f',2);
}
export function paintBuildSite(c,x,y,{selected=false,hovered=false,recommended=false,occupied=false,number=0}={}) {
  c.save();c.translate(x,y);
  ellipse(c,0,17,39,17,'#10191290');ellipse(c,0,12,34,20,'#353c32','#222b22',3);
  ellipse(c,0,9,32,18,occupied?'#444a3a':'#56594a',selected||hovered?'#d0b06c':'#858774',2);
  ellipse(c,0,9,25,13,'#343d3050','#252e2570',1);
  for(let i=0;i<6;i++){const a=i*TAU/6;line(c,[[Math.cos(a)*26,9+Math.sin(a)*15],[Math.cos(a)*31,9+Math.sin(a)*18]],'#202a2280',1.5);}
  if(recommended){c.strokeStyle='#e6c27a';c.lineWidth=3;c.beginPath();c.ellipse(0,10,40,24,0,0,TAU);c.stroke();}
  if(!occupied){c.fillStyle='#e1d8ae';c.font='bold 19px Arial';c.textAlign='center';c.fillText('+',0,16);c.fillStyle='#eee6cc';c.font='bold 10px Arial';c.strokeStyle='#101c16';c.lineWidth=3;c.strokeText(number,0,42);c.fillText(number,0,42);}
  c.restore();
}
export function paintBackdrop(c,chapter=0,rank=0) {
  let seed=89+chapter*100;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  c.save();c.clearRect(0,0,WIDTH,HEIGHT);
  const terrain=environment.get('terrain');
  if(terrain)c.drawImage(terrain.image,0,0,WIDTH,HEIGHT);
  else{const gradient=c.createLinearGradient(0,0,0,HEIGHT);gradient.addColorStop(0,'#48513a');gradient.addColorStop(1,'#293d2c');c.fillStyle=gradient;c.fillRect(0,0,WIDTH,HEIGHT);
    for(let i=0;i<500;i++)ellipse(c,rand()*WIDTH,rand()*HEIGHT,2+rand()*9,1+rand()*4,i%2?'#a19c6525':'#152c2540');}
  if(chapter){c.fillStyle=chapter===1?'#b6954124':'#365c8155';c.fillRect(0,0,WIDTH,HEIGHT);}
  const road=environment.get('road');
  c.lineJoin='round';c.lineCap='butt';c.beginPath();PATH.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle='#242c2070';c.lineWidth=70;c.stroke();
  c.strokeStyle=road?c.createPattern(road.texture,'repeat'):'#8a7d63b0';c.lineWidth=58;c.stroke();
  for(let i=0;i<(road?0:850);i++){
    const d=rand()*(PATH_LENGTH-3),p=pointAt(d),ahead=pointAt(d+2),angle=Math.atan2(ahead.y-p.y,ahead.x-p.x),offset=(rand()-.5)*50;
    const x=p.x-Math.sin(angle)*offset,y=p.y+Math.cos(angle)*offset,w=1+rand()*5,h=1+rand()*2;
    ellipse(c,x,y,w,h,['#4b4a3b90','#b9ad8b85','#65665370','#ddd0ac50'][i%4]);
    if(i%29===0)line(c,[[x-5,y-2],[x,y],[x+4,y+4]],'#393c3180',1);
  }
  for(let i=0;i<280;i++){
    const d=rand()*(PATH_LENGTH-3),p=pointAt(d),ahead=pointAt(d+2),angle=Math.atan2(ahead.y-p.y,ahead.x-p.x),side=i%2?1:-1;
    const x=p.x-Math.sin(angle)*(29+rand()*6)*side,y=p.y+Math.cos(angle)*(29+rand()*6)*side;
    ellipse(c,x,y,2+rand()*4,1+rand()*3,i%3?'#313c2c80':'#766d5050');
  }
  if(rank>=1)cottage(c,885,90);
  if(rank>=2){polygon(c,[[386,75],[514,75],[524,111],[380,111]],'#343b2790','#726d4b',2);for(let i=0;i<18;i++)flower(c,391+i*6,84+(i%3)*8,['#ad8980','#b5a66c','#7e818f'][i%3],.55);}
  if(rank>=3){ellipse(c,882,261,55,26,'#455747','#273d32',4);ellipse(c,882,257,48,20,'#4b6e69');line(c,[[850,250],[885,248],[909,253]],'#b3c0a34d',1.5);ellipse(c,865,260,9,4,'#79866b');}
  const vignette=c.createRadialGradient(WIDTH/2,HEIGHT/2,230,WIDTH/2,HEIGHT/2,650);vignette.addColorStop(0,'#06120a00');vignette.addColorStop(1,'#06120a60');c.fillStyle=vignette;c.fillRect(0,0,WIDTH,HEIGHT);c.restore();
}
export function paintShot(c, shot) {
  const t=Math.max(0,Math.min(1,1-shot.life/.32)),p=STYLES[shot.style];
  const origin=shot.origin||(shot.facing?getGuardianShotOrigin(shot):{x:shot.x,y:shot.y-28});
  const sx=origin.x,sy=origin.y,tx=shot.tx,ty=shot.ty;
  const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t;
  c.save();c.globalAlpha=Math.min(1,shot.life/.08);
  if(t<.24)ellipse(c,sx,sy,4+(1-t/.24)*3,3+(1-t/.24)*2,p.accent+'90');
  if(shot.type==='cypress'){line(c,[[sx,sy],[tx,ty]],'#785d3d',6);line(c,[[sx,sy],[tx,ty]],'#d8e1a3',2);}
  else if(shot.type==='oak'){c.strokeStyle='#c4aa73';c.lineWidth=4;c.beginPath();c.ellipse(x,y,8+t*28,5+t*16,0,0,TAU);c.stroke();if(t>.65){c.lineWidth=2;c.beginPath();c.ellipse(tx,ty,8+(t-.65)*90,5+(t-.65)*45,0,0,TAU);c.stroke();}}
  else if(shot.type==='mushroom'){ellipse(c,tx,ty,8+t*47,6+t*33,p.canopy+'40',p.accent+'80',2);for(let i=0;i<4;i++)ellipse(c,x+Math.sin(i)*12,y+Math.cos(i)*8,4,4,p.accent);}
  else if(shot.type==='palm'){c.strokeStyle='#e1f8cb';c.lineWidth=3;c.beginPath();c.arc(x,y,10+t*11,-1,2);c.stroke();c.beginPath();c.arc(x+5,y+4,6+t*7,2,5);c.stroke();}
  else {c.translate(x,y);c.rotate(Math.atan2(ty-sy,tx-sx));polygon(c,[[-10,-3],[11,0],[-10,3]],'#fff4a9','#5b843e',1.4);}
  c.restore();
}
