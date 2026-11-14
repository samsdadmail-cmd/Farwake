import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test.use({viewport:{width:390,height:844},video:{mode:'on',size:{width:390,height:844}}});
async function colony(page){
 page.on('dialog',d=>d.accept());await page.goto('/index.html?review=1');
 await page.getByRole('button',{name:'Game and Save',exact:true}).click();
 await page.locator('#import-expedition-file').setInputFiles('tests/fixtures/home-composition-day58.json');
 await page.waitForFunction(()=>window.FARWAKE_TEST?.state?.day===58&&FarwakeHomeResident.ready());
 await page.locator('#pause').click();
 await page.waitForFunction(()=>{FARWAKE_TEST.draw(performance.now());return FarwakeHomeResident.worldInfo().rendered});
}
test('Aya authored identity covers stationary activities, cargo and transitions without save writes',async({page},info)=>{
 await colony(page);
 const report=await page.evaluate(()=>{
  const g=FARWAKE_TEST,before=JSON.stringify(g.state),c=document.createElement('canvas');c.width=420;c.height=520;const ctx=c.getContext('2d');ctx.fillStyle='#203b40';ctx.fillRect(0,0,420,520);
  const original=g.state.colonists.find(p=>p.id===1),rows=[];
  const cases=[['ore','harvest'],['tree','harvest'],['research','research'],['craft','craft'],['farm','farm'],['forage','forage'],['meal','eat'],['rest','rest'],['conversation','social'],['reading','life_home'],['plants','life_quiet'],['sky','life_quiet'],['tinkering','life_quiet'],['project','life_share'],['cargo','haul_dropoff']];
  for(let n=0;n<cases.length;n++){
   const [kind,type]=cases[n],p={...original,x:0,y:0,path:[],task:{type,x:0,y:0},carry:kind==='cargo'?{kind:'ore',amount:3}:null};
   const leisure=['reading','plants','sky','tinkering','project','conversation'].includes(kind)?{kind,phase:'active'}:null;
   const v=FarwakePeople.pose(p);Object.assign(v,{work:['ore','tree','research','craft','farm','forage'].includes(kind)?1:0,kind,stroke:.55,walk:0,travelSpeed:0,leisure,reduced:false,held:!!p.carry,drop:0,lift:0});
   const snapshot=JSON.stringify(p),x=52+(n%5)*82,y=80+Math.floor(n/5)*130;
   ctx.save();ctx.translate(x,y);ctx.scale(2,2);FarwakePeople.draw(ctx,p,32,1000,false,2);ctx.restore();
   rows.push({kind,type,art:{...FarwakeHomeResident.worldInfo()},immutable:JSON.stringify(p)===snapshot});
   ctx.fillStyle='#e5ebe1';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(kind,x,y+32);
  }
  // A non-Aya identity must remain on its existing renderer.
  const other={...original,id:99};const excluded=FarwakeHomeResident.drawWorld(ctx,other,FarwakePeople.pose(other),32,false)===false;
  // Paused and reduced-motion props are determined by frozen presentation state.
  const p={...original,x:0,y:0,path:[],task:{type:'harvest',x:0,y:0},carry:null},v=FarwakePeople.pose(p);
  Object.assign(v,{work:1,kind:'ore',stroke:.4,reduced:true,walk:0,travelSpeed:0});
  const pixels=()=>{const c=document.createElement('canvas');c.width=c.height=90;const x=c.getContext('2d');x.translate(45,45);FarwakePeople.draw(x,p,32,Math.random()*10000,false,1);return c.toDataURL()};
  const frozen=pixels()===pixels();
  const result={rows,excluded,frozen,stateUnchanged:before===JSON.stringify(g.state),sheet:c.toDataURL(),cacheCount:FarwakeHomeResident.cacheCount()};return result;
 });
 for(const row of report.rows){expect(row.art.rendered,row.kind).toBe(true);expect(row.art.id,row.kind).toBe(1);expect(row.art.task,row.kind).toBe(row.type);expect(row.immutable,row.kind).toBe(true)}
 expect(report.excluded).toBe(true);expect(report.frozen).toBe(true);expect(report.stateUnchanged).toBe(true);expect(report.cacheCount).toBeLessThan(35);
 await writeFile(info.outputPath('isolated-activity-matrix.png'),Buffer.from(report.sheet.split(',')[1],'base64'));
 delete report.sheet;await writeFile(info.outputPath('isolated-render-checks.json'),JSON.stringify({...report,note:'Isolated renderer regression matrix, not gameplay scenes. Dummy presentation objects only; the loaded colony is unchanged.'},null,2));
});

