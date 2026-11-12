import {test,expect} from '@playwright/test';
test('profile real simulation and rendering with five, twenty and forty settlers',async({page},info)=>{
 test.setTimeout(150000);
 if(info.project.name!=='chromium')test.skip(true,'CPU profiling is collected once in Chromium; functional coverage also runs in WebKit.');
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto('/index.html');
 const reports=[];
 for(const count of [5,20,40]){
  reports.push(await page.evaluate(count=>{
   const g=FARWAKE_TEST,s=g.state,founders=s.colonists.slice(0,5);s.minute=1093;
   if(count>5)s.colonists=Array.from({length:count},(_,i)=>({...founders[i%5],id:200+i,life:null,visit:null,task:null,path:[],carry:null,x:25.5+i%6,y:28.5+Math.floor(i/6)}));
   const tick=[],draw=[];for(let i=0;i<90;i++){const a=performance.now();g.tick(1/30);const b=performance.now();g.advanceWorld(1/30);g.draw(i*33+1000);const c=performance.now();if(i>15){tick.push(b-a);draw.push(c-b)}}
   const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
   return{people:count,synthetic:count>5,tick:stats(tick),presentationAndDraw:stats(draw)};
  },count));
 }
 console.log('OVERHAUL_CPU_PROXY '+JSON.stringify(reports));await info.attach('cpu-profile.json',{body:JSON.stringify({note:'Desktop software Chromium, iPhone-sized viewport; synchronous CPU samples, not physical iPhone FPS. Early layout, not a mature colony benchmark.',reports},null,2),contentType:'application/json'});
 for(const r of reports){expect(Number.isFinite(r.tick.max)).toBe(true);expect(r.tick.max).toBeLessThan(5000)}
});
