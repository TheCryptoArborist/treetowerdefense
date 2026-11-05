// Presentation only. All phases use the held combat clock and actual cooldown.
// At the attack event the rig is at its calibrated firing pose: damage never waits
// for an animation. Preparation is available on subsequent, predictable attacks.
const DURATIONS = {oak:.32,pine:.24,palm:.32,cypress:.28,mushroom:.32,willow:.32,watchtower:.32,cannon:.32};
const clamp = n => Math.max(0,Math.min(1,n));
const smooth = n => {n=clamp(n);return n*n*(3-2*n);};
const profiles = {
  oak:      {x:-3,y:7,twist:0,prep:3},
  pine:     {x:-7,y:1,twist:0,prep:2},
  palm:     {x:2,y:1,twist:10,prep:6},
  cypress:  {x:10,y:-1,twist:0,prep:-6},
  mushroom: {x:1,y:-5,twist:-3,prep:4},
  willow:   {x:0,y:-3,twist:5,prep:3}
};
export function defenderMotion(type,{age=Infinity,prepare=0,direction=0,reducedMotion=false}={}) {
  const rest={x:0,y:0,twist:0,recoil:0,draw:0,arrow:1,phase:'idle'};
  if(reducedMotion)return rest;
  const duration=DURATIONS[type]||.32;
  const active=Number.isFinite(age)&&age>=0&&age<duration;
  const prep=clamp(Number.isFinite(prepare)?prepare:0);
  if(!active&&!prep)return rest;
  const t=active?age/duration:0;
  // Fast release, weighted follow-through, then a continuous return to rest.
  const kick=active?(t<.24?smooth(t/.24):1-smooth((t-.24)/.76)):0;
  const anticipation=active?0:Math.sin(Math.PI*prep);
  const a=direction*Math.PI/4,dx=Math.sin(a),dy=Math.cos(a);
  const p=profiles[type];
  if(p)return {...rest,phase:active?(t<.25?'release':'recovery'):'prepare',
    x:dx*(p.x*kick-p.prep*anticipation)||0,
    y:(p.y*kick+dy*(p.x*kick-p.prep*anticipation)*.35)||0,
    twist:((p.twist*kick-p.twist*.7*anticipation)*(direction>4?-1:1))||0};
  return {...rest,phase:active?'reload':'prepare',
    recoil:active?2*(1-t)+(type==='cannon'?10:4)*kick:0,
    draw:type==='watchtower'?anticipation:0,
    arrow:active?smooth((age-.10)/.16):1};
}
export function defenderMotionPoint(x,y,motion) {
  // Root/boot line stays planted. Smooth bending gives the upper body and held
  // equipment independent follow-through without cutting or repainting the art.
  const weight=smooth((12-y)/85);
  return {x:x+motion.x*weight+motion.twist*weight*(1-weight)*2,
    y:y+motion.y*weight};
}
