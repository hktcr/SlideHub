/* Pixel-derived drawing paths. No anatomical landmarks are invented. */
(function(root){
'use strict';
async function traceInk(rgba,w,h,yieldWork=()=>Promise.resolve()){
 const a=new Uint8Array(w*h);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x,p=i*4,r=rgba[p],g=rgba[p+1],b=rgba[p+2];
  a[i]=rgba[p+3]>128 && Math.max(r,g,b)<100 && Math.max(r,g,b)-Math.min(r,g,b)<40 ? 1:0;
 }
 // Wide dark fills are not ink strokes. Mark their interior and a margin
 // before thinning, then discard any skeleton inside those marked regions.
 // This avoids presenting a medial-axis tree as if it were real anatomy.
 const distance=new Uint16Array(w*h),forbidden=new Uint8Array(w*h);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x;if(a[i])distance[i]=1+Math.min(distance[i-1],distance[i-w],distance[i-w-1],distance[i-w+1]);
 }
 for(let y=h-2;y>0;y--)for(let x=w-2;x>0;x--){
  const i=y*w+x;if(a[i])distance[i]=Math.min(distance[i],1+Math.min(distance[i+1],distance[i+w],distance[i+w-1],distance[i+w+1]));
 }
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(distance[y*w+x]>=4){
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const xx=x+dx,yy=y+dy;if(xx>0&&xx<w-1&&yy>0&&yy<h-1)forbidden[yy*w+xx]=1;
  }
 }
 await yieldWork();
 // Zhang–Suen thinning, bounded and cancellable between passes.
 for(let pass=0;pass<36;pass++){
  let changed=0;
  for(let step=0;step<2;step++){
   const remove=[];
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;if(!a[i])continue;
    const n=[a[i-w],a[i-w+1],a[i+1],a[i+w+1],a[i+w],a[i+w-1],a[i-1],a[i-w-1]];
    // Already-thin staircases can have two pixels per diagonal step without
    // any solid 2x2 block. Preserve them rather than eroding the entire line.
    if(!(n[0]*n[1]*n[2]||n[2]*n[3]*n[4]||n[4]*n[5]*n[6]||n[6]*n[7]*n[0]))continue;
    const count=n.reduce((s,v)=>s+v,0);if(count<2||count>6)continue;
    let transitions=0;for(let k=0;k<8;k++)if(!n[k]&&n[(k+1)%8])transitions++;
    if(transitions!==1)continue;
    if(step===0?(n[0]*n[2]*n[4]||n[2]*n[4]*n[6]):(n[0]*n[2]*n[6]||n[0]*n[4]*n[6]))continue;
    remove.push(i);
   }
   for(const i of remove)a[i]=0;changed+=remove.length;
  }
  await yieldWork();if(!changed)break;
 }
 for(let i=0;i<a.length;i++)if(forbidden[i])a[i]=0;
 const offsets=[-w,-w+1,1,w+1,w,w-1,-1,-w-1], used=new Uint8Array(w*h);
 // A diagonal is redundant when either orthogonal route is already present.
 // Suppressing those triangles prevents staircase corners becoming false junctions.
 function neighbors(i){
  const out=[];
  for(let k=0;k<8;k++){
   if(!a[i+offsets[k]])continue;
   if(k%2 && (a[i+offsets[(k+7)%8]] || a[i+offsets[(k+1)%8]]))continue;
   out.push(k);
  }
  return out;
 }
 const paths=[];
 function walk(start,dir){
  let i=start,k=dir;const points=[[i%w,Math.floor(i/w)]];let length=0;
  while(true){
   if(used[i]&(1<<k))break;
   used[i]|=1<<k;const next=i+offsets[k];used[next]|=1<<((k+4)%8);
   points.push([next%w,Math.floor(next/w)]);length+=k%2?Math.SQRT2:1;i=next;
   const available=neighbors(i).filter(d=>!(used[i]&(1<<d)));
   if(!available.length)break;
   // Continue through real branches along the most nearly straight available
   // pixel-supported route. Look back several pixels to suppress grid jitter.
   const last=points[points.length-1],previous=points[Math.max(0,points.length-6)];
   const vx=last[0]-previous[0],vy=last[1]-previous[1];
   let best=-Infinity;
   for(const d of available){
    const j=i+offsets[d],dx=j%w-last[0],dy=Math.floor(j/w)-last[1];
    const score=(vx*dx+vy*dy)/Math.hypot(dx,dy);
    if(score>best){best=score;k=d;}
   }
  }
  // Keep short residual edges too: dropping them opened gaps at junctions.
  if(length>0)paths.push({points,length});
 }
 // Start at real endpoints; then exhaust branch leftovers and closed loops.
 for(let i=w+1;i<a.length-w-1;i++)if(a[i]){
  const ns=neighbors(i);if(ns.length===1&&!(used[i]&(1<<ns[0])))walk(i,ns[0]);
 }
 for(let i=w+1;i<a.length-w-1;i++)if(a[i])for(const k of neighbors(i))if(!(used[i]&(1<<k)))walk(i,k);
 // Large connected strokes first. Within each size band, favor a nearby
 // endpoint, avoiding a distracting global jump after every short stroke.
 // This is geometric locality, not an inferred anatomical teaching order.
 const ordered=[];
 let pen=null;
 for(const [min,max] of [[60,Infinity],[12,60],[0,12]]){
  const pool=paths.filter(p=>p.length>=min&&p.length<max).sort((a,b)=>b.length-a.length);
  // Short detail strokes are grouped into 64-pixel tiles before local ordering.
  // This bounds nearest-neighbor work and keeps cancellation responsive.
  const tileColumns=Math.ceil(w/64);
  function tileRank(p){const [x,y]=p.points[0],row=Math.floor(y/64),col=Math.floor(x/64);return row*tileColumns+(row%2?tileColumns-1-col:col);}
  if(min<60)pool.sort((a,b)=>tileRank(a)-tileRank(b)||b.length-a.length);
  let consumed=0;
  while(pool.length){
   let chosen=0,reverse=false,best=Infinity;
   const limit=min<60?Math.min(pool.length,160):pool.length;
   if(pen)for(let n=0;n<limit;n++){
    const p=pool[n],first=p.points[0],last=p.points[p.points.length-1];
    const d0=Math.hypot(first[0]-pen[0],first[1]-pen[1]),d1=Math.hypot(last[0]-pen[0],last[1]-pen[1]);
    const score=Math.min(d0,d1)-Math.min(p.length,160)*.12;
    if(score<best){best=score;chosen=n;reverse=d1<d0;}
   }
   const p=pool.splice(chosen,1)[0];if(reverse)p.points.reverse();ordered.push(p);pen=p.points[p.points.length-1];
   if(++consumed%256===0)await yieldWork();
  }
  await yieldWork();
 }
 paths.splice(0,paths.length,...ordered);
 return {w,h,paths,total:paths.reduce((s,p)=>s+p.length,0)};
}
function phaseAt(ms){return {ink:Math.min(1,Math.max(0,ms/18000)),color:Math.min(1,Math.max(0,(ms-18000)/6500)),done:ms>=24500};}
const api={traceInk,phaseAt};if(typeof module!=='undefined')module.exports=api;else root.InkTrace=api;
})(typeof window==='undefined'?globalThis:window);
