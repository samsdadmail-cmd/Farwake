// Local pixel coordinates share the same foot anchor as the simulation.
window.FarwakePeople = (() => {
  const ink = '#293331', boot = '#51483e', strap = '#74563e';
  const facing = new WeakMap();

  function direction(person) {
    const target = person.path?.[0];
    if (target) {
      const dx = target.x - person.x, dy = target.y - person.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.02)
        facing.set(person, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'back' : 'front'));
    }
    return facing.get(person) || 'front';
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
    const dir = direction(p), side = dir === 'right' || dir === 'left', back = dir === 'back';
    const moving = !!p.path?.length;
    // Phase is position based, so paused and faster expeditions keep their footing.
    const gait = moving ? Math.sin((p.x+p.y)*8 + p.id)*1.8 : 0;
    const step = Math.round(gait);
    const working = !moving && p.task && ['build','harvest','craft','farm','gather','forage'].includes(p.task.type);
    const swing = working ? Math.floor((p.action || 0)*3)%2 : 0;
    function box(x,y,w,h,c) {ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
    ctx.save();
    ctx.translate(Math.round(p.x*tileSize),Math.round(p.y*tileSize));
    ellipse(ctx,2,4,7,2.5,'rgba(24,34,31,.36)');
    if (selected) {
      ctx.strokeStyle='#f2ca86';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,3,9,4,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.save();
    if (dir === 'left') ctx.scale(-1,1);
    for (const [x,lift] of [[-4,step],[1,-step]]) {
      box(x,-3,3,5+lift,ink); box(x,1+lift,side?5:4,3,boot);box(x+1,1+lift,2,1,'#9b8d72');
    }
    ctx.translate(0,moving && Math.abs(step)===2 ? -1 : 0);
    box(-5,-12,9,11,ink);box(-4,-12,7,8,p.coat);box(-5,-10,3,5,p.coat);
    box(-4,-4,8,2,strap); box(-1,-4,2,1,'#dbc798');
    if(back || side) {
      box(-5,-11,side?4:8,8,strap);box(-5,-10,side?3:7,3,'#ac9974');box(-3,-8,1,4,'#d5be93');
    } else {
      box(-3,-11,2,8,'#ab9270'); box(1,-10,2,2,'#efe1b4'); box(-3,-11,6,2,'#d3c6a3');
    }
    const armY = -9+(working?-2*swing:0);
    box(3,armY,3,5,p.coat); box(4,armY+4,2,3,p.hue);
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
    if (p.carry) {
      ctx.save();ctx.translate(1,-5);bundle(ctx,p.carry.kind);ctx.restore();
      box(-5,-4,2,2,p.hue);box(5,-5,2,2,p.hue);
    } else if(working) {
      box(6,armY,1,7,strap);box(4,armY-2,6,2,'#b7c4bf');
      if (swing && p.task.type==='build') box(9,armY-3,1,1,'#f9d28d');
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
  return {draw,pile};
})();
