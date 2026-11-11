function housingPermanent(b){return b.type!=='camp'&&!FRONTIER_BUILDINGS[b.type]?.temporary}
// Bed allocation is persistent (p.home). Current occupancy is driven by a visit.
function housingBeds(b) {
  if(!b?.finished||b.editOrder)return 0;
  const base=b.type==='shelter'?3:b.type==='camp'?5:FRONTIER_BUILDINGS[b.type]?.beds||0;
  return base?base+(b.level>1?b.level-1:0):0;
}
function housingName(b){
  return b?(TYPES[b.type]?.name||'Expedition camp')+' · '+b.x+', '+b.y:'No bed assigned';
}
function housingResidents(b){return S.colonists.filter(p=>p.home===b.id);}
function housingAllocate(){
  const houses=S.buildings.filter(b=>housingBeds(b));
  const usage=new Map(houses.map(b=>[b.id,0]));
  // Keep existing valid assignments first. Preserve explicit temporary-bed choices too.
  for(const p of S.colonists){
    const b=houses.find(b=>b.id===p.home);
    if(!b||usage.get(b.id)>=housingBeds(b)){p.home=null;delete p.homePinned;}
    else usage.set(b.id,usage.get(b.id)+1);
  }
  for(const p of S.colonists){
    const old=houses.find(b=>b.id===p.home);
    if(old&&(housingPermanent(old)||p.homePinned))continue;
    const next=houses.find(b=>housingPermanent(b)&&usage.get(b.id)<housingBeds(b))
      ||old||houses.find(b=>usage.get(b.id)<housingBeds(b));
    if(next&&next!==old){
      if(old)usage.set(old.id,usage.get(old.id)-1);
      p.home=next.id;usage.set(next.id,usage.get(next.id)+1);
    }
  }
  for(const p of S.colonists){
    if(p.task?.type==='rest'&&(p.task.id??null)!==p.home){p.task=null;p.path=[];p.action=0;}
  }
}
function housingAssign(personId,buildingId,swapId){
  const p=S.colonists.find(p=>p.id===personId),next=S.buildings.find(b=>b.id===buildingId);
  if(!p||!housingBeds(next)||p.home===next.id)return false;
  const old=p.home, members=housingResidents(next);
  if(members.length>=housingBeds(next)){
    const swap=members.find(o=>o.id===swapId);
    if(!swap)return false;
    swap.home=old;swap.homePinned=!!old;
  }
  p.home=next.id;p.homePinned=true;
  housingAllocate();save();return true;
}
function housingRelease(b){
  for(const p of S.colonists){
    if(p.visit?.building===b.id){FarwakeDoors.restore(p,S.buildings,walkable);p.task=null;p.path=[];p.action=0;}
    if(p.home===b.id){p.home=null;delete p.homePinned;}
    if(p.task?.type==='rest'&&p.task?.id===b.id){p.task=null;p.path=[];p.action=0;}
  }
}
function housingRestTarget(p){
  const b=S.buildings.find(b=>b.id===p.home&&housingBeds(b));
  return b?{type:'rest',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h}:
    {type:'rest',outdoors:true,x:Math.floor(p.x),y:Math.floor(p.y)};
}
function housingRecovery(p,work){
  const b=p.visit?.stage==='inside'&&S.buildings.find(b=>b.id===p.visit.building&&b.id===p.home);
  const permanent=b&&housingPermanent(b), temporary=b&&!permanent;
  const clinic=finished('clinic').find(c=>!c.editOrder&&Math.hypot(c.x-p.x,c.y-p.y)<=8+2*((c.level||1)-1));
  p.energy=clamp(p.energy+work*(permanent?5.8*(FRONTIER_BUILDINGS[b.type]?.comfort||1)*(1+.1*((b.level||1)-1)):temporary?4.5:2.1)*(clinic&&power().supply>=power().used?1.2+.1*((clinic.level||1)-1):1),0,100);
  p.mood=clamp(p.mood+work*(permanent?.035:temporary?0:-.055),0,100);
}
function housingCounts(){
  const residences=S.buildings.filter(b=>housingBeds(b));
  const permanent=residences.filter(housingPermanent);
  const sheltered=permanent.reduce((n,b)=>n+housingResidents(b).length,0);
  const camp=residences.filter(b=>!housingPermanent(b)).reduce((n,b)=>n+housingResidents(b).length,0);
  return {permanent:sheltered,camp,unhoused:S.colonists.length-sheltered-camp,beds:permanent.reduce((n,b)=>n+housingBeds(b),0),totalBeds:residences.reduce((n,b)=>n+housingBeds(b),0)};
}
function housingSummary(){
  const h=housingCounts();
  return '<div class="infocard"><b>Housing</b><p>'+h.permanent+' / '+h.beds+' permanent beds assigned · '+h.camp+' in camp · '+h.unhoused+' without a bed</p>'+
    (h.unhoused?'<p>Over capacity. Construct a Prefab Home for three more beds.</p>':'')+'</div>';
}
function housingPanel(b){
  if(!housingBeds(b))return '';
  const members=housingResidents(b),visitors=FarwakeDoors.occupants(S,b);
  const people=ps=>ps.map(p=>esc(p.name)).join(', ')||'None';
  return '<section class="infocard"><b>'+ (b.type==='camp'?'Temporary bunks':'Permanent beds')+'</b><p>'+members.length+' / '+housingBeds(b)+' assigned · '+visitors.length+' inside</p><p>Residents: '+people(members)+'</p><p>Inside now: '+people(visitors)+'</p><p>'+ (b.type==='camp'?'Camp rest restores energy.':'Residents recover energy faster and gain morale while resting here.')+'</p><p>Change beds from a colonist’s profile.</p></section>';
}
function housingPerson(p){
  const houses=S.buildings.filter(b=>housingBeds(b)),home=houses.find(b=>b.id===p.home);
  const controls=houses.filter(b=>b.id!==p.home).flatMap(b=>{
    const members=housingResidents(b);
    const opt=(other)=>'<option value="'+b.id+','+(other?.id??'')+'">'+esc(housingName(b)+(other?' · swap with '+other.name:' · available bed'))+'</option>';
    return members.length<housingBeds(b)?[opt(null)]:members.map(opt);
  });
  return '<section class="infocard"><b>Residence</b><p>'+esc(housingName(home))+'</p>'+
    (controls.length?'<label class="tiny">Reassign bed<select class="field" data-bed-person="'+p.id+'"><option value="">Choose a bed</option>'+controls.join('')+'</select></label>':'')+'</section>';
}
document.addEventListener('change',e=>{
  const el=e.target.closest('[data-bed-person]');if(!el||!el.value)return;
  const [id,swap]=el.value.split(',').map(Number);
  if(housingAssign(+el.dataset.bedPerson,id,swap))notice('Bed assignment updated.');
  profile(+el.dataset.bedPerson);
});
