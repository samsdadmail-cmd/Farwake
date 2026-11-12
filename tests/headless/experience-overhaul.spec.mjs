import {test,expect} from '@playwright/test';
test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
test('world fills the display and the new context drawer preserves usable world space',async({page})=>{
 await page.goto('/index.html');
 const world=await page.locator('#world').boundingBox();expect(world.height).toBeGreaterThan(830);
 await page.locator('[data-nav="crew"]').click();
 await expect(page.locator('.drawer-nav')).toBeVisible();
 await page.locator('#sheet [data-action="crew"]').first().click();
 await expect(page.locator('.person-hero canvas')).toBeVisible();
 await expect(page.locator('[data-person-activity]')).not.toBeEmpty();
 await expect(page.locator('.need-line')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('shared scenes pass through acknowledgement, activity and goodbye before reciprocal rewards',async({page})=>{
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 await page.evaluate(()=>{const g=FARWAKE_TEST,s=g.state;s.minute=1093;for(const k of Object.keys(g.industryPolicy().weights))g.industryPolicy().weights[k]=0;for(const p of s.colonists)Object.assign(p,{task:null,path:[],carry:null,energy:95,hunger:5})});
 const result=await page.evaluate(()=>{const g=FARWAKE_TEST,phases=new Set(),kinds=new Set();let premature=false;for(let i=0;i<410;i++){g.tick(.1);for(const p of g.state.colonists){const v=g.lifeView(p);if(v){phases.add(v.phase);kinds.add(v.kind)}}for(const s of g.lifeRoot().sessions)if(s.progress<32&&s.people.some(id=>g.lifePerson(g.state.colonists.find(p=>p.id===id)).bonds.length))premature=true}return{phases:[...phases],kinds:[...kinds],premature,shared:g.state.colonists.filter(p=>p.life.bonds.length).length}});
 expect(result.premature).toBe(false);expect(result.phases).toEqual(expect.arrayContaining(['greeting','sharing','goodbye']));expect(result.kinds.length).toBeGreaterThanOrEqual(3);expect(result.shared).toBe(2);
});
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:375,height:667}])test('save and context controls stay reachable at '+viewport.width+'x'+viewport.height,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/index.html');await page.locator('[data-field-open="operations"]').click();
 await expect(page.locator('[data-sheet="export-save"]')).toBeVisible();
 await expect(page.locator('[data-diagnostics-export]')).toBeVisible();
 const sheet=await page.locator('#sheet').boundingBox();expect(sheet.x).toBeGreaterThanOrEqual(0);expect(sheet.y).toBeGreaterThanOrEqual(0);expect(sheet.x+sheet.width).toBeLessThanOrEqual(viewport.width+1);
});

test('staggered founders can accept a willing invitation before choosing solitary home time',async({page})=>{
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const result=await page.evaluate(()=>{const g=FARWAKE_TEST,s=g.state;s.minute=1045;for(const k of Object.keys(g.industryPolicy().weights))g.industryPolicy().weights[k]=0;for(const p of s.colonists)Object.assign(p,{task:null,path:[],carry:null,energy:95,hunger:5});const starts=[];let previous=0;for(let i=0;i<550;i++){g.tick(.1);const sessions=g.lifeRoot().sessions.length;if(sessions&&!previous)starts.push(s.minute);previous=sessions}return{starts,shared:s.colonists.filter(p=>p.life?.bonds.length).length}});
 expect(result.starts.length).toBeGreaterThan(0);expect(result.shared).toBe(2);
});

test('explicit personal standby blocks and interrupts optional daytime pauses',async({page})=>{
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const result=await page.evaluate(()=>{const g=FARWAKE_TEST,s=g.state,p=s.colonists[0];s.minute=720;for(const k of Object.keys(g.industryPolicy().weights))g.industryPolicy().weights[k]=0;Object.assign(p,{task:null,path:[],carry:null,energy:95,hunger:0,work:'auto',workWeights:{build:0,haul:0,gather:0,field:0,factory:0,research:0,survey:0}});g.tick(.1);const blocked=p.task===null;p.workWeights.build=1;g.tick(.1);const paused=p.task?.type==='idle_pause';p.workWeights.build=0;g.tick(.6);return{blocked,paused,interrupted:p.task===null,noReward:!p.life.memories.length}});
 expect(result).toEqual({blocked:true,paused:true,interrupted:true,noReward:true});
});
