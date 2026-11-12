const assert=require('node:assert/strict'),fs=require('node:fs');
const {prepare,recoveryKey}=require('../save-migration.js');
const key='isolated-qa';
const entries=new Map(),storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
for(const name of ['fresh','mid','late']){
 const manifest=JSON.parse(fs.readFileSync('tests/fixtures/saves/manifest.json'));
 const raw=fs.readFileSync('tests/fixtures/saves/'+manifest.fixtures[name].file,'utf8').trim();
 storage.setItem(key,raw);
 const before=JSON.parse(raw),after=prepare(raw,storage,key);
 assert.equal(storage.getItem(key),raw);assert.equal(storage.getItem(recoveryKey(key,raw)),raw);
 assert.equal(after.v,4);delete after.v;delete after.migration;delete before.v;
 assert.deepEqual(after,before,'migration must conserve the entire legacy colony');
 const upgraded=prepare(raw,storage,key),count=entries.size;
 assert.deepEqual(prepare(JSON.stringify(upgraded),storage,key),upgraded);assert.equal(entries.size,count);
}
const raw=JSON.stringify({v:3,seed:'quota',resources:{ore:7}});
assert.throws(()=>prepare(raw,{getItem:()=>null,setItem:()=>{throw Error('quota')}},key),/quota/);
assert.throws(()=>prepare(raw,{getItem:()=> 'different',setItem:()=>assert.fail('overwrite')},key),/conflict/);
assert.throws(()=>prepare('{',storage,key));assert.throws(()=>prepare('{"v":5}',storage,key));
console.log('Living Colony migration: legacy fixtures conserved, exact recovery copies, idempotence and failure safety PASS');
