// Frontier architecture is cached at native world-pixel resolution. Every
// aperture below belongs to the drawing, so navigation and artwork agree.
window.FarwakeFrontierArt = (() => {
  'use strict';
  const sizes = {
    cabin:[96,64], dormitory:[128,96], greenhouse:[96,64], pump:[64,64],
    kitchen:[96,64], sawmill:[96,64], smelter:[96,64], fabricator:[96,64],
    wind:[64,64], accumulator:[64,64], dining:[128,96], recreation:[128,96],
    warehouse:[128,96], outpost:[96,64], drill:[96,96], observatory:[160,128],
    road:[32,32], lamppost:[32,32]
  };
  const entrances = {
    cabin:[43,43,10,13,'hinge'], dormitory:[57,72,14,15,'split'],
    greenhouse:[75,40,10,14,'slide'], kitchen:[19,42,12,14,'hinge'],
    sawmill:[51,39,28,16,'roller'], smelter:[57,40,23,15,'roller'],
    fabricator:[40,40,18,15,'split'], dining:[54,71,20,16,'split'],
    recreation:[55,71,18,16,'hinge'], warehouse:[47,68,34,19,'roller'],
    outpost:[39,41,12,14,'hinge'], observatory:[72,99,16,19,'split']
  };
  const palette = {
    ink:'#28332f', dark:'#384842', frame:'#5f7068', steel:'#92a49a',
    ivory:'#d8d0b2', timber:'#a87e55', beam:'#775238', brass:'#d5a46a',
    blue:'#4e747e', green:'#476c55', roof:'#a1694d', roofDark:'#704b3d'
  };
  const plates = new Map(), thumbnails = new Map(), masks = new Map();
  function entrance(b) {
    const a = entrances[b?.type];
    return a ? {x:a[0], y:a[1], w:a[2], h:a[3], kind:a[4]} : null;
  }
  function plate(type, occupiedNight=false, style=0, upgraded=false) {
    const key = [type,occupiedNight,style,upgraded].join(':');
    if (plates.has(key)) return plates.get(key);
    if (!sizes[type]) return null;
    const canvas = document.createElement('canvas');
    [canvas.width,canvas.height] = sizes[type];
    const c = canvas.getContext('2d'), p = palette;
    const glass = occupiedNight ? '#e9bb71' : '#588582';
    const shine = occupiedNight ? '#ffe4a2' : '#a2c0ae';
    function box(x,y,w,h,color) { c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),w,h); }
    function polygon(color,points) {
      const minimum=Math.floor(Math.min(...points.map(q=>q[1]))), maximum=Math.ceil(Math.max(...points.map(q=>q[1])));
      for(let y=minimum;y<maximum;y++) {
        const intersections=[];
        for(let i=0;i<points.length;i++) {
          const [x1,y1]=points[i], [x2,y2]=points[(i+1)%points.length];
          if((y+.5>=y1)!==(y+.5>=y2))intersections.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));
        }
        intersections.sort((a,b)=>a-b);
        for(let i=0;i+1<intersections.length;i+=2)box(Math.round(intersections[i]),y,Math.round(intersections[i+1])-Math.round(intersections[i]),1,color);
      }
    }
    function rivets(x,y,w) { for(let i=0;i<w;i+=11)box(x+i,y,1,1,p.ivory); }
    function windowBay(x,y,w=13,h=7) {
      box(x-1,y-1,w+2,h+3,p.ink); box(x,y,w,h,glass); box(x+1,y,w-2,1,shine);
      box(x+Math.floor(w/2),y,1,h,p.frame);box(x-2,y+h+1,w+4,2,p.steel);
    }
    function door(type) {
      const a=entrances[type];if(!a)return;
      const [x,y,w,h]=a;
      box(x-2,y-2,w+4,h+3,p.frame);box(x,y,w,h,p.ink);box(x+1,y+1,w-2,h-2,p.timber);
      box(x+2,y+2,w-4,3,glass);box(x+w-3,y+h-5,1,2,p.brass);
      box(x-3,y+h,w+6,2,p.ivory);box(x-5,y+h+2,w+10,2,p.dark);
      if(a[4]==='roller')for(let yy=2;yy<h;yy+=3)box(x+1,y+yy,w-2,1,p.frame);
    }
    function wall(x,y,w,h,color=p.ivory) {
      box(x+2,y+4,w,h,'#17282355');box(x,y,w,h,p.ink);box(x+2,y+2,w-4,h-4,color);
      box(x+2,y+h-5,w-4,3,p.frame);
      for(let i=8;i<w-5;i+=16)box(x+i,y+2,1,h-7,'#58665a55');
    }
    function roof(x,y,w,h,color=p.roof) {
      polygon(p.ink,[[x,y+6],[x+6,y],[x+w-7,y],[x+w,y+6],[x+w,y+h],[x,y+h]]);
      polygon(color,[[x+2,y+6],[x+7,y+2],[x+w-8,y+2],[x+w-2,y+6],[x+w-2,y+h-3],[x+2,y+h-3]]);
      box(x+7,y+3,w-14,2,p.ivory);box(x+3,y+h-5,w-6,3,p.roofDark);
      for(let i=12;i<w-8;i+=12)box(x+i,y+4,1,h-9,'#d2b99a66');
      box(x+2,y+h-1,w-4,2,p.steel);
    }
    function vent(x,y,w=15) {
      box(x+2,y+2,w,8,'#17282366');box(x,y,w,8,p.ink);box(x+1,y+1,w-2,1,p.steel);
      for(let i=3;i<w-2;i+=3)box(x+i,y+3,1,4,p.frame);
    }
    function crate(x,y,w=12,h=10) {
      box(x,y,w,h,p.ink);box(x+1,y+1,w-2,h-2,p.timber);box(x+1,y+1,w-2,2,'#d0af80');
      box(x+2,y+1,1,h-2,p.beam);box(x+w-3,y+1,1,h-2,p.beam);box(x+4,y+h-4,w-8,1,p.ivory);
    }
    function pipe(x,y,w=17,h=7) {
      box(x,y,w,h,p.ink);box(x+1,y+1,w-2,h-2,p.steel);box(x+2,y+1,w-4,1,p.ivory);
      box(x+3,y-1,2,h+2,p.frame);box(x+w-5,y-1,2,h+2,p.frame);
    }
    function tank(x,y,w=16,h=26,color=p.steel) {
      polygon(p.ink,[[x+3,y],[x+w-3,y],[x+w,y+4],[x+w,y+h-3],[x+w-4,y+h],[x+3,y+h],[x,y+h-4],[x,y+4]]);
      box(x+2,y+4,w-4,h-8,color);box(x+4,y+2,w-8,3,p.ivory);box(x+3,y+h-6,w-6,3,p.frame);
      box(x+3,y+7,2,h-15,'#d5d4ad77');
    }
    function plant(x,y) {
      box(x+2,y+3,6,5,p.beam);box(x+1,y+2,8,2,p.timber);
      box(x+4,y-4,2,7,p.green);box(x,y-3,5,3,'#8a9e67');box(x+5,y-5,5,3,'#b1b276');
    }
    function chimney(x,y,h=13) {
      box(x,y,7,h,p.ink);box(x+1,y+1,5,h-2,p.frame);box(x+1,y+2,2,h-5,p.steel);
      box(x-1,y-1,9,3,p.ink);box(x,y-1,7,1,p.ivory);
    }
    function ground(x,y,w,h) {
      box(x+3,y+3,w,h,'#182c293c');box(x,y,w,h,'#626d5266');
      box(x+2,y+1,w-4,1,'#aaa17b55');
    }
    const variantRoofs=['#a36a4e','#788371','#5c7a78','#9b865d'];
    switch(type) {
      case 'cabin':
        ground(5,9,86,51);wall(10,21,76,35,'#c7bea0');
        roof(7,9,82,33,variantRoofs[style]);
        box(35,46,28,12,p.beam);box(34,46,29,2,'#b59b71');
        windowBay(17,44,15);windowBay(65,44,14);door(type);
        chimney(73,4,16);plant(18,52);crate(77,51,10,8);
        if(style%2)box(7,45,4,14,p.timber);else box(83,45,4,14,p.timber);
        break;
      case 'dormitory':
        ground(5,10,118,82);wall(11,22,107,64,'#b1b6a2');
        roof(7,9,115,37,'#627a76');roof(18,48,91,22,'#8a8a6a');
        for(const x of [18,42,75,99])windowBay(x,49,13,8);
        for(const x of [19,42,80,101])windowBay(x,73,11,7);
        box(48,74,32,17,p.beam);door(type);chimney(105,4,15);vent(22,18,27);plant(15,82);plant(102,82);
        break;
      case 'greenhouse':
        ground(4,11,88,48);wall(7,20,82,34,'#9baf99');
        polygon(p.ink,[[7,41],[7,20],[18,7],[77,7],[89,20],[89,41]]);
        polygon('#597f76',[[10,38],[10,21],[20,10],[75,10],[86,21],[86,38]]);
        polygon('#a8c0a0',[[12,20],[21,12],[74,12],[83,20]]);
        for(let y=23;y<38;y+=6)for(let x=15;x<75;x+=8){box(x,y,5,3,'#6b985e');box(x+2,y-1,2,2,'#b0b477');}
        for(const x of [19,34,49,64,79]){box(x,11,2,28,p.steel);box(x,20,2,2,p.ivory);}
        box(9,20,78,2,p.frame);box(9,38,78,3,p.ivory);door(type);tank(3,39,13,20,'#73958d');
        break;
      case 'pump':
        ground(3,12,57,46);tank(8,10,26,38,'#779f9a');
        box(14,17,14,18,'#4d7a7c');box(15,18,12,2,'#b7d1ba');
        pipe(30,28,23,8);box(47,32,9,18,p.ink);box(49,33,5,15,p.steel);
        wall(35,40,24,16,'#a4aea1');vent(39,43,13);box(11,49,22,4,p.frame);box(9,54,26,2,p.ivory);
        break;
      case 'kitchen':
        ground(4,12,88,47);wall(9,24,78,32,'#d1c4a0');
        roof(6,10,84,31,'#9a7752');chimney(65,3,20);chimney(76,8,15);
        windowBay(38,44,20,8);windowBay(66,44,13,8);door(type);
        box(35,52,22,3,p.beam);box(37,55,2,6,p.frame);box(52,55,2,6,p.frame);crate(77,50,12,11);
        break;
      case 'sawmill':
        ground(3,8,90,51);wall(12,21,72,34,'#b7ad83');roof(8,8,80,29,'#77795c');
        for(let n=0;n<4;n++){box(3+n,38+n*4,34,4,p.beam);box(4+n,38+n*4,31,2,p.timber);box(34+n,38+n*4,4,4,'#d6b887');}
        box(39,41,12,17,p.frame);box(40,42,9,4,p.steel);
        polygon('#c4c9b4',[[41,41],[45,36],[49,41],[45,46]]);door(type);vent(63,17,16);crate(78,52,12,8);
        break;
      case 'smelter':
        ground(3,10,90,49);wall(9,22,78,34,'#869084');roof(6,12,84,25,'#586864');
        tank(12,20,27,29,'#9b7860');box(17,31,17,13,p.ink);box(19,33,13,9,'#9b523b');box(22,35,7,6,occupiedNight?'#ffd38c':'#c69356');
        chimney(19,2,23);chimney(39,8,21);pipe(36,31,20,7);door(type);crate(77,51,13,9);
        break;
      case 'fabricator':
        ground(3,9,90,50);wall(9,20,78,36,'#b3bcad');roof(6,9,84,30,'#587e81');
        box(11,12,23,19,p.frame);box(13,14,19,14,'#3f5d64');
        for(let i=0;i<3;i++){box(15+i*5,16,3,9,'#8aa9a5');box(15+i*5,16,3,2,p.ivory);}
        windowBay(15,44,14,7);windowBay(67,44,12,7);door(type);vent(56,18,22);crate(79,52,11,9);
        break;
      case 'wind':
        ground(9,46,48,13);box(24,30,15,27,p.frame);box(27,30,9,25,p.steel);box(29,35,3,17,p.ivory);
        box(22,18,19,14,p.ink);box(24,20,15,10,'#b0b6a6');box(27,22,10,3,p.ivory);
        polygon('#bac4ad',[[29,24],[25,6],[29,2],[33,22]]);
        polygon('#93a69b',[[30,25],[48,19],[58,22],[34,29]]);
        polygon('#d6d3b5',[[30,26],[23,43],[17,46],[27,24]]);
        box(28,23,6,6,p.ink);box(29,24,4,4,p.brass);box(39,48,14,8,p.ink);box(41,49,10,5,'#566e66');
        break;
      case 'accumulator':
        ground(4,9,56,48);box(8,45,48,11,p.frame);
        for(let i=0;i<3;i++){tank(7+i*17,12,16,37,'#6f9995');box(11+i*17,23,7,13,'#2f5258');box(12+i*17,24,5,4,'#98c6ac');}
        pipe(8,48,46,6);box(13,8,36,4,p.ink);box(15,8,32,2,p.brass);box(22,54,18,3,p.ivory);
        break;
      case 'dining':
        ground(4,11,120,80);wall(10,23,108,62,'#c9c2a1');roof(6,10,116,44,'#9a654d');
        roof(35,54,58,13,'#718477');for(const x of [18,38,78,98])windowBay(x,59,13,9);
        box(39,77,50,13,p.beam);box(41,78,46,2,p.timber);door(type);
        chimney(105,4,20);plant(17,82);plant(102,82);box(16,73,17,3,p.ivory);box(96,73,17,3,p.ivory);
        break;
      case 'recreation':
        ground(5,12,118,78);wall(13,28,102,57,'#b9c1a5');roof(8,14,112,36,'#687c64');
        polygon(p.frame,[[36,50],[43,41],[84,41],[92,50],[92,66],[36,66]]);
        box(39,51,50,12,'#6f9f94');for(const x of [48,61,74])box(x,50,2,14,p.steel);
        box(18,58,14,3,p.timber);box(97,58,14,3,p.timber);door(type);plant(17,81);plant(102,81);
        for(const x of [21,91]){box(x,73,15,3,p.timber);box(x+1,76,2,4,p.frame);box(x+12,76,2,4,p.frame);}
        break;
      case 'warehouse':
        ground(4,10,120,81);wall(10,20,108,66,'#9aa69a');roof(6,8,116,50,'#5b726d');
        box(11,53,106,4,p.steel);for(const x of [17,95])windowBay(x,60,14,7);door(type);
        for(const [x,y] of [[15,72],[28,76],[94,73],[105,77]])crate(x,y,12,10);
        vent(28,18,24);vent(76,18,24);box(43,87,43,3,p.frame);box(45,88,39,1,p.ivory);
        break;
      case 'outpost':
        ground(4,12,88,48);wall(12,25,72,29,'#c2c0a1');roof(8,14,80,26,'#8d805a');
        windowBay(18,43,14);windowBay(62,43,15);door(type);plant(17,54);crate(75,50,14,10);
        box(75,2,2,19,p.steel);box(65,6,22,2,p.ink);box(67,5,18,1,p.ivory);box(74,1,4,3,p.brass);
        tank(3,37,10,18,'#768b78');
        break;
      case 'drill':
        ground(5,13,86,77);box(11,66,75,18,p.frame);box(13,68,71,12,'#747d68');
        for(let i=0;i<4;i++)box(18+i*17,71,11,5,p.ink);
        polygon(p.ink,[[27,69],[38,10],[58,10],[71,69]]);polygon(p.steel,[[31,65],[41,13],[45,13],[35,65]]);polygon(p.frame,[[62,65],[54,13],[58,13],[67,65]]);
        for(let y=23;y<65;y+=12){box(37-(y-23)/8,y,26+(y-23)/4,3,p.steel);}
        box(45,18,7,50,p.ink);box(47,19,3,48,p.brass);box(35,5,25,9,p.frame);box(37,6,21,2,p.ivory);
        tank(68,39,17,28,'#8f9d8d');pipe(62,59,16,7);crate(10,81,16,10);box(77,80,9,9,p.ink);box(79,82,5,2,'#dfb979');
        break;
      case 'observatory':
        ground(7,18,146,105);wall(13,55,134,60,'#a9b6ab');roof(9,47,142,35,'#537b79');
        polygon(p.ink,[[29,55],[31,34],[42,18],[58,8],[101,8],[120,20],[130,38],[132,55]]);
        polygon('#a7b9b0',[[32,52],[34,35],[45,20],[60,11],[99,11],[117,23],[127,39],[129,52]]);
        polygon('#d2d2b4',[[35,37],[47,23],[61,14],[82,13],[81,52],[33,52]]);
        polygon('#668b89',[[80,12],[99,12],[115,24],[125,39],[127,52],[81,52]]);
        box(77,11,6,41,p.ink);box(79,12,2,39,p.frame);box(32,51,97,6,p.steel);box(36,55,89,3,p.ivory);
        for(const x of [22,44,99,122])windowBay(x,85,16,9);door(type);
        box(20,112,35,3,p.frame);box(109,112,35,3,p.frame);vent(20,64,26);vent(113,64,26);
        box(135,11,2,42,p.steel);box(129,13,14,2,p.ink);box(134,8,4,4,p.brass);
        break;
      case 'road':
        box(2,2,28,28,'#63736b');box(4,4,24,24,'#8d9a89');box(5,5,22,1,'#c5c9ae');
        for(let i=0;i<4;i++){box(4+i*6,4,1,24,'#748175');box(4,4+i*6,24,1,'#748175');}
        box(2,29,28,1,p.dark);break;
      case 'lamppost':
        ground(10,22,13,6);box(13,16,6,11,p.ink);box(15,10,2,15,p.steel);box(12,7,8,7,p.ink);box(13,8,6,5,occupiedNight?'#ffe3a1':'#c4c6a3');
        box(11,6,10,2,p.frame);box(12,14,8,1,p.brass);break;
    }
    if(upgraded&&type!=='road'&&type!=='lamppost') {
      box(canvas.width-20,canvas.height-12,10,6,p.ink);box(canvas.width-19,canvas.height-11,8,2,p.brass);
      box(canvas.width-17,canvas.height-8,4,1,p.ivory);
    }
    plates.set(key,canvas);return canvas;
  }
  function draw(c,type,x,y,w,h,night=false,b,door) {
    const occupied=!!door?.occupied;
    const lit=night&&(occupied||type==='lamppost');
    const style=Math.abs(b?.id||0)%4;
    const sprite=plate(type,lit,style,!!b?.tier&&b.tier>1);
    if(!sprite)return;
    c.save();c.imageSmoothingEnabled=false;c.drawImage(sprite,x,y,w,h);
    const port=entrance({type});
    if(port&&door?.openness>0) {
      c.translate(x,y);c.scale(w/sprite.width,h/sprite.height);
      const open=Math.min(1,Math.max(0,door.openness));
      c.fillStyle=lit?'#9b733e':'#243631';c.fillRect(port.x,port.y,port.w,port.h);
      c.fillStyle=port.kind==='hinge'?palette.timber:palette.steel;
      if(port.kind==='roller')c.fillRect(port.x,port.y,port.w,Math.ceil(port.h*(1-open)));
      else if(port.kind==='split') {
        const half=Math.ceil(port.w*(1-open)/2);
        c.fillRect(port.x,port.y,half,port.h);c.fillRect(port.x+port.w-half,port.y,half,port.h);
      } else c.fillRect(port.x,port.y,Math.ceil(port.w*(1-open)),port.h);
    }
    c.restore();
  }
  function shadow(c,type,x,y,w,h,minute,b) {
    if(!sizes[type]||type==='road'||type==='lamppost')return;
    const style=Math.abs(b?.id||0)%4,key=type+style;
    if(!masks.has(key)) {
      const sprite=plate(type,false,style), mask=document.createElement('canvas');
      mask.width=sprite.width;mask.height=sprite.height;
      const pen=mask.getContext('2d');pen.drawImage(sprite,0,0);pen.globalCompositeOperation='source-in';
      pen.fillStyle='#162624';pen.fillRect(0,0,mask.width,mask.height);masks.set(key,mask);
    }
    c.save();c.translate(x,y+h);c.transform(1,0,-Math.cos((minute-360)*Math.PI/720)*.34,.75,0,2);
    c.globalAlpha=.25;c.drawImage(masks.get(key),0,-h,w,h);c.restore();
  }
  function thumbnail(type) {
    if(!thumbnails.has(type)) {
      const sprite=plate(type,false);if(!sprite)return '';
      thumbnails.set(type,sprite.toDataURL());
    }
    return thumbnails.get(type);
  }
  function windows(b) {
    const rectangles={
      cabin:[[17,44,15,7],[65,44,14,7]],
      dormitory:[[18,49,13,8],[42,49,13,8],[75,49,13,8],[99,49,13,8],[19,73,11,7],[42,73,11,7],[80,73,11,7],[101,73,11,7]],
      kitchen:[[38,44,20,8],[66,44,13,8]],
      dining:[[18,59,13,9],[38,59,13,9],[78,59,13,9],[98,59,13,9]],
      recreation:[[39,51,50,12]],
      outpost:[[18,43,14,7],[62,43,15,7]],
      observatory:[[22,85,16,9],[44,85,16,9],[99,85,16,9],[122,85,16,9]]
    };
    return (rectangles[b?.type]||[]).map(([x,y,w,h])=>({x,y,w,h}));
  }
  function chimney(b) {
    return ({cabin:{x:76,y:3},dormitory:{x:108,y:3},kitchen:{x:68,y:2},smelter:{x:22,y:1}})[b?.type]||null;
  }
  return {draw,thumbnail,entrance,shadow,windows,chimney,get sizes(){return sizes}};
})();
