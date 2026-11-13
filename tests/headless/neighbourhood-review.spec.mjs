import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
async function loadColony(page){
 await page.goto('/index.html?review=1');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FARWAKE_TEST.state.colonists.length===8);
 await page.waitForFunction(()=>FarwakeHomeResident.ready());
}
function frame(){
 const g=FARWAKE_TEST,b=g.state.buildings.find(b=>b.id===g.state.colonists[0].home);
 Object.assign(g.camera,{x:(b.x+b.w/2+3.3)*32,y:(b.y+b.h/2+.5)*32,z:1});
 g.draw(performance.now());
}
test('E2 pairs real day/night neighbourhoods and keeps touch controls usable',async({page},info)=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await loadColony(page);
 await page.locator('#pause').click();await page.evaluate(frame);
 const before=await page.evaluate(()=>JSON.stringify(FARWAKE_TEST.state));
 await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));
 expect(await page.evaluate(()=>JSON.stringify(FARWAKE_TEST.state))).toBe(before);
 await page.screenshot({path:info.outputPath('neighbourhood-day-390.png')});
 const daylight=await page.evaluate(()=>({day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,camera:{...FARWAKE_TEST.camera},district:FarwakeNeighbourhood.diagnostics(),grid:FARWAKE_TEST.surveyGrid()}));
 expect(daylight.district.buildings.length).toBeGreaterThanOrEqual(10);
 expect(daylight.district.buildings.some(b=>b.type==='sawmill')).toBe(true);
 expect(daylight.district.buildings.some(b=>b.type==='wind')).toBe(true);
 expect(daylight.district.buildings.some(b=>b.type==='solar')).toBe(true);
 const ui=await page.evaluate(()=>{
  const selectors=['#pause','#speed','#menu','#resbar button','.navbutton','#zoomin','#zoomout','#homecam','.mission','.field-save'];
  return selectors.flatMap(s=>[...document.querySelectorAll(s)]).map(e=>{const r=e.getBoundingClientRect();return{name:e.getAttribute('aria-label')||e.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height}});
 });
 for(const r of ui){expect(r.h,r.name).toBeGreaterThanOrEqual(44);expect(r.x,r.name).toBeGreaterThanOrEqual(0);expect(r.x+r.w,r.name).toBeLessThanOrEqual(391);expect(r.y+r.h,r.name).toBeLessThanOrEqual(845)}
 await page.getByRole('button',{name:'Open Command',exact:true}).click();await expect(page.locator('#sheetbg')).toHaveClass(/open/);
 await page.locator('#sheet .screenclose').click();
 await page.locator('#pause').click();
 const evening=await page.evaluate(()=>{
  const g=FARWAKE_TEST;
  for(let i=0;i<180000;i++){
   g.tick(.025);const s=g.state;if(s.minute<=1150||s.minute>=1275)continue;
   const grid=g.surveyGrid();if(grid.supply<grid.used)continue;
   FarwakeNeighbourhood.prepare(s,grid);
   if(FarwakeNeighbourhood.diagnostics().buildings.filter(b=>b.mode==='awake').length>=2){document.querySelector('#pause').click();g.advanceWorld(.001);g.draw(performance.now());return{day:s.day,minute:s.minute,camera:{...g.camera},grid,district:FarwakeNeighbourhood.diagnostics(),attendance:s.colonists.filter(p=>p.visit?.stage==='inside').map(p=>({id:p.id,name:p.name,task:p.task,visit:p.visit}))}}
  }throw Error('No genuinely inhabited evening found');
 });
 expect(evening.camera).toEqual(daylight.camera);
 expect(evening.district.buildings.filter(b=>b.strength>0).length).toBeGreaterThanOrEqual(2);
 await page.screenshot({path:info.outputPath('neighbourhood-night-390.png')});
 // Responsive geometry is checked on the same running colony, not a mockup.
 for(const [width,height] of [[320,740],[844,390]]){
  await page.setViewportSize({width,height});
  const box=await page.locator('#menu').boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await writeFile(info.outputPath('neighbourhood-pair-state.json'),JSON.stringify({daylight,evening,ui,errors},null,2));expect(errors).toEqual([]);
});

test.describe('actual neighbourhood movement recording',()=>{
 test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});
 test('E2 neighbourhood stays alive at ordinary 1x without task/route grants',async({page},info)=>{
  test.setTimeout(150000);const testWallStart=Date.now(),errors=[];page.on('pageerror',e=>errors.push(e.message));await loadColony(page);
  const start=await page.evaluate(()=>{
   const g=FARWAKE_TEST,s=g.state,b=s.buildings.find(b=>b.id===s.colonists[0].home);
   for(let i=0;i<120000;i++){
    g.tick(.025);
    const moving=s.colonists.filter(p=>p.path?.length>=4&&!p.visit?.stage?.includes('inside')&&p.x>b.x-1&&p.x<b.x+10&&p.y>b.y-3&&p.y<b.y+8);
    if(s.minute<540||s.minute>1050||!moving.length)continue;
    document.querySelector('#pause').click();g.advanceWorld(.001);
    Object.assign(g.camera,{x:(b.x+b.w/2+3.3)*32,y:(b.y+b.h/2+.5)*32,z:1});g.draw(performance.now());
    return{day:s.day,minute:s.minute,speed:document.querySelector('#speed').textContent,people:s.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task,path:p.path})),district:FarwakeNeighbourhood.diagnostics()};
   }throw Error('No real neighbourhood route found');
  });
  expect(start.speed).toBe('1×');
  await page.waitForTimeout(300);
  const takeStart=Date.now();await page.locator('#pause').click();
  const samples=[];
  for(let i=0;i<28;i++){await page.waitForTimeout(500);samples.push(await page.evaluate(()=>({day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,people:FARWAKE_TEST.state.colonists.map(p=>({id:p.id,x:p.x,y:p.y,task:p.task?.type,visit:p.visit?.stage})),district:FarwakeNeighbourhood.diagnostics()})))}
  const takeEnd=Date.now();await page.locator('#pause').click();
  await page.screenshot({path:info.outputPath('neighbourhood-movement-end-390.png')});
  const moved=start.people.filter(p=>samples.some(q=>{const v=q.people.find(q=>q.id===p.id);return Math.hypot(v.x-p.x,v.y-p.y)>1}));expect(moved.length).toBeGreaterThanOrEqual(1);expect(errors).toEqual([]);
  await writeFile(info.outputPath('neighbourhood-take.json'),JSON.stringify({testWallStart,takeStart,takeEnd,start,samples,movedIds:moved.map(p=>p.id),errors},null,2));
 });
});
