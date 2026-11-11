// node tests/housing.cjs
const vm=require('node:vm'), fs=require('node:fs'), assert=require('node:assert/strict');
const context=vm.createContext({finished:()=>[],power:()=>({supply:4,used:0}),window:{},document:{addEventListener(){}},save(){},clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
const read=file=>fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8');
for(const file of ['buildings.js','doors.js']){vm.runInContext(read(file),context);Object.assign(context,context.window)}
vm.runInContext(read('housing.inc.js'),context);
const {FarwakeBuildings:art,FarwakeDoors:doors}=context;
const types=['shelter','workshop','camp','shed','clinic','lander','supplies','garden','solar','path','comms','battery','ore','tree','stockpile'];
for(const type of types){
 const b={id:1,type,finished:true,x:10,y:10,w:3,h:2};
 const inside=['shelter','workshop','camp','shed','clinic','lander'].includes(type);
 assert.equal(!!art.entrance(b),inside,type);
 const task={type:({shelter:'rest',workshop:'craft',camp:'rest',shed:'haul_dropoff',clinic:'treat',lander:'research'})[type]||'haul_dropoff',id:1,x:10,y:10};
 const p={x:11.5,y:14.5,path:[],carry:{kind:'wood',amount:6}};
 const planned=doors.route(p,task,[b],()=>true,()=>[{x:11.5,y:12.5}],[]);
 assert.equal(!!planned,inside,type+' route');
 if(!inside)continue;
 doors.assigned(p,task,planned);p.task=task;p.path=planned;
 const v=p.visit;p.x=v.x;p.y=v.y;p.path=[{portal:true}];
 doors.update({buildings:[b],colonists:[p]},.3);
 assert.ok(doors.state(b).openness>0);
 p.path=[];doors.update({buildings:[b],colonists:[p]},.6);
 assert.equal(doors.occupants({colonists:[p]},b).length,1);
 assert.equal(doors.state(b).openness,0);
 const leave={type:'survey',x:2,y:2};
 const exiting=doors.route(p,leave,[b],()=>true,()=>[{x:2.5,y:2.5}],[{x:2,y:2}]);
 doors.assigned(p,leave,exiting);p.task=leave;p.path=exiting;
 doors.update({buildings:[b],colonists:[p]},.2);
 assert.equal(p.visit.stage,'leaving');
}
const pallet={type:'supplies',id:2,x:30,y:26,w:2,h:2,finished:true};
const p={id:1,x:30.8,y:27.5,carry:{kind:'wood',amount:6},visit:{building:2,stage:'inside'},indoorStay:{building:2,job:'haul_dropoff'}};
doors.restore(p,[pallet],(x,y)=>y===28);assert.equal(p.y,28.5);assert.equal(doors.resume(p,[pallet]),false);assert.equal(p.carry.amount,6);
const home={type:'shelter',id:7,x:1,y:3,w:3,h:2,finished:true};
const camp={...home,id:3,type:'camp'};
context.S={buildings:[camp,home],colonists:Array.from({length:9},(_,i)=>({id:i+1,home:null,x:2.5,y:3.5,energy:0,mood:50}))};
context.housingAllocate();
assert.deepEqual({...context.housingCounts()},{permanent:3,camp:5,unhoused:1,beds:3,totalBeds:8});
assert.equal(context.housingAssign(4,7),false);assert.equal(context.housingAssign(4,7,1),true);
assert.equal(context.S.colonists[0].home,3);assert.equal(context.S.colonists[3].home,7);
home.editOrder={kind:'demolish'};context.housingRelease(home);context.housingAllocate();assert.equal(context.housingCounts().unhoused,4);
const unsecured=context.S.colonists.find(c=>!c.home);
assert.ok(context.housingRestTarget(unsecured).outdoors);
context.housingRecovery(unsecured,1);assert.equal(unsecured.energy,2.1);assert.ok(unsecured.mood<50);
console.log('15 structure classifications, shared indoor routing, pallet cargo migration, capacity, swaps, decommissioning and outdoor recovery passed.');
