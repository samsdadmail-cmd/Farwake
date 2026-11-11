async function verifyFrontierJourney(frame,out){
 if(new URLSearchParams(location.search).has('resume')){
  frame.src='candidate/index.html?slot=journey-resume-'+Date.now();await new Promise(r=>frame.onload=r);
  const w=frame.contentWindow,key='farwake_qa_'+new URLSearchParams(new URL(frame.src).search).get('slot'),raw=w.localStorage.getItem('frontier-organic-review');
  if(!raw){out.textContent='FAILED No organic checkpoint exists';return}
  w.localStorage.setItem(key,raw);w.FARWAKE_TEST.load();out.textContent='Resumed the verified organic expedition at Day '+w.FARWAKE_TEST.state.day;
 }else{await verifyFrontierFresh(frame,out);if(out.textContent.includes('FAILED'))return;}
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[out.textContent.replace('COMPLETE','')];
 const detail=()=>JSON.stringify({availableScrap:g.freightAvailable('scrap'),loose:s.piles.filter(q=>q.kind==='scrap'),mappedScrap:g.features.filter(f=>f.type==='scrap').length,day:s.day,stocks:s.resources,power:g.surveyGrid(),held:s.buildings.filter(b=>b.autoPowerHold).map(b=>b.type)});
 const ok=(v,label)=>{if(!v)throw Error(label+' '+detail());lines.push('PASS '+label+' · Day '+s.day);out.textContent=lines.join('\n')};
 const run=async (until,n=40000)=>{for(let i=0;i<n;i++){if(until())return true;g.tick(.25);if(i%30===0)await new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>{c.port1.close();c.port2.close();r()};c.port2.postMessage(0)})}return until()};
 async function place(type,near){
  const t=g.TYPES[type];let built,attempt=0,lastGeometry='';
  const search=()=>{
   if(++attempt%10)return false;
   if(Object.entries(t.cost).some(([k,n])=>g.freightAvailable(k)<n))return false;
   const geometry=s.buildings.length+':'+s.harvested.length+':'+s.piles.map(q=>q.id).join(',');if(geometry===lastGeometry)return false;lastGeometry=geometry;
   const x0=near?Math.max(2,near.x-5):20,y0=near?Math.max(2,near.y-5):30;
   const x1=near?Math.min(53-t.w,near.x+5):52-t.w,y1=near?Math.min(53-t.h,near.y+5):52-t.h;
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(near&&Math.hypot(x-near.x,y-near.y)>6)continue;
    if(g.clearFootprint(x,y,t.w,t.h)&&!s.buildings.some(b=>x+Math.floor(t.w/2)>=b.x&&x+Math.floor(t.w/2)<b.x+b.w&&y+t.h>=b.y&&y+t.h<b.y+b.h)&&!g.frontierPlacementReason(type,x,y)&&g.buildAt(type,x,y)){built=s.buildings.at(-1);return true}
   }return false;
  };
  ok(await run(search,20000),'fund and place '+type);ok(await run(()=>built.finished),'crew completes '+type);
  if(type!=='wind')await ensurePower();return built;
 }
 async function ensurePower(){
  for(let i=0;i<5;i++){
   g.frontierTick(1);const grid=g.surveyGrid(),held=s.buildings.filter(b=>b.autoPowerHold).reduce((n,b)=>n-g.TYPES[b.type].power,0);
   if(grid.supply-grid.used>=held+3)return;await place('wind');
  }
 }
 async function study(id){ok(await run(()=>!g.researchReason(id)),'satisfy '+id+' prerequisites');g.frontierBeginResearch(id);ok(await run(()=>s.research.includes(id)),'staff research '+id)}
 async function investigate(site){
  if(!g.frontierSiteReach(site))await place('outpost',site);
  ok(g.frontierOrderSite(site.id,'study'),'dispatch real expedition '+site.kind);
  ok(await run(()=>site.resolved),'complete planetary '+site.kind+' investigation');
 }
 async function recipe(id){
  const b=s.buildings.find(b=>b.type==='fabricator'),r=g.productionRecord(b);await ensurePower();
  ok(await run(()=>!r.batch),'finish fabrication batch before switching');ok(g.frontierChangeRecipe(b,id),'select '+id+' production');
 }
 try{
 Object.assign(g.industryPolicy().targets,{alloy:20,metal:50,components:50,boards:80});
 g.editorBegin('mark');g.editor.start={x:20,y:30};g.editor.end={x:49,y:49};g.editorConfirm();
 await study('commons');await place('dining');await study('lodging');await place('dormitory');await study('civiclife');await place('recreation');
 await study('signal');await place('comms');await study('fieldstations');
 await investigate(g.frontierState().sites.find(q=>q.seen&&!q.resolved&&g.frontierSiteReach(q)));
 const pop=s.colonists.length;
 for(let i=0;i<3;i++){ok(await run(()=>!g.frontierArrivalReason()),'arrival infrastructure and provisions ready');ok(g.frontierInvite(),'invite one supported settler')}
 ok(s.colonists.length===pop+3&&s.colonists.every(p=>p.home!=null),'controlled growth to eight genuinely housed people');
 await place('shed');await study('freightnetwork');await place('warehouse');
 const seam=g.frontierState().sites.find(q=>q.kind==='seam'&&q.seen);if(!seam.resolved)await investigate(seam);
 await study('extraction');const fieldBefore=seam.remaining;ok(g.frontierOrderExtraction(seam.id,true),'order finite field extraction without a rig');
 ok(await run(()=>g.freightAvailable('metal')>=24),'field ore supplies the bootstrap smelting chain');
 ok(seam.remaining<fieldBefore,'hand extraction depletes the same investigated seam');
 const rig=await place('drill',seam);g.frontierOrderExtraction(seam.id,false);const before=seam.remaining;
 ok(await run(()=>seam.remaining<before),'organically built rig extracts finite deep ore');
 const third=g.frontierState().sites.find(q=>q.seen&&!q.resolved);await investigate(third);
 await study('accumulation');await place('accumulator');await recipe('panels');
 ok(await run(()=>g.frontierState().produced.composite>=30),'complete advanced construction-material chain');
 await study('civilworks');await recipe('components');
 await study('metallurgy');await place('battery');await study('heliostat');
 await study('resonance');const observatory=await place('observatory');
 await ensurePower();ok(await run(()=>g.frontierState().signalComplete,60000),'original expedition evolves into a powered listening frontier');
 ok(s.buildings.filter(b=>b.finished).length>=20&&g.frontierEra()===4,'capabilities reach Deep Frontier era');
 const age=s.day;g.save();g.load();
 ok(g.state.frontier.signalComplete&&g.state.colonists.length===8,'complete organic civilization survives save/load');
 w.localStorage.setItem('frontier-organic-review',JSON.stringify(g.state));
 out.textContent=lines.concat('COMPLETE ORGANIC JOURNEY').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
