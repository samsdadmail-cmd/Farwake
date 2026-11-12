import {test,expect} from '@playwright/test';
test('profile real simulation and rendering with five, twenty and forty settlers',async({page},info)=>{
 test.setTimeout(150000);
 if(info.project.name!=='chromium')test.skip(true,'CPU profiling is collected once in Chromium; functional coverage also runs in WebKit.');
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const reports=[];
 for(const layout of ['early','mature']){
 await page.goto('/index.html?review=1');
 if(layout==='mature'){await page.addScriptTag({path:'perf/scenes.js'});await page.evaluate(async()=>{window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),0);try{await FarwakePerfScenes.apply(window,FarwakePerfScenes.resolve('late'))}finally{window.requestAnimationFrame=()=>0}})}
 for(const count of [5,20,40]){
  reports.push(await page.evaluate(({count,layout})=>{
   const g=FARWAKE_TEST,s=g.state,founders=s.colonists.slice(0,5);s.minute=1093;
   if(count!==s.colonists.length)s.colonists=Array.from({length:count},(_,i)=>({...founders[i%5],id:200+i,life:null,visit:null,task:null,path:[],carry:null,x:founders[i%5].x,y:founders[i%5].y}));
   const tick=[],draw=[];for(let i=0;i<90;i++){const a=performance.now();g.tick(1/30);const b=performance.now();g.advanceWorld(1/30);g.draw(i*33+1000);const c=performance.now();if(i>15){tick.push(b-a);draw.push(c-b)}}
   const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
   return{layout,buildings:s.buildings.length,people:count,synthetic:layout==='mature'||count>5,tick:stats(tick),presentationAndDraw:stats(draw)};
  },{count,layout}));
 }
 }
 console.log('OVERHAUL_CPU_PROXY '+JSON.stringify(reports));await info.attach('cpu-profile.json',{body:JSON.stringify({note:'Desktop software Chromium, iPhone-sized viewport; synchronous CPU samples, not physical iPhone FPS. Early layout and the existing 124-structure synthetic mature scene. Warm synchronous samples do not establish full-session FPS or eliminate known late-colony hitches.',reports},null,2),contentType:'application/json'});
 for(const r of reports){expect(Number.isFinite(r.tick.max)).toBe(true);expect(r.tick.max).toBeLessThan(5000)}
});
