// Capabilities are data shared by the tree, catalog, economy and simulation.
const FRONTIER_ERAS=['Landfall','Settlement','Frontier Township','Industrial Frontier','Deep Frontier'];
const FRONTIER_BRANCHES={
 food:['Food & water','garden'],homes:['Architecture','shelter'],industry:['Manufacturing','workshop'],
 power:['Energy','energy'],science:['Planetary science','world'],community:['Community','crew'],freight:['Administration','storage']
};
const FRONTIER_BUILDINGS={
 sawmill:{name:'Sawmill',w:3,h:2,power:-2,time:28,cost:{wood:18,scrap:16,alloy:3},tech:'timbercraft',group:'Industry',description:'Workers saw timber into structural boards. Boards unlock cabins and larger facilities.',recipe:'boards'},
 cabin:{name:'Frontier Cabin',w:3,h:2,power:-1,time:30,cost:{boards:16,wood:8,alloy:3},tech:'cabins',group:'Living',description:'Four permanent beds, a hearth and higher comfort.',beds:4,comfort:1.2},
 dormitory:{name:'Settler Lodge',w:4,h:3,power:-3,time:45,cost:{boards:30,metal:12,components:4},tech:'lodging',group:'Living',description:'Eight permanent beds for a growing township.',beds:8,comfort:1.1},
 pump:{name:'Water Works',w:2,h:2,power:-1,time:22,cost:{wood:10,scrap:15,alloy:2},tech:'waterworks',group:'Food',description:'An operator draws and filters groundwater for greenhouses and meals.',recipe:'water'},
 greenhouse:{name:'Glasshouse',w:3,h:2,power:-3,time:35,cost:{boards:20,metal:6,alloy:4},tech:'glasshouse',group:'Food',description:'Workers cultivate vegetables using filtered water. Produces food in repeatable batches.',recipe:'cultivate'},
 kitchen:{name:'Community Kitchen',w:3,h:2,power:-2,time:32,cost:{boards:16,metal:5,scrap:12},tech:'cooking',group:'Food',description:'Cooks turn raw food and water into nourishing meals consumed by colonists.',recipe:'meals'},
 smelter:{name:'Ore Smelter',w:3,h:2,power:-4,time:34,cost:{boards:12,scrap:24,alloy:5},tech:'refining',group:'Industry',description:'Refines finite ore into metal used by power plants, homes and manufacturing.',recipe:'metal'},
 fabricator:{name:'Component Works',w:3,h:2,power:-5,time:42,cost:{boards:20,metal:14,alloy:8},tech:'fabrication',group:'Industry',description:'Fabricates components and composite panels for advanced infrastructure.',recipe:'components'},
 wind:{name:'Wind Turbine',w:2,h:2,power:10,time:32,cost:{boards:12,metal:10,alloy:4},tech:'windpower',group:'Infrastructure',description:'Generates through the night. Windy weather increases output.'},
 accumulator:{name:'Grid Accumulator',w:2,h:2,power:0,time:38,cost:{metal:16,components:8,alloy:6},tech:'accumulation',group:'Infrastructure',description:'Stores 480 power units and supplies up to twelve during deficits.'},
 dining:{name:'Dining House',w:4,h:3,power:-2,time:36,cost:{boards:24,metal:8,scrap:10},tech:'commons',group:'Community',description:'Residents consume meals together and meet neighbours during breaks.',community:'dining'},
 recreation:{name:'Assembly Hall',w:4,h:3,power:-2,time:40,cost:{boards:28,metal:12,components:4},tech:'civiclife',group:'Community',description:'A staffed settlement hub for recreation and controlled settler arrivals.',community:'social'},
 warehouse:{name:'Freight Depot',w:4,h:3,power:-1,time:42,cost:{boards:28,metal:14,components:4},tech:'freightnetwork',group:'Infrastructure',description:'Stores 720 material units and routes loads through the existing filter and priority system.',storage:720},
 outpost:{name:'Expedition Outpost',w:3,h:2,power:-1,time:36,cost:{boards:20,metal:10,alloy:4},tech:'fieldstations',group:'Exploration',description:'A forward store and four temporary bunks. Dispatch expeditions and study distant sites.',storage:180,beds:4,temporary:true},
 drill:{name:'Extraction Rig',w:3,h:3,power:-6,time:48,cost:{metal:24,components:10,alloy:8},tech:'extraction',group:'Industry',description:'An operator extracts ore from a surveyed finite underground seam.',recipe:'drill'},
 observatory:{name:'Signal Observatory',w:5,h:4,power:-12,time:100,cost:{boards:40,metal:50,components:30,composite:24,relic:3},tech:'resonance',group:'Exploration',description:'The frontier project. Scientists align a planetary listening array to resolve the old signal.',project:true},
 road:{name:'Constructed Road',w:1,h:1,power:0,time:5,cost:{composite:1},tech:'civilworks',group:'Infrastructure',description:'Durable connected road with 25% faster travel on completed tiles.'},
 lamppost:{name:'Street Lantern',w:1,h:1,power:-1,time:8,cost:{metal:2,components:1},tech:'civilworks',group:'Community',description:'Illuminates paths at night and gives nearby outdoor breaks a welcoming focal point.'}
};
const FRONTIER_MATERIALS={
 boards:{name:'Structural boards',verb:'boards'},metal:{name:'Refined metal',verb:'metal'},
 components:{name:'Components',verb:'components'},composite:{name:'Composite panels',verb:'panels'},
 water:{name:'Filtered water',verb:'water'},meals:{name:'Prepared meals',verb:'meals'},relic:{name:'Recovered cores',verb:'cores'}
};
Object.assign(MATERIALS,FRONTIER_MATERIALS);
for(const [id,b] of Object.entries(FRONTIER_BUILDINGS)){
 TYPES[id]={...b,unlock:false,icon:'',description:b.description};
 GROUP_FOR[id]=b.group;
}
for(const group of ['Community','Exploration'])if(!CATALOG_GROUPS.includes(group))CATALOG_GROUPS.push(group);
const FRONTIER_TECH={
 timbercraft:{name:'Structural timber',branch:'industry',era:1,cost:18,requires:[],unlocks:['sawmill'],effort:8,requirement:'Complete a permanent shelter',gate:()=>housingCounts().beds>=3},
 cabins:{name:'Hearth architecture',branch:'homes',era:1,cost:22,requires:['timbercraft'],unlocks:['cabin'],effort:10,requirement:'Produce eight structural boards',gate:()=>frontierProduced('boards')>=8},
 waterworks:{name:'Water stewardship',branch:'food',era:1,cost:18,requires:['growth'],unlocks:['pump'],effort:8,requirement:'Harvest a crop',gate:()=>industryPolicy().harvests>=1},
 cooking:{name:'Shared kitchens',branch:'food',era:1,cost:24,requires:['waterworks','timbercraft'],unlocks:['kitchen'],effort:12,requirement:'Collect twelve filtered water',gate:()=>frontierProduced('water')>=12},
 commons:{name:'The common table',branch:'community',era:1,cost:26,requires:['cooking'],unlocks:['dining'],effort:12,requirement:'Prepare six meals',gate:()=>frontierProduced('meals')>=6},
 refining:{description:'Unlock the Ore Smelter and the workshop recipe for casting refined metal into alloy.',name:'Dedicated smelting',branch:'industry',era:2,cost:30,requires:['timbercraft','energy'],unlocks:['smelter'],effort:14,requirement:'Complete three workshop batches',gate:()=>industryPolicy().batches>=3},
 windpower:{name:'Wind engineering',branch:'power',era:2,cost:30,requires:['refining'],unlocks:['wind'],effort:12,requirement:'Refine twelve metal',gate:()=>frontierProduced('metal')>=12},
 glasshouse:{name:'Protected cultivation',branch:'food',era:2,cost:30,requires:['waterworks','refining'],unlocks:['greenhouse'],effort:14,requirement:'Complete three crop harvests',gate:()=>industryPolicy().harvests>=3},
 fabrication:{name:'Machine fabrication',branch:'industry',era:2,cost:42,requires:['refining'],unlocks:['fabricator'],effort:18,requirement:'Refine twenty-four metal and discover a planetary site',gate:()=>frontierProduced('metal')>=24&&frontierState().sites.some(s=>s.seen)},
 lodging:{name:'Township residences',branch:'homes',era:2,cost:32,requires:['cabins','fabrication'],unlocks:['dormitory'],effort:14,requirement:'Operate two permanent residences',gate:()=>S.buildings.filter(b=>housingBeds(b)&&!FRONTIER_BUILDINGS[b.type]?.temporary&&b.type!=='camp').length>=2},
 civiclife:{name:'Civic assembly',branch:'community',era:2,cost:34,requires:['commons','fabrication'],unlocks:['recreation'],effort:16,requirement:'Record four visits to communal facilities',gate:()=>frontierState().socialVisits>=4},
 freightnetwork:{name:'Freight administration',branch:'freight',era:3,cost:36,requires:['fabrication'],unlocks:['warehouse'],effort:14,requirement:'Complete two supply sheds',gate:()=>finished('shed').length>=2},
 civilworks:{name:'Civil infrastructure',branch:'freight',era:3,cost:38,requires:['fabrication','commons'],unlocks:['road','lamppost'],effort:16,requirement:'Produce ten composite panels',gate:()=>frontierProduced('composite')>=10},
 accumulation:{name:'High-density storage',branch:'power',era:3,cost:40,requires:['windpower','fabrication'],unlocks:['accumulator'],effort:16,requirement:'Fabricate twelve components',gate:()=>frontierProduced('components')>=12},
 fieldstations:{name:'Beyond the valley',branch:'science',era:2,cost:32,requires:['optics','refining'],unlocks:['outpost'],effort:14,requirement:'Chart one third of the planet',gate:()=>fog.filter(Boolean).length/fog.length>=.33},
 extraction:{name:'Deep seam extraction',branch:'industry',era:3,cost:40,requires:['fieldstations','fabrication'],unlocks:['drill'],effort:18,requirement:'Survey and investigate a mineral formation',gate:()=>frontierState().sites.some(s=>s.kind==='seam'&&s.resolved)},
 resonance:{name:'The listening frontier',branch:'science',era:4,cost:60,requires:['accumulation','fieldstations','civilworks'],unlocks:['observatory'],effort:28,requirement:'Recover three ancient cores and investigate three sites',gate:()=>industryOwned('relic')>=3&&frontierState().sites.filter(s=>s.resolved).length>=3}
};
function frontierState(){
 if(!S.frontier)S.frontier={version:1,produced:{},sites:[],socialVisits:0,arrivals:0};
 const f=S.frontier;f.produced??={};f.sites??=[];f.socialVisits??=0;f.arrivals??=0;
 return f;
}
function frontierMigrate(){
 const f=frontierState();
 for(const k of Object.keys(FRONTIER_MATERIALS)){S.resources[k]??=0;industryPolicy().targets[k]??=({water:60,meals:40,boards:80,metal:80,components:50,composite:60,relic:10})[k]}
 for(const b of S.buildings)if(b.type==='workshop'&&b.production?.manualRecipe==null&&b.production?.recipe&&b.production.recipe!=='smelt')b.production.manualRecipe=true;
 f.version=2;frontierSeedSites();frontierSurfaceGeology();
}
function frontierProduced(kind){return frontierState().produced[kind]||0}
function researchDefinition(id){return FRONTIER_TECH[id]||foundingResearchDefinition(id)}
function researchReason(id){
 const t=FRONTIER_TECH[id];
 if(!t){const reason=foundingResearchReason(id);return reason|| (frontierState().research?'Another technology is under study':'')}
 if(S.research.includes(id))return 'Researched';
 const missing=t.requires.filter(k=>!S.research.includes(k));
 if(missing.length)return 'Requires '+missing.map(k=>researchDefinition(k).name).join(' + ');
 if(t.gate&&!t.gate())return t.requirement;
 if(frontierState().research)return 'Another technology is under study';
 if(S.resources.knowledge<t.cost)return 'Need '+(t.cost-S.resources.knowledge)+' knowledge';
 return '';
}
function frontierBeginResearch(id){
 const t=researchDefinition(id);if(researchReason(id))return;
 S.resources.knowledge-=t.cost;
 frontierState().research={id,progress:0,effort:t.effort||8};
 notice('Study begun: '+t.name);save();openSection('research');
}
function frontierStudy(work){
 const active=frontierState().research;if(!active)return;
 active.progress+=work;
 if(active.progress<active.effort)return;
 S.research.push(active.id);delete frontierState().research;
 log('','Breakthrough: '+researchDefinition(active.id).name+'. '+(FRONTIER_TECH[active.id]?.unlocks||[]).map(id=>TYPES[id].name).join(', '));
 save();
}
function frontierEra(){
 const capability=[
 true, finished('sawmill').length&&housingCounts().permanent>=3,
 finished('smelter').length&&finished('kitchen').length,
 finished('fabricator').length&&finished('wind').length&&S.colonists.length>=8,
 finished('accumulator').length&&finished('outpost').length&&frontierState().sites.filter(s=>s.resolved).length>=3
 ];
 let era=0;while(era<4&&capability[era+1])era++;return era;
}
let techZoom=1,techBranchTops=[];
function frontierTree(){
 const legacy={
 growth:['food',0],energy:['power',0],medicine:['community',0],signal:['science',1],
 optics:['science',0],irrigation:['food',1],metallurgy:['industry',2],heliostat:['power',2],traverse:['science',3]
 };
 const nodes=Object.entries({...TECHS,...fieldResearch,...FRONTIER_TECH}).map(([id,t])=>({id,t,branch:t.branch||legacy[id]?.[0]||'freight',era:t.era??legacy[id]?.[1]??0}));
 const slots={},positions={},branchY={};const branches=Object.keys(FRONTIER_BRANCHES),colWidth=230;let nextY=70;
 for(const branch of branches){branchY[branch]=nextY;const rows=Math.max(...FRONTIER_ERAS.map((_,era)=>nodes.filter(n=>n.branch===branch&&n.era===era).length));nextY+=Math.max(300,rows*156+34)}
 techBranchTops=branches.map(id=>branchY[id]);
 for(const n of nodes){const cell=n.branch+'-'+n.era,slot=slots[cell]||0;slots[cell]=slot+1;positions[n.id]={x:136+n.era*colWidth,y:branchY[n.branch]+slot*156}}
 const width=1295,height=nextY+40;
 const lines=nodes.flatMap(({id,t})=>(Array.isArray(t.requires)?t.requires:t.requires?[t.requires]:[]).filter(k=>positions[k]).map(k=>{
  const a=positions[k],b=positions[id];
  return '<path d="M'+(a.x+188)+' '+(a.y+68)+' C'+(a.x+210)+' '+(a.y+68)+','+(b.x-24)+' '+(b.y+68)+','+b.x+' '+(b.y+68)+'" data-prerequisite="'+k+'" class="'+(S.research.includes(k)?'connected':'')+'"/>';
 })).join('');
 const active=frontierState().research;
 return '<div class="era-rail">'+FRONTIER_ERAS.map((n,i)=>'<button class="'+(i===frontierEra()?'current':'')+'" data-tech-era="'+i+'">'+n+'</button>').join('')+'</div>'+
 '<div class="tree-controls"><span>Drag the tree to explore · '+S.resources.knowledge+' knowledge</span><button class="secondary" data-tech-zoom="-1" aria-label="Zoom technology tree out">−</button><button class="secondary" data-tech-zoom="1" aria-label="Zoom technology tree in">+</button></div>'+
 '<div class="tree-branches">'+branches.map((id,i)=>'<button class="secondary" data-tech-branch="'+i+'">'+FRONTIER_BRANCHES[id][0]+'</button>').join('')+'</div><div class="tech-viewport" tabindex="0" aria-label="Technology tree, scroll to explore"><div class="tech-space" style="width:'+width*techZoom+'px;height:'+height*techZoom+'px"><div class="tech-board" style="width:'+width+'px;height:'+height+'px;transform:scale('+techZoom+')">'+
 '<svg class="tech-links" width="'+width+'" height="'+height+'" aria-hidden="true">'+lines+'</svg>'+
 FRONTIER_ERAS.map((n,i)=>'<h3 class="tech-era" style="left:'+(136+i*colWidth)+'px">'+n+'</h3>').join('')+
 branches.map((id,i)=>'<div class="tech-branch" style="top:'+branchY[id]+'px">'+uiIcon(FRONTIER_BRANCHES[id][1],22)+'<b>'+FRONTIER_BRANCHES[id][0]+'</b></div>').join('')+
 nodes.map(({id,t})=>{const p=positions[id],done=S.research.includes(id),studying=active?.id===id,available=!researchReason(id),state=done?'complete':studying?'studying':available?'available':'locked',building=t.unlocks?.[0];
 return '<button class="tech-node '+state+'" style="left:'+p.x+'px;top:'+p.y+'px" data-tech-detail="'+id+'">'+
 (building?'<img alt="" src="'+FarwakeBuildings.thumbnail(building)+'">':uiIcon(FRONTIER_BRANCHES[t.branch||legacy[id]?.[0]||'science'][1],22))+
 '<b>'+t.name+'</b><small>'+ (done?'Completed':studying?'Studying · '+Math.floor(100*active.progress/active.effort)+'%':available?t.cost+' knowledge': 'Locked')+'</small>'+
 '<span>'+(t.unlocks||[]).map(id=>TYPES[id].name).join(' · ')+'</span></button>';
 }).join('')+'</div></div></div>';
}
function frontierTechDetail(id){
 const t=researchDefinition(id);if(!t)return;
 const missing=researchReason(id),active=frontierState().research?.id===id;
 showSheet(sectionHeader(t.name,FRONTIER_ERAS[t.era||0])+
 '<p>'+(t.description||'New colony capabilities and construction blueprints.')+'</p>'+
 (t.unlocks||[]).map(k=>'<div class="unlock-preview"><img alt="" src="'+FarwakeBuildings.thumbnail(k)+'"><div><h3>'+TYPES[k].name+'</h3><p>'+TYPES[k].description+'</p><small>'+Object.entries(TYPES[k].cost).map(([r,n])=>n+' '+MATERIALS[r].name).join(' · ')+'</small></div></div>').join('')+
 '<div class="tech-prerequisites">'+(Array.isArray(t.requires)?t.requires:t.requires?[t.requires]:[]).map(k=>'<button class="secondary" data-tech-detail="'+k+'">'+(S.research.includes(k)?'Completed · ':'Requires · ')+researchDefinition(k).name+'</button>').join('')+'</div><p>'+ (t.requirement||'Founding expedition knowledge')+'</p>'+ (active?'<p>Stopping this study returns its unused knowledge budget.</p><button class="secondary" data-research-cancel>Stop study</button>':'')+'<button class="primary" data-tech-start="'+id+'" '+(missing||active?'disabled':'')+'>'+(active?'Researchers are studying this':missing||'Begin study · '+t.cost+' knowledge')+'</button><button class="secondary" data-open="research">Back to tree</button>');
}
document.addEventListener('click',e=>{
 const era=e.target.closest('[data-tech-era]');if(era){$('sheet').querySelector('.tech-viewport').scrollLeft=(110+Number(era.dataset.techEra)*230)*techZoom;return}
 const branch=e.target.closest('[data-tech-branch]');if(branch){$('sheet').querySelector('.tech-viewport').scrollTop=techBranchTops[Number(branch.dataset.techBranch)]*techZoom-10;return}
 const detail=e.target.closest('[data-tech-detail]');if(detail){frontierTechDetail(detail.dataset.techDetail);return}
 const start=e.target.closest('[data-tech-start]');if(start){frontierBeginResearch(start.dataset.techStart);return}
 const zoom=e.target.closest('[data-tech-zoom]');if(zoom){const view=$('sheet').querySelector('.tech-viewport'),old=techZoom,x=view.scrollLeft+view.clientWidth/2,y=view.scrollTop+view.clientHeight/2;techZoom=clamp(techZoom+Number(zoom.dataset.techZoom)*.15,.55,1.3);openSection('research');const next=$('sheet').querySelector('.tech-viewport');next.scrollLeft=x*techZoom/old-next.clientWidth/2;next.scrollTop=y*techZoom/old-next.clientHeight/2;}
});
const FRONTIER_RECIPES={
 boards:{name:'Saw structural timber',facility:'sawmill',cost:{wood:4},output:{boards:6},seconds:9},
 water:{name:'Collect and filter water',facility:'pump',cost:{},output:{water:6},seconds:12},
 cultivate:{name:'Protected vegetable beds',facility:'greenhouse',cost:{water:3},output:{food:14},seconds:20},
 meals:{name:'Cook communal meals',facility:'kitchen',cost:{food:4,water:2},output:{meals:6},seconds:12},
 metal:{name:'Smelt refined metal',facility:'smelter',cost:{ore:4},output:{metal:5},seconds:14},
 components:{name:'Fabricate components',facility:'fabricator',cost:{metal:3,alloy:1},output:{components:4},seconds:15},
 panels:{name:'Press composite panels',facility:'fabricator',cost:{boards:4,metal:2},output:{composite:5},seconds:14},
 drill:{name:'Extract deep seam',facility:'drill',cost:{},output:{ore:5},seconds:18}
};
function frontierProducer(b){return !!FRONTIER_BUILDINGS[b.type]?.recipe}
function frontierOutputKind(b){return Object.keys(FRONTIER_RECIPES[productionRecord(b).recipe]?.output||{alloy:1})[0]}
function productionRecord(b){
 if(!b.production)b.production=b.type==='garden'?{stage:'plant',elapsed:0,cycles:0,output:0}:{recipe:FRONTIER_BUILDINGS[b.type]?.recipe||'smelt',elapsed:0,cycles:0,output:0};
 return b.production;
}
function productionBlock(b){
 if(!frontierProducer(b))return foundingProductionBlock(b);
 const r=productionRecord(b),recipe=FRONTIER_RECIPES[r.recipe];
 if(!b.finished||b.editOrder||b.upgradeOrder)return 'Facility is under construction';
 if(r.paused)return b.autoPowerHold?'Grid standby · needs '+(-TYPES[b.type].power)+' spare power':'Production paused';
 if(!recipe||recipe.facility!==b.type)return 'Select a facility recipe';
 if(power().supply<power().used)return 'Insufficient grid power';
 const over=Object.keys(recipe.output).some(k=>industryOwned(k)>=industryTarget(k));
 if(over&&!r.batch)return 'Output target reached';
 if(b.type==='drill'&&!frontierSeam(b))return 'No investigated ore seam within six tiles';
 if(!r.batch){
  for(const [k,n] of Object.entries(recipe.cost)){
   if((b.siteStock?.[k]||0)<n)return b.inputOrder?'Awaiting physical '+MATERIALS[k].name+' delivery':'Needs '+n+' '+MATERIALS[k].name;
  }
 }
 return '';
}
function industrySummary(b){
 if(!frontierProducer(b))return foundingIndustrySummary(b);
 const blocked=productionBlock(b);if(blocked)return blocked;
 const p=productionWorkers(b)[0];return p?(p.path.length?'Worker approaching':'Processing · '+p.name):'Awaiting a manufacturing worker';
}
function industryRecipes(b){
 if(!b||!frontierProducer(b))return foundingIndustryRecipes();
 return Object.entries(FRONTIER_RECIPES).filter(([,r])=>r.facility===b.type);
}
function performProduction(p,t,work){
 const b=S.buildings.find(b=>b.id===t.id);
 if(!b||!frontierProducer(b))return foundingProduction(p,t,work);
 const r=productionRecord(b),recipe=FRONTIER_RECIPES[r.recipe];
 if(productionBlock(b)){p.task=null;return}
 if(!r.batch){
   for(const [k,n] of Object.entries(recipe.cost)){b.siteStock[k]-=n;freightFlow(k,n,'consumed')}
   r.batch=true;b.inputOrder=false;delete b.reservedMaterials;
 }
 r.elapsed+=work;
 if(r.elapsed<recipe.seconds)return;
 for(const [kind,n] of Object.entries(recipe.output)){
   freightOutput(kind,n,b);frontierState().produced[kind]=(frontierState().produced[kind]||0)+n;
 }
 if(b.type==='drill')frontierSeam(b).remaining-=recipe.output.ore;
 r.batch=false;r.elapsed=0;r.cycles++;r.output+=Object.values(recipe.output).reduce((n,v)=>n+v,0);industryPolicy().batches++;
 p.task=null;p.action=0;save();
}
function frontierRequestInputs(b){
 if(!b.finished||b.editOrder||b.upgradeOrder||!frontierProducer(b))return;
 const r=productionRecord(b),recipe=FRONTIER_RECIPES[r.recipe];
 if(r.paused||r.batch||b.inputOrder||!recipe)return;
 if(Object.keys(recipe.output).some(k=>industryOwned(k)>=industryTarget(k)))return;
 if(Object.keys(recipe.cost).length&&freightReserve(recipe.cost,b))b.inputOrder=true;
}
function frontierSeam(b){
 return frontierState().sites.find(s=>s.kind==='seam'&&s.resolved&&s.remaining>=5&&Math.hypot(s.x-b.x,s.y-b.y)<=6);
}
function industryDetails(b){
 if(!frontierProducer(b))return foundingIndustryDetails(b);
 const r=productionRecord(b),recipe=FRONTIER_RECIPES[r.recipe],workers=productionWorkers(b);
 return '<section class="production-panel"><div class="production-title"><b id="production-status">'+esc(industrySummary(b))+'</b><span>Production</span></div>'+
 '<div class="progress"><i id="production-progress" style="width:'+Math.min(100,r.elapsed/recipe.seconds*100)+'%"></i></div>'+
 '<p>'+Object.entries(recipe.cost).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+' → '+Object.entries(recipe.output).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+'</p>'+
 '<label>Recipe'+industrySelect('Facility recipe',r.recipe,industryRecipes(b).map(([k,v])=>[k,v.name]),'data-industry-recipe="'+b.id+'"')+'</label>'+
 '<label>Assigned worker'+industrySelect('Assigned worker',r.worker||'',[['','Any available specialist'],...S.colonists.map(p=>[p.id,p.name])],'data-industry-worker="'+b.id+'"')+'</label>'+
 '<div data-production-facts>'+frontierProductionFacts(b)+'</div><button class="secondary" data-industry-pause="'+b.id+'">'+(r.paused?'Resume':'Pause')+'</button></section>';
}
let frontierInterval=0;
function frontierTick(step){
 frontierInterval+=step;if(frontierInterval<1)return;frontierInterval%=1;
 frontierDiscover();frontierPowerDispatch();const grid=surveyGrid();
 for(const b of S.buildings){
  if(b.type==='lamppost')b.powered=grid.supply>=grid.used;
  const h=frontierHistory(b);h.ageDays=Math.max(0,S.day-h.createdDay);
  if(['garden','greenhouse'].includes(b.type))h.harvests=productionRecord(b).cycles||0;
  frontierRequestInputs(b);
 }
}
function frontierRefreshTree(){
 if(sheetSection!=='research')return;
 for(const edge of $('sheet').querySelectorAll('[data-prerequisite]'))edge.classList.toggle('connected',S.research.includes(edge.dataset.prerequisite));
 for(const node of $('sheet').querySelectorAll('[data-tech-detail]')){
  const id=node.dataset.techDetail,active=frontierState().research,done=S.research.includes(id),studying=active?.id===id;
  node.className='tech-node '+(done?'complete':studying?'studying':!researchReason(id)?'available':'locked');
  const status=node.querySelector('small');
  if(status)status.textContent=done?'Completed':studying?'Studying · '+Math.floor(100*active.progress/active.effort)+'%':researchReason(id)?'Locked':researchDefinition(id).cost+' knowledge';
 }
}
function frontierMealTarget(p){
 if((S.resources.food||0)+(S.resources.meals||0)<=0){
   const piles=S.piles.filter(q=>['food','meals'].includes(q.kind)&&q.site==null&&q.amount>0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   for(const pile of piles){const t={type:'eat',pileId:pile.id,x:pile.x,y:pile.y};if(setTask(p,t))return t}
   return frontierFoodRecoveryTarget(p);
 }
 const halls=S.buildings.filter(b=>b.finished&&!b.editOrder&&['dining','kitchen'].includes(b.type)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(const b of [...halls,...storageBuildings()]){
   const t={type:'eat',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};if(setTask(p,t))return t;
 }
 return {type:'eat',outdoors:true,x:Math.floor(p.x),y:Math.floor(p.y)};
}
function frontierFoodRecoveryTarget(p){
 // Gather an actual, discovered food source; do not manufacture a rescue ration.
 for(const f of nearFeature('bush',p)){
   if(S.colonists.some(q=>q!==p&&q.task?.feature===f.id))continue;
   const t={type:'forage',feature:f.id,x:f.x,y:f.y};
   if(setTask(p,t))return t;
 }
 return productionCandidate(p,'garden');
}
function frontierEat(p){
 p.action=0;const pile=pileById(p.task.pileId);
 let kind=(S.resources.meals||0)>=1?'meals':'food',consumed=false;
 if(pile&&['meals','food'].includes(pile.kind)&&pile.amount>0){
   kind=pile.kind;pile.amount--;if(!pile.amount)S.piles=S.piles.filter(q=>q!==pile);freightFlow(kind,1,'consumed');consumed=true;
 }else consumed=freightSpend({[kind]:1});
 if(consumed){
   p.hunger=Math.max(0,p.hunger-(kind==='meals'?90:70));p.mood=clamp(p.mood+(kind==='meals'?3:1),0,100);
   if(p.visit?.building===p.task?.id)frontierState().socialVisits++;
 }
 p.task=null;
}
const FRONTIER_UPGRADABLE=new Set(['shelter','cabin','dormitory','workshop','sawmill','smelter','fabricator','shed','warehouse','clinic','solar','battery','greenhouse']);
function frontierUpgradeCost(b){
 const n=b.level||1;return {boards:8*n,metal:4*n,...(n>1?{components:4}: {})};
}
function frontierUpgradeReason(b){
 if(!b.finished||b.editOrder||b.upgradeOrder)return 'Facility already has a construction order';
 if(!FRONTIER_UPGRADABLE.has(b.type)||(b.level||1)>=3)return 'Fully developed';
 const tech=housingBeds(b)?'cabins':b.type==='solar'||b.type==='battery'?'windpower':'fabrication';
 if(!S.research.includes(tech))return 'Requires '+researchDefinition(tech).name;
 if(productionRecord(b).batch)return 'Finish current production batch first';
 if(Object.entries(frontierUpgradeCost(b)).some(([k,n])=>freightAvailable(k)<n))return 'Needs upgrade construction materials';
 return '';
}
function frontierUpgrade(b){
 if(frontierUpgradeReason(b))return false;
 if(b.inputOrder){freightCancel(b);b.inputOrder=false}
 b.upgradeOrder={progress:0};
 if(!freightReserve(frontierUpgradeCost(b),b)){delete b.upgradeOrder;return false}
 interruptAvailable();save();return true;
}
function frontierUpgradeWork(p,work){
 const b=S.buildings.find(b=>b.id===p.task?.id);if(!b?.upgradeOrder||!freightSiteReady(b)){p.task=null;return}
 b.upgradeOrder.progress+=work;
 if(b.upgradeOrder.progress<16*(b.level||1))return;
 for(const [k,n] of Object.entries(b.siteStock||{}))freightFlow(k,n,'consumed');
 delete b.siteStock;delete b.reservedMaterials;delete b.upgradeOrder;b.level=(b.level||1)+1;
 p.task=null;housingAllocate();FarwakeWorkFX.complete(b);log('',facilityName(b)+' upgraded to level '+b.level+'.');save();
}
function frontierUpgradeControls(b){
 if(b.upgradeOrder)return '<div class="command-alert">Upgrade construction · '+Math.floor(100*b.upgradeOrder.progress/(16*(b.level||1)))+'% · '+(freightSiteReady(b)?'materials delivered':'awaiting materials')+'</div><button class="secondary" data-upgrade-cancel="'+b.id+'">Cancel upgrade</button>';
 if(!FRONTIER_UPGRADABLE.has(b.type))return '';
 const reason=frontierUpgradeReason(b);
 return '<section class="upgrade-card"><b>Development level '+(b.level||1)+'</b><p>'+ (housingBeds(b)?'Adds a permanent bed and improves rest comfort.':b.type==='shed'||b.type==='warehouse'?'Adds ninety storage units.':b.type==='solar'?'Adds two daytime power.':b.type==='battery'?'Adds sixty energy capacity.':b.type==='clinic'?'Extends nearby rest recovery service.':'Improves equipment for 20% faster production per level.')+'</p><small>'+Object.entries(frontierUpgradeCost(b)).map(([k,n])=>n+' '+MATERIALS[k].name).join(' · ')+'</small><button class="primary" data-upgrade="'+b.id+'" '+(reason?'disabled':'')+'>'+(reason||'Order upgrade')+'</button></section>';
}
function frontierCommunityTarget(p){
 if(p.energy<35||p.hunger>60||(p.social>62&&!(S.minute>=1110&&p.breakDay!==S.day))||S.minute<600||S.minute>1260)return null;
 const places=S.buildings.filter(b=>b.finished&&!b.editOrder&&FRONTIER_BUILDINGS[b.type]?.community&&S.colonists.filter(z=>z.task?.type==='social'&&z.task.id===b.id).length<4);
 places.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(const b of places){const t={type:'social',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};if(setTask(p,t))return t}
 return null;
}
function frontierSocial(p,work){
 p.social=clamp(p.social+work*4,0,100);p.mood=clamp(p.mood+work*.4,0,100);
 if(p.action<5)return;
 frontierState().socialVisits++;p.breakDay=S.day;const b=S.buildings.find(b=>b.id===p.task.id);if(b){b.history??={};b.history.visits=(b.history.visits||0)+1}
 p.task=null;save();
}
function frontierArrivalReason(){
 if(!finished('recreation').length||!finished('comms').length)return 'Requires an Assembly Hall and Signal Beacon';
 if(S.colonists.length>=40)return 'Colony population limit reached';
 if(housingCounts().beds<=housingCounts().permanent)return 'Provide an available permanent bed';
 if((S.resources.food||0)+(S.resources.meals||0)<30)return 'Store thirty food or meals';
 if(!frontierState().sites.some(s=>s.resolved))return 'Complete a planetary investigation';
 return '';
}
function frontierInvite(){
 if(frontierArrivalReason())return false;
 const n=frontierState().arrivals,home=S.buildings.find(b=>housingPermanent(b)&&housingBeds(b)>housingResidents(b).length);
 if(!home)return false;
 const profile=PROFILES[n%PROFILES.length],id=Math.max(0,...S.colonists.map(p=>p.id))+1;
 S.colonists.push({...profile,id,name:['Rin','Sera','Ari','Kian','Edda','Lio','Sage','Orla'][n%8]+' '+['Vale','Rowan','Kestrel','Hale'][Math.floor(n/8)%4],x:home.x-.5,y:home.y+home.h+.5,energy:90,hunger:25,mood:80,social:70,skill:2,work:'auto',home:null,path:[],task:null,action:0});
 frontierState().arrivals++;housingAllocate();log('','A new settler has joined the expedition.');save();return true;
}
function frontierCivicPanel(b){
 if(!FRONTIER_BUILDINGS[b.type]?.community)return '';
 return '<section class="community-panel"><h3>Community life</h3><p>'+frontierState().socialVisits+' shared meals and social visits recorded.</p>'+
 (b.type==='recreation'?'<p>'+frontierArrivalReason()+'</p><button class="primary" data-invite '+(frontierArrivalReason()?'disabled':'')+'>Invite one settler</button>':'<p>Residents with low social comfort take short breaks here.</p>')+'</section>';
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-upgrade],[data-upgrade-cancel],[data-invite]');if(!button)return;
 if(button.hasAttribute('data-invite')){frontierInvite();showBuilding(inspectedFacility);return}
 const b=S.buildings.find(b=>b.id===+(button.dataset.upgrade||button.dataset.upgradeCancel));if(!b)return;
 if(button.hasAttribute('data-upgrade'))frontierUpgrade(b);
 else{freightCancel(b);delete b.upgradeOrder;for(const p of S.colonists)if(p.task?.type==='upgrade'&&p.task.id===b.id){p.task=null;p.path=[]}}
 showBuilding(b.id);save();
});

