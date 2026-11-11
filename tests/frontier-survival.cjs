// Bounded behavior test of the real targeting, crop-cycle and eating functions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..'),read=p=>fs.readFileSync(root+'/'+p,'utf8');
const source=read('src/game.html'),literal=(text,name)=>text.match(new RegExp('const '+name+'= ?([\\s\\S]*?);'))[1];
const c=vm.createContext({document:{addEventListener(){}},guideEntries:[],GROUP_FOR:{},CATALOG_GROUPS:[]});
for(const name of ['TYPES','TECHS','MATERIALS'])vm.runInContext('var '+name+'='+literal(source,name),c);
vm.runInContext('var fieldResearch='+literal(read('survey.inc.js'),'fieldResearch'),c);
vm.runInContext(read('industry.inc.js'),c);vm.runInContext(read('frontier.inc.js'),c);
vm.runInContext(source.slice(source.indexOf('function getTarget(p)'),source.indexOf('\nfunction doTask(p')),c);
Object.assign(c,{
 looseTotal:k=>c.S.piles.filter(p=>p.kind===k&&p.site==null).reduce((n,p)=>n+p.amount,0),
 transitTotal:k=>c.S.colonists.reduce((n,p)=>n+(p.carry?.kind===k?p.carry.amount:0),0),
 nearFeature:()=>c.bushes,storageBuildings:()=>[],power:()=>({supply:10,used:0}),
 setTask(p,t){if(t.x===99)return false;p.task=t;p.path=[];return true},
 freightOutput(kind,amount,b){c.S.piles.push({id:'crop',kind,amount,x:b.x,y:b.y})},
 pileById:id=>c.S.piles.find(p=>p.id===id),freightFlow(){},clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),
 freightSpend(cost){for(const [k,n] of Object.entries(cost))if((c.S.resources[k]||0)<n)return false;for(const [k,n] of Object.entries(cost))c.S.resources[k]-=n;return true}
});
const p={id:1,work:'survey',role:'Surveyor',hunger:100,energy:90,mood:10,x:2,y:2,path:[]};
const bed={id:2,type:'garden',finished:true,x:3,y:3,production:{stage:'plant',elapsed:0,cycles:0,output:0}};
c.S={minute:720,resources:{food:0,meals:0},piles:[],colonists:[p],buildings:[bed],research:[],industry:{targets:{food:0}}};c.bushes=[];
assert.equal(c.industryFoodEmergency(),true);assert.equal(c.industryTarget('food'),2);
// An otherwise non-farming founder performs actual crop work when no food exists.
let task=c.frontierMealTarget(p);assert.equal(task.type,'farm');
c.performProduction(p,task,4);assert.equal(bed.production.stage,'germinate');
c.advanceCrops(15);assert.equal(bed.production.stage,'tend');
task=c.frontierMealTarget(p);c.performProduction(p,task,3);assert.equal(bed.production.stage,'grow');
c.advanceCrops(22);assert.equal(bed.production.stage,'harvest');
task=c.frontierMealTarget(p);c.performProduction(p,task,5);
assert.equal(c.S.piles[0].amount,2);assert.equal(bed.production.ripe,5);assert.equal(c.S.industry.targets.food,0);
assert.equal(c.industryFoodEmergency(),false);assert.equal(c.productionBlock(bed),'Colony stock target reached');
task=c.frontierMealTarget(p);assert.equal(task.pileId,'crop');c.frontierEat(p);
assert.equal(p.hunger,30);assert.equal(c.S.piles[0].amount,1);assert.equal(bed.production.output,2);
// Reserved construction/crafting material is never treated as a free meal.
c.S.piles=[{id:'reserved',kind:'food',amount:4,site:7}];p.hunger=100;
bed.production.paused=true;c.bushes=[{id:'unreachable',x:99,y:1},{id:'fruit',x:5,y:5}];
task=c.frontierMealTarget(p);assert.equal(task.type,'forage');assert.equal(task.feature,'fruit');
c.S.colonists.push({id:3,hunger:90,task:{type:'forage',feature:'fruit'}});
assert.equal(c.frontierMealTarget(p),null); // No duplicate bush claim or paused-farm override.
c.bushes=[];bed.production.paused=false;bed.production.worker=3;
assert.equal(c.frontierMealTarget(p),null); // Explicit worker allocation remains authoritative.
// No obtainable meal must allow normal hauling/work, not assign futile eating forever.
Object.assign(c,{jobs:()=>[],frontierCommunityTarget:()=>null,editorCandidate:()=>null,freightPlan:()=>({type:'haul_pickup',pileId:'delivery'}),harvestTaskFor:()=>null,workWeight:(p,k)=>k==='haul'?1:0});
assert.equal(c.getTarget(p).type,'haul_pickup');
assert.equal(c.S.resources.food,0);assert.equal(c.S.piles[0].amount,4);
console.log('PASS: zero-target famine -> real crop stages -> physical harvest -> consumption; finite forage, reachability, reserved food, pauses, assignments and hauling fallback. Navigation and freight output placement isolated.');
