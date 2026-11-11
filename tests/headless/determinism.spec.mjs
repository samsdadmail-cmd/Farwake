import {test,expect} from '@playwright/test';

test('same expedition and ticks produce the same work under different wall clocks and random sources',async({browser})=>{
  const results=[];
  for(const variant of [0,1]){
    const context=await browser.newContext();const page=await context.newPage();
    await page.addInitScript(v=>{
      window.requestAnimationFrame=()=>0;
      Math.random=()=>v?.9:.1;
      performance.now=()=>v?100000:0;
    },variant);
    await page.goto('/index.html');
    results.push(await page.evaluate(()=>{
      const g=FARWAKE_TEST,s=g.state;
      const tree=g.features.find(f=>f.type==='tree'&&Math.hypot(f.x-28,f.y-28)<10);
      if(!tree||!g.designateFeature(tree.id))throw Error('No actual discovered tree to designate');
      for(let i=0;i<6000;i++)g.tick(.1);
      return {resources:s.resources,minute:s.minute,harvested:s.harvested,designations:s.designations,people:s.colonists.map(p=>({id:p.id,x:p.x,y:p.y,energy:p.energy,hunger:p.hunger,task:p.task,path:p.path,carry:p.carry})),explore:s.explore};
    }));
    await context.close();
  }
  expect(results[0].harvested.length).toBeGreaterThan(0);
  expect(results[1]).toEqual(results[0]);
});
