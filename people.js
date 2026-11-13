// Local pixel coordinates share the same foot anchor as the simulation.
window.FarwakePeople = (() => {
  const ink = '#293331', boot = '#51483e', strap = '#74563e';
  const poses = new WeakMap();
  const tau = Math.PI*2;
  const cycle = {tree:1.15,ore:.92,build:.72,gather:.9,forage:1.3,farm:1.4,craft:.95,research:1.65,harvest:1.1};
  const soundKind = {tree:'chop',ore:'mine',build:'build',farm:'farm',scrap:'mine'};
  function pose(p) {
    if(!poses.has(p))poses.set(p,{x:p.x,y:p.y,dir:'front',phase:0,walk:0,work:0,stroke:0,
      count:-1,task:null,kind:'',held:!!p.carry,carry:p.carry?.kind,lift:0,drop:0,reduced:false});
    return poses.get(p);
  }
  function face(dx,dy) {
    return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'back':'front');
  }
  // Exponentially damp the presentation only. Pathfinding always uses the simulation position.
  function advance(p,dt,paused,speed,options={}) {
    const v=pose(p), x=options.x??p.x, y=options.y??p.y;
    if(paused||dt<=0)return v;
    v.reduced=!!options.reduced;v.leisure=options.life;const settled=options.life&&!['waiting','greeting','settling','goodbye','finishing'].includes(options.life.phase);v.settle=(v.settle||0)+((settled?1:0)-(v.settle||0))*(v.reduced?1:1-Math.exp(-dt*7));
    const blend=1-Math.exp(-dt*23*Math.sqrt(speed||1));
    const dx=x-v.x,dy=y-v.y,dist=Math.hypot(dx,dy);
    if(dist>2){v.x=x;v.y=y;v.walk=0;return v}
    const moved=dist*blend;
    v.x+=dx*blend;v.y+=dy*blend;
    const strength=Math.min(1,moved/Math.max(.001,dt)/(1.15*(speed||1)));
    v.walk+=(strength-v.walk)*(1-Math.exp(-dt*15));
    if(dist>.015)v.dir=face(dx,dy);else if(options.life?.look)v.dir=face(options.life.look.x-p.x,options.life.look.y-p.y);
    const phase=v.phase;
    v.phase+=moved*(p.carry?8.8:8);
    if(v.walk>.17&&Math.floor(phase/Math.PI)!==Math.floor(v.phase/Math.PI))options.onSound?.('step',p);
    if(v.held!==!!p.carry){
      if(p.carry){v.lift=1;v.carry=p.carry.kind;v.drop=0}
      else v.drop=1;
      v.held=!!p.carry;
    }
    v.lift=Math.max(0,v.lift-dt*3.5);
    v.drop=Math.max(0,v.drop-dt*4.5);
    const task=p.task, kind=options.kind||task?.type;
    const active=!!task&&!p.path?.length&&Object.hasOwn(cycle,cycle[kind]?kind:task.type);
    if(active)v.kind=kind;
    v.work+=((active?1:0)-v.work)*(1-Math.exp(-dt*12));
    if(active){
      const progress=Math.max(0,options.progress??p.action??0);
      const position=progress/(cycle[kind]||cycle[task.type]),beat=Math.floor(position);
      v.stroke=position%1;
      if(v.task===task&&beat>v.count){
        const sound=soundKind[kind]||soundKind[task.type];
        if(sound){
          const tx=Math.max(task.x,Math.min(p.x,task.x+(task.w||1))),
                ty=Math.max(task.y,Math.min(p.y,task.y+(task.h||1)));
          window.FarwakeWorkFX?.strike(kind,tx,ty,task.feature,p.id);
          options.onSound?.(sound,p);
        }
      }
      if(v.walk<.1)v.dir=face(task.x+.5-p.x,task.y+.5-p.y);
      v.count=beat;v.task=task;
    }else{v.task=null;v.count=-1}
    return v;
  }

  function ellipse(ctx,x,y,rx,ry,color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fill();
  }

  // The same bundles appear on a worker's arms and on the ground.
  function bundle(ctx,kind) {
    function box(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
    if (kind === 'wood') {
      for (const [x,y] of [[-7,0],[-5,-3],[-3,1]]) {
        box(x,y,12,4,'#5b4131'); box(x,y,10,2,'#a26e46');
        box(x+1,y,7,1,'#c39262'); box(x+9,y,3,3,'#e6bd85'); box(x+10,y+1,1,1,'#8e603f');
      }
    } else if (kind === 'ore') {
      for (const [x,y] of [[-6,1],[0,1],[-3,-2]]) {
        box(x,y,7,4,'#4c5660'); box(x+1,y-2,4,3,'#96a1ab'); box(x+2,y-2,2,1,'#cbd5cd');
        box(x+4,y,2,2,'#ab8266');
      }
    } else if (kind === 'food') {
      box(-6,-1,12,7,'#68503b'); box(-5,0,10,4,'#bb8752');
      for (const [x,y,c] of [[-5,-3,'#7f9852'],[-1,-4,'#abb56d'],[2,-2,'#b06354']]) {
        box(x,y,4,4,c); box(x+1,y-1,1,2,'#52684b');
      }
      box(-6,0,12,1,'#e0b782'); box(-4,2,1,3,strap);
    } else {
      const refined = kind === 'alloy';
      for (const [x,y] of [[-6,1],[-2,-2],[-5,-4]]) {
        box(x,y,11,4,ink); box(x+1,y,9,2,refined?'#bacac7':'#a48166');
        box(x+2,y+1,5,1,refined?'#e0e6d8':'#ceb28b');
      }
    }
  }

  function drawClassic(ctx,p,tileSize,time,selected,zoom) {
    const v=pose(p),dir=v.dir,side=dir==='right'||dir==='left',back=dir==='back';
    const swing=Math.sin(v.phase)*v.walk,working=v.work>.02, lift=v.held?v.lift:v.drop;
    // A long backswing and a quicker downstroke make the impact readable even at normal zoom.
    const stroke=Math.sin(v.stroke*Math.PI)*v.work;
    function box(x,y,w,h,c) {ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
    ctx.save();
    ctx.translate(v.x*tileSize,v.y*tileSize);ctx.scale(1.12,1.12);
    ellipse(ctx,2,4,7,2.5,'rgba(24,34,31,.36)');
    if (selected) {
      ctx.strokeStyle='#f2ca86';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,3,9,4,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.save();
    if (dir === 'left') ctx.scale(-1,1);
    for(const [base,sign] of [[-4,-1],[1,1]]){
      const leg=swing*sign;
      const x=base+(side?leg*2.6:0),y=side?-Math.max(0,leg)*2:leg*2.1;
      box(base,-3,3,5,ink);box(x,1+y,side?5:4,3,boot);box(x+1,1+y,2,1,'#9b8d72');
    }
    const sitting=!!v.leisure&&v.walk<.1&&v.leisure.kind!=='sky';
    const bob=(sitting?3:0)+(v.reduced?0:-Math.abs(swing)*.85);
    ctx.translate(p.carry?.65:0,bob+lift*2+(v.kind==='farm'?stroke*2:0));
    box(-5,-12,9,11,ink);box(-4,-12,7,8,p.coat);box(-5,-10,3,5,p.coat);
    box(-4,-4,8,2,strap); box(-1,-4,2,1,'#dbc798');
    if(back || side) {
      box(-5,-11,side?4:8,8,strap);box(-5,-10,side?3:7,3,'#ac9974');box(-3,-8,1,4,'#d5be93');
    } else {
      box(-3,-11,2,8,'#ab9270'); box(1,-10,2,2,'#efe1b4'); box(-3,-11,6,2,'#d3c6a3');
    }
    const armY = -9+(working?-3*stroke:0);
    if(!p.carry)box(-6,-9-swing*1.6,2,5,p.coat);
    box(3-(side?swing:0),armY+swing,3,5,p.coat); box(4-(side?swing:0),armY+4+swing,2,3,p.hue);
    box(-4,-19,8,8,ink);box(-4,-20,7,7,p.hair);
    if (!back) {
      box(side?-1:-3,-17,side?6:7,5,p.hue); box(side?3:2,-16,1,1,ink);
      if(!side) box(-2,-16,1,1,ink);
      box(-4,-17,2,3,p.hair);
    }
    if (p.role === 'Engineer') {
      box(-4,-20,8,3,'#c6934e');box(-5,-18,10,1,'#f4cf82');box(-1,-20,2,2,'#efca87');
    } else if(p.role === 'Surveyor') {
      box(-3,-21,6,3,'#88785c');box(-5,-18,11,2,'#c1a27a');
    } else if(p.role === 'Medic') {
      box(-4,-19,8,2,'#d0ceaf');box(1,-18,2,2,'#bc6c61');
    } else if(p.role === 'Biologist') {
      box(-5,-20,4,3,p.hair);box(-5,-18,2,5,'#605048');box(-5,-15,2,1,'#b5ab73');
    } else {
      box(-4,-20,8,2,'#535e5b');box(1,-19,4,2,'#bcb397');
    }
    if(p.carry||v.drop>0){
      ctx.save();ctx.translate(1,-6+5*(v.held?v.lift:1-v.drop));ctx.globalAlpha*=v.held?1:v.drop;
      bundle(ctx,p.carry?.kind||v.carry);ctx.restore();
      box(-5,-4,2,2,p.hue);box(5,-5,2,2,p.hue);
    }else if(v.leisure&&v.walk<.1){
      const kind=v.leisure.kind;
      if(kind==='plants'){box(5,-6,2,7,'#8eab78');box(3,-6,3,2,'#b7c28c');box(7,-4,3,2,'#70986d')}
      else if(kind==='tinkering'){box(3,-6,7,4,'#637879');box(5,-7,2,6,'#c2b69a');box(4,-3,2,2,p.hue)}
      else if(kind==='sky'){box(4,-16,5,3,'#bfa574');box(7,-17,2,5,'#536b6d');box(4,-13,2,2,p.hue)}
      else if(kind==='conversation'){const gesture=v.reduced?0:Math.sin(time*.002+p.id)*1.4;box(4,-9+gesture,2,4,p.coat);box(6,-7+gesture,3,2,p.hue)}
      else{box(3,-6,8,5,'#c6b790');box(7,-6,1,5,'#786954')}
    }else if(working){
      ctx.save();ctx.globalAlpha*=v.work;
      ctx.translate(5,armY+4);
      if(['research','craft'].includes(v.kind)){
        box(0,0,6,4,'#445b59');box(1,0,4,2,'#a1c1b9');box(2+stroke,1,1,1,'#e5c17c');
      }else if(['bush','forage','farm'].includes(v.kind)){
        ctx.rotate(.5-stroke*.85);box(0,-5,2,8,strap);
        box(-1,-6,4,3,'#b1b7a4');box(0,-8,2,2,'#b1b7a4');
      }else{
        ctx.rotate(.98-2.45*stroke);
        box(0,-10,2,13,'#b79467');
        if(v.kind==='tree'){box(-2,-11,5,3,'#c2cbba');box(2,-12,3,5,'#9daaa2')}
        else if(v.kind==='ore'){box(-3,-11,8,2,'#c4cfcb');box(4,-10,2,2,'#95a7a2')}
        else box(-2,-12,6,4,'#b6c2be');
      }
      ctx.restore();
    }
    ctx.restore();
    if (selected && zoom >= .8) {
      const name=p.name.split(' ')[0];ctx.font='600 9px system-ui';ctx.textAlign='center';
      const width=Math.ceil(ctx.measureText(name).width)+10;
      box(-width/2,-36,width,12,'#202625ed');ctx.fillStyle='#fff3d8';ctx.fillText(name,0,-27);
    }
    ctx.restore();
  }

  // Articulated pixel rig. Each activity has a full-body pose and a purposeful
  // sequence; changing the camera or skipping frames cannot advance a meeting.
  function draw(ctx,p,tileSize,time,selected,zoom){
    const v=pose(p),life=v.leisure,arrived=!p.path?.length;
    if(window.FarwakeHomeResident?.drawWorld(ctx,p,v,tileSize,selected))return;
    const need=arrived&&['eat','rest','social'].includes(p.task?.type);
    if(!life&&!need){drawClassic(ctx,p,tileSize,time,selected,zoom);return}
    const kind=life?.kind||(p.task.type==='eat'?'eating':p.task.type==='rest'?'resting':'conversation');
    const phase=life?.phase||'active',reduced=v.reduced,t=reduced?0:time*.001;
    const cycle=t*(kind==='plants'?1.3:kind==='tinkering'||kind==='project'?2.5:1.1)+p.id*.8;
    const beat=Math.sin(cycle),slow=Math.sin(t*.45+p.id),wave=phase==='greeting'||phase==='goodbye';
    const settling=phase==='settling',finish=phase==='finishing'||phase==='goodbye';
    const plant=kind==='plants',tools=kind==='tinkering'||kind==='project',sky=kind==='sky';
    const seat=!wave&&!settling&&!finish;
    const kneel=seat&&(plant||tools),recline=seat&&(sky||kind==='resting');
    ctx.save();ctx.translate(v.x*tileSize,v.y*tileSize);ctx.scale(1.12,1.12);
    const box=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
    const limb=(x,y,length,angle,color,width=3)=>{ctx.save();ctx.translate(x,y);ctx.rotate(angle);box(-width/2,0,width,length,color);ctx.restore()};
    ellipse(ctx,0,4,10,3,'#13292b55');
    if(selected){ctx.strokeStyle='#f4d09b';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,4,11,4,0,0,tau);ctx.stroke()}
    // Portable mats and folding seats occupy the person's reached tile, never
    // another tile or an invented walkable surface.
    if(seat){
      if(recline){box(-13,2,27,5,'#526d72');box(-11,3,23,1,'#b5bfa4');box(-13,5,27,2,'#324b55')}
      else if(!kneel){box(-8,-1,16,3,'#af8e61');box(-6,2,2,6,'#465754');box(5,2,2,6,'#465754')}
    }
    const targetBody=seat?(kneel?-5:recline?-4:-8):-13;const bodyY=-13+(targetBody+13)*(v.settle??1);
    const headY=bodyY-10+(plant&&seat?2:sky&&seat?-2:0);
    const back=v.dir==='back',side=v.dir==='left'||v.dir==='right';
    if(v.dir==='left')ctx.scale(-1,1);
    if(seat){
      limb(-3,bodyY+8,9,kneel?-1.25:recline?-1.35:-1.55,'#4c5c59',4);
      limb(5,bodyY+8,8,kneel?-1.5:recline?-1.2:-1.5,'#526560',4);
      box(5,3,7,3,'#3c433d');box(-2,4,7,3,'#5f5a4b');
    }else{box(-5,-2,4,6,'#52615b');box(2,-2,4,6,'#52615b');box(-5,3,5,3,'#5f5444');box(2,3,6,3,'#5f5444')}
    box(-6,bodyY,12,11,'#263b3c');box(-5,bodyY,10,8,p.coat);box(-4,bodyY+1,2,6,'#ffffff20');box(-5,bodyY+8,10,2,'#6b6250');
    const lean=plant&&seat?2+beat:tools&&seat?1:0;
    ctx.save();ctx.translate(lean,sky&&seat?-2:0);
    box(-5,headY,10,10,'#263536');box(-4,headY,8,8,p.hair);
    if(!back){box(side?0:-3,headY+3,side?6:8,6,p.hue);box(side?4:2,headY+5,1,1,'#273638');if(!side)box(-2,headY+5,1,1,'#273638')}
    box(-4,headY+1,8,2,p.hair);
    if(p.role==='Engineer'){box(-5,headY-1,10,3,'#d5ad6b');box(-6,headY+2,12,1,'#f5d18a')}
    if(p.role==='Surveyor'){box(-4,headY-2,8,3,'#9b8763');box(-6,headY+1,13,2,'#c1aa7a')}
    if(p.role==='Medic'){box(-4,headY+1,9,2,'#e5dcc0');box(1,headY+1,2,2,'#b36e5b')}
    ctx.restore();
    if(wave){limb(5,bodyY+2,8,-2.4+beat*.25,p.coat);box(9,bodyY-6+beat,3,4,p.hue);limb(-6,bodyY+1,8,-.1,p.coat)}
    else if(plant&&seat){
      limb(-5,bodyY+2,7,-.4,p.coat);limb(5,bodyY+2,8,-.85+beat*.23,p.coat);box(10,bodyY+8+beat*2,3,2,p.hue);
      // A hand lens and sample notebook, not a fictional harvested crop.
      box(-3,bodyY+8,7,4,'#b5aa7d');ctx.strokeStyle='#e3dca9';ctx.lineWidth=1;ctx.beginPath();ctx.arc(13,bodyY+8,2,0,tau);ctx.stroke();
    }else if(tools&&seat){
      box(6,0,14,4,'#40585b');box(8,-2,9,3,'#9eaf9d');box(12,-3,3,2,'#c5a06b');
      limb(-5,bodyY+2,8,-.7,p.coat);limb(5,bodyY+2,8,-.7+beat*.45,p.coat);
      box(9,bodyY+7,2,7,'#c8c0a3');box(8,bodyY+7,4,2,'#536c70');
      box(15,bodyY+9,3,2,p.hue);
    }else if(sky&&seat){
      limb(-6,bodyY+1,9,.4,p.coat);limb(5,bodyY+2,8,slow>.5?-1.9:-2.8,p.coat);
      box(5,headY+4,7,4,'#345059');box(9,headY+3,3,6,'#b6b89a');box(3,headY+7,3,2,p.hue);
    }else if(kind==='reading'||kind==='eating'){
      limb(-6,bodyY+2,8,-.55,p.coat);limb(5,bodyY+2,8,kind==='eating'?-2+beat*.5:.7,p.coat);
      if(kind==='reading'){box(-5,bodyY+7,14,7,'#d8c7a0');box(1,bodyY+7,1,7,'#887957');box(-4,bodyY+9,4,1,'#958e75');box(3,bodyY+11,4,1,'#958e75')}
      else{box(-4,bodyY+8,9,4,'#b7bf9d');box(5,bodyY-1+beat*2,3,2,p.hue)}
    }else if(recline){limb(-6,bodyY+2,9,.6,p.coat);limb(6,bodyY+2,9,-.6,p.coat)}
    else{
      const speaking=life?.shared?((Math.floor(t/3)+p.id)%2===0):true;
      limb(-6,bodyY+2,8,.15,p.coat);limb(5,bodyY+2,8,speaking?-.7+beat*.45:.1,p.coat);
      box(speaking?10:5,bodyY+7+(speaking?beat*2:0),4,2,p.hue);
      if(life?.familiar&&beat>.6)box(1,headY+7,3,1,'#b27560');
    }
    if(selected){ctx.font='600 9px system-ui';ctx.textAlign='center';const name=p.name.split(' ')[0];const width=ctx.measureText(name).width+10;box(-width/2,-41,width,12,'#172933ee');ctx.fillStyle='#f5dfb7';ctx.fillText(name,0,-32)}
    ctx.restore();
  }

  function pile(ctx,q,tileSize,selected,zoom) {
    ctx.save();
    ctx.translate(Math.round((q.x+.5)*tileSize),Math.round((q.y+.55)*tileSize));
    ellipse(ctx,1,6,12,4,'rgba(25,35,30,.38)');
    ctx.save();ctx.translate(-3,1);bundle(ctx,q.kind);ctx.restore();
    if(q.amount>2) {ctx.save();ctx.translate(3,-2);bundle(ctx,q.kind);ctx.restore();}
    if(selected && zoom>.75) {
      ctx.fillStyle='#242826';ctx.fillRect(-11,-20,22,12);ctx.fillStyle='#f4ddbc';
      ctx.font='600 9px system-ui';ctx.textAlign='center';ctx.fillText('×'+q.amount,0,-11);
    }
    ctx.restore();
  }
  return {draw,pile,advance,pose,bundle};
})();
