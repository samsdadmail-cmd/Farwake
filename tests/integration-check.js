async function verifyIntegration(frame,out){
 const slot='integration-'+Date.now();frame.src='candidate/index.html?slot='+slot;await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,qa=w.QA,d=w.document,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 try{
 const initial=g.state.colonists.slice();
 for(const count of [5,20,40]){
   g.state.colonists=Array.from({length:count},(_,i)=>({...initial[i%5],id:i+1,x:24+i%8*.5,y:29+Math.floor(i/8)*.4,task:null,path:[],visit:null,home:null}));
   g.housingAllocate();
   const samples=[];
   for(let i=0;i<24;i++){let t=performance.now();g.tick(1/60);g.advanceWorld(1/60);g.draw(2000+i*16);if(i>=4)samples.push(performance.now()-t)}
   samples.sort((a,b)=>a-b);
   lines.push(count+' founders: median tick, motion and canvas submission '+samples[10].toFixed(2)+' ms');
 }
 g.state.colonists=initial;g.housingAllocate();
 for(const [width,height] of [[375,667],[390,844],[430,932],[844,390]]){
   frame.width=width;frame.height=height;await new Promise(r=>setTimeout(r,90));
   for(const section of ['build','colony','resources','world','research','industry','guide','crew']){
     qa.openSection(section);const sheet=d.querySelector('#sheet');
     ok(sheet.scrollWidth<=sheet.clientWidth+1,section+' fits '+width+'×'+height);
     d.querySelector('[data-sheet="close"]').click();
   }
 }
 const home={id:700,type:'shelter',x:30,y:30,w:3,h:2,finished:true,progress:100};g.state.buildings.push(home);g.housingAllocate();
 const p=g.state.colonists[0];p.home=home.id;p.energy=20;p.hunger=10;p.task=null;p.path=[];g.state.minute=1300;
 for(let n=0;n<2000&&p.visit?.stage!=='inside';n++)g.tick(.1);
 ok(p.visit?.stage==='inside'&&p.task?.type==='rest','nighttime resident actually enters assigned home');
 g.save();g.load();
 const resident=g.state.colonists.find(v=>v.id===p.id);
 ok(resident.visit?.stage==='inside'&&resident.home===home.id,'indoor stay resumes with permanent address');
 g.showBuilding(home.id);ok(d.querySelector('#facility-readout').textContent.includes(resident.name),'facility inspector lists real indoor resident');
 qa.openSection('preferences');ok(d.querySelectorAll('[data-volume]').length===4,'Living World four-channel sound controls retained');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
