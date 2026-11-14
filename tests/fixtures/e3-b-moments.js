// Living Moments. The clock is real time so a faster shift never floods the map.
// Each crew member keeps the last six entries with their expedition save.
window.FarwakeMoments = (() => {
  'use strict';
  const limit = 6;
  let expedition, elapsed = 0, next = 6, active = null, answer = null;
  let lastLifeCue = 0;
  let goal = 0, celebration = null, lastSpeaker = null, currentPose;
  const choose = rows => rows[Math.floor(Math.random()*rows.length)];
  const first = p => String(p.name).split(' ')[0];
  const journal = p => Array.isArray(p.moments) ? p.moments : [];
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

  // An entry is a witnessed event. Both parties retain the same spoken words.
  function remember(person,state,speaker,line,listener) {
    const entry = {day:state.day, minute:Math.floor(state.minute), speaker:speaker.name,
      text:line, kind:listener?'conversation':'thought'};
    if(listener)entry.listener=listener.name;
    person.moments=[entry,...journal(person)].slice(0,limit);
  }

  function say(state,p,line,listener=null) {
    remember(p,state,p,line,listener);
    if(listener)remember(listener,state,p,line,listener);
    active={id:p.id,text:line,until:elapsed+4.5};
    lastSpeaker=p.id;
  }

  const breakthroughs = [
    '', 'A door we can shut. That feels good.', 'Look at those first green rows.',
    'Our own little patch of industry.', 'Wonder who will hear the beacon.'
  ];

  function thoughts(s,p) {
    const lines=[];
    if(p.hunger>=58)lines.push('Could really use a meal.', 'I keep thinking about supper.');
    if(p.energy<38)lines.push('My boots feel heavier today.', 'A few hours of sleep would help.');
    if(p.mood<45)lines.push('One small thing at a time.');
    if(p.carry?.amount>0)lines.push(p.carry.kind==='wood'?'Mind the bark on this lot.':'Steady. Almost at the store.');
    if(!p.path?.length){
      const work={
        build:['Hold it square. Now the pin.','That joint should hold.'],
        harvest:['A little more off this side.'], gather:['Still some good metal here.'],
        forage:['Worth taking a closer look.'], farm:['Look at the colour of those leaves.'],
        survey:['I want to see past that ridge.'], research:['There’s a pattern in here somewhere.'],
        craft:['That’s a cleaner edge.'], rest:['Finally, a quiet minute.'], eat:['Needed this.']
      };
      lines.push(...work[p.task?.type]||[]);
    }
    if(s.weather==='rain'||s.weather==='storm')lines.push('Hear that rain on the roofs?', 'The air smells different in the wet.');
    if(s.weather==='wind')lines.push('Wind’s picking up again.');
    if(s.minute>1120||s.minute<290)lines.push('Feels very far from home tonight.','So many stars out here.');
    if(s.minute>=290&&s.minute<445)lines.push('First light already.','That pale strip of sky is lovely.');
    if(s.minute>970&&s.minute<1100)lines.push('Wish I could keep this light.');
    if(s.buildings.some(b=>b.type==='shelter'&&b.finished))lines.push('It’s starting to look like home.');
    const roleLines={
      Engineer:'I’d like a proper bench someday.', Surveyor:'What’s on the other side of this valley?',
      Biologist:'Nothing here grows quite like Earth.', Commander:'Five people made planetfall here.',
      Medic:'I should check how everyone slept.'
    };
    lines.push(roleLines[p.role]||'What a strange place to call home.');
    return lines;
  }

  function exchange(s,a,b) {
    if(a.energy<45)return ['Long shift?', 'Long enough. I’ll be glad of a bed.'].reverse();
    if(b.energy<45)return ['Long shift?', 'Long enough. I’ll be glad of a bed.'];
    if(s.weather==='rain'||s.weather==='storm')return ['Does the rain sound different here?', 'Softer on the grass than on the cache.'];
    if(a.carry)return ['Coming through with a load.', 'You’ve got room on my side.'];
    if(s.minute>1110||s.minute<300)return ['Listen. Quiet out here tonight.', 'I could stand here a little longer.'];
    if(b.role==='Surveyor')return ['What do you think is beyond the valley?', 'Ask me after the next survey.'];
    if(b.role==='Engineer')return ['Ever get tired of fixing things?', 'Ask me when they stop breaking.'];
    if(b.role==='Biologist')return ['Find anything interesting yet?', 'Even the grass is a little strange.'];
    return ['How are you holding up?', b.mood<55?'Taking it one job at a time.':'Doing alright. Good to see you.'];
  }

  function update(state,dt,{mode='subtle',paused=false,eligible=()=>true,pose=p=>p}={}) {
    if(expedition!==state){
      expedition=state;lastLifeCue=0;elapsed=0;next=6;goal=state.goal;celebration=null;
      active=null;answer=null;lastSpeaker=null;
    }
    currentPose=pose;
    if(state.goal>goal)celebration=breakthroughs[state.goal]||null;
    goal=state.goal;
    if(String(mode).toLowerCase()==='off'){
      active=null;answer=null;celebration=null;next=elapsed+6;return;
    }
    if(paused)return;
    elapsed+=Math.max(0,dt);
    const cue=state.life?.cue;
    if(cue&&cue.serial!==lastLifeCue&&cue.until>=state.life.time){
      lastLifeCue=cue.serial;active={id:cue.person,text:cue.text,until:elapsed+4.5};answer=null;
    }
    if(active){
      const speaker=state.colonists.find(p=>p.id===active.id);
      if(elapsed<active.until&&speaker&&eligible(speaker))return;
      active=null;
    }
    if(answer){
      const {a,b,line}=answer;answer=null;
      if(eligible(a)&&eligible(b)&&distance(pose(a),pose(b))<2.5){
        say(state,b,line,a);return;
      }
    }
    if(state.colonists.some(p=>p.task?.type?.startsWith('life_')))return;
    if(elapsed<next)return;
    const available=state.colonists.filter(eligible);
    if(!available.length){next=elapsed+3;return;}
    const others=available.filter(p=>p.id!==lastSpeaker);
    const a=choose(others.length?others:available);
    const lively=String(mode).toLowerCase()==='lively';
    next=elapsed+(lively?11:23)+Math.random()*(lively?8:15);
    const neighbours=available.filter(p=>p!==a&&distance(pose(p),pose(a))<2.1);
    if(celebration){say(state,a,celebration);celebration=null;return;}
    if(neighbours.length&&Math.random()<.42){
      const b=choose(neighbours), [line,reply]=exchange(state,a,b);
      say(state,a,line,b);answer={a,b,line:reply};return;
    }
    const recent=journal(a).map(e=>e.text), choices=thoughts(state,a);
    const fresh=choices.filter(line=>!recent.includes(line));
    say(state,a,choose(fresh.length?fresh:choices));
  }

  function draw(c,s,width,height,sx,sy,zoom) {
    if(!active)return;
    const p=s.colonists.find(person=>person.id===active.id);
    if(!p)return;
    const pos=currentPose?.(p)||p;
    const x=sx(pos.x*32), y=sy(pos.y*32)-25*zoom;
    if(x<7||x>width-7||y<48||y>height)return;
    c.save();c.font='500 12px system-ui';c.textAlign='left';c.textBaseline='middle';
    const rows=[''], maxWidth=Math.min(width-32,172);
    for(const word of active.text.split(' ')){
      const i=rows.length-1, line=rows[i]?rows[i]+' '+word:word;
      if(rows[i]&&c.measureText(line).width>maxWidth)rows.push(word);else rows[i]=line;
    }
    const w=Math.ceil(Math.max(...rows.map(line=>c.measureText(line).width)))+18;
    const h=rows.length*16+10, left=Math.max(5,Math.min(x-w/2,width-w-5)), top=y-h-5;
    c.globalAlpha=Math.min(1,(active.until-elapsed)*4);
    c.fillStyle='#242720f5';c.strokeStyle='#b49b70';c.lineWidth=1;
    c.beginPath();c.roundRect(left,top,w,h,5);c.fill();c.stroke();
    c.beginPath();c.moveTo(x-4,y-5);c.lineTo(x,y);c.lineTo(x+4,y-5);c.fill();
    c.fillStyle='#f5eee0';rows.forEach((line,i)=>c.fillText(line,left+9,top+13+i*16));
    c.restore();
  }

  function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function profile(p){
    const items=journal(p).slice(0,limit);
    const rows=items.map(e=>{
      const minute=Math.floor(e.minute)%1440;
      const time=String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
      const who=e.kind==='conversation'?escape(e.speaker)+' to '+escape(e.listener):'Thought';
      return '<li><small>Day '+escape(e.day)+' · '+time+' · '+who+'</small><br>'+escape(e.text)+'</li>';
    });
    return '<section aria-label="Recent thoughts and conversations"><h3 class="sectioncap">Recent thoughts &amp; conversations</h3>'+
      (rows.length?'<ol style="padding-left:18px;line-height:1.6">'+rows.join('')+'</ol>':'<p>No moments recorded yet.</p>')+'</section>';
  }
  return {update,draw,profile,get active(){return active;}};
})();
