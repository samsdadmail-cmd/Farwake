async function verifyEditor(frame,out){
 const slot='editor-'+Date.now();
 frame.src='candidate/index.html?slot='+slot;
 await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,s=g.state,d=w.document,lines=[];
 const ok=(test,label)=>{if(!test)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 const tick=(test)=>{for(let n=0;n<12000&&!test();n++)g.tick(.1);return test()};
 const balance=k=>(s.resources[k]||0)+s.piles.filter(q=>q.kind===k).reduce((n,q)=>n+q.amount,0)+s.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0)+s.buildings.reduce((n,b)=>n+(b.siteStock?.[k]||0),0);
 try{
 g.editorBegin('path');
 const c=d.querySelector('#world'),r=c.getBoundingClientRect();
 const input=(type,x,y)=>c.dispatchEvent(new w.PointerEvent(type,{pointerId:1,pointerType:'touch',bubbles:true,clientX:r.left+r.width/2+(x*32-g.camera.x)*g.camera.z,clientY:r.top+r.height/2+(y*32-g.camera.y)*g.camera.z}));
 const before=s.resources.scrap;
 input('pointerdown',24.5,30.5);input('pointermove',24.5,32.5);input('pointermove',25.5,32.5);input('pointerup',25.5,32.5);
 ok(g.editorPlan().valid&&g.editorPlan().add.length===4,'touch draws a continuous four-tile corner');
 g.editorConfirm();
 ok(s.buildings.filter(b=>b.type==='path').length===4&&s.resources.scrap===before-4,'batch confirmation reserves exact material cost');
 ok(tick(()=>s.buildings.filter(b=>b.type==='path'&&b.finished).length===4),'workers haul material and build all path tiles');
 const path=s.buildings.find(b=>b.type==='path');
 g.editorOrder(path,'demolish');
 ok(tick(()=>!s.buildings.includes(path)),'colonist dismantles a completed path');
 ok(balance('scrap')>=before-4+1,'path paving recovered physically');
 ok(g.buildAt('shelter',30,30),'place home');
 const home=s.buildings.find(b=>b.type==='shelter');
 ok(tick(()=>home.finished),'crew supplies and builds home');
 const start={x:home.x,y:home.y};
 g.editorBegin('move',home);g.editor.end={x:30,y:33};ok(g.editorPlan().valid,'new location preview valid');g.editorConfirm();
 ok(home.x===start.x&&home.editOrder,'relocation begins with a dismantling order');
 ok(tick(()=>home.x===30&&home.y===33&&home.finished),'crew dismantles then reconstructs at destination');
 ok(g.buildAt('shed',30,30),'place cancellable supply shed');
 const shed=s.buildings.find(b=>b.type==='shed');const funds=balance('wood');g.editorCancelSite(shed);
 ok(!s.buildings.includes(shed)&&balance('wood')===funds,'cancel blueprint conserves reserved timber');
 g.editorBegin('mark');const f=g.features.find(f=>w.QA.fog[f.y*56+f.x]&&f.type==='tree');g.editor.start={x:f.x,y:f.y};g.editor.end={x:f.x+2,y:f.y+2};let n=g.editorPlan().list.length;g.editorConfirm();
 ok(n>0&&g.queuedWork()>0,'area designation queues real resource jobs');
 ok(w.FarwakeBuildings.entrance({type:'supplies'})==null,'supply pallet explicitly exterior');
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
