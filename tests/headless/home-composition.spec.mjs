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
 // Actual architecture bounds remain in view, even when surplus sky/ground crops.
 expect(d.layout.house.left).toBeGreaterThanOrEqual(0);expect(d.layout.house.right).toBeLessThanOrEqual(viewport.width);
 expect(d.layout.house.top).toBeGreaterThanOrEqual(0);expect(d.layout.house.bottom).toBeLessThanOrEqual(viewport.height);
 await page.locator('#homeinfo').click();await expect(page.locator('#homewho')).toHaveText('Nobody is inside');
 await page.locator('#homeinfo').click();
 await page.screenshot({path:info.outputPath('home-day-'+viewport.width+'.png')});
 // Context is textured sky/ground, not the previous flat-colour margins.
 const sceneDetail=await page.evaluate(()=>{
  const c=document.querySelector('#homecanvas'),ctx=c.getContext('2d'),L=FARWAKE_TEST.homeDiagnostics.layout;
  return [110,L.h-110].map(y=>{const colours=new Set();for(let x=16;x<L.w-16;x+=3){const p=ctx.getImageData(Math.floor(x*L.d),Math.floor(y*L.d),1,1).data;colours.add([...p].join(','))}return colours.size});
 });expect(sceneDetail.every(n=>n>12)).toBe(true);
 expect(d.layout.landscape||d.layout.dw>=viewport.width).toBe(true);
 await page.locator('#homeview').click();
 await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.view==='room'&&FARWAKE_TEST.homeDiagnostics.layout?.view==='room');
 const close=await page.evaluate(()=>FARWAKE_TEST.homeDiagnostics);
 expect(close.layout.dw/d.layout.dw).toBeCloseTo(1.7,2);
 await page.locator('#homecanvas').press(viewport.width<viewport.height?'ArrowRight':'ArrowDown');
 await page.waitForFunction(()=>Math.abs(FARWAKE_TEST.homeDiagnostics.panX)+Math.abs(FARWAKE_TEST.homeDiagnostics.panY)>0);
 if(viewport.width<viewport.height){
  await page.mouse.move(viewport.width*.7,viewport.height*.5);await page.mouse.down();
  await page.mouse.move(viewport.width*.3,viewport.height*.5,{steps:5});await page.mouse.up();
 }
 await page.screenshot({path:info.outputPath('home-room-'+viewport.width+'.png')});
 await page.waitForFunction(()=>!!FARWAKE_TEST.homeDiagnostics.layout);
 const moved=await page.evaluate(()=>FARWAKE_TEST.homeDiagnostics);
 expect(Math.abs(moved.panX)).toBeLessThanOrEqual(moved.layout.rangeX+.01);
 expect(Math.abs(moved.panY)).toBeLessThanOrEqual(moved.layout.rangeY+.01);
 await page.locator('#homeview').click();await expect(page.locator('#homeview')).toHaveAttribute('aria-pressed','false');
 await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='home');
 expect(await page.evaluate(()=>FARWAKE_TEST.homeDiagnostics.panX)).toBe(0);
 expect(await page.evaluate(()=>FARWAKE_TEST.homeDiagnostics.panY)).toBe(0);

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
  const L=FARWAKE_TEST.homeDiagnostics.layout,im=new Image();im.src='/assets/home-composition/portrait-night.webp';await im.decode();
  const sample=document.createElement('canvas');sample.width=sample.height=1;const c=sample.getContext('2d');
  c.drawImage(im,384,970,1,1,0,0,1,1);const original=[...c.getImageData(0,0,1,1).data].slice(0,3).reduce((a,b)=>a+b,0);
  const x=Math.floor((L.x+(384-L.source.x)/L.source.w*L.dw)*L.d),y=Math.floor((L.y+(970-L.source.y)/L.source.h*L.dh)*L.d);
  const rendered=[...document.querySelector('#homecanvas').getContext('2d').getImageData(x,y,1,1).data].slice(0,3).reduce((a,b)=>a+b,0);
  return rendered/original;
 });expect(shade).toBeLessThan(.8);expect(shade).toBeGreaterThan(.3);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.v)).toBe(4);
 await page.locator('#homeinfo').click();await page.screenshot({path:info.outputPath('home-night-real-occupancy.png')});
 await page.locator('#homeexit').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
 await page.evaluate(()=>{FARWAKE_TEST.save();if(!FARWAKE_TEST.load())throw Error('Post-visit colony rejected')});
});

// Unmodified saved colony from historical organic-journey artifact 13972347941.
// Day 58 / 8 residents / 32 structures. No scene/occupant/resource injections.
test('Day-58 imported colony presents whole home and navigable room at iPhone size',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/index.html?review=1');
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FARWAKE_TEST.state.colonists.length===8);
 await page.getByRole('button',{name:'Open Command',exact:true}).click();
 await page.getByRole('button',{name:'Prefab Home 3 / 3 residents ›',exact:true}).first().click();
 await page.locator('[data-home-enter]').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside');
 await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.cachePixels>0&&FARWAKE_TEST.homeDiagnostics.draws>2);
 await page.screenshot({path:info.outputPath('day58-whole-home-390.png')});
 await page.locator('#homeview').click();await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='room');
 await page.screenshot({path:info.outputPath('day58-room-centre-390.png')});
 await page.locator('#homecanvas').press('ArrowLeft');
 await page.screenshot({path:info.outputPath('day58-room-left-390.png')});
 await page.locator('#homeinfo').click();await expect(page.locator('#homewho')).toHaveText('Nobody is inside');
 await page.screenshot({path:info.outputPath('day58-notes-390.png')});
 await page.locator('#homeview').click();await expect(page.locator('#homeview')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>FARWAKE_TEST.state.v)).toBe(4);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.buildings.filter(b=>b.finished).length)).toBe(32);
});
