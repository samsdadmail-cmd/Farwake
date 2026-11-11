async function verifyFrontierGeology(frame,out){
 frame.src='candidate/index.html?slot=geology-'+Date.now();await new Promise(r=>frame.onload=r);
 const w=frame.contentWindow,g=w.FARWAKE_TEST,qa=w.QA,lines=[];
 const ok=(v,label)=>{if(!v)throw Error(label);lines.push('PASS '+label);out.textContent=lines.join('\n')};
 try{
 for(const seed of ['FW-10402','KYLE','NORTH-77','DEEP-5','HOME']){
  qa.initial(seed);let s=g.state;
  const deposits=g.features.filter(f=>f.id.startsWith('frontier-ore-'));
  ok(deposits.length===16&&deposits.reduce((n,f)=>n+f.amount,0)===144,'finite surface geology exists for '+seed);
  const signature=JSON.stringify(s.frontier.surfaceDeposits);
  g.save();g.load();s=g.state;
  ok(JSON.stringify(s.frontier.surfaceDeposits)===signature&&g.features.filter(f=>f.id.startsWith('frontier-ore-')).length===16,'same finite geology restores without duplication '+seed);
  Object.keys(g.industryPolicy().targets).forEach(k=>g.industryPolicy().targets[k]=0);
  const ore=g.features.find(f=>f.id.startsWith('frontier-ore-'));
  qa.fog[ore.y*56+ore.x]=true;g.designateFeature(ore.id);
  const total=()=> (g.state.resources.ore||0)+g.state.piles.filter(q=>q.kind==='ore').reduce((n,q)=>n+q.amount,0)+g.state.colonists.reduce((n,p)=>n+(p.carry?.kind==='ore'?p.carry.amount:0),0);
  const before=total();
  for(let n=0;n<9000&&g.features.some(f=>f.id===ore.id);n++)g.tick(.1);
  ok(!g.features.some(f=>f.id===ore.id)&&total()===before+9,'real mining yields exactly nine physical ore '+seed);
  g.save();g.load();ok(!g.features.some(f=>f.id===ore.id)&&total()===before+9,'mined deposit stays exhausted and ore conserved after load '+seed);
 }
 out.textContent=lines.concat('COMPLETE').join('\n');
 }catch(e){out.textContent=lines.concat('FAILED '+e.stack).join('\n')}
}
