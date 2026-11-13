// Composition checkpoint A. A view over real colony state, with no save fields.
// Resident artwork is deliberately deferred until Kyle and Atlas approve framing.
window.FarwakeHomeVisit = (() => {
  'use strict';
  const DUR={approach:.7,cover:.28,reveal:.46,close:.28,restore:.6};
  let api,phase='idle',buildingId=null,saved=null,door=null,fromCam=null,phaseT=0,revealed=0;
  let root,canvas,veil,card,infoBtn,cache=null,cacheKey='',layoutNow=null,hits=[],manageAfterExit=null;
  let draws=0,lastNotes=-1,view='home',panX=0,panY=0,dragging=null;
  const images={day:null,night:null};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const smooth=t=>t*t*(3-2*t),clamp01=t=>Math.max(0,Math.min(1,t));
  const clock=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0');
  const durations=()=>api?.reduced()?{approach:0,cover:0,reveal:0,close:0,restore:0}:DUR;
  const building=()=>api.getState()?.buildings.find(b=>b.id===buildingId)||null;
  function sceneImage(kind){
    if(!images[kind]){const im=new Image();im.onload=()=>{cacheKey=''};im.src=new URL('assets/home-composition/portrait-'+kind+'.webp',document.baseURI).href;images[kind]=im}
    return images[kind];
  }
  function measure(){
    const w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;
    const quality=api.quality(),limit=quality==='performance'?1:quality==='cinematic'?2:1.5;
    const d=Math.min(devicePixelRatio||1,limit,Math.sqrt(1000000/(w*h)));
    const landscape=w>h;
    // Portrait is a continuous authored scene. Cover can trim only surplus
    // sky/ground at shorter phone ratios; the complete house remains visible.
    const source=landscape?{x:0,y:580,w:768,h:570}:{x:0,y:0,w:768,h:1660};
    const fit=landscape?Math.min(w/source.w,(h-12)/source.h):Math.max(w/source.w,h/source.h);
    const scale=fit*(view==='room'?1.7:1),dw=source.w*scale,dh=source.h*scale;
    const rangeX=view==='room'?Math.max(0,(dw-w)/2):0;
    const rangeY=view==='room'&&landscape?Math.max(0,(dh-h)/2):0;
    panX=Math.max(-rangeX,Math.min(rangeX,panX));panY=Math.max(-rangeY,Math.min(rangeY,panY));
    const x=(w-dw)/2+panX,y=(h-dh)*.5+panY;
    const house={left:x+(16-source.x)/source.w*dw,right:x+(752-source.x)/source.w*dw,
      top:y+(610-source.y)/source.h*dh,bottom:y+(1130-source.y)/source.h*dh};
    return{w,h,d,pw:Math.round(w*d),ph:Math.round(h*d),source,x,y,dw,dh,view,rangeX,rangeY,house,landscape};
  }
  function invalidate(){layoutNow=null;cacheKey=''}
  function setView(next){
    view=next;panX=panY=0;dragging=null;invalidate();root.dataset.view=view;
    $('homeview').setAttribute('aria-pressed',String(view==='room'));
    $('homeview').setAttribute('aria-label',view==='room'?'Return to whole home':'Look closer at the room');
    $('homeviewlabel').textContent=view==='room'?'Whole home':'Look closer';
    $('homepan').hidden=view!=='room';
  }
  function coverImage(c,im,r,x,y,w,h){
    if(w<=0||h<=0)return;
    const scale=Math.max(w/r.w,h/r.h),sw=w/scale,sh=h/scale;
    c.drawImage(im,r.x+(r.w-sw)/2,r.y+(r.h-sh)/2,sw,sh,x,y,w,h);
  }
  function homePlate(c,im,L){
    // Only surplus sky/terrain edges feather into their corresponding scene
    // layers. The complete house is in the opaque middle; no furniture fades.
    const r=L.source,edge=24,steps=12,part=edge/steps,scale=L.dh/r.h;
    c.drawImage(im,r.x,r.y+edge,r.w,r.h-2*edge,L.x,L.y+edge*scale,L.dw,L.dh-2*edge*scale);
    for(let i=0;i<steps;i++){
      c.globalAlpha=(i+.5)/steps;
      c.drawImage(im,r.x,r.y+i*part,r.w,part,L.x,L.y+i*part*scale,L.dw,part*scale+.2);
      c.drawImage(im,r.x,r.y+r.h-(i+1)*part,r.w,part,L.x,L.y+L.dh-(i+1)*part*scale,L.dw,part*scale+.2);
    }
    c.globalAlpha=1;
  }
  function lightState(s,people){
    const night=api.isNight(),grid=api.grid();
    const powered=grid.supply>=grid.used;
    const awake=people.some(p=>p.task?.type!=='rest');
    return{night,powered,mode:!night?'daylight':!people.length?'empty':!powered?'unpowered':awake?'awake':'sleeping'};
  }
  function compose(L,light,weather){
    const kind=light.night&&['awake','sleeping'].includes(light.mode)?'night':'day';
    const im=sceneImage(kind);sceneImage(kind==='day'?'night':'day');
    if(!im.complete||!im.naturalWidth){root.dataset.loading='true';return false}
    delete root.dataset.loading;
    if(!cache)cache=document.createElement('canvas');
    if(cache.width!==L.pw||cache.height!==L.ph){cache.width=L.pw;cache.height=L.ph}
    const c=cache.getContext('2d',{alpha:false});c.setTransform(L.d,0,0,L.d,0,0);c.imageSmoothingEnabled=false;
    if(!L.landscape){
      const r=L.source;c.drawImage(im,r.x,r.y,r.w,r.h,L.x,L.y,L.dw,L.dh);
    }else{
      // Landscape keeps the complete house too. Wider exterior context comes
      // from sky and near-ground regions, uniformly scaled, never repeated.
      const seam=L.h*.52,blend=40,ground={x:0,y:1150,w:768,h:510};
      coverImage(c,im,{x:0,y:0,w:768,h:570},0,0,L.w,seam+blend);
      c.save();c.beginPath();c.rect(0,seam+blend,L.w,L.h);c.clip();
      coverImage(c,im,ground,0,seam,L.w,L.h-seam);c.restore();
      for(let i=0;i<10;i++){
        c.save();c.beginPath();c.rect(0,seam+i*blend/10,L.w,blend/10+.2);c.clip();c.globalAlpha=(i+.5)/10;
        coverImage(c,im,ground,0,seam,L.w,L.h-seam);c.restore();
      }
      homePlate(c,im,L);
    }
    // Portable shadow wash: mobile WebKit can silently ignore canvas filters.
    const dim=light.night&&['empty','unpowered'].includes(light.mode)?.75:light.mode==='sleeping'?.44:0;
    if(dim){c.fillStyle='rgba(3,10,18,'+dim+')';c.fillRect(0,0,L.w,L.h)}
    // These washes respond to actual weather; no invented chimney/working effects.
    if(['rain','storm'].includes(weather)){c.fillStyle=light.night?'#18344129':'#38577122';c.fillRect(0,0,L.w,L.h)}
    root.dataset.lightMode=light.mode;root.dataset.weather=weather;
    return true;
  }
  function refreshNotes(){
    const b=building();if(!b)return;const s=api.getState(),people=api.occupants(b),light=lightState(s,people);
    $('homecaption').textContent=api.homeName(b)+' · '+clock(s.minute);
    $('homestate').textContent=light.mode==='awake'?'A light at home':light.mode==='sleeping'?'The household is resting':light.mode==='empty'?'The house is quiet':light.mode==='unpowered'?'No spare power for lighting':'Daylight at home';
    if(!card.hidden){$('homewho').textContent=people.length?people.map(p=>p.name).join(', '):'Nobody is inside';$('homenow').textContent='Day '+s.day+' · '+clock(s.minute)+' · '+s.weather;}
  }
  function paint(now){
    if(!root||root.hidden)return;
    const L=layoutNow||(layoutNow=measure()),s=api.getState(),b=building();
    if(!b){if(!['close','restore'].includes(phase))exit();return}
    const people=api.occupants(b),light=lightState(s,people),weather=s.weather;
    const key=[L.pw,L.ph,view,L.x,L.y,light.mode,weather].join(':');
    if(key!==cacheKey&&compose(L,light,weather))cacheKey=key;
    if(canvas.width!==L.pw||canvas.height!==L.ph){canvas.width=L.pw;canvas.height=L.ph}
    const c=canvas.getContext('2d',{alpha:false});c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
    if(cache)c.drawImage(cache,0,0);else{c.fillStyle='#13252f';c.fillRect(0,0,L.pw,L.ph)}
    draws++;
    // No resident positions/hit targets exist before checkpoint B artwork.
    hits=[];
    const open=phase==='inside'?1:phase==='reveal'?revealed:phase==='close'?1-revealed:phase==='cover'?0:1;
    veil.style.opacity=String(1-open);
    canvas.style.clipPath=open>.98?'none':'circle('+(8+open*140).toFixed(1)+'% at 50% 55%)';
    if(now-lastNotes>1000){lastNotes=now;refreshNotes()}
  }
  function applyCam(cam) {
    api.getCamera().x = cam.x;
    api.getCamera().y = cam.y;
    api.getCamera().z = cam.z;
  }
  function copyCam() {
    return {x: api.getCamera().x, y: api.getCamera().y, z: api.getCamera().z};
  }
  function show(on) {
    root.hidden = !on;
    document.body.classList.toggle('in-home', on);
  }
  function setPhase(next) {
    phase = next;
    phaseT = 0;
    revealed = 0;
    if (root) root.dataset.phase = next;
  }

  function step(dt) {
    const d = durations();
    phaseT += dt;
    if (phase === 'approach') {
      const t = d.approach ? clamp01(phaseT / d.approach) : 1;
      const k = smooth(t);
      applyCam({
        x: fromCam.x + (door.x - fromCam.x) * k,
        y: fromCam.y + (door.y - fromCam.y) * k,
        z: fromCam.z + (door.z - fromCam.z) * k
      });
      if (t >= 1) { applyCam(door); setPhase('cover'); show(true); return true; }
      return false;
    }
    if (phase === 'cover') {
      const t = d.cover ? clamp01(phaseT / d.cover) : 1;
      revealed = t;
      if (t >= 1) { setPhase('reveal'); return true; }
      return false;
    }
    if (phase === 'reveal') {
      const t = d.reveal ? clamp01(phaseT / d.reveal) : 1;
      revealed = t;
      if (t >= 1) { setPhase('inside'); revealed = 1; return false; }
      return false;
    }
    if (phase === 'close') {
      const t = d.close ? clamp01(phaseT / d.close) : 1;
      revealed = t;
      if (t >= 1) {
        fromCam = copyCam();
        setPhase('restore');
        show(false);
        return true;
      }
      return false;
    }
    if (phase === 'restore') {
      const t = d.restore ? clamp01(phaseT / d.restore) : 1;
      const k = smooth(t);
      applyCam({
        x: fromCam.x + (saved.x - fromCam.x) * k,
        y: fromCam.y + (saved.y - fromCam.y) * k,
        z: fromCam.z + (saved.z - fromCam.z) * k
      });
      if (t >= 1) {
        applyCam(saved);
        buildingId = null;
        setPhase('idle');
        if(manageAfterExit!=null){const id=manageAfterExit;manageAfterExit=null;api.manage(id)}
        card.hidden = true;
        if (infoBtn) infoBtn.setAttribute('aria-expanded', 'false');
        return false;
      }
      return false;
    }
    return false;
  }

  function frame(dt) {
    if (phase === 'idle') return false;
    let guard = 0;
    while (step(dt) && ++guard < 8) dt = 0;
    const active = phase === 'cover' || phase === 'reveal' || phase === 'inside' || phase === 'close';
    return active;
  }

  function enter(id) {
    if (!api || phase !== 'idle') return false;
    const s = api.getState();
    const b = s && s.buildings.find(item => item.id === +id);
    if (!b || !b.finished || b.type!=='shelter' || b.editOrder) return false;
    const port = api.portal(b);
    if (!port) return false;
    buildingId = b.id;
    saved = copyCam();
    fromCam = copyCam();
    const TS = 32;
    door = {x: port.x * TS, y: (port.y - 0.05) * TS, z: Math.min(2.2, 2.05)};
    card.hidden = true;
    if (infoBtn) infoBtn.setAttribute('aria-expanded', 'false');
    setView('home');sceneImage('day');sceneImage('night');invalidate();refreshNotes();
    setPhase('approach');
    if (api.closeSheet) api.closeSheet();
    return true;
  }

  function exit() {
    if (phase === 'idle' || phase === 'restore') return false;
    if (phase === 'approach') {
      fromCam = copyCam();
      setPhase('restore');
      show(false);
      return true;
    }
    fromCam = copyCam();
    setPhase('close');
    show(true);
    return true;
  }

  function toggleCard(){
    card.hidden=!card.hidden;infoBtn.setAttribute('aria-expanded',String(!card.hidden));refreshNotes();
  }

  function bind(next) {
    api = next;
    root = $('homevisit');
    canvas = $('homecanvas');
    veil = $('homeveil');
    card = $('homecard');
    infoBtn = $('homeinfo');
    $('homeexit').addEventListener('click', () => exit());
    $('homemanage').addEventListener('click',()=>{manageAfterExit=buildingId;exit()});
    window.addEventListener('resize',invalidate);
    window.visualViewport?.addEventListener('resize',invalidate);
    $('homeview').addEventListener('click',()=>setView(view==='home'?'room':'home'));
    infoBtn.addEventListener('click', () => toggleCard());
    canvas.addEventListener('pointerdown',e=>{
      if(!card.hidden){card.hidden=true;infoBtn.setAttribute('aria-expanded','false')}
      if(view!=='room'||phase!=='inside')return;
      dragging={id:e.pointerId,x:e.clientX,y:e.clientY,px:panX,py:panY};
      canvas.setPointerCapture(e.pointerId);e.preventDefault();
    });
    canvas.addEventListener('pointermove',e=>{
      if(!dragging||dragging.id!==e.pointerId)return;
      panX=dragging.px+e.clientX-dragging.x;panY=dragging.py+e.clientY-dragging.y;invalidate();e.preventDefault();
    });
    const stopDrag=e=>{if(dragging?.id===e.pointerId){dragging=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}};
    canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);
    document.addEventListener('keydown', e => {
      if(phase==='inside'&&view==='room'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
        e.preventDefault();e.stopImmediatePropagation();panX+=e.key==='ArrowLeft'?32:e.key==='ArrowRight'?-32:0;panY+=e.key==='ArrowUp'?32:e.key==='ArrowDown'?-32:0;invalidate();return;
      }
      if (e.key === 'Escape' && phase !== 'idle') { e.preventDefault();e.stopImmediatePropagation();exit(); }
    },true);
  }

  return {
    bind, enter, exit, frame, paint,
    phase: () => phase,
    ownsCamera: () => phase !== 'idle',
    diagnostics:()=>({phase,draws,lightMode:root?.dataset.lightMode,layout:layoutNow,view,panX,panY,cachePixels:cache?cache.width*cache.height:0,residentsRendered:0}),
    savedCamera: () => saved ? {x: saved.x, y: saved.y, z: saved.z} : null,
    // Present so CP2 can attach poses without a new shell. Empty until then.
    residents: () => hits
  };
})();

