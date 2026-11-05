// Presentation only: animation follows route distance, never wall-clock time.
const sprites = new Map();
const actors = Object.freeze({
  ironroot: { file:'ironroot-walk-v1.png', height:92, stride:80 },
  saw: { file:'chainsaw-raider-walk-v1.png', height:82, stride:72 },
  sprayer: { file:'blight-sprayer-walk-v1.png', height:82, stride:80 }
});
export function enemySpriteHeight(kind) { return actors[kind]?.height || 70; }
export function miniBossPose(dx, dy, progress = 0, reducedMotion = false, kind = 'ironroot') {
  const row = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 3 : 1) : (dy < 0 ? 2 : 0);
  // Four poses per stride. Slow, dash, Veteran speed and pause all share
  // the engine's actual movement; opening a dialog cannot advance the gait.
  const stride = actors[kind]?.stride || 80;
  const frame = reducedMotion ? 0 : Math.floor(Math.max(0, Number.isFinite(progress) ? progress : 0) / (stride/4)) % 4;
  return { row, frame };
}
export function installEnemySprite(kind, image, makeCanvas) {
  if (!Object.hasOwn(actors,kind)) throw new Error('Unknown enemy sprite');
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  if (!(width >= 16 && height >= 16)) throw new Error('Invalid enemy atlas');
  const canvas = makeCanvas(width, height), c = canvas.getContext('2d');
  c.drawImage(image, 0, 0);
  const data = c.getImageData(0, 0, width, height).data, cells = [];
  let tallest = 0;
  for (let row = 0; row < 4; row++) for (let frame = 0; frame < 4; frame++) {
    const left = Math.floor(frame * width / 4), right = Math.floor((frame + 1) * width / 4);
    const top = Math.floor(row * height / 4), bottom = Math.floor((row + 1) * height / 4);
    let x0 = right, y0 = bottom, x1 = left - 1, y1 = top - 1;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      if (data[(y * width + x) * 4 + 3] < 80) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (x1 < x0 || y1 < y0) throw new Error('Empty enemy animation cell');
    // Keep the human's body centered on the route even when a carried tool
    // extends to one side. Share one boot-based anchor across each view's
    // four poses, rather than centering each frame's changing silhouette.
    let footLeft=right,footRight=left;
    for(let y=Math.floor(y0+(y1-y0)*.78);y<=y1;y++)for(let x=x0;x<=x1;x++) {
      if(data[(y*width+x)*4+3]<80)continue;
      footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);
    }
    const cell = { x:x0, y:y0, left, width:x1-x0+1, height:y1-y0+1, footCenter:(footLeft+footRight)/2-left };
    tallest = Math.max(tallest, cell.height); cells.push(cell);
  }
  for(let row=0;row<4;row++) {
    const poses=cells.slice(row*4,row*4+4),anchor=poses.reduce((sum,f)=>sum+f.footCenter,0)/4;
    for(const f of poses)f.anchor=kind==='ironroot'?f.width/2:anchor-(f.x-f.left);
  }
  // One scale across all poses: feet are grounded, with no per-frame stretching.
  sprites.set(kind, { image, cells, ratio:actors[kind].height/tallest });
  return { frames:16 };
}
export async function loadEnemyArt() {
  const loaded=await Promise.all(Object.entries(actors).map(([kind,actor])=>new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        installEnemySprite(kind, image, (w,h) => { const c=document.createElement('canvas'); c.width=w; c.height=h; return c; });
        resolve(true);
      } catch { console.warn(`${kind} sprite unavailable; upright fallback active.`); resolve(false); }
    };
    image.onerror = () => { console.warn(`${kind} sprite unavailable; upright fallback active.`); resolve(false); };
    image.src = 'assets/enemies/'+actor.file;
  })));
  return loaded.every(Boolean);
}
export function paintEnemySprite(c, enemy, dx, dy, reducedMotion = false) {
  const art = sprites.get(enemy.miniBoss);
  if (!art) return false;
  const pose = miniBossPose(dx,dy,enemy.progress,reducedMotion,enemy.miniBoss), f=art.cells[pose.row*4+pose.frame];
  const w=f.width*art.ratio, h=f.height*art.ratio;
  c.drawImage(art.image,f.x,f.y,f.width,f.height,-f.anchor*art.ratio,22-h,w,h);
  return true;
}
