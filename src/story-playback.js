// Presentation only: narration flows into dialogue; leaving the scene stays manual.
export function createStoryPlayback(){
 let scene=null,beat=0;
 return {
  reset(next){scene=next;beat=0;},
  clear(){scene=null;beat=0;},
  advance(seconds,audio={}){
   if(!scene||beat||!Number.isFinite(seconds))return beat;
   const readingTime=Math.max(12,scene.narration.trim().split(/\s+/).length/2.2+1);
   const speaking=audio.enabled&&audio.voiceEnabled&&['starting','speaking'].includes(audio.voiceStatus);
   // A broken speech engine must not strand the dialogue forever.
   if(seconds>=readingTime&&(!speaking||seconds>=Math.max(45,readingTime+10)))beat=1;
   return beat;
  }
 };
}
