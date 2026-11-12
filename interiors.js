// An authored cutaway, populated only by residents physically inside this building.
window.FarwakeInteriors=(()=>{
 function draw(canvas,b,state,occupants,time,reduced){
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const W=384,H=216; c.clearRect(0,0,W,H);
  const home=['shelter','cabin','dormitory','camp','outpost'].includes(b.type),night=state.minute<390||state.minute>1080;
  const awake=occupants.some(p=>p.task?.type!=='rest'),lit=occupants.length>0;
  const box=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
  box(0,0,W,H,night?'#112635':'#344b50');
  for(let i=0;i<17;i++){const x=(i*53+b.id*7)%W;box(x,15+(i*23)%70,1,1,'#8ba6a2')}
  if(state.weather==='rain'&&!reduced)for(let i=0;i<24;i++)box((i*47+time*.03)%W,(i*31+time*.06)%H,1,5,'#738b94');
  box(22,36,340,167,'#0e171c');box(27,42,330,68,lit?'#665c4c':'#384246');
  for(let i=0;i<11;i++){box(29+i*30,43,1,65,'#89725b');box(27+i*30,111,29,87,lit?'#77654e':'#404a49');box(27+i*30,111,29,1,'#aa8a61')}
  box(31,109,322,4,'#bd9761');
  // Deep window, a hint of the world outside.
  box(163,52,64,43,'#282e2e');box(167,55,56,35,night?'#263f55':'#74928b');box(194,55,3,35,'#a28f70');box(167,73,56,2,'#a28f70');
  box(239,65,100,7,'#b7925b');
  for(let i=0;i<7;i++){box(245+i*12,52+(i%3)*2,8,13-(i%3)*2,['#b7baa1','#b1896c','#7a9990'][i%3]);box(246+i*12,54,1,9,'#dfc28c')}
  box(42,49,80,8,'#9e805a');box(45,57,4,44,'#403d33');box(115,57,4,44,'#403d33');
  box(52,64,22,29,'#4b6665');box(55,67,16,23,'#8aa199');box(83,65,19,25,'#756956');box(86,68,13,19,'#c4af84');
  if(home){
   box(41,142,82,43,'#343d3c');box(44,138,76,25,'#bcb69a');box(44,152,76,30,['#8e8870','#8e6d60','#657f80'][Math.abs(b.id)%3]);box(47,140,22,12,'#ddd1ae');box(41,183,4,8,'#3c3a32');box(119,183,4,8,'#3c3a32');
   box(147,150,93,33,'#5b4e3e');box(152,145,84,22,'#b29364');box(155,167,4,24,'#463e33');box(229,167,4,24,'#463e33');
   box(168,149,14,9,'#d4c49c');box(184,151,11,6,'#8fa291');box(213,149,7,8,'#d8c5a0');
   box(273,139,52,37,'#7c7860');box(270,135,58,9,'#b0a080');box(268,148,9,30,'#454b42');box(321,148,9,30,'#454b42');
   box(283,183,34,4,'#a18361');box(291,174,18,8,'#707d56');box(296,163,4,14,'#91a36d');box(290,164,7,4,'#b2bd7c');box(300,168,7,4,'#93a56c');
  }else{
   for(let i=0;i<3;i++){box(43+i*104,139,82,24,'#77817b');box(45+i*104,163,5,29,'#3c4642');box(116+i*104,163,5,29,'#3c4642');box(52+i*104,128,29,14,'#324c50');box(54+i*104,130,25,9,'#88aaa1');box(90+i*104,146,20,4,'#d2b279')}
  }
  // Lamp is tied to actual awake occupancy. Sleeping light is low and cool.
  box(340,77,3,89,'#8e8061');box(329,74,24,16,lit&&awake?'#e1bb75':'#69716a');
  if(lit){const glow=c.createRadialGradient(338,91,2,338,91,175);glow.addColorStop(0,awake?'#ffcd795c':'#9aafa41c');glow.addColorStop(1,'#efb46100');c.fillStyle=glow;c.fillRect(27,42,330,156)}
  occupants.slice(0,6).forEach((p,i)=>{
   const sleep=p.task?.type==='rest',x=sleep?68+i*8:160+(i%3)*37,y=sleep?151:137+Math.floor(i/3)*30;
   c.save();c.translate(x,y);if(sleep)c.rotate(-Math.PI/2);
   const sway=reduced||sleep?0:Math.sin(time*.002+p.id)*2;
   box(-6,-6,13,17,p.coat);box(-5,-19,11,12,p.hair);box(-3,-16,9,8,p.hue);box(-8,1,3,9,p.coat);box(6,0+sway,3,8,p.hue);box(-5,11,4,8,'#343d3b');box(2,11,4,8,'#343d3b');
   if(!sleep){box(-2,8,13,6,'#c6b58b');box(4,8,1,6,'#76684e')}
   c.restore();
  });
  if(!lit){box(27,42,330,156,'#152a354a')}
  box(22,198,340,5,'#bc9562');
 }
 return {draw};
})();
