import {test,expect} from '@playwright/test';
import {writeFile,readFile} from 'node:fs/promises';
test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});
async function colony(page){
 page.setDefaultTimeout(12000);
 await page.goto('/index.html?review=1');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FarwakeEnvironment.ready());await page.locator('#pause').click();
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
}
test('E3-C actual saved neighbourhood day dusk night and material-light close view',async({page},info)=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 const read=()=>{const g=FARWAKE_TEST;return{day:g.state.day,minute:g.state.minute,weather:g.state.weather,camera:{...g.camera},grid:g.surveyGrid(),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics(),attendance:g.state.colonists.filter(p=>p.visit?.stage==='inside').map(p=>({id:p.id,name:p.name,task:p.task,action:p.action,visit:p.visit}))}};
 const before=await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}));
 for(let i=0;i<5;i++)await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));
 expect(await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}))).toBe(before);
 await page.screenshot({path:info.outputPath('e3-c-day-390.png')});const day=await page.evaluate(read);
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:780,y:1040,z:1.6});FARWAKE_TEST.draw(performance.now())});await page.screenshot({path:info.outputPath('e3-c-day-close-390.png')});
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
 const dusk=await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.minute>=1080){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return{day:g.state.day,minute:g.state.minute}}}throw Error('Dusk not reached')});
 await page.screenshot({path:info.outputPath('e3-c-dusk-390.png')});const duskState=await page.evaluate(read);
 const settlingFound=await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute<=1150||g.state.minute>=1275)continue;FarwakeNeighbourhood.prepare(g.state,g.surveyGrid());const homes=FarwakeArchitecture.diagnostics().buildings.filter(b=>['shelter','cabin'].includes(b.type));if(homes.filter(b=>b.occupied>0&&b.powered).length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return homes.some(b=>b.mode==='settling')}}throw Error('Two real occupied homes not reached')});
 const settling=await page.evaluate(read);if(settlingFound)await page.screenshot({path:info.outputPath('e3-c-settling-390.png')});
 await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute<=1150||g.state.minute>=1275)continue;const grid=g.surveyGrid();FarwakeNeighbourhood.prepare(g.state,grid);if(grid.supply>=grid.used&&FarwakeArchitecture.diagnostics().buildings.filter(b=>['shelter','cabin'].includes(b.type)&&b.mode==='awake').length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return}}throw Error('Genuinely inhabited night not reached')});
 await page.screenshot({path:info.outputPath('e3-c-night-390.png')});const night=await page.evaluate(read);expect(night.camera).toEqual(day.camera);expect(duskState.camera).toEqual(day.camera);
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:780,y:1040,z:1.6});FARWAKE_TEST.draw(performance.now())});await page.screenshot({path:info.outputPath('e3-c-night-close-390.png')});
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
 const generators=await page.evaluate(()=>FARWAKE_TEST.state.buildings.filter(b=>b.finished&&FARWAKE_TEST.TYPES[b.type]?.power>0&&!b.editOrder).map(b=>b.id)),ordered=[];
 for(const id of generators){
  if(await page.evaluate(()=>{const g=FARWAKE_TEST.surveyGrid();return g.supply<g.used}))break;
  await page.evaluate(id=>FARWAKE_TEST.showBuilding(id),id);
  await page.locator('[data-editor="demolish"]').click();await page.locator('[data-editor="apply-demolish"]').click();ordered.push(id);
 }
 await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));
 const unpowered=await page.evaluate(read);expect(unpowered.grid.supply).toBeLessThan(unpowered.grid.used);
 expect(unpowered.architecture.buildings.filter(b=>b.occupied>0).every(b=>!b.powered&&b.strength===0)).toBe(true);
 await page.screenshot({path:info.outputPath('e3-c-unpowered-390.png')});
 for(const id of ordered){await page.evaluate(id=>FARWAKE_TEST.showBuilding(id),id);await page.locator('[data-editor="withdraw"]').click()}
 await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));const restored=await page.evaluate(read);expect(restored.grid).toEqual(night.grid);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.buildings.some(b=>b.editOrder))).toBe(false);

 // Cache reuse and CPU draw proxy are explicit; neither proves physical phone FPS.
 const profile=await page.evaluate(()=>{const g=FARWAKE_TEST,a=FarwakeArchitecture.diagnostics(),env=FarwakeEnvironment.diagnostics(),times=[];for(let i=0;i<90;i++){const t=performance.now();g.draw(t);times.push(performance.now()-t)}times.sort((a,b)=>a-b);return{before:a,after:FarwakeArchitecture.diagnostics(),environmentBefore:env,environmentAfter:FarwakeEnvironment.diagnostics(),pausedDraw:{median:times[45],p95:times[85],max:times[89]}}});
 expect(profile.after.basePlates).toBe(profile.before.basePlates);expect(profile.after.spillPlates).toBe(profile.before.spillPlates);expect(profile.environmentAfter.bakes).toBe(profile.environmentBefore.bakes);expect(profile.after.cachePixels).toBeLessThan(1000000);expect(errors).toEqual([]);
 // Observe later resting households without assigning attendance or tasks.
 const rest=await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:825.6,y:1008,z:1});document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.day!==58||g.state.minute>1410)break;if(g.state.minute<1260)continue;FarwakeNeighbourhood.prepare(g.state,g.surveyGrid());if(FarwakeArchitecture.diagnostics().buildings.some(b=>b.mode==='sleeping')){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return true}}if(!g.healthSnapshot().paused)document.querySelector('#pause').click();return false});
 const resting=rest?await page.evaluate(read):null;if(rest)await page.screenshot({path:info.outputPath('e3-c-resting-390.png')});
 await writeFile(info.outputPath('e3-c-state-profile.json'),JSON.stringify({day,dusk:duskState,settling,night,unpowered,restored,powerTest:{ordered,note:'Actual Dismantle confirmations followed by Withdraw order while paused. No structure removed; generator maintenance orders are excluded by the existing power simulation. Restored before continuing.'},resting,profile,errors},null,2));
});


