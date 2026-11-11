// Run on a disposable origin only; this exercise changes and reloads the expedition.
async function verifyLiving(frame) {
  let w=frame.contentWindow, g=w.FARWAKE_TEST, s=g.state;
  const checks=[];
  const expect=(condition,label)=>{if(!condition)throw Error(label);checks.push(label)};
  const run=(seconds,until,inspect=()=>{})=>{
    for(let i=0;i<Math.ceil(seconds*30);i++){g.tick(1/30); inspect(); if(until())return true}
    return false;
  };
  const reload=async()=>{
    g.save();const loaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
    w.location.reload();await loaded;w=frame.contentWindow;g=w.FARWAKE_TEST;s=g.state;
  };
  for(const speed of [1,2,4]){
    const ends=[];
    for(const hz of [30,60,120]){
      const person={x:0,y:0,path:[{x:20,y:0}],id:1},before=w.FarwakePeople.pose(person);
      for(let i=0;i<hz;i++){person.x+=speed/hz;w.FarwakePeople.advance(person,1/hz,false,speed)}
      ends.push(before.x);
      expect(before.dir==='right'&&before.x>speed*.90&&before.x<=person.x,'gait tracks distance at '+speed+'× / '+hz+' Hz');
      const old=before.phase;w.FarwakePeople.advance(person,1,true,speed);
      if(old!==before.phase)throw Error('paused gait advanced');
    }
    expect(Math.max(...ends)-Math.min(...ends)<.065,'equivalent end positions at '+speed+'×');
  }
  const campId=s.buildings.find(b=>b.type==='camp').id;
  const camp=()=>s.buildings.find(b=>b.id===campId);
  const occupants=()=>w.FarwakeDoors.occupants(s,camp());
  const port=w.FarwakeDoors.portalFor(camp());
  s.minute=1320;
  for(const [i,p] of s.colonists.entries()){
    Object.assign(p,{x:port.streetX+(i%2)*.1,y:port.streetY+1,home:campId,task:null,path:[],energy:18,hunger:8,carry:null});
    delete p.visit;
  }
  let opened=false;
  expect(run(24,()=>occupants().length>=2,()=>{opened ||= w.FarwakeDoors.state(camp()).openness>.1}),'two founders enter the same camp');
  expect(opened,'shared door opened on approach');
  expect(run(6,()=>occupants().length===s.colonists.length&&w.FarwakeDoors.state(camp()).openness<.01),'door closes behind the group');
  expect(occupants().every(p=>p.task.type==='rest'&&w.FarwakeDoors.visible(p)===0),'occupancy corresponds to real resting jobs');
  await reload();
  expect(occupants().length>=2,'resting occupants survive reload');
  s.minute=600;
  for(const p of s.colonists)p.energy=95;
  expect(run(36,()=>s.colonists.every(p=>p.visit?.building!==campId)),'occupants leave their sleeping quarters');
  w.FarwakeMoments.update(s,60,{mode:'lively'});
  expect(!!w.FarwakeMoments.active&&s.colonists.some(p=>p.moments?.length),'one active speech bubble with journal entry');
  w.FarwakeMoments.update(s,1,{mode:'off'});
  expect(w.FarwakeMoments.active===null,'turning dialogue off clears the bubble');
  const engineer=s.colonists.find(p=>p.role==='Engineer');
  let shop=s.buildings.find(b=>b.type==='workshop'&&b.finished);
  if(!shop){
    let space;
    for(let y=23;y<35&&!space;y++)for(let x=23;x<34;x++){
      if(g.clearFootprint(x,y,3,3)){space={x,y};break}
    }
    if(!space)throw Error('fixture requires workshop space');
    shop={...space,type:'workshop',id:9999,w:3,h:2,progress:100,finished:true};s.buildings.push(shop);
  }
  s.minute=600;s.resources.ore=12;s.resources.scrap=140;s.resources.alloy=10;
  g.freightInit(); // Reconcile the fixture's legacy totals with real store accounts.
  Object.assign(engineer,{work:'engineer',energy:95,hunger:5,task:null,path:[],carry:null});delete engineer.visit;
  const workshopPort=w.FarwakeDoors.portalFor(shop);
  engineer.x=workshopPort.streetX;engineer.y=workshopPort.streetY;
  expect(run(50,()=>w.FarwakeDoors.occupants(s,shop).some(p=>p.id===engineer.id&&p.task.type==='craft')),'engineer enters the workshop on a craft job');
  const production=g.productionRecord(shop),beforeOutput=production.output;
  const ownedAlloy=()=>s.resources.alloy+s.piles.filter(q=>q.kind==='alloy').reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind==='alloy'?p.carry.amount:0),0);
  const beforeAlloy=ownedAlloy();
  expect(run(16,()=>production.output>beforeOutput&&ownedAlloy()>beforeAlloy),'occupied workshop produces physical alloy before storage delivery');
  const sender=s.colonists.find(p=>p.id!==engineer.id);
  Object.assign(sender,{x:24.5,y:29.5,task:null,path:[],carry:{kind:'ore',amount:3}});delete sender.visit;
  g.tick(.08);
  await reload();
  expect(s.colonists.some(p=>p.id===sender.id&&p.carry?.amount===3),'carried material survives a mid-route reload');
  const settings=w.FieldPreferences;
  const oldPreset=settings.values.preset;
  for(const preset of ['cinematic','balanced','performance']){
    settings.change('preset',preset);
    for(const weather of ['wind','rain','clear']){
      s.weather=weather;
      for(const minute of [325,480,1050,1210]){s.minute=minute;g.draw(1000+minute);}
    }
    checks.push(preset+' draws dawn, day, sunset and night in three weather states');
  }
  settings.change('preset',oldPreset);
  const baseline=s.colonists.slice();
  for(const count of [5,20,40]){
    s.colonists=Array.from({length:count},(_,i)=>({...baseline[i%baseline.length],id:i+200,x:26+i%7*.6,y:28+Math.floor(i/7)*.5,visit:null,task:null,path:[]}));
    for(let i=0;i<3;i++)g.draw(1000+i*16);
    const duration=[];
    for(let i=0;i<12;i++){
      const time=performance.now();g.tick(1/60);g.draw(2000+i*16);duration.push(performance.now()-time);
    }
    duration.sort((a,b)=>a-b);
    checks.push(count+' colonists: median tick + canvas submission '+duration[6].toFixed(2)+' ms (12 warm samples)');
  }
  s.colonists=baseline;g.save();
  return checks;
}
