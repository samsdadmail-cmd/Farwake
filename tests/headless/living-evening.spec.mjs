import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
async function evening(page){
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/index.html');
 await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;s.minute=1093;
  for(const k of Object.keys(g.industryPolicy().weights))g.industryPolicy().weights[k]=0;
  for(const p of s.colonists)Object.assign(p,{energy:95,hunger:5,task:null,path:[],carry:null});
 });
}
async function run(page,seconds){await page.evaluate(seconds=>{for(let i=0;i<seconds*10;i++)FARWAKE_TEST.tick(.1)},seconds)}
test('founders choose visible evenings and a completed meeting creates reciprocal history',async({page},info)=>{
 await evening(page);
 await run(page,7);
 const live=await page.evaluate(()=>{const g=FARWAKE_TEST;g.advanceWorld(.1);g.draw(1000);return g.state.colonists.map(p=>({name:p.name,task:p.task,view:g.lifeView(p),life:p.life}))});
 console.log('EVENING_CHOICES '+JSON.stringify(live));
 expect(live.filter(p=>p.task?.type==='life_share')).toHaveLength(2);
 expect(live.filter(p=>p.task?.type==='life_quiet').map(p=>p.life.interest).sort()).toEqual(['plants','sky','tinkering']);
 await page.screenshot({path:info.outputPath('evening-portrait.png')});
 await run(page,34);
 const result=await page.evaluate(()=>{const g=FARWAKE_TEST;return {people:g.state.colonists.map(p=>({id:p.id,life:p.life})),sessions:g.lifeRoot().sessions}});
 const social=result.people.filter(p=>p.life.bonds.length);
 expect(social).toHaveLength(2);expect(result.sessions).toEqual([]);
 for(const p of social){expect(p.life.bonds[0].shared).toBe(1);expect(p.life.memories[0].kind).toBe('shared');expect(p.life.places[0].fondness).toBe(1)}
 expect(result.people.every(p=>p.life.doneDay===1)).toBe(true);
 // No repeated reward from the same evening, including after a real save/reload.
 await page.evaluate(()=>FARWAKE_TEST.save());await page.reload();await run(page,10);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.filter(p=>p.life?.bonds.length).map(p=>p.life.bonds[0].shared))).toEqual([1,1]);
 await page.evaluate(()=>{FARWAKE_TEST.state.minute=1201;for(const p of FARWAKE_TEST.state.colonists){p.task=null;p.path=[]}});
 await run(page,20);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>p.task?.type==='rest'&&p.visit?.stage==='inside'&&p.visit.building===p.home))).toBe(true);
});
test('an invitation alone never creates a friendship; hunger interrupts without rewards',async({page})=>{
 await evening(page);await run(page,1);
 await page.evaluate(()=>{const g=FARWAKE_TEST,s=g.lifeRoot().sessions[0];if(!s)throw Error('No actual invitation');const p=g.state.colonists.find(p=>p.id===s.people[1]);p.hunger=95;p.task=null;p.path=[]});
 await run(page,2);
 expect(await page.evaluate(()=>FARWAKE_TEST.lifeRoot().sessions.length)).toBe(0);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>!p.life.bonds.length))).toBe(true);
});
test('removing a venue releases both reservations; occupied homes respond to rain',async({page})=>{
 await evening(page);await run(page,1);
 await page.evaluate(()=>{const g=FARWAKE_TEST,s=g.lifeRoot().sessions[0];if(!s)throw Error('No invitation');window.qaVenue=g.state.buildings.find(b=>b.id===s.building);g.state.buildings=g.state.buildings.filter(b=>b.id!==s.building)});
 await run(page,1);
 expect(await page.evaluate(()=>FARWAKE_TEST.lifeRoot().sessions.length)).toBe(0);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>!p.life.session))).toBe(true);
 // Undo the isolated venue fixture, then let weather trigger real door entry.
 await page.evaluate(()=>{const g=FARWAKE_TEST;g.state.buildings.push(window.qaVenue);g.state.weather='rain';for(const p of g.state.colonists){p.task=null;p.path=[];p.life.retryAt=0}});
 await run(page,10);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.filter(p=>p.task?.type==='life_home'&&p.visit?.stage==='inside').length)).toBeGreaterThan(0);
});
test('reloading during an unfinished meeting cancels safely and cannot duplicate its outcome',async({page})=>{
 await evening(page);await run(page,7);
 expect(await page.evaluate(()=>FARWAKE_TEST.lifeRoot().sessions.some(s=>s.started&&s.progress<20))).toBe(true);
 await page.evaluate(()=>FARWAKE_TEST.save());await page.reload();
 expect(await page.evaluate(()=>FARWAKE_TEST.lifeRoot().sessions)).toEqual([]);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>!p.life.session&&!p.life.bonds.length))).toBe(true);
 await run(page,45);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.filter(p=>p.life.bonds.length).every(p=>p.life.bonds[0].shared===1))).toBe(true);
});
test('migration keeps exact original download and refuses to upgrade without recovery space',async({page})=>{
 const manifest=JSON.parse(readFileSync('tests/fixtures/saves/manifest.json'));
 const raw=readFileSync('tests/fixtures/saves/'+manifest.fixtures.mid.file,'utf8').trim(),key=manifest.storageKey;
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/manifest.webmanifest');
 await page.evaluate(({raw,key})=>localStorage.setItem(key,raw),{raw,key});await page.goto('/index.html');
 const recovery=await page.evaluate(()=>FARWAKE_TEST.state.migration.recoveryKey);
 expect(await page.evaluate(k=>localStorage.getItem(k),recovery)).toBe(raw);
 await page.click('#menu');await page.click('[data-open="operations"]');
 const download=page.waitForEvent('download');await page.click('[data-life-recovery]');
 const d=await download;expect(readFileSync(await d.path(),'utf8')).toBe(raw);
 await page.goto('/manifest.webmanifest');
 await page.evaluate(({raw,key,recovery})=>{localStorage.removeItem(recovery);localStorage.setItem(key,raw)},{raw,key,recovery});
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.includes('_before_v4_'))throw Error('QA quota full');return original.call(this,k,v)}});
 await page.goto('/index.html');expect(await page.evaluate(()=>FARWAKE_TEST.state)).toBeNull();
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);
 await expect(page.locator('#sheet')).toContainText('Expedition needs recovery');
});

