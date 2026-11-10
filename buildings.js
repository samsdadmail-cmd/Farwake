// Each structure is painted once at one pixel per world unit. The same plate is
// used by the map and the field catalogue, so proportions always agree.
window.FarwakeBuildings = (() => {
  const sizes = {shelter:[96,64], garden:[96,64], solar:[64,64], workshop:[96,64],
    shed:[96,64], path:[32,32], clinic:[96,64], comms:[64,64], battery:[64,64],
    lander:[96,96], supplies:[64,64], camp:[96,64]};
  const cache = new Map(), thumbnails = new Map();

  function plate(type, night) {
    const key = type + (night ? '.night' : '.day');
    if (cache.has(key)) return cache.get(key);
    const image = document.createElement('canvas');
    [image.width, image.height] = sizes[type];
    const pen = image.getContext('2d');
    const ink = '#2b302c', slate = '#495754', steel = '#899791', ivory = '#d3c9a8';
    const wood = '#996a46', darkWood = '#6f4e39', brass = '#d8a469';
    const glass = night ? '#ffbf62' : '#619490', gleam = night ? '#ffe4a0' : '#acccb7';
    function box(x,y,w,h,color) {
      pen.fillStyle = color;
      pen.fillRect(x,y,w,h);
    }
    // Scan-convert polygon silhouettes to integer pixels, even before zoom.
    function shape(color, ...points) {
      const ys = points.map(p => p[1]);
      for (let y=Math.min(...ys); y<Math.max(...ys); y++) {
        const cross = [];
        for (let i=0;i<points.length;i++) {
          const [x1,y1] = points[i], [x2,y2] = points[(i+1)%points.length];
          if ((y+.5>=y1)!==(y+.5>=y2)) cross.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));
        }
        cross.sort((a,b)=>a-b);
        for(let i=0;i+1<cross.length;i+=2) {
          const left=Math.round(cross[i]);
          box(left,y,Math.round(cross[i+1])-left,1,color);
        }
      }
    }
    function crate(x,y,w=13,h=10) {
      box(x+2,y+3,w,h,'#292c2766');box(x,y,w,h,ink);
      box(x+1,y+1,w-2,h-3,wood);box(x+1,y+1,w-2,2,'#c9a179');
      box(x+1,y+h-4,w-2,2,darkWood);
      for(const offset of [2,w-4])box(x+offset,y,2,h-1,slate);
      box(x+5,y+4,3,2,'#dfcc9c');
    }
    function windowBay(x,y,w=12) {
      box(x,y,w,8,ink);box(x+1,y+1,w-2,5,glass);
      box(x+2,y+1,w-4,1,gleam);box(x+Math.floor(w/2),y+1,1,6,slate);
      box(x-1,y+7,w+2,2,steel);
    }
    function hatch(x,y) {
      box(x-2,y-2,14,17,slate);box(x,y,10,15,ink);
      box(x+1,y+1,8,12,'#6c7770');box(x+2,y+2,6,4,glass);
      box(x+7,y+8,2,1,brass);box(x-2,y+14,14,2,steel);
      box(x-4,y+16,18,2,slate);
    }
    function vent(x,y,w) {
      box(x+1,y+2,w,8,'#433f3780');box(x,y,w,8,'#444c48');
      box(x,y,w,1,ivory);for(let i=2;i<w-1;i+=3)box(x+i,y+2,1,4,steel);
    }
    function grassPot(x,y) {
      box(x+2,y+2,6,5,darkWood);box(x+1,y+1,8,2,'#c58a5b');
      box(x+3,y-4,4,5,'#455e41');box(x,y-2,4,3,'#78955b');box(x+5,y-5,3,4,'#a0ac67');
    }
    // Timber walls, insulated shell, raised standing seams and drip edge.
    function cabin(x,y,w,h,colors) {
      const [lit,base,shadow]=colors, eave=y+h-15;
      box(x+6,y+9,w-3,h-4,'#252d2980');
      box(x+3,eave-2,w-6,16,ink);box(x+5,eave,w-10,12,wood);
      for(let i=2;i<12;i+=3)box(x+5,eave+i,w-10,1,darkWood);
      for(let i=6;i<w-6;i+=18)box(x+i,eave,2,13,'#4c4b40');
      shape(ink,[x,y+10],[x+7,y],[x+w-7,y],[x+w,y+8],[x+w,eave],[x+w-3,eave+3],[x+2,eave+3],[x,eave]);
      shape(base,[x+2,y+10],[x+8,y+2],[x+w-8,y+2],[x+w-2,y+9],[x+w-2,eave],[x+2,eave]);
      shape(lit,[x+2,y+10],[x+8,y+2],[x+w-8,y+2],[x+w-2,y+9],[x+w-2,y+11],[x+2,y+11]);
      box(x+2,y+11,w-4,2,shadow);
      for(let i=10;i<w-5;i+=12) {
        box(x+i,y+13,1,eave-y-13,shadow);
        box(x+i+1,y+13,1,eave-y-13,lit);box(x+i,y+4,1,6,base);
      }
      box(x+2,eave-2,w-4,2,shadow);box(x+2,eave,w-4,1,lit);
    }
    function tank(x,y,w,h) {
      shape(ink,[x,y+4],[x+4,y],[x+w-4,y],[x+w,y+4],[x+w,y+h-3],[x+w-4,y+h],[x+4,y+h],[x,y+h-3]);
      box(x+2,y+4,w-4,h-7,steel);box(x+4,y+2,w-8,3,ivory);
      box(x+w-6,y+5,4,h-9,slate);box(x+2,y+8,w-4,2,slate);
      box(x+2,y+h-8,w-4,2,slate);box(x+4,y+6,2,h-12,'#b4b9a5');
    }
    function photovoltaic(x,y,w,h) {
      box(x+1,y+3,w,h,ink);box(x,y,w,h,'#c8c1a3');box(x+2,y+2,w-4,h-4,'#304958');
      for(let col=2;col<w-3;col+=6)for(let row=2;row<h-3;row+=6){
        box(x+col,y+row,Math.min(5,w-2-col),Math.min(5,h-2-row),'#496c80');
        box(x+col,y+row,Math.min(5,w-2-col),1,'#85a5ad');
      }
    }

    switch(type) {
      case 'shelter':
        // Offset sleeping wing, main common room and sheltered entrance porch.
        cabin(4,18,29,34,['#c3b58f','#a89b7e','#7a7768']);
        windowBay(9,39,14);
        cabin(27,6,62,44,['#cf8760','#a96146','#844c3e']);
        vent(67,13,13);box(37,9,8,6,ink);box(38,7,6,6,slate);box(36,6,10,2,ivory);
        windowBay(33,41,14);windowBay(70,41,12);
        hatch(54,40);box(50,37,18,3,'#525a50');box(49,36,20,2,'#cfb68b');
        grassPot(43,51);grassPot(71,52);break;
      case 'workshop':
        cabin(4,10,70,41,['#a1aaa0','#718681','#4f6766']);
        vent(14,17,22);vent(41,17,12);
        box(13,37,32,15,ink);
        for(let i=0;i<5;i++)box(14,38+i*3,30,2,i<3?steel:slate);
        windowBay(53,40,13);tank(77,23,14,25);
        box(69,14,5,18,slate);box(67,12,9,3,ink);crate(55,51);break;
      case 'clinic':
        cabin(13,7,66,44,['#e2dbc1','#bcbda9','#929b8e']);
        hatch(42,40);windowBay(20,39,14);windowBay(58,39,13);
        box(37,18,20,11,'#ece2c6');box(45,19,4,9,'#ae614d');box(42,22,10,3,'#ae614d');
        tank(80,35,10,17);grassPot(31,52);break;
      case 'shed':
        cabin(7,9,62,43,['#b6a38c','#8d8272','#6e695f']);
        box(20,36,34,17,ink);box(21,37,31,4,wood);
        crate(23,43,12,10);crate(36,45,13,8);
        box(5,52,67,4,darkWood);box(5,52,67,1,brass);
        for(let i=0;i<3;i++){box(72,35+i*5,18,4,darkWood);box(72,35+i*5,16,2,wood);box(86,35+i*5,4,4,brass);}
        vent(40,15,13);break;
      case 'solar':
        for(const y of [7,33]) {
          box(15,y+10,4,17,slate);box(46,y+10,4,17,slate);
          box(12,y+25,9,2,ink);box(44,y+25,9,2,ink);
          photovoltaic(5,y,53,21);
        }break;
      case 'garden':
        for(let row=0;row<3;row++) {
          const y=6+row*18;
          box(6,y+2,72,14,ink);box(6,y,72,14,darkWood);box(7,y,70,2,'#c0986b');box(9,y+3,66,8,'#533f32');
          for(let i=0;i<9;i++){const x=11+i*7,dy=y+(i%3===0?3:4);
            box(x+1,dy+4,4,3,'#35503c');box(x-1,dy+1,4,3,'#6f8d54');
            box(x+2,dy-1,3,4,row===1?'#ad7768':'#a2b86d');box(x+4,dy+1,2,2,'#668756');}
        }
        tank(80,15,12,22);box(78,37,3,17,steel);break;
      case 'battery':
        box(4,13,55,39,ink);box(5,14,53,36,slate);
        for(let i=0;i<3;i++){tank(8+i*15,9,14,37);box(12+i*15,14,5,3,'#b8794e');}
        box(5,45,53,8,ink);for(let i=0;i<4;i++)box(9+i*5,47,3,2,'#9bb58a');
        box(44,45,10,8,brass);break;
      case 'comms':
        cabin(7,27,45,30,['#abae9a','#929888','#687874']);hatch(33,43);
        shape(ink,[18,44],[25,10],[29,10],[35,44],[30,44],[27,27],[23,44]);
        shape(steel,[19,39],[25,14],[28,14],[24,39]);box(20,31,11,2,brass);
        shape(slate,[12,7],[19,13],[34,18],[41,18],[35,23],[25,24],[17,19]);
        shape(ivory,[11,5],[18,8],[30,13],[41,15],[41,18],[34,18],[20,13],[12,9]);
        shape(steel,[22,14],[27,4],[29,3],[26,15]);box(27,2,4,3,brass);break;
      case 'path':
        for(const [x,y,w,h] of [[0,1,13,8],[15,0,17,9],[2,11,19,9],[23,11,9,9],[0,22,10,9],[12,22,20,9]]){
          box(x,y+1,w,h,'#635f52');box(x+1,y,w-2,h-2,'#a29c85');box(x+1,y,w-3,1,'#c2b69c');
        }break;
      case 'supplies':
        box(5,10,52,44,'#343b32');for(let i=0;i<8;i++)box(6+i*6,11,5,41,'#84745b');
        crate(10,12,21,15);crate(32,14,19,14);tank(9,31,10,18);crate(23,31,25,16);crate(44,43,15,12);break;
      case 'camp':
        for(const [x,y,light,base] of [[4,11,'#d4b97c','#ae8a54'],[48,23,'#c3ac84','#977e5c']]) {
          shape('#2d332b66',[x+5,y+15],[x+36,y+9],[x+44,y+30],[x+12,y+37]);
          shape(ink,[x,y+23],[x+10,y+2],[x+34,y],[x+41,y+23],[x+30,y+32],[x+4,y+30]);
          shape(base,[x+1,y+23],[x+11,y+3],[x+33,y+1],[x+25,y+24],[x+5,y+29]);
          shape(light,[x+11,y+3],[x+32,y+1],[x+30,y+6],[x+9,y+9]);
          shape('#766549',[x+26,y+23],[x+33,y+3],[x+40,y+23],[x+30,y+30]);
          shape(ink,[x+30,y+26],[x+34,y+12],[x+38,y+23]);box(x,y+29,2,4,brass);
        }crate(33,47,12,9);break;
      case 'lander':
        // Four landing legs, detachable side pods and a sloped heat shield.
        for(const x of [10,70])for(const y of [15,64]){
          box(x+3,y+3,10,13,slate);box(x,y+12,16,5,ink);box(x+1,y+12,13,2,steel);
        }
        tank(8,27,18,36);tank(69,27,18,36);
        shape(ink,[23,19],[37,8],[60,8],[74,22],[74,64],[59,78],[35,78],[21,65]);
        shape('#8b958e',[23,22],[37,10],[59,10],[71,23],[71,61],[58,72],[36,72],[23,61]);
        shape('#c8c5ad',[24,23],[39,12],[58,12],[69,24],[63,33],[32,33]);
        shape('#a2ada0',[25,25],[32,35],[32,60],[24,58]);
        shape('#495d5a',[34,35],[62,35],[65,43],[60,49],[35,49],[31,43]);
        shape('#83acaa',[35,36],[60,36],[62,40],[33,40]);
        box(45,35,2,14,ink);box(25,49,7,5,'#b97a52');box(64,49,6,5,'#b97a52');
        vent(39,20,17);hatch(43,60);box(36,76,24,8,slate);
        for(let i=0;i<3;i++)box(37,77+i*3,22,1,steel);
        box(60,8,2,12,slate);box(59,6,4,3,'#d59668');break;
    }
    cache.set(key,image);
    return image;
  }
  return {
    draw(ctx,type,x,y,w,h,night=false) {
      if(!sizes[type]) return;
      const sprite=plate(type,night);
      ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,x,y,w,h);ctx.restore();
    },
    thumbnail(type) {
      if(!sizes[type]) return '';
      if(!thumbnails.has(type)) thumbnails.set(type,plate(type,false).toDataURL());
      return thumbnails.get(type);
    }
  };
})();
