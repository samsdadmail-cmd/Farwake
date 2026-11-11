// Original environmental sounds are synthesized at runtime. Impact resonances and
// plucked strings share short PCM samples; no media download or autoplay needed.
window.FarwakeAudio = (() => {
  'use strict';
  const defaults = Object.freeze({muted:false, music:.34, ambience:.54, effects:.64, interface:.38});
  const settings = {...defaults};
  const channels = {}, clips = new Map(), cooldown = new Map();
  const range = (a,b) => a+Math.random()*(b-a);
  const bounded = (v,a,b) => Math.max(a,Math.min(b,v));
  let ctx, master, wind, rain, insects, machine, nextBird, nextThunder, nextMusic;
  let environment = {minute:440, weather:'clear', paused:false, working:false};
  let lastUpdate=-1, active=false;

  function makeClip(key, seconds, sample) {
    if(clips.has(key)) return clips.get(key);
    const rate=22050, size=Math.ceil(seconds*rate), buffer=ctx.createBuffer(1,size,rate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<size;i++) data[i]=sample(i/rate,i,data);
    clips.set(key,buffer);
    return buffer;
  }
  function noise(key, length, brown=false) {
    let previous=0;
    return makeClip(key,length,(t,i)=>{
      const white=range(-1,1);
      previous=(previous+.065*white)/1.04;
      // Fade both ends of ambient loops to avoid seam clicks.
      return (brown?previous*3:white)*Math.min(1,t*55,(length-t)*55);
    });
  }
  function smooth(node,value,seconds=.12) {
    node.gain.setTargetAtTime(value,ctx.currentTime,seconds);
  }
  function configure(values={}) {
    for(const name of Object.keys(defaults)) {
      if(name==='muted') {
        if(typeof values.muted==='boolean') settings.muted=values.muted;
      } else if(Number.isFinite(values[name])) settings[name]=bounded(values[name],0,1);
    }
    if(ctx && master) {
      smooth(master,settings.muted?0:.78,.018);
      for(const name of Object.keys(channels)) smooth(channels[name],settings[name]**1.4,.035);
    }
  }
  function loop(buffer,frequency,type) {
    const source=ctx.createBufferSource(), eq=ctx.createBiquadFilter(), level=ctx.createGain();
    source.buffer=buffer;source.loop=true;eq.type=type;eq.frequency.value=frequency;
    level.gain.value=0;
    source.connect(eq).connect(level).connect(channels.ambience);source.start();
    return level;
  }
  function init() {
    const Audio=window.AudioContext || window.webkitAudioContext;
    if(!Audio) return false;
    ctx=new Audio();
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-13;limiter.ratio.value=4;
    master=ctx.createGain();master.gain.value=settings.muted?0:.78;
    master.connect(limiter).connect(ctx.destination);
    for(const name of ['music','ambience','effects','interface']) {
      channels[name]=ctx.createGain();channels[name].gain.value=settings[name]**1.4;
      channels[name].connect(master);
    }
    wind=loop(noise('air',4.71,true),890,'lowpass');
    rain=loop(noise('precipitation',3.87),3200,'lowpass');
    const crickets=makeClip('crickets',5.83,(t)=>{
      const cluster=Math.max(0,Math.cos(t*4.3+Math.sin(t*2.4)))**4;
      const wings=Math.max(0,Math.sin(2*Math.PI*(27*t+.3*Math.sin(t*6))))**3;
      return .33*cluster*wings*Math.sin(2*Math.PI*3500*t+1.8*Math.sin(t*51))*Math.min(1,t*12,(5.83-t)*12);
    });
    insects=loop(crickets,4800,'lowpass');
    machine=loop(makeClip('drive',2,t=>.35*Math.sin(t*2*Math.PI*52)+.10*Math.sin(t*2*Math.PI*104)+.05*Math.sin(t*2*Math.PI*312)),480,'lowpass');
    nextBird=ctx.currentTime+6;nextMusic=ctx.currentTime+20;nextThunder=ctx.currentTime+53;
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden && ctx.state==='running') ctx.suspend().catch(()=>{});
      else if(!document.hidden && active && ctx.state!=='running') ctx.resume().catch(()=>{});
    });
    return true;
  }
  // Must be called synchronously from a trusted touch, pointer or key event.
  function unlock() {
    if(settings.muted&&!ctx) return Promise.resolve(false);
    try {
      if(!ctx && !init()) return Promise.resolve(false);
      active=true;
      if(ctx.state==='running')return Promise.resolve(true);
      return ctx.resume().then(()=>ctx.state==='running',()=>false);
    }catch {return Promise.resolve(false)}
  }
  function emit(buffer, channel, volume, pan=0, when=ctx.currentTime, pitch=1) {
    const source=ctx.createBufferSource(), level=ctx.createGain();
    source.buffer=buffer;source.playbackRate.value=pitch;
    level.gain.value=volume;source.connect(level);
    const stereo=ctx.createStereoPanner?.();
    if(stereo){stereo.pan.value=bounded(pan,-1,1);level.connect(stereo).connect(channels[channel])}
    else level.connect(channels[channel]);
    source.onended=()=>{source.disconnect();level.disconnect();stereo?.disconnect()};
    source.start(when);
  }
  // Sampled impulses combine an initial noise transient and inharmonic modes.
  function impact(key, freqs, decay, grit) {
    let last=0;
    return makeClip(key,decay*6+.02,t=>{
      last=last*.52+range(-1,1)*.48;
      let v=0;
      for(let n=0;n<freqs.length;n++)
        v+=Math.sin(2*Math.PI*freqs[n]*t)*Math.exp(-t*(1+n*.38)/decay)/(2+n);
      return (v+last*grit*Math.exp(-t/(decay*.52)))*Math.min(1,t*900)*.77;
    });
  }
  function rustle(key,duration,metal=false) {
    let prev=0;
    return makeClip(key,duration,t=>{
      prev=.8*prev+.2*range(-1,1);
      const q=t/duration,envelope=Math.sin(Math.PI*q)**.8;
      const slide=metal?Math.sin(2*Math.PI*(66*t+72*t*t))*.18:Math.sin(2*Math.PI*(120*t+48*t*t))*.13;
      return envelope*(prev*(.7+.3*Math.sin(t*52))+slide)+.2*Math.sin(t*760)*Math.exp(-Math.abs(q-.89)*85);
    });
  }
  function pluck(midi) {
    const frequency=440*2**((midi-69)/12);
    const delay=Math.round(22050/frequency);
    return makeClip('string'+midi,3.3,(t,i,data)=>{
      if(i<delay)return range(-.57,.57)*Math.sin(Math.PI*(i+.5)/delay);
      const ring=.496*(data[i-delay]+data[i-delay+1]);
      return ring*Math.min(1,(3.3-t)*8);
    });
  }
  function phrase(now,night) {
    // An open fifth under a small asymmetric melody. Leave a long rest
    // between phrases and alternate voicings with the time of day.
    const root=night?50:55;
    const offsets=Math.random()<.5?[0,7,14,16,9,7]:[0,7,12,9,16,14];
    const beats=[0,.13,1.54,2.71,4.65,6.3];
    offsets.forEach((note,i)=>{
      const buf=pluck(root+note),when=now+beats[i]*range(.96,1.04);
      emit(buf,'music',i<2?.63:.46,i%2?.28:-.24,when);
      emit(buf,'music',.12,i%2?-.45:.48,when+.19,.998);
    });
  }
  function bird(now) {
    const pan=range(-.72,.72),pitch=range(.86,1.14);
    const buffer=makeClip('bird',.26,t=>Math.sin(2*Math.PI*(1680*t+2200*t*t-4200*t*t*t))*
      Math.sin(Math.PI*t/.26)**2*.42);
    emit(buffer,'ambience',.14,pan,now,pitch);
    emit(buffer,'ambience',.10,pan,now+.28,pitch*1.12);
  }
  function play(kind, opts={}) {
    if(!ctx||ctx.state!=='running'||settings.muted||document.hidden)return;
    const channel=kind==='ui'?'interface':kind==='thunder'?'ambience':'effects';
    if(!settings[channel])return;
    const now=ctx.currentTime,pan=Number.isFinite(opts.pan)?opts.pan:0;
    const density={step:.12,ui:.07,build:.18,chop:.22,mine:.2,open:.27,close:.24,thunder:8};
    if(now<(cooldown.get(kind)??-1))return;
    cooldown.set(kind,now+(density[kind]||.14));
    let sample,vol=.5;
    switch(kind){
      case 'step':{
        const hard=['stone','path','rock','bedrock'].includes(opts.surface);
        sample=hard?impact('sole-stone',[164,437],.027,1.3):rustle('sole-grass',.105);
        vol=hard?.25:.42;break;
      }
      case 'open':case 'close':{
        const metal=!!opts.industrial,close=kind==='close';
        sample=rustle('door'+metal+close,metal?.38:close?.18:.31,metal);vol=.72;break;
      }
      case 'chop':sample=impact('axe',[138,273,546],.068,1.1);break;
      case 'mine':sample=impact('pick',[434,1213,2555],.16,.85);vol=.37;break;
      case 'build':sample=impact('hammer',[214,640,1391],.095,.85);break;
      case 'drop':sample=impact('crate',[75,143,312],.09,1.4);vol=.72;break;
      case 'pickup':sample=rustle('lift',.16);vol=.63;break;
      case 'farm':sample=rustle('soil',.24);vol=.66;break;
      case 'ui':sample=impact('switch',[638,182],.014,.55);vol=.28;break;
      case 'complete':sample=pluck(67);vol=.52;break;
      case 'thunder':{
        let prev=0;
        sample=makeClip('thunder',2.7,t=>{
          prev=.97*prev+.03*range(-1,1);
          return 2.5*prev*(.65+.35*Math.sin(t*9))*Math.min(1,t*4)*Math.exp(-t*.96);
        });vol=.89;break;
      }
      default:return;
    }
    emit(sample,channel,vol*bounded(opts.level??1,0,1),pan,now,range(.91,1.08));
  }
  function update(state={}) {
    if(!ctx||ctx.state!=='running'||document.hidden)return;
    const now=ctx.currentTime;
    if(now-lastUpdate<.28)return;
    lastUpdate=now;environment={...environment,...state};
    const {minute,weather,working,paused}=environment;
    const night=minute<360||minute>1110, wet=weather==='rain'||weather==='storm';
    const breeze=.78+.22*Math.sin(now*.19+.9*Math.sin(now*.071));
    smooth(wind,breeze*(weather==='wind'?.27:wet?.18:.075),1.1);
    smooth(rain,wet?.105:0,1.45);
    smooth(insects,night&&!wet?.13:0,1.8);
    smooth(machine,working&&!paused?.09:0,.4);
    if(now>=nextBird){
      nextBird=now+range(12,30);
      if(!settings.muted&&settings.ambience&&!wet&&!night)bird(now);
    }
    if(now>=nextThunder){
      nextThunder=now+range(32,68);
      if(wet&&(weather==='storm'||Math.random()<.25))play('thunder');
    }
    if(now>=nextMusic){
      nextMusic=now+range(41,89);
      if(!settings.muted&&settings.music&&!paused)phrase(now,night);
    }
  }
  return {defaults,unlock,configure,update,play,get status(){return ctx?.state||'locked'}};
})();
