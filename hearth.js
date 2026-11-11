// History details are derived from persistent counters. Only the small animated
// layer uses wall time. The caller supplies real occupancy and production state.
window.FarwakeHearth = (() => {
  'use strict';
  const plates = new Map();
  const tiers = new WeakMap();
  const shelterStacks = [[41,6],[16,6],[73,4],[13,7]];
  const shelterWindows = [
    [{x:10,y:40,w:12,h:5},{x:34,y:42,w:12,h:5},{x:71,y:42,w:10,h:5}],
    [{x:68,y:41,w:11,h:5},{x:39,y:40,w:10,h:5}],
    [{x:13,y:42,w:18,h:5}],
    [{x:17,y:41,w:12,h:5},{x:60,y:41,w:14,h:5}]
  ];
  const residential = new Set(['shelter', 'cabin', 'dormitory']);
  const heated = new Set(['shelter', 'cabin', 'dormitory', 'kitchen', 'smelter']);
  const industry = new Set(['workshop', 'sawmill', 'smelter', 'fabricator', 'drill']);
  const fields = new Set(['garden', 'greenhouse', 'pump']);
  let density = 1;

  function configure(preset) {
    density = preset === 'performance' ? .45 : preset === 'cinematic' ? 1.4 : 1;
  }
  function hash(value) {
    let n = Math.imul(value + 314159, 1597334677);
    n = Math.imul(n ^ n >>> 16, 2246822519);
    return ((n ^ n >>> 13) >>> 0) / 4294967296;
  }
  function box(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function historyTier(b) {
    const h = b.history || {};
    const lived=Math.min(3,Math.floor((h.residentHours||0)/12));
    const used=Math.min(3,Math.floor((h.work||0)/90));
    const cultivated=Math.min(3,Math.floor((h.harvests||0)/2));
    const street=Math.min(3,Math.floor((h.traffic||0)/24));
    const age=Math.min(3,Math.floor((h.ageDays||0)/14));
    const level=Math.max(1,Math.min(3,b.level||1));
    const previous=tiers.get(b);
    if(previous && previous.lived===lived && previous.used===used &&
      previous.cultivated===cultivated && previous.street===street &&
      previous.age===age && previous.level===level)return previous;
    const next={lived,used,cultivated,street,age,level};
    tiers.set(b,next);
    return next;
  }

  function historyPlate(b, tier) {
    const w = b.w * 32, h = b.h * 32;
    const key = [b.type, w, h, b.id % 4, tier.lived, tier.used,
      tier.cultivated, tier.street, tier.age, tier.level].join(':');
    if (plates.has(key)) return plates.get(key);
    const surface = document.createElement('canvas');
    surface.width = w; surface.height = h;
    const c = surface.getContext('2d');
    const id = Number(b.id) || 0;
    if (residential.has(b.type) && tier.lived) {
      // Personal care grows only after real use of this address.
      const side = hash(id) > .5 ? 8 : w - 12;
      box(c, side, h - 8, 5, 5, '#78593d');
      box(c, side - 1, h - 9, 7, 2, '#b18d5a');
      box(c, side + 1, h - 13, 3, 5, '#6e8d61');
      if (tier.lived > 1) {
        box(c, w - 20, h - 9, 12, 2, '#8a704d');
        box(c, w - 18, h - 7, 2, 4, '#514c3b');
        box(c, w - 12, h - 7, 2, 4, '#514c3b');
      }
      if (tier.lived > 2) {
        for (let i = 0; i < 3; i++) {
          box(c, 7 + i * 5, h - 5, 4, 2, '#697c51');
          box(c, 8 + i * 5, h - 7, 1, 2, i % 2 ? '#c49768' : '#c6b98b');
        }
      }
    }
    if (industry.has(b.type) && tier.used) {
      // Staging stays at the edge of the existing footprint.
      const x = w - 14, y = h - 8;
      box(c, x, y, 10, 5, '#585548');
      box(c, x + 1, y - 2, 8, 3, '#9b8766');
      box(c, x + 3, y - 2, 1, 6, '#d0b481');
      if (tier.used > 1) {
        box(c, 4, h - 10, 9, 2, '#69716a');
        box(c, 8, h - 13, 2, 5, '#b6b8a5');
      }
      if (tier.used > 2) {
        box(c, w - 29, h - 7, 10, 3, '#81725c');
        box(c, w - 27, h - 8, 6, 1, '#b5a582');
      }
    }
    if (fields.has(b.type) && tier.cultivated) {
      for (let i = 0; i < tier.cultivated + 2; i++) {
        const x = 4 + i * 5;
        box(c, x, h - 4, 4, 2, '#648457');
        box(c, x + 1, h - 6, 2, 3, '#95a56c');
      }
      if (tier.cultivated > 1) {
        box(c, w - 12, h - 9, 8, 5, '#5c5541');
        box(c, w - 11, h - 10, 6, 2, '#9d9268');
      }
    }
    if (['path', 'road'].includes(b.type) && tier.street) {
      for (let i = 0; i < tier.street * 3; i++) {
        const x = 8 + Math.floor(hash(id * 17 + i) * 15);
        const y = 6 + Math.floor(hash(id * 31 + i) * 20);
        box(c, x, y, 2, 1, '#7e78654d');
      }
    }
    if (tier.age && !['path', 'road', 'garden', 'lamppost'].includes(b.type)) {
      for (let i = 0; i < tier.age * 2; i++) {
        const x = 10 + hash(id * 9 + i) * Math.max(1, w - 22);
        box(c, x, 9 + i * 3, 3, 1, '#d5ceaa25');
      }
    }
    if (tier.level > 1 && !['path', 'road', 'lamppost'].includes(b.type)) {
      box(c, w - 20, 9, 11, 3, '#8b8e78');
      box(c, w - 19, 9, 8, 1, '#d0bf88');
      if (tier.level > 2) box(c, w - 22, 14, 14, 1, '#b7ad7a');
    }
    // Bounded cache, even for large settlements with many history milestones.
    if (plates.size >= 144) plates.delete(plates.keys().next().value);
    plates.set(key, surface);
    return surface;
  }
  function windows(b) {
    if (b.type === 'shelter') {
      const style = Math.abs(b.id || 0) % 4;
      return shelterWindows[style];
    }
    return window.FarwakeFrontierArt?.windows?.(b) || [];
  }
  function culled(c, x, y, w, h) {
    if (!c.getTransform || !c.canvas) return false;
    const t = c.getTransform();
    const left = t.a * x + t.c * y + t.e;
    const top = t.b * x + t.d * y + t.f;
    const width = Math.abs(t.a * w), height = Math.abs(t.d * h);
    return left + width < -55 || top + height < -65 ||
      left > c.canvas.width + 55 || top > c.canvas.height + 65;
  }
  function draw(c, b, time, minute, weather, door = {}, reduced = false) {
    if (!b?.finished) return;
    const x = b.x * 32, y = b.y * 32, w = b.w * 32, h = b.h * 32;
    if (culled(c, x, y, w, h)) return;
    const tier = historyTier(b), night = minute < 390 || minute > 1080;
    const people = Math.max(0, Math.floor(door.occupied || 0));
    const working = people > 0 && (door.actions || []).some(action => ['craft', 'farm', 'research'].includes(action));
    const heating = heated.has(b.type) && (residential.has(b.type) ? people > 0 && night : working);
    const t = reduced ? 0 : time * .001;
    const seed = hash(Number(b.id) || 0) * 11;
    c.save();c.translate(x,y);
    c.drawImage(historyPlate(b, tier),0,0);
    if (heating) {
      const stack = window.FarwakeFrontierArt?.chimney?.(b);
      const shelterStyle = Math.abs(b.id || 0) % 4;
      const cx=stack?.x ?? (b.type==='shelter' ? shelterStacks[shelterStyle][0] : Math.floor(w*.74));
      const cy=(stack?.y ?? (b.type==='shelter' ? shelterStacks[shelterStyle][1] : Math.floor(h*.16)-8))+8;
      if(!stack && !(b.type==='shelter' && shelterStyle===0)){
        box(c,cx-2,cy-7,5,8,'#4d4b43');
        box(c,cx-3,cy-8,7,2,'#a09b85');
      }
      const count = reduced ? 1 : Math.max(2, Math.round(4 * density));
      for (let i=0;i<count;i++) {
        const phase = reduced ? .2 : (t * .17 + i / count + seed) % 1;
        const drift = (weather === 'wind' ? 19 : weather === 'rain' ? 10 : 5) * phase;
        const sway = reduced ? 0 : Math.sin(t * .5 + seed + i) * 1.6;
        c.globalAlpha = (1 - phase) * .21;
        box(c,cx-2+drift+sway,cy-9-phase*24,4+Math.floor(phase*5),3+Math.floor(phase*3),'#c9c6b8');
      }
      c.globalAlpha = 1;
    }
    if (night && people > 0) {
      const panes = windows(b);
      const asleep = door.actions?.includes('rest');
      for (let i=0;i<Math.min(people,panes.length);i++) {
        const pane = panes[i];
        c.save();c.beginPath();c.rect(pane.x,pane.y,pane.w,pane.h);c.clip();
        if(asleep){c.globalAlpha=.35;box(c,pane.x,pane.y,pane.w,pane.h,'#785f37')}
        else if(!reduced){
          const curtain=Math.sin(t*.11+seed+i)>.96?2:1;
          c.globalAlpha=.3;box(c,pane.x,pane.y,curtain,pane.h,'#746c4c');
        }
        const shift = reduced || asleep ? .5 : .5 + .3 * Math.sin(t * .45 + seed + i * 2);
        const px = pane.x + 1 + shift * Math.max(1,pane.w-5);
        c.globalAlpha = asleep ? .32 : .46;
        box(c,px,pane.y+1,2,2,'#3b3933');
        box(c,px-1,pane.y+3,4,3,'#3b3933');
        c.restore();
      }
      const aperture = window.FarwakeBuildings?.entrance?.(b);
      if (aperture && door.openness > .05) {
        const alpha = Math.min(.19,door.openness*.19);
        c.fillStyle = 'rgba(255,194,104,'+alpha+')';
        c.beginPath();c.moveTo(aperture.x,aperture.y+aperture.h);
        c.lineTo(aperture.x+aperture.w,aperture.y+aperture.h);
        c.lineTo(aperture.x+aperture.w+5,aperture.y+aperture.h+7);
        c.lineTo(aperture.x-4,aperture.y+aperture.h+7);c.closePath();c.fill();
      }
    }
    if (weather === 'rain' && !['path','road','garden','solar','wind','lamppost','supplies'].includes(b.type)) {
      const count = reduced ? 0 : Math.max(1,Math.round(3*density));
      for (let i=0;i<count;i++) {
        const phase = (t * 1.1 + seed + i * .37) % 1;
        if (phase > .65) continue;
        const xx = 8 + hash((Number(b.id)||0)*13+i)*Math.max(1,w-17);
        c.globalAlpha = (1-phase) * .34;
        box(c,xx,h*.78+phase*5,1,2,'#bfd2c6');
        if (phase > .52) box(c,xx-1,h*.78+5,3,1,'#bfd2c6');
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  return {draw,configure,historyTier,clearCache(){plates.clear()}};
})();
