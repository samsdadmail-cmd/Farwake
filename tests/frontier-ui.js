async function verifyFrontierUI(frame,out){
 frame.src='candidate/index.html?slot=ui-frontier-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,d=w.document,qa=w.QA,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const click=q=>{const el=d.querySelector('#sheet '+q);if(!el)throw Error('Missing control '+q);el.click()};
 try{
 for(const [width,height] of [[375,667],[390,844],[430,932],[844,390]]){
  frame.width=width;frame.height=height;await new Promise(r=>setTimeout(r,100));
  qa.openSection('build');ok(d.querySelectorAll('.civil-blueprint').length>=27,'illustrated catalogue includes current and future designs '+width+'×'+height);
  ok(d.querySelector('#sheet').clientWidth>0&&d.querySelector('#sheet').scrollWidth<=d.querySelector('#sheet').clientWidth+1,'catalogue fits '+width+'×'+height);
  click('[data-blueprint-detail="fabricator"]');ok(d.querySelector('.chain-preview').textContent.includes('Components'),'future fabrication preview explains real chain');
  click('[data-tech-detail="fabrication"]');ok(d.querySelector('.unlock-preview').textContent.includes('Component Works'),'locked blueprint opens its meaningful research unlock');
  click('[data-open="research"]');click('[data-tech-view="discoveries"]');ok(d.querySelectorAll('.discovery-node').length>=26,'mobile discoveries expose the whole research catalogue');click('[data-tech-view="map"]');ok(d.querySelectorAll('.tech-links path').length>15,'connected research tree opens '+width+'×'+height);
  await new Promise(r=>setTimeout(r,160));click('[data-tech-branch="4"]');await new Promise(r=>setTimeout(r,160));ok(d.querySelector('#sheet .tech-viewport').scrollTop>1000,'branch navigation scrolls to planetary science '+d.querySelector('#sheet .tech-viewport').scrollTop+'/'+d.querySelector('#sheet .tech-viewport').scrollHeight);
  ok(d.querySelector('#sheet').clientWidth>0&&d.querySelector('#sheet').scrollWidth<=d.querySelector('#sheet').clientWidth+1,'research fits phone width');
  qa.openSection('colony');ok(d.querySelector('.civilization-hero')&&d.querySelector('.facility-list img'),'command journal shows actual colony and illustrated facilities');
  g.showBuilding(2);ok(d.querySelector('[data-freight-filter="ore"]'),'redesigned inspector retains storage filters');
  qa.openSection('world');ok(d.querySelector('.planet-record'),'survey retains mapped resource controls and adds discoveries');
  qa.openSection('preferences');ok(d.querySelectorAll('[data-volume]').length===4,'four independent audio volumes retained');
 }
 qa.openSection('build');out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