test('E3-C uninterrupted real neighbourhood activity and normal live CPU draw sample',async({page},info)=>{
 test.setTimeout(150000);const testWallStart=Date.now(),errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 const start=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;document.querySelector('#pause').click();
  for(let i=0;i<180000;i++){g.tick(.025);if(s.minute<1236)continue;document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return{day:s.day,minute:s.minute,camera:{...g.camera},speed:document.querySelector('#speed').textContent,people:s.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task,path:p.path})),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics()};}throw Error('Evening not reached');
 });
 expect(start.speed).toBe('1×');
 await page.evaluate(()=>{
  const a=window.E3C_LIVE={draw:[],gaps:[],slow:[],slowGaps:[],steadyDraw:[],steadyGaps:[],events:[],last:0,start:0,began:0,collect:false},prepare=FarwakeNeighbourhood.prepare,finish=FarwakeMoments.draw;
  FarwakeNeighbourhood.prepare=function(...args){if(!a.collect)return prepare.apply(this,args);const t=performance.now();if(a.last){const gap=t-a.last;a.gaps.push(gap);if(t-a.began>15000)a.steadyGaps.push(gap);if(gap>40)a.slowGaps.push({gap,msIntoTake:t-a.began,minute:FARWAKE_TEST.state.minute,sheet:document.querySelector('#sheetbg').classList.contains('open')});}a.last=t;a.start=t;return prepare.apply(this,args)};
  FarwakeMoments.draw=function(...args){const r=finish.apply(this,args);if(!a.collect)return r;const ms=performance.now()-a.start;a.draw.push(ms);if(performance.now()-a.began>15000)a.steadyDraw.push(ms);if(ms>16)a.slow.push({index:a.draw.length,ms,bakes:FarwakeEnvironment.diagnostics().bakes});return r};
  a.stop=()=>{FarwakeNeighbourhood.prepare=prepare;FarwakeMoments.draw=finish};
 });
 await page.waitForTimeout(300);const takeStart=await page.evaluate(()=>{E3C_LIVE.began=performance.now();E3C_LIVE.collect=true;document.querySelector('#pause').click();return Date.now()});const samples=[];
 for(let i=0;i<60;i++){
  if(i===8){await page.getByRole('button',{name:'Open People',exact:true}).click();await page.evaluate(()=>E3C_LIVE.events.push({action:'Open People',ms:performance.now()-E3C_LIVE.began}));}
  if(i===13){await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.evaluate(()=>E3C_LIVE.events.push({action:'Close People',ms:performance.now()-E3C_LIVE.began}));}
  if(i===22){await page.getByRole('button',{name:'View all resources',exact:true}).click();await page.evaluate(()=>E3C_LIVE.events.push({action:'Open resources',ms:performance.now()-E3C_LIVE.began}));}
  if(i===27){await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.evaluate(()=>E3C_LIVE.events.push({action:'Close resources',ms:performance.now()-E3C_LIVE.began}));}
  await page.waitForTimeout(500);samples.push(await page.evaluate(()=>({day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,people:FARWAKE_TEST.state.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task?.type,visit:p.visit?.stage})),architecture:FarwakeArchitecture.diagnostics(),moment:FarwakeMoments.active,caption:document.querySelector('#world-moment').hidden?null:{speaker:document.querySelector('#world-speaker').textContent,text:document.querySelector('#world-words').textContent}})))}
 const takeEnd=await page.evaluate(()=>{E3C_LIVE.collect=false;document.querySelector('#pause').click();return Date.now()});
 const profile=await page.evaluate(()=>{const a=E3C_LIVE;a.stop();const stats=v=>{v.sort((a,b)=>a-b);return{n:v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)],max:v.at(-1)}};return{draw:stats(a.draw),callbackGap:stats(a.gaps),slow:a.slow,slowGaps:a.slowGaps,steady:{draw:stats(a.steadyDraw),callbackGap:stats(a.steadyGaps)},events:a.events,health:FARWAKE_TEST.healthSnapshot(),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics()}});
 expect(profile.environment.bakes).toBe(start.environment.bakes);expect(profile.architecture.cachePixels).toBeLessThan(1000000);expect(profile.health.saveProtection).toBe(false);expect(profile.draw.n).toBeGreaterThan(120);
 const moved=start.people.filter(p=>samples.some(q=>{const v=q.people.find(q=>q.id===p.id);return Math.hypot(v.x-p.x,v.y-p.y)>1}));expect(moved.length).toBeGreaterThan(0);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('e3-c-activity-end-390.png')});
 await page.getByRole('button',{name:'Open People',exact:true}).click();await page.screenshot({path:info.outputPath('e3-c-people-390.png')});await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'View all resources',exact:true}).click();await page.screenshot({path:info.outputPath('e3-c-resources-390.png')});await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await writeFile(info.outputPath('e3-c-take.json'),JSON.stringify({testWallStart,takeStart,takeEnd,start,samples,movedIds:moved.map(p=>p.id),profile,errors,note:'Normal unchanged game loop at 1×. The measured take contains genuine People/resources interactions; no screenshot capture occurs inside it. Steady statistics use its final portion after 15 seconds, after both drawers close. No assigned tasks, routes, residents or resource grants. CPU draw regions exclude GPU completion; callback gaps include real simulation/UI/browser scheduling. Desktop CI is not physical iPhone verification.'},null,2));
});



