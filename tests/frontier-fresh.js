async function verifyFrontierFresh(frame,out){
 frame.src='candidate/index.html?slot=fresh-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(fail(label));lines.push('PASS '+label+' · Day '+s.day);out.textContent=lines.join('\n')};
 // Only player-facing policies, research and construction orders are changed.
 // No resources, achievements, colonists or technologies are granted by the fixture.
 const run=async (until,n=100000)=>{for(let i=0;i<n;i++){if(until())return true;g.tick(.1);if(i%30===0)await new Promise(r=>setTimeout(r,0))}return until()};
 const fail=label=>label+' '+JSON.stringify({day:s.day,stocks:s.resources,people:s.colonists.map(p=>({name:p.name,task:p.task?.type,energy:p.energy,hunger:p.hunger})),sites:s.buildings.filter(b=>!b.finished).map(b=>({type:b.type,stock:b.siteStock,needs:b.reservedMaterials}))});
 async function place(type){
  let b,attempt=0;
  const search=()=>{if(++attempt%10)return false;const def=g.TYPES[type];if(Object.entries(def.cost).some(([k,n])=>g.freightAvailable(k)<n))return false;
   for(let y=30;y<52;y++)for(let x=21;x<52;x++)if(g.clearFootprint(x,y,def.w,def.h)&&g.buildAt(type,x,y)){b=s.buildings.at(-1);return true}
   return false};
  ok(await run(search,20000),'fund and place '+type);ok(await run(()=>b.finished,40000),'crew completes '+type);return b;
 }
 async function study(id){ok(await run(()=>!g.researchReason(id),60000),'satisfy '+id+' prerequisites');g.frontierBeginResearch(id);ok(await run(()=>s.research.includes(id),20000),'staff research '+id)}
 try{
 Object.assign(g.industryPolicy().targets,{wood:140,ore:100,scrap:180,food:120,boards:100,water:80,meals:50,metal:100,components:70,composite:80});
 g.editorBegin('mark');g.editor.start={x:20,y:30};g.editor.end={x:44,y:38};g.editorConfirm();
 await place('shelter');await place('garden');await place('solar');await place('workshop');await place('shed');await place('shelter');
 await study('timbercraft');await place('sawmill');
 await study('cabins');await place('cabin');
 await study('energy');await study('refining');await place('smelter');
 await study('windpower');await place('wind');
 await study('growth');await study('waterworks');await place('pump');await study('cooking');await place('kitchen');
 await study('optics');await study('fabrication');const fabricator=await place('fabricator');
 if(fabricator.autoPowerHold||g.surveyGrid().supply<g.surveyGrid().used+5)await place('wind');
 ok(await run(()=>g.frontierState().produced.components>=4),'fresh economy manufactures components');
 ok(s.colonists.length===5&&s.colonists.every(p=>Number.isFinite(p.energy)&&Number.isFinite(p.hunger)),'original expedition remains viable through advanced industry');
 g.save();g.load();ok(g.state.research.includes('fabrication'),'organic colony progression survives loading');
 w.localStorage.setItem('frontier-organic-review',JSON.stringify(g.state));out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
