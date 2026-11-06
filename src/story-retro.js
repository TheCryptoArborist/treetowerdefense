// A 320x140, 16-bit-style story stage. Guardians come from the original game
// atlases: no new faces, segmented limbs, bitmap bending or speech puppets.
import {paintTree,paintLifeTree,paintPest,getGuardianShotOrigin} from './art.js';
import {facingFor,GUARDIAN_SCALE} from './aiming.js';

export const RETRO_WIDTH=320,RETRO_HEIGHT=140;
export const RETRO_PALETTE=['#050714','#0c1424','#182b36','#25434a','#3c5e53','#5d805d','#8ca56a','#bdc68a',
 '#f3e2b2','#47332a','#71482d','#a16b37','#d29950','#f3bf69','#663a40','#a75b55',
 '#e88d68','#ffd84b','#314b25','#497a2e','#6ba63a','#9bd34d','#d3ed84','#195657',
 '#278d83','#22c6af','#82e5cb','#e0fff0','#423358','#7041a0','#b080be','#747b83'];
const palette=RETRO_PALETTE.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
const lookup=Array.from({length:512},(_,key)=>{
 const rgb=[(key>>6)*255/7,((key>>3)&7)*255/7,(key&7)*255/7];let chosen=0,best=Infinity;
 palette.forEach((p,i)=>{const d=(p[0]-rgb[0])**2+(p[1]-rgb[1])**2+(p[2]-rgb[2])**2;if(d<best){best=d;chosen=i;}});return palette[chosen];
});
export function palettePixels(data){for(let i=0;i<data.length;i+=4){const p=lookup[(data[i]>>5)*64+(data[i+1]>>5)*8+(data[i+2]>>5)];data[i]=p[0];data[i+1]=p[1];data[i+2]=p[2];}return data;}
const FONT={
 A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,18,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,25,21,19,17,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],
 '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],'4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],'6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
 '.':[0,0,0,0,0,12,12],',':[0,0,0,0,12,12,8],':':[0,12,12,0,12,12,0],';':[0,12,12,0,12,12,8],'-':[0,0,0,31,0,0,0],"'": [12,12,8,0,0,0,0],'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4],'/':[1,2,2,4,8,8,16],'(': [2,4,8,8,8,4,2],')':[8,4,2,2,2,4,8],'"':[10,10,0,0,0,0,0],'>':[16,8,4,2,4,8,16]
};
const clean=text=>String(text).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—·]/g,'-').toUpperCase();
export function pixelText(c,text,x,y,color='#f3e2b2',scale=1){
 c.fillStyle=color;for(const char of clean(text)){const rows=FONT[char]||[];for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(rows[row]&(1<<(4-col)))c.fillRect(x+col*scale,y+row*scale,scale,scale);x+=6*scale;}
}
export function retroLines(text,columns=48){
 const lines=[];let line='';for(let word of clean(text).split(/\s+/).filter(Boolean)){
  if(line.length+word.length+1>columns){if(line)lines.push(line);line='';}
  while(word.length>columns){lines.push(word.slice(0,columns));word=word.slice(columns);}
  line+=(line?' ':'')+word;
 }if(line)lines.push(line);return lines;
}
export function retroCaption(scene,seconds,{beat=0,reducedMotion=false}={}){
 const lines=retroLines(beat===1?scene.dialogue:scene.narration),pages=Math.max(1,Math.ceil(lines.length/3));
 const time=reducedMotion?0:Math.max(0,Number.isFinite(seconds)?seconds:0),page=Math.floor(time/7)%pages;
 const pageLines=lines.slice(page*3,page*3+3),limit=reducedMotion?Infinity:Math.floor((pages===1?time:time%7)*40);
 let remaining=limit;const visible=pageLines.map(line=>{const s=line.slice(0,Math.max(0,remaining));remaining-=line.length;return s;});
 return {speaker:beat===1?scene.speaker+' GUARDIAN':'THE FOREST REMEMBERS',lines:visible,page,pages,complete:remaining>=0};
}
export function retroPose(age,prepare=0,reducedMotion=false){
 if(reducedMotion)return{direction:1,step:0};
 if(prepare>.2)return{direction:1,step:-2};
 if(age<.18)return{direction:1,step:1};
 if(age<.48)return{direction:2,step:5};
 if(age<.9)return{direction:2,step:2};
 return{direction:1,step:0};
}
function block(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function panel(c,x,y,w,h){block(c,x,y,w,h,'#050714');block(c,x,y,w,1,'#278d83');block(c,x,y+h-1,w,1,'#278d83');block(c,x,y,1,h,'#278d83');block(c,x+w-1,y,1,h,'#278d83');}
function ground(c,tone,motion){
 block(c,0,0,320,104,'#0c1424');block(c,0,28,320,44,tone==='harvest'?'#47332a':'#182b36');
 block(c,0,63,320,41,'#25434a');
 for(let layer=0;layer<3;layer++){
  const step=[44,58,83][layer],offset=Math.floor(motion*[1,3,6][layer])%step;
  for(let i=-1;i<9;i++){
   const x=i*step-offset+(layer%2)*13,h=45+(i*17+100)%23,base=84+layer*6;
   block(c,x,base-h,5+layer*2,h,['#25434a','#182b36','#0c1424'][layer]);
   block(c,x-10,base-h+14,18,3,['#25434a','#182b36','#0c1424'][layer]);
   block(c,x+4,base-h+6,14,3,['#25434a','#182b36','#0c1424'][layer]);
   const leaf=['#25434a','#182b36','#0c1424'][layer];
   block(c,x-12,base-h-7,31,9,leaf);block(c,x-22,base-h-1,51,10,leaf);block(c,x-16,base-h+8,40,5,leaf);
  }
 }
 block(c,0,91,320,13,'#182b36');block(c,0,97,320,7,'#050714');
 for(let i=0;i<36;i++){const x=(i*37+Math.floor(motion*5))%320;block(c,x,93+i%3*2,3+i%4,1,tone==='harvest'?'#a16b37':'#3c5e53');}
}
function guardian(c,type,x,y,scale,{direction=1,attack=false}={}){
 // Whole original atlas poses only. clock=0 and motion=null forbid deformation.
 const angle=direction*Math.PI/4,facing=facingFor(Math.sin(angle),Math.cos(angle));
 paintTree(c,type,Math.round(x),Math.round(y),scale,0,2,0,attack,facing,null);
 return getGuardianShotOrigin({type,x:Math.round(x),y:Math.round(y),level:2,facing});
}
function enemy(c,scene,x,y,motion,impact,reducedMotion){
 const e={kind:scene.enemyKind||'beetle',...(scene.enemyBoss?{miniBoss:scene.enemyBoss}:{}),...(scene.tone==='harvest'?{theme:'harvest-canopy'}:{}),id:1,x:0,y:0,progress:Math.floor(motion*8)*7,mapId:'crossing-v1',hp:100,maxHp:100,slowUntil:0,poisonUntil:0};
 c.save();c.translate(Math.round(x),y);c.scale(.64,.64);paintPest(c,e,Math.floor(motion*8)/8,Math.floor(motion*8)/8,{hit:impact*.5,healthBar:false,reducedMotion,facingAngle:-Math.PI/2});c.restore();
}
function bolt(c,from,age,x,y){
 if(age<.18||age>.7)return;const u=(age-.18)/.52,px=Math.round(from.x+(x-from.x)*u),py=Math.round(from.y+(y-from.y)*u);
 block(c,px-12,py,11,1,'#278d83');block(c,px-4,py-1,6,3,'#d3ed84');block(c,px,py,2,1,'#e0fff0');
}
function portrait(c,scene,f){
 panel(c,8,19,88,78);c.save();c.beginPath();c.rect(10,21,84,74);c.clip();
 // Crop the existing front portrait; its eyes, mouth and silhouette are intact.
 guardian(c,scene.speaker,51,124,1.23,{direction:0});c.restore();
 pixelText(c,scene.speaker.toUpperCase(),107,23,'#ffd84b');
 const lines=retroLines(scene.title,19);lines.slice(0,2).forEach((line,i)=>pixelText(c,line,107,36+i*10));
 if(scene.enemyName&&scene.cinematic!=='renewal'){
  pixelText(c,'ENEMY SIGNAL',107,73,'#e88d68');enemy(c,scene,276,93,f.motion,0,false);
 }else{pixelText(c,'TREE OF LIFE',107,73,'#82e5cb');paintLifeTree(c,'oak',276,96,.42,0,2,0);}
}
export function paintRetroStage(c,scene,f,options={}){
 c.save();c.imageSmoothingEnabled=false;ground(c,scene.tone,options.reducedMotion?0:f.motion);
 const renewal=scene.cinematic==='renewal',pose=retroPose(f.attackAge,f.prepare,options.reducedMotion);
 if(f.shot===2){portrait(c,scene,f);}
 else{
  paintLifeTree(c,'oak',f.shot===0?215:181,93,.48,0,2,0);
  const base=f.shot===0?Math.round(50+Math.min(f.time,3)*8):82;
  const x=base+(renewal?0:pose.step),socket=guardian(c,scene.speaker,x,96,.72,{direction:renewal?1:pose.direction,attack:f.strike});
  if(f.shot===1){
   guardian(c,scene.speaker==='pine'?'oak':'pine',36,97,.49,{direction:1});
   if(!renewal){
    const impact=f.attackAge>=.68&&f.attackAge<.95?1-(f.attackAge-.68)/.27:0;
    const enemyX=Math.round(286-Math.min(1,Math.max(0,(f.time-3)/3))*34+(impact>0?3:0));
    enemy(c,scene,enemyX,97,f.motion,impact,!!options.reducedMotion);
    const origin={x:x+(socket.x-x)*(.72/GUARDIAN_SCALE),y:96+(socket.y-96)*(.72/GUARDIAN_SCALE)};
    if(!options.reducedMotion)bolt(c,origin,f.attackAge,enemyX,74);
    if(impact>0&&!options.reducedMotion)for(let i=0;i<8;i++){
     const a=i*Math.PI/4,r=4+Math.floor((1-impact)*15);block(c,enemyX+Math.cos(a)*r,74+Math.sin(a)*r,2,2,i%2?'#ffd84b':'#e0fff0');
    }
    panel(c,186,19,126,12);pixelText(c,(scene.enemyName||'THE SWARM ADVANCES').slice(0,19),192,22,'#e88d68');
   }
  }
  if(renewal){for(let i=0;i<8;i++){const x=110+i*12;block(c,x,96-i%2,8,1,'#82e5cb');}pixelText(c,'THE ROOTS RECONNECT',101,22,'#82e5cb');}
  else if(f.shot===0){panel(c,6,18,308,13);pixelText(c,scene.chapter.slice(0,49),12,21,'#ffd84b');}
 }
 // Deliberate foreground pixels and stepped parallax give the scene motion
 // while character faces and limb proportions remain the original artwork.
 if(!options.reducedMotion)for(let i=0;i<8;i++){
  const x=(i*43+Math.floor(f.motion*8))%320,y=23+(i*17+Math.floor(f.motion*3))%68;block(c,x,y,2,1,scene.tone==='harvest'?'#d29950':'#8ca56a');
 }
 if(f.fade&&!options.reducedMotion)block(c,0,12,Math.round(f.fade*80)*8,90,'#050714');
 block(c,0,0,320,12,'#050714');block(c,0,11,320,1,'#278d83');pixelText(c,'CANOPY DEFENSE',6,3,'#82e5cb');pixelText(c,'THE SEVERED ROOT',224,3,'#bdc68a');
 const caption=retroCaption(scene,options.captionSeconds??f.time,options);
 panel(c,4,102,312,38);pixelText(c,caption.speaker.slice(0,39),10,105,'#ffd84b');
 caption.lines.forEach((line,i)=>pixelText(c,line,10,115+i*8));
 if(caption.complete){pixelText(c,caption.pages>1?`${caption.page+1}/${caption.pages}`:'>',292,105,'#82e5cb');}
 c.restore();
}

let surface=null,makeSurface=null;
export function installStorySurfaceFactory(factory){makeSurface=factory;surface=null;}
export function paintRetroScene(context,scene,frame,options){
 if(!makeSurface&&typeof document!=='undefined')makeSurface=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};
 if(makeSurface&&!surface){const canvas=makeSurface(RETRO_WIDTH,RETRO_HEIGHT);surface={canvas,context:canvas.getContext('2d')};}
 context.save();context.imageSmoothingEnabled=false;
 if(surface){
  const c=surface.context;c.clearRect(0,0,RETRO_WIDTH,RETRO_HEIGHT);paintRetroStage(c,scene,frame,options);
  const pixels=c.getImageData(0,0,RETRO_WIDTH,RETRO_HEIGHT);palettePixels(pixels.data);c.putImageData(pixels,0,0);
  context.drawImage(surface.canvas,0,0,960,420);
 }else{context.scale(3,3);paintRetroStage(context,scene,frame,options);}
 context.restore();
}
