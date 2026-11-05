/* Additive, source-independent prototype; original img is always the final state. */
(()=>{
 'use strict';
 const art=document.querySelector('#art'),picture=document.querySelector('#picture');
 const canvas=document.createElement('canvas');canvas.id='ink-drawing';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');art.append(canvas);
 const bar=document.createElement('div');bar.id='drawing-controls';bar.setAttribute('role','group');bar.setAttribute('aria-label','Synlig uppritning');
 bar.innerHTML='<button class="control" id="drawing-play">Rita upp</button><button class="control" id="drawing-pause" disabled>Pausa</button><button class="control" id="drawing-finish">Visa färdig</button><button class="control" id="drawing-again">Spela igen</button><progress id="drawing-progress" value="0" max="100" aria-label="Uppritningens förlopp"></progress><span id="drawing-status" role="status" aria-live="polite">Partiell konturuppritning, sedan färgavtäckning.</span>';
 document.querySelector('header').after(bar);
 const play=bar.querySelector('#drawing-play'),pause=bar.querySelector('#drawing-pause'),finish=bar.querySelector('#drawing-finish'),again=bar.querySelector('#drawing-again'),status=bar.querySelector('#drawing-status');
 document.querySelector('header').insertBefore(play,document.querySelector('#toolbar-control'));
 const progress=bar.querySelector('#drawing-progress');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let token=0,raf=0,state='idle',elapsed=0,origin=0,data=null,source='',ctx=null,ink=null;
 let lastInk=0,pathIndex=0,segmentIndex=1,segmentProgress=0;
 const cache=new Map();
 function restore(){document.body.classList.remove('drawing-ui-open');window.refreshPresentationSize?.();cancelAnimationFrame(raf);raf=0;canvas.hidden=true;art.classList.remove('drawing-active');pause.disabled=true;pause.textContent='Pausa';play.disabled=reduced.matches;again.disabled=reduced.matches;}
 function cancel(message='Partiell konturuppritning, sedan färgavtäckning.') {token++;state='idle';restore();status.textContent=message;}
 function complete(){const focusInBar=bar.contains(document.activeElement);cancel('Färdig originalbild. Etiketter och ramar är återställda.');if(focusInBar)play.focus();}
 function motionPreference(){play.textContent=reduced.matches?'Minskad rörelse':'Rita upp';play.setAttribute('aria-label',reduced.matches?'Uppritning avstängd eftersom minskad rörelse är aktiverad':'Rita upp');play.title=reduced.matches?'Minskad rörelse är aktiverad. Färdig bild visas.':'Rita fram bildens konturer och visa sedan färgen';if(reduced.matches)cancel('Minskad rörelse: färdig bild visas utan uppritning.');else cancel();}
 reduced.addEventListener('change',motionPreference);
 function advanceInk(target){
  const c=ink.getContext('2d');let budget=Math.max(0,target-lastInk);lastInk=target;
  while(budget>0&&pathIndex<data.paths.length){
   const path=data.paths[pathIndex],pts=path.points;c.lineWidth=path.width||1.15;c.strokeStyle=path.stroke||'#29251f';
   if(segmentIndex>=pts.length){pathIndex++;segmentIndex=1;segmentProgress=0;continue;}
   const a=pts[segmentIndex-1],b=pts[segmentIndex],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const part=Math.min(budget,len-segmentProgress),t0=segmentProgress/len,t1=(segmentProgress+part)/len;
   c.beginPath();c.moveTo(a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0);c.lineTo(a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1);c.stroke();
   budget-=part;segmentProgress+=part;if(segmentProgress>=len-1e-8){segmentIndex++;segmentProgress=0;}
  }
 }
 function render(ms){
  progress.value=Math.min(100,Math.round(ms/24500*100));
  const phase=InkTrace.phaseAt(ms);advanceInk(phase.ink*data.total);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(ink,0,0,canvas.width,canvas.height);
  if(phase.color>0){
   // A spatial wipe of the exact raster, not a global opacity fade.
   // All strokes are finished before any colour is introduced.
   ctx.save();ctx.beginPath();const edge=phase.color*1.22-.11;
   ctx.moveTo(0,0);ctx.lineTo(canvas.width,0);
   for(let x=canvas.width;x>=0;x-=8)ctx.lineTo(x,(edge+.06*Math.sin(x/73))*canvas.height);
   ctx.closePath();ctx.clip();ctx.drawImage(picture,0,0,canvas.width,canvas.height);ctx.restore();
  }
  if(data.labels)ctx.drawImage(data.labels,0,0,canvas.width,canvas.height);
  const label=phase.color>0?'Partiell konturuppritning · färgen avtäcks…':'Partiell konturuppritning · linjer ritas…';
  if(status.textContent!==label)status.textContent=label;
  if(phase.done){complete();return false;}return true;
 }
 function tick(now){
  if(state!=='playing')return;
  if(picture.currentSrc!==source){cancel();return;}
  elapsed=now-origin;if(render(elapsed))raf=requestAnimationFrame(tick);
 }
 async function start(){
  cancel();if(reduced.matches){motionPreference();return;}
  if(!picture.complete||!picture.naturalWidth){status.textContent='Vänta tills bilden har laddats.';return;}
  const run=token;source=picture.currentSrc;state='preparing';progress.value=0;document.body.classList.add('drawing-ui-open');window.refreshPresentationSize?.();play.disabled=again.disabled=true;status.textContent='Förbereder linjer från den aktuella bilden…';
  try{
   data=cache.get(source);
   if(!data&&picture.dataset?.exactVector==='true'){data=await VectorTrace.prepare(source,()=>run!==token);if(run!==token)return;cache.set(source,data);if(cache.size>8)cache.delete(cache.keys().next().value);}
   if(!data){
    const sample=document.createElement('canvas');sample.width=Math.min(900,picture.naturalWidth);sample.height=Math.round(sample.width*picture.naturalHeight/picture.naturalWidth);
    const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(picture,0,0,sample.width,sample.height);
    data=await InkTrace.traceInk(sc.getImageData(0,0,sample.width,sample.height).data,sample.width,sample.height,async()=>{await new Promise(resolve=>setTimeout(resolve,0));if(run!==token)throw new Error('cancelled');});
    if(run!==token)return;cache.set(source,data);if(cache.size>8)cache.delete(cache.keys().next().value);
   }
   if(run!==token||source!==picture.currentSrc)return;
   if(!data.paths.length){cancel('Inga tydliga mörka linjer hittades. Originalbilden visas.');return;}
   canvas.width=picture.naturalWidth;canvas.height=picture.naturalHeight;ctx=canvas.getContext('2d');
   ink=document.createElement('canvas');ink.width=data.w;ink.height=data.h;const ic=ink.getContext('2d');ic.strokeStyle='#29251f';ic.lineWidth=1.15;ic.lineCap='round';ic.lineJoin='round';
   pathIndex=0;segmentIndex=1;segmentProgress=0;lastInk=0;elapsed=0;
   state='playing';canvas.hidden=false;art.classList.add('drawing-active');pause.disabled=false;play.disabled=true;again.disabled=false;
   render(0);origin=performance.now();raf=requestAnimationFrame(tick);
  }catch(error){if(run!==token)return;cancel('Uppritningen kunde inte förberedas. Originalbilden visas.');console.warn('Ink drawing preparation failed:',error);}
 }
 function togglePause(){
  if(state==='playing'){elapsed=performance.now()-origin;state='paused';cancelAnimationFrame(raf);pause.textContent='Fortsätt';status.textContent='Partiell konturuppritning · pausad.';}
  else if(state==='paused'){state='playing';origin=performance.now()-elapsed;pause.textContent='Pausa';raf=requestAnimationFrame(tick);}
 }
 play.onclick=start;again.onclick=start;pause.onclick=togglePause;finish.onclick=complete;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();});
 // Defense for any future source mutation outside loadPicture().
 new MutationObserver(()=>{if(source&&picture.currentSrc!==source)cancel();}).observe(picture,{attributes:true,attributeFilter:['src','srcset']});
 const header=document.querySelector('header');
 function placeControls(){bar.style.top=document.body.classList.contains('image-first')?(header.getBoundingClientRect().bottom+8)+'px':'';}
 new ResizeObserver(placeControls).observe(header);
 new MutationObserver(placeControls).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',placeControls);placeControls();
 window.inkDrawing={cancel,start,get state(){return state;}};motionPreference();
})();
