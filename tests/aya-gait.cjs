const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={window:{}};
for(const f of ['people.js','home-resident.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),box);
const people=box.window.FarwakePeople,art=box.window.FarwakeHomeResident;
function run(hz){
 const p={id:1,name:'Aya Mercer',role:'Commander',coat:'#ecb872',hair:'#302c37',hue:'#ffc79e',x:0,y:0,path:[{x:20,y:0}]};
 const before=JSON.stringify(p);people.pose(p);assert.equal(JSON.stringify(p),before);
 const dt=1/hz,segments=[],sounds=[];
 for(const speed of [1.5,.45,0]){
  const first={...people.pose(p)},contacts=[];
  for(let i=0;i<hz*2;i++){
   p.x+=speed*dt;
   const v=people.advance(p,dt,false,1,{onSound:k=>sounds.push(k)}),g=art.gait(v);
   if(g.walking&&g.beat%2===0&&contacts.at(-1)!==g.beat)contacts.push(g.beat);
  }
  const last={...people.pose(p)};
  segments.push({distance:last.x-first.x,phase:last.phase-first.phase,contacts,pose:last});
 }
 // Slower movement has fewer contacts, with the same distance-to-phase ratio.
 assert(segments[0].contacts.length>segments[1].contacts.length);
 for(const s of segments)assert(Math.abs(s.phase/s.distance-8)<1e-8);
 assert.equal(art.gait(segments[2].pose).walking,false,'no stationary marching from residual blend');
 const v=people.pose(p),still={...v},count=sounds.length;
 for(let i=0;i<hz;i++)people.advance(p,dt,false,1,{onSound:k=>sounds.push(k)});
 assert.equal(sounds.length,count,'no footsteps at rest');assert(Math.abs(v.phase-still.phase)<.00001);
 const paused={...v};p.x+=1;people.advance(p,.3,true,1);assert.equal(JSON.stringify(v),JSON.stringify(paused),'pause freezes presentation');
 const phase=v.phase;v.dir='left';const left=art.gait(v);v.dir='back';const up=art.gait(v);
 assert.equal(left.cycle,up.cycle,'turns preserve support-leg phase');assert.equal(v.phase,phase);
 return segments;
}
const a=run(30),b=run(60);
assert(Math.abs(a[2].pose.x-b[2].pose.x)<.001,'frame rate independent resting position');
assert(Math.abs(a[2].pose.phase-b[2].pose.phase)<.001,'frame rate independent cadence');
console.log('Aya real presentation: speed-paced contacts, slowdown, rest, pause, turns and 30/60 Hz parity PASS');
