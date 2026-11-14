import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const preview='https://farwake-founders-k208fym76-atlas-8c31.vercel.app';
async function importColony(page,host=''){
 page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());
 await page.goto(host+'/index.html?review=1');
 await page.getByRole('button',{name:'Game and Save',exact:true}).tap();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FarwakeEnvironment.ready());
 await page.getByRole('button',{name:'Pause simulation',exact:true}).tap();
}

test('pinned preview real-save touch management and reload',async({browser,request},info)=>{
 test.setTimeout(120000);
 // Prove the host serves the retained runtime, rather than testing only a local copy.
 const html=await readFile('index.html','utf8');
 const paths=['index.html',...[...html.matchAll(/(?:src|href)="([^"?]+\.(?:js|css))"/g)].map(m=>m[1])];
 const hashes=[];
 for(const path of paths){
  const response=await request.get(preview+'/'+path);expect(response.ok(),path).toBe(true);
  const actual=createHash('sha256').update(await response.body()).digest('hex');
  const expected=createHash('sha256').update(await readFile(path)).digest('hex');
  expect(actual,path).toBe(expected);hashes.push({path,sha256:actual});
 }
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await importColony(page,preview);
  const original=await page.evaluate(()=>({seed:FARWAKE_TEST.state.seed,people:FARWAKE_TEST.state.colonists.map(p=>p.id),buildings:FARWAKE_TEST.state.buildings.map(b=>b.id)}));
  expect(original.people).toHaveLength(8);expect(original.buildings).toHaveLength(32);
  for(const name of ['Open Build','Open People','Open Command','Open Research','Game and Save']){
   await page.getByRole('button',{name,exact:true}).tap();await expect(page.locator('#sheetbg')).toHaveClass(/open/);
   await page.getByRole('button',{name:'Close panel',exact:true}).tap();
  }
  await page.evaluate(()=>{Object.assign(FARWAKE_TEST.camera,{x:825.6,y:1008,z:1});FARWAKE_TEST.draw(performance.now())});
  // Select the real home through the canvas touch handler, not showBuilding().
  const point=await page.evaluate(()=>{const g=FARWAKE_TEST,b=g.state.buildings.find(b=>b.id===7),r=document.querySelector('#world').getBoundingClientRect();return{x:r.x+r.width/2+((b.x+b.w/2)*32-g.camera.x)*g.camera.z,y:r.y+r.height/2+((b.y+b.h/2)*32-g.camera.y)*g.camera.z}});
  await page.touchscreen.tap(point.x,point.y);await expect(page.locator('#inspector')).toContainText('Prefab Home');
  await page.locator('[data-inspect="manage"]').tap();await expect(page.locator('[data-editor="demolish"]')).toBeVisible();
  await page.locator('[data-editor="demolish"]').tap();await page.locator('[data-editor="apply-demolish"]').tap();
  expect(await page.evaluate(()=>FARWAKE_TEST.state.buildings.find(b=>b.id===7).editOrder?.kind||FARWAKE_TEST.state.buildings.find(b=>b.id===7).editOrder?.mode)).toBeTruthy();
  await page.locator('[data-editor="withdraw"]').tap();
  expect(await page.evaluate(()=>!!FARWAKE_TEST.state.buildings.find(b=>b.id===7).editOrder)).toBe(false);
  await page.locator('[data-home-enter]').tap();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
  await page.locator('#homeexit').tap();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
  await page.getByRole('button',{name:'Game and Save',exact:true}).tap();await page.getByRole('button',{name:'Save Expedition',exact:true}).tap();
  await page.reload();await page.waitForFunction(()=>FARWAKE_TEST.state.day===58);
  const restored=await page.evaluate(()=>({seed:FARWAKE_TEST.state.seed,people:FARWAKE_TEST.state.colonists.map(p=>p.id),buildings:FARWAKE_TEST.state.buildings.map(b=>b.id),health:FARWAKE_TEST.healthSnapshot()}));
  expect(restored.seed).toBe(original.seed);expect(restored.people).toEqual(original.people);expect(restored.buildings).toEqual(original.buildings);expect(restored.health.saveProtection).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({path:info.outputPath('pinned-preview-day58.png'),animations:'disabled'});
  await writeFile(info.outputPath('pinned-preview-check.json'),JSON.stringify({preview,hashes,original,restored,errors,note:'Fresh browser context and QA save key; actual touch handlers, reversible home maintenance, entry/exit and saved reload. No manual export-delivery or physical-phone claim.'},null,2));
 }finally{await context.close()}
});

