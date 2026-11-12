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
 const api={prepare,recoveryKey};
 if(typeof module==='object')module.exports=api;else root.FarwakeSaveMigration=api;
})(typeof window==='object'?window:globalThis);
