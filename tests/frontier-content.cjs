const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=require('node:path').join(__dirname,'..'),read=p=>fs.readFileSync(root+'/'+p,'utf8'),source=read('src/game.html');
const literal=(text,name)=>text.match(new RegExp('const '+name+'= ?([\\s\\S]*?);'))[1];
const context=vm.createContext({document:{addEventListener(){}},guideEntries:[],GROUP_FOR:{},CATALOG_GROUPS:[]});
for(const name of ['TYPES','TECHS','MATERIALS'])vm.runInContext('var '+name+'='+literal(source,name),context);
vm.runInContext('var fieldResearch='+literal(read('survey.inc.js'),'fieldResearch'),context);
vm.runInContext('var INDUSTRY_RECIPES='+read('industry.inc.js').match(/const INDUSTRY_RECIPES = ([\s\S]*?\n});/)[1],context);
vm.runInContext(read('frontier.inc.js'),context);
const data=vm.runInContext('({types:TYPES,materials:MATERIALS,techs:{...TECHS,...fieldResearch,...FRONTIER_TECH},recipes:FRONTIER_RECIPES,oldRecipes:INDUSTRY_RECIPES})',context);
const state=new Map();function visit(id){assert.ok(data.techs[id],'known prerequisite '+id);assert.notEqual(state.get(id),1,'technology cycle at '+id);if(state.get(id)===2)return;state.set(id,1);const p=data.techs[id].requires;for(const k of Array.isArray(p)?p:p?[p]:[])visit(k);state.set(id,2)}
Object.keys(data.techs).forEach(visit);
for(const [id,t] of Object.entries(data.types)){if(t.tech)assert.ok(data.techs[t.tech],id+' unlock exists');for(const [k,n] of Object.entries(t.cost)){assert.ok(data.materials[k],id+' material exists');assert.ok(Number.isFinite(n)&&n>0)}}
const reachable=new Set(['wood','ore','scrap','food','relic']);let changed=true;
while(changed){changed=false;for(const r of [...Object.values(data.recipes),...Object.values(data.oldRecipes).map(r=>({...r,output:{alloy:r.yield}}))])if(Object.keys(r.cost).every(k=>reachable.has(k)))for(const k of Object.keys(r.output))if(!reachable.has(k)){reachable.add(k);changed=true}}
for(const k of Object.keys(data.materials))assert.ok(reachable.has(k),'reachable physical material '+k);
for(const [id,r] of Object.entries(data.recipes)){assert.ok(data.types[r.facility],id+' real facility');for(const k of [...Object.keys(r.cost),...Object.keys(r.output)])assert.ok(data.materials[k],id+' known material '+k)}
JSON.parse(read('manifest.webmanifest'));const policy=JSON.parse(read('vercel.json'));assert.equal(policy.git.deploymentEnabled['beyond-the-frontier-rc'],false);
for(const [,path] of source.matchAll(/<script src="([^"]+)"/g))assert.ok(fs.existsSync(root+'/'+path),'script asset '+path);
cp.execFileSync('python3',['build.py','--check'],{cwd:root,stdio:'inherit'});
console.log(Object.keys(data.techs).length+' technologies: no prerequisite cycles or missing unlocks; all physical materials reachable; assets, manifest and deployment hold valid.');
