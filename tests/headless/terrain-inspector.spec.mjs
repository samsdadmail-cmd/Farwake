import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});

async function tapCenter(page){
 const box=await page.locator('#world').boundingBox();
 await page.locator('#world').tap({position:{x:box.width/2,y:box.height/2}});
}
async function expectLoop(page,paused,errors){
 await page.clock.runFor(1200); // Include at least one periodic paintHUD/refreshInspect.
 const before=await page.evaluate(()=>FARWAKE_TEST.healthSnapshot());
 await page.clock.runFor(3000);
 const after=await page.evaluate(()=>FARWAKE_TEST.healthSnapshot());
 expect(errors).toEqual([]);
 expect(after.error).toBeNull();
 expect(after.frames).toBeGreaterThan(before.frames+20);
 if(paused)expect(after.ticks).toBe(before.ticks);else expect(after.ticks).toBeGreaterThan(before.ticks);
}

for(const paused of [true,false])test(`empty terrain inspector keeps frame loop alive (${paused?'paused':'running'})`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('/index.html?diagnostics=1');
 if(paused)await page.click('#pause');
 await page.evaluate(()=>{const g=FARWAKE_TEST;g.camera.x=23.5*32;g.camera.y=25.5*32;g.draw(performance.now())});
 await tapCenter(page);
 await expectLoop(page,paused,errors);
 await expect(page.locator('#inspector')).toContainText('Meadowland');
});

test('harvesting a selected feature falls back to terrain without stopping frames',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('/index.html?diagnostics=1');
 const id=await page.evaluate(()=>{
   const g=FARWAKE_TEST;
   const tree=g.features.find(f=>f.type==='tree'&&Math.hypot(f.x-28,f.y-28)<10);
   if(!tree)throw Error('No discovered tree for the actual harvest');
   g.camera.x=(tree.x+.5)*32;g.camera.y=(tree.y+.5)*32;g.draw(performance.now());return tree.id;
 });
 await tapCenter(page);
 await expect(page.locator('#inspector [data-inspect="designate"]')).toHaveAttribute('data-id',id);
 await page.locator('#inspector [data-inspect="designate"]').click();
 // Ordinary work through the real frame loop: do not fake completion or remove the tree.
 for(let i=0;i<30;i++){
   await page.clock.runFor(2000);
   if(await page.evaluate(id=>FARWAKE_TEST.state.harvested.includes(id),id))break;
 }
 expect(await page.evaluate(id=>FARWAKE_TEST.state.harvested.includes(id),id)).toBe(true);
 await expectLoop(page,false,errors);
 await expect(page.locator('#inspector')).toContainText('Meadowland');
 expect(await page.evaluate(()=>FARWAKE_TEST.state.freightFlow.produced.wood)).toBeGreaterThan(0);
});
