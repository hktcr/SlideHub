'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const stages=[
 ['1 · Partiklar fastnar i slem','Damm och andra små partiklar fastnar i det klibbiga slemlagret. Det är slemmet som fångar dem, inte flimmerhåren själva.'],
 ['2 · Flimmerhåren för slemmet vidare','Flimmerhåren sitter fast i cellerna och slår samordnat. Slem och fångade partiklar förs mot svalget. Cilierna böjs tillbaka närmare cellytan mellan kraftslagen.'],
 ['3 · Slemmet når svalget','Slem från luftstrupen och bronkerna når svalget och blandas med saliv. Vägschemat visar färden, i en annan förstoring.'],
 ['4 · Slemmet sväljs','Andningen pausar kort och luftvägen skyddas vid sväljningen. Slemmet går från svalget ned i matstrupen, vars muskler för det vidare mot magen.']
];
function svg(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e}
for(let i=0;i<8;i++){svg('rect',{x:32+i*82,y:340,width:82,height:70,rx:9,fill:i%2?'#d7b3a0':'#e9c9b6',stroke:'#1b1b1b','stroke-width':2},$('#cells'));svg('ellipse',{cx:73+i*82,cy:382,rx:18,ry:11,fill:'#7e686b'},$('#cells'))}
const hairs=[];for(let i=0;i<48;i++)hairs.push(svg('path',{fill:'none',stroke:'#111111','stroke-width':i%3===0?3:2,'stroke-linecap':'round'},$('#cilia')));
const dots=[];for(let i=0;i<3;i++)dots.push(svg('circle',{r:i===0?9:6,class:'cargo'},$('#particles')));
const markers=[];for(let i=0;i<10;i++)markers.push(svg('path',{d:'M0 0h17',stroke:'#526849','stroke-width':3,'stroke-linecap':'round',opacity:.6},$('#slime-marks')));
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let progress=0,playing=false,last=null,frame=null,shownStage=-1;
function clamp(v){return Math.max(0,Math.min(1,v))}
function render(){const p=progress;const stage=p<.2?0:p<.55?1:p<.72?2:3;document.body.dataset.stage=String(stage+1);if(stage!==shownStage){$('#step-title').textContent=stages[stage][0];$('#step-text').textContent=stages[stage][1];shownStage=stage}
 const travel=clamp((p-.2)/.35),clock=travel*10;
 hairs.forEach((e,i)=>{const x=44+i*13.5,phase=(clock-i*.045+10)%1;let tipX,tipY,c1x,c1y,c2x,c2y;if(phase<.45){const t=phase/.45;tipX=x-23+48*t;tipY=248;c1x=x-10+18*t;c1y=305;c2x=tipX-7;c2y=270}else{const t=(phase-.45)/.55;tipX=x+25-48*t;tipY=248+55*Math.sin(Math.PI*t);c1x=x+14;c1y=330;c2x=tipX+12;c2y=tipY+24}e.setAttribute('d',`M${x} 340 C${c1x} ${c1y} ${c2x} ${c2y} ${tipX} ${tipY}`)});
 dots.forEach((e,i)=>{const start=150+i*130,x=start+travel*425,y=105+i*25+clamp(p/.18)*(130-i*25);e.setAttribute('cx',x);e.setAttribute('cy',y);e.setAttribute('opacity',x<678&&p<.58?'1':'0')});
 markers.forEach((e,i)=>e.setAttribute('transform',`translate(${40+((i*66+travel*425)%640)} 240)`));
 const routeDot=$('#route-particle');let x=110,y=310;
 if(p>=.55&&p<.66){const t=(p-.55)/.11;x=110+140*t*t;y=310-185*t}else if(p>=.66&&p<.72){x=250;y=125}else if(p>=.72){const t=clamp((p-.72)/.28);x=250+140*Math.min(1,t*2);y=125+200*t}
 routeDot.setAttribute('cx',x);routeDot.setAttribute('cy',y);routeDot.setAttribute('opacity',p>=.55&&p<1?1:0);$('#saliva').style.opacity=p>=.66&&p<.75?'0.7':'0';$('#swallow-gate').style.display=p>=.72&&p<.98?'block':'none';$('#up-route').style.opacity=p>=.72?'.2':'1';$('#down-route').style.opacity=p>=.72?'1':'.2';$('#progress').value=String(Math.round(p*100));$('#percent').value=Math.round(p*100)+' %';$('#next').disabled=p>=1;if(!playing)$('#play').textContent=p>=1?'Spela igen':'Spela';if(p>=1){$('#step-title').textContent='Klart · Från slemhinna till matstrupe';$('#step-text').textContent='Slemmet fångade partiklarna. Flimmerhåren förde slemmet till svalget. Därefter svaldes det ned i matstrupen. Luften och det svalda följer olika vägar. Efter sväljningen öppnas luftvägen igen.'}}
function setPlaying(on){playing=on;if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;$('#play').textContent=playing?'Pausa':progress>=1?'Spela igen':'Spela';$('#play').setAttribute('aria-pressed',String(playing));if(playing)frame=requestAnimationFrame(tick)}
function tick(now){if(!playing)return;if(last!==null)progress=clamp(progress+(now-last)/24000);last=now;render();if(progress>=1)setPlaying(false);else frame=requestAnimationFrame(tick)}
$('#play').onclick=()=>{if(reduced.matches)return;if(progress>=1){progress=0;shownStage=-1;render()}setPlaying(!playing)};
$('#next').onclick=()=>{setPlaying(false);progress=[.19,.4,.68,.86,1].find(x=>x>progress+.005)??1;render()};
$('#reset').onclick=()=>{setPlaying(false);progress=0;shownStage=-1;render()};
$('#progress').oninput=()=>{setPlaying(false);progress=Number($('#progress').value)/100;render()};
function motionPreference(){if(reduced.matches)setPlaying(false);$('#play').disabled=reduced.matches;$('#motion-note').classList.toggle('reduced',reduced.matches);$('#motion-note').textContent=reduced.matches?'Minskad rörelse: använd Nästa steg eller reglaget.':'Spela hela förloppet eller visa ett steg i taget.'}
reduced.addEventListener('change',motionPreference);document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false)});motionPreference();render();

$('#facts-open').onclick=()=>{setPlaying(false);$('#model-facts').showModal()};$('#facts-close').onclick=()=>$('#model-facts').close();
