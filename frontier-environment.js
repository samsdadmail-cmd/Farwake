// E3-A: a cached, data-bound ecological composition over the retained terrain.
// Native sprite atlas is an asset, not a scene plate. Water/building/save data are read only.
window.FarwakeEnvironment=(()=>{
 'use strict';
 const SIZE=704,HALF=SIZE/2,STEP=2;
 const atlas=new Image();atlas.src='assets/frontier-e3/flora-atlas.png';
 let revision=0;atlas.onload=()=>revision++;
 let mapRef=null,key='',surface=null,originX=0,originY=0,waterMarks=[],sway=[],bakes=0,bakeMs=0,lastBakeMs=0;
 const hash=(x,y,s=0)=>{let n=Math.imul(x^s,1597334677)^Math.imul(y,3812015801);n=Math.imul(n^n>>>16,2246822519);return((n^n>>>13)>>>0)/4294967296};
 function noise(x,y,scale,s=0){x/=scale;y/=scale;const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return(hash(a,b,s)*(1-u)+hash(a+1,b,s)*u)*(1-v)+(hash(a,b+1,s)*(1-u)+hash(a+1,b+1,s)*u)*v}
 const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 function make(){const c=document.createElement('canvas');c.width=c.height=SIZE;return c}
 function bake(map,width,height,home,members,stamp,state,features){
  const start=performance.now();originX=Math.floor((home.x+home.w/2)*32-HALF+48);originY=Math.floor((home.y+home.h/2)*32-HALF+32);
  const out=make(),c=out.getContext('2d');c.imageSmoothingEnabled=false;
  const get=(x,y)=>x>=0&&y>=0&&x<width&&y<height?map[y*width+x]:null;
  const wet=(x,y)=>get(x,y)?.kind==='water'?1:0;
  // Interpolation rounds grid corners but preserves every tile-centre's land/water identity.
  function water(x,y){x=x/32-.5;y=y/32-.5;const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;return(wet(a,b)*(1-u)+wet(a+1,b)*u)*(1-v)+(wet(a,b+1)*(1-u)+wet(a+1,b+1)*u)*v}
  const landDistance=new Float32Array(width*height).fill(99);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!wet(x,y))landDistance[y*width+x]=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x)landDistance[i]=Math.min(landDistance[i],landDistance[i-1]+1);if(y)landDistance[i]=Math.min(landDistance[i],landDistance[i-width]+1)}
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;if(x+1<width)landDistance[i]=Math.min(landDistance[i],landDistance[i+1]+1);if(y+1<height)landDistance[i]=Math.min(landDistance[i],landDistance[i+width]+1)}
  // Building influence is sampled on an 8px lattice once, avoiding E2's
  // per-ground-pixel scan of every building and repeated temporary arrays.
  const cols=SIZE/8+1,soil=new Float32Array(cols*cols);
  for(let y=0;y<cols;y++)for(let x=0;x<cols;x++){
   const wx=originX+x*8,wy=originY+y*8;let v=0;
   for(const b of members)v=Math.max(v,Math.max(0,1-Math.hypot((wx-(b.x+b.w/2)*32)/(b.w*20+20),(wy-(b.y+b.h*.85)*32)/(b.h*16+18))));soil[y*cols+x]=v;
  }
  const im=c.createImageData(SIZE,SIZE),D=im.data;
  for(let y=0;y<SIZE;y+=STEP)for(let x=0;x<SIZE;x+=STEP){
   const wx=originX+x,wy=originY+y,tx=Math.floor(wx/32),ty=Math.floor(wy/32),tile=get(tx,ty);if(!tile)continue;
   const edge=Math.hypot((x-HALF)/(HALF-6),(y-HALF)/(HALF-6)),alpha=Math.max(0,Math.min(1,(1-edge)*4));if(!alpha)continue;
   const broad=noise(wx,wy,150,28),patch=noise(wx,wy,53,91),fine=noise(wx,wy,14,73),wf=water(wx+(noise(wx,wy,28,3)-.5)*5,wy+(noise(wx,wy,29,7)-.5)*5);
   let r,g,b;
   if(wf>.5){const depth=Math.min(1,(landDistance[ty*width+tx]||0)/3),shine=(patch-.5)*9;r=31+depth*(-10)+shine;g=75+depth*(-24)+shine;b=83+depth*(-19)+shine;if(wf<.68){r+=13;g+=17;b+=12}}
   else{
    const moisture=tile.moisture??.5,stone=tile.kind==='stone'||(patch>.69&&fine>.53),lichen=Math.max(0,(noise(wx,wy,34,17)-.54)*2.5);
    if(stone){r=75+broad*17;g=94+broad*17;b=101+broad*19}
    else if(tile.kind==='sand'||wf>.18){r=91+broad*18;g=111+broad*14;b=103+broad*15}
    else{r=45+broad*20+lichen*24;g=77+broad*22+lichen*20;b=76+broad*22+lichen*4+(moisture-.5)*9}
    const i=(y>>3)*cols+(x>>3),u=(x%8)/8,v=(y%8)/8,s=(soil[i]*(1-u)+soil[i+1]*u)*(1-v)+(soil[i+cols]*(1-u)+soil[i+cols+1]*u)*v;
    r+=(100-r)*s*.47;g+=(99-g)*s*.47;b+=(82-b)*s*.47;
    // Quiet clustered 2px brush marks; grain is low-amplitude, never white static.
    const mark=(fine-.5)*6;r+=mark;g+=mark;b+=mark;
   }
   const at=(y*SIZE+x)*4;for(const off of [0,4,SIZE*4,SIZE*4+4]){D[at+off]=r;D[at+off+1]=g;D[at+off+2]=b;D[at+off+3]=alpha*255}
  }c.putImageData(im,0,0);
  const obstructed=(x,y)=>state.buildings.some(b=>b.type!=='path'&&b.type!=='road'&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
  const open=(x,y)=>get(x,y)&&!wet(x,y)&&!obstructed(x,y),segments=[];
  // The retained door network is sampled once for visual access ground, not routing.
  const first=FarwakeDoors.portalFor(home),root=first&&{x:Math.floor(first.streetX),y:Math.floor(first.streetY)};
  if(root&&open(root.x,root.y)){
   const queue=[root],visited=new Map([[root.x+','+root.y,null]]);
   for(let i=0;i<queue.length&&i<600;i++){const a=queue[i];for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=a.x+dx,y=a.y+dy,k=x+','+y;if(visited.has(k)||Math.abs((x+.5)*32-originX-HALF)>HALF-12||Math.abs((y+.5)*32-originY-HALF)>HALF-12||!open(x,y))continue;visited.set(k,a);queue.push({x,y})}}
   const used=new Set();c.lineCap='round';c.lineJoin='round';
   for(const b of members){if(!['shelter','cabin','sawmill','workshop','dining','camp'].includes(b.type))continue;const p=FarwakeDoors.portalFor(b);if(!p)continue;let a={x:Math.floor(p.streetX),y:Math.floor(p.streetY)},guard=0;if(!visited.has(a.x+','+a.y))continue;
    while(a&&guard++<120){const q=visited.get(a.x+','+a.y);if(!q)break;const id=[a.x+','+a.y,q.x+','+q.y].sort().join(':');if(!used.has(id)){used.add(id);segments.push({x:(a.x+.5)*32,y:(a.y+.5)*32,px:(q.x+.5)*32,py:(q.y+.5)*32})}a=q}
   }
   for(const s of segments){c.beginPath();c.moveTo(s.x-originX,s.y-originY);c.lineTo(s.px-originX,s.py-originY);c.strokeStyle='#7f81684a';c.lineWidth=15;c.stroke();c.strokeStyle='#aaa08350';c.lineWidth=7;c.stroke();c.strokeStyle='#beb08c20';c.lineWidth=2;c.stroke()}
  }
  const nearTrack=(wx,wy,r)=>segments.some(s=>{const dx=s.px-s.x,dy=s.py-s.y,t=Math.max(0,Math.min(1,((wx-s.x)*dx+(wy-s.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(wx-s.x-t*dx,wy-s.y-t*dy)<r});
  // Contact occlusion and soil shoulders are cached under real foundations.
  for(const b of members){
   const x=b.x*32-originX,y=b.y*32-originY,w=b.w*32,h=b.h*32;
   for(let i=3;i>0;i--){c.fillStyle=['','#102b3440','#173a3830','#344b3c18'][i];c.beginPath();c.ellipse(x+w*.5,y+h*.87,w*.48+i*3,5+i*3,0,0,Math.PI*2);c.fill()}
   const p=FarwakeDoors.portalFor(b);if(p){const xx=p.streetX*32-originX,yy=p.streetY*32-originY;if(open(Math.floor(p.streetX),Math.floor(p.streetY))){c.fillStyle='#b3a07f4a';c.beginPath();c.ellipse(xx,yy,15,7,0,0,Math.PI*2);c.fill();for(let j=0;j<8;j++)rect(c,xx-12+j*3,yy+hash(j,b.id,9)*4,2,1,'#71827b')}}
  }
  waterMarks=[];sway=[];
  function sprite(index,x,y,size,flat=1){if(!atlas.complete||!atlas.naturalWidth)return;const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/4;c.drawImage(atlas,Math.floor(index%4*cw),Math.floor(Math.floor(index/4)*ch),Math.floor(cw),Math.floor(ch),Math.round(x-size/2),Math.round(y-size*.74*flat),size,Math.round(size*flat))}
  for(let gy=0;gy<28;gy++)for(let gx=0;gx<28;gx++){
   const x=14+gx*25+hash(gx,gy,37)*19,y=14+gy*25+hash(gx,gy,53)*19,wx=originX+x,wy=originY+y,tx=Math.floor(wx/32),ty=Math.floor(wy/32),tile=get(tx,ty);if(!tile)continue;
   const edge=Math.hypot((x-HALF)/(HALF-28),(y-HALF)/(HALF-28));if(edge>1)continue;
   const v=hash(tx*7+gx,ty*11+gy,81),cluster=noise(wx,wy,76,66),wf=water(wx,wy);
   if(wf>.82){if(v<.17&&waterMarks.length<28)waterMarks.push({x:wx,y:wy,phase:v*20,w:5+v*15});continue}
   const clearance=members.some(b=>wx>b.x*32-15&&wx<(b.x+b.w)*32+15&&wy>b.y*32-9&&wy<(b.y+b.h)*32+17)||features?.some(f=>Math.hypot((f.x+.5)*32-wx,(f.y+.5)*32-wy)<24);if(clearance||nearTrack(wx,wy,16))continue;
   c.globalAlpha=Math.min(1,(1-edge)*6);
   if(wf>.15&&v<.7){sprite(12+Math.floor(v*5)%4,x,y,42+v*16);if(sway.length<16)sway.push({x:wx,y:wy,phase:v*15})}
   else if((tile.kind==='stone'||cluster>.67)&&v>.65){sprite(4+Math.floor(v*13)%4,x,y,46+v*21,.7)}
   else if(cluster>.4&&v<.74){const variant=Math.floor(v*31)%4;if(v<.32){sprite(variant,x,y,40+v*38);if(sway.length<16)sway.push({x:wx,y:wy,phase:v*17})}else sprite(8+variant,x,y,33+v*18,.8)}
   else if(v>.8){rect(c,x,y,4,1,'#8b9c87');rect(c,x+3,y-1,2,1,'#b2b99a')}
  }
  c.globalAlpha=1;mapRef=map;key=stamp+':'+revision;surface=out;bakes++;lastBakeMs=performance.now()-start;bakeMs=Math.max(bakeMs,lastBakeMs);
 }
 function ground(c,map,width,height,home,members,stamp,state,features,left,top,right,bottom){
  if(!home||!atlas.complete||!atlas.naturalWidth)return;
  const cx=(home.x+home.w/2)*32+48,cy=(home.y+home.h/2)*32+32;
  if(Number.isFinite(left)&&(right*32<cx-HALF||left*32>cx+HALF||bottom*32<cy-HALF||top*32>cy+HALF))return;
  if(map!==mapRef||!surface||key!==stamp+':'+revision)bake(map,width,height,home,members,stamp,state,features);
  c.drawImage(surface,originX,originY);
 }
 function motion(c,minute,weather,reduced,preset){
  if(!surface)return;const t=reduced?0:minute*.018,limit=preset==='performance'?10:22;
  c.save();c.globalAlpha=.17;
  for(let i=0;i<Math.min(limit,waterMarks.length);i++){const p=waterMarks[i],q=(Math.sin(t+p.phase)+1)*.5;c.fillStyle='#9bc4c5';c.fillRect(Math.round(p.x+q*3),Math.round(p.y),Math.round(p.w*(.45+.45*q)),1);c.fillStyle='#3f7d8b';c.fillRect(Math.round(p.x+2),Math.round(p.y+3),Math.round(p.w*.6),1)}
  if(!reduced){c.globalAlpha=weather==='wind'?.28:.13;c.fillStyle='#c2cfb3';for(let i=0;i<Math.min(preset==='performance'?4:10,sway.length);i++){const p=sway[i];c.fillRect(Math.round(p.x+Math.sin(t*2+p.phase)*(weather==='wind'?2:1)),Math.round(p.y-5),2,1)}}
  c.restore();
 }
 return{ground,motion,ready:()=>atlas.complete&&atlas.naturalWidth>0,diagnostics:()=>({bakes,lastBakeMs,maxBakeMs:bakeMs,pixels:surface?SIZE*SIZE:0,waterMarks:waterMarks.length,sway:sway.length,atlasReady:atlas.complete&&atlas.naturalWidth>0})};
})();
