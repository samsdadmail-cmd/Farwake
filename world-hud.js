// Presentation only: read the existing witnessed moment, never create dialogue or memories.
window.FarwakeHUD = (() => {
 'use strict';
 const caption=document.getElementById('world-moment'),speaker=document.getElementById('world-speaker'),words=document.getElementById('world-words');
 let key='';
 // Layout changes, rather than frames, reserve room above the real context card.
 const inspector=document.getElementById('inspector'),app=document.getElementById('app');
 if(inspector&&app&&typeof ResizeObserver!=='undefined'){
  let last=-1;new ResizeObserver(entries=>{const height=Math.ceil(entries[0].contentRect.height);if(height!==last){app.style.setProperty('--inspect-height',height+'px');last=height;}}).observe(inspector);
 }

 function moment(c,s,width,height,sx,sy,zoom,active,pose,elapsed){
  if(!caption)return;
  const p=active&&s.colonists.find(p=>p.id===active.id),pos=p&&(pose?.(p)||p);
  const x=pos?sx(pos.x*32):-1,y=pos?sy(pos.y*32)-25*zoom:-1;
  const visible=!!p&&x>=7&&x<=width-7&&y>=48&&y<height-90&&active.until>elapsed;
  if(caption.hidden===visible)caption.hidden=!visible;
  if(!visible){key='';return;}
  const next=p.id+'|'+active.text;
  if(next!==key){speaker.textContent=p.name;words.textContent=active.text;key=next;}
  // A small locator keeps the voice attached to its actual resident without covering the scene.
  c.save();c.globalAlpha=Math.min(1,(active.until-elapsed)*4);c.strokeStyle='#e1e7d5';c.fillStyle='#152a32cc';c.lineWidth=1;
  c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(x,y+4);c.lineTo(x,y+8);c.stroke();c.restore();
 }
 return {moment};
})();
