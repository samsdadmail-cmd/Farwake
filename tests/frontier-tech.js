async function verifyFrontierTech(frame,out){
 frame.src='candidate/index.html?slot=tech-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=12000)=>{for(let i=0;i<n&&!until();i++)g.tick(.1);return until()};
 try{
 const known=s.research.slice();g.frontierMigrate();ok(known.every(id=>s.research.includes(id)),'migration preserves earlier research');
 ok(Object.keys(g.FRONTIER_TECH).length>=17,'seven-branch expansion exposes future capabilities');
 ok(g.buildAt('cabin',30,30)===false,'cabin locked before its technology');
 ok(g.buildAt('shelter',30,30),'build permanent founding home');
 ok(run(()=>s.buildings.some(b=>b.type==='shelter'&&b.finished)),'crew completes founding housing');
 s.resources.knowledge=100;g.industryPolicy().targets.wood=40;
 ok(!g.researchReason('timbercraft'),'practical shelter achievement opens structural timber');
 g.frontierBeginResearch('timbercraft');
 const budget=s.resources.knowledge;g.frontierBeginResearch('energy');ok(g.frontierState().research.id==='timbercraft'&&s.resources.knowledge===budget,'legacy research cannot overwrite an active frontier study');
 ok(g.frontierState().research.id==='timbercraft'&&!s.research.includes('timbercraft'),'research enters an active study state');
 ok(run(()=>s.research.includes('timbercraft')),'actual researcher completes structural timber study');
 ok(g.buildAt('sawmill',26,33),'technology unlocks a new constructible sawmill');
 const mill=s.buildings.find(b=>b.type==='sawmill');
 ok(run(()=>mill.finished),'crew supplies and constructs unlocked sawmill');
 ok(run(()=>g.frontierState().produced.boards>=6),'operator makes physical structural boards from timber');
 ok(s.piles.some(q=>q.kind==='boards')||s.colonists.some(p=>p.carry?.kind==='boards')||s.resources.boards>0,'advanced output belongs to the physical economy');
 g.researchReason('cabins');
 ok(run(()=>g.frontierState().produced.boards>=8),'second batch unlocks meaningful architecture prerequisite');
 ok(!g.researchReason('cabins'),'boards open cabin technology');
 g.frontierBeginResearch('cabins');ok(run(()=>s.research.includes('cabins')),'second research completes through staff work');
 ok(run(()=>g.freightAvailable('boards')>=16&&g.freightAvailable('wood')>=8),'supply processed boards and timber for the cabin');
 ok(g.buildAt('cabin',30,33),'new residence uses actual processed timber');
 ok(run(()=>s.buildings.some(b=>b.type==='cabin'&&b.finished)),'researched cabin can be built by the crew');
 w.QA.openSection('research');
 ok(frame.contentDocument.querySelectorAll('.tech-links path').length>15,'technology prerequisites form visible connected edges');
 g.save();g.load();ok(g.state.research.includes('cabins')&&g.state.buildings.some(b=>b.type==='cabin'),'new capability and building survive a v3 save');
 g.frontierBeginResearch('medicine');
 ok(run(()=>g.frontierState().research?.progress>0),'another study accumulates actual researcher work');
 const active=g.frontierState().research,beforeCancel=g.state.resources.knowledge,refund=Math.floor(g.researchDefinition(active.id).cost*(1-active.progress/active.effort));
 ok(g.frontierCancelResearch()&&!g.frontierState().research&&!g.state.research.includes('medicine')&&g.state.resources.knowledge===beforeCancel+refund,'cancel returns only unused knowledge without granting the technology');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