test('an untouched founding colony reaches a real evening without sacrificing its work',async({page})=>{
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/index.html');
 await run(page,260);
 const result=await page.evaluate(()=>{const g=FARWAKE_TEST;return {minute:g.state.minute,people:g.state.colonists.map(p=>({name:p.name,energy:p.energy,hunger:p.hunger,life:p.life})),harvested:g.state.harvested.length,produced:g.state.freightFlow.produced}});
 console.log('ORGANIC_FIRST_EVENING '+JSON.stringify(result));
 expect(result.minute).toBeGreaterThan(1200);
 expect(result.people.filter(p=>p.life.memories.length).length).toBeGreaterThanOrEqual(3);
 expect(result.harvested).toBeGreaterThan(0);
 expect(result.people.every(p=>p.hunger<100&&p.energy>0)).toBe(true);
});

test('dialogue visibility and presentation rate do not change an evening',async({browser})=>{
 const results=[];
 for(const mode of ['off','lively']){
  const context=await browser.newContext(),page=await context.newPage();await evening(page);
  results.push(await page.evaluate(mode=>{
   const g=FARWAKE_TEST;g.settings.dialogue=mode;
   for(let i=0;i<450;i++){g.tick(.1);if(mode==='lively'&&i%3===0)g.advanceWorld(.3)}
   return {life:g.state.life,people:g.state.colonists.map(p=>p.life)};
  },mode));await context.close();
 }
 expect(results[1]).toEqual(results[0]);
});

test('rainy indoor leisure resumes real occupancy without duplicate memories',async({page})=>{
 await evening(page);await page.evaluate(()=>FARWAKE_TEST.state.weather='rain');await run(page,8);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>p.task?.type==='life_home'&&p.visit?.stage==='inside'))).toBe(true);
 await page.evaluate(()=>FARWAKE_TEST.save());await page.reload();
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>p.task?.type==='life_home'&&p.visit?.stage==='inside'))).toBe(true);
 await run(page,35);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.colonists.every(p=>p.life.memories.filter(m=>m.kind==='home').length===1))).toBe(true);
});

for(const viewport of [{width:390,height:844},{width:844,height:390},{width:375,height:667}])test(`evening profile and world remain touch-readable at ${viewport.width}x${viewport.height}`,async({page},info)=>{
 await page.setViewportSize(viewport);await evening(page);await run(page,7);
 await page.evaluate(()=>{const g=FARWAKE_TEST,p=g.state.colonists[0];g.advanceWorld(.2);const pose=FarwakePeople.pose(p);g.camera.x=pose.x*32;g.camera.y=pose.y*32;g.draw(performance.now())});
 const box=await page.locator('#world').boundingBox();await page.locator('#world').tap({position:{x:box.width/2,y:box.height/2}});
 await page.screenshot({path:info.outputPath('selected-'+viewport.width+'.png')});
 await page.locator('[data-inspect="profile"]').click({timeout:5000});
 await expect(page.locator('.life-profile')).toContainText('Sharing an evening');
 await page.locator('.life-profile summary').click();await expect(page.locator('.life-profile details')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('profile-'+viewport.width+'.png')});
 await page.locator('#sheet [data-sheet="close"]').click();
 await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));
 await page.screenshot({path:info.outputPath('world-'+viewport.width+'.png')});
});

