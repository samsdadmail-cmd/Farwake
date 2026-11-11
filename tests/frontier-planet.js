async function verifyFrontierPlanet(frame,out){
 frame.src='candidate/index.html?slot=planet-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=16000)=>{for(let i=0;i<n&&!until();i++){if(s.minute>1180)s.minute=600;g.tick(.1)}return until()};
 try{
 s.minute=600;s.research.push('optics');s.resources.food=250;g.industryPolicy().targets.wood=0;
 const sites=g.frontierState().sites;ok(sites.length>=6,'seed creates finite reachable planetary sites');
 const near=sites.find(q=>g.frontierSiteReach(q)&&q.kind==='wreck');w.QA.fog[near.y*56+near.x]=1;g.tick(1);
 ok(near.seen,'survey visibility discovers a real site');
 ok(g.frontierOrderSite(near.id,'recover'),'order a salvage-focused field investigation');
 ok(run(()=>near.resolved),'surveyor travels to the site and completes investigation');
 ok(s.piles.some(p=>p.kind==='relic')||s.colonists.some(p=>p.carry?.kind==='relic')||(s.resources.relic||0)>0,'recovered core exists as physical material');
 ok(!g.frontierOrderSite(near.id,'study'),'resolved site cannot yield duplicate rewards');
 const distant=sites.find(q=>!g.frontierSiteReach(q));distant.seen=true;
 ok(g.frontierSiteReason(distant).includes('Outpost'),'distant investigations need a genuine forward base');
 s.research.push(...Object.keys(g.FRONTIER_TECH));
 s.resources.boards=90;s.resources.metal=120;s.resources.alloy=100;s.resources.components=80;s.resources.composite=80;s.resources.relic=5;g.freightInit();
 const type=g.FRONTIER_BUILDINGS.outpost;let base;
 for(let y=Math.max(1,distant.y-6);y<Math.min(53,distant.y+6)&&!base;y++)for(let x=Math.max(1,distant.x-6);x<Math.min(53,distant.x+6)&&!base;x++)if(g.clearFootprint(x,y,type.w,type.h)&&g.buildAt('outpost',x,y))base=s.buildings.at(-1);
 ok(base&&run(()=>base.finished),'crew supplies and constructs a distant expedition outpost');
 ok(g.frontierSiteReach(distant)&&g.frontierOrderSite(distant.id,'study'),'forward base opens distant investigation');
 ok(run(()=>distant.resolved),'outpost-supported expedition completes');
 const seam=sites.find(q=>q.kind==='seam');seam.seen=true;
 if(!g.frontierSiteReach(seam))s.buildings.push({id:880,type:'outpost',x:seam.x+3,y:seam.y,w:3,h:2,finished:true});
 ok(g.frontierOrderSite(seam.id,'study')&&run(()=>seam.resolved),'geological investigation maps a finite underground seam');
 let rig;for(let y=Math.max(1,seam.y-4);y<Math.min(52,seam.y+4)&&!rig;y++)for(let x=Math.max(1,seam.x-4);x<Math.min(52,seam.x+4)&&!rig;x++)if(Math.hypot(x-seam.x,y-seam.y)<=6&&g.clearFootprint(x,y,3,3)&&g.buildAt('drill',x,y))rig=s.buildings.at(-1);
 ok(rig&&run(()=>rig.finished),'crew builds extraction rig beside the investigated seam');
 s.buildings.push({id:881,type:'wind',x:18,y:20,w:2,h:2,finished:true},{id:882,type:'wind',x:15,y:20,w:2,h:2,finished:true},{id:883,type:'wind',x:12,y:20,w:2,h:2,finished:true});
 g.industryPolicy().targets.ore=50;const before=seam.remaining;
 ok(run(()=>seam.remaining<before),'operator extracts actual finite seam ore');
 ok(seam.remaining===before-5||seam.remaining<before-5,'extraction depletes underground supply');
 let obs;for(let y=30;y<50&&!obs;y++)for(let x=20;x<49&&!obs;x++)if(g.clearFootprint(x,y,5,4)&&g.buildAt('observatory',x,y))obs=s.buildings.at(-1);
 ok(obs&&run(()=>obs.finished),'advanced materials fund and build the listening observatory');
 ok(run(()=>g.frontierState().signalComplete,30000),'scientific staff align the real powered late-game project');
 g.save();g.load();ok(g.frontierState().signalComplete&&g.frontierState().sites.find(q=>q.id===seam.id).remaining<before,'discoveries, finite extraction and project progress persist');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
