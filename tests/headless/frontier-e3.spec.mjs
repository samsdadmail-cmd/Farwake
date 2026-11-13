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
 await colony(page);
 await page.evaluate(()=>{window.E3_NATIVE_RAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0});
 await page.waitForTimeout(80); // Let the already scheduled final frame drain before measurement.
 const sources={before:await readFile('tests/fixtures/environment-e3-a-before.js','utf8'),refined:await readFile('frontier-environment.js','utf8')},runs=[];
 const prior=await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}));
 for(let repeat=0;repeat<3;repeat++)for(const version of ['before','refined']){
  await page.addScriptTag({content:sources[version]});await page.waitForFunction(()=>FarwakeEnvironment.ready(),null,{polling:25});
  runs.push(await page.evaluate(({version,repeat})=>{
   const g=FARWAKE_TEST,stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
   const start=performance.now();g.draw(start);const coldTotal=performance.now()-start,cold=FarwakeEnvironment.diagnostics(),burst=[];
   for(let i=0;i<180;i++){const t=performance.now();g.draw(t);burst.push(performance.now()-t)}
   return{version,repeat,coldTotal,cold,burst:stats(burst),end:FarwakeEnvironment.diagnostics()};
  },{version,repeat}));
 }
 expect(await page.evaluate(()=>JSON.stringify({state:FARWAKE_TEST.state,terrain:FARWAKE_TEST.terrain,features:FARWAKE_TEST.features}))).toBe(prior);
 for(const r of runs)expect(r.end.bakes).toBe(1);
 // Paced rendering includes genuine tick/presentation work. No fabricated people,
 // building counts or tasks; distinguish CPU draw time from callback scheduling gaps.
 const paced=await page.evaluate(async()=>{
  const g=FARWAKE_TEST,samples=[],gaps=[],slow=[],phases={};let prev=performance.now();
  const wrap=(obj,name,label)=>{const original=obj[name];obj[name]=function(...args){const t=performance.now();try{return original.apply(this,args)}finally{phases[label]=(phases[label]||0)+performance.now()-t}};return()=>obj[name]=original};
  const undo=[wrap(FarwakeNeighbourhood,'prepare','district'),wrap(FarwakeEnvironment,'ground','environment'),wrap(FarwakeLandscape,'ground','landscape'),wrap(FarwakeLandscape,'light','lighting'),wrap(FarwakePeople,'draw','people'),wrap(FarwakeWorkFX,'draw','workFX')];
  document.querySelector('#pause').click();
  try{for(let i=0;i<120;i++){
   const now=await new Promise(resolve=>E3_NATIVE_RAF(resolve));gaps.push(now-prev);const dt=Math.min(.07,(now-prev)/1000);prev=now;
   g.tick(dt);g.advanceWorld(dt);for(const k of Object.keys(phases))delete phases[k];
   const t=performance.now();g.draw(now);const ms=performance.now()-t;samples.push(ms);if(ms>16)slow.push({frame:i,ms,phases:{...phases},bakes:FarwakeEnvironment.diagnostics().bakes});
  }}finally{document.querySelector('#pause').click();undo.forEach(f=>f())}
  const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
  return{frames:120,draw:stats(samples),callbackGap:stats(gaps),slow,environment:FarwakeEnvironment.diagnostics(),day:g.state.day,minute:g.state.minute};
 });
 expect(paced.environment.bakes).toBe(1);
 await writeFile(info.outputPath('e3-a-repeated-profile.json'),JSON.stringify({note:'Desktop CI CPU proxy; three alternating module-cold bakes per version on the same imported real colony. Asset/network cache is warm; whole-process startup is not measured. Bursts exclude simulation/GPU completion. Paced samples tick the real eight-resident simulation but do not measure physical iPhone performance.',runs,paced},null,2));
});
