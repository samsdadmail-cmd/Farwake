// Checkpoint B: Aya only. Presentation reads attendance/tasks, never changes them.
window.FarwakeHomeResident=(()=>{
 'use strict';
 const HOME_FRAMES=[{"x": 154, "y": 13, "w": 132, "h": 417}, {"x": 561, "y": 16, "w": 214, "h": 410}, {"x": 990, "y": 19, "w": 226, "h": 407}, {"x": 1460, "y": 36, "w": 167, "h": 381}, {"x": 129, "y": 479, "w": 171, "h": 382}, {"x": 469, "y": 575, "w": 391, "h": 184}, {"x": 913, "y": 574, "w": 391, "h": 185}, {"x": 1486, "y": 456, "w": 133, "h": 417}],WORLD_FRAMES=[{"x":137,"y":47,"w":104,"h":285},{"x":490,"y":48,"w":105,"h":285},{"x":852,"y":48,"w":102,"h":285},{"x":1210,"y":47,"w":104,"h":286},{"x":129,"y":407,"w":118,"h":289},{"x":490,"y":407,"w":118,"h":289},{"x":841,"y":407,"w":123,"h":286},{"x":1207,"y":407,"w":122,"h":290},{"x":121,"y":767,"w":130,"h":265},{"x":481,"y":767,"w":117,"h":265},{"x":838,"y":767,"w":141,"h":268},{"x":1198,"y":767,"w":118,"h":266}];
 const images={},cutouts=new Map(),worldInfo={rendered:false};
 // Source-space pelvis centres, rather than changing silhouette bounding-box
 // centres. Extended arms/boots must not shove the torso sideways every step.
 const WORLD_HIPS=[188,543,894,1255,188,546,896,1261,177,532,887,1244];
 function gait(v){
  const direction=v.dir==='back'?'up':v.dir==='left'?'left':v.dir==='right'?'right':'down';
  const pair={down:[4,5],up:[6,7],left:[8,9],right:[10,11]},idle={down:0,up:1,left:2,right:3};
  // A 16.75-world-pixel step (one tile is 32 px), paced by actual distance.
  // Each support/contact lasts 36% of the cycle; the passing pose only 14%.
  // Preserve support-leg phase through turns. Do not restart a cycle on facing.
  const cycle=((v.phase*.75)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
  const beat=cycle<.36?0:cycle<.5?1:cycle<.86?2:3;
  const walking=(v.travelSpeed??0)>.08;
  return{direction,walking,beat,cycle,frame:walking?(beat%2?idle[direction]:pair[direction][beat/2]):idle[direction]};
 }
 const identity=p=>p?.id===1&&p.name==='Aya Mercer'&&p.role==='Commander'&&p.coat?.toLowerCase()==='#ecb872'&&p.hair?.toLowerCase()==='#302c37'&&p.hue?.toLowerCase()==='#ffc79e';
 function atlas(kind){if(!images[kind]){const im=new Image();im.src=new URL('assets/residents/aya-'+(kind==='world'?'world-b1':kind)+'.png',document.baseURI).href;images[kind]=im}return images[kind]}
 function eligible(s,b){
  const p=s?.colonists?.find(identity),t=p?.task,v=p?.visit;
  return p&&b?.finished&&b.type==='shelter'&&p.home===b.id&&v?.building===b.id&&v.stage==='inside'&&!!t&&v.job===t.type&&t.id===b.id&&!p.path?.length&&['rest','life_home'].includes(t.type)?p:null;
 }
 function plan(s,b,lifeView){
  const p=eligible(s,b);if(!p)return null;
  const a=Number(p.action);if(!Number.isFinite(a)||a<0)return null;
  const base={id:p.id,name:p.name,person:p,building:b.id,action:a};
  if(p.task.type==='rest'){
   if(a>1)return{...base,pose:'sleeping',frame:5+(Math.floor(a/4)%2),x:130,y:890,activity:'Resting in her bunk'};
   // No indoor navigation graph exists. These are truthful state-bound pose
   // changes, not an invented walk across furniture or a doorway teleport.
   return{...base,pose:'standing',frame:0,x:236,y:964,activity:'Settling down to rest'};
  }
  const life=lifeView?.(p);if(!life||life.kind!=='reading'||life.building!==b.id)return null;
  if(life.phase==='settling'){
   return{...base,pose:'standing',frame:0,x:300,y:998,activity:'Settling into her evening'};
  }
  if(life.phase==='finishing')return{...base,pose:'standing',frame:0,x:365,y:994,activity:'Finishing her quiet evening'};
  return{...base,pose:'seated',frame:3+Math.floor(a/4)%2,x:365,y:994,activity:'Reading at home'};
 }
 function sprite(kind,index,light='daylight'){
  const key=kind+':'+index+':'+light;if(cutouts.has(key))return cutouts.get(key);
  const im=atlas(kind);if(!im.complete||!im.naturalWidth)return null;
  const r=(kind==='home'?HOME_FRAMES:WORLD_FRAMES)[index];
  const scale=kind==='world'?28/r.h:index===5||index===6?104/r.w:124/HOME_FRAMES[0].h;
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
  const q=plan(s,b,lifeView);if(!q)return[];
  const index=reduced?(q.pose==='sleeping'?5:q.pose==='seated'?3:q.pose==='walking'?1:0):q.frame;
  const image=sprite('home',index,light);if(!image)return[];
  let x=q.pose==='sleeping'?q.x:q.x-image.width/2,y=q.pose==='sleeping'?q.y:q.y-image.height;
  const scale=L.dw/L.source.w;
  c.save();c.setTransform(L.d*scale,0,0,L.d*scale,L.d*(L.x-L.source.x*scale),L.d*(L.y-L.source.y*scale));c.imageSmoothingEnabled=false;
  if(q.pose!=='sleeping'){c.fillStyle='#101e2650';c.beginPath();c.ellipse(q.x,q.y-1,13,3,0,0,Math.PI*2);c.fill()}
  if(q.flip){c.save();c.translate(q.x*2,0);c.scale(-1,1);c.drawImage(image,Math.round(x),Math.round(y));c.restore()}else c.drawImage(image,Math.round(x),Math.round(y));
  if(q.pose==='sleeping'){
   // The original bedding and ladder sit in front of the sleeper, not behind her.
   occlude(c,background,[[130,911],[185,894],[195,901],[195,925],[153,948],[130,943]]);
   occlude(c,background,[[151,816],[170,816],[170,977],[151,977]]);
  }else{
   // Authored arm fronts and table restore the actual room's foreground pixels.
   occlude(c,background,[[325,922],[342,928],[342,978],[329,978]]);
   occlude(c,background,[[392,920],[409,927],[407,978],[392,974]]);
   occlude(c,background,[[365,967],[493,967],[493,1026],[471,1026],[471,1000],[386,1000],[386,1026],[365,1026]]);
  }
  c.restore();
  return[{id:q.id,name:q.name,pose:q.pose,activity:q.activity,frame:index,source:{x,y,w:image.width,h:image.height},screen:{x:L.x+(x-L.source.x)*scale,y:L.y+(y-L.source.y)*scale,w:image.width*scale,h:image.height*scale}}];
 }
 function drawWorld(c,p,v,tileSize,selected){
  if(!identity(p))return false;
  const standingPause=v.leisure&&['settling','finishing'].includes(v.leisure.phase);
  if(!p.path?.length&&(v.travelSpeed??0)<.08&&v.walk<.08&&(v.work>.02||v.leisure&&!standingPause||['eat','rest','social'].includes(p.task?.type))){worldInfo.rendered=false;return false;}
  const {direction,walking,beat,cycle,frame:i}=gait(v),im=sprite('world',i);if(!im)return false;
  c.save();c.translate(v.x*tileSize,v.y*tileSize);c.imageSmoothingEnabled=false;
  c.fillStyle='#18221f50';c.beginPath();c.ellipse(1,3,7,2.5,0,0,Math.PI*2);c.fill();
  if(selected){c.strokeStyle='#f2ca86';c.lineWidth=1.5;c.beginPath();c.ellipse(0,3,9,4,0,0,Math.PI*2);c.stroke()}
  const bob=walking&&!v.reduced?-.5*Math.sin(cycle*Math.PI*4)**2*Math.min(1,v.travelSpeed/.7):0;
  const hip=(WORLD_HIPS[i]-WORLD_FRAMES[i].x)*28/WORLD_FRAMES[i].h;
  c.drawImage(im,-Math.round(hip),4-im.height+bob);c.restore();Object.assign(worldInfo,{rendered:true,id:p.id,frame:i,direction,walking,beat,cycle,speed:v.travelSpeed||0,x:v.x,y:v.y,phase:v.phase});return true;
 }
 return{identity,eligible,plan,draw,drawWorld,gait,preload:()=>{atlas('home');atlas('world')},ready:()=>!!images.home?.complete&&!!images.home?.naturalWidth,cacheCount:()=>cutouts.size,worldInfo:()=>worldInfo};
})();
