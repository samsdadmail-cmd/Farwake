// Device preferences are shared across expeditions on this origin.
window.FieldPreferences=(()=>{
 const key='farwake_living_preferences', motion=matchMedia('(prefers-reduced-motion: reduce)');
 const choices={preset:['performance','balanced','cinematic'],dialogue:['off','subtle','lively']};
 const mix=['music','ambience','effects','interface'];
 const values={...FarwakeAudio.defaults,preset:'balanced',dialogue:'subtle'};
 function accept(name,value){
   if(choices[name]?.includes(value))values[name]=value;
   else if(mix.includes(name)&&Number.isFinite(+value))values[name]=Math.min(1,Math.max(0,+value));
   else if(name==='muted'&&typeof value==='boolean')values.muted=value;
 }
 try{for(const [k,v] of Object.entries(JSON.parse(localStorage.getItem(key))||{}))accept(k,v)}catch{}
 function apply(){FarwakeAudio.configure(values);FarwakeLandscape.configure(values.preset,motion.matches)}
 apply();motion.addEventListener('change',apply);
 function change(k,v){accept(k,v);apply();try{localStorage.setItem(key,JSON.stringify(values))}catch{}}
 function panel(){
   const cap=s=>s[0].toUpperCase()+s.slice(1);
   const options=(k,label)=>'<fieldset><legend>'+label+'</legend>'+choices[k].map(v=>'<button class="pill" data-pref="'+k+'" value="'+v+'" aria-pressed="'+(values[k]===v)+'">'+cap(v)+'</button>').join(' ')+'</fieldset>';
   return '<div class="preferences">'+options('preset','Visual detail')+options('dialogue','Colony dialogue')+'<fieldset><legend>Sound mix</legend><button class="secondary" data-pref="muted" aria-pressed="'+values.muted+'">'+(values.muted?'Unmute sound':'Mute sound')+'</button>'+mix.map(k=>'<label>'+cap(k)+'<input data-volume="'+k+'" type="range" min="0" max="100" value="'+Math.round(values[k]*100)+'"></label>').join('')+'</fieldset></div>';
 }
 return {values,change,panel,get reduced(){return motion.matches}};
})();