function frontierChangeRecipe(b,id){
 const recipe=FRONTIER_RECIPES[id],r=productionRecord(b);
 if(!recipe||!industryRecipes(b).some(([key])=>key===id)||r.batch||b.upgradeOrder)return false;
 if(b.inputOrder){freightCancel(b);b.inputOrder=false}
 r.recipe=id;r.elapsed=0;save();return true;
}

function frontierHistory(b){
 const h=b.history??={};
 for(const key of ['work','residentHours','traffic','visits','harvests'])h[key]??=0;
 h.createdDay??=S.day;h.ageDays??=0;return h;
}
function frontierRecord(p,t,step){
 const b=S.buildings.find(b=>b.id===t.id);
 if(b){const h=frontierHistory(b);
  if(p.visit?.stage==='inside')h.residentHours+=step*3.1/60;
  if(!p.path.length&&['craft','farm','research','upgrade','build'].includes(t.type))h.work+=step;
 }
 if(p.path.length){
  const tile=Math.floor(p.x)+','+Math.floor(p.y);
  if(p.lastTrafficTile!==tile){p.lastTrafficTile=tile;
   const road=buildingAt(Math.floor(p.x),Math.floor(p.y));
   if(road?.finished&&['path','road'].includes(road.type))frontierHistory(road).traffic++;
  }
 }
}

