// The command journal is a view of the running simulation. Keep controls separate
// from the live readouts so an update never steals a touch or keyboard focus.
function facilityName(b) {
  return TYPES[b.type]?.name || ({lander:'Expedition Lander',supplies:'Supply Cache',camp:'Expedition Camp'})[b.type] || b.type;
}
function commandLink(section,icon,title,detail) {
  return '<button class="command-link" data-open="'+section+'"><span>'+uiIcon(icon,20)+'</span><span><b>'+title+'</b><small>'+detail+'</small></span></button>';
}
function commandStats(){
  const powerNow=power(), people=S.colonists, homes=people.filter(p=>S.buildings.some(b=>b.id===p.home&&housingPermanent(b)&&housingBeds(b)>0&&b.finished&&!b.editOrder)).length;
  const mean=key=>Math.round(people.reduce((v,p)=>v+p[key],0)/Math.max(people.length,1));
  const need=[];
  if(homes<people.length)need.push((people.length-homes)+' without a permanent bed');
  if(powerNow.used>powerNow.supply)need.push('Power demand exceeds supply');
  if(storedTotal()>=storageCapacity())need.push('Stores at capacity');
  if((S.resources.food||0)+(S.resources.meals||0)<people.length)need.push('Less than one stored meal per colonist');
  if(industryFoodEmergency())need.push('Emergency food recovery: foraging and unpaused grow beds take priority; food target temporarily lifted');
  const cards=[
    ['Population',people.length,homes+' permanently housed'],
    ['Wellbeing',mean('mood')+'%',mean('energy')+'% average energy'],
    ['Provisions',Math.floor((S.resources.food||0)+(S.resources.meals||0)),(S.resources.meals||0)+' prepared meals'],
    ['Power',powerNow.supply-powerNow.used,powerNow.supply+' supply / '+powerNow.used+' demand'],
    ['Construction',jobs().length,'unfinished blueprints'],
    ['Survey',Math.round(100*fog.filter(Boolean).length/fog.length)+'%',S.explore+' expeditions']
  ];
  return '<div class="command-stats">'+cards.map(([label,value,sub])=>'<div><small>'+label+'</small><strong>'+value+'</strong><span>'+sub+'</span></div>').join('')+'</div>'+
    (need.length?'<div class="command-alert">'+need.join(' · ')+'</div>':'');
}
function showCommand(){
  sheetSection='colony';
  showSheet(sectionHeader('Command Center','SETTLEMENT • DAY '+S.day)+frontierCommandHero()+
    '<div id="command-stats">'+commandStats()+'</div><div class="command-links">'+
    commandLink('resources','storage','Logistics','Stores, reserves & hauling')+
    commandLink('industry','workshop','Work & production','Assignments and targets')+
    commandLink('crew','crew','Personnel','Homes, needs & activity')+
    commandLink('research','research','Research','Technologies & requirements')+
    commandLink('world','world','Survey','Resources & expeditions')+
    commandLink('guide','inspect','Field guide','Search colony mechanics')+
    '</div><h3 class="sectioncap">Settlement facilities</h3><div class="facility-list">'+
    frontierFacilityRows()+
    '</div><h3 class="sectioncap">Field log</h3>'+S.events.slice(0,6).map(e=>'<div class="event"><b>Day '+e.day+'</b> '+esc(e.message)+'</div>').join(''));
  renderNavState();
}
let inspectedFacility=null;
function facilityReadout(b){
 const occupants=FarwakeDoors.occupants(S,b),workers=S.colonists.filter(p=>p.task&&(p.task.id===b.id||(p.task.x===b.x&&p.task.y===b.y)));
 const lines=['<b>'+(!b.finished?'Blueprint · '+Math.floor(100*b.progress/(TYPES[b.type]?.time||100))+'%':b.editOrder?'Settlement edit queued':b.autoPowerHold?'Grid standby':b.production?.paused?'Production paused':((frontierProducer(b)||['garden','workshop'].includes(b.type))&&productionBlock(b)?'Idle':'Operational'))+'</b>'];
 if(workers.length)lines.push(workers.map(p=>esc(p.name)+' · '+esc(taskLabel(p))).join('<br>'));
 if(FarwakeBuildings.entrance(b))lines.push('Inside: '+(occupants.map(p=>esc(p.name)).join(', ')||'Nobody'));
 if(!b.finished){
   const access=b.accessBlocked||frontierPlacementReason(b.type,b.x,b.y,b.id);
   if(access)lines.push('Access: '+esc(access)+'. Open a route or cancel this blueprint. <button type="button" class="secondary" data-editor="apply-cancel-site" data-building="'+b.id+'">Cancel and refund</button>');
   const missing=Object.entries(b.reservedMaterials||{}).filter(([k,n])=>(b.siteStock?.[k]||0)<n).map(([k,n])=>(n-(b.siteStock?.[k]||0))+' '+MATERIALS[k].name);
   lines.push(b.accessBlocked?'Access blocked':b.buildPaused?'Construction paused':missing.length?'Awaiting site deliveries: '+missing.join(', '):'Materials delivered · waiting for a builder');
 }
 if((['garden','workshop'].includes(b.type)||frontierProducer(b)))lines.push(esc(industrySummary(b)));
 if(b.type==='battery'){const grid=power();lines.push('Grid reserve: '+Math.floor(grid.charge)+' / '+grid.cap+' · '+grid.output+' discharge')}
 if(b.type==='clinic')lines.push('Nearby resting colonists within 8 tiles recover 20% faster.');
 if(b.type==='solar')lines.push('Generating '+(isNight()?'reduced nighttime':'daytime')+' power.');
 return lines.join('<br>');
}
function showBuilding(id){
 const b=S.buildings.find(item=>item.id===+id);if(!b){showCommand();return}
 inspectedFacility=b.id;sheetSection='facility';selectedBuilding=b.id;
 const housing=housingBeds(b)?housingPanel(b):'';
 const storage=storageBuildings().includes(b)?freightStorePanel(b):'';
 showSheet(sectionHeader(facilityName(b),'FACILITY • '+b.x+', '+b.y)+
 (experienceRoom(b)||frontierFacilityHero(b))+'<div id="facility-readout" class="facility-readout">'+facilityReadout(b)+'</div>'+
 '<details><summary>History of this place</summary>'+frontierHistoryPanel(b)+'</details>'+(housing?'<details><summary>Residents & beds</summary>'+housing+'</details>':'')+storage+industryDetails(b)+frontierCivicPanel(b)+frontierProjectPanel(b)+frontierUpgradeControls(b)+editorControls(b)+
 '<button class="secondary" data-guide="'+(housing?'Housing':storage?'Logistics':b.type==='garden'?'Agriculture':b.type==='workshop'?'Manufacturing':'Construction')+'">Field guide</button>');
 renderNavState();
}
function refreshCommandReadouts(){
 const stats=$('command-stats');if(stats&&sheetSection==='colony'){
  stats.innerHTML=commandStats();
  const overview=$('sheet').querySelector('.civilization-hero p');if(overview)overview.textContent=S.buildings.filter(b=>b.finished).length+' established structures · '+frontierState().sites.filter(s=>s.resolved).length+' planetary investigations';
  for(const button of $('sheet').querySelectorAll('.facility-list [data-facility]')){
   const b=S.buildings.find(b=>b.id===+button.dataset.facility);if(!b){button.remove();continue}
   const line=button.querySelector('small');if(line)line.textContent=!b.finished?'Under construction':b.upgradeOrder?'Expanding':frontierProducer(b)||['garden','workshop'].includes(b.type)?industrySummary(b):housingBeds(b)?housingResidents(b).length+' / '+housingBeds(b)+' residents':S.colonists.filter(p=>p.task?.id===b.id).length+' active workers';
  }
 }
 const el=$('facility-readout');if(el&&sheetSection==='facility'){
   const b=S.buildings.find(item=>item.id===inspectedFacility);
   if(b){el.innerHTML=facilityReadout(b);
   const production=$('production-status');if(production)production.textContent=industrySummary(b);
   const progress=$('production-progress');if(progress){const r=productionRecord(b);progress.style.width=Math.min(100,r.elapsed/(b.type==='garden'?cropDuration(r.stage):frontierProducer(b)?FRONTIER_RECIPES[r.recipe].seconds:chosenRecipe(r).seconds)*100)+'%'}
   const facts=$('sheet').querySelector('[data-production-facts]');if(facts)facts.innerHTML=frontierProductionFacts(b);
   }else showCommand();
 }
}
const guideEntries=[
 ['Construction','Building a facility','Choose a blueprint, find clear ground and confirm. The site reserves its materials. Check the site and the crew when construction stalls.'],
 ['Construction','Editing streets and structures','Open Build for settlement editing tools. Preview a route or work area before confirming. Select an existing facility to inspect its edit orders.'],
 ['Housing','Permanent beds and current occupants','Assigned residents own beds. The people listed as inside are physically using that building now. Open a home to manage its residents.'],
 ['Exploration','Finding ore','Open Survey and locate a mapped deposit. If you cannot see any, prioritize exploration. Select a revealed outcrop and mark it for mining. Exhausted ore stays exhausted.'],
 ['Logistics','Stored, outside and carried','Timber from a felled tree starts as a loose pile. A hauler collects it and brings it to a store. Stored materials, outside piles and loads in transit are separate quantities.'],
 ['Logistics','When the warehouse is full','Open Logistics and move material outside to free room. A held reserve stays outside until you allow hauling. Check the filters and capacity at each store.'],
 ['Agriculture','Growing food','Inspect a grow bed for its crop stage. Workers plant and tend crops and harvest mature food. Check work assignments, output targets and the stage before expecting a harvest.'],
 ['Manufacturing','Making alloy','The basic workshop recipe uses two ore and one salvage metal per alloy. The building needs inputs, a worker and power. Inspect the workshop for progress and its limiting condition.'],
 ['Automation','Giving orders','Use Work & production for colony priorities and targets. Open a colonist profile for personal work choices. Hunger and rest still interrupt work.'],
 ['Personnel','An evening together','From 17:30, rested and fed colonists choose company, a quiet interest or time at home. A shared meeting only builds familiarity after both people arrive and stay. Rain encourages home time. Urgent construction, hunger and carried supplies take precedence. Inspect a person for their current intention and a few meaningful memories.'],
 ['Saving','Original colony recovery','Living Colony upgrades version 3 colonies to version 4 only after verifying an exact recovery copy. Game & Save can export that original file. Older Beyond builds refuse version 4 saves. Use the original copy if returning to an older build.'],
 ['Personnel','Daily life','Tap a person to see their job and needs. Doors and occupancy reflect indoor jobs. Outdoor supplies are handled beside the pallet. A nearby operating clinic improves rest recovery.'],
 ['Research','Technology requirements','The research screen shows costs, prerequisites and benefits. Earn knowledge through real research and survey work. A locked technology lists what the colony still needs.'],
 ['Power','Generation and demand','Compare power supply and demand in Command Center. Solar output falls at night. Power banks charge surplus energy and discharge into a deficit. Check power when a staffed workshop stops producing.'],
 ['Weather','Reading the world','Rain, wind and changing daylight affect the appearance and sound of the map. World settings controls effects, sound levels and dialogue.'],
 ['Saving','Moving an expedition between previews','Open More → Game & Save, then Export Save. On another preview, Import Save and select the exported JSON. Browser storage is separate for each preview address.'],
 ['Touch controls','Inspect, pan and zoom','Tap a tile, colonist or facility to inspect it. Drag the map to pan and pinch to zoom. In a drawing tool, use the preview and confirmation controls before issuing the order.']
];
function guideResults(query){
 const words=query.toLowerCase().trim().split(/\s+/);
 const matches=guideEntries.filter(entry=>words.every(word=>entry.join(' ').toLowerCase().includes(word)));
 return matches.length?matches.map(([category,title,body])=>'<article class="guide-entry"><small>'+category+'</small><h3>'+title+'</h3><p>'+body+'</p></article>').join(''):'<p>No entries match this search.</p>';
}
function showGuide(term=''){
 sheetSection='guide';showSheet(sectionHeader('Field guide','EXPEDITION HANDBOOK')+
 '<label class="searchwrap">'+uiIcon('inspect',18)+'<input id="guide-query" type="search" placeholder="Search entries or categories" aria-label="Search field guide"></label>'+
 '<div class="catalogfilters">'+['','Construction','Logistics','Housing','Automation','Exploration'].map(q=>'<button class="filterchip" data-guide="'+q+'">'+(q||'All')+'</button>').join('')+'</div>'+
 '<div id="guide-entries">'+guideResults(term)+'</div>');$('guide-query').value=term;renderNavState();
}
$('sheet').addEventListener('click',e=>{
 const facility=e.target.closest('[data-facility]'),guide=e.target.closest('[data-guide]');
 if(facility)showBuilding(facility.dataset.facility);
 if(guide)showGuide(guide.dataset.guide);
});
$('sheet').addEventListener('input',e=>{if(e.target.id==='guide-query')$('guide-entries').innerHTML=guideResults(e.target.value)});
