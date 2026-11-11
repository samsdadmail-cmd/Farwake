// Terrain is sampled in world coordinates and baked in 8-tile chunks on first sight.
// All art derives from existing tile data. Nothing here is serialized or simulated.
window.FarwakeLandscape = (() => {
  'use strict';
  const TILE = 32, CHUNK = 8;
  let currentMap, seedNumber;
  // Animated patches are small, deterministic samples attached to terrain chunks.
  const budgets={
    performance:{patches:8,rain:22,mist:0},balanced:{patches:20,rain:48,mist:1},
    cinematic:{patches:34,rain:78,mist:2}
  };
  let budget=budgets.balanced,reduced=false,weather='clear',thunderCallback,lastThunder;
  const fields=new Map();
  function configure(preset,reduceMotion){
    budget=budgets[String(preset).toLowerCase()]||budgets.balanced;
    reduced=Boolean(reduceMotion);
  }
  const chunks = new Map(), plants = new Map();
  function hash(x, y, salt = 0) {
    let n = Math.imul(x ^ salt, 1597334677) ^ Math.imul(y, 3812015801);
    n = Math.imul(n ^ n >>> 16, 2246822519);
    return ((n ^ n >>> 13) >>> 0) / 4294967296;
  }
  function noise(x, y, scale) {
    x /= scale; y /= scale;
    const i = Math.floor(x), j = Math.floor(y);
    let u = x-i, v = y-j;
    u *= u*(3-2*u); v *= v*(3-2*v);
    const a = hash(i,j,seedNumber), b = hash(i+1,j,seedNumber);
    const c = hash(i,j+1,seedNumber), d = hash(i+1,j+1,seedNumber);
    return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
  }
  function canvas(w,h) {
    const surface=document.createElement('canvas');
    surface.width=w; surface.height=h;
    return surface;
  }
  function box(c,x,y,w,h,color) {
    c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),w,h);
  }
  function poly(c,color,points) {
    c.fillStyle=color; c.beginPath(); c.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.closePath(); c.fill();
  }
  const palettes={
    heath:[[61,85,65],[160,161,91]], meadow:[[55,91,67],[132,158,87]],
    fen:[[40,76,66],[104,142,100]], sand:[[142,122,88],[218,196,142]],
    stone:[[77,86,85],[147,152,135]], water:[[25,67,80],[57,117,121]]
  };
  function bake(map,width,height,cx,cy) {
    const size=CHUNK*TILE, out=canvas(size,size), c=out.getContext('2d');
    const img=c.createImageData(size,size), data=img.data;
    const originX=cx*size, originY=cy*size;
    const get=(x,y)=>map[Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x))];
    for(let y=0;y<size;y+=2)for(let x=0;x<size;x+=2) {
      const wx=x+originX, wy=y+originY;
      // Small irregular banks follow the build grid within a few world pixels.
      const tx=Math.floor((wx+(noise(wx,wy,14)-.5)*9)/TILE);
      const ty=Math.floor((wy+(noise(wx+73,wy,13)-.5)*9)/TILE);
      const tile=get(tx,ty);
      const broad=noise(wx,wy,98), patch=noise(wx,wy,29), grain=hash(wx>>1,wy>>1,seedNumber);
      const moisture=noise(wx+41,wy,166);
      const biome=tile.kind==='grass'?(moisture>.59?'fen':moisture<.34?'heath':'meadow'):tile.kind;
      const [low,high]=palettes[biome];
      let mix=.42*broad+.35*patch+.12*grain+.11*noise(wx,wy,8);
      if(tile.kind==='water'){
        mix += .22*Math.max(0,1-Math.abs(tile.elevation-.38)*16);
        mix+=.08*Math.sin(wy*.12+noise(wx,wy,31)*7);
      }
      if(tile.kind==='stone')mix=Math.floor(mix*11)/11;
      for(let k=0;k<3;k++){
        const v=low[k]+(high[k]-low[k])*mix;
        const at=(y*size+x)*4+k;
        data[at]=data[at+4]=data[at+size*4]=data[at+size*4+4]=v;
      }
      const at=(y*size+x)*4+3;
      data[at]=data[at+4]=data[at+size*4]=data[at+size*4+4]=255;
    }
    c.putImageData(img,0,0);
    for(let i=0;i<1150;i++){
      const x=Math.floor(hash(i,cx+cy*37,seedNumber)*size), y=Math.floor(hash(i,cy+cx*41,17)*size);
      const wx=x+originX, wy=y+originY, tile=get(wx>>5,wy>>5);
      const v=hash(wx,wy,21);
      if(tile.kind==='grass'){
        const meadow=noise(wx,wy,35);
        if(v<meadow*.8){
          const h=1+Math.floor(v*10);
          box(c,x,y,4,1,'#364f423d');box(c,x+1,y-h,1,h,'#476346');
          box(c,x+2,y-h-1,1,h,'#a9b77c');box(c,x+4,y-h+1,1,h,'#829e64');
          if(meadow>.65 && v<.14)box(c,x,y-h-1,3,2,tile.moisture>.52?'#d6b7b2':'#e7c581');
        }else if(v>.82)box(c,x,y,3,1,'#bac48c55');
      }else if(tile.kind==='stone' && v>.55){
        box(c,x,y,6,1,'#495d5c');box(c,x+5,y-1,4,1,'#a8ac96');
      }else if(tile.kind==='sand')box(c,x,y,v>.75?4:1,1,'#f3d59a70');
      else if(tile.kind==='water' && v>.94)box(c,x,y,4,1,'#71a7a559');
    }
    return out;
  }
  function samples(cx,cy,map,width,height){
    const anchors=[];
    for(let i=0;i<34;i++){
      const x=(cx*8+hash(i,cx,seedNumber^cy)*8)*TILE;
      const y=(cy*8+hash(i,cy,seedNumber^cx^958)*8)*TILE;
      const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
      if(tx>=width||ty>=height)continue;
      const index=ty*width+tx;
      anchors.push({x,y,index,kind:map[index].kind,moisture:map[index].moisture,
        phase:hash(i,index,361)*Math.PI*2,frequency:.5+hash(i,index,114)});
    }
    return anchors;
  }
  function breeze(x,y,seconds){
    return (Math.sin(seconds*1.2+x*.018+y*.011)*.66+
      Math.sin(seconds*.73-x*.006+y*.031)*.34)*(weather==='wind'?1.7:weather==='rain'?1.24:.63);
  }
  const sprites=new Map();
  function halo(kind){
    if(sprites.has(kind))return sprites.get(kind);
    const fire=kind==='firefly',size=fire?20:96,out=canvas(size,size),ctx=out.getContext('2d');
    const radius=size/2,g=ctx.createRadialGradient(radius,radius,0,radius,radius,radius);
    g.addColorStop(0,fire?'#fff6ae':'#c3d9ce');
    g.addColorStop(.15,fire?'#dfed98cf':'#c3d9cebd');
    g.addColorStop(.55,fire?'#acc97136':'#c3d9ce62');
    g.addColorStop(1,fire?'#b5db7000':'#c3d9ce00');
    ctx.fillStyle=g;ctx.fillRect(0,0,size,size);sprites.set(kind,out);return out;
  }
  function animatePatch(c,anchors,seconds,solar,fog){
    const count=Math.min(anchors.length,budget.patches);
    const night=Math.max(0,Math.min(1,(.18-solar)*3));
    const morning=Math.max(0,1-Math.abs(solar-.1)*4);
    for(let i=0;i<count;i++){
      const a=anchors[i];if(fog&&!fog[a.index])continue;
      const local=seconds*a.frequency+a.phase;
      if(a.kind==='water'){
        if(reduced&&i%2)continue;
        const phase=local*.7,offset=Math.sin(phase)*3;
        const length=Math.max(1,Math.round(4+Math.cos(phase)*3));
        box(c,a.x+offset,a.y,length,1,'#b1d9c78c');
        box(c,a.x+offset+length,a.y-1,3,1,'#9acab646');
        if(i<budget.mist&&(morning>.1||weather==='rain')){
          c.globalAlpha=.13*(weather==='rain'?1:morning);
          c.drawImage(halo('mist'),a.x-55+offset*2,a.y-14,110,27);c.globalAlpha=1;
        }
        continue;
      }
      if(a.kind!=='grass')continue;
      if(!reduced){
        const lean=breeze(a.x,a.y,seconds)*2;
        c.strokeStyle=a.moisture>.5?'#92a771ad':'#b0ae768a';c.lineWidth=1;c.beginPath();
        for(let j=0;j<4;j++){
          const base=a.x+j*1.6;
          c.moveTo(base,a.y);c.quadraticCurveTo(base+1,a.y-3,base+lean+(j-1)*.9,a.y-4-j%3);
        }
        c.stroke();
      }
      if(i%7===0&&night&&weather!=='rain'&&Math.hypot(a.x/TILE-28,a.y/TILE-28)>3){
        const glow=night*(.18+.82*Math.max(0,Math.sin(local*.82+Math.sin(local*.24)))**2);
        if(glow>.025){
          const x=a.x+Math.sin(local*.37)*7+Math.sin(local*.92)*2;
          const y=a.y-5+Math.cos(local*.41)*4+Math.sin(local*.6)*2;
          c.globalAlpha=glow;c.drawImage(halo('firefly'),x-5,y-5,10,10);c.globalAlpha=1;
        }
      }else if(!reduced&&i%9===2&&!night&&weather!=='rain'){
        const progress=(local*.08)%1,leaf=weather==='wind';
        c.globalAlpha=Math.sin(progress*Math.PI)*.64;
        box(c,a.x+progress*(leaf?40:13),a.y-progress*9+Math.sin(local)*2,leaf?3:1,1,leaf?'#d9a062':'#f1e4a8');
        c.globalAlpha=1;
      }
    }
  }
  function ground(c,map,width,height,seed,left,top,right,bottom,time,environment={}){
    if(map!==currentMap){
      currentMap=map; chunks.clear(); fields.clear();lastThunder=null;seedNumber=0;
      for(const ch of String(seed))seedNumber=(Math.imul(seedNumber,31)+ch.charCodeAt(0))|0;
    }
    const state=environment.state;
    weather=state?.weather||'clear';thunderCallback=environment.onThunder;
    const solar=Math.sin(((state?.minute??720)-360)*Math.PI/720);
    const seconds=reduced?0:time*.001;
    c.save();c.imageSmoothingEnabled=false;
    for(let cy=top>>3;cy<Math.ceil(bottom/CHUNK);cy++)for(let cx=left>>3;cx<Math.ceil(right/CHUNK);cx++){
      const key=cy*1000+cx;
      if(!chunks.has(key)){
        chunks.set(key,bake(map,width,height,cx,cy));fields.set(key,samples(cx,cy,map,width,height));
      }
      const w=Math.min(CHUNK,width-cx*CHUNK)*TILE,h=Math.min(CHUNK,height-cy*CHUNK)*TILE;
      c.drawImage(chunks.get(key),0,0,w,h,cx*256,cy*256,w,h);
    }
    // Draw animation after all adjacent cached surfaces so drifting detail crosses edges.
    for(let cy=top>>3;cy<Math.ceil(bottom/CHUNK);cy++)for(let cx=left>>3;cx<Math.ceil(right/CHUNK);cx++)
      animatePatch(c,fields.get(cy*1000+cx),seconds,solar,environment.fog);
    c.restore();
  }
  function pine(c,variant){
    const cx=28, base=55, height=39+variant*2;
    box(c,cx-2,base-16,5,17,'#473d32');box(c,cx-1,base-12,2,12,'#af8660');
    const greens=variant%2?['#213e38','#30564a','#49735a','#698b63','#9eac77']:['#213f3b','#2b544a','#45745c','#69916a','#a7b879'];
    for(let tier=0;tier<5;tier++){
      const y=base-7-tier*(height-8)/5, radius=16-tier*2.8;
      const jag=[];
      for(let i=0;i<=10;i++)jag.push(cx+radius-i*radius/5,y+(i%2?3:-1)+hash(i,tier,variant)*3);
      poly(c,greens[0],[cx-1,y-19,cx+radius,y,...jag,cx-radius,y]);
      poly(c,greens[1],[cx-1,y-18,cx+radius-2,y-1,cx+4,y-1,cx+1,y+2,cx-4,y-1,cx-radius,y+1]);
      poly(c,greens[2],[cx-2,y-17,cx+1,y-4,cx-5,y-2,cx-7,y-1,cx-radius,y]);
      for(let j=0;j<radius*1.2;j++){
        const r=hash(j,tier,variant+7), s=hash(j,tier,variant+53);
        const offset=(s*2-1)*radius*r;
        box(c,cx+offset,y-15+r*14,2+Math.floor(r*2),2,greens[offset<0?(s<.23?4:3):2]);
      }
    }
  }
  function asset(type,variant){
    const out=canvas(58,64), c=out.getContext('2d');
    if(type==='tree')pine(c,variant);
    else if(type==='ore'){
      for(const [x,y,s] of [[29,48,1],[18,51,.64],[38,53,.57]]){
        c.save();c.translate(x,y);c.scale(s,s);
        poly(c,'#384e52',[-11,1,-7,-12,2,-17,10,-10,13,-1,6,4,-6,4]);
        poly(c,'#9faa96',[-11,1,-7,-12,2,-17,4,-10,-2,-4]);
        poly(c,'#6e827f',[2,-17,10,-10,13,-1,4,-4,4,-10]);
        poly(c,'#83c5b0',[-6,-5,-2,-12,0,-12,-2,-5,-5,-1]);
        box(c,-3,-10,2,2,'#dde6c5');c.restore();
      }
    }else if(type==='scrap'){
      poly(c,'#674d3f',[14,51,18,41,29,37,40,42,42,50,32,55]);
      poly(c,'#ad7961',[16,47,20,40,29,38,33,42,26,48]);
      box(c,25,43,12,9,'#435755');box(c,26,44,9,2,'#9ba999');
      for(let i=0;i<4;i++)box(c,27+i*2,47,1,4,'#263b39');
      box(c,34,36,3,7,'#d0aa74');box(c,17,52,9,2,'#ba926a');
    }else{
      for(let i=0;i<38;i++){
        const a=i*2.4,r=Math.sqrt(i/38)*12,x=27+Math.cos(a)*r,y=46+Math.sin(a)*r*.6;
        box(c,x,y,5,4,'#345a43');box(c,x-1,y-2,4,3,i%3?'#668952':'#94a16b');
        if(i%5===0)box(c,x+1,y,2,2,'#df9c80');
      }
    }
    return out;
  }
  function feature(c,f,time,minute){
    const variant=Math.floor(hash(f.x,f.y,seedNumber)*5);
    const key=f.type+variant;
    if(!plants.has(key))plants.set(key,asset(f.type,variant));
    const x=f.x*32+16,y=f.y*32+27;
    const sun=Math.cos((minute-360)*Math.PI/720);
    c.fillStyle='#192d3544';c.beginPath();
    c.ellipse(x+sun*(f.type==='tree'?10:4),y+2,f.type==='tree'?11+Math.abs(sun)*8:11,4,-sun*.24,0,2*Math.PI);c.fill();
    if(f.type==='tree'&&!reduced){
      const bend=breeze(x,y,time*.001)*.045;
      c.save();c.translate(x,y);c.transform(1,0,bend,1,0,0);
      c.drawImage(plants.get(key),-28,-55);c.restore();
    }else c.drawImage(plants.get(key),x-28,y-55);
  }
  function ruin(c,r,time){
    const x=r.x*32+16,y=r.y*32+19;
    c.save();c.translate(x,y);
    poly(c,'#243e3f88',[-18,8,8,0,25,9,3,18]);
    poly(c,'#56665e',[-19,4,-5,-5,18,1,14,9,-7,13]);
    for(const [px,py,h] of [[-10,6,19],[10,4,23],[0,5,38]]){
      poly(c,'#334a4b',[px-4,py,px-3,py-h,px+1,py-h-5,px+6,py-h+2,px+5,py+2]);
      poly(c,'#91a097',[px-4,py,px-3,py-h,px+1,py-h-5,px+1,py-2]);
      box(c,px+2,py-h+6,1,7,Math.sin(time*.002)>.4?'#a6dfcc':'#66aaa4');
    }
    c.restore();
  }
  function light(c,w,h,state,camera,sx,sy,time){
    const solar=Math.sin((state.minute-360)*Math.PI/720);
    const dark=Math.min(1,Math.max(0,(.24-solar)*1.8));
    const amber=Math.max(0,1-Math.abs(solar-.09)*2.1);
    const evening=state.minute>720;
    c.save();
    const sky=c.createLinearGradient(evening?w:0,0,evening?0:w,h);
    sky.addColorStop(0,'rgba(255,176,98,'+(.06+.31*amber)+')');
    sky.addColorStop(.55,'rgba(226,206,146,'+(.025+.09*amber)+')');
    sky.addColorStop(1,'rgba(68,96,110,.12)');
    box(c,0,0,w,h,sky);
    if(dark>.01){
      box(c,0,0,w,h,'rgba(17,31,58,'+dark*.59+')');
      c.globalCompositeOperation='screen';
      for(const b of state.buildings){
        if(!b.finished||!['lander','supplies','comms'].includes(b.type))continue;
        const x=sx((b.x+b.w*.51)*32),y=sy((b.y+b.h*.78)*32),radius=44*camera.z;
        if(x+radius<0||x-radius>w||y+radius<0||y-radius>h)continue;
        const glow=c.createRadialGradient(x,y,1,x,y,radius);
        glow.addColorStop(0,'rgba(255,179,86,'+dark*.54+')');glow.addColorStop(.45,'rgba(255,149,69,'+dark*.16+')');glow.addColorStop(1,'rgba(245,145,68,0)');
        box(c,x-radius,y-radius,radius*2,radius*2,glow);
      }
      c.globalCompositeOperation='source-over';
    }
    if(state.weather==='rain'){
      box(c,0,0,w,h,'#34475632');c.strokeStyle='#d9ede83d';c.lineWidth=1;c.beginPath();
      for(let i=0;i<(reduced?0:budget.rain);i++){
        const x=(i*157+time*.09)%(w+32)-16,y=(i*103+time*.28)%(h+36)-18;
        c.moveTo(x,y);c.lineTo(x-4,y+12);
      }
      c.stroke();
      // Storm cells pass only during rain. Seeded timing survives a reload without
      // replaying a backlog of thunder or generating rapid consecutive flashes.
      const slot=Math.floor(state.minute/180);
      const stormKey=state.day+':'+slot;
      const offset=20+hash(state.day,slot,seedNumber)*130;
      const age=state.minute-slot*180-offset;
      if(hash(slot,state.day,seedNumber^661)>.5 && age>=0&&age<5){
        if(!reduced){
          c.globalAlpha=.10*Math.sin(Math.PI*age/5);
          box(c,0,0,w,h,'#c8d4de');c.globalAlpha=1;
        }
        if(age>=2&&lastThunder!==stormKey){
          lastThunder=stormKey;thunderCallback?.();
        }
      }
    }else if(state.weather==='wind'&&!reduced){
      for(let i=0;i<Math.ceil(budget.patches/3);i++){
        const x=(i*137+time*.055)%(w+14)-7,y=(i*97+Math.sin(time*.002+i)*8+h)%h;
        box(c,x,y,3,1,'#eed49791');
      }
    }
    c.restore();
  }
  return {configure,ground,feature,ruin,light};
})();
