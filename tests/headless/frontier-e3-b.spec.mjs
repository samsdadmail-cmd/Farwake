import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});
async function colony(page){
 await page.goto('/index.html?review=1');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FarwakeEnvironment.ready());await page.locator('#pause').click();
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
}
test('E3-B actual saved neighbourhood day dusk night and material-light close view',async({page},info)=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 const read=()=>{const g=FARWAKE_TEST;return{day:g.state.day,minute:g.state.minute,weather:g.state.weather,camera:{...g.camera},grid:g.surveyGrid(),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics(),attendance:g.state.colonists.filter(p=>p.visit?.stage==='inside').map(p=>({id:p.id,name:p.name,task:p.task,action:p.action,visit:p.visit}))}};
 const before=await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}));
 for(let i=0;i<5;i++)await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));
 expect(await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}))).toBe(before);
 await page.screenshot({path:info.outputPath('e3-b-day-390.png')});const day=await page.evaluate(read);
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:780,y:1040,z:1.6});FARWAKE_TEST.draw(performance.now())});await page.screenshot({path:info.outputPath('e3-b-day-close-390.png')});
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
 const dusk=await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.minute>=1080){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return{day:g.state.day,minute:g.state.minute}}}throw Error('Dusk not reached')});
 await page.screenshot({path:info.outputPath('e3-b-dusk-390.png')});const duskState=await page.evaluate(read);
 const settlingFound=await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute<=1150||g.state.minute>=1275)continue;FarwakeNeighbourhood.prepare(g.state,g.surveyGrid());const homes=FarwakeArchitecture.diagnostics().buildings.filter(b=>['shelter','cabin'].includes(b.type));if(homes.filter(b=>b.occupied>0&&b.powered).length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return homes.some(b=>b.mode==='settling')}}throw Error('Two real occupied homes not reached')});
 const settling=await page.evaluate(read);if(settlingFound)await page.screenshot({path:info.outputPath('e3-b-settling-390.png')});
 await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute<=1150||g.state.minute>=1275)continue;const grid=g.surveyGrid();FarwakeNeighbourhood.prepare(g.state,grid);if(grid.supply>=grid.used&&FarwakeArchitecture.diagnostics().buildings.filter(b=>['shelter','cabin'].includes(b.type)&&b.mode==='awake').length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return}}throw Error('Genuinely inhabited night not reached')});
 await page.screenshot({path:info.outputPath('e3-b-night-390.png')});const night=await page.evaluate(read);expect(night.camera).toEqual(day.camera);expect(duskState.camera).toEqual(day.camera);
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:780,y:1040,z:1.6});FARWAKE_TEST.draw(performance.now())});await page.screenshot({path:info.outputPath('e3-b-night-close-390.png')});
 // Cache reuse and CPU draw proxy are explicit; neither proves physical phone FPS.
 const profile=await page.evaluate(()=>{const g=FARWAKE_TEST,a=FarwakeArchitecture.diagnostics(),env=FarwakeEnvironment.diagnostics(),times=[];for(let i=0;i<90;i++){const t=performance.now();g.draw(t);times.push(performance.now()-t)}times.sort((a,b)=>a-b);return{before:a,after:FarwakeArchitecture.diagnostics(),environmentBefore:env,environmentAfter:FarwakeEnvironment.diagnostics(),pausedDraw:{median:times[45],p95:times[85],max:times[89]}}});
 expect(profile.after.basePlates).toBe(profile.before.basePlates);expect(profile.after.spillPlates).toBe(profile.before.spillPlates);expect(profile.environmentAfter.bakes).toBe(profile.environmentBefore.bakes);expect(profile.after.cachePixels).toBeLessThan(1000000);expect(errors).toEqual([]);
 // Observe later resting households without assigning attendance or tasks.
 const rest=await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:825.6,y:1008,z:1});document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.day!==58||g.state.minute>1410)break;if(g.state.minute<1260)continue;FarwakeNeighbourhood.prepare(g.state,g.surveyGrid());if(FarwakeArchitecture.diagnostics().buildings.some(b=>b.mode==='sleeping')){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return true}}if(!g.healthSnapshot().paused)document.querySelector('#pause').click();return false});
 const resting=rest?await page.evaluate(read):null;if(rest)await page.screenshot({path:info.outputPath('e3-b-resting-390.png')});
 await writeFile(info.outputPath('e3-b-state-profile.json'),JSON.stringify({day,dusk:duskState,settling,night,resting,profile,errors},null,2));
});


