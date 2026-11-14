import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
test('E3-C-PERF compare original and integrated WebKit drawer scheduling',async({browser},info)=>{
 if(info.project.name!=='webkit')test.skip(true,'Focused investigation of the observed WebKit scheduling stall.');test.setTimeout(150000);
 const old=await Promise.all(['tests/fixtures/e3-b-hud.html','tests/fixtures/e3-b-hud.css','tests/fixtures/e3-b-moments.js'].map(p=>readFile(p,'utf8'))),reports=[];
 for(const version of ['E3-B','E3-C']){
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',viewport:{width:390,height:844},recordVideo:{dir:info.outputPath('baseline-video-'+version),size:{width:390,height:844}}}),page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  try{
   if(version==='E3-B'){
    await page.route('**/index.html?review=1',r=>r.fulfill({body:old[0],contentType:'text/html'}));
    await page.route('**/neighbourhood.css',r=>r.fulfill({body:old[1],contentType:'text/css'}));
    await page.route('**/moments.js',r=>r.fulfill({body:old[2],contentType:'text/javascript'}));
   }
   await page.goto('/index.html?review=1');await page.getByRole('button',{name:'Game and Save',exact:true}).click();await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FarwakeEnvironment.ready());await page.locator('#pause').click();
   await page.evaluate(()=>{const g=FARWAKE_TEST;Object.assign(g.camera,{x:825.6,y:1008,z:1});document.querySelector('#pause').click();for(let i=0;i<180000;i++){g.tick(.025);if(g.state.minute>=1236){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return}}throw Error('Evening not reached')});
   const start=await page.evaluate(()=>{
    const a=window.DRAW_DIAGNOSTIC={draw:[],gaps:[],steadyDraw:[],steadyGaps:[],slow:[],events:[],began:performance.now(),last:0,start:0},prepare=FarwakeNeighbourhood.prepare,finish=FarwakeMoments.draw;
    FarwakeNeighbourhood.prepare=function(...args){const t=performance.now();if(a.last){const gap=t-a.last;a.gaps.push(gap);if(t-a.began>15000)a.steadyGaps.push(gap);if(gap>40)a.slow.push({gap,msIntoTake:t-a.began,minute:FARWAKE_TEST.state.minute,sheet:document.querySelector('#sheetbg').classList.contains('open')})}a.last=t;a.start=t;return prepare.apply(this,args)};
    FarwakeMoments.draw=function(...args){const r=finish.apply(this,args),ms=performance.now()-a.start;a.draw.push(ms);if(performance.now()-a.began>15000)a.steadyDraw.push(ms);return r};a.stop=()=>{FarwakeNeighbourhood.prepare=prepare;FarwakeMoments.draw=finish};const env=FarwakeEnvironment.diagnostics();document.querySelector('#pause').click();return{env,day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute};
   });
   for(let i=0;i<60;i++){
    if(i===8){await page.getByRole('button',{name:'Open People',exact:true}).click();await page.evaluate(()=>DRAW_DIAGNOSTIC.events.push({action:'Open People',ms:performance.now()-DRAW_DIAGNOSTIC.began}))}
    if(i===13){await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.evaluate(()=>DRAW_DIAGNOSTIC.events.push({action:'Close People',ms:performance.now()-DRAW_DIAGNOSTIC.began}))}
    if(i===22){await page.getByRole('button',{name:'View all resources',exact:true}).click();await page.evaluate(()=>DRAW_DIAGNOSTIC.events.push({action:'Open resources',ms:performance.now()-DRAW_DIAGNOSTIC.began}))}
    if(i===27){await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.evaluate(()=>DRAW_DIAGNOSTIC.events.push({action:'Close resources',ms:performance.now()-DRAW_DIAGNOSTIC.began}))}
    await page.waitForTimeout(500);
   }
   const profile=await page.evaluate(()=>{const a=DRAW_DIAGNOSTIC;a.stop();const stats=v=>{v.sort((a,b)=>a-b);return{n:v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)],max:v.at(-1)}};document.querySelector('#pause').click();return{draw:stats(a.draw),callbackGap:stats(a.gaps),steady:{draw:stats(a.steadyDraw),callbackGap:stats(a.steadyGaps)},slow:a.slow,events:a.events,environment:FarwakeEnvironment.diagnostics(),health:FARWAKE_TEST.healthSnapshot()}});
   expect(errors).toEqual([]);expect(profile.environment.bakes).toBe(start.env.bakes);expect(profile.health.saveProtection).toBe(false);expect(profile.draw.n).toBeGreaterThan(600);reports.push({version,start,profile,errors});
  }finally{await context.close()}
 }
 await writeFile(info.outputPath('e3-c-webkit-drawer-comparison.json'),JSON.stringify({baseline:'f9c2f4b3524adab48612c29941d45f31d2ff0ffc',note:'One 30-second 1× take per version in fresh desktop WebKit contexts, same original Day-58 save and evening start/camera. Original E3-B HTML/CSS/Moments are intercepted from exact retained source, with the same unchanged game/render assets. Both record video; neither takes screenshots or samples resident snapshots during collection. Actual People/resources open/close controls at matching intervals. Steady portion begins after 15 seconds. Host variation, random existing dialogue and GPU completion are uncontrolled. This is an investigation, not physical iPhone or full-frame verification.',reports},null,2));
});
