import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
async function colony(page){
 await page.goto('/index.html?review=1');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FarwakeEnvironment.ready());
 await page.locator('#pause').click();
 await page.evaluate(()=>{const g=FARWAKE_TEST,b=g.state.buildings.find(b=>b.id===g.state.colonists[0].home);Object.assign(g.camera,{x:(b.x+b.w/2+3.3)*32,y:(b.y+b.h/2+.5)*32,z:1});g.draw(performance.now())});
}
test('E3-A real environmental composition before further lighting work',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 await page.waitForTimeout(900);await page.screenshot({path:info.outputPath('e3-a-day-390.png')});
 const report=await page.evaluate(()=>{
  const g=FARWAKE_TEST,prior=JSON.stringify(g.state),samples=[],prepareSamples=[];
  const grid=g.surveyGrid();for(let i=0;i<300;i++){const t=performance.now();FarwakeNeighbourhood.prepare(g.state,grid);prepareSamples.push(performance.now()-t)}
  prepareSamples.sort((a,b)=>a-b);
  for(let i=0;i<60;i++){const t=performance.now();g.draw(t);samples.push(performance.now()-t)}
  samples.sort((a,b)=>a-b);
  return{unchanged:prior===JSON.stringify(g.state),environment:FarwakeEnvironment.diagnostics(),district:FarwakeNeighbourhood.diagnostics(),day:g.state.day,minute:g.state.minute,camera:{...g.camera},districtPrepare:{median:prepareSamples[150],p95:prepareSamples[285],max:prepareSamples[299]},pausedDraw:{median:samples[30],p95:samples[57],max:samples[59]}};
 });
 expect(report.unchanged).toBe(true);expect(report.environment.atlasReady).toBe(true);expect(report.environment.pixels).toBeLessThan(1000000);expect(errors).toEqual([]);
 await writeFile(info.outputPath('e3-a-state-profile.json'),JSON.stringify({...report,errors},null,2));
});
