// Crop the actual Ancient Oak at source resolution, using the game's atlas bounds.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import fs from 'node:fs';
import {installDefenderSprite} from '../src/art.js';
const image=await loadImage('assets/defenders/oak-warriors.png');
const frame=installDefenderSprite('oak',image,createCanvas)[2];
const canvas=createCanvas(560,680),c=canvas.getContext('2d');
const scale=Math.min(500/frame.width,620/frame.height),w=frame.width*scale,h=frame.height*scale;
c.drawImage(image,frame.x,frame.y,frame.width,frame.height,(560-w)/2,650-h,w,h);
fs.writeFileSync('assets/brand/oak-home.png',canvas.toBuffer('image/png'));