test('E3-B uninterrupted real neighbourhood activity and normal live CPU draw sample',async({page},info)=>{
 test.setTimeout(150000);const testWallStart=Date.now(),errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 const start=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state,b=s.buildings.find(b=>b.id===7);document.querySelector('#pause').click();
  for(let i=0;i<120000;i++){
   g.tick(.025);const moving=s.colonists.filter(p=>p.path?.length>=4&&p.visit?.stage!=='inside'&&p.x>b.x-1&&p.x<b.x+10&&p.y>b.y-3&&p.y<b.y+8);
   if(s.minute<540||s.minute>1050||!moving.length)continue;
   document.querySelector('#pause').click();g.advanceWorld(.001);Object.assign(g.camera,{x:825.6,y:1008,z:1});g.draw(performance.now());
   return{day:s.day,minute:s.minute,camera:{...g.camera},speed:document.querySelector('#speed').textContent,people:s.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task,path:p.path})),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics()};
  }throw Error('No natural activity route found');
 });
 expect(start.speed).toBe('1×');
 await page.evaluate(()=>{
  const a=window.E3B_LIVE={draw:[],gaps:[],slow:[],last:0,start:0,collect:false},prepare=FarwakeNeighbourhood.prepare,finish=FarwakeMoments.draw;
  FarwakeNeighbourhood.prepare=function(...args){if(!a.collect)return prepare.apply(this,args);const t=performance.now();if(a.last)a.gaps.push(t-a.last);a.last=t;a.start=t;return prepare.apply(this,args)};
  FarwakeMoments.draw=function(...args){const r=finish.apply(this,args);if(!a.collect)return r;const ms=performance.now()-a.start;a.draw.push(ms);if(ms>16)a.slow.push({index:a.draw.length,ms,bakes:FarwakeEnvironment.diagnostics().bakes});return r};
  a.stop=()=>{FarwakeNeighbourhood.prepare=prepare;FarwakeMoments.draw=finish};
 });
 await page.waitForTimeout(300);const takeStart=await page.evaluate(()=>{E3B_LIVE.collect=true;document.querySelector('#pause').click();return Date.now()});const samples=[];
 for(let i=0;i<28;i++){await page.waitForTimeout(500);samples.push(await page.evaluate(()=>({day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,people:FARWAKE_TEST.state.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task?.type,visit:p.visit?.stage})),architecture:FarwakeArchitecture.diagnostics()})))}
 const takeEnd=await page.evaluate(()=>{E3B_LIVE.collect=false;document.querySelector('#pause').click();return Date.now()});
 const profile=await page.evaluate(()=>{const a=E3B_LIVE;a.stop();const stats=v=>{v.sort((a,b)=>a-b);return{n:v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)],max:v.at(-1)}};return{draw:stats(a.draw),callbackGap:stats(a.gaps),slow:a.slow,health:FARWAKE_TEST.healthSnapshot(),architecture:FarwakeArchitecture.diagnostics(),environment:FarwakeEnvironment.diagnostics()}});
 expect(profile.environment.bakes).toBe(start.environment.bakes);expect(profile.architecture.cachePixels).toBeLessThan(1000000);expect(profile.health.saveProtection).toBe(false);expect(profile.draw.n).toBeGreaterThan(120);
 const moved=start.people.filter(p=>samples.some(q=>{const v=q.people.find(q=>q.id===p.id);return Math.hypot(v.x-p.x,v.y-p.y)>1}));expect(moved.length).toBeGreaterThan(0);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('e3-b-activity-end-390.png')});
 await writeFile(info.outputPath('e3-b-take.json'),JSON.stringify({testWallStart,takeStart,takeEnd,start,samples,movedIds:moved.map(p=>p.id),profile,errors,note:'Normal unchanged game loop at 1×. No assigned tasks, routes, residents or resource grants. CPU draw regions exclude GPU completion; callback gaps include real simulation/UI/browser scheduling. Desktop CI is not physical iPhone verification.'},null,2));
});
