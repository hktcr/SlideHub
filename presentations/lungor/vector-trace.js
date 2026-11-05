/* Exact geometry for the three locally authored SVG teaching diagrams.
   Labels, leaders and directional arrows remain readable during the drawing. */
(()=>{
 'use strict';
 const geometry='path,circle,ellipse,rect,line,polyline,polygon';
 async function prepare(source,cancelled=()=>false){
  const url=new URL(source,location.href);
  if(url.origin!==location.origin||!/(alveolar-sac|alveolus-blood|vertical-airway)-schema\.svg$/.test(url.pathname))throw new Error('Unsupported vector source');
  const response=await fetch(url.href,{credentials:'same-origin'});
  if(!response.ok)throw new Error('Vector source unavailable');
  const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  // The preview server adds a live-reload script even to SVG files.
  // Never adopt or execute any script from an SVG response.
  for(const script of doc.querySelectorAll('script'))script.remove();
  if(doc.querySelector('parsererror,foreignObject,iframe,image,use,a'))throw new Error('Unexpected SVG content');
  for(const el of doc.querySelectorAll('*'))for(const attr of el.attributes)if(/^on/i.test(attr.name)||/^(href|xlink:href)$/i.test(attr.name))throw new Error('Unexpected active SVG attribute');
  const root=doc.documentElement;
  if(root.localName!=='svg')throw new Error('Not an SVG');
  const vb=root.viewBox.baseVal,w=vb.width,h=vb.height;
  if(!(w>0&&h>0))throw new Error('Missing view box');
  const holder=document.createElement('div');
  holder.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
  holder.setAttribute('aria-hidden','true');holder.append(root);document.body.append(holder);
  try{
   if(cancelled())throw new Error('cancelled');
   const paths=[];
   for(const el of root.querySelectorAll(geometry)){
    if(el.closest('defs')||el.matches('.leader,[marker-end],[data-annotation]'))continue;
    if(el.localName==='path'&&(el.getAttribute('d').match(/[mM]/g)||[]).length>1)throw new Error('Separate subpaths are required for exact drawing');
    const style=getComputedStyle(el);
    if(style.stroke==='none'||typeof el.getTotalLength!=='function')continue;
    // Wide coloured bands are fill underlays in these authored schematics, not ink contours.
    const width=parseFloat(style.strokeWidth)||2;if(width>8)continue;
    const length=el.getTotalLength();if(!(length>0))continue;
    const points=[],n=Math.max(1,Math.ceil(length/1.5)),transform=root.getCTM().inverse().multiply(el.getCTM());
    for(let i=0;i<=n;i++){const p=el.getPointAtLength(length*i/n).matrixTransform(transform);points.push([p.x,p.y]);}
    paths.push({points,length,width,stroke:'#20211e'});
   }
   // Do not draw lettering by tracing its pixels. Keep exactly the authored labels.
   const labels=root.cloneNode(true);
   for(const el of labels.querySelectorAll(geometry))if(!el.closest('defs')&&!el.matches('.leader,[marker-end],[data-annotation]'))el.remove();
   const blob=new Blob([new XMLSerializer().serializeToString(labels)],{type:'image/svg+xml'}),blobURL=URL.createObjectURL(blob);
   const labelImage=new Image();
   try{await new Promise((resolve,reject)=>{labelImage.onload=resolve;labelImage.onerror=()=>reject(new Error('Vector labels unavailable'));labelImage.src=blobURL;});}
   finally{URL.revokeObjectURL(blobURL);}
   if(cancelled())throw new Error('cancelled');
   return {w,h,paths,total:paths.reduce((n,p)=>n+p.length,0),labels:labelImage,exactVector:true};
  }finally{holder.remove();}
 }
 window.VectorTrace={prepare};
})();
