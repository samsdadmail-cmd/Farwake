// S.resources is the backward-compatible total. Per-store accounts hold that same
// inventory, not a second supply. Every transaction updates both in the same tick.
function freightFlow(k,n,key){
 S.freightFlow??={};if(S.freightFlow.day!==S.day)S.freightFlow={day:S.day};
 const series=S.freightFlow[key]??={};series[k]=(series[k]||0)+n;
}
function freightFlowTable(){
 const f=S.freightFlow?.day===S.day?S.freightFlow:{};
 return '<details><summary>Production &amp; consumption today</summary>'+Object.entries(MATERIALS).map(([k,m])=>'<div class="service"><span>'+m.name+'</span><strong>+'+(f.produced?.[k]||0)+' / −'+(f.consumed?.[k]||0)+'</strong></div>').join('')+'</details>';
}
function freightCap(b){return (b.type==='supplies'?340:FRONTIER_BUILDINGS[b.type]?.storage||180)+((b.level||1)-1)*90}
function freightUsed(b){return Object.values(b.stock||{}).reduce((a,v)=>a+v,0)}
function freightAccepts(b,k){return !b.reject?.includes(k)}
function freightRecorded(id){return S.colonists.reduce((n,p)=>n+(p.carry?.dest===id?p.carry.amount:0)+(p.task?.type==='haul_pickup'&&p.task.dest===id?p.task.amount:0),0)}
function freightFree(b){return Math.max(0,freightCap(b)-freightUsed(b)-freightRecorded(b.id))}
function freightOutside(kind,amount,origin,flags={}){
 if(!amount)return;
 const ox=clamp(Math.floor(origin.x),0,VW-1),oy=clamp(Math.floor(origin.y),0,VH-1);
 let tile=null;
 for(let r=0;r<VW+VH&&!tile;r++){
  for(let dy=-r;dy<=r&&!tile;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const x=ox+dx,y=oy+dy;
   if(!inMap(x,y)||!walkable(x,y)||buildingAt(x,y)||featureAt(x,y))continue;
   const pile=pileAt(x,y);
   if(pile){if(pile.kind===kind&&!!pile.hold===!!flags.hold&&pile.site===flags.site){pile.amount+=amount;return pile}continue}
   tile={x,y};break;
  }
 }
 const q={id:'lot-'+(uid++),...(tile||{x:ox,y:oy}),kind,amount,...flags};S.piles.push(q);return q;
}
function freightInit(){
 for(const b of S.buildings)if(b.editOrder&&b.stock)freightRemoveStore(b);
 const stores=storageBuildings();
 // A legacy save already paid for unfinished buildings when their blueprints were placed.
 for(const b of S.buildings)if(!b.finished&&!b.reservedMaterials){b.reservedMaterials={...TYPES[b.type]?.cost};b.siteStock={...b.reservedMaterials}}
 for(const b of stores)b.stock??={};
 for(const k of Object.keys(MATERIALS)){
  const total=S.resources[k]||0;
  let delta=total-stores.reduce((n,b)=>n+(b.stock[k]||0),0);
  for(const b of stores){
   const part=delta<0?-Math.min(-delta,b.stock[k]||0):Math.min(delta,Math.max(0,freightCap(b)-freightUsed(b)));
   b.stock[k]=(b.stock[k]||0)+part;delta-=part;
  }
  if(delta>0){freightOutside(k,delta,stores[0]||{x:28,y:28});S.resources[k]-=delta}
 }
}
function freightAvailable(k){return (S.resources[k]||0)+S.piles.reduce((n,p)=>n+(p.kind===k&&!p.hold&&p.site==null?p.amount:0),0)}
function freightDrain(k,qty,onTake){
 let left=qty;
 for(const b of storageBuildings()){
  const take=Math.min(left,b.stock?.[k]||0);
  if(take){b.stock[k]-=take;S.resources[k]-=take;left-=take;onTake?.(take,b)}
  if(!left)break;
 }
 return qty-left;
}
function freightSpend(cost){
 if(Object.entries(cost).some(([k,n])=>!MATERIALS[k]||!Number.isFinite(n)||n<0||(S.resources[k]||0)<n))return false;
 for(const [k,n] of Object.entries(cost)){freightDrain(k,n);freightFlow(k,n,'consumed')}
 return true;
}
function freightReserve(cost,b){
 if(Object.entries(cost).some(([k,n])=>!MATERIALS[k]||!Number.isFinite(n)||n<0||freightAvailable(k)<n))return false;
 b.reservedMaterials={...cost};b.siteStock={};
 for(const [k,qty] of Object.entries(cost)){
  let left=qty-freightDrain(k,qty,(n,store)=>freightOutside(k,n,store,{site:b.id}));
  for(const q of S.piles.slice()){
   if(!left)break;
   if(q.kind!==k||q.site!=null||q.hold)continue;
   const n=Math.min(left,q.amount);
   if(n===q.amount){q.site=b.id;}else{q.amount-=n;freightOutside(k,n,q,{site:b.id})}
   left-=n;
   for(const p of S.colonists)if(p.task?.type==='haul_pickup'&&p.task.pileId===q.id){p.task=null;p.path=[]}
  }
 }
 return true;
}
function freightSiteReady(b){return Object.entries(b.reservedMaterials||{}).every(([k,v])=>(b.siteStock?.[k]||0)>=v)}
function freightRefund(cost,b){for(const [k,n] of Object.entries(cost))if(n>0)freightOutside(k,n,b)}
function freightCancel(b,fraction=1){
 for(const pile of S.piles)if(pile.site===b.id)delete pile.site;
 for(const p of S.colonists){
  if(p.carry?.site===b.id){delete p.carry.site;delete p.carry.dest;p.task=null;p.path=[]}
 }
 freightRefund(Object.fromEntries(Object.entries(b.siteStock||{}).map(([k,v])=>[k,Math.floor(v*fraction)])),b);
 b.reservedMaterials={};b.siteStock={};
}
function freightRemoveStore(b){
 for(const [k,n] of Object.entries(b.stock||{})){if(n>0){freightOutside(k,n,b);S.resources[k]-=n}}
 b.stock={};
}
function freightOutput(k,n,b){freightFlow(k,n,'produced');return freightOutside(k,n,b)}
function freightSite(id){return S.buildings.find(b=>(!b.finished||b.inputOrder||b.upgradeOrder)&&b.id===id)}
function freightCandidateStores(p,k){return storageBuildings().filter(b=>freightAccepts(b,k)).sort((a,b)=>(b.priority||0)-(a.priority||0)||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))}
function freightClaim(p,q){
 if(!q||q.hold||S.colonists.some(z=>z!==p&&z.task?.type==='haul_pickup'&&z.task.pileId===q.id))return false;
 const site=freightSite(q.site);
 const dest=site||freightCandidateStores(p,q.kind).find(b=>freightFree(b)>0);
 if(!dest)return false;
 const amount=Math.min(12,q.amount,site?Infinity:freightFree(dest));
 return !!amount&&setTask(p,{type:'haul_pickup',pileId:q.id,dest:dest.id,amount,x:q.x,y:q.y});
}
function freightPlan(p){
 if(p.carry){
  const c=p.carry,site=freightSite(c.site);
  for(const b of site?[site]:freightCandidateStores(p,c.kind)){
   const room=freightFree(b)+(c.dest===b.id?c.amount:0);
   if(!site&&room<c.amount)continue;
   const t={type:'haul_dropoff',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};
   if(setTask(p,t)){c.dest=b.id;return p.task}
  }
  freightOutside(c.kind,c.amount,p,site?{site:site.id}:{});
  p.carry=null;p.task=null;p.path=[];return null;
 }
 if(!['auto','gather','build','haul'].includes(p.work))return null;
 const urgent=S.freightUrgent||'';
 const rank=q=>q.site!=null?3:q.kind===urgent?2:1;
 const ordered=S.piles.filter(q=>!q.hold).sort((a,b)=>rank(b)-rank(a)||Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y));
 for(const q of ordered)if(freightClaim(p,q))return p.task;
 return null;
}
function freightPickup(p,t){
 const q=pileById(t.pileId);if(!q||q.hold){p.task=null;return}
 const n=Math.min(q.amount,t.amount||12);
 p.carry={kind:q.kind,amount:n,dest:t.dest,site:q.site};
 q.amount-=n;if(!q.amount)S.piles=S.piles.filter(l=>l!==q);
 FarwakeWorkFX.transfer('pickup',p,p.carry);localSound('pickup',p);
 p.task=null;p.path=[];p.action=0;freightPlan(p);save();
}
function freightDeliver(p,t){
 const c=p.carry;if(!c){p.task=null;return}
 const site=freightSite(c.site),dst=S.buildings.find(b=>b.id===t.id);
 if(site&&site===dst){site.siteStock??={};site.siteStock[c.kind]=(site.siteStock[c.kind]||0)+c.amount}
 else if(!site&&dst?.finished&&storageBuildings().includes(dst)&&freightAccepts(dst,c.kind)&&freightCap(dst)-freightUsed(dst)>=c.amount){
  dst.stock??={};dst.stock[c.kind]=(dst.stock[c.kind]||0)+c.amount;S.resources[c.kind]=(S.resources[c.kind]||0)+c.amount;
 }else{p.task=null;p.path=[];freightPlan(p);return}
 FarwakeWorkFX.transfer('delivery',p,c);localSound('drop',p);
 log('',p.name+' delivered '+c.amount+' '+MATERIALS[c.kind].name.toLowerCase()+(site?(site.finished?' to production.':' to construction.'):' to storage.'));
 p.carry=null;p.task=null;p.path=[];p.action=0;save();
}
function freightStatus(){
 const waiting=S.piles.filter(q=>q.site==null&&!q.hold);
 const blocked=waiting.find(q=>!storageBuildings().some(b=>freightAccepts(b,q.kind)&&freightFree(b)>0));
 if(blocked)return MATERIALS[blocked.kind].name+' waits outdoors: no accepting store has space. Enable a filter, move stock out or build a shed.';
 const crates=S.piles.filter(q=>q.site!=null).length;
 if(crates)return crates+' construction lot'+(crates===1?'':'s')+' awaiting delivery before building can begin.';
 if(waiting.length)return waiting.length+' outdoor lot'+(waiting.length===1?'':'s')+' available for hauling.';
 return 'No loose loads awaiting collection.';
}
function freightStorePanel(b){
 if(!storageBuildings().includes(b))return '';
 return '<details><summary>'+esc(b.type==='supplies'?'Landing cache':'Supply shed')+' · '+b.x+', '+b.y+' · '+freightUsed(b)+' / '+freightCap(b)+'</summary><div class="buttongroup"><button class="secondary" data-freight-priority="'+b.id+'">Routing: '+(b.priority?'preferred':'normal')+'</button></div><p>Accept incoming materials</p><div class="buttongroup">'+Object.entries(MATERIALS).map(([k,m])=>'<button class="pill '+(freightAccepts(b,k)?'active':'')+'" aria-pressed="'+freightAccepts(b,k)+'" data-store-id="'+b.id+'" data-freight-filter="'+k+'">'+m.name+' · '+(b.stock?.[k]||0)+'</button>').join('')+'</div></details>';
}
function freightRulesHTML(){
 return freightFlowTable()+'<p>'+esc(freightStatus())+'</p><div class="sectioncap">Hauling order</div><p>Site deliveries go first, followed by the selected material.</p><div class="buttongroup">'+[['','Nearest'],...Object.entries(MATERIALS).map(([k,m])=>[k,m.name])].map(([k,label])=>'<button class="pill '+((S.freightUrgent||'')===k?'active':'')+'" data-freight-urgent="'+k+'">'+label+'</button>').join('')+'</div><div class="sectioncap">Store routing &amp; filters</div>'+storageBuildings().map(freightStorePanel).join('');
}
function freightControl(e){
 const button=e.target.closest('[data-freight-priority],[data-freight-filter],[data-freight-urgent]');
 if(!button)return false;
 if('freightUrgent' in button.dataset)S.freightUrgent=button.dataset.freightUrgent;
 else{
  const b=storageBuildings().find(b=>b.id===+(button.dataset.storeId||button.dataset.freightPriority));
  if(!b)return true;
  const k=button.dataset.freightFilter;
  if(k){b.reject??=[];b.reject=b.reject.includes(k)?b.reject.filter(v=>v!==k):[...b.reject,k];}
  else b.priority=b.priority?0:1;
 }
 save();openSection('resources');return true;
}
