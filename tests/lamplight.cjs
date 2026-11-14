const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const state=JSON.parse(fs.readFileSync('tests/fixtures/home-composition-day58.json','utf8'));
const canvas=()=>({width:0,height:0,getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})})});
let door={occupied:0,actions:[],openness:0};
const sandbox={window:{},document:{createElement:canvas},FarwakeDoors:{state:()=>door},FarwakeBuildings:{entrance:()=>({x:40,y:40,w:10,h:14})},FarwakeHearth:{history(){}}};
vm.runInNewContext(fs.readFileSync('lamplight.js','utf8'),sandbox);const l=sandbox.window.FarwakeLamplight,b=state.buildings.find(b=>b.id===state.colonists[0].home),c=canvas().getContext();
function check(minute,occupied,actions,grid,mode){state.minute=minute;door={occupied,actions,openness:.5};const before=JSON.stringify(state);l.prepare(state,grid);assert.equal(l.diagnostics().mode,mode);assert.equal(l.matches(b),true);assert.equal(l.matches({...b,id:999}),false);l.draw(c,b,door);l.shadow(c,b,minute);l.screenLight(c,{z:2},x=>x,y=>y);assert.equal(JSON.stringify(state),before,'presentation must never mutate saves');}
const on={supply:51,used:51},off={supply:50,used:51};
check(700,1,['life_home'],on,'daylight');check(1150,0,[],on,'empty');check(1150,1,['life_home'],off,'unpowered');check(1150,1,['rest'],on,'sleeping');assert.equal(l.diagnostics().strength,.24);check(1150,2,['rest','life_home'],on,'awake');assert.equal(l.diagnostics().strength,1);
check(360,1,['rest'],on,'daylight');check(1140,1,['life_home'],on,'daylight');check(359,1,['rest'],on,'sleeping');
const map=Array.from({length:80*80},()=>({kind:'water'}));l.ground(c,b,map,80,80);assert.equal(map.every(t=>t.kind==='water'),true);
for(let i=0;i<1000;i++)check(i%2?700:1200,1,['life_home'],on,i%2?'daylight':'awake');assert.equal(l.diagnostics().plates,5,'cache is bounded by style and lighting state');
b.finished=false;l.prepare(state,on);assert.equal(l.matches(b),false);assert.equal(l.draw(c,b,door),false);
console.log('Lamplight: real address, clock/power/occupancy, mixed sleeping, no save mutation, bounded cache PASS');
