async function verifyFrontierIndustry(frame,out){
 frame.src='candidate/index.html?slot=industry-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=16000)=>{for(let i=0;i<n&&!until();i++){if(s.minute>1180)s.minute=600;g.tick(.1)}return until()};
 try{
 s.minute=600;s.research.push(...Object.keys(g.FRONTIER_TECH),'energy','growth');
 s.resources={wood:200,scrap:200,alloy:150,ore:100,boards:150,metal:100,components:60,composite:50,water:0,food:40,meals:0,relic:3,knowledge:300};
 g.freightInit();g.industryPolicy().targets={wood:0,ore:0,scrap:0,food:200,alloy:200,boards:200,metal:200,components:200,composite:200,water:100,meals:100,relic:10};
 // Abundant power is a test fixture. Construction and every recipe use actual work and materials.
 s.buildings.push({id:900,type:'solar',x:21,y:20,w:2,h:2,finished:true},{id:901,type:'solar',x:24,y:20,w:2,h:2,finished:true},{id:902,type:'wind',x:27,y:20,w:2,h:2,finished:true},{id:903,type:'wind',x:30,y:20,w:2,h:2,finished:true});
 function place(type){
  const t=g.FRONTIER_BUILDINGS[type];for(let y=22;y<56;y+=4)for(let x=20;x<56;x+=5){
   if(g.clearFootprint(x,y,t.w,t.h)&&g.buildAt(type,x,y))return s.buildings.at(-1);
  }throw Error('No funded clear site for '+type+' available '+JSON.stringify(s.resources));
 }
 const pump=place('pump'),kitchen=place('kitchen'),mill=place('sawmill'),smelter=place('smelter'),fabricator=place('fabricator');
 ok(run(()=>[pump,kitchen,mill,smelter,fabricator].every(b=>b.finished)),'crew constructs five distinct industrial facilities');
 ok(run(()=>g.frontierState().produced.water>=6),'Rainwater Works collects real filtered water');
 ok(run(()=>g.frontierState().produced.meals>=6),'kitchen receives food and water and cooks physical meals');
 ok(run(()=>g.frontierState().produced.boards>=6),'sawmill processes timber into structural boards');
 ok(run(()=>g.frontierState().produced.metal>=5),'smelter processes raw ore into refined metal');
 ok(run(()=>g.frontierState().produced.components>=4),'fabricator turns delivered metal and alloy into components');
 const record=g.productionRecord(fabricator);
 // Only switch after any previously-started batch finishes and any input request is cancelled safely.
 ok(run(()=>!record.batch),'current fabrication batch completes');ok(g.frontierChangeRecipe(fabricator,'panels'),'recipe changes safely after a batch');
 ok(run(()=>g.frontierState().produced.composite>=5),'second fabrication recipe produces useful composite panels');
 g.showBuilding(fabricator.id);const d=w.document,assigned=s.colonists[0],select=d.querySelector('[data-industry-worker]');
 select.value=assigned.id;select.dispatchEvent(new w.Event('change',{bubbles:true}));assigned.energy=95;assigned.hunger=10;assigned.task=null;assigned.path=[];
 ok(record.worker===assigned.id&&run(()=>assigned.task?.id===fabricator.id),'inspector assignment directs a real worker to the fabrication job');
 ok(run(()=>record.batch&&record.elapsed>0),'assigned worker advances an actual fabrication batch');
 g.refreshCommandReadouts();
 ok(Math.abs(parseFloat(d.querySelector('#production-progress').style.width)-100*record.elapsed/g.FRONTIER_RECIPES[record.recipe].seconds)<.1,'live inspector progress uses actual recipe duration');
 const recipeSelect=d.querySelector('[data-industry-recipe]'),activeRecipe=record.recipe;recipeSelect.value='components';recipeSelect.dispatchEvent(new w.Event('change',{bubbles:true}));
 ok(record.recipe===activeRecipe&&recipeSelect.value===activeRecipe,'active-batch recipe change is rejected and UI restores the real choice');
 const load=g.surveyGrid().used;d.querySelector('[data-industry-pause]').click();
 ok(record.paused&&g.surveyGrid().used===load-5,'pausing production releases its real grid demand');
 d.querySelector('[data-industry-pause]').click();ok(!record.paused,'resume control restores production');

 ok(s.piles.some(q=>q.site===kitchen.id)||s.colonists.some(p=>p.carry?.site===kitchen.id)||g.productionRecord(kitchen).cycles>0,'production inputs travel in physical assigned lots');
 const home=place('cabin'),lodge=place('dormitory'),depot=place('warehouse'),bank=place('accumulator'),house=place('greenhouse');
 ok(run(()=>[home,lodge,depot,bank,house].every(b=>b.finished)),'advanced residential, storage, energy and food facilities constructed');
 g.housingAllocate();ok(g.housingCounts().beds>=12,'new residences provide four and eight genuine permanent beds');
 ok(w.QA.storageCapacity()>=1060,'freight depot contributes real 720-unit storage');
 ok(g.surveyGrid().cap>=480,'advanced accumulator contributes real grid reserve');
 ok(run(()=>g.frontierState().produced.food>=14),'glasshouse uses delivered water to grow food');
 ok(run(()=>s.resources.meals>0),'haulers put prepared meals into stores');
 const p=s.colonists[0],old=s.resources.meals;p.hunger=90;p.energy=95;p.task=null;p.path=[];
 ok(run(()=>p.hunger<20),'hungry colonist consumes actual prepared meal');
 ok(s.freightFlow.consumed.meals>0,'prepared meal consumption is accounted');
 g.save();g.load();
 ok(g.state.buildings.find(b=>b.id===fabricator.id).production.cycles>0,'industrial progress survives load');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
