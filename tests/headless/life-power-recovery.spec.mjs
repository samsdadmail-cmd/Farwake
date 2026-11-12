import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('real pause, casting, site deliveries, turbine construction and fabrication resumption conserve alloy',async({page})=>{
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/manifest.webmanifest');
 const raw=readFileSync('tests/fixtures/saves/life-power-contention.json','utf8');
 await page.evaluate(raw=>localStorage.setItem('farwake_founders_alpha03_v1',raw),raw);await page.goto('/index.html');
 const before=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state,fab=s.buildings.find(b=>b.type==='fabricator'),shop=s.buildings.find(b=>b.type==='workshop');
  const total=(s.resources.alloy||0)+s.piles.filter(q=>q.kind==='alloy').reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind==='alloy'?p.carry.amount:0),0)+s.buildings.reduce((n,b)=>n+(b.siteStock?.alloy||0),0);
  g.showBuilding(fab.id);return {total,fab:fab.id,shopCycles:shop.production.cycles,fabCycles:fab.production.cycles,windCost:g.TYPES.wind.cost.alloy};
 });
 await page.locator(`[data-industry-pause="${before.fab}"]`).click();
 expect(await page.evaluate(id=>FARWAKE_TEST.state.buildings.find(b=>b.id===id).production.paused,before.fab)).toBe(true);
 const built=await page.evaluate(()=>{
  const g=FARWAKE_TEST,s=g.state;
  for(let i=0;i<4000&&!Object.entries(g.TYPES.wind.cost).every(([k,n])=>g.freightAvailable(k)>=n);i++)g.tick(.25);
  let wind;
  for(let y=30;y<50&&!wind;y++)for(let x=20;x<50&&!wind;x++)if(g.clearFootprint(x,y,2,2)&&!g.frontierPlacementReason('wind',x,y)&&g.buildAt('wind',x,y))wind=s.buildings.at(-1);
  if(!wind)throw Error('Real alloy casting did not fund a reachable turbine');
  for(let i=0;i<4000&&!wind.finished;i++)g.tick(.25);
  return {finished:wind.finished,siteStock:wind.siteStock,grid:g.surveyGrid()};
 });
 expect(built.finished).toBe(true);expect(built.siteStock).toBeUndefined();expect(built.grid.supply).toBeGreaterThanOrEqual(built.grid.used);
 await page.evaluate(id=>FARWAKE_TEST.showBuilding(id),before.fab);await page.locator(`[data-industry-pause="${before.fab}"]`).click();
 const after=await page.evaluate(before=>{
  const g=FARWAKE_TEST,s=g.state,fab=s.buildings.find(b=>b.id===before.fab),shop=s.buildings.find(b=>b.type==='workshop');
  for(let i=0;i<4000&&fab.production.cycles===before.fabCycles;i++)g.tick(.25);
  const total=(s.resources.alloy||0)+s.piles.filter(q=>q.kind==='alloy').reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind==='alloy'?p.carry.amount:0),0)+s.buildings.reduce((n,b)=>n+(b.siteStock?.alloy||0),0);
  return {total,shopCycles:shop.production.cycles,fabCycles:fab.production.cycles,paused:fab.production.paused,alive:s.colonists.every(p=>p.hunger<100&&p.energy>0)};
 },before);
 expect(after.fabCycles).toBeGreaterThan(before.fabCycles);expect(after.paused).toBe(false);expect(after.alive).toBe(true);
 expect(after.total).toBe(before.total+(after.shopCycles-before.shopCycles)-before.windCost-(after.fabCycles-before.fabCycles));
});

test('a transferred v4 colony never offers a missing browser-local recovery download',async({page})=>{
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto('/manifest.webmanifest');
 const raw=readFileSync('tests/fixtures/saves/life-power-contention.json','utf8');
 await page.evaluate(raw=>localStorage.setItem('farwake_founders_alpha03_v1',raw),raw);await page.goto('/index.html');
 await page.click('#menu');await page.click('[data-open="operations"]');
 await expect(page.locator('[data-life-recovery]')).toHaveCount(0);
 expect(await page.evaluate(()=>FARWAKE_TEST.state.v)).toBe(4);
});