function frontierDistrict(b){
 const counts={};
 for(const q of S.buildings)if(q.finished&&Math.hypot(q.x-b.x,q.y-b.y)<8){
  const kind=housingBeds(q)?'Residential':frontierProducer(q)||q.type==='workshop'?'Industrial':q.type==='garden'?'Agricultural':FRONTIER_BUILDINGS[q.type]?.community?'Community':FRONTIER_BUILDINGS[q.type]?.storage?'Logistics':null;
  if(kind)counts[kind]=(counts[kind]||0)+1;
 }
 const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];return top&&top[1]>=2?top[0]+' neighbourhood':'Frontier settlement';
}
function frontierHistoryPanel(b){
 const h=frontierHistory(b);
 return '<section class="settlement-history"><span class="smallcaps">'+frontierDistrict(b)+'</span><p>Established Day '+h.createdDay+' · '+h.ageDays+' days in service</p><small>'+Math.floor(h.work)+' work seconds · '+h.residentHours.toFixed(1)+' indoor hours · '+h.harvests+' harvests · '+h.visits+' social visits</small></section>';
}

const FRONTIER_SITE_TYPES={
 wreck:{name:'Silent expedition wreck',description:'A torn expedition pod. Its recorder contains a fragment of the old signal.',color:'#c79c71'},
 seam:{name:'Resonant mineral formation',description:'Metallic strata continue beneath the valley. A field study can locate a finite underground seam.',color:'#9cb4ac'},
 ruin:{name:'Buried listening stones',description:'The stones repeat the interval heard at planetfall. Their purpose remains uncertain.',color:'#acadc8'},
 anomaly:{name:'The still-water anomaly',description:'A pale mineral lens holds a pattern that ordinary weather cannot explain.',color:'#98c6b4'}
};
function frontierSeedSites(){
 const f=frontierState();if(f.worldVersion)return;
 const reach=surveyDistances(28,29,(x,y)=>terrain[index(x,y)].kind!=='water');
 const used=f.sites.filter(s=>Number.isFinite(s.x));
 for(let i=0;i<8;i++){
  const candidates=[];
  for(let y=3;y<VH-3;y++)for(let x=3;x<VW-3;x++){
   const d=Math.hypot(x-28,y-28);
   if(reach[index(x,y)]<0||buildingAt(x,y)||d<(i<2?10:17)||d>(i<2?16:32)||used.some(s=>Math.hypot(s.x-x,s.y-y)<7))continue;
   candidates.push({x,y,rank:hash(x,y,hashStr(S.seed)+2301+i*313)});
  }
  candidates.sort((a,b)=>b.rank-a.rank);const q=candidates[0];if(!q)continue;
  const site={id:'frontier-site-'+i,kind:['wreck','seam','ruin','anomaly'][i%4],x:q.x,y:q.y,seen:false,resolved:false,progress:0};
  f.sites.push(site);used.push(site);
 }
 f.worldVersion=1;
}
function frontierDiscover(){
 for(const s of frontierState().sites){
  if(s.seen||!Number.isFinite(s.x)||!fog[index(s.x,s.y)])continue;
  s.seen=true;log('',FRONTIER_SITE_TYPES[s.kind].name+' discovered at '+s.x+', '+s.y+'.');notice('Planetary discovery · '+FRONTIER_SITE_TYPES[s.kind].name);
 }
}
function frontierSiteReach(s){
 return Math.hypot(s.x-28,s.y-28)<=17||finished('outpost').some(b=>!b.editOrder&&Math.hypot(b.x-s.x,b.y-s.y)<=13);
}
function frontierSiteReason(s){
 if(s.resolved)return 'Investigation completed';if(!s.seen)return 'Uncharted site';
 if(!frontierSiteReach(s))return 'Establish an Expedition Outpost within thirteen tiles';
 if(!S.research.includes('optics'))return 'Requires Rangefinding Optics';
 const scout=surveyScout(),dist=surveyDistances(scout.x,scout.y,walkable);
 if(!neighborGoals(s.x,s.y).some(q=>dist[index(q.x,q.y)]>=0))return 'No reachable approach. Clear a route around structures.';
 return '';
}
function frontierOrderSite(id,choice){
 const s=frontierState().sites.find(s=>s.id===id);if(!s||frontierSiteReason(s)||!['study','recover'].includes(choice))return false;
 s.order=choice;const p=surveyScout();if(p.task?.type==='survey'||p.task?.type==='research'){p.task=null;p.path=[]}save();return true;
}
function frontierInvestigateTarget(p){
 if(p.role!=='Surveyor'&&p.work!=='survey')return null;
 for(const s of frontierState().sites)if(s.order&&!s.resolved&&!frontierSiteReason(s)&&!S.colonists.some(q=>q!==p&&q.task?.site===s.id))return {type:'investigate',site:s.id,x:s.x,y:s.y};
 return frontierFieldExtractionTarget(p);
}
function frontierInvestigate(p,work){
 const s=frontierState().sites.find(s=>s.id===p.task?.site);if(!s?.order||s.resolved||!frontierSiteReach(s)){p.task=null;return}
 s.progress+=work;if(s.progress<18)return;
 s.resolved=true;s.remaining=s.kind==='seam'?180:0;s.choice=s.order;delete s.order;
 S.resources.knowledge+=s.choice==='study'?18:6;
 freightOutput('relic',1,{x:s.x,y:s.y,w:1,h:1});
 if(s.choice==='recover')freightOutput('components',4,{x:s.x,y:s.y,w:1,h:1});
 log('',FRONTIER_SITE_TYPES[s.kind].name+': '+(s.kind==='seam'?'180 ore mapped underground. ':'')+'A recovered core carries the same unfinished sequence.');
 p.task=null;save();notice('Investigation complete · core recovered');
}
let inspectedDiscovery=null;
function frontierSitePanel(id){
 inspectedDiscovery=id;
 const s=frontierState().sites.find(s=>s.id===id);if(!s||!s.seen)return;
 sheetSection='discovery';const type=FRONTIER_SITE_TYPES[s.kind],reason=frontierSiteReason(s);
 showSheet(sectionHeader(type.name,'PLANETARY FIELD RECORD')+'<div class="discovery-art '+s.kind+'">'+uiIcon('world',50)+'</div><p>'+type.description+'</p><p>'+s.x+', '+s.y+' · '+(s.resolved?'Investigated on this expedition':Math.floor(s.progress/18*100)+'% field study')+'</p>'+
 (s.resolved?'<p>'+(s.kind==='seam'?s.remaining+' finite ore remain. An Extraction Rig within six tiles provides faster powered extraction.':'Recovered core sent into the physical hauling network.')+'</p>':
 '<p>'+(reason||'Choose the focus of the investigation. Both preserve a core for the listening array.')+'</p><button class="primary" data-investigate="'+s.id+'" data-choice="study" '+(reason?'disabled':'')+'>Study · 18 knowledge + core</button><button class="secondary" data-investigate="'+s.id+'" data-choice="recover" '+(reason?'disabled':'')+'>Recover · 4 components + 6 knowledge + core</button>'+(s.order?'<p>Surveyor ordered to '+s.order+'.</p><button class="secondary" data-site-cancel="'+s.id+'">Cancel investigation</button>':''))+(s.resolved&&s.kind==='seam'?'<p>Field extraction: a Surveyor recovers five ore per 32 work seconds, respecting the colony ore target. No rig materials needed.</p><p id="field-extraction-status">'+frontierFieldExtractionStatus(s)+'</p><button class="primary" data-field-extraction="'+s.id+'" '+(s.remaining<5||!frontierSiteReach(s)?'disabled':'')+'>'+(s.handMining?'Stop field extraction':'Order field extraction')+'</button><button class="secondary" data-open="industry">Ore target &amp; work priorities</button>':'')+'<button class="secondary" data-site-focus="'+s.id+'">Locate on map</button>');
}
function frontierPlanetPanel(){
 const sites=frontierState().sites.filter(s=>s.seen);
 return '<section class="planet-record"><h3>Beyond the valley</h3><p>'+sites.filter(s=>s.resolved).length+' investigations · '+sites.length+' discovered sites · '+finished('outpost').length+' field stations</p>'+sites.map(s=>'<button class="discovery-row" data-site="'+s.id+'"><span>'+uiIcon('world',21)+'</span><b>'+FRONTIER_SITE_TYPES[s.kind].name+'<small>'+s.x+', '+s.y+' · '+(s.resolved?'Investigated':s.order?'Field work ordered':frontierSiteReach(s)?'Within expedition reach':'Needs an outpost')+'</small></b><span>›</span></button>').join('')+'<p>Investigations yield finite physical cores and useful knowledge. Outposts extend investigation reach and provide temporary beds and storage.</p></section>';
}
function frontierResearchTarget(p){
 const b=finished('observatory').find(b=>!b.editOrder&&!frontierState().signalComplete);
 if(b&&surveyGrid().supply>=surveyGrid().used&&['Medic','Surveyor','Commander'].includes(p.role))return {type:'align',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};
 return {type:'research',x:26,y:26,w:3,h:3};
}
function frontierAlign(p,work){
 if(surveyGrid().supply<surveyGrid().used){p.task=null;return}
 const f=frontierState();f.alignment=(f.alignment||0)+work;
 if(f.alignment<180)return;
 f.signalComplete=true;f.signalDay=S.day;p.task=null;
 log('','The listening array resolves a second signal, beyond the mapped valley. It is not an answer. It is an invitation.');notice('Beyond the Frontier · a second horizon');save();
}
function frontierProjectPanel(b){
 if(b.type==='outpost')return '<section class="project-card"><h3>Forward expedition base</h3><p>Supports investigations within thirteen tiles. Four temporary bunks and 180 storage units serve the same colony economy.</p><button class="secondary" data-frontier-map>Review field discoveries</button></section>';
 if(b.type!=='observatory')return '';
 const f=frontierState();return '<section class="project-card"><h3>The listening frontier</h3><div class="progress"><i style="width:'+Math.min(100,(f.alignment||0)/180*100)+'%"></i></div><p>'+(f.signalComplete?'A second horizon was heard on Day '+f.signalDay+'. The mystery continues beyond this release.':surveyGrid().supply<surveyGrid().used?'Grid deficit prevents alignment.':'Scientific staff align the array through actual work. '+Math.floor((f.alignment||0)/180*100)+'% complete.')+'</p></section>';
}
function frontierSitesDraw(left,top,right,bottom,time){
 for(const s of frontierState().sites){
  if(!s.seen||!Number.isFinite(s.x)||s.x<left||s.x>=right||s.y<top||s.y>=bottom)continue;
  const x=s.x*TS,y=s.y*TS,c=FRONTIER_SITE_TYPES[s.kind].color;
  ctx.fillStyle='#202c2a';ctx.fillRect(x+3,y+9,26,18);ctx.fillStyle=c;
  if(s.kind==='wreck'){ctx.fillRect(x+4,y+13,20,9);ctx.fillStyle='#645b4e';ctx.fillRect(x+8,y+10,7,4)}
  else if(s.kind==='seam'){for(let i=0;i<4;i++)ctx.fillRect(x+5+i*5,y+10+i%2*3,4,11-i)}
  else if(s.kind==='ruin'){ctx.fillRect(x+5,y+5,5,22);ctx.fillRect(x+22,y+3,5,24);ctx.fillRect(x+8,y+6,16,4)}
  else{ctx.beginPath();ctx.ellipse(x+16,y+18,11,7,0,0,Math.PI*2);ctx.fill()}
  if(!s.resolved){ctx.strokeStyle=c;ctx.strokeRect(x+2,y+2,28,28);ctx.fillStyle='#efd7a0';ctx.fillRect(x+14,y-4,4,4)}
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-site],[data-investigate],[data-site-cancel],[data-site-focus],[data-frontier-map]');if(!b)return;
 if(b.hasAttribute('data-frontier-map')){openSection('world');return}
 if(b.dataset.site){frontierSitePanel(b.dataset.site);return}
 if(b.dataset.investigate){frontierOrderSite(b.dataset.investigate,b.dataset.choice);frontierSitePanel(b.dataset.investigate);return}
 const s=frontierState().sites.find(s=>s.id===(b.dataset.siteCancel||b.dataset.siteFocus));if(!s)return;
 if(b.dataset.siteCancel){delete s.order;for(const p of S.colonists)if(p.task?.site===s.id){p.task=null;p.path=[]}save();frontierSitePanel(s.id)}
 else{camera.x=(s.x+.5)*TS;camera.y=(s.y+.5)*TS;closeSheet()}
});

