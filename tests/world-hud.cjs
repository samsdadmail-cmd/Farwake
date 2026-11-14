const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=Object.fromEntries(['world-moment','world-speaker','world-words'].map(id=>[id,{hidden:true,textContent:''}]));let writes=0;
for(const id of ['world-speaker','world-words']){let value='';Object.defineProperty(nodes[id],'textContent',{get(){return value},set(v){writes++;value=v}})}
const sandbox={window:{},document:{getElementById:id=>nodes[id]}};vm.runInNewContext(fs.readFileSync('world-hud.js','utf8'),sandbox);
const c=new Proxy({},{get:(_,k)=>()=>{}}),state={colonists:[{id:1,name:'Aya Mercer',x:4,y:6,moments:[{text:'Existing memory'}]}]},before=JSON.stringify(state),active={id:1,text:'<A real saved line>',until:10};
const draw=(a=active,elapsed=7,sx=x=>x)=>sandbox.window.FarwakeHUD.moment(c,state,390,844,sx,y=>y,1,a,null,elapsed);
draw();assert.equal(nodes['world-moment'].hidden,false);assert.equal(nodes['world-speaker'].textContent,'Aya Mercer');assert.equal(nodes['world-words'].textContent,active.text);
for(let i=0;i<120;i++)draw();assert.equal(writes,2,'Unchanged dialogue must not repeatedly mutate the live region');
draw(null);assert.equal(nodes['world-moment'].hidden,true);draw(active,11);assert.equal(nodes['world-moment'].hidden,true);draw(active,7,()=>-99);assert.equal(nodes['world-moment'].hidden,true);draw({id:404,text:'Unknown',until:20});assert.equal(nodes['world-moment'].hidden,true);
assert.equal(JSON.stringify(state),before,'Rendering must preserve residents and memories');console.log('Field caption: genuine speaker/text, bounded live-region writes, hidden expired/offscreen speech and immutable resident memories PASS');