test('Aya genuine player-ordered mining and subsequent activity at normal 1x',async({page},info)=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await colony(page);
 await page.getByRole('button',{name:'Open People',exact:true}).click();await page.locator('#sheet [data-action="crew"][data-id="1"]').click();
 await page.getByText('Home, responsibilities & wellbeing',{exact:true}).click();await page.locator('[data-sheet="work"][data-work="gather"]').click();await page.locator('[data-sheet="close"]').click();
 const candidates=await page.evaluate(()=>{const g=FARWAKE_TEST,p=g.state.colonists[0];return g.features.filter(f=>f.type==='ore').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,12).map(f=>({id:f.id,x:f.x,y:f.y}))});
 let target;
 for(const f of candidates){
  await page.evaluate(f=>{Object.assign(FARWAKE_TEST.camera,{x:(f.x+.5)*32,y:(f.y+.5)*32,z:1.5});FARWAKE_TEST.draw(performance.now())},f);
  await page.locator('#world').click({position:{x:195,y:422}});
  if(await page.locator('[data-inspect="designate"]').count()){await page.locator('[data-inspect="designate"]').click();target=f;break}
 }
 expect(target,'A visible real mineral outcrop').toBeTruthy();
 const start=await page.evaluate(()=>{
  const g=FARWAKE_TEST,p=g.state.colonists[0];document.querySelector('#pause').click();
  for(let i=0;i<90000;i++){g.tick(.025);g.advanceWorld(.025);if(p.task?.type==='harvest'&&!p.path.length&&g.features.find(f=>f.id===p.task.feature)?.type==='ore'){
   document.querySelector('#pause').click();window.AYA_FOLLOW=true;const follow=()=>{if(window.AYA_FOLLOW){const p=FARWAKE_TEST.state.colonists[0],v=FarwakePeople.pose(p);Object.assign(FARWAKE_TEST.camera,{x:v.x*32,y:v.y*32,z:2});}requestAnimationFrame(follow)};requestAnimationFrame(follow);
   return{day:g.state.day,minute:g.state.minute,task:{...p.task},action:p.action,work:FarwakePeople.pose(p).work,speed:document.querySelector('#speed').textContent};
  }}throw Error('Aya did not genuinely reach the player-designated mineral outcrop');
 });
 await page.evaluate(()=>FARWAKE_TEST.draw(performance.now()));await page.screenshot({path:info.outputPath('aya-mining-390.png'),animations:'disabled'});
 const takeStart=Date.now();await page.locator('#pause').click();const samples=[];
 for(let i=0;i<40;i++){await page.waitForTimeout(500);samples.push(await page.evaluate(()=>{const p=FARWAKE_TEST.state.colonists[0];return{time:performance.now(),day:FARWAKE_TEST.state.day,minute:FARWAKE_TEST.state.minute,task:p.task?.type,carry:p.carry,path:p.path.length,visible:FarwakeDoors.visible(p),art:{...FarwakeHomeResident.worldInfo()}}}))}
 await page.locator('#pause').click();const takeEnd=Date.now();await page.evaluate(()=>window.AYA_FOLLOW=false);await page.screenshot({path:info.outputPath('aya-after-mining-390.png'),animations:'disabled'});
 expect(start.speed).toBe('1×');expect(samples.some(s=>s.art.prop==='ore')).toBe(true);
 expect(samples.some(s=>s.task!=='harvest')).toBe(true);
 for(const s of samples.filter(s=>s.visible>.99)){expect(s.art.rendered).toBe(true);expect(s.art.id).toBe(1)}
 expect(errors).toEqual([]);await page.evaluate(()=>{FARWAKE_TEST.save();if(!FARWAKE_TEST.load())throw Error('Post-activity save refused')});
 await writeFile(info.outputPath('actual-mining-take.json'),JSON.stringify({target,start,takeStart,takeEnd,samples,errors,note:'Actual original Day-58 import. Player selects Salvaging for Aya and designates an existing visible ore outcrop through UI. Normal simulation advances only to arrival; then ordinary unchanged 1x runs for the uninterrupted take. No task/path/resource/attendance grants. Only camera and diagnostic samples follow Aya. Isolated render matrix is separate evidence.'},null,2));
});