let frontierCatalogMode='all',frontierCatalogSort='era';
function catalogResults(){
 const list=$('catalogresults');if(!list)return;
 const query=catalogQuery.toLowerCase().trim();
 const items=Object.entries(TYPES).filter(([id,t])=>(catalogGroup==='All'||GROUP_FOR[id]===catalogGroup)&&(!query||(t.name+' '+t.description+' '+GROUP_FOR[id]).toLowerCase().includes(query))&&(frontierCatalogMode!=='ready'||accessible(id)));
 const era=t=>researchDefinition(t.tech)?.era||0;
 items.sort(([a,t],[b,u])=>frontierCatalogSort==='name'?t.name.localeCompare(u.name):Number(accessible(b))-Number(accessible(a))||era(t)-era(u)||t.name.localeCompare(u.name));
 list.innerHTML=items.map(([id,t])=>{
  const ready=accessible(id),tech=researchDefinition(t.tech);
  return '<button class="civil-blueprint '+(ready?'ready':'future')+'" data-blueprint-detail="'+id+'" aria-label="Inspect '+t.name+'"><span class="civil-art">'+blueprintArt(id)+'<small>'+ (ready?'Blueprint ready':FRONTIER_ERAS[era(t)])+'</small></span><span class="civil-info"><span class="smallcaps">'+GROUP_FOR[id]+'</span><b>'+t.name+'</b><span>'+t.description+'</span><small>'+ (ready?Object.entries(t.cost).map(([k,n])=>n+' '+MATERIALS[k].verb).join(' · '):'Unlock: '+(tech?.name||'Founding research'))+'</small></span><span class="civil-arrow">'+uiIcon(ready?'build':'research',18)+'</span></button>';
 }).join('')||'<p>No matching blueprints. Try another category or show future designs.</p>';
 for(const b of $('sheet').querySelectorAll('[data-filter]'))b.classList.toggle('active',b.dataset.filter===catalogGroup);
}
function showCatalog(){
 sheetSection='build';const available=Object.keys(TYPES).filter(accessible).length;
 showSheet(sectionHeader('Build a civilization','FRONTIER DESIGN OFFICE')+'<div class="catalog-summary"><span>'+FRONTIER_ERAS[frontierEra()]+'</span><b>'+available+' / '+Object.keys(TYPES).length+' blueprints ready</b></div>'+'<details class="catalog-toolbox"><summary>Street &amp; field tools</summary>'+editorToolbar()+'</details>'+
 '<label class="searchwrap">'+uiIcon('inspect',18)+'<input id="catalogsearch" type="search" placeholder="Find a building or industry" aria-label="Search blueprints"></label>'+
 '<div class="catalogfilters">'+CATALOG_GROUPS.map(g=>'<button class="filterchip" data-filter="'+g+'">'+g+'</button>').join('')+'</div>'+
 '<div class="catalog-options"><button class="secondary" data-catalog-mode="all" aria-pressed="'+(frontierCatalogMode==='all')+'">All designs</button><button class="secondary" data-catalog-mode="ready" aria-pressed="'+(frontierCatalogMode==='ready')+'">Ready to build</button><select aria-label="Sort blueprints" data-catalog-sort><option value="era">Development order</option><option value="name" '+(frontierCatalogSort==='name'?'selected':'')+'>Name</option></select></div><div id="catalogresults" class="civil-catalog"></div>');
 $('catalogsearch').value=catalogQuery;catalogResults();renderNavState();
}
function frontierBlueprintDetail(id){
 const t=TYPES[id];if(!t)return;const tech=researchDefinition(t.tech),ready=accessible(id),recipe=FRONTIER_RECIPES[t.recipe];
 const alloyCompetition=(t.cost.alloy||0)>freightAvailable('alloy')&&S.buildings.some(b=>b.finished&&!b.editOrder&&!b.production?.paused&&FRONTIER_RECIPES[b.production?.recipe]?.cost?.alloy);
 showSheet(sectionHeader(t.name,GROUP_FOR[id]+' / '+(FRONTIER_ERAS[tech?.era||0]))+'<div class="facility-hero">'+blueprintArt(id)+'</div><p class="blueprint-lede">'+t.description+'</p>'+
 '<div class="blueprint-specs"><span><b>'+t.w+' × '+t.h+'</b>footprint</span><span><b>'+ (t.power>0?'+':'')+t.power+'</b>power</span><span><b>'+ (t.beds||t.storage||t.time)+'</b>'+ (t.beds?'beds':t.storage?'storage':'build work')+'</span></div>'+
 '<h3>Construction supplies</h3><div class="material-chips">'+Object.entries(t.cost).map(([k,n])=>'<span class="'+(freightAvailable(k)<n?'short':'')+'">'+n+' '+MATERIALS[k].name+' <small>'+freightAvailable(k)+' available</small></span>').join('')+'</div>'+
 (alloyCompetition?'<p class="supply-guidance">Fabrication is using alloy. To save for this blueprint, pause alloy-consuming production until the construction supplies are ready. <button class="secondary" data-open="industry">Manage production</button></p>':'')+
 (recipe?'<section class="chain-preview"><h3>Production chain</h3><p>'+Object.entries(recipe.cost).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+' → '+Object.entries(recipe.output).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+'</p><small>Delivered inputs · labour · '+recipe.seconds+' work seconds · '+(-t.power)+' power</small></section>':'')+
 (FRONTIER_UPGRADABLE.has(id)?'<p>Upgradeable through physically supplied construction work after the appropriate technology.</p>':'')+
 (ready?'<button class="primary wide-action" data-build="'+id+'">'+uiIcon('build',18)+' Place blueprint</button>':'<button class="primary wide-action" data-tech-detail="'+t.tech+'">'+uiIcon('research',18)+' Discover '+(tech?.name||'research')+'</button>')+'<button class="secondary" data-open="build">Back to designs</button>');
}
function frontierCommandHero(){
 const f=frontierState(),built=S.buildings.filter(b=>b.finished).length;
 const objective=frontierObjective();
 return '<section class="civilization-hero"><span class="smallcaps">'+FRONTIER_ERAS[frontierEra()]+' / '+esc(S.seed)+'</span><h3>A small home.<br>A wider horizon.</h3><p>'+built+' established structures · '+f.sites.filter(s=>s.resolved).length+' planetary investigations</p><button data-open="research">'+uiIcon('research',18)+' '+esc(objective)+' <span>›</span></button></section>';
}
function frontierObjective(){
 if(S.goal<6)return surveyObjective();
 if(!finished('sawmill').length)return 'Build a sawmill and process structural timber';
 if(!finished('cabin').length)return 'Develop permanent frontier cabins';
 if(!finished('smelter').length)return 'Establish dedicated metallurgy';
 if(!finished('fabricator').length)return 'Fabricate the next generation of equipment';
 if(!finished('outpost').length)return 'Establish a forward expedition base';
 if(frontierState().sites.filter(s=>s.resolved).length<3)return 'Investigate three planetary sites';
 if(!finished('observatory').length)return 'Construct the Signal Observatory';
 return frontierState().signalComplete?'A second horizon awaits':'Align the planetary listening array';
}
function frontierFacilityHero(b){
 const src=TYPES[b.type]||['lander','camp','supplies'].includes(b.type)?FarwakeBuildings.thumbnail(b.type):null;
 return '<div class="facility-hero">'+(src?'<img alt="'+esc(facilityName(b))+'" class="plate" src="'+src+'">':uiIcon('colony',64))+'<span><b>'+ (b.finished?'Established':'Under construction')+'</b><small>Level '+(b.level||1)+' · '+frontierDistrict(b)+'</small></span></div>';
}
function frontierFacilityRows(){
 return S.buildings.filter(b=>!['path','road'].includes(b.type)).map(b=>{
  const active=S.colonists.filter(p=>p.task?.id===b.id).length;
  const status=!b.finished?'Under construction':b.upgradeOrder?'Expanding':frontierProducer(b)||['garden','workshop'].includes(b.type)?industrySummary(b):housingBeds(b)?housingResidents(b).length+' / '+housingBeds(b)+' residents':active+' active workers';
  return '<button data-facility="'+b.id+'"><img class="plate" alt="" src="'+FarwakeBuildings.thumbnail(b.type)+'"><span><b>'+facilityName(b)+'</b><small>'+esc(status)+'</small></span><span>›</span></button>';
 }).join('');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-blueprint-detail],[data-catalog-mode]');if(!b)return;
 if(b.dataset.blueprintDetail)frontierBlueprintDetail(b.dataset.blueprintDetail);
 else{frontierCatalogMode=b.dataset.catalogMode;showCatalog()}
});
document.addEventListener('change',e=>{if(e.target.matches('[data-catalog-sort]')){frontierCatalogSort=e.target.value;catalogResults()}});

