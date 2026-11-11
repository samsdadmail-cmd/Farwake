// Short-lived presentation events. All positions arrive from actual completed or advancing jobs.
window.FarwakeWorkFX=(()=>{
  const events=[];
  const tones={tree:['#c49b62','#e1bd83'],ore:['#a1a8a2','#beb9a7'],build:['#f0c582','#baa88c'],
    farm:['#76805a','#9eaa6d'],scrap:['#a9a490','#ccaa82']};
  let reduced=false;
  function add(type,x,y,length,extra={}){
    if(events.length>=54)events.shift();
    events.push({type,x,y,length,age:0,...extra});
  }
  function strike(kind,x,y,id,person){
    add('impact',x,y,.3,{kind,id,person});
  }
  function finished(feature,person){
    if(feature.type==='tree'){
      add('fall',feature.x+.5,feature.y+.84,.86,{feature,side:person.x<feature.x+.5?1:-1});
    }else strike(feature.type,feature.x+.5,feature.y+.65,feature.id,person.id);
  }
  function transfer(kind,person,material){
    add(kind,person.x,person.y,.46,{material:material?.kind||material});
  }
  function complete(building){
    add('complete',building.x,building.y,.7,{w:building.w,h:building.h});
  }
  function advance(dt,paused,speed,reduce){
    reduced=!!reduce;
    if(paused)return;
    for(let i=events.length-1;i>=0;i--){
      const e=events[i];e.age+=dt*Math.min(2,speed||1);
      if(e.age>=e.length)events.splice(i,1);
    }
  }
  function feature(ctx,f,time,minute){
    const hit=events.find(e=>e.type==='impact'&&e.id===f.id);
    if(!hit||reduced){window.FarwakeLandscape.feature(ctx,f,time,minute);return}
    const x=f.x*32+16,y=f.y*32+27,phase=hit.age/hit.length;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(phase*10)*(1-phase)*.06);
    ctx.translate(-x,-y);window.FarwakeLandscape.feature(ctx,f,time,minute);ctx.restore();
  }
  function draw(ctx,time,minute,left,top,right,bottom){
    for(const e of events){
      if(e.x<left-2||e.y<top-2||e.x>right+2||e.y>bottom+2)continue;
      const t=Math.min(1,e.age/e.length);
      ctx.save();ctx.translate(e.x*32,e.y*32);
      if(e.type==='fall'){
        ctx.rotate(reduced?0:e.side*t*t*1.4);ctx.globalAlpha*=Math.min(1,(1-t)*3);
        ctx.translate(-e.x*32,-e.y*32);window.FarwakeLandscape.feature(ctx,e.feature,time,minute);
      }else if(e.type==='complete'){
        ctx.globalAlpha*=1-t;ctx.strokeStyle='#eac493';ctx.lineWidth=2;
        const inset=3-t*3;
        ctx.strokeRect(inset,inset,e.w*32-2*inset,e.h*32-2*inset);
      }else if(e.type==='impact'){
        if(!reduced){
          const palette=tones[e.kind]||tones.scrap,angle=e.person*.7;
          ctx.globalAlpha*=1-t;
          for(let i=0;i<5;i++){
            ctx.fillStyle=palette[i%2];ctx.fillRect(Math.sin(i*2.6+angle)*12*t,-4-(6+i)*4*t*(1-t)+t*5,2,1.5);
          }
        }
      }else{
        ctx.globalAlpha*=(1-t)*.8;ctx.strokeStyle=e.type==='pickup'?'#d7b988':'#a9c1a1';
        ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,3,5+t*8,2+t*3,0,0,2*Math.PI);ctx.stroke();
      }
      ctx.restore();
    }
  }
  return {advance,strike,finished,transfer,complete,feature,draw,reset(){events.length=0}};
})();
