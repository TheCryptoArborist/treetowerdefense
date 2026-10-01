import { WIDTH, HEIGHT, PATH, PADS, STYLES, CHAPTERS } from './engine.js';
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
function face(c, y, blink, attack = false) {
  for (const side of [-1, 1]) {
    if (blink) line(c, [[side * 9 - 4, y], [side * 9 + 3, y]], '#263b31', 2.4);
    else { ellipse(c, side * 9, y, 5.4, 7, '#fff9d8', '#36533c', 1.7); ellipse(c, side * 9 + 1.6, y + .8, 2.4, 3.7, '#233d35'); ellipse(c, side * 9 + 2, y - 1.4, 1, 1.5, '#fff'); }
    if (attack) line(c, [[side * 9 - 5, y - 9 + (side > 0 ? 2 : -2)], [side * 9 + 4, y - 9 + (side > 0 ? -2 : 2)]], '#304a37', 2.8);
    ellipse(c, side * 18, y + 9, 4, 2.2, '#f39e7c80');
  }
  c.strokeStyle = '#314a35'; c.lineWidth = 2.2; c.beginPath(); c.arc(0, y + 9, 5, .1, Math.PI - .1); c.stroke();
}
export function paintTree(c, type, x, y, scale = 1, style = 0, level = 1, clock = 0, attack = false) {
  const p = STYLES[style];
  const growth = 1 + (level - 1) * .15;
  const bob = Math.sin(clock * 2.5 + x * .03) * 1.3;
  const blink = clock > 0 && (clock + x * .01) % 5.7 > 5.5;
  c.save(); c.translate(x, y); c.scale(scale, scale);
  ellipse(c, 0, 15, 35 * growth, 12, '#3b693e30');
  if (style >= 2) { ellipse(c, 0, 15, 32 * growth, 9, p.accent + '35', p.accent + 'a0', 2); }
  c.translate(0, bob); c.scale(growth, growth);
  if (attack) c.rotate(Math.sin(clock * 34) * .022);
  // Roots and stout trunks remain readable below the canopy.
  for (const side of [-1, 1]) line(c, [[0, 3], [side * 10, 13], [side * 25, 15]], outline, 8);
  for (const side of [-1, 1]) line(c, [[0, 3], [side * 10, 13], [side * 25, 15]], p.bark, 4.5);
  ellipse(c, 0, -7, type === 'oak' ? 15 : 10, 24, p.bark, outline, 3);
  line(c, [[-3, -21], [-5, 2]], '#ffffff25', 3);
  if (type === 'pine' || type === 'cypress') {
    const w = type === 'cypress' ? 23 : 31;
    for (let i = 0; i < 3; i++) {
      const top = -42 - i * 13, bottom = -11 - i * 15;
      polygon(c, [[0, top - 25], [-w + i * 6, bottom], [-9, bottom + 5], [9, bottom + 5], [w - i * 6, bottom]], p.canopy);
      line(c, [[-w + i * 6 + 7, bottom - 3], [-6, top - 12]], '#ffffff25', 4);
    }
    face(c, -26, blink, attack);
  } else if (type === 'palm') {
    for (const side of [-1, 1]) {
      polygon(c, [[0, -39], [side * 16, -65], [side * 35, -58], [side * 19, -52], [side * 9, -29]], p.canopy);
      polygon(c, [[0, -39], [side * 29, -49], [side * 40, -24], [side * 25, -36], [side * 7, -26]], p.canopy);
    }
    polygon(c, [[0, -35], [-7, -72], [7, -70], [12, -34]], p.canopy);
    ellipse(c, 0, -22, 17, 21, p.bark, outline, 2.5); face(c, -26, blink, attack);
    ellipse(c, -13, -39, 6, 6, '#d0a368', outline, 2); ellipse(c, 9, -40, 6, 6, '#e1b77d', outline, 2);
  } else if (type === 'mushroom') {
    ellipse(c, 0, -2, 15, 21, '#fff0c2', outline, 3);
    c.beginPath(); c.moveTo(-35, -26); c.bezierCurveTo(-33, -66, 33, -66, 35, -26); c.bezierCurveTo(21, -18, -21, -18, -35, -26); c.fillStyle = p.canopy; c.fill(); c.strokeStyle = outline; c.lineWidth = 3; c.stroke();
    for (const [dx, dy, r] of [[-19, -33, 6], [-4, -46, 7], [18, -34, 5]]) ellipse(c, dx, dy, r, r * .8, p.accent, '#ffffff55', 1);
    face(c, -7, blink, attack);
  } else {
    // Overlapping lobes give each oak a broad, soft silhouette.
    for (const [dx, dy, r] of [[-23, -32, 23], [23, -32, 23], [-14, -54, 24], [14, -55, 25], [0, -26, 28]]) ellipse(c, dx, dy, r, r, p.canopy, outline, 2.5);
    ellipse(c, 0, -42, 29, 26, p.canopy);
    ellipse(c, -18, -57, 10, 6, '#ffffff25'); ellipse(c, 17, -63, 8, 4, '#ffffff25');
    face(c, -32, blink, attack);
  }
  if (style === 1) { flower(c, -25, -45, '#ffe3ed', 1.1); flower(c, 23, -48, '#fff1bf'); }
  else if (style >= 2) {
    for (let i = 0; i < (style >= 4 ? 4 : 2); i++) {
      const a = i * TAU / (style >= 4 ? 4 : 2) + clock * .7;
      const dx = Math.cos(a) * 39, dy = -28 + Math.sin(a) * 27;
      polygon(c, [[dx, dy - 5], [dx + 3, dy], [dx, dy + 5], [dx - 3, dy]], p.accent, null);
    }
  }
  if (level >= 2) {
    // Growth is a silhouette change plus permanent bark armor, independent of rarity.
    polygon(c, [[-13, 0], [0, -5], [13, 0], [10, 15], [-10, 15]], level === 3 ? '#d7b55f' : '#9cb768', outline, 2);
    ellipse(c, 0, 5, 3, 4, level === 3 ? '#fff1a7' : '#eff4c2');
  }
  if (level === 3) {
    c.save(); c.translate(0, type === 'mushroom' ? 26 : type === 'palm' ? 9 : 0);
    polygon(c, [[-13, -77], [-15, -91], [-5, -86], [0, -96], [6, -86], [15, -91], [12, -77]], '#f2ca68', outline, 2);
    ellipse(c, 0, -86, 2.5, 3, p.accent);
    c.restore();
  }
  c.restore();
}
export function paintPest(c, e, clock, time = 0) {
  const boss = e.kind === 'boss', moth = e.kind === 'moth';
  const size = boss ? 1.85 : e.kind === 'beetle' ? 1.05 : .8;
  const p = { termite: ['#de9854','#a75f35'], beetle: ['#ca6384','#903f65'], moth: ['#ffd582','#c18452'], blight: ['#a57fca','#654b8f'], boss: ['#a276b7','#584078'] }[e.kind];
  c.save(); c.translate(e.x, e.y); c.scale(size, size);
  ellipse(c, 0, 9, 20, 7, '#4b482b30');
  const march = Math.sin(clock * 12 + e.id) * 4;
  for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) line(c, [[side * 8, i * 8], [side * 21, i * 10 + march * side]], p[1], 3);
  if (moth) {
    c.save(); c.scale(1, .7 + Math.abs(Math.sin(clock * 13)) * .35);
    for (const side of [-1, 1]) {
      ellipse(c, side * 19, -9, 19, 14, '#ffedb1', p[1], 2);
      ellipse(c, side * 21, -8, 8, 7, '#e5998a'); ellipse(c, side * 14, 8, 13, 9, '#ffc478', p[1], 2);
    } c.restore();
  }
  ellipse(c, 0, 0, 15, 21, p[0], p[1], 3);
  if (e.kind === 'beetle' || boss) {
    line(c, [[0, -17], [0, 18]], p[1], 3);
    for (const side of [-1,1]) ellipse(c, side * 7, 4, 4, 6, '#ffffff20');
  }
  ellipse(c, 0, -17, 15, 13, p[0], p[1], 2.5);
  line(c, [[-9,-25],[-14,-33],[-18,-33]], p[1], 2); line(c, [[9,-25],[14,-33],[18,-33]], p[1], 2);
  for (const side of [-1,1]) { ellipse(c, side * 6, -18, 5, 6, '#fff4d1', p[1], 1); ellipse(c, side * 6 + 1, -17, 2, 3, '#2b3038'); }
  line(c, [[-10,-26],[-3,-24]], p[1], 2.5); line(c, [[3,-24],[10,-26]], p[1], 2.5);
  line(c, [[-5,-8],[0,-6],[5,-8]], p[1], 2);
  if (boss) polygon(c, [[-16,-29],[-19,-43],[-8,-36],[0,-49],[8,-36],[19,-43],[16,-29]], '#e5ba58', '#5c4560', 2);
  if (e.poisonUntil > time) { ellipse(c, -18, 0, 4, 4, '#b269d780'); ellipse(c, 18, -8, 3, 3, '#b269d780'); }
  if (e.slowUntil > time) { c.strokeStyle='#72d0e8';c.lineWidth=2;c.beginPath();c.ellipse(0,4,24,29,0,0,TAU);c.stroke(); }
  if (e.hp < e.maxHp || boss) { c.fillStyle='#48413b';c.fillRect(-20,-54,40,5);c.fillStyle='#dc7a67';c.fillRect(-20,-54,40*Math.max(0,e.hp/e.maxHp),5); }
  c.restore();
}
function cottage(c, x, y) {
  ellipse(c,x,y+14,58,16,'#38533625');
  polygon(c,[[x-33,y-28],[x+30,y-28],[x+30,y+12],[x-33,y+12]],'#f4dc99','#59664b',3);
  polygon(c,[[x-45,y-24],[x-7,y-62],[x+44,y-25]],'#d87c51','#744d3e',3);
  line(c,[[x-32,y-28],[x-7,y-52],[x+28,y-29]],'#f2ae70',4);
  polygon(c,[[x-4,y-7],[x+9,y-7],[x+9,y+12],[x-4,y+12]],'#76543a','#59664b',2);
  ellipse(c,x-18,y-7,7,8,'#9ebfce','#59664b',2);
  line(c,[[x+25,y-54],[x+25,y-83]],'#70533a',3);
  polygon(c,[[x+25,y-82],[x+51,y-76],[x+25,y-65]],'#bdd684','#5f754d',2);
}
export function paintBackdrop(c, chapter = 0, rank = 0) {
  const biome=CHAPTERS[chapter]; let seed=89+chapter*100;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  c.clearRect(0,0,WIDTH,HEIGHT);
  const gradient=c.createLinearGradient(0,0,0,HEIGHT);gradient.addColorStop(0,biome.terrain);gradient.addColorStop(1,biome.grass);c.fillStyle=gradient;c.fillRect(0,0,WIDTH,HEIGHT);
  // Soft patches, grass tufts and flowers give the meadow a hand-painted texture.
  for(let i=0;i<160;i++)ellipse(c,rand()*WIDTH,rand()*HEIGHT,10+rand()*45,7+rand()*20, i%2?'#f3edba16':'#5985440c');
  for(let i=0;i<210;i++){const x=rand()*WIDTH,y=rand()*HEIGHT;line(c,[[x-3,y],[x-2,y-4],[x,y],[x+2,y-5],[x+3,y]],'#57854435',1.3);}
  c.lineJoin='round';c.lineCap='round';c.beginPath();PATH.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle='#6f9657';c.lineWidth=80;c.stroke();c.strokeStyle='#8caf6420';c.lineWidth=90;c.stroke();
  c.strokeStyle='#b39c71';c.lineWidth=67;c.stroke();c.strokeStyle=biome.path;c.lineWidth=60;c.stroke();
  c.strokeStyle='#fff0c630';c.lineWidth=35;c.stroke();
  for(let i=0;i<150;i++){
    const x=rand()*WIDTH,y=rand()*HEIGHT;
    const near=PATH.slice(1).some(([px,py],j)=>{const[ax,ay]=PATH[j],vx=px-ax,vy=py-ay;const t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)));return Math.hypot(x-ax-t*vx,y-ay-t*vy)<53;});
    if(near||PADS.some(([px,py])=>Math.hypot(x-px,y-py)<57)||Math.hypot(x-930,y-640)<100)continue;
    if(i%6===0)flower(c,x,y,chapter===1?'#eea9b4':chapter===2?'#c5b4e6':'#fff0b9',.8);
    else if(i%7===0)ellipse(c,x,y,8,5,'#99a985','#70815c',1.5);
  }
  // Lush border bushes frame the playable ground without covering planting sites.
  for(let i=0;i<23;i++){
    const x=i*49-15,y=-5+rand()*13;
    ellipse(c,x,y,36,27,'#698f52','#4d7848',3);ellipse(c,x-8,y-10,18,17,'#87ad60');
  }
  for(let i=0;i<8;i++){const x=i*143+20;ellipse(c,x,HEIGHT+8,62,25,'#6d984f','#4d7848',3);}
  // A broken stump at the entrance, and permanent settlements earned through play.
  ellipse(c,38,183,21,8,'#87694b','#655b3c',2);polygon(c,[[18,154],[55,154],[57,181],[18,181]],'#9b7651','#655b3c',2);ellipse(c,37,153,20,7,'#c19a6b','#655b3c',2);
  if(rank>=1)cottage(c,885,90);
  if(rank>=2){for(let i=0;i<9;i++)flower(c,400+i*13,82+(i%3)*12,['#f5a7b0','#fff1a5','#b2afe7'][i%3]);line(c,[[386,110],[524,110]],'#996f4d',4);}
  if(rank>=3){ellipse(c,882,261,54,25,'#6aafa6','#6b975c',5);ellipse(c,883,256,41,13,'#93cbb4');flower(c,865,258,'#f4c4d9');}
  for(const [x,y] of [[25,314],[960,80],[30,580]]){
    line(c,[[x,y+13],[x,y-20]],'#8c744e',4);polygon(c,[[x,y-23],[x+22,y-19],[x,y-5]],chapter===2?'#c7b4e6':'#eeac71','#776143',2);
  }
}
export function paintShot(c, shot) {
  const t=Math.max(0,Math.min(1,1-shot.life/.32)),p=STYLES[shot.style];
  const sx=shot.x,sy=shot.y-28,tx=shot.tx,ty=shot.ty;
  const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t;
  c.save();c.globalAlpha=Math.min(1,shot.life/.08);
  if(shot.type==='cypress'){line(c,[[sx,sy],[tx,ty]],'#785d3d',6);line(c,[[sx,sy],[tx,ty]],'#d8e1a3',2);}
  else if(shot.type==='oak'){c.strokeStyle='#e6ca79';c.lineWidth=5;c.beginPath();c.ellipse(tx,ty,8+t*58,5+t*30,0,0,TAU);c.stroke();}
  else if(shot.type==='mushroom'){ellipse(c,tx,ty,8+t*47,6+t*33,p.canopy+'40',p.accent+'80',2);for(let i=0;i<4;i++)ellipse(c,x+Math.sin(i)*12,y+Math.cos(i)*8,4,4,p.accent);}
  else if(shot.type==='palm'){c.strokeStyle='#e1f8cb';c.lineWidth=3;c.beginPath();c.arc(x,y,10+t*11,-1,2);c.stroke();c.beginPath();c.arc(x+5,y+4,6+t*7,2,5);c.stroke();}
  else {c.translate(x,y);c.rotate(Math.atan2(ty-sy,tx-sx));polygon(c,[[-10,-3],[11,0],[-10,3]],'#fff4a9','#5b843e',1.4);}
  c.restore();
}
