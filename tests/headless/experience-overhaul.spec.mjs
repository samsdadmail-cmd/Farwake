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

test('Build first interrupts an attended evening without rewards and respects disabled work lanes',async({page})=>{
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const result=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;s.minute=1093;for(const k of Object.keys(g.industryPolicy().weights))g.industryPolicy().weights[k]=0;
  for(const p of s.colonists)Object.assign(p,{task:null,path:[],carry:null,energy:95,hunger:5});
  for(let i=0;i<70;i++)g.tick(.1);
  const meeting=g.lifeRoot().sessions[0];if(!meeting?.started)throw Error('No genuinely attended meeting');
  const pair=meeting.people.map(id=>s.colonists.find(p=>p.id===id));
  // Retain an explicitly disabled founder as a guard against overriding policy.
  const standby=s.colonists.find(p=>!meeting.people.includes(p.id));standby.workWeights={build:0,haul:0,gather:0,field:0,factory:0,research:0,survey:0};
  let site;for(let y=32;y<40&&!site;y++)for(let x=20;x<38&&!site;x++)if(g.clearFootprint(x,y,3,2)&&!g.frontierPlacementReason('shelter',x,y)&&g.buildAt('shelter',x,y))site=s.buildings.at(-1);
  if(!site)throw Error('No funded reachable construction site');site.buildPriority=true;g.industryPolicy().weights.build=1;g.industryPolicy().weights.haul=1;
  for(let i=0;i<20;i++)g.tick(.1);
  return{canceled:!g.lifeRoot().sessions.length,noReward:pair.every(p=>!p.life.bonds.length&&!p.life.memories.length),released:pair.every(p=>!p.task?.type?.startsWith('life_')),working:s.colonists.some(p=>['build','haul_pickup','haul_dropoff'].includes(p.task?.type)),standby:!['build','haul_pickup','haul_dropoff'].includes(standby.task?.type)};
 });
 expect(result).toEqual({canceled:true,noReward:true,released:true,working:true,standby:true});
});

test('completed evenings wind down in real homes without repeating rewards or briefly restarting work',async({page})=>{
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const result=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;s.minute=1093;
  for(const p of s.colonists)Object.assign(p,{task:null,path:[],carry:null,energy:95,hunger:5});
  let returnedToWork=false,homeSeen=false;const counts=new Map();
  for(let i=0;i<750;i++){
   g.tick(.1);
   for(const p of s.colonists)if(p.life.doneDay===s.day){
    if(['research','survey','craft','farm','idle_pause'].includes(p.task?.type))returnedToWork=true;
    if(p.task?.afterLeisure&&p.visit?.stage==='inside')homeSeen=true;
    const n=p.life.memories.reduce((a,m)=>a+m.count,0);if(!counts.has(p.id))counts.set(p.id,n);else if(counts.get(p.id)!==n)throw Error('Repeated leisure reward');
   }
  }
  return{returnedToWork,homeSeen,rewarded:counts.size,asleep:s.colonists.every(p=>p.task?.type==='rest')};
 });
 expect(result).toEqual({returnedToWork:false,homeSeen:true,rewarded:5,asleep:true});
});

test('mobile discoveries explain locked requirements and retain the optional connected map',async({page})=>{
 await page.goto('/index.html');await page.locator('[data-nav="research"]').click();
 await expect(page.locator('.discovery-node')).toHaveCount(26);
 await expect(page.locator('.research-intro')).toContainText('study and exploration');
 await page.locator('[data-tech-filter="homes"]').click();await expect(page.locator('.discovery-node')).toHaveCount(2);
 await page.locator('.discovery-node[data-tech-detail="cabins"]').click();
 await expect(page.locator('.tech-prerequisites button')).toContainText('Structural timber');
 const clock=await page.locator('#clock').textContent();await expect(page.locator('#clock')).not.toHaveText(clock);
 await expect(page.locator('.tech-prerequisites button')).not.toHaveClass(/tech-node/);
 await page.locator('[data-open="research"]').click();await page.locator('[data-tech-view="map"]').click();
 expect(await page.locator('.tech-links path').count()).toBeGreaterThan(15);
});
