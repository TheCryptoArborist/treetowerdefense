// Presentation only. Existing app handlers own purchases, resets and navigation.
export function createOutcomePresentation({root,canvas,report,reportButton,backButton,continueButton,freshButton,now=()=>performance.now()}){
 let previous=null,reportOpen=false,revivalUntil=0;
 const showReport=()=>{reportOpen=true;root.hidden=true;report.scrollIntoView?.({behavior:'auto',block:'start'});backButton.focus?.({preventScroll:true});};
 const showOutcome=()=>{reportOpen=false;root.hidden=false;freshButton.focus?.({preventScroll:true});};
 reportButton.addEventListener('click',showReport);backButton.addEventListener('click',showOutcome);
 return {
  update({phase,reducedMotion=false}){
   const ended=phase==='defeat'||phase==='victory',changed=phase!==previous;
   if(changed){reportOpen=false;if(previous==='defeat'&&phase==='running')revivalUntil=now()+1000;}
   root.dataset.result=phase;root.classList.toggle('no-motion',reducedMotion);
   root.hidden=!ended||reportOpen;report.hidden=!ended;
   canvas.classList.toggle('tree-fallen',phase==='defeat');
   canvas.classList.toggle('tree-restored',!reducedMotion&&phase==='running'&&now()<revivalUntil);
   backButton.hidden=!ended;
   if(changed&&ended){const target=phase==='defeat'&&!continueButton.disabled?continueButton:freshButton;target.focus?.({preventScroll:true});}
   previous=phase;
  }
 };
}