function frontierProductionFacts(b){
 const r=productionRecord(b);
 return '<p>Worker: '+(productionWorkers(b).map(p=>esc(p.name)).join(', ')||'Awaiting dispatch')+'</p><p>'+r.cycles+' batches completed · '+r.output+' units produced</p><p>Delivered: '+(Object.entries(b.siteStock||{}).filter(([,n])=>n>0).map(([k,n])=>n+' '+MATERIALS[k].name).join(', ')||'None')+'</p>';
}
function frontierCancelResearch(){
 const active=frontierState().research;if(!active)return false;
 const cost=researchDefinition(active.id).cost;
 S.resources.knowledge+=Math.floor(cost*Math.max(0,1-active.progress/active.effort));
 delete frontierState().research;save();return true;
}
document.addEventListener('click',e=>{if(e.target.closest('[data-research-cancel]')){frontierCancelResearch();openSection('research')}});
guideEntries.push(
 ['Research','Connected technologies','Open Research from the bottom navigation. Scroll the tree horizontally through eras; branch buttons jump between subjects. Tap a future building in Build to inspect its production chain and required technology. Study needs knowledge plus actual researcher work. Only one technology can be studied at a time.'],
 ['Manufacturing','Frontier production chains','Sawmills turn timber into boards. Smelters turn ore into metal. Component Works use metal and alloy for components, or boards and metal for composite panels. Haulers deliver inputs to each facility before a worker starts. Change recipes between completed batches.'],
 ['Agriculture','Water, glasshouses and kitchens','Rainwater Works collect filtered water through operator labour. Glasshouses consume water to produce food. Community Kitchens cook food and water into prepared meals. Colonists prefer meals and can eat accessible loose food when stores are empty. Existing grow beds retain their planting, tending and harvest cycle.'],
 ['Housing','Development and new settlers','Cabins have four permanent beds and Lodges eight. Inspect a suitable building to order an expansion; haulers and builders must complete it before capacity changes. The Assembly Hall can invite one settler at a time when the beacon, a free permanent bed, thirty stored provisions and a completed planetary investigation are ready.'],
 ['Exploration','Planetary investigations and outposts','Surveying reveals finite sites. Inspect one to choose knowledge-focused study or component recovery. Both return a physical ancient core once. Distant sites require a constructed outpost within thirteen tiles. Outposts also provide temporary beds and shared storage.'],
 ['Exploration','Seams and the listening frontier','Investigated mineral formations reveal a finite 180-ore seam. Build an Extraction Rig within six tiles and provide power and labour. The Signal Observatory requires advanced materials and recovered cores; scientific staff then align its powered array.'],
 ['Construction','A settlement with history','Work, harvests, actual indoor time, visits, street traffic and age are saved on each structure. These real counters add restrained signs of habitation, cultivation and wear. Occupied heated homes show evening smoke and actual indoor silhouettes.']
);

