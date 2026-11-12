import {test,expect} from '@playwright/test';
test('render the field interface, real social phases and occupied home in phone orientations',async({page},info)=>{
 test.setTimeout(120000);await page.setViewportSize({width:1200,height:1000});
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/tests/experience-review.html');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.FARWAKE_TEST?.state);
 const phone=page.locator('#game'),world=page.frameLocator('#game');
 await page.evaluate(()=>{const w=document.querySelector('iframe').contentWindow;w.FARWAKE_TEST.draw(1000)});
 await phone.screenshot({path:info.outputPath('01-field-portrait.png')});
 await world.locator('[data-nav="build"]').click();await phone.screenshot({path:info.outputPath('02-construction.png')});await world.locator('[data-sheet="close"]').click();
 await world.locator('[data-nav="research"]').click();await phone.screenshot({path:info.outputPath('03-research.png')});await world.locator('[data-sheet="close"]').click();
 await page.locator('#evening').click();
 const phases=[];let elapsed=0;
 for(const [phase,seconds] of [['greeting',5],['sharing',9],['goodbye',18],['complete',7]]){
  elapsed+=seconds;
  const state=await page.evaluate(({seconds,elapsed})=>{const w=document.querySelector('iframe').contentWindow,g=w.FARWAKE_TEST;w.FieldPreferences.change('dialogue','off');for(let i=0;i<seconds*10;i++){g.tick(.1);g.advanceWorld(.1)}g.renderUI();g.draw(1000+elapsed*1000);return {phase:g.lifeRoot().sessions[0]?.progress,people:g.state.colonists.map(p=>({name:p.name,x:p.x,y:p.y,task:p.task?.type,view:g.lifeView(p)?.kind,bonds:p.life.bonds,memories:p.life.memories}))}},{seconds,elapsed});
  phases.push({label:phase,...state});await phone.screenshot({path:info.outputPath('04-evening-'+phase+'.png')});
 }
 expect(phases[0].people.some(p=>p.task==='life_share')).toBe(true);expect(phases[1].phase).toBeGreaterThan(6);expect(phases[2].phase).toBeGreaterThanOrEqual(27);expect(phases[3].people.filter(p=>p.bonds.length)).toHaveLength(2);
 await world.locator('[data-nav="crew"]').click();await world.locator('#sheet [data-action="crew"]').first().click();await phone.screenshot({path:info.outputPath('05-character.png')});await world.locator('[data-sheet="close"]').click();
 const image=page.waitForResponse(r=>r.url().endsWith('/interior-home.webp')&&r.status()===200);await page.locator('#cabin').click();await image;
 await page.evaluate(async()=>{const w=document.querySelector('iframe').contentWindow,im=new w.Image();im.src=new URL('interior-home.webp',w.document.baseURI).href;await im.decode();w.FARWAKE_TEST.draw(200000)});
 await expect(world.locator('#facility-readout')).toContainText('Inside: Aya Mercer, Tomas Venn');await phone.screenshot({path:info.outputPath('06-occupied-home.png')});
 await page.locator('#viewport').selectOption('844,390');await page.evaluate(()=>document.querySelector('iframe').contentWindow.FARWAKE_TEST.draw(210000));await phone.screenshot({path:info.outputPath('07-home-landscape.png')});
 await info.attach('actual-scene-history.json',{body:JSON.stringify({note:'Isolated fed/evening and home fixtures. Real pathfinding, attendance and reward logic; simulation time advanced manually. These are rendered gameplay screenshots, not physical-device evidence.',phases},null,2),contentType:'application/json'});
});
