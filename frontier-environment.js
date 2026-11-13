// E3-A: one cached ecological neighbourhood. No simulation/save writes.
window.FarwakeEnvironment=(()=>{
 'use strict';
 const SIZE=704,HALF=SIZE/2,STEP=2,N=SIZE/STEP,COLS=SIZE/8+1;
 const atlas=new Image();atlas.src='assets/frontier-e3/flora-atlas.png';
 let revision=0;atlas.onload=()=>revision++;
 let mapRef=null,key='',surface=null,originX=0,originY=0,visible=false;
 let waterMarks=[],sway=[],bakes=0,lastBakeMs=0,maxBakeMs=0,phases={},plantCount=0,clusterCount=0,trackCount=0;
 const sprites=[];
 const hash=(x,y,s=0)=>{let n=Math.imul(x^s,1597334677)^Math.imul(y,3812015801);n=Math.imul(n^n>>>16,2246822519);return((n^n>>>13)>>>0)/4294967296};
 function noise(x,y,scale,s=0){x/=scale;y/=scale;const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return(hash(a,b,s)*(1-u)+hash(a+1,b,s)*u)*(1-v)+(hash(a,b+1,s)*(1-u)+hash(a+1,b+1,s)*u)*v}
 const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const make=(size=SIZE)=>{const c=document.createElement('canvas');c.width=c.height=size;return c};
 function prepareSprites(){
  if(sprites.length)return;
  // Shared 32px clusters and quieter highlights. Original atlas remains intact;
  // no new assets or per-frame colour processing.
  const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/4;
  for(let i=0;i<16;i++){
   const out=make(32),c=out.getContext('2d');c.imageSmoothingEnabled=false;
   c.drawImage(atlas,Math.floor(i%4*cw),Math.floor(i/4)*ch,cw,ch,0,0,32,32);
   const im=c.getImageData(0,0,32,32),d=im.data;
   for(let p=0;p<d.length;p+=4){if(!d[p+3])continue;d[p]=d[p]*.77+12;d[p+1]=d[p+1]*.78+16;d[p+2]=d[p+2]*.79+18}
   c.putImageData(im,0,0);sprites.push(out);
  }
 }
 function bake(map,width,height,home,members,stamp,state,features){
  const start=performance.now();prepareSprites();const prepared=performance.now();
  originX=Math.floor((home.x+home.w/2)*32-HALF+48);originY=Math.floor((home.y+home.h/2)*32-HALF+32);
  const get=(x,y)=>x>=0&&y>=0&&x<width&&y<height?map[y*width+x]:null;
  const wet=(x,y)=>get(x,y)?.kind==='water'?1:0;
  function water(x,y){x=x/32-.5;y=y/32-.5;const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;return(wet(a,b)*(1-u)+wet(a+1,b)*u)*(1-v)+(wet(a,b+1)*(1-u)+wet(a+1,b+1)*u)*v}
  const landDistance=new Float32Array(width*height).fill(99);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!wet(x,y))landDistance[y*width+x]=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x)landDistance[i]=Math.min(landDistance[i],landDistance[i-1]+1);if(y)landDistance[i]=Math.min(landDistance[i],landDistance[i-width]+1)}
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;if(x+1<width)landDistance[i]=Math.min(landDistance[i],landDistance[i+1]+1);if(y+1<height)landDistance[i]=Math.min(landDistance[i],landDistance[i+width]+1)}
  const occupied=new Set();for(const b of state.buildings){if(['path','road'].includes(b.type))continue;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)occupied.add(y*width+x)}
  const open=(x,y)=>get(x,y)&&!wet(x,y)&&!occupied.has(y*width+x);
  const segments=[],first=FarwakeDoors.portalFor(home),root=first&&{x:Math.floor(first.streetX),y:Math.floor(first.streetY)};
  if(root&&open(root.x,root.y)){
   const queue=[root],visited=new Map([[root.x+','+root.y,null]]);
   for(let i=0;i<queue.length&&i<600;i++){const a=queue[i];for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=a.x+dx,y=a.y+dy,k=x+','+y;if(visited.has(k)||Math.abs((x+.5)*32-originX-HALF)>HALF-12||Math.abs((y+.5)*32-originY-HALF)>HALF-12||!open(x,y))continue;visited.set(k,a);queue.push({x,y})}}
   const used=new Set();
   const add=(a,b)=>{const id=[a.x+','+a.y,b.x+','+b.y].sort().join(':');if(used.has(id))return;used.add(id);segments.push({x:a.x,y:a.y,px:b.x,py:b.y})};
   for(const b of members){
    if(!['shelter','cabin','sawmill','workshop','dining','camp'].includes(b.type))continue;
    const p=FarwakeDoors.portalFor(b);if(!p)continue;let a={x:Math.floor(p.streetX),y:Math.floor(p.streetY)},route=[],guard=0;
    if(!visited.has(a.x+','+a.y))continue;
    while(a&&guard++<120){route.push({x:(a.x+.5)*32-originX,y:(a.y+.5)*32-originY});a=visited.get(a.x+','+a.y)}
    // Rounded bends stay inside their open tile: no diagonal gameplay shortcut.
    let prev=route[0];
    for(let i=1;i<route.length-1;i++){
     const q=route[i],r=route[i+1],before=route[i-1];
     if((q.x-before.x)*(r.y-q.y)!==(q.y-before.y)*(r.x-q.x)){
      const entry={x:q.x+(before.x-q.x)*.25,y:q.y+(before.y-q.y)*.25},exit={x:q.x+(r.x-q.x)*.25,y:q.y+(r.y-q.y)*.25};add(prev,entry);let last=entry;
      for(let j=1;j<=4;j++){const t=j/4,u=1-t,next={x:u*u*entry.x+2*u*t*q.x+t*t*exit.x,y:u*u*entry.y+2*u*t*q.y+t*t*exit.y};add(last,next);last=next}prev=exit;
     }else{add(prev,q);prev=q}
    }if(route.length>1)add(prev,route.at(-1));
   }
  }
  trackCount=segments.length;
  // Union worn soil into one field. No stacked alpha, bright stripes or dots.
  const track=new Float32Array(N*N);
  for(const s of segments){const dx=s.px-s.x,dy=s.py-s.y,len=dx*dx+dy*dy;if(!len)continue;
   for(let y=Math.max(0,Math.floor((Math.min(s.y,s.py)-13)/STEP));y<Math.min(N,Math.ceil((Math.max(s.y,s.py)+13)/STEP));y++)for(let x=Math.max(0,Math.floor((Math.min(s.x,s.px)-13)/STEP));x<Math.min(N,Math.ceil((Math.max(s.x,s.px)+13)/STEP));x++){
    const xx=x*STEP,yy=y*STEP,t=Math.max(0,Math.min(1,((xx-s.x)*dx+(yy-s.y)*dy)/len)),qx=xx-s.x-t*dx,qy=yy-s.y-t*dy,d=qx*qx+qy*qy;
    if(d<169)track[y*N+x]=Math.max(track[y*N+x],1-Math.sqrt(d)/13);
   }
  }const routesDone=performance.now();
  // Expensive noise/building influence is shared on an 8px lattice rather than
  // re-evaluated at ~124k ground samples. Final ground retains 2px world pixels.
  const fields=Array.from({length:4},()=>new Float32Array(COLS*COLS));
  for(let y=0;y<COLS;y++)for(let x=0;x<COLS;x++){
   const wx=originX+x*8,wy=originY+y*8,tx=Math.floor(wx/32),ty=Math.floor(wy/32),tile=get(tx,ty);if(!tile)continue;
   const broad=noise(wx,wy,150,28),patch=noise(wx,wy,53,91),fine=noise(wx,wy,14,73),wf=water(wx+(noise(wx,wy,28,3)-.5)*5,wy+(noise(wx,wy,29,7)-.5)*5);
   let r,g,b;
   if(wf>.5){const depth=Math.min(1,(landDistance[ty*width+tx]||0)/3),shine=(patch-.5)*9;r=31-depth*10+shine;g=75-depth*24+shine;b=83-depth*19+shine;if(wf<.68){r+=13;g+=17;b+=12}}
   else{
    const moisture=tile.moisture??.5,stone=tile.kind==='stone'||(patch>.69&&fine>.53),lichen=Math.max(0,(noise(wx,wy,34,17)-.54)*2.5);
    if(stone){r=75+broad*17;g=94+broad*17;b=101+broad*19}
    else if(tile.kind==='sand'||wf>.18){r=91+broad*18;g=111+broad*14;b=103+broad*15}
    else{r=45+broad*20+lichen*24;g=77+broad*22+lichen*20;b=76+broad*22+lichen*4+(moisture-.5)*9}
    let soil=0;for(const b of members){const dx=(wx-(b.x+b.w/2)*32)/(b.w*20+20),dy=(wy-(b.y+b.h*.85)*32)/(b.h*16+18);soil=Math.max(soil,1-Math.sqrt(dx*dx+dy*dy))}
    r+=(100-r)*soil*.42;g+=(99-g)*soil*.42;b+=(82-b)*soil*.42;
   }
   const i=y*COLS+x;fields[0][i]=r;fields[1][i]=g;fields[2][i]=b;fields[3][i]=fine;
  }const latticeDone=performance.now();
  const low=make(N),p=low.getContext('2d'),im=p.createImageData(N,N),D=im.data;
  const earth=[111,108,88],sample=(f,i,u,v)=>(f[i]*(1-u)+f[i+1]*u)*(1-v)+(f[i+COLS]*(1-u)+f[i+COLS+1]*u)*v;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
   const wx=originX+x*STEP,wy=originY+y*STEP;if(!get(Math.floor(wx/32),Math.floor(wy/32)))continue;
   const nx=(x*STEP-HALF)/(HALF-6),ny=(y*STEP-HALF)/(HALF-6),sq=nx*nx+ny*ny;if(sq>=1)continue;
   const alpha=sq<.5625?1:Math.min(1,(1-Math.sqrt(sq))*4),i=(y>>2)*COLS+(x>>2),u=(x%4)/4,v=(y%4)/4,at=(y*N+x)*4;
   const fine=sample(fields[3],i,u,v),worn=Math.max(0,track[y*N+x]-(fine-.35)*.4)*.43;
   for(let ch=0;ch<3;ch++){const base=sample(fields[ch],i,u,v);D[at+ch]=base+(earth[ch]-base)*worn+(fine-.5)*3}
   D[at+3]=alpha*255;
  }p.putImageData(im,0,0);const out=make(),c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(low,0,0,SIZE,SIZE);
  const terrainDone=performance.now();
  // Protect roots, not only sprite centres: keep doors, features and routes clear.
  const clear=(x,y,size=0)=>{
   const wx=originX+x,wy=originY+y,pad=size*.32;
   if(Math.hypot((x-HALF)/(HALF-22),(y-HALF)/(HALF-22))>1)return false;
   if(members.some(b=>wx>b.x*32-12-pad&&wx<(b.x+b.w)*32+12+pad&&wy>b.y*32-8-pad*.3&&wy<(b.y+b.h)*32+14+pad*.3))return false;
   if(features?.some(f=>Math.hypot((f.x+.5)*32-wx,(f.y+.5)*32-wy)<22+pad*.4))return false;
   const t=track[Math.max(0,Math.min(N-1,Math.round(y/STEP)))*N+Math.max(0,Math.min(N-1,Math.round(x/STEP)))];return !t;
  };
  // Uneven habitat patches, sparse singles and negative space. Moisture changes
  // density/species alongside actual shore proximity and settlement clearance.
  const clusters=[],plants=[];waterMarks=[];sway=[];
  for(let i=0;i<112;i++){
   const x=22+hash(i,19,37)*(SIZE-44),y=22+hash(i,31,53)*(SIZE-44),wx=originX+x,wy=originY+y,tile=get(Math.floor(wx/32),Math.floor(wy/32));if(!tile)continue;
   const wf=water(wx,wy),moisture=tile.moisture??.5,v=hash(i,47,81),habitat=noise(wx,wy,115,66);
   if(wf>.76){if(v<.5&&waterMarks.length<22)waterMarks.push({x:wx,y:wy,phase:v*20,w:5+v*12});continue}
   const shore=wf>.08,rock=tile.kind==='stone'||(!shore&&v>.76&&habitat>.45);
   if(!clear(x,y,42)||(!shore&&!rock&&habitat<.39+(.5-moisture)*.17))continue;
   const radius=shore?15+v*17:rock?16+v*15:19+v*25;
   if(clusters.some(p=>Math.hypot(x-p.x,y-p.y)<(radius+p.radius)*.68))continue;
   clusters.push({x,y,radius});
   const count=rock?2:1+Math.floor(hash(i,6,12)*(shore?4:2+moisture*3));
   for(let j=0;j<count;j++){
    const angle=hash(i,j,93)*Math.PI*2,rr=j?Math.sqrt(hash(i,j,29))*radius:0,xx=x+Math.cos(angle)*rr,yy=y+Math.sin(angle)*rr*.7;
    const wxx=originX+xx,wyy=originY+yy,t=get(Math.floor(wxx/32),Math.floor(wyy/32));if(!t)continue;const w=water(wxx,wyy);if(w>.63)continue;
    const q=hash(i,j,74),index=shore&&w>.06?12+Math.floor(q*4):rock&&j===0?4+Math.floor(q*4):j>0||q>.61?8+Math.floor(q*4):Math.floor(q*4);
    const size=(index>=8&&index<12?24:32)+(j===0?8:0)+hash(i,j,51)*11;
    if(!clear(xx,yy,size)||plants.some(p=>Math.hypot(xx-p.x,yy-p.y)<(size+p.size)*.2))continue;
    plants.push({x:xx,y:yy,index,size,flip:q>.5,angle:index>=8&&index<12?(q-.5)*.7:(q-.5)*.16});
   }
  }
  clusterCount=clusters.length;plantCount=plants.length;
  // Contact beds precede all sprites: irregular soil/lichen marks, a quiet root
  // shadow, no isolated black oval or high-contrast decorative sticker border.
  for(const a of plants){const rock=a.index>=4&&a.index<8;
   for(let k=0;k<13;k++){const q=hash(k,Math.floor(a.x),61),angle=hash(k,Math.floor(a.y),67)*6.28,rx=Math.cos(angle)*a.size*.34,ry=Math.sin(angle)*a.size*.13;
    rect(c,a.x+rx,a.y+a.size*.03+ry,3+q*6,2+q*2,k%3?'#425d5240':rock?'#8a95834a':'#6a7e5c38')}
   c.fillStyle='#183b3630';c.beginPath();c.ellipse(Math.round(a.x),Math.round(a.y+a.size*.02),a.size*.28,a.size*.08,0,0,Math.PI*2);c.fill();
  }
  plants.sort((a,b)=>a.y-b.y);
  for(const a of plants){
   const edge=Math.hypot((a.x-HALF)/(HALF-22),(a.y-HALF)/(HALF-22));c.save();c.globalAlpha=Math.min(1,(1-edge)*7);c.translate(Math.round(a.x),Math.round(a.y));c.rotate(a.angle);c.scale(a.flip?-1:1,1);
   const flat=a.index>=4&&a.index<12?.8:1;c.drawImage(sprites[a.index],-Math.round(a.size/2),-Math.round(a.size*.74*flat),Math.round(a.size),Math.round(a.size*flat));c.restore();
   if(a.index<4||a.index>=12)if(sway.length<14)sway.push({x:originX+a.x,y:originY+a.y,phase:a.index+a.x*.1});
  }
  // Foundations and understated scuffs share the earth. No bright doormat.
  for(const b of members){const x=b.x*32-originX,y=b.y*32-originY,w=b.w*32,h=b.h*32;
   c.fillStyle='#17373035';c.beginPath();c.ellipse(x+w*.5,y+h*.9,w*.48+2,7,0,0,Math.PI*2);c.fill();
   const p=FarwakeDoors.portalFor(b);if(p&&open(Math.floor(p.streetX),Math.floor(p.streetY))){const xx=p.streetX*32-originX,yy=p.streetY*32-originY;
    for(let j=0;j<12;j++)rect(c,xx-11+hash(j,b.id,8)*22,yy-4+hash(j,b.id,9)*8,2+hash(j,b.id,12)*4,1,'#a49c7e35')}
  }
  mapRef=map;key=stamp+':'+revision;surface=out;bakes++;lastBakeMs=performance.now()-start;maxBakeMs=Math.max(maxBakeMs,lastBakeMs);
  phases={sprites:prepared-start,routes:routesDone-prepared,lattice:latticeDone-routesDone,raster:terrainDone-latticeDone,composition:performance.now()-terrainDone};
 }
 function ground(c,map,width,height,home,members,stamp,state,features,left,top,right,bottom){
  visible=false;if(!home||!atlas.complete||!atlas.naturalWidth)return;
  const cx=(home.x+home.w/2)*32+48,cy=(home.y+home.h/2)*32+32;
  if(Number.isFinite(left)&&(right*32<cx-HALF||left*32>cx+HALF||bottom*32<cy-HALF||top*32>cy+HALF))return;
  if(map!==mapRef||!surface||key!==stamp+':'+revision)bake(map,width,height,home,members,stamp,state,features);
  visible=true;c.drawImage(surface,originX,originY);
 }
 function motion(c,minute,weather,reduced,preset){
  if(!surface||!visible)return;const t=reduced?0:minute*.018,limit=preset==='performance'?8:18;
  c.save();c.globalAlpha=.13;
  for(let i=0;i<Math.min(limit,waterMarks.length);i++){const p=waterMarks[i],q=(Math.sin(t+p.phase)+1)*.5;c.fillStyle='#9bc4c5';c.fillRect(Math.round(p.x+q*3),Math.round(p.y),Math.round(p.w*(.45+.45*q)),1)}
  if(!reduced){c.globalAlpha=weather==='wind'?.2:.1;c.fillStyle='#a6b69a';for(let i=0;i<Math.min(preset==='performance'?4:8,sway.length);i++){const p=sway[i];c.fillRect(Math.round(p.x+Math.sin(t*2+p.phase)*(weather==='wind'?2:1)),Math.round(p.y-4),1,1)}}c.restore();
 }
 return{ground,motion,ready:()=>atlas.complete&&atlas.naturalWidth>0,diagnostics:()=>({bakes,lastBakeMs,maxBakeMs,phases,pixels:surface?SIZE*SIZE:0,latticeSamples:COLS*COLS,plants:plantCount,clusters:clusterCount,trackSegments:trackCount,waterMarks:waterMarks.length,sway:sway.length,atlasReady:atlas.complete&&atlas.naturalWidth>0})};
})();
