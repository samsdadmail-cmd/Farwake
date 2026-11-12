// Phase 1: one chosen evening, real meetings, remembered people and places.
// Simulation time only. Rendering, dialogue visibility and camera never decide outcomes.
const LIFE_TENDENCIES={
 Steadfast:{company:.88,home:.35,quiet:.35,interest:'conversation'},
 Inventive:{company:.25,home:.60,quiet:.82,interest:'tinkering'},
 Patient:{company:.35,home:.42,quiet:.90,interest:'plants'},
 Compassionate:{company:1,home:.40,quiet:.28,interest:'conversation'},
 Curious:{company:.38,home:.22,quiet:.95,interest:'sky'}
};
function lifeRoot(){return S.life??=( {version:1,time:0,serial:0,sessions:[]} )}
function lifePerson(p){
 if(!p.life||p.life.owner!==p.id){
  const n=hash(p.id,31,hashStr(S.seed));
  const tendencies=LIFE_TENDENCIES[p.trait]||{company:.25+n*.65,home:.35,quiet:.8-n*.4,interest:n>.5?'sky':'tinkering'};
  p.life={owner:p.id,...tendencies,doneDay:0,retryAt:0,memories:[],places:[],bonds:[]};
 }
 return p.life;
}
function lifeEvening(p){return S.minute>=1050&&S.minute<1230&&(S.minute>=1050+((p.id*17)%43)||!!p.life?.session)}
function lifeEncounterKind(session){const b=lifeBuilding(session.building);return b?.type==='garden'?'plants':session.id%3===0?'sky':session.id%3===1?'conversation':'project'}
function lifeEncounterPhase(session){return !session.started?'waiting':session.progress<3?'greeting':session.progress<6?'settling':session.progress<27?'sharing':'goodbye'}
function lifeEmergency(p){return !!p.carry||p.energy<35||p.hunger>60||industryFoodEmergency()}
function lifeUrgentWork(p){
 const canBuild=workWeight(p,'build')&&(p.work==='build'||['Engineer','Commander','Medic'].includes(p.role));
 return !!(canBuild||workWeight(p,'haul'))&&jobs().some(b=>b.buildPriority&&!b.buildPaused&&!b.accessBlocked);
}
function lifeBuilding(id){return S.buildings.find(b=>b.id===id&&b.finished&&!b.editOrder)}
function lifeClear(p){
 if(p.task?.type?.startsWith('life_')){p.task=null;p.path=[];p.action=0}
 if(p.life)delete p.life.session;
}
function lifeCancel(session){
 for(const id of session.people){const p=S.colonists.find(p=>p.id===id);if(p){lifeClear(p);lifePerson(p).retryAt=lifeRoot().time+12}}
 lifeRoot().sessions=lifeRoot().sessions.filter(s=>s!==session);
}
function lifePlaces(p){
 const home=lifeBuilding(p.home),quiet=lifePerson(p).interest;
 const buildings=S.buildings.filter(b=>b.finished&&!b.editOrder&&(b===home||b.type==='camp'||quiet==='tinkering'&&['workshop','fabricator','sawmill'].includes(b.type)||FRONTIER_BUILDINGS[b.type]?.community||quiet==='plants'&&b.type==='garden'));
 return buildings.map(b=>{
  const points=neighborGoals(b.x,b.y,b.w,b.h).map(a=>({x:a.x+.5,y:a.y+.5})).filter(a=>
   !lifeRoot().sessions.some(s=>s.points.some(q=>Math.hypot(q.x-a.x,q.y-a.y)<1.25))&&
   !S.colonists.some(q=>q!==p&&['life_quiet','idle_pause'].includes(q.task?.type)&&Math.hypot(q.task.x+.5-a.x,q.task.y+.5-a.y)<1.25));
  const anchor=quiet==='tinkering'?{x:b.x+b.w+.5,y:b.y+.5}:quiet==='sky'?{x:b.x-.5,y:b.y+b.h+.5}:{x:b.x+b.w/2,y:b.y+b.h+.5};
  const rank=a=>Math.hypot(a.x-anchor.x,a.y-anchor.y)+Math.hypot(a.x-p.x,a.y-p.y)*.12;
  points.sort((a,z)=>rank(a)-rank(z));
  return {b,points};
 }).filter(q=>q.points.length);
}
function lifeAttachment(p,b){return lifePerson(p).places.find(q=>q.building===b.id)?.fondness||0}
function lifeRemember(p,kind,b,other){
 const l=lifePerson(p),key=kind+':'+b.id+':'+(other?.id||0);
 const text=kind==='shared'?'Shared an evening with '+other.name+' by the '+(TYPES[b.type]?.name||'expedition camp'):kind==='home'?'Unwound at home':l.interest==='plants'?'Spent a quiet evening watching the plants':l.interest==='sky'?'Took a quiet moment beneath the evening sky':'Found time for a small personal project';
 const previous=l.memories.find(m=>m.key===key);
 l.memories=[{key,kind,other:other?.id,building:b.id,day:S.day,minute:Math.floor(S.minute),text,count:(previous?.count||0)+1},...l.memories.filter(m=>m.key!==key)].slice(0,8);
 const place=l.places.find(q=>q.building===b.id);
 l.places=[{building:b.id,fondness:Math.min(4,(place?.fondness||0)+1),lastDay:S.day},...l.places.filter(q=>q.building!==b.id)].slice(0,4);
 if(other){
  const bond=l.bonds.find(q=>q.person===other.id);
  l.bonds=[{person:other.id,shared:(bond?.shared||0)+1,lastDay:S.day},...l.bonds.filter(q=>q.person!==other.id)].sort((a,z)=>z.shared-a.shared).slice(0,8);
 }
 l.doneDay=S.day;p.social=clamp(p.social+(kind==='shared'?14:l.company<.5?8:3),0,100);p.mood=clamp(p.mood+1.5,0,100);
}
function lifeCue(p,text){const r=lifeRoot();r.cue={serial:++r.serial,person:p.id,text,until:r.time+8}}
function lifeTaskAt(session,p){
 const i=session.people.indexOf(p.id),point=session.points[i];
 if(!point)return null;
 return {type:'life_share',session:session.id,id:session.building,x:Math.floor(point.x),y:Math.floor(point.y),outdoors:true};
}
function lifeTarget(p){
 const r=lifeRoot(),l=lifePerson(p);
 if(l.session){
  const session=r.sessions.find(s=>s.id===l.session);
  if(session&&session.people.includes(p.id)&&!lifeEmergency(p)&&lifeEvening(p))return lifeTaskAt(session,p);
  if(session)lifeCancel(session);else delete l.session;
 }
 // A finished evening winds down at home instead of briefly resuming research.
 // This continuation earns no second memory, friendship or place reward.
 if(l.doneDay===S.day&&S.minute>=1050&&S.minute<1260+(p.id%5)*5&&!lifeEmergency(p)&&!lifeUrgentWork(p)){
  const home=lifeBuilding(p.home);
  if(home)return {type:'life_home',id:home.id,x:home.x,y:home.y,w:home.w,h:home.h,afterLeisure:true};
  if(S.minute>=1200)return housingRestTarget(p);
 }
 if(!lifeEvening(p)||l.doneDay===S.day||r.time<l.retryAt||lifeEmergency(p))return null;
 if(jobs().some(b=>b.buildPriority&&!b.buildPaused))return null;
 const home=lifeBuilding(p.home),wet=['rain','storm'].includes(S.weather);
 const places=lifePlaces(p);
 const options=[];
 for(const place of places){
  const {b,points}=place,affection=lifeAttachment(p,b)*.06,travel=Math.hypot(p.x-points[0].x,p.y-points[0].y)*.018;
  const quietFit=l.interest==='plants'&&b.type==='garden'?.65:l.interest==='tinkering'&&['workshop','fabricator','sawmill'].includes(b.type)?.35:b===home?.08:0;
  if(!wet)options.push({kind:'quiet',...place,score:l.quiet+quietFit+affection-travel});
  if(b===home)options.push({kind:'home',...place,score:l.home+(wet?.8:0)+affection-travel});
  if(!wet&&points.length>=2){
   const partner=S.colonists.filter(q=>q!==p&&!lifeEmergency(q)&&S.minute>=1035+((q.id*17)%43)&&S.minute<1230&&lifePerson(q).doneDay!==S.day&&!q.life.session&&q.life.company>=.55&&!q.task?.type?.startsWith('life_')&&Math.hypot(p.x-q.x,p.y-q.y)<14)
    .sort((a,z)=>((l.bonds.find(q=>q.person===z.id)?.shared||0)-(l.bonds.find(q=>q.person===a.id)?.shared||0))||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(z.x-p.x,z.y-p.y)||a.id-z.id)[0];
   if(partner)options.push({kind:'shared',...place,partner,score:l.company+affection+(l.bonds.find(q=>q.person===partner.id)?.shared>=3?.15:0)-travel});
  }
 }
 options.sort((a,z)=>z.score-a.score||a.b.id-z.b.id);
 for(const option of options.slice(0,5)){
  const {b,points,kind}=option;
  if(kind==='shared'){
   // Choose adjacent places; two opposite building edges are not a conversation.
   const pair=points.slice(1).find(q=>Math.hypot(q.x-points[0].x,q.y-points[0].y)<1.6);
   if(!pair)continue;
   const session={id:++r.serial,day:S.day,building:b.id,people:[p.id,option.partner.id],points:[points[0],pair],progress:0,expires:r.time+28};
   const task=lifeTaskAt(session,p);
   if(!setTask(p,task))continue;
   r.sessions.push(session);l.session=session.id;lifePerson(option.partner).session=session.id;return task;
  }
  const point=points[0];
  const task=kind==='home'?{type:'life_home',id:b.id,x:b.x,y:b.y,w:b.w,h:b.h}:{type:'life_quiet',id:b.id,x:Math.floor(point.x),y:Math.floor(point.y),outdoors:true};
  if(setTask(p,task))return task;
 }
 l.retryAt=r.time+12;return null;
}
function lifeWork(p,work){
 const t=p.task,b=lifeBuilding(t.id);
 if(!b||lifeEmergency(p)){lifeClear(p);return}
 if(t.type==='life_share')return; // Only joint, actual attendance advances a meeting.
 if(t.type==='life_home'&&p.visit?.stage!=='inside'){lifeClear(p);lifePerson(p).retryAt=lifeRoot().time+12;return}
 if(p.action<1+work)lifeCue(p,t.type==='life_home'?'A little time to myself.':lifePerson(p).interest==='plants'?'Look how the leaves catch this light.':lifePerson(p).interest==='sky'?'A whole sky we have barely begun to know.':'Finally, time for my own little project.');
 if(t.afterLeisure)return;
 if(p.action>=28){lifeRemember(p,t.type==='life_home'?'home':'quiet',b);lifeClear(p)}
}
let lifeTickState=null,lifeElapsed=0;
function lifeTick(step){
 const r=lifeRoot();r.time+=step;
 if(lifeTickState!==S){lifeTickState=S;lifeElapsed=0}
 lifeElapsed+=step;if(lifeElapsed<.5)return;const elapsed=lifeElapsed;lifeElapsed=0;
 for(const session of [...r.sessions]){
  const people=session.people.map(id=>S.colonists.find(p=>p.id===id)),b=lifeBuilding(session.building);
  if(!b||session.day!==S.day||people.some(p=>!p||lifeEmergency(p)||lifeUrgentWork(p))||S.minute>=1230||['rain','storm'].includes(S.weather)){lifeCancel(session);continue}
  const present=people.every(p=>p.task?.type==='life_share'&&p.task.session===session.id&&!p.path.length)&&Math.hypot(people[0].x-people[1].x,people[0].y-people[1].y)<2.5;
  if(!present){if(r.time>=session.expires)lifeCancel(session);continue}
  if(!session.started){session.started=true;localSound('greeting',people[0]);lifeCue(people[0],'Good to have a quiet minute together.')}session.progress+=elapsed;
  if(session.progress>=32){
   lifeRemember(people[0],'shared',b,people[1]);lifeRemember(people[1],'shared',b,people[0]);
   lifeCue(people[1],'Same place another evening?');for(const p of people)lifeClear(p);
   r.sessions=r.sessions.filter(s=>s!==session);
  }
 }
 for(const p of S.colonists){
  const l=lifePerson(p),task=p.task;
  if(task?.type==='idle_pause'&&(lifeDirectedStandby(p)||lifeEmergency(p)||S.minute>=1050||jobs().some(b=>!b.buildPaused))){p.task=null;p.path=[];p.action=0}
  if(task?.type?.startsWith('life_')){
   if(!lifeBuilding(task.id)||lifeEmergency(p)||lifeUrgentWork(p)||(!lifeEvening(p)&&!task.afterLeisure)||(task.afterLeisure&&(l.doneDay!==S.day||S.minute<1050||S.minute>=1260+(p.id%5)*5))||task.type==='life_quiet'&&['rain','storm'].includes(S.weather)){
    const session=r.sessions.find(s=>s.id===l.session);if(session)lifeCancel(session);else{lifeClear(p);l.retryAt=r.time+2}
   }
  }

 }
}
function lifeRestore(){
 if(!S.life)return;
 // Jobs/routes are intentionally rebuilt by the existing loader. Unfinished
 // meetings have no rewards; re-invite after load instead of manufacturing attendance.
 S.life.sessions=[];delete S.life.cue;
 for(const p of S.colonists){delete p.life?.session;if(p.task?.type==='life_share')lifeClear(p)}
}
function lifeDescription(p){
 const t=p.task;if(t?.type==='idle_pause')return p.path.length?'Taking a short break':({plants:'Looking over the growing things',sky:'Taking in the horizon',tinkering:'Checking personal equipment',conversation:'Taking a quiet breath'})[lifePerson(p).interest];if(!t?.type?.startsWith('life_'))return '';
 if(t.type==='life_home')return p.path.length?'Going home for a quiet evening':'Unwinding at home';
 const l=lifePerson(p);
 if(t.type==='life_quiet')return p.path.length?'Finding a quiet spot':({plants:'Watching the evening garden',sky:'Watching the evening sky',tinkering:'Tinkering with personal equipment',conversation:'Taking a quiet breath'})[l.interest];
 const s=lifeRoot().sessions.find(s=>s.id===t.session),other=s&&S.colonists.find(q=>q.id===s.people.find(id=>id!==p.id));
 return (s?.started?(lifeEncounterPhase(s)==='greeting'?'Greeting ':lifeEncounterPhase(s)==='goodbye'?'Saying goodbye to ':'Sharing an evening with '):'Meeting ')+(other?.name.split(' ')[0]||'a neighbour');
}
function lifeView(p){
 const t=p.task;if((!t?.type?.startsWith('life_')&&t?.type!=='idle_pause')||p.path.length)return null;
 const session=t.type==='life_share'&&lifeRoot().sessions.find(s=>s.id===t.session);
 const other=session&&S.colonists.find(q=>q.id===session.people.find(id=>id!==p.id));
 const kind=session?lifeEncounterKind(session):t.type==='life_home'?'reading':lifePerson(p).interest;
 const phase=session?lifeEncounterPhase(session):p.action<3?'settling':!t.afterLeisure&&p.action>(t.type==='idle_pause'?6:25)?'finishing':'active';
 const b=lifeBuilding(t.id),target=phase==='greeting'||phase==='goodbye'?other:kind==='sky'?{x:p.x,y:p.y-8}:kind==='plants'&&b?{x:b.x+b.w/2,y:b.y+b.h/2}:other;
 return {kind,phase,progress:session?session.progress:p.action,look:target||null,shared:!!session,
  familiar:!!other&&lifePerson(p).bonds.some(b=>b.person===other.id&&b.shared>=3),building:t.id};
}
function lifePanel(p){
 const l=lifePerson(p),memories=l.memories.slice(0,4),bonds=l.bonds.map(q=>({q,p:S.colonists.find(p=>p.id===q.person)})).filter(q=>q.p);
 return '<section class="infocard life-profile"><b>'+esc(lifeDescription(p)||'An evening of their own')+'</b><p>'+esc(l.company>=.7?'Often seeks company':l.interest==='plants'?'Finds calm around growing things':l.interest==='sky'?'Drawn to quiet skies':'Enjoys small personal projects')+'</p><details><summary>People, places & memories</summary><p>'+esc(bonds.map(({q,p})=>p.name+' · '+(q.shared>=3?'familiar companion':'getting acquainted')).join('; ')||'Friendships grow through time actually spent together.')+'</p>'+memories.map(m=>'<p><small>Day '+m.day+'</small><br>'+esc(m.text)+(m.count>1?' · '+m.count+' evenings':'')+'</p>').join('')+'</details></section>';
}
// Brief daytime pauses are transient, unrewarded and only fill genuinely idle
// time. New work, hunger and nightfall release them immediately.
const lifeIdleNext=new WeakMap();
function lifeDirectedStandby(p){return !!p.workWeights&&Object.keys(workGroups).every(k=>(p.workWeights[k]??1)===0)}
function lifeIdleTarget(p){
 if(p.work!=='auto'||lifeDirectedStandby(p)||p.carry||p.energy<60||p.hunger>40||S.minute<420||S.minute>=1050||industryFoodEmergency()||jobs().some(b=>!b.buildPaused))return null;
 const now=lifeRoot().time;if(now<(lifeIdleNext.get(p)||0))return null;
 lifeIdleNext.set(p,now+38+(p.id%5)*7);
 const places=lifePlaces(p).sort((a,b)=>lifeAttachment(p,b.b)-lifeAttachment(p,a.b)||a.b.id-b.b.id);
 for(const place of places.slice(0,4)){
  const point=place.points[(p.id+S.day)%place.points.length];
  const t={type:'idle_pause',id:place.b.id,x:Math.floor(point.x),y:Math.floor(point.y),outdoors:true};
  if(setTask(p,t))return t;
 }
 return null;
}
function lifeIdleWork(p){if(p.action>=8||lifeDirectedStandby(p)||lifeEmergency(p)||jobs().some(b=>!b.buildPaused)||S.minute>=1050){p.task=null;p.path=[];p.action=0}}

// Physical scene props belong to a genuinely attended meeting. No food or
// resource is spawned: these are reusable personal seats and a portable table.
function lifeSceneDraw(c,left,top,right,bottom){
 for(const session of lifeRoot().sessions){
  if(!session.started||session.progress<6||session.progress>=27)continue;
  const people=session.people.map(id=>S.colonists.find(p=>p.id===id));
  if(people.some(p=>!p||p.path.length||p.task?.session!==session.id))continue;
  const x=(people[0].x+people[1].x)*16,y=(people[0].y+people[1].y)*16;
  if(x<left*32||x>right*32||y<top*32||y>bottom*32)continue;
  c.fillStyle='#405650';c.fillRect(x-23,y+1,46,7);c.fillStyle='#b19a6e';c.fillRect(x-10,y-2,20,4);c.fillStyle='#685a43';c.fillRect(x-8,y+2,2,5);c.fillRect(x+6,y+2,2,5);c.fillStyle='#d4c5a1';c.fillRect(x-6,y-5,3,3);c.fillRect(x+4,y-5,3,3);
 }
}
