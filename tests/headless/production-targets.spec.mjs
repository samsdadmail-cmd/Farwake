import {test, expect} from '@playwright/test';

test('whole smelting batch crosses a non-divisible stock target using delivered ore', async ({page}) => {
  await page.addInitScript(() => {window.requestAnimationFrame=()=>0;});
  await page.goto('/index.html');
  const result=await page.evaluate(() => {
    const g=FARWAKE_TEST,s=g.state;
    // Isolate the reported late-game 48/50 boundary, without replaying 65 days.
    // The facility and starting inputs are fixtures; all delivery/work/output is real.
    s.minute=600;
    for(const k of Object.keys(s.resources))s.resources[k]=0;
    Object.assign(s.resources,{metal:48,ore:4,food:30});
    g.freightInit();Object.assign(g.industryPolicy().targets,{metal:50,ore:0});s.designations={};
    let shop;
    for(let y=25;y<40&&!shop;y++)for(let x=20;x<40&&!shop;x++){
      if(g.clearFootprint(x,y,3,2)&&!g.frontierPlacementReason('smelter',x,y)){
        shop={id:9001,type:'smelter',x,y,w:3,h:2,finished:true,progress:100};
        s.buildings.push(shop);
      }
    }
    if(!shop)throw Error('No reachable smelter fixture footprint');
    s.buildings.push({id:9002,type:'wind',x:2,y:2,w:2,h:2,finished:true,progress:100});
    const record=g.productionRecord(shop);
    const worker=s.colonists.find(p=>p.role==='Engineer');record.worker=worker.id;
    for(const p of s.colonists)Object.assign(p,{energy:95,hunger:5,task:null,path:[],carry:null});
    const owned=k=>(s.resources[k]||0)+s.piles.filter(q=>q.kind===k).reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0)+s.buildings.reduce((n,b)=>n+(b.siteStock?.[k]||0),0);
    let delivered=false;
    for(let i=0;i<6000&&record.cycles<1;i++){
      g.tick(.1);delivered ||= (shop.siteStock?.ore||0)>0;
    }
    for(let i=0;i<200;i++)g.tick(.1);
    g.save();g.load();
    return {delivered,cycles:record.cycles,output:record.output,metal:owned('metal'),ore:owned('ore'),reason:g.productionBlock(g.state.buildings.find(b=>b.id===shop.id)),cost:g.TYPES.observatory.cost.metal,saved:g.state.buildings.find(b=>b.id===shop.id).production.output};
  });
  expect(result.delivered).toBe(true);
  expect(result.cycles).toBe(1);
  expect(result.output).toBe(5);
  expect(result.metal).toBe(53);
  expect(result.ore).toBe(0);
  expect(result.reason).toContain('target');
  expect(result.cost).toBe(50);
  expect(result.saved).toBe(5);
});