// Expansion geology is generated once, persisted, and restored only while unmined.
// The old starter outcrops and all harvested IDs retain their original meaning.
function frontierSurfaceGeology(){
 const f=frontierState();
 if(!Array.isArray(f.surfaceDeposits)){
  const reach=surveyDistances(28,29,(x,y)=>terrain[index(x,y)].kind!=='water');
  const candidates=[];
  for(let y=3;y<VH-3;y++)for(let x=3;x<VW-3;x++){
   const d=Math.hypot(x-28,y-28);
   if(d<10||d>27||reach[index(x,y)]<0||buildingAt(x,y)||featureAt(x,y))continue;
   candidates.push({x,y,near:d<=16,rank:hash(x,y,hashStr(S.seed)+6127)});
  }
  candidates.sort((a,b)=>Number(b.near)-Number(a.near)||b.rank-a.rank);
  f.surfaceDeposits=[];
  for(const q of candidates){
   if(f.surfaceDeposits.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<3))continue;
   f.surfaceDeposits.push({x:q.x,y:q.y,amount:9});if(f.surfaceDeposits.length>=16)break;
  }
 }
 const retired=new Set(S.harvested||[]),existing=new Set(features.map(p=>p.id));
 for(const q of f.surfaceDeposits){
  const id='frontier-ore-'+q.x+'-'+q.y;
  if(retired.has(id)||existing.has(id)||buildingAt(q.x,q.y))continue;
  features.push({...q,id,type:'ore',workTime:18});existing.add(id);
 }
 f.surfaceVersion=1;
}

