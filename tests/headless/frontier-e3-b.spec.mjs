import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
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
 const dusk=await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.minute>=1080){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return{day:g.state.day,minute:g.state.minute}}}throw Error('Dusk not reached')});
 await page.screenshot({path:info.outputPath('e3-b-dusk-390.png')});const duskState=await page.evaluate(read);
 await page.evaluate(()=>{const g=FARWAKE_TEST;document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute<=1150||g.state.minute>=1275)continue;const grid=g.surveyGrid();FarwakeNeighbourhood.prepare(g.state,grid);if(grid.supply>=grid.used&&FarwakeNeighbourhood.diagnostics().buildings.filter(b=>b.mode==='awake').length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return}}throw Error('Genuinely inhabited night not reached')});
 await page.screenshot({path:info.outputPath('e3-b-night-390.png')});const night=await page.evaluate(read);expect(night.camera).toEqual(day.camera);expect(duskState.camera).toEqual(day.camera);
 await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:780,y:1040,z:1.6});FARWAKE_TEST.draw(performance.now())});await page.screenshot({path:info.outputPath('e3-b-night-close-390.png')});
 // Cache reuse and CPU draw proxy are explicit; neither proves physical phone FPS.
 const profile=await page.evaluate(()=>{const g=FARWAKE_TEST,a=FarwakeArchitecture.diagnostics(),env=FarwakeEnvironment.diagnostics(),times=[];for(let i=0;i<90;i++){const t=performance.now();g.draw(t);times.push(performance.now()-t)}times.sort((a,b)=>a-b);return{before:a,after:FarwakeArchitecture.diagnostics(),environmentBefore:env,environmentAfter:FarwakeEnvironment.diagnostics(),pausedDraw:{median:times[45],p95:times[85],max:times[89]}}});
 expect(profile.after.basePlates).toBe(profile.before.basePlates);expect(profile.after.spillPlates).toBe(profile.before.spillPlates);expect(profile.environmentAfter.bakes).toBe(profile.environmentBefore.bakes);expect(profile.after.cachePixels).toBeLessThan(1000000);expect(errors).toEqual([]);
 // Observe later resting households without assigning attendance or tasks.
 const rest=await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:825.6,y:1008,z:1});document.querySelector('#pause').click();for(let i=0;i<100000;i++){g.tick(.025);if(g.state.day!==58||g.state.minute>1410)break;if(g.state.minute<1260)continue;FarwakeNeighbourhood.prepare(g.state,g.surveyGrid());if(FarwakeArchitecture.diagnostics().buildings.some(b=>b.mode==='sleeping')){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return true}}if(!g.healthSnapshot().paused)document.querySelector('#pause').click();return false});
 const resting=rest?await page.evaluate(read):null;if(rest)await page.screenshot({path:info.outputPath('e3-b-resting-390.png')});
 await writeFile(info.outputPath('e3-b-state-profile.json'),JSON.stringify({day,dusk:duskState,night,resting,profile,errors},null,2));
});
