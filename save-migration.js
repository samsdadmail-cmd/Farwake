// Upgrade only after an exact, independently downloadable recovery copy exists.
// This module is deliberately independent of rendering and colony simulation.
(function(root){
 'use strict';
 function recoveryKey(key,raw){let h=2166136261;for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);return key+'_before_v4_'+(h>>>0).toString(16)}
 function prepare(raw,storage,key){
  const state=JSON.parse(raw);
  if(state.v===4)return state;
  if(state.v!==3)throw Error('Unsupported expedition version');
  const backup=recoveryKey(key,raw),existing=storage.getItem(backup);
  if(existing!==null&&existing!==raw)throw Error('Recovery copy conflict; original expedition was not changed');
  if(existing===null)storage.setItem(backup,raw);
  if(storage.getItem(backup)!==raw)throw Error('Could not verify recovery copy; original expedition was not changed');
  state.v=4;state.migration={from:3,recoveryKey:backup};return state;
 }
 function validLife(state){
  const finite=n=>Number.isFinite(n)&&n>=0,rows=(a,n)=>Array.isArray(a)&&a.length<=n;
  const life=state.life;
  if(life!=null&&(!life||life.version!==1||!finite(life.time)||!finite(life.serial)||!rows(life.sessions,50)))return false;
  if(life?.sessions.some(s=>!s||!finite(s.id)||!finite(s.day)||!finite(s.building)||!finite(s.progress)||!finite(s.expires)||!rows(s.people,2)||s.people.length!==2||new Set(s.people).size!==2||!rows(s.points,2)||s.points.length!==2||s.points.some(p=>!p||!finite(p.x)||!finite(p.y))))return false;
  if(life?.cue&&(!finite(life.cue.serial)||!finite(life.cue.person)||!finite(life.cue.until)||typeof life.cue.text!=='string'||life.cue.text.length>240))return false;
  return state.colonists.every(p=>{
   const l=p.life;if(l==null)return true;
   return l.owner===p.id&&finite(l.owner)&&['company','home','quiet','doneDay','retryAt'].every(k=>finite(l[k]))&&
    ['conversation','tinkering','plants','sky'].includes(l.interest)&&rows(l.memories,8)&&rows(l.places,4)&&rows(l.bonds,8)&&
    l.memories.every(m=>m&&typeof m.key==='string'&&typeof m.text==='string'&&m.text.length<=500&&finite(m.day)&&finite(m.minute)&&finite(m.count))&&
    l.places.every(q=>q&&finite(q.building)&&finite(q.fondness)&&finite(q.lastDay))&&
    l.bonds.every(q=>q&&finite(q.person)&&finite(q.shared)&&finite(q.lastDay));
  });
 }
 const api={prepare,recoveryKey,validLife};
 if(typeof module==='object')module.exports=api;else root.FarwakeSaveMigration=api;
})(typeof window==='object'?window:globalThis);
