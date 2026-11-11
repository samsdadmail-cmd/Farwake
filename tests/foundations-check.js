// Isolated runner with an authentic preceding-release backup and a manually driven clock.
async function verifyFoundations(frame, out) {
  const result=[], slot='fc-'+Date.now(), key='farwake_qa_'+slot;
  const report=(s)=>{ result.push(s);out.textContent=result.join('\n'); };
  const assert=(v,s)=>{if(!v)throw Error(s);report('PASS '+s)};
  const navigate=async version=>{
    const done=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
    frame.src=version+'/index.html?slot='+slot;
    await done;
    return frame.contentWindow;
  };
  const waitLoad=()=>new Promise((resolve,reject)=>{
    const fail=setTimeout(()=>reject(Error('Import did not reload the candidate')),8000);
    frame.addEventListener('load',()=>{clearTimeout(fail);resolve()},{once:true});
  });
  const goods=['food','ore','wood','alloy','scrap'];
  function balance(s){
    return goods.map(k=>(s.resources[k]||0)+s.piles.filter(p=>p.kind===k).reduce((n,p)=>n+p.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0)).join(':');
  }
  try {
    let w=await navigate('living'), g=w.FARWAKE_TEST, qa=w.QA, s=g.state;
    const input=s.colonists[0];
    s.day=37;
    if(!g.buildAt('shed',30,30))throw Error('Unable to prepare unfinished legacy shed');
    const site=s.buildings.find(b=>b.type==='shed');
    site.progress=1.5;
    s.resources.food=100;s.resources.wood=84;s.resources.ore=12;s.resources.alloy=20;s.resources.scrap=124;
    input.carry={kind:'wood',amount:3};
    s.piles.push({id:'reserve-fixture',kind:'ore',amount:7,x:24,y:28,hold:true});
    const originalBalance=balance(s);
    let blob;
    w.URL.createObjectURL=b=>{blob=b;return 'blob:qa'};
    w.HTMLAnchorElement.prototype.click=function(){};
    qa.exportExpedition();
    if(!blob)throw Error('Living World failed to export');
    const exported=await blob.text();
    assert(JSON.parse(exported).save.day===37,'actual Living World export contains the staged colony');
    // Keep old pagehide effects inside its dedicated key; create a different target colony.
    w=await navigate('candidate');w.QA.initial('qa-replacement');
    w.confirm=()=>true;
    const reload=waitLoad();
    await w.QA.importExpeditionFile(new w.File([exported],'FARWAKE-test.json',{type:'application/json'}));
    await reload;
    w=frame.contentWindow;qa=w.QA;g=w.FARWAKE_TEST;s=g.state;
    assert(s.day===37 && s.seed==='FW-10402','candidate import replaces a different colony and survives reload');
    assert(balance(s)===originalBalance,'full stores, outdoor reserve and carried units survive import');
    assert(s.piles.some(p=>p.hold && p.amount===7) && s.buildings.some(b=>b.type==='shed'&&!b.finished&&b.progress===1.5),'held pile and unfinished paid blueprint survive migration');
    let backups=Object.keys(w.localStorage).filter(k=>k.startsWith(key+'_before_import_'));
    assert(backups.some(k=>JSON.parse(w.localStorage.getItem(k)).seed==='qa-replacement'),'replaced colony retained as recovery backup');
    let oldBuilds=s.buildings.length;
    assert(g.buildAt('path',25,30) && s.buildings.length===oldBuilds+1,'full storage does not prevent funded construction');
    const beforeReserve=balance(s);
    qa.reserveOutside('scrap',10);
    assert(balance(s)===beforeReserve,'moving ten units into an outdoor reserve conserves materials');
    qa.releaseReserve('reserve-fixture');
    assert(s.piles.some(p=>p.id==='reserve-fixture'&&!p.hold),'release changes hauling eligibility');
    for(const type of ['supplies','solar','garden','path','battery','comms','ore','stockpile']){
      if(w.FarwakeDoors.portalFor({type,id:17,x:10,y:10,w:2,h:2}))throw Error(type+' has a door');
    }
    assert(['shelter','camp','shed','lander','workshop','clinic'].every(type=>w.FarwakeDoors.portalFor({type,id:17,x:10,y:10,w:3,h:2})),'all indoor types have portals; all exterior types lack them');
    let tested=0;
    for(const seed of ['FW-10402','Frontier-08','North-Quarry','Fen-16','Woods-44']){
      qa.initial(seed);s=g.state;
      const near=()=>g.features.filter(f=>f.type==='ore'&&Math.hypot(f.x-28,f.y-28)<=19);
      const ids=near().map(f=>f.id).sort();
      if(!ids.length)throw Error('No starter ore: '+seed);
      qa.save();qa.load();
      if(near().map(f=>f.id).sort().join()!==ids.join())throw Error('Ore changed on reload: '+seed);
      s=g.state;s.harvested.push(ids[0]);qa.save();qa.load();
      if(near().some(f=>f.id===ids[0]))throw Error('Harvested ore returned: '+seed);
      tested++;
    }
    assert(tested===5,'five seeds retain ore across reloads and mined deposits stay exhausted');
    qa.initial('FW-10402');
    const known=qa.fog.filter(Boolean).length;
    qa.prioritizeExploration();
    const scout=g.state.colonists.find(p=>p.role==='Surveyor');
    assert(scout.work==='survey' && scout.task?.type==='survey','prioritize exploration dispatches the Surveyor');
    for(let j=0;j<2000 && qa.fog.filter(Boolean).length===known;j++)g.tick(.1);
    assert(qa.fog.filter(Boolean).length>known,'Surveyor reaches a frontier and reveals land');
    const ore=g.features.find(f=>f.type==='ore');
    qa.fog[ore.y*56+ore.x]=true;qa.focusDiscoveredOre();
    assert(g.features.some(f=>f.type==='ore'&&qa.fog[f.y*56+f.x]&&Math.hypot(g.camera.x/32-f.x-.5,g.camera.y/32-f.y-.5)<.1),'ore focus points to a real discovered deposit');
    report('COMPLETE');
  } catch(error){report('FAILED '+error.stack)}
}
