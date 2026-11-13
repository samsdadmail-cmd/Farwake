const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('home-resident.js','utf8'),sandbox);const r=sandbox.window.FarwakeHomeResident;
const b={id:7,type:'shelter',finished:true},p={id:1,name:'Aya Mercer',role:'Commander',coat:'#ecb872',hair:'#302c37',hue:'#ffc79e',home:7,path:[],action:.1,task:{type:'life_home',id:7},visit:{building:7,stage:'inside',job:'life_home'}},s={v:4,day:58,colonists:[p]};
const life=()=>({kind:'reading',phase:p.action<3?'settling':'active',building:7});
const before=JSON.stringify(s);assert.equal(r.plan(s,b,life).pose,'standing');assert.equal(JSON.stringify(s),before,'view must not mutate saves');
p.action=1;assert.equal(r.plan(s,b,life).pose,'walking');p.action=4;assert.equal(r.plan(s,b,life).pose,'seated');
for(const stage of ['approach','entering','leaving']){p.visit.stage=stage;assert.equal(r.plan(s,b,life),null,'never depict unreached furniture')};p.visit.stage='inside';
p.path=[{x:1,y:1}];assert.equal(r.plan(s,b,life),null);p.path=[];
p.home=8;assert.equal(r.plan(s,b,life),null);p.home=7;
p.task={type:'rest',id:7};assert.equal(r.plan(s,b,life),null,'stale visit job cannot manufacture attendance');p.visit.job='rest';
p.action=.5;assert.equal(r.plan(s,b,life).pose,'standing');p.action=1.01;assert.equal(r.plan(s,b,life).pose,'sleeping');
p.task={type:'build',id:7};p.visit.job='build';assert.equal(r.plan(s,b,life),null,'interruptions cannot leave a sleeping ghost');
p.task={type:'life_home',id:7};p.visit.job='life_home';p.action=4;assert.equal(r.plan(s,b,()=>({kind:'conversation',phase:'active',building:7})),null);
for(const [key,value] of [['id',2],['name','Another resident'],['coat','#ffffff'],['hair','#ffffff'],['hue','#ffffff']]){const old=p[key];p[key]=value;assert.equal(r.plan(s,b,life),null,'never impersonate another identity');p[key]=old}
assert.equal(r.plan(s,{...b,finished:false},life),null);assert.equal(r.plan(s,{...b,type:'cabin'},life),null);
console.log('Aya identity, real attendance, activity phases, immediate interruption and read-only save state PASS');
