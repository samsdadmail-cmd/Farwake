// E1: one real founder's address. Presentation only; no saved flags or simulation writes.
window.FarwakeLamplight=(()=>{
 'use strict';
 let pilot=null,light={mode:'daylight',strength:0};
 const plates=new Map(), shadows=new Map();
 let terrainMap=null,clearing=null,lamp=null;
 const panes=[[[10,40,12,5],[34,42,12,5],[71,42,10,5]],[[68,41,11,5],[39,40,10,5]],[[13,42,18,5]],[[17,41,12,5],[60,41,14,5]]];
 function prepare(s,grid){
  const aya=s?.colonists?.find(p=>p.id===1&&p.name==='Aya Mercer');
  pilot=s?.buildings?.find(b=>b.id===aya?.home&&b.type==='shelter'&&b.finished)||null;
  if(!pilot){light={mode:'daylight',strength:0};return}
  const door=FarwakeDoors.state(pilot),night=s.minute<360||s.minute>1140;
  const awake=(door.actions||[]).some(a=>a!=='rest');
  const mode=!night?'daylight':!door.occupied?'empty':grid.supply<grid.used?'unpowered':awake?'awake':'sleeping';
  light={mode,strength:mode==='awake'?1:mode==='sleeping'?.24:0};
 }
 const matches=b=>!!pilot&&b===pilot;
 function plate(b){
  const style=Math.abs(b.id||0)%4,key=style+':'+light.mode;
  if(plates.has(key))return plates.get(key);
  const out=document.createElement('canvas');out.width=96;out.height=64;
  const c=out.getContext('2d');
  const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
  function shape(color,points){
   for(let y=0;y<64;y++){
    const edges=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]>y+.5)!==(b[1]>y+.5))edges.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    edges.sort((a,b)=>a-b);for(let i=0;i+1<edges.length;i+=2)box(Math.round(edges[i]),y,Math.round(edges[i+1])-Math.round(edges[i]),1,color);
   }
  }
  // Stone footing, warm horizontal timber, cold folded steel roof. One native
  // pixel per world unit; no resampled bitmap or full-screen backing surface.
  box(9,48,79,11,'#263432');box(10,50,76,6,'#5d6965');
  for(let i=0;i<8;i++){box(11+i*9,51,7,2,i%3===0?'#89928a':'#727e77');box(14+i*9,55,6,1,'#3b4c49')}
  box(10,32,76,21,'#463c34');box(12,34,72,17,'#a47c58');
  for(let y=35;y<52;y+=3){box(12,y,72,1,'#694e3d');box(13,y+1,70,1,'#bb936a')}
  for(const x of [12,33,58,81]){box(x,34,2,18,'#4c4e43');box(x,35,1,16,'#c0ae89')}
  shape('#1b2c31',[[5,16],[14,6],[78,6],[91,17],[91,36],[86,39],[7,39],[5,36]]);
  shape('#566c74',[[7,17],[15,8],[77,8],[88,18],[88,34],[7,34]]);
  shape('#8c9b99',[[7,17],[15,8],[77,8],[87,17],[87,19],[7,19]]);
  box(8,20,79,13,'#4b626c');box(8,32,79,3,'#314950');
  for(let x=15;x<84;x+=9){box(x,20,1,12,'#253e49');box(x+1,20,1,11,'#7c9195');box(x,10,1,7,'#657e85')}
  // Quiet material wear, individually placed rather than a repeating tile.
  for(const [x,y,w] of [[19,24,5],[62,29,8],[43,22,3],[73,13,4],[29,31,5]]){box(x,y,w,1,'#8d9b8e');box(x+1,y+1,w-1,1,'#657c71')}
  box(7,35,81,2,'#b0b6a5');box(8,37,79,2,'#25383b');
  box(67,12,12,8,'#22353b');box(68,12,10,1,'#a3afaa');
  for(let x=69;x<78;x+=3)box(x,15,1,4,'#71888a');
  box(22,9,7,5,'#273c44');box(23,8,5,4,'#788a87');box(21,7,9,1,'#c3c7b5');
  const glass=light.strength?(light.mode==='sleeping'?'#987854':'#f4c181'):'#4b7079';
  for(const [x,y,w,h] of panes[style]){
   box(x-2,y-2,w+4,h+5,'#353d36');box(x-1,y-1,w+2,h+2,'#c5b69a');box(x,y,w,h,glass);
   box(x+1,y,w-2,1,light.strength?'#ffe6b4':'#95b4b1');box(x+Math.floor(w/2),y,1,h,'#4f584b');
   box(x-2,y+h+1,w+4,2,'#715d46');
  }
  const port=FarwakeBuildings.entrance(b),x=port.x,y=port.y;
  box(x-3,y-2,16,18,'#343c36');box(x-1,y,12,14,'#bbac8c');box(x,y,10,14,'#3b565b');
  box(x+1,y+1,8,12,'#657b79');box(x+2,y+2,6,3,glass);box(x+7,y+8,1,2,'#efd7a0');
  box(x-5,y-4,20,2,'#a8b4af');box(x-4,y-2,18,1,'#354a4b');
  box(x-4,y+14,18,2,'#a99e84');box(x-6,y+16,22,2,'#626b60');
  // No invented belongings, fuel, smoke or residents. History stays in Hearth.
  plates.set(key,out);return out;
 }
 function ground(c,b,map,width,height){
  if(!matches(b))return;
  if(terrainMap!==map||clearing?.key!==b.x+':'+b.y){
   terrainMap=map;
   const out=document.createElement('canvas');out.width=192;out.height=144;
   const pen=out.getContext('2d'),ox=b.x*32-48,oy=b.y*32-32;
   for(let y=0;y<144;y+=2)for(let x=0;x<192;x+=2){
    const wx=ox+x,wy=oy+y,tx=Math.floor(wx/32),ty=Math.floor(wy/32);
    if(tx<0||ty<0||tx>=width||ty>=height||map[ty*width+tx]?.kind!=='grass')continue;
    const grain=((x*73+y*37+x*y*13)%101)/101;
    const edge=Math.hypot((x-96)/89,(y-72)/63)+(Math.sin(x*.08)+Math.sin(y*.09))*.06;
    if(edge>1)continue;
    pen.globalAlpha=Math.min(1,(1-edge)*2)*.8;
    pen.fillStyle=grain>.9?'#597169':grain>.6?'#536c65':'#4e685f';pen.fillRect(x,y,2,2);
   }
   clearing={key:b.x+':'+b.y,image:out};
  }
  c.drawImage(clearing.image,b.x*32-48,b.y*32-32);
 }
 function shadow(c,b,minute){
  if(!matches(b))return false;
  const style=Math.abs(b.id)%4;
  if(!shadows.has(style)){
   const out=document.createElement('canvas');out.width=96;out.height=64;
   const brush=out.getContext('2d');brush.drawImage(plate(b),0,0);
   brush.globalCompositeOperation='source-in';brush.fillStyle='#182626';brush.fillRect(0,0,96,64);shadows.set(style,out);
  }
  c.save();c.translate(b.x*32,(b.y+b.h)*32);c.transform(1,0,-Math.cos((minute-360)*Math.PI/720)*.33,.73,0,2);c.globalAlpha=.27;c.drawImage(shadows.get(style),0,-64);c.restore();return true;
 }
 function draw(c,b,door){
  if(!matches(b))return false;
  c.save();c.translate(b.x*32,b.y*32);c.imageSmoothingEnabled=false;c.drawImage(plate(b),0,0,b.w*32,b.h*32);FarwakeHearth.history(c,b);
  const p=FarwakeBuildings.entrance(b);
  if(door.openness>.01){c.fillStyle=light.strength?'#9e774c':'#243b40';c.fillRect(p.x,p.y,p.w,p.h);c.fillStyle='#657b79';c.fillRect(p.x,p.y,Math.max(1,Math.round(p.w*(1-door.openness))),p.h)}
  if(light.strength){
   // The source is the actual panes,
   // not the centre of the roof; all sleepers dim together like the interior.
   c.globalAlpha=light.strength;
   for(const [x,y,w,h] of panes[Math.abs(b.id)%4]){const g=c.createLinearGradient(0,y+h,0,64);g.addColorStop(0,'#ffc68140');g.addColorStop(1,'#ffc68100');c.fillStyle=g;c.beginPath();c.moveTo(x,y+h);c.lineTo(x+w,y+h);c.lineTo(x+w+7,64);c.lineTo(x-7,64);c.fill()}
  }
  c.restore();return true;
 }
 function screenLight(c,camera,sx,sy){
  if(!pilot||!light.strength)return;
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=light.strength*.8;
  for(const [x,y,w,h] of panes[Math.abs(pilot.id)%4]){
   const px=sx(pilot.x*32+x+w/2),py=sy(pilot.y*32+y+h),r=25*camera.z;
   if(!lamp){lamp=document.createElement('canvas');lamp.width=lamp.height=64;const p=lamp.getContext('2d'),g=p.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffc18470');g.addColorStop(1,'#ffc18400');p.fillStyle=g;p.fillRect(0,0,64,64)}
   c.drawImage(lamp,px-r,py-r,r*2,r*2);
   c.fillStyle='#ffc88960';c.fillRect(sx(pilot.x*32+x),sy(pilot.y*32+y),(Math.floor(w/2))*camera.z,h*camera.z);c.fillRect(sx(pilot.x*32+x+Math.floor(w/2)+1),sy(pilot.y*32+y),(w-Math.floor(w/2)-1)*camera.z,h*camera.z);
  }c.restore();
 }
 return{prepare,matches,ground,shadow,draw,screenLight,diagnostics:()=>({building:pilot?.id,...light,plates:plates.size})};
})();
