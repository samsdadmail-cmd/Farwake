// E2: a bounded real neighbourhood around Aya's address. All caches are views;
// buildings, ground kinds, routes, crops, power and attendance remain authoritative.
window.FarwakeNeighbourhood=(()=>{
 'use strict';
 const RADIUS=9.5,SIZE=608,HALF=SIZE/2;
 const supported=new Set(['shelter','cabin','sawmill','workshop','solar','wind','dining','camp','garden','lander','supplies']);
 const plates=new Map(),masks=new Map(),rotors=new Map();
 let state=null,home=null,members=[],membership=new Set(),lights=new Map(),terrainRef=null,groundCache=null,groundKey='',layoutKey='',lamp=null;
 const windows={cabin:[[17,44,15,7],[65,44,14,7]],sawmill:[[12,42,18,7]],workshop:[[54,42,16,7]],dining:[[18,59,13,9],[38,59,13,9],[78,59,13,9],[98,59,13,9]],camp:[[79,38,6,8]],lander:[[35,36,25,5]]};
 const blank={mode:'daylight',strength:0};
 const homePanes=[[[10,40,12,5],[34,42,12,5],[71,42,10,5]],[[68,41,11,5],[39,40,10,5]],[[13,42,18,5]],[[17,41,12,5],[60,41,14,5]]];
 const windowFor=b=>b.type==='shelter'?homePanes[Math.abs(b.id)%4]:(windows[b.type]||[]);
 function prepare(s,grid){
  FarwakeLamplight.prepare(s,grid);state=s;
  const p=s?.colonists?.find(p=>p.id===1&&p.name==='Aya Mercer');
  home=s?.buildings?.find(b=>b.id===p?.home&&b.type==='shelter'&&b.finished)||null;
  const next=home?s.buildings.filter(b=>b.finished&&supported.has(b.type)&&Math.hypot(b.x+b.w/2-home.x-home.w/2,b.y+b.h/2-home.y-home.h/2)<=RADIUS):[];
  const key=next.map(b=>[b.id,b.x,b.y,b.type].join(',')).join(';');
  if(key!==layoutKey||next.some(b=>!membership.has(b))){layoutKey=key;members=next;membership=new Set(next);groundCache=null;lights.clear()}
  const night=s?.minute<360||s?.minute>1140;
  for(const b of members){
   const d=FarwakeDoors.state(b),mode=!night?'daylight':!d.occupied?'empty':grid.supply<grid.used?'unpowered':d.actions.some(a=>a!=='rest')?'awake':'sleeping';
   const l=lights.get(b)||{};l.mode=mode;l.strength=mode==='awake'?1:mode==='sleeping'?.24:0;lights.set(b,l);
  }
 }
 const matches=b=>membership.has(b);
 const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 function poly(c,color,points){
  c.fillStyle=color;const lo=Math.floor(Math.min(...points.map(p=>p[1]))),hi=Math.ceil(Math.max(...points.map(p=>p[1])));
  for(let y=lo;y<hi;y++){const a=[];for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];if((p[1]>y+.5)!==(q[1]>y+.5))a.push(p[0]+(y+.5-p[1])*(q[0]-p[0])/(q[1]-p[1]));}a.sort((a,b)=>a-b);for(let i=0;i+1<a.length;i+=2)c.fillRect(Math.round(a[i]),y,Math.round(a[i+1])-Math.round(a[i]),1)}
 }
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
 function hash(x,y,salt=0){let n=Math.imul(x^salt,1597334677)^Math.imul(y,3812015801);n=Math.imul(n^n>>>16,2246822519);return((n^n>>>13)>>>0)/4294967296}
 function noise(x,y,scale,salt=0){x/=scale;y/=scale;const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return(hash(a,b,salt)*(1-u)+hash(a+1,b,salt)*u)*(1-v)+(hash(a,b+1,salt)*(1-u)+hash(a+1,b+1,salt)*u)*v}
 function plate(b){
  const light=lights.get(b)||blank,key=[b.type,Math.abs(b.id)%4,light.mode].join(':');
  if(plates.has(key))return plates.get(key);
  const w=b.w*32,h=b.h*32,out=canvas(w,h),c=out.getContext('2d'),B=(...v)=>box(c,...v),P=(color,p)=>poly(c,color,p);
  const glass=light.strength?(light.mode==='sleeping'?'#9a7957':'#f4c58b'):'#557c83';
  function pane(x,y,ww,hh){B(x-2,y-2,ww+4,hh+5,'#263c3e');B(x-1,y-1,ww+2,hh+2,'#b5b5a0');B(x,y,ww,hh,glass);B(x+1,y,ww-2,1,light.strength?'#ffe4af':'#a0b9b5');B(x+Math.floor(ww/2),y,1,hh,'#465750');B(x-2,y+hh+1,ww+4,2,'#796449')}
  function shell(){
   const e=h===96?54:34,bottom=h-10;
   B(7,bottom-2,w-14,9,'#23373b');B(8,bottom,w-16,5,'#64746e');
   for(let x=10;x<w-13;x+=11){B(x,bottom+1,8,1,'#a0a28b');B(x+3,bottom+4,8,1,'#455b58')}
   B(10,e,w-20,bottom-e,'#ad825b');for(let y=e+2;y<bottom;y+=3){B(10,y,w-20,1,'#71543f');B(11,y+1,w-22,1,'#c49b6d')}
   for(let x=11;x<w-10;x+=23){B(x,e,2,bottom-e,'#3e5350');B(x,e+1,1,bottom-e-2,'#a7ac95')}
   P('#20363f',[[5,17],[15,7],[w-19,7],[w-5,18],[w-5,e+3],[5,e+3]]);
   P('#536e7b',[[7,17],[16,9],[w-20,9],[w-7,19],[w-7,e],[7,e]]);
   P('#8fa4a5',[[7,17],[16,9],[w-20,9],[w-8,18],[w-8,20],[7,20]]);
   B(8,21,w-16,e-21,'#445f6b');
   for(let x=16;x<w-12;x+=9){B(x,21,1,e-22,'#2d4653');B(x+1,21,1,e-23,'#7c949c')}
   B(6,e,w-12,2,'#a5b4ad');B(7,e+2,w-14,2,'#21373b');
   B(w-27,13,14,8,'#263d45');B(w-26,13,12,1,'#a7b9b1');for(let x=w-25;x<w-14;x+=3)B(x,16,1,4,'#6b858a');
  }
  function door(){const p=FarwakeBuildings.entrance(b);if(!p)return;B(p.x-2,p.y-2,p.w+4,p.h+4,'#b6b398');B(p.x,p.y,p.w,p.h,'#3c555c');B(p.x+1,p.y+1,p.w-2,p.h-2,'#6f8584');B(p.x+2,p.y+2,p.w-4,3,glass);B(p.x+p.w-3,p.y+p.h-5,1,2,'#dbc195');B(p.x-4,p.y+p.h,p.w+8,2,'#a4a78e');if(p.kind==='roller')for(let y=p.y+4;y<p.y+p.h;y+=3)B(p.x+1,y,p.w-2,1,'#384e58')}
  if(['shelter','cabin','sawmill','workshop','dining'].includes(b.type)){
   shell();for(const p of windowFor(b))pane(...p);door();
   if(b.type==='sawmill'){
    B(8,51,34,8,'#2a3e40');B(10,52,29,2,'#b3a98b');B(12,55,2,5,'#728783');B(35,55,2,5,'#728783');
    B(19,45,12,7,'#314c55');for(let i=0;i<7;i++)B(20+i,46+Math.abs(3-i),1,3,'#b0b9a9');B(17,51,17,1,'#7e9b99');
   }
   if(b.type==='dining'){B(49,14,28,12,'#2c4653');B(50,15,26,9,'#6d8b91');B(62,15,2,9,'#c3c3a6');B(51,18,24,1,'#9cb5b2')}
  }else if(b.type==='solar'){
   for(const y of [6,33]){B(12,y+19,4,8,'#73817a');B(46,y+19,4,8,'#73817a');B(8,y+25,13,2,'#2d4346');B(42,y+25,13,2,'#2d4346');P('#273e49',[[3,y+5],[8,y],[59,y],[60,y+22],[4,y+22]]);B(6,y+3,51,17,'#395768');for(let row=0;row<3;row++)for(let col=0;col<8;col++){B(7+col*6,y+4+row*5,5,4,'#537689');B(7+col*6,y+4+row*5,5,1,'#809ea6')}B(5,y+21,54,1,'#a8b3aa')}
  }else if(b.type==='wind'){
   B(15,52,37,8,'#344f51');B(17,52,33,2,'#9caa9e');for(const x of [19,44]){B(x,55,2,2,'#d0c7a4');B(x+1,55,1,1,'#4e686b')}
   P('#283f48',[[24,25],[33,25],[38,53],[21,53]]);P('#6d8990',[[26,26],[30,26],[33,52],[23,52]]);B(27,29,2,22,'#b0bbb0');for(let y=34;y<51;y+=5)B(25,y,7,1,'#3e5e67');B(36,46,16,8,'#273f49');B(38,47,12,5,'#738c89');B(40,48,7,1,'#bdbea2');
   B(22,21,15,10,'#243d48');B(23,22,13,7,'#8ca3a1');B(25,23,7,1,'#d6d0af');
  }else if(b.type==='garden'){
   for(let row=0;row<3;row++){const y=6+row*18;B(6,y,72,14,'#2d4340');B(7,y,70,2,'#b6a47d');B(8,y+2,68,11,'#604e3c');B(7,y+13,70,1,'#96a58d')}
   B(81,16,11,24,'#29464f');B(82,16,9,2,'#b5b9a2');B(82,19,9,17,'#648889');for(let y=22;y<36;y+=5)B(83,y,7,1,'#9ab2ab');B(78,38,3,17,'#8ba4a0');
  }else{
   // Retain recognisable lander/canvas/storage silhouettes, bringing their
   // materials into the district palette without adding buildings or cargo.
   FarwakeBuildings.draw(c,b.type,0,0,w,h,false,b);
   c.globalCompositeOperation='source-atop';B(0,0,w,h,'#36576a30');c.globalCompositeOperation='source-over';
   if(b.type==='camp'&&light.strength)pane(79,38,6,8);
  }
  plates.set(key,out);return out;
 }
 function rotor(frame){
  if(rotors.has(frame))return rotors.get(frame);
  const out=canvas(54,54),c=out.getContext('2d');
  for(let i=0;i<3;i++){const a=frame*Math.PI/8+i*Math.PI*2/3,point=(r,side)=>[27+Math.cos(a)*r-Math.sin(a)*side,27+Math.sin(a)*r+Math.cos(a)*side];poly(c,'#b8c9c3',[point(1,-2),point(23,-1),point(24,2),point(8,3)]);poly(c,'#7e9da5',[point(1,-2),point(23,-1),point(21,0),point(5,1)])}
  box(c,24,24,7,7,'#243f4a');box(c,26,26,3,3,'#c5bea0');rotors.set(frame,out);return out;
 }
 function draw(c,b,d){
  if(!matches(b))return false;
  if(b===home)return FarwakeLamplight.draw(c,b,d);
  c.save();c.translate(b.x*32,b.y*32);c.imageSmoothingEnabled=false;c.drawImage(plate(b),0,0);FarwakeHearth.history(c,b);
  const p=FarwakeBuildings.entrance(b),l=lights.get(b)||blank;
  if(p&&d.openness>.01){box(c,p.x,p.y,p.w,p.h,l.strength?'#a68558':'#243d48');const f=1-Math.min(1,d.openness);if(p.kind==='roller')box(c,p.x,p.y,p.w,Math.ceil(p.h*f),'#6f8584');else if(p.kind==='split'){const w=Math.ceil(p.w*f/2);box(c,p.x,p.y,w,p.h,'#6f8584');box(c,p.x+p.w-w,p.y,w,p.h,'#6f8584')}else box(c,p.x,p.y,Math.ceil(p.w*f),p.h,'#6f8584')}
  if(b.type==='wind'){
   const active=!b.editOrder&&!b.production?.paused,phase=FieldPreferences.reduced||!active?0:Math.floor(state.minute*(state.weather==='wind'?2.2:1.3)+Number(b.id))%16;c.drawImage(rotor(phase),2,0);
  }
  if(d.occupied&&l.strength&&d.actions.includes('craft')&&['sawmill','workshop'].includes(b.type)){box(c,43,46,3,2,'#ffd298')}
  c.restore();return true;
 }
 function shadow(c,b,minute){
  if(!matches(b))return false;
  if(b===home)return FarwakeLamplight.shadow(c,b,minute);
  const key=b.type+':'+Math.abs(b.id)%4;
  if(!masks.has(key)){const out=canvas(b.w*32,b.h*32),p=out.getContext('2d');p.drawImage(plate(b),0,0);if(b.type==='wind')p.drawImage(rotor(0),2,0);p.globalCompositeOperation='source-in';box(p,0,0,out.width,out.height,'#142e39');masks.set(key,out)}
  c.save();c.translate(b.x*32,(b.y+b.h)*32);c.transform(1,0,-Math.cos((minute-360)*Math.PI/720)*.33,.7,0,2);c.globalAlpha=.3;c.drawImage(masks.get(key),0,-b.h*32);c.restore();return true;
 }
 function ground(c,map,width,height){
  if(!home)return;
  const ox=Math.floor((home.x+home.w/2)*32-HALF+48),oy=Math.floor((home.y+home.h/2)*32-HALF+32);
  if(terrainRef!==map||!groundCache||groundKey!==layoutKey){
   terrainRef=map;groundKey=layoutKey;groundCache=canvas(SIZE,SIZE);const p=groundCache.getContext('2d'),im=p.createImageData(SIZE,SIZE);
   for(let y=0;y<SIZE;y+=2)for(let x=0;x<SIZE;x+=2){
    const wx=ox+x,wy=oy+y,tx=Math.floor(wx/32),ty=Math.floor(wy/32),tile=map[ty*width+tx];if(tx<0||ty<0||tx>=width||ty>=height||!tile||!['grass','sand','stone'].includes(tile.kind))continue;
    const distance=Math.hypot((x-HALF)/(HALF-12),(y-HALF)/(HALF-12)),feather=Math.max(0,Math.min(1,(1-distance)*3));if(!feather)continue;
    const broad=noise(wx,wy,96,81),patch=noise(wx,wy,27,92),grain=hash(wx>>1,wy>>1,67),lichen=Math.max(0,(noise(wx,wy,17,16)-.57)*2.5);
    const soil=members.reduce((a,b)=>Math.max(a,Math.max(0,1-Math.hypot((wx-(b.x+b.w/2)*32)/(b.w*20+20),(wy-(b.y+b.h*.85)*32)/(b.h*16+15)))),0);
    let color=tile.kind==='sand'?[103+broad*27+patch*10,111+broad*25+patch*11,99+broad*26+patch*12]:tile.kind==='stone'?[67+broad*23,88+broad*24,93+broad*22]:[44+broad*23+patch*10,69+broad*22+patch*11,69+broad*26+patch*12];
    color=color.map((v,i)=>v+(grain-.5)*9+lichen*[34,30,12][i]+soil*([92,86,71][i]-v)*.52);
    const at=(y*SIZE+x)*4;for(const offset of [0,4,SIZE*4,SIZE*4+4]){for(let k=0;k<3;k++)im.data[at+offset+k]=color[k];im.data[at+offset+3]=feather*245}
   }
   p.putImageData(im,0,0);
   // Low clustered native plants and broken stone, derived from grass and
   // moisture. These are terrain details, never harvestable resource stand-ins.
   for(let i=0;i<1450;i++){
    const x=Math.floor(hash(i,17,71)*SIZE),y=Math.floor(hash(i,31,93)*SIZE),wx=ox+x,wy=oy+y,tx=Math.floor(wx/32),ty=Math.floor(wy/32),tile=map[ty*width+tx];
    if(tx<0||ty<0||tx>=width||ty>=height||tile?.kind!=='grass')continue;
    const edge=Math.hypot((x-HALF)/(HALF-18),(y-HALF)/(HALF-18));if(edge>.92||members.some(b=>wx>b.x*32-9&&wx<(b.x+b.w)*32+9&&wy>b.y*32-6&&wy<(b.y+b.h)*32+12))continue;
    const v=hash(wx,wy,5),cluster=noise(wx,wy,39,16);p.globalAlpha=Math.min(1,(.94-edge)*5);
    if(v>.91){const w=3+Math.floor(v*4);box(p,x,y,w,2,'#324e55');box(p,x+1,y-2,w-2,2,'#91a69d');box(p,x+w-2,y-1,2,2,'#587782')}
    else if(cluster>.48&&v<.66){box(p,x,y,5,1,'#253f4659');box(p,x+2,y-3,1,4,'#547870');box(p,x,y-2,3,1,'#819d86');box(p,x+3,y-4,2,1,tile.moisture>.5?'#a9adb2':'#b6b18b')}
    else if(v<.14){box(p,x,y,3,1,'#8c9e8c');box(p,x+2,y+1,2,1,'#577970')}
   }
   p.globalAlpha=1;
   // Small wet stones and reeds soften actual land/water edges. The coastline
   // and its impassable water cells stay exactly where the save places them.
   for(let ty=Math.max(0,Math.floor(oy/32));ty<Math.min(height,Math.ceil((oy+SIZE)/32));ty++)for(let tx=Math.max(0,Math.floor(ox/32));tx<Math.min(width,Math.ceil((ox+SIZE)/32));tx++){
    const tile=map[ty*width+tx];if(!['sand','grass'].includes(tile?.kind))continue;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
     if(map[(ty+dy)*width+tx+dx]?.kind!=='water')continue;
     for(let t=1;t<32;t+=3){const r=hash(tx*32+t,ty*32+t,55),x=tx*32-ox+(dx===1?31:dx===-1?0:t),y=ty*32-oy+(dy===1?31:dy===-1?0:t);p.globalAlpha=.6;box(p,x-dx*(1+r*3),y-dy*(1+r*3),3+r*4,1+r*2,r>.4?'#859f95':'#426c70');if(r>.78){box(p,x-dx*4,y-dy*4-4,1,5,'#658e83');box(p,x-dx*4+1,y-dy*4-5,2,1,'#a5b39b')}}
    }
   }p.globalAlpha=1;
   // Cleared access ground connects real reachable doorways. It is deliberately
   // thinner than built paving: no road buildings, bonuses, costs or routes change.
   const tileAt=(x,y)=>x>=0&&y>=0&&x<width&&y<height?map[y*width+x]:null;
   const open=(x,y)=>tileAt(x,y)&&tileAt(x,y).kind!=='water'&&!state.buildings.some(q=>q.type!=='path'&&q.type!=='road'&&x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h);
   const portals=members.filter(b=>['shelter','cabin','sawmill','dining','workshop','camp'].includes(b.type)).map(b=>FarwakeDoors.portalFor(b)).filter(Boolean).map(v=>({x:Math.floor(v.streetX),y:Math.floor(v.streetY)})).filter(v=>open(v.x,v.y));
   const first=FarwakeDoors.portalFor(home),start=first&&{x:Math.floor(first.streetX),y:Math.floor(first.streetY)};
   if(start&&open(start.x,start.y)){
    const paths=new Set(),queue=[start],visited=new Map([[start.x+','+start.y,null]]);
    for(let i=0;i<queue.length&&i<450;i++){const a=queue[i];for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=a.x+dx,y=a.y+dy,key=x+','+y;if(visited.has(key)||Math.abs((x+.5)*32-(ox+HALF))>HALF-8||Math.abs((y+.5)*32-(oy+HALF))>HALF-8||!open(x,y))continue;visited.set(key,a);queue.push({x,y})}}
    for(const target of portals){let a=target,guard=0;if(!visited.has(a.x+','+a.y))continue;while(a&&guard++<100){const key=a.x+','+a.y,parent=visited.get(key);if(parent){const x=(a.x+.5)*32-ox,y=(a.y+.5)*32-oy,px=(parent.x+.5)*32-ox,py=(parent.y+.5)*32-oy,id=[key,parent.x+','+parent.y].sort().join(':');if(!paths.has(id)){paths.add(id);for(let t=0;t<33;t+=4){const xx=x+(px-x)*t/32,yy=y+(py-y)*t/32;p.globalAlpha=.1;box(p,xx-4,yy-3,8,6,'#929078');p.globalAlpha=.12;box(p,xx-1,yy-1,3,3,'#929078')}}}a=parent}}
    p.globalAlpha=1;
   }
   // Each actual doorway gets a packed-earth threshold, without inventing a
   // speed-benefit road or a route through an obstructing neighbouring building.
   for(const b of members){const port=FarwakeDoors.portalFor(b);if(!port)continue;const x=port.streetX*32-ox,y=port.streetY*32-oy,tx=Math.floor(port.streetX),ty=Math.floor(port.streetY);if(map[ty*width+tx]?.kind==='water'||state.buildings.some(q=>q!==b&&q.type!=='path'&&q.type!=='road'&&tx>=q.x&&tx<q.x+q.w&&ty>=q.y&&ty<q.y+q.h))continue;for(let j=0;j<22;j++){const dx=(hash(j,b.id,23)-.5)*25,dy=(hash(j,b.id,31)-.5)*15;p.globalAlpha=.45;box(p,x+dx,y+dy,4,2,j%3?'#8b8e77':'#b2af91')}}p.globalAlpha=1;
  }
  c.drawImage(groundCache,ox,oy);
 }
 function screenLight(c,camera,sx,sy){
  FarwakeLamplight.screenLight(c,camera,sx,sy);
  if(!home)return;
  if(!lamp){lamp=canvas(96,96);const p=lamp.getContext('2d'),g=p.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,'#ffcc9180');g.addColorStop(.35,'#efb16d29');g.addColorStop(1,'#e8a16000');p.fillStyle=g;p.fillRect(0,0,96,96)}
  c.save();c.globalCompositeOperation='screen';
  for(const b of members){if(b===home)continue;const l=lights.get(b);if(!l.strength)continue;c.globalAlpha=l.strength*.8;for(const [x,y,w,h] of windowFor(b)){const px=sx(b.x*32+x+w/2),py=sy(b.y*32+y+h),r=34*camera.z;c.drawImage(lamp,px-r,py-r,r*2,r*2);box(c,sx(b.x*32+x),sy(b.y*32+y),w*camera.z,h*camera.z,'#ffd49a3b')}}c.restore();
 }
 return{prepare,matches,draw,shadow,ground,screenLight,diagnostics:()=>({home:home?.id,radius:RADIUS,buildings:members.map(b=>({id:b.id,type:b.type,...lights.get(b)})),plates:plates.size,groundPixels:groundCache?SIZE*SIZE:0,rotors:rotors.size})};
})();