INDUSTRY_RECIPES.refined={name:'Cast refined metal',cost:{metal:2,scrap:1},yield:2,seconds:11,tech:'refining'};
function frontierAutoRecipe(b){
 const r=productionRecord(b);if(r.manualRecipe||r.paused)return;
 // Preserve scarce ore for dedicated smelting once that industry exists.
 if(S.research.includes('refining')&&(S.resources.scrap||0)>=46&&(S.resources.ore||0)<30&&r.elapsed===0&&r.recipe!=='recycle'){r.recipe='recycle';r.manualRecipe=false;}
 const ready=recipe=>Object.entries(recipe.cost).every(([k,n])=>(S.resources[k]||0)>=n);
 if(ready(chosenRecipe(r)))return;
 const alternative=industryRecipes(b).find(([,recipe])=>ready(recipe));
 if(alternative){r.recipe=alternative[0];r.elapsed=0;r.manualRecipe=false;}
}

function frontierPowerDispatch(){
 let grid=surveyGrid();
 if(grid.supply<grid.used){
  const candidates=S.buildings.filter(b=>b.finished&&!b.editOrder&&frontierProducer(b)&&!productionRecord(b).paused).sort((a,b)=>{
   const priority=b=>['kitchen','pump','greenhouse'].includes(b.type)?1:0;
   return priority(a)-priority(b)||b.id-a.id;
  });
  for(const b of candidates){
   productionRecord(b).paused=true;b.autoPowerHold=true;grid=surveyGrid();
   if(grid.supply>=grid.used)break;
  }
 }
 for(const b of S.buildings)if(b.autoPowerHold&&b.finished&&!b.editOrder){
  grid=surveyGrid();if(grid.supply-grid.used>=-TYPES[b.type].power){productionRecord(b).paused=false;delete b.autoPowerHold;}
 }
}

