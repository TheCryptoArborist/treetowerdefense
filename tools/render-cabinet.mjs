// Render the actual game guardian; no replacement or generated character art.
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {installDefenderSprite,paintTree} from '../src/art.js';
import fs from 'node:fs';
installDefenderSprite('oak',await loadImage('assets/defenders/oak-warriors.png'),createCanvas);
const canvas=createCanvas(512,512),c=canvas.getContext('2d');
const glow=c.createRadialGradient(256,260,20,256,260,250);glow.addColorStop(0,'#235646');glow.addColorStop(1,'#07141c');c.fillStyle=glow;c.fillRect(0,0,512,512);
paintTree(c,'oak',256,395,2.9,0,2,0,false);
fs.writeFileSync('assets/brand/oak-guardian-preview.png',canvas.toBuffer('image/png'));
