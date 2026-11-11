// Run from a disposable origin with an iframe containing a fresh 0.3.8 save.
async function verifyCandidate(frame) {
 const w=frame.contentWindow, d=w.document, game=w.FARWAKE_TEST, s=game.state;
 const checks=[];
 function check(value,label){if(!value)throw Error(label);checks.push(label)}
 function click(selector){const element=d.querySelector(selector);if(!element)throw Error(selector);element.click()}
 function advance(test){for(let i=0;i<3600&&!test();i++)game.tick(.1);return test()}
 check(s.seed==='FW-10402'&&s.colonists.length===5,'v3 expedition loaded');
 for(const [width,height] of [[375,667],[390,844],[430,932],[844,390]]){
   frame.width=width;frame.height=height;
   await new Promise(resolve=>setTimeout(resolve,120));
   click('[data-nav="build"]');
   check(d.querySelectorAll('[data-build]').length>=9&&d.querySelector('#sheet').scrollWidth<=d.querySelector('#sheet').clientWidth+1,'catalog fits '+width+'×'+height);
   click('[data-sheet="close"]');
   click('[data-resource-open]');
   check(d.querySelectorAll('.ledger tbody tr').length===5&&d.querySelector('table').getBoundingClientRect().right<=width,'inventory fits '+width+'×'+height);
   click('[data-sheet="close"]');
 }
 click('[data-nav="build"]');click('[data-build="shed"]');
 const canvas=d.querySelector('#world'),r=canvas.getBoundingClientRect(), camera=game.camera;
 const point={clientX:r.left+r.width/2+(31.5*32-camera.x)*camera.z,clientY:r.top+r.height/2+(31.5*32-camera.y)*camera.z};
 for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new w.PointerEvent(type,{...point,pointerType:'touch',pointerId:2,bubbles:true}));
 check(game.preview?.x===30&&game.preview?.y===31,'touch selects blueprint footprint');
 check(!d.querySelector('[data-inspect="place"]').disabled,"valid site "+JSON.stringify(game.preview));
 click('[data-inspect="place"]');
 check(advance(()=>s.buildings.some(b=>b.type==='shed'&&b.finished)),'crew completes supply shed');
 const tree=game.features.find(f=>f.type==='tree'&&game.designateFeature(f.id));
 check(tree,'visible tree designated');
 const initialWood=s.resources.wood;
 check(advance(()=>s.piles.some(q=>q.kind==='wood')),'cut tree creates ground timber');
 check(advance(()=>s.colonists.some(p=>p.carry?.kind==='wood')),'hauler picks up timber');
 check(advance(()=>s.resources.wood===initialWood+6),'timber delivered into storage');
 s.resources.knowledge=40;
 click('[data-nav="more"]');click('[data-open="research"]');click('#sectionview [data-id="energy"]');
 check(s.research.includes('energy'),'research unlocks grid storage');
 game.save();
 const saved=JSON.parse(w.localStorage.getItem('farwake_founders_alpha03_v1'));
 check(saved.buildings.some(b=>b.type==='shed'&&b.finished)&&saved.harvested.includes(tree.id)&&saved.research.includes('energy'),'save retains building, harvest and research');
 const loaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
 w.location.reload();await loaded;
 const restored=frame.contentWindow.FARWAKE_TEST.state;
 check(restored.resources.wood===saved.resources.wood&&restored.research.includes('energy')&&restored.harvested.includes(tree.id),'reload restores progress');
 return checks;
}
