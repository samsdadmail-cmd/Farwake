// Settlement editor state is a local preview; only confirmed orders are saved.
let editor = null;
const EDIT_NAMES = {path:'Lay stone path', remove:'Remove paths', mark:'Mark field work', clear:'Cancel field orders', move:'Relocate structure'};
function editorButton(action,label,id='',primary=false) {
  return '<button type="button" class="'+(primary?'primary':'secondary')+'" data-editor="'+action+'" data-building="'+id+'">'+label+'</button>';
}
function editorToolbar() {
  return '<div class="sectioncap">Map tools</div><div class="buttongroup">'+
    ['path','remove','mark','clear'].map(k=>editorButton(k,EDIT_NAMES[k])).join('')+'</div>';
}
function editorControls(b) {
  if(!b||!TYPES[b.type])return '<p class="tiny">Permanent expedition infrastructure.</p>';
  if(b.upgradeOrder)return '<p>Cancel the upgrade before dismantling or relocating.</p>';
  if(b.editOrder){
    const action=b.editOrder.kind==='move'?'Dismantling for relocation':'Dismantling';
    return '<p>'+action+' · '+Math.floor(100*b.editOrder.progress/editorWorkTime(b))+'%</p>'+editorButton('withdraw','Withdraw order',b.id);
  }
  if(!b.finished) return '<div class="buttongroup">'+editorButton('priority',b.buildPriority?'Normal priority':'Build first',b.id)+
    editorButton('pause',b.buildPaused?'Resume construction':'Pause construction',b.id)+
    (b.reconstructing?'':editorButton('cancel-site','Cancel blueprint',b.id))+'</div>';
  return '<div class="buttongroup">'+editorButton('move','Relocate',b.id)+editorButton('demolish','Dismantle',b.id)+'</div>';
}
function editorBegin(mode,b=null) {
  if(!EDIT_NAMES[mode])return;
  closeSheet();selectedType=preview=selectedFeature=selectedPile=selectedBuilding=selectedTerrain=selectedColonist=null;
  editor={mode,bid:b?.id,cells:[],start:null,end:null,stroke:null,pan:false,filter:'all'};
  paintHUD();
}
function editorTarget(x,y,w,h,except=null) {
  return S.buildings.some(b=>b!==except&&b.editOrder?.dest&&x<b.editOrder.dest.x+b.w&&x+w>b.editOrder.dest.x&&y<b.editOrder.dest.y+b.h&&y+h>b.editOrder.dest.y);
}
function editorConnect(cells,point) {
  // Four-connected raster stroke. Revisiting a previous cell trims the tail.
  const append=(x,y)=>{
    const i=cells.findIndex(q=>q.x===x&&q.y===y);
    if(i>=0)cells.splice(i+1);else cells.push({x,y});
  };
  if(!cells.length){append(point.x,point.y);return}
  let {x,y}=cells.at(-1);
  while(x!==point.x||y!==point.y){
    if(Math.abs(point.x-x)>=Math.abs(point.y-y))x+=Math.sign(point.x-x);
    else y+=Math.sign(point.y-y);
    append(x,y);
  }
}
function editorPoint(e) {
  const r=canvas.getBoundingClientRect(), p=screenToWorld(e.clientX-r.left,e.clientY-r.top);
  return {x:clamp(Math.floor(p.x),0,VW-1),y:clamp(Math.floor(p.y),0,VH-1)};
}
function editorMarkPoint(point,first) {
  if(editor.mode==='path'||editor.mode==='remove')editorConnect(editor.cells,point);
  else if(editor.mode==='move'){editor.end=point}
  else{if(first)editor.start=point;editor.end=point}
}
function editorDown(e) {
  if(!editor||editor.pan)return;
  if(pointers.size===2&&editor.stroke){
    Object.assign(editor,editor.stroke.undo);editor.stroke=null;paintHUD();return;
  }
  if(pointers.size!==1)return;
  editor.stroke={id:e.pointerId,undo:{cells:editor.cells.slice(),start:editor.start,end:editor.end}};
  editorMarkPoint(editorPoint(e),true);paintHUD();
}
function editorMove(e) {
  if(!editor||editor.stroke?.id!==e.pointerId||pointers.size!==1)return false;
  editorMarkPoint(editorPoint(e),false);paintHUD();return true;
}
function editorEnd(e) {
  if(!editor||editor.stroke?.id!==e.pointerId)return false;
  if(e.type==='pointercancel')Object.assign(editor,editor.stroke.undo);
  else editorMarkPoint(editorPoint(e),false);
  editor.stroke=null;paintHUD();return true;
}
function editorPlan() {
  if(!editor)return {valid:false};
  const mode=editor.mode;
  if(mode==='path'||mode==='remove'){
    const add=editor.cells.filter(q=>!buildingAt(q.x,q.y));
    const paths=editor.cells.map(q=>buildingAt(q.x,q.y)).filter(b=>b?.type==='path'&&!b.editOrder);
    if(mode==='remove')return {paths,valid:paths.length>0,description:paths.length+' path tiles to lift'};
    const blocked=editor.cells.some(q=>!fog[index(q.x,q.y)]||(buildingAt(q.x,q.y)?.type!=='path'&&!clearFootprint(q.x,q.y,1,1)));
    const cost=add.length*TYPES.path.cost.scrap;
    return {add,valid:!blocked&&cost>0&&freightAvailable('scrap')>=cost,description:add.length+' new tiles · '+cost+' salvage'+(blocked?' · blocked route':freightAvailable('scrap')<cost?' · insufficient salvage':'')};
  }
  if(mode==='move'){
    const b=S.buildings.find(b=>b.id===editor.bid),d=editor.end;
    const valid=b&&d&&!b.editOrder&&editorClear(d.x,d.y,b.w,b.h);
    return {b,d,valid,description:d?(valid?'Clear reconstruction site':'Site obstructed'):'Tap a clear site for the new footprint'};
  }
  const a=editor.start,z=editor.end;
  const list=!a||!z?[]:features.filter(f=>f.x>=Math.min(a.x,z.x)&&f.x<=Math.max(a.x,z.x)&&f.y>=Math.min(a.y,z.y)&&f.y<=Math.max(a.y,z.y)&&fog[index(f.x,f.y)]&&(editor.filter==='all'||f.type===editor.filter)&&Boolean(S.designations?.[f.id])===(mode==='clear'));
  return {list,valid:!!list.length,description:list.length+' field orders '+(mode==='clear'?'to cancel':'to queue')};
}
function editorClear(x,y,w,h) {
  if(!clearFootprint(x,y,w,h))return false;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(!fog[index(x+i,y+j)])return false;
  return true;
}
function editorPanel(){
  const plan=editorPlan(), area=['mark','clear'].includes(editor.mode);
  const filter=area?'<label>Targets <select data-edit-filter>'+Object.entries({all:'Everything',tree:'Trees',ore:'Minerals',scrap:'Salvage',bush:'Forage'}).map(([key,n])=>'<option value="'+key+'" '+(editor.filter===key?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'';
  return '<div class="inspectcard inspectnatural"><div class="label">'+EDIT_NAMES[editor.mode]+'</div><div class="meta">'+(editor.pan?'Drag to pan. Switch back to draw.':area?'Drag a rectangle.':editor.mode==='move'?'Tap to position.':'Drag to draw. Retrace to trim.')+' '+plan.description+'</div>'+filter+
    '<div class="buttongroup">'+editorButton('pan',editor.pan?'Draw':'Pan')+editorButton('undo','Reset')+'<button class="primary" data-editor="confirm" '+(!plan.valid?'disabled':'')+'>Confirm</button>'+editorButton('dismiss','Close')+'</div></div>';
}
function editorConfirm(){
  const plan=editorPlan();if(!plan.valid)return;
  if(editor.mode==='path'){
    for(const q of plan.add){
      const b={id:uid++,type:'path',x:q.x,y:q.y,w:1,h:1,progress:0,finished:false};
      if(!freightReserve(TYPES.path.cost,b))break;
      S.buildings.push(b);
    }
  }else if(editor.mode==='remove'){
    for(const b of plan.paths){if(b.finished)editorOrder(b,'demolish');else editorCancelSite(b)}
  }else if(editor.mode==='move'){editorOrder(plan.b,'move',plan.d)}
  else{
    for(const f of plan.list){
      if(editor.mode==='mark'){S.designations[f.id]={progress:0};for(const p of S.colonists)if(p.task?.feature===f.id&&p.task.type!=='harvest'){p.task=null;p.path=[]}}
      else{delete S.designations[f.id];for(const p of S.colonists)if(p.task?.feature===f.id){p.task=null;p.path=[]}}
    }
    dispatchFieldWork();
  }
  notice(plan.description);editor=null;renderUI(true);save();
}
function editorWorkTime(b){return b.type==='path'?1.6:Math.max(5,TYPES[b.type].time*.42)}
function editorEvacuate(b) {
  for(const p of S.colonists){
    const related=p.visit?.building===b.id||p.task?.id===b.id||(p.task?.x===b.x&&p.task?.y===b.y);
    if(related){FarwakeDoors.restore(p,S.buildings);p.task=null;p.path=[];p.action=0;}
  }
}
function editorOrder(b,kind,dest=null){
  if(!b?.finished||!TYPES[b.type]||b.editOrder||b.upgradeOrder)return;
  b.editOrder={kind,progress:0,...(dest?{dest:{...dest}}:{})};
  editorEvacuate(b);
  if(b.inputOrder||Object.values(b.siteStock||{}).some(n=>n>0)){freightCancel(b);b.inputOrder=false}
  if(b.type==='shed'||FRONTIER_BUILDINGS[b.type]?.storage)freightRemoveStore(b);
  if(housingBeds(b)){housingRelease(b);housingAllocate()}
  // Free the dispatch queue so an indefinitely researching builder can respond.
  for(const p of S.colonists)if(['Commander','Engineer'].includes(p.role)&&p.task?.type==='research'){p.task=null;p.path=[]}
}
function editorCancelSite(b){
  if(b.finished||b.reconstructing||!TYPES[b.type])return;
  editorEvacuate(b);
  freightCancel(b,1);
  S.buildings=S.buildings.filter(v=>v!==b);selectedBuilding=null;
}
function editorCandidate(p) {
  const upgrade=S.buildings.find(b=>b.upgradeOrder&&freightSiteReady(b)&&!S.colonists.some(q=>q!==p&&q.task?.type==='upgrade'&&q.task.id===b.id));
  if(upgrade)return {type:'upgrade',id:upgrade.id,x:upgrade.x,y:upgrade.y,w:upgrade.w,h:upgrade.h};
  if(p.work==='survey'||!(p.work==='build'||['Engineer','Commander','Medic'].includes(p.role)))return null;
  const b=S.buildings.find(b=>b.editOrder&&!S.colonists.some(other=>other!==p&&other.task?.type==='dismantle'&&other.task.id===b.id));
  return b?{type:'dismantle',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h}:null;
}
function editorWork(p,work){
  const b=S.buildings.find(q=>q.id===p.task?.id);
  if(!b?.editOrder){p.task=null;return}
  const o=b.editOrder;
  o.progress+=work*(p.role==='Engineer'?1.6:1);
  if(o.progress<editorWorkTime(b))return;
  if(b.type==='shed'||FRONTIER_BUILDINGS[b.type]?.storage)freightRemoveStore(b);
  editorEvacuate(b);
  if(o.kind==='move'){
    const dest=o.dest;
    delete b.editOrder;
    Object.assign(b,{x:dest.x,y:dest.y,finished:false,progress:0,reservedMaterials:{},siteStock:{},reconstructing:true,buildPaused:false});
    log('',TYPES[b.type].name+' dismantled. The crew will rebuild it at the marked site.');
  }else{
    const refund=Object.fromEntries(Object.entries(TYPES[b.type].cost).map(([k,n])=>[k,b.type==='path'?n:Math.floor(n*.5)]));
    S.buildings=S.buildings.filter(q=>q!==b);
    delete b.editOrder;freightRefund(refund,b);if(selectedBuilding===b.id)selectedBuilding=null;
    log('',TYPES[b.type].name+' dismantled. Salvage left on site.');
  }
  p.task=null;housingAllocate();save();paintHUD();
}
function editorOverlay() {
  ctx.save();
  function tile(x,y,w=1,h=1,warning=false) {
    ctx.fillStyle=warning?'#d7837050':'#e0c78a4d';ctx.strokeStyle=warning?'#e59e89':'#edcf8f';ctx.lineWidth=1;
    ctx.fillRect(x*TS,y*TS,w*TS,h*TS);ctx.strokeRect(x*TS+1,y*TS+1,w*TS-2,h*TS-2);
  }
  for(const b of S.buildings)if(b.editOrder?.dest)tile(b.editOrder.dest.x,b.editOrder.dest.y,b.w,b.h);
  if(editor){
    if(editor.mode==='move'&&editor.end){const b=S.buildings.find(v=>v.id===editor.bid);if(b)tile(editor.end.x,editor.end.y,b.w,b.h,!editorPlan().valid)}
    else if(editor.cells.length){for(const q of editor.cells)tile(q.x,q.y,1,1,editor.mode==='remove'||(!clearFootprint(q.x,q.y,1,1)&&buildingAt(q.x,q.y)?.type!=='path'))}
    else if(editor.start&&editor.end){const a=editor.start,z=editor.end;tile(Math.min(a.x,z.x),Math.min(a.y,z.y),Math.abs(a.x-z.x)+1,Math.abs(a.y-z.y)+1)}
  }
  ctx.restore();
}
function editorPaths(time,left,top,right,bottom){
  const paths=S.buildings.filter(b=>b.type==='path'), laid=new Set(paths.filter(b=>b.finished).map(b=>index(b.x,b.y)));
  for(const b of paths){
    if(b.x<left||b.x>=right||b.y<top||b.y>=bottom)continue;
    if(!b.finished){renderBuilding(b,time);continue}
    const x=b.x*TS,y=b.y*TS;
    ctx.fillStyle='#897d66';ctx.fillRect(x+6,y+6,20,20);ctx.fillStyle='#b0a087';ctx.fillRect(x+7,y+7,17,17);
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(inMap(b.x+dx,b.y+dy)&&laid.has(index(b.x+dx,b.y+dy))){
      ctx.fillRect(x+(dx<0?0:dx>0?20:7),y+(dy<0?0:dy>0?20:7),dx?12:17,dy?12:17);
    }
    for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#897e69':'#c4b9a0';ctx.fillRect(x+7+Math.floor(hash(b.x,b.y,i)*12),y+9+i*5,4,1);}
  }
}
document.addEventListener('change',e=>{if(editor&&e.target.matches('[data-edit-filter]')){editor.filter=e.target.value;paintHUD()}});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-editor]');if(!button)return;
 const a=button.dataset.editor,b=S.buildings.find(b=>b.id===Number(button.dataset.building));
 if(EDIT_NAMES[a]){if(a!=='move'||b?.finished)editorBegin(a,b);return}
 if(a==='confirm'){editorConfirm();return}
 if(editor){
   if(a==='dismiss')editor=null;
   else if(a==='pan')editor.pan=!editor.pan;
   else if(a==='undo'){editor.cells=[];editor.start=editor.end=null}
   paintHUD();return;
 }
 if(!b||!TYPES[b.type])return;
 if(a==='demolish'||a==='cancel-site'){
   const message=a==='demolish'?'A worker will dismantle this structure. Half of its original materials are recovered, rounded down per material. Stone paths return their full paving. Residents lose this address and stored goods move outside.':'Reserved materials are released and delivered materials return to the ground.';
   showSheet(sectionHeader(a==='demolish'?'Dismantle '+TYPES[b.type].name+'?':'Cancel this blueprint?','SETTLEMENT EDITOR')+'<p>'+message+'</p>'+editorButton('apply-'+a,'Confirm',b.id,true)+editorButton('back','Keep',b.id));return;
 }
 if(a==='apply-demolish')editorOrder(b,'demolish');
 if(a==='apply-cancel-site')editorCancelSite(b);
 if(a==='withdraw'){delete b.editOrder;for(const p of S.colonists)if(p.task?.type==='dismantle'&&p.task.id===b.id){p.task=null;p.path=[]}housingAllocate()}
 if(a==='priority')b.buildPriority=!b.buildPriority;
 if(a==='pause'){b.buildPaused=!b.buildPaused;if(b.buildPaused)editorEvacuate(b)}
 closeSheet();renderUI(true);save();
});
