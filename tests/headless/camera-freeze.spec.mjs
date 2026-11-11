import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});

for(const paused of [true,false])test(`early iPhone camera endurance, simulation ${paused?'paused':'running'}`,async({page},info)=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.clock.install();
 await page.goto('/index.html?diagnostics=1');
 if(paused)await page.click('#pause');
 const start=await page.evaluate(()=>FARWAKE_TEST.healthSnapshot());
 const samples=[];
 for(let i=0;i<6;i++){
  await page.evaluate(i=>{
   const c=document.querySelector('#world'),r=c.getBoundingClientRect(),x=r.left+r.width*.5,y=r.top+r.height*.5;
   const send=(type,px,py)=>c.dispatchEvent(new PointerEvent(type,{pointerId:42,pointerType:'touch',isPrimary:true,clientX:px,clientY:py,bubbles:true,cancelable:true}));
   send('pointerdown',x,y);
   for(let j=1;j<=12;j++)send('pointermove',x+(i%2?-1:1)*j*16,y+(i<3?1:-1)*j*16);
   send('pointerup',x+(i%2?-1:1)*192,y+(i<3?1:-1)*192);
  },i);
  await page.clock.runFor(5000);
  const health=await page.evaluate(()=>FARWAKE_TEST.healthSnapshot());samples.push(health);
  console.log('CAMERA_HEARTBEAT '+info.project.name+' '+JSON.stringify(health));
  expect(errors).toEqual([]);expect(health.frames).toBeGreaterThan(start.frames);
  expect(health.error).toBeNull();expect(health.saveProtection).toBe(false);
 }
 await info.attach('camera-heartbeats',{body:JSON.stringify(samples),contentType:'application/json'});
 if(paused)expect(samples.at(-1).ticks).toBe(start.ticks);else expect(samples.at(-1).ticks).toBeGreaterThan(start.ticks);
 await page.click('[data-nav="colony"]');
 await expect(page.locator('#sheet')).toContainText('Command Center');
});
