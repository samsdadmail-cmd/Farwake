// E3-B: bounded architecture and truthful habitation light. All simulation data
// are read-only; the existing neighbourhood owns selection, routes and placement.
window.FarwakeArchitecture=(()=>{
 'use strict';
 const enabledTypes=new Set(['shelter','cabin','sawmill','workshop','dining','solar','wind','garden','camp','supplies','lander']); // Same bounded E2/E3-A district.
 const base=new Map(),shadows=new Map(),spills=new Map(),washes=new Map(),rotors=new Map();
 const homePanes=[[[10,40,12,5],[34,42,12,5],[71,42,10,5]],[[68,41,11,5],[39,40,10,5]],[[13,42,18,5]],[[17,41,12,5],[60,41,14,5]]];
 const panes={cabin:[[17,44,15,7],[65,44,14,7]],sawmill:[[12,42,18,7]],workshop:[[54,42,16,7]],dining:[[18,59,13,9],[38,59,13,9],[78,59,13,9],[98,59,13,9]],camp:[[79,38,6,8]],lander:[[35,36,25,5]]};
 let state=null,members=[],lights=new Map(),layout='',tone=null,toneKey='',toneBakes=0;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const hash=(x,y,s=0)=>{let n=Math.imul(x^s,1597334677)^Math.imul(y,3812015801);n=Math.imul(n^n>>>16,2246822519);return((n^n>>>13)>>>0)/4294967296};
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 function poly(c,color,points){c.fillStyle=color;const lo=Math.floor(Math.min(...points.map(p=>p[1]))),hi=Math.ceil(Math.max(...points.map(p=>p[1])));for(let y=lo;y<hi;y++){const edges=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]>y+.5)!==(b[1]>y+.5))edges.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]))}edges.sort((a,b)=>a-b);for(let i=0;i+1<edges.length;i+=2)c.fillRect(Math.round(edges[i]),y,Math.round(edges[i+1])-Math.round(edges[i]),1)}}
 const windowFor=b=>b.type==='shelter'?homePanes[Math.abs(b.id)%4]:(panes[b.type]||[]);
 const matches=b=>members.includes(b);
 function prepare(s,grid,nearby,stamp){
  const replaced=state!==s;state=s;members=nearby.filter(b=>enabledTypes.has(b.type));
  if(replaced||layout!==stamp){layout=stamp;spills.clear();lights.clear()}
  const people=new Map();for(const p of s.colonists){const v=p.visit;if(v?.stage!=='inside'||p.task?.type!==v.job)continue;let a=people.get(v.building);if(!a){a=[];people.set(v.building,a)}a.push(p)}
  // Local electrical light gradually becomes visible at actual dusk/dawn.
  const m=s.minute,exposure=m>720?clamp((m-1040)/100):1-clamp((m-300)/100);
  for(const b of members){
   const d=FarwakeDoors.state(b),inside=people.get(b.id)||[],power=grid.supply>=grid.used;
   const sleeping=d.occupied>0&&d.actions.length&&d.actions.every(a=>a==='rest');
   const domestic=['shelter','cabin','camp'].includes(b.type);
   const settling=domestic&&inside.length===d.occupied&&inside.length>0&&inside.every(p=>p.task.type==='rest'?p.action<=1:p.task.type==='life_home'&&p.action<3);
   const mode=!exposure?'daylight':!d.occupied?'empty':!power?'unpowered':settling?'settling':sleeping?'sleeping':'awake';
   const strength=exposure*(mode==='awake'?1:mode==='settling'?.58:mode==='sleeping'?.14:0);
   lights.set(b,{mode,strength,exposure,occupied:d.occupied,powered:power,activities:[...d.actions],people:inside.map(p=>({id:p.id,name:p.name,task:p.task.type,action:p.action}))});
  }
 }
 function keyFor(b){return [b.type,b.w,b.h,Math.abs(b.id)%4].join(':')}
 function plate(b){
  const key=keyFor(b);if(base.has(key))return base.get(key);
  const w=b.w*32,h=b.h*32,im=canvas(w,h),c=im.getContext('2d'),B=(...v)=>box(c,...v),P=(col,p)=>poly(c,col,p),variant=Math.abs(b.id)%4;
  const domestic=['shelter','cabin'].includes(b.type),industrial=['sawmill','workshop'].includes(b.type),e=h===96?54:34,foot=h-8;
  function foundation(){
   B(9,foot-5,w-18,10,'#203638');B(10,foot-3,w-20,7,'#5e706a');
   for(let row=0;row<2;row++)for(let x=10-row*4;x<w-10;x+=10){const xx=Math.max(10,x),ww=Math.min(8,w-11-xx);if(ww<1)continue;B(xx,foot-2+row*3,ww,2,hash(x,row,b.id)>.6?'#8c9682':'#76877a');B(xx,foot+row*3,ww,1,'#354e4a')}
   B(8,foot+5,w-16,1,'#243e3a');
  }
  function wall(){
   foundation();B(10,e,w-20,foot-e,'#67513f');B(11,e+1,w-22,foot-e-2,industrial?'#837760':'#9d8363');
   for(let y=e+3;y<foot-2;y+=4){B(12,y,w-24,1,'#5e5141');B(12,y+1,w-24,1,industrial?'#a2987c':'#b59b75');for(let k=0;k<5;k++){const x=14+hash(y,k,b.id)*(w-30);B(x,y+2,3+hash(k,y,4)*8,1,'#766d534f')}}
   for(const x of [11,w-14]){B(x,e+1,3,foot-e-1,'#3b514b');B(x,e+1,1,foot-e-2,'#b3b49a')}
   B(10,e,w-20,3,'#283d3d');B(w-10,e+4,2,foot-e-4,'#304947');
  }
  function roof(){
   const top=industrial?7:domestic?5:8,left=5,right=w-5;
   P('#233a41',[[left,16],[18,top],[w-19,top],[right,17],[right,e+4],[left,e+4]]);
   P('#6c8084',[[left+2,16],[19,top+2],[w-20,top+2],[right-2,17],[right-2,e],[left+2,e]]);
   P('#899b96',[[left+2,16],[19,top+2],[w-20,top+2],[right-2,17],[right-2,19],[left+2,18]]);
   B(left+2,20,w-14,e-20,'#4a646f');
   // Quiet overlapping slate courses. Industrial roofs keep folded metal seams.
   if(industrial){
    for(let x=12;x<w-10;x+=8){B(x,20,1,e-20,'#253e4b');B(x+1,20,1,e-21,'#81959a');for(let y=23;y<e;y+=5)if(hash(x,y,b.id)>.67)B(x+3,y,3,1,'#718676')}
   }else{
    for(let y=20,row=0;y<e;y+=4,row++)for(let x=8-(row%2)*5;x<w-8;x+=10){const xx=Math.max(8,x),ww=Math.min(9,w-8-xx);if(ww<=0)continue;const v=hash(x,y,b.id);B(xx,y,ww,3,v>.68?'#617980':v>.28?'#536e78':'#48636e');B(xx,y+3,ww,1,'#304d58');B(xx+1,y,Math.max(1,ww-2),1,v>.6?'#8a9b97':'#718a8d')}
   }
   for(let x=19;x<w-18;x+=12){B(x,top+2,9,1,'#b0b7a2');B(x,top+3,1,3,'#4c6872')}
   B(5,e+1,w-10,2,'#a6b2a4');B(6,e+3,w-12,2,'#2a4245');B(w-9,e+4,2,foot-e-7,'#88998c');B(w-9,foot-4,4,2,'#435f5b');
   // Small bounded weathering follows seams/eaves, never white random noise.
   for(let k=0;k<7;k++){const x=12+hash(k,b.id,17)*(w-29),y=21+hash(k,b.id,19)*Math.max(1,e-24);B(x,y,2+hash(k,b.id,21)*4,1,'#80917d70')}
  }
  function window(x,y,ww,hh){
   B(x-2,y-2,ww+4,hh+5,'#293c39');B(x-1,y-1,ww+2,hh+2,'#b0aa8c');B(x,y,ww,hh,'#42636c');
   B(x+1,y,ww-2,1,'#a4b8b1');B(x+1,y+1,Math.max(1,Math.floor(ww*.25)),hh-1,'#718580');B(x+ww-3,y+1,2,hh-1,'#6c7b71');B(x+Math.floor(ww/2),y,1,hh,'#334d50');
   B(x-3,y+hh+1,ww+6,2,'#72634a');B(x-2,y+hh+3,ww+4,1,'#304842');
  }
  function entrance(){
   const p=FarwakeBuildings.entrance(b);if(!p)return;
   B(p.x-3,p.y-2,p.w+6,p.h+4,'#2a413d');B(p.x-1,p.y-1,p.w+2,p.h+2,'#b1ac8e');B(p.x,p.y,p.w,p.h,'#4e6869');
   if(p.kind==='roller'){for(let y=p.y+2;y<p.y+p.h;y+=3){B(p.x+1,y,p.w-2,1,'#86958a');B(p.x+1,y+1,p.w-2,1,'#334f56')}B(p.x+p.w/2-3,p.y+p.h-3,6,1,'#acac8c')}
   else{B(p.x+2,p.y+2,p.w-4,3,'#69898a');B(p.x+p.w-3,p.y+p.h*.6,1,2,'#d8c49a');B(p.x+1,p.y+6,1,p.h-7,'#a0a68c')}
   B(p.x-5,p.y-4,p.w+10,2,'#819c9b');B(p.x-4,p.y-2,p.w+8,1,'#29444b');
   B(p.x-4,p.y+p.h,p.w+8,2,'#a4a58a');B(p.x-6,p.y+p.h+2,p.w+12,2,'#65776a');
   for(let x=p.x-2;x<p.x+p.w+2;x+=3)B(x,p.y+p.h+1,1,1,'#3f5953');
  }
  if(['shelter','cabin','sawmill','workshop','dining'].includes(b.type)){
   wall();roof();
   if(domestic){
    // Recessed ventilator and ceramic flue (no invented fuel/fire/smoke).
    B(w-28,10,13,8,'#2b4449');B(w-27,10,11,1,'#b0b6a3');for(let x=w-26;x<w-17;x+=3)B(x,13,1,4,'#819695');
    if(b.type==='shelter'){B(21,8,8,6,'#384b4b');B(22,7,6,4,'#9a9e87');B(20,6,10,1,'#c6c4a5')}
    else{B(12,9,13,7,'#344e55');B(14,10,9,4,'#7e999c');B(18,10,1,4,'#afb7a3');B(11,16,15,1,'#a2af9c')}
   }
   if(b.type==='sawmill'){
    // A raised, practical roof monitor and the existing fixed saw bench.
    B(22,7,28,9,'#2c4550');B(23,6,26,2,'#a8b5a6');for(let x=25;x<48;x+=5){B(x,10,3,3,'#709092');B(x,13,3,1,'#344e55')}
    B(13,49,30,8,'#2b4548');B(14,49,28,2,'#b0a07b');B(15,51,2,6,'#728678');B(38,51,2,6,'#728678');
    for(let i=0;i<11;i++)B(32+i,44+Math.abs(5-i)*.6,1,6-Math.abs(5-i)*.4,i%2?'#c0c1aa':'#7c9595');B(21,51,19,1,'#3b555b');
   }
   if(b.type==='workshop'){B(w-35,9,21,10,'#2a424c');for(let x=w-33;x<w-16;x+=4)B(x,11,2,5,'#7a9291');B(w-36,18,23,2,'#acb6a4')}
   if(b.type==='dining'){
    B(37,10,w-74,17,'#29434d');B(38,9,w-76,3,'#b2b9a4');for(let x=41;x<w-41;x+=9){B(x,14,6,7,'#577983');B(x,14,6,1,'#a9bcb1');B(x+2,15,1,6,'#334e59')}B(35,26,w-70,2,'#8da59b');
    for(const x of [13,w-17]){B(x,e+5,3,foot-e-7,'#4d5c4a');B(x,e+5,1,foot-e-8,'#b3ad84')}
   }
   for(const p of windowFor(b))window(...p);entrance();
  }else{
   // Retained functional silhouettes; structural surface details only.
   if(b.type==='wind'){
    B(15,52,37,8,'#344f51');B(17,52,33,2,'#9caa9e');
    P('#283f48',[[24,25],[33,25],[38,53],[21,53]]);P('#6d8990',[[26,26],[30,26],[33,52],[23,52]]);B(27,29,2,22,'#b0bbb0');for(let y=34;y<51;y+=5)B(25,y,7,1,'#3e5e67');
    B(22,21,15,10,'#243d48');B(23,22,13,7,'#8ca3a1');B(25,23,7,1,'#d6d0af');
   }else if(b.type==='garden'){
    // Bare beds only: drawProduction owns every real crop stage.
    for(let row=0;row<3;row++){const y=6+row*18;B(6,y,72,14,'#2d4340');B(7,y,70,2,'#b6a47d');B(8,y+2,68,11,'#604e3c');B(7,y+13,70,1,'#96a58d')}
    B(81,16,11,24,'#29464f');B(82,16,9,2,'#b5b9a2');B(82,19,9,17,'#648889');for(let y=22;y<36;y+=5)B(83,y,7,1,'#9ab2ab');B(78,38,3,17,'#8ba4a0');
   }else{
    FarwakeBuildings.draw(c,b.type,0,0,w,h,false,b);c.globalCompositeOperation='source-atop';B(0,0,w,h,'#48676b24');c.globalCompositeOperation='source-over';
   }
   if(b.type==='solar'){for(const y of [8,35]){B(5,y+19,w-10,2,'#283f4b');for(let x=8;x<w-7;x+=7){B(x,y,1,17,'#9bafab80');B(x+1,y+13,4,1,'#71919b60')}}B(26,58,14,2,'#879c8f')}
   if(b.type==='wind'){B(17,53,34,3,'#829688');for(const x of [19,45]){B(x,54,2,2,'#c3c1a0');B(x+1,55,1,1,'#3c5c5a')}B(38,45,14,9,'#344f59');B(39,46,12,2,'#a1b1a2');for(let x=41;x<50;x+=3)B(x,50,1,3,'#79948b')}
   if(b.type==='camp'){for(const [x,y] of [[4,11],[48,23]])for(let k=0;k<15;k+=3){B(x+12+k,y+10+k*.5,2,1,'#c3b693');B(x+20+k*.4,y+12+k,1,2,'#746f5960')}}
   if(b.type==='supplies'){for(const [x,y,ww,hh] of [[10,12,21,15],[32,14,19,14],[23,31,25,16],[44,43,15,12]]){B(x+1,y,ww-2,1,'#b4b397');B(x+3,y+2,2,hh-3,'#476267');B(x+ww-5,y+2,2,hh-3,'#476267');B(x+4,y+hh-2,ww-8,1,'#9d9e81')}}
   if(b.type==='lander'){B(30,28,36,1,'#a9b9ae');for(const x of [24,69])for(let y=34;y<59;y+=5)B(x,y,2,2,'#819d99');B(36,51,25,2,'#314f58');B(34,77,29,3,'#9aa58e')}
   if(b.type==='garden'){for(let y=7;y<58;y+=18){B(6,y,73,1,'#b4a581');B(8,y+12,70,1,'#293f38')}B(82,17,10,1,'#b2bca6')}
  }
  base.set(key,im);return im;
 }
 function rotor(frame){
  if(rotors.has(frame))return rotors.get(frame);const im=canvas(54,54),c=im.getContext('2d');
  for(let i=0;i<3;i++){const a=frame*Math.PI/8+i*Math.PI*2/3,point=(r,side)=>[27+Math.cos(a)*r-Math.sin(a)*side,27+Math.sin(a)*r+Math.cos(a)*side];poly(c,'#b8c9c3',[point(1,-2),point(23,-1),point(24,2),point(8,3)]);poly(c,'#7e9da5',[point(1,-2),point(23,-1),point(21,0),point(5,1)])}
  box(c,24,24,7,7,'#243f4a');box(c,26,26,3,3,'#c5bea0');rotors.set(frame,im);return im;
 }
 function draw(c,b,d){
  if(!matches(b))return false;
  c.save();c.translate(b.x*32,b.y*32);c.imageSmoothingEnabled=false;c.drawImage(plate(b),0,0);FarwakeHearth.history(c,b);
  if(b.type==='wind'){const active=!b.editOrder&&!b.production?.paused,phase=FieldPreferences.reduced||!active?0:Math.floor(state.minute*(state.weather==='wind'?2.2:1.3)+Number(b.id))%16;c.drawImage(rotor(phase),2,0)}
  const p=FarwakeBuildings.entrance(b);
  if(p&&d.openness>.01){box(c,p.x,p.y,p.w,p.h,'#243e43');const f=1-clamp(d.openness);if(p.kind==='roller')box(c,p.x,p.y,p.w,Math.ceil(p.h*f),'#788c84');else if(p.kind==='split'){const q=Math.ceil(p.w*f/2);box(c,p.x,p.y,q,p.h,'#788c84');box(c,p.x+p.w-q,p.y,q,p.h,'#788c84')}else box(c,p.x,p.y,Math.ceil(p.w*f),p.h,'#788c84')}
  c.restore();return true;
 }
 function shadow(c,b,minute){
  if(!matches(b))return false;const key=keyFor(b);
  if(!shadows.has(key)){const p=plate(b),im=canvas(p.width,p.height),g=im.getContext('2d');g.drawImage(p,0,0);if(b.type==='wind')g.drawImage(rotor(0),2,0);g.globalCompositeOperation='source-in';box(g,0,0,p.width,p.height,'#16313a');shadows.set(key,im)}
  const sun=Math.max(0,Math.sin((minute-360)*Math.PI/720));c.save();
  // Contact stays short at night; directional cast belongs to the actual sun.
  c.translate(b.x*32,(b.y+b.h)*32);c.transform(1,0,-Math.cos((minute-360)*Math.PI/720)*.3,sun>.03?.46:.12,0,2);c.globalAlpha=sun>.03?.28:.23;c.drawImage(shadows.get(key),0,-b.h*32);c.restore();return true;
 }
 function spill(b){
  if(spills.has(b))return spills.get(b);
  const w=b.w*32,h=b.h*32,pad=40,im=canvas(w+pad*2,h+38),c=im.getContext('2d');
  // Sources project from actual panes onto their own wall/ground; neighbouring
  // building footprints clip the cached ground falloff rather than glowing roofs.
  for(const [x,y,ww,hh] of windowFor(b)){
   c.save();c.translate(0,h-3);c.scale(1,.48);c.translate(0,-h+3);const g=c.createRadialGradient(pad+x+ww/2,h-3,1,pad+x+ww/2,h-3,32);g.addColorStop(0,'#e9b87850');g.addColorStop(.45,'#cba26927');g.addColorStop(1,'#ac936000');c.fillStyle=g;c.fillRect(pad+x+ww/2-33,h-36,66,72);c.restore();
  }
  // Clear the wall/roof; wall wash is a separate, narrowly bounded cached layer.
  c.clearRect(0,0,im.width,h-3);
  for(const q of state.buildings){if(q===b||!q.finished||['path','road'].includes(q.type))continue;c.clearRect(pad+(q.x-b.x)*32,(q.y-b.y)*32,q.w*32,q.h*32)}
  spills.set(b,im);return im;
 }
 function wash(b){
  const key=keyFor(b);if(washes.has(key))return washes.get(key);
  const w=b.w*32,h=b.h*32,im=canvas(w,h),c=im.getContext('2d');
  for(const [x,y,ww,hh] of windowFor(b)){const g=c.createLinearGradient(0,y+hh,0,h-2);g.addColorStop(0,'#efb77945');g.addColorStop(1,'#c5a06500');c.fillStyle=g;c.beginPath();c.moveTo(x,y+hh);c.lineTo(x+ww,y+hh);c.lineTo(x+ww+7,h-3);c.lineTo(x-7,h-3);c.fill()}
  washes.set(key,im);return im;
 }
 function screenLight(c,camera,sx,sy){
  if(!members.length)return;c.save();c.globalCompositeOperation='screen';
  for(const b of members){const l=lights.get(b);if(!l?.strength)continue;const x=sx(b.x*32),y=sy(b.y*32),w=b.w*32*camera.z,h=b.h*32*camera.z;
   if(x+w+40*camera.z<0||x-40*camera.z>c.canvas?.width||y+h+38*camera.z<0||y>c.canvas?.height)continue;
   c.globalAlpha=l.strength;c.drawImage(wash(b),x,y,w,h);const im=spill(b);c.drawImage(im,x-40*camera.z,y,im.width*camera.z,im.height*camera.z);
   for(const [xx,yy,ww,hh] of windowFor(b)){
    // Leave the structural mullion and curtain edges unlit; screen blending a
    // dark stripe over a bright pane cannot restore a dark window divider.
    const mid=Math.floor(ww/2);
    for(const [offset,width] of [[1,mid-1],[mid+1,ww-mid-2]])if(width>0){
     box(c,sx(b.x*32+xx+offset),sy(b.y*32+yy+1),width*camera.z,(hh-1)*camera.z,'#efb979');
     box(c,sx(b.x*32+xx+offset),sy(b.y*32+yy+1),width*camera.z,camera.z,'#ffe0a5');
    }
   }
   const d=FarwakeDoors.state(b),p=FarwakeBuildings.entrance(b);
   if(p){if(d.openness>.02){c.globalAlpha=l.strength*d.openness;box(c,sx(b.x*32+p.x),sy(b.y*32+p.y),p.w*camera.z,p.h*camera.z,'#d8a66f')}
    else if(!['roller','flap'].includes(p.kind)){c.globalAlpha=l.strength*.55;box(c,sx(b.x*32+p.x+2),sy(b.y*32+p.y+2),Math.max(2,p.w-4)*camera.z,3*camera.z,'#f6c78c')}}
  }c.restore();
 }
 function atmosphere(c,w,h,s){
  if(!members.length)return false;const bucket=Math.floor(s.minute/5),key=bucket+':'+s.weather;
  if(!tone||key!==toneKey){tone=canvas(128,128);const p=tone.getContext('2d'),solar=Math.sin((s.minute-360)*Math.PI/720),night=clamp((.20-solar)*1.9),twilight=clamp(1-Math.abs(s.minute-(s.minute>720?1080:360))/105);
   const g=p.createLinearGradient(0,0,128,128);g.addColorStop(0,'rgba(220,167,105,'+twilight*.16+')');g.addColorStop(1,'rgba(57,92,112,'+(.035+night*.08)+')');p.fillStyle=g;p.fillRect(0,0,128,128);
   if(night){p.fillStyle='rgba(12,25,47,'+night*.66+')';p.fillRect(0,0,128,128)}toneKey=key;toneBakes++;
  }c.drawImage(tone,0,0,w,h);return true;
 }
 return{prepare,matches,draw,shadow,screenLight,atmosphere,lightFor:b=>lights.get(b),diagnostics:()=>({buildings:members.map(b=>({id:b.id,type:b.type,...lights.get(b)})),basePlates:base.size,spillPlates:spills.size,washPlates:washes.size,shadowPlates:shadows.size,rotorPlates:rotors.size,toneBakes,cachePixels:[...base.values(),...spills.values(),...washes.values(),...shadows.values(),...rotors.values()].reduce((n,c)=>n+c.width*c.height,0)})};
})();
