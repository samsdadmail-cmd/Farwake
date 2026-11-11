async function verifyResearch(frame,out){
 frame.src='candidate/index.html?slot=research-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const study=id=>{g.research(id);for(let n=0;n<15000&&!s.research.includes(id);n++)g.tick(.1)};
 try{
 s.resources.knowledge=500;
 ok(g.researchReason('metallurgy').includes('Requires'),'advanced manufacturing has technology prerequisite');
 study('energy');ok(s.research.includes('energy'),'existing energy research still unlocks');
 ok(g.researchReason('metallurgy').includes('batches'),'production accomplishment gates advanced metallurgy');
 s.buildings.push({id:999,type:'workshop',x:24,y:23,w:3,h:2,finished:true,progress:100},{id:998,type:'solar',x:30,y:30,w:2,h:2,finished:true,progress:100});
 g.industryPolicy().batches=3;study('metallurgy');
 ok(s.research.includes('metallurgy'),'manufacturing accomplishment unlocks precision recipe');
 ok(g.researchDefinition('metallurgy').description.includes('two alloy'),'research communicates actual efficient recipe');
 s.explore=4;study('optics');ok(g.surveyRadius()===7,'optics expands survey reveal radius');
 s.buildings.push({id:997,type:'battery',x:33,y:30,w:2,h:2,finished:true,progress:100});
 s.minute=600;g.surveyGridTick(10);const charged=g.surveyGrid();
 ok(charged.charge>0&&charged.cap===120,'power bank charges real surplus');
 s.buildings.push({id:996,type:'comms',x:26,y:33,w:2,h:2,finished:true,progress:100});
 s.buildings.push({id:995,type:'shelter',x:30,y:33,w:3,h:2,finished:true,progress:100});
 s.minute=1300;const night=g.surveyGrid();g.surveyGridTick(1);
 ok(night.output>0&&g.surveyGrid().charge<charged.charge,'battery discharges against real nighttime deficit');
 const regular=(()=>{s.minute=600;return g.surveyGrid().generation})();study('heliostat');
 ok(g.surveyGrid().generation===regular+4,'solar tracking adds four actual daytime power');
 s.goal=4;s.ruin.seen=true;g.tick(.1);ok(s.goal>=5,'post-beacon goal follows landmark discovery');
 g.save();g.load();ok(g.state.research.includes('metallurgy')&&g.state.gridCharge>=0,'advanced research and stored energy survive load');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
