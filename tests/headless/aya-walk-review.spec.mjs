import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});

test('Aya walks a genuine home route with turns and enters, without route or task grants',async({page},info)=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/index.html?review=1');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FARWAKE_TEST.state.colonists.length===8);
 await page.waitForFunction(()=>FarwakeHomeResident.ready());
 const start=await page.evaluate(()=>{
  const g=FARWAKE_TEST,p=g.state.colonists[0];
  // Search normal simulation only. Tasks, paths, clock, stocks and attendance
  // are never assigned. Record ordinary 1x from a naturally selected route.
  for(let i=0;i<120000;i++){
   g.tick(.025);
   if(p.task?.type!=='life_home'||p.visit?.stage!=='approach'||p.path.length<4||p.path.length>24)continue;
   const points=[p,...p.path];let turns=0,distance=0,last;
   for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j],dx=b.x-a.x,dy=b.y-a.y;
    distance+=Math.hypot(dx,dy);const dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'back':'front');
    if(last&&last!==dir)turns++;last=dir;
   }
   if(turns<2||distance<3)continue;
   // Initialise the presentation at this search boundary before the real take.
   g.advanceWorld(.001);Object.assign(FarwakePeople.pose(p),{x:p.x,y:p.y,work:0,walk:0});
   document.querySelector('#pause').click();
   const evidence={day:g.state.day,minute:g.state.minute,task:{...p.task},visit:{...p.visit},path:p.path.map(q=>({...q})),distance,turns};
   window.ayaWalkSamples=[];window.ayaReviewFollow=true;
   const follow=()=>{if(window.ayaReviewFollow&&g.homePhase==='idle'){
    const v=FarwakePeople.pose(p);Object.assign(g.camera,{x:v.x*32,y:v.y*32,z:1.7});
    if(!window.ayaWalkLast||performance.now()-window.ayaWalkLast>75){window.ayaWalkLast=performance.now();window.ayaWalkSamples.push({time:performance.now(),x:v.x,y:v.y,dir:v.dir,phase:v.phase,walk:v.walk,visit:p.visit?.stage,art:{...FarwakeHomeResident.worldInfo()}})}
   }requestAnimationFrame(follow)};requestAnimationFrame(follow);
   return evidence;
  }
  throw Error('No genuine Aya home route with turns in search window');
 });
 await page.waitForTimeout(300);
 await page.screenshot({path:info.outputPath('aya-walk-start-390.png')});
 await page.locator('#pause').click();
 await page.waitForFunction(()=>FARWAKE_TEST.state.colonists[0].visit?.stage==='inside',{},{timeout:50000});
 await page.evaluate(()=>window.ayaReviewFollow=false);
 await page.evaluate(()=>FARWAKE_TEST.showBuilding(FARWAKE_TEST.state.colonists[0].home));
 await page.locator('[data-home-enter]').click();
 await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
 await page.waitForTimeout(2200);
 const result=await page.evaluate(()=>({samples:window.ayaWalkSamples,home:FARWAKE_TEST.homeDiagnostics,task:FARWAKE_TEST.state.colonists[0].task,visit:FARWAKE_TEST.state.colonists[0].visit}));
 const walking=result.samples.filter(q=>q.walk>.15&&q.art.rendered);
 expect(new Set(walking.map(q=>q.dir)).size).toBeGreaterThanOrEqual(2);
 expect(new Set(walking.map(q=>q.art.frame)).size).toBeGreaterThanOrEqual(4);
 for(let i=1;i<walking.length;i++){
  const a=walking[i-1],b=walking[i];
  if(b.time-a.time<180){
   const distance=Math.hypot(b.x-a.x,b.y-a.y);expect(distance).toBeLessThan(.5);
   if(distance>.001)expect((b.phase-a.phase)/distance).toBeGreaterThanOrEqual(7.99);
   if(distance>.001)expect((b.phase-a.phase)/distance).toBeLessThan(11.4);
  }
 }
 expect(result.visit.stage).toBe('inside');expect(result.visit.building).toBe(start.visit.building);
 expect(errors).toEqual([]);
 await writeFile(info.outputPath('aya-walk-state.json'),JSON.stringify({start,...result},null,2));
});
