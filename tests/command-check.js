async function verifyCommand(frame,out){
 frame.src='candidate/index.html?slot=ui-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,d=w.document,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const click=q=>d.querySelector(q).click();
 try{
 for(const [width,height] of [[375,667],[390,844],[430,932],[844,390]]){
 frame.width=width;frame.height=height;await new Promise(r=>setTimeout(r,100));
 click('[data-nav="colony"]');ok(d.querySelector('h2').textContent==='Command Center','command opens at '+width+'×'+height);
 ok(d.querySelector('#sheet').scrollWidth<=d.querySelector('#sheet').clientWidth+1,'management fits phone width '+width);
 click('[data-open="industry"]');ok(d.querySelectorAll('[data-colony-weight]').length===7,'seven connected work groups exposed');
 const target=d.querySelector('[data-industry-target="wood"]');target.value=40;target.dispatchEvent(new w.Event('change',{bubbles:true}));
 ok(g.industryPolicy().targets.wood===40,'maintain timber target is wired');
 click('[data-sheet="close"]');g.showGuide('warehouse');
 ok(d.querySelector('#guide-entries').textContent.includes('warehouse'),'field guide search filters mechanics');
 const query=d.querySelector('#guide-query');query.value='stored carried';query.dispatchEvent(new w.Event('input',{bubbles:true}));
 ok(d.querySelectorAll('.guide-entry').length>0,'multiword search matches meaningful resource entries');
 click('[data-sheet="close"]');
 g.showBuilding(2);ok(d.querySelector('[data-freight-filter="ore"]')&&d.querySelector('h2').textContent==='Supply Cache','outdoor cache inspector has storage controls');
 click('[data-sheet="close"]');
 }
 g.showCommand();out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
