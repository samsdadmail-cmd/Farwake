// Checkpoint B: Aya only. Presentation reads attendance/tasks, never changes them.
window.FarwakeHomeResident=(()=>{
 'use strict';
 const HOME_FRAMES=[{"x": 154, "y": 13, "w": 132, "h": 417}, {"x": 561, "y": 16, "w": 214, "h": 410}, {"x": 990, "y": 19, "w": 226, "h": 407}, {"x": 1460, "y": 36, "w": 167, "h": 381}, {"x": 129, "y": 479, "w": 171, "h": 382}, {"x": 469, "y": 575, "w": 391, "h": 184}, {"x": 913, "y": 574, "w": 391, "h": 185}, {"x": 1486, "y": 456, "w": 133, "h": 417}],WORLD_FRAMES=[{"x": 119, "y": 55, "w": 141, "h": 254}, {"x": 474, "y": 53, "w": 137, "h": 255}, {"x": 842, "y": 55, "w": 137, "h": 253}, {"x": 1191, "y": 55, "w": 136, "h": 253}, {"x": 119, "y": 416, "w": 141, "h": 258}, {"x": 481, "y": 416, "w": 140, "h": 258}, {"x": 836, "y": 414, "w": 138, "h": 260}, {"x": 1196, "y": 414, "w": 138, "h": 260}, {"x": 118, "y": 780, "w": 137, "h": 251}, {"x": 474, "y": 780, "w": 138, "h": 251}, {"x": 833, "y": 780, "w": 140, "h": 251}, {"x": 1190, "y": 780, "w": 137, "h": 251}];
 const images={},cutouts=new Map(),history=new WeakMap(),worldInfo={rendered:false};
 const identity=p=>p?.id===1&&p.name==='Aya Mercer'&&p.role==='Commander'&&p.coat?.toLowerCase()==='#ecb872'&&p.hair?.toLowerCase()==='#302c37'&&p.hue?.toLowerCase()==='#ffc79e';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function atlas(kind){if(!images[kind]){const im=new Image();im.src=new URL('assets/residents/aya-'+kind+'.png',document.baseURI).href;images[kind]=im}return images[kind]}
 function eligible(s,b){
  const p=s?.colonists?.find(identity),t=p?.task,v=p?.visit;
  return p&&b?.finished&&b.type==='shelter'&&p.home===b.id&&v?.building===b.id&&v.stage==='inside'&&!!t&&v.job===t.type&&t.id===b.id&&!p.path?.length&&['rest','life_home'].includes(t.type)?p:null;
 }
 function plan(s,b,lifeView,from){
  const p=eligible(s,b);if(!p)return null;
  const a=Number(p.action);if(!Number.isFinite(a)||a<0)return null;
  const base={id:p.id,name:p.name,person:p,building:b.id,action:a};
  if(p.task.type==='rest'){
   if(a>1)return{...base,pose:'sleeping',frame:5+(Math.floor(a/4)%2),x:139,y:879,activity:'Resting in her bunk'};
   const begin=from||{x:236,y:964},t=clamp(a/.9,0,1),moving=Math.hypot(begin.x-236,begin.y-964)>5&&t<1;
   return{...base,pose:moving?'walking':'standing',frame:moving?1+Math.floor(a*8)%2:0,flip:moving&&begin.x>236,x:begin.x+(236-begin.x)*t,y:begin.y+(964-begin.y)*t,activity:'Settling down to rest'};
  }
  const life=lifeView?.(p);if(!life||life.kind!=='reading'||life.building!==b.id)return null;
  if(life.phase==='settling'){
   const t=clamp((a-.35)/2.3,0,1),moving=t>0&&t<1;
   return{...base,pose:moving?'walking':'standing',frame:moving?1+Math.floor(a*5)%2:0,x:300+65*t,y:998-4*t,activity:'Settling into her evening'};
  }
  if(life.phase==='finishing')return{...base,pose:'standing',frame:0,x:365,y:994,activity:'Finishing her quiet evening'};
  return{...base,pose:'seated',frame:3+Math.floor(a/4)%2,x:365,y:994,activity:'Reading at home'};
 }
 function sprite(kind,index,light='daylight'){
  const key=kind+':'+index+':'+light;if(cutouts.has(key))return cutouts.get(key);
  const im=atlas(kind);if(!im.complete||!im.naturalWidth)return null;
  const r=(kind==='home'?HOME_FRAMES:WORLD_FRAMES)[index];
  const scale=kind==='world'?26/WORLD_FRAMES[0].h:index===5||index===6?104/r.w:124/HOME_FRAMES[0].h;
  const out=document.createElement('canvas');out.width=Math.ceil(r.w*scale);out.height=Math.ceil(r.h*scale);
  const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(im,r.x,r.y,r.w,r.h,0,0,r.w*scale,r.h*scale);
  c.globalCompositeOperation='source-atop';
  if(light==='sleeping'||light==='unpowered'){c.fillStyle=light==='sleeping'?'#07132370':'#071323bf';c.fillRect(0,0,out.width,out.height)}
  else if(light==='awake'){c.fillStyle='#ffc47719';c.fillRect(0,0,out.width,out.height)}
  cutouts.set(key,out);return out;
 }
 function occlude(c,background,points){
  c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  c.setTransform(1,0,0,1,0,0);c.drawImage(background,0,0);c.restore();
 }
 function draw(c,s,b,L,background,lifeView,light,reduced){
  atlas('home');const person=eligible(s,b);if(!person)return[];
  let old=history.get(person);
  if(!old||old.task!==person.task){
   const from=old?.building===b.id&&old.day===s.day&&old.task?.type==='life_home'&&person.task.type==='rest'?old.anchor:null;
   old={task:person.task,building:b.id,day:s.day,from};history.set(person,old);
  }
  const q=plan(s,b,lifeView,old.from);if(!q)return[];
  const index=reduced?(q.pose==='sleeping'?5:q.pose==='seated'?3:q.pose==='walking'?1:0):q.frame;
  const image=sprite('home',index,light);if(!image)return[];
  let x=q.pose==='sleeping'?q.x:q.x-image.width/2,y=q.pose==='sleeping'?q.y:q.y-image.height;
  const scale=L.dw/L.source.w;
  c.save();c.setTransform(L.d*scale,0,0,L.d*scale,L.d*(L.x-L.source.x*scale),L.d*(L.y-L.source.y*scale));c.imageSmoothingEnabled=false;
  if(q.pose!=='sleeping'){c.fillStyle='#101e2650';c.beginPath();c.ellipse(q.x,q.y-1,13,3,0,0,Math.PI*2);c.fill()}
  if(q.flip){c.save();c.translate(q.x*2,0);c.scale(-1,1);c.drawImage(image,Math.round(x),Math.round(y));c.restore()}else c.drawImage(image,Math.round(x),Math.round(y));
  if(q.pose==='sleeping'){
   // The original bedding and ladder sit in front of the sleeper, not behind her.
   occlude(c,background,[[150,922],[201,908],[225,911],[225,932],[157,956]]);
   occlude(c,background,[[151,816],[170,816],[170,977],[151,977]]);
  }else{
   // Authored arm fronts and table restore the actual room's foreground pixels.
   occlude(c,background,[[325,922],[342,928],[342,978],[329,978]]);
   occlude(c,background,[[392,920],[409,927],[407,978],[392,974]]);
   occlude(c,background,[[365,967],[493,967],[493,1026],[471,1026],[471,1000],[386,1000],[386,1026],[365,1026]]);
  }
  c.restore();old.anchor={x:q.x,y:q.y};
  return[{id:q.id,name:q.name,pose:q.pose,activity:q.activity,frame:index,source:{x,y,w:image.width,h:image.height},screen:{x:L.x+(x-L.source.x)*scale,y:L.y+(y-L.source.y)*scale,w:image.width*scale,h:image.height*scale}}];
 }
 function drawWorld(c,p,v,tileSize,selected){
  if(!identity(p))return false;
  if(v.work>.02||v.leisure||(!p.path?.length&&['eat','rest','social'].includes(p.task?.type))){worldInfo.rendered=false;return false;}
  const direction=v.dir==='back'?'up':v.dir==='left'?'left':v.dir==='right'?'right':'down',walking=v.walk>.15;
  const pair={down:[4,5],up:[6,7],left:[8,9],right:[10,11]},idle={down:0,up:1,left:2,right:3};
  const i=walking?pair[direction][Math.floor(v.phase/Math.PI)%2]:idle[direction],im=sprite('world',i);if(!im)return false;
  c.save();c.translate(v.x*tileSize,v.y*tileSize);c.imageSmoothingEnabled=false;
  c.fillStyle='#18221f50';c.beginPath();c.ellipse(1,3,7,2.5,0,0,Math.PI*2);c.fill();
  if(selected){c.strokeStyle='#f2ca86';c.lineWidth=1.5;c.beginPath();c.ellipse(0,3,9,4,0,0,Math.PI*2);c.stroke()}
  c.drawImage(im,-Math.round(im.width/2),4-im.height);c.restore();Object.assign(worldInfo,{rendered:true,id:p.id,frame:i,direction,walking});return true;
 }
 return{identity,eligible,plan,draw,drawWorld,preload:()=>{atlas('home');atlas('world')},ready:()=>!!images.home?.complete&&!!images.home?.naturalWidth,cacheCount:()=>cutouts.size,worldInfo:()=>worldInfo};
})();
