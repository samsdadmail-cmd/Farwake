import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
import {readFileSync} from 'node:fs';

// Exercise the actual animation loop, periodic UI, autosave and presentation.
// Instrument the QA response only; isolated browser contexts never use player saves.
test('unattended early colony keeps rendering, simulating and saving through two nights',async({page},info)=>{
 test.setTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.clock.install();
 await page.addInitScript(()=>{
   // 30 Hz driver for software-rendered CI; unchanged game frame(), six-minute
   // duration, simulation/UI/save paths and assertions. Native-RAF short tests
   // separately cover the physical freeze's terrain and camera interactions.
   window.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),1000/30);
   window.__freezeProbe={frames:0,ticks:0,phase:'boot',writes:0,canvases:0};
   const create=document.createElement.bind(document);
   document.createElement=function(tag,...args){if(String(tag).toLowerCase()==='canvas')__freezeProbe.canvases++;return create(tag,...args)};
   const write=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k.startsWith('farwake_'))__freezeProbe.writes++;return write.call(this,k,v)};
 });
 let html=readFileSync('index.html','utf8');
 html=html.replace('function frame(now){','function frame(now){__freezeProbe.frames++;__freezeProbe.phase="frame";');
 html=html.replace('function tick(dt){','function tick(dt){__freezeProbe.ticks++;');
 html=html.replace('tick(dt);advanceWorld(dt);','__freezeProbe.phase="tick";tick(dt);__freezeProbe.phase="presentation";advanceWorld(dt);__freezeProbe.phase="draw";');
 html=html.replace('if(uiAccum>.8){','if(uiAccum>.8){__freezeProbe.phase="ui";');
 html=html.replace('if(saveAccum>12){save();','if(saveAccum>12){__freezeProbe.phase="save";save();');
 await page.route('**/index.html',r=>r.fulfill({contentType:'text/html',body:html}));
 await page.goto('/index.html');
 // Only ordinary player commands: two speed taps and affordable starting blueprints.
 await page.click('#speed');await page.click('#speed');
 await page.evaluate(()=>{const g=FARWAKE_TEST;g.buildAt('shelter',30,30);g.buildAt('garden',26,33)});
 const samples=[];
 for(let chunk=0;chunk<6;chunk++){
   await page.clock.runFor(60000);
   const sample=await page.evaluate(()=>({...__freezeProbe,day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,piles:FARWAKE_TEST.state.piles.length,health:FARWAKE_TEST.healthSnapshot(),saved:localStorage.getItem('farwake_founders_alpha03_v1')?.length}));
   samples.push(sample);console.log('EARLY_HEARTBEAT '+info.project.name+' '+JSON.stringify(sample));
   expect(errors,JSON.stringify(samples)).toEqual([]);
   if(samples.length>1){expect(sample.frames).toBeGreaterThan(samples.at(-2).frames);expect(sample.ticks).toBeGreaterThan(samples.at(-2).ticks)}
 }
 await info.attach('early-heartbeats',{body:JSON.stringify(samples),contentType:'application/json'});
 expect(samples.at(-1).day).toBeGreaterThanOrEqual(3);
 expect(samples.at(-1).writes).toBeLessThan(1000);
 expect(samples.at(-1).canvases).toBeLessThan(200);
 const before=await page.evaluate(()=>({day:FARWAKE_TEST.state.day,harvests:FARWAKE_TEST.state.industry.harvests,built:FARWAKE_TEST.state.buildings.filter(b=>b.finished).length}));
 expect(before.built).toBeGreaterThanOrEqual(5);
 expect(before.harvests).toBeGreaterThan(0);
 await page.evaluate(()=>FARWAKE_TEST.save());await page.reload();
 expect(await page.evaluate(()=>FARWAKE_TEST.state.day)).toBe(before.day);
 await page.clock.runFor(2000);
 expect(errors).toEqual([]);
});

// Capture a synthetic fault to verify diagnostics, not to claim reproduction of #21.
test('fault diagnostics survive reload without changing the expedition save',async({page})=>{
 await page.goto('/index.html?diagnostics=1');
 const saved=await page.evaluate(()=>{FARWAKE_TEST.save();const raw=localStorage.getItem('farwake_founders_alpha03_v1');window.dispatchEvent(new ErrorEvent('error',{error:new Error('QA diagnostic capture')}));return raw});
 expect(await page.evaluate(()=>localStorage.getItem('farwake_founders_alpha03_v1'))).toBe(saved);
 await page.reload();
 const fault=await page.evaluate(()=>JSON.parse(localStorage.getItem('farwake_diagnostics_fault_v1')));
 expect(fault.error.message).toBe('QA diagnostic capture');
 expect(fault.error.phase).toBeTruthy();
 expect(JSON.stringify(fault)).not.toContain('Aya Mercer');
 await page.click('#menu');await page.click('[data-open="operations"]');
 await expect(page.locator('[data-diagnostics-export]')).toBeVisible();
});