test('completed experiences create a bounded, behavioural preference for a real place',async({page})=>{
 await evening(page);await run(page,45);
 const result=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state,p=s.colonists.find(p=>p.role==='Surveyor'),camp=s.buildings.find(b=>b.type==='camp');
  if(!p.life.places.some(q=>q.building===camp.id))throw Error('No actual completed evening to remember');
  // A second venue and a position equidistant to its edge isolate the choice.
  s.buildings.push({...camp,id:990,x:32,history:{}});s.day=2;s.minute=1093;
  Object.assign(p,{x:30.6,y:32.5,home:null,task:null,path:[],energy:95,hunger:5});
  p.life.retryAt=0;const attached=g.lifeTarget(p)?.id;
  p.task=null;p.path=[];const places=p.life.places;p.life.places=[];
  const without=g.lifeTarget(p)?.id;p.life.places=places;
  return {attached,without,camp:camp.id};
 });
 expect(result.attached).toBe(result.camp);expect(result.without).toBe(990);
});

test('repeated genuine meetings build familiarity once per day and keep memories bounded',async({page})=>{
 await evening(page);
 for(let day=1;day<=4;day++){
  if(day>1)await page.evaluate(day=>{const s=FARWAKE_TEST.state;s.day=day;s.minute=1093;for(const p of s.colonists)Object.assign(p,{energy:95,hunger:5,task:null,path:[]})},day);
  await run(page,45);
 }
 const result=await page.evaluate(()=>FARWAKE_TEST.state.colonists.map(p=>p.life));
 expect(result.filter(p=>p.bonds.length).every(p=>p.bonds[0].shared===4)).toBe(true);
 expect(result.every(p=>p.memories.length<=8&&p.places.length<=4&&p.bonds.length<=8)).toBe(true);
 expect(result.filter(p=>p.bonds.length).every(p=>p.memories[0].count===4)).toBe(true);
});

test('forty distinct settlers cannot inherit another person’s meeting reservation',async({page})=>{
 await evening(page);await run(page,2);
 await page.evaluate(()=>{
  const s=FARWAKE_TEST.state,founders=s.colonists.slice();
  s.colonists=Array.from({length:40},(_,i)=>({...founders[i%5],id:200+i,x:25.5+i%6,y:29.5+Math.floor(i/6),visit:null,task:null,path:[],carry:null}));
 });
 await run(page,3);
 const reserved=await page.evaluate(()=>FARWAKE_TEST.lifeRoot().sessions.flatMap(s=>s.points.map(q=>q.x+','+q.y)));
 expect(new Set(reserved).size).toBe(reserved.length);
 await run(page,42);
 const result=await page.evaluate(()=>({people:FARWAKE_TEST.state.colonists.map(p=>({id:p.id,life:p.life})),sessions:FARWAKE_TEST.lifeRoot().sessions}));
 expect(new Set(result.people.map(p=>p.life.owner)).size).toBe(40);
 expect(result.people.some(p=>p.life.memories.length)).toBe(true);
 expect(result.people.every(p=>p.life.bonds.every(b=>b.person>=200))).toBe(true);
 for(const session of result.sessions)expect(session.people.every(id=>result.people.some(p=>p.id===id))).toBe(true);
});

test('malformed v4 life data opens recovery and leaves the original untouched',async({page})=>{
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/index.html');
 const raw=await page.evaluate(()=>{const g=FARWAKE_TEST,s=JSON.parse(JSON.stringify(g.state));s.life={version:1,time:0,serial:0,sessions:{bad:true}};return JSON.stringify(s)});
 await page.goto('/manifest.webmanifest');
 await page.evaluate(raw=>localStorage.setItem('farwake_founders_alpha03_v1',raw),raw);await page.goto('/index.html');
 expect(await page.evaluate(()=>FARWAKE_TEST.state)).toBeNull();
 await expect(page.locator('#sheet')).toContainText('Expedition needs recovery');
 expect(await page.evaluate(()=>localStorage.getItem('farwake_founders_alpha03_v1'))).toBe(raw);
});

test('an assigned expedition outpost supports real indoor home leisure and reload',async({page})=>{
 await evening(page);
 const id=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;let outpost;
  for(let y=30;y<42&&!outpost;y++)for(let x=20;x<40&&!outpost;x++)if(g.clearFootprint(x,y,3,2)&&!g.frontierPlacementReason('outpost',x,y))outpost={id:991,type:'outpost',x,y,w:3,h:2,finished:true,progress:100};
  if(!outpost)throw Error('No reachable outpost home fixture');s.buildings.push(outpost);
  if(!g.housingAssign(s.colonists[0].id,outpost.id))throw Error('Actual outpost bed assignment failed');s.weather='rain';return outpost.id;
 });
 await run(page,12);
 expect(await page.evaluate(id=>{const p=FARWAKE_TEST.state.colonists[0];return p.task?.type==='life_home'&&p.visit?.stage==='inside'&&p.visit.building===id},id)).toBe(true);
 await page.evaluate(()=>FARWAKE_TEST.save());await page.reload();
 expect(await page.evaluate(id=>FarwakeDoors.occupants(FARWAKE_TEST.state,FARWAKE_TEST.state.buildings.find(b=>b.id===id)).some(p=>p.id===1),id)).toBe(true);
});
