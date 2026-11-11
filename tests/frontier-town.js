async function verifyFrontierTown(frame,out){
 frame.src='candidate/index.html?slot=town-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=14000)=>{for(let i=0;i<n&&!until();i++){if(s.minute>1180)s.minute=600;g.tick(.1)}return until()};
 try{
 s.minute=600;s.research.push(...Object.keys(g.FRONTIER_TECH),'energy');
 s.resources={wood:180,scrap:200,alloy:150,ore:50,boards:150,metal:150,components:80,composite:50,water:30,food:100,meals:50,knowledge:200};g.freightInit();
 for(const k in g.industryPolicy().targets)g.industryPolicy().targets[k]=0;
 function place(type){const t=g.FRONTIER_BUILDINGS[type];for(let y=28;y<56;y+=4)for(let x=20;x<56;x+=5)if(g.clearFootprint(x,y,t.w,t.h)&&g.buildAt(type,x,y))return s.buildings.at(-1);throw Error('Site '+type)}
 const home=place('cabin'),hall=place('recreation');
 ok(run(()=>home.finished&&hall.finished),'workers build a home and community hall');
 const beds=g.housingCounts().beds;ok(g.frontierUpgrade(home),'fund an actual home expansion order');
 ok(home.level!==2&&home.upgradeOrder,'upgrade does not instantly add beds');
 ok(run(()=>home.level===2),'haulers deliver materials and builder completes expansion');
 ok(g.housingCounts().beds===beds+1,'completed expansion creates one real permanent bed');
 const p=s.colonists[0];p.social=5;p.hunger=10;p.energy=90;p.task=null;p.path=[];
 ok(run(()=>g.frontierState().socialVisits>0),'resident autonomously visits the hall and socializes');
 g.frontierState().sites.push({id:'test-discovery',resolved:true});
 s.buildings.push({id:990,type:'comms',x:19,y:20,w:2,h:2,finished:true});
 if(g.housingCounts().beds<=g.housingCounts().permanent){const lodge=place('dormitory');ok(run(()=>lodge.finished),'provide room for newcomers')}
 const count=s.colonists.length;ok(g.frontierInvite(),'player can invite one settler when infrastructure and provisions are ready');
 ok(s.colonists.length===count+1&&s.colonists.at(-1).home!=null,'arrival receives a genuine bed');
 const empty={id:991,type:'warehouse',x:49,y:49,w:4,h:3,finished:true,level:2};s.buildings.push(empty);
 ok(g.housingCounts().beds<30,'nonresidential upgrades never create ghost beds');
 g.editorBegin('road');
 let route=null;
 for(let y=20;y<40&&!route;y++)for(let x=20;x<40&&!route;x++)if(g.clearFootprint(x,y,3,1)&&[0,1,2].every(i=>w.QA.fog[y*56+x+i]))route=[0,1,2].map(i=>({x:x+i,y}));
 ok(route,'find an explored three-tile road route');g.editor.cells=route;
 ok(g.editorPlan().valid&&g.editorPlan().description.includes('3'),'batch road preview reports total material costs');g.editorConfirm();
 ok(run(()=>route.every(q=>s.buildings.some(b=>b.type==='road'&&b.finished&&b.x===q.x&&b.y===q.y))),'crew builds the complete connected road batch');
 g.save();g.load();const loaded=g.state.buildings.find(b=>b.id===home.id);
 ok(loaded.level===2&&loaded.history.work>0,'upgrade and actual activity history persist');
 g.draw(1000);g.state.minute=1300;g.draw(3000);
 ok(true,'day and night settlement rendering succeeds');
 const resident=g.state.colonists.find(p=>p.home===home.id);g.state.minute=1300;resident.energy=10;resident.hunger=10;resident.task=null;resident.path=[];
 for(let n=0;n<3000&&resident.visit?.stage!=='inside';n++){g.tick(.1);g.advanceWorld(.1)}
 ok(resident.visit?.stage==='inside','nighttime resident physically enters their expanded home');
 g.advanceWorld(.1);const occupied=w.FarwakeDoors.state(loaded);
 ok(occupied.occupied>0&&occupied.actions.includes('rest'),'hearth and silhouettes receive real resting occupancy');
 const hours=loaded.history.residentHours;
 for(let n=0;n<10;n++){g.tick(.1);g.advanceWorld(.1)}
 ok(loaded.history.residentHours>hours,'only actual indoor time accumulates residential history');
 g.state.weather='rain';g.draw(4000);g.save();g.load();
 ok(g.state.buildings.find(b=>b.id===home.id).history.residentHours>hours,'occupied home history survives rainy-night save/load');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
