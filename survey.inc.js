// Survey sectors are nine rectangles of map coordinates, counted from the northwest.
const surveyNames=['Northwest','North','Northeast','West','Centre','East','Southwest','South','Southeast'];
const surveyTypes={ore:'Ore',tree:'Timber',scrap:'Salvage',bush:'Forage'};
let surveyOverlay=false,surveyFilter='ore',surveyFocusId=null,surveyLastPlan=null,surveyEpoch=0;
function surveySector(x,y){return Math.min(2,Math.floor(y*3/VH))*3+Math.min(2,Math.floor(x*3/VW))}
function surveyScout(){return S.colonists.find(p=>p.role==='Surveyor')||S.colonists[0]}
function surveyRadius(){return S.research.includes('optics')?7:4}
function surveyDistances(x,y,passable){
 const result=new Int16Array(VW*VH).fill(-1);
 const queue=new Int32Array(result.length);
 const a=index(clamp(Math.floor(x),0,VW-1),clamp(Math.floor(y),0,VH-1));
 let first=0,last=1;queue[0]=a;result[a]=0;
 while(first<last){
   const i=queue[first++],xx=i%VW,yy=(i-xx)/VW;
   for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
     const nx=xx+dx,ny=yy+dy,j=index(nx,ny);
     if(inMap(nx,ny)&&result[j]===-1&&passable(nx,ny)){result[j]=result[i]+1;queue[last++]=j}
   }
 }
 return result;
}
function restoreStarterOre(){
 const retired=new Set(S.harvested||[]);
 const byId=new Set(features.map(f=>f.id));
 if(!Array.isArray(S.starterOre)){
   const distance=surveyDistances(28,28,(x,y)=>terrain[index(x,y)].kind!=='water');
   const reachable=(x,y)=>distance[index(x,y)]>=0;
   // Reconstruct against unharvested geology, even when loading an older mined world.
   const generated=new Set(features.map(f=>f.x+','+f.y));
   const nearby=features.filter(f=>f.type==='ore'&&reachable(f.x,f.y)&&Math.hypot(f.x-28,f.y-28)<=19).length;
   const candidates=[];
   for(let y=12;y<=44;y++)for(let x=12;x<=44;x++){
     const d=Math.hypot(x-28,y-28);
     if(d>=10&&d<=17&&reachable(x,y)&&!generated.has(x+','+y))candidates.push({x,y,preferred:hash(x,y,hashStr(S.seed)+337)>=.77});
   }
   candidates.sort((a,b)=>Number(b.preferred)-Number(a.preferred));
   S.starterOre=candidates.slice(0,Math.max(0,3-nearby)).map(({x,y})=>({x,y}));
 }
 for(const {x,y} of S.starterOre){
   if(!Number.isInteger(x)||!Number.isInteger(y)||!inMap(x,y))continue;
   const id='starterore-'+x+'-'+y;
   if(!retired.has(id)&&!byId.has(id)&&!buildingAt(x,y)&&!featureAt(x,y)){
      features.push({x,y,id,type:'ore'});byId.add(id);
   }
 }
 S.oreStarterChecked=true;
}
function surveyUnknown(x,y){
 const radius=surveyRadius(),r=radius-1;
 for(const [dx,dy] of [[r,0],[-r,0],[0,r],[0,-r],[2,2],[-2,2],[2,-2],[-2,-2],[0,0]]){
   if(inMap(x+dx,y+dy)&&!fog[index(x+dx,y+dy)])return true;
 }
 return false;
}
function planSurvey(p){
 const surveyTime=(S.day*1440+S.minute)/3.1;
 const sector=S.surveySector, origin=p.visit?.stage==='inside'?p.visit:null;
 if(surveyLastPlan?.state===S&&surveyLastPlan.empty&&surveyLastPlan.sector===sector&&surveyLastPlan.epoch===surveyEpoch&&surveyTime-surveyLastPlan.time<1.4)return null;
 const dist=surveyDistances(origin?.streetX??p.x,origin?.streetY??p.y,walkable);
 let best=null,score=Infinity;
 for(let i=0;i<dist.length;i++){
   if(dist[i]<0)continue;const x=i%VW,y=(i-x)/VW;
   if(Number.isInteger(sector)&&surveySector(x,y)!==sector)continue;
   if(!surveyUnknown(x,y))continue;
   // Stand on mapped frontier first; allow a hike into a specifically marked sector.
   const weight=dist[i]+(fog[i]?0:5);
   if(weight<score){score=weight;best={type:'survey',x,y}}
 }
 surveyLastPlan={state:S,sector,empty:!best,epoch:surveyEpoch,time:surveyTime};
 return best;
}
function surveyMapped(kind=surveyFilter){return features.filter(f=>f.type===kind&&fog[index(f.x,f.y)])}
function surveyDiagnostics(){
 const scout=surveyScout();
 if(!scout)return 'No surveyor available.';
 if(scout.carry)return scout.name+' is delivering supplies before surveying.';
 if(scout.task?.type==='rest'||scout.task?.type==='eat')return scout.name+' is tending to basic needs.';
 if(scout.task?.type==='survey')return scout.name+' is surveying '+scout.task.x+', '+scout.task.y+'.';
 if(surveyLastPlan?.state===S&&surveyLastPlan.empty)return 'No reachable survey sites with unmapped ground in the selected area.';
 return scout.name+' · '+taskLabel(scout)+'.';
}
function surveyFocus(kind){
 const found=surveyMapped(kind).sort((a,b)=>a.y-b.y||a.x-b.x);
 if(!found.length){notice('No mapped '+surveyTypes[kind].toLowerCase()+' remaining.');return}
 const next=found[(found.findIndex(f=>f.id===surveyFocusId)+1)%found.length];surveyFocusId=next.id;
 camera.x=(next.x+.5)*TS;camera.y=(next.y+.5)*TS;selectedFeature=next.id;
 selectedBuilding=selectedColonist=selectedTerrain=selectedPile=null;
 closeSheet();paintHUD();notice(surveyTypes[kind]+' · '+next.x+', '+next.y);
}
function surveyWorldHTML(){
 const sector=S.surveySector;
 const counts=Array(9).fill(0),totals=Array(9).fill(0);
 fog.forEach((known,i)=>{const zone=surveySector(i%VW,Math.floor(i/VW));totals[zone]++;if(known)counts[zone]++});
 return '<div class="sectioncap">Planet '+esc(S.seed)+' · '+Math.round(counts.reduce((a,b)=>a+b,0)*100/fog.length)+'% charted</div>'+
 '<p>'+esc(surveyDiagnostics())+'</p><div class="buttongroup"><button class="primary" data-survey-command>Prioritize exploring</button><button class="secondary" data-survey-ui="overlay">'+(surveyOverlay?'Hide':'Show')+' map markers</button></div>'+
 '<h3>Survey sector</h3><p>Tap a region to direct the surveyor. Each cell shows how much has been mapped.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">'+surveyNames.map((n,i)=>'<button class="'+(i===sector?'primary':'secondary')+'" data-sector="'+i+'">'+n+'<br>'+Math.round(counts[i]*100/totals[i])+'%</button>').join('')+'</div><button class="secondary" data-sector="auto">Survey any frontier</button>'+
 '<h3>Mapped resources</h3>'+Object.entries(surveyTypes).map(([id,label])=>'<div class="service"><span>'+label+' · '+surveyMapped(id).length+'</span><button class="secondary" data-survey-focus="'+id+'">Locate '+label.toLowerCase()+'</button></div>').join('')+
 frontierPlanetPanel()+'<h3>Field record</h3><p>'+S.explore+' surveys · '+(S.ruin?.seen?esc(S.ruin.name):'Landmark undiscovered')+'. Deposits are finite. A depleted outcrop stays depleted.</p>';
}
function surveyMapDraw(left,top,right,bottom){
 if(!surveyOverlay)return;
 ctx.save();ctx.lineWidth=1.3/camera.z;ctx.strokeStyle='#e1c58d';
 for(const f of features){
   if(f.type!==surveyFilter||f.x<left||f.x>=right||f.y<top||f.y>=bottom||!fog[index(f.x,f.y)])continue;
   const x=(f.x+.5)*TS,y=f.y*TS+2;
   ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+5,y);ctx.lineTo(x,y+5);ctx.lineTo(x-5,y);ctx.closePath();ctx.fillStyle='#352e26';ctx.fill();ctx.stroke();
 }
 if(Number.isInteger(S.surveySector)){const i=S.surveySector,x=Math.ceil(i%3*VW/3),y=Math.ceil(Math.floor(i/3)*VH/3);
 ctx.setLineDash([6,5]);ctx.strokeRect(x*TS,y*TS,(Math.ceil((i%3+1)*VW/3)-x)*TS,(Math.ceil((Math.floor(i/3)+1)*VH/3)-y)*TS)}
 ctx.restore();
}
function surveyUi(btn){
 if(!btn)return false;
 if(btn.hasAttribute('data-sector')){
   const v=btn.dataset.sector;S.surveySector=v==='auto'?null:Number(v);surveyLastPlan=null;prioritizeExploration();return true;
 }
 if(btn.hasAttribute('data-survey-focus')){surveyOverlay=true;surveyFilter=btn.dataset.surveyFocus;surveyFocus(surveyFilter);return true}
 if(btn.hasAttribute('data-survey-ui')){surveyOverlay=!surveyOverlay;closeSheet();notice('Survey markers '+(surveyOverlay?'on · '+surveyTypes[surveyFilter]:'off'));return true}
 return false;
}
const fieldResearch={
 optics:{name:'Rangefinding optics',cost:32,requires:null,description:'Scouts chart a seven-tile radius instead of four.',gate:()=>S.explore>=4,requirement:'Complete four surveys'},
 irrigation:{name:'Closed-loop irrigation',cost:48,requires:'growth',description:'Grow-bed crops develop 30% faster.',gate:()=>finished('garden').length>0&&finished('shed').length>0&&(S.industry?.harvests||0)>=2,requirement:'Harvest two crops and operate a supply shed'},
 metallurgy:{name:'Precision metallurgy',cost:65,requires:'energy',description:'Unlock the efficient alloy recipe: three ore and one salvage produce two alloy.',gate:()=>finished('workshop').length>0&&finished('solar').length>0&&(S.industry?.batches||0)>=3,requirement:'Complete three manufacturing batches with a workshop and solar array'},
 heliostat:{name:'Solar tracking',cost:52,requires:'energy',description:'Each solar array supplies four additional units of daytime power.',gate:()=>finished('battery').length>0&&finished('solar').length>0,requirement:'Complete a power bank and solar array'},
 traverse:{name:'Expedition fieldcraft',cost:72,requires:'optics',description:'Colonists travel 25% faster on survey assignments.',gate:()=>S.ruin?.seen&&finished('comms').length>0,requirement:'Discover the landmark and complete the signal beacon'}
};
function foundingResearchDefinition(id){return fieldResearch[id]||TECHS[id]}
function foundingResearchReason(id){
 const tech=researchDefinition(id);
 if(!tech)return 'Unknown technology';
 if(S.research.includes(id))return 'Researched';
 if(tech.requires&&!S.research.includes(tech.requires))return 'Requires '+researchDefinition(tech.requires).name;
 if(tech.gate&&!tech.gate())return tech.requirement;
 if(S.resources.knowledge<tech.cost)return 'Need '+(tech.cost-S.resources.knowledge)+' more knowledge';
 return '';
}
function surveyResearchHTML(){
 return '<div class="capacityline"><b>Research budget</b><strong>'+S.resources.knowledge+' knowledge</strong></div><p>Earn knowledge through active study at the lander and frontier surveys.</p>'+
 Object.entries({...TECHS,...fieldResearch}).map(([id,t])=>{const reason=researchReason(id);return '<article class="infocard" style="margin:7px 0"><b>'+t.name+'</b><p>'+t.description+'</p><p>'+[t.requires?'After '+researchDefinition(t.requires).name:'',t.requirement||''].filter(Boolean).join(' · ')+'</p><button class="secondary" data-action="research" data-id="'+id+'" '+(reason?'disabled':'')+'>'+ (reason||'Research · '+t.cost+' knowledge')+'</button></article>'}).join('');
}
function surveyGrid(){
 let generation=4,used=0,banks=0,advancedBanks=0;
 for(const b of S.buildings){if(!b.finished||b.editOrder||b.production?.paused)continue;
   if(b.type==='battery')banks+=1+.5*((b.level||1)-1);if(b.type==='accumulator')advancedBanks++;
   const t=TYPES[b.type];if(!t)continue;
   if(t.power>0)generation+=b.type==='wind'?t.power*(S.weather==='wind'?1.5:.75):isNight()?t.power*.4:t.power+(b.type==='solar'?((S.research.includes('heliostat')?4:0)+2*((b.level||1)-1)):0);
   else used-=t.power;
 }
 generation=Math.floor(generation);
 const cap=banks*120+advancedBanks*480,charge=clamp(Number(S.gridCharge)||0,0,cap);
 const output=charge>0?Math.min(Math.max(0,used-generation),4*banks+12*advancedBanks):0;
 return {supply:generation+output,used,generation,cap,charge,output};
}
function surveyGridTick(dt){
 const g=surveyGrid(),surplus=Math.max(0,g.generation-g.used);
 S.gridCharge=clamp(g.charge+dt*(Math.min(g.cap/30,surplus)-g.output),0,g.cap);
}
function surveyObjective(){
 return ['Construct a permanent home','Establish a food-producing garden','Power a workshop with solar energy','Build the long-range Signal Beacon','Discover the planetary landmark','Master precision metallurgy and solar tracking','Survey expedition established'][Math.min(S.goal,6)];
}
function surveyAdvanceGoal(){
 if(S.goal===4&&S.ruin?.seen){S.goal=5;log('','Field directive completed: planetary landmark charted.')}
 if(S.goal===5&&['metallurgy','heliostat'].every(x=>S.research.includes(x))){S.goal=6;log('','A self-sustaining industrial frontier. All field directives complete.')}
}
