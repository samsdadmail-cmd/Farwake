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
 pump:{name:'Rainwater Works',w:2,h:2,power:-1,time:22,cost:{wood:10,scrap:15,alloy:2},tech:'waterworks',group:'Food',description:'An operator collects and filters water for greenhouses and meals.',recipe:'water'},
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
 refining:{name:'Dedicated smelting',branch:'industry',era:2,cost:30,requires:['timbercraft','energy'],unlocks:['smelter'],effort:14,requirement:'Complete three workshop batches',gate:()=>industryPolicy().batches>=3},
 windpower:{name:'Wind engineering',branch:'power',era:2,cost:30,requires:['refining'],unlocks:['wind'],effort:12,requirement:'Refine twelve metal',gate:()=>frontierProduced('metal')>=12},
 glasshouse:{name:'Protected cultivation',branch:'food',era:2,cost:30,requires:['waterworks','refining'],unlocks:['greenhouse'],effort:14,requirement:'Complete three crop harvests',gate:()=>industryPolicy().harvests>=3},
 fabrication:{name:'Machine fabrication',branch:'industry',era:3,cost:42,requires:['refining'],unlocks:['fabricator'],effort:18,requirement:'Refine twenty-four metal and discover a planetary site',gate:()=>frontierProduced('metal')>=24&&frontierState().sites.some(s=>s.seen)},
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
 f.version=1;
}
function frontierProduced(kind){return frontierState().produced[kind]||0}
function researchDefinition(id){return FRONTIER_TECH[id]||foundingResearchDefinition(id)}
function researchReason(id){
 const t=FRONTIER_TECH[id];
 if(!t)return foundingResearchReason(id);
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
let techZoom=1;
function frontierTree(){
 const legacy={
 growth:['food',0],energy:['power',0],medicine:['community',0],signal:['science',1],
 optics:['science',0],irrigation:['food',3],metallurgy:['industry',4],heliostat:['power',4],traverse:['science',3]
 };
 const nodes=Object.entries({...TECHS,...fieldResearch,...FRONTIER_TECH}).map(([id,t])=>({id,t,branch:t.branch||legacy[id]?.[0]||'freight',era:t.era??legacy[id]?.[1]??0}));
 const slots={},positions={};const branches=Object.keys(FRONTIER_BRANCHES),rowHeight=345,colWidth=230;
 for(const n of nodes){const cell=n.branch+'-'+n.era,slot=slots[cell]||0;slots[cell]=slot+1;positions[n.id]={x:136+n.era*colWidth,y:70+branches.indexOf(n.branch)*rowHeight+slot*156}}
 const width=1295,height=branches.length*rowHeight+70;
 const lines=nodes.flatMap(({id,t})=>(Array.isArray(t.requires)?t.requires:t.requires?[t.requires]:[]).filter(k=>positions[k]).map(k=>{
  const a=positions[k],b=positions[id];
  return '<path d="M'+(a.x+188)+' '+(a.y+68)+' C'+(a.x+210)+' '+(a.y+68)+','+(b.x-24)+' '+(b.y+68)+','+b.x+' '+(b.y+68)+'" class="'+(S.research.includes(k)?'connected':'')+'"/>';
 })).join('');
 const active=frontierState().research;
 return '<div class="era-rail">'+FRONTIER_ERAS.map((n,i)=>'<span class="'+(i===frontierEra()?'current':'')+'">'+n+'</span>').join('')+'</div>'+
 '<div class="tree-controls"><span>Drag the tree to explore · '+S.resources.knowledge+' knowledge</span><button class="secondary" data-tech-zoom="-1" aria-label="Zoom technology tree out">−</button><button class="secondary" data-tech-zoom="1" aria-label="Zoom technology tree in">+</button></div>'+
 '<div class="tech-viewport" tabindex="0" aria-label="Technology tree, scroll to explore"><div class="tech-space" style="width:'+width*techZoom+'px;height:'+height*techZoom+'px"><div class="tech-board" style="width:'+width+'px;height:'+height+'px;transform:scale('+techZoom+')">'+
 '<svg class="tech-links" width="'+width+'" height="'+height+'" aria-hidden="true">'+lines+'</svg>'+
 FRONTIER_ERAS.map((n,i)=>'<h3 class="tech-era" style="left:'+(136+i*colWidth)+'px">'+n+'</h3>').join('')+
 branches.map((id,i)=>'<div class="tech-branch" style="top:'+(70+i*rowHeight)+'px">'+uiIcon(FRONTIER_BRANCHES[id][1],22)+'<b>'+FRONTIER_BRANCHES[id][0]+'</b></div>').join('')+
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
 '<p>'+ (t.requirement||'Founding expedition knowledge')+'</p><button class="primary" data-tech-start="'+id+'" '+(missing||active?'disabled':'')+'>'+(active?'Researchers are studying this':missing||'Begin study · '+t.cost+' knowledge')+'</button><button class="secondary" data-open="research">Back to tree</button>');
}
document.addEventListener('click',e=>{
 const detail=e.target.closest('[data-tech-detail]');if(detail){frontierTechDetail(detail.dataset.techDetail);return}
 const start=e.target.closest('[data-tech-start]');if(start){frontierBeginResearch(start.dataset.techStart);return}
 const zoom=e.target.closest('[data-tech-zoom]');if(zoom){techZoom=clamp(techZoom+Number(zoom.dataset.techZoom)*.15,.55,1.3);openSection('research')}
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
 if(r.paused)return 'Production paused';
 if(!recipe||recipe.facility!==b.type)return 'Select a facility recipe';
 if(power().supply<power().used)return 'Insufficient grid power';
 const over=Object.entries(recipe.output).some(([k,n])=>industryOwned(k)+n>industryPolicy().targets[k]);
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
 if(Object.entries(recipe.output).some(([k,n])=>industryOwned(k)+n>industryPolicy().targets[k]))return;
 if(Object.keys(recipe.cost).length&&freightReserve(recipe.cost,b))b.inputOrder=true;
}
function frontierSeam(b){
 return frontierState().sites.find(s=>s.kind==='seam'&&s.resolved&&s.remaining>=5&&Math.hypot(s.x-b.x,s.y-b.y)<=6);
}
function industryDetails(b){
 if(!frontierProducer(b))return foundingIndustryDetails(b);
 const r=productionRecord(b),recipe=FRONTIER_RECIPES[r.recipe],workers=productionWorkers(b);
 return '<section class="production-panel"><div class="production-title"><b>'+esc(industrySummary(b))+'</b><span>'+r.cycles+' batches</span></div>'+
 '<div class="progress"><i style="width:'+Math.min(100,r.elapsed/recipe.seconds*100)+'%"></i></div>'+
 '<p>'+Object.entries(recipe.cost).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+' → '+Object.entries(recipe.output).map(([k,n])=>n+' '+MATERIALS[k].name).join(' + ')+'</p>'+
 '<p>Worker: '+(workers.map(p=>esc(p.name)).join(', ')||'Awaiting dispatch')+'</p>'+
 '<p>Delivered inputs: '+(Object.entries(b.siteStock||{}).filter(([,n])=>n>0).map(([k,n])=>n+' '+MATERIALS[k].name).join(', ')||'None')+'</p>'+
 '<label>Recipe'+industrySelect('Facility recipe',r.recipe,industryRecipes(b).map(([k,v])=>[k,v.name]),'data-industry-recipe="'+b.id+'"')+'</label>'+
 '<button class="secondary" data-industry-pause="'+b.id+'">'+(r.paused?'Resume':'Pause')+'</button></section>';
}
let frontierInterval=0;
function frontierTick(step){
 frontierInterval+=step;if(frontierInterval<1)return;frontierInterval%=1;
 const grid=surveyGrid();
 for(const b of S.buildings){
  if(b.type==='lamppost')b.powered=grid.supply>=grid.used;
  const h=frontierHistory(b);h.ageDays=Math.max(0,S.day-h.createdDay);
  if(['garden','greenhouse'].includes(b.type))h.harvests=productionRecord(b).cycles||0;
  frontierRequestInputs(b);
 }
}
function frontierRefreshTree(){
 if(sheetSection!=='research')return;
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
 }
 const halls=S.buildings.filter(b=>b.finished&&!b.editOrder&&['dining','kitchen'].includes(b.type)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 for(const b of [...halls,...storageBuildings()]){
   const t={type:'eat',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};if(setTask(p,t))return t;
 }
 return {type:'eat',outdoors:true,x:Math.floor(p.x),y:Math.floor(p.y)};
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
