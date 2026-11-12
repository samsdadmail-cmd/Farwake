// Full-screen home visit. A view over the running simulation: it never writes
// the save, never invents occupants, and gives the exterior camera back exactly.
// Resident poses are intentionally not drawn yet (visual checkpoint 1 is the room).
window.FarwakeHomeVisit = (() => {
  'use strict';
  const PLATE_W = 768, PLATE_H = 432, PLATE_TOP = 8, PLATE_BOTTOM = 422;
  // Living-room heart: window, both chairs, table. Portrait crops toward this.
  const FOCUS_X = 368, FOCUS_Y = 250;
  const DUR = {approach: 0.7, cover: 0.28, reveal: 0.46, close: 0.28, restore: 0.6};

  let api = null;
  let phase = 'idle';
  let buildingId = null;
  let saved = null;
  let door = null;
  let fromCam = null;
  let phaseT = 0;
  let revealed = 0;
  let root, canvas, veil, card, infoBtn;
  let plate = null;
  let cache = null;
  let cacheKey = '';
  let layoutNow = null;
  let hits = [];

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function clock(minute) {
    const h = Math.floor(minute / 60) % 24, m = Math.floor(minute % 60);
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  }
  function durations() {
    if (api && api.reduced()) return {approach:0, cover:0, reveal:0, close:0, restore:0};
    return DUR;
  }
  function building() {
    const s = api.getState();
    return s && s.buildings.find(b => b.id === buildingId) || null;
  }
  function plateImage() {
    if (!plate) {
      plate = new Image();
      plate.src = new URL('interior-home.webp', document.baseURI).href;
    }
    return plate;
  }

  // Integer device pixels per source pixel. Portrait keeps the plate tall
  // enough to dominate the phone and wide enough to hold both chairs.
  function measure(cssW, cssH, dpr) {
    const portrait = cssH >= cssW;
    const deviceW = Math.max(1, Math.round(cssW * dpr));
    const deviceH = Math.max(1, Math.round(cssH * dpr));
    let S;
    if (portrait) {
      const byWidth = Math.floor(deviceW / 280);
      const byHeight = Math.floor(cssH * 0.9 * dpr / PLATE_H);
      S = Math.max(1, Math.min(6, byWidth, byHeight));
    } else {
      S = Math.max(1, Math.min(4, Math.floor(deviceW / PLATE_W) || 1));
    }
    const visW = deviceW / S, visH = deviceH / S;
    let originX = FOCUS_X - visW / 2;
    if (visW >= PLATE_W) originX = (PLATE_W - visW) / 2;
    else originX = Math.max(0, Math.min(PLATE_W - visW, originX));
    let originY;
    if (visH >= PLATE_BOTTOM - PLATE_TOP) {
      const spare = visH - (PLATE_BOTTOM - PLATE_TOP);
      originY = PLATE_TOP - Math.min(36, Math.round(spare * 0.14));
    } else {
      originY = Math.max(0, Math.min(PLATE_H - visH, FOCUS_Y - visH * 0.42));
    }
    return {
      S, deviceW, deviceH, visW, visH,
      originX: Math.round(originX), originY: Math.round(originY), portrait
    };
  }

  function viewSize() {
    const r = root.getBoundingClientRect();
    const cssW = r.width || window.innerWidth;
    const cssH = r.height || window.innerHeight;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    return measure(cssW, cssH, dpr);
  }

  function fillBand(ctx, img, srcY, srcH, destY, destH) {
    if (destH <= 0 || !img.complete || !img.naturalWidth) return;
    for (let y = 0; y < destH; y++) {
      const sy = srcY + (y % srcH);
      ctx.drawImage(img, 0, sy, PLATE_W, 1, 0, destY + y, PLATE_W, 1);
    }
  }

  // The near floor is the aisle planks, mirrored so the rug pattern is not cloned.
  function fillFloor(ctx, img, destY, destH) {
    if (destH <= 0) return;
    const sw = 72, sh = 44, sx = 688, sy = 374;
    for (let ty = 0; ty < destH; ty += sh) {
      const h = Math.min(sh, destH - ty);
      let flip = (ty / sh) % 2 === 1;
      for (let tx = 0; tx < PLATE_W; tx += sw) {
        const w = Math.min(sw, PLATE_W - tx);
        ctx.save();
        if (flip) {
          ctx.translate(tx + w, destY + ty);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
        } else ctx.drawImage(img, sx, sy, w, h, tx, destY + ty, w, h);
        ctx.restore();
        flip = !flip;
      }
    }
  }

  // Recolour only the glass. Frame, plants and pots stay on the plate.
  function dayGlass(ctx, img) {
    const x0 = 170, y0 = 96, w = 450, h = 86;
    const scratch = document.createElement('canvas');
    scratch.width = w; scratch.height = h;
    const g = scratch.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    const image = g.getImageData(0, 0, w, h);
    const d = image.data;
    const sunX = 312, sunY = 30, sunR = 15;
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const skyR = t < 0.62 ? 118 + t * 40 : 186;
      const skyG = t < 0.62 ? 168 + t * 20 : 176;
      const skyB = t < 0.62 ? 198 - t * 30 : 132;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        if (!(b > r + 8 && b > 40 && r < 175)) continue;
        const lum = (r + gg + b) / 3;
        const dx = x - sunX, dy = y - sunY;
        if (dx * dx + dy * dy < sunR * sunR) {
          d[i] = 255; d[i + 1] = lum > 150 ? 236 : 206; d[i + 2] = lum > 150 ? 150 : 110;
        } else if (lum < 52) {
          d[i] = 78 + (x % 5); d[i + 1] = 96 + (y % 4); d[i + 2] = 108;
        } else {
          const n = ((x * 5 + y * 3) % 5) - 2;
          d[i] = Math.max(0, Math.min(255, skyR + n));
          d[i + 1] = Math.max(0, Math.min(255, skyG + n));
          d[i + 2] = Math.max(0, Math.min(255, skyB + n));
        }
      }
    }
    g.putImageData(image, 0, 0);
    ctx.drawImage(scratch, x0, y0);
  }

  function glow(ctx, x, y, r, inner) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function compose(key, L, night, weather, awake) {
    const img = plateImage();
    if (!cache) cache = document.createElement('canvas');
    cache.width = L.deviceW;
    cache.height = L.deviceH;
    const ctx = cache.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(L.S, 0, 0, L.S, 0, 0);
    ctx.translate(-L.originX, -L.originY);
    ctx.fillStyle = '#24160f';
    ctx.fillRect(L.originX - 2, L.originY - 2, L.visW + 4, L.visH + 4);
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, 0, PLATE_TOP, PLATE_W, PLATE_BOTTOM - PLATE_TOP, 0, PLATE_TOP, PLATE_W, PLATE_BOTTOM - PLATE_TOP);
      const ceilingH = Math.max(0, PLATE_TOP - L.originY);
      if (ceilingH) fillBand(ctx, img, 10, 18, L.originY, ceilingH + 2);
      const floorY = PLATE_BOTTOM;
      const floorH = Math.max(0, (L.originY + L.visH) - floorY);
      fillFloor(ctx, img, floorY, floorH);
      if (floorH > 8) {
        const shade = ctx.createLinearGradient(0, floorY, 0, floorY + floorH);
        shade.addColorStop(0, 'rgba(0,0,0,0)');
        shade.addColorStop(1, 'rgba(8,4,2,.42)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, floorY, PLATE_W, floorH);
      }
      if (!night) dayGlass(ctx, img);
    } else {
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(0, 0, PLATE_W, PLATE_H);
    }
    if (night) {
      ctx.fillStyle = 'rgba(10,18,32,.16)';
      ctx.fillRect(L.originX, L.originY, L.visW, L.visH);
      glow(ctx, 430, 210, 220, awake ? 'rgba(255,196,110,.38)' : 'rgba(226,176,96,.24)');
      glow(ctx, 360, 300, 160, awake ? 'rgba(255,170,80,.18)' : 'rgba(180,140,90,.1)');
    } else {
      glow(ctx, 390, 140, 240, 'rgba(214,228,214,.2)');
      glow(ctx, 400, 280, 180, 'rgba(255,214,160,.08)');
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const v = ctx.createRadialGradient(L.deviceW * .5, L.deviceH * .42, L.deviceW * .2, L.deviceW * .5, L.deviceH * .48, L.deviceW * .72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, night ? 'rgba(6,4,8,.55)' : 'rgba(18,16,12,.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, L.deviceW, L.deviceH);
    cacheKey = key;
    layoutNow = L;
  }

  function paint(now) {
    if (!root || root.hidden || !canvas) return;
    const L = viewSize();
    const night = !!(api && api.isNight());
    const state = api && api.getState();
    const weather = state ? state.weather : 'clear';
    const b = building();
    const people = b && api.occupants ? api.occupants(b) : [];
    const awake = people.some(p => p.task?.type !== 'rest');
    const key = [L.deviceW, L.deviceH, L.S, L.originX, L.originY, night ? 1 : 0, weather, awake ? 1 : 0].join(':');
    const img = plateImage();
    if (key !== cacheKey || (img.complete && cacheKey.indexOf('pending') >= 0)) compose(key, L, night, weather, awake);
    else if (!img.complete && cacheKey !== key + ':pending') compose(key + ':pending', L, night, weather, awake);
    const ctx = canvas.getContext('2d');
    if (canvas.width !== L.deviceW || canvas.height !== L.deviceH) {
      canvas.width = L.deviceW;
      canvas.height = L.deviceH;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (cache) ctx.drawImage(cache, 0, 0);
    if (night && !(api && api.reduced())) {
      const flick = 0.65 + 0.35 * Math.sin((now || 0) * 0.004);
      ctx.save();
      ctx.scale(L.S, L.S);
      ctx.translate(-L.originX, -L.originY);
      glow(ctx, 430, 210, 90, 'rgba(255,220,150,' + (0.05 * flick) + ')');
      ctx.restore();
    }
    // CP2 draws residents here, between the plate and a furniture-front stamp.
    hits = people.map(p => ({id: p.id, x: 0, y: 0}));
    const open = phase === 'inside' ? 1 : phase === 'reveal' ? revealed : phase === 'close' ? 1 - revealed : phase === 'cover' ? 0 : 1;
    veil.style.opacity = String(1 - open);
    const stage = canvas;
    if (open > 0.98) stage.style.clipPath = 'none';
    else stage.style.clipPath = 'circle(' + (8 + open * 140).toFixed(1) + '% at 50% 42%)';
  }

  function applyCam(cam) {
    api.camera.x = cam.x;
    api.camera.y = cam.y;
    api.camera.z = cam.z;
  }
  function copyCam() {
    return {x: api.camera.x, y: api.camera.y, z: api.camera.z};
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
    if (!b || !b.finished) return false;
    const port = api.portal(b);
    if (!port) return false;
    buildingId = b.id;
    saved = copyCam();
    fromCam = copyCam();
    const TS = 32;
    door = {x: port.x * TS, y: (port.y - 0.05) * TS, z: Math.min(2.2, 2.05)};
    card.hidden = true;
    if (infoBtn) infoBtn.setAttribute('aria-expanded', 'false');
    plateImage();
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

  function toggleCard() {
    const b = building();
    if (!b) return;
    if (!card.hidden) { card.hidden = true; infoBtn.setAttribute('aria-expanded', 'false'); return; }
    const s = api.getState();
    const people = api.occupants(b);
    const night = api.isNight();
    const who = people.length ? people.map(p => esc(p.name)).join(', ') : 'Nobody is home';
    card.innerHTML = '<p class="homekicker">THIS HOME</p><h2>' + esc(api.homeName(b)) + '</h2><p>Day ' + s.day + ' · ' + clock(s.minute) + ' · ' + (night ? 'Lamplight' : 'Daylight') + '</p><p>Inside now: ' + who + '</p>';
    card.hidden = false;
    infoBtn.setAttribute('aria-expanded', 'true');
  }

  function bind(next) {
    api = next;
    root = $('homevisit');
    canvas = $('homecanvas');
    veil = $('homeveil');
    card = $('homecard');
    infoBtn = $('homeinfo');
    $('homeexit').addEventListener('click', () => exit());
    infoBtn.addEventListener('click', () => toggleCard());
    canvas.addEventListener('pointerdown', () => {
      if (!card.hidden) { card.hidden = true; infoBtn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && phase !== 'idle') { e.stopPropagation(); exit(); }
    });
  }

  return {
    bind, enter, exit, frame, paint,
    phase: () => phase,
    ownsCamera: () => phase === 'approach' || phase === 'restore',
    savedCamera: () => saved ? {x: saved.x, y: saved.y, z: saved.z} : null,
    // Present so CP2 can attach poses without a new shell. Empty until then.
    residents: () => hits
  };
})();
