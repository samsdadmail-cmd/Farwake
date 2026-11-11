async function verifyEconomy(frame,out){
 frame.src='candidate/index.html?slot=econ-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const run=(until,n=15000)=>{for(let i=0;i<n&&!until();i++)g.tick(.1);return until()};
 const totals=()=>Object.fromEntries(['wood','ore','alloy','scrap'].map(k=>[k,(s.resources[k]||0)+s.piles.filter(q=>q.kind===k).reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0)+s.buildings.reduce((n,b)=>n+(b.siteStock?.[k]||0),0)]));
 try{
 const c=g.industryPolicy();c.weights={build:1,haul:1,gather:0,field:0,factory:0,research:0,survey:0};
 s.resources={food:75,wood:80,scrap:157,ore:12,alloy:16,knowledge:0};g.freightInit();
 ok(w.QA.storedTotal()===w.QA.storageCapacity(),'full warehouse fixture reaches capacity exactly');
 const before=totals();ok(g.buildAt('shed',30,30),'fund another store at full capacity');
 let shed=s.buildings.find(b=>b.type==='shed');
 ok(s.piles.some(q=>q.site===shed.id),'construction costs become physical reserved lots');
 ok(run(()=>shed.finished),'full-store construction recovers through hauling');
 const after=totals();ok(after.wood===before.wood-16&&after.scrap===before.scrap-12,'finished shed consumes exactly its construction cost');
 const cache=s.buildings.find(b=>b.type==='supplies');
 cache.reject=['ore'];shed.reject=['ore'];
 const pile={id:'ore-qa',x:24,y:28,kind:'ore',amount:6};s.piles.push(pile);
 run(()=>false,120);
 ok(s.piles.includes(pile),'closed filters stop unwanted ore transfer');
 shed.reject=[];shed.priority=1;
 ok(run(()=>!s.piles.includes(pile)&&!s.colonists.some(p=>p.carry)),'accepted preferred store receives ore');
 ok((shed.stock.ore||0)>=6,'delivery is accounted at the selected store');
 const conserved=totals();w.QA.reserveOutside('wood',10);
 ok(totals().wood===conserved.wood,'emergency reserve conserves wood');
 const reserved=s.piles.find(q=>q.hold);ok(!!reserved,'reserve is held outdoors');
 w.QA.releaseReserve(reserved.id);ok(!reserved.hold,'explicit release enables hauling');
 const beforeEdit=totals();g.editorOrder(shed,'demolish');g.save();g.load();
 const restored=g.state;let remaining=()=>restored.buildings.some(b=>b.id===shed.id);
 ok(run(()=>!remaining()),'dismantling an occupied store survives reload');
 // Resource count uses the restored state after loading.
 const amount=(k)=>(restored.resources[k]||0)+restored.piles.filter(q=>q.kind===k).reduce((n,q)=>n+q.amount,0)+restored.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0);
 ok(amount('ore')===beforeEdit.ore,'store evacuation conserves ore across reload and dismantling');
 ok(amount('wood')===beforeEdit.wood+8,'half timber salvage appears once after dismantling');
 const p=restored.colonists[0];p.workWeights={build:0,haul:0,gather:0,field:0,factory:0,research:0,survey:0};p.task=null;p.path=[];p.energy=95;p.hunger=0;
 g.tick(.1);ok(p.task===null,'disabled personal priorities prevent unrelated job acquisition');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
