import {test,expect} from '@playwright/test';

// Build from the starting economy: no stock, resident or research grants.
async function establishedHome(page){
 await page.goto('/index.html?review=1');
 return page.evaluate(()=>{
  const g=FARWAKE_TEST;if(!g.buildAt('shelter',30,30))throw Error('Starting home site unavailable');
  const b=g.state.buildings.at(-1);
  for(let i=0;i<5000&&!b.finished;i++)g.tick(.1);
  if(!b.finished)throw Error('Real material delivery/construction did not finish');
  g.save();if(!g.load())throw Error('Constructed colony failed reload');
  Object.assign(g.camera,{x:977.25,y:1031.5,z:.83});
  g.showBuilding(b.id);return b.id;
 });
}
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:375,height:667}])test('complete home entry, management and camera restore '+viewport.width+'x'+viewport.height,async({page},info)=>{
 await page.setViewportSize(viewport);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const id=await establishedHome(page);
 const before=await page.evaluate(()=>({camera:{...FARWAKE_TEST.camera},minute:FARWAKE_TEST.state.minute}));
 await page.locator('[data-home-enter]').click();
 await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
 await expect(page.locator('#homevisit')).toBeVisible();await expect(page.locator('.top')).not.toBeVisible();
 await page.waitForFunction(()=>document.querySelector('#homevisit').dataset.loading!=='true'&&FARWAKE_TEST.homeDiagnostics.draws>2);
 const d=await page.evaluate(()=>FARWAKE_TEST.homeDiagnostics);
 expect(d.cachePixels).toBeLessThanOrEqual(1000000);expect(d.residentsRendered).toBe(0);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.minute)).toBeGreaterThan(before.minute);
 expect(d.layout.dw/d.layout.dh).toBeCloseTo(d.layout.source.w/d.layout.source.h,3);
 // Every home part is inside the crop (roof/chimney through foundations).
 expect(d.layout.source.y).toBeLessThanOrEqual(400);expect(d.layout.source.y+d.layout.source.h).toBeGreaterThanOrEqual(920);
 await page.locator('#homeinfo').click();await expect(page.locator('#homewho')).toHaveText('Nobody is inside');
 await page.locator('#homeinfo').click();
 await page.screenshot({path:info.outputPath('home-day-'+viewport.width+'.png')});
 await page.locator('#homemanage').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
 expect(await page.evaluate(()=>({...FARWAKE_TEST.camera}))).toEqual(before.camera);
 await expect(page.locator('#sheet [data-home-enter]')).toBeVisible();
 await page.locator('[data-sheet="close"]').click();
 await page.evaluate(id=>FARWAKE_TEST.homeEnter(id),id);await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
 expect(await page.evaluate(()=>({...FARWAKE_TEST.camera}))).toEqual(before.camera);expect(errors).toEqual([]);
});
test('night lighting follows real sleeping occupants and grid state without save changes',async({page},info)=>{
 const id=await establishedHome(page);
 await page.evaluate(id=>{const g=FARWAKE_TEST;g.state.minute=1320;for(let i=0;i<1000;i++){g.tick(.1);if(g.state.colonists.filter(p=>p.home===id).every(p=>p.visit?.stage==='inside'))break}g.showBuilding(id)},id);
 await page.locator('[data-home-enter]').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
 await expect(page.locator('#homevisit')).toHaveAttribute('data-light-mode','sleeping');
 await page.locator('#homeinfo').click();await expect(page.locator('#homewho')).not.toHaveText('Nobody is inside');
 // Verify rendered pixels, rather than merely the lighting-state label. Mobile
 // WebKit may silently ignore CanvasRenderingContext2D.filter.
 const shade=await page.evaluate(async()=>{
  const L=FARWAKE_TEST.homeDiagnostics.layout,im=new Image();im.src='/assets/home-composition/night.webp';await im.decode();
  const sample=document.createElement('canvas');sample.width=sample.height=1;const c=sample.getContext('2d');
  c.drawImage(im,384,820,1,1,0,0,1,1);const original=[...c.getImageData(0,0,1,1).data].slice(0,3).reduce((a,b)=>a+b,0);
  const x=Math.floor((L.x+384/768*L.dw)*L.d),y=Math.floor((L.y+820/1152*L.dh)*L.d);
  const rendered=[...document.querySelector('#homecanvas').getContext('2d').getImageData(x,y,1,1).data].slice(0,3).reduce((a,b)=>a+b,0);
  return rendered/original;
 });expect(shade).toBeLessThan(.8);expect(shade).toBeGreaterThan(.3);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.v)).toBe(4);
 await page.locator('#homeinfo').click();await page.screenshot({path:info.outputPath('home-night-real-occupancy.png')});
 await page.locator('#homeexit').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
 await page.evaluate(()=>{FARWAKE_TEST.save();if(!FARWAKE_TEST.load())throw Error('Post-visit colony rejected')});
});
