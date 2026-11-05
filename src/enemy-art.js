// Presentation only: animation follows route distance, never wall-clock time.
const sprites = new Map();
export function miniBossPose(dx, dy, progress = 0, reducedMotion = false) {
  const row = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 3 : 1) : (dy < 0 ? 2 : 0);
  // Four poses per 80 map units. Slow, dash, Veteran speed and pause all share
  // the engine's actual movement; opening a dialog cannot advance the gait.
  const frame = reducedMotion ? 0 : Math.floor(Math.max(0, Number.isFinite(progress) ? progress : 0) / 20) % 4;
  return { row, frame };
}
export function installEnemySprite(kind, image, makeCanvas) {
  if (kind !== 'ironroot') throw new Error('Unknown enemy sprite');
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
    const cell = { x:x0, y:y0, width:x1-x0+1, height:y1-y0+1 };
    tallest = Math.max(tallest, cell.height); cells.push(cell);
  }
  // One scale across all poses: feet are grounded, with no per-frame stretching.
  sprites.set(kind, { image, cells, ratio:92/tallest });
  return { frames:16 };
}
export async function loadEnemyArt() {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        installEnemySprite('ironroot', image, (w,h) => { const c=document.createElement('canvas'); c.width=w; c.height=h; return c; });
        resolve(true);
      } catch { console.warn('Ironroot sprite unavailable; upright fallback active.'); resolve(false); }
    };
    image.onerror = () => { console.warn('Ironroot sprite unavailable; upright fallback active.'); resolve(false); };
    image.src = 'assets/enemies/ironroot-walk-v1.png';
  });
}
export function paintEnemySprite(c, enemy, dx, dy, reducedMotion = false) {
  const art = sprites.get(enemy.miniBoss);
  if (!art) return false;
  const pose = miniBossPose(dx,dy,enemy.progress,reducedMotion), f=art.cells[pose.row*4+pose.frame];
  const w=f.width*art.ratio, h=f.height*art.ratio;
  c.drawImage(art.image,f.x,f.y,f.width,f.height,-w/2,22-h,w,h);
  return true;
}
