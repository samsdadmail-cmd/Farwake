import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
async function evening(page){
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/index.html');
 await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;s.minute=1051;
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
