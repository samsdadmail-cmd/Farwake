import {test,expect} from '@playwright/test';
import {writeFile,readFile} from 'node:fs/promises';
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
 await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:820,y:1100,z:1.6});g.draw(performance.now())});
 await page.screenshot({path:info.outputPath('e3-a-close-390.png')});
 await writeFile(info.outputPath('e3-a-state-profile.json'),JSON.stringify({...report,errors},null,2));
});


test('E3-A repeated cold bakes versus cached burst and paced live draws',async({page},info)=>{
 test.setTimeout(150000);
 const sources={before:await readFile('tests/fixtures/environment-e3-a-before.js','utf8'),refined:await readFile('frontier-environment.js','utf8')},runs=[];
 // Independent pages prevent a synthetic batch of replaced modules/canvas command
 // queues from contaminating the live-frame sample or retaining all six caches.
 for(let repeat=0;repeat<3;repeat++)for(const version of ['before','refined']){
  const sample=await page.context().newPage();
  try{
   await colony(sample);
   await sample.evaluate(()=>window.requestAnimationFrame=()=>0);await sample.waitForTimeout(80);
   await sample.addScriptTag({content:sources[version]});await sample.waitForFunction(()=>FarwakeEnvironment.ready(),null,{polling:25});
   runs.push(await sample.evaluate(({version,repeat})=>{
    const g=FARWAKE_TEST,prior=JSON.stringify({state:g.state,terrain:g.terrain,features:g.features}),stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
    const start=performance.now();g.draw(start);const coldTotal=performance.now()-start,cold=FarwakeEnvironment.diagnostics(),burst=[];
    for(let i=0;i<60;i++){const t=performance.now();g.draw(t);burst.push(performance.now()-t)}
    return{version,repeat,coldTotal,cold,burst:stats(burst),end:FarwakeEnvironment.diagnostics(),unchanged:prior===JSON.stringify({state:g.state,terrain:g.terrain,features:g.features})};
   },{version,repeat}));
  }finally{await sample.close()}
 }
 for(const r of runs){expect(r.unchanged).toBe(true);expect(r.end.bakes).toBe(1)}
 // A separate fresh page uses the UNMODIFIED game animation loop, including real
 // tick, presentation, UI and save scheduling. No manually generated rAF stream.
 await colony(page);
 const paced=await page.evaluate(()=>new Promise(resolve=>{
  const g=FARWAKE_TEST,samples=[],gaps=[],slow=[],phases={};let prev=0,start=0;
  const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
  const undo=[],wrap=(obj,name,label)=>{const original=obj[name];obj[name]=function(...args){const t=performance.now();try{return original.apply(this,args)}finally{phases[label]=(phases[label]||0)+performance.now()-t}};undo.push(()=>obj[name]=original)};
  const prepare=FarwakeNeighbourhood.prepare;FarwakeNeighbourhood.prepare=function(...args){start=performance.now();if(prev)gaps.push(start-prev);prev=start;for(const k of Object.keys(phases))delete phases[k];return prepare.apply(this,args)};undo.push(()=>FarwakeNeighbourhood.prepare=prepare);
  wrap(FarwakeEnvironment,'ground','environment');wrap(FarwakeLandscape,'ground','landscape');wrap(FarwakeLandscape,'light','lighting');wrap(FarwakePeople,'draw','people');wrap(FarwakeWorkFX,'draw','workFX');
  const end=FarwakeMoments.draw;FarwakeMoments.draw=function(...args){
   const result=end.apply(this,args),ms=performance.now()-start;samples.push(ms);if(ms>16)slow.push({frame:samples.length,ms,phases:{...phases},bakes:FarwakeEnvironment.diagnostics().bakes});
   if(samples.length===120){undo.forEach(f=>f());FarwakeMoments.draw=end;document.querySelector('#pause').click();resolve({frames:120,draw:stats(samples),callbackGap:stats(gaps),slow,environment:FarwakeEnvironment.diagnostics(),day:g.state.day,minute:g.state.minute})}return result;
  };
  document.querySelector('#pause').click();
 }));
 expect(paced.environment.bakes).toBe(1);
 await writeFile(info.outputPath('e3-a-repeated-profile.json'),JSON.stringify({note:'Desktop CI CPU proxy. Three independent module-cold pages per version, each imported from the same real colony; no whole-process/uncached-network claim. Sixty-draw bursts exclude simulation/GPU completion. A separate fresh page then samples 120 draw regions in the unchanged live game loop (district prepare through final moments pass); callback gaps also include normal simulation/UI/browser scheduling. Physical iPhone performance remains unverified.',runs,paced},null,2));
});