// Transparent test-only rAF instrumentation: synchronous callback body versus time
// outside that body. Neither interval measures GPU completion or proves a cause.
function installFrameProbe(){
 const raf=window.requestAnimationFrame.bind(window);
 window.READINESS={collect:false,frames:[],events:[],visibility:[],clicks:[],storage:[]};
 const a=window.READINESS;
 window.requestAnimationFrame=cb=>raf(stamp=>{
  if(cb.name!=='frame'||!a.collect)return cb(stamp);
  const start=performance.now(),previous=a.frames.at(-1);a.drawStart=0;a.drawMs=0;
  try{return cb(stamp)}finally{
   const end=performance.now();a.frames.push({at:start-a.began,gap:previous?start-(a.began+previous.at):0,outside:previous?start-previous.end:0,body:end-start,draw:a.drawMs,end,hidden:document.hidden});
  }
 });
 document.addEventListener('visibilitychange',()=>{if(a.collect)a.visibility.push({at:performance.now()-a.began,hidden:document.hidden})});
 document.addEventListener('click',()=>{if(a.collect)a.clickStart=performance.now()},true);
 document.addEventListener('click',()=>{if(a.collect&&a.clickStart)a.clicks.push({at:a.clickStart-a.began,ms:performance.now()-a.clickStart})});
 const set=Storage.prototype.setItem;
 Storage.prototype.setItem=function(...args){const t=performance.now();try{return set.apply(this,args)}finally{if(a.collect)a.storage.push({at:t-a.began,ms:performance.now()-t})}};
}

for(const mode of [
 {name:'live-drawers-no-video',live:true,drawers:true,video:false},
 {name:'live-drawers-video',live:true,drawers:true,video:true},
 {name:'live-idle-no-video',live:true,drawers:false,video:false},
 {name:'paused-drawers-no-video',live:false,drawers:true,video:false}
])test('WebKit repeated callback attribution '+mode.name,async({browser},info)=>{
 test.skip(info.project.name!=='webkit','WebKit-specific investigation');test.setTimeout(120000);
 const reports=[];
 for(let repeat=0;repeat<3;repeat++){
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',viewport:{width:390,height:844},hasTouch:true,isMobile:true,...(mode.video?{recordVideo:{dir:info.outputPath('video-'+repeat),size:{width:390,height:844}}}:{})});
  await context.addInitScript(installFrameProbe);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await importColony(page);
   await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:825.6,y:1008,z:1});document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute>=1236){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return}}throw Error('Evening not reached')});
   const start=await page.evaluate(live=>{
    const a=READINESS,prepare=FarwakeNeighbourhood.prepare,finish=FarwakeMoments.draw;
    FarwakeNeighbourhood.prepare=function(...args){if(a.collect)a.drawStart=performance.now();return prepare.apply(this,args)};
    FarwakeMoments.draw=function(...args){const r=finish.apply(this,args);if(a.collect)a.drawMs=performance.now()-a.drawStart;return r};
    a.began=performance.now();a.collect=true;if(live)document.querySelector('#pause').click();
    return {minute:FARWAKE_TEST.state.minute,environment:FarwakeEnvironment.diagnostics()};
   },mode.live);
   for(let i=0;i<36;i++){
    const action=mode.drawers?({8:'Open People',12:'Close panel',20:'View all resources',24:'Close panel'})[i]:null;
    if(action){await page.getByRole('button',{name:action,exact:true}).tap();await page.evaluate(action=>READINESS.events.push({action,at:performance.now()-READINESS.began}),action)}
    await page.waitForTimeout(500);
   }
   const report=await page.evaluate(()=>{
    const a=READINESS;a.collect=false;
    const stats=v=>{const s=[...v].sort((a,b)=>a-b);return{n:s.length,p95:s[Math.floor(s.length*.95)],max:s.at(-1),over100:s.filter(x=>x>=100).length,over250:s.filter(x=>x>=250).length}};
    return{elapsed:performance.now()-a.began,frames:a.frames,events:a.events,visibility:a.visibility,clicks:a.clicks,storage:a.storage,summary:Object.fromEntries(['gap','body','outside','draw'].map(k=>[k,stats(a.frames.slice(1).map(f=>f[k]))])),minute:FARWAKE_TEST.state.minute,environment:FarwakeEnvironment.diagnostics(),health:FARWAKE_TEST.healthSnapshot()};
   });
   expect(report.frames.length).toBeGreaterThan(150);expect(report.environment.bakes).toBe(start.environment.bakes);expect(report.health.saveProtection).toBe(false);expect(errors).toEqual([]);
   if(mode.live)expect(report.minute).toBeGreaterThan(start.minute);else expect(report.minute).toBe(start.minute);
   reports.push({mode,repeat,start,...report,errors});
   console.log('READINESS_CALLBACK '+JSON.stringify({mode:mode.name,repeat,summary:report.summary,slow:report.frames.filter(f=>f.gap>=100||f.body>=100),events:report.events,visibility:report.visibility,storage:report.storage}));
  }finally{await context.close()}
 }
 await writeFile(info.outputPath('callback-attribution-'+mode.name+'.json'),JSON.stringify({note:'Three fresh desktop WebKit contexts per condition, original Day-58 save and same evening. Actual 1x loop or real Pause; touch drawer controls. No screenshot or resident sampling during timing. Callback body includes synchronous JS; outside includes scheduling/layout/painting/encoding/other tasks and cannot be labelled OS delay or GPU cost without deeper evidence. Recording comparison is sequential and order/host effects remain uncontrolled. No physical-iPhone or large-colony claim.',reports},null,2));
});
