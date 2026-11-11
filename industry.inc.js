// Production records live on the building, so a worker change or save never resets a batch.
const INDUSTRY_RECIPES = {
  smelt:{name:'Smelt ore',cost:{ore:2,scrap:1},yield:1,seconds:9},
  recycle:{name:'Reclaim scrap',cost:{scrap:6},yield:1,seconds:13},
  precision:{name:'Precision casting',cost:{ore:3,scrap:1},yield:2,seconds:13,tech:'metallurgy'}
};
const INDUSTRY_STAGES = {
  plant:{label:'Planting',seconds:4}, germinate:{label:'Germinating',seconds:15},
  tend:{label:'Tending seedlings',seconds:3}, grow:{label:'Growing',seconds:22},
  harvest:{label:'Harvesting ripe crops',seconds:5}
};
function industryPolicy(){
  if(!S.industry) S.industry={};
  const c=S.industry;
  c.targets??={wood:40,ore:24,scrap:150,food:180,alloy:65};
  c.weights??={field:1,factory:1,gather:1};
  c.harvests??=0;c.batches??=0;
  return c;
}
function foundingProductionRecord(b){
  return b.production??=(b.type==='garden'
    ? {stage:'plant',elapsed:0,cycles:0,output:0}
    : {recipe:'smelt',elapsed:0,cycles:0,output:0});
}
function industryOwned(kind){return (S.resources[kind]||0)+looseTotal(kind)+transitTotal(kind)}
function foundingIndustryRecipes(){return Object.entries(INDUSTRY_RECIPES).filter(([,r])=>!r.tech||S.research.includes(r.tech))}
function chosenRecipe(r){return INDUSTRY_RECIPES[r.recipe]||INDUSTRY_RECIPES.smelt}
function cropYield(){return S.research.includes('growth')?11:7}
function cropDuration(stage){
  const growing=stage==='germinate'||stage==='grow';
  return INDUSTRY_STAGES[stage].seconds*(growing&&S.research.includes('irrigation')?.7:1);
}
function cropNeedsWorker(stage){return !['grow','germinate'].includes(stage)}
function foundingProductionBlock(b){
  if(!b.finished||b.editOrder)return 'Unavailable during construction or dismantling';
  const r=productionRecord(b),kind=b.type==='garden'?'food':'alloy';
  if(r.paused)return 'Paused by colony order';
  if(industryOwned(kind)>=industryPolicy().targets[kind])return 'Colony stock target reached';
  if(b.type==='garden')return '';
  const recipe=chosenRecipe(r);
  if(industryOwned('alloy')+recipe.yield>industryPolicy().targets.alloy)return 'Next batch would exceed target';
  const grid=power();
  if(grid.supply<grid.used)return 'Insufficient grid power';
  for(const [k,amount] of Object.entries(recipe.cost))if((S.resources[k]||0)<amount)return 'Needs '+amount+' stored '+MATERIALS[k].name.toLowerCase();
  return '';
}
function productionWorkers(b){return S.colonists.filter(p=>p.task?.id===b.id&&['farm','craft'].includes(p.task.type))}
function foundingIndustrySummary(b){
  if(!['garden','workshop'].includes(b.type)&&!frontierProducer(b))return '';
  const blocked=productionBlock(b);if(blocked)return blocked;
  const r=productionRecord(b),worker=productionWorkers(b)[0];
  if(b.type==='garden'&&!cropNeedsWorker(r.stage))return INDUSTRY_STAGES[r.stage].label;
  if(!worker)return 'Waiting for '+(r.worker?S.colonists.find(p=>p.id===r.worker)?.name||'assigned worker':'an available worker');
  return worker.path.length?'Worker approaching':(b.type==='garden'?INDUSTRY_STAGES[r.stage].label:'Manufacturing')+' · '+worker.name;
}
function productionWeight(p,b){
  const isFarm=b.type==='garden'||b.type==='greenhouse',group=isFarm?'field':'factory',r=productionRecord(b);
  if(r.worker&&r.worker!==p.id)return 0;
  if(r.worker===p.id)return 100;
  if(p.work==='survey')return 0;
  const personal=p.workWeights?.[group]??1,colony=industryPolicy().weights[group]??1;
  if(!personal||!colony)return 0;
  const adept=isFarm?p.role==='Biologist'||p.work==='farm':p.role==='Engineer'||p.work==='engineer';
  if(!adept&&personal===1&&colony===1)return 0;
  return personal*colony*(adept?2:1);
}
function productionCandidate(p,type){
  const choices=[];
  for(const b of S.buildings){
    if((type&&!(type==='workshop'?b.type==='workshop'||frontierProducer(b)&&b.type!=='greenhouse':type==='garden'?['garden','greenhouse'].includes(b.type):b.type===type))||!(['garden','workshop'].includes(b.type)||frontierProducer(b))||!b.finished||b.editOrder)continue;
    if(b.type==='workshop')frontierAutoRecipe(b);
    const r=productionRecord(b),weight=productionWeight(p,b);
    if(!weight||productionBlock(b)||b.type==='garden'&&!cropNeedsWorker(r.stage))continue;
    if(productionWorkers(b).some(worker=>worker.id!==p.id))continue;
    choices.push({b,rank:weight*100-Math.hypot(b.x-p.x,b.y-p.y)});
  }
  choices.sort((a,b)=>b.rank-a.rank);
  for(const {b} of choices){
    const task={type:b.type==='garden'?'farm':'craft',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};
    if(setTask(p,task))return task;
  }
  return null;
}
function nextCrop(r,stage){r.stage=stage;r.elapsed=0}
function advanceCrops(step){
  for(const b of S.buildings){
    if(!b.finished||b.type!=='garden'||b.editOrder)continue;
    const r=productionRecord(b);
    if(r.paused||cropNeedsWorker(r.stage))continue;
    r.elapsed+=step;
    if(r.elapsed>=cropDuration(r.stage))nextCrop(r,r.stage==='grow'?'harvest':'tend');
  }
}
function foundingProduction(p,t,work){
  const b=S.buildings.find(b=>b.id===t.id);
  if(!b||productionBlock(b)||!productionWeight(p,b)){p.task=null;return}
  const r=productionRecord(b);
  if(b.type==='garden'){
    if(!cropNeedsWorker(r.stage)){p.task=null;return}
    r.elapsed+=work;
    if(r.elapsed<cropDuration(r.stage))return;
    if(r.stage==='plant')nextCrop(r,'germinate');
    else if(r.stage==='tend')nextCrop(r,'grow');
    else{
      // Ripe food waits on the bed if there is less demand than a full harvest.
      r.ripe??=cropYield();
      const n=Math.min(r.ripe,Math.max(0,industryPolicy().targets.food-industryOwned('food')));
      if(n){freightOutput('food',n,b);r.output+=n;r.ripe-=n}
      if(!r.ripe){delete r.ripe;nextCrop(r,'plant');r.cycles++;industryPolicy().harvests++}
    }
  }else{
    const recipe=chosenRecipe(r);
    r.elapsed+=work;if(r.elapsed<recipe.seconds)return;
    if(!freightSpend(recipe.cost)){p.task=null;return}
    freightOutput('alloy',recipe.yield,b);
    r.output+=recipe.yield;r.elapsed=0;r.cycles++;industryPolicy().batches++;
  }
  p.task=null;p.action=0;
}
let nextAutoGather=-Infinity;
function advanceGatherTargets(step){
  const c=industryPolicy();nextAutoGather-=step;
  if(nextAutoGather>0)return;nextAutoGather=5;
  if(!c.weights.gather||!S.colonists.some(p=>['auto','gather','build'].includes(p.work)))return;
  const anchor=S.buildings.find(b=>b.type==='supplies')||S.colonists[0];
  if(!anchor)return;
  for(const [kind,type] of [['wood','tree'],['ore','ore'],['scrap','scrap'],['food','bush']]){
    const committed=Object.keys(S.designations||{}).reduce((n,id)=>{const f=featureById(id);return n+(f?.type===type?(f.amount??NATURAL[type].amount):0)},0);
    if(industryOwned(kind)+committed>=c.targets[kind])continue;
    const candidates=features.filter(f=>f.type===type&&fog[index(f.x,f.y)]&&!S.designations[f.id]).sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y));
    for(const f of candidates.slice(0,18)){
      const goals=neighborGoals(f.x,f.y);
      if(!S.colonists.some(p=>goals.some(g=>Math.floor(p.x)===g.x&&Math.floor(p.y)===g.y)||findPath(p.x,p.y,goals).length))continue;
      S.designations[f.id]={progress:0,automatic:true};
      break;
    }
  }
}
function drawProduction(b,x,y){
  if(b.type!=='garden'||!b.finished)return;
  const r=productionRecord(b), stage=r.stage;
  for(let row=0;row<3;row++){
    const y0=y+6+row*18;
    rect(x+9,y0+2,66,10,'#564133');
    for(let i=0;i<9;i++){
      const px=x+11+i*7,py=y0+7+(i%2);
      rect(px,py,5,1,'#795743');
      if(stage==='plant'&&i>Math.floor(r.elapsed*2))continue;
      rect(px+2,py-1,2,2,'#9f975e');
      if(stage==='plant')continue;
      const fraction=r.elapsed/cropDuration(stage);
      const size=stage==='germinate'?1+Math.min(2,Math.floor(fraction*3)):stage==='tend'?3:stage==='grow'?3+Math.min(3,Math.floor(fraction*4)):6;
      rect(px+2,py-size,2,size,'#8da26a');rect(px,py-size+1,3,2,'#61916a');
      if(size>3)rect(px+3,py-size,3,2,'#acba71');
      if(stage==='harvest')rect(px+1,py-3,3,2,'#cf8959');
    }
  }
}
function industrySelect(name,value,options,attributes=''){
 return '<select class="field" '+attributes+' aria-label="'+name+'">'+options.map(([v,label])=>'<option value="'+v+'" '+(String(v)===String(value)?'selected':'')+'>'+label+'</option>').join('')+'</select>';
}
function foundingIndustryDetails(b){
 if(!['garden','workshop'].includes(b.type)&&!frontierProducer(b))return '';
 const r=productionRecord(b),recipe=chosenRecipe(r),duration=b.type==='garden'?cropDuration(r.stage):recipe.seconds;
 return '<section class="infocard"><b id="production-status">'+esc(industrySummary(b))+'</b><div class="progress"><i id="production-progress" style="width:'+Math.min(100,r.elapsed/duration*100)+'%"></i></div>'+
 '<p>'+(b.type==='garden'?'Plant → germinate → tend → grow → harvest · '+cropYield()+' food per full crop':recipe.name+' · '+Object.entries(recipe.cost).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+' → '+recipe.yield+' alloy · 3 power demand')+'</p>'+
 '<p>'+r.cycles+' cycles completed · '+r.output+' units produced</p>'+
 '<button class="secondary" data-industry-pause="'+b.id+'">'+(r.paused?'Resume':'Pause')+' production</button>'+
 (b.type==='workshop'?'<label>Recipe'+industrySelect('Workshop recipe',r.recipe,industryRecipes().map(([k,v])=>[k,v.name]),'data-industry-recipe="'+b.id+'"')+'</label>':'')+
 (b.type==='workshop'?'<label><input type="checkbox" data-auto-recipe="'+b.id+'" '+(!r.manualRecipe?'checked':'')+'> Choose available inputs automatically</label>':'')+
 '<label>Assigned worker'+industrySelect('Assigned worker',r.worker||'', [['','Any available specialist'],...S.colonists.map(p=>[p.id,p.name])],'data-industry-worker="'+b.id+'"')+'</label></section>';
}
const workGroups={build:'Construction',haul:'Hauling',gather:'Field resources',field:'Agriculture',factory:'Manufacturing',research:'Research',survey:'Survey'};
function personPriorityControls(p){
 return '<details><summary>Personal work priorities</summary>'+Object.entries(workGroups).map(([k,n])=>'<label class="work-control">'+n+industrySelect(n,p.workWeights?.[k]??1,[[0,'Disabled'],[1,'Normal'],[2,'High'],[3,'Urgent']],'data-work-person="'+p.id+'" data-work-group="'+k+'"')+'</label>').join('')+'</details>';
}
function industryPanel(){
 const c=industryPolicy();
 return '<p>Basic needs take precedence. Priorities direct available workers. Targets include stored, loose and carried supplies.</p><h3>Resource targets</h3>'+
 Object.entries(c.targets).map(([k,n])=>'<label class="work-control">'+MATERIALS[k].name+'<input class="field" style="width:90px" aria-label="'+MATERIALS[k].name+' target" type="number" min="0" max="9999" step="1" value="'+n+'" data-industry-target="'+k+'"></label>').join('')+
 '<h3>Colony priorities</h3>'+Object.entries(workGroups).map(([k,n])=>'<label class="work-control">'+n+industrySelect(n,c.weights[k]??1,[[0,'Disabled'],[1,'Normal'],[2,'High'],[3,'Urgent']],'data-colony-weight="'+k+'"')+'</label>').join('')+
 '<h3>Production facilities</h3>'+S.buildings.filter(b=>['garden','workshop'].includes(b.type)||frontierProducer(b)).map(b=>'<button class="hubitem" data-facility="'+b.id+'"><span>'+uiIcon(b.type,20)+'</span><span><b>'+TYPES[b.type].name+'</b><small>'+esc(industrySummary(b))+'</small></span></button>').join('');
}
function showIndustry(){sheetSection='industry';showSheet(sectionHeader('Work & production','COLONY ORDERS')+industryPanel());renderNavState()}
function workWeight(p,group){
 const weights=industryPolicy().weights;
 if(p.work==='survey'&&group!=='survey')return 0;
 return (p.workWeights?.[group]??1)*(weights[group]??1);
}
function interruptAvailable(){
 for(const p of S.colonists)if(['research','farm','craft'].includes(p.task?.type)){p.task=null;p.path=[];p.action=0}
}
document.addEventListener('change',e=>{
 const el=e.target, c=industryPolicy();
 if(el.dataset.autoRecipe){const b=S.buildings.find(b=>b.id===+el.dataset.autoRecipe);if(b)productionRecord(b).manualRecipe=!el.checked;}else if(el.dataset.industryTarget){
   const n=Number(el.value);if(Number.isFinite(n))c.targets[el.dataset.industryTarget]=clamp(Math.floor(n),0,9999);
 }else if(el.dataset.colonyWeight)c.weights[el.dataset.colonyWeight]=clamp(+el.value,0,3);
 else if(el.dataset.workPerson){const p=S.colonists.find(p=>p.id===+el.dataset.workPerson);if(p){p.workWeights??={};p.workWeights[el.dataset.workGroup]=clamp(+el.value,0,3)}}
 else if(el.dataset.industryWorker||el.dataset.industryRecipe){
   const b=S.buildings.find(b=>b.id===+(el.dataset.industryWorker||el.dataset.industryRecipe));if(!b)return;
   const r=productionRecord(b);
   if(el.dataset.industryWorker)r.worker=+el.value||null;
   else if(frontierProducer(b)){if(!frontierChangeRecipe(b,el.value))notice('Finish the active batch before changing recipes.');el.value=r.recipe;}
   else if(industryRecipes(b).some(([id])=>id===el.value)){r.recipe=el.value;r.elapsed=0;r.manualRecipe=true;}
 }else return;
 interruptAvailable();save();
});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-industry-pause]');if(!el)return;
 const b=S.buildings.find(b=>b.id===+el.dataset.industryPause);if(!b)return;
 const r=productionRecord(b);delete b.autoPowerHold;r.paused=!r.paused;interruptAvailable();save();showBuilding(b.id);
});
