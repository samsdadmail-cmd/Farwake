// Composition checkpoint A. A view over real colony state, with no save fields.
// Resident artwork is deliberately deferred until Kyle and Atlas approve framing.
window.FarwakeHomeVisit = (() => {
  'use strict';
  const DUR={approach:.7,cover:.28,reveal:.46,close:.28,restore:.6};
  let api,phase='idle',buildingId=null,saved=null,door=null,fromCam=null,phaseT=0,revealed=0;
  let root,canvas,veil,card,infoBtn,cache=null,cacheKey='',layoutNow=null,hits=[],manageAfterExit=null;
  let draws=0,lastNotes=-1;
  const images={day:null,night:null};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const smooth=t=>t*t*(3-2*t),clamp01=t=>Math.max(0,Math.min(1,t));
  const clock=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0');
  const durations=()=>api?.reduced()?{approach:0,cover:0,reveal:0,close:0,restore:0}:DUR;
  const building=()=>api.getState()?.buildings.find(b=>b.id===buildingId)||null;
  function sceneImage(kind){
    if(!images[kind]){const im=new Image();im.onload=()=>{cacheKey=''};im.src=new URL('assets/home-composition/'+kind+'.webp',document.baseURI).href;images[kind]=im}
    return images[kind];
  }
  function measure(){
    const w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;
    const quality=api.quality(),limit=quality==='performance'?1:quality==='cinematic'?2:1.5;
    const d=Math.min(devicePixelRatio||1,limit,Math.sqrt(1000000/(w*h)));
    // Portrait retains the whole authored composition. Landscape trims only
    // surplus sky/foreground; every part of the house remains inside the crop.
    const source=w>h?{x:0,y:345,w:768,h:615}:{x:0,y:0,w:768,h:1152};
    const scale=Math.min(w/source.w,h/source.h);
    const dw=source.w*scale,dh=source.h*scale;
    return{w,h,d,pw:Math.round(w*d),ph:Math.round(h*d),source,x:(w-dw)/2,y:(h-dh)*.4,dw,dh};
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
    const bg=c.createLinearGradient(0,0,0,L.h);
    bg.addColorStop(0,light.night?'#0c1b2d':'#8ba6bb');bg.addColorStop(.6,light.night?'#132b36':'#8d9a96');bg.addColorStop(1,light.night?'#10212b':'#546b6c');
    c.fillStyle=bg;c.fillRect(0,0,L.w,L.h);
    // Pixel-art is never stretched independently along either axis.
    c.save();
    const r=L.source;c.drawImage(im,r.x,r.y,r.w,r.h,L.x,L.y,L.dw,L.dh);c.restore();
    // Canvas filters are inconsistently supported in mobile WebKit. A simple
    // composited wash keeps empty and sleeping homes dark in both engines.
    const dim=light.night&&['empty','unpowered'].includes(light.mode)?.75:light.mode==='sleeping'?.44:0;
    if(dim){c.fillStyle='rgba(3,10,18,'+dim+')';c.fillRect(L.x,L.y,L.dw,L.dh)}
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
    const key=[L.pw,L.ph,light.mode,weather].join(':');
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
    sceneImage('day');sceneImage('night');layoutNow=null;cacheKey='';refreshNotes();
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
    window.addEventListener('resize',()=>{layoutNow=null;cacheKey=''});
    window.visualViewport?.addEventListener('resize',()=>{layoutNow=null;cacheKey=''});
    infoBtn.addEventListener('click', () => toggleCard());
    canvas.addEventListener('pointerdown', () => {
      if (!card.hidden) { card.hidden = true; infoBtn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && phase !== 'idle') { e.preventDefault();e.stopImmediatePropagation();exit(); }
    },true);
  }

  return {
    bind, enter, exit, frame, paint,
    phase: () => phase,
    ownsCamera: () => phase !== 'idle',
    diagnostics:()=>({phase,draws,lightMode:root?.dataset.lightMode,layout:layoutNow,cachePixels:cache?cache.width*cache.height:0,residentsRendered:0}),
    savedCamera: () => saved ? {x: saved.x, y: saved.y, z: saved.z} : null,
    // Present so CP2 can attach poses without a new shell. Empty until then.
    residents: () => hits
  };
})();

