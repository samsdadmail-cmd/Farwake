async function verifyFrontierFresh(frame,out){
 frame.src='candidate/index.html?slot=fresh-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(fail(label));lines.push('PASS '+label+' · Day '+s.day);out.textContent=lines.join('\n')};
 // Only player-facing policies, research and construction orders are changed.
 // No resources, achievements, colonists or technologies are granted by the fixture.
 const run=(until,n=100000)=>{for(let i=0;i<n;i++){if(until())return true;g.tick(.1)}return until()};
 const fail=label=>label+' '+JSON.stringify({day:s.day,stocks:s.resources,people:s.colonists.map(p=>({name:p.name,task:p.task?.type,energy:p.energy,hunger:p.hunger})),sites:s.buildings.filter(b=>!b.finished).map(b=>({type:b.type,stock:b.siteStock,needs:b.reservedMaterials}))});
 function place(type){
  let b;
  const search=()=>{const def=g.TYPES[type];if(Object.entries(def.cost).some(([k,n])=>g.freightAvailable(k)<n))return false;
   for(let y=30;y<52;y+=4)for(let x=21;x<52;x+=5)if(g.clearFootprint(x,y,def.w,def.h)&&g.buildAt(type,x,y)){b=s.buildings.at(-1);return true}
   return false};
  ok(run(search,20000),'fund and place '+type);ok(run(()=>b.finished,40000),'crew completes '+type);return b;
 }
 function study(id){ok(run(()=>!g.researchReason(id),60000),'satisfy '+id+' prerequisites');g.frontierBeginResearch(id);ok(run(()=>s.research.includes(id),20000),'staff research '+id)}
 try{
 Object.assign(g.industryPolicy().targets,{wood:140,ore:100,scrap:180,food:120,boards:100,water:80,meals:50,metal:100,components:70,composite:80});
 g.editorBegin('mark');g.editor.start={x:20,y:30};g.editor.end={x:44,y:38};g.editorConfirm();
 place('shelter');place('garden');place('solar');place('workshop');place('shed');place('shelter');
 study('timbercraft');place('sawmill');
 study('cabins');place('cabin');
 study('energy');study('refining');place('smelter');
 study('windpower');place('wind');
 study('growth');study('waterworks');place('pump');study('cooking');place('kitchen');
 study('optics');study('fabrication');const fabricator=place('fabricator');
 if(fabricator.autoPowerHold||g.surveyGrid().supply<g.surveyGrid().used+5)place('wind');
 ok(run(()=>g.frontierState().produced.components>=4),'fresh economy manufactures components');
 ok(s.colonists.length===5&&s.colonists.every(p=>Number.isFinite(p.energy)&&Number.isFinite(p.hunger)),'original expedition remains viable through advanced industry');
 g.save();g.load();ok(g.state.research.includes('fabrication'),'organic colony progression survives loading');
 w.localStorage.setItem('frontier-organic-review',JSON.stringify(g.state));out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
