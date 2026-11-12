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
function lifeEvening(p){return S.minute>=1050&&S.minute<1230}
function lifeEmergency(p){return !!p.carry||p.energy<35||p.hunger>60||industryFoodEmergency()}
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
 const buildings=S.buildings.filter(b=>b.finished&&!b.editOrder&&(b===home||b.type==='camp'||FRONTIER_BUILDINGS[b.type]?.community||quiet==='plants'&&b.type==='garden'));
 return buildings.map(b=>{
  const points=neighborGoals(b.x,b.y,b.w,b.h).map(a=>({x:a.x+.5,y:a.y+.5})).filter(a=>
   !lifeRoot().sessions.some(s=>s.points.some(q=>q.x===a.x&&q.y===a.y))&&
   !S.colonists.some(q=>q!==p&&q.task?.type==='life_quiet'&&q.task.x===Math.floor(a.x)&&q.task.y===Math.floor(a.y)));
  points.sort((a,z)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(z.x-p.x,z.y-p.y));
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
 if(l.doneDay===S.day&&S.minute>=1200&&S.minute<1260)return housingRestTarget(p);
 if(!lifeEvening(p)||l.doneDay===S.day||r.time<l.retryAt||lifeEmergency(p))return null;
 if(jobs().some(b=>b.buildPriority&&!b.buildPaused))return null;
 const home=lifeBuilding(p.home),wet=['rain','storm'].includes(S.weather);
 const places=lifePlaces(p);
 const options=[];
 for(const place of places){
  const {b,points}=place,affection=lifeAttachment(p,b)*.06,travel=Math.hypot(p.x-points[0].x,p.y-points[0].y)*.018;
  const quietFit=l.interest==='plants'&&b.type==='garden'?.25:b===home?.08:0;
  if(!wet)options.push({kind:'quiet',...place,score:l.quiet+quietFit+affection-travel});
  if(b===home)options.push({kind:'home',...place,score:l.home+(wet?.8:0)+affection-travel});
  if(!wet&&points.length>=2){
   const partner=S.colonists.filter(q=>q!==p&&!lifeEmergency(q)&&lifeEvening(q)&&lifePerson(q).doneDay!==S.day&&!q.life.session&&q.life.company>=.55&&!q.task?.type?.startsWith('life_')&&Math.hypot(p.x-q.x,p.y-q.y)<14)
    .sort((a,z)=>((l.bonds.find(q=>q.person===z.id)?.shared||0)-(l.bonds.find(q=>q.person===a.id)?.shared||0))||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(z.x-p.x,z.y-p.y)||a.id-z.id)[0];
   if(partner)options.push({kind:'shared',...place,partner,score:l.company+affection-travel});
  }
 }
 options.sort((a,z)=>z.score-a.score||a.b.id-z.b.id);
 for(const option of options.slice(0,5)){
  const {b,points,kind}=option;
  if(kind==='shared'){
   // Choose adjacent places; two opposite building edges are not a conversation.
   const pair=points.slice(1).find(q=>Math.hypot(q.x-points[0].x,q.y-points[0].y)<1.6);
   if(!pair)continue;
   const session={id:++r.serial,day:S.day,building:b.id,people:[p.id,option.partner.id],points:[points[0],pair],progress:0,expires:r.time+18};
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
 if(p.action>=20){lifeRemember(p,t.type==='life_home'?'home':'quiet',b);lifeClear(p)}
}
let lifeTickState=null,lifeElapsed=0;
function lifeTick(step){
 const r=lifeRoot();r.time+=step;
 if(lifeTickState!==S){lifeTickState=S;lifeElapsed=0}
 lifeElapsed+=step;if(lifeElapsed<.5)return;const elapsed=lifeElapsed;lifeElapsed=0;
 for(const session of [...r.sessions]){
  const people=session.people.map(id=>S.colonists.find(p=>p.id===id)),b=lifeBuilding(session.building);
  if(!b||session.day!==S.day||people.some(p=>!p||lifeEmergency(p))||S.minute>=1230||['rain','storm'].includes(S.weather)){lifeCancel(session);continue}
  const present=people.every(p=>p.task?.type==='life_share'&&p.task.session===session.id&&!p.path.length)&&Math.hypot(people[0].x-people[1].x,people[0].y-people[1].y)<2.5;
  if(!present){if(r.time>=session.expires)lifeCancel(session);continue}
  if(!session.started){session.started=true;lifeCue(people[0],'Good to have a quiet minute together.')}session.progress+=elapsed;
  if(session.progress>=20){
   lifeRemember(people[0],'shared',b,people[1]);lifeRemember(people[1],'shared',b,people[0]);
   lifeCue(people[1],'Same place another evening?');for(const p of people)lifeClear(p);
   r.sessions=r.sessions.filter(s=>s!==session);
  }
 }
 for(const p of S.colonists){
  const l=lifePerson(p),task=p.task;
  if(task?.type?.startsWith('life_')){
   if(!lifeBuilding(task.id)||lifeEmergency(p)||!lifeEvening(p)||task.type==='life_quiet'&&['rain','storm'].includes(S.weather)){
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
 const t=p.task;if(!t?.type?.startsWith('life_'))return '';
 if(t.type==='life_home')return p.path.length?'Going home for a quiet evening':'Unwinding at home';
 const l=lifePerson(p);
 if(t.type==='life_quiet')return p.path.length?'Finding a quiet spot':({plants:'Watching the evening garden',sky:'Watching the evening sky',tinkering:'Tinkering with personal equipment',conversation:'Taking a quiet breath'})[l.interest];
 const s=lifeRoot().sessions.find(s=>s.id===t.session),other=s&&S.colonists.find(q=>q.id===s.people.find(id=>id!==p.id));
 return (s?.started?'Sharing an evening with ':'Meeting ')+(other?.name.split(' ')[0]||'a neighbour');
}
function lifeView(p){
 const t=p.task;if(!t?.type?.startsWith('life_')||p.path.length)return null;
 const session=t.type==='life_share'&&lifeRoot().sessions.find(s=>s.id===t.session);
 const other=session&&S.colonists.find(q=>q.id===session.people.find(id=>id!==p.id));
 return {kind:t.type==='life_share'?'conversation':lifePerson(p).interest,look:other&&session.started?other:null};
}
function lifePanel(p){
 const l=lifePerson(p),memories=l.memories.slice(0,4),bonds=l.bonds.map(q=>({q,p:S.colonists.find(p=>p.id===q.person)})).filter(q=>q.p);
 return '<section class="infocard life-profile"><b>'+esc(lifeDescription(p)||'An evening of their own')+'</b><p>'+esc(l.company>=.7?'Often seeks company':l.interest==='plants'?'Finds calm around growing things':l.interest==='sky'?'Drawn to quiet skies':'Enjoys small personal projects')+'</p><details><summary>People, places & memories</summary><p>'+esc(bonds.map(({q,p})=>p.name+' · '+(q.shared>=3?'familiar companion':'getting acquainted')).join('; ')||'Friendships grow through time actually spent together.')+'</p>'+memories.map(m=>'<p><small>Day '+m.day+'</small><br>'+esc(m.text)+(m.count>1?' · '+m.count+' evenings':'')+'</p>').join('')+'</details></section>';
}