function frontierPlacementReason(type,x,y,ignoreId=null){
 if(['path','road'].includes(type))return '';
 const t=TYPES[type];if(!t)return '';
 const inside=(px,py)=>px>=x&&px<x+t.w&&py>=y&&py<y+t.h;
 for(const b of S.buildings){
  if(b.id===ignoreId)continue;const door=FarwakeBuildings.entrance(b);if(!door)continue;
  if(inside(b.x+Math.floor((door.x+door.w/2)/32),b.y+b.h))return 'Keep the existing doorway approach clear';
 }
 const door=FarwakeBuildings.entrance({type,x,y,w:t.w,h:t.h});
 if(door){const xx=x+Math.floor((door.x+door.w/2)/32),yy=y+t.h;
  if(!inMap(xx,yy)||terrain[index(xx,yy)].kind==='water'||S.buildings.some(b=>b.id!==ignoreId&&b.type!=='path'&&b.type!=='road'&&xx>=b.x&&xx<b.x+b.w&&yy>=b.y&&yy<b.y+b.h))return 'The entrance needs a clear approach';
 }
 return frontierAccessReason(type,x,y,ignoreId);
}

function frontierObjectivePanel(){
 if(S.goal<3)return 'build';
 if(S.goal===3)return S.research.includes('signal')?'build':'research';
 if(S.goal===4)return 'world';
 if(S.goal===5)return 'research';
 const next=[['sawmill','timbercraft'],['cabin','cabins'],['smelter','refining'],['fabricator','fabrication'],['outpost','fieldstations'],['observatory','resonance']].find(([type])=>!finished(type).length);
 return next?(S.research.includes(next[1])?'build':'research'):frontierState().sites.filter(s=>s.resolved).length<3?'world':'colony';
}

// A surveyed seam can be worked by hand before the colony can afford a rig.
// Both methods draw from the same finite deposit; powered extraction is faster
// and frees the Surveyor for expeditions.
function frontierOrderExtraction(id,enabled){
 const s=frontierState().sites.find(s=>s.id===id);
 if(!s?.resolved||s.kind!=='seam'||s.remaining<5||!frontierSiteReach(s))return false;
 s.handMining=!!enabled;
 for(const p of S.colonists)if(p.task?.seam===id||enabled&&['survey','research'].includes(p.task?.type)&&p.role==='Surveyor'){p.task=null;p.path=[]}
 save();return true;
}
function frontierFieldExtractionTarget(p){
 if(p.role!=='Surveyor'&&p.work!=='survey')return null;
 if(industryOwned('ore')+5>industryPolicy().targets.ore)return null;
 const s=frontierState().sites.find(s=>s.handMining&&s.resolved&&s.remaining>=5&&frontierSiteReach(s)&&!S.colonists.some(q=>q!==p&&q.task?.seam===s.id));
 return s?{type:'harvest',seam:s.id,x:s.x,y:s.y}:null;
}
function frontierFieldExtract(p,work){
 const s=frontierState().sites.find(s=>s.id===p.task?.seam);
 if(!s?.handMining||s.remaining<5||!frontierSiteReach(s)){p.task=null;return}
 s.handProgress=(s.handProgress||0)+work;if(s.handProgress<32)return;
 s.handProgress=0;s.remaining-=5;freightOutput('ore',5,{x:s.x,y:s.y,w:1,h:1});
 frontierState().produced.ore=(frontierState().produced.ore||0)+5;
 if(s.remaining<5)s.handMining=false;p.task=null;p.action=0;save();
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-field-extraction]');if(!button)return;const s=frontierState().sites.find(s=>s.id===button.dataset.fieldExtraction);if(s){frontierOrderExtraction(s.id,!s.handMining);frontierSitePanel(s.id)}});

function frontierFieldExtractionStatus(s){
 if(s.remaining<5)return 'This finite seam is exhausted.';
 if(!frontierSiteReach(s))return 'Needs an expedition outpost within thirteen tiles.';
 if(!s.handMining)return 'No field extraction order.';
 if(industryOwned('ore')+5>industryPolicy().targets.ore)return 'Ore target met · maintaining '+industryPolicy().targets.ore+'. Raise the target to continue.';
 const worker=S.colonists.find(p=>p.task?.seam===s.id);
 return worker?worker.name+' · '+Math.floor((s.handProgress||0)/32*100)+'% of the next load recovered.':'Waiting for an available Surveyor · food, rest and current orders come first.';
}
function frontierRefreshDiscovery(){
 if(sheetSection!=='discovery')return;
 const s=frontierState().sites.find(s=>s.id===inspectedDiscovery),el=$('field-extraction-status');
 if(s&&el)el.textContent=frontierFieldExtractionStatus(s);
}

let frontierAccessCache=null,approachCache=null;
function approachStamp(){
 let sig=S.buildings.length>>>0;
 for(const b of S.buildings)if(!['path','road'].includes(b.type))sig=(Math.imul(sig,33)^(b.id+b.x+1+((b.y+1)<<8)+(b.w<<16)+(b.h<<20)))>>>0;
 return sig;
}
function waterCount(){let n=0;for(let i=0;i<terrain.length;i++)if(terrain[i].kind==='water')n++;return n}
// Crews stand on any adjacent walkable tile. Doorless sites (turbine, solar, battery) use the same rule as doorways.
function siteApproachOpen(b){
 if(!b)return false;
 const stamp=approachStamp();
 if(approachCache?.state!==S||approachCache.stamp!==stamp)approachCache={state:S,stamp,map:new Map()};
 if(approachCache.map.has(b.id))return approachCache.map.get(b.id);
 const anchor=S.buildings.find(q=>q.type==='lander');
 let open=true;
 if(anchor){
  const door=FarwakeBuildings.entrance(anchor);
  if(door){
   const sx=anchor.x+Math.floor((door.x+door.w/2)/32),sy=anchor.y+anchor.h;
   const dist=surveyDistances(sx,sy,walkable);
   open=neighborGoals(b.x,b.y,b.w,b.h).some(q=>dist[index(q.x,q.y)]>=0);
  }
 }
 approachCache.map.set(b.id,open);return open;
}
function frontierMarkAccess(b){
 if(!b||b.finished||['path','road'].includes(b.type)){if(b?.accessBlocked)delete b.accessBlocked;return true}
 if(siteApproachOpen(b)){if(b.accessBlocked)delete b.accessBlocked;return true}
 b.accessBlocked='Access blocked';return false;
}
function frontierRestoreAccess(){
 approachCache=null;
 for(const b of S.buildings)frontierMarkAccess(b);
 for(const p of S.colonists){
  if(p.carry?.site==null)continue;
  const site=S.buildings.find(b=>b.id===p.carry.site);
  if(!site||frontierMarkAccess(site))continue;
  freightOutside(p.carry.kind,p.carry.amount,p,{site:site.id});
  p.carry=null;p.task=null;p.path=[];
 }
}
function frontierAccessReason(type,x,y,ignoreId){
 const key=[type,x,y,ignoreId,approachStamp(),waterCount(),uid].join(':');
 if(frontierAccessCache?.state===S&&frontierAccessCache.key===key)return frontierAccessCache.reason;
 const t=TYPES[type],anchor=S.buildings.find(b=>b.type==='lander');
 if(!anchor||!t)return '';
 const port=b=>{const d=FarwakeBuildings.entrance(b);return d?{x:b.x+Math.floor((d.x+d.w/2)/32),y:b.y+b.h}:null};
 const start=port(anchor);if(!start)return '';
 const blocked=(xx,yy)=>xx>=x&&xx<x+t.w&&yy>=y&&yy<y+t.h;
 const pass=(xx,yy)=>inMap(xx,yy)&&terrain[index(xx,yy)].kind!=='water'&&!S.buildings.some(b=>b.id!==ignoreId&&!['path','road'].includes(b.type)&&xx>=b.x&&xx<b.x+b.w&&yy>=b.y&&yy<b.y+b.h);
 const before=surveyDistances(start.x,start.y,pass),after=surveyDistances(start.x,start.y,(xx,yy)=>!blocked(xx,yy)&&pass(xx,yy));
 let reason='';const next=port({type,x,y,w:t.w,h:t.h});
 if(next&&after[index(next.x,next.y)]<0)reason='The entrance needs a connected route to the settlement';
 if(!next&&!neighborGoals(x,y,t.w,t.h).some(q=>!blocked(q.x,q.y)&&after[index(q.x,q.y)]>=0))reason='Construction crews need a connected approach to this site';
 for(const b of S.buildings){
  if(reason||b.id===ignoreId)continue;const d=port(b);
  if(d&&before[index(d.x,d.y)]>=0&&after[index(d.x,d.y)]<0)reason='This would cut off '+facilityName(b)+'. Leave a connected route.';
  if(!reason&&!b.finished&&!['path','road'].includes(b.type)){
   const around=neighborGoals(b.x,b.y,b.w,b.h);
   if(around.some(q=>before[index(q.x,q.y)]>=0)&&!around.some(q=>!blocked(q.x,q.y)&&after[index(q.x,q.y)]>=0))reason='This would cut off '+facilityName(b)+'. Leave a connected route.';
  }
  if(!reason&&b.type==='supplies'){
   const around=neighborGoals(b.x,b.y,b.w,b.h);
   if(around.some(q=>before[index(q.x,q.y)]>=0)&&!around.some(q=>!blocked(q.x,q.y)&&after[index(q.x,q.y)]>=0))reason='This would cut off the supply pallet. Leave a hauling route.';
  }
 }
 frontierAccessCache={state:S,key,reason};return reason;
}