for(const viewport of [{width:390,height:844},{width:320,height:568},{width:375,height:667},{width:844,height:390}]){
 test('E3-C reachable contextual controls '+viewport.width+'x'+viewport.height,async({page},info)=>{
  await page.setViewportSize(viewport);await colony(page);
  const ids=['#pause','#speed','#menu','#zoomin','#zoomout','#homecam','#nav button','.field-save','#resbar button','.mission'];
  // Atomically inspect the current controls: HUD updates replace resource DOM every 0.8 s.
  const controls=await page.evaluate(ids=>ids.flatMap(selector=>[...document.querySelectorAll(selector)].map(e=>{const r=e.getBoundingClientRect();return{selector,name:e.getAttribute('aria-label')||e.textContent,x:r.x,y:r.y,width:r.width,height:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})),ids);
  for(const selector of ids)expect(controls.some(b=>b.selector===selector),selector).toBe(true);
  for(const box of controls){const label=box.selector+' '+box.name;expect(box.width,label).toBeGreaterThanOrEqual(43.9);expect(box.height,label).toBeGreaterThanOrEqual(43.9);expect(box.x,label).toBeGreaterThanOrEqual(0);expect(box.x+box.width,label).toBeLessThanOrEqual(viewport.width+.1);expect(box.y+box.height,label).toBeLessThanOrEqual(viewport.height+.1);expect(box.hit,label).toBe(true);}
  const camera=await page.evaluate(()=>({...FARWAKE_TEST.camera}));
  for(const name of ['Open Build','Open People','Open Command','Open Research','Game and Save']){
   await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('#sheetbg')).toHaveClass(/open/);await expect(page.locator('#sheet')).toBeVisible();await page.getByRole('button',{name:'Close panel',exact:true}).click();
  }
  expect(await page.evaluate(()=>({...FARWAKE_TEST.camera}))).toEqual(camera);
  await page.keyboard.press('Tab');await page.locator('#pause').focus();expect(await page.locator('#pause').evaluate(e=>e.matches(':focus-visible'))).toBe(true);await page.keyboard.press('Enter');await expect(page.locator('#pause')).toHaveAttribute('aria-label','Pause simulation');await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('e3-c-controls-'+viewport.width+'.png')});
 });
}
