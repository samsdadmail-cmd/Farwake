// The field interface reads the world; it never drives simulation outcomes.
let experiencePerson=null,experienceLastRender=0;
function experienceDrawerNav(){return '<nav class="drawer-nav" aria-label="Colony tools">'+[['build','Build'],['crew','People'],['colony','Colony'],['research','Research'],['operations','Save']].map(([k,n])=>'<button data-open="'+k+'" aria-current="'+(sheetSection===k)+'">'+n+'</button>').join('')+'</nav>'}
function experienceSheet(){experiencePerson=null;const c=$('sheet').querySelector('[data-person-canvas]');if(c)experiencePerson=+c.dataset.personCanvas;}
function experienceReason(p){
 const l=lifePerson(p),t=p.task,b=t&&lifeBuilding(t.id);
 if(t?.type==='life_share'){const s=lifeRoot().sessions.find(s=>s.id===t.session),other=s&&S.colonists.find(q=>q.id!==p.id&&s.people.includes(q.id));const familiar=other&&l.bonds.find(q=>q.person===other.id)?.shared>=3;return (familiar?'Chose a familiar companion':'Made time for company')+(b?' near '+facilityName(b).toLowerCase():'')+'.'}
 if(t?.type==='life_home')return ['rain','storm'].includes(S.weather)?'Sheltering from the rain in a home of their own.':'A quiet evening at home, after the day’s work.';
 if(t?.type==='life_quiet')return ({plants:'Finds calm in growing things.',sky:'Drawn to open skies and the world beyond the settlement.',tinkering:'Enjoys making and repairing things with their own hands.',conversation:'A moment to unwind, away from responsibilities.'})[l.interest]+(b&&lifeAttachment(p,b)?' This is a favourite place.':'');
 if(p.path?.length&&b)return 'On the way to '+facilityName(b).toLowerCase()+'.';
 return p.hunger>67?'Finding something to eat takes priority.':p.energy<35?'Needs a safe place to rest.':p.ambition+'.';
}
function experienceProfile(id){
 const p=S.colonists.find(p=>p.id===id);if(!p)return;sheetSection='person';
 const l=lifePerson(p),companions=l.bonds.map(b=>({b,p:S.colonists.find(q=>q.id===b.person)})).filter(q=>q.p);
 showSheet('<div class="life-profile"><div class="row"><span class="smallcaps">A LIFE ON THE FRONTIER</span><button class="iconbtn" data-sheet="close" aria-label="Close character">×</button></div><div class="person-hero" style="--person-color:'+p.coat+'"><canvas width="80" height="104" data-person-canvas="'+p.id+'" aria-label="Portrait of '+esc(p.name)+'"></canvas><div><h2>'+esc(p.name)+'</h2><p>'+esc(p.role)+' · '+esc(p.trait)+'</p></div></div><div class="intention"><strong data-person-activity>'+esc(taskLabel(p))+'</strong><p data-person-reason>'+esc(experienceReason(p))+'</p></div><div class="need-line"><span>'+ (p.energy<35?'Tired':p.energy<65?'Taking it steadily':'Well rested')+'</span><span>'+(p.hunger>67?'Needs food':p.hunger>35?'Getting hungry':'Has eaten')+'</span><span>'+(p.mood>65?'In good spirits':'Finding their feet')+'</span></div><h3 class="sectioncap">People who matter</h3>'+(companions.length?companions.map(({b,p:q})=>'<button class="crewrow" data-action="crew" data-id="'+q.id+'"><span class="avatar" style="color:'+q.coat+'">'+uiIcon('crew',22)+'</span><span><b>'+esc(q.name)+'</b><div class="sub">'+(b.shared>=3?'A familiar companion':'Getting acquainted')+' · '+b.shared+' shared evenings</div></span></button>').join(''):'<p>Friendships begin with time actually spent together.</p>')+'<h3 class="sectioncap">What stays with them</h3>'+(l.memories.length?l.memories.slice(0,4).map(m=>'<div class="memory"><small>DAY '+m.day+'</small>'+esc(m.text)+'</div>').join(''):'<p>Their story here is just beginning.</p>')+'<details><summary>Home, responsibilities & wellbeing</summary>'+housingPerson(p)+personPriorityControls(p)+'<p>'+esc(p.ambition)+'</p><div class="buttongroup">'+[['auto','Self-direct'],['build','Construction'],['farm','Agriculture'],['engineer','Manufacturing'],['survey','Exploration'],['gather','Salvaging']].map(([k,n])=>'<button class="pill '+(p.work===k?'active':'')+'" data-sheet="work" data-id="'+id+'" data-work="'+k+'">'+n+'</button>').join('')+'</div><p>Energy '+Math.round(p.energy)+'% · Hunger '+Math.round(p.hunger)+'% · Morale '+Math.round(p.mood)+'%</p></details><button class="primary" style="width:100%;margin-top:18px" data-sheet="follow" data-id="'+id+'">Find '+esc(p.name.split(' ')[0])+' in the world</button></div>');
}
function experienceRender(time){
 if(time-experienceLastRender<90)return;experienceLastRender=time;
 if(!$('sheetbg').classList.contains('open'))return;
 const portrait=$('sheet').querySelector('[data-person-canvas]');
 if(portrait){const p=S.colonists.find(p=>p.id===+portrait.dataset.personCanvas);if(p){const c=portrait.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,80,104);c.fillStyle='#243941';c.fillRect(0,0,80,104);c.save();c.translate(40,87);c.scale(3,3);c.translate(-p.x*32,-p.y*32);FarwakePeople.draw(c,p,32,time,false,1);c.restore();const label=$('sheet').querySelector('[data-person-activity]');if(label)label.textContent=taskLabel(p);const reason=$('sheet').querySelector('[data-person-reason]');if(reason)reason.textContent=experienceReason(p)}}
 const room=$('sheet').querySelector('[data-room]');if(room){const b=S.buildings.find(b=>b.id===+room.dataset.room);if(b)FarwakeInteriors.draw(room,b,S,FarwakeDoors.occupants(S,b),time,FieldPreferences.reduced)}
}
function experienceRoom(b){return b.finished&&FarwakeBuildings.entrance(b)?'<canvas class="portrait-scene" width="384" height="216" data-room="'+b.id+'" aria-label="Live cutaway of '+esc(facilityName(b))+'"></canvas><div class="interior-caption">LIVE INTERIOR · ACTUAL OCCUPANTS</div>':''}

function experienceReadouts(){
 if(!$('sheetbg').classList.contains('open'))return;
 for(const row of $('sheet').querySelectorAll('[data-action="crew"]')){const p=S.colonists.find(p=>p.id===+row.dataset.id);if(!p)continue;const sub=row.querySelector('.sub');if(sub&&sheetSection==='crew')sub.textContent=p.role+' · '+taskLabel(p)}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
