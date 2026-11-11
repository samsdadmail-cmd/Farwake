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
    v.reduced=!!options.reduced;
    const blend=1-Math.exp(-dt*23*Math.sqrt(speed||1));
    const dx=x-v.x,dy=y-v.y,dist=Math.hypot(dx,dy);
    if(dist>2){v.x=x;v.y=y;v.walk=0;return v}
    const moved=dist*blend;
    v.x+=dx*blend;v.y+=dy*blend;
    const strength=Math.min(1,moved/Math.max(.001,dt)/(1.15*(speed||1)));
    v.walk+=(strength-v.walk)*(1-Math.exp(-dt*15));
    if(dist>.015)v.dir=face(dx,dy);
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

  function draw(ctx,p,tileSize,time,selected,zoom) {
    const v=pose(p),dir=v.dir,side=dir==='right'||dir==='left',back=dir==='back';
    const swing=Math.sin(v.phase)*v.walk,working=v.work>.02, lift=v.held?v.lift:v.drop;
    // A long backswing and a quicker downstroke make the impact readable even at normal zoom.
    const stroke=Math.sin(v.stroke*Math.PI)*v.work;
    function box(x,y,w,h,c) {ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
    ctx.save();
    ctx.translate(v.x*tileSize,v.y*tileSize);
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
    const bob=v.reduced?0:-Math.abs(swing)*.85;
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
