async function verifyProduction(frame,out){
 const slot='prod-'+Date.now();frame.src='candidate/index.html?slot='+slot;await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=9000)=>{for(let i=0;i<n&&!until();i++)g.tick(.1);return until()};
 try{
 const camp=s.buildings.find(b=>b.type==='camp');
 ok(s.colonists.every(p=>p.home===camp.id),'legacy founders receive five camp bunks');
 g.buildAt('shelter',30,30);let home=s.buildings.find(b=>b.type==='shelter');ok(run(()=>home.finished),'home constructed');
 ok(g.housingCounts().permanent===3&&g.housingCounts().camp===2,'three permanent beds allocated without overcrowding');
 const other=s.colonists.find(p=>p.home!==home.id),resident=s.colonists.find(p=>p.home===home.id);
 ok(g.housingAssign(other.id,home.id,resident.id),'manual household bed swap succeeds');
 const previous={x:other.x,y:other.y,energy:other.energy,mood:other.mood};
 other.visit={stage:'inside',building:home.id};other.energy=30;g.housingRecovery(other,1);
 const comfortable=other.energy;other.visit=null;other.energy=30;g.housingRecovery(other,1);
 ok(comfortable>other.energy,'rest recovery reflects permanent indoor housing');
 Object.assign(other,previous);delete other.visit;
 ok(g.buildAt('garden',26,33),'grow-bed blueprint placed');
 const farm=s.buildings.find(b=>b.type==='garden');ok(run(()=>farm.finished),'crew builds garden');
 const stages=new Set(),before=s.resources.food+s.piles.filter(q=>q.kind==='food').reduce((n,q)=>n+q.amount,0);
 ok(run(()=>{const r=g.productionRecord(farm);stages.add(r.stage);return r.cycles>0}),'worker plants, tends and harvests a real crop');
 ok(['plant','germinate','tend','grow','harvest'].every(k=>stages.has(k)),'all five crop stages occur');
 ok(g.productionRecord(farm).output===7,'harvest produces seven physical food');
 // Stage ample workshop inputs as legacy stores, reconcile to its ledger, then use real dispatch.
 s.resources.scrap+=50;s.resources.ore=12;g.freightInit();
 ok(g.buildAt('workshop',30,33),'workshop placed');let shop=s.buildings.find(b=>b.type==='workshop');
 // Supply one solar array as a fixture so this test isolates production from construction funding.
 s.buildings.push({id:999,type:'solar',x:23,y:26,w:2,h:2,finished:true,progress:100});
 ok(run(()=>shop.finished),'workshop supplied and completed');
 const metal=g.productionRecord(shop);ok(run(()=>metal.cycles>0),'assigned engineer makes alloy from inputs with power');
 ok(metal.output>0&&s.freightFlow.consumed.ore>=2,'recipe consumes real ore and records output');
 metal.paused=true;const cycles=metal.cycles;run(()=>false,200);
 ok(metal.cycles===cycles&&g.productionBlock(shop).includes('Paused'),'pause prevents another batch');
 metal.paused=false;g.industryPolicy().targets.alloy=0;
 ok(g.productionBlock(shop).includes('target'),'stock target stops manufacturing');
 g.save();g.load();
 const restored=g.state.buildings.find(b=>b.id===farm.id);
 ok(restored.production.cycles>0&&g.state.colonists.some(p=>p.home===home.id),'crop progress and permanent housing survive load');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
