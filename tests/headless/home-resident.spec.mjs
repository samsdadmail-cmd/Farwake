import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});

test('Aya lives one genuine evening: same saved colony outside, standing, reading and sleeping',async({page},info)=>{
 test.setTimeout(150000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/index.html?review=1');
 // Use the established Day-58 colony already used for A2, through the actual
 // import control. An optional evening is not guaranteed in a bare starter colony.
 page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>FARWAKE_TEST.state.day===58&&FARWAKE_TEST.state.colonists.length===8);
 const home=await page.evaluate(()=>{
  document.querySelector('#pause').click();
  return FARWAKE_TEST.state.colonists[0].home;
 });
 await page.waitForFunction(()=>FarwakeHomeResident.ready());
 // Find a genuine walking/idle moment. Only the camera is moved for framing.
 await page.evaluate(()=>{
  document.querySelector('#pause').click();
  const g=FARWAKE_TEST,p=g.state.colonists[0];for(let i=0;i<2000;i++){g.tick(.05);g.advanceWorld(.05);if(p.path.length&&FarwakeDoors.visible(p)>.99&&FarwakePeople.pose(p).work<.01)break}
  document.querySelector('#pause').click();
  Object.assign(g.camera,{x:p.x*32,y:p.y*32,z:1.7});g.draw(performance.now());
 });
 await page.waitForFunction(()=>FarwakeHomeResident.worldInfo().rendered);
 await page.screenshot({path:info.outputPath('aya-outdoors-390.png')});
 const evening=await page.evaluate(home=>{
  document.querySelector('#pause').click();
  const g=FARWAKE_TEST,p=g.state.colonists[0],b=g.state.buildings.find(b=>b.id===home);
  for(let i=0;i<30000;i++){
   g.tick(.05);
   const q=FarwakeHomeResident.plan(g.state,b,g.lifeView);
   if(p.task?.afterLeisure&&q?.pose==='standing'){
    document.querySelector('#pause').click();
    return{day:g.state.day,minute:g.state.minute,action:p.action,task:p.task.type,visit:{...p.visit},home:p.home,memories:p.life.memories.length};
   }
  }
  throw Error('Aya never autonomously attended an awake home wind-down: '+JSON.stringify({day:g.state.day,minute:g.state.minute,task:p.task,visit:p.visit,home:p.home,energy:p.energy,hunger:p.hunger,life:p.life}));
 },home);
 await page.evaluate(()=>FARWAKE_TEST.save());
 const savedColony=await page.evaluate(()=>Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>{try{const s=JSON.parse(v);return s.v===4&&s.seed===FARWAKE_TEST.state.seed&&s.colonists?.length===8}catch{return false}}));
 await writeFile(info.outputPath('same-colony-v4.json'),savedColony);
 expect(evening.task).toBe('life_home');expect(evening.visit.stage).toBe('inside');expect(evening.home).toBe(home);expect(evening.memories).toBeGreaterThan(0);
 await page.evaluate(id=>FARWAKE_TEST.showBuilding(id),home);await page.locator('[data-home-enter]').click();
 await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='inside'&&FARWAKE_TEST.homeDiagnostics.residents[0]?.pose==='standing');
 await page.screenshot({path:info.outputPath('aya-standing-whole-390.png')});
 await page.locator('#homeview').click();await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='room');
 await page.screenshot({path:info.outputPath('aya-standing-room-390.png')});
 await page.waitForTimeout(1200); // Keep the real paused standing state visible in the review recording.
 await page.locator('#homepause').click();
 await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.residents[0]?.pose==='seated',{},{timeout:20000});
 await page.screenshot({path:info.outputPath('aya-seated-room-390.png')});
 await page.locator('#homeview').click();await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='home');
 await page.screenshot({path:info.outputPath('aya-seated-whole-390.png')});
 await page.locator('#homeview').click();await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='room');
 // Ordinary simulation now runs uninterrupted until actual night rest starts.
 await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.residents[0]?.pose==='sleeping',{},{timeout:95000});
 await page.locator('#homepause').click();
 const rest=await page.evaluate(()=>{const g=FARWAKE_TEST,p=g.state.colonists[0];return{task:p.task.type,stage:p.visit.stage,building:p.visit.building,action:p.action,v:g.state.v,diagnostics:g.homeDiagnostics.residents[0]}});
 expect(rest.task).toBe('rest');expect(rest.stage).toBe('inside');expect(rest.building).toBe(home);expect(rest.action).toBeGreaterThan(1);expect(rest.v).toBe(4);
 for(let i=0;i<5;i++)await page.locator('#homecanvas').press('ArrowLeft');
 await page.waitForFunction(()=>!!FARWAKE_TEST.homeDiagnostics.layout);
 await page.screenshot({path:info.outputPath('aya-sleeping-room-390.png')});
 await page.locator('#homeview').click();await page.waitForFunction(()=>FARWAKE_TEST.homeDiagnostics.layout?.view==='home');
 await page.screenshot({path:info.outputPath('aya-sleeping-whole-390.png')});
 await page.waitForTimeout(1200);
 await page.locator('#homeexit').click();await page.waitForFunction(()=>FARWAKE_TEST.homePhase==='idle');
 await page.evaluate(()=>{FARWAKE_TEST.save();if(!FARWAKE_TEST.load())throw Error('Post-evening save rejected')});
 await writeFile(info.outputPath('genuine-state-evidence.json'),JSON.stringify({evening,rest},null,2));
 expect(errors).toEqual([]);
});
